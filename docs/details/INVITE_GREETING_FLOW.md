# Invite Chat Greeting Flow — Full Reference

This document explains everything about how the invite chat overlay works —
how the greeting message is chosen, what data powers it, how it animates in,
what buttons appear, and how every chat state flows into the next.

---

## Overview

When a verified phone number enters the invite flow, a WhatsApp-style chat
overlay opens. The bot sends a greeting message tailored to the user's exact
status with the event. The user then replies using pre-built buttons that
branch into different sub-flows.

The greeting message is **not static** — it changes based on:
- Whether the user has fully paid
- Whether the user has paid the advance
- Whether the event is sold out
- How full the event is (>50% reserved triggers urgency messaging)
- Whether the counts have loaded yet (fallback state)

---

## Data Sources

### 1. `nativeEventData` — event + user state object

Populated by `prepareNativeInviteFlow()` and stored in React state. Contains:

| Field | Type | Description |
|---|---|---|
| `title` | string | Event title e.g. "Sunrise at Kovalam" |
| `isFullyPaid` | boolean | True if `applications.status = 'fully_paid'` |
| `isBalancePayment` | boolean | True if `applications.status = 'advance_paid'` |
| `inviteSpots` | number \| null | Total capacity from `events.invite_spots` |
| `inviteSlug` | string | Public invite slug (`events.invite_slug`) |
| `eventSlug` | string | Canonical slug (`events.slug`) |
| `firstDate` | string | First upcoming event date |
| `priceAdvance` | number | Advance amount to pay |
| `priceFull` | number | Full trip price |
| `inviteFaqs` | array | FAQ pairs for the doubt flow |
| `bookingSteps` | array | Payment timeline steps |
| `announcements` | string[] | Rotating header announcements |

### 2. `inviteApplicationCount` and `inviteReservedCount` — live counts

