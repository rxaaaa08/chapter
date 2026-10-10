# MARKETER ONBOARDING — BUILD HANDOFF

_Written 2026-07-21 for the AI agent that will build this in a fresh session.
Read this document COMPLETELY before writing any code. All design decisions
are FINAL and owner-approved — do not re-litigate them, do not "improve" the
flow, do not add features not listed here._

## 0. The three documents and how to use them

| Document | Role |
|---|---|
| **THIS file** | Master build plan. Phases, schema, logic, level structure, guards, verification. Follow it in order. |
| `marketer-onboarding-level-copy.md` | **Canonical copy.** The exact on-screen text, toast text, button labels, check questions and options for every level. When building UI, take the words from there VERBATIM (the owner has reviewed them). If this handoff and the copy doc disagree on wording, the copy doc wins. |
| `marketer-self-serve-onboarding-proposal.md` | Background and rationale. Read for context; not needed during the build. |

Also read before starting: `CLAUDE.md` (house rules — they all apply),
`multi-marketer.md` (how the marketer system works — you are extending it).

**Sibling project, do NOT build it from here:** a parallel handoff exists for
the CREATOR onboarding demo levels — `CREATOR-ONBOARDING-HANDOFF.md` (with
`creator-onboarding-demo-proposal.md` + `creator-onboarding-level-copy.md`).
It is a separate build for a separate session; the owner assigns each
handoff independently. Relevant to you only as shared context: both trainings
use the same Duolingo-map pattern (demo events differ — this doc uses the
real Chill Sunday Meetup, the creator one uses a fictional Gokarna Beach
Weekend; do not "unify" them). If you find yourself editing
`CreatorOnboarding*.tsx` or anything under `/creator`, you are in the wrong
handoff — stop.

## 1. What you are building (one paragraph)

A self-serve onboarding at **`/marketer`** for new call marketers. The visitor
signs in with Google, watches a short vertical welcome video, then plays
through a **Duolingo-style map of 13 levels** (Act 1: experience the customer
side of chaptera.in/plans via a sandboxed replica and place a fake
application; Act 2: work that same fake application as a marketer through
every real situation — approve, re-target, cart-abandon, doubts, waitlist,
payouts, conduct). Each level ends with one multiple-choice check. After the
final level they submit name + phone + UPI + a conduct agreement, and the
system **enrolls them as a marketer immediately** (no human approval step) —
they land in the real admin panel with an empty "My Leads" dashboard. They
get no access to any customer data until an admin assigns them to an event
(which is not part of this build — it already exists).

## 2. NON-NEGOTIABLE safety rules (violating any of these is a failed build)

1. **The Supabase DB is PRODUCTION with live customers.** Test with phone
   `90000000xx` rows and Google emails you create for testing; verify writes
   with `RETURNING`; DELETE all test rows when done (show the owner).
2. **NEVER deploy edge functions.** Write the code; the OWNER deploys. Stop
   and tell the owner when a deploy is needed.
3. **NEVER `git push` without the owner's explicit go-ahead in that turn.**
   Pushing deploys the live site. One concern per commit.
4. **`npx tsc --noEmit` must pass after every code edit.**
5. **The working tree may contain uncommitted CREATOR-onboarding work**
   (`src/CreatorOnboarding.tsx`, `supabase/functions/creator-signup/`,
   `20260721_creator_onboarding_phase1_schema.sql`, edits in
   `CreatorDashboard.tsx`/`App.tsx`/`AdminPanel.tsx`/`supabase.ts`). Check
   `git status` first. NEVER mix creator files into marketer commits.
   If asked to commit, stage only your own files explicitly.
6. **Do not modify the behavior of `AppFlow.tsx` or the customer booking
   flows.** The Act 1 "replica" is built from scratch as new components that
   only LOOK like /plans — zero imports of AppFlow internals, zero changes to
   AppFlow.
7. **Local `npm run dev` talks to PROD Supabase.** Browsing your own new
   `/marketer` route is fine; do NOT exercise the real /plans booking flow or
   admin panel flows as "testing" — that creates real rows and real
   notifications.

