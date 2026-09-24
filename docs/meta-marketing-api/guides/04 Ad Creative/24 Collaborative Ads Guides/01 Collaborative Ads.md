<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads | Saved: 2026-09-19 -->

# Collaborative Ads



Collaborative Ads is a solution built on top of [Advantage+ catalog ads](https://developers.facebook.com/docs/marketing-api/dynamic-ads). It enables brand advertisers to safely collaborate with a retailer or a marketing partner and achieve advertising goals such as target product for sales using retailer-provided content.

The retailer or marketing partner should share a catalog segment with the brand advertiser with all their products. This segment is a portion of their catalog or a superset of product sets. The brand advertiser can then accept this catalog segment and start running [Advantage+ catalog ads](https://developers.facebook.com/docs/marketing-api/dynamic-ads) using this catalog segment. Brand advertisers cannot edit the catalog segment but they can create their own product sets from it.

An advertiser essentially runs a [Advantage+ catalog ads](https://developers.facebook.com/docs/marketing-api/dynamic-ads) campaign for catalog sales with a product catalog. Therefore they can use standard Facebook ads reports which now include metrics related to the catalog segment.

In addition, you can use product-level reporting and retailer-level reporting to show only the brand's purchases to the brand advertiser.

## High-Level Steps {#steps}

[**For retailers and marketing partners:**](#for-retailers)

- **Step 1: Onboard into Collaborative Ads**
- **Step 2: Create Catalog Segment** - The segment must contain products belonging to one of its prospective brand partners.
- **Step 3: Share Catalog Segment with Brand Partner**
- (For Marketing Partners Only) **Step 4: Provide Discovery Tools for Brands**

[**For brands:**](#for-brands)

- **Step 1: Accept Catalog Segment**
- **Step 2: Create Ad Campaign with Catalog Segment**
- **Step 3: View Reporting** - View reporting related to the products in the catalog segment.
- **Optional Step 4: Debugging** - Use tools to diagnose and resolve problems, see [Advantage+ catalog ads, Debugging Tools](https://developers.facebook.com/docs/marketing-api/dynamic-product-ads/debugging-tools).

## Steps For Retailers and Marketing Partners {#for-retailers}

### Step 1: Onboard into Collaborative Ads
**Note:** To complete this step, your app needs [`business_management`](https://developers.facebook.com/docs/permissions/reference/business_management) and [`catalog_management`](https://developers.facebook.com/docs/permissions/reference/catalog_management) permissions.

Currently, this is not supported via API, and must be completed via UI. To start this process, click 'Become a Retail Partner' in the [Collaborative Ads Retailer Directory](https://www.facebook.com/collaborative_ads/retailer_directory/).

### Step 2: Create Catalog Segment
**Note:** To complete this step, your app needs [`business_management`](https://developers.facebook.com/docs/permissions/reference/business_management) and [`catalog_management`](https://developers.facebook.com/docs/permissions/reference/catalog_management) permissions.

Create a catalog segment from one of your existing catalogs. The segment must contain all the products you would like to share with your brand partner.

To create a catalog segment via API, make a `POST` request to the [`owned_product_catalogs` edge](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/owned_product_catalogs#Creating). The following fields are required for catalog segment creation:

- `parent_catalog_id`: The parent catalog from which your segment was created. This catalog needs to be Collaborative Ads compliant. You can find your catalog's status in Commerce Manager.
- `catalog_segment_filter`: A JSON-encoded rule used to create the catalog segment.

### Step 3: Share Catalog Segment
**Note:** To complete this step, your app needs [`business_management`](https://developers.facebook.com/docs/permissions/reference/business_management) and [`catalog_management`](https://developers.facebook.com/docs/permissions/reference/catalog_management) permissions.

Share your catalog segment with your brand partner. To do this via API, make a `POST` request to `/{catalog_segment_id}/agencies`. In your call, you can add the following fields:

| Field | Description |
| --- | --- |
| `business`<br><br>type: numeric string or integer | **Required.**<br><br>ID for the business the catalog will be shared with. |
| `permitted_tasks`<br><br>type: array < enum {MANAGE, ADVERTISE} > | **Required.**<br><br>Tasks the business will be allowed to execute. Available options are: `['ADVERTISE', 'MANAGE']`. |
| `utm_settings`<br><br>type: JSON object {enum{campaign_source,campaign_medium,campaign_name}: string} | **Optional.**<br><br>You can specify `campaign_source`, `campaign_medium`, and `campaign_name`.<br><br>For example: `{campaign_source: "fb_campaign_source"}`. |
| `enabled_collab_terms`<br><br>type: array < enum {ENFORCE_CREATE_NEW_AD_ACCOUNT, ENFORCE_SHARE_AD_PERFORMANCE_ACCESS} > | **Optional.**<br><br>Collaboration terms to be enforced on new brand partners. Available options are: `['ENFORCE_CREATE_NEW_AD_ACCOUNT', 'ENFORCE_SHARE_AD_PERFORMANCE_ACCESS']`. |

### (For Marketing Partners Only) Step 4: Provide Discovery Tools for Brands

**Note:** To complete this step, your app needs the [`business_management`](https://developers.facebook.com/docs/permissions/reference/business_management) permission. The API call must include a user access token and that user needs to have permission on the suggested partner, business, or collaboration request.

As a marketing partner, you should provide a way for brands to discover possible Collaborative Ads partners. You can use the following endpoints to find retailers to work with:

- [`GET {business-id}?fields=collaborative_ads_suggested_partners`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business) — Find partners for a specific business.
- [`GET collaborative_ads_directory?fields=collaborative_ads_merchants`](https://developers.facebook.com/docs/graph-api/reference/collaborative-ads-directory) — Get the complete list of collaborative ads retailers.
- [`GET {cpas-advertiser-partnership-recommendation-id}?fields=advertiser_business_id,brand_business_id,brands,countries,merchant_business_id,status,status_reason`](https://developers.facebook.com/docs/graph-api/reference/cpas-advertiser-partnership-recommendation) — Get one single retailer recommendation.

If a brand finds a partner, you can reach out to the retailer with a collaboration request. Do that by making the following `POST` request to [`/{cpas-collaboration-request-id}`](https://developers.facebook.com/docs/graph-api/reference/cpas-collaboration-request):

```
{business-id}/collaborative_ads_collaboration_requests?
brands="["[BRAND NAME]", "[BRAND NAME 2]"]"&
contact_email=[CONTACT_EMAIL]&
contact_first_name=[CONTACT_FIRST_NAME]&
contact_last_name=[CONTACT_LAST_NAME]&
phone_number=[PHONE NUMBER]&
receiver_business=[RECEIVING BUSINESS ID]
requester_agency_or_brand=[REQUESTING ENTITY - AGENCY, BRAND or MERCHANT]
```

Keep track of your [reach outs](https://developers.facebook.com/docs/graph-api/reference/cpas-collaboration-request) with the following endpoints:

- [`GET {business-id}/collaborative_ads_collaboration_requests`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business)
- [`GET {cpas-collaboration-request-id}?fields=phone_number,receiver_business,request_type,source,status`](https://developers.facebook.com/docs/graph-api/reference/cpas-collaboration-request)

## Steps For Brands {#for-brands}

### Step 1: Accept Catalog Segment

If your brand has not accepted the Terms of Service for the new shared business, you must do so.

After receiving the shared asset, the business admin user needs to:

1. Go to the [Collaboration Center](https://www.facebook.com/collaboration_center).
2. Select the business you're accepting Terms of Service for.
3. Select **Partners** from the left side navigation.
4. Click the **Accept assets** button to begin the acceptance workflow.

After accepting the terms, your brand can add people to the catalog segment using the [`/{product-catalog-id}/assigned_users`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/assigned_users) endpoint. **Note:** This requires the [`business_management`](https://developers.facebook.com/docs/permissions/reference/business_management) permission.

In addition to accepting the terms of service, brands may also be required to agree to retailer-mandated collaboration terms; creating a new ad account and/or granting view access so the retailer can see ad performance. It is necessary to accept these terms in order to complete onboarding.

### Step 2: Create Ad Campaign
**Note:** To complete this step, your app needs [`business_management`](https://developers.facebook.com/docs/permissions/reference/business_management) and [`ads_management`](https://developers.facebook.com/docs/permissions/reference/ads_management) permissions.

Your brand can use the accepted catalog segment to create ad campaigns. You should use a separate ad account for each retailer you want to run Collaborative Ads for. Once the dedicated ad account is linked to a retailer, it can only select catalog segments belonging to that specific retailer.

To create and run ads you do as you normally do for your own product catalog, however you should provide `catalog_segment_ID` instead of a catalog ID:

```
curl \
  -F 'name=Product Catalog Sales Campaign' \
  -F 'objective=PRODUCT_CATALOG_SALES' \
  -F 'promoted_object={"product_catalog_id":"<CATALOG_SEGMENT_ID>"}' \
  -F 'status=PAUSED' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/<API_VERSION>/act_<AD_ACCOUNT_ID>/campaigns
```

On success, you get a new ad campaign ID:

```
{
"id": "<CAMPAIGN_ID>"
}
```

There are four fields which you can normally set with [Advantage+ catalog ads](https://developers.facebook.com/docs/marketing-api/dynamic-product-ads/ads-management#adgroup) which you cannot with a catalog segment:

- `multi_share_end_card` is set to `false` by default and you cannot change
- You cannot change `description` in `template_data`
- `template_url_spec` which you can use for deeplink URLs must point to merchant's website
- [Custom tracking specs](https://developers.facebook.com/documentation/ads-commerce/marketing-api/tracking-specs) are disabled

### Step 3: View Reports  

Once the ads are running, Brand Advertisers can get metrics on how ads are performing. We have several new insights metrics at different ad object levels. See `catalog_segment_value` and related metrics for:

- [Ad Account](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/insights)
- [Ad Campaign](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group/insights)
- [Ad Set](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign/insights)
- [Ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup/insights)

`catalog_segment_value` includes a breakdown of the conversion events, including purchases, add-to-carts and view products for the catalog segment at each ad object level. It aggregates events across website, mobile and omni-channel sources. Learn more about [Estimated and In-Development Insights Metrics](https://developers.facebook.com/docs/marketing-api/insights/estimated-in-development#collaborative-ads).

### Step 4: Debug and Diagnose Issues

Brands should now troubleshoot and debug any issues running their [Advantage+ catalog ads](https://developers.facebook.com/docs/marketing-api/dynamic-product-ads) for the catalog segment.

See [Advantage+ Catalog Ads Debugging Tools](https://developers.facebook.com/docs/marketing-api/dynamic-product-ads/debugging-tools).

## Insights

The following estimated metrics are related to Collaborative Ads —see [About Estimated, In development, and Third-party metrics](https://www.facebook.com/business/help/metrics-labeling#estimated).

To query any of our reporting metrics:

- Your app needs to have `ads_management` and `business_management` permissions. See [App Review](https://developers.facebook.com/docs/app-review).
- You need to have a user access token and this user must be allowed to view reporting for the ad account in question.

Queries can be made on the following objects: ad account, ad campaign, ad set, and ad.
**Warning:** The `action_converted_product_id` breakdown is not supported on the ad account level.

| Metric | Description |
| --- | --- |
| `catalog_segment_value` | Value from conversion events, including a breakdown of purchases, add-to-carts and view products for the catalog segment at each ad object level. |
| `catalog_segment_value_omni_purchase_roas` | Total return on ad spend (ROAS) from purchases of items shared between Brand and Retailer. This number is based on information received from one or more Retailer' connected Facebook Business Tools. The amount is attributed to your ads. |
| `catalog_segment_value_website_purchase_roas` | Total return on ad spend (ROAS) from website purchases of items shared between Brand and Retailer. This number is based on information received from one or more Retailers' connected Facebook Business Tools. The amount is attributed to your ads. |
| `catalog_segment_value_mobile_purchase_roas` | The total return on ad spend (ROAS) from mobile app purchases of items shared between Brand and Retailer. This number is based on information received from one or more Retailers' connected Facebook Business Tools. The amount is attributed to your ads. |
| `catalog_segment_actions` | Similar to `catalog_segment_value`, when using this metric a breakdown of actions is given for the catalog segment at each ad object level. |
| `converted_product_value` | Value of conversions driven by your ads for a given product ID. This number is recorded by your Retailer partner's Pixel or App SDK.<br><br>The API only returns Product IDs —see [`/{product-item-id}`](https://developers.facebook.com/docs/marketing-api/reference/product-item) for information. If you want to get brand names as well, please use Ads Manager. |
| `converted_product_quantity` | Quantity of conversions driven by your ads for a given product ID. This number is recorded by your Retailer partner's Pixel or App SDK.<br><br>The API only returns Product IDs —see [`/{product-item-id}`](https://developers.facebook.com/docs/marketing-api/reference/product-item) for information. If you want to get brand names as well, please use Ads Manager. |

### Breakdowns
Breakdowns are used to group your insights results into different sets —see [Breakdowns](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights/breakdowns). You can use following breakdowns with Collaborative Ads metrics:

- **Date:** Get insights for a specific date range. To use this breakdown, add `time_range` to your query. For example: `&time_range[since]=2020-03-01&time_range[until]=2020-04-01`.

- **Product Level:** Get insights for a specific product. Use this breakdown for `converted_product_value` and `converted_product_quantity metrics` by adding `&action_breakdowns=action_converted_product_id` to your query.

#### Combining Breakdowns
Use the following combining breakdowns for Collaborative Ads:
**Warning:** The `action_converted_product_id` breakdown is not supported on the ad account level.

- `action_converted_product_id`
- `action_type`, `action_converted_product_id`
