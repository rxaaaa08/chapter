# Demo levels for creator onboarding — proposal (revision 2)

_Status: PROPOSAL, not built. Written 2026-07-21, revised same day with the
owner. Locked that day: **v1 (video→quiz→details, already built) is ON HOLD;
the video KEEPS the opening slot; the flow is video → demo levels → final quiz
→ details.** Companion to `creator-self-serve-onboarding-proposal.md` (the
built flow this extends) and `marketer-self-serve-onboarding-proposal.md`
(the pattern the levels borrow). Every dashboard behavior described below was
verified against `CreatorDashboard.tsx`, `CreatorUpcomingEvents.tsx`,
`CreatorOnboarding.tsx`, and `supabase/functions/creator-signup`._

## 1. The problem, in one line

The built onboarding teaches everything through one welcome video — if it's
half-watched, scrubbed, or on mute, the quiz becomes a guessing game and the
creator arrives at their dashboard without ever *feeling* how the earning
mechanic works. We keep the video as the opening (face, trust, welcome) and
add **eight short interactive demo levels** after it, so every mechanic the
quiz tests has been *played*, not just heard — plus the one growth tactic
(comment → auto-DM) that testing shows actually moves bookings.

## 2. The locked flow

```
/creator → Register as Creator → Continue with Google        (unchanged)

  Step 1  VIDEO — the founder's welcome, opening slot, as built today.
          (Owner still records the real one; placeholder Vimeo id until then.)

  Step 2  DEMO LEVELS — 8 levels in two acts (§4), each a 20–60 second
          interactive mock. Sequential unlock, ✓ on completion, revisitable.
          No questions inside the levels — pure play.

  Step 3  FINAL QUIZ — the existing 5-question screen, UNCHANGED (same
          questions, same tokens, same all-correct gate). One upgrade: a
          wrong answer now hints "revisit level N" instead of only
          "re-watch the video".

  Step 4  DETAILS — unchanged: @handle + name + UPI + phone → creator-signup.
```

**Zero backend change.** The `creator-signup` edge function, its server-held
`QUIZ_ANSWER_KEY`, the rate limit, and the insert are untouched — no deploy.
The Phase-1 schema is untouched. The quiz screen and details form are
untouched. The levels are a new step slotted into `CreatorOnboarding.tsx`
between video and quiz, plus one new file of demo components.

## 3. Why demos (the honest case, post-revision)

1. **The quiz stops being a memory test.** Today the quiz asks about five
   facts mentioned once in a video. After the levels, every question maps to
   something the creator *did* two minutes earlier (§4 mapping table).
2. **The video gets to be a welcome again.** With mechanics taught by the
   levels, the recording can be short and warm — who we are, why we pay
   creators well — instead of a syllabus. Easier to record, ages better.
3. **Demos are the product.** When commission rules or the dashboard change,
   the demo screens change in code alongside them; a video would need a
   re-shoot.
4. **Pattern reuse.** The marketer onboarding already commits to interactive
   mocks + a level path. Creators get the same grammar at a smaller dose:
   8 levels, ~6–8 minutes, respectful of outside partners' attention.
5. **Personalisation.** The demos show *their* handle everywhere — the story
   sticker, the attribution tag, the leaderboard row — which a generic video
   can't do (§4, "try a handle").

## 4. The eight levels

Demo event throughout: **"Gokarna Beach Weekend" · ₹1,999 · commission ₹160
per booking** (8% of 1,999 ≈ 160; fictional — the marketer training uses the
real Chill Sunday Meetup instead, by its own design). Demo follower: "Priya". Personalisation: level 1 opens
with a **"try your handle" input** (cosmetic only — no availability check, no
claim; the real handle is chosen at the details step as built). Every screen
after renders their handle.

Mechanic per level: one screen = 2–3 sentences + an interactive mock; the
level completes when the key interaction happens (a tap, a play-through), not
via a question. All questions live in the final quiz.

### Act 1 · Be your follower

**L1 · "How a follower reaches your link."**
Mock: the trainee's reel (their handle on it); Priya comments **"LINK"** →
an **auto-DM** lands in her inbox from @handle — a short message with **two
buttons: "I need more details" and "Book now", both carrying the same
`chaptera.in/@handle` link.** Tap either → a mini replica of the experiences
page (3 event cards, Gokarna on top) with a small "came from @handle" tag.
Copy: *whichever button she taps, she lands on the same club page — it
answers the details AND takes the booking. Your link always lands people
here: the full club page, not one event, not a payment page. One link: yours.*
(How to set this automation up — and why two buttons — is its own level, L7.)
_Preps quiz Q5 (`experiences_page`)._

