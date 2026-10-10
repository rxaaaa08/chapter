# People ▸ Chat — the WhatsApp desk

**Single source of truth for the Chat page.** Built 2026-09-01. The BSP
migration that made it possible is documented separately in
`WHATSAPP-BSP-MIGRATION-HANDOFF.md`; that file owns the provider switch, the
templates and the edge functions, this one owns the admin surface.

All of it lives in `src/AdminPanel.tsx`. Nothing else was touched — no edge
function, no migration, no other component.

---

## 1. What it is

A conversation desk inside the admin panel: **People ▸ Chat**, a fifth pill
beside Call · Approval · Payments · Doubts.

Every WhatsApp message the product sends now goes through Wamafy, which webhooks
back delivery, read, failure — and customer replies. This is where all of that
is read and answered. Before it, a reply sat in a database table nobody could
see, and answering meant picking up a personal phone: no record, and the guest
got a message from an unknown number.

**Founder-only, by RLS not by choice.** `whatsapp_inbound` and `whatsapp_sends`
are both `is_admin_strict()` SELECT, so an ops or marketer login reads zero rows.
The pill is hidden from them rather than showing an empty pane. See §8.

---

## 2. Why it is not part of the Call tab

The thread and reply box lived on the Call rows first. They were moved because
**a conversation belongs to a person, while the Call table is one row per
booking.** Someone with two bookings saw the same thread printed twice, with two
reply boxes doing the same thing, inside a page whose job is working a call list.

Grouping the whole People table by phone was the alternative and is the wrong
trade: status, date, marketer, payment state and the Approve button are all
genuinely per booking.

What the Call tab kept is in §6.

---

## 3. Where the data comes from

Two independent fetches, and **both are needed** — this has already caused one
real bug (§9).

| What | Source | Loaded by |
|---|---|---|
| Messages, both directions | `whatsapp_inbound` + `whatsapp_sends` | `loadWhatsAppChats()` |
| Bookings in the header, marketer on the card | `applications` + `call_marketers` | `loadApplications()` |

`loadWhatsAppChats()` is bounded to **60 days** (1,000 inbound / 2,000 sends):
both tables grow forever and a thread stops being useful long before it stops
being stored. It runs from an effect keyed on the sub-view — the same pattern
Team and Growth use — and also when Growth ▸ Analytics is open, which reads the
same rows for its delivery card.

`applications` now loads from an effect on the People tab, **not only from the
tab button's `onClick`**. That click never fires when a remembered tab lands you
on People at page load, which is how Chat could open showing "No booking" for
someone who plainly had two.

---

## 4. The information split

Nothing is printed twice. Each surface answers one question.

- **List card — who this is.** Name, phone, and the marketer's first three
  letters (as the Call tab does, full name on hover). No message preview, no
  timestamp, no search box, no conversation count: the thread is one click away
  and repeats all of it.
- **Header — what they booked.** Every booking on that number, one line each:
  event, date, status. Capped at three with a `+N earlier bookings` line. Reads
  `No booking on this number` rather than sitting blank — someone messaging the
  business number cold is a real signal, not an error.
- **Thread — the messages.**

Two things deliberately cut along the way, both for reading as decoration: a
colour-per-marketer pill, and a green dot marking whoever was waiting on a
reply. **The Chat list therefore does not show which conversations are
unanswered** — that signal lives only on the Call tab (§6).

A "2 bookings" count beside a single event name was also cut. It named one
booking and hid the other, and the two can sit at completely different stages —
one `advance_paid`, one `cart_abandoned` — which is exactly what you need before
replying.

Event and date are derived with the same expressions the Call row uses, so the
two surfaces can never describe the same lead differently.

---

## 5. The thread

### Bubbles

Same white bubble on both sides, with the **side alone carrying the direction**.
The green incoming bubble was doing a job the alignment already did.

**We never store the rendered text of a template message** — only its name and
the values filled into it; the wording lives in Meta. So a bubble is built from
what we actually hold, and the wording is never invented:

| Message | Bubble shows |
|---|---|
| Free-form staff reply | the real text (`body_text`) |
| `doubt_assisstance` | `Re: <their question>` then our answer — `{{1}}`/`{{2}}` are known exactly |
| `otp` | `<code> is your verification code.` — the one body captured verbatim during the trial |
| Any other template | its plain-English name, plus the real values sent |

A template a **person** sent is not labelled "automatic" — `doubt_assisstance`
carries their words. Button taps and photos show as what they are
(`tapped "Join Groupchat"`, `sent image`) rather than an empty bubble.

**The gap, deferred 2026-09-01:** the live senders do not log `variables` at all,
so a real `otp` or `advancepaid` fired by `payu-callback` shows only its name —
no code, no amount, and **no event**. Fix and its trap are in §10.

### Status ticks

