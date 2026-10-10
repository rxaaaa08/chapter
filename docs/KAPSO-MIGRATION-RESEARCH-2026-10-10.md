# Moving WhatsApp from Wamafy to Kapso — research and readiness check

**Written 2026-10-10.** Research only. Nothing was built, changed, deployed or
sent. The owner asked: Wamafy costs about ₹1,500 a month, Kapso offers 2,000
free messages a month, can we move and are we ready to?

Companion documents: `WHATSAPP-BSP-MIGRATION-HANDOFF.md` (how the AiSensy →
Wamafy move was done), `whatsapp-bsp-integration-spec.md` (what a provider must
do for us), `DELIVERY-LOGGING-HANDOFF.md` (the ticks in People ▸ Call).

---

## 1. Verdict

**Kapso can do the job, and the 2,000-message limit is not a problem. But we are
not in a position to move today.** The blockers are about who owns the number
and who pays Meta, not about our code.

| Question | Answer |
|---|---|
| Can Kapso send everything we send? | Yes, with two small gaps (§5) |
| Is 2,000 messages a month enough? | Yes. We used about 105 in September, both directions counted |
| Is "free" really free? | The platform is. Meta's own per-message fee is separate, roughly ₹20 a month at our volume (§4) |
| Can we pay Meta ourselves? | **Yes, by UPI.** Confirmed on our own account the same day (§8). This removes the reason Wamafy owns the live account |
| Can the live number move as it is? | **Not by us.** It sits in a WhatsApp account owned by another company (§2) |
| Do our approved templates come along? | **No.** They belong to that same account (§2, §3) |
| Is the code ready? | No, but it is the easy part: about the same work as the AiSensy → Wamafy move (§6) |

The saving is real: about ₹1,500 a month, ₹18,000 a year.

---

## 2. The finding that decides everything: the live number is not in our account

Checked in Meta Business Settings (Chapter அ portfolio ▸ Accounts ▸ Messaging
accounts) on 2026-10-10. There are three WhatsApp accounts, not two:

| Account | ID | Owned by | Number | Partner | Meta fees paid by |
|---|---|---|---|---|---|
| **ChapterA** | `2914653868871973` | **Sportia** | **+91 82208 88650** — Connected, quality High, display name **"Rejected"** | — | not visible to us |
| Join Chapter | `1438759947539827` | Chapter அ | +91 99401 11564 — Connected, quality High | AiSensy, full control | **AiSensy's credit line, still attached** |
| chapter அ | `4078982675734130` | Chapter அ | +1 555-460-4269 — Pending (a Meta placeholder number) | Sportia, full control | no payment method, no currency |

The number every customer now talks to, **+91 82208 88650**, lives in the
account called "ChapterA", and that account is **owned by Sportia**. Sportia
looks like the name Wamafy's company uses on Meta; that is inferred from it
owning the account the Wamafy number sits in and being the partner on our third
account, and the owner can confirm it. Its business name and its business
verification are Sportia's, not ours. We can see it only because they shared it
with us.

This is exactly the arrangement `whatsapp-bsp-integration-spec.md` §8.1 warned
against before the Wamafy move ("ask to keep owning the WABA"). The earlier
notes said the new number was "hosted by Wamafy"; nobody had recorded that the
account itself is theirs.

What follows from it:

1. **Only Wamafy can release the number.** Removing a number from an account,
   and switching off its two-step PIN, can only be done by the account's owner.
2. **Every template we use today stays behind.** Templates belong to the
   account, not to the number or to us (§3).
3. **Meta's "keep everything" transfer probably does not apply.** Meta has a
   number-migration route that keeps the quality rating and copies approved
   templates, but provider guides (respond.io, Verloop) say both accounts must
   belong to the same business. Ours would go from Sportia's business to ours.
   This was read from provider guides, not from Meta's own page, which could not
   be opened. Treat it as likely, not certain.
4. **Kapso's own migration guide is delete-and-re-register.** Remove the number
   from the old account (it stops sending at that moment), sign up through
   Kapso, recreate the templates, wait for Meta to approve them. Their guide
   says to budget for downtime.
5. **Re-registering needs the SIM.** Meta sends an SMS or voice code to the
   number. **We have no record of who holds the SIM for +91 82208 88650.** If
   Wamafy supplied the number, it may not be ours to take at all.

Two smaller things seen on the same screen:

- The display name "chapter அ" on the live number shows **Rejected** with a
  warning mark. The number is Connected and rated High, so sends are working,
  but it is worth asking Wamafy about regardless of any move.
- The third account, "chapter அ", holds a `+1 555…` number stuck on Pending.
  Kapso's docs describe this exactly: it is what Meta creates when the
  "display name with a virtual number" option is picked during signup. It is a
  stub. It has never had a payment method, which makes it a possible clean
  destination later.

---

## 3. What we have set up on Wamafy today

### 3.1 Templates in use

Sends counted from `whatsapp_sends` for September 2026 (the last full month).

| Template | Type | Fills in | Buttons | Sent when | Sept |
|---|---|---|---|---|---|
| `otp` | Authentication | the 6-digit code | copy-code | someone starts an open-event booking (`open-event-otp`) | 28 |
| `advancepaid` | utility | amount | 2 links | advance paid on a pay-at-venue event (`payu-callback`, `payu-webhook`, `verify-pending-payments`) | 17 |
| free-form text | service | — | — | a founder replies from People ▸ Chat inside 24 hours (`whatsapp-reply`) | 9 |
| `doubt_assisstance` | Marketing | their question, our answer | 1 link | a founder replies after the 24 hours have passed (`whatsapp-reply`) | 6 |
| `invitation_with_contact` | Marketing | event, date | fixed | invite approved, fallback version (`send-aisensy-invite`) | 5 |
| `cart_abandon` | — | name, event, date | 1 link | 30-minute abandoned-cart job (`cart-abandonment`) | 4 |
| `invitation_with_tracking` | Marketing | event, date | 2 links through `api.wamafy.com/r/…` | invite approved, tap-tracked version (`send-aisensy-invite`) | 2 |
| `balance_success` | Utility | amount, details date | 2 links | balance paid on a regular split event (the three payment functions) | 2 |
| `single_payment_sucess_dpl` | — | amount, details date | 2 links | single full payment (the three payment functions) | 2 |
| `payment_failed` | — | name, amount | 2 links | payment failed (the three payment functions) | 2 |
| `resend_details` | — | name, event | 2 links | details sent or re-sent from the admin panel (`send-aisensy-invite`) | 0 (2 in Aug) |

"—" under Type means the category was never written down; read it off the
Wamafy dashboard before recreating anything, because the category decides the
Meta price and whether marketing opt-outs block it.

**Ten templates would have to be recreated and approved** on whichever account
the number lands in. One cannot be recreated as it is: `invitation_with_tracking`
has Wamafy's own address baked into its buttons.

Still on AiSensy, on the old number: the advance confirmation for a **regular**
split event (`advance_success_dpl`). The Wamafy `advancepaid` template lacks the
due date and transaction id, so the code deliberately sends that one case
through AiSensy. Last used 2 September 2026. All six senders also still carry
AiSensy as an automatic fallback.

