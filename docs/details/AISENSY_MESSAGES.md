# AiSensy WhatsApp Messages — Full Reference

This document explains every AiSensy WhatsApp message that chapter அ sends
automatically — what triggers each one, what data it uses, and what guards
prevent it from firing incorrectly.

---

## 1. Advance Paid / Balance Paid (`advance_paid+balance`)

### When it fires
Triggered inside the `payu-callback` Supabase Edge Function, immediately after
PayU confirms a **successful** payment with `payment_type = 'advance'`.

It does NOT fire for balance payments — balance completions just update the
application status to `fully_paid` but send no separate WA message through
this campaign.

### Full trigger chain

```
User taps Pay on the bill page
  → Frontend submits hidden PayU form
  → User completes payment on PayU's page
  → PayU POSTs to: https://txcmismkdttgsyhbnexf.supabase.co/functions/v1/payu-callback
  → payu-callback verifies the PayU hash
  → Updates payu_payments row: status = 'success'
  → Updates applications row: status = 'advance_paid'
  → Calls fireAdvancePaidWhatsApp()
  → Sends AiSensy campaign: advance_paid+balance
```

### Template variables
| Placeholder | Value | Source |
|---|---|---|
| `{{1}}` | Payment amount e.g. `₹1,024` | `payu_payments.amount` |
| `{{2}}` | Balance due date e.g. `May 29th` | `events.booking_steps` — finds the step whose label/value contains "balance" and formats its `date` field |
| `{{3}}` | Transaction ID e.g. `CHA17793...` | `payu_payments.txnid` |

### De-duplication guard
Before sending, checks `applications.aisensy_advance_paid_sent`.
- If `true` → skips (message already sent for this person + event)
- If `false` → sends, then sets `aisensy_advance_paid_sent = true`

This means even if PayU calls the callback twice for the same transaction,
the message only fires once.

### Failure conditions (message silently skipped)
- No `applications` row found for this `phone` + `event_slug`
- `aisensy_advance_paid_sent` is already `true`
- AiSensy API returns a non-2xx response (flag stays `false`, no retry)

---

## 2. Payment Failed (`payment_failed`)

### When it fires
Triggered inside the `payu-callback` Edge Function when PayU reports a
**failed** payment (`status ≠ 'success'`).

### Full trigger chain

```
User attempts payment on PayU's page but it fails
  → PayU POSTs to: payu-callback
  → payu-callback updates payu_payments row: status = 'failure'
  → Calls firePaymentFailedWhatsApp()
  → Sends AiSensy campaign: payment_failed
  → Redirects browser to: /invite?payment_status=failed&txnid=...
```

### Template variables
| Placeholder | Value | Source |
|---|---|---|
| `{{1}}` | User's name e.g. `Krutesh` | `applications.name` |
| `{{2}}` | Amount attempted e.g. `₹1,024` | `payu_payments.amount` |

### De-duplication guard
Before sending, checks `applications.aisensy_payment_failed_sent`.
- If `true` → skips (already sent once for this person + event)
- If `false` → sends, then sets `aisensy_payment_failed_sent = true`

This means if someone fails payment 3 times in a row, they only receive the
failed message once.

### Failure conditions (message silently skipped)
- No `applications` row found for this `phone` + `event_slug`
- `aisensy_payment_failed_sent` is already `true`
- AiSensy API returns a non-2xx response

---

## 3. Cart Abandonment (`cart_abandonment`)

### When it fires
Triggered by a **pg_cron job** that runs every 30 minutes on the Supabase
database. It calls the `cart-abandonment` Edge Function via HTTP. The function
picks up anyone who opened the bill page but never tapped Pay, and has been
sitting idle for more than 2 hours.

### Full trigger chain

```
User reaches the bill breakdown page (NativePaymentOverlay)
  → Frontend upserts a row into bill_opens table
     (phone, event_slug, opened_at = now, cart_abandonment_sent = false)
  → If user opens bill page again: opened_at is reset to the new time
     (same row updated — UNIQUE constraint on phone + event_slug)

pg_cron fires every 30 minutes:
  → Calls: POST https://txcmismkdttgsyhbnexf.supabase.co/functions/v1/cart-abandonment
  → Function queries bill_opens WHERE:
       cart_abandonment_sent = false
       AND opened_at < NOW() - 2 hours
  → For each row found:
       1. Checks payu_payments for this phone + event_slug
          → If ANY row exists (success, failure, or pending) → skip
            (person already attempted payment — don't nudge)
       2. Looks up applications.name for the display name
          → Falls back to bill_opens.name, then 'there'
       3. Fires AiSensy campaign: cart_abandonment
       4. On success: sets cart_abandonment_sent = true
```

