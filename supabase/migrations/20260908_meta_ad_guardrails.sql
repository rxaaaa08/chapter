-- Meta ad guardrails — a circuit breaker that runs on OUR cash, not Meta's count.
--
-- WHY THIS EXISTS, AND WHY IT IS NOT META'S VERSION
-- Meta ships a rules engine for exactly this (POST /act_<ID>/subscriptions, with
-- INSIGHTS_UPDATED / INSIGHTS_MILESTONE_REACHED threshold events). It is not
-- available to this app, for two independent reasons recorded in
-- META-ADS-HANDOFF.md §12 — the `subscriptions` field is absent from our
-- ad_account webhook topic, and creating subscriptions needs `ads_management`
-- while our token is `ads_read`.
--
-- That turned out to be a lucky escape rather than a loss. Meta's threshold
-- metrics (`cost_per_purchase_fb` and friends) divide real spend by META'S
-- conversion count, and this account has measured that count reading ~50% high
-- (see the meta-capi-audit-2026-09 note). A breaker built on it fires late,
-- every time, and in the one direction that costs money. This one divides real
-- spend by real paid tickets in `applications`. It is strictly more accurate.
--
-- The one thing Meta's version would genuinely have given us is LATENCY —
-- near-real-time versus the 6-hourly `meta-ads-sync` cron. That gap closes by
-- running the sync more often, which is free. It is not a reason to prefer a
-- number that is wrong.
--
-- WHAT THIS DOES NOT DO: pause anything. The stored token is `ads_read` on
-- purpose. The founder's decision (2026-09-08) was the hybrid: this system
-- NOTIFIES on accurate numbers, and a single crude Ads Manager rule on raw
-- daily spend acts as the auto-pause backstop. The logic behind that split is
-- worth keeping: Meta's conversion counts are inflated, but Meta's SPEND number
-- is definitionally correct — it is what they bill. So Meta's automation is
-- trusted with the one metric Meta cannot be wrong about, and nothing else.
--
-- NOISE FLOORS ARE COPIED FROM META'S OWN SPEC, deliberately. Their milestone
-- minimums (impressions >= 1000, clicks >= 10, spend >= 1000 minor units,
-- results >= 5) are a published statement of where a ratio stops being signal.
-- A 0% CTR on 12 impressions is arithmetic on noise, not a finding, and an
-- alarm that says otherwise trains the founder to ignore alarms.

