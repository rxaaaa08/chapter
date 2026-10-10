# Delivery logging — notation + build handoff

**Written 2026-09-01. Phases 1-4 and 5a-5b are BUILT AND LIVE on production.**
Phase 5c-5d, 6 and 7 are not started — see §7 for what each is waiting on.

| Phase | State |
|---|---|
| 1 · `email_sends` + claim/log RPCs | ✅ live, dedup + forward-only verified |
| 2 · Log every email send | ✅ 6 edge functions deployed |
| 3 · `brevo-webhook` rewrite | ✅ deployed, v9 |
| 4 · Two-lane delivery ticks | ✅ built, `tsc` clean, **not pushed** |
| 5a · Backfill | ✅ 117 rows moved |
| 5b · Verify | ✅ exact match on all four kinds |
| 5c · Cut over the guards | ⏳ needs a real send cycle first |
| 5d · Drop the columns | ⏳ irreversible, needs go-ahead at the time |
| 6 · `advance_success_dpl` | ⏳ blocked on a Wamafy template approval |
| 7 · WhatsApp click tracking | ✅ **our half done + verified**; 3 templates still need resubmitting |

> ⚠️ **One owner action is needed for Phase 3 to actually produce data.** The
> Brevo dashboard's webhook subscription decides which events it posts. If
> `delivered` and the bounce events are not ticked there, the new code will never
> see them and the mail lane's middle rung stays empty no matter what the code
> does.

The goal: **see whether a message we sent actually reached the person**, for both
WhatsApp and email, using one visual language across both — the WhatsApp tick
vocabulary everyone already understands.

---

## 1. Why this exists

WhatsApp delivery logging went live on 2026-08-28 with the Wamafy migration.
Wamafy returns a `messageId` on every send, so its `delivered` / `read` / `failed`
callbacks attach to the exact message. That data lands in `whatsapp_sends` and is
already correct.

Email has had open tracking far longer, but it was built one email at a time:
each email type got its own boolean and its own timestamp column bolted onto
`applications`. There is no email log table, no message ID stored, and no shared
shape with `whatsapp_sends`.

**That mismatch is the actual blocker.** A single UI component cannot render two
channels that are stored in two completely different ways. Every phase below
exists to close that gap and then render it.

---

## 2. The settled notation

Five states. Three of them stack (they build up the ladder), two of them replace
the ticks entirely (they are terminal and need a distinct silhouette).

| State | Mark | WhatsApp means | Email means |
|---|---|---|---|
| Accepted | single grey tick | Wamafy accepted the request | Brevo accepted the request |
| Delivered | double grey tick | arrived on the phone | arrived in the inbox |
| Read | double **coloured** tick | chat opened | mail opened |
| Clicked | **Claude sunburst**, coloured | a tracked button was tapped (live 2026-09-02) | a link in the mail was clicked |
| Failed | **prohibition mark**, red | blocked, opted out, undeliverable | bounced, rejected |

### Colour

- **WhatsApp read = blue.** `#34b7f1` — already used in `AdminPanel.tsx`.
- **Email read = amber.** `#FE9A00` — Tailwind v4 `amber-500`, lifted verbatim
  from the "Invalid Number" hint in the open-event booking form (`AppFlow.tsx`,
  `text-amber-500`). Borrowed rather than invented, so the product carries one
  amber instead of two that almost match. The admin panel is light-mode only, so
  there is no second value to define.
- Accepted, delivered and failed are the **same** colour in both lanes (grey,
  grey, red). Colour only separates the channels at the read and clicked rungs.

> ⚠️ **Neither channel's "read" is reliable, for opposite reasons — and the UI
> must not pretend otherwise.**
>
> **WhatsApp** only reports a read when the RECIPIENT has read receipts switched
> on. Confirmed on 2026-09-01: the founder's own number opened a message, tapped
> a button, and produced no `read` event at all, while a receipts-on number the
> same week reported reads normally. So double grey ticks can NEVER be read as
> "they ignored it". The hover says so, and says it differently depending on
> whether that phone has ever produced a read receipt — if it has, receipts
> demonstrably work and silence really does mean unread; if it never has, we
> decline to imply anything.
>
> **Email** has the mirror-image problem: an open can be a mail client
> pre-fetching the tracking pixel (Apple Mail does this routinely), and an
> image-blocked client reads the mail and reports nothing. That is why a click is
> worth more than an open, and why it gets its own mark.

