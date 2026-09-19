-- Fix for a real hole in 20260918_meta_ad_creative_tracking_tags.sql, found by
-- the security advisor within a minute of applying it.
--
-- That migration said `revoke all on function ... from anon, authenticated`,
-- which READS as sufficient and is not. Postgres grants EXECUTE on every new
-- function to PUBLIC by default, and revoking from two named roles does not
-- touch the PUBLIC grant those roles inherit through. The ACL showed
-- `=X/postgres` — that leading `=` IS public — and
-- `has_function_privilege('anon', ...)` was TRUE on all of them, including
-- record_ad_creative_tags, a WRITER reachable at /rest/v1/rpc with nothing but
-- the publishable anon key.
--
-- The existing ungated cores were already correct — meta_ad_guardrail_breaches
-- and meta_audience_membership both read
-- `{postgres=X/postgres,service_role=X/postgres}` with no public entry — so this
-- restores the house pattern rather than inventing one. §6 states it as an
-- absolute: for an ungated core "their only protection is the REVOKE on EXECUTE
-- plus a GRANT to service_role alone". That REVOKE has to name PUBLIC or it
-- does nothing at all.
--
-- HOW IT WAS NEARLY MISSED, which is a §9 lesson landing inside the §9 document.
-- The verification run straight after applying queried
-- `information_schema.role_routine_grants` for `grantee in ('anon','authenticated')`
-- and got zero rows. That looked like proof and actually meant "this view lists
-- grants BY ROLE NAME, and PUBLIC is not a role name". An empty result meant the
-- question was wrong, exactly as it did for the Page and Instagram reads on
-- 2026-09-18 (§9, "An empty list from a read tool can mean 'not allowed to see
-- it'"). Use `has_function_privilege()`, which resolves inheritance and cannot
-- be fooled, and confirm with `set local role anon` — both were run afterwards
-- and both now refuse.

revoke all on function public.record_ad_creative_tags(jsonb)         from public;
revoke all on function public.meta_ad_tracking_tag_warnings()        from public;
revoke all on function public.meta_creative_tag_verdict(text, jsonb) from public;
revoke all on function public.get_meta_ad_tracking_tags()            from public;

grant execute on function public.record_ad_creative_tags(jsonb)         to service_role;
grant execute on function public.meta_ad_tracking_tag_warnings()        to service_role;
grant execute on function public.meta_creative_tag_verdict(text, jsonb) to service_role;
-- The panel reader keeps `authenticated`, like every other founder RPC: the
-- is_admin_strict() gate inside it returns NULL to anyone who is not the founder.
grant execute on function public.get_meta_ad_tracking_tags()            to authenticated;

-- The advisor's second finding on this batch: meta_creative_tag_verdict was
-- declared without `set search_path`, unlike the other three. It is `immutable`
-- and touches no tables, so nothing could have been hijacked through it, but a
-- mutable search_path on a dependency of SECURITY DEFINER callers is not
-- something to leave lying around. (Folded into the original file too, so a
-- replay is correct without this one.)
create or replace function public.meta_creative_tag_verdict(
  p_url_tags text,
  p_raw      jsonb
) returns text
language sql
immutable
set search_path = public
as $$
  select case
    when haystack ~ 'utm_content\s*=\s*\{\{\s*ad\.id\s*\}\}' then 'ok'
    when haystack ~ 'utm_content\s*='                        then 'wrong'
    else 'missing'
  end
  from (select coalesce(p_url_tags, '') || ' ' || coalesce(p_raw::text, '') as haystack) h;
$$;

-- CREATE OR REPLACE resets a function's ACL to the default, so the revoke is
-- repeated AFTER it rather than before. Getting that order wrong is how the same
-- hole comes back on the next edit.
revoke all on function public.meta_creative_tag_verdict(text, jsonb) from public, anon, authenticated;
grant execute on function public.meta_creative_tag_verdict(text, jsonb) to service_role;
