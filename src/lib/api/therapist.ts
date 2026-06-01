import { apiFetch } from "./http";

export interface TherapistDetailResponse {
  id: string;
  fullName: string;
  avatarUrl?: string;
  specialty: string;
  location: string;
  bio: string;
  stats: {
    patientCount: number;
    yearsOfExperience: number;
    averageRating: number;
    reviewCount: number;
  };
  workingHours: { dayLabel: string; startTime: string; endTime: string }[];
  reviews: TherapistReview[];
}

export interface TherapistReview {
  id: string;
  reviewerName: string;
  reviewerAvatarUrl: string | null;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface SlotResponse {
  slotId: string;
  startDatetime: string;
  endDatetime: string;
  isBooked?: boolean;
  bookedByPatientId?: string;
  bookedByPatientName?: string;
  appointmentId?: string;
}

export interface PageEnvelope<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  numberOfElements: number;
}

export interface BookingResponse {
  appointmentId: string;
  slotId: string;
  status: AppointmentStatusServer;
  message?: string;
}

export interface JoinSessionResponse {
  meetingUrl: string;
  sdkToken: string;
}

export type AppointmentStatusServer =
  | "REQUESTED"
  | "UPCOMING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface AppointmentSummary {
  appointmentId: string;
  profileId: string;
  patientName?: string;
  therapistId: string;
  therapistName?: string;
  therapistSpecialization?: string;
  location?: string;
  slotId: string;
  mode: "VIDEO" | "TEXT" | "CHAT";
  status: AppointmentStatusServer;
  startDatetime: string;
  endDatetime?: string;
  reason?: string;
}

export interface AppointmentDetail extends AppointmentSummary {
  createdAt?: string;
  cancellationReason?: string;
  cancelledAt?: string;
}

export interface ClinicalNoteResponse {
  noteId: string;
  appointmentId: string;
  profileId?: string;
  therapistId?: string;
  appointmentStatus?: string;
  status?: "DRAFT" | "FINALIZED";
  diagnosis?: string;
  recommendations?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  summary?: string;
  riskFlags?: {
    suicidalIdeation: boolean;
    selfHarm: boolean;
    substanceUse: boolean;
    abuse: boolean;
  };
  createdAt: string;
  updatedAt?: string;
  message?: string;
}

export interface ClinicalNoteSubmitRequest {
  appointmentId: string;
  diagnosis?: string;
  recommendations?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  summary?: string;
  riskSuicidalIdeation?: boolean;
  riskSelfHarm?: boolean;
  riskSubstanceUse?: boolean;
  riskAbuse?: boolean;
  status?: "DRAFT" | "FINALIZED";
}

export interface AssignedTherapistResponse {
  assignmentId: string;
  profileId: string;
  status: "ACTIVE" | "INACTIVE";
  assignedAt: string;
  therapist: {
    id: string;
    full_name: string;
    specialization: string;
    communication_style: string;
  };
}

export interface TherapistPatientRosterItem {
  profileId: string;
  patientName?: string;
  assignmentStatus: "ACTIVE" | "INACTIVE";
  assignedAt: string;
  riskLevel?: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  tags?: string[];
}

export interface TherapistDashboardSummary {
  activePatientCount: number;
  completedThisMonth: number;
  averageRating: number;
  pendingBookingCount: number;
  draftNoteCount: number;
  moodAlertCount: number;
}

