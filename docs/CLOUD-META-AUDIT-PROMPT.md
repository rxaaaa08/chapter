# Cloud Meta audit — the prompt (drafted 2026-09-24, two-part version)

Paste everything inside the fence into a Claude Code **cloud** session on repo
`rxaaaa08/chapter`, branch `cloud/meta-audit`, with the session model set to
**Fable 5.1**. Environment: network "Trusted", NO environment variables (no
secrets — the audit is code + docs only; live checks happen locally afterwards).

Doc sets on the branch since 3ca17f3 (2026-09-24): guides, api-reference, conversions-api, pixel, developer-docs-html, extra-pages-html.

Two jobs, owner-stated 2026-09-24: **Part A** checks that what's built is set up
perfectly; **Part B** explores what Meta documents that we haven't built but
could use. They produce two separate reports so a "nice idea" can never be
mistaken for a defect.

Design mirrors OpenClaw (`OPENCLAW-HANDOFF.md` §2): strong manager, plan review
before work, cheap parallel researchers, a stronger verifier whose job is to
disprove. Lessons carried over: sub-agents start cold, so every brief repeats the
rules (OpenClaw trap: workers with no AGENTS.md ran blind); progress is written
to a file and pushed so a crash or context reset loses nothing (OpenClaw's
resume checkpoint lost the M1–M13 pointers); every finding needs BOTH halves of
evidence (our code line + the doc line).

