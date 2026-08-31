
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
