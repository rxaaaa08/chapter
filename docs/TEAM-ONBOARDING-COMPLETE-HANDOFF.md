# CORE TEAM ONBOARDING — COMPLETE BUILD HANDOFF

_Single self-contained spec. Consolidated 2026-08-02 from three source docs
(`marketer-self-serve-onboarding-proposal.md`, `team-onboarding-level-copy.md`,
`MARKETER-ONBOARDING-HANDOFF.md`). Everything needed to build this feature is in
THIS file — you do not need the other three._

**Read this document COMPLETELY before writing any code.** All design decisions
are FINAL and owner-approved — do not re-litigate them, do not "improve" the
flow, do not add features not listed here.

**Audience:** a fresh AI coding session (Codex, a different Claude Code session,
or any capable agent) building this from scratch against the existing codebase.
Written to be tool-agnostic — where it says "apply the migration" or "run this
SQL," use whatever database tooling you have (Supabase MCP, the Supabase SQL
editor, `psql`, or a migration file). The `marketer-signup` Edge Function was
deployed as v1 during the build. Git pushes still require owner approval.

---

# PHASE CHECKLIST (build in order; STOP for owner go-ahead after each)

Full detail per phase is in **Part D**. Each phase ends with `npx tsc --noEmit`
green, its verification done and shown to the owner, and a STOP for approval
before the next. Nothing pushed to git without an explicit go-ahead.

- [ ] **Phase 1 — Schema** (invisible to users). `marketer_signups` table + RLS ·
      additive `upi_id`/`phone`/`reviewed_at` on `call_marketers` (backfill
      `reviewed_at`) · atomic `enroll_marketer` RPC (the trust boundary) ·
      **`marketer_signup_intents` conversion funnel** (table + RPC + completion
      trigger on `call_marketers` INSERT + backfill). → verify by SQL, clean up
      test rows.
- [x] **Phase 2 — `marketer-signup` edge function** (verify Google session +
      re-check all 14 answers server-side + rate-limit + call `enroll_marketer`).
      Deployed as v1 with JWT verification enabled.
- [x] **Phase 3 — `/team` route + map shell + Act 2 (L3–L13)** on a canned
      demo lead. Login fork, funnel-intent RPC fire, welcome video, the level
      map, level framework + checks, details form → enrollment, "You're in".
      **Match creator UI (Part H).** → verify in browser with a test Google
      account, clean up.
- [ ] **Phase 4 — Act 1 simulator** (/plans replica screens L1 + L2 test
      application that never touches `applications`; threads the trainee's own
      data into every Act 2 mock). → verify nothing hits `applications`.
- [ ] **Phase 5 — Admin roster visibility** (founder-only): NEW badge + "mark
      reviewed" in Marketers tab AND event-editor multi-select · **conversion
      funnel strip** (entered / became marketers / didn't finish — mirrors the
      Creators tab) · optional per-level drop-off · UPI display. → verify by SQL.
- [ ] **Phase 6 — Polish:** field guide · empty-state coaching · Training card ·
      CLAUDE.md file-map line · optional welcome-WhatsApp / hide team board.

**Owner action points** (surface at the right phase, never do yourself): deploy
the Phase 2 function · record the vertical welcome video + L13 voice notes ·
review + go-ahead at each phase end · approve any push. Full list in **Part G2**.

---

# PART A — ORIENTATION

## A0. The one-paragraph summary

A self-serve onboarding at **`/team`** for people joining the core team. The
visitor
signs in with Google, watches a short vertical welcome video, then plays
through a **Duolingo-style map of 13 levels** (Act 1: experience the customer
side of chaptera.in/plans via a sandboxed replica and place a fake application;
Act 2: work that same fake application as a marketer through every real
situation — approve, re-target, cart-abandon, doubts, waitlist, payouts,
conduct). Each level ends with one multiple-choice check. After the final level
they submit name + phone + UPI + a conduct agreement, and the system **enrolls
them as a marketer immediately** (no human approval step) — they land in the
real admin panel with an empty "My Leads" dashboard. They get no access to any
customer data until an admin assigns them to an event (which is not part of
this build — it already exists).

## A1. The problem this solves

100+ people want to join the team, and today each marketer costs the owner a
live meeting (dashboard walkthrough, statuses, commission) **plus** manual
entry in the admin panel. This replaces that with a `/team` page where they
*learn the job by playing through it* — first as a pretend customer, then as
the marketer handling their own application — prove they understood, submit
their details, and get enrolled automatically.

## A2. Context locked with the owner (the "why," for background)

- **Two separate hires, two separate doors.** Creators → `/creator` (already
  built). Core team → `/team` (this build). The owner routes each applicant
  to the right link manually — no triage fork on either page.
- **Everyone non-creator starts in sales.** People apply for core team /
  customer support, but the rule is: learn sales first. The welcome copy says so.
- **Not video-led, but with a welcome video.** One vertical (9:16) founder
  welcome video above the map. All *teaching* lives in the levels.
- **Duolingo-style level map.** Onboarding home = a winding path of levels.
  Each level is a *question* (the ones marketers actually ask); opening it gives
  the explanation + an interactive mock + 1 check MCQ. Sequential unlock, ✓ on
  completion, always revisitable.
- **Single-payment events only.** New marketers always start on
  `payment_mode='full'` events, so the demo lead goes `Pending → Invited →
  Fully paid`. **Advance/balance split payments are not taught at all** —
  deliberately out of scope, owner's call.
- **Most applicants have never used chaptera.in/plans.** Act 1 walks them
  through the customer side and has them **place a test application — which
  never touches the database**; it becomes the demo lead they work in Act 2.
- **English only.** No language toggle.
- **Direct auto-enroll, no approval step:** completing the onboarding creates
  the marketer immediately. Safe because an unassigned marketer's RLS scope
  contains zero customer data — event assignment (admin/manager only) remains
  the real gate.

## A3. The business reality: 100 enrolled ≠ 100 assigned

Round-robin splits an event's leads across its marketers — 10 marketers on one
event = one-tenth the leads (and commission) each. So the funnel narrows twice:

- **Gate 1 — finishing the onboarding (this build):** "understood the job, real
  details." Auto-enroll grants nothing but an empty dashboard.
- **Gate 2 — event assignment (already exists, unchanged):** staff each event
  with the few marketers it needs. Enrolled-but-unassigned marketers are the
  **bench**. The "you're in" screen sets this expectation explicitly so an empty
  dashboard reads as normal, not as rejection.

---

# PART B — NON-NEGOTIABLE RULES

## B1. Safety rules (violating any of these is a failed build)

1. **The Supabase DB is PRODUCTION with live customers.** Test with phone
   `90000000xx` rows and throwaway Google emails you create for testing; verify
   writes with `RETURNING`; DELETE all test rows when done (show the owner).
2. **Edge-function production changes require explicit scope.** The
   `marketer-signup` function is already deployed as v1; do not redeploy it for
   frontend-only changes.
3. **NEVER `git push` without the owner's explicit go-ahead in that turn.**
   Pushing deploys the live site. One concern per commit.
4. **`npx tsc --noEmit` must pass after every code edit.**
5. **The working tree may contain uncommitted CREATOR-onboarding work**
   (`src/CreatorOnboarding.tsx`, `supabase/functions/creator-signup/`, creator
   migration + edits in `CreatorDashboard.tsx`/`App.tsx`/`AdminPanel.tsx`/
   `supabase.ts`). Check `git status` first. NEVER mix creator files into
   marketer commits. If asked to commit, stage only your own files explicitly.
6. **Do not modify the behavior of `AppFlow.tsx` or the customer booking
   flows.** The Act 1 "replica" is built from scratch as new components that
   only LOOK like /plans — zero imports of AppFlow internals, zero changes to
   AppFlow.
7. **Local `npm run dev` talks to PROD Supabase.** Browsing your own new
   `/team` route is fine; do NOT exercise the real /plans booking flow or
   admin panel flows as "testing" — that creates real rows and real
   notifications.
8. **Migrations may be applied** (they are additive and safe here). It is edge
   FUNCTIONS the owner must deploy, and pushes the owner must approve.

## B2. The ONE security invariant you must never break

The marketer permission model (see `multi-marketer.md` §2) has a sharp edge:

- A row in `admin_users` with `role='ops'` grants admin-panel login.
- A row in `call_marketers` (active) makes that login a *marketer* — scoped to
  only their own leads.
- **An `admin_users` ops row WITHOUT an active `call_marketers` row is a
  "plain ops" user — they pass `is_admin_only()` and can read EVERY lead of
  EVERY event.**

Therefore: enrollment must create **both rows in one atomic Postgres
transaction** (the `enroll_marketer` SECURITY DEFINER function, Phase 1). The
browser NEVER inserts into these tables. The edge function NEVER does two
separate inserts. If the transaction fails, NEITHER row exists. No exceptions.

Related: emails are stored **lowercase** and must exactly match the Google JWT
email — that's why the flow captures the email from the authenticated session,
never from a typed field. A typed email that differs from their real Google
account both locks them out of `/admin` AND can produce the plain-ops/all-leads
hazard above.

## B3. Why auto-enroll is safe (three hard requirements)

Completing onboarding enrolls them immediately — no founder approve/decline.
The reasoning holds up against the RLS: a marketer with **no event assignment
sees zero customer data** (`applications` and `doubt_submissions` are scoped to
`assigned_marketer_id = current_marketer_id()`, and a fresh marketer is
assigned to nothing). Event assignment (admin/manager only) remains the one
true gate. Three things keep it safe — all three are mandatory:

1. **Atomic server-side row creation** (B2 above).
2. **The server-checked quiz is the only vetting gate**, so its server-side
   answer verification is load-bearing, and signups get basic rate-limiting
   (per-email) so nobody scripts a flood of enrollments.
