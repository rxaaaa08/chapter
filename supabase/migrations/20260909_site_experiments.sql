-- Site experiments — A/B testing on our own traffic, where the volume actually is.
--
-- WHY HERE AND NOT ON META
-- A Meta split test is readable on this account for exactly two metrics
-- (ViewContent, AddToCart) and needs paid traffic to exist first. Measured
-- 2026-09-09 by get_experiment_feasibility: a purchase-level split test needs
-- ~203 weeks. Meanwhile the site takes ~400 organic sessions a week through a
-- fully instrumented funnel, and the biggest leak in that funnel is ours to
-- fix, not Meta's. This is the cheaper laboratory, and it is already paid for.
--
-- This is Layer 3 of experiments-and-ab-testing-proposal.md, with two additions
-- that proposal did not have. Both are recorded below as MISTAKE GUARDS rather
-- than features, because each one exists to stop a specific wrong conclusion.
--
-- ---------------------------------------------------------------------------
-- GUARD 1 — ASSIGNMENT MUST BE PER VISITOR, NOT PER SESSION
--
-- The original proposal says: "deterministic hash of the existing session_id →
-- variant. Same visitor always sees the same version." That claim is FALSE as
-- written, and the reason is one line in src/supabase.ts: `ca_session_id` lives
-- in sessionStorage, so it is destroyed when the tab closes. A visitor who
-- returns tomorrow is a new session and would be re-rolled into a possibly
-- different variant.
--
-- Two things break at once. The visitor sees the site change under them, which
-- looks like a bug. And the measurement is contaminated: someone exposed to
-- both variants before converting belongs to neither, and there is no way to
-- tell afterwards that it happened. So experiments assign on a PERSISTENT
-- visitor id (localStorage), recorded here once, first assignment wins.
--
-- THIS IS NOT AN INCONSISTENCY WITH attribution.ts, and a future session must
-- not "unify" the two. Attribution is session-scoped ON PURPOSE, so a visitor
-- returning days later with a bare URL is not credited to an old ad — it
-- deliberately under-credits. Experiment assignment has the opposite
-- requirement: it must be sticky forever or the test is meaningless. Same
-- visitor, two ids, two lifetimes, both correct.
--
-- ---------------------------------------------------------------------------
-- GUARD 2 — SAMPLE RATIO MISMATCH (SRM)
--
-- Assign 50/50 and observe 60/40, and something is broken: a variant crashing
-- before it logs, a bot hitting one path, an assignment bug. The observed
-- difference in conversion is then measuring the breakage, not the change.
--
-- This is the single highest-value check in A/B testing and almost nobody
-- builds it, because a test with SRM looks completely normal — it produces a
-- clean-looking winner with a good p-value. `srm_p` below is a chi-square on
-- the split against the designed weights. Below 0.001 the result is marked
-- INVALID and no winner is reported at all. That is the same null-versus-zero
-- discipline the Meta layer uses: refusing to answer is a different statement
-- from answering "no difference", and only one of them is true here.
--
-- ---------------------------------------------------------------------------
-- GUARD 3 — NO PEEKING (this one is from our own history)
--
-- Checking results daily and stopping when they look significant inflates the
-- false-positive rate far above the stated 5%. This project has already been
-- burned by it: the invite-vs-open conversion finding hit p=0.047 on a THIRD
-- sequential look and was correctly recorded as "not nailed down" — five
-- earlier findings at n=8 died at larger n.
--
-- So an experiment stores `target_exposures_per_variant`, set BEFORE it starts
-- from get_experiment_feasibility(), and the results function reports
-- `ready: false` until that number is reached. It still shows progress —
-- hiding the numbers entirely just moves the peeking to raw SQL — but it will
-- not name a winner early, and it says how much longer to wait.

-- ---------------------------------------------------------------------------
-- 0. Two small pure helpers.
-- ---------------------------------------------------------------------------

-- Upper-tail normal probability, P(Z > z). Postgres ships no normal CDF and
-- this needs one twice (the conversion z-test and the SRM chi-square, which for
-- 1 degree of freedom is just the two-sided normal tail of sqrt(chi2)).
--
-- Abramowitz & Stegun 26.2.17 — accurate to ~7.5e-8, which is several orders
-- of magnitude better than the precision any decision here depends on. Pulling
-- in an extension for this would be a dependency to defend forever.
create or replace function public.norm_sf(z numeric)
returns numeric
language sql
immutable
parallel safe
as $function$
  with a as (select abs(z) as x),
  t as (select x, 1.0 / (1.0 + 0.2316419 * x) as t from a),
  d as (select x, t, exp(-x * x / 2.0) / sqrt(2.0 * pi()) as pdf from t)
  select case
    when z >= 0 then p
    else 1.0 - p
  end
  from (
    select pdf * (0.319381530 * t
                + (-0.356563782) * t * t
                + 1.781477937 * t * t * t
                + (-1.821255978) * t * t * t * t
                + 1.330274429 * t * t * t * t * t) as p
    from d
  ) q;
