CREATE INDEX roadmap_features_release_id_idx
  ON public.roadmap_features (release_id)
  WHERE release_id IS NOT NULL;
