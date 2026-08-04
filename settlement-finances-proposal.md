# Settlement-based Finances — proposal

*Drafted 2026-08-02. Status: **NOT built** — awaiting founder go-ahead. Read-only feature, no money movement, no change to the booking flow.*

---

## 1. The problem in one sentence

Today the Finances numbers say *"guests paid us ₹X"* — but they never tell you *"₹Y actually reached our bank, ₹Z is still in transit, and PayU took ₹F in fees + ₹G GST along the way."*

### Why that gap exists

`get_performance_summary()` (the RPC behind the Performance tab and the "Made this month" / 6-month forecast) builds **committed profit** from `applications` rows and the **gross, guest-facing price** (`event_net_price(...)`), then subtracts marketer / manager / affiliate commissions. It is an excellent *forecast of what we earned* — but it has three blind spots, because it never looks at what PayU actually paid out:

1. **PayU's cut is invisible.** Every transaction is charged a payment-gateway fee (~1.8–2%) **plus 18% GST on that fee**. That money never reaches you, but today's "profit" counts it as if it did. On a ₹10L year that's a five-figure overstatement.
2. **"Paid" ≠ "in the bank."** A booking flips to `advance_paid`/`fully_paid` the instant the card clears, but PayU settles to your bank account on a ~T+1/T+2 cycle. There is currently no view of *cash actually landed* vs *cash still in flight*.
3. **No bank reconciliation.** When a lump sum lands in your bank, nothing ties it back to specific bookings. You can't answer "which bookings made up yesterday's ₹43,200 credit?"

This feature closes all three — as an **additive layer**, leaving the existing committed-profit forecast untouched.

---

## 2. What PayU's Settlement API gives us

