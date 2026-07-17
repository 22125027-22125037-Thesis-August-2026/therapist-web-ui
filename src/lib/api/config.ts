const env = import.meta.env;

/**
 * The deployed web UI is served from the same origin as the API gateway: Caddy
 * serves the built app at the domain root and proxies /api/* to the gateway. So
 * both URLs below default to the page's own origin, which means no host is baked
 * into the bundle — requests are same-origin (no CORS preflight at all), and an
 * IP or domain change needs no rebuild.
 *
 * Override via VITE_API_BASE_URL / VITE_CHAT_WS_URL only when the UI runs on a
 * different origin than the API — e.g. `npm run dev` on a laptop pointing at the
 * VM (see .env.development), which is genuinely cross-origin and does depend on
 * the gateway's CORS allow-list.
 */
export const API_BASE_URL = env.VITE_API_BASE_URL ?? sameOriginHttpUrl();

export const CHAT_WS_URL = env.VITE_CHAT_WS_URL ?? sameOriginWsUrl();

function sameOriginHttpUrl(): string {
  return typeof window === "undefined" ? "" : window.location.origin;
}

function sameOriginWsUrl(): string {
  if (typeof window === "undefined") {
    return "";
  }
  const scheme = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${scheme}//${window.location.host}/ws`;
}

export const AUTH_TOKEN_KEY = "umatter.therapist.token";
export const AUTH_PROFILE_ID_KEY = "umatter.therapist.profileId";
