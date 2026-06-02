import * as React from "react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RiskBadge } from "@/components/StatusBadge";
import { initials } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  listTherapistPatients,
  type TherapistPatientRosterItem,
} from "@/lib/api/therapist";
import { getPatientDetail } from "@/lib/api/auth";

export function PatientsListPage() {
  const { user } = useAuth();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [tag, setTag] = React.useState("");
  const [rows, setRows] = React.useState<TherapistPatientRosterItem[]>([]);
  // Names resolved from the patient-profile endpoint for rows the roster left blank
  // (the roster only knows a name when the patient has a booked appointment).
  const [names, setNames] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true);
    listTherapistPatients(user.id)
      .then((list) => {
        if (cancelled) return;
        const rosterRows = list ?? [];
        setRows(rosterRows);
        // Backfill missing names via the profile endpoint (accessible because the
        // therapist is assigned to these patients). Failures fall back to the id.
        const missing = rosterRows.filter((p) => !p.patientName).map((p) => p.profileId);
        missing.forEach((profileId) => {
          getPatientDetail(profileId)
            .then((d) => {
              if (!cancelled && d?.fullName) {
                setNames((prev) => ({ ...prev, [profileId]: d.fullName }));
              }
            })
            .catch(() => {});
        });
      })
      .catch((e) => !cancelled && setError(e?.message ?? "Failed to load patients"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const nameFor = React.useCallback(
    (p: TherapistPatientRosterItem) => p.patientName ?? names[p.profileId] ?? p.profileId.slice(0, 8),
    [names],
  );

  const allTags = Array.from(
    new Set(rows.flatMap((p) => p.tags ?? [])),
  ).sort();

  const filtered = rows.filter((p) => {
    if (statusFilter !== "ALL" && p.assignmentStatus !== statusFilter) return false;
    if (tag && !(p.tags ?? []).includes(tag)) return false;
    if (search && !nameFor(p).toLowerCase().includes(search.toLowerCase())) return false;
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
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "INACTIVE")
            }
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            aria-label="Filter by assignment status"
          >
            <option value="ALL">All assignments</option>
            <option value="ACTIVE">Active only</option>
            <option value="INACTIVE">Past only</option>
          </select>
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            aria-label="Filter by tag"
          >
            <option value="">All tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
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
                  <th className="p-3 text-left">Assignment</th>
                  <th className="p-3 text-left">Assigned</th>
                  <th className="p-3 text-left">Risk</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.profileId} className="border-t hover:bg-muted/30">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{initials(nameFor(p))}</AvatarFallback>
                        </Avatar>
                        <div>
                          <Link
                            to={`/patients/${p.profileId}`}
                            className="font-medium hover:underline"
                          >
                            {nameFor(p)}
                          </Link>
                          {(p.tags ?? []).length > 0 && (
                            <div className="flex gap-1 pt-0.5">
                              {(p.tags ?? []).map((t) => (
                                <Badge key={t} variant="secondary" className="text-[10px]">
                                  {t}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={p.assignmentStatus === "ACTIVE" ? "success" : "muted"}
                      >
                        {p.assignmentStatus}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {format(parseISO(p.assignedAt), "PP")}
                    </td>
                    <td className="p-3">
                      <RiskBadge level={p.riskLevel ?? "NONE"} />
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
                    <td colSpan={5} className="p-12 text-center text-muted-foreground">
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
