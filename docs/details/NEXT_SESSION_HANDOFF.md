# chapter அ — Next Session Handoff
_Last updated: 2026-05-18_

---

## Project Overview

React + Vite + Tailwind app at `/Users/krutesh/Downloads/Website Flow Multi-Pickup/`

- **Frontend:** `src/App.tsx` (invite flow + native PayU checkout), `src/AppFlow.tsx` (main event browsing flow), `src/AdminPanel.tsx`, `src/supabase.ts`
- **Edge functions (Supabase):** `create-payu-order`, `payu-callback`, `payu-webhook`
- **Database (Supabase project:** `txcmismkdttgsyhbnexf`**):** `events`, `event_dates`, `applications`, `invited_numbers`, `invite_payment_submissions`, `payu_payments`, `flow_analytics`, `chat_messages`
- **Live domain:** `chaptera.in`

---

## ✅ Completed Tasks

### Native PayU Booking Flow (invite-only events)
- [x] **`NativeBookingTimeline`** — bottom sheet showing advance/balance payment steps with live countdown, "Spots Left" badge, KYN-style visual (advance ✓ Paid + remaining balance due by countdown)
- [x] **`NativePaymentOverlay`** — full-screen bill breakdown + PayU form submission; sends `payment_type: 'advance' | 'balance'` to `create-payu-order` edge function
- [x] **`NativeBookingConfirmation`** — fully-paid confirmation screen with green ✓ tick, "You're fully booked!", total paid summary, optional "receive" step from `booking_steps`
- [x] **`isBalancePayment` flag** — wired through `nativeEventData` state → `NativeBookingTimeline` → `NativePaymentOverlay`; balance amount = `Math.max(0, price_full - price_advance)`
- [x] **`isFullyPaid` flag** — skips poster/timeline and routes directly to `NativeBookingConfirmation`

### Invite Lookup Fixes
- [x] **Phone-first `invited_numbers` lookup** — queries `invited_numbers` by phone first (no `is_active` dependency), then fetches event details per match; fixes lookup failing for inactive events
- [x] **`fully_paid` status in applications fallback** — `.in('status', ['invited', 'advance_paid', 'fully_paid'])` so fully-paid users aren't rejected
- [x] **`found.length === 1` native-application routing** — fetches event row, sets `nativeEventData`, routes to `NativeBookingTimeline` (not AppFlow form); fixes 1111111111-style users being sent to the apply form instead of checkout

### Edge Functions
- [x] **`payu-webhook`** — S2S webhook deployed; verifies PayU hash, updates `payu_payments` + `applications` + `invite_payment_submissions` server-side; returns `200 JSON` (not a redirect); fires independently of browser so DB is updated even if user closes after payment
- [x] **`payu-callback`** — browser redirect handler (surl/furl); existing, unchanged
- [x] **`payment_type: 'balance'` → `status: 'fully_paid'`** — `create-payu-order` / callback / webhook all handle balance payments setting `fully_paid`

### Analytics
- [x] In-app browser detection — skips tracking for Instagram/Facebook in-app browsers to avoid double-counting

---

## 🔴 Pending Tasks

### 1. Deploy Local Code to chaptera.in (HIGHEST PRIORITY)
All the above fixes exist **only in local files**. The live site at `chaptera.in` does not have them yet.

**What needs deploying:**
- `src/App.tsx` — all native booking flow changes
- `src/supabase.ts` — `mapDbEventToEvent` with `pickupPoints`, `ticketTypes`, etc.
- Supabase edge functions: `payu-webhook` (new), `payu-callback` (if updated), `create-payu-order` (if updated)

**Deploy steps:**
```bash
cd "/Users/krutesh/Downloads/Website Flow Multi-Pickup"
npm run build
# then push dist/ to Vercel / your hosting, or run: vercel --prod
```

For edge functions:
```bash
supabase functions deploy payu-webhook --project-ref txcmismkdttgsyhbnexf
supabase functions deploy payu-callback --project-ref txcmismkdttgsyhbnexf
supabase functions deploy create-payu-order --project-ref txcmismkdttgsyhbnexf
```

---

