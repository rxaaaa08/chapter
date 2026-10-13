-- Unified customer analytics, phase 3 of 8: reading.
--
-- Design:    docs/UNIFIED-CUSTOMER-ANALYTICS-PROPOSAL-v2-2026-10-11.md §7.3, §8, §9
-- Build log: docs/UNIFIED-ANALYTICS-BUILD-LOG.md
--
-- Three things, all read-only towards the rest of the system:
--   1. a saved summary of each visit, because flow_analytics is cleared after
--      90 days every night (purge_flow_analytics) and anything not summarised
--      by then is gone;
--   2. the rules that say whose a visit is, kept as views so they can change
--      without touching what was recorded;
--   3. one timeline per phone number across every table that knows something.

-- The reading rules carry a version. Every result says which version produced
-- it, so a change to the rules can never silently rewrite an earlier answer.
create or replace function analytics.rule_version()
returns integer language sql immutable as $$ select 1 $$;

create or replace function analytics.is_test_phone(p_phone text)
returns boolean language sql immutable as $$
  select coalesce(p_phone ~ '^(90000000|88888888|99999999)', false)
$$;

-- ── 1. Saved summaries ───────────────────────────────────────────────────────

create table if not exists analytics.visit_summary (
  session_id     text primary key,
  visitor_id     uuid,
  started_at     timestamptz not null,
  last_at        timestamptz not null,
  n_rows         integer     not null,
  landing_page   text,
  ref_host       text,
  browser        text,
  device         text,
  storage        text,
  internal       boolean not null default false,
  attribution    jsonb,
  utm_source     text,
  utm_medium     text,
  utm_campaign   text,
  utm_content    text,
  ad_id          text,
  affiliate_code text,
  steps          jsonb   not null default '{}'::jsonb,
  furthest_rank  smallint not null default 0,
  furthest       text    not null default 'landed',
  refreshed_at   timestamptz not null default now()
);

comment on table analytics.visit_summary is
  'One row per website visit, rebuilt nightly by analytics.refresh_visits() BEFORE purge_flow_analytics clears steps older than 90 days. This is the purge-proof record of a visit, as analytics_daily is of a day. steps = {step name: first time it happened}. It holds no phone number: whose visit it was is worked out by analytics.v_visit_resolved from the evidence.';

create index if not exists visit_summary_started_idx on analytics.visit_summary (started_at);
create index if not exists visit_summary_visitor_idx on analytics.visit_summary (visitor_id) where visitor_id is not null;
create index if not exists visit_summary_ad_idx      on analytics.visit_summary (ad_id)      where ad_id is not null;

-- One row per visit AND plan, with the first time each ladder step happened for
-- that plan. A ladder needs this shape: one visit can open two plans (82 of 471
-- did, measured 2026-10-11), and a ladder that ignores the plan lets a form
-- opened for plan B "follow" a price seen for plan A.
create table if not exists analytics.visit_plan_steps (
  session_id       text not null,
  plan_key         text not null,   -- the plan's permanent id, or 'raw:<what the site sent>' when it matches no current plan
  plan_id          uuid,
  raw_event_id     text,
  title            text,
  opened_at        timestamptz,
  calendar_at      timestamptz,
  date_at          timestamptz,
  price_at         timestamptz,
  book_at          timestamptz,
  contact_at       timestamptz,
  form_open_at     timestamptz,
  form_done_at     timestamptz,
  app_started_at   timestamptz,
  app_submitted_at timestamptz,
  payu_at          timestamptz,
  other            jsonb not null default '{}'::jsonb,
  refreshed_at     timestamptz not null default now(),
  primary key (session_id, plan_key)
);

comment on table analytics.visit_plan_steps is
  'One row per visit and plan: the first time each ladder step happened for that plan in that visit. plan_id is NULL when what the site sent matches no current plan by slug or permanent id, and no single plan by title; such rows are kept under plan_key ''raw:…'' and never guessed.';

create index if not exists visit_plan_steps_plan_idx on analytics.visit_plan_steps (plan_id, opened_at);