### 3.2 Volume

| Month | We sent | Customers sent | Total |
|---|---|---|---|
| August 2026 (from the 28th) | 26 | — | 26 |
| September 2026 | 81 | 24 | 105 |
| October 2026 (to the 10th) | 3 | 2 | 5 |

Kapso counts both directions toward the 2,000. We are at about 5% of it.

### 3.3 Everything else that depends on Wamafy

| Piece | Where | What it does |
|---|---|---|
| Delivery receipts | `api/wamafy-webhook.js` on Vercel → `log_whatsapp_status` | the ✓ / ✓✓ / read / failed marks in People ▸ Call and Chat |
| Customer replies | same route → `log_whatsapp_inbound` | fills People ▸ Chat |
| Tap tracking | Wamafy's `/r/` redirect + its `clicked` status | the "clicked" mark, invites only |
| 24-hour window check | `GET /window` in `whatsapp-reply` | decides free-form reply vs template |
| Free-form reply | `POST /messages/text` in `whatsapp-reply` | the reply box in People ▸ Chat |
| Secrets | `WAMAFY_API_KEY` (Supabase), `WAMAFY_STATUS_WEBHOOK_SECRET` + `WAMAFY_WEBHOOK_SECRET` (Vercel) | |
| The number itself | `BUSINESS_WHATSAPP_E164` in `src/whatsappLinks.ts` | every "message us on WhatsApp" link on the site |
| Wording | `AdminPanel.tsx`, `journeyMapSeeds.ts`, `CLAUDE.md` | name Wamafy in copy and comments |
| Database | `whatsapp_sends.provider = 'wamafy'`; the three `log_whatsapp_*` functions mention `wamafy` in their bodies | no constraint blocks a new provider name; the function bodies need a read before reuse |

---

## 4. What Kapso offers and what it costs

Source: Kapso's pricing page and docs, read 2026-10-10.

| | Free | Pro |
|---|---|---|
| Price | $0 | $25 a month |
| Messages a month | 2,000 | 100,000 |
| Numbers | 1 | 3 |
| Also included | team inbox, sandbox test number, $2 of credits | same |

- **Both directions count** toward the 2,000: everything we send and everything
  customers send. Read receipts do not.
- **What happens past 2,000 is not stated anywhere.** Not a concern at our
  volume; ask before relying on it at scale.
- **Meta's fee is separate from Kapso's plan.** Meta charges per delivered
  message whichever provider is used. India rates per secondary reports of
  Meta's card: ₹0.115 for authentication and utility, ₹0.8631 for marketing,
  before GST. Our September mix works out to roughly ₹20.
- **Two ways to pay Meta on Kapso:**
  - *Kapso credits.* Kapso pays Meta and deducts from a prepaid balance held in
    US dollars. Accounts billed in another currency carry a 5% exchange margin.
    Kapso enables non-dollar currencies one at a time and **does not say whether
    rupee accounts are enabled**; if not, the option is refused.
  - *Our own card on Meta.* Indian cards often fail on Meta's automatic billing
    because of the RBI recurring-payment rules; the card needs e-mandates
    switched on.
- **An account that has ever used a provider's credit line cannot switch to a
  card.** Kapso's docs say Meta does not allow it even after the credit line is
  removed. That rules out paying by card on "Join Chapter" (AiSensy's credit
  line) and on anything Wamafy has funded.
- **Replies inside 24 hours are no longer free.** Since 1 October 2026 Meta
  bills them at the utility rate, with 1,000 free per number per month. This is
  Meta's change and applies on Wamafy too. We sent 9 in September.
- **The company.** Chilean startup, about $1.4M seed funding per Dealroom, with
  self-reported growth figures. No status page, uptime history or service
  guarantee was found. The free plan is a startup's choice and can change.
- **Why that risk is tolerable.** Kapso's sending API is Meta's own format with
  a different address in front. Code written for Kapso would work against Meta
  directly with a changed address and key, so building for Kapso does not lock
  us in the way the Wamafy and AiSensy formats did.

---

## 5. Feature match

| We use today | On Kapso | Gap? |
|---|---|---|
| Send a template by name with values and link buttons | Yes, in Meta's format; the template's language must be named on each send | none |
| OTP template with copy-code button | Yes | test first: Kapso's docs show a button type of `otp`, Meta's own format differs, and we have hit an OTP-button bug before (`WAMAFY-BUG-otp-authentication-button.md`) |
| A message id back on every send | Yes | none |
| Delivered / read / failed receipts with a reason | Yes | none; better than now, Kapso retries a failed delivery twice and Wamafy never retries |
| Customer replies pushed to us | Yes | none |
| Free-form reply inside 24 hours | Yes | none |
| "Is the 24-hour window open?" check | No direct check | small: work it out from our own `whatsapp_inbound` table |
| Tap tracking on invite buttons | **No** | we lose the "clicked" mark unless we build our own redirect link, which is small and would then work with any provider |
| Template creation and approval | Yes, dashboard and API | none |
| Rate limit | 100 requests a minute on Free | none; Wamafy is 60 |

---

## 6. Our side of the work, when the time comes

Same playbook as the AiSensy → Wamafy move, which is why it is the easy part.

1. Seven functions change their provider call: `open-event-otp`,
   `cart-abandonment`, `payu-callback`, `payu-webhook`,
   `verify-pending-payments`, `send-aisensy-invite`, `whatsapp-reply`.
2. A new receiver for Kapso's receipts and replies, feeding the same three
   `log_whatsapp_*` functions. Kapso's layout differs from Wamafy's.
3. The window check moves to our own table.
4. Tap tracking: build our own redirect or drop the mark.
5. Wording in the admin panel, the Build-tab map seeds and `CLAUDE.md`.

Rules carried over from last time, all still binding:

- **Kapso first, Wamafy as the automatic fallback**, never a straight swap. Edge
  functions cannot be rolled back.
- **`otp` moves last and alone.** It gates every open-event sale.
- **The three payment functions move together**, or one payment gets announced
  from two numbers.
- **Deploy flags per `CLAUDE.md` rule 3.** `send-aisensy-invite` and
  `whatsapp-reply` deploy without `--no-verify-jwt`; the other five with it.
- **Do not rename the `aisensy_*` columns.** They are the duplicate-send guards.
- A **parallel run needs a second number**, because one number can sit with only
  one provider at a time.

---

## 7. Questions that must be answered first

### To Wamafy (the owner works there)

1. Is there a staff or free plan for the chapter அ workspace? If yes, the saving
   is achieved with no move at all.
2. The account holding +91 82208 88650 ("ChapterA", `2914653868871973`) is owned
   by Sportia. Will you release the number: remove it from that account and
   switch off its two-step PIN?
3. Who holds the SIM for that number? Can it receive an SMS or a call?
4. Can ownership of the account be transferred to the Chapter அ portfolio
   instead, so the templates and rating stay with the number?
5. Why does the display name on that number show "Rejected"?
6. What category is each of our templates filed under?

### To Kapso support

