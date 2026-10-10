# Pay at venue — build handoff

Self-contained build plan. A fresh session should be able to execute this without re-exploring the codebase. Design is settled (option 7A, embedded below); this document is about implementation.

---

## 1. What the feature is

chapter அ sells social experiences in India. A first-time customer is being asked for a full ticket price by a brand they've never met. The founder's thesis: let them **pay a small advance online to reserve, and the rest at the venue** — after they've arrived and seen the event is real — and more people convert.

**"Pay at venue" is not cash.** The balance is still a normal online PayU payment, made on the same website, on the guest's phone, standing in front of the host. Nothing about money handling, statuses, or accounting changes. If you find yourself designing cash reconciliation, you have misread the feature.

Mechanically it is a **boolean flag on an event**, meaningful only when `payment_mode = 'split'`. It applies to both invite-only (`booking_url = 'native-application'`) and open (`booking_url = 'payu-hosted'`) events.

---

## 2. Verified facts — do not re-investigate

A prior session traced the whole flow end to end. These are confirmed, with references:

1. **`payment_mode = 'split'` already works on open events.** `create-payu-order` only special-cases `'full'` (`supabase/functions/create-payu-order/index.ts:243`); split falls through and charges the advance. No backend work is needed to charge the advance on an open event.
2. **The balance payment flow already exists and completes itself.** `payu-callback` flips the guest to `fully_paid` when PayU confirms (`supabase/functions/payu-callback/index.ts:656`). Marketer, manager and creator commissions all accrue off `fully_paid` and are untouched by this feature.
3. **The venue return path already works.** After any advance payment, `advance_success_dpl` goes out over WhatsApp with a deeplink button carrying `?phone=&name=` (`payu-callback/index.ts:136`, `:317`). That lands in `/invite`, which resolves the guest **by phone** via `findInviteMatches` (`src/App.tsx:1592`) — candidates are built from their `applications` rows with no invite-only filter, so open events are included — and because their status is `advance_paid`, `prepareNativeInviteFlow` renders a balance bill (`src/App.tsx:1339`). Nothing needs building for the venue moment itself.
4. **Therefore this is a presentation feature.** One column, one admin control, one pricing card.

---

## 3. Plumbing notes that will save you an hour

- `fetchEvents` and `fetchEventByIdOrSlug` in `src/supabase.ts` select `*`, so a new column reaches `mapDbEventToEvent` automatically — you only add the mapping line.
- `AdminPanel.tsx` reads events with `select('*', ...)` and saves with a spread (`const { event_dates, ..., ...fields } = tripWithSlug` → `.update(fields)`, `src/AdminPanel.tsx:2223`). There is **no column whitelist**, so a new field saves automatically once it exists on the `Trip` type.
- ⚠️ **`src/App.tsx` uses three explicit column lists** for the invite flow — lines **1259**, **1266**, and **3574**. A new column that isn't added to all three will be `undefined` in the invite flow. This is the single most likely way to ship this feature broken: it will look correct in admin and on open events, and silently do nothing on invite-only events.

---

## 4. Safety rules (from CLAUDE.md — non-negotiable)

- **The Supabase DB is production with live customers.** Test rows use phone `90000000xx`; verify writes with `RETURNING`; delete test rows afterwards.
- **Pushing to `main` deploys the live site.** Never `git push` without the founder's explicit go-ahead in that same conversation turn.
- **Never deploy edge functions.** The founder deploys.
- `npx tsc --noEmit` must pass after every code edit.
- One concern per commit; commit messages explain the *why*.
- The founder is **no-code** — explain plans and tradeoffs in plain language, never assume they can edit code or run SQL themselves.

---

## 5. One unresolved question — get an answer before Phase 3

The design spec says the primary CTA should read **"Book Now →" and not "Apply Now"**. That conflicts with existing behaviour (`src/AppFlow.tsx`, calendar sheet CTA):

