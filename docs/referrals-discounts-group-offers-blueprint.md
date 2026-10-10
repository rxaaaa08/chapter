# Referrals, Discount Codes, Credits & Group Offers — Implementation Blueprint

*Written 2026-07-07. Self-contained blueprint for a future session — includes the code-level integration points so no re-exploration is needed. Companion docs: `growth-research-proposals.md` (§2.4 promo codes, §2.6 referrals — business rationale), `dynamic-pricing-proposal.md` (price-locking prerequisite, hidden tiers), `operations-improvement-proposal.md` (umbrella).*

**Read first if this is a fresh session:** the Supabase DB is PRODUCTION (test with phone `90000000xx`, delete test rows after); never mutate rows with status `advance_paid`/`fully_paid`; pushing `main` deploys; edge functions are deployed only by the founder.

---

## 0. The core idea: one redemption engine, many faces

Every feature in this doc — creator promo codes, win-back codes, customer referrals, milestone rewards, loyalty discounts, refund credits, goodwill comps, duo offers, gifts — reduces to two primitives:

1. **A promo-codes table** validated server-side at checkout.
2. **A credits wallet** (rows of ₹ per phone) redeemed server-side at checkout.

Build those two once, and each "feature" is just a different *issuer* writing rows into them. Do NOT build referrals, discounts, and group offers as three separate systems.

### Why this is safe to build here

All pricing already flows through **one server-trusted choke point**: `supabase/functions/create-payu-order/index.ts`. The client never supplies an amount — the function resolves the event, picks city-aware prices (`cityPrices()`, ~line 43), computes the amount per payment type (step 4, ~lines 286–359), adds the PayU method fee (`applyMethodFee()`, step 4b, ~line 361), inserts a pending `payu_payments` row with the server-computed amount (step 6, ~line 387), and only then hands PayU form fields to the browser. Discounts slot into this exact pipeline as one new step. A tampered client cannot invent a discount because the server recomputes everything.

