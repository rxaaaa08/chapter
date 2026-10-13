-- Unified customer analytics, phase 7 (the database's small part).
--
-- Design:    docs/UNIFIED-CUSTOMER-ANALYTICS-PROPOSAL-v2-2026-10-11.md §6, §10
-- Build log: docs/UNIFIED-ANALYTICS-BUILD-LOG.md
--
-- Phase 7 is the website starting to send what phases 1 to 6 made room for. Three
-- of the things it now sends had no reader in the daily self-check, so until
-- this change they would have been recorded and never looked at:
--
--   steps_not_saved  a row the site writes once it is back in touch, saying how
--                    many steps that tab failed to save (props.n). Until now a
--                    lost step was silent: the site never read the answer.
--   booking_stopped  the site told a guest they could not go on, with the
--                    reason as a short code (props.reason).
--   page_seen        a move from one page to another inside the site.
--
-- analytics.health() is patched IN PLACE, the way purge_phone_data was in phase
-- 2: read the live definition, insert at one known line, and FAIL if that line
-- is not found, so a later edit to the function can never be silently
-- overwritten by an old copy of it kept in a file. Running this twice changes
-- nothing the second time.
--
-- Nothing a customer sees changes, and no new data is collected by this file.

do $mig$
declare
  v_def text := pg_get_functiondef('analytics.health()'::regprocedure);
  v_new text;
  -- The last line of the "capture" block, and the line that said a failed save
  -- could not be measured.
  a_capture constant text := $a$'new_shape_first_seen_at',  min(f.created_at) filter (where f.schema_v is not null)$a$;
  a_gap     constant text := $a$'website steps that failed to save (the site has to report them; phase 7)',$a$;
begin
  if position('steps_7d_the_site_said_it_lost' in v_def) > 0 then
    return;  -- already applied
  end if;
  if position(a_capture in v_def) = 0 or position(a_gap in v_def) = 0 then
    raise exception 'analytics.health(): an insertion point was not found, so nothing was changed';
  end if;

  v_new := replace(v_def, a_capture, a_capture || $b$,
      -- What the site itself says it failed to save, summed from the rows it
      -- writes once a step gets through again. A tab closed before that row
      -- could be written still loses its count: this is a floor, not a total.
      'steps_7d_the_site_said_it_lost',
        coalesce(sum(case when (f.props ->> 'n') ~ '^[0-9]{1,5}$' then (f.props ->> 'n')::int end)
                   filter (where f.created_at >= now() - interval '7 days' and f.event_type = 'steps_not_saved'), 0),
      -- Steps still arriving in the OLD shape after the new one began. Two
      -- causes, both worth seeing: a copy of the site from before the change
      -- still open or still cached on a phone, or a step the database refused
      -- with its extras and the site saved again without them.
      'steps_7d_in_the_old_shape_since_the_new_one_began',
        count(*) filter (where f.created_at >= now() - interval '7 days' and f.schema_v is null
                           and f.created_at >= (select min(x.created_at) from public.flow_analytics x where x.schema_v is not null)),
      'page_moves_7d',
        count(*) filter (where f.created_at >= now() - interval '7 days' and f.event_type = 'page_seen'),
      -- Why the site stopped guests part-way through a booking, by reason.
      'guests_stopped_7d',
        (select coalesce(jsonb_object_agg(s.reason, s.n), '{}'::jsonb)
           from (select coalesce(g.props ->> 'reason', 'no_reason') as reason, count(*) as n
                   from public.flow_analytics g
                  where g.event_type = 'booking_stopped' and g.created_at >= now() - interval '7 days'
                  group by 1) s)$b$);

  v_new := replace(v_new, a_gap,
    $c$'website steps lost before the site could say so (a tab closed mid-save, a blocked script)',$c$);

  execute v_new;
end
$mig$;

-- CREATE OR REPLACE keeps the function's grants, but say it again: nothing in
-- the analytics schema is for a browser.
revoke all on function analytics.health() from public, anon, authenticated;
