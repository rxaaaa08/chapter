<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/overview/performance-recommendations | Saved: 2026-09-19 -->

# Opportunity Score and Recommendations



[Opportunity score](https://www.facebook.com/business/help/804913634782260) and [recommendations](https://www.facebook.com/business/help/2086509315182746) enable advertisers to discover and implement best practices that can optimize their ad campaigns with Meta. This guide will help you understand the components of opportunity score and how to integrate them with your application.

Opportunity score is a tool for understanding how well-optimized an ad account is for achieving optimal performance and generates recommendations that could improve performance. It consists of two parts:

1. Your opportunity score (range: 0–100) — Reflects how optimized your ad account is. A higher score indicates better optimality and a greater likelihood of improved performance over time.
- Opportunity score is provided as a [field of an ad account](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account#fields).
- Opportunity score is updated in near real-time in response to campaign changes and the application of available recommendations.

2. Recommendations — Experimentally-proven best practices that are personalized to each ad account. They may relate to your campaigns, ad sets, or ads, and have been rigorously tested to show they can deliver statistically significant performance improvements.\*
- Implementing recommendations will improve setup and increase opportunity score.
- Recommendations have assigned point values based on how much each is expected to improve your campaign performance.\*
- You may see recommendations related to a variety of categories including campaign objectives and goals, audience, automation, creative, and placements, budget, and bidding, or signals.

\* **Note:** Meta is frequently testing new types of recommendations on the Ads Manager Web UI. Under certain circumstances, there could be fewer recommendations returned by the API versus what is shown in Ads Manager.

By applying performance recommendations from Meta, you agree to the [Facebook Terms of Service](https://www.facebook.com/legal/terms) including your obligation to comply with the [Self-serve ad terms](https://www.facebook.com/legal/self_service_ads_terms), the [Commercial terms](https://www.facebook.com/legal/commercial_terms), and the [Facebook Advertising Policies](https://www.facebook.com/policies/ads).

## Supported inventory and APIs

### Fetching recommendations

To fetch all the recommendations available for your ad account, make a `GET` request to the `/act_<AD_ACCOUNT_ID>/recommendations` endpoint where `<AD_ACCOUNT_ID>` is the ID for your Meta ad account. Alternatively, you can fetch all the recommendations available for ad accounts across your [business portfolio](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business) by replacing `act_<AD_ACCOUNT_ID>` with `<BUSINESS_ID>`.

#### Example ad account request

```bash
curl -G \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/recommendations
```

#### Example business portfolio request

```html
curl -G \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<BUSINESS_ID>/recommendations
```

Optional query parameters for the business portfolio request.
| Name | Description |
| --- | --- |
| `ad_account_ids`<br>*list<numeric string>* | Optional. Comma-separated ad account IDs without the `act_` prefix, restricting the response to a subset of the Business's owned ad accounts. Maximum **100** per request. When supplied, pagination is disabled and all matching accounts are returned. |
| `recommendation_stages`<br>*list<string>* | Optional. Filter by recommendation lifecycle stage. Supported values include `mid_flight_recommendation` and `pre_create_guidance`. |
| `recommendation_names`<br>*list<string>* | Optional. Filter to specific recommendation names in lowercase snake case, such as `fragmentation` and `aplusc_standard_enhancements_bundle`. |
| `locale`<br>*string* | Optional. Locale for human-readable strings inside `recommendation_content`, such as `en_US`. Defaults to the viewer's locale. |
| `fields`<br>*list<string>* | Optional. API field expansion. Use `recommendation_content` to include the `lift_estimate` and `body` strings, which are omitted by default. |
| `limit`<br>*integer* | Optional. Page size for ad-account-level cursor pagination. Default `25`, maximum `100`. Ignored when `ad_account_ids` is supplied. |
| `after` / `before`<br>*cursor string* | Optional. Cursors returned in `paging.cursors` on the previous response. |

\* Note: There are a few limitations for a Business ID:

- Returns recommendations only for ad accounts **owned** by the Business ID.
- Pagination is at the business account level, with a maximum of 100 ad accounts per page. Supplying `ad_account_ids` disables pagination, with a maximum of 100 IDs per request.

#### Example response

On success, your app receives a list of recommendations that Meta has generated. If this list is empty, Meta has not identified any changes that can be made to increase the ad performance in your ad account.

```json
{
  "data": [
    {
      "recommendations": [
       {
         "recommendation_signature": "1234567",
         "recommendation_stage": "mid_flight_recommendation",
         "recommendation_time": "2026-04-02T23:12:34+0000",
         "type": "MUSIC",
         "object_ids": ["7656787679008", "2345678765423", ...],
         "recommendation_content": {
          "lift_estimate": "Up to 3% more Traffic",
          "body": "2 of your ad sets have similar objectives and creatives..",
          "opportunity_score_lift": "14"
        },
         "url": "https://adsmanager.facebook.com/adsmanager/...."
      }
    ],
   }
  ]
  ...
}
```

```json
{
  "data": [
    {
      "ad_account_id": "1234567890",
      "opportunity_score": 78,
      "recommendations": [
        {
          "recommendation_name": "reels_pc_recommendation",
          "recommendation_stage": "mid_flight_recommendation",
          "level": "ad_set",
          "object_ids": ["9876543210"],
          "recommendation_signature": "7720466",
          "recommendation_time": "2026-05-15T08:32:11+0000",
          "opportunity_score_lift": "26",
          "url": "https://adsmanager.facebook.com/adsmanager...",
          "recommendation_content": {
            "lift_estimate": "Up to 8% lower cost per result",
            "body": "Using full-screen 9:16 video..."
          }
        }
      ]
    }
  ],
  "paging": {
    "cursors": {
      "before": "...",
      "after": "..."
    },
    "next": "https://graph.facebook.com/...",
    "previous": "https://graph.facebook.com/..."
  }
}
```

#### Fields

##### Ad-account-level fields

| Name | Description |
| --- | --- |
| `ad_account_id` | Available on Business-level requests only. The ad account ID that the recommendations apply to. |
| `opportunity_score` | Available on Business-level requests only. Current opportunity score from 0 to 100. Omitted if no score is available. |
| `recommendations` | List of recommendations for the ad account. |

##### Recommendation-level fields

| Name | Description |
| --- | --- |
| `recommendation_signature` | Unique identifier for this recommendation. Required to refer to this recommendation in the recommendation application API.<br><br>Recommendations are refreshed periodically. A `recommendation_signature` may become invalid if the recommendation is no longer applicable.<br><br>For recommendations that cannot be resolved in the API, this value will not be returned. |
| `recommendation_stage` | The stage for this recommendation. The stage provides information on the step of the lifecycle of a recommendation.<br><br>The list of recommendations:<br><br>- **pre_create_guidance** - Account-level recommendations that surface opportunities for creating new campaigns. These appear before entering a creation or editing flow.<br>- **pre_flight_recommendation** - Recommendations provided during the ad creation or editing flow, on draft objects. These help optimize campaign, ad set, or ad configuration before publishing.<br>- **mid_flight_recommendation** - Recommendations for active, running ad objects. These identify optimization opportunities or issues with published campaigns, ad sets, or ads. |
| `recommendation_time` | The timestamp in ISO 8601 of when the recommendation is created. Generally, recommendations have an expiration time. Stale or old recommendations cannot be applied and will fail during apply. |
| `recommendation_name` | Available on Business-level requests only. Recommendation name, such as `fragmentation`. |
| `type` | Available on Ad Account requests only. Enum value denoting what type of recommendation this is. Description of what each possible value means and what applying them entails is provided in the [Applying recommendations](#applying-recommendations) section below. |
| `level` | Available on Business-level requests only. Object level: `ad`, `ad_set`, `campaign`, or `ad_account`. |
| `object_ids` | List of ads objects that pertain to this recommendation. May be a campaign, ad set, or ad. |
| `lift_estimate` | Describes the estimated performance improvement that could be seen in accepting a given recommendation. |
| `body` | This is a description of the recommendation similar to the descriptions listed in the [Performance recommendation types](#performance-recommendation-types) section below. |
| `opportunity_score_lift` | This is the lift in opportunity score (number of points) that would be expected from applying this recommendation. |
| `url` | This is the URL that links directly to the user flow in Ads Manager to apply the recommendation. |

### Applying recommendations

There are three options for MAPI powered apps to enable users to apply recommendations for improving opportunity scores. Which option is right for your application will depend on the experience you want to deliver to your user.

#### Option 1: Apply via Deep Link URL to Ads Manager

Each recommendation includes a URL to Ads Manager where your user can review and apply changes directly. This is the simplest path and is ideal for apps that do not traditionally perform campaign management functions such as reporting focused solutions like dashboards.

#### Option 2: Apply via API

For recommendations that support it, use the `POST /act_<AD_ACCOUNT_ID>/recommendations` endpoint to apply changes directly to the ad account. This is ideal for apps that already support campaign management functionality and want to provide a one-click apply experience such as toggling Advantage+ settings for a set of campaigns.

#### Option 3: Apply via custom workflow using campaign management APIs

Use the ad object IDs returned with each recommendation to build a custom workflow to draft the changes to be made and use standard Campaign, Ad Set, and Ad APIs to POST the changes. This is ideal for apps that already perform campaign management functions where users expect granular control to draft, review, and publish changes. An example of this is launching a native budget reallocation workflow for determining the precise budget adjustments to make.

#### Apply via API details

To apply a recommendation for your ad account, make a `POST` request to the `/act_<AD_ACCOUNT_ID>/recommendations` endpoint where <AD_ACCOUNT_ID> is the ID for your Meta ad account.

**Note:** All requests require a `recommendation_signature` field which is obtained from the recommendation object.

#### Example request

```bash
curl -X POST \
  -d 'access_token=<ACCESS_TOKEN>' \
  -d 'recommendation_signature="1234567"' \
  -d 'extra_data={"object_selection": "7656787679008"}' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/recommendations
```

#### Example response

On success, your app receives a Boolean value denoting whether the recommendation was successfully applied. If it was not successfully applied, your ad objects will remain unchanged.

```json
{
  "success": true
}
```

---

#### Recommendation-specific parameters

The following sections document the input parameters for applying various recommendation types via the Graph API. Parameters are passed in the `extra_data` object.

##### ADVANTAGE_PLUS_AUDIENCE

This recommendation enables Advantage+ Audience targeting on your ad sets, allowing Meta's AI to automatically find the best audiences for your ads beyond your initial targeting settings to improve performance.

All ad set IDs are derived from the recommendation target. No input parameters required.

```json
{
  "recommendation_signature": "12345",
  "extra_data": {}
}
```

##### APLUSC_STANDARD_ENHANCEMENTS_BUNDLE

This recommendation suggests enabling Advantage+ Creative Standard Enhancements on ads to automatically optimize ad creatives. Standard Enhancements uses machine learning to dynamically adjust creative elements for better performance.

| Parameter | Type | Description |
| --- | --- | --- |
| `object_selection` | string (optional) | Comma-separated list of ad IDs to enable Standard Enhancements on. If not provided, defaults to all ad IDs from the recommendation target. Maximum: Must not exceed the number of recommended ad IDs. |
| `creative_feature_opt_in_overrides` | string (optional) | JSON array of creative feature opt-in overrides for specific ads. Each object contains:<br><br>- ad_id: string - The ad ID<br>- opted_in_creative_feature_names: array< string > - List of creative feature names to opt in.<br><br>Possible values include: image_templates, image_touchups, text_optimizations, video_auto_crop, video_uncrop, standard_enhancements.<br><br>Note: standard_enhancements must be included alongside any other feature. |

```json
{
  "recommendation_signature": "12345",
  "extra_data": {
    "object_selection": "123456789",
    "creative_feature_opt_in_overrides": "[{\"ad_id\": \"123456789\", \"opted_in_creative_feature_names\": [\"standard_enhancements\"]}]"
  }
}
```

##### AUTOFLOW_OPT_IN

This recommendation suggests enabling Autoflow creative features on ads to automatically optimize ad creatives. Autoflow uses machine learning to dynamically adjust creative elements for better performance.

| Parameter | Type | Description |
| --- | --- | --- |
| `object_selection` | string (optional) | Comma-separated list of ad IDs to enable Autoflow creative features on. If not provided, defaults to all ad IDs from the recommendation target. |

```json
{
  "recommendation_signature": "12345",
  "extra_data": {
    "object_selection": "123456789,987654321,456789123"
  }
}
```

##### AUTOMATIC_PLACEMENTS

This recommendation enables Advantage+ Placements (automatic placements) on your ad sets, allowing Meta to automatically show your ads across all available placements (Facebook, Instagram, Messenger, Audience Network) to maximize performance.

All ad set IDs are derived from the recommendation target. No input parameters required.

```json
{
  "recommendation_signature": "12345",
  "extra_data": {}
}
```

##### BACKGROUND_GENERATION

This recommendation enables AI-powered background generation for your ad creatives. When enabled, Meta's generative AI will automatically create contextual backgrounds for your product images to improve visual appeal and ad performance.

| Parameter | Type | Description |
| --- | --- | --- |
| `action_type` | string (required) | The action to perform on the creative feature. Valid values: "OPT_IN", "OPT_OUT" |
| `object_selection` | string (required) | Comma-separated list of ad IDs to apply the background generation feature to. |

```json
{
  "recommendation_signature": "12345",
  "extra_data": {
    "action_type": "OPT_IN",
    "object_selection": "123456789,987654321"
  }
}
```

##### CONVERSION_LEADS_OPTIMIZATION

This recommendation helps improve the quality of leads generated by your campaigns. When applied, it duplicates your existing ad sets and ads with an optimized goal focused on finding higher-quality leads that are more likely to convert.

All ad set IDs are derived from the recommendation target. No input parameters required.

```json
{
  "recommendation_signature": "12345",
  "extra_data": {}
}
```

##### CREATIVE_FATIGUE

This recommendation helps refresh ads that are showing signs of creative fatigue, where audiences have seen the same creative too many times and engagement is declining. When applied, it uses generative AI to create new creative variations for your ads.

| Parameter | Type | Description |
| --- | --- | --- |
| `object_selection` | string (optional) | Comma-separated list of ad IDs to refresh with new generative AI creative variations. If not provided, defaults to all ad IDs from the recommendation target. |

```json
{
  "recommendation_signature": "12345",
  "extra_data": {
    "object_selection": "123456789,987654321"
  }
}
```

##### LANDING_PAGE_VIEW_OPTIMIZATION_GOAL

This recommendation changes your ad set's optimization goal to Landing Page Views. Instead of optimizing for link clicks, your ads will be shown to people more likely to wait for your website to load, resulting in higher-quality traffic.

All adset IDs are derived from the recommendation target. No input parameters required.

```json
{
  "recommendation_signature": "12345",
  "extra_data": {}
}
```

##### MUSIC

This recommendation adds music and audio features to your ads to make them more engaging. Music can help capture attention and improve ad recall, especially in Reels and Stories placements.

| Parameter | Type | Description |
| --- | --- | --- |
| `object_selection` | string (optional) | Comma-separated list of ad IDs to enable music audio features on. If not provided, defaults to all ad IDs from the recommendation target. |

```json
{
  "recommendation_signature": "12345",
  "extra_data": {
    "object_selection": "123456789,987654321,456789123"
  }
}
```

##### PERFORMANT_CREATIVE_REELS_OPT_IN

This recommendation adds Facebook Reels and Instagram Reels placements to your ad sets to reach more people through short-form video content. Reels placements can help you connect with audiences who consume vertical, full-screen video content.

| Parameter | Type | Description |
| --- | --- | --- |
| `object_selection` | string (optional) | Comma-separated list of ad set IDs to add Reels placements to. Skips ad sets with automatic placements enabled. If not provided, defaults to all ad set IDs from the recommendation target. |

```json
{
  "recommendation_signature": "12345",
  "extra_data": {
    "object_selection": "123456789,987654321"
  }
}
```

##### PRODUCT_SET_BOOSTING

This recommendation enables Product Set Expansion for your catalog ads. When enabled, your ads can show products from your broader catalog beyond your specified product set, helping reach more potential customers with relevant products they're likely to be interested in.

All ad IDs are derived from the recommendation target. No input parameters required.

```json
{
  "recommendation_signature": "12345",
  "extra_data": {}
}
```

##### SCALE_GOOD_CAMPAIGN

This recommendation helps you scale high-performing campaigns and ad sets by increasing their budgets. Based on performance data, it identifies opportunities where additional budget could help you reach more people and improve results.

| Parameter | Type | Description |
| --- | --- | --- |
| `adsets` | string (optional) | JSON array of ad set budget adjustments for ad sets not using campaign budget optimization. Each object contains: ad_object_id (string) and additional_budget (int, in cents e.g., 6000 = $60). Cannot be used for ad sets under campaigns with Advantage Campaign Budget enabled. |
| `campaigns` | string (optional) | JSON array of campaign budget adjustments for campaigns using Advantage Campaign Budget. Each object contains: ad_object_id (string) and additional_budget (int, in cents e.g., 6000 = $60). |

```json
{
  "recommendation_signature": "12345",
  "extra_data": {
    "adsets": "[{\"ad_object_id\": \"123456789\", \"additional_budget\": 6000}]",
    "campaigns": "[{\"ad_object_id\": \"111111111\", \"additional_budget\": 10000}]"
  }
}
```

##### SHOPS_ADS_SAOFF

This recommendation transforms your existing ad sets into Shops ads, which allows some customers to browse and build a cart of your products directly within the Facebook or Instagram app. Checkout still happens on your website.

| Parameter | Type | Description |
| --- | --- | --- |
| `object_selection` | string (optional) | Comma-separated list of ad set IDs to transform into Shop ads. If not provided, all ad sets from the recommendation will be transformed. Invalid IDs (not in recommendation) will return an error. |

```json
{
  "recommendation_signature": "12345",
  "extra_data": {
    "object_selection": "123456789,987654321"
  }
}
```

##### UNCROP_IMAGE

This recommendation enables image expansion (uncropping) using generative AI. When applied, Meta's AI will automatically extend your images to fill different aspect ratios, ensuring your ads look great across all placements without cropping important content.

| Parameter | Type | Description |
| --- | --- | --- |
| `object_selection` | string (optional) | Comma-separated list of ad IDs to enable image expansion on. Skips ads that already have image expansion enabled. If not provided, defaults to all ad IDs from the recommendation target. |

```json
{
  "recommendation_signature": "12345",
  "extra_data": {
    "object_selection": "123456789,987654321"
  }
}
```

#### Deprecated: Legacy parameters format

> **DEPRECATION NOTICE**: The following parameters format is deprecated. Please use the `extra_data` object format documented in the recommendation-specific sections below.

The legacy recommendation application API supports the following parameters.

| Name | Description |
| --- | --- |
| `recommendation_signature`<br><br>string | **Required.**<br>Signature provided in the recommendation fetching API, which corresponds to a unique recommendation. |
| `music_parameters`<br><br>object | **Optional.**<br>Music recommendation parameters. Specific parameters are listed below. |
| `autoflow_parameters`<br><br>object | **Optional.**<br>Autoflow opt-in recommendation parameters. Specific parameters are listed below. |
| `fragmentation_parameters`<br><br>object | **Optional.**<br>Fragmentation recommendation parameters. Specific parameters are listed below. |

##### The `music_parameters` object
| Name | Description |
| --- | --- |
| `object_selection`<br><br>array of numeric strings | **Optional.**<br>A list of ad IDs to apply the music recommendation to. List must be a subset of provided IDs in `object_ids`. |

##### The `autoflow_parameters` object
| Name | Description |
| --- | --- |
| `object_selection`<br><br>array of numeric strings | **Optional.**<br>A list of ad IDs to apply the autoflow opt-in recommendation to. List must be a subset of provided IDs in `object_ids`. |

##### The `fragmentation_parameters` object
| Name | Description |
| --- | --- |
| `object_selection`<br><br>array of numeric strings | **Optional.**<br>A list of ad set IDs to apply the fragmentation recommendation to. List must be a subset of provided IDs in `object_ids`. |

### Performance recommendation types

These are the currently supported performance recommendation types and what happens when the recommendation is successfully applied.

| Name | Description |
| --- | --- |
| `ADVANTAGE_PLUS_AUDIENCE` | Leverage Advantage+ audiences to let Meta automatically identify and target the most relevant audience segments for your ad sets, optimizing your budget for maximum impact. Learn more about [Advantage+ Audiences](https://www.facebook.com/business/help/273363992030035). |
| `ADVANTAGE_PLUS_CATALOG_ADS` | Recommends adoption of Advantage+ Catalog Ads to Ad Accounts with an active catalog but not using Advantage+ Catalog Ads |
| `APLUSC_ADD_OVERLAYS` | Recommends enabling Advantage+ Overlays for eligible Ads which are currently opted out |
| `APLUSC_STANDARD_ENHANCEMENTS_BUNDLE` | Recommends enabling Advantage+ Catalog features (Overlays, Text Improvements, and Visual Touch Up) for eligible Ads which are currently opted out |
| `APLUSC_TEXT_IMPROVEMENTS` | Recommends enabling Advantage+ Text Improvements for eligible Ads which are currently opted out |
| `APLUSC_VISUAL_TOUCHUPS` | Recommends enabling Advantage+ Visual Touch-Ups for eligible Ads which are currently opted out |
| `AUTOFLOW_OPT_IN` | Enable standard enhancements, which uses Meta's data to deliver different variations of your ad when likely to improve performance.<br><br>Applying this recommendation will enable this functionality for the selected ads objects.  If no selection is provided, it will be enabled for all listed ads objects. |
| `AUTOMATIC_PLACEMENTS` | Allow Meta to automatically select additional placements for your ad sets while making the most of your budget. Learn more about [Advantage+ Placements](https://web.facebook.com/business/help/196554084569964). |
| `BACKGROUND_GENERATION` | Help your products stand out by using AI-generated backgrounds with eligible product images to show the version that's likely to perform best. |
| `BUDGET_LIMITED` | Your current budget may be limiting the performance of your campaigns. You could get more results by increasing the budget. |
| `CAPI_CRM_GUIDANCE_V2` | Recommends setting up CRM data integration with Conversions API to ad accounts running campaigns to capture leads via instant form |
| `CAPI_CRM_SETUP` | Recommends finishing setup of CRM data integration with Conversions API to ad accounts running campaigns to capture leads via instant form |
| `CAPI_PERFORMANCE_MATCH_KEY_V2` | Recommends sending Conversions API more complete event/match-key data when event match quality is low |
| `CONVERSION_LEADS_OPTIMIZATION` | Choose "Maximize number of conversion leads" as your performance goal to help lower the cost of reaching people most likely to convert. |
| `CREATIVE_FATIGUE` | Cost per result for this ad set may be higher than ads you ran in the past because its image or video has been shown to parts of your audience too many times.<br><br>Applying this recommendation requires an ad ID and creative ID, and will create a copy of the provided ad, except with the provided new creative. |
| `CREATIVE_LIMITED` | Cost per result for this ad set may be higher than ads you ran in the past because its image or video has been shown to parts of your audience too many times.<br><br>Applying this recommendation requires an ad ID and creative ID, and will create a copy of the provided ad, except with the provided new creative. |
| `CTX_CREATION_PACKAGE` | This pre-create guidance recommends CTX creation package in Account Overview surface. When adopted, users will be re-directed to open CTX creation package. |
| `FRAGMENTATION_V3` | Recommends consolidating ad sets to improve liquidity when 2 or more have similar variables, such as objective, audience, or creative, while some variables differ. |
| `GEN_AI_MVP` | The GenAI MVP recommendation in Ads Manager suggests AI-generated creative variations to help advertisers improve ad performance. It proactively surfaces creative options based on eligibility criteria and encourages adoption of AI-enhanced assets during ad creation and editing (PFR) and can also recommend updates after the ad is live and running (MFR) |
| `LANDING_PAGE_VIEW_OPTIMIZATION_GOAL` | Create a campaign with the performance goal of "Maximize landing page views" to deliver ads to audiences who are most likely to visit your website. |
| `MESSAGING_EVENTS` | This pre-create guidance recommends Messaging events in Account Overview surface. When adopted, users will open a help doc about messaging events. |
| `MESSAGING_PARTNERS` | This pre-create guidance recommends advertisers running Click-to-Messenger and IG Direct ads to use Meta Messaging partners to improve performance and manage high messages volume. Will redirect advertisers to Partner Showcase when Meta Approved partners can be found. |
| `MULTI_TEXT` | Select more text options so they can be mixed and matched to create different versions of your ad. The version that may perform best will be shown for each placement. |
| `MUSIC` | Allow Meta to automatically select and add music to your ads, at no cost to you, based on their content.<br><br>Applying this recommendation will enable this functionality for the selected ads objects.  If no selection is provided, it will be enabled for all listed ads objects.<br><br>Use of music in your ads is subject to the [Sound Collection Terms](https://facebook.com/sound/collection/terms). |
| `OFFSITE_CONVERSION` | Select the "Maximize number of conversions" performance goal to help drive new customers to your website and lower your cost per result. |
| `PARTNERSHIP_ADS` | Recommends including a partnership ad in your campaign to help improve performance. |
| `PERFORMANT_CREATIVE_REELS_OPT_IN` | Select "Reels" placements for ads already using media that works well in Reels placements, so people are more likely to interact with them. |
| `PIXEL_OPTIMIZATION_HIE` | Recommends advertisers with unoptimized Meta Pixels enable high intent events to be sent for improving performance |
| `PIXEL_UPSELL` | Connect your website using Meta Pixel to help improve audience targeting, better understand your conversions, and help reduce your cost per result over time. |
| `PRODUCT_SET_BOOSTING` | Recommends enabling Product Set Expansion for advertisers running Advantage Plus Catalog, enabling Meta to show products from your broader catalog beyond your specified product set. |
| `SCALE_GOOD_CAMPAIGN` | Some ad sets or campaigns have had stable delivery and a lower cost per result compared to ad sets and campaigns with the same optimization goal that you or your peers have run. Increase their budgets to further scale your results. |
| `SHOPS_ADS_SAOFF` | Improve your ad performance by selecting "Website" and "Shop" conversion locations for ad sets currently using the Website conversion location. This lets you automatically send traffic either to your website or shop on Facebook or Instagram. |
| `SIGNALS_GROWTH_CAPI_V2` | Recommends advertisers using only the Meta Pixel adopt Conversions API |
| `UNCROP_IMAGE` | Expand your images to fit more placements. You can use generated images that expand the aspect ratios of your media, which can fit your ad into new placements and show them to more people.<br><br>Applying this recommendation will enable this functionality for the selected ads objects.  If no selection is provided, it will be enabled for all listed ads objects. |
| `UNIFIED_INBOX` | Answer unread customer messages within 5 hours of receipt to help increase their value. |
| `VALUE_OPTIMIZATION_GOAL` | Reach people more likely to generate higher value for your business by focusing on key events across the customer journey, like "Add to cart". Use the "Maximize value of conversions" performance goal to get started. |
| `WA_MESSAGING_PARTNERS` | This pre-create guidance recommends advertisers running Click-to-WhatsApp ads to use WhatsApp business partners to improve performance and manage high messages volume. Will redirect advertisers to Partner Showcase when Meta Approved partners can be found. |

## Best practices for querying ads

### Use time range filters

When querying for ads using the Marketing API, it is highly recommended to always apply a time range filter to your requests. This best practice ensures that your queries are efficient, performant, and return only the relevant data you need. By specifying a time range, you reduce the amount of data processed and transferred, which helps avoid unnecessary load on the system and improves response times.

For example, when using an API endpoint such as `/{ad-account-id}/ads`, you should include parameters that define the `start` and `end` dates for your query. This not only aligns with the performance recommendations outlined in this guide, but also helps you avoid common pitfalls like timeouts or excessive data retrieval.

#### Example request

```bash
curl -G \
  -d "access_token=<ACCESS_TOKEN>" \
  -d "limit=200" \
  -d "effective_status=['ACTIVE','PAUSED']" \
  -d "fields=id,name,created_time,updated_time" \
  -d "time_range={'since':'2025-12-01','until':'2025-12-15'}" \
  -d "summary=true" \
"https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads"
```

In this example, the `time_range` parameter restricts the results to ads active between December 1, 2025, and December 15, 2025. Always tailor the time range to your specific use case to maximize query performance and relevance.
