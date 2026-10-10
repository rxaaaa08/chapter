# Global Announcement Ticker — Full Reference

## What It Is

The booking chat has a scrolling ticker strip that shows global announcement messages to every user before they've selected a specific event. Once a user reaches the trip details step (FAQ / doubts / done), the ticker switches to that event's own `announcements` array instead.

The ticker is driven by **dynamic computed text** — not manually typed strings. Each announcement is auto-generated from live event data (reserved spots, total applications) so it always reflects the current state without anyone touching it.

---

## Where It Shows

- **Before event selection:** ticker shows `globalAnnouncements` (dynamic computed list)
- **After event selection (ASK_DOUBTS / SHOW_FAQ / DONE steps):** ticker switches to `selectedEvent.announcements[]` if that array is non-empty, otherwise falls back to `globalAnnouncements`

**Code location:** `src/AppFlow.tsx` lines ~1099–1103

```ts
const isAfterTripInfo = step === 'ASK_DOUBTS' || step === 'SHOW_FAQ' || step === 'DONE';
const currentAnnouncements = (isAfterTripInfo && (selectedEvent?.announcements?.length ?? 0) > 0)
  ? (selectedEvent?.announcements ?? [])
  : globalAnnouncements;
```

---

## Priority / Fallback Chain

`globalAnnouncements` resolves in this priority order:

```
1. dynamicAnnouncements   ← computed from invite-only event data (this system)
        ↓ (if empty)
2. general_announcements  ← legacy: newline-separated text in chat_messages table
        ↓ (if empty)
3. GENERAL_ANNOUNCEMENTS  ← hardcoded fallback in AppFlow.tsx
```

**Hardcoded fallback** (`src/AppFlow.tsx` line ~391):
```ts
const GENERAL_ANNOUNCEMENTS = [
  "Chennai-based social club with 4000+ members",
  "Pondicherry Weekend Escape bookings are live",
  "Kolukkumalai Sunrise Trail now taking bookings"
];
```

In practice, as long as at least one event slot is configured in the admin panel, `dynamicAnnouncements` will always be non-empty (it always includes the static text at the end), so the fallbacks never fire.

---

## How Dynamic Announcements Are Computed

### Trigger
Computed once per page load, inside a `useEffect` in `AppFlow.tsx` that runs when both:
- `msgsReady` is true (chat_messages fetched from Supabase)
- `eventsLoaded` is true (events list fetched from Supabase)

### Inputs (from `chat_messages` table)

| `step_key` | value format | example |
|---|---|---|
| `announcement_event_slugs` | newline-separated event slugs | `pondicherry-weekend-escape-chennai\nchill-pill-in-himalayas` |
| `announcement_static_text` | plain text | `plans we dream` |

### Per-event logic

For each slug in `announcement_event_slugs`:

1. Find the event in the loaded events list by `event.id === slug` (id is mapped from `row.slug` in `mapDbEventToEvent`)
2. Read `event.totalCapacity` — if null/zero, **skip this event** (no announcement line produced)
3. Call `fetchEventCounts(slug)` → returns `{ registered, reserved }`
   - `registered` = total applications for this event (any status)
   - `reserved` = applications with status `advance_paid` OR `fully_paid` only
4. Apply threshold logic:

```
reserved >= totalCapacity
  → "{title} - sold out"

reserved / totalCapacity >= 0.5  (at least 50% of spots reserved)
  → "{title} - {totalCapacity - reserved} spots left"

< 50% reserved
  → "{title} - {(totalCapacity × 3) + registered} people have registered"
```

All titles are forced **lowercase**.

### Inflated "people have registered" number

The displayed number is intentionally inflated to create social proof:

- If `registered === 0`: display `totalCapacity × 3`
- If `registered > 0`: display `(totalCapacity × 3) + registered`

This is the **same logic** used in the invite-only booking timeline's last step (spots left indicator). The multiplier of 3 is hardcoded — if you want to change it, update line ~988 in `AppFlow.tsx` and line ~1179 in `AdminPanel.tsx`.

### Static text

After all event lines are resolved, the static text (default: `"plans we dream"`) is always appended as the last item in the array.

### Final array example

Config: 2 slugs + static text `"plans we dream"`

