-- Creator signup funnel — capture intent at the door (owner request, 2026-07-26).
--
-- auth.users can't tell you WHO came to self-onboard as a creator: it mixes
-- admins, marketers, curiosity logins and test accounts, and it can't see which
-- flow someone entered. This table fixes that by recording one row the moment a
-- Google account lands in the /creator flow — via "Register as Creator" OR via
-- "Log in" (people misclick, and either way they're in the creator funnel).
--
-- The funnel is then exact:
--   started    = rows in this table
--   completed  = rows with completed_at set
--   abandoned  = started − completed
--
-- completed_at is stamped by a trigger on the affiliates INSERT, NOT by joining
-- to affiliates at read time. That is deliberate: it makes the funnel survive a
-- creator being deleted later — a removed creator stays counted as "completed"
-- instead of silently falling back into "abandoned".

create table if not exists public.creator_signup_intents (
  email         text primary key,
  first_seen_at timestamptz not null default now(),
  completed_at  timestamptz
);

alter table public.creator_signup_intents enable row level security;

-- Founders only — this is funnel data for them, nobody else needs to read it.
drop policy if exists creator_signup_intents_admin_read on public.creator_signup_intents;
create policy creator_signup_intents_admin_read on public.creator_signup_intents
  for select using (public.is_admin_strict());

-- The client never writes directly. This RPC reads the email from the auth
-- token — never a parameter — so a caller can only ever record THEIR OWN entry,
-- and one row per email (first entry wins; later logins don't move first_seen).
create or replace function public.record_creator_signup_intent()
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if v_email = '' then
    return; -- not signed in; nothing to record
  end if;
  insert into public.creator_signup_intents (email)
  values (v_email)
  on conflict (email) do nothing;
end;
$function$;

revoke all on function public.record_creator_signup_intent() from public;
grant execute on function public.record_creator_signup_intent() to authenticated;

-- Stamp completion when the affiliates row is created — self-serve OR hand-added
-- by an admin, so every creator is counted and the funnel can't be gamed by the
-- path taken. coalesce keeps the first completion if one somehow already exists.
create or replace function public.stamp_creator_signup_completion()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  insert into public.creator_signup_intents (email, completed_at)
  values (lower(NEW.email), now())
  on conflict (email)
  do update set completed_at = coalesce(public.creator_signup_intents.completed_at, now());
  return NEW;
end;
$function$;

drop trigger if exists trg_stamp_creator_signup_completion on public.affiliates;
create trigger trg_stamp_creator_signup_completion
  after insert on public.affiliates
  for each row execute function public.stamp_creator_signup_completion();

-- Backfill: every creator that already exists completed the funnel at some point.
-- Use their affiliates.created_at as the completion time; first_seen defaults to
-- the same, which is the best estimate we have for pre-existing creators.
insert into public.creator_signup_intents (email, first_seen_at, completed_at)
select lower(a.email), a.created_at, a.created_at
from public.affiliates a
on conflict (email) do update set completed_at = coalesce(public.creator_signup_intents.completed_at, excluded.completed_at);
