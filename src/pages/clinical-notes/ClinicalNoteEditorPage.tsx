import * as React from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Loader2, Lock, Save, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  finalizeClinicalNote,
  getAppointmentDetail,
  getClinicalNote,
  getClinicalNoteByAppointment,
  submitClinicalNote,
  updateClinicalNote,
  type AppointmentDetail,
  type ClinicalNoteResponse,
} from "@/lib/api/therapist";
import { ApiError } from "@/lib/api/http";

interface FormState {
  diagnosis: string;
  recommendations: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  summary: string;
  riskSuicidalIdeation: boolean;
  riskSelfHarm: boolean;
  riskSubstanceUse: boolean;
  riskAbuse: boolean;
}

const emptyForm: FormState = {
  diagnosis: "",
  recommendations: "",
  subjective: "",
  objective: "",
  assessment: "",
  plan: "",
  summary: "",
  riskSuicidalIdeation: false,
  riskSelfHarm: false,
  riskSubstanceUse: false,
  riskAbuse: false,
};

function noteToForm(n: ClinicalNoteResponse): FormState {
  return {
    diagnosis: n.diagnosis ?? "",
    recommendations: n.recommendations ?? "",
    subjective: n.subjective ?? "",
    objective: n.objective ?? "",
    assessment: n.assessment ?? "",
    plan: n.plan ?? "",
    summary: n.summary ?? "",
    riskSuicidalIdeation: !!n.riskFlags?.suicidalIdeation,
    riskSelfHarm: !!n.riskFlags?.selfHarm,
    riskSubstanceUse: !!n.riskFlags?.substanceUse,
    riskAbuse: !!n.riskFlags?.abuse,
  };
}