### Rules that fall out of it

1. **Clicked replaces read, it does not sit beside it.** A click implies an open,
   so the sunburst stands in for the ticks entirely.
2. **A click must set the clicked state even with no recorded open.** Image-blocked
   mail clients fire a click with no open event. Gating the sunburst on
   `opened_at` being present would silently downgrade the strongest signal we have.
3. **States must never regress.** A late or duplicate callback must not walk a row
   backwards (read → delivered, or clicked → read). Rank the states and only ever
   move forward. This is the same class of bug that `PAID_RANK` guards against in
   `payu-callback` — an out-of-order PayU callback once walked a paid booking
   backwards, and delivery callbacks arrive out of order too.
4. **Failed replaces everything.** If a message failed there is nothing to say
   about delivery or reading, so the mark stands alone.
5. **One mark, one colour, for every terminal problem.** A red prohibition mark
   covers both a message that failed and one that was due and never sent. Four
   cause-specific glyphs were designed and rejected: they map to four different
   next actions, but four symbols is four things to learn on a panel a handful of
   people use. The cause lives in the hover text instead — which matters, because
   "they refused it" and "we never sent it" are opposite responsibilities.

---

## 3. Where it renders

### People list — two icon-only lanes

Each lead row gets a compact two-line block, roughly 52px wide:

```
 [whatsapp icon]  ✓✓        ← top lane, always WhatsApp
 [mail icon]      ✳         ← bottom lane, always email
```

- **No text labels.** The status pill already names the message (Cart abandoned →
  Nudge; Advance paid → Payment success), and the icon names the channel. A word
  would be saying what two other things already say.
- **A lane is dropped when that channel carries no message at this status.**
  Payment success has no email half, so advance-paid and fully-paid rows show
  the chat lane alone. A dash there is a constant of the status, identical on
  every such lead, and a constant is not information.

  This reverses an earlier rule that kept both lanes always. That rule existed
  because the lanes were text-labelled and position was the only thing telling
  them apart — once the labels became channel ICONS, the icon names the channel
  and the dash lost its job.

  The line is **status vs lead**: hide when the absence is a property of the
  status (no email for payment success; pay-at-venue balance sends nothing at
  all, so that row collapses entirely). Keep the dash when it is a property of
  this lead and therefore varies — no address on file, a manual send not made
  yet, or a send predating delivery logging.
- **Hover text is mandatory, not optional.** With labels gone, the `title`
  attribute is the only place the full sentence lives — e.g. *"Nudge on WhatsApp
  — read 14:22"*. Every lane needs one, including the dash lanes.
- **The dash and the failure mark must be visually distinct at a glance.** They occupy
  the same small slot, and the difference between them is the difference between
  "nothing was supposed to go" and "something broke".

### Chat view — unchanged, WhatsApp only

`People ▸ Chat` merges `whatsapp_inbound` and `whatsapp_sends` into a real
two-sided conversation. **Email must not go into it.** Three reasons:

1. There is no inbound half — every email we send says "do not reply".
2. The view's typed-reply box is gated on the 24-hour window since the last
   inbound WhatsApp. An email in the same timeline would look like it affects that
   window. It does not.
3. Different unit. A WhatsApp bubble carries the message body; an email row would
   carry a subject and a status — a log entry dressed as a bubble.

If per-lead email history is ever wanted, it belongs in the lead's detail panel as
a delivery log, not in the conversation.

### Doubts sub-view — keeps its labels

Everywhere else, status maps 1:1 to a message. In `People ▸ Doubts` it does not:
`resend_details` and `doubt_assisstance` can both exist while the guest sits at
the same status. Icons alone could not say which, so that sub-view keeps text
labels.

### Label vocabulary

One name per message, shared across both channels. The lane says which channel; the
label never repeats it.

| Label | Templates behind it |
|---|---|
| Verification code | `otp` |
| Nudge | `cart_abandon` |
| Retry | `payment_failed` |
| Payment success | `advancepaid`, `balance_success`, `single_payment_sucess_dpl`, `advance_success_dpl` |
| Details | `resend_details` |
| Answer | `doubt_assisstance` |

"Payment success" deliberately covers four templates — the guest experienced one
thing. The underlying template name stays available in hover text and the expanded
view for debugging which one actually fired.

---

## 4. Message inventory

### Open event, pay at venue (the model this was designed against)

Live examples: Chill-pill in Himalayas, Founders Meet.