3. **A "self-joined, not yet reviewed" flag** — new self-enrolled marketers get
   a **NEW badge** in the Marketers tab roster *and in the event-editor marketer
   multi-select*, with a one-tap "mark reviewed". Review is optional and
   after-the-fact — never a gate — but the badge keeps a flooded roster honest
   at the moment that matters: assignment.

**Two residual exposures accepted knowingly** (both internal, not customer
data): (a) any enrolled marketer can see the transparent team board (every
marketer's tickets + earnings) — a throwaway account that passes the quiz could
peek at team earnings; can be hidden until first assignment later if it ever
matters. (b) The roster (marketer names) becomes visible to self-enrolled users
per existing RLS. Off-boarding a bad actor stays one tap (the existing
active-toggle revokes `/admin` login).

## B4. Decisions already made (do not reopen)

- **Auto-enroll, no approval queue.** Event assignment (existing admin UI,
  untouched) remains the trust gate.
- **`reviewed_at` NEW badge** on self-joined marketers, in the Marketers tab
  roster AND the event-editor marketer multi-select. Optional, after-the-fact.
- **Demo event = the REAL "Chill Sunday Meetup"** (slug `anna-nagar-meetup`).
  Verified in prod 2026-07-21: `payment_mode='full'` (single payment), price
  **₹359** (lives in `city_details->Chennai->price_full`; the event-level
  `price_full` column is 0 — don't be confused), single meeting point
  "Nungambakkam — 11:00 AM" (own transport), group size 25 in `quick_info`,
  Sunday dates, no
  `marketer_commission` override → default **₹50**/ticket applies.
  **Re-verify these against the live event before finalizing mock data** (one
  SELECT) — if they changed, update the mock AND the copy in Part E.
- **Mock dates:** Date A = Sun 2 Aug, Date B = Sun 16 Aug (fictional training
  dates in the event's real Sunday pattern; do NOT read real `event_dates` into
  the mock).
- **Split/advance payments are NOT taught anywhere.** Do not mention them.
- **English only.** No language toggle.
- **Not video-led:** ONE vertical 9:16 founder welcome video above the map
  (Vimeo, same embed pattern as `CreatorOnboarding.tsx` — placeholder id until
  the owner records; mark with a `TODO(owner)` comment). L13 additionally plays
  founder VOICE NOTES via the "Founder's Note" player pattern from
  `AppFlow.tsx:~3710` (placeholder audio URL + `TODO(owner)`).
- **All teaching mocks are fake, in-memory, standalone components.** No DB
  reads/writes from any mock. No shared "test admin" login. No demo mode
  threaded through `AdminPanel.tsx` or `AppFlow.tsx`.
- **The trainee's L2 test application NEVER touches `applications`.** It is
  stored only in their `marketer_signups.progress` JSONB and rendered as the
  demo lead in Act 2.

## B5. What to explicitly NOT do

- Don't relax the atomic-enroll rule (B2).
- Don't build a shared test-admin login (prod DB, real WhatsApp sends).
- Don't send trainees to the real `/plans` (analytics pollution + stray real
  applications — the Act 1 simulator exists precisely for this).
- Don't thread demo modes through `AppFlow.tsx`/`AdminPanel.tsx`.
- Don't let the browser insert into `admin_users`/`call_marketers`.
- Don't let them type their login email — Google-first, always.
- Don't skip the phone number — a marketer you can't WhatsApp is useless.
- Don't assign events at signup — assignment stays the founder's separate act.
- Don't teach split payments — out of scope by owner decision.
- **Sibling project, do NOT touch it:** a parallel CREATOR onboarding build
  exists (`CreatorOnboarding*.tsx`, `/creator`). If you find yourself editing
  those, you're in the wrong build — stop. Both use the same Duolingo-map
  pattern but different demo events; do not "unify" them.

---

# PART C — EXISTING CODE TO REUSE (read these first)

| File | What to take |
|---|---|
| `src/CreatorOnboarding.tsx` (~400 lines, in working tree) | **The visual + structural template for the whole `/team` flow** (see Part H). The whole skeleton: step navigation with browser-history back (popstate pattern), progress dots, 9:16 Vimeo embed with loading spinner, quiz option shuffle + answer-token pattern, details-form styling (INK/MUTED/HAIR constants, input/button styles), bottom-sheet (FAQ + terms) patterns, edge-function call shape. Copy patterns; do not import from it. |
| `src/CreatorDashboard.tsx` | The **login/fork screen UI** to clone for `/team` (dashed-gold card, wordmark, gold primary + outline secondary + shimmer — Part H2); the **settled-auth pattern** (NEVER query RLS tables inside `onAuthStateChange` — token not attached yet; this bug already bit /creator once); and the **funnel-intent fire** at `:352-355` (`record_creator_signup_intent`) that Phase 3 mirrors, plus the admin funnel read/render at `:1244-1249` / `:6969-6977` that Phase 5 mirrors. |
| `supabase/functions/creator-signup/` (in working tree) | Template for the edge function: reading email from the auth token, server-side quiz answer key, validation, service-role insert, response shapes (`ok`, `already_creator`, `handle_taken`, `quiz_failed`). |
| `src/AdminPanel.tsx:1103` (`saveNewMarketer`) | The founder-email guard you must replicate in `enroll_marketer`: if the email exists in `admin_users` with `role='admin'`, REFUSE. |
| `src/AdminPanel.tsx:1407` (`resendInviteDetails`) | Reference for what the L8 mock imitates (WhatsApp+email resend with per-channel sent ticks). Read-only reference — the mock is fake. |
| `src/AppFlow.tsx:~3705-3790` (Founder's Note) | The voice-note player UI pattern (scalloped button + tappable waveform, `preload="none"`). Rebuild a small copy for L13; do not import. |
| `src/App.tsx:~4600-4630` | Route wiring: `routePath === '/admin'`, `'/creator'`. Add `'/team'` here. **Careful:** the PWA standalone redirect can redirect standalone launches away from unknown paths — exclude `/team` the same way `/creator` is, or the installed-app check hijacks the route. |
| `supabase/migrations/20260721_creator_onboarding_phase1_schema.sql` | Style reference for the migration (additive, nullable, backfill pattern). |
| `multi-marketer.md` | How the marketer system works — you are extending it. Read for the round-robin, RLS scoping, and the plain-ops hazard. |
| `CLAUDE.md` | House rules — they all apply. |

---

# PART D — PHASE-BY-PHASE BUILD PLAN

Build phases IN ORDER. Each phase ends with: `npx tsc --noEmit` green, the
phase's verification steps done, results shown to the owner, and a STOP for the
owner's go-ahead before the next phase. Nothing pushed without explicit approval.

## PHASE 1 — Schema (one migration, invisible to all users)

### 1a. `marketer_signups` table (progress + funnel tracking; NOT a gate)

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
  `email = lower(auth.jwt()->>'email')` (their own row only; needed for progress
  saves from the browser).
- ALL for founders via `is_admin_strict()` (funnel analytics).
- Nothing for `anon`.
- UPDATE policy must prevent flipping `status` to `'enrolled'` from the client:
  simplest is a `WITH CHECK` that forbids `status <> 'in_progress'` unless
  `is_admin_strict()`. Only the service-role edge function sets `enrolled`
  (service role bypasses RLS).

### 1b. Additive columns on `call_marketers` (all nullable — safe on live)

```sql
alter table public.call_marketers
  add column if not exists upi_id text,
  add column if not exists phone text,
  add column if not exists reviewed_at timestamptz;
-- Existing hand-added marketers are not "new": backfill so only future
-- self-enrolled rows show the NEW badge.
update public.call_marketers set reviewed_at = now() where reviewed_at is null;
```

### 1c. `enroll_marketer` function — THE trust boundary

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

### 1d. Conversion tracking — `marketer_signup_intents` (mirror of the creator funnel)

This is the **"how many signed in vs how many became marketers"** tracker the
owner asked for — built to mirror the creator flow's `creator_signup_intents`
**exactly** (same shape, same guarantees), so the admin panel shows both funnels
identically. The creator version lives in
`supabase/migrations/20260726_creator_signup_intents.sql`; read it, then build
this as the marketer twin.

**Why a separate table from `marketer_signups`** (which already tracks per-level
progress):
- **Captures intent at the door.** One row the moment a Google account lands in
  the `/team` flow — via *either* fork button ("I'm already on the team" OR
  "I want to join the team"; people misclick, and either way they're in the
  funnel). `auth.users` can't tell you this — it mixes admins, marketers,
  curiosity logins and test accounts.
- **Deletion-proof completion.** `completed_at` is stamped by a TRIGGER on
  `call_marketers` INSERT — not by a read-time join, and not by the
  `marketer_signups.status` flag. So if a marketer is off-boarded/deleted later,
  they stay counted as "became a marketer" instead of silently falling back into
  "didn't finish."
- **Division of labour:** `marketer_signup_intents` = the clean top-line
  started/completed/abandoned rate (this is the authoritative conversion
  number). `marketer_signups` = the deeper per-level drop-off. Both, exactly
  like creators (which have `creator_signup_intents` **and** a checklist-progress
  table).

The funnel is then exact:
`started = rows in this table` · `completed = rows with completed_at` ·
`abandoned = started − completed`.

```sql
create table if not exists public.marketer_signup_intents (
  email         text primary key,          -- lowercase, from the auth token
  first_seen_at timestamptz not null default now(),
  completed_at  timestamptz
);

alter table public.marketer_signup_intents enable row level security;

-- Founders only — funnel data for them, nobody else reads it.
drop policy if exists marketer_signup_intents_admin_read on public.marketer_signup_intents;
create policy marketer_signup_intents_admin_read on public.marketer_signup_intents
  for select using (public.is_admin_strict());

-- The client never writes directly. This RPC reads the email from the auth
-- token — never a parameter — so a caller can only record THEIR OWN entry, and
-- one row per email (first entry wins; later logins don't move first_seen_at).
create or replace function public.record_marketer_signup_intent()
returns void language plpgsql security definer set search_path = public as $$
declare v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if v_email = '' then return; end if;   -- not signed in; nothing to record
  insert into public.marketer_signup_intents (email)
  values (v_email) on conflict (email) do nothing;
end $$;

revoke all on function public.record_marketer_signup_intent() from public;
grant execute on function public.record_marketer_signup_intent() to authenticated;

-- Stamp completion when the call_marketers row is created — self-serve
-- (enroll_marketer) OR hand-added (saveNewMarketer), so every marketer is
-- counted and the path taken can't game the funnel. coalesce keeps the first
-- completion time if one somehow already exists.
create or replace function public.stamp_marketer_signup_completion()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.marketer_signup_intents (email, completed_at)
  values (lower(NEW.email), now())
  on conflict (email)
  do update set completed_at = coalesce(public.marketer_signup_intents.completed_at, now());
  return NEW;
end $$;

drop trigger if exists trg_stamp_marketer_signup_completion on public.call_marketers;
create trigger trg_stamp_marketer_signup_completion
  after insert on public.call_marketers
  for each row execute function public.stamp_marketer_signup_completion();

-- Backfill: every existing marketer completed the funnel at some point. Use
-- call_marketers.created_at as both first_seen and completion (best estimate for
-- pre-existing marketers), so "didn't finish" starts at 0 and only grows with
-- real, post-launch drop-offs.
insert into public.marketer_signup_intents (email, first_seen_at, completed_at)
select lower(m.email), m.created_at, m.created_at
from public.call_marketers m
on conflict (email) do update set completed_at = coalesce(public.marketer_signup_intents.completed_at, excluded.completed_at);
```

`call_marketers` has both `email` and `created_at` (the admin panel already does
`.order('created_at')` on it), so the backfill is valid — but confirm with one
`SELECT` before applying, and adjust the SELECT if a column is named differently.

**Phase 1 verification (all with SQL, show the owner):**
- `SELECT` the new columns exist; confirm every existing `call_marketers` row
  has `reviewed_at` set.
- Call `enroll_marketer('marketer-test-90000000xx@example.com', 'Test', '9000000001', 'test@upi')`
  via service role → verify BOTH rows exist (`RETURNING`/SELECT), verify
  re-calling returns `already:true` without duplicates, verify calling with a
  real admin email returns `admin_email` and changes nothing.
- Try `enroll_marketer` as `anon`/`authenticated` → must be permission-denied.
- **Intents funnel:** after the `enroll_marketer` test call, confirm a
  `marketer_signup_intents` row for that email now has `completed_at` set (the
  trigger fired on the `call_marketers` insert). Confirm the backfill gave every
  pre-existing marketer a `completed_at`, so `started − completed` = 0 at launch.
- DELETE the test rows from ALL tables (`call_marketers` + `admin_users` ops row
  + `marketer_signups` + `marketer_signup_intents`); show cleanup.

## PHASE 2 — `marketer-signup` edge function (written, NOT deployed by you)

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
2. Resolve the caller's email from the **auth token** (`auth.getUser()` with the
   incoming JWT) — never from the body. Lowercase it. 401 if invalid.
3. Validate: name non-empty; phone matches `/^[6-9]\d{9}$/` (REQUIRED — this
   differs from the creator flow where phone was optional); UPI matches
   `/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/`.
4. **Verify ALL 14 answers server-side** against `ANSWER_KEY` (Part F; the key
   lives in this function as the source of truth; the client's copy must match
   it). Any wrong/missing answer → `{ quiz_failed: true }` 400. The client-side
   level gates are UX only; THIS is the real check.
5. **Rate limit:** if this email's signup row shows ≥ 5 failed submit attempts
   in the last 10 minutes (track `progress->submit_attempts` timestamps),
   return 429. Simple anti-scripting, not Fort Knox.
6. Upsert the `marketer_signups` row (service role): name/phone/upi,
   `quiz_passed_at = now()`, `agreed_at = now()` (submitting the form IS the
   agreement — the checkbox gates the button client-side).
7. Call `enroll_marketer(email, name, phone, upi)` (service role RPC). Map
   results: `admin_email` → 403 with a clear error; `already:true` and `ok:true`
   → 200 `{ ok: true }`.

**Phase 2 verification:** `npx tsc --noEmit` does not cover Deno functions —
review by simulation instead: test the SQL side by direct `enroll_marketer`
calls (as in Phase 1), and lint the function file. Then **STOP and ask the
owner to deploy** `marketer-signup`. After they confirm, test end-to-end with
curl using a real test Google session token if available; otherwise test after
Phase 3 through the UI with a test Google account, then clean up rows.

## PHASE 3 — `/team` route, map shell, and Act 2 levels (the big one)

**New files** (keep the monoliths untouched except the route wiring):
- `src/TeamOnboarding.tsx` — top-level: login fork → welcome (video) → map →
  level screens → details form → "you're in".
- `src/TeamOnboardingLevels.tsx` — level definitions: content renderers,
  per-level check data (Parts E, F).
- `src/TeamOnboardingMocks.tsx` — ALL mock components (lead card, status
  chips, team board, doubt cards, commission banner, resend rows, /plans replica
  screens for Phase 4, voice-note player). One file so future UI drift has one
  place to fix.

**Route wiring in `src/App.tsx`:** add `isTeamPage = routePath === '/team'`
next to the existing `/creator` check, render `<TeamOnboarding/>`
for it, and extend the standalone-PWA redirect exclusion (~line 4603) so
`/team` isn't hijacked. Match how `/creator` is carved out (including any
manifest/PWA considerations — read that block before editing).

