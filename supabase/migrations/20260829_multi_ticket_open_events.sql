-- Multi-ticket open events (pay-at-venue only).
--
-- One WhatsApp number can buy up to 5 tickets on an open + split + pay_at_venue
-- event, held as a COUNT ON THE EXISTING ROW rather than one row per ticket:
-- applications is keyed by the unique (event_slug, phone) pair and the entire
-- system (get-user-context, the payment gate, marketer assignment, commissions)
-- resolves a customer through it. Row-per-ticket would break all of that.
--
-- Two counts, because at a pay-at-venue event the guest settles the balance for
-- the people who ACTUALLY turned up:
--   ticket_count   = how many they booked and paid an advance for
--   attended_count = how many showed up and were billed the balance (NULL until
--                    the venue payment lands)
-- The advance for a no-show is deliberately kept, so ticket_count is never
-- rewritten downwards -- "booked 3, paid for 2" stays visible in the admin panel.
--
-- payu_payments.quantity carries whichever of the two THIS payment covers
-- (advance -> tickets booked, balance -> heads present), which keeps the money
-- trail reconstructable from the payments table alone. That matters because
-- applications overwrites its own history in place.

alter table public.applications
  add column if not exists ticket_count integer not null default 1;

alter table public.applications
  add column if not exists attended_count integer;

-- The 1..5 bound is load-bearing, not cosmetic: anon can self-INSERT a 'pending'
-- applications row (applications_anon_insert), so without it a forged
-- ticket_count would corrupt the public "N people joined" counter.
alter table public.applications
  drop constraint if exists applications_ticket_count_range;
alter table public.applications
  add constraint applications_ticket_count_range
  check (ticket_count between 1 and 5);

-- Can never claim more attendees than tickets bought, and never a negative head.
alter table public.applications
  drop constraint if exists applications_attended_count_range;
alter table public.applications
  add constraint applications_attended_count_range
  check (attended_count is null or (attended_count between 1 and ticket_count));

alter table public.payu_payments
  add column if not exists quantity integer not null default 1;

alter table public.payu_payments
  drop constraint if exists payu_payments_quantity_range;
alter table public.payu_payments
  add constraint payu_payments_quantity_range
  check (quantity between 1 and 5);

-- ── Capacity now counts TICKETS, not bookings ────────────────────────────────
-- Both RPCs previously did count(a.*), i.e. one seat per row. A 3-ticket booking
-- occupies 3 seats, so spots-left, the amber scarcity threshold and the "N going"
-- label all have to sum the quantity instead.
--
-- coalesce(..., 0) is required: count() returns 0 over an empty set but sum()
-- returns NULL, and the client does arithmetic on these values.

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
    coalesce(sum(a.ticket_count), 0)::int as registered,
    coalesce(sum(a.ticket_count) filter (where a.status in ('advance_paid', 'fully_paid')), 0)::int as reserved
  from public.applications a
  where a.event_slug = coalesce((select slug from ev), p_slug);
$$;

revoke all on function public.event_booking_counts(text) from public;
grant execute on function public.event_booking_counts(text) to anon, authenticated;

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
    coalesce(sum(a.ticket_count), 0)::int as registered,
    coalesce(sum(a.ticket_count) filter (where a.status in ('advance_paid', 'fully_paid')), 0)::int as reserved
  from public.applications a
  where a.event_slug = coalesce((select slug from ev), p_slug)
    and a.selected_date is not null
  group by a.selected_date;
$$;

revoke all on function public.event_booking_counts_by_date(text) from public;
grant execute on function public.event_booking_counts_by_date(text) to anon, authenticated;
