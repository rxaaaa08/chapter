# Spots Left & Application Count Inidcators

This document explains two related UI/data behaviors in the `/plans` native application flow:

1. The **remaining spots indicator** inside the calendar UI.
2. The **application count/social proof label** inside the booking timeline bottom sheet.

Both features live primarily in `src/AppFlow.tsx` and are powered by application counts from Supabase via `fetchEventCounts()` in `src/supabase.ts`.

> Note: the filename intentionally uses `inidcators` to match the requested name.

---

## High-Level Context

The `/plans` flow supports several booking styles. The changes documented here are specifically for **native application events**, identified in code by:

```ts
selectedEvent?.bookingUrl === 'native-application'
```

This is stored as:

```ts
const isNativeApplicationFlow = selectedEvent?.bookingUrl === 'native-application';
```

Relevant location:

```txt
src/AppFlow.tsx
```

The native application flow is the flow where users apply/request an invitation instead of directly paying through a hosted checkout.

---

## Shared Count Source

Both features depend on event counts fetched from Supabase.

The fetch happens in `src/AppFlow.tsx` when the selected event is a native application event:

```ts
useEffect(() => {
  if (!isNativeApplicationFlow || !selectedEvent?.id) {
    setApplicationCount(null);
    setReservedCount(null);
    return;
  }
  fetchEventCounts(selectedEvent.id).then(({ registered, reserved }) => {
    setApplicationCount(registered);
    setReservedCount(reserved);
  });
}, [isNativeApplicationFlow, selectedEvent?.id]);
```

### State Values

`applicationCount`

The total number of rows in the `applications` table for the event. This includes every status.

Examples of statuses that count:

- `pending`
- `invited`
- `advance_paid`
- `fully_paid`
- `waitlist`
- `rejected`

`reservedCount`

The number of rows in the `applications` table for the event where the user has actually locked a spot by paying.

Only these statuses count as reserved:

- `advance_paid`
- `fully_paid`

---

## Supabase Count Function

The count function lives in:

```txt
src/supabase.ts
```

Relevant function:

```ts
export async function fetchEventCounts(eventSlug: string): Promise<{ registered: number; reserved: number }> {
  if (!eventSlug) return { registered: 0, reserved: 0 };
  const [{ count: registered }, { count: reserved }] = await Promise.all([
    supabase
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('event_slug', eventSlug),
    supabase
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('event_slug', eventSlug)
      .in('status', ['advance_paid', 'fully_paid']),
  ]);
  return {
    registered: typeof registered === 'number' ? registered : 0,
    reserved:   typeof reserved   === 'number' ? reserved   : 0,
  };
}
```

### Important Detail

The function parameter is named `eventSlug`, and it is compared against:

```ts
applications.event_slug
```

In the `/plans` flow, the caller passes:

```ts
selectedEvent.id
```

This works because the mapped event `id` is the canonical event slug used by `applications.event_slug`.

---

# 1. Remaining Spots Indicator In Calendar UI

## What Changed

Previously, the remaining-spots indicator was shown below the **Join Our Plan** CTA as a row of circular dots plus text like:

```txt
3 spots left
```

That old details-page dot indicator was removed.

The remaining-spots signal now appears inside the **calendar bottom sheet legend**.

The legend uses the existing calendar key styles:

- Amber key = filling fast / limited spots
- Green key = available

No new color system was introduced.

---

## Where It Lives

The calendar UI is rendered inside `EventDetailsOverlay` in:

```txt
src/AppFlow.tsx
```

The core function is:

```ts
const renderCalendar = () => {
  ...
}
```

This function builds:

- the month heading,
- the legend,
- the weekday row,
- the date grid,
- date cell styling,
- sold-out cell behavior,
- selected trip range styling.

---

## Data Used By The Calendar Indicator

Inside `renderCalendar()`, native event availability is calculated like this:

```ts
const nativeCapacity = (event as any).totalCapacity as number | null;
const nativeTaken = typeof reservedCount === 'number' ? reservedCount : null;
const nativeAvailability =
  event.bookingUrl === 'native-application' && nativeCapacity && nativeTaken !== null
    ? {
        available: Math.max(nativeCapacity - nativeTaken, 0),
        isFillingFast: nativeTaken / nativeCapacity >= 0.5,
      }
    : null;
```

