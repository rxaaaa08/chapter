---
name: check-db
description: Run Supabase's own security and performance linters against the production database and interpret the findings against this project's house rules — including the ones that are deliberate and must never be "fixed". Read-only; proposes nothing without the user's say-so. Use after any migration, new table, new RPC, or RLS policy change, or when the user says "check the db", "check RLS", "any database warnings".
---

# /check-db — what Supabase's linter says about our database

Supabase ships security and performance advisors that run against the **real** database,
not against a checklist. They catch missing RLS policies, unindexed foreign keys, and
`SECURITY DEFINER` functions reachable by the wrong role.

This skill runs them and — the part that matters — separates the findings that are real
from the several that are **deliberate design in this project** and must be left alone.

## How to run
Supabase MCP, project `txcmismkdttgsyhbnexf` (`rxaaaa08's Project` — the live one;
`chap` / `wyskdhutbvybvitranhq` is INACTIVE, never use it):

```
get_advisors(project_id="txcmismkdttgsyhbnexf", type="security")
get_advisors(project_id="txcmismkdttgsyhbnexf", type="performance")
```

The security output is large and will be written to a file. Do not try to read it whole
— parse it with a short python script and print only the counts plus the first few
findings per category.

## Findings that are DELIBERATE — never "fix" these

**`app_secrets` has RLS enabled but no policies.** This is the single most important
line in this file. It is guarded twice on purpose (CLAUDE.md, 2026-09-18): deny-all RLS
**and** no `anon`/`authenticated` table grants. For a long time RLS was the only thing
standing between a browser session and every secret in it. Its legitimate readers are
`SECURITY DEFINER` functions owned by `postgres`, and `service_role` — neither is
affected. The advisor reports this as INFO because it cannot know the intent. **Adding a
policy here would be a security regression, not a fix.** Same for
`meta_audience_membership`.

**Backup tables** (`*_backup_<date>`) flagged for no primary key or no RLS policy —
snapshots, not live tables. Leave them; if one is stale, deleting it is a separate
decision for the user.

**`SECURITY DEFINER` functions that are supposed to bypass RLS** — the whole point of
`get-user-context`-style helpers and the `event_booking_counts` RPCs is that anon cannot
read `applications` directly. Being `SECURITY DEFINER` is correct. What matters is
whether the *right* ones are callable by the *right* role — see below.

## Findings that are REAL — report these clearly

**`SECURITY DEFINER` callable by `anon` or `authenticated`.** Check each one against
what it does. A function that only *reads* aggregate counts is fine. A function that
**moves money or changes state** is not — `accrue_affiliate_sale()`,
`accrue_manager_sale()`, `accrue_marketer_sale()` are accrual triggers and should not be
callable over REST by anyone. Report those first and by name.

When recommending a `REVOKE`, remember the house lesson: **revoking from `anon` and
`authenticated` leaves the `PUBLIC` grant in place**, and `information_schema` will show
zero rows and look like proof. Always name `PUBLIC` in the revoke, and verify with
`has_function_privilege`, never with `information_schema`.

**RLS policies re-evaluated per row** — `auth.uid()` instead of `(select auth.uid())`.
A real and cheap fix; it stops the function running once per row.

**Multiple permissive policies on the same table + role + action.** Every one runs on
every query. Worth consolidating on hot tables — `applications` above all.

**Unindexed foreign keys.** Real; cheap to fix.

**Unused indexes.** Informational only. An index on a table that is rarely queried but
matters when it is (an admin view, a cron) is not dead. Never recommend dropping one
without asking what uses it.

## Output
A short summary per category: how many, how many are known-deliberate, how many are
real. Then the real ones in priority order — state-changing functions reachable by
`anon` first, then RLS performance, then indexes.

End with one line naming the single highest-value fix, and stop. **Propose nothing to
the database itself** — CLAUDE.md rule 1: this is production with live customers, and
every DDL change is the user's call.

## Baseline (2026-09-19)
So drift is visible on the next run. Security: 8 RLS-enabled-no-policy (incl. the
deliberate `app_secrets`), 5 mutable `search_path`, 59 `SECURITY DEFINER` reachable by
`anon`, 93 by `authenticated`, leaked-password protection off. Performance: 7 unindexed
FKs, 2 per-row RLS, 42 multiple-permissive-policies, 3 no-PK, 11 unused indexes.
If a number jumps, something new landed — find out what before doing anything else.

**Fixed 2026-09-19** (migration `20260919_revoke_client_exec_on_admin_rpcs.sql`):
`redistribute_event_managers(text)` and `snapshot_analytics_daily(date)` are no longer
executable by `anon`/`authenticated` — so the anon-reachable count should now read 57,
not 59. A future run seeing 59 again means someone re-granted them.

**Known and accepted:** `attribute_open_application` stays anon-callable because the
open-event flow calls it from the browser before checkout. It can only touch rows whose
status is not `advance_paid`/`fully_paid`, and every affiliate change it makes is
recorded in `application_history`. Do not revoke it — that silently kills creator
attribution. See the handoff note in the migration above.
