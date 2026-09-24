<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/instagramads/get-started | Saved: 2026-09-19 -->

# Get Started



With Marketing API you can create, measure, and optimize ads on Instagram in the main **Stream**, in **Stories**, the **Explore** tab, and in **Reels**. To create your ads:

- Step 1: [Get Instagram account ID](#account-id)
- Step 2: [Create campaign](#campaign)
- Step 3: [Create ad set](#adset) - Pick a `placement` that includes Instagram. Include both Facebook and Instagram so the system automatically delivers ads to the best audiences on both platforms.
- Step 4: [Provide ad creative](#creative)
- Step 5: [Schedule Delivery](#ad)

Be aware that:

- Instagram ads do not support all Facebook ads objectives.
- Not all creative formats supported by Facebook work on Instagram.

**Note:** To use Instagram and Facebook posts as ads, see [Use Posts as Instagram Ads](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/use-posts-as-ads).

## Step 1: Get Instagram account ID {#account-id}

You need to know your Instagram account's ID before you start creating ads. Depending on your account's type, you have different ways of getting an account ID:

| Type of Instagram Account | How To Find Account ID |
| --- | --- |
| Business Manager Instagram Account (Recommended) - [Implementation Guide](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/ig-accounts-with-business-manager) | See [Set Up Instagram Accounts On Business Manager, Get Associated Accounts](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/ig-accounts-with-business-manager#account_api). Save the ID to use in your ads. |
| Page-Connected Instagram Accounts - [Implementation Guide](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/pages-ig-account#via_page) | See [Set Up Instagram Accounts With Pages, Get Account ID](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/pages-ig-account#get-account-id). Save the ID to use in your ads. |
| Page-Backed Instagram Account -  [Implementation Guide](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/pages-ig-account#pbia) | See [Set Up Instagram Accounts With Pages, Read PBIA](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/pages-ig-account#read). Save the ID to use in your ads. |

## Step 2: Create Ad Campaign {#campaign}

Creating ad objects for Instagram is the same as it is for Facebook ads. To start, [create a Facebook Ad Campaign](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad-campaign) and specify your objective.

Instagram compatible objectives vary according to your chosen ad placement:

| Ad Placement | Compatible Objectives |
| --- | --- |
| Ads in Explore | `BRAND_AWARENESS`, `REACH`, `LINK_CLICKS`, `POST_ENGAGEMENT`, `APP_INSTALLS`, `VIDEO_VIEWS`, `LEAD_GENERATION`, `MESSAGES`, `CONVERSIONS`, and `PRODUCT_CATALOG_SALES` |
| Ads in Instagram Explore home | `BRAND_AWARENESS`, `REACH`, `LINK_CLICKS`, `APP_INSTALLS`, `VIDEO_VIEWS`, `LEAD_GENERATION`, `MESSAGES` and `CONVERSIONS`. |
| Ads in Instagram profile feed | `BRAND_AWARENESS`, `REACH`, `LINK_CLICKS`, `POST_ENGAGEMENT`, `APP_INSTALLS`, `VIDEO_VIEWS`, `MESSAGES`, `CONVERSIONS`, and `STORE_TRAFFIC` |
| Ads in Instagram search results | `BRAND_AWARENESS`, `REACH`, `LINK_CLICKS`, `POST_ENGAGEMENT`, `APP_INSTALLS`, `VIDEO_VIEWS`, `LEAD_GENERATION`, `CONVERSIONS`, and `PRODUCT_CATALOG_SALES` |
| Reels ads | `BRAND_AWARENESS`, `REACH`, `LINK_CLICKS`, `APP_INSTALLS`, `VIDEO_VIEWS`, `MESSAGES` and `CONVERSIONS` |
| Story ads | `BRAND_AWARENESS`, `REACH`, `LINK_CLICKS`, `APP_INSTALLS`, `VIDEO_VIEWS`, `LEAD_GENERATION`, `MESSAGES`, `CONVERSIONS`, `PRODUCT_CATALOG_SALES`, and `STORE_TRAFFIC` |
| Stream ads | `BRAND_AWARENESS`, `REACH`, `LINK_CLICKS`, `POST_ENGAGEMENT`, `APP_INSTALLS`, `VIDEO_VIEWS`, `LEAD_GENERATION`, `MESSAGES`, `CONVERSIONS`, `PRODUCT_CATALOG_SALES`, and `STORE_TRAFFIC` |

The minimum spend budget on Instagram is the same as the one for Facebook self-serve ads, with different [limits per currency](https://developers.facebook.com/documentation/ads-commerce/marketing-api) and [limits based on `bid_amount`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign#Creating).

**Note:** [Learn about default placements for your ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/placement-targeting) and [`instagram_positions`.](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/placement-targeting#newplacement)

For Reach And Frequency campaigns, see [Instagram Reach And Frequency](https://developers.facebook.com/docs/marketing-api/reachandfrequency#instagram-reach---frequency).

## Step 3: Create Ad Set {#adset}

[Create an ad set](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad-set) with the desired:

- [Optimization Goal](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview#opt): Your goal options depend on the objective set at the campaign level. Check our [validation rules](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group#objective-validation).
- [Targeting Options](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference): You can use all [Facebook targeting options](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference) for Instagram campaigns, including Facebook's native [basic targeting options](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/basic-targeting), [Custom Audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience), and [Lookalike Audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/lookalike-audiences).
- [Budget](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview/budgets)
- [Billing Event](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview/billing-events): The `billing_event` depends on which `optimization_goal` you choose. Check our [validation rules](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview#opt-goal-validation).
- [Schedule](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview/pacing-and-scheduling)

For `APP_INSTALLS` and `CONVERSIONS` campaigns, a `promoted_object` is also required at the ad set level.

If you create a [Reach and Frequency](https://developers.facebook.com/docs/marketing-api/reachandfrequency) ad set, set `rf_prediction_id`. The `destination_ids` of the Reach Frequency Prediction must contain the Instagram account ID.

### Placement {#targeting}

To deliver ads to Instagram, include `instagram` under [`publisher_platforms`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/placement-targeting#newplacement) in your ad set. You can use Instagram `stream`, `story`, `explore`, `reels`, `explore_home`, and `ig_search` placements, or you can enable multiple platforms including Instagram's placements. If you choose multiple platforms, Facebook optimizes delivery based on your target audience on each platform with [Placement Optimization](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/placement-targeting).

* To show ads exclusively in Stream or Stories specify `stream` or `story` in the `instagram_positions` field.
* Instagram displays ads using `"instagram_positions":["story"]` in both the Instagram Desktop and Mobile web feeds.
* If you want to display your ads in Instagram's **Explore** tab you must include both `stream` and `explore` as placements.
* If you want to display your ads on Instagram's **Explore home** placement you must include both `stream` and `explore` as placements.
* If you want to display your ads on Instagram's **search results** placement you must include `stream` as a placement.
* Instagram Web Feeds ads use the `stream` placement and are checked for web eligibility to be delivered to both desktop and mobile web feeds. The compatible objectives are `BRAND_AWARENESS`, `REACH`, `LINK_CLICKS`, `POST_ENGAGEMENT`, `VIDEO_VIEWS`, and `CONVERSIONS`.

If `instagram_positions` is not specified, ads are delivered to all available Instagram placements.

**Note:** To deliver ads only to Instagram Stories, use `story` only inside `instagram_positions`. In this case, you should also have `instagram` as the only value for `publisher_platforms`.

### Examples

Create an ad set with Instagram as placement:

```
curl \
  -F 'name=Instagram Adset' \
  -F 'optimization_goal=LINK_CLICKS' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'bid_amount=2' \
  -F 'daily_budget=1000' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'targeting={
    "geo_locations": {"countries":["US"]},
    "publisher_platforms": ["instagram"],
    "user_os": ["iOS"]
  }' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

Create an ad set with Instagram Explore home as a targeted placement:

```
curl \
  -F 'name=Instagram Adset' \
  -F 'optimization_goal=LINK_CLICKS' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'bid_amount=2' \
  -F 'daily_budget=1000' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'targeting={
    "geo_locations": {"countries":["US"]},
    "publisher_platforms": ["instagram"],
    "instagram_positions": ["stream", "explore", "explore_home"],
    "user_os": ["iOS"]
  }' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

Create an ad set with Instagram search results as a targeted placement:

```
curl \
  -F 'name=Instagram Adset' \
  -F 'optimization_goal=LINK_CLICKS' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'bid_amount=2' \
  -F 'daily_budget=1000' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'targeting={
    "geo_locations": {"countries":["US"]},
    "publisher_platforms": ["instagram"],
    "instagram_positions": ["stream", "ig_search"],
    "user_os": ["iOS"]
  }' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

## Step 4: Provide Ad Creative {#creative}

At this point, you should [provide your ad creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad-creative). For creatives to be used on Instagram only or mixed placements, you need to supply your [Instagram account ID](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/instagramads/get-started#account-id) and your Facebook Page ID. Your page information does not appear anywhere on your Instagram ad. If the Instagram account is connected to a Page, or is a Page-backed Instagram Account, the same Page needs to be used.

When you provide ad creative, an unpublished post is created. You can see the unpublished post from the page when you query [promotable feed](https://developers.facebook.com/docs/graph-api/reference/page/feed) using the Page ID.

### Relevant Guides

- [Use Posts as Instagram Ads](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/use-posts-as-ads)
- [Add Optional Call-To-Action](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/call-to-action)
- [Get Ad Preview](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/get-ad-preview)
- [Instagram Advantage+ Catalog Ads](https://developers.facebook.com/docs/instagram/ads-api/guides/dynamic-ads)
- [Carousel Ads](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/carousel-ads): You can create carousel ads with [Ads Manager](https://business.facebook.com/adsmanager/manage) as well as the API.
- [Customize Stories](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/customize-stories)
- [Add Interactive Elements](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/add-interactive-elements)

## Step 5: Schedule delivery {#ad}

[Create your Ad object to link your creative to your ad set](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad).

### Ad review process {#review}

The ad review policies are the same for Facebook and Instagram. As we make Instagram available to more businesses, we want the same high-quality ad experience on Instagram that we have on Facebook.

This requires understanding more about how the community interacts with different kinds of advertiser content on Instagram. Since it takes time to build the same kind of models that drive Facebook ads, Instagram ads currently rely on human review to filter out a small percentage of ads and provide suggestions for improvement.

Our ultimate goal is to make running a campaign across Facebook and Instagram a seamless experience and to make ads a relevant, valuable part of the Instagram product.