The status-flip side lives in `supabase/functions/payu-callback` (verifies PayU's hash, flips `applications.status`, fires WhatsApp, redirects). That's where redemptions get **confirmed** and referral rewards get **issued** — mirroring how affiliate commissions already accrue at `fully_paid`.

---

## 1. Schema (one migration)

### 1.1 `promo_codes`

| column | type | notes |
|---|---|---|
| `code` | text PK | store UPPERCASE; normalize on input (`trim().toUpperCase()`) |
| `kind` | text CHECK `percent`\|`flat` | |
| `value` | numeric | percent 1–100, or flat ₹ |
| `scope_event_slug` | text NULL | NULL = valid on all events; else one event (FK-ish to `events.slug`) |
| `scope_trip_date` | text NULL | optional: lock to one date (duo codes) |
| `applies_to` | text CHECK `advance`\|`balance`\|`full`\|`any` DEFAULT `any` | which payment leg it can discount |
| `min_base` | numeric DEFAULT 0 | minimum base amount to qualify |
| `max_uses` | int NULL | NULL = unlimited; else global cap across confirmed redemptions |
| `per_phone_limit` | int DEFAULT 1 | |
| `valid_from` / `valid_until` | timestamptz NULL | |
| `active` | boolean DEFAULT true | kill switch |
| `source` | text | `creator` \| `winback` \| `returning` \| `referral` \| `duo` \| `presale` \| `manual` — analytics dimension |
| `creator_handle` | text NULL | when `source='creator'`: also attribute the sale to this affiliate (screenshot fallback for links) |
| `issued_to_phone` | text NULL | for personal codes (referral/duo): only this phone's *friend network* concern — see §3 |
| `created_at` | timestamptz | |

### 1.2 `code_redemptions`

| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `code` | text → promo_codes | |
| `phone` | text | last-10-digits, same normalization as everywhere (`normalizePhone`) |
| `event_slug` | text | canonical slug |
| `txnid` | text | the `payu_payments.txnid` this rode on |
| `discount_amount` | numeric | ₹ actually taken off (post-clamp) |
| `status` | text CHECK `pending`\|`confirmed`\|`void` | pending at order creation → confirmed/void at callback |
| `created_at` / `resolved_at` | timestamptz | |

Unique partial index: `(code, phone) WHERE status IN ('pending','confirmed')` enforces `per_phone_limit=1` at the DB level (the common case) even under concurrent checkouts. For `per_phone_limit>1` validate by count in the RPC.

### 1.3 `credits`

| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `phone` | text | owner |
| `amount` | numeric | ₹, whole-row redemption (no partial spend — see §1.5) |
| `reason` | text | `referral` \| `milestone` \| `refund` \| `goodwill` \| `loyalty` |
| `ref_phone` | text NULL | for referral credits: the friend whose payment earned this |
| `ref_txnid` | text NULL | audit trail |
| `status` | text CHECK `issued`\|`held`\|`redeemed`\|`expired`\|`void` | `held` = attached to a pending payment |
| `redeemed_txnid` | text NULL | |
| `expires_at` | timestamptz NULL | recommend 90 days for referral credits (creates urgency) |
| `created_at` | timestamptz | |

### 1.4 `payu_payments` additions

Add nullable columns: `promo_code text`, `discount_amount numeric`, `credits_amount numeric`, `base_before_discount numeric`. This makes every receipt, the retry-bill path, and reconciliation self-explanatory, and is the **price lock**: whatever was computed at bill time is what the row says — nothing recomputes later.

### 1.5 Design decisions (decided here, revisit only if founder objects)

- **Whole-row credit redemption, no partial spend.** A ₹100 credit on a ₹80 bill burns the credit and clamps the discount at ₹80. Massively simpler ledger; at these credit sizes the loss is negligible. Issue credits in small denominations (₹50/₹100) to soften this.
- **Stacking: one code + credits allowed together; never two codes.** Code applies first, credits second, total discount clamped to base amount (price never below ₹0; recommend a floor of ₹1 so PayU always has a real transaction — or skip PayU entirely for a ₹0 bill and flip status directly, but that's extra callback surface; prefer the ₹1 floor and document it, OR clamp so at least ₹49 is payable — founder taste, ask once).
- **Discounts apply to the leg being paid, never retroactively.** A code on the advance leg discounts the advance; the balance leg later computes `full − advance_list_price` exactly as today (create-payu-order line ~327), unchanged. So a ₹100 advance code = ₹100 off the *total*, automatically, with zero balance-path changes. `applies_to='balance'` codes exist for balance-chase incentives ("pay balance this week, ₹100 off").
- **PayU method fee applies AFTER discount** (fee on what the customer actually pays): compute `base → −code → −credits → applyMethodFee()`. This is both fair and what the existing fee math expects.
- **Codes are validated AND held at order creation, confirmed at callback.** Validation counts `confirmed` + *fresh* `pending` redemptions (pending younger than ~30 min) against `max_uses` — so two simultaneous checkouts can't both take the last use, but an abandoned checkout releases the code automatically by aging out. The existing verify-pending-payments / stuck-payment machinery is the model.

---

## 2. Server changes — the two functions

### 2.1 `create-payu-order` (new step 4c, between amount computation and fee)

New optional body fields: `promo_code` (string), `use_credits` (boolean).

```
── 4c. Apply discounts (server-trusted) ──
1. baseAmount = amountNum (post step-4, pre-fee)
2. If promo_code:
   - normalize; SELECT row; check: active, window, scope_event_slug (vs canonicalSlug),
     scope_trip_date, applies_to (vs paymentType), min_base ≤ baseAmount,
     per_phone_limit (count confirmed+fresh-pending for this phone),
     max_uses (count confirmed+fresh-pending overall)
   - discount = kind==='percent' ? round(base*value/100) : value
   - INSERT code_redemptions (status 'pending', txnid, discount actually applied)
   - on ANY validation failure → return 409 with a machine-readable reason
     ('code_expired','code_used','code_wrong_event','code_min_not_met') so the
     bill page can show a human message; NEVER silently ignore a bad code.
3. If use_credits:
   - SELECT credits WHERE phone AND status='issued' AND (expires_at IS NULL OR > now())
     ORDER BY expires_at NULLS LAST (spend expiring first)
   - take rows until discount target met or rows exhausted; UPDATE them to status='held',
     redeemed_txnid=txnid
4. totalDiscount = min(codeDiscount + creditsTaken, baseAmount − FLOOR)
5. amountNum = baseAmount − totalDiscount   → then existing step 4b fee applies
6. Stamp promo_code/discount_amount/credits_amount/base_before_discount on the
   payu_payments insert (step 6)
7. Response JSON: add discount_amount, credits_amount so the bill page renders
   the breakdown (it already renders base/fee/total from this response —
   src/PaymentOverlay.tsx NativePaymentOverlay)
```

Do the code+credits work with the **service-role client already initialized** in the function; wrap the credit-hold + redemption-insert so a failed payu_payments insert (existing abort path, ~line 401) also voids the holds.

### 2.2 `payu-callback`

On **success** (where status flips today):
- `UPDATE code_redemptions SET status='confirmed', resolved_at=now() WHERE txnid=?`
- `UPDATE credits SET status='redeemed' WHERE redeemed_txnid=? AND status='held'`
- **Referral reward hook** (§3): if this payment made the payer `fully_paid` and their application carries a `referred_by_phone`, INSERT a `credits` row for the referrer (`reason='referral'`, `ref_phone`, `ref_txnid`), and fire the founder-approved AiSensy template to the referrer ("your friend {name} just booked — ₹100 credit added").
- **Milestone check** (§3): count this referrer's confirmed referral credits; at N=3 issue the milestone credit/free-seat credit.

On **failure**: void the pending redemption, release held credits back to `issued`. Also add the same release to whatever cleans up stale pending payments (the reconciliation cron), so a browser closed mid-PayU never strands a credit for more than ~30 min.

### 2.3 New RPC for the client: `validate_promo_code(p_code, p_event_slug, p_phone, p_payment_type)`

Anon-callable, returns `{valid, kind, value, reason}` — **read-only preview** so the bill page can show "−₹100" before the user hits Pay. `promo_codes` itself stays RLS-locked (no anon SELECT — otherwise the table is enumerable). Same pattern as the existing `event_booking_counts` RPCs. The authoritative check still happens inside create-payu-order; the RPC is UX only.

Also extend `get-user-context` to return the caller's available credit balance (it's already the sanctioned way for the client to read private per-phone state).

---

## 3. Customer referrals (rides on the engine + the affiliate pattern)

**Model:** every customer who reaches `advance_paid`/`fully_paid` gets a personal referral code, auto-generated, e.g. `REF-{4 random alnum}` (stored in `promo_codes` with `source='referral'`, `issued_to_phone=<referrer>`, flat ₹100, `per_phone_limit=1`, global `max_uses` NULL). The success screen and the post-payment WhatsApp message both carry a share link.

**Share link:** `chaptera.in/r/REF-AB12` → client captures it EXACTLY like `src/affiliate.ts` captures `?ref=` (session-scoped sessionStorage, no cross-session persistence, same normalization discipline). On the details-form/application step, stamp `referred_by_code` → resolve to `referred_by_phone` onto the application row (new nullable columns on `applications`) — mirroring how affiliate attribution is stamped "at the decisive moment" (affiliate.ts header comment). The friend ALSO gets the code prefilled in the bill page's code field (it's a normal promo code — one system).

