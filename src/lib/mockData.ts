import { addDays, addHours, addMinutes, formatISO, subDays } from "date-fns";
import type {
  Appointment,
  AuditEntry,
  AvailabilitySlot,
  ChatChannel,
  ChatMessage,
  ClinicalNote,
  DiaryEntry,
  FoodLog,
  MoodCheckIn,
  NotificationItem,
  Patient,
  SleepLog,
  TherapistProfile,
} from "@/types";

const now = new Date();
const iso = (d: Date) => formatISO(d);

export const mockTherapist: TherapistProfile = {
  id: "th_1",
  fullName: "Dr. Nguyễn Minh Anh",
  email: "minhanh@umatter.health",
  phone: "+84 901 234 567",
  dob: "1988-04-12",
  specialization: "Adolescent CBT, Anxiety, Mood disorders",
  bio: "10+ years working with teens & families. Trained at HCMUE; CBT-certified.",
  yearsOfExperience: 11,
  consultationFee: 750000,
  licenseNumber: "VN-PSY-20140571",
  licenseAuthority: "Bộ Y Tế Việt Nam",
  licenseExpiresAt: iso(addDays(now, 240)),
  status: "ACTIVE",
  languages: ["vi", "en"],
};

export const mockPatients: Patient[] = [
  {
    id: "p_1",
    fullName: "Lê Bảo Hân",
    age: 16,
    gender: "FEMALE",
    role: "TEEN",
    primaryConcern: "Generalized anxiety, school stress",
    riskLevel: "MEDIUM",
    contact: { email: "hanlb@school.vn" },
    emergencyContact: { name: "Lê Văn Nam", phone: "+84 909 111 222", relation: "Father" },
    tags: ["anxiety", "school"],
    lastSessionAt: iso(subDays(now, 6)),
    nextSessionAt: iso(addDays(now, 1)),
    permission: {
      patientId: "p_1",
      theyGaveMeAccess: true,
      grantStatus: "GRANTED",
      expiresAt: iso(addDays(now, 90)),
    },
    matchingForm: {
      "Primary concern": "Anxiety about university entrance exams",
      "Therapy goals": "Better sleep, manage panic episodes",
      "Prior therapy": "No",
      "Medications": "None",
    },
  },
  {
    id: "p_2",
    fullName: "Trần Quốc Việt",
    age: 17,
    gender: "MALE",
    role: "TEEN",
    primaryConcern: "Low mood, social withdrawal",
    riskLevel: "HIGH",
    tags: ["mood", "social"],
    lastSessionAt: iso(subDays(now, 2)),
    nextSessionAt: iso(addDays(now, 0)),
    permission: {
      patientId: "p_2",
      theyGaveMeAccess: true,
      grantStatus: "GRANTED",
      expiresAt: iso(addDays(now, 30)),
    },
  },
  {
    id: "p_3",
    fullName: "Phạm Thiên Kim",
    age: 15,
    gender: "FEMALE",
    role: "TEEN",
    primaryConcern: "Family conflict",
    riskLevel: "LOW",
    tags: ["family"],
    permission: {
      patientId: "p_3",
      theyGaveMeAccess: false,
      grantStatus: "PENDING",
      requestedAt: iso(subDays(now, 1)),
    },
  },
  {
    id: "p_4",
    fullName: "Hoàng Đức Phúc",
    age: 14,
    gender: "MALE",
    role: "TEEN",
    primaryConcern: "Sleep disturbances",
    riskLevel: "NONE",
    tags: ["sleep"],
    lastSessionAt: iso(subDays(now, 14)),
    permission: {
      patientId: "p_4",
      theyGaveMeAccess: false,
      grantStatus: "NONE",
    },
  },
  {
    id: "p_5",
    fullName: "Nguyễn Hà Linh (Parent)",
    age: 42,
    gender: "FEMALE",
    role: "PARENT",
    primaryConcern: "Parenting support, teen conflict",
    riskLevel: "NONE",
    tags: ["parenting"],
    permission: {
      patientId: "p_5",
      theyGaveMeAccess: true,
      grantStatus: "GRANTED",
      expiresAt: iso(addDays(now, 180)),
    },
  },
];

