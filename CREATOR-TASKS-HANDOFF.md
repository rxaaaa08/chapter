# CREATOR VIDEO TASKS + SUBMISSIONS — BUILD HANDOFF

_Written 2026-07-25. Design locked with the owner in one session on the same day.
Phase 1 is BUILT. Everything else is specified below and can be picked up by a
fresh session. Where this document contradicts an older creator doc, THIS
document wins — it is newer._

Related reading (context only, do not re-derive from them):
`creator-self-serve-onboarding-proposal.md` (the signup flow),
`CREATOR-ONBOARDING-HANDOFF.md` (the 5-level onboarding — its Phase I3 built the
checklist card this work extends).

---

## 0. Status board

| Phase | What | Status |
|---|---|---|
| **1** | `creator_submissions` table + RLS + `submit_creator_video()` RPC | ✅ **BUILT** — migration applied to prod, committed `a726918` |
| **2** | Creator dashboard: 6th checklist step, "Your Tasks" mode, submission card | ✅ **BUILT** — `c211388` (new `src/CreatorVideoTasks.tsx`), `48719ae` (wiring) |
| **3** | Admin: the simple creator-activity table + review | ⬜ not started |
| **4** | Gender field at creator registration | ⬜ not started — **needs an owner edge-function deploy** |
| **5** | Refresh the onboarding demo replica (level 3) to match | ⬜ not started |

Nothing has been pushed. `main` currently carries commit `a726918` unpushed.

---

## 1. The problem, in one paragraph

Self-serve onboarding means we can hire creators without meeting them — but at
20, 50, 100 creators nobody can tell who is actually making videos and who is
just sitting in the roster collecting a dashboard login. Today the only way to
know is to ask them on WhatsApp, one by one, which does not survive scale. This
build gives every creator a visible task ("make a video for the upcoming event"),
a place to paste the video link, and gives the founders one simple table that
answers "who is working and who is not" at a glance.

**The tracking philosophy:** a submission is self-reported, but the system
already holds an unfakeable second signal — link clicks. Judge a creator on the
pair: submissions say _did they do the work_, clicks say _did it reach anyone_.
Phase 3 puts the submission half on screen; the clicks half already exists.

---

## 2. Locked decisions — do NOT reopen these

Owner decisions from 2026-07-25. A future session should build these, not
redesign them.

**Scope / model**
- ✅ **No campaign or assignment system.** Nothing is assigned per creator. A
  task is DERIVED at read time from events that have creator commission on.
- ✅ **Every onboarded creator sees the same tasks.** No targeting, no tiers.
- ✅ **Tasks are per DATE, not per event** — a recurring event (Chill Sunday)
  asks for a fresh video for each upcoming date, so tracking stays alive after
  month one. One task per event at a time = its **nearest** upcoming date.
- ✅ **No deadlines.** A video posted the day before the event still brings
  leads. Nothing is ever "overdue" or "missed".
- ✅ **No in-system nudging.** The owner blasts the creator WhatsApp group when
  an event opens. No per-creator reminders, no WhatsApp templates, no cron.
- ✅ **Founders review, not ops.** Gated on `is_admin_strict()`. Moves to
  managers later, not now.
- ✅ **One link field only.** No Instagram/published-post link — the owner does
  not want to give creators more work.

**Creator-side behaviour**
- ✅ New checklist step **"Submit a video for the Upcoming Event"**, inserted
  **before** "Get your first 25 clicks". Hint: _"Use the card below to send us
  your video."_ No button on the step — the submission card sits right below.
- ✅ It ticks on their **first ever** submission (a one-time milestone, like the
  other checklist steps). The recurring ask lives in the task card.
- ✅ **The checklist card never disappears.** Once all six steps are done it
  switches to a **"Your Tasks"** card showing the current task(s).
- ✅ The submission card shows **all** commission-enabled upcoming events, as
  rows, **nearest date first** — so Chill Sunday Meetup is naturally on top and
  is the first video a new creator makes.
- ✅ **Show the commission** ("earn ₹27 per booking") on each row.
- ✅ **Repeat submissions allowed**, unlimited (server caps at 10 per task).
- ✅ **No submission history shown to the creator** — only the current state of
  each task. (Owner: "no need".)
