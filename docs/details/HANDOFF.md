# Chaptera Website — Handoff Document
_Last updated: May 2026_

---

## Project Overview

Chaptera is a mobile-first event booking web app (SPA) built in React + TypeScript + Vite + Tailwind. It lives at **chaptera.in** and handles:
- A chat-style event discovery flow
- Event details overlays with calendar/pickup selection
- Two payment flows: PayU Hosted Checkout (open events) and Manual UPI (invite-only)
- Admin panel for managing events, dates, media, payments
- `/plans`, `/lifestyle`, `/galcode` letter/landing pages
- `/invite/:slug` — invite-only booking flow (SharedInviteFlow)
- `/myplans` — post-booking portal (Google Sign-In required)

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + Framer Motion |
| Backend/DB | Supabase (PostgreSQL + Edge Functions + Auth) |
| Payment | PayU Hosted Checkout (test mode, key: `gtKFFx`) |
| PDF | html2pdf.js (lazy-loaded) |
| Hosting | Vercel (chaptera.in) |

---

## File Structure

```
src/
├── App.tsx          — Top-level router + SharedInviteFlow + NativeBookingTimeline
│                      + NativePaymentOverlay + MyPlansScreen + PayUReturnScreen
├── AppFlow.tsx      — Main chat/booking flow (~3500 lines)
│                      Includes: EventDetailsOverlay, PayUCheckout, JourneyCard,
│                      ApplicationForm, BookingTimeline bottom sheet
├── AdminPanel.tsx   — Full admin dashboard (/admin route, password protected)
└── supabase.ts      — Supabase client, fetchEvents, mapDbEventToEvent,
                       trackEvent, analytics helpers, fetchEventCounts
```

---

## Routes

| URL | What it shows |
|---|---|
| `/` or `/aboutus` | Homepage (redirected) |
| `/plans` | "Join Our Plan" letter page |
| `/lifestyle` | Lifestyle letter page |
| `/galcode` | Galcode letter page |
| `/admin` | Admin panel (password: set in AdminPanel.tsx) |
| `/invite/:slug` | Invite-only event booking flow (SharedInviteFlow) |
| `/invite` | Shared invite flow |
| `/myplans` | My Booking portal (Google Sign-In) |
| `/?preview_event=<id>` | Deep-link directly to an event overlay |
| `/?payment_status=success&txnid=...` | PayU return screen |
| `/?gauth=1&preview_event=<id>` | Google OAuth return (auto-handled) |

---

## Supabase Project

- **Project ref:** `txcmismkdttgsyhbnexf`
- **URL:** `https://txcmismkdttgsyhbnexf.supabase.co`
- **Anon key:** hardcoded in `supabase.ts` (also set as `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` env vars)

### Database Tables

| Table | Purpose |
|---|---|
| `events` | All event data (title, price, cities, booking_url, pickup_points JSON, total_capacity, invite_only, invite_slug, invite_faqs, ticket_types, etc.) |
| `event_dates` | Dates per event (start_date, status, whatsapp_group_url, booking_steps) |
| `event_media` | Videos/thumbnails per event |
| `event_reviews` | Reviews per event |
| `faqs` | FAQs per event |
| `payu_payments` | All PayU transactions (txnid, name, phone, email, amount, status, event_id, whatsapp_group_url) |
| `mock_payment_receipts` | Manual UPI payment submissions |
| `invite_payment_submissions` | Invite-flow advance/balance payments |
| `invited_numbers` | Phone numbers approved for invite-only events |
| `applications` | Application form submissions for invite-only events (name, phone, event_slug, status: pending/advance_paid/fully_paid) |
| `flow_analytics` | Page views, funnel events |
| `chat_messages` | Bot message templates (editable via admin Messages tab) |
| `doubt_submissions` | "Have a doubt?" form submissions |
| `plan_doubts` | Doubts submitted from /myplans page; surfaced in Admin → People → Call mode |

### Key Column Notes
- `events.booking_url`:
  - `'payu-hosted'` → PayU checkout flow
  - `'upi-manual'` → Manual UPI flow
  - Any URL starting with `https://` → External link
- `events.invite_only` → boolean, triggers invite verification gate
- `events.is_activity` → boolean, changes event type label display
- `events.total_capacity` → used to auto-calculate spots left (shown when < 10 remain)
- `events.invite_spots` → for invite-only events, total spots; spots left = invite_spots − reserved applications
- `events.ticket_types` → JSON array; if present, shows ticket type selector in booking form
- `events.booking_steps` → JSON array; custom booking timeline steps (per event or per date override)
- `event_dates.booking_steps` → overrides event-level booking_steps for that specific date
- `event_dates.whatsapp_group_url` → group link shown on success screen + /myplans
- `payu_payments.email` → Google account email, used to look up bookings on /myplans
- `applications.status` → `pending` | `advance_paid` | `fully_paid`

