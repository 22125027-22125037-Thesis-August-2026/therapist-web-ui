import * as React from "react";
import { addDays, addWeeks, format, isSameDay, parseISO, startOfWeek, subWeeks } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import {
  createAvailabilityTemplate,
  createSlot,
  deleteAvailabilityTemplate,
  deleteSlot,
  getTherapistManagedSlots,
  listAvailabilityTemplates,
  updateAvailabilityTemplate,
  type AvailabilityTemplate,
  type SlotResponse,
} from "@/lib/api/therapist";

const HOURS = Array.from({ length: 12 }, (_, i) => 8 + i);

type TemplateDay = AvailabilityTemplate["dayOfWeek"];

const TEMPLATE_DAYS: { value: TemplateDay; label: string }[] = [
  { value: "MONDAY", label: "Mon" },
  { value: "TUESDAY", label: "Tue" },
  { value: "WEDNESDAY", label: "Wed" },
  { value: "THURSDAY", label: "Thu" },
  { value: "FRIDAY", label: "Fri" },
  { value: "SATURDAY", label: "Sat" },
  { value: "SUNDAY", label: "Sun" },
];

// Backend LocalTime serializes as "HH:mm" or "HH:mm:ss"; we only need hour/minute.
const hourOf = (localTime: string) => Number(localTime.slice(0, 2));
const toHHMM = (totalMinutes: number) => {
  const clamped = Math.min(totalMinutes, 24 * 60 - 1);
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

// --- Client-side "apply now" that mirrors the backend ScheduleGenerationService cron
// (generateSlotsForNext30Days). Kept in sync deliberately: same 30-day window and the
// same Asia/Ho_Chi_Minh wall-clock interpretation. Vietnam is a fixed UTC+7 (no DST),
// so we can emit an explicit +07:00 offset instead of doing real zone math.
const GENERATION_WINDOW_DAYS = 30;
const HCM_OFFSET = "+07:00";
const JS_DAY_TO_ENUM: TemplateDay[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];
// HH:mm / HH:mm:ss -> HH:mm:00 for an unambiguous ISO time component.
const toHHMMSS = (localTime: string) => `${localTime.slice(0, 5)}:00`;

// All matching slot windows for a template across the next 30 days (HCM calendar),
// as ISO instants. Past windows are dropped (the slot endpoint rejects them).
function templateSlotWindows(
  template: AvailabilityTemplate,
): { startDatetime: string; endDatetime: string }[] {
  const hcmTodayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());
  const [y, m, d] = hcmTodayStr.split("-").map(Number);
  const start = toHHMMSS(template.startTime);
  const end = toHHMMSS(template.endTime);
  const endsNextDay = template.endTime.slice(0, 5) <= template.startTime.slice(0, 5);
  const now = Date.now();

  const windows: { startDatetime: string; endDatetime: string }[] = [];
  let cursor = new Date(y, m - 1, d); // local midnight; weekday is timezone-independent
  for (let i = 0; i < GENERATION_WINDOW_DAYS; i++) {
    if (JS_DAY_TO_ENUM[cursor.getDay()] === template.dayOfWeek) {
      const dateStr = format(cursor, "yyyy-MM-dd");
      const endDateStr = endsNextDay ? format(addDays(cursor, 1), "yyyy-MM-dd") : dateStr;
      const startIso = `${dateStr}T${start}${HCM_OFFSET}`;
      const endIso = `${endDateStr}T${end}${HCM_OFFSET}`;
      if (new Date(startIso).getTime() > now) {
        windows.push({ startDatetime: startIso, endDatetime: endIso });
      }
    }
    cursor = addDays(cursor, 1);
  }
  return windows;
}