**Login fork (entry screen):**
- Button 1: "I'm already on the team" → plain link to `/admin`.
- Button 2: "I want to join the team" → Google OAuth
  (`supabase.auth.signInWithOAuth`, redirect back to `/team`; stash intent
  in `sessionStorage` to survive the OAuth bounce — copy the creator pattern).
  Reuse the `/creator` login screen's look.
- **After sign-in, settled-auth rule:** wait for the session outside
  `onAuthStateChange`, then:
  0. **Fire the funnel-intent RPC** (fire-and-forget):
     `supabase.rpc('record_marketer_signup_intent')` — the moment a Google
     account has settled on the `/team` surface, record that they entered the
     flow, whether they clicked "become a marketer" OR "already a marketer"
     (misclicks count too). Mirror `CreatorDashboard.tsx:352-355` exactly: run it
     in a `useEffect` gated on `authReady && email`, **kept OUT of
     `onAuthStateChange`** (same token-race reason as the lookup), scoped to this
     component so admins/marketers on their own dashboards never get counted.
  1. Check if this email is already an active marketer → if yes, short "You're
     already on the team" screen with an Open dashboard → `/admin` link (query
     `call_marketers` own-row — marketers can SELECT their own row per existing
     RLS; a non-marketer gets zero rows back, which is the signal to start
     onboarding).
  2. Else upsert their `marketer_signups` row (own-row RLS allows this) and load
     `progress` → resume at `current_level`.

> **UI look & feel for this whole phase:** match the creator onboarding
> pixel-language — colours, fonts, button styles, progress dots, Vimeo embed,
> quiz cards, level nodes, bottom sheets. All of it is specified in **Part H —
> UI Design System**. Build against that, not from your own taste.

**Welcome screen:** copy from Part E. Vimeo 9:16 embed with placeholder id +
`TODO(owner)` (copy the creator embed block).

**The map screen:** vertical winding path, two act headers, 13 nodes. Node
states: done (✓), current (pulsing/highlighted), locked. Tapping done or current
opens the level; locked does nothing. Progress counter ("N of 13"). Sequential
unlock only. After L13 → the details form. **Footer:** a **Continue** button
(enabled only when all levels are done) plus a secondary **"I Have a Doubt"**
button that opens the FAQ bottom-sheet accordion (content = Part E "Map footer"
section; mechanism = Part H8) — build both here in Phase 3.

**Level screen framework:** header (back chevron to map + level title), body
(level-specific content + mock), then the check (MCQ, options shuffled once per
mount — reuse the creator shuffle), Continue enabled when an option is selected.
Wrong pick → inline error ("take another look above ☝️"), increment
`retries[level]`, let them retry. Right pick → save answer token + completion
into `progress` (UPDATE own `marketer_signups` row; also mirror to localStorage
as offline fallback), mark level done, return to map with the next node
unlocked.

**Act 2 levels in this phase (L3–L13)** run on a **canned demo application**
(name "Demo Lead", Sun 2 Aug, Nungambakkam) — Phase 4 swaps in the trainee's own
L2 data via a single `demoLead` prop/context. Build the swap point in from the
start.

**Details form + enrollment:** fields and copy per Part E (name, phone REQUIRED
`/^[6-9]\d{9}$/`, UPI validated, agreement checkbox gates the button). Submit →
POST to `marketer-signup` with the stored `answers` map → on `ok` show the
"You're in" screen → "Open my dashboard" → `window.location = '/admin'`. Handle
errors: `quiz_failed` → send them back to the map with a message; `admin_email`
→ "this email is a founder account"; network errors → retry message.

**Phase 3 verification:**
- `npx tsc --noEmit`.
- Drive the whole flow in the browser preview (`/team` is public — fine to
  test) with a TEST Google account: complete all levels, submit, confirm
  enrollment rows appear (SQL), confirm `/admin` login lands on the empty My
  Leads as a marketer. Screenshot key screens for the owner.
- Then DELETE the test marketer (BOTH rows: `call_marketers` + the ops
  `admin_users` row) + the signup row.
- Confirm a mid-flow refresh resumes at the right level (progress persistence),
  and the browser Back button walks level → map correctly.

