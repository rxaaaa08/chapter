-- Purger v2: multiple numbers per scan/purge + a passcode gate on deletion.
--
-- Why the passcode: two people share the admin login, but only the founder
-- may delete data. The 4-digit passcode lives in app_secrets (RLS with zero
-- policies — unreadable from the panel; same pattern as admin_push_secret)
-- and purge_phone_data() verifies it SERVER-SIDE, so it cannot be bypassed
-- by poking the RPC directly with the shared login. The retype-the-number
-- confirmation in the UI is dropped in favour of this.
--
-- Signature change (text → text[]) means dropping the v1 functions first so
-- PostgREST never sees two same-named overloads.

INSERT INTO public.app_secrets (name, value)
VALUES ('purge_passcode', '5697')
ON CONFLICT (name) DO NOTHING;  -- never clobber a rotated passcode on re-run

DROP FUNCTION IF EXISTS public.scan_phone_data(text);
DROP FUNCTION IF EXISTS public.purge_phone_data(text);

-- Normalizes raw inputs to distinct last-10-digit numbers; anything shorter
-- than 10 digits after cleanup is reported back as invalid rather than
-- silently matching the wrong rows.
CREATE OR REPLACE FUNCTION public._normalize_phones(p_phones text[], OUT valid text[], OUT invalid text[])
LANGUAGE sql IMMUTABLE
AS $$
  SELECT
    coalesce(array_agg(DISTINCT n) FILTER (WHERE length(n) = 10), '{}'::text[]),
    coalesce(array_agg(DISTINCT raw) FILTER (WHERE length(n) < 10 AND btrim(raw) <> ''), '{}'::text[])
  FROM (
    SELECT p AS raw, right(regexp_replace(coalesce(p, ''), '\D', '', 'g'), 10) AS n
    FROM unnest(p_phones) AS p
  ) t;
$$;

CREATE OR REPLACE FUNCTION public.scan_phone_data(p_phones text[])
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_valid   text[];
  v_invalid text[];
