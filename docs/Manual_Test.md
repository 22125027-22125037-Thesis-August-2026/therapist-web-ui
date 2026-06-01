# Manual Test Plan — Therapist Booking Feature

End-to-end manual tests for the **therapist consultation booking** flow. Each test
exercises both ends of the system:

- **Patient (Mobile)** — `thesis-mobile`, screens under `src/screens/booking/`
  (`TherapistBookingLanding`, `BookingScreen`, `ConsultationDetailScreen`,
  `WaitingRoomScreen`, `AppointmentsHistoryScreen`, `ConsultationFeedbackScreen`,
  `MatchingFormScreen`, `TherapistDetailScreen`).
- **Therapist (Web)** — `therapist-web-ui`, pages under `src/pages/`
  (`availability/AvailabilityPage`, `appointments/AppointmentsListPage`,
  `appointments/AppointmentDetailPage`, `appointments/VideoSessionPage`,
  `clinical-notes/ClinicalNoteEditorPage`).

Both clients talk to the same `therapist-api` through the nginx gateway
(`/api/v1/therapist/...`).

---

## 0. Environment & Test Accounts

| Item | Value / Notes |
| --- | --- |
| Gateway base URL | `<env>` — nginx strips `/therapist/` before forwarding to therapist-api |
| Therapist web user | A therapist account with `LICENSED`/approved status (can reach the dashboard, not `LicensePendingPage`) |
| Patient mobile user | A patient account that has completed the matching form and has the test therapist as **ACTIVE** assigned therapist |
| Assignment | Patient must be matched to the test therapist (`/profiles/{profileId}/assigned-therapist` returns 200) |
| Clocks | Therapist web and mobile device clocks must be reasonably in sync; several tests depend on time windows |

### Booking lifecycle reference (server statuses)

```
REQUESTED ──confirm──► UPCOMING ──(start)──► IN_PROGRESS ──finalize note──► COMPLETED
    │                      │                      │
  reject / cancel        cancel                 cancel
    ▼                      ▼                      ▼
 CANCELLED             CANCELLED              CANCELLED        (also: NO_SHOW)
```

Web UI status label mapping (`statusUiMap`): `UPCOMING → CONFIRMED`, others map 1:1.

### Key business rules to keep in mind

| Rule | Where enforced (UI) |
| --- | --- |
| Mode mapping: mobile `Video → VIDEO`, `Chat → TEXT` | `WaitingRoomScreen.confirmBooking` |
| Therapist can **confirm/reject** only while `> 2h` before start | `AppointmentDetailPage.canConfirmReject` |
| Auto-reject sweep cancels a `REQUESTED` booking not actioned by 2h before start | backend sweep (observe result) |
| Therapist can **cancel** an UPCOMING/IN_PROGRESS session only while `> 1h` before start | `AppointmentDetailPage.canCancelUpcoming` |
| Therapist cancel **reason is required** | `AppointmentDetailPage.handleCancel` |
| Patient can **cancel** while status ∈ {REQUESTED, UPCOMING, IN_PROGRESS} | `WaitingRoomScreen.STATUSES_THAT_CAN_CANCEL` |
| Patient cancel **reason required**, max 1000 chars | `WaitingRoomScreen.submitCancellation` |
| **Join window**: 10 min before start until end, status UPCOMING/IN_PROGRESS | web `inJoinWindow`, mobile `TEN_MINUTES_IN_MS` |
| Booking a taken slot returns **409** → patient is shown alternative slots | `WaitingRoomScreen` (409 branch) |
| Finalizing a clinical note marks the appointment **COMPLETED** | `ClinicalNoteEditorPage` finalize dialog |

---

## TEST 1 — Patient requests a booking, therapist confirms it *(happy path)*

**Goal:** A mobile booking request appears on the web as `REQUESTED` and, after the
therapist confirms, becomes `UPCOMING/CONFIRMED` on both clients.

**Preconditions**
- Therapist has at least one **open** (unbooked) slot **more than 2 hours** in the future.
- Patient has this therapist as the active assigned therapist.

**Steps**

