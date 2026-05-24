import * as React from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Loader2, Lock, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getClinicalNoteByAppointment,
  submitClinicalNote,
  type ClinicalNoteResponse,
} from "@/lib/api/therapist";
import {
  fetchTherapistAppointments,
  type AppointmentRow,
} from "@/lib/api/therapistAppointments";
import { ApiError } from "@/lib/api/http";

export function ClinicalNoteEditorPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const presetAppt = params.get("appointmentId");
  const draftScratch = params.get("draft");

  // For our wiring, the `:id` route parameter is interpreted as appointmentId,
  // because the backend's read endpoint is `/api/v1/notes/appointments/{appointmentId}`.
  const appointmentId = id && id !== "new" ? id : presetAppt;

  const [note, setNote] = React.useState<ClinicalNoteResponse | null>(null);
  const [appointment, setAppointment] = React.useState<AppointmentRow | null>(null);
  const [diagnosis, setDiagnosis] = React.useState("");
  const [recommendations, setRecommendations] = React.useState(draftScratch ?? "");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [savedAt, setSavedAt] = React.useState<Date | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const { appointments } = await fetchTherapistAppointments();
        if (cancelled) return;
        const appt = appointmentId
          ? appointments.find((a) => a.appointmentId === appointmentId) ?? null
          : null;
        setAppointment(appt);
        if (appointmentId) {
          try {
            const existing = await getClinicalNoteByAppointment(appointmentId);
            if (cancelled) return;
            setNote(existing);
            setDiagnosis(existing.diagnosis ?? "");
            setRecommendations(existing.recommendations ?? "");
          } catch (e) {
            if (e instanceof ApiError && e.status === 404) {
              // No note yet — editor mode
              setNote(null);
            } else {
              throw e;
            }
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load note");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [appointmentId]);

  const readOnly = !!note;

  const handleSubmit = async () => {
    if (!appointmentId) {
      setError("No appointment selected.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await submitClinicalNote({
        appointmentId,
        diagnosis,
        recommendations,
      });
      setNote(created);
      setSavedAt(new Date());
    } catch (e: any) {
      setError(e?.message ?? "Failed to submit clinical note");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/clinical-notes" className="text-sm text-muted-foreground hover:underline">
            ← Clinical notes
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">
            {note ? "Clinical note" : "New clinical note"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Patient:{" "}
            {appointment ? (
              <Link
                to={`/patients/${appointment.patientId}`}
                className="font-medium text-foreground hover:underline"
              >
                {appointment.patientName}
              </Link>
            ) : (
              <span className="italic">unassigned</span>
            )}
            {appointment && (
              <>
                {" "}
                · Appointment{" "}
                <Link
                  to={`/appointments/${appointment.appointmentId}`}
                  className="text-primary hover:underline"
                >
                  {appointment.appointmentId.slice(0, 8)}
                </Link>{" "}
                · {format(parseISO(appointment.startDatetime), "PP")}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={note ? "default" : "warning"}>
            {note ? "FINALIZED" : "DRAFT (local only)"}
          </Badge>
          {savedAt && (
            <span className="text-xs text-muted-foreground">
              Saved {format(savedAt, "HH:mm:ss")}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {readOnly && (
        <div className="rounded-md border-l-4 border-primary bg-accent/40 p-3 text-sm">
          This note has been submitted and the appointment marked
          <strong> COMPLETED</strong>. The backend does not yet support editing finalized notes.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {!appointmentId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">No appointment selected</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Open a completed appointment and click "Write clinical note" to start. The
                backend's note submission endpoint requires an <code>appointmentId</code>.
                <div className="mt-3">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/clinical-notes">Browse appointments</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Diagnosis</CardTitle>
              <Label className="text-xs text-muted-foreground">
                Short impression / DSM-style label. Surfaced to admins for QA.
              </Label>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={4}
                value={diagnosis}
                disabled={readOnly}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Moderate anxiety symptoms"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recommendations</CardTitle>
              <Label className="text-xs text-muted-foreground">
                Next steps, homework, referrals.
              </Label>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={8}
                value={recommendations}
                disabled={readOnly}
                onChange={(e) => setRecommendations(e.target.value)}
                placeholder="e.g. Weekly CBT sessions for 8 weeks"
              />
            </CardContent>
          </Card>

          {!readOnly && (
            <div className="flex justify-end">
              <Button onClick={handleSubmit} disabled={!appointmentId || saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                <Lock className="h-4 w-4" /> Submit & finalize
              </Button>
            </div>
          )}

          {note && (
            <Button asChild variant="ghost" size="sm">
              <Link to={`/appointments/${note.appointmentId}`}>← Back to appointment</Link>
            </Button>
          )}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <ShieldAlert className="h-4 w-4 text-destructive" /> SOAP & risk flags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>
                Backend currently stores only <code>diagnosis</code> + <code>recommendations</code>.
              </p>
              <p>
                Subjective / Objective / Assessment / Plan and risk-flag fields (suicidal ideation,
                self-harm, substance use, abuse) are not yet supported. See
                <code className="mx-1">docs/Missing API endpoints.md</code>.
              </p>
            </CardContent>
          </Card>

          {appointment && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Appointment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-xs text-muted-foreground">
                <p>{appointment.patientName}</p>
                <p>{format(parseISO(appointment.startDatetime), "PP HH:mm")}</p>
                <p>Status: {appointment.status}</p>
                <p>Mode: {appointment.mode}</p>
                <Button
                  size="sm"
                  variant="link"
                  className="h-auto p-0 text-xs"
                  onClick={() => navigate(`/appointments/${appointment.appointmentId}`)}
                >
                  Open appointment →
                </Button>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
