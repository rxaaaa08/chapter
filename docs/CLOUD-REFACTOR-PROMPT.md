# Cloud refactor — split the giant files (drafted 2026-09-24)

Paste everything inside the fence into a Claude Code **cloud** session on repo
`rxaaaa08/chapter`, branch **`cloud/refactor-split`**, session model **Fable 5.1**,
environment network "Trusted", NO environment variables.

Measured 2026-09-24 (CLAUDE.md's "~6.6k" for AdminPanel was stale):
`src/AdminPanel.tsx` 13,732 lines · `src/AppFlow.tsx` 6,115 · `src/App.tsx` 5,776.
AdminPanel has only 24 top-level declarations, so it is mostly ONE giant component —
splitting it means turning shared state into props, which is where the risk is.

The project has **no automated tests**. The cloud session can only prove "it still
compiles and builds"; the real safety net is the local click-through afterwards
(agent-browser over every admin tab + the customer flows, read-only), done in an
interactive session before the owner decides whether it reaches `main`.

```
You are the MANAGER of a multi-agent REFACTOR of a live production web app. Goal: split three oversized source files into well-organised, readable modules WITHOUT changing what the app does. Budget is not a concern — safety and thoroughness are. Take as long as you need.

## Context
chapter அ: mobile-first booking web app (React + Vite + TypeScript, Supabase, PayU payments). It was built quickly ("vibe-coded") and is live with paying customers. The owner is not a programmer. Pushing to main deploys the live site — you must NEVER push to main.
Files to split (measured):
- src/AdminPanel.tsx — 13,732 lines, admin + marketer dashboards; mostly ONE giant component. Tabs: Plans · Flow · People · Team · Growth · Build · ⚙ (see ADMIN_TABS and the sub-view pills described in CLAUDE.md).
- src/AppFlow.tsx — 6,115 lines, the /plans chat UI, event details, open-event booking flow.
- src/App.tsx — 5,776 lines, homepage, invite flow, PayUReturnScreen (payment success/failure/receipt), routing shell.
Order: AdminPanel first (admin-only, no customer impact if something slips), then AppFlow, then App (payment screens — most care).

## Read first
CLAUDE.md (all of it — it contains rules that constrain this refactor, e.g. TeamOnboardingPanel mirrors AdminPanel line ranges, data-tour attributes, bookingTimeline.ts is the single timeline definition). Then skim the three files' structure (grep for top-level declarations and the main component's sections; don't read 13k lines linearly).

## The one rule: BEHAVIOUR-PRESERVING ONLY
- Move code; do not change it. No logic changes, no bug fixes, no renamed props/functions/exports, no changed text/classNames/data-tour/aria attributes, no reformatting of code you didn't move, no dependency changes, no new libraries, no new React.lazy/code-splitting (keep the existing lazy imports exactly as they are).
- Bugs, dead code, duplication, or "this should be cleaner" ideas you notice: write them in the report under "Noticed, not changed". Never fix them in this job.
- Every file that imports from the three originals must keep working: keep each original file as the entry point (same default export and same named exports, re-exported from the new modules), so no other file in the repo needs to change.
- React hazards to guard, every time you extract a piece of a component into its own component:
  - every variable/state/setter/ref/callback the piece used from the parent must be passed in explicitly — list them;
  - hook call order inside any component must not change; no hook may move into a condition;
  - useEffect/useMemo/useCallback dependency arrays stay identical in meaning;
  - components currently DEFINED INSIDE another component's body remount on every parent render; moving them to module scope changes that (state inside them would start persisting). Treat that as a behaviour change: either keep the current behaviour or flag it explicitly for the owner — never silently;
  - keys on lists, ref forwarding, and event handler identities must behave the same.
- Target shape: folders like src/admin/<tab>/..., src/flow/..., src/app/...; aim for files under ~800 lines, grouped by what the owner sees (tab / screen / sheet), plus shared helpers and types in their own files. Prefer many small, obvious moves over one clever restructure. If a piece is too entangled to extract safely, LEAVE IT and say why.

## Team (Agent tool)
- ANALYSTS: model "sonnet", in parallel. Map each file: every section/tab/screen, every top-level helper, and for the giant components a table of which state/refs/callbacks each section reads and writes. This map is what the plan is built from.
- IMPLEMENTER: model "sonnet". ONE at a time only — parallel edits to the same file will collide. Each implementer gets one extraction step, a self-contained brief, and the rules above.
- VERIFIER: model "opus". After EVERY step, before the next begins. Its job is to find a behaviour change, not to approve. It runs `git diff --color-moved=dimmed-zebra --color-moved-ws=allow-indentation-change HEAD~1` and checks that every non-moved changed line is only an import/export/prop-plumbing line, and that every captured variable is passed correctly. Verdict PASS / FAIL with reasons. FAIL = revert that step (git revert, never reset) and re-plan it smaller or skip it.
- PLAN REVIEWER: model "opus", once, before any code changes: what is risky, what order, what should be left alone.
You plan, brief, decide, keep the progress file, and write the report. Don't do the bulk edits yourself.

## Phases
1. MAP (analysts, parallel). Record baseline numbers: line counts, `npx tsc --noEmit` result, `npm run build` result and the size of each file in dist/assets.
2. PLAN. Ordered list of small extraction steps per file, lowest risk first: (a) pure helpers/constants/types with no React state, (b) already-self-contained child components, (c) tab/screen bodies that need props plumbing. For each step: what moves, to which new file, what props it needs, risk level. Plan reviewer checks it; record AGREED/DISAGREED per point.
3. PROGRESS FILE. REFACTOR-PROGRESS.md: the plan and a status per step. Update and push after every few steps so a crash loses nothing. If resumed, read it first.
4. EXECUTE, one step at a time: implementer makes the step → `npm ci` once at start, then after each step `npx tsc --noEmit` AND `npm run build` must both pass → verifier PASS → commit (one step per commit; message says what moved where and why) → next step.
5. FINAL CHECKS. tsc + build pass; compare dist sizes against baseline (explain any change over ~1%); grep the whole repo (including *.md, CLAUDE.md, journeyMapSeeds, TeamOnboardingPanel comments) for references to the old line numbers/locations and update the DOCUMENTATION (CLAUDE.md file map and line references) to point at the new files — docs only, no code outside the split.
6. REPORT: write REFACTOR-REPORT.md (below). Push.

## Rules for EVERY agent — paste these into every brief
- Never push to main. Only push to cloud/refactor-split. Never force-push, never reset, never rewrite history; undo is `git revert`.
- No deploys, no database or Supabase/PayU/Meta calls, no credentials, no `npm run dev` against production. Build and typecheck only.
- Never bypass the pre-commit hook (`--no-verify` is forbidden).
- Touch only src/AdminPanel.tsx, src/AppFlow.tsx, src/App.tsx, NEW files you create under src/, CLAUDE.md (file-map/line-reference updates only), REFACTOR-PROGRESS.md and REFACTOR-REPORT.md. Nothing else. The docs/ folder is off limits.
- Behaviour-preserving only (the rule above). When in doubt, don't move it.

## REFACTOR-REPORT.md
- Plain-English summary for the non-programmer owner: what was split, what the code looks like now, what was deliberately left alone and why.
- Before/after: line counts per file, new folder tree with one line per file saying what's in it.
- Old → new map: "the People ▸ Call table used to be AdminPanel.tsx ~L6588; now src/admin/people/CallTable.tsx".
- CLICK-TEST LIST: every screen/tab/sheet whose code moved, ranked by risk, with exactly what to click and look at, so a human (or a local agent) can confirm nothing changed. Mark the payment screens clearly.
- Flagged behaviour questions (e.g. inner components that would now keep state) — each needs the owner's decision.
- "Noticed, not changed": bugs, dead code, duplication, security or performance concerns found along the way, each with file:line and a suggested fix.
- Team log: steps attempted / passed / reverted / skipped; plan-review AGREED/DISAGREED; verifier PASS/FAIL counts.
Commit, push to cloud/refactor-split, and tell me the final commit hash.
```
