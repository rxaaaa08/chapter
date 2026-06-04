# Audit — Payment Status Updates & AiSensy Triggers

**Date:** 5 Jun 2026
**Scope:** PayU status flow (callback + webhook) and all 5 AiSensy WhatsApp triggers.
**Outcome:** Money paths are sound. ALL 4 issues (2 CRITICAL + 2 MEDIUM) FIXED +
deployed on 5 Jun. payu-callback v22, payu-webhook v17, cart-abandonment v11 —
all verify_jwt:false. Only remaining item: 🟡 rotate the AiSensy key (deferred,
optional hygiene) + set CRON_SECRET env var if force-mode testing is wanted.

---

## ✅ Verified correct (no action needed)

### PayU → DB status mapping (both payu-callback AND payu-webhook)
| PayU outcome | payu_payments.status | applications.status |
|---|---|---|
| Order created (create-payu-order) | `pending` | unchanged |
| Success + advance | `success` | → `advance_paid` |
| Success + balance | `success` | → `fully_paid` |
| Failure | `failure` | unchanged (correct) |
| Hash mismatch | not updated, logged `_rejected: hash_mismatch` | unchanged |
| Amount mismatch | not updated, logged `_rejected: amount_mismatch` | unchanged |

### Money integrity
- `payu_payments.amount` stores the GROSS (base + PayU method fee). Both verifiers
  compare PayU's reported gross vs stored gross with a 1-paisa tolerance. No false
  rejects.
- Balance payment requires `applications.status === 'advance_paid'` first.
- Invite-only advance requires phone in `invited_numbers` OR an approved application.
- Reverse hash uses the correct format (5 empty fields between status and udf5).
- Success redirect to `/invite/:slug?payment_status=success` renders the receipt
  correctly (frontend reads `payment_status` query param, not the path).

### AiSensy triggers (all 5 wired, each with an idempotency flag)
| Status | Campaign | Fires from | Guard column |
|---|---|---|---|
| invited | `invitation_with_contact` | AdminPanel → send-aisensy-invite | aisensy_invite_sent |
| advance paid | `advance_paid+balance` | payu-callback + payu-webhook | aisensy_advance_paid_sent |
| balance paid | `fullpaid` | payu-callback + payu-webhook | aisensy_balance_paid_sent |
| payment failed | `payment_failed` | payu-callback only ⚠️ | aisensy_payment_failed_sent |
| bill abandonment | `cart_abandonment` | pg_cron (every 30 min) → cart-abandonment | cart_abandonment_sent |

---

## ✅ CRITICAL #1 — cart-abandonment hardcoded key — FIXED 5 Jun (cart-abandonment v11)

The deployed `cart-abandonment` function (version 10) contains:
```js
const AISENSY_API_KEY = 'eyJhbGc...';        // the OLD leaked token, in code
const CRON_SECRET     = 'chaptera_cron_2025'; // also hardcoded
```
Every other function uses `Deno.env.get('AISENSY_API_KEY')`. This one was never
migrated.

**Why it matters:**
1. Secret committed in deployed source.
2. The day the leaked AiSensy key is rotated, cart-abandonment silently stops
   working while every other function keeps going.

**Fix (when ready):**
- Replace `const AISENSY_API_KEY = '...'` with `Deno.env.get('AISENSY_API_KEY')`
  (add the `if (!AISENSY_API_KEY) return` guard like the other functions).
- Move `CRON_SECRET` to `Deno.env.get('CRON_SECRET')` and set that secret in
  Supabase. (Or drop the force-mode test path entirely if unused.)
- Keep `verify_jwt: false` (pg_cron calls it without a JWT).
- ⚠️ When redeploying via the MCP deploy tool, EXPLICITLY pass `verify_jwt: false`
  — the tool defaults verify_jwt to TRUE, which on 5 Jun briefly broke
  payu-callback/webhook until corrected. Always re-check `list_edge_functions`
  after any deploy.

## ✅ CRITICAL #2 — cart-abandonment not in git repo — FIXED 5 Jun

It exists only as a deployed function; there is no `supabase/functions/cart-abandonment/`
locally. Consequences: unversioned, no code review, and the pre-commit secret
scanner never saw the hardcoded key.

**Fix (when ready):** Save the (env-var-migrated) source to
`supabase/functions/cart-abandonment/index.ts` and commit it.

## ✅ MEDIUM #1 — Double-send race — FIXED 5 Jun (payu-callback v22 / payu-webhook v17)

Both payu-callback and payu-webhook fire the same AiSensy message, guarded by a
check-then-set flag with no lock:
```ts
if (!app || app.aisensy_advance_paid_sent) return;  // read
...send AiSensy...
await supabase.from('applications').update({ aisensy_advance_paid_sent: true })... // set
```
If PayU's browser redirect (callback) and its S2S webhook land within the same
read window, both pass the guard → customer gets TWO identical WhatsApps, 2× quota.