- ✅ **No editing a submitted link.** They submit another one instead.
- ✅ After "Ask changes": the creator sees the note, and the field reopens.
- ✅ **Any http(s) link accepted**, with one helper line: _"make sure anyone with
  the link can view it."_ Not Drive-only.

**Owner-side**
- ✅ The admin view is **one simple table**, one row per creator: handle ·
  videos · last video · a **Review** chip only when something is pending.
  Expanding the row shows their submissions with the links and the buttons.
- ✅ Two review outcomes: **Approve** / **Ask changes**. Note optional on both.
- ✅ A small pending count next to the section title.
- ✅ Lives inside the existing **Performance → Creators** area.

**Explicitly NOT in scope** (the owner cut these deliberately — do not build
them "while you're in there"): campaigns, deadlines, reminders/automated nudges,
per-creator assignment, Instagram link capture, creator health scores /
auto-pause, manager review, per-task payments, video uploads to our storage.

---

## 3. Safety rules (violating any of these is a failed build)

1. **The Supabase DB is PRODUCTION with live customers and live creators.**
   `creator_submissions` is a new, empty table — safe to write test rows, but
   delete them afterwards and never touch `affiliates` rows you did not create.
2. **Never `git push`** without the owner's explicit go-ahead in that turn.
3. **Never deploy edge functions.** Phases 2, 3 and 5 need no function change at
   all. Phase 4 does — the OWNER deploys it, never you.
4. **`npx tsc --noEmit` must pass after every edit.**
5. **Stage files by name** (`git add src/CreatorDashboard.tsx …`), never
   `git add -A`. `git status --short` before and after every commit.
6. **One concern per commit.**
7. `/creator` renders inside the MobileShell phone frame on desktop — use
   `height: 100%`, never `100vh`. Verify at 375×812.
8. The creator dashboard is **live code for real creators**. Additions only;
   do not refactor its auth or data layer (see the auth-callback-race note in
   CLAUDE.md / memory).

---

## 4. The data model (Phase 1 — as built, do not change)

Migration: `supabase/migrations/20260725_creator_video_submissions.sql`,
applied to prod and committed.

```
creator_submissions
  id            uuid pk
  affiliate_id  uuid not null → affiliates(id) on delete cascade
  event_slug    text not null
  event_date    date not null      -- the specific upcoming date this video is for
  video_url     text not null
  status        text not null default 'pending'
                  check in ('pending','approved','changes_requested')
  review_note   text
  submitted_at  timestamptz not null default now()
  reviewed_at   timestamptz
  reviewed_by   text
```

Indexes: `(affiliate_id, submitted_at desc)`, `(status, submitted_at desc)`,
`(event_slug, event_date)`.

**RLS**
- `creator_submissions_admin_all` — `is_admin_strict()` for ALL. Ops/staff
  deliberately cannot see or review creator videos.
- `creator_submissions_self_select` — SELECT where
  `affiliate_id = current_affiliate_id()`. Creators read their own rows only.
- **No insert/update policy for creators.** The only write path is the RPC, so
  `status` / `review_note` / `reviewed_*` can never be forged from the client.

**`submit_creator_video(p_event_slug text, p_event_date date, p_video_url text)`**
`SECURITY DEFINER`, returns `(id, status, submitted_at)`. Server-side it checks:
caller is an **active** creator (`current_affiliate_id()`), the URL starts with
`http(s)://` and is ≤500 chars, the event exists + `is_active` +
`affiliate_enabled`, the date is a real `event_dates.start_date` for that event
and is **not in the past** (IST), and that this creator has fewer than 10
submissions on that task. Verified: calling it without a creator session raises
`42501 An active creator account is required`.

**Admin review is a plain UPDATE** through the strict-admin policy (set
`status`, `review_note`, `reviewed_at = now()`, `reviewed_by = <admin email>`).
No RPC needed.

---

## 5. The task-derivation rule (the heart of the feature)

There is no task table. Both the creator dashboard and the demo compute tasks
the same way, reusing the exact filter `CreatorUpcomingEvents.tsx` already uses:

```
fetchEvents()
  → keep events where affiliateEnabled
      && bookingFlow !== 'whatsapp'
      && resolveDefaultFullPrice(event) > 0
  → for each, take upcoming dates (>= today IST), sorted;  drop events with none
  → the TASK is the event + its NEAREST upcoming date
  → sort tasks by that date, ascending
```

