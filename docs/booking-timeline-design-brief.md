# Design brief — booking timeline rework

You are doing a **design pass**, not an implementation pass. No production code, no database changes, no commits. Produce mockups, options with tradeoffs, and a recommendation. The person you're working with is a **no-code founder** — plain language throughout, and never assume they can edit code themselves.

## The product

chapter அ is a mobile-first social-experiences booking webapp (React + Vite + TypeScript, Supabase, PayU, AiSensy WhatsApp) selling curated real-world meetups and trips in India. Most traffic arrives from Instagram, much of it inside the Instagram in-app browser. Phone-first; there is no meaningful desktop experience.

## What the booking timeline is

Inside the event details overlay there's a card that lays out what happens and when: request an invitation, pay, receive your meeting spot, event day. It's the customer's mental model of the whole transaction, and it's the last thing they read before opening the calendar sheet to book.

**It is data, not hardcoded UI.** Steps live in `event_dates.booking_steps` (JSONB, per date) with an event-level fallback, and the founder edits them by hand in the admin panel. Each step is:

```
{ label: string, value: string, date: string }
```

Rendering rules as they exist today (`src/AppFlow.tsx` ~2655–2730):

- `value` supports placeholders resolved at render time: `{advance}`, `{balance}`, `{price}`, and `{application_count}`.
- Row 0 renders with a green **"Now"** pill.
- Later rows render a gray pill reading **`by Mar 12`**, built from `step.date`.
- There is already one case where that date pill is replaced by words: invite-only advance rows show **"After Invitation"**, because the customer can't pay until they're approved so a calendar date would be meaningless (`src/AppFlow.tsx` ~2718).
- The row whose label contains `{application_count}` is a **hidden marker row**: it gets pulled out of the list and rendered as a yellow title card with social proof ("47 ppl have requested invitation") rather than as a numbered step.

Canonical defaults are generated in `src/AdminPanel.tsx:157`. For a split-payment invite event they are:

1. `vibe check` / `Request Invitation`
2. `if you're invited (advance)` / `{advance}`
3. `remaining balance` / `{balance}`
4. `you'll receive exact` / `Meeting Spot Details 📍`
5. `{application_count} ppl have requested invitation` / *event title* — the hidden marker row

## Why this is being reworked now

A new feature called **pay at venue** is being added. On a split-payment event with the flag on, the guest pays a small advance online to reserve (say ₹100 of ₹299) and pays the rest **at the venue** — still an online payment on the same website, just made on their phone standing in front of the host, after they've arrived and seen the event is real. It's a trust device for a market where people are wary of paying a brand they've never met.

For the timeline, that means the `{balance}` row can no longer show a date. It needs to say something like **"At the venue"** — exactly the way the advance row already says "After Invitation".

That's the trigger. The founder's ask is broader: **rework the timeline**, with pay-at-venue as the reason to finally look at the whole thing.

## The variants that must all keep working

This is the real difficulty. One data structure serves four existing combinations, and pay-at-venue adds a fifth:

| Event type | Payment | What the timeline shows today |
|---|---|---|
| Invite-only | Split | Request invitation → advance ("After Invitation") → balance (dated) → meeting spot → title card |
| Invite-only | Full | Request invitation → full price ("After Invitation") → meeting spot → title card |
| Open | Split | Pay advance ("Now") → balance (dated) → meeting spot → title card |
| Open | Full | Rows are **rewritten at render**: row 0 becomes "settle payment / {price}", row 1 becomes "you'll receive exact / Meeting Spot Details", balance rows are filtered out, and the last row is treated as the event-date card |
| **Either** | **Split + pay at venue** | **New — this is what you're designing** |

A design that only works for the open split case is not a solution.

## Load-bearing constraints — read before proposing anything

Some of what looks like copy is functionally load-bearing. Getting this wrong silently breaks payments messaging.

**Free to change:** the `label` text of any row. It's display-only.

**Not free to change:**

1. **The `{balance}` placeholder in the row's `value`.** Four separate places identify the balance row by matching `balance` in the label-plus-value string, including `pickBalanceDueStep` inside the `payu-callback` edge function (`supabase/functions/payu-callback/index.ts:107`), which is what fills in the due date in the WhatsApp message a customer gets after paying. Keep `{balance}` as the value and you can rename the label freely — that's your escape hatch.
2. **Row position.** Two places read steps by hardcoded index: `bookingSteps[2]` for the balance date and `bookingSteps[3]` for the meeting-spot date (`src/App.tsx:2598`, `:2611`). Reordering rows breaks those silently. If a proposal needs a different order, say so explicitly and loudly — it's doable, but it's engineering work with real risk, not a copy change.
3. **Split events must contain a `{balance}` row and full-payment events must not.** The admin auto-heals steps that don't match (`src/AdminPanel.tsx:178`), so a design that removes the balance row from a split event will be undone by the code.

