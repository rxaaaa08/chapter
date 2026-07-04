-- ─────────────────────────────────────────────────────────────────────────────
-- AFFILIATE (creator) links — functions, triggers & RPCs
-- ─────────────────────────────────────────────────────────────────────────────

-- current_affiliate_id: JWT-email → affiliates.id (active only). NULL for
-- admins/marketers/anon. Basis of all creator-scoped RLS. Mirrors
-- current_marketer_id().
CREATE OR REPLACE FUNCTION public.current_affiliate_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT id FROM affiliates
  WHERE email = (auth.jwt() ->> 'email')
    AND active = true
$$;

-- resolve_affiliate_id: raw handle (with or without leading @) → active
-- affiliate id, else NULL. Used by the attribution trigger + RPCs so the public
-- site never needs SELECT on affiliates.
CREATE OR REPLACE FUNCTION public.resolve_affiliate_id(p_code text)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT id FROM affiliates
  WHERE handle = lower(regexp_replace(coalesce(p_code, ''), '^@', ''))
    AND active = true
$$;

-- BEFORE INSERT: resolve affiliate_code → affiliate_id on new applications.
-- No-op when no code was sent. Independent of the marketer-assignment trigger
-- (different column) so both fire on insert. Runs even for open-event upserts
-- (on the INSERT branch); the open flow additionally calls
-- attribute_open_application() to re-attribute the latest link on repeat visits.
CREATE OR REPLACE FUNCTION public.assign_application_affiliate()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.affiliate_id IS NULL AND NULLIF(NEW.affiliate_code, '') IS NOT NULL THEN
    NEW.affiliate_id := resolve_affiliate_id(NEW.affiliate_code);
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_assign_application_affiliate ON public.applications;
CREATE TRIGGER trg_assign_application_affiliate
  BEFORE INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.assign_application_affiliate();

-- AFTER UPDATE OF status: when status flips to fully_paid, and the event has
-- affiliate_enabled = true, and an affiliate is attributed, log a commission of
-- affiliate_commission_pct% of the city-aware configured FULL price (the net
-- price the founder set, NOT the gross PayU charge). Idempotent via
-- UNIQUE(application_id). Stacks with the marketer accrual (separate trigger).
CREATE OR REPLACE FUNCTION public.accrue_affiliate_sale()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_enabled boolean;
  v_pct     numeric(5,2);
  v_full    numeric(10,2);
  v_amount  numeric(10,2);
BEGIN
  IF NEW.status = 'fully_paid'
     AND (OLD.status IS DISTINCT FROM 'fully_paid')
     AND NEW.affiliate_id IS NOT NULL
  THEN
    SELECT affiliate_enabled, COALESCE(affiliate_commission_pct, 8)
      INTO v_enabled, v_pct
      FROM events WHERE slug = NEW.event_slug;

    IF COALESCE(v_enabled, false) THEN
      v_full   := event_net_price(NEW.event_slug, NEW.selected_city, 'full');
      v_amount := round(COALESCE(v_pct, 8) / 100.0 * COALESCE(v_full, 0), 2);
      IF v_amount > 0 THEN
        INSERT INTO affiliate_sales (application_id, affiliate_id, amount)
        VALUES (NEW.id, NEW.affiliate_id, v_amount)
        ON CONFLICT (application_id) DO NOTHING;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_accrue_affiliate_sale ON public.applications;
CREATE TRIGGER trg_accrue_affiliate_sale
  AFTER UPDATE OF status ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.accrue_affiliate_sale();

-- ── Public RPCs (anon-safe) ──────────────────────────────────────────────────

