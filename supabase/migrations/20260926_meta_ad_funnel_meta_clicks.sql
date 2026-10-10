-- "Clicked on Meta" above "Landed on our site", per ad
-- =============================================================================
-- Cloud audit OPP-5 (CLOUD-META-OPPORTUNITIES.md), built 2026-09-26 at the
-- owner's request.
--
-- WHY. Mobile-first Indian traffic on slow networks, inside Instagram's in-app
-- browser, loses people between tapping the ad and seeing the page. Until now
-- nothing separated "the ad failed" from "the page never loaded": Meta's link
-- clicks lived in get_meta_ads_performance, our own "Landed" here, in two tables
-- on the page with nothing lining them up.
--
-- WHAT CHANGES (additive — every existing key keeps its meaning):
--   * top level `meta_clicks`: Meta's link clicks, outbound clicks and Meta's
--     own landing-page-view count for the window, beside our landed sessions.
--   * per ad: the same three Meta numbers, plus `pct_click_to_landed`.
--   * per_ad now ALSO lists an ad that Meta says was clicked but that produced
--     no session on our side at all. That is precisely the case this row exists
--     for (page never loaded, or the click arrived without {{ad.id}}), and the
--     old query — built from our sessions outward — could never show it.
--
-- UNITS. Clicks and sessions are different units: one person can tap twice, and
-- one session can hold several taps. The ratio is labelled as a ratio of two
-- different counts on the page, never as "% of people". Meta's own
-- landing_page_view is included because it is the closest Meta-side twin of our
-- "Landed" and diverging from it says something too (our page_view firing late,
-- or Meta counting a load we never recorded).
--
-- Reads only meta_ad_daily, which already stores inline_link_clicks,
-- outbound_clicks and Meta's raw `actions` array — no sync change, no redeploy,
-- and it works backwards over every day already synced.

