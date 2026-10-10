# Switching WhatsApp BSP away from AiSensy — safety plan

Written 2026-08-26. Status: **plan only, nothing built.**
Read §1 for what we're actually locked into, §2 for the three questions that
decide everything, §3 for the build.

---

## 1. What the audit found

### 1.1 Eight live templates

| Template (AiSensy "campaign") | Fires from | What breaks if it fails |
|---|---|---|
| `otp` | `open-event-otp` | **Every open-event booking stops.** `create-payu-order` refuses a new ticket without a verified OTP session |
| `advance_success_dpl` | `payu-callback`, `payu-webhook`, `verify-pending-payments` | Guest paid, gets no confirmation |
| `single_payment_sucess_dpl` | same three | Same, for full-pay + pay-at-venue events |
| `fullpaid_dpl` | same three | Balance-paid confirmation |
| `payment_failure_dpl` | same three | Failed-payment recovery nudge |
| `invitation_with_contact` | `send-aisensy-invite` | Admin clicks Approve, guest never hears |
| `send_details_dpl` | `send-aisensy-invite` | Event details never delivered |
| `car_abandon_deeplink2` | `cart-abandonment` (30-min cron) | Abandoned-cart nudge |

### 1.2 The code is welded to AiSensy in 13 places

There is **no abstraction layer**. `https://backend.aisensy.com/campaign/t1/api/v2`
is hardcoded, copy-pasted, in six edge functions:

`send-aisensy-invite` · `open-event-otp` · `payu-callback` · `payu-webhook` ·
`verify-pending-payments` · `cart-abandonment`

Changing provider today means editing and redeploying all six at once, with no
way to undo it except editing and redeploying all six again.

### 1.3 Three smaller hooks

- **Five DB columns** named `aisensy_*` (`aisensy_invite_sent`,
  `aisensy_advance_paid_sent`, `aisensy_balance_paid_sent`, `aisensy_full_paid_sent`,
  `aisensy_payment_failed_sent`). These are the one-shot guards that stop double-sends.
  They keep working under any provider — **do not rename them during a migration.**
  Renaming is cosmetic and would risk re-sending money confirmations to people who
  already got them. Leave them; rename later or never.
- **`retarget-check`** filters on `aisensy_invite_sent = true`.
- **Meta dataset `892500220416246`** ("WhatsApp Marketing Messages") belongs to the
  AiSensy integration. Ad tracking uses a *separate* dataset (`28370453785913523`),
  so ads are unaffected — but expect that WhatsApp dataset to go quiet.

### 1.4 The good news

The message payload we send already uses **Meta's own Cloud API shape** —
positional `templateParams` and a `buttons` array of
`{type:'button', sub_type:'URL', index, parameters:[…]}`. AiSensy is a thin pass-through.
Any BSP that exposes the Cloud API (or the Cloud API itself) takes nearly the same
structure. **This is a plumbing change, not a re-model of the messages.**

### 1.5 The bad news

**We have no record of a single WhatsApp message ever sent.** No send-log table
exists — only `console.log` in edge functions (which ages out) and the five boolean
flags. Which means today we **cannot answer** "is the new BSP delivering as well as
AiSensy?" That is the single biggest safety gap, and it is fixable before any switch.

---

## 2. Three questions that decide the whole shape of this

### Q1 — Who owns the WhatsApp Business Account? *(ANSWERED 2026-08-26 — see §7)*

Open Meta Business Manager → WhatsApp Accounts → look at our number.

- **If chapter அ's own Business Manager owns the WABA** and AiSensy is listed only as
  a partner with access → this is a *change of partner*. Number, quality rating and
  approved templates all stay. Cheap, hours not weeks.
- **If AiSensy owns the WABA** → the number has to be migrated out to a new WABA.
  Templates do not come with it; all eight get re-created and re-approved by Meta.
  There is a real downtime window on the number during migration.

Everything about timeline and risk hinges on this. **Confirm it before shortlisting
any new BSP**, and make the new BSP confirm in writing which path they'll run.

### Q2 — What is actually wrong with AiSensy?

Cost, deliverability, template approvals, support, or a feature we want? Since Meta
bills per conversation directly, **most of the WhatsApp cost is Meta's, not the BSP's** —
a switch chasing price may move less than expected. Worth pulling AiSensy's last three
invoices and separating their markup from Meta's pass-through before spending a week on this.

### Q3 — Does the team chat with customers inside AiSensy?

If marketers use AiSensy's shared inbox for manual replies, this is not just a code
migration — it's retraining the team and losing chat history. If the team only ever
uses their own phones, the migration is purely technical.

---

## 3. The build — five phases, each safe on its own