### Edge Functions (Supabase)

| Function | Version | Purpose |
|---|---|---|
| `create-payu-order` | v3 | Creates PayU order, stores pending payment row, returns hash + fields for form POST |
| `payu-callback` | — | Receives PayU success/failure webhook, updates payment status |

**`create-payu-order` accepts:**
```json
{ "name", "phone", "email", "amount", "event_id", "event_title", "trip_date", "whatsapp_group_url" }
```
Currently pointing at **test PayU** (`https://test.payu.in/_payment`). Switch to production URL when going live.

> ⚠️ **Known issue:** PayU S2S webhook hash validation is currently bypassed with a warning log. The hash mismatch root cause needs investigation after inspecting the raw payload from PayU in production logs.

---

## Payment Flows

### 1. PayU (Open Events)
```
User opens event → selects date + pickup → CTA button →
Booking timeline (bottom sheet) → "Pay Now" → Details form (Google Sign-In required) →
name pre-filled, enter phone + accept T&C → PayUCheckout component →
POST to create-payu-order → redirect to PayU → payment →
PayU POSTs to payu-callback → redirects to /?payment_status=success&txnid=... →
PayUReturnScreen shows: invoice + WhatsApp group link + Download Receipt
```

### 2. Invite-Only Native Application Flow (`isNativeApplicationFlow`)
```
User visits /invite/:slug → SharedInviteFlow → verify phone (against invited_numbers) →
Booking timeline bottom sheet → "Request Invitation" CTA →
ApplicationForm (name, phone, date, pickup, etc.) →
Submit → row inserted into applications table → confirmation screen
```

### 3. Invite-Only External Link
```
events.invite_only = true AND events.waitlist_url set →
Booking timeline → CTA → opens external URL (Tally form etc.)
```

### 4. Manual UPI (Invite-only, legacy)
```
User visits /invite/:slug → InviteFlow → verify phone →
Booking timeline → Details form → Payment instructions → UPI QR screen → screenshot sent manually
```

### 5. /myplans Portal
```
User visits chaptera.in/myplans →
If not signed in: Google Sign-In prompt →
OAuth redirects back → Supabase handles token from URL hash →
Query payu_payments WHERE email = session.user.email AND status = 'success' →
Show booking card: event name, date, meeting point, WhatsApp group, amount
Also shows: plan_doubts section for submitting questions
```

---

## Two Separate Flow Files

### `AppFlow.tsx` — Chat Booking Flow
Controls the main website flow. Handles:
- City/category/event selection via chat UI
- Event details overlay (EventDetailsOverlay component, defined inside same file)
- Booking timeline as a **bottom sheet** (always, regardless of event type)
- Application form (ApplicationForm) for `isNativeApplicationFlow` events
- PayU payment (PayUCheckout) for open events
- `applicationCount` — fetched from Supabase (`applications` table count) for social proof

Key booleans:
- `isInvitePaymentFlow` — true when opened from `/invite/:slug` as an overlay
- `isNativeApplicationFlow` — true when `event.invite_only && event.bookingUrl !== 'payu-hosted' && !event.waitlistUrl` (i.e. uses the in-app application form)
- `showBookingTimeline` — controls booking timeline bottom sheet
- `showApplicationForm` — controls application form overlay
- `showDetails` — controls event details overlay

### `App.tsx` — SharedInviteFlow + Supporting Components
Handles `/invite/:slug` route and all non-flow pages. Key components:
- `SharedInviteFlow` — outer shell, manages chat state machine, history stack
- `NativeBookingTimeline` — booking timeline bottom sheet (invite-only version)
- `NativePaymentOverlay` — bill breakdown + PayU form submission for invite flow
- `MyPlansScreen` — Google-auth gated booking portal
- `PayUReturnScreen` — success screen after PayU redirect

---

## Booking Timeline Architecture

Both flows use a **bottom sheet** layout (no centered/full-screen variants):

### AppFlow booking timeline
- Triggered by "Book Now" / "Request Invitation" CTA in EventDetailsOverlay
- Animates up from bottom with spring animation
- Has a floating `×` close button above the sheet (not inside)
- **No drag handle** (removed)
- Shows: event name row (with `applicationCount` social proof label when ≥ 6), date badge, booking steps, CTA
- CTA variants:
  - PayU: yellow "Pay ₹X Now" button
  - `isNativeApplicationFlow`: black "Request Invitation →" + separate `{n} people have already applied.` label below (only if applicationCount > 0)
  - External invite link: black CTA with external link icon

