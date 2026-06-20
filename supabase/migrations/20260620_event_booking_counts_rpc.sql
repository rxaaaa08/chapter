-- Public, anon-safe per-event booking counts. applications is RLS-locked to
-- admins, so the booking site can't COUNT it directly. This SECURITY DEFINER
-- function returns only two aggregate integers and resolves invite_slug to the
-- canonical event slug first.
create or replace function public.event_booking_counts(p_slug text)
returns table(registered integer, reserved integer)
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
    count(a.*)::int as registered,
    count(a.*) filter (where a.status in ('advance_paid', 'fully_paid'))::int as reserved
  from public.applications a
  where a.event_slug = coalesce((select slug from ev), p_slug);
$$;

revoke all on function public.event_booking_counts(text) from public;
grant execute on function public.event_booking_counts(text) to anon, authenticated;
