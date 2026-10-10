# Open Events — Build Handoff

> Complete reference for the **open-event** feature built on top of the existing invite-only flow.
> Audience: the founder (no-code) + any future dev picking this up cold.
> Line numbers drift as files change — always confirm against current code (`grep` the identifiers).
> Companion: `CLAUDE.md` (repo guide), auto-memory `open-event-flow-design.md`.

---

## 1. What "open events" are & why

The app already had an **invite-only** flow: applicant applies → admin approves/invites → applicant pays advance → (later) balance. That flow leans on **human resources** (approving, inviting, marketer retargeting) that don't scale.

**Open events** remove that friction. They're **impulse, low-ticket** bookings: a user picks a date, enters their details, and pays immediately — **no approval, no invitation step, no marketer required**.

- **`events.booking_url = 'payu-hosted'`** ⇒ open event. (Invite = `'native-application'`; community = `booking_flow='whatsapp'`.)
- **`events.payment_mode`**: `'full'` = single payment (one charge for the full price) · `'split'` = advance + balance.
- Two open sub-types therefore exist: **Open Single (full)** and **Open Split**.

The whole build **mirrors the invite flow** and reuses its components wherever possible, with open-specific customizations.

---

## 2. The open-event status / lifecycle model

Open bookings create rows in the **`applications`** table (same table as invite), so all existing tooling (counts RPCs, People tab, finances) works. The lifecycle:

| Displayed as | Underlying data | Meaning |
|---|---|---|
| **In Progress** | `status='pending'`, `cart_abandoned=false` | Entered details, hasn't paid yet |
| **Cart Abandoned** | `status='pending'`, `cart_abandoned=true` | Reached the bill page, never paid, ≥2h elapsed |
| **Advance Paid** | `status='advance_paid'` | Split: advance paid |
| **Fully Paid** | `status='fully_paid'` | Single: paid · Split: balance paid |
| **Recovered** (badge) | paid **and** `recovered_at IS NOT NULL` | A cart-abandoned lead who later paid |

Key distinctions from invite:
- Invite `pending` = "applied, awaiting approval". Open `pending` = "in progress". They're told apart by whether the event is open (`booking_url='payu-hosted'`).
- `cart_abandoned` and `recovered_at` are **flags/timestamps layered on top of the base status**, not statuses themselves. "Recovered" is a **badge on a paid lead**, not a separate bucket (so paid totals stay clean; you can still filter it for marketing ROI).

---

## 3. Architecture & key decisions

