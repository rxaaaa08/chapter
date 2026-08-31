# WhatsApp BSP migration — AiSensy → Wamafy

**Single source of truth for this work.** Supersedes `bsp-migration-plan.md`
(planning) and `WAMAFY-TEST-HANDOFF.md` (trial log); both are kept for history.

Last updated **2026-09-01**. **All six senders are migrated.** Every WhatsApp
message the product sends now goes through Wamafy, with AiSensy as an automatic
fallback on each one.

---

## 1. Status at a glance

| Message | Fires from | Provider now |
|---|---|---|
| `otp` | `open-event-otp` | ✅ **Wamafy** |
| `cart_abandon` | `cart-abandonment` | ✅ **Wamafy** |
| advance / balance / full paid | `payu-callback`, `payu-webhook`, `verify-pending-payments` | ✅ **Wamafy** |
| `payment_failed` | same three | ✅ **Wamafy** |
| invite + details | `send-aisensy-invite` | ✅ **Wamafy** |
| *advance on a regular split event* | same three | ⏳ AiSensy — see §8 |

Every one keeps AiSensy as an automatic fallback: if Wamafy fails or its key is
absent, the send falls through rather than being lost. **Keep the AiSensy
subscription paid until Wamafy has run clean through real bookings** — one extra
month buys a working fallback, and edge functions have no rollback.

Also built alongside the migration:

- **Delivery, read and failure logging** on every send, joined by `messageId`.
- **`whatsapp_inbound`** — customer replies, rendered inline on the People rows
  in the same card as a doubt (green rather than amber). Shown on a person's
  topmost row only: a conversation belongs to a person, but the table is one row
  per booking.
- **`whatsapp-reply`** — free-form replies from the People tab, inside WhatsApp's
  24-hour window. Admin-gated twice (`verify_jwt` plus an `admin_users` lookup),
  rate limited to 60/hour per admin, and recorded in `whatsapp_sends` with
  `template_name` NULL and `sent_by_email` set.

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

- **`whatsapp_sends.body_text` / `.sent_by_email`** — a free-form staff reply is
  stored here with `template_name` NULL, so the conversation reads in order from
  one table and delivery callbacks attach by `message_id` exactly as for a
  template. `sent_by_email` records who answered: every reply leaves under the
  same business number, so without it there is no way to tell afterwards.

Migrations: `20260828_whatsapp_send_log.sql`, `20260901_whatsapp_inbound.sql`,
`20260901_whatsapp_freeform_reply.sql`.

### Two-way messaging — seeing what customers say

Replies land in `whatsapp_inbound` from the production webhook and render inline
on the **People** rows, reusing the existing doubt card: same shape, same slot,
**green instead of amber** so a reply is never mistaken for an unresolved doubt.
A row tints pale green when a reply is waiting and no doubt is, so amber keeps
its meaning as the more urgent state.

Three deliberate choices in that rendering:

- **Shown on a person's topmost row only.** A conversation belongs to a person,
  but this table is one row per booking — so someone with two bookings would
  otherwise see the same thread printed twice, with two reply boxes that do the
  same thing. The `↩ n` badge stays on every row, so nothing is hidden; it just
  is not said twice. Grouping the whole table by phone was the alternative and is
  the wrong trade: status, date, marketer, payment state and the Approve button
  are all genuinely per booking.
- **Keyed by phone alone.** A WhatsApp message carries no event. Attaching a
  reply to a guessed booking would be a fabrication; showing it against the
  person is the honest rendering.
- **Button taps and photos show as what they are** — `tapped "Join Groupchat"`,
  `sent image` — rather than an empty card. That is also how we will learn
  whether template buttons get used at all.

Bounded to 60 days / 500 rows on load: the table grows forever and a reply stops
being useful long before it stops being stored.

### Two-way messaging — replying from the panel

`whatsapp-reply` (edge function, `verify_jwt: true`) lets an admin answer in
their own words from the People tab, instead of picking up a personal phone —
which left no record and messaged the guest from an unknown number.

