# WhatsApp BSP migration — AiSensy → Wamafy

**Single source of truth for this work.** Supersedes `bsp-migration-plan.md`
(planning) and `WAMAFY-TEST-HANDOFF.md` (trial log); both are kept for history.

Last updated **2026-09-01**.

---

## 1. Status at a glance

| Message | Fires from | Provider now |
|---|---|---|
| `otp` | `open-event-otp` | ✅ **Wamafy** (AiSensy fallback) |
| `cart_abandon` | `cart-abandonment` | ✅ **Wamafy** (AiSensy fallback) |
| advance / balance / full paid | `payu-callback`, `payu-webhook`, `verify-pending-payments` | ⏳ AiSensy |
| `payment_failed` | same three | ⏳ AiSensy |
| invite + details | `send-aisensy-invite` | ⏳ AiSensy |

**Customers are currently in a split-number state** — codes from the new number
`+91 82208 88650`, everything else from the old `+91 99401 11564`. Acceptable only
because no events are being actively sold. **Close this before reopening sales:**
a guest receiving their code from one number and their receipt from another, at
the moment they hand over money, is the one genuinely bad outcome here.

---

## 2. Why we are doing this

Not cost. At **~150–280 messages/month** almost the entire AiSensy bill is plan
fee, not usage, so the saving is only the plan-fee difference.

The real driver: **delivery and read logging.** AiSensy gates webhooks behind a
₹3,000/mo plan versus our ₹1,500/mo — **+₹18,000/year for data Meta provides
free.** We had *no record of a single WhatsApp message ever sent*: only
`console.log` and five `aisensy_*_sent` booleans, so delivery was unmeasurable.

That gap is not theoretical. On 2026-08-28 a message was **accepted by the
provider with a 200 and a real message id, and then failed at WhatsApp** —
visible only as a red icon in their dashboard. Our live AiSensy code checks only
`aiRes.ok`, so that failure is invisible on the live site *today*.

---

## 3. Account facts

- **WABA "Join Chapter" `1438759947539827` is owned by Chapter அ**, not AiSensy —
  so a switch is a change-of-partner. Number, quality rating, verified status and
  approved templates all survive. Verified in Business Manager 2026-08-26.
- Old number **+91 99401 11564**, quality rating **High** (the least-recoverable
  asset here — earned slowly, and no BSP can restore it).
- New number **+91 82208 88650**, hosted by Wamafy.
- Credit line is AiSensy's on the old WABA; Wamafy bills us for credits on theirs.

---

## 4. Architecture — the thing most people get wrong

**The website never talks to the BSP.** It calls Supabase edge functions, and
those call WhatsApp:

```
browser → Supabase edge function → Wamafy/AiSensy
```

There is **one shared deployment** of each edge function, used by both the live
site and any preview. So "point staging at the new BSP" is impossible by
deploying a different frontend — and a staging *site* cannot test payment
messages at all, because **PayU calls Supabase directly** (`create-payu-order`
hardcodes the callback URL) and cart abandonment is fired by a cron.

That is why the migration happens in the edge functions, one at a time, in
blast-radius order — not in a staging replica.

### Deliberate production/preview asymmetry — keep this

| | Production (`main`) | Preview (`wamafy-test`) |
|---|---|---|
| `api/wamafy-webhook.js` + `_wamafy.js` | ✅ receives callbacks | ✅ |
| `api/wamafy-send.js`, `wamafy-templates.js` | ❌ **never** | ✅ manual testing |
| `WAMAFY_API_KEY` (Vercel) | ❌ **never** | ✅ |

**Production is structurally incapable of sending a WhatsApp message.** It holds
no sending key and has no send route, so a bug in a public endpoint cannot spend
quota or message customers. Real sending happens only in Supabase edge functions,
which hold their own `WAMAFY_API_KEY` secret.

---

## 5. Rollback

**Supabase edge functions have NO rollback.** The CLI offers
`list / delete / download / deploy / new / serve` — no version select, no restore.
The `version` number increments but cannot be deployed. Restoring means
redeploying older *source*, so that source had to be captured first.

**Restore point: `backup/aisensy-live-2026-08-31/`** — all 16 functions pulled
from the SERVER with `functions download --use-api`, not copied from disk. That
distinction mattered: five payment functions were running from *uncommitted local
edits*, so `git HEAD` did not match production.

**Re-verified 2026-09-01:** the backup is byte-identical to what is live for
`payu-callback`, `payu-webhook`, `verify-pending-payments`, `send-aisensy-invite`
**and `_shared/`**. Committed as `afee828`, pushed to GitHub — three copies.

```bash
cd backup/aisensy-live-2026-08-31
npx supabase functions deploy <name> --project-ref txcmismkdttgsyhbnexf --no-verify-jwt
```