**Reward:** issued at the **friend's** `fully_paid` in payu-callback (§2.2) — credit, not cash, so it forces a repeat booking. Guards:
- self-referral: reject when `referred_by_phone == payer phone` or the code's `issued_to_phone` equals the payer.
- one reward per unique friend phone (unique index on `credits(ref_phone, reason)` where reason='referral').
- reward only on `fully_paid`, never on advance — no reward for a friend who abandons at balance.

**Milestone ("3 friends = free ticket"):** at the third confirmed referral credit, issue one big credit equal to a typical advance (or a 100%-off single-use personal code — same engine either way) + a celebratory AiSensy template. Keep the count query dumb: `COUNT(*) FROM credits WHERE phone=? AND reason='referral' AND status IN ('issued','redeemed')`.

**Referrer visibility:** reuse the creator-dashboard pattern — a tiny "Your referrals" strip on the success screen / a `/credits` mini-page fed by `get-user-context`: credits balance, friends joined, expiry dates. Phase-2 polish, not required for launch.

---

## 4. The issuer features (each = rows into the engine + one message template)

| Feature | What it writes | Trigger / where |
|---|---|---|
| **Creator codes** (`ANU10`) | `promo_codes` row: `source='creator'`, `creator_handle` set, percent 5–10% | Created from AdminPanel affiliates section. At callback-confirm, if the winning attribution was the code (no session ref present), credit the sale to `creator_handle` in the existing affiliate commission path — codes catch the Instagram-screenshot conversions links miss |
| **Win-back codes** | one shared code per campaign: `source='winback'`, short `valid_until` (72h), `applies_to='advance'` | Embedded in the second cart-abandonment message (`supabase/functions/cart-abandonment`) — makes recovery measurable per code |
| **Returning-customer codes** | `source='returning'`, scope NULL (all events) | Sent in the post-event feedback flow (growth doc §3.2) |
| **Balance-chase codes** | `applies_to='balance'` | Optional arrow in the marketer chase-worklist quiver |
| **Duo / bring-a-friend** | auto-generated single-use code at friend #1's success: `source='duo'`, `scope_event_slug` + `scope_trip_date` locked to the buyer's date, flat ₹50–100, `valid_until` = event date | Success screen + success WhatsApp: "bring a friend to the same date — this code gives them ₹X off". Two separate normal payments; zero checkout-flow changes. **This is Phase A of group offers** |
| **Presale codes** | `source='presale'`, `scope_event_slug`, `valid_until` = public-launch time | Blast to past `fully_paid` phones (query on `applications`) 24h before a date goes public |
| **Refund-as-credit / goodwill** | `credits` row, `reason='refund'`/`'goodwill'` | Admin-panel button on a person's card (People tab), amount + reason typed by admin. Guard: admin-only write path (service role via an edge function or authed RPC — NOT anon) |
| **Loyalty auto-discount** | no row at all — computed | In create-payu-order step 4c: `COUNT(*) FROM applications WHERE phone=? AND status='fully_paid' AND event_slug != current` ≥ 2 → auto `min(10%, cap ₹N)` off, stamped as `promo_code='LOYALTY'` pseudo-code in payu_payments for receipts. Zero user action — the bill just says "3rd event with us — 10% off". Config (threshold/percent/cap) in a settings row, founder-tunable |

