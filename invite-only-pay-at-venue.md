# Invite-only Pay-at-Venue — verification + handoff

**Date:** 2026-08-28
**Status:** Finances migration + test-event data cleanup APPLIED to prod (2026-08-28). Code fixes (timeline default + invite greeting) done local, tsc-clean, **NOT pushed** — awaiting owner's push go-ahead. See **Part 6 — Implementation status**.
**Related:** `PAY-AT-VENUE-BUILD-HANDOFF.md`, `pay-at-venue-design-brief.md`, auto-memory `pay-at-venue-live`, `open-event-flow-design`.

---

## TL;DR

Pay-at-Venue (PAV) was built and shipped for **open** (payu-hosted) split events. The **payment + access + commission plumbing is flow-agnostic and already works for invite-only (native-application) split events too** — a guest who applies → is invited → pays the advance lands in the group chat and can settle the rest at the venue, and all three commission types (marketer / manager / creator) accrue correctly.

What was **never built** is the invite-only *presentation* of PAV:
- the admin timeline editor has no invite-PAV default (it only reshapes **open** events),
- the `/plans` calendar CTA and booking-timeline shape fall back to open-event data on a copied event,
- and the **Finances forecast mis-buckets every PAV event into the current month** because PAV has no balance-due date.

The test event `Chill-pill in Himalayas` only half-works because it is a **copy of the open `sunrise-at-kovalam`** and is carrying stale open-event data (Calendar CTA + per-date booking steps). A *freshly built* invite event flipped to PAV would behave differently again (see Part 3).

---

## Background — the two surfaces an invite+PAV event lives on

| Surface | File | Role |
|---|---|---|
| **`/plans`** (discovery + application front door) | `src/AppFlow.tsx` | Lists all events. Tap → event details → calendar sheet → booking-timeline → **application form**. This is where the guest *applies*. |
| **`/invite`** (payment flow after approval) | `src/App.tsx` | The invite chat. Guest pays the advance, gets the group chat, later settles the balance. This is where the *money + access* happen. |

Two independent flags matter and are **not** the same thing:
- `booking_url = 'native-application'` → drives `isNativeApplicationFlow` (the native invite flow). All 7 invite events on prod have this.
- `invite_only` (a separate boolean column) → drives the "Apply Now" CTA fallback and some copy. Also `true` on all native-application events.
- `pay_at_venue` (boolean) → the PAV modifier on `payment_mode='split'`.

---

## Part 1 — The three reported symptoms

### ① Calendar CTA shows "Book Now" instead of "Apply Now"
**Root cause: stale DATA, not a code bug.**

