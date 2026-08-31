# Bug report — Authentication template with a Copy-code button cannot be sent

**Reported:** 2026-08-29
**Workspace number:** +91 82208 88650 (`whatsappNumberId` `5624a947-bace-4a6b-b18d-20bad7b9f4af`)
**Template:** `otp` · category `AUTHENTICATION` · language `en` · status `APPROVED`
**Meta trace id:** `AqimFGINbqd6yTWxdvF9YLF`
**Severity:** blocking — this template gates every booking on our site

---

## 1. Summary

`POST /messages` cannot send our `AUTHENTICATION` template `otp`.

Your API **requires** the button to be supplied as `type: "copy_code"`. Meta then
rejects the send with:

```
(#132018) There's an issue with the parameters in your template
error_data.details: "buttons: Button at index 0 must be of type Url"
```

Passing `type: "url"` instead produces the **identical** Meta error, which
suggests the outgoing `sub_type` is derived from the stored template definition
rather than from the request body — so there is currently no value of `type` that
lets this template send.

Templates with ordinary **URL** buttons work fine on the same workspace and key
(`advancepaid`, `resend_details`, `payment_failed`, `cart_abandon` all send and
deliver). The problem appears specific to the authentication/copy-code button.

---

## 2. The template

```json
{
  "name": "otp",
  "language": "en",
  "category": "AUTHENTICATION",
  "status": "APPROVED",
  "bodyText": "{{1}} is your verification code.",
  "variableFormat": "positional",
  "variables": [{ "key": "1", "example": "123456" }]
}
```

---

## 3. Steps to reproduce

### Attempt A — no buttons

```bash
curl -X POST https://api.wamafy.com/api/v1/public/messages \
  -H "Authorization: Bearer wamafy_live_***" \
  -H "Content-Type: application/json" \
  -d '{"to":"+9199401*****","templateName":"otp","variables":{"1":"482913"}}'
```

**Response — 400**

```json
{ "success": false, "error": { "code": "BAD_REQUEST",
  "message": "Template \"otp\" needs a value for 1 button(s): index 0 (\"Copy code\", COPY_CODE). Supply them as \"buttons\": [{ \"index\": 0, \"type\": \"url\", \"value\": \"...\" }]." } }
```

So the button is mandatory, and your API names it `COPY_CODE`.

### Attempt B — `type: "copy_code"` (as instructed)

```bash
-d '{"to":"+9199401*****","templateName":"otp","variables":{"1":"482913"},
     "buttons":[{"index":0,"type":"copy_code","value":"482913"}]}'
```

**Response — 400**

```json
{ "success": false, "error": {
  "code": "BAD_REQUEST",
  "message": "(#132018) There's an issue with the parameters in your template",
  "details": { "code": "META_API_ERROR", "meta": {
      "message": "(#132018) There's an issue with the parameters in your template",
      "code": 132018, "type": "OAuthException",
      "error_data": { "messaging_product": "whatsapp",
        "details": "buttons: Button at index 0 must be of type Url" },
      "fbtrace_id": "AqimFGINbqd6yTWxdvF9YLF" } } } }
```

### Attempt C — `type: "url"`

```bash
-d '{"to":"+9199401*****","templateName":"otp","variables":{"1":"482913"},
     "buttons":[{"index":0,"type":"url","value":"482913"}]}'
```

**Response — 400, identical Meta error:** `buttons: Button at index 0 must be of type Url`

Attempts B and C returning the same error is the key signal: the request's `type`
does not change what is sent to Meta.

---

## 4. Why we believe Meta is right

For **authentication** templates, WhatsApp's Cloud API expects the one-time-password
button — including the *copy code* variant — to be sent as a button component with
`sub_type: "url"`, carrying the code as its text parameter. It is not sent as a
`copy_code` sub_type the way a coupon button on a marketing template would be.

That is what Meta's error is asking for, in those words.

---

## 5. What our current provider sends (and it works)

We are migrating from another BSP. Against the **same template design** on our
other WhatsApp number, this exact payload has been sending OTPs in production for
months without failures:

```json
{
  "campaignName": "otp",
  "destination": "91XXXXXXXXXX",
  "templateParams": ["482913"],
  "buttons": [
    {
      "type": "button",
      "sub_type": "url",
      "index": "0",
      "parameters": [ { "type": "text", "text": "482913" } ]
    }
  ]
}
```

Note `sub_type: "url"` with the OTP as the parameter — matching Meta's error message.
The code appears twice on purpose: once for the body variable `{{1}}`, once for the
button.

---

## 6. Impact on us

This template is the gate on our booking flow: our payment endpoint refuses to
create an order without a verified OTP session. While `otp` cannot send, **no
customer can complete a purchase** through Wamafy. Everything else we have tested
works well — sends, delivery receipts, read receipts and the status webhook are all
behaving correctly.

---

## 7. What we are asking

1. Map the button to `sub_type: "url"` (with the supplied value as the text
   parameter) when the template's category is `AUTHENTICATION`, rather than
   `copy_code`.
2. Once fixed, please confirm which `type` we should send — we would prefer to keep
   sending `type: "copy_code"` and have you translate it, so the request describes
   the button as it appears in the template.

### Interim workaround — please confirm

If we recreate `otp` **without** the copy-code button (body only, `{{1}}` still
carrying the code), can it be sent with no `buttons` array at all? That would
unblock us while the mapping is fixed; we would only lose one-tap copy.

---

## 8. Anything else you need

Happy to re-run any of the above and share raw responses, or grant access to the
request log entries for this workspace. All three attempts above are in your
**Settings → API Access → Request log** on 2026-08-29.
