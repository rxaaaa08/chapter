-- Daily Manager: a read-only 6pm check-in.
--
-- Why: the founder currently has to remember to look for stuck payments,
-- looming balance-due dates, under-filling events, cold marketers, and
-- traffic drops. This adds a rule engine that runs once a day (pg_cron,
-- 18:00 IST) and re-checks a fixed list of founder-editable thresholds
-- against the business, then sends ONE WhatsApp/web push summarising what
-- needs attention — "2 urgent · 3 watch · 1 win — open the Manager tab".
--
-- Hard guarantee: this feature is READ-ONLY on every business table. The
-- only tables evaluate_manager_rules() ever writes to are the three new
-- manager_* tables below. It never touches applications, payu_payments,
-- events, event_dates, doubt_submissions, etc. — it only reads them.
--
-- Shape, mirroring the Experiments-tab pattern (analytics_daily / release
-- log): a small rules table the founder edits from the Manager tab
-- (thresholds, wording, on/off, cooldown), an alerts table that is the
-- live "inbox" (open/acknowledged/snoozed/dismissed/resolved, one row per
-- distinct condition via a fingerprint), and a briefings table that is one
-- row per day summarising counts — what the push message is built from and
-- what the tab shows by default.
--
-- Each rule re-evaluates every run. A finding that keeps recurring reuses
-- the same open alert (same fingerprint) rather than spamming duplicates;
-- an alert whose condition disappears is auto-resolved; a dismissed/
-- resolved alert stays quiet for `cooldown_days` before it can re-open, so
-- a flapping condition doesn't nag every single day.
--
-- Daily rules run every day; weekly rules only run on Monday (ISO weekday
-- 1) IST, or any day when p_force_all is passed (used for backfilling/
-- testing a rule against a past date). One failing rule (bad params, a
-- missing table, a divide-by-zero) is caught and logged — it never aborts
-- the other rules or the push for that day.

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Tables
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.manager_rules (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type     text UNIQUE NOT NULL,
  label         text NOT NULL,
  description   text,
  params        jsonb NOT NULL DEFAULT '{}',
  severity      text NOT NULL CHECK (severity IN ('urgent','warning','win','info')),
  cadence       text NOT NULL DEFAULT 'daily' CHECK (cadence IN ('daily','weekly')),
  cooldown_days integer NOT NULL DEFAULT 1,
  enabled       boolean NOT NULL DEFAULT true,
  template      text NOT NULL,
  sort_order    integer NOT NULL DEFAULT 100,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.manager_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "manager_rules_admin_select" ON public.manager_rules;
CREATE POLICY "manager_rules_admin_select"
  ON public.manager_rules FOR SELECT TO authenticated
  USING (is_admin_strict());

DROP POLICY IF EXISTS "manager_rules_admin_update" ON public.manager_rules;
CREATE POLICY "manager_rules_admin_update"
  ON public.manager_rules FOR UPDATE TO authenticated
  USING (is_admin_strict()) WITH CHECK (is_admin_strict());
-- No INSERT/DELETE policy on purpose: new rule types arrive via migration,
-- not from the panel, so the founder can only tune params/enabled/wording
-- on the fixed set — never delete the audit trail of what's being checked.

CREATE TABLE IF NOT EXISTS public.manager_alerts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id         uuid REFERENCES public.manager_rules(id) ON DELETE CASCADE,
  rule_type       text NOT NULL,
  fingerprint     text NOT NULL,
  severity        text NOT NULL,
  title           text NOT NULL,
  body            text NOT NULL,
  data            jsonb NOT NULL DEFAULT '{}',
  status          text NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open','acknowledged','snoozed','dismissed','resolved')),
  snoozed_until   timestamptz,
  first_raised_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at    timestamptz NOT NULL DEFAULT now(),
  resolved_at     timestamptz,
  briefing_day    date
);

-- Only one ACTIVE alert per condition at a time; a dismissed/resolved row
-- with the same fingerprint is history, not a duplicate, so it's excluded.
CREATE UNIQUE INDEX IF NOT EXISTS manager_alerts_active_fingerprint_key
  ON public.manager_alerts (fingerprint)
  WHERE status IN ('open','acknowledged','snoozed');

CREATE INDEX IF NOT EXISTS manager_alerts_status_idx ON public.manager_alerts (status);
CREATE INDEX IF NOT EXISTS manager_alerts_briefing_day_idx ON public.manager_alerts (briefing_day);

ALTER TABLE public.manager_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "manager_alerts_admin_select" ON public.manager_alerts;
CREATE POLICY "manager_alerts_admin_select"
  ON public.manager_alerts FOR SELECT TO authenticated
  USING (is_admin_strict());

DROP POLICY IF EXISTS "manager_alerts_admin_update" ON public.manager_alerts;
CREATE POLICY "manager_alerts_admin_update"
  ON public.manager_alerts FOR UPDATE TO authenticated
  USING (is_admin_strict()) WITH CHECK (is_admin_strict());
-- UPDATE is how the Manager tab acks/snoozes/dismisses an alert. Only the
-- evaluate_manager_rules() SECURITY DEFINER function inserts new rows.

CREATE TABLE IF NOT EXISTS public.manager_briefings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day           date UNIQUE NOT NULL,
  urgent_count  integer NOT NULL DEFAULT 0,
  warning_count integer NOT NULL DEFAULT 0,
  win_count     integer NOT NULL DEFAULT 0,
  info_count    integer NOT NULL DEFAULT 0,
  alert_ids     uuid[] NOT NULL DEFAULT '{}',
  push_sent     boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.manager_briefings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "manager_briefings_admin_select" ON public.manager_briefings;
CREATE POLICY "manager_briefings_admin_select"
  ON public.manager_briefings FOR SELECT TO authenticated
  USING (is_admin_strict());

-- Match the project's convention of tightening default table privileges
-- beyond RLS (see 20260711212946_lock_product_todos_privileges.sql).
REVOKE ALL ON TABLE public.manager_rules      FROM anon, authenticated;
REVOKE ALL ON TABLE public.manager_alerts     FROM anon, authenticated;
REVOKE ALL ON TABLE public.manager_briefings  FROM anon, authenticated;
GRANT SELECT, UPDATE ON TABLE public.manager_rules     TO authenticated;
GRANT SELECT, UPDATE ON TABLE public.manager_alerts    TO authenticated;
GRANT SELECT          ON TABLE public.manager_briefings TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. Helper: fill a rule's {placeholder} template from a vars jsonb object.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.manager_fill(tpl text, vars jsonb)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_key  text;
  v_val  text;
  v_out  text := tpl;
