# Self-serve marketer onboarding — proposal

_Status: PROPOSAL, not built. Written 2026-07-21, revised three times same day
with the owner. Level list locked from the owner's real onboarding FAQ (§7)._

## 1. The problem, in one line

100+ people want to join the team, and today each marketer costs you a live
meeting (dashboard, statuses, commission) **plus** manual entry in the admin
panel. We want a `/marketer` page where they *learn the job by playing through
it* — first as a pretend customer, then as the marketer handling their own
application — prove they understood, submit their details, and you approve them
with **one tap**.

## 2. Context locked with the owner

- **Two separate hires, two separate doors.** Creators → `/creator` (being
  built). Marketers → `/marketer` (this doc). The owner routes each applicant
  to the right link manually — no triage fork on either page.
- **Everyone non-creator starts in sales.** People apply for core team /
  customer support, but the rule is: learn sales first. The welcome copy says so.
- **Not video-led, but with a welcome video.** One vertical (9:16) founder
  welcome video above the map — same Vimeo iframe treatment as the `/plans`
  carousel (the embed `CreatorOnboarding.tsx` already uses). All *teaching*
  lives in the levels.
- **Duolingo-style level map.** Onboarding home = a winding path of levels.
  Each level is a *question* (the ones marketers actually ask); opening it
  gives the explanation + an interactive mock + 1 check MCQ. Sequential
  unlock, ✓ on completion, always revisitable.
- **Keep it simple: single-payment events only.** New marketers always start
  on `payment_mode='full'` events, so the demo lead goes `Pending → Invited →
  Fully paid`. **Advance/balance split payments are not taught at all** —
  deliberately out of scope, owner's call.
- **Most applicants have never used chaptera.in/plans.** Act 1 walks them
  through the customer side and has them **place a test application — which
  never touches the database**; it becomes the demo lead they work in Act 2.