alter table analytics.visit_summary    enable row level security;
alter table analytics.visit_plan_steps enable row level security;
revoke all on analytics.visit_summary    from public, anon, authenticated;
revoke all on analytics.visit_plan_steps from public, anon, authenticated;

-- Rebuilds the summaries of every visit that had a step in the last p_days.
--
-- When a visit is re-read, an earlier first-time always wins and a count never
-- goes down. In the normal case the re-read sees the same rows and nothing
-- changes; the rule only matters for a tab left open across the 90-day line,
-- where the older steps are already gone and must not be forgotten.
create or replace function analytics.refresh_visits(p_days integer default 3)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_since  timestamptz := now() - make_interval(days => greatest(coalesce(p_days, 3), 1));
  v_visits integer;
  v_plans  integer;
begin
  with touched as (
    select distinct f.session_id
    from public.flow_analytics f
    where f.created_at >= v_since
      and f.session_id ~ '^[0-9a-fA-F-]{16,64}$'
  ),
  r as (
    select f.* from public.flow_analytics f join touched t on t.session_id = f.session_id
  ),
  firsts as (
    select session_id, event_type, min(created_at) as first_at from r group by 1, 2
  ),
  st as (
    select session_id,
           jsonb_object_agg(event_type, first_at) as steps,
           max(case event_type
                 when 'external_redirect_initiated' then 9
                 when 'details_form_submitted'      then 8
                 when 'application_submitted'       then 8
                 when 'details_form_opened'         then 7
                 when 'application_started'         then 7
                 when 'book_cta_clicked'            then 6
                 when 'contact_cta_clicked'         then 6
                 when 'reached_pricing'             then 5
                 when 'date_selected'               then 4
                 when 'calendar_opened'             then 3
                 when 'event_selected'              then 2
                 when 'city_selected'               then 1
                 else 0 end)::smallint as rnk
    from firsts group by 1
  ),
  agg as (
    select session_id,
           (array_agg(visitor_id  order by created_at) filter (where visitor_id  is not null))[1] as visitor_id,
           min(created_at) as started_at,
           max(created_at) as last_at,
           count(*)::int   as n_rows,
           (array_agg(context     order by created_at) filter (where context     is not null))[1] as ctx,
           (array_agg(attribution order by created_at) filter (where attribution is not null))[1] as attribution,
           coalesce(bool_or((context ->> 'internal')::boolean), false) as internal
    from r group by 1
  )
  insert into analytics.visit_summary as vs
    (session_id, visitor_id, started_at, last_at, n_rows, landing_page, ref_host, browser, device, storage,
     internal, attribution, utm_source, utm_medium, utm_campaign, utm_content, ad_id, affiliate_code,
     steps, furthest_rank, furthest, refreshed_at)
  select a.session_id, a.visitor_id, a.started_at, a.last_at, a.n_rows,
         a.ctx ->> 'landing_page', a.ctx ->> 'ref_host', a.ctx ->> 'browser', a.ctx ->> 'device', a.ctx ->> 'storage',
         a.internal, a.attribution,
         a.attribution ->> 'utm_source', a.attribution ->> 'utm_medium', a.attribution ->> 'utm_campaign',
         a.attribution ->> 'utm_content',
         -- Same test get_meta_ads_performance uses to recognise an ad's id.
         case when (a.attribution ->> 'utm_content') ~ '^[0-9]{6,}$' then a.attribution ->> 'utm_content' end,
         a.attribution ->> 'affiliate_code',
         s.steps, s.rnk,
         case s.rnk when 9 then 'sent_to_payu' when 8 then 'form_finished' when 7 then 'form_opened'
                    when 6 then 'book_or_contact' when 5 then 'price_seen' when 4 then 'date_picked'
                    when 3 then 'calendar_opened' when 2 then 'plan_opened' when 1 then 'city_picked'
                    else 'landed' end,
         now()
  from agg a join st s on s.session_id = a.session_id
  on conflict (session_id) do update set
    visitor_id     = coalesce(vs.visitor_id, excluded.visitor_id),
    started_at     = least(vs.started_at, excluded.started_at),
    last_at        = greatest(vs.last_at, excluded.last_at),
    n_rows         = greatest(vs.n_rows, excluded.n_rows),
    landing_page   = coalesce(vs.landing_page, excluded.landing_page),
    ref_host       = coalesce(vs.ref_host, excluded.ref_host),
    browser        = coalesce(vs.browser, excluded.browser),
    device         = coalesce(vs.device, excluded.device),
    storage        = coalesce(vs.storage, excluded.storage),
    internal       = vs.internal or excluded.internal,
    attribution    = coalesce(vs.attribution, excluded.attribution),
    utm_source     = coalesce(vs.utm_source, excluded.utm_source),
    utm_medium     = coalesce(vs.utm_medium, excluded.utm_medium),
    utm_campaign   = coalesce(vs.utm_campaign, excluded.utm_campaign),
    utm_content    = coalesce(vs.utm_content, excluded.utm_content),
    ad_id          = coalesce(vs.ad_id, excluded.ad_id),
    affiliate_code = coalesce(vs.affiliate_code, excluded.affiliate_code),
    steps          = excluded.steps || vs.steps,
    furthest_rank  = greatest(vs.furthest_rank, excluded.furthest_rank),
    furthest       = case when excluded.furthest_rank > vs.furthest_rank then excluded.furthest else vs.furthest end,
    refreshed_at   = now();
  get diagnostics v_visits = row_count;

  with touched as (
    select distinct f.session_id
    from public.flow_analytics f
    where f.created_at >= v_since
      and f.session_id ~ '^[0-9a-fA-F-]{16,64}$'
  ),
  -- A title is only trusted to name a plan when exactly one plan has it.
  one_title as (
    select lower(title) as ltitle, (array_agg(id))[1] as id
    from public.events group by 1 having count(*) = 1
  ),
  r as (
    select f.session_id, f.event_type, f.created_at, f.event_id, f.event_title,
           coalesce(e.id, ot.id) as plan_id
    from public.flow_analytics f
    join touched t on t.session_id = f.session_id
    left join public.events e on (e.slug = f.event_id or e.id::text = f.event_id)
    left join one_title ot on e.id is null and ot.ltitle = lower(f.event_title)
    where f.event_id is not null or f.event_title is not null
  ),
  k as (
    select r.*,
           coalesce(r.plan_id::text,
                    'raw:' || coalesce(nullif(r.event_id, ''), nullif(lower(r.event_title), ''), 'unknown')) as plan_key
    from r
  ),
  other_firsts as (
    select session_id, plan_key, event_type, min(created_at) as first_at
    from k
    where event_type not in ('event_selected', 'calendar_opened', 'date_selected', 'reached_pricing',
                             'book_cta_clicked', 'contact_cta_clicked', 'details_form_opened',
                             'details_form_submitted', 'application_started', 'application_submitted',
                             'external_redirect_initiated')
    group by 1, 2, 3
  ),
  other as (
    select session_id, plan_key, jsonb_object_agg(event_type, first_at) as other
    from other_firsts group by 1, 2
  ),
  agg as (
    select session_id, plan_key,
           (array_agg(plan_id))[1]  as plan_id,
           max(event_id)            as raw_event_id,
           max(event_title)         as title,
           min(created_at) filter (where event_type = 'event_selected')              as opened_at,
           min(created_at) filter (where event_type = 'calendar_opened')             as calendar_at,
           min(created_at) filter (where event_type = 'date_selected')               as date_at,
           min(created_at) filter (where event_type = 'reached_pricing')             as price_at,
           min(created_at) filter (where event_type = 'book_cta_clicked')            as book_at,
           min(created_at) filter (where event_type = 'contact_cta_clicked')         as contact_at,
           min(created_at) filter (where event_type = 'details_form_opened')         as form_open_at,
           min(created_at) filter (where event_type = 'details_form_submitted')      as form_done_at,
           min(created_at) filter (where event_type = 'application_started')         as app_started_at,
           min(created_at) filter (where event_type = 'application_submitted')       as app_submitted_at,
           min(created_at) filter (where event_type = 'external_redirect_initiated') as payu_at
    from k group by 1, 2
  )
  insert into analytics.visit_plan_steps as ps
    (session_id, plan_key, plan_id, raw_event_id, title, opened_at, calendar_at, date_at, price_at, book_at,
     contact_at, form_open_at, form_done_at, app_started_at, app_submitted_at, payu_at, other, refreshed_at)
  select a.session_id, a.plan_key, a.plan_id, a.raw_event_id, a.title, a.opened_at, a.calendar_at, a.date_at,
         a.price_at, a.book_at, a.contact_at, a.form_open_at, a.form_done_at, a.app_started_at,
         a.app_submitted_at, a.payu_at, coalesce(o.other, '{}'::jsonb), now()
  from agg a
  left join other o on o.session_id = a.session_id and o.plan_key = a.plan_key
  on conflict (session_id, plan_key) do update set
    plan_id          = coalesce(ps.plan_id, excluded.plan_id),
    raw_event_id     = coalesce(ps.raw_event_id, excluded.raw_event_id),
    title            = coalesce(ps.title, excluded.title),
    opened_at        = least(ps.opened_at, excluded.opened_at),
    calendar_at      = least(ps.calendar_at, excluded.calendar_at),
    date_at          = least(ps.date_at, excluded.date_at),
    price_at         = least(ps.price_at, excluded.price_at),
    book_at          = least(ps.book_at, excluded.book_at),
    contact_at       = least(ps.contact_at, excluded.contact_at),
    form_open_at     = least(ps.form_open_at, excluded.form_open_at),
    form_done_at     = least(ps.form_done_at, excluded.form_done_at),
    app_started_at   = least(ps.app_started_at, excluded.app_started_at),
    app_submitted_at = least(ps.app_submitted_at, excluded.app_submitted_at),
    payu_at          = least(ps.payu_at, excluded.payu_at),
    other            = excluded.other || ps.other,
    refreshed_at     = now();
  get diagnostics v_plans = row_count;

  return jsonb_build_object('visits', v_visits, 'visit_plans', v_plans, 'since', v_since);
