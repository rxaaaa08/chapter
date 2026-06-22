-- Collect email + gender on the doubt form too, so an admin can "Approve &
-- Invite" straight from a doubt with a complete application (no re-apply).
alter table public.doubt_submissions add column if not exists email  text;
alter table public.doubt_submissions add column if not exists gender text;

-- One-time backfill: every event that had doubts has exactly one pickup point,
-- so fill the previously-empty meeting_spot/transport from that single point.
-- (Idempotent — only touches rows where meeting_spot is still blank.)
update doubt_submissions ds
set meeting_spot = btrim(p.point->>'meetingSpot'),
    transport    = coalesce(nullif(btrim(p.point->>'transport'),''), ds.transport)
from events e
cross join lateral (select (e.pickup_points::jsonb -> 0) as point) p
where resolve_event_slug(ds.event_title) = e.slug
  and jsonb_array_length(coalesce(e.pickup_points::jsonb,'[]'::jsonb)) = 1
  and (ds.meeting_spot is null or btrim(ds.meeting_spot) = '');
