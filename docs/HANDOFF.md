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
- `/invite/:slug` — invite-only booking flow
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
├── App.tsx          — Top-level router + all page-level components
│                      (MyPlansScreen, PayUReturnScreen, homepage, letter pages)
├── AppFlow.tsx      — Main chat/booking flow (giant component, ~3500 lines)
│                      Includes: EventDetailsOverlay, PayUCheckout, JourneyCard, etc.
├── AdminPanel.tsx   — Full admin dashboard (/admin route, password protected)
└── supabase.ts      — Supabase client, fetchEvents, mapDbEventToEvent,
                       trackEvent, analytics helpers
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
| `/invite/:slug` | Invite-only event booking flow |
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
| `events` | All event data (title, price, cities, booking_url, pickup_points JSON, total_capacity, etc.) |
| `event_dates` | Dates per event (start_date, status, whatsapp_group_url, booking_steps) |
| `event_media` | Videos/thumbnails per event |
| `event_reviews` | Reviews per event |
| `faqs` | FAQs per event |
| `payu_payments` | All PayU transactions (txnid, name, phone, **email**, amount, status, event_id, whatsapp_group_url) |
| `mock_payment_receipts` | Manual UPI payment submissions |
| `invite_payment_submissions` | Invite-flow advance/balance payments |
| `invited_numbers` | Phone numbers approved for invite-only events |
| `flow_analytics` | Page views, funnel events (city_selected, book_clicked, etc.) |
| `chat_messages` | Bot message templates (editable via admin Messages tab) |
| `doubt_submissions` | "Have a doubt?" form submissions |

### Key Column Notes
- `events.booking_url`:
  - `'payu-hosted'` → PayU checkout flow
  - `'upi-manual'` → Manual UPI flow
  - Any URL starting with `https://` → External link
- `events.invite_only` → boolean, triggers invite verification
- `events.total_capacity` → used to auto-calculate spots left (shown when < 10 remain)
- `event_dates.whatsapp_group_url` → group link shown on success screen + /myplans
- `payu_payments.email` → Google account email, used to look up bookings on /myplans

### Edge Functions (Supabase)

| Function | Version | Purpose |
|---|---|---|
| `create-payu-order` | v3 | Creates PayU order, stores pending payment row, returns hash + fields for form POST |
| `payu-callback` | — | Receives PayU success/failure webhook, updates payment status to 'success' or 'failed' |

**`create-payu-order` accepts:**
```json
{ "name", "phone", "email", "amount", "event_id", "event_title", "trip_date", "whatsapp_group_url" }
```
Currently pointing at **test PayU** (`https://test.payu.in/_payment`). Switch to production URL when going live.

---

## Payment Flows

### 1. PayU (Open Events)
```
User opens event → selects date + pickup → CTA button →
Booking timeline → "Pay Now" → Details form (Google Sign-In required) →
name pre-filled, enter phone + accept T&C → PayUCheckout component →
POST to create-payu-order → redirect to PayU → payment →
PayU POSTs to payu-callback → redirects to /?payment_status=success&txnid=...→
PayUReturnScreen shows: invoice + WhatsApp group link + Download Receipt
```

### 2. Manual UPI (Invite-only)
```
User visits /invite/:slug → InviteFlow → verify phone →
Booking timeline → Details form (no Google required) →
Payment instructions → UPI QR screen → screenshot sent manually
```

### 3. /myplans Portal
```
User visits chaptera.in/myplans →
If not signed in: Google Sign-In prompt →
OAuth redirects to /myplans → Supabase handles token from URL hash →
Query payu_payments WHERE email = session.user.email AND status = 'success' →
Show booking card: event name, date, meeting point, WhatsApp group, amount
```

---

## Google OAuth Setup

- **Provider:** Google (enabled in Supabase Auth → Providers)
- **Google Cloud Project:** `chapter-a`
- **OAuth Client:** `Chapter A Web`
- **Client ID:** `1026359974886-gtinamebkluhi2cffeonv6ua44v6h18a.apps.googleusercontent.com`
- **Authorized redirect URI (Google Console):** `https://txcmismkdttgsyhbnexf.supabase.co/auth/v1/callback`
- **Supabase Site URL:** `https://chaptera.in`
- **Supabase Redirect URLs:** `https://chaptera.in/*`, `http://localhost:5174/*`
- **Branding fix needed:** Go to Google Cloud Console → Google Auth Platform → Branding → set App name to "Chaptera" so the consent screen shows "Sign in to Chaptera" instead of the Supabase URL

---

## Key Implementation Details

### Google Sign-In in Booking Form (AppFlow.tsx)
- `googleUser` state stores `{ name, email }` once signed in
- On form open: `useEffect` checks existing session → auto-fills name
- For PayU flows: Google sign-in is **required** — name/phone fields hidden until signed in
- `handleGoogleSignIn()` saves flow state (`city`, `date`, `meetingPoint`) to `localStorage('gauth_return')` before redirecting
- On OAuth return (`?gauth=1&preview_event=<id>`): restores city/date/pickup, pre-fills form, opens details form directly
- `isDetailsFormValid` includes `(!isPayUFlow || !!googleUser)` — PayU bookings require a Google account

### Invite-Only Flow (UNTOUCHED — live in production)
- Completely separate from PayU flow
- Controlled by `isInvitePaymentFlow = !!inviteSlug`
- No Google Sign-In requirement
- Uses `invited_numbers` table for phone verification
- Uses `invite_payment_submissions` for payment tracking