export function ClinicalNoteEditorPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const presetAppt = params.get("appointmentId");
  const draftScratch = params.get("draft");

  const [note, setNote] = React.useState<ClinicalNoteResponse | null>(null);
  const [appointment, setAppointment] = React.useState<AppointmentDetail | null>(null);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [savedAt, setSavedAt] = React.useState<Date | null>(null);
  const [riskOpen, setRiskOpen] = React.useState(false);
  const [finalizeOpen, setFinalizeOpen] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        let loadedNote: ClinicalNoteResponse | null = null;
        let appointmentId: string | null = null;

        if (id && id !== "new") {
          // Try note-id first; fall back to appointment-id for legacy links.
          try {
            loadedNote = await getClinicalNote(id);
            appointmentId = loadedNote.appointmentId;
          } catch (err) {
            if (err instanceof ApiError && err.status === 404) {
              try {
                loadedNote = await getClinicalNoteByAppointment(id);
                appointmentId = id;
              } catch (err2) {
                if (!(err2 instanceof ApiError && err2.status === 404)) throw err2;
                appointmentId = id;
              }
            } else {
              throw err;
            }
          }
        } else if (presetAppt) {
          appointmentId = presetAppt;
          try {
            loadedNote = await getClinicalNoteByAppointment(presetAppt);
          } catch (err) {
            if (!(err instanceof ApiError && err.status === 404)) throw err;
          }
        }

        if (cancelled) return;
        if (loadedNote) {
          setNote(loadedNote);
          setForm(noteToForm(loadedNote));
        } else if (draftScratch) {
          setForm({ ...emptyForm, subjective: draftScratch });
        }

        if (appointmentId) {
          try {
            const a = await getAppointmentDetail(appointmentId);
            if (!cancelled) setAppointment(a);
          } catch {
            // appointment lookup failed, fine
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
  }, [id, presetAppt, draftScratch]);

  const readOnly = note?.status === "FINALIZED";
  const appointmentId = appointment?.appointmentId ?? presetAppt ?? null;

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleRisk = (flag: keyof Pick<
    FormState,
    "riskSuicidalIdeation" | "riskSelfHarm" | "riskSubstanceUse" | "riskAbuse"
  >) => {
    const nextValue = !form[flag];
    setField(flag, nextValue);
    if (nextValue) setRiskOpen(true);
  };

  const buildPayload = () => ({
    diagnosis: form.diagnosis || undefined,
    recommendations: form.recommendations || undefined,
    subjective: form.subjective || undefined,
    objective: form.objective || undefined,
    assessment: form.assessment || undefined,
    plan: form.plan || undefined,
    summary: form.summary || undefined,
    riskSuicidalIdeation: form.riskSuicidalIdeation,
    riskSelfHarm: form.riskSelfHarm,
    riskSubstanceUse: form.riskSubstanceUse,
    riskAbuse: form.riskAbuse,
  });

  const handleSaveDraft = async () => {
    if (!appointmentId) {
      setError("No appointment selected.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (note?.noteId) {
        const updated = await updateClinicalNote(note.noteId, buildPayload());
        setNote(updated);
      } else {
        const created = await submitClinicalNote({
          appointmentId,
          status: "DRAFT",
          ...buildPayload(),
        });
        setNote(created);
        // After first create, prefer note-id deep link for future revisits.
        navigate(`/clinical-notes/${created.noteId}`, { replace: true });
      }
      setSavedAt(new Date());
    } catch (e: any) {
      setError(e?.message ?? "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitFinalized = async () => {
    if (!appointmentId) {
      setError("No appointment selected.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // Save latest edits first if there's already a draft note.
      let working = note;
      if (working?.noteId) {
        working = await updateClinicalNote(working.noteId, buildPayload());
        working = await finalizeClinicalNote(working.noteId);
      } else {
        working = await submitClinicalNote({
          appointmentId,
          status: "FINALIZED",
          ...buildPayload(),
        });
      }
      setNote(working);
      setSavedAt(new Date());
      setFinalizeOpen(false);
      if (working?.noteId && id !== working.noteId) {
        navigate(`/clinical-notes/${working.noteId}`, { replace: true });
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to finalize note");
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
            {appointment ? (
              <>
                Patient:{" "}
                <Link
                  to={`/patients/${appointment.profileId}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {appointment.patientName ?? appointment.profileId.slice(0, 8)}
                </Link>{" "}
                · Appointment{" "}
                <Link
                  to={`/appointments/${appointment.appointmentId}`}
                  className="text-primary hover:underline"
                >
                  {appointment.appointmentId.slice(0, 8)}
                </Link>{" "}
                · {format(parseISO(appointment.startDatetime), "PP HH:mm")}
              </>
            ) : (
              <span className="italic">unassigned</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={readOnly ? "default" : "warning"}>
            {note?.status ?? "DRAFT (unsaved)"}
          </Badge>
          {savedAt && (
            <span className="text-xs text-muted-foreground">
              Saved {format(savedAt, "HH:mm:ss")}
            </span>
          )}
          {!readOnly && (
            <>
              <Button size="sm" variant="outline" onClick={handleSaveDraft} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4" /> Save draft
              </Button>
              <Button
                size="sm"
                onClick={() => setFinalizeOpen(true)}
                disabled={saving || !appointmentId}
              >
                <Lock className="h-4 w-4" /> Finalize
              </Button>
            </>
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
          This note has been <strong>finalized</strong> and is now read-only.
        </div>
      )}

      {!appointmentId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">No appointment attached</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            A clinical note must be tied to an appointment. Open the appointment and click
            "Write clinical note" from there.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <SOAPField
            label="Subjective"
            hint="What the patient reported."
            value={form.subjective}
            onChange={(v) => setField("subjective", v)}
            readOnly={readOnly}
          />
          <SOAPField
            label="Objective"
            hint="Therapist observations, scores."
            value={form.objective}
            onChange={(v) => setField("objective", v)}
            readOnly={readOnly}
          />
          <SOAPField
            label="Assessment"
            hint="Diagnosis impression, risk level."
            value={form.assessment}
            onChange={(v) => setField("assessment", v)}
            readOnly={readOnly}
          />
          <SOAPField
            label="Plan"
            hint="Next steps, homework, referrals."
            value={form.plan}
            onChange={(v) => setField("plan", v)}
            readOnly={readOnly}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Diagnosis (short)</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={form.diagnosis}
                onChange={(e) => setField("diagnosis", e.target.value)}
                disabled={readOnly}
                placeholder="e.g. F41.1 Generalized Anxiety Disorder"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={4}
                value={form.recommendations}
                onChange={(e) => setField("recommendations", e.target.value)}
                disabled={readOnly}
                placeholder="e.g. Weekly CBT for 8 weeks; sleep-hygiene worksheet"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="One-line summary (shown in the list view)"
                value={form.summary}
                onChange={(e) => setField("summary", e.target.value)}
                disabled={readOnly}
              />
            </CardContent>
          </Card>
        </div>

        <aside>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <ShieldAlert className="h-4 w-4 text-destructive" /> Risk flags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <RiskCheck
                label="Suicidal ideation"
                checked={form.riskSuicidalIdeation}
                disabled={readOnly}
                onToggle={() => toggleRisk("riskSuicidalIdeation")}
              />
              <RiskCheck
                label="Self-harm"
                checked={form.riskSelfHarm}
                disabled={readOnly}
                onToggle={() => toggleRisk("riskSelfHarm")}
              />
              <RiskCheck
                label="Substance use"
                checked={form.riskSubstanceUse}
                disabled={readOnly}
                onToggle={() => toggleRisk("riskSubstanceUse")}
              />
              <RiskCheck
                label="Abuse"
                checked={form.riskAbuse}
                disabled={readOnly}
                onToggle={() => toggleRisk("riskAbuse")}
              />
            </CardContent>
          </Card>
        </aside>
      </div>

      <Dialog open={riskOpen} onOpenChange={setRiskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Safety protocol triggered</DialogTitle>
            <DialogDescription>
              You flagged a risk. Make sure you have:
              <ul className="mt-2 list-disc pl-6 text-sm">
                <li>Reviewed the patient's safety plan</li>
                <li>Confirmed an emergency contact is on file</li>
                <li>Scheduled a follow-up within 7 days (or sooner)</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setRiskOpen(false)}>Acknowledge</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={finalizeOpen} onOpenChange={setFinalizeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalize this note?</DialogTitle>
            <DialogDescription>
              Finalizing locks the note (no further edits) and marks the appointment as
              COMPLETED if it was still in progress.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setFinalizeOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSubmitFinalized} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              <Lock className="h-4 w-4" /> Finalize
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SOAPField({
  label,
  hint,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  readOnly: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{label}</CardTitle>
        <Label className="text-xs text-muted-foreground">{hint}</Label>
      </CardHeader>
      <CardContent>
        <Textarea
          rows={5}
          value={value}
          disabled={readOnly}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Write the ${label.toLowerCase()} section…`}
        />
      </CardContent>
    </Card>
  );
}

function RiskCheck({
  label,
  checked,
  disabled,
  onToggle,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onToggle}
      />
      <span>{label}</span>
    </label>
  );
}
