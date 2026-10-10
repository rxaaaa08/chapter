# Multi-Ticket Open Events — Proposal

> **Status: PROPOSAL ONLY — nothing built.**
> Goal: let one phone number (one verified user) buy **more than one ticket** for an open event, so someone can bring friends. Invite-only events stay strictly one-phone-one-ticket (that rule is deliberate and unchanged).
>
> Written 2026-07-19 after a full code trace of the open-event flow. Companion docs: `OPEN-EVENTS-HANDOFF.md`, `CLAUDE.md`.

---

## 1. The one-sentence answer

Add a **ticket quantity** to the existing booking — one `applications` row per buyer, with a new `ticket_count` column — rather than creating one row per ticket. Charge `price × quantity` server-side, record the quantity on the payment, and teach the ~10 places that silently assume "1 row = 1 ticket" to sum quantities instead of counting rows.

This is the least invasive design by a wide margin, because **everything in the system keys on `(event_slug, phone)`**: the unique key on `applications`, the PayU callback's status flip, the cart-abandonment cron, the OTP gate, `get-user-context`, the receipt screen, the People tab. One buyer = one row keeps every one of those working.

---

## 2. How today's flow works (and where "1 ticket" is baked in)

The current open-event journey:

1. User picks a date + city on `/plans`, fills the details form (name, phone, email, gender).
2. Client calls `create-payu-order` with `check_only: true` — server rejects if this phone already has a paid row for this event ("already paid for this open event", `supabase/functions/create-payu-order/index.ts:254-267`).
3. OTP over WhatsApp (email fallback) via `open-event-otp`.
4. On verify, `handleProceedToPhonePe` (`src/AppFlow.tsx:1703`) inserts a `pending` `applications` row (insert-or-ignore on the `(event_slug, phone)` unique key) and opens the bill page.
5. Bill page (`src/PaymentOverlay.tsx`) shows **one** "Entry Ticket" at the city-aware price, adds the payment-method fee, and calls `create-payu-order` for real.
6. Server recomputes the amount from the DB (never trusts the client), re-checks the OTP session, inserts a `payu_payments` row, returns signed PayU fields.
7. `payu-callback` (and its twins `payu-webhook`, `verify-pending-payments`) verify the hash, then flip the application to `advance_paid` or `fully_paid` **by `(event_slug, phone)`**, and fire the WhatsApp confirmation.
8. You add that phone number to the date's WhatsApp group; the receipt screen shows "Join WhatsApp Group" from `event_dates.whatsapp_group_url`.

Every place that assumes one row = one ticket (this is the actual change list):

| # | Where | Assumption today |
|---|---|---|
| 1 | `applications` table | No quantity column at all |
| 2 | `payu_payments` table | No quantity column; `amount` = one ticket's price |
| 3 | `event_booking_counts` / `event_booking_counts_by_date` RPCs | `count(rows)` = spots taken — drives **sold-out flips**, "Only X left", and the `{spots_left}` chat template |
| 4 | `create-payu-order` | `amount = price_advance` (or `price_full`) — exactly one ticket; balance = `full − advance` for one ticket |
| 5 | `payu-callback` / `payu-webhook` / `verify-pending-payments` | Flip status only; nothing to record about how many tickets were bought |
| 6 | Bill page `PaymentOverlay.tsx` | Hard-coded single "Entry Ticket" line |
| 7 | Receipt screen `PayUReturnScreen` (`src/App.tsx`) | Invoice shows one ticket; balance retry computes `price_full − price_advance` for one ticket (`src/App.tsx:1601-1673`) |
| 8 | Admin People tab (`src/AdminPanel.tsx`) | 1 card = 1 person = 1 ticket; status counts = ticket counts |
| 9 | Commission triggers (`accrue_marketer_sale`, `accrue_affiliate_sale`, `accrue_manager_sale`) | Fire once per application with a per-ticket amount (affiliate = 8% of ONE full price) |
| 10 | `get_performance_summary` (Finances tab) | Revenue/profit per application = one ticket's prices |
| 11 | Analytics (`get_analytics_summary`, experiments snapshots) | Paid applications ≈ tickets sold |
| 12 | Journey Map seeds (`src/journeyMapSeeds.ts`) | Open-event map has no quantity step |

