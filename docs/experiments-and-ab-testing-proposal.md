# Experiments & Release Tracking — Proposal

*Written 2026-07-06. Companion to `growth-research-proposals.md`. Nothing in here is built yet — this is the plan.*

The goal: know what every feature change actually did to the numbers, measure whether email collection is paying off, and A/B test changes across the site — all visible in one internal tool inside the existing admin panel.

---

## 1. What we already have (the foundation is strong)

- **Behavioral tracking** (`flow_analytics` table): 18 event types cover the whole journey — page view → city → category → plan opened → calendar → date picked → reached pricing → CTA clicked → application started → application submitted, plus open-event form opens and community clicks. Each row carries an anonymous `session_id`, so we can compute "of the people who started X, how many finished Y".
- **Analytics tab** in the admin panel: server-side aggregation (`get_analytics_summary` RPC), invite vs open funnel split, doubt-solved rate, cities/plans breakdowns, CSV export, 24h/week/month/90-day windows.
- **Money truth** lives in `applications` (statuses, `cart_abandoned`, `recovered_at`) and `payu_payments` — independent of the click tracking, so payment metrics are exact.

What's missing is not tracking. It's three things:

1. **Memory** — `flow_analytics` rows are deleted after 90 days (nightly purge, by design, to keep the table fast). Any before/after comparison older than ~3 months becomes impossible. Tracking also only began 2026-06-03, so there is no data from before that.
2. **Context** — nothing records *when* a feature shipped. The git history knows, but the analytics tab doesn't, so numbers and changes can't be lined up.
3. **Experiments** — every visitor sees the same site. There is no way to show half the visitors version A and half version B.

---

## 2. Proof this matters: the form-question example, answered today

Weekly invite-form completion (distinct sessions that submitted ÷ sessions that started), from live data on 2026-07-06:

| Week starting | Started | Submitted | Completion |
|---|---|---|---|
| Jun 8  | 21  | 15 | 71% |
| Jun 15 | 113 | 75 | **66%** |
| Jun 22 | 53  | 34 | 64% |
| Jun 29 | 68  | 39 | **57%** |
| Jul 6 (1 day) | 7 | 4 | 57% |

The remembered "~65%" is real (weeks of Jun 15–22). But after the **single-page form shipped Jun 28** (commit `5588ac1`), completion *fell* to ~57% — the opposite of the expectation. Three lessons the tool must encode:

- **Instinct can be wrong** — measure everything.
- **Small samples lie**: 39/68 has a margin of error around ±12 points, so 57% vs 65% is suggestive, not proof.
- **Changes overlap**: Jul 5 swapped Gender→Email in the same form (`3166070`), so later weeks mix two changes. Release markers are the only way to untangle this.

And the clock is ticking: by late September the June rows are purged and this comparison can never be run again. Layer 2 below fixes that permanently.

---

## 3. The proposal: an "Experiments" tab in the admin panel, in 3 layers

### Layer 1 — Feature Release Log (the "what changed when" diary)

- New table `feature_releases`: `released_at`, `title`, plain-language `description`, `area` (form / payment / email / homepage / …), `expected_effect`, optional `metric` to watch.
- **Backfill from git history** — exact dates already known:
  - 2026-06-03 — conversion-funnel tracking added (data starts here)
  - 2026-06-22 — doubt→invite flow + form-field changes
  - 2026-06-28 — single-page application form (the question reduction)
  - 2026-07-04 — open-event flow + creator affiliate links shipped
  - 2026-07-05 — invite form collects Email instead of Gender
  - 2026-07-06 — Brevo email invites + cart-abandonment emails
- **Auto-log every future push**: a GitHub Action on push-to-`main` inserts one row per commit (title = commit message). The founder edits/annotates it in the tab — zero routine effort, nothing forgotten.
- Every metric chart in the analytics/experiments tabs draws a **vertical marker line per release**, so "the line dipped right when I shipped X" is visible at a glance.

### Layer 2 — Daily metric snapshots (permanent memory)

- Nightly `pg_cron` job writes `analytics_daily`: one small row per event per day — visitors, each funnel-stage count, form starts/submits, applications by status, pay-clicks, paid, abandoned, recovered, emails sent/opened. A few KB per day; kept **forever**.
- Runs on data *before* the 90-day purge touches it, so history is preserved without slowing anything down.
- Powers:
  - custom date-range comparison (any two periods, not just the fixed 24h/week/month windows),
  - a **Before/After view**: pick a release → the tool auto-compares N days before vs N days after on the chosen metric and gives a plain-language verdict: *improved / worsened / too early to tell (need more data)* — with the confidence math done for you.

