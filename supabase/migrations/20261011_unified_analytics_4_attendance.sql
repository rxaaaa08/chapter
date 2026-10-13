-- Unified customer analytics, phase 4 of 8: attendance.
--
-- Design:    docs/UNIFIED-CUSTOMER-ANALYTICS-PROPOSAL-v2-2026-10-11.md §8, §11.1
-- Build log: docs/UNIFIED-ANALYTICS-BUILD-LOG.md
--
-- Until now the only sign that someone came was a balance paid at the venue
-- (applications.attended_count): 8 of 127 paid bookings. This is where "came /
-- did not come / cancelled / moved" is kept for every booking, with the mark
-- that says the host has finished the list.
--
-- Backend only. No screen calls these yet.
--
-- AN OCCURRENCE IS (plan, date), read off the booking itself. It is NOT an
-- event_dates row: only 36 of 130 paid bookings still match one (measured
-- 2026-10-11), because dates are edited and removed after the day has passed.
-- The date written on the booking never changes under it.

-- ── 1. Tables ────────────────────────────────────────────────────────────────
create table if not exists analytics.attendance (
  application_id  uuid not null references public.applications (id) on delete cascade,
  occurrence_date date not null,
  plan_id         uuid,            -- no foreign key: deleting a plan must not erase who came to it
  event_slug      text not null,
  state           text not null check (state in ('came', 'did_not_come', 'cancelled', 'moved')),
  came_count      integer check (came_count is null or came_count between 0 and 50),
  marked_by       text not null,
  marked_at       timestamptz not null default now(),
  primary key (application_id, occurrence_date)
);

comment on table analytics.attendance is
  'What the host recorded for one booking on one date. NO ROW MEANS UNKNOWN, never "did not come": a name not yet ticked is not a no-show. came_count is how many of the booking''s tickets turned up. Deleted with its booking.';

create table if not exists analytics.occurrence_rosters (
  plan_id         uuid not null,
  occurrence_date date not null,
  event_slug      text not null,
  completed_at    timestamptz,
  completed_by    text,
  -- What a ticket cost us for THIS date, copied from the plan the first time the
  -- list is completed and never overwritten. events.cost_per_ticket is a single
  -- current figure; reading it later would rewrite the profit of every past date.
  cost_per_ticket numeric,
  updated_at      timestamptz not null default now(),
  primary key (plan_id, occurrence_date)
);

comment on table analytics.occurrence_rosters is
  'One row per plan and date once the host has dealt with its list. completed_at set = the host says the list is finished, so "unknown" on that date now means "not recorded", not "not yet recorded".';

alter table analytics.attendance         enable row level security;
alter table analytics.occurrence_rosters enable row level security;
revoke all on analytics.attendance         from public, anon, authenticated;
revoke all on analytics.occurrence_rosters from public, anon, authenticated;

-- ── 2. One reading of attendance, whatever the source ────────────────────────
--
-- A host's mark wins. Failing that, a balance paid at the venue is taken as
-- "came" for the number of tickets it was paid for, and says so in how_known.
create or replace view analytics.v_attendance
with (security_invoker = true) as
select a.id                         as application_id,
       e.id                         as plan_id,
       a.event_slug,
       a.phone,
       case when a.selected_date ~ '^\d{4}-\d{2}-\d{2}$' then a.selected_date::date end as occurrence_date,
       a.status,
       coalesce(a.ticket_count, 1)  as tickets,
       coalesce(t.state,
                case when coalesce(a.attended_count, 0) > 0 then 'came' end,
                'unknown')          as state,
       coalesce(t.came_count,
                case when coalesce(a.attended_count, 0) > 0 then a.attended_count end) as came_count,
       case when t.application_id is not null then 'marked_by_host'
            when coalesce(a.attended_count, 0) > 0 then 'balance_paid_at_venue'
       end                          as how_known,
       t.marked_at,
       r.completed_at               as list_completed_at
from public.applications a
left join public.events e
       on lower(e.slug) = lower(a.event_slug)
left join analytics.attendance t
       on t.application_id = a.id
      and a.selected_date ~ '^\d{4}-\d{2}-\d{2}$'
      and t.occurrence_date = a.selected_date::date
left join analytics.occurrence_rosters r
       on r.plan_id = e.id
      and a.selected_date ~ '^\d{4}-\d{2}-\d{2}$'
      and r.occurrence_date = a.selected_date::date;

revoke all on analytics.v_attendance from public, anon, authenticated;

-- ── 3. What a screen will call ───────────────────────────────────────────────
--
-- Gate: is_admin_only(), the same test that lets someone edit a booking. Every
-- change is written to admin_audit_log, because a mark overwrites the one
-- before it.