| Message | WhatsApp template | Email | Trigger |
|---|---|---|---|
| Verification code | `otp` | fallback only | Guest starts a booking |
| Nudge | `cart_abandon` | yes | Bill opened, unpaid 1 hr (cron) |
| Retry | `payment_failed` | yes | PayU reports a failure |
| Payment success | `advancepaid` | **none** | Advance captured |
| *(balance at venue)* | **nothing, deliberate** | — | Balance captured at the venue |
| Details | `resend_details` | yes (+ push) | Admin approves a doubt |
| Answer | `doubt_assisstance` | none | Admin answers a doubt >24 hrs later |
| Typed reply | free-form, no template | none | Admin replies inside 24 hrs |

Balance-at-venue sends nothing on purpose: the guest is standing in front of us and
the bill's success screen is the confirmation. See `isPayAtVenue` in
`supabase/functions/payu-callback/index.ts`.

### Other models — same notation, different rows

- **Open event, not pay-at-venue** — `advance_success_dpl` on the advance (see the
  gap in §6), `balance_success` on the online balance.
- **Single-payment events** (`payment_mode='full'`) — `single_payment_sucess_dpl`.
- **Invite-only events** (`booking_url='native-application'`) — adds the approval
  invite (`invitation_with_contact` + invite email) and the re-target details
  resend. No OTP.
- **Community events** (`booking_flow='whatsapp'`) — zero configured, sends nothing
  automated. Out of scope.

---

## 5. Current state

### WhatsApp — complete and correct

**`whatsapp_sends`** — one row per outbound message.

```
id · provider · message_id · to_phone · template_name · variables ·
application_id · sent_at · delivered_at · read_at · failed_at ·
error_code · error_message · send_ok · send_http_status · raw_send ·
body_text · sent_by_email · created_at · updated_at
```

**`whatsapp_inbound`** — customer replies, deliberately a separate table. Treating
an inbound as a send produced stub rows with no `sent_at` that polluted every
delivery-rate query.

**Write path** — RPCs, all `SECURITY DEFINER` behind a shared secret:

- `log_whatsapp_send(p_secret, p_provider, p_message_id, p_to, p_template, p_variables, p_ok, p_http_status, p_raw)`
- `log_whatsapp_status(p_message_id, p_status, p_error_code, p_error_message, p_occurred_at, p_to, p_template, p_provider, p_raw)`
- `log_whatsapp_inbound(...)`

**Callback path** — `chaptera.in/api/wamafy-webhook` (Vercel, `api/wamafy-webhook.js`).
Signature-verified against `x-wamafy-signature`, fails closed with no secret, and
**never returns 500** — Wamafy does not retry, and an event subscription
auto-disables after 15 consecutive failures.

**Senders that log** — all six: `open-event-otp`, `cart-abandonment`,
`payu-callback`, `payu-webhook`, `verify-pending-payments`, `send-aisensy-invite`,
plus `whatsapp-reply` which inserts directly.

### Email — works, but has no log

There is no email log table. Tracking lives as one-off columns on `applications`:

```
email_invite_sent · email_invite_sent_at · email_opened_at ·
email_unsubscribed_at · cart_abandon_email_opened_at ·
resend_details_email_sent_at · resend_details_link_clicked_at ·
payment_failed_email_sent · payment_failed_email_sent_at
```

…and one more on a different table entirely: `bill_opens.cart_abandon_email_sent`.

**These nine columns are not one kind of thing.** Every usage was grepped on
2026-09-01; they split cleanly, and the split decides how each one is retired:

| Column | Kind | Read by |
|---|---|---|
| `email_opened_at` | tracking | UI only |
| `cart_abandon_email_opened_at` | tracking | UI only |
| `resend_details_link_clicked_at` | tracking | UI only |
| `email_unsubscribed_at` | tracking | UI only — **and nothing gates on it** |
| `email_invite_sent` / `_at` | **control flow** | `send-aisensy-invite` one-shot guard |
| `payment_failed_email_sent` / `_at` | **control flow** | claim/release across 3 functions |
| `bill_opens.cart_abandon_email_sent` | **control flow** | `cart-abandonment` one-shot guard |
| `resend_details_email_sent_at` | **control flow** | resend eligibility, admin + edge fn |
| `resend_details_whatsapp_sent_at` | **control flow** | resend eligibility — *WhatsApp, not email* |