create or replace function public.get_meta_ad_funnel(
  p_since date default (current_date - 29),
  p_until date default current_date,
  p_ad_id text default null
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $function$
with
steps(step, ord, label, types) as (
  values
    ('landed',         1, 'Landed',              array['page_view']::text[]),
    ('viewed_plan',    2, 'Opened a plan',       array['event_selected']::text[]),
    ('opened_dates',   3, 'Opened the calendar', array['calendar_opened']::text[]),
    ('picked_date',    4, 'Picked a date',       array['date_selected']::text[]),
    ('saw_price',      5, 'Saw the price',       array['reached_pricing']::text[]),
    ('acted_on_price', 6, 'Acted on the price',
       array['book_cta_clicked','contact_cta_clicked','pricing_cta_clicked']::text[]),
    ('became_lead',    7, 'Became a lead',
       array['application_submitted','details_form_submitted']::text[])
),
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
  select
    d.ad_id,
    max(d.ad_name) as ad_name,
    sum(d.spend)::numeric(12,2) as spend,
    sum(coalesce(d.inline_link_clicks, 0)) as link_clicks,
    sum(coalesce(d.outbound_clicks, 0))    as outbound_clicks,
    -- Meta's own "landing page view": the click that waited for the page to
    -- load. Summed out of the raw actions array kept on every row.
    sum(coalesce((
      select sum((a->>'value')::numeric)
        from jsonb_array_elements(case when jsonb_typeof(d.actions) = 'array' then d.actions else '[]'::jsonb end) a
       where a->>'action_type' = 'landing_page_view'
    ), 0)) as landing_page_views
  from public.meta_ad_daily d
  where d.date_start between p_since and p_until
    and (p_ad_id is null or d.ad_id = p_ad_id)
  group by d.ad_id
),
-- Every ad that either brought a session OR was clicked on Meta.
ads as (
  select ad_id from per_ad
  union
  select ad_id from ad_spend where link_clicks > 0
)
select case when public.is_admin_strict() then jsonb_build_object(
  'since', p_since,
  'until', p_until,
  'ad_id', p_ad_id,
  'entry_sessions', (select sessions from entry),
  -- NULL link_clicks = no Meta rows at all in the window (nothing synced or no
  -- spend), which the page must not show as "0 clicks".
  'meta_clicks', jsonb_build_object(
    'link_clicks',        (select sum(link_clicks) from ad_spend),
    'outbound_clicks',    (select sum(outbound_clicks) from ad_spend),
    'landing_page_views', (select sum(landing_page_views) from ad_spend),
    'landed_sessions',    (select sessions from by_step where step = 'landed')
  ),
  'steps', coalesce((
    select jsonb_agg(jsonb_build_object(
      'step', step,
      'label', label,
      'sessions', sessions,
      'pct_of_entry', case when (select sessions from entry) > 0
                           then round(100.0 * sessions / (select sessions from entry), 1) end,
      'lost_from_prev', case
        when prev_sessions is null then null
        when prev_sessions >= sessions then prev_sessions - sessions
      end
    ) order by ord)
    from by_step_seq
  ), '[]'::jsonb),
  'per_ad', coalesce((
    select jsonb_agg(jsonb_build_object(
      'ad_id', a.ad_id,
      'ad_name', s.ad_name,
      'spend', coalesce(s.spend, 0),
      'sessions', coalesce(p.sessions, 0),
      'landed', coalesce(p.landed, 0),
      'viewed_plan', coalesce(p.viewed_plan, 0),
      'opened_dates', coalesce(p.opened_dates, 0),
      'saw_price', coalesce(p.saw_price, 0),
      'acted_on_price', coalesce(p.acted_on_price, 0),
      'became_lead', coalesce(p.became_lead, 0),
      'meta_link_clicks', s.link_clicks,
      'meta_outbound_clicks', s.outbound_clicks,
      'meta_landing_page_views', s.landing_page_views,
      -- Landed SESSIONS per Meta LINK CLICK — two different units, see header.
      'pct_click_to_landed', case when coalesce(s.link_clicks, 0) > 0
                                  then round(100.0 * coalesce(p.landed, 0) / s.link_clicks, 1) end,
      'pct_reached_price', case when coalesce(p.sessions, 0) > 0
                                then round(100.0 * p.saw_price / p.sessions, 1) end,
      'pct_price_to_lead', case when coalesce(p.saw_price, 0) > 0
                                then round(100.0 * p.became_lead / p.saw_price, 1) end,
      'cost_per_session', case when coalesce(s.spend,0) > 0 and coalesce(p.sessions, 0) > 0
                               then round(s.spend / p.sessions, 2) end
    ) order by coalesce(p.sessions, 0) desc, coalesce(s.link_clicks, 0) desc)
    from ads a
    left join per_ad p on p.ad_id = a.ad_id
    left join ad_spend s on s.ad_id = a.ad_id
  ), '[]'::jsonb),
  'diagnostics', jsonb_build_object(
    'capture_live_since', (
      select min(created_at) from public.flow_analytics where attribution is not null
    ),
    'tagged_rows_in_window', (
      select count(*) from public.flow_analytics f
      where (f.created_at at time zone 'Asia/Kolkata')::date between p_since and p_until
        and f.attribution is not null
    ),
    'tagged_sessions_without_ad_id', (
      select count(distinct f.session_id) from public.flow_analytics f
      where (f.created_at at time zone 'Asia/Kolkata')::date between p_since and p_until
        and f.attribution is not null
        and coalesce(f.attribution->>'utm_content','') !~ '^[0-9]{6,}$'
    ),
    'all_sessions_in_window', (
      select count(distinct f.session_id) from public.flow_analytics f
      where (f.created_at at time zone 'Asia/Kolkata')::date between p_since and p_until
    )
  )
) end;
$function$;

revoke all on function public.get_meta_ad_funnel(date, date, text) from public, anon, authenticated;
grant execute on function public.get_meta_ad_funnel(date, date, text) to authenticated, service_role;