| # | Side | Action |
| --- | --- | --- |
| 1 | Web | Log in as therapist → **Availability**. Confirm an open slot exists `> 2h` ahead (green "Available"). Note its date/time. |
| 2 | Mobile | Open **Therapist** tab (landing). Tap the active therapist card → **Đặt lịch hẹn** (or "Trò chuyện với chuyên gia"). |
| 3 | Mobile | On **BookingScreen**, pick the date of the open slot, then select the matching time slot. Tap **Confirm**. |
| 4 | Mobile | On **ConsultationDetailScreen**, type a reason (e.g. "Feeling anxious before exams"), choose **Video** (or **Chat**), tap confirm. |
| 5 | Mobile | On **WaitingRoomScreen**, tap **"Xác nhận đặt lịch với chuyên gia"**. |
| 6 | Mobile | Verify the card now shows status **REQUESTED** + the "awaiting approval" banner. |
| 7 | Web | Go to **Appointments → Requested** tab (or **Upcoming**). The new request appears with the patient name, mode badge, and `REQUESTED` status. |
| 8 | Web | Open the appointment. The **"Decision required"** card is visible; **Confirm booking** is enabled (because `> 2h` to start). Patient reason is shown. |
| 9 | Web | Click **Confirm booking**. |
| 10 | Web | Status badge updates to **CONFIRMED** (server `UPCOMING`); the Decision card disappears. |
| 11 | Mobile | Pull-to-refresh the landing / re-open the waiting room. Status changes from REQUESTED to **UPCOMING** (auto-refresh runs every 30s). |

**Expected**
- Web: booking transitions `REQUESTED → CONFIRMED` and the slot shows **Booked** on Availability.
- Mobile: status reflects **UPCOMING**; the upcoming-appointment card appears on the landing.
- Mode chosen on mobile (Video/Chat) matches the **Mode** shown on the web detail (`VIDEO`/`TEXT`).

---

## TEST 2 — Patient requests a booking, therapist rejects it

**Goal:** A rejected request frees the slot and shows as cancelled to the patient.

**Preconditions:** As Test 1 (open slot `> 2h` ahead), a fresh `REQUESTED` booking created via mobile (Test 1 steps 2–6).

**Steps**

| # | Side | Action |
| --- | --- | --- |
| 1 | Web | Appointments → open the `REQUESTED` booking. |
| 2 | Web | In the Decision card, click **Reject**. |
| 3 | Web | Enter an optional reason ("Slot no longer available") → **Reject booking**. |
| 4 | Web | Status badge becomes **CANCELLED**. |
| 5 | Web | Go to **Availability**: the previously-booked cell is **Available** again (slot released). |
| 6 | Mobile | Refresh the waiting room / landing. |

**Expected**
- Web: booking is `CANCELLED`; slot is released and bookable again.
- Mobile: the appointment shows the **cancelled banner**; if a reason was given it is displayed; the upcoming card is gone.

---

## TEST 3 — Therapist confirm/reject window is closed (< 2h to start)

**Goal:** The decision controls disable once the start time is within 2 hours.

**Preconditions:** A `REQUESTED` booking whose slot starts **less than 2 hours** from now
(create a slot ~90 min ahead in Availability, then book it from mobile).

**Steps**

| # | Side | Action |
| --- | --- | --- |
| 1 | Mobile | Book the near-term slot (Test 1 flow). |
| 2 | Web | Open the appointment detail. |
| 3 | Web | Observe the Decision card. |

**Expected**
- **Confirm booking** and **Reject** buttons are **disabled**.
- The warning text **"Decision window has closed (< 2 h to start)."** is shown.
- (Optional, time-permitting) Leaving the booking unconfirmed past the 2h mark results in the backend **auto-reject sweep** moving it to `CANCELLED` — verify on both clients after the sweep runs.

---

## TEST 4 — Therapist cancels a confirmed (UPCOMING) session

**Goal:** A confirmed session can be cancelled by the therapist with a required reason.

**Preconditions:** A **CONFIRMED/UPCOMING** booking starting **more than 1 hour** from now (do Test 1, ensuring slot is >1h ahead).