export function AvailabilityPage() {
  const { user } = useAuth();
  const [weekStart, setWeekStart] = React.useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [slots, setSlots] = React.useState<SlotResponse[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<SlotResponse | null>(null);
  const [newSlotInfo, setNewSlotInfo] = React.useState<{ day: Date; hour: number } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [duration, setDuration] = React.useState(60);

  const [templates, setTemplates] = React.useState<AvailabilityTemplate[]>([]);
  const [templateError, setTemplateError] = React.useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = React.useState<AvailabilityTemplate | null>(null);
  const [newTemplateInfo, setNewTemplateInfo] = React.useState<{
    day: TemplateDay;
    hour: number;
  } | null>(null);
  const [templateDuration, setTemplateDuration] = React.useState(60);
  const [templateBusy, setTemplateBusy] = React.useState(false);
  const [templateNotice, setTemplateNotice] = React.useState<string | null>(null);

  const reload = React.useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const page = await getTherapistManagedSlots(user.id, {
        includeBooked: true,
        page: 0,
        size: 500,
        sort: "startDatetime,asc",
      });
      setSlots(page.content ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load slots");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const reloadTemplates = React.useCallback(async () => {
    if (!user?.id) return;
    setTemplateError(null);
    try {
      setTemplates(await listAvailabilityTemplates(user.id));
    } catch (e: any) {
      setTemplateError(e?.message ?? "Failed to load weekly templates");
    }
  }, [user?.id]);

  React.useEffect(() => {
    void reload();
    void reloadTemplates();
  }, [reload, reloadTemplates]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const cellTemplate = (day: TemplateDay, hour: number) =>
    templates.find((t) => t.dayOfWeek === day && hourOf(t.startTime) === hour);

  // Mimics the backend cron by creating the concrete slots a template would generate
  // for the next 30 days right now. Best-effort: each slot is created independently and
  // expected 409s (slot already generated / overlaps an existing one) are ignored.
  const materializeTemplate = React.useCallback(
    async (template: AvailabilityTemplate): Promise<number> => {
      if (!user?.id) return 0;
      const windows = templateSlotWindows(template);
      const results = await Promise.allSettled(
        windows.map((w) => createSlot(user.id, w)),
      );
      return results.filter((r) => r.status === "fulfilled").length;
    },
    [user?.id],
  );

  const handleCreateTemplate = async () => {
    if (!user?.id || !newTemplateInfo) return;
    setTemplateBusy(true);
    setTemplateError(null);
    setTemplateNotice(null);
    try {
      const startMinutes = newTemplateInfo.hour * 60;
      const created = await createAvailabilityTemplate(user.id, {
        dayOfWeek: newTemplateInfo.day,
        startTime: toHHMM(startMinutes),
        endTime: toHHMM(startMinutes + templateDuration),
        isActive: true,
      });
      setNewTemplateInfo(null);
      setTemplateDuration(60);
      const generated = await materializeTemplate(created);
      await Promise.all([reloadTemplates(), reload()]);
      setTemplateNotice(
        generated > 0
          ? `Template saved — generated ${generated} slot${generated === 1 ? "" : "s"} for the next 30 days.`
          : "Template saved. No new slots were generated (they may already exist or fall in the past).",
      );
    } catch (e: any) {
      setTemplateError(e?.message ?? "Failed to create template");
    } finally {
      setTemplateBusy(false);
    }
  };

  const handleToggleTemplate = async () => {
    if (!user?.id || !editingTemplate) return;
    const willActivate = !editingTemplate.isActive;
    setTemplateBusy(true);
    setTemplateError(null);
    setTemplateNotice(null);
    try {
      const updated = await updateAvailabilityTemplate(user.id, editingTemplate.templateId, {
        dayOfWeek: editingTemplate.dayOfWeek,
        startTime: editingTemplate.startTime,
        endTime: editingTemplate.endTime,
        isActive: willActivate,
      });
      setEditingTemplate(null);
      // Reactivating should immediately re-generate the slots the cron would have made.
      const generated = willActivate ? await materializeTemplate(updated) : 0;
      await Promise.all([reloadTemplates(), reload()]);
      if (willActivate) {
        setTemplateNotice(
          generated > 0
            ? `Template activated — generated ${generated} slot${generated === 1 ? "" : "s"} for the next 30 days.`
            : "Template activated. No new slots were generated (they may already exist or fall in the past).",
        );
      }
    } catch (e: any) {
      setTemplateError(e?.message ?? "Failed to update template");
    } finally {
      setTemplateBusy(false);
    }
  };

  // Reverse of materializeTemplate: removes the template's still-unbooked generated slots
  // for the next 30 days. Booked slots are left untouched (a patient holds them, and the
  // slot endpoint rejects deleting them anyway).
  const dematerializeTemplate = React.useCallback(
    async (template: AvailabilityTemplate): Promise<{ deleted: number; keptBooked: number }> => {
      if (!user?.id) return { deleted: 0, keptBooked: 0 };
      const wanted = new Set(
        templateSlotWindows(template).map(
          (w) => `${new Date(w.startDatetime).getTime()}-${new Date(w.endDatetime).getTime()}`,
        ),
      );
      const matching = slots.filter((s) =>
        wanted.has(
          `${new Date(s.startDatetime).getTime()}-${new Date(s.endDatetime).getTime()}`,
        ),
      );
      const deletable = matching.filter((s) => !s.isBooked);
      const results = await Promise.allSettled(
        deletable.map((s) => deleteSlot(user.id, s.slotId)),
      );
      return {
        deleted: results.filter((r) => r.status === "fulfilled").length,
        keptBooked: matching.length - deletable.length,
      };
    },
    [user?.id, slots],
  );

  const handleDeleteTemplate = async () => {
    if (!user?.id || !editingTemplate) return;
    setTemplateBusy(true);
    setTemplateError(null);
    setTemplateNotice(null);
    try {
      const target = editingTemplate;
      await deleteAvailabilityTemplate(user.id, target.templateId);
      setEditingTemplate(null);
      const { deleted, keptBooked } = await dematerializeTemplate(target);
      await Promise.all([reloadTemplates(), reload()]);
      const keptNote =
        keptBooked > 0
          ? ` ${keptBooked} booked slot${keptBooked === 1 ? "" : "s"} kept.`
          : "";
      setTemplateNotice(
        `Template deleted — removed ${deleted} unbooked slot${deleted === 1 ? "" : "s"}.${keptNote}`,
      );
    } catch (e: any) {
      setTemplateError(e?.message ?? "Failed to delete template");
    } finally {
      setTemplateBusy(false);
    }
  };

  const cellSlot = (day: Date, hour: number) =>
    slots.find(
      (s) =>
        isSameDay(parseISO(s.startDatetime), day) && parseISO(s.startDatetime).getHours() === hour,
    );

  const handleCreate = async () => {
    if (!user?.id || !newSlotInfo) return;
    setBusy(true);
    try {
      const start = new Date(newSlotInfo.day);
      start.setHours(newSlotInfo.hour, 0, 0, 0);
      const end = new Date(start.getTime() + duration * 60 * 1000);
      await createSlot(user.id, {
        startDatetime: start.toISOString(),
        endDatetime: end.toISOString(),
      });
      setNewSlotInfo(null);
      setDuration(60);
      await reload();
    } catch (e: any) {
      setError(e?.message ?? "Failed to create slot");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!user?.id || !editing) return;
    setBusy(true);
    try {
      await deleteSlot(user.id, editing.slotId);
      setEditing(null);
      await reload();
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete slot");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Availability</h1>
          <p className="text-sm text-muted-foreground">
            Patients can book any open slot. Booked slots are read-only here.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekStart(subWeeks(weekStart, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="rounded-md border bg-card px-3 py-2 text-sm font-medium">
            {format(weekStart, "d LLL")} – {format(addDays(weekStart, 6), "d LLL yyyy")}
          </div>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(addWeeks(weekStart, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
          >
            This week
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="w-16 border-b bg-muted/50 p-2 text-xs uppercase text-muted-foreground"></th>
                    {days.map((d) => (
                      <th
                        key={d.toISOString()}
                        className="border-b bg-muted/50 p-2 text-xs uppercase text-muted-foreground"
                      >
                        <div>{format(d, "EEE")}</div>
                        <div className="text-foreground">{format(d, "d LLL")}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HOURS.map((h) => (
                    <tr key={h}>
                      <td className="border-r border-b p-2 align-top text-xs text-muted-foreground">
                        {String(h).padStart(2, "0")}:00
                      </td>
                      {days.map((d) => {
                        const slot = cellSlot(d, h);
                        return (
                          <td
                            key={d.toISOString() + h}
                            className="h-14 border-b border-r p-1 align-top"
                          >
                            {slot ? (
                              <button
                                onClick={() => setEditing(slot)}
                                className={`h-full w-full rounded-sm px-1.5 text-left text-xs font-medium ${
                                  slot.isBooked
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-success/15 text-success hover:bg-success/25"
                                }`}
                              >
                                {slot.isBooked ? (
                                  <>
                                    <div className="truncate">
                                      {slot.bookedByPatientName ?? "Booked"}
                                    </div>
                                    <div className="text-[10px] opacity-80">Booked</div>
                                  </>
                                ) : (
                                  <>
                                    <div>Available</div>
                                    <div className="text-[10px] opacity-70">Click to edit</div>
                                  </>
                                )}
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setNewSlotInfo({ day: d, hour: h });
                                  setDuration(60);
                                }}
                                className="grid h-full w-full place-items-center rounded-sm text-muted-foreground/40 hover:bg-accent hover:text-primary"
                                aria-label={`Add slot on ${format(d, "PP")} at ${h}:00`}
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3 text-xs">
        <LegendDot className="bg-success/40" label="Available" />
        <LegendDot className="bg-primary" label="Booked" />
        <span className="text-muted-foreground">
          Tip: click an empty cell to add a slot, click an existing one to view or delete.
        </span>
      </div>

      <div className="space-y-3 pt-4">
        <div>
          <h2 className="text-lg font-semibold">Weekly templates</h2>
          <p className="text-sm text-muted-foreground">
            Recurring availability. Saving or activating a template immediately generates its
            slots for the next 30 days (and the weekly Sunday job keeps the window topped up).
          </p>
        </div>

        {templateError && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            {templateError}
          </div>
        )}

        {templateNotice && (
          <div className="rounded-md border border-success/40 bg-success/5 p-3 text-sm text-success">
            {templateNotice}
          </div>
        )}

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="w-16 border-b bg-muted/50 p-2 text-xs uppercase text-muted-foreground"></th>
                    {TEMPLATE_DAYS.map((d) => (
                      <th
                        key={d.value}
                        className="border-b bg-muted/50 p-2 text-xs uppercase text-muted-foreground"
                      >
                        {d.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HOURS.map((h) => (
                    <tr key={h}>
                      <td className="border-r border-b p-2 align-top text-xs text-muted-foreground">
                        {String(h).padStart(2, "0")}:00
                      </td>
                      {TEMPLATE_DAYS.map((d) => {
                        const tpl = cellTemplate(d.value, h);
                        return (
                          <td
                            key={d.value + h}
                            className="h-14 border-b border-r p-1 align-top"
                          >
                            {tpl ? (
                              <button
                                onClick={() => setEditingTemplate(tpl)}
                                className={`h-full w-full rounded-sm px-1.5 text-left text-xs font-medium ${
                                  tpl.isActive
                                    ? "bg-success/15 text-success hover:bg-success/25"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                              >
                                <div>
                                  {tpl.startTime.slice(0, 5)}–{tpl.endTime.slice(0, 5)}
                                </div>
                                <div className="text-[10px] opacity-70">
                                  {tpl.isActive ? "Active" : "Inactive"}
                                </div>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setNewTemplateInfo({ day: d.value, hour: h });
                                  setTemplateDuration(60);
                                }}
                                className="grid h-full w-full place-items-center rounded-sm text-muted-foreground/40 hover:bg-accent hover:text-primary"
                                aria-label={`Add ${d.label} template at ${h}:00`}
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.isBooked ? "Booked slot" : "Available slot"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3 text-sm">
              <p>
                {format(parseISO(editing.startDatetime), "EEEE, d LLL")} ·{" "}
                {format(parseISO(editing.startDatetime), "HH:mm")}–
                {format(parseISO(editing.endDatetime), "HH:mm")}
              </p>
              {editing.isBooked ? (
                <p className="rounded-md border bg-muted p-2 text-muted-foreground">
                  Patient:{" "}
                  <span className="font-medium">{editing.bookedByPatientName ?? "—"}</span>.
                  Booked slots cannot be edited or deleted.
                </p>
              ) : (
                <p className="rounded-md border bg-muted/30 p-2 text-xs text-muted-foreground">
                  Delete to free this time. Reschedule by deleting and re-creating at a new time.
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            {editing && !editing.isBooked && (
              <Button variant="destructive" onClick={handleDelete} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete slot
              </Button>
            )}
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!newSlotInfo} onOpenChange={(o) => !o && setNewSlotInfo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add an available slot</DialogTitle>
          </DialogHeader>
          {newSlotInfo && (
            <div className="space-y-3 text-sm">
              <p>
                {format(newSlotInfo.day, "EEEE, d LLL")} at{" "}
                {String(newSlotInfo.hour).padStart(2, "0")}:00
              </p>
              <div>
                <Label>Duration (min)</Label>
                <Input
                  type="number"
                  min={15}
                  step={15}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value) || 60)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewSlotInfo(null)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Add slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingTemplate} onOpenChange={(o) => !o && setEditingTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Weekly template</DialogTitle>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-3 text-sm">
              <p>
                Every{" "}
                {TEMPLATE_DAYS.find((d) => d.value === editingTemplate.dayOfWeek)?.label ??
                  editingTemplate.dayOfWeek}{" "}
                · {editingTemplate.startTime.slice(0, 5)}–{editingTemplate.endTime.slice(0, 5)}
              </p>
              <p className="rounded-md border bg-muted/30 p-2 text-xs text-muted-foreground">
                {editingTemplate.isActive
                  ? "Active — generates a recurring slot each matching day."
                  : "Inactive — kept but no slots are generated until reactivated."}{" "}
                Deleting also removes its unbooked generated slots for the next 30 days; any
                already-booked slots are kept.
              </p>
            </div>
          )}
          <DialogFooter>
            {editingTemplate && (
              <Button variant="outline" onClick={handleToggleTemplate} disabled={templateBusy}>
                {templateBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingTemplate.isActive ? "Deactivate" : "Activate"}
              </Button>
            )}
            <Button variant="destructive" onClick={handleDeleteTemplate} disabled={templateBusy}>
              {templateBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete template
            </Button>
            <Button variant="ghost" onClick={() => setEditingTemplate(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!newTemplateInfo} onOpenChange={(o) => !o && setNewTemplateInfo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a weekly template</DialogTitle>
          </DialogHeader>
          {newTemplateInfo && (
            <div className="space-y-3 text-sm">
              <p>
                Every{" "}
                {TEMPLATE_DAYS.find((d) => d.value === newTemplateInfo.day)?.label ??
                  newTemplateInfo.day}{" "}
                at {String(newTemplateInfo.hour).padStart(2, "0")}:00
              </p>
              <div>
                <Label>Duration (min)</Label>
                <Input
                  type="number"
                  min={15}
                  step={15}
                  value={templateDuration}
                  onChange={(e) => setTemplateDuration(Number(e.target.value) || 60)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewTemplateInfo(null)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTemplate} disabled={templateBusy}>
              {templateBusy && <Loader2 className="h-4 w-4 animate-spin" />}
              Add template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className={`inline-block h-3 w-3 rounded-sm ${className}`} />
      {label}
    </span>
  );
}
