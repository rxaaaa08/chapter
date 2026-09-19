-- Website Custom Audiences as a registry we own, plus the size and rule of
-- EVERY audience on the ad account, observed on each sync.
--
-- WHY A REGISTRY, AND WHY A RULE CAN NEVER BE EDITED IN IT
-- Meta's Audience Rules doc: "editing aggregation and retention_seconds does not
-- flush the audience. People who only match the old rule/aggregation continue to
-- be in the audience until they expire." So an audience whose rule was edited is
-- a BLEND of every version it has had inside its retention window, and nothing on
-- Meta's side says so. "Bookings from the price-seen audience" would quietly mean
-- "the price-seen audience, plus whoever the old rule caught last month". Same
-- class of problem as applications overwriting its own history (see the
-- applications-mutable-state-no-history note) and ad set targeting (see
-- 20260909_meta_adset_targeting.sql): current state that silently rewrites the past.
--
-- So once an audience exists on Meta its rule is FROZEN here. A change is a new
-- VERSION (a new audience); the old one is retired, never edited and never
-- deleted. Never deleted because Meta PAUSES any campaign targeting a Website
-- Custom Audience that gets deleted (WCA doc) — tidying up a list would stop ads.
--
-- WHY A VALIDATOR
-- A Website Custom Audience fails silently. A rule naming an event or custom-data
-- field our Pixel never sends is accepted by Meta, matches nobody, and reports a
-- small-but-plausible size forever. So a rule cannot even be STORED here unless
-- every event and field it names is one the Pixel really sends. The lists mirror
-- src/supabase.ts (PIXEL_EVENTS, and the params trackEvent passes to trackPixel) —
-- change them together, the same way meta_adset_optimization_warnings mirrors it.
--
-- Two more refusals, both measured rather than assumed:
--   * url / path / domain rules. Every event this Pixel sends reports the bare
--     origin https://chaptera.in/ — 27 days of Meta's own dataset stats, read
--     2026-09-10, never show a path (META-ADS-HANDOFF.md §9). A rule on a page
--     path matches nobody. The one exception is Meta's own "all visitors" shape,
--     `url i_contains ""`, which matches everything and so is unaffected.
--   * retention over 180 days. Meta's docs disagree: 180 in the WCA parameter
--     table, 365 in the WCA FAQ and in the Audience Rules doc. 180 satisfies all
--     three, so it is the one value that cannot be rejected.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Our funnel step(s) behind each Meta event name.
-- SOURCE OF TRUTH IS src/supabase.ts PIXEL_EVENTS. Purchase is absent on purpose:
-- it is counted from real payments, never from flow_analytics.
create or replace function public.meta_event_flow_types(p_event text)
returns text[]
language sql
immutable
set search_path to 'public'
as $function$
  select case p_event
    when 'PageView'         then array['page_view']
    when 'ViewContent'      then array['event_selected']
    when 'AddToCart'        then array['calendar_opened']
    when 'ReachedPricing'   then array['reached_pricing']
    when 'InitiateCheckout' then array['book_cta_clicked','contact_cta_clicked']
    when 'Lead'             then array['application_submitted','details_form_submitted']
    else '{}'::text[]
  end;
$function$;

-- Every event name one block of a rule filters on. `strict $.**` walks nested
-- filter sets to any depth without lax mode's duplicate results.
create or replace function public.meta_rule_events(p_rule jsonb, p_block text)
returns text[]
language sql
immutable
set search_path to 'public'
as $function$
  select coalesce(array_agg(distinct x->>'value'), '{}')
  from jsonb_path_query(coalesce(p_rule->p_block, 'null'::jsonb), 'strict $.**') x
  where jsonb_typeof(x) = 'object' and x->>'field' = 'event';
$function$;

-- Returns every problem with a rule; an empty array means valid. Structure and
-- limits are from Meta's Audience Rules doc (10 rules per audience counting
-- inclusions and exclusions together, 100 filters per rule, `event` filters use
-- eq, percentile aggregations use in_range / not_in_range).
create or replace function public.meta_validate_website_rule(p_rule jsonb)
returns text[]
language plpgsql
stable
set search_path to 'public'
as $function$
declare
  -- SOURCE OF TRUTH: PIXEL_EVENTS in src/supabase.ts, plus Purchase (fired by
  -- trackPurchaseOnce in src/metaPixel.ts and by the Conversions API).
  c_events constant text[] := array[
    'PageView','ViewContent','AddToCart','ReachedPricing','InitiateCheckout','Lead','Purchase'];
  -- SOURCE OF TRUTH: the params object trackEvent passes to trackPixel in
  -- src/supabase.ts, plus what trackPurchaseOnce adds. device_type is Meta's own
  -- field and needs nothing from us.
  c_fields constant text[] := array[
    'content_ids','content_name','content_category','content_type','city','cta_type',
    'value','currency','order_id','device_type'];
  c_pixel constant text := '28370453785913523';
  c_max_retention constant bigint := 15552000;  -- 180 days
  problems text[] := '{}';
  v_block  text;
  v_rule   jsonb;
  v_src    jsonb;
  v_leaf   jsonb;
  v_leaves integer;
  v_total  integer := 0;
  v_ret    numeric;
  v_agg    jsonb;