```
You are the MANAGER of a multi-agent research project on our Meta integration. Budget is not a concern — thoroughness is. Take as long as you need. There are TWO jobs:

PART A — AUDIT: check that everything we have built is set up perfectly, against Meta's own documentation.
PART B — OPPORTUNITIES: explore what Meta's developer docs describe that we have NOT built yet but could be genuinely useful for our business.

Keep them strictly separate: Part A finds defects in what exists; Part B proposes new things. They go into two different reports.

## Our business (every agent needs this)
chapter அ is a curated social-experiences club in India: small group meetups and trips people book and pay for online (invite-only events with approval, and open events anyone can book). Mobile-first web app (React + Vite), Supabase backend, PayU payments, WhatsApp messaging. India-only customers. Volume is small today (~6–12 ticket purchases a month) but the owner builds for 50x scale — small volume is never a reason to skip a finding or dismiss an idea; it is only a caveat on reading data. Brand direction: a curated lifestyle club with a small number of plans (max ~10–12), never white-label or franchise. Meta ads are being prepared but have not been scaled yet.

## Where things are
- Browser Pixel: src/metaPixel.ts and every trackEvent / fbq call site in src/ (App.tsx, AppFlow.tsx, PaymentOverlay.tsx are huge — grep, then read line ranges).
- Conversions API: supabase/functions/_shared/metaCapi.ts and its importers (re-derive with grep -rl "_shared/metaCapi" supabase/functions/).
- Marketing API: meta-ads-sync, meta-insights-features, meta-ads-alerts, meta-ads-webhook, meta-audience-sync, meta-catalog-feed, meta-signal-watchdog, adlib-probe, retarget-check, and the Growth ▸ Ads panel in src/AdminPanel.tsx.
- SQL in supabase/migrations/ (the folder is BEHIND the live database — say "per migrations", never "the database does").
- Docs, all under docs/meta-marketing-api/: guides/ and api-reference/ (Marketing API, start each with its README.md), conversions-api/ (Conversions API), pixel/ (Meta Pixel), developer-docs-html/ and extra-pages-html/ (saved developer pages as HTML: dedup, advanced matching, rate limits, Dataset Quality API, lead ads, click-to-WhatsApp, Threads/Instagram ads, error codes).

## Read first (you, before planning)
CLAUDE.md, META-AUDIT-CONTEXT.md (all of it), then the table of contents and relevant sections of META-ADS-HANDOFF.md (7,000+ lines — skim headings). These record what is built, what was decided, and what was already considered and REJECTED by the owner. If an audit finding matches a settled entry, record one line "CONFIRMS-KNOWN: <id>" and move on. If an opportunity was already rejected or decided in those files (for example: the Meta jobs run once a day by choice; Meta receives the full ticket value at the advance payment by decision; split tests on Purchase were found infeasible at our volume), do not re-propose it — list it under "Already considered" with the file reference. If the code contradicts a settled entry, that IS a finding.

## Team (use the Agent tool)
- RESEARCHERS: model "sonnet". Many, in parallel, one per area. Each gets a self-contained brief (they cannot see this conversation).
- VERIFIER: model "opus". Its job is to DISPROVE — for Part A, prove the defect isn't real; for Part B, prove the opportunity doesn't apply to us.
- PLAN REVIEWER: model "opus", used once, before research starts, covering both parts.
You plan, brief, merge, decide, and write both reports. Delegate the bulk reading.

## Phases
1. INVENTORY. One researcher builds a map of what we have: every Meta endpoint, field, event name and parameter our code uses (file:line each), and a map of the docs (every guide/reference section, one line each on what it covers). Both parts plan from this.

2. PLAN.
   Part A areas (suggested): (a) Pixel events/params/advanced matching/autoConfig, (b) CAPI payload: user_data, custom_data, event_id/dedup with the Pixel, action_source, event_time, event_source_url, (c) CAPI transport: batching, retries, error handling, test_event_code, API version, token use, (d) ads/insights sync: fields, breakdowns, attribution settings, pagination, async reports, rate limits, error subcodes, deleted/archived objects, (e) custom audiences: hashing, schema, batching, size limits, exclusions, (f) catalog feed: required fields, formats, availability/price rules, (g) webhooks: verification, X-Hub-Signature-256, subscriptions, (h) alerts/watchdog/guardrails vs what the API actually returns, (i) cross-cutting: API version consistency, deprecations, docs recommendations we never follow.
   Part B areas: split the docs map into 5–8 themes (for example: audiences & lookalikes, catalogs & dynamic/Advantage+ catalog ads, conversion optimisation & offline/other event sources, measurement & experiments, creative & automation APIs, rules/automation & budget control, lead/messaging ads, reporting & insights not yet used). Each Part B researcher reads its docs thoroughly and lists capabilities we don't use.
   Send the full plan to the PLAN REVIEWER: what's missing, what's mis-scoped, which question would we regret not asking. Record AGREED/DISAGREED per point and adjust.

3. PROGRESS FILE. Create CLOUD-META-AUDIT-PROGRESS.md with the plan and a status line per area. Update it after every phase; commit and push it to cloud/meta-audit after each phase so nothing is lost if the session dies. If you are resumed, read this file first.

4. RESEARCH (both parts in parallel).
   Part A researchers return CANDIDATE defects: claim; our code (file:line + quoted line); the doc (path + quoted passage); why they conflict; suggested severity. No evidence on both sides = not a finding. Also "checked, fine" items with the same citations. After round one, send a second round at anything thin, plus one doc-first sweep over the docs' requirements/best-practice pages.
   Part B researchers return CANDIDATE opportunities: what the capability is (plain English); the doc (path + quoted passage); proof we don't already have it (what they grepped for, and where the nearest existing code is); how it would help THIS business specifically; prerequisites (permissions, App Review, account features, minimum volumes, India availability, cost); rough build size (small/medium/large) and which existing files/functions it would touch.

5. VERIFY. Send every candidate (batches of ~5) to the VERIFIER with its evidence. It opens the cited lines itself.
   Part A: tries to show the defect isn't real (handled elsewhere, doc applies to a different product/version, settled in META-AUDIT-CONTEXT.md, dead code). Verdict CONFIRMED / DISPROVED / UNCERTAIN.
   Part B: tries to show the opportunity doesn't apply (already built under another name, needs volume/permissions we can't get, not available in India or for our account type, deprecated, already rejected in the handoff docs, conflicts with the brand direction). Verdict VIABLE / NOT VIABLE / NEEDS-OWNER-INPUT.
   Only CONFIRMED/UNCERTAIN (A) and VIABLE/NEEDS-OWNER-INPUT (B) go in the main reports; the rest go in appendices, one line each with the reason.

6. REPORTS. Write both files (formats below). Commit and push.

## Rules for EVERY agent — paste these into every brief
- Read-only. Never edit app code. Never deploy, never touch any database or any Meta/Supabase/PayU endpoint, never run curl against production. Don't use any credentials, even if you find them.
- Only the manager writes files, and only CLOUD-META-AUDIT.md, CLOUD-META-OPPORTUNITIES.md and CLOUD-META-AUDIT-PROGRESS.md.
- Never push to main. Only push to cloud/meta-audit. Never force-push, never rewrite history.
- Cite exact file:line and quote the line; cite the exact doc file and quote the passage. Line numbers must come from actually reading the file, not memory.
- The business facts above apply. Small volume is never a reason to skip something.
- Big files (App.tsx ~5.4k lines, AppFlow.tsx ~5.2k, AdminPanel.tsx ~6.6k, META-ADS-HANDOFF.md ~7.3k): grep first, then read ranges.

## Report 1 — CLOUD-META-AUDIT.md (Part A)
Top: plain-English summary for a non-technical founder (what's solid, what's broken, what to fix first) and counts by severity.
One entry per finding: ID, title, severity (HIGH = we lose or corrupt conversion/spend data or could break payments/ads; MEDIUM = weaker matching/optimisation or a latent failure; LOW = hygiene/future-proofing), verifier verdict; what's wrong in plain English (2–4 sentences, no jargon); evidence (our code file:line + quote, the doc path + quote); suggested fix (described, not applied) and what it would touch, including which edge functions would need redeploying.
Then: "Checked and fine" (with citations), "CONFIRMS-KNOWN" lines, "Disproved candidates" appendix, and "What this audit could NOT check" (anything needing live data — give the exact live check to run locally).

## Report 2 — CLOUD-META-OPPORTUNITIES.md (Part B)
Top: plain-English summary — the 3–5 opportunities most worth the owner's attention and why, in order.
One entry per opportunity: ID, name, verifier verdict; what it is (plain English); why it would help us specifically; what we'd need first (prerequisites, permissions, volume, cost); build size and what it would touch; doc citation (path + quote); proof we don't have it yet; risks or reasons to wait. Rank by value to this business, not by how interesting it is.
Then: "Already built" (capabilities found in docs that we already cover, with file refs), "Already considered" (previously decided/rejected, with handoff refs), and "Not viable" appendix (one line each with the reason).
Do NOT include launch advice or "next step: run ads" nudges — the owner sets the pace.

## Finally
In CLOUD-META-AUDIT.md add a team log: number of researchers run, plan-review AGREED/DISAGREED counts, verifier verdict counts for both parts.
Commit only the three files named above, push to cloud/meta-audit, and tell me the commit hash.
```

