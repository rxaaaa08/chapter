# TRACKING-AUDIT-CONTEXT.md: what an auditor of the website's own tracking cannot learn from the code

Written 2026-09-28 for the OpenClaw `tracking-audit` job, the audit of the site's own analytics and of **Growth** in the admin panel. It follows the same pattern as `docs/META-AUDIT-CONTEXT.md`. A read-only auditor sees code but not the database, the live site or the owner's decisions. This file holds the three things the code cannot tell it.

**The rule it carries:**
- A finding that **matches** a settled entry below is reported as one line, `CONFIRMS-KNOWN: <id>`, and costs no verifier turn.
- A finding that **contradicts** one is a real finding. Report it in full and name the entry it contradicts.
- **Whoever settles a new finding adds it here in the same session, with the measurement behind it.** An entry with no evidence behind it silences a check without earning it.

---

## 1. Settled decisions: decided, not open

| id | Decision | Why / evidence |
|---|---|---|
| T1 | **Three browser ids, never unified.** `ca_session_id` (sessionStorage, dies with the tab) = one visit, used for funnels. The attribution object (per visit, captured off the landing URL) = which ad or link brought this visit. `ca_visitor_id` (localStorage, survives visits) = the same person across visits, used for A/B assignment only. | They answer three different questions. Unifying them either re-rolls A/B variants per visit or credits ads with visits they did not cause. `src/supabase.ts` getSessionId/getVisitorId comments; `src/experiments.ts:16`. |
| T2 | **Open-event funnel rates divide like units.** Sessions ÷ sessions (`reached_pricing`, CTA taps, `details_form_opened`/`_submitted`), phones ÷ phones (OTP requested/verified), and booking rows ÷ booking rows (details submitted, paid, abandoned, recovered). | Mixing units broke three rates before 2026-08-07. A returning abandoner adds a session but never a second booking row. |
| T3 | **"Contact Us" belongs in every CTA denominator.** It is in Pricing Conversion and Form Open Rate. | That path reaches the same booking form. Leaving it out puts people in a numerator who were never in the denominator (a rate could exceed 100%). |
| T4 | **A new funnel stage is blanked until it has history.** `get_analytics_summary` returns `stage_first_seen` + `since`, and the UI shows "not measured yet" for any rate whose stage first appeared after the window start. | Without it, a new ping reads as a confident 0% (what produced "0 of 41" before). |
| T5 | **An event is matched by slug OR uuid OR title.** A `flow_analytics.event_id` row is resolved to an event by `events.slug`, `events.id::text`, or `lower(event_title) = lower(events.title)`. `analytics_daily.event_id` holds the **UUID**. | Copied events leave old `-copy-…` slugs behind; only the title is stable. A slug-only join silently misses most rows (382 caught vs 661 missed on 2026-07-21). |
| T6 | **`flow_analytics` keeps 90 days on purpose** (cron `purge_flow_analytics`, 03:17 UTC daily). `analytics_daily` is the purge-proof daily snapshot (cron `snapshot_analytics_daily`, 02:35 UTC = 08:05 IST, for the previous IST day). | Storage on the free tier. The Experiments pill reads the snapshot, never the raw table, so history survives the purge. |
| T7 | **Attribution is per visit, by design.** A visitor who returns days later with a bare URL is NOT credited to the old ad. | The owner prefers under-crediting paid traffic to inventing conversions. |
| T8 | **The open-event Payment Rate / Cart Abandonment / Recovery block is computed from `applications` (+ `payu_payments`, `bill_opens`), not from `flow_analytics`.** | Deleting analytics rows never changes those numbers. |
| T9 | **Every Growth RPC is founder-gated by `is_admin_strict()`** and returns NULL (not an error, not empty) to anyone else. The UI distinguishes "NULL = not you" from "empty report". | Ops staff share the admin panel but must not see business numbers. |
| T10 | **The Supabase API returns at most 1,000 rows per request, silently.** That includes set-returning RPCs. Counting must happen in SQL, returning one jsonb value. | Verified 2026-09-10 (HTTP 206, `0-999/1500`). A browser-side count over a table read is a real finding if the table can pass 1,000 rows. |
| T11 | **Site experiments have three deliberate guards:** an SRM check (chi-square, p<0.001 ⇒ INVALID, no winner), a fixed horizon (`target_exposures_per_variant`, `ready:false` until reached), and a one-way status ladder draft→running→stopped with **no restart**. Exposure writes use a plain `.insert()` and treat `23505` as success. **Never `.upsert()`**: anon has no UPDATE, so upsert fails RLS. | Each guard stops one specific wrong conclusion. The project has already been burned by peeking (p=0.047 on a third look). |
| T12 | **Growth ▸ Ads windows differ on purpose.** Spend/funnel follow the 7/30/90 selector. Plan budgets use 90 days fixed. The recommendation scorecard uses 14 days. | Conversion rates need the longest history, spend needs the selected window. Commented in `AdminPanel.tsx` loadMetaAds. |
| T13 | **The Meta side of Ads is out of scope.** It was audited 2026-09-24→26 (`docs/CLOUD-META-AUDIT.md`), and its settled items are in `docs/META-AUDIT-CONTEXT.md`. This audit checks only that the Ads pill **displays** what its RPCs return, correctly labelled. | Avoid re-auditing code fixed the day before. |
| T14 | **IST (Asia/Kolkata) calendar days** for every daily bucket and every Ads date range. The Analytics windows are rolling hours back from "now" (24h / 7d / 30d / 90d), not calendar days. | Both are intentional; a mismatch *between* the two is not a bug by itself. |
| T15 | **Build-test phones are known pollution.** `8888888888`, `9999999990`, and `9000000xxx` from 9–11 Jul 2026 sit in `open_event_otp_sessions`, which the test-data purger does not clean. That pollutes Verification Rate on the 90-day window only. | Known since 2026-08-07; read Verification Rate on week/month. Report it only if it now affects a shorter window. |