### Formula

```txt
available spots = totalCapacity - reservedCount
```

Where:

```txt
reservedCount = applications with status advance_paid or fully_paid
```

### Filling-Fast Threshold

The calendar enters the native filling-fast state when:

```txt
reservedCount / totalCapacity >= 0.5
```

In plain English:

```txt
50% or more of the total capacity has been reserved
```

Examples:

| totalCapacity | reservedCount | reserved % | filling fast? | available |
|---:|---:|---:|---|---:|
| 10 | 0 | 0% | no | 10 |
| 10 | 4 | 40% | no | 6 |
| 10 | 5 | 50% | yes | 5 |
| 10 | 6 | 60% | yes | 4 |
| 7 | 3 | 42.85% | no | 4 |
| 7 | 4 | 57.14% | yes | 3 |

---

## Legend Behavior

The calendar legend has two different behaviors for native application events.

### Case A: Native Application Event Under 50% Reserved

Show both default keys:

```txt
Filling fast
Available
```

This is the standard/default calendar legend.

It preserves the existing amber key and green key exactly as they were.

### Case B: Native Application Event At 50% Or More Reserved

Show only the amber key with the remaining-spots label:

```txt
Only X spots left
```

Example:

```txt
Only 3 spots left
```

The amber key shape/color is reused exactly. Only the label changes.

### Case C: Native Application Event Fully Reserved

If `available` is `0`, the `Only X spots left` key is not shown.

This was intentional because sold-out state is communicated through date cells themselves.

### Case D: Not Native Application Or Missing Capacity/Counts

Fall back to the default legend:

```txt
Filling fast
Available
```

This keeps non-native flows unchanged.

---

## Calendar Date Cell Behavior When Native Event Is Filling Fast

When the native application event is at 50% or more reserved, available date cells also visually switch to the existing amber/filling-fast style.

This is controlled by:

```ts
const useNativeFillingFastCells = !!nativeAvailability?.isFillingFast && nativeAvailability.available > 0;
```

Then each date computes an `effectiveDateStatus`:

```ts
const effectiveDateStatus =
  useNativeFillingFastCells && tripDate?.status === 'available'
    ? 'selling_out'
    : tripDate?.status;
```

### What This Means

If the date is normally:

```txt
available
```

but the plan-level capacity is now filling fast, the UI treats that date as:

```txt
selling_out
```

for visual styling only.

This does not mutate the database.

### Important Behavior

Only `available` dates are visually promoted to `selling_out`.

Actual sold-out dates remain sold out.

Unavailable/non-trip dates remain unavailable.

Selected date styling still takes over when the user taps a date.

---

## Date Cell Styling

The date cell text/border class uses `effectiveDateStatus`:

```ts
if (effectiveDateStatus === 'available') {
  return "text-green-900 font-bold border border-green-500 shadow-[0_0_0_1px_rgba(16,185,129,0.35)]";
}

if (effectiveDateStatus === 'selling_out') {
  return "text-amber-950 font-bold border border-[#f59e0b] shadow-[0_0_0_1px_rgba(245,158,11,0.35)]";
}
```

The background overlay also uses `effectiveDateStatus`:

```ts
if (effectiveDateStatus === 'available') return "rgba(187,247,208,0.8)";
if (effectiveDateStatus === 'selling_out') return "#FFEDE5";
```

### Result

When under 50% reserved:

- available date cells stay green,
- selling-out date cells stay amber,
- sold-out cells stay sold out.

When 50% or more reserved:

- available date cells become amber,
- selling-out date cells remain amber,
- sold-out cells stay sold out.

---

## Sold-Out Date Cells

Sold-out trip dates are detected with:

```ts
const isSoldOut = tripDate?.status === 'sold_out';
const isUnavailable = !tripDate || isSoldOut;
```

Sold-out cells:

- are disabled,
- have a grey fill,
- do not show the diagonal slash,
- initially show the date number,
- then transition into a two-line label:

```txt
SOLD
OUT
```

### Sold-Out Background

```ts
if (isSoldOut) return "#e5e7eb";
```

### No Slash For Sold-Out Cells

The slash is only shown for unavailable non-trip dates:

```ts
{isUnavailable && !isSoldOut && !isSelectedStart && !isWithinTrip && !isTripEnd && (
  ...
)}
```