### Phase 1 — One door instead of thirteen *(do this regardless of the decision)*

Create `supabase/functions/_shared/whatsapp.ts`: a single `sendWhatsApp({template, phone, params, buttonParam})`
function. Every one of the 13 call sites goes through it. AiSensy stays the only
provider implemented, so **behaviour is byte-identical and nothing changes for customers.**

This is worth doing even if we never switch — it's the difference between "edit six
files under pressure" and "edit one file".

> ⚠️ **The `_shared` trap.** Per CLAUDE.md, `_shared/*` is bundled at *deploy* time.
> Editing this file changes nothing live until **every** importing function is
> redeployed — and nothing warns you. This already caused two Meta reporting gaps.
> All six functions must be deployed together, every time, and verified with
> `list_edge_functions` (`updated_at` moved, `verify_jwt` unchanged).

### Phase 2 — A send log

New table `whatsapp_sends`: provider, template, phone, status, response, timestamp.
Written on every send, failure included. Costs nothing, and it's what makes the
A-vs-B comparison in Phase 4 possible. **Run this for at least two weeks on AiSensy
alone** so we have a baseline to compare the new BSP against.

### Phase 3 — A switch you can flip yourself

New table `whatsapp_routing`: one row per template, holding which provider sends it.
Read at send time, not baked into code.

Why per-template and not one global switch: it lets us move the harmless templates
first, and it means **rollback is you changing one word in a table row** — seconds,
no deploy, no me.

### Phase 4 — Move templates in blast-radius order

Never move them all at once. Order is deliberate — safest first, revenue-critical last:

1. `car_abandon_deeplink2` — a cron nudge. If it silently fails we lose a reminder, nothing else. **Watch a full week here before continuing.**
2. `payment_failure_dpl` — recovery nudge.
3. `invitation_with_contact`, `send_details_dpl` — admin-triggered, and the admin sees the error on screen immediately. A human is watching every send.
4. `advance_success_dpl`, `single_payment_sucess_dpl`, `fullpaid_dpl` — money confirmations. Guest has already paid, so no revenue is at risk, and these fire from three places (callback, webhook, reconcile cron) so there's natural retry.
5. `otp` — **last, and alone, and on a quiet day.** This one gates every open-event sale.

At each step: send a real test to `90000000xx`, then watch `whatsapp_sends` for 24h
and compare the success rate to the AiSensy baseline before moving to the next.

### Phase 5 — Decommission

Only after every template has run a clean week on the new provider: remove the
AiSensy branch, revoke `AISENSY_API_KEY`, cancel the subscription (it's in the
Finances fixed-costs list in the admin panel).

---

## 4. What I'd hold as non-negotiable

- **Never migrate `otp` and a payment template in the same session.** The two failure
  modes look identical from the outside and you won't know which provider to blame.
- **Keep AiSensy paid and live until Phase 5.** Running both for a month is cheap
  insurance; a dead account you can't roll back to is not.
- **Don't rename the `aisensy_*` DB columns during the migration.** Cosmetic gain,
  real risk of re-sending payment confirmations.
- **No migration during a live event window.** Check the calendar first.

---

## 5. Decision checklist — answer before we build

1. Who owns the WABA (§2 Q1)? Confirmed how?
2. What's the actual reason for switching (§2 Q2)?
3. Does the team use the AiSensy inbox (§2 Q3)?
4. Which BSP is being considered? Does it expose the raw Cloud API?
5. Are we happy to keep paying AiSensy in parallel for ~1 month?
6. Green light for Phases 1 + 2 (abstraction + send log) *now*, independent of the
   switch decision? They're safe, invisible to customers, and useful either way.

---

## 6. Answers so far (2026-08-26) + volume check

**Reasons given:** cost, and a feature AiSensy doesn't have.
**Decision:** hold all building until the WABA ownership question (§2 Q1) is answered.

### Measured message volume

Template sends, from the `aisensy_*` flags on `applications`:

| Month | Invites | Advance | Balance | Full paid | Failed | Cart | Total |
|---|---|---|---|---|---|---|---|
| 2026-06 | 130 | 31 | 24 | 7 | 11 | 11 | **214** |
| 2026-07 | 46 | 3 | 1 | 13 | 2 | 5 | **70** |
| 2026-08 | 42 | 27 | 0 | 28 | 6 | 9 | **112** |

Plus OTP sends (`open_event_otp_sessions`): **71 in 2026-08** — the open-event flow
only started producing these recently.

> Caveat: these are grouped by the application's *creation* month, and the flags are
> current-state booleans, not timestamps (see the `applications-mutable-state-no-history`
> memory). Treat as order-of-magnitude — roughly **150–280 WhatsApp messages a month** —
> not as exact monthly billing. The Phase 2 send log is what would make this precise.

