# TEAM ONBOARDING — REVISION HANDOFF (post-build review)

_Written 2026-08-02 after a full review of the Phase 1–6 build. Companion to
`TEAM-ONBOARDING-COMPLETE-HANDOFF.md` (the original spec — still the source
of truth for copy, design tokens and intent). This file lists ONLY what needs
changing, in the order it should be done._

**Audience:** the agent continuing the build (Codex or another session).
Tool-agnostic. Work phases in order; each ends with `npx tsc --noEmit` green,
its verification done and shown to the owner, and a **STOP for the owner's
go-ahead** before the next.

## 0. State of the build

The build is good. tsc is green, the security core is sound, the migration is
**already applied to prod and verified** (12 marketers, 12 intents backfilled,
0 false "didn't finish"), and Phases 1–6 are substantially complete.

**Credit:** the build improved on the original spec by adding an
`inactive_marketer` guard to `enroll_marketer`. The spec's version would have
re-created an `admin_users` ops row for an off-boarded marketer whose
`call_marketers` row was inactive — the exact plain-ops-sees-all-leads hole the
design exists to prevent. **Keep that guard.**

### ✅ R1–R5 are IMPLEMENTED (owner confirmed 2026-08-02). Start at **R6**.

**R6, R7 and R8b are also implemented and reviewed (2026-08-03).** R1–R8b below
are kept for the record only — do not re-run them.

**Remaining work is just R9a, R9b and R10.** Everything else is closed:
- `R8a` was superseded by **R11 — now executed** (prod test rows deleted from
  both tables; funnel baseline is a clean 12 · 12 · 0).
- `R9c` (chat header brand + dropping the "weekend co-pilot" subtitle) is
  **done**.

A "what would you like to grow into?" signup field was considered and
**declined by the owner (2026-08-02)** — do not add it, and do not re-propose it.

One superseded instruction: R4 asks the owner to "confirm group size 22 vs 25".
**That is now answered — 25 is correct**, read from the live event's `quick_info`
JSON (the `group_size` column is empty, which is what made the earlier check look
inconclusive). The code is already right; it is Part E of the handoff that is
stale. R7d fixes it.

### Already fixed during review — do NOT redo

| Fix | File |
|---|---|
| Funnel intent RPC never fired (missing `.then()` on a lazy supabase-js thenable) | `src/MarketerOnboarding.tsx:449` |
| "Group of 25" → "Group of 22" in the L1 mock | `src/MarketerOnboardingMocks.tsx:123` |

Both are in the working tree, tsc green. Verify them, don't rewrite them.

## 1. Safety rules (unchanged — all still apply)

1. **Prod DB with live customers.** Test rows use phone `90000000xx`; verify
   writes with `RETURNING`; delete test rows and show the cleanup.
2. **NEVER deploy edge functions.** The owner deploys. Stop and say when needed.
3. **NEVER `git push` without the owner's explicit go-ahead in that turn.**
4. **`npx tsc --noEmit` must pass after every edit.**
5. **The migration is already applied. DO NOT re-apply it.** Where a phase edits
   the existing migration file, that is for future-safety only; prod is already
   in the correct state.
6. Do not touch `AppFlow.tsx`, the booking flows, or any `/creator` file.

---

# PHASE R1 — Make the rate limit real (server-owned)

**The defect:** the edge function stores failed submit attempts in
`marketer_signups.progress.submit_attempts`, but the browser owns that whole
JSONB column and rewrites it on every level save
(`saveProgress`, `src/MarketerOnboarding.tsx:552`). The client's in-memory copy
has no `submit_attempts`, so **any level interaction after a failed submit
erases the server's record.** Five rapid retries still lock out; one tap resets
it. The counter must live somewhere the browser cannot write.

**Fix — a service-role-only attempts table.** Chosen over an RLS/trigger guard
because it needs no role-detection gymnastics: `authenticated` simply has no
grant, so there is nothing to bypass.

New migration (additive; safe to apply):

```sql
create table if not exists public.marketer_signup_attempts (
  email      text primary key,
  attempts   timestamptz[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.marketer_signup_attempts enable row level security;
-- Deliberately no policies: only service_role (which bypasses RLS) touches this.
revoke all on table public.marketer_signup_attempts from public, anon, authenticated;
grant all  on table public.marketer_signup_attempts to service_role;
```

Then, in `supabase/functions/marketer-signup/index.ts`:

- Read the window from `marketer_signup_attempts`, not from `progress`.
- On a failed submit, upsert the pruned array + the new timestamp there.
- On success, clear the row (or leave it pruned — either is fine).
- Delete `submit_attempts` handling from the `progress` read/write paths
  (`recentAttemptTimestamps`, both `signupValues.progress` spreads).

And in the frontend:

