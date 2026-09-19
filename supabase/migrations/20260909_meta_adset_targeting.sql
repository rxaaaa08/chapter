-- Who an ad set aims at, and what it aimed at BEFORE someone edited it.
--
-- WHY A HISTORY TABLE AND NOT JUST A COLUMN
-- meta_adset_config is upserted every sync, so a `targeting` column on it would
-- be overwritten the moment the founder edits the audience — which is precisely
-- the failure this exists to prevent. `applications` already taught this lesson
-- expensively: assigned_marketer_id re-stamps and selected_date is mutable, and
-- the two together produced confidently wrong per-date and per-marketer answers
-- on 2026-08-07/08 before application_events was added (see the
-- applications-mutable-state-no-history note). Targeting is the same shape of
-- data: current state that silently destroys the past.
--
-- "Which audience produced these bookings" is the question. Answering it needs
-- to know what the targeting WAS on the day of the click, not what it is today.
-- NOT BACKFILLABLE — every edit made before this ships is already gone.
--
-- ONE ROW PER DISTINCT VERSION, not per sync. first_seen_at/last_seen_at bound
-- the window each version was live, so the lookup is a range query rather than
-- a scan of 96 identical rows a day.

alter table public.meta_adset_config
  add column if not exists targeting jsonb;

comment on column public.meta_adset_config.targeting is
  'CURRENT targeting spec only — overwritten on every change. For history use '
  'meta_adset_targeting_history; this column is the convenience copy.';

create table if not exists public.meta_adset_targeting_history (
  id            uuid primary key default gen_random_uuid(),
  adset_id      text not null,
  targeting     jsonb not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now()
);

create index if not exists meta_adset_targeting_history_lookup_idx
  on public.meta_adset_targeting_history (adset_id, first_seen_at desc);

comment on table public.meta_adset_targeting_history is
  'Append-only log of every distinct targeting spec an ad set has had. One row '
  'per VERSION, with the window it was observed live. Answers "what audience was '
  'this ad set aimed at when that booking happened".';

-- The query this table exists for — what was ad set X aimed at on date D:
--
--   select targeting from public.meta_adset_targeting_history
--   where adset_id = '<id>'
--     and first_seen_at <= '<date>'::timestamptz
--   order by first_seen_at desc
--   limit 1;
--
-- Deliberately NOT wrapped in a function: it is four lines, and a caller who
-- writes it is a caller who has understood that first_seen_at is an OBSERVATION
-- time, not the moment the founder actually made the edit. The sync runs every
-- six hours, so a version's true start is somewhere in the six hours before
-- first_seen_at. That matters for a same-day attribution question and for
-- nothing else, but it should not be hidden behind a helper that implies
-- precision the data does not have.

alter table public.meta_adset_targeting_history enable row level security;

drop policy if exists meta_adset_targeting_history_admin_read on public.meta_adset_targeting_history;
create policy meta_adset_targeting_history_admin_read on public.meta_adset_targeting_history
  for select to authenticated
  using (public.is_admin_strict());
-- No INSERT policy: only meta-ads-sync (service_role) writes, via the function
-- below. Nothing revokes DELETE from the table's owner, but nothing should ever
-- delete from it either — it is an append-only record, like application_events.

-- ---------------------------------------------------------------------------
-- Recording a version.
-- ---------------------------------------------------------------------------
-- THE COMPARISON LIVES HERE, IN SQL, ON PURPOSE. Meta returns the targeting
-- object with no guaranteed key order, and JSON.stringify in the edge function
-- would therefore report a "change" whenever Meta reordered keys — writing a new
-- version row every six hours and burying the real edits. Postgres `jsonb`
-- equality is key-order independent and duplicate-key normalised, so this
-- comparison is semantic rather than textual. Do not move it into TypeScript.
create or replace function public.record_adset_targeting(
  p_adset_id  text,
  p_targeting jsonb
) returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_id     uuid;
  v_latest jsonb;
begin
  if p_adset_id is null or p_targeting is null then
    return false;
  end if;

  select id, targeting into v_id, v_latest
  from public.meta_adset_targeting_history
  where adset_id = p_adset_id
  order by first_seen_at desc
  limit 1;

  -- Unchanged: just extend the window this version was observed live.
  if v_latest is not null and v_latest = p_targeting then
    update public.meta_adset_targeting_history
       set last_seen_at = now()
     where id = v_id;
    return false;
  end if;

  insert into public.meta_adset_targeting_history (adset_id, targeting)
  values (p_adset_id, p_targeting);
  return true;
end;
$function$;

comment on function public.record_adset_targeting(text, jsonb) is
  'Appends a targeting version only when it differs from the latest, using jsonb '
  'equality so Meta reordering keys is not mistaken for an edit. service_role only.';

revoke all on function public.record_adset_targeting(text, jsonb) from public, anon, authenticated;
grant execute on function public.record_adset_targeting(text, jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- Surface it to the founder alongside everything else about an ad set.
-- ---------------------------------------------------------------------------
create or replace function public.get_meta_adset_health()
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
  select case when public.is_admin_strict() then jsonb_build_object(
    'adsets', coalesce((
      select jsonb_agg(jsonb_build_object(
        'adset_id', c.adset_id,
        'adset_name', c.adset_name,
        'campaign_name', c.campaign_name,
        'optimization_goal', c.optimization_goal,
        'custom_event_type', c.custom_event_type,
        'billing_event', c.billing_event,
        'daily_budget', c.daily_budget,
        'effective_status', c.effective_status,
        'config_changed_at', c.config_changed_at,
        'targeting', c.targeting,
        -- More than one version means the audience has been edited since we
        -- started watching, so any per-audience reading of this ad set's
        -- bookings has to go through the history table rather than the
        -- current spec.
        'targeting_versions', (
          select count(*) from public.meta_adset_targeting_history h
          where h.adset_id = c.adset_id
        )
      ) order by c.campaign_name, c.adset_name)
      from public.meta_adset_config c
    ), '[]'::jsonb),
    'warnings', coalesce((
      select jsonb_agg(to_jsonb(w) order by w.weekly_volume)
      from public.meta_adset_optimization_warnings() w
    ), '[]'::jsonb),
    'synced_adsets', (select count(*) from public.meta_adset_config),
    'last_seen_at',  (select max(last_seen_at) from public.meta_adset_config),
    -- NULL, not 0, when nothing has ever been recorded: "no ad set has been
    -- synced" and "targeting capture is not running" are different answers.
    'targeting_capture_since', (
      select min(first_seen_at) from public.meta_adset_targeting_history
    )
  ) end;
$function$;

comment on function public.get_meta_adset_health() is
  'Founder-gated: ad set config, current targeting, how many targeting versions '
  'exist, and any optimisation goals that cannot exit the learning phase.';

revoke all on function public.get_meta_adset_health() from public, anon;
grant execute on function public.get_meta_adset_health() to authenticated;
