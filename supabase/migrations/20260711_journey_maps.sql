-- journey_maps: interactive user-journey maps shown on the admin "Map" tab.
--
-- One row per map. nodes/edges are the React Flow graph as JSONB — the client
-- (src/JourneyMap.tsx) owns the shape; the DB just persists it. The generated
-- baselines live in src/journeyMapSeeds.ts and are inserted by the client the
-- first time the tab is opened on an empty table, so this migration is
-- schema-only and safe to re-run.
--
-- Access: admin-panel users only (both 'admin' and 'ops' roles), via the same
-- is_admin() helper that guards the other admin-locked tables. Anon gets
-- nothing — the maps describe internal operations.

CREATE TABLE IF NOT EXISTS public.journey_maps (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  nodes      jsonb NOT NULL DEFAULT '[]'::jsonb,
  edges      jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.journey_maps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS journey_maps_admin_select ON public.journey_maps;
CREATE POLICY journey_maps_admin_select ON public.journey_maps
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS journey_maps_admin_insert ON public.journey_maps;
CREATE POLICY journey_maps_admin_insert ON public.journey_maps
  FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS journey_maps_admin_update ON public.journey_maps;
CREATE POLICY journey_maps_admin_update ON public.journey_maps
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS journey_maps_admin_delete ON public.journey_maps;
CREATE POLICY journey_maps_admin_delete ON public.journey_maps
  FOR DELETE USING (is_admin());
