import * as React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { differenceInMinutes, format, isPast, parseISO } from "date-fns";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Loader2,
  MessageCircle,
  Star,
  Video,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AppointmentStatusBadge } from "@/components/StatusBadge";
import { initials } from "@/lib/utils";
import {
  fetchTherapistAppointments,
  type AppointmentRow,
} from "@/lib/api/therapistAppointments";
import { getProfileSummary, type ProfileSummary } from "@/lib/api/auth";
import { listDiary, type DiaryEntryResponse } from "@/lib/api/tracking";
import {
  getClinicalNoteByAppointment,
  type ClinicalNoteResponse,
} from "@/lib/api/therapist";
import { ApiError } from "@/lib/api/http";
import type { AppointmentStatus } from "@/types";

const TEN_MINUTES_MS = 10 * 60 * 1000;

const statusMap: Record<string, AppointmentStatus> = {
  REQUESTED: "REQUESTED",
  UPCOMING: "CONFIRMED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
};

export function AppointmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState("");

  const [appt, setAppt] = React.useState<AppointmentRow | null>(null);
  const [patient, setPatient] = React.useState<ProfileSummary | null>(null);
  const [diary, setDiary] = React.useState<DiaryEntryResponse[]>([]);
  const [note, setNote] = React.useState<ClinicalNoteResponse | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    fetchTherapistAppointments()
      .then(async ({ appointments }) => {
        const a = appointments.find((x) => x.appointmentId === id);
        if (!a) return;
        if (cancelled) return;
        setAppt(a);
        const [profileR, diaryR, noteR] = await Promise.allSettled([
          getProfileSummary(a.patientId),
          listDiary(a.patientId),
          getClinicalNoteByAppointment(a.appointmentId),
        ]);
        if (cancelled) return;
        if (profileR.status === "fulfilled") setPatient(profileR.value);
        if (diaryR.status === "fulfilled") setDiary(diaryR.value.slice(0, 5));
        if (noteR.status === "fulfilled") setNote(noteR.value);
      })
      .catch((err) => {
        if (err instanceof ApiError) console.warn("Appointment load failed", err.status);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!appt) {
    return <p className="p-6 text-muted-foreground">Appointment not found.</p>;
  }

  const start = parseISO(appt.startDatetime);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const now = new Date();
  const inJoinWindow =
    now.getTime() >= start.getTime() - TEN_MINUTES_MS && now.getTime() <= end.getTime();
  const isUpcoming = !isPast(start);
  const minutesToStart = differenceInMinutes(start, now);
  const uiStatus = statusMap[appt.status] ?? "CONFIRMED";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/appointments" className="text-sm text-muted-foreground hover:underline">
            ← Back to appointments
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">Session with {appt.patientName}</h1>
          <p className="text-sm text-muted-foreground">
            {format(start, "EEEE, d LLLL yyyy 'at' HH:mm")} ({appt.mode})
          </p>
        </div>
        <AppointmentStatusBadge status={uiStatus} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Session info</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-2">
              <InfoRow icon={CalendarClock} label="Starts" value={format(start, "PP HH:mm")} />
              <InfoRow icon={CalendarClock} label="Ends (≈)" value={format(end, "PP HH:mm")} />
              <InfoRow
                icon={appt.mode === "VIDEO" ? Video : MessageCircle}
                label="Mode"
                value={appt.mode}
              />
              <InfoRow icon={ClipboardList} label="Slot ID" value={appt.slotId} />
            </CardContent>
          </Card>

          {isUpcoming && (
            <Card>
              <CardHeader>
                <CardTitle>Pre-session checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <ChecklistItem
                  label="Review patient's recent diary entries"
                  to={`/patients/${appt.patientId}?tab=diary`}
                />
                <ChecklistItem
                  label="Review previous clinical notes"
                  to={`/patients/${appt.patientId}?tab=notes`}
                />
                <ChecklistItem label="Confirm video equipment" />
              </CardContent>
            </Card>
          )}

          {isUpcoming && diary.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Patient's recent diary (last 5)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {diary.map((d) => (
                  <div key={d.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{d.title ?? "Diary entry"}</p>
                      {d.moodTag && <Badge variant="muted">{d.moodTag}</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {format(parseISO(d.createdAt), "PP")}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{d.content}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {!isUpcoming && appt.status === "COMPLETED" && (
            <Card>
              <CardHeader>
                <CardTitle>Post-session</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <span>Clinical note</span>
                  {note ? (
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/clinical-notes/${appt.appointmentId}`}>
                        Open
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild size="sm">
                      <Link to={`/clinical-notes/new?appointmentId=${appt.appointmentId}`}>
                        Write clinical note
                      </Link>
                    </Button>
                  )}
                </div>
                <div className="rounded-md border p-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-warning" />
                    <span className="font-medium text-foreground">
                      Patient reviews are visible on your therapist profile page.
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Patient</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{initials(appt.patientName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{appt.patientName}</p>
                    {patient?.email && (
                      <p className="text-xs text-muted-foreground">{patient.email}</p>
                    )}
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to={`/patients/${appt.patientId}`}>View full profile</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isUpcoming && appt.mode === "VIDEO" && (
                <Button
                  className="w-full"
                  disabled={!inJoinWindow}
                  onClick={() => navigate(`/appointments/${appt.appointmentId}/video`)}
                >
                  <Video className="h-4 w-4" />
                  {inJoinWindow
                    ? "Join video session"
                    : `Join opens in ${Math.max(0, minutesToStart - 10)} min`}
                </Button>
              )}
              {isUpcoming && appt.mode === "CHAT" && (
                <Button asChild className="w-full">
                  <Link to={`/messages?patient=${appt.patientId}`}>
                    <MessageCircle className="h-4 w-4" /> Open chat
                  </Link>
                </Button>
              )}
              {isUpcoming && (
                <>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/availability">Reschedule</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-destructive"
                    onClick={() => setCancelOpen(true)}
                  >
                    <X className="h-4 w-4" /> Cancel session
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel session?</DialogTitle>
            <DialogDescription>
              {appt.patientName} will be notified by email and in-app.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for cancellation (visible to patient)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCancelOpen(false)}>
              Keep session
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setCancelOpen(false);
                navigate("/appointments");
              }}
            >
              <CheckCircle2 className="h-4 w-4" /> Cancel session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-xs uppercase text-muted-foreground">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  );
}

function ChecklistItem({ label, to }: { label: string; to?: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border p-2 text-sm">
      <label className="flex items-center gap-2">
        <input type="checkbox" className="h-4 w-4" />
        {label}
      </label>
      {to && (
        <Button asChild variant="ghost" size="sm">
          <Link to={to}>Open</Link>
        </Button>
      )}
    </div>
  );
}