BEGIN
  FOR v_key, v_val IN SELECT * FROM jsonb_each_text(COALESCE(vars, '{}'::jsonb)) LOOP
    v_out := replace(v_out, '{' || v_key || '}', COALESCE(v_val, ''));
  END LOOP;
  RETURN v_out;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. evaluate_manager_rules(): the engine. One call = one day's evaluation.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.evaluate_manager_rules(
  p_day       date    DEFAULT (now() AT TIME ZONE 'Asia/Kolkata')::date,
  p_send_push boolean DEFAULT true,
  p_force_all boolean DEFAULT false
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_weekly_day   boolean := (extract(isodow from p_day) = 1) OR p_force_all;
  -- "now" anchor for every rule's time windows: end of p_day, IST. Anchoring
  -- to p_day (not wall-clock now()) keeps a p_force_all backtest for an old
  -- date reproducible instead of silently using today's data.
  v_ist_now         timestamptz := (p_day + 1)::timestamp AT TIME ZONE 'Asia/Kolkata';
  -- Hour-granularity rules (stuck payments, stale doubts) measure "how long
  -- has this sat" and must anchor to the actual run moment, not end-of-day:
  -- at the 6pm run, end-of-day is 6 hours in the future, which would make a
  -- payment created a minute ago look "6h stuck". LEAST() keeps backtests
  -- (p_force_all on a past day) anchored to that day's midnight.
  v_anchor          timestamptz := LEAST((p_day + 1)::timestamp AT TIME ZONE 'Asia/Kolkata', now());
  v_iso_week        text := to_char(p_day, 'IYYY-IW');
  v_rule            manager_rules%ROWTYPE;
  v_evaluated       text[] := '{}';
  v_f               record;
  v_active_id       uuid;
  v_alert_id        uuid;
  v_today_alert_ids uuid[] := '{}';
  v_urgent          integer := 0;
  v_warning         integer := 0;
  v_win             integer := 0;
  v_info            integer := 0;
  v_alert_ids       uuid[];
  v_briefing_id     uuid;
  v_body            text;
  v_parts           text[] := '{}';
