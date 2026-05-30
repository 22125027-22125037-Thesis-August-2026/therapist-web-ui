# Missing API Endpoints & Data Gaps

This document tracks API surface gaps discovered while wiring the therapist
web UI to real backend data. Each entry names:

- the page / feature that needs it,
- the missing endpoint or field,
- and the **service** (markdown reference) that should own it.

Service references in this document:

- `THERAPIST_API_CONTROLLER_REFERENCE.md` — `therapist-api`, base `http://localhost:8082`
- `Authentication Service API controller.md` — `auth-service`, base `http://localhost:8081`
- `Tracking Service API controller.md` — `tracking-service`, base `http://localhost:8085`
- `SOCIAL_API_CONTROLLER_REFERENCE.md` — `social-service`, base `http://localhost:8083`
- `NOTIFICATION_API_CONTROLLER_REFERENCE.md` — `notification-service`, base `http://localhost:8084`

Status legend:

- 🔴 Blocking — no client workaround
- 🟠 Painful — works via fan-out / merging but slow or fragile
- 🟡 Cosmetic — UI degrades gracefully

---

## 1. Therapist-side appointment surface

The current `therapist-api` is mostly patient-centric. Every "list" endpoint is
keyed by **patient** `profileId`. The therapist console needs the inverse view.

### 1.1 🔴 List all appointments for the logged-in therapist
- **Page(s):** Dashboard, Appointments list (`/appointments`), Clinical notes
  list (`/clinical-notes`)
- **Service:** `THERAPIST_API_CONTROLLER_REFERENCE.md`
- **Proposed:** `GET /api/v1/therapists/{therapistId}/appointments?status=&from=&to=&page=&size=`
- **Why:** Today the UI iterates over every chat-channel counterpart and calls
  `GET /api/v1/profiles/{profileId}/appointments/upcoming` + `/history` per
  patient. That's `O(N)` round-trips just to populate the appointments list,
  and it silently excludes patients who haven't started a chat channel yet.
- **Workaround in code:** `src/lib/api/therapistAppointments.ts` fans out per
  channel.

### 1.2 🔴 Fetch a single appointment by id
- **Page(s):** Appointment detail (`/appointments/:id`), Video session
  (`/appointments/:id/video`), Clinical-note editor
- **Service:** `THERAPIST_API_CONTROLLER_REFERENCE.md`
- **Proposed:** `GET /api/v1/bookings/{appointmentId}` returning the full
  appointment record (patient id, therapist id, slot, mode, status,
  startDatetime, endDatetime, reason).
- **Workaround:** re-fetches the entire therapist-appointment aggregate and
  filters by id (slow).

### 1.3 🔴 Cancel an appointment with a reason
- **Page(s):** Appointment detail dialog
- **Service:** `THERAPIST_API_CONTROLLER_REFERENCE.md`
- **Proposed:** `POST /api/v1/bookings/{appointmentId}/cancel` with body
  `{ reason: string }`; should release the slot and emit a
  `social.appointment_cancelled` (or notification-service) event.
- **Today:** the Cancel button is wired but it cannot actually cancel.

### 1.4 🔴 Confirm or reject a `REQUESTED` booking
- **Page(s):** Appointment detail, Dashboard "pending bookings" CTA
- **Service:** `THERAPIST_API_CONTROLLER_REFERENCE.md`
- **Proposed:** `POST /api/v1/bookings/{appointmentId}/confirm` and `…/reject`.
- **Status today:** booking is created via `POST /api/v1/bookings` (patient
  side) and there's no therapist-side acknowledgement step exposed.

### 1.5 🟡 Appointment payload should include `endDatetime`, `reason`, `mode`
- **Pages:** Appointment detail, Dashboard schedule row
- **Service:** `THERAPIST_API_CONTROLLER_REFERENCE.md`
- **Field gaps in `AppointmentSummary` (history/upcoming responses):**
  - `endDatetime` — UI currently estimates "+1h" client-side.
  - `reason` — patient's stated reason at booking time. Not captured at all in
    the current `POST /api/v1/bookings` body (`slotId` only).
  - `mode` — present on the field list but listed as `VIDEO|CHAT`; `CHAT` mode
    has no current pathway, since `POST /api/v1/bookings` doesn't accept a
    mode argument. Clarify whether CHAT-mode appointments exist.