$function$;

comment on function public.norm_sf(numeric) is
  'Upper-tail standard normal probability P(Z > z), Abramowitz & Stegun 26.2.17. Used by get_experiment_results for the conversion z-test and the SRM chi-square.';

-- Weights must sum to 100 or assignment silently skews and GUARD 2 then fires
-- on a problem that was in the config all along. A CHECK cannot contain a
-- subquery, so the sum goes through an immutable function.
create or replace function public.jsonb_weight_sum(j jsonb)
returns numeric
language sql
immutable
parallel safe
as $function$
  select coalesce(sum((v->>'weight')::numeric), 0) from jsonb_array_elements(j) v;
$function$;

-- ---------------------------------------------------------------------------
-- 1. The experiments themselves.
-- ---------------------------------------------------------------------------
create table if not exists public.experiments (
  -- Stable identity used by the client hook: variant('pricing-headline-v1').
  -- Renaming it orphans every exposure already recorded, which is why the
  -- human-readable text lives in `hypothesis` and not here.
  key            text primary key,

  -- In plain words, what we think will happen and why. Required, because an
  -- experiment whose hypothesis was never written down cannot be honestly
  -- concluded afterwards — whatever the numbers say will look like it was the
  -- prediction all along.
  hypothesis     text not null,

  -- A flow_analytics event_type. Deliberately ONE metric: a test judged on
  -- whichever of five metrics happened to move is not a test.
  primary_metric text not null,

  -- [{"name":"A","weight":50},{"name":"B","weight":50}]
  variants       jsonb not null,

  status         text not null default 'draft'
                 check (status in ('draft', 'running', 'stopped', 'decided')),

  -- GUARD 3. Set from get_experiment_feasibility() BEFORE starting. Null means
  -- no horizon was declared, and the results function says so rather than
  -- quietly behaving as though any number of exposures is enough.
  target_exposures_per_variant integer,

  started_at     timestamptz,
  stopped_at     timestamptz,

  -- What was concluded, in words, including "no difference" and "invalid".
  -- A stopped experiment with no decision is the thing that quietly becomes
  -- folklore six months later.
  decision       text,

  created_at     timestamptz not null default now(),

  constraint experiments_weights_sum_100
    check (public.jsonb_weight_sum(variants) = 100),
  constraint experiments_two_or_more_variants
    check (jsonb_array_length(variants) >= 2)
);

-- ---------------------------------------------------------------------------
-- 2. Exposures — one row per visitor per experiment, first assignment wins.
-- ---------------------------------------------------------------------------
-- The PK is what makes "first wins" true at the database rather than in client
-- code: the client inserts ON CONFLICT DO NOTHING on every render, and only
-- the first one lands. A client-side "have I already been assigned?" check
-- would be racy across two tabs opened at once.
create table if not exists public.experiment_exposures (
  experiment_key   text not null references public.experiments(key) on delete cascade,
  visitor_id       uuid not null,
  variant          text not null,
  -- Kept for debugging and for joining conversions logged before the client
  -- learned to stamp visitor_id. Not the join key — see the note on the RPC.
  first_session_id text,
  first_seen_at    timestamptz not null default now(),
  primary key (experiment_key, visitor_id)
);

create index if not exists experiment_exposures_key_variant_idx
  on public.experiment_exposures (experiment_key, variant);

-- ---------------------------------------------------------------------------
-- 3. RLS.
-- ---------------------------------------------------------------------------
alter table public.experiments          enable row level security;
alter table public.experiment_exposures enable row level security;