Also important: **there is no server-side capacity check today.** Sold-out is enforced only by the client calendar UI. At quantity 1 the worst case is one oversold seat; at quantity 5 a stale tab could oversell five. This proposal adds a server-side gate (§6.2).

---

## 3. The core design decision: how to represent N tickets

### Option A — quantity on the existing row (RECOMMENDED)

`applications.ticket_count` (integer, default 1) + `payu_payments.quantity` (integer, default 1).

- ✅ The `(event_slug, phone)` unique key, the callback's status flip, cart-abandonment, OTP, get-user-context, receipt lookup — all keep working untouched.
- ✅ Rollout is safe: every existing row means exactly what it meant before (`ticket_count = 1` backfill).
- ✅ One WhatsApp confirmation, one receipt, one People-tab card per buyer — matches how you'd actually operate it (the buyer is your contact; the friends came with them).
- ⚠️ Anything that *counts rows* must switch to *summing quantities* (the table above).

### Option B — one row per ticket (drop/extend the unique key)

- ❌ Breaks the callback's `UPDATE … WHERE event_slug AND phone` (it would flip every row, or need txn-level linkage).
- ❌ Breaks the insert-or-ignore logic in `AppFlow.tsx`, the anon-INSERT RLS story, the recovery/cart-abandoned flags, the "already paid" guard, get-user-context dedup… essentially a rewrite of the whole identity model with live customers on the table. Rejected.

### Option C — separate `booking_tickets` child table

- Cleaner in the abstract (each ticket its own row, own guest name, own refund), but every consumer (RPCs, People tab, finances, callback) needs a join, and v1 doesn't need per-ticket identity. Worth revisiting **only if** you later decide each friend must be individually tracked/added to the group by their own number. Rejected for now.

**Recommendation: Option A.** If a future need for per-guest identity appears, Option C can be layered on top later without undoing A.

---

## 4. Product decisions you need to make (my recommendation in bold)

These change what gets built, so decide before implementation:

1. **Max tickets per booking.** Unlimited invites abuse and capacity math. **Recommend a per-event cap, default 5**, stored as `events.max_tickets_per_booking` so you can tune it per event from the admin panel (or start with a hard-coded 5 and add the column later). Server clamps regardless of UI.
2. **Group chat: who gets added?** Today "a ticket" = "a phone in the group". With multi-buy, friends' numbers aren't verified (no OTP) and haven't consented to WhatsApp messages. **Recommend v1: only the buyer joins the group; the buyer relays details to their friends.** The confirmation message can say "you've booked N tickets — add your friends' details closer to the date" if you later want names. Collecting friends' *phone numbers* and templating them on WhatsApp is a consent/compliance risk with AiSensy/Meta — avoid until there's a real need.
3. **Guest names.** Do you need the friends' names for the meet-up manifest? **Recommend: optional free-text "Who's coming with you?" field stored on the application (`guest_names text`), not required, no extra rows.** Zero-risk, helps hosts at the meeting spot.
4. **Split events too, or single-payment only?** Multi-ticket on a `payment_mode='split'` event means: advance = `advance × N` now, balance = `(full − advance) × N` later, all-or-nothing (no "pay balance for 2 of my 3 tickets"). The math is simple server-side, so **recommend supporting both split and full from day one**, with the all-or-nothing balance rule stated on the bill.
5. **Add-on purchases ("I bought 2, now I want 1 more").** Today a paid phone is hard-blocked from paying again (the 409 guard). Allowing top-ups means a second payment that *increments* `ticket_count`, complicates the balance math mid-flight for split events, and complicates refunds. **Recommend Phase 2** — v1 keeps the block with a clearer message ("You've already booked N tickets for this event — message us to add more"), and you handle rare add-ons manually. Most group buys are decided in one sitting.
6. **Per-ticket pricing tiers?** The dynamic-pricing proposal (spots-based ladder) isn't built, but note the interaction now: a 4-ticket buy should consume 4 spots **at the price shown at checkout** (one price × 4, no mid-cart tier jump). This falls out naturally from Option A since one payment = one price. No action needed now.

---

## 5. What the customer sees (UX changes)

