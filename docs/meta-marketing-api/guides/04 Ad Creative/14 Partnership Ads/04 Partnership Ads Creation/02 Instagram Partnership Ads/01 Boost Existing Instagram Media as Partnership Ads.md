<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/ads-creation/boost-existing-post | Saved: 2026-09-19 -->

# Boost Existing Instagram Media as Partnership Ads



You can boost many types of organic Instagram content as partnership ads, including branded content with the paid partnership label, Instagram Collab posts, mentions, people tags, product tags, as well as other content without the paid partnership label. You can also use an ad code or an existing media ID to create partnership ads for all types of contents.

This document shows you how to:

* [Retrieve branded content media](#retrieve-the-branded-content-media)
* [Retrieve creator content recommendations that Meta predicts will be the best performing partnership ads for objectives](#recommended-creator-content)
* [Create partnership ads using the branded content media](#using-the-instagram-media-id)
* [Create partnership ads using the partnership ad code](#using-a-partnership-ad-code)

### Limitations

* Recommendations are currently only available for partnership ads posts that have explicitly used the paid partnership label.

## Before you begin

Review the [requirements](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/ads-creation#before-you-start) for creating partnership ads.

### Permissions

* `instagram_branded_content_ads_brand`

## Retrieve the branded content media

**Warning:** **Being deprecated:** The `/{instagram-id}/branded_content_advertisable_medias` endpoint is being deprecated in favor of the [Advertisable Content Discovery API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/content-discovery-api) and will be removed on December 1, 2026. The new endpoint returns both Instagram media and Facebook posts from a single endpoint and supports filtering, sorting, field expansion, and organic insights. Migrate to the Advertisable Content Discovery API before December 1, 2026.

To find all the media that you are tagged in that is available to be used in an ad, send a `GET` request to the `/{instagram-id}/branded_content_advertisable_medias` endpoint where the `{instagram-id}` is your brand's Instagram professional account ID.

### Parameters

| Name | Description |
| --- | --- |
| `creator_username` | **Optional.**  <br>To find branded content from a specific creator for your brand, include the `creator_username` field set to the username of the creator. |
| `permalinks` | **Optional.**  <br>An array of Instagram media permalinks that can be obtained from the creator that you are working with.  <br>**Example:**  <br>`['Cw7zyQ5BdEE','Cw7zyQ5BdEh']` |
| `only_fetch_allowlisted` | **Optional** for Instagram partnership ads.  <br>Only retrieve media from creators that have been allowlisted.  <br>**Note:** The default value is `false` to allow you to fetch more data and for API performance. |
| `only_fetch_recommended_content` | **Optional** for Instagram partnership ads.<br>Only retrieve recommended content to boost if set to `true`. The default value is `false`.  <br>**Note:** Recommended content to boost are organic partnership ads, which a brand has tagged as approved for promotion, that Meta predicts may perform well, including suggested ad campaign objectives. |
| `ad_code` | **Optional.**  <br>The ad code shared by the creator you are working with. |
| `media_relationship` | **Optional** for Instagram partnership ads.<br>Any array of value(s) that specifies whether to retrieve tagged and/or owned media.  <br>**Note:** When `media_relationship=['OWNED']`, the `creator_username`, `only_fetch_allowlisted`, and `only_fetch_recommended_content` parameters are disabled, since they are only applicable to tagged media. When `media_relationship` is specified, the `ad_code` and `permalinks` parameters are disabled.<br><br>**Values:**<br><br>* `IS_TAGGED` — Retrieves collaborated/branded content media where you are tagged as a collaborator or partner.<br>* `OWNED` — Retrieves collaborated/branded content media that you own. |

### Example request

```bash
curl -i -X GET \
  -d 'creator_username=<CREATOR_USERNAME>' \
  -d 'access_token=<PAGE_ACCESS_TOKEN>' \
  -d 'permalinks=[<'PERMALINK1','PERMALINK2'>]' \
  -d 'only_fetch_allowlisted=<BOOLEAN>' \
  -d 'only_fetch_recommended_content=<BOOLEAN>' \
  -d 'ad_code=<CREATOR_AD_CODE>' \
'https://graph.facebook.com/v25.0/<INSTAGRAM_ACCOUNT_ID>/branded_content_advertisable_medias?fields=eligibility_errors,owner_id,permalink,id&access_token=<ACCESS_TOKEN>,has_permission_for_partnership_ad'
```

### Example response
A successful request returns a list of media containing the media IDs, eligibility errors (if any), permalinks, whether you have permissions to boost the posts and owner ID of the media that can be used in ads.

```json
{
 "data": [
   {
     "eligibility_errors": [
        "Cannot use Reels containing tappable elements can't be used for ads. Choose a different post to create an ad."
      ],
      "recommended_campaign_objectives": [
        "OUTCOME_ENGAGEMENT",
        "OUTCOME_TRAFFIC",
        "OUTCOME_LEADS"
      ],
      "has_permission_for_partnership_ad":true,
      "owner_id": "16502228360082",
      "permalink": "https://www.instagram.com/reel/CzboAd3R91-/",
      "id": "16502230933174"
    },
    {
      "owner_id": "90010135660647",
      "permalink": "https://www.instagram.com/p/CywLmKWu6Zs/",
      "id": "90013017840068",
      "has_permission_for_partnership_ad":true
    },
    {
      "owner_id": "90010489752294",
      "permalink": "https://www.instagram.com/p/CyWe6-ExB7p/",
      "id": "90012928652981",
      "has_permission_for_partnership_ad":false
    },
    {
      "eligibility_errors": [
        "Can't use GIF stickers. Remove or choose a different sticker."
      ],
      "owner_id": "90010135660647",
      "permalink": "https://www.instagram.com/reel/CyEb6q4OuoN/",
      "id": "90012872006248"
    },
  ...
 ],
 "paging": {
    "cursors": {
      "before": "QVFIUkR6amZAhLVVVWGpfTlRBenRsOUJCQ3lR==",
      "after": "QVFIUlhBX1hoQzI4SkVFaTRoeEpTdEpJMFdIUh=="
    }}
```

### Recommended creator content

The API responds to a `only_fetch_recommended_content` request with `recommended_campaign_objectives`. When reviewing recommendations, remember that different ad objectives have distinct recommendations.

To help you understand the mapping, here is a breakdown of the equivalent campaign objectives in Ads Manager:

| Ads Manager | Campaign Objectives |
| --- | --- |
| Recommended for impressions | `OUTCOME_AWARENESS` |
| Recommended for engagement | `OUTCOME_ENGAGEMENT`  <br>`OUTCOME_TRAFFIC`  <br>`OUTCOME_LEADS` |
| Recommended for conversion | `OUTCOME_APP_PROMOTION`  <br>`OUTCOME_SALES` |

**Note:** The same content is eligible to be recommended for multiple objectives.

You may encounter content without any associated recommendations for the following reasons:

* Recommendations require a 3-day lag to generate, allowing organic engagement metrics to stabilize.
* Recommendations are only available for content published within the last 60 days.
* If no recommendations are available, there will be no associated information displayed.

### Owned and tagged media

Use the `media_relationship` parameter to fetch the owned and tagged media of an Instagram account.

#### Example requests

Retrieve all tagged media of a specific Instagram account

```bash
curl -i -X GET \
  -F 'media_relationship=["IS_TAGGED"]' \
  -F 'access_token=<ACCESS_TOKEN>' \
'https://graph.facebook.com/v25.0/<INSTAGRAM_ACCOUNT_ID>/branded_content_advertisable_medias'
```

Retrieve all owned media of a specific Instagram account

```bash
curl -i -X GET \
  -F 'media_relationship=["OWNED"]' \
  -F 'access_token=<ACCESS_TOKEN>' \
'https://graph.facebook.com/v25.0/<INSTAGRAM_ACCOUNT_ID>/branded_content_advertisable_medias'
```

Retrieve all owned and tagged media of a specific Instagram account

```bash
curl -i -X GET \
  -F 'media_relationship=["OWNED","IS_TAGGED"]' \
  -F 'access_token=<ACCESS_TOKEN>' \
'https://graph.facebook.com/v25.0/<INSTAGRAM_ACCOUNT_ID>/branded_content_advertisable_medias'
```

Retrieve tagged media, filtered to only return media by the specified creator, and all owned media

```bash
curl -i -X GET \
  -F 'creator_username=<CREATOR_USERNAME>' \
  -F 'media_relationship=["OWNED","IS_TAGGED"]' \
  -F 'access_token=<ACCESS_TOKEN>' \
'https://graph.facebook.com/v25.0/<INSTAGRAM_ACCOUNT_ID>/branded_content_advertisable_medias'
```

## Create an ad creative

### Parameters

| Name | Description |
| --- | --- |
| `branded_content`<br><br>JSON object | An object containing information about the partnership ad.  <br><br>* `instagram_boost_post_access_token` — The partnership ad code to create the ad.<br>* `ad_format` — Sets the identities to display in the ad.  <br><br>**Values:**<br><br>* `1` *(default)*: Renders both provided identities. This is the default value if nothing is passed in.<br>* `2`: Renders only the first identity provided.  <br>* `3`: Allows the system to automatically optimize for the most performant option between single identity (`2`) and dual identity (`1`). **Note:** This currently only optimizes on Instagram. |
| `facebook_branded_content`<br><br>JSON object | An object containing the required parameters for Facebook partnership ads. |
| `instagram_branded_content`<br><br>JSON object | An object containing the required parameters for Instagram partnership ads. |
| `object_id`<br><br>int | The Facebook Page ID for the brand. |
| `source_instagram_media_id`<br><br>numeric string or integer | The Instagram media ID to use in the ad. Use this parameter when using an Instagram post to create the ad. |

### Using the Instagram media ID

Send a `POST` request to the `/act_{ad-account-id}/adcreatives` endpoint with the `object_id` field set to your brand's Facebook Page ID and the `source_instagram_media_id` field set to the Instagram post ID for the branded content you want to use in your ad.

#### Example request

```
curl -X POST \
  -F 'object_id=<PAGE_ID>' \
  -F 'source_instagram_media_id=<IG_MEDIA_ID>' \
  -F 'access_token=<ACCESS_TOKEN>' \
  -F 'facebook_branded_content'={
    "sponsor_page_id": "<ADVERTISER_FB_ID>"
  } \
  -F 'instagram_branded_content'={
    "sponsor_id": "<ADVERTISER_IG_ID>"
  } \
  -F 'branded_content'={
    "ad_format": "<AD_FORMAT_TYPE>"
  } \
'https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives'
```

#### Example response

A successful request returns the ad creative ID to use in the ad.

```
{
  "id": "<CREATIVE_ID>"
}
```

### Using a partnership ad code

Send a `POST` request to the `/act_{ad-account-id}/adcreatives` endpoint with the `object_id` field set to your brand's Facebook Page ID for your brand and the `instagram_boost_post_access_token` provided by the creator.

#### Example request

These are the required fields to be passed in the API call.

```
curl -X POST \
  -F 'object_id=<BRAND_PAGE_ID>' \
  -F 'branded_content ={
       "instagram_boost_post_access_token": "<AD_CODE>",
       "ad_format": "<AD_FORMAT_TYPE>"
   }' \
  -F 'access_token=<ACCESS_TOKEN>' \
  -F 'facebook_branded_content'={
    "sponsor_page_id": "<ADVERTISER_FB_ID>"
  } \
  -F 'instagram_branded_content'={
    "sponsor_id": "<ADVERTISER_IG_ID>"
  } \
'https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives'
```

#### Example response

A successful request returns the ad creative ID to use in the ad.

```
{
  "id": "<CREATIVE_ID>"
}
```

## Create an ad

Send a `POST` request to the `/act_{ad-account-id}/ads` endpoint with the `name` field set to the name for your ad, the `adset_id` field set to your ad set ID, the `creative` field with the `creative_id` parameter set to the ad creative ID you received, and the `status` initially set `PAUSED`.

### Example request

```
curl -X POST \
  -F 'name": "Ad Name"' \
  -F 'adset_id: <ADSET_ID>' \
  -F 'creative: {"creative_id": <CREATIVE_ID>}' \
  -F 'status: "PAUSED"' \
  -F 'access_token=<ACCESS_TOKEN>' \
'https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads'
```

### Example response

A successful request returns the ad ID.  

```
{
"id": "<AD_ID>"
}
```

You can use this ad ID to [publish your ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started#book-ad).

## Troubleshooting

### Uploading an Instagram video to Facebook

If you are working on boosting video media, you might encounter the error "Instagram Video Must Be Uploaded To Facebook".

If you have the partnership ad code, you can use the following workaround using the `partnership_ad_ad_code` parameter to upload the video asset to the Facebook video ad library, instead of resorting to source file information:

* `partnership_ad_ad_code` – Partnership ad code (numerical). Use this parameter to include a partnership ad code, bypassing the need to know source file information.
* `is_partnership_ad` – [Optional] Use this parameter to identify that the ad will be a partnership ad.

```
curl -X POST \
  -F 'source_instagram_media_id=<MEDIA-ID>' \
  -F 'partnership_ad_ad_code=<PARTNERSHIP_AD_AD_CODE>' \
  -F 'is_partnership_ad=true' \
'https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/advideos'
```

A successful request returns an ID for the video.

```
{
  "id": "<VIDEO-ID>"
}
```

If you don't have a partnership ad code, refer to the [Ad Videos documentation](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/advideos).
