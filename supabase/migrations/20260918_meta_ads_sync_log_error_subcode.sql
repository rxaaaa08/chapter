-- Record Meta's error SUBCODE on a failed spend sync.
--
-- WHY THIS COLUMN EXISTS
-- Meta reuses one error code for unrelated failures and separates them only by
-- subcode. Code 613 has five documented meanings ("Marketing API Rate Limiting",
-- read 2026-09-18): subcode 1487742 is an ordinary ad-account throttle that
-- clears itself, three more are write-only caps we never hit, and 613 with NO
-- subcode is Meta saying it has detected abnormal traffic from this ad account
-- and has temporarily REDUCED our quota — which needs a human to find the
-- traffic and talk to Meta, not a retry.
--
-- meta-ads-sync already parsed the subcode into its error summary and then
-- dropped it here, because this table had nowhere to put it. So the two 613s
-- were indistinguishable in the only record that survives the run, and the
-- panel banner and the phone alert both said the reassuring thing.
--
-- Deliberately bigint, not text. error_code is text because it also carries
-- synthetic codes ('spend_unaccounted', 'missing_credentials'); a subcode is
-- always a number, and NULL here is meaningful rather than missing — it is
-- exactly the signal that separates the abuse throttle from the ordinary one.
-- Additive and nullable, so every historical row stays valid and no reader
-- breaks.
alter table public.meta_ads_sync_log
  add column if not exists error_subcode bigint;

comment on column public.meta_ads_sync_log.error_subcode is
  'Meta error_subcode on a failed run. NULL means Meta sent none — and for '
  'error_code 613 that absence is itself the diagnosis: an abuse-prevention '
  'quota reduction rather than a passing rate limit. Never treat NULL here as '
  '"no information".';
