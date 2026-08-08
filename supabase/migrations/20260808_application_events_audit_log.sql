-- Append-only history for applications.
--
-- Why: the applications row records what is true NOW, never what was true THEN.
-- Five separate fields overwrite history in place, and every one of them has
-- already produced a wrong answer during analysis:
--
--   * assigned_marketer_id — re-stamped on every unpaid lead when an event's
--     marketers change (paid leads are pinned). Made two marketers who joined
--     later look like they converted 0 of 18, because the only leads that could
--     move to them were the ones that never paid.
--   * selected_date — a marketer rolling a lead from the 5 Jul meetup to the
--     19 Jul one overwrites the original pick with no trace. Made 5 Jul look
--     like it converted 69% off 32 leads when its unconverted leads had simply
--     been moved out.
--   * cart_abandoned — set once, never cleared, so "abandoned" silently
--     includes people who later came back and paid.
--   * event slug/title drift on copied or renamed events.
--   * affiliate_id — re-attributed to whoever's link was live at payment time.
--
-- None of that is recoverable. This table stops the bleeding from today: every
-- change to a field that matters for cohort analysis or commission attribution
-- gets one immutable row, with a timestamp and who did it.
--
-- Design notes:
--   * The trigger is AFTER and named to sort last, so it observes the final row
--     state once the assignment/accrual triggers have run.
--   * The whole trigger body is wrapped in EXCEPTION WHEN OTHERS. This table is
--     live on a payments system — a logging failure must never roll back a
--     customer's booking or a paid-status flip.
--   * No UPDATE or DELETE grants exist and there are no write policies, so the
--     log is append-only through the API. Only the SECURITY DEFINER trigger
--     writes.
--   * Send-bookkeeping flags (aisensy_*, email_*) are deliberately NOT logged —
--     they're noise and would bury the signal.

CREATE TABLE IF NOT EXISTS public.application_events (
  id             bigserial PRIMARY KEY,
  application_id uuid        NOT NULL,
  -- Denormalised so a log row stays readable even if the application is deleted
  -- (deletions are exactly the thing you most want a record of).
  event_slug     text,
  phone          text,
  field          text        NOT NULL,
  old_value      text,
  new_value      text,
  changed_at     timestamptz NOT NULL DEFAULT now(),
  changed_by     uuid,   -- auth.uid() when the change came from a logged-in session
  changed_role   text    -- anon (customer) | authenticated (admin/ops) | service_role (edge fn / cron)
);

CREATE INDEX IF NOT EXISTS application_events_app_idx
  ON public.application_events (application_id, changed_at);
CREATE INDEX IF NOT EXISTS application_events_slug_idx
  ON public.application_events (event_slug, changed_at DESC);
CREATE INDEX IF NOT EXISTS application_events_field_idx
  ON public.application_events (field, changed_at DESC);

ALTER TABLE public.application_events ENABLE ROW LEVEL SECURITY;

-- Founders only, matching the gate on the analytics RPCs. No INSERT/UPDATE/DELETE
-- policy exists, so nothing can write or rewrite the log through PostgREST.
DROP POLICY IF EXISTS "application_events_admin_select" ON public.application_events;
CREATE POLICY "application_events_admin_select"
  ON public.application_events FOR SELECT TO authenticated
  USING (is_admin_strict());

-- TRUNCATE matters as much as DELETE here: Supabase's default GRANT ALL hands it
-- to anon/authenticated, and TRUNCATE is NOT subject to RLS — so without this a
-- staff login could wipe the entire audit trail in one statement.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.application_events FROM anon, authenticated;

-- ── The recorder ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.log_application_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid  uuid;
  v_role text;
  v_row  applications%ROWTYPE;
