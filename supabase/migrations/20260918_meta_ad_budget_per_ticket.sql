-- Ad budget per ticket: what one ticket actually leaves for advertising.
--
-- WHY THIS EXISTS
-- The cost alarm fired when an ad's cost per paid ticket passed 40% OF THE
-- TICKET PRICE. The founder's rule is not a share of price, it is the money a
-- ticket leaves behind (META-ADS-HANDOFF.md §21.6):
--
--   ad budget per ticket = money the customer pays AT BOOKING − cost_per_ticket
--
-- Founder, 2026-09-17: most events are pay-at-venue, and the advance is set
-- ABOVE the event's cost on purpose so the surplus pays for the ad; the balance
-- collected at the venue is profit. He asked for one rule everywhere rather
-- than a per-plan input field, because price and cost already give the answer.
-- For a `full` payment plan the money at booking is the whole ticket; for a
-- `split` plan it is the advance.
--
-- WHY THE ADVANCE AND NOT THE WHOLE TICKET
-- The advance is the one payment kept even when the guest never arrives — 18 of
-- 28 did not at Founders Meet (§21.4). An ad inside this budget therefore cannot
-- lose money even if every buyer no-shows. Meta is still told the full ticket at
-- the advance (§21.1); that decision is untouched. True ROAS on the panel keeps
-- counting every rupee received, balances included.
--
-- 40% of price was wrong in BOTH directions on live prices (§21.6): the alarm
-- sat at ₹180 on Anna Nagar where a ticket leaves ~₹100 of ad money, and at
-- ₹1,480 on Pondy where a ticket leaves ~₹0 — so an ad could lose ₹150–400 a
-- sale without a word.
--
-- WHAT IS ADDED
--   meta_booking_prices()          the one price resolver, mirroring the server
--   threshold_mode 'pct_of_ad_budget'
--   rule cpa_over_ad_budget        replaces cpa_over_40pct (now disabled)
--   meta_ad_guardrail_breaches()   evaluates the new mode, per ad
--   get_meta_plan_ad_budgets()     per plan, for Growth ▸ Ads: ad money per
--                                  ticket and the most an ad can pay per click