The control-flow ones are **send guards, not records**. `payment_failed_email_sent`
uses the same claim-then-release pattern as `claimSendFlag`: a conditional UPDATE
that flips `false → true` and reports whether this caller won, so a PayU callback
and webhook arriving together cannot both email.

> ⚠️ **They cannot be replaced by checking whether a row exists in `email_sends`.**
> The flag is claimed *before* the send, atomically. A log row is written *after*
> it. Swapping one for the other opens a race that does not exist today — on the
> payment path, where the symptom is a duplicate email to a customer whose payment
> just failed. Phase 1 replaces the mechanism instead of the storage.

Consequences:

- **No message ID is stored**, so events are matched back by *email address +
  status + which column is still null*. See `supabase/functions/brevo-webhook/index.ts`
  — the fallback lookup orders by `email_invite_sent_at` and takes `limit(1)`.
- **Every new email type needs new columns.** Six emails, nine columns, two tables.
- **`delivered` is never captured.** The webhook only handles `opened`, `click` and
  `unsubscribed`. Brevo does post delivery and bounce events; we ignore them.
- **Three emails are tracked by nothing at all.** `brevo-webhook` recognises only
  these tags:
  - `INVITE_EMAIL_TAGS` = `chapter-invite-email`, `galcode-invite-email`
  - `CART_ABANDON_EMAIL_TAGS` = `chapter-cart-abandon-email`, `galcode-cart-abandon-email`
  - `RESEND_INVITE_TAGS` = `resend invite`, `resend-invite`

  Anything else returns `null` from `emailKind()` and is discarded. That silently
  drops **`open-event-otp`**, **`chapter-payment-failed-email`** and
  **`open-event-details-email`**.

### The UI being replaced

`secondaryStatusLabels()` at `src/AdminPanel.tsx:4892`. Email-only, blue double
ticks hardcoded to `#34b7f1`, and it produces the "Recovery Mail" line that
started this piece of work. It renders three labels — Recovery Mail / Mail,
Details, Unsubscribed — and has no WhatsApp lane at all.

### What the logs hold today

WhatsApp, since 2026-08-28 (full sent → delivered → read chain proven):

| Template | Sends | Delivered | Read |
|---|---|---|---|
| `otp` | 14 | 8 | 4 |
| `doubt_assisstance` | 6 | 5 | 0 |
| free-form replies | 6 | 3 | 0 |
| `invitation_with_contact` | 4 | 3 | 2 |
| `advancepaid` | 3 | 2 | 1 |
| `cart_abandon` | 3 | 2 | 1 |
| `resend_details` | 2 | 1 | 1 |
| `payment_failed` | 2 | 1 | 1 |

Email, all time: 66 invite emails sent / 27 opened · 25 details emails sent /
**0 clicks recorded**.

> **That zero needs explaining before anyone draws a conclusion from it.** It is
> either a real finding about re-targeting or a broken tracking hookup, and the two
> lead to opposite decisions. Check it in Phase 3.

---

## 5b. Attribution — the bug that shipped, and the rule that replaces it

**`whatsapp_sends` records `to_phone` and, until 2026-09-02, nothing else.** The
`application_id` column existed from the start and nothing ever wrote to it, so
the reader attached every send on a phone to every booking on that phone.

That shipped as a knowing compromise — there is a code comment justifying it by
analogy to inbound replies — and it was wrong. For an inbound reply, "we don't
know which booking they meant" is honest ambiguity. For an outbound send it
manufactures a fact: a test number invited to two events showed the click from
one on the other's row, on the exact signal this feature exists to provide.

**Rule now: attribute by booking, or say nothing.**

- Every sender passes `p_application_id` to `log_whatsapp_send` — the invite, the
  nudge, all three payment functions, and the OTP where a booking already exists.
- The reader matches strictly on `application_id`. Where it is null it falls back
  to the phone **only when that phone has exactly one booking** — the one case
  where phone matching cannot be wrong. Everything else is dropped.
- 30 of 66 historical rows were recovered: 24 on single-booking phones, plus
  invite sends on shared phones matched to `invite_sent_at` within two minutes,
  closest match only. The other 36 show nothing, permanently.

⚠️ **The phone fallback is only safe because `whatsapp_sends` is
`is_admin_strict`.** Only founders can read sends, and founders see every
application, so "this phone has one booking" is a fact rather than a view of one.
If that RLS is ever relaxed so marketers can read sends, the fallback breaks
silently: a marketer seeing 1 of a guest's 3 bookings would treat the phone as
unambiguous and inherit another lead's delivery state. Attribute by
`application_id` or show nothing — never widen the fallback.