**Steps**

| # | Side | Action |
| --- | --- | --- |
| 1 | Web | Open the UPCOMING appointment → **Actions** panel. |
| 2 | Web | Click **Cancel session**. The dialog opens. |
| 3 | Web | Leave the reason blank, click **Cancel session** → expect inline error **"Reason is required."** |
| 4 | Web | Enter a reason → confirm. |
| 5 | Web | Status badge becomes **CANCELLED**; a red "Cancelled" block with the reason appears. |
| 6 | Mobile | Refresh waiting room/landing. |

**Expected**
- Web: status `CANCELLED`, reason persisted and shown.
- Mobile: cancelled banner with the therapist's reason and cancelled-at timestamp; the booking also appears under **Appointments History → Đã hủy**.

---

## TEST 5 — Therapist cancel window closed (< 1h to start)

**Goal:** Cancellation is blocked within 1 hour of start.

**Preconditions:** A CONFIRMED/UPCOMING booking starting **less than 1 hour** from now.

**Steps**

| # | Side | Action |
| --- | --- | --- |
| 1 | Web | Open the appointment → Actions panel. |

**Expected**
- **Cancel session** button is **disabled**.
- The note **"Cancellation closed (within 1 h of start)."** is displayed.

---

## TEST 6 — Patient cancels a requested/confirmed booking

**Goal:** Patient-initiated cancellation from the mobile waiting room.

**Preconditions:** A booking in `REQUESTED` or `UPCOMING` owned by the patient.

**Steps**

| # | Side | Action |
| --- | --- | --- |
| 1 | Mobile | Open the booking (landing upcoming card → WaitingRoom, or via "Vào phòng chờ"). |
| 2 | Mobile | Tap **"Hủy buổi tham vấn"** (cancel). The cancel dialog opens. |
| 3 | Mobile | Submit empty reason → expect required-reason error. |
| 4 | Mobile | Enter a reason (≤ 1000 chars; verify the counter) → submit. |
| 5 | Mobile | Card switches to **CANCELLED** banner. |
| 6 | Web | Refresh **Appointments**. |

**Expected**
- Mobile: booking shows `CANCELLED`; visible in **History → Đã hủy** with reason.
- Web: appointment now `CANCELLED` (visible under the **Cancelled** tab); slot released on Availability.
- Character counter caps input at 1000.

---

## TEST 7 — Availability slot management drives patient slot list

**Goal:** Slots created/deleted on the web are reflected in the mobile booking calendar.

**Steps**

| # | Side | Action |
| --- | --- | --- |
| 1 | Web | Availability → click an empty cell → set duration (e.g. 60 min) → **Add slot**. New green **Available** cell appears. |
| 2 | Mobile | Open BookingScreen for that therapist. The new date is selectable; the new time slot appears in the time grid. |
| 3 | Web | Click the open slot → **Delete slot** (only allowed for unbooked slots). |
| 4 | Mobile | Re-open / refresh BookingScreen. |

**Expected**
- Newly created slot becomes selectable on mobile (dates without slots are disabled/greyed; `maxDate` follows the latest slot).
- Deleted slot disappears from the mobile time grid.
- A **booked** slot on the web shows the patient name, is **blue**, and **cannot** be edited or deleted (delete button hidden / "Booked slots cannot be edited or deleted.").

---

## TEST 8 — Double-booking conflict (409) shows alternative slots

**Goal:** When the chosen slot is taken between selection and confirm, the patient is offered alternatives.

**Preconditions:** Two patient sessions, or manually book the same slot from two devices; the slot must be consumed before the second confirm.

**Steps**

| # | Side | Action |
| --- | --- | --- |
| 1 | Mobile A | Start booking a specific slot but do **not** confirm yet (stay on WaitingRoom). |
| 2 | Mobile B (or web) | Book/confirm that same slot so it becomes taken. |
| 3 | Mobile A | Tap **"Xác nhận đặt lịch với chuyên gia"**. |