## Where the timeline (or pieces of it) renders

- **Event details overlay** — the main card, `src/AppFlow.tsx` ~2655–2730. This is the primary surface.
- **The PayU bill page** builds its own step list from the same data, including a balance row with a due date (`src/App.tsx` ~3335–3363).
- **The meeting-spot and balance dates** are pulled out individually for display elsewhere in the invite flow (`src/App.tsx:2598`, `:2611`).
- **The WhatsApp confirmation** after an advance payment reads its due date from the balance row via the edge function above.
- **The admin editor** is where the founder types all of this, per date, by hand.

A change to the shape of the timeline touches all of these, so treat "what does the admin have to type to make this work" as part of the design, not an afterthought.

## The founder's proposed shape for open + pay at venue

The founder has already sketched a four-row timeline for this variant, and it should be the starting point:

| Row | Label | Right-hand pill |
|---|---|---|
| 1 | advance | Now |
| 2 | you'll be added to plan groupchat | after advance payment |
| 3 | remaining balance | pay at venue |
| 4 | *event name* | *event date* |

The reasoning behind row 2 is the heart of it: guests are added to the WhatsApp group chat right after paying, and being in a group with other real people is what convinces them they haven't been scammed — which is precisely what makes them willing to pay the rest at the venue. The group chat is the trust device; the timeline should promise it early.

**Three findings about this shape, already verified in code:**

1. **The group chat is currently gated on `fully_paid`, and the founder has decided to change that.** Both render paths check `isFullyPaid && whatsappGroupUrl` (`src/App.tsx:2800`, `src/InvitePlanDetailsSheet.tsx:365`). On today's open events that's invisible, because they are all single-payment — one payment *is* full payment. **Decision made: paying the advance unlocks the group chat and the meeting spot.** The founder's framing: the ₹100 is a deposit that buys full access, not a partial purchase — a customer who doesn't trust the brand yet pays half, joins the group, sees other real people, sees the meeting spot, and settles in person. That is the product, and row 2 states it. Design accordingly. (Mechanism note: Meta blocks `chat.whatsapp.com` links in AiSensy template buttons, so the WhatsApp links back to the site and the site relays the real group URL.)
2. ✅ **Keeping `remaining balance` in third position is correct and lucky.** It leaves the balance row at index 2, where two pieces of code look for it by position, and preserves the `{balance}` placeholder the WhatsApp due-date lookup matches. Do not reorder these rows without reading the constraints section above.
3. ⚠️ **The shape drops the meeting-spot row, which three things read** — `bookingSteps[3]` (`src/App.tsx:2598`), a regex lookup in the plan details sheet, and `pickMeetingSpotStep` in `payu-callback`. With it gone, index 3 becomes the event-name row, so position-based readers get the event date instead of the details date. The founder's proposed fix is to stop deriving that date at all and pass a literal phrase — **"one week before the event"** — as the WhatsApp parameter. That works (template parameters are plain text) **provided the template's fixed wording accommodates a phrase rather than a date**; "details on {{2}}" would read "details on one week before the event". Changing that fixed text requires WhatsApp re-approval.
4. **Row 4 will not automatically render as the yellow event card.** That treatment comes from the hidden `{application_count}` marker row, and the fallback promoting the last row to the yellow card only fires when the event is open **and** single-payment. On open + split it does not apply.

## Rough edges worth considering in a rework

Not requirements — but if the timeline is being reopened, these are the things that are genuinely awkward today:

1. **The hidden marker row.** The founder has to know that a row whose label contains `{application_count}` will vanish from the step list and reappear as a yellow title card. Nothing in the admin explains this. For open single-payment events there's a fallback that assumes the *last* row plays that part.
2. **Render-time rewriting.** On open full-payment events, rows 0 and 1 are overwritten at display time regardless of what the founder typed. What they enter is not what customers see.
3. **Two sources of truth for the same rows.** Some code finds the balance row by regex, other code by index 2. They can disagree.
4. **Row 0 always gets the green "Now" pill** whatever it contains.

## Deliverable

Mockups of the reworked timeline covering **every variant in the table above**, with the pay-at-venue case designed properly rather than bolted on. Show the current state beside the proposed state so the founder can see exactly what changes. Where a real choice exists, give options with tradeoffs and a recommendation.

Be explicit about anything that requires reordering rows or changing a `value` placeholder, and flag it as carrying engineering risk rather than presenting it as free.

Close with a plain-language walkthrough of what a guest sees, top to bottom, on a ₹100-now / ₹199-at-the-venue event — and a short note on what the founder would have to type in the admin to produce it.