- Remove `submit_attempts` from the `MarketerProgress` type and from
  `normalizeProgress` (`src/MarketerOnboarding.tsx:36, 108`). The client should
  neither know nor carry it.

**Verify:** with a `90000000xx` test signup row, call the function 5 times with
a deliberately wrong answer → 6th returns 429. Then write progress from the
browser path (complete a level) and confirm the 429 **still** holds. Clean up.
**This phase needs an owner deploy of `marketer-signup`.** STOP.

---

# PHASE R2 — Welcome video must not show a 404

**The defect:** `MARKETER_WELCOME_VIMEO_ID = '000000000'`
(`src/MarketerOnboarding.tsx:22`). `player.vimeo.com/video/000000000` returns
**HTTP 404** — verified. The first screen every trainee sees would be a Vimeo
error page. (The L13 voice notes already degrade gracefully — copy that
pattern.)

**Fix:**

```ts
// TODO(owner): set this to the vertical marketer welcome video id.
const MARKETER_WELCOME_VIMEO_ID: string | null = null;
```

When it is `null`, render a styled placeholder in the 9:16 frame instead of the
iframe — same rounded/bordered box, a muted line such as *"Founder welcome
video coming soon"*, and keep the **"I've watched it — continue"** CTA working
so the flow is never blocked. When the owner supplies an id, the iframe renders
with no other change.

**Verify:** load `/marketer`, confirm the placeholder renders and Continue
works; temporarily set a real Vimeo id and confirm the iframe path still
renders, then restore `null`. STOP.

---

# PHASE R3 — Auth-race retry + migration idempotency

**R3a — retry an EMPTY marketer lookup, not just an error**
(`src/MarketerOnboarding.tsx:455-459`). Today the `call_marketers` lookup
retries only when `.error` is set. An RLS-filtered read with a late-attaching
token returns **zero rows without an error** — so an existing marketer would be
pushed through onboarding instead of the "You're already on the team" screen.
This is documented gotcha #1 in the original handoff, and `CreatorDashboard.tsx`
defends against it explicitly.

