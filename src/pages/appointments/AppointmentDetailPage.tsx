import * as React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { differenceInMinutes, format, isPast, parseISO } from "date-fns";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
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
import { mockAppointments, mockDiary, mockNotes, mockPatients } from "@/lib/mockData";

const TEN_MINUTES_MS = 10 * 60 * 1000;

export function AppointmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState("");

  const appt = mockAppointments.find((a) => a.id === id);
  if (!appt) {
    return <p className="p-6 text-muted-foreground">Appointment not found.</p>;
  }

  const patient = mockPatients.find((p) => p.id === appt.patientId);
  const note = mockNotes.find((n) => n.appointmentId === appt.id);
  const start = parseISO(appt.startsAt);
  const end = parseISO(appt.endsAt);
  const now = new Date();
  const inJoinWindow =
    now.getTime() >= start.getTime() - TEN_MINUTES_MS && now.getTime() <= end.getTime();
  const isUpcoming = !isPast(start);
  const minutesToStart = differenceInMinutes(start, now);

  const recentDiary = mockDiary
    .filter((d) => d.patientId === appt.patientId)
    .slice(0, 5);

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
        <AppointmentStatusBadge status={appt.status} />
      </div>

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
              <div className="md:col-span-2">
                <p className="text-xs uppercase text-muted-foreground">Patient's stated reason</p>
                <p className="mt-1">{appt.reason}</p>
              </div>
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

          {isUpcoming && recentDiary.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Patient's recent diary (last 5)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentDiary.map((d) => (
                  <div key={d.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{d.title}</p>
                      <Badge variant="muted">{d.mood}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {format(parseISO(d.createdAt), "PP")}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{d.body}</p>
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
                      <Link to={`/clinical-notes/${note.id}`}>
                        Open ({note.status === "DRAFT" ? "draft" : "finalized"})
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild size="sm">
                      <Link to={`/clinical-notes/new?appointmentId=${appt.id}`}>
                        Write clinical note
                      </Link>
                    </Button>
                  )}
                </div>
                <div className="rounded-md border p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-warning" />
                    <span className="font-medium">Patient's review: 5 / 5</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    "Doctor really listened. The breathing exercise helped me sleep."
                  </p>
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
              {patient && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>{initials(patient.fullName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{patient.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        Age {patient.age} · {patient.gender.toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {patient.tags.map((t) => (
                      <Badge key={t} variant="secondary">
                        {t}
                      </Badge>
                    ))}
                  </div>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link to={`/patients/${patient.id}`}>View full profile</Link>
                  </Button>
                </div>
              )}
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
                  onClick={() => navigate(`/appointments/${appt.id}/video`)}
                >
                  <Video className="h-4 w-4" />
                  {inJoinWindow
                    ? "Join video session"
                    : `Join opens in ${Math.max(0, minutesToStart - 10)} min`}
                </Button>
              )}
              {isUpcoming && appt.mode === "CHAT" && (
                <Button asChild className="w-full">
                  <Link to={`/messages?channel=c_${appt.patientId}`}>
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