**Expected**
- Confirm fails with the backend 409 message shown as `bookingError`.
- The **"Khung giờ trống khác"** (other available slots) section appears, listing alternatives grouped by date.
- Selecting an alternative slot + re-confirming succeeds and creates the booking.

---

## TEST 9 — Join a VIDEO session (join window)

**Goal:** Both sides can only join within 10 minutes of start, and the video room loads.

**Preconditions:** A **CONFIRMED/UPCOMING**, **VIDEO** booking.

**Steps**

| # | Side | Action |
| --- | --- | --- |
| 1 | Web | Open the appointment **more than 10 min** before start. The **Join** button reads **"Join opens in N min"** and is disabled. |
| 2 | Mobile | On WaitingRoom, the **"Tham gia"** button is disabled with helper text "Bạn chỉ có thể tham gia trong vòng 10 phút trước giờ hẹn." |
| 3 | — | Wait until within 10 minutes of the start time (or set up a slot starting ~5 min out). |
| 4 | Web | **Join video session** becomes enabled → click it → `VideoSessionPage` loads the meeting iframe (from `joinSession` `meetingUrl`). |
| 5 | Mobile | **Tham gia** becomes enabled → tap → navigates to the video consultation screen. |

**Expected**
- Join controls are disabled outside the 10-min window and enabled within it.
- Web video page renders the meeting iframe; the right rail shows the patient's reason, recent diary (if permitted), and an auto-saving scratchpad.

---

## TEST 10 — Chat/TEXT session routing

**Goal:** A `TEXT` (Chat) booking routes to chat, not video.

**Preconditions:** A CONFIRMED/UPCOMING booking with mode **Chat** (mobile) → **TEXT** (web).

**Steps**

| # | Side | Action |
| --- | --- | --- |
| 1 | Web | Open the appointment → Actions panel. |
| 2 | Web | Confirm there is **no** "Join video session" button; instead **"Open chat"** links to `/messages?patient={profileId}`. |
| 3 | Web | Click **Open chat** → Messages page opens scoped to that patient. |

**Expected**
- VIDEO bookings show **Join video session**; TEXT bookings show **Open chat**.
- Mode badge in the list reflects `VIDEO` vs `TEXT`, and the mode filter dropdown filters correctly.

---

## TEST 11 — Therapist writes a clinical note → patient sees it

**Goal:** After a session, the therapist's finalized clinical note surfaces to the patient.

**Preconditions:** A booking that has reached `IN_PROGRESS`/`COMPLETED` (or use the video page **"End & write note"**).

**Steps**

| # | Side | Action |
| --- | --- | --- |
| 1 | Web | From the video session click **"End & write note"** (or appointment **"Write clinical note"**). `ClinicalNoteEditorPage` opens tied to the appointment. |
| 2 | Web | Fill **Diagnosis** + **Recommendations** (and SOAP fields). Click **Save draft** → badge shows `DRAFT`, "Saved HH:mm:ss". |
| 3 | Web | Toggle a **Risk flag** (e.g. Suicidal ideation) → the **"Safety protocol triggered"** dialog appears → Acknowledge. |
| 4 | Web | Click **Finalize** → confirm in the dialog. Badge becomes `FINALIZED`, the form is read-only. |
| 5 | Web | Re-open the appointment: it should now be **COMPLETED** (finalize completes an in-progress session). |
| 6 | Mobile | Open the completed appointment from **History** (Chi tiết) or the unreviewed card → `ConsultationFeedbackScreen`. |

**Expected**
- Web: note saves as DRAFT, then FINALIZED (read-only); appointment moves to COMPLETED.
- Mobile: feedback screen's **note section** shows the diagnosis + recommendations + created-at (from `getClinicalNoteByAppointment`); empty state shown only when no note exists.

---

## TEST 12 — Patient submits a review → therapist sees rating

**Goal:** A completed, unreviewed session can be reviewed; the rating reflects on the therapist.

**Preconditions:** A **COMPLETED** appointment with no existing review for the patient.

**Steps**

