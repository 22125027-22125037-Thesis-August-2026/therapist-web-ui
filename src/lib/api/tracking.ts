import { apiFetch } from "./http";

export interface DiaryEntryResponse {
  id: string;
  content: string;
  title?: string;
  moodTag?: string;
  positivityScore?: number;
  entryDate?: string;
  attachments?: MediaAttachmentResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface FoodLogResponse {
  id: string;
  waterGlasses?: number;
  foodDescription: string;
  satietyLevel: string;
  entryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MoodLogResponse {
  id: string;
  positivityScore: number;
  note?: string;
  logDate: string;
}

export interface SleepLogResponse {
  id: string;
  bedTime: string;
  wakeTime: string;
  durationMinutes?: number;
  sleepQuality?: number;
  note?: string;
  entryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaAttachmentResponse {
  id: string;
  fileName?: string;
  fileType?: string;
  fileUrl: string;
}

export interface StreakResponse {
  id: string;
  streakType: string;
  currentCount: number;
  longestCount: number;
  lastLoggedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  latestMood?: number;
  moodCount?: number;
  avgSleepMinutes?: number;
  sleepCount?: number;
  currentStreak?: number;
  longestStreak?: number;
}

export function listDiary(profileId: string) {
  return apiFetch<DiaryEntryResponse[]>(`/api/v1/tracking/diaries/${profileId}`, {
    service: "tracking",
    method: "GET",
  });
}

export function listFood(profileId: string, params?: { startDate?: string; endDate?: string }) {
  return apiFetch<FoodLogResponse[]>(`/api/v1/tracking/foods/${profileId}`, {
    service: "tracking",
    method: "GET",
    query: { startDate: params?.startDate, endDate: params?.endDate },
  });
}

export function listMood(profileId: string) {
  return apiFetch<MoodLogResponse[]>(`/api/v1/tracking/moods/${profileId}`, {
    service: "tracking",
    method: "GET",
  });
}

export function listSleep(profileId: string) {
  return apiFetch<SleepLogResponse[]>(`/api/v1/tracking/sleeps/${profileId}`, {
    service: "tracking",
    method: "GET",
  });
}

export function listStreaks() {
  return apiFetch<StreakResponse[]>("/api/v1/tracking/streaks/", {
    service: "tracking",
    method: "GET",
  });
}

export function getDashboardSummary(profileId: string) {
  return apiFetch<DashboardSummary>(`/internal/v1/dashboard/${profileId}/summary`, {
    service: "tracking",
    method: "GET",
    auth: false,
  });
}

export function getTrackingContext(profileId: string, days = 7) {
  return apiFetch<string>(`/internal/v1/tracking/context/${profileId}`, {
    service: "tracking",
    method: "GET",
    query: { days },
    auth: false,
  });
}