-- record_affiliate_click: log a click for the given handle. No-op for unknown /
-- inactive handles. session_id dedups uniques on the dashboard.
CREATE OR REPLACE FUNCTION public.record_affiliate_click(p_code text, p_session_id text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_aff uuid;
BEGIN
  v_aff := resolve_affiliate_id(p_code);
  IF v_aff IS NULL THEN RETURN; END IF;
  INSERT INTO affiliate_clicks (affiliate_id, session_id)
  VALUES (v_aff, NULLIF(p_session_id, ''));
END;
$$;
REVOKE ALL ON FUNCTION public.record_affiliate_click(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_affiliate_click(text, text) TO anon, authenticated;

-- attribute_open_application: OPEN-event re-attribution. Sets the latest-link
-- affiliate on an existing UNPAID application (event_slug, phone). Called from
-- the details-form step before checkout, so the creator whose link is active at
-- payment time wins — including overwriting to NULL when no ref (= founder's own
-- link). Guarded to never touch advance_paid/fully_paid rows. Anon can't UPDATE
-- applications directly, so this SECURITY DEFINER RPC does it.
CREATE OR REPLACE FUNCTION public.attribute_open_application(
  p_event_slug text,
  p_phone      text,
  p_code       text
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_phone text;
BEGIN
  v_phone := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
  IF length(v_phone) <> 10 THEN RETURN; END IF;
  IF coalesce(p_event_slug, '') = '' THEN RETURN; END IF;

  UPDATE applications
     SET affiliate_code = NULLIF(p_code, ''),
         affiliate_id   = resolve_affiliate_id(p_code)
   WHERE event_slug = lower(p_event_slug)
     AND phone = v_phone
     AND status NOT IN ('advance_paid', 'fully_paid');
END;
$$;
REVOKE ALL ON FUNCTION public.attribute_open_application(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.attribute_open_application(text, text, text) TO anon, authenticated;

-- ── Creator dashboard RPCs (authenticated creators) ──────────────────────────

-- creator_stats: the calling creator's own funnel. Applications is RLS-locked
-- so creators can't count leads directly — this SECURITY DEFINER RPC scopes
-- everything to current_affiliate_id().
CREATE OR REPLACE FUNCTION public.creator_stats()
RETURNS TABLE (
  clicks_total   integer,
  clicks_unique  integer,
  apps_total     integer,
  tickets_paid   integer,
  earned_total   numeric,
  earned_unpaid  numeric
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  WITH me AS (SELECT current_affiliate_id() AS id)
  SELECT
    (SELECT count(*)::int FROM affiliate_clicks c, me WHERE c.affiliate_id = me.id),
    (SELECT count(DISTINCT coalesce(c.session_id, c.id::text))::int FROM affiliate_clicks c, me WHERE c.affiliate_id = me.id),
    (SELECT count(*)::int FROM applications a, me WHERE a.affiliate_id = me.id),
    (SELECT count(*)::int FROM affiliate_sales s, me WHERE s.affiliate_id = me.id),
    (SELECT COALESCE(sum(s.amount), 0) FROM affiliate_sales s, me WHERE s.affiliate_id = me.id),
    (SELECT COALESCE(sum(s.amount), 0) FROM affiliate_sales s, me WHERE s.affiliate_id = me.id AND s.paid_out_at IS NULL);
$$;
REVOKE ALL ON FUNCTION public.creator_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.creator_stats() TO authenticated;

-- affiliate_leaderboard: transparent board of ALL active creators — handle,
-- tickets sold, total earned. Founder wants full transparency (creators see each
-- other's numbers). Only exposes handle + aggregates, never customer data.
-- Callable only by a logged-in creator (or admin).
CREATE OR REPLACE FUNCTION public.affiliate_leaderboard()
RETURNS TABLE (
  handle       text,
  name         text,
  tickets      integer,
  earned       numeric,
  is_me        boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT a.handle,
         a.name,
         count(s.id)::int          AS tickets,
         COALESCE(sum(s.amount), 0) AS earned,
         (a.id = current_affiliate_id()) AS is_me
    FROM affiliates a
    LEFT JOIN affiliate_sales s ON s.affiliate_id = a.id
   WHERE a.active = true
     AND (current_affiliate_id() IS NOT NULL OR is_admin())
   GROUP BY a.id, a.handle, a.name
   ORDER BY earned DESC, tickets DESC;
$$;
REVOKE ALL ON FUNCTION public.affiliate_leaderboard() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.affiliate_leaderboard() TO authenticated;