## 3. The ONE security invariant you must never break

The marketer permission model (see `multi-marketer.md` §2) has a sharp edge:

- A row in `admin_users` with `role='ops'` grants admin-panel login.
- A row in `call_marketers` (active) makes that login a *marketer* — scoped
  to only their own leads.
- **An `admin_users` ops row WITHOUT an active `call_marketers` row is a
  "plain ops" user — they pass `is_admin_only()` and can read EVERY lead of
  EVERY event.**

Therefore: enrollment must create **both rows in one atomic Postgres
transaction** (the `enroll_marketer` SECURITY DEFINER function, Phase 1).
The browser NEVER inserts into these tables. The edge function NEVER does two
separate inserts. If the transaction fails, NEITHER row exists. There are no
exceptions to this.

Related: emails are stored **lowercase** and must exactly match the Google
JWT email — that's why the flow captures the email from the authenticated
session, never from a typed field.

## 4. Decisions already made (do not reopen)

- **Auto-enroll, no approval queue.** Safe because an unassigned marketer's
  RLS scope contains zero customer data. Event assignment (existing admin UI,
  untouched) remains the trust gate.
- **`reviewed_at` NEW badge** on self-joined marketers, in the Marketers tab
  roster AND the event-editor marketer multi-select. Review is optional,
  after-the-fact, never a gate.
