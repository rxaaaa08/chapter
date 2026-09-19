-- Meta signal watchdog: stop counting our own local test sessions as visits
-- Meta should have seen.
--
-- WHAT WAS FOUND (2026-09-16, investigating "Meta sees only ~80% of plan views")
-- The 80% was wrong twice over:
--
--   1. It came from Meta's `event_total_counts` aggregation, which is not the
--      same measurement as its hourly `event` counts. It ignores the
--      event_source filter (WEB_ONLY and SERVER_ONLY return identical output),
--      returned NOTHING for a full day holding ~32 hourly-counted plan views,
--      and for whole weeks came out below the sum of its own hourly buckets
--      (132 vs 152). Never reconcile against it. The watchdog reads the hourly
--      counts, which tie out to our rows.
--   2. Matched per event against the hourly counts, Meta received 93-98% of
--      real visitors' plan views and calendar opens in every week from 19 Aug
--      to 15 Sep. The one visibly lower week (2-9 Sep, 82% / 78%) was mostly
--      US: local development sessions.
--
-- WHY OUR OWN TESTING SHOWS UP AS A GAP
-- `npm run dev` writes to the PRODUCTION database, so a local test session
-- records real flow_analytics rows. Since 2026-08-18 (commit 100b875) the Pixel
-- deliberately never loads off chaptera.in, so those same visits never reach
-- Meta. Correct on both sides — and the watchdog then reads the difference as
-- Meta missing events. One test session on 3 Sep (inactive ₹2 test plans, 6
-- plan views) was 6 of that week's 8 misses. In a quiet 72-hour window a long
-- test session could push the browser checks to 'gap' or even 'broken'.
--
-- THE FINGERPRINT
-- src/main.tsx renders inside React StrictMode, which runs every effect TWICE
-- on the development server and never in a production build. page_view fires
-- from an App.tsx effect, so a dev session writes its page views in pairs a few
-- milliseconds apart (3 Sep: 11 of 12 pairs under 10 ms, one at 270 ms). On
-- live traffic that essentially never happens: 21 of 1,703 sessions since
-- 12 Aug had any sub-second page_view pair, 18 of them on nearly every page.
-- Rule: at least 2 sub-second pairs, covering at least 80% of the session's
-- page views. Deliberately strict — a real visitor wrongly treated as a test
-- would HIDE a real miss, which is the worse direction for this check.
--
-- LIMITS, stated plainly
--   * It is a fingerprint, not a label. If StrictMode is removed or page_view
--     moves out of an effect, it stops matching and test sessions count again
--     (the watchdog would then over-report gaps, not hide them).
--   * A dev session with fewer than two page views is not caught.
--   * The durable fix is on the client: stamp the host on every flow_analytics
--     row so every consumer (funnel, experiments, this) can filter on it. That
--     is a client change and waits for a push; this does not.
-- Applies to the browser checks only. Test Purchases and Leads are already
-- excluded by the 90000000xx phone rule, the same one the senders apply.

create or replace function public.meta_signal_dev_sessions(p_since timestamptz, p_until timestamptz)
returns table (session_id text)
language sql
stable
security definer
set search_path to 'public'
as $$
  select p.session_id
  from (
    select f.session_id,
           f.created_at - lag(f.created_at) over (partition by f.session_id order by f.created_at) as gap
    from public.flow_analytics f
    where f.event_type = 'page_view'
      and f.session_id is not null
      -- A day of slack each side: a session's page views can start before the
      -- window that contains its plan views.
      and f.created_at >= p_since - interval '1 day'
      and f.created_at <  p_until + interval '1 day'
  ) p
  group by p.session_id
  having count(*) filter (where p.gap < interval '1 second') >= 2
     and count(*) filter (where p.gap < interval '1 second') >= 0.8 * floor(count(*) / 2.0)
$$;