### What that means for the cost argument

At ~200 messages/month, Meta's per-conversation charge is close to a rounding error.
**Essentially all of the AiSensy bill is their monthly plan fee**, not usage. So:

- The saving available from switching is *the difference in plan fees*, full stop.
- Pull the last 3 AiSensy invoices and check this. If the bill is a flat monthly plan,
  write down the number — that is the entire prize.
- Weigh it against the downside: `otp` gates every open-event sale, and 71 of last
  month's sends were OTPs. A bad migration week costs more in lost tickets than a
  year of plan-fee difference.

**Provisional read: cost alone does not justify this migration at current volume.**
It would start to matter at roughly 10× the message volume, or if the plan fee is
unexpectedly large. The *feature* reason is more likely to be the real one — worth
naming it explicitly, because some features (send logging, per-template routing,
retry-on-failure) we can build ourselves in Phases 1–2 without changing provider at all.

---

## 7. WABA ownership — ANSWERED (2026-08-26)

From Business Manager → WhatsApp Accounts:

- **WABA name:** Join Chapter
- **WABA ID:** `1438759947539827`
- **Owned by: Chapter அ** ← our own Business Manager, **not** AiSensy
- Business verification: **Verified** · Account status: **Approved**
- **Payment method: Credit line — AISENSY COMMUNICATIONS PRIVATE LIMITED** ← the catch

### What this means

**We are on the cheap path.** AiSensy is a *partner assigned to our WABA*, not the owner.
So a switch is a change-of-partner, and these all stay put:

- the phone number (no migration, no downtime on the number)
- **all 8 approved templates** — they live on the WABA, not at AiSensy. No re-approval marathon.
- the quality rating and messaging limits
- the verified business status

The §1 nightmare scenario — migrate the number, re-approve everything — **is off the table.**

### The one real catch: the credit line

Meta bills the WABA through **AiSensy's credit line**. That is the thing that actually
has to move, and it's the thing that can silently stop sends if it's mishandled: a WABA
with no working credit line attached cannot send messages, regardless of which partner
is assigned or how healthy the templates are.

So the migration's true risk is no longer "will the templates survive" — it's
**"is there a gap between AiSensy's credit line detaching and the new one attaching."**

### Questions for any BSP being evaluated

1. Can you be added as an **additional** partner on WABA `1438759947539827` while
   AiSensy is still assigned — i.e. can we run both in parallel and roll back instantly?
2. How does the credit line change over? Is there any window where the WABA has no
   credit line attached? Can we attach our own payment method directly instead of
   depending on a BSP's credit line?
3. Do you expose the raw Cloud API (our payloads are already in Cloud API shape)?
4. Confirm in writing that no template re-approval and no number migration is involved.

If the answer to (1) is yes, the migration gets dramatically safer than §3 assumes —
Phase 4 becomes a genuine parallel run on the same number and the same templates.

### Revised read on the cost question

The switch is now much **cheaper and less risky** than feared, *and* the prize is still
only the plan-fee difference on ~200 messages/month (§6). Both sides of the trade shrank.
It now turns on the **feature** reason, not the cost one — name the feature before
committing to this.

### Partners tab — checked 2026-08-26

> **1 partner is assigned to this Join Chapter WhatsApp account**
> Partners with full control: **AiSensy** — [Manage]

Three things follow:

1. **AiSensy holds "full control"** on our WABA. That is the widest tier — it means they
   can currently change templates, phone numbers and settings on an account we own.
   Fine while they're the active BSP; it's the first thing to narrow or revoke on exit.
2. **The heading is "Partners with full control"** — implying narrower tiers exist. A new
   BSP may not need full control, which is a cleaner way to trial one.
3. **Meta's own copy says partners (plural) can be assigned, managed and removed**, and the
   "Assign partner" button is live. So adding a second partner alongside AiSensy is
   supported by the interface — which is what a parallel run needs.

**Caveat, and it matters:** the interface allowing two partners is *not* proof that both
can send on the same number at the same time, because the **credit line attaches once**.
That is the specific thing to make the new BSP answer in writing (question 2 above).
Don't assume the parallel run works until they confirm it.

### Phone numbers tab — the "before" baseline (2026-08-26)

| Phone number | Display name | Status | Quality rating |
|---|---|---|---|
| **+91 99401 11564** (India) | chapter அ | **Connected** | 🟢 **High** |

One number only. **This table is the before-and-after record** — if a switch ever degrades
the account, this is the proof of where we started.

