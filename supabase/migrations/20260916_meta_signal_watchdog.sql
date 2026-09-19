-- Meta signal watchdog — does Meta actually receive what happens on the site?
--
-- WHY THIS EXISTS
-- Every Purchase and Lead reaches Meta through one secret, META_CAPI_ACCESS_TOKEN,
-- and _shared/metaCapi.ts is fire-and-forget by contract: it must never delay a
-- customer's receipt, so a rejected send is a console.error and nothing else. If
-- that token is revoked, expires, or loses the Pixel, sales keep landing in
-- payu_payments and NOTHING anywhere says Meta stopped hearing about them. Meta
-- would then optimise ad delivery on half the data, report a cost per purchase
-- that looks terrible, and the first human sign would be a week of bad numbers.
--
-- Handoff §10 left this open deliberately, with the shape to build: compare from
-- the OUTSIDE — what we know happened against what Meta says it received — so no
-- line of the payment path changes. This is that.
--
-- THREE KINDS OF CHECK
--   probe   — the token itself: is it valid, when does it expire, can it reach
--             the Pixel. Catches the named failure within an hour, BEFORE a sale
--             is lost. At ~6 sales a week a count check alone could take days.
--   money   — Purchase and Lead, SERVER_ONLY. Matched one event at a time by
--             hour, so an extra event in one hour (Meta's dataset holds test
--             sends whose rows were deleted) cannot hide a missing one in another.
--   browser — ViewContent and AddToCart, WEB_ONLY. Not sales, but the two events
--             this account can actually optimise on (handoff §9: Purchase cannot
--             exit learning at this volume). A broken Pixel starves those first.
--
-- MEASURED BEFORE THE THRESHOLDS WERE SET (2026-09-16, via the Meta Ads MCP):
--   * Lead SERVER_ONLY matched every application row to the exact hour, 26 Aug
--     to 13 Sep. The extras on Meta's side (28 Aug, 1 Sep) are deleted test rows.
--   * Purchase SERVER_ONLY matched every paid booking to the exact hour EXCEPT
--     21 Aug 09:37 PDT, which Meta never received. That is a real lost sale, and
--     this check would have recorded it as a gap.
--   * Browser, matched per event against Meta's HOURLY WEB_ONLY counts, with our
--     own local test sessions set aside (20260916_meta_signal_exclude_dev_sessions):
--       ViewContent 98%, 94%, 93%, 94%   AddToCart 98%, 96%, 88%, 98%
--     for the weeks from 19 Aug. An earlier reading of "~80% and falling" was
--     wrong: it used Meta's event_total_counts, which is not the same number as
--     its hourly counts. The residual ~5% is visitors whose browsers never ran
--     Meta's script.

