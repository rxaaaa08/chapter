# TODO — AiSensy Balance-Paid WhatsApp Confirmation

**Status:** Planned, not yet implemented.
**Authored:** 5 Jun 2026.
**Owner action required (Krutesh):** Create the AiSensy template in the
AiSensy dashboard and hand the approved campaign name back to Claude.

---

## 1. Why this exists

There's a gap in the WhatsApp automation: customers receive a WhatsApp message
when they **pay the advance** (campaign `advance_paid+balance`) but receive
**nothing** when they pay the **remaining balance** and become fully paid.

Balance is typically paid 1–3 days before the event — exactly when the
customer is most anxious about details (meeting spot, group chat invite,
trip logistics). Right now their only confirmation is the receipt page,
which they might miss if PayU's redirect feels loose to them.

## 2. Current AiSensy state (today)

The three campaigns that fire automatically:

| Trigger | Campaign name | Status |
|---|---|---|
| Admin approves application | `invitation_with_contact` | ✅ live |
| Customer pays advance | `advance_paid+balance` | ✅ live |
| Customer pays balance | — | ❌ **gap** |
| Payment fails | `payment_failed` | ✅ live |

Verified by checking the `applications` table — it has tracking flags for the
three live ones (`aisensy_invite_sent`, `aisensy_advance_paid_sent`,
`aisensy_payment_failed_sent`) but no `aisensy_balance_paid_sent`.

## 3. What Krutesh needs to do (in AiSensy dashboard)

### Step 1 — Create the template

