# Multi-Ticket Open Events — Build Handoff

**Written 2026-08-29.** Self-contained: a fresh session can pick this up with no other context.
Supersedes the scope in `multi-ticket-open-events-proposal.md` (19 Jul) — that doc's *design* still
holds, but its scope was much wider. The decisions below are the founder's, taken 2026-08-29, and win.

**Status (2026-08-31): DATABASE LIVE + ALL FIVE EDGE FUNCTIONS DEPLOYED.
Client code NOT pushed to git. No real multi-ticket payment tested yet.**

Deployed 2026-08-31, all with `--no-verify-jwt`, all confirmed still `verify_jwt: false`:
`create-payu-order` v43→44 · `payu-callback` v56→57 · `payu-webhook` v51→52 ·
`verify-pending-payments` v24→25 · `get-user-context` v13→14.

Pre-deploy safety audit (all passed): deployed source pulled and diffed — 204
insertions, 17 deletions, and every one of those 17 is a line replaced by a
superset (a `.select()` gaining a column, an amount gaining `x qty`, an
`.update()` gaining a field). Gating logic extracted and run against all five
event shapes with hostile inputs — every non-pay-at-venue event forces exactly
1 ticket. The new CHECK constraints were simulated against legacy advance,
legacy balance and a 3-booked/2-attended group; no update failed.

Post-deploy smoke test on the live function: 4 tickets against a 3-spot date
returned `not enough spots left for that many tickets, spots_left: 3`; 2 tickets
returned `can_checkout: true`. `_shared/metaCapi.ts` was NOT edited, so
`capi-lead` (the one importer not redeployed) is not stale.

| Phase | State |
|---|---|
| 1. Database (columns + capacity RPCs) | ✅ **applied to prod**, verified a no-op on existing data |
| 7. Commissions + finances | ✅ **applied to prod**, verified a no-op on existing data |
| 2. `create-payu-order` | ✅ **deployed 2026-08-31** |
| 3. Payment finishers (×3) | ✅ **deployed 2026-08-31** |
| `get-user-context` | ✅ **deployed 2026-08-31** |
| 4-6. Client | ✅ written, `npx tsc --noEmit` clean — not pushed |

**The five edge functions must be deployed before localhost can take a real
multi-ticket payment**, and every one of them needs `--no-verify-jwt`:
`create-payu-order`, `payu-callback`, `payu-webhook`, `verify-pending-payments`,
`get-user-context`.

### Deviations from the plan above, decided during the build

1. **`ticketCountPatch` always stamps both counts, including 1.** The original
   "skip the write when quantity is 1" looked free but was a live bug: a lead who
   first picked 3 seats and abandoned leaves a stale `ticket_count` on their
   pending row, so paying for one seat later has to actively correct it.
2. **`refresh_open_application` gained a defaulted `p_ticket_count`** for the same
   reason — a returning lead keeps their existing row, so a changed seat count has
   to be pushed through that RPC. Dropped and recreated (not `CREATE OR REPLACE`)
   so the old six-argument signature doesn't linger as an ambiguous overload; the
   currently-deployed client keeps working via the default.
3. **The capacity gate runs BEFORE the `check_only` return**, so the details form
   learns a date is too full while the customer is still on it rather than after
   sitting through an OTP. The chosen date comes from the request on that
   preflight (no booking row exists yet) and from the row on a real order.
4. **The gate reads `events.total_capacity`, not `invite_spots`** — that is the
   column the customer's own calendar divides against, and the two must agree.
   `invite_spots` is kept as a fallback.
5. **The failed-payment retry bill divides by `payu_payments.quantity`.**
   `priceAdvance` is now a per-ticket figure that the bill multiplies back up, so
   without this a retried group buy would have been billed N × N.
6. **`get_performance_summary` needed more than commissions.** It recomputes
   revenue from per-ticket net prices, and counted `COUNT(DISTINCT phone)` as
   tickets — both would have under-reported group buys. Committed profit now
   also honours `attended_count`, so a pay-at-venue no-show reduces the forecast
   instead of inflating it. Verified identical to the old output on all five
   events with real payments.
7. **`creator_stats` / `creator_stats_since` / `affiliate_leaderboard`** all
   counted `affiliate_sales` rows as tickets and would have under-reported a
   creator's group sale. Fixed alongside the 8% change.

