# Wamafy — getting button-click data into our own system

**From:** chapter அ (WABA "Join Chapter", 1438759947539827)
**Date:** 1 September 2026

## What we've already done

We migrated off AiSensy to Wamafy on 31 August and now log every send in our own
database, joined by the `messageId` your send response returns. Your status
webhook fills `delivered` and `read` against those rows and has worked perfectly
since day one — thank you, it was straightforward to integrate.

We then set up click tracking exactly as your docs describe:

- Template `invitation_with_tracking`, approved, two dynamic URL buttons
  ("Confirm", "Contact Us"), both submitted as `https://api.wamafy.com/r/{{1}}`.
- Sends pass the full destination URL as each button's `value`.

**It works end to end on your side.** A live test at 20:33 UTC on 1 September:

| | |
|---|---|
| messageId | `wamid.HBgMOTE4ODM4MTExNTY0FQIAERgSQTc1RjYzNjA3NEM2MEMyRjgzAA==` |
| template | `invitation_with_tracking` |
| sent | 20:33:19 UTC |
| delivered (your status webhook) | 20:33:25 UTC |
| button tapped | ~20:34 UTC |

The tap redirected correctly and carried our query string through to the
destination, so the click was certainly recorded on your side.

## The problem

**Nothing about that click ever reached us.** No webhook fired, and we can't find
an API that exposes it. Our reading of the docs says this is by design:

- The **status webhook** "pushes delivered / read / failed" — `clicked` is not
  among them, and nothing arrived on ours.
- **`GET /analytics`** returns "sent / delivered / read / failed / readRate" —
  no click metric.
- The click appears only as "a Clicked stage" on **the campaign's page in the
  dashboard**.

A number in your dashboard can't reach our admin panel, which is where our team
actually works. We show delivery state as WhatsApp-style ticks next to each
lead, and the click is the one signal that proves genuine engagement rather than
a message merely arriving.

## Questions

**1. Can the status webhook emit a `clicked` status?**

This is our preferred outcome by a distance. You already record the tap against
the exact recipient, and we already receive, verify and store `message.status`
callbacks. A `clicked` status on that same webhook would need no new integration
work from us at all — our handler already accepts it and has a column waiting.

**2. Is there any API that returns click state per message?**

Your docs mention `GET /messages` ("If you need at-least-once delivery, that is
what `GET /messages` and the Sent-messages CSV are for") but don't document it.
Does it — or `GET /contacts/:phone/messages` — include whether a tracked button
was tapped? If so, we can poll on a schedule.

**3. Is the campaign report's Clicked stage available over the API?**

You describe being able to "list who clicked and who was delivered but did not".
If that list is reachable programmatically, per campaign, that would work for us.

**4. Does click reporting require `campaignName` on the send?**

The report is described as living on the campaign's page. Our sends currently
pass `templateName` only, with no `campaignName`. If clicks are only aggregated
for sends filed under an API campaign, please say so — we'll start setting it,
and we'd rather know now than discover our click data was never being collected.

**5. Unrelated, but while we have you: does `read` depend on the recipient's read
receipts setting?**

In the test above, the recipient opened the chat and tapped the button, but no
`read` status ever arrived — only `delivered`. We assume this is WhatsApp's
normal behaviour when the recipient has read receipts turned off, but we'd like
to confirm, because it affects how we present "read" to our team. If a missing
`read` can mean "receipts disabled" rather than "not read", we should say so in
our UI rather than implying the message was ignored.

## Why it matters to us

We're a small team booking social experiences. Our staff decide who to call from
this panel. "The invite was delivered but never opened" and "they opened it and
clicked through" lead to two completely different conversations — one is a
delivery problem, the other is a pricing or interest problem. Right now we can
tell those apart for email, because Brevo pushes click events to our webhook, but
not for WhatsApp, which is our primary channel.

If a `clicked` webhook status is on your roadmap, even loosely, that alone would
be useful to know — we'd wait for it rather than build a workaround.
