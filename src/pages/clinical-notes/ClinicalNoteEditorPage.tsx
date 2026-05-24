import * as React from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { Lock, ShieldAlert } from "lucide-react";
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
import { mockNotes, mockPatients, mockAppointments } from "@/lib/mockData";
import type { ClinicalNote } from "@/types";

const empty: ClinicalNote = {
  id: "new",
  patientId: "",
  patientName: "",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  status: "DRAFT",
  subjective: "",
  objective: "",
  assessment: "",
  plan: "",
  riskFlags: {
    suicidalIdeation: false,
    selfHarm: false,
    substanceUse: false,
    abuse: false,
  },
};

export function ClinicalNoteEditorPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const presetAppt = params.get("appointmentId");
  const presetPatient = params.get("patientId");
  const draftScratch = params.get("draft");

  const existing = id && id !== "new" ? mockNotes.find((n) => n.id === id) : null;
  const initial = React.useMemo<ClinicalNote>(() => {
    if (existing) return existing;
    let patientId = presetPatient ?? "";
    let patientName = "";
    let appointmentId: string | undefined;
    if (presetAppt) {
      const appt = mockAppointments.find((a) => a.id === presetAppt);
      if (appt) {
        appointmentId = appt.id;
        patientId = appt.patientId;
      }
    }
    if (patientId) {
      patientName = mockPatients.find((p) => p.id === patientId)?.fullName ?? "";
    }
    return {
      ...empty,
      patientId,
      patientName,
      appointmentId,
      subjective: draftScratch ?? "",
    };
  }, [existing, presetAppt, presetPatient, draftScratch]);

  const [note, setNote] = React.useState<ClinicalNote>(initial);
  const [savedAt, setSavedAt] = React.useState<Date | null>(null);
  const [riskOpen, setRiskOpen] = React.useState(false);
  const readOnly = note.status === "FINALIZED";

  React.useEffect(() => {
    if (readOnly) return;
    const t = setTimeout(() => setSavedAt(new Date()), 800);
    return () => clearTimeout(t);
  }, [note, readOnly]);

  const setField = <K extends keyof ClinicalNote>(k: K, v: ClinicalNote[K]) =>
    setNote((n) => ({ ...n, [k]: v, updatedAt: new Date().toISOString() }));

  const toggleRisk = (flag: keyof ClinicalNote["riskFlags"]) => {
    const next = { ...note.riskFlags, [flag]: !note.riskFlags[flag] };
    setNote((n) => ({ ...n, riskFlags: next, updatedAt: new Date().toISOString() }));
    if (next[flag]) setRiskOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/clinical-notes" className="text-sm text-muted-foreground hover:underline">
            ← Clinical notes
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">
            {existing ? "Clinical note" : "New clinical note"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Patient:{" "}
            {note.patientId ? (
              <Link to={`/patients/${note.patientId}`} className="font-medium text-foreground hover:underline">
                {note.patientName}
              </Link>
            ) : (
              <span className="italic">unassigned</span>
            )}
            {note.appointmentId && (
              <>
                {" "}
                · Appointment{" "}
                <Link to={`/appointments/${note.appointmentId}`} className="text-primary hover:underline">
                  {note.appointmentId}
                </Link>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={note.status === "FINALIZED" ? "default" : "warning"}>
            {note.status}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {savedAt ? `Auto-saved ${format(savedAt, "HH:mm:ss")}` : "Auto-saves every 10s"}
          </span>
          {!readOnly && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setField("status", "FINALIZED")}
            >
              <Lock className="h-4 w-4" /> Finalize note
            </Button>
          )}
        </div>
      </div>

      {readOnly && (
        <div className="rounded-md border-l-4 border-primary bg-accent/40 p-3 text-sm">
          This note has been <strong>finalized</strong> and is now read-only. Contact an admin to
          unlock.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {!note.patientId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Attach patient</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={note.patientId}
                  onChange={(e) => {
                    const p = mockPatients.find((x) => x.id === e.target.value);
                    setNote((n) => ({
                      ...n,
                      patientId: p?.id ?? "",
                      patientName: p?.fullName ?? "",
                    }));
                  }}
                >
                  <option value="">Choose a patient…</option>
                  {mockPatients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>
          )}

          <SOAPField
            label="Subjective"
            hint="What the patient reported."
            value={note.subjective}
            onChange={(v) => setField("subjective", v)}
            readOnly={readOnly}
          />
          <SOAPField
            label="Objective"
            hint="Therapist observations, scores."
            value={note.objective}
            onChange={(v) => setField("objective", v)}
            readOnly={readOnly}
          />
          <SOAPField
            label="Assessment"
            hint="Diagnosis impression, risk level."
            value={note.assessment}
            onChange={(v) => setField("assessment", v)}
            readOnly={readOnly}
          />
          <SOAPField
            label="Plan"
            hint="Next steps, homework, referrals."
            value={note.plan}
            onChange={(v) => setField("plan", v)}
            readOnly={readOnly}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="One-line summary (shown in list view)"
                value={note.summary ?? ""}
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
              {(Object.keys(note.riskFlags) as Array<keyof ClinicalNote["riskFlags"]>).map((flag) => (
                <label key={flag} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={note.riskFlags[flag]}
                    disabled={readOnly}
                    onChange={() => toggleRisk(flag)}
                  />
                  <span className="capitalize">{flag.replace(/([A-Z])/g, " $1")}</span>
                </label>
              ))}
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
          rows={6}
          value={value}
          disabled={readOnly}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Write the ${label.toLowerCase()} section…`}
        />
      </CardContent>
    </Card>
  );
}