create or replace function public.meta_signal_expected_times(
  p_check_key text, p_since timestamptz, p_until timestamptz
) returns timestamptz[]
language sql
stable
security definer
set search_path to 'public'
as $$
  select coalesce(array_agg(t order by t), '{}'::timestamptz[])
  from (
    select coalesce(
             case when p.payu_response->>'addedon' ~ '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$'
                  then (p.payu_response->>'addedon')::timestamp at time zone 'Asia/Kolkata' end,
             p.created_at) as t
    from public.payu_payments p
    where p_check_key = 'purchase_server'
      and p.status = 'success'
      and lower(coalesce(p.payment_type, '')) <> 'balance'
      and right(regexp_replace(coalesce(p.phone, ''), '\D', '', 'g'), 10) not like '90000000%'
      and p.created_at >= p_since - interval '1 day'
      and p.created_at <  p_until + interval '1 day'

    union all

    select a.created_at
    from public.applications a
    where p_check_key = 'lead_server'
      and a.lead_id is not null
      and right(regexp_replace(coalesce(a.phone, ''), '\D', '', 'g'), 10) not like '90000000%'
      and a.created_at >= p_since and a.created_at < p_until

    union all

    select f.created_at
    from public.flow_analytics f
    -- Our own local test sessions: recorded here, never sent to Meta by design.
    -- An anti-join against the set computed ONCE, not a correlated subquery:
    -- a SECURITY DEFINER function is never inlined, so calling it per row would
    -- rescan page views for every plan view — fine today, not at 50x traffic.
    left join public.meta_signal_dev_sessions(p_since, p_until) d on d.session_id = f.session_id
    where f.event_type = case p_check_key
                           when 'view_content_web' then 'event_selected'
                           when 'add_to_cart_web'  then 'calendar_opened'
                         end
      and f.created_at >= p_since and f.created_at < p_until
      and d.session_id is null
  ) x
  where t >= p_since and t < p_until
$$;

-- evaluate() gains one detail field, dev_rows_excluded, so a check row says how
-- much of our side was set aside as testing. A large number there is itself
-- worth seeing: it means real analytics were being diluted by test traffic.
create or replace function public.meta_signal_evaluate(
  p_check_key text, p_meta_hourly jsonb, p_now timestamptz default now()
) returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  w          public.meta_signal_watch;
  v_end      timestamptz;
  v_start    timestamptz;
  v_times    timestamptz[];
  v_m        jsonb;
  v_meta     integer;
  v_extra    jsonb := '{}'::jsonb;
begin
  select * into w from public.meta_signal_watch where check_key = p_check_key;
  if not found or w.kind not in ('money', 'browser') then
    raise exception 'meta_signal_evaluate: % is not an event check', p_check_key;
  end if;

  v_end   := (date_trunc('hour', p_now at time zone 'UTC') at time zone 'UTC') - make_interval(hours => w.lag_hours);
  v_start := v_end - make_interval(hours => w.window_hours);

  v_times := public.meta_signal_expected_times(p_check_key, v_start, v_end);
  v_m     := public.meta_signal_match(v_times, p_meta_hourly);

  select coalesce(sum(case when value ~ '^\d+$' then value::integer end), 0) into v_meta
  from jsonb_each_text(coalesce(p_meta_hourly, '{}'::jsonb))
  where case when key ~ '^\d{4}-\d{2}-\d{2}T\d{2}'
             then key::timestamptz >= v_start and key::timestamptz < v_end
             else false end;

  if p_check_key = 'lead_server' then
    select jsonb_build_object('lead_sends_failing', count(*)) into v_extra
    from public.applications a
    where a.lead_id is not null
      and a.lead_reported_at is null
      and a.created_at >= p_now - interval '24 hours'
      and a.created_at <  p_now - interval '1 hour'
      and right(regexp_replace(coalesce(a.phone, ''), '\D', '', 'g'), 10) not like '90000000%';
  elsif w.kind = 'browser' then
    select jsonb_build_object('dev_rows_excluded', count(*)) into v_extra
    from public.flow_analytics f
    join public.meta_signal_dev_sessions(v_start, v_end) d on d.session_id = f.session_id
    where f.event_type = case p_check_key
                           when 'view_content_web' then 'event_selected'
                           when 'add_to_cart_web'  then 'calendar_opened'
                         end
      and f.created_at >= v_start and f.created_at < v_end;
  end if;

  return jsonb_build_object(
    'verdict', public.meta_signal_verdict(w, (v_m->>'expected')::integer, (v_m->>'matched')::integer,
                                          (v_m->>'newest_unmatched_run')::integer),
    'expected', (v_m->>'expected')::integer,
    'matched', (v_m->>'matched')::integer,
    'meta_total', v_meta,
    'window_start', v_start,
    'window_end', v_end,
    'detail', (v_m - 'expected' - 'matched') || v_extra
  );
end;
$$;

revoke all on function public.meta_signal_dev_sessions(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.meta_signal_dev_sessions(timestamptz, timestamptz) to service_role;
revoke all on function public.meta_signal_evaluate(text, jsonb, timestamptz) from public, anon, authenticated;
grant execute on function public.meta_signal_evaluate(text, jsonb, timestamptz) to service_role;
