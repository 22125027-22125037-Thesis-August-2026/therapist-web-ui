import { apiFetch } from "./http";

export interface NotificationItem {
  notificationId: string;
  profileId: string;
  title: string;
  message: string;
  type: "BOOKING" | "STREAK" | "CHAT" | "REMINDER" | "INSIGHT";
  read: boolean;
  createdAt: string;
}

export interface NotificationPage {
  content: NotificationItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export function listNotifications(profileId: string, page = 0, size = 20) {
  return apiFetch<NotificationPage>(`/api/v1/notifications/${profileId}`, {
    service: "notification",
    method: "GET",
    query: { page, size },
    auth: false,
  });
}

export function markNotificationRead(notificationId: string) {
  return apiFetch<{ notificationId: string; read: boolean }>(
    `/api/v1/notifications/${notificationId}/read`,
    { service: "notification", method: "PUT", auth: false },
  );
}

export function markAllNotificationsRead(profileId: string) {
  return apiFetch<{ profileId: string; updatedCount: number }>(
    `/api/v1/notifications/${profileId}/read-all`,
    { service: "notification", method: "PUT", auth: false },
  );
}

export function registerDevice(payload: {
  profileId: string;
  deviceToken: string;
  platform: "ANDROID" | "IOS" | "WEB";
}) {
  return apiFetch<{ profileId: string; platform: string; lastSeenAt: string }>(
    "/api/v1/devices",
    { service: "notification", method: "POST", body: payload, auth: false },
  );
}

export function deregisterDevice(deviceToken: string) {
  return apiFetch<void>(`/api/v1/devices/${encodeURIComponent(deviceToken)}`, {
    service: "notification",
    method: "DELETE",
    auth: false,
  });
}
