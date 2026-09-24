<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/faq | Saved: 2026-09-19 -->

# Managed Partner Ads FAQ



## Onboarding to Managed Partner Ads

**What app permissions are required to onboard to Managed Partner Ads?**

The necessary permissions are `ads_management` and `business_management`.

Also make sure your app has [Marketing API Access Tier for higher rate limiting](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/authorization).

Learn more about App Review:

* [App Review](https://developers.facebook.com/docs/app-review)
* [Sample App Review submission](https://developers.facebook.com/docs/app-review/resources/sample-submissions/marketing-api)

**What if the child Business Manager system user access token fails to be retrieved?**

Make sure that you are using an [admin system user of the parent (marketplace) Business Manager](https://developers.facebook.com/docs/marketing-api/system-users/create-retrieve-update) and that your app has the required permissions for [App Review](https://developers.facebook.com/docs/app-review).

## Seller onboarding and pages

**What Page should a seller use for advertising? Does the marketplace need to request access to the seller’s Page?**

It depends on which Page the seller is using for advertising. Generally, there are 3 Pages a seller can use for advertising:

* The seller's own official Page
* The marketplace's official Page
* The newly created Page for the seller partnership through the Managed Partner Ads Seller Business Creation API

The marketplace can expose these Pages on their platform to sellers to choose for advertising. If sellers choose their own official Page for advertising, the marketplace can request access to the Page via the [`client_ad_accounts` endpoint](https://developers.facebook.com/docs/marketing-api/business-asset-management/guides/business-to-business#b2b-request). If sellers choose the marketplace's official Page or the newly created Page during seller onboarding, the marketplace automatically gets access to this Page.

**Is it possible to skip Page creation during seller onboarding?**

Yes, page creation can be skipped.

To do so, set the `skip_partner_page_creation` field to true when [onboarding a seller](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/seller/onboarding).

**What are the Page-related parameters used for?**

* `partner_facebook_page_url` is the seller's identity Page for integrity checks purpose.
* `page_profile_image_url`, `page_name`, and `seller_external_website_url` are used to create an advertising Page for the seller to use in an ad campaign.
* `page_profile_image_url` and `page_name` are optional, and default values will be used if not specified. Marketplaces/sellers are encouraged to pass in `page_profile_image_url` and `page_name` values of their own for potential better campaign performance.

**Can I onboard a seller with their existing page?**

Steps for onboarding seller with their existing page

1) Onboarding a seller via Seller Creation API with their existing page.

#### Sample Script

```
curl -X POST \
 -F "id=<BUSINESS_ID>" \
 -F "catalog_id=<CATALOG_ID>" \
 -F "line_of_credit_id=<CREDIT_LINE_ID>" \
 -F "child_business_external_id=<SELLER_ID>" \
 -F "name=<SELLER_NAME>" \
 -F "seller_external_website_url=<SELLER_WEBSITE>" \
 -F "page_name=<SELLER_PAGE_NAME>" \
 -F "page_profile_image_url=<SELLER_PAGE_PROFILE>" \
 -F "sales_rep_email=<SELLER_EMAIL>" \
 -F "partner_facebook_page_url=<SELLER_OWN_PAGE_URL>" \
 -F "partner_registration_countries=['US', 'UK']" \
 -F "ad_account_currency=USD" \
 -F "credit_limit=<CREDIT_LIMIT>" \
 -F "seller_targeting_countries=['US', 'UK']" \
 -F "vertical=<OTHER>" \
 -F "timezone_id=<TIMEZONE_ID>" \
 -F "access_token=<ACCESS_TOKEN>" \
 "https://graph.facebook.com/v<API_VERSION><Business_id>/aams_seller_businesses"
```

2) Request seller page access with advertisement permission.

#### Sample Script

```
curl -X POST \
 -F "page_id=<SELLER_PAGE_ID>" \
 -F 'permitted_tasks=["ADVERTISE"]' \
 -F "access_token=<ACCESS_TOKEN>" \
"https://graph.facebook.com/v<API_VERSION>/<SELLER_ID>/client_pages"
```

3) Switch active page to seller own page after the seller accepts the request. Then run a MPA campaign.

## Catalog

**Can I manage catalog product items in batches?**

You can manage the marketplace catalog or individual seller catalog segment with the [Catalog Batch API](https://developers.facebook.com/documentation/ads-commerce/catalog/guides/manage-catalog-items/catalog-batch-api).

**Can I check the review status of product item uploaded with Catalog Batch API?**

You may use [the `channels_to_integrity_status` endpoint](https://developers.facebook.com/docs/marketing-api/reference/product-item/channels_to_integrity_status) to check the integrity review status of product items. It works on product item level (i.e., `{product_item_id}`), as well as on the catalog products level (i.e.,` {catalog_id}/products`).

## Credit line

**Is it possible to ensure Meta does not spend more than the prepaid amount set by a seller?**

You can set [the `spend_cap` field of the ad account](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account#parameters-3) to the amount that a seller has prepaid.

**If the credit of a child Business Manager is a certain amount, will it be able to create a campaign with a lifetime_budget more than this amount?**

This is possible. Sellers can set the ad campaign's `lifetime_budget` to be more than the child Business Manager credit line. Normally a credit line is settled/reset monthly.

Ad campaign(s) getting paused is a bad experience for sellers. It is recommended to provide basic checks and alerts to sellers if they set a `lifetime_budget` greater than the credit line of the child Business Manager.

**What currency should be provided for credit allocation and ad account creation?**

Credit allocation to the seller's Business Manager should always be USD. However, for ad account currency, one can specify any supported currency, and this will be the same currency used for monthly invoicing.

Refer to the `credit_limit` (must be USD) and `ad_account_currency` (any supported currency) parameters in the [Seller Business Creation API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/reference#seller-business-creation-api).

See [Accepted Currencies for Monthly Invoicing](https://www.facebook.com/business/help/2780175265550591) for more information.

**Can I use different ad account currencies for different sellers?**

Yes, you can use different currencies for different ad accounts. You may specify the `ad_account_currency` (any supported currency) in the [Seller Business Creation API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/seller/onboarding) and this will be the same currency used for monthly invoicing.

See [Accepted Currencies for Monthly Invoicing](https://www.facebook.com/business/help/2780175265550591) for more information.

**Can the line_of_credit_id metric be a shared line of credit for the Seller Business Creation API?**

No, only the line of credit that is owned by the marketplace Business Manager can be used to allocate credit to another business. A shared line of credit from another business cannot be used as the `line_of_credit_id`.

## Campaign

**How can I update the lifetime_budget of a Managed Partner Ads campaign?**

Refer to the [Update Ads Campaign documentation](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/reference#update) for information on updating a Managed Partner ads campaign `lifetime_budget` and `end_time` parameters.

Or you can make the update via [the generic campaign update endpoint](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group#parameters-3).

**After a campaign is created, paused, or updated, how much time does it take for the ad to be displayed?**

Ad review can take anywhere from a few minutes up to 24 hours. See [How Ads Get Approved](https://www.facebook.com/business/a/ad-review-process) for more information.

Check if [the `effective_status` of a campaign is `ACTIVE`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group) to see if it is running:

For a catalog products review, it can be checked with [the `/{catalog_id}/check_batch_request_status` endpoint](https://developers.facebook.com/docs/marketing-api/catalog-batch/guides/get-batch-request).

## Reporting

**What is the process for pulling insights for Managed Partner Ads campaigns and how frequent should we pull them?**

Refer to the [Collaborative Ads Insights documentation](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads#insights) for Managed Partner Ads campaigns metrics and breakdowns.

For generic campaigns metrics (i.e., spend, impressions, clicks etc.), refer to the [Insights API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights).

In general, you may want to pull the insights hourly or a few times a day. You may also pull more frequently or less frequently according to your needs.

**How can you reduce cross conversion between sellers?**

You may consider using catalog URL links that are specific for Managed Partner Ads in the template. When the system recognises these URLs, it would hide links to other sellers on this seller’s product pages.