### Still open

- **Not deployed, not pushed, and not tested against a real payment.** The test
  script in §10 has not been run.
- **Onboarding replicas not refreshed.** `CLAUDE.md` asks that
  `src/CreatorOnboardingDemos.tsx`, `src/remotion/`, `src/TeamOnboarding*.tsx` and
  the journey-map seeds be refreshed whenever a live surface changes. The open
  details form gained a ticket stepper and the balance bill gained a headcount
  picker, so those replicas are now behind. Deliberately left out of this build to
  keep the payment change isolated.
- The atomic capacity reservation (§11 risk 3) is still Phase 2.

---

## 1. The one-sentence version

One WhatsApp number can buy up to 5 tickets on a **pay-at-venue open event**, recorded as a
single booking row with a ticket count — and at the venue they settle the balance only for the
people who actually turned up.

---

## 2. Scope boundary (read this before writing a line)

Multi-ticket appears **only** on events matching all three:

```sql
booking_url = 'payu-hosted'   -- open event
AND payment_mode = 'split'    -- advance + balance
AND pay_at_venue = true
```

Every other event keeps today's exact behaviour — one ticket per phone, no stepper, no changes.
That deliberately excludes:

| Shape | Multi-ticket? | Why |
|---|---|---|
| Open + split + pay-at-venue | **Yes** | The whole point. Founders Meet, Chill-pill. |
| Open + split, balance online days early | No | Founder's call. Nobody knows attendance days ahead, so the "pay for who shows" logic is meaningless there. |
| Open + single full payment (Kovalam-style) | No | Founder's call. Would have been the easiest case; deliberately left out. |
| Invite-only (`native-application`) | No | Invite is 1:1 by design — the whole flow is a personal approval. |

Active events on prod as of 2026-08-29 (both already the right shape):

| Slug | Title | Prices (Chennai) | Notes |
|---|---|---|---|
| `founders-meet` | Founders Meet | ₹100 adv / ₹299 full | 33 apps, 28 paid. Sold out; founder is not taking more payments. |
| `sunrise-at-kovalam-copy-1777660218667` | Chill-pill in Himalayas | **₹1 adv / ₹2 full** | The test event. Use this for every real-money test. |

---

## 3. Decisions locked 2026-08-29

Do **not** relitigate these. Each was asked and answered explicitly.

| # | Decision | Answer |
|---|---|---|
| 1 | How is N represented? | **Quantity on the existing row.** One `applications` row with `ticket_count`. Never one row per ticket — the whole system keys on the `(event_slug, phone)` unique constraint. |
| 2 | Who joins the WhatsApp group? | **Buyer only.** Friends' numbers are never collected. Sending templated WhatsApp to unverified, non-consenting numbers is an AiSensy/Meta compliance risk. |
| 3 | Advance amount | `price_advance × N`, charged in one payment. |
| 4 | Balance at the venue | **Only for who shows up.** `(full − advance) × headcount_present`. |
| 5 | Who sets the headcount? | **The guest, on their own phone, with the host watching.** Founder accepted the leak risk in exchange for zero admin build. See §11 Risk 1. |
| 6 | No-show's advance | **Forfeited.** The advance is a non-refundable deposit that held a seat. Must be stated plainly on the bill. |
| 7 | Max tickets | **5, hard-coded.** No per-event column for now. |
| 8 | Guest names | **Collect nothing.** No extra form field. |
| 9 | Marketer + manager commission | **Flat, one per booking** regardless of N. → *no code change needed*, see §9. |
| 10 | Creator affiliate 8% | **8% of everything paid** — i.e. × N. → *this DOES need a code change*, see §9. |
| 11 | Re-entry after paying | **Stays blocked.** No self-serve add-ons. Message becomes "You've already booked N tickets". |
| 12 | Normal split events | Excluded entirely (see §2). |
| 13 | Single-payment open events | Excluded entirely (see §2). |

### Assumed, not explicitly confirmed — flag to the founder if any is wrong

- All N tickets share **one date, one city, one pickup point**. Friends can't split across pickups.
- Spots-left / "N going" counts **tickets**, not bookings.
- The admin People row shows the count visibly (e.g. `×3`).
- **No group discount** in v1 — every ticket is the same price shown at checkout.

---

## 4. Data model