**The 24-hour window is the whole constraint.** Free-form text is only allowed
within 24 hours of the **customer's** last message (Meta's rule; Wamafy answers
`400 NO_OPEN_CONVERSATION` outside it). So:

- The UI calls `action: 'window'` **before** showing the box. If the window is
  shut it says so in plain words and points at calling instead. Letting someone
  compose a careful answer that silently bounces is the outcome worth designing
  against.
- The window can also close **between** the check and the send. That returns
  `409` and is reported as the window closing, not as a failure — "failed" would
  send someone hunting for a fault that is not there.

**Security.** Sending lives here and never in Vercel, which deliberately holds no
WhatsApp key. Gated twice: `verify_jwt` stops anonymous traffic at Supabase's
gateway, then an `admin_users` lookup means a stolen non-admin JWT still cannot
message customers. Rate limited to **60 replies per admin per hour**.

**Known limits, by design for now:**

- Only replies to the **Wamafy** number are captured. Anyone answering the old
  AiSensy number is invisible, because nothing ever recorded those.
- **Nobody is notified when a customer replies** — you have to be looking at the
  panel. `send-admin-push` already exists and could be wired to inbound; it is
  not, yet.
- No template fallback when the window is shut. Deliberate: the approved
  templates are announcements, and sending `resend_details` to someone asking a
  specific question answers nothing.

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

-- one conversation, both directions, in order
select ts, direction, who, text from (
  select sent_at as ts, 'in'  as direction, from_name     as who, body_text as text
    from whatsapp_inbound where from_phone = '8838111564'
  union all
  select sent_at as ts, 'out' as direction, sent_by_email as who,
         coalesce(body_text, '[template: ' || template_name || ']')
    from whatsapp_sends where to_phone = '8838111564'
) t order by ts;
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
| `advance_success_dpl` *(pay-at-venue)* | **`advancepaid`** | amount **only** | 2 × URL |
| `fullpaid_dpl` | `balance_success` † | amount, details-date | 2 × URL |
| `payment_failure_dpl` | `payment_failed` | name, amount | 2 × URL |
| `advance_success_dpl` | `advancepaid` ⚠️ | amount **only** | 2 × URL |
| `send_details_dpl` | `resend_details` | name, event | 2 × URL |
| `invitation_with_contact` | `invitation_with_contact` ⚠️ | event, date | **static** |

### Pay-at-venue open events — what actually fires

This is the flow being migrated, and it is **shorter than it looks**:

| Step | Template |
|---|---|
| Verification code | `otp` |
| Abandoned cart | `cart_abandon` |
| **Advance paid** | **`advancepaid`** |
| **Balance settled at the venue** | **nothing — no message is sent** |
| Payment failed | `payment_failed` |

**There is no balance-paid message on pay-at-venue**, by design. All three
payment functions return early:

```js
// Pay at venue: the balance is settled in person, with the guest standing in
// front of us and already in the group chat. The bill's success page is the
// confirmation — a "you're fully paid" WhatsApp adds nothing.
if (await isPayAtVenue(supabase, args.eventSlug)) return;
```

† So `balance_success` is **not needed for the current flow** — it is for regular
split events, where the balance is paid remotely and the guest does need telling.

**Use `advancepaid` for the pay-at-venue advance.** The AiSensy code borrows the
*full-payment* template there (`payAtVenue ? AISENSY_CAMPAIGN_FULL : …`) purely as
a workaround: `advance_success_dpl`'s `{{2}}` is a balance deadline, and
pay-at-venue has none, so it would render empty on copy telling the guest to settle
by that date. `advancepaid` fixes this properly — advance-worded, and no date
parameter to leave blank.

One copy difference to accept or fix: `advancepaid` says details arrive **"a few
days before the plan"**, while the borrowed template said **"one week before the
event"** (`PAY_AT_VENUE_DETAILS_WHEN`). The phrase is baked into `advancepaid`, so
that is what guests will now read.