BEGIN
  IF NOT public.is_admin_strict() AND session_user NOT IN ('postgres', 'supabase_admin') THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  SELECT valid, invalid INTO v_valid, v_invalid FROM public._normalize_phones(p_phones);
  IF array_length(v_valid, 1) IS NULL THEN
    RAISE EXCEPTION 'No valid 10-digit phone numbers given';
  END IF;

  RETURN jsonb_build_object(
    'phones', to_jsonb(v_valid),
    'invalid', to_jsonb(v_invalid),
    'applications', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'phone', right(regexp_replace(a.phone, '\D', '', 'g'), 10),
        'event', a.event_slug, 'name', a.name, 'status', a.status,
        'created', (a.created_at AT TIME ZONE 'Asia/Kolkata')::date
      ) ORDER BY a.created_at), '[]'::jsonb)
      FROM applications a
      WHERE right(regexp_replace(a.phone, '\D', '', 'g'), 10) = ANY(v_valid)
    ),
    'payments', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'phone', right(regexp_replace(p.phone, '\D', '', 'g'), 10),
        'event', p.event_slug, 'amount', p.amount, 'status', p.status,
        'created', (p.created_at AT TIME ZONE 'Asia/Kolkata')::date
      ) ORDER BY p.created_at), '[]'::jsonb)
      FROM payu_payments p
      WHERE right(regexp_replace(p.phone, '\D', '', 'g'), 10) = ANY(v_valid)
    ),
    'marketer_commissions', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'phone', right(regexp_replace(a.phone, '\D', '', 'g'), 10),
        'marketer', m.name, 'amount', ms.amount,
        'accrued', (ms.accrued_at AT TIME ZONE 'Asia/Kolkata')::date
      ) ORDER BY ms.accrued_at), '[]'::jsonb)
      FROM marketer_sales ms
      JOIN applications a ON a.id = ms.application_id
      LEFT JOIN call_marketers m ON m.id = ms.marketer_id
      WHERE right(regexp_replace(a.phone, '\D', '', 'g'), 10) = ANY(v_valid)
    ),
    'creator_commissions', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'phone', right(regexp_replace(a.phone, '\D', '', 'g'), 10),
        'creator', coalesce(af.name, af.handle), 'amount', asl.amount,
        'accrued', (asl.accrued_at AT TIME ZONE 'Asia/Kolkata')::date,
        'paid_out', asl.paid_out_at IS NOT NULL
      ) ORDER BY asl.accrued_at), '[]'::jsonb)
      FROM affiliate_sales asl
      JOIN applications a ON a.id = asl.application_id
      LEFT JOIN affiliates af ON af.id = asl.affiliate_id
      WHERE right(regexp_replace(a.phone, '\D', '', 'g'), 10) = ANY(v_valid)
    ),
    'other_counts', jsonb_build_object(
      'invited_numbers',             (SELECT count(*) FROM invited_numbers t             WHERE right(regexp_replace(t.phone, '\D', '', 'g'), 10) = ANY(v_valid)),
      'invite_payment_submissions',  (SELECT count(*) FROM invite_payment_submissions t  WHERE right(regexp_replace(t.phone, '\D', '', 'g'), 10) = ANY(v_valid)),
      'doubt_submissions',           (SELECT count(*) FROM doubt_submissions t           WHERE right(regexp_replace(t.phone, '\D', '', 'g'), 10) = ANY(v_valid)),
      'plan_doubts',                 (SELECT count(*) FROM plan_doubts t                 WHERE right(regexp_replace(t.phone, '\D', '', 'g'), 10) = ANY(v_valid)),
      'doubt_conversations',         (SELECT count(*) FROM doubt_conversations t         WHERE right(regexp_replace(t.phone, '\D', '', 'g'), 10) = ANY(v_valid)),
      'bill_opens',                  (SELECT count(*) FROM bill_opens t                  WHERE right(regexp_replace(t.phone, '\D', '', 'g'), 10) = ANY(v_valid)),
      'push_subscriptions',          (SELECT count(*) FROM push_subscriptions t          WHERE right(regexp_replace(t.phone, '\D', '', 'g'), 10) = ANY(v_valid)),
      'push_debug_logs',             (SELECT count(*) FROM push_debug_logs t             WHERE right(regexp_replace(t.phone, '\D', '', 'g'), 10) = ANY(v_valid))
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.scan_phone_data(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.scan_phone_data(text[]) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.purge_phone_data(p_phones text[], p_passcode text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_valid   text[];
  v_invalid text[];
  v_days    date[];
  v_counts  jsonb := '{}'::jsonb;
  v_n       integer;
  v_today   date := (now() AT TIME ZONE 'Asia/Kolkata')::date;
  d         date;
  v_resnap  integer := 0;
BEGIN
  IF NOT public.is_admin_strict() AND session_user NOT IN ('postgres', 'supabase_admin') THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  -- The founder-only gate. The other admin shares the login but cannot read
  -- app_secrets (RLS, zero policies) and cannot pass this check.
  IF p_passcode IS NULL
     OR p_passcode IS DISTINCT FROM (SELECT value FROM public.app_secrets WHERE name = 'purge_passcode') THEN
    RAISE EXCEPTION 'Wrong passcode';
  END IF;
  SELECT valid, invalid INTO v_valid, v_invalid FROM public._normalize_phones(p_phones);
  IF array_length(v_valid, 1) IS NULL THEN
    RAISE EXCEPTION 'No valid 10-digit phone numbers given';
  END IF;

  -- Affected snapshot days (IST), collected BEFORE deleting; today's rows are
  -- handled naturally by tomorrow's cron.
  SELECT coalesce(array_agg(DISTINCT dd), '{}'::date[]) INTO v_days FROM (
    SELECT (a.created_at AT TIME ZONE 'Asia/Kolkata')::date AS dd FROM applications a
      WHERE right(regexp_replace(a.phone, '\D', '', 'g'), 10) = ANY(v_valid)
    UNION SELECT (a.recovered_at AT TIME ZONE 'Asia/Kolkata')::date FROM applications a
      WHERE a.recovered_at IS NOT NULL AND right(regexp_replace(a.phone, '\D', '', 'g'), 10) = ANY(v_valid)
    UNION SELECT (a.invite_sent_at AT TIME ZONE 'Asia/Kolkata')::date FROM applications a
      WHERE a.invite_sent_at IS NOT NULL AND right(regexp_replace(a.phone, '\D', '', 'g'), 10) = ANY(v_valid)
    UNION SELECT (a.email_invite_sent_at AT TIME ZONE 'Asia/Kolkata')::date FROM applications a
      WHERE a.email_invite_sent_at IS NOT NULL AND right(regexp_replace(a.phone, '\D', '', 'g'), 10) = ANY(v_valid)
    UNION SELECT (p.created_at AT TIME ZONE 'Asia/Kolkata')::date FROM payu_payments p
      WHERE right(regexp_replace(p.phone, '\D', '', 'g'), 10) = ANY(v_valid)
  ) t WHERE dd IS NOT NULL AND dd < v_today;

  -- FK dependents first (commission rows), then everything else.
  DELETE FROM marketer_sales ms USING applications a
    WHERE ms.application_id = a.id AND right(regexp_replace(a.phone, '\D', '', 'g'), 10) = ANY(v_valid);
  GET DIAGNOSTICS v_n = ROW_COUNT; v_counts := v_counts || jsonb_build_object('marketer_sales', v_n);

  DELETE FROM affiliate_sales asl USING applications a
    WHERE asl.application_id = a.id AND right(regexp_replace(a.phone, '\D', '', 'g'), 10) = ANY(v_valid);
  GET DIAGNOSTICS v_n = ROW_COUNT; v_counts := v_counts || jsonb_build_object('affiliate_sales', v_n);

  DELETE FROM applications t WHERE right(regexp_replace(t.phone, '\D', '', 'g'), 10) = ANY(v_valid);
  GET DIAGNOSTICS v_n = ROW_COUNT; v_counts := v_counts || jsonb_build_object('applications', v_n);

  DELETE FROM payu_payments t WHERE right(regexp_replace(t.phone, '\D', '', 'g'), 10) = ANY(v_valid);
  GET DIAGNOSTICS v_n = ROW_COUNT; v_counts := v_counts || jsonb_build_object('payu_payments', v_n);

  DELETE FROM invited_numbers t WHERE right(regexp_replace(t.phone, '\D', '', 'g'), 10) = ANY(v_valid);
  GET DIAGNOSTICS v_n = ROW_COUNT; v_counts := v_counts || jsonb_build_object('invited_numbers', v_n);

  DELETE FROM invite_payment_submissions t WHERE right(regexp_replace(t.phone, '\D', '', 'g'), 10) = ANY(v_valid);
  GET DIAGNOSTICS v_n = ROW_COUNT; v_counts := v_counts || jsonb_build_object('invite_payment_submissions', v_n);

  DELETE FROM doubt_submissions t WHERE right(regexp_replace(t.phone, '\D', '', 'g'), 10) = ANY(v_valid);
  GET DIAGNOSTICS v_n = ROW_COUNT; v_counts := v_counts || jsonb_build_object('doubt_submissions', v_n);

  DELETE FROM plan_doubts t WHERE right(regexp_replace(t.phone, '\D', '', 'g'), 10) = ANY(v_valid);
  GET DIAGNOSTICS v_n = ROW_COUNT; v_counts := v_counts || jsonb_build_object('plan_doubts', v_n);

  DELETE FROM doubt_conversations t WHERE right(regexp_replace(t.phone, '\D', '', 'g'), 10) = ANY(v_valid);
  GET DIAGNOSTICS v_n = ROW_COUNT; v_counts := v_counts || jsonb_build_object('doubt_conversations', v_n);

  DELETE FROM bill_opens t WHERE right(regexp_replace(t.phone, '\D', '', 'g'), 10) = ANY(v_valid);
  GET DIAGNOSTICS v_n = ROW_COUNT; v_counts := v_counts || jsonb_build_object('bill_opens', v_n);

  DELETE FROM push_subscriptions t WHERE right(regexp_replace(t.phone, '\D', '', 'g'), 10) = ANY(v_valid);
  GET DIAGNOSTICS v_n = ROW_COUNT; v_counts := v_counts || jsonb_build_object('push_subscriptions', v_n);

  DELETE FROM push_debug_logs t WHERE right(regexp_replace(t.phone, '\D', '', 'g'), 10) = ANY(v_valid);
  GET DIAGNOSTICS v_n = ROW_COUNT; v_counts := v_counts || jsonb_build_object('push_debug_logs', v_n);

  -- Permanent metrics forget the test rows too.
  FOREACH d IN ARRAY v_days LOOP
    PERFORM public.snapshot_analytics_daily(d);
    v_resnap := v_resnap + 1;
  END LOOP;

  INSERT INTO admin_audit_log (admin_email, action, target_table, target_id, details)
  VALUES (coalesce(auth.jwt() ->> 'email', session_user::text), 'purge_phone_data', 'multiple',
          array_to_string(v_valid, ','),
          v_counts || jsonb_build_object('resnapshotted_days', v_resnap, 'phones', to_jsonb(v_valid)));

  RETURN v_counts || jsonb_build_object('resnapshotted_days', v_resnap, 'phones', to_jsonb(v_valid));
END;
$$;

REVOKE ALL ON FUNCTION public.purge_phone_data(text[], text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_phone_data(text[], text) TO authenticated, service_role;