**Why nothing beats a guess here.** A lead showing no delivery state is
recoverable: the next send fills it in. A lead showing an engagement that never
happened sends someone into the wrong conversation, and nothing on the screen
tells them it is wrong.

`email_sends` never had this problem — the claim carries `application_id` from
the moment the row is created, which is a second reason the claim-by-INSERT
design was worth it.

## 6. Known gaps this work should close

1. **`advance_success_dpl` has no Wamafy template.** In
   `payu-callback/index.ts` → `fireAdvancePaidWhatsApp`, `wamafyTemplate` is
   `payAtVenue ? 'advancepaid' : null`. A `null` goes straight to AiSensy, which
   returns no message ID — so **every advance payment on a split, non-pay-at-venue
   event is unmeasurable**. Pondy Beach Houseparty is live on that path.
   Fix: get one template approved on Wamafy. Not a code change.

2. **Three email types are tracked by nothing** (tags listed in §5).

3. **Email `delivered` and bounces are never recorded**, so the middle rung of the
   mail ladder has no data behind it.

4. **The AiSensy fallback silently downgrades tracking.** Any send Wamafy rejects
   is taken by AiSensy, which returns no message ID. The guest still gets the
   message; we lose all delivery visibility, with no warning anywhere.

5. **WhatsApp link clicks are not tracked.** Wamafy supports it (§7), but it needs
   template resubmission, so it is deliberately last.

6. **Unsubscribes are recorded and then ignored.** `email_unsubscribed_at` is
   written by the webhook and shown in the UI, but **no send is gated on it** — we
   would keep emailing someone who opted out. An unsubscribe is a fact about a
   *person*, not about a message, so it does not belong in a per-message log
   either. It needs a real suppression check, not a migration.

---

## 7. Phases

Ordered so that each phase is independently shippable and nothing renders before
it has real data behind it. Phases 1–3 are backend and invisible; Phase 4 is the
first thing anyone sees.

### Phase 0 — Decide, no code

- Confirm the label vocabulary in §3 (Verification code / Nudge / Retry / Payment
  success / Details / Answer).
- ~~Confirm the mail colour~~ — settled: `#FE9A00`, taken from the booking form's invalid-number hint.
- **Decided 2026-09-01: the legacy email columns get dropped.** The owner wants a
  clean model to build future customisations on, and nine dead columns across two
  tables is exactly the clutter that makes a table unreadable to the next person.

  This makes **Phase 5 mandatory, not optional** — dropping is only safe because
  the backfill moves the history first. The two are a sequence, not alternatives.
  The four tracking columns are a clean drop; the five control-flow ones need their
  mechanism replaced first (§5), which Phase 1 handles.

### Phase 1 — `email_sends` table + write RPCs

Mirror `whatsapp_sends` exactly, so one component can read both.

```
id · provider ('brevo') · message_id · to_email · kind · subject ·
application_id · sent_at · delivered_at · opened_at · clicked_at ·
failed_at · error_code · error_message · send_ok · send_http_status ·
raw_send · sent_by_email · created_at · updated_at
```

- `kind` is the label from §3 (`nudge`, `retry`, `verification_code`, …) — not the
  Brevo tag and not the subject line. It is what the UI groups by.
- RPCs `log_email_send` and `log_email_status`, `SECURITY DEFINER`, guarded by the
  same `WHATSAPP_LOG_SECRET` pattern. Copy the shape of the existing WhatsApp RPCs.
- RLS: `is_admin_strict()` SELECT only. Revoke INSERT/UPDATE/DELETE **and TRUNCATE**
  from anon + authenticated — TRUNCATE bypasses RLS.
- **Status ranking belongs in the RPC**, not the client — `log_email_status` must
  refuse to move a row backwards (rule 3 in §2).

**The table is also the send guard.** Add:

```sql
unique index on email_sends (application_id, kind)
```

That single index replaces all five control-flow flags in §5, using the same
claim-then-release semantics they have today but without a boolean per email type:

1. **INSERT** the row first, `sent_at` null. A unique violation means another
   caller already claimed this send — return, do not send.
2. **Send** the email.
3. **UPDATE** the row with `message_id`, `sent_at`, `send_ok`.
4. On send failure, **DELETE** the row so a later retry can re-claim.

