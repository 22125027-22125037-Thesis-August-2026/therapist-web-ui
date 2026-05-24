import * as React from "react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  fetchTherapistAppointments,
  type AppointmentRow,
} from "@/lib/api/therapistAppointments";
import {
  getClinicalNoteByAppointment,
  type ClinicalNoteResponse,
} from "@/lib/api/therapist";

interface NoteListRow extends ClinicalNoteResponse {
  patientId: string;
  patientName: string;
  appointmentDate: string;
}

export function ClinicalNotesListPage() {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<string>("all");
  const [rows, setRows] = React.useState<NoteListRow[]>([]);
  const [completedSessions, setCompletedSessions] = React.useState<AppointmentRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTherapistAppointments()
      .then(async ({ appointments }) => {
        const completed = appointments.filter((a) => a.status === "COMPLETED");
        if (cancelled) return;
        setCompletedSessions(completed);
        const noteResults = await Promise.allSettled(
          completed.map((a) =>
            getClinicalNoteByAppointment(a.appointmentId).then((n) => ({
              ...n,
              patientId: a.patientId,
              patientName: a.patientName,
              appointmentDate: a.startDatetime,
            })),
          ),
        );
        if (cancelled) return;
        setRows(
          noteResults
            .filter((r): r is PromiseFulfilledResult<NoteListRow> => r.status === "fulfilled")
            .map((r) => r.value),
        );
      })
      .catch(() => !cancelled && setRows([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = rows
    .filter((n) => {
      if (status === "all") return true;
      // The backend doesn't distinguish DRAFT vs FINALIZED — treat all as FINALIZED.
      return status === "finalized";
    })
    .filter((n) =>
      search ? n.patientName.toLowerCase().includes(search.toLowerCase()) : true,
    );

  const sessionsWithoutNotes = completedSessions.filter(
    (s) => !rows.some((r) => r.appointmentId === s.appointmentId),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Clinical notes</h1>
          <p className="text-sm text-muted-foreground">
            One note per completed appointment. Patients never see these.
          </p>
        </div>
        <Button asChild>
          <Link to="/clinical-notes/new">New note</Link>
        </Button>
      </div>

      <Tabs value={status} onValueChange={setStatus}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="finalized">Finalized</TabsTrigger>
            <TabsTrigger value="draft">Drafts (n/a)</TabsTrigger>
          </TabsList>
          <Input
            placeholder="Search by patient…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
          />
        </div>
      </Tabs>

      {sessionsWithoutNotes.length > 0 && (
        <Card>
          <CardContent className="p-4 text-sm">
            <p className="font-medium">
              {sessionsWithoutNotes.length} completed session
              {sessionsWithoutNotes.length === 1 ? "" : "s"} without a clinical note
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {sessionsWithoutNotes.slice(0, 6).map((s) => (
                <Button key={s.appointmentId} asChild size="sm" variant="outline">
                  <Link to={`/clinical-notes/new?appointmentId=${s.appointmentId}`}>
                    {s.patientName} · {format(parseISO(s.startDatetime), "PP")}
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
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
                  <th className="p-3 text-left">Patient</th>
                  <th className="p-3 text-left">Appointment</th>
                  <th className="p-3 text-left">Diagnosis</th>
                  <th className="p-3 text-left">Created</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((n) => (
                  <tr key={n.noteId} className="border-t hover:bg-muted/30">
                    <td className="p-3">{format(parseISO(n.appointmentDate), "PP")}</td>
                    <td className="p-3 font-medium">
                      <Link to={`/patients/${n.patientId}`} className="hover:underline">
                        {n.patientName}
                      </Link>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      <Link
                        to={`/appointments/${n.appointmentId}`}
                        className="text-primary hover:underline"
                      >
                        {n.appointmentId.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="p-3 text-muted-foreground">{n.diagnosis ?? "—"}</td>
                    <td className="p-3 text-muted-foreground">
                      {format(parseISO(n.createdAt), "PP HH:mm")}
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        to={`/clinical-notes/${n.appointmentId}`}
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
