-- Score Meta's own recommendations against our cash.
--
-- WHY THIS CAN EXIST HERE AND ALMOST NOWHERE ELSE
-- Meta recommends a change, projects the lift itself, and then measures the
-- result with its own numbers. Recommendation and verdict come from the same
-- party, and that party is paid when you spend more — "increase your budget"
-- is the most common recommendation there is.
--
-- We have an independent measure: cost per booking from money actually
-- received. So we can keep score. A worked example of why that matters: an ad
-- going from 7 bookings at Rs 200 each to 10 at Rs 350 each is a 43% rise in
-- conversions — which Meta reports as a success — and a 75% rise in what each
-- one cost us.
--
-- WHAT IT DOES NOT CLAIM
-- We cannot see whether a recommendation was applied. This measures what
-- happened after one arrived, not what applying it caused. With one or two
-- data points that is noise, so every figure carries its sample size and the
-- panel is expected to show it.
--
-- The live definition is applied on prod under the same migration name; this
-- file is the repo copy.

create or replace function public.get_meta_recommendation_scorecard(
  p_window_days integer default 14
) returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
with
recs as (
  select
    e.id,
    e.received_at,
    (e.received_at at time zone 'Asia/Kolkata')::date          as rec_date,
    coalesce(e.value->>'recommendation_type', 'UNKNOWN')       as rec_type,
    e.value->>'recommendation_message'                         as rec_message,
    e.value->>'recommendation_stage'                           as rec_stage,
    -- ad_object_ids is an array and may name a campaign or ad set, not an ad.
    -- Fall back to the single object_id the handler extracted.
    coalesce(
      (select array_agg(x) from jsonb_array_elements_text(e.value->'ad_object_ids') x),
      case when e.object_id is not null then array[e.object_id] else '{}'::text[] end
    ) as object_ids
  from public.meta_ads_events e
  where e.field = 'ad_recommendations'
),
-- Resolve whatever Meta named down to the ads it actually covers, through the
-- spend table rather than assuming the id is always an ad.
scope as (
  select r.id as rec_id, m.ad_id
  from recs r
  join public.meta_ad_daily m
    on  m.ad_id       = any(r.object_ids)
    or  m.adset_id    = any(r.object_ids)
    or  m.campaign_id = any(r.object_ids)
  group by r.id, m.ad_id
),
-- What each ad actually produced, per day, bucketed by the CLICK day — the
-- same rule get_meta_ads_performance uses, so the two reports cannot disagree.
booked as (
  select
    a.attribution->>'utm_content' as ad_id,
    (coalesce(nullif(a.attribution->>'landed_at','')::timestamptz, a.created_at)
       at time zone 'Asia/Kolkata')::date as day,
    count(*) filter (where a.status in ('advance_paid','fully_paid'))            as bookings,
    coalesce(sum(c.received) filter (where a.status in ('advance_paid','fully_paid')), 0) as revenue
  from public.applications a
  left join (
    select p.event_slug, p.phone, sum(p.amount) as received
    from public.payu_payments p where p.status = 'success' group by 1, 2
  ) c on c.event_slug = a.event_slug and c.phone = a.phone
  where a.attribution ? 'utm_content'
    and a.attribution->>'utm_content' ~ '^[0-9]{6,}$'
  group by 1, 2
),
phased as (
  select
    r.id as rec_id,
    case when m.date_start < r.rec_date then 'before' else 'after' end as phase,
    sum(m.spend)                        as spend,
    sum(coalesce(b.bookings, 0))        as bookings,
    sum(coalesce(b.revenue, 0))         as revenue
  from recs r
  join scope s              on s.rec_id = r.id
  join public.meta_ad_daily m on m.ad_id = s.ad_id
  left join booked b        on b.ad_id = m.ad_id and b.day = m.date_start
  where m.date_start >= r.rec_date - p_window_days
    and m.date_start <  r.rec_date + p_window_days
  group by 1, 2
),
per_rec as (
  select
    r.id, r.received_at, r.rec_type, r.rec_message, r.rec_stage,
    array_length(r.object_ids, 1)                                as objects_named,
    (select count(*) from scope s where s.rec_id = r.id)         as ads_matched,
    coalesce(bef.spend, 0)::numeric(12,2)    as before_spend,
    coalesce(bef.bookings, 0)                as before_bookings,
    coalesce(aft.spend, 0)::numeric(12,2)    as after_spend,
    coalesce(aft.bookings, 0)                as after_bookings,
    coalesce(aft.revenue, 0)::numeric(12,2)  as after_revenue,
    -- Null, not zero, when there were no bookings to divide by. "We could not
    -- measure this" and "it cost nothing" are different answers.
    case when coalesce(bef.bookings,0) > 0 then round(bef.spend / bef.bookings, 2) end as before_cpb,
    case when coalesce(aft.bookings,0) > 0 then round(aft.spend / aft.bookings, 2) end as after_cpb
  from recs r
  left join phased bef on bef.rec_id = r.id and bef.phase = 'before'
  left join phased aft on aft.rec_id = r.id and aft.phase = 'after'
),
scored as (
  select *,
    case when before_cpb is not null and after_cpb is not null and before_cpb > 0
         then round(((after_cpb - before_cpb) / before_cpb) * 100, 1) end as cpb_change_pct
  from per_rec
)
select case when public.is_admin_strict() then jsonb_build_object(
  'window_days', p_window_days,
  'total_recommendations', (select count(*) from recs),
  'recommendations', coalesce((
    select jsonb_agg(jsonb_build_object(
      'received_at', received_at,
      'type', rec_type,
      'stage', rec_stage,
      'message', rec_message,
      'objects_named', objects_named,
      'ads_matched', ads_matched,
      'before_spend', before_spend, 'before_bookings', before_bookings, 'before_cost_per_booking', before_cpb,
      'after_spend', after_spend,  'after_bookings', after_bookings,   'after_cost_per_booking', after_cpb,
      'after_revenue', after_revenue,
      'cost_per_booking_change_pct', cpb_change_pct,
      -- Only meaningful once both sides have bookings. Anything else is
      -- "not measurable yet", which the caller must not render as neutral.
      'measurable', (before_cpb is not null and after_cpb is not null)
    ) order by received_at desc)
    from scored
  ), '[]'::jsonb),
  -- The point of the whole exercise: which KINDS of advice have been worth
  -- taking on this account.
  'by_type', coalesce((
    select jsonb_agg(jsonb_build_object(
      'type', rec_type,
      'times_seen', cnt,
      'measurable', measurable_cnt,
      'median_cost_per_booking_change_pct', med,
      'got_cheaper', cheaper,
      'got_dearer', dearer
    ) order by cnt desc)
    from (
      select rec_type,
             count(*)                                            as cnt,
             count(*) filter (where cpb_change_pct is not null)   as measurable_cnt,
             round(percentile_cont(0.5) within group (order by cpb_change_pct)::numeric, 1) as med,
             count(*) filter (where cpb_change_pct < 0)           as cheaper,
             count(*) filter (where cpb_change_pct > 0)           as dearer
      from scored group by rec_type
    ) t
  ), '[]'::jsonb)
) end;
$function$;

revoke all on function public.get_meta_recommendation_scorecard(integer) from public, anon;
grant execute on function public.get_meta_recommendation_scorecard(integer) to authenticated;

comment on function public.get_meta_recommendation_scorecard(integer) is
  'Founder-gated. Scores Meta''s ad recommendations against OUR cost per booking, computed from cash received. Measures what happened after a recommendation arrived — we cannot see whether it was applied — so every figure carries its sample size. Returns NULL for non-founders.';
