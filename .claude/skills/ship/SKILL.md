---
name: ship
description: Safely commit and push ONE isolated change to a live-payments production site. Runs tsc, verifies only the intended file(s) are shipped (never the deploy-held open-event batch), makes a clean single-file commit with a why-focused message, pushes, and confirms the held work stayed untouched. Use when the user says "ship", "push this", or "push X alone".
---

# /ship — safe isolated push

This repo deploys to a **live site taking real payments**, and there is usually a
**deploy-held batch** of work-in-progress that must NOT ship. This skill pushes
exactly one intended change and nothing else.

## The deploy-held batch (never ship unless the user explicitly lifts the hold)
`src/App.tsx`, `src/AppFlow.tsx`, `src/PaymentOverlay.tsx`,
`supabase/functions/payu-callback/`, `supabase/functions/cart-abandonment/`.
(Confirm the current hold list against CLAUDE.md — it may have changed.)

## Inputs
`$ARGUMENTS` = the file(s) to ship, or a short description of the change. If unclear,
ask which file — do not guess.

## Steps
1. `git status --short` — see everything uncommitted. Identify the TARGET file(s).
2. `npx tsc --noEmit` — if it fails, STOP and report the errors. Never ship a red build.
3. **Isolation check:**
   - If the target is a file that ALSO contains deploy-held changes mixed in the same
     file (classically `src/App.tsx`), you cannot `git add` the whole file. Use the
     **patch-isolation** procedure below.
   - If the target is a self-contained file separate from the held batch (e.g.
     `src/AdminPanel.tsx`), proceed — the held files just stay unstaged.
4. `git diff <target>` — show the user what is about to ship. If it contains anything
   beyond the intended change, STOP and flag it.
5. `git add <target>` (only the target path(s)) then `git commit` with a message whose
   body explains the WHY, ending with the repo's co-author trailer.
6. `git push`.
7. `git status --short` — confirm the held batch is STILL uncommitted. Report the commit
   hash, the one file shipped, and "held batch untouched: <list>".

## Patch-isolation (when the intended change shares a file with held work)
Only when step 3 requires it:
1. `cp <file> /tmp/<file>.full` and verify with `diff -q` (this backup is the ONLY copy
   of the held edits in that file — do not skip verification).
2. `git checkout <file>` to reset it to HEAD.
3. Re-apply ONLY the intended hunks to the clean file (Read it first, then Edit).
4. `npx tsc --noEmit`, `git diff <file>` (must show only the intended change), commit, push.
5. `cp /tmp/<file>.full <file>` to restore the held work; `git status` should now show
   only the held changes again. Remove the backup.

## Guardrails
- Never `git push --force` (blocked by settings anyway).
- Never deploy edge functions here — that is a separate manual step the user does.
- If the change is a Supabase edge-function file, remind the user it needs a manual
  deploy after push (the git push does NOT deploy functions).