-- ---------------------------------------------------------------------------
-- 1. What is watched — rows, so a threshold changes without a deploy.
-- ---------------------------------------------------------------------------
create table if not exists public.meta_signal_watch (
  -- Fixed vocabulary. meta_signal_expected_times() must know how to count our
  -- side of every key, so an unrecognised key would be a check that silently
  -- reads zero forever. Adding a key is a code change; tuning one is an UPDATE.
  check_key   text primary key check (check_key in (
    'capi_token', 'capi_test_mode',
    'purchase_server', 'lead_server',
    'view_content_web', 'add_to_cart_web'
  )),
  label       text not null,
  kind        text not null check (kind in ('probe', 'money', 'browser')),
  sort_order  integer not null default 0,

  -- The Meta side: which standard event, from which source.
  meta_event   text,
  event_source text check (event_source in ('SERVER_ONLY', 'WEB_ONLY')),

  -- The window judged is [now - window_hours, now - lag_hours). The lag gives
  -- Meta's stats time to catch up, so a sale five minutes old is never "missing".
  -- Kept under 7 days: Meta's stats edge documents data "up to seven days from
  -- the request time".
  window_hours integer check (window_hours between 1 and 160),
  lag_hours    integer check (lag_hours between 0 and 24),

  -- Below this many of OUR events the window says too little to judge.
  min_expected integer check (min_expected >= 1),

  -- money: broken when the newest N sales in a row all went unmatched (onset —
  -- fires after N sales whatever the volume), OR when unmatched reaches BOTH a
  -- floor and a share of the window (a slow leak at any scale).
  break_consecutive     integer check (break_consecutive >= 1),
  break_unmatched_min   integer check (break_unmatched_min >= 1),
  break_unmatched_share numeric check (break_unmatched_share > 0 and break_unmatched_share <= 1),

  -- browser: matched / expected below break_ratio is broken, below gap_ratio a gap.
  break_ratio numeric check (break_ratio > 0 and break_ratio < 1),
  gap_ratio   numeric check (gap_ratio > 0 and gap_ratio <= 1),

  -- Within one continuous run of a bad verdict, remind no more often than this.
  cooldown_hours integer not null default 12 check (cooldown_hours >= 1),

  enabled      boolean not null default true,
  -- Separate from enabled on purpose: a check can run and record for days
  -- before anyone trusts it enough to wake a phone.
  push_enabled boolean not null default true,

  check (kind <> 'money'   or (meta_event is not null and event_source is not null and window_hours is not null
                               and lag_hours is not null and min_expected is not null and break_consecutive is not null
                               and break_unmatched_min is not null and break_unmatched_share is not null)),
  check (kind <> 'browser' or (meta_event is not null and event_source is not null and window_hours is not null
                               and lag_hours is not null and min_expected is not null
                               and break_ratio is not null and gap_ratio is not null and break_ratio < gap_ratio))
);

comment on table public.meta_signal_watch is
  'What the Meta signal watchdog checks, and the thresholds it judges by. '
  'Read by the meta-signal-watchdog edge function every hour.';

insert into public.meta_signal_watch
  (check_key, label, kind, sort_order, meta_event, event_source, window_hours, lag_hours, min_expected,
   break_consecutive, break_unmatched_min, break_unmatched_share, break_ratio, gap_ratio, cooldown_hours, push_enabled)
values
  ('capi_token',       'Sales-reporting token',        'probe',   10, null, null, null, null, null, null, null, null, null, null, 12, false),
  ('capi_test_mode',   'Meta test mode',               'probe',   20, null, null, null, null, null, null, null, null, null, null, 24, false),
  -- 144 h = 6 days of sales, inside Meta's 7-day stats limit. min_expected 1:
  -- even a single sale is worth matching; one miss is a gap, not an alarm.
  ('purchase_server',  'Sales reaching Meta',          'money',   30, 'Purchase', 'SERVER_ONLY', 144, 2, 1, 2, 3, 0.20, null, null, 12, false),
  ('lead_server',      'Applications reaching Meta',   'money',   40, 'Lead',     'SERVER_ONLY', 144, 2, 1, 2, 3, 0.20, null, null, 12, false),
  -- 72 h because a week at today's traffic is ~45 of each; 24 h would sit under
  -- min_expected most days. Real match rate measured 88-98% per week, so 0.6 is
  -- a gap well outside normal noise, and 0.25 means the Pixel is broken.
  ('view_content_web', 'Plan views reaching Meta',     'browser', 50, 'ViewContent', 'WEB_ONLY', 72, 2, 15, null, null, null, 0.25, 0.60, 12, false),
  ('add_to_cart_web',  'Calendar opens reaching Meta', 'browser', 60, 'AddToCart',   'WEB_ONLY', 72, 2, 15, null, null, null, 0.25, 0.60, 12, false)
on conflict (check_key) do nothing;
-- push_enabled starts FALSE on every row. The first live runs must show real
-- verdicts before any of them is allowed to wake the founder's phone — a
-- watchdog that cries wolf on day one gets muted, and a muted watchdog is worse
-- than none. Switched on by a separate UPDATE once the runs look right.
-- (Done 2026-09-16, after one manual and one scheduled run both came back sane.
-- Replaying this file on a fresh database leaves alerts OFF until that UPDATE
-- is repeated, which is the intended behaviour for a new environment.)

