-- Marketer scorecards — founders-only behavioural view for Team ▸ Performance.
--
-- WHY THIS EXISTS
-- The one field marketers were asked to fill in by hand (call_status) has been
-- saved ZERO times in the whole life of the audit log. Anything self-reported
-- gets no adoption, so every number here is derived from something the system
-- observed as a by-product of the work actually being done.
--
-- THE ATTRIBUTION RULE, which is the whole trick:
--   * ACTIONS are attributed via application_events.changed_by — the auth user
--     who actually made the change. This is the only trustworthy per-person
--     signal we have, because applications.assigned_marketer_id RE-STAMPS on
--     unpaid leads whenever an event's marketers change (see the
--     applications-mutable-state note in CLAUDE.md).
--   * OUTCOMES are attributed via applications.assigned_marketer_id, because
--     payments are written by edge functions running as service_role, which
--     leaves changed_by NULL. That column is safe for outcomes specifically:
--     re-stamping deliberately skips rows already at advance_paid/fully_paid,
--     so a lead that took money keeps its original owner forever.
-- Mixing the two would silently credit the wrong person, in both directions.
--
-- Real (non-baseline) history begins 2026-08-08, when the audit trigger landed.
-- Windows longer than that are padded with nothing, not with zeros that mean
-- "did no work" — the client says so rather than implying a drop-off.

CREATE OR REPLACE FUNCTION public.marketer_scorecards_internal(p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
WITH bounds AS (
  SELECT greatest(coalesce(p_days, 30), 1) AS days
),
since AS (
  SELECT now() - make_interval(days => (SELECT days FROM bounds)) AS ts,
         current_date - (SELECT days FROM bounds) AS day
),
-- One row per marketer, carrying the auth id their actions are logged under.
actors AS (
  SELECT m.id, m.name, m.email, m.active, au.id AS auth_id
  FROM call_marketers m
  LEFT JOIN auth.users au ON lower(au.email) = lower(m.email)
),
-- ACTIONS: what this person did, from the audit log.
acts AS (
  SELECT a.id AS marketer_id,
         count(*)                                   AS events,
         count(DISTINCT e.application_id)           AS leads_touched,
         count(DISTINCT (e.changed_at AT TIME ZONE 'Asia/Kolkata')::date) AS active_days,
         count(*) FILTER (WHERE e.field = 'call_status') AS call_status_saves,
         max(e.changed_at)                          AS last_action_at
  FROM actors a
  JOIN application_events e ON e.changed_by = a.auth_id
  WHERE e.field <> 'baseline'
    AND e.changed_at >= (SELECT ts FROM since)
  GROUP BY a.id
),
-- SPEED: application arriving → this person pressing Approve.
invites AS (
  SELECT a.id AS marketer_id,
         count(*) AS invites_sent,
         percentile_cont(0.5) WITHIN GROUP (
           ORDER BY extract(epoch FROM (e.changed_at - ap.created_at)) / 3600.0
         ) AS median_hours_to_invite,
         max(extract(epoch FROM (e.changed_at - ap.created_at)) / 3600.0) AS slowest_hours_to_invite
  FROM actors a
  JOIN application_events e ON e.changed_by = a.auth_id
  JOIN applications ap      ON ap.id = e.application_id
  WHERE e.field = 'status'
    AND e.old_value = 'pending'
    AND e.new_value = 'invited'
    AND e.changed_at >= (SELECT ts FROM since)
    AND e.changed_at >= ap.created_at          -- guard against clock skew
  GROUP BY a.id
),
-- OUTCOMES: lifetime, not windowed. A ticket sold in July is still theirs, and
-- the recovery/balance rates only mean anything over a full lead lifecycle.
outcomes AS (
  SELECT a.id AS marketer_id,
         count(*)                                                    AS leads_owned,
         count(*) FILTER (WHERE ap.status = 'fully_paid')            AS fully_paid,
         count(*) FILTER (WHERE ap.status = 'advance_paid')          AS advance_outstanding,
         count(*) FILTER (WHERE ap.cart_abandoned)                   AS ever_abandoned,
         count(*) FILTER (WHERE ap.recovered_at IS NOT NULL)         AS recovered,
         count(*) FILTER (WHERE ap.re_target
                            AND ap.status NOT IN ('advance_paid', 'fully_paid', 'rejected'))
                                                                     AS re_target_open,
         count(*) FILTER (WHERE ap.resend_details_whatsapp_sent_at IS NOT NULL
                             OR ap.resend_details_email_sent_at IS NOT NULL)
                                                                     AS details_resent
  FROM actors a
  JOIN applications ap ON ap.assigned_marketer_id = a.id
  GROUP BY a.id
),
-- Opened the panel at all. Login-only: presence is not the same as work, and
-- the client labels it that way.
presence AS (
  SELECT a.id AS marketer_id, count(*) AS present_days
  FROM actors a
  JOIN staff_presence_days s ON lower(s.email) = lower(a.email)
  WHERE s.ist_day >= (SELECT day FROM since)
  GROUP BY a.id
)
SELECT jsonb_build_object(
  'window_days',   (SELECT days FROM bounds),
  'history_from',  '2026-08-08',
  'generated_at',  now(),
  'marketers', coalesce(jsonb_agg(row ORDER BY row->>'name'), '[]'::jsonb)
)
FROM (
  SELECT jsonb_build_object(
    'marketer_id',            a.id,
    'name',                   a.name,
    'active',                 a.active,
    'linked',                 a.auth_id IS NOT NULL,
    'events',                 coalesce(ac.events, 0),
    'leads_touched',          coalesce(ac.leads_touched, 0),
    'active_days',            coalesce(ac.active_days, 0),
    'call_status_saves',      coalesce(ac.call_status_saves, 0),
    'last_action_at',         ac.last_action_at,
    'invites_sent',           coalesce(iv.invites_sent, 0),
    'median_hours_to_invite', round(iv.median_hours_to_invite::numeric, 1),
    'slowest_hours_to_invite',round(iv.slowest_hours_to_invite::numeric, 1),
    'present_days',           coalesce(pr.present_days, 0),
    'leads_owned',            coalesce(oc.leads_owned, 0),
    'fully_paid',             coalesce(oc.fully_paid, 0),
    'advance_outstanding',    coalesce(oc.advance_outstanding, 0),
    'ever_abandoned',         coalesce(oc.ever_abandoned, 0),
    'recovered',              coalesce(oc.recovered, 0),
    're_target_open',         coalesce(oc.re_target_open, 0),
    'details_resent',         coalesce(oc.details_resent, 0)
  ) AS row
  FROM actors a
  LEFT JOIN acts     ac ON ac.marketer_id = a.id
  LEFT JOIN invites  iv ON iv.marketer_id = a.id
  LEFT JOIN outcomes oc ON oc.marketer_id = a.id
  LEFT JOIN presence pr ON pr.marketer_id = a.id
  WHERE a.active
) rows;
$function$;

-- Founder gate, matching get_manager_scorecards: a non-founder gets NULL back
-- rather than an error, so the client renders nothing instead of breaking.
CREATE OR REPLACE FUNCTION public.get_marketer_scorecards(p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE WHEN is_admin_strict() THEN marketer_scorecards_internal(p_days) END
$function$;

-- The internal function reads auth.users and every application, so it must not
-- be callable directly — only through the founder-gated wrapper above.
REVOKE ALL ON FUNCTION public.marketer_scorecards_internal(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_marketer_scorecards(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_marketer_scorecards(integer) TO authenticated;
