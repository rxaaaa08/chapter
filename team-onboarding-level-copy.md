# Core team onboarding — full level copy (historical draft)

_Draft 1, 2026-07-21. Companion to `marketer-self-serve-onboarding-proposal.md`.
Every mechanism described below was verified against the code before writing
(retarget-check, cart-abandonment, resendInviteDetails, date-shift/waitlist).
Edit freely — this is meant to sound like you, not like me._

> Historical source draft. The shipped, owner-reviewed wording lives in Part E
> of `TEAM-ONBOARDING-COMPLETE-HANDOFF.md`; use that document for implementation.

**Demo event used throughout:** the real **"Chill Sunday Meetup"** — the event
a new marketer is actually assigned to first (owner's call). Real details,
verified in prod 2026-07-21: ₹359, **single payment**, meeting area
Nungambakkam at 11:00 AM, own transport, group size 25, runs on Sundays. Mock
dates: **Sun 2 Aug (Date A)** and **Sun 16 Aug (Date B)**. Default ₹50/ticket
commission applies (no per-event override). Demo customer = the trainee
themself (whatever name they enter in L2).

Conventions: **Screen copy** = words the trainee reads. **Mock** = what the
interactive piece shows and does, with exact toast/button text. **Check** = the
level's MCQ; ✅ marks the correct option (options are shuffled on screen).

---

## Welcome screen (before the map)

> **Welcome to the team behind chapter அ**
>
> We run small-group experiences and trips people genuinely love. Before anyone
> joins our core or support team, they start in sales — because sales is where
> you learn our customers: what they hope for, what they worry about, and what
> makes them finally say yes.
>
> This short training takes about 15 minutes. First you'll see what our
> customers see. Then you'll handle a booking yourself — every situation you'll
> actually face, one level at a time.

_(Vertical founder welcome video here — same Vimeo embed as the /plans
carousel.)_

Button: **Start training**

---

# Act 1 · Be the customer

_Map section label: **Act 1 · Be the customer**_

---

## L1 · What does a customer see on chaptera.in?

**Screen copy**

> Almost every lead you'll ever call found us the same way: they opened
> **chaptera.in/plans** from an Instagram link and browsed a plan.
>
> Take a look around the way a customer would. Open the **Chill Sunday
> Meetup** — the plan you'll most likely work first. Notice what they see —
> photos, what the meetup is like, who they'll meet, the meeting area
> (Nungambakkam), the dates, and the price (₹359).
>
> Two things to remember from this page:
>
> **1. The booking timeline.** After booking, every customer gets a simple
> step-by-step timeline for their plan. One step on it matters a lot: the
> **exact meeting spot is revealed on its own date**, closer to the day — the
> page shows the area (Nungambakkam), but the exact spot arrives in the
> timeline. Customers ask about this constantly; now you know where they're
> looking.
>
> **2. This site is your reference manual too.** When you're assigned to an
> event, chaptera.in/plans is where *you* check its details — dates, pickup
> points, pricing. If a lead asks something about the plan, the answer is on
> the same page they're looking at.

**Mock**

Replica of the /plans browsing flow, 3 screens: the plans list → Chill Sunday
Meetup details (photos strip, the quick-info block — group of 22, own
transport, Nungambakkam — both Sunday dates, price ₹359) → the
booking-timeline preview with the meeting-spot step visibly dated. Trainee
must open the details and scroll to the timeline before **Continue** lights
up.

**Check — Where do you check the plan details of events you're assigned to?**
- On chaptera.in/plans — the same page customers see ✅
- In a PDF the founder sends every week
- In the admin panel settings tab
- You memorise them during training

---

## L2 · Apply for the meetup yourself

**Screen copy**

> Time to be the customer. Pick your Sunday and apply for the Chill Sunday
> Meetup — exactly the way a real customer would.
>
> Don't worry: **this is practice.** Your application isn't sent anywhere.
> It stays inside this training.

**Mock**

Replica of the application form: name (pre-filled from Google, editable),
meeting point (Nungambakkam — 11:00 AM, the event's single real option,
pre-selected), date (Date A · Sun 2 Aug pre-selected — the training needs
them on Date A for L11's sold-out twist; Date B · Sun 16 Aug visible).
Button: **Apply**.

On submit, full-screen beat:

> **Application sent.**
> Right now, on a Team Dashboard, a new lead just appeared — yours.
>
> From this moment on, you're not the customer anymore.
> **You're the marketer. And your first lead is… you.**

Button: **Open my dashboard**

**Check — What does a customer do to book a spot?**
- They apply on the website with their date and pickup point, then pay when
  invited ✅
- They DM us on Instagram and pay there
- They call a marketer to book over the phone
- They pay first and choose a date later

---

# Act 2 · Be the marketer

_Map section label: **Act 2 · Be the marketer**_

---

## L3 · Who can see your leads?

**Screen copy**

> This is **My Leads** — your side of the admin panel. Your application from
> Act 1 is sitting right there.
>
> How did it become *yours*? Automatically. Every new application is dealt to
> one of the event's marketers in strict rotation — an even split, no
> favourites, no grabbing. The system did it the second the application came
> in.
>
> And the other side of that coin: **you only ever see your own leads.** Other
> marketers can't see yours, and you can't see theirs. Your leads, your calls,
> your commission.

**Mock**

The My Leads view with exactly one lead card: the trainee's L2 application
(their name, Sun 2 Aug, Nungambakkam, status `Pending`). A small diagram
above: 3 marketer avatars, incoming applications dealing out one-two-three in
rotation, one landing on "You".

**Check — How do new leads get distributed?**
- Automatically, split evenly between the event's marketers in rotation ✅
- The founder reads each one and picks a marketer
- Whoever calls the lead first keeps them
- Everyone sees every lead and shares the work

---

## L4 · What are all these tabs and cards?

**Screen copy**

> Quick tour of the People page — you'll live here.
>
> **Call** — your leads for the event, as cards. Everything you do starts here.
> **Doubts** — questions from people who haven't applied yet (more on these in
> a later level).
>
> One more thing worth knowing: the **team board**. It shows every marketer's
> tickets sold and earnings. Nothing is hidden — you always know exactly where
> you stand, and what the person ahead of you is doing differently.

**Mock**

The People page frame with tab chips (Call · Doubts) the trainee must tap
through; each tap highlights the tab and shows a one-line caption. Then the
team board card: 3 demo marketers with tickets + ₹ earned, "You" highlighted
at #2.

**Check — What does the team board show?**
- Every marketer's tickets sold and earnings — fully transparent ✅
- Only your own earnings, nobody else's
- The customers of every marketer
- The founder's profit on each event

---

## L5 · What do the lead statuses mean?

**Screen copy**

> Every lead card carries a status. The status tells you what's already
> happened — and what you should do next. Tap each one.

**Mock**

Interactive glossary. Main pipeline chips (tap to open a two-line
explanation):

- `Pending` — *They've applied and are waiting. Your move: call, make sure
  they're a fit, and approve them.*
- `Invited` — *You approved them; the payment link is with them on WhatsApp.
  Your move: stay close until they pay.*
- `Fully paid` — *Money received, spot confirmed. This is when you earn.*

Second row (badges and side-states):

- `Waitlist` — *Their date sold out before they could be invited. Not a dead
  lead — see the "date is full" level for the play.*
- `Rejected` — *Not a fit for this plan. Handled respectfully and closed.*
- `Cart abandoned` — *Opened the payment page, didn't finish. Your move: the
  trust call.*
- `Re-target` — *Invited over 24 hours ago and never even opened the payment
  page. Your move: resend + follow up.*
- `Recovered` — *Abandoned, then came back and paid. A save — it counts.*

All four main-pipeline chips must be tapped before Continue lights up.

**Check — A lead shows Pending. What does that mean?**
- They've applied and are waiting for you to call and approve them ✅
- They've paid and are waiting for event details
- The system rejected them automatically
- They asked a question but never applied

---

## L6 · What do you do with a new lead?

**Screen copy**

> Your lead — you, from Act 1 — is sitting at `Pending`. Here's the rhythm of
> the job:
>
> **Call first.** Say hi, answer their questions, make sure the meetup fits
> them. Then, if it's a yes —
>
> **Press Approve.** Watch what happens.

**Mock**

The trainee's lead card at `Pending` with an **Approve** button.

On tap → status animates to `Invited`, toast:

> **Invite sent — automatically.** The moment you approved, our WhatsApp
> system sent them the invite and the payment link. You never send payment
> links yourself. Ever.

Button appears: **Skip ahead — they pay ₹359** → status animates to `Fully paid`,
a commission counter ticks **+ ₹50**, toast:

> **This is the moment you earn.** A fixed amount for every fully-paid ticket
> — your dashboard always shows your exact rate.

Closing line under the card:

> That's the whole happy path: **call → approve → they pay → you earn.**
> The rest of this training is about the days when it doesn't go this
> smoothly.

**Check — Who sends the payment link when you approve a lead?**
- The system sends it on WhatsApp automatically — I never send payment links ✅
- I copy the link and WhatsApp it from my phone
- The founder sends it at the end of the day
- The customer requests it by emailing us

---

## L7 · What does the lead get after paying?

**Screen copy**

> The moment your lead pays, three things land on their side:
>
> **A WhatsApp confirmation** — their booking is locked in.
> **A receipt** — proof of payment, on the same page they paid on.
> **Their booking timeline** — the step-by-step plan for the day.
>
> And remember the timeline's special step from Act 1: they know the area
> (Nungambakkam), but the exact **meeting spot arrives on its own reveal
> date**, closer to the day. So when a paid lead messages you asking *"where
> exactly in Nungambakkam do we meet?"* — you know the answer: *"it'll appear
> in your timeline on the reveal date."* You'll get this question a lot. Now
> it's an easy one.

**Mock**

Split view: left = the lead card at `Fully paid`; right = "what they see":
WhatsApp confirmation bubble, receipt snippet, and the timeline with the
meeting-spot step showing its date. Tapping the meeting-spot step pops the
caption: *"Revealed on this date — not before. Even you don't need to know it
earlier."*

**Check — A paid customer asks "where exactly do we meet?" What's the answer?**
- The exact spot appears in their booking timeline on its reveal date ✅
- You tell them the spot on the call — you always know it
- They should email support to get the address
- The spot was in their payment receipt

---

## L8 · What if they don't pay after the invite?

**Screen copy**

> You approved them, the invite went out… and then: silence.
>
> Here's something important about automatic messages: **they can fail.**
> WhatsApp delivery isn't guaranteed — and some people see the message and
> simply drift. Either way, a silent lead is *not* a lost lead.
>
> The system watches for exactly this: if it's been **24 hours since the
> invite** and the lead has **never even opened the payment page**, the card
> gets a `Re-target` badge.
>
> Re-target leads unlock a button the others don't have: **Resend details.**
> One tap re-sends the full invite — on **WhatsApp and email both** — and
> shows a tick for each channel once it's gone out. Two ways to reach them,
> so a delivery failure can't kill the deal.
>
> Then comes the part no system can do: **your follow-up call.** "Hi! Just
> making sure the details reached you — anything I can clear up?" That one
> call closes more silent leads than any reminder ever will.

**Mock**

The lead card wearing the `Re-target` badge, with the **Resend details**
button. On tap: two rows animate in — *WhatsApp ✓ sent* then *Email ✓ sent* —
becoming the double tick on the card. Caption: *"Both channels, one tap. Now
make the call."*

**Check — A lead is flagged Re-target. What can you do that you can't do on
other leads?**
- Use Resend details to re-send the invite on WhatsApp and email in one tap ✅
- Send them the payment link from my personal WhatsApp
- Approve them a second time
- Move them to another marketer

---

## L9 · What if they start paying… and stop? (or offer cash?)

**Screen copy**

> The opposite case: they *did* open the payment page — and then stopped.
> Cold feet about paying online. A UPI app that hung. A phone call that
> interrupted. It happens all the time.
>
> If a lead opens the payment page and doesn't finish, the card gets a
> `Cart abandoned` badge — and the system automatically sends them a WhatsApp
> nudge (and an email if we have one) with a link straight back to their
> payment.
>
> Your job is the **trust call.** Reassure them the payment page is our
> official one. Stay on the phone while they retry. When they complete it,
> the badge flips to `Recovered` — a save, and it counts just like any other
> paid ticket.
>
> One rule with no exceptions: **we never take cash, and never personal
> UPI.** Every rupee goes through the official payment link. If a lead says
> *"can I just GPay you directly?"* the answer is a friendly no — *"our
> payment link is the only way, and it's also your booking confirmation and
> receipt."* Collecting money any other way is the fastest way off this team.

**Mock**

The lead card wearing `Cart abandoned`, with the auto-nudge shown as a small
WhatsApp bubble beneath: *"Your Chill Sunday Meetup spot is still waiting —
complete your payment here."* Button: **You called them — they finish paying** → badge
animates to `Recovered`, toast: *"A save. Recovered leads count exactly like
any other paid booking."*

**Check — A lead says "can I just GPay you the amount directly?" What do you
say?**
- Friendly no — every payment goes through the official payment link, no
  exceptions ✅
- Yes, if they send a screenshot as proof
- Yes, but only for amounts under ₹500
- Ask the founder for permission first

---

## L10 · The two kinds of doubts — and whose lead is it after?

**Screen copy**

> People ask questions in two different places, and they land on your panel
> in two different ways:
>
> **Asked *before* applying** → lands in the **Doubts tab**. They were
> browsing the website, had a question, and asked it without applying.
>
> **Asked *after* being invited** (or after paying) → appears as an **amber
> card pinned to their lead** in the Call tab. The question travels with the
> person.
>
> Either way, you answer over WhatsApp or a call. And here's the question
> every new marketer asks: *"if I solve someone's doubt and they then apply —
> whose lead are they?"* **Yours.** The person stays with the marketer who
> helped them, from doubt to application to payment.
>
> One honest detail: a doubt shows **Applied ✓** only when the person
> actually submits an application. There's no "mark as done" button — the
> tick appears when the real thing happens.

**Mock**

Side by side: a Doubts-tab card (*"I'd be coming alone — will it be
awkward?" — asked before applying*) and the trainee's own lead with an amber
doubt card pinned (*"Can I bring a friend along?" — asked after invite*).
Tapping the Doubts card shows the caption chain: *you answer → they apply →
**Applied ✓** appears → the lead lands on YOUR list.*

**Check — You answer someone's doubt and they apply the next day. Whose lead
are they?**
- Mine — the person stays with the marketer who helped them ✅
- Whoever the rotation assigns next
- The founder decides case by case
- Nobody's — doubt-askers aren't leads

---

## L11 · What if their date is full — or they want a different one?

**Screen copy**

> Spots are counted **per date**, not per event. The meetup is a group of 22
> — so the 2 Aug Sunday can sell out while 16 Aug still has room. It happens
> often.
>
> When a date fills up, people who applied for it land on the **Waitlist**.
> Most new marketers read "waitlist" as "dead lead." It's the opposite —
> **the waitlist is your hottest follow-up list.** These people already
> decided they want to come. They're one phone call away from a booking.
>
> The play: call them, offer the other date — *"the 2nd filled up fast, but
> I've got spots on the 16th — same meetup, same spot"* — and if they're in,
> **shift their date right from the lead card.** The system moves them off
> the waitlist automatically.
>
> Same tool works for anyone who just wants to switch dates. One limit:
> **paid leads can't be shifted.** Once money has moved, changes go through
> the founder.

**Mock**

The trainee's lead shown waitlisted: Date A (Sun 2 Aug) with a **Sold out**
tag, status `Waitlist`. Instruction: *"Call them, pitch the 16th… they said
yes. Shift the date."* Trainee taps **Change date → Sun 16 Aug** → toast
(real one from the panel): *"✓ Date updated · moved off waitlist"* → card now
shows Date B, status `Invited`.

**Check — Date A is sold out and your lead is on the waitlist. What's your
play?**
- Call them, offer date B, and shift their date — the system takes them off
  the waitlist ✅
- Nothing — waitlisted leads are closed
- Ask them to apply again from the website for date B
- Refund them so they can rebook

---

## L12 · Where's your money, and when does it arrive?

**Screen copy**

> Every fully-paid ticket earns you a **fixed amount per ticket**. The
> default is ₹50 — some events set their own rate — and your dashboard always
> shows your exact number, so there's never a surprise.
>
> Your **earnings banner** sits right on top of My Leads: how much you've
> earned this month and how many tickets you've sold. It updates the moment
> a lead hits `Fully paid`.
>
> When does it reach your account? **A few days after the event happens** —
> not instantly at booking. The event runs, then you're paid for it. And your
> earnings history never changes after the fact: what you see is what you
> get.

**Mock**

The commission banner (*"₹350 earned this month · 7 tickets"*) with a small
timeline underneath: **booking → event happens → payout a few days later**,
the payout node pulsing. Tapping the banner pops: *"Updates the moment a lead
hits Fully paid."*

**Check — When does your commission reach your account?**
- A few days after the event happens ✅
- Instantly, the moment the lead pays
- On the 1st of every month
- Whenever I request a withdrawal

---

## L13 · How we sound — and the rules

**Screen copy**

> Last level. This one's about who we are on the phone.
>
> chapter அ is a club people *want* into — not a call center chasing
> targets. So we never sound pushy, and we never sound desperate. No
> pressure lines, no fake urgency, no begging. We help people decide;
> we don't corner them. A lead who says "not this time" gets a warm
> "no problem — next one, then," and remembers us kindly.
>
> And the rules that keep this whole thing trustworthy:
>
> **Customer details are confidential.** Names and numbers never leave the
> panel — no personal contact lists, no adding leads to groups, no sharing.
> **Contact only through the booking process.** Calls and messages about
> their booking — nothing else.
> **Only your own leads, ever.**
>
> You'll confirm this in writing on the next screen. Break these and the
> seat goes to someone on the bench — simple as that.

**Mock**

**Founder voice notes** — reusing the /plans "Founder's Note" player
(`AppFlow.tsx:3710`: gold scalloped button + tappable waveform, lazy-loaded
audio). Two to three short recordings by the founder, each with a one-line
caption, e.g.:

1. *"How I open a call"* — the warm first 20 seconds.
2. *"When they hesitate"* — giving room without losing the lead.
3. *"When it's a no"* — closing warmly so they come back next time.

_(Owner records these — suggested scripts below, but improvised real-sounding
takes beat scripts. ~20–40 seconds each.)_

Under the voice notes, one tap-to-reveal contrast pair as a recap:
- *"Sir, only 2 spots left, book in the next 10 minutes or lose it!"* →
  **Not us.** Fake urgency reads as desperation.
- *"Take your time — want me to hold the details on WhatsApp so you can
  decide tonight?"* → **That's us.** Helpful beats pushy, every time.

**Suggested voice-note beats (for the founder's recording session):**
- Note 1: greet by name → one genuine question about them → *then* the plan.
- Note 2: acknowledge the hesitation out loud, offer to hold details on
  WhatsApp, name a real follow-up time — no countdown, no fake scarcity.
- Note 3: a graceful "no problem — next one, then," + leaving the door open.

**Check 1 — A lead keeps hesitating on the call. What's our style?**
- Give them room, answer honestly, follow up warmly — never pressure ✅
- Create urgency: say spots are almost gone even if they aren't
- Offer a secret discount to close them today
- Hand them to another marketer to try harder

**Check 2 — Whose leads can you see in the panel?**
- Only my own — and other marketers can't see mine ✅
- Everyone's, so we can help each other
- My own plus the founder's
- Anyone's, if I ask nicely

---

## Map finale (after L13)

> **That's the job.** You've seen what the customer sees, handled a lead from
> Pending to paid, chased the silent ones, saved an abandoned payment, and
> turned a sold-out date into a booking.
>
> One last step: your details — so we know who you are and where to pay you.

Button: **Finish up →** _(leads into the details form)_

---

## Details form

> **Your details**
>
> Signing up as **{google email}** — this is the account you'll always log
> in with.

- **Your name** — placeholder: *"As you'd introduce yourself on a call"*
- **Phone number** — helper: *"The WhatsApp number we'll reach you on."*
- **UPI ID** — label: *"UPI ID (so we can pay your commission)"* —
  placeholder: *"yourname@bank"*
- ☑️ **The agreement** — *"I agree to keep customer details confidential,
  contact leads only through the booking process, and collect payments only
  through the official payment link."*

Button: **Join the team**

_(On tap, the signup function re-verifies everything server-side and enrolls
them on the spot — both panel-access rows created in one atomic transaction.)_

---

## "You're in" screen

> **You're on the team.**
>
> Your Team Dashboard is live — this is the real thing now, not practice.
>
> One heads-up so the quiet start doesn't worry you: leads arrive when you're
> **assigned to an event**, and events are staffed as they need people. An
> empty dashboard today is normal — it means you're on the roster, ready to
> be staffed. We'll reach out on WhatsApp when your first event comes up.

Button: **Open my Team Dashboard** _(→ /admin, already signed in; lands on the
empty My Leads with the coaching empty state + Training card)_

---

## Appendix A — field-guide one-liners (the reference card)

| Status | One-liner |
|---|---|
| Pending | Applied, waiting for your call and approval. |
| Invited | Approved — payment link is with them. Stay close. |
| Fully paid | Money in, spot confirmed — you've earned. |
| Waitlist | Their date sold out. Call → offer the other date → shift. |
| Rejected | Not a fit. Closed respectfully. |
| Cart abandoned | Opened the payment page, didn't finish. Make the trust call. |
| Re-target | 24h since invite, never opened the payment page. Resend + call. |
| Recovered | Abandoned, then paid. A save — counts fully. |

## Appendix B — facts the copy relies on (verified in code, 2026-07-21)

- Re-target: flagged by a 30-min cron when `invited` + invite sent ≥24h ago +
  the bill page was **never opened** (`retarget-check`). Mutually exclusive
  with cart-abandoned by construction.
- Cart abandoned: bill page opened, unpaid past the window (invite events
  ~2h) → flag + automatic WhatsApp nudge, plus email when on file
  (`cart-abandonment`).
- Resend details: Re-Target leads only; sends WhatsApp + email with
  per-channel sent-ticks (`AdminPanel.tsx:1407`).
- Date shift: `AdminPanel.tsx:1370` — shifting a waitlisted lead auto-moves
  them off the waitlist (real toast: "✓ Date updated · moved off waitlist").
  "Paid leads can't be shifted" is the house rule taught here.
- Commission: default ₹50/ticket, per-event override possible; ledger
  snapshots at sale time (never changes retroactively). Payout timing ("a few
  days after the event") is the owner's stated practice, not system-enforced.
- Meeting-spot reveal: per-date booking steps; the meeting-spot step carries
  its own date (canonical step index 3).
- Demo event is the real **Chill Sunday Meetup** (`anna-nagar-meetup`),
  verified in prod 2026-07-21: `payment_mode='full'`, ₹359 (Chennai
  city-detail price; event-level price_full is 0 — pricing lives in
  `city_details`), single meeting point (Nungambakkam — 11:00 AM, own
  transport), group size 22, Sunday dates, no `marketer_commission` override
  → default ₹50 applies. At build time, re-check price/points against the
  live event so the mock never drifts from what trainees will actually be
  assigned to.
