-- Ad set learning status, with history.
--
-- WHY THIS EXISTS
-- Meta delivers an ad set in a "learning phase" until it collects about 50
-- results in the week after its last significant edit. These always restart
-- that count (Meta help 316478108955072, verified 2026-09-16): any change to
-- targeting, any change to ad creative, a change of optimisation event, ADDING
-- A NEW AD, pausing for 7 days or longer, changing bid strategy. A large budget
-- change may. Meta's own "Optimization Tips" doc recommends several of exactly
-- those edits (segment, shift budget, adjust targeting mid-campaign), and at
-- this account's volume (~10 purchases, ~139 AddToCarts a week site-wide) each
-- can keep an ad set learning indefinitely. META-ADS-HANDOFF.md §23.
--
-- The ad set's `learning_stage_info` says where it stands: status, results
-- since the last significant edit, when that edit was, why learning ended.
-- It is CURRENT STATE ONLY. Meta keeps no history, so "when did learning
-- restart, and what had we just changed" is answerable only if it is recorded
-- as it happens. Read beside meta_adset_targeting_history (same 6-hourly sync),
-- it answers "which edit reset learning". Not backfillable, so it is built
-- before the first ad runs.
--
-- An ad set that is not delivering carries no learning stage. That absence is
-- recorded as a row with status NULL, so "Meta reported nothing" stays
-- distinguishable from "we never looked".
--
-- Asked for by the founder on 2026-09-16 ("build both of them").

-- ---------------------------------------------------------------------------
-- Current state, beside the rest of the ad set's setup.
-- ---------------------------------------------------------------------------
alter table public.meta_adset_config
  add column if not exists learning_status              text,
  add column if not exists learning_conversions         integer,
  add column if not exists learning_last_sig_edit_at    timestamptz,
  add column if not exists learning_exit_reason         text,
  add column if not exists learning_attribution_windows jsonb,
  add column if not exists learning_stage_raw           jsonb,
  -- When the sync last READ it. Null = never captured; a non-null time with a
  -- null status = captured, and Meta reported no learning stage.
  add column if not exists learning_observed_at         timestamptz;

-- ---------------------------------------------------------------------------
-- History: one row per distinct (status, last significant edit) state.
-- ---------------------------------------------------------------------------
-- A new row means something happened: learning started, restarted after an
-- edit, finished, or went limited. While the state holds, the same row's
-- conversions_last and last_seen_at move forward, so the table grows with
-- events, not with sync runs.
create table if not exists public.meta_adset_learning_history (
  id                bigint generated always as identity primary key,
  adset_id          text not null,
  status            text,
  last_sig_edit_at  timestamptz,
  exit_reason       text,
  -- Results Meta had counted when this state was first seen, and at the latest
  -- reading while it lasted.
  conversions_first integer,
  conversions_last  integer,
  raw               jsonb,
  -- OBSERVATION times, not event times: the sync is 6-hourly. The edit time
  -- itself is last_sig_edit_at, which Meta supplies.
  first_seen_at     timestamptz not null default now(),
  last_seen_at      timestamptz not null default now()
);

create index if not exists meta_adset_learning_history_lookup_idx
  on public.meta_adset_learning_history (adset_id, id desc);

alter table public.meta_adset_learning_history enable row level security;

drop policy if exists meta_adset_learning_history_admin_read on public.meta_adset_learning_history;
create policy meta_adset_learning_history_admin_read on public.meta_adset_learning_history
  for select to authenticated
  using (public.is_admin_strict());

-- Only meta-ads-sync (service_role) writes, through the function below.
revoke insert, update, delete, truncate on public.meta_adset_learning_history from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Recording a reading.
-- ---------------------------------------------------------------------------
-- Parsed defensively: Meta's field list and its responses have disagreed in
-- both directions on this API (§9), so every key is optional, a malformed
-- value becomes NULL rather than an error, and the raw object is kept whole
-- so a key this parser does not know is never lost.
--
-- SERVICE ROLE ONLY. is_admin_strict() is false for the cron's key, so a
-- founder gate here would silently disable the capture (§6).
create or replace function public.record_adset_learning(p_adset_id text, p_info jsonb)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_info        jsonb := case when jsonb_typeof(p_info) = 'object' then p_info end;
  v_status      text;
  v_conv        integer;
  v_edit_raw    text;
  v_edit_at     timestamptz;
  v_exit        text;
  v_windows     jsonb;
  v_id          bigint;
  v_prev_status text;
  v_prev_edit   timestamptz;
