# Design brief — "Pay at venue" for split-payment events

You are doing a **design pass**, not an implementation pass. Do not write production code, do not touch the database, do not commit or push. Produce mockups, options, and a recommendation. The person you're working with is a **no-code founder** — explain everything in plain language and never assume they can read or edit code.

## The product

chapter அ is a mobile-first social-experiences booking webapp (React + Vite + TypeScript, Supabase, PayU payments, AiSensy WhatsApp). It sells curated real-world meetups and trips in India — a "lifestyle club", roughly 10–12 plans at a time, not a marketplace. Most customers arrive from Instagram and a large share browse **inside the Instagram in-app browser** on Android and iOS. Everything is designed phone-first; there is no desktop customer experience worth speaking of.

Two kinds of paid events:
- **Invite-only** (`events.booking_url = 'native-application'`) — guest requests an invitation, gets approved, then pays.
- **Open** (`events.booking_url = 'payu-hosted'`) — no approval, guest verifies a WhatsApp OTP and pays immediately.

Two payment modes (`events.payment_mode`):
- `'split'` — an advance now, the balance later (both online, via PayU).
- `'full'` — one single payment.

## The idea to design for

India is a cost- and trust-sensitive market. A first-time customer who has never met this brand is being asked for the full ticket price up front by a company they've never heard of. The founder's thesis: if a ₹299 open event let people **pay ₹100 online to reserve and the remaining ₹199 at the venue** — after they've arrived, seen the other guests, and seen that the event is real — more people would convert, because the risk of the first payment drops.

**Critically: "pay at venue" does not mean cash.** The balance is still a normal online PayU payment made on the same website. It just happens on the guest's phone, standing in front of the host at the event, instead of at home three days earlier. Nothing about money handling, reconciliation, or accounting changes.

The feature is a **checkbox on an event** called "Pay at venue", available only when payment mode is Split. It applies to both invite-only and open events. Turning it on changes how the price is presented and when the balance is expected — nothing else.

## What has already been verified in the code — treat as settled, do not redesign

A prior session traced the whole flow. These are facts, not assumptions:

1. `payment_mode = 'split'` **already works on open events**. `create-payu-order` only special-cases `'full'`; split falls through and charges the advance. No backend work is needed to charge ₹100.
2. The balance payment is an existing, working flow. `payu-callback` flips the guest to `fully_paid` automatically when PayU confirms it. Marketer, manager, and creator commissions all accrue off `fully_paid` and are unaffected.
3. **The venue return path already exists.** After any advance payment, an AiSensy WhatsApp (`advance_success_dpl`) is sent with a deeplink button carrying `?phone=&name=`. Tapping it lands the guest in the `/invite` flow, which looks them up **by phone** (`findInviteMatches`, `src/App.tsx:1592`), finds their event from their `applications` row, and — because their status is `advance_paid` (`src/App.tsx:1339`) — renders them a bill for the remaining amount. This works for open events too; there is no invite-only filter. So the guest tapping "pay the rest" at the venue is plumbing that already runs today.
4. Therefore the whole feature is: **one boolean column, presentation changes, and one date that stops mattering.**

The only piece that needs a backend edit is the WhatsApp copy — `advance_success_dpl`'s second parameter is currently the balance *due date*. That's out of scope for you; the founder will decide it separately.

## The design problem

Price appears at many points in the customer journey. Right now every one of them is written for "advance now, balance later, before the trip." Pay-at-venue needs its own voice across all of them, and the through-line is:

> "Remaining balance" reads like a debt being disclosed. For this feature it has to read like relief — a smaller commitment now, with the rest deferred to a moment when the guest already trusts us.

Get that tone right and the feature works. Get it wrong and it just looks like a confusing two-part price.

## Your scope — the full price-touchpoint inventory

Walk the journey and design each surface where a price or a payment expectation is shown. Read the code to see what's actually there before designing; these are starting points, not a complete map:

