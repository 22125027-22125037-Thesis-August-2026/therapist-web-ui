# Missing API Endpoints & Data Gaps — V2

Successor to `Missing API endpoints.md`. Picks up where V1 left off after the
backend shipped a large batch of therapist-side endpoints (booking lifecycle,
slot CRUD, rich clinical notes, dashboard summary, patient detail, license
lifecycle, etc.).

This file tracks what's **still** missing or worth following up on, and what
the web client is now using from V1's wishlist.

Status legend (unchanged from V1):

- 🔴 Blocking — no client workaround
- 🟠 Painful — works but slow / fragile
- 🟡 Cosmetic — UI degrades gracefully
- ✅ Resolved — backend shipped it, client now uses it
- 🚫 Out of scope — intentionally not pursued

Service references (unchanged):

- `THERAPIST_API_CONTROLLER_REFERENCE.md` — therapist-api, base 8082
- `Authentication Service API controller.md` — auth-service, base 8081
- `Tracking Service API controller.md` — tracking-service, base 8085
- `SOCIAL_API_CONTROLLER_REFERENCE.md` — social-service, base 8083
- `NOTIFICATION_API_CONTROLLER_REFERENCE.md` — notification-service, base 8084

---

## 0. What V1 asked for and now uses

This section is the rollup of newly-resolved items from V1 §1–§10 that the web
UI now consumes. Everything below is wired in — no further action.

### From V1 §1 (therapist-side appointments)

- ✅ **§1.1 — List therapist appointments** → `GET /api/v1/therapists/{id}/appointments`
  used by `src/pages/DashboardPage.tsx`, `src/pages/appointments/AppointmentsListPage.tsx`,
  and `src/pages/patients/PatientProfilePage.tsx`. The chat-channel fan-out
  aggregator `src/lib/api/therapistAppointments.ts` was deleted as a result.
- ✅ **§1.2 — Single-appointment GET** → `GET /api/v1/bookings/{appointmentId}`
  used by `AppointmentDetailPage`, `VideoSessionPage`, `ClinicalNoteEditorPage`.
- ✅ **§1.3 — Cancel with reason** → `POST /api/v1/bookings/{id}/cancel` wired
  in `AppointmentDetailPage`. Window rule (≥ 1 h before start) enforced
  client-side too so the cancel button disables itself.
- ✅ **§1.4 — Confirm / reject `REQUESTED`** → `POST /api/v1/bookings/{id}/confirm`
  and `…/reject`. New "Decision required" card on `AppointmentDetailPage`. The
  2-hour decision window is mirrored in the UI.
- ✅ **§1.5 — `endDatetime` / `reason` / `mode`** → all three are now read off
  `AppointmentDetail`. `reason` rendered in the session-info card.

### From V1 §2 (therapist profile + license)

- ✅ **§2.1 — Rich therapist fields on `GET /api/v1/auth/me`** → `UserResponse`
  now includes `specialization`, `bio`, `yearsOfExperience`, `consultationFee`,
  `languages`, `licenseNumber`, `licenseAuthority`, `licenseExpiresAt`,
  `licenseStatus`. `AuthContext` populates all of them and stops hardcoding
  defaults.
- ✅ **§2.2 — Update therapist fields** → `PATCH /api/v1/auth/profile` now
  accepts the therapist-only fields. Settings → Profile tab edits them.
- ✅ **§2.3 — License lifecycle (read + renew)** → `GET /api/v1/auth/license`
  + `POST /api/v1/auth/license/renew` powering Settings → License and
  `/license-pending`. Admin verify/reject endpoints exist for the admin app;
  the therapist UI just polls status.