The insert is the claim, and the unique index provides the atomicity that the
conditional UPDATE provides today. This is the piece that makes dropping the flags
safe — without it, Phase 5 would introduce a duplicate-email race on the payment
path.

Two guards do **not** fit this shape and need handling separately:

- `bill_opens.cart_abandon_email_sent` keys off a `bill_opens` row, not an
  application. Either carry `bill_open_id` on `email_sends`, or keep this one flag.
- `resend_details_whatsapp_sent_at` is WhatsApp, not email. It belongs with the
  WhatsApp side — leave it alone in this phase.

*Ships alone. Nothing reads it yet.*

### Phase 2 — Log every email send

Brevo's `POST /v3/smtp/email` returns a `messageId`. Nothing currently captures it.

Instrument all six senders to use the Phase 1 claim sequence — **INSERT to claim →
send → UPDATE with the message ID → DELETE on failure** — writing the legacy flags
alongside it until Phase 5c retires them:

| Function | Emails |
|---|---|
| `send-brevo-invite` | invite, open-event details, resend details |
| `cart-abandonment` | nudge |
| `payu-callback` | retry |
| `payu-webhook` | retry |
| `verify-pending-payments` | retry |
| `open-event-otp` | verification code |

Logging must be **best-effort and never able to throw** — same discipline as
`logPaidSend`. A logging failure must never fail a booking or a payment
confirmation.

> ⚠️ Three of these functions (`payu-callback`, `payu-webhook`,
> `verify-pending-payments`) send the retry email through near-identical copies of
> the same helper. Update all three. And note the deploy rule: `_shared/*` is
> bundled at **deploy** time, so a shared helper changes nothing live until every
> importer is redeployed. That is why the WhatsApp senders keep three visible
> copies instead of one shared module.

*Ships alone. Data starts accumulating.*

### Phase 3 — Rewrite `brevo-webhook`

1. Write to `email_sends` by `message_id` instead of guessing at `applications` by
   email address.
2. Add the missing event types: `delivered`, `hard_bounce`, `soft_bounce`,
   `blocked`, `spam`.
3. Add the three missing tags so those emails stop being discarded:
   `open-event-otp`, `chapter-payment-failed-email`, `open-event-details-email`.
4. Keep writing the legacy `applications` columns during a transition window, so
   the current UI keeps working while the new one is built.
5. **Investigate the 25-sent / 0-clicks number** while in here. Confirm whether
   Brevo click tracking is even enabled on that sending configuration.

*Ships alone. Both lanes now have real data.*

### Phase 4 — The two-lane component

Replace `secondaryStatusLabels()` at `src/AdminPanel.tsx:4892`.

- A `<DeliveryLanes>` component taking `{ whatsapp, email }`, each a state from §2.
- A shared `deliveryState(row)` resolver used by both lanes — `failed_at` →
  `clicked_at` → `read_at`/`opened_at` → `delivered_at` → `sent_at` → nothing.
- Status → expected-message map, so the row knows which message to surface.
- `title` on every lane, including dash lanes.
- Applies to `People ▸ Call`, `Approval`, `Payments`. **Not** `Chat` (§3).
  `Doubts` keeps text labels.

**The alerting case is the point of the whole exercise:** when status says a
message should exist and no send row does, render the red triangle with "never
sent". Today that renders as blank space and nobody notices.

**Built, and three rules had to be added before it was usable.** A naive
"status expects a message, no row exists → alert" fired on 127 of ~300 leads.
An alert that fires on the majority of rows is worse than no alert, so a gap
only counts when the message was genuinely due:

1. **Only automatic channels can alert.** `waAuto` / `emailAuto` on each status
   entry. Details is an admin pressing a button — 110 of 134 re-target leads
   have never had one sent, and that is normal. The verification *email* is a
   fallback that only fires when the WhatsApp code fails; absent is its usual
   state.
2. **Pay-at-venue `fully_paid` sends nothing, by design.** All three alerts on
   that status were Chill-pill in Himalayas, where the balance is settled in
   person and `isPayAtVenue` deliberately returns before sending. Exempted via
   `payAtVenueSlugs`.
3. **The alert is windowed to 30 days, and the chat lane also has a
   2026-08-28 floor.** WhatsApp logging did not exist before the Wamafy
   migration, so older leads have no rows because none were ever written. More
   generally every message type we add leaves a tail of leads from before it
   existed. A gap from June is not actionable — no cron will retry it and the
   guest is gone. Ticks still render for all history; only the alert is scoped.

