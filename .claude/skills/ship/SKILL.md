---
name: ship
description: Safely commit and push ONE isolated change to a live-payments production site. Runs tsc, verifies only the intended file(s) are staged, respects any deploy hold currently recorded in CLAUDE.md, makes a clean commit with a why-focused message, pushes, and confirms nothing else moved. Use when the user says "ship", "push this", or "push X alone".
---

# /ship — safe isolated push

Pushing to `main` **deploys the live site, which takes real payments**. This skill
ships exactly one intended change and nothing else.

## Inputs
`$ARGUMENTS` = the file(s) to ship, or a short description of the change. If unclear,
ask which file — do not guess.

## Before anything else: the two gates

**1. Explicit go-ahead.** CLAUDE.md rule 2: never push without the user's explicit
go-ahead *in the current conversation turn*. Invoking `/ship` IS that go-ahead. A
go-ahead given for an earlier change does not carry over to a later one.

**2. Read the live deploy hold — never assume it.** CLAUDE.md rule 4 holds the
authoritative hold status, and it changes as batches ship. Read that rule at run time
and use whatever it says right now:
- **"none active"** → there is no held batch. Every uncommitted file is fair game;
  isolation is still about not sweeping up *unrelated* edits, not about a hold.
- **a file list + "active"** → those paths must NOT ship unless the user explicitly
  lifts the hold in this turn.

Do not carry a hold list in your head from a previous session, and do not treat the
examples in this file as the current hold.

## Steps
1. `git status --short` — see everything uncommitted. Identify the TARGET file(s), and
   note any other dirty files (held or merely unrelated) that must stay behind.
2. `npx tsc --noEmit` — if it fails, STOP and report the errors. Never ship a red build.
3. **Isolation check** — for each target:
   - Target is the *only* change in its file → proceed normally.
   - Target shares a file with changes that must NOT ship (a held path, or unrelated
     work-in-progress) → you cannot `git add` the whole file. Use **patch-isolation**
     below.
   - Other dirty files exist but are separate from the target → fine, they just stay
     unstaged. Confirm they're untouched at step 7.
4. `git diff <target>` — read the FULL diff and show the user what is about to ship. If
   it contains anything beyond the intended change, STOP and flag it.
5. `git add <target>` (only the target path(s)), then `git commit` with a body that
   explains the WHY, ending with the repo's co-author trailer.
6. `git push`.
7. `git status --short` — confirm everything that was meant to stay behind is still
   uncommitted. Report the commit hash, the file(s) shipped, and either
   "held batch untouched: <list>" or "no hold active; <n> unrelated file(s) left dirty"
   — whichever matches what you actually found at step 1.

## Patch-isolation (only when step 3 requires it)
1. Copy the file to a scratchpad path **outside the repo** (never inside it — a stray
   copy inside the working tree can get committed). Verify the copy with `diff -q`:
   this backup is the ONLY copy of the excluded edits.
2. `git restore <file>` to reset it to HEAD.
3. Re-apply ONLY the intended hunks to the clean file (Read it first, then Edit).
4. `npx tsc --noEmit`, then `git diff <file>` — it must show only the intended change.
   Commit and push.
5. Copy the backup back over the file to restore the excluded work; `git status` should
   now show only those excluded changes again. Delete the backup.

If any step here fails, STOP and tell the user the backup path — never leave their
uncommitted work recoverable only from a file you haven't told them about.

## Guardrails
- Never `git push --force` (blocked by settings anyway).
- Never deploy edge functions — the user does that. `git push` does NOT deploy them, so
  if the change touches `supabase/functions/**`, say plainly in the final report that a
  manual deploy is still required for it to take effect.
- DB migrations don't apply on push either — flag the same way.
- Surfaces behind login (admin, marketer, creator dashboards) can't be verified in the
  preview; tsc + SQL simulation is the accepted check per CLAUDE.md.