**API:** Get Settlement Details — `command = get_settlement_details`
**Endpoint (prod):** `https://info.payu.in/merchant/postservice?form=2`
**Auth:** hash = `sha512(key|command|var1|salt)` — same signing pattern already used in `verify-pending-payments`, reusing the existing `PAYU_MERCHANT_KEY` / `PAYU_MERCHANT_SALT` env secrets.
**`var1`:** a **settlement date** (pull everything settled that day) *or* a **UTR** (pull one payout's lines).

Each returned line is one settled transaction. The fields we care about:

| PayU field | Meaning | Use |
|---|---|---|
| `payuid` | PayU's transaction id | **The join key** — equals our stored `payu_payments.mihpayid` |
| `txnId` | our merchant txnid | secondary match / sanity check |
| `amount` | gross transaction amount | reconcile against `payu_payments.amount` |
| `mer_net_amount` | **net amount actually settled to bank** | the real "cash in" number |
| `mer_service_fee` | PayU's fee | fee tracking |
| `mer_service_tax` + `cgst`/`sgst`/`igst` | 18% GST on the fee | GST **input credit** for the accountant |
| `mer_utr` | bank settlement reference (UTR) | matches the credit line on your bank statement |
| `txndate` / settlement date | when it settled | cash-in-bank timeline |
| `requestaction` / `SettlementType` | settlement vs refund/adjustment | keep refunds from being counted as income |

**One UTR → many transactions:** a single bank payout (one `mer_utr`) bundles many bookings. That's exactly why reconciliation is impossible by eye today, and trivial once we store the UTR per booking.

> ⚠️ **Prerequisite:** the Settlement API must be **enabled on our PayU merchant account**. Most accounts have it; some need PayU to switch it on. **Confirm with a single test call before building anything** (see Phase 0).

---

## 3. The join that makes this cheap

We already store **`mihpayid`** on every successful payment — written by `payu-webhook` (and the callback). PayU's settlement line returns the same id as `payuid`. So every settled rupee links back to the exact booking **using a column we already save**. No new matching logic, no guesswork.

```
payu_payments.mihpayid  ⇄  settlement.payuid
```

---

## 4. Data model

Additive only. Two options — **Option A recommended** for simplicity.

### Option A — columns on `payu_payments` (recommended)
Add nullable columns that fill in *after* a payment settles:

| Column | Type | Notes |
|---|---|---|
| `net_settled` | `numeric(10,2)` | `mer_net_amount` |
| `service_fee` | `numeric(10,2)` | `mer_service_fee` |
| `gst_on_fee` | `numeric(10,2)` | `mer_service_tax` (or cgst+sgst+igst) |
| `settlement_utr` | `text` | `mer_utr` |
| `settled_at` | `date` | settlement date |
| `settlement_synced_at` | `timestamptz` | when our sync last touched this row |

A booking is "in the bank" once `settled_at IS NOT NULL`; "in flight" while it's `success` but `settled_at IS NULL`.

### Option B — separate `payu_settlements` table
One row per settlement line, FK to `payu_payments` by `mihpayid`. Cleaner if PayU ever splits/partial-settles a single transaction across payouts. More join work in the RPC. **Only pick this if Phase 0 shows split settlements happen** for our account.

---

## 5. The sync job — `payu-settlement-sync` edge function

A new edge function, **mirroring the existing `verify-pending-payments`** pattern (same signing, same PayU host), run once a day by cron (Supabase scheduled function or an existing cron path):

1. `var1 = yesterday's date` (IST). Call `get_settlement_details`, hash-signed.
2. For each returned line where `requestaction`/`SettlementType` = a real settlement (not a refund/adjustment):
   - find the `payu_payments` row by `mihpayid = payuid`;
   - stamp `net_settled`, `service_fee`, `gst_on_fee`, `settlement_utr`, `settled_at`.
3. Log any settlement line whose `payuid` has **no matching row** (should be ~zero; flags a data gap worth an admin ping).
4. Idempotent: re-running the same date just re-stamps the same rows — safe to backfill a range on first run.

**Read-only against PayU. No money moves.** Deploy is owner-gated per the project rules (never auto-deploy edge functions).

---

## 6. RPC / data changes

Keep `get_performance_summary` (the forecast) **exactly as is** — it's the right tool for "what we're on track to earn." Add cash truth **alongside** it, either as new keys in that RPC or a small sibling `get_settlement_summary()`:

- `gross_collected` — sum of `payu_payments.amount` (success)
- `payu_fees` — sum of `service_fee`
- `payu_gst` — sum of `gst_on_fee`
- `net_in_bank` — sum of `net_settled` where `settled_at IS NOT NULL`
- `awaiting_settlement` — gross of `success` rows where `settled_at IS NULL`

All founder-gated (`is_admin_strict`) like the existing money RPCs.

---

## 7. Finances tab — what the founder sees

A new **"Cash & settlements"** strip on the Performance tab, visually distinct from the forecast card:

```
Gross collected      ₹ 4,82,000
– PayU fees          ₹    8,676
– GST on fees        ₹    1,562
= Net in bank        ₹ 4,71,762     ✅ landed
Awaiting settlement  ₹   37,500     ⏳ in transit (T+1/T+2)
```

Plus (optional, Phase 3): a **settlement/UTR drill-down** — click a UTR to see the bookings inside that payout, so a bank-statement line can be reconciled in one click.

**Wording guard:** the app already uses "settle"/"settled" for the *internal* marketer/manager payout actions. This feature is **PayU→bank settlement** — label it clearly ("Cash in bank", "PayU settlement") so the two never blur.

---

## 8. Rollout phases

- **Phase 0 — validate (½ day).** One-off test call to `get_settlement_details` for a recent date. Confirms the API is enabled on our account and shows the real field shape before we design against assumptions. *If it's not enabled → stop, ask PayU to enable, no code written.*
- **Phase 1 — data.** Add columns (Option A). Build + deploy `payu-settlement-sync`; backfill the last ~90 days.
- **Phase 2 — numbers.** Add the net/fee/GST/in-bank/in-transit figures to the RPC + the "Cash & settlements" strip.
- **Phase 3 — reconciliation (optional).** UTR drill-down + a flag when a settlement line has no matching booking.
- **Phase 4 — forecast upgrade (optional).** Investigate the **Expected Settlement Details API** (predicts the *upcoming* payout amount + date before it lands) to feed the 6-month forecast. Spec to be confirmed from the public docs at build time.

---

## 9. Risks & caveats

- **API must be enabled** on the merchant account (Phase 0 gate).
- **Refund/adjustment lines** must be excluded from "income" — filter on `requestaction`/`SettlementType`.
- **Timezone:** settlement dates are IST; keep the daily job on IST to avoid off-by-one-day misses.
- **Partial/split settlements:** if a single transaction ever settles across two payouts, Option A's single-row model loses the detail → that's the trigger to switch to Option B. Phase 0 tells us which.
- **Deploy discipline:** new edge function → owner deploys (or grants one-off approval); never auto-deployed. No production booking rows are touched — only new nullable columns are written.

---

## 10. Explicitly out of scope

- No change to the booking/payment flow, pricing, or the committed-profit forecast math.
- Not in-app refunds — that's a **separate** proposal (`cancel_refund_transaction`); flagged, not bundled here.
- No subscriptions / recurring billing (doesn't fit the curated one-off-experience model).

---

## Decision checklist for the founder

1. **Do Phase 0** (test call) — yes / no? *(recommended first step; zero risk)*
2. Data model — **Option A** (columns) or wait for Phase 0 to decide A vs B?
3. Is the GST-input-credit view worth surfacing for your accountant, or internal-only?
4. Is the Phase 3 UTR→bookings reconciliation drill-down worth building, or is the net/in-transit strip enough?
```

**Sources:** [Get Settlement Details API](https://docs.payu.in/reference/get_settlement_details_api), [Settlement Reconciliation API](https://docs.payu.in/reference/settlement-reconciliation-api), [Verify Payment API](https://docs.payu.in/reference/verify_payment_api)