-- ---------------------------------------------------------------------------
-- 1. The rules themselves — rows, so they change without a deploy.
-- ---------------------------------------------------------------------------
create table if not exists public.meta_ad_guardrails (
  id             uuid primary key default gen_random_uuid(),

  -- Stable identity for code and for cooldown bookkeeping. Renaming `label` is
  -- cosmetic; changing `rule_key` starts the cooldown history over, which is
  -- why they are two columns and not one.
  rule_key       text not null unique,
  label          text not null,

  -- The vocabulary is fixed in the CHECK rather than free text: an unrecognised
  -- metric would otherwise be a rule that silently never fires, which is the
  -- worst possible failure for a safety device. Adding a metric is a code
  -- change (the evaluator must learn to compute it); adding a RULE is a row.
  metric         text not null check (metric in (
    'cost_per_ticket',      -- spend / paid tickets this ad produced
    -- These two are deliberately DISJOINT, and the split is the diagnosis.
    -- spend_without_ticket requires leads > 0: people arrived and started a
    -- booking, and none of them paid — a CONVERSION problem (price, trust,
    -- checkout). spend_without_lead is leads = 0: nobody even started — a
    -- TRAFFIC problem (wrong audience, wrong creative). Left overlapping, an
    -- ad with neither leads nor tickets tripped BOTH and pushed twice about
    -- one thing, which was caught in the 2026-09-08 dry run.
    'spend_without_ticket', -- leads but no tickets — they came and didn't buy
    'spend_without_lead',   -- no leads at all — they never came
    'frequency',            -- same people seeing it repeatedly: creative fatigue
    'ctr',                  -- nobody clicking: the creative is not landing
    'untagged_spend'        -- spend with zero tagged sessions: {{ad.id}} missing
  )),

  -- 'gt' alarms when the metric rises above threshold, 'lt' when it falls below.
  -- ctr is the only 'lt' rule seeded; the rest are all "too much of a bad thing".
  comparator     text not null check (comparator in ('gt', 'lt')),

  threshold      numeric not null check (threshold >= 0),

  -- THE POINT OF THIS COLUMN. Tickets on this account run from a Rs.299 meetup
  -- to a Rs.3,700 weekend. A flat rupee CAC ceiling is simultaneously suicidal
  -- on the cheap ticket and absurdly generous on the expensive one, so a single
  -- global rule needs to scale with what the ad actually sold.
  --   'absolute'            — threshold is rupees.
  --   'pct_of_ticket_price' — threshold is a PERCENT of the price_full of the
  --                           event this ad predominantly sold. Only meaningful
  --                           for cost_per_ticket; ignored elsewhere.
  threshold_mode text not null default 'absolute'
                 check (threshold_mode in ('absolute', 'pct_of_ticket_price')),

  -- null = applies to every ad. Set it to scope a rule to one event; the
  -- evaluator prefers the most specific matching rule (see resolve_rule below).
  scope_event_slug text,

  -- Noise floors. An ad below ALL of these is not judged at all.
  min_spend      numeric not null default 500,
  min_impressions bigint not null default 1000,
  min_clicks     bigint  not null default 10,

  -- Lookback. 7 days matches how Meta itself frames fatigue diagnosis.
  window_days    integer not null default 7 check (window_days between 1 and 90),

  -- How long the same rule stays quiet about the same ad after firing. Meta
  -- re-sends a condition for as long as it persists; without this, one bad ad
  -- notifies on every cron tick until it is fixed. `meta-ads-alerts` already
  -- uses a 6h suppression for webhook issues — 24h here because a guardrail
  -- breach is a decision to make, not an outage to fix in the next hour.
  cooldown_hours integer not null default 24 check (cooldown_hours between 1 and 720),

  enabled        boolean not null default true,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.meta_ad_guardrails is
  'Founder-editable threshold rules for live Meta ads, evaluated against OUR '
  'spend-to-bookings data rather than Meta''s reported conversions. Notify-only: '
  'nothing here pauses an ad. See META-ADS-HANDOFF.md.';

comment on column public.meta_ad_guardrails.threshold_mode is
  'pct_of_ticket_price makes one rule work across a Rs.299 meetup and a Rs.3,700 '
  'weekend by scaling to the dominant event''s price_full. Only cost_per_ticket '
  'honours it.';

alter table public.meta_ad_guardrails enable row level security;

-- Founders only. Marketers and creators are `authenticated` too, and ad
-- economics are not theirs to read or change.
drop policy if exists meta_ad_guardrails_admin_all on public.meta_ad_guardrails;
create policy meta_ad_guardrails_admin_all on public.meta_ad_guardrails
  for all to authenticated
  using (public.is_admin_strict())
  with check (public.is_admin_strict());

-- ---------------------------------------------------------------------------
-- 2. What has already fired — the cooldown ledger AND the panel's history.
-- ---------------------------------------------------------------------------
-- This exists for a reason beyond cooldown: today a push notification is the
-- only surface a guardrail has, so a missed notification is invisible forever.
-- Handoff §13 flags exactly that gap for meta-ads-alerts. Writing every breach
-- down means the panel can show what fired while the founder was asleep.
create table if not exists public.meta_ad_guardrail_events (
  id           uuid primary key default gen_random_uuid(),
  rule_key     text not null,
  label        text not null,
  ad_id        text not null,
  ad_name      text,
  metric       text not null,

  -- Both sides of the comparison are stored, not just the fact of a breach.
  -- "CPA was Rs.412 against a Rs.180 ceiling" is actionable; "rule 3 fired" is
  -- not, and a threshold edited later would otherwise silently rewrite the
  -- meaning of every historical row.
  observed     numeric,
  threshold    numeric,
  window_days  integer,

  -- Free-form supporting numbers (spend, tickets, impressions) so the push text
  -- and the panel row can explain themselves without re-querying.
  context      jsonb,

  fired_at     timestamptz not null default now(),
  notified_at  timestamptz,
  notify_error text
);

create index if not exists meta_ad_guardrail_events_cooldown_idx
  on public.meta_ad_guardrail_events (rule_key, ad_id, fired_at desc);

create index if not exists meta_ad_guardrail_events_recent_idx
  on public.meta_ad_guardrail_events (fired_at desc);

comment on table public.meta_ad_guardrail_events is
  'Every guardrail breach, whether or not the push succeeded. Doubles as the '
  'cooldown ledger and as the panel history — a push is otherwise the only '
  'surface, so a missed notification would be invisible.';

alter table public.meta_ad_guardrail_events enable row level security;

drop policy if exists meta_ad_guardrail_events_admin_read on public.meta_ad_guardrail_events;
create policy meta_ad_guardrail_events_admin_read on public.meta_ad_guardrail_events
  for select to authenticated
  using (public.is_admin_strict());
-- No INSERT policy on purpose: only the cron (service_role, which bypasses RLS)
-- writes here. A breach record that a client could forge is worthless.

-- ---------------------------------------------------------------------------
-- 3. The evaluator.
-- ---------------------------------------------------------------------------
-- SPLIT INTO TWO FUNCTIONS ON PURPOSE. is_admin_strict() reads
-- auth.jwt() ->> 'email', so it is FALSE for the service_role key the cron uses.
-- A single founder-gated function would therefore hand the cron a NULL and the
-- breaker would never fire — silently, looking healthy, which is the exact
-- failure class §9 of the handoff is a catalogue of. So:
--   meta_ad_guardrail_breaches()      — ungated core, granted to service_role ONLY.
--   get_meta_ad_guardrail_breaches()  — founder-gated wrapper for the panel.
-- Neither one is reachable by anon or by a non-founder authenticated user.
create or replace function public.meta_ad_guardrail_breaches()
returns table (
  rule_key    text,
  label       text,
  ad_id       text,
  ad_name     text,
  metric      text,
  observed    numeric,
  threshold   numeric,
  window_days integer,
  context     jsonb
)
language sql
stable
security definer
set search_path to 'public'
as $function$
with
-- Every ad with spend inside the widest window any enabled rule asks for.
-- Computed once at the widest window and filtered per-rule below, so a rule
-- with a 7-day window and one with a 30-day window do not each re-scan.
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
    -- Frequency is a ratio and does NOT sum across days. Recomputing it from
    -- its own definition (impressions per person reached) is correct where
    -- summing the per-day figure would silently multiply it by the day count.
    -- reach does not strictly sum either — the same person on two days is
    -- counted twice — so this reads slightly LOW, i.e. it under-alarms rather
    -- than over-alarms. That is the safe direction for a fatigue signal.
    case when sum(d.reach) > 0
         then round(sum(d.impressions)::numeric / sum(d.reach), 3) end as frequency,
    min(d.date_start)                       as first_day
  from public.meta_ad_daily d
  where d.date_start >= current_date - ((select days from horizon) - 1)
  group by d.ad_id
),
-- Bookings this ad produced. Same ad-id idiom as get_meta_ads_performance and
-- get_meta_ad_funnel — {{ad.id}} always expands to digits, so organic tags like
-- 'link_in_bio' are real attribution but must never read as paid traffic.
bookings as (
  select
    a.attribution->>'utm_content' as ad_id,
    a.event_slug,
    count(*)                                                              as leads,
    count(*) filter (where a.status in ('advance_paid','fully_paid'))      as tickets
  from public.applications a
  where a.attribution->>'utm_content' ~ '^[0-9]{6,}$'
    and (a.created_at at time zone 'Asia/Kolkata')::date
        >= current_date - ((select days from horizon) - 1)
  group by 1, 2
),
per_ad_bookings as (
  select
    ad_id,
    sum(leads)   as leads,
    sum(tickets) as tickets,
    -- The event this ad predominantly sold, used to resolve an event-scoped
    -- rule and to price a pct_of_ticket_price threshold. Ties break by slug so
    -- the answer is deterministic rather than whatever the planner returns.
    (array_agg(event_slug order by tickets desc, leads desc, event_slug))[1]
      as dominant_event_slug
  from bookings
  group by ad_id
),
-- Tagged funnel sessions, for the tracking-integrity rule. Spend with zero
-- tagged sessions means {{ad.id}} is missing from that ad's URL Parameters —
-- the one failure in this whole system that cannot be repaired retroactively.
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
-- Has the funnel EVER recorded a traffic source? Until src/attribution.ts ships,
-- flow_analytics.attribution is NULL on every row, so `tagged` above is empty
-- for every ad — and untagged_spend would fire on ALL of them, healthy ones
-- included, telling the founder "{{ad.id}} is missing" when the real cause is
-- our own undeployed client. Caught in the 2026-09-08 wiring test, where the
-- deliberately-healthy fixture ad still tripped it.
--
-- An alarm that is always on gets muted, and muting is how the one alarm that
-- matters gets missed — so the rule stays SILENT until capture is live, at
-- which point a zero-tagged ad really does mean the URL parameter is missing.
-- Same discriminator get_meta_ad_volume_status exposes as capture_live_since.
capture_live as (
  select exists (
    select 1 from public.flow_analytics where attribution is not null
  ) as live
),
-- Ticket price of the dominant event, for pct_of_ticket_price. city_details is
-- keyed by city name and this account prices per city, so the max across cities
-- is the intended "what this ticket costs". Falls back to NULL, which disables
-- a percentage rule for that ad rather than inventing a ceiling.
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
    p.price_full
  from spend s
  left join per_ad_bookings b on b.ad_id = s.ad_id
  left join tagged t          on t.ad_id = s.ad_id
  left join event_price p     on p.slug  = b.dominant_event_slug
),
-- Most specific rule wins: a rule scoped to this ad's dominant event beats a
-- global one for the same metric. Without this, adding a per-event override
-- would double-alarm rather than replace.
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
-- Resolve the metric and the ceiling into two plain numbers, so the comparison
-- below is one expression instead of a branch per metric.
evaluated as (
  select
    r.*,
    case r.metric
      when 'cost_per_ticket'      then case when r.tickets > 0
                                            then round(r.spend / r.tickets, 2) end
      -- leads > 0 is what keeps this disjoint from spend_without_lead below.
      when 'spend_without_ticket' then case when r.tickets = 0 and r.leads > 0
                                            then r.spend end
      when 'spend_without_lead'   then case when r.leads   = 0 then r.spend end
      when 'frequency'            then r.frequency
      when 'ctr'                  then case when r.impressions > 0
                                            then round(100.0 * r.clicks / r.impressions, 3) end
      -- Gated on capture_live: see the CTE. Silent, not falsely reassuring —
      -- while capture is dead this question genuinely cannot be answered.
      when 'untagged_spend'       then case when r.tagged_sessions = 0
                                             and (select live from capture_live)
                                            then r.spend end
    end as observed,
    case
      when r.metric = 'cost_per_ticket' and r.threshold_mode = 'pct_of_ticket_price'
        -- The >= 50 floor keeps a percentage ceiling off PLACEHOLDER-PRICED
        -- events. This account carries live rows priced at Rs.2 and Rs.3 (the
        -- founder tests real flows with real tiny payments, by design), and 40%
        -- of Rs.2 is a 80-paise ceiling that every real ad would breach on its
        -- first click. An alarm that is always on is an alarm that gets muted,
        -- and muting is how the ONE alarm that matters gets missed.
        --
        -- THIS IS NOT the amount-based filter the founder rejected. That
        -- decision was about which PAYMENTS reach Meta's dataset, and it stands
        -- untouched — every rupee still reports. This only declines to compute a
        -- percentage OF a price that is standing in for a real one. Absolute-mode
        -- rules are unaffected and still judge those events normally.
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
    'threshold_mode', e.threshold_mode
  ) as context