alter table public.meta_signal_watch enable row level security;
drop policy if exists meta_signal_watch_admin_read on public.meta_signal_watch;
create policy meta_signal_watch_admin_read on public.meta_signal_watch
  for select to authenticated using (public.is_admin_strict());

-- ---------------------------------------------------------------------------
-- 2. Every check ever run — history, cooldown ledger, and the panel's source.
-- ---------------------------------------------------------------------------
-- One row per check per run, including every 'ok'. The ok rows are the point:
-- "Meta saw 81% of plan views this week, 100% three weeks ago" is only
-- answerable if the unremarkable runs were written down too.
create table if not exists public.meta_signal_checks (
  id           uuid primary key default gen_random_uuid(),
  check_key    text not null references public.meta_signal_watch(check_key),
  checked_at   timestamptz not null default now(),
  verdict      text not null check (verdict in (
    'ok',
    'gap',            -- something missing, below the alarm bar
    'broken',         -- the alarm bar was crossed
    'too_few',        -- not enough of our own events to judge
    'unreadable',     -- could not read Meta's side (network, rate limit, shape)
    'unverifiable',   -- the token answered but cannot be inspected this way
    'expiring',       -- the token still works and has a known death date
    'test_mode_on'    -- META_CAPI_TEST_CODE is set
  )),
  -- NULL, not 0, where the check does not count anything (the probes). A token
  -- probe that "expected 0 and matched 0" would read as a quiet week.
  expected     integer,
  matched      integer,
  meta_total   integer,
  window_start timestamptz,
  window_end   timestamptz,
  detail       jsonb,
  -- Decided by meta_signal_record() BEFORE the push is attempted, and written
  -- whether or not the push lands — the same rule as meta_ad_guardrail_events:
  -- this is derived state that recomputes every run, and the decision is what
  -- arms the cooldown. notified_at means "queued without error", not delivered
  -- (notify_admin_push is fire-and-forget; see handoff §8).
  push_decided boolean not null default false,
  notified_at  timestamptz,
  notify_error text
);

create index if not exists meta_signal_checks_key_time_idx
  on public.meta_signal_checks (check_key, checked_at desc);
create index if not exists meta_signal_checks_pushed_idx
  on public.meta_signal_checks (checked_at desc) where push_decided;

comment on table public.meta_signal_checks is
  'Every run of the Meta signal watchdog, one row per check, ok rows included. '
  'push_decided arms the cooldown; notified_at means queued, not delivered.';

alter table public.meta_signal_checks enable row level security;
drop policy if exists meta_signal_checks_admin_read on public.meta_signal_checks;
create policy meta_signal_checks_admin_read on public.meta_signal_checks
  for select to authenticated using (public.is_admin_strict());
-- No write policy: only the edge function (service_role) writes. A check result
-- a client could forge would be worthless.

revoke all on public.meta_signal_watch, public.meta_signal_checks from anon;
revoke insert, update, delete, truncate on public.meta_signal_watch, public.meta_signal_checks from authenticated;