Commission per booking = `resolveDefaultFullPrice(event) * affiliateCommissionPct / 100`,
rounded, `toLocaleString('en-IN')`.

**Important:** `resolveDefaultFullPrice` (in `src/eventPricing.ts`) resolves
**city-level pricing** — Chill Sunday's price lives in
`city_details.Chennai.price_full = 359`, while the event-level `price_full` is 0.
Never read `price_full` directly or the card will show ₹0.

**Live values on 2026-07-25** (verify at build time, they will change):

| Event | Slug | Next date | Price used | Pct | Earn/booking |
|---|---|---|---|---|---|
| Chill Sunday Meetup | `anna-nagar-meetup` | 2026-08-02 | ₹359 (Chennai) | 7.5% | **₹27** |
| Sunrise at Kovalam | `sunrise-at-kovalam` | 2026-08-16 | ₹699 (Chennai) | 8% | **₹56** |

Kovalam prices differently per city (Chennai ₹699 with the bus, Kovalam ₹299
own-transport). `resolveDefaultFullPrice` takes the FIRST configured city, so
the card advertises ₹56 — matching what the existing "See upcoming events" card
already shows. Keeping the two cards consistent matters more than picking a
different city here; if the owner wants a range ("₹24–56") that is a change to
both cards, not just this one.

Pondy Beach Houseparty currently has `affiliate_enabled = false`, so it is not a
task. Flipping that flag on an event is the ONLY action needed to give 100
creators a new task — that is the design goal.

---

### 5.1 Adjacent fix already shipped — how commission is actually calculated

A creator's commission is NOT the number on the task card. It is computed at
`fully_paid` from **the city the buyer picked**: `pct × price for that city`. So
Sunrise at Kovalam pays ₹56 on a Chennai ticket (₹699) and ₹24 on an
own-transport Kovalam ticket (₹299). The card shows one figure — see the open
question about a range in §11.

While verifying that, a live hole turned up and was fixed in
`20260725_affiliate_commission_price_fallback.sql` (commit `647ee0b`): the
accrual fell back to the invisible plan-level `events.price_full` when the city
didn't match, which is **0** on every event created since June — the amount
rounded to zero and **no commission row was written at all**, silently. A
booking recorded as `'chennai'` instead of `'Chennai'` was enough to trigger it,
because the accrual matched city keys case-sensitively while checkout matches
case-insensitively. The affiliate accrual now resolves its own price (buyer's
city case-insensitive → lowest offered city price → legacy column). All 24
commissions ever accrued recompute to their stored amounts, so nothing owed
changed.

**Still open, deliberately not done:** `event_net_price` keeps the old fallback
for checkout, revenue/profit reporting and marketer/manager commission. Kovalam's
plan-level ₹900 means an unmatched city at checkout would **overcharge** a
customer (₹900 vs ₹699/₹299). Latent — every application on record carries a
valid city. Fixing the shared function moves reported revenue, so it needs its
own session with before/after verification.

## 6. PHASE 2 — the creator dashboard

Files: `src/CreatorDashboard.tsx`, `src/CreatorFirstBookingChecklist.tsx`, plus
one new `src/CreatorVideoTasks.tsx`. No backend work.

### 6.1 Data the dashboard must load

1. **Tasks** — `fetchEvents()` + the §5 rule. (The dashboard already imports
   `CreatorUpcomingEvents` which fetches the same data; a second `fetchEvents()`
   call is acceptable and simplest — do NOT thread state through that component.)
2. **My submissions** — `supabase.from('creator_submissions').select('*').order('submitted_at', { ascending: false })`.
   RLS scopes it to the signed-in creator; no filter needed. Derive:
   - `hasEverSubmitted = rows.length > 0` → ticks the new checklist step.
   - `latestByTask[event_slug + '|' + event_date]` → the state of each task row.
   Both loads follow the existing settled-auth pattern (after `me` resolves),
   never inside `onAuthStateChange`.

### 6.2 The checklist card — 6 steps

In `CreatorFirstBookingChecklist.tsx`, insert **before** the `click` step:

```
{ key: 'video', done: hasEverSubmitted,
  title: 'Submit a video for the Upcoming Event',
  hint: 'Use the card below to send us your video.' }
```

