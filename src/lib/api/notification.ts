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
  return apiFetch<NotificationPage>(`/api/v1/notification/notifications/${profileId}`, {
    method: "GET",
    query: { page, size },
  });
}

export function markNotificationRead(notificationId: string) {
  return apiFetch<{ notificationId: string; read: boolean }>(
    `/api/v1/notification/notifications/${notificationId}/read`,
    { method: "PUT" },
  );
}

export function markAllNotificationsRead(profileId: string) {
  return apiFetch<{ profileId: string; updatedCount: number }>(
    `/api/v1/notification/notifications/${profileId}/read-all`,
    { method: "PUT" },
  );
}

export function registerDevice(payload: {
  deviceToken: string;
  platform: "ANDROID" | "IOS" | "WEB";
}) {
  return apiFetch<{ profileId: string; platform: string; lastSeenAt: string }>(
    "/api/v1/notification/devices",
    { method: "POST", body: payload },
  );
}

export function deregisterDevice(deviceToken: string) {
  return apiFetch<void>(
    `/api/v1/notification/devices/${encodeURIComponent(deviceToken)}`,
    { method: "DELETE" },
  );
}
