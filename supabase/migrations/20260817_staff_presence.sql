-- Staff presence: "did this person open the admin panel today?"
--
-- Why: nothing in the system could answer that. The two things that look like
-- they could, can't:
--
--   * admin_audit_log records ACTIONS, not attendance. A marketer who opens the
--     panel, reads their leads and calls five people leaves zero trace.
--   * auth.users.last_sign_in_at only moves on a FRESH Google login, and
--     sessions persist for weeks — one marketer's last sign-in was 16 Jun while
--     he was demonstrably working in the panel through July. It cannot answer
--     "were they on today".
--
-- So this table is the missing signal, and nothing more: it records that a
-- logged-in staff member had the panel open, one row per person per IST day.
-- It deliberately does NOT try to measure work — see the note at the bottom.
--
-- Design notes:
--   * Keyed by IST calendar day, because "at least once a day" is a question
--     about the team's day, not about UTC.
--   * One row per person per day (not per ping), so the table grows by at most
--     ~20 rows/day and the 14-day attendance strip is a single cheap read.
--   * touch_presence() swallows every error. This runs on every admin page
--     load; a presence failure must never break the panel or block a booking.

CREATE TABLE IF NOT EXISTS public.staff_presence_days (
  email         text        NOT NULL,
  ist_day       date        NOT NULL,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz NOT NULL DEFAULT now(),
  pings         integer     NOT NULL DEFAULT 1,
  PRIMARY KEY (email, ist_day)
);

CREATE INDEX IF NOT EXISTS staff_presence_days_day_idx
  ON public.staff_presence_days (ist_day DESC);

ALTER TABLE public.staff_presence_days ENABLE ROW LEVEL SECURITY;

-- Founders only. Staff must not be able to read each other's attendance, and a
-- marketer reading their own row gains nothing the panel doesn't already show.
DROP POLICY IF EXISTS "staff_presence_days_admin_select" ON public.staff_presence_days;
CREATE POLICY "staff_presence_days_admin_select"
  ON public.staff_presence_days FOR SELECT TO authenticated
  USING (is_admin_strict());

-- No INSERT/UPDATE/DELETE policies exist — every write goes through
-- touch_presence(), which runs SECURITY DEFINER and stamps the caller's own
-- email from the JWT. That is what stops one person marking another present.
--
-- TRUNCATE is revoked for the same reason as on application_events: Supabase's
-- default GRANT ALL hands it to authenticated, and TRUNCATE is NOT subject to
-- RLS, so without this a staff login could wipe the attendance record.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.staff_presence_days FROM anon, authenticated;

-- ── The ping ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.touch_presence()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_day   date;
BEGIN
  v_email := lower(nullif(trim(auth.jwt() ->> 'email'), ''));
  v_day   := (now() AT TIME ZONE 'Asia/Kolkata')::date;

  -- Only real staff are tracked. Anyone else is a silent no-op rather than an
  -- error: this is called on every page load and must never surface to a user.
  IF v_email IS NULL OR NOT public.is_admin() THEN
    RETURN;
  END IF;

  INSERT INTO public.staff_presence_days (email, ist_day)
  VALUES (v_email, v_day)
  ON CONFLICT (email, ist_day) DO UPDATE
    SET last_seen_at = now(),
        pings        = public.staff_presence_days.pings + 1;

EXCEPTION WHEN OTHERS THEN
  -- Presence is observability, never a dependency. Swallow and move on.
  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.touch_presence() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.touch_presence() TO authenticated;

-- ── What this does NOT measure ───────────────────────────────────────────────
--
-- Presence is attendance, not work, and it is trivially gameable: opening the
-- panel for five seconds marks you present for the day. It was chosen over a
-- "worked today" signal deliberately and temporarily — as of 17 Aug 2026 not a
-- single call_status had been saved by any of the 15 active marketers in ten
-- days, so a work-based measure would have shown the whole team as idle when
-- the real problem is that phone work is never recorded.
--
-- The follow-up, once marking a call is an established habit, is a second dot
-- sourced from admin_audit_log + application_events (both already carry the
-- actor and a timestamp). Note that saving a call NOTE without changing the
-- call STATUS currently writes nothing anywhere — that gap needs closing before
-- a work signal would be fair.
