-- Delivery settings, with history: on/off state, budget, objective and bid
-- strategy for every campaign, ad set and ad.
--
-- WHY THIS EXISTS
-- Meta's "Ad Campaign Management" doc (META-ADS-HANDOFF.md §23) is about
-- changing exactly these settings, and every one is overwritten in place: edit a
-- budget or switch something off and the previous value is gone. Nothing here
-- recorded them. meta-ads-sync never read /campaigns, meta_adset_config keeps
-- only the latest effective_status, and meta_ad_daily.effective_status is always
-- NULL. Three questions were therefore unanswerable, and cannot be backfilled:
--
--   1. What was the budget on date D? On this account the budget lives on the
--      CAMPAIGN (₹95.76/day), not the ad set.
--   2. When was anything switched off and on? A pause of 7+ days restarts
--      learning (Meta help 316478108955072). meta_adset_learning_history can
--      show a restart, not what caused it.
--   3. What is switched on but not running? status ACTIVE while effective_status
--      says PENDING_BILLING_INFO, DISAPPROVED, WITH_ISSUES... It spends nothing,
--      so no spend guardrail can see it.
--
-- Founder, 2026-09-17: "build it, show it on the page, no alerts". So nothing
-- here pushes. get_meta_delivery_status() feeds Growth ▸ Ads.
--
-- status vs effective_status: `status` is what someone SET (ACTIVE, PAUSED,
-- ARCHIVED, DELETED). `effective_status` is what is HAPPENING, which also
-- reflects parents, review and billing. Pausing a campaign turns every ad under
-- it CAMPAIGN_PAUSED while the ads' own status stays ACTIVE. Both are stored.
--
-- Relationship to meta_adset_config: that table is about what an ad set
-- OPTIMISES for and WHO it targets, plus learning. This layer is on/off and
-- money, at all three levels. The overlap (an ad set's budget and
-- effective_status) is deliberate, so one query answers "what was switched on
-- and funded" without mixing levels.

-- ---------------------------------------------------------------------------
-- Current state, one row per object.
-- ---------------------------------------------------------------------------
create table if not exists public.meta_delivery_objects (
  object_id        text primary key,
  level            text not null check (level in ('campaign', 'adset', 'ad')),
  name             text,
  campaign_id      text,
  adset_id         text,
  status           text,
  effective_status text,
  objective        text,
  bid_strategy     text,
  -- RUPEES. Meta sends minor units (paise, §9); converted on the way in.
  daily_budget     numeric,
  lifetime_budget  numeric,
  spend_cap        numeric,
  raw              jsonb,
  first_seen_at    timestamptz not null default now(),
  last_seen_at     timestamptz not null default now(),
  -- When a tracked setting last changed (the newest history row).
  changed_at       timestamptz not null default now()
);

create index if not exists meta_delivery_objects_campaign_idx on public.meta_delivery_objects (campaign_id);
create index if not exists meta_delivery_objects_adset_idx    on public.meta_delivery_objects (adset_id);

-- ---------------------------------------------------------------------------
-- History: a row only when a tracked setting changes.
-- ---------------------------------------------------------------------------
-- Tracked: status, effective_status, objective, bid_strategy, daily_budget,
-- lifetime_budget, spend_cap. A rename alone is not a delivery change and does
-- not add a row. Times are OBSERVATION times: the sync is 6-hourly, so a change
-- happened somewhere in the six hours before first_seen_at.
create table if not exists public.meta_delivery_history (
  id               bigint generated always as identity primary key,
  object_id        text not null,
  level            text not null,
  name             text,
  campaign_id      text,
  adset_id         text,
  status           text,
  effective_status text,
  objective        text,
  bid_strategy     text,
  daily_budget     numeric,
  lifetime_budget  numeric,
  spend_cap        numeric,
  first_seen_at    timestamptz not null default now(),
  last_seen_at     timestamptz not null default now()
);

create index if not exists meta_delivery_history_object_idx on public.meta_delivery_history (object_id, id desc);
create index if not exists meta_delivery_history_seen_idx   on public.meta_delivery_history (first_seen_at desc);

alter table public.meta_delivery_objects enable row level security;
alter table public.meta_delivery_history enable row level security;

