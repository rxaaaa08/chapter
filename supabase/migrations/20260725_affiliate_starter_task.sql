-- The "starter task" — training wheels for new creators (owner decision, 2026-07-25).
--
-- A creator who has never had a video approved should only be asked to make one
-- for the cheap, frequent, low-stakes meetup — not for a ₹3,700 flagship trip.
-- Once the founders approve their first video, every commission-enabled event
-- opens up to them.
--
-- A flag rather than a hard-coded slug, because Chill Sunday Meetup will not run
-- forever: the owner moves the starter to whichever event plays that role from
-- the event editor, with no code change.
--
-- Multiple rows may carry the flag; the client treats them as a set and shows
-- them all. That is deliberate — a unique constraint would make ticking a second
-- event fail mid-save, and an owner who ticks two has simply chosen two.

alter table public.events
  add column if not exists affiliate_starter_task boolean not null default false;

comment on column public.events.affiliate_starter_task is
  'True = this event is the first video a new creator must make. Creators with no approved submission see ONLY starter events (in the submission card, their task list, and the upcoming-events list); everything opens up once one of their videos is approved. Purely presentational — it never affects commission or payouts.';

-- Chill Sunday Meetup is today's starter: cheapest ticket, runs weekly, lowest
-- stakes if a first attempt is rough.
update public.events set affiliate_starter_task = true where slug = 'anna-nagar-meetup';