BEGIN
  BEGIN
    v_uid := auth.uid();
  EXCEPTION WHEN OTHERS THEN v_uid := NULL;
  END;
  BEGIN
    v_role := nullif(current_setting('request.jwt.claim.role', true), '');
  EXCEPTION WHEN OTHERS THEN v_role := NULL;
  END;
  IF v_role IS NULL THEN v_role := current_user; END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO application_events (application_id, event_slug, phone, field, old_value, new_value, changed_by, changed_role)
    VALUES (NEW.id, NEW.event_slug, NEW.phone, 'created', NULL,
            format('status=%s date=%s marketer=%s manager=%s',
                   coalesce(NEW.status,'-'), coalesce(NEW.selected_date,'-'),
                   coalesce(NEW.assigned_marketer_id::text,'-'), coalesce(NEW.assigned_manager_id::text,'-')),
            v_uid, v_role);
    RETURN NULL;
  END IF;

  IF TG_OP = 'DELETE' THEN
    INSERT INTO application_events (application_id, event_slug, phone, field, old_value, new_value, changed_by, changed_role)
    VALUES (OLD.id, OLD.event_slug, OLD.phone, 'deleted',
            format('status=%s date=%s', coalesce(OLD.status,'-'), coalesce(OLD.selected_date,'-')),
            NULL, v_uid, v_role);
    RETURN NULL;
  END IF;

  -- UPDATE: one row per tracked field that actually moved.
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO application_events (application_id, event_slug, phone, field, old_value, new_value, changed_by, changed_role)
    VALUES (NEW.id, NEW.event_slug, NEW.phone, 'status', OLD.status, NEW.status, v_uid, v_role);
  END IF;

  IF NEW.selected_date IS DISTINCT FROM OLD.selected_date THEN
    INSERT INTO application_events (application_id, event_slug, phone, field, old_value, new_value, changed_by, changed_role)
    VALUES (NEW.id, NEW.event_slug, NEW.phone, 'selected_date', OLD.selected_date, NEW.selected_date, v_uid, v_role);
  END IF;

  IF NEW.assigned_marketer_id IS DISTINCT FROM OLD.assigned_marketer_id THEN
    INSERT INTO application_events (application_id, event_slug, phone, field, old_value, new_value, changed_by, changed_role)
    VALUES (NEW.id, NEW.event_slug, NEW.phone, 'assigned_marketer_id',
            OLD.assigned_marketer_id::text, NEW.assigned_marketer_id::text, v_uid, v_role);
  END IF;

  IF NEW.assigned_manager_id IS DISTINCT FROM OLD.assigned_manager_id THEN
    INSERT INTO application_events (application_id, event_slug, phone, field, old_value, new_value, changed_by, changed_role)
    VALUES (NEW.id, NEW.event_slug, NEW.phone, 'assigned_manager_id',
            OLD.assigned_manager_id::text, NEW.assigned_manager_id::text, v_uid, v_role);
  END IF;

  IF NEW.affiliate_id IS DISTINCT FROM OLD.affiliate_id THEN
    INSERT INTO application_events (application_id, event_slug, phone, field, old_value, new_value, changed_by, changed_role)
    VALUES (NEW.id, NEW.event_slug, NEW.phone, 'affiliate_id',
            OLD.affiliate_id::text, NEW.affiliate_id::text, v_uid, v_role);
  END IF;

  IF NEW.call_status IS DISTINCT FROM OLD.call_status THEN
    INSERT INTO application_events (application_id, event_slug, phone, field, old_value, new_value, changed_by, changed_role)
    VALUES (NEW.id, NEW.event_slug, NEW.phone, 'call_status', OLD.call_status, NEW.call_status, v_uid, v_role);
  END IF;

  IF NEW.cart_abandoned IS DISTINCT FROM OLD.cart_abandoned THEN
    INSERT INTO application_events (application_id, event_slug, phone, field, old_value, new_value, changed_by, changed_role)
    VALUES (NEW.id, NEW.event_slug, NEW.phone, 'cart_abandoned',
            OLD.cart_abandoned::text, NEW.cart_abandoned::text, v_uid, v_role);
  END IF;

  IF NEW.recovered_at IS DISTINCT FROM OLD.recovered_at THEN
    INSERT INTO application_events (application_id, event_slug, phone, field, old_value, new_value, changed_by, changed_role)
    VALUES (NEW.id, NEW.event_slug, NEW.phone, 'recovered_at',
            OLD.recovered_at::text, NEW.recovered_at::text, v_uid, v_role);
  END IF;

  IF NEW.selected_city IS DISTINCT FROM OLD.selected_city THEN
    INSERT INTO application_events (application_id, event_slug, phone, field, old_value, new_value, changed_by, changed_role)
    VALUES (NEW.id, NEW.event_slug, NEW.phone, 'selected_city', OLD.selected_city, NEW.selected_city, v_uid, v_role);
  END IF;

  IF NEW.pickup_point_id IS DISTINCT FROM OLD.pickup_point_id THEN
    INSERT INTO application_events (application_id, event_slug, phone, field, old_value, new_value, changed_by, changed_role)
    VALUES (NEW.id, NEW.event_slug, NEW.phone, 'pickup_point_id', OLD.pickup_point_id, NEW.pickup_point_id, v_uid, v_role);
  END IF;

  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  -- Never let bookkeeping break a booking or a payment.
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.log_application_change() FROM PUBLIC, anon, authenticated;