begin
  if p_rule is null or jsonb_typeof(p_rule) <> 'object' then
    return array['the rule must be a JSON object'];
  end if;
  if exists (select 1 from jsonb_object_keys(p_rule) k where k not in ('inclusions','exclusions')) then
    problems := problems || 'only "inclusions" and "exclusions" may appear at the top level'::text;
  end if;
  if p_rule->'inclusions' is null then
    problems := problems || 'an audience needs an "inclusions" block'::text;
  end if;

  foreach v_block in array array['inclusions','exclusions'] loop
    continue when p_rule->v_block is null;

    if coalesce(p_rule->v_block->>'operator', '') not in ('and','or') then
      problems := problems || format('%s: operator must be "and" or "or"', v_block);
    end if;
    if jsonb_typeof(p_rule->v_block->'rules') is distinct from 'array' then
      problems := problems || format('%s: "rules" must be an array', v_block);
      continue;
    end if;
    if jsonb_array_length(p_rule->v_block->'rules') = 0 then
      problems := problems || format('%s: "rules" is empty', v_block);
      continue;
    end if;
    v_total := v_total + jsonb_array_length(p_rule->v_block->'rules');

    for v_rule in select value from jsonb_array_elements(p_rule->v_block->'rules') loop
      if jsonb_typeof(v_rule) <> 'object' then
        problems := problems || format('%s: every rule must be an object', v_block);
        continue;
      end if;

      -- Our pixel, and nothing else.
      if jsonb_typeof(v_rule->'event_sources') is distinct from 'array'
         or jsonb_array_length(coalesce(v_rule->'event_sources', '[]'::jsonb)) = 0 then
        problems := problems || format('%s: every rule needs event_sources', v_block);
      else
        for v_src in select value from jsonb_array_elements(v_rule->'event_sources') loop
          -- ->> reads a bare JSON number as its exact digits, so Meta's numeric
          -- form of the id and our string form compare equal.
          if v_src->>'type' is distinct from 'pixel' or v_src->>'id' is distinct from c_pixel then
            problems := problems || format('%s: the event source must be our pixel %s, not %s',
                                           v_block, c_pixel, v_src::text);
          end if;
        end loop;
      end if;

      v_ret := case when jsonb_typeof(v_rule->'retention_seconds') = 'number'
                    then (v_rule->>'retention_seconds')::numeric end;
      if v_ret is null or v_ret < 1 or v_ret > c_max_retention or v_ret <> trunc(v_ret) then
        problems := problems || format('%s: retention_seconds must be a whole number from 1 to %s (180 days)',
                                       v_block, c_max_retention);
      end if;

      if jsonb_typeof(v_rule->'filter') is distinct from 'object' then
        problems := problems || format('%s: every rule needs a filter', v_block);
        continue;
      end if;

      select count(*) into v_leaves
        from jsonb_path_query(v_rule->'filter', 'strict $.**') x
       where jsonb_typeof(x) = 'object' and x ? 'field';
      if v_leaves = 0 then
        problems := problems || format('%s: a filter with no conditions', v_block);
      elsif v_leaves > 100 then
        problems := problems || format('%s: %s filters in one rule; Meta allows 100', v_block, v_leaves);
      end if;

      for v_leaf in
        select x from jsonb_path_query(v_rule->'filter', 'strict $.**') x
         where jsonb_typeof(x) = 'object' and x ? 'field'
      loop
        if v_leaf->>'field' in ('url','path','domain') then
          if not (v_leaf->>'field' = 'url'
                  and coalesce(v_leaf->>'value', '') = ''
                  and v_leaf->>'operator' = 'i_contains') then
            problems := problems || format(
              '%s: %s rules match nobody here, because every event reports the bare origin https://chaptera.in/ (only the match-all url i_contains "" is allowed): %s',
              v_block, v_leaf->>'field', v_leaf::text);
          end if;
        elsif v_leaf->>'field' = 'event' then
          if coalesce(v_leaf->>'operator', '') not in ('eq','=') then
            problems := problems || format('%s: an event filter must use eq, not %s',
                                           v_block, coalesce(v_leaf->>'operator', 'nothing'));
          end if;
          if not (coalesce(v_leaf->>'value', '') = any (c_events)) then
            problems := problems || format('%s: our Pixel never sends an event called "%s", so this rule would match nobody',
                                           v_block, v_leaf->>'value');
          end if;
        elsif not (v_leaf->>'field' = any (c_fields)) then
          problems := problems || format('%s: our Pixel never sends a field called "%s", so this rule would match nobody',
                                         v_block, v_leaf->>'field');
        end if;
      end loop;

      v_agg := v_rule->'aggregation';
      if v_agg is not null then
        if coalesce(v_agg->>'type', '') not in ('count','sum','avg','min','max','time_spent','last_event_time_field') then
          problems := problems || format('%s: unknown aggregation type %s', v_block, coalesce(v_agg->>'type', '(none)'));
        end if;
        if v_agg->>'method' = 'percentile' and coalesce(v_agg->>'operator', '') not in ('in_range','not_in_range') then
          problems := problems || format('%s: a percentile aggregation must use in_range or not_in_range', v_block);
        end if;
        if coalesce(v_agg->>'type', '') in ('sum','avg','min','max') and v_agg->>'field' is null then
          problems := problems || format('%s: a %s aggregation needs the field it applies to', v_block, v_agg->>'type');
        end if;
        if v_agg->>'field' is not null and not (v_agg->>'field' = any (c_fields)) then
          problems := problems || format('%s: the aggregation reads "%s", which our Pixel never sends',
                                         v_block, v_agg->>'field');
        end if;
      end if;
    end loop;
  end loop;

  if v_total > 10 then
    problems := problems || format('%s rules in one audience; Meta allows 10, inclusions and exclusions together', v_total);
  end if;

  return problems;
