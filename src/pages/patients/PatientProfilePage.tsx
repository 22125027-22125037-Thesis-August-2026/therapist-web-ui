import * as React from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import {
  Calendar,
  Phone,
  Mail,
  Tag,
  ShieldCheck,
  ShieldAlert,
  Eye,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { LockedCard } from "@/components/LockedCard";
import { RiskBadge } from "@/components/StatusBadge";
import { initials } from "@/lib/utils";
import {
  mockAppointments,
  mockAudit,
  mockDiary,
  mockFood,
  mockMood,
  mockNotes,
  mockPatients,
  mockSleep,
} from "@/lib/mockData";

const moodOrder = ["BAD", "LOW", "NEUTRAL", "GOOD", "GREAT"] as const;

export function PatientProfilePage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "overview";
  const patient = mockPatients.find((p) => p.id === id);
  const [requesting, setRequesting] = React.useState(false);

  if (!patient) return <p className="p-6">Patient not found.</p>;
  const granted = patient.permission.theyGaveMeAccess;

  const sessions = mockAppointments.filter((a) => a.patientId === patient.id);
  const notes = mockNotes.filter((n) => n.patientId === patient.id);

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <aside className="space-y-4">
        <Card>
          <CardContent className="space-y-4 pt-6 text-sm">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14">
                <AvatarFallback>{initials(patient.fullName)}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold">{patient.fullName}</h2>
                <p className="text-xs text-muted-foreground">
                  Age {patient.age} · {patient.gender.toLowerCase()} · {patient.role.toLowerCase()}
                </p>
              </div>
            </div>

            <div>
              <RiskBadge level={patient.riskLevel} />
            </div>

            {patient.contact && (
              <div className="space-y-1.5 text-xs text-muted-foreground">
                {patient.contact.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3" /> {patient.contact.email}
                  </div>
                )}
                {patient.contact.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3" /> {patient.contact.phone}
                  </div>
                )}
              </div>
            )}

            {patient.role === "TEEN" && patient.emergencyContact && (
              <div className="rounded-md border bg-warning/5 p-2 text-xs">
                <p className="font-medium">Emergency contact</p>
                <p className="text-muted-foreground">
                  {patient.emergencyContact.name} ({patient.emergencyContact.relation}) ·{" "}
                  {patient.emergencyContact.phone}
                </p>
              </div>
            )}

            <Separator />

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Permission state
              </p>
              <div className="mt-2 space-y-2">
                {granted ? (
                  <div className="rounded-md border border-success/40 bg-success/5 p-2 text-xs">
                    <div className="flex items-center gap-2 font-medium text-success">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Data access granted
                    </div>
                    {patient.permission.expiresAt && (
                      <p className="mt-1 text-muted-foreground">
                        Expires {format(parseISO(patient.permission.expiresAt), "PP")}
                      </p>
                    )}
                  </div>
                ) : patient.permission.grantStatus === "PENDING" ? (
                  <div className="rounded-md border border-warning/40 bg-warning/5 p-2 text-xs">
                    <div className="flex items-center gap-2 font-medium text-warning">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      You requested access on{" "}
                      {patient.permission.requestedAt &&
                        format(parseISO(patient.permission.requestedAt), "PP")}
                    </div>
                    <p className="mt-1 text-muted-foreground">Waiting for patient approval.</p>
                  </div>
                ) : (
                  <div className="rounded-md border bg-muted/30 p-2 text-xs">
                    <div className="flex items-center gap-2 font-medium">
                      <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" />
                      No data access granted
                    </div>
                  </div>
                )}
                {!granted && (
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={requesting || patient.permission.grantStatus === "PENDING"}
                    onClick={() => setRequesting(true)}
                  >
                    {patient.permission.grantStatus === "PENDING"
                      ? "Request pending"
                      : "Request data access"}
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <Tag className="h-3 w-3" /> Tags
              </p>
              <div className="flex flex-wrap gap-1">
                {patient.tags.map((t) => (
                  <Badge key={t} variant="secondary">
                    {t}
                  </Badge>
                ))}
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                  + Add
                </Button>
              </div>
            </div>

            <Separator />

            <div className="text-xs text-muted-foreground">
              <p className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                Last viewed by you:{" "}
                {mockAudit.find((a) => a.patientId === patient.id)
                  ? format(parseISO(mockAudit.find((a) => a.patientId === patient.id)!.at), "PP HH:mm")
                  : "never"}
              </p>
              <p className="mt-0.5">All views appear in the patient's audit log.</p>
            </div>
          </CardContent>
        </Card>
      </aside>

      <div className="space-y-4">
        <Tabs value={tab} onValueChange={(v) => setParams({ tab: v })}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="notes">Clinical notes</TabsTrigger>
            <TabsTrigger value="diary">Diary</TabsTrigger>
            <TabsTrigger value="food">Food</TabsTrigger>
            <TabsTrigger value="sleep">Sleep</TabsTrigger>
            <TabsTrigger value="mood">Mood</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab patientId={patient.id} />
          </TabsContent>

          <TabsContent value="notes">
            <NotesTab patientId={patient.id} />
          </TabsContent>

          <TabsContent value="diary">
            {granted ? <DiaryTab patientId={patient.id} /> : <LockedCard patientName={patient.fullName} pending={patient.permission.grantStatus === "PENDING"} onRequestAccess={() => {}} />}
          </TabsContent>
          <TabsContent value="food">
            {granted ? <FoodTab patientId={patient.id} /> : <LockedCard patientName={patient.fullName} pending={patient.permission.grantStatus === "PENDING"} onRequestAccess={() => {}} />}
          </TabsContent>
          <TabsContent value="sleep">
            {granted ? <SleepTab patientId={patient.id} /> : <LockedCard patientName={patient.fullName} pending={patient.permission.grantStatus === "PENDING"} onRequestAccess={() => {}} />}
          </TabsContent>
          <TabsContent value="mood">
            {granted ? <MoodTab patientId={patient.id} /> : <LockedCard patientName={patient.fullName} pending={patient.permission.grantStatus === "PENDING"} onRequestAccess={() => {}} />}
          </TabsContent>

          <TabsContent value="sessions">
            <SessionsTab patientId={patient.id} sessions={sessions} notes={notes} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function OverviewTab({ patientId }: { patientId: string }) {
  const patient = mockPatients.find((p) => p.id === patientId)!;
  const form = patient.matchingForm ?? {};
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Matching form responses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {Object.keys(form).length === 0 && (
            <p className="text-muted-foreground">No matching form on file.</p>
          )}
          {Object.entries(form).map(([k, v]) => (
            <div key={k}>
              <p className="text-xs uppercase text-muted-foreground">{k}</p>
              <p>{v}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>At a glance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Primary concern:</span>{" "}
            {patient.primaryConcern}
          </p>
          <p>
            <span className="text-muted-foreground">Last session:</span>{" "}
            {patient.lastSessionAt ? format(parseISO(patient.lastSessionAt), "PP") : "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Next session:</span>{" "}
            {patient.nextSessionAt ? format(parseISO(patient.nextSessionAt), "PP") : "—"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function NotesTab({ patientId }: { patientId: string }) {
  const notes = mockNotes.filter((n) => n.patientId === patientId);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Your private notes about this patient. The patient never sees these.
        </p>
        <Button asChild size="sm">
          <Link to={`/clinical-notes/new?patientId=${patientId}`}>New note</Link>
        </Button>
      </div>
      {notes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No clinical notes yet for this patient.
          </CardContent>
        </Card>
      )}
      {notes.map((n) => (
        <Card key={n.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium">{format(parseISO(n.createdAt), "PP")}</p>
              <p className="text-xs text-muted-foreground">{n.summary ?? "(no summary)"}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={n.status === "FINALIZED" ? "default" : "warning"}>
                {n.status}
              </Badge>
              <Button asChild size="sm" variant="outline">
                <Link to={`/clinical-notes/${n.id}`}>Open</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DiaryTab({ patientId }: { patientId: string }) {
  const [q, setQ] = React.useState("");
  const entries = mockDiary
    .filter((d) => d.patientId === patientId)
    .filter((d) => (q ? d.title.toLowerCase().includes(q.toLowerCase()) || d.body.toLowerCase().includes(q.toLowerCase()) : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-3">
      <Input placeholder="Search entries…" value={q} onChange={(e) => setQ(e.target.value)} />
      {entries.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No diary entries.
          </CardContent>
        </Card>
      )}
      {entries.map((d) => (
        <Card key={d.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">{d.title}</p>
              <Badge variant="muted">{d.mood}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{format(parseISO(d.createdAt), "PP HH:mm")}</p>
            <p className="mt-2 text-sm">{d.body}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function FoodTab({ patientId }: { patientId: string }) {
  const logs = mockFood.filter((f) => f.patientId === patientId);
  const byDay = Array.from({ length: 7 }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const dStr = format(day, "yyyy-MM-dd");
    const total = logs
      .filter((l) => l.createdAt.startsWith(dStr))
      .reduce((sum, l) => sum + l.satiety, 0);
    return { day: format(day, "EEE"), satiety: total };
  }).reverse();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Daily satiety (last 7 days)</CardTitle>
        </CardHeader>
        <CardContent className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="satiety" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent logs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {logs.length === 0 && <p className="text-muted-foreground">No food logs.</p>}
          {logs.map((l) => (
            <div key={l.id} className="flex items-center justify-between rounded-md border p-2">
              <div>
                <p className="font-medium">
                  {l.mealType} · {l.items}
                </p>
                <p className="text-xs text-muted-foreground">{format(parseISO(l.createdAt), "PP")}</p>
              </div>
              <Badge variant="secondary">Satiety {l.satiety}/5</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function SleepTab({ patientId }: { patientId: string }) {
  const logs = mockSleep
    .filter((s) => s.patientId === patientId)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => ({ day: s.date.slice(5), duration: Number(s.durationHours.toFixed(1)), quality: s.quality }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Sleep last 7 days</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={logs}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line dataKey="duration" stroke="hsl(var(--primary))" strokeWidth={2} dot />
              <Line dataKey="quality" stroke="hsl(var(--success))" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Recent nights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {mockSleep.filter((s) => s.patientId === patientId).map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-md border p-2">
              <div>
                <p className="font-medium">{s.date}</p>
                <p className="text-xs text-muted-foreground">
                  {s.bedtime} → {s.wakeTime} ({s.durationHours.toFixed(1)} h)
                </p>
              </div>
              <Badge variant="secondary">Quality {s.quality}/5</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function MoodTab({ patientId }: { patientId: string }) {
  const moods = mockMood
    .filter((m) => m.patientId === patientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mood check-ins</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {moods.length === 0 && <p className="text-muted-foreground">No mood check-ins.</p>}
        {moods.map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded-md border p-2">
            <div>
              <p className="font-medium">{m.mood}</p>
              {m.note && <p className="text-xs text-muted-foreground">{m.note}</p>}
            </div>
            <p className="text-xs text-muted-foreground">
              {format(parseISO(m.createdAt), "PP HH:mm")}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SessionsTab({
  patientId,
  sessions,
  notes,
}: {
  patientId: string;
  sessions: ReturnType<typeof mockAppointments.filter>;
  notes: ReturnType<typeof mockNotes.filter>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Past & upcoming sessions</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Mode</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Clinical note</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => {
              const note = notes.find((n) => n.appointmentId === s.id);
              return (
                <tr key={s.id} className="border-t">
                  <td className="p-2 flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    {format(parseISO(s.startsAt), "PP HH:mm")}
                  </td>
                  <td className="p-2">{s.mode}</td>
                  <td className="p-2">{s.status}</td>
                  <td className="p-2">
                    {note ? (
                      <Link to={`/clinical-notes/${note.id}`} className="text-primary hover:underline">
                        {note.status}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-2 text-right">
                    <Button asChild size="sm" variant="ghost">
                      <Link to={`/appointments/${s.id}`}>Open</Link>
                    </Button>
                  </td>
                </tr>
              );
            })}
            {sessions.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  No sessions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