### Details form (`src/AppFlow.tsx`, open events only)
- A **quantity stepper** ("Tickets: − 1 +") appears on the details form, after date/city selection, gated on `isPayUFlow` so the invite flow never shows it.
- Max = `min(max_tickets_per_booking, spots left on the selected date)` using the already-loaded `dateCounts`. If only 2 spots remain, the stepper caps at 2.
- Copy under the stepper: *"Booking for friends? All tickets are under your number — you'll get one group-chat invite and share the details with them."*

### Bill page (`src/PaymentOverlay.tsx`)
- Line item becomes **"Entry Ticket × N"** with the per-ticket price and a subtotal, then the payment-method fee **on the subtotal** (fee math is already `base + base × rate`, so passing `base = price × N` needs no formula change).
- Split events: "Pay Advance ₹(adv × N)" now, and the remaining-balance line shows `(full − adv) × N`.

### Receipt / return screen (`PayUReturnScreen` in `src/App.tsx`)
- Invoice shows quantity (from the new `payu_payments.quantity` returned by `get-user-context`).
- The **balance retry bill** multiplies by the application's `ticket_count` (server recomputes anyway — display only needs to match).
- Download-receipt PDF (jsPDF) gets the quantity line.

### WhatsApp confirmations
- Amounts in `advance_success_dpl` / `fullpaid_dpl` / `single_payment_sucess_dpl` already show the **actual charged amount** (total), so they're correct with zero template changes. If you want the message to literally say "3 tickets", that's a **new AiSensy template param → Meta re-approval** — recommend skipping in v1 and revisiting.

---

## 6. The build, layer by layer

### 6.1 Database (one migration, applied carefully to prod)

```sql
-- 1) Quantity on the booking (backfill-safe: default 1 covers all history)
ALTER TABLE applications  ADD COLUMN ticket_count integer NOT NULL DEFAULT 1
  CHECK (ticket_count BETWEEN 1 AND 20);
ALTER TABLE applications  ADD COLUMN guest_names text;          -- optional, decision #3
ALTER TABLE payu_payments ADD COLUMN quantity integer NOT NULL DEFAULT 1
  CHECK (quantity BETWEEN 1 AND 20);
-- 2) Optional per-event cap (decision #1)
ALTER TABLE events ADD COLUMN max_tickets_per_booking integer NOT NULL DEFAULT 5;
```

- The CHECK at 20 is a hard sanity ceiling; the real cap is the per-event column.
- **RPC updates** (`event_booking_counts`, `event_booking_counts_by_date`): `reserved` becomes `sum(ticket_count) FILTER (WHERE status IN ('advance_paid','fully_paid'))`; keep `registered` as the row count (people) — the UI uses `reserved` for capacity, and the People tab wants people. Both RPCs change in one migration, and the client needs **no change** for sold-out logic — it just starts receiving ticket-true numbers.
- `refresh_open_application` RPC: also accept + update `ticket_count`/`guest_names` on unpaid rows (same `status NOT IN ('advance_paid','fully_paid')` guard it already has), so a returning lead who changes quantity before paying gets their pending row refreshed.

### 6.2 `create-payu-order` (the money-critical change)