end;
$function$;

-- ---------------------------------------------------------------------------
-- The registry
-- ---------------------------------------------------------------------------
create table if not exists public.meta_website_audiences (
  key               text not null,
  -- A rule change is a NEW version, never an edit. See the header.
  version           integer not null check (version >= 0),
  -- Exactly what the audience is called on Meta, version included, so Ads
  -- Manager and this table can never be confused about which one is meant.
  name              text not null,
  purpose           text not null check (purpose in ('retarget','exclude','seed')),
  description       text not null,
  -- The rule we create it with, in Meta's own format. Frozen once audience_id
  -- is set (trigger below).
  rule              jsonb not null,
  status            text not null default 'draft' check (status in ('draft','active','retired')),
  -- NULL until it exists on Meta.
  audience_id       text unique,
  -- 'adopted' = made by hand in Ads Manager and brought in here to be watched.
  origin            text not null default 'registry' check (origin in ('registry','adopted')),
  -- The rule as META reports it on first observation after creation. Meta
  -- rewrites what it is sent (the pixel id comes back as a number, a `template`
  -- key appears), so drift is judged against Meta's copy, never ours.
  rule_baseline     jsonb,
  -- Set when Meta's copy stops matching the baseline: somebody edited the rule
  -- in Ads Manager, and the audience is now a blend of both versions.
  drift_detected_at timestamptz,
  created_at        timestamptz not null default now(),
  activated_at      timestamptz,
  retired_at        timestamptz,
  primary key (key, version),
  constraint meta_website_audiences_active_has_id check (status <> 'active' or audience_id is not null),
  constraint meta_website_audiences_draft_has_no_id check (status <> 'draft' or audience_id is null)
);

comment on table public.meta_website_audiences is
  'Website Custom Audiences we rely on, with the exact rule each was created from. '
  'A rule is frozen once the audience exists on Meta, because Meta does not flush an '
  'audience when its rule is edited. Change = new version. See META-ADS-HANDOFF.md.';

-- One live version of each audience at a time.
create unique index if not exists meta_website_audiences_one_active
  on public.meta_website_audiences (key) where status = 'active';

create or replace function public.meta_website_audiences_guard()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_check    boolean;
  v_problems text[];
