import { Badge } from "@/components/ui/badge";
import type { AppointmentStatus, RiskLevel } from "@/types";

const appointmentMap: Record<AppointmentStatus, { label: string; variant: any }> = {
  REQUESTED: { label: "Requested", variant: "warning" },
  CONFIRMED: { label: "Confirmed", variant: "default" },
  IN_PROGRESS: { label: "In progress", variant: "success" },
  COMPLETED: { label: "Completed", variant: "secondary" },
  CANCELLED: { label: "Cancelled", variant: "muted" },
  NO_SHOW: { label: "No show", variant: "destructive" },
};

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const m = appointmentMap[status] ?? { label: String(status ?? "Unknown"), variant: "muted" };
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

const riskMap: Record<RiskLevel, { label: string; variant: any }> = {
  NONE: { label: "No risk", variant: "muted" },
  LOW: { label: "Low risk", variant: "secondary" },
  MEDIUM: { label: "Medium risk", variant: "warning" },
  HIGH: { label: "High risk", variant: "destructive" },
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  const m = riskMap[level] ?? riskMap.NONE;
  return <Badge variant={m.variant}>{m.label}</Badge>;
}
