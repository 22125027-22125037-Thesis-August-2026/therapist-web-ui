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
  createSlot,
  deleteSlot,
  getTherapistManagedSlots,
  type SlotResponse,
} from "@/lib/api/therapist";

const HOURS = Array.from({ length: 12 }, (_, i) => 8 + i);

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

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

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