begin
  if tg_op = 'UPDATE' then
    if old.audience_id is not null and new.audience_id is distinct from old.audience_id then
      raise exception 'audience % v% is bound to Meta audience % and cannot be rebound',
        old.key, old.version, old.audience_id;
    end if;
    -- The whole reason this table exists. See the header.
    if old.audience_id is not null and new.rule is distinct from old.rule then
      raise exception 'audience % v% already exists on Meta, so its rule is frozen: Meta does not flush an audience when its rule is edited, and the result would be a blend of both. Insert version % instead and retire this one.',
        old.key, old.version, old.version + 1;
    end if;
    if old.status = 'retired' and new.status <> 'retired' then
      raise exception 'audience % v% is retired and stays retired; insert a new version', old.key, old.version;
    end if;
    v_check := new.rule is distinct from old.rule;
  else
    v_check := true;
  end if;

  if v_check then
    v_problems := public.meta_validate_website_rule(new.rule);
    if coalesce(array_length(v_problems, 1), 0) > 0 then
      raise exception 'invalid audience rule for % v%: %', new.key, new.version, array_to_string(v_problems, ' | ');
    end if;
  end if;

  -- Timestamps follow status, so "when did this start or stop" never depends on
  -- somebody remembering to set them.
  if new.status = 'active' and new.activated_at is null then new.activated_at := now(); end if;
  if new.status = 'retired' and new.retired_at is null then new.retired_at := now(); end if;
  return new;
end;
$function$;

drop trigger if exists trg_meta_website_audiences_guard on public.meta_website_audiences;
create trigger trg_meta_website_audiences_guard
  before insert or update on public.meta_website_audiences
  for each row execute function public.meta_website_audiences_guard();

alter table public.meta_website_audiences enable row level security;
drop policy if exists meta_website_audiences_founder_read on public.meta_website_audiences;
create policy meta_website_audiences_founder_read on public.meta_website_audiences
  for select to authenticated using (public.is_admin_strict());
revoke insert, update, delete, truncate on public.meta_website_audiences from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Snapshots: every audience on the account, not only ours
-- ---------------------------------------------------------------------------
-- Keyed by Meta's id and discovered by listing the account, so an audience made
-- by hand in Ads Manager is watched too. One row per audience per IST day; the
-- 6-hourly sync overwrites the day's row, so this is size history at day grain.
create table if not exists public.meta_audience_snapshots (
  audience_id       text not null,
  observed_on       date not null,
  name              text,
  subtype           text,
  -- Meta's approximate size range. A customer list under 1,000 people reads as
  -- exactly 1,000 / 1,000 — a floor, not a count. See get_meta_audience_health.
  lower_bound       bigint,
  upper_bound       bigint,
  delivery_code     integer,
  delivery_text     text,
  operation_code    integer,
  operation_text    text,
  retention_days    integer,
  -- As Meta reports it. NULL for customer lists, which have no rule.
  rule              jsonb,
  meta_time_updated timestamptz,
  first_observed_at timestamptz not null default now(),
  last_observed_at  timestamptz not null default now(),
  primary key (audience_id, observed_on)
);

comment on table public.meta_audience_snapshots is
  'Size, status and rule of every Custom Audience on the ad account, one row per '
  'audience per IST day, written by meta-ads-sync.';

alter table public.meta_audience_snapshots enable row level security;
drop policy if exists meta_audience_snapshots_founder_read on public.meta_audience_snapshots;
create policy meta_audience_snapshots_founder_read on public.meta_audience_snapshots
  for select to authenticated using (public.is_admin_strict());
revoke insert, update, delete, truncate on public.meta_audience_snapshots from anon, authenticated;

-- Written by meta-ads-sync once per audience per run.
create or replace function public.record_audience_snapshot(
  p_audience_id    text,
  p_name           text,
  p_subtype        text,
  p_lower          bigint,
  p_upper          bigint,
  p_delivery_code  integer,
  p_delivery_text  text,
  p_operation_code integer,
  p_operation_text text,
  p_retention_days integer,
  p_rule_text      text,
  p_time_updated   timestamptz
) returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_rule      jsonb;
  v_rule_bad  boolean := false;
  v_day       date := (now() at time zone 'Asia/Kolkata')::date;
  v_key       text;
  v_version   integer;
  v_baseline  jsonb;
  v_drift     boolean := false;
  v_baselined boolean := false;
