-- Creator video submissions — the MVP of creator work-tracking.
--
-- The problem: onboarding scales to 100 creators, but nothing tells the founders
-- whether a creator is actually making videos or just sitting in the roster.
--
-- The model is deliberately minimal: there is NO campaign/assignment system and
-- no per-creator task rows. A "task" is derived at read time — every event with
-- creator commission switched on that still has an upcoming date. A row here
-- exists only when a creator actually submits a video, so the table IS the
-- activity log: count the rows per creator, look at the latest date, done.
--
-- Tasks are per DATE, not per event: Chill Sunday Meetup recurs, so each
-- upcoming date is its own task and a creator who posted in July still gets
-- asked in August. That is what keeps the tracking signal alive over time.
--
-- Review is founders-only for now (is_admin_strict), by owner decision — it
-- moves to managers once the workflow settles.

create table if not exists public.creator_submissions (
  id            uuid primary key default gen_random_uuid(),
  affiliate_id  uuid not null references public.affiliates(id) on delete cascade,
  event_slug    text not null,
  event_date    date not null,
  video_url     text not null,
  status        text not null default 'pending'
                check (status in ('pending', 'approved', 'changes_requested')),
  review_note   text,
  submitted_at  timestamptz not null default now(),
  reviewed_at   timestamptz,
  reviewed_by   text
);

-- The creator's own history (dashboard) and the founders' queue (admin).
create index if not exists creator_submissions_affiliate_idx
  on public.creator_submissions (affiliate_id, submitted_at desc);
create index if not exists creator_submissions_status_idx
  on public.creator_submissions (status, submitted_at desc);
create index if not exists creator_submissions_task_idx
  on public.creator_submissions (event_slug, event_date);

alter table public.creator_submissions enable row level security;

-- Founders only. Ops/staff (is_admin() but not strict) deliberately cannot see
-- or review creator videos, matching how the roadmap and finances are gated.
drop policy if exists creator_submissions_admin_all on public.creator_submissions;
create policy creator_submissions_admin_all on public.creator_submissions
  for all using (public.is_admin_strict()) with check (public.is_admin_strict());

-- A creator reads their own submissions (status + review note). Writes go
-- through submit_creator_video() so status/review columns can never be forged.
drop policy if exists creator_submissions_self_select on public.creator_submissions;
create policy creator_submissions_self_select on public.creator_submissions
  for select using (affiliate_id = public.current_affiliate_id());

-- The only write path for creators. Validates, server-side, that the caller is
-- an active creator and that the task is real (commission-enabled event, date
-- still upcoming) — so a submission can never be filed against an arbitrary
-- slug or a past date.
create or replace function public.submit_creator_video(
  p_event_slug text,
  p_event_date date,
  p_video_url  text
)
returns table (id uuid, status text, submitted_at timestamptz)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_affiliate_id uuid;
  v_url          text;
  v_event_id     uuid;
  v_today        date := (now() at time zone 'Asia/Kolkata')::date;
  v_recent       int;
begin
  v_affiliate_id := public.current_affiliate_id();
  if v_affiliate_id is null then
    raise exception 'An active creator account is required' using errcode = '42501';
  end if;

  v_url := btrim(coalesce(p_video_url, ''));
  if v_url !~* '^https?://' or length(v_url) > 500 then
    raise exception 'Paste a valid link starting with http:// or https://'
      using errcode = '22023';
  end if;

  select e.id into v_event_id
    from public.events e
   where e.slug = p_event_slug
     and e.is_active is true
     and e.affiliate_enabled is true;

  if v_event_id is null then
    raise exception 'That event is not open for creator videos' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.event_dates d
     where d.event_id = v_event_id
       and d.start_date = p_event_date
       and d.start_date >= v_today
  ) then
    raise exception 'That date is not an upcoming date for this event'
      using errcode = '22023';
  end if;

  -- Cheap anti-spam: a creator cannot pile more than 10 videos on one task.
  select count(*) into v_recent
    from public.creator_submissions s
   where s.affiliate_id = v_affiliate_id
     and s.event_slug   = p_event_slug
     and s.event_date   = p_event_date;

  if v_recent >= 10 then
    raise exception 'You have already submitted several videos for this event'
      using errcode = '22023';
  end if;

  return query
  insert into public.creator_submissions (affiliate_id, event_slug, event_date, video_url)
  values (v_affiliate_id, p_event_slug, p_event_date, v_url)
  returning creator_submissions.id,
            creator_submissions.status,
            creator_submissions.submitted_at;
end;
$function$;

revoke all on function public.submit_creator_video(text, date, text) from public;
grant execute on function public.submit_creator_video(text, date, text) to authenticated;