> ⚠️ **`--no-verify-jwt` is the field that breaks payments.** There is no
> `supabase/config.toml`, so the CLI defaults `verify_jwt` to **true** when the
> flag is omitted. `payu-callback` deployed without it returns 401 to PayU's
> unauthenticated POST and **payments stop**. Use the flag for every function
> currently `false`; omit it for `send-push-notification`, `send-aisensy-invite`,
> `send-brevo-invite`, `creator-signup`, `marketer-signup`. After any deploy,
> confirm `updated_at` moved **and** `verify_jwt` still reads what it should.

**What a bad deploy actually costs:** less than it feels. If `payu-callback`
breaks, PayU still captures the money — you lose the confirmation message, and
`payu-webhook` plus the reconcile cron settle the booking afterwards. The
triple-fire design protects the money; only messaging is exposed.

---

## 6. What was built

### Database (live on prod)

- **`whatsapp_sends`** — one row per outbound message. Status stored as separate
  write-once timestamps (`sent_at` / `delivered_at` / `read_at` / `failed_at`)
  rather than a single status column, because Wamafy warns order is not
  guaranteed and statuses repeat. That makes the handler idempotent by
  construction. Plus `error_code` / `error_message`.
- **`whatsapp_send_events`** — append-only raw callback log, including payloads
  that match no send row. During a trial the unanticipated shapes are the
  valuable ones.
- **`whatsapp_inbound`** — customer replies: text, name, button tapped, media,
  Wamafy's conversation/lead ids. `from_phone` is normalised to the last 10
  digits, **matching `applications.phone`**, so a reply joins straight to a
  booking.
- RPCs `log_whatsapp_send`, `log_whatsapp_status`, `log_whatsapp_inbound` —
  all `SECURITY DEFINER`, guarded by `app_secrets.whatsapp_log_secret`. This is
  the existing `log_feature_release` pattern, chosen so **no service-role key
  goes into Vercel**: a leaked log secret writes junk into a log table; a leaked
  service-role key hands over the database.
- All three tables are `is_admin_strict()` SELECT only, with no write policy —
  every write goes through the RPCs.

Migrations: `20260828_whatsapp_send_log.sql`, `20260901_whatsapp_inbound.sql`.

### Useful queries

```sql
-- delivery health by template
select template_name, count(*) sends, count(delivered_at) delivered,
       count(read_at) read, count(failed_at) failed
from whatsapp_sends group by template_name order by template_name;

-- what customers actually replied, joined to their booking
select i.sent_at, i.from_name, i.body_text, a.event_slug, a.status
from whatsapp_inbound i join applications a on a.phone = i.from_phone
order by i.sent_at desc;
```

### Vercel

`https://chaptera.in/api/wamafy-webhook` receives **both** the status webhook and
the inbound webhook — the handler reads the `event` field and routes each.

---

## 7. Wamafy API notes

Base `https://api.wamafy.com/api/v1/public`, `Authorization: Bearer`,
**60 requests/minute per key**. Key scopes needed: `templates:read`,
`messages:send` only — not Full access.

`POST /messages` → `{ to, templateName, variables: {"1": …}, buttons }` and
**returns `messageId`**. That is the join key AiSensy never gave us: our code
captures no message id at all, so statuses could not be attached to a booking.

**URL button `value` is the placeholder tail only** (`?phone=…&name=…`) — WhatsApp
appends it to the prefix baked into the approved template. Same contract AiSensy
uses, so existing call sites port across unchanged. `buttons[].index` is the
button's position **in the template**, not in your array. Only *dynamic* buttons
take a value; supplying one for a fixed button is rejected.

### Two webhooks, two secrets

Their docs say status callbacks are "signed the same way" — that means the same
*algorithm*, **not the same key**. The Status webhook and the Webhooks panel each
issue their own signing secret, shown once. Keying off one silently 401s the
other. Our handler accepts either.

- **Status webhook** — flat payload, `messageId` at top level, no
  `X-Wamafy-Event` header. Does **not** auto-disable on failure.
- **Event webhooks** (`message.inbound`) — fields nested under `data`, carries
  `X-Wamafy-Event`. **Auto-disables after 15 consecutive failures.**

Neither retries. **Never return 5xx** — a thrown error loses the event forever.

### Timestamps mean different things

`data.sentAt` is when the **customer** sent the message. Envelope `occurredAt` is
when **Wamafy dispatched the callback** — measured 3.5s apart in live testing.
Storing `occurredAt` as the customer's time records our own dispatch time as
theirs. For statuses, `occurredAt` is likewise callback time, not the delivery
instant, so `delivered_at` is an **upper bound** (observed 2.6s to 4m48s).

---

## 8. Template mapping

| AiSensy | Wamafy | Params | Buttons |
|---|---|---|---|
| `otp` | `otp` ✅ | code | 1 × copy_code (the code) |
| `car_abandon_deeplink2` | `cart_abandon` ✅ | name, event, date | 1 × URL |
| `single_payment_sucess_dpl` | `single_payment_sucess_dpl` | amount, details-date | 2 × URL |
| `fullpaid_dpl` | `balance_paid_dpl` | amount, details-date | 2 × URL |
| `payment_failure_dpl` | `payment_failed` | name, amount | 2 × URL |
| `advance_success_dpl` | `advancepaid` ⚠️ | amount **only** | 2 × URL |
| `send_details_dpl` | `resend_details` | name, event | 2 × URL |
| `invitation_with_contact` | `invitation_with_contact` ⚠️ | event, date | **static** |