### EventDetailsOverlay (inside AppFlow.tsx ~line 3050)
- Separate component but defined inside AppFlow.tsx file
- Has its own `isPayUFlow`, `openSpotsLeft` state (can't use parent scope)
- Spots left: auto-calculated from `payu_payments` count vs `events.total_capacity`
- Shown only when < 10 spots remain; red ≤ 3, orange 4-9

### PayU Return Screen (App.tsx)
- `payuReturnStatus` and `payuReturnTxnid` latched in `useState` initializers (before URL gets replaced)
- Shows: "Your Spot is Confirmed" → WhatsApp group card (shimmer animation) → Invoice card
- Invoice has `id="payu-receipt-card"` for html2pdf targeting
- Download Receipt: lazy-imports html2pdf.js, uses `scrollWidth`/`scrollHeight` for dimensions

### Analytics (supabase.ts)
- `trackEvent()` fires to `flow_analytics` table
- Skips tracking for Instagram/Facebook in-app browsers (they never convert + inflate metrics)
- Session ID stored in `sessionStorage`
- Events: `page_view`, `city_selected`, `category_selected`, `event_selected`, `calendar_opened`, `date_selected`, `reached_pricing`, `book_clicked`, `contact_clicked`, `pricing_cta_clicked`, `book_cta_clicked`, `external_redirect_initiated`

---

## Admin Panel (/admin)

Tabs: **Plans | Media | Q&A | Payments | Receipts | Timelines | Other Cities | Messages | Analytics**

Key things:
- **Plans tab:** Create/edit/duplicate events. When `booking_url = payu-hosted`: hides advance amount field, shows total capacity field, shows WhatsApp URL per date
- **Receipts tab:** Shows all `payu_payments` WHERE `status = 'success'`
- **Messages tab:** Edit bot chat message templates (stored in `chat_messages` table)
- Number inputs all have `onWheel={(e) => e.target.blur()}` to prevent scroll-changing values
- `saveTrip()` has error handling with toast messages
- `duplicateTrip()` generates a new `invite_slug` to avoid UNIQUE constraint violation

---

## Migrations Applied (this session)

| Migration | What it did |
|---|---|
| `add_whatsapp_group_url_to_event_dates_and_payu_payments` | Added `whatsapp_group_url` to both tables |
| `add_total_capacity_to_events` | Added `total_capacity` column |
| `set_defaults_for_legacy_not_null_columns` | Set DEFAULT '' on group_size, transport, start_location, hero_image, description; DEFAULT 0 on price_advance |
| `add_email_to_payu_payments` | Added `email` column (stores Google account email) |

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

## Next Goals (Phase 2 — Invite-Only Overhaul)

The invite-only flow currently works via phone number verification against `invited_numbers` table. The goal is to modernize it with Google auth:

### 1. Google Gate Before Tally Form
- User clicks "Apply" on an invite-only event
- **Before** seeing the Tally form, they must sign in with Google
- Their Google email is captured and pre-filled/embedded into the Tally form URL
- Goal: link every application to a Google account from the start

### 2. Application Approval Table
Create a new table: `invite_applications`
```sql
CREATE TABLE invite_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  google_email text NOT NULL,
  event_slug text NOT NULL,
  status text DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  tally_submission_id text,
  created_at timestamptz DEFAULT now()
);
```

### 3. Admin Approval Flow
- New tab or section in Admin Panel: "Applications"
- List pending applications → approve/reject buttons
- On approve: flips `status` to 'approved'

### 4. Approved User Experience
- User visits `/invite/:slug` or `/myplans` → signs in with Google
- If their email is in `invite_applications` with `status = 'approved'` for that event → show invite + payment details
- If pending → "Your application is under review"
- If rejected → "Unfortunately your application wasn't selected"

---

## Other Pending / Nice-to-Have

- [ ] **Switch PayU to production** — change `PAYU_URL` in `create-payu-order` edge function from `https://test.payu.in/_payment` to `https://secure.payu.in/_payment`
- [ ] **Google Branding** — set App name in Google Cloud Console so consent screen shows "Chaptera" not the Supabase URL
- [ ] **AI Sensy integration** — send `chaptera.in/myplans` link in payment confirmation message so users know how to access their booking
- [ ] **Meeting point field in payu_payments** — currently `meeting_point` and `pickup_time` columns exist in the schema but aren't populated. Need to pass pickup point data from the booking into the payment row so /myplans can show it.
- [ ] **Delete client_secret JSON** from Downloads folder (Google OAuth credentials)

---

## Common Gotchas

1. **`isPayUFlow` inside `EventDetailsOverlay`** — this component is defined inside AppFlow.tsx but is a separate React component. Variables from AppFlow's scope are NOT accessible. Always define `isPayUFlow`, `openSpotsLeft` etc. inside `EventDetailsOverlay` itself.

2. **PayU hash** — the SHA-512 hash string format is strict: `key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt`. The email used in the hash MUST match the email field sent to PayU.

3. **Invite flow is live** — do not modify the invite-only payment flow, InviteFlow component, or `invited_numbers` / `invite_payment_submissions` tables without careful testing.

4. **`payuReturnStatus` must be latched** — it's read from `window.location.search` in a `useState` initializer. If you read it in a `useEffect`, the route sync effect may have already cleared the URL params.

5. **Google OAuth redirect** — `signInWithOAuth` triggers a full page reload. All React state is lost. Any state that needs to survive must be saved to `localStorage('gauth_return')` before calling it.

6. **Supabase anon key** is public and safe to hardcode — it's a read/write key scoped to RLS policies. The service role key is only used inside edge functions via `SUPABASE_SERVICE_ROLE_KEY` env var.