begin
  if p_audience_id is null then
    return jsonb_build_object('skipped', true);
  end if;

  -- Parsed HERE, not in the edge function. Meta returns the pixel id inside this
  -- string as a bare JSON number, 28370453785913523, which is past the largest
  -- integer JavaScript holds exactly: JSON.parse would silently store a different
  -- pixel. Postgres numerics are exact.
  if nullif(btrim(coalesce(p_rule_text, '')), '') is not null then
    begin
      v_rule := p_rule_text::jsonb;
    exception when others then
      v_rule := null;
      v_rule_bad := true;
    end;
  end if;

  insert into public.meta_audience_snapshots (
    audience_id, observed_on, name, subtype, lower_bound, upper_bound,
    delivery_code, delivery_text, operation_code, operation_text,
    retention_days, rule, meta_time_updated
  ) values (
    p_audience_id, v_day, p_name, p_subtype, p_lower, p_upper,
    p_delivery_code, p_delivery_text, p_operation_code, p_operation_text,
    p_retention_days, v_rule, p_time_updated
  )
  on conflict (audience_id, observed_on) do update set
    name              = excluded.name,
    subtype           = excluded.subtype,
    lower_bound       = excluded.lower_bound,
    upper_bound       = excluded.upper_bound,
    delivery_code     = excluded.delivery_code,
    delivery_text     = excluded.delivery_text,
    operation_code    = excluded.operation_code,
    operation_text    = excluded.operation_text,
    retention_days    = excluded.retention_days,
    rule              = excluded.rule,
    meta_time_updated = excluded.meta_time_updated,
    last_observed_at  = now();

  select key, version, rule_baseline into v_key, v_version, v_baseline
    from public.meta_website_audiences
   where audience_id = p_audience_id;

  -- Only judged when Meta actually returned a rule: a degraded fetch without the
  -- field says nothing about whether the rule changed.
  if v_key is not null and v_rule is not null then
    if v_baseline is null then
      update public.meta_website_audiences
         set rule_baseline = v_rule
       where key = v_key and version = v_version;
      v_baselined := true;
    elsif v_baseline <> v_rule then
      -- jsonb equality ignores key order, so Meta reordering keys is not an edit.
      v_drift := true;
    end if;
    update public.meta_website_audiences
       set drift_detected_at = case when v_drift then coalesce(drift_detected_at, now()) end
     where key = v_key and version = v_version
       and drift_detected_at is distinct from case when v_drift then coalesce(drift_detected_at, now()) end;
  end if;

  return jsonb_build_object('drift', v_drift, 'baselined', v_baselined, 'rule_unparseable', v_rule_bad);
end;
$function$;

-- ---------------------------------------------------------------------------
-- The check: an ad set that would pay to reach people who already bought
-- ---------------------------------------------------------------------------
-- customers_all_paid exists for exactly one job — to be EXCLUDED from ads
-- (20260907_meta_custom_audiences.sql) — and it does that job only if an ad set
-- actually names it. With Advantage+ audience on, custom-audience exclusions are
-- still honoured as hard controls, so the exclusion is meaningful there too.
--
-- Deliberately strict: excluding a Pixel "Purchase" audience instead does not
-- count, because the Pixel misses anyone whose browser never returned from the
-- UPI app, and our customer list does not.
--
-- Ungated core, service_role only — same reasoning as meta_adset_optimization_warnings.
create or replace function public.meta_adset_audience_warnings()
returns table (
  adset_id         text,
  adset_name       text,
  campaign_name    text,
  effective_status text,
  issue            text,
  customers        integer
)
language sql
stable
security definer
set search_path to 'public'
as $function$
  with cust as (
    select audience_id, member_count from public.meta_audiences
     where key = 'customers_all_paid' and audience_id is not null
  ),
  -- An ad set aimed AT customers (a rebooking campaign) is doing something on
  -- purpose, and excluding them there would be the mistake.
  cust_any as (
    select audience_id from public.meta_audiences
     where key in ('customers_all_paid','customers_completed') and audience_id is not null
  )
  select c.adset_id, c.adset_name, c.campaign_name, c.effective_status,
         'no_customer_exclusion'::text,
         (select member_count from cust)
    from public.meta_adset_config c
   where coalesce(c.effective_status, '') not in ('DELETED','ARCHIVED')
     -- NULL targeting means capture failed, not "no exclusions": unknown is not a finding.
     and c.targeting is not null
     and exists (select 1 from cust)
     and not exists (
       select 1 from jsonb_array_elements(coalesce(c.targeting->'custom_audiences', '[]'::jsonb)) e
        where e->>'id' in (select audience_id from cust_any))
     and not exists (
       select 1 from jsonb_array_elements(coalesce(c.targeting->'excluded_custom_audiences', '[]'::jsonb)) e
        where e->>'id' in (select audience_id from cust));
$function$;

