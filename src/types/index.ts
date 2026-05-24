export type UserRole = "THERAPIST" | "TEEN" | "PARENT" | "ADMIN";

export type TherapistStatus =
  | "PENDING_LICENSE_VERIFICATION"
  | "ACTIVE"
  | "LICENSE_EXPIRED"
  | "SUSPENDED";

export interface TherapistProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  specialization: string;
  bio: string;
  yearsOfExperience: number;
  consultationFee: number;
  licenseNumber: string;
  licenseAuthority: string;
  licenseExpiresAt: string;
  status: TherapistStatus;
  avatarUrl?: string;
  languages: string[];
}

export type AppointmentMode = "VIDEO" | "CHAT";
export type AppointmentStatus =
  | "REQUESTED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientAvatarUrl?: string;
  startsAt: string;
  endsAt: string;
  mode: AppointmentMode;
  status: AppointmentStatus;
  reason: string;
  slotId: string;
  endedAt?: string;
  videoRoomName?: string;
}

export interface AvailabilitySlot {
  id: string;
  startsAt: string;
  endsAt: string;
  isBooked: boolean;
  bookedByPatientId?: string;
  bookedByPatientName?: string;
  recurring?: { freq: "WEEKLY"; until: string };
}

export type RiskLevel = "NONE" | "LOW" | "MEDIUM" | "HIGH";

export type GrantStatus = "NONE" | "PENDING" | "GRANTED" | "REVOKED" | "EXPIRED";

export interface PatientPermissionState {
  patientId: string;
  theyGaveMeAccess: boolean;
  grantStatus: GrantStatus;
  expiresAt?: string;
  requestedAt?: string;
}

export interface Patient {
  id: string;
  fullName: string;
  avatarUrl?: string;
  age: number;
  gender: "MALE" | "FEMALE" | "OTHER";
  role: "TEEN" | "PARENT";
  primaryConcern: string;
  riskLevel: RiskLevel;
  contact?: { email?: string; phone?: string };
  emergencyContact?: { name: string; phone: string; relation: string };
  tags: string[];
  lastSessionAt?: string;
  nextSessionAt?: string;
  permission: PatientPermissionState;
  matchingForm?: Record<string, string>;
}

export interface DiaryEntry {
  id: string;
  patientId: string;
  createdAt: string;
  title: string;
  body: string;
  mood: "GREAT" | "GOOD" | "NEUTRAL" | "LOW" | "BAD";
}

export interface FoodLog {
  id: string;
  patientId: string;
  createdAt: string;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  items: string;
  satiety: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

export interface SleepLog {
  id: string;
  patientId: string;
  date: string;
  bedtime: string;
  wakeTime: string;
  durationHours: number;
  quality: 1 | 2 | 3 | 4 | 5;
}

export interface MoodCheckIn {
  id: string;
  patientId: string;
  createdAt: string;
  mood: "GREAT" | "GOOD" | "NEUTRAL" | "LOW" | "BAD";
  note?: string;
}

export type ClinicalNoteStatus = "DRAFT" | "FINALIZED";

export interface ClinicalNote {
  id: string;
  patientId: string;
  patientName: string;
  appointmentId?: string;
  createdAt: string;
  updatedAt: string;
  status: ClinicalNoteStatus;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  riskFlags: {
    suicidalIdeation: boolean;
    selfHarm: boolean;
    substanceUse: boolean;
    abuse: boolean;
  };
  summary?: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  fromMe: boolean;
  body: string;
  createdAt: string;
  attachments?: { name: string; url: string; kind: "IMAGE" | "PDF" }[];
}

export interface ChatChannel {
  id: string;
  patientId: string;
  patientName: string;
  patientAvatarUrl?: string;
  type: "THERAPIST_CONSULT";
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  permissionGranted: boolean;
}

export interface NotificationItem {
  id: string;
  kind: "NEW_BOOKING" | "NEW_MESSAGE" | "GRANT" | "CANCEL" | "MOOD_ALERT";
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  link?: string;
}

export interface AuditEntry {
  id: string;
  therapistId: string;
  patientId: string;
  resource: "DIARY" | "FOOD" | "SLEEP" | "MOOD" | "NOTE";
  action: "READ" | "WRITE";
  at: string;
}