WhatsApp's own vocabulary: **one grey tick sent, two grey delivered, two blue
read.** The exact time is in the tooltip — the bubble already carries a
timestamp, and printing a second one beside it read as a duplicate.

A message that never reached anyone gets words, not a tick of any colour:

- `send_ok = false` → `Never sent — <the provider's own reason>`
- no `sent_at` at all → `Never sent — no send was recorded` (a half-written row)
- `failed_at` → `Failed at WhatsApp — <code + reason>`

**A refused send and a failed delivery are different things stored in different
places.** `error_code` / `error_message` are written by the delivery webhook,
which never fires for a send the provider rejected outright — those rows carry
their reason only inside `raw_send.error.message`. About a third of the rows are
refusals, so getting this wrong would badly flatter the numbers.

> The meta row is a **flex row, not inline text**. The ticks are an SVG, and
> inline layout wrapped them onto their own line under the bubble.

### Date pills

The day is stated once, on a centred pill between groups — `Today`, `Yesterday`,
then `28 August`, with the year added only for older years. Each bubble carries
only a time. Pills scroll with the thread rather than pinning, so they leave the
screen as you read past that day.

Day boundaries are **IST**. A message logged at `18:34 UTC` belongs under the
next day's pill — that is correct, it is 12:04 am here.

### Opening position

A thread opens at its **newest** message, via `useLayoutEffect` so it lands
before paint instead of visibly jumping. Landing at the top of a long history
meant scrolling past weeks of it to reach the one you came to answer.

---

## 6. What the Call tab kept

**The newest message only**, one line, no thread and no reply box — and only
**while it is still unanswered**. Once someone replies from Chat, the green card
and the row tint both disappear, because there is nothing left to act on.

**"Answered" means answered by a person** — a free-form reply or a
`doubt_assisstance` answer. An automatic send does not count: an OTP going out
because someone started a booking answers nothing they asked, and letting it
clear the flag would bury a real question.

The free-form half of that check is its own query in `loadApplications`, the
exact complement (`template_name is null`) of the template-only `whatsapp_sends`
fetch beside it — together they cover every send with no overlap. **Do not merge
them**: the other query is template-only on purpose, for a different feature.

The `↩ n` reply-count badge was removed. It counted every message ever, so it
stayed lit on rows already answered — contradicting the card beside it.

---

## 7. The composer

**One box, always visible.** The 24-hour window decides the *transport*, not
whether you can type. Inside it the text goes as a free-form message; outside it
as the `doubt_assisstance` template quoting their question.

- `whatsapp-reply` with `action: 'window'` runs **when a thread is opened**, not
  behind a button — the answer must be known before anyone finishes typing.
- Window shut → an amber strip says so, and the quoted question appears above the
  box, prefilled from their latest inbound message and **editable**: the last
  thing someone said is often not the thing they asked. Send stays disabled until
  there is a question to quote.
- The window can close **between** the check and the send. That returns `409` and
  is reported as the window closing, not a failure — "failed" would send someone
  hunting for a fault that is not there. The typed text is **carried into the
  template box** rather than dropped when the composer switches mode.
- `doubt_assisstance` is **MARKETING category and staying that way** (Meta
  reclassifies anything not strictly transactional). A guest who opted out of
  marketing will not receive it — stated above the Send button, because that is
  worth knowing before you press it, not after. It is not silent: the send is
  logged and a suppression comes back as a failed status.
- Enter sends, Shift+Enter breaks the line.

**Field and Send share one outline**, so it reads as a single control rather than
a box beside a button. Two consequences:

- The border is on the **wrapper**, so focus is tracked in state — a border on
  the textarea would draw a second box inside the first.
- The field **grows** with the message up to 110px instead of showing a resize
  handle, which would break the joined shape.

Searching the list **finds** a conversation; it does not close the one you are
reading. (The search box itself was later removed, but selection is still
validated against every thread rather than a filtered subset, which keeps it in
step with the window check.)

---

## 8. Access

| Table | Policy |
|---|---|
| `whatsapp_inbound` | `is_admin_strict()` SELECT |
| `whatsapp_sends` | `is_admin_strict()` SELECT |

Ops and marketers read **zero rows**, so the Chat pill is hidden from them and
the Call row's message line is empty for them too.

**A marketer cannot see their own conversations — deferred by the owner
2026-09-01.** The marketer name on the list card is built and correct, but until
an RLS policy lets a marketer read rows for phones on their own assigned leads,
it only helps the founder see who owns a conversation. Scope it to "phones on
leads where `assigned_marketer_id` is me"; it is a production DB change with a
real security surface, so it wants deliberate review, not a quick patch.

---

## 9. Layout traps — all three cost real time

The list and the thread are **one surface, not two cards**. The selected row
turns the same white as the thread pane and is drawn one pixel wider than the
sidebar so it covers the divider: the selection is not a marker at all, it is the
list opening into the thread.