---

## 5. Group offers — the honest phasing

**Phase A — duo codes (above): ship with the engine. Effort ≈ zero beyond the engine itself.**

**Phase B — pay-for-two / gift-a-seat (one payment, N seats): a real flow change. Build only when demand shows up as "can I pay for my friend?" messages.**

Design constraints discovered in the code that Phase B must respect:
- `applications` has UNIQUE `(event_slug, phone)` and payu-callback flips status by `(event_slug, phone)` — a second seat MUST have a second phone. So pay-for-two is a **claim-link** model: buyer pays `2×` price (create-payu-order gets `seats: 2`, multiplies the base, stamps `seats` on `payu_payments`); callback flips the buyer's application AND writes a row into a new `seat_claims` table (`txnid`, `event_slug`, `trip_date`, `claim_token`, `status='unclaimed'`); buyer gets a WhatsApp with the claim link; friend opens it, enters name+phone, an `applications` row is created directly at the paid status (INSERT, not UPDATE — no paid-row mutation), spot counts already follow because they derive from applications.
- **Gift-a-seat is the same machinery** with `seats:1` where the buyer's own application is NOT created/flipped — only a `seat_claims` row. One flag (`gift: true`) distinguishes them.
- Capacity: hold seats at order creation? No — at these volumes, check spots-left for `seats` at order creation and accept the tiny race (same as today's single-seat behaviour).
- Per-date `event_dates.booking_steps` and balance flows assume one payer per application; **restrict Phase B to `payment_mode='full'` events initially** (single payment, jumps to `fully_paid`, no balance leg to fan out). Split-mode group booking is a Phase C question — likely "don't".

**Group-leader milestone** ("get 4 friends on this date → your seat free"): no new machinery — it's the referral milestone (§3) scoped to one event date. Count confirmed referrals whose application landed on the same `event_slug+trip_date`; issue a credit equal to the leader's advance. Config per event from the admin panel (on/off + N + reward).

**Buy-out-the-date** (private booking): not an engine feature — a manual sales motion. Product support = a "request private date" Tally form + an admin ability to mark an `event_dates` row private/full. Skip until asked twice.

---

## 6. Client changes (both flows share the bill page)

- **`src/PaymentOverlay.tsx` (`NativePaymentOverlay`)** — the single shared bill page: add a collapsible "Have a code?" input (+ auto-fill from sessionStorage referral capture) and, when `get-user-context` reports credits, a "Use ₹N credit" toggle. Preview via `validate_promo_code` RPC; on Pay, pass `promo_code`/`use_credits` in the create-payu-order body; render the returned `discount_amount`/`credits_amount` lines in the bill breakdown (base − discount + fee = total). Show clamped/partial application honestly ("₹100 code, ₹80 applied").
- **`src/App.tsx`** — success screens (`PayUReturnScreen`): referral share card ("give ₹100, get ₹100" + WhatsApp share button with prefilled text) and duo-code card. Router: `/r/<code>` capture → sessionStorage (mirror `captureAffiliateRef()`; add a `captureReferralRef()` in `src/affiliate.ts` or a sibling module).
- **`src/AdminPanel.tsx`** — a small "Offers" section: create/kill promo codes (form over `promo_codes` via authed path), see redemptions per code (count, revenue, per-source), issue goodwill/refund credits from a person's card, per-event group-leader config. Keep it one flat table + a form — this is founder/admin-only tooling.
- **Receipts**: the retry-bill/receipt path in `PayUReturnScreen` reads `payu_payments` — the new columns (§1.4) make discounted receipts render correctly with zero recomputation.

**RLS:** `promo_codes`, `code_redemptions`, `credits` all locked to service role; anon interaction ONLY via `validate_promo_code` RPC + `get-user-context`. Same posture as `applications`/`invited_numbers` (see CLAUDE.md RLS note).

---

## 7. Analytics & the Daily Manager

- Every redemption row carries `source` → one GROUP BY answers "which offer type actually sells": winback vs returning vs referral vs duo, revenue and count, per event.
- Referral K-factor: referred `fully_paid` applications ÷ total `fully_paid`.
- Feed two rules into the daily-manager rulebook when it ships: "code X hit 80% of max_uses" (nice problem) and "credits expiring within 7 days: N phones, ₹M" (send a reminder blast → those credits force repeat bookings, which is the whole point).

---

## 8. Guardrails (non-negotiable)

1. **Server recomputes everything.** The client's code string and credit toggle are *requests*; amounts come only from DB rows inside create-payu-order. Never accept a discount amount from the browser.
2. **Clamp** total discount to base (with the agreed floor); credits can never go negative; a voided payment releases holds.
3. **No paid-row mutation.** Claim links INSERT new application rows at paid status; nothing UPDATEs an existing `advance_paid`/`fully_paid` row (CLAUDE.md golden rule).
4. **Price lock.** Discounted amounts are stamped on `payu_payments` at creation and are never recomputed — this is also the dynamic-pricing doc's prerequisite, so building this engine *advances* that proposal.
5. **No public visibility of prices dropping.** Codes are private by nature — never render a struck-through public price next to a discount on the event page (growth doc §2.2 guardrail: public drops burn trust with people who paid full).
6. **Rate limiting already covers the new surface** (create-payu-order: 10/min/IP, 5/hour/phone) — code brute-forcing is additionally bounded by the `validate_promo_code` RPC needing its own rate limit row (`check_rate_limit` RPC exists; reuse it: e.g. 10 validations/min/IP).
7. **Templates:** every new outbound message (referral reward, duo offer, presale, credit-expiry) is a founder-approved AiSensy template; nothing free-form, nothing unprompted beyond the defined triggers.

---

## 9. Build order

| Phase | Scope | Effort |
|---|---|---|
| **1. Engine** | Migration (§1) + create-payu-order step 4c + payu-callback confirm/void + `validate_promo_code` RPC + bill-page code input & breakdown + minimal AdminPanel code creator. Ship with ONE use: a founder-made manual code, tested end-to-end with a `90000000xx` row on a test event. | ~1–1.5 sessions |
| **2. Issuers, cheap wins** | Creator codes (+ attribution fallback), win-back code in cart-abandonment msg #2, returning-customer code in feedback flow, duo codes on success screen. | ~1 session |
| **3. Referrals** | `/r/` capture, application stamping, callback reward + milestone, success-screen share card, credits in get-user-context + bill toggle, referrer strip. | ~1 session |
| **4. Loyalty + presale + goodwill** | Auto-discount in 4c, presale blast query + code, admin goodwill-credit button. | ~½–1 session |
| **5. Group Phase B** | seat_claims + multi-seat pricing + claim flow, `payment_mode='full'` events only. **Gate: real demand.** | ~1.5–2 sessions |

Dependencies: none on other proposals; Phase 1 *satisfies* the dynamic-pricing price-lock prerequisite. Every phase ends with `npx tsc --noEmit`, test rows on `90000000xx`, and the founder deploying edge functions.

## 10. Open questions for the founder (ask before Phase 1)

1. Minimum payable amount after discounts — ₹1 floor, ₹49 floor, or allow true ₹0 (skip PayU)?
2. Referral reward sizes — give ₹X / get ₹X: what's X? (Suggest ₹100/₹100 to start; it's tunable per code.)
3. Credit expiry — 90 days? (Recommend yes: expiring credits drive bookings; forever-credits are a liability line.)
4. Loyalty rule — from which event count, what %/cap, and does it stack with codes? (Suggest: 3rd `fully_paid`, 10%, cap ₹300, no stacking with other codes, credits OK.)
5. Milestone reward — free *advance* or free *full ticket* at 3 referrals?
