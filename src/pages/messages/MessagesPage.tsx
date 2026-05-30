import * as React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Loader2, Paperclip, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { initials } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  listChannels,
  listChannelMessages,
  listIncomingFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  type ChannelItem,
  type ChannelMessage,
  type FriendRequestItem,
} from "@/lib/api/social";
import { ChatSocket } from "@/lib/api/chatSocket";
import { getGrantStatus } from "@/lib/api/auth";

type SocketStatus = "connecting" | "connected" | "disconnected" | "error";

export function MessagesPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [channels, setChannels] = React.useState<ChannelItem[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(
    params.get("channel") ?? null,
  );
  const [tab, setTab] = React.useState("patients");
  const [search, setSearch] = React.useState("");
  const [messages, setMessages] = React.useState<Record<string, ChannelMessage[]>>({});
  const [draft, setDraft] = React.useState("");
  const [requests, setRequests] = React.useState<FriendRequestItem[]>([]);
  const [grantInfo, setGrantInfo] = React.useState<{
    granted: boolean;
    expiresAt?: string;
  } | null>(null);
  const [loadingChannels, setLoadingChannels] = React.useState(true);
  const [loadingMessages, setLoadingMessages] = React.useState(false);
  const [socketStatus, setSocketStatus] = React.useState<SocketStatus>("connecting");
  const socketRef = React.useRef<ChatSocket | null>(null);
  const activeIdRef = React.useRef<string | null>(activeId);
  React.useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  React.useEffect(() => {
    let cancelled = false;
    setLoadingChannels(true);
    listChannels()
      .then((list) => {
        if (cancelled) return;
        setChannels(list ?? []);
        if (!activeId && list && list[0]) {
          setActiveId(list[0].channelId);
        }
      })
      .catch(() => !cancelled && setChannels([]))
      .finally(() => !cancelled && setLoadingChannels(false));

    listIncomingFriendRequests(0, 20)
      .then((page) => !cancelled && setRequests(page.content ?? []))
      .catch(() => !cancelled && setRequests([]));

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    setLoadingMessages(true);
    listChannelMessages(activeId, 0, 50)
      .then((page) => {
        if (cancelled) return;
        // API returns newest first; reverse for chronological display
        const sorted = [...(page.content ?? [])].reverse();
        setMessages((s) => ({ ...s, [activeId]: sorted }));
      })
      .catch(() => !cancelled && setMessages((s) => ({ ...s, [activeId]: [] })))
      .finally(() => !cancelled && setLoadingMessages(false));
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  const channel = channels.find((c) => c.channelId === activeId);

  React.useEffect(() => {
    if (!channel) {
      setGrantInfo(null);
      return;
    }
    let cancelled = false;
    getGrantStatus(channel.counterpartProfileId)
      .then((res) => {
        if (cancelled) return;
        setGrantInfo({
          granted: !!res.data?.theyGaveMeAccess,
          expiresAt: res.data?.theirGrant?.expiresAt,
        });
      })
      .catch(() => !cancelled && setGrantInfo(null));
    return () => {
      cancelled = true;
    };
  }, [channel?.counterpartProfileId]);

  const msgs = activeId ? messages[activeId] ?? [] : [];

  const filteredChannels = channels.filter((c) =>
    search
      ? (c.counterpartDisplayName ?? c.counterpartProfilename)
          .toLowerCase()
          .includes(search.toLowerCase())
      : true,
  );

  // STOMP WebSocket lifecycle — one connection per page mount, kept alive while
  // the user is on this page. Incoming frames on /user/queue/messages are
  // appended to the relevant channel buffer.
  React.useEffect(() => {
    if (!user?.id) return;
    const socket = new ChatSocket();
    socketRef.current = socket;
    socket.setHandlers({
      onConnect: () => setSocketStatus("connected"),
      onDisconnect: () => setSocketStatus("disconnected"),
      onError: () => setSocketStatus("error"),
      onMessage: (incoming) => {
        setMessages((s) => {
          const existing = s[incoming.channelId] ?? [];
          // De-dupe by id (the server-confirmed echo replaces the optimistic row).
          const replacedOptimistic = existing.some(
            (m) =>
              m.senderId === incoming.senderId &&
              m.content === incoming.content &&
              m.id.startsWith("local_"),
          );
          const filtered = replacedOptimistic
            ? existing.filter(
                (m) =>
                  !(
                    m.id.startsWith("local_") &&
                    m.senderId === incoming.senderId &&
                    m.content === incoming.content
                  ),
              )
            : existing.filter((m) => m.id !== incoming.id);
          return { ...s, [incoming.channelId]: [...filtered, incoming] };
        });
        // If we're looking at this channel right now, opportunistically mark
        // the message read on the server.
        if (
          activeIdRef.current === incoming.channelId &&
          incoming.senderId !== user.id &&
          !incoming.read
        ) {
          socketRef.current?.markRead(incoming.channelId, incoming.id);
        }
      },
    });
    setSocketStatus("connecting");
    socket.activate();
    return () => {
      socket.setHandlers({});
      void socket.deactivate();
      socketRef.current = null;
    };
  }, [user?.id]);

  const send = () => {
    if (!draft.trim() || !activeId || !channel || !user) return;
    const trimmed = draft.trim();
    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      setSocketStatus(socket ? "disconnected" : "error");
      return;
    }
    // Optimistic render — the server echo arrives on /user/queue/messages and
    // replaces this row in the onMessage handler above.
    const optimistic: ChannelMessage = {
      id: `local_${Date.now()}`,
      channelId: activeId,
      senderId: user.id,
      senderProfilename: user.fullName,
      content: trimmed,
      read: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMessages((s) => ({ ...s, [activeId]: [...(s[activeId] ?? []), optimistic] }));
    setDraft("");
    try {
      socket.send(activeId, trimmed);
    } catch (err) {
      console.warn("chat send failed", err);
      setSocketStatus("error");
    }
  };

  const handleAccept = async (id: string) => {
    try {
      await acceptFriendRequest(id);
      setRequests((curr) => curr.filter((r) => r.id !== id));
    } catch {
      // ignore
    }
  };
  const handleReject = async (id: string) => {
    try {
      await rejectFriendRequest(id);
      setRequests((curr) => curr.filter((r) => r.id !== id));
    } catch {
      // ignore
    }
  };

  return (
    <div className="grid h-[calc(100vh-7rem)] grid-cols-[320px_1fr_320px] gap-4">
      <Card className="flex flex-col overflow-hidden">
        <div className="border-b p-3">
          <Input
            placeholder="Search by patient…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Tabs value={tab} onValueChange={setTab} className="mt-3">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="patients">Patients</TabsTrigger>
              <TabsTrigger value="requests">
                Requests {requests.length > 0 && `(${requests.length})`}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {tab === "patients" && loadingChannels && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
          {tab === "patients" && !loadingChannels && filteredChannels.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">No conversations yet.</p>
          )}
          {tab === "patients" &&
            filteredChannels.map((c) => (
              <button
                key={c.channelId}
                onClick={() => {
                  setActiveId(c.channelId);
                  setParams({ channel: c.channelId });
                }}
                className={`flex w-full items-center gap-3 border-b p-3 text-left text-sm transition-colors hover:bg-muted/50 ${
                  activeId === c.channelId ? "bg-accent" : ""
                }`}
              >
                <Avatar>
                  {c.counterpartAvatarUrl && (
                    <AvatarImage src={c.counterpartAvatarUrl} alt="" />
                  )}
                  <AvatarFallback>
                    {initials(c.counterpartDisplayName ?? c.counterpartProfilename)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate font-medium">
                      {c.counterpartDisplayName ?? c.counterpartProfilename}
                    </p>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.lastMessagePreview ?? "No messages yet."}
                  </p>
                </div>
                {c.unreadCount > 0 && (
                  <Badge variant="default" className="shrink-0">
                    {c.unreadCount}
                  </Badge>
                )}
              </button>
            ))}

          {tab === "requests" && (
            <div className="space-y-2 p-3 text-sm">
              {requests.length === 0 && (
                <p className="text-muted-foreground">No incoming requests.</p>
              )}
              {requests.map((r) => (
                <Card key={r.id} className="p-3">
                  <p className="font-medium">{r.senderProfilename}</p>
                  <p className="text-xs text-muted-foreground">
                    Wants to connect — {format(parseISO(r.createdAt), "PP")}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" onClick={() => handleAccept(r.id)}>
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleReject(r.id)}
                    >
                      Decline
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card className="flex flex-col overflow-hidden">
        {!channel ? (
          <div className="grid flex-1 place-items-center text-sm text-muted-foreground">
            Select a conversation
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b p-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  {channel.counterpartAvatarUrl && (
                    <AvatarImage src={channel.counterpartAvatarUrl} alt="" />
                  )}
                  <AvatarFallback>
                    {initials(channel.counterpartDisplayName ?? channel.counterpartProfilename)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {channel.counterpartDisplayName ?? channel.counterpartProfilename}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {channel.lastMessageAt
                      ? `Last message ${format(parseISO(channel.lastMessageAt), "PP HH:mm")}`
                      : "No messages yet"}
                  </p>
                </div>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to={`/patients/${channel.counterpartProfileId}`}>View profile</Link>
              </Button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto scrollbar-thin bg-muted/20 p-4">
              {loadingMessages && (
                <div className="flex items-center justify-center py-6 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
              {!loadingMessages && msgs.length === 0 && (
                <p className="text-center text-xs text-muted-foreground">
                  No messages yet — say hello.
                </p>
              )}
              {msgs.map((m) => {
                const fromMe = m.senderId === user?.id;
                return (
                  <div key={m.id} className={`flex ${fromMe ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                        fromMe
                          ? "rounded-br-sm bg-primary text-primary-foreground"
                          : "rounded-bl-sm bg-card"
                      }`}
                    >
                      <p>{m.content}</p>
                      <p
                        className={`mt-1 text-[10px] ${
                          fromMe ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}
                      >
                        {format(parseISO(m.createdAt), "HH:mm")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t p-3">
              <div className="flex items-end gap-2">
                <Button variant="ghost" size="icon" aria-label="Attach">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Textarea
                  rows={1}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message…"
                  className="min-h-10 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                />
                <Button
                  onClick={send}
                  disabled={!draft.trim() || socketStatus !== "connected"}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    socketStatus === "connected"
                      ? "bg-success"
                      : socketStatus === "connecting"
                        ? "bg-warning"
                        : "bg-destructive"
                  }`}
                />
                {socketStatus === "connected"
                  ? "Chat socket connected (STOMP)."
                  : socketStatus === "connecting"
                    ? "Connecting to chat socket…"
                    : socketStatus === "disconnected"
                      ? "Chat socket disconnected — reconnecting."
                      : "Chat socket error — see console."}
              </p>
            </div>
          </>
        )}
      </Card>

      <Card className="overflow-y-auto scrollbar-thin p-4">
        {channel ? (
          <div className="space-y-4 text-sm">
            <h3 className="text-base font-semibold">Permission</h3>
            {grantInfo?.granted ? (
              <div className="rounded-md border border-success/40 bg-success/5 p-3">
                <p className="text-sm font-medium text-success">
                  Data access granted
                  {grantInfo.expiresAt && ` until ${format(parseISO(grantInfo.expiresAt), "PP")}`}
                </p>
                <Button asChild variant="link" size="sm" className="mt-1 h-auto p-0 text-success">
                  <Link to={`/patients/${channel.counterpartProfileId}`}>
                    View their tracking data →
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-sm">Data access not granted.</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  The patient grants access from their mobile app.
                </p>
              </div>
            )}

            <div className="rounded-md border p-3 text-xs text-muted-foreground">
              Note: chat permission is separate from health-data permission. Patients may message
              you even without granting access to their diary / mood / sleep.
            </div>

            {channel.moodAlert && (
              <div className="rounded-md border border-warning/40 bg-warning/5 p-3 text-xs">
                <p className="font-medium text-warning">Mood alert</p>
                <p className="text-muted-foreground">{channel.moodAlert}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No conversation selected.</p>
        )}
      </Card>
    </div>
  );
}
