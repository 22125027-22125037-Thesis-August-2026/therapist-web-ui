import { apiFetch } from "./http";

export interface FriendRequestItem {
  id: string;
  senderId: string;
  senderProfilename: string;
  receiverId: string;
  receiverProfilename: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface FriendItem {
  profileId: string;
  profilename: string;
}

export interface ChannelItem {
  channelId: string;
  type: "DIRECT_FRIEND" | "THERAPIST_CONSULT";
  counterpartProfileId: string;
  counterpartProfilename: string;
  counterpartDisplayName?: string | null;
  counterpartAvatarUrl?: string | null;
  lastMessagePreview?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
  moodAlert?: string | null;
  checkInPrompt?: string | null;
}

export interface ChannelMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderProfilename: string;
  content: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PageEnvelope<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export function createFriendRequest(receiverEmail: string) {
  return apiFetch<void>("/api/v1/friends/requests", {
    service: "social",
    method: "POST",
    body: { receiverEmail },
  });
}

export function cancelFriendRequest(requestId: string) {
  return apiFetch<void>(`/api/v1/friends/requests/${requestId}`, {
    service: "social",
    method: "DELETE",
  });
}

export function acceptFriendRequest(requestId: string) {
  return apiFetch<void>(`/api/v1/friends/requests/${requestId}/accept`, {
    service: "social",
    method: "POST",
  });
}

export function rejectFriendRequest(requestId: string) {
  return apiFetch<void>(`/api/v1/friends/requests/${requestId}/reject`, {
    service: "social",
    method: "POST",
  });
}

export function listIncomingFriendRequests(page = 0, size = 20) {
  return apiFetch<PageEnvelope<FriendRequestItem>>("/api/v1/friends/requests/incoming", {
    service: "social",
    method: "GET",
    query: { page, size },
  });
}

export function listOutgoingFriendRequests(page = 0, size = 20) {
  return apiFetch<PageEnvelope<FriendRequestItem>>("/api/v1/friends/requests/outgoing", {
    service: "social",
    method: "GET",
    query: { page, size },
  });
}

export function listFriends() {
  return apiFetch<FriendItem[]>("/api/v1/friends", { service: "social", method: "GET" });
}

export function unfriend(profileId: string) {
  return apiFetch<void>(`/api/v1/friends/${profileId}`, { service: "social", method: "DELETE" });
}

export function listChannels() {
  return apiFetch<ChannelItem[]>("/api/v1/chats/channels", {
    service: "social",
    method: "GET",
  });
}

export function createChannel(payload: {
  type: "DIRECT_FRIEND" | "THERAPIST_CONSULT";
  referenceId?: string;
  participantIds: string[];
}) {
  return apiFetch<ChannelItem>("/api/v1/chats/channels", {
    service: "social",
    method: "POST",
    body: payload,
  });
}

export function listChannelMessages(channelId: string, page = 0, size = 20) {
  return apiFetch<PageEnvelope<ChannelMessage>>(
    `/api/v1/chats/channels/${channelId}/messages`,
    { service: "social", method: "GET", query: { page, size } },
  );
}

export function markMessageRead(channelId: string, messageId: string) {
  return apiFetch<void>(
    `/api/v1/chats/channels/${channelId}/messages/${messageId}/read`,
    { service: "social", method: "PATCH" },
  );
}
