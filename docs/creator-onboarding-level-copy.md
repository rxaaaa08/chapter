# Creator onboarding — full level copy (draft for owner review)

_Draft 1, 2026-07-21. Companion to `creator-onboarding-demo-proposal.md`.
Every fact below was verified against the code before writing
(`CreatorDashboard.tsx`, `CreatorUpcomingEvents.tsx`, `CreatorOnboarding.tsx`,
`creator-signup`). Edit freely — this is meant to sound like you, not like me._

**Demo event throughout:** "Gokarna Beach Weekend" · ₹1,999 · commission
**₹160 per booking** (8% of ₹1,999). Demo follower = "Priya". Demo creator =
the trainee: their Google first name, plus the handle they type in L1's
"try your handle" box (cosmetic only — the real handle is claimed on the
details form). `{handle}` below means that typed handle.

Conventions: **Screen copy** = words the trainee reads. **Mock** = what the
interactive piece shows and does, with exact button/caption text. Levels have
**no questions** — all checking happens in the final quiz (its copy is at the
end, questions unchanged from the built flow).

---

## Welcome screen (the video step, before the map)

> **Welcome — let's get you earning**
>
> chapter அ runs small-group experiences and trips people genuinely love —
> and creators like you are how the right people find us.
>
> Watch the welcome video, then play through a short demo (about 6 minutes).
> You'll see exactly what your followers see, watch a booking turn into your
> commission, and set yourself up to earn from your very first post.

_(Vertical founder welcome video here — the existing 9:16 Vimeo embed. Now
that the levels teach the mechanics, the video only needs to be short and
warm: who we are, what the experiences feel like, why we pay creators well,
"see you inside." Suggested length: 45–90 seconds.)_

Button: **Start the demo**

---

## The map screen

Two act labels over an 8-node path:

> **Act 1 · Be your follower** — see exactly what your audience experiences.
> **Act 2 · Be the creator** — your money, your dashboard, your playbook.

Completed levels get a ✓, the next one pulses, later ones are locked.

---

# Act 1 · Be your follower

---

## L1 · How a follower reaches your link

**Screen copy**