drop policy if exists meta_delivery_objects_admin_read on public.meta_delivery_objects;
create policy meta_delivery_objects_admin_read on public.meta_delivery_objects
  for select to authenticated using (public.is_admin_strict());

drop policy if exists meta_delivery_history_admin_read on public.meta_delivery_history;
create policy meta_delivery_history_admin_read on public.meta_delivery_history
  for select to authenticated using (public.is_admin_strict());

revoke insert, update, delete, truncate on public.meta_delivery_objects from anon, authenticated;
revoke insert, update, delete, truncate on public.meta_delivery_history from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Recording a batch of objects from one level.
-- ---------------------------------------------------------------------------
-- One call per level per sync, however many objects, so the cost does not grow
-- with the number of ads. Parsed defensively and compared in SQL: key order and
-- string-vs-number differences in Meta's JSON never count as a change.
--
-- SERVICE ROLE ONLY: a founder gate would return nothing to the cron (§6).
create or replace function public.record_delivery_states(p_level text, p_objects jsonb)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v           jsonb;
  v_id        text;
  v_name      text;
  v_campaign  text;
  v_adset     text;
  v_status    text;
  v_eff       text;
  v_objective text;
  v_bid       text;
  v_daily     numeric;
  v_life      numeric;
  v_cap       numeric;
  v_prev      public.meta_delivery_history%rowtype;
  v_changes   integer := 0;
begin
  if p_level not in ('campaign', 'adset', 'ad') then
    raise exception 'record_delivery_states: unknown level %', p_level;
  end if;

  for v in
    select value from jsonb_array_elements(
      case when jsonb_typeof(p_objects) = 'array' then p_objects else '[]'::jsonb end)
  loop
    v_id := nullif(btrim(v->>'id'), '');
    continue when v_id is null;

    v_name      := nullif(btrim(v->>'name'), '');
    v_status    := nullif(upper(btrim(v->>'status')), '');
    v_eff       := nullif(upper(btrim(v->>'effective_status')), '');
    v_objective := nullif(upper(btrim(v->>'objective')), '');
    v_bid       := nullif(upper(btrim(v->>'bid_strategy')), '');
    -- Minor units in, rupees out. Anything that is not a whole number of paise
    -- is not trusted as money and becomes NULL.
    v_daily := case when btrim(v->>'daily_budget')    ~ '^[0-9]{1,15}$' then round((v->>'daily_budget')::numeric / 100, 2) end;
    v_life  := case when btrim(v->>'lifetime_budget') ~ '^[0-9]{1,15}$' then round((v->>'lifetime_budget')::numeric / 100, 2) end;
    v_cap   := case when btrim(v->>'spend_cap')       ~ '^[0-9]{1,15}$' then round((v->>'spend_cap')::numeric / 100, 2) end;
    v_campaign := case when p_level = 'campaign' then v_id else nullif(btrim(v->>'campaign_id'), '') end;
    v_adset    := case p_level when 'adset' then v_id when 'ad' then nullif(btrim(v->>'adset_id'), '') end;

    select * into v_prev
      from public.meta_delivery_history
     where object_id = v_id
     order by id desc
     limit 1;

    if found and (v_prev.status, v_prev.effective_status, v_prev.objective, v_prev.bid_strategy,
                  v_prev.daily_budget, v_prev.lifetime_budget, v_prev.spend_cap)
                 is not distinct from
                 (v_status, v_eff, v_objective, v_bid, v_daily, v_life, v_cap) then
      update public.meta_delivery_history
         set last_seen_at = now(), name = coalesce(v_name, name)
       where id = v_prev.id;

      update public.meta_delivery_objects
         set name = v_name, campaign_id = v_campaign, adset_id = v_adset,
             raw = v, last_seen_at = now()
       where object_id = v_id;
      -- History exists but the current row does not (e.g. removed by hand):
      -- recreate it rather than leave the object invisible to the panel.
      if not found then
        insert into public.meta_delivery_objects
          (object_id, level, name, campaign_id, adset_id, status, effective_status, objective,
           bid_strategy, daily_budget, lifetime_budget, spend_cap, raw)
        values
          (v_id, p_level, v_name, v_campaign, v_adset, v_status, v_eff, v_objective,
           v_bid, v_daily, v_life, v_cap, v);
      end if;
    else
      insert into public.meta_delivery_history
        (object_id, level, name, campaign_id, adset_id, status, effective_status, objective,
         bid_strategy, daily_budget, lifetime_budget, spend_cap)
      values
        (v_id, p_level, v_name, v_campaign, v_adset, v_status, v_eff, v_objective,
         v_bid, v_daily, v_life, v_cap);

      insert into public.meta_delivery_objects
        (object_id, level, name, campaign_id, adset_id, status, effective_status, objective,
         bid_strategy, daily_budget, lifetime_budget, spend_cap, raw)
      values
        (v_id, p_level, v_name, v_campaign, v_adset, v_status, v_eff, v_objective,
         v_bid, v_daily, v_life, v_cap, v)
      on conflict (object_id) do update
        set level = excluded.level, name = excluded.name,
            campaign_id = excluded.campaign_id, adset_id = excluded.adset_id,
            status = excluded.status, effective_status = excluded.effective_status,
            objective = excluded.objective, bid_strategy = excluded.bid_strategy,
            daily_budget = excluded.daily_budget, lifetime_budget = excluded.lifetime_budget,
            spend_cap = excluded.spend_cap, raw = excluded.raw,
            last_seen_at = now(), changed_at = now();

      v_changes := v_changes + 1;
    end if;
  end loop;

  return v_changes;
