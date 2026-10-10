-- Label our custom audiences for Meta (cloud audit OPP-9, 2026-09-26)
-- =============================================================================
-- Meta added `audience_labels` on 2026-04-30 (Out-of-Cycle Change Index) to tell
-- it what a list IS — e.g. CUSTOMERS, HIGH_VALUE_CUSTOMERS, ENGAGED_USERS — "so
-- they can be found and used" more effectively. No measured benefit is claimed.
--
-- CREATE-ONLY. The changelog names only `POST /{ad-account-id}/customaudiences`
-- as affected, so the three lists created on 2026-09-07 cannot be relabelled
-- through a documented route; they keep no label. What changes is every list
-- created FROM NOW ON — meta-audience-sync reads this column when it creates.
--
-- The label per list (chosen by the building session; change the row to change it):
--   customers_all_paid  → CUSTOMERS            "Your existing customers."
--   customers_completed → HIGH_VALUE_CUSTOMERS  people who paid in full and came;
--                                               the lookalike seed (§13 item 5)
--   leads_unpaid        → ENGAGED_USERS        "showed interest but are not customers"
-- Allowed values (Customer File Custom Audiences guide): QUALIFIED_LEADS,
-- DISQUALIFIED_LEADS, APP_USERS, TRIAL_USERS, ENGAGED_USERS,
-- HIGH_VALUE_CUSTOMERS, LOW_VALUE_CUSTOMERS, AT_RISK, DISENGAGED, CUSTOMERS.
--
-- Website audiences (§19) are made by hand in Ads Manager / the Meta Ads MCP, not
-- by code; their label goes in the §19 creation recipe (handoff §31), and the
-- registry column below records what was used.

alter table public.meta_audiences
  add column if not exists audience_label text
    check (audience_label is null or audience_label in (
      'QUALIFIED_LEADS','DISQUALIFIED_LEADS','APP_USERS','TRIAL_USERS','ENGAGED_USERS',
      'HIGH_VALUE_CUSTOMERS','LOW_VALUE_CUSTOMERS','AT_RISK','DISENGAGED','CUSTOMERS'));

alter table public.meta_website_audiences
  add column if not exists audience_label text
    check (audience_label is null or audience_label in (
      'QUALIFIED_LEADS','DISQUALIFIED_LEADS','APP_USERS','TRIAL_USERS','ENGAGED_USERS',
      'HIGH_VALUE_CUSTOMERS','LOW_VALUE_CUSTOMERS','AT_RISK','DISENGAGED','CUSTOMERS'));

comment on column public.meta_audiences.audience_label is
  'Meta audience_labels value sent when meta-audience-sync CREATES this list. '
  'Create-only at Meta: changing it does not relabel an existing audience.';
comment on column public.meta_website_audiences.audience_label is
  'The audience_labels value to use when this web audience is created by hand (§19 recipe).';

update public.meta_audiences set audience_label = case key
    when 'customers_all_paid'  then 'CUSTOMERS'
    when 'customers_completed' then 'HIGH_VALUE_CUSTOMERS'
    when 'leads_unpaid'        then 'ENGAGED_USERS'
  end
 where key in ('customers_all_paid','customers_completed','leads_unpaid')
   and audience_label is null;

-- Web tiers built to re-show ads to people who looked but did not buy.
update public.meta_website_audiences set audience_label = 'ENGAGED_USERS'
 where key in ('price_seen','dates_opened','plan_viewed','top_engaged')
   and audience_label is null;