- ✅ **§2.4 (partial) — Password change** → `POST /api/v1/auth/password/change`
  wired in Settings → Security tab. **(See §1 below for what's still missing.)**

### From V1 §3 (availability / scheduling)

- ✅ **§3.1 — Slot create / update / delete** → all four endpoints (`POST`,
  `POST :bulk`, `PUT`, `DELETE`) used by `AvailabilityPage`. The dialog now
  actually creates and deletes slots.
- ✅ **§3.2 — Slot payload exposes booking state** → `GET …/slots/manage?includeBooked=true`
  returns `isBooked`, `bookedByPatientId`, `bookedByPatientName`. The weekly
  calendar renders booked cells in primary color with the patient's name.
- ✅ **§3.3 (partial) — Recurring availability templates** → CRUD endpoints
  exist (`GET/POST/PUT/DELETE …/availability-templates`). **(See §2 below for
  what we deferred.)**

### From V1 §4 (patient roster + detail)

- ✅ **§4.1 — List therapist's patients** → `GET /api/v1/therapists/{id}/patients`
  used by `PatientsListPage`. No more channel fan-out.
- ✅ **§4.2 — Patient detail for therapist** → `GET /api/v1/patients/{profileId}`
  (auth-service). DOB / age / gender / phone / school / emergency-contact now
  shown on `PatientProfilePage` and `AppointmentDetailPage` sidebar.
- ✅ **§4.3 — Matching-form responses** →
  `GET /api/v1/patients/{profileId}/matching-preferences` rendered on the
  Overview tab.
- ✅ **§4.4 — Tags + risk level** → `GET/PUT /api/v1/patients/{profileId}/tags`
  and `…/risk-level`. Sidebar lets the therapist add/remove tags and change
  the risk pill inline.

### From V1 §6 (clinical notes)

- ✅ **§6.1 — Rich note fields (SOAP + risk flags + summary)** → all wired
  into `ClinicalNoteEditorPage` (Subjective / Objective / Assessment / Plan
  textareas, Summary input, four risk-flag checkboxes, Diagnosis +
  Recommendations free-text).
- ✅ **§6.2 — Drafts** → `status: "DRAFT"` accepted by `POST /api/v1/notes`,
  `PUT /api/v1/notes/{noteId}` amends, `POST /api/v1/notes/{noteId}/finalize`
  finalizes. The editor has separate "Save draft" and "Finalize" buttons. The
  draft appointment is no longer auto-transitioned to COMPLETED.
- ✅ **§6.3 — List clinical notes** →
  `GET /api/v1/notes?therapistId=&patientId=&status=` powers
  `ClinicalNotesListPage` and the Notes tab on `PatientProfilePage`.
- ✅ **§6.4 — Note id deep-link** → `GET /api/v1/notes/{noteId}` exists. After
  first save the editor URL is rewritten to `/clinical-notes/{noteId}` so
  links survive across sessions.

### From V1 §7 (dashboard analytics)

- ✅ **§7.1 — Therapist dashboard summary** →
  `GET /api/v1/therapists/{id}/dashboard/summary` powers all four KPI tiles on
  `DashboardPage`. Backend still returns `moodAlertCount = 0` as a placeholder
  — see §3 below.

### From V1 §8 (reviews)

- ✅ **§8.1 — Avg rating** → returned from `dashboard/summary.averageRating`.

### From V1 §9 — §10 — §11

- §9, §10: already closed in V1 (STOMP wired up, notification preferences
  intentionally deferred, etc.). Nothing changed in V2.
- §11 cross-cutting notes: still apply (Spring `Page` envelope, `entryDate`
  vs `createdAt`, etc.). Not duplicated below.

---

## 1. Still missing from `auth-service`

### 1.1 🟡 Active sessions list / device list (V1 §2.4)
- **Page(s):** Settings → Security tab
- **Service:** `Authentication Service API controller.md`
- **Status:** Password change shipped, but session management still missing.
  Proposed:
  - `GET /api/v1/auth/sessions` — list active access tokens (device, ip, ua,
    last seen).
  - `DELETE /api/v1/auth/sessions/{id}` — revoke a specific session.
  - `DELETE /api/v1/auth/sessions` — "sign out everywhere".
- **Today:** the Security tab shows the password-change form only; the active
  sessions sub-card from the mock UI is removed.

### 1.2 🟡 License verification history
- **Page(s):** `/license-pending`, Settings → License tab
- **Service:** `Authentication Service API controller.md`
- **Status:** Current status is returned by `GET /api/v1/auth/license`, but
  the **history** of submissions / verifications / rejections (with admin
  comments) is not. The mock UI had a "Verification history" list that we
  hide now. Proposed:
  - `GET /api/v1/auth/license/history` returning a list of
    `{ submittedAt, status, reviewedBy, reviewerComment }`.

---

## 2. Still missing from `therapist-api`

### 2.1 🟡 Availability templates — applied / preview
- **Page(s):** `/availability`
- **Service:** `THERAPIST_API_CONTROLLER_REFERENCE.md`
- **Status:** CRUD endpoints for templates exist (`§23` of the doc), but the
  UI does not yet expose a "Apply template to next N weeks" action. The
  template engine that materialises templates into concrete slots is implied
  but not documented. Proposed:
  - `POST /api/v1/therapists/{id}/availability-templates/{templateId}:apply`
    accepting `{ from: date, weeks: int }` and returning the slot ids it
    created (or would create, on `?dryRun=true`).
- **Today:** the template UI is hidden; the calendar uses one-off slot
  creation only.

### 2.2 🟡 Default session length + buffer
- **Page(s):** Settings → Availability defaults (now removed)
- **Service:** `THERAPIST_API_CONTROLLER_REFERENCE.md`
- **Status:** The therapist still has to pick a duration each time they
  create a slot. There is no per-therapist "default session length" / "buffer
  minutes" setting. Proposed:
  - Extend `UserResponse` (auth-service) **or** add a small endpoint pair on
    therapist-api (`GET/PUT /api/v1/therapists/{id}/availability/defaults`).

### 2.3 🟡 Slot conflict / window error shape
- **Page(s):** `/availability`, `/appointments/:id` (cancel/confirm dialogs)
- **Service:** `THERAPIST_API_CONTROLLER_REFERENCE.md`
- **Status:** `409 Slot Conflict` and `409 Invalid Appointment State` are
  documented, but the body shape isn't pinned down. The UI currently just
  surfaces `detail`/`error` from the ProblemDetail. Lock the shape so the
  client can distinguish "slot overlap" vs "outside cancel window" vs "already
  cancelled" without parsing strings.

### 2.4 🟡 Booking `mode` accepts `TEXT` vs UI's `CHAT`
- **Page(s):** Appointments list, Appointment detail, Dashboard
- **Service:** `THERAPIST_API_CONTROLLER_REFERENCE.md`
- **Status:** The booking doc lists `mode: "VIDEO" | "TEXT"`, but the
  appointment summary doc still shows `mode: "VIDEO" | "CHAT"`. The web
  client now renders both `TEXT` and `CHAT`. Confirm which is canonical and
  align the enums. We've coded for both for now.

---

## 3. Still missing from `tracking-service`

### 3.1 🟠 Cross-patient mood alerts (V1 §7.2)
- **Page(s):** Dashboard Alerts card
- **Service:** `Tracking Service API controller.md`
- **Status:** `dashboard/summary.moodAlertCount` is documented as
  *"currently returned as 0 from the therapist-api until the cross-service
  `/alerts` endpoint is wired in"* — so the field exists but is always 0.
  Proposed:
  - `GET /api/v1/therapists/{id}/alerts` returning a list of
    `{ profileId, patientName, severity, kind, since, summary }` where
    `kind ∈ {mood-trending-low, sleep-poor-multi-night, streak-broken,
    self-harm-flagged}`.
  - therapist-api's dashboard summary then aggregates that list into the
    `moodAlertCount` it already exposes.
- **Today:** the Alerts card displays "No active alerts." even when patients
  have concerning trends — the count is always 0.

### 3.2 🟡 Tracking response `entryDate` vs `createdAt` (carry-over from V1 §11.3)
- **Page(s):** `/patients/:id` diary / food / sleep tabs
- **Service:** `Tracking Service API controller.md`
- **Status:** Unchanged. Clarify whether `entryDate` is always populated; if
  yes, mark non-optional in OpenAPI.

### 3.3 🟡 Positivity score range (carry-over from V1 §11.4)
- **Page(s):** `/patients/:id` Mood tab
- **Service:** `Tracking Service API controller.md`
- **Status:** Unchanged. UI now renders `positivityScore / 10` directly.

---

## 4. Still missing from `social-service`

### 4.1 🟡 Read-receipts on outgoing messages
- **Page(s):** `/messages` compose box
- **Service:** `SOCIAL_API_CONTROLLER_REFERENCE.md`
- **Status:** STOMP send works, server echo arrives, but the client cannot
  show "read by patient at HH:mm" because incoming messages on
  `/user/queue/messages` are scoped to the **recipient**, not to the original
  sender. Proposed:
  - Either re-broadcast `MessageReadEvent` to the sender's
    `/user/queue/messages` queue, or
  - Add a `/user/queue/read-receipts` queue subscription.
- **Today:** the UI shows the message timestamp only; no "seen" indicator.

### 4.2 🟡 Group / parent channels
- **Page(s):** `/messages`
- **Service:** `SOCIAL_API_CONTROLLER_REFERENCE.md`
- **Status:** `THERAPIST_CONSULT` channel type supports multiple
  participants per the doc, but there is no UI for adding a parent to a
  teen's channel. Out of scope unless asked; flagging in case the parent
  role becomes prominent.

---

## 5. Still missing from `notification-service`

Nothing actionable beyond what V1 closed (10.1 intentionally deferred, 10.2
accepted limitation, 10.3 resolved with JWT).

The notification service does not currently emit a notification when a
therapist's clinical note finalize step transitions the appointment to
`COMPLETED`, when a `REQUESTED` booking is auto-rejected by the sweep, or
when a license is verified / rejected. Wiring producers for those would be a
follow-up but isn't strictly missing — the UI gets the same information via
the inbox + status polling.

---

## 6. Cross-cutting carry-over

### 6.1 🟡 Spring `Page` envelope stability (V1 §11.2)
- The newly-added paged endpoints (`…/appointments`, `…/notes`,
  `…/slots/manage`) all return Spring `Page`. The V1 caveat about the envelope
  shape still applies. Lock or wrap before production.

### 6.2 🟡 Service base URLs (V1 §11.1)
- Now read from `.env.development` per env. `VITE_AUTH_BASE_URL` is pointed
  at a remote staging host already; the other three services still default to
  `localhost`. Confirm staging / prod hostnames so the env files can be
  filled in.

### 6.3 🟡 Audit log of therapist views (V1 §4.5)
- Still missing. No endpoint surfaces which therapist read which patient
  resource at which time. Open question whether it's owned by auth-service
  (grant-aware) or by a dedicated audit service.

### 6.4 🟡 Therapist-initiated grant request (V1 §5.1)
- Still missing. Patients can grant; therapists cannot request. The
  PatientProfilePage permission card now shows "No data access granted" with
  no CTA.

### 6.5 🟡 `theirGrant.expiresAt` semantics (V1 §5.2)
- Still ambiguous. UI handles both null and present cases. Doc clarification
  would let us delete a defensive branch.

---

## 7. End-to-end summary of pages — V2 status

| Page                                          | Real data? | Notes                                                                                                |
| --------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `/login`, `/register`                         | ✅          | `auth-service` login / register / `me`.                                                              |
| `/license-pending`                            | ✅          | Polls `GET /api/v1/auth/license`; auto-redirects to `/` when VERIFIED.                               |
| Dashboard `/`                                 | ✅          | `dashboard/summary` + `…/appointments`. Alerts count stuck at 0 until §3.1 ships.                    |
| Appointments list `/appointments`             | ✅          | `listTherapistAppointments` paged by status/from/to.                                                 |
| Appointment detail `/appointments/:id`        | ✅          | `getAppointmentDetail` + confirm / reject / cancel + window enforcement.                             |
| Video session `/appointments/:id/video`       | ✅          | `getAppointmentDetail` + `joinSession`. Diary side-panel needs permission grant.                     |
| Availability `/availability`                  | ✅          | `slots/manage?includeBooked=true` + create / delete. Templates UI deferred (§2.1).                   |
| Patients `/patients`                          | ✅          | `listTherapistPatients` (active + historical) with tag + risk filters.                               |
| Patient profile `/patients/:id`               | ✅          | `getPatientDetail` + `matching-preferences` + tags + risk + tracking. Audit log hidden (§6.3).       |
| Messages `/messages`                          | ✅          | REST + STOMP per V1 §9. No read receipts (§4.1).                                                     |
| Clinical notes list `/clinical-notes`         | ✅          | `listClinicalNotes` filtered by status.                                                              |
| Clinical note editor `/clinical-notes/:id`    | ✅          | Full SOAP + risk + draft / amend / finalize. URL rewritten to `noteId` after first save.             |
| Settings `/settings`                          | ✅          | Profile editable; license read + renew; password change. Sessions list missing (§1.1).               |
| Top-bar notifications                         | ✅          | Notification-service inbox + mark-read. Preferences deferred per V1 §10.1.                           |