1. Do Kapso credits work for a WhatsApp account billed in Indian rupees?
2. Does your signup support Meta's number migration from an account owned by a
   different business (keeps the rating, copies approved templates), or only
   remove-and-re-register?
3. What happens when a Free project passes 2,000 messages?
4. Is anything different for Indian numbers on the bring-your-own-SIM path?
5. For an authentication template, is the button type on a send `otp` or `url`?

### For the owner

1. Is AiSensy still being paid? It still has full control of, and the only
   payment method on, the one sending account we actually own. If it is still
   billed, that is a second ₹1,500 a month.
2. Is any regular (non pay-at-venue) split event on sale or planned? That is the
   one message still routed through AiSensy.

---

## 8. Follow-up, same day: can Meta be paid by UPI for WhatsApp messages?

The owner explained why Sportia owns the live account: his card would not go
through on Meta, so Wamafy put the number in their own account, pay Meta from
their card, and he tops up a wallet inside Wamafy. His idea: if Meta now takes
UPI for WhatsApp the way it does for ads, he can own the account himself, pay
Meta by UPI, and use Kapso's free plan on top.

### What was found

| Source | What it says | Weight |
|---|---|---|
| Meta's own WhatsApp Business FAQ, billing question | "For businesses in India, Meta is introducing UPI (Unified Payments Interface) as a pre-payment method." No date given. | official, but worded as "is introducing" |
| Happilee (an Indian provider), article dated 2026-10-01 | First-hand account: WhatsApp Manager ▸ Billing Hub ▸ **Add funds**, pick an amount, pay a UPI QR code (PhonePe, Google Pay, Paytm, BHIM). Top-ups as low as ₹40. Some accounts are asked for a GST number first. | third party, but describes actually doing it |
| Zaptilo guide (2026) | Lists UPI among India payment methods and says Meta added it "recently" | third party |
| Meta developer pricing pages | Since 1 October 2026 every account needs a payment method in Billing Hub or replies beyond the free 1,000 stop | official; explains why Meta added an option Indian businesses can actually use |

**Reading:** a prepaid balance topped up by UPI, the same idea as Meta ads
prepaid funds, very likely exists for WhatsApp in India now. It is **not
confirmed on our own account**: Billing Hub asked for the owner's passkey and
that step is his.

### The check only the owner can do (about two minutes)

Meta Business Settings ▸ Accounts ▸ Messaging accounts ▸ **chapter அ** (the one
with the +1 555 number) ▸ **Payment settings** ▸ pass the passkey prompt ▸ look
for **Add funds** or **UPI** under add payment method. Looking is enough;
nothing needs to be paid. While there, open **Join Chapter** the same way and
note whether adding a payment method is offered or greyed out.

**Update, later the same day:** the owner deleted the +1 555 placeholder number.
Re-checked in Business Settings: the **chapter அ** account itself
(`4078982675734130`) is still there, owned by us, Verified, Approved, now with
no number and still no payment method, and its Payment settings button is still
present. So the check above still works on it and no new account is needed for
it. Join Chapter (+91 99401 11564) and ChapterA (+91 82208 88650) were both
still Connected with quality High.