```
event.quickInfo?.find(i => i.label === 'Calendar CTA')?.value?.trim()
  || (event.inviteOnly ? 'Apply Now' : 'Book Now')
```

Two problems with forcing it:
1. There is already a per-event admin override ("Calendar CTA" in Quick Info) that hardcoding would ignore.
2. On an invite-only event the guest at this moment genuinely *is* applying — they cannot pay until approved. "Book Now" promises a booking the flow won't deliver for another day or two.

**Recommendation: leave that line untouched.** It already resolves to "Book Now" on open events, which is what the spec actually wants, and it preserves the override. The rule appears to have been written with only the open-event case in mind. Confirm with the founder before doing anything else here.

---

## 6. The design spec — option 7A (final)

Replaces the pricing card inside the calendar bottom sheet, `src/AppFlow.tsx` (~line 5253) — the `bg-gray-50 rounded-2xl` card currently showing "Advance" left and "Remaining Balance" right, above the Contact Us / Book Now buttons.

Applies **only** when `payment_mode = 'split'` **and** the pay-at-venue flag is on. Split events without the flag keep today's card. Full-payment events keep the centred "Entry Ticket" card. This is a **third branch** of the existing conditional, not a replacement of either.

### Layout

Two gray tiles side by side, separated by a gap. The advance tile is 1.5× the width of the pay-at-venue tile. Between them, a bare `+` with a short 12px hairline tick above and below. The two CTAs sit below, unchanged.

```
┌───────────────────────────┐   │   ┌─────────────────┐
│ Advance                   │   +   │   Pay at venue  │
│ ₹100                      │   │   │            ₹199 │
└───────────────────────────┘       └─────────────────┘

[  Contact Us  ] [     Book Now →     ]
```

### Rules

- Both tiles use the **same** background — no tint, no highlight, nothing greyed out. Emphasis comes only from tile width and number size.
- Advance tile contents are **left-aligned**; pay-at-venue tile contents are **right-aligned**, so the amounts sit at the outer edges of the card.
- Labels are **sentence case at normal letter-spacing** — not uppercase, not tracked out.
- The `+` has **no pill, circle, or background**. It sits in the gap with hairline ticks above and below.
- The full ticket price is **never shown** on this card. Deliberate: avoids sticker shock, and the `+` signals the amounts sum rather than stack.

### Values

| Element | Value |
|---|---|
| Tile background | `#f7f8f9` |
| Tile radius | 20px |
| Grid | `1.5fr / 34px / 1fr` |
| Advance tile padding | 20px top, 18px sides, 22px bottom |
| Venue tile padding | 20px top, 14px sides, 22px bottom |
| Label — advance | 14px, weight 600, `#8b8f98` |
| Label — pay at venue | 13px, weight 600, `#8b8f98` |
| Amount — advance | 36px, weight 800, `#12151b`, letter-spacing −0.03em |
| Amount — pay at venue | 24px, weight 800, `#12151b`, letter-spacing −0.02em |
| Label→amount gap | 6px |
| Seam ticks | 1px × 12px, `#e4e6e9`, 7px gap either side of the `+` |
| `+` | 16px, weight 800, `#9aa0aa`, no background |
| CTA gap | 12px |
| Contact Us | `#FFF3BF` fill, `#f0dd91` border, `#b38200` text, 14px radius |
| Book Now | `#FFD700` fill, `#16181d` text, 14px radius |

### Copy

- Left label: **Advance**
- Right label: **Pay at venue**
- Secondary CTA: **Contact Us**
- Primary CTA: **Book Now →** — but see §5 first.
- **No reassurance line in the sheet.** The "pay the rest on your phone once you're there" message belongs in the WhatsApp confirmation instead.

---

## 7. Phases

Each phase is independently shippable and safe to stop after. Do them in order.

### Phase 1 — database column ⚠️ founder approval required

Add the flag:

```sql
alter table events
  add column pay_at_venue boolean not null default false;
```

`default false` means every existing event is unaffected the moment it lands — no behaviour change, nothing to backfill.

