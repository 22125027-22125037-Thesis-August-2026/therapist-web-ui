import * as React from "react";
import { Link } from "react-router-dom";
import { format, isSameDay, isWithinInterval, parseISO, startOfWeek } from "date-fns";
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
import {
  listTherapistAppointments,
  getTherapistDashboardSummary,
  type AppointmentSummary,
  type TherapistDashboardSummary,
} from "@/lib/api/therapist";
import { ApiError } from "@/lib/api/http";

const TEN_MINUTES_MS = 10 * 60 * 1000;

export function DashboardPage() {
  const { user } = useAuth();
  const now = React.useMemo(() => new Date(), []);

  const [summary, setSummary] = React.useState<TherapistDashboardSummary | null>(null);
  const [appointments, setAppointments] = React.useState<AppointmentSummary[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const fromIso = new Date(weekStart).toISOString();
    const toIso = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    Promise.allSettled([
      getTherapistDashboardSummary(user.id),
      listTherapistAppointments(user.id, {
        status: ["REQUESTED", "UPCOMING", "IN_PROGRESS"],
        from: fromIso,
        to: toIso,
        page: 0,
        size: 100,
        sort: "startDatetime,asc",
      }),
    ])
      .then(([summaryR, appointmentsR]) => {
        if (cancelled) return;
        if (summaryR.status === "fulfilled") setSummary(summaryR.value);
        if (appointmentsR.status === "fulfilled")
          setAppointments(appointmentsR.value.content ?? []);
        if (summaryR.status === "rejected" && summaryR.reason instanceof ApiError) {
          console.warn("dashboard summary load failed", summaryR.reason.status);
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user?.id, now]);

  const todays = appointments
    .filter((a) => isSameDay(parseISO(a.startDatetime), now) && a.status !== "CANCELLED")
    .sort((a, b) => a.startDatetime.localeCompare(b.startDatetime));

  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
  const apptsByDay = (d: Date) =>
    appointments.filter(
      (a) => isSameDay(parseISO(a.startDatetime), d) && a.status !== "CANCELLED",
    ).length;

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
        <Kpi
          icon={Users}
          label="Active patients"
          value={summary?.activePatientCount ?? (loading ? "…" : 0)}
        />
        <Kpi
          icon={CalendarCheck}
          label="Sessions this month"
          value={summary?.completedThisMonth ?? (loading ? "…" : 0)}
        />
        <Kpi
          icon={Star}
          label="Avg rating"
          value={
            summary?.averageRating != null
              ? `${summary.averageRating.toFixed(2)} / 5`
              : loading
                ? "…"
                : "—"
          }
        />
        <Kpi
          icon={ClipboardList}
          label="Draft notes"
          value={summary?.draftNoteCount ?? (loading ? "…" : 0)}
          accent="warning"
        />
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
                const end = a.endDatetime
                  ? parseISO(a.endDatetime)
                  : new Date(start.getTime() + 60 * 60 * 1000);
                const inWindow = isWithinInterval(now, {
                  start: new Date(start.getTime() - TEN_MINUTES_MS),
                  end,
                });
                return (
                  <div
                    key={a.appointmentId}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{initials(a.patientName ?? "?")}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {a.patientName ?? a.profileId.slice(0, 8)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(start, "HH:mm")} · {a.reason ?? "Session"}
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
                            <MessageCircle className="mr-1 h-3 w-3" /> Text
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
              title={`${summary?.pendingBookingCount ?? 0} booking${summary?.pendingBookingCount === 1 ? "" : "s"} awaiting confirmation`}
              cta="Review"
              to="/appointments?tab=upcoming"
            />
            <Action
              icon={ClipboardList}
              title={`${summary?.draftNoteCount ?? 0} draft note${summary?.draftNoteCount === 1 ? "" : "s"} to finish`}
              cta="Open"
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
            {(summary?.moodAlertCount ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No active alerts.</p>
            ) : (
              <div className="rounded-md border-l-4 border-warning bg-warning/5 p-3">
                <p className="text-sm font-medium">
                  {summary?.moodAlertCount} patient
                  {summary?.moodAlertCount === 1 ? "" : "s"} flagged for mood-related concerns.
                </p>
                <p className="text-xs text-muted-foreground">
                  Open the patients list to triage.
                </p>
              </div>
            )}
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