Suppose:
- Pondy: capacity 20, reserved 12 → 60% → `"pondy beach houseparty - 8 spots left"`
- Himalayas: capacity 15, reserved 0, registered 5 → `"chill-pill in himalayas - 50 people have registered"` (15×3+5=50)

Result ticker: `["pondy beach houseparty - 8 spots left", "chill-pill in himalayas - 50 people have registered", "plans we dream"]`

---

## Admin Panel Configuration

**Location:** Admin Panel → Messages tab → "Global Announcements" section

### Event Slots

- Click **+ Add Event Slot** to add a row
- Each row has a dropdown listing all invite-only events (events where `booking_url = 'native-application'` OR `invite_only = true`)
- A **live preview** appears below each dropdown showing the computed announcement text with real current counts
- If an event has no Group Size set (`total_capacity` is null), the preview shows a warning: `⚠ {title} — no Group Size set (announcement won't show)`
- Click **Remove** to delete a slot

### Static Text Field

One plain-text field below the event slots. Defaults to `"plans we dream"` if left blank. Always appended last.

### Save

Click **Save Announcement Config** — writes both `announcement_event_slugs` and `announcement_static_text` to the `chat_messages` table.

---

## Database Storage

Both values live in the `chat_messages` table, reusing the same CMS pattern as all other bot messages.

| `step_key` | `bot_message` | description |
|---|---|---|
| `announcement_event_slugs` | newline-separated slugs | which events to include |
| `announcement_static_text` | plain string | the always-on last item |

These rows are upserted by `saveAnnouncementConfig()` in `AdminPanel.tsx`. If a row for that `step_key` doesn't exist yet, it's inserted. If it exists, it's updated.

---

## Prerequisites for an Event to Appear

An event must satisfy **all** of the following for its announcement to compute correctly:

| Requirement | Where to set it |
|---|---|
| `invite_only = true` AND `booking_url = 'native-application'` | Admin Panel → Plans → edit event → Booking Type = **Invite Only** |
| `total_capacity > 0` | Admin Panel → Plans → edit event → **Total Spots** field (same as Group Size) |
| `is_active = true` | Admin Panel → Plans → event must be active (AppFlow only fetches active events) |

If `total_capacity` is null, the event won't produce an announcement line — the admin panel preview will warn you.

---

## Key Files

| file | what it does |
|---|---|
| `src/AppFlow.tsx` ~968–995 | `useEffect` that computes `dynamicAnnouncements` on page load |
| `src/AppFlow.tsx` ~1091–1097 | `globalAnnouncements` priority resolution |
| `src/AppFlow.tsx` ~1099–1103 | Switches between global and per-event ticker |
| `src/AppFlow.tsx` ~391–395 | `GENERAL_ANNOUNCEMENTS` hardcoded fallback |
| `src/AdminPanel.tsx` ~1167–1181 | `computeAnnouncementText()` — mirrors AppFlow logic, used for live preview |
| `src/AdminPanel.tsx` ~1183–1192 | `useEffect` fetching counts for selected slugs (preview only) |
| `src/AdminPanel.tsx` ~1194–1219 | `saveAnnouncementConfig()` — writes to chat_messages |
| `src/AdminPanel.tsx` ~2809–2870 | Admin UI for Global Announcements section |
| `src/supabase.ts` ~188–205 | `fetchEventCounts(slug)` — returns `{ registered, reserved }` |

---

## Thresholds — Quick Reference

| condition | text shown |
|---|---|
| `reserved >= totalCapacity` | `{title} - sold out` |
| `reserved / totalCapacity >= 0.5` | `{title} - {spotsLeft} spots left` |
| `reserved / totalCapacity < 0.5` | `{title} - {(capacity × 3) + registered} people have registered` |
| `total_capacity` is null | event skipped entirely (no line produced) |

The `0.5` threshold and `× 3` multiplier are identical to what's shown in the invite-only booking timeline spots indicator.

---

## Pending / Nice to Have

- [ ] The `× 3` multiplier is hardcoded in two places (`AppFlow.tsx` and `AdminPanel.tsx`). Could be made configurable via a `chat_messages` key like `announcement_multiplier`.
- [ ] Counts are fetched fresh on every page load (one Supabase query per slug). For high-traffic events this is fine; for many slugs it could be batched.
- [ ] If slugs are configured but all events lack `total_capacity`, `dynamicAnnouncements` will only contain the static text — still non-empty, so fallback chain never fires.