-- ---------------------------------------------------------------------------
-- Founder-facing readout
-- ---------------------------------------------------------------------------
-- One jsonb, not a set of rows: PostgREST caps every response at 1,000 rows,
-- RETURNS TABLE functions included.
create or replace function public.get_meta_audience_health()
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
  with
  -- The Pixel's first day on the site. flow_analytics goes back months further,
  -- and counting sessions the Pixel never saw would make Meta's share look worse
  -- than it is.
  pixel as (select timestamptz '2026-08-12 00:00:00+05:30' as live_since),
  latest as (
    select distinct on (audience_id) *
      from public.meta_audience_snapshots
     order by audience_id, observed_on desc
  ),
  reg as (
    select w.*,
      public.meta_rule_events(w.rule, 'inclusions') as incl_events,
      public.meta_rule_events(w.rule, 'exclusions') as excl_events,
      (select max((r->>'retention_seconds')::numeric) / 86400
         from jsonb_array_elements(w.rule->'inclusions'->'rules') r) as window_days,
      exists (select 1 from jsonb_path_query(w.rule->'inclusions', 'strict $.**') x
               where jsonb_typeof(x) = 'object' and x->>'field' = 'url') as match_all
    from public.meta_website_audiences w
  ),
  counted as (
    select r.*,
      -- Distinct SESSIONS that did an inclusion step inside the window. An upper
      -- bound on the people Meta could hold: one person can be several sessions,
      -- and exclusions are not subtracted. Meta's size divided by this is the
      -- share of real visitors Meta managed to tie to an account.
      (select count(distinct f.session_id)
         from public.flow_analytics f
        where f.created_at >= greatest((select live_since from pixel),
                                       now() - make_interval(days => ceil(r.window_days)::int))
          and f.event_type = any (
                case when r.match_all then array['page_view']
                     else (select coalesce(array_agg(t), '{}')
                             from unnest(r.incl_events) e, unnest(public.meta_event_flow_types(e)) t)
                end)
      ) as qualifying_sessions,
      -- Inclusion events with no rows for 7 days while the site still had
      -- visitors: the audience is starving, usually because the Pixel mapping in
      -- src/supabase.ts changed underneath it.
      (select coalesce(array_agg(e), '{}')
         from unnest(r.incl_events) e
        where e <> 'Purchase'
          and not exists (select 1 from public.flow_analytics f
                           where f.created_at >= now() - interval '7 days'
                             and f.event_type = any (public.meta_event_flow_types(e)))
          and exists (select 1 from public.flow_analytics f
                       where f.created_at >= now() - interval '7 days'
                         and f.event_type = 'page_view')
      ) as silent_events
    from reg r
  )
  select case when public.is_admin_strict() then jsonb_build_object(
    'website', coalesce((
      select jsonb_agg(jsonb_build_object(
        'key', c.key, 'version', c.version, 'name', c.name, 'purpose', c.purpose,
        'description', c.description, 'status', c.status, 'origin', c.origin,
        'audience_id', c.audience_id,
        'include_events', to_jsonb(c.incl_events), 'exclude_events', to_jsonb(c.excl_events),
        'window_days', round(c.window_days),
        'qualifying_sessions', c.qualifying_sessions,
        'silent_events', to_jsonb(c.silent_events),
        'drift_detected_at', c.drift_detected_at,
        'meta_lower', l.lower_bound, 'meta_upper', l.upper_bound,
        'delivery_code', l.delivery_code, 'delivery_text', l.delivery_text,
        'observed_on', l.observed_on
      ) order by (c.status = 'active') desc, c.purpose, c.key, c.version desc)
      from counted c left join latest l on l.audience_id = c.audience_id
    ), '[]'::jsonb),
    'customer_files', coalesce((
      select jsonb_agg(jsonb_build_object(
        'key', a.key, 'name', a.name, 'audience_id', a.audience_id,
        'uploaded', a.member_count, 'last_synced_at', a.last_synced_at, 'last_error', a.last_error,
        'meta_lower', l.lower_bound, 'meta_upper', l.upper_bound,
        -- Meta will not report a customer list smaller than 1,000; it shows
        -- 1,000 / 1,000. Three lists of 85, 107 and 165 all read exactly that
        -- three days after upload (2026-09-10), which rules out "still processing".
        'size_hidden', (l.lower_bound = 1000 and l.upper_bound = 1000 and a.member_count < 1000),
        'delivery_code', l.delivery_code, 'delivery_text', l.delivery_text,
        'observed_on', l.observed_on
      ) order by a.key)
      from public.meta_audiences a left join latest l on l.audience_id = a.audience_id
    ), '[]'::jsonb),
    -- On the account but in neither registry: made by hand in Ads Manager.
    'unregistered', coalesce((
      select jsonb_agg(jsonb_build_object(
        'audience_id', l.audience_id, 'name', l.name, 'subtype', l.subtype,
        'meta_lower', l.lower_bound, 'meta_upper', l.upper_bound,
        'delivery_text', l.delivery_text, 'observed_on', l.observed_on
      ) order by l.name)
      from latest l
      where l.audience_id not in (select audience_id from public.meta_website_audiences where audience_id is not null)
        and l.audience_id not in (select audience_id from public.meta_audiences where audience_id is not null)
    ), '[]'::jsonb),
    'adset_warnings', coalesce((
      select jsonb_agg(to_jsonb(w)) from public.meta_adset_audience_warnings() w
    ), '[]'::jsonb),
    -- NULL, not zero, when the size capture has never run: "no audiences" and
    -- "never looked" are different answers.
    'snapshots_since',  (select min(first_observed_at) from public.meta_audience_snapshots),
    'last_observed_at', (select max(last_observed_at) from public.meta_audience_snapshots)
  ) end;
