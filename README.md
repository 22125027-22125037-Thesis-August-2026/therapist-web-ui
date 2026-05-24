# uMatter — Therapist Web UI

Desktop-first React web app for the **THERAPIST** role of uMatter. Counterpart of the React Native client at `../thesis-mobile/`. Spec: [docs/Therapist_UI_Web.md](docs/Therapist_UI_Web.md).

## Stack

- Vite 5 + React 18 + TypeScript
- React Router 6
- Tailwind CSS + shadcn/ui-style components (Radix primitives)
- Recharts for charts (food / sleep)
- date-fns
- Jitsi `meet.jit.si` for embedded video sessions

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:5173. The login page is pre-filled with a mock therapist account — just click **Sign in**.

## What's implemented

This is a UI-only scaffold backed by mock data in `src/lib/mockData.ts`. Every screen from the spec is present:

| § in spec | Route | File |
|---|---|---|
| 3.1 | `/login` | `pages/auth/LoginPage.tsx` |
| 3.2 | `/register` | `pages/auth/RegisterPage.tsx` |
| 3.3 | `/license-pending` | `pages/auth/LicensePendingPage.tsx` |
| 4 | `/` | `pages/DashboardPage.tsx` |
| 5.1 | `/appointments` | `pages/appointments/AppointmentsListPage.tsx` |
| 5.2 | `/appointments/:id` | `pages/appointments/AppointmentDetailPage.tsx` |
| 5.3 | `/appointments/:id/video` | `pages/appointments/VideoSessionPage.tsx` |
| 6 | `/availability` | `pages/availability/AvailabilityPage.tsx` |
| 7.1 | `/patients` | `pages/patients/PatientsListPage.tsx` |
| 7.2 | `/patients/:id` | `pages/patients/PatientProfilePage.tsx` |
| 8 | `/clinical-notes`, `/clinical-notes/:id` | `pages/clinical-notes/…` |
| 9 | `/messages` | `pages/messages/MessagesPage.tsx` |
| 10 | `/settings` | `pages/SettingsPage.tsx` |

## Permission gating

Patient tracking tabs (diary / food / sleep / mood) honor `patient.permission.theyGaveMeAccess`. When false they render the locked-card state (`components/LockedCard.tsx`). Same semantics as the mobile `FriendProfileScreen`.

## Next: wire the real backend

1. Replace `src/lib/mockData.ts` reads with API calls to `thesis-backend` / `therapist-api`. The relevant controllers are listed in `docs/THERAPIST_API_CONTROLLER_REFERENCE.md`, `docs/SOCIAL_API_CONTROLLER_REFERENCE.md`, and `docs/NOTIFICATION_API_CONTROLLER_REFERENCE.md`.
2. Swap mock chat with the WebSocket client from the mobile app (`CHAT_BROKER_URL`).
3. Replace `AuthContext.login` with the same `/auth/login` flow used by the mobile `AuthContext`.

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — type-check then production build
- `npm run preview` — preview the production build
- `npm run lint` — TypeScript no-emit check
