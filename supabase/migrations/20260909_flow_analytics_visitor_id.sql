-- flow_analytics.visitor_id — the join key that makes an experiment readable.
--
-- WHY A SECOND ID WHEN session_id ALREADY EXISTS
-- `ca_session_id` lives in sessionStorage and dies with the tab. That is the
-- right lifetime for a funnel step ("what happened in this visit") and the
-- WRONG one for an experiment, which has to follow one person across visits or
-- it is measuring nothing. See the long note in 20260909_site_experiments.sql,
-- GUARD 1.
--
-- Concretely, without this column: a visitor lands on Monday and is assigned
-- variant B, comes back on Thursday and books. Thursday is a new session id, so
-- joining conversions on session_id credits that booking to nobody. Returning
-- visitors are exactly the population a booking funnel converts, so the effect
-- is not a rounding error — it is a systematic loss of the conversions that
-- matter most.
--
-- WHY NOW, WITH NO EXPERIMENT RUNNING
-- Because this cannot be backfilled. A funnel row written today without a
-- visitor id can never be attached to a person later; the information simply
-- was not captured. Same reasoning as the ad-id parameter: the column goes in
-- before the traffic, not after.
--
-- NULLABLE, AND STAYS NULLABLE. Rows written before the client ships have no
-- visitor id and never will, and a visitor who blocks localStorage will keep
-- writing NULLs forever. NULL here means "not identifiable across sessions",
-- which is a real answer. get_experiment_results reports whether ANY row
-- carries one (`client_stamping_live`) precisely so an empty result is not
-- mistaken for a measured zero.

alter table public.flow_analytics
  add column if not exists visitor_id uuid;

comment on column public.flow_analytics.visitor_id is
  'Persistent per-browser id from localStorage, used to join funnel events to experiment_exposures across sessions. NULL = written before the client stamped it, or localStorage unavailable. Distinct from session_id (sessionStorage, per-visit) on purpose — do not unify them.';

-- Partial: the overwhelming majority of historical rows are NULL and will stay
-- that way, and an experiment only ever queries the non-null side. Indexing the
-- NULLs would be a large index of one repeated value.
create index if not exists flow_analytics_visitor_id_idx
  on public.flow_analytics (visitor_id)
  where visitor_id is not null;

-- The results function joins visitor_id together with event_type and time.
create index if not exists flow_analytics_visitor_event_idx
  on public.flow_analytics (visitor_id, event_type, created_at)
  where visitor_id is not null;
