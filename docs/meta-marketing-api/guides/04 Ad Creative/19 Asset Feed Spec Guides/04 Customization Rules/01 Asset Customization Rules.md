<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/asset-feed-spec/asset-customization-rules | Saved: 2026-09-19 -->

# Asset Customization Rules



Use asset customization rules to define which creative assets appear in your ads. At the time of ad creation, you can pick the combination of assets you want to display, based on your asset customization rules. Examples of creative assets are images, videos, text, and ad body.

Three APIs use asset customization rules:

* [**Placement Asset Customization**](https://developers.facebook.com/documentation/ads-commerce/marketing-api/dynamic-creative/placement-asset-customization): Customize the creative assets displayed in different ad placements.
* [**Multi-Language Ads**](https://developers.facebook.com/documentation/ads-commerce/marketing-api/multi-language-ads): Customize different parts of ad creative such as the image, video, text, and body of an ad to reach speakers of different languages.
* [**Segment Asset Customization**](https://developers.facebook.com/docs/marketing-api/dynamic-creative/segment-asset-customization): Customize ad assets according to targeting types.

**Note:** All ads using `asset_feed_spec` must contain at least two target customization rules. If your creative uses `asset_feed_spec` **and** includes fewer than two rules, you will not be able to create that ad.

## Get started
- Step 1: [Create ad campaign and ad set](#campaign).
- Step 2: [Provide the ad creative](#creative).
- Step 3: [Create your ad](#ad).
- Step 4: Get [insights](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/asset-feed-spec/insights) and analyze your results.

## Step 1: Create campaign and ad set {#campaign}

You can create a [standard ad campaign](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group) for asset customization rules, but there are limitations:

| API | Supported campaign objectives |
| --- | --- |
| Segment Asset Customization | `APP_INSTALLS`, `BRAND_AWARENESS`, `CONVERSIONS`, `LINK_CLICKS`, `REACH`, `VIDEO_VIEWS`. |
| Placement Asset Customization | `APP_INSTALLS`, `BRAND_AWARENESS`, `CONVERSIONS`, `LEAD_GENERATION`, `LINK_CLICKS`, `REACH`, `VIDEO_VIEWS`. |
| Multi-Language Ads | `APP_INSTALLS`, `BRAND_AWARENESS`, `CONVERSIONS`, `LINK_CLICKS`, `REACH`, `VIDEO_VIEWS`. |

For the Ad Set, use the [standard ad set endpoint](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign) and set `is_dynamic_creative` to `false`.

To create an ad set in a campaign with `optimization_goal` set to `conversions`:

```bash
curl \
  -F 'status=PAUSED'
  -F 'name=Sample Ad Set'
  -F 'campaign_id=<CAMPAIGN_ID>'
  -F 'optimization_goal=OFFSITE_CONVERSIONS'
  -F 'is_dynamic_creative=false'
  -F 'lifetime_budget=1000'
  -F 'promoted_object={"pixel_id": "<PIXEL_ID>", "custom_event_type": "PURCHASE"}'
  -F 'billing_event=IMPRESSIONS'
  -F 'bid_strategy=LOWEST_COST_WITHOUT_CAP'
  -F 'targeting={"geo_locations": {"countries": ["US"]}}'
  -F 'start_time=2019-04-02'
  -F 'end_time=2019-04-09'
  -F 'access_token=<ACCESS_TOKEN>'
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

If you use `asset_feed_spec` with an ad set optimized for `APP_INSTALLS`, specify `link_url`, such as `https://www.example.com`. The `link_url` **must be the same as** `object_store_url` in `promoted_object`. Provide only one `link_url` parameter in `asset_feed_spec`.

**Note:** `asset_feed_spec` provides creative for [Dynamic Creative](https://developers.facebook.com/docs/marketing-api/dynamic-creative/overview), [Placement Asset Customization](https://developers.facebook.com/documentation/ads-commerce/marketing-api/dynamic-creative/placement-asset-customization), [Multi-Language Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/multi-language-ads), and [Segment Asset Customization](https://developers.facebook.com/docs/marketing-api/dynamic-creative/segment-asset-customization). The spec's format is different for each solution.

## Step 2: Provide the ad creative {#creative}

Provide your creative through `asset_feed_spec`. An asset feed is a collection of different creative elements, such as images, titles, bodies, and so on. You can specify multiple creative assets for each asset type.

Create an `asset_feed_spec` at [`/adcreative`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative). To apply customization options, set `asset_customization_rules` inside your `asset_feed_spec`.

* [Asset Feed Setup for Placement Asset Customization](https://developers.facebook.com/documentation/ads-commerce/marketing-api/dynamic-creative/placement-asset-customization#asset-feed)
* [Asset Feed Setup for Multi-Language Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/multi-language-ads#asset)
* [Asset Feed Setup for Segment Asset Customization](https://developers.facebook.com/docs/marketing-api/dynamic-creative/segment-asset-customization#add-creative)

After setup, verify your `asset_feed_spec`:

```bash
curl -G
-d "access_token=<ACCESS_TOKEN>"
-d "fields=asset_feed_spec"
https://graph.facebook.com/v25.0/<AD_CREATIVE_ID>
```

## Step 3: Create your ad {#ad}

When you create your ad, provide a reference to the creative ID. You can create multiple ads per ad set.

```bash
curl
      -F 'name=Asset Custom Rule Ad'
      -F 'adset_id=<ADSET_ID>'
      -F 'access_token=<ACCESS_TOKEN>'
      -F 'creative={
          "creative_id": <CREATIVE_ID>,
       }'
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads
```

After creation:

* Your campaign appears in [Ads Manager](https://business.facebook.com/adsmanager/manage).
* Meta reviews your ad and checks if it meets our [Advertising Policies](https://www.facebook.com/policies/ads/).
