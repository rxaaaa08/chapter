-- Per-date, anon-safe booking counts for the calendar's per-date spots-left
-- logic. Mirrors event_booking_counts but groups by the date the applicant
-- chose (applications.selected_date). registered = all statuses; reserved =
-- advance_paid/fully_paid. Resolves invite_slug -> canonical slug first.
create or replace function public.event_booking_counts_by_date(p_slug text)
returns table(selected_date text, registered integer, reserved integer)
language sql
stable
security definer
set search_path = public
as $$
  with ev as (
    select slug from public.events
    where slug = p_slug or invite_slug = p_slug
    limit 1
  )
  select
    a.selected_date::text as selected_date,
    count(a.*)::int as registered,
    count(a.*) filter (where a.status in ('advance_paid', 'fully_paid'))::int as reserved
  from public.applications a
  where a.event_slug = coalesce((select slug from ev), p_slug)
    and a.selected_date is not null
  group by a.selected_date;
$$;

revoke all on function public.event_booking_counts_by_date(text) from public;
grant execute on function public.event_booking_counts_by_date(text) to anon, authenticated;