## PHASE 4 — Act 1 simulator (/plans replica + test application)

- Build the 3 replica screens (L1) + application form (L2) in
  `TeamOnboardingMocks.tsx`: chat bubbles + city replies → the gold event reply
  **Our Chill Sunday Meetups** → Chill Sunday Meetup details (photos strip,
  quick-info block: Your Own Transport · ppl who bond over stories, chaos & good
  times · Nungambakkam · Group Size 25, both Sunday dates, ₹359) →
  booking-timeline preview with a dated meeting-spot step. Schematic fidelity:
  right interaction model, right shapes, right words, NOT
  pixel-perfect (deliberate — resists drift). Look at the real /plans event
  sheet in the browser for reference; do not import its code.
- L2 invite-only form: date **Sun 2 Aug** and meeting point
  **Nungambakkam — 11:00 AM** are selected before the form. The form asks only
  for name, phone (`/^[6-9]\d{9}$/`) and the T&C checkbox; it has no email or
  date buttons. On Apply → write `test_application` into progress JSONB → the Act-1→Act-2
  transition beat (Part E) → all Act 2 levels now render the trainee's own
  name/date instead of the canned lead.
- **Phase 4 verification:** tsc + full browser run-through again; confirm the
  trainee's name/date flows into every Act 2 mock; confirm NOTHING is written to
  `applications` (SQL count before/after).

## PHASE 5 — Roster visibility in the admin panel (targeted AdminPanel edits)

`AdminPanel.tsx` is ~6.6k lines — read only the ranges you need (Marketers tab
render + `loadMarketersData` + `MarketerAssignment`).

- **NEW badge:** in the Marketers tab roster, rows with `reviewed_at IS NULL`
  get a "NEW" badge + one-tap **"Mark reviewed"** (UPDATE `reviewed_at = now()`
  — admin RLS already permits; keep the existing `logAdminAction` pattern).
- **Same badge in the event-editor marketer multi-select** (`MarketerAssignment`)
  so nobody staffs an un-reviewed stranger blind.
- **Conversion funnel (top line)** on the Marketers tab (founder-only), read
  from `marketer_signup_intents` — **the exact mirror of the Creators tab's
  signup funnel** (`AdminPanel.tsx:1244-1249` + render at `~6969-6977`). Fetch
  `select('email, completed_at')`, then
  `{ started: rows.length, completed: rows.filter(r => r.completed_at).length }`,
  and render the same three-chip strip in the same visual style:
  - `<b>{started}</b> entered the signup`
  - `<b style=green>{completed}</b> became marketers`
  - `<b style=red if >0 else grey>{started − completed}</b> didn't finish`
  Copy the container styling verbatim from the creator funnel strip (grey pill,
  `#f7f7f8` bg, `#ececed` border, `fontSize 12.5`). This is the "conversion rate
  of the onboarding" number the owner wants — and because it's backfilled,
  "didn't finish" starts at 0 and only grows with real post-launch drop-offs.
- **Deeper per-level drop-off (optional, founder-only):** additionally, from
  `marketer_signups` — a grouped count over `progress->current_level` shows
  *which level* people abandon on (the "which lesson isn't landing" analytics).
  Cheap add; the intents strip above is the headline, this is the detail.
- Both reads are founder-only via `is_admin_strict` RLS — ops users can't read
  either table, so also gate the UI fetch on `adminRole === 'admin'`.
- **Show `upi_id`** on each marketer row (payout destination next to totals).
- **Phase 5 verification:** tsc; admin views aren't drivable in preview
  (login-gated) — verify by SQL simulation: insert an unreviewed test marketer,
  confirm it shows the NEW badge AND bumps both `started` and `completed` by 1;
  insert a `marketer_signup_intents` row with `completed_at = NULL` and confirm
  "didn't finish" increments; clean up.

## PHASE 6 — Polish

1. **Field guide**: the status one-liners (Part E, Appendix A) as a reference
   card reachable from the map footer and — later, owner's call — from the
   Team Dashboard.
2. **Empty-state coaching** on My Leads for marketers with zero leads (the
   "You're in" framing: "leads arrive when you're added to an event" + a static
   example lead card + a link to `/team` read-only). This IS an AdminPanel
   edit — keep it small and scoped to the marketer empty state.
3. **Training card** in the Team Dashboard linking back to `/team`
   (which, for an enrolled marketer, opens the map in read-only revisit mode —
   levels all unlocked, no re-submission).
4. Add one line to `CLAUDE.md`'s file map: the three new files + "when
   statuses/flows change, refresh the onboarding mocks + copy".