Fetched at the end of `prepareNativeInviteFlow()`, scoped to **the user's
date** (`firstDate` — resolved from `applications.selected_date`, falling back
to the event's earliest date). `invite_spots` is per-date capacity, so both
counts are read from the per-date RPC `event_booking_counts_by_date`:

```ts
if (firstDate) {
  fetchEventDateCounts(realSlug).then(map => {
    const dc = map[firstDate];
    setInviteApplicationCount(dc?.registered ?? 0); // apps for THIS date
    setInviteReservedCount(dc?.reserved ?? 0);      // advance/fully paid, THIS date
  });
} else {
  // Date couldn't be resolved → fall back to slug-wide totals.
  fetchEventCounts(realSlug).then(({ registered, reserved }) => {
    setInviteApplicationCount(registered);
    setInviteReservedCount(reserved);
  });
}
```

These are async — they arrive after `nativeEventData` is already set. This
means the chat may briefly show the fallback greeting before updating to the
counts-aware version. In practice the fetch is fast enough that this is
invisible.

**What each count means (per the user's date):**
- `registered` = rows in `applications` for this event **and this
  `selected_date`** (any status)
- `reserved` = those rows where `status IN ('advance_paid', 'fully_paid')` —
  people who actually paid and locked a spot on this date

> **Date scoping:** an invitee to July 19 sees July 19's numbers only — the
> July 5 cohort never bleeds in. This matches the booking-application flow,
> which already drives its social-proof number from per-date counts.
>
> **Legacy caveat:** `event_booking_counts_by_date` only counts rows where
> `selected_date IS NOT NULL`. Applications submitted before per-date
> selection existed are excluded from both counts.

### 3. Derived values computed inside the chat render

```tsx
const firstName = form.name.trim().split(' ')[0];
const isFullyPaid = nativeEventData?.isFullyPaid ?? false;
const isPaid = nativeEventData?.isBalancePayment ?? false;   // advance paid
const totalSpots = nativeEventData?.inviteSpots ?? null;

const isSoldOut = !isFullyPaid && !isPaid
  && typeof inviteReservedCount === 'number'
  && totalSpots != null
  && inviteReservedCount >= totalSpots;
```

`isSoldOut` is only true when ALL of these are satisfied:
- User has NOT fully paid
- User has NOT paid advance
- `inviteReservedCount` is a real number (counts have loaded)
- `totalSpots` is set on the event
- Reserved ≥ total capacity

---

## The Six Greeting States

The `botGreeting` string is computed as a waterfall — the first matching
condition wins.

### State 1 — Fully Paid
**Condition:** `isFullyPaid === true`

**Message:**
```
Hi {firstName}! Your booking is fully confirmed. What would you like to do now?
```

**When it shows:** User's `applications.status = 'fully_paid'`. They've
settled the full trip price.

---

### State 2 — Sold Out
**Condition:** `isSoldOut === true`
(reservedCount >= totalSpots, user hasn't paid, counts have loaded)

**Message:**
```
Hey {firstName}, we really wanted you in this plan but...

All {totalSpots} spots in {eventTitle} are already reserved.

Please note — your spot is only reserved once the advance is settled.

Join the waitlist & we'll let you know if someone cancels their spot. We hope
to see you in the future!
```

**When it shows:** Every spot has been taken by advance-paid users.

---

### State 3 — Advance Paid (balance still due)
**Condition:** `isPaid === true` (meaning `isBalancePayment === true`)

**Message:**
```
Hi {firstName}, we're doing everything we can to give you the best
{eventTitle} experience!

What would you like to do now?
```

**When it shows:** User paid the advance. They still owe the remaining
balance. Their status is `advance_paid`.

---

### State 4 — Not Paid + More Than 50% Full (urgency)
**Condition:**
- Not fully paid, not advance paid, not sold out
- `inviteReservedCount / totalSpots > 0.50`
- Both counts and totalSpots are loaded

**Message:**
```
Hi {firstName}, out of all applications, your vibe matched our club perfectly!

But please note — the invitation does not reserve your spot. A spot is
reserved for you once the advance is paid.

{reservedCount} out of {totalSpots} spots are already reserved. What would
you like to do now?
```

**When it shows:** More than half the trip is already locked in. Creates
urgency by showing real numbers.

---

### State 5 — Not Paid + Under 50% Full (relaxed)
**Condition:**
- Not fully paid, not advance paid, not sold out
- `inviteReservedCount / totalSpots <= 0.50`
- Both counts and totalSpots are loaded

**Message:**
```
Hi {firstName}, out of all applications, your vibe matched our club perfectly!

But please note — invitation does not reserve your spot. We follow 1st come
- 1st served basis.

Spots are reserved for those who settle the advance first. What would you
like to do?
```

**When it shows:** Plenty of spots still available. No urgency numbers shown.

---

### State 6 — Fallback (counts not yet loaded)
**Condition:** `inviteReservedCount` or `totalSpots` is null

**Message:**
```
Hi {firstName}! What would you like to do now?
```

**When it shows:** Counts fetch is still in flight, or the event has no
`invite_spots` set. Acts as a safe neutral fallback.

---

## Greeting State Decision Tree

```
isFullyPaid?
  YES → "Your booking is fully confirmed..."
  NO ↓

isSoldOut? (reserved >= totalSpots, counts loaded)
  YES → "We really wanted you in this plan but... all {n} spots reserved..."
  NO ↓

isPaid? (advance_paid)
  YES → "We're doing everything we can to give you the best {title} experience!"
  NO ↓

reserved/total > 0.50 AND counts loaded?
  YES → "...{reserved} out of {total} spots are already reserved..." (urgency)
  NO ↓

reserved/total <= 0.50 AND counts loaded?
  YES → "...We follow 1st come - 1st served basis. Spots are reserved for those who settle the advance first..." (relaxed)
  NO ↓

FALLBACK → "Hi {firstName}! What would you like to do now?"
```

---

## How the Chat Animates In — `chatRevealStep`

The chat doesn't appear all at once. A `useEffect` staggers the reveal using
`chatRevealStep` (0 | 1 | 2):

```tsx
useEffect(() => {
  if (!chatOpen || chatTransitioning) { setChatRevealStep(0); return; }
  setChatRevealStep(0);
  const t1 = setTimeout(() => setChatRevealStep(1), 700);   // greeting appears
  const t2 = setTimeout(() => setChatRevealStep(2), 1300);  // reply buttons appear
  return () => { clearTimeout(t1); clearTimeout(t2); };
}, [chatOpen, chatTransitioning]);
```

| Step | Delay | What appears |
|---|---|---|
| 0 | 0ms | Animated typing indicator (three bouncing dots) |
| 1 | 700ms | Bot greeting message bubble |
| 2 | 1300ms | Reply button card ("Choose your reply") |

Before step 1 resolves, the typing indicator is shown — mimicking a real
person typing the message. Once `chatRevealStep >= 1`, the dots are hidden and
the greeting fades+slides in.

The `hasEssentials` flag adds a small extra delay to the greeting if there's
quick-info or transport data to display (gives time for the info strip to
settle before the greeting appears).

---

## Reply Buttons — What Shows Per State

The reply card appears at `chatRevealStep >= 2` and `chatState === 'prompt'`.
Buttons shown depend on the user's state:

### Not sold out — full button set
| Button | Colour | Condition | Action |
|---|---|---|---|
| Pay Advance / Pay Balance | Green `#22C55E` | `!isFullyPaid && !isSoldOut` | Opens `NativeBookingTimeline` |
| Re-check plan details | Yellow `#FFD700` | `!isSoldOut` | Opens `PlanDetailsSheet` |
| I Have a Doubt | Yellow `#FFD700` | `!isSoldOut` | → `has_doubt` chat state |

### Sold out — restricted set
| Button | Colour | Condition | Action |
|---|---|---|---|
| Join Waitlist | Yellow `#FFD700` | `isSoldOut` | Updates `applications.status = 'waitlist'`, → `waitlist` chat state |

Pay Advance, Re-check plan details, and I Have a Doubt are all hidden.

### Fully paid — full button set minus payment
| Button | Shown |
|---|---|
| Pay Advance / Pay Balance | Hidden (isFullyPaid) |
| Re-check plan details | Shown |
| I Have a Doubt | Shown |

All buttons have a shimmer sweep animation that repeats on a loop —
a light glint that travels across the button every ~3.3 seconds, staggered
slightly between buttons to feel natural.

---

## Chat States — Complete Map

`chatState` controls what's rendered below the initial greeting.

```
'prompt'
  Initial state. Shows the greeting + reply buttons.
  
'doubt_sending'
  Transient — user tapped "I Have a Doubt".
  Typing indicator shows for 800ms, then transitions to 'has_doubt'.

'has_doubt'
  Bot shows FAQ chips (from events.invite_faqs).
  User can tap a FAQ for an instant answer, or tap "Other Topic".
  Persistent CTAs (Re-check plan details + Pay Advance) shown at bottom.

'other_topic'
  User tapped "Other Topic".
  Text input appears for free-form doubt submission.
  On submit → inserts into plan_doubts table → transitions to 'doubt_submitted'.

'doubt_submitted'
  Bot confirms: "Got it! We'll reach out to you on WhatsApp soon."
  Submission is recorded in plan_doubts with status = 'new'.

'waitlist'
  User tapped "Join Waitlist" (sold out events only).
  User message bubble: "Join Waitlist"
  Bot reply: "We're adding you to the waitlist, if someone cancels we'll
  contact you!"
  DB: applications.status updated to 'waitlist' for this phone + event_slug.
```

---

## Waitlist Flow — What Happens in the DB

When "Join Waitlist" is tapped:

```tsx
const tenDigit = form.phone.replace(/^\+91/, '').replace(/^0/, '')
  .replace(/\D/g, '').slice(-10);

supabase.from('applications')
  .update({ status: 'waitlist' })
  .eq('phone', tenDigit)
  .eq('event_slug', verifiedSlug)
```

This updates the **existing** application row — it does NOT insert a new row.
The user already has a row from when they were originally invited (status
`'invited'`). It simply changes that status to `'waitlist'`.

In the admin panel (People tab), `waitlist` appears as a purple badge and
can be filtered in the status dropdown. The status count bar at the bottom
of the people list also shows `waitlist: N` in purple.

---

## Waitlist Blocking — Phone Entry

Users with `waitlist` status are blocked from re-entering the invite flow:

1. When the phone number is submitted, `found` candidates are built from
   `invited_numbers` + `applications`.
2. Any candidate with `status = 'waitlist'` is filtered out:
   ```tsx
   const hasWaitlistOnly = found.length > 0 && found.every(m => m.status === 'waitlist');
   found = found.filter(m => m.status !== 'waitlist');
   if (found.length === 0 && hasWaitlistOnly) {
     setError('waitlist_blocked');
     ...
   }
   ```
3. The phone entry button shows in **purple**:
   - "You're on the waitlist."
   - "We'll contact you if a spot opens up!"

---

## The Chat Header

The header always shows:
- chapter அ logo (black rounded square)
- Green online dot
- "chapter அ" bold with blue verified checkmark
- Subtitle: either the event title, or rotating announcements

If the event has `announcements` set (an array of strings), the subtitle
cycles through them with a smooth slide-up animation every few seconds.
This is used to surface important info (e.g. "Last 3 spots!", "₹500 off
before Friday") directly in the chat header.

---

## The `form.name` Source

`firstName` is derived from `form.name`, which is the name the user entered
during the **poster verification step** (the name + phone form before the
poster is revealed). This is NOT necessarily their application name — it's
whatever they typed to verify.

The application name (from `applications.name`) is only used in AiSensy
messages, not in the chat greeting.

---

## How `prepareNativeInviteFlow` Populates Everything

This async function is called whenever a verified phone + event slug is
confirmed. It:

1. Fetches the event row from Supabase (including dates, pickup points,
   booking steps, FAQs, etc.)
2. Fetches the `applications` row to determine `appStatus`
3. Resolves the user's city for per-city pricing
4. Computes `priceAdvance`, `priceFull`, `balanceAmount`
5. Calls `setNativeEventData({ ..., isFullyPaid, isBalancePayment, inviteSpots, ... })`
6. **Separately** calls `fetchEventCounts(realSlug)` which async-updates
   `inviteApplicationCount` and `inviteReservedCount` in state

The counts fetch is fire-and-forget (`.then(...)`) — it doesn't block the chat
from opening. The chat opens immediately with the data it has, then the
greeting may update once counts arrive (if React re-renders).

---

## Application Status → Chat State Mapping

| `applications.status` | `isFullyPaid` | `isPaid` | Greeting shown |
|---|---|---|---|
| `invited` | false | false | States 4, 5, or 6 (depends on fill %) |
| `advance_paid` | false | true | State 3 — advance paid message |
| `fully_paid` | true | false | State 1 — fully confirmed |
| `waitlist` | — | — | Shown as non-actionable row in multi-plan selector; blocked at phone entry only if ALL matches are waitlist |
| `pending` | false | false | States 4, 5, or 6 (same as invited) |

---

## Summary Table — Greeting vs Buttons

| User State | Greeting | Pay btn | Re-check btn | Doubt/Waitlist btn |
|---|---|---|---|---|
| Fully paid | "Your booking is fully confirmed" | Hidden | Shown | I Have a Doubt |
| Sold out | "We really wanted you... all spots reserved" | Hidden | Hidden | Join Waitlist only |
| Advance paid | "We're doing everything we can..." | Pay Balance | Shown | I Have a Doubt |
| Not paid >50% full | "...vibe matched our club perfectly! ...A spot reserved once advance paid. {n} of {total} spots already reserved." | Pay Advance | Shown | I Have a Doubt |
| Not paid ≤50% full | "...vibe matched our club perfectly! ...1st come - 1st served. Spots reserved for those who settle advance first." | Pay Advance | Shown | I Have a Doubt |
| Fallback (no counts) | "Hi {name}! What would you like to do now?" | Pay Advance | Shown | I Have a Doubt |