create or replace function public.mark_attendance(
  p_application_id uuid,
  p_state          text,
  p_came_count     integer default null
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  a       record;
  v_plan  uuid;
  v_date  date;
  v_count integer;
  v_who   text := coalesce(auth.jwt() ->> 'email', session_user::text);
begin
  if not public.is_admin_only() and session_user not in ('postgres', 'supabase_admin') then
    raise exception 'unauthorized';
  end if;
  if p_state is null or p_state not in ('came', 'did_not_come', 'cancelled', 'moved', 'unknown') then
    raise exception 'state must be one of: came, did_not_come, cancelled, moved, unknown';
  end if;

  select id, event_slug, selected_date, ticket_count into a
  from public.applications where id = p_application_id;
  if not found then raise exception 'booking not found'; end if;
  if a.selected_date is null or a.selected_date !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception 'this booking has no date to mark';
  end if;
  v_date := a.selected_date::date;
  select e.id into v_plan from public.events e where lower(e.slug) = lower(a.event_slug) limit 1;

  if p_state = 'unknown' then
    delete from analytics.attendance where application_id = a.id and occurrence_date = v_date;
    v_count := null;
  else
    v_count := case p_state
                 when 'came'         then least(greatest(coalesce(p_came_count, a.ticket_count, 1), 1), 50)
                 when 'did_not_come' then 0
               end;
    insert into analytics.attendance as t
      (application_id, occurrence_date, plan_id, event_slug, state, came_count, marked_by, marked_at)
    values (a.id, v_date, v_plan, a.event_slug, p_state, v_count, v_who, now())
    on conflict (application_id, occurrence_date) do update set
      state = excluded.state, came_count = excluded.came_count,
      marked_by = excluded.marked_by, marked_at = excluded.marked_at,
      plan_id = coalesce(excluded.plan_id, t.plan_id);
  end if;

  insert into public.admin_audit_log (admin_email, action, target_table, target_id, details)
  values (v_who, 'mark_attendance', 'applications', a.id::text,
          jsonb_build_object('state', p_state, 'came_count', v_count, 'date', v_date, 'event_slug', a.event_slug));

  return jsonb_build_object('application_id', a.id, 'date', v_date, 'state', p_state, 'came_count', v_count);
end;
$fn$;

-- The list for one plan on one date, with what is known about each booking.
create or replace function public.get_roster(p_event_slug text, p_date date)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_plan uuid;
  v_out  jsonb;
begin
  if not public.is_admin_only() and session_user not in ('postgres', 'supabase_admin') then
    raise exception 'unauthorized';
  end if;
  select e.id into v_plan from public.events e where lower(e.slug) = lower(p_event_slug) limit 1;

  select jsonb_build_object(
    'event_slug', p_event_slug,
    'date', p_date,
    'list_completed_at', (select r.completed_at from analytics.occurrence_rosters r where r.plan_id = v_plan and r.occurrence_date = p_date),
    'list_completed_by', (select r.completed_by from analytics.occurrence_rosters r where r.plan_id = v_plan and r.occurrence_date = p_date),
    'cost_per_ticket',   (select r.cost_per_ticket from analytics.occurrence_rosters r where r.plan_id = v_plan and r.occurrence_date = p_date),
    'counts', coalesce((select jsonb_object_agg(s.state, s.n)
                        from (select v.state, count(*) as n from analytics.v_attendance v
                              where lower(v.event_slug) = lower(p_event_slug) and v.occurrence_date = p_date
                                and v.status in ('advance_paid', 'fully_paid')
                              group by v.state) s), '{}'::jsonb),
    'people', coalesce((select jsonb_agg(jsonb_build_object(
                          'application_id', v.application_id, 'name', a.name, 'phone', v.phone,
                          'status', v.status, 'tickets', v.tickets, 'state', v.state,
                          'came_count', v.came_count, 'how_known', v.how_known, 'marked_at', v.marked_at)
                          order by (v.status in ('advance_paid', 'fully_paid')) desc, a.name)
                        from analytics.v_attendance v join public.applications a on a.id = v.application_id
                        where lower(v.event_slug) = lower(p_event_slug) and v.occurrence_date = p_date), '[]'::jsonb)
  ) into v_out;
  return v_out;
end;
$fn$;

-- "The list is finished." Freezes the date's cost per ticket the first time.
-- p_mark_rest_did_not_come = true also records every paid booking on that date
-- that is still unknown as "did not come"; false leaves them unknown.
create or replace function public.complete_roster(
  p_event_slug             text,
  p_date                   date,
  p_mark_rest_did_not_come boolean default false
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_plan uuid;
  v_cost numeric;
  v_who  text := coalesce(auth.jwt() ->> 'email', session_user::text);
  v_rest integer := 0;
begin
  if not public.is_admin_only() and session_user not in ('postgres', 'supabase_admin') then
    raise exception 'unauthorized';
  end if;
  select e.id, e.cost_per_ticket into v_plan, v_cost
  from public.events e where lower(e.slug) = lower(p_event_slug) limit 1;
  if v_plan is null then raise exception 'plan not found'; end if;
  if p_date is null then raise exception 'a date is required'; end if;

  if coalesce(p_mark_rest_did_not_come, false) then
    insert into analytics.attendance
      (application_id, occurrence_date, plan_id, event_slug, state, came_count, marked_by, marked_at)
    select v.application_id, p_date, v_plan, v.event_slug, 'did_not_come', 0, v_who, now()
    from analytics.v_attendance v
    where lower(v.event_slug) = lower(p_event_slug) and v.occurrence_date = p_date
      and v.status in ('advance_paid', 'fully_paid') and v.state = 'unknown'
    on conflict do nothing;
    get diagnostics v_rest = row_count;
  end if;

  insert into analytics.occurrence_rosters as r
    (plan_id, occurrence_date, event_slug, completed_at, completed_by, cost_per_ticket, updated_at)
  values (v_plan, p_date, p_event_slug, now(), v_who, v_cost, now())
  on conflict (plan_id, occurrence_date) do update set
    completed_at = now(), completed_by = excluded.completed_by,
    cost_per_ticket = coalesce(r.cost_per_ticket, excluded.cost_per_ticket),
    updated_at = now();

  insert into public.admin_audit_log (admin_email, action, target_table, target_id, details)
  values (v_who, 'complete_roster', 'events', v_plan::text,
          jsonb_build_object('date', p_date, 'event_slug', p_event_slug, 'marked_rest_did_not_come', v_rest));

  return public.get_roster(p_event_slug, p_date) || jsonb_build_object('marked_rest_did_not_come', v_rest);
end;
$fn$;

create or replace function public.reopen_roster(p_event_slug text, p_date date)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $fn$
declare
  v_plan uuid;
  v_who  text := coalesce(auth.jwt() ->> 'email', session_user::text);
begin
  if not public.is_admin_only() and session_user not in ('postgres', 'supabase_admin') then
    raise exception 'unauthorized';
  end if;
  select e.id into v_plan from public.events e where lower(e.slug) = lower(p_event_slug) limit 1;
  if v_plan is null then raise exception 'plan not found'; end if;

  update analytics.occurrence_rosters
     set completed_at = null, completed_by = null, updated_at = now()
   where plan_id = v_plan and occurrence_date = p_date;

  insert into public.admin_audit_log (admin_email, action, target_table, target_id, details)
  values (v_who, 'reopen_roster', 'events', v_plan::text, jsonb_build_object('date', p_date, 'event_slug', p_event_slug));

  return public.get_roster(p_event_slug, p_date);
end;
$fn$;

revoke all on function public.mark_attendance(uuid, text, integer)   from public, anon, authenticated;
revoke all on function public.get_roster(text, date)                 from public, anon, authenticated;
revoke all on function public.complete_roster(text, date, boolean)   from public, anon, authenticated;
revoke all on function public.reopen_roster(text, date)              from public, anon, authenticated;
grant execute on function public.mark_attendance(uuid, text, integer) to authenticated;
grant execute on function public.get_roster(text, date)               to authenticated;
grant execute on function public.complete_roster(text, date, boolean) to authenticated;
grant execute on function public.reopen_roster(text, date)            to authenticated;

-- ── 4. Attendance on the timeline ────────────────────────────────────────────
--
-- Placed at midday (India time) of the date it is about, not at the moment the
-- host ticked the name, so it reads in the right place in a person's history.
-- Added by inserting one branch into the live function, checked.
do $do$
declare
  d  text;
  d2 text;
begin
  select pg_get_functiondef('analytics.contact_timeline(text)'::regprocedure) into d;
  if position('analytics.attendance' in d) = 0 then
    d2 := regexp_replace(
      d,
      '(where not exists \(select 1 from public\.flow_analytics f where f\.session_id = vs\.session_id\))\s*;',
      E'\\1\n\n  union all\n'
      || E'  select (t.occurrence_date::timestamp + interval ''12 hours'') at time zone ''Asia/Kolkata'',\n'
      || E'         case t.state when ''came'' then ''attended'' when ''did_not_come'' then ''did_not_attend'' else ''booking_'' || t.state end,\n'
      || E'         t.event_slug,\n'
      || E'         jsonb_strip_nulls(jsonb_build_object(''date'', t.occurrence_date, ''came'', t.came_count, ''marked_at'', t.marked_at)),\n'
      || E'         ''attendance'', t.application_id::text || '':'' || t.occurrence_date::text, ''known''\n'
      || E'  from analytics.attendance t\n'
      || E'  join public.applications a on a.id = t.application_id, p\n'
      || E'  where a.phone = p.phone;'
    );
    if d2 = d then
      raise exception 'contact_timeline: anchor not found, attendance NOT added to the timeline';
    end if;
    execute d2;
  end if;
end;
$do$;
