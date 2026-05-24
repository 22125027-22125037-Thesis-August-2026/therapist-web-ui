const env = import.meta.env;

export const API_BASE_URLS = {
  auth: env.VITE_AUTH_BASE_URL ?? "http://localhost:8081",
  therapist: env.VITE_THERAPIST_BASE_URL ?? "http://localhost:8082",
  social: env.VITE_SOCIAL_BASE_URL ?? "http://localhost:8083",
  notification: env.VITE_NOTIFICATION_BASE_URL ?? "http://localhost:8084",
  tracking: env.VITE_TRACKING_BASE_URL ?? "http://localhost:8085",
} as const;

export type ServiceKey = keyof typeof API_BASE_URLS;

export const AUTH_TOKEN_KEY = "umatter.therapist.token";
export const AUTH_PROFILE_ID_KEY = "umatter.therapist.profileId";
