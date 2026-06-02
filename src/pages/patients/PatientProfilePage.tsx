import * as React from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import {
  Calendar,
  Loader2,
  Mail,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Tag,
  X,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { LockedCard } from "@/components/LockedCard";
import { RiskBadge } from "@/components/StatusBadge";
import { initials } from "@/lib/utils";
import {
  getAppointmentHistory,
  getPatientMatchingPreferences,
  getPatientRiskLevel,
  getPatientTags,
  getUpcomingAppointment,
  listClinicalNotes,
  type AppointmentSummary,
  type ClinicalNoteResponse,
  type MatchingPreferencesResponse,
  updatePatientRiskLevel,
  updatePatientTags,
} from "@/lib/api/therapist";
import { getGrantStatus, getPatientDetail, type PatientDetailResponse } from "@/lib/api/auth";
import {
  listDiary,
  listFood,
  listSleep,
  type DiaryEntryResponse,
  type FoodLogResponse,
  type SleepLogResponse,
} from "@/lib/api/tracking";
import { ApiError } from "@/lib/api/http";

type RiskLevelValue = "NONE" | "LOW" | "MEDIUM" | "HIGH";

export function PatientProfilePage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "overview";

  const [profile, setProfile] = React.useState<PatientDetailResponse | null>(null);
  const [grantStatus, setGrantStatus] = React.useState<{
    theyGaveMeAccess: boolean;
    iGaveThemAccess: boolean;
    expiresAt?: string;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [sessions, setSessions] = React.useState<AppointmentSummary[]>([]);
  const [notes, setNotes] = React.useState<ClinicalNoteResponse[]>([]);
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagDraft, setTagDraft] = React.useState("");
  const [riskLevel, setRiskLevel] = React.useState<RiskLevelValue>("NONE");
  const [matchingPrefs, setMatchingPrefs] = React.useState<MatchingPreferencesResponse | null>(
    null,
  );

  React.useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [p, gs, upcoming, history, notesPage, tagsR, riskR, matchingR] = await Promise.all([
          getPatientDetail(id).catch(() => null),
          getGrantStatus(id).catch(() => null),
          getUpcomingAppointment(id).catch(() => null),
          getAppointmentHistory(id).catch(() => [] as AppointmentSummary[]),
          listClinicalNotes({ patientId: id, page: 0, size: 50 }).catch(
            () => ({ content: [] }) as { content: ClinicalNoteResponse[] },
          ),
          getPatientTags(id).catch(() => null),
          getPatientRiskLevel(id).catch(() => null),
          getPatientMatchingPreferences(id).catch(() => null),
        ]);
        if (cancelled) return;
        if (p) setProfile(p);
        if (gs?.data) {
          setGrantStatus({
            theyGaveMeAccess: gs.data.theyGaveMeAccess,
            iGaveThemAccess: gs.data.iGaveThemAccess,
            expiresAt: gs.data.theirGrant?.expiresAt,
          });
        }
        const all = [...(upcoming ? [upcoming] : []), ...history];
        const seen = new Set<string>();
        setSessions(
          all.filter((a) => {
            if (seen.has(a.appointmentId)) return false;
            seen.add(a.appointmentId);
            return true;
          }),
        );
        setNotes(notesPage.content ?? []);
        if (tagsR) setTags(tagsR.tags);
        if (riskR?.riskLevel) setRiskLevel(riskR.riskLevel);
        if (matchingR) setMatchingPrefs(matchingR);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load patient");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleAddTag = async () => {
    const t = tagDraft.trim().toLowerCase();
    if (!t || !id || tags.includes(t)) {
      setTagDraft("");
      return;
    }
    const next = [...tags, t];
    setTags(next);
    setTagDraft("");
    try {
      const res = await updatePatientTags(id, next);
      setTags(res.tags);
    } catch (e) {
      // revert
      setTags(tags);
      console.warn("update tags failed", e);
    }
  };

  const handleRemoveTag = async (t: string) => {
    if (!id) return;
    const next = tags.filter((x) => x !== t);
    setTags(next);
    try {
      const res = await updatePatientTags(id, next);
      setTags(res.tags);
    } catch (e) {
      setTags(tags);
      console.warn("update tags failed", e);
    }
  };

  const handleRiskChange = async (next: RiskLevelValue) => {
    if (!id) return;
    const prev = riskLevel;
    setRiskLevel(next);
    try {
      await updatePatientRiskLevel(id, next);
    } catch (e) {
      setRiskLevel(prev);
      console.warn("update risk level failed", e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (error || !profile || !id) {
    return <p className="p-6 text-muted-foreground">{error ?? "Patient not found."}</p>;
  }

  const granted = !!grantStatus?.theyGaveMeAccess;
  const fullName = profile.fullName;

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <aside className="space-y-4">
        <Card>
          <CardContent className="space-y-4 pt-6 text-sm">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14">
                {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt="" />}
                <AvatarFallback>{initials(fullName)}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold">{fullName}</h2>
                <p className="text-xs text-muted-foreground">
                  {profile.age != null && `Age ${profile.age}`}
                  {profile.gender && ` · ${profile.gender.toLowerCase()}`}
                </p>
              </div>
            </div>

            <div>
              <RiskBadge level={riskLevel} />
              <div className="mt-2 flex gap-1">
                {(["NONE", "LOW", "MEDIUM", "HIGH"] as const).map((r) => (
                  <Button
                    key={r}
                    size="sm"
                    variant={riskLevel === r ? "default" : "outline"}
                    className="h-6 px-2 text-[10px]"
                    onClick={() => handleRiskChange(r)}
                  >
                    {r}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-muted-foreground">
              {profile.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3" /> {profile.email}
                </div>
              )}
              {profile.phoneNumber && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" /> {profile.phoneNumber}
                </div>
              )}
              {profile.school && (
                <div className="text-muted-foreground">School: {profile.school}</div>
              )}
            </div>

            {profile.emergencyContact && (
              <div className="rounded-md border bg-warning/5 p-2 text-xs">
                <p className="font-medium">Emergency contact</p>
                <p className="text-muted-foreground">{profile.emergencyContact}</p>
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
                    {grantStatus?.expiresAt && (
                      <p className="mt-1 text-muted-foreground">
                        Expires {format(parseISO(grantStatus.expiresAt), "PP")}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-md border bg-muted/30 p-2 text-xs">
                    <div className="flex items-center gap-2 font-medium">
                      <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" />
                      No data access granted
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <Tag className="h-3 w-3" /> Tags
              </p>
              <div className="flex flex-wrap items-center gap-1">
                {tags.map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1">
                    {t}
                    <button
                      type="button"
                      aria-label={`Remove tag ${t}`}
                      className="ml-0.5 inline-flex"
                      onClick={() => handleRemoveTag(t)}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="mt-2 flex gap-1">
                <Input
                  placeholder="Add tag…"
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleAddTag();
                    }
                  }}
                  className="h-7 text-xs"
                />
                <Button size="sm" variant="outline" className="h-7 px-2" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
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
            <OverviewTab
              profile={profile}
              sessions={sessions}
              matchingPrefs={matchingPrefs}
            />
          </TabsContent>

          <TabsContent value="notes">
            <NotesTab patientId={id} patientName={fullName} notes={notes} />
          </TabsContent>

          <TabsContent value="diary">
            {granted ? <DiaryTab patientId={id} /> : <LockedCard patientName={fullName} />}
          </TabsContent>
          <TabsContent value="food">
            {granted ? <FoodTab patientId={id} /> : <LockedCard patientName={fullName} />}
          </TabsContent>
          <TabsContent value="sleep">
            {granted ? <SleepTab patientId={id} /> : <LockedCard patientName={fullName} />}
          </TabsContent>
          <TabsContent value="mood">
            {granted ? <MoodTab patientId={id} /> : <LockedCard patientName={fullName} />}
          </TabsContent>

          <TabsContent value="sessions">
            <SessionsTab sessions={sessions} notes={notes} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function OverviewTab({
  profile,
  sessions,
  matchingPrefs,
}: {
  profile: PatientDetailResponse;
  sessions: AppointmentSummary[];
  matchingPrefs: MatchingPreferencesResponse | null;
}) {
  const lastSession = sessions
    .filter((s) => s.status === "COMPLETED")
    .sort((a, b) => b.startDatetime.localeCompare(a.startDatetime))[0];
  const nextSession = sessions
    .filter((s) => s.status === "UPCOMING" || s.status === "REQUESTED")
    .sort((a, b) => a.startDatetime.localeCompare(b.startDatetime))[0];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>At a glance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Name:</span> {profile.fullName}
          </p>
          <p>
            <span className="text-muted-foreground">Email:</span> {profile.email}
          </p>
          {profile.dateOfBirth && (
            <p>
              <span className="text-muted-foreground">DOB:</span>{" "}
              {format(parseISO(profile.dateOfBirth), "PP")}
            </p>
          )}
          <p>
            <span className="text-muted-foreground">Last session:</span>{" "}
            {lastSession ? format(parseISO(lastSession.startDatetime), "PP") : "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Next session:</span>{" "}
            {nextSession ? format(parseISO(nextSession.startDatetime), "PP") : "—"}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Matching form</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {!matchingPrefs ? (
            <p className="text-muted-foreground">No matching preferences on file.</p>
          ) : (
            <>
              {matchingPrefs.has_prior_counseling && (
                <Field label="Prior counseling" value={matchingPrefs.has_prior_counseling} />
              )}
              {matchingPrefs.communication_style && (
                <Field label="Communication style" value={matchingPrefs.communication_style} />
              )}
              {matchingPrefs.gender && (
                <Field label="Gender" value={matchingPrefs.gender} />
              )}
              {matchingPrefs.age && <Field label="Age" value={String(matchingPrefs.age)} />}
              {matchingPrefs.reasons && matchingPrefs.reasons.length > 0 && (
                <Field label="Reasons" value={matchingPrefs.reasons.join(", ")} />
              )}
              {matchingPrefs.sexual_orientation && (
                <Field label="Sexual orientation" value={matchingPrefs.sexual_orientation} />
              )}
              {typeof matchingPrefs.is_lgbtq_priority === "boolean" && (
                <Field
                  label="LGBTQ+ priority"
                  value={matchingPrefs.is_lgbtq_priority ? "Yes" : "No"}
                />
              )}
              {matchingPrefs.self_harm_thought && (
                <Field label="Self-harm thought" value={matchingPrefs.self_harm_thought} />
              )}
              {matchingPrefs.mood_levels &&
                Object.entries(matchingPrefs.mood_levels).map(([k, v]) => (
                  <Field key={k} label={`Mood: ${k}`} value={String(v)} />
                ))}
              {matchingPrefs.last_updated_at && (
                <p className="pt-1 text-[10px] text-muted-foreground">
                  Updated {format(parseISO(matchingPrefs.last_updated_at), "PP")}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p>{value}</p>
    </div>
  );
}

function NotesTab({
  patientId,
  patientName,
  notes,
}: {
  patientId: string;
  patientName: string;
  notes: ClinicalNoteResponse[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Clinical notes for {patientName}.
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
        <Card key={n.noteId}>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium">{format(parseISO(n.createdAt), "PP")}</p>
              <p className="text-xs text-muted-foreground">
                {n.summary ?? n.diagnosis ?? "(no summary)"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={n.status === "FINALIZED" ? "default" : "warning"}>
                {n.status ?? "—"}
              </Badge>
              <Button asChild size="sm" variant="outline">
                <Link to={`/clinical-notes/${n.noteId}`}>Open</Link>
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
  const [entries, setEntries] = React.useState<DiaryEntryResponse[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listDiary(patientId)
      .then((data) => !cancelled && setEntries(data))
      .catch((e: ApiError) => !cancelled && setError(e?.message ?? "Failed to load diary"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  const filtered = entries
    .filter((d) =>
      q
        ? (d.title ?? "").toLowerCase().includes(q.toLowerCase()) ||
          d.content.toLowerCase().includes(q.toLowerCase())
        : true,
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-3">
      <Input placeholder="Search entries…" value={q} onChange={(e) => setQ(e.target.value)} />
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </CardContent>
        </Card>
      )}
      {!loading && error && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-destructive">{error}</CardContent>
        </Card>
      )}
      {!loading && !error && filtered.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No diary entries.
          </CardContent>
        </Card>
      )}
      {!loading &&
        !error &&
        filtered.map((d) => (
          <Card key={d.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">{d.title ?? "Diary entry"}</p>
                {d.moodTag && <Badge variant="muted">{d.moodTag}</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">
                {format(parseISO(d.createdAt), "PP HH:mm")}
              </p>
              <p className="mt-2 text-sm">{d.content}</p>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}

function FoodTab({ patientId }: { patientId: string }) {
  const [logs, setLogs] = React.useState<FoodLogResponse[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    listFood(patientId)
      .then((data) => !cancelled && setLogs(data))
      .catch(() => !cancelled && setLogs([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  const byDay = Array.from({ length: 7 }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const dStr = format(day, "yyyy-MM-dd");
    const total = logs
      .filter((l) => (l.entryDate ?? l.createdAt).startsWith(dStr))
      .reduce((sum, l) => sum + (l.waterGlasses ?? 0), 0);
    return { day: format(day, "EEE"), water: total };
  }).reverse();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Water (glasses, last 7 days)</CardTitle>
        </CardHeader>
        <CardContent className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="water" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent logs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {loading && (
            <div className="flex items-center justify-center py-4 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
          {!loading && logs.length === 0 && (
            <p className="text-muted-foreground">No food logs.</p>
          )}
          {logs.map((l) => (
            <div key={l.id} className="flex items-center justify-between rounded-md border p-2">
              <div>
                <p className="font-medium">{l.foodDescription}</p>
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(l.entryDate ?? l.createdAt), "PP")}
                </p>
              </div>
              <Badge variant="secondary">{l.satietyLevel}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function SleepTab({ patientId }: { patientId: string }) {
  const [logs, setLogs] = React.useState<SleepLogResponse[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    listSleep(patientId)
      .then((data) => !cancelled && setLogs(data))
      .catch(() => !cancelled && setLogs([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  const chartData = [...logs]
    .sort((a, b) => (a.entryDate ?? a.createdAt).localeCompare(b.entryDate ?? b.createdAt))
    .map((s) => ({
      day: (s.entryDate ?? s.createdAt).slice(5, 10),
      durationH: Number(((s.durationMinutes ?? 0) / 60).toFixed(1)),
      quality: s.sleepQuality ?? 0,
    }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Sleep duration & quality</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line dataKey="durationH" stroke="hsl(var(--primary))" strokeWidth={2} dot />
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
          {loading && (
            <div className="flex items-center justify-center py-4 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
          {!loading && logs.length === 0 && (
            <p className="text-muted-foreground">No sleep logs.</p>
          )}
          {logs.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-md border p-2">
              <div>
                <p className="font-medium">
                  {s.entryDate ?? format(parseISO(s.createdAt), "PP")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(s.bedTime), "HH:mm")} → {format(parseISO(s.wakeTime), "HH:mm")}{" "}
                  ({((s.durationMinutes ?? 0) / 60).toFixed(1)} h)
                </p>
              </div>
              {typeof s.sleepQuality === "number" && (
                <Badge variant="secondary">Quality {s.sleepQuality}/5</Badge>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// Diary mood tags mapped onto a 1–5 positivity scale for charting (higher = more positive).
const MOOD_SCORE: Record<string, number> = {
  TERRIBLE: 1,
  BAD: 2,
  ANXIOUS: 2,
  NEUTRAL: 3,
  GOOD: 4,
  HAPPY: 4,
  EXCITED: 4,
  EXCELLENT: 5,
};

const MOOD_SCALE_LABEL: Record<number, string> = {
  1: "Terrible",
  2: "Bad",
  3: "Neutral",
  4: "Good",
  5: "Excellent",
};

function moodScore(tag?: string): number | null {
  if (!tag) return null;
  return MOOD_SCORE[tag.trim().toUpperCase()] ?? null;
}

function MoodTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as { day: string; score: number; mood: string };
  return (
    <div className="rounded-md border bg-background p-2 text-xs shadow">
      <p className="font-medium">{p.day}</p>
      <p className="text-muted-foreground">
        {MOOD_SCALE_LABEL[p.score]} · {p.mood}
      </p>
    </div>
  );
}

function MoodTab({ patientId }: { patientId: string }) {
  const [entries, setEntries] = React.useState<DiaryEntryResponse[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    listDiary(patientId)
      .then((data) => !cancelled && setEntries(data))
      .catch(() => !cancelled && setEntries([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  // Score each diary entry's mood and keep the highest per day, then plot the daily line.
  const chartData = React.useMemo(() => {
    const bestByDay = new Map<string, { score: number; mood: string }>();
    for (const e of entries) {
      const score = moodScore(e.moodTag);
      if (score == null) continue;
      const day = (e.entryDate ?? e.createdAt).slice(0, 10);
      const prev = bestByDay.get(day);
      if (!prev || score > prev.score) {
        bestByDay.set(day, { score, mood: e.moodTag!.trim().toUpperCase() });
      }
    }
    return [...bestByDay.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, v]) => ({ day: day.slice(5), score: v.score, mood: v.mood }));
  }, [entries]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mood trend</CardTitle>
        <CardDescription>Highest diary mood per day, scored 1 (Terrible) – 5 (Excellent).</CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        {loading ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : chartData.length === 0 ? (
          <p className="text-muted-foreground">No diary moods to chart.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
                width={72}
                tickFormatter={(v: number) => MOOD_SCALE_LABEL[v] ?? String(v)}
              />
              <Tooltip content={<MoodTooltip />} />
              <Line dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot connectNulls />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function SessionsTab({
  sessions,
  notes,
}: {
  sessions: AppointmentSummary[];
  notes: ClinicalNoteResponse[];
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
            {[...sessions]
              .sort((a, b) => b.startDatetime.localeCompare(a.startDatetime))
              .map((s) => {
                const note = notes.find((n) => n.appointmentId === s.appointmentId);
                return (
                  <tr key={s.appointmentId} className="border-t">
                    <td className="p-2 flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {format(parseISO(s.startDatetime), "PP HH:mm")}
                    </td>
                    <td className="p-2">{s.mode}</td>
                    <td className="p-2">{s.status}</td>
                    <td className="p-2">
                      {note ? (
                        <Link
                          to={`/clinical-notes/${note.noteId}`}
                          className="text-primary hover:underline"
                        >
                          {note.status ?? "Open"}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-2 text-right">
                      <Button asChild size="sm" variant="ghost">
                        <Link to={`/appointments/${s.appointmentId}`}>Open</Link>
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
