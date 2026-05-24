import * as React from "react";
import { Link } from "react-router-dom";
import { format, isPast, isSameDay, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AppointmentStatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";
import {
  fetchTherapistAppointments,
  type AppointmentRow,
} from "@/lib/api/therapistAppointments";
import type { AppointmentStatus } from "@/types";

type TabKey = "upcoming" | "today" | "past" | "cancelled";

const statusMap: Record<string, AppointmentStatus> = {
  REQUESTED: "REQUESTED",
  UPCOMING: "CONFIRMED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
};

const tabFilter = (a: AppointmentRow, key: TabKey) => {
  const start = parseISO(a.startDatetime);
  switch (key) {
    case "upcoming":
      return !isPast(start) && a.status !== "CANCELLED";
    case "today":
      return isSameDay(start, new Date()) && a.status !== "CANCELLED";
    case "past":
      return a.status === "COMPLETED" || (isPast(start) && a.status !== "CANCELLED");
    case "cancelled":
      return a.status === "CANCELLED";
  }
};

export function AppointmentsListPage() {
  const [tab, setTab] = React.useState<TabKey>("upcoming");
  const [mode, setMode] = React.useState<string>("");
  const [search, setSearch] = React.useState("");
  const [items, setItems] = React.useState<AppointmentRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTherapistAppointments()
      .then(({ appointments }) => {
        if (!cancelled) setItems(appointments);
      })
      .catch((e) => !cancelled && setError(e?.message ?? "Failed to load"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = items
    .filter((a) => tabFilter(a, tab))
    .filter((a) => (mode ? a.mode === mode : true))
    .filter((a) => (search ? a.patientName.toLowerCase().includes(search.toLowerCase()) : true))
    .sort((a, b) => a.startDatetime.localeCompare(b.startDatetime));

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
              <option value="CHAT">Chat</option>
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
              <CardContent className="py-8 text-center text-sm text-destructive">{error}</CardContent>
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
                    <AvatarFallback>{initials(a.patientName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/patients/${a.patientId}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {a.patientName}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {a.therapistSpecialization ?? a.location ?? "Session"}
                    </p>
                  </div>
                  <Badge variant={a.mode === "VIDEO" ? "default" : "secondary"}>{a.mode}</Badge>
                  <AppointmentStatusBadge status={statusMap[a.status] ?? "CONFIRMED"} />
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
