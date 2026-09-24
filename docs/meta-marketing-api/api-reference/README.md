# API Reference — Meta Ads & Commerce (offline copy)

Saved 2026-09-19 from the **Resources ▸ API Reference** section of Meta's Ads and Commerce docs sidebar (e.g. <https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account>). **469 pages.** Folders 01–24 follow that sidebar exactly (378 pages); folder 25 holds 90 more reference pages that the sidebar pages link to but the sidebar doesn't list. The first line of each file names the page it came from.

The Resources section's other two links, **Changelog** and **Error codes**, are Marketing API pages; they're in `~/Downloads/Marketing API Docs` (folders `13 Version Changelogs` and `12 Troubleshooting`).

## Notes on this copy

- **How each page was obtained** (tag after each link): no tag = Meta's own markdown export · *converted* = Meta's export errors for this page, so it was converted from the web page · *old docs site* = the page hasn't moved to Meta's new docs site yet, so it came from the older site · *captured in Chrome* = Meta only builds this page inside a browser.
- **Escaped characters were decoded.** Meta's markdown export escapes quotes, apostrophes and `<br>` once too often (e.g. `fbq(&#039;track&#039;)`). Each file was decoded once, which makes it match Meta's own "View as Markdown" view character for character.
- **Some pages have empty "Reading"/"Creating" sections.** That is how Meta's pages are (checked against the web pages), not a download problem.
- **Dead links on Meta's side (38):** reference pages linked from other pages that exist on neither Meta site — e.g. `ads-insights`, `ad-sets`, `adgroup/insights`. Listed at the bottom. The Insights fields are in `02 Ad Account/45 Insights.md` and `01 Ad/09 Insights.md`.

## Index — Resources ▸ API Reference