-- Visitors are anonymous and must be able to READ which experiments are running
-- (the client needs the variant weights to assign) and to RECORD their own
-- exposure. Neither leaks anything: an experiment key and its weights are
-- visible in the shipped JavaScript anyway, and an exposure row is one
-- anonymous uuid.
--
-- The write surface is deliberately INSERT-only. Anon cannot UPDATE an exposure
-- (which would let a visitor re-roll their variant until they got the one they
-- wanted, and more importantly would let anyone rewrite the denominator of a
-- live test) and cannot DELETE one.
--
-- This mirrors the posture flow_analytics already has — anon inserts funnel
-- rows from the browser today. The abuse ceiling is the same: someone could
-- mint visitor ids and pad a denominator. That is worth knowing rather than
-- worth blocking, because the SRM check in GUARD 2 catches a lopsided flood,
-- which is the version of this that would actually change a decision.
drop policy if exists experiments_read_running on public.experiments;
create policy experiments_read_running on public.experiments
  for select using (status = 'running');

drop policy if exists experiments_admin_all on public.experiments;
create policy experiments_admin_all on public.experiments
  for all using (public.is_admin_strict()) with check (public.is_admin_strict());

drop policy if exists exposures_insert_anon on public.experiment_exposures;
create policy exposures_insert_anon on public.experiment_exposures
  for insert with check (true);

drop policy if exists exposures_read_admin on public.experiment_exposures;
create policy exposures_read_admin on public.experiment_exposures
  for select using (public.is_admin_strict());

