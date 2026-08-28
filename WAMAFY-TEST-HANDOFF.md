# Wamafy trial — test harness

Branch `wamafy-test`. Nothing here runs on the live site.

## What this is

A self-contained way to prove Wamafy can send a template, deliver a status
callback, and let us log delivery + read receipts — **without editing a single
line of the live AiSensy path.**

### Why it lives in Vercel and not Supabase

The live site sends WhatsApp from **six Supabase edge functions**. There is one
deployment of those functions, shared by every site pointing at the project, so
"point staging at Wamafy" is impossible by deploying a different frontend — the
frontend never calls AiSensy at all.

Vercel API routes deploy **with the branch**. A preview branch gets its own URL,
its own code, and its own Preview-scoped env vars. That is real isolation, for
free. Hence the whole trial sits in `api/`.

> **This is a test harness, not the final architecture.** Once Wamafy is proven,
> sending must move into the edge functions, because that is where the real
> triggers fire (`payu-callback` sends the payment confirmation; a Vercel route
> cannot). See `bsp-migration-plan.md` §3–4 for the ordering that migration needs.

## What was added

| File | Purpose |
|---|---|
| `api/_wamafy.js` | Shared helpers. Underscore = not routed by Vercel |
| `api/wamafy-send.js` | `POST` — send a template, log the result |
| `api/wamafy-webhook.js` | `POST` — receive delivered/read/failed, log it |
| `api/wamafy-templates.js` | `GET` — list templates + button indexes |
| `supabase/migrations/20260828_whatsapp_send_log.sql` | `whatsapp_sends` + `whatsapp_send_events` + two secret-guarded RPCs |

The migration is **already applied to production** (2026-08-28). It is purely
additive — two new tables, two new functions, one new secret row. Nothing
existing reads them, so it cannot affect a live booking.

## Environment variables — set these in Vercel, scoped to **Preview only**

Production must not have them, so production cannot call Wamafy even by accident.

| Variable | Value |
|---|---|
| `WAMAFY_API_KEY` | `wamafy_live_…` from Settings → API Access → Create key |
| `WAMAFY_STATUS_WEBHOOK_SECRET` | Signing secret shown by the **Status webhook** panel (delivery receipts) |
| `WAMAFY_WEBHOOK_SECRET` | Signing secret shown when you add a webhook in the **Webhooks** panel (inbound) |
| `WAMAFY_TEST_SECRET` | Any long random string you invent — guards the trigger routes |
| `WAMAFY_TEST_ALLOWED_NUMBERS` | The 2nd number, comma-separated for more |
| `WHATSAPP_LOG_SECRET` | `whatsapp_log_secret` — ask Krutesh, it is in `app_secrets` |
| `WAMAFY_BASE_URL` | *(optional)* defaults to `https://api.wamafy.com/api/v1/public` |

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` already exist on the project.

### Required API key scopes

`templates:read`, `messages:send`. Nothing else — least privilege. Do **not**
tick Full access.

## Three safety guards on the send route

A Vercel preview URL is guessable and this endpoint spends money, so:

1. **`x-test-secret` header** must match `WAMAFY_TEST_SECRET`, or 401.
2. **Fail-closed allowlist** — if `WAMAFY_TEST_ALLOWED_NUMBERS` is unset, the
   route refuses to send to *anyone*. It cannot reach a real customer.
3. **Preview-scoped key** — production has no `WAMAFY_API_KEY` at all.

The webhook fails closed too: no signing secret at all means 503, and a bad
`X-Wamafy-Signature` means 401.

**The two panels issue two different signing secrets.** Their docs say status
callbacks are "signed the same way", which means the same *scheme*, not the same
key — a real trap, since both panels point at this one route. The handler accepts
either secret, so delivery receipts and inbound messages both verify.

## Running the test

1. Push the branch, let Vercel build, note the preview URL.
2. Set the env vars above (Preview scope), then **redeploy** — Vercel bakes env
   vars at build time.
3. Point Wamafy's **Status webhook** at
   `https://<preview-url>/api/wamafy-webhook` and hit their *Send test*.
4. List templates to find the button indexes:

```bash
curl -H "x-test-secret: $WAMAFY_TEST_SECRET" https://<preview-url>/api/wamafy-templates
```

5. Send one:

```bash
curl -X POST https://<preview-url>/api/wamafy-send -H "x-test-secret: $WAMAFY_TEST_SECRET" -H "Content-Type: application/json" -d '{"to":"+91XXXXXXXXXX","templateName":"otp","variables":{"1":"123456"}}'
```

6. Read the result back (founder login required — the tables are admin-strict):

```sql
select message_id, to_phone, template_name, sent_at, delivered_at, read_at, failed_at, error_message
from whatsapp_sends order by created_at desc limit 20;
```

Open the message on the phone and confirm `read_at` fills in.

## What the trial is actually testing

1. Does the send API work with **our** templates, including the URL buttons?
2. Does the status callback arrive, and is the signature verifiable?
3. **Does `messageId` from the send response match the `messageId` on the
   callback?** This is the one that matters — without a stable join key,
   delivery logging is a pile of anonymous events that cannot be attached to a
   booking. Our current AiSensy code captures no message id at all.

## Notes for whoever wires this up

- **URL button values are the placeholder tail only**, not a full URL — Wamafy
  appends to the approved prefix. This matches AiSensy exactly, where we already
  pass `?phone=…&name=…`, so the eight existing call sites port across unchanged.
- **`buttons[].index` is the position in the TEMPLATE**, not in the array you
  send. Get it from `/api/wamafy-templates`.
- **Only dynamic buttons take a value.** A fixed URL button or quick reply is
  rejected if you supply one.
- **Template button base URLs point at `chaptera.in`** and are baked in at Meta
  approval time. A test send will deep-link to *production*. For real
  click-through testing, Wamafy must approve separate staging templates.
- Wamafy rate limit is **60 requests/minute per key**.
- Their **Request log** (Settings → API Access) is the first place to debug.

## Verified before handover

The two RPCs were round-trip tested against production on 2026-08-28 and the
test rows deleted afterwards. Confirmed working:

- `read` arriving **before** `delivered` — both stored correctly
- a **repeated** `delivered` — did not overwrite the first timestamp
- a status arriving **before** the send was logged — stub row created, then
  filled in by the send without a unique-index collision