* [Marketing API Reference (overview page)](00%20Marketing%20API%20Reference%20%28overview%20page%29.md) *(converted)*
* **Ad/**
  * [Overview](01%20Ad/01%20Overview.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup)
  * [Ad Studies](01%20Ad/02%20Ad%20Studies.md) — [original](https://developers.facebook.com/documentation/ads-commerce/graph-api/reference/adgroup/ad_studies)
  * [Adcreatives](01%20Ad/03%20Adcreatives.md) — [original](https://developers.facebook.com/documentation/ads-commerce/graph-api/reference/adgroup/adcreatives)
  * [Addrafts](01%20Ad/04%20Addrafts.md) — [original](https://developers.facebook.com/documentation/ads-commerce/graph-api/reference/adgroup/addrafts)
  * [Adlabels](01%20Ad/05%20Adlabels.md) — [original](https://developers.facebook.com/documentation/ads-commerce/graph-api/reference/adgroup/adlabels)
  * [Adrules Governed](01%20Ad/06%20Adrules%20Governed.md) — [original](https://developers.facebook.com/documentation/ads-commerce/graph-api/reference/adgroup/adrules_governed)
  * [Copies](01%20Ad/07%20Copies.md) — [original](https://developers.facebook.com/documentation/ads-commerce/graph-api/reference/adgroup/copies)
  * [Facebook Feedback](01%20Ad/08%20Facebook%20Feedback.md) — [original](https://developers.facebook.com/documentation/ads-commerce/graph-api/reference/adgroup/facebook_feedback)
  * [Insights](01%20Ad/09%20Insights.md) — [original](https://developers.facebook.com/documentation/ads-commerce/graph-api/reference/adgroup/insights)
  * [Leads](01%20Ad/10%20Leads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/graph-api/reference/adgroup/leads)
  * [Previews](01%20Ad/11%20Previews.md) — [original](https://developers.facebook.com/documentation/ads-commerce/graph-api/reference/adgroup/previews)
  * [Targetingsentencelines](01%20Ad/12%20Targetingsentencelines.md) — [original](https://developers.facebook.com/documentation/ads-commerce/graph-api/reference/adgroup/targetingsentencelines)
* **Ad Account/**
  * [Overview](02%20Ad%20Account/01%20Overview.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account)
  * [Aaa Compatible Ad Objects](02%20Ad%20Account/02%20Aaa%20Compatible%20Ad%20Objects.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/aaa_compatible_ad_objects)
  * [Account Controls](02%20Ad%20Account/03%20Account%20Controls.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/account_controls)
  * [Active Adrules](02%20Ad%20Account/04%20Active%20Adrules.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/active_adrules)
  * [Activities](02%20Ad%20Account/05%20Activities.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/activities)
  * [Ad Column Sizes](02%20Ad%20Account/06%20Ad%20Column%20Sizes.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/ad_column_sizes)
  * [Ad Custom Derived Metrics](02%20Ad%20Account/07%20Ad%20Custom%20Derived%20Metrics.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/ad_custom_derived_metrics)
  * [Ad Place Page Sets](02%20Ad%20Account/08%20Ad%20Place%20Page%20Sets.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/ad_place_page_sets)
  * [Ad Place Page Sets Async](02%20Ad%20Account/09%20Ad%20Place%20Page%20Sets%20Async.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/ad_place_page_sets_async)
  * [Adcreatives](02%20Ad%20Account/10%20Adcreatives.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/adcreatives)
  * [Addrafts](02%20Ad%20Account/11%20Addrafts.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/addrafts)
  * [Adimages](02%20Ad%20Account/12%20Adimages.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/adimages)
  * [Adlabels](02%20Ad%20Account/13%20Adlabels.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/adlabels)
  * [Adplayables](02%20Ad%20Account/14%20Adplayables.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/adplayables)
  * [Adrules Count By Type](02%20Ad%20Account/15%20Adrules%20Count%20By%20Type.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/adrules_count_by_type)
  * [Adrules Library](02%20Ad%20Account/16%20Adrules%20Library.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/adrules_library)
  * [Ads](02%20Ad%20Account/17%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/ads)
  * [Ads Reporting Mmm Reports](02%20Ad%20Account/18%20Ads%20Reporting%20Mmm%20Reports.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/ads_reporting_mmm_reports)
  * [Ads Reporting Mmm Schedulers](02%20Ad%20Account/19%20Ads%20Reporting%20Mmm%20Schedulers.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/ads_reporting_mmm_schedulers)
  * [Adsets](02%20Ad%20Account/20%20Adsets.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/adsets)
  * [Adspixels](02%20Ad%20Account/21%20Adspixels.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/adspixels)
  * [Advideos](02%20Ad%20Account/22%20Advideos.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/advideos)
  * [Agencies](02%20Ad%20Account/23%20Agencies.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/agencies)
  * [Applications](02%20Ad%20Account/24%20Applications.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/applications)
  * [Applied Publisher Block Lists](02%20Ad%20Account/25%20Applied%20Publisher%20Block%20Lists.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/applied_publisher_block_lists)
  * [Assigned Users](02%20Ad%20Account/26%20Assigned%20Users.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/assigned_users)
  * [Async Batch Requests](02%20Ad%20Account/27%20Async%20Batch%20Requests.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/async_batch_requests)
  * [Asyncadcopies](02%20Ad%20Account/28%20Asyncadcopies.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/asyncadcopies)
  * [Asyncadcreatives](02%20Ad%20Account/29%20Asyncadcreatives.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/asyncadcreatives)
  * [Asyncadrequestsets](02%20Ad%20Account/30%20Asyncadrequestsets.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/asyncadrequestsets)
  * [Broadtargetingcategories](02%20Ad%20Account/31%20Broadtargetingcategories.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/broadtargetingcategories)
  * [Campaign Attribution Options](02%20Ad%20Account/32%20Campaign%20Attribution%20Options.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/campaign_attribution_options)
  * [Campaigns](02%20Ad%20Account/33%20Campaigns.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/campaigns)
  * [Collaborative Ads Partner Businesses](02%20Ad%20Account/34%20Collaborative%20Ads%20Partner%20Businesses.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/collaborative_ads_partner_businesses)
  * [Connected Instagram Accounts](02%20Ad%20Account/35%20Connected%20Instagram%20Accounts.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/connected_instagram_accounts)
  * [Customaudiences](02%20Ad%20Account/36%20Customaudiences.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/customaudiences)
  * [Customaudiencestos](02%20Ad%20Account/37%20Customaudiencestos.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/customaudiencestos)
  * [Customconversions](02%20Ad%20Account/38%20Customconversions.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/customconversions)
  * [Delivery Estimate](02%20Ad%20Account/39%20Delivery%20Estimate.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/delivery_estimate)
  * [Deprecatedtargetingadsets](02%20Ad%20Account/40%20Deprecatedtargetingadsets.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/deprecatedtargetingadsets)
  * [Direct Debits](02%20Ad%20Account/41%20Direct%20Debits.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/direct_debits)
  * [Dsa Recommendations](02%20Ad%20Account/42%20Dsa%20Recommendations.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/dsa_recommendations)
  * [Generatepreviews](02%20Ad%20Account/43%20Generatepreviews.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/generatepreviews)
  * [Impacting Ad Studies](02%20Ad%20Account/44%20Impacting%20Ad%20Studies.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/impacting_ad_studies)
  * [Insights](02%20Ad%20Account/45%20Insights.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/insights)
  * [Instagram Accounts](02%20Ad%20Account/46%20Instagram%20Accounts.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/instagram_accounts)
  * [Locationclusters](02%20Ad%20Account/47%20Locationclusters.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/locationclusters)
  * [Mcmeconversions](02%20Ad%20Account/48%20Mcmeconversions.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/mcmeconversions)
  * [Message Delivery Estimate](02%20Ad%20Account/49%20Message%20Delivery%20Estimate.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/message_delivery_estimate)
  * [Minimum Budgets](02%20Ad%20Account/50%20Minimum%20Budgets.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/minimum_budgets)
  * [Naming Templates](02%20Ad%20Account/51%20Naming%20Templates.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/naming_templates)
  * [Offline Conversion Data Sets](02%20Ad%20Account/52%20Offline%20Conversion%20Data%20Sets.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/offline_conversion_data_sets)
  * [Optimization Goals Aemv2 Eligibility](02%20Ad%20Account/53%20Optimization%20Goals%20Aemv2%20Eligibility.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/optimization_goals_aemv2_eligibility)
  * [Prepay Fund](02%20Ad%20Account/54%20Prepay%20Fund.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/prepay_fund)
  * [Product Audiences](02%20Ad%20Account/55%20Product%20Audiences.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/product_audiences)
  * [Promote Pages](02%20Ad%20Account/56%20Promote%20Pages.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/promote_pages)
  * [Proposals](02%20Ad%20Account/57%20Proposals.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/proposals)
  * [Publisher Block Lists](02%20Ad%20Account/58%20Publisher%20Block%20Lists.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/publisher_block_lists)
  * [Reachestimate](02%20Ad%20Account/59%20Reachestimate.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/reachestimate)
  * [Reachfrequencypredictions](02%20Ad%20Account/60%20Reachfrequencypredictions.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/reachfrequencypredictions)
  * [Report Specs](02%20Ad%20Account/61%20Report%20Specs.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/report_specs)
  * [Reporting](02%20Ad%20Account/62%20Reporting.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/reporting)
  * [Saved Audiences](02%20Ad%20Account/63%20Saved%20Audiences.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/saved_audiences)
  * [Site Links](02%20Ad%20Account/64%20Site%20Links.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/site_links)
  * [Smart Suggested Ads](02%20Ad%20Account/65%20Smart%20Suggested%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/smart_suggested_ads)
  * [Start Your Day Widgets](02%20Ad%20Account/66%20Start%20Your%20Day%20Widgets.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/start_your_day_widgets)
  * [Subscribed Apps](02%20Ad%20Account/67%20Subscribed%20Apps.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/subscribed_apps)
  * [Suggested Ads](02%20Ad%20Account/68%20Suggested%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/suggested_ads)
  * [Targetingbrowse](02%20Ad%20Account/69%20Targetingbrowse.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/targetingbrowse)
  * [Targetingsearch](02%20Ad%20Account/70%20Targetingsearch.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/targetingsearch)
  * [Targetingsuggestions](02%20Ad%20Account/71%20Targetingsuggestions.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/targetingsuggestions)
  * [Targetingvalidation](02%20Ad%20Account/72%20Targetingvalidation.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/targetingvalidation)
  * [Tax Info](02%20Ad%20Account/73%20Tax%20Info.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/tax_info)
  * [Tracking](02%20Ad%20Account/74%20Tracking.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/tracking)
  * [Urls For Asset Extraction](02%20Ad%20Account/75%20Urls%20For%20Asset%20Extraction.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/urls_for_asset_extraction)
  * [Users](02%20Ad%20Account/76%20Users.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/users)
  * [Website Creative Assets](02%20Ad%20Account/77%20Website%20Creative%20Assets.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/website_creative_assets)
  * [Website Creative Info](02%20Ad%20Account/78%20Website%20Creative%20Info.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/website_creative_info)
  * [Youth Ads Advertiser](02%20Ad%20Account/79%20Youth%20Ads%20Advertiser.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/youth_ads_advertiser)
* [Ad Account User](03%20Ad%20Account%20User.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account-user)
* [Ad Activity](04%20Ad%20Activity.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-activity)
* **Ad Creative/**
  * [Overview](05%20Ad%20Creative/01%20Overview.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative)
  * [Adlabels](05%20Ad%20Creative/02%20Adlabels.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative/adlabels)
  * [Creative Insights](05%20Ad%20Creative/03%20Creative%20Insights.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative/creative_insights)
  * [Previews](05%20Ad%20Creative/04%20Previews.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative/previews)
* **Ad Campaign/**
  * [Overview](06%20Ad%20Campaign/01%20Overview.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group)
  * [Ad Studies](06%20Ad%20Campaign/02%20Ad%20Studies.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group/ad_studies)
  * [Addrafts](06%20Ad%20Campaign/03%20Addrafts.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group/addrafts)
  * [Adlabels](06%20Ad%20Campaign/04%20Adlabels.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group/adlabels)
  * [Adrules Governed](06%20Ad%20Campaign/05%20Adrules%20Governed.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group/adrules_governed)
  * [Ads](06%20Ad%20Campaign/06%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group/ads)
  * [Adsets](06%20Ad%20Campaign/07%20Adsets.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group/adsets)
  * [Budget Schedules](06%20Ad%20Campaign/08%20Budget%20Schedules.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group/budget_schedules)
  * [Copies](06%20Ad%20Campaign/09%20Copies.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group/copies)
  * [Insights](06%20Ad%20Campaign/10%20Insights.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group/insights)
  * [Video Groups](06%20Ad%20Campaign/11%20Video%20Groups.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group/video_groups)
* [Ad Image](07%20Ad%20Image.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-image)
* **Ad Labels/**
  * [Overview](08%20Ad%20Labels/01%20Overview.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-label)
  * [Adcreatives](08%20Ad%20Labels/02%20Adcreatives.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-label/adcreatives)
  * [Ads](08%20Ad%20Labels/03%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-label/ads)
  * [Adsets](08%20Ad%20Labels/04%20Adsets.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-label/adsets)
  * [Campaigns](08%20Ad%20Labels/05%20Campaigns.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-label/campaigns)
* [Ad Previews](09%20Ad%20Previews.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/generatepreview)
* [Ad Preview Plugin](10%20Ad%20Preview%20Plugin.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-preview-plugin)
* [Ad Promoted Object](11%20Ad%20Promoted%20Object.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-promoted-object)
* **Ad Set/**
  * [Overview](12%20Ad%20Set/01%20Overview.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign)
  * [Activities](12%20Ad%20Set/02%20Activities.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign/activities)
  * [Ad Studies](12%20Ad%20Set/03%20Ad%20Studies.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign/ad_studies)
  * [Adcreatives](12%20Ad%20Set/04%20Adcreatives.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign/adcreatives)
  * [Addrafts](12%20Ad%20Set/05%20Addrafts.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign/addrafts)
  * [Adrules Governed](12%20Ad%20Set/06%20Adrules%20Governed.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign/adrules_governed)
  * [Ads](12%20Ad%20Set/07%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign/ads)
  * [Asyncadrequests](12%20Ad%20Set/08%20Asyncadrequests.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign/asyncadrequests)
  * [Budget Schedules](12%20Ad%20Set/09%20Budget%20Schedules.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign/budget_schedules)
  * [Budget Split Set](12%20Ad%20Set/10%20Budget%20Split%20Set.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign/budget_split_set)
  * [Campaign Actions](12%20Ad%20Set/11%20Campaign%20Actions.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign/campaign_actions)
  * [Copies](12%20Ad%20Set/12%20Copies.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign/copies)
  * [Delivery Estimate](12%20Ad%20Set/13%20Delivery%20Estimate.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign/delivery_estimate)
  * [Delivery Stats](12%20Ad%20Set/14%20Delivery%20Stats.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign/delivery_stats)
  * [Insights](12%20Ad%20Set/15%20Insights.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign/insights)
  * [Message Delivery Estimate](12%20Ad%20Set/16%20Message%20Delivery%20Estimate.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign/message_delivery_estimate)
  * [Publisher Delivery Report](12%20Ad%20Set/17%20Publisher%20Delivery%20Report.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign/publisher_delivery_report)
  * [Targeting Insights](12%20Ad%20Set/18%20Targeting%20Insights.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign/targeting_insights)
  * [Targetingsentencelines](12%20Ad%20Set/19%20Targetingsentencelines.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign/targetingsentencelines)
* **Ad Study/**
  * [Overview](13%20Ad%20Study/01%20Overview.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-study)
  * [Cells](13%20Ad%20Study/02%20Cells.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-study/cells)
  * [Continuous Lift Config](13%20Ad%20Study/03%20Continuous%20Lift%20Config.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-study/continuous_lift_config)
  * [Instances](13%20Ad%20Study/04%20Instances.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-study/instances)
  * [Objectives](13%20Ad%20Study/05%20Objectives.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-study/objectives)
  * [Related Ad Accounts](13%20Ad%20Study/06%20Related%20Ad%20Accounts.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-study/related_ad_accounts)
  * [Viewers](13%20Ad%20Study/07%20Viewers.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-study/viewers)
* **Ads Pixel/**
  * [Overview](14%20Ads%20Pixel/01%20Overview.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel)
  * [Ads Signal Diagnostic Issues](14%20Ads%20Pixel/02%20Ads%20Signal%20Diagnostic%20Issues.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/ads_signal_diagnostic_issues)
  * [Agencies](14%20Ads%20Pixel/03%20Agencies.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/agencies)
  * [Analytics Entity User Config](14%20Ads%20Pixel/04%20Analytics%20Entity%20User%20Config.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/analytics_entity_user_config)
  * [Analytics Funnel Query](14%20Ads%20Pixel/05%20Analytics%20Funnel%20Query.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/analytics_funnel_query)
  * [Analytics Segments](14%20Ads%20Pixel/06%20Analytics%20Segments.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/analytics_segments)
  * [Assigned Users](14%20Ads%20Pixel/07%20Assigned%20Users.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/assigned_users)
  * [Audiences](14%20Ads%20Pixel/08%20Audiences.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/audiences)
  * [Capability Overrides](14%20Ads%20Pixel/09%20Capability%20Overrides.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/capability_overrides)
  * [Cloudbridge Dataset Status](14%20Ads%20Pixel/10%20Cloudbridge%20Dataset%20Status.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/cloudbridge_dataset_status)
  * [Cpas Events Debugging Info](14%20Ads%20Pixel/11%20Cpas%20Events%20Debugging%20Info.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/cpas_events_debugging_info)
  * [Customconversions](14%20Ads%20Pixel/12%20Customconversions.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/customconversions)
  * [Da Checks](14%20Ads%20Pixel/13%20Da%20Checks.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/da_checks)
  * [Domain Control Rule](14%20Ads%20Pixel/14%20Domain%20Control%20Rule.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/domain_control_rule)
  * [Domain Last Fired Time](14%20Ads%20Pixel/15%20Domain%20Last%20Fired%20Time.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/domain_last_fired_time)
  * [Event Last Fired Time](14%20Ads%20Pixel/16%20Event%20Last%20Fired%20Time.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/event_last_fired_time)
  * [Event Rules](14%20Ads%20Pixel/17%20Event%20Rules.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/event_rules)
  * [Events](14%20Ads%20Pixel/18%20Events.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/events)
  * [Extractors](14%20Ads%20Pixel/19%20Extractors.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/extractors)
  * [Integration Quality](14%20Ads%20Pixel/20%20Integration%20Quality.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/integration_quality)
  * [Item Price Stats](14%20Ads%20Pixel/21%20Item%20Price%20Stats.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/item_price_stats)
  * [Microdata Stats](14%20Ads%20Pixel/22%20Microdata%20Stats.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/microdata_stats)
  * [Openbridge Configurations](14%20Ads%20Pixel/23%20Openbridge%20Configurations.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/openbridge_configurations)
  * [Pixel Delivery Recommendations](14%20Ads%20Pixel/24%20Pixel%20Delivery%20Recommendations.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/pixel_delivery_recommendations)
  * [Raw Fires](14%20Ads%20Pixel/25%20Raw%20Fires.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/raw_fires)
  * [Real Time Event Log](14%20Ads%20Pixel/26%20Real%20Time%20Event%20Log.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/real_time_event_log)
  * [Recent Events](14%20Ads%20Pixel/27%20Recent%20Events.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/recent_events)
  * [Segments](14%20Ads%20Pixel/28%20Segments.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/segments)
  * [Server Events Permitted Business](14%20Ads%20Pixel/29%20Server%20Events%20Permitted%20Business.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/server_events_permitted_business)
  * [Setup Quality](14%20Ads%20Pixel/30%20Setup%20Quality.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/setup_quality)
  * [Shared Accounts](14%20Ads%20Pixel/31%20Shared%20Accounts.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/shared_accounts)
  * [Shared Agencies](14%20Ads%20Pixel/32%20Shared%20Agencies.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/shared_agencies)
  * [Signals Iwl Feedback Nux](14%20Ads%20Pixel/33%20Signals%20Iwl%20Feedback%20Nux.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/signals_iwl_feedback_nux)
  * [Signals Iwl Nux](14%20Ads%20Pixel/34%20Signals%20Iwl%20Nux.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/signals_iwl_nux)
  * [Stats](14%20Ads%20Pixel/35%20Stats.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/stats)
* **Business/**
  * [Overview](15%20Business/01%20Overview.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business)
  * [Ad Accounts](15%20Business/02%20Ad%20Accounts.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/ad_accounts)
  * [Ad Studies](15%20Business/03%20Ad%20Studies.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/ad_studies)
  * [Adaccount](15%20Business/04%20Adaccount.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/adaccount)
  * [Add Phone Numbers](15%20Business/05%20Add%20Phone%20Numbers.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/add_phone_numbers)
  * [Adnetworkanalytics](15%20Business/06%20Adnetworkanalytics.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/adnetworkanalytics)
  * [Adnetworkanalytics Export](15%20Business/07%20Adnetworkanalytics%20Export.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/adnetworkanalytics_export)
  * [Adnetworkanalytics Results](15%20Business/08%20Adnetworkanalytics%20Results.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/adnetworkanalytics_results)
  * [Ads Custom Pivots Preview](15%20Business/09%20Ads%20Custom%20Pivots%20Preview.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/ads_custom_pivots_preview)
  * [Ads Reporting Exports](15%20Business/10%20Ads%20Reporting%20Exports.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/ads_reporting_exports)
  * [Ads Reporting Mmm Reports](15%20Business/11%20Ads%20Reporting%20Mmm%20Reports.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/ads_reporting_mmm_reports)
  * [Ads Reporting Mmm Schedulers](15%20Business/12%20Ads%20Reporting%20Mmm%20Schedulers.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/ads_reporting_mmm_schedulers)
  * [Adspixels](15%20Business/13%20Adspixels.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/adspixels)
  * [Agencies](15%20Business/14%20Agencies.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/agencies)
  * [An Placements](15%20Business/15%20An%20Placements.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/an_placements)
  * [An Publisher Blocklist Apps](15%20Business/16%20An%20Publisher%20Blocklist%20Apps.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/an_publisher_blocklist_apps)
  * [An Publisher Blocklist Categories](15%20Business/17%20An%20Publisher%20Blocklist%20Categories.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/an_publisher_blocklist_categories)
  * [An Publisher Blocklist Domains](15%20Business/18%20An%20Publisher%20Blocklist%20Domains.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/an_publisher_blocklist_domains)
  * [An Publisher Blocklist Pages](15%20Business/19%20An%20Publisher%20Blocklist%20Pages.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/an_publisher_blocklist_pages)
  * [Applied Publisher Block Lists](15%20Business/20%20Applied%20Publisher%20Block%20Lists.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/applied_publisher_block_lists)
  * [Business Asset Groups](15%20Business/21%20Business%20Asset%20Groups.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/business_asset_groups)
  * [Business Invoices](15%20Business/22%20Business%20Invoices.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/business_invoices)
  * [Business Users](15%20Business/23%20Business%20Users.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/business_users)
  * [China Business Onboarding Attributions](15%20Business/24%20China%20Business%20Onboarding%20Attributions.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/china_business_onboarding_attributions)
  * [Claim Custom Conversions](15%20Business/25%20Claim%20Custom%20Conversions.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/claim_custom_conversions)
  * [Client Ad Accounts](15%20Business/26%20Client%20Ad%20Accounts.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/client_ad_accounts)
  * [Client Apps](15%20Business/27%20Client%20Apps.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/client_apps)
  * [Client Business Asset Groups](15%20Business/28%20Client%20Business%20Asset%20Groups.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/client_business_asset_groups)
  * [Client Instagram Accounts](15%20Business/29%20Client%20Instagram%20Accounts.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/client_instagram_accounts)
  * [Client Instagram Assets](15%20Business/30%20Client%20Instagram%20Assets.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/client_instagram_assets)
  * [Client Objects](15%20Business/31%20Client%20Objects.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/client_objects)
  * [Client Offsite Signal Container Business Objects](15%20Business/32%20Client%20Offsite%20Signal%20Container%20Business%20Objects.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/client_offsite_signal_container_business_objects)
  * [Client Pages](15%20Business/33%20Client%20Pages.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/client_pages)
  * [Client Pixels](15%20Business/34%20Client%20Pixels.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/client_pixels)
  * [Client Product Catalogs](15%20Business/35%20Client%20Product%20Catalogs.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/client_product_catalogs)
  * [Client Publisher Block Lists](15%20Business/36%20Client%20Publisher%20Block%20Lists.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/client_publisher_block_lists)
  * [Client Whatsapp Business Accounts](15%20Business/37%20Client%20Whatsapp%20Business%20Accounts.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/client_whatsapp_business_accounts)
  * [Clients](15%20Business/38%20Clients.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/clients)
  * [Collaborative Ads Collaboration Requests](15%20Business/39%20Collaborative%20Ads%20Collaboration%20Requests.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/collaborative_ads_collaboration_requests)
  * [Collaborative Ads Suggested Partners](15%20Business/40%20Collaborative%20Ads%20Suggested%20Partners.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/collaborative_ads_suggested_partners)
  * [Commerce Merchant Settings](15%20Business/41%20Commerce%20Merchant%20Settings.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/commerce_merchant_settings)
  * [Content Block Lists](15%20Business/42%20Content%20Block%20Lists.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/content_block_lists)
  * [Creative Asset Tags](15%20Business/43%20Creative%20Asset%20Tags.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/creative_asset_tags)
  * [Creative Folders](15%20Business/44%20Creative%20Folders.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/creative_folders)
  * [Creatives](15%20Business/45%20Creatives.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/creatives)
  * [Custom Pivots](15%20Business/46%20Custom%20Pivots.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/custom_pivots)
  * [Customconversions](15%20Business/47%20Customconversions.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/customconversions)
  * [Event Source Groups](15%20Business/48%20Event%20Source%20Groups.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/event_source_groups)
  * [Extendedcredits](15%20Business/49%20Extendedcredits.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/extendedcredits)
  * [Finance Permissions](15%20Business/50%20Finance%20Permissions.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/finance_permissions)
  * [Ig Bc Ad Permissions](15%20Business/51%20Ig%20Bc%20Ad%20Permissions.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/ig_bc_ad_permissions)
  * [Images](15%20Business/52%20Images.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/images)
  * [Initiated Audience Sharing Requests](15%20Business/53%20Initiated%20Audience%20Sharing%20Requests.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/initiated_audience_sharing_requests)
  * [Initiated Sharing Agreements](15%20Business/54%20Initiated%20Sharing%20Agreements.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/initiated_sharing_agreements)
  * [Instagram Accounts](15%20Business/55%20Instagram%20Accounts.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/instagram_accounts)
  * [Instagram Business Accounts](15%20Business/56%20Instagram%20Business%20Accounts.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/instagram_business_accounts)
  * [Managed Businesses](15%20Business/57%20Managed%20Businesses.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/managed_businesses)
  * [Managed Partner Ads Funding Source Details](15%20Business/58%20Managed%20Partner%20Ads%20Funding%20Source%20Details.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/managed_partner_ads_funding_source_details)
  * [Managed Partner Businesses](15%20Business/59%20Managed%20Partner%20Businesses.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/managed_partner_businesses)
  * [Measurement Reports](15%20Business/60%20Measurement%20Reports.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/measurement_reports)
  * [Offline Conversion Data Sets](15%20Business/61%20Offline%20Conversion%20Data%20Sets.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/offline_conversion_data_sets)
  * [Openbridge Configurations](15%20Business/62%20Openbridge%20Configurations.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/openbridge_configurations)
  * [Owned Ad Accounts](15%20Business/63%20Owned%20Ad%20Accounts.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/owned_ad_accounts)
  * [Owned Apps](15%20Business/64%20Owned%20Apps.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/owned_apps)
  * [Owned Businesses](15%20Business/65%20Owned%20Businesses.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/owned_businesses)
  * [Owned Custom Conversions](15%20Business/66%20Owned%20Custom%20Conversions.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/owned_custom_conversions)
  * [Owned Domains](15%20Business/67%20Owned%20Domains.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/owned_domains)
  * [Owned Instagram Accounts](15%20Business/68%20Owned%20Instagram%20Accounts.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/owned_instagram_accounts)
  * [Owned Instagram Assets](15%20Business/69%20Owned%20Instagram%20Assets.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/owned_instagram_assets)
  * [Owned Offsite Signal Container Business Objects](15%20Business/70%20Owned%20Offsite%20Signal%20Container%20Business%20Objects.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/owned_offsite_signal_container_business_objects)
  * [Owned Pages](15%20Business/71%20Owned%20Pages.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/owned_pages)
  * [Owned Pixels](15%20Business/72%20Owned%20Pixels.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/owned_pixels)
  * [Owned Product Catalogs](15%20Business/73%20Owned%20Product%20Catalogs.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/owned_product_catalogs)
  * [Owned Publisher Block Lists](15%20Business/74%20Owned%20Publisher%20Block%20Lists.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/owned_publisher_block_lists)
  * [Owned Whatsapp Business Accounts](15%20Business/75%20Owned%20Whatsapp%20Business%20Accounts.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/owned_whatsapp_business_accounts)
  * [Pages](15%20Business/76%20Pages.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/pages)
  * [Parent Advertiser Infos](15%20Business/77%20Parent%20Advertiser%20Infos.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/parent_advertiser_infos)
  * [Partner Account Linking](15%20Business/78%20Partner%20Account%20Linking.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/partner_account_linking)
  * [Partner Center Export Files](15%20Business/79%20Partner%20Center%20Export%20Files.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/partner_center_export_files)
  * [Partner Relationships](15%20Business/80%20Partner%20Relationships.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/partner_relationships)
  * [Partners](15%20Business/81%20Partners.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/partners)
  * [Pending Client Ad Accounts](15%20Business/82%20Pending%20Client%20Ad%20Accounts.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/pending_client_ad_accounts)
  * [Pending Client Apps](15%20Business/83%20Pending%20Client%20Apps.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/pending_client_apps)
  * [Pending Client Pages](15%20Business/84%20Pending%20Client%20Pages.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/pending_client_pages)
  * [Pending Offline Conversion Data Sets](15%20Business/85%20Pending%20Offline%20Conversion%20Data%20Sets.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/pending_offline_conversion_data_sets)
  * [Pending Owned Ad Accounts](15%20Business/86%20Pending%20Owned%20Ad%20Accounts.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/pending_owned_ad_accounts)
  * [Pending Owned Pages](15%20Business/87%20Pending%20Owned%20Pages.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/pending_owned_pages)
  * [Pending Shared Offsite Signal Container Business Objects](15%20Business/88%20Pending%20Shared%20Offsite%20Signal%20Container%20Business%20Objects.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/pending_shared_offsite_signal_container_business_objects)
  * [Pending Shared Pixels](15%20Business/89%20Pending%20Shared%20Pixels.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/pending_shared_pixels)
  * [Pending Users](15%20Business/90%20Pending%20Users.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/pending_users)
  * [Preverified Numbers](15%20Business/91%20Preverified%20Numbers.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/preverified_numbers)
  * [Publisher Block Lists](15%20Business/92%20Publisher%20Block%20Lists.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/publisher_block_lists)
  * [Received Audience Permissions](15%20Business/93%20Received%20Audience%20Permissions.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/received_audience_permissions)
  * [Received Audience Sharing Requests](15%20Business/94%20Received%20Audience%20Sharing%20Requests.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/received_audience_sharing_requests)
  * [Received Inprogress Onbehalf Requests](15%20Business/95%20Received%20Inprogress%20Onbehalf%20Requests.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/received_inprogress_onbehalf_requests)
  * [Received Inprogress Transfer Ownership Agreements](15%20Business/96%20Received%20Inprogress%20Transfer%20Ownership%20Agreements.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/received_inprogress_transfer_ownership_agreements)
  * [Received Sharing Agreements](15%20Business/97%20Received%20Sharing%20Agreements.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/received_sharing_agreements)
  * [Reseller Events](15%20Business/98%20Reseller%20Events.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/reseller_events)
  * [Reseller Guidances](15%20Business/99%20Reseller%20Guidances.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/reseller_guidances)
  * [Resellervettingrequests](15%20Business/100%20Resellervettingrequests.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/resellervettingrequests)
  * [Salesrights Inventory Management](15%20Business/101%20Salesrights%20Inventory%20Management.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/salesrights_inventory_management)
  * [Self Certified Whatsapp Business Submissions](15%20Business/102%20Self%20Certified%20Whatsapp%20Business%20Submissions.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/self_certified_whatsapp_business_submissions)
  * [Self Certify Whatsapp Business](15%20Business/103%20Self%20Certify%20Whatsapp%20Business.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/self_certify_whatsapp_business)
  * [Sent Inprogress Onbehalf Requests](15%20Business/104%20Sent%20Inprogress%20Onbehalf%20Requests.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/sent_inprogress_onbehalf_requests)
  * [Share Preverified Numbers](15%20Business/105%20Share%20Preverified%20Numbers.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/share_preverified_numbers)
  * [Shared Audience Permissions](15%20Business/106%20Shared%20Audience%20Permissions.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/shared_audience_permissions)
  * [Sso Migrated Business Users](15%20Business/107%20Sso%20Migrated%20Business%20Users.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/sso_migrated_business_users)
  * [Sso Unmigrated Business Users](15%20Business/108%20Sso%20Unmigrated%20Business%20Users.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/sso_unmigrated_business_users)
  * [System User Access Tokens](15%20Business/109%20System%20User%20Access%20Tokens.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/system_user_access_tokens)
  * [System Users](15%20Business/110%20System%20Users.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/system_users)
  * [Third Party Partner Lift Requests](15%20Business/111%20Third%20Party%20Partner%20Lift%20Requests.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/third_party_partner_lift_requests)
  * [Third Party Partner Panel Recurring Requests](15%20Business/112%20Third%20Party%20Partner%20Panel%20Recurring%20Requests.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/third_party_partner_panel_recurring_requests)
  * [Third Party Partner Panel Requests](15%20Business/113%20Third%20Party%20Partner%20Panel%20Requests.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/third_party_partner_panel_requests)
  * [Third Party Partner Viewability Requests](15%20Business/114%20Third%20Party%20Partner%20Viewability%20Requests.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/third_party_partner_viewability_requests)
  * [Videos](15%20Business/115%20Videos.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/videos)
  * [Whatsapp Business Accounts](15%20Business/116%20Whatsapp%20Business%20Accounts.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/whatsapp_business_accounts)
* **Business Role Request/**
  * [Overview](16%20Business%20Role%20Request/01%20Overview.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business-role-request)
  * [Assigned Client Assets](16%20Business%20Role%20Request/02%20Assigned%20Client%20Assets.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business-role-request/assigned_client_assets)
  * [Assigned Owned Assets](16%20Business%20Role%20Request/03%20Assigned%20Owned%20Assets.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business-role-request/assigned_owned_assets)
* **Business User/**
  * [Overview](17%20Business%20User/01%20Overview.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business-user)
  * [Assigned Ad Accounts](17%20Business%20User/02%20Assigned%20Ad%20Accounts.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business-user/assigned_ad_accounts)
  * [Assigned Ads Pixels](17%20Business%20User/03%20Assigned%20Ads%20Pixels.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business-user/assigned_ads_pixels)
  * [Assigned Apps](17%20Business%20User/04%20Assigned%20Apps.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business-user/assigned_apps)
  * [Assigned Business Asset Groups](17%20Business%20User/05%20Assigned%20Business%20Asset%20Groups.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business-user/assigned_business_asset_groups)
  * [Assigned Creative Folders](17%20Business%20User/06%20Assigned%20Creative%20Folders.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business-user/assigned_creative_folders)
  * [Assigned Instagram Accounts](17%20Business%20User/07%20Assigned%20Instagram%20Accounts.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business-user/assigned_instagram_accounts)
  * [Assigned Monetization Properties](17%20Business%20User/08%20Assigned%20Monetization%20Properties.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business-user/assigned_monetization_properties)
  * [Assigned Offline Conversion Data Sets](17%20Business%20User/09%20Assigned%20Offline%20Conversion%20Data%20Sets.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business-user/assigned_offline_conversion_data_sets)
  * [Assigned Pages](17%20Business%20User/10%20Assigned%20Pages.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business-user/assigned_pages)
  * [Assigned Product Catalogs](17%20Business%20User/11%20Assigned%20Product%20Catalogs.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business-user/assigned_product_catalogs)
  * [Assigned Whatsapp Business Accounts](17%20Business%20User/12%20Assigned%20Whatsapp%20Business%20Accounts.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business-user/assigned_whatsapp_business_accounts)
* [Currencies](18%20Currencies.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/currencies)
* **Custom Audience Targeting/**
  * [Overview](19%20Custom%20Audience%20Targeting/01%20Overview.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience)
  * [Ad Accounts](19%20Custom%20Audience%20Targeting/02%20Ad%20Accounts.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience/ad_accounts)
  * [Adaccounts](19%20Custom%20Audience%20Targeting/03%20Adaccounts.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience/adaccounts)
  * [Ads](19%20Custom%20Audience%20Targeting/04%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience/ads)
  * [Capabilities](19%20Custom%20Audience%20Targeting/05%20Capabilities.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience/capabilities)
  * [Health](19%20Custom%20Audience%20Targeting/06%20Health.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience/health)
  * [Sessions](19%20Custom%20Audience%20Targeting/07%20Sessions.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience/sessions)
  * [Shared Account Campaign Info](19%20Custom%20Audience%20Targeting/08%20Shared%20Account%20Campaign%20Info.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience/shared_account_campaign_info)
  * [Shared Account Info](19%20Custom%20Audience%20Targeting/09%20Shared%20Account%20Info.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience/shared_account_info)
  * [Users](19%20Custom%20Audience%20Targeting/10%20Users.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience/users)
  * [Usersreplace](19%20Custom%20Audience%20Targeting/11%20Usersreplace.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience/usersreplace)
* [High Demand Period](20%20High%20Demand%20Period.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/high-demand-period)
* [Image Crop](21%20Image%20Crop.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/image-crops)
* **Product Catalog/**
  * [Overview](22%20Product%20Catalog/01%20Overview.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog)
  * [Additional Reviews](22%20Product%20Catalog/02%20Additional%20Reviews.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/additional_reviews)
  * [Assigned Users](22%20Product%20Catalog/03%20Assigned%20Users.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/assigned_users)
  * [Automotive Models](22%20Product%20Catalog/04%20Automotive%20Models.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/automotive_models)
  * [Batch](22%20Product%20Catalog/05%20Batch.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/batch)
  * [Bundle Folders](22%20Product%20Catalog/06%20Bundle%20Folders.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/bundle_folders)
  * [Bundles](22%20Product%20Catalog/07%20Bundles.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/bundles)
  * [Catalog Segments](22%20Product%20Catalog/08%20Catalog%20Segments.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/catalog_segments)
  * [Catalog Store](22%20Product%20Catalog/09%20Catalog%20Store.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/catalog_store)
  * [Categories](22%20Product%20Catalog/10%20Categories.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/categories)
  * [Check Batch Request Status](22%20Product%20Catalog/11%20Check%20Batch%20Request%20Status.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/check_batch_request_status)
  * [Check Marketplace Partner Sellers Status](22%20Product%20Catalog/12%20Check%20Marketplace%20Partner%20Sellers%20Status.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/check_marketplace_partner_sellers_status)
  * [Collaborative Ads Share Settings](22%20Product%20Catalog/13%20Collaborative%20Ads%20Share%20Settings.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/collaborative_ads_share_settings)
  * [Connected Businesses](22%20Product%20Catalog/14%20Connected%20Businesses.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/connected_businesses)
  * [Da Checks](22%20Product%20Catalog/15%20Da%20Checks.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/da_checks)
  * [Data Sources](22%20Product%20Catalog/16%20Data%20Sources.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/data_sources)
  * [Destinations](22%20Product%20Catalog/17%20Destinations.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/destinations)
  * [Diagnostics](22%20Product%20Catalog/18%20Diagnostics.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/diagnostics)
  * [Dpa Eligible Ad Accounts](22%20Product%20Catalog/19%20Dpa%20Eligible%20Ad%20Accounts.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/dpa_eligible_ad_accounts)
  * [Event Stats](22%20Product%20Catalog/20%20Event%20Stats.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/event_stats)
  * [External Event Sources](22%20Product%20Catalog/21%20External%20Event%20Sources.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/external_event_sources)
  * [Facets](22%20Product%20Catalog/22%20Facets.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/facets)
  * [Flights](22%20Product%20Catalog/23%20Flights.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/flights)
  * [Home Listings](22%20Product%20Catalog/24%20Home%20Listings.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/home_listings)
  * [Hotel Rooms Batch](22%20Product%20Catalog/25%20Hotel%20Rooms%20Batch.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/hotel_rooms_batch)
  * [Hotels](22%20Product%20Catalog/26%20Hotels.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/hotels)
  * [Items Batch](22%20Product%20Catalog/27%20Items%20Batch.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/items_batch)
  * [Local Service Businesses](22%20Product%20Catalog/28%20Local%20Service%20Businesses.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/local_service_businesses)
  * [Localized Items Batch](22%20Product%20Catalog/29%20Localized%20Items%20Batch.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/localized_items_batch)
  * [Marketplace Partner Signals](22%20Product%20Catalog/30%20Marketplace%20Partner%20Signals.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/marketplace_partner_signals)
  * [Pricing Variables Batch](22%20Product%20Catalog/31%20Pricing%20Variables%20Batch.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/pricing_variables_batch)
  * [Product Feeds](22%20Product%20Catalog/32%20Product%20Feeds.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/product_feeds)
  * [Product Groups](22%20Product%20Catalog/33%20Product%20Groups.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/product_groups)
  * [Product Sets](22%20Product%20Catalog/34%20Product%20Sets.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/product_sets)
  * [Product Sets Batch](22%20Product%20Catalog/35%20Product%20Sets%20Batch.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/product_sets_batch)
  * [Products](22%20Product%20Catalog/36%20Products.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/products)
  * [Smart Pixel Settings](22%20Product%20Catalog/37%20Smart%20Pixel%20Settings.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/smart_pixel_settings)
  * [Update Generated Image Config](22%20Product%20Catalog/38%20Update%20Generated%20Image%20Config.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/update_generated_image_config)
  * [User Tasks](22%20Product%20Catalog/39%20User%20Tasks.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/user_tasks)
  * [Vehicle Offers](22%20Product%20Catalog/40%20Vehicle%20Offers.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/vehicle_offers)
  * [Vehicles](22%20Product%20Catalog/41%20Vehicles.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/vehicles)
  * [Videos](22%20Product%20Catalog/42%20Videos.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/videos)
* [Reach and Frequency Prediction](23%20Reach%20and%20Frequency%20Prediction.md) *(converted)* — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/reach-frequency-prediction)
* **System User/**
  * [Overview](24%20System%20User/01%20Overview.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/system-user)
  * [Assigned Ad Accounts](24%20System%20User/02%20Assigned%20Ad%20Accounts.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/system-user/assigned_ad_accounts)
  * [Assigned Ads Pixels](24%20System%20User/03%20Assigned%20Ads%20Pixels.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/system-user/assigned_ads_pixels)
  * [Assigned Apps](24%20System%20User/04%20Assigned%20Apps.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/system-user/assigned_apps)
  * [Assigned Business Asset Groups](24%20System%20User/05%20Assigned%20Business%20Asset%20Groups.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/system-user/assigned_business_asset_groups)
  * [Assigned Creative Folders](24%20System%20User/06%20Assigned%20Creative%20Folders.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/system-user/assigned_creative_folders)
  * [Assigned Instagram Accounts](24%20System%20User/07%20Assigned%20Instagram%20Accounts.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/system-user/assigned_instagram_accounts)
  * [Assigned Monetization Properties](24%20System%20User/08%20Assigned%20Monetization%20Properties.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/system-user/assigned_monetization_properties)
  * [Assigned Offline Conversion Data Sets](24%20System%20User/09%20Assigned%20Offline%20Conversion%20Data%20Sets.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/system-user/assigned_offline_conversion_data_sets)
  * [Assigned Pages](24%20System%20User/10%20Assigned%20Pages.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/system-user/assigned_pages)
  * [Assigned Product Catalogs](24%20System%20User/11%20Assigned%20Product%20Catalogs.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/system-user/assigned_product_catalogs)
  * [Assigned Whatsapp Business Accounts](24%20System%20User/12%20Assigned%20Whatsapp%20Business%20Accounts.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/system-user/assigned_whatsapp_business_accounts)

## Index — 25 Linked pages not in the sidebar

* [ad-account-business-constraints](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-account-business-constraints.md) *(old docs site)*
* [ad-account-dsa-recommendations](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-account-dsa-recommendations.md) *(old docs site)*
* [ad-account/advertisable_applications](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-account/advertisable_applications.md) *(old docs site)*
* [ad-account/capabilities](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-account/capabilities.md) *(old docs site)*
* [ad-account/capabilities/v18.0](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-account/capabilities/v18.0.md) *(old docs site)*
* [ad-account/timezone-ids](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-account/timezone-ids.md) *(old docs site)*
* [ad-asset-feed-spec](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-asset-feed-spec.md) *(old docs site)*
* [ad-bid-adjustments](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-bid-adjustments.md) *(old docs site)*
* [ad-campaign-bid-constraint](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-campaign-bid-constraint.md) *(old docs site)*
* [ad-campaign-delivery-estimate](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-campaign-delivery-estimate.md) *(old docs site)*
* [ad-campaign-frequency-control-specs](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-campaign-frequency-control-specs.md) *(old docs site)*
* [ad-campaign-issues-info](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-campaign-issues-info.md) *(old docs site)*
* [ad-campaign-learning-stage-info](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-campaign-learning-stage-info.md) *(old docs site)*
* [ad-creative-ad-disclaimer](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-creative-ad-disclaimer.md) *(old docs site)*
* [ad-creative-asset-groups-spec](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-creative-asset-groups-spec.md) *(old docs site)*
* [ad-creative-branded-content-ads](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-creative-branded-content-ads.md) *(old docs site)*
* [ad-creative-degrees-of-freedom-spec](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-creative-degrees-of-freedom-spec.md) *(old docs site)*
* [ad-creative-feature-customizations](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-creative-feature-customizations.md) *(old docs site)*
* [ad-creative-feature-details](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-creative-feature-details.md) *(old docs site)*
* [ad-creative-features-spec](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-creative-features-spec.md) *(old docs site)*
* [ad-creative-link-data-call-to-action](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-creative-link-data-call-to-action.md) *(old docs site)*
* [ad-creative-link-data-image-layer-spec](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-creative-link-data-image-layer-spec.md) *(old docs site)*
* [ad-creative-link-data-image-overlay-spec](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-creative-link-data-image-overlay-spec.md) *(old docs site)*
* [ad-creative-link-data](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-creative-link-data.md) *(old docs site)*
* [ad-creative-marketing-message-structured-spec](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-creative-marketing-message-structured-spec.md) *(converted)*
* [ad-creative-media-sourcing-spec](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-creative-media-sourcing-spec.md) *(old docs site)*
* [ad-creative-object-story-spec](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-creative-object-story-spec.md) *(old docs site)*
* [ad-creative-photo-data](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-creative-photo-data.md) *(old docs site)*
* [ad-creative-platform-customization](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-creative-platform-customization.md) *(old docs site)*
* [ad-creative-site-links-spec](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-creative-site-links-spec.md) *(old docs site)*
* [ad-creative-sourcing-spec](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-creative-sourcing-spec.md) *(old docs site)*
* [ad-creative-template-url-spec](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-creative-template-url-spec.md) *(old docs site)*
* [ad-creative-text-data](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-creative-text-data.md) *(old docs site)*
* [ad-creative-video-data](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-creative-video-data.md) *(old docs site)*
* [ad-group](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-group.md) *(old docs site)*
* [ad-preview](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-preview.md) *(old docs site)*
* [ad-report-run/insights](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-report-run/insights.md) *(old docs site)*
* [ad-rule](25%20Linked%20pages%20not%20in%20the%20sidebar/ad-rule.md) *(old docs site)*
* [adcreative](25%20Linked%20pages%20not%20in%20the%20sidebar/adcreative.md) *(old docs site)*
* [adgroup-issues-info](25%20Linked%20pages%20not%20in%20the%20sidebar/adgroup-issues-info.md) *(old docs site)*
* [adgroup-review-feedback](25%20Linked%20pages%20not%20in%20the%20sidebar/adgroup-review-feedback.md) *(old docs site)*
* [ads-action-stats](25%20Linked%20pages%20not%20in%20the%20sidebar/ads-action-stats.md) *(old docs site)*
* [ads-image-crops](25%20Linked%20pages%20not%20in%20the%20sidebar/ads-image-crops.md) *(old docs site)*
* [ads-pixel-stats-result](25%20Linked%20pages%20not%20in%20the%20sidebar/ads-pixel-stats-result.md) *(old docs site)*
* [ads-pixel/offline_event_uploads](25%20Linked%20pages%20not%20in%20the%20sidebar/ads-pixel/offline_event_uploads.md) *(old docs site)*
* [agency-client-declaration](25%20Linked%20pages%20not%20in%20the%20sidebar/agency-client-declaration.md) *(old docs site)*
* [check-batch-request-status](25%20Linked%20pages%20not%20in%20the%20sidebar/check-batch-request-status.md) *(old docs site)*
* [conversion-action-query](25%20Linked%20pages%20not%20in%20the%20sidebar/conversion-action-query.md) *(old docs site)*
* [cpas-collaboration-request](25%20Linked%20pages%20not%20in%20the%20sidebar/cpas-collaboration-request.md) *(old docs site)*
* [custom-audience-ad-account](25%20Linked%20pages%20not%20in%20the%20sidebar/custom-audience-ad-account.md) *(old docs site)*
* [custom-audience-capabilities](25%20Linked%20pages%20not%20in%20the%20sidebar/custom-audience-capabilities.md) *(old docs site)*
* [custom-audience-data-source](25%20Linked%20pages%20not%20in%20the%20sidebar/custom-audience-data-source.md) *(old docs site)*
* [custom-audience-session](25%20Linked%20pages%20not%20in%20the%20sidebar/custom-audience-session.md) *(old docs site)*
* [custom-conversion](25%20Linked%20pages%20not%20in%20the%20sidebar/custom-conversion.md) *(old docs site)*
* [da-check](25%20Linked%20pages%20not%20in%20the%20sidebar/da-check.md) *(old docs site)*
* [extended-credit-invoice-group](25%20Linked%20pages%20not%20in%20the%20sidebar/extended-credit-invoice-group.md) *(old docs site)*
* [extended-credit](25%20Linked%20pages%20not%20in%20the%20sidebar/extended-credit.md) *(old docs site)*
* [generatepreviews](25%20Linked%20pages%20not%20in%20the%20sidebar/generatepreviews.md) *(old docs site)*
* [minimum-budget](25%20Linked%20pages%20not%20in%20the%20sidebar/minimum-budget.md) *(old docs site)*
* [omega-customer-trx](25%20Linked%20pages%20not%20in%20the%20sidebar/omega-customer-trx.md) *(old docs site)*
* [product-catalog-image-settings](25%20Linked%20pages%20not%20in%20the%20sidebar/product-catalog-image-settings.md) *(old docs site)*
* [product-event-stat](25%20Linked%20pages%20not%20in%20the%20sidebar/product-event-stat.md) *(old docs site)*
* [product-feed-schedule](25%20Linked%20pages%20not%20in%20the%20sidebar/product-feed-schedule.md) *(old docs site)*
* [product-feed-upload](25%20Linked%20pages%20not%20in%20the%20sidebar/product-feed-upload.md) *(old docs site)*
* [product-feed-upload/errors](25%20Linked%20pages%20not%20in%20the%20sidebar/product-feed-upload/errors.md) *(old docs site)*
* [product-feed](25%20Linked%20pages%20not%20in%20the%20sidebar/product-feed.md) *(converted)*
* [product-feed/automotive_models](25%20Linked%20pages%20not%20in%20the%20sidebar/product-feed/automotive_models.md) *(converted)*
* [product-feed/destinations](25%20Linked%20pages%20not%20in%20the%20sidebar/product-feed/destinations.md) *(converted)*
* [product-feed/flights](25%20Linked%20pages%20not%20in%20the%20sidebar/product-feed/flights.md) *(converted)*
* [product-feed/home_listings](25%20Linked%20pages%20not%20in%20the%20sidebar/product-feed/home_listings.md) *(converted)*
* [product-feed/hotels](25%20Linked%20pages%20not%20in%20the%20sidebar/product-feed/hotels.md) *(converted)*
* [product-feed/products](25%20Linked%20pages%20not%20in%20the%20sidebar/product-feed/products.md) *(converted)*
* [product-feed/rules](25%20Linked%20pages%20not%20in%20the%20sidebar/product-feed/rules.md) *(converted)*
* [product-feed/uploads](25%20Linked%20pages%20not%20in%20the%20sidebar/product-feed/uploads.md) *(converted)*
* [product-feed/vehicle_offers](25%20Linked%20pages%20not%20in%20the%20sidebar/product-feed/vehicle_offers.md) *(converted)*
* [product-feed/vehicles](25%20Linked%20pages%20not%20in%20the%20sidebar/product-feed/vehicles.md) *(converted)*
* [product-item](25%20Linked%20pages%20not%20in%20the%20sidebar/product-item.md) *(old docs site)*
* [product-set](25%20Linked%20pages%20not%20in%20the%20sidebar/product-set.md) *(converted)*
* [product-set/automotive_models](25%20Linked%20pages%20not%20in%20the%20sidebar/product-set/automotive_models.md) *(converted)*
* [product-set/destinations](25%20Linked%20pages%20not%20in%20the%20sidebar/product-set/destinations.md) *(converted)*
* [product-set/flights](25%20Linked%20pages%20not%20in%20the%20sidebar/product-set/flights.md) *(converted)*
* [product-set/home_listings](25%20Linked%20pages%20not%20in%20the%20sidebar/product-set/home_listings.md) *(converted)*
* [product-set/hotels](25%20Linked%20pages%20not%20in%20the%20sidebar/product-set/hotels.md) *(converted)*
* [product-set/products](25%20Linked%20pages%20not%20in%20the%20sidebar/product-set/products.md) *(converted)*
* [product-set/vehicle_offers](25%20Linked%20pages%20not%20in%20the%20sidebar/product-set/vehicle_offers.md) *(converted)*
* [product-set/vehicles](25%20Linked%20pages%20not%20in%20the%20sidebar/product-set/vehicles.md) *(converted)*
* [reach-estimate](25%20Linked%20pages%20not%20in%20the%20sidebar/reach-estimate.md) *(old docs site)*
* [saved-audience](25%20Linked%20pages%20not%20in%20the%20sidebar/saved-audience.md) *(old docs site)*
* [targeting-sentence-line](25%20Linked%20pages%20not%20in%20the%20sidebar/targeting-sentence-line.md) *(old docs site)*
* [targeting](25%20Linked%20pages%20not%20in%20the%20sidebar/targeting.md) *(old docs site)*

## Dead links (no page on Meta's site)

`ad-campaign-group/adcreatives`, `ad-column-sizes`, `ad-place-page-set`, `ad-recommendation`, `ad-report-run`, `ad-sets`, `ad-study-cell`, `ad-study-objective`, `adgroup/adcreatives`, `adgroup/copies`, `adgroup/insights`, `adgroup/leads`, `adgroup/previews`, `ads-insights`, `ads-mcme-conversion`, `business-creative-folder`, `business-image`, `home-listing`, `hotel`, `hotel-room`, `instagram-carousel`, `instagram-carousel/comments`, `instagram-comment`, `instagram-comment/replies`, `instagram-media`, `instagram-media/comments`, `instagram-user`, `instagram-user/agencies`, `instagram-user/ar_effects`, `instagram-user/authorized_adaccounts`, `instagram-user/upcoming_events`, `product-catalog/agencies`, `product-feed-rule`, `product-group`, `product-item/channels_to_integrity_status`, `publisher-block-list`, `publisher-delivery-report`, `vehicle`
