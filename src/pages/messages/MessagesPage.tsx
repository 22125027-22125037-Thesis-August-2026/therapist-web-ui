import * as React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { CalendarPlus, Paperclip, Send, Sparkles, Wind } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { PermissionBadge } from "@/components/PermissionBadge";
import { initials } from "@/lib/utils";
import { mockChannels, mockMessages, mockPatients } from "@/lib/mockData";
import type { ChatMessage } from "@/types";

export function MessagesPage() {
  const [params, setParams] = useSearchParams();
  const initialChannel = params.get("channel") ?? mockChannels[0]?.id ?? null;
  const [activeId, setActiveId] = React.useState<string | null>(initialChannel);
  const [tab, setTab] = React.useState("patients");
  const [search, setSearch] = React.useState("");
  const [messages, setMessages] = React.useState<Record<string, ChatMessage[]>>(mockMessages);
  const [draft, setDraft] = React.useState("");

  const channel = mockChannels.find((c) => c.id === activeId);
  const patient = channel ? mockPatients.find((p) => p.id === channel.patientId) : undefined;
  const msgs = activeId ? messages[activeId] ?? [] : [];

  const filteredChannels = mockChannels.filter((c) =>
    search ? c.patientName.toLowerCase().includes(search.toLowerCase()) : true,
  );

  const send = () => {
    if (!draft.trim() || !activeId) return;
    const next: ChatMessage = {
      id: `m_${Date.now()}`,
      channelId: activeId,
      senderId: "th_1",
      senderName: "Therapist",
      fromMe: true,
      body: draft.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages((s) => ({ ...s, [activeId]: [...(s[activeId] ?? []), next] }));
    setDraft("");
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
              <TabsTrigger value="requests">Requests</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {tab === "patients" &&
            filteredChannels.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setActiveId(c.id);
                  setParams({ channel: c.id });
                }}
                className={`flex w-full items-center gap-3 border-b p-3 text-left text-sm transition-colors hover:bg-muted/50 ${
                  activeId === c.id ? "bg-accent" : ""
                }`}
              >
                <Avatar>
                  <AvatarFallback>{initials(c.patientName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate font-medium">{c.patientName}</p>
                    <PermissionBadge granted={c.permissionGranted} />
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{c.lastMessage}</p>
                </div>
                {c.unreadCount > 0 && (
                  <Badge variant="default" className="shrink-0">
                    {c.unreadCount}
                  </Badge>
                )}
              </button>
            ))}

          {tab === "requests" && (
            <div className="p-4 text-sm text-muted-foreground">
              <p>2 incoming requests</p>
              <Card className="mt-2 p-3 text-foreground">
                <p className="font-medium">Phạm Thiên Kim</p>
                <p className="text-xs text-muted-foreground">Wants to start consulting.</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm">Accept</Button>
                  <Button size="sm" variant="ghost">
                    Decline
                  </Button>
                </div>
              </Card>
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
                  <AvatarFallback>{initials(channel.patientName)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{channel.patientName}</p>
                  <p className="text-xs text-muted-foreground">Last seen recently</p>
                </div>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to={`/patients/${channel.patientId}`}>View profile</Link>
              </Button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto scrollbar-thin bg-muted/20 p-4">
              {msgs.length === 0 && (
                <p className="text-center text-xs text-muted-foreground">
                  No messages yet — say hello.
                </p>
              )}
              {msgs.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                      m.fromMe
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm bg-card"
                    }`}
                  >
                    <p>{m.body}</p>
                    <p
                      className={`mt-1 text-[10px] ${
                        m.fromMe ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      {format(parseISO(m.createdAt), "HH:mm")}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t p-3">
              <div className="mb-2 flex flex-wrap gap-2">
                <Button size="sm" variant="outline">
                  <CalendarPlus className="h-3.5 w-3.5" /> Send slot
                </Button>
                <Button size="sm" variant="outline">
                  <Wind className="h-3.5 w-3.5" /> Send breathing exercise
                </Button>
                <Button size="sm" variant="outline">
                  <Sparkles className="h-3.5 w-3.5" /> Mood-check prompt
                </Button>
              </div>
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
                <Button onClick={send} disabled={!draft.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <Card className="overflow-y-auto scrollbar-thin p-4">
        {patient ? (
          <div className="space-y-4 text-sm">
            <h3 className="text-base font-semibold">Permission</h3>
            {patient.permission.theyGaveMeAccess ? (
              <div className="rounded-md border border-success/40 bg-success/5 p-3">
                <p className="text-sm font-medium text-success">
                  Data access granted{" "}
                  {patient.permission.expiresAt && `until ${format(parseISO(patient.permission.expiresAt), "PP")}`}
                </p>
                <Button asChild variant="link" size="sm" className="mt-1 h-auto p-0 text-success">
                  <Link to={`/patients/${patient.id}`}>View their tracking data →</Link>
                </Button>
              </div>
            ) : (
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-sm">Data access not granted.</p>
                <Button size="sm" className="mt-2">
                  Request access
                </Button>
              </div>
            )}

            <div>
              <h4 className="text-xs uppercase tracking-wide text-muted-foreground">
                Grant history
              </h4>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                <li>15/03/2026 — Patient granted READ_ALL</li>
                <li>01/01/2026 — Therapist requested access</li>
              </ul>
            </div>

            <div className="rounded-md border p-3 text-xs text-muted-foreground">
              Note: chat permission is separate from health-data permission. Patients may message
              you even without granting access to their diary / mood / sleep.
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No conversation selected.</p>
        )}
      </Card>
    </div>
  );
}
