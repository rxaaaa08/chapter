-- Cloud audit hygiene note (2026-09-26): lead_sends_failing looked at
-- applications created in [now-24h, now-1h). The watchdog runs once a day at
-- 09:11 IST, so each run's window ends at 08:11 and the next one starts at 09:11
-- — applications created 08:11-09:11 IST were never counted by any run. The
-- lower bound is now 25 h, so consecutive windows overlap by an hour instead of
-- leaving one out. (The main lead_server 144 h match already covered those rows;
-- this closes the gap in the faster failing-sends signal.)
--
-- Patched on the LIVE definition with an asserted anchor, because
-- supabase/migrations/ lags the live database (see 20260926_meta_audit_sql_fixes.sql).
do $patch$
declare v_def text; v_new text;
begin
  v_def := pg_get_functiondef('public.meta_signal_evaluate(text, jsonb, timestamptz)'::regprocedure);
  v_new := replace(v_def,
    $o$      and a.created_at >= p_now - interval '24 hours'$o$,
    $n$      -- 25 h, not 24: the daily run's windows must overlap, not leave an
      -- hour (08:11-09:11 IST) that no run ever counts. Cloud audit, 2026-09-26.
      and a.created_at >= p_now - interval '25 hours'$n$);
  if v_new = v_def then raise exception 'meta_signal_evaluate: anchor not found — live definition drifted'; end if;
  execute v_new;
end
$patch$;