**CONFIRMED on our own account, 2026-10-10 (owner's screenshot).** Meta's "Add
payment information" dialog for a WhatsApp Business account in the Chapter அ
portfolio offers two choices: **Debit or credit card** (Visa, Mastercard) and
**UPI** (UPI, Google Pay, PhonePe, Paytm). Two details on that screen matter:

- **"Business and tax info: Optional – Add a tax ID or address."** A GST number
  is not required to proceed, so that worry is closed.
- **"This becomes your payment method for this WhatsApp Business account. To
  change it later, you can contact WhatsApp support."** The choice is sticky.
  Pick it once, on the account that will really hold the number.

Not yet seen: what comes after Next on UPI (expected: choose an amount and pay a
QR code, per Meta's "pre-payment" wording), the minimum top-up, and what Join
Chapter's payment screen offers.

### What it changes

If UPI is offered, the Kapso credits question (rupee support, 5% margin) and the
Indian-card problem both disappear, and the plan becomes: an account we own,
funded by UPI, with Kapso's free plan in front.

### What it does not change

1. **Templates still do not travel.** A new account means all ten are recreated
   and approved by Meta before anything is switched.
2. **"Join Chapter" probably cannot take UPI.** It carries AiSensy's credit
   line, and Kapso's docs say Meta does not let such an account switch to its
   own payment method. The old number would have to be moved out of it into a
   fresh account. We own "Join Chapter", so we can do that without asking
   AiSensy.
3. **A GST number may be required** before the balance accepts money. Not known
   whether chapter அ has one.
4. **A prepaid balance can run out**, and then templates stop, OTP included. At
   about ₹20 a month a small top-up lasts a long time, but it needs watching.

### The order that avoids any downtime

The owner's first thought was to have Wamafy delete their account, then rebuild.
That order takes the live number dark, OTP included, until Meta approves new
templates. The safer order uses the **old number** for the build:

1. Confirm UPI is offered (the check above).
2. Through Kapso's signup, create a **new account in the Chapter அ portfolio**
   and move **+91 99401 11564** into it. Needs that number's SIM for the code.
   Avoid Meta's "display name with a virtual number" option; that is how the
   +1 555 stub was made.
3. Add funds by UPI. Recreate the ten templates. Wait for approval.
4. Switch the senders one at a time, Kapso first with Wamafy as fallback, `otp`
   last (§6).
5. Point the site's WhatsApp links back at the old number
   (`BUSINESS_WHATSAPP_E164`).
6. **Only then** ask Wamafy to delete the ChapterA account.

Cost of step 2: the AiSensy fallback and the one message still routed through
AiSensy (regular split-event advance) stop working the moment the old number
leaves "Join Chapter". That message needs its template in the new account
first. It also means AiSensy can be cancelled if it is still being paid.

Not chosen: moving +91 82208 88650 instead. It depends on Wamafy releasing it
and on who holds its SIM, and it cannot be run in parallel with itself.

---

## 9. Owner's decision, same day: move the LIVE number, and consider no provider at all

The owner ruled out §8's "build on the old number" order. He wants **+91 82208
88650**, the number on the website, moved into an account he owns, and asked
whether to use Kapso or call Meta's Cloud API directly from our own code. His
first idea for the move was: Wamafy deletes the number, then we create a new
account and add it.

### 9.1 "Delete first" is blocked by Meta

From Meta's own phone-numbers documentation: a number **cannot be deleted if it
sent a paid message in the last 30 days**; WhatsApp Manager shows the date of
the last paid message and allows deletion 30 days after it. Only an admin of the
owning portfolio can delete, and it cannot be done by API.

The live number sends paid templates every week (OTP alone was 28 in September).
Deleting it would mean 30 days of sending nothing from it first. Kapso's
migration guide is this same delete-and-re-register route, so it hits the same
wall.

### 9.2 The route that works: Meta's number migration

Meta documents moving a number from one account to another **without deleting
it** ("Migrate numbers among partners programmatically"). Meta says it is open
to solution partners **and businesses directly integrated with the platform**,
and is always started by the owner of the destination account.

What is kept: display name, the number's quality rating, messaging limits, and
approved templates rated High quality (copied and auto-approved in the new
account). Template quality ratings themselves restart. Message history is not
mentioned as moving; ours lives in our own tables anyway.

What Meta requires, and where we stand:

| Requirement | Status on 2026-10-10 |
|---|---|
| Source account verified and approved | ✅ ChapterA shows Verified, Approved |
| Destination account verified and approved | ✅ chapter அ (`4078982675734130`) shows Verified, Approved |
| Payment method on the destination | ⬜ UPI is offered; not yet added (owner) |
| An app subscribed to the destination's webhooks | ⬜ our own Meta app, to be set up |
| Display name status APPROVED, no pending change | ⚠️ **shows "Rejected" on the Wamafy account.** Must be understood and fixed first (Wamafy) |
| Two-step PIN switched off on the number | ⬜ only the source owner can do it (Wamafy) |
| The number can receive an SMS or call | ❓ who holds the SIM is still not recorded |

The steps are four calls made from the destination side: start the migration,
request a code by SMS or voice, verify the code, register the number with a new
PIN. Meta says registration is instant. Nothing has to be deleted beforehand.

**Not certain:** whether Meta accepts the move when the source account is owned
by a different business (Sportia). Meta's documents do not state a
same-business rule; several provider guides say there is one. Because ChapterA
is shared into our portfolio, it may be set up "on behalf of" Chapter அ, which
would satisfy it. This will only be known by attempting it.

**Templates: recreate all ten in the destination beforehand regardless.** Only
templates rated High copy across, and ours are low-volume, so many will be
"quality pending" and will not copy. Existing destination templates are not
disturbed by the migration.

### 9.3 Kapso or direct: recommendation is direct

Calling Meta's Cloud API directly costs nothing; only Meta's per-message fee is
paid, by UPI. Recommended over Kapso because:

1. **Meta's migration route is documented for a directly integrated business.**
   Kapso's guides only describe delete-and-re-register, which §9.1 rules out.
2. **We already built what Kapso sells**: the inbox (People ▸ Chat), delivery
   ticks, send logging.
3. **It ends the provider-hopping.** AiSensy, then Wamafy, then Kapso would be
   the third company standing between us and the OTP that gates every sale.
4. **The code is the same shape either way**, since Kapso's API is Meta's format
   behind another address.

What direct needs that a provider would have done for us: our own Meta app with
WhatsApp added, a long-lived access token, the app subscribed to the account,
and a receiver for Meta's webhooks. One-time setup. Still to build ourselves
either way: tap tracking and the 24-hour-window check (§5).

### 9.4 Order of work (nothing started)

1. Owner: add UPI to the destination account; confirm the SIM.
2. Wamafy: explain and fix the "Rejected" display name; confirm they will switch
   off the two-step PIN when asked.
3. Us: Meta app, token, webhook receiver; recreate the ten templates in the
   destination and wait for approval.
4. Us: new sending path in the seven functions, direct first with Wamafy as the
   fallback, deployed but dormant until the number moves.
5. Quiet hour: Wamafy switches off the PIN, we run the four migration calls.
6. Watch real bookings, then remove the Wamafy and AiSensy branches.

### 9.5 Owner's answers, later the same day

- **He holds the SIM for +91 82208 88650.** That requirement is met.
- **He prefers the number "used freshly with an account under our ownership".**
  Read as: a brand-new account in the Chapter அ portfolio, not the empty one
  that had Sportia attached. That fits either route and is the cleaner
  destination: India and rupees chosen at creation, UPI as the payment method,
  no provider attached.

How the number gets into that new account is still one of two ways, and they
end in the same place (number in our account, no provider, Wamafy has no
access):

| | Meta's migration | Fresh registration |
|---|---|---|
| Needs the number deleted from Wamafy's account first | No | Yes |
| Wait before it can start | None | 30 days after the number's last paid message (§9.1) |
| Rating, limits, display name | Kept | Start again; display name reviewed again |
| Open risk | Meta may refuse because Sportia owns the source | None on Meta's side, but the number is silent for a month |

Recommended: new account, then migration. Fresh registration is the fallback if
Meta refuses the migration. Awaiting the owner's confirmation of which he meant.

### 9.6 Why the display name is "Rejected", and what that does to the two routes

Owner's observation (2026-10-10): under the Sportia-owned account Meta rejects
the display name "chapter அ" because it looks like Sportia impersonating
another business. In an account inside our own portfolio, which already carries
that name, the same name is approved immediately.

Consequences:

- **It works against Meta's migration route.** That route requires the number's
  display name to be APPROVED at the source (§9.2), and under Sportia it cannot
  be. Unless Wamafy's own reading shows the name is technically still approved
  with only a change request declined, migration is blocked. A possible
  workaround, untested: Wamafy sets a name Meta accepts under Sportia, the
  number migrates, and we rename it back in our account.
- **It favours a fresh registration in our own account**, where the name is
  approved at once. That route's wall is the 30-day delete rule (§9.1). The
  owner doubts that rule. Meta's phone-numbers page states it in so many words;
  it has not been observed on this number.

Two one-minute checks on Wamafy's side decide the route:

1. Read the number's `name_status` and `new_name_status` (Meta's fields). APPROVED
   means migration is open; DECLINED means it is not.
2. In WhatsApp Manager ▸ Phone numbers, click the bin on +91 82208 88650 **and
   stop before confirming**. If Meta shows Insights with a "last paid message"
   date, the 30-day rule applies and that date starts the clock. If it shows a
   confirmation asking for the PIN, the rule does not apply. Confirming would
   take the live number dark, so nobody confirms.

**The owner's own login can reach that page** (seen 2026-10-10): WhatsApp
Manager ▸ Phone numbers for ChapterA opens from our portfolio at
`business.facebook.com/latest/whatsapp_manager/phone_numbers/?business_id=1507936207635471&asset_id=2914653868871973`,
and the row for +91 82208 88650 shows a bin and a settings gear. So the bin
test does not need anyone else at Wamafy. The page also carries Meta's banner:
the display name "chapter அ" was rejected for violating the Display Name
Guidelines, which matches the owner's explanation.

### 9.7 Creating the new account does not need the number touched

Seen on Meta's own screen, 2026-10-10 (Business Settings ▸ Messaging accounts ▸
Add): the "Create a new Messaging account" dialog asks for an account name, a
time zone and a **WhatsApp account**, and Finish stays disabled until one is
chosen. The choices offered were "Create a WhatsApp account" and the old
"+1 555-460-4269 chapter அ" placeholder. So a brand-new account made this way
wants a number at creation, and the live number cannot be that number while it
sits with Sportia.

The empty **chapter அ** account (`4078982675734130`) already is an account
under our ownership with no number: Verified, Approved, currency now **INR**
(it showed no currency in the morning), no payment method. **Sportia is still
attached to it as a partner with full control**; removing that (Partners ▸
Manage) makes it purely ours.

Order that keeps the live number sending: prepare the account (remove Sportia,
add UPI), connect our app, get the templates approved, have the code ready, and
only then take the number out of Sportia's account. The number leaving is the
moment sending stops, so it is the last step, not the first.

