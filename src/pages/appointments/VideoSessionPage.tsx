import * as React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ArrowLeft, NotebookPen, PhoneOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { mockAppointments, mockDiary } from "@/lib/mockData";

export function VideoSessionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const appt = mockAppointments.find((a) => a.id === id);
  const [scratch, setScratch] = React.useState("");
  const [saved, setSaved] = React.useState<Date | null>(null);

  React.useEffect(() => {
    if (!scratch) return;
    const t = setTimeout(() => setSaved(new Date()), 1000);
    return () => clearTimeout(t);
  }, [scratch]);

  if (!appt) return <p className="p-6">Appointment not found.</p>;
  const recentDiary = mockDiary.filter((d) => d.patientId === appt.patientId).slice(0, 5);
  const roomName = appt.videoRoomName ?? `umatter-${appt.id}`;

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col">
      <div className="flex items-center justify-between border-b bg-card px-4 py-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/appointments/${appt.id}`}>
            <ArrowLeft className="h-4 w-4" /> Back to appointment
          </Link>
        </Button>
        <div className="text-sm text-muted-foreground">
          {appt.patientName} · {format(parseISO(appt.startsAt), "HH:mm")} · room {roomName}
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => navigate(`/clinical-notes/new?appointmentId=${appt.id}&draft=${encodeURIComponent(scratch)}`)}
        >
          <PhoneOff className="h-4 w-4" /> End & write note
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="grid flex-1 place-items-center bg-black/90 text-white">
          <iframe
            title="Jitsi video room"
            src={`https://meet.jit.si/${roomName}#userInfo.displayName=%22Therapist%22&config.prejoinPageEnabled=false`}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="h-full w-full border-0"
          />
        </div>

        <aside className="w-96 shrink-0 space-y-3 overflow-y-auto scrollbar-thin border-l bg-card p-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Patient's reason</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">{appt.reason}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent diary (last 5)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentDiary.length === 0 && (
                <p className="text-xs text-muted-foreground">No entries or no permission.</p>
              )}
              {recentDiary.map((d) => (
                <div key={d.id} className="rounded-md border p-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{d.title}</span>
                    <Badge variant="muted">{d.mood}</Badge>
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