- **Reuse over rebuild.** The bill page and payment return screen are the invite components, shared/parameterized (see #3).
- **Slot counting is free.** Reserved = `applications` rows with `status IN ('advance_paid','fully_paid')`, counted by the existing `event_booking_counts(_by_date)` RPCs. Open bookings feed these once they create `applications` rows — no new counting code.
- **`Event.id` = `events.slug`** (`src/supabase.ts`). So the applications row, the PayU order, and the callback all key on the slug + last-10-digit phone, and line up automatically.
- **Marketers stay opt-in.** Open events have no `event_marketers` rows, so the round-robin assign trigger no-ops (no marketer, no commission). ⚠️ **Gotcha:** events *copied* from an invite event **inherit** `event_marketers` rows, so a copied open event can pull a marketer. Decision: left the trigger as-is (you may want marketers on open events later, e.g. for cart-abandon recovery); remove stray mappings per-event if undesired.

---

## 4. Feature-by-feature build

### #1 — Open booking creates a `pending` applications row
- **Where:** `src/AppFlow.tsx`, `handleProceedToPhonePe`, gated `if (isPayUFlow)`.
- **What:** on proceed-to-pay, upserts an `applications` row: `event_slug` (lowercased slug), `name`, `phone` (**normalized to last-10-digits** to match `payu_payments`/callback), `email` (Google), `status:'pending'`, `selected_date`, pickup fields, `selected_city`, and **`gender:''`, `why_join:''`** (both `NOT NULL` with no default — the open form doesn't collect them).
- **Insert-or-ignore** on the `(event_slug, phone)` unique key (`ignoreDuplicates: true`): a returning abandoned lead keeps their existing row, so `cart_abandoned`/`recovered_at` survive. Never clobbers a paid status.
- **Verified:** DB sim — insert creates `pending`; re-insert ignored (no dup/clobber); a paid row counts as 1 reserved via the RPC.

### #2 — `create-payu-order` linkage
- **No edge-function change needed.** It was already "full-aware": it derives `payment_type='full'` from `events.payment_mode` server-side, charges the full price, and **skips the invited/approved auth gate** for `invite_only=false` events.
- **Only fix (client):** the open flow now sends **`selected_city`** in the order body (`PayUCheckout` body + `paymentContext.selectedCity` in `AppFlow.tsx`) so city-aware pricing is authoritative from the client's selection (server validates against `event.cities`) instead of the fragile applications-row fallback. Prevents mischarges when an event has city price overrides.

### #3 — Payment UX (bill page + callback + return screen)
- **3a — Bill page (shared module).** Extracted the invite bill page `NativePaymentOverlay` + its method-picker stack (`PayMethod`, `PAYMENT_METHOD_GROUPS`, `PayMethodIcon`, `PaymentMethodSheet`) **verbatim** into **`src/PaymentOverlay.tsx`** (pure relocation — invite behavior unchanged; `App.tsx` imports it now). `AppFlow.tsx` renders it at `paymentView==='checkout'`, replacing the old `PayUCheckout` spinner (deleted). **Open flow is now: details form → BILL PAGE → PayU.** Props drive single vs split (`paymentType` full→"Entry Ticket"/full price; split→advance), prefill name/phone/email, lock email when a Google email is present, pass `selectedCity`.
- **3b — `payu-callback` (edge fn — NEEDS DEPLOY).** Resolves `isOpenEvent` (`booking_url='payu-hosted'`) and **redirects open buyers to `/plans`** (not `/invite`) for pending/success/failure. **Stamps `recovered_at`** once, when a `cart_abandoned` lead first pays. (Early-abort error redirects — hash/amount mismatch — still go to `/invite`; acceptable.)
- **3c — Return screen (parameterized).** `PayUReturnScreen` in `App.tsx` got an **`isOpen` prop** (default `false` → invite unchanged). `returnPath = isOpen ? '/plans' : '/invite'`, used for Done + failed Try-Again; the retry-bill skips the invite-chat-restore for open. `App.tsx` renders `<PayUReturnScreen isOpen={routePath==='/plans'} .../>`. Reuses the invoice, **Download Receipt** (jsPDF), **Join WhatsApp Group**, retry-bill, and pending-poll.
- **Verified:** `/plans?payment_status=failed` renders the Payment-Failed screen (not the chat); Try Again routes back to `/plans`.

### #4 — Cart-abandonment (edge fn — NEEDS DEPLOY)
- **Where:** `supabase/functions/cart-abandonment/index.ts` (30-min cron).
- **What:** broadened the flag update from `.eq('status','invited')` to `.in('status',['invited','pending'])` so **open leads (`pending`) get `cart_abandoned`**.
- **For open events: flag + own WhatsApp.** After setting the flag, if the event is `payu-hosted` it fires the Meta-approved **`cart_abandon_open`** AiSensy template (distinct copy from the invite `cart_abandonment`) with params `{{1}}` name, `{{2}}` event name, `{{3}}` the date they chose (`applications.selected_date`, falling back to the event's first date; formatted `Monday, March 5th` like the invite invitation). Only marks the `bill_opens` row handled on a **successful send** (transient AiSensy failures retry next cron — matches the invite path). ⚠️ **NEEDS DEPLOY** (part of the held batch).
- **When `cart_abandoned` is set (open):** ALL of — (1) a `bill_opens` row exists (created when the bill page loads via `record_bill_open`), (2) ≥2h since `opened_at`, (3) **no `payu_payments` row** for that phone+event (never clicked Pay), (4) status still `pending`. Someone who clicked Pay and bailed on PayU has a `payu_payments` row ⇒ **not** cart-abandoned (a pending-payment state instead).

### #5 — Admin People tab (SHIPPED — committed `4022614`)
- **Where:** `src/AdminPanel.tsx`.
- Open events now appear in the People-tab **event filter** (slug list broadened to include `payu-hosted`).
- **`displayStatus`**: open `pending` → **"In Progress"** (or **"Cart Abandoned"** if flagged), distinguished from invite `pending` via an `openEventSlugs` set.
- **"Recovered" badge** (green) next to a paid lead's status when `recovered_at` is set — in all three People modes (call/approval/payments).
- Added **"In Progress"** and **"Recovered"** to the status filter dropdown + count chips; fixed the `pending` count to use `displayStatus`.
- **Approve button suppressed** for open events (they never need approval) — `app.status==='pending' && !openEventSlugs.has(...)`.
- **New-application admin push skipped for open events** (DB trigger `trg_admin_push_new_application` guarded — see §6) so you're not pinged on every pre-payment details entry.

### #6 — Customer booking-timeline copy (HELD, `AppFlow.tsx`)
- The "Your Booking Timeline" screen's fallback now branches on `isPayUFlow`:
  - **Single:** `Payment` (Now) → `Meeting Point Details`; **Event Date** = the yellow bottom card.
  - **Split:** `Advance` (Now) → `Remaining Balance` (by date) → `Meeting Point Details`; yellow card = Event Date.
- **"After Invitation" pill suppressed** for open (`&& !isPayUFlow`) — open pays immediately.
- **Empty-step filter** added: blank rows (no label & no value) never render as an empty numbered step (fixes a "4th blank step" from stale saves).

### #6b — Admin timeline editor for open events (built; **uncommitted** in `AdminPanel.tsx`)
- Open events now get a **fixed-row editor** like invite (via `isOpenApp` / `isFixedTimeline`): **single = 3 rows, split = 4 rows** (open drops the invite "vibe check" step).
- `openDefaultSteps`; the **last row carries `{application_count}`** so the customer render pulls it into the yellow Event-Date card (its count line is hidden for open); **first row = "Now" pill**; middle rows have **date inputs** (so admins set the **balance-due date** for split — which drives the balance WhatsApp + the marketer card); **no add/remove** (fixed).
- Invite/external editors unchanged.

### #7 — Calendar keys / per-date sold-out (HELD, `AppFlow.tsx`)
- Broadened the **counts loader** gate to `isNativeApplicationFlow || bookingUrl==='payu-hosted'` so `dateCounts`/`reserved` load for open.
- Broadened the **calendar gate** `isNative` → `capEligible` (native OR payu-hosted) so `cap = totalCapacity` for open.
- Result: open events behave **exactly like invite** — a date **auto-flips to SOLD OUT** when its paid bookings (`advance_paid`/`fully_paid`, via RPC) reach capacity; earliest ≥50% date shows amber **"Only X left"**; others green; legend keys follow. Manual sold-out (admin-set date status) still works.
- **Verified:** RPC returns per-date reserved for the open event (capacity present).

### Finances / Performance tab (DB RPC — APPLIED to prod)
- **Already correct for open events:** `get_performance_summary()` has **no `booking_url` filter**, and commission is **per-application** (`COALESCE(marketer.commission_amount, 0)` via `assigned_marketer_id`) ⇒ **₹0 for open** (no marketer). Split projects full profit once the advance is paid ("committed income"); single counts on `fully_paid`.
- **Fixed per-date balance-month bucketing** (migration `perf_summary_per_date_balance_month`): each ticket's committed profit now lands in the month of **its own `selected_date`'s** balance-due date (per-date `event_dates.booking_steps` `{balance}`), falling back to event-level then current month. Previously a multi-date split event collapsed all dates into one (event-level) month.
- **Model:** committed-profit (whole ticket profit in the balance month), **not** cash-flow (advance-month/balance-month split) — confirmed as the desired model.
- **Verified:** 4-ticket throwaway test (all combos of open/invite × single/split) → split Aug-date→Aug, Sep-date→Sep (separate months), singles→current month, commission ₹0/₹50 correct. Test data deleted.

---

## 5. Data model & domain facts (open-specific)

- `applications` unique key: `(event_slug, phone)`; phones stored as **last-10-digits**.
- `applications` `NOT NULL` + no-default cols: `event_slug, name, phone, gender, why_join` → open inserts send empty `gender`/`why_join`.
- `applications.recovered_at` (`timestamptz`, nullable) — added by migration; set once by `payu-callback` on the recovering payment.
- `applications.cart_abandoned` (bool) — set by the cart-abandonment cron.
- Per-date timelines: `event_dates.booking_steps` (JSONB). Canonical invite order (5): vibe-check, advance, balance, meeting-spot, social-proof. **Open order** drops vibe-check: single (3) = payment, meeting-spot, social-proof; split (4) = advance, balance, meeting-spot, social-proof. The **`{balance}` step's date = the balance-due date** (used by WhatsApp, the marketer card, and the finances forecast). The `{application_count}` last row → the yellow Event-Date card.
- Capacity: `events.total_capacity` (open event confirmed to carry it) — per-date, drives sold-out.
- RLS: anon cannot SELECT `applications`/`payu_payments` — reads go through `get-user-context` or the `event_booking_counts(_by_date)` RPCs.

---

## 6. Deploy state ⚠️ READ BEFORE GOING LIVE

**Nothing open-event-facing is live yet** (the frontend batch is uncommitted and two edge functions are undeployed). Current split:

### Already SHIPPED (committed + pushed to `main`)
- `4022614` — **#5 People tab** + a critical bug fix (per-date `booking_steps` wipe on event save).
- Earlier isolated `AdminPanel.tsx`/`App.tsx` fixes and marketer cards (`fb24a99`, `f4cdbef`, `d05108d`, `71d8034`).

### DB migrations APPLIED to prod (live now, admin-only impact) — ⚠️ applied via MCP, **not** in `supabase/migrations/`
- `add_recovered_at_to_applications` — adds `applications.recovered_at`.
- `skip_new_application_push_for_open_events` — guards `trg_admin_push_new_application` to skip `payu-hosted` events.
- `perf_summary_per_date_balance_month` — the per-date finances bucketing fix.
- **Action:** these exist in Supabase's remote migration history but **not as local files** — capture them into `supabase/migrations/` (or re-declare) so the repo is the source of truth.

### HELD — uncommitted working tree (ships together as the open-event batch)
- `src/App.tsx` — #3a (`NativePaymentOverlay` import + inline removal), #3c (`isOpen`).
- `src/AppFlow.tsx` — #1, #2 (`selected_city`), #3a (bill render), #6 (timeline copy + empty filter), #7 (calendar keys).
- `src/PaymentOverlay.tsx` — **new** shared module (#3a).
- `src/AdminPanel.tsx` — **#6b** (admin timeline editor) is currently uncommitted here too; it's isolated/shippable independently.
- `supabase/functions/payu-callback/` — **#3b (NEEDS DEPLOY)**.
- `supabase/functions/cart-abandonment/` — **#4 (NEEDS DEPLOY)**.

> Unrelated: the `20260704_affiliates_*.sql` migrations in the working tree are the **planned affiliate-links** feature, not open events.

---

## 7. Go-live checklist

1. **Commit + push the held frontend batch** (`App.tsx`, `AppFlow.tsx`, `PaymentOverlay.tsx`, and `AdminPanel.tsx` #6b). `npx tsc --noEmit` must pass.
2. **Deploy the THREE edge functions together**: `payu-callback` (#3b), `payu-webhook`, and `cart-abandonment` (#4). *(Confirm `add_recovered_at_to_applications` is already applied — it is — before deploying, or the success update errors.)* `payu-webhook` was brought into lockstep with the callback (2026-07-04): same `single_payment_sucessful` campaign name (they race via `claimSendFlag` — a name mismatch makes full-paid delivery a coin flip), same label-based `pickMeetingSpotStep` (the fixed `[3]` index picked the wrong/blank date step), and the same `recovered_at` stamp (the webhook can be the only path that runs when the buyer closes the tab on PayU).
   Also confirm in AiSensy that campaigns `single_payment_sucessful` (note the spelling) and `cart_abandon_open` exist and are live.
3. **Configure an open event** in admin: set `booking_url='payu-hosted'`, `payment_mode` (full/split), `total_capacity`, price(s), dates, and each date's **timeline** (esp. the **balance-due date** for split, via the #6b editor).
4. **Run `/check-event <name>`** — verify per-date timelines, sane balance dates, spots, no orphaned payments, no stray marketer mappings.
5. **Set the event `is_active=true`** so it shows on `/plans`.
6. **(Optional) Decide open cart-abandonment messaging** (§9) before relying on it — the flag is set but no message is sent yet.

---

## 8. Verification done this build
- `tsc --noEmit` clean after every change.
- DB simulations: #1 insert/ignore/slot-count; #3b `recovered_at` set-once + null-for-normal; #4 open-pending flagged / paid untouched; #7 RPC per-date counts; finances 4-type forecast test (then cleaned up).
- Preview: `/plans` and `/admin` boot clean; open return routing (`/plans?payment_status=...`) verified.
- **Not preview-drivable** (documented): the full bill page (needs Google OAuth + live PayU) and admin/marketer views (login-gated); the open calendar/timeline (no *active* open event — `/plans` lists `is_active` only). These were verified via tsc + DB + code trace.

---

## 9. Known follow-ups & caveats
- **Open cart-abandonment message — BUILT** (uncommitted, NEEDS DEPLOY). Sends the `cart_abandon_open` template (§4 #4). Note: one template for both single and split (no per-mode copy split yet) — if you later want distinct wording ("complete your payment" vs "settle your advance"), branch on `events.payment_mode` and add a second template.
- **Finances helper copy** still reads "− ₹50 commission" (flat); the real math is per-marketer/₹0. Cosmetic `AdminPanel.tsx` reword pending.
- **`get-user-context` PII note** (from the security audit, not open-specific): returns a phone's applications incl. **email** with no ownership proof — consider dropping `email` / adding an OTP gate.
- **Copied open events inherit `event_marketers`** — remove stray mappings if you don't want a marketer on a given open event.
- **Multi-date forecast bucketing** uses per-date balance dates now (fixed) — but ensure each split date's timeline actually has its `{balance}` date set, else it falls back to event-level then current month.
- **Migrations applied via MCP** aren't in the repo folder (see §6) — reconcile.

---

## 10. Quick reference — key files & identifiers
| Concern | File | Identifier |
|---|---|---|
| Open booking → application | `src/AppFlow.tsx` | `handleProceedToPhonePe`, `isPayUFlow` |
| Order pricing/city | `src/AppFlow.tsx` / `create-payu-order` | `selectedCity`, `event_net_price` |
| Bill page (shared) | `src/PaymentOverlay.tsx` | `NativePaymentOverlay` |
| Callback redirect + recovered_at | `supabase/functions/payu-callback/index.ts` | `isOpenEvent`, `recovered_at` |
| Return screen | `src/App.tsx` | `PayUReturnScreen`, `isOpen` |
| Cart-abandonment | `supabase/functions/cart-abandonment/index.ts` | `payu-hosted` skip branch |
| People tab statuses | `src/AdminPanel.tsx` | `openEventSlugs`, `displayStatus`, `recoveredBadge` |
| Timeline copy (customer) | `src/AppFlow.tsx` | `isPayUFlow` fallback, `isAfterInviteRow` |
| Timeline editor (admin) | `src/AdminPanel.tsx` | `isOpenApp`, `isFixedTimeline`, `openDefaultSteps` |
| Calendar keys | `src/AppFlow.tsx` | counts loader gate, `capEligible` |
| Finances forecast | RPC `get_performance_summary` | `ev_committed`, `ev_bucketed` |