from evaluated e
where
  -- Both sides must be real numbers. A NULL observed means the metric does not
  -- apply to this ad (it HAS tickets, so spend_without_ticket is silent) — that
  -- is a non-event, not a breach. Handoff §9: null and zero are different
  -- answers, everywhere.
  e.observed is not null
  and e.effective_threshold is not null
  -- Noise floors, per rule.
  and e.spend       >= e.min_spend
  and e.impressions >= e.min_impressions
  and e.clicks      >= e.min_clicks
  and case e.comparator
        when 'gt' then e.observed > e.effective_threshold
        when 'lt' then e.observed < e.effective_threshold
      end
  -- Cooldown: has this exact rule already spoken about this exact ad recently?
  and not exists (
    select 1 from public.meta_ad_guardrail_events ev
    where ev.rule_key = e.rule_key
      and ev.ad_id    = e.ad_id
      and ev.fired_at > now() - make_interval(hours => e.cooldown_hours)
  )
order by e.spend desc;
$function$;

comment on function public.meta_ad_guardrail_breaches() is
  'Ungated core evaluator. Granted to service_role ONLY — is_admin_strict() is '
  'false for the cron''s key, so gating this would silently disable the breaker. '
  'Founders read it through get_meta_ad_guardrail_breaches().';

revoke all on function public.meta_ad_guardrail_breaches() from public, anon, authenticated;
grant execute on function public.meta_ad_guardrail_breaches() to service_role;