end;
$fn$;

revoke all on function analytics.refresh_visits(integer) from public, anon, authenticated;

-- Nightly at 02:50 UTC: after snapshot_analytics_daily (02:35) and before
-- purge_flow_analytics (03:17). Three days are re-read each night, so one
-- missed run loses nothing.
select cron.unschedule('analytics-refresh-visits')
  where exists (select 1 from cron.job where jobname = 'analytics-refresh-visits');
select cron.schedule('analytics-refresh-visits', '50 2 * * *', $$select analytics.refresh_visits(3)$$);

-- ── 2. Whose visit is it ─────────────────────────────────────────────────────
--
-- Rule version 1. Reported in separate levels, never blended:
--   verified        one number proved by a code in this visit, and no other number seen
--   verified_mixed  one number proved by a code; some other number was also typed or linked
--                   here. The proof stands (a weaker line never displaces a stronger one)
--   link            no code; the only number seen arrived by a link we sent to it.
--                   Says which message the visit came from. Does not prove who is holding it
--   claimed         no code; the only number seen was typed, or named in the address
--   conflict        two numbers proved by code in one visit: nobody is assigned
--   unclear         several numbers, none proved: nobody is assigned
create or replace view analytics.v_visit_contact
with (security_invoker = true) as
with per as (
  select session_id,
         (array_agg(visitor_id) filter (where visitor_id is not null))[1]            as visitor_id,
         coalesce(array_agg(distinct phone) filter (where strength = 3), '{}'::text[]) as proved,
         array_agg(distinct phone)                                                    as named,
         max(strength)                                                                as top,
         min(observed_at)                                                             as first_at,
         max(observed_at)                                                             as last_at
  from analytics.v_identity_evidence
  group by session_id
)
select session_id, visitor_id,
       case when cardinality(proved) = 1 then proved[1]
            when cardinality(proved) = 0 and cardinality(named) = 1 then named[1]
       end as phone,
       case when cardinality(proved) > 1 then 'conflict'
            when cardinality(proved) = 1 and cardinality(named) = 1 then 'verified'
            when cardinality(proved) = 1 then 'verified_mixed'
            when cardinality(named) > 1 then 'unclear'
            when top = 2 then 'link'
            else 'claimed'
       end as level,
       named as numbers_seen, first_at, last_at,
       analytics.rule_version() as rule_v
