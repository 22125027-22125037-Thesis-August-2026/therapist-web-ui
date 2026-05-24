import * as React from "react";
import { Link } from "react-router-dom";
import { format, isPast, isSameDay, parseISO } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AppointmentStatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";
import { mockAppointments } from "@/lib/mockData";
import type { Appointment } from "@/types";

type TabKey = "upcoming" | "today" | "past" | "cancelled";

const tabFilter = (a: Appointment, key: TabKey) => {
  const start = parseISO(a.startsAt);
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

  const filtered = mockAppointments
    .filter((a) => tabFilter(a, tab))
    .filter((a) => (mode ? a.mode === mode : true))
    .filter((a) => (search ? a.patientName.toLowerCase().includes(search.toLowerCase()) : true))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

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
          {filtered.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No appointments match the current filters.
              </CardContent>
            </Card>
          )}
          {filtered.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex flex-wrap items-center gap-4 p-4">
                <div className="w-32 shrink-0">
                  <div className="text-xs uppercase text-muted-foreground">
                    {format(parseISO(a.startsAt), "EEE d LLL")}
                  </div>
                  <div className="text-lg font-semibold">
                    {format(parseISO(a.startsAt), "HH:mm")}
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
                  <p className="truncate text-xs text-muted-foreground">{a.reason}</p>
                </div>
                <Badge variant={a.mode === "VIDEO" ? "default" : "secondary"}>{a.mode}</Badge>
                <AppointmentStatusBadge status={a.status} />
                <Button asChild size="sm" variant="outline">
                  <Link to={`/appointments/${a.id}`}>Open</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
