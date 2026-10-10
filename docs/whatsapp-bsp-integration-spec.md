# chapter அ — WhatsApp integration spec (for a replacement BSP)

**Purpose:** everything a new BSP team needs to replicate our WhatsApp sending on a
second number, without reading our source. Written 2026-08-28.

**Current setup:** AiSensy, single endpoint
`POST https://backend.aisensy.com/campaign/t1/api/v2`, `Content-Type: application/json`,
API key in the JSON body as `apiKey` (not a header). Sent from 6 Supabase Edge Functions
(Deno). **8 templates, 13 call sites.**

**Volume:** ~150–280 messages/month. This is a low-volume, high-stakes integration —
every message is transactional and tied to a booking or a payment.

---

## 1. The request we send today

```jsonc
POST https://backend.aisensy.com/campaign/t1/api/v2
Content-Type: application/json

{
  "apiKey":       "<secret>",
  "campaignName": "advance_success_dpl",   // = the approved template name
  "destination":  "919940111564",           // "91" + last 10 digits, no +, no spaces
  "userName":     "Krutesh",                // display name, NOT an identifier
  "source":       "payu-callback",          // free-text tag for our own tracing
  "templateParams": ["₹1,024.00", "June 10th", "CHA17793..."],  // POSITIONAL {{1}},{{2}},{{3}}
  "media":        {},
  "buttons":      [ /* see §3 */ ],
  "carouselCards": [],
  "location":     {},
  "attributes":   { "event_slug": "...", "txn_id": "...", "amount": "1024" },
  "paramsFallbackValue": { "FirstName": "Krutesh" },
  "tags":         ["chapter-invite"]        // only on the invite call
}
```

**Good news for whoever is porting this:** `templateParams` and `buttons` are already in
**Meta Cloud API shape**. AiSensy is a thin pass-through. If your platform exposes the Cloud
API (or anything close to `components: [{type:'body',parameters:[…]}]`), this is a mapping
exercise, not a redesign.

**Response handling today:** we only check the HTTP status, plus a loose body check
(`success !== false && status !== 'error' && !error`). **We never capture a message id** —
see §6, this is the main thing we want to change.

---

## 2. Phone number format

`'91' + <last 10 digits>`. We store phones as **last-10-digits only** in the database, and
prepend the country code at send time. No `+`, no spaces, no dashes. All customers are India.

---

## 3. Dynamic URL buttons — the part that is easy to get wrong

Several templates carry **URL buttons with a dynamic suffix**. The approved template holds a
fixed base URL ending in a variable, e.g. `https://chaptera.in/invite{{1}}`, and we supply
only the **query-string tail**:

```jsonc
"buttons": [
  { "type": "button", "sub_type": "URL", "index": 0, "parameters": [{ "type": "text", "text": "?phone=9940111564&name=Krutesh" }] },
  { "type": "button", "sub_type": "URL", "index": 1, "parameters": [{ "type": "text", "text": "?phone=9940111564&name=Krutesh" }] }
]
```

The tail is built with `URLSearchParams`, so it is URL-encoded. Both buttons on a
two-button template get the **same** value. Templates that take this are marked "2 URL btn"
in §4.

**Note the `otp` template is different** — its button parameter is the OTP code itself
(a WhatsApp *authentication* template with a copy-code button), and our code happens to send
`sub_type: "url"` lowercase with `index: "0"` as a **string** rather than a number. If your
platform is stricter than AiSensy about these, normalise them — but the OTP button value
must remain the code, not a URL tail.

**Constraint that is Meta's, not AiSensy's:** template buttons **cannot link to
`chat.whatsapp.com`**. Our workaround is that the template links to our site and the site
relays the real group link. Keep this — it is not negotiable by any BSP.

---

## 4. The 8 templates

Amount format is always `₹1,024.00` (Indian grouping, 2 decimals, from `toLocaleString('en-IN')`).
Note two different date formats: **long** month (`June 10th`) vs **short** month (`Jun 10th`).

| # | Template | Params `{{1}}, {{2}}, {{3}}` | Buttons | Fired by |
|---|---|---|---|---|
| 1 | `invitation_with_contact` | event name, event date | *(none sent)* | admin clicks Approve |
| 2 | `send_details_dpl` | user name, event name | 2 URL btn | admin sends/resends details |
| 3 | `otp` | the 6-digit code | 1 btn = the code | open-event booking |
| 4 | `advance_success_dpl` | amount, balance-due date (**long**: `June 10th`), txn id | 2 URL btn | advance payment succeeds |
| 5 | `single_payment_sucess_dpl` | amount, details date (**short**: `Jun 10th`) | 2 URL btn | full/single payment succeeds |
| 5b| `single_payment_sucess_dpl` | amount, literal `one week before the event` | 2 URL btn | pay-at-venue advance *(reuses the same template — see note)* |
| 6 | `fullpaid_dpl` | amount, details date (**short**) | 2 URL btn | balance payment succeeds |
| 7 | `payment_failure_dpl` | user name, amount attempted | 2 URL btn | payment fails |
| 8 | `car_abandon_deeplink2` | user name, event name, event date | 1 URL btn | 30-min abandoned-cart cron |

**Note on 5b:** pay-at-venue events have no balance deadline, so `advance_success_dpl`'s
`{{2}}` would render empty on a template whose fixed copy points at that date. We
deliberately reuse `single_payment_sucess_dpl` and pass a phrase instead of a date. If you
re-author templates, this is a good thing to fix properly with a dedicated template.

**Note on 1:** `invitation_with_contact` is the only template we send with **no**
`buttons`/`media`/`paramsFallbackValue` block at all — its buttons are static in the template.