This prevents sold-out cells from briefly showing a diagonal strike before the `SOLD / OUT` label appears.

### Sold-Out Label Animation

Sold-out cells first render the normal date number:

```tsx
<motion.span
  className="text-base relative z-[3] text-gray-400 font-normal"
  initial={{ opacity: 1 }}
  animate={{ opacity: calendarRevealed ? [1, 1, 0] : 1 }}
  transition={{ duration: 0.7, delay: staggerDelay, times: [0, 0.7, 1], ease: 'easeInOut' }}
>
  {i}
</motion.span>
```

Then they render:

```tsx
<motion.span
  className="absolute inset-0 z-[5] flex flex-col items-center justify-center gap-[3px] text-[10px] leading-none font-black tracking-wider text-gray-600 [text-shadow:0_0_0_currentColor]"
  initial={{ opacity: 0 }}
  animate={{ opacity: calendarRevealed ? 1 : 0 }}
  transition={{ duration: 0.25, delay: staggerDelay + 0.62, ease: 'easeOut' }}
>
  <span>SOLD</span>
  <span>OUT</span>
</motion.span>
```

---

## Old Details-Page Dot Indicator Removal

The previous dot-based remaining-spots indicator below the **Join Our Plan** button was removed.

Old behavior:

- show dot grid,
- show `X spots left`,
- show muted `Y of Z taken` text originally,
- later the muted text was removed,
- then the whole indicator moved into the calendar legend.

Current behavior:

- no remaining-spots indicator is shown below the details-page CTA,
- the CTA simply opens the calendar bottom sheet,
- capacity pressure is shown in the calendar itself.

---

# 2. Application Count Displayed In Booking Timeline

## What Changed

The booking timeline bottom sheet has a small social-proof label above the event title:

```txt
{number} ppl have requested invitation
```

The phrasing and UI style were intentionally not changed.

Only the count logic changed.

---

## Where It Lives

The booking timeline bottom sheet is rendered in:

```txt
src/AppFlow.tsx
```

Search for:

```tsx
{/* Booking Timeline Popup */}
```

Inside that popup, the social-proof label is in the prize row near the event title.

Current logic:

```tsx
{(() => {
  const capacity = (selectedEvent as any).totalCapacity;
  const socialProofCount =
    isNativeApplicationFlow && typeof capacity === 'number' && capacity > 0 && typeof applicationCount === 'number'
      ? (capacity * 3) + applicationCount
      : null;
  return socialProofCount !== null ? (
    <p className="text-[11px] text-gray-400 font-medium mb-0.5 flex items-center gap-1"><Users size={11} className="flex-shrink-0" />{socialProofCount} ppl have requested invitation</p>
  ) : null;
})()}
```

---

## Previous Behavior

Previously, the label displayed only when actual application count was at least 6:

```ts
typeof applicationCount === 'number' && applicationCount >= 6
```

So:

| actual applications | label shown? |
|---:|---|
| 0 | no |
| 1 | no |
| 5 | no |
| 6 | yes |
| 7 | yes |

The displayed number was exactly the real `applicationCount`.

---

## Current Behavior

The label is now shown for native application events with:

- a valid `totalCapacity`,
- a loaded `applicationCount`.

The displayed number is:

```txt
displayed count = (3 × totalCapacity) + actual applicationCount
```

In code:

```ts
socialProofCount = (capacity * 3) + applicationCount
```

### Examples

| totalCapacity | actual applicationCount | displayed label |
|---:|---:|---|
| 7 | 0 | `21 ppl have requested invitation` |
| 7 | 1 | `22 ppl have requested invitation` |
| 7 | 6 | `27 ppl have requested invitation` |
| 10 | 0 | `30 ppl have requested invitation` |
| 10 | 4 | `34 ppl have requested invitation` |
| 30 | 0 | `90 ppl have requested invitation` |
| 30 | 12 | `102 ppl have requested invitation` |

There is no cap on the displayed number.

---

## Conditions For Showing The Label

The label appears only if all of these are true:

1. The event is a native application event.
2. The event has a numeric `totalCapacity`.
3. `totalCapacity > 0`.
4. `applicationCount` has loaded and is a number.

In code:

```ts
isNativeApplicationFlow &&
typeof capacity === 'number' &&
capacity > 0 &&
typeof applicationCount === 'number'
```