from per;

-- A browser is taken to be one contact's ONLY when a code proved exactly one
-- number in it and no other number of any kind was ever seen in it. A typed
-- number or a link, alone, never claims a browser.
--
-- No test of how the browser id was stored is needed for correctness: an id
-- kept only in memory or in the tab is different on the next visit, so it
-- cannot match one. Storage mode is recorded (context.storage) to measure how
-- many visits COULD be linked, not to decide whether a link is right.
create or replace view analytics.v_browser_contact
with (security_invoker = true) as
select visitor_id, proved[1] as phone, first_proof, last_proof
from (
  select visitor_id,
         coalesce(array_agg(distinct phone) filter (where strength = 3), '{}'::text[]) as proved,
         array_agg(distinct phone)                                                    as named,
         min(observed_at) filter (where strength = 3)                                 as first_proof,
         max(observed_at) filter (where strength = 3)                                 as last_proof
  from analytics.v_identity_evidence
  where visitor_id ~ '^[0-9a-fA-F-]{16,64}$'
  group by visitor_id
) b
where cardinality(proved) = 1 and cardinality(named) = 1;

-- Every summarised visit with its level. 'inferred' = no evidence of its own,
-- but its browser belongs to exactly one contact (above) and the visit started
-- no more than 30 days before that browser's first proof and no more than 90
-- days after its last. 'anonymous' = everything else.
create or replace view analytics.v_visit_resolved
with (security_invoker = true) as
select vs.session_id, vs.visitor_id, vs.started_at,
       coalesce(c.phone,
                case when c.session_id is null
                      and vs.started_at between b.first_proof - interval '30 days' and b.last_proof + interval '90 days'
                     then b.phone end) as phone,
       coalesce(c.level,
                case when vs.started_at between b.first_proof - interval '30 days' and b.last_proof + interval '90 days'
                     then 'inferred' end,
                'anonymous') as level,
       analytics.rule_version() as rule_v