-- Sorts last so it runs after the assignment/accrual triggers and sees the
-- settled row.
DROP TRIGGER IF EXISTS trg_zz_log_application_change ON public.applications;
CREATE TRIGGER trg_zz_log_application_change
  AFTER INSERT OR UPDATE OR DELETE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.log_application_change();

-- ── Baseline ─────────────────────────────────────────────────────────────────
-- Real history is gone and cannot be reconstructed. Seed one 'baseline' row per
-- existing application recording its state as of now, so every future diff has
-- a floor to measure from. Marked 'baseline' precisely so nobody mistakes it for
-- observed history.
INSERT INTO public.application_events
  (application_id, event_slug, phone, field, old_value, new_value, changed_at, changed_role)
SELECT a.id, a.event_slug, a.phone, 'baseline', NULL,
       format('status=%s date=%s marketer=%s manager=%s',
              coalesce(a.status,'-'), coalesce(a.selected_date,'-'),
              coalesce(a.assigned_marketer_id::text,'-'), coalesce(a.assigned_manager_id::text,'-')),
       now(), 'migration'
FROM public.applications a
WHERE NOT EXISTS (
  SELECT 1 FROM public.application_events e
  WHERE e.application_id = a.id AND e.field = 'baseline'
);

-- ── Readable view ────────────────────────────────────────────────────────────
-- Resolves marketer/manager UUIDs to names so the log is legible without joins.
CREATE OR REPLACE VIEW public.application_history AS
SELECT
  ev.changed_at,
  ev.event_slug,
  a.name        AS lead_name,
  ev.phone,
  ev.field,
  CASE ev.field
    WHEN 'assigned_marketer_id' THEN coalesce(mo.name, ev.old_value)
    WHEN 'assigned_manager_id'  THEN coalesce(mo.name, ev.old_value)
    ELSE ev.old_value
  END AS changed_from,
  CASE ev.field
    WHEN 'assigned_marketer_id' THEN coalesce(mn.name, ev.new_value)
    WHEN 'assigned_manager_id'  THEN coalesce(mn.name, ev.new_value)
    ELSE ev.new_value
  END AS changed_to,
  ev.changed_role,
  ev.application_id
FROM public.application_events ev
LEFT JOIN public.applications  a  ON a.id = ev.application_id
LEFT JOIN public.call_marketers mo ON mo.id::text = ev.old_value
LEFT JOIN public.call_marketers mn ON mn.id::text = ev.new_value;

ALTER VIEW public.application_history SET (security_invoker = true);