Three new columns. All additive, all defaulted, invisible to existing code until something reads them.

| Table | Column | Type | Meaning |
|---|---|---|---|
| `applications` | `ticket_count` | `int not null default 1`, CHECK 1–5 | How many tickets this booking is for. |
| `applications` | `attended_count` | `int null`, CHECK 1–`ticket_count` | How many actually showed up. NULL until the venue balance is paid. |
| `payu_payments` | `quantity` | `int not null default 1` | How many tickets **this payment** covers. |

The `quantity` column carries a different meaning per payment type, and that is deliberate:

- **advance payment row** → `quantity` = tickets booked → copied to `applications.ticket_count`
- **balance payment row** → `quantity` = headcount present → copied to `applications.attended_count`

So `booked 3, paid for 2` is fully reconstructable from the payments table alone, which matters
because `applications` overwrites its own history (see the `applications-mutable-state-no-history`
memory).

The CHECK constraint on `ticket_count` is **load-bearing, not cosmetic**: anon can self-INSERT a
`pending` applications row (`applications_anon_insert` policy), so without the constraint someone
could insert `ticket_count = 9999` and corrupt the "N people joined" counter on the live page.

---

## 5. Phase 1 — Database

**File:** `supabase/migrations/20260829_multi_ticket_open_events.sql`

1. Add the three columns above with their CHECK constraints.
2. Rewrite `event_booking_counts(p_slug)` — change `count(a.*)` to `sum(a.ticket_count)` for both
   `registered` and `reserved`. Keep the `coalesce(..., 0)::int` wrapper: `sum()` returns NULL on
   an empty set where `count()` returned 0, and the client does arithmetic on these.
3. Same change in `event_booking_counts_by_date(p_slug)`.
4. Leave the grants exactly as they are (`anon, authenticated`).

Dump the **live** definitions first and edit those, not the ones in the migrations folder — this repo
has a documented history of live RPCs drifting ahead of committed migrations (see the
`analytics-summary-rpc-drift` memory). The two counting RPCs were verified in sync on 2026-08-29.

**Verify:** on the test event, `select * from event_booking_counts('sunrise-at-kovalam-copy-1777660218667')`
must return the same numbers as before the migration (every existing row has `ticket_count = 1`).

---

## 6. Phase 2 — `create-payu-order` (the money-critical one)

**File:** `supabase/functions/create-payu-order/index.ts`

This function is the only place allowed to decide an amount. The client never sends a price and
must never be trusted for one. Everything below preserves that.

### 6.1 Accept and clamp the quantity

Read `ticket_count` from the request body. Then clamp, in this order:

```
if (!isMultiTicketEvent(event)) qty = 1        // booking_url + payment_mode + pay_at_venue
qty = clamp(floor(Number(qty) || 1), 1, 5)
```

`isMultiTicketEvent` is the §2 predicate. A client sending `ticket_count: 4` to a
non-pay-at-venue event silently gets 1 — no error, no leak.

### 6.2 Advance path

Currently at the `else` branch (`// Advance payment (city-aware)`), `amountNum = adv`.
Becomes `amountNum = adv * qty`.

Leave the PayU fee logic alone — it already computes `base + base × rate`, so passing the
multiplied base needs no formula change.

### 6.3 Balance path — the venue headcount

Currently:

```ts
amountNum = full - adv;
```

Becomes `(full - adv) * attending`, where `attending` is read from the request and clamped to
`1 .. app.ticket_count` **from the database row**, never from the client's claim about how many
they booked. Select `ticket_count` in the existing application lookup (it already fetches
`id, status` — add the column).

If `attending` is absent, default it to `app.ticket_count` (i.e. everyone came). A stale bill page
from before this ships therefore bills the full amount — the safe direction to fail.

### 6.4 Store the quantity

The `payu_payments` insert (§ "6. Insert pending payu_payments row") gains `quantity: qty` for
advance/full, or `quantity: attending` for balance.

### 6.5 Make the 409 useful

The existing "already paid for this open event" guard selects only `id`. Add `ticket_count` and
return it in the error body so the client can say "You've already booked 3 tickets" instead of the
generic message. **Do not weaken this guard** — it is what stops double-charging.

### 6.6 Capacity gate (recommended, not strictly required)

