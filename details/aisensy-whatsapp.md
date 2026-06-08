# AiSensy WhatsApp Messages — Full Reference

## Overview

We use [AiSensy](https://aisensy.com) to send automated WhatsApp messages to users at key points in their booking journey. All messages are sent via the AiSensy Campaign API using pre-approved WhatsApp templates.

**AiSensy API Endpoint:** `https://backend.aisensy.com/campaign/t1/api/v2`  
**AiSensy Account:** chapter A 3063  
**API Key:** stored as `AISENSY_API_KEY` constant in each file that uses it

---

## Currently Active Messages

### 1. Invitation Message (on Admin Approval)

**What it does:** Sent to a user the moment an admin clicks "Approve" on their application in the admin panel.

**Where it's triggered:** `src/AdminPanel.tsx` — inside the `handleApprove()` function

**AiSensy Campaign Name:** `Invite-Only Automation`

**Template Parameters:**
| # | Value | Example |
|---|-------|---------|
| 1 | Event name | `Chill-pill in Himalayas` |
| 2 | Event date (formatted) | `Monday, March 5th` |

**Flow:**
1. Admin clicks "Approve" on an application
2. `applications.status` is updated to `'invited'` in the DB first
3. AiSensy API is called with the user's phone number and template params
4. If successful (HTTP 200–299): `applications.aisensy_invite_sent = true`
5. If failed: `applications.aisensy_invite_sent = false`

**Deduplication:** The function checks `aisensy_invite_sent` before sending. If already `true`, it skips the API call — so re-approving the same person doesn't double-send.

**Phone format:** `91` + last 10 digits of the phone number stored in `applications.phone`

---

### 2. Advance Payment Confirmation Message

**What it does:** Sent to a user after they successfully pay the advance amount via PayU. Confirms the payment and tells them when the balance is due.

**Where it's triggered:** Two places (both call the same `fireAdvancePaidWhatsApp()` function):
- `supabase/functions/payu-callback/index.ts` — triggered when the user is redirected back from PayU's payment page (SURL callback)
- `supabase/functions/payu-webhook/index.ts` — triggered by PayU's server-to-server webhook (backup, in case the user closes the browser before the callback fires)

**AiSensy Campaign Name:** `advance_paid+balance`

**Template Parameters:**
| # | Value | Example |
|---|-------|---------|
| 1 | Amount paid (INR formatted) | `₹4,500` |
| 2 | Balance due date (formatted) | `June 10th` |
| 3 | PayU Transaction ID | `CHA17391234ABCD` |

The balance due date is read from the event's `booking_steps` array — specifically the step whose label/value contains the word "balance".

#### How the Balance Due Date Is Calculated

The logic lives inside `fireAdvancePaidWhatsApp()` in both `payu-callback` and `payu-webhook`:

```typescript
// Step 1 — fetch the event's booking_steps from the DB
const { data: ev } = await supabase
  .from('events')
  .select('booking_steps')
  .eq('slug', args.eventSlug)
  .maybeSingle();

// Step 2 — find the step whose label or value contains the word "balance"
const balStep = (ev?.booking_steps ?? []).find((s: any) =>
  /balance/i.test(`${s.label ?? ''} ${s.value ?? ''}`)
);

// Step 3 — format the date as "Month Dayth" (e.g. "June 10th")
const dueFinal = formatDueDate(balStep?.date ?? '');
```

The `formatDueDate()` function:
```typescript
function formatDueDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return '';
  const month = d.toLocaleDateString('en-US', { month: 'long' });
  const day = d.getDate();
  const s = ['th', 'st', 'nd', 'rd'], v = day % 100;
  const suffix = (s[(v - 20) % 10] || s[v] || s[0]);
  return `${month} ${day}${suffix}`;  // e.g. "June 10th"
}
```

**In plain English:**
1. The `events` table has a `booking_steps` JSON column — an array of steps like `[{ label: "Advance", date: "2026-05-01" }, { label: "Balance Due", date: "2026-06-10" }]`
2. We scan the array for a step whose label or value contains the word "balance" (case-insensitive)
3. We take that step's `date` (stored as ISO string `YYYY-MM-DD`) and format it into something readable like `June 10th`
4. If no matching step is found OR no date is set on it, `dueFinal` becomes an empty string `""` — the WhatsApp message sends with a blank where the date should be

#### Current Weaknesses

| Problem | Impact |
|---------|--------|
| If no `booking_steps` step has "balance" in its name, `dueFinal` is empty — the message sends with a blank date field | User gets a confusing message |
| If the balance step has no `date` set, same blank result | Same problem |
| The function fetches `events.booking_steps` (top-level on the event), but some events have date-specific `booking_steps` on `event_dates` rows — those are ignored | Wrong or missing balance date for multi-date events |
| The balance date is looked up at the time of payment, not stored at order creation — if someone updates the event's booking steps after payment, the sent message would have reflected old data | Inconsistency (minor) |
| No fallback text if the date is empty | Blank in WhatsApp template |

#### How to Make It More Stable

**Recommended: Store the balance due date in `payu_payments` at order creation time**

In `create-payu-order/index.ts`, when creating the PayU order, look up and store the balance due date immediately:

```typescript
// In create-payu-order — look up balance date at order creation
const { data: ev } = await supabase
  .from('events')
  .select('booking_steps, event_dates(booking_steps)')
  .eq('slug', canonicalSlug)
  .maybeSingle();

// Check date-specific steps first, then fall back to event-level
const stepsToCheck = (tripDate
  ? ev?.event_dates?.find(d => d.start_date === tripDate)?.booking_steps
  : null) ?? ev?.booking_steps ?? [];

const balStep = stepsToCheck.find((s: any) =>
  /balance/i.test(`${s.label ?? ''} ${s.value ?? ''}`)
);

// Store it in payu_payments
await supabase.from('payu_payments').insert({
  ...otherFields,
  balance_due_date: balStep?.date ?? null,   // new column
});
```

Then in `payu-callback` and `payu-webhook`, just read `payment.balance_due_date` directly — no need to re-fetch the event:

```typescript
const dueFinal = formatDueDate(payment?.balance_due_date ?? '');
```

**Benefits:**
- Balance date is locked in at payment time — immune to later event edits
- No extra DB query at payment confirmation time (faster)
- Works correctly for date-specific `booking_steps` on `event_dates`
- Single source of truth

**Also add a fallback string** in case the date is still blank:
```typescript
const dueFinal = formatDueDate(payment?.balance_due_date ?? '') || 'as per event schedule';
```

**DB column to add:**
```sql
ALTER TABLE payu_payments ADD COLUMN balance_due_date DATE;
```

**Flow:**
1. User completes PayU payment
2. PayU fires both the callback (browser redirect) and the webhook (server-to-server)
3. Both update `payu_payments.status = 'success'` and `applications.status = 'advance_paid'`
4. Both call `fireAdvancePaidWhatsApp()` — but the deduplication flag prevents double-sending
5. If successful: `applications.aisensy_advance_paid_sent = true`

**Deduplication:** Checks `aisensy_advance_paid_sent` on the application row. Whichever fires first (callback or webhook) sends the message and marks the flag. The second one silently skips.

**Only fires for `payment_type = 'advance'`** — balance payments don't currently send a WhatsApp message.

---

## Summary Table

| Message | Campaign | Triggered by | Template params | Dedup DB flag |
|---------|----------|-------------|-----------------|---------------|
| Invitation | `Invite-Only Automation` | Admin clicks Approve | Event name, event date | `aisensy_invite_sent` |
| Advance confirmed | `advance_paid+balance` | PayU callback + webhook | Amount, balance due date, txnid | `aisensy_advance_paid_sent` |

---

## How to Add a New Message

To add a new AiSensy message:

1. **Create the template in AiSensy dashboard** — get it approved by WhatsApp (takes 24–48 hours). Note the exact campaign name.

2. **Add a dedup flag column in the DB** (optional but recommended):
   ```sql
   ALTER TABLE applications ADD COLUMN aisensy_your_message_sent BOOLEAN DEFAULT FALSE;
   ```

3. **Write a `fireYourMessage()` async function** (model it after `fireAdvancePaidWhatsApp`):
   ```typescript
   async function fireYourMessage(supabase, args) {
     // 1. Check dedup flag
     // 2. Call AiSensy API
     // 3. On success, mark flag true in DB
   }
   ```

4. **Call it** from the right place — admin panel action, edge function, or a new Supabase Edge Function.

---

## Future Messages (Not Yet Built)

### Payment Failed Message

**Use case:** User attempts to pay but the PayU transaction fails (network drop, card decline, etc.). Send a WhatsApp nudge to retry.

**How to implement:**
- In `payu-callback/index.ts`, in the `else` branch (when `status !== 'success'`), call a `firePaymentFailedWhatsApp()` function.
- The phone number is available from `payu_payments` row (looked up by `txnid`).
- Suggested template params: event name, a retry link (e.g. `chaptera.in/invite/{event_slug}`)
- Add a dedup flag `aisensy_payment_failed_sent` to avoid re-sending on repeated failures for the same txnid.
- Consider only sending once per application (not once per failed transaction) to avoid spamming.

**Approximate code location:**
```
supabase/functions/payu-callback/index.ts
→ inside the else branch at the bottom of Deno.serve()
```

**Things to handle carefully:**
- Don't send if the user has already successfully paid (check `applications.status`)
- Rate-limit: don't send more than once per 24 hours per user per event

---

### Cart Abandonment Message

**Use case:** A user reaches the billing/payment page (sees the PayU amount breakdown) but closes the browser or navigates away without clicking "Pay Now".

**How to detect abandonment:**
- When `create-payu-order` edge function is called, a `payu_payments` row is inserted with `status = 'pending'`
- If the user pays, the status changes to `'success'` or `'failure'`
- If they abandon, the row stays `'pending'` forever

**Implementation approach:**

**Option A — Scheduled Edge Function (Recommended)**
1. Create a Supabase Edge Function `send-cart-abandonment-whatsapp`
2. Set up a **pg_cron job** (or Supabase scheduled function) to run every 30–60 minutes
3. Query for `payu_payments` rows where:
   - `status = 'pending'`
   - `created_at` is between 30 minutes and 24 hours ago
   - `aisensy_abandonment_sent IS NOT TRUE`
4. For each, look up the user's phone from the `payu_payments` row and fire the AiSensy message
5. Mark `aisensy_abandonment_sent = true` to avoid re-sending

```sql
-- Example query for the scheduled function
SELECT * FROM payu_payments
WHERE status = 'pending'
  AND created_at < now() - interval '30 minutes'
  AND created_at > now() - interval '24 hours'
  AND (aisensy_abandonment_sent IS NOT TRUE);
```

**Option B — Frontend Beacon**
- Use `navigator.sendBeacon()` or `window.beforeunload` on the billing page to ping an edge function when the user leaves
- Less reliable (browsers block/throttle beforeunload calls on mobile)
- Not recommended as the sole method

**Suggested template params for abandonment:**
| # | Value | Example |
|---|-------|---------|
| 1 | User's first name | `Krutesh` |
| 2 | Event name | `Chill-pill in Himalayas` |
| 3 | Advance amount | `₹4,500` |
| 4 | Invite link | `chaptera.in/invite/chill-pill-himalayas` |

**DB column to add:**
```sql
ALTER TABLE payu_payments ADD COLUMN aisensy_abandonment_sent BOOLEAN DEFAULT FALSE;
```

**Things to handle carefully:**
- Only send once per user per event (not per transaction — they may create multiple pending rows if they re-open the page)
- Don't send if a later row for the same user+event has `status = 'success'`
- Check: `SELECT 1 FROM payu_payments WHERE phone = X AND event_slug = Y AND status = 'success'` before firing

---

## Relevant Files

| File | Role |
|------|------|
| `src/AdminPanel.tsx` | Contains invite approval trigger (`handleApprove`) |
| `supabase/functions/payu-callback/index.ts` | Advance paid trigger (browser callback) |
| `supabase/functions/payu-webhook/index.ts` | Advance paid trigger (server webhook backup) |
| `supabase/functions/create-payu-order/index.ts` | Creates `payu_payments` row (abandonment detection starts here) |

## Relevant DB Columns

| Table | Column | Purpose |
|-------|--------|---------|
| `applications` | `aisensy_invite_sent` | Dedup flag for invitation message |
| `applications` | `aisensy_advance_paid_sent` | Dedup flag for advance paid message |
| `payu_payments` | `status` | `pending` → `success`/`failure` (used for abandonment detection) |
| `payu_payments` | `aisensy_abandonment_sent` | (not yet added) Dedup flag for cart abandonment |