$function$;

comment on function public.get_meta_audience_health() is
  'Founder-gated: every audience with its Meta size beside our own count, drift and '
  'starvation flags, and ad sets that do not exclude existing customers.';

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
revoke all on function public.meta_event_flow_types(text) from public, anon, authenticated;
revoke all on function public.meta_rule_events(jsonb, text) from public, anon, authenticated;
revoke all on function public.meta_validate_website_rule(jsonb) from public, anon, authenticated;
revoke all on function public.record_audience_snapshot(text, text, text, bigint, bigint, integer, text, integer, text, integer, text, timestamptz) from public, anon, authenticated;
revoke all on function public.meta_adset_audience_warnings() from public, anon, authenticated;
grant execute on function public.meta_event_flow_types(text) to service_role;
grant execute on function public.meta_rule_events(jsonb, text) to service_role;
grant execute on function public.meta_validate_website_rule(jsonb) to service_role;
grant execute on function public.record_audience_snapshot(text, text, text, bigint, bigint, integer, text, integer, text, integer, text, timestamptz) to service_role;
grant execute on function public.meta_adset_audience_warnings() to service_role;

revoke all on function public.get_meta_audience_health() from public, anon;

-- A trigger function cannot be called as an RPC, but Supabase's default
-- privileges still grant EXECUTE on it to anon and authenticated, and the
-- security advisor flags every SECURITY DEFINER function that is. Closed so the
-- advisor's list stays meaningful rather than something to skim past.
-- (Applied to prod as its own step, meta_audience_layer_guard_grants.)
revoke all on function public.meta_website_audiences_guard() from public, anon, authenticated;
grant execute on function public.get_meta_audience_health() to authenticated;

-- ---------------------------------------------------------------------------
-- Seed
-- ---------------------------------------------------------------------------
-- v0: the one audience already on the account, adopted exactly as Meta holds it
-- (read 2026-09-10) so its size is watched from day one. It is also the probe
-- for the question that decides whether retargeting works here at all: it held
-- ~20 people while the Pixel logged ~1,150 visiting sessions in 27 days.
--
-- v1 drafts: NOT on Meta. Creating one is a write to the live ad account and
-- waits for the founder's go-ahead. The three retarget tiers are disjoint by
-- construction (each excludes the deeper steps), so they can carry different
-- messages without bidding against each other. Leads are excluded because they
-- are already reachable on WhatsApp and through the leads customer list: these
-- hold only people we have no other way to reach.
--
-- `template` is on every rule because the Meta Ads MCP requires it for WEBSITE
-- audiences, although the Audience Rules doc never mentions it. Drafts can still
-- be edited, so if Meta rejects it at creation, fix the draft before it freezes.
insert into public.meta_website_audiences
  (key, version, name, purpose, description, rule, status, audience_id, origin, rule_baseline, activated_at)