-- ── The one price resolver ──────────────────────────────────────────────────
-- MIRRORS cityPrices() IN create-payu-order (~line 43), because that function
-- decides what the customer is actually charged, and this has to agree with the
-- money that really arrives. Two consequences worth knowing:
--   * A city override counts only when it is > 0, exactly as `adv > 0 ? adv :
--     planAdv` does there; a 0 or junk override falls back to the plan price.
--   * snake_case keys ONLY. meta_plan_price() (catalog, §20) reads `priceFull`
--     first, but the server never does, so a camelCase-only city would be
--     charged the plan price. This resolver has to match what is CHARGED, not
--     what the catalog advertises. §21.5 asked for these to be merged; they
--     cannot be until the catalog's camelCase read is settled, so this one
--     states its allegiance instead.
-- p_city NULL means "no booking to read a city from", and then the FIRST
-- configured city stands in, the way the plan card shows a price before anyone
-- picks a city (resolveDefaultFullPrice in src/eventPricing.ts).
create or replace function public.meta_booking_prices(
  p_payment_mode text,
  p_price_advance numeric,
  p_price_full    numeric,
  p_cities        jsonb,
  p_city_details  jsonb,
  p_city          text,
  out city        text,
  out advance     numeric,
  out full_price  numeric,
  out at_booking  numeric
) returns record
language sql
immutable
set search_path = public
as $$
  with want as (
    select coalesce(
      nullif(btrim(coalesce(p_city, '')), ''),
      (select btrim(t.c #>> '{}')
         from jsonb_array_elements(
                case when jsonb_typeof(p_cities) = 'array' then p_cities else '[]'::jsonb end
              ) with ordinality t(c, i)
        where jsonb_typeof(t.c) = 'string'
          and btrim(t.c #>> '{}') <> ''
          and lower(btrim(t.c #>> '{}')) <> 'other'
        order by t.i
        limit 1)
    ) as city
  ),
  override as (
    select d.v as detail
      from want w,
           jsonb_each(
             case when jsonb_typeof(p_city_details) = 'object' then p_city_details else '{}'::jsonb end
           ) d(k, v)
     where w.city is not null
       and lower(btrim(d.k)) = lower(w.city)
     limit 1
  ),
  resolved as (
    select
      (select w.city from want w) as city,
      coalesce(
        nullif(public.meta_positive_number((select o.detail from override o) -> 'price_advance'), 0),
        greatest(coalesce(p_price_advance, 0), 0)
      ) as advance,
      coalesce(
        nullif(public.meta_positive_number((select o.detail from override o) -> 'price_full'), 0),
        greatest(coalesce(p_price_full, 0), 0)
      ) as full_price
  )
  select r.city, r.advance, r.full_price,
         case when p_payment_mode = 'full' then r.full_price else r.advance end
    from resolved r;
$$;

comment on function public.meta_booking_prices(text, numeric, numeric, jsonb, jsonb, text) is
  'What a customer pays AT BOOKING for one ticket (advance on a split plan, the '
  'whole price on a full plan), plus the resolved city and full price. Mirrors '
  'cityPrices() in create-payu-order, including its snake_case-only reading of '
  'city_details — keep the two in step. Pure arithmetic; EXECUTE revoked from '
  'anon and authenticated because only SECURITY DEFINER callers need it.';

revoke all on function public.meta_booking_prices(text, numeric, numeric, jsonb, jsonb, text) from public;
revoke all on function public.meta_booking_prices(text, numeric, numeric, jsonb, jsonb, text) from anon;
revoke all on function public.meta_booking_prices(text, numeric, numeric, jsonb, jsonb, text) from authenticated;
grant execute on function public.meta_booking_prices(text, numeric, numeric, jsonb, jsonb, text) to service_role;

-- ── The rule ────────────────────────────────────────────────────────────────
-- A new threshold_mode rather than an edit of 'pct_of_ticket_price': the old
-- mode stays readable so past meta_ad_guardrail_events rows still explain
-- themselves. The threshold is a PERCENTAGE of the ad budget, so 100 means
-- "fires when a ticket costs more than it leaves", and a lower number warns
-- earlier without a deploy.
alter table public.meta_ad_guardrails
  drop constraint if exists meta_ad_guardrails_threshold_mode_check;
alter table public.meta_ad_guardrails
  add constraint meta_ad_guardrails_threshold_mode_check
  check (threshold_mode in ('absolute', 'pct_of_ticket_price', 'pct_of_ad_budget'));

insert into public.meta_ad_guardrails
  (rule_key, label, metric, comparator, threshold, threshold_mode,
   min_spend, min_impressions, min_clicks, window_days, cooldown_hours, enabled, notes)
values
  ('cpa_over_ad_budget',
   'Cost per ticket above what the ticket leaves for ads',
   'cost_per_ticket', 'gt', 100, 'pct_of_ad_budget',
   500, 1000, 10, 7, 24, true,
   'Founder''s rule, 2026-09-17: money paid at booking minus cost_per_ticket is '
   'what a ticket can spend on ads. Threshold is a percentage of that, so 100 = '
   'fires when a ticket costs more than it leaves. Ticket-weighted across the '
   'plans one ad actually sold, and skips plans priced under Rs.50 so deliberate '
   'Rs.2/Rs.3 test events cannot set an 80-paise ceiling.')
on conflict (rule_key) do nothing;

-- Kept as a row, disabled, because deleting it would orphan the history that
-- names it and lose the record that this account once judged ads that way.
update public.meta_ad_guardrails
   set enabled = false,
       notes = coalesce(notes || ' ', '')
         || 'SUPERSEDED 2026-09-17 by cpa_over_ad_budget: 40% of price was too '
            'strict on meetups and too loose on trips (see the migration header).',
       updated_at = now()
 where rule_key = 'cpa_over_40pct'
   and enabled;

-- ── The evaluator ───────────────────────────────────────────────────────────
-- Replaces the live definition. Three changes, everything else as it was:
--   1. `tickets` now sums applications.ticket_count instead of counting rows.
--      A four-head pay-at-venue booking was reading as one acquisition, i.e.
--      four times worse than reality, and the ad budget is per TICKET.
--   2. Each ad carries `ad_money_per_ticket`: the ticket-weighted average of
--      (money at booking − plan cost) over the paid bookings it produced. An ad
--      selling two plans is judged against the mix it actually sold.
--   3. `cost_not_set` travels in the context, because cost_per_ticket is NOT
--      NULL DEFAULT 0 and so cannot tell "free to host" from "never filled in";
--      a ₹0 cost makes the whole advance look like ad money.
create or replace function public.meta_ad_guardrail_breaches()
returns table(rule_key text, label text, ad_id text, ad_name text, metric text,
              observed numeric, threshold numeric, window_days integer, context jsonb)
language sql
stable security definer
set search_path = public
as $function$
with
horizon as (
  select coalesce(max(window_days), 7) as days
  from public.meta_ad_guardrails where enabled
),
spend as (
  select
    d.ad_id,
    max(d.ad_name)                          as ad_name,
    sum(d.spend)::numeric(12,2)             as spend,
    sum(d.impressions)                      as impressions,
    sum(d.clicks)                           as clicks,
    case when sum(d.reach) > 0
         then round(sum(d.impressions)::numeric / sum(d.reach), 3) end as frequency,
    min(d.date_start)                       as first_day
  from public.meta_ad_daily d
  where d.date_start >= current_date - ((select days from horizon) - 1)
  group by d.ad_id
),
bookings as (
  select
    a.attribution->>'utm_content' as ad_id,
    a.event_slug,
    count(*)                                                          as leads,
    coalesce(sum(greatest(coalesce(a.ticket_count, 1), 1))
      filter (where a.status in ('advance_paid','fully_paid')), 0)     as tickets,
    -- Rs.50 floor, same reasoning as the old percentage rule: live rows exist at
    -- Rs.2 and Rs.3 as deliberate test payments, and a budget derived from those
    -- is a ceiling every real ad breaches instantly.
    sum(greatest(coalesce(a.ticket_count, 1), 1)
        * (bp.at_booking - coalesce(e.cost_per_ticket, 0)))
      filter (where a.status in ('advance_paid','fully_paid') and bp.full_price >= 50)
                                                                      as ad_money,
    sum(greatest(coalesce(a.ticket_count, 1), 1))
      filter (where a.status in ('advance_paid','fully_paid') and bp.full_price >= 50)
                                                                      as ad_money_tickets,
    bool_or(coalesce(e.cost_per_ticket, 0) = 0)
      filter (where a.status in ('advance_paid','fully_paid') and bp.full_price >= 50)
                                                                      as cost_not_set
  from public.applications a
  left join public.events e on e.slug = a.event_slug
  left join lateral public.meta_booking_prices(
         e.payment_mode, e.price_advance, e.price_full,
         e.cities, e.city_details, a.selected_city) bp on true
  where a.attribution->>'utm_content' ~ '^[0-9]{6,}$'
    and (a.created_at at time zone 'Asia/Kolkata')::date
        >= current_date - ((select days from horizon) - 1)
  group by 1, 2
),
per_ad_bookings as (
  select
    ad_id,
    sum(leads)             as leads,
    sum(tickets)           as tickets,
    sum(ad_money)          as ad_money,
    sum(ad_money_tickets)  as ad_money_tickets,
    bool_or(cost_not_set)  as cost_not_set,
    (array_agg(event_slug order by tickets desc, leads desc, event_slug))[1]
      as dominant_event_slug
  from bookings
  group by ad_id
),
tagged as (
  select
    f.attribution->>'utm_content' as ad_id,
    count(distinct f.session_id)  as sessions
  from public.flow_analytics f
  where f.attribution->>'utm_content' ~ '^[0-9]{6,}$'
    and (f.created_at at time zone 'Asia/Kolkata')::date
        >= current_date - ((select days from horizon) - 1)
  group by 1
),
-- THE FIX. "No tagged traffic" is only evidence of a missing {{ad.id}} once
-- something, somewhere, has ever been tagged. Before that it is evidence about
-- our own deploy state and nothing about the ads.
capture_live as (
  select exists (
    select 1 from public.flow_analytics where attribution is not null
  ) as live
),
event_price as (
  select
    e.slug,
    (select max((v->>'price_full')::numeric)
       from jsonb_each(e.city_details) as t(k, v)
      where (v->>'price_full') ~ '^[0-9]+(\.[0-9]+)?$') as price_full
  from public.events e
  where e.city_details is not null
),
ad as (
  select
    s.ad_id, s.ad_name, s.spend, s.impressions, s.clicks, s.frequency,
    coalesce(b.leads, 0)   as leads,
    coalesce(b.tickets, 0) as tickets,
    b.dominant_event_slug,
    coalesce(t.sessions, 0) as tagged_sessions,
    p.price_full,
    case when coalesce(b.ad_money_tickets, 0) > 0
         then round(b.ad_money / b.ad_money_tickets, 2) end as ad_money_per_ticket,
    coalesce(b.cost_not_set, false) as cost_not_set
  from spend s
  left join per_ad_bookings b on b.ad_id = s.ad_id
  left join tagged t          on t.ad_id = s.ad_id
  left join event_price p     on p.slug  = b.dominant_event_slug
),
candidate as (
  select
    a.*,
    g.rule_key, g.label, g.metric, g.comparator, g.threshold, g.threshold_mode,
    g.min_spend, g.min_impressions, g.min_clicks, g.window_days, g.cooldown_hours,
    row_number() over (
      partition by a.ad_id, g.metric
      order by (g.scope_event_slug is not null) desc, g.rule_key
    ) as specificity
  from ad a
  join public.meta_ad_guardrails g
    on g.enabled
   and (g.scope_event_slug is null or g.scope_event_slug = a.dominant_event_slug)
),
resolved as (select * from candidate where specificity = 1),
evaluated as (
  select
    r.*,
    case r.metric
      when 'cost_per_ticket'      then case when r.tickets > 0
                                            then round(r.spend / r.tickets, 2) end
      when 'spend_without_ticket' then case when r.tickets = 0 and r.leads > 0
                                            then r.spend end
      when 'spend_without_lead'   then case when r.leads   = 0 then r.spend end
      when 'frequency'            then r.frequency
      when 'ctr'                  then case when r.impressions > 0
                                            then round(100.0 * r.clicks / r.impressions, 3) end
      when 'untagged_spend'       then case when r.tagged_sessions = 0
                                             and (select live from capture_live)
                                            then r.spend end
    end as observed,
    case
      -- A plan that costs more to host than it collects at booking has a
      -- NEGATIVE budget. Clamped to 0 here so the notification reads "vs a Rs.0
      -- ceiling" rather than a negative one, while the real figure travels in
      -- the context for the panel to explain.
      when r.metric = 'cost_per_ticket' and r.threshold_mode = 'pct_of_ad_budget'
        then case when r.ad_money_per_ticket is not null
                  then round(greatest(r.ad_money_per_ticket, 0) * r.threshold / 100.0, 2) end
      when r.metric = 'cost_per_ticket' and r.threshold_mode = 'pct_of_ticket_price'
        then case when r.price_full >= 50
                  then round(r.price_full * r.threshold / 100.0, 2) end
      else r.threshold
    end as effective_threshold
  from resolved r
)
select
  e.rule_key,
  e.label,
  e.ad_id,
  e.ad_name,
  e.metric,
  e.observed,
  e.effective_threshold as threshold,
  e.window_days,
  jsonb_build_object(
    'spend', e.spend,
    'impressions', e.impressions,
    'clicks', e.clicks,
    'leads', e.leads,
    'tickets', e.tickets,
    'tagged_sessions', e.tagged_sessions,
    'dominant_event_slug', e.dominant_event_slug,
    'ticket_price', e.price_full,
    'ad_money_per_ticket', e.ad_money_per_ticket,
    'cost_not_set', e.cost_not_set,
    'threshold_mode', e.threshold_mode
  ) as context
from evaluated e
where
  e.observed is not null
  and e.effective_threshold is not null
  and e.spend       >= e.min_spend
  and e.impressions >= e.min_impressions
  and e.clicks      >= e.min_clicks
  and case e.comparator
        when 'gt' then e.observed > e.effective_threshold
        when 'lt' then e.observed < e.effective_threshold
      end
  and not exists (
    select 1 from public.meta_ad_guardrail_events ev
    where ev.rule_key = e.rule_key
      and ev.ad_id    = e.ad_id
      and ev.fired_at > now() - make_interval(hours => e.cooldown_hours)
  )
order by e.spend desc;
$function$;

-- ── Per plan, before a rupee is spent ───────────────────────────────────────
-- The alarm judges ads that already ran. This answers the question that comes
-- first: what can each plan afford, and what is the most a click may cost?
--
--   most a click may cost = ad money per ticket x (paid tickets / plan views)
--
-- Units are deliberately sessions-over-sessions-shaped: one ad click is one
-- landing session, so "tickets per plan-view session" is the rate a click faces
-- (see the open-event-analytics-units note). Tickets, not bookings, because
-- every ticket brings its own advance.
--
-- THE RATE IS ORGANIC, AND THAT IS ITS WEAKNESS. Today's plan views come from
-- people who mostly already follow the brand; ad traffic normally converts
-- worse, so this figure is a CEILING that will move once real ads run. It is
-- reported with its own sample size and a 95% range rather than as a single
-- confident number, and below `min_tickets_to_estimate` it is labelled too few
-- to estimate — the same discipline as `enough_to_judge` in
-- get_meta_ads_performance (§23).
--
-- Local test visits are set aside with the same StrictMode fingerprint the
-- signal watchdog uses (§22), because `npm run dev` writes to this database and
-- a long test session would flatter the rate.
create or replace function public.get_meta_plan_ad_budgets(p_days integer default 90)
returns jsonb
language sql
stable security definer
set search_path = public
as $function$
with win as (
  select greatest(least(coalesce(p_days, 90), 365), 7) as days
),
bounds as (
  select now() - make_interval(days => (select days from win)) as since, now() as until
),
dev as (
  select session_id
    from public.meta_signal_dev_sessions((select since from bounds), (select until from bounds))
),
plans as (
  select
    e.slug, e.title, e.payment_mode,
    coalesce(e.pay_at_venue, false)   as pay_at_venue,
    e.booking_url,
    coalesce(e.cost_per_ticket, 0)    as cost,
    bp.city, bp.advance, bp.full_price, bp.at_booking
  from public.events e
  cross join lateral public.meta_booking_prices(
        e.payment_mode, e.price_advance, e.price_full,
        e.cities, e.city_details, null) bp
  where e.is_active
    and e.booking_flow = 'payment'
),
views as (
  -- flow_analytics.event_id holds the SLUG, not a uuid (see the
  -- analytics-event-key-mismatch note). Sessions, not rows: one visitor
  -- reopening a plan is one chance to sell, not two.
  select f.event_id as slug, count(distinct f.session_id) as sessions
  from public.flow_analytics f
  where f.event_type = 'event_selected'
    and f.created_at >= (select since from bounds)
    and f.session_id is not null
    and not exists (select 1 from dev d where d.session_id = f.session_id)
  group by 1
),
paid as (
  select
    a.event_slug as slug,
    sum(greatest(coalesce(a.ticket_count, 1), 1)) as tickets
  from public.applications a
  where a.status in ('advance_paid','fully_paid')
    and a.created_at >= (select since from bounds)
    and right(regexp_replace(coalesce(a.phone, ''), '\D', '', 'g'), 10) !~ '^90000000'
  group by 1
),
rows as (
  select
    p.*,
    round(p.at_booking - p.cost, 2)       as ad_money,
    coalesce(v.sessions, 0)               as view_sessions,
    coalesce(pd.tickets, 0)               as paid_tickets
  from plans p
  left join views v  on v.slug  = p.slug
  left join paid  pd on pd.slug = p.slug
),
scored as (
  select
    r.*,
    ci.low  as tickets_low,
    ci.high as tickets_high,
    case when r.view_sessions > 0
         then round(100.0 * r.paid_tickets / r.view_sessions, 2) end as tickets_per_100_views,
    case when r.view_sessions > 0 and r.ad_money > 0
         then round(greatest(r.ad_money, 0) * r.paid_tickets / r.view_sessions, 2) end as max_cost_per_click,
    case when r.view_sessions > 0 and r.ad_money > 0
         then round(greatest(r.ad_money, 0) * ci.low  / r.view_sessions, 2) end as max_cost_per_click_low,
    case when r.view_sessions > 0 and r.ad_money > 0
         then round(greatest(r.ad_money, 0) * ci.high / r.view_sessions, 2) end as max_cost_per_click_high
  from rows r
  cross join lateral public.poisson_ci95(r.paid_tickets) ci
)
select case when public.is_admin_strict() then jsonb_build_object(
  'window_days', (select days from win),
  'since', (select since from bounds),
  'min_tickets_to_estimate', 10,
  'dev_sessions_excluded', (select count(*) from dev),
  -- The live rule, read from the table rather than restated, so the page cannot
  -- claim a threshold nobody is using.
  'alarm', (
    select jsonb_build_object(
      'rule_key', g.rule_key, 'pct_of_ad_budget', g.threshold, 'enabled', g.enabled,
      'window_days', g.window_days, 'min_spend', g.min_spend)
    from public.meta_ad_guardrails g where g.rule_key = 'cpa_over_ad_budget'
  ),
  'plans', coalesce((
    select jsonb_agg(jsonb_build_object(
      'slug', s.slug,
      'title', s.title,
      'city', s.city,
      'payment_mode', s.payment_mode,
      'pay_at_venue', s.pay_at_venue,
      'invite_only', s.booking_url = 'native-application',
      'price_full', s.full_price,
      'advance', s.advance,
      'at_booking', s.at_booking,
      'cost_per_ticket', s.cost,
      'ad_money_per_ticket', s.ad_money,
      'view_sessions', s.view_sessions,
      'paid_tickets', s.paid_tickets,
      'tickets_low', s.tickets_low,
      'tickets_high', s.tickets_high,
      'tickets_per_100_views', s.tickets_per_100_views,
      'max_cost_per_click', s.max_cost_per_click,
      'max_cost_per_click_low', s.max_cost_per_click_low,
      'max_cost_per_click_high', s.max_cost_per_click_high,
      'enough_to_estimate', s.paid_tickets >= 10,
      -- Each warning is a different action, so they are named rather than
      -- collapsed into one "not ready" flag.
      'warnings', (
        select coalesce(jsonb_agg(w), '[]'::jsonb) from (
          select 'cost_not_set'::text as w where s.cost = 0
          union all
          select 'no_ad_money'         where s.ad_money <= 0
          union all
          select 'placeholder_price'   where s.full_price < 50
          union all
          select 'too_few_tickets'     where s.paid_tickets < 10
          union all
          select 'no_views'            where s.view_sessions = 0
        ) t
      )
    ) order by s.title)
    from scored s
  ), '[]'::jsonb)
) end;
$function$;

comment on function public.get_meta_plan_ad_budgets(integer) is
  'Per live paying plan: money paid at booking, cost, the ad money one ticket '
  'leaves, and the most a click may cost at the plan''s own organic conversion '
  'rate. Founder-gated (NULL for anyone else). The click ceiling is computed '
  'from organic traffic and is therefore an upper bound — see the function body.';

revoke all on function public.get_meta_plan_ad_budgets(integer) from public;
revoke all on function public.get_meta_plan_ad_budgets(integer) from anon;
grant execute on function public.get_meta_plan_ad_budgets(integer) to authenticated;
grant execute on function public.get_meta_plan_ad_budgets(integer) to service_role;