### Known template problems

1. ~~`balance_paid_dpl` is MARKETING~~ — **resolved 2026-09-01.** Replaced by
   **`balance_success`** (UTILITY, `en`), same body, same two params, same two
   URL buttons. Verified against Wamafy. Use `balance_success`; the MARKETING
   `balance_paid_dpl` is now a duplicate and **should be deleted** so nobody
   wires the expensive, delivery-restricted one by mistake.
2. **`advancepaid` is missing two parameters.** AiSensy's `advance_success_dpl`
   sends amount, **balance due date** and **transaction id**. Harmless for
   pay-at-venue (which uses `single_payment_sucess_dpl`), but a regular split
   event would lose the due date and reference. Fix before running one.
3. ~~`invitation_with_contact` has static buttons~~ — **withdrawn, this was wrong.**
   The AiSensy path only attaches buttons on the *details* delivery; the invite
   itself has never carried dynamic buttons on either provider. The Wamafy copy is
   a faithful match. (`resend_details` does take the two dynamic buttons, and gets
   them.)

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

1. ~~Recreate `balance_paid_dpl` as UTILITY~~ — done, it is `balance_success`.
   Delete the leftover MARKETING `balance_paid_dpl`.
2. **Swap the three payment functions together** — `payu-callback`,
   `payu-webhook`, `verify-pending-payments`. They share the same confirmation
   templates, so migrating one alone means the same payment gets announced from
   two different numbers. `payu-callback` is the highest-stakes file in the
   codebase; deploy with `--no-verify-jwt` and run a ₹1 booking straight after.
   For pay-at-venue, only the **advance** and **failed** paths need wiring —
   balance sends nothing.
3. ~~Swap `send-aisensy-invite`~~ — done.
4. **Run a ₹1 pay-at-venue booking end to end.** Everything is verified by
   construction, smoke test and single sends; no real transaction has yet gone
   through the migrated payment path.
5. **Fix `advancepaid`** before running a non-pay-at-venue split event — it needs
   `{{2}}` balance due date and `{{3}}` txn id. Until then those advances stay on
   AiSensy by design.
6. **Delete the leftover MARKETING `balance_paid_dpl`** so nobody wires the
   expensive, delivery-restricted copy by mistake.
7. Once everything has run clean for a week: remove the AiSensy fallback
   branches, revoke `AISENSY_API_KEY`, cancel the subscription. **Not before** —
   keeping it paid one extra month buys a working fallback.

### Worth doing next on the messaging side

- **Notify someone when a customer replies.** Right now a reply sits in the panel
  until a human happens to look. `send-admin-push` already routes role-scoped
  pushes and could be triggered from the inbound webhook.
- **Show the outbound side of the thread in the panel.** Staff replies are stored
  but only the one just sent is rendered; older replies and template sends are not
  shown next to the inbound messages.
- **Capture replies to the old number** — or retire it, so there is one inbox.

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
| Inbound reply | text, name, phone, conversation + lead ids; `sent_at` 3.5 s before the callback |
| **Free-form reply** | "hello mellow" sent from the panel by `krutesh08@gmail.com`, delivered, `template_name` NULL |

---

## 12. Auth boundaries — verified 2026-09-01

| Function | `verify_jwt` | Anonymous POST |
|---|---|---|
| `payu-callback` | false | 302 — PayU can reach it |
| `payu-webhook` | false | 200 |
| `verify-pending-payments` | false | reachable |
| `open-event-otp` | false | 400 (validation, not auth) |
| `cart-abandonment` | false | reachable |
| `send-aisensy-invite` | **true** | **401** |
| `whatsapp-reply` | **true** | **401** |

The two admin-only functions reject anonymous callers; the customer- and
PayU-facing ones stay open. **A 401 on `payu-callback` means payments have
stopped** — that is the single check worth re-running after any deploy.
