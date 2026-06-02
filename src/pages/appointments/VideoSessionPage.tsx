import * as React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Loader2, NotebookPen, PhoneOff, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  getAppointmentDetail,
  joinSession,
  type AppointmentDetail,
} from "@/lib/api/therapist";
import { listDiary, type DiaryEntryResponse } from "@/lib/api/tracking";

const JITSI_SERVER_URL = "https://meet.jit.si";

// Mirror the mobile app's room naming: `umatter-<appointmentId>`, stripped of
// anything Jitsi can't put in a room URL.
const buildMeetingUrl = (appointmentId: string): string => {
  const room = `umatter-${appointmentId}`
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9\-_]/g, "");
  return `${JITSI_SERVER_URL}/${encodeURIComponent(room)}`;
};

export function VideoSessionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appt, setAppt] = React.useState<AppointmentDetail | null>(null);
  const [diary, setDiary] = React.useState<DiaryEntryResponse[]>([]);
  const [scratch, setScratch] = React.useState("");
  const [saved, setSaved] = React.useState<Date | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [joining, setJoining] = React.useState(false);
  const [joinError, setJoinError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!scratch) return;
    const t = setTimeout(() => setSaved(new Date()), 1000);
    return () => clearTimeout(t);
  }, [scratch]);

  React.useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const a = await getAppointmentDetail(id);
        if (cancelled) return;
        setAppt(a);
        try {
          const d = await listDiary(a.profileId);
          if (!cancelled) setDiary(d.slice(0, 5));
        } catch {
          // permission may not be granted
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to start session");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="grid h-[calc(100vh-3rem)] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid h-[calc(100vh-3rem)] place-items-center text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!appt) return <p className="p-6">Appointment not found.</p>;

  const handleJoin = async () => {
    if (!id || joining) return;
    setJoining(true);
    setJoinError(null);
    try {
      // Send the join request; we only care that the backend returns 200 OK
      // (apiFetch throws on any non-2xx), not about the response payload.
      await joinSession(id);
      window.open(buildMeetingUrl(id), "_blank", "noopener,noreferrer");
    } catch (e: any) {
      setJoinError(e?.message ?? "Failed to join the meeting");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col">
      <div className="flex items-center justify-between border-b bg-card px-4 py-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/appointments/${appt.appointmentId}`}>
            <ArrowLeft className="h-4 w-4" /> Back to appointment
          </Link>
        </Button>
        <div className="text-sm text-muted-foreground">
          {appt.patientName ?? appt.profileId.slice(0, 8)} ·{" "}
          {format(parseISO(appt.startDatetime), "HH:mm")}
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() =>
            navigate(
              `/clinical-notes/new?appointmentId=${appt.appointmentId}&draft=${encodeURIComponent(scratch)}`,
            )
          }
        >
          <PhoneOff className="h-4 w-4" /> End & write note
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="grid flex-1 place-items-center bg-black/90 text-white">
          <div className="flex flex-col items-center gap-4 px-6 text-center">
            <Button size="lg" onClick={handleJoin} disabled={joining}>
              {joining ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Video className="h-4 w-4" />
              )}
              Join the Jitsi meeting
            </Button>
            {joinError && <p className="text-sm text-destructive">{joinError}</p>}
          </div>
        </div>

        <aside className="w-96 shrink-0 space-y-3 overflow-y-auto scrollbar-thin border-l bg-card p-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Patient's reason</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">{appt.reason ?? "—"}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent diary (last 5)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {diary.length === 0 && (
                <p className="text-xs text-muted-foreground">No entries or no permission.</p>
              )}
              {diary.map((d) => (
                <div key={d.id} className="rounded-md border p-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{d.title ?? "Entry"}</span>
                    {d.moodTag && <Badge variant="muted">{d.moodTag}</Badge>}
                  </div>
                  <p className="text-muted-foreground">{format(parseISO(d.createdAt), "PP")}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-sm">
                <NotebookPen className="h-4 w-4" /> Scratchpad
              </CardTitle>
              <span className="text-[10px] text-muted-foreground">
                {saved ? `Saved ${format(saved, "HH:mm:ss")}` : "Auto-saves"}
              </span>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={12}
                placeholder="Quick notes during the session — these flow into the clinical note."
                value={scratch}
                onChange={(e) => setScratch(e.target.value)}
              />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