---

## 2. Therapist profile & directory

### 2.1 🔴 Therapist's own profile (rich fields) 
- **Page(s):** Settings → Profile tab, Sidebar header, License tab
- **Service:** `Authentication Service API controller.md`
- **Today:** `GET /api/v1/auth/me` returns
  `id, fullName, email, phoneNumber, dob, role, creditsBalance, avatarUrl`. Missing:
  - `specialization`, `bio`, `yearsOfExperience`, `consultationFee` —
    captured by `POST /api/v1/auth/register` but not retrievable.
  - `licenseNumber`, `licenseAuthority`, `licenseExpiresAt`, `status` (license
    verification state).
  - `languages` (array).
- **Proposed:** extend `UserResponse` to include these fields for THERAPIST
  role, or expose `GET /api/v1/therapists/me` that returns the
  `TherapistDetailResponse` shape used by the patient-facing therapist detail.

### 2.2 🟠 Update therapist-specific profile fields
- **Page(s):** Settings → Profile tab
- **Service:** `Authentication Service API controller.md`
- **Today:** `PATCH /api/v1/auth/profile` only accepts
  `{ fullName, avatarUrl, phoneNumber }`.
- **Proposed:** allow updating `bio`, `specialization`, `yearsOfExperience`,
  `consultationFee`, `languages`.

### 2.3 🔴 License verification lifecycle
- **Page(s):** `/license-pending` and Settings → License tab
- **Service:** `Authentication Service API controller.md`
- **Missing endpoints:**
  - `GET /api/v1/auth/license` — return current license verification status,
    history, uploaded document urls.
  - `POST /api/v1/auth/license/renew` — multipart upload of renewal document.
  - Admin-side: `POST /admin/v1/therapists/{id}/license/verify` (and reject).
- **Today:** therapist status defaults to `ACTIVE` after `GET /api/v1/auth/me`
  because the API does not report a `PENDING_LICENSE_VERIFICATION` state.

### 2.4 🟡 Active sessions / device list
- **Page(s):** Settings → Security tab
- **Service:** `Authentication Service API controller.md`
- **Proposed:**
  - `GET /api/v1/auth/sessions` — list active access tokens.
  - `DELETE /api/v1/auth/sessions/{id}` — revoke a session.
  - `POST /api/v1/auth/password/change` — current+new password.

---

## 3. Availability / scheduling (therapist side)

### 3.1 🔴 Create, update, delete availability slots
- **Page(s):** `/availability`
- **Service:** `THERAPIST_API_CONTROLLER_REFERENCE.md`
- **Today:** only `GET /api/v1/therapists/{id}/slots` (read) exists. Schedule
  generation is a background job triggered by
  `POST /api/v1/test/trigger-generation` (test-only).
- **Proposed:**
  - `POST /api/v1/therapists/{id}/slots` — create one slot
    `{ startDatetime, endDatetime }`.
  - `PUT /api/v1/therapists/{id}/slots/{slotId}` — reschedule or update.
  - `DELETE /api/v1/therapists/{id}/slots/{slotId}` — delete an unbooked slot.
  - `POST /api/v1/therapists/{id}/slots:bulk` for recurring patterns.