BEGIN
  DROP TABLE IF EXISTS mgr_findings;
  CREATE TEMP TABLE mgr_findings (
    rule_id       uuid NOT NULL,
    rule_type     text NOT NULL,
    severity      text NOT NULL,
    cooldown_days integer NOT NULL,
    fingerprint   text NOT NULL,
    title         text NOT NULL,
    body          text NOT NULL,
    data          jsonb NOT NULL DEFAULT '{}'
  ) ON COMMIT DROP;

  -- ── Rule 1: balance_due_chase (daily, urgent) ──────────────────────────────
  -- Guests still on advance whose balance is due today or within days_ahead.
  BEGIN
    SELECT * INTO v_rule FROM manager_rules
     WHERE rule_type = 'balance_due_chase' AND enabled AND (cadence = 'daily' OR v_is_weekly_day);
    IF FOUND THEN
      v_evaluated := array_append(v_evaluated, v_rule.rule_type);
      DECLARE
        v_days_ahead int := COALESCE((v_rule.params->>'days_ahead')::int, 1);
      BEGIN
        -- Path A: events that have per-date rows (the normal case).
        WITH per_date AS (
          SELECT e.slug AS event_slug, e.title AS event_title, ed.start_date,
                 COALESCE(
                   (SELECT (elem->>'date')::date FROM jsonb_array_elements(ed.booking_steps) elem
                     WHERE elem->>'value' = '{balance}' AND COALESCE(elem->>'date','') <> '' LIMIT 1),
                   (SELECT (elem->>'date')::date FROM jsonb_array_elements(e.booking_steps) elem
                     WHERE elem->>'value' = '{balance}' AND COALESCE(elem->>'date','') <> '' LIMIT 1)
                 ) AS due_date
            FROM events e
            JOIN event_dates ed ON ed.event_id = e.id
           WHERE e.is_active AND e.payment_mode = 'split'
        ),
        per_date_due AS (
          SELECT event_slug, event_title, start_date, due_date,
                 (SELECT count(*) FROM applications a
                   WHERE a.event_slug = per_date.event_slug AND a.status = 'advance_paid'
                     AND a.selected_date = per_date.start_date::text
                     AND a.phone NOT LIKE '90000000%') AS n
            FROM per_date
           WHERE due_date IS NOT NULL AND due_date BETWEEN p_day AND p_day + v_days_ahead
        )
        INSERT INTO mgr_findings (rule_id, rule_type, severity, cooldown_days, fingerprint, title, body, data)
        SELECT v_rule.id, v_rule.rule_type, v_rule.severity, v_rule.cooldown_days,
               'balance_due|' || pdd.event_slug || '|' || pdd.start_date::text || '|' || pdd.due_date::text,
               pdd.event_title || ' — balance due',
               manager_fill(v_rule.template, jsonb_build_object(
                 'event', pdd.event_title, 'date', to_char(pdd.start_date,'DD Mon'),
                 'due', to_char(pdd.due_date,'DD Mon'), 'n', pdd.n,
                 'by_marketer', COALESCE(bm.by_marketer, 'Unassigned: ' || pdd.n))),
               jsonb_build_object('event_slug', pdd.event_slug, 'date', pdd.start_date, 'due', pdd.due_date, 'n', pdd.n)
          FROM per_date_due pdd
          LEFT JOIN LATERAL (
            SELECT string_agg(COALESCE(cm.name,'Unassigned') || ': ' || t.cnt, ', ' ORDER BY COALESCE(cm.name,'Unassigned')) AS by_marketer
              FROM (
                SELECT assigned_marketer_id, count(*) cnt
                  FROM applications a2
                 WHERE a2.event_slug = pdd.event_slug AND a2.status = 'advance_paid'
                   AND a2.selected_date = pdd.start_date::text AND a2.phone NOT LIKE '90000000%'
                 GROUP BY assigned_marketer_id
              ) t
              LEFT JOIN call_marketers cm ON cm.id = t.assigned_marketer_id
          ) bm ON true
         WHERE pdd.n > 0;

        -- Path B: events with NO event_dates rows at all — fall back entirely
        -- to the event-level due date and an event-wide advance_paid count.
        WITH ev_nodates AS (
          SELECT e.slug AS event_slug, e.title AS event_title,
                 (SELECT (elem->>'date')::date FROM jsonb_array_elements(e.booking_steps) elem
                   WHERE elem->>'value' = '{balance}' AND COALESCE(elem->>'date','') <> '' LIMIT 1) AS due_date
            FROM events e
           WHERE e.is_active AND e.payment_mode = 'split'
             AND NOT EXISTS (SELECT 1 FROM event_dates ed WHERE ed.event_id = e.id)
        ),
        ev_nodates_due AS (
          SELECT event_slug, event_title, due_date,
                 (SELECT count(*) FROM applications a
                   WHERE a.event_slug = ev_nodates.event_slug AND a.status = 'advance_paid'
                     AND a.phone NOT LIKE '90000000%') AS n
            FROM ev_nodates
           WHERE due_date IS NOT NULL AND due_date BETWEEN p_day AND p_day + v_days_ahead
        )
        INSERT INTO mgr_findings (rule_id, rule_type, severity, cooldown_days, fingerprint, title, body, data)
        SELECT v_rule.id, v_rule.rule_type, v_rule.severity, v_rule.cooldown_days,
               'balance_due|' || event_slug || '|all-dates|' || due_date::text,
               event_title || ' — balance due',
               manager_fill(v_rule.template, jsonb_build_object(
                 'event', event_title, 'date', 'all dates', 'due', to_char(due_date,'DD Mon'),
                 'n', n, 'by_marketer', n || ' total')),
               jsonb_build_object('event_slug', event_slug, 'due', due_date, 'n', n)
          FROM ev_nodates_due
         WHERE n > 0;
      END;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'manager rule balance_due_chase failed: %', SQLERRM;
  END;

  -- ── Rule 2: stuck_payments (daily, urgent) ─────────────────────────────────
  BEGIN
    SELECT * INTO v_rule FROM manager_rules
     WHERE rule_type = 'stuck_payments' AND enabled AND (cadence = 'daily' OR v_is_weekly_day);
    IF FOUND THEN
      v_evaluated := array_append(v_evaluated, v_rule.rule_type);
      DECLARE
        v_min_hours    int := COALESCE((v_rule.params->>'min_hours')::int, 6);
        v_window_hours int := COALESCE((v_rule.params->>'window_hours')::int, 72);
        v_n            int;
      BEGIN
        SELECT count(*) INTO v_n FROM payu_payments
         WHERE lower(status) = 'pending'
           AND created_at BETWEEN v_anchor - make_interval(hours => v_window_hours)
                              AND v_anchor - make_interval(hours => v_min_hours)
           AND phone NOT LIKE '90000000%';
        IF v_n > 0 THEN
          INSERT INTO mgr_findings (rule_id, rule_type, severity, cooldown_days, fingerprint, title, body, data)
          VALUES (v_rule.id, v_rule.rule_type, v_rule.severity, v_rule.cooldown_days,
                  'stuck|' || p_day::text, 'Stuck PayU payments',
                  manager_fill(v_rule.template, jsonb_build_object('n', v_n, 'min_hours', v_min_hours)),
                  jsonb_build_object('n', v_n));
        END IF;
      END;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'manager rule stuck_payments failed: %', SQLERRM;
  END;

  -- ── Rule 3: capacity_pressure (daily, urgent) ──────────────────────────────
  BEGIN
    SELECT * INTO v_rule FROM manager_rules
     WHERE rule_type = 'capacity_pressure' AND enabled AND (cadence = 'daily' OR v_is_weekly_day);
    IF FOUND THEN
      v_evaluated := array_append(v_evaluated, v_rule.rule_type);
      DECLARE
        v_full_pct  numeric := COALESCE((v_rule.params->>'full_pct')::numeric, 90);
        v_low_days  int     := COALESCE((v_rule.params->>'low_days')::int, 7);
        v_low_pct   numeric := COALESCE((v_rule.params->>'low_pct')::numeric, 50);
        v_min_spots int     := COALESCE((v_rule.params->>'min_spots')::int, 5);
      BEGIN
        WITH cap AS (
          SELECT e.slug AS event_slug, e.title AS event_title, ed.start_date, e.invite_spots,
                 (SELECT count(*) FROM applications a
                   WHERE a.event_slug = e.slug AND a.status IN ('advance_paid','fully_paid')
                     AND a.selected_date = ed.start_date::text AND a.phone NOT LIKE '90000000%') AS reserved
            FROM events e
            JOIN event_dates ed ON ed.event_id = e.id
           WHERE e.is_active AND e.invite_spots >= v_min_spots AND ed.start_date >= p_day
        )
        INSERT INTO mgr_findings (rule_id, rule_type, severity, cooldown_days, fingerprint, title, body, data)
        SELECT v_rule.id, v_rule.rule_type, v_rule.severity, v_rule.cooldown_days,
               'cap90|' || event_slug || '|' || start_date::text,
               event_title || ' — almost full',
               manager_fill(v_rule.template, jsonb_build_object(
                 'event', event_title, 'date', to_char(start_date,'DD Mon'), 'msg', 'almost full',
                 'reserved', reserved, 'spots', invite_spots)),
               jsonb_build_object('event_slug', event_slug, 'date', start_date, 'reserved', reserved, 'spots', invite_spots)
          FROM cap
         WHERE invite_spots > 0 AND reserved * 100.0 / invite_spots >= v_full_pct
        UNION ALL
        SELECT v_rule.id, v_rule.rule_type, v_rule.severity, v_rule.cooldown_days,
               'lowfill|' || event_slug || '|' || start_date::text,
               event_title || ' — low fill risk',
               manager_fill(v_rule.template, jsonb_build_object(
                 'event', event_title, 'date', to_char(start_date,'DD Mon'), 'msg', 'low fill risk',
                 'reserved', reserved, 'spots', invite_spots)),
               jsonb_build_object('event_slug', event_slug, 'date', start_date, 'reserved', reserved, 'spots', invite_spots)
          FROM cap
         WHERE start_date <= p_day + v_low_days AND invite_spots > 0 AND reserved * 100.0 / invite_spots < v_low_pct;
      END;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'manager rule capacity_pressure failed: %', SQLERRM;
  END;

  -- ── Rule 4: doubts_stale (daily, warning) ──────────────────────────────────
  BEGIN
    SELECT * INTO v_rule FROM manager_rules
     WHERE rule_type = 'doubts_stale' AND enabled AND (cadence = 'daily' OR v_is_weekly_day);
    IF FOUND THEN
      v_evaluated := array_append(v_evaluated, v_rule.rule_type);
      DECLARE
        v_hours       int := COALESCE((v_rule.params->>'hours')::int, 24);
        v_window_days int := COALESCE((v_rule.params->>'window_days')::int, 7);
        v_n           int;
      BEGIN
        -- (a) open-event doubts with no follow-up sent and no resulting application.
        WITH stale AS (
          SELECT ds.*, cm.name AS marketer_name
            FROM doubt_submissions ds
            LEFT JOIN call_marketers cm ON cm.id = ds.assigned_marketer_id
           WHERE ds.phone NOT LIKE '90000000%'
             AND ds.submitted_at >= v_anchor - make_interval(days => v_window_days)
             AND ds.submitted_at <= v_anchor - make_interval(hours => v_hours)
             AND ds.open_details_sent_at IS NULL
             AND NOT EXISTS (
               SELECT 1 FROM applications a
               LEFT JOIN events ev ON ev.slug = a.event_slug
               WHERE right(regexp_replace(a.phone,'\D','','g'),10) = right(regexp_replace(ds.phone,'\D','','g'),10)
                 AND (a.event_slug = lower(ds.event_id) OR ev.title = ds.event_title)
                 AND a.created_at > ds.submitted_at
             )
        ),
        grp AS (
          SELECT COALESCE(marketer_name, 'Unassigned') AS marketer, count(*) AS n
            FROM stale
           GROUP BY COALESCE(marketer_name, 'Unassigned')
        )
        INSERT INTO mgr_findings (rule_id, rule_type, severity, cooldown_days, fingerprint, title, body, data)
        SELECT v_rule.id, v_rule.rule_type, v_rule.severity, v_rule.cooldown_days,
               'doubts|' || marketer || '|' || p_day::text,
               'Stale doubts — ' || marketer,
               manager_fill(v_rule.template, jsonb_build_object(
                 'n', n, 'kind', 'open-event doubt(s)', 'hours', v_hours,
                 'detail', 'Assigned to ' || marketer || '.')),
               jsonb_build_object('marketer', marketer, 'n', n)
          FROM grp;

        -- (b) invite-flow plan-chat questions left open.
        SELECT count(*) INTO v_n FROM plan_doubts
         WHERE phone NOT LIKE '90000000%'
           AND created_at >= v_anchor - make_interval(days => v_window_days)
           AND created_at <= v_anchor - make_interval(hours => v_hours)
           AND (status IS DISTINCT FROM 'closed');
        IF v_n > 0 THEN
          INSERT INTO mgr_findings (rule_id, rule_type, severity, cooldown_days, fingerprint, title, body, data)
          VALUES (v_rule.id, v_rule.rule_type, v_rule.severity, v_rule.cooldown_days,
                  'plan_doubts|' || p_day::text, 'Unanswered plan-chat questions',
                  manager_fill(v_rule.template, jsonb_build_object(
                    'n', v_n, 'kind', 'plan-chat question(s)', 'hours', v_hours,
                    'detail', 'No marketer assignment — check the Plan chat inbox.')),
                  jsonb_build_object('n', v_n));
        END IF;
      END;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'manager rule doubts_stale failed: %', SQLERRM;
  END;

  -- ── Rule 5: traffic_anomaly (daily, warning) ───────────────────────────────
  BEGIN
    SELECT * INTO v_rule FROM manager_rules
     WHERE rule_type = 'traffic_anomaly' AND enabled AND (cadence = 'daily' OR v_is_weekly_day);
    IF FOUND THEN
      v_evaluated := array_append(v_evaluated, v_rule.rule_type);
      DECLARE
        v_drop_pct     numeric := COALESCE((v_rule.params->>'drop_pct')::numeric, 30);
        v_min_visitors numeric := COALESCE((v_rule.params->>'min_visitors')::numeric, 30);
        v_yesterday    numeric;
        v_baseline     numeric;
      BEGIN
        SELECT COALESCE((SELECT value FROM analytics_daily
                           WHERE day = p_day - 1 AND metric = 'visitors' AND event_id IS NULL), 0),
               (SELECT avg(value) FROM analytics_daily
                 WHERE metric = 'visitors' AND event_id IS NULL
                   AND day IN (p_day - 8, p_day - 15, p_day - 22, p_day - 29))
          INTO v_yesterday, v_baseline;

        IF v_baseline IS NOT NULL AND v_baseline >= v_min_visitors
           AND v_yesterday < v_baseline * (1 - v_drop_pct / 100.0) THEN
          INSERT INTO mgr_findings (rule_id, rule_type, severity, cooldown_days, fingerprint, title, body, data)
          VALUES (v_rule.id, v_rule.rule_type, v_rule.severity, v_rule.cooldown_days,
                  'traffic|' || (p_day - 1)::text, 'Traffic drop',
                  manager_fill(v_rule.template, jsonb_build_object(
                    'yesterday', v_yesterday, 'baseline', round(v_baseline),
                    'drop_pct_actual', round((1 - v_yesterday / v_baseline) * 100))),
                  jsonb_build_object('yesterday', v_yesterday, 'baseline', v_baseline));
        END IF;
      END;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'manager rule traffic_anomaly failed: %', SQLERRM;
  END;

  -- ── Rule 6: marketer_conversion_low (weekly, warning) ──────────────────────
  BEGIN
    SELECT * INTO v_rule FROM manager_rules
     WHERE rule_type = 'marketer_conversion_low' AND enabled AND (cadence = 'daily' OR v_is_weekly_day);
    IF FOUND THEN
      v_evaluated := array_append(v_evaluated, v_rule.rule_type);
      DECLARE
        v_threshold_pct numeric := COALESCE((v_rule.params->>'threshold_pct')::numeric, 5);
        v_window_days   int     := COALESCE((v_rule.params->>'window_days')::int, 30);
        v_min_assigned  int     := COALESCE((v_rule.params->>'min_assigned')::int, 10);
      BEGIN
        WITH stats AS (
          SELECT cm.id AS marketer_id, cm.name,
                 count(a.*) FILTER (WHERE a.created_at >= v_ist_now - make_interval(days => v_window_days)) AS assigned,
                 count(a.*) FILTER (WHERE a.created_at >= v_ist_now - make_interval(days => v_window_days)
                                      AND a.status = 'fully_paid') AS converted
            FROM call_marketers cm
            LEFT JOIN applications a ON a.assigned_marketer_id = cm.id AND a.phone NOT LIKE '90000000%'
           WHERE cm.active
           GROUP BY cm.id, cm.name
        )
        INSERT INTO mgr_findings (rule_id, rule_type, severity, cooldown_days, fingerprint, title, body, data)
        SELECT v_rule.id, v_rule.rule_type, v_rule.severity, v_rule.cooldown_days,
               'mconv|' || marketer_id::text || '|' || v_iso_week,
               name || ' — low conversion',
               manager_fill(v_rule.template, jsonb_build_object(
                 'marketer', name, 'rate', round(converted * 100.0 / NULLIF(assigned,0), 1),
                 'converted', converted, 'assigned', assigned,
                 'window_days', v_window_days, 'threshold_pct', v_threshold_pct)),
               jsonb_build_object('marketer_id', marketer_id, 'assigned', assigned, 'converted', converted)
          FROM stats
         WHERE assigned >= v_min_assigned AND converted * 100.0 / assigned < v_threshold_pct;
      END;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'manager rule marketer_conversion_low failed: %', SQLERRM;
  END;

  -- ── Rule 7: creator_underperforming (weekly, warning) ──────────────────────
  BEGIN
    SELECT * INTO v_rule FROM manager_rules
     WHERE rule_type = 'creator_underperforming' AND enabled AND (cadence = 'daily' OR v_is_weekly_day);
    IF FOUND THEN
      v_evaluated := array_append(v_evaluated, v_rule.rule_type);
      DECLARE
        v_window_days int := COALESCE((v_rule.params->>'window_days')::int, 30);
        v_min_clicks  int := COALESCE((v_rule.params->>'min_clicks')::int, 30);
      BEGIN
        WITH stats AS (
          SELECT af.id, af.handle,
                 (SELECT count(DISTINCT c.session_id) FROM affiliate_clicks c
                   WHERE c.affiliate_id = af.id
                     AND c.created_at >= v_ist_now - make_interval(days => v_window_days)) AS clicks,
                 (SELECT count(*) FROM affiliate_sales s
                   WHERE s.affiliate_id = af.id
                     AND s.accrued_at >= v_ist_now - make_interval(days => v_window_days)) AS sales
            FROM affiliates af
           WHERE af.active
        )
        INSERT INTO mgr_findings (rule_id, rule_type, severity, cooldown_days, fingerprint, title, body, data)
        SELECT v_rule.id, v_rule.rule_type, v_rule.severity, v_rule.cooldown_days,
               'creator|' || handle || '|' || v_iso_week,
               '@' || handle || ' — no sales',
               manager_fill(v_rule.template, jsonb_build_object('handle', handle, 'clicks', clicks, 'window_days', v_window_days)),
               jsonb_build_object('affiliate_id', id, 'clicks', clicks)
          FROM stats
         WHERE clicks >= v_min_clicks AND sales = 0;
      END;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'manager rule creator_underperforming failed: %', SQLERRM;
  END;

  -- ── Rule 8: pricing_conversion_low (weekly, warning) ───────────────────────
  BEGIN
    SELECT * INTO v_rule FROM manager_rules
     WHERE rule_type = 'pricing_conversion_low' AND enabled AND (cadence = 'daily' OR v_is_weekly_day);
    IF FOUND THEN
      v_evaluated := array_append(v_evaluated, v_rule.rule_type);
      DECLARE
        v_threshold_pct numeric := COALESCE((v_rule.params->>'threshold_pct')::numeric, 20);
        v_window_days   int     := COALESCE((v_rule.params->>'window_days')::int, 14);
        v_min_sessions  numeric := COALESCE((v_rule.params->>'min_sessions')::numeric, 50);
      BEGIN
        WITH stats AS (
          SELECT event_id,
                 sum(value) FILTER (WHERE metric = 'reached_pricing') AS r,
                 sum(value) FILTER (WHERE metric = 'converted_any')   AS c
            FROM analytics_daily
           WHERE event_id IS NOT NULL AND day >= p_day - v_window_days AND day < p_day
           GROUP BY event_id
        )
        INSERT INTO mgr_findings (rule_id, rule_type, severity, cooldown_days, fingerprint, title, body, data)
        SELECT v_rule.id, v_rule.rule_type, v_rule.severity, v_rule.cooldown_days,
               'pricing|' || stats.event_id || '|' || v_iso_week,
               COALESCE(e.title, stats.event_id) || ' — low pricing conversion',
               manager_fill(v_rule.template, jsonb_build_object(
                 'event', COALESCE(e.title, stats.event_id), 'rate', round(c * 100.0 / NULLIF(r,0), 1),
                 'sessions', r, 'window_days', v_window_days, 'threshold_pct', v_threshold_pct)),
               jsonb_build_object('event_id', stats.event_id, 'reached_pricing', r, 'converted_any', c)
          FROM stats
          LEFT JOIN events e ON e.id::text = stats.event_id
         WHERE r >= v_min_sessions AND c * 100.0 / r < v_threshold_pct;
      END;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'manager rule pricing_conversion_low failed: %', SQLERRM;
  END;

  -- ── Rule 9: form_completion_moved (weekly, info) ───────────────────────────
  BEGIN
    SELECT * INTO v_rule FROM manager_rules
     WHERE rule_type = 'form_completion_moved' AND enabled AND (cadence = 'daily' OR v_is_weekly_day);
    IF FOUND THEN
      v_evaluated := array_append(v_evaluated, v_rule.rule_type);
      DECLARE
        v_min_points numeric := COALESCE((v_rule.params->>'min_points')::numeric, 8);
        v_min_started int    := COALESCE((v_rule.params->>'min_started')::int, 30);
        v_s1 numeric; v_sub1 numeric; v_s0 numeric; v_sub0 numeric;
        v_rate0 numeric; v_rate1 numeric; v_delta numeric;
        v_rel_title text; v_rel_day date;
      BEGIN
        SELECT COALESCE(sum(value) FILTER (WHERE metric = 'application_started'   AND day >= p_day - 7  AND day < p_day), 0),
               COALESCE(sum(value) FILTER (WHERE metric = 'application_submitted' AND day >= p_day - 7  AND day < p_day), 0),
               COALESCE(sum(value) FILTER (WHERE metric = 'application_started'   AND day >= p_day - 14 AND day < p_day - 7), 0),
               COALESCE(sum(value) FILTER (WHERE metric = 'application_submitted' AND day >= p_day - 14 AND day < p_day - 7), 0)
          INTO v_s1, v_sub1, v_s0, v_sub0
          FROM analytics_daily;

        IF v_s1 >= v_min_started AND v_s0 >= v_min_started THEN
          v_rate1 := v_sub1 * 100.0 / v_s1;
          v_rate0 := v_sub0 * 100.0 / v_s0;
          v_delta := v_rate1 - v_rate0;
          IF abs(v_delta) >= v_min_points THEN
            SELECT title, released_at INTO v_rel_title, v_rel_day
              FROM feature_releases
             WHERE released_at BETWEEN p_day - 14 AND p_day
             ORDER BY released_at DESC LIMIT 1;

            INSERT INTO mgr_findings (rule_id, rule_type, severity, cooldown_days, fingerprint, title, body, data)
            VALUES (v_rule.id, v_rule.rule_type, v_rule.severity, v_rule.cooldown_days,
                    'formcomp|' || v_iso_week,
                    'Form completion ' || CASE WHEN v_delta > 0 THEN 'moved up' ELSE 'moved down' END,
                    manager_fill(v_rule.template, jsonb_build_object(
                      'direction', CASE WHEN v_delta > 0 THEN 'rose' ELSE 'fell' END,
                      'delta_pts', round(abs(v_delta), 1),
                      'sub0_rate', round(v_rate0, 1), 'sub1_rate', round(v_rate1, 1),
                      'release_note', CASE WHEN v_rel_title IS NOT NULL
                                           THEN ' Nearest release: "' || v_rel_title || '" (' || to_char(v_rel_day,'DD Mon') || ').'
                                           ELSE '' END)),
                    jsonb_build_object('delta_pts', v_delta, 'sub0_rate', v_rate0, 'sub1_rate', v_rate1));
          END IF;
        END IF;
      END;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'manager rule form_completion_moved failed: %', SQLERRM;
  END;

  -- ── Rule 10: abandonment_spike (weekly, warning) ───────────────────────────
  BEGIN
    SELECT * INTO v_rule FROM manager_rules
     WHERE rule_type = 'abandonment_spike' AND enabled AND (cadence = 'daily' OR v_is_weekly_day);
    IF FOUND THEN
      v_evaluated := array_append(v_evaluated, v_rule.rule_type);
      DECLARE
        v_factor numeric := COALESCE((v_rule.params->>'factor')::numeric, 1.5);
        v_min_n  int     := COALESCE((v_rule.params->>'min_n')::int, 10);
        v_tot_now int; v_ab_now int; v_tot_prev int; v_ab_prev int;
        v_rate_now numeric; v_rate_prev numeric;
      BEGIN
        SELECT count(*) FILTER (WHERE created_at >= v_ist_now - interval '7 days'),
               count(*) FILTER (WHERE created_at >= v_ist_now - interval '7 days' AND cart_abandoned),
               count(*) FILTER (WHERE created_at >= v_ist_now - interval '14 days' AND created_at < v_ist_now - interval '7 days'),
               count(*) FILTER (WHERE created_at >= v_ist_now - interval '14 days' AND created_at < v_ist_now - interval '7 days' AND cart_abandoned)
          INTO v_tot_now, v_ab_now, v_tot_prev, v_ab_prev
          FROM applications WHERE phone NOT LIKE '90000000%';

        IF v_tot_now >= v_min_n AND v_tot_prev >= v_min_n THEN
          v_rate_now  := v_ab_now  * 100.0 / v_tot_now;
          v_rate_prev := v_ab_prev * 100.0 / v_tot_prev;
          -- Guard against a zero baseline: with rate_prev = 0 any positive
          -- rate_now would multiply out to "infinite" growth, which isn't a
          -- meaningful spike signal.
          IF v_rate_prev > 0 AND v_rate_now > v_rate_prev * v_factor THEN
            INSERT INTO mgr_findings (rule_id, rule_type, severity, cooldown_days, fingerprint, title, body, data)
            VALUES (v_rule.id, v_rule.rule_type, v_rule.severity, v_rule.cooldown_days,
                    'abandon|' || v_iso_week, 'Cart abandonment spike',
                    manager_fill(v_rule.template, jsonb_build_object(
                      'rate_now', round(v_rate_now,1), 'rate_prev', round(v_rate_prev,1), 'factor', v_factor)),
                    jsonb_build_object('rate_now', v_rate_now, 'rate_prev', v_rate_prev));
          END IF;
        END IF;
      END;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'manager rule abandonment_spike failed: %', SQLERRM;
  END;

  -- ── Rule 11: weekly_wins (weekly, win) ─────────────────────────────────────
  BEGIN
    SELECT * INTO v_rule FROM manager_rules
     WHERE rule_type = 'weekly_wins' AND enabled AND (cadence = 'daily' OR v_is_weekly_day);
    IF FOUND THEN
      v_evaluated := array_append(v_evaluated, v_rule.rule_type);
      DECLARE
        v_top_handle text; v_top_n int; v_recovered_n int;
      BEGIN
        -- (a) top creator by sale count this week.
        SELECT af.handle, count(*) INTO v_top_handle, v_top_n
          FROM affiliate_sales s
          JOIN affiliates af ON af.id = s.affiliate_id
         WHERE s.accrued_at >= v_ist_now - interval '7 days' AND s.accrued_at < v_ist_now
         GROUP BY af.handle
         ORDER BY count(*) DESC
         LIMIT 1;

        IF v_top_n > 0 THEN
          INSERT INTO mgr_findings (rule_id, rule_type, severity, cooldown_days, fingerprint, title, body, data)
          VALUES (v_rule.id, v_rule.rule_type, v_rule.severity, v_rule.cooldown_days,
                  'win_creator|' || v_iso_week, 'Top creator this week',
                  manager_fill(v_rule.template, jsonb_build_object(
                    'msg', '@' || v_top_handle || ' drove ' || v_top_n || ' sale(s) this week — nice work.')),
                  jsonb_build_object('handle', v_top_handle, 'n', v_top_n));
        END IF;

        -- (b) any future date that just sold out.
        INSERT INTO mgr_findings (rule_id, rule_type, severity, cooldown_days, fingerprint, title, body, data)
        SELECT v_rule.id, v_rule.rule_type, v_rule.severity, v_rule.cooldown_days,
               'win_soldout|' || slug || '|' || start_date::text,
               title || ' — sold out',
               manager_fill(v_rule.template, jsonb_build_object(
                 'msg', title || ' (' || to_char(start_date,'DD Mon') || ') is sold out — ' || reserved || '/' || invite_spots || ' paid.')),
               jsonb_build_object('event_slug', slug, 'date', start_date)
          FROM (
            SELECT e.slug, e.title, ed.start_date, e.invite_spots,
                   (SELECT count(*) FROM applications a
                     WHERE a.event_slug = e.slug AND a.status IN ('advance_paid','fully_paid')
                       AND a.selected_date = ed.start_date::text AND a.phone NOT LIKE '90000000%') AS reserved
              FROM events e
              JOIN event_dates ed ON ed.event_id = e.id
             WHERE e.is_active AND ed.start_date >= p_day AND e.invite_spots > 0
          ) cap
         WHERE reserved >= invite_spots;

        -- (c) recovered carts this week.
        SELECT count(*) INTO v_recovered_n FROM applications
         WHERE recovered_at >= v_ist_now - interval '7 days' AND recovered_at < v_ist_now
           AND phone NOT LIKE '90000000%';
        IF v_recovered_n > 0 THEN
          INSERT INTO mgr_findings (rule_id, rule_type, severity, cooldown_days, fingerprint, title, body, data)
          VALUES (v_rule.id, v_rule.rule_type, v_rule.severity, v_rule.cooldown_days,
                  'win_recovered|' || v_iso_week, 'Recovered carts this week',
                  manager_fill(v_rule.template, jsonb_build_object(
                    'msg', v_recovered_n || ' guest(s) came back and paid after abandoning — recovery is working.')),
                  jsonb_build_object('n', v_recovered_n));
        END IF;
      END;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'manager rule weekly_wins failed: %', SQLERRM;
  END;

  -- ═══════════════════════════════════════════════════════════════════════
  -- Upsert findings into manager_alerts.
  -- ═══════════════════════════════════════════════════════════════════════
  FOR v_f IN SELECT * FROM mgr_findings LOOP
    SELECT id INTO v_active_id FROM manager_alerts
     WHERE fingerprint = v_f.fingerprint AND status IN ('open','acknowledged','snoozed')
     LIMIT 1;

    IF FOUND THEN
      UPDATE manager_alerts
         SET last_seen_at  = now(),
             title         = v_f.title,
             body          = v_f.body,
             data          = v_f.data,
             status        = CASE WHEN status = 'snoozed' AND snoozed_until < now() THEN 'open' ELSE status END,
             snoozed_until = CASE WHEN status = 'snoozed' AND snoozed_until < now() THEN NULL ELSE snoozed_until END
       WHERE id = v_active_id
       RETURNING id INTO v_alert_id;
      v_today_alert_ids := array_append(v_today_alert_ids, v_alert_id);
    ELSE
      -- Cooldown: a recently dismissed/resolved alert with this fingerprint
      -- stays quiet for rule.cooldown_days before it can re-open.
      IF EXISTS (
        SELECT 1 FROM manager_alerts
         WHERE fingerprint = v_f.fingerprint
           AND last_seen_at > now() - (v_f.cooldown_days || ' days')::interval
      ) THEN
        CONTINUE;
      END IF;

      INSERT INTO manager_alerts (rule_id, rule_type, fingerprint, severity, title, body, data, briefing_day)
      VALUES (v_f.rule_id, v_f.rule_type, v_f.fingerprint, v_f.severity, v_f.title, v_f.body, v_f.data, p_day)
      RETURNING id INTO v_alert_id;
      v_today_alert_ids := array_append(v_today_alert_ids, v_alert_id);
    END IF;
  END LOOP;

  -- ═══════════════════════════════════════════════════════════════════════
  -- Auto-resolve: for every rule evaluated this run, any ACTIVE alert of
  -- that rule_type whose fingerprint didn't reappear in this run's findings
  -- means the condition is gone.
  -- ═══════════════════════════════════════════════════════════════════════
  UPDATE manager_alerts al
     SET status = 'resolved', resolved_at = now()
   WHERE al.status IN ('open','acknowledged','snoozed')
     AND al.rule_type = ANY(v_evaluated)
     AND NOT EXISTS (
       SELECT 1 FROM mgr_findings f
        WHERE f.rule_type = al.rule_type AND f.fingerprint = al.fingerprint
     );

  -- ═══════════════════════════════════════════════════════════════════════
  -- Briefing: counts + ids scoped to the alerts touched/raised this run.
  -- ═══════════════════════════════════════════════════════════════════════
  SELECT count(*) FILTER (WHERE severity = 'urgent'  AND status IN ('open','acknowledged')),
         count(*) FILTER (WHERE severity = 'warning' AND status IN ('open','acknowledged')),
         count(*) FILTER (WHERE severity = 'win'     AND status IN ('open','acknowledged')),
         count(*) FILTER (WHERE severity = 'info'    AND status IN ('open','acknowledged'))
    INTO v_urgent, v_warning, v_win, v_info
    FROM manager_alerts
   WHERE id = ANY(v_today_alert_ids);

  SELECT array_agg(id) INTO v_alert_ids
    FROM (
      SELECT id FROM manager_alerts
       WHERE id = ANY(v_today_alert_ids)
       ORDER BY last_seen_at DESC
       LIMIT 50
    ) capped;

  INSERT INTO manager_briefings (day, urgent_count, warning_count, win_count, info_count, alert_ids)
  VALUES (p_day, v_urgent, v_warning, v_win, v_info, COALESCE(v_alert_ids, '{}'))
  ON CONFLICT (day) DO UPDATE
    SET urgent_count  = EXCLUDED.urgent_count,
        warning_count = EXCLUDED.warning_count,
        win_count     = EXCLUDED.win_count,
        info_count    = EXCLUDED.info_count,
        alert_ids     = EXCLUDED.alert_ids
  RETURNING id INTO v_briefing_id;

  -- ═══════════════════════════════════════════════════════════════════════
  -- One push a day, summarising urgent/watch/win counts.
  -- ═══════════════════════════════════════════════════════════════════════
  IF p_send_push THEN
    v_parts := '{}';
    IF v_urgent  > 0 THEN v_parts := array_append(v_parts, v_urgent  || ' urgent'); END IF;
    IF v_warning > 0 THEN v_parts := array_append(v_parts, v_warning || ' watch'); END IF;
    IF v_win     > 0 THEN v_parts := array_append(v_parts, v_win || ' win' || CASE WHEN v_win <> 1 THEN 's' ELSE '' END); END IF;

    IF v_urgent = 0 AND v_warning = 0 AND v_win = 0 AND v_info = 0 THEN
      v_body := 'All clear — nothing needs you today.';
    ELSIF array_length(v_parts, 1) IS NULL THEN
      -- Only info-severity findings today: nothing urgent, but not "all clear".
      v_body := 'A few notes today — open the Manager tab.';
    ELSE
      v_body := array_to_string(v_parts, ' · ') || ' — open the Manager tab';
    END IF;

    PERFORM notify_admin_push(jsonb_build_object(
      'type', 'manager_brief',
      'record', jsonb_build_object('title', '🗞️ Daily brief — 6pm check-in', 'body', v_body)
    ));

    UPDATE manager_briefings SET push_sent = true WHERE id = v_briefing_id;
  END IF;

  RETURN (SELECT count(*) FROM mgr_findings);