### 2. Admin Panel Cleanup
`src/AdminPanel.tsx` needs a cleanup pass. Known issues / things to fix:
- Remove or hide debug/test fields not needed for day-to-day use
- Review which fields are shown in the event editor — confirm all new fields are present: `pickup_points`, `ticket_types`, `booking_steps`, `invite_spots`, `invite_slug`, `advance_qr_url`, `balance_qr_url`, `kyn_payment_url`, `show_secret_offer`, `is_activity`
- Check the invited numbers management — there should be a UI to add/remove phone numbers from `invited_numbers` table per event
- Confirm the `event_dates` editor supports `booking_steps` per date and `whatsapp_group_url`
- General UI polish — consistent spacing, section grouping, easier to navigate for non-technical users

---

### 3. WhatsApp Template Approvals (AiSensy)
Templates needed:

| Template | Trigger | Status |
|---|---|---|
| **Advance payment confirmed** | After `advance_paid` webhook fires | Pending approval |
| **Balance reminder** | X days before balance due date | Not created yet |
| **Fully booked confirmation** | After `fully_paid` webhook fires | Not created yet |
| **Invite link** | When a phone is added to `invited_numbers` | Not created yet |

**Notes:**
- AiSensy is the WhatsApp BSP
- Templates must be submitted via AiSensy dashboard for Meta approval (typically 24-48 hrs)
- Template variables needed: `{{name}}`, `{{event_title}}`, `{{amount}}`, `{{balance_due_date}}`, `{{whatsapp_group_url}}`
- Once approved, hook them into the webhook handler (`payu-webhook`) and any `invited_numbers` insert trigger

---

### 4. Smart Status Page on `/invite` (Task 9)
When a user visits `/invite` (or the invite landing), show them their current status:

| Status | What to show |
|---|---|
| `pending` (not in `applications`) | Normal invite form |
| `invited` | "You're on the list" + CTA to pay advance |
| `advance_paid` | "Advance paid ✓" + CTA to pay balance + countdown |
| `fully_paid` | `NativeBookingConfirmation` screen |

This requires checking `applications` table by phone after verification and routing accordingly — similar to what the `findInviteMatches` function now does, but as a dedicated status page / screen state.

---

### 5. Header Copy (Minor)
In `NativeBookingTimeline`, the header currently says **"Review Booking"**. Needs a final copy decision. Options discussed:
- "Your Booking"
- "Secure Your Spot"
- "Complete Booking"

---

## Key DB Tables Reference

| Table | Purpose |
|---|---|
| `events` | All event data, `booking_url = 'native-application'` for PayU flow |
| `event_dates` | Dates per event with `status`, `booking_steps`, `whatsapp_group_url` |
| `applications` | Per-phone payment status: `invited → advance_paid → fully_paid` |
| `invited_numbers` | Whitelist: `event_slug` (= `invite_slug`) + `phone` |
| `invite_payment_submissions` | Payment log: `invite_slug`, `phone`, `status`, `txnid` |
| `payu_payments` | Raw PayU transaction records |
| `flow_analytics` | Event funnel analytics |
| `chat_messages` | Bot message templates with `{variable}` placeholders |

---

## Edge Functions Reference

| Function | URL | Purpose |
|---|---|---|
| `create-payu-order` | `.../functions/v1/create-payu-order` | Creates PayU hash, returns form params |
| `payu-callback` | `.../functions/v1/payu-callback` | Browser redirect after payment (surl/furl) |
| `payu-webhook` | `.../functions/v1/payu-webhook` | S2S server-to-server notification from PayU |

All three share the same hash verification logic and update the same tables.

---

## PayU Setup Notes
- **Test vs Live:** Currently on test credentials — switch `PAYU_KEY` + `PAYU_SALT` env vars in Supabase to live before going to production
- **Webhook URL to add in PayU dashboard:** `https://txcmismkdttgsyhbnexf.supabase.co/functions/v1/payu-webhook`
  - Add it **twice** in PayU dashboard — once for "Success" and once for "Failure" (PayU doesn't support a single combined webhook URL)
- **`enforce_paymethod`** param is sent to lock payment method and prevent fee mismatch between hash and final amount

---

## How to Run Locally
```bash
cd "/Users/krutesh/Downloads/Website Flow Multi-Pickup"
npm install
npm run dev
# opens on http://localhost:3000
```

Admin panel: go to `/?admin=1` (or whatever the admin route is in App.tsx)
