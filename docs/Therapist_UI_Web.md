# uMatter — Therapist Web UI Specification

This document describes the web application used by **licensed therapists** to deliver care to teen / parent users of the uMatter mobile app. It is the professional counterpart of the React Native client in this repo and consumes the same backend.

The mobile app's screens that are mirrored or inverted on the web side are:

- [src/screens/auth/](../src/screens/auth/) — therapist sign-up, login, logout, **license verification**
- [src/screens/booking/](../src/screens/booking/) — appointment lifecycle from the therapist's seat
- [src/screens/social/](../src/screens/social/) — chat with patients + view of granted data-access permissions
- [src/screens/tracking/](../src/screens/tracking/) — **read-only** view of a patient's diary, food, sleep, mood (only when the patient has granted permission)

---

## 1. Audience & guiding principles

- **User role**: `THERAPIST` (same `UserRole` enum as the mobile [RegisterScreen.tsx](../src/screens/auth/RegisterScreen.tsx)).
- **Platform**: Desktop-first responsive web app (≥1280 px primary target; usable down to 1024 px). No mobile-web parity required — therapists are expected to work on a laptop/desktop during sessions.
- **Tone**: clinical, calm, dense-but-readable. Avoid the playful illustrations used in the teen app.
- **Localization**: Vietnamese primary, English secondary (matches `i18next` keys already in mobile).
- **Data sensitivity**: All patient-data screens must show a permission state. A therapist must **never** see a patient's diary / food / mood / sleep / clinical notes unless the patient has granted `READ_ALL` (see [FriendProfileScreen.tsx](../src/screens/social/FriendProfileScreen.tsx) for the patient-side grant model — same `dataAccessGrantApi` applies).

---

## 2. Global layout

```
┌────────────┬──────────────────────────────────────────────┐
│            │  Top bar: search, notifications, profile     │
│  Sidebar   ├──────────────────────────────────────────────┤
│            │                                              │
│  - Logo    │                                              │
│  - Nav     │            Main content region               │
│  - User    │                                              │
│            │                                              │
└────────────┴──────────────────────────────────────────────┘
```

**Persistent left sidebar** (collapsible):

1. Dashboard
2. Appointments
3. Availability (slot management)
4. Patients
5. Messages
6. Clinical Notes
7. Settings

**Top bar**:

- Global patient search (by name / id).
- Notification bell (new bookings, new messages, new permission grants, cancellations, mood alerts).
- Therapist avatar → dropdown: Profile, Switch language, **Log out**.

---

## 3. Authentication & licensing

Counterpart of [LoginScreen.tsx](../src/screens/auth/LoginScreen.tsx) and [RegisterScreen.tsx](../src/screens/auth/RegisterScreen.tsx), but with a hard **license-verification gate**.

### 3.1 Login page

- Email + password (same `AuthContext.login`).
- "Forgot password" link.
- Footer link "Don't have a therapist account? Apply here" → Sign-up.
- Social login is **disabled** for therapists (do not surface FB / Google / IG buttons that exist on the teen client — licensing must go through email).

### 3.2 Sign-up / application page