## Follow-up prompt: fixing the findings in the same cloud session (owner's plan, 2026-09-24)

The owner wants the audit session itself to fix what it finds. Consequences:
`cloud/meta-audit` now carries code that must reach `main`, but its docs commits
must NOT (owner: docs never go live). So only the fix commits are carried over to
`main`, by cherry-pick, in a local session. The cloud has no keys, so nothing it
fixes is live until the edited edge functions are deployed from here (with the
`--no-verify-jwt` rules in CLAUDE.md, and every `_shared/metaCapi.ts` importer
redeployed together). The refactor of the three big files is deliberately started
AFTER these fixes land, from a branch that includes them, so the two never collide.

```
Now fix the CONFIRMED findings in CLOUD-META-AUDIT.md. Rules:
- One finding per commit. Message starts with the finding ID and says why.
- Behaviour changes only where the finding requires them; no unrelated tidying, no refactoring, no renames.
- After each fix: npx tsc --noEmit and npm run build must pass. The Opus verifier reviews every fix commit before the next one, checking it fixes exactly the finding and nothing else.
- Payment-path functions (create-payu-order, payu-callback, payu-webhook, verify-pending-payments): fix only if the finding is HIGH, keep the change minimal, and mark the commit PAYMENT-PATH.
- Never touch docs/, never push to main, never force-push, never deploy, no credentials, no network calls to Meta/Supabase/PayU.
- UNCERTAIN findings and anything that needs the owner's decision: do NOT fix; list them.
- At the end, add a "Fixes applied" section to CLOUD-META-AUDIT.md: finding ID → commit hash → files changed → which edge functions must be redeployed for it to go live (note: editing supabase/functions/_shared/* means redeploying EVERY importer) → what to check live afterwards.
Push to cloud/meta-audit and give me the list of fix commit hashes.
```