**The High quality rating is the most valuable and least-recoverable asset on this account.**
It's earned slowly through low block/report rates, and it sets our messaging limits. It is
attached to the *phone number*, so a change-of-partner keeps it — but it can fall fast if a
botched cutover causes failed sends, duplicate sends or retry storms, and it is not
something a new BSP can restore for us.

That is the real argument for the blast-radius ordering in §4: the downside of a sloppy
migration isn't one week of missed messages, it's a permanently degraded sending reputation
on the only WhatsApp number the business has.

### Full "before" state — record before changing anything

- WABA: Join Chapter · `1438759947539827` · owned by Chapter அ · Verified · Approved
- Partner: AiSensy (full control), sole partner
- Credit line: AISENSY COMMUNICATIONS PRIVATE LIMITED
- Number: +91 99401 11564 · "chapter அ" · Connected · Quality **High**
- 8 approved templates (§1.1)

---

## 8. The feature is delivery + read receipts — and it probably shouldn't cost anything

**Owner's answer (2026-08-26):** the missing feature is **delivery & read logging**. AiSensy
gates webhooks behind a **₹3,000/mo** plan; we're currently on **₹1,500/mo**.
So the ask is **+₹1,500/mo = ₹18,000/year**.

### Why that price is worth challenging

Delivery and read receipts are **not an AiSensy feature**. They are a standard, free part of
Meta's WhatsApp Cloud API: Meta posts `sent` / `delivered` / `read` / `failed` statuses to
whatever app is subscribed to the WABA's webhooks. AiSensy is charging a **markup to forward
us our own data**.

### The likely free route — subscribe our OWN app to our OWN WABA

We already own WABA `1438759947539827` (§7). Webhook subscription is done **at the WABA
level** (`POST /{WABA_ID}/subscribed_apps`), and Meta's own documentation notes that webhooks
go to **all apps subscribed** to that WABA — explicitly warning that this "can result in
duplicate webhook notifications". Duplicates are a *feature* for us here: it means a second
subscriber does not displace the first.

**So the hypothesis is:** we create our own Meta app, subscribe it to our WABA, and start
receiving delivery/read statuses **while AiSensy carries on sending exactly as it does today**.

- No BSP migration
- No credit-line change
- No risk to the **High** quality rating
- No change to any of the 8 templates
- **₹0/month**

### Verify it before believing it — the 30-minute test

1. Create an app at Meta for Developers, add the WhatsApp product.
2. `POST /1438759947539827/subscribed_apps`, then `GET` the same endpoint to confirm
   **two** apps are now listed (AiSensy's and ours).
3. Point the webhook at a throwaway endpoint that just logs the body.
4. Send one real message through AiSensy as normal (e.g. approve a test row on `90000000xx`).
5. Watch for a `statuses` callback. **If it arrives, the ₹18,000/year spend is unnecessary.**

Nothing in steps 1–4 touches sending, billing, or templates. If it doesn't work, we've lost
half an hour and learned the answer.

### The catch nobody mentions: joining statuses back to a booking

Meta's status webhook identifies the message by **`wamid`**. Our code never captures one —
every call site only checks `aiRes.ok` / `aiSensyAccepted()` and throws the response body
away. So even with webhooks flowing, we can't say *"the advance-paid message to this
application was read"* without a join key.

Two ways round it, both fine at ~200 messages/month:

- **Join on phone + time window** — fuzzy, but at our volume collisions are near-impossible.
- **Capture whatever id AiSensy returns** at send time and store it in the send log. Needs a
  look at their actual response body, which we currently discard.

Either way this is **only solvable once the send log (Phase 2) exists.** The webhook has to
write somewhere. **Phase 2 is now a prerequisite for the feature, not a nice-to-have.**

### If the free route fails, ranked options

| Option | Monthly | Trade-off |
|---|---|---|
| Own webhook subscription | **₹0** | Needs the test above to pass |
| Stay on AiSensy, upgrade | **₹3,000** | Zero risk, zero work, permanent tax |
| Switch BSP (webhooks in base tier) | varies | Migration risk per §3–4, for a feature Meta gives free |
| Go direct to Meta Cloud API | **~₹100–300** est. | We own the WABA and our payloads are *already* Cloud API shape, so the code change is small — but we lose the dashboard and the support line, and must attach our own payment method in place of AiSensy's credit line |

**Recommendation: run the 30-minute test first.** It's the only option that costs nothing and
risks nothing, and it plausibly makes the entire migration question disappear.

> ⚠️ Build note: a Meta webhook receiver is an unauthenticated POST from Meta, so per CLAUDE.md
> it **must be deployed with `--no-verify-jwt`** or Meta gets a 401 and silently stops
> retrying — the same failure mode that would take payments down on `payu-callback`.