**Do not run this without the founder explicitly approving it in that conversation turn.** It is a production database. Show them the statement in plain language first ("this adds a new on/off setting to every event, switched off by default"), and confirm with a `SELECT` afterwards that the column exists and no event has it on.

If the founder wants to hold off, Phases 2 and 3 can still be *written* — they just won't function until the column exists. Do not fake the column client-side to work around this.

### Phase 2 — plumbing (no visible change)

1. `src/supabase.ts` — add `payAtVenue: row.pay_at_venue ?? false` to `mapDbEventToEvent`, next to the existing `paymentMode` mapping (~line 112), and add the field to the `Event` type.
2. `src/AdminPanel.tsx` — add `pay_at_venue?: boolean` to the `Trip` type (near `payment_mode?: string`, ~line 67). Saving needs no other change (see §3).
3. **`src/App.tsx` — add `pay_at_venue` to the explicit select lists at lines 1259, 1266, and 3574.** See §3; skipping this is the classic failure mode.
4. `src/AppFlow.tsx` — add the field to whatever local event type carries `paymentMode` (~line 115).

Verify: `npx tsc --noEmit` passes, and the app renders identically to before. Nothing should look different yet.

### Phase 3 — admin checkbox

Under the Payment Mode segmented control in the event editor (`src/AdminPanel.tsx:9087`, immediately after the existing helper `<p>`):

- A checkbox labelled **"Pay at venue"**, rendered **only when** `(trip.payment_mode ?? 'split') === 'split'`.
- Helper text: *"Guests pay the balance on their phone at the event instead of before it. The balance due date is ignored."*
- Match the visual pattern of the neighbouring "Creator Commissions" toggle rather than inventing a new control.
- When Split is deselected (switched to Full), the flag should be written back to `false` so a hidden `true` can't linger on a full-payment event.

Verify: toggle it on a test event, save, reload the admin, confirm it persisted. Admin views are login-gated and not drivable in the preview server — verify with `tsc` plus a SQL `SELECT` on the event row.

### Phase 4 — unlock the group chat at `advance_paid` ⚠️ founder-decided, must ship with the feature

**This is the product's actual selling point, not a detail.** The founder's model: a customer who doesn't fully trust the brand pays half, gets into the WhatsApp group chat and sees the meeting spot, and pays the rest in person once they've seen it's real. Being in a group with other real people is what proves they weren't scammed. That is the whole reason the feature exists.

Today the group chat button is gated on **full payment**, in two places:

- `src/App.tsx:2800` — `{isFullyPaid && nativeEventData?.whatsappGroupUrl && ...}`
- `src/InvitePlanDetailsSheet.tsx:365` — `{isFullyPaid && whatsappGroupUrl && ...}`

On today's open events this is invisible, because they are all single-payment — one payment *is* `fully_paid`. On a split event, a guest who paid only the advance currently gets **nothing**, and would only receive the group chat after paying at the venue. That inverts the entire mechanism.

**The founder has explicitly decided: paying the advance unlocks the group chat.** Change both gates so `advance_paid` qualifies (the existing `isBalancePayment` prop is already true exactly when status is `advance_paid` — see `src/App.tsx:1339`).

Scope it deliberately. Applying it to **all** split events changes access policy for existing invite-only trips, which the founder has not asked for. Gate it on the pay-at-venue flag unless they say otherwise.

