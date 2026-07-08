-- Test-data purger (Experiments tab).
--
-- The founder makes test bookings — including real successful PayU payments —
-- and they pollute every metric: apps_created, payments_success, marketer
-- conversion, creator leaderboards, the profit forecast. This adds a two-step
-- tool: scan_phone_data() reports everything a phone number touches (nothing
-- deleted), purge_phone_data() deletes it all and re-runs the daily snapshots
-- for the affected days so the permanent analytics_daily history forgets the
-- test rows too.
--
-- Blast radius (every phone-linked table + FK dependents):
--   applications, payu_payments, marketer_sales + affiliate_sales (via
--   application_id), invited_numbers, invite_payment_submissions,
--   doubt_submissions, plan_doubts, doubt_conversations, bill_opens,
--   push_subscriptions, push_debug_logs.
-- NOT cleaned: flow_analytics (session-based, no phone) and anything already
-- sent through AiSensy/Brevo (their logs live on their platforms).
--
-- Safety: admin-strict only (or a direct DB session for maintenance); one
-- phone at a time, normalized to last-10 digits like the rest of the system;
-- every purge writes an admin_audit_log row with per-table counts. The UI adds
-- its own retype-the-number confirmation on top.

CREATE OR REPLACE FUNCTION public.scan_phone_data(p_phone text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
BEGIN
  IF NOT public.is_admin_strict() AND session_user NOT IN ('postgres', 'supabase_admin') THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  IF length(v_phone) < 10 THEN
    RAISE EXCEPTION 'Enter a full 10-digit phone number';
  END IF;

  RETURN jsonb_build_object(
    'phone', v_phone,
    'applications', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'event', a.event_slug, 'name', a.name, 'status', a.status,
        'created', (a.created_at AT TIME ZONE 'Asia/Kolkata')::date
      ) ORDER BY a.created_at), '[]'::jsonb)
      FROM applications a
      WHERE right(regexp_replace(a.phone, '\D', '', 'g'), 10) = v_phone
    ),
    'payments', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'event', p.event_slug, 'amount', p.amount, 'status', p.status,
        'created', (p.created_at AT TIME ZONE 'Asia/Kolkata')::date
      ) ORDER BY p.created_at), '[]'::jsonb)
      FROM payu_payments p
      WHERE right(regexp_replace(p.phone, '\D', '', 'g'), 10) = v_phone
    ),
    'marketer_commissions', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'marketer', m.name, 'amount', ms.amount,
        'accrued', (ms.accrued_at AT TIME ZONE 'Asia/Kolkata')::date
      ) ORDER BY ms.accrued_at), '[]'::jsonb)
      FROM marketer_sales ms
      JOIN applications a ON a.id = ms.application_id
      LEFT JOIN call_marketers m ON m.id = ms.marketer_id
      WHERE right(regexp_replace(a.phone, '\D', '', 'g'), 10) = v_phone
    ),
    'creator_commissions', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'creator', coalesce(af.name, af.handle), 'amount', asl.amount,
        'accrued', (asl.accrued_at AT TIME ZONE 'Asia/Kolkata')::date,
        'paid_out', asl.paid_out_at IS NOT NULL
      ) ORDER BY asl.accrued_at), '[]'::jsonb)
      FROM affiliate_sales asl
      JOIN applications a ON a.id = asl.application_id
      LEFT JOIN affiliates af ON af.id = asl.affiliate_id
      WHERE right(regexp_replace(a.phone, '\D', '', 'g'), 10) = v_phone
    ),
    'other_counts', jsonb_build_object(
      'invited_numbers',             (SELECT count(*) FROM invited_numbers t             WHERE right(regexp_replace(t.phone, '\D', '', 'g'), 10) = v_phone),
      'invite_payment_submissions',  (SELECT count(*) FROM invite_payment_submissions t  WHERE right(regexp_replace(t.phone, '\D', '', 'g'), 10) = v_phone),
      'doubt_submissions',           (SELECT count(*) FROM doubt_submissions t           WHERE right(regexp_replace(t.phone, '\D', '', 'g'), 10) = v_phone),
      'plan_doubts',                 (SELECT count(*) FROM plan_doubts t                 WHERE right(regexp_replace(t.phone, '\D', '', 'g'), 10) = v_phone),
      'doubt_conversations',         (SELECT count(*) FROM doubt_conversations t         WHERE right(regexp_replace(t.phone, '\D', '', 'g'), 10) = v_phone),
      'bill_opens',                  (SELECT count(*) FROM bill_opens t                  WHERE right(regexp_replace(t.phone, '\D', '', 'g'), 10) = v_phone),
      'push_subscriptions',          (SELECT count(*) FROM push_subscriptions t          WHERE right(regexp_replace(t.phone, '\D', '', 'g'), 10) = v_phone),
      'push_debug_logs',             (SELECT count(*) FROM push_debug_logs t             WHERE right(regexp_replace(t.phone, '\D', '', 'g'), 10) = v_phone)
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.scan_phone_data(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.scan_phone_data(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.purge_phone_data(p_phone text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone   text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
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
  IF length(v_phone) < 10 THEN
    RAISE EXCEPTION 'Enter a full 10-digit phone number';
  END IF;

  -- Affected snapshot days, collected BEFORE deleting (IST, matching
  -- snapshot_analytics_daily's bucketing). Only fully-snapshotted past days
  -- need a re-run; today's rows vanish before tomorrow's cron snapshots today.
  SELECT coalesce(array_agg(DISTINCT dd), '{}'::date[]) INTO v_days FROM (
    SELECT (a.created_at AT TIME ZONE 'Asia/Kolkata')::date AS dd FROM applications a
      WHERE right(regexp_replace(a.phone, '\D', '', 'g'), 10) = v_phone
    UNION SELECT (a.recovered_at AT TIME ZONE 'Asia/Kolkata')::date FROM applications a
      WHERE a.recovered_at IS NOT NULL AND right(regexp_replace(a.phone, '\D', '', 'g'), 10) = v_phone
    UNION SELECT (a.invite_sent_at AT TIME ZONE 'Asia/Kolkata')::date FROM applications a
      WHERE a.invite_sent_at IS NOT NULL AND right(regexp_replace(a.phone, '\D', '', 'g'), 10) = v_phone
    UNION SELECT (a.email_invite_sent_at AT TIME ZONE 'Asia/Kolkata')::date FROM applications a
      WHERE a.email_invite_sent_at IS NOT NULL AND right(regexp_replace(a.phone, '\D', '', 'g'), 10) = v_phone
    UNION SELECT (p.created_at AT TIME ZONE 'Asia/Kolkata')::date FROM payu_payments p
      WHERE right(regexp_replace(p.phone, '\D', '', 'g'), 10) = v_phone
  ) t WHERE dd IS NOT NULL AND dd < v_today;

  -- FK dependents first (commission rows), then everything else.
  DELETE FROM marketer_sales ms USING applications a
    WHERE ms.application_id = a.id AND right(regexp_replace(a.phone, '\D', '', 'g'), 10) = v_phone;
  GET DIAGNOSTICS v_n = ROW_COUNT; v_counts := v_counts || jsonb_build_object('marketer_sales', v_n);

  DELETE FROM affiliate_sales asl USING applications a
    WHERE asl.application_id = a.id AND right(regexp_replace(a.phone, '\D', '', 'g'), 10) = v_phone;
  GET DIAGNOSTICS v_n = ROW_COUNT; v_counts := v_counts || jsonb_build_object('affiliate_sales', v_n);

  DELETE FROM applications t WHERE right(regexp_replace(t.phone, '\D', '', 'g'), 10) = v_phone;
  GET DIAGNOSTICS v_n = ROW_COUNT; v_counts := v_counts || jsonb_build_object('applications', v_n);

  DELETE FROM payu_payments t WHERE right(regexp_replace(t.phone, '\D', '', 'g'), 10) = v_phone;
  GET DIAGNOSTICS v_n = ROW_COUNT; v_counts := v_counts || jsonb_build_object('payu_payments', v_n);

  DELETE FROM invited_numbers t WHERE right(regexp_replace(t.phone, '\D', '', 'g'), 10) = v_phone;
  GET DIAGNOSTICS v_n = ROW_COUNT; v_counts := v_counts || jsonb_build_object('invited_numbers', v_n);

  DELETE FROM invite_payment_submissions t WHERE right(regexp_replace(t.phone, '\D', '', 'g'), 10) = v_phone;
  GET DIAGNOSTICS v_n = ROW_COUNT; v_counts := v_counts || jsonb_build_object('invite_payment_submissions', v_n);

  DELETE FROM doubt_submissions t WHERE right(regexp_replace(t.phone, '\D', '', 'g'), 10) = v_phone;
  GET DIAGNOSTICS v_n = ROW_COUNT; v_counts := v_counts || jsonb_build_object('doubt_submissions', v_n);

  DELETE FROM plan_doubts t WHERE right(regexp_replace(t.phone, '\D', '', 'g'), 10) = v_phone;
  GET DIAGNOSTICS v_n = ROW_COUNT; v_counts := v_counts || jsonb_build_object('plan_doubts', v_n);

  DELETE FROM doubt_conversations t WHERE right(regexp_replace(t.phone, '\D', '', 'g'), 10) = v_phone;
  GET DIAGNOSTICS v_n = ROW_COUNT; v_counts := v_counts || jsonb_build_object('doubt_conversations', v_n);

  DELETE FROM bill_opens t WHERE right(regexp_replace(t.phone, '\D', '', 'g'), 10) = v_phone;
  GET DIAGNOSTICS v_n = ROW_COUNT; v_counts := v_counts || jsonb_build_object('bill_opens', v_n);

  DELETE FROM push_subscriptions t WHERE right(regexp_replace(t.phone, '\D', '', 'g'), 10) = v_phone;
  GET DIAGNOSTICS v_n = ROW_COUNT; v_counts := v_counts || jsonb_build_object('push_subscriptions', v_n);

  DELETE FROM push_debug_logs t WHERE right(regexp_replace(t.phone, '\D', '', 'g'), 10) = v_phone;
  GET DIAGNOSTICS v_n = ROW_COUNT; v_counts := v_counts || jsonb_build_object('push_debug_logs', v_n);

  -- Permanent metrics forget the test rows too.
  FOREACH d IN ARRAY v_days LOOP
    PERFORM public.snapshot_analytics_daily(d);
    v_resnap := v_resnap + 1;
  END LOOP;

  INSERT INTO admin_audit_log (admin_email, action, target_table, target_id, details)
  VALUES (coalesce(auth.jwt() ->> 'email', session_user::text), 'purge_phone_data', 'multiple', v_phone,
          v_counts || jsonb_build_object('resnapshotted_days', v_resnap));

  RETURN v_counts || jsonb_build_object('resnapshotted_days', v_resnap);
END;
$$;

REVOKE ALL ON FUNCTION public.purge_phone_data(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_phone_data(text) TO authenticated, service_role;
