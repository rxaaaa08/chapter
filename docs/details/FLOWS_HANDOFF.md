# Chapter அ — Flows Handoff

> **Purpose:** This document is written for future Claude agents making changes to the codebase. It explains both primary user-facing flows — the **Booking / Application Flow** and the **Invite-Payment Flow** — in full detail: what happens in the UI, what code runs, what DB tables are written, and what the key business rules are.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Key Files & Responsibilities](#2-key-files--responsibilities)
3. [Core Data Types](#3-core-data-types)
4. [Database Tables](#4-database-tables)
5. [The Booking / Application Flow](#5-the-booking--application-flow)
   - 5a. Chat Step Machine
   - 5b. Event Discovery
   - 5c. City & Pickup Selection
   - 5d. Event Details Overlay
   - 5e. Booking Timeline Sheet
   - 5f. PayU Payment
   - 5g. Native Application
6. [The Invite-Payment Flow](#6-the-invite-payment-flow)
   - 6a. Phone Lookup
   - 6b. Invite Poster
   - 6c. Native Booking Timeline
   - 6d. In-Overlay Chat & Doubts
7. [Pricing Logic](#7-pricing-logic)
8. [City & Pickup Point System](#8-city--pickup-point-system)
9. [City-Specific Content (city_details)](#9-city-specific-content-city_details)
10. [Admin Panel — Key Operations](#10-admin-panel--key-operations)
11. [Key Business Rules & Edge Cases](#11-key-business-rules--edge-cases)
12. [Common Gotchas for Future Agents](#12-common-gotchas-for-future-agents)

---

## 1. Architecture Overview

The app is a **React + TypeScript SPA** using **Supabase** as its backend. There are three main path-based views:

| Path | Component | Purpose |
|------|-----------|---------|
| `/` (root) | `AppFlow` | Main chat-driven booking UI |
| `/plans` | `AppFlow` | Same UI, but in "plans" mode (back button traps inside event details) |
| `/admin` | `AdminPanel` | Password-gated admin CMS |
| `/invite` (or invite URLs) | `App.tsx → SharedInviteFlow` | Invite-only payment flow |

`App.tsx` is the routing shell. It renders `AdminPanel` on `/admin`, `AppFlow` everywhere else, and contains a `SharedInviteFlow` component used when an invite link is detected.

**Supabase project:** `txcmismkdttgsyhbnexf.supabase.co`

---

## 2. Key Files & Responsibilities

### `src/AppFlow.tsx`
The largest file (~4,000 lines). Contains:
- The main chat FSM (step machine) and all its handlers
- `EventDetailsOverlay` component — the full event details page
- `JourneyCard` component — the "The Essentials" card shown inside the chat after a date + meeting point are chosen
- `ApplicationForm` component — the native application form for invite-only events
- `getCityPickupPoints()` — filters which pickup points to show based on selected city
- `getMeetingPointPricing()` — resolves correct price/advance for a given pickup point
- Booking timeline sheet renderer
- PayU checkout component (`PayUCheckout`)
- Payment success/failure screens
- Browser history / back-button management

### `src/App.tsx`
Contains:
- `SharedInviteFlow` — the entire invite-payment flow (phone lookup → poster → booking timeline → payment)
- `InviteChatEssentialsCard` — the essentials card shown inside the invite overlay's chat
- `PayUCheckout` (duplicate — same as AppFlow.tsx)
- `ApplicationForm` (duplicate — same as AppFlow.tsx)
- `HomePage` — the static marketing landing page
- Top-level routing and Google OAuth return handling

### `src/supabase.ts`
- Supabase client init
- `mapDbEventToEvent(row)` — canonical DB row → `Event` object mapper
- `fetchEvents()` — loads all active events with joined tables
- `fetchEventByIdOrSlug()` — loads one event by id or slug
- `fetchChatMessages()` — loads bot message templates
- `fetchEventCounts()` — counts applications for a given event (used for "N spots left")
- `trackEvent()` — writes to `flow_analytics`
- `fillMsg()` — replaces `{variable}` placeholders in message templates

### `src/AdminPanel.tsx`
- Full CMS (~3,700 lines)
- `TripForm` component — the edit form for a single plan
- `OtherCityForm` component — manages "other city" pickup points specifically
- `saveTrip()` — upserts event + all related tables
- `approveApplication()` — marks invited + adds to invited_numbers + fires AiSensy WA message
- Analytics tab with funnel charts

---

## 3. Core Data Types

### `Event` (defined in AppFlow.tsx ~line 38)

```typescript
{
  id: string                    // = event.slug (NOT the UUID)
  cities: string[]              // e.g. ['Chennai', 'Delhi', 'Other']
  title: string
  oneLiner?: string             // shown in chat event list
  price: string                 // formatted: "₹19,000"
  advanceAmount: number         // raw number: 8000
  bookingUrl: string            // 'payu-hosted' | 'native-application' | external URL
  inviteOnly?: boolean
  girlsOnly?: boolean
  inviteSpots?: number | null   // total capacity for native-application events
  totalCapacity?: number | null // for PayU events (tracks sold-out)
  pickupPoints?: PickupPoint[]  // see Section 8
  dates: TripDate[]             // array of { date, status, label, bookingSteps, whatsapp_group_url }
  quickInfo?: QuickInfoItem[]   // label+value pairs: Meeting Spot, Transport, You'll Meet, Gang Size, etc.
  transportPlan?: TransportLeg[]
  itinerary?: ItineraryDay[]    // flat — used when city_details not present
  included?: string[]           // flat — used when city_details not present
  notIncluded?: string[]
  optionalActivities?: string[]
  cityDetails?: Record<string, CityData>  // per-city overrides (see Section 9)
  bookingSteps?: BookingStep[]  // default timeline steps
  inviteSlug?: string           // slug used in invite_numbers table lookup
  faqs?: FAQ[]
  invite_faqs?: FAQ[]           // FAQs shown inside the invite overlay chat
  accommodation?: AccommodationData
  announcements?: string[]      // shown in the announcement ticker after plan is selected
  videos?: VideoItem[]
  reviews?: ReviewItem[]
  ticketTypes?: TicketType[]
}
```

### `PickupPoint`

```typescript
{
  id: string                   // e.g. 'pt_1234567890' or 'own_transport'
  label: string                // shown in dropdown: "Koyambedu — 7:00 AM"
  meetingSpot: string          // shown in plan card: "Koyambedu Bus Stand"
  time: string                 // departure time: "7:00 AM"
  transport: string            // vehicle: "AC Tempo Traveller"
  dateOffset?: number          // shift departure date by N days (e.g. -1 = previous night)
  ownTransportPrice?: number   // overrides price for own_transport pickup
  ownOnly?: boolean            // if true, own_transport is the only option shown
  otherPrice?: number          // price for users from other cities
  otherAdvance?: number        // advance for users from other cities
  forOtherCity?: boolean       // false = home city users, true = other city users
}
```

### `TripDate`

```typescript
{
  date: string                 // ISO: "2026-06-21"
  status: 'available' | 'limited' | 'soldout' | 'past'
  label?: string               // optional badge: "Weekend 1"
  bookingSteps?: BookingStep[] // date-specific override for timeline steps
  whatsapp_group_url?: string  // pre-event WA group link
}
```

### `BookingStep`

```typescript
{
  label: string    // "Advance", "Remaining Balance", "Receive"
  value: string    // "{advance}", "{balance}", "₹5,000", "Pickup, stay & trip details"
  date: string     // ISO date for the "by MMM D" deadline badge, or ""
}
```

### `CityData` (city_details per-city object)

```typescript
{
  included?: string[]
  not_included?: string[]
  optional_activities?: string[]
  itinerary?: ItineraryDay[]
  meeting_spot?: string   // overrides quickInfo 'Meeting Spot' for this city
  transport?: string      // overrides quickInfo 'Transport' for this city
}
```

---

## 4. Database Tables

### `events`
The master plan/event table. Key columns:

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `slug` | text | URL-safe identifier, used as `Event.id` in frontend |
| `invite_slug` | text | Used for invite_numbers lookup. Always lowercase. |
| `booking_url` | text | `'payu-hosted'` \| `'native-application'` \| external URL |
| `cities` | jsonb | Array of strings e.g. `["Chennai","Delhi"]` |
| `pickup_points` | jsonb | Array of PickupPoint objects |
| `booking_steps` | jsonb | Default BookingStep array for the timeline |
| `quick_info` | jsonb | Array of `{icon, label, value}` for plan card display |
| `city_details` | jsonb | `Record<cityName, CityData>` — city-specific content overrides |
| `itinerary` | jsonb | Array of ItineraryDay (flat fallback) |
| `included` | text[] | Flat included items (fallback) |
| `not_included` | text[] | Flat not-included items (fallback) |
| `optional_activities` | text[] | Flat optional items (fallback) |
| `invite_only` | boolean | |
| `invite_spots` | integer | Total spots for native-application events |
| `total_capacity` | integer | Total spots for PayU events |
| `is_active` | boolean | Only active events are fetched by `fetchEvents()` |

### `event_dates`
One row per date per event. Key columns: `event_id`, `start_date`, `status`, `label`, `booking_steps` (jsonb — date-specific timeline override), `whatsapp_group_url`.

### `applications`
Submissions from the native-application form. Key columns:

| Column | Notes |
|--------|-------|
| `event_slug` | Matches `events.slug` (always lowercase) |
| `phone` | 10-digit number |
| `status` | `'pending'` → `'invited'` → `'advance_paid'` → `'fully_paid'` |
| `selected_date` | ISO date string of chosen trip date |
| `pickup_point_id` | The `id` of the chosen PickupPoint |
| `pickup_label` | The `label` of the chosen PickupPoint (for display) |
| `call_status`, `call_notes` | Admin call tracking |
| `aisensy_invite_sent` | Boolean — was the WA invite message sent? |

**Unique constraint:** `(phone, event_slug)` — prevents double applications.

### `invited_numbers`
One row per invited user per event. Key columns: `event_slug` (matches `events.invite_slug`), `phone`.

### `invite_payment_submissions`
Legacy payment tracking for the invite flow. Superseded by `applications.status`, but still checked as fallback. Key columns: `invite_slug`, `event_id`, `event_slug`, `phone`, `amount`, `status` (`'advance_paid'` | `'fully_paid'`).

### `payu_payments`
PayU webhook inserts. Key columns: `event_id`, `event_slug`, `txnid`, `mihpayid`, `amount`, `name`, `phone`, `email`, `trip_date`, `status` (`'success'`).

### `chat_messages`
Bot message templates. Key columns: `step_key`, `bot_message`, `flow`, `sort_order`.

The `step_key` values and their purpose:

| step_key | When shown |
|----------|-----------|
| `welcome` | First message on load |
| `select_event` | After city selected (legacy) / after welcome (current) |
| `ask_pickup_city` | When event has multiple pickup cities |
| `ask_own_transport_city` | When user says "I'm from another city" |
| `no_events` | No events found for city |
| `retry_city` | After no_events, asking to try again |
| `ask_doubts_book` | After user taps Book on event details |
| `ask_doubts_contact` | After user taps Contact on event details |
| `doubts_btn_yes` | Button label for "Yes I have doubts" |
| `doubts_btn_no` | Button label for "All clear" |
| `faq_followup` | After answering first FAQ |
| `faq_followup_repeat` | After answering 2nd+ FAQ |
| `contact_success` | After doubt is submitted |
| `general_announcements` | Announcement ticker (newline-separated) |
| `doubt_cta_label` | Label for the "Submit Doubt" button |

Admins can add per-trip overrides by creating a key `trip_message:{invite_slug}:{step_key}`.

### `flow_analytics`
One row per tracked event. `event_type` values: `page_view`, `city_selected`, `category_selected`, `event_selected`, `calendar_opened`, `date_selected`, `reached_pricing`, `book_clicked`, `contact_clicked`, `book_cta_clicked`, `contact_cta_clicked`, `external_redirect_initiated`.

### `doubt_submissions`
From the chat "Submit a Doubt" form during the booking flow. Key columns: `name`, `phone`, `doubt`, `event_title`, `city`, `selected_date`.

### `plan_doubts`
From the in-overlay chat inside the invite flow. Key columns: `phone`, `event_slug`, `message`, `status` (`'new'`).

---

## 5. The Booking / Application Flow

### 5a. Chat Step Machine

The entire pre-details chat is driven by a step FSM. The `step` state variable lives in the main App component in both `AppFlow.tsx` and `App.tsx`.

**Full step list and transitions:**

```
INIT
  └─ on load (events + messages fetched) → SELECT_EVENT

SELECT_EVENT
  └─ user picks an event → PROCESSING → ASK_PICKUP_CITY (if multi-city)
                                      → EVENT_SELECTED (if single/no city)

ASK_PICKUP_CITY
  └─ user picks "I'll join in {city}" → PROCESSING → EVENT_SELECTED
  └─ user picks "I'm from another city" → PROCESSING → ASK_OWN_TRANSPORT_CITY

ASK_OWN_TRANSPORT_CITY
  └─ user picks "I'll come to {city} by own transport" → PROCESSING → EVENT_SELECTED

EVENT_SELECTED
  └─ (terminal for pre-details chat)
  └─ showTransition fires → detailsReady after 1200ms (safety: 3000ms) → showDetails=true

PROCESSING
  └─ (transient — always immediately transitions to next step via simulateBotTyping)

--- After EventDetailsOverlay is open ---

ASK_DOUBTS
  └─ user: "All clear" → DONE + showBookingTimeline=true (after 150ms)
  └─ user: "I have doubts" → PROCESSING → SHOW_FAQ

SHOW_FAQ
  └─ user clicks FAQ → bot answers → stays SHOW_FAQ
  └─ user clicks "I'm ready to book" / "Let's Book" → DONE + showBookingTimeline=true

DONE
  └─ (terminal — no more option buttons rendered)

NO_EVENTS
  └─ "Start Over" button → PROCESSING → SELECT_EVENT
```

**Key rendering function:** `renderOptions()` in AppFlow.tsx — switch-cases on `step` and returns the appropriate button set JSX.

**Bot typing simulation:** `simulateBotTyping(callback, delayMs?)` — adds a "typing" indicator message, waits (default 800ms-1.2s with jitter), then calls callback which typically adds a bot message and sets the next step.

### 5b. Event Discovery

**Handler: `handleEventSelect(event)`**

When user clicks an event in `SELECT_EVENT`:
1. Sets step to `PROCESSING`
2. Adds user message (event's `oneLiner` or `title`)
3. Sets `selectedEvent`
4. Derives `pickupCities = event.cities.filter(c => c !== 'Other')`
5. If `pickupCities.length === 0` → sets `selectedCity = 'Other'`, starts transition, goes to `EVENT_SELECTED`
6. Otherwise → bot message listing the pickup cities, goes to `ASK_PICKUP_CITY`

**Event list rendering (in SELECT_EVENT):**
- Events are sorted with `sortGirlsOnlyLast()` — girls-only events go last
- Each event shown as a shimmer-animated button with `event.oneLiner || event.title`
- No city filter in `SELECT_EVENT` (changed from old flow — all events shown to everyone)

### 5c. City & Pickup Selection

**Handler: `handlePickupCitySelect(city, label)`**

Called when user picks a city in `ASK_PICKUP_CITY` or `ASK_OWN_TRANSPORT_CITY`:
1. Sets step `PROCESSING`
2. Adds user message with the label (e.g. "I'll join in Chennai")
3. Sets `selectedCity = city`
4. Clears detail timers, starts `showTransition=true`
5. Timer: `setDetailsReady(true)` after 1200ms (safety timer at 3000ms)
6. Sets step to `EVENT_SELECTED`

**Handler: `handleFromAnotherCity()`**

When user clicks "I'm from another city":
1. Sets step `PROCESSING`
2. Bot message: "You can join us at any of these meeting points with your own transport 🙂"
3. Goes to `ASK_OWN_TRANSPORT_CITY`
4. Shows same city buttons but labelled "I'll come to {city} by own transport"

**Important:** Both paths (`ASK_PICKUP_CITY` and `ASK_OWN_TRANSPORT_CITY`) end at the same `handlePickupCitySelect` with the same city value. The user's response label is different but the final `selectedCity` is identical. There is NO difference in treatment downstream — "I'll join in Chennai" and "I'll come to Chennai by own transport" result in the same `selectedCity = 'Chennai'`.

### 5d. Event Details Overlay

**Component: `EventDetailsOverlay`** (~600 lines in AppFlow.tsx starting ~line 3070)

Mounted when `showDetails = true`. Receives: `event`, `selectedCity`, `allEvents`, `applicationCount`, and several signal props for calendar/switcher open/close.

**Key internal state:**
- `selectedDate` — the ISO date string chosen in the calendar
- `selectedMeetingPoint` — the `id` of the chosen PickupPoint
- `expandedItinerary` — which itinerary day card is open (starts at 0)
- `showCalendar`, `calendarRevealed` — calendar bottom sheet
- `showPlanSwitcher` — plan switcher overlay
- `openSpotsLeft` — live count for PayU events (queried from `payu_payments`)
- `timeLeft` — fake scarcity countdown (cosmetic, NOT real availability)

**City-specific content resolution:**
```typescript
const _cd = (event as any).cityDetails?.[selectedCity];
const activeIncluded    = _cd?.included           ?? event.included           ?? [];
const activeNotIncluded = _cd?.not_included        ?? event.notIncluded        ?? [];
const activeOptional    = _cd?.optional_activities ?? event.optionalActivities ?? [];
const activeItinerary   = _cd?.itinerary           ?? event.itinerary          ?? [];
// Plan card overrides:
const meetingSpotValue  = _cd?.meeting_spot ?? quickInfo['Meeting Spot'];
const transportValue    = _cd?.transport    ?? quickInfo['Transport'];
```

**Calendar sheet:**
- Shows dates from `event.dates`
- Available dates are clickable; each date can have a custom `label`
- After date selected, shows pickup point picker (dropdown) populated by `getCityPickupPoints(event, selectedCity)`
- `selectedMeetingPoint` is set from the dropdown

**CTA buttons in overlay:**
- "Let's Book / Apply" → calls `onAction('book', selectedDate, selectedMeetingPoint)`
- "Contact / Ask a Question" → calls `onAction('contact', selectedDate, selectedMeetingPoint)`
- Both close the overlay and restart the chat from `ASK_DOUBTS` / `SHOW_FAQ`

**Handler in parent: `handleDetailsAction(action, date, meetingPoint)`**
1. Hides details, timeline, waitlist, doubt popup
2. Builds `journeyCardData = { event: selectedEvent, city: selectedCity, startDate: date, meetingPoint }`
3. Tracks analytics
4. Resets `showChat = true`
5. Sets step based on action: `book → ASK_DOUBTS`, `contact → SHOW_FAQ`

### 5e. Booking Timeline Sheet

The `showBookingTimeline` boolean controls this bottom sheet. It mounts as a `motion.div` sliding up.

**Steps resolution priority:**
1. `selectedDateEntry.bookingSteps` — per-date override on the specific `event_dates` row
2. `selectedEvent.bookingSteps` — event-level default
3. Hardcoded fallback: `[{Advance, {advance}}, {Remaining Balance, {balance}}, {Receive, "Pickup, stay & trip details"}]`

**Placeholder resolution:**
- `{advance}` → `getMeetingPointPricing(event, meetingPoint, city).advance` formatted as `₹8,000`
- `{balance}` → `total - advance` formatted
- `{price}` → total formatted

**CTA button logic (in order of precedence):**

| Event type | CTA Label | Action |
|-----------|-----------|--------|
| `bookingUrl === 'native-application'` | "Request Invitation" | Opens `ApplicationForm` sheet |
| `inviteOnly && external URL` | `event.ctaLabel` or "Apply Now" | Opens `bookingUrl` externally |
| PhonePe flow | "Get Payment Details" | Opens `DetailsForm` with instructions sub-step |
| PayU flow | `event.ctaLabel` or "Book Now" | Opens `DetailsForm` with Google sign-in |
| Everything else | `event.ctaLabel` or "Book Now" | Opens `bookingUrl` externally |

**Application count display:**
- Shown only for `native-application` events
- If `applicationCount >= 6`: shows "N ppl have requested invitation for this trip"
- Count fetched from `fetchEventCounts()` which queries `applications` table

### 5f. PayU Payment

**Flow:**
1. User opens `DetailsForm`, signs in with Google (required for PayU), enters name + phone
2. Checks T&C checkbox
3. Clicks "Pay Advance" → `handleProceedToPhonePe()` (function is named PhonePe but handles PayU too)
4. `getMeetingPointPricing()` called with chosen pickup point and city
5. Computes:
   - `balanceDueRaw` = tripDate - 5 days (`shiftDateString(dateStr, -5)`)
   - `pickupDetailsDate` = tripDate - 3 days
6. Builds `paymentContext` object with all event/user/pricing data
7. Sets `paymentView = 'checkout'`, closes DetailsForm
8. `PayUCheckout` component mounts

**`PayUCheckout` component:**
- On mount, POSTs to Supabase Edge Function `create-payu-order`:
  ```
  POST https://txcmismkdttgsyhbnexf.supabase.co/functions/v1/create-payu-order
  Body: { name, phone, email, amount, event_id, event_slug, event_title, trip_date, whatsapp_group_url }
  ```
- Gets back `{ payu_url, fields }` — a redirect URL + hidden form fields
- Renders a hidden `<form>` and auto-submits it → user is redirected to PayU's payment page
- On return from PayU: `paymentView` is set to `'success'` or `'failure'` based on PayU's response

**Existing booking check:**
When the user is signed in with Google for a PayU event, the app checks `payu_payments` for a prior success. If found:
- Shows "You're already booked" screen
- "Book Another Spot" sets `forceNewBooking = true`
- "View My Booking" shows their prior booking details

**Payment success screen:**
- Receipt ID: `CA-[Date.now().toString(36).toUpperCase()]`
- Shows: event name, trip date, amount paid, remaining balance + countdown timer
- Balance countdown: live seconds ticker to `balanceDueRaw` date
- Secret offer: WhatsApp link using `quickInfo['Secret Offer Number']` and `quickInfo['Secret Offer Message']`
  - `{title}` and `{date}` in message template are replaced
  - Only shown if `event.showSecretOffer !== false`

**Google OAuth return flow (`?gauth=1`):**
1. Before redirect to PayU, saves state: `localStorage.setItem('gauth_return', JSON.stringify({ city, date, meetingPoint }))`
2. Sets OAuth `redirectTo` to `window.location.origin + ?gauth=1&preview_event={event.id}`
3. On return, `App.tsx` detects `?gauth=1`:
   - Fetches event by slug
   - Restores `gauth_return` from localStorage
   - Sets `selectedCity`, `bookingDate`, `journeyCardData`
   - Gets Google session → pre-fills name, opens DetailsForm
   - Cleans URL (removes `?gauth=1`)

### 5g. Native Application

**Flow:**
1. Booking timeline CTA → opens `ApplicationForm` sheet
2. Form fields: name, phone (10-digit), gender, whyJoin (textarea), attendedBefore (optional)
3. On submit:
   ```typescript
   supabase.from('applications').insert({
     event_slug: event.id.toLowerCase(),    // event.id IS the slug
     name, phone, gender,
     why_join: form.whyJoin.trim(),
     attended_before: form.attendedBefore.trim(),
     status: 'pending',
     selected_date: selectedDate ?? null,
     pickup_point_id: chosenPoint?.id ?? null,
     pickup_label: chosenPoint?.label ?? null,
   })
   ```
4. On duplicate (error code `23505`): shows "You've already applied" screen
5. On success:
   - Shows success screen with confetti animation
   - Opens WhatsApp `wa.me/919940111564?text=...` with pre-filled message
6. After submit, form closes → `setShowApplicationForm(false)`, `setShowBookingTimeline(true)`

**`selectedPickupId` sourcing:**
- `journeyCardData?.meetingPoint` — the pickup point ID chosen in the calendar picker inside EventDetailsOverlay

**Admin approval of a native application:**
1. Admin opens "People" tab → "Approvals" sub-tab
2. Finds pending application, can see call status, notes, doubts
3. Clicks "Approve & Send Invite":
   - Updates `applications.status = 'invited'`
   - Inserts `{ event_slug: trip.invite_slug, phone }` into `invited_numbers`
   - POSTs to AiSensy: template `'Invite-Only Automation'`, params `[eventName, eventDate]`
   - Updates `applications.aisensy_invite_sent = true/false`

---

## 6. The Invite-Payment Flow

This flow lives entirely in `App.tsx`. It is triggered when a user lands on the invite URL (typically a WhatsApp-shared link).

### 6a. Phone Lookup

**State relevant to this flow (in App.tsx):**
- `inviteStep: 'landing' | 'result' | 'wipe' | 'poster'`
- `invitePhone`, `inviteName` — user input
- `inviteMatches: InviteMatch[]` — events the phone is invited to
- `selectedMatch: InviteMatch | null` — if multiple matches, which was chosen
- `nativeEventData` — enriched event data after `prepareNativeInviteFlow()`
- `savedPickupPointId: string | null` — the pickup point this user chose when applying
- `chatEventPickupPoints: PickupPoint[]` — pickup points for this event
- `showNativeTimeline: boolean`
- `showNativeBill: boolean`
- `showNativeConfirmation: boolean`
- `chatOpen: boolean` — in-overlay chat

**Function: `findInviteMatches()`**
1. Normalizes phone to 10 digits
2. Queries `invited_numbers` table: `eq('phone', normalizedPhone)`
3. For each match row, fetches its event from `events` by `invite_slug`
4. As fallback, queries `applications` with `in('status', ['invited','advance_paid','fully_paid'])` for the same phone
5. Deduplicates matches
6. If one match → calls `prepareNativeInviteFlow(match)` directly
7. If multiple → shows match selection list

**Function: `prepareNativeInviteFlow(match)`**
1. Fetches event by `invite_slug` (then tries `slug` as fallback)
2. In parallel:
   - Fetches `applications` row: `eq('phone', phone).eq('event_slug', realSlug).maybeSingle()`
   - Fetches `invite_payment_submissions` with `status IN ('advance_paid','fully_paid')` for this phone+invite_slug
3. Derives payment status:
   - `appStatus` = `appRow?.status` → fallback to `invitePayRow?.status` → fallback to `'invited'`
4. Sets state:
   - `isFullyPaid = appStatus === 'fully_paid'`
   - `isBalancePayment = appStatus === 'advance_paid'`
   - `priceAdvance = isBalancePayment ? price_full - price_advance : price_advance`
   - `savedPickupPointId` = `appRow?.pickup_point_id` (only if event has >1 pickup points)
5. Sets `nativeEventData` with full event details including firstDate, inviteSlug, etc.
6. Sets `inviteStep = 'wipe'` → after 760ms animation → `inviteStep = 'poster'`

### 6b. Invite Poster

Once `inviteStep === 'poster'`, shows the animated invite card:
- Event title, hero image, "You're on the list" heading
- Animated reveal with the user's name
- Key event info (date, location, price)

User taps the poster → `openSharedInviteBooking()`:
1. Checks sold-out: counts `invite_payment_submissions` with `status IN ('advance_paid','fully_paid')` for this invite_slug where `selected_date = firstDate`
2. If sold out → shows sold-out message
3. Else → `setShowNativeTimeline(true)`

### 6c. Native Booking Timeline

**Component: `NativeBookingTimeline`**

Shows the same booking-steps timeline pattern as the main flow, adapted for the invite context.

**Balance payment detection:**
- If `isBalancePayment = true`: 
  - Timeline shows "Pay Remaining Balance" as the active step
  - Amount shown = `price_full - price_advance` (the remaining)
  - CTA: "Pay Balance"
- If not (paying advance):
  - Normal advance payment

**Payment recording:**
`recordPaymentSubmission()` is called before redirecting to PayU:
1. Tries `supabase.rpc('upsert_payment_submission', {...})` 
2. Falls back to direct `supabase.from('invite_payment_submissions').insert({...})`
3. Also saves to `localStorage` as backup

**Function: `handleGetPaymentDetails()`** (PhonePe / instructions-based flow):
1. Calls `recordPaymentSubmission()`
2. Sets `paymentView = 'checkout'` to show payment instructions

### 6d. In-Overlay Chat & Doubts

When `chatOpen = true`, a chat panel slides in over the invite poster.

**The Essentials Card (`InviteChatEssentialsCard`):**
- Shows: Meeting Spot, Transport, Trip Date, Departure Time
- Sources data from `chatEventQuickInfo`, `chatEventTransportPlan`, `chatEventPickupPoints`, `nativeEventData.firstDate`
- If `savedPickupPointId` is set AND event has >1 pickup points:
  - Finds the specific saved pickup point
  - Overrides the meeting spot display and departure time with that point's data
  - So a Chennai user who chose "Chennai pickup" sees Chennai's details, not Delhi's generic ones

**Chat states in invite overlay:**
```
prompt → user taps "I have a doubt"
  └─ has_doubt → user types doubt
       └─ on submit → doubt_sending → doubt_submitted
prompt → user taps "Other topic"
  └─ other_topic (shows contact link)
```

**Doubt submission:**
```typescript
supabase.from('plan_doubts').insert({
  phone,
  event_slug,
  message: doubtText,
  status: 'new'
})
```

**FAQ display:**
- FAQs come from `event.invite_faqs` (not the main `event.faqs`)
- Admin manages these in the separate "Invite FAQs" section of TripForm

---

## 7. Pricing Logic

**Function: `getMeetingPointPricing(event, meetingPointId, city)`**

This is the single source of truth for what price a user pays. Called everywhere: timeline sheet, PayUCheckout, DetailsForm, NativeBookingTimeline.

```
IF no meetingPointId:
  → return { total: event.price (parsed), advance: event.advanceAmount }

FIND selectedPoint = event.pickupPoints.find(id === meetingPointId)

IF city === 'Other' (user is from another city):
  → total  = selectedPoint.otherPrice  ?? ownPoint?.ownTransportPrice ?? baseTotalParsed
  → advance = selectedPoint.otherAdvance ?? baseAdvance

ELSE IF meetingPointId === 'own_transport':
  → total  = ownPoint.ownTransportPrice ?? baseTotalParsed
  → advance = min(baseAdvance, ownTotal)

ELSE (regular pickup, same city):
  → total  = baseTotalParsed
  → advance = baseAdvance

RETURN { total, advance }
// balance = total - advance (computed by callers)
```

**Key rules:**
- `city === 'Other'` is the literal string, not a city name. It means "user is joining from a non-served city".
- `own_transport` is a special pickup point ID reserved for self-driven joiners.
- `otherPrice` / `otherAdvance` are per-pickup-point overrides for other-city pricing. Set in AdminPanel's "Meeting Points" section.
- `ownTransportPrice` is on the `own_transport` pickup point object itself.

---

## 8. City & Pickup Point System

### City values
- City strings are freeform text (e.g. `'Chennai'`, `'Delhi'`, `'Bengaluru'`)
- `'Other'` is a special sentinel meaning "user is not from any served city"
- Cities array on an event controls both: which users see the event (in old flow) and which pickup city buttons appear in chat

### `getCityPickupPoints(event, selectedCity)` → `PickupPoint[]`

Determines which pickup points to show in the EventDetailsOverlay calendar picker:

```
IF no DB pickup points:
  → return hardcoded MEETING_POINT_CONFIG fallback (Koyambedu + Anna Nagar)

IF any non-own_transport point has forOtherCity flag set (hasTaggedPoints):
  IF selectedCity === 'Other':
    → show points where forOtherCity === true
  ELSE:
    → show points where forOtherCity === false
    → also include own_transport if present

IF no flags set (legacy / untagged):
  → show all points to everyone

IF ownOnly === true on own_transport AND city !== 'Other':
  → show ONLY own_transport
```

### `MEETING_POINT_CONFIG` (hardcoded fallback)
For old events with no `pickup_points` in DB:
```typescript
{
  koyambedu: { meetingSpot: 'Koyambedu', transport: 'Party Bus', pickupTime: '7:00 AM' },
  anna_nagar: { meetingSpot: 'Anna Nagar', transport: 'Party Bus', pickupTime: '8:00 AM' }
}
```

### `dateOffset` on pickup points
Used in `JourneyCard` to shift the displayed departure date. E.g. if trip starts June 21 but the overnight bus departs the previous night (June 20), set `dateOffset = -1`. The `JourneyCard` adds this offset to the `startDate` before display.

### `JourneyCard` component
Shows after user completes city + date + pickup selection in the chat flow. Resolves meeting spot, transport, departure time, and date using this priority chain:
1. `dbPoint` (matched by `meetingPoint` ID in `event.pickupPoints`) → highest priority
2. `MEETING_POINT_CONFIG[meetingPoint]` (legacy fallback)
3. `city_details[city].meeting_spot` / `.transport` (city-specific quick_info override)
4. `event.quickInfo` flat fields

---

## 9. City-Specific Content (`city_details`)

### What it is
A `jsonb` column on the `events` table. Stores per-city overrides for content that differs between cities on the same plan (e.g. Himalayas trip departing from Chennai vs Delhi will have different Day 0 itinerary, different meeting spot, different transport).

### Structure
```json
{
  "Chennai": {
    "meeting_spot": "Chennai Central",
    "transport": "Overnight Volvo",
    "included": ["Bus Chennai → Shimla", "..."],
    "not_included": ["Lunch on Day 0"],
    "optional_activities": ["Sunrise walk"],
    "itinerary": [
      { "day": "Day 0", "title": "Leaving Chennai", "description": "", "schedule": [
        { "time": "9:00 PM", "activity": "Meet at Chennai Central" }
      ]}
    ]
  },
  "Delhi": {
    "meeting_spot": "Delhi",
    "transport": "Adventure Bus",
    "included": ["Bus Delhi → Shimla", "..."],
    "itinerary": [...]
  }
}
```

### Fallback chain (used everywhere)
```
city_details[selectedCity].field  →  event.field (flat column)
```

Single-city events → `city_details` is empty → always uses flat fields. No behavior change.
Multi-city events where a city hasn't been customized yet → also falls back to flat fields.
Once you save city-specific data via AdminPanel → only that city uses the overridden data.

### Where it's read in the frontend

**EventDetailsOverlay (`AppFlow.tsx`):**
```typescript
const _cd = (event as any).cityDetails?.[selectedCity];
// then used for: activeIncluded, activeNotIncluded, activeOptional, activeItinerary
// and: meetingSpot value in plan card, transport value in plan card
```

**JourneyCard (`AppFlow.tsx`):**
```typescript
const _cityData = city ? (event as any).cityDetails?.[city] : null;
// then: _cityData?.meeting_spot ?? spotField?.value
//       _cityData?.transport ?? transportField?.value
```

**`mapDbEventToEvent` in `supabase.ts`:**
```typescript
cityDetails: row.city_details ?? {}
```

### Where it's written in AdminPanel
`TripForm` component. Key derived state for city-specific editing:
```typescript
const contentCities = trip.cities.filter(c => c !== 'Other');
const multiCity = contentCities.length > 1;
const activeContentCity = contentCityTab || contentCities[0];
```

`CityTabs` component (inline, conditionally rendered when `multiCity`): radio-button style city selector that sets `contentCityTab` state.

City tabs appear in THREE sections when `multiCity`:
1. **"The Plan"** — Meeting Spot and Transport fields per city
2. **"You'll Experience (Itinerary)"** — per-city itinerary days and schedule
3. **"What's Included & Activities"** — per-city included / optional / not-included lists

All helpers (`updateCityStringItem`, `addCityStringItem`, `removeCityStringItem`, `updateCityItineraryDay`, etc.) check `!multiCity` first and fall through to the flat field helpers if single-city.

---

## 10. Admin Panel — Key Operations

### `saveTrip(trip)`
1. Auto-generates `invite_slug` from title (lowercase, alphanumeric+hyphens)
2. Forces `slug` and `invite_slug` to **lowercase** — critical to prevent event_slug case mismatches between tables
3. Destructs out: `event_dates`, `event_media`, `event_reviews`, `faqs`, `id` from the fields sent to Supabase
4. `city_details` is auto-included in the spread (no special handling needed)
5. After event row saved: delete-all + re-insert for `event_dates`, `event_media`, `event_reviews`, `faqs`
6. Refreshes `trips` state with raw DB data (NOT through `mapDbEventToEvent`)

### `approveApplication(id, trip, phone, application)`
1. `applications.update({ status: 'invited' })`
2. `invited_numbers.insert({ event_slug: trip.invite_slug, phone })`
3. POST to AiSensy API with template `'Invite-Only Automation'` and params `[eventName, eventDate]`
4. `applications.update({ aisensy_invite_sent: true/false })`

### `saveTimeline(trip, steps, forDate?, ctaLabel?)`
- If `forDate` provided: updates `event_dates.booking_steps` for that specific date
- Else: updates `events.booking_steps` for the whole event
- Also updates `events.cta_label` if `ctaLabel` provided

### `TripForm` — booking type toggle
Three modes controlled by a segmented button:
- **"Invite Only"**: `invite_only=true`, `booking_url=''`
- **"Open Event"**: `invite_only=false`, `booking_url='payu-hosted'` or `'native-application'`
- **"External Link"**: any URL, sets `booking_url`

Detected in frontend via:
- `bookingUrl === 'payu-hosted'` → PayU flow
- `bookingUrl === 'native-application'` → Application form flow
- `bookingUrl === ''` and `inviteOnly` → Invite-only CTA (external bookingUrl or invite gating)
- Anything else → opens URL externally

---

## 11. Key Business Rules & Edge Cases

### Girls-Only Events
- Pink (`#FF4FB8`) transition overlay instead of yellow
- Detected two ways: `event.girlsOnly` boolean OR `event.quickInfo` containing a label matching `'girls only event'`, `"girl's only event"`, `'girls_only_event'`, `'galcode event'` with value not `'false'`
- Sorted to the end of the event list in `SELECT_EVENT`

### Announcement Ticker
- Before event selection: rotates through `msgs['general_announcements']` (newline-separated) or derives from events
- After event is selected: rotates through `selectedEvent.announcements[]`
- 5 second interval between announcements

### Google Sign-in (PayU only)
`isDetailsFormValid` requires `!!googleUser` when `isPayUFlow`. The Google sign-in flow is an OAuth redirect, not a popup, which means state must be saved to `localStorage` (`gauth_return`) before redirect and restored on return.

### Duplicate Application Prevention
`applications` table has a unique constraint on `(phone, event_slug)`. On Supabase `insert` returning error code `23505` → show "You've already applied" screen.

### `event.id` vs `event.slug` vs `event.invite_slug`
- `event.id` in the frontend = `events.slug` in the DB (set by `mapDbEventToEvent: id = row.slug ?? row.id`)
- `events.id` in the DB = UUID (used for foreign keys in `event_dates`, `payu_payments`, etc.)
- `events.invite_slug` = used in `invited_numbers.event_slug` and `invite_payment_submissions.invite_slug`
- `events.slug` = used in `applications.event_slug`
- **These are usually the same string but must always be lowercase.** `saveTrip()` enforces this.

### In-App Browser Detection
`trackEvent()` in `supabase.ts` skips analytics if `navigator.userAgent` matches Instagram or Facebook in-app browser patterns. This prevents polluted analytics from social media previews.

### `isPreviewMode`
Detected via `?preview_event=SLUG` in URL. Loads the specific event directly, bypasses the chat flow, shows EventDetailsOverlay immediately. Used for direct sharing links.

---

## 12. Common Gotchas for Future Agents

**1. `trips` in AdminPanel is raw DB data, not `mapDbEventToEvent` output.**
After `saveTrip()` or on initial load, `setTrips(data as Trip[])` stores raw Supabase rows. This means property names are snake_case in AdminPanel state (`pickup_points`, `invite_slug`) but camelCase in AppFlow (`pickupPoints`, `inviteSlug`). Don't mix them up.

**2. `event.id` in AppFlow is the slug string, not the UUID.**
When writing Supabase queries in AppFlow context, use `event.id` for slug-based lookups. The actual UUID is not exposed in the Event type. Foreign key joins use `event_id` (UUID) but event lookups use `slug`.

**3. `invited_numbers.event_slug` matches `events.invite_slug`, NOT `events.slug`.**
The invite flow always uses `invite_slug` for `invited_numbers`. The `applications` flow uses `events.slug` (the regular slug). They are usually the same but enforced separately.

**4. `saveTrip()` does delete-all + re-insert for related tables.**
`event_dates`, `event_media`, `event_reviews`, `faqs` are completely replaced on every save. Partial updates are not done. Always pass the full arrays.

**5. `city_details` writes in AdminPanel use `contentCityTab` state.**
The `activeContentCity` variable in TripForm is derived from `contentCityTab || contentCities[0]`. If you add a new city to a plan and open the form fresh, the first city in `contentCities` is active by default. The tab state resets when the form is closed and reopened.

**6. The `city_details` fallback reads flat fields if `city_details[city] === undefined`.**
This is intentional. Until you explicitly save city-specific data for a city, it falls back to the flat event fields. But once you save ANYTHING for a city (even one field), the entire city-data object exists and other fields that weren't set will show empty (not the flat fallback). Design around this — prefer setting all city fields when you set any.

**7. `selectedCity = 'Other'` is a special string, not a real city.**
It means the user is not from any served city. This gates `forOtherCity` pickup point filtering and `otherPrice`/`otherAdvance` pricing. Never use `'Other'` as an actual city name.

**8. `bookingUrl === 'native-application'` controls the entire application form flow.**
This single field determines whether users see "Book Now" (PayU) or "Request Invitation" (application form). The `inviteOnly` boolean gates invite-only messaging but `bookingUrl` gates the payment vs. application split.

**9. AiSensy template name is hardcoded: `'Invite-Only Automation'`.**
If the template is renamed on AiSensy's side, the approval flow will silently fail. The template expects exactly two params: `[eventName, eventDate]`.

**10. `JourneyCard` accepts a `city` prop but historically didn't use it.**
This was fixed — `city` is now destructured and used for `city_details` override. If you create a `JourneyCard` without passing `city`, the city-specific meeting spot/transport won't show. Always pass `city={selectedCity}`.

**11. Balance payment detection in invite flow uses `applications.status === 'advance_paid'`.**
The invite flow checks this to decide whether to show "Pay Remaining Balance" instead of "Pay Advance". If the status management in AdminPanel's approval flow changes, this logic in `prepareNativeInviteFlow()` may need updating.

**12. The `show_secret_offer` field still exists in the DB and Trip type.**
The Secret Offer admin UI section was removed from TripForm, but the field is still persisted. Existing events that had `show_secret_offer: true` in the DB will still show the secret offer on the payment success screen. New plans default to `show_secret_offer: false`.