Before creating an order, check that `qty` still fits in the spots left on the chosen date, using
the updated by-date RPC. This is a best-effort check, not atomic — two simultaneous buyers can
still oversell by a few. That's acceptable and ops-resolvable; the atomic version is Phase 2 work
(the same `FOR UPDATE` pattern used to harden OTP verify).

---

## 7. Phase 3 — Payment finishers

Three functions all reach the same "payment succeeded" logic and **all three must be changed
together**, because any one of them can be the one that lands first:

- `supabase/functions/payu-callback/index.ts` (the browser redirect)
- `supabase/functions/payu-webhook/index.ts` (PayU's server-to-server call)
- `supabase/functions/verify-pending-payments/index.ts` (the reconciliation cron)

In each, where the stored payment is read and the application status is flipped
(`newStatus = 'fully_paid' | 'advance_paid'`), also select `quantity` from the payment row and:

- **advance / full success** → set `applications.ticket_count = quantity`
- **balance success** → set `applications.attended_count = quantity`

Write these in the **same `update()`** that sets the status. A separate update risks the status
landing and the count not, and PayU is known to deliver duplicate success notifications for a
single capture (see the `payu-duplicate-result-delivery` memory) — the existing replay-safety
guards must keep protecting both fields as one unit.

⚠️ **`supabase/functions/_shared/*` is bundled at deploy time.** If any shared helper is touched,
every importer must be redeployed or the change is silently not live. This has already caused two
Meta reporting gaps — see the `edge-function-shared-module-drift` memory.

---

## 8. Phase 4-6 — Client

### Phase 4: the booking flow — `src/AppFlow.tsx`

- **Ticket stepper** on the details form, rendered only when the §2 predicate holds. Range 1–5,
  additionally capped by spots left on the chosen date (`dateCounts` is already loaded).
  Copy under it: *"All tickets are under your number — you'll get one group-chat invite and share
  the details with your friends."*
- Pass `ticket_count` in the `create-payu-order` body from `handleProceedToPhonePe`
  (~line 1932) and in the `check_only` preflight in `checkOpenBookingEligibility` (~line 1808).
- Write `ticket_count` on the client-side `pending` applications insert (~line 2001) so abandoned
  multi-ticket carts show real intent in the admin panel.
- **"Spot Already Reserved!" sheet** (~line 3294) — use the count returned by the 409 to say
  "You've already booked 3 tickets for this event." Add a WhatsApp button so add-on requests
  reach you manually (there is no self-serve add-on by decision #11).

### Phase 5: the venue balance headcount — `src/App.tsx` + `src/PaymentOverlay.tsx`

This is the genuinely new screen. An advance-paid pay-at-venue guest lands on the invite chat
(`fetchNativeEventData`, ~line 1252) and taps Pay Balance.

- If `ticket_count > 1`, the balance bill shows **"How many of you are here?"** — a stepper from
  1 to `ticket_count`, defaulting to `ticket_count`.
- The amount updates live: `(full − advance) × headcount`.
- Below it, plainly: *"The advance for anyone who didn't come isn't refunded."* Decision #6 is
  only defensible if it is said before they pay, not after.
- Send the chosen headcount to `create-payu-order` as the balance quantity.
- `NativePaymentOverlay` line item becomes **"Entry Ticket × N"** with per-ticket price and
  subtotal.

⚠️ **`booking_steps` is read by fixed array index in several places and pay-at-venue already
reshapes that array.** Do not add or move a step row while doing this. See the `pay-at-venue-live`
memory for the exact indices and what has already been broken by ignoring this.

### Phase 6: admin — `src/AdminPanel.tsx`

- People tab row shows `×3` next to the name for any booking with `ticket_count > 1`.
- Where a booking has an `attended_count` lower than `ticket_count`, show **"booked 3 · paid for 2"**.
  This is the founder's only visibility into the §11 Risk 1 leak — it is not optional polish.
- Counts and totals in People / Performance should sum tickets, not rows.

---

## 9. Phase 7 — Commissions

Verified against the live triggers on prod, 2026-08-29.

| Who | Trigger | Change needed? |
|---|---|---|
| Marketer | `accrue_marketer_sale()` | **None.** Reads a flat `events.marketer_commission`. Decision #9 is flat per booking, so it is already correct. The open-event half/full two-tier logic also stays untouched. |
| Manager | `accrue_manager_sale()` | **None.** Same flat-amount shape. |
| Creator | `accrue_affiliate_sale()` | **YES — required.** |

**The creator correction.** It is natural to assume the 8% multiplies on its own because it is a
percentage. It does not. The trigger computes `8% × affiliate_full_price(event_slug, city)` — it
reads **the event's ticket price from the events table**, not the amount the customer actually
paid. So a 3-ticket booking would pay the creator for one ticket unless the trigger is changed to
multiply by `NEW.ticket_count`.

Also update `affiliate_leaderboard()`: its `tickets` column is `count(s.id)` — one row per
booking — which will now undercount. It should sum ticket counts.

**Sequencing matters.** The commission triggers must be updated *before* the client can create
multi-ticket bookings, or the first group buy underpays a creator and you will be correcting it by
hand.

---

## 10. Rollout order

Server first, always. The failure mode of getting this backwards is charging for 1 ticket while
billing for 3, or vice versa.

1. Migration (Phase 1) — additive, safe, invisible.
2. Commission triggers (Phase 7) — before any multi-ticket row can exist.
3. `create-payu-order` (Phase 2) — backward compatible: no `ticket_count` in the body means 1.
4. The three payment finishers (Phase 3) — together, never one at a time.
5. Client (Phases 4-6) — last, and only this makes the feature visible to customers.

**Every edge function here must be deployed with `--no-verify-jwt`.** There is no
`supabase/config.toml`, so the CLI defaults `verify_jwt` to true when the flag is omitted, and
deploying `payu-callback` without it returns 401 to PayU and **payments stop**. After deploying,
confirm with the Supabase MCP `list_edge_functions` that `updated_at` moved **and** `verify_jwt`
is still `false`.

### Testing locally

`npm run dev` talks to **production** Supabase — there is no staging. So steps 1-4 must be live on
prod before localhost can test a real payment. This is safe to do while Founders Meet is sold out
and not selling, and the founder has confirmed that is the case. Use **Chill-pill in Himalayas**
(₹1 advance / ₹2 full) and test phones `90000000xx`.

Test script, in order:

1. Book 3 tickets → PayU charges **₹3**, not ₹1.
2. Check `applications`: one row, `ticket_count = 3`, `status = advance_paid`.
3. Check spots-left on the event page dropped by **3**, not 1.
4. Re-enter the flow with the same number → blocked, message says "3 tickets".
5. Pay the balance with headcount **2** → charges **₹2** (`(2−1) × 2`), not ₹3.
6. Check `attended_count = 2`, `status = fully_paid`, admin shows "booked 3 · paid for 2".
7. Confirm the creator commission row is 8% × 3 if an affiliate link was used.
8. **Delete the test rows afterwards.**

---

## 11. Risks, ranked

1. **The headcount is on the guest's phone (decision #5).** Nothing technically stops a guest
   tapping "1" when three of them are standing there. The host is expected to be watching. The
   only mitigation built is the admin record in Phase 6 — check it after the first real event and
   look for a pattern before scaling this.
2. **Charging the wrong amount.** Mitigated by server-only pricing, reading the ticket count from
   the DB rather than the client on the balance path, and the rollout order in §10.
3. **Oversell.** The capacity gate is best-effort, not atomic. Worst case a few tickets over on a
   hot date. Ops-resolvable; atomic reservation is Phase 2.
4. **Scarcity numbers move faster.** Spots now drop 3 at a time. The 50% amber threshold will trip
   earlier than the founder is used to. No code change — just expect it.
5. **Refunds / reducing a booking.** No self-serve path (there isn't one today either). Manual SQL
   plus a PayU refund outside the system.
6. **Failed-payment recovery deeplink** re-runs `create-payu-order` fresh, so a stale recovery bill
   could default back to 1 ticket. Pre-fill the quantity from the prior payment row.

---

## 12. Explicitly NOT in v1

- Add-on purchases after paying (decision #11 — handle by hand).
- Friends' names or phone numbers anywhere (decisions #2, #8).
- Friends individually in the WhatsApp group.
- Quantity in AiSensy copy — the templates show the actual amount charged, which is already
  correct. Saying "3 tickets" needs a new template and fresh Meta approval.
- Group-buy discounts — belongs to the referrals/discounts redemption engine.
- Multi-ticket on any event shape outside §2.