export interface AvailabilityTemplate {
  templateId: string;
  therapistId: string;
  dayOfWeek:
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY"
    | "SUNDAY";
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface MatchingPreferencesResponse {
  profileId: string;
  has_prior_counseling?: string;
  sexual_orientation?: string;
  is_lgbtq_priority?: boolean;
  reasons?: string[];
  communication_style?: string;
  mood_levels?: Record<string, number>;
  gender?: string;
  age?: string;
  self_harm_thought?: string;
  last_updated_at?: string;
}

export interface PatientTagsResponse {
  profileId: string;
  tags: string[];
  updatedAt?: string;
  updatedBy?: string;
}

export interface PatientRiskLevelResponse {
  profileId: string;
  riskLevel: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  updatedAt?: string;
  updatedBy?: string;
}

// All paths below are gateway paths. nginx strips the `/therapist/` segment
// before forwarding to therapist-api, e.g.
//   `/api/v1/therapist/bookings` -> therapist-api `/api/v1/bookings`.

// ---------- Therapist directory + slots ----------

export function getTherapist(id: string) {
  return apiFetch<TherapistDetailResponse>(`/api/v1/therapist/therapists/${id}`, {
    method: "GET",
  });
}

export function getTherapistSlots(
  id: string,
  params?: { page?: number; size?: number; sort?: string },
) {
  return apiFetch<PageEnvelope<SlotResponse>>(
    `/api/v1/therapist/therapists/${id}/slots`,
    {
      method: "GET",
      query: { page: params?.page, size: params?.size, sort: params?.sort },
    },
  );
}

export function getTherapistManagedSlots(
  id: string,
  params?: { includeBooked?: boolean; page?: number; size?: number; sort?: string },
) {
  return apiFetch<PageEnvelope<SlotResponse>>(
    `/api/v1/therapist/therapists/${id}/slots/manage`,
    {
      method: "GET",
      query: {
        includeBooked: params?.includeBooked,
        page: params?.page,
        size: params?.size,
        sort: params?.sort,
      },
    },
  );
}

export function createSlot(
  therapistId: string,
  body: { startDatetime: string; endDatetime: string },
) {
  return apiFetch<SlotResponse>(`/api/v1/therapist/therapists/${therapistId}/slots`, {
    method: "POST",
    body,
  });
}

export function createSlotsBulk(
  therapistId: string,
  body: { slots: { startDatetime: string; endDatetime: string }[] },
) {
  return apiFetch<SlotResponse[]>(
    `/api/v1/therapist/therapists/${therapistId}/slots:bulk`,
    { method: "POST", body },
  );
}

export function updateSlot(
  therapistId: string,
  slotId: string,
  body: { startDatetime: string; endDatetime: string },
) {
  return apiFetch<SlotResponse>(
    `/api/v1/therapist/therapists/${therapistId}/slots/${slotId}`,
    { method: "PUT", body },
  );
}

export function deleteSlot(therapistId: string, slotId: string) {
  return apiFetch<void>(`/api/v1/therapist/therapists/${therapistId}/slots/${slotId}`, {
    method: "DELETE",
  });
}

// ---------- Availability templates ----------

export function listAvailabilityTemplates(therapistId: string) {
  return apiFetch<AvailabilityTemplate[]>(
    `/api/v1/therapist/therapists/${therapistId}/availability-templates`,
    { method: "GET" },
  );
}

export function createAvailabilityTemplate(
  therapistId: string,
  body: Omit<AvailabilityTemplate, "templateId" | "therapistId">,
) {
  return apiFetch<AvailabilityTemplate>(
    `/api/v1/therapist/therapists/${therapistId}/availability-templates`,
    { method: "POST", body },
  );
}

export function updateAvailabilityTemplate(
  therapistId: string,
  templateId: string,
  body: Partial<Omit<AvailabilityTemplate, "templateId" | "therapistId">>,
) {
  return apiFetch<AvailabilityTemplate>(
    `/api/v1/therapist/therapists/${therapistId}/availability-templates/${templateId}`,
    { method: "PUT", body },
  );
}

export function deleteAvailabilityTemplate(therapistId: string, templateId: string) {
  return apiFetch<void>(
    `/api/v1/therapist/therapists/${therapistId}/availability-templates/${templateId}`,
    { method: "DELETE" },
  );
}

// ---------- Bookings ----------

export function createBooking(payload: {
  slotId: string;
  reason?: string;
  mode?: "VIDEO" | "TEXT";
}) {
  return apiFetch<BookingResponse>("/api/v1/therapist/bookings", {
    method: "POST",
    body: payload,
  });
}

export function getAppointmentDetail(appointmentId: string) {
  return apiFetch<AppointmentDetail>(`/api/v1/therapist/bookings/${appointmentId}`, {
    method: "GET",
  });
}

export function joinSession(appointmentId: string) {
  return apiFetch<JoinSessionResponse>(
    `/api/v1/therapist/bookings/${appointmentId}/join`,
    { method: "GET" },
  );
}

export function cancelAppointment(appointmentId: string, reason: string) {
  return apiFetch<AppointmentDetail>(
    `/api/v1/therapist/bookings/${appointmentId}/cancel`,
    { method: "POST", body: { reason } },
  );
}

export function confirmBooking(appointmentId: string) {
  return apiFetch<AppointmentDetail>(
    `/api/v1/therapist/bookings/${appointmentId}/confirm`,
    { method: "POST" },
  );
}

export function rejectBooking(appointmentId: string, reason?: string) {
  return apiFetch<AppointmentDetail>(
    `/api/v1/therapist/bookings/${appointmentId}/reject`,
    { method: "POST", body: reason ? { reason } : undefined },
  );
}

// ---------- Patient-side appointment views (legacy) ----------

export function getUpcomingAppointment(profileId: string) {
  return apiFetch<AppointmentSummary>(
    `/api/v1/therapist/profiles/${profileId}/appointments/upcoming`,
    { method: "GET" },
  );
}

export function getAppointmentHistory(profileId: string) {
  return apiFetch<AppointmentSummary[]>(
    `/api/v1/therapist/profiles/${profileId}/appointments/history`,
    { method: "GET" },
  );
}

export function getUnreviewedAppointments(profileId: string) {
  return apiFetch<AppointmentSummary[]>(
    `/api/v1/therapist/profiles/${profileId}/appointments/unreviewed`,
    { method: "GET" },
  );
}

export function getAssignedTherapist(profileId: string) {
  return apiFetch<AssignedTherapistResponse>(
    `/api/v1/therapist/profiles/${profileId}/assigned-therapist`,
    { method: "GET" },
  );
}

// ---------- Therapist-side aggregates ----------

export function listTherapistAppointments(
  therapistId: string,
  params?: {
    status?: AppointmentStatusServer | AppointmentStatusServer[];
    from?: string;
    to?: string;
    page?: number;
    size?: number;
    sort?: string;
  },
) {
  const query: Record<string, string | number | undefined> = {
    from: params?.from,
    to: params?.to,
    page: params?.page,
    size: params?.size,
    sort: params?.sort,
  };
  // status param is repeatable; Spring's @RequestParam binder accepts
  // comma-separated values for List<EnumType>.
  if (params?.status) {
    query.status = Array.isArray(params.status) ? params.status.join(",") : params.status;
  }
  return apiFetch<PageEnvelope<AppointmentSummary>>(
    `/api/v1/therapist/therapists/${therapistId}/appointments`,
    { method: "GET", query },
  );
}

export function listTherapistPatients(therapistId: string) {
  return apiFetch<TherapistPatientRosterItem[]>(
    `/api/v1/therapist/therapists/${therapistId}/patients`,
    { method: "GET" },
  );
}

export function getTherapistDashboardSummary(therapistId: string) {
  return apiFetch<TherapistDashboardSummary>(
    `/api/v1/therapist/therapists/${therapistId}/dashboard/summary`,
    { method: "GET" },
  );
}

export function getTherapistReviews(id: string) {
  return apiFetch<TherapistReview[]>(`/api/v1/therapist/therapists/${id}/reviews`, {
    method: "GET",
  });
}

// ---------- Patient detail (therapist-facing on therapist-api) ----------

export function getPatientMatchingPreferences(profileId: string) {
  return apiFetch<MatchingPreferencesResponse>(
    `/api/v1/therapist/patients/${profileId}/matching-preferences`,
    { method: "GET" },
  );
}

export function getPatientTags(profileId: string) {
  return apiFetch<PatientTagsResponse>(`/api/v1/therapist/patients/${profileId}/tags`, {
    method: "GET",
  });
}

export function updatePatientTags(profileId: string, tags: string[]) {
  return apiFetch<PatientTagsResponse>(`/api/v1/therapist/patients/${profileId}/tags`, {
    method: "PUT",
    body: { tags },
  });
}

export function getPatientRiskLevel(profileId: string) {
  return apiFetch<PatientRiskLevelResponse>(
    `/api/v1/therapist/patients/${profileId}/risk-level`,
    { method: "GET" },
  );
}

export function updatePatientRiskLevel(
  profileId: string,
  riskLevel: "NONE" | "LOW" | "MEDIUM" | "HIGH",
) {
  return apiFetch<PatientRiskLevelResponse>(
    `/api/v1/therapist/patients/${profileId}/risk-level`,
    { method: "PUT", body: { riskLevel } },
  );
}

// ---------- Clinical notes ----------

export function submitClinicalNote(payload: ClinicalNoteSubmitRequest) {
  return apiFetch<ClinicalNoteResponse>("/api/v1/therapist/notes", {
    method: "POST",
    body: payload,
  });
}

export function listClinicalNotes(params?: {
  therapistId?: string;
  patientId?: string;
  status?: "DRAFT" | "FINALIZED";
  page?: number;
  size?: number;
  sort?: string;
}) {
  return apiFetch<PageEnvelope<ClinicalNoteResponse>>("/api/v1/therapist/notes", {
    method: "GET",
    query: params,
  });
}

export function getClinicalNote(noteId: string) {
  return apiFetch<ClinicalNoteResponse>(`/api/v1/therapist/notes/${noteId}`, {
    method: "GET",
  });
}

export function updateClinicalNote(
  noteId: string,
  payload: Omit<ClinicalNoteSubmitRequest, "appointmentId" | "status">,
) {
  return apiFetch<ClinicalNoteResponse>(`/api/v1/therapist/notes/${noteId}`, {
    method: "PUT",
    body: payload,
  });
}

export function finalizeClinicalNote(noteId: string) {
  return apiFetch<ClinicalNoteResponse>(`/api/v1/therapist/notes/${noteId}/finalize`, {
    method: "POST",
  });
}

export function getClinicalNoteByAppointment(appointmentId: string) {
  return apiFetch<ClinicalNoteResponse>(
    `/api/v1/therapist/notes/appointments/${appointmentId}`,
    { method: "GET" },
  );
}