end;
$$;

revoke all on function public.record_delivery_states(text, jsonb) from public, anon, authenticated;
grant execute on function public.record_delivery_states(text, jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- The founder-facing reader.
-- ---------------------------------------------------------------------------
-- One jsonb (PostgREST's 1,000-row cap never truncates it):
--   objects            current state of every campaign, ad set and ad that is
--                      not ARCHIVED or DELETED, with `blocked` set when it is
--                      switched on (itself and every parent) but not ACTIVE
--   blocked            just those, the "switched on but not running" list
--   changes            the newest 40 changes across the account, each with the
--                      fields that moved and, for a switch back on, the days off
--   learning_restarts  each ad set's recorded learning restart, with the
--                      delivery changes observed within 12 hours of it
--   capture_since, last_read_at
create or replace function public.get_meta_delivery_status()
returns jsonb
language sql
stable security definer
set search_path to 'public'
as $function$
with
obj as (
  select o.*,
         c.status as campaign_status,
         s.status as adset_status
    from public.meta_delivery_objects o
    left join public.meta_delivery_objects c on c.object_id = o.campaign_id and c.level = 'campaign'
    left join public.meta_delivery_objects s on s.object_id = o.adset_id    and s.level = 'adset'
),
flagged as (
  select obj.*,
         -- Switched on at every level that exists, yet not delivering. A parent
         -- paused on purpose is NOT flagged: that is a choice, not a blockage.
         (    obj.status = 'ACTIVE'
          and coalesce(obj.effective_status, '') <> 'ACTIVE'
          and obj.effective_status is not null
          and (obj.level = 'campaign' or coalesce(obj.campaign_status, 'ACTIVE') = 'ACTIVE')
          and (obj.level <> 'ad'      or coalesce(obj.adset_status,    'ACTIVE') = 'ACTIVE')
         ) as blocked
    from obj
),
hist as (
  select h.*,
         lag(h.status)           over w as p_status,
         lag(h.effective_status) over w as p_eff,
         lag(h.objective)        over w as p_objective,
         lag(h.bid_strategy)     over w as p_bid,
         lag(h.daily_budget)     over w as p_daily,
         lag(h.lifetime_budget)  over w as p_life,
         lag(h.spend_cap)        over w as p_cap,
         lag(h.first_seen_at)    over w as p_seen,
         row_number()            over w as n
    from public.meta_delivery_history h
  window w as (partition by h.object_id order by h.id)
),
described as (
  select hist.*,
         case when n = 1 then '[]'::jsonb else coalesce((
           select jsonb_agg(jsonb_build_object('field', f.field, 'from', f.old, 'to', f.new))
             from (values
               ('status',           p_status,          status),
               ('effective_status', p_eff,             effective_status),
               ('objective',        p_objective,       objective),
               ('bid_strategy',     p_bid,             bid_strategy),
               ('daily_budget',     p_daily::text,     daily_budget::text),
               ('lifetime_budget',  p_life::text,      lifetime_budget::text),
               ('spend_cap',        p_cap::text,       spend_cap::text)
             ) as f(field, old, new)
            where f.old is distinct from f.new
         ), '[]'::jsonb) end as moved,
         -- Days between switching off and back on, as observed (±6 h each end).
         case when p_status = 'PAUSED' and status = 'ACTIVE'
              then round((extract(epoch from first_seen_at - p_seen) / 86400)::numeric, 1) end as off_for_days
    from hist
),
change_json as (
  select d.object_id, d.level, d.campaign_id, d.adset_id, d.first_seen_at,
         jsonb_build_object(
           'object_id', d.object_id,
           'level', d.level,
           'name', coalesce(d.name, (select o.name from public.meta_delivery_objects o where o.object_id = d.object_id)),
           'seen_at', d.first_seen_at,
           'first_sighting', d.n = 1,
           -- A first sighting AFTER capture began is a newly created object (e.g. a
           -- new ad, which restarts learning). One at capture start is just the
           -- initial inventory.
           'new_object', d.n = 1 and d.first_seen_at > (
             select min(x.first_seen_at) from public.meta_delivery_history x) + interval '1 hour',
           'status', d.status,
           'effective_status', d.effective_status,
           'daily_budget', d.daily_budget,
           'lifetime_budget', d.lifetime_budget,
           'changes', d.moved,
           'off_for_days', d.off_for_days
         ) as j
    from described d
)
select case when public.is_admin_strict() then jsonb_build_object(
  'objects', coalesce((
    select jsonb_agg(jsonb_build_object(
      'object_id', f.object_id,
      'level', f.level,
      'name', f.name,
      'campaign_id', f.campaign_id,
      'adset_id', f.adset_id,
      'status', f.status,
      'effective_status', f.effective_status,
      'objective', f.objective,
      'bid_strategy', f.bid_strategy,
      'daily_budget', f.daily_budget,
      'lifetime_budget', f.lifetime_budget,
      'spend_cap', f.spend_cap,
      'changed_at', f.changed_at,
      'last_seen_at', f.last_seen_at,
      'blocked', f.blocked
    ) order by case f.level when 'campaign' then 0 when 'adset' then 1 else 2 end, f.name)
    from flagged f
    where coalesce(f.status, '') not in ('ARCHIVED', 'DELETED')
  ), '[]'::jsonb),
  'blocked', coalesce((
    select jsonb_agg(jsonb_build_object(
      'object_id', f.object_id, 'level', f.level, 'name', f.name,
      'effective_status', f.effective_status, 'since', f.changed_at
    ) order by f.changed_at desc)
    from flagged f where f.blocked
  ), '[]'::jsonb),
  'changes', coalesce((
    select jsonb_agg(c.j order by c.first_seen_at desc)
    from (select * from change_json order by first_seen_at desc limit 40) c
  ), '[]'::jsonb),
  'learning_restarts', coalesce((
    select jsonb_agg(jsonb_build_object(
      'adset_id', r.adset_id,
      'edit_at', r.edit_at,
      'nearby_changes', coalesce((
        select jsonb_agg(c.j order by c.first_seen_at)
          from change_json c
         where (c.object_id = r.adset_id or c.adset_id = r.adset_id
                or c.object_id = (select o.campaign_id from public.meta_delivery_objects o where o.object_id = r.adset_id))
           and (not (c.j->>'first_sighting')::boolean or (c.j->>'new_object')::boolean)
           and c.first_seen_at between r.edit_at - interval '12 hours' and r.edit_at + interval '12 hours'
      ), '[]'::jsonb)
    ) order by r.edit_at desc)
    from (
      select distinct adset_id, last_sig_edit_at as edit_at
        from public.meta_adset_learning_history
       where last_sig_edit_at is not null
    ) r
  ), '[]'::jsonb),
  'capture_since', (select min(first_seen_at) from public.meta_delivery_history),
  'last_read_at',  (select max(last_seen_at)  from public.meta_delivery_objects)
) end;
$function$;

revoke all on function public.get_meta_delivery_status() from public, anon;
grant execute on function public.get_meta_delivery_status() to authenticated;
