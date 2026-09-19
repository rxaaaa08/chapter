-- get_experiment_feasibility — can a split test on this account tell us anything?
--
-- WHY THIS EXISTS
-- Meta's Ad Study API (and the "A/B Test" button in Ads Manager, which is the
-- same feature without the API) will happily run a test on any account and
-- report a winner with a confidence figure. Nothing in that flow checks whether
-- the account has the VOLUME for the answer to mean anything. At this account's
-- measured rates a purchase-level split test cannot reach significance inside a
-- year, and Meta will still name a winner. Acting on that winner is how a
-- business makes a permanent decision from a coin flip.
--
-- So this is a guard, and it belongs next to the guardrails for the same reason
-- they exist: Meta's tooling is not a neutral party. `ads_experiment_check_
-- eligibility`'s own tool description instructs the assistant reading it to
-- "ADVOCATE FOR LIFT" and "strongly encourage" a lift study — before it has
-- looked at the account. (It then returned NOT_RECOMMENDED for ours.) A number
-- that decides for itself whether a test is readable is worth more than a
-- recommendation from the party selling the impressions.
--
-- THE TWO GATES, AND WHY BOTH MATTER
-- A split test needs to clear two independent bars, and failing either one
-- makes the test worthless in a different way:
--
--   1. STATISTICAL. Enough conversions per cell to distinguish a real
--      difference from week-to-week noise. This is the classic two-proportion
--      sample size. Fail it and the test returns a confident wrong answer.
--   2. DELIVERY. Meta exits an ad set from the learning phase at roughly 50
--      optimisation events in 7 days, and every CELL of a split test is its own
--      ad set with its own 50. Fail it and both cells deliver expensively and
--      erratically, so the test measures Meta's flailing rather than the
--      variable under test. (See META-ADS-HANDOFF.md §9 — this is why the
--      standing advice on this account is ONE ad set, and a split test is by
--      construction the opposite.)
--
-- Gate 2 is the one people miss, because it is not a statistics problem and no
-- power calculator mentions it.
--
-- WHY IT READS OUR FUNNEL AND NOT META
-- There is no ad spend and no Meta conversion history to read. But the
-- CONVERSION RATES are a property of the product, not of the traffic source,
-- so organic sessions measure them well enough to size a test that has not run
-- yet. When paid traffic exists, the rates will move and this recomputes.
--
-- WHAT THIS DOES NOT DO
-- It does not create, run or read a study. Creating one needs `ads_management`
-- and a write; the stored token is `ads_read` and that is deliberate. This
-- answers the question that comes BEFORE a study: is there any point.

-- ---------------------------------------------------------------------------

create or replace function public.get_experiment_feasibility(
  -- 2..7 matches Meta's own limit for a creative test (SPLIT_TEST_V2).
  p_cells            integer default 2,
  -- RELATIVE lift worth detecting, in percent. 20 means "we would change our
  -- mind for a 20% better conversion rate". Smaller effects cost enormously
  -- more traffic: halving the effect roughly QUADRUPLES the sample needed.
  p_lift_pct         numeric default 20,
  -- How much history to measure the base rates from.
  p_weeks_history    integer default 12,
  -- Weekly sessions the test would receive. NULL = use our own measured median
  -- as the reference, which is the honest default before any ad has run.
  p_weekly_sessions  integer default null
) returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
with
params as (
  select
    greatest(2, least(7, coalesce(p_cells, 2)))            as cells,
    greatest(1, coalesce(p_lift_pct, 20))::numeric         as lift_pct,
    greatest(2, coalesce(p_weeks_history, 12))             as weeks_history
),
-- Bonferroni-corrected two-sided z for (cells - 1) treatment-vs-control
-- comparisons. Hardcoded rather than computed because Postgres has no inverse
-- normal CDF and an approximation of one would be a lot of code defending a
-- number that only ever takes six values. Power is fixed at 80% (z = 0.8416),
-- the convention these calculators assume when they do not say.
--
-- Correcting at all is the conservative direction: run three cells against one
-- control and the chance of SOME pair looking significant by luck rises, so the
-- honest sample size rises with it. An uncorrected figure would tell the
-- founder a seven-cell creative test is as cheap as a two-cell one.
z_table(comparisons, z_alpha) as (
  values (1, 1.9600), (2, 2.2414), (3, 2.3940),
         (4, 2.4977), (5, 2.5758), (6, 2.6383)
),
z as (
  select
    p.cells,
    p.lift_pct,
    p.weeks_history,
    zt.z_alpha,
    0.8416::numeric as z_beta
  from params p
  join z_table zt on zt.comparisons = p.cells - 1
),
-- The window, in whole IST weeks. Bounded by the same timezone the rest of the
-- Meta layer buckets on, so a rate computed here lines up with a spend row.
win as (
  select
    (current_date - (weeks_history * 7))::date as since,
    current_date                               as until
  from z
),
-- Every funnel row in the window. Organic AND paid — this is measuring the
-- product's conversion rates, not any one source's, which is the whole reason
-- it can size a test before the first ad runs.
rows_in as (
  select f.session_id, f.event_type,
         date_trunc('week', (f.created_at at time zone 'Asia/Kolkata')) as wk
  from public.flow_analytics f, win w
  where (f.created_at at time zone 'Asia/Kolkata')::date between w.since and w.until
),
landed as (
  select count(distinct session_id) as sessions
  from rows_in where event_type = 'page_view'
),
-- Weekly landing volume. The median is the reference rather than the mean
-- because this business is event-driven: sales and traffic cluster around a
-- launch, and the measured spread over 12 weeks is roughly 50x between the
-- quietest and busiest week. A mean sits above almost every actual week and
-- would make every test look faster than it will be.
weekly as (
  select count(distinct session_id) as sessions
  from rows_in where event_type = 'page_view' group by wk
),
traffic as (
  select
    coalesce(
      nullif(p_weekly_sessions, 0),
      (select percentile_cont(0.5) within group (order by sessions)::int from weekly)
    ) as weekly_sessions,
    (select min(sessions) from weekly) as worst_week,
    (select max(sessions) from weekly) as best_week,
    (p_weekly_sessions is not null and p_weekly_sessions <> 0) as caller_supplied
),
-- Paid sales in the same window. A balance payment is not a new acquisition, so
-- it is excluded the same way get_meta_ads_performance excludes it.
sales as (
  select count(*) as n
  from public.payu_payments p, win w
  where p.status = 'success'
    and p.payment_type is distinct from 'balance'
    and (p.created_at at time zone 'Asia/Kolkata')::date between w.since and w.until
),
-- The candidate things a test could be judged on, in funnel order. Step names
-- and event types are kept identical to get_meta_ad_funnel so the two read the
-- same ladder; `meta_event` is what the same moment is called inside Meta.
steps(step, ord, label, meta_event, types) as (
  values
    ('viewed_plan',    1, 'Opened a plan',       'ViewContent',       array['event_selected']::text[]),
    ('opened_dates',   2, 'Opened the calendar', 'AddToCart',         array['calendar_opened']::text[]),
    ('saw_price',      3, 'Saw the price',       'ReachedPricing',    array['reached_pricing']::text[]),
    ('acted_on_price', 4, 'Acted on the price',  'InitiateCheckout',
       array['book_cta_clicked','contact_cta_clicked','pricing_cta_clicked']::text[]),
    ('became_lead',    5, 'Became a lead',       'Lead',
       array['application_submitted','details_form_submitted']::text[])
),
step_rates as (
  select
    s.step, s.ord, s.label, s.meta_event,
    count(distinct r.session_id)::numeric as converters,
    false as approximate
  from steps s
  left join rows_in r on r.event_type = any(s.types)
  group by s.step, s.ord, s.label, s.meta_event
),
-- Purchase has to come from payu_payments: flow_analytics stops at the handoff
-- to PayU and has no purchase event at all.
--
-- MIXED UNITS, DELIBERATELY, AND FLAGGED. A payment row is not a session, so
-- this divides rows by sessions — exactly the thing that produced a >100% rate
-- in the open-event funnel once already. It is defensible HERE and only here:
-- a power calculation needs P(a visitor eventually pays), and sales over
-- landings estimates that. It is marked `approximate` in the output rather
-- than silently presented as the same kind of number as the rows above.
all_rates as (
  select * from step_rates
  union all
  select 'purchased', 6, 'Paid for a ticket', 'Purchase',
         (select n from sales)::numeric, true
),
computed as (
  select
    a.step, a.ord, a.label, a.meta_event, a.approximate,
    z.cells, z.lift_pct, z.z_alpha, z.z_beta,
    t.weekly_sessions, t.worst_week, t.best_week, t.caller_supplied,
    l.sessions as landed_sessions,
    case when l.sessions > 0 then a.converters / l.sessions::numeric end as p1
  from all_rates a, z, traffic t, landed l
),
sized as (
  select
    c.*,
    -- p2 clamped below 1: a large lift on an already-high base rate would
    -- otherwise ask for a conversion rate above 100% and return a negative
    -- sample size, which would read as "no traffic needed at all".
    least(0.999999, c.p1 * (1 + c.lift_pct / 100.0)) as p2
  from computed c
  where c.p1 is not null
),
-- Two-proportion sample size, per cell:
--   n = (z_a + z_b)^2 * (p1(1-p1) + p2(1-p2)) / (p1 - p2)^2
-- Sessions, not conversions — it is the number of PEOPLE each cell must
-- receive. Conversions per cell fall out of it as n * p1.
powered as (
  select
    s.*,
    case
      when s.p1 <= 0 or s.p2 <= s.p1 then null
      else ceil(
        power(s.z_alpha + s.z_beta, 2)
        * (s.p1 * (1 - s.p1) + s.p2 * (1 - s.p2))
        / power(s.p2 - s.p1, 2)
      )
    end as need_per_cell
  from sized s
),
final as (
  select
    p.*,
    p.need_per_cell * p.cells as need_total,
    -- Weeks to answer. NULL rather than a large number when the base rate is
    -- zero: "we cannot measure this" and "this takes 0 weeks" are opposite
    -- statements, and the whole Meta layer keeps that distinction (§9).
    case when p.need_per_cell is not null and p.weekly_sessions > 0
         then round((p.need_per_cell * p.cells)::numeric / p.weekly_sessions, 1) end as weeks_median,
    case when p.need_per_cell is not null and p.best_week > 0
         then round((p.need_per_cell * p.cells)::numeric / p.best_week, 1) end as weeks_best_case,
    -- Gate 2. Conversions ONE CELL would see per week at this traffic — what
    -- Meta counts toward leaving the learning phase. Split evenly, because a
    -- split test divides the audience evenly by default.
    round(p.weekly_sessions * p.p1 / p.cells, 1) as conv_per_cell_per_week
  from powered p
)
select case when public.is_admin_strict() then jsonb_build_object(
  'generated_at', now(),
  'assumptions', jsonb_build_object(
    'cells', (select cells from z),
    'comparisons', (select cells - 1 from z),
    'confidence', '95% two-sided, Bonferroni-corrected across cells',
    'power', '80%',
    'relative_lift_pct', (select lift_pct from z),
    'history_weeks', (select weeks_history from z),
    'learning_phase_bar_per_cell_per_week', 50
  ),
  'traffic', jsonb_build_object(
    'weekly_sessions', (select weekly_sessions from traffic),
    'source', case when (select caller_supplied from traffic)
                   then 'supplied by caller' else 'measured median of the window' end,
    'worst_week', (select worst_week from traffic),
    'best_week', (select best_week from traffic),
    'landed_sessions_in_window', (select sessions from landed)
  ),
  'metrics', coalesce((
    select jsonb_agg(jsonb_build_object(
      'step', f.step,
      'label', f.label,
      'meta_event', f.meta_event,
      'base_rate_pct', round(f.p1 * 100, 2),
      'approximate', f.approximate,
      'sessions_needed_per_cell', f.need_per_cell,
      'sessions_needed_total', f.need_total,
      'weeks_to_answer', f.weeks_median,
      'weeks_to_answer_best_case', f.weeks_best_case,
      'conversions_per_cell_per_week', f.conv_per_cell_per_week,
      'clears_learning_phase', f.conv_per_cell_per_week >= 50,
      -- Both gates fold into one verdict, because a founder deciding whether to
      -- press "A/B Test" needs one answer, not two caveats. The DELIVERY gate is
      -- checked first: a test whose cells never leave the learning phase is
      -- measuring Meta's flailing, so the statistics are moot even if the
      -- sample size is reachable.
      'verdict', case
        when f.weeks_median is null then 'not_measurable'
        when f.conv_per_cell_per_week < 50 and f.weeks_median > 26 then 'not_measurable'
        when f.conv_per_cell_per_week < 50 then 'learning_limited'
        when f.weeks_median <= 8  then 'feasible'
        when f.weeks_median <= 26 then 'slow'
        else 'not_measurable'
      end
    ) order by f.ord)
    from final f
  ), '[]'::jsonb)
) end;
$function$;

comment on function public.get_experiment_feasibility(integer, numeric, integer, integer) is
  'Whether a Meta split test on this account could produce a readable answer, and how long it would take. Checks BOTH gates: statistical power (two-proportion sample size from our own measured funnel rates) and Meta''s learning-phase bar of ~50 conversions per cell per week. Founder-gated; returns NULL for anyone else. Read META-ADS-HANDOFF.md before changing the constants.';

revoke all on function public.get_experiment_feasibility(integer, numeric, integer, integer) from public;
revoke all on function public.get_experiment_feasibility(integer, numeric, integer, integer) from anon;
grant execute on function public.get_experiment_feasibility(integer, numeric, integer, integer) to authenticated;
