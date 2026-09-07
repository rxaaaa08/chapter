---
name: silent-failures
description: Hunt for swallowed errors, empty catch blocks, and fallbacks that hide real failures — the bugs that produce no error message and are found weeks later in the data. Reviews recently changed code by default, or a named file/area. Read-only; reports findings and proposes fixes, never applies them unasked. Use when the user says "check for silent failures", "why did this fail quietly", "review error handling", or after writing code that talks to Supabase, PayU, AiSensy, Brevo or Meta.
---

# /silent-failures — find the failures nobody sees

A crash gets reported. A **silent** failure does not: the booking that never got its
WhatsApp message, the commission that never accrued, the Meta event that never fired.
Nothing threw, nothing logged, and the damage shows up in the data days later.

This codebase is unusually exposed to these because almost every important action is a
network call to somebody else — Supabase, PayU, AiSensy, Brevo, Meta — and every one of
them can fail in a way that looks like an empty result.

## Scope
`$ARGUMENTS` = a file, folder, or area to review. If empty, review what is currently
uncommitted (`git status --short`, then `git diff`) — the code most likely to be fresh
in the user's mind.

## What to hunt

### 1. Swallowed errors
- `catch {}`, `catch (e) {}` with an empty or comment-only body
- `.catch(() => {})` — the failure is now unobservable
- `try`/`catch` where the catch does nothing but `return`

### 2. Fallbacks that hide the failure
- `.catch(() => [])` or `.catch(() => null)` — downstream code cannot tell "nothing
  matched" from "the query failed". This is the single most common one here.
- `|| []`, `?? 0`, `|| {}` applied to something that can be an **error**, not just empty
- A default that is a *plausible* value (`spotsLeft = 0`, `price = 0`) — plausible
  defaults are worse than obviously-wrong ones, because nobody notices

### 3. Supabase-specific (the big one)
Supabase's JS client **does not throw** on a failed query. It returns `{ data, error }`.
- `const { data } = await supabase...` with `error` never destructured → a failed query
  is indistinguishable from an empty table. Flag every one.
- `error` destructured but never checked
- `.single()` where zero rows is a real possibility — that populates `error`, not an
  exception
- An RLS denial returns empty data with no error on SELECT — if the code treats empty as
  "none exist", say so explicitly in the finding

### 4. Fire-and-forget outbound calls
- `fetch(...)` to AiSensy / Brevo / Meta CAPI / PayU with no `await`, or awaited with no
  check of `res.ok`
- A non-2xx response parsed as success (`await res.json()` without checking status)
- No timeout on a call made inside a user-facing path

### 5. Deliberate swallowing that must stay
Some swallowing here is correct and load-bearing. Do **not** flag these as bugs —
mention them only if the surrounding change affects them:
- `trg_zz_log_application_change` swallows all exceptions **on purpose**, so that
  history logging can never roll back a customer's booking.
- Edge functions that must return 200 to PayU regardless of internal outcome.

If you are unsure whether a swallow is deliberate, say so rather than guessing.

## Output
For each finding, in severity order:

- **Where** — `file:line`
- **What** — the pattern, quoted
- **What it hides** — the concrete thing that breaks with no error. Be specific to this
  business: "a paid booking gets no WhatsApp invite and nobody finds out until the
  customer asks", not "the error is not handled".
- **Fix** — the smallest change that makes the failure visible

Then one line: how many findings, and which single one you would fix first.

## Rules
- **Read-only.** Report and recommend. Apply fixes only if the user asks.
- Do not propose wrapping everything in try/catch — that adds noise and hides more. The
  goal is failures becoming *visible*, not *caught*.
- Logging to console is not a fix on its own for anything that touches money or a
  customer message; those need to surface to the admin or retry.