revoke update, delete on public.experiment_exposures from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Results.
-- ---------------------------------------------------------------------------
-- JOIN KEY IS visitor_id, NOT session_id, and this is the whole reason
-- flow_analytics gains a visitor_id column in the companion migration.
-- Assignment is sticky across sessions (GUARD 1), so a conversion in a LATER
-- session still belongs to the variant this visitor was assigned. Joining on
-- session_id would silently drop every returning visitor's conversion — and
-- returning visitors are exactly the population a booking funnel converts.
--
-- Until the client ships the visitor_id stamp, every variant reads zero
-- converters. That is reported through `diagnostics.client_stamping_live`
-- rather than presented as a real zero, because "nobody converted" and "we are
-- not measuring conversions yet" are opposite statements.
create or replace function public.get_experiment_results(p_key text)
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
with
exp as (
  select * from public.experiments where key = p_key
),
-- Designed split, normalised to fractions, for the SRM expectation.
design as (
  select v->>'name' as variant, (v->>'weight')::numeric / 100.0 as share
  from exp, jsonb_array_elements(exp.variants) v
),
expo as (
  select variant, visitor_id
  from public.experiment_exposures where experiment_key = p_key
),
-- A converter is a visitor who fired the primary metric AT ANY POINT AFTER
-- being exposed. Counted as DISTINCT VISITORS, never rows: the funnel logs
-- roughly 2% of steps twice within a second, and counting rows would inflate
-- whichever variant happened to catch more double-fires.
conv as (
  select distinct e.variant, e.visitor_id
  from expo e
  join public.experiment_exposures x
    on x.experiment_key = p_key and x.visitor_id = e.visitor_id
  join public.flow_analytics f
    on f.visitor_id = e.visitor_id
   and f.event_type = (select primary_metric from exp)
   and f.created_at >= x.first_seen_at
),
per_variant as (
  select
    d.variant,
    d.share,
    count(distinct e.visitor_id)                    as exposures,
    count(distinct c.visitor_id)                    as converters
  from design d
  left join expo e on e.variant = d.variant
  left join conv c on c.variant = d.variant
  group by d.variant, d.share
),
totals as (
  select sum(exposures) as n, sum(converters) as k from per_variant
),
-- SRM. chi2 = sum((observed - expected)^2 / expected) over variants.
-- Reported for any number of variants; the p-value uses 1 df, which is exact
-- for the two-variant case and conservative-ish beyond it. Two variants is
-- what this will run in practice, and a wrong-but-alarming SRM number is the
-- safe direction for a check whose only job is to say "do not trust this".
srm as (
  select case
    when (select n from totals) > 0 then
      sum(power(pv.exposures - (select n from totals) * pv.share, 2)
          / nullif((select n from totals) * pv.share, 0))
    end as chi2
  from per_variant pv
),
-- Two-proportion z against the FIRST variant as control. Ordering is the
-- variants array's own order, so whoever writes the experiment decides which
-- is the control by putting it first.
control as (
  select * from per_variant
  where variant = (select variants->0->>'name' from exp)
),
compared as (
  select
    pv.variant,
    pv.exposures,
    pv.converters,
    case when pv.exposures > 0
         then pv.converters::numeric / pv.exposures end as rate,
    case when c.exposures > 0
         then c.converters::numeric / c.exposures end   as control_rate,
    case
      when pv.variant = c.variant then null
      when pv.exposures = 0 or c.exposures = 0 then null
      else (
        with p as (
          select
            pv.converters::numeric / pv.exposures as p1,
            c.converters::numeric  / c.exposures  as p2,
            pv.exposures::numeric                 as n1,
            c.exposures::numeric                  as n2
        ),
        pooled as (
          select p1, p2, n1, n2,
                 (p1 * n1 + p2 * n2) / (n1 + n2) as pp from p
        )
        select case
          when pp <= 0 or pp >= 1 then null
          else (p1 - p2) / sqrt(pp * (1 - pp) * (1.0 / n1 + 1.0 / n2))
        end from pooled
      )
    end as z
  from per_variant pv, control c
)
select case when public.is_admin_strict() then jsonb_build_object(
  'key', (select key from exp),
  'hypothesis', (select hypothesis from exp),
  'primary_metric', (select primary_metric from exp),
  'status', (select status from exp),
  'started_at', (select started_at from exp),
  'control_variant', (select variants->0->>'name' from exp),

  -- GUARD 2. Reported before the variant numbers, because if this failed the
  -- variant numbers are not evidence of anything.
  'validity', jsonb_build_object(
    'srm_chi2', round((select chi2 from srm), 3),
    'srm_p', case when (select chi2 from srm) is not null
                  then round(2 * public.norm_sf(sqrt((select chi2 from srm))), 5) end,
    'srm_failed', coalesce(
      (select chi2 from srm) is not null
      and 2 * public.norm_sf(sqrt((select chi2 from srm))) < 0.001, false),
    'note', case
      when (select chi2 from srm) is null then 'no exposures yet'
      when 2 * public.norm_sf(sqrt((select chi2 from srm))) < 0.001
        then 'INVALID — visitors did not split the way the experiment says they should. Fix the cause before reading any result below.'
      else 'split looks right' end
  ),

  -- GUARD 3.
  'horizon', jsonb_build_object(
    'target_per_variant', (select target_exposures_per_variant from exp),
    'smallest_variant_exposures', (select min(exposures) from per_variant),
    'ready', case
      when (select target_exposures_per_variant from exp) is null then null
      else (select min(exposures) from per_variant)
             >= (select target_exposures_per_variant from exp) end,
    'note', case
      when (select target_exposures_per_variant from exp) is null
        then 'No sample size was declared before this started. Any winner read off it is a guess — set target_exposures_per_variant from get_experiment_feasibility().'
      when (select min(exposures) from per_variant)
             < (select target_exposures_per_variant from exp)
        then 'Still filling. Do not read a winner yet — stopping early because it looks good is how a coin flip becomes a decision.'
      else 'Target reached. Safe to read.' end
  ),

  'variants', coalesce((
    select jsonb_agg(jsonb_build_object(
      'variant', cm.variant,
      'exposures', cm.exposures,
      'converters', cm.converters,
      'rate_pct', round(cm.rate * 100, 2),
      'is_control', cm.variant = (select variants->0->>'name' from exp),
      'lift_vs_control_pct', case
        when cm.control_rate > 0 and cm.rate is not null
        then round((cm.rate - cm.control_rate) / cm.control_rate * 100, 1) end,
      'z', round(cm.z, 3),
      -- Two-sided p. NULL for the control (it is not being compared with
      -- itself) and NULL when a variant has no exposures — not 1.0, which
      -- would read as a confident "no difference".
      'p_value', case when cm.z is not null
                      then round(2 * public.norm_sf(abs(cm.z)), 5) end,
      'significant', case when cm.z is not null
                          then 2 * public.norm_sf(abs(cm.z)) < 0.05 end
    ) order by cm.variant)
    from compared cm
  ), '[]'::jsonb),

  'diagnostics', jsonb_build_object(
    'total_exposures', (select n from totals),
    'total_converters', (select k from totals),
    -- Distinguishes "no one converted" from "we are not measuring yet".
    'client_stamping_live', (
      select exists (select 1 from public.flow_analytics
                     where visitor_id is not null limit 1)
    )
  )
) end;
$function$;

comment on function public.get_experiment_results(text) is
  'Per-variant results for a site experiment, with three guards the raw numbers do not have: an SRM check that invalidates a skewed split, a fixed-horizon gate that refuses to name a winner early, and a client_stamping_live flag that tells a real zero from an unmeasured one. Founder-gated.';

revoke all on function public.get_experiment_results(text) from public, anon;
grant execute on function public.get_experiment_results(text) to authenticated;
grant execute on function public.norm_sf(numeric) to authenticated;