---

## 10. The live number was deleted from Wamafy's account (2026-10-10, ~21:50 IST)

The owner clicked the bin on +91 82208 88650 and confirmed. Meta answered that
the number is "in the process of being deleted". So **the 30-day rule in §9.1
did not stop it**; the owner's doubt was right, at least for this number.

### State seen straight after

- WhatsApp Manager still lists the row as Connected, but the bin is greyed out,
  the quality rating is blank and the profile picture is gone.
- Last sends that went through before the delete: an OTP at 20:04 and an
  abandoned-cart nudge at 21:30, both accepted by Wamafy.
- **Two open events are on sale and both need the WhatsApp OTP to book:**
  `board-game-meetup` (11 October, no leads in the last 7 days) and
  `cozy-sip-chat` (25 October, 2 leads in the last 7 days).
- Server keys present: `WAMAFY_API_KEY` and `AISENSY_API_KEY` (names read from
  the secrets list; AiSensy's set in June). Also present from the ads work:
  `META_APP_SECRET`, `META_WEBHOOK_VERIFY_TOKEN`, so a Meta app already exists.

### What happens to sends now

Every sender tries Wamafy first and falls to AiSensy (old number
+91 99401 11564) **only if Wamafy refuses outright**. Two unknowns:

1. Whether Wamafy refuses, or accepts and then fails silently at Meta. A silent
   failure never reaches the fallback, and the guest simply gets no code.
2. Whether AiSensy still accepts sends at all. Its last recorded send was
   2 September.

Not covered by any fallback: replies from People ▸ Chat (`whatsapp-reply` is
Wamafy-only), and anything customers send to +91 82208 88650, which every
"message us" link on the site points at.

Fastest way to learn both unknowns: one booking attempt on the live site with
the owner's own phone, then read `whatsapp_sends` and the function log.

### Restore order (OTP first this time, because the primary is gone)

| Step | Who |
|---|---|
| Remove Sportia from the **chapter அ** account (`4078982675734130`) | owner |
| Add UPI as that account's payment method | owner (passkey) |
| When Meta finishes the delete: WhatsApp Manager for chapter அ ▸ Phone numbers ▸ Add phone number, display name "chapter அ", verify by SMS or call | owner (SIM) |
| Connect our Meta app to that account; access key; register the number | Claude, with the owner for the key |
| Recreate the templates, `otp` first | Claude (wording saved in `WHATSAPP-TEMPLATE-PACK-2026-10-10.md`) |
| Send directly through Meta's API in `open-event-otp`, then the other six | Claude; deploy flags per `CLAUDE.md` rule 3 |
| Receiver for Meta's delivery ticks and replies | Claude |

Template wording for all ten was copied out of the Wamafy account the same
evening. All 16 templates there were "Active – Quality pending", so Meta's
migration would have carried none of them across (§9.2 predicted this).

### 10.1 Decisions and build status, later the same night

- **Owner: the two events on sale are placeholders** until setup is finished; he
  is routing customers to another booking partner meanwhile. No outage pressure.
- **Chosen: Meta's Cloud API directly, not Kapso** (owner asked which I would
  rather; reasons in §9.3, minus the migration one, which no longer applies).
- **Meta finished the delete.** By about 22:45 IST the ChapterA account showed
  "hasn't added any phone numbers yet". +91 82208 88650 is free to register.
