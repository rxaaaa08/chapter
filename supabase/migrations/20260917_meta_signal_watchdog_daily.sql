-- Meta signal watchdog: once a day instead of every hour.
--
-- THE DECISION (founder, 2026-09-17)
-- Run the watchdog daily. Put to him with the trade-off stated once: a dead
-- CAPI token is noticed up to a day later rather than within the hour. Sale
-- reports sent while it is dead are not retried. Applications are retried by
-- capi-lead's sweep, but only for 24 h, so a late fix can also lose the
-- earliest ones. He chose daily. Do not re-propose hourly unless he asks.
--
-- WHEN: 03:41 UTC = 09:11 IST. An alert then lands at the start of the working
-- day, when the fix (a new token in Events Manager, set as a Supabase secret)
-- can actually be made, not at 3 am. No other job runs at :41.
--
-- WHAT HAD TO CHANGE WITH IT
-- meta_signal_record()'s "must hold for" periods were written for hourly runs:
--   unreadable    6 h -> 12 h
--   test_mode_on 24 h -> 12 h
-- On a daily schedule both now mean the same thing: bad on TWO checks in a row.
-- One failed read is still a blip. 24 h specifically was a trap here: two daily
-- runs land a few seconds under 24 h apart, so "held for 24 h" would have
-- missed by seconds and slipped a whole extra day. 12 h is robust to that
-- jitter in either direction.
-- For the same reason capi_test_mode's reminder cooldown moves from 24 h to
-- 20 h. The 12 h cooldown on the other checks already means one reminder per
-- daily run while a problem persists.

select cron.alter_job(
  (select jobid from cron.job where jobname = 'meta-signal-watchdog'),
  schedule := '41 3 * * *'
);

update public.meta_signal_watch set cooldown_hours = 20 where check_key = 'capi_test_mode';

comment on table public.meta_signal_watch is
  'What the Meta signal watchdog checks, and the thresholds it judges by. '
  'Read by the meta-signal-watchdog edge function once a day (03:41 UTC).';

create or replace function public.meta_signal_record(
  p_check_key    text,
  p_verdict      text,
  p_expected     integer,
  p_matched      integer,
  p_meta_total   integer,
  p_window_start timestamptz,
  p_window_end   timestamptz,
  p_detail       jsonb,
  p_now          timestamptz default now()
) returns table (check_id uuid, should_push boolean)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  w              public.meta_signal_watch;
  v_hold         interval;
  v_other_at     timestamptz;
  v_streak_start timestamptz;
  v_last_push    timestamptz;
  v_push         boolean := false;
  v_id           uuid;
begin
  select * into w from public.meta_signal_watch where check_key = p_check_key;
  if not found then
    raise exception 'meta_signal_record: unknown check %', p_check_key;
  end if;

  -- How long a verdict must have held before it may push. Tied to the DAILY
  -- schedule (20260917_meta_signal_watchdog_daily.sql): 12 h means "bad on two
  -- runs in a row". Change the schedule and re-read these.
  v_hold := case p_verdict
              when 'broken'       then interval '0'
              when 'expiring'     then interval '0'
              when 'unreadable'   then interval '12 hours'
              when 'test_mode_on' then interval '12 hours'
            end;

  if v_hold is not null and w.enabled and w.push_enabled then
    select max(checked_at) into v_other_at
    from public.meta_signal_checks
    where check_key = p_check_key and verdict <> p_verdict and checked_at < p_now;

    select min(checked_at) into v_streak_start
    from public.meta_signal_checks
    where check_key = p_check_key and verdict = p_verdict and checked_at < p_now
      and checked_at > coalesce(v_other_at, '-infinity'::timestamptz);
    v_streak_start := least(coalesce(v_streak_start, p_now), p_now);

    select max(checked_at) into v_last_push
    from public.meta_signal_checks
    where check_key = p_check_key and verdict = p_verdict and push_decided and checked_at < p_now;

    v_push := v_streak_start <= p_now - v_hold
              and (v_last_push is null or v_last_push <= p_now - interval '2 hours')
              and (
                v_last_push is null
                or v_last_push < v_streak_start
                or v_last_push <= p_now - make_interval(hours => w.cooldown_hours)
              );
  end if;

  insert into public.meta_signal_checks
    (check_key, checked_at, verdict, expected, matched, meta_total, window_start, window_end, detail, push_decided)
  values
    (p_check_key, p_now, p_verdict, p_expected, p_matched, p_meta_total, p_window_start, p_window_end, p_detail, v_push)
  returning id into v_id;

  return query select v_id, v_push;
end;
$$;

revoke all on function public.meta_signal_record(text, text, integer, integer, integer, timestamptz, timestamptz, jsonb, timestamptz) from public, anon, authenticated;
grant execute on function public.meta_signal_record(text, text, integer, integer, integer, timestamptz, timestamptz, jsonb, timestamptz) to service_role;
