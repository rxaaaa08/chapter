# AiSensy-era backup — 2026-08-31

**Purpose:** a true restore point taken immediately before swapping any WhatsApp
sending from AiSensy to Wamafy.

**Why this exists:** Supabase edge functions have **no rollback**. The CLI offers
`list / delete / download / deploy / new / serve` — there is no version-select and
no restore. The `version` number in the API increments but you cannot deploy an
old one. Rolling back means redeploying older *source*, so that source has to be
captured before the change. That is what this folder is.

Git alone is not sufficient: at the time of this backup the five payment-related
functions were **deployed from uncommitted local edits**, so `git HEAD` did not
match production.

---

## What was captured

`supabase/functions/` here is the **live deployed source** of all 16 functions,
pulled with `supabase functions download --use-api`, i.e. unbundled server-side
from what is actually running — not a copy of the working tree.

### Verified at capture time

- **Working tree untouched** by the download — checksums of `supabase/functions/**`
  identical before and after (`LOCAL-WORKTREE-CHECKSUMS-BEFORE.txt`).
- **Deployed == local working tree** for all eight WhatsApp/payment functions
  (`create-payu-order`, `payu-callback`, `payu-webhook`, `verify-pending-payments`,
  `get-user-context`, `open-event-otp`, `cart-abandonment`, `send-aisensy-invite`).
- **No hardcoded secrets** in the downloaded source; every credential is read via
  `Deno.env.get(...)`.

### Function state at capture

| Function | version | `verify_jwt` |
|---|---|---|
| create-payu-order | 44 | **false** |
| payu-callback | 57 | **false** |
| payu-webhook | 52 | **false** |
| cart-abandonment | 29 | **false** |
| send-admin-push | 24 | **false** |
| get-user-context | 14 | **false** |
| verify-pending-payments | 25 | **false** |
| retarget-check | 6 | **false** |
| brevo-webhook | 7 | **false** |
| open-event-otp | 9 | **false** |
| capi-lead | 1 | **false** |
| send-push-notification | 29 | true |
| send-aisensy-invite | 17 | true |
| send-brevo-invite | 17 | true |
| creator-signup | 6 | true |
| marketer-signup | 4 | true |

> **`verify_jwt` is the single most dangerous field here.** Any function a
> customer, PayU or a cron reaches must be deployed with `--no-verify-jwt`.
> There is no `supabase/config.toml`, so the CLI defaults it to **true** when the
> flag is omitted — deploying `payu-callback` without it makes PayU's
> unauthenticated POST return 401 and **payments stop**.

---

## The AiSensy integration being replaced

**Endpoint:** `https://backend.aisensy.com/campaign/t1/api/v2`
**Credential:** `AISENSY_API_KEY` (Supabase secret, set 2026-06-01)
**Sending number:** +91 99401 11564 · WABA "Join Chapter" `1438759947539827`

### Eight templates, and where each fires

| Template | Fired from |
|---|---|
| `otp` | `open-event-otp` |
| `advance_success_dpl` | `payu-callback`, `payu-webhook`, `verify-pending-payments` |
| `single_payment_sucess_dpl` | same three (also the pay-at-venue advance) |
| `fullpaid_dpl` | same three |
| `payment_failure_dpl` | same three |
| `invitation_with_contact` | `send-aisensy-invite` |
| `send_details_dpl` | `send-aisensy-invite` |
| `car_abandon_deeplink2` | `cart-abandonment` |

Thirteen separate inline `fetch()` call sites across those six functions — there
is no shared helper, so each is edited independently.

### Dedup columns (do NOT rename during a migration)

`applications.aisensy_invite_sent`, `aisensy_advance_paid_sent`,
`aisensy_balance_paid_sent`, `aisensy_full_paid_sent`, `aisensy_payment_failed_sent`.
These are one-shot guards. Renaming them risks re-sending payment confirmations to
people who already received them. `retarget-check` also filters on
`aisensy_invite_sent`.

---

## Credentials — names only, values deliberately not copied

Values are **not** in this backup by design. They remain in Supabase and Vercel;
copying them into a file would create a second place for them to leak.

**Supabase secrets present:** `ADMIN_PUSH_SECRET`, `AISENSY_API_KEY`,
`BREVO_API_KEY`, `BREVO_WEBHOOK_TOKEN`, `META_CAPI_ACCESS_TOKEN`, `PAYU_BASE_URL`,
`PAYU_MERCHANT_KEY`, `PAYU_MERCHANT_SALT`, `SUPABASE_*` (auto), `VAPID_*`.

**Referenced in code but NOT set as secrets** (they fall back to code defaults):
`BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`, `BREVO_GALCODE_SENDER_NAME`,
`BREVO_INVITE_BASE_URL`, `CRON_SECRET`, `FRONTEND_URL`, `META_PIXEL_ID`,
`META_CAPI_TEST_CODE`. Worth a separate look — an unset `META_PIXEL_ID` would mean
edge-function CAPI events carry no pixel id.

**Vercel env (project `chapter-a`):**

| Variable | Scope |
|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Production, Preview |
| `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_VERIFY_TOKEN` | Production, Preview (dormant — see `api/webhook.js`) |
| `WAMAFY_*` (5) + `WHATSAPP_LOG_SECRET` | **Preview only, branch `wamafy-test`** |

Nothing Wamafy-related exists in Production. That is deliberate.

---

## How to roll back

Restoring one function to its AiSensy behaviour:

```bash
cd backup/aisensy-live-2026-08-31
npx supabase functions deploy <name> --project-ref txcmismkdttgsyhbnexf --no-verify-jwt
```

Use `--no-verify-jwt` for every function marked **false** in the table above, and
**omit it** for the four marked true. Getting this backwards on `payu-callback`
stops payments.

Then confirm with `list_edge_functions`: `updated_at` must have moved **and**
`verify_jwt` must still match the table.

`AISENSY_API_KEY` is untouched by any of this, so a restored function starts
working again immediately — no credential to re-create.

### What a bad deploy actually costs

Less than it feels. If `payu-callback` breaks, **PayU still captures the money** —
you lose the confirmation message, and `payu-webhook` plus the
`verify-pending-payments` cron reconcile the booking afterwards. The triple-fire
design protects the money; only messaging is exposed, for the minutes a redeploy
takes.