Fix: retry once when the first attempt returns `error` **or** an empty result,
mirroring the creator comment ("an empty result on the first try right after
login is retried once"). Keep the existing 250 ms backoff.

**R3b — make the `reviewed_at` backfill idempotent.** In
`supabase/migrations/20260802033600_marketer_onboarding_phase1_schema.sql`:

```sql
UPDATE public.call_marketers SET reviewed_at = now() WHERE reviewed_at IS NULL;
```

Re-running this after real self-enrollments exist would **silently clear every
NEW badge**. The creator migration guards against exactly this with a cutoff.
Add one:

```sql
UPDATE public.call_marketers
   SET reviewed_at = now()
 WHERE reviewed_at IS NULL
   AND created_at < timestamptz '2026-08-02 00:00:00+05:30';
```

**Do not re-apply the migration** — prod is already correct. This edit is purely
so a future replay is safe.

**Verify:** R3a by simulation (confirm the retry path triggers on an empty
result); R3b by reading the file back. STOP.

---

# PHASE R4 — Restore the owner-reviewed copy

The original handoff states the level copy is **canonical and verbatim** (the
owner reviewed it). Several lines were trimmed in
`src/MarketerOnboardingLevels.tsx` / `MarketerOnboardingMocks.tsx`. Restore them
from **Part E** of `TEAM-ONBOARDING-COMPLETE-HANDOFF.md`:

| Level | Restore |
|---|---|
| L1 | "Customers ask about this constantly; now you know where they're looking." |
| L6 | The earn toast: **"This is the moment you earn."** — a fixed amount for every fully-paid ticket; your dashboard always shows your exact rate. (Currently only "+ ₹50" and the happy-path line survive.) |
| L7 | "You'll get this question a lot. Now it's an easy one." |
| L9 | The scripted reply: *"our payment link is the only way, and it's also your booking confirmation and receipt"* + "Collecting money any other way is the fastest way off this team." |

Re-read Part E level by level and restore any other dropped sentence. Trimming
for screen density is fine **only** where Part E's meaning survives intact —
these four lose owner-intended teaching.

**Also in this phase — delete dead code:** `MARKETER_LEVEL_HINTS`
(`src/MarketerOnboardingLevels.tsx:351`) is exported and never used. In this
build the lesson content and its check share one screen, so the existing generic
*"Take another look above ☝️"* is the correct affordance — do **not** wire the
per-level hint in, just remove the unused export.

**Open question for the owner (ask, don't guess):** the L1 mock said "Group of
25"; it was changed to **22** to match the reviewed copy, but `group_size` is
**blank** on the live `anna-nagar-meetup` row, so neither number is verifiable
from the DB. Confirm the real number with the owner and set it in both the mock
and Part E.

**Verify:** tsc; read each level on `/marketer` and diff against Part E. STOP.

---

# PHASE R5 — Finish Phase 6 + design polish

**R5a — the missing empty-state coaching** (original handoff Phase 6, item 2).
The Training card was built; the zero-lead empty state was not (no "assigned to
an event" string exists in the AdminPanel diff). On My Leads, for a marketer
with no leads, render the coaching state: *"You're in! You'll start receiving
leads when you're added to an event."* + a static example lead card + the link
to `/marketer?revisit=1`. Keep it small and scoped to the marketer empty state.

**R5b — reconcile design tokens.** The two new files disagree with each other
and with Part H:

| Token | Shell (`MarketerOnboarding.tsx:15-16`) | Mocks (`MarketerOnboardingMocks.tsx:16-17`) | Part H / creator |
|---|---|---|---|
| MUTED | `#71717a` | `#9a9aa2` | `#9a9aa2` |
| HAIR | `#e4e4e7` | `#ececed` | `#ececed` |

Pick one set and use it in both files. Part H's values match `/creator`, which
was the stated goal — prefer those unless the owner likes the darker muted.

**R5c — phantom font.** `fontFamily: "'DM Sans', …"`
(`src/MarketerOnboarding.tsx:599`) references a font the app never loads (it
loads **Inter**, via `src/index.css:1`). It falls back harmlessly, but either
load DM Sans or drop it from the stack. Simplest: match the creator flow's
`system-ui, -apple-system, sans-serif`.

**R5d — label mismatch** on the login card: the button reads "I want to become a
marketer" while the helper below reads "Press **Become a Marketer** to get
started." Make them agree.

**Verify:** tsc; screenshot `/marketer`; verify the admin empty state by SQL
simulation (admin views are login-gated and not drivable in preview). STOP.

---

# PHASE R6 — The team reframe: `/team`, not `/marketer`

## Why (read this before touching anything)

This is not a marketer hiring portal. It is the **front door to the whole
company**. The owner's model: *every* future manager, operations person,
designer and support hire starts on the customer desk, because talking to
customers is how you learn to design better experiences, explain things better
on the website, and run operations well.

The current copy already says "everyone starts in sales" — but **defensively**,
as an apology for why you aren't getting the job you applied for. The entire job
of this phase is to flip that to **aspirational**: customer proximity isn't a
toll you pay, it's the curriculum.

> You don't start in sales because we need salespeople. You start there because
> it's the only place the customer is real.

**Honesty guardrails — do not violate these:**

1. **Do not bury the sales work.** If `/team` reads like a generic "join us"
   page, someone arrives expecting a design job and finds a call list. That is a
   bait-and-switch and costs week-two dropouts. The word **marketer** must appear
   plainly on the welcome screen — the copy below keeps it there deliberately.
2. **Do not promise promotion or timelines.** "The door is open" is true and
   motivating. "You'll move up in three months" is a hostage to fortune with
   100+ applicants.
3. **Do not rename the role.** They join the **team**; the role they hold is
   **marketer**. "Team Associate" and friends make the job sound like something
   it isn't.

## R6a — Renames

**Rule: rename everything a human reads; keep everything a machine reads.**

| Layer | Action | Reason |
|---|---|---|
| Route `/marketer` → `/team` | **Rename. No redirect.** | Nothing is pushed and no links are out — `/marketer` can simply cease to exist |
| All on-screen copy | Rename | Uncommitted |
| `src/MarketerOnboarding.tsx` → `src/TeamOnboarding.tsx` | Rename | Untracked file |
| `src/MarketerOnboardingLevels.tsx` → `src/TeamOnboardingLevels.tsx` | Rename | Untracked |
| `src/MarketerOnboardingMocks.tsx` → `src/TeamOnboardingMocks.tsx` | Rename | Untracked |
| Edge function `marketer-signup` | **KEEP** | Already deployed (v1, live). Renaming = a new deploy plus an orphaned function, for an endpoint no human ever sees |
| `marketer_signups`, `marketer_signup_intents`, `marketer_signup_attempts`, `enroll_marketer`, `record_marketer_signup_intent` | **KEEP** | Applied to prod |
| `call_marketers` | **KEEP** | Live since June, wired into round-robin triggers and RLS |

This split is coherent, not a compromise: you join the **team**, and the role the
data layer records is **marketer**.

Mechanical checklist:

- `src/App.tsx`: `isMarketerPage` → `isTeamPage`; `routePath === '/marketer'` →
  `'/team'`; the PWA standalone-redirect exclusion; the `trackEvent('page_view')`
  exclusion; the `showHomepage` guard; the render block.
- `src/AdminPanel.tsx`: both `/marketer?revisit=1` links → `/team?revisit=1`.
- Storage keys: `marketerOnboardingProgressV1` → `teamOnboardingProgressV1`;
  `marketerOnboardingIntent` → `teamOnboardingIntent`.
- CSS class prefixes (`marketer-cta-shimmer`, `marketer-level-pulse`, …) →
  `team-*`. Cosmetic; do it while renaming so nothing reads half-migrated.
- `CLAUDE.md` file-map line: update the three filenames and describe the surface
  as core-team onboarding.

## R6b — Verbatim copy replacements

Use these words exactly. Where a screen is not listed, leave it alone.

### Login screen

- Eyebrow: **CORE TEAM TRAINING**
- Headline: **Every one of us starts with the customer.**
- Sub: *Whatever you end up doing here — sales, operations, design, support — you
  start on the customer desk. This is where that begins.*
- Primary button: **I want to join the team**
- Secondary button: **I'm already on the team**
- Helper: *New here? Press "I want to join the team" to get started.*

(Fixes the old label mismatch, where the button said "become a marketer" and the
helper said "Press Become a Marketer".)

### Welcome screen

> **Welcome to chapter அ**
>
> We run small-group experiences and trips people genuinely love.
>
> Here's how we hire, and it's unusual: **everyone starts on the customer desk.**
> Designers, operations people, managers, support — everyone. Not as a hurdle to
> clear, but because it's the fastest way to learn the only thing that matters
> here: what our customers actually want, what worries them, and what makes them
> finally say yes.
>
> You'll spend your first stretch as a **marketer** — talking to real people who
> want to come on our trips, and getting them there. What you learn on those
> calls is what makes someone good at every other job in this company.
>
> This training takes about 15 minutes. First you'll see what our customers see.
> Then you'll handle a booking yourself — every situation you'll actually face,
> one level at a time.

Button: **Start training**

### Map screen

Keep `Your training map` / *One real situation at a time.* and both act labels
(`Act 1 · Be the customer`, `Act 2 · Be the marketer`) — they are concrete and
still accurate. Only the read-only revisit blurb changes: "…won't change your
live leads or **your team account**."

### Map finale (all 13 complete)

> **That's rung one.**
>
> You've seen what the customer sees, handled a lead from Pending to paid, chased
> the silent ones, saved an abandoned payment, and turned a sold-out date into a
> booking.
>
> That's the customer desk — where everyone here starts. What comes next depends
> on what you're good at and what we need: more events, a team to manage,
> operations, design, support. All of it starts with the calls you're about to
> make.
>
> One last step: your details — so we know who you are and where to pay you.

### Details form

- Keep the heading, the "Signing up as {email}" line, and the agreement text
  (it is role-accurate and still correct).
- Submit button: **Join the team** (was "Create my marketer account")
- In-flight label: **Setting up your account…**

### Success screen

> **You're on the team.**
>
> Your Team Dashboard is live — this is the real thing now, not practice.
>
> You're starting on the customer desk as a marketer. Leads arrive when you're
> **assigned to an event**, and events are staffed as they need people. A quiet
> first few days is normal — it means you're on the roster, ready to go. We'll
> message you on WhatsApp when your first event comes up.
>
> **What comes after** is up to the work: the people here in operations, design
> and management all started exactly where you're standing.

Button: **Open my Team Dashboard**

### "Already on the team" screen

> **You're already on the team.**
>
> Your Team Dashboard is ready. Open it to see your leads and your training.

Button: **Open Team Dashboard** · secondary: **Sign out**

Also: the read-only map's primary button reads **Back to my Team Dashboard**.

## R6c — "Why this matters later" (the strongest addition)

Add a `whyLater: string` field to the `MarketerLevel`/`TeamLevel` type and render
it as a small muted callout **after the mock, before the check** — the zoom-out
beat once they've done the hands-on part. Label it **Why this matters later**.
Style it distinctly from lesson body (e.g. a gold left-rule, muted text).

This is what turns the philosophy from one assertion on the welcome screen into
something felt thirteen times.

| L | Text |
|---|---|
| 1 | Anyone who redesigns this page needs to know where a first-time visitor gets confused. You're about to find out first-hand. |
| 2 | You'll never design a booking flow well until you've been through one as the customer. |
| 3 | Round-robin is a fairness rule. Anyone who manages a team here will one day have to decide how work gets shared out. |
| 4 | This page *is* our operations dashboard. Learn what's on it now; some of you will decide what goes on it next. |
| 5 | These eight words are the company's shared vocabulary. Every report, every meeting, every product decision uses them. |
| 6 | This is our core loop. Every improvement we ever make is a change to one step of it. |
| 7 | The messages and timeline they receive are our product too. When one confuses a customer, the person who notices is usually the one on the phone. |
| 8 | Silence is data. A broken message or a confusing invite gets found here first. |
| 9 | Every abandoned payment is either a trust problem or a friction problem. Learning to tell which is a product skill. |
| 10 | The Doubts tab is the rawest feed of what our website fails to explain. Read enough and you'll know exactly what to rewrite. |
| 11 | Which dates sell out and which don't is our demand data. It decides what we run next. |
| 12 | Commission per ticket, tickets per event — this is the unit economics of the business, seen from the inside. |
| 13 | How we sound on a call *is* the brand. Whatever you go on to do here, you'll be protecting it. |

## R6d — FAQ sheet ("I Have a Doubt")

Keep the header **Got a question? 🤔**. Reorder so the reframe leads, rewrite the
first entry, and add two. Final order and text:

**1. "I applied for a core team / operations / design role — why am I doing sales?"**
> Because it's how everyone here starts, including the people already doing those
> jobs. A few weeks of real customer calls teaches you what no handover document
> can: what people actually want, where our website loses them, which parts of
> the experience they care about. When you move into another part of the company,
> you'll decide with that in your head instead of guessing.

**2. "So is this a sales job or not?"** _(NEW — the anti-bait-and-switch answer;
do not soften it)_
> Right now, yes. You'll be calling and messaging real customers and getting them
> booked. That's the job you're training for and the job you'll start. Where it
> goes depends on how you do and what the team needs — we don't promise a
> timeline, but the door is genuinely open, and it's the only door.

**3. "How do I move into the core team?"** _(NEW)_
> Do the customer desk well, and say what you're interested in. The people who
> move up are the ones who close well, keep their word to customers, and *notice
> things* — a confusing message, a date that always sells out, a question that
> keeps coming up. Tell us what you notice. That's the audition.

**4–8.** Keep as-is: *Do I need any experience* · *Do I have to pay anything to
join* · *How much can I earn* · *How much time does this take* · *When do I start
getting customers to call*.

**9.** Keep *"I have another doubt."* → Contact Us on WhatsApp
(`https://wa.me/919940111564`, owner-confirmed).

**Delete** the old *"I applied for a support / core role — why am I doing
sales?"* entry — entry 1 replaces it.

## R6e — Keep the source doc in sync (do not skip)

`TEAM-ONBOARDING-COMPLETE-HANDOFF.md` **Part E is the canonical copy
source**, and R4 already instructed a future agent to "restore copy from Part E
verbatim". If Part E still holds the old marketer-framed copy, a later
consistency pass will silently revert this entire phase.

Update Part E with every replacement above, retitle the document's surface from
"marketer onboarding" to "core team onboarding", and note the `/team` route.

**Verify R6:** `npx tsc --noEmit`; load `/team` and confirm it renders;
confirm `/marketer` no longer resolves; grep the repo for leftover
`/marketer`, `MarketerOnboarding`, and `marketerOnboarding` strings (the edge
function and DB names are expected hits — nothing in the UI layer should be).
Screenshot the login and welcome screens. STOP.

---

# PHASE R7 — Rebuild Act 1 so it looks like the real booking flow

## The defect

**The real `/plans` is a chat conversation. The Act 1 mock is a card catalogue.**
This is not a styling gap — it is the wrong interaction model, and Act 1's entire
promise is *"see what your customer sees."* A trainee finishes it today without
learning that the product is a conversation at all. When a lead says *"the chat
asked me which city and I picked Chennai,"* the marketer should picture it
instantly.

**It is also cheaper to build than what is there now** — static bubbles, a typing
delay and three gold buttons is less code than the gradient hero and photo strip.

## What the real UI actually is (read the code; do NOT load `/plans`)

Loading `/plans` fires a real `trackEvent('page_view')` into `flow_analytics`.
Read these instead:

| Element | Reality | Source |
|---|---|---|
| Bot message | White bubble, left-aligned, `rounded-r-2xl rounded-bl-2xl shadow-sm`, `max-w-[90%] px-4 py-3`, `text-[15px] leading-relaxed`, 10px grey timestamp floated right; enters `opacity 0→1, y 10→0, scale .95→1`; typing dots first | `AppFlow.tsx:3534-3552` |
| Customer reply | **They never type.** Gold reply buttons stacked right-aligned: `px-5 py-3 bg-[#FFD700] text-black rounded-2xl text-sm font-semibold shadow-sm active:scale-95 flex items-center gap-3 justify-between min-w-[160px]`, `Send` icon on the right, shimmer sweep staggered per button | `AppFlow.tsx:1891`, `2002-2021` |
| Event list | Those same gold buttons, labelled with the event's **`one_liner`** — for this event, **"Our Chill Sunday Meetups"**, *not* "Chill Sunday Meetup" | `AppFlow.tsx:2002` |
| After selecting | Full-sheet `EventDetailsOverlay` → calendar sheet → `ApplicationForm` | `AppFlow.tsx:3798`, `411` |

## R7a — L1's three screens

| Screen | Build |
|---|---|
| 1 | **The chat.** Two or three bot bubbles with typing dots (greeting, then the city question), gold reply buttons for the city, then the events list as gold `one_liner` buttons. The trainee taps **"Our Chill Sunday Meetups"**. |
| 2 | **The details sheet**, using the event's real `quick_info` verbatim: *Your Own Transport* · *ppl who bond over stories, chaos & good times* · *Nungambakkam* · *Group Size 25*. Price **₹359**, both Sunday dates, bottom CTA **"Apply Now"** (the event's real Calendar CTA). |
| 3 | The booking timeline — the existing one is fine; keep the dated meeting-spot step and its scroll gate. |

## R7b — L2's application form is the wrong variant

Chill Sunday Meetup is `booking_url = 'native-application'` — **invite-only**,
not an open event. So:

- The real form asks **name + phone (`/^[6-9]\d{9}$/`) + T&C checkbox**. Email is
  collected on open (PayU) events only — do not add it here.
- **Date and meeting point are chosen in the overlay/calendar sheet *before* the
  form**, not as buttons on the form itself. Restructure the mock to match.
- Asking for the phone has a teaching bonus: the trainee sees exactly where the
  number they'll be calling comes from.

Keep the existing post-submit beat ("Application sent… your first lead is you")
and keep writing `test_application` to progress. **Nothing may touch
`applications`** — verify with a row count before and after.

## R7c — Fidelity bar

Keep the replica **schematic, not pixel-perfect** — the original handoff sets
that bar deliberately so the mock doesn't rot as `/plans` evolves. Chat shape,
gold reply buttons and real `quick_info` text clear it; chasing exact spacing
does not. Do not import from `AppFlow.tsx`.

## R7d — Fix two stale facts in the handoff

1. **Part E says "group of 22". The live event says 25** — it lives in the
   event's `quick_info` JSON, not the empty `group_size` column. The code is
   already correct at 25; **Part E is what's wrong.** Fix Part E and Appendix B.
   (An earlier review note asking to "confirm 22 vs 25" is superseded: 25 is
   confirmed from the live row.)
2. Part E's L1/L2 mock descriptions describe the card-list model. Rewrite them to
   the chat model above.

**Verify R7:** tsc; walk L1 and L2 in the browser and screenshot each screen;
`select count(*) from applications` before and after L2 to prove nothing was
written. STOP.

---

# PHASE R8 — Prod cleanup and commit hygiene (do last)

**R8a — delete the leftover prod test rows.** Two `marketer_signups` rows remain
from the owner's own testing:

- `krutesh08@gmail.com` (empty progress)
- `chapteraaa.official@gmail.com` (levels 1–4 completed)

Neither granted panel access (`is_marketer: false` for both), so they are
harmless — but the handoff requires cleanup. **Confirm with the owner first**
(these are their own accounts, and the second may be a deliberate demo). Show the
`RETURNING` output.

**R8b — split the commits.** `src/AdminPanel.tsx` mixes **two unrelated
concerns**: the onboarding Phase 5/6 work *and* the pre-existing unpushed
"reshuffle leads" + "Paid · past dates fold" work, plus a new `src/dateKeys.ts`.
House rule is one concern per commit. Stage explicitly by hunk:

- **Commit A — core team onboarding:** the three `src/TeamOnboarding*.tsx` files,
  the migrations, `supabase/functions/marketer-signup/`, the `App.tsx` `/team`
  route wiring, the `CLAUDE.md` file-map line, and only the onboarding hunks of
  `AdminPanel.tsx` (NEW badge, funnel strip, Training card, empty state).
- **Commit B —** the reshuffle / past-paid-fold work + `dateKeys.ts`.

Never mix `/creator` files into either. Verify with `git status --short` and
`git diff --cached` before and after each commit.

**Nothing is pushed without the owner's explicit go-ahead.** STOP.

---

# ─────────────────────────────────────────────────────────────────────────────
# REVIEW OF R6–R8 (2026-08-03) — what passed, and what R9–R11 fix
# ─────────────────────────────────────────────────────────────────────────────

**The reframe landed well.** Verified working — do NOT re-touch any of this:

- `/team` is the only route; `/marketer` is fully gone from the UI layer. PWA
  standalone exclusion, `trackEvent` exclusion, `showHomepage` guard and the
  render block are all correctly rewired.
- Files renamed to `TeamOnboarding{,Levels,Mocks}.tsx`; storage keys →
  `teamOnboardingProgressV1` / `teamOnboardingIntent`; CSS prefix → `team-*`.
  Edge function and all `marketer_*` DB names correctly left alone.
- Login, welcome, finale ("That's rung one."), details, success and
  already-on-team copy are **verbatim** to spec.
- All 13 `whyLater` lines present, rendering in the right place
  (content → mock → **Why this matters later** → check) with the gold left-rule.
- FAQ reordered correctly, both new entries present verbatim, old
  "support / core role" entry removed.
- Act 1 is now genuinely chat-shaped: bot bubbles, gold reply buttons with the
  `➤` glyph, typing state, `"Our Chill Sunday Meetups"` as the event label, the
  real `quick_info` chips (incl. Group Size 25), and **"Apply Now"** as the CTA.
- L2 is the correct invite-flow variant: name + phone (`/^[6-9]\d{9}$/`) + T&C,
  with date and meeting point shown as pre-chosen read-only captions.
- `submit_attempts` is gone from the client progress type (R1 holds).
- The marketer empty-state coaching exists in `AdminPanel.tsx` (~4849).
- **Commits are correctly split** — `0b42e85` is onboarding only, `6239900` is
  the reshuffle + `dateKeys.ts` only. Nothing pushed.
- **The funnel fix is verified live on prod:** intents went 12 → 14 and both
  testers now have rows. The Performance tab now reads a truthful
  *14 entered · 12 became marketers · 2 didn't finish*.

R9–R11 below are the remaining gaps.

---

# PHASE R9 — Act 1 chat fidelity: three small misses

The chat replica is structurally right. These three details undercut it, and all
three are in the **first screen a trainee ever sees**.

**R9a — the typing dots don't animate.** `TeamOnboardingMocks.tsx:101` references
`animation: team-dot-pulse …`, but **`@keyframes team-dot-pulse` is not defined
anywhere in the repo**. `TeamOnboarding.tsx` defines only `teamCtaShimmer`,
`teamLoaderEnter`, `teamLoaderGlow`, `teamSpinner` and `teamLevelPulse`. The dots
render as three static grey circles, so the one moment that sells "this is a live
conversation" is dead.

Add the keyframe to `SharedStyles` alongside the others, and include it in the
existing `@media (prefers-reduced-motion: reduce)` block:

```css
@keyframes team-dot-pulse { 0%,80%,100% { opacity:.25; transform:translateY(0); }
                            40% { opacity:1; transform:translateY(-2px); } }
```

Note the naming inconsistency while you're there: every other keyframe in this
file is camelCase (`teamCtaShimmer`), this one is kebab. Pick one — camelCase
matches the file.

**R9b — the customer's own reply bubble is the wrong colour.**
`TeamOnboardingMocks.tsx:135` renders the echoed city choice as
`background: INK, color: '#fff'` — a **black** bubble. In the real app the
customer's messages are **gold with black text** (`bg-[#FFD700] text-black`,
`AppFlow.tsx:3543`); it is the *bot* that is white. Getting this inverted teaches
the trainee the wrong picture of the screen their lead is looking at — which is
precisely what R7 existed to prevent.

Fix: gold background, `INK` text, keep the right-aligned tail radius.

**R9c — chat header. ✅ ALREADY DONE (2026-08-03) — do not redo.** The header read
**"Chapter"** with a `C` avatar and an invented subtitle *"Your weekend
co-pilot"*. The owner asked for the subtitle to go. It now reads **chapter அ**
with the `அ`-in-a-black-rounded-square avatar, matching `Wordmark()` and the real
product (`AppFlow.tsx:2097+`). tsc green.

**Verify R9:** `npx tsc --noEmit`; open L1 in the browser and confirm the dots
animate (R9a) and the city reply is gold (R9b) — the header (R9c) is already
correct. Screenshot the chat screen. STOP.

---

# PHASE R10 — Reframe leftovers

**R10a — one stale error string.** `TeamOnboarding.tsx:387` still says
*"This **marketer account** is inactive. Contact the founder for help."* Under
the reframe this should read **team account**. (The `inactive_marketer` error
*code* stays as-is — that is server contract, not copy.)

Sweep for any other user-visible "marketer account" / "marketer dashboard"
phrasing at the same time. Expected remaining hits are all non-UI: the edge
function, DB identifiers, and an `AdminPanel.tsx` code comment about commission
banners — leave those.

**R10b — the handoff docs are still named for the old framing.** Three files in
the repo root now describe a surface that no longer exists under that name:

| Now | Rename to |
|---|---|
| `MARKETER-ONBOARDING-COMPLETE-HANDOFF.md` | `TEAM-ONBOARDING-COMPLETE-HANDOFF.md` |
| `MARKETER-ONBOARDING-REVISIONS.md` (this file) | `TEAM-ONBOARDING-REVISIONS.md` |
| `marketer-onboarding-level-copy.md` | `team-onboarding-level-copy.md` |

Use `git mv` for the tracked one so history follows. Then fix every
cross-reference: inside these docs, in `CLAUDE.md`, and in
`marketer-self-serve-onboarding-proposal.md`. Leave
`MARKETER-ONBOARDING-HANDOFF.md` and the original proposal file alone — they are
superseded historical records and renaming them would only confuse the trail.

**Verify R10:** grep the repo for `MARKETER-ONBOARDING` and confirm every
remaining hit is a deliberate historical reference. STOP.

---

# PHASE R11 — Prod cleanup (supersedes R8a) — ✅ DONE 2026-08-03

**Owner approved and this has been executed. Do not re-run it.** Kept below for
the record and for the "note for the future" at the end, which still applies.

Deleted, with `RETURNING` shown to the owner:

| Table | Rows removed |
|---|---|
| `marketer_signups` | `krutesh08@gmail.com`, `chapteraaa.official@gmail.com` (both `in_progress`) |
| `marketer_signup_intents` | the same two emails (both `completed_at IS NULL`) |

Both deletes carried guards — `status = 'in_progress'` and
`completed_at IS NULL` — so an enrolled marketer or a completed funnel row could
not have been caught by them.

**Verified after:** `marketer_signup_intents` reads **12 entered · 12 became
marketers · 0 didn't finish**, and `marketer_signups` is empty. Clean baseline —
the first number the owner sees will be a real applicant.

**Read-only recheck, 2026-08-03:** the live aggregate is now **13 entered · 12
became marketers · 1 didn't finish**, with one fresh `in_progress` signup created
after the cleanup. That is the expected post-baseline behavior described in the
future note below; the new row was not treated as test data and was not deleted.

---

_Original context, for the record:_

Two testers went through the flow on prod:

- `krutesh08@gmail.com` — empty progress
- `chapteraaa.official@gmail.com` — levels 1–4 completed

Neither was ever granted panel access (`is_marketer: false` for both), so there
is no security issue. The reason to clean up is **funnel accuracy**.

**Why this is not the same job R8a described.** When R8a was written, these two
had *no* `marketer_signup_intents` rows — the funnel RPC was silently dead. That
is now fixed, and both testers have intent rows. So the Performance tab currently
reads **14 entered · 12 became marketers · 2 didn't finish**, and those 2 are the
owner's own tests. Deleting only the `marketer_signups` rows would leave the
funnel reading "2 didn't finish" **forever**, with no row left to explain why.

Delete from **both** tables, in this order, and show the `RETURNING` output:

```sql
delete from public.marketer_signups
 where email in ('krutesh08@gmail.com','chapteraaa.official@gmail.com')
returning email, status;

delete from public.marketer_signup_intents
 where email in ('krutesh08@gmail.com','chapteraaa.official@gmail.com')
   and completed_at is null          -- never delete a completed row
returning email, first_seen_at;
```

Then re-check the funnel reads **12 entered · 12 became marketers · 0 didn't
finish** — a clean baseline, so the first real number the owner sees is a real
applicant and not an artefact of testing.

**Note for the future:** any owner/founder walkthrough of `/team` while signed in
will now create an intent row and show up as "didn't finish". That is the tracker
working correctly, not a bug — but it is worth knowing before reading the number.

**Verify R11:** the two SELECTs above return the expected counts. STOP.

---

# Owner action items (surface at the right phase; never do these yourself)

| When | What |
|---|---|
| ✅ done | Deploy `marketer-signup` (rate-limit rewrite, R1) |
| ✅ done | Split the commits (R8b) — `0b42e85` onboarding, `6239900` reshuffle |
| ✅ done | Drop the *"Your weekend co-pilot"* subtitle + fix the chat header brand (R9c) |
| ✅ done | Approve + execute the test-row deletion (R11) — funnel baseline now 12 · 12 · 0 |
| Anytime | Record the vertical welcome video → provide the Vimeo id |
| Anytime | Record the 3 L13 sales-call voice notes → provide URLs |
| Before launch | Review the reframe copy end-to-end — it is written to sound like the owner and should be edited freely |
| Each phase end | Review + explicit go-ahead; approve any push separately |

**No edge-function deploys are needed for R9–R11.** All three phases are
frontend, copy, docs, SQL cleanup and git — `marketer-signup` is already deployed
and unchanged.

# Definition of done (R9–R11)

- The Act 1 chat replica is faithful in all three respects: typing dots animate,
  the customer's own bubble is **gold with black text**, and the header reads
  **chapter அ**.
- No user-visible string anywhere says "marketer account" or "marketer
  dashboard"; the handoff docs are renamed to `TEAM-ONBOARDING-*` with every
  cross-reference updated.
- Prod carries no test rows in `marketer_signups` **or**
  `marketer_signup_intents`, and the Performance funnel reads a clean
  *12 entered · 12 became marketers · 0 didn't finish*.
- `npx tsc --noEmit` green; nothing pushed without explicit approval.

# Still outstanding at launch (not blockers, tracked here so they aren't lost)

1. **The welcome video is still a placeholder.** R2 made it degrade gracefully,
   so no trainee sees a 404 — but the welcome screen has no video until the owner
   records one.
2. **The L13 founder voice notes are still placeholders** (the level gates itself
   open while they are absent, by design).
3. **Nothing is pushed.** Both commits are local. `/team` goes live only on the
   owner's explicit go-ahead.