-- Panel-facing wrapper. SECURITY DEFINER, so it may call the core its caller
-- cannot. Returns zero rows for a non-founder rather than raising — same shape
-- as the other founder-gated readers in this project.
create or replace function public.get_meta_ad_guardrail_breaches()
returns table (
  rule_key    text,
  label       text,
  ad_id       text,
  ad_name     text,
  metric      text,
  observed    numeric,
  threshold   numeric,
  window_days integer,
  context     jsonb
)
language sql
stable
security definer
set search_path to 'public'
as $function$
  select * from public.meta_ad_guardrail_breaches()
  where public.is_admin_strict();
$function$;

revoke all on function public.get_meta_ad_guardrail_breaches() from public, anon;
grant execute on function public.get_meta_ad_guardrail_breaches() to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Seed rules.
-- ---------------------------------------------------------------------------
-- Founder's stated policy (2026-09-08): "cost per ticket — must pay for itself
-- now". Every number below is a starting point he can change with an UPDATE;
-- none of them is a claim about what his margins actually are.
--
-- 40% of ticket price is a deliberately conservative opening ceiling: it leaves
-- 60% for PayU fees, marketer/manager/creator commission and the actual cost of
-- running the event. It is NOT derived from measured delivery costs, because
-- those are not in the database. Tune it once a real event's costs are known.
insert into public.meta_ad_guardrails
  (rule_key, label, metric, comparator, threshold, threshold_mode,
   min_spend, min_impressions, min_clicks, window_days, cooldown_hours, notes)