New prop `hasEverSubmitted: boolean`. No `link`/`cta` — the step has no button.
Update the file's header comment (it documents five steps).

### 6.3 The card no longer disappears — it becomes "Your Tasks"

Today `CreatorDashboard` renders the card only when `!checklistComplete`. Change
to: **always render** (while `me.active`), with two modes.

- **Mode A — checklist incomplete:** exactly as today, now with 6 steps, title
  **"Your Checklist"**.
- **Mode B — all 6 done:** title **"Your Tasks"**. Body = one row per task:
  > **Make a video for Chill Sunday Meetup** · Aug 2
  with a ✓ tick when this creator has submitted for that exact task, same tick
  visual as the checklist so the card feels continuous.
  - When every open task has a submission: a caught-up line —
    _"You're all caught up — we'll add the next event soon."_
  - When there are no open tasks at all: the same caught-up line. **The card
    must never render empty and never disappear** — that is the whole point of
    the change.
- Keep the existing dashed-gold card styling in both modes.

Mode B shows only done/not-done. **Approval status is not shown here** — it
lives in the submission card below.

### 6.4 The submission card (new `CreatorVideoTasks.tsx`)

Sits **directly below** the checklist/tasks card, above "The Essentials".
Visible from day one (before the checklist is finished), for active creators.
Presentational + its own submit call; it owns no dashboard state beyond its own.

One block per task, nearest date first:

```
Chill Sunday Meetup · Aug 2 · earn ₹27 per booking
<state>
```

States:

| State | Shows |
|---|---|
| Nothing submitted | Link input (`placeholder="Paste your video link"`) + **Submit** button + helper _"Make sure anyone with the link can view it."_ |
| `pending` | "Submitted Jul 26 — under review" + a small text button **Send another video** that reopens the input |
| `approved` | Green "Approved" + the same small **Send another video** |
| `changes_requested` | Amber "Changes requested" + the review note + the input reopened |

Submit calls `supabase.rpc('submit_creator_video', { p_event_slug, p_event_date, p_video_url })`.
On success, optimistically set that task to `pending` and lift the new row to
the dashboard (so the checklist step ticks immediately). On error, show the
server's message verbatim — the RPC's messages are already creator-friendly.
Disable the button while in flight and when the input is empty.

If there are no tasks, render nothing (the tasks card above already explains).

**Verify (375×812):** the checklist shows 6 steps with the new one 4th; the
submission card sits directly under it; submitting one link ticks the checklist
step and flips the row to "under review"; after all 6 steps the card retitles to
"Your Tasks" without vanishing; no horizontal scroll; console clean; tsc green.

Commits: (a) checklist step + card mode switch, (b) the submission card.

---

## 7. PHASE 3 — the admin table

File: `src/AdminPanel.tsx`, in the **Performance → Creators** area. Strict-admin
only — hide the whole section when the signed-in admin is not strict (RLS would
return an empty list anyway; hiding avoids a confusing blank).

**Load:** `creator_submissions` (all rows — RLS gates it) + the creators list
already loaded there. Merge client-side; at 100 creators × a few videos this is
tiny, so no RPC, no view, no aggregation in SQL.

**The table** — one row per creator, **sorted by last video ascending with
blanks first**, so the people doing nothing float to the top:

| Creator | Videos | Last video | |
|---|---|---|---|
| @newguy | 0 | — | |
| @priyashoots | 1 | Jul 12 | |
| @tamiltrekker | 3 | Jul 24 | **Review** |

- The **Review** chip renders only when that creator has ≥1 `pending` row.
- A pending count next to the section title ("Creator videos · 4 to review").
- Tapping a row expands it: each submission shows event + date, the link
  (opens in a new tab), submitted date, current status, and for pending ones
  **Approve** / **Ask changes** with an optional note input.
