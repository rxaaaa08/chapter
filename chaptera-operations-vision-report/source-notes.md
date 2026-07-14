# Chaptera operations vision — source notes

Reviewed on July 12, 2026.

## Decision frame

The goal is to identify technically ambitious features that reduce manual coordination, operational misses, founder dependency, and recovery time. Ideas are evaluated for fit with the existing React + Vite + TypeScript frontend and Supabase/Postgres/Edge Functions/pg_cron backend, with PayU, AiSensy WhatsApp, Brevo email, web push, and PWA capabilities already present.

## Implemented foundation observed in the repository

- Daily analytics snapshots and experiment/release tracking: `supabase/migrations/20260708_analytics_daily.sql`, `supabase/migrations/20260708_experiments_daily_rpc.sql`, `src/AdminPanel.tsx`.
- Daily Manager rule engine, alerts, briefings, 6pm cron, push delivery, and founder-editable rules: `supabase/migrations/20260712120000_daily_manager.sql`, `src/ManagerPanel.tsx`.
- Multi-marketer assignment, commission ledger, performance views, and per-event allocation: `supabase/migrations/20260617_marketers_schema.sql`, `supabase/migrations/20260617_marketers_functions_and_triggers.sql`, `multi-marketer.md`.
- Affiliate clicks, sales, creator dashboard, and attribution-aware performance: `supabase/migrations/20260704_affiliates_schema.sql`, `src/CreatorDashboard.tsx`, `src/AdminPanel.tsx`.
- Product roadmap, release-to-roadmap sync, standalone to-dos, and journey maps: `src/ProductRoadmap.tsx`, `src/JourneyMap.tsx`, `supabase/migrations/20260711_journey_maps.sql`.
- Payment recovery, abandonment, OTP, retargeting, WhatsApp/email, push, and payment verification edge functions: `supabase/functions/`, current migrations, and `CLAUDE.md`.

## Proposal set reviewed

- `ai-chatbot.md`
- `agentic-systems-proposal.md`
- `daily-manager-proposal.md`
- `dynamic-pricing-proposal.md`
- `referrals-discounts-group-offers-blueprint.md`
- `growth-research-proposals.md`
- `experiments-and-ab-testing-proposal.md`
- `operations-improvement-proposal.md`
- `analytics-additions-proposal.md`
- `HANDOFF.md`
- `CLAUDE.md`

## Prioritization rubric

Each concept receives a judgment score from 0 to 10. The score is not measured business performance and should not be read as statistical evidence.

- 35% operational hours removed or prevented.
- 25% fit with existing data and infrastructure.
- 20% reduction in revenue, safety, or service failures.
- 10% compounding data advantage.
- 10% implementation and governance feasibility.

The scores assume the current repository state, no native mobile app, no autonomous AI authority over money or outbound customer messaging, and continued use of Supabase as the system of record.

## Chart map

- Section: What deserves priority.
- Question: Which proposed systems combine the most operational leverage with the best fit and acceptable risk?
- Family: comparison and ranking.
- Type: horizontal bar.
- Fields: concept, score, horizon, primary leverage.
- Takeaway: the real-time operations case system and payment reconciliation layer should precede predictive and highly experimental systems.
- Palette: single-root preferred; no legend because the category axis already names each concept.

## Important caveats

- No production database metrics were queried for this strategy pass, so impact sizes are directional.
- Forecasting and matching ideas need enough completed-event history to validate reliably.
- AI is recommended only for summarization, classification, simulation, and drafting. Status changes, payments, refunds, pricing, and outbound sends remain deterministic or require explicit human approval.
- The exact build sequence should be adjusted after measuring current weekly case volume and founder/marketer minutes per workflow.