5. Optional (owner's call, ask first): AiSensy welcome template; hiding the team
   board until first assignment.

---

# PART E — CANONICAL LEVEL COPY (verbatim on-screen text)

_This is the exact text the trainee reads. When building UI, take the words from
here VERBATIM (the owner has reviewed them). Every mechanism was verified against
code before writing (retarget-check, cart-abandonment, resendInviteDetails,
date-shift/waitlist)._

**Demo event used throughout:** the real **"Chill Sunday Meetup"** — ₹359,
**single payment**, meeting area Nungambakkam at 11:00 AM, own transport, group
size 25, runs on Sundays. Mock dates: **Sun 2 Aug (Date A)** and **Sun 16 Aug
(Date B)**. Default ₹50/ticket commission. Demo customer = the trainee themself
(whatever name they enter in L2).

Conventions: **Screen copy** = words the trainee reads. **Mock** = what the
interactive piece shows and does, with exact toast/button text. **Check** = the
level's MCQ; ✅ marks the correct option (options are shuffled on screen).

## Login screen

Eyebrow: **CORE TEAM TRAINING**

> **Every one of us starts with the customer.**
>
> Whatever you end up doing here — sales, operations, design, support — you
> start on the customer desk. This is where that begins.

Primary: **I want to join the team** · secondary: **I'm already on the team**

Helper: *New here? Press "I want to join the team" to get started.*

---

## Welcome screen (before the map)

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

_(Vertical founder welcome video here — same Vimeo embed as the /plans
carousel.)_

Button: **Start training**

---

## Level zoom-out callouts

Every level renders a gold-left-rule callout after its mock and before its
check, labelled **Why this matters later**:

1. Anyone who redesigns this page needs to know where a first-time visitor gets confused. You're about to find out first-hand.
2. You'll never design a booking flow well until you've been through one as the customer.
3. Round-robin is a fairness rule. Anyone who manages a team here will one day have to decide how work gets shared out.
4. This page *is* our operations dashboard. Learn what's on it now; some of you will decide what goes on it next.
5. These eight words are the company's shared vocabulary. Every report, every meeting, every product decision uses them.
6. This is our core loop. Every improvement we ever make is a change to one step of it.
7. The messages and timeline they receive are our product too. When one confuses a customer, the person who notices is usually the one on the phone.
8. Silence is data. A broken message or a confusing invite gets found here first.
9. Every abandoned payment is either a trust problem or a friction problem. Learning to tell which is a product skill.
10. The Doubts tab is the rawest feed of what our website fails to explain. Read enough and you'll know exactly what to rewrite.
11. Which dates sell out and which don't is our demand data. It decides what we run next.
12. Commission per ticket, tickets per event — this is the unit economics of the business, seen from the inside.
13. How we sound on a call *is* the brand. Whatever you go on to do here, you'll be protecting it.

In read-only revisit mode, the map blurb ends with *"won't change your live
leads or your team account"* and its primary button is **Back to my Team
Dashboard**.

---

## Map footer · the "I Have a Doubt" sheet

On the level-map screen, below the **Continue** button, sits a secondary
**"I Have a Doubt"** button (same placement as the creator map). Tapping it opens
a **bottom-sheet accordion** — the exact framer-motion sheet + expanding Q&A rows
the creator onboarding uses (Part H8). These are the pre-training questions a
prospective marketer asks *before* they've learned the job; the levels answer the
job-mechanics questions, this sheet answers the "should I even do this?" ones.

Sheet header: **Got a question? 🤔** _(owner may edit)_

Accordion entries (question → answer):

- **I applied for a core team / operations / design role — why am I doing sales?**
  *Because it's how everyone here starts, including the people already doing
  those jobs. A few weeks of real customer calls teaches you what no handover
  document can: what people actually want, where our website loses them, which
  parts of the experience they care about. When you move into another part of
  the company, you'll decide with that in your head instead of guessing.*

- **So is this a sales job or not?**
  *Right now, yes. You'll be calling and messaging real customers and getting
  them booked. That's the job you're training for and the job you'll start.
  Where it goes depends on how you do and what the team needs — we don't promise
  a timeline, but the door is genuinely open, and it's the only door.*

- **How do I move into the core team?**
  *Do the customer desk well, and say what you're interested in. The people who
  move up are the ones who close well, keep their word to customers, and notice
  things — a confusing message, a date that always sells out, a question that
  keeps coming up. Tell us what you notice. That's the audition.*

- **Do I need any experience to do this?**
  *No. This training teaches you everything — what customers want, how the panel
  works, and exactly what to say. If you can make a friendly phone call, you can
  do this.*

- **Do I have to pay anything to join?**
  *Never. Joining is completely free, and it always will be. We pay you — you
  never pay us.*

- **How much can I earn?**
  *A fixed amount for every fully-paid ticket you close (usually ₹50 — your
  dashboard shows the exact rate per event). The more events you're on and the
  more leads you close, the more you earn.*

- **How much time does this take?**
  *It's flexible and all from your phone — calls and WhatsApp follow-ups with the
  leads assigned to you. There are no fixed hours; you work your leads when it
  suits you.*

- **When do I start getting customers to call?**
  *Once you're **assigned to an event.** Finishing this training puts you on the
  team, ready to be staffed — leads start arriving when we add you to an event,
  and we'll message you on WhatsApp when that happens.*

- **I have another doubt.**
  *We're here to help! For anything else, [Contact Us](https://wa.me/919940111564)
  on WhatsApp.* _(owner-confirmed 2026-08-02: +91 99401 11564 — the same line the
  creator onboarding sheet uses)_

---

## Act 1 · Be the customer

_Map section label: **Act 1 · Be the customer**_

### L1 · What does a customer see on chaptera.in?

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

**Mock:** Replica of the /plans browsing flow, 3 screens: the chat conversation
with white bot bubbles, typing dots, gold city replies and the gold
**Our Chill Sunday Meetups** event reply → Chill Sunday Meetup details (photos
strip; quick-info block: **Your Own Transport** · **ppl who bond over stories,
chaos & good times** · **Nungambakkam** · **Group Size 25**; both Sunday dates;
price ₹359; bottom CTA **Apply Now**) → the booking-timeline preview with the
meeting-spot step visibly dated. Trainee must open the details and scroll the
timeline before **Continue** lights up.

**Check — Where do you check the plan details of events you're assigned to?**
- On chaptera.in/plans — the same page customers see ✅
- In a PDF the founder sends every week
- In the admin panel settings tab
- You memorise them during training

---

### L2 · Apply for the meetup yourself

**Screen copy**

> Time to be the customer. Apply for the Chill Sunday Meetup — exactly the way
> a real customer would.
>
> Don't worry: **this is practice.** Your application isn't sent anywhere.
> It stays inside this training.

**Mock:** Replica of the invite-only native application. **Sun 2 Aug** and
**Nungambakkam — 11:00 AM** are already selected in the preceding calendar
step. The form asks for name (pre-filled from Google, editable), phone
(`/^[6-9]\d{9}$/`) and the T&C checkbox. It has no email field and no date
buttons. Button: **Apply — practice only**.

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

## Act 2 · Be the marketer

_Map section label: **Act 2 · Be the marketer**_

### L3 · Who can see your leads?

**Screen copy**

> This is **My Leads** — your side of the admin panel. Your application from
> Act 1 is sitting right there.
>
> How did it become *yours*? Automatically. Every new application is dealt to
> one of the event's marketers in strict rotation — an even split, no
> favourites, no grabbing. The system did it the second the application came in.
>
> And the other side of that coin: **you only ever see your own leads.** Other
> marketers can't see yours, and you can't see theirs. Your leads, your calls,
> your commission.

**Mock:** The My Leads view with exactly one lead card: the trainee's L2
application (their name, Sun 2 Aug, Nungambakkam, status `Pending`). A small
diagram above: 3 marketer avatars, incoming applications dealing out
one-two-three in rotation, one landing on "You".

**Check — How do new leads get distributed?**
- Automatically, split evenly between the event's marketers in rotation ✅
- The founder reads each one and picks a marketer
- Whoever calls the lead first keeps them
- Everyone sees every lead and shares the work

---

### L4 · What are all these tabs and cards?

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

**Mock:** The People page frame with tab chips (Call · Doubts) the trainee must
tap through; each tap highlights the tab and shows a one-line caption. Then the
team board card: 3 demo marketers with tickets + ₹ earned, "You" highlighted at
#2.

**Check — What does the team board show?**
- Every marketer's tickets sold and earnings — fully transparent ✅
- Only your own earnings, nobody else's
- The customers of every marketer
- The founder's profit on each event

---

### L5 · What do the lead statuses mean?

**Screen copy**

> Every lead card carries a status. The status tells you what's already
> happened — and what you should do next. Tap each one.

**Mock:** Interactive glossary. Main pipeline chips (tap to open a two-line
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

### L6 · What do you do with a new lead?

**Screen copy**

> Your lead — you, from Act 1 — is sitting at `Pending`. Here's the rhythm of
> the job:
>
> **Call first.** Say hi, answer their questions, make sure the meetup fits
> them. Then, if it's a yes —
>
> **Press Approve.** Watch what happens.

**Mock:** The trainee's lead card at `Pending` with an **Approve** button.

On tap → status animates to `Invited`, toast:

> **Invite sent — automatically.** The moment you approved, our WhatsApp system
> sent them the invite and the payment link. You never send payment links
> yourself. Ever.

Button appears: **Skip ahead — they pay ₹359** → status animates to `Fully paid`,
a commission counter ticks **+ ₹50**, toast:

> **This is the moment you earn.** A fixed amount for every fully-paid ticket —
> your dashboard always shows your exact rate.

Closing line under the card:

> That's the whole happy path: **call → approve → they pay → you earn.** The
> rest of this training is about the days when it doesn't go this smoothly.

**Check — Who sends the payment link when you approve a lead?**
- The system sends it on WhatsApp automatically — I never send payment links ✅
- I copy the link and WhatsApp it from my phone
- The founder sends it at the end of the day
- The customer requests it by emailing us

---

### L7 · What does the lead get after paying?

**Screen copy**

> The moment your lead pays, three things land on their side:
>
> **A WhatsApp confirmation** — their booking is locked in.
> **A receipt** — proof of payment, on the same page they paid on.
> **Their booking timeline** — the step-by-step plan for the day.
>
> And remember the timeline's special step from Act 1: they know the area
> (Nungambakkam), but the exact **meeting spot arrives on its own reveal date**,
> closer to the day. So when a paid lead messages you asking *"where exactly in
> Nungambakkam do we meet?"* — you know the answer: *"it'll appear in your
> timeline on the reveal date."* You'll get this question a lot. Now it's an
> easy one.

**Mock:** Split view: left = the lead card at `Fully paid`; right = "what they
see": WhatsApp confirmation bubble, receipt snippet, and the timeline with the
meeting-spot step showing its date. Tapping the meeting-spot step pops the
caption: *"Revealed on this date — not before. Even you don't need to know it
earlier."*

**Check — A paid customer asks "where exactly do we meet?" What's the answer?**
- The exact spot appears in their booking timeline on its reveal date ✅
- You tell them the spot on the call — you always know it
- They should email support to get the address
- The spot was in their payment receipt

---

### L8 · What if they don't pay after the invite?

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
> One tap re-sends the full invite — on **WhatsApp and email both** — and shows
> a tick for each channel once it's gone out. Two ways to reach them, so a
> delivery failure can't kill the deal.
>
> Then comes the part no system can do: **your follow-up call.** "Hi! Just
> making sure the details reached you — anything I can clear up?" That one call
> closes more silent leads than any reminder ever will.

**Mock:** The lead card wearing the `Re-target` badge, with the **Resend
details** button. On tap: two rows animate in — *WhatsApp ✓ sent* then *Email ✓
sent* — becoming the double tick on the card. Caption: *"Both channels, one tap.
Now make the call."*

**Check — A lead is flagged Re-target. What can you do that you can't do on
other leads?**
- Use Resend details to re-send the invite on WhatsApp and email in one tap ✅
- Send them the payment link from my personal WhatsApp
- Approve them a second time
- Move them to another marketer

---

### L9 · What if they start paying… and stop? (or offer cash?)

**Screen copy**

> The opposite case: they *did* open the payment page — and then stopped. Cold
> feet about paying online. A UPI app that hung. A phone call that interrupted.
> It happens all the time.
>
> If a lead opens the payment page and doesn't finish, the card gets a
> `Cart abandoned` badge — and the system automatically sends them a WhatsApp
> nudge (and an email if we have one) with a link straight back to their
> payment.
>
> Your job is the **trust call.** Reassure them the payment page is our official
> one. Stay on the phone while they retry. When they complete it, the badge
> flips to `Recovered` — a save, and it counts just like any other paid ticket.
>
> One rule with no exceptions: **we never take cash, and never personal UPI.**
> Every rupee goes through the official payment link. If a lead says *"can I
> just GPay you directly?"* the answer is a friendly no — *"our payment link is
> the only way, and it's also your booking confirmation and receipt."*
> Collecting money any other way is the fastest way off this team.

**Mock:** The lead card wearing `Cart abandoned`, with the auto-nudge shown as a
small WhatsApp bubble beneath: *"Your Chill Sunday Meetup spot is still waiting —
complete your payment here."* Button: **You called them — they finish paying** →
badge animates to `Recovered`, toast: *"A save. Recovered leads count exactly
like any other paid booking."*

**Check — A lead says "can I just GPay you the amount directly?" What do you
say?**
- Friendly no — every payment goes through the official payment link, no
  exceptions ✅
- Yes, if they send a screenshot as proof
- Yes, but only for amounts under ₹500
- Ask the founder for permission first

---

### L10 · The two kinds of doubts — and whose lead is it after?

**Screen copy**

> People ask questions in two different places, and they land on your panel in
> two different ways:
>
> **Asked *before* applying** → lands in the **Doubts tab**. They were browsing
> the website, had a question, and asked it without applying.
>
> **Asked *after* being invited** (or after paying) → appears as an **amber card
> pinned to their lead** in the Call tab. The question travels with the person.
>
> Either way, you answer over WhatsApp or a call. And here's the question every
> new marketer asks: *"if I solve someone's doubt and they then apply — whose
> lead are they?"* **Yours.** The person stays with the marketer who helped
> them, from doubt to application to payment.
>
> One honest detail: a doubt shows **Applied ✓** only when the person actually
> submits an application. There's no "mark as done" button — the tick appears
> when the real thing happens.

**Mock:** Side by side: a Doubts-tab card (*"I'd be coming alone — will it be
awkward?" — asked before applying*) and the trainee's own lead with an amber
doubt card pinned (*"Can I bring a friend along?" — asked after invite*). Tapping
the Doubts card shows the caption chain: *you answer → they apply → **Applied ✓**
appears → the lead lands on YOUR list.*

**Check — You answer someone's doubt and they apply the next day. Whose lead are
they?**
- Mine — the person stays with the marketer who helped them ✅
- Whoever the rotation assigns next
- The founder decides case by case
- Nobody's — doubt-askers aren't leads

---

### L11 · What if their date is full — or they want a different one?

**Screen copy**

> Spots are counted **per date**, not per event. The meetup is a group of 25 —
> so the 2 Aug Sunday can sell out while 16 Aug still has room. It happens often.
>
> When a date fills up, people who applied for it land on the **Waitlist**. Most
> new marketers read "waitlist" as "dead lead." It's the opposite — **the
> waitlist is your hottest follow-up list.** These people already decided they
> want to come. They're one phone call away from a booking.
>
> The play: call them, offer the other date — *"the 2nd filled up fast, but I've
> got spots on the 16th — same meetup, same spot"* — and if they're in, **shift
> their date right from the lead card.** The system moves them off the waitlist
> automatically.
>
> Same tool works for anyone who just wants to switch dates. One limit: **paid
> leads can't be shifted.** Once money has moved, changes go through the founder.

**Mock:** The trainee's lead shown waitlisted: Date A (Sun 2 Aug) with a **Sold
out** tag, status `Waitlist`. Instruction: *"Call them, pitch the 16th… they said
yes. Shift the date."* Trainee taps **Change date → Sun 16 Aug** → toast (real
one from the panel): *"✓ Date updated · moved off waitlist"* → card now shows
Date B, status `Invited`.

**Check — Date A is sold out and your lead is on the waitlist. What's your
play?**
- Call them, offer date B, and shift their date — the system takes them off the
  waitlist ✅
- Nothing — waitlisted leads are closed
- Ask them to apply again from the website for date B
- Refund them so they can rebook

---

### L12 · Where's your money, and when does it arrive?

**Screen copy**

> Every fully-paid ticket earns you a **fixed amount per ticket**. The default
> is ₹50 — some events set their own rate — and your dashboard always shows your
> exact number, so there's never a surprise.
>
> Your **earnings banner** sits right on top of My Leads: how much you've earned
> this month and how many tickets you've sold. It updates the moment a lead hits
> `Fully paid`.
>
> When does it reach your account? **A few days after the event happens** — not
> instantly at booking. The event runs, then you're paid for it. And your
> earnings history never changes after the fact: what you see is what you get.

**Mock:** The commission banner (*"₹350 earned this month · 7 tickets"*) with a
small timeline underneath: **booking → event happens → payout a few days
later**, the payout node pulsing. Tapping the banner pops: *"Updates the moment a
lead hits Fully paid."*

**Check — When does your commission reach your account?**
- A few days after the event happens ✅
- Instantly, the moment the lead pays
- On the 1st of every month
- Whenever I request a withdrawal

---

### L13 · How we sound — and the rules

**Screen copy**

> Last level. This one's about who we are on the phone.
>
> chapter அ is a club people *want* into — not a call center chasing targets. So
> we never sound pushy, and we never sound desperate. No pressure lines, no fake
> urgency, no begging. We help people decide; we don't corner them. A lead who
> says "not this time" gets a warm "no problem — next one, then," and remembers
> us kindly.
>
> And the rules that keep this whole thing trustworthy:
>
> **Customer details are confidential.** Names and numbers never leave the
> panel — no personal contact lists, no adding leads to groups, no sharing.
> **Contact only through the booking process.** Calls and messages about their
> booking — nothing else.
> **Only your own leads, ever.**
>
> You'll confirm this in writing on the next screen. Break these and the seat
> goes to someone on the bench — simple as that.

**Mock:** **Founder voice notes** — reusing the /plans "Founder's Note" player
(gold scalloped button + tappable waveform, lazy-loaded audio). Two to three
short recordings by the founder, each with a one-line caption, e.g.:

1. *"How I open a call"* — the warm first 20 seconds.
2. *"When they hesitate"* — giving room without losing the lead.
3. *"When it's a no"* — closing warmly so they come back next time.

_(Owner records these — placeholder audio + `TODO(owner)` until then.)_

Under the voice notes, one tap-to-reveal contrast pair as a recap:
- *"Sir, only 2 spots left, book in the next 10 minutes or lose it!"* → **Not
  us.** Fake urgency reads as desperation.
- *"Take your time — want me to hold the details on WhatsApp so you can decide
  tonight?"* → **That's us.** Helpful beats pushy, every time.

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

> **That's rung one.**
>
> You've seen what the customer sees, handled a lead from Pending to paid,
> chased the silent ones, saved an abandoned payment, and turned a sold-out
> date into a booking.
>
> That's the customer desk — where everyone here starts. What comes next depends
> on what you're good at and what we need: more events, a team to manage,
> operations, design, support. All of it starts with the calls you're about to
> make.
>
> One last step: your details — so we know who you are and where to pay you.

Button: **Finish up →** _(leads into the details form)_

---

## Details form

> **Your details**
>
> Signing up as **{google email}** — this is the account you'll always log in
> with.

- **Your name** — placeholder: *"As you'd introduce yourself on a call"*
- **Phone number** — helper: *"The WhatsApp number we'll reach you on."*
- **UPI ID** — label: *"UPI ID (so we can pay your commission)"* — placeholder:
  *"yourname@bank"*
- ☑️ **The agreement** — *"I agree to keep customer details confidential,
  contact leads only through the booking process, and collect payments only
  through the official payment link."*

Button: **Join the team** · in flight: **Setting up your account…**

_(On tap, the signup function re-verifies everything server-side and enrolls
them on the spot — both panel-access rows created in one atomic transaction.)_

---

## "You're in" screen

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

Button: **Open my Team Dashboard** _(→ /admin, already signed in; lands on the empty
My Leads with the coaching empty state + Training card)_

---

## "Already on the team" screen

> **You're already on the team.**
>
> Your Team Dashboard is ready. Open it to see your leads and your training.

Primary: **Open Team Dashboard** · secondary: **Sign out**

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
  the bill page was **never opened** (`retarget-check`). Mutually exclusive with
  cart-abandoned by construction.
- Cart abandoned: bill page opened, unpaid past the window (invite events ~2h) →
  flag + automatic WhatsApp nudge, plus email when on file (`cart-abandonment`).
- Resend details: Re-Target leads only; sends WhatsApp + email with per-channel
  sent-ticks (`AdminPanel.tsx:1407`).
- Date shift: `AdminPanel.tsx:1370` — shifting a waitlisted lead auto-moves them
  off the waitlist (real toast: "✓ Date updated · moved off waitlist"). "Paid
  leads can't be shifted" is the house rule taught here.
- Commission: default ₹50/ticket, per-event override possible; ledger snapshots
  at sale time (never changes retroactively). Payout timing ("a few days after
  the event") is the owner's stated practice, not system-enforced.
- Meeting-spot reveal: per-date booking steps; the meeting-spot step carries its
  own date (canonical step index 3).
- Demo event is the real **Chill Sunday Meetup** (`anna-nagar-meetup`), verified
  in prod 2026-07-21: `payment_mode='full'`, ₹359 (Chennai city-detail price;
  event-level `price_full` is 0 — pricing lives in `city_details`), single
  meeting point (Nungambakkam — 11:00 AM, own transport), group size 25 from
  `quick_info` (the separate `group_size` column is blank), Sunday
  dates, no `marketer_commission` override → default ₹50 applies. **At build
  time, re-check price/points against the live event so the mock never drifts.**

---

# PART F — LEVEL BUILD SPEC + ANSWER KEY

## F1. Level-by-level structure (ids, gating, mock behavior)

Text comes from Part E. "Demo lead" = canned in Phase 3, trainee's own from
Phase 4.

| id | Title (question) | Mock + interaction logic | Gate to Continue |
|---|---|---|---|
| 1 | What does a customer see on chaptera.in? | 3 replica screens (Phase 4; in Phase 3 stub with static placeholders): list → details → timeline. Must open details AND scroll timeline. | check answered |
| 2 | Apply for the meetup yourself | Replica application form; Date A pre-selected; writes `test_application` to progress; then the act-transition beat screen. | form submitted + check |
| 3 | Who can see your leads? | My Leads view, ONE lead card (demo lead, `Pending`) + a small round-robin dealing diagram (3 avatars, cards dealt in rotation, one lands on "You"). Static + light CSS animation. | check |
| 4 | What are all these tabs and cards? | People-page frame with tab chips (Call · Doubts) — each must be tapped once (caption appears); then the team board card (3 fake marketers + "You" at #2 with tickets/₹). | both tabs tapped + check |
| 5 | What do the lead statuses mean? | Interactive glossary: 3 pipeline chips (`Pending`,`Invited`,`Fully paid`) + 5 badge chips (`Waitlist`,`Rejected`,`Cart abandoned`,`Re-target`,`Recovered`). Tap → two-line explanation. | 3 pipeline chips tapped (minimum) + check |
| 6 | What do you do with a new lead? | Demo lead at `Pending` + **Approve** → flips to `Invited` + auto-WhatsApp toast → button "Skip ahead — they pay ₹359" → `Fully paid` + commission counter +₹50 + earn toast → closing line. Replayable. | full sequence played + check |
| 7 | What does the lead get after paying? | Split view: lead card `Fully paid` (left) vs customer side (right): WhatsApp confirmation bubble, receipt snippet, timeline with dated meeting-spot step (tap → caption). | check |
| 8 | What if they don't pay after the invite? | Demo lead with `Re-target` badge + **Resend details** → rows animate "WhatsApp ✓ sent" then "Email ✓ sent" → double-tick on card + caption. | resend tapped + check |
| 9 | What if they start paying… and stop? / cash? | Demo lead with `Cart abandoned` + the auto-nudge WhatsApp bubble → button "You called them — they finish paying" → badge flips `Recovered` + toast. | sequence played + check |
| 10 | The two kinds of doubts | Side-by-side: Doubts-tab card ("I'd be coming alone — will it be awkward?") vs the demo lead with a pinned amber card ("Can I bring a friend along?"). Tapping the Doubts card reveals the answer→apply→"Applied ✓"→your-lead caption chain. | doubts card tapped + check |
| 11 | What if their date is full — or they want a different one? | Demo lead waitlisted: Date A "Sold out" tag, status `Waitlist` → **Change date → Sun 16 Aug** → toast `✓ Date updated · moved off waitlist` (exact real text) → card shows Date B, `Invited`. | date shifted + check |
| 12 | Where's your money, and when does it arrive? | Commission banner ("₹350 earned this month · 7 tickets") + mini timeline booking → event happens → payout (pulsing); banner tap → caption. | check |
| 13 | How we sound — and the rules | 2–3 founder VOICE NOTES via the Founder's-Note-style player (placeholder audio, `TODO(owner)`) + the tap-to-reveal "Not us / That's us" contrast pair + the conduct rules text. | ≥1 voice note played (if audio present; skip gate while placeholder) + BOTH checks (13a, 13b) |

**General mock rules:** everything runs on local component state; replay is
always allowed; use the admin panel's visual language loosely (status pill
colors, card shapes) but do NOT import from AdminPanel; label fake data clearly
in code (constants prefixed `DEMO_`).

## F2. The answer key (client and server MUST match)

14 checks. Tokens are stable ids; option labels/distractors come from Part E.
Server holds this key in `marketer-signup`; client mirrors it in
`TeamOnboardingLevels.tsx` (like `CORRECT` in `CreatorOnboarding.tsx`, with a
comment pointing at the server copy).

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

---

# PART G — GOTCHAS, OWNER ACTIONS, DEFINITION OF DONE

## G1. Known gotchas (each has bitten this codebase before)

1. **Auth-callback race:** querying RLS tables inside `onAuthStateChange` fires
   before the token attaches → empty results → "not a marketer" false negatives.
   Resolve the session, then query. (Memory: `supabase-auth-callback-race`.)
2. **Offboarding half-state:** deactivating `call_marketers` while leaving the
   `admin_users` ops row = plain ops = sees ALL leads. Existing
   `toggleMarketerActive` handles this; NEVER write your own partial version.
   Test-row cleanup must always delete BOTH rows.
3. **Email case:** always `lower(trim(email))` before compare/insert.
4. **`Event.id` = `events.slug`** in `src/supabase.ts` mappers — relevant only
   if you SELECT the real event to verify demo facts.
5. **Pricing lives in `city_details`** for the demo event (event-level
   `price_full` is 0). Don't "fix" that; it's how per-city pricing works.
6. **The PWA standalone redirect in App.tsx** can hijack unknown routes in
   installed-app mode — exclude `/team` exactly like `/creator`.
7. **Pushes auto-create roadmap cards** (`feature_releases` trigger). After any
   approved push, rewrite the new card into a plain-English business sentence
   (house habit; memory `roadmap-card-plain-english`).
8. **Marketers can't read `marketer_signups`** (founder-only + own-row) — the
   Phase 5 funnel UI must be gated to `adminRole === 'admin'`.
9. **Don't run the real /plans flow or admin flows** while testing — prod rows,
   prod notifications (B1.7).

## G2. Owner action items (surface at the right phase; never do them yourself)

| When | What |
|---|---|
| Phase 2 done | `supabase/functions/marketer-signup` deployed as v1 with JWT verification enabled |
| Before/around Phase 3 | Record the vertical welcome video, upload to Vimeo, provide the id (placeholder until then) |
| Before/around Phase 3 | Record 2–3 sales-call voice notes for L13 (suggested beats in Part E, L13), provide URLs/files |
| Each phase end | Review + explicit go-ahead; approve any push separately |
| Launch | Share the `/team` link with people joining the team |

## G3. Definition of done (whole project)

- A stranger with a Google account can: open `/team` → sign in → play all 13
  levels (their own fake application threading through Act 2) → pass all checks →
  submit details → land in `/admin` as a marketer with an empty My Leads — with
  ZERO founder involvement and ZERO customer-data exposure.
- The founder can see NEW badges + the conversion funnel ("entered / became
  marketers / didn't finish", mirroring the Creators tab) + per-level drop-off in
  the Marketers tab, and assign the new marketer to an event exactly as before.
- The `/team` UI is visually indistinguishable in style from `/creator` —
  same palette, type scale, buttons, dots, video embed, sheets (Part H).
- `applications` has no rows created by training. All test rows cleaned up.
- `npx tsc --noEmit` green; each phase shipped as its own commit(s) with
  why-focused messages; nothing pushed without explicit approval; creator
  onboarding files never mixed into marketer commits.

---

## Gaps this build also closes (nice-to-haves that fall out of the design)

1. **No payout destination for marketers today** — `call_marketers` has no UPI
   or phone column. This adds `upi_id` + `phone` (nullable, additive), collects
   at Step 3, shows the UPI in the Marketers tab.
2. **A full signup / conversion funnel** — two complementary layers, both
   mirroring the creator flow:
   - `marketer_signup_intents` (Phase 1d) = the top-line **conversion rate**:
     entered the signup → became a marketer → didn't finish. Deletion-proof,
     backfilled, shown on the Marketers tab identically to the Creators tab.
   - `marketer_signups` (created at Google sign-in, updated per level) = the
     deeper detail: reached level N, per-level check retries — exactly where
     people drop off and which level's question needs a rewrite.
3. **A conduct agreement on record** (`agreed_at` timestamp) — today customer
   phone numbers are handed out with nothing in writing.
```

---

# PART H — UI DESIGN SYSTEM (match the creator onboarding exactly)

**The `/team` flow must look and feel like a sibling of `/creator`, not a new
design.** The owner's instruction: take the colours, copy tone, type scale,
login screen, Vimeo embed, buttons, progress dots, quiz cards, level nodes and
bottom sheets straight from the existing creator onboarding. Everything below is
extracted verbatim from `src/CreatorOnboarding.tsx` and
`src/CreatorDashboard.tsx` (the not-logged-in login screen). **Copy these values;
do not invent new ones.** When in doubt, open those two files and match them.

## H1. Design tokens (use these exact constants)

```ts
const INK   = '#111';      // primary text, filled buttons, active dots, selected borders
const MUTED = '#9a9aa2';   // secondary text, labels, locked level nodes
const HAIR  = '#ececed';   // hairline borders, inactive dots, unselected option borders
const RED   = '#dc2626';   // errors, invalid fields, "didn't finish" count
const GOLD  = '#FFD700';   // primary CTA background (enabled) + brand accent/glow
// disabled primary button bg = '#d7d7db' with '#fff' text
// selected-but-neutral fills: '#f5f5f5' (quiz), '#f6f6f7' (secondary button)
```

- **Font:** `system-ui, -apple-system, sans-serif`, `WebkitFontSmoothing:
  'antialiased'`. No web fonts.
- **Brand mark:** the word "chapter அ" (the Tamil letter அ set slightly heavier,
  `WebkitTextStroke: '0.35px currentColor'`) and `/icon-512.png` / the black
  rounded-square app logo. Use the same on the team login card.
- **Frame:** the flow renders inside the app's `MobileShell` (a phone-width
  frame). Root is `height: 100%` (NOT `100vh`), `overflow: hidden`, column flex,
  `background: #fff`. Content column is `maxWidth: 460, margin: '0 auto'`.
- **Corner radii:** inputs/option cards `12`, primary/secondary buttons `14`,
  video `24`, bottom sheets `32px 32px 0 0`, small chips/badges `999`.

## H2. The login / fork screen (from `CreatorDashboard.tsx` "not logged in")

Rebuild the creator login card, re-worded for core-team training:
- A centered card, `maxWidth: 340`, `border: '1px dashed #d8c27a'` (gold dashed),
  `borderRadius: 20`, white bg, padding `18px 14px 14px`.
- Logo (64×64, `/icon-512.png` overflow-cropped as in the creator card) → the
  "chapter அ" wordmark (`fontSize 24, fontWeight 800, letterSpacing -0.5`) → a
  spaced uppercase subtitle: **`CORE TEAM TRAINING`** (`fontSize 15, color
  #6b6b73, letterSpacing 1.6, textTransform uppercase`).
- **Primary button** (gold, shimmer): **"I want to join the team"** → sets the
  onboarding intent in `sessionStorage` then triggers Google OAuth. (Creator uses
  `startOnboarding(); login();` and the `creatorOnboardingIntent` key — use a
  `teamOnboardingIntent` key.)
- A dashed `— or —` divider (same `#d4d4d8` dashed rule, `#a1a1aa` "or").
- **Secondary button** (white, `1.5px solid HAIR`): **"I'm already on the team"**
  → plain Google login → `/admin`.
- Helper line under it (`MUTED`, `fontSize 12.5`): *"New here? Press \"I want
  to join the team\" to get started."*
- Reuse the login CTA shimmer keyframes (`creatorLoginCtaShimmer`).
- **Loading state:** while auth settles / the marketer lookup runs, show the same
  centered animated brand mark the creator dashboard uses (black rounded square +
  gold blur glow, `creatorLoaderEnter` / `creatorLoaderGlow` keyframes). Respect
  `prefers-reduced-motion`.

## H3. The onboarding shell (from `CreatorOnboarding.tsx`)

- **Top bar (on every major screen except inside a level):** a left back-chevron
  (an 11×11 box with `borderLeft`/`borderBottom` `2.2px solid INK` rotated 45°)
  + a row of **progress dots**. Dots are `height: 6, borderRadius: 999, flex: 1`,
  `background: active ? INK : HAIR`, filling left-to-right as steps complete.
  Creator has 4 dots (video·levels·quiz·details) — for marketers use the same
  pattern for the major steps (welcome → map → details); the 13 levels are
  tracked on the map itself, not as top dots.
- **Back behaviour:** the flow pushes each major screen into
  `window.history` (`pushState`/`popstate`) so the browser/native Back walks
  screen→screen instead of dropping out of auth. Copy the `openStep` /
  `returnToPreviousStep` / `popstate` handler pattern verbatim (it's already
  written in `CreatorOnboarding.tsx:249-337`).
- **Progress persistence:** creator mirrors to `localStorage`
  (`creatorOnboardingProgressV3`); the team flow additionally persists to the
  `marketer_signups.progress` JSONB (server, so resume works cross-device) AND a
  localStorage fallback. Use the distinct key `teamOnboardingProgressV1`.

## H4. Buttons (exact styles)

```ts
// Primary CTA — gold when enabled, grey when disabled. Add the shimmer class
// (creator-cta-shimmer) only when enabled.
primaryBtn(enabled) = { width:'100%', padding:'14px 0', borderRadius:14, border:'none',
  background: enabled ? '#FFD700' : '#d7d7db', color: enabled ? '#111' : '#fff',
  fontSize:15, fontWeight:700, cursor: enabled ? 'pointer' : 'default' }

// Secondary — white/grey outline
secondaryBtn = { width:'100%', padding:'12px 0', borderRadius:14,
  border:'1.5px solid #ececed', background:'#f6f6f7', color:'#000',
  fontSize:14.5, fontWeight:700, cursor:'pointer' }
```

The **shimmer** is a diagonal light sweep via a `::before` with the
`creatorCtaShimmer` keyframes (copy the `<style>` block verbatim). Only apply it
to an enabled primary CTA. Always guard animations with
`@media (prefers-reduced-motion: reduce)`.

## H5. The Vimeo welcome video (9:16 vertical, exact embed)

Copy the creator video block:
- Container: `aspectRatio: '9 / 16'`, `height: 'min(56vh, 460px)'`,
  `borderRadius: 24`, `overflow: hidden`, `background: #000`, `1.5px solid HAIR`.
- A loading spinner overlay (the inline SVG rotating arc on black) shown until
  the iframe `onLoad` fires (`videoLoaded` state).
- The iframe uses the **edge-bleed trick** to hide Vimeo's chrome: `inset: -2`,
  `width/height: calc(100% + 4px)`, `clipPath: 'inset(0 round 22px)'`, and the
  URL `https://player.vimeo.com/video/<ID>?autoplay=0&muted=0&badge=0&byline=0&title=0&portrait=0&api=1`,
  `allow="autoplay; fullscreen; picture-in-picture"`.
- **Placeholder id + `TODO(owner)`** until the owner records the marketer welcome
  video (the creator one is `1212874247` — do NOT reuse it; leave a placeholder
  and a comment). Heading above the video: `fontSize 23, fontWeight 800,
  letterSpacing -0.5`; subcopy `MUTED, fontSize 14, lineHeight 1.55`. CTA below:
  **"I've watched it — continue"**.

## H6. The level map (from the creator lesson map)

- Section headers per act: `fontSize ~12.4, fontWeight 800, letterSpacing 0.45,
  textTransform uppercase, color #2B2B2B`, with a `MUTED` uppercase subtitle
  beneath (`fontSize 10.5, letterSpacing 1.1`). Marketer act labels:
  **"Act 1 · Be the customer"** / **"Act 2 · Be the marketer"** (copy in Part E).
- Level nodes are a vertical list with a `2px` `HAIR` connector line behind them
  (`position: absolute, left: 27`). Each node = a circular token + a title:
  - **Completed:** filled `INK` circle, white `✓`, `~34px`.
  - **Unlocked / current:** `48px` white circle, `2px solid INK` border, the
    level number inside; the *next* one gets the `creatorLevelPulse` pulsing
    animation (copy the keyframes).
  - **Locked:** `HAIR` border, `MUTED`, a little padlock SVG instead of a number;
    `disabled`, `cursor: default`.
  - Title text: `fontSize 14.5, lineHeight 1.35`, `fontWeight 750` unlocked /
    `650` locked, `color INK` unlocked / `MUTED` locked.
- Sequential unlock only (level N unlocks when N−1 is complete); an `aria-label`
  spells out "Level N: title, completed/unlocked/locked".
- Bottom of the map: a gold **Continue** (enabled only when all levels done) +
  a secondary **"I Have a Doubt"** button that opens the FAQ bottom sheet (H8).

## H7. Level screen + quiz cards

- **Inside a level:** a back link "‹ Lesson Map" (small, `MUTED`, `fontWeight
  700`) at top-left, then the level title (`fontSize 23, fontWeight 800,
  letterSpacing -0.5`), then the level body/mock, then the single check MCQ.
- **Quiz option cards:** stacked buttons, `padding 12px 14px`, `borderRadius 12`,
  `fontSize 14`, left-aligned. Border/background by state:
  - default: `1.5px solid HAIR`, white bg, `fontWeight 500`.
  - selected (pending check): `1.5px solid INK`, `#f5f5f5` bg, `fontWeight 700`.
  - wrong pick (after submit): `1.5px solid RED`, `#fef2f2` bg.
- **Wrong-answer feedback:** an inline red hint box (`1.5px solid #fecaca`,
  `#fef2f2` bg, `borderRadius 12`) with a short "Take another look at …" line and,
  where useful, a "Reopen this level" underline link. Increment the retry counter
  in `progress.retries` (that's the funnel signal). Options are **shuffled once
  per mount** with Fisher–Yates (`shuffle`), and the correct-answer token travels
  with the option so screen order is irrelevant — copy the `CORRECT` / `shuffled`
  / answer-token approach exactly (matches the server `ANSWER_KEY`, Part F).

## H8. Bottom sheets (FAQ + terms/agreement)

Both are `motion/react` (framer-motion) spring sheets over a dimmed backdrop —
copy the two `AnimatePresence` blocks from `CreatorOnboarding.tsx:855-975`:
- **Backdrop:** absolute `inset:0`, dark translucent; FAQ uses a blurred
  `rgba(0,0,0,0.4)` + `backdropFilter: blur(12px)`, terms uses solid `#000` at
  `opacity 0.5`. Tap backdrop to close; `Esc` closes (keydown listener).
- **Sheet:** anchored bottom, `borderRadius 32px 32px 0 0`, white,
  `boxShadow: 0 -16px 40px rgba(0,0,0,0.16)`, `maxHeight ~80–88%`, spring
  transition (`type:'spring', damping ~25-28`). A floating round close "✕" button
  sits just above the sheet's top-right for the FAQ.
- **FAQ sheet** = an accordion of question rows (chevron rotates on expand,
  `motion` height animation; each row `borderTop 1px #e4e4e7`, question
  `fontWeight 750 fontSize 14.5`, answer `#57534e fontSize 13.5 lineHeight 1.6`).
  Reuse it verbatim for the marketer **"I Have a Doubt"** sheet on the map footer.
  **The actual questions & answers are canonical copy — see Part E, "Map footer ·
  the 'I Have a Doubt' sheet"** (header "Got a question? 🤔", 7 entries incl. a
  Contact-Us WhatsApp fallback → `https://wa.me/919940111564`). Use those words.
- **Agreement:** the L13 conduct agreement can reuse the terms-sheet pattern, OR
  be the inline checkbox on the details form (Part E) — the creator flow uses a
  20×20 custom checkbox (rounded 6, check SVG) next to an underlined
  "Terms & Conditions" opener. Match that checkbox styling for the marketer
  confidentiality agreement.

## H9. Details form fields

- Field label: `fontSize 12.5, fontWeight 700, color MUTED`.
- Input: `width 100%, padding 12px 13px, borderRadius 12, border 1.5px solid
  HAIR, fontSize 15`; border turns `RED` on a requested-but-invalid value, with a
  small red helper line beneath.
- Phone input: `inputMode="numeric"`, strips non-digits, caps at 10, validates
  `/^[6-9]\d{9}$/`. UPI validates the same `UPI_RE` the creator flow uses.
- Segmented choices (creator uses this for gender) render as an equal-width grid
  of pill buttons, selected = filled `INK` / white text. Use the same pattern if
  any marketer field needs fixed options.
- Submit button label: **"Join the team"**, showing **"Setting up your
  account…"** while in flight. On success → the "You're on the team" screen
  (Part E).

## H10. Copy voice & language complexity (match the creator tone)

The creator onboarding is written in **plain, warm, second-person English at
roughly an 8th-grade reading level** — short sentences, contractions, one idea
per line, occasional light emoji in headers only (e.g. the FAQ "What's the
matter? 🤠"). It explains, it doesn't lecture. Mirror that register — which the
Part E core-team copy already does. Specifics to preserve:
- Headers are short and human ("The BIG picture", "Your money math"); marketer
  levels are phrased as the questions marketers actually ask (Part E).
- Never use jargon without unpacking it in the same breath.
- Buttons are first-person or plain-imperative ("Start training", "Join the
  team", "Open my Team Dashboard").
- Error/hint copy is gentle and points back to the lesson, never scolding
  ("Take another look at …").
- Keep sentences that read aloud naturally on a phone screen — the creator copy
  never runs a paragraph past ~3 lines on mobile. Part E is already written this
  way; if you tighten anything, tighten toward this voice.

## H11. Accessibility & motion (carry these over)

- Every interactive control has an `aria-label`/`role` where the visual is an
  icon (back chevrons, checkbox, close button, level nodes).
- All decorative animation (shimmer, pulse, loader glow) is disabled under
  `@media (prefers-reduced-motion: reduce)` — copy those media queries.
- Focus/scroll: reset body scroll to top on step/level change (the creator flow
  does `bodyScrollRef.current?.scrollTo({ top: 0 })` on `openLevel`/`step`).
