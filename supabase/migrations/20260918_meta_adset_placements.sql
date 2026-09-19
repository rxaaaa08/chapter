-- Effective placements, with history (META-ADS-HANDOFF.md §23, "Reels Ads")
-- ---------------------------------------------------------------------------
-- WHAT THIS FIXES. meta_adset_config.targeting holds only the keys an ad set
-- EXPLICITLY carries — four of them on the live ad set (age_min, age_max,
-- geo_locations, targeting_automation). Every placement actually running is
-- computed by Meta and returned under a SEPARATE effective_* field that nothing
-- here ever asked for. So the account's one real money leak — Audience Network
-- `rewarded_video`, the inventory where someone watches an ad to unlock a life
-- in a mobile game — was found by a human reading the config once on
-- 2026-09-09 (§10) and nothing would notice if it changed.
--
-- WHY IT CANNOT WAIT FOR SPEND. Placements are mutable in place, exactly like
-- targeting: choose a placement and the previous set is gone with nothing
-- recording it. That is the same class of loss as applications.selected_date
-- and assigned_marketer_id, which produced two confidently wrong historical
-- answers on 2026-08-07/08. Not backfillable.
--
-- WHY A PREVIEW IS NOT A SUBSTITUTE. §23 ("Ad creative, the full reference")
-- established that /generatepreviews has NO Audience Network ad_format, so the
-- placement most worth seeing is the one a preview structurally cannot show.
-- Reading the effective fields is the only way to know what is running.
--
-- ABSENCE MEANS "ON META'S DEFAULT", NOT "OFF" (§5 Layer 9). That trap is why
-- every row here carries `explicitly_set` alongside the effective placements:
-- a warning must be able to tell "the founder chose Audience Network" from
-- "nobody ever chose a placement, so Advantage+ is running everything".

-- ---------------------------------------------------------------------------
-- 1. Sorting helper — the array-order trap
-- ---------------------------------------------------------------------------
-- The targeting build (§5 Layer 9) moved its comparison into SQL because Meta
-- returns objects with no guaranteed KEY order and jsonb equality is key-order
-- independent. That protection does NOT carry over here: jsonb equality on an
-- ARRAY *is* order-sensitive, and these fields are all arrays. Unsorted, a
-- reordered ["instagram","facebook"] would write a new placement version and
-- bury the real edits — the same failure the targeting build avoided, in a new
-- place. Sort on the way in.
-- search_path is pinned to '' (not 'public') because neither helper resolves an
-- unqualified name in any schema: pg_catalog is always searched first, and the
-- one cross-function call is written out as public.meta_sorted_jsonb_array.
-- Pinned because these run inside record_adset_placements(), which is SECURITY
-- DEFINER, and the advisor is right that a mutable search_path anywhere in such
-- a chain is an escalation path.
create or replace function public.meta_sorted_jsonb_array(p jsonb)
returns jsonb
language sql
immutable
set search_path to ''
as $function$
  select case
    when p is null then null
    when jsonb_typeof(p) <> 'array' then p
    else coalesce((
      select jsonb_agg(v order by v::text)
      from jsonb_array_elements(p) v
    ), '[]'::jsonb)
  end;
$function$;