1. **The columns must never wrap.** At 583px a `1 1 250px` sidebar plus a
   `3 1 380px` thread wrapped, and the divider stopped halfway down. The sidebar
   is now a fixed `0 0 236px` and the thread `1 1 auto` with `min-width: 0`.
2. **Widen the selected row, do not pull it.** `marginRight: -1` on an element
   with `width: 100%` shifts it instead of stretching it, leaving a 1px seam
   against the divider. It is `width: calc(100% + 1px)`.
3. **The sidebar must sit visibly back.** At `#fafafa` against a white row the
   selection was invisible. It is `#efefec` with an `#e2e2dd` divider.

Both 1 and 2 looked fine in a screenshot and were only caught by measuring
`getBoundingClientRect()` in the browser.

---

## 10. Known limits and deferred work

- **Which event an automatic message was about — BUILT 2026-09-02, partially.**
  A payment confirmation used to read "Advance paid — confirmation" with no plan
  name, which for someone with two bookings said nothing. The bubble now carries
  the plan name, resolved through `whatsapp_sends.application_id`.

  > **This section was wrong between 2026-09-01 and 2026-09-02 and sent a reader
  > toward a three-function deploy that was not needed.** It claimed
  > `log_whatsapp_send` had no `p_application_id` parameter and that the column
  > was NULL on every row. Both were false by the time it was read: the parallel
  > delivery-logging work (`DELIVERY-LOGGING-HANDOFF.md`, phases 1–4 and 5a–5b)
  > had already added a 10-argument overload of the RPC — `DEFAULT NULL`, so the
  > 9-argument callers still resolve — and had already deployed the senders that
  > pass it. **Check the DB before believing a "not built" note in this file.**

  What shipped is therefore **client-only**: no migration, no edge-function
  deploy. `loadWhatsAppChats` selects `application_id`, an `eventByAppId` map is
  built from every loaded application, and the thread renders the plan name
  above the bubble text.

  Two deliberate constraints, both load-bearing:

  - **Only when the number has more than one booking.** With a single booking the
    header already names it, and repeating it on every bubble is the "said twice"
    problem this page exists to avoid.
  - **The map is built from ALL loaded applications, never the filtered table
    view.** Scoping it to the current event/date filter would blank the label on
    exactly the threads a filter is hiding.

  **Still unstamped at the source, so still blank:** `balance_success`,
  `advance_success_dpl`, `single_payment_sucess_dpl`, `balance_paid_dpl` and
  `doubt_assisstance`. Stamping is per-code-path, not a clean date cutover —
  `advancepaid`, `cart_abandon`, `otp`, `payment_failed` and both `invitation_*`
  templates appear in *both* states over the same days. Closing that gap is edge
  function work and must not be started until the uncommitted changes sitting in
  `payu-callback`, `payu-webhook` and `verify-pending-payments` are committed,
  so there is a rollback point — and all three are `verify_jwt: false`, so any
  deploy of them **must** pass `--no-verify-jwt` or PayU's unauthenticated POST
  starts returning 401 and payments stop.

  The 36 rows sent before stamping began stay blank; no backfill was attempted.
- **Nobody is notified when a customer replies.** You have to open the page and
  look. `send-admin-push` already routes role-scoped pushes and could be
  triggered from the inbound webhook.
- **Replies to the old AiSensy number are invisible** — nothing ever recorded
  those. Capture them, or retire the number so there is one inbox.
- **The Chat list does not mark unanswered conversations** (§4).

---

## 11. How to verify without logging in

The admin panel sits behind Google login and **cannot be driven in the preview
pane**. Three things worked instead, and are worth reusing:

1. `npx tsc --noEmit` and `npm run build` — the standing gate.
2. **A Node harness over real prod rows.** Mirror the pure logic (thread merging,
   ordering, day grouping, the send-state rules) in a scratch `.mjs` and run it
   against rows pulled with the Supabase MCP. This caught the refused-send
   mislabelling and the stub-row case before either shipped.
3. **A static HTML replica** of the layout, served from the dev server and
   measured with `getBoundingClientRect()`. This caught both layout traps in §9.

> If you copy a replica into `public/` to serve it, **delete it afterwards** —
> `public/` is copied into `dist/` and would ship to the live site.

---

## 12. Concurrent editing — read this before touching `AdminPanel.tsx`

This work was built alongside a parallel session that owned the edge functions
and, later, parts of `loadApplications` (it added a template-only
`whatsapp_sends` fetch and an `email_sends` delivery lane). Nothing was
overwritten in either direction, because every edit was an **exact-match
replace that fails loudly** rather than a rewrite of a region.

Two agents editing this 6,600-line file concurrently have overwritten each
other's work here before. The tell is a change you made and verified being
absent minutes later.
