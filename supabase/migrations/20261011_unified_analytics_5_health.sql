-- Unified customer analytics, phase 5 of 8: health.
--
-- Design:    docs/UNIFIED-CUSTOMER-ANALYTICS-PROPOSAL-v2-2026-10-11.md §10
-- Build log: docs/UNIFIED-ANALYTICS-BUILD-LOG.md
--
-- One report that says whether the rest can be trusted, and a copy of it saved
-- every day so a change can be seen as a change.
--
-- It deliberately does NOT give one "join rate". Bookings are shown by HOW
-- they were linked (directly / only through an attempt / not at all / made
-- before recording began), because a higher rate made of weaker links is a
-- worse result, and one number hides that.
--
-- No alert is raised from this yet. What counts as a bad value cannot be set
-- before real data has flowed for a while; until then it is a report to read.

create table if not exists analytics.health_daily (
  day      date primary key,
  taken_at timestamptz not null default now(),
  report   jsonb not null
);

comment on table analytics.health_daily is
  'analytics.health() as it stood each morning (India date), saved by the analytics-health-snapshot job. Kept so that a change in any measure can be dated.';

alter table analytics.health_daily enable row level security;
revoke all on analytics.health_daily from public, anon, authenticated;

create or replace function analytics.health()
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $fn$
  with
  ist as (select (now() at time zone 'Asia/Kolkata')::date as today),
  -- When the site first sent a visit id with a booking step. NULL = it has not
  -- started; every "linked" figure below is then expected to be zero.
  began as (
    select min(t) as began_at from (
      select min(a.created_at) as t from public.applications a where a.first_session_id ~ '^[0-9a-fA-F-]{16,64}$'
      union all
      select min(o.created_at) from public.open_event_otp_sessions o where o.session_id ~ '^[0-9a-fA-F-]{16,64}$'
    ) x
  ),
  capture as (
    select jsonb_build_object(
      'last_step_at',             max(f.created_at),
      'steps_24h',                count(*) filter (where f.created_at >= now() - interval '24 hours'),
      'steps_7d',                 count(*) filter (where f.created_at >= now() - interval '7 days'),
      'steps_7d_with_page_name',  count(*) filter (where f.created_at >= now() - interval '7 days' and f.page is not null),
      'steps_7d_with_own_id',     count(*) filter (where f.created_at >= now() - interval '7 days' and f.event_uid is not null),
      'new_shape_first_seen_at',  min(f.created_at) filter (where f.schema_v is not null)
    ) as j
    from public.flow_analytics f
  ),
  v7 as (
    select vs.session_id, vs.landing_page, vs.internal, vs.storage, r.level
    from analytics.visit_summary vs
    join analytics.v_visit_resolved r on r.session_id = vs.session_id
    where vs.started_at >= now() - interval '7 days'
  ),
  visits as (
    select jsonb_build_object(
      'visits_7d',             (select count(*) from v7),
      'with_starting_context', (select count(*) from v7 where landing_page is not null),
      'marked_internal',       (select count(*) from v7 where internal),
      'browser_id_kept_in',    (select coalesce(jsonb_object_agg(k, n), '{}'::jsonb)
                                from (select coalesce(storage, 'not_recorded') as k, count(*) as n from v7 group by 1) s),
      'whose_visit',           (select coalesce(jsonb_object_agg(level, n), '{}'::jsonb)
                                from (select level, count(*) as n from v7 group by 1) s)
    ) as j
  ),
  bk as (
    select a.id, a.created_at,
           coalesce(a.first_session_id ~ '^[0-9a-fA-F-]{16,64}$', false) as direct,
           exists (select 1 from public.open_event_otp_sessions o
                   where o.phone = a.phone and lower(o.event_slug) = lower(a.event_slug)
                     and o.session_id ~ '^[0-9a-fA-F-]{16,64}$') as by_attempt,
           (a.first_session_id is not null
            and not exists (select 1 from analytics.visit_summary vs where vs.session_id = a.first_session_id)
            and not exists (select 1 from public.flow_analytics f where f.session_id = a.first_session_id)) as visit_missing
    from public.applications a
    where a.created_at >= now() - interval '30 days'
      and not analytics.is_test_phone(a.phone)
  ),
  bookings as (
    select jsonb_build_object(
      'recording_began_at',            (select began_at from began),
      'bookings_30d',                  count(*),
      'made_before_recording_began',   count(*) filter (where (select began_at from began) is null or bk.created_at < (select began_at from began)),
      'linked_directly_to_a_visit',    count(*) filter (where bk.direct),
      'linked_only_through_an_attempt', count(*) filter (where not bk.direct and bk.by_attempt),
      'not_linked',                    count(*) filter (where not bk.direct and not bk.by_attempt
                                                         and (select began_at from began) is not null and bk.created_at >= (select began_at from began)),
      'linked_but_that_visit_has_no_steps', count(*) filter (where bk.visit_missing)
    ) as j
    from bk
  ),
  money as (
    select jsonb_build_object(
      'successful_payments_30d',
        (select count(*) from public.payu_payments p
          where p.status = 'success' and p.created_at >= now() - interval '30 days' and not analytics.is_test_phone(p.phone)),
      'successful_payments_with_no_booking',
        (select count(*) from public.payu_payments p
          where p.status = 'success' and p.created_at >= now() - interval '30 days' and not analytics.is_test_phone(p.phone)
            and not exists (select 1 from public.applications a
                            where a.phone = p.phone and lower(a.event_slug) = lower(p.event_slug))),
      'paid_bookings_with_no_successful_payment',
        (select count(*) from public.applications a
          where a.status in ('advance_paid', 'fully_paid') and a.created_at >= now() - interval '30 days'
            and not analytics.is_test_phone(a.phone)
            and not exists (select 1 from public.payu_payments p
                            where p.phone = a.phone and lower(p.event_slug) = lower(a.event_slug) and p.status = 'success')),
      'transaction_ids_used_twice',
        (select count(*) from (select p.txnid from public.payu_payments p group by 1 having count(*) > 1) d)
    ) as j
  ),
  evidence as (
    select jsonb_build_object(
      'lines_7d_by_kind',
        (select coalesce(jsonb_object_agg(kind, n), '{}'::jsonb)
         from (select kind, count(*) as n from analytics.v_identity_evidence
               where observed_at >= now() - interval '7 days' group by 1) s),
      'message_links_reopened_on_a_later_day_30d',
        (select count(*) from (
           select e.ref_id from analytics.identity_evidence e
           where e.kind = 'message_link_opened' and e.observed_at >= now() - interval '30 days'
           group by e.ref_id
           having count(distinct (e.observed_at at time zone 'Asia/Kolkata')::date) > 1) s)
    ) as j
  ),
  past as (
    select v.plan_id, v.occurrence_date, v.state, v.list_completed_at
    from analytics.v_attendance v, ist
    where v.status in ('advance_paid', 'fully_paid')
      and v.occurrence_date < ist.today and v.occurrence_date >= ist.today - 60
      and not analytics.is_test_phone(v.phone)
  ),
  attendance as (
    select jsonb_build_object(
      'paid_bookings_on_dates_in_the_last_60_days', (select count(*) from past),
      'by_state', (select coalesce(jsonb_object_agg(state, n), '{}'::jsonb)
                   from (select state, count(*) as n from past group by 1) s),
      'dates_run', (select count(*) from (select distinct plan_id, occurrence_date from past) d),
      'dates_with_the_list_completed',
        (select count(*) from (select distinct plan_id, occurrence_date from past where list_completed_at is not null) d)
    ) as j
  ),
  jobs as (
    select jsonb_build_object(
      'visits_saved',                 (select count(*) from analytics.visit_summary),
      'summary_last_refreshed_at',    (select max(refreshed_at) from analytics.visit_summary),
      'visits_in_last_3_days_not_saved_yet',
        (select count(distinct f.session_id) from public.flow_analytics f
          where f.created_at >= now() - interval '3 days' and f.session_id ~ '^[0-9a-fA-F-]{16,64}$'
            and not exists (select 1 from analytics.visit_summary vs where vs.session_id = f.session_id)),
      'last_nightly_run',
        (select jsonb_build_object('status', d.status, 'at', d.start_time, 'message', left(d.return_message, 200))
         from cron.job_run_details d join cron.job j on j.jobid = d.jobid
         where j.jobname = 'analytics-refresh-visits'
         order by d.start_time desc limit 1)
    ) as j
  )
  select jsonb_build_object(
    'generated_at', now(),
    'rule_version', analytics.rule_version(),
    'capture',    (select j from capture),
    'visits',     (select j from visits),
    'bookings',   (select j from bookings),
    'money',      (select j from money),
    'evidence',   (select j from evidence),
    'attendance', (select j from attendance),
    'jobs',       (select j from jobs),
    -- Said out loud, so that an absent number is never read as a zero.
    'not_measured', jsonb_build_array(
      'website steps that failed to save (the site has to report them; phase 7)',
      'what outside tools receive from a page address',
      'refunds and cancellations (recorded nowhere)',
      'when a payment ended (only when it started, and how it ended)')
  );
