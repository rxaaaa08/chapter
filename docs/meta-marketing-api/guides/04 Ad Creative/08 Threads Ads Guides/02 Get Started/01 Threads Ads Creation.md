<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/threads-ads/creation | Saved: 2026-09-19 -->

# Threads Ads Creation



**Warning:** Some updates to Threads Ads are not yet available to all users.

With Marketing API you can create, measure, and optimize ads on Threads in the main feed. To create your ads:

* [Step 1: Get a Threads account ID](#step-1)
* [Step 2: Create an ad campaign](#step-2)
* [Step 3: Create an ad set](#step-3) — Pick a `placement` that includes Threads. Adding Instagram `stream` is a prerequisite if you want to select Threads `threads_stream` as a placement.
* [Step 4: Provide an ad creative](#step-4)
* [Step 5: Schedule ad delivery](#step-5)

### Limitations

* There is a 1000 character limit on captions for ads targeting Threads. If your ad is over this limit, the request to create an ad will succeed for Instagram, but it will not be delivered on Threads.
* Threads images must be at least 500px in width.
* There is a limit of 30 hashtags per ad.

## Step 1: Get a Threads account ID {#step-1}

You need to know your Threads account's ID before you start creating ads. Depending on your account's type, you have different ways of getting an account ID:

* [Instagram-associated Threads account](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/threads-ads#instagram-associated-threads-accounts) — Set up a connection from the Threads app via the OAuth flow and by [getting the Threads account ID](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/threads-ads#get-the-instagram-associated-threads-account-id). Save the returned ID to use in your ads.
* [Instagram-backed Threads account](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/threads-ads#instagram-backed-threads-accounts) — [Set up the Threads account using the API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/threads-ads#create-an-instagram-backed-threads-account), then [get the Threads account ID](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/threads-ads#get-the-instagram-backed-threads-account-id). Save the returned ID to use in your ads.

## Step 2: Create an ad campaign {#step-2}

Creating ad objects for Threads is the same as it is for Instagram and Facebook ads. To start, [create an ad campaign](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad-campaign) and specify your objective.

Threads compatible objectives vary according to your chosen ad placement:

| Ad Placement | Compatible Objectives |
| --- | --- |
| Ads in Threads Feed (`threads_stream`) | `OUTCOME_AWARENESS`, `OUTCOME_TRAFFIC`, `OUTCOME_ENGAGEMENT`, `OUTCOME_SALES` |

## Step 3: Create an ad set {#step-3}

[Create an ad set](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad-set) with the desired:

* [Optimization goal](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview#opt): Your goal options depend on the objective set at the campaign level. Check the [validation rules](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group#objective-validation).
* [Targeting options](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference): You can use all the standard targeting options for your campaigns, including the [native basic targeting options](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference), [custom audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience), and [lookalike audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/lookalike-audiences).
* [Budget](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview/budgets)
* [Billing event](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview/billing-events): The `billing_event` depends on which `optimization_goal` you choose. Check the [validation rules](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview#opt-goal-validation).
* [Schedule ad delivery](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview/pacing-and-scheduling)

### Placement

To deliver ads to Threads, include both `instagram` and `threads` under `publisher_platforms` in your ad set. Then, use the Threads `threads_stream` placement; remember you must select the Instagram `stream` placement too. If you choose multiple platforms, Meta optimizes delivery based on your target audience on each platform with [placement optimization](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/placement-targeting).

### Examples

#### Create an ad set with Threads as a placement

```html
curl \
  -F 'name=Threads Adset' \
  -F 'optimization_goal=LINK_CLICKS' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'bid_amount=2' \
  -F 'daily_budget=1000' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'targeting={
    "geo_locations": {"countries":["US"]},
    "publisher_platforms": ["instagram", "threads"],
    "user_os": ["iOS"]
  }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

#### Create an ad set with Threads `threads_stream` as a targeted placement

```html
curl \
  -F 'name=Threads Adset' \
  -F 'optimization_goal=LINK_CLICKS' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'bid_amount=2' \
  -F 'daily_budget=1000' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'targeting={
    "geo_locations": {"countries":["US"]},
    "publisher_platforms": ["instagram", "threads"],
    "instagram_positions": ["stream"],
    "threads_positions": ["threads_stream"],
    "user_os": ["iOS"]
  }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

## Step 4: Provide an ad creative {#step-4}

For creatives to be used with a Threads placement and the required Instagram placement, you need to supply your [Instagram account ID](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/instagramads/get-started#account-id) and your [Threads account ID](#step-1) and your Facebook Page ID.

When you [provide the ad creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad-creative), an unpublished post is created. You can see the unpublished post from the Page when you query the promotable feed using the Page ID. **Your Page information does not appear anywhere on your Threads ad.**

If the Threads account is associated with an Instagram account in the Business Portfolio (that is, matching usernames) or is an Instagram-backed Threads Account, that Instagram account needs to be used.

**Note:** Businesses with an Instagram-associated Threads account created before January 29, 2026, will have their Threads account automatically added to their Business Portfolio with the same user access and permissions managed from the Instagram account. Developers can continue to use the same Instagram-associated Threads account IDs as they were using prior to January 29, 2026. New Threads accounts created after January 29, 2026, will need to be manually added to the Business Portfolio and managed like other account types.

Threads ads support image, video, and carousel image ads creation (with the same steps as [Instagram ads creation](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/reference/media-requirements)). See [Media requirements](#media-requirements) for more information.

When new media setups and ad formats become compatible with Threads, both existing and newly created campaigns using them will automatically use your Threads profile or Instagram account to deliver to `threads_stream` if that placement is included. You can review and update your ad placements at any time.

### Hashtags

There is a limit of 30 hashtags per ad.

### Media requirements

#### Captions

There is a 1000 character limit on captions for ads targeting Threads. If your ad is over this limit, the request to create an ad will succeed for Instagram, but it will not be delivered on Threads. 80 to 160 characters is recommended.

**Note:** Hashtags and URLs are not supported in the caption.

#### Image requirements

##### Aspect ratio

1.91:1 to 9:16 are supported. Images with a taller ratio than 4:5 will be cropped and vertically centered to 4:5. Images with a ratio of 1.91:1 to 4:5 will not be cropped or altered.

##### Size

Threads images must be at least 500px in width.

#### Video requirements

##### Aspect ratio

1.91:1 to 9:16 are supported. Videos with a taller ratio than 4:5 will be cropped and centered to 4:5. Images with a ratio of 1.91:1 to 4:5 will not be cropped or altered.

#### Carousel requirements

##### Aspect ratio for images

1.91:1 to 9:16 are supported. Images with a ratio outside of 1:1 will be center cropped to 1:1. Images with a ratio of 1:1 will not be cropped or altered.

## Step 5: Schedule ad delivery {#step-5}

[Create your ad object](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad) to link your creative to your ad set.

### Ad preview

For Threads ads, you can get a preview of:

* [Existing ads or creatives](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/get-ad-preview#existing)
* [New ads, before adding a creative](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/get-ad-preview#before-creative)