### NativeBookingTimeline (App.tsx)
- Shown in SharedInviteFlow when user reaches booking stage
- Same visual design as AppFlow timeline
- **No drag handle** (removed)
- Title "Your Booking Timeline" at `pt-7 pb-4` (matches AppFlow's `pt-4` wrapper + `pt-3` title = 28px)
- Back-button dismissible (has history.pushState on open)

---

## Back Button / History Architecture (SharedInviteFlow)

Each dismissible layer requires:
1. `window.history.pushState(...)` when opening
2. A check in `onPop` in correct priority order (topmost layer first)

Current priority order in `onPop`:
```
chapteraLayer (external) → showPlanDetailsSheet → showNativeBill →
showNativeTimeline → chatOpen → showNativeConfirmation → wipe
```

When back is pressed from bill: `setShowNativeBill(false)` AND `setShowNativeTimeline(true)` — this restores the timeline behind the bill so back navigates bill → timeline, not bill → chat.

---

## PayU Back/Refresh Safety (NativePaymentOverlay)

Three mechanisms work together:

1. **beforeunload guard** — blocks accidental page refresh with browser dialog
2. **navigatingToPayU ref** — bypass flag set synchronously before `formRef.current.submit()` so the guard doesn't fire on intentional PayU navigation
3. **pageshow event** (`event.persisted`) — resets spinner state when browser restores from bfcache (back button from PayU). Regular `useEffect([])` does NOT fire on bfcache restore.

```ts
// bfcache fix — must use pageshow, not useEffect
window.addEventListener('pageshow', (e) => {
  if (e.persisted) {
    setPaying(false);
    setPayuData(null);
    navigatingToPayU.current = false;
  }
});
```

---

## Social Proof — Application Count

In `AppFlow.tsx`:
- `applicationCount: number | null` state
- Fetched via `fetchEventCounts(event.id)` from `supabase.ts` when event has `isNativeApplicationFlow = true`
- `fetchEventCounts` returns `{ registered, reserved }` — `registered` = all applications, `reserved` = advance_paid + fully_paid
- Currently uses `registered` count for display

Display locations:
1. **Event name row in booking timeline** — `{applicationCount} ppl have requested invitation` with Users icon, shown only when `applicationCount >= 6`
2. **Below CTA button** — `{applicationCount} people have already applied.` shown when `applicationCount > 0`

---

## Google OAuth Setup

- **Provider:** Google (enabled in Supabase Auth → Providers)
- **Google Cloud Project:** `chapter-a`
- **OAuth Client:** `Chapter A Web`
- **Client ID:** `1026359974886-gtinamebkluhi2cffeonv6ua44v6h18a.apps.googleusercontent.com`
- **Authorized redirect URI (Google Console):** `https://txcmismkdttgsyhbnexf.supabase.co/auth/v1/callback`
- **Supabase Site URL:** `https://chaptera.in`
- **Supabase Redirect URLs:** `https://chaptera.in/*`, `http://localhost:5174/*`
- **Branding fix needed:** Go to Google Cloud Console → Google Auth Platform → Branding → set App name to "Chaptera" so consent screen shows "Sign in to Chaptera" not the Supabase URL

---

## Admin Panel (/admin)

Tabs: **Plans | Media | Q&A | Payments | Receipts | Timelines | Other Cities | Messages | Analytics | People**

Key things:
- **Plans tab:** Create/edit/duplicate events. When `booking_url = payu-hosted`: hides advance amount field, shows total capacity + WhatsApp URL per date
- **Receipts tab:** Shows all `payu_payments` WHERE `status = 'success'`
- **Messages tab:** Edit bot chat message templates (stored in `chat_messages` table)
- **People tab / Call mode:** Shows `plan_doubts` submitted from /myplans; can mark replied/closed
- Number inputs all have `onWheel={(e) => e.target.blur()}` to prevent scroll-changing values
- `saveTrip()` has error handling with toast messages
- `duplicateTrip()` generates a new `invite_slug` to avoid UNIQUE constraint violation

---

## Key Implementation Details

### Google Sign-In in Booking Form (AppFlow.tsx)
- `googleUser` state stores `{ name, email }` once signed in
- On form open: `useEffect` checks existing session → auto-fills name
- For PayU flows: Google sign-in is **required** — name/phone fields hidden until signed in
- `handleGoogleSignIn()` saves flow state to `localStorage('gauth_return')` before redirecting
- On OAuth return (`?gauth=1&preview_event=<id>`): restores city/date/pickup, pre-fills form, opens details form directly
- `isDetailsFormValid` includes `(!isPayUFlow || !!googleUser)` — PayU bookings require a Google account

### EventDetailsOverlay (inside AppFlow.tsx)
- Separate component but defined inside AppFlow.tsx file
- Has its own `isPayUFlow`, `openSpotsLeft` state (can't use parent scope variables)
- Spots left: auto-calculated from `payu_payments` count vs `events.total_capacity`
- Shown only when < 10 spots remain; red ≤ 3, orange 4-9

### PayU Return Screen (App.tsx)
- `payuReturnStatus` and `payuReturnTxnid` latched in `useState` initializers (before URL gets replaced)
- Shows: "Your Spot is Confirmed" → WhatsApp group card (shimmer animation) → Invoice card
- Invoice has `id="payu-receipt-card"` for html2pdf targeting
- Download Receipt: lazy-imports html2pdf.js, uses `scrollWidth`/`scrollHeight` for dimensions

### Analytics (supabase.ts)
- `trackEvent()` fires to `flow_analytics` table
- Skips tracking for Instagram/Facebook in-app browsers (they inflate metrics, never convert)
- Session ID stored in `sessionStorage`

---

## Running Locally

```bash
cd "Website Flow Multi-Pickup"
npm install
npm run dev        # starts on http://localhost:5174
npm run build      # production build to /dist
```

No `.env` file needed — Supabase URL and anon key are hardcoded in `supabase.ts` as fallbacks.

---

## Pending / Not Yet Done

| Item | Priority | Notes |
|---|---|---|
| **Deploy to chaptera.in** | 🔴 Urgent | All changes (App.tsx, AppFlow.tsx) are local only — not live yet |
| **Test bfcache fix on real iPhone** | 🔴 | `pageshow` fix in place; needs Safari/iPhone verification |
| **PayU S2S webhook hash fix** | 🟠 | Currently bypassed with warning log; inspect raw payload in edge function logs |
| **Switch PayU to production URL** | 🟠 | Change `PAYU_URL` in `create-payu-order` from `test.payu.in` to `secure.payu.in` |
| **AiSensy advance paid WA trigger test** | 🟠 | Was mid-flight when session ended; test with 3333333333 reset |
| **AiSensy balance reminder WA template** | 🟡 | Template not yet created |
| **AiSensy fully booked confirmation WA template** | 🟡 | Template not yet created |
| **plan_doubts admin reply workflow** | 🟡 | Table + UI exists; no outreach/reply flow built yet |
| **Production Supabase migration** | 🟡 | Confirm `invite_faqs` column migration ran on production |
| **Google Branding** | 🟡 | Set App name in Google Cloud Console so consent screen shows "Chaptera" |
| **Meeting point in payu_payments** | 🟡 | Columns exist but not populated; needed for /myplans to show meeting point |
| **Delete client_secret JSON** | 🟢 | Google OAuth credentials file in Downloads folder — delete it |

---

## Common Gotchas

1. **`isPayUFlow` inside `EventDetailsOverlay`** — this component is defined inside AppFlow.tsx but is a separate React component. Variables from AppFlow's closure are NOT in scope. Always define `isPayUFlow`, `openSpotsLeft` etc. inside `EventDetailsOverlay` itself.

2. **PayU hash format** — SHA-512 hash string: `key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt`. Email in hash MUST match email field sent to PayU.

3. **bfcache vs fresh mount** — `useEffect([], [])` only fires on fresh mount, NOT on bfcache restore (browser back from PayU). Use `pageshow` event with `event.persisted` check for bfcache.

4. **`payuReturnStatus` must be latched** — read from `window.location.search` in a `useState` initializer. If read in `useEffect`, the route sync effect may have already cleared the URL params.

5. **Google OAuth redirect** — `signInWithOAuth` triggers a full page reload. All React state is lost. Any state that needs to survive must be saved to `localStorage('gauth_return')` before calling.

6. **beforeunload fires on form POST** — form POST to PayU counts as page leave and fires the beforeunload guard. Use a ref (`navigatingToPayU`) set synchronously before `formRef.current.submit()` to bypass it.

7. **Back button priority order in SharedInviteFlow** — `onPop` must check layers in Z-order (topmost first). Wrong order causes the wrong sheet to close.

8. **Supabase anon key** is public-safe — scoped to RLS policies. Service role key is only in edge function env vars.

9. **Two "Other Topic" / doubt chat states in SharedInviteFlow** — the `prompt` state has "I Have a Doubt" button; the `has_doubt` state has "Other Topic" button. They are different JSX branches. Only one was restyled to match AppFlow — double-check if you restyle again.