### Layer 3 — A/B testing engine

- Table `experiments`: name, hypothesis in plain words, variants (A/B, optionally A/B/C), traffic split, start/stop dates, primary metric, status.
- **Assignment**: deterministic hash of the existing `session_id` → variant. Same visitor always sees the same version; no external service, no extra cost, no new consent issues.
- **Exposure logging**: a new `experiment_exposure` event through the existing `trackEvent` pipeline (experiment + variant in meta). Conversion = the already-tracked funnel events, joined by session.
- **Results view**: per-variant funnel with a two-proportion significance test translated to plain English — e.g. *"B converts 64% vs A 57%. 89% confident B is really better — not conclusive yet; ~220 more form starts needed."* Plus a built-in duration estimator shown when creating a test: *"at current traffic this test needs ~3 weeks."*
- Each individual test needs one small code hook at the spot being varied (e.g. `variant('form-headline') === 'B'`), added per test — a ~15-minute change each time, done by Claude on request.

### How self-serve is it? (founder-dependence, honestly)

A true A/B test means two versions of the site exist at once — the second version is by definition code, so no tool fully escapes that (the "no-code" A/B products work by injecting page-rewriting scripts; fragile and $100+/month). Dependence breakdown:

| Kind of question | Needs Claude? |
|---|---|
| "Did feature X (shipped to everyone) move metric Y?" — Before/After view on any auto-logged release | **Never** — fully self-serve |
| Copy/wording tests (headline, CTA label, plan-card text, form intro) | **Once** — key text spots get instrumented one time; after that, unlimited tests created from the panel (type version A, type version B, start) |
| A new feature (e.g. the AI chatbot) | **No extra ask** — any new feature gets built behind an on/off flag with its experiment attached as part of the same build; promote to 100% from the panel when the numbers say so |
| Restructuring existing UI as an A/B test (e.g. calendar before vs after pricing) | **Yes** — ~15-minute hook per test, described in plain English |

Most changes ship to 100% anyway, so the fully-automatic Before/After path covers the majority of "what did this change do?" questions without any experiment code at all.

### Honest guidance on sample size (built into the tool)

Roughly 9k visitors/month, but only ~50–100 form starts/week:

- **Top-of-funnel tests** (homepage copy, plan-card design, pricing display, CTA wording) → thousands of sessions/week → readable in **1–3 weeks**. A/B test these.
- **Deep-funnel changes** (form fields, payment page) → an A/B test could take **2+ months** to be conclusive. For these, ship to 100% and use the Before/After view with release markers instead — that's the statistically honest choice at this traffic level.
- The tool states this up front per test rather than letting an underpowered test run forever.

---

## 4. Email ROI measurement plan

Email shipped 2026-07-05/06, so measurement is mostly forward-looking. Five concrete measures:

1. **Friction check** — weekly form-completion rate after the Gender→Email swap. Field count stayed the same, so friction should be roughly neutral; the daily snapshot will confirm or deny.
2. **Re-engagement payoff** — cart-abandonment **recovery rate**: abandoners messaged via WhatsApp-only (historical cohort) vs WhatsApp+email (from Jul 6 on). `applications` already carries `cart_abandoned`, `recovered_at`, and the email-sent flags, so the cohorts are ready-made.
3. **Invite→paid speed** — median time from invited to advance_paid, before vs after email invites (the conversion-funnel RPC already computes time-to-pay).
4. **Engagement visibility** — add a Brevo **webhook** (delivered/opened/clicked) writing to a small `email_events` table; the tab shows open/click rates per email type. Without this we're blind on whether emails are even opened. Free on Brevo.
5. **The verdict card** — *extra recoveries per 100 abandoners × ticket value* vs the near-zero cost of sending. One number that says "email is/isn't paying off."

---

## 5. Build plan

| Phase | What | Effort |
|---|---|---|
| 1 | `analytics_daily` snapshots + `feature_releases` + git backfill + release markers on existing charts. **Protects history immediately** — do this before late September or the June data is gone. | ~1 session |
| 2 | Experiments tab UI: release-log editor, Before/After comparison view, email-ROI cards + Brevo webhook. | ~1 session |
| 3 | A/B engine (assignment, exposure, results view with significance) + first live test on something high-traffic. | ~1 session + ~15 min per new test |

Everything lives in the existing admin panel + Supabase. No new services, no new monthly costs. Migrations follow the usual versioned-file pattern; edge-function/cron deploys stay owner-approved per the safety rules.