Also note (mechanism, don't break it): Meta blocks `chat.whatsapp.com` links inside AiSensy template buttons, so the WhatsApp message links back to the site and the site relays the real group URL. The button in the app is the delivery mechanism, not a convenience.

**Meeting spot:** the founder also wants this visible after the advance. The meeting-spot surfaces read from `pickup_points` and quick-info and are **not** gated on payment status (`src/App.tsx:1090`, `src/InvitePlanDetailsSheet.tsx:139`) — they already display, falling back to "To be shared". Verify rather than assume, but expect no change needed here.

**Operational consequence to raise with the founder if it hasn't been handled:** once the advance unlocks everything, the venue door check is the only point at which the balance can be collected. It is manual — the host confirms against the marketer's admin People list. Nothing in the software enforces it.

### Phase 5 — the calendar sheet pricing card

Implement §6 as a third branch of the existing conditional at `src/AppFlow.tsx:5253`. The current shape is:

```
event.paymentMode === 'full'
  ? (centred "Entry Ticket" card)
  : (advance / remaining-balance row)
```

Becomes a three-way: full → unchanged; split **and** `payAtVenue` → the new 7A card; split otherwise → unchanged.

The amounts come from the existing `getMeetingPointPricing(...)` call already in scope — `pricing.advance` and `pricing.total - pricing.advance`. Do not recompute pricing; per-meeting-point and per-city overrides are already handled there.

Tailwind arbitrary values (`bg-[#f7f8f9]`, `rounded-[20px]`, `font-extrabold`) will cover the spec's exact values. Note `font-extrabold` is weight 800 and `font-black` is 900 — the spec asks for 800.

Verify in the preview server (launch.json "Vite Dev Server", port 3000) on a split open event with the flag on: the card renders as specified, and split-without-flag plus full-payment events are visually unchanged. Check at a narrow mobile width — the sheet is capped at `max-h-[95%]` and vertical space is scarce.

---

## 8. Explicitly out of scope

Do not build these. They are deferred by the founder:

1. **The booking-timeline `{balance}` row.** Its date pill should eventually read "At the venue", mirroring how invite-only advance rows read "After Invitation" (`src/AppFlow.tsx:2718`). The founder wants to design this separately.
2. **The WhatsApp copy.** `advance_success_dpl`'s second parameter is currently the balance due date, from `pickBalanceDueStep` (`payu-callback/index.ts:307`), so the advance message tells a pay-at-venue guest to pay by a date. In the meantime, setting the balance due date to the event date makes the existing message read sensibly.

   **The founder's preferred fix:** rather than reword the template, fire the existing `single_payment_sucess_dpl` for pay-at-venue advance payments. It is already approved, and its two parameters are the amount and the meeting-spot details date (`pickMeetingSpotStep`) — no balance deadline. Before building it:

   - **Read the template's actual copy in AiSensy first.** If it says "fully paid" or "confirmed in full", it is wrong for a guest who still owes money at the venue, and this approach dies there. The parameters are visible in code; the wording is not.
   - **It fires from three places that must change together:** `payu-callback/index.ts:317`, `payu-webhook/index.ts:302`, and `verify-pending-payments/index.ts:311`. All three send identical params today. Changing only one means guests whose payment completes via webhook or reconciliation get the other message.
   - **The advance template carries `txnid` as its third parameter; the full template does not.** Switching drops the transaction reference from the message.
   - Implement by branching the campaign name and params **inside the existing advance sender**, so the `aisensy_advance_paid_sent` dedup flag keeps its meaning. Do not call the full-paid sender — it claims `aisensy_full_paid_sent`.

   All of this is an edge-function change. **Only the founder deploys edge functions.**
3. **Admin distinguishing "owes balance" from "didn't show up."** A pay-at-venue guest who never pays sits at `advance_paid` indefinitely, which on a normal split event means "chase them for money." Deferred.
4. **Host confirmation at the venue** is via the marketer's own admin People list — decided, and needs no build.

---

## 9. How to know it worked

On a split open event with the flag on, a guest should: see Advance ₹100 + Pay at venue ₹199 in the calendar sheet with no total shown → pay ₹100 through the normal open-event flow → land on `advance_paid` → receive the existing WhatsApp with its deeplink → tap it at the venue → arrive in `/invite`, recognised by phone, with the group-chat button and a bill for ₹199 → pay → flip to `fully_paid` with commissions accruing exactly as on any other event.

Every step after the first is existing behaviour. If any of it doesn't work, the cause is in Phase 2 (a missing select-list column) far more often than anywhere else.