-- ---------------------------------------------------------------------------
-- 3. Our side: when did each event that Meta should have received happen?
-- ---------------------------------------------------------------------------
-- Each branch mirrors the exact rule the SENDER applies, because the question
-- is "did Meta get what we sent", not "did Meta get everything". Change a
-- sender's rule and this must change with it, or the check grades the wrong
-- number and alarms on events that were never meant to leave.
--
--   purchase_server  _shared/metaCapi.ts sendPurchaseToMeta: success payments,
--                    never the balance half, never a 90000000xx test phone.
--                    Timestamp = PayU's `addedon` (IST, no offset in the string),
--                    which is the event_time sent — payuAddedOnToUnix().
--   lead_server      capi-lead: every application carrying a lead_id, test phones
--                    excluded, event_time = applications.created_at.
--   view_content_web src/supabase.ts PIXEL_EVENTS: event_selected -> ViewContent.
--   add_to_cart_web  src/supabase.ts PIXEL_EVENTS: calendar_opened -> AddToCart.
--                    trackEvent fires the Pixel and writes flow_analytics in the
--                    same call, so the two sides move together.
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
      -- created_at is the ORDER time and addedon the payment time, minutes
      -- apart; the day of slack keeps the index usable without losing a row.
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
    where f.event_type = case p_check_key
                           when 'view_content_web' then 'event_selected'
                           when 'add_to_cart_web'  then 'calendar_opened'
                         end
      and f.created_at >= p_since and f.created_at < p_until
  ) x
  where t >= p_since and t < p_until
$$;

-- ---------------------------------------------------------------------------
-- 4. Matching — pure arithmetic, no data access.
-- ---------------------------------------------------------------------------
-- Meta's stats come back as counts per hour. Totals would be simpler and wrong:
-- the dataset carries extra server events from deleted test rows, so a window
-- total can read "6 received, 6 expected" while a real sale is missing and a
-- test event stands in for it. So each of our events claims one of Meta's
-- events in its own hour, or the hour either side (send latency, a bucket
-- boundary). Oldest first, earliest slot first — for equal-width windows like
-- these that greedy order is the maximum matching, so nothing is marked missing
-- that some other assignment would have matched.
--
-- Hours are keyed in UTC. Meta buckets in the ad account's zone (-07:00); both
-- are whole-hour offsets, so the boundaries line up.
create or replace function public.meta_signal_match(p_expected timestamptz[], p_meta_hourly jsonb)
returns jsonb
language plpgsql
immutable
set search_path to 'public'
as $$
declare
  v_slots   jsonb := '{}'::jsonb;
  v_key     text;
  v_val     text;
  v_hour    text;
  v_n       integer;
  v_t       timestamptz;
  v_h       timestamp;
  v_off     integer;
  v_try     text;
  v_hit     boolean;
  v_total   integer := 0;
  v_matched integer := 0;
  v_run     integer := 0;
  v_unmatched timestamptz[] := '{}';