| # | Side | Action |
| --- | --- | --- |
| 1 | Mobile | Landing shows the session under **"Buổi tham vấn chờ đánh giá"**. Tap **"Đánh giá ngay"**. |
| 2 | Mobile | On `ConsultationFeedbackScreen`, pick an emoji rating (1–5) and type a comment. Tap confirm. |
| 3 | Mobile | On success, navigation returns to the Therapist tab; the unreviewed card is gone. |
| 4 | Mobile | Re-attempt a review for the same appointment → expect the **409 conflict** dialog ("already reviewed") and acknowledge. |
| 5 | Web | Open the therapist's profile / reviews (`getTherapistReviews`) and confirm the new rating + comment appear and the average rating updates. |

**Expected**
- Mobile: review submits once; a second attempt triggers the conflict modal.
- Web/Therapist: the review and updated average rating are visible.

---

## TEST 13 — Appointment list filters & tabs (web)

**Goal:** The web Appointments tabs and filters segment bookings by status correctly.

**Steps**

| # | Side | Action |
| --- | --- | --- |
| 1 | Web | Appointments → **Requested**: only `REQUESTED` bookings listed. |
| 2 | Web | **Upcoming**: `REQUESTED/UPCOMING/IN_PROGRESS` starting from now onward. |
| 3 | Web | **Today**: only sessions within today's date range. |
| 4 | Web | **Past**: `COMPLETED/NO_SHOW`. |
| 5 | Web | **Cancelled**: `CANCELLED`. |
| 6 | Web | Use **mode** dropdown (Video/Text) and **patient search** box; verify client-side filtering. |

**Expected**
- Each tab queries the correct `status` set; date filters apply for Today/Upcoming.
- Mode filter and search narrow the visible cards without a refetch.

---

## TEST 14 — Patient appointment history tabs (mobile)

**Goal:** Completed and cancelled sessions are correctly bucketed on mobile.

**Steps**

| # | Side | Action |
| --- | --- | --- |
| 1 | Mobile | Landing → **"Lịch sử tham vấn chuyên gia"**. |
| 2 | Mobile | **Đã hoàn thành** tab lists COMPLETED sessions; expand a card → **Chi tiết** opens the read-only feedback screen. |
| 3 | Mobile | **Đã hủy** tab lists CANCELLED sessions with cancellation reason + cancelled-at. |
| 4 | Mobile | Pull-to-refresh reloads the list. |

**Expected**
- COMPLETED and CANCELLED sessions appear under the right tabs.
- Cancelled entries show reason/time; completed entries expose the read-only detail view.

---

## TEST 15 — New patient: matching → assignment → first booking

**Goal:** A patient with no active therapist completes matching and can then book.

**Steps**

| # | Side | Action |
| --- | --- | --- |
| 1 | Mobile | As a patient with **no** active therapist, the landing shows the empty-state card ("Bạn chưa có chuyên gia đang hoạt động"). |
| 2 | Mobile | Trigger **MatchingForm** (e.g. "Trò chuyện với chuyên gia" with no therapist). Complete all **8 steps** (each required step gates the Next button) and submit. |
| 3 | Mobile | After submit, return to the Therapist tab; once assignment completes, the active therapist card appears. |
| 4 | Mobile | Proceed to book a slot (Test 1) with the newly assigned therapist. |
| 5 | Web | The therapist sees the new request and, after confirming, the patient under their roster/appointments. |

**Expected**
- Matching submission assigns a therapist (`assigned-therapist` returns 200).
- The newly assigned therapist becomes bookable and the booking flow (Test 1) succeeds.

---

## Regression checklist (quick smoke)

- [ ] Mode mapping correct: mobile Video↔web VIDEO, mobile Chat↔web TEXT.
- [ ] Slot booked on web becomes read-only; cancel/reject releases it.
- [ ] Status transitions consistent across both clients within one refresh cycle (~30s).
- [ ] Required-reason validation on both web and mobile cancel dialogs.
- [ ] Time windows enforced: confirm/reject `>2h`, therapist cancel `>1h`, join `≤10 min`.
- [ ] Finalized clinical note is read-only and completes the appointment.
- [ ] Duplicate review blocked with a conflict message.