After all three: **6 alerts across ~300 leads**, all recent and all genuine —
including one pay-at-venue advance whose `advancepaid` WhatsApp never sent.

### Phase 5 — Backfill, cut over the guards, then drop

**Mandatory** (decided in Phase 0), and four distinct steps. Steps 5c and 5d change
production behaviour and are irreversible — they do not ship together.

**5a · Backfill — DONE.** 117 rows moved: 66 invite, 25 details, 16 nudge,
10 retry. One-off migration copying the legacy columns into `email_sends`
as historical rows. Mark them as reconstructed, not observed — the same honesty
rule as the `field='baseline'` rows in `application_events`. Expect gaps: the old
columns record an *opened* timestamp but never a delivered one, `cart_abandon_email_sent`
is a bare boolean with no timestamp at all, and **no message ID was ever stored**,
so these rows can never receive a late callback or be joined back to Brevo. They
are closed records by construction.

**5b · Verify — DONE.** Exact match on every kind, for both send counts and
engagement counts, with no row missing a timestamp. Reconciliation query proving the new table matches the old
columns before anything is deleted — row counts per kind, and per-column
non-null counts. Today's numbers to reconcile against: 66 invite emails sent /
27 opened, 25 details emails sent / 0 clicks. Do not proceed on a mismatch.

**5c · Cut over the guards.** Move all five control-flow columns to the
insert-claim mechanism from Phase 1, then stop writing the legacy columns
everywhere: `send-aisensy-invite`, `cart-abandonment`, `payu-callback`,
`payu-webhook`, `verify-pending-payments`, `brevo-webhook`, and the resend flow in
`AdminPanel.tsx`. **Run for a real send cycle before 5d** — a broken guard means
duplicate emails to customers, and on the payment path that is the worst possible
place to find out.

**5d · Drop the columns.** Separate migration, separate go-ahead from the owner at
the time. Irreversible on a production database with live customers.

```
applications:  email_invite_sent, email_invite_sent_at, email_opened_at,
               cart_abandon_email_opened_at, resend_details_email_sent_at,
               resend_details_link_clicked_at, payment_failed_email_sent,
               payment_failed_email_sent_at
bill_opens:    cart_abandon_email_sent          (only if 5a carried bill_open_id)
```

**Not dropped:**

- `email_unsubscribed_at` — a person-level fact, not a message-level one, and it
  needs to become a real suppression check first (§6.6). Leave it in place.
- `resend_details_whatsapp_sent_at` — WhatsApp, not email. Out of scope here.

### Phase 6 — Close the `advance_success_dpl` gap

Get the template approved on Wamafy, then set `wamafyTemplate` in
`fireAdvancePaidWhatsApp` for the non-pay-at-venue branch. Removes the last
WhatsApp blind spot. **No code ships until the template is approved.**

### Phase 7 — WhatsApp click tracking

**Wamafy shipped a `clicked` status on 2026-09-02, in direct response to our
questions** (`wamafy-click-tracking-questions.md`). Our side is built and
verified; what remains is template resubmission on their side of Meta.

**How it works.** Meta reports a URL-button tap to nobody — no webhook, no
per-message signal. The only way to count one is for the tap to land on the BSP
first, so a tracked template's button URL is submitted as exactly
`https://api.wamafy.com/r/{{1}}` (Meta requires the `{{1}}` at the END plus a
throwaway example value). At send time the button's `value` then becomes the
**full destination URL** rather than the placeholder tail — the meaning flips,
and only for these buttons. Wamafy mints a one-time token, records the tap
against that recipient, and forwards.

**Live and needing nothing further:**

- `invitation_with_tracking` — approved, two dynamic buttons (Confirm, Contact
  Us), both `/r/{{1}}`. `send-aisensy-invite` sends the full URL for both.
  Bonus: the invite button now carries the `?phone=&name=` deeplink, so it skips
  the identity page and lands on the plan picker. The old static button could not.
- `clicked_at` on `whatsapp_sends`; `log_whatsapp_status` accepts `clicked`,
  `click`, `button_click`, `link_click`, forward-only like every other stamp.
- The chat lane renders the sunburst from it. Verified 2026-09-02 by simulating
  Wamafy's exact payload: `clicked` sets the column, the lane resolves to the
  sunburst, and a repeat callback with an earlier timestamp cannot walk it back.
- The status webhook needs **no new registration** — same URL, same signing
  secret, same `message.status` envelope, with `status: "clicked"`.

