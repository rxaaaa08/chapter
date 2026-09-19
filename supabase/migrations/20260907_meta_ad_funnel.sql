-- get_meta_ad_funnel — where an ad's traffic drops out, not just whether it bought.
--
-- WHY THIS EXISTS
-- get_meta_ads_performance answers "what did this ad cost per booking". When the
-- answer is "nothing booked", it cannot say why, and the two causes need
-- opposite fixes: an ad whose visitors never scroll past the hero has a creative
-- problem; an ad whose visitors reach the price and stop has a price or an
-- audience problem. Both read as zero bookings. This reads the funnel rows that
-- 20260907_flow_analytics_attribution.sql started stamping with a source.
--
-- STEPS ARE COUNTED INDEPENDENTLY, NOT AS A STRICT FUNNEL.
-- Each step counts the DISTINCT SESSIONS that fired it, and a later step can
-- legitimately out-count an earlier one: a link straight to an event page skips
-- the plan list, so 'viewed_plan' can be lower than 'saw_price' for the same
-- traffic. Presenting that as a strict nested funnel would invent a "negative
-- drop-off" that never happened. Read each row as "how many sessions got this
-- far", and read the ordering as the intended path, not a guarantee.
--
-- Counting distinct SESSIONS (not rows) is also what makes the ~2% of funnel
-- rows that log the same step twice within a second harmless.
--
-- Units: sessions divided by sessions, everywhere. Mixing sessions with row
-- counts is what produced a >100% form-open rate in the open-event funnel once
-- already (see the open-event-analytics-units note).
create or replace function public.get_meta_ad_funnel(
  p_since  date default (current_date - 29),
  p_until  date default current_date,
  p_ad_id  text default null      -- null = every ad combined
) returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
with
-- The intended path through the product. Both booking flows are folded into one
-- ladder so an invite event and an open event read the same shape:
-- application_submitted and details_form_submitted are the same moment.
steps(step, ord, label, types) as (
  values
    ('landed',         1, 'Landed',              array['page_view']::text[]),
    ('viewed_plan',    2, 'Opened a plan',       array['event_selected']::text[]),
    ('opened_dates',   3, 'Opened the calendar', array['calendar_opened']::text[]),
    ('picked_date',    4, 'Picked a date',       array['date_selected']::text[]),
    -- The price becomes visible on choosing a meeting point, not a date.
    ('saw_price',      5, 'Saw the price',       array['reached_pricing']::text[]),
    ('acted_on_price', 6, 'Acted on the price',
       array['book_cta_clicked','contact_cta_clicked','pricing_cta_clicked']::text[]),
    ('became_lead',    7, 'Became a lead',
       array['application_submitted','details_form_submitted']::text[])
),
-- Funnel rows in the window that carry a Meta AD id. {{ad.id}} always expands to
-- digits; organic tags like 'link_in_bio' are real attribution but not ad ids and
-- must not be counted as paid traffic. Same regex as get_meta_ads_performance.
win as (
  select
    f.session_id,
    f.event_type,
    f.attribution->>'utm_content' as ad_id
  from public.flow_analytics f
  where (f.created_at at time zone 'Asia/Kolkata')::date between p_since and p_until
    and f.attribution->>'utm_content' ~ '^[0-9]{6,}$'
    and (p_ad_id is null or f.attribution->>'utm_content' = p_ad_id)
),
entry as (select count(distinct session_id) as sessions from win),
by_step as (
  select
    s.step, s.ord, s.label,
    count(distinct w.session_id) as sessions
  from steps s
  left join win w on w.event_type = any(s.types)
  group by s.step, s.ord, s.label
),
-- lag() lives here rather than inline below: a window function cannot be nested
-- inside an aggregate (jsonb_agg), which is a hard Postgres restriction.
by_step_seq as (
  select
    step, ord, label, sessions,
    lag(sessions) over (order by ord) as prev_sessions
  from by_step
),
per_ad as (
  select
    w.ad_id,
    count(distinct w.session_id) as sessions,
    count(distinct w.session_id) filter (where w.event_type = 'page_view')       as landed,
    count(distinct w.session_id) filter (where w.event_type = 'event_selected')  as viewed_plan,
    count(distinct w.session_id) filter (where w.event_type = 'calendar_opened') as opened_dates,
    count(distinct w.session_id) filter (where w.event_type = 'reached_pricing') as saw_price,
    count(distinct w.session_id) filter (
      where w.event_type in ('book_cta_clicked','contact_cta_clicked','pricing_cta_clicked')
    ) as acted_on_price,
    count(distinct w.session_id) filter (
      where w.event_type in ('application_submitted','details_form_submitted')
    ) as became_lead
  from win w
  group by w.ad_id
),
ad_spend as (
  select ad_id, max(ad_name) as ad_name, sum(spend)::numeric(12,2) as spend
  from public.meta_ad_daily
  where date_start between p_since and p_until
  group by ad_id
)
select case when public.is_admin_strict() then jsonb_build_object(
  'since', p_since,
  'until', p_until,
  'ad_id', p_ad_id,
  'entry_sessions', (select sessions from entry),
  'steps', coalesce((
    select jsonb_agg(jsonb_build_object(
      'step', step,
      'label', label,
      'sessions', sessions,
      -- Share of the traffic this ad actually delivered. Null rather than 0 when
      -- there is no traffic at all: "nobody got here" and "nobody came" are
      -- different findings and only one of them is about the ad.
      'pct_of_entry', case when (select sessions from entry) > 0
                           then round(100.0 * sessions / (select sessions from entry), 1) end,
      -- Sessions lost since the previous step. Null on the first step, and null
      -- rather than a negative number when a later step out-counts an earlier
      -- one — see the header: the ladder is the intended path, not a guarantee.
      'lost_from_prev', case
        when prev_sessions is null then null
        when prev_sessions >= sessions then prev_sessions - sessions
      end
    ) order by ord)
    from by_step_seq
  ), '[]'::jsonb),
  'per_ad', coalesce((
    select jsonb_agg(jsonb_build_object(
      'ad_id', p.ad_id,
      'ad_name', s.ad_name,
      'spend', coalesce(s.spend, 0),
      'sessions', p.sessions,
      'landed', p.landed,
      'viewed_plan', p.viewed_plan,
      'opened_dates', p.opened_dates,
      'saw_price', p.saw_price,
      'acted_on_price', p.acted_on_price,
      'became_lead', p.became_lead,
      -- The two rates that separate a creative problem from a price problem.
      'pct_reached_price', case when p.sessions > 0
                                then round(100.0 * p.saw_price / p.sessions, 1) end,
      'pct_price_to_lead', case when p.saw_price > 0
                                then round(100.0 * p.became_lead / p.saw_price, 1) end,
      'cost_per_session', case when coalesce(s.spend,0) > 0 and p.sessions > 0
                               then round(s.spend / p.sessions, 2) end
    ) order by p.sessions desc)
    from per_ad p
    left join ad_spend s on s.ad_id = p.ad_id
  ), '[]'::jsonb),
  'diagnostics', jsonb_build_object(
    -- THE important one. Everything above reads 0 both when no ad traffic has
    -- arrived and when the client that stamps the source has not shipped yet.
    -- Those demand opposite responses, so the distinction is stated outright
    -- rather than left to be inferred from an empty table — the same mistake
    -- meta_ads_sync_log exists to prevent on the spend side.
    -- NULL here means: not one funnel row has ever carried a source.
    'capture_live_since', (
      select min(created_at) from public.flow_analytics where attribution is not null
    ),
    'tagged_rows_in_window', (
      select count(*) from public.flow_analytics f
      where (f.created_at at time zone 'Asia/Kolkata')::date between p_since and p_until
        and f.attribution is not null
    ),
    -- Sessions that arrived tagged but with no ad id: creator links, organic
    -- utm, link-in-bio. Real traffic, deliberately excluded from everything
    -- above. Non-zero here while ads run means {{ad.id}} is missing on an ad.
    'tagged_sessions_without_ad_id', (
      select count(distinct f.session_id) from public.flow_analytics f
      where (f.created_at at time zone 'Asia/Kolkata')::date between p_since and p_until
        and f.attribution is not null
        and coalesce(f.attribution->>'utm_content','') !~ '^[0-9]{6,}$'
    ),
    -- All sessions in the window, tagged or not, for scale.
    'all_sessions_in_window', (
      select count(distinct f.session_id) from public.flow_analytics f
      where (f.created_at at time zone 'Asia/Kolkata')::date between p_since and p_until
    )
  )
) end;
$function$;

comment on function public.get_meta_ad_funnel(date, date, text) is
  'Per-ad funnel drop-off from flow_analytics.attribution. Steps count distinct '
  'sessions independently, NOT as a strict nested funnel. Founder-gated: returns '
  'NULL for anyone who is not is_admin_strict().';

revoke all on function public.get_meta_ad_funnel(date, date, text) from public, anon;
grant execute on function public.get_meta_ad_funnel(date, date, text) to authenticated;