| Surface | Where |
|---|---|
| Plan cards in the `/plans` chat | `src/AppFlow.tsx` |
| Event details overlay — the booking-timeline card | `src/AppFlow.tsx` ~2584–2730 |
| **Calendar bottom sheet** — first point a price is shown | `src/AppFlow.tsx` ~5253 |
| Details form → PayU bill | `src/PaymentOverlay.tsx` (`NativePaymentOverlay`) |
| Invite-flow bill and its step rows | `src/App.tsx` ~3234–3360 |
| Post-payment success screen and receipt | `src/App.tsx` (`PayUReturnScreen`) ~4111, ~4332 |
| The venue screen itself — group chat button + pay-the-rest button | `/invite` flow, `src/App.tsx` |
| Admin event editor — the checkbox that turns this on | `src/AdminPanel.tsx` ~9087 |

### How the booking timeline works (you'll need this)

Timeline steps are **data**, stored per date in `event_dates.booking_steps` (JSONB) with a fallback at event level. Each step is `{ label, value, date }`. The `value` supports placeholders `{advance}`, `{balance}`, `{price}` resolved at render. Row 0 renders with a green "Now" pill; later rows render a gray `by Mar 12` pill built from `step.date`.

There is already a precedent for replacing that date pill with words: invite-only advance rows show **"After Invitation"** instead of a date (`src/AppFlow.tsx` ~2718). A pay-at-venue balance row wanting to say **"At the venue"** is a third variant of that same pill. Canonical default steps are generated in `src/AdminPanel.tsx:157` (`nativeDefaultBookingSteps`) and regenerated on mode switch at `:187`.

## What was already sketched — extend it, don't repeat it

A previous session produced first-pass mockups and reached these positions. Treat them as a starting point to pressure-test, not as decisions:

- **Calendar sheet pricing block.** Structure stays (gray card under the meeting-point dropdown, two CTAs below). Left label changes from "Advance" to "Pay now to reserve"; right label from "Remaining balance" to "At the venue". An optional third line — "Pay the rest on your phone once you're there" — was proposed but costs vertical space in a sheet already capped at 95% viewport height. Three variants were shown: today's, a quiet relabel-only version, and a louder stacked version that greys the ₹199 into the background. The relabel-only version was recommended. **The founder has not picked yet.**
- **Booking timeline.** The `{balance}` row's date pill becomes "At the venue". The founder explicitly deferred this — it's yours to design properly.
- **Admin.** A checkbox under the Payment Mode segmented control, visible only when Split is selected, which also hides the now-meaningless balance-due-date field.
- **Venue screen.** Group chat button plus a "Pay the rest — ₹199" button, and a line telling the guest to show the screen to the host. Whether the host verifies from the guest's screen or from the marketer's own admin panel is an open question.

## Open questions the founder still has to answer

Surface these; don't quietly decide them:
1. Does the reassurance line earn its vertical space in the calendar sheet?
2. How does the host confirm a guest actually paid at the venue — the guest's screen, or the marketer's admin view?
3. A guest who never pays at the venue sits at `advance_paid` forever. On a normal split event that means "chase them for money"; here it means "didn't show up." Should the admin People tab tell those two states apart?

## Visual constraints

- Brand accent is `#FFD700` (primary CTA), with `#FFF3BF` / `#b38200` for the secondary CTA. Sheets are white with `rounded-t-[2rem]`; inner cards are `bg-gray-50` with `rounded-2xl`; text is near-black.
- Bottom sheets are capped at `max-h-[95%]` and scroll internally. Vertical space is genuinely scarce — anything you add pushes the primary CTA toward the fold.
- Sheets participate in browser history so the Instagram in-app back chevron works. Adding or removing a sheet layer has back-button consequences; don't propose new nested sheets casually.
- Tailwind, `framer-motion` for sheet transitions, `lucide-react` for icons.

## Deliverable

Mockups of each surface, with options and tradeoffs where a real choice exists, and a clear recommendation on each. Show the current state alongside the proposed state so the founder can see what actually changes. Cover the invite-only variant as well as the open-event one — the checkbox applies to both, and the invite journey has an approval step in the middle that the open journey doesn't.

End with a short summary in plain language of what a guest would see, start to finish, on a ₹100-now / ₹199-at-venue event.
