-- Unified customer analytics, phase 8 of 8 (database half): the first report.
--
-- Design:    docs/UNIFIED-CUSTOMER-ANALYTICS-PROPOSAL-v2-2026-10-11.md §3, §9, §15 step E
-- Build log: docs/UNIFIED-ANALYTICS-BUILD-LOG.md
--
-- Source → paid → attended, for bookings made in one period.
--
-- THE CONTRACT (proposal §9: written down before it is built)
--   Who enters   Bookings (applications rows) CREATED in the period, India dates,
--                test numbers left out.
--   Unit         Bookings. Not visits, not people: one person with two plans is two.
--   Source       The source of the VISIT THAT BOOKED, as stamped on the booking
--                when it was made (applications.attribution). This is not "where
--                the person first heard of us": that needs phases 6 and 7 to have
--                been running, and will be added as a second column, not blended.
--   Paid         The booking's status today is advance_paid or fully_paid.
--   Money        Sum of this booking's SUCCESSFUL payments (payu_payments), all
--                parts. A booking paid outside PayU shows as paid with 0 money.
--   Attended     From analytics.v_attendance, and only for dates already past.
--                "unknown" is its own column and is never counted as a no-show.
--   Maturity     Bookings whose date is still ahead are counted separately, so a
--                recent period is not read as "nobody came".
--
-- Read "no label" as "we do not know", not as "came directly".

create or replace function analytics.booking_source(p_attribution jsonb)
returns table (channel text, item text)
language sql
immutable
set search_path = pg_catalog
as $fn$
  select
    case
      when p_attribution is null or p_attribution = '{}'::jsonb          then 'no label'
      when (p_attribution ->> 'utm_content') ~ '^[0-9]{6,}$'             then 'paid ad'
      when p_attribution ? 'affiliate_code'                              then 'creator link'
      when p_attribution ->> 'utm_source' = 'sp_auto_dm'                 then 'reel comment → DM'
      when p_attribution ->> 'utm_source' = 'ig'
       and p_attribution ->> 'utm_content' = 'link_in_bio'               then 'bio link'
      when p_attribution ? 'utm_source'                                  then 'other label'
      when p_attribution ? 'fbclid'                                      then 'Meta click, untagged'
      else 'no label'
    end,
    case
      when (p_attribution ->> 'utm_content') ~ '^[0-9]{6,}$'             then p_attribution ->> 'utm_content'
      when p_attribution ? 'affiliate_code'                              then p_attribution ->> 'affiliate_code'
      when p_attribution ->> 'utm_source' = 'sp_auto_dm'                 then coalesce(p_attribution ->> 'utm_campaign', '(reel not named)')
      when p_attribution ->> 'utm_source' = 'ig'
       and p_attribution ->> 'utm_content' = 'link_in_bio'               then null
      when p_attribution ? 'utm_source'                                  then p_attribution ->> 'utm_source'
      else null
    end;
$fn$;

create or replace function analytics.source_report(p_from date, p_to date)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $fn$
  with ist as (select (now() at time zone 'Asia/Kolkata')::date as today),
  b as (
    select a.id, a.phone, a.event_slug, a.status,
           s.channel, s.item,
           v.occurrence_date, v.state, v.tickets, v.came_count,
           coalesce((select sum(p.amount) from public.payu_payments p
                     where p.status = 'success' and p.phone = a.phone
                       and lower(p.event_slug) = lower(a.event_slug)), 0) as money,
           (a.first_session_id ~ '^[0-9a-fA-F-]{16,64}$') as visit_known
    from public.applications a
    cross join lateral analytics.booking_source(a.attribution) s
    left join analytics.v_attendance v on v.application_id = a.id
    where (a.created_at at time zone 'Asia/Kolkata')::date >= p_from
      and (a.created_at at time zone 'Asia/Kolkata')::date <  p_to
      and not analytics.is_test_phone(a.phone)
  ),
  g as (
    select b.channel, b.item,
           count(*)                                                           as bookings,
           count(*) filter (where b.status in ('advance_paid', 'fully_paid')) as paid,
           count(*) filter (where b.status = 'fully_paid')                    as fully_paid,
           sum(b.money)                                                       as money_received,
           count(*) filter (where b.status in ('advance_paid', 'fully_paid')
                              and b.occurrence_date >= (select today from ist)) as paid_date_still_ahead,
           count(*) filter (where b.status in ('advance_paid', 'fully_paid')
                              and b.occurrence_date < (select today from ist) and b.state = 'came')         as came,
           count(*) filter (where b.status in ('advance_paid', 'fully_paid')
                              and b.occurrence_date < (select today from ist) and b.state = 'did_not_come') as did_not_come,
           count(*) filter (where b.status in ('advance_paid', 'fully_paid')
                              and b.occurrence_date < (select today from ist)
                              and b.state in ('cancelled', 'moved'))                                        as cancelled_or_moved,
           count(*) filter (where b.status in ('advance_paid', 'fully_paid')
                              and b.occurrence_date < (select today from ist) and b.state = 'unknown')      as attendance_unknown,
           count(*) filter (where b.visit_known)                              as bookings_with_their_visit_recorded
    from b group by b.channel, b.item
  )
  select jsonb_build_object(
    'from', p_from, 'to_before', p_to,
    'unit', 'bookings created in the period (India dates), test numbers left out',
    'source_means', 'the source stamped on the booking by the visit that made it; not the first time we were seen',
    'generated_at', now(),
    'totals', (select jsonb_build_object(
                 'bookings', coalesce(sum(bookings), 0), 'paid', coalesce(sum(paid), 0),
                 'fully_paid', coalesce(sum(fully_paid), 0), 'money_received', coalesce(sum(money_received), 0),
                 'paid_date_still_ahead', coalesce(sum(paid_date_still_ahead), 0),
                 'came', coalesce(sum(came), 0), 'did_not_come', coalesce(sum(did_not_come), 0),
                 'cancelled_or_moved', coalesce(sum(cancelled_or_moved), 0),
                 'attendance_unknown', coalesce(sum(attendance_unknown), 0),
                 'bookings_with_their_visit_recorded', coalesce(sum(bookings_with_their_visit_recorded), 0))
               from g),
    'by_source', coalesce((select jsonb_agg(to_jsonb(g) order by g.bookings desc, g.channel, g.item) from g), '[]'::jsonb),
    -- The check that must hold: money in this report against the payments table,
    -- matched booking by booking. Anything other than equal means a row was
    -- dropped or counted twice.
    'money_check', (select jsonb_build_object(
                      'in_report', coalesce(sum(b.money), 0),
                      'in_payments_table',
                        coalesce((select sum(p.amount) from public.payu_payments p
                                  where p.status = 'success'
                                    and exists (select 1 from b where b.phone = p.phone and lower(b.event_slug) = lower(p.event_slug))), 0))
                    from b)
  );
$fn$;

revoke all on function analytics.booking_source(jsonb)   from public, anon, authenticated;
revoke all on function analytics.source_report(date, date) from public, anon, authenticated;

-- Founders only.
create or replace function public.get_source_report(p_from date, p_to date)
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
  if p_from is null or p_to is null or p_to <= p_from then
    raise exception 'give a start date and a later end date';
  end if;
  return analytics.source_report(p_from, p_to);
end;
$fn$;

revoke all on function public.get_source_report(date, date) from public, anon, authenticated;
grant execute on function public.get_source_report(date, date) to authenticated;
