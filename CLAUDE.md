# chapter அ — Claude Code guide

Mobile-first social-experiences booking webapp (React + Vite + TypeScript, Supabase backend, PayU payments, AiSensy WhatsApp). Deployed from `main`. The owner is a **no-code founder**: explain plans and tradeoffs in plain language; never assume they can edit code or config themselves.

## Golden safety rules
1. **The Supabase DB is PRODUCTION with live customers.** For test rows use phone `90000000xx`, verify writes with `RETURNING`, and delete test rows afterwards. Never mutate rows whose status is `advance_paid`/`fully_paid` without explicit instruction — guard UPDATEs with `status not in ('advance_paid','fully_paid')`.
2. **Pushing to `main` deploys the live site.** Never `git push` without the user's explicit go-ahead in that conversation turn.
3. **Never deploy edge functions** (CLI or MCP) — the user deploys, or grants one-off approval.
4. **Deploy hold:** none active — the open-event batch (`src/App.tsx`, `src/AppFlow.tsx`, `src/PaymentOverlay.tsx`, `supabase/functions/payu-callback`, `supabase/functions/cart-abandonment`) was shipped on 2026-07-05. Still prefer isolated, one-concern commits and verify with `git status --short` before and after committing. If a new hold is put in place, record its file list and "active" status here.
5. Local `npm run dev` talks to PROD Supabase — UI testing creates real rows and real admin notifications.

## File map (large files — read targeted line ranges, never whole files)
- `src/App.tsx` (~5.4k lines): homepage, INVITE-only flow, `PayUReturnScreen` (payment success/failed/receipt + retry bill), routing shell.
- `src/AppFlow.tsx` (~5.2k lines): `/plans` chat UI, event details overlay + calendar sheet, OPEN-event booking flow.
- `src/AdminPanel.tsx` (~6.6k lines): admin + marketer dashboards — People tab, event/timeline editors, marketer cards.
- `src/CreatorOnboardingDemos.tsx`: schematic replicas of the creator dashboard/booking surfaces; refresh this file whenever those live surfaces change.
- `src/PaymentOverlay.tsx`: shared PayU bill page (`NativePaymentOverlay`) used by both flows.
- `src/supabase.ts`: fetchers/mappers. **`Event.id` = `events.slug`.**
- `src/JourneyMap.tsx` + `src/journeyMapSeeds.ts`: admin "Map" tab — React Flow user-journey maps backed by `journey_maps` (is_admin RLS). Seeds file = "Reset map" baseline; when a flow changes, refresh the matching seed nodes. Dev preview without login: `npm run dev` + `/admin?mapdev`.
- `src/ProductRoadmap.tsx` + `src/TodoCard.tsx`: feature tracker + standalone to-do list below the Map tab (strict-admin only — ops can't see it). Roadmap = `roadmap_features` with 3 statuses only (`building` = In Progress, `live_test` = Need Testing, `complete`); the older `roadmap_tasks`/`roadmap_test_runs` tables still exist in the DB but are no longer read by the UI. Loose to-dos live in `product_todos` (strict-admin RLS, rendered by `TodoCard`). Every push to `main` still auto-creates a "Need Testing" card via the `feature_releases` trigger `sync_release_to_roadmap()` (release log → roadmap; dedup by release_id + exact title; no checklist task is created anymore).
- `supabase/functions/`: `create-payu-order` (server-trusted pricing + open-event payment gate), `payu-callback` (flips application status, fires WhatsApp, redirects), `payu-webhook`, `cart-abandonment` (30-min cron), `get-user-context` (phone → invites/applications/**doubts**/receipt, RLS bypass), `open-event-otp` (WhatsApp + email OTP for open-event bookings), `retarget-check`.

## Domain facts
- `events.booking_url`: `native-application` = invite-only · `payu-hosted` = open event · community events use `booking_flow='whatsapp'`. `booking_flow` is NOT NULL, CHECK (`payment`|`whatsapp`).
- `events.payment_mode`: `split` (advance + balance) | `full` (single payment → `fully_paid` directly).
- `applications.status`: `pending → invited → advance_paid → fully_paid` (+ `waitlist`/`rejected`). Open events have no approval: `pending` = "in progress". Display-only flags: `cart_abandoned`, `re_target`; `recovered_at` = paid after abandoning (badge, not a status).
- Unique key `applications(event_slug, phone)`; phones stored as last-10-digits.
- Per-date timelines: `event_dates.booking_steps` (JSONB, canonical 5 steps; index 2 = balance step, index 3 = meeting-spot step). Always prefer the applicant's `selected_date` steps over event-level fallback.
- RLS: anon cannot SELECT `applications`/`invited_numbers`/`invite_payment_submissions` — use `get-user-context` or the `event_booking_counts(_by_date)` RPCs.
- Marketers: `event_marketers` maps events→marketers; round-robin assignment trigger on application INSERT; commission accrues on `fully_paid`. Copied events inherit marketer mappings.
- Open-event payment gate (`create-payu-order`): a NEW open-event ticket requires a verified `open_event_otp_sessions` token, EXCEPT two deliberate skips — a prior `payu_payments` row for this event+phone (failed-attempt **recovery** deeplink) or a matching `doubt_submissions` row (event + phone + email). An existing `applications` row is intentionally NOT accepted as proof (anon can self-INSERT a `pending` row). Balance payments never re-OTP. OTP rate limits are per-channel: WhatsApp 2/10min keyed by phone, email 2/10min keyed by email (email fallback also needs a valid prior WhatsApp session).

## Verification
- After every code edit: `npx tsc --noEmit` must pass.
- Preview server: launch.json "Vite Dev Server" (port 3000). Admin/marketer views sit behind login — not drivable in preview; verify those via tsc + SQL simulation instead.
- For DB changes: show the user exactly what changed (`RETURNING`), and re-check with a SELECT.

## Workflow preferences
- One concern per commit; commit messages explain the *why*.
- Ask before anything irreversible or outward-facing (pushes, deletes of non-test data, deploys).
- On "continue where you left off": consult the auto-memory note `open-event-flow-design` first instead of re-exploring code.