- **English only.** No language toggle.
- **Direct auto-enroll, no approval step** (owner's decision): completing the
  onboarding creates the marketer immediately. Safe because an unassigned
  marketer's RLS scope contains zero customer data — event assignment
  (admin/manager only) remains the real gate (§4).

## 3. What already exists (so we build the minimum)

- **The creator onboarding shell** (`CreatorOnboarding.tsx`): step navigation
  with browser-history back, the 9:16 Vimeo embed, quiz plumbing with
  server-side re-check, details form → edge-function signup. The marketer flow
  reuses this skeleton; the middle becomes the level map.
- **The marketer system is mature** (see `multi-marketer.md`): roster
  (`call_marketers`), per-event assignment (`event_marketers`), round-robin +
  rebalance triggers, append-only commission ledger (`marketer_sales`),
  marketer-scoped RLS, and the admin **Marketers tab** with "Add Marketer".
- **"Add Marketer" already does the two-table dance** (`saveNewMarketer`,
  `AdminPanel.tsx:1103`): insert `call_marketers`, then an `ops` row in
  `admin_users`, guarded so a founder email can't be demoted. The self-serve
  approve button is this same logic, fed from a signup row, made atomic (§4).
- **The features the levels teach are all real and verified in code:**
  resend-details for Re-Target leads with per-channel WhatsApp/email "sent"
  ticks (`resendInviteDetails`, `AdminPanel.tsx:1407`), lead date-shifting
  (`AdminPanel.tsx:1375`), and the transparent team board (peers' tickets sold
  + earned, `AdminPanel.tsx:427`).
- **Google OAuth** is how `/admin` and `/creator` authenticate — `/marketer`
  reuses the same login-page UI.
- **The real `/plans` flow and admin panel** are the visual references for the
  mocks — small standalone replica components (§7). We do **not** thread a
  demo mode through `AppFlow.tsx` (5.2k lines) or `AdminPanel.tsx` (6.6k
  lines) — see §12.

## 4. Enrollment model: direct auto-enroll (owner's decision, 2026-07-21)

**Completing the onboarding enrolls them as a marketer immediately** — no
founder approve/decline step. The owner's reasoning, and it holds up against
the RLS: a marketer with **no event assignment sees zero customer data**.
`applications` and `doubt_submissions` are scoped to
`assigned_marketer_id = current_marketer_id()`, and a fresh marketer is
assigned to nothing. **Event assignment (admin/manager only) remains the one
true gate** — exactly where trust is decided today.

Three things keep auto-enroll safe, and all three are hard requirements:

1. **The two rows must be created atomically, server-side.** The documented
   sharp edge (`multi-marketer.md` §2): an `admin_users` ops row **without**
   an active `call_marketers` row is a "plain ops" user — who passes
   `is_admin_only()` and sees **ALL leads across all events**. The signup
   function therefore creates both rows in **one `SECURITY DEFINER`
   transaction** (`call_marketers` + `admin_users('ops')`, with the same
   founder-email guard as `saveNewMarketer`). Never browser-side inserts;
   never two separate calls.
2. **The server-checked quiz is now the only vetting gate**, so its
   server-side answer verification is load-bearing, and signups get basic
   rate-limiting (per-email, per-IP) so nobody scripts a flood of enrollments.
3. **A "self-joined, not yet reviewed" flag** (mirroring the creators'
   `reviewed_at` decision): new self-enrolled marketers get a **NEW badge** in
   the Marketers tab roster *and in the event-editor marketer multi-select*,
   with a one-tap "mark reviewed". Review is optional and after-the-fact —
   never a gate — but the badge keeps a flooded roster honest at the moment
   that actually matters: when someone is being assigned to an event.

**Two residual exposures to accept knowingly** (both internal data, not
customer data): (a) any enrolled marketer can see the **transparent team
board** — every marketer's tickets and earnings — so anyone who passes the
quiz with a throwaway Google account could peek at team earnings. If that ever
bothers you, the board can be hidden until first event assignment (small
change, can be added later). (b) The roster itself (marketer names) becomes
visible to self-enrolled users per existing RLS. Off-boarding a bad actor
stays one tap: the existing active-toggle already revokes the `/admin` login.

## 5. The recommended flow

```
/marketer
 ├─ [ I'm already a marketer ]        → link to /admin login       (nothing new)
 └─ [ I want to become a marketer ]   → onboarding:

     Step 0  Continue with Google      ← captures the exact email they'll log in
                                         to /admin with (§6). Creates their
                                         signup row → progress + their test
                                         application are saved server-side from
                                         the first tap (resume anytime, any device).

     Step 1  Welcome — vertical founder video (Vimeo, same embed as the
             /plans carousel) + "everyone starts in sales" framing.

     Step 2  THE LEVEL MAP (§7) — two acts, 13 levels:
             Act 1 · Be the customer   (see /plans, place a test application)
             Act 2 · Be the marketer   (work that same application through
                                        every situation marketers ask about)
             1 check MCQ per level; all answers re-verified server-side at
             the end.

     Step 3  Your details:
             • Name
             • Phone (REQUIRED — marketers work on WhatsApp/calls)
             • UPI ID for commission payouts        ← real gap today, §8
             • ✅ "I agree to keep customer details confidential and never
                contact leads outside the booking process" (timestamped)

     Step 4  ENROLLED. The signup function verifies everything server-side
             (quiz answers, phone/UPI, founder-email guard) and atomically
             creates call_marketers + admin_users('ops') in one transaction.
             "You're in!" screen → [Open your dashboard] → /admin (already
             Google-authed) → empty My Leads with the coaching empty state:
             "You'll start receiving leads when you're added to an event."

Founder side (Marketers tab):
     No approval queue. New self-enrolled marketers appear in the existing
     roster with a NEW badge (+ funnel stats: levels completed, check
     retries, joined 2h ago) and a one-tap "mark reviewed". The same NEW
     badge shows in the event-editor marketer multi-select, so nobody
     assigns an un-eyeballed stranger by accident.
```

Notes:

- **No leads until you assign them to an event** — enrollment only grants an
  empty "My Leads" dashboard. Event assignment stays the real trust moment,
  exactly where it is today (the marketer multi-select in the event editor).
- **Unfinished signups** who sign in again resume the map where they left off.
  Finished ones land on their dashboard like any marketer.

## 6. Login-first (same as creators, sharper teeth)

The marketer's login gate is `admin_users.email` matched **exactly** (lowercase)
against their Google JWT email. A typed email that differs from their real
Google account locks them out of `/admin` — and `multi-marketer.md` documents
that email mismatches around `call_marketers` produce the plain-ops/all-leads
hazard. Capturing the email from the verified Google session at Step 0 makes
both failure modes impossible. Tell them on the door: _"this Google account is
the one you'll always use to log in."_

## 7. The level map — locked from the owner's real onboarding FAQ

The owner listed the 16 concepts/doubts marketers actually raise during manual
onboarding. Every one maps to a level below (marked `#n`). The map home screen:
a winding path of level nodes, each labelled with a question; completed levels
get a ✓, the next pulses, later ones are locked; tapping opens one screen =
short text + interactive mock + one check MCQ. Progress (and the test
application) is saved to the signup row, so they can stop and resume.

### Act 1 — Be the customer (they've never seen the website)

**L1 · "What does a customer see on chaptera.in?"**
A guided replica of the `/plans` experience: the chat-style plans page, an
event's details (photos, itinerary, pickup points, dates, price), and the
**booking timeline** the customer sees — including that the exact meeting spot
is revealed on its own date closer to the event `#15`. Closes with the dual
purpose: *this website is also YOUR reference manual — when you're assigned to
an event, chaptera.in/plans is where you check its plan details* `#7`.
_Check: "Where do you check the plan details of events you're assigned to?"_

**L2 · "Apply for the meetup yourself."**
They fill the application form as a pretend customer — name, pickup point,
date — and hit Apply. **Nothing is sent to the database**; the application is
held in their signup row's progress JSON. Then: *"Your application just landed
on a marketer's dashboard. From here on — that marketer is you."*
_Check: "What does a customer do to book a spot?"_

Keeping Act 1 sandboxed (instead of sending them to the real site) also keeps
100 trainees out of your `flow_analytics` funnel numbers and prevents stray
real applications.

### Act 2 — Be the marketer (their own application is the demo lead)

Every lead card below shows **the application they placed in L2** — their own
name, date, pickup point.

**L3 · "Who can see your leads?"** `#1`
Round-robin: every new application is automatically dealt to one of the
event's marketers, evenly — this one landed on *you*. You see **only** your
own leads; nobody else's; nobody sees yours.
_Check: "How do new leads get distributed?"_

**L4 · "What are all these tabs and cards?"** `#8 #9`
A labelled tour of the People page: the tabs (Call, Doubts, …) and what each
is for `#9`, plus the **team card** — the transparent board showing every
marketer's tickets sold and earnings, so you always know where you stand `#8`.
_Check: "What does the team card show?"_

**L5 · "What do the lead statuses mean?"** `#2`
The interactive status pipeline: tap each chip — `Pending`, `Invited`,
`Fully paid`, plus `Waitlist` (their date sold out — see L11 for the play) and
`Rejected`, and the badges `Cart abandoned`, `Re-target`, `Recovered` — and
read what it means, who set it, and what you do about it. (Also lives on as
the "field guide" reference card, below.)
_Check: "A lead shows Pending — what does that mean?"_

**L6 · "What do you do with a new lead?"** `#12`
The core interaction: the lead sits at `Pending` — call them, vet them, press
**Approve**. Status flips to `Invited`; a toast explains: *the invite +
payment link went out on WhatsApp automatically (our WhatsApp system, AiSensy,
sends every routine message — you never send payment links yourself)* `#12`.
"Skip ahead" → they pay → `Fully paid`, commission ticks **+₹50**: *this is
the moment you earn.*
_Check: "Who sends the payment link when you approve?"_

**L7 · "What does the lead get after paying?"** `#16 #15`
The customer's side of success: WhatsApp confirmation + receipt, and their
booking timeline — with the meeting-spot details arriving on the reveal date
`#15`. So when a paid lead asks "what now?", you know exactly what they're
looking at.
_Check: "When does a paid customer learn the exact meeting spot?"_

**L8 · "What if they don't pay after the invite?"** `#3 #6`
The waiting game, and why chasing matters: **automatic WhatsApp messages can
fail** — so a silent lead may have never seen the invite `#6`. The system
flags stubbornly idle invited leads `Re-target`; for those you have the
**Resend details** button, which re-sends the invite on WhatsApp *and* email —
and shows a **double tick** once each channel has gone out `#3`. Then your
follow-up call.
_Check: "A lead is flagged Re-target — what can you do that you can't do on
other leads?"_

**L9 · "What if they start paying… and stop? / want to pay cash?"** `#13`
The trust-issues scenario: they open the payment page, get cold feet, close
it → `Cart abandoned` badge; an automatic WhatsApp nudge goes out; **your job
is the trust call** — reassure, stay on the line while they retry. Badge flips
to `Recovered` when they finish. And the hard rule: **we never accept cash or
personal-UPI payments — every payment goes through the official payment link,
no exceptions** `#13`.
_Check: "A lead offers to pay you in cash — what do you say?"_

**L10 · "The two kinds of doubts — and whose lead is it after?"** `#10 #11`
Side-by-side: questions asked **before applying** live in the **Doubts tab**;
questions from **already-invited people** appear as **amber cards on the lead
itself** in the Call section `#11`. And the answer to the classic question:
*if you solve someone's doubt and they then apply, they're assigned to
**you*** — the person stays with the marketer who helped them, across doubt
and application `#10`. A doubt shows **Applied ✓** only when they really
apply; there's no mark-as-done button.
_Check: "You answer a doubt and the person applies — whose lead are they?"_

**L11 · "What if their date is full — or they want a different one?"** `#4 #17`
Spots are **per date**: event X on dates A and B can have A sold out while B
still has room — so a full date is never a dead lead. When date A sells out,
new applicants for it go to **Waitlist** `#17` — and the waitlist is your
hottest follow-up list: call them, pitch date B, and **shift their date from
the backend** — allowed for any lead **except paid ones** `#4`. Same move when
a lead simply changes their mind about the date. Mock: the demo lead waitlisted
on a sold-out date A; shift them to date B and watch the card update.
_Check: "Date A is sold out and your lead is waitlisted — what's your play?"_

**L12 · "Where's your money, and when does it arrive?"** `#5`
The commission banner (₹ earned this month · tickets sold), where payments
show up, and the payout rule: **you're paid a few days after the event
happens** — not instantly at booking. Fixed amount per fully-paid ticket
(default ₹50; some events set their own rate — the dashboard always shows the
real number).
_Check: "When do you receive your commission payout?"_

**L13 · "How we sound — and the rules."** `#14`
The sales voice: helpful, warm, **never pushy or desperate** — we're a club
people want into, not a call center `#14`. Taught by ear: **founder-recorded
voice notes** of what a good call sounds like (opening, handling hesitation,
a graceful no), played through the same "Founder's Note" waveform player the
/plans page already uses (`AppFlow.tsx:3710`). Then conduct: customer numbers
are confidential, contact only through the booking process, no adding leads to
personal groups; only your own leads, ever. Flows straight into the agreement
checkbox on the details form.
_Check (2): "A lead keeps hesitating — what's our style?" + "Whose leads can
you see?"_

### Coverage check (owner's 16 items → levels)

| # | Owner's item | Level |
|---|---|---|
| 1 | Who can see my leads / round-robin | L3 |
| 2 | Statuses & meanings | L5 (+ field guide) |
| 3 | Resend details + double tick for Re-target | L8 |
| 4 | Shift dates (non-paid leads) | L11 |
| 5 | Where payments show, payout a few days after event | L12 |
| 6 | Why retargeting matters (AiSensy can fail) | L8 |
| 7 | Where to check assigned events' plan details | L1 |
| 8 | Team card = all marketers & earnings | L4 |
| 9 | People-page tabs (Call, Doubts, …) | L4 |
| 10 | Solve doubt + approve → assigned to me? | L10 |
| 11 | Two doubt flows | L10 |
| 12 | How automatic WhatsApp works | L6 (+ L8 failure case) |
| 13 | Cash / external UPI → not allowed | L9 |
| 14 | Sales tone: never pushy | L13 |
| 15 | Booking timeline & meeting-spot date | L1 + L7 |
| 16 | What the lead gets after payment | L7 |
| 17 | Waitlist flow + sold-out dates (added later) | L11 (+ chip in L5) |

Explicitly **out of scope** (owner's call): advance/balance split payments —
not mentioned anywhere in the map.

### The checks

One MCQ per level (~14 questions total) — answer while it's fresh, retry on
the spot. Level gates are client-side UX only; at final submit the edge
function **re-verifies all answers server-side** (same pattern as
`creator-signup`), so dev-tools skipping earns nothing. Per-level retry counts
are recorded — your "which lesson isn't landing" analytics (§8).

### A status "field guide", one tap away

L5's glossary survives as a **reference card** reachable from the map (and
later from the real dashboard): every status and badge with a one-liner.
Levels teach; the field guide reminds.

### Copy accuracy rule

Levels describe real system behavior (resend ticks, re-target timing, nudge
messages). Before writing final copy we re-verify each mechanism against the
code/`retarget-check`/AiSensy templates — training must never promise
automation that doesn't exist, or marketers will wait for messages that never
come.

### Keeping the mocks honest over time

Stylized replicas drift as the real UI evolves. Mitigations: (a) keep mocks
**schematic** — right shapes, right words, not pixel-perfect; (b) all mock
components live together (one file for Act 1 screens, one for Act 2 cards) so
there's one place to refresh; (c) a line in CLAUDE.md so future changes to
statuses/flows prompt a mock refresh.

### What we're deliberately NOT doing

- **No shared "test admin" login.** The dev/admin panel talks to the
  **production** database (golden rule #5) — test taps would create real rows,
  fire real AiSensy messages, ping real admin notifications; a shared
  credential handed to 100+ strangers is uncontrollable. The mock levels give
  the same "press the button" learning with zero risk.
- **No sending trainees to the real `/plans` to practice** — analytics
  pollution + stray real applications (§7 Act 1).
- **No demo mode threaded through `AppFlow.tsx` or `AdminPanel.tsx`** — the
  replicas are small standalone components; the monoliths stay untouched.

### After approval: teach at first login too

A newly approved marketer lands on an **empty** My Leads tab (no event
assignment yet). Replace the blank with: *"You're in! You'll start receiving
leads when you're added to an event. Here's what a lead card looks like →"*
(the same mock card) plus links to the field guide and the level map
(read-only). A permanent **"Training"** card in their dashboard keeps both
reachable — so marketers re-check the glossary themselves instead of
WhatsApping you.

## 8. Gaps this surfaces — worth fixing while we're here

1. **No payout destination for marketers.** `call_marketers` has no UPI or
   phone column — same gap the creator flow just fixed for `affiliates`. Add
   `upi_id` and `phone` (nullable, additive), collect at Step 3, show the UPI
   in the Marketers tab next to each marketer's totals.
2. **"Trackable" — the signup row delivers it.** Created at Google sign-in and
   updated per level, it gives the full funnel: *signed in → reached level N →
   finished the map → submitted → approved/declined*, with per-level check
   retries. You'll see exactly where people drop off and **which level's
   question gets the most retries** — i.e. which lesson to rewrite. None of
   this exists for the manual process today.
3. **A conduct agreement now exists on record** (`agreed_at` timestamp) — today
   you hand out customer phone numbers with nothing in writing.

## 9. The business reality: 100 approved ≠ 100 assigned

Round-robin splits an event's leads across its marketers — 10 marketers on one
event = one-tenth the leads (and commission) each; everyone starves. So the
funnel narrows twice:

- **Gate 1 — finishing the onboarding (this proposal):** "understood the job,
  real details." Auto-enroll grants nothing but an empty dashboard.
- **Gate 2 — event assignment (already exists, unchanged):** staff each event
  with the few marketers it needs. Enrolled-but-unassigned marketers are your
  **bench** — pull from it as events need capacity (the NEW badge marks the
  un-reviewed ones). The "you're in" screen sets this expectation explicitly
  (§5) so an empty dashboard reads as normal, not as rejection.

## 10. Feature ideas beyond the map (ranked)

**Tier 1 — with v1, cheap and compounding:**
1. **UPI + phone at signup** (§8.1).
2. **Signup funnel + per-level analytics** (§8.2) — falls out of the design.
3. **Empty-state coaching + Training card + field guide** (§7).

**Tier 2 — can follow:**
4. **Approval → WhatsApp** — AiSensy "you're approved, log in at
   chaptera.in/admin" template (creator flow deferred the same; do both
   together when volume justifies it).
5. **Bench visibility** — split the Marketers-tab roster into "Assigned" and
   "Bench" so staffing an event from the bench is deliberate.

**Tier 3 — later, once volume justifies:**
6. **Trial event / probation** — new marketers' first assignment flagged;
   after the event, glance at their conversion (manager scorecards already
   compute per-marketer stats) and keep or bench them.
7. **Level analytics → lesson rewrites** — periodically rewrite the level with
   the most check-retries.
8. **Sales → support/core progression tracking** — since sales is everyone's
   first rung by design, a simple "joined → first event → promoted to X" field
   on the roster would make the ladder visible. Not needed for v1.

## 11. The plumbing (plain-language, for the build later)

- **`marketer_signups` progress table** — email (from Google, unique), name,
  phone, upi_id, `progress` (JSONB: completed levels, per-level check retries,
  **the L2 test application**, timestamps), quiz_passed_at, agreed_at, status
  (`in_progress` / `enrolled`), created_at. RLS: the trainee can read/update
  **their own row** (progress saves); founder (`is_admin_strict`) reads all
  (funnel analytics). Anon: nothing.
- **`marketer-signup` edge function** — mirror of `creator-signup`: verifies
  the Google session (email from the auth token, never the body), re-checks all
  level answers server-side, validates phone/UPI, rate-limits (per-email +
  per-IP), then calls the enroll RPC and marks the signup row `enrolled`.
- **`enroll_marketer(...)` SQL function** — `SECURITY DEFINER`, callable only
  by the service role (the edge function), one transaction: guard the email
  isn't an admin (same check as `saveNewMarketer`), insert `call_marketers`
  (with upi/phone, `reviewed_at = NULL` → the NEW badge), insert
  `admin_users('ops')`. Atomic = the §4 half-created hazard can't happen.
- **Frontend** — a `/marketer` route reusing the `/creator` login-page UI, the
  `CreatorOnboarding` skeleton, and its 9:16 Vimeo embed for the welcome
  video; new files for: the level map, the Act 1 `/plans` replica screens, the
  Act 2 mock cards, and the field guide. The monoliths (`AppFlow.tsx`,
  `AdminPanel.tsx`) are not modified for the mocks.
- Nothing touches payments code, the booking flows, or existing marketer RLS.
  Additive only. Owner deploys the edge function, as always.

## 12. What I'd explicitly NOT do

- **Don't relax the atomic-enroll rule** — auto-enroll is safe *only* because
  the two rows are created in one transaction and assignment stays manual (§4).
- **Don't build a shared test-admin login** — prod DB, real WhatsApp sends,
  uncontrolled credential (§7).
- **Don't send trainees to the real `/plans`** — analytics pollution + stray
  real applications; the Act 1 simulator exists precisely for this (§7).
- **Don't thread demo modes through `AppFlow.tsx`/`AdminPanel.tsx`** —
  standalone mock components only (§7, §11).
- **Don't let the browser insert into `admin_users`/`call_marketers`** — only
  the atomic founder-triggered RPC does (§4, §11).
- **Don't let them type their login email** — Google-first, always (§6).
- **Don't skip the phone number** — a marketer you can't WhatsApp is useless.
- **Don't assign events at signup** — assignment stays the founder's separate,
  deliberate act (§9).
- **Don't teach split payments** — out of scope by owner decision (§7).

## 13. Decisions

**Resolved 2026-07-21:**
- ✅ Duolingo-style level map; two acts; demo event = the real **Chill Sunday
  Meetup** (`anna-nagar-meetup`, single payment, ₹359) — the event new
  marketers are actually assigned to first, with real details verified in
  prod (see the copy doc's Appendix B).
- ✅ Level list locked from the owner's 17-item FAQ (§7 coverage table).
- ✅ Split payments not taught at all.
- ✅ Vertical founder welcome video above the map (same Vimeo embed as the
  /plans carousel); L13 taught via founder voice notes (Founder's Note player).
- ✅ English only.
- ✅ **Direct auto-enroll** — no approve/decline step; atomic enroll RPC +
  NEW badge for after-the-fact review (§4). Approval tray and decline flow
  dropped from scope. UPI + required phone still collected.
- ✅ Level copy drafted: `team-onboarding-level-copy.md` (mechanics
  verified against code first). Owner to edit voice.

**Still open:**
1. **"You're in" WhatsApp for v1** — none needed to unblock (they land
   straight in the dashboard), but a welcome AiSensy template is a nice
   later touch.
2. **Hide the team board until first assignment?** Optional tightening of the
   throwaway-account peek (§4). Not required for v1.

## 14. Phased build plan

Backend-first, each phase safe alone, owner deploys edge functions, one concern
per commit, nothing pushed without a go-ahead.

- **Phase 1 — schema:** `marketer_signups` + RLS; `upi_id`/`phone`/
  `reviewed_at` on `call_marketers` (nullable, additive — existing marketers
  back-filled to `now()` so only self-joined ones show NEW); `enroll_marketer`
  RPC. Invisible to everyone.
- **Phase 2 — `marketer-signup` edge function** (verify + rate-limit +
  enroll), proven by curl + SQL with a `90000000xx` throwaway, then cleaned
  up. Owner deploys.
- **Phase 3 — map shell + Act 2:** `/marketer` route, login fork, welcome
  video, the map UI, and levels L3–L13 running on a canned demo application.
  The teaching core, reviewable standalone.
- **Phase 4 — Act 1 simulator:** the `/plans` replica screens + the L2 test
  application, wired so Act 2 switches from the canned application to the
  trainee's own. (Biggest bespoke UI piece.)
- **Phase 5 — roster visibility:** NEW badge + "mark reviewed" in the
  Marketers tab and the event-editor marketer multi-select; funnel numbers
  (signed in → level N → enrolled) on the Marketers tab.
- **Phase 6 — polish:** field guide, empty-state coaching, Training card,
  optional welcome-WhatsApp template, bench split, optional team-board
  hide-until-assigned.

Owner action points: record the vertical welcome video and the L13 sales-call
voice notes (any time — non-blocking; suggested beats are in the copy doc),
edit the level copy (`team-onboarding-level-copy.md`), deploy the Phase 2
function, approve the first real batch.