**Confirmed behaviours of the click callback:**

- Fires **once per message**, on the first tap. A forwarded link tapped by three
  people is still one callback — deliberate under-reporting over inflation.
- Does **not** replace `delivered` / `read`. Expect `delivered` then `clicked`
  as separate callbacks on the same `messageId`.
- Public-API sends only. Broadcast-campaign clicks stay in their dashboard.

**Three corrections to earlier assumptions — do not rebuild on them:**

1. **`GET /messages` does not exist and never did.** It appears in Wamafy's API
   reference as a recovery path; they confirmed it is a documentation error and
   removed it. There is no polling fallback for click state — `GET /analytics`
   returns sent/delivered/read/failed only, and `GET /contacts/:phone/messages`
   derives status from delivery timestamps. The webhook is the only route.
2. **`campaignName` is NOT required for click collection.** Collection is
   per-message and independent of campaigns; only the old *reporting* was campaign
   scoped. Do not start setting it — it changes nothing about capture, and every
   click since the tracked template went live was already recorded.
3. **A click predating 2026-09-02 will never be pushed.** The 2026-09-01 20:33
   test click is recorded on Wamafy's side (20:34:04.621 UTC) but arrived before
   the feature existed, so that row's `clicked_at` stays null. Not a bug.

**What is left: three templates worth resubmitting.** These four were approved
with the button pointing straight at `https://chaptera.in/invite{{1}}`, so taps
reach us directly and are invisible to the BSP. No click data exists for them and
none can be recovered. Meta treats the URL as part of what it approved, so each
needs a NEW template, not an edit.

| Template | A click would mean | Resubmit? |
|---|---|---|
| `cart_abandon` | went back to the bill — the recovery signal | **yes** |
| `payment_failed` | went to retry paying | **yes** |
| `resend_details` | engaged with the chase; the Details half of Re-Target | **yes** |
| `advancepaid` | opened a receipt after already paying | no |

⚠️ **Each also needs a code change, and it is the dangerous kind.** Those three
currently send the placeholder TAIL (`?phone=…&name=…`); a tracked button needs
the FULL URL. Sending the wrong shape is a 400 and the message does not go out at
all. `send-aisensy-invite` already has the pattern to copy: try the tracked
template with full URLs, fall back to the old template with no buttons on ANY
rejection, so approval and deploy can happen in either order. Extend that to
`cart-abandonment`, `payu-callback`, `payu-webhook` and `verify-pending-payments`
BEFORE resubmitting anything.

**Never convert `otp`.** It carries a `copy_code` button, not a URL, and every
open-event sale is gated on it.

## 8. Files that matter

| Path | Why |
|---|---|
| `src/AdminPanel.tsx:4892` | `secondaryStatusLabels()` — the thing being replaced |
| `src/AdminPanel.tsx:1863` | `loadWhatsAppChats()` — Chat view loader, stays WhatsApp-only |
| `supabase/functions/brevo-webhook/index.ts` | email event ingest, rewritten in Phase 3 |
| `supabase/functions/send-brevo-invite/index.ts` | 3 of the 6 emails |
| `supabase/functions/cart-abandonment/index.ts` | nudge, both channels |
| `supabase/functions/open-event-otp/index.ts` | verification code, both channels |
| `supabase/functions/payu-callback/index.ts` | payment success + retry; `fireAdvancePaidWhatsApp` holds the Phase 6 gap |
| `api/wamafy-webhook.js` | WhatsApp callback ingest — the pattern Phase 3 copies |
| `api/_wamafy.js` | `logSend` / `logStatus` / `logInbound` RPC wrappers |

## 9. Rules to not get wrong

- **Deploy every edge function a change touches.** `_shared/*` bundles at deploy
  time; editing it changes nothing live until each importer is redeployed, and
  nothing warns you.
- **`--no-verify-jwt`** on any function a customer, PayU or a cron reaches.
  `brevo-webhook` is in that list. Deploying it without the flag makes Brevo's
  unauthenticated POST return 401 and delivery tracking stops silently.
- After any deploy, check `list_edge_functions`: `updated_at` must have moved
  **and** `verify_jwt` must still read what it did before.
- **Logging must never be able to fail a booking.** Every log call is wrapped,
  best-effort, and swallows its own errors.
- The DB is production with live customers. Test rows use phone `90000000xx`,
  verified with `RETURNING`, deleted afterwards.
