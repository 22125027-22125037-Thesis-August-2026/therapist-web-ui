import * as React from "react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PermissionBadge } from "@/components/PermissionBadge";
import { initials } from "@/lib/utils";
import { listChannels, type ChannelItem } from "@/lib/api/social";
import { getGrantStatus } from "@/lib/api/auth";

interface PatientRow {
  profileId: string;
  displayName: string;
  profilename: string;
  avatarUrl?: string | null;
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
  unreadCount: number;
  permissionGranted: boolean;
  permissionLoading: boolean;
  channel: ChannelItem;
}

export function PatientsListPage() {
  const [search, setSearch] = React.useState("");
  const [onlyGranted, setOnlyGranted] = React.useState(false);
  const [rows, setRows] = React.useState<PatientRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listChannels()
      .then(async (channels) => {
        if (cancelled) return;
        const initial: PatientRow[] = (channels ?? []).map((c) => ({
          profileId: c.counterpartProfileId,
          displayName: c.counterpartDisplayName ?? c.counterpartProfilename,
          profilename: c.counterpartProfilename,
          avatarUrl: c.counterpartAvatarUrl,
          lastMessageAt: c.lastMessageAt,
          lastMessagePreview: c.lastMessagePreview,
          unreadCount: c.unreadCount,
          permissionGranted: false,
          permissionLoading: true,
          channel: c,
        }));
        setRows(initial);

        // Fan out for grant status per patient
        const results = await Promise.allSettled(
          initial.map((r) => getGrantStatus(r.profileId)),
        );
        if (cancelled) return;
        setRows((curr) =>
          curr.map((r, i) => {
            const res = results[i];
            if (res.status === "fulfilled") {
              return {
                ...r,
                permissionGranted: !!res.value?.data?.theyGaveMeAccess,
                permissionLoading: false,
              };
            }
            return { ...r, permissionLoading: false };
          }),
        );
      })
      .catch((e) => !cancelled && setError(e?.message ?? "Failed to load patients"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = rows.filter((r) => {
    if (onlyGranted && !r.permissionGranted) return false;
    if (search && !r.displayName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Patients</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} of {rows.length} patients shown.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={onlyGranted}
              onChange={(e) => setOnlyGranted(e.target.checked)}
            />
            Only with permission
          </label>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3 text-left">Patient</th>
                  <th className="p-3 text-left">Profile name</th>
                  <th className="p-3 text-left">Last message</th>
                  <th className="p-3 text-left">Unread</th>
                  <th className="p-3 text-left">Access</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.profileId} className="border-t hover:bg-muted/30">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          {p.avatarUrl && <AvatarImage src={p.avatarUrl} alt="" />}
                          <AvatarFallback>{initials(p.displayName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <Link
                            to={`/patients/${p.profileId}`}
                            className="font-medium hover:underline"
                          >
                            {p.displayName}
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{p.profilename}</td>
                    <td className="p-3 text-muted-foreground">
                      {p.lastMessageAt ? format(parseISO(p.lastMessageAt), "PP HH:mm") : "—"}
                    </td>
                    <td className="p-3 text-muted-foreground">{p.unreadCount}</td>
                    <td className="p-3">
                      {p.permissionLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                      ) : (
                        <PermissionBadge granted={p.permissionGranted} />
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        to={`/patients/${p.profileId}`}
                        className="text-sm text-primary hover:underline"
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-muted-foreground">
                      No patients match the filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