**L2 · "Watch a booking become your money."**
Mock: Priya browses Gokarna → applies → pays ₹1,999 — a **"came from
@handle"** ribbon rides along every screen. On the payment-success beat, a
green counter ticks **"+₹160 · your commission."** Then the honest
counterexample, one tap to reveal: *Priya clicks today, closes the app, books
directly next week → the ribbon is gone, ₹0. The booking must happen in the
visit your link started.*
_Preps quiz Q1 (`pay_through_link`)._

### Act 2 · Be the creator

**L3 · "Your money math."**
Mock: a tap-through price strip — three demo events at different prices, each
card flipping to show "your cut" (₹1,999 → **₹160**, ₹900 → **₹72**, …).
Below, three tappable chips telling the whole truth: *Click → ₹0 · Sign-up →
₹0 · **Fully paid → you earn.*** One line of honesty the dashboard already
lives by: commission runs on events where creator earnings are enabled — the
dashboard always shows the real per-event number.
_Preps quiz Q2 (`eight_percent`)._

**L4 · "Your dashboard — a guided poke-around."**
Mock: a working replica of the real dashboard with demo numbers — funnel
tiles (Clicks 120 · Sign-ups 14 · Paid 5), the conversions card (Gokarna ·
5 tickets · ₹800 · ₹160/ticket), the link card with a working Copy animation,
a mini Team leaderboard with "you" highlighted. Three guided taps: the funnel
(*clicks show reach; only Paid pays*), a conversion row (*every rupee
itemised per event*), Copy (*this is the one link you'll ever share — find
all of this anytime at chaptera.in/creator*).
_Preps quiz Q4 (`creator_dashboard`)._

**L5 · "When does the money reach you?"**
Mock: the earnings hero ("Earned in July · ₹800") over a three-node timeline:
**bookings all month → month closes → paid to your UPI.** Caption on the UPI
node: *that's why we ask for your UPI ID at signup — it's where the money
goes.* (Primes the details form: the UPI field reads as "my payout account",
not "another form field".)
_Preps quiz Q3 (`monthly`)._