- **Two Meta apps exist** (read through Meta's developer tools):
  - `Automation WA` (`1221239236143201`): development mode, already subscribed
    to WhatsApp account webhooks, callback on `chaptera.in` (the old
    `api/webhook.js` auto-reply from May 2026, which also proves we sent through
    the Cloud API directly once before).
  - `chaptera-ads` (`38444690021845940`): live, used for the ads webhooks.
  Which one carries WhatsApp is not decided. A development-mode app may not
  receive real webhooks, so `Automation WA` would need switching to Live.

**Code written, NOT deployed, NOT committed** (local working tree only):

| File | Change |
|---|---|
| `open-event-otp`, `payu-callback`, `payu-webhook`, `verify-pending-payments`, `cart-abandonment`, `send-aisensy-invite`, `whatsapp-reply` | New first-choice path that sends through Meta directly, then Wamafy, then AiSensy as before. One identical `sendViaCloudApi` block in each (house rule: duplicated, not in `_shared/`) |
| `whatsapp-webhook` (new function) | Receives Meta's delivery ticks, customer messages and account events; writes through the existing `log_whatsapp_*` functions with provider `meta` |

- **Dormant by design.** The new path does nothing until both
  `WHATSAPP_CLOUD_TOKEN` and `WHATSAPP_CLOUD_PHONE_ID` exist as secrets, so it
  can be deployed ahead of the number being ready.
- The receiver needs `WHATSAPP_APP_SECRET` and `WHATSAPP_WEBHOOK_VERIFY_TOKEN`,
  and deploys **with** `--no-verify-jwt`.
- **All templates must be created in language `en`** in the new account. The
  code sends one language for every template; Wamafy's copies were a mix of
  English and English (US).
- The regular split-event advance gets a real template at last:
  `advance_success_dpl` with `{{1}}` amount and `{{2}}` due date (wording in the
  template pack, under `advance_with_due_trackable`).
- The tap-tracked invite is not sent on the direct path; the plain
  `invitation_with_contact` goes instead. Tap tracking is lost until we build
  our own redirect.
- `whatsapp-reply` now works out the 24-hour window from `whatsapp_inbound`,
  because Meta accepts an out-of-window message and only reports the failure
  afterwards (code 131047, through the webhook).
- Checked: all eight files parse, and a loose type-check shows no errors before
  or after. Nothing has been run against Meta; that needs the number, the key
  and approved templates.

### 10.2 Is this the right way to set up Cloud API? Checked against Meta's own documents

The owner's doubt: with AiSensy and Wamafy, an "embedded signup" popup created
the account and the number. Is adding a number by hand in WhatsApp Manager
really how direct Cloud API works? **Yes.** Read from Meta's developer
documentation on 2026-10-10:

- **Embedded signup is the providers' tool, not ours.** Meta describes it as
  what a provider's "business customers use" to generate the assets the provider
  needs. Meta's access-token page says a business accessing only its own data
  should use a system-user token, and that the embedded-signup token type is one
  "you don't need for your own account".
- **Meta lists four ways to add a number:** the app dashboard, Meta Business
  Suite, WhatsApp Manager, and embedded signup (through a provider). The first
  three are the direct routes.
- **Adding is not the last step.** Meta: those methods "add a phone number to
  your WhatsApp Business account and verify your ownership" but "do not register
  the number for Cloud API use". A separate register call with a 6-digit PIN
  finishes it, and it can only be made through the API.
- **A number in use elsewhere must be deleted first.** Done (§10).
- **A verified portfolio may hold 20 numbers**; an unverified one, 2.

What a provider's popup did silently, and we now do ourselves:

| Step | Where | Who |
|---|---|---|
| 1. An account we own, with a payment method | Business Settings (the empty chapter அ account) + UPI | owner |
| 2. Add and verify the number | WhatsApp Manager ▸ Phone numbers ▸ Add phone number, or the app's API Setup page | owner (SIM) |
| 3. A Meta app with the WhatsApp use case, connected to that account | App dashboard ▸ WhatsApp ▸ API Setup: select the account | owner clicks, Claude guides |
| 4. A permanent access key | Business Settings ▸ System users: create one, assign the app (Manage app) and the WhatsApp account (full control), generate a token with `business_management`, `whatsapp_business_management`, `whatsapp_business_messaging` | owner (passkey; the key is shown once) |
| 5. Register the number for Cloud API | one API call with a PIN we choose | Claude, once the key is stored |
| 6. Webhook | App dashboard ▸ WhatsApp ▸ Configuration: callback address + verify word, subscribe to `messages` | owner clicks, Claude supplies the address |
| 7. Templates | WhatsApp Manager or the API | Claude |

Notes:

- **The app should be Live.** Meta's webhook page: "some webhooks will not be
  sent if your app is in Dev mode". `Automation WA` is in development mode;
  `chaptera-ads` is live. Whether real WhatsApp messages arrive in development
  mode is not spelled out, so plan on Live.
- **Meta retries a failed webhook for up to 7 days**, with duplicates possible.
  The new receiver is written for that.
- **Not confirmed:** whether `Automation WA` sits inside the Chapter அ
  portfolio. Business Settings ▸ Apps and ▸ System users both ask for the
  owner's passkey. It matters because step 4 can only assign an app the
  portfolio holds.
- **Not found in Meta's pages:** whether selecting an account in API Setup also
  subscribes the app to that account's webhooks, or whether a separate
  "subscribed apps" call is needed. A forum report says each account must be
  subscribed individually. To be checked at step 6 by sending a test message.

### 10.3 The new account exists and holds the number (2026-10-10, ~23:15 IST)

The owner created a brand-new account through Business Settings ▸ Messaging
accounts ▸ Add and added the number in the same flow. Seen in Business Settings:

| | |
|---|---|
| Account | **chapter அ**, ID **`1438047108420416`**, owned by Chapter அ |
| Status | Business verification Verified, account Approved |
| Partners | **0** (no provider attached) |
| Number | **+91 82208 88650**, display name "chapter அ" **In review**, status **Pending** |
| Currency / payment | none yet |

**Two accounts now share the name "chapter அ".** The one to use is the ID ending
`0416`. The older empty one (`4078982675734130`, Sportia still attached) is a
spare and can be deleted later to avoid mix-ups.

"Pending" is expected at this point: the display name is under review and the
number has not yet been registered for Cloud API (step 5 in §10.2).

Next: payment on the `0416` account (UPI), then steps 3 and 4 of §10.2.

### 10.4 Payment added; which app to use (2026-10-10, ~23:35 IST)

**Payment is in place on the `0416` account.** Read from Billing & payments:

- Available funds **₹50.00**, funded 10 October 2026 as a "Manual payment".
- "How you'll pay: Available funds. We'll deduct funds about once a day as you
  send messages. **If funds run out, your messages will stop sending.**"
- Currency Indian Rupee, business name CHAPTER, no tax ID.

So it is a prepaid balance, as Meta's FAQ said, and ₹50 was accepted. At roughly
₹20 a month it lasts about two months. **Nothing warns us when it runs low**;
a low-balance check belongs on the to-do list before real traffic returns.

**Apps and system users in the portfolio** (Business Settings, read the same
night once the owner's passkey session was open):

- Apps: only **`chaptera-ads`** (`38444690021845940`), Published. Its use cases
  are Marketing API ones and Instagram; **no WhatsApp use case yet**.
- `Automation WA` is **not** in the portfolio, so a system user here cannot be
  given it.
- System users: `chaptera-instagram`, `chaptera-reporting`,
  `Conversions API System User`.

**Decision: carry WhatsApp on `chaptera-ads`.** It is already in the portfolio,
already Live (Meta withholds some webhooks from development-mode apps), and its
app secret is already stored on the server as `META_APP_SECRET`, which the new
receiver now falls back to. Remaining owner steps:

1. App dashboard ▸ Use cases ▸ Add use cases ▸ "Connect with customers through
   WhatsApp", then pick the `0416` account in API Setup.
2. Business Settings ▸ System users ▸ Add: a new one for WhatsApp only. Assign
   the app (`chaptera-ads`, Manage app) and the WhatsApp account (`0416`, full
   control). Generate a token for `chaptera-ads` with `business_management`,
   `whatsapp_business_management`, `whatsapp_business_messaging`.
3. Store that token on the server as `WHATSAPP_CLOUD_TOKEN`.

Not seen: the "Add use cases" list itself. The developer site would not finish
loading for the browser automation, so whether WhatsApp can be added to an
existing app this way is taken from Meta's get-started guide, not observed.

Possible phone number ID for +91 82208 88650: `1097059556022586` (seen in a
Business Settings address while the owner browsed). Unconfirmed.

### 10.5 WhatsApp added to the app; display name approved (2026-10-10, ~23:50 IST)

The owner added the use case "Connect with customers through WhatsApp" to
`chaptera-ads`. What its pages showed, and what each thing means:

- **"Missing valid payment method" / "Payment method missing or ineligible for 3
  of your accounts".** The portfolio has four WhatsApp accounts; three have no
  payment of their own (the spare empty one, Sportia's, and Join Chapter, which
  runs on AiSensy's credit line). The fourth is the funded `0416` account. The
  banner is about the portfolio, not about `0416`. This is a reading of the
  count, not something Meta's page spells out per account.
- **"Usernames are rolling out — reserve your username and get BSUID-ready".**
  Informational. WhatsApp is introducing usernames; a customer who uses one can
  reach a business without showing a phone number, and Meta then identifies them
  by a business-scoped ID instead. **Future risk for us:** bookings, the OTP
  gate and People ▸ Chat all key on the phone number. Not urgent, but it needs a
  design pass before usernames go live in India.
- **API Setup's "From" list shows only +91 99401 11564** (number ID
  `1028637327008073`). The new number is absent because it is not registered for
  Cloud API yet; that page is a test tool and not part of our setup.
- **Not pressed:** "Generate access token" (a short-lived personal key, not the
  one we need) and "Send message".

**The display name was approved.** WhatsApp Manager for `0416`: "Your display
name chapter அ was approved", name visible to customers. The number still reads
**Pending**, which now means only "not yet registered for Cloud API".

**Setup script written: `scripts/whatsapp-cloud-setup.sh`.** The owner runs it
after pressing Copy on the system-user key. It reads the key from the clipboard
(never printed or pasted into chat), finds the number, registers it with a PIN
the owner types, subscribes the app to the account, stores
`WHATSAPP_CLOUD_TOKEN` and `WHATSAPP_CLOUD_PHONE_ID` as Supabase secrets, and
clears the clipboard. Safe to run twice. Not yet run.

Known trap written into the script's error text: if registration reports a PIN
mismatch, the number still carries a two-step PIN from its Wamafy days; it is
cleared in WhatsApp Manager ▸ Phone numbers ▸ gear ▸ Two-step verification.

### 10.6 The number is registered and the key is stored (2026-10-11, ~00:25 IST)

The owner created the system user and ran `scripts/whatsapp-cloud-setup.sh`.
Its output, and what was checked afterwards:

| | |
|---|---|
| Number | +91 82208 88650, **number ID `1404343949423934`** (the `1097…` guess in §10.4 was wrong) |
| Display name | chapter அ, APPROVED |
| Status | **CONNECTED** (registered for Cloud API) |
| App | `chaptera-ads` subscribed to the account's notifications |
| Server secrets | `WHATSAPP_CLOUD_TOKEN` and `WHATSAPP_CLOUD_PHONE_ID`, both stamped 2026-10-10 17:54 UTC in the secrets list |

Two things went wrong on the way, both mine:

- **The script's key check was too strict.** It demanded a key starting `EAA`;
  the real one starts `EAI`, so two runs were refused with the key sitting on the
  clipboard. Found by printing only the clipboard's length and first three
  characters. The check now accepts any long run of letters and digits starting
  `EA`.
- **The PIN prompt hid what the owner typed, and he does not know what he
  entered.** Not a blocker: Meta's two-step page gives a Change PIN route
  (WhatsApp Manager ▸ Phone numbers ▸ the number's settings ▸ Two-step
  verification ▸ Change PIN) and an API call that takes only the new PIN; neither
  mentions the old one. The PIN matters only if the number is registered again.

**Templates are ready to create, not yet created.**
`scripts/whatsapp-templates.json` defines the ten the code sends (the nine in
use plus `advance_success_dpl` for regular split-event advances), all language
`en`, every dynamic button `https://chaptera.in/invite{{1}}`. A check confirmed
each template's number of body values and dynamic buttons equals what the edge
functions send. `scripts/whatsapp-create-templates.py` creates the missing ones
from a key on the clipboard; it needs the owner to generate and copy a key once
more, because the stored one cannot be read back.

**Still to do, in order:** create the templates and wait for Meta's review;
deploy `whatsapp-webhook` and point the app's WhatsApp configuration at it;
deploy the seven senders; send one real code to the owner's phone as the test;
then remove the Wamafy and AiSensy branches once it has run clean.

### 10.7 Wording changes, and what our own link tracking needs (2026-10-11)

**Owner's corrections, applied to `scripts/whatsapp-templates.json`:**

- Template `single_payment_sucess_dpl`: header corrected to "Payment Success!"
  (the template's name keeps its old spelling, because the code sends by name).
- One footer everywhere: "This is an automatic message. Do not reply here!".
  Changed on `cart_abandon`, `invitation_with_contact` and `doubt_assisstance`.
  `otp` is the exception: Meta fixes an authentication template's footer to the
  expiry line.

**Own link tracking: what exists, what is missing. Researched, not built.**

Already there:

- `whatsapp_sends.clicked_at`, and People ▸ Call already draws the "clicked"
  mark from it. Only something to SET it is missing now that Wamafy is gone.
- Every button already lands on `/invite` with `?phone=…&name=…`, read by
  `parseInviteDeeplinkParams()` in `src/App.tsx`.
- Meta's own totals per template and per button, in WhatsApp Manager (the "link
  tracking" tick box in the template editor). Example seen on the old account:
  `advancepaid`, Join Groupchat 15 taps, Contact Us 1. Totals only; never who.

Needed for a per-person mark:

| Piece | What | Where |
|---|---|---|
| A tag in the link | a random code minted per message, added to the tail we already send (`…&wa=<code>`) | the seven senders |
| Remember whose it is | one new column on `whatsapp_sends` holding that code, and `log_whatsapp_send` accepting it | database |
| Notice the tap | when `/invite` opens carrying a code, report it once and strip it from the address; the server stamps `clicked_at` if it is still empty | `src/App.tsx` + one small public database function |
| The invite template | its two buttons are FIXED links today, so they cannot carry a tag; they must be created as dynamic (`https://chaptera.in/invite{{1}}`) | `whatsapp-templates.json` + `send-aisensy-invite` |

Not needed: anything from Meta, a redirect address, or a separate approval. The
nine templates with dynamic buttons need no change at all, because the tail is
ours to fill.

Compared with Wamafy's version: theirs covered one template (the invite) through
their redirect; this covers every message that has a button, and could also say
which button if each button gets its own tail.

Limits to state honestly: it records the page opening, so a link forwarded to a
friend counts as a tap, and a tap that never loads the page does not.

**Decision pending from the owner:** create `invitation_with_contact` with
dynamic buttons now (cheap now, a fresh Meta review later), and whether to build
the tracking before the first deploy so the senders are deployed once.

### 10.8 Own tap tracking built; invite buttons made dynamic (2026-10-11)

Owner said yes to both decisions in §10.7.

**What is LIVE now**

- **Database (production), additive only.** Migration
  `20261011_whatsapp_own_click_tracking.sql`: columns
  `whatsapp_sends.click_token` and `clicked_button`, a unique index on the
  code, and `log_whatsapp_click(p_token)`. The function is callable by the
  public site on purpose: the code is 96 random bits that exist only inside one
  recipient's message, it can only mark that one message, only once, and it
  returns nothing either way.

**What is written but NOT live** (local files; nothing deployed, committed or pushed)

- **Senders.** Each mints a code per message, adds `&wa=<code>.<button>` to
  every button's link tail, and stores the code on the logged row. Covers the
  six with links: the three payment functions, `cart-abandonment`,
  `send-aisensy-invite`, and the doubt answer in `whatsapp-reply`. `otp` has no
  link. Only the direct Meta path is tagged; the Wamafy and AiSensy fallbacks
  are untouched.
- **Site.** `src/whatsappClick.ts`, called once from `src/main.tsx`: when a page
  opens with a `wa` code it reports it. It does not touch the address bar.
- **Templates.** `invitation_with_contact` now has dynamic buttons in
  `scripts/whatsapp-templates.json`, so every one of the ten is dynamic.
  `send-aisensy-invite` sends it two tagged tails on the direct path. The copies
  of that template on Wamafy and AiSensy still have fixed links, and the
  fallback code still treats them that way.

**How it was checked**

| Check | Result |
|---|---|
| Database: eight assertions run as the public role against a test row (phone `9000000099`), then cleaned up | all passed: wrong, malformed and empty codes change nothing; the right code stamps the time and button 1; a second and third tap change nothing; exactly one event row; test rows removed |
| Public call over the internet with the site's own key and a code that matches nothing | HTTP 204 |
| The real sending block from `payu-callback`, run against a fake Meta: 16 checks | all passed: dormant without secrets; codes are 16 characters and fit the database rule; 2,000 codes all different; one numbered tail per button; phone and name still readable; message shape, button indexes, OTP shape, text shape; a refusal is returned not thrown |
| Shared block identical across the seven functions; paid helper identical across the three payment functions | yes (one hash each) |
| All eight functions parse; loose type-check | 0 errors |
| Site `npx tsc --noEmit` | passes |
| Template file against the code: blanks and buttons for all ten | all match |
| Site in a browser (`/team?tourdev`, which writes nothing): with a valid-looking code, with none, with a malformed one | 1 call answered 204; 0 calls; 0 calls |

One false alarm on the way: the first run of the sending-block test failed
because the test cut the block short when extracting it, not because of the
code. Fixed in the test and re-run.

**Not tested, because it cannot be yet:** a real message with a real tap. That
needs the templates approved, the senders deployed and the site pushed.

**Known limits:** it records the page opening, so a forwarded link counts and a
tap that never loads the page does not; only the first tap and its button are
kept; messages sent through a fallback provider carry no code.

### 10.9 Trap: "WhatsApp account" and "Messaging account" are two different things (2026-10-11)

Creating the templates failed twice with "Object with ID '1438047108420416' does
not exist, cannot be loaded due to missing permissions". Cause, read off Business
Settings:

- Meta now splits what used to be one thing. The **WhatsApp account** is the
  number and its profile (here asset `1097059556022586`). The **Messaging
  account** is what owns templates and payment (here `1438047108420416`, the ID
  our code and scripts use). Both are called "chapter அ".
- The system user `chaptera-whatsapp1` (ID `61595494461226`) had been given the
  app and the **WhatsApp account** only. The Messaging account's People tab
  listed one person: the owner himself.
- So a key from that system user could not load the Messaging account or its
  templates.

**Not explained:** the first key, from the same system user, did list the
number, register it and subscribe the app using the Messaging account's ID. Those
calls may be allowed through the WhatsApp account. Whether SENDING works with the
stored key is therefore still unproven and is the first thing the real test
will show.

**Fix (owner's click):** Business Settings ▸ Messaging accounts ▸ chapter அ
(ending 0416) ▸ Assign people ▸ tick `chaptera-whatsapp1` ▸ full control ▸
Assign. Then generate a fresh key for the template script.

Also seen on the system user's panel: a banner "Account verification required …
we need you to verify your account for this request", with Verify account and
Cancel request buttons. Not pressed. It may be Meta asking the owner to
re-confirm his identity for a pending request.

The template script now prints whose key it is, for which app, and each
permission as yes or MISSING, and its error text names this trap. An earlier
version said "the key has the right permissions" even when Meta had not
described the key; that wording is corrected.

### 10.10 Templates created in our account (2026-10-11)

After the owner assigned the Messaging account to `chaptera-whatsapp1` and
generated a fresh key, `scripts/whatsapp-create-templates.py` reported:

- Key: `chaptera-whatsapp1`, app `chaptera-ads`, never expires, all three
  permissions present.
- Account `1438047108420416` had 0 templates; **10 created, 0 failed.**

| Template | Meta's answer | Type |
|---|---|---|
| `otp` | **APPROVED** at once | Authentication |
| `advancepaid`, `advance_success_dpl`, `balance_success`, `single_payment_sucess_dpl`, `payment_failed` | PENDING | Utility |
| `cart_abandon`, `resend_details`, `invitation_with_contact`, `doubt_assisstance` | PENDING | Marketing |

This confirms §10.9's diagnosis: the same system user, once given the Messaging
account, could create templates.

Watch for when the nine are reviewed: Meta may approve, reject, or move a
Utility template to Marketing (which raises its price and makes it subject to
marketing opt-outs). Status can be read in WhatsApp Manager ▸ Manage templates
for the `0416` account, and will also arrive at `whatsapp-webhook` once that is
deployed and connected.

---

## 11. Sources

- Kapso pricing: https://kapso.com/pricing
- Kapso pricing FAQ: https://docs.kapso.ai/docs/whatsapp/pricing-faq
- Kapso Meta message billing: https://docs.kapso.ai/docs/whatsapp/meta-message-billing
- Kapso payment issues: https://docs.kapso.ai/docs/whatsapp/payment-method-troubleshooting
- Kapso migrate from another provider: https://docs.kapso.ai/docs/migrate/from-another-provider
- Kapso migrate from YCloud: https://docs.kapso.ai/docs/migrate/from-ycloud
- Kapso connect WhatsApp: https://docs.kapso.ai/docs/how-to/whatsapp/connect-whatsapp
- Kapso bring-your-own-SIM troubleshooting: https://docs.kapso.ai/docs/how-to/whatsapp/bring-your-own-sim-troubleshooting
- Kapso authentication templates: https://docs.kapso.ai/docs/whatsapp/templates/authentication
- Kapso message webhooks: https://docs.kapso.ai/docs/platform/webhooks/message-events
- Kapso webhook delivery: https://docs.kapso.ai/docs/platform/webhooks/advanced
- Kapso send a message: https://docs.kapso.ai/api/meta/whatsapp/messages/send-a-message
- Kapso extensions: https://docs.kapso.ai/docs/whatsapp/typescript-sdk/kapso-extensions
- Kapso rate limits: https://docs.kapso.ai/api/rate-limits
- Kapso funding: https://dealroom.co/news/146622-kapso-raises-1-4m-seed-to-build-whatsapp-infrastructure-for-latam-develo/
- Number migration rules (provider guides): https://respond.io/help/whatsapp/phone-number-migration-to-whatsapp-cloud-api , https://www.verloop.io/blog/waba-number-migration/ , https://docs.360dialog.com/docs/waba-management/migrating-phone-numbers
- India rates and the October 2026 change: https://www.freepressjournal.in/tech/how-much-does-india-have-to-pay-for-whatsapp-messages-from-october-1 , https://m.aisensy.com/blog/whatsapp-pricing-update-october-2026/
- Meta pricing page (INR table could not be opened): https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing
- UPI as a pre-payment method, Meta's FAQ: https://whatsappbusiness.com/resources/faq/
- UPI add-funds walkthrough: https://happilee.io/whatsapp-business-api-wallet-payment-method/
- India payment methods guide: https://zaptilo.ai/add-payment-method-to-whatsapp-business
- Payment method deadline: https://360dialog.com/blog/whatsapp-service-message-charging-october-2026/
- Meta, phone numbers (30-day delete rule): https://developers.facebook.com/documentation/business-messaging/whatsapp/business-phone-numbers/phone-numbers
- Meta, migrate numbers programmatically: https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/support/migrating-phone-numbers-among-solution-partners-programmatically
- Meta, migrate numbers via Embedded Signup: https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/support/migrating-phone-numbers-among-solution-partners-via-embedded-signup
- Meta, register a phone number: https://developers.facebook.com/documentation/business-messaging/whatsapp/business-phone-numbers/registration
- Meta, migrate an account among partners (customer-owned accounts only): https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/support/migrating-wabas-among-solution-partners-via-embedded-signup
- Meta, Cloud API get started: https://developers.facebook.com/documentation/business-messaging/whatsapp/get-started
- Meta, access tokens (system user for your own account): https://developers.facebook.com/documentation/business-messaging/whatsapp/access-tokens
- Meta, embedded signup overview (who it is for): https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/overview
- Meta, webhooks overview (Dev mode note, 7-day retries): https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/overview
- Meta, create a webhook endpoint: https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/create-webhook-endpoint