- **Demo event = the REAL "Chill Sunday Meetup"** (slug `anna-nagar-meetup`).
  Verified in prod 2026-07-21: `payment_mode='full'` (single payment), price
  **₹359** (lives in `city_details->Chennai->price_full`; the event-level
  `price_full` column is 0 — don't be confused), single meeting point
  "Nungambakkam — 11:00 AM" (own transport), group size 22, Sunday dates, no
  `marketer_commission` override → default **₹50**/ticket applies.
  **Re-verify these against the live event before finalizing mock data**
  (one SELECT) — if they changed, update the mock AND the copy doc.
- **Mock dates:** Date A = Sun 2 Aug, Date B = Sun 16 Aug (fictional
  training dates in the event's real Sunday pattern; do NOT read real
  event_dates into the mock).
- **Split/advance payments are NOT taught anywhere.** Do not mention them.
- **English only.** No language toggle.
- **Not video-led:** ONE vertical 9:16 founder welcome video above the map
  (Vimeo, same embed pattern as `CreatorOnboarding.tsx` — placeholder id
  until the owner records; mark with a `TODO(owner)` comment like the
  creator one). L13 additionally plays founder VOICE NOTES via the
  "Founder's Note" player pattern from `AppFlow.tsx:~3710` (placeholder
  audio URL + `TODO(owner)`).
- **All teaching mocks are fake, in-memory, standalone components.** No DB
  reads/writes from any mock. No shared "test admin" login. No demo mode
  threaded through `AdminPanel.tsx` or `AppFlow.tsx`.
- **The trainee's L2 test application NEVER touches `applications`.** It is
  stored only in their `marketer_signups.progress` JSONB and rendered as the
  demo lead in Act 2.

## 5. Existing code to reuse (read these files first)

| File | What to take |
|---|---|
| `src/CreatorOnboarding.tsx` (~400 lines, in working tree) | The whole skeleton: step navigation with browser-history back (popstate pattern), progress dots, 9:16 Vimeo embed with loading spinner, quiz option shuffle + answer-token pattern, details-form styling (INK/MUTED/HAIR constants, input/button styles), edge-function call shape. Copy patterns; do not import from it. |
| `src/CreatorDashboard.tsx` | Google OAuth login screen UI + the **settled-auth pattern**: NEVER query RLS tables inside `onAuthStateChange` — the token isn't attached yet (this bug already bit /creator once; see memory note). Resolve the session first, then query. |
| `supabase/functions/creator-signup/` (in working tree) | Template for the edge function: reading email from the auth token, server-side quiz answer key, validation, service-role insert, response shapes (`ok`, `already_creator`, `handle_taken`, `quiz_failed`). |
| `src/AdminPanel.tsx:1103` (`saveNewMarketer`) | The founder-email guard you must replicate in `enroll_marketer`: if the email exists in `admin_users` with `role='admin'`, REFUSE (an admin email with a marketer side-car row silently loses the all-leads admin view). |
| `src/AdminPanel.tsx:1407` (`resendInviteDetails`) | Reference for what the L8 mock imitates (WhatsApp+email resend with per-channel sent ticks). Read-only reference — the mock is fake. |
| `src/AppFlow.tsx:~3705-3790` (Founder's Note) | The voice-note player UI pattern (scalloped button + tappable waveform, `preload="none"`). Rebuild a small copy for L13; do not import. |
| `src/App.tsx:~4600-4630` | Route wiring: `routePath === '/admin'`, `'/creator'`. Add `'/marketer'` here. **Careful:** the PWA standalone redirect at ~4603 redirects standalone launches away from unknown paths — make sure `/marketer` is excluded the same way `/creator` is, or the installed-app check will hijack the route. |
| `supabase/migrations/20260721_creator_onboarding_phase1_schema.sql` | Style reference for the migration (additive, nullable, backfill pattern). |

## 6. Phase-by-phase build plan

Build phases IN ORDER. Each phase ends with: `npx tsc --noEmit` green, the
phase's verification steps done, results shown to the owner, and a STOP for
the owner's go-ahead before the next phase. Do not push anything without
explicit approval.

---

### PHASE 1 — Schema (one migration file, invisible to all users)

Create `supabase/migrations/<date>_marketer_onboarding_phase1_schema.sql`
and apply it (migrations may be applied via MCP `apply_migration`; that is
allowed — it's edge FUNCTIONS you must not deploy).

**1a. `marketer_signups` table** (progress + funnel tracking; NOT a gate):

```sql
create table public.marketer_signups (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,            -- lowercase, from Google JWT
  name text,
  phone text,
  upi_id text,
  progress jsonb not null default '{}'::jsonb,
  quiz_passed_at timestamptz,
  agreed_at timestamptz,
  status text not null default 'in_progress'
    check (status in ('in_progress','enrolled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

`progress` JSONB shape (documented here; enforced by app code only):

```jsonc
{
  "current_level": 4,                  // next level to play (1-13)
  "completed": [1,2,3],                // level ids done
  "retries": {"3": 1, "5": 2},        // wrong-answer counts per level id
  "answers": {"1": "ref_site", ...},  // chosen answer token per check id
  "test_application": {                // written by L2
    "name": "…", "date": "2026-08-02",
    "meeting_point": "Nungambakkam — 11:00 AM"
  },
  "level_timestamps": {"1": "…iso…"}  // completion time per level
}
```

**RLS:** enable. Policies:
- SELECT/INSERT/UPDATE for `authenticated` where
  `email = lower(auth.jwt()->>'email')` (their own row only; needed for
  progress saves from the browser).
- ALL for founders via `is_admin_strict()` (funnel analytics).
- Nothing for `anon`.
- UPDATE policy must prevent flipping `status` to `'enrolled'` from the
  client: simplest is a `WITH CHECK` that forbids `status <> 'in_progress'`
  unless `is_admin_strict()`. Only the service-role edge function sets
  `enrolled` (service role bypasses RLS).

**1b. Additive columns on `call_marketers`** (all nullable — safe on live):

```sql
alter table public.call_marketers
  add column if not exists upi_id text,
  add column if not exists phone text,
  add column if not exists reviewed_at timestamptz;
-- Existing hand-added marketers are not "new": backfill so only future
-- self-enrolled rows show the NEW badge.
update public.call_marketers set reviewed_at = now() where reviewed_at is null;
```

**1c. `enroll_marketer` function** — THE trust boundary:

```sql
create or replace function public.enroll_marketer(
  p_email text, p_name text, p_phone text, p_upi text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_email text := lower(trim(p_email));
declare v_existing_role text;
begin
  -- Guard 1: never touch an admin email (mirrors saveNewMarketer).
  select role into v_existing_role from admin_users where email = v_email;
  if v_existing_role = 'admin' then
    return jsonb_build_object('ok', false, 'error', 'admin_email');
  end if;
  -- Guard 2: idempotent — already a marketer is success, not error.
  if exists (select 1 from call_marketers where email = v_email) then
    -- Ensure the login row also exists (heals a historical half-state).
    insert into admin_users(email, role) values (v_email, 'ops')
      on conflict (email) do nothing;
    return jsonb_build_object('ok', true, 'already', true);
  end if;
  -- The atomic pair (function body = one transaction).
  insert into call_marketers(email, name, phone, upi_id, active, reviewed_at)
    values (v_email, p_name, p_phone, p_upi, true, null);
  insert into admin_users(email, role) values (v_email, 'ops')
    on conflict (email) do nothing;   -- existing ops row is fine
  update marketer_signups set status='enrolled', updated_at=now()
    where email = v_email;
  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.enroll_marketer(text,text,text,text) from public, anon, authenticated;
-- callable only by service_role (the edge function)
```

**Phase 1 verification (all with SQL, show the owner):**
- `SELECT` the new columns exist; confirm every existing `call_marketers`
  row has `reviewed_at` set.
- Call `enroll_marketer('marketer-test-90000000xx@example.com', 'Test', '9000000001', 'test@upi')`
  via service role → verify BOTH rows exist (`RETURNING`/SELECT), verify
  re-calling returns `already:true` without duplicates, verify calling with
  a real admin email returns `admin_email` and changes nothing.
- Try `enroll_marketer` as `anon`/`authenticated` → must be permission-denied.
- DELETE the test rows from both tables (+ any test signup row); show the
  cleanup.

---

### PHASE 2 — `marketer-signup` edge function (written, NOT deployed by you)

Create `supabase/functions/marketer-signup/index.ts`, modeled on
`creator-signup`. Contract:

**Request:** POST, `Authorization: Bearer <supabase access token>` (Google
session), body:
```json
{ "name": "...", "phone": "...", "upi_id": "...",
  "answers": {"1": "token", "2": "token", ..., "13a": "token", "13b": "token"} }
```

**Logic, in order:**
1. CORS + method check (copy creator-signup's).
2. Resolve the caller's email from the **auth token** (`auth.getUser()` with
   the incoming JWT) — never from the body. Lowercase it. 401 if invalid.
3. Validate: name non-empty; phone matches `/^[6-9]\d{9}$/` (REQUIRED — this
   differs from the creator flow where phone was optional); UPI matches
   `/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/`.
4. **Verify ALL 14 answers server-side** against `ANSWER_KEY` (see §8; the
   key lives in this function as the source of truth; the client's copy must
   match it). Any wrong/missing answer → `{ quiz_failed: true }` 400. The
   client-side level gates are UX only; THIS is the real check.
5. **Rate limit:** count `marketer_signups` UPDATEs… simplest robust check:
   if this email's signup row shows ≥ 5 failed submit attempts in the last
   10 minutes (track `progress->submit_attempts` timestamps), return 429.
   Keep it simple — this is anti-scripting, not Fort Knox.
6. Upsert the `marketer_signups` row (service role): name/phone/upi,
   `quiz_passed_at = now()`, `agreed_at = now()` (submitting the form IS the
   agreement — the checkbox gates the button client-side).
7. Call `enroll_marketer(email, name, phone, upi)` (service role RPC).
   Map results: `admin_email` → 403 with a clear error; `already:true` and
   `ok:true` → 200 `{ ok: true }`.

**Phase 2 verification:** `npx tsc --noEmit` does not cover Deno functions —
review by simulation instead: test the SQL side by direct `enroll_marketer`
calls (as in Phase 1), and lint the function file. Then **STOP and ask the
owner to deploy** `marketer-signup`. After they confirm, test end-to-end with
curl using a real test Google session token if available; otherwise test
after Phase 3 through the UI with a test Google account, then clean up rows.

---

### PHASE 3 — `/marketer` route, map shell, and Act 2 levels (the big one)

**New files** (keep the monoliths untouched except the route wiring):
- `src/MarketerOnboarding.tsx` — top-level: login fork → welcome (video) →
  map → level screens → details form → "you're in".
- `src/MarketerOnboardingLevels.tsx` — level definitions: content renderers,
  per-level check data (see §7, §8).
- `src/MarketerOnboardingMocks.tsx` — ALL mock components (lead card, status
  chips, team board, doubt cards, commission banner, resend rows, /plans
  replica screens for Phase 4, voice-note player). One file so future UI
  drift has one place to fix.

**Route wiring in `src/App.tsx`:** add `isMarketerPage = routePath === '/marketer'`
next to the existing `/creator` check (~line 4624), render
`<MarketerOnboarding/>` for it, and extend the standalone-PWA redirect
exclusion (~line 4603) so `/marketer` isn't hijacked. Match how `/creator`
is carved out (including any manifest/PWA considerations — read that block
before editing).

**Login fork (entry screen):**
- Button 1: "I'm already a marketer" → plain link to `/admin`.
- Button 2: "I want to become a marketer" → Google OAuth
  (`supabase.auth.signInWithOAuth`, redirect back to `/marketer`; stash
  intent in `sessionStorage` to survive the OAuth bounce — copy the creator
  pattern). Reuse the `/creator` login screen's look.
- **After sign-in, settled-auth rule:** wait for the session outside
  `onAuthStateChange`, then:
  1. Check if this email is already an active marketer → if yes, short
     "You're already on the team" screen with an Open dashboard → `/admin`
     link (query `call_marketers` own-row — marketers can SELECT their own
     row per existing RLS; a non-marketer gets zero rows back, which is the
     signal to start onboarding).
  2. Else upsert their `marketer_signups` row (own-row RLS allows this) and
     load `progress` → resume at `current_level`.

**Welcome screen:** copy from the copy doc. Vimeo 9:16 embed with
placeholder id + `TODO(owner)` (copy the creator embed block).

**The map screen:** vertical winding path, two act headers, 13 nodes.
Node states: done (✓), current (pulsing/highlighted), locked. Tapping done
or current opens the level; locked does nothing. Progress counter
("N of 13"). Sequential unlock only. After L13 → the details form.

**Level screen framework:** header (back chevron to map + level title),
body (level-specific content + mock), then the check (MCQ, options
shuffled once per mount — reuse the creator shuffle), Continue enabled when
an option is selected. Wrong pick → inline error from the copy doc pattern
("take another look above ☝️"), increment `retries[level]`, let them retry.
Right pick → save answer token + completion into `progress` (UPDATE own
`marketer_signups` row; also mirror to localStorage as offline fallback),
mark level done, return to map with the next node unlocked.

**Act 2 levels in this phase (L3–L13)** run on a **canned demo application**
(name "Demo Lead", Sun 2 Aug, Nungambakkam) — Phase 4 swaps in the trainee's
own L2 data via a single `demoLead` prop/context. Build the swap point in
from the start.

**Level-by-level mock behavior is specified in §7.** All screen text comes
from the copy doc.

**Details form + enrollment:** fields and copy per the copy doc (name,
phone REQUIRED `/^[6-9]\d{9}$/`, UPI validated, agreement checkbox gates the
button). Submit → POST to `marketer-signup` with the stored `answers` map →
on `ok` show the "You're in" screen → "Open my dashboard" → `window.location
= '/admin'` (they're already Google-authed; AdminPanel resolves them as a
marketer). Handle errors: `quiz_failed` → send them back to the map with a
message; `admin_email` → "this email is a founder account"; network errors
→ retry message.

**Phase 3 verification:**
- `npx tsc --noEmit`.
- Drive the whole flow in the browser preview (`/marketer` is public —
  fine to test) with a TEST Google account: complete all levels, submit,
  confirm enrollment rows appear (SQL), confirm `/admin` login lands on the
  empty My Leads as a marketer. Screenshot key screens for the owner.
- Then DELETE the test marketer (BOTH rows: `call_marketers` + the ops
  `admin_users` row — remember the offboarding gotcha) + the signup row.
- Confirm a mid-flow refresh resumes at the right level (progress
  persistence), and the browser Back button walks level → map correctly.

---

### PHASE 4 — Act 1 simulator (/plans replica + test application)

- Build the 3 replica screens (L1) + application form (L2) in
  `MarketerOnboardingMocks.tsx`: plans-list card → Chill Sunday Meetup
  details (photos strip placeholder, quick-info block: group of 22 · own
  transport · Nungambakkam, both Sunday dates, ₹359) → booking-timeline
  preview with a dated meeting-spot step. Schematic fidelity: right shapes,
  right words, NOT pixel-perfect (deliberate — resists drift). Look at the
  real /plans event sheet in the browser for reference; do not import its
  code.
- L2 form: name prefilled from Google profile (editable), meeting point
  fixed ("Nungambakkam — 11:00 AM"), date choice with **Date A (Sun 2 Aug)
  pre-selected** (L11's sold-out twist requires Date A; Date B visible).
  On Apply → write `test_application` into progress JSONB → the Act-1→Act-2
  transition beat (copy doc) → all Act 2 levels now render the trainee's
  own name/date instead of the canned lead.
- **Phase 4 verification:** tsc + full browser run-through again; confirm
  the trainee's name/date flows into every Act 2 mock; confirm NOTHING is
  written to `applications` (SQL count before/after).

---

### PHASE 5 — Roster visibility in the admin panel (targeted AdminPanel edits)

`AdminPanel.tsx` is ~6.6k lines — read only the ranges you need
(Marketers tab render + `loadMarketersData` + `MarketerAssignment`).

- **NEW badge:** in the Marketers tab roster, rows with
  `reviewed_at IS NULL` get a "NEW" badge + one-tap **"Mark reviewed"**
  (UPDATE `reviewed_at = now()` — admin RLS already permits; keep the
  existing `logAdminAction` pattern).
- **Same badge in the event-editor marketer multi-select**
  (`MarketerAssignment`) so nobody staffs an un-reviewed stranger blind.
- **Funnel numbers** on the Marketers tab (founder-only): counts from
  `marketer_signups` — signed in / in progress / enrolled, plus per-level
  drop-off if cheap (one grouped query over `progress->current_level`).
  Founder-only via `is_admin_strict` RLS — ops users can't read the table,
  so gate the UI fetch on `adminRole === 'admin'` too.
- Also collect UPI display: show `upi_id` on each marketer row (payout
  destination next to their totals).
- **Phase 5 verification:** tsc; admin views aren't drivable in preview
  (login-gated) — verify by SQL simulation (insert an unreviewed test
  marketer, confirm the query the UI uses returns it flagged; clean up).

---

### PHASE 6 — Polish

1. **Field guide**: the status one-liners (copy doc Appendix A) as a
   reference card reachable from the map footer and — later, owner's call —
   from the marketer dashboard.
2. **Empty-state coaching** on My Leads for marketers with zero leads (the
   copy-doc "You're in" framing: "leads arrive when you're added to an
   event" + a static example lead card + a link to `/marketer` read-only).
   This IS an AdminPanel edit — keep it small and scoped to the marketer
   empty state.
3. **Training card** in the marketer dashboard linking back to `/marketer`
   (which, for an enrolled marketer, opens the map in read-only revisit
   mode — levels all unlocked, no re-submission).
4. Add one line to `CLAUDE.md`'s file map: the three new files + "when
   statuses/flows change, refresh the onboarding mocks + copy doc".
5. Optional (owner's call, ask first): AiSensy welcome template; hiding the
   team board until first assignment.

---

## 7. Level-by-level build spec (structure + mock logic)

Text comes from `marketer-onboarding-level-copy.md`. This table defines ids,
gating, and mock behavior. "Demo lead" = canned in Phase 3, trainee's own
from Phase 4.

| id | Title (question) | Mock + interaction logic | Gate to Continue |
|---|---|---|---|
| 1 | What does a customer see on chaptera.in? | 3 replica screens (Phase 4; in Phase 3 stub with static placeholders): list → details → timeline. Must open details AND scroll timeline. | check answered |
| 2 | Apply for the meetup yourself | Replica application form; Date A pre-selected; writes `test_application` to progress; then the act-transition beat screen. | form submitted + check |
| 3 | Who can see your leads? | My Leads view, ONE lead card (demo lead, `Pending`) + a small round-robin dealing diagram (3 avatars, cards dealt in rotation, one lands on "You"). Static + light CSS animation. | check |
| 4 | What are all these tabs and cards? | People-page frame with tab chips (Call · Doubts) — each must be tapped once (caption appears); then the team board card (3 fake marketers + "You" at #2 with tickets/₹). | both tabs tapped + check |
| 5 | What do the lead statuses mean? | Interactive glossary: 3 pipeline chips (`Pending`,`Invited`,`Fully paid`) + 5 badge chips (`Waitlist`,`Rejected`,`Cart abandoned`,`Re-target`,`Recovered`). Tap → two-line explanation (copy doc). | 3 pipeline chips tapped (minimum) + check |
| 6 | What do you do with a new lead? | Demo lead at `Pending` + **Approve** → flips to `Invited` + auto-WhatsApp toast → button "Skip ahead — they pay ₹359" → `Fully paid` + commission counter +₹50 + earn toast → closing line. State machine identical to statuses; replayable. | full sequence played + check |
| 7 | What does the lead get after paying? | Split view: lead card `Fully paid` (left) vs customer side (right): WhatsApp confirmation bubble, receipt snippet, timeline with dated meeting-spot step (tap → caption). | check |
| 8 | What if they don't pay after the invite? | Demo lead with `Re-target` badge + **Resend details** → rows animate "WhatsApp ✓ sent" then "Email ✓ sent" → double-tick on card + caption. | resend tapped + check |
| 9 | What if they start paying… and stop? / cash? | Demo lead with `Cart abandoned` + the auto-nudge WhatsApp bubble → button "You called them — they finish paying" → badge flips `Recovered` + toast. | sequence played + check |
| 10 | The two kinds of doubts | Side-by-side: Doubts-tab card ("I'd be coming alone — will it be awkward?") vs the demo lead with a pinned amber card ("Can I bring a friend along?"). Tapping the Doubts card reveals the answer→apply→"Applied ✓"→your-lead caption chain. | doubts card tapped + check |
| 11 | What if their date is full — or they want a different one? | Demo lead waitlisted: Date A "Sold out" tag, status `Waitlist` → **Change date → Sun 16 Aug** → toast `✓ Date updated · moved off waitlist` (exact real text) → card shows Date B, `Invited`. | date shifted + check |
| 12 | Where's your money, and when does it arrive? | Commission banner ("₹350 earned this month · 7 tickets") + mini timeline booking → event happens → payout (pulsing) ; banner tap → caption. | check |
| 13 | How we sound — and the rules | 2–3 founder VOICE NOTES via the Founder's-Note-style player (placeholder audio, `TODO(owner)`) + the tap-to-reveal "Not us / That's us" contrast pair + the conduct rules text. | ≥1 voice note played (if audio present; skip gate while placeholder) + BOTH checks (13a, 13b) |

General mock rules: everything runs on local component state; replay is
always allowed; use the admin panel's visual language loosely (status pill
colors, card shapes) but do NOT import from AdminPanel; label fake data
clearly in code (constants prefixed `DEMO_`).

## 8. The answer key (client and server MUST match)

14 checks. Tokens are stable ids; option labels/distractors come from the
copy doc. Server holds this key in `marketer-signup`; client mirrors it in
`MarketerOnboardingLevels.tsx` (like `CORRECT` in `CreatorOnboarding.tsx`,
with a comment pointing at the server copy).

| check id | correct token | meaning |
|---|---|---|
| 1 | `ref_site` | check details on chaptera.in/plans |
| 2 | `apply_then_pay` | apply with date+point, pay when invited |
| 3 | `round_robin_even` | auto, even rotation |
| 4 | `team_transparent` | everyone's tickets + earnings |
| 5 | `pending_waiting` | applied, waiting for my call/approval |
| 6 | `auto_whatsapp` | system sends the link, never me |
| 7 | `spot_on_reveal_date` | exact spot appears in timeline on its date |
| 8 | `resend_both_channels` | resend on WhatsApp + email, one tap |
| 9 | `official_link_only` | friendly no; only the official link |
| 10 | `stays_with_me` | doubt-solver keeps the lead |
| 11 | `pitch_other_date_shift` | offer date B + shift; auto off-waitlist |
| 12 | `days_after_event` | a few days after the event |
| 13a | `never_pushy` | room + honesty + warm follow-up |
| 13b | `only_my_leads` | only my own leads |

## 9. Known gotchas (each has bitten this codebase before)

1. **Auth-callback race:** querying RLS tables inside `onAuthStateChange`
   fires before the token attaches → empty results → "not a marketer" false
   negatives. Resolve the session, then query. (Memory:
   `supabase-auth-callback-race`.)
2. **Offboarding half-state:** deactivating `call_marketers` while leaving
   the `admin_users` ops row = plain ops = sees ALL leads. Existing
   `toggleMarketerActive` handles this; NEVER write your own partial
   version. Test-row cleanup must always delete BOTH rows.
3. **Email case:** always `lower(trim(email))` before compare/insert.
4. **`Event.id` = `events.slug`** in `src/supabase.ts` mappers — irrelevant
   to mocks (they're fake) but relevant if you SELECT the real event to
   verify demo facts.
5. **Pricing lives in `city_details`** for the demo event (event-level
   `price_full` is 0). Don't "fix" that; it's how per-city pricing works.
6. **The PWA standalone redirect in App.tsx** can hijack unknown routes in
   installed-app mode — exclude `/marketer` exactly like `/creator`.
7. **Pushes auto-create roadmap cards** (`feature_releases` trigger). After
   any approved push, rewrite the new card into a plain-English business
   sentence (house habit; see memory `roadmap-card-plain-english`).
8. **Marketers can't read `marketer_signups`** (founder-only + own-row) —
   the Phase 5 funnel UI must be gated to `adminRole === 'admin'`.
9. **Don't run the real /plans flow or admin flows** while testing — prod
   rows, prod notifications (§2.7).

## 10. Owner action items (surface these at the right phase; never do them yourself)

| When | What |
|---|---|
| Phase 2 done | Deploy `supabase/functions/marketer-signup` (owner deploys; agent never does) |
| Before/around Phase 3 | Record the vertical welcome video, upload to Vimeo, provide the id (placeholder until then) |
| Before/around Phase 3 | Record 2–3 sales-call voice notes for L13 (suggested beats are in the copy doc), provide URLs/files |
| Each phase end | Review + explicit go-ahead; approve any push separately |
| Launch | Share the `/marketer` link with interested marketers (owner routes creators to `/creator` separately — no cross-links needed) |

## 11. Definition of done (whole project)

- A stranger with a Google account can: open `/marketer` → sign in → play
  all 13 levels (their own fake application threading through Act 2) → pass
  all checks → submit details → land in `/admin` as a marketer with an empty
  My Leads — with ZERO founder involvement and ZERO customer-data exposure.
- The founder can see NEW badges + funnel numbers in the Marketers tab and
  assign the new marketer to an event exactly as before.
- `applications` has no rows created by training. All test rows cleaned up.
- `npx tsc --noEmit` green; each phase shipped as its own commit(s) with
  why-focused messages; nothing pushed without explicit approval; creator
  onboarding files never mixed into marketer commits.