begin
  if p_adset_id is null then
    return false;
  end if;

  v_status   := nullif(upper(btrim(v_info->>'status')), '');
  v_conv     := case when (v_info->>'conversions') ~ '^[0-9]{1,9}$'
                     then (v_info->>'conversions')::integer end;
  v_edit_raw := btrim(v_info->>'last_sig_edit_ts');
  -- Unix seconds per Meta; milliseconds tolerated rather than stored 1000x wrong.
  v_edit_at  := case
                  when v_edit_raw ~ '^[0-9]{9,10}$'  then to_timestamp(v_edit_raw::bigint)
                  when v_edit_raw ~ '^[0-9]{12,13}$' then to_timestamp(v_edit_raw::bigint / 1000.0)
                end;
  v_exit     := nullif(btrim(v_info->>'exit_reason'), '');
  v_windows  := case when jsonb_typeof(v_info->'attribution_windows') = 'array'
                     then v_info->'attribution_windows' end;

  update public.meta_adset_config
     set learning_status              = v_status,
         learning_conversions         = v_conv,
         learning_last_sig_edit_at    = v_edit_at,
         learning_exit_reason         = v_exit,
         learning_attribution_windows = v_windows,
         learning_stage_raw           = v_info,
         learning_observed_at         = now()
   where adset_id = p_adset_id;

  select id, status, last_sig_edit_at
    into v_id, v_prev_status, v_prev_edit
    from public.meta_adset_learning_history
   where adset_id = p_adset_id
   order by id desc
   limit 1;

  if found
     and v_prev_status is not distinct from v_status
     and v_prev_edit   is not distinct from v_edit_at then
    update public.meta_adset_learning_history
       set conversions_last = v_conv,
           exit_reason      = coalesce(v_exit, exit_reason),
           raw              = v_info,
           last_seen_at     = now()
     where id = v_id;
    return false;
  end if;

  insert into public.meta_adset_learning_history
    (adset_id, status, last_sig_edit_at, exit_reason, conversions_first, conversions_last, raw)
  values
    (p_adset_id, v_status, v_edit_at, v_exit, v_conv, v_conv, v_info);
  return true;
end;
$$;

revoke all on function public.record_adset_learning(text, jsonb) from public, anon, authenticated;
grant execute on function public.record_adset_learning(text, jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- The founder-facing reader: get_meta_adset_health() gains the learning stage.
-- ---------------------------------------------------------------------------
-- Every existing key is kept. Added per ad set: `learning` (current reading,
-- plus results_to_exit, Meta's ~50) and `learning_history` (newest 10 states).
-- Added at the top: `learning_capture_since`.
create or replace function public.get_meta_adset_health()
returns jsonb
language sql
stable security definer
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
        'targeting_versions', (
          select count(*) from public.meta_adset_targeting_history h
          where h.adset_id = c.adset_id
        ),
        'learning', jsonb_build_object(
          'status', c.learning_status,
          'conversions', c.learning_conversions,
          'last_significant_edit_at', c.learning_last_sig_edit_at,
          'exit_reason', c.learning_exit_reason,
          'attribution_windows', c.learning_attribution_windows,
          'observed_at', c.learning_observed_at,
          -- Meta's documented bar: ~50 results in the week after the last
          -- significant edit. A display constant, not a threshold Meta returns.
          'results_to_exit', 50
        ),
        'learning_history', coalesce((
          select jsonb_agg(jsonb_build_object(
            'status', lh.status,
            'last_significant_edit_at', lh.last_sig_edit_at,
            'exit_reason', lh.exit_reason,
            'conversions_first', lh.conversions_first,
            'conversions_last', lh.conversions_last,
            'first_seen_at', lh.first_seen_at,
            'last_seen_at', lh.last_seen_at
          ) order by lh.id desc)
          from (
            select * from public.meta_adset_learning_history x
            where x.adset_id = c.adset_id
            order by x.id desc
            limit 10
          ) lh
        ), '[]'::jsonb)
      ) order by c.campaign_name, c.adset_name)
      from public.meta_adset_config c
    ), '[]'::jsonb),
    'warnings', coalesce((
      select jsonb_agg(to_jsonb(w) order by w.weekly_volume)
      from public.meta_adset_optimization_warnings() w
    ), '[]'::jsonb),
    'synced_adsets', (select count(*) from public.meta_adset_config),
    'last_seen_at',  (select max(last_seen_at) from public.meta_adset_config),
    'targeting_capture_since', (
      select min(first_seen_at) from public.meta_adset_targeting_history
    ),
    'learning_capture_since', (
      select min(first_seen_at) from public.meta_adset_learning_history
    )
  ) end;
$function$;

revoke all on function public.get_meta_adset_health() from public, anon;
grant execute on function public.get_meta_adset_health() to authenticated;
