-- Weekly DB storage snapshot — lets the admin spot unusual growth before it
-- becomes a problem on the 500 MB Supabase free tier.
--
-- Cron writes a row every Monday 04:00 UTC into storage_reports. The admin
-- panel reads the latest row to show a tiny "DB: X MB / 500 MB" footer.

CREATE TABLE IF NOT EXISTS public.storage_reports (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  taken_at              timestamptz NOT NULL DEFAULT now(),
  total_db_size_bytes   bigint      NOT NULL,
  total_db_size_pretty  text        NOT NULL,
  free_tier_pct         numeric     NOT NULL,
  table_sizes           jsonb       NOT NULL
);

CREATE INDEX IF NOT EXISTS storage_reports_taken_at_idx
  ON public.storage_reports (taken_at DESC);

ALTER TABLE public.storage_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "storage_reports_admin_select" ON public.storage_reports;
CREATE POLICY "storage_reports_admin_select"
  ON public.storage_reports FOR SELECT TO authenticated
  USING (is_admin());

CREATE OR REPLACE FUNCTION public.snapshot_db_storage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total bigint;
  v_tables jsonb;
BEGIN
  SELECT pg_database_size(current_database()) INTO v_total;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'table',      relname,
    'size_bytes', size_bytes,
    'rows',       row_count
  ) ORDER BY size_bytes DESC), '[]'::jsonb)
  INTO v_tables
  FROM (
    SELECT
      c.relname,
      pg_total_relation_size(c.oid) AS size_bytes,
      c.reltuples::bigint AS row_count
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND pg_total_relation_size(c.oid) > 16384
  ) t;

  INSERT INTO public.storage_reports (total_db_size_bytes, total_db_size_pretty, free_tier_pct, table_sizes)
  VALUES (
    v_total,
    pg_size_pretty(v_total),
    ROUND((v_total::numeric / (500 * 1024 * 1024)) * 100, 2),
    v_tables
  );
END;
$$;

REVOKE ALL ON FUNCTION public.snapshot_db_storage() FROM PUBLIC, anon, authenticated;

SELECT cron.unschedule('weekly_storage_snapshot')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'weekly_storage_snapshot');
SELECT cron.schedule('weekly_storage_snapshot', '0 4 * * 1', $$SELECT public.snapshot_db_storage()$$);

SELECT public.snapshot_db_storage();