from analytics.visit_summary vs
left join analytics.v_visit_contact  c on c.session_id = vs.session_id
left join analytics.v_browser_contact b on b.visitor_id = vs.visitor_id::text;

revoke all on analytics.v_visit_contact   from public, anon, authenticated;
revoke all on analytics.v_browser_contact from public, anon, authenticated;
revoke all on analytics.v_visit_resolved  from public, anon, authenticated;

-- ── 3. One timeline per phone number ─────────────────────────────────────────
--
-- Nothing is copied: every line points back at the row it came from (src,
-- src_id). `level` says how the line is tied to this number: 'known' for
-- anything already stored under the phone, or the visit's level from above for
-- website steps.
--
-- Honest gaps, stated here so nobody reads silence as "nothing happened":
--   * a payment is one line at the time it was STARTED, with how it ended.
--     When it ended is not recorded anywhere.
--   * a refused booking code is not a line: only a count of attempts is kept.
--   * refunds and cancellations are not recorded anywhere, so they cannot appear.
--   * website steps appear only for visits that could be tied to the number.
create or replace function analytics.contact_timeline(p_phone text)
returns table (at timestamptz, kind text, plan text, detail jsonb, src text, src_id text, level text)
language sql
stable
security definer
set search_path = pg_catalog, public
as $fn$
  with p as (select public.wa_normalise_phone(p_phone) as phone),
  my_visits as (
    select c.session_id, c.level
    from analytics.v_visit_contact c, p
    where c.phone = p.phone
    union
    select r.session_id, r.level
    from analytics.v_visit_resolved r, p
    where r.phone = p.phone and r.level = 'inferred'
  )
  -- messages from them
  select coalesce(i.sent_at, i.received_at), 'message_from_them', null::text,
         jsonb_build_object('type', i.msg_type, 'from_ad', i.referral is not null,
                            'ad_id', i.referral ->> 'source_id', 'text', left(i.body_text, 160)),
         'whatsapp_inbound', i.id::text, 'known'
  from public.whatsapp_inbound i, p
  where public.wa_normalise_phone(i.from_phone) = p.phone

  union all
  -- messages to them, one line per thing that happened to each
  select x.at, x.kind, null::text,
         jsonb_strip_nulls(jsonb_build_object(
           'template', s.template_name,
           'accepted', case when x.kind = 'message_to_them' then s.send_ok end,
           'button',   case when x.kind = 'message_tapped'  then s.clicked_button end,
           'error',    case when x.kind = 'message_failed'  then s.error_code end)),
         'whatsapp_sends', s.id::text, 'known'
  from public.whatsapp_sends s
  cross join lateral (values
      (coalesce(s.sent_at, s.created_at), 'message_to_them'),
      (s.delivered_at, 'message_delivered'),
      (s.read_at,      'message_read'),
      (s.clicked_at,   'message_tapped'),
      (s.failed_at,    'message_failed')) as x(at, kind),
       p
  where x.at is not null and public.wa_normalise_phone(s.to_phone) = p.phone

  union all
  -- emails, through the booking they belong to
  select x.at, x.kind, a.event_slug,
         jsonb_build_object('email_kind', e.kind),
         'email_sends', e.id::text, 'known'
  from public.email_sends e
  join public.applications a on a.id = e.application_id
  cross join lateral (values
      (coalesce(e.sent_at, e.created_at), 'email_to_them'),
      (e.delivered_at, 'email_delivered'),
      (e.opened_at,    'email_opened'),
      (e.clicked_at,   'email_clicked'),
      (e.failed_at,    'email_failed')) as x(at, kind),
       p
  where x.at is not null and a.phone = p.phone

  union all
  -- booking codes
  select o.created_at, 'code_asked', o.event_slug,
         jsonb_build_object('visit_recorded', o.session_id is not null),
         'open_event_otp_sessions', o.id::text, 'known'
  from public.open_event_otp_sessions o, p
  -- A row made by the chat-reply link never had a code sent for it.
  where o.phone = p.phone and o.verified_via is distinct from 'chat_link'
  union all
  select o.verified_at,
         case when o.verified_via = 'chat_link' then 'verified_by_chat_link' else 'code_verified' end,
         o.event_slug,
         jsonb_strip_nulls(jsonb_build_object('message_id', o.via_send_id)),
         'open_event_otp_sessions', o.id::text, 'known'
  from public.open_event_otp_sessions o, p
  where o.phone = p.phone and o.verified_at is not null

  union all
  -- the booking, then every recorded change to it
  select a.created_at, 'booking_created', a.event_slug,
         jsonb_build_object('status_now', a.status, 'date_now', a.selected_date, 'tickets', a.ticket_count),
         'applications', a.id::text, 'known'
  from public.applications a, p
  where a.phone = p.phone
  union all
  select h.changed_at, 'booking_changed', h.event_slug,
         jsonb_build_object('what', h.field, 'from', h.old_value, 'to', h.new_value, 'by', h.changed_role),
         'application_events', h.id::text, 'known'
  from public.application_events h, p
  where h.phone = p.phone and h.field not in ('created', 'baseline')

  union all
  select b.opened_at, 'bill_opened', b.event_slug, '{}'::jsonb, 'bill_opens', b.id::text, 'known'
  from public.bill_opens b, p
  where b.phone = p.phone

  union all
  select pp.created_at, 'payment_started', pp.event_slug,
         jsonb_strip_nulls(jsonb_build_object('part', pp.payment_type, 'amount', pp.amount,
                                              'ended_as', pp.status, 'method', pp.payu_response ->> 'mode',
                                              'tickets', pp.quantity)),
         'payu_payments', pp.id::text, 'known'
  from public.payu_payments pp, p
  where pp.phone = p.phone

  union all
  select d.submitted_at, 'question_asked', coalesce(d.event_title, d.event_id),
         jsonb_build_object('text', left(d.doubt, 160)),
         'doubt_submissions', d.id::text, 'known'
  from public.doubt_submissions d, p
  where public.wa_normalise_phone(d.phone) = p.phone
  union all
  select d.created_at, 'question_asked', d.event_slug,
         jsonb_build_object('text', left(d.message, 160), 'status', d.status),
         'plan_doubts', d.id::text, 'known'
  from public.plan_doubts d, p
  where public.wa_normalise_phone(d.phone) = p.phone

  union all
  -- one line per visit, from the saved summary (survives the 90-day clean-up)
  select vs.started_at, 'visit_started', null::text,
         jsonb_strip_nulls(jsonb_build_object(
           'landing_page', vs.landing_page, 'came_from', vs.ref_host, 'browser', vs.browser, 'device', vs.device,
           'utm_source', vs.utm_source, 'utm_campaign', vs.utm_campaign, 'ad_id', vs.ad_id,
           'creator', vs.affiliate_code, 'furthest', vs.furthest)),
         'visit_summary', vs.session_id, mv.level
  from analytics.visit_summary vs
  join my_visits mv on mv.session_id = vs.session_id

  union all
  -- website steps, while the raw rows still exist
  select f.created_at, 'site:' || f.event_type, coalesce(f.event_title, f.event_id),
         jsonb_strip_nulls(jsonb_build_object('page', f.page, 'props', f.props, 'visit', f.session_id)),
         'flow_analytics', f.id::text, mv.level
  from public.flow_analytics f
  join my_visits mv on mv.session_id = f.session_id

  union all
  -- and from the summary once they have been cleared
  select (st.value #>> '{}')::timestamptz, 'site:' || st.key, null::text,
         jsonb_build_object('visit', vs.session_id, 'from_summary', true),
         'visit_summary', vs.session_id || ':' || st.key, mv.level
  from analytics.visit_summary vs
  join my_visits mv on mv.session_id = vs.session_id
  cross join lateral jsonb_each(vs.steps) st
  where not exists (select 1 from public.flow_analytics f where f.session_id = vs.session_id);
$fn$;

revoke all on function analytics.contact_timeline(text) from public, anon, authenticated;

-- The only door. Founders only; a page at a time, newest first.
create or replace function public.get_contact_timeline(
  p_phone  text,
  p_limit  integer     default 200,
  p_before timestamptz default null
) returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_phone text    := public.wa_normalise_phone(p_phone);
  v_limit integer := least(greatest(coalesce(p_limit, 200), 1), 500);
  v_lines jsonb;
  v_n     integer;
begin
  if not public.is_admin_strict() and session_user not in ('postgres', 'supabase_admin') then
    raise exception 'unauthorized';
  end if;
  if v_phone is null or v_phone !~ '^[0-9]{10}$' then
    raise exception 'A 10-digit phone number is required';
  end if;

  select coalesce(jsonb_agg(to_jsonb(t) order by t.at desc, t.src, t.src_id), '[]'::jsonb), count(*)
    into v_lines, v_n
  from (
    select * from analytics.contact_timeline(v_phone) c
    where p_before is null or c.at < p_before
    order by c.at desc, c.src, c.src_id
    limit v_limit + 1
  ) t;

  return jsonb_build_object(
    'phone', v_phone,
    'rule_version', analytics.rule_version(),
    'generated_at', now(),
    'more', v_n > v_limit,
    'lines', case when v_n > v_limit then v_lines - (v_n - 1) else v_lines end
  );
end;
$fn$;

revoke all on function public.get_contact_timeline(text, integer, timestamptz) from public, anon, authenticated;
grant execute on function public.get_contact_timeline(text, integer, timestamptz) to authenticated;