### 3.2 🟠 Slot payload should expose booking state
- **Page(s):** `/availability`
- **Service:** `THERAPIST_API_CONTROLLER_REFERENCE.md`
- **Today:** `GET /api/v1/therapists/{id}/slots` returns
  `{ slotId, startDatetime, endDatetime }` — only **unbooked** slots, per the
  docs. The therapist's weekly calendar wants to render booked slots too
  (with the patient's name) so the therapist can see what's full.
- **Proposed:** include `isBooked`, `bookedByPatientId`, `bookedByPatientName`
  and accept a `?includeBooked=true` flag.

### 3.3 🟡 Recurring availability templates
- **Page(s):** `/availability`, Settings → Availability defaults
- **Service:** `THERAPIST_API_CONTROLLER_REFERENCE.md`
- **Proposed:** therapist templates ("Standard week", buffer/session length
  defaults) — currently no API surface.

---

## 4. Patient roster & profile (therapist-facing)

### 4.1 🔴 List the therapist's patients
- **Page(s):** `/patients` list, Dashboard active-patient count, Top-bar
  search.
- **Service:** `THERAPIST_API_CONTROLLER_REFERENCE.md` (assignment data) **or**
  a new `therapist-api` endpoint.
- **Today:** we infer the patient roster from chat channels
  (`GET /api/v1/chats/channels`, type `THERAPIST_CONSULT`). That misses
  patients who never started a chat.
- **Proposed:** `GET /api/v1/therapists/{id}/patients` returning all profiles
  currently or previously assigned to this therapist (status `ACTIVE` and
  optionally `CLOSED`).

### 4.2 🟠 Patient detail payload for therapist
- **Page(s):** `/patients/:id`, Top-bar search, Appointment detail sidebar
- **Service:** `Authentication Service API controller.md`
- **Today:** `GET /internal/v1/profile/{profileId}/summary` returns
  `profileId, name, email, role, avatarUrl`. The marker `internal/` suggests
  this is meant for backend-to-backend use and may not be safe to call from
  the browser long-term.
- **Missing patient fields used by UI:** date of birth / age, gender,
  phoneNumber, emergency contact, primary concern, tags / risk level.
- **Proposed:** `GET /api/v1/patients/{profileId}` (therapist-only,
  authorized via active assignment) returning the demographics + clinical
  metadata the UI needs.

### 4.3 🔴 Read the patient's matching form responses
- **Page(s):** `/patients/:id` Overview tab → "Matching form responses"
- **Service:** `THERAPIST_API_CONTROLLER_REFERENCE.md`
- **Today:** `POST /api/v1/matching/preferences` saves preferences for the
  authenticated profile, but there is no endpoint that lets the assigned
  therapist read them.
- **Proposed:** `GET /api/v1/patients/{profileId}/matching-preferences`
  (therapist-only, scoped to an active assignment).

### 4.4 🔴 Patient tags / risk level
- **Page(s):** `/patients` list (Risk column, Tags column), Patient profile
  side panel.
- **Service:** **new** — could live in `therapist-api`.
- **Proposed:** `GET/PUT /api/v1/patients/{profileId}/tags` and
  `…/risk-level`. Currently the UI hides these.

### 4.5 🟡 Audit log of therapist views
- **Page(s):** Patient profile sidebar ("Last viewed by you / all views appear
  in the patient's audit log").
- **Service:** `Authentication Service API controller.md` (data-access grants
  service is the natural owner) or a new audit endpoint.
- **Proposed:** `GET /api/v1/audit/therapist?patientId=&from=&to=`.

---

## 5. Permissions / data-access grants (therapist-initiated)

### 5.1 🔴 Therapist-initiated request for data access (No need)
- **Page(s):** Patient profile (Request access button), Messages right panel.
- **Service:** `Authentication Service API controller.md` (and/or
  `Tracking Service API controller.md`)
- **Today:** the grants API only supports the **granter** (patient) creating a
  grant. There is no "request access" endpoint, so therapists cannot
  proactively ask. The mobile app currently drives this.
- **Proposed:** `POST /api/v1/auth/grants/requests`
  `{ granterProfileId, accessScope, reason }`, plus
  `POST .../requests/{id}/approve|reject` for the patient.

### 5.2 🟡 `GrantStatusResponse.theirGrant.expiresAt` should be populated (minor, no need to care for at the moment)
- **Page(s):** Patient profile permission card, Messages right panel.
- **Today:** when `theyGaveMeAccess === true`, the UI shows "Expires …" only
  if `theirGrant.expiresAt` is present; for grants without an expiry, the UI
  silently hides the line. Confirm the contract: is `null` the encoding for
  "no expiry", or is it always populated? The docs are ambiguous.

---

## 6. Clinical notes

### 6.1 🔴 Rich note fields (SOAP, risk flags)
- **Page(s):** `/clinical-notes`, `/clinical-notes/:id`
- **Service:** `THERAPIST_API_CONTROLLER_REFERENCE.md`
- **Today:** `POST /api/v1/notes` and `GET /api/v1/notes/appointments/{id}`
  expose only `diagnosis` and `recommendations`.
- **Missing UI-facing fields:**
  - `subjective`, `objective`, `assessment`, `plan` (SOAP format)
  - `summary` (one-line list-view summary)
  - `riskFlags { suicidalIdeation, selfHarm, substanceUse, abuse }`
- **Status today:** the editor stores diagnosis & recommendations only and
  surfaces a banner explaining the limitation.

### 6.2 🔴 Save draft / update an existing note
- **Page(s):** `/clinical-notes/:id`
- **Service:** `THERAPIST_API_CONTROLLER_REFERENCE.md`
- **Today:** only `POST /api/v1/notes` (create) exists. Submitting flips the
  appointment to `COMPLETED` immediately — there is no draft state. There is
  no `PUT /api/v1/notes/{id}` to amend an existing note.
- **Proposed:**
  - `POST /api/v1/notes` accepts `{ status: "DRAFT" | "FINALIZED" }` (default
    `FINALIZED` for back-compat).
  - `PUT /api/v1/notes/{noteId}` to update a draft.
  - `POST /api/v1/notes/{noteId}/finalize` for the explicit finalize step.

### 6.3 🔴 List clinical notes by therapist
- **Page(s):** `/clinical-notes` (list view)
- **Service:** `THERAPIST_API_CONTROLLER_REFERENCE.md`
- **Today:** notes are only retrievable per-appointment. The list view fans
  out across the therapist's appointments and calls `GET …/appointments/{id}`
  for each — an O(N) round-trip workaround.
- **Proposed:** `GET /api/v1/notes?therapistId=&patientId=&status=&page=&size=`.

### 6.4 🟡 `noteId` is not enough to re-open the note
- **Page(s):** anywhere that links to `/clinical-notes/:id`
- **Today:** there's no `GET /api/v1/notes/{noteId}`; the only read endpoint
  is keyed by `appointmentId`. We worked around this by treating the route
  `:id` parameter as the appointmentId. If `GET /api/v1/notes/{noteId}` is
  added, deep links from notifications can use the note id directly.

---

## 7. Dashboard / analytics

### 7.1 🔴 Therapist dashboard summary (No need)
- **Page(s):** Dashboard KPIs (Active patients / Sessions this month /
  Avg rating / Draft notes), Week-at-a-glance, Alerts.
- **Service:** `Tracking Service API controller.md` exposes
  `/internal/v1/dashboard/{profileId}/summary` for the patient dashboard.
- **Proposed parallel:** `/internal/v1/dashboard/therapist/{profileId}/summary`
  (or therapist-api) returning:
  - `activePatientCount`
  - `completedThisMonth`
  - `averageRating` (from reviews)
  - `pendingBookingCount`
  - `draftNoteCount`
  - `moodAlertCount`

### 7.2 🟠 Mood / wellbeing alerts for therapist (Todo but not now)
- **Page(s):** Dashboard Alerts card
- **Service:** `Tracking Service API controller.md` (cross-patient aggregation)
- **Today:** `ChannelItem.moodAlert` is a `nullable string` on
  `GET /api/v1/chats/channels` — we render any non-null value as an alert,
  which works but is implicit. Promote this into a real alerts API:
  `GET /api/v1/therapists/{id}/alerts` with severity, patientId, kind
  (`mood-trending-low`, `streak-broken`, `sleep-poor-multi-night`).

---

## 8. Reviews

### 8.1 🟡 Average rating for "Avg rating" KPI
- **Page(s):** Dashboard KPI
- **Service:** `THERAPIST_API_CONTROLLER_REFERENCE.md`
- **Today:** `GET /api/v1/therapists/{id}` returns `stats.averageRating`
  but that endpoint is patient-facing and returns reviewer-anonymised reviews.
  Confirm it's safe to call as the logged-in therapist for self-stats; if so,
  the dashboard KPI can use this directly. (Currently we show "—".)

---

## 9. Messaging

All items in this section are resolved or intentionally out of scope. Nothing
in here is a backend ask.

### 9.1 ✅ Send-message transport — *resolved (STOMP wired up)*
- **Page(s):** `/messages` compose box
- **Service:** `SOCIAL_API_CONTROLLER_REFERENCE.md`
- **Status:** Resolved. The web UI now connects to the social service's STOMP
  endpoint (`${VITE_SOCIAL_BASE_URL}/ws`) on mount of the Messages page,
  authenticates via the `Authorization: Bearer <jwt>` CONNECT header,
  subscribes to `/user/queue/messages`, and publishes outbound messages to
  `/app/chat.send` (and read receipts to `/app/chat.read`).
- **Where:**
  - `src/lib/api/chatSocket.ts` — `ChatSocket` wrapper around
    `@stomp/stompjs` (auto-reconnect, heartbeats, JWT injection).
  - `src/pages/messages/MessagesPage.tsx` — opens one connection per mount,
    optimistically renders outgoing messages, replaces the optimistic row
    with the server echo when it arrives on `/user/queue/messages`, and
    surfaces connect / disconnect / error state as a status dot under the
    compose box.
- **Note:** No REST send endpoint requested. STOMP is sufficient for the
  current UI.

### 9.2 ✅ Mark all messages in a channel as read — *not needed*
- **Page(s):** `/messages` when opening a channel
- **Service:** `SOCIAL_API_CONTROLLER_REFERENCE.md`
- **Status:** Not a backend ask. The UI now opportunistically marks
  individual incoming messages as read over STOMP (`/app/chat.read`) when
  they arrive on a channel that's currently open. A bulk
  `POST .../channels/{channelId}/read-all` endpoint is not required.

### 9.3 ✅ Quick-reply payloads (structured messages) — *out of scope*
- **Page(s):** `/messages` quick-action buttons (originally in the mock UI)
- **Service:** `SOCIAL_API_CONTROLLER_REFERENCE.md`
- **Status:** Out of scope for the thesis. The mock UI's "Send slot",
  "Send breathing exercise", and "Mood-check prompt" buttons have been
  removed from the production UI. No structured-message type (`SUGGEST_SLOT`,
  `EXERCISE`, `MOOD_PROMPT`) is needed from the backend.

### 9.4 ✅ Therapist online presence — *out of scope*
- **Page(s):** `/messages` ("Last seen recently")
- **Service:** `SOCIAL_API_CONTROLLER_REFERENCE.md`
- **Status:** Out of scope for the thesis. The conversation header shows the
  channel's `lastMessageAt` (or "No messages yet") instead of a presence
  indicator. No `lastSeenAt` field requested.

---

## 10. Notifications

### 10.1 — Notification preferences (per-channel toggles) — *intentionally deferred*
- **Page(s):** Settings → Notifications tab
- **Service:** `NOTIFICATION_API_CONTROLLER_REFERENCE.md`
- **Status:** Not a backend ask. Per-type / per-channel toggles are
  intentionally not exposed for now — every therapist receives every kind of
  notification. The Settings → Notifications tab does not render toggle
  controls. If we ever bring this back, the backend will need
  `GET/PUT /api/v1/notifications/{profileId}/preferences`.

### 10.2 — Per-row deep-link target on notification items — *accepted limitation*
- **Page(s):** Top-bar notifications dropdown
- **Service:** `NOTIFICATION_API_CONTROLLER_REFERENCE.md`
- **Status:** Accepted. No backend change requested. Notification rows expose
  only a `type` enum (`BOOKING | CHAT | STREAK | REMINDER | INSIGHT`), not a
  per-row deep-link URL. The therapist UI maps `type → route` in
  `src/components/layout/TopBar.tsx` (`NOTIFICATION_LINK_BY_TYPE`), which
  lands the user on the relevant section page but cannot deep-link to a
  specific appointment / chat / streak. That trade-off is fine for now; if
  per-row deep links become important, the notification spec's section 6
  already flags the option to add a `link` (or `referenceId`) field on each
  row.

### 10.3 ✅ Auth on notification endpoints — *resolved*
- **Page(s):** Top-bar notifications dropdown
- **Service:** `NOTIFICATION_API_CONTROLLER_REFERENCE.md`
- **Status:** Resolved. The notification service now enforces
  `Authorization: Bearer <JWT>` on every endpoint (per the updated
  section 2 of `NOTIFICATION_API_CONTROLLER_REFERENCE.md`).
  `src/lib/api/notification.ts` has been updated to send the token on every
  call, and `POST /api/v1/devices` no longer sends `profileId` in the body
  (the service reads it from the JWT claim).

---

## 11. Cross-cutting / data-shape notes

### 11.1 🟡 Service base URLs
- The mobile-app docs hard-code `localhost:8082/8083/8084` per service. The
  web UI now reads them from `import.meta.env.VITE_*_BASE_URL` (see
  `.env.example`). Confirm the **production / staging** hostnames per
  service so the env file can be filled in for deploy.

### 11.2 🟡 Spring `Page` envelope
- `GET /api/v1/notifications/{profileId}` already warns the page envelope
  may change. The same is true for `GET /api/v1/therapists/{id}/slots` and
  `GET /api/v1/chats/channels/{id}/messages` (social). Lock the envelope
  shape before production or move to a custom DTO.

### 11.3 🟡 Tracking response `entryDate` vs `createdAt`
- For diary / food / sleep, the UI prefers `entryDate` (the day the entry is
  about) and falls back to `createdAt` (server-side timestamp). Confirm the
  semantics — should `entryDate` always be populated? If yes, mark it
  non-optional in the OpenAPI / Swagger schema.

### 11.4 🟡 Mood log positivity → 1-5 quality bucket
- The UI used 1-5 `quality` buckets in the mock data, while the API uses
  1-10 `positivityScore`. We display the score directly now. Document the
  range explicitly in the Tracking service docs (currently the schema lists
  `1-10` but the UI text talks about a 1-5 mood).

### 11.5 🟡 Therapist "primary concern" copy
- The patient profile UI in the mock data showed a "primary concern" string.
  No endpoint returns this. If kept as a feature, surface it on
  `GET /api/v1/patients/{profileId}` (see §4.2).

---

## 12. End-to-end summary of pages currently degraded

| Page                                          | Real data?         | Notes                                                                                             |
| --------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------- |
| `/login`, `/register`, `/license-pending`     | ✅                 | Real `auth-service` endpoints. License lifecycle still mocked (§2.3).                              |
| `/`  Dashboard                                | ⚠️ partial         | Fan-out via channels. KPIs Avg rating / Draft notes show `—` (§7.1).                              |
| `/appointments`                               | ⚠️ partial         | Fan-out across channels (§1.1).                                                                   |
| `/appointments/:id`                           | ⚠️ partial         | Re-fetch + filter (§1.2). Cancel is non-functional (§1.3).                                        |
| `/appointments/:id/video`                     | ✅                 | Uses `GET /api/v1/bookings/{id}/join`. Sidebar diary depends on permission grant.                  |
| `/availability`                               | ⚠️ read-only       | CRUD missing (§3.1, §3.2).                                                                        |
| `/patients`                                   | ⚠️ partial         | Derived from chat channels (§4.1).                                                                |
| `/patients/:id`                               | ⚠️ partial         | Demographics & matching form missing (§4.2, §4.3). Tags/risk hidden (§4.4).                       |
| `/messages`                                   | ⚠️ partial         | Read works via REST, send needs STOMP (§9.1).                                                     |
| `/clinical-notes`                             | ⚠️ fan-out         | No list endpoint (§6.3). Drafts not supported (§6.2).                                             |
| `/clinical-notes/:id`                         | ⚠️ partial         | SOAP / risk-flag fields ignored (§6.1). Only single submission, no edit.                          |
| `/settings`                                   | ⚠️ partial         | Profile/avatar work via auth-service. Bio/specialization read-only (§2.1, §2.2). Sec tab disabled. |
| Top-bar notifications                         | ✅                 | Notification-service inbox + mark-read. Preferences UI hidden (§10.1).                            |