> First, type the handle you're thinking of — we'll use it everywhere in this
> demo. _(input: `@ ______` · helper: "Just for the demo — you'll claim your
> real handle at the end." · skip link: "use my name for now")_
>
> Now meet Priya — she just watched your reel about Gokarna. Your caption
> says: *"comment LINK and I'll send you everything."*
>
> Watch what happens when she does.

**Mock**

Scene 1 — the reel: trainee's avatar + `@{handle} · reel`, reel text *"Gokarna
last weekend was unreal — comment LINK and I'll send you everything"*, Priya's
comment pinned at the bottom: `Priya: LINK`. Button (pulsing): **Priya
comments "LINK"**.

Scene 2 — the auto-DM: a DM thread from `@{handle}`, sub-label *"auto-DM ·
sent in seconds"*. Message bubble:

> Hey Priya! Everything about the Gokarna trip — the plan, dates, and
> booking, all in one place:

Two buttons: **I need more details** · **Book Now** — with a small caption
under them: *"both buttons → chaptera.in/@{handle}"*. Tapping **either**
button advances.

Scene 3 — the club page: a mini replica of the experiences page (3 event
cards, Gokarna on top) with a tag: **came from @{handle}**. Caption:

> Whichever button she tapped, she lands here — the full chapter அ page. It
> answers her questions AND takes her booking. That's why there's only ever
> **one link: yours.** No per-event links, no payment-page links.
>
> _(How to set up this auto-DM for your own reels — and why the two buttons —
> is a later level. For now, stay in Priya's shoes.)_

Button: **Continue**

---

## L2 · Watch a booking become your money

**Screen copy**

> Priya's on the Gokarna page — and notice the little tag riding along:
> **came from @{handle}**. As long as that tag is there, whatever she books
> is credited to you.
>
> Walk her through it.

**Mock**

Scene 1 — browsing: the Gokarna card ("dates, pickup points, ₹1,999") with
the tag visible. Button: **Priya applies**.

Scene 2 — applied: *"✓ Application sent. The payment page opens…"* Button:
**Priya pays ₹1,999**.

Scene 3 — the payoff: booking-confirmed check, then a green counter animates:

> **+₹160**
> your commission · 8% of ₹1,999

Below the phone, one always-visible button: **What if she books next week
instead?** Tapping it hides the tag and shows:

> The "came from @{handle}" tag is gone — she came back directly, in a new
> visit. Commission: **₹0.** The booking has to happen in the visit your link
> started. (One more reason the auto-DM works so well: the link — and the
> booking — happen right there, in the moment.)

Button: **Continue**

---

# Act 2 · Be the creator

---

## L3 · Your money math

**Screen copy**

> You earn **up to 8% of the full ticket price** on every booking that comes
> through your link. Tap the events to see your cut.

**Mock**

A tap-through price strip — three demo events, each card flips on tap:

- Gokarna Beach Weekend · ₹1,999 → **your cut: ₹160**
- Sunrise at Kovalam · ₹900 → **your cut: ₹72**
- Pondy Beach Houseparty · ₹1,499 → **your cut: ₹120**

Below, three chips (all must be tapped before Continue lights up):

- `Click` → *₹0. Clicks show reach, not income.*
- `Sign-up` → *₹0. Interest isn't income either.*
- `Fully paid` → ***This* is when you earn. Every time.*

Closing line:

> Commission runs on events where creator earnings are switched on — your
> dashboard always shows the exact per-event number, so there's never a
> surprise.

---

## L4 · Your dashboard — a guided poke-around

**Screen copy**

> This is your dashboard — the real one, with demo numbers. You'll find it
> anytime at **chaptera.in/creator**. Three things to tap.

**Mock**

A replica of the live dashboard: earnings hero ("Earned in July · ₹800.00 ·
Paid out monthly."), funnel tiles, conversions card, link card. Three guided
taps (all required):

1. The funnel tiles — `Clicks 120 · Sign-ups 14 · Paid 5`. Tapping each shows:
   - *Clicks: 120 people opened your link. Pays ₹0.*
   - *Sign-ups: 14 applied. Still ₹0 — interest isn't income.*
   - *Paid: 5 fully paid — the only tile that pays. 5 × ₹160 = ₹800.*
2. A conversion row — *"Gokarna Beach Weekend · 5 tickets · ₹800 · ₹160 per
   ticket. Every rupee, itemised per event."*
3. The **Copy** button on the link card — *"chaptera.in/@{handle} — the one
   link you'll ever share. This button is how it gets everywhere."*

Small footer: the Team leaderboard peek — *"and yes, there's a leaderboard.
Everyone sees everyone's tickets and earnings — including yours."*

---

## L5 · When does the money reach you?

**Screen copy**

> Simple rule: **you're paid monthly.** Everything you earn in a month is
> paid out after the month closes — straight to your UPI.

**Mock**

The earnings hero ("Earned in July · ₹800.00") over a three-node timeline,
each node tappable:

- **Bookings all month** — *every fully-paid booking adds to your July total,
  the moment it's paid.*
- **Month closes** — *your July number locks.*
- **Paid to your UPI** — *that's why we ask for your UPI ID at signup — it's
  where your money goes.*

---

## L6 · What should you actually post?

**Screen copy**

> Your dashboard answers this for you. The **"See upcoming events"** card
> lists every experience you can promote — with dates, and what each booking
> pays you.

**Mock**

The real upcoming-events card with demo events (*"3 to promote · earn up to
₹160 per booking"*); expanding shows rows with "₹X per booking"; tapping a
row opens the real plan-details sheet (the same one customers see). Caption:

> This card is your what-to-post radar. Post about what's coming up — your
> one link does the rest.

Then two copy-paste demo captions (tap to copy):

1. *"went with this crew to gokarna last month — easily the best weekend of
   my year. next dates are up, link takes you to everything 🌊"*
2. *"if you've been waiting for a sign to actually go — this is it. comment
   LINK and I'll DM you the details."*

_(Owner: rewrite these two in your own voice — they're the seed of the
"starter kit".)_

---

## L7 · Comments → auto-DM: the setup that books the most

**Screen copy**

> Remember how Priya reached your link in level 1? Comment → auto-DM. Now
> set it up from your side.
>
> **The play:** set your reels to auto-DM anyone who comments a keyword
> (like "LINK"). The DM carries your link — so the link goes *to them*,
> right in the moment they're interested.
>
> **The two buttons.** Give your auto-DM two buttons — **"I need more
> details"** and **"Book Now"** — and point **both at your same link.**
> Different people are in different mindsets when they tap; your chapter அ
> page serves both — it answers the details *and* takes the booking. Never
> two different links. One link: yours.
>
> **This is optional.** Your link in your bio works too. But we've tested
> both, and **auto-DM books more than bio** — nobody has to dig through your
> profile to find the link.
>
> **The tool we suggest: Superprofile** — it handles Instagram
> comment-to-DM automations well.

**Mock**

Left card — **Link in bio**: watches your reel → opens your profile → finds
and taps the bio link → club page. Footer: *"three hops — works, but people
drop off along the way."*

Right card (accented, badge **"Tested: works better"**) — **Comment →
auto-DM**: comments "LINK" → auto-DM arrives (two buttons, one link) → club
page. Footer: *"the link comes to them — nothing to hunt for."*

Button: **Walk both paths** — steps light up in parallel; the bio path fades
a little at each hop, the auto-DM path stays bright.

Below, a "your auto-DM" builder card the trainee can look at (pre-filled,
read-only) — the template they can copy into Superprofile later:

> Hey! Everything about the trip — the plan, dates, and booking, all in one
> place: `chaptera.in/@{handle}`
> [ I need more details ] → `chaptera.in/@{handle}`
> [ Book Now ] → `chaptera.in/@{handle}`

---

## L8 · How we sound

**Screen copy**

> Last one — and it's about taste.
>
> chapter அ is a club people *want* into, and your audience follows you
> because they trust you. So we never run fake urgency, invented discounts,
> or "use my code" bait — there are no codes. There's your link, the real
> price, and your honest word that the experience is worth it.

**Mock**

One tap-to-reveal contrast pair:

- *"90% OFF if you book in the next 10 minutes!!"* → **Not us.** Fake
  urgency burns your audience's trust — and ours.
- *"went with this crew last month — booking through my link if you want
  in."* → **That's us.** Honest beats loud, every time.

Button: **Finish the demo →** _(leads into the final quiz)_

---

## Final quiz screen

_(The built quiz, unchanged — same 5 questions, same options, same
all-correct gate, options shuffled. Only the intro line and the wrong-answer
hints are new copy.)_

Intro:

> **Quick check — 5 questions.**
> Everything here is something you just played through. All five right to
> continue.

The questions (✅ = correct, tokens frozen — never edit these without
updating client `CORRECT` and server `QUIZ_ANSWER_KEY` together):

1. **When do you actually earn a commission?**
   → When someone books a ticket through my link ✅ _(hint on wrong: "Take
   another look at **Watch a booking become your money**.")_
2. **How much do you earn per booking?**
   → Upto 8% of the full ticket price ✅ _(hint: "Take another look at
   **Your money math**.")_
3. **When do creators get paid?**
   → Monthly ✅ _(hint: "Take another look at **When does the money reach
   you?**")_
4. **How will you check your creator dashboard?**
   → Visit chaptera.in/creator ✅ _(hint: "Take another look at **Your
   dashboard**.")_
5. **Where does your link send people?**
   → To the chapter அ website, where people can check details and book ✅
   _(hint: "Take another look at **How a follower reaches your link**.")_

Each hint renders with a one-tap "reopen this level" link; quiz answers are
preserved while they revisit.

---

## Details form

_(As built, with one helper-line addition on UPI. Kept here for the complete
read-through.)_

> **Your Details**
> Signing up as **{google email}** — this is the account you'll always log
> in with.

- **Your name / brand** — placeholder: *"e.g. Tamil Trekker"*
- **Choose your handle** — helper: *"Your link will be
  chaptera.in/@{normalized}"* (taken-handle error appears on submit, as
  built). If they typed a demo handle in L1, pre-fill it here — first
  moment of delight: the handle they've been seeing all demo is one tap
  from real.
- **Enter your UPI ID (so we can pay you)** — NEW helper line: *"Remember
  the payout step from the demo? This is where your monthly earnings land."*
- **Phone number** — as built (required, 10 digits).

Button: **Create my creator account**

---

## After signup

They land straight in the real dashboard (as built — the row now exists).
Two small touches worth adding:

- A one-time banner on first load: *"You're in. Your link is live — copy it
  from the card below and put it to work."*
- A permanent small **"How it works"** link (footer or header) that reopens
  the levels read-only — so "when do I get paid?" gets answered by L5, not
  by a WhatsApp to you.

---

## Appendix A — facts the copy relies on (verified in code, 2026-07-21)

- Commission: **8% of full ticket price** (`affiliate_commission_pct`),
  accrues at `fully_paid`, only on `affiliate_enabled` events. Copy always
  says "up to 8%" (matches the built quiz option "Upto 8%").
- Attribution: session-scoped — the booking must happen in the visit that
  started from the creator link; a later direct visit doesn't credit.
- Payouts: monthly (dashboard hero copy "Paid out monthly", IST calendar
  month), to the UPI collected at signup.
- One link per creator: `chaptera.in/@{handle}` → experiences page. No
  per-event links exist anywhere in the product.
- Dashboard pieces referenced: earnings hero, link card + Copy, funnel tiles
  (Clicks/Sign-ups/Paid), conversions card with ₹-per-ticket, Team
  leaderboard, "See upcoming events" card with per-event "earn ₹X per
  booking" + plan-details sheet.
- Quiz: 5 questions, tokens `pay_through_link / eight_percent / monthly /
  creator_dashboard / experiences_page` — frozen; client `CORRECT` and
  server `QUIZ_ANSWER_KEY` must stay identical.
- Auto-DM guidance (L7) is owner-stated practice, not system-enforced:
  two buttons ("I need more details" / "Book Now") both on the same link;
  auto-DM optional but tested better than bio; suggested tool Superprofile.

## Appendix B — owner to-dos for this copy

1. Rewrite anywhere that doesn't sound like you — especially the L6 captions
   and the L7 auto-DM template (they'll be copied verbatim by creators).
2. Record the short welcome video (45–90s, warm, no mechanics — the levels
   carry those now).
3. Confirm the exact auto-DM button labels ("Book Now" capitalisation is
   yours — kept as written).
