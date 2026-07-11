# Dynamic Pricing (Spots-Based Price Ladder) — Blueprint

**Status: PROPOSAL ONLY — nothing built. No code or DB has been changed.**
*Written 2026-07-07 after reading the live pricing code. Companion to
`experiments-and-ab-testing-proposal.md` (measurement must ship first) and
`agentic-systems-proposal.md`. Line numbers were accurate on 2026-07-07 — anchor on
function names, not lines.*

---

## 0. The idea in one paragraph

Each event date gets a **price ladder**: the price starts at a base (e.g. ₹299) and
steps up as real spots sell (e.g. +₹50 after 40% sold, +₹100 after 80% sold). The buyer
sees **one clean price and the true spots-left badge — never the ladder, never a
sold-out cheaper tier** (no "damn, I missed early bird" regret). The price is the same
for everyone at any given moment, never personalized, never driven by traffic/viewers,
and **never goes down for a date** once it has stepped up. Each buyer's price is
**locked at booking** and stored on their row, so later price rises can't touch their
balance. The public story is one honest sentence: *"prices rise as spots fill — book
early."* The strategic win is as much about **pulling bookings earlier** (earlier
advances, earlier certainty a date will fill) as about the extra margin.

### Decisions already made (from the founder discussion, 2026-07-07)

| Decision | Choice | Why |
|---|---|---|
| Show the tiers? | **No.** One price + real spots-left only. | Sold-out cheaper tiers create reference prices + regret → "I'll join next time". |
| Demand/traffic input? | **No.** Spots sold is the only signal. | At our traffic (tens of sessions/week) viewer counts are noise and gameable; unexplainable prices feel rigged. |
| Personalized prices? | **Never.** Same price for everyone at the same moment. | Attendees meet each other and WILL compare. Must survive the group-chat test. |
| Price direction | **Ratchet: up only, per date.** Cancellations don't lower it. | Nobody who paid ₹399 should later see ₹349. |
| Buyer's price | **Locked at application, stored on the row.** | Balance, commissions, recovery emails all need "what THIS person owes", immune to later steps. |
| Tell people the mechanism? | **State the rule, never the numbers** ("prices rise as spots fill"). A/B-testable copy toggle. | Forward urgency without a backward reference price. |
| Honesty line | Spots-left and price are always REAL. | India's CCPA dark-pattern guidelines ban *false* urgency; real scarcity is fine. |

---

## 1. Current state of the pricing code (as-read, 2026-07-07)

### 1.1 Where prices live

- `events.price_full` / `events.price_advance` — plan-level prices, mapped in
  `src/supabase.ts` (~lines 84–87) to `priceFull`/`advanceAmount`.
- **Per-city overrides**: `events.city_details` JSONB `{ [city]: { price_advance,
  price_full } }`, resolved server-side by `cityPrices()` in
  `supabase/functions/create-payu-order/index.ts` (~lines 43–57). City is validated
  against `events.cities`, with fallback to `applications.selected_city` (~lines 266–283).
- **No per-date prices exist today.** Capacity IS per-date: `events.total_capacity`
  applies to **each date independently** (recurring events, see `AppFlow.tsx` ~964–996),
  `events.invite_spots` for invite events; "reserved" = `advance_paid` + `fully_paid`
  via the anon-safe `event_booking_counts(_by_date)` RPCs (`src/supabase.ts` ~200–230).
- `payu_payments.amount` records what each transaction actually charged (incl. the
  PayU method fee added on top, `FEE_RATES` ~lines 89–107).

### 1.2 The critical gap: no price is stored per person

`create-payu-order` recomputes every amount from the events row **at payment time**:

- Advance: current `price_advance` (~line 331).
- **Balance: current `price_full − price_advance` (~lines 312–328).** So if the event
  price rises after someone pays their advance, **their balance silently rises too**.
  This is latent today (prices only change if the admin edits them manually) but a
  ladder makes rising prices routine → **price locking is a hard prerequisite, not a
  nice-to-have.**
- Retry-bill and the cart-abandonment recovery flows funnel into the same function, so
  fixing it in one place fixes every path.

### 1.3 Dormant tier infrastructure (supersede, don't extend)

`events.ticket_types` (`Array<{id,label,price,advance}>`) exists and is typed in
`AdminPanel.tsx:103`, `AppFlow.tsx:122`, `supabase.ts:138` — **but is never rendered or
used in any price computation.** It's the boring "Early bird / Regular / Last Call"
model this proposal deliberately rejects. Leave the column; the ladder ignores it. (A
future cleanup can drop it.)

### 1.4 Honesty audit note (flagging, not judging)

