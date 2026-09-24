<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/asset-feed-spec/dynamic-creative | Saved: 2026-09-19 -->

# Dynamic Creative



Dynamic Creative allows you to automatically deliver different combinations of an ad's creative to your users. It helps you find the best creative combination per impression and learns from the asset's performance across audiences.

This solution also improves your ability to explore a variety of creative asset combinations and audiences, so you can show the best images, titles, descriptions and other assets to your users.

You should use Dynamic Creative to:

* Automate the workflow used to test creative
* Use different audiences to learn how to pick the most effective combination of creative assets

Use this API for new and ongoing campaigns, as well as campaigns that run longer than five days. You should perform split testing with your existing campaigns to find the best approach for your needs.

## Get started
* Step 1: [Create Campaign and Ad Set](#campaign)
* Step 2: [Provide the ad creative with `asset_feed_spec`](#creative)
* Step 3: [Create your ad](#ad)
* Optional Step 4: [Check your ad's review status](#ad_review).
* Get [insights](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/asset-feed-spec/insights) and analyze your results

## Step 1: Create Campaign and Ad Set {#campaign}

You can create a [standard ad campaign](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group) for Dynamic Creative, but there are two limitations:

* Your `objective` must be one of the following: `OUTCOME_SALES`, `OUTCOME_ENGAGEMENT`, `OUTCOME_LEADS`, `OUTCOME_AWARENESS`, `OUTCOME_TRAFFIC`, or `OUTCOME_APP_PROMOTION`.
* `buying_type` must be the default, which is `AUCTION`, or left blank.

For example, to create an ad campaign with the `objective` of `CONVERSIONS`:

```bash
curl \
  -F 'name=Dynamic Creative Sample Campaign'
  -F 'objective=OUTCOME_SALES'
  -F 'status=PAUSED'
  -F 'special_ad_categories=<SPECIAL_AD_CATEGORY>'
  -F access_token=<ACCESS_TOKEN>
  https://graph.facebook.com/<API_VERSION>/act_<AD_ACCOUNT_ID>/campaigns
```

Once you have your campaign, create an ad set by using the [standard ad set endpoint](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign).

* You can use all `billing_event`s, `targeting`, and `promoted_object`s, as long as they are compatible with the parent ad campaign's `objective`.
* You must set the `optimization_goal` to `OFFSITE_CONVERSIONS` for `OUTCOME_SALES`, `OUTCOME_ENGAGEMENT`, `OUTCOME_LEADS`, and `OUTCOME_TRAFFIC` objectives.
* Then set `is_dynamic_creative` to `true`.  

To create an ad set in a campaign with `optimization_goal` set to `conversions`:

```bash
curl \
  -F 'status=PAUSED'
  -F 'name=Dynamic Creative Ad Set'
  -F 'campaign_id=<CAMPAIGN_ID>'
  -F 'optimization_goal=OFFSITE_CONVERSIONS'
  -F 'is_dynamic_creative=true'
  -F 'lifetime_budget=5000'
  -F 'promoted_object={"pixel_id": "<PIXEL_ID>", "custom_event_type": "PURCHASE"}'
  -F 'billing_event=IMPRESSIONS'
  -F 'bid_strategy=LOWEST_COST_WITHOUT_CAP'
  -F 'targeting={"geo_locations": {"countries": ["US"]}}'
  -F 'start_time=2024-04-09'
  -F 'end_time=2024-04-20'
  -F access_token=<ACCESS_TOKEN>
  https://graph.facebook.com/<API_VERSION>/act_<AD_ACCOUNT_ID>/adsets
```

This returns a new ad set ID:

```
{"id":"23842500259260001"}
```

If you use `asset_feed_spec` with an ad set optimized for `APP_INSTALLS`, you should specify `link_url`, such as `http://www.abc.com`. The `link_url` **should be the same as** `object_store_url` in `promoted_object`. You should provide only one `link_url` parameter in `asset_feed_spec`.

```bash
curl
-F "name=Dynamic Creative AdSet"
-F "campaign_id=CAMPAIGN_ID"
-F "optimization_goal=APP_INSTALLS"
-F 'is_dynamic_creative=true'
-F "billing_event=IMPRESSIONS"
-F "is_autobid=true"
-F "promoted_object={'object_store_url':'https://itunes.apple.com/us/app/facebook/id284882215','application_id':ADVERTISED_APP_ID}"  // object_store_url must match what is provided in asset feed's link_urls
-F "lifetime_budget=20000"
-F "end_time=1461974400"
-F "targeting={
     'geo_locations':{'countries':['US']},
     'age_min':18,
     'age_max':24,
     'publisher_platforms':['facebook', 'audience_network'],
     'user_os':['ios']
   }"
-F "access_token=ACCESS_TOKEN"
https://graph.facebook.com/<API_VERSION>/act_AD_ACCOUNT_ID/adsets
```

## Step 2: Provide Ad Creative with `asset_feed_spec` {#creative}

Provide your creative through the `asset_feed_spec` field, also known as Asset Feed. In this field, you can specify multiple creative assets for each asset type. Some examples of asset types are images, videos, headlines and link descriptions. See the following:

* [Setup Your Asset Feed](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/asset-feed-spec)
* [Asset Feed Options](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/asset-feed-spec/options)

Note you may also need to set `page_id` and `instagram_user_id`.

**Note:** `asset_feed_id` is only supported in Marketing API v3.1 and earlier. You should use `asset_feed_spec` instead.

### Image cropping
Dynamic creative supports image cropping. Specify the image cropping parameter in your image spec. You can provide only one crop per image. We apply your crops to all placements of your image. See [Marketing API, Image Cropping](https://developers.facebook.com/documentation/ads-commerce/marketing-api/image-crops).  

## Step 3: Create Your Ad {#ad}

At this point, your ad set **must be empty**. When you create your ad, provide a reference to the creative ID. You can only create one ad per ad set. However, you can create additional Dynamic Creative ads in other, new ad sets.

```bash
curl
  -F 'name=Dynamic Creative Ad'
  -F 'adset_id=<ADSET_ID>'
  -F 'access_token=<ACCESS_TOKEN>'
  -F 'creative={
      "creative_id": <CREATIVE_ID>,
   }'
https://graph.facebook.com/<API_VERSION>/act_<AD_ACCOUNT_ID>/ads
```

After you create your ad:

* Your campaign appears in [Ads Manager](https://business.facebook.com/adsmanager/manage).
* Facebook [reviews your ad](#ad_review) and checks if it meets our [Advertising Policies](https://www.facebook.com/policies/ads/).

Once you create an ad for Dynamic Creative, you cannot [delete or archive it](https://developers.facebook.com/documentation/ads-commerce/marketing-api/best-practices/manage-your-ad-object-status). Instead, you should [delete or archive](https://developers.facebook.com/documentation/ads-commerce/marketing-api/best-practices/manage-your-ad-object-status) the parent ad set.

Dynamic Creative supports all placements except `sponsored_messages` on Messenger.

### Carousel ads
Dynamic Creative delivers the best combination of assets in [carousel ad format](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/videoads#carousel). If your feed has less than 10 images, the number of carousel cards is the same as the number of images. If you are using more than 10 images, we display a carousel with 10 cards. **We recommend square sizes for images**.

If you are using [carousel](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/videoads#carousel) with Dynamic Creative, you **cannot** use these features from carousel ads:

* `BODY_LABEL`
* `CALL_TO_ACTION_TYPE_LABEL`
* `LINK_URL_LABEL`
* `CAPTION_LABEL`
* `AD_FORMAT_LABEL`

In the asset insights breakdown, we aggregate impression-based metrics for in-card assets for all cards to the assets in the first card. In-card assets include images, title, and description

For background information, see [Carousel ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/videoads#carousel).

## Optional Step 4: Check Review Status {#ad_review}

After you create your campaign, ad set, and ad, check [ad review status](https://developers.facebook.com/docs/marketing-api/adgroup/feedback):

```bash
curl -G
-d "access_token=<ACCESS_TOKEN>"
-d 'fields=review_feedback'
https://graph.facebook.com/<API_VERSION>/<ADSET_ID>
```

The result includes ad review feedback. An empty array means that your ad passed review:

```
{
  "review_feedback":"[]",
  "id":"<ADSET_ID>"
}
```

If your ad does not pass review, you see:

```
{
  "review_feedback": {
    {"id":23842500258220001,"text":"Body 1","reason":["ALCOHOL"]},
    {"id":23842500258160001,"text":"Title 1","reason":["ALCOHOL"]},
    {"id":23842500258170001,"text":"Title 2","reason":["ALCOHOL"]}
  }",
  "id": "<AD_ID>"
}
```