Reuses the `THERAPIST` branch of `RegisterPayload` from [RegisterScreen.tsx:106-141](../src/screens/auth/RegisterScreen.tsx#L106-L141):

| Field | Source / Notes |
|---|---|
| Full name | `fullName` (required) |
| Email, phone, DOB | required for verification |
| Password / Confirm | required |
| Specialization | `specialization` |
| Bio | `bio` |
| Years of experience | `yearsOfExperience` (number) |
| Consultation fee | `consultationFee` (number) |
| **License number** | new — required |
| **License-issuing authority / country** | new — required |
| **License document upload** | new — PDF / JPG / PNG (drag-and-drop, ≤10 MB) |
| **Government ID upload** | new — PDF / JPG / PNG |
| Agree to terms | required |

On submit:

- Account is created with status `PENDING_LICENSE_VERIFICATION`.
- Therapist can log in but lands on a **"License under review"** holding page — no patient access until an admin approves the documents.
- Email notification when approved → status flips to `ACTIVE`.

### 3.3 License-verification holding page

Shown on every login while status ≠ `ACTIVE`:

- Big banner: "Your license is being reviewed. Estimated time: 1–3 business days."
- Read-only view of submitted documents with a "Replace document" action.
- "Contact support" link.
- Log out button.

### 3.4 Re-verification

Licenses expire. When `licenseExpiresAt < now + 30 days`:

- Yellow banner across all pages: "Your license expires on DD/MM/YYYY. Upload a renewal."
- After expiry the account is auto-frozen — same UX as `PENDING_LICENSE_VERIFICATION`.

### 3.5 Logout

Top-right avatar menu → Log out → clear `AuthContext` token, redirect to Login.

---

## 4. Dashboard (home)

The first screen after login (when licensed & active).

Widgets (top-to-bottom, left-to-right):

1. **Today's schedule** — list of today's appointments with start time, patient name, mode (`Video` / `Chat`), and a "Join" button enabled only within 10 min of start (matches `TEN_MINUTES_IN_MS` window in [WaitingRoomScreen.tsx:26](../src/screens/booking/WaitingRoomScreen.tsx#L26) — keep the rule symmetric).
2. **Upcoming this week** — calendar strip (Mon-Sun) with appointment counts per day.
3. **Pending actions**:
   - New bookings awaiting confirmation
   - Patients who have granted you data access since your last visit
   - Sessions completed but missing clinical notes
4. **Alerts** — patients with concerning recent mood / sleep data (only those who granted permission). E.g. "3 patients reported quality ≤ 2 sleep for 4+ nights".
5. **KPI strip** — total active patients, sessions this month, avg rating from `submitReview`.

---

## 5. Appointments

Counterpart of [BookingScreen.tsx](../src/screens/booking/BookingScreen.tsx), [WaitingRoomScreen.tsx](../src/screens/booking/WaitingRoomScreen.tsx), [VideoConsultationScreen.tsx](../src/screens/booking/VideoConsultationScreen.tsx), [ConsultationDetailScreen.tsx](../src/screens/booking/ConsultationDetailScreen.tsx), [AppointmentsHistoryScreen.tsx](../src/screens/booking/AppointmentsHistoryScreen.tsx), and [ConsultationFeedbackScreen.tsx](../src/screens/booking/ConsultationFeedbackScreen.tsx).

### 5.1 Appointments list

Tabs at the top: **Upcoming · Today · Past · Cancelled** (mirrors `AppointmentHistoryStatus`).

Each row shows:

- Date & time
- Patient name + avatar (clickable → patient profile)
- Mode: `CHAT` / `VIDEO`
- Patient-provided reason (`reason` from `ConsultationDetailScreen`)
- Status badge
- Action: **Open** → appointment detail page

Filter bar: date range, mode, patient.

### 5.2 Appointment detail page

Sections:

- **Patient card** — name, age, brief specialization tags, link to full profile.
- **Session info** — date, time, slot ID, mode, patient's stated reason.
- **Pre-session checklist** (only when upcoming):
  - "Review patient's recent diary entries" → opens read-only tracking view
  - "Review previous clinical notes"
  - "Confirm video equipment"
- **Primary action**:
  - If upcoming and within 10 min → **Join session** (opens video room — Jitsi `meet.jit.si` like [VideoConsultationScreen.tsx:23](../src/screens/booking/VideoConsultationScreen.tsx#L23), same `umatter-{appointmentId}` room name so the patient and therapist meet in the same room).
  - If chat mode → **Open chat** (deep-link to Messages with that channel selected).
  - If upcoming but >10 min away → **Reschedule** / **Cancel**.
- **Post-session actions** (after `endedAt`):
  - **Write clinical note** (see §8)
  - View patient's review of you (rating + text via `submitReview` data)
- **Cancel** — with reason, triggers patient notification.

### 5.3 Video session screen

Same Jitsi WebView flow used by the mobile [VideoConsultationScreen.tsx](../src/screens/booking/VideoConsultationScreen.tsx), but as an embedded iframe on the web:

- Pre-join screen with patient name + reason on the side panel.
- "Join" enabled only when the backend `joinVideoSession(appointmentId)` returns `true`.
- During the call: side panel keeps the patient's reason, last 5 diary entries (if permission granted), and a **scratchpad** that auto-saves into the eventual clinical note.
- "End and write note" button → routes to the clinical-note editor pre-filled with appointment context.

---

## 6. Availability (slot management)

A view the mobile app does **not** have at all — the mobile `BookingScreen` simply consumes `getTherapistAvailableSlots`. The therapist creates those slots here.

- Week-view calendar (Mon-Sun, hourly grid).
- Click-and-drag to create an available slot.
- Click an existing slot to:
  - Edit duration
  - Block / delete
  - Make recurring (e.g. "every Tue 14:00 for 8 weeks")
- Bulk template: "Standard week" — apply a saved template.
- Holiday / off-day toggle per day.
- Each booked slot is rendered with patient initials and is non-editable; clicking it jumps to the appointment detail.

---

## 7. Patients

### 7.1 Patient list

Table with columns: avatar, name, age, primary concern, last session, next session, **permission badge** (🔓 if patient granted `READ_ALL`, 🔒 otherwise — same `dataAccessGrantApi.getGrantStatus` model used in [FriendProfileScreen.tsx](../src/screens/social/FriendProfileScreen.tsx)), risk indicator.

Filters: only-with-permission, has upcoming appointment, by tag.

### 7.2 Patient profile

Layout: left rail with identity + permission state, main pane with tabbed content.

Left rail:

- Avatar, name, age, gender, contact (only if patient consented to share contact)
- Emergency contact (only when patient is `TEEN` and shared `emergencyContact`)
- Permission state:
  - **Has granted you data access?** Yes / No — and expiry timestamp.
  - **You requested access on…** — pending request indicator.
  - Button: "Request data access" (sends a request via `dataAccessGrantApi`; the patient sees the request on their side and approves it in [FriendProfileScreen.tsx](../src/screens/social/FriendProfileScreen.tsx)).
- Tags / labels (manually added by therapist).

Tabs in main pane (each is **gated** by the permission state — show a locked card identical to [FriendProfileScreen.tsx:178-186](../src/screens/social/FriendProfileScreen.tsx#L178-L186) when permission is missing):

1. **Overview** — matching-form responses (`MatchingFormData`), session history, ratings given.
2. **Clinical notes** (always visible — these are *your* notes about *this* patient; not the patient's data).
3. **Diary** — read-only mirror of [DiaryOverviewScreen.tsx](../src/screens/tracking/diary/DiaryOverviewScreen.tsx). Honor `viewProfileId` semantics: no "new entry" button, entry rows are not clickable for edit, only for view. Same timeline + mood badge + search/date filter UX.
4. **Food log** — read-only mirror of [FoodMainScreen.tsx](../src/screens/tracking/food/FoodMainScreen.tsx). Weekly bar chart of satiety ratings, list of logs by day. No "add log" action.
5. **Sleep log** — read-only mirror of [SleepMainScreen.tsx](../src/screens/tracking/sleep/SleepMainScreen.tsx). Weekly line chart of duration + quality, recent-history list.
6. **Mood log** — read-only mood check-ins (the patient app stores these alongside the diary).
7. **Sessions** — table of past appointments with links to clinical notes.

**Important**: all data calls use the patient's `profileId` as `viewProfileId`. If the backend rejects (permission revoked or never granted), the UI falls back to the locked card *immediately* — do not cache stale data once a grant is revoked.

---

## 8. Clinical Notes

The therapist's private working record of a patient. Backed by `getClinicalNoteByAppointment` already referenced in [ConsultationFeedbackScreen.tsx:9](../src/screens/booking/ConsultationFeedbackScreen.tsx#L9).

### 8.1 List view

- Tabs: All / This patient (when accessed from a patient profile).
- Columns: date, patient, appointment link, summary, last edited, status (Draft / Finalized).

### 8.2 Editor

Structured fields (SOAP-style is a safe default):

- **Subjective** — what the patient reported.
- **Objective** — therapist observations.
- **Assessment** — diagnosis impression, risk level.
- **Plan** — next steps, homework, referrals.
- **Risk flags** — checkboxes: suicidal ideation, self-harm, substance use, abuse — triggers protocol modal when checked.
- Attached appointment (auto-filled when launched from an appointment).
- Rich-text formatting (bold, lists, headings — keep simple).
- **Auto-save** every 10 s; explicit "Finalize" to lock the note (finalized notes become read-only and only an admin can unlock).

Notes are **always private to the therapist** — the patient never sees them on the mobile app. This is the explicit inverse of the patient's diary (which the therapist can see only with permission).

---

## 9. Messages

Counterpart of [MessageListScreen.tsx](../src/screens/social/MessageListScreen.tsx), [ChatScreen.tsx](../src/screens/social/ChatScreen.tsx), and the permissions section of [FriendProfileScreen.tsx](../src/screens/social/FriendProfileScreen.tsx).

### 9.1 Two-pane layout

```
┌──────────────────┬────────────────────────────────┐
│ Channel list     │  Active conversation           │
│  - search        │  ┌──────────────────────────┐  │
│  - tabs:         │  │ Header: patient + perm.  │  │
│    Patients      │  ├──────────────────────────┤  │
│    Requests      │  │ Messages (WebSocket)     │  │
│  - channels      │  ├──────────────────────────┤  │
│                  │  │ Composer                 │  │
└──────────────────┴──┴──────────────────────────┴──┘
```

### 9.2 Channel list (left)

- Search by patient name.
- Tabs:
  - **Patients** — `socialApi.getChatChannels()` filtered by `THERAPIST_CONSULT` (matches `SocialChannelSummary.type`).
  - **Requests** — incoming friend / patient-link requests (`socialApi.getFriendRequests('INCOMING')`).
- Each row: avatar, patient name, last message preview, unread badge, **permission icon** (🔓 / 🔒).

Therapists may receive direct messages from patients **even without a data-access grant** (chat permission is separate from health-data permission — see §9.4).

### 9.3 Conversation pane (right)

- Header: patient name, last-seen, **permission status panel**:
  - "Data access: Granted until 14/06/2026 · View patient data →" (deep link to Patient profile)
  - or "Data access: Not granted · Request access" (button)
- Real-time messages via `useChatWebSocket` (same `CHAT_BROKER_URL` pattern as [ChatScreen.tsx:32](../src/screens/social/ChatScreen.tsx#L32)).
- Composer with text + attachments (PDF, image — useful for sharing worksheets).
- Quick-action bar above composer:
  - "Send appointment slot"
  - "Send breathing exercise"
  - "Send mood-check prompt"

### 9.4 Permission panel (right rail, expandable)

Mirrors the permission semantics from [FriendProfileScreen.tsx](../src/screens/social/FriendProfileScreen.tsx) but from the therapist's vantage:

- **Patient grants you access** → green card, expiry date, "View their tracking data" button.
- **Patient revoked / never granted** → locked card, "Request access" button.
- A historical log of grants / revokes (date + actor) — important for audit.
- The therapist **cannot** grant the patient access to their own data (therapists have no diary / food / sleep to share). The reciprocal half of the permission UI from the patient app is hidden here.

---

## 10. Settings / Profile

- **Profile** — full name, photo, bio, specialization, years of experience, fee, languages spoken. Persisted via the same `RegisterPayload` therapist fields.
- **Availability defaults** — default session length, buffer between sessions.
- **Notifications** — email / in-app toggles per event type.
- **License** — view current license, upload renewal, view verification history.
- **Security** — change password, active sessions, sign out other devices.
- **Language** — VN / EN.

---

## 11. Cross-cutting requirements

### 11.1 Permission enforcement (non-negotiable)

Every patient-data screen (§7.3-7.7) must:

1. Call `dataAccessGrantApi.getGrantStatus(patientProfileId)` on mount.
2. Render the locked-card state immediately if `theyGaveMeAccess === false` (terminology mirrors [FriendProfileScreen.tsx:110](../src/screens/social/FriendProfileScreen.tsx#L110)).
3. Re-check the grant every 60 s while open; if revoked mid-session, swap to locked-card and clear the data from memory.
4. Never persist patient data to therapist-side `localStorage` / IndexedDB.

### 11.2 Audit trail

Every read of a patient's diary / food / sleep / mood and every write of a clinical note must produce a server-side audit record (therapist id, patient id, resource, timestamp). Surface this back in the patient profile (right rail) as "Last viewed by you: 2 hours ago" — patients can request this log on their side.

### 11.3 Accessibility

- WCAG AA contrast.
- Full keyboard navigation (especially the Messages two-pane layout).
- Screen-reader labels on every permission badge — accessibility is more than visual.

### 11.4 Branding & theme

- Reuse the `COLORS` palette from [src/theme](../src/theme/) where feasible (so charts in §7.4 and §7.5 visually match what the patient sees).
- Therapist UI uses a denser, neutral surface (white / `borderSubtle`) rather than the gradient-heavy hero blocks of the teen app.

---

## 12. Out of scope (initial release)

- Group therapy / multi-patient sessions.
- Insurance & billing integration.
- Prescription management.
- Patient-facing therapist directory (this is the *patient* app's `TherapistDetailScreen` — therapists don't curate that view here).

---

## 13. Mapping summary

| Mobile screen | Therapist-web counterpart |
|---|---|
| [LoginScreen.tsx](../src/screens/auth/LoginScreen.tsx) | Login page (§3.1) |
| [RegisterScreen.tsx](../src/screens/auth/RegisterScreen.tsx) (`THERAPIST` branch) | Sign-up + license upload (§3.2-3.3) |
| [BookingScreen.tsx](../src/screens/booking/BookingScreen.tsx) | Inverted — Availability management (§6) |
| [ConsultationDetailScreen.tsx](../src/screens/booking/ConsultationDetailScreen.tsx) | Appointment detail page (§5.2) |
| [WaitingRoomScreen.tsx](../src/screens/booking/WaitingRoomScreen.tsx) | Appointment detail "Join" gating (§5.2) |
| [VideoConsultationScreen.tsx](../src/screens/booking/VideoConsultationScreen.tsx) | Embedded Jitsi session (§5.3) |
| [AppointmentsHistoryScreen.tsx](../src/screens/booking/AppointmentsHistoryScreen.tsx) | Appointments list (§5.1) |
| [ConsultationFeedbackScreen.tsx](../src/screens/booking/ConsultationFeedbackScreen.tsx) | Read-only "Patient's review of you" (§5.2) |
| [MessageListScreen.tsx](../src/screens/social/MessageListScreen.tsx) | Channel list (§9.2) |
| [ChatScreen.tsx](../src/screens/social/ChatScreen.tsx) | Conversation pane (§9.3) |
| [FriendProfileScreen.tsx](../src/screens/social/FriendProfileScreen.tsx) | Permission panel + Patient profile (§7.2, §9.4) |
| [DiaryOverviewScreen.tsx](../src/screens/tracking/diary/DiaryOverviewScreen.tsx) | Patient profile → Diary tab, read-only (§7.2.3) |
| [FoodMainScreen.tsx](../src/screens/tracking/food/FoodMainScreen.tsx) | Patient profile → Food tab, read-only (§7.2.4) |
| [SleepMainScreen.tsx](../src/screens/tracking/sleep/SleepMainScreen.tsx) | Patient profile → Sleep tab, read-only (§7.2.5) |
| (mood check-in, scattered) | Patient profile → Mood tab, read-only (§7.2.6) |
| (none) | Clinical notes (§8) |
| (none) | Dashboard (§4) |
