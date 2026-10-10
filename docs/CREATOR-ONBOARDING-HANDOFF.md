# CREATOR ONBOARDING DEMO LEVELS — BUILD HANDOFF

_Written 2026-07-21 for the agent/session that will build this. The design
was locked with the owner over several rounds on 2026-07-21; every decision
here is final — build, don't redesign. If something in the code contradicts
this document, STOP and ask the owner instead of improvising._

---

## 0. The three documents and how to use them

1. **`creator-onboarding-demo-proposal.md`** — the WHY and the locked
   decisions. Read once for context.
2. **`creator-onboarding-level-copy.md`** — the WORDS. Every on-screen
   sentence, button label, caption, and toast for every level lives there.
   It is the single source of truth for copy — do not invent or paraphrase
   copy; lift it verbatim. (The owner may edit that file for voice before or
   after your build; structure won't change.)
3. **This file** — the HOW. Architecture, logic, state, phases, gotchas,
   and the exact definition of done.

Related but read-only context: `creator-self-serve-onboarding-proposal.md`
(the already-built v1 flow this extends).

---

## 1. What you are building (one paragraph)

The self-serve creator onboarding at `/creator` is ALREADY BUILT and working
(uncommitted in the working tree): Google login → welcome video → 5-question
quiz → details form → `creator-signup` edge function. You are inserting a new
step between the video and the quiz: **eight interactive demo levels** (a
small Duolingo-style path) where the trainee plays their own follower
reaching their link through a comment-triggered auto-DM, watches a booking
turn into ₹160 of commission, tours a replica dashboard, and learns the
auto-DM growth tactic. The quiz moves to the END of the levels (it already
sits after the video — you're just putting the levels in between) and gains
per-question "revisit level N" hints. **The backend is not touched at all.**

New flow: `video → levels (NEW) → quiz → details`.

---

## 2. NON-NEGOTIABLE safety rules (violating any of these is a failed build)

1. **The Supabase DB is PRODUCTION with live customers.** The demo levels
   must make ZERO network calls — no inserts, no RPCs, no analytics events.
   Pure client state only.
2. **Never press "Create my creator account" while testing.** The details
   form submits to the live `creator-signup` edge function and would insert
   a real `affiliates` row (and burn the per-IP rate limit). Test everything
   up to — but never through — that button.
3. **Never deploy edge functions.** You will not need to: this build doesn't
   touch `supabase/functions/` at all. If you think you need to, you've
   misread the design — stop.
4. **Never `git push` without the owner's explicit go-ahead** in that
   conversation turn. Pushing to `main` deploys the live site.
5. **The working tree has UNRELATED uncommitted changes** (`src/App.tsx`,
   `src/AppFlow.tsx`, `src/AdminPanel.tsx`, `src/supabase.ts` carry other
   work). When committing, stage ONLY the files you touched, by name
   (`git add src/CreatorOnboarding.tsx src/CreatorOnboardingDemos.tsx …`),
   never `git add -A` or `git add .`. Verify with `git status --short`
   before and after every commit.
6. **`npx tsc --noEmit` must pass after every edit.** Zero errors is the
   baseline (the `supabase/functions` dir is excluded from tsconfig — leave
   it that way).
7. **`npm run dev` talks to PROD Supabase.** Fine for rendering the
   onboarding UI; see rule 2 for the line you must not cross.

---

## 3. The ONE frozen contract you must never break

The quiz's five answer tokens, in order:

```
['pay_through_link', 'eight_percent', 'monthly', 'creator_dashboard', 'experiences_page']
```

This array exists in TWO places that MUST stay byte-identical:

- Client: `CORRECT` in `src/CreatorOnboarding.tsx` (~line 33)
- Server: `QUIZ_ANSWER_KEY` in `supabase/functions/creator-signup/index.ts`
  (~line 39)

**Do not change the tokens, the order, the question wording, or the option
labels.** The submit payload (`quiz_answers: QUIZ.map((_, i) => answers[i])`)
must keep exactly this shape. The entire "zero backend change, nothing to
deploy" property of this build rests on this contract staying frozen. The
only quiz changes allowed are the ones in §7 Phase C (intro line, hint text,
a "reopen level" affordance) — presentation only, never data.

---

## 4. Decisions already made (do not reopen)

- ✅ Flow order: **video → levels → quiz → details.** The video keeps the
  opening slot (owner explicitly rejected demoting it). The quiz stays ONE
  screen at the end (owner explicitly rejected embedding MCQs per level).
- ✅ **8 levels, two acts** (Act 1 · Be your follower = L1–L2; Act 2 · Be
  the creator = L3–L8). L8 ("How we sound") is IN — owner confirmed.
- ✅ **L1 is the comment → auto-DM play-through** (owner replaced the
  original Instagram-story idea). Follower comments "LINK" → auto-DM with
  two buttons → club page.
- ✅ **L7 is the auto-DM growth-tactics lesson** (owner-requested): two
  buttons — "I need more details" and "Book Now" — BOTH pointing at the same
  link; auto-DM is optional (bio works) but tested better than bio;
  suggested tool is **Superprofile**. These specifics are the owner's own
  practice — keep them exactly.
- ✅ **"Try your handle" box in L1 stays** (cosmetic only — no availability
  check, no claim; real handle is chosen on the details form, which
  pre-fills from it).
- ✅ Demo event everywhere: **Gokarna Beach Weekend · ₹1,999 · ₹160
  commission**. Demo follower: **Priya**.
- ✅ Levels are pure play: no per-level questions, no network, completion by
  interaction.
- ✅ Demo mocks live in ONE new standalone file; no demo mode is threaded
  through `CreatorDashboard.tsx` or any real component.
- ✅ v1 (the built flow without levels) is HELD — do not ship it separately.
- ❌ Out of scope, do NOT build: `creator_signups` analytics table, welcome
  WhatsApp, any change to `creator-signup`, per-event links anywhere, live
  handle checks in the demo.

---

## 5. Existing code to read first (in this order)

1. `src/CreatorOnboarding.tsx` (~410 lines) — the component you are
   extending. Understand before touching:
   - `step` state: `'video' | 'quiz' | 'details'` (~line 106) — you add
     `'levels'`.
   - Browser-history wiring (~lines 113–140): `creatorOnboardingStep` is
     stamped into `history.state`; `openStep()` pushes, `popstate` restores.
     You must extend both the union type and the popstate guard.
   - Step-progress dots (~lines 253–257): currently 3 — becomes 4.
   - `scrollable = step !== 'video'` (~line 237): the levels step is
     scrollable like quiz/details.
   - Quiz internals (~lines 156–172): `answers`, `wrongIdx`, `submitQuiz`,
     the error line, and the "Re-watch the video" secondary button — Phase C
     touches the presentation here.
   - Details internals (~lines 174–228): `handle` state (you pre-fill it),
     `normalizeHandle` (~line 97), the submit fetch (do not touch).
   - Style constants (~lines 19–23, 231–235): `INK '#111'`, `MUTED
     '#9a9aa2'`, `HAIR '#ececed'`, `GREEN '#16a34a'`, `RED '#dc2626'`,
     `primaryBtn`, `secondaryBtn`, `label`, `input`. Reuse these exact
     values in the demos file so everything matches.
2. `src/CreatorDashboard.tsx` (~540 lines) — how onboarding is mounted
   (`meStatus === 'absent' && wantsOnboarding` → `<CreatorOnboarding email
   onComplete>`, ~line 327). You should NOT need to modify this file except
   the optional Phase C banner. Also your visual reference for the L4
   replica: earnings hero (~390), link card (~398), funnel tiles (~432),
   conversions rows (~484), leaderboard (~514).
3. `src/CreatorUpcomingEvents.tsx` (~186 lines) — your visual reference for
   the L6 card, and the **fixed phone-width wrapper pattern for the sheet**
   (~lines 176–183) that you must copy for L6.
4. `src/InvitePlanDetailsSheet.tsx` — the sheet component L6 reuses.
   Props: `open: boolean`, `onClose: () => void`, `title: string`,
   `details: InvitePlanDetails | null` where `InvitePlanDetails =
   { quickInfo: any[]; included: any[]; itinerary: any[]; accommodation?;
   showAccommodation: boolean }`. Feed it a canned demo object (§6 Phase B,
   L6) — never fetched data.
5. `creator-onboarding-level-copy.md` — all the words.

---

## 6. Phase-by-phase build plan

One concern per commit. After every phase: `npx tsc --noEmit` green, then
verify in the preview browser (see "How to preview" below), then commit
(staging files by name only). Do not start a phase until the previous one is
committed.

### How to preview (applies to every phase)

The onboarding sits behind Google login, which you can't do in the preview
browser. Do what the previous session did: add a TEMPORARY dev harness —
e.g. in `CreatorDashboard.tsx`, if `window.location.search` contains
`onboarddev`, render `<CreatorOnboarding email="dev@test.local"
onComplete={() => alert('complete')} />` directly, bypassing auth. Then
`npm run dev` (launch.json name: "Vite Dev Server", port 3000) and open
`http://localhost:3000/creator?onboarddev`. **This harness is temporary: it
must be REMOVED before your final commit of each phase that used it** (the
previous session followed the same add→verify→revert discipline; keep the
harness out of every commit). Use a 375×812 viewport — this is a
mobile-first product. Remember safety rule 2: never submit the details form.

### PHASE A — the `levels` step and the map shell

_Goal: the new step exists end-to-end with placeholder level bodies; the
full flow video → levels → quiz → details is walkable._

Tasks, in `src/CreatorOnboarding.tsx`:

1. Extend the step union: `'video' | 'levels' | 'quiz' | 'details'`.
2. Video step's button ("I've watched it — continue") now goes to
   `openStep('levels')`. The levels step gets a **Continue to the quiz**
   primary button that is DISABLED until all 8 levels are complete, calling
   `openStep('quiz')`.
3. Extend the history wiring: add `'levels'` to `openStep`'s allowed
   targets and the popstate guard; `returnToPreviousStep` chain becomes
   details→quiz→levels→video. The back chevron on the levels step goes to
   the video; on the quiz it now goes to the levels.
4. Step dots: 4 (video ✓ always, levels, quiz, details).
5. Level-map UI inside the levels step: two act labels + 8 level nodes
   (number, title from the copy doc, ✓ when complete, pulse on the next
   unlocked one, lock on the rest). Unlock rule: level n is tappable iff
   `n === 1` or level `n-1` is complete. Completed levels stay tappable
   (revisitable) forever.
6. Level screen chrome: tapping a node opens that level full-screen within
   the step (map hidden); an in-app back chevron returns to the map. Do NOT
   push history entries per level — browser back from anywhere in the
   levels step returns to the video, matching the existing step-level
   granularity. (Keep it simple; this mirrors how quiz/details already
   behave.)
7. State + persistence:
   ```ts
   // inside CreatorOnboarding
   const [completedLevels, setCompletedLevels] = useState<Set<number>>(...);
   const [openLevel, setOpenLevel] = useState<number | null>(null);
   const [demoHandle, setDemoHandle] = useState('');
   ```
   Persist `{ completed: number[], demoHandle: string }` to
   `localStorage['creatorOnboardingProgress']` on every change; hydrate on
   mount. Wrap every localStorage touch in try/catch (private mode) — the
   file already does this for sessionStorage; match that pattern. Clear the
   key inside the existing `onComplete` path (after successful signup).
8. Placeholder bodies: each level renders its title + a "Mark done
   (placeholder)" button that completes it. Real bodies come in Phase B.

Verify: walk video → levels → complete all 8 placeholders → quiz → details
(don't submit); browser back at each step behaves; refresh mid-levels
restores progress; dots correct; tsc green; console clean.

Commit: `Creator onboarding: insert demo-levels step between video and quiz`.

### PHASE B — the eight demo components (the big one)

_Goal: replace placeholders with the real interactive demos._

New file: `src/CreatorOnboardingDemos.tsx`. Everything demo lives here —
one component per level (`DemoL1` … `DemoL8`), plus shared bits. Copy the
style constants from `CreatorOnboarding.tsx` (INK/MUTED/HAIR/GREEN/RED and
the button styles) so the demos are visually indistinguishable from the
rest of the flow. Each `DemoLn` receives
`{ demoHandle: string, onDone: () => void }` (L1 also gets
`setDemoHandle`) and calls `onDone()` exactly when its completion condition
(§7 table) is met — completing must be idempotent (re-playing a completed
level never un-completes it).

Shared demo data — define ONCE at the top of the file:

```ts
const DEMO_HANDLE_FALLBACK = 'yourhandle';
// Duplicate of normalizeHandle in CreatorOnboarding.tsx — kept local to
// avoid a circular import; same regex, keep in sync.
const normalizeDemoHandle = (v: string) =>
  v.trim().replace(/^@/, '').toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 40);

const DEMO_EVENTS = [
  { title: 'Gokarna Beach Weekend',  price: 1999, cut: 160 },
  { title: 'Sunrise at Kovalam',     price: 900,  cut: 72  },
  { title: 'Pondy Beach Houseparty', price: 1499, cut: 120 }, // 8% rounded
];
const DEMO_FUNNEL = { clicks: 120, signups: 14, paid: 5 };   // 5 × 160 = 800
const DEMO_MONTH_EARNED = 800;
const FOLLOWER = 'Priya';
```

All copy comes verbatim from `creator-onboarding-level-copy.md`. The
per-level interaction logic is specified in §7. Wire each demo into the
level bodies in `CreatorOnboarding.tsx`.

L6 specifics: render the real `InvitePlanDetailsSheet` for the plan-details
tap, using the fixed phone-width wrapper copied from
`CreatorUpcomingEvents.tsx` lines ~176–183 (the sheet needs a
viewport-relative box; the onboarding body is a scroll container). Feed it a
canned `InvitePlanDetails` object for Gokarna (2–3 `quickInfo` entries, 3–4
`included` strings, a 2-day `itinerary`, `showAccommodation: false`) —
invent plausible demo content, clearly generic; never fetch.

Verify (preview, 375×812): play every level start to finish; every
completion condition fires exactly once; "Continue to the quiz" lights up
only after all 8; the L6 sheet opens/closes with its animation; the handle
typed in L1 appears in L1 scenes 2–3, L2's tag, L4's link card, and L7's
builder card; nothing in the network tab beyond the Vite dev traffic;
console clean; tsc green.

Commit: `Creator onboarding: the eight demo levels (standalone mocks)`.

### PHASE C — quiz hints, details pre-fill, finishing touches

_Goal: the supporting polish, each piece small and independent._

1. **Quiz intro + hints** (in `CreatorOnboarding.tsx`):
   - Intro line above the questions, from the copy doc ("Quick check — 5
     questions…").
   - Replace the generic wrong-answer error with a per-question hint: for
     the FIRST index in `wrongIdx`, render the hint sentence from the copy
     doc (mapping: Q1→L2, Q2→L3, Q3→L5, Q4→L4, Q5→L1) plus a small
     **"Reopen this level"** button that does `setOpenLevel(n);
     setStep('levels')` — quiz `answers` state must survive the round-trip
     (it will, since the component never unmounts; verify it).
   - The quiz's secondary button "Re-watch the video" becomes **"Back to
     the demo"** → returns to the levels map. (The video stays reachable via
     back-chevron chain.)
2. **Details form**: pre-fill the handle input from `demoHandle` (only if
   the field is empty — never clobber user input); add the UPI helper line
   from the copy doc under the existing UPI label.
3. **CLAUDE.md**: add one line to the file map noting
   `CreatorOnboardingDemos.tsx` contains schematic replicas of the creator
   dashboard/booking surfaces and must be refreshed when those change.
4. **Optional (build last, keep tiny):** the post-signup one-time banner in
   `CreatorDashboard.tsx` — on dashboard render, if
   `localStorage['creatorWelcomeSeen']` is absent, show the one-liner from
   the copy doc with a dismiss that sets the flag. If this feels at all
   risky, skip it and tell the owner — the dashboard is live code.

Verify: answer a quiz question wrong on purpose → correct hint + reopen
works and answers survive; handle pre-fill works and doesn't overwrite;
tsc green.

Commits: one per item (quiz hints / details pre-fill / CLAUDE.md line /
banner).

### PHASE D — improvement round (added 2026-07-21 after review of the first build)

_Phases A–C were built and committed on 2026-07-21 (commits `6e61045`,
`d96d602`, `bf4645d`, `78d8da7`, `da67436`), plus an uncommitted L1 Remotion
explainer. A review found the issues below. This phase is the follow-up
build round. Everything in §2 (safety rules) and §3 (frozen quiz contract)
still applies in full._

**D0 — the bundling commit (CRITICAL, do this first).** The committed code
imports files that were never committed: `CreatorOnboardingDemos.tsx`
imports the untracked `src/InvitePlanDetailsSheet.tsx`, its uncommitted
update imports the untracked `src/remotion/`, and the onboarding is only
reachable via uncommitted `CreatorDashboard.tsx` changes. **A push of
`main` right now fails the deploy build.** Fix by committing, as a
coherent batch (staged BY NAME, per safety rule 5): the creator v1 files
(`InvitePlanDetailsSheet.tsx`, `CreatorUpcomingEvents.tsx`, the
`CreatorDashboard.tsx` + `src/supabase.ts` changes, the migration, the
`creator-signup` function), the Remotion folder + `package.json`/lock
changes, and the updated `CreatorOnboardingDemos.tsx`. Also resolve the
dead asset: `public/creator-onboarding/lesson-1-explainer.mp4` (3.3 MB) is
referenced nowhere — the app uses the live `@remotion/player` instead.
Decision (owner confirmed direction): **keep the live Player** (it
personalises the handle inside the video) and **delete the unused mp4**
(keep the render script). Do NOT push after committing — the push plan is
the owner's call (there are also unrelated unpushed commits on main).

**D1 — the "what do I press next?" system (apply to L2–L8).** The levels
are free-form tap hunts with a silently disabled Continue. Build one
reusable pattern and apply it everywhere:
   1. **Tap checklist strip** at the top of each level: small chips (e.g.
      L4: `☐ a funnel tile · ☐ your conversions · ☐ copy your link`) that
      tick as they're done.
   2. **Pulse the next target, not just buttons**: move the existing
      `creator-demo-pulse` class onto the next un-done tappable element,
      in a guided order (L4: tile → conversions → Copy). Exactly one
      pulsing element on screen at all times.
   3. **Self-explaining disabled Continue**: replace the grey generic
      label with the missing action — "Tap Copy to continue", "See what
      happens if she books later", "Flip the last event card".
   4. **L4 extras** (the worst offender): number the three targets with
      ①②③ badges so "three things to tap" maps to the screen; show
      "2 of 3 explored" in the caption area.
   5. **L2 fix**: the "What if she books next week instead?" toggle is
      (a) required for completion but nothing says so, and (b) visible in
      scenes 1–2 where it makes no sense. Show it only from scene 3, pulse
      it once the ₹160 counter finishes, and let the disabled Continue
      name it.
   6. **Map polish**: pulse "Continue to the quiz" once all 8 are done
      (the pulse system currently goes silent at the final unlock), and
      show "6 of 8 done" near it so the gate reads as progress.

**D2 — L7 redesign (it lectures first, plays second — invert it).**
Current L7 is five dense paragraphs, a small-type comparison, a
"Walk both paths" button that is unclearly the completion trigger, and an
inert builder card styled like buttons. Rebuild keeping all the content:
   1. Scene 1 — a choice the trainee drives: "You just posted your Gokarna
      reel. Where does your link live?" → two big tappable cards, *In my
      bio* / *Auto-DM commenters*. Tapping one plays that path as a short
      animated sequence (L1's phone-frame style; bio path shows the
      profile-hunt drop-off, DM path shows comment → DM → tap). Then
      prompt "now try the other one". **Completion = played both.**
   2. Verdict beat after both: "Both work. Auto-DM books more — we've
      tested it." + the Superprofile suggestion, as a card, not prose.
   3. The builder: either make it a mini assembly interaction (tap "add
      button" twice; "I need more details" and "Book Now" slot in with
      connector lines both pointing at the same `chaptera.in/@{handle}`),
      or keep it static with an explicit "a preview of what you'll set up
      in Superprofile — nothing to tap here" caption and non-button
      styling.
   4. Break the five paragraphs into one-line captions inside the scenes.
   5. Typography floor: nothing below 11px (the 8.5px badge and 9.5–10.5px
      steps are too small on a phone).

**D3 — Remotion explainers (extend the L1 pattern; video primes, never
replaces, the interaction).** The template is L1's "watch ~30s → Try it
yourself". Add, in priority order:
   1. **L7** — split-screen race: two phones, same follower, bio path vs
      auto-DM path, visible drop-off on bio, closing zoom on the
      two-button DM feeding ONE link. Pairs with the D2 redesign.
   2. **L2** — the same-visit rule (~20s): day 1, tag glowing across
      screens → payment → +₹160; calendar flips; direct visit, no tag, ₹0.
   3. **L5** — optional month-lapse (bookings tick up → month closes → UPI
      ping). Only if cheap.
   Do NOT add videos to L3/L4/L6/L8 (L4's point is practicing taps; L3 is
   arithmetic; L6 shows real UI; L8 is a values reveal). Guardrails: every
   video works sound-off with on-screen text; compositions replicate our
   UI, so they fall under the CLAUDE.md drift note — extend that line to
   mention `src/remotion/`.

**D4 — small fixes.**
   1. "use my name for now" fills `yourhandle`, not their name — derive a
      slug from the Google email local part, or rename to "skip for now".
   2. Collapse the L1 handle input to a "demo as @{handle} · change" chip
      once the story starts (it currently clutters scenes 1–3).
   3. "Reopen this level" (quiz hint) jumps via `setStep` without history,
      so the header back-chevron from that level goes to the VIDEO and
      browser-back desyncs — it should return to the quiz.

**Still explicitly NOT yours:** `creator_signups` analytics table,
welcome-WhatsApp template, any edge-function change, and pushing. If the
owner asks for these, that's a new conversation.

### PHASE E — owner's level-by-level revision round (added 2026-07-21, after playing the built levels)

_These are the owner's direct instructions per level. **Where Phase E
conflicts with earlier phases, Phase E wins.** Specifically: the D2
"play both paths" L7 rebuild is **CANCELED**; D3 shrinks to the L1 video
re-cut + the re-scoped L2 video only (the L7 Remotion video and the
optional L5 video are dropped); the §7 level-spec table is superseded
where it disagrees with the completion conditions below. D1 (the
checklist/pulse/self-explaining-Continue system) still applies, but now
only to the levels that still require taps: **L3, L4, L6.** And the §0
rule that `creator-onboarding-level-copy.md` is the verbatim copy source
is now PARTIAL: that doc predates this phase and is stale for
L1/L2/L5/L6/L7/L8 — where Phase E removes or restructures content, Phase
E wins; keep any surviving sentences verbatim from the copy doc, write
the few new lines (L8 rules, L5 one-liner, L7 intro) in the same plain
style, and the owner will polish wording afterwards._

_Context: the owner separately instructed that the fictional "Gokarna
Beach Weekend" demo event be replaced with **"Pondy Beach Houseparty"** —
a REAL trip live on the website. Apply it everywhere (events list,
scenes, videos, captions), and keep every derived number internally
consistent: per-booking cut, `paid × cut = month earned`, the funnel
helper lines, the leaderboard rows, and the L2 counter must all agree.
Use the live site's real Pondy page as the visual/pricing reference._

**E1 — L1 becomes video-only.**
   1. **Remove the "use my name for now" button** and its logic entirely.
      Keep the handle input + its helper line (it still personalises the
      video and later levels).
   2. **Remove the interactive scenes 1–3** (reel → DM → club page). The
      level is now: handle input → the Remotion explainer → a primary
      **"Mark as done"** button. Completion = tapping that button (do not
      gate on full playback).
   3. **Re-cut the Remotion video with better beats and cuts** (your
      judgment, but the owner's specific note is binding): the shot shown
      after Priya taps the auto-DM button is unrealistic — it must mimic
      the REAL chaptera.in experiences page far more closely (layout,
      card style, type, spacing of the live surface; open the live site
      and copy what you see). Keep the handle personalisation and
      sound-off readability. Suggested beat sheet: reel hook → Priya
      comments "LINK" → auto-DM slides in with the two buttons → tap →
      an accurate website replica scrolling to the Pondy card → closing
      card "one link: yours".

**E2 — L2 drops the later-visit lesson.**
   1. Remove the "What if she books next week instead?" toggle, its note,
      and the `sawCounterexample` completion requirement — the same-visit
      rule is no longer taught here (owner's call; no quiz question
      depends on it). Completion = the ₹ counter finishing on scene 3.
   2. The D3 L2 Remotion video is re-scoped to the day-1 story only: tag
      rides along every screen → payment → +₹cut. No calendar-flip /
      no-tag beat.

**E3 — L3: "up to 8%" must look true.**
   1. Give each demo event its **own commission percentage** — not all
      8%: e.g. Pondy Beach Houseparty ₹1,499 @ 8% → ₹120 · Sunrise at
      Kovalam ₹900 @ 6% → ₹54 · third event @ **4%**. Show the pct on the
      flipped card ("8% → ₹120") so the spread is visible.
   2. **Remove the Click / Sign-up / Paid chips block** — L4's helpers
      cover it. Completion = all 3 cards flipped.

**E4 — L4: fewer taps, more glance.**
   1. Funnel tiles become **non-interactive**; add three static helper
      lines under the funnel card, one per metric (reuse the existing
      caption strings).
   2. Completion = **2 taps**: the conversions row + Copy. Update the D1
      checklist/pulse accordingly.
   3. **Populate the demo leaderboard** with 3–4 sample rows (names,
      tickets, ₹), the trainee's @{handle} highlighted "you" at #2 or #3,
      numbers consistent with the month-earned figure.

**E5 — L5: one card, no required taps.**
   Replace the three tappable nodes and the surrounding text with a
   single card: "Earned in July ₹X · Paid out monthly — straight to your
   UPI" plus ONE short line. Completion = Continue, always enabled.

**E6 — L6: trim + fix the sheet.**
   1. Remove the two example caption cards (and their clipboard logic).
   2. **Fix the sheet-opening glitch** — the owner reports
      `InvitePlanDetailsSheet` "opens weirdly" here; diagnose before
      patching. Known suspects: the `position: fixed` wrapper is
      viewport-relative while `/creator` renders inside the desktop
      MobileShell phone frame (the sheet can mis-align or span the full
      viewport on desktop); the onboarding body is its own scroll
      container; the sheet stays mounted with pointerEvents toggling.
      Compare against the working usage in `CreatorUpcomingEvents.tsx`
      on the real dashboard; test at 375×812 AND desktop-with-phone-frame;
      it must slide from the bottom of the phone frame with the backdrop
      aligned to it. Completion unchanged (open the sheet once).

**E7 — L7 becomes owner-video-led.**
   1. Cancel the Remotion plan for this level (and the D2 rebuild). The
      owner will record a custom vertical video for L7.
   2. L7 body = a 1–2 line intro → a **9:16 Vimeo iframe using the EXACT
      embed pattern of the welcome step** (same URL params, edge-bleed
      inset trick, loading spinner; new constant e.g. `L7_VIMEO_ID`, set
      to the same placeholder id with a `TODO(owner)` comment until the
      real video exists) → keep the "your auto-DM" builder card below as
      a clearly-labeled static preview ("what you'll set up in
      Superprofile — nothing to tap here", non-button styling) → the
      Superprofile suggestion line. Completion = a "Mark as done" button,
      like L1.

**E8 — L8 becomes a do's & don'ts rules page.**
   Replace the tap-to-reveal contrast pair with two lists. Sample copy
   (owner will rewrite later — structure matters, words don't):
   - **Do:** talk about your real experience · share the real price ·
     use only your own link · answer questions honestly, and send people
     to the site for details.
   - **Don't:** fake urgency or countdowns · invented discounts or "use
     my code" (there are no codes) · two different links in one DM ·
     mass cold-DMs beyond the comment → auto-DM flow.
   Completion = Continue, always enabled — no reveal taps required.
   Keep the ≥11px type floor.

_Cross-checks after E1–E8: `QUIZ_HINTS` still point at valid levels (the
L1 hint now reopens a video level — fine); every rupee figure across
L2/L3/L4/L5 and the videos derives from the same Pondy numbers; tsc
green; full preview walk video → 8 levels → quiz → details (never
submitting)._

### PHASE F — owner's second revision round (added 2026-07-21, after Phase E direction)

_Same rule as Phase E: **where Phase F conflicts with anything earlier,
Phase F wins.** Two global reversals in here: the D1 checklist strip is
**REMOVED everywhere**, and the next-tap affordance becomes
**pulse + GOLD highlight** (F4). Self-explaining disabled-Continue labels
stay._

**F1 — L2 Remotion video: full creative re-cut.**
   Re-edit the L2 video with your own beats and cuts — the owner is
   explicitly delegating the storytelling to you. Hard constraints only:
   day-1 attribution story (no later-visit beat, per E2); real Pondy
   numbers; handle personalisation; sound-off readable; any website shots
   mimic the REAL live pages accurately (same bar as E1). Everything else
   — pacing, scene order, transitions, emphasis — is yours.

**F2 — L3 events and percentages (updates E3).**
   1. The demo events and cuts are now: **Chill Sunday Meetup @ 8%** and
      **Pondy Beach Houseparty @ 7%** — both REAL events; pull their real
      prices from the live site and compute the cuts from those. Keep a
      third event at a visibly lower pct (4–6%, your choice) so the
      "up to 8%" spread stays honest. Show the pct on each flipped card.
   2. **Remove the closing helper paragraph** ("Commission runs on events
      where creator earnings are switched on — … never a surprise.").
   3. Ripple check: L2's counter, L4's conversions/month-earned/leaderboard,
      and L6's per-booking figures must be recomputed from whichever event
      those levels feature, so every rupee still agrees.

**F3 — L4 dashboard realism.**
   1. Add the **range dropdown** ("Last 7 days" style) above the funnel,
      mimicking the real dashboard's picker (real options: 24 hrs / Week /
      Month / 90 days). Make the demo numbers change per range with
      consistent ratios (Paid × cut arithmetic still holds on the Month
      view that matches the earnings hero). Purely local state.
   2. (Checklist strip removal and gold highlight are global — see F4.)

**F4 — GLOBAL: next-step affordance v2 (replaces the D1 checklist).**
   1. **Remove the task-completion checklist card/chips from every
      level** — the owner played with them and wants them gone.
   2. Keep the pulse, and ADD a **gold highlight** on the exact element
      that should be tapped next: define a `GOLD` constant (suggest
      `#eab308`, matching the creator app's amber identity), applied as
      the border (and a soft gold background tint) on the next target,
      replacing the grey `HAIR` border, moving through the level's tap
      order as targets are completed. One pulsing + gold element on
      screen at any time; disabled Continue keeps naming the missing
      action.

**F5 — L6: simplify like L5.**
   Cut the level to: ONE short intro line → the upcoming-events card
   (rows open the sheet; first row carries the pulse + gold until the
   sheet has been opened) → Continue. Remove the second paragraph, the
   remaining helpers, and any tracker UI. Completion unchanged: open the
   sheet once. (The E6 sheet-positioning fix still applies.)

**F6 — L7: simplify the try-it-yourself + rewrite the DM preview.**
   1. The interactive part shrinks to **just the two path cards with the
      animation**: tapping a path card plays that path's step animation
      (bio: hops with drop-off fade; auto-DM: straight through). Drop the
      separate "Walk both paths" button and any other interactive
      chrome. Completion = both paths played (gold/pulse moves from the
      first card to the second). The E7 Vimeo embed above it stays.
   2. Re-edit the bottom card into **"Our suggested auto-DM"**: the
      message + the two buttons ("I need more details" / "Book Now" →
      same link), clearly a static preview. Below it, add a **"Why this
      exact format"** bullet list — draft copy (owner will refine):
      - Two buttons make it obvious there's something to TAP — a bare
        link in a DM often gets read as plain text and skipped.
      - Two mindsets, one page: "I need more details" catches the
        curious, "Book Now" catches the decided — and the same page
        serves both.
      - Both buttons carry the SAME link, so your credit is safe no
        matter which one they tap.
      - The link reaches them in the moment they asked — no bio-hunting,
        no drop-off.
      - It runs by itself: every "LINK" comment gets the DM instantly,
        even while you sleep.

_Cross-checks after F: no checklist UI remains anywhere; gold+pulse
lands on exactly one element per level with taps (L3 cards, L4
conversions/Copy, L6 first row, L7 path cards); all rupee figures
re-derive from the real Chill Sunday + Pondy prices; tsc green; full
preview walk at 375×812._

### PHASE G — owner's third revision round (added 2026-07-21; restructures the map)

_Phase G wins over everything earlier. It **merges two levels away**:
old L2 folds into L1, and old L6 folds into L4 — the map becomes
**6 levels**. Canceled by this phase: F1 (the L2 Remotion re-cut — there
is no L2 anymore), F6 entirely (the L7 path cards AND the
"Our suggested auto-DM" card + bullets — L7 becomes video-only). Level
references below use OLD numbers for continuity, with the new number in
brackets._

**G0 — global.**
   1. Every lesson CTA currently labelled **"Continue" becomes
      "I Understand"** (the self-explaining label while disabled stays;
      once enabled it reads "I Understand").
   2. **The new 6-level map**: 1 · How a follower reaches your link
      (old L1+L2) → 2 · Your money math (old L3) → 3 · Your dashboard
      (old L4+L6) → 4 · When does the money reach you (old L5) →
      5 · Comments → auto-DM (old L7) → 6 · How we sound (old L8).
      Update the LEVELS array, the "Level X of 8" header (→ of 6), and
      the act grouping (Act 1 now holds only level 1 — keep the act
      labels). **Bump the localStorage key** (e.g.
      `creatorOnboardingProgressV2`) so previously stored 8-level
      progress can't misalign against the new numbering.
   3. **Remap QUIZ_HINTS** to the new numbers: Q1 `pay_through_link` →
      level 1 · Q2 `eight_percent` → level 2 · Q3 `monthly` → level 4 ·
      Q4 `creator_dashboard` → level 3 · Q5 `experiences_page` → level 1.
   4. Map screen: **remove the "8 of 8 done" progress badge** above the
      final CTA, and rename that CTA from "Continue to the quiz" to
      **"Continue to Next Step"**.

**G1 — L1 [new 1]: 16:9 infographic animation, absorbs old L2.**
   1. Remove the helper line "The video updates with your demo handle and
      works with sound off."
   2. The **handle field gets the pulsing-gold treatment** (it's the
      level's first target).
   3. Replace the vertical Remotion video with a **16:9 landscape
      infographic-style Remotion animation** (full column width, rounded
      corners; it will render ~250px tall in the 460px column — design
      for that). **Owner-specified beats, in order:** Priya comments
      **"Join"** on a Pondy Beach Houseparty trip post → the auto-DM she
      receives → she presses **"I need more details"** → the Pondy trip's
      details page (mimic the real page accurately) → the animation of
      her booking the trip → the animation of the commission earned by
      the creator. Note the comment keyword is now **"Join"**, not
      "LINK". Keep handle personalisation and sound-off readability.
   4. CTA: **"Continue to Next Lesson"** (not "Mark as done").
   5. Old L2 is deleted; its teaching (booking → your commission) now
      lives in this animation's final beats. Delete `DemoL2` and its
      video assets/compositions.

**G2 — L3 [new 2]: copy + price visibility.**
   1. Intro line becomes: **"Tap the events to see how your cuts work"**.
   2. Show each event's **price alongside the event name at all times**
      (not only pre-flip), so the percentage has a visible base — the
      user must always see what the % is *of*. Flipped state keeps
      "X% → ₹cut".

**G3 — L4 [new 3]: absorbs old L6; four taps in a fixed order.**
   1. Add the **"See upcoming events" card** into the demo dashboard
      (this replaces old L6; the sheet-open interaction and the E6
      positioning fix move here). One short what-to-post line may come
      with it — nothing more.
   2. **Guided tap order (gold + pulse move through exactly this
      sequence):** ① the range dropdown — interacting with it reveals
      the inflow-stat explanations (the funnel helper lines) → ② Your
      conversions → ③ See upcoming events (opens the sheet) → ④ the
      Copy button. Completion = all four done.
   3. Conversions helper becomes a **bill summary**: "₹259 per ticket ×
      5 = ₹1,295" (derive from the real Pondy price; drop the "Every
      rupee, itemised per event" phrasing).
   4. Copy-button caption becomes: "chaptera.in/@{handle} is your custom
      link & you can use this button to copy it."
   5. Intro copy becomes: "This is your dashboard — the real one, with
      demo numbers. You can open it anytime at chaptera.in/creator."
      (drop "Two/Three things to tap"; the owner's message had a "You'll
      can" typo — use "You can"). Style **chaptera.in/creator as a link
      (blue + underline) but NOT clickable** — no navigation, no href.
   6. **Fix the Copy button's weird pulsing**: the scale+box-shadow pulse
      misbehaves on that small inline button — diagnose, then use a
      calmer affordance there (e.g. gold border/tint only, no scale).

**G4 — L5 [new 4]:** the card line becomes **"Paid out monthly"** (drop
   "— straight to your UPI").

**G5 — L7 [new 5]: video only.**
   Remove: the intro lines ("Watch a creator walk through…" and "Then
   play both paths…"), the Superprofile sentence, the two path cards +
   animation, and the static "suggested auto-DM" preview. The level is
   **only the vertical Vimeo iframe** (welcome-step embed pattern,
   `L7_VIMEO_ID` placeholder, TODO(owner)) plus its completion CTA. The
   owner's recorded video will carry all the teaching.

**G6 — L8 [new 6]: paragraph + vertical video.**
   Remove the do's & don'ts lists (E8 reversed). Keep the existing
   intro paragraph(s), and **below them add a vertical 9:16 Vimeo
   iframe** (same embed pattern, new placeholder constant e.g.
   `L8_VIMEO_ID`, TODO(owner)) — the owner will record a custom video.
   Completion CTA stays.

_Cross-checks after G: 6 levels, sequential unlock intact; storage key
bumped; QUIZ_HINTS all point at existing levels; no "Continue" label
remains on lesson CTAs; the removed DemoL2/old-L6/path-card/suggested-DM
code and any orphaned video assets are actually deleted, not dead-coded;
tsc green; full preview walk at 375×812 (never submitting the form)._

### PHASE H — owner's fourth revision round (added 2026-07-21)

_Phase H wins over everything earlier. Level references use the **NEW
6-level numbering** from Phase G (1 follower-journey · 2 money math ·
3 dashboard · 4 payout · 5 auto-DM video · 6 rules)._

**H1 — Level 1: static infographic instead of the Remotion animation.**
   1. Replace the G1 16:9 Remotion animation with a **plain in-app
      infographic** (SVG/DOM component, no video, no player): a
      super-minimalistic, step-by-step strip — ① Priya comments "Join"
      on a Pondy Beach Houseparty video → ② Priya receives the auto-DM
      reply → ③ Priya opens our website → ④ she books → ⑤ the commission
      is added to the creator. (The owner's message said "marketer" on
      the last beat — they mean the **creator**; this is the creator
      flow.) Keep it clean: small frames or icon steps with one short
      label each, personalised with @{handle} where natural.
   2. **Remotion teardown**: with this change NOTHING uses Remotion
      anymore (L7's video became owner-Vimeo in Phase G). Delete
      `src/remotion/`, remove `remotion`, `@remotion/player`,
      `@remotion/cli` from package.json (+ lock), remove the two
      `remotion:*` scripts, and confirm no import remains. Own commit.

**H2 — Level 2 (money math): expanded intro copy.**
   Replace the single intro line with (owner's copy, typos corrected —
   they'll refine wording later):
   > You get a commission of up to 8% per ticket.
   >
   > Tap the events to see how your cuts work. These are demo numbers —
   > the real commission per ticket is available in the real dashboard.

**H3 — Level 3 (dashboard): dropdown behavior + the guidance system v3.**
   1. **Funnel helper texts are always visible** (their appearance on
      dropdown-press was jarring). When the dropdown is used, give the
      helper block a brief highlight (gold tint that fades) so the eye
      still lands on it — best of both options the owner offered.
   2. Guided tap ① is now two-part: **open the dropdown AND pick
      "Last week"** (default stays Month, so a real selection is
      forced); numbers update per range. The step isn't done until a
      new option is chosen.
   3. **Dropdown option labels**: "Last 24 hrs" · "Last week" ·
      "Last month" · "Last 90 days" — the word "Last" was missing. (The
      real dashboard says "24 hrs/Week/…"; the demo deliberately uses
      the "Last …" phrasing per the owner.)
   4. **Floating "why" helper on every guided target** (all levels, but
      especially this one): while a button carries the gold/pulse, a
      small floating caption sits next to it saying why to press it.
      Draft copy (owner refines): dropdown — "Change the time range to
      see how your stats move." · conversions — "Tap to see how your
      earnings add up." · See upcoming events — "You can see the details
      of all the events you need to post about by pressing this!" ·
      Copy — "This copies your custom link." · Level-2 event cards —
      "Tap an event to see your cut."
   5. **Spotlight/vignette focus on the current target** (all levels):
      while a target is active, visibly dim the rest of the level
      (reduced opacity/subtle dark wash on non-target sections) and keep
      the target at full contrast above it — a vignette effect that
      pulls focus. Implementation is your call (sibling dimming is
      acceptable; a true overlay cutout is not required), but it must
      work inside the scroll container, move through the tap order, and
      respect prefers-reduced-motion. This replaces nothing — it stacks
      with gold + pulse + the floating caption.

**H4 — Level 6: rename + trim.**
   1. Level title becomes **"Important Rules"** (update the LEVELS array
      and the map node).
   2. Remove the line "Last one — and it's about taste."

_Cross-checks after H: no Remotion import, dependency, or script
remains; level 1 infographic renders crisply at 375×812; the guided-tap
system (gold + pulse + floating caption + vignette dim) walks correctly
through level 3's four targets including the forced "Last week" pick;
helper texts under the funnel are visible before any interaction; tsc
green; full preview walk (never submitting)._

### PHASE I — scoped adoption of onboarding research (added 2026-07-22)

_BUILD STATUS 2026-07-22 (this repo, uncommitted): **I1, I4, I3 BUILT & verified**
(tsc green; onboarding walk verified via temp `?onboarddev` harness, since removed).
**I2 DEFERRED — NOT built.** I2 is a structural refactor of the LIVE
`CreatorDashboard.tsx` (real paying creators) that its own I2.3 rail requires be an
isolated commit with side-by-side pixel verification — unverifiable here without a real
creator login. Also I2.2 "use CreatorUpcomingEvents as-is in L3" is NOT a clean drop-in:
that component mounts its sheet with `position: fixed` (full-viewport), which reintroduces
the exact phone-frame mis-position E6 fixed for L3's portal-based sheet. So I2 needs its
own careful pass. Files touched by I1/I3/I4: `src/CreatorOnboardingDemos.tsx` (M),
`src/CreatorDashboard.tsx` (M), `src/CreatorFirstBookingChecklist.tsx` (new)._

_Context: the owner reviewed a research pass on consumer-app onboarding
(Duolingo/Airbnb/Figma/Canva/Uber patterns) and explicitly REJECTED the
full restructure — **the split-lesson level system stays exactly as it
is**. Phase I adopts four scoped items only, plus one pacing bug fix.
Phase I wins over earlier phases where they conflict. Level numbers =
the 6-level numbering (1 follower-journey · 2 money math · 3 dashboard ·
4 payout · 5 auto-DM video · 6 Important Rules)._

**I1 — Level 2: sell the value harder (additions, not a rewrite).**
   1. **Projection line on every flipped card**: after "8% → ₹259", add
      the multiplication that makes it feel real — "1 booking = ₹259 ·
      10 bookings = ₹2,590" (derive from each event's real cut).
   2. **A mini "what if" calculator** under the event cards: a slider or
      stepper — "If your posts bring N bookings this month" (N = 1–20)
      → a live rupee total computed from a featured event's real cut
      (e.g. Pondy ₹259 × N), updating as they drag. Pure client state,
      integer display, this is the Airbnb earnings-estimate hook in
      level form.
   3. **One real proof line** (optional, owner-supplied): "Our top
      creator earned ₹____ last month." Add it with a `TODO(owner)`
      placeholder and render it ONLY once the owner supplies the real
      number — never invent this figure.

**I2 — Level 3 becomes the REAL dashboard components (learn-by-doing,
scoped to this level only).**
   1. Replace the replica cards with the **real product**: refactor
      `CreatorDashboard.tsx`'s render pieces (earnings hero, link card,
      funnel card + range picker, conversions list, leaderboard) into
      small **exported presentational components** that take their data
      as props and fetch nothing. The real dashboard renders them with
      live data; level 3 renders the SAME components with the demo
      numbers. No replica left = the drift problem disappears for this
      level.
   2. The "See upcoming events" card in level 3 can be the literal
      `CreatorUpcomingEvents` component **as-is** — it reads real,
      anon-readable events and writes nothing, so the trainee sees the
      actual live product here (real events, real dates, real ₹ per
      booking).
   3. **Strict safety rails for this refactor**: presentational
      extraction ONLY — no data-layer, auth, RPC, or state changes in
      `CreatorDashboard.tsx`; the live dashboard must render pixel-
      identical after the refactor (verify side-by-side in preview);
      the extraction is its OWN commit, separate from the level-3
      wiring; demo data flows in as props, never via any global "demo
      mode" flag inside the dashboard.
   4. The H3 guided-tap system (gold + pulse + floating why-caption +
      vignette) stays and now runs over these real components —
      contextual tooltips on the genuine UI, which is the
      moment-of-need pattern done properly.

**I3 — "Your first booking" checklist in the REAL dashboard (the
Uber/Airbnb setup-checklist pattern).**
   1. A persistent card in `CreatorDashboard.tsx` (below the link card)
      for new creators: **① Copy your link → ② Post with the auto-DM
      setup → ③ First click on your link → ④ First booking.**
   2. Tick logic: ① ticks when they tap Copy (localStorage flag);
      ② links to the level-5 auto-DM video (reopens it read-only) and
      ticks when opened (localStorage); ③ auto-ticks when the stats the
      dashboard ALREADY fetches show `clicks_total > 0`; ④ auto-ticks
      when `tickets_paid > 0` (any range / month). **No new backend, no
      new RPC calls** — derive from data already loaded.
   3. Card hides once all four are ticked (celebrate briefly), or via an
      explicit dismiss; state in localStorage (per-creator key using
      their handle/id so shared devices don't cross-tick).
   4. This touches the LIVE dashboard — keep it a small, self-contained
      component, own commit, and verify the dashboard for an existing
      real creator (owner's account) renders unchanged apart from the
      new card logic (which existing creators with clicks/bookings will
      auto-complete and can dismiss — or simply don't render it for
      creators whose stats already show bookings at first load).

**I4 — Fix the vignette pacing (owner-reported bug, applies to every
guided tap in every level).**
   Today the highlight jumps to the next target the instant a step
   completes, giving no time to process what just happened. Replace the
   instant jump with a **two-beat rhythm**:
   1. **Acknowledge beat**: on completion, the current target's gold
      highlight turns into a green "done" state, and its floating
      caption switches to a short result line ("✓ Stats now show last
      week") — held for ~1.5s with the vignette still on the completed
      element, and never advancing while a triggered reveal/animation
      (e.g. the helper flash, the sheet) is still playing.
   2. **Advance beat**: then the vignette/gold/pulse moves smoothly to
      the next target. The result captions stay visible after focus
      moves on (they don't vanish when the spotlight leaves).
   Respect prefers-reduced-motion (skip the animation, keep the ≥1.5s
   acknowledgment hold). Tune the hold so it never feels laggy on the
   final step — the last completion can acknowledge and release the
   vignette without a follow-up jump.

_Cross-checks after I: live `/creator` dashboard for a real creator is
visually unchanged post-refactor (side-by-side); level 3 renders the
exported real components + live `CreatorUpcomingEvents`; checklist ticks
① on copy, ② on video open, ③/④ from already-fetched stats, and never
fires a new network call; every guided tap across levels 1–6 shows the
acknowledge-then-advance rhythm; slider math in level 2 is integer-clean;
tsc green; nothing pushed without the owner's go-ahead._

### PHASE J — owner's fifth revision round (added 2026-07-22; merges the map to 5 levels, rebuilds the Level 3 tour)

_Owner reports everything through Phase I is built. **Phase J wins over
everything earlier.** It contains one structural change (lessons 5+6
merge → **5-level map**), one demo-data consistency change (a single
"demo month" story shared by levels 3 and 4), the full Level 3 tour
redesign (the owner's priority — be thorough there), two new checklist
items, and a global CTA-pulse cleanup. Also present in the tree from the
same session: the "From the team" resources card in the live dashboard
with the real Drive + WhatsApp URLs — J4 reuses those constants._

**J0 — merge lessons 5 and 6 → "Important Rules & Advice" (5-level map).**
   1. The map becomes: 1 · How a follower reaches your link → 2 · Your
      money math → 3 · Your dashboard → 4 · When does the money reach
      you? → 5 · **Important Rules & Advice** (old L5 auto-DM video +
      old L6 rules content, combined).
   2. Level 5's body, top to bottom: a small eyebrow **"The setup that
      books the most"** → the auto-DM vertical Vimeo (existing
      `L7_VIMEO_ID` embed) → eyebrow **"How we sound"** → the existing
      rules paragraph → the rules vertical Vimeo (existing
      `L8_VIMEO_ID` embed) → one completion CTA ("I Understand" — the
      old "Finish the demo →" label dies with the merge). Two stacked
      9:16 embeds is accepted; when the owner records one combined
      video, collapse to a single embed (leave a TODO(owner) noting
      that option).
   3. Renumber mechanics (same drill as Phase G): update the LEVELS
      array and titles, "Level X of 6" → "of 5", act grouping (Act 1 =
      level 1; Act 2 = levels 2–5), and **bump the localStorage
      progress key** (e.g. `creatorOnboardingProgressV3`) so stored
      6-level progress can't misalign. `QUIZ_HINTS` targets (1/2/4/3/1)
      all survive the merge unchanged — verify, don't assume.
   4. Delete the old DemoL6 component; its paragraph and embed move
      into the merged level. No dead code left behind.

**J1 — Level 4: the payout "bill", and the ONE demo month it forces.**
   1. Below the monthly-earning card, add a bill-style split:
      ```
      Pondy Beach Houseparty     ₹259 × 3      ₹777
      Sunrise at Kovalam         ₹35 × 6       ₹210
      ──────────────────────────────────────────────
      Total earned in July                     ₹987
      ```
      Right-aligned amounts, hairline divider, bold total row. The
      total must equal the hero number above it, always by derivation,
      never by hand-typed literal.
   2. **This breaks the current demo story** (today's month is 5 × ₹259
      = ₹1,295, all Pondy) — so define ONE source of truth, e.g.:
      ```ts
      const DEMO_MONTH_LINES = [
        { event: PRIMARY_EVENT, tickets: 3 },   // 3 × ₹259 = ₹777
        { event: SUNRISE_EVENT, tickets: 6 },   // 6 × ₹35  = ₹210
      ];  // month earned = ₹987, month paid tickets = 9
      ```
      and derive EVERYTHING from it: the level 4 hero + bill, level 3's
      hero (₹987), level 3's month funnel (`paid: 9`; keep clicks 120 /
      sign-ups 14), level 3's conversions section (now TWO rows — Pondy
      ₹259 × 3 = ₹777 and Sunrise ₹35 × 6 = ₹210, which is more
      realistic anyway), and the leaderboard ("you" = ₹987 · 9 tickets;
      adjust neighbours so "you" stays #2, e.g. maya ₹1,813 / **you
      ₹987** / rohan ₹756 / nisha ₹294 — note maya earning more with
      fewer tickets is fine and quietly teaches that cuts differ per
      event).
   3. Other ranges stay plausible against the month: 24h `paid 0 · ₹0`,
      week `paid 1 (Pondy) · ₹259`, 90d must be ≥ month (e.g. Pondy×7 +
      Sunrise×14 → 21 paid · ₹2,303). Every displayed rupee derives
      from event cuts × tickets — no free-floating numbers anywhere in
      levels 2/3/4.

**J2 — Level 3: the full component-by-component tour (the owner's
priority; be thorough).**
   The owner's critique: dimming everything makes the dashboard hard to
   take in as a whole — and if we dim, then the tour must visit EVERY
   component, not just the four interactive ones. Rebuild the guided
   tour as follows:
   1. **Open with the full picture.** On entering the level, NOTHING is
      dimmed. The intro line invites the tour ("Here's your whole
      dashboard. Let's walk it piece by piece — tap the glowing card to
      start."), and the hero carries gold + pulse with no dimming yet.
      The first tap starts the tour; dimming begins only from stop 2.
   2. **Soften the dim.** Current `creator-guide-dim` (opacity 0.36 +
      desaturate) is too heavy — raise to ~0.55 opacity and drop or
      soften the saturate filter, so the rest of the dashboard stays
      readable behind the spotlight.
   3. **The stop order (10 stops, exactly this sequence):**
      | # | Component | Advance by | Tooltip draft (owner refines) |
      |---|---|---|---|
      | 1 | Monthly earned (hero) | tap the hero | "This is what you've earned this month. Tap it to start the tour." |
      | 2 | Range dropdown | open + pick **Last week** | "Change the time range to Last week to see how your stats move." |
      | 3 | Clicks tile | tap the tile | "Clicks: people who opened your link. Pays ₹0 on its own." |
      | 4 | Sign-ups tile | tap the tile | "Sign-ups: clicks that applied. Still ₹0 — interest isn't income." |
      | 5 | Paid tile | tap the tile | "Paid: the only number that pays you. Every ticket here is commission." |
      | 6 | Your conversions | tap the card | "Your earnings, itemised per event — tap to see the math." |
      | 7 | See upcoming events | tap a row (opens the sheet) | "You can see the details of all the events you need to post about by pressing this!" |
      | 8 | Closing the bottom sheet | close the sheet | ack on close: "✓ That's everything a follower sees before booking." |
      | 9 | Your custom link | tap Copy | "This copies your custom link." |
      | 10 | The Team | tap the leaderboard | "The leaderboard — everyone's tickets and earnings, including yours. Tap to finish the tour." |
      Notes: stops 3–5 spotlight each funnel tile INDIVIDUALLY (the
      always-visible helper lines under the funnel stay; the per-tile
      tooltip is the focused version of the same fact). Stop 8 is a
      real stop — closing the sheet gets its own acknowledgement, per
      the owner's list. Non-interactive components (hero, tiles, team)
      become tappable ONLY as tour-advance targets; they must not look
      like permanent buttons once the tour is done.
   4. **Keep the Phase I pacing** between every stop: green ack +
      result caption held (`GUIDE_ACK_MS`) before gold moves on. After
      stop 10, all dimming lifts, the whole dashboard is visible again,
      and the completion CTA enables.
   5. Completion = all 10 stops done, in order. The pending-label on
      the CTA names the current stop ("Tap the Paid tile to continue",
      "Close the details to continue", …).
   6. Re-verify the whole walk at 375×812 including: tooltip fit on the
      narrow tiles (three tooltips over a 3-column grid — keep them
      short or anchor above the tile row), the sheet open/close inside
      the phone frame, and reduced-motion (spotlight + ack still work
      with animations off).

**J3 — first-booking checklist: two new action items.**
   1. The checklist (live dashboard, `CreatorFirstBookingChecklist`)
      grows to SIX steps, in this order: ① **Join the creator group
      chat** → ② **Open the footage folder** → ③ Copy your link →
      ④ Set up your auto-DM → ⑤ First click → ⑥ First booking.
   2. Tick logic for the new pair: each renders as a link row that
      opens its URL in a new tab and ticks (localStorage flag) on tap —
      same honest-but-unverifiable standard as the auto-DM video step.
      Reuse the REAL `CREATOR_FOOTAGE_URL` / `CREATOR_GROUP_CHAT_URL`
      values already in `CreatorDashboard.tsx` — hoist them to ONE
      shared location imported by both the checklist and the "From the
      team" card; never duplicate the strings.
   3. Existing localStorage state must migrate gracefully: missing new
      flags default to false (the `{ ...DEFAULT, ...parsed }` spread
      already handles this — verify).

**J4 — GLOBAL: stop pulsing the big CTAs.**
   The owner finds the pulsating lesson-progress CTAs weird — and
   they're right: the full-width bottom CTA is now gold-filled when
   enabled, so adding a gold pulse ring + scale on top of it is
   double-signalling. New rule: **pulse + gold highlight are reserved
   exclusively for guided tap targets INSIDE a lesson.** Remove the
   pulse class from: `ContinueButton` when enabled, level 1's
   "Continue to Next Lesson", the map's "Continue to Next Step", and
   any other full-width bottom CTA. Sweep every `creator-demo-pulse` /
   `creator-demo-calm-pulse` usage and keep only in-lesson guide
   targets; also check the reduced-motion fallback (gold outline)
   doesn't linger on CTAs after the sweep.

_Cross-checks after J: 5 levels, storage key bumped, QUIZ_HINTS verified;
level 3 tour visits all 10 stops in order with the softened dim, full
undimmed view at start and end, and ack beats throughout; every rupee in
levels 2/3/4 derives from `DEMO_MONTH_LINES` / event cuts (grep for
stray 1295s); the level 4 bill total equals the hero; checklist shows 6
steps with the two link rows opening the real URLs; no bottom CTA pulses
anywhere; old DemoL6 and any orphaned constants deleted; tsc green; full
preview walk at 375×812 (never submitting the details form)._

---

## 7. Level-by-level build spec (logic + completion)

Copy = `creator-onboarding-level-copy.md`, verbatim. This table is the
logic contract. "Complete when" fires `onDone()`.

| L | Title (short) | Scenes / interactions | Complete when |
|---|---|---|---|
| 1 | How a follower reaches your link | Handle input (normalized live; empty → `DEMO_HANDLE_FALLBACK`; "use my name for now" skip fills from Google-name-derived slug or fallback). Scene 1: reel + pulsing button `Priya comments "LINK"`. Scene 2: DM thread, auto-DM bubble, two buttons **I need more details** / **Book Now** (identical handler), caption "both buttons → chaptera.in/@{handle}". Scene 3: club-page replica (3 `DEMO_EVENTS` rows) + tag `came from @{handle}` + closing caption + Replay. | Scene 3 reached (either DM button) |
| 2 | Watch a booking become your money | Scene 1: Gokarna card + tag + `Priya applies`. Scene 2: applied ✓ + `Priya pays ₹1,999`. Scene 3: confirmed ✓ + counter animating 0→160 (~1s, integers only) + "your commission · 8% of ₹1,999". Persistent toggle `What if she books next week instead?` → hides tag, shows the ₹0 counterexample note; toggle back restores. Replay resets to scene 1. | Scene 3 reached AND counterexample toggled open at least once |
| 3 | Your money math | Three flip-cards from `DEMO_EVENTS` (tap → shows "your cut: ₹N"). Three chips `Click / Sign-up / Fully paid` (tap → its one-liner). | All 3 cards flipped AND all 3 chips tapped |
| 4 | Your dashboard poke-around | Static replica (hero ₹800 / funnel tiles / one conversion row / link card + Copy / leaderboard footer). Three guided taps with captions: any funnel tile, the conversion row, the Copy button (Copy shows "Copied" ~1.2s, copies nothing real). | All 3 guided taps done |
| 5 | When does the money reach you | Hero + 3 tappable timeline nodes (bookings all month / month closes / paid to your UPI), each reveals its caption. | All 3 nodes tapped |
| 6 | What should you post | Upcoming-events card replica (`DEMO_EVENTS` rows, "₹N per booking", header "3 to promote · earn up to ₹160 per booking"). Tapping a row opens the REAL `InvitePlanDetailsSheet` with canned Gokarna details. Two demo captions with tap-to-copy (real `navigator.clipboard` is fine here; guard with `?.`). | Sheet opened at least once |
| 7 | Comments → auto-DM setup | Two comparison cards (bio: 4 steps; auto-DM: 3 steps, accent border + badge "Tested: works better"). Button `Walk both paths`: steps light in parallel ~550ms cadence; bio steps fade progressively (opacity 1→0.46), auto-DM steps highlight fully. Re-runnable. Below: read-only "your auto-DM" builder card (template + two buttons → same `chaptera.in/@{handle}` link) + the Superprofile line. | "Walk both paths" run at least once |
| 8 | How we sound | Two tap-to-reveal contrast cards ("Not us." / "That's us."). Button `Finish the demo →` returns to the map (which now shows the enabled "Continue to the quiz"). | Both cards revealed |

Cross-cutting rules:
- `{handle}` in ANY level = `normalizeDemoHandle(demoHandle) ||
  DEMO_HANDLE_FALLBACK`, live — if the trainee revisits L1 and changes it,
  every level reflects the new value.
- Every displayed rupee number is an integer (`Math.round`), formatted
  `toLocaleString('en-IN')` where ≥1,000 (₹1,999).
- No emoji in UI chrome; the two L6 captions keep the owner's emoji as
  written in the copy doc (they're social captions, not UI).
- Replay/revisit never un-completes a level.
- No `setTimeout` left running on unmount (clear intervals in effects —
  the ₹160 counter and the path-walk animation are the two to watch).

---

## 8. The answer key (client and server MUST match)

Covered in §3 — repeated here because the marketer handoff learned this the
hard way: any drift between `CORRECT` (client) and `QUIZ_ANSWER_KEY`
(server) silently bricks signup with `quiz_failed`. You are not changing
either. If the owner ever asks to reword a question, both files change in
the same commit and the owner redeploys the function — surface that; don't
do it unilaterally.

Question → level hint mapping (Phase C):

| Quiz index | Token | Hint points to |
|---|---|---|
| 0 | `pay_through_link` | L2 · Watch a booking become your money |
| 1 | `eight_percent` | L3 · Your money math |
| 2 | `monthly` | L5 · When does the money reach you? |
| 3 | `creator_dashboard` | L4 · Your dashboard |
| 4 | `experiences_page` | L1 · How a follower reaches your link |

---

## 9. Known gotchas (each has bitten this codebase before)

1. **The auth-callback race:** never query RLS tables inside
   `onAuthStateChange` (the token may not be attached yet). You shouldn't
   be querying anything — but if you touch `CreatorDashboard`, respect the
   existing settled-auth pattern and don't "simplify" it.
2. **MobileShell sizing:** `/creator` renders inside a phone frame on
   desktop. Components use `height: '100%'` / `minHeight: '100%'` — NOT
   `100vh`. Using `100vh` reintroduces the desktop overflow bug the owner
   already had fixed once. The levels step must follow the existing
   scrollable-step layout (`flex: 1; minHeight: 0; overflowY: auto`).
3. **The details form's handle field** deliberately has NO live
   availability check (removed by owner decision; taken-handle surfaces at
   submit). Don't re-add one, in the form or in the demos.
4. **`sessionStorage`/`localStorage` throw in private mode** — every access
   in this file is try/catch-wrapped; keep that discipline for the new
   progress key.
5. **Options are shuffled in the quiz** (`shuffle()` per mount) — the hint
   logic must key off question INDEX (`wrongIdx`), never option position.
6. **Vimeo placeholder:** `PLACEHOLDER_VIMEO_ID = '76979871'` is a stand-in.
   Leave it; the owner swaps in the real id before launch. Launch is
   blocked on the real video regardless (owner knows).
7. **Stray files in the tree:** `public/creator_dashboard.png` and various
   proposal `.md`s are the owner's; don't commit them with your work.
8. **Don't import `CreatorOnboardingDemos` into anything except
   `CreatorOnboarding.tsx`**, and don't import `CreatorOnboarding` into the
   demos file (circular). The demos file may import
   `InvitePlanDetailsSheet` — that one is dependency-free.

---

## 10. Owner action items (surface at the right time; never do them yourself)

1. Record the real welcome video (45–90s, warm, no mechanics) and provide
   the Vimeo id — swap `PLACEHOLDER_VIMEO_ID`. Launch-blocking, not
   build-blocking.
2. Voice pass on `creator-onboarding-level-copy.md` — especially the two
   L6 captions and the L7 auto-DM template (creators will copy those
   verbatim). If the owner edits copy after you've built, sync the strings.
3. Deploy `creator-signup` (still pending from v1; default verify_jwt ON).
   Without it, the final submit fails — fine during your build (you never
   submit), required before launch.
4. The push go-ahead. The whole feature ships together with the held v1
   files (`CreatorOnboarding.tsx`, `CreatorDashboard.tsx`,
   `CreatorUpcomingEvents.tsx`, `InvitePlanDetailsSheet.tsx`,
   `src/supabase.ts` creator bits, the Phase-1 migration, the edge
   function) — coordinate the commit/push plan with the owner explicitly;
   do not push anything on your own.

---

## 11. Definition of done (whole project)

- [ ] Flow walks end-to-end in preview: video → map → all 8 levels → quiz
      → details (stopping before submit), with browser back sane at every
      step.
- [ ] All 8 completion conditions fire per the §7 table; "Continue to the
      quiz" gates on all 8; levels stay revisitable; replays never
      un-complete.
- [ ] Handle typed in L1 propagates live to L1/L2/L4/L7 and pre-fills the
      details form (without clobbering user edits).
- [ ] Refresh mid-flow restores completed levels + demo handle
      (localStorage), and the key is cleared after successful signup
      (verify by code inspection, not by submitting).
- [ ] Quiz: intro line present; wrong answer → correct level hint + working
      "Reopen this level" round-trip that preserves answers; secondary
      button reads "Back to the demo".
- [ ] `CORRECT`, the QUIZ questions/options, the submit payload, and
      everything under `supabase/functions/` are byte-identical to before
      your build (`git diff` proves it).
- [ ] Zero new network calls from the levels (network tab clean in
      preview).
- [ ] L6 opens the real `InvitePlanDetailsSheet` with canned data, animated
      open/close, no mis-positioning inside the scroll container.
- [ ] 375×812 mobile viewport: no horizontal scroll, no overflow past the
      MobileShell frame on desktop.
- [ ] `npx tsc --noEmit` green; preview console clean.
- [ ] Dev harness (`?onboarddev` or equivalent) removed; `git status
      --short` shows only intended files staged per commit; one concern per
      commit; NOTHING pushed without the owner's explicit go-ahead.
- [ ] CLAUDE.md carries the demos-file drift note.