**Fix (when ready):** Atomic claim BEFORE sending:
```ts
const { data: claimed } = await supabase
  .from('applications')
  .update({ aisensy_advance_paid_sent: true })
  .eq('id', app.id)
  .eq('aisensy_advance_paid_sent', false)   // only succeeds for the first caller
  .select('id')
  .maybeSingle();
if (!claimed) return;   // someone else already claimed it
...send AiSensy...
// on failure, optionally roll the flag back so a retry can re-send
```
Apply to all 4 paid/failed flags in both callback and webhook.

**Note:** This race only manifests if the PayU dashboard actually has the webhook
(S2S) URL configured AND surl/furl pointing at the callback. If only the callback
is wired in PayU, there's no race today — but also no webhook redundancy. Worth
confirming the PayU dashboard config either way.

## ✅ MEDIUM #2 — payment_failed from webhook — FIXED 5 Jun (payu-webhook v17)

Only payu-callback sends `payment_failed`. The webhook marks
`payu_payments.status = 'failure'` but has no branch that fires the WhatsApp.
If a customer's payment fails and they close the tab on PayU's page (never
redirected back to the callback), no "payment failed" WhatsApp goes out.

**Fix (when ready):** Add an `else` (failure) branch in payu-webhook that calls
`firePaymentFailedWhatsApp` (port the function over from payu-callback). The
shared `aisensy_payment_failed_sent` flag prevents a double-up with the callback.

---

## 🟡 TODO — Rotate the AiSensy API key (hygiene, lower urgency)

The AiSensy key was committed in cart-abandonment's source and (historically)
shipped to browsers in AdminPanel before we moved it server-side. It still works,
so this is hygiene, not an active fire.

**What an attacker with this key could do:** send WhatsApp messages through YOUR
AiSensy account using your approved templates — i.e. impersonate chapter அ to
arbitrary numbers, and burn your AiSensy quota. They cannot read your customer
data or change payments. Bounded but reputational.

**Rotation steps (do the CRITICAL #1 env-var fix FIRST, or rotation breaks
cart-abandonment):**
1. AiSensy dashboard → API Keys → generate a new key, revoke the old one.
2. Supabase → Project Settings → Edge Functions → Secrets → update
   `AISENSY_API_KEY` to the new value.
3. No redeploy needed for functions that already read the env var
   (send-aisensy-invite, payu-callback, payu-webhook) — they pick up the new
   secret on next invocation.
4. cart-abandonment will also work IF it has been migrated to the env var first.
5. Test: approve a test application → confirm the invite WhatsApp still arrives.

---

## Priority order when you come back to this

1. ~~CRITICAL #1 + #2 (env-var + commit cart-abandonment)~~ — ✅ DONE 5 Jun.
2. 🟡 Rotate the AiSensy key — OPTIONAL hygiene, now unblocked (all functions
   read AISENSY_API_KEY from env). Steps below.
3. ~~MEDIUM #1 (atomic claim)~~ — ✅ DONE 5 Jun.
4. ~~MEDIUM #2 (webhook payment_failed)~~ — ✅ DONE 5 Jun.

🟢 Nothing critical remains. The only open item is optional key rotation.

### Manual task: CRON_SECRET (only if you want force-mode testing)
cart-abandonment's `?force=true&phone=...` test path now reads CRON_SECRET from
env and is DISABLED (401) until you set it. The scheduled pg_cron run does not
use it and works regardless. To re-enable manual testing: Supabase → Project
Settings → Edge Functions → Secrets → add `CRON_SECRET` = any value, then call
`?force=true&phone=XXXXXXXXXX&secret=<that value>`.

---

## Changelog
- **5 Jun 2026** — MEDIUM #1 + #2 fixed and deployed. Added claimSendFlag/
  releaseSendFlag (atomic false→true claim with rollback-on-send-failure) to
  all 4 paid/failed AiSensy sends in both payu-callback and payu-webhook;
  added firePaymentFailedWhatsApp + failure else-branch to payu-webhook.
  Deployed payu-callback v22 + payu-webhook v17, both verify_jwt:false,
  both smoke-tested (boot OK), no payments stranded during the window.
- **5 Jun 2026** — CRITICAL #1 + #2 fixed and deployed. cart-abandonment now
  reads AISENSY_API_KEY + CRON_SECRET from env (was hardcoded/leaked); source
  committed to supabase/functions/cart-abandonment/index.ts (was deploy-only).
  Deployed cart-abandonment v11, verify_jwt:false. Smoke-tested: cron path
  returns 200 {sent,total} (env key resolves), force-without-secret returns
  401 (fail-closed).