- Both actions UPDATE the row (`status`, `review_note`, `reviewed_at = now()`,
  `reviewed_by` = the admin's email) and refresh in place.

**Verify:** simulate by inserting a row with SQL against a real creator, review
it from the panel, confirm with a SELECT, then delete the test row.

Commit: `Creator videos: founders' review table in Performance`.

---

## 8. PHASE 4 — gender at creator registration

Owner request, 2026-07-25. This is the ONE phase that touches the edge function,
so it carries a deploy dependency.

1. **Migration** (additive, nullable — existing creators stay `NULL`):
   ```sql
   alter table public.affiliates
     add column if not exists gender text
     check (gender is null or gender in ('male','female','other'));
   ```
2. **`src/CreatorOnboarding.tsx`** — a required field on the details form,
   placed after "Your name / brand": three segmented options **Male / Female /
   Other**. Add it to `canSubmit`/`canAttemptSubmit`, and to the POST body as
   `gender`.
3. **`supabase/functions/creator-signup/index.ts`** — read `body.gender`,
   validate it is one of the three, reject with a clear message otherwise, and
   include it in the existing `.insert({ handle, name, email, upi_id, phone, active: true })`.
4. **Admin:** show gender in the Performance → Creators list (one small column).

**⚠️ The deploy dependency — surface this to the owner, don't work around it.**
The live `creator-signup` ignores unknown body fields. So if the client change
ships before the owner redeploys the function, every creator who signs up in
that window is inserted with `gender = NULL` and it is silently lost. Two
acceptable orders — the owner picks:
- **(recommended)** Build all three pieces in one branch, owner deploys
  `creator-signup` FIRST, then we push the client. No gap.
- Push the client early and accept that gender is blank until the deploy.

A third option exists if the owner wants zero deploys ever: a small
`SECURITY DEFINER` RPC that lets a creator set their own gender once, called
right after signup. It avoids the deploy but leaves gender NULL if the tab is
closed at the wrong moment. Only take this route if the owner explicitly
chooses it.

Commits: migration / client field / edge-function change — separate, and the
function change is committed but **NOT deployed by us**.

---

## 9. PHASE 5 — keep the onboarding demo honest

`src/CreatorOnboardingDemos.tsx` level 3 is a schematic replica of the real
dashboard, and CLAUDE.md carries a drift note requiring it to be refreshed when
the dashboard changes. After Phase 2 ships:

1. Add a demo "Your Tasks" + submission card to the level-3 replica (static —
   the demos make **zero** network calls; that rule is absolute).
2. Consider one line in level 5 ("Important Rules & Advice") telling creators
   that posting for the events on their task list is the expectation. Copy is
   the owner's to approve.
3. Do not add a new level and do not touch the quiz — the client `CORRECT` array
   and the server `QUIZ_ANSWER_KEY` are frozen (see CREATOR-ONBOARDING-HANDOFF
   §3); changing them would force an edge-function redeploy.

---

## 10. Definition of done

- [ ] Checklist shows 6 steps, the new one 4th, ticking on the first ever
      submission.
- [ ] The card never disappears — it becomes "Your Tasks" and always shows
      either open tasks or the caught-up line.
- [ ] Submission card lists every commission-enabled upcoming event, nearest
      first, with the correct city-resolved commission (₹27 for Chill Sunday).
- [ ] Submitting works end to end; repeat submissions allowed; the four states
      render correctly; the review note is visible after "Ask changes".
- [ ] A creator can never see another creator's submissions (RLS), and can never
      set `status` themselves (no insert/update policy).
- [ ] Admin table lists every creator including those with zero videos, sorted
      so the inactive ones are on top; Review chip only when pending; approve /
      ask-changes writes and refreshes.
- [ ] Ops-role admins see no creator-video section.
- [ ] Gender captured at signup (after the owner's deploy) and visible in admin.
- [ ] `npx tsc --noEmit` green; 375×812 clean; console clean.
- [ ] Test rows deleted; `git status --short` clean; nothing pushed without the
      owner's explicit go-ahead.

---

## 11. Owner action items

1. **Deploy `creator-signup`** when Phase 4 is built (gender). Nothing else in
   this build needs a deploy.
2. **The push go-ahead** — Phase 1's migration is already live on prod, but its
   commit is unpushed, and no creator sees anything until Phase 2 ships.
3. **Flip `affiliate_enabled`** on any event you want 100 creators posting
   about — that is the entire "assign a task" action.
4. **Fill Chill Sunday's commission expectations honestly** — at ₹359 × 7.5%
   the card will read "earn ₹27 per booking". If that number feels too small to
   motivate posting, the lever is the commission pct or the price, not the copy.
