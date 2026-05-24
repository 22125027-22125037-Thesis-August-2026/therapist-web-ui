import * as React from "react";
import { addDays, addWeeks, format, isSameDay, parseISO, startOfWeek, subWeeks } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { mockSlots } from "@/lib/mockData";
import type { AvailabilitySlot } from "@/types";

const HOURS = Array.from({ length: 12 }, (_, i) => 8 + i);

export function AvailabilityPage() {
  const [weekStart, setWeekStart] = React.useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [slots, setSlots] = React.useState<AvailabilitySlot[]>(mockSlots);
  const [editing, setEditing] = React.useState<AvailabilitySlot | null>(null);
  const [newSlotInfo, setNewSlotInfo] = React.useState<{ day: Date; hour: number } | null>(null);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const cellSlot = (day: Date, hour: number) =>
    slots.find(
      (s) =>
        isSameDay(parseISO(s.startsAt), day) && parseISO(s.startsAt).getHours() === hour,
    );

  const addSlot = (day: Date, hour: number) => {
    const start = new Date(day);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start);
    end.setHours(hour + 1);
    setSlots((s) => [
      ...s,
      {
        id: `slot_new_${Date.now()}`,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        isBooked: false,
      },
    ]);
    setNewSlotInfo(null);
  };

  const removeSlot = (id: string) => {
    setSlots((s) => s.filter((x) => x.id !== id));
    setEditing(null);
  };

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

      <Card>
        <CardContent className="p-0">
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
                                  <div>{slot.bookedByPatientName ?? "Booked"}</div>
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
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3 text-xs">
        <LegendDot className="bg-success/40" label="Available" />
        <LegendDot className="bg-primary" label="Booked" />
        <span className="text-muted-foreground">
          Tip: click an empty cell to add a slot, click an existing one to edit or delete.
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm">Apply "Standard week" template</Button>
        <Button variant="outline" size="sm">Save week as template</Button>
        <Button variant="outline" size="sm">Toggle holiday for selected day</Button>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing?.isBooked ? "Booked slot" : "Available slot"}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3 text-sm">
              <p>
                {format(parseISO(editing.startsAt), "EEEE, d LLL")} ·{" "}
                {format(parseISO(editing.startsAt), "HH:mm")}–
                {format(parseISO(editing.endsAt), "HH:mm")}
              </p>
              {editing.isBooked ? (
                <p className="rounded-md border bg-muted p-2 text-muted-foreground">
                  Patient: <span className="font-medium">{editing.bookedByPatientName}</span>.
                  Booked slots cannot be edited.
                </p>
              ) : (
                <div className="space-y-2">
                  <Label>Make recurring</Label>
                  <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">None</option>
                    <option value="weekly-4">Weekly · 4 weeks</option>
                    <option value="weekly-8">Weekly · 8 weeks</option>
                  </select>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {editing && !editing.isBooked && (
              <Button variant="destructive" onClick={() => editing && removeSlot(editing.id)}>
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
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewSlotInfo(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => newSlotInfo && addSlot(newSlotInfo.day, newSlotInfo.hour)}
            >
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
