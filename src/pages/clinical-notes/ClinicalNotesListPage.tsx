import * as React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { listClinicalNotes, type ClinicalNoteResponse } from "@/lib/api/therapist";

type StatusKey = "all" | "draft" | "finalized";

export function ClinicalNotesListPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = React.useState("");
  const initialStatus = (params.get("status") as StatusKey | null) ?? "all";
  const [status, setStatus] = React.useState<StatusKey>(initialStatus);
  const [rows, setRows] = React.useState<ClinicalNoteResponse[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    listClinicalNotes({
      therapistId: user.id,
      status: status === "all" ? undefined : status === "draft" ? "DRAFT" : "FINALIZED",
      page: 0,
      size: 200,
      sort: "createdAt,desc",
    })
      .then((page) => !cancelled && setRows(page.content ?? []))
      .catch((e) => !cancelled && setError(e?.message ?? "Failed to load notes"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user?.id, status]);

  const filtered = rows.filter((n) =>
    search ? (n.summary ?? n.diagnosis ?? "").toLowerCase().includes(search.toLowerCase()) : true,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Clinical notes</h1>
          <p className="text-sm text-muted-foreground">
            Your private working record. Patients never see these.
          </p>
        </div>
        <Button asChild>
          <Link to="/clinical-notes/new">New note</Link>
        </Button>
      </div>

      <Tabs
        value={status}
        onValueChange={(v) => {
          setStatus(v as StatusKey);
          const next = new URLSearchParams(params);
          if (v === "all") next.delete("status");
          else next.set("status", v);
          setParams(next);
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="finalized">Finalized</TabsTrigger>
          </TabsList>
          <Input
            placeholder="Search summary / diagnosis…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
          />
        </div>
      </Tabs>

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
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Appointment</th>
                  <th className="p-3 text-left">Summary</th>
                  <th className="p-3 text-left">Last edited</th>
                  <th className="p-3 text-left">Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((n) => (
                  <tr key={n.noteId} className="border-t hover:bg-muted/30">
                    <td className="p-3">{format(parseISO(n.createdAt), "PP")}</td>
                    <td className="p-3 text-muted-foreground">
                      <Link
                        to={`/appointments/${n.appointmentId}`}
                        className="text-primary hover:underline"
                      >
                        {n.appointmentId.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {n.summary ?? n.diagnosis ?? "(no summary)"}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {n.updatedAt
                        ? format(parseISO(n.updatedAt), "PP HH:mm")
                        : format(parseISO(n.createdAt), "PP HH:mm")}
                    </td>
                    <td className="p-3">
                      <Badge variant={n.status === "FINALIZED" ? "default" : "warning"}>
                        {n.status ?? "—"}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        to={`/clinical-notes/${n.noteId}`}
                        className="text-primary hover:underline"
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-muted-foreground">
                      No notes match.
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
