---
name: openclaw-fixes
description: Pick up the newest OpenClaw audit report and turn it into real fixes. Reads the report from ~/.openclaw/workspace/reports/ directly (the owner never copies or pastes anything), explains the findings in plain language, settles any UNCERTAIN findings by actually running the test OpenClaw is forbidden to run, then implements the fixes the owner picks in the real project folder. Use when the user says "openclaw fixes", "work through the latest report", "what did openclaw find", or names an OpenClaw report.
---

# Turn an OpenClaw report into shipped fixes

OpenClaw audits but never edits. Its reports are files on this Mac. **Read them straight off disk — never ask the owner to paste a report in.**

## 1. Find the report

```bash
ls -t ~/.openclaw/workspace/reports/*.md | head -10
```

The newest `<date>-<job>.md` is the final report. Beside it may sit `-progress.md` (where the job got to), `-working.md` (candidate evidence), `-verification.md` (the verifier's verdicts) and `-manager-position.md` (the manager's own labels, written before the co-manager was consulted). The final report is the one to act on; the others explain *how* a verdict was reached and are worth opening when a finding looks surprising.

If the owner names an older job, use that one. Read the whole report before saying anything about it.

## 2. Understand the labels before you act

- **NON-COMPLIANT** — a real defect. Fix candidate.
- **PARTIALLY COMPLIANT** — usually the *claim* is too broad, not that the system is broken. Often the right fix is to correct the wording in a handoff or comment, **not** to change code. Check which before touching anything.
- **UNCERTAIN** — see §3. This is the interesting one.
- **COMPLIANT / OBSOLETE / IRRELEVANT** — no action; don't invent work.

A finding without both a doc quote **and** a code `file:line` is not a finding. If the report has one, say so rather than guessing what it meant.

**Re-check every finding against the code as it is NOW, before fixing anything.** A report is evidence about a snapshot, not about the present, and it can be wrong in two different ways:

- **Stale.** The audit read `~/OpenClaw-Workspace/chapter-copy` as it stood when the job started. The owner may have changed the real folder since. Open the cited `file:line` in the *real* folder and confirm the code still says what the report quotes.
- **Simply mistaken.** Researchers make errors that survive into reports. Real examples from 2026-09-20: a researcher claimed `-o FILE` worked on both `sort` and `uniq` (it doesn't — `uniq` takes a positional operand); another claimed there was "no wildcard scope" when `agents["*"]` is exactly that; a third asserted a separate Mac user account that didn't exist. The verifier caught some, not all.

If a finding no longer matches the code, say so and close it — do not fix a problem that isn't there. If the report and the code disagree, **the code wins**; re-derive the finding from what you can actually see.

## 3. Settle the UNCERTAIN findings first — this is the main job

**OpenClaw's workers are read-only and forbidden from running tests, so they cannot close any finding that needs a command run.** Every audit therefore hands back a short "UNCERTAIN — needs a test" list. Closing it is exactly why this session exists.

For each UNCERTAIN finding: work out the smallest command that settles it, run it, and report the result plainly. A finding that turns out to be real gets fixed; one that doesn't gets recorded as closed so nobody re-investigates it later.

Precedent worth copying (2026-09-20): the audit could only label the `sort -o` write hole UNCERTAIN. One command proved it real, and the before/after evidence made the fix obvious and verifiable.

**Test the real thing, in the right order.** If a fix will close a hole, prove the hole exists *before* fixing it — otherwise the test proves nothing. Then re-run the same test after the fix to show it now fails. Before/after beats argument.

## 4. Fix in the real folder, never the copy

Edits go in `/Users/krutesh/Downloads/Website Flow Multi-Pickup`. **Never edit `~/OpenClaw-Workspace/chapter-copy`** — it is rebuilt from the real folder by `chapter-refresh-copy` before every job, so anything written there is destroyed and never reaches production.

Obey `CLAUDE.md` in full, especially: one concern per commit, no `git add -A`, and any deploy hold recorded there.

## 5. Show the owner before changing anything

He is a no-code founder. For each finding: what it is, whether it costs money/customers/measurement, what the fix is, and what it risks. Rank by real consequence, not by the report's order. **Let him pick.** Don't fix everything because it's listed.

Say plainly when a finding is a documentation defect rather than a bug — a wording fix and a code change are very different decisions.

## 6. Verify, then ship on his word

```bash
npx tsc --noEmit
```

Must pass. **`tsc` is a type check, not a test** — this project has no automated tests, so never call a fix "tested" because it compiles. Say what you actually verified.

Then hand to the `ship` skill, which handles the isolated commit and push. **Nothing is pushed without the owner's explicit OK in that turn** (`CLAUDE.md` golden rule). An OK for one push is not an OK for the next.

## 7. Close the loop

Record the outcome where the next session will find it — the relevant handoff (`OPENCLAW-HANDOFF.md` for OpenClaw's own setup, `META-ADS-HANDOFF.md` for Meta work), noting which findings were fixed, which were closed as not-real, and which the owner deliberately declined. An audit finding that is silently dropped gets re-found and re-investigated at full cost.

## Budget note

OpenClaw's Claude workers and this session share **one** Claude Pro allowance; `openclaw models status` only reports the ChatGPT side and is blind to it. Don't start a fix session while an OpenClaw job is running — they compete. Check the Claude usage card first.
