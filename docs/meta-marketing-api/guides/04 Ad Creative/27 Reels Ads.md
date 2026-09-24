<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative/reels-ads | Saved: 2026-09-19 -->

# Reels Ads


**Warning:** **Ads Management Standard Access is now Marketing API Access Tier**

**No code changes are needed.**

Tier labels have been updated: "Standard Access" is now **Limited Access**, and "Advanced Access" is now **Full Access**. The revised qualification threshold for Full Access has been reduced from 1,500 to **500 Marketing API calls** in the past 15 days. The underlying permission identifier remains the same, and existing access levels are preserved automatically. Learn more in the [Marketing API Access Tier documentation](https://developers.facebook.com/docs/features-reference#marketing-api-access-tier).

Create a Meta ad with a focus on available reels placements and learn best practices around our ads operations.

## Prerequisites

- You have previously created a Facebook app
- You are familiar with Marketing APIs and have enabled Facebook Login

If you do not meet those prerequisites, please refer to our [developer documentation](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started).

### Sandbox Testing {#sandbox}

Meta offers a testing environment, which doesn't actually deliver ads, but allows you to:

- Add Marketing API as a product within your Meta app in the Tools section to create and edit ads using our APIs without incurring costs
- Create an ad account to use the Marketing API

Read through our [testing best practices](https://developers.facebook.com/documentation/ads-commerce/marketing-api/best-practices#testing).

## Step 1: Access Asset {#step1}

An [access token](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens) is an opaque string that identifies a user, app, or Page and can be used by the app to make graph API calls. You can see when it expires and which app generated it. Marketing API calls on Meta apps need to include an access token.

Get an access token with necessary permissions:

- `ads_management`: make changes in selected ad accounts

- `ads_read`: read out ads data

- `read_insights`: read out performance insights

Use system access tokens as they have longer expiration times.

### Additional Authorization Layer

To access Marketing API endpoints, you need to create a Business app. They are subject to an additional layer of Graph API authorization called access levels. During App Review, your app must also request specific permissions and features. You must complete Business Verification if your app will be used by app users who do not have a role on the app itself, or a role in a Business that has claimed the app.

If your app is managing other people's ad accounts, you need:

- Advanced Access `ads_read`

and/or

- Advanced Access `ads_management`

## Step 2: Fetch Ad Account

Fetch your advertisers ad account(s) and allow them to select the one for ads creation.

Through our Business Management API, you can see all the ad accounts their business has access to. This returns all ad accounts owned by a business. Note that you will need the `business_management` permission at app and user level. Refer to [Business Asset Management APIs](https://developers.facebook.com/docs/marketing-api/business-asset-management).

#### Sample Call

```
curl -G \
-d "access_token=<ACCESS_TOKEN>" \
"https://graph.facebook.com/v25.0/<BUSINESS_ID>/owned_ad_accounts"
```

## Step 3: Create Campaign

A campaign is the highest level organizational structure within an ad account and should represent a single objective for an advertiser. These objects contain your advertising objective and one or more ad sets. This helps you optimize and measure results for each advertising objective. Learn more about creating, reading, updating and deleting a campaign [here](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group).

#### Sample Call

```
curl -X POST \
  -F 'name="My campaign"' \
  -F 'objective="OUTCOME_TRAFFIC"' \
  -F 'status="PAUSED"' \
  -F 'special_ad_categories=[]' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/campaigns
```

## Step 4: Target Definition

To enable advertisers to reach specific groups, specific these parameters in your API requests:

- demographics (age, gender, location)
- interests
- behaviors

Then potential customers who are [most likely to be interested](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/basic-targeting) in your products or services will be reached.

#### Sample Call

```
curl -X POST \
  -F 'access_token=YOUR_ACCESS_TOKEN' \
  -F 'name=My Custom Audience' \
  -F 'subtype=CUSTOM' \
  -F 'description=People who live in New York, aged 25-40, interested in technology' \
  -F 'customer_file_source=USER_PROVIDED_ONLY' \
  -F 'targeting_spec={
        "geo_locations": {
          "countries": ["US"],
          "regions": [{"key": "4081"}]  # New York region key
        },
        "age_min": 25,
        "age_max": 40,
        "interests": [{"id": "6003139266461", "name": "Technology"}]
      }' \
  https://graph.facebook.com/v25.0/act_YOUR_AD_ACCOUNT_ID/customaudiences
```

## Step 5: Create Ad Set

Ad sets can have one or more ads. Ads within an ad set should have the same targeting, budget, billing, optimization goal, and duration.

You can set the budget, schedule, targeting, bid strategy, and placement options. Ad sets allow for fine-tuning how and where ads are delivered to specific audience segments, optimizing performance, and achieving marketing goals.

Key parameters:

- audience targeting criteria
- daily or lifetime budgets
- scheduling options to control when ads are shown

More comprehensive details [here](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign).

You can pick a manual placement that includes Instagram and Facebook reels ads, or default to automatic placements. If you do not specify anything for a particular placement field, it considers all possible default positions for that field.

#### Sample Call

```
curl -X POST \
  -F 'access_token=YOUR_ACCESS_TOKEN' \
  -F 'name=Reels Ad Set' \
  -F 'campaign_id=YOUR_CAMPAIGN_ID' \
  -F 'daily_budget=5000' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'optimization_goal=REACH' \
  -F 'start_time=2024-07-10T10:00:00-0700' \
  -F 'end_time=2024-07-20T10:00:00-0700' \
  -F 'targeting={"geo_locations":{"countries":["US"]},"age_min":18,"age_max":65}' \
  -F 'promoted_object={"page_id":"YOUR_PAGE_ID"}' \
  -F 'status=PAUSED' \
  -F 'instagram_user_id=<IG_USER_ID>' \
  -F 'publisher_platforms=["instagram"]' \
  -F 'instagram_positions=["reels"]' \
  https://graph.facebook.com/v25.0/act_YOUR_AD_ACCOUNT_ID/adsets
```

### Placement Targeting: Reels Available Positions, Compatible Objectives, and Optimization Goals

| `publisher_platforms` | `facebook_position` or `instagram position` | Compatible Objectives | `optimization_goal` |
| --- | --- | --- | --- |
| `instagram ` | `reels`, `profile_reels` | `OUTCOME_APP_PROMOTION` | `LINK_CLICKS`<br><br>`OFFSITE_CONVERSIONS`<br><br>`APP_INSTALLS` |
| `instagram ` | `reels`, `profile_reels` | `OUTCOME_AWARENESS` | `REACH`<br><br>`IMPRESSIONS`<br><br>`AD_RECALL_LIFT`<br><br>`THRUPLAY` |
| `instagram ` | `reels`, `profile_reels` | `OUTCOME_LEADS` | `OFFSITE_CONVERSIONS`<br><br>`LANDING_PAGE_VIEWS`<br><br>`LINK_CLICKS`<br><br>`REACH`<br><br>`IMPRESSIONS`<br><br>`LEAD_GENERATION`<br><br>`QUALITY_LEAD` |
| `instagram ` | `reels`, `profile_reels` | `OUTCOME_TRAFFIC` | `LINK_CLICKS`<br><br>`LANDING_PAGE_VIEWS`<br><br>`REACH`<br><br>`CONVERSATIONS`<br><br>`IMPRESSIONS`<br><br>`VISIT_INSTAGRAM_PROFILE` |
| `instagram ` | `reels`, `profile_reels` | `OUTCOME_ENGAGEMENT` | `CONVERSATIONS`<br><br>`LINK_CLICKS`<br><br>`THRUPLAY`<br><br>`POST_ENGAGEMENT`<br><br>`REACH`<br><br>`IMPRESSIONS`<br><br>`REMINDERS_SET`<br><br>`OFFSITE_CONVERSIONS`<br><br>`LANDING_PAGE_VIEWS` |
| `instagram ` | `reels`, `profile_reels` | `OUTCOME_SALES` | `OFFSITE_CONVERSIONS`<br><br>`LANDING_PAGE_VIEWS`<br><br>`LINK_CLICKS`<br><br>`REACH`<br><br>`IMPRESSIONS`<br><br>`CONVERSATIONS` |
| `facebook` | `facebook_reels` | `OUTCOME_APP_PROMOTION` | `LINK_CLICKS`<br><br>`OFFSITE_CONVERSIONS`<br><br>`APP_INSTALLS` |
| `facebook` | `facebook_reels` | `OUTCOME_AWARENESS` | `REACH`<br><br>`IMPRESSIONS`<br><br>`AD_RECALL_LIFT`<br><br>`THRUPLAY`<br><br>`TWO_SECOND_CONTINUOUS_VIDEO_VIEWS` |
| `facebook` | `facebook_reels` | `OUTCOME_LEADS` | `OFFSITE_CONVERSIONS`<br><br>`LANDING_PAGE_VIEWS`<br><br>`LINK_CLICKS`<br><br>`REACH`<br><br>`IMPRESSIONS`<br><br>`LEAD_GENERATION`<br><br>`QUALITY_LEAD` |
| `facebook` | `facebook_reels` | `OUTCOME_TRAFFIC` | `LINK_CLICKS`<br><br>`LANDING_PAGE_VIEWS`<br><br>`REACH`<br><br>`CONVERSATIONS`<br><br>`IMPRESSIONS`<br><br>`QUALITY_CALL` |
| `facebook` | `facebook_reels` | `OUTCOME_ENGAGEMENT` | `CONVERSATIONS`<br><br>`LINK_CLICKS`<br><br>`THRUPLAY`<br><br>`TWO_SECOND_CONTINUOUS_VIDEO_VIEWS`<br><br>`POST_ENGAGEMENT`<br><br>`REACH`<br><br>`IMPRESSIONS`<br><br>`EVENT_RESPONSES`<br><br>`QUALITY_CALL`<br><br>`OFFSITE_CONVERSIONS`<br><br>`LANDING_PAGE_VIEWS`<br><br>`PAGE_LIKES` |
| `facebook` | `facebook_reels` | `OUTCOME_SALES` | `OFFSITE_CONVERSIONS`<br><br>`LANDING_PAGE_VIEWS`<br><br>`LINK_CLICKS`<br><br>`REACH`<br><br>`IMPRESSIONS`<br><br>`CONVERSATIONS`<br><br>`QUALITY_CALL` |

### Limitations

| Compatible Objective +<br>`optimization_goal` Combination | FB Reels Eligible? | IG Reels Eligible? |
| --- | --- | --- |
| `OUTCOME_AWARENESS` + `TWO_SECOND_CONTINUOUS_VIDEO_VIEWS` | ✅<br> | ❌<br> |
| `OUTCOME_TRAFFIC` + `VISIT_INSTAGRAM_PROFILE` | ❌ | ✅ |
| `OUTCOME_TRAFFIC` + `QUALITY_CALL` | ✅ | ❌ |
| `OUTCOME_ENGAGEMENT` + `TWO_SECOND_CONTINUOUS_VIDEO_VIEWS` | ✅ | ❌ |
| `OUTCOME_ENGAGEMENT` + `EVENT_RESPONSES` | ✅ | ❌ |
| `OUTCOME_ENGAGEMENT` + `REMINDERS_SET` | ❌ | ✅ |
| `OUTCOME_ENGAGEMENT` + `QUALITY_CALL` | ✅ | ❌ |
| `OUTCOME_ENGAGEMENT` + `PAGE_LIKES` | ✅ | ❌ |
| `OUTCOME_SALES` + `QUALITY_CALL` | ✅ | ❌ |

## Step 6: Select Creative

Ad creatives are the visual and textual components of ads, which support the following ad formats:

- images
- videos
- carousels
- enabling customized ad designs

Automate design elements and optimize performance using our [creative process](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative).

### Repurpose an Existing Reel as the Ad Creative

Users can provide a new asset or repurpose an existing reel from their Instagram account as the ad creative.

You can create ads from existing, organic Instagram or Facebook reels that are eligible to be promoted, provided they are:

- Less than 90 seconds
- Have a full-screen (9:16) vertical aspect ratio
- Free of copyrighted music, GIFs, interactive stickers or camera filters from a third party
- Not shared to Facebook

To repurpose an organic Instagram reel as the ad creative for a new ad campaign:

1.  Obtain the Instagram Business account ID, which needs to be connected to a Facebook Page
- `GET/{ad_account_id}/connected_instagram_accounts`
**or**
- `GET/{business_id}/instagram_business_accounts`

2. Find the Reel You Want to Promote
- `GET/{ig-business-account-user-id}/media`

3. Provide Ad Creative
- Instead of specifying `instagram_user_id` in the creative spec, set `instagram_user_id` as the Instagram user ID
- Specify `source_instagram_media_id` as the media ID
- Optionally, update `call_to_action` for your promotion

[Leverage `boost_eligibility_info`](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/use-posts-as-ads)  as a convenient way to determine whether media is eligible to be boosted as an ad and `boost_ads_list` to trace related past boost Instagram ad information.

#### Sample Call

```
curl -i -X POST \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT>/adcreatives?object_id=<PAGE_ID>
&instagram_user_id=<IG_USER_ID>
&source_instagram_media_id=<IG_ORGANIC_MEDIA_ID>
&call_to_action="{'type':'LEARN_MORE','value':{'link': '<YOUR_LINK>'}}"
&access_token=<API_ACCESS_TOKEN>
```

###  Gen AI Creative Toolbox

You can [automate the generation of diverse and engaging ad elements](https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative/generative-ai-features), such as: images, videos, and text. These AI-driven tools help optimize ad performance by tailoring content to audience preferences and enhancing creative variety. Ad creation will result in higher engagement and better campaigns.

## Step 7: Preview Ad

[Preview the ad](https://developers.facebook.com/docs/marketing-api/generatepreview/v21.0) in the Facebook and Instagram Reels formats tabulated below using:

- Ad ID
- Ad Creative ID
- Ad Creative spec

| PUBLISHING PLATFORM | Ad Format |
| --- | --- |
| Facebook | `DESKTOP_FEED_STANDARD`, `FACEBOOK_STORY_MOBILE`, `INSTANT_ARTICLE_STANDARD`, `INSTREAM_VIDEO_DESKTOP`, `INSTREAM_VIDEO_MOBILE`, `MARKETPLACE_DESKTOP`, `MARKETPLACE_MOBILE`, `MOBILE_FEED_BASIC`, `MOBILE_FEED_STANDARD`, `RIGHT_COLUMN_STANDARD`, `SUGGESTED_VIDEO_DESKTOP`, `SUGGESTED_VIDEO_MOBILE`, `WATCH_FEED_MOBILE`, `FACEBOOK_REELS_BANNER`, `FACEBOOK_REELS_BANNER_DESKTOP`, `FACEBOOK_REELS_MOBILE`, `FACEBOOK_REELS_POSTLOOP`, `FACEBOOK_REELS_STICKER`, `FACEBOOK_STORY_STICKER_MOBILE`, `WATCH_FEED_HOME` |
| Instagram | `INSTAGRAM_STANDARD`, `INSTAGRAM_STORY`, `INSTAGRAM_EXPLORE_CONTEXTUAL`, `INSTAGRAM_EXPLORE_IMMERSIVE`, `INSTAGRAM_EXPLORE_GRID_HOME`, `INSTAGRAM_FEED_WEB`, `INSTAGRAM_FEED_WEB_M_SITE`, `INSTAGRAM_PROFILE_FEED`, `INSTAGRAM_REELS`, `INSTAGRAM_REELS_OVERLAY`, `INSTAGRAM_SEARCH_CHAIN`, `INSTAGRAM_SEARCH_GRID`, `INSTAGRAM_STORY_CAMERA_TRAY`, `INSTAGRAM_STORY_WEB`, `INSTAGRAM_STORY_WEB_M_SITE` |

#### Sample Call

```
curl -X POST \
  'https://graph.facebook.com/v25.0/act_{ad_account_id}/adpreviews' \
  -F 'access_token={your_access_token}' \
  -F 'creative={
        "object_story_spec": {
            "instagram_user_id": "<IG_USER_ID>",
            "video_data": {
                "video_id": "{video_id}",
                "title": "Check out our new product!",
                "description": "Exciting new features and benefits.",
                "call_to_action": {
                    "type": "LEARN_MORE",
                    "value": {
                        "link": "https://www.example.com/product"
                    }
                }
            }
        }
    }' \
  -F 'ad_format=INSTAGRAM_REELS'
```

## Step 8: Schedule Ad Delivery

To [book an ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup) using the marketing API, create an ad group object and link your ad set object to the Ad Creative. Use `/act_{ad_account_id}/ads` to submit your Ad object, and validate the response to confirm successful booking. This step finalizes your ad setup, making it ready for delivery based on the configurations provided.

#### Sample Call

```
curl -X POST \
  -F 'name="My Ad"' \
  -F 'adset_id="<AD_SET_ID>"' \
  -F 'creative={
       "creative_id": "<CREATIVE_ID>"
     }' \
  -F 'status="PAUSED"' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads
```

## Step 9: Review Performance

Use the [Insights API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights) to fetch metrics from ad account to ads:

- `act_<AD_ACCOUNT_ID>/insights`
- `<CAMPAIGN_ID>/insights`
- `<ADSET_ID>/insights`
- `<AD_ID>/insights`

When running a campaign on Instagram and Facebook, add `breakdowns=publisher_platform` to see the stats of Facebook and Instagram placements separately, as shown in the sample call below. When breaking down insights by Placement level, it will be possible to see how ads perform via Instagram and Facebook Reels placement.

#### Sample Call

```
curl -X GET \
  'https://graph.facebook.com/v25.0/{ad_account_id}/insights' \
  -F 'access_token={your_access_token}' \
  -F 'level=campaign' \
  -F 'fields=campaign_name,impressions,clicks,spend' \
  -F 'breakdowns=publisher_platform,platform_position' \
  -F 'filtering=[{"field":"platform_position","operator":"IN","value":["instagram_reels"]}]' \
  -F 'time_range={"since":"2024-06-01","until":"2024-06-30"}'
```

### Important Considerations

#### New Objectives Supported in ODAX (Outcome-Driven Ads Experiences Objective Validation)

- `OUTCOME_APP_PROMOTION`
- `OUTCOME_AWARENESS`
- `OUTCOME_ENGAGEMENT`
- `OUTCOME_LEADS`
- `OUTCOME_SALES`
- `OUTCOME_TRAFFIC`

### Rate Limits

The Marketing API has its own [rate limiting logic](https://developers.facebook.com/documentation/ads-commerce/marketing-api/overview/rate-limiting) and is excluded from all the Graph API rate limitations. The feature that impacts the Marketing API rate limit quota is Marketing API Access Tier. By default, you get **Standard Access** when you add the Marketing API product to your App Dashboard, which provides you development access to the Marketing API. To increase the rate limiting quota, upgrade to **Advanced Access.**

### Creative Essentials

Reels ads turn attention into action, supercharging results. When you build them the right way, they are even more effective.

**1. Build in 9:16 video to make your video captivating:** Reels is a full-screen, immersive video format. To help your creative feel at home here, consider leading with video and resizing it to 9:16.

**2. Build in safe zones so that your messages are clear:** Work within the safe zones so your text sticker overlays, calls to action or key messages aren't obscured by the Reels user interface. Keep the bottom 35% of your 9:16 creative free of text, logos, and other key elements.

**3. Build for sound on to make your video entertaining:** Audio – whether that's music, voiceover or sound effects – is a key driver of engagement and entertainment on Reels.

## Allow product video with catalog product video

Use catalog product video for your Reels placements to enhance your catalog and ad experience. With allow product video, you can deliver video assets from your catalog along with the existing product images in your Advantage+ catalog ads campaigns.

Allow product video allows you to extend your reach to Instagram Reels and Facebook Reels. In addition, it consolidates multiple video campaigns into a single dynamic ad campaign. You can use ads with allow product video enabled across different placements, but we focus on using these ads in Reels placements here.

Ads with allow product video enabled will show either images or videos of your catalog items based on what each person viewing your ad is likely to find engaging. Allow product video uses automation and product ranking to deliver not only the most relevant products, but also the highest-performing assets to audiences across placements.

### Why use catalog product video?

Catalog product video is supported across all catalog verticals, and ads with allow product video enabled are open to all advertisers. Catalog product video is a good fit for advertisers who would like to enhance their [Advantage+ catalog ads campaigns](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/get-started) with more inspirational video creatives.

### Requirements

To create ads with allow product video enabled that deliver on Reels, you will need a product catalog with existing products and at least one video for each product item in a downloadable video URL format. For more information, see [Allow product video](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/allow-product-video).

### Step 1: [Configure](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/allow-product-video#add-videos-to-your-catalog) the catalog for catalog product videos

- Ensure that at least one video per product is a 9:16 aspect ratio for the best performance on Reels
    - Ads with allow product video enabled will automatically select a 9:16 video for the Reels placements
    - If a 9:16 video is not available, the first video will be used
- Ensure that the videos provided for your catalog are hosted on downloadable URLs
- Audio is welcome and may have a positive impact on your ad, but is not required
- You may add tags to your catalog videos to use `preferred_video_tags` on the ad

### Step 2: Create an ad campaign compatible with Reels placements and Advantage+ catalog ads

- [Reels campaign creation](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/instagramads/get-started#campaign)
- [Advantage+ catalog ads campaign creation](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/get-started#step-1--create-an-ad-campaign)
    - Ensure that your ad campaign objective is `OUTCOME_SALES`, `LINK_CLICKS`, `APP_INSTALLS`, or `CONVERSIONS`

### Step 3: Create an adset targeting Reels Placements with a product set
- [Advantage+ Catalog adset creation](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/get-started#adset)
- [Reels placement adset creation](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/instagramads/get-started#adset)
- Set an optimization goal that aligns with your objective at the campaign level that adheres to our [validation rules](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview#opt-goal-validation)
- Set the appropriate targeting options, budget, billing event, and schedule
- Ensure that `publisher_platforms` is set for `["instagram","facebook"]`, `facebook_positions` and `instagram_positions` are set for reels
- Set your desired `product_set_id` in `promoted_object` for your ad set to promote products from that product set

### Step 4: [Create an ad with allow product video enabled](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/allow-product-video#create-ads-with-product-video)

- Ensure that you are creating either a carousel ad or a single video format ad. Collection ads featuring catalog product videos are not yet supported on Reels placements. Carousel ads contain a series of different products from a set. Single video will show one product at a time from the specified product set
- [More information on catalog product videos](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/allow-product-video/faq)
