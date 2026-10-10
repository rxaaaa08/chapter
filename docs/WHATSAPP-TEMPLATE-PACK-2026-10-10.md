# WhatsApp template pack — wording saved from the Wamafy account

**Captured 2026-10-10, about 22:00 IST**, from Meta's WhatsApp Manager ▸ Manage
templates for the account "ChapterA" (`2914653868871973`, owned by Sportia /
Wamafy), minutes after the owner deleted +91 82208 88650 from it. Templates
belong to that account and do not follow the number, so this file is the copy we
keep. Read-only capture; nothing was edited there.

Companion: `KAPSO-MIGRATION-RESEARCH-2026-10-10.md` §9–§10.

## How to read this

- `{{1}}`, `{{2}}`… are the blanks our code fills in. Meta's preview showed
  sample values (₹888, Sam, May 23rd); the blanks below were put back using the
  code that sends each one.
- `*text*` is WhatsApp bold.
- All 16 templates in that account read **"Active – Quality pending"**. None was
  rated High, so Meta's number migration would have copied none of them.
- **The link behind every button is `https://chaptera.in/invite`.** Read off the
  Edit screens on 2026-10-11 for `advancepaid` (two buttons), `cart_abandon` (one)
  and `invitation_with_contact` (two): each showed a 26-character address, which
  is exactly that one. Dynamic buttons are `https://chaptera.in/invite{{1}}` with
  our code supplying the tail (`?phone=…&name=…`); the invite's two buttons are
  fixed links with no tail. The other seven were not opened one by one; they are
  assumed to match because the code sends every button the same tail.
- **The versions to create in our own account are in
  `scripts/whatsapp-templates.json`**, all in language `en`, and
  `scripts/whatsapp-create-templates.py` creates whichever are missing.

## The ten templates the code sends

| # | Name | Category | Language | Used by |
|---|---|---|---|---|
| 1 | `otp` | Authentication | English | `open-event-otp` |
| 2 | `advancepaid` | Utility | English | the three payment functions (pay-at-venue advance) |
| 3 | `balance_success` | Utility | English | the three payment functions (balance on a regular split event) |
| 4 | `single_payment_sucess_dpl` | Utility | English (US) | the three payment functions (single full payment) |
| 5 | `payment_failed` | Utility | English (US) | the three payment functions |
| 6 | `cart_abandon` | Marketing | English (US) | `cart-abandonment` |
| 7 | `resend_details` | Marketing | English | `send-aisensy-invite` (details / resend) |
| 8 | `invitation_with_contact` | Marketing | English (US) | `send-aisensy-invite` (invite, fallback) |
| 9 | `invitation_with_tracking` | Marketing | English (US) | `send-aisensy-invite` (invite, tap-tracked) |
| 10 | `doubt_assisstance` | Marketing | English | `whatsapp-reply` (answer after the 24-hour window) |

### 1. `otp`

- Body (fixed by Meta for authentication templates): `*{{1}}* is your verification code.`
- Expiry line: `Expires in 8 minutes.`
- No "do not share this code" security line.
- Button: **Copy code**
- `{{1}}` = the 6-digit code.

### 2. `advancepaid`

- Header: `Advance Paid!`
- Body:
  ```
  Your advance payment of {{1}} is successful.

  Press *Join Groupchat* & you’ll receive further details a few days before the plan.

  In case of any queries, press *Contact Us*.
  ```
- Footer: `This is an automatic message. Do not reply here!`
- Buttons: **Join Groupchat**, **Contact Us** (both links, both filled in per send)
- `{{1}}` = amount, e.g. ₹1,024.00.

### 3. `balance_success`

- Header: `Balance Paid!`
- Body:
  ```
  Your payment of {{1}} is successful.

  Press *Join Groupchat* & you’ll receive further details by {{2}}.

  In case of any queries, press *Contact Us*.
  ```
- Footer: `This is an automatic message. Do not reply here!`
- Buttons: **Join Groupchat**, **Contact Us**
- `{{1}}` = amount, `{{2}}` = details date.

### 4. `single_payment_sucess_dpl`

- Header: `Payment Sucess!` (spelled that way in the approved template)
- Body: identical to `balance_success`.
- Footer: `This is an automatic message. Do not reply here!`
- Buttons: **Join Groupchat**, **Contact Us**
- `{{1}}` = amount, `{{2}}` = details date.

### 5. `payment_failed`

- Header: `Payment Failed :(`
- Body:
  ```
  Hi {{1}}, your payment of {{2}} has failed.

  Please *Retry Payment.*

  If you have any doubts - press *Contact Us*.
  ```
- Footer: `This is an automatic message. Do not reply here!`
- Buttons: **Retry Payment**, **Contact Us**
- `{{1}}` = name, `{{2}}` = amount.

### 6. `cart_abandon`

- Header: `We’re here for you...`
- Body:
  ```
  Hi {{1}}, we don’t want you to miss our {{2}} - {{3}}.

  If something is unclear & you wanna talk to us - press *Contact Us*.
  ```
- Footer: `This message is automatic. Do not reply here!`
- Button: **Contact Us** (one link)
- `{{1}}` = name, `{{2}}` = event, `{{3}}` = date.

### 7. `resend_details`

- Header: `We’re happy to help!`
- Body: `Hey {{1}}, re-check {{2}} details & reserve your spot :)`
- Footer: `This is an automatic message. Do not reply here!`
- Buttons: **Reserve my Spot**, **Contact Us**
- `{{1}}` = name, `{{2}}` = event.

### 8. `invitation_with_contact`

- No header.
- Body:
  ```
  You’re invited to our {{1}} on {{2}}.

  *Press Confirm to Reserve Your Spot.*

  In case of any queries, press Contact Us.
  ```
- Footer: `Note: This is an automatic message. Do not reply here!`
- Buttons: **Confirm**, **Contact Us** (fixed links; the second label was below
  the captured area and is taken from the code comments)
- `{{1}}` = event, `{{2}}` = date.

### 9. `invitation_with_tracking`

- Same body as #8.
- Footer: `This is an automatic message. Do not reply here!`
- Buttons: **Confirm**, **Contact Us**, approved as `https://api.wamafy.com/r/{{1}}`.
- **Do not recreate as it is.** The button address belongs to Wamafy. Either
  drop it and use #8, or build our own redirect link and submit that.

### 10. `doubt_assisstance`

- No header.
- Body:
  ```
  Hi, we’re reaching regarding your query "{{1}}".

  {{2}}

  Need help? Press *Contact Us*.
  ```
- Footer: `This message is automatic. Do not reply here.`
- Button: **Contact Us** (one link)
- `{{1}}` = their question, `{{2}}` = our answer.

## Six more in that account, not used by the code

All created 3 September 2026 as tap-tracked variants whose buttons point at
Wamafy's redirect: `balance_paid_trackable`, `advance_with_due_trackable`,
`resend_invite_trackable`, `advancepaid_trackable`, `payment_failed_trackable`,
`cart_abandon_trackable`.

One of them carries wording worth keeping. `advance_with_due_trackable`
(Utility, English (US)) is the advance message for a **regular split event**,
the one case still routed through AiSensy because `advancepaid` has no due date:

- Header: `Advance Paid!`
- Body:
  ```
  Your advance payment of {{1}} is successful.

  Press *Pay Balance* & settle balance by {{2}}.

  In case of any queries, press *Contact Us*.
  ```
- Footer: `This is an automatic message. Do not reply here!`
- Buttons: **Pay Balance**, **Contact Us**