## 2. Production facts the code does not state

- **Traffic:** Growth showed **228 unique sessions** for the week to 2026-09-27. Roughly **15–60 ticket purchases a month**, depending on the event calendar (paid website bookings June 39, July 16, August 59, September to 29th 13; measured 2026-09-29, `docs/PURCHASE-SOURCE-AUDIT-2026-09-29.md`). Every sale so far came from organic Instagram; no ad money spent yet. (Corrected 2026-09-29: an older "6–12" figure was stale.) India-only, almost all Chennai (99% of city picks last week). No mobile app. Small samples are a caveat on reading a rate, **never** an argument against fixing the pipe that fills it (the owner builds for 50× the volume).
- **THE LIVE SITE IS NOT THE CODE YOU ARE READING.** chaptera.in is built from `origin/main` (`a900ed3`). The project copy is the local working tree: **38 commits ahead plus uncommitted edits**, and nothing is pushed until the owner says so. Therefore:
  - **Every row in the database was written by the LIVE code**, saved in the evidence pack under `07-live-site-code/`.
  - **The Growth tab text in `06-display/` was captured from the LOCAL build** (localhost), i.e. what ships next.
  - Tracking that exists only locally, and so is **absent from the data**: `flow_analytics.visitor_id` (A/B assignment, commit be97bff), `flow_analytics.attribution` (commit 4172411), the direct-plan-view + calendar de-duplication fix (404784c), and all of `src/experiments.ts`. **In the data profile, `visitor_id` and `attribution` are 100% NULL. That is expected, not a finding.** The finding-worthy question is whether the local code will fill them correctly once shipped.
  - Database functions are ahead of both. Many RPCs are live in production while the client that calls them is not pushed.
- **`supabase/migrations/` is BEHIND the live database** (273 applied migrations vs ~190 files, 2026-09-21). Never judge a function from the migrations folder. Use `01-live-functions/` in the evidence pack, which is the live definition dumped 2026-09-27.
- **Two `flow_analytics` event names are legacy pairs that fire together by design:** `book_clicked` beside `book_cta_clicked`, and `contact_clicked` beside `contact_cta_clicked`. The `*_cta_*` names are what the RPCs count. Check this rather than trusting it: if a calculation counts BOTH names of a pair, that double-counts.
- **Test rows.** Staff testing uses phones `90000000xx`. Local `npm run dev` writes real rows to production, so some `flow_analytics` rows come from developers' own browsers, with no marker to separate them.

## 3. The evidence pack, and its limits

Location: `/Users/krutesh/OpenClaw-Workspace/evidence/tracking-2026-09-28/` (outside the project copy, so a refresh never deletes it). Read `00-README.md` there first. It was captured read-only on 2026-09-27 between 18:49 and 19:02 UTC.