1. Log into AiSensy → **Templates** → **Create New Template**
2. **Name:** something clear and short, e.g. `balance_paid` or `fully_paid`
   (you'll send this exact string to Claude)
3. **Language:** English (or whatever matches your other templates)
4. **Category:** Transactional / Utility (NOT marketing — Meta is stricter
   about marketing templates)
5. **Header:** optional, can skip
6. **Body — suggested copy** (edit to taste):

   > Hey {{1}}, your booking for **{{2}}** is now fully settled! 🎉
   >
   > We'll add you to the group chat by **{{3}}** with all the details. See
   > you on **{{4}}**! 💛
   >
   > – Team chapter அ

   The four placeholders map to: `[name, event_name, meeting_spot_date, trip_date]`

7. **Footer:** optional
8. **Buttons:** optional. Recommended:
   - "View Receipt" → URL: `https://chaptera.in/receipt?txnid={{5}}`
     (If you add this button, you'll have 5 params total instead of 4.
     Tell Claude which version you went with.)

### Step 2 — Submit for approval

- Click **Submit**. Meta WhatsApp approves templates within **24–48 hours**
  (sometimes faster, sometimes longer if the template uses words that flag
  their review). You'll see the status change to **Approved** or **Rejected**
  in your AiSensy template list.

### Step 3 — Hand the campaign name to Claude

Once approved, message Claude with:

```
AiSensy balance-paid template is approved.
Campaign name: <exact string from AiSensy>
Params order: [name, event_name, meeting_spot_date, trip_date]
(Or 5 params if you added the View Receipt button)
```

That's all you need to do. Claude takes it from there.

## 4. What Claude will do (code side)

When you hand over the campaign name, Claude will make these changes — all
mirror what already exists for the `advance_paid+balance` campaign:

### 4a. Database migration

```sql
-- Add a tracking flag to prevent duplicate sends if PayU retries the callback
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS aisensy_balance_paid_sent boolean DEFAULT false;
```

### 4b. Edge function changes

Two files, both currently fire `fireAdvancePaidWhatsApp` when `paymentType === 'advance'`:

- `supabase/functions/payu-callback/index.ts`
- `supabase/functions/payu-webhook/index.ts`

Claude will add a parallel function `fireBalancePaidWhatsApp` with this shape:

```ts
const AISENSY_CAMPAIGN_BALANCE = '<campaign name you provided>';

async function fireBalancePaidWhatsApp(supabase: any, args: {
  phone: string; eventSlug: string; amount: number | string; txnid: string;
}) {
  const AISENSY_API_KEY = Deno.env.get('AISENSY_API_KEY');
  if (!AISENSY_API_KEY) return;

  try {
    const { data: app } = await supabase
      .from('applications')
      .select('id, name, aisensy_balance_paid_sent')
      .eq('phone', args.phone)
      .eq('event_slug', args.eventSlug)
      .maybeSingle();
    if (!app || app.aisensy_balance_paid_sent) return;  // idempotent guard

    // Pull the 4th booking step's date (Meeting Spot Details = group chat add)
    // and the trip date from event_dates for the template params.
    const { data: ev } = await supabase
      .from('events')
      .select('title, booking_steps, event_dates(date)')
      .eq('slug', args.eventSlug)
      .maybeSingle();
    const meetingSpotStep = (ev?.booking_steps ?? [])[3];
    const meetingSpotDate = formatDueDate(meetingSpotStep?.date ?? '');
    const tripDate = formatDueDate(ev?.event_dates?.[0]?.date ?? '');
    const eventName = ev?.title ?? 'your trip';

    const aiRes = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: AISENSY_API_KEY,
        campaignName: AISENSY_CAMPAIGN_BALANCE,
        destination: '91' + args.phone,
        userName: app.name || 'guest',
        templateParams: [
          app.name || 'there',
          eventName,
          meetingSpotDate,
          tripDate,
          // Add args.txnid here as the 5th param if you went with the View Receipt button
        ],
        source: 'payu-callback',
        attributes: {
          event_slug: args.eventSlug,
          txn_id: args.txnid,
          amount: String(args.amount),
        },
        paramsFallbackValue: { FirstName: app.name || 'user' },
      }),
    });

    if (aiRes.ok) {
      await supabase
        .from('applications')
        .update({ aisensy_balance_paid_sent: true })
        .eq('id', app.id);
    } else {
      console.error('[aisensy balance_paid] fire failed:', aiRes.status, await aiRes.text());
    }
  } catch (err) {
    console.error('[aisensy balance_paid] fire failed:', err);
  }
}
```

### 4c. Wiring it up

In both edge functions, replace:

```ts
if (paymentType === 'advance') {
  await fireAdvancePaidWhatsApp(supabase, { ... });
}
```

With:

```ts
if (paymentType === 'advance') {
  await fireAdvancePaidWhatsApp(supabase, { ... });
} else if (paymentType === 'balance') {
  await fireBalancePaidWhatsApp(supabase, { ... });
}
```

### 4d. Deploy both edge functions

```
supabase functions deploy payu-callback
supabase functions deploy payu-webhook
```

## 5. Test plan (when integrating)

1. **Sandbox first** — set `AISENSY_API_KEY` to a sandbox key if AiSensy
   supports it, or test with your own phone as the destination.
2. Submit a test application from a phone you control.
3. Approve it in the admin panel → you should receive the `invitation_with_contact` message.
4. Pay the advance → you should receive the `advance_paid+balance` message.
5. Pay the balance → **you should NOW receive the new `balance_paid` message.**
6. Check the application row: `aisensy_balance_paid_sent` should now be `true`.
7. Re-trigger the PayU callback for the same txnid (simulate a retry) →
   ensure the message does NOT fire a second time (idempotent guard works).

## 6. Things to watch out for

- **Two edge functions, same logic.** `payu-callback` (synchronous, called
  immediately after PayU redirect) and `payu-webhook` (asynchronous, PayU's
  S2S notification) both call `fireAdvancePaidWhatsApp`. This is intentional
  redundancy so the message fires even if one path fails. The
  `aisensy_balance_paid_sent` flag prevents double-sends. Make sure both
  files get the same `fireBalancePaidWhatsApp` change.

- **Template approval can take time.** Meta sometimes rejects templates for
  marketing language. If yours gets rejected, soften promotional words
  ("fully settled" is fine, "exclusive" or "limited time" might trigger
  rejection).

- **Template params are positional.** Order matters. AiSensy will substitute
  `templateParams[0]` into `{{1}}`, `templateParams[1]` into `{{2}}`, etc.

- **The `aisensy_advance_sent` column is legacy.** Old code used it for a
  different campaign. The new flag I'm adding is `aisensy_balance_paid_sent`
  — distinct name, no confusion with the legacy column.

## 7. Future enhancements (separate TODOs)

- **Day-before reminder** — fire a WhatsApp 24h before the event with the
  meeting spot details. Could be a new template `event_reminder_24h` triggered
  by a `pg_cron` job.
- **Post-event follow-up** — fire a WhatsApp the day after asking for a
  review. Template `post_event_review`.
- **Reactivation campaign** — fire to past customers when a new plan in their
  city goes live.

---

## Quick reference card for Krutesh

```
🟦 AiSensy balance-paid integration

YOU DO:
  1. Create template in AiSensy dashboard
  2. Wait for Meta approval (24–48h)
  3. Send Claude the campaign name + params order

CLAUDE DOES:
  1. Add DB column aisensy_balance_paid_sent
  2. Add fireBalancePaidWhatsApp() in payu-callback + payu-webhook
  3. Wire it up under "if paymentType === 'balance'"
  4. Deploy both edge functions
  5. Tell you to test with a real payment
```