values
  ('cpa_over_40pct',
   'Cost per ticket above 40% of the ticket price',
   'cost_per_ticket', 'gt', 40, 'pct_of_ticket_price',
   500, 1000, 10, 7, 24,
   'Scales itself across a Rs.299 meetup and a Rs.3,700 weekend. Raise the 40 '
   'if you decide a first ticket may lose money to win a member.'),

  ('spend_no_ticket_1000',
   'Rs.1,000 spent, people started booking, nobody paid',
   'spend_without_ticket', 'gt', 1000, 'absolute',
   1000, 1000, 10, 7, 24,
   'A CONVERSION problem: the ad works, the offer or the checkout does not. '
   'Look at the funnel drop-off for this ad before touching the creative.'),

  ('spend_no_lead_500',
   'Rs.500 spent, not one lead',
   'spend_without_lead', 'gt', 500, 'absolute',
   500, 1000, 10, 7, 24,
   'A TRAFFIC problem: wrong audience or wrong creative. Disjoint from the '
   'rule above by construction, so an ad never trips both.'),

  ('frequency_over_3',
   'Same people seeing this ad 3+ times',
   'frequency', 'gt', 3, 'absolute',
   500, 1000, 10, 7, 48,
   'Creative fatigue. Reads slightly low by construction, so it under-alarms.'),

  ('ctr_under_half_pct',
   'Click-through under 0.5%',
   'ctr', 'lt', 0.5, 'absolute',
   500, 2000, 10, 7, 48,
   'The creative is not landing. Higher impression floor than the others '
   'because CTR is the noisiest ratio here.'),

  ('untagged_spend_300',
   'Ad is spending but sends no tagged traffic',
   'untagged_spend', 'gt', 300, 'absolute',
   300, 1000, 10, 7, 12,
   'Means {{ad.id}} is missing from that ad''s URL Parameters. THE URGENT ONE: '
   'attribution missed while this is true can never be recovered. Low floor and '
   'a short cooldown on purpose.')
on conflict (rule_key) do nothing;
