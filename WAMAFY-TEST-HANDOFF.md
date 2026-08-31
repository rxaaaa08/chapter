
---

## Template audit — 2026-08-29 (pay-at-venue split open events)

Six templates on Wamafy: `otp`, `advancepaid`, `resend_details`, `payment_failed`,
`cart_abandon`, `invitation_with_contact`.

### Button map (discovered by probing; Wamafy's 400s name each button)

| Template | Buttons required |
|---|---|
| `otp` | 1 — index 0 "Copy code" (COPY_CODE) |
| `advancepaid` | 2 URL — "Join Groupchat", "Contact Us" |
| `resend_details` | 2 URL — "Reserve my Spot", "Contact Us" |
| `payment_failed` | 2 URL — "Retry Payment", "Contact Us" |
| `cart_abandon` | 1 URL — "Contact Us" |
| `invitation_with_contact` | none dynamic (static URLs — see below) |

URL button `value` is the placeholder tail only (e.g. `?phone=…&name=…`), exactly
as AiSensy takes it today.

### BLOCKER — `otp` cannot be sent through Wamafy

Meta rejects every attempt: `#132018 — buttons: Button at index 0 must be of type
Url` (fbtrace_id `AqimFGINbqd6yTWxdvF9YLF`). Wamafy's validator demands
`type:"copy_code"`; passing `type:"url"` gives the identical Meta error, so the
sub_type is derived from the template, not the request.

Our AiSensy code sends the same template correctly with
`sub_type:'url'` + the OTP as the text parameter
(`supabase/functions/open-event-otp/index.ts`), which is Meta's documented
authentication-template format. **This is a Wamafy-side mapping bug.**

Impact: `otp` gates every open-event booking via `create-payu-order`. No OTP, no
sale. **Workaround: recreate `otp` with no button** — the body already carries the
code, guests only lose one-tap copy.

### Fixed since the last audit

`advance_success` and `payment_success` (which had **hardcoded** amounts — "[₹88]"
and "₹1.02" as literal text with `variables: []`) have been replaced by
`advancepaid`, which correctly takes `{{1}}` for the amount. Verified sending.

### Open copy mismatch

`advancepaid` promises details "a few days before the plan"; the live pay-at-venue
message says "one week before the event" (`PAY_AT_VENUE_DETAILS_WHEN` in
`payu-callback`). Same promise, different timing — pick one before going live.

### Still open

- **Cold start.** Every delivery so far went to a number that messaged us first.
  Open-event guests never have. Unresolved and still the decisive risk.
- **`invitation_with_contact` buttons are static** — it sends fine with no buttons
  array, and Wamafy rejects unexpected button params, so the URLs are fixed. The
  AiSensy version passes `?phone=…&name=…` so the link identifies the guest.
  Invite-only concern, not open-event.

---

## Cutover step 1 — OTP is live on Wamafy (2026-08-31)

`open-event-otp` v10 deployed with `--no-verify-jwt`; verify_jwt confirmed still
`false`, no other function touched. Wamafy primary, **AiSensy automatic fallback**
(this template gates every booking, and edge functions have no rollback).

### Both open questions resolved

**1. Cold start works for AUTHENTICATION templates.** A send to `8838111564`,
whose 24h window had been closed since 28 Aug, delivered in **2.6 s**. The earlier
cold failure was `invitation_with_contact` — a MARKETING template, the category
Meta restricts. That distinction was the whole risk and it is now settled: OTP and
UTILITY confirmations reach people who have never messaged us.

**2. The real booking function delivers.** An OTP requested through the live
`open-event-otp` endpoint for `founders-meet` was sent via `wamafy`, delivered,
and read. The OTP code itself is not written to the log (`variables` is null).

### Operational note — callback latency is variable

Delivery callbacks arrived in 2.6 s in one case and **4 m 48 s** in another. Wamafy's
`occurredAt` is when *they* posted the callback, not when WhatsApp delivered, so
`delivered_at` is an upper bound. The message arrives fast; the reporting lags.
Do not build anything time-sensitive on these timestamps.

### Test-recipient discipline

`WAMAFY_TEST_ALLOWED_NUMBERS` guards only the Vercel test route. **The live edge
function has no allowlist** — it sends wherever the caller says, as production must.
So the allowlist protects ad-hoc testing, not the real flow; when driving the live
function, the number in the request is the only safeguard.

Allowlist is now `8838111564,8015064473`. Note that `--force` on `vercel env add`
silently failed to overwrite (the timestamp stayed at "3d ago"); use
`vercel env rm` followed by `add`, and confirm the timestamp actually changes.