The spots-left badge is real today (`capacity − reserved`) and must stay real — it's
the transactional urgency signal and the legal line. Separately, the "X people joined"
social-proof figure is **inflated**: `displayed = capacity × 3 + registered`
(`AppFlow.tsx` ~996 and ~2390–2409). That's the founder's call to keep or revisit, but
be aware India's dark-pattern guidelines also cover false social proof — and under a
"book early, prices rise" regime, *real* momentum numbers become genuinely persuasive
on their own.

---

## 2. The design

### 2.1 Ladder definition — `events.price_ladder` (JSONB, nullable = feature off)

```json
{
  "enabled": true,
  "steps": [
    { "sold_fraction": 0.0, "add": 0   },
    { "sold_fraction": 0.4, "add": 50  },
    { "sold_fraction": 0.8, "add": 100 }
  ],
  "show_mechanism_copy": true
}
```

- `add` is an **absolute ₹ amount added to `price_full`** — composes cleanly with
  per-city overrides (Pondy base + ₹50 and Chennai base + ₹50, same step). Base price
  is the floor; `add` is never negative.
- **`price_advance` stays flat.** Only the full price climbs; the climb lands in the
  balance. Rationale: the advance is the commitment device — keeping entry friction
  constant protects conversion, while the ladder still pays. (Single-payment events
  charge the laddered full price in one shot, so they feel the ladder immediately.)
- Steps are per-EVENT config but evaluated per-DATE (each date has its own capacity
  and its own sold fraction) — a nearly-full Saturday genuinely costs more than a
  fresh Sunday. That's honest and self-explanatory.

### 2.2 Ratchet — `event_dates.price_step_reached` (int, default 0)

The current step for a date = `max(step from live sold-fraction, price_step_reached)`.
Whenever the live computation reaches a higher step, the server bumps the column.
Cancellations/refunds can lower the sold fraction but never the column → **price never
goes down for a date.**

### 2.3 Locking — two columns on `applications`

`locked_price_full` and `locked_price_advance` (numeric, nullable), stamped **when the
application row is created** (the moment they commit, at the price they saw). Honored
until the event date. `create-payu-order` order of trust becomes:

1. `applications.locked_price_*` if present →
2. else compute: city base (existing `cityPrices()`) + ladder step for their
   `selected_date` → and stamp the lock at that moment.

Balance becomes `locked_price_full − locked_price_advance` — **immune to later steps
and also to manual admin price edits** (fixes the latent §1.2 issue as a side effect).
Invite-flow note: apply → approval can take days; locking at apply time is the
generous, defensible rule ("the price you saw when you applied"). Old rows with NULL
locks fall back to current behavior — zero migration risk.

### 2.4 What the buyer sees (client changes)

- The price shown in `/plans` and the bill page = base + current step for the selected
  date. Cheapest delivery: **extend the `event_booking_counts_by_date` RPC to also
  return `current_price_full` per date** (server-computed WITH the ratchet — the client
  must not compute it from live counts, or a cancellation would briefly show a lower
  price than the ratchet allows). Anon-safe: it returns prices and counts, no PII.
- Before a date is picked, show the **cheapest available date's** price ("from ₹299" is
  acceptable pre-selection; the exact price appears the moment a date is chosen).
- Optional one-liner near the price when `show_mechanism_copy` is on:
  *"Prices increase as spots fill."* Rule + no numbers. This is an A/B candidate.
- **Never render**: tier names, past prices, strikethroughs, "you missed" anything.

### 2.5 Server authority (unchanged philosophy)

`create-payu-order` stays the single source of truth — displayed price can never be
tampered with, exactly like today. The PayU method-fee logic (§1.1) applies on top of
the laddered amount unchanged.

---

## 3. Edge cases (the whole point of this document)

1. **Advance-paid guest, price rises** → balance uses their locked price. Without the
   lock this is a silent overcharge; with it, a non-event. *(Prerequisite, §2.3.)*
2. **Cart abandoner comes back** → their application row already carries the lock, and
   retry-bill flows through `create-payu-order` → honored automatically. **Upgrade the
   recovery message** (cart-abandonment fn + AiSensy/Brevo templates): *"Your spot is
   still held at ₹299 — the price for new bookings is now ₹349."* Only when a step has
   actually happened; template var from comparing lock vs current. This turns each
   price step into a free, honest recovery hook.
3. **Lock expiry** — a lock held forever lets someone camp on a cheap price. V1: honor
   until the event date (simple, generous, low real-world cost at current volumes).
   If camping shows up in data, add `locked_at` + N-day expiry with a re-lock at
   current price. Do not build expiry speculatively.
4. **Cancellation/refund reopens a spot** → sold fraction drops, `price_step_reached`
   doesn't → price holds. The reopened spot sells at the ratcheted price.
5. **Waitlist promotion** → honor the price at the time they *joined* the waitlist
   (stamp the lock when the waitlist row is created). Asking a waitlisted person to pay
   more than when they queued is the group-chat screenshot scenario.