export const mockAppointments: Appointment[] = [
  {
    id: "a_1",
    patientId: "p_2",
    patientName: "Trần Quốc Việt",
    startsAt: iso(addMinutes(now, 8)),
    endsAt: iso(addMinutes(now, 58)),
    mode: "VIDEO",
    status: "CONFIRMED",
    reason: "Follow-up on low mood, review homework from last session.",
    slotId: "s_1",
    videoRoomName: "umatter-a_1",
  },
  {
    id: "a_2",
    patientId: "p_1",
    patientName: "Lê Bảo Hân",
    startsAt: iso(addHours(now, 3)),
    endsAt: iso(addHours(now, 4)),
    mode: "VIDEO",
    status: "CONFIRMED",
    reason: "Panic episodes during mock exams.",
    slotId: "s_2",
    videoRoomName: "umatter-a_2",
  },
  {
    id: "a_3",
    patientId: "p_5",
    patientName: "Nguyễn Hà Linh",
    startsAt: iso(addDays(now, 1)),
    endsAt: iso(addMinutes(addDays(now, 1), 50)),
    mode: "CHAT",
    status: "CONFIRMED",
    reason: "Parenting support — managing teen's withdrawal.",
    slotId: "s_3",
  },
  {
    id: "a_4",
    patientId: "p_3",
    patientName: "Phạm Thiên Kim",
    startsAt: iso(addDays(now, 2)),
    endsAt: iso(addMinutes(addDays(now, 2), 60)),
    mode: "VIDEO",
    status: "REQUESTED",
    reason: "Intake / first session.",
    slotId: "s_4",
  },
  {
    id: "a_5",
    patientId: "p_1",
    patientName: "Lê Bảo Hân",
    startsAt: iso(subDays(now, 6)),
    endsAt: iso(addMinutes(subDays(now, 6), 50)),
    mode: "VIDEO",
    status: "COMPLETED",
    reason: "Weekly session.",
    slotId: "s_5",
    endedAt: iso(addMinutes(subDays(now, 6), 50)),
  },
  {
    id: "a_6",
    patientId: "p_4",
    patientName: "Hoàng Đức Phúc",
    startsAt: iso(subDays(now, 3)),
    endsAt: iso(addMinutes(subDays(now, 3), 45)),
    mode: "CHAT",
    status: "CANCELLED",
    reason: "Patient cancelled — exam week.",
    slotId: "s_6",
  },
];

export const mockSlots: AvailabilitySlot[] = (() => {
  const slots: AvailabilitySlot[] = [];
  for (let d = 0; d < 7; d++) {
    for (const h of [9, 10, 11, 14, 15, 16]) {
      const start = new Date(now);
      start.setDate(now.getDate() + d);
      start.setHours(h, 0, 0, 0);
      const end = new Date(start);
      end.setHours(h + 1);
      const isBooked = Math.random() < 0.3;
      slots.push({
        id: `slot_${d}_${h}`,
        startsAt: iso(start),
        endsAt: iso(end),
        isBooked,
        bookedByPatientName: isBooked ? "Bảo Hân" : undefined,
      });
    }
  }
  return slots;
})();

export const mockDiary: DiaryEntry[] = [
  {
    id: "d_1",
    patientId: "p_1",
    createdAt: iso(subDays(now, 1)),
    title: "Couldn't sleep again",
    body: "Lay in bed for 2 hours thinking about the mock exam. Heart kept racing.",
    mood: "LOW",
  },
  {
    id: "d_2",
    patientId: "p_1",
    createdAt: iso(subDays(now, 3)),
    title: "Better day",
    body: "Did the breathing exercise. It helped a bit before class.",
    mood: "NEUTRAL",
  },
  {
    id: "d_3",
    patientId: "p_1",
    createdAt: iso(subDays(now, 5)),
    title: "Fight with mom",
    body: "She doesn't get it. I told her I'm not lazy, just tired.",
    mood: "BAD",
  },
  {
    id: "d_4",
    patientId: "p_2",
    createdAt: iso(subDays(now, 2)),
    title: "Skipped class",
    body: "Just couldn't face people. Stayed in bed.",
    mood: "BAD",
  },
];

export const mockFood: FoodLog[] = [
  { id: "f_1", patientId: "p_1", createdAt: iso(subDays(now, 0)), mealType: "BREAKFAST", items: "Phở bò", satiety: 4 },
  { id: "f_2", patientId: "p_1", createdAt: iso(subDays(now, 0)), mealType: "LUNCH", items: "Cơm tấm", satiety: 5 },
  { id: "f_3", patientId: "p_1", createdAt: iso(subDays(now, 1)), mealType: "DINNER", items: "Mì gói", satiety: 2 },
  { id: "f_4", patientId: "p_1", createdAt: iso(subDays(now, 2)), mealType: "LUNCH", items: "Bánh mì", satiety: 3 },
  { id: "f_5", patientId: "p_1", createdAt: iso(subDays(now, 3)), mealType: "BREAKFAST", items: "Yoghurt", satiety: 2 },
];