revoke all on function public.meta_sorted_jsonb_array(jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Normaliser — one definition of "what placements is this ad set running"
-- ---------------------------------------------------------------------------
-- p_effective: Meta's computed effective_* values, already stripped of the
--              `effective_` prefix by the caller.
-- p_targeting: the ad set's own sparse targeting spec, used ONLY to decide
--              which of these keys were a human decision.
--
-- Returns { placements: {...sorted arrays...}, explicitly_set: [...keys...] }.
-- Keys Meta did not return are omitted rather than stored as null, so "Meta
-- reported no messenger_positions" and "we stored a null" cannot be confused.
create or replace function public.meta_normalise_placements(p_effective jsonb, p_targeting jsonb)
returns jsonb
language sql
immutable
set search_path to ''
as $function$
  with keys(k) as (
    values ('publisher_platforms'),
           ('facebook_positions'),
           ('instagram_positions'),
           ('audience_network_positions'),
           ('messenger_positions'),
           ('device_platforms'),
           ('brand_safety_content_filter_levels')
  ),
  vals as (
    select k, public.meta_sorted_jsonb_array(p_effective -> k) as v from keys
  )
  select jsonb_build_object(
    'placements', coalesce(
      (select jsonb_object_agg(k, v) from vals where v is not null),
      '{}'::jsonb
    ),
    'explicitly_set', coalesce(
      (select jsonb_agg(k order by k) from keys where coalesce(p_targeting, '{}'::jsonb) ? k),
      '[]'::jsonb
    )
  );
$function$;

revoke all on function public.meta_normalise_placements(jsonb, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Storage
-- ---------------------------------------------------------------------------
alter table public.meta_adset_config
  add column if not exists placements jsonb,
  add column if not exists placements_observed_at timestamptz;

comment on column public.meta_adset_config.placements is
  'Effective placements as { placements, explicitly_set }. Current reading only — the durable record is meta_adset_placement_history. NULL means never read; see placements_observed_at.';
comment on column public.meta_adset_config.placements_observed_at is
  'When the placement fields were last READ. NULL = never asked. Set even when Meta returned nothing, so "read, found nothing" never looks like "never read" (handoff §9).';

-- One row per distinct VERSION, not one per sync — the same shape as
-- meta_adset_targeting_history, and for the same reason.
create table if not exists public.meta_adset_placement_history (
  id            uuid primary key default gen_random_uuid(),
  adset_id      text not null,
  placements    jsonb not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now()
);

comment on table public.meta_adset_placement_history is
  'Append-only log of every distinct effective-placement version an ad set has had. first_seen_at is an OBSERVATION time, not the edit time — the sync runs once a day, so a version really started somewhere in the preceding 24 h.';

create index if not exists meta_adset_placement_history_adset_idx
  on public.meta_adset_placement_history (adset_id, first_seen_at desc);

alter table public.meta_adset_placement_history enable row level security;

drop policy if exists meta_adset_placement_history_founder_select on public.meta_adset_placement_history;
create policy meta_adset_placement_history_founder_select
  on public.meta_adset_placement_history
  for select
  using (public.is_admin_strict());

revoke insert, update, delete on public.meta_adset_placement_history from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. record_adset_placements() — service role only
-- ---------------------------------------------------------------------------
-- Comparison happens HERE, in Postgres, not in the edge function, for the same
-- reason record_adset_targeting() does: a JSON.stringify diff in TypeScript
-- would report a change every time Meta reordered something.
create or replace function public.record_adset_placements(
  p_adset_id  text,
  p_effective jsonb,
  p_targeting jsonb
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_norm   jsonb;
  v_id     uuid;
  v_latest jsonb;
begin
  if p_adset_id is null then
    return false;
  end if;

  v_norm := public.meta_normalise_placements(
    coalesce(p_effective, '{}'::jsonb),
    coalesce(p_targeting, '{}'::jsonb)
  );

  -- Stamp the reading FIRST, and stamp it even when Meta returned nothing.
  -- An ad set Meta reports no placements for has been read; that is a
  -- different fact from one the sync never asked about, and the schema has to
  -- keep them apart (handoff §9, "null and zero are different answers").
  update public.meta_adset_config
     set placements            = v_norm,
         placements_observed_at = now()
   where adset_id = p_adset_id;

  -- Nothing to version. Not an error: an ad set can legitimately come back
  -- with no placement fields at all, and an empty version row would be noise.
  if (v_norm -> 'placements') = '{}'::jsonb then
    return false;
  end if;

  select id, placements into v_id, v_latest
  from public.meta_adset_placement_history
  where adset_id = p_adset_id
  order by first_seen_at desc
  limit 1;

  if v_latest is not null and v_latest = v_norm then
    update public.meta_adset_placement_history
       set last_seen_at = now()
     where id = v_id;
    return false;
  end if;

  insert into public.meta_adset_placement_history (adset_id, placements)
  values (p_adset_id, v_norm);
  return true;
end;
$function$;

comment on function public.record_adset_placements(text, jsonb, jsonb) is
  'Records one effective-placement reading and appends a history row only on a real change. SERVICE ROLE ONLY — is_admin_strict() is false for the cron, so a founder gate here would silently stop the capture (handoff §6).';

revoke all on function public.record_adset_placements(text, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.record_adset_placements(text, jsonb, jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- 5. meta_adset_placement_warnings() — service role only
-- ---------------------------------------------------------------------------
-- Findings, each reported with whether it was CHOSEN. That distinction is the
-- entire value of the function: "you picked Audience Network" needs no
-- response, "nobody picked anything so Advantage+ turned it on" is §10's money
-- leak. Severity 'leak' means unchosen; 'info' means the founder decided it.
--
-- AND A FOURTH FINDING, `placements_unknown`, added after the first live run.
-- Meta ACCEPTED all seven effective_* field names on /act_<id>/adsets — no 400,
-- so the names are right — and returned not one of them for the paused,
-- never-delivered ad set. It omits a field it has no value for, exactly as it
-- does for daily_budget (the budget lives on the campaign) and for
-- learning_stage_info. The first cut of this function therefore returned ZERO
-- rows for an ad set that is, per §10, running Audience Network rewarded_video
-- on Meta's default: a panel reading only these warnings would have shown "no
-- problems" while the leak this layer exists to catch sat there unseen.
-- So an unread ad set is a FINDING with severity 'unknown', never an absence —
-- the same discipline as untagged_spend being gated on capture being live
-- (Layer 7). A check that cannot see must say so out loud.
--
-- This deliberately does NOT push. The founder's standing rule (§15) is that
-- delivery and setup state is page-only unless he asks otherwise, and the one
-- ad set on the account is PAUSED, so nothing here is urgent. Wiring a push is
-- a later one-line change in meta-ads-sync, not a decision to take for him.
create or replace function public.meta_adset_placement_warnings()
returns table(
  adset_id         text,
  adset_name       text,
  campaign_name    text,
  effective_status text,
  finding          text,
  detail           jsonb,
  chosen           boolean,
  severity         text
)
language sql
stable
security definer
set search_path to 'public'
as $function$
  with c as (
    select
      k.adset_id, k.adset_name, k.campaign_name, k.effective_status,
      k.placements_observed_at                                as seen_at,
      coalesce(k.placements -> 'placements', '{}'::jsonb)     as p,
      coalesce(k.placements -> 'explicitly_set', '[]'::jsonb) as chose
    from public.meta_adset_config k
    where coalesce(k.effective_status, '') not in ('DELETED', 'ARCHIVED')
  )
  -- The sharpest one. Rewarded video is the lowest-intent inventory in the
  -- ecosystem and it is cheap, so at a floor-level daily budget it can absorb a
  -- real share of impressions while producing nothing (§10).
  select c.adset_id, c.adset_name, c.campaign_name, c.effective_status,
         'audience_network_rewarded_video'::text,
         jsonb_build_object('audience_network_positions', c.p -> 'audience_network_positions'),
         (c.chose ? 'audience_network_positions'),
         case when (c.chose ? 'audience_network_positions') then 'info' else 'leak' end
  from c
  where (c.p -> 'audience_network_positions') ? 'rewarded_video'

  union all

  -- Audience Network at all. Separate from the row above because turning the
  -- whole platform off is one switch in Ads Manager and is usually the answer.
  select c.adset_id, c.adset_name, c.campaign_name, c.effective_status,
         'audience_network_on'::text,
         jsonb_build_object('publisher_platforms', c.p -> 'publisher_platforms'),
         (c.chose ? 'publisher_platforms'),
         case when (c.chose ? 'publisher_platforms') then 'info' else 'leak' end
  from c
  where (c.p -> 'publisher_platforms') ? 'audience_network'

  union all

  -- Brand safety on the loosest tier. Not a money leak — a positioning
  -- decision being made by a default, for a brand whose whole premise is a
  -- curated club (§10, and the brand-vision-lifestyle-club note).
  select c.adset_id, c.adset_name, c.campaign_name, c.effective_status,
         'brand_safety_relaxed'::text,
         jsonb_build_object('brand_safety_content_filter_levels',
                            c.p -> 'brand_safety_content_filter_levels'),
         (c.chose ? 'brand_safety_content_filter_levels'),
         case when (c.chose ? 'brand_safety_content_filter_levels') then 'info' else 'leak' end
  from c
  where exists (
    select 1
    from jsonb_array_elements_text(
           coalesce(c.p -> 'brand_safety_content_filter_levels', '[]'::jsonb)
         ) lvl
    where lvl like '%RELAXED'
  )

  union all

  -- The three states, kept apart. never_read = the sync has not asked yet;
  -- meta_returned_none = it asked and Meta had nothing to say, which on this
  -- account means the ad set has never delivered and no placement was ever
  -- chosen by hand. Both mean the same thing to a reader: what this ad set
  -- would actually spend on is NOT KNOWN, so a clean panel is not evidence
  -- that Audience Network is off.
  select c.adset_id, c.adset_name, c.campaign_name, c.effective_status,
         'placements_unknown'::text,
         jsonb_build_object(
           'observed_at', c.seen_at,
           'reason', case when c.seen_at is null then 'never_read' else 'meta_returned_none' end
         ),
         false,
         'unknown'
  from c
  where c.p = '{}'::jsonb;
$function$;

comment on function public.meta_adset_placement_warnings() is
  'Ad sets running inventory nobody chose, PLUS ad sets whose placements are not known (severity unknown) so silence is never mistaken for health. SERVICE ROLE ONLY; the founder-facing path is get_meta_adset_health().';

revoke all on function public.meta_adset_placement_warnings() from public, anon, authenticated;
grant execute on function public.meta_adset_placement_warnings() to service_role;

-- ---------------------------------------------------------------------------
-- 6. get_meta_adset_health() gains placements
-- ---------------------------------------------------------------------------
-- Every existing key is kept, byte for byte. Added per ad set: `placements` and
-- `placement_versions`. Added at the top: `placement_warnings` and
-- `placement_capture_since`.
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
        -- WHERE the ad set's money can go. NULL observed_at means never read;
        -- a reading with an empty `placements` means Meta returned none.
        'placements', jsonb_build_object(
          'effective', coalesce(c.placements -> 'placements', '{}'::jsonb),
          'explicitly_set', coalesce(c.placements -> 'explicitly_set', '[]'::jsonb),
          'observed_at', c.placements_observed_at
        ),
        'placement_versions', (
          select count(*) from public.meta_adset_placement_history ph
          where ph.adset_id = c.adset_id
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
    'placement_warnings', coalesce((
      select jsonb_agg(to_jsonb(pw))
      from public.meta_adset_placement_warnings() pw
    ), '[]'::jsonb),
    'synced_adsets', (select count(*) from public.meta_adset_config),
    'last_seen_at',  (select max(last_seen_at) from public.meta_adset_config),
    'targeting_capture_since', (
      select min(first_seen_at) from public.meta_adset_targeting_history
    ),
    'learning_capture_since', (
      select min(first_seen_at) from public.meta_adset_learning_history
    ),
    'placement_capture_since', (
      select min(first_seen_at) from public.meta_adset_placement_history
    )
  ) end;
$function$;

revoke all on function public.get_meta_adset_health() from public, anon;
grant execute on function public.get_meta_adset_health() to authenticated;
