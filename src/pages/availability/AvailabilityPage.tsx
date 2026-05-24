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
import { getTherapistSlots, type SlotResponse } from "@/lib/api/therapist";

const HOURS = Array.from({ length: 12 }, (_, i) => 8 + i);

interface UISlot {
  id: string;
  startsAt: string;
  endsAt: string;
  isBooked: boolean;
  bookedByPatientName?: string;
}

export function AvailabilityPage() {
  const { user } = useAuth();
  const [weekStart, setWeekStart] = React.useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [slots, setSlots] = React.useState<UISlot[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<UISlot | null>(null);
  const [newSlotInfo, setNewSlotInfo] = React.useState<{ day: Date; hour: number } | null>(null);

  React.useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getTherapistSlots(user.id, { page: 0, size: 200, sort: "startDatetime,asc" })
      .then((page) => {
        if (cancelled) return;
        const mapped: UISlot[] = (page.content ?? []).map((s: SlotResponse) => ({
          id: s.slotId,
          startsAt: s.startDatetime,
          endsAt: s.endDatetime,
          isBooked: false,
        }));
        setSlots(mapped);
      })
      .catch((e) => !cancelled && setError(e?.message ?? "Failed to load slots"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const cellSlot = (day: Date, hour: number) =>
    slots.find(
      (s) =>
        isSameDay(parseISO(s.startsAt), day) && parseISO(s.startsAt).getHours() === hour,
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Availability</h1>
          <p className="text-sm text-muted-foreground">
            Patients can book any slot you publish here. Booked slots are read-only.
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
          <Button variant="secondary" size="sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
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
                                className="h-full w-full rounded-sm bg-success/15 px-1.5 text-left text-xs font-medium text-success hover:bg-success/25"
                              >
                                <div>Available</div>
                                <div className="text-[10px] opacity-70">Click to view</div>
                              </button>
                            ) : (
                              <button
                                onClick={() => setNewSlotInfo({ day: d, hour: h })}
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
        <span className="text-muted-foreground">
          Note: backend endpoints to create, update, or delete availability slots are not yet
          implemented. See <code>docs/Missing API endpoints.md</code>.
        </span>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Available slot</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3 text-sm">
              <p>
                {format(parseISO(editing.startsAt), "EEEE, d LLL")} ·{" "}
                {format(parseISO(editing.startsAt), "HH:mm")}–
                {format(parseISO(editing.endsAt), "HH:mm")}
              </p>
              <p className="rounded-md border bg-muted/30 p-2 text-xs text-muted-foreground">
                Editing or deleting availability slots is not yet supported by the backend.
              </p>
            </div>
          )}
          <DialogFooter>
            {editing && (
              <Button variant="destructive" disabled>
                <Trash2 className="h-4 w-4" /> Delete slot
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Duration (min)</Label>
                  <Input type="number" defaultValue={60} step={15} />
                </div>
                <div>
                  <Label>Buffer (min)</Label>
                  <Input type="number" defaultValue={10} step={5} />
                </div>
              </div>
              <p className="rounded-md border bg-muted/30 p-2 text-xs text-muted-foreground">
                Slot creation endpoint is not yet implemented. Use the
                <code className="mx-1">POST /api/v1/test/trigger-generation</code>
                test endpoint to populate slots in development.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewSlotInfo(null)}>
              Cancel
            </Button>
            <Button disabled>Add slot</Button>
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
