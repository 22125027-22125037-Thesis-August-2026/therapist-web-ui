import * as React from "react";
import { Link } from "react-router-dom";
import { format, isSameDay, isWithinInterval, parseISO, startOfWeek, isAfter } from "date-fns";
import {
  AlertTriangle,
  CalendarCheck,
  ClipboardList,
  Loader2,
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
import { useAuth } from "@/context/AuthContext";
import { listChannels, type ChannelItem } from "@/lib/api/social";
import {
  getAppointmentHistory,
  getUpcomingAppointment,
  type AppointmentSummary,
} from "@/lib/api/therapist";
import { ApiError } from "@/lib/api/http";

const TEN_MINUTES_MS = 10 * 60 * 1000;

interface AppointmentWithPatient extends AppointmentSummary {
  patientName: string;
}

export function DashboardPage() {
  const { user } = useAuth();
  const now = React.useMemo(() => new Date(), []);

  const [channels, setChannels] = React.useState<ChannelItem[]>([]);
  const [upcoming, setUpcoming] = React.useState<AppointmentWithPatient[]>([]);
  const [history, setHistory] = React.useState<AppointmentWithPatient[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listChannels()
      .then(async (chs) => {
        if (cancelled) return;
        setChannels(chs ?? []);
        const upcomingResults = await Promise.allSettled(
          (chs ?? []).map((c) =>
            getUpcomingAppointment(c.counterpartProfileId).then((a) => ({
              ...a,
              patientName: c.counterpartDisplayName ?? c.counterpartProfilename,
            })),
          ),
        );
        const historyResults = await Promise.allSettled(
          (chs ?? []).map((c) =>
            getAppointmentHistory(c.counterpartProfileId).then((list) =>
              list.map((a) => ({
                ...a,
                patientName: c.counterpartDisplayName ?? c.counterpartProfilename,
              })),
            ),
          ),
        );
        if (cancelled) return;
        setUpcoming(
          upcomingResults
            .filter((r): r is PromiseFulfilledResult<AppointmentWithPatient> => r.status === "fulfilled")
            .map((r) => r.value),
        );
        setHistory(
          historyResults
            .filter((r): r is PromiseFulfilledResult<AppointmentWithPatient[]> => r.status === "fulfilled")
            .flatMap((r) => r.value),
        );
      })
      .catch((err) => {
        if (err instanceof ApiError) {
          console.warn("Dashboard load failed", err.status, err.message);
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const todays = upcoming
    .filter((a) => isSameDay(parseISO(a.startDatetime), now) && a.status !== "CANCELLED")
    .sort((a, b) => a.startDatetime.localeCompare(b.startDatetime));

  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
  const apptsByDay = (d: Date) =>
    upcoming.filter((a) => isSameDay(parseISO(a.startDatetime), d) && a.status !== "CANCELLED")
      .length;

  const pendingBookings = upcoming.filter((a) => a.status === "REQUESTED").length;
  const recentGrants = channels.filter((c) => c.unreadCount > 0).slice(0, 2);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const completedThisMonth = history.filter(
    (a) => a.status === "COMPLETED" && isAfter(parseISO(a.startDatetime), monthStart),
  ).length;
  const activePatients = channels.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">
            Welcome, {user?.fullName?.split(" ").slice(-1)?.[0] ?? "Doctor"} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            {format(now, "EEEE, d LLLL yyyy")} · You have {todays.length} session
            {todays.length === 1 ? "" : "s"} today.
          </p>
        </div>
        <Button asChild>
          <Link to="/availability">Manage availability</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Users} label="Active patients" value={activePatients} />
        <Kpi icon={CalendarCheck} label="Sessions this month" value={completedThisMonth} />
        <Kpi icon={Star} label="Avg rating" value={"—"} />
        <Kpi icon={ClipboardList} label="Draft notes" value={"—"} accent="warning" />
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
            {loading && (
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            {!loading && todays.length === 0 && (
              <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                No sessions scheduled today. Enjoy the breathing room.
              </p>
            )}
            {!loading &&
              todays.map((a) => {
                const start = parseISO(a.startDatetime);
                const inWindow = isWithinInterval(now, {
                  start: new Date(start.getTime() - TEN_MINUTES_MS),
                  end: new Date(start.getTime() + 60 * 60 * 1000),
                });
                return (
                  <div
                    key={a.appointmentId}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{initials(a.patientName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{a.patientName}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(start, "HH:mm")} · {a.therapistSpecialization ?? "Session"}
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
                        <Link to={`/appointments/${a.appointmentId}`}>
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
              title={`${pendingBookings} booking${pendingBookings === 1 ? "" : "s"} awaiting confirmation`}
              cta="Review"
              to="/appointments?tab=upcoming"
            />
            <Action
              icon={Users}
              title={`${recentGrants.length} channel${recentGrants.length === 1 ? "" : "s"} with unread messages`}
              cta="Open"
              to="/messages"
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
            {channels.filter((c) => c.moodAlert).length === 0 && (
              <p className="text-sm text-muted-foreground">No active alerts.</p>
            )}
            {channels
              .filter((c) => c.moodAlert)
              .map((c) => (
                <div
                  key={c.channelId}
                  className="rounded-md border-l-4 border-warning bg-warning/5 p-3"
                >
                  <p className="text-sm font-medium">
                    {c.counterpartDisplayName ?? c.counterpartProfilename}
                  </p>
                  <p className="text-xs text-muted-foreground">{c.moodAlert}</p>
                </div>
              ))}
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