$fn$;

revoke all on function analytics.health() from public, anon, authenticated;

create or replace function analytics.snapshot_health()
returns void
language sql
security definer
set search_path = pg_catalog, public
as $fn$
  insert into analytics.health_daily (day, taken_at, report)
  values ((now() at time zone 'Asia/Kolkata')::date, now(), analytics.health())
  on conflict (day) do update set taken_at = excluded.taken_at, report = excluded.report;
$fn$;

revoke all on function analytics.snapshot_health() from public, anon, authenticated;

-- Founders only.
create or replace function public.get_analytics_health()
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $fn$
begin
  if not public.is_admin_strict() and session_user not in ('postgres', 'supabase_admin') then
    raise exception 'unauthorized';
  end if;
  return analytics.health();
end;
$fn$;

revoke all on function public.get_analytics_health() from public, anon, authenticated;
grant execute on function public.get_analytics_health() to authenticated;

-- 03:30 UTC (09:00 India): after the visit summaries are saved (02:50) and the
-- 90-day clean-up has run (03:17), so it reports the day as it will be read.
select cron.unschedule('analytics-health-snapshot')
  where exists (select 1 from cron.job where jobname = 'analytics-health-snapshot');
select cron.schedule('analytics-health-snapshot', '30 3 * * *', $$select analytics.snapshot_health()$$);

-- ── Follow-up, same day ──────────────────────────────────────────────────────
-- The security linter flagged the two phase-3 helpers for having no fixed
-- search_path. Neither touches a table, so nothing could be reached through
-- them, but there is no reason to leave a warning standing.
alter function analytics.rule_version()      set search_path = pg_catalog;
alter function analytics.is_test_phone(text) set search_path = pg_catalog;
