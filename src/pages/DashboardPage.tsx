import { Link } from "react-router-dom";
import { format, isSameDay, isWithinInterval, parseISO, startOfWeek } from "date-fns";
import {
  AlertTriangle,
  CalendarCheck,
  ClipboardList,
  MessagesSquare,
  Star,
  Users,
  Video,
  MessageCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import { mockAppointments, mockNotes, mockPatients } from "@/lib/mockData";
import { useAuth } from "@/context/AuthContext";

const TEN_MINUTES_MS = 10 * 60 * 1000;

export function DashboardPage() {
  const { user } = useAuth();
  const now = new Date();

  const todays = mockAppointments
    .filter((a) => isSameDay(parseISO(a.startsAt), now) && a.status !== "CANCELLED")
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
  const apptsByDay = (d: Date) =>
    mockAppointments.filter((a) => isSameDay(parseISO(a.startsAt), d) && a.status !== "CANCELLED")
      .length;

  const pendingBookings = mockAppointments.filter((a) => a.status === "REQUESTED").length;
  const recentGrants = mockPatients.filter((p) => p.permission.theyGaveMeAccess).slice(0, 2);
  const draftNotes = mockNotes.filter((n) => n.status === "DRAFT").length;

  const completedThisMonth = mockAppointments.filter((a) => a.status === "COMPLETED").length;
  const activePatients = mockPatients.filter((p) => p.lastSessionAt).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">
            Good morning, {user?.fullName?.split(" ").slice(-1)} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            {format(now, "EEEE, d LLLL yyyy")} · You have {todays.length} sessions today.
          </p>
        </div>
        <Button asChild>
          <Link to="/availability">Manage availability</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Users} label="Active patients" value={activePatients} />
        <Kpi icon={CalendarCheck} label="Sessions this month" value={completedThisMonth} />
        <Kpi icon={Star} label="Avg rating" value={"4.8 / 5"} />
        <Kpi icon={ClipboardList} label="Draft notes" value={draftNotes} accent="warning" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Today's schedule</CardTitle>
              <CardDescription>Join opens 10 minutes before each session.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/appointments">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {todays.length === 0 && (
              <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                No sessions scheduled today. Enjoy the breathing room.
              </p>
            )}
            {todays.map((a) => {
              const start = parseISO(a.startsAt);
              const inWindow = isWithinInterval(now, {
                start: new Date(start.getTime() - TEN_MINUTES_MS),
                end: parseISO(a.endsAt),
              });
              return (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{initials(a.patientName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{a.patientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(start, "HH:mm")} · {a.reason}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={a.mode === "VIDEO" ? "default" : "secondary"}>
                      {a.mode === "VIDEO" ? (
                        <>
                          <Video className="mr-1 h-3 w-3" /> Video
                        </>
                      ) : (
                        <>
                          <MessageCircle className="mr-1 h-3 w-3" /> Chat
                        </>
                      )}
                    </Badge>
                    <Button
                      size="sm"
                      asChild
                      variant={inWindow ? "default" : "outline"}
                      disabled={!inWindow}
                    >
                      <Link to={`/appointments/${a.id}`}>
                        {inWindow ? "Join" : "Open"}
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>This week</CardTitle>
            <CardDescription>Session count per day.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((d) => {
                const count = apptsByDay(d);
                const isToday = isSameDay(d, now);
                return (
                  <div
                    key={d.toISOString()}
                    className={`rounded-md border p-2 text-center ${isToday ? "border-primary bg-accent" : ""}`}
                  >
                    <div className="text-[10px] uppercase text-muted-foreground">
                      {format(d, "EEE")}
                    </div>
                    <div className="mt-0.5 text-sm font-semibold">{format(d, "d")}</div>
                    <div
                      className={`mt-1 text-xs ${count > 0 ? "text-primary" : "text-muted-foreground"}`}
                    >
                      {count > 0 ? `${count}` : "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pending actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Action
              icon={MessagesSquare}
              title={`${pendingBookings} new booking${pendingBookings === 1 ? "" : "s"} awaiting confirmation`}
              cta="Review"
              to="/appointments?tab=upcoming"
            />
            <Action
              icon={Users}
              title={`${recentGrants.length} patient${recentGrants.length === 1 ? "" : "s"} granted you data access`}
              cta="Open"
              to="/patients?perm=granted"
            />
            <Action
              icon={ClipboardList}
              title={`${draftNotes} session${draftNotes === 1 ? "" : "s"} with unfinished clinical notes`}
              cta="Write"
              to="/clinical-notes?status=draft"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Alerts
            </CardTitle>
            <CardDescription>Patients with concerning recent tracking data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border-l-4 border-destructive bg-destructive/5 p-3">
              <p className="text-sm font-medium">3 patients reported sleep quality ≤ 2 for 4+ nights.</p>
              <p className="text-xs text-muted-foreground">Including Lê Bảo Hân, Trần Quốc Việt.</p>
            </div>
            <div className="rounded-md border-l-4 border-warning bg-warning/5 p-3">
              <p className="text-sm font-medium">Trần Quốc Việt's mood trended low all week.</p>
              <p className="text-xs text-muted-foreground">Consider safety check on next session.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: any;
  label: string;
  value: string | number;
  accent?: "warning";
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={`grid h-10 w-10 place-items-center rounded-md ${accent === "warning" ? "bg-warning/15 text-warning" : "bg-accent text-primary"}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="text-xl font-semibold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function Action({
  icon: Icon,
  title,
  cta,
  to,
}: {
  icon: any;
  title: string;
  cta: string;
  to: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{title}</span>
      </div>
      <Button asChild variant="outline" size="sm">
        <Link to={to}>{cta}</Link>
      </Button>
    </div>
  );
}
