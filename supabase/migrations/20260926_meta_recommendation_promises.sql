-- Keep Meta's promise next to each recommendation (cloud audit OPP-8, 2026-09-26)
-- =============================================================================
-- The recommendation scorecard (Layer 5, 20260907) scores Meta's advice against
-- our cash. It never kept what Meta PROMISED, and recommendations expire, so
-- the promise could not be recovered afterwards. Meta returns it only when asked:
-- `recommendation_content` ("to include the lift_estimate and body strings,
-- which are omitted by default"), plus `opportunity_score_lift`.
--
-- SOURCE CHANGE, measured 2026-09-26: meta_ads_events holds ZERO
-- ad_recommendations rows — the webhook has never delivered one. So the promise
-- is captured by a DAILY READ of GET act_<id>/recommendations in meta-ads-sync,
-- and those rows also feed the scorecard (deduped against webhook rows). Stored
-- silently; nothing here pushes. Read-only against Meta: listing
-- recommendations never applies one (applying is a POST we never make, M11).
--
-- Opportunity score on 2026-09-26: 100 with no recommendations — §9's "100 can
-- mean nothing to grade", not a verdict.
--
-- Scorecard built on the LIVE definition dumped 2026-09-26.

create table if not exists public.meta_recommendations (
  -- Meta's recommendation_signature when present; otherwise a hash of
  -- type + objects + recommendation_time ("for recommendations that cannot be
  -- resolved in the API, this value will not be returned").
  rec_key                       text primary key,
  signature                     text,
  rec_type                      text,
  stage                         text,
  recommendation_time           timestamptz,
  object_ids                    text[] not null default '{}',
  -- FIRST sighting is the promise that counts; later reads can reword it.
  lift_estimate_first           text,
  body_first                    text,
  opportunity_score_lift_first  numeric,
  lift_estimate_last            text,
  url                           text,
  raw_first                     jsonb,
  raw_last                      jsonb,
  first_seen_at                 timestamptz not null default now(),
  last_seen_at                  timestamptz not null default now()
);

comment on table public.meta_recommendations is
  'Every Meta performance recommendation seen by the daily read, with Meta''s '
  'promised lift as first seen. Feeds get_meta_recommendation_scorecard. Never applied.';

alter table public.meta_recommendations enable row level security;
revoke all on public.meta_recommendations from anon, authenticated;

-- p_rows: the flattened `recommendations` arrays from Meta's reply.
create or replace function public.record_meta_recommendations(p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_row  jsonb;
  v_key  text;
  v_ids  text[];
  v_time timestamptz;
  v_new  int := 0;
  v_seen int := 0;
  v_lift text;
  v_pts  numeric;
begin
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    return jsonb_build_object('seen', 0, 'new', 0);
  end if;

  for v_row in select * from jsonb_array_elements(p_rows)
  loop
    v_seen := v_seen + 1;
    v_ids := coalesce((select array_agg(x order by x) from jsonb_array_elements_text(
               case when jsonb_typeof(v_row -> 'object_ids') = 'array' then v_row -> 'object_ids' else '[]'::jsonb end) x), '{}');
    begin
      v_time := (v_row ->> 'recommendation_time')::timestamptz;
    exception when others then v_time := null;
    end;
    v_key := coalesce(nullif(v_row ->> 'recommendation_signature', ''),
                      md5(concat_ws('|', coalesce(v_row ->> 'type', v_row ->> 'recommendation_name'),
                                    array_to_string(v_ids, ','), v_time::text)));
    v_lift := v_row #>> '{recommendation_content,lift_estimate}';
    -- Meta puts opportunity_score_lift inside recommendation_content in one
    -- example and at the top level in the other. Accept both.
    begin
      v_pts := coalesce(v_row #>> '{recommendation_content,opportunity_score_lift}',
                        v_row ->> 'opportunity_score_lift')::numeric;
    exception when others then v_pts := null;
    end;

    insert into public.meta_recommendations as t (
      rec_key, signature, rec_type, stage, recommendation_time, object_ids,
      lift_estimate_first, body_first, opportunity_score_lift_first, lift_estimate_last,
      url, raw_first, raw_last
    ) values (
      v_key, nullif(v_row ->> 'recommendation_signature', ''),
      coalesce(v_row ->> 'type', v_row ->> 'recommendation_name'),
      v_row ->> 'recommendation_stage', v_time, v_ids,
      v_lift, v_row #>> '{recommendation_content,body}', v_pts, v_lift,
      v_row ->> 'url', v_row, v_row
    )
    on conflict (rec_key) do update set
      lift_estimate_last = excluded.lift_estimate_last,
      url                = coalesce(excluded.url, t.url),
      raw_last           = excluded.raw_last,
      last_seen_at       = now(),
      -- Fill a first-sighting blank once, never overwrite a promise.
      lift_estimate_first          = coalesce(t.lift_estimate_first, excluded.lift_estimate_first),
      body_first                   = coalesce(t.body_first, excluded.body_first),
      opportunity_score_lift_first = coalesce(t.opportunity_score_lift_first, excluded.opportunity_score_lift_first);
    -- New on this read = inserted now (first_seen_at and last_seen_at both now()).
    if (select first_seen_at = last_seen_at from public.meta_recommendations where rec_key = v_key) then
      v_new := v_new + 1;
    end if;
  end loop;

  return jsonb_build_object('seen', v_seen, 'new', v_new);
end;
$function$;

revoke all on function public.record_meta_recommendations(jsonb) from public, anon, authenticated;
grant execute on function public.record_meta_recommendations(jsonb) to service_role;

CREATE OR REPLACE FUNCTION public.get_meta_recommendation_scorecard(p_window_days integer DEFAULT 14)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
with
recs as (
  select
    e.id::text as id,
    'webhook'::text as source,
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

  union all

  -- The daily read of GET act_<id>/recommendations (cloud audit OPP-8). Measured
  -- 2026-09-26: the webhook has delivered ZERO ad_recommendations events, ever,
  -- so without this the scorecard would never have a row. A recommendation the
  -- webhook ALSO delivered is counted once — the webhook row wins.
  select
    'daily:' || m.rec_key,
    'daily_read',
    m.first_seen_at,
    (m.first_seen_at at time zone 'Asia/Kolkata')::date,
    coalesce(m.rec_type, 'UNKNOWN'),
    coalesce(m.body_first, m.lift_estimate_first),
    m.stage,
    m.object_ids
  from public.meta_recommendations m
  where not exists (
    select 1 from public.meta_ads_events e
     where e.field = 'ad_recommendations'
       and coalesce(e.value->>'recommendation_type', 'UNKNOWN') = coalesce(m.rec_type, 'UNKNOWN')
       and abs(extract(epoch from e.received_at - m.first_seen_at)) < 3 * 86400
       and coalesce(
             (select array_agg(x) from jsonb_array_elements_text(e.value->'ad_object_ids') x),
             case when e.object_id is not null then array[e.object_id] else '{}'::text[] end
           ) && m.object_ids
  )
),
-- Meta's own promise for each recommendation, as it stood when first seen.
-- Recommendations expire, so this cannot be recovered later — which is the
-- whole point of keeping it: "Meta promised X; our cash showed Y".
promised as (
  select r.id as rec_id, m.lift_estimate_first, m.opportunity_score_lift_first, m.url
  from recs r
  join lateral (
    select mm.*
      from public.meta_recommendations mm
     where (r.source = 'daily_read' and 'daily:' || mm.rec_key = r.id)
        or (r.source = 'webhook'
            and coalesce(mm.rec_type, 'UNKNOWN') = r.rec_type
            and mm.object_ids && r.object_ids
            and abs(extract(epoch from mm.first_seen_at - r.received_at)) < 3 * 86400)
     order by abs(extract(epoch from mm.first_seen_at - r.received_at))
     limit 1
  ) m on true
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
    -- Ticket money only: the gateway fee each customer paid on top, at their
    -- payment method's rate, goes to PayU. Same rule as get_meta_ads_performance.
    select p.event_slug, p.phone, sum(coalesce(f.ticket_amount, p.amount)) as received
    from public.payu_payments p
    cross join lateral public.payu_fee_split(p.amount, p.payu_response->>'mode') f
    where p.status = 'success' group by 1, 2
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
    r.id, r.source, r.received_at, r.rec_type, r.rec_message, r.rec_stage,
    pr.lift_estimate_first as meta_promised,
    pr.opportunity_score_lift_first as score_points,
    pr.url as meta_url,
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
  left join promised pr on pr.rec_id = r.id
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
  -- One row per recommendation, newest first.
  'recommendations', coalesce((
    select jsonb_agg(jsonb_build_object(
      'received_at', received_at,
      'source', source,
      'type', rec_type,
      -- Meta's words at the time, e.g. "Up to 8% lower cost per result". NULL
      -- when the recommendation was never seen by the daily read.
      'meta_promised', meta_promised,
      'score_points', score_points,
      'meta_url', meta_url,
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

revoke all on function public.get_meta_recommendation_scorecard(integer) from public, anon, authenticated;
grant execute on function public.get_meta_recommendation_scorecard(integer) to authenticated, service_role;