export const mockSleep: SleepLog[] = (() => {
  const out: SleepLog[] = [];
  for (let i = 0; i < 7; i++) {
    out.push({
      id: `sl_${i}`,
      patientId: "p_1",
      date: iso(subDays(now, i)).slice(0, 10),
      bedtime: "23:30",
      wakeTime: "06:30",
      durationHours: 5 + Math.random() * 3,
      quality: ((Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3 | 4 | 5),
    });
  }
  return out;
})();

export const mockMood: MoodCheckIn[] = [
  { id: "m_1", patientId: "p_1", createdAt: iso(subDays(now, 0)), mood: "LOW", note: "Tired" },
  { id: "m_2", patientId: "p_1", createdAt: iso(subDays(now, 1)), mood: "NEUTRAL" },
  { id: "m_3", patientId: "p_1", createdAt: iso(subDays(now, 2)), mood: "LOW" },
  { id: "m_4", patientId: "p_1", createdAt: iso(subDays(now, 3)), mood: "BAD" },
  { id: "m_5", patientId: "p_1", createdAt: iso(subDays(now, 4)), mood: "NEUTRAL" },
];

export const mockNotes: ClinicalNote[] = [
  {
    id: "n_1",
    patientId: "p_1",
    patientName: "Lê Bảo Hân",
    appointmentId: "a_5",
    createdAt: iso(subDays(now, 6)),
    updatedAt: iso(subDays(now, 6)),
    status: "FINALIZED",
    subjective: "Reports persistent worry about university entrance exam. Sleep onset 1-2 hrs.",
    objective: "Mildly tense, good eye contact. PHQ-9 = 9, GAD-7 = 12.",
    assessment: "Generalized anxiety, moderate. No acute risk.",
    plan: "Continue weekly CBT. Sleep hygiene worksheet. Re-screen in 3 weeks.",
    riskFlags: { suicidalIdeation: false, selfHarm: false, substanceUse: false, abuse: false },
    summary: "Stable, anxiety moderate, continuing CBT.",
  },
  {
    id: "n_2",
    patientId: "p_2",
    patientName: "Trần Quốc Việt",
    createdAt: iso(subDays(now, 2)),
    updatedAt: iso(subDays(now, 2)),
    status: "DRAFT",
    subjective: "Skipped 3 days of school. 'Don't see the point.'",
    objective: "Flat affect. Speech slowed.",
    assessment: "Moderate depressive episode. Monitor SI closely.",
    plan: "Safety plan reviewed. Daily check-in via app. Refer for psychiatric eval if no improvement in 1 week.",
    riskFlags: { suicidalIdeation: true, selfHarm: false, substanceUse: false, abuse: false },
    summary: "Mood declined; safety plan reinforced.",
  },
];

export const mockChannels: ChatChannel[] = mockPatients.slice(0, 4).map((p, i) => ({
  id: `c_${p.id}`,
  patientId: p.id,
  patientName: p.fullName,
  type: "THERAPIST_CONSULT",
  lastMessage: i === 0 ? "Thanks for the breathing exercise PDF." : "See you on Thursday.",
  lastMessageAt: iso(addMinutes(now, -10 * (i + 1))),
  unreadCount: i === 0 ? 2 : 0,
  permissionGranted: p.permission.theyGaveMeAccess,
}));

export const mockMessages: Record<string, ChatMessage[]> = {
  c_p_1: [
    {
      id: "msg_1",
      channelId: "c_p_1",
      senderId: "p_1",
      senderName: "Lê Bảo Hân",
      fromMe: false,
      body: "Em không ngủ được tối qua nữa.",
      createdAt: iso(addMinutes(now, -60)),
    },
    {
      id: "msg_2",
      channelId: "c_p_1",
      senderId: "th_1",
      senderName: "Dr. Nguyễn Minh Anh",
      fromMe: true,
      body: "Cảm ơn em đã chia sẻ. Em đã thử bài tập thở chưa?",
      createdAt: iso(addMinutes(now, -55)),
    },
    {
      id: "msg_3",
      channelId: "c_p_1",
      senderId: "p_1",
      senderName: "Lê Bảo Hân",
      fromMe: false,
      body: "Có ạ, nhưng vẫn lo về kỳ thi.",
      createdAt: iso(addMinutes(now, -10)),
    },
  ],
};

export const mockNotifications: NotificationItem[] = [
  {
    id: "nt_1",
    kind: "NEW_BOOKING",
    title: "New booking request",
    body: "Phạm Thiên Kim requested an intake session.",
    createdAt: iso(addMinutes(now, -30)),
    read: false,
    link: "/appointments/a_4",
  },
  {
    id: "nt_2",
    kind: "GRANT",
    title: "Data access granted",
    body: "Lê Bảo Hân granted you READ_ALL access.",
    createdAt: iso(addMinutes(now, -120)),
    read: false,
    link: "/patients/p_1",
  },
  {
    id: "nt_3",
    kind: "MOOD_ALERT",
    title: "Mood alert",
    body: "3 patients reported low mood for 4+ consecutive days.",
    createdAt: iso(addMinutes(now, -240)),
    read: true,
  },
];

export const mockAudit: AuditEntry[] = [
  { id: "au_1", therapistId: "th_1", patientId: "p_1", resource: "DIARY", action: "READ", at: iso(addMinutes(now, -120)) },
  { id: "au_2", therapistId: "th_1", patientId: "p_1", resource: "MOOD", action: "READ", at: iso(addMinutes(now, -110)) },
  { id: "au_3", therapistId: "th_1", patientId: "p_2", resource: "NOTE", action: "WRITE", at: iso(subDays(now, 2)) },
];
