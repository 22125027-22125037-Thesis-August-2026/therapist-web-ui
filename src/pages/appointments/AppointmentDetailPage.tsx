import * as React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { differenceInMinutes, format, isPast, parseISO } from "date-fns";
import {
  CalendarClock,
  Check,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  cancelAppointment,
  confirmBooking,
  getAppointmentDetail,
  getClinicalNoteByAppointment,
  rejectBooking,
  type AppointmentDetail,
  type AppointmentStatusServer,
  type ClinicalNoteResponse,
} from "@/lib/api/therapist";
import { getPatientDetail, type PatientDetailResponse } from "@/lib/api/auth";
import { listDiary, type DiaryEntryResponse } from "@/lib/api/tracking";
import { ApiError } from "@/lib/api/http";
import type { AppointmentStatus } from "@/types";

const TEN_MINUTES_MS = 10 * 60 * 1000;

const statusUiMap: Record<AppointmentStatusServer, AppointmentStatus> = {
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
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [actionReason, setActionReason] = React.useState("");
  const [actionBusy, setActionBusy] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const [appt, setAppt] = React.useState<AppointmentDetail | null>(null);
  const [patient, setPatient] = React.useState<PatientDetailResponse | null>(null);
  const [diary, setDiary] = React.useState<DiaryEntryResponse[]>([]);
  const [note, setNote] = React.useState<ClinicalNoteResponse | null>(null);
  const [loading, setLoading] = React.useState(true);

  const reload = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const a = await getAppointmentDetail(id);
      setAppt(a);
      const [patientR, diaryR, noteR] = await Promise.allSettled([
        getPatientDetail(a.profileId),
        listDiary(a.profileId),
        getClinicalNoteByAppointment(a.appointmentId),
      ]);
      if (patientR.status === "fulfilled") setPatient(patientR.value);
      if (diaryR.status === "fulfilled") setDiary(diaryR.value.slice(0, 5));
      if (noteR.status === "fulfilled") setNote(noteR.value);
      else setNote(null);
    } catch (err) {
      if (err instanceof ApiError) console.warn("appointment load failed", err.status);
      setAppt(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    void reload();
  }, [reload]);

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
  const end = appt.endDatetime
    ? parseISO(appt.endDatetime)
    : new Date(start.getTime() + 60 * 60 * 1000);
  const now = new Date();
  const inJoinWindow =
    now.getTime() >= start.getTime() - TEN_MINUTES_MS && now.getTime() <= end.getTime();
  const isUpcoming = !isPast(start);
  const minutesToStart = differenceInMinutes(start, now);
  const uiStatus = statusUiMap[appt.status];

  const isRequested = appt.status === "REQUESTED";
  const canConfirmReject = isRequested && minutesToStart > 120;
  const canCancelUpcoming =
    (appt.status === "UPCOMING" || appt.status === "IN_PROGRESS") &&
    differenceInMinutes(start, now) > 60;

  const handleConfirm = async () => {
    setActionBusy(true);
    setActionError(null);
    try {
      await confirmBooking(appt.appointmentId);
      await reload();
    } catch (e: any) {
      setActionError(e?.message ?? "Failed to confirm");
    } finally {
      setActionBusy(false);
    }
  };

  const handleReject = async () => {
    setActionBusy(true);
    setActionError(null);
    try {
      await rejectBooking(appt.appointmentId, actionReason || undefined);
      setRejectOpen(false);
      setActionReason("");
      await reload();
    } catch (e: any) {
      setActionError(e?.message ?? "Failed to reject");
    } finally {
      setActionBusy(false);
    }
  };

  const handleCancel = async () => {
    if (!actionReason.trim()) {
      setActionError("Reason is required.");
      return;
    }
    setActionBusy(true);
    setActionError(null);
    try {
      await cancelAppointment(appt.appointmentId, actionReason);
      setCancelOpen(false);
      setActionReason("");
      await reload();
    } catch (e: any) {
      setActionError(e?.message ?? "Failed to cancel");
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/appointments" className="text-sm text-muted-foreground hover:underline">
            ← Back to appointments
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">
            Session with {appt.patientName ?? patient?.fullName ?? "patient"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {format(start, "EEEE, d LLLL yyyy 'at' HH:mm")} ({appt.mode})
          </p>
        </div>
        <AppointmentStatusBadge status={uiStatus} />
      </div>

      {appt.status === "CANCELLED" && appt.cancellationReason && (
        <div className="rounded-md border-l-4 border-destructive bg-destructive/5 p-3 text-sm">
          <p className="font-medium">Cancelled</p>
          <p className="text-muted-foreground">{appt.cancellationReason}</p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Session info</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-2">
              <InfoRow icon={CalendarClock} label="Starts" value={format(start, "PP HH:mm")} />
              <InfoRow icon={CalendarClock} label="Ends" value={format(end, "PP HH:mm")} />
              <InfoRow
                icon={appt.mode === "VIDEO" ? Video : MessageCircle}
                label="Mode"
                value={appt.mode}
              />
              <InfoRow icon={ClipboardList} label="Slot ID" value={appt.slotId} />
              {appt.reason && (
                <div className="md:col-span-2">
                  <p className="text-xs uppercase text-muted-foreground">
                    Patient's stated reason
                  </p>
                  <p className="mt-1">{appt.reason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {isRequested && (
            <Card>
              <CardHeader>
                <CardTitle>Decision required</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  This booking is awaiting your decision. You have until 2 hours before the
                  start time to confirm or reject — after that the auto-reject sweep will
                  cancel it.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={handleConfirm}
                    disabled={!canConfirmReject || actionBusy}
                  >
                    {actionBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Confirm booking
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!canConfirmReject || actionBusy}
                    onClick={() => {
                      setRejectOpen(true);
                      setActionReason("");
                      setActionError(null);
                    }}
                  >
                    <X className="h-4 w-4" /> Reject
                  </Button>
                  {!canConfirmReject && (
                    <span className="text-xs text-warning">
                      Decision window has closed ({"<"} 2 h to start).
                    </span>
                  )}
                </div>
                {actionError && (
                  <p className="text-xs text-destructive">{actionError}</p>
                )}
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
                      <Link to={`/clinical-notes/${note.noteId}`}>
                        Open ({note.status ?? "FINALIZED"})
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
                    {patient?.avatarUrl && <AvatarImage src={patient.avatarUrl} alt="" />}
                    <AvatarFallback>
                      {initials(appt.patientName ?? patient?.fullName ?? "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {appt.patientName ?? patient?.fullName ?? "—"}
                    </p>
                    {patient && (
                      <p className="text-xs text-muted-foreground">
                        {patient.age != null && `Age ${patient.age}`}
                        {patient.gender && ` · ${patient.gender.toLowerCase()}`}
                      </p>
                    )}
                    {patient?.email && (
                      <p className="text-xs text-muted-foreground">{patient.email}</p>
                    )}
                  </div>
                </div>
                {patient?.emergencyContact && (
                  <div className="rounded-md border bg-warning/5 p-2 text-xs">
                    <p className="font-medium">Emergency contact</p>
                    <p className="text-muted-foreground">{patient.emergencyContact}</p>
                  </div>
                )}
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to={`/patients/${appt.profileId}`}>View full profile</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(appt.status === "UPCOMING" || appt.status === "IN_PROGRESS") &&
                appt.mode === "VIDEO" && (
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
              {(appt.status === "UPCOMING" || appt.status === "IN_PROGRESS") &&
                appt.mode !== "VIDEO" && (
                  <Button asChild className="w-full">
                    <Link to={`/messages?patient=${appt.profileId}`}>
                      <MessageCircle className="h-4 w-4" /> Open chat
                    </Link>
                  </Button>
                )}
              {(appt.status === "REQUESTED" ||
                appt.status === "UPCOMING" ||
                appt.status === "IN_PROGRESS") && (
                <Button
                  variant="ghost"
                  className="w-full text-destructive"
                  disabled={appt.status !== "REQUESTED" && !canCancelUpcoming}
                  onClick={() => {
                    setCancelOpen(true);
                    setActionReason("");
                    setActionError(null);
                  }}
                >
                  <X className="h-4 w-4" /> Cancel session
                </Button>
              )}
              {appt.status !== "REQUESTED" && !canCancelUpcoming && isUpcoming && (
                <p className="text-[10px] text-warning">
                  Cancellation closed (within 1 h of start).
                </p>
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
              {appt.patientName ?? patient?.fullName ?? "The patient"} will be notified.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for cancellation (required)"
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
          />
          {actionError && <p className="text-xs text-destructive">{actionError}</p>}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCancelOpen(false)} disabled={actionBusy}>
              Keep session
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={actionBusy || !actionReason.trim()}
            >
              {actionBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Cancel session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject this booking request?</DialogTitle>
            <DialogDescription>
              The slot will be released so other patients can book it.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason (optional, shown to the patient)"
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
          />
          {actionError && <p className="text-xs text-destructive">{actionError}</p>}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectOpen(false)} disabled={actionBusy}>
              Keep
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={actionBusy}>
              {actionBusy && <Loader2 className="h-4 w-4 animate-spin" />}
              Reject booking
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