### Known template problems

1. **`balance_paid_dpl` is MARKETING, should be UTILITY.** Identical body to
   `single_payment_sucess_dpl`, which is correctly UTILITY. Marketing costs
   several times more per send *and* is the category Meta restricts — a payment
   receipt subject to marketing limits or a marketing opt-out is the wrong
   trade. Category cannot be changed after approval; recreate it. No code change
   needed if the name is kept.
2. **`advancepaid` is missing two parameters.** AiSensy's `advance_success_dpl`
   sends amount, **balance due date** and **transaction id**. Harmless for
   pay-at-venue (which uses `single_payment_sucess_dpl`), but a regular split
   event would lose the due date and reference. Fix before running one.
3. **`invitation_with_contact` has static buttons.** It sends fine with no
   buttons array, and Wamafy rejects unexpected button params, so its URLs are
   fixed. The AiSensy version passes `?phone=…&name=…` so the link identifies the
   guest. As-is, invited guests land on a generic page.

---

## 9. Hard-won gotchas

- **Cold start works for AUTHENTICATION and UTILITY templates.** Our one cold
  failure was `invitation_with_contact` — MARKETING, the restricted category. A
  send to a number whose 24h window had closed three days earlier delivered in
  **2.6s**. This was the risk that could have sunk the migration.
- **Read receipts are one-way evidence.** Two of three test handsets had them
  disabled. A blue tick proves a read; its absence proves nothing. Never present
  "delivered but not read" as "they ignored it".
- **`vercel env add --force` silently fails to overwrite** — the row kept its old
  timestamp *and old value*. Use `rm` then `add`, and confirm the timestamp moved.
- **A branch-pinned Vercel var cannot also target Production**
  (`gitBranch can only be used with target=preview`). Use separate rows per
  environment.
- **The live edge functions have no recipient allowlist** — only the Vercel test
  route does. When driving the real function, the number in the request is the
  only safeguard.
- **Do not rename the `aisensy_*` dedup columns.** Cosmetic gain, real risk of
  re-sending payment confirmations to people who already got them.
- **Preview URLs are per-deployment**; only the branch alias
  (`chapter-a-git-<branch>-…`) is stable. Never give a hash URL to a webhook.
- **Version numbers differ between the Supabase MCP tool and the CLI** (off by
  one). Use `updated_at` to tell whether something was actually deployed.
- Supabase and GitHub are **not** connected — pushing to main does not deploy
  edge functions. They deploy only when someone runs the CLI.

---

## 10. What is left

1. **Recreate `balance_paid_dpl` as UTILITY.**
2. **Swap the three payment functions together** — `payu-callback`,
   `payu-webhook`, `verify-pending-payments`. They share the same confirmation
   templates, so migrating one alone means the same payment gets announced from
   two different numbers. `payu-callback` is the highest-stakes file in the
   codebase; deploy with `--no-verify-jwt` and run a ₹1 booking straight after.
3. **Swap `send-aisensy-invite`** — admin-triggered, errors visible on screen.
4. **Fix `advancepaid`** before running a non-pay-at-venue split event.
5. **Fix `invitation_with_contact` buttons** before running an invite-only event.
6. Once all templates have run clean for a week: remove the AiSensy fallback
   branches, revoke `AISENSY_API_KEY`, cancel the subscription. **Not before** —
   keeping it paid one extra month buys a working fallback.

### Not part of this migration, but found along the way

- `META_PIXEL_ID` and `CRON_SECRET` are referenced by edge functions but **not
  set as secrets**. An unset `META_PIXEL_ID` would mean edge-function CAPI events
  carry no pixel id — worth checking given past Meta reporting gaps.
- The Brevo webhook drops **open-event** recovery-email opens: its lookup filters
  `status = 'invited'`, which open events never reach, while the admin UI is
  already built to display them.

---

## 11. Verified end to end

| Signal | Evidence |
|---|---|
| Send | live `open-event-otp` on `founders-meet` → `provider: wamafy` |
| Delivered | 1.6s, 2.6s, 3.7s across tests; 200 in **production** logs |
| Read | captured on the one handset with receipts enabled |
| **Failed + reason** | `131026 Message undeliverable` on a non-WhatsApp number |
| Inbound reply | text, name, phone, conversation + lead ids |
| Cold start | delivered 2.6s to a number with a closed 24h window |
| Idempotency | repeated `delivered` did not overwrite; out-of-order handled |
| Cart abandonment | real `bill_opens` row → `{sent:1}` → delivered 3.7s |
| OTP not logged | `variables` is null on otp rows |

