const env = import.meta.env;

export const API_BASE_URL = env.VITE_API_BASE_URL ?? "http://85.211.241.204:8080";
export const CHAT_WS_URL = env.VITE_CHAT_WS_URL ?? "ws://85.211.241.204:8086/ws";

export const AUTH_TOKEN_KEY = "umatter.therapist.token";
export const AUTH_PROFILE_ID_KEY = "umatter.therapist.profileId";