If any of those conditions fail, the label is hidden.

---

## Behavior While Counts Are Loading

If `applicationCount` is unavailable/loading, the label does not show.

This was intentional.

The code does not show:

```txt
3 × capacity
```

until the actual `applicationCount` has loaded.

This avoids flashing one number and then immediately changing it after the fetch finishes.

---

## What Counts As An Application

`applicationCount` comes from the `registered` value returned by `fetchEventCounts()`.

That means it counts all rows in the `applications` table for the event, regardless of status.

This includes:

- pending applications,
- invited users,
- rejected applications,
- waitlist users,
- advance-paid users,
- fully-paid users.

This behavior was intentionally kept as-is.

---

## Important Difference Between Counts

There are two separate counts used by these features:

### `applicationCount`

Used for:

```txt
{number} ppl have requested invitation
```

Counts:

```txt
all application rows for the event
```

### `reservedCount`

Used for:

```txt
remaining spots / filling fast calendar behavior
```

Counts only:

```txt
advance_paid + fully_paid
```

This distinction is important.

Someone who applied but has not paid:

- increases `applicationCount`,
- does not increase `reservedCount`,
- does not reduce remaining spots.

---

# Data Model Assumptions

## Event Capacity

Both features use:

```ts
event.totalCapacity
```

This maps from the Supabase `events.total_capacity` column.

Native application events must have `total_capacity` set for these behaviors to work.

## Event Identity

Both counts depend on:

```ts
selectedEvent.id
```

matching:

```txt
applications.event_slug
```

This is the canonical event slug in the `/plans` application flow.

---

# UX Summary

## Calendar UI

The calendar communicates booking pressure at the moment users are choosing a date.

Under 50% reserved:

```txt
Filling fast    Available
```

At 50% or more reserved:

```txt
Only X spots left
```

When a date is sold out:

```txt
SOLD
OUT
```

inside the date cell itself.

## Booking Timeline

The booking timeline uses social proof to encourage applications.

Instead of showing real application count directly, it starts from:

```txt
3 × total capacity
```

and then adds real applications on top.

This creates a higher baseline number while still incrementing naturally as more users apply.

---

# Edge Cases

## Native Event Has No `totalCapacity`

Calendar:

- falls back to normal legend behavior,
- no native remaining-spots label.

Booking timeline:

- hides the social-proof label.

## `reservedCount` Has Not Loaded

Calendar:

- `nativeAvailability` is `null`,
- falls back to normal legend behavior.

## `applicationCount` Has Not Loaded

Booking timeline:

- social-proof label is hidden.

## Available Spots Reach Zero

Calendar:

- `Only X spots left` key is hidden when available is `0`,
- sold-out should be communicated by date cells.

Important: full capacity does not automatically mark every date as `sold_out`. Date cells depend on `event.dates[].status`.

If an event is fully booked and the date should show sold out, the relevant trip date should have:

```txt
status = sold_out
```

## Non-Native Events

Non-native events keep the default behavior.

The native social-proof count and native calendar capacity logic do not apply.

---

# Realtime / Live Updates

Currently, counts are fetched once when the selected native application event is loaded/opened.

The fetch happens via:

```ts
fetchEventCounts(selectedEvent.id)
```

This means:

- if someone applies or pays in another browser while the current user has the page open, the UI does not automatically update,
- reopening the event/details or refreshing the page will fetch fresh values.

## Could This Be Live?

Yes.

To make it live, add a Supabase realtime subscription to the `applications` table for the current event slug.

The subscription would listen for:

- inserts,
- updates,
- deletes,

where:

```txt
event_slug = selectedEvent.id
```

Then it would re-run:

```ts
fetchEventCounts(selectedEvent.id)
```

and update:

```ts
setApplicationCount(registered);
setReservedCount(reserved);
```

This would make both:

- calendar remaining-spots state,
- booking timeline social-proof count,

update without a refresh.

---

# 3. Application Form "🔥 Only X Spots Left" Label

## What It Is

Below the **Submit Application** button in the `ApplicationForm` component, a small urgency
line appears when spots are running low:

```txt
🔥 Only X spot/spots left
```

This is separate from the calendar legend indicator. It lives inside the application form
itself, not inside `EventDetailsOverlay`.

---

## Where It Lives