END;
$$;

REVOKE ALL ON FUNCTION public.evaluate_manager_rules(date, boolean, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.evaluate_manager_rules(date, boolean, boolean) TO service_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. Seed rules. ON CONFLICT DO NOTHING so a re-run never clobbers a
--    founder edit made from the Manager tab.
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO public.manager_rules (rule_type, label, description, params, severity, cadence, cooldown_days, template, sort_order) VALUES
  ('balance_due_chase',
   'Balance due chasing',
   'Flags guests still on advance whose balance payment is due today or within a few days.',
   '{"days_ahead": 1}'::jsonb, 'urgent', 'daily', 1,
   '{n} guests still on advance for {event} ({date}) — balance due {due}. By marketer: {by_marketer}',
   10),

  ('stuck_payments',
   'Stuck PayU payments',
   'Flags PayU payment attempts that have sat in "pending" for hours instead of resolving to success or failure.',
   '{"min_hours": 6, "window_hours": 72}'::jsonb, 'urgent', 'daily', 1,
   '{n} payment attempt(s) have been stuck ''pending'' for over {min_hours}h — check the PayU dashboard.',
   20),

  ('capacity_pressure',
   'Capacity pressure',
   'Flags upcoming dates that are almost full (raise the price / stop pushing ads) or at risk of low fill (needs a push).',
   '{"full_pct": 90, "low_days": 7, "low_pct": 50, "min_spots": 5}'::jsonb, 'urgent', 'daily', 2,
   '{event} on {date}: {msg} ({reserved}/{spots} paid)',
   30),

  ('doubts_stale',
   'Stale doubts & questions',
   'Flags open-event doubts and plan-chat questions that have gone unanswered for too long.',
   '{"hours": 24, "window_days": 7}'::jsonb, 'warning', 'daily', 1,
   '{n} {kind} sitting unanswered for over {hours}h. {detail}',
   40),

  ('traffic_anomaly',
   'Traffic drop',
   'Flags a day where site visitors dropped sharply below the recent same-weekday average.',
   '{"drop_pct": 30, "min_visitors": 30}'::jsonb, 'warning', 'daily', 1,
   'Yesterday''s visitors ({yesterday}) were {drop_pct_actual}% below the recent average ({baseline}) — check for outages or a lost traffic source.',
   50),

  ('marketer_conversion_low',
   'Marketer conversion low',
   'Weekly check: flags a marketer whose assigned-to-fully-paid conversion rate is below the floor.',
   '{"threshold_pct": 5, "window_days": 30, "min_assigned": 10}'::jsonb, 'warning', 'weekly', 7,
   '{marketer}''s conversion is {rate}% ({converted}/{assigned}) over the last {window_days} days — below the {threshold_pct}% floor.',
   60),

  ('creator_underperforming',
   'Creator underperforming',
   'Weekly check: flags a creator affiliate sending real clicks but zero sales.',
   '{"window_days": 30, "min_clicks": 30}'::jsonb, 'warning', 'weekly', 7,
   '@{handle} sent {clicks} click(s) in the last {window_days} days with zero sales — worth a nudge or review.',
   70),

  ('pricing_conversion_low',
   'Pricing page conversion low',
   'Weekly check: flags an event whose pricing-page-to-conversion rate is below the floor, with enough traffic to be meaningful.',
   '{"threshold_pct": 20, "window_days": 14, "min_sessions": 50}'::jsonb, 'warning', 'weekly', 7,
   '{event} converts {rate}% of pricing-page visitors ({sessions} sessions over {window_days}d) — below the {threshold_pct}% floor.',
   80),

  ('form_completion_moved',
   'Form completion moved',
   'Weekly check: flags a meaningful swing (up or down) in site-wide application form completion rate week over week.',
   '{"min_points": 8, "min_started": 30}'::jsonb, 'info', 'weekly', 7,
   'Form completion {direction} {delta_pts} points this week ({sub0_rate}% -> {sub1_rate}%).{release_note}',
   90),

  ('abandonment_spike',
   'Cart abandonment spike',
   'Weekly check: flags a sharp week-over-week jump in the cart-abandonment rate.',
   '{"factor": 1.5, "min_n": 10}'::jsonb, 'warning', 'weekly', 7,
   'Cart abandonment jumped to {rate_now}% this week vs {rate_prev}% last week ({factor}x+ threshold).',
   100),

  ('weekly_wins',
   'Weekly wins',
   'Weekly good-news roundup: top creator, any sold-out dates, and recovered carts.',
   '{}'::jsonb, 'win', 'weekly', 7,
   '{msg}',
   110)
ON CONFLICT (rule_type) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. Cron: 12:30 UTC = 18:00 IST — the founder's 6pm check-in, not a
--    morning briefing.
-- ═══════════════════════════════════════════════════════════════════════════

SELECT cron.unschedule('daily_manager_brief')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily_manager_brief');
SELECT cron.schedule('daily_manager_brief', '30 12 * * *', $$SELECT public.evaluate_manager_rules()$$);