6. **Date change by the guest** → new date = new price context. Re-lock at the target
   date's current price, telling them before they confirm. (Also see the existing
   date-rename stranding issue in the invite-calendar memory — same family of problem.)
7. **Admin edits base price mid-sale** → locked rows unaffected (§2.3). New bookings
   use new base + current step. Admin UI must warn that lowering base below a ratcheted
   displayed price won't lower the displayed price.
8. **City overrides** → `add` composes onto whichever base `cityPrices()` picks; one
   ladder per event, evaluated after city resolution. No per-city ladders in v1.
9. **Commissions & affiliates** → marketer commission (accrues at `fully_paid`) and the
   planned 8% creator cut must compute on the **locked/actually-paid** price
   (`payu_payments.amount` minus the method fee, or the locked columns), never the
   current display price. The affiliate build (not yet started) should read locked
   columns from day one.
10. **Invite vs open flow** — see rollout §5: v1 is open events only.
11. **`payment_mode='full'` events** — simplest case: one payment of the laddered full
    price; the lock only needs to survive the minutes between form-submit and payment.
12. **Free/₹0 or unconfigured prices** — ladder only activates when `enabled` and
    `price_full > 0`; all existing guard errors in `create-payu-order` stay.
13. **Analytics** — log the displayed price step into `flow_analytics` at the
    reached-pricing event so conversion can later be split *per step* (did ₹349 convert
    worse than ₹299? that's the whole experiment).

---

## 4. Admin panel needs (so the founder runs this without code)

In the event editor (`AdminPanel.tsx`):

- **Ladder card**: enable toggle · base price (existing field, relabeled "base/floor")
  · up to ~4 steps as "after __% sold → +₹__" rows · mechanism-copy toggle.
- **Live preview line**: "Right now Sat Jul 18 is 12/30 sold → showing ₹349."
- **Per-date step indicator** on the event card (tiny "step 2/3" chip), so the founder
  sees where each date sits at a glance.
- **Guardrails in the UI**: `add` ≥ 0 (base is the floor, per the founder's rule);
  warning when editing base under a ratcheted date; steps must be increasing.
- Later (not v1): a "pricing" panel showing revenue-per-date vs pre-ladder comparable
  events — this belongs in the Experiments tab once Layer 2 snapshots exist.

---

## 5. Rollout — three stages, smallest risk first

**Stage 0 — prerequisites (do these regardless of pricing):**
Experiments proposal Layers 1–2 (release log + daily snapshots — the Sept purge
deadline applies) and the two locked-price columns + lock-stamping (§2.3), which fixes
the latent balance-recompute exposure on its own.

**Stage 1 — pilot: ONE open event with `payment_mode='full'`.**
Single payment at the laddered price = no balance math, minimal locking surface, no
invite-approval time gap. Touches: `price_ladder` column + step function (SQL),
`create-payu-order` (~30 lines), the RPC extension, the price display in `AppFlow.tsx`,
admin ladder card. Watch for 2–3 events: conversion at the pricing step per ladder
step, revenue per date, booking lead time (are bookings shifting earlier?), and any
price complaints in doubts. **Small-sample honesty: at current volumes one event won't
prove anything — compare a few events against release-marked history and expect
±10-point noise.**

**Stage 2 — split-payment open events.** Locked balance path live end-to-end +
recovery-message upgrade (edge case #2).

**Stage 3 — invite events, only if wanted.** Invite events are curated and
relationship-heavy; scarcity pricing may not even fit their story. Decide with Stage
1–2 data in hand.

**Build size (honest):** Stage 0 locking ≈ half a day. Stage 1 ≈ 2–3 focused sessions
(schema + edge function + RPC + UI + admin card + tsc/SQL verification). Stage 2 ≈ 1
session. Every DB step follows the golden rules: test rows with `90000000xx` phones,
`RETURNING` on writes, no touching `advance_paid`/`fully_paid` rows, owner deploys edge
functions.

---

## 6. Where this sits in the overall roadmap

After Experiments Layers 1–2 (#1 in `agentic-systems-proposal.md` §5 — hard
prerequisite: an unmeasured pricing change is a vibe with revenue attached) and around
the Daily Manager (#2, independent). It naturally feeds both: the Daily Manager gets a
"date reached price step 3" win alert; the doubt bot (ai-chatbot.md) gets a knowledge
entry explaining the pricing rule in brand voice when guests ask why the price changed.

## 7. What to say when ready

- *"Build Stage 0 of the dynamic-pricing proposal"* → locked-price columns + stamping
  (safe, ships alone, fixes the balance-recompute exposure).
- *"Build the Stage 1 pricing pilot on event X"* → the full ladder on one
  single-payment open event.