- Accept `quantity` in the body. **Server-clamp**: integer, `1 ≤ q ≤ min(event.max_tickets_per_booking, 20)`; anything else → treat as 1 (or 400). Only honored when `booking_url = 'payu-hosted'` — invite events force `quantity = 1` no matter what the client sends.
- **Advance / full**: `amount = price × quantity` (city-aware price as today), *then* the method fee on top. Store `quantity` on the `payu_payments` insert.
- **Balance** (split): ignore the client's quantity entirely — read `ticket_count` from the *application row* (the source of truth set at advance time): `amount = (full − adv) × app.ticket_count`. This keeps the existing "balance never re-OTPs" path safe: a tampered client can't shrink its own balance.
- **New: server-side capacity gate** (open events, advance/full only): before creating the order, compute `sum(ticket_count)` of paid rows for the buyer's `selected_date` (from their application row, which `refresh_open_application` has just updated) and reject with a clear 409 ("only X spots left") if `paid + quantity > capacity`. Honest caveat: this is a *check*, not an atomic reservation — two buyers racing for the last 2 spots can still both pass. That race exists today at qty 1; the gate bounds it instead of eliminating it. A truly atomic reservation (a `FOR UPDATE` counting RPC, like the OTP-verify hardening we did 2026-07-18) is a worthwhile **Phase 2 hardening**, listed in §9.
- The `check_only` preflight returns `max_quantity` (remaining spots vs per-event cap) so the stepper can cap itself with server truth, not just client cache.
- The "already paid" 409 guard stays exactly as is (decision #5) — only its client-side message changes.

### 6.3 Payment finishers — `payu-callback`, `payu-webhook`, `verify-pending-payments`

All three do the same status flip; all three get the same one-line addition:

- On **success** of an `advance`/`full` payment, alongside `status = newStatus`, set `ticket_count = stored.quantity` on the application row (from the trusted `payu_payments` row, never the client). Balance success touches nothing — the count was fixed at advance time.
- The repair-upsert in `payu-callback` (paid buyer with no application row) includes `ticket_count: stored.quantity`.
- `invite_payment_submissions` upsert: unchanged (its `amount` already carries the true total).
- **These are edge functions → you deploy** (or grant one-off approval), same as every prior edge change. All three must ship together with 6.2 in one deploy window; see §8 rollout.

### 6.4 Client (`src/AppFlow.tsx`, `src/PaymentOverlay.tsx`, `src/App.tsx`)

- Quantity state in the open flow; stepper UI on the details form (§5); `quantity` added to `paymentContext`, the pending `applications` insert (`ticket_count`), the `refresh_open_application` call, and the `create-payu-order` body from the bill page.
- Bill page renders `× N` and multiplies the base before the fee.
- `get-user-context` adds `ticket_count` to its applications select and `quantity` to the payment select (one line each) so the receipt and balance-retry screens display honestly.
- Cart-abandonment WhatsApp (`cart_abandon_open`) works unchanged — it's per-lead, not per-ticket.

### 6.5 Admin (`src/AdminPanel.tsx`)

- People-tab card: a small **"× N tickets"** badge whenever `ticket_count > 1` (all three modes).
- Status count chips: keep counting **people** (rows) as today, but the payments-mode header can additionally show tickets sold (sum) — this is display-only polish, sequenced last.
- Timeline editor / `{application_count}`: today it pulls the registered count; decide whether the yellow event-date card should say people or tickets — **recommend tickets** (it reads as "how many are coming"), which means pointing it at `reserved` from the updated RPC.

### 6.6 Money: commissions, affiliates, finances

- **Affiliate** (`accrue_affiliate_sale`): currently 8% of ONE full price. Multiply by `NEW.ticket_count` — a creator who brought a 4-ticket buyer earned 4 tickets of revenue. One-line trigger change.
- **Marketer** (`accrue_marketer_sale`): flat per-application amount. Open events almost never have a marketer (only doubt-assigned), but for correctness multiply by `ticket_count` too — a marketer who converts a 3-ticket doubt closed 3 tickets. Same for the **manager** ₹35 accrual. (If you'd rather keep marketer/manager flat per *buyer*, say so — it's a one-word difference.)
- **Finances** (`get_performance_summary`): per-application revenue/profit terms multiply by `ticket_count`. ⚠️ Same drift warning as `get_analytics_summary`: **dump the live definition first**, the deployed RPC is ahead of committed migrations.
- **Analytics** (`get_analytics_summary`, experiments daily snapshots): anywhere "paid applications" is used as a tickets-sold proxy, add a summed-tickets variant. Not blocking for launch — money and capacity are; analytics can trail by a week.

### 6.7 Journey Map
- Refresh the open-event seed in `src/journeyMapSeeds.ts` (quantity step on the details form, "× N" on the bill) and sync per the usual `sync-map` flow.

---

## 7. What deliberately does NOT change

- **Invite-only flow**: untouched, still one phone = one ticket, enforced server-side (quantity forced to 1 for non-open events).
- **OTP flow**: one verification per buyer, regardless of quantity. Rate limits unchanged.
- **Status model**: `pending → advance_paid → fully_paid`, cart-abandoned/recovered flags — all per-buyer, all unchanged.
- **`(event_slug, phone)` unique key**: unchanged — it's the reason this design is cheap.
- **AiSensy templates**: no new templates, no re-approvals (amounts already reflect totals).
- **The paid-status trigger guard, RLS lockdown, marketer round-robin**: untouched.

---

## 8. Rollout order (safe on prod)

The trap is a **version skew**: if the new client sends `quantity: 3` to the *old* `create-payu-order`, the server silently charges for 1 ticket while the bill says 3. Sequence so the server always leads and every step is backward-compatible:

1. **Migration** — add columns (defaults make it invisible to all current code) + updated RPCs + `refresh_open_application`. Verify with `RETURNING`/`SELECT` per house rules. Nothing user-visible changes.
2. **Edge deploy** (you deploy): `create-payu-order` + `payu-callback` + `payu-webhook` + `verify-pending-payments` together. Old clients send no `quantity` → defaults to 1 → behavior identical. Test with a `90000000xx` phone end-to-end (buy qty 1 via the live flow), delete test rows.
3. **Trigger + finances RPC changes** (affiliate/marketer/manager ×qty, performance summary). Still invisible while all rows are qty 1.
4. **Client ship** — stepper, bill, receipt, get-user-context fields, People-tab badge. First real multi-ticket purchase happens only after this, when everything below it already understands quantity.
5. **Verify on prod** with a test phone: qty 2 single-payment purchase → check `payu_payments.quantity = 2`, `applications.ticket_count = 2`, RPC `reserved` +2, receipt shows × 2, WhatsApp amount = 2× price. Then a split qty-2: advance ×2, balance bill shows ×2, balance charge = 2 × (full − adv). Delete test rows.
6. **Analytics + Journey Map** polish, then `cleanup-roadmap` the auto-created card.

Each step is an isolated, one-concern commit per the house rules; steps 1–3 can land over a day or two with zero customer impact before step 4 flips the feature on.

---

## 9. Risks & edge cases (ranked)

1. **Charging wrong amounts** — the only truly scary one. Mitigated by: server-only price math (already the architecture), balance quantity read from the DB not the client, deploy order above, and prod verification with test phones before announcing.
2. **Oversell race** — bounded, not eliminated, by the new capacity gate (§6.2). Worst case a few tickets over on a hot last-minute date; ops-resolvable. Phase-2 hardening: atomic reservation RPC (`FOR UPDATE` on a per-date counter), same pattern as the OTP-verify hardening.
3. **Failed-payment recovery deeplink** (prior `payu_payments` row skips OTP): the retry re-runs `create-payu-order` fresh, so quantity comes from the new request/bill — a stale recovery bill could default back to 1. Fix: retry bill reads `quantity` from the prior payment row via `get-user-context` and pre-fills it. Covered in 6.4.
4. **Refunds / reducing a booking** ("my friend dropped out"): no self-serve path (there's no self-serve refund today either). Manual: founder SQL to decrement `ticket_count` (+ PayU partial refund outside the system). Document as an ops runbook note; build nothing.
5. **Commission over/under-payment** if trigger multiplication (6.6) ships *after* the client (step 4 before step 3): avoided by the rollout order.
6. **`{spots_left}` chat template & amber "Only X left"**: automatically ticket-true once the RPC changes — but watch the first hot event: quantities make numbers drop faster, and the 50%-amber threshold may trip earlier than you're used to. No code change; just awareness.
7. **Cart-abandonment nudges** a 5-ticket abandoner the same as a 1-ticket one. Fine for v1; the template doesn't mention quantity.

---

## 10. Phase 2 candidates (explicitly not in v1)

- **Add-on purchases** after paying (increment `ticket_count` via a new `payment_type='addon'` with its own guard rules).
- **Atomic capacity reservation** RPC (kills the oversell race outright).
- **Per-guest identity** (names/phones per ticket, friends individually in the group chat) — would introduce the `booking_tickets` child table from Option C.
- **Quantity in WhatsApp copy** (new AiSensy template + Meta approval).
- **Group-buy pricing** ("4+ tickets → ₹X off each") — belongs to the referrals/discounts redemption engine blueprint, not here.

---

## 11. Decision checklist (answer these and the build can start)

| # | Question | Recommendation |
|---|---|---|
| 1 | Max tickets per booking? | 5, per-event column |
| 2 | Friends in the group chat? | No — buyer only, relays details |
| 3 | Collect guest names? | Optional single text field |
| 4 | Split events included? | Yes, all-or-nothing balance |
| 5 | Add-on buys after paying? | Phase 2; keep the block with better copy |
| 6 | Marketer/manager commission × qty, or flat per buyer? | × qty (affiliate definitely × qty) |
| 7 | Yellow event-date card counts people or tickets? | Tickets |
