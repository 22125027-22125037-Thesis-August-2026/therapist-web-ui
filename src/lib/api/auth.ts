import { apiFetch } from "./http";
import { AUTH_PROFILE_ID_KEY, AUTH_TOKEN_KEY } from "./config";

export interface AuthResponse {
  token: string;
  profileId: string;
  email: string;
  role: string;
}

export type LicenseStatus = "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED" | "EXPIRED";

export interface UserResponse {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  dob?: string;
  role: string;
  creditsBalance?: number;
  avatarUrl?: string;
  // Therapist-only fields (omitted/null for other roles)
  specialization?: string;
  bio?: string;
  yearsOfExperience?: number;
  consultationFee?: number;
  languages?: string[];
  licenseNumber?: string;
  licenseAuthority?: string;
  licenseExpiresAt?: string;
  licenseStatus?: LicenseStatus;
}

export interface RegisterRequest {
  fullName: string;
  avatarUrl?: string;
  email: string;
  password: string;
  phoneNumber?: string;
  dob?: string;
  role: "TEEN" | "PARENT" | "THERAPIST" | "ADMIN";
  gender?: string;
  pinCode?: string;
  accountType?: "PARENT" | "CHILD";
  school?: string;
  emergencyContact?: string;
  specialization?: string;
  bio?: string;
  yearsOfExperience?: number;
  consultationFee?: number;
  verified?: boolean;
}

export interface ProfileUpdateRequest {
  fullName?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  specialization?: string;
  bio?: string;
  yearsOfExperience?: number;
  consultationFee?: number;
  languages?: string[];
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface LicenseResponse {
  profileId: string;
  status: LicenseStatus;
  licenseNumber?: string;
  licenseAuthority?: string;
  licenseExpiresAt?: string;
  documentUrl?: string;
  verified: boolean;
}

export interface PatientDetailResponse {
  profileId: string;
  fullName: string;
  email: string;
  role: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  age?: number;
  gender?: string;
  phoneNumber?: string;
  school?: string;
  emergencyContact?: string;
}

export interface ApiResponseEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
}

export interface DataAccessGrantResponse {
  grantId: string;
  granterProfileId: string;
  granteeProfileId: string;
  status: "ACTIVE" | "REVOKED";
  accessScope: "READ_JOURNAL" | "READ_ALL";
  grantedAt?: string;
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GrantStatusResponse {
  iGaveThemAccess: boolean;
  theyGaveMeAccess: boolean;
  myGrant?: DataAccessGrantResponse;
  theirGrant?: DataAccessGrantResponse;
}

export interface ProfileSummary {
  profileId: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

export function storeSession(token: string, profileId: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_PROFILE_ID_KEY, profileId);
}

export function clearSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_PROFILE_ID_KEY);
}

export function getStoredProfileId(): string | null {
  try {
    return localStorage.getItem(AUTH_PROFILE_ID_KEY);
  } catch {
    return null;
  }
}

// ---------- Auth ----------

export function login(email: string, password: string) {
  return apiFetch<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
}

export function register(payload: RegisterRequest) {
  return apiFetch<AuthResponse>("/api/v1/auth/register", {
    method: "POST",
    body: payload,
    auth: false,
  });
}

export function getMe() {
  return apiFetch<UserResponse>("/api/v1/auth/me", { method: "GET" });
}

export function updateProfile(payload: ProfileUpdateRequest) {
  return apiFetch<UserResponse>("/api/v1/auth/profile", {
    method: "PATCH",
    body: payload,
  });
}

export function uploadAvatar(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  return apiFetch<{ url: string }>("/api/v1/auth/profile/avatar", {
    method: "POST",
    body: fd,
    isMultipart: true,
  });
}

export function logoutApi() {
  return apiFetch<string>("/api/v1/auth/logout", { method: "POST" });
}

export function changePassword(payload: ChangePasswordRequest) {
  return apiFetch<{ message: string }>("/api/v1/auth/password/change", {
    method: "POST",
    body: payload,
  });
}

// ---------- Therapist license ----------

export function getLicense() {
  return apiFetch<LicenseResponse>("/api/v1/auth/license", { method: "GET" });
}

export function renewLicense(payload: {
  document?: File;
  licenseNumber?: string;
  licenseAuthority?: string;
  licenseExpiresAt?: string;
}) {
  const fd = new FormData();
  if (payload.document) fd.append("document", payload.document);
  if (payload.licenseNumber) fd.append("licenseNumber", payload.licenseNumber);
  if (payload.licenseAuthority) fd.append("licenseAuthority", payload.licenseAuthority);
  if (payload.licenseExpiresAt) fd.append("licenseExpiresAt", payload.licenseExpiresAt);
  return apiFetch<LicenseResponse>("/api/v1/auth/license/renew", {
    method: "POST",
    body: fd,
    isMultipart: true,
  });
}

// ---------- Patients (auth-service therapist view) ----------

export function getPatientDetail(profileId: string) {
  return apiFetch<PatientDetailResponse>(`/api/v1/patients/${profileId}`, {
    method: "GET",
  });
}

// ---------- Internal & grants ----------

export function getProfileSummary(profileId: string) {
  return apiFetch<ProfileSummary>(`/internal/v1/profile/${profileId}/summary`, {
    method: "GET",
    auth: false,
  });
}

export function getGrantStatus(otherProfileId: string) {
  return apiFetch<ApiResponseEnvelope<GrantStatusResponse>>(
    `/api/v1/auth/grants/status/${otherProfileId}`,
    { method: "GET" },
  );
}

export function grantAccess(payload: {
  granteeProfileId: string;
  accessScope: "READ_JOURNAL" | "READ_ALL";
  expiresAt?: string;
}) {
  return apiFetch<ApiResponseEnvelope<DataAccessGrantResponse>>("/api/v1/auth/grants", {
    method: "POST",
    body: payload,
  });
}

export function revokeAccess(granteeProfileId: string) {
  return apiFetch<ApiResponseEnvelope<void>>(`/api/v1/auth/grants/${granteeProfileId}`, {
    method: "DELETE",
  });
}

export function listGrantsGiven(profileId: string) {
  return apiFetch<ApiResponseEnvelope<DataAccessGrantResponse[]>>(
    `/api/v1/auth/grants/${profileId}`,
    { method: "GET" },
  );
}

export function listGrantsReceived(profileId: string) {
  return apiFetch<ApiResponseEnvelope<DataAccessGrantResponse[]>>(
    `/api/v1/auth/grants/${profileId}/received`,
    { method: "GET" },
  );
}