### Where each one fires from

| Function | Trigger | Templates |
|---|---|---|
| `send-aisensy-invite` | admin action, synchronous, admin sees errors | 1, 2 |
| `open-event-otp` | customer requests a booking code | 3 |
| `payu-callback` | PayU redirects the browser back | 4, 5, 6, 7 |
| `payu-webhook` | PayU server-to-server (backup) | 4, 5, 6, 7 |
| `verify-pending-payments` | reconciliation cron | 4, 5, 6, 7 |
| `cart-abandonment` | 30-min cron | 8 |

Templates 4–7 fire from **three** places by design — a browser callback, a server webhook,
and a reconciling cron — so that a customer who closes the tab still gets their confirmation.
This makes §5 mandatory.

---

## 5. Idempotency — please preserve this exactly

Because three independent paths can try to send the same confirmation, **every payment
message is guarded by a one-shot claim flag** on the booking row:

`aisensy_invite_sent` · `aisensy_advance_paid_sent` · `aisensy_balance_paid_sent` ·
`aisensy_full_paid_sent` · `aisensy_payment_failed_sent`

The sequence is **claim → send → release on failure**:

1. Atomically claim the flag (`false → true`). If the claim fails, another path already has
   it — **return silently, send nothing.**
2. Send the message.
3. If the send returns non-2xx, **release the flag** so a later retry can pick it up.

This gives at-least-once delivery with no duplicates. Two rules:

- **Do not rename these columns during the migration.** The name says "aisensy" but they are
  provider-neutral guards. Renaming them mid-flight risks re-sending payment confirmations to
  people who already got them. Rename later, or never.
- **A non-2xx must be distinguishable from a success.** If your API returns 200 with an error
  in the body, tell us the exact shape so we can treat it as a failure and release the claim.

---

## 6. What we need FROM the new BSP

This is the reason we are moving, so please treat it as a requirement, not a nice-to-have.

1. **Delivery + read receipts via webhook** — `sent` / `delivered` / `read` / `failed`, at no
   extra tier cost. This is standard Meta Cloud API functionality.
2. **A message id returned in the send response** (`wamid` or your own), so we can join a
   status callback back to a specific booking. Today we capture nothing, which means delivery
   data would be orphaned. **This single field is what makes the whole feature usable.**
3. **Failure reasons in the webhook**, not just a failed flag — we need to distinguish
   "number not on WhatsApp" from "template paused" from "out of credits".
4. **A staging/sandbox path** on the second number that does not touch the live number.
5. Webhook endpoint requirements: we receive on Supabase Edge Functions. Tell us the source
   IPs and the signing/verification scheme you use.

> **For our side, not theirs:** the webhook receiver is an *unauthenticated* POST, so it
> **must be deployed with `--no-verify-jwt`** or it returns 401 and the BSP silently stops
> retrying — the same failure mode that would take payments down on `payu-callback`.

---

## 7. Constraints the new BSP must not break

1. **`otp` gates every open-event sale.** Our payment function refuses to create an order
   without a verified OTP session. If OTP sending breaks, **we sell zero tickets** — it is
   not a degraded experience, it is a full stop. Treat this template as production-critical.
2. **OTP rate limits are per-channel:** WhatsApp 2 per 10 min keyed by phone; email fallback
   2 per 10 min keyed by email. Preserve or improve; do not loosen.
3. **The live number `+91 99401 11564` has a `High` quality rating.** It is the business's
   only WhatsApp number and the rating is slow to earn and fast to lose. Nothing in testing
   should touch it — that is what the second number is for.
4. **No template button may link to `chat.whatsapp.com`** (§3).
5. Payment confirmations are **time-sensitive** — a guest who has just paid is watching their
   phone. Queuing delays of minutes are a support problem.

---

## 8. Two things to settle before signing

### 8.1 Ask to keep owning the WABA

We currently own our WhatsApp Business Account outright (`Join Chapter`,
ID `1438759947539827`) — **AiSensy is only an assigned partner, and their credit line is
attached to an account we own.** That arrangement is exactly what is being proposed for the
new number (they pay Meta, we buy credits), and it demonstrably works **without** the BSP
owning the WABA.

**So ask for the same on number 2: chapter அ owns the WABA, your credit line attaches to it.**
If instead the new WABA is created under the BSP's ownership, then leaving them later means
migrating the number out and getting **all 8 templates re-approved** by Meta, with downtime
on the number — the expensive scenario we are currently free of. Ownership costs nothing to
ask for at signup and is painful to reclaim afterwards.

### 8.2 The staging environment has a real trap

A Vercel staging front-end **still talks to production Supabase** unless a separate database
is stood up. Ours is a **live database with real customers and real payments**. Testing
against it would create real booking rows, fire real admin notifications, and touch real
PayU orders.

Before any testing starts, settle:

- A **separate Supabase project or branch** for staging — not the production one.
- **PayU test credentials** for staging, so no real money moves.
- Test bookings use phones `90000000xx` by convention, and get deleted afterwards.
- Staging edge functions must point at the **second** WhatsApp number, never the live one.

---

## 9. Repo access

Safe to share: `.env*` is gitignored and no live secret is committed (the only key in the
tree is the Supabase **anon** key, which is public by design). All real secrets live in
Supabase Edge Function secrets, not in the repo.

The 6 functions to read are under `supabase/functions/`:
`send-aisensy-invite`, `open-event-otp`, `payu-callback`, `payu-webhook`,
`verify-pending-payments`, `cart-abandonment`.

**Please do not hand over the `AISENSY_API_KEY` or any production Supabase service-role key.**
The new integration needs its own credentials on the staging project only.
