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
  status: string;
  message?: string;
}

export interface JoinSessionResponse {
  meetingUrl: string;
  sdkToken: string;
}

export interface AppointmentSummary {
  appointmentId: string;
  profileId: string;
  therapistId: string;
  therapistName?: string;
  therapistSpecialization?: string;
  location?: string;
  slotId: string;
  mode: "VIDEO" | "CHAT";
  status: "REQUESTED" | "UPCOMING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  startDatetime: string;
}

export interface ClinicalNoteResponse {
  noteId: string;
  appointmentId: string;
  appointmentStatus?: string;
  diagnosis?: string;
  recommendations?: string;
  createdAt: string;
  message?: string;
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

export function getTherapist(id: string) {
  return apiFetch<TherapistDetailResponse>(`/api/v1/therapists/${id}`, {
    service: "therapist",
    method: "GET",
  });
}

export function getTherapistSlots(
  id: string,
  params?: { page?: number; size?: number; sort?: string },
) {
  return apiFetch<PageEnvelope<SlotResponse>>(`/api/v1/therapists/${id}/slots`, {
    service: "therapist",
    method: "GET",
    query: { page: params?.page, size: params?.size, sort: params?.sort },
  });
}

export function getTherapistReviews(id: string) {
  return apiFetch<TherapistReview[]>(`/api/v1/therapists/${id}/reviews`, {
    service: "therapist",
    method: "GET",
  });
}

export function createBooking(slotId: string) {
  return apiFetch<BookingResponse>("/api/v1/bookings", {
    service: "therapist",
    method: "POST",
    body: { slotId },
  });
}

export function joinSession(appointmentId: string) {
  return apiFetch<JoinSessionResponse>(`/api/v1/bookings/${appointmentId}/join`, {
    service: "therapist",
    method: "GET",
  });
}

export function getUpcomingAppointment(profileId: string) {
  return apiFetch<AppointmentSummary>(
    `/api/v1/profiles/${profileId}/appointments/upcoming`,
    { service: "therapist", method: "GET" },
  );
}

export function getAppointmentHistory(profileId: string) {
  return apiFetch<AppointmentSummary[]>(
    `/api/v1/profiles/${profileId}/appointments/history`,
    { service: "therapist", method: "GET" },
  );
}

export function getUnreviewedAppointments(profileId: string) {
  return apiFetch<AppointmentSummary[]>(
    `/api/v1/profiles/${profileId}/appointments/unreviewed`,
    { service: "therapist", method: "GET" },
  );
}

export function getAssignedTherapist(profileId: string) {
  return apiFetch<AssignedTherapistResponse>(
    `/api/v1/profiles/${profileId}/assigned-therapist`,
    { service: "therapist", method: "GET" },
  );
}

export function submitClinicalNote(payload: {
  appointmentId: string;
  diagnosis: string;
  recommendations: string;
}) {
  return apiFetch<ClinicalNoteResponse>("/api/v1/notes", {
    service: "therapist",
    method: "POST",
    body: payload,
  });
}

export function getClinicalNoteByAppointment(appointmentId: string) {
  return apiFetch<ClinicalNoteResponse>(`/api/v1/notes/appointments/${appointmentId}`, {
    service: "therapist",
    method: "GET",
  });
}
