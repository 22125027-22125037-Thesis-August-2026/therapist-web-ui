/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_BASE_URL?: string;
  readonly VITE_THERAPIST_BASE_URL?: string;
  readonly VITE_SOCIAL_BASE_URL?: string;
  readonly VITE_NOTIFICATION_BASE_URL?: string;
  readonly VITE_TRACKING_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
