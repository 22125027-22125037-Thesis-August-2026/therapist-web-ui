import * as React from "react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AppointmentStatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  listTherapistAppointments,
  type AppointmentStatusServer,
  type AppointmentSummary,
} from "@/lib/api/therapist";
import type { AppointmentStatus } from "@/types";

type TabKey = "upcoming" | "today" | "past" | "cancelled" | "requested";

const TAB_STATUS_FILTERS: Record<TabKey, AppointmentStatusServer[]> = {
  requested: ["REQUESTED"],
  upcoming: ["REQUESTED", "UPCOMING", "IN_PROGRESS"],
  today: ["REQUESTED", "UPCOMING", "IN_PROGRESS"],
  past: ["COMPLETED", "NO_SHOW"],
  cancelled: ["CANCELLED"],
};

const statusUiMap: Record<AppointmentStatusServer, AppointmentStatus> = {
  REQUESTED: "REQUESTED",
  UPCOMING: "CONFIRMED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
};

export function AppointmentsListPage() {
  const { user } = useAuth();
  const [tab, setTab] = React.useState<TabKey>("upcoming");
  const [mode, setMode] = React.useState<string>("");
  const [search, setSearch] = React.useState("");
  const [items, setItems] = React.useState<AppointmentSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const statusFilter = TAB_STATUS_FILTERS[tab];
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const params = {
      status: statusFilter,
      page: 0,
      size: 200,
      sort: "startDatetime,asc",
      ...(tab === "today"
        ? { from: todayStart.toISOString(), to: todayEnd.toISOString() }
        : tab === "upcoming"
          ? { from: now.toISOString() }
          : {}),
    };

    listTherapistAppointments(user.id, params)
      .then((page) => {
        if (!cancelled) setItems(page.content ?? []);
      })
      .catch((e) => !cancelled && setError(e?.message ?? "Failed to load"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [tab, user?.id]);

  const filtered = items
    .filter((a) => (mode ? a.mode === mode : true))
    .filter((a) =>
      search ? (a.patientName ?? "").toLowerCase().includes(search.toLowerCase()) : true,
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Appointments</h1>
        <p className="text-sm text-muted-foreground">
          Manage upcoming and past sessions across all of your patients.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="requested">Requested</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              aria-label="Mode filter"
            >
              <option value="">All modes</option>
              <option value="VIDEO">Video</option>
              <option value="TEXT">Text</option>
            </select>
            <Input
              placeholder="Search patient…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56"
            />
          </div>
        </div>

        <TabsContent value={tab} className="space-y-3">
          {loading && (
            <Card>
              <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </CardContent>
            </Card>
          )}
          {!loading && error && (
            <Card>
              <CardContent className="py-8 text-center text-sm text-destructive">
                {error}
              </CardContent>
            </Card>
          )}
          {!loading && !error && filtered.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No appointments match the current filters.
              </CardContent>
            </Card>
          )}
          {!loading &&
            !error &&
            filtered.map((a) => (
              <Card key={a.appointmentId}>
                <CardContent className="flex flex-wrap items-center gap-4 p-4">
                  <div className="w-32 shrink-0">
                    <div className="text-xs uppercase text-muted-foreground">
                      {format(parseISO(a.startDatetime), "EEE d LLL")}
                    </div>
                    <div className="text-lg font-semibold">
                      {format(parseISO(a.startDatetime), "HH:mm")}
                    </div>
                  </div>
                  <Avatar>
                    <AvatarFallback>{initials(a.patientName ?? "?")}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/patients/${a.profileId}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {a.patientName ?? a.profileId.slice(0, 8)}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {a.reason ?? "Session"}
                    </p>
                  </div>
                  <Badge variant={a.mode === "VIDEO" ? "default" : "secondary"}>{a.mode}</Badge>
                  <AppointmentStatusBadge status={statusUiMap[a.status]} />
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/appointments/${a.appointmentId}`}>Open</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
