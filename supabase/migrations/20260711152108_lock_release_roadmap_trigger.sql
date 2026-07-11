-- Trigger-only SECURITY DEFINER code must not be callable through the Data API.
REVOKE ALL ON FUNCTION public.sync_release_to_roadmap() FROM PUBLIC, anon, authenticated;