### Cron job SQL
```sql
SELECT cron.schedule(
  'cart-abandonment-every-30min',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://txcmismkdttgsyhbnexf.supabase.co/functions/v1/cart-abandonment',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  )
  $$
);
```

### Template variables
| Placeholder | Value | Source |
|---|---|---|
| `{{1}}` | User's name | `applications.name` → `bill_opens.name` → `'there'` |
| `{{2}}` | Event title e.g. `Sunrise at Kovalam` | `bill_opens.event_title` |

### Contact Us button URL
`https://chaptera.in/invite`

### De-duplication guard
`bill_opens.cart_abandonment_sent` flag:
- `false` (default) → eligible for sending
- `true` → permanently excluded from all future cron runs

Set to `true` in two cases:
1. Message sent successfully (AiSensy returns 2xx)
2. A `payu_payments` row was found → skipped but still marked `true` so
   the row is never checked again

### Timer behaviour (important)
Because the upsert resets `opened_at` on every bill page open:

| Scenario | Result |
|---|---|
| Opens bill → pays within 2 hrs | `payu_payments` row exists → skipped |
| Opens bill → leaves → never returns | Message fires 2 hrs after first open |
| Opens bill → leaves → returns within 2 hrs → leaves again | `opened_at` resets → message fires 2 hrs after second open |
| Opens bill → leaves → returns after 2 hrs (message already sent) | `cart_abandonment_sent = true` → no second message |

### Force-test URL
To manually trigger for a specific number without waiting 2 hours:
```
https://txcmismkdttgsyhbnexf.supabase.co/functions/v1/cart-abandonment?force=true&phone=XXXXXXXXXX&secret=chaptera_cron_2025
```
Note: force mode still respects `cart_abandonment_sent = false`. If the flag
is already `true` for that number, it won't fire again.

### Failure conditions (message silently skipped)
- `payu_payments` row exists for this phone + event (any status)
- `cart_abandonment_sent` is already `true`
- AiSensy returns non-2xx (flag stays `false`, retried on next cron tick)

---

## Database tables involved

### `bill_opens`
Tracks every user who reaches the bill breakdown page.

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `phone` | text | 10-digit number (no country code) |
| `name` | text | Name from poster verification (fallback only) |
| `event_slug` | text | Canonical `events.slug` |
| `event_title` | text | Event title at time of bill open |
| `opened_at` | timestamptz | Reset every time bill page is opened |
| `cart_abandonment_sent` | boolean | One-way flag — never reset to false |

Unique constraint: `(phone, event_slug)` — only one row per person per event.

### `applications`
Stores all invite applications. Key columns for messaging:

| Column | Description |
|---|---|
| `aisensy_advance_paid_sent` | Prevents duplicate advance paid messages |
| `aisensy_payment_failed_sent` | Prevents duplicate payment failed messages |
| `name` | Used as `{{1}}` in payment failed + cart abandonment |
| `status` | Updated to `advance_paid` or `fully_paid` on payment success |

### `payu_payments`
One row per payment attempt. Multiple rows can exist for the same
phone + event_slug (each attempt is separate).

| Column | Description |
|---|---|
| `phone` | 10-digit number |
| `event_slug` | Canonical `events.slug` |
| `status` | `pending` / `success` / `failure` |
| `txnid` | Unique transaction ID (prefixed `CHA...`) |

---

## Edge Functions involved

| Function | Trigger | Purpose |
|---|---|---|
| `payu-callback` | PayU HTTP POST on payment completion | Handles success + failure, fires advance_paid and payment_failed WA messages |
| `cart-abandonment` | pg_cron every 30 min | Fires cart_abandonment WA message for bill-openers who never paid |

---

## Summary — when each message fires

| Message | Campaign name | Triggered by | One-time guard |
|---|---|---|---|
| Advance Paid | `advance_paid+balance` | PayU success callback | `applications.aisensy_advance_paid_sent` |
| Payment Failed | `payment_failed` | PayU failure callback | `applications.aisensy_payment_failed_sent` |
| Cart Abandonment | `cart_abandonment` | pg_cron (every 30 min, 2hr delay) | `bill_opens.cart_abandonment_sent` |