**L6 · "What should you actually post?"**
Mock: the real "See upcoming events" card with demo events — each row showing
**"earn ₹X per booking"** — tapping one opens the plan-details sheet, exactly
like the live dashboard (`InvitePlanDetailsSheet` is already standalone).
Copy: *this card is your what-to-post radar — the events, their dates, and
what each booking pays you.* Optionally 2 copy-paste demo captions (the
"starter kit" seed from the original proposal's Tier 1).
_No quiz question — plants the habit._

**L7 · "Comments → auto-DM: the setup that books the most."**
The growth-tactics level (owner-requested, 2026-07-21). Teaches the
best-practice funnel from L1 from the creator's side:
- **Set your reels to auto-DM anyone who comments a keyword.** The DM carries
  your link so the follower never has to hunt for it.
- **The DM gets TWO buttons — "I need more details" and "Book now" — and
  BOTH point at your same link.** Different people are in different mindsets
  when they tap; the club page serves both (it answers details and takes
  bookings), and your attribution works either way. Never two different
  links — there's only one link, yours.
- **This is optional.** The link in your bio works too — but our testing
  found **auto-DM converts better than bio** (the link comes to them instead
  of them digging through your profile).
- **Tool suggestion: Superprofile** for Instagram automations.

Mock: a tap-through comparison of the two paths — *bio route:* watches reel
→ opens your profile → taps bio → club page (three hops, drop-off at each)
vs. *auto-DM route:* comments → DM with two buttons → club page (the link
comes to them) — plus a mini "your auto-DM" builder card showing the two
buttons wired to the one link.
_No quiz question — plants the tactic._

**L8 · "How we sound."**
The brand level, 30 seconds: chapter அ is a club people want into — creators
never run fake urgency, invented discounts, or "use my code" bait (there are
no codes; there's your link and the real price). One tap-to-reveal contrast
pair, mirroring the marketer L13 device: *"90% OFF if you book in 10
minutes!!"* → **not us** · *"went with this crew last month — booking through
my link if you want in"* → **that's us.** Flows into the quiz.
_No quiz question — plants the voice._

### Level → final-quiz mapping

| Final quiz question (unchanged) | Token | Taught by |
|---|---|---|
| When do you actually earn a commission? | `pay_through_link` | L2 |
| How much do you earn per booking? | `eight_percent` | L3 |
| When do creators get paid? | `monthly` | L5 |
| How will you check your creator dashboard? | `creator_dashboard` | L4 |
| Where does your link send people? | `experiences_page` | L1 |

A wrong quiz answer hints the matching level ("Take another look at *Watch a
booking become your money*"), one tap to reopen it, quiz state preserved.

## 5. What stays exactly the same

- **`creator-signup` edge function: untouched** — same tokens, same order,
  same server-side re-check, same rate limit, same insert. No deploy.
- **The quiz screen: untouched** (questions, shuffle, all-correct gate); only
  the wrong-answer hint text gains level references.
- **The video step: untouched and still the opener** — owner records the real
  one whenever ready; until then the placeholder remains and the whole flow
  stays on hold (owner's call, 2026-07-21).
- **Details form + validation: untouched.**
- **Auto-activate + NEW badge model: untouched** — demos change how people
  learn, not how they're vetted.
- **The real dashboard: untouched.** Demo screens are standalone copies —
  same rule as the marketer proposal (no demo modes threaded through real
  components), pure client state, no DB writes, no analytics events.

## 6. What this unlocks later (optional, ranked)

**Tier 1 — with v1, nearly free:**
1. **Resume-on-refresh** — completed levels in `localStorage` (today a
   refresh dumps quiz answers too; cheap to cover both).
2. **The levels double as the help center** — after signup, a "How it works"
   link in the dashboard reopens them read-only (the marketer field-guide
   trick). Answers "when do I get paid?" before it becomes a WhatsApp to you.

**Tier 2 — when volume justifies:**
3. **`creator_signups` progress table** (mirror of `marketer_signups`):
   per-level funnel + quiz-retry counts → see where the 200 drop off and
   which lesson to rewrite. v1 skips it; the level structure makes it
   additive later.
4. **Starter-kit captions from L6 → real captions in the dashboard.**

## 7. What I'd explicitly NOT do

- **Don't change the quiz tokens or order** — client `CORRECT` and server
  `QUIZ_ANSWER_KEY` stay identical and frozen; that's what keeps this a
  zero-backend-change build.
- **Don't check handle availability during the demos** — the L1 input is
  cosmetic; the real claim (and taken-handle error) stays at the details
  step as built.
- **Don't make the demos write anything** — no DB rows, no `flow_analytics`
  events (same pollution concern as the marketer Act 1 decision).
- **Don't over-promise in demos** — always "up to 8%"; ₹X only framed as
  "events with creator earnings enabled"; never show a per-event link (the
  real product deliberately has none).
- **Don't skip the mock-drift rule** — demo screens are schematic copies, all
  in one file, plus a CLAUDE.md line so dashboard changes prompt a refresh.
- **Don't build a separate route** — same `/creator` → Register →
  `CreatorOnboarding`; the `CreatorDashboard` wiring stays.

## 8. Decisions

**Resolved 2026-07-21 (this revision):**
- ✅ **v1 held** — don't ship the built video→quiz→details flow standalone;
  build the levels first and ship once.
- ✅ **Video keeps the opening slot** — not demoted, not optional.
- ✅ **Flow locked: video → levels → final quiz → details.** Quiz stays a
  single screen at the end (not embedded per level).
- ✅ 8 levels, two acts, demo event = Gokarna ₹1,999 / ₹160.
- ✅ **"Try your handle" box stays** (L1 personalisation; cosmetic only).
- ✅ **L1 reworked to the comment → auto-DM play-through** (was an Instagram
  story) — the follower taps the link inside an auto-DM reply, not a story
  sticker.
- ✅ **New L7 growth-tactics level**: auto-reply-to-comments best practice —
  DM with two buttons ("I need more details" / "Book now"), **both on the
  same link**; auto-DM is optional (bio works) but tested better than bio;
  suggest **Superprofile** for Instagram automations.

- ✅ **L8 "How we sound" stays** (decided 2026-07-21).
- ✅ **Level copy drafted:** `creator-onboarding-level-copy.md` in repo root —
  every screen's words, mock behaviors, quiz hints, details-form additions.
  Owner to edit voice (esp. L6 captions + L7 auto-DM template).

**Still open:** none — direction fully locked; next step is the Phase A build
when the owner says go.

## 9. Phased build plan

All frontend, all additive, no edge-function deploys, nothing pushed without
an explicit go-ahead. `npx tsc --noEmit` after every phase.

- **Phase A — the level step in `CreatorOnboarding.tsx`:** insert a `levels`
  step between video and quiz (history-back wiring like the existing steps),
  with the 8-node path screen, sequential unlock, and placeholder level
  bodies. Flow is end-to-end testable immediately since quiz + details are
  untouched.
- **Phase B — the demo components** (one new file, e.g.
  `CreatorOnboardingDemos.tsx`): L1 comment→auto-DM→experiences replica,
  L2 attribution play-through, L3 money math, L4 dashboard replica (styles
  copied from `CreatorDashboard`), L5 payout timeline, L6 upcoming-events
  demo (reusing `InvitePlanDetailsSheet` directly), L7 bio-vs-auto-DM
  comparison + DM-builder card, L8 contrast pair.
- **Phase C — polish:** quiz wrong-answer level hints, localStorage resume,
  post-signup read-only "How it works" reopen.
- **Phase D (later, optional):** `creator_signups` funnel table (§6 Tier 2).

Owner action points: approve the level list + §8 open items; record the real
welcome video (blocking for launch, since v1 is held and the video opens the
flow); review the level copy when drafted; give the push go-ahead at the end.