begin
  for v_key, v_val in select key, value from jsonb_each_text(coalesce(p_meta_hourly, '{}'::jsonb)) loop
    continue when v_key !~ '^\d{4}-\d{2}-\d{2}T\d{2}' or v_val !~ '^\d+$';
    v_hour := to_char(date_trunc('hour', v_key::timestamptz at time zone 'UTC'), 'YYYY-MM-DD"T"HH24');
    v_slots := jsonb_set(v_slots, array[v_hour],
                 to_jsonb(coalesce((v_slots->>v_hour)::integer, 0) + v_val::integer));
  end loop;

  for v_t in select t from unnest(coalesce(p_expected, '{}'::timestamptz[])) as u(t) where t is not null order by t loop
    v_total := v_total + 1;
    v_h := date_trunc('hour', v_t at time zone 'UTC');
    v_hit := false;
    foreach v_off in array array[-1, 0, 1] loop
      v_try := to_char(v_h + make_interval(hours => v_off), 'YYYY-MM-DD"T"HH24');
      v_n := coalesce((v_slots->>v_try)::integer, 0);
      if v_n > 0 then
        v_slots := jsonb_set(v_slots, array[v_try], to_jsonb(v_n - 1));
        v_hit := true;
        exit;
      end if;
    end loop;

    if v_hit then
      v_matched := v_matched + 1;
      v_run := 0;                       -- the newest-run counter restarts
    else
      v_run := v_run + 1;
      v_unmatched := v_unmatched || v_t;
    end if;
  end loop;

  return jsonb_build_object(
    'expected', v_total,
    'matched', v_matched,
    -- Consecutive unmatched events ending at the NEWEST one. 2 means the last
    -- two things that happened both failed to reach Meta: an onset.
    'newest_unmatched_run', v_run,
    -- Times only — never who. Newest ten, for a human to line up with logs.
    'unmatched_recent', (select coalesce(jsonb_agg(u order by u desc), '[]'::jsonb)
                         from (select u from unnest(v_unmatched) u order by u desc limit 10) z)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Verdict — pure, so every threshold can be tested with made-up numbers.
-- ---------------------------------------------------------------------------
create or replace function public.meta_signal_verdict(
  p_watch public.meta_signal_watch, p_expected integer, p_matched integer, p_newest_run integer
) returns text
language sql
immutable
set search_path to 'public'
as $$
  select case
    when coalesce(p_expected, 0) <= 0 then 'too_few'

    when p_watch.kind = 'money' then case
      when p_newest_run >= p_watch.break_consecutive then 'broken'
      when (p_expected - p_matched) >= p_watch.break_unmatched_min
       and (p_expected - p_matched) >= ceil(p_expected * p_watch.break_unmatched_share) then 'broken'
      when p_expected < p_watch.min_expected then 'too_few'
      -- One lost sale is recorded, not pushed. The historical 21 Aug miss would
      -- land here: real, worth seeing in the panel, and not proof the pipe broke.
      when p_matched < p_expected then 'gap'
      else 'ok' end

    when p_watch.kind = 'browser' then case
      when p_expected < p_watch.min_expected then 'too_few'
      when p_matched < p_expected * p_watch.break_ratio then 'broken'
      when p_matched < p_expected * p_watch.gap_ratio then 'gap'
      else 'ok' end
  end
$$;

-- ---------------------------------------------------------------------------
-- 6. Evaluate one event check against Meta's hourly counts. Reads, never writes.
-- ---------------------------------------------------------------------------
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

  -- Whole UTC hours, so our window and Meta's hourly buckets share boundaries.
  v_end   := (date_trunc('hour', p_now at time zone 'UTC') at time zone 'UTC') - make_interval(hours => w.lag_hours);
  v_start := v_end - make_interval(hours => w.window_hours);

  v_times := public.meta_signal_expected_times(p_check_key, v_start, v_end);
  v_m     := public.meta_signal_match(v_times, p_meta_hourly);

  -- Meta's own total over the same hours, extras included. Stored beside
  -- `matched` because the difference IS the test/duplicate noise — worth seeing,
  -- never worth crediting.
  -- The casts sit inside CASE because WHERE clauses have no evaluation order: a
  -- bare key::timestamptz beside the regex could run first and throw on a bad key.
  select coalesce(sum(case when value ~ '^\d+$' then value::integer end), 0) into v_meta
  from jsonb_each_text(coalesce(p_meta_hourly, '{}'::jsonb))
  where case when key ~ '^\d{4}-\d{2}-\d{2}T\d{2}'
             then key::timestamptz >= v_start and key::timestamptz < v_end
             else false end;

  -- Leads carry our OWN delivery record: capi-lead stamps lead_reported_at only
  -- when Meta confirmed it counted the event, and its sweep retries every 15 min
  -- for 24 h. A row still unstamped after an hour has failed four retries, which
  -- says "we are sending and Meta is refusing" rather than "we never sent".
  if p_check_key = 'lead_server' then
    select jsonb_build_object('lead_sends_failing', count(*)) into v_extra
    from public.applications a
    where a.lead_id is not null
      and a.lead_reported_at is null
      and a.created_at >= p_now - interval '24 hours'
      and a.created_at <  p_now - interval '1 hour'
      and right(regexp_replace(coalesce(a.phone, ''), '\D', '', 'g'), 10) not like '90000000%';
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

-- ---------------------------------------------------------------------------
-- 7. Record one result and decide, in the same statement, whether to push.
-- ---------------------------------------------------------------------------
-- How long a verdict must have held before it may push. Fixed here rather than
-- per row because it is a property of what the verdict MEANS, not of the check:
--   broken, expiring  immediately — each is a direct statement that signal is
--                     being lost or is about to be
--   unreadable        6 h  — one failed read is a network blip; six hours of
--                     them means the watchdog is blind, which is worth knowing
--   test_mode_on      24 h — switching it on to test is legitimate; forgetting
--                     it for a day means test bookings reach Meta as real sales
-- Everything else never pushes.
--
-- Push rule: the first run of a bad streak pushes; later runs in the SAME streak
-- remind only after cooldown_hours. A streak that recovers and breaks again is a
-- new problem and pushes again — but never twice inside 2 hours, so a verdict
-- flapping on a threshold cannot turn into an hourly alarm.
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

  v_hold := case p_verdict
              when 'broken'       then interval '0'
              when 'expiring'     then interval '0'
              when 'unreadable'   then interval '6 hours'
              when 'test_mode_on' then interval '24 hours'
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
                or v_last_push < v_streak_start                                        -- a new streak
                or v_last_push <= p_now - make_interval(hours => w.cooldown_hours)      -- a reminder
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

-- The data-reading and writing functions belong to the edge function alone.
-- is_admin_strict() is FALSE for the service-role key, so a founder gate here
-- would not secure these — it would silently switch the watchdog off (handoff
-- §6, the same reason meta_ad_guardrail_breaches is ungated).
revoke all on function public.meta_signal_expected_times(text, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.meta_signal_evaluate(text, jsonb, timestamptz) from public, anon, authenticated;
revoke all on function public.meta_signal_record(text, text, integer, integer, integer, timestamptz, timestamptz, jsonb, timestamptz) from public, anon, authenticated;
revoke all on function public.meta_signal_match(timestamptz[], jsonb) from public, anon, authenticated;
revoke all on function public.meta_signal_verdict(public.meta_signal_watch, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.meta_signal_expected_times(text, timestamptz, timestamptz) to service_role;
grant execute on function public.meta_signal_evaluate(text, jsonb, timestamptz) to service_role;
grant execute on function public.meta_signal_record(text, text, integer, integer, integer, timestamptz, timestamptz, jsonb, timestamptz) to service_role;
grant execute on function public.meta_signal_match(timestamptz[], jsonb) to service_role;
grant execute on function public.meta_signal_verdict(public.meta_signal_watch, integer, integer, integer) to service_role;

-- ---------------------------------------------------------------------------
-- 8. The panel's reader. Founder-gated; one jsonb (PostgREST's 1,000-row cap).
-- ---------------------------------------------------------------------------
create or replace function public.get_meta_signal_health()
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $$
  select case when public.is_admin_strict() then jsonb_build_object(
    'last_run_at', (select max(checked_at) from public.meta_signal_checks),
    'checks', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'check_key', w.check_key, 'label', w.label, 'kind', w.kind,
               'push_enabled', w.push_enabled,
               'verdict', c.verdict, 'checked_at', c.checked_at,
               'expected', c.expected, 'matched', c.matched, 'meta_total', c.meta_total,
               'window_start', c.window_start, 'window_end', c.window_end, 'detail', c.detail
             ) order by w.sort_order), '[]'::jsonb)
      from public.meta_signal_watch w
      left join lateral (
        select * from public.meta_signal_checks x
        where x.check_key = w.check_key order by x.checked_at desc limit 1
      ) c on true
      where w.enabled
    ),
    'alarms', (
      select coalesce(jsonb_agg(to_jsonb(a) order by a.checked_at desc), '[]'::jsonb)
      from (
        select c.check_key, w.label, c.verdict, c.checked_at, c.expected, c.matched, c.detail,
               c.notified_at, c.notify_error
        from public.meta_signal_checks c
        join public.meta_signal_watch w using (check_key)
        where c.push_decided
        order by c.checked_at desc
        limit 20
      ) a
    )
  ) end
$$;

revoke all on function public.get_meta_signal_health() from public, anon;
grant execute on function public.get_meta_signal_health() to authenticated;