The calendar CTA at [`AppFlow.tsx:5406`](src/AppFlow.tsx#L5406):
```
quick_info 'Calendar CTA' value  ||  (event.inviteOnly ? 'Apply Now' : 'Book Now')
```
`invite_only` is `true`, so the code fallback would correctly say "Apply Now". But the event's `quick_info` carries an explicit **`Calendar CTA = "Book Now"`** row, inherited when it was copied from the open `sunrise-at-kovalam`. The explicit override wins.

Nothing resets that `Calendar CTA` value when `booking_url` is flipped to `native-application`. The booking-timeline CTA (a different field, `cta_label = "Continue"`) is also a copied value.

### ② `/plans` booking timeline shows no application step
**Root cause: stale DATA + a real code gap.**

The customer render prefers **per-date** steps over event-level steps ([`AppFlow.tsx:2670-2671`](src/AppFlow.tsx#L2670)). The event's `event_dates.booking_steps` (30 Aug) is the **open-event PAV shape**:
> `pay advance` → `plan group-chat link` → `remaining balance` → `{application_count} going`

There is no "Request Invitation" row — it is the open structure, left over from when this was an open event. The event-*level* `booking_steps` **is** a correct invite 5-step (with the vibe-check/application row), but per-date wins, so the customer never sees it.

The admin editor **cannot repair this by re-saving**, which is the deeper gap:
- `nativeDefaultBookingSteps()` ([`AdminPanel.tsx:160`](src/AdminPanel.tsx#L160)) and the editor's `nativeDefaultSteps` ([`AdminPanel.tsx:3704`](src/AdminPanel.tsx#L3704)) have **no `pay_at_venue` branch**. The PAV reshaping (group-chat row, dropped meeting-spot) lives only in `openDefaultSteps`, gated behind `isOpenApp` ([`AdminPanel.tsx:3723-3747`](src/AdminPanel.tsx#L3723)).
- `bookingStepsMatchMode()` ([`AdminPanel.tsx:187`](src/AdminPanel.tsx#L187)) treats the open-PAV steps as a valid "match" for a native event — it only checks for a `{balance}` row + a `group-chat` row, **not** for the invite/application row — so the heal at [`AdminPanel.tsx:3760`](src/AdminPanel.tsx#L3760) keeps the stepless-of-application steps as-is.

### ③ Flow correctly ends in the application form — CORRECT
The `isNativeApplicationFlow` branch ([`AppFlow.tsx:2840-2849`](src/AppFlow.tsx#L2840)) drives the button to `setShowApplicationForm(true)` regardless of PAV. Intact.

---

## Part 2 — Background logic verification (the end-to-end research)

All commission triggers fire on `applications.status → 'fully_paid'` from a non-fully_paid state (live definitions dumped from prod, ahead-of-migrations discipline observed):

> **Cross-cutting fact for PAV:** the advance flips the row to `advance_paid` (NOT fully_paid). The **balance-at-venue** payment is what flips it to `fully_paid`. So for a PAV event, **every commission and every "committed" full-price forecast is only *realized* when the guest settles at the venue** — on/near the event day, not weeks before. This is correct behaviour, but it shifts *timing* and *collection risk* versus a normal split event (whose balance is collected online before the event).

### A. Payment plumbing — ✅ works, unchanged by PAV
Advance → PayU → `advance_paid`; balance → PayU → `fully_paid`. `create-payu-order` derives payment_type from `events.payment_mode`; PAV changes no pricing. `event_net_price(slug, city, 'advance'|'full')` and the balance = `full − advance` netting are PAV-agnostic.

### B. Marketer attribution — ✅ works, full commission
`accrue_marketer_sale()`:
- amount = `COALESCE(e.marketer_commission, call_marketers.commission_amount)`.
- The **two-tier half/full open-lead logic is gated on `is_open_event(slug)`** → for an invite event this is `false`, so an invite PAV lead always accrues the **FULL** marketer commission. Correct.
- Accrues at `fully_paid` = balance-at-venue.
- `assigned_marketer_id` is pinned on the row at INSERT (apply time). The re-stamp guard only re-stamps leads whose `status NOT IN ('advance_paid','fully_paid','rejected')`, so once the advance is paid the owning marketer is locked in — identical to a normal split event. ✔
- **Behavioural note (not a bug):** a PAV lead who pays the advance but never settles the balance (no-show) stays `advance_paid` forever → **the marketer never accrues**. Under normal split, the online balance is usually collected before the event; under PAV, marketer payout now depends on the guest showing up and paying at the door.

### C. Manager attribution — ✅ works
`accrue_manager_sale()` accrues `COALESCE(e.manager_commission, managers.commission_amount)` at `fully_paid`, keyed on the pinned `assigned_manager_id`. PAV-agnostic. Same at-venue timing note as marketers.

### D. Creator / affiliate attribution — ✅ works
`accrue_affiliate_sale()` fires at `fully_paid` with `affiliate_id` set: amount = flat `affiliate_commission` if > 0, else `pct% × affiliate_full_price(slug, city)`.
- `affiliate_id` is stamped **at application INSERT** (via `affiliate_code` → BEFORE-INSERT trigger; [`AppFlow.tsx:551-554`](src/AppFlow.tsx#L551)), i.e. at *apply* time, and is not re-resolved on the balance UPDATE. So attribution is stable and does **not** depend on the guest's browser session being intact at the venue. ✔
- Realized at balance-at-venue (same timing note).

### E. `/invite` booking timeline + chat — ✅ timeline works; ⚠️ greeting copy gap (FIXED)
The post-invite `InviteBookingTimeline` ([`App.tsx:3400+`](src/App.tsx#L3400)) is **regex-driven, not index-driven**, so it is robust to reshaped steps:
- `balanceDueDate` is ignored for PAV ([`App.tsx:3396`](src/App.tsx#L3396)).
- balance badge = **"At the Venue"** for PAV ([`App.tsx:3514`](src/App.tsx#L3514)); `isVenueBalanceRow` covers the pre-advance case ([`App.tsx:3524`](src/App.tsx#L3524)).
- the group-chat row is deliberately **filtered out** of this timeline ([`App.tsx:3421`](src/App.tsx#L3421), [`3428`](src/App.tsx#L3428)) because a live "Join Groupchat" button sits beside it.
- **group chat unlocks at `advance_paid`** for PAV ([`App.tsx:2586`](src/App.tsx#L2586)) — flow-agnostic, works for invite. The action chips are correct too: `payLast` demotes the Pay Balance chip and Join Groupchat leads once the advance is paid ([`App.tsx:2827`](src/App.tsx#L2827), [`2854`](src/App.tsx#L2854)).

⚠️ **NEW gap found while building the fix — the chat *greeting text* had no PAV branch.** The PAV greeting copy lived only in `openGreeting` (used for open events); `inviteGreeting` ([`App.tsx:2674`](src/App.tsx#L2674)) had none. So an invite-PAV **advance-paid** guest read the generic "we'll add you to the plan group chat & share meeting-point details by {date}" — future tense, directly contradicting the Join Groupchat button that was already live beside it (the group chat is open at `advance_paid`), and implying an online balance deadline that doesn't exist. Unpaid invite-PAV leads likewise never heard "hold it with a small advance, settle the rest at the venue." **Fixed** (Part 6): added an advance-paid PAV branch and an unpaid PAV branch to `inviteGreeting`.

⚠️ **Fragility to respect (still true):** the invite chat greeting reads `bookingSteps[2]` as balance and `[3]` as meeting-spot by **fixed index** ([`App.tsx:2607`](src/App.tsx#L2607), [`2620`](src/App.tsx#L2620)). The new invite-PAV shape puts group-chat at index 2 and balance at 3 — but the PAV greeting branches anchor to the event date, not those indices, so it stays safe. Don't wire PAV copy to `bookingSteps[2]/[3]`.

⚠️ **Fragility to respect when building the fix:** the invite *chat greeting* (not the timeline) reads `bookingSteps[2]` as the balance step and `bookingSteps[3]` as the meeting-spot step by **fixed index** ([`App.tsx:2607`](src/App.tsx#L2607), [`2620`](src/App.tsx#L2620)). An invite-PAV shape that inserts a group-chat row before the balance would shift balance to index 3. Those two values are **not shown in the PAV greeting branches** (they use `eventDateFormatted`), so PAV is currently safe — but any new invite-PAV default must keep this in mind (see Part 4, fix #1 layout note). `App.tsx` prefers per-date steps too ([`App.tsx:1438`](src/App.tsx#L1438)).

### F. Finances tab — ⚠️ one real bug + one design call
`get_performance_summary()` (live def):

1. **Forecast month-bucketing is BROKEN for PAV — real bug.**
   `ev_balmonth` extracts the balance-due month from the **event-level** `booking_steps` step whose value is exactly `{balance}` and has a non-empty date. PAV strips the balance date, so `bal_date` is **always NULL** for a PAV event. `ev_bucketed` then does `COALESCE(bal_date, m0)` → **every PAV event's committed profit is dumped into the CURRENT month** instead of the month the event actually happens. `this_month_profit` is inflated by future PAV events and later months read empty. (A normal split event avoids this only because the admin sets a balance-due date.)

2. **`committed_total` / forecast profit is optimistic for PAV — design call.**
   `ev_committed` books the **full** net profit for any lead with `status IN ('advance_paid','fully_paid')`. For PAV that means the full profit is "committed" the moment the advance is paid, even though the balance is only collected at the venue (no-show risk). This is the same rule as normal split; flag for the owner whether PAV committed profit should be discounted or counted only at `fully_paid`.

3. **Per-event revenue cards are accurate.** `advance_collected` / `balance_collected` / `full_collected` come from real `payu_payments`; a PAV event shows only the advance until the venue collection fills in the balance. Correct (reflects real cash), just understated until event day.

---

## Part 3 — The core design gap

**There is no invite-aware PAV timeline.** For a *fresh* invite event flipped to PAV (not copied from an open one), the admin editor generates the plain invite 5-step — meeting-spot row still present, **no group-chat step** — so the "you're in the group the moment you pay the advance, settle the rest at the door" story that makes PAV convert is never *told* on the `/plans` timeline, even though it *happens* in the flow (`App.tsx` unlocks the group chat at advance). The application step would show correctly; the PAV narrative would not.

Target invite-PAV split timeline (mirror of the open-PAV shape, but keeping the invite application step):

```
[0] vibe check            Request Invitation        (Now)
[1] if you're invited     {advance}                 (After Invitation)
[2] you'll receive        plan group-chat link      (After Advance)
[3] remaining balance     {balance}                 (At the Venue)
[4] {application_count} ppl have requested invitation   <title>   (yellow event-date card)
```

The customer render already has the pills for every row (`isAfterInviteRow`, `isGroupChatRow` → "After Advance", `isVenueBalanceRow` → "At the Venue"), so once the *steps* carry these rows the `/plans` timeline renders the full invite-PAV story with no render change.

---

## Part 4 — Proposed fixes (prioritized, NOT yet applied)

### Priority 1 — Finances forecast bug (data integrity)
**Fix `get_performance_summary()` `ev_balmonth` / `ev_bucketed`:** when an event has no balance-due date (all PAV events, and any split event with an unset balance date), bucket its committed profit by the **event's own date** (`event_dates.start_date`, e.g. the earliest upcoming date) instead of falling through to the current month. Migration + live-def update; founder-gated (`is_admin_strict`) exactly as now.
- Also surface to the owner the design call in Part 2.F.2 (count PAV committed profit at advance vs at fully_paid).

### Priority 2 — Invite-PAV timeline default (the design gap)
1. Add a `pay_at_venue` branch to **`nativeDefaultBookingSteps()`** ([`AdminPanel.tsx:160`](src/AdminPanel.tsx#L160)) and the editor's **`nativeDefaultSteps`** ([`AdminPanel.tsx:3704`](src/AdminPanel.tsx#L3704)) producing the 5-row invite-PAV shape above (`fixedRowCount` stays 5). Layout note: put the group-chat row at index 2 and balance at index 3 for the *customer* story, but verify the `App.tsx` fixed-index greeting reads (Part 2.E) — the PAV greeting doesn't use them, so this is safe, but leave a comment so a future edit doesn't reintroduce a bug.
2. Make **`bookingStepsMatchMode()`** ([`AdminPanel.tsx:187`](src/AdminPanel.tsx#L187)) invite-aware: for a native event, require the vibe-check/Request-Invitation row, so open-PAV steps are *not* accepted as a match and the heal regenerates the invite-PAV default.
3. Also branch `regenNativeBookingSteps()` so a Split→PAV toggle regenerates the invite-PAV shape.

### Priority 3 — Stale Calendar CTA on flow flip
When `booking_url` flips to `native-application` (or on the PAV toggle), clear/re-default the `quick_info 'Calendar CTA'` value so a copied open-event "Book Now" can't persist. The customer fallback already resolves to "Apply Now" via `invite_only`.

### Priority 4 — Test-event data cleanup (`Chill-pill in Himalayas`)
- Remove the `quick_info` row `Calendar CTA = "Book Now"`.
- Regenerate the per-date `event_dates.booking_steps` (30 Aug) to the invite-PAV shape in Part 3 (currently the open-PAV shape with no application step).
- Note: production DB is live-customers — this event is `is_active = false`, so it's safe, but still verify with `RETURNING`.

---

## Part 5 — Evidence (prod snapshot, project `txcmismkdttgsyhbnexf`, 2026-08-24)

**Events (native-application = invite):** all 7 have `invite_only = true` and `cta_label = 'Request Invitation'` except the PAV/copied ones. PAV is on for exactly two events:

| slug | title | booking_url | invite_only | payment_mode | pay_at_venue | is_active |
|---|---|---|---|---|---|---|
| `sunrise-at-kovalam-copy-1777660218667` | Chill-pill in Himalayas | native-application | true | split | **true** | false |
| `founders-meet` | Founders Meet | payu-hosted (open) | false | split | true | **true** |

**`Chill-pill in Himalayas` stale data:**
- `quick_info` includes `{ label: 'Calendar CTA', value: 'Book Now' }` ← drives symptom ①.
- event-level `booking_steps` = correct invite 5-step (`vibe check / Request Invitation` … `{application_count} ppl have requested invitation`).
- per-date `event_dates.booking_steps` (30 Aug) = **open-PAV 4-step**: `pay advance` → `plan group-chat link` → `remaining balance` → `{application_count} going` ← no application step; drives symptom ②. `whatsapp_group_url` is set.

**Live commission triggers** (all `SECURITY DEFINER`, fire on `status → 'fully_paid'`): `accrue_marketer_sale` (open two-tier gated on `is_open_event` → full for invite), `accrue_manager_sale`, `accrue_affiliate_sale`. **Finances:** `get_performance_summary` — `ev_balmonth` reads event-level `{balance}` date only → NULL for PAV → current-month mis-bucket.

---

## Part 6 — Implementation status

Decision locked (owner, 2026-08-28): **drop** the meeting-spot row for invite-PAV, mirror open-PAV (Part 4 fix #2, was open question #2).

### ✅ Done — code (local, `npx tsc --noEmit` clean, NOT pushed)
**`src/AdminPanel.tsx` — invite-PAV timeline default (Part 4 #2):**
- `nativeDefaultBookingSteps()` takes a `payAtVenue` arg and returns the 5-row invite-PAV shape (`vibe check → advance → group-chat link → balance → event-date card`; meeting-spot dropped).
- editor's inline `nativeDefaultSteps` gained the matching `trip.pay_at_venue` branch (kept in sync with the function).
- `bookingStepsMatchMode()` gained `requireInviteRow`; the native `defaultSteps` call now passes `(…, !!pay_at_venue, true)` and the per-date heal passes `isNativeApp` — so open-PAV steps (no application row) no longer count as a "match" for a native event and get regenerated.
- `regenNativeBookingSteps()` takes `payAtVenue` through; meeting-date anchor tightened to `meeting spot|meeting point` (so the group-chat "you'll receive" row can't be mistaken for a meeting row); group-chat row forced date-less.
- payment-mode switch passes the resolved `payAtVenue` into the regen; **the PAV toggle now regenerates a native event's booking_steps in place** (swap meeting-spot ↔ group-chat) instead of only flipping the flag.

**`src/App.tsx` — invite chat PAV greeting (Part 2.E, new gap):**
- added `isPayAtVenue` local; `inviteGreeting` now has an advance-paid PAV branch ("your spot is reserved 🙌 — join the group chat now, pay the rest at the venue") and an unpaid PAV branch ("pay {advance} to reserve — settle the rest at the venue", with the same >0.50 scarcity escalation).

### ✅ Applied to prod — Finances forecast (Part 4 #1)
`supabase/migrations/20260828_pav_forecast_event_date_bucketing.sql`, applied via Supabase MCP `apply_migration` on 2026-08-28 (name `pav_forecast_event_date_bucketing`). Only the `ev_balmonth` CTE changed: **for PAV split events** (`pay_at_venue AND payment_mode='split'`), when there's no balance-due date it falls back to the event date (earliest upcoming `event_dates.start_date`, else latest). Scoped deliberately to PAV split — single-payment events are already collected (stay current-month) and normal split events carry a real balance date. Full live def reproduced verbatim except that one CTE; `committed_total`'s advance-vs-fully_paid rule unchanged. Verified: function contains the PAV gate and executes without error; read-only simulation confirmed no other event's bucket moves. Old definition preserved in this doc's Part 5 evidence if a rollback is ever needed.

### ✅ Done on prod — data cleanup for `Chill-pill in Himalayas` (Part 4 #3/#4)
Direct DB writes on 2026-08-28 (event is `is_active=false`), each with `RETURNING`:
- removed the stale `quick_info` row `Calendar CTA = "Book Now"` (7→6 rows) → the CTA now resolves to "Apply Now" via the `invite_only` fallback.
- rewrote **both** the per-date `event_dates.booking_steps` (30 Aug) **and** the event-level `events.booking_steps` to the invite-PAV shape (`vibe check → advance → group-chat link → balance → event-date card`); `whatsapp_group_url` left intact.

### Remaining open questions for the owner
1. Finances: for PAV, count committed profit at **advance** (current, optimistic) or only at **fully_paid** (conservative)? (Part 2.F.2) — *not touched by the migration above; separate decision.*
2. Should the marketer/manager/creator dashboards flag PAV leads whose commission is "pending until they settle at the venue", given the no-show risk (Part 2.B)?
3. Push/deploy sequencing: the two code files (`AdminPanel.tsx`, `App.tsx`) are separate concerns — ship as two commits, or one "invite-PAV" batch?

---

## Part 7 — Flow-flip staleness works in BOTH directions (found 2026-08-29)

Flipping `Chill-pill in Himalayas` back to an **open** (payu-hosted) event surfaced the mirror image of the original bug — and one genuinely broken checkout.

### The trigger
`booking_url` was flipped invite → open, but two fields kept their invite-era values:
- `invite_only` stayed `true`
- `booking_steps` / per-date `event_dates.booking_steps` kept the invite-PAV shape (with the `vibe check / Request Invitation` row)

Reference for what "correct open PAV" looks like: `founders-meet` has event-level `booking_steps = null` and per-date = `pay advance → plan group-chat link → remaining balance → {application_count} going`.

### Symptom 1 — "Request Invitation" on an open event (cosmetic)
The customer `/plans` render reads stored per-date steps **directly and never heals them**. Its filter chain drops meta rows, balance rows (single-pay) and blank rows — but had **no application-phase filter**, so an invite-era row rendered on a flow that has no invitation at all. (`isAfterInviteRow` is already `!isPayUFlow`-guarded, so the row rendered *bare*, with no pill — visible in the reported screenshot.)

### Symptom 2 — the checkout was BROKEN (critical)
[`AppFlow.tsx:2885`](src/AppFlow.tsx#L2885) branch order is:
```
isNativeApplicationFlow ? (application form)
: selectedEvent.inviteOnly ? (BLACK button → openExternalUrl(bookingUrl))
: isPhonePeFlow ? … : isPayUFlow ? (YELLOW button → details form)
```
With `booking_url='payu-hosted'` **and** a stale `invite_only=true`, the event fell into the **external-redirect** branch before ever reaching `isPayUFlow`. That rendered the black "Continue" button in the report, and tapping it called `openExternalUrl("payu-hosted")` — a sentinel, not a URL. **The open booking flow dead-ended; no payment was reachable.** This is why the button colour differed from Founders Meet (yellow).

### Fixes applied
**Code** (`src/AppFlow.tsx`, `src/AdminPanel.tsx` — tsc clean, NOT pushed):
1. `) : selectedEvent.inviteOnly && !isPayUFlow ? (` — a payu-hosted event can never be hijacked into the external-redirect branch by a stale flag. (PhonePe left alone: its `bookingUrl` is a real URL.)
2. Customer render drops application-phase rows for open events:
   `.filter(s => isPayUFlow ? !/vibe.?check|request.?invitation/i.test(...) : true)`
3. `bookingStepsMatchMode()` gained a tri-state `inviteRow: 'require' | 'forbid' | 'any'`. Native passes `'require'`, open passes `'forbid'` (per-date heal passes whichever matches the flow). Previously the invite-PAV steps *satisfied* the open check (they have balance + group-chat rows), so the admin editor happily kept them — the exact mirror of the native-side bug fixed in Part 4.

**Data** (prod, guarded + `RETURNING`): `invite_only = false`; event-level and per-date `booking_steps` rewritten to the open-PAV shape; `whatsapp_group_url` untouched.

### Verified in-browser (open PAV, Chennai, Aug 30)
Calendar CTA = **"Book Now"** (yellow) · timeline = `pay advance ₹1 (Now) → plan group-chat link (After Advance) → remaining balance ₹1 (At the Venue) → Chill-pill in Himalayas (Aug 30)` · Continue (**yellow**) → `?sheet=details-form` with Name/WhatsApp/Email/**Get OTP**. Matches Founders Meet.

### Takeaway for the roadmap
`booking_url`, `invite_only`, `cta_label`, `quick_info['Calendar CTA']`, `booking_steps` and per-date `booking_steps` are **six fields that must agree on the flow**, and nothing keeps them in sync when the flow is flipped or an event is copied across flows. The heals above are defensive patches at the read sites. A proper fix is a single "change flow" action in the admin that rewrites all six together — worth doing before this pattern bites on a live paid event.