values
  ('all_visitors', 0, 'Website visitors - 180d', 'retarget',
   'Everyone whose browser fired our Pixel in the last 180 days. Made by hand in Ads Manager on 15 Aug 2026 and adopted here so its size is watched like every other audience. Overlaps every tier below.',
   '{"inclusions":{"operator":"or","rules":[{"event_sources":[{"type":"pixel","id":28370453785913523}],"retention_seconds":15552000,"filter":{"operator":"and","filters":[{"field":"url","operator":"i_contains","value":""}]},"template":"ALL_VISITORS"}]}}',
   'active', '120248233205110192', 'adopted',
   '{"inclusions":{"operator":"or","rules":[{"event_sources":[{"type":"pixel","id":28370453785913523}],"retention_seconds":15552000,"filter":{"operator":"and","filters":[{"field":"url","operator":"i_contains","value":""}]},"template":"ALL_VISITORS"}]}}',
   '2026-08-15 09:53:22+00'),

  ('price_seen', 1, 'chapter அ · web · saw a price, did not book · v1', 'retarget',
   'Picked a meeting point and saw the price, then left without submitting a form or paying. The sharpest intent signal the site sends.',
   '{"inclusions":{"operator":"or","rules":[
      {"event_sources":[{"type":"pixel","id":"28370453785913523"}],"retention_seconds":2592000,"template":"VISITORS_BY_URL",
       "filter":{"operator":"and","filters":[{"field":"event","operator":"eq","value":"ReachedPricing"}]}}]},
     "exclusions":{"operator":"or","rules":[
      {"event_sources":[{"type":"pixel","id":"28370453785913523"}],"retention_seconds":15552000,"template":"VISITORS_BY_URL",
       "filter":{"operator":"and","filters":[{"field":"event","operator":"eq","value":"Purchase"}]}},
      {"event_sources":[{"type":"pixel","id":"28370453785913523"}],"retention_seconds":2592000,"template":"VISITORS_BY_URL",
       "filter":{"operator":"and","filters":[{"field":"event","operator":"eq","value":"Lead"}]}}]}}',
   'draft', null, 'registry', null, null),

  ('dates_opened', 1, 'chapter அ · web · opened dates, left before the price · v1', 'retarget',
   'Opened the date calendar but left before any price was shown. Disjoint from "saw a price" by construction.',
   '{"inclusions":{"operator":"or","rules":[
      {"event_sources":[{"type":"pixel","id":"28370453785913523"}],"retention_seconds":2592000,"template":"VISITORS_BY_URL",
       "filter":{"operator":"and","filters":[{"field":"event","operator":"eq","value":"AddToCart"}]}}]},
     "exclusions":{"operator":"or","rules":[
      {"event_sources":[{"type":"pixel","id":"28370453785913523"}],"retention_seconds":2592000,"template":"VISITORS_BY_URL",
       "filter":{"operator":"and","filters":[{"field":"event","operator":"eq","value":"ReachedPricing"}]}},
      {"event_sources":[{"type":"pixel","id":"28370453785913523"}],"retention_seconds":15552000,"template":"VISITORS_BY_URL",
       "filter":{"operator":"and","filters":[{"field":"event","operator":"eq","value":"Purchase"}]}},
      {"event_sources":[{"type":"pixel","id":"28370453785913523"}],"retention_seconds":2592000,"template":"VISITORS_BY_URL",
       "filter":{"operator":"and","filters":[{"field":"event","operator":"eq","value":"Lead"}]}}]}}',
   'draft', null, 'registry', null, null),

  ('plan_viewed', 1, 'chapter அ · web · read a plan, never opened dates · v1', 'retarget',
   'Opened a plan page but never opened its dates. The coolest tier, disjoint from the two above.',
   '{"inclusions":{"operator":"or","rules":[
      {"event_sources":[{"type":"pixel","id":"28370453785913523"}],"retention_seconds":2592000,"template":"VISITORS_BY_URL",
       "filter":{"operator":"and","filters":[{"field":"event","operator":"eq","value":"ViewContent"}]}}]},
     "exclusions":{"operator":"or","rules":[
      {"event_sources":[{"type":"pixel","id":"28370453785913523"}],"retention_seconds":2592000,"template":"VISITORS_BY_URL",
       "filter":{"operator":"and","filters":[{"field":"event","operator":"eq","value":"AddToCart"}]}},
      {"event_sources":[{"type":"pixel","id":"28370453785913523"}],"retention_seconds":15552000,"template":"VISITORS_BY_URL",
       "filter":{"operator":"and","filters":[{"field":"event","operator":"eq","value":"Purchase"}]}},
      {"event_sources":[{"type":"pixel","id":"28370453785913523"}],"retention_seconds":2592000,"template":"VISITORS_BY_URL",
       "filter":{"operator":"and","filters":[{"field":"event","operator":"eq","value":"Lead"}]}}]}}',
   'draft', null, 'registry', null, null),

  ('top_engaged', 1, 'chapter அ · web · top 25% by time on site · v1', 'seed',
   'The top quarter of visitors by time on site over 180 days, buyers included. A lookalike seed for while the customer lists are too small to seed one. Whether Meta can measure time on a single-page app like ours is unverified; its size will say.',
   '{"inclusions":{"operator":"or","rules":[
      {"event_sources":[{"type":"pixel","id":"28370453785913523"}],"retention_seconds":15552000,"template":"TOP_TIME_SPENDERS",
       "filter":{"operator":"and","filters":[{"field":"url","operator":"i_contains","value":""}]},
       "aggregation":{"type":"time_spent","method":"percentile","operator":"in_range","value":{"from":75,"to":100}}}]}}',
   'draft', null, 'registry', null, null)
on conflict (key, version) do nothing;