```txt
src/AppFlow.tsx
```

Search for:

```tsx
{spotsLeft !== null && (
```

This is inside the `ApplicationForm` component (the form users fill out to apply for a plan).

---

## Data & Logic

`spotsLeft` is computed directly from props — no separate fetch needed:

```ts
const inviteSpots = typeof event?.inviteSpots === 'number' ? event.inviteSpots : null;
const spotsLeft = inviteSpots != null && typeof reservedCount === 'number'
  ? Math.max(0, inviteSpots - reservedCount)
  : null;
```

`reservedCount` is passed down from the parent `App` component, which already fetches it
via its own `fetchEventCounts` call when the selected event changes. This avoids a
duplicate network request.

### Formula

```txt
spotsLeft = Math.max(0, inviteSpots - reserved)
```

Where:

- `inviteSpots` = `event.inviteSpots` (the invite capacity set on the event)
- `reserved` = `advance_paid + fully_paid` applications (same as `reservedCount` elsewhere)

### Capacity Field Used

This uses `event.inviteSpots`, not `event.totalCapacity`. In the `/plans` flow events,
`inviteSpots` maps from `events.invite_spots` in Supabase. If `inviteSpots` is null,
the effect does not run and `spotsLeft` stays `null`.

---

## Display Conditions

The label is shown only when `spotsLeft !== null`:

```tsx
{spotsLeft !== null && (
  <p className="mt-3 text-[12px] font-semibold text-center text-[#b45309]">
    🔥 Only {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left
  </p>
)}
```

### Edge Cases

| `inviteSpots` | `reserved` | `spotsLeft` | Label shown? |
|---:|---:|---:|---|
| null | any | null | No |
| 10 | 0 | 10 | Yes — "Only 10 spots left" |
| 10 | 10 | 0 | Yes — "Only 0 spots left" |
| 10 | 12 | 0 | Yes — "Only 0 spots left" (clamped via Math.max) |

Note: there is no minimum threshold — the label shows even when `spotsLeft` is 0 or a
large number. There is no "only show when under X spots" gate here, unlike the calendar
legend which only switches to the urgency state at 50%+.

---

## Relationship To The Calendar Legend Indicator

Both indicators use the same `fetchEventCounts` function and the same formula
(`capacity - reserved`), but they are **completely independent**:

| | Calendar Legend | Application Form Label |
|---|---|---|
| Component | `EventDetailsOverlay` → `renderCalendar()` | `ApplicationForm` |
| State variable | `reservedCount` (from parent) | `spotsLeft` (derived from `reservedCount` prop) |
| Capacity source | `event.totalCapacity` | `event.inviteSpots` |
| Fetch trigger | `selectedEvent` changes | No fetch — reuses parent's `reservedCount` |
| Threshold | Shows urgency at 50%+ reserved | Shows whenever `spotsLeft !== null` |
| Singular/plural | `spot` / `spots` ✅ | `spot` / `spots` ✅ |

If `totalCapacity` and `inviteSpots` are set to different values on the same event, the
two indicators could show different numbers. In practice they should be the same value.

---

# Quick Reference

## Files

```txt
src/AppFlow.tsx
src/supabase.ts
```

## Main Functions / Blocks

```txt
AppFlow useEffect that calls fetchEventCounts()
EventDetailsOverlay.renderCalendar()
Booking Timeline Popup prize row
ApplicationForm spotsLeft useEffect
fetchEventCounts()
```

## Important Variables

```ts
applicationCount      // all application rows — used for booking timeline social proof
reservedCount         // advance_paid + fully_paid — used for calendar legend
spotsLeft             // local to ApplicationForm — used for "🔥 Only X spots left"
totalCapacity         // event.totalCapacity — used by calendar legend
inviteSpots           // event.inviteSpots — used by ApplicationForm label
nativeAvailability    // derived object inside renderCalendar
socialProofCount      // (3 × totalCapacity) + applicationCount
```

## Formulas

Remaining spots (calendar legend):

```txt
totalCapacity - reservedCount
```

Remaining spots (application form label):

```txt
Math.max(0, inviteSpots - reserved)
```

Filling-fast threshold (calendar only):

```txt
reservedCount / totalCapacity >= 0.5
```

Booking timeline displayed count:

```txt
(3 × totalCapacity) + applicationCount
```

