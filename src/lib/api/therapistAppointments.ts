import { listChannels, type ChannelItem } from "./social";
import {
  getAppointmentHistory,
  getUpcomingAppointment,
  type AppointmentSummary,
} from "./therapist";

export interface AppointmentRow extends AppointmentSummary {
  patientId: string;
  patientName: string;
  patientAvatarUrl?: string;
}

/**
 * Aggregates the therapist's appointments by walking every counterpart (patient)
 * found in chat channels. The therapist service does not expose a single
 * endpoint that lists all of a therapist's appointments, so we fan out per
 * patient and merge the results.
 *
 * Missing endpoint: see docs/Missing API endpoints.md → "Therapist appointments
 * list across patients".
 */
export async function fetchTherapistAppointments(): Promise<{
  appointments: AppointmentRow[];
  channels: ChannelItem[];
}> {
  const channels = (await listChannels().catch(() => [])) ?? [];
  const upcomingResults = await Promise.allSettled(
    channels.map((c) => getUpcomingAppointment(c.counterpartProfileId)),
  );
  const historyResults = await Promise.allSettled(
    channels.map((c) => getAppointmentHistory(c.counterpartProfileId)),
  );

  const rows: AppointmentRow[] = [];
  channels.forEach((c, i) => {
    const u = upcomingResults[i];
    if (u.status === "fulfilled" && u.value) {
      rows.push({
        ...u.value,
        patientId: c.counterpartProfileId,
        patientName: c.counterpartDisplayName ?? c.counterpartProfilename,
        patientAvatarUrl: c.counterpartAvatarUrl ?? undefined,
      });
    }
    const h = historyResults[i];
    if (h.status === "fulfilled" && Array.isArray(h.value)) {
      for (const a of h.value) {
        rows.push({
          ...a,
          patientId: c.counterpartProfileId,
          patientName: c.counterpartDisplayName ?? c.counterpartProfilename,
          patientAvatarUrl: c.counterpartAvatarUrl ?? undefined,
        });
      }
    }
  });

  // dedupe by appointmentId
  const seen = new Set<string>();
  const deduped = rows.filter((r) => {
    if (seen.has(r.appointmentId)) return false;
    seen.add(r.appointmentId);
    return true;
  });

  return { appointments: deduped, channels };
}