- **The RPC outputs (`05`) and the screen text (`06`) were captured ~7 minutes apart**, and the Analytics windows are rolling "now minus N hours". A difference of **1–2 in a count on the 24-hour window** between the two is timing, not a bug. On the week, month and 90-day windows they should agree exactly.
- Aggregates only: no phone numbers, names or emails. So a finding that needs per-person rows is **UNCERTAIN — needs a live query**. Say which query, and an interactive session will run it.
- Nothing in the pack shows the **live** admin panel (the owner's production view), which runs `origin/main`'s `AdminPanel.tsx`.

## 4. Keeping this file true

Update it in the same session as any change to tracking, the Growth tab, or a decision above. Record the date and the measurement.

## 5. Outcome of the 2026-09-28 audit — live checks run by `/openclaw-fixes` (2026-09-28)

Report: `~/.openclaw/workspace/reports/2026-09-28-tracking-audit.md`. OpenClaw could not run queries, so every UNCERTAIN item and the incidence of each "path exists" finding was settled here, read-only, against production. **Measured numbers, so a later audit can tell what has gone stale:**

- **C1 ("Ready to book" misses the counted CTA) — CLOSED, not real.** Code: every route to `handleReadyToBook` (`AppFlow.tsx` SHOW_FAQ button) passes through the calendar's `book_cta_clicked` or `contact_cta_clicked` first, and the funnel counts *sessions* with any of the three `*_cta_clicked` names. Data, 90 days to 2026-09-28: **538 sessions fired `book_clicked`; 0 of them lacked a counted CTA.** Re-open only if a new entry to the FAQ step is added that skips the calendar buttons.
- **S1 (`get_conversion_funnel` has no founder gate) — CONFIRMED live.** `SECURITY DEFINER`, no `is_admin_strict()`, `authenticated` may EXECUTE (anon may not). Returns aggregate counts only (pricing sessions, applied/approved/paid counts, median hours to pay) — no personal data. Sibling `get_analytics_summary` uses `CASE WHEN is_admin_strict() THEN … END`.
- **S6 (late-confirmed payments missing from saved history) — path real, incidence ZERO.** Recount of `payments_success` per IST day × event vs `analytics_daily`, 2026-04-25…2026-09-26: **no day under-counts.** Totals 165 raw vs 166 saved; the one extra is 2026-08-15, event `67baa450…`, a saved payment whose raw row no longer exists (removed or re-statused later) — the opposite of the S6 failure.
- **Title-fallback ambiguity — CLOSED.** 90 days: 3 source rows used title fallback, **0 ambiguous**; no two events share a title today. Re-check if an event is copied without renaming.
- **Guardrail 1,000-row cap — not reachable at foreseeable scale.** `meta_ad_guardrail_breaches()` groups by ad, so rows ≈ enabled rules (6) × breaching ads; 1,000 would need ~170 ads breaching at once. 0 breaches, 0 ads today.
- **TRUNCATE grants — CONFIRMED, project-wide.** `anon` and `authenticated` hold TRUNCATE on **every** public table (Supabase's default grants; `application_events` is the one table already revoked). PostgREST has no TRUNCATE verb, so no browser route was found; it is defence-in-depth hygiene, not an open hole. Not tested by executing TRUNCATE, deliberately.
- **Confirmed in today's code, not yet decided:** E10 (Experiments ratio chart capped at 100%, so 650% plots at y≈−982, clipped — `AdminPanel.tsx` `yMax`), E01 (hardcoded "203 weeks"), E09 (hardcoded 21.6% / 8.5% empty-state), C4 (`getSessionId` in `supabase.ts` throws if sessionStorage is blocked and the event is dropped), D1/D3 ("not allowed" returns look like empty data). E01/E09/E10 are in the local, unpushed Growth code.
- **S2 (anyone can insert analytics events)** is a design trade-off for anonymous measurement, not a defect; owner decision.

### 5a. Fixes the owner picked, same day (2026-09-28)

Owner chose: S1, C4, E10, E01+E09, and the TRUNCATE revoke. Declined for now: D1/D3 (only the founder sees those reports), S2 (design trade-off), re-snapshotting the last 3 days for S6 (zero incidence).

- **S1 — LIVE in the database** (migration `20260928_conversion_funnel_founder_gate.sql`). Before: a fake non-admin JWT read `{applied:22, advance_paid:16, fully_paid:4, reached_pricing:161…}`. After: the same call returns NULL; a founder JWT, and the owner's real session through the app's own client on localhost, still get the full object. The Analytics tab tolerates NULL (`loadAnalytics`), and nothing else calls it.
- **TRUNCATE — LIVE in the database** (migration `20260928_revoke_truncate_from_client_roles.sql`). Before 62 (anon) / 63 (authenticated) tables; after 0 / 0; service_role keeps all 90; anon still reads events (5) and event_dates (15). Default privileges for `postgres` no longer hand it out. `supabase_admin`'s default ACL still does (not ours to alter), so re-check grants after new tables.
- **C4 — code only, NOT pushed** (`src/supabase.ts` `getSessionId`): sessionStorage → in-memory fallback. Tested on the real function text with a storage that throws: before = throws (event dropped); after = returns a stable id across calls. Only reaches customers once pushed.
- **E10 — code only, NOT pushed** (`AdminPanel.tsx` Experiments `yMax`): ratio axis grows to the next hundred above 100%, plus a one-line "above 100% is real" note. Verified rendered via agent-browser: Payments ÷ invites weekly, 13 points, 0 outside the chart, 650% week at y≈43, axis 0–700%.
- **E01 — code only, NOT pushed**: sentence now reads live from `get_experiment_feasibility`. Rendered 2026-09-28: "298 sessions a week … paid tickets … about 163 weeks … opening the calendar … about 6 weeks".
- **E09 — code only, NOT pushed**: empty-state rates now live. **Not seen rendered**: it only shows when there are no site experiments, and one draft exists. Type-checked only.
