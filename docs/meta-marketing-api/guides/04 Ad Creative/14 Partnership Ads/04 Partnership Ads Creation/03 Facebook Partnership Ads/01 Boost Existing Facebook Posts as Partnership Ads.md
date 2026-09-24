<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/ads-creation/boost-existing-fb-post | Saved: 2026-09-19 -->

# Boost Existing Facebook Posts as Partnership Ads



You can boost more types of organic Facebook content as partnership ads, including branded content with the paid partnership label, Facebook Collab posts, mentions, page tags, and other content without the paid partnership label. You can also use an ad code or an existing post ID to create partnership ads for all types of content.

This document shows you how to:

* [Retrieve Facebook branded content posts](#retrieve-facebook-branded-content-posts)
* [Create partnership ads using a branded content post](#using-the-facebook-post-id)
* [Create partnership ads using a partnership ad code](#using-a-facebook-partnership-ad-code)

## Before you begin

Review the [requirements](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/ads-creation#before-you-start) for creating partnership ads.

### Permissions

* `facebook_branded_content_ads_brand`

## Retrieve Facebook branded content posts

**Warning:** **Being deprecated:** Meta is deprecating the `/partnership-ads/{sponsor-page-id}/advertisable-posts` endpoint in favor of the [Advertisable Content Discovery API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/content-discovery-api) and will be removed on December 1, 2026. The new endpoint returns both Facebook posts and Instagram media from a single unified endpoint, with more filtering options, sorting, field expansion, and organic insights. Migrate to the Advertisable Content Discovery API before December 1, 2026.

To find all the posts that you are tagged in that are available to be used in an ad, send a `GET` request to the `/partnership-ads/{sponsor-page-id}/advertisable-posts` endpoint where `{sponsor-page-id}` is the delegate Facebook Page ID for your brand's Facebook Page.

### Parameters

| Name | Description |
| --- | --- |
| `ad_code` | **Optional.**  <br>The ad code shared by the creator you are working with. |
| `Authorization` | **Required.**  <br>Bearer token for the authentication header. |
| `creator_page_id` | **Optional** for Facebook partnership ads.  <br>To find branded content for a specific creator for your brand, include the `creator_page_id` field set to the creator's Facebook Page ID. |
| `creator_username` | **Optional.**  <br>To find branded content from a specific creator for your brand, include the `creator_username` field set to the username of the creator. |
| `only_fetch_allowlisted` | **Optional.**  <br>Only retrieve media from creators that have been allowlisted.<br><br>**Note:** The default value is `false` to allow you to fetch more data and for API performance. |
| `permalinks` | **Optional.**  <br>An array of Facebook post permalinks. Get these permalinks from the creator you work with.<br><br>**Example:** `['https://www.facebook.com/59961010139648/posts/pfbid02oBGjW2VuqvGomxTS6yHmdNKdjEerWn5zFgXWV4RRAibDkbWaYJAH9HEmrwgZnWFvl/','https://www.facebook.com/59961010139648/videos/17902564192200/']` |
| `range` | **Optional** for Facebook partnership ads.  <br>Range header for pagination in the format of `post=<START>-<END>`.  <br>**Default value:** `post=0-10000` |

### Example request

```bash
curl -i -X GET \
  -H 'Authorization: Bearer <AUTH_TOKEN>' \
  -H 'range: <RANGE_HEADER>' \
  -d 'creator_username=<CREATOR_USERNAME>' \
  -d 'creator_page_id=<CREATOR_PAGE_ID>' \
  -d 'permalinks=[<PERMALINK1>,<PERMALINK2>...]' \
  -d 'ad_code=<AD_CODE>' \
'https://api.facebook.com/partnership-ads/<SPONSOR_PAGE_ID>/advertisable-posts'
```

### Example response

Upon success, your app will receive a list of posts containing the post IDs, eligibility errors (if any), permalinks, whether you have permissions to boost the posts, and the owner IDs of the posts that can be used in ads.

```json
[
  {
    "post_id": 48602429468091,
    "owner_page_id": 31202392748498,
    "permalink": "https://www.facebook.com/59961010139648/posts/pfbid02oBGjW2VuqvGomxTS6yHmdNKdjEerWn5zFgXWV4RRAibDkbWaYJAH9HEmrwgZnWFvl/",
    "has_permission_for_partnership_ad": true,
    "eligibility_errors": []
  },
  {
    "post_id": 17902564192200,
    "owner_page_id": 31202392748498,
    "permalink": "https://www.facebook.com/59961010139648/videos/17902564192200/",
    "has_permission_for_partnership_ad": true,
    "eligibility_errors": []
  },
  {
    "post_id": 44102421656818,
    "owner_page_id": 31202392748498,
    "permalink": "https://www.facebook.com/59961010139648/videos/44102421656818/",
    "has_permission_for_partnership_ad": true,
    "eligibility_errors": []
  },
  {
    "post_id": 30902420582901,
    "owner_page_id": 31202392748498,
    "permalink": "https://www.facebook.com/59961010139648/videos/30902420582901/",
    "has_permission_for_partnership_ad": true,
    "eligibility_errors": ["Reels that use copyrighted music can't be boosted as ads."]
  }
]
```

## Create an ad creative

### Parameters

| Name | Description |
| --- | --- |
| `branded_content`<br><br>JSON object | An object containing information about the partnership ad.<br><br>* `facebook_boost_post_access_token` — A Facebook partnership ad code to create the ad.<br>* `ad_format` — Sets the identities to display in the ad.<br><br>**Values:**<br><br>* `1` *(default)*: Renders both provided identities. This is the default value if nothing is passed in.<br>* `2`: Renders only the first identity provided.<br>* `3`: Allows the system to automatically optimize for the most performant option between single identity (`2`) and dual identity (`1`). **Note:** Dynamic header optimization currently only optimizes on Instagram. |
| `facebook_branded_content`<br><br>JSON object | An object containing the required parameters for Facebook partnership ads. |
| `instagram_branded_content`<br><br>JSON object | An object containing the required parameters for Instagram partnership ads. |
| `object_story_id`<br><br>string | A combination of the creator's Facebook delegate Page ID and post ID delimited by an underscore ( _ ). Use this parameter when creating ads from Facebook content.<br><br>**Example:** `"<CREATOR_PAGE_ID>_<CREATOR_POST_ID>"` |

### Using the Facebook post ID

Using a Facebook post ID requires the `object_story_id` parameter, which is a combination of the creator's Facebook Page ID and Facebook post ID.

#### Example request

```bash
curl -X POST \
  -F 'object_story_id="<CREATOR_PAGE_ID>_<CREATOR_POST_ID>"' \
  -F 'access_token=<ACCESS_TOKEN>' \
  -F 'facebook_branded_content={
    "sponsor_page_id": "<BRAND_PAGE_ID>"
  }' \
  -F 'instagram_branded_content={
    "sponsor_id": "<BRAND_IG_ID>"
  }' \
  -F 'branded_content={
    "ad_format": "<AD_FORMAT_TYPE>"
  }' \
'https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives'
```

#### Example response

Upon success, your app will receive the ad creative ID to use in the ad.

```json
{
  "id": "<CREATIVE_ID>"
}
```

### Using a Facebook partnership ad code

Send a `POST` request to the `/act_{ad-account-id}/adcreatives` endpoint with the `facebook_boost_post_access_token` provided by the creator.

#### Example request

```bash
curl -X POST \
  -F 'branded_content={
       "facebook_boost_post_access_token": "<AD_CODE>",
       "ad_format": "<AD_FORMAT_TYPE>"
   }' \
  -F 'access_token=<ACCESS_TOKEN>' \
  -F 'facebook_branded_content={
    "sponsor_page_id": "<BRAND_PAGE_ID>"
  }' \
  -F 'instagram_branded_content={
    "sponsor_id": "<BRAND_IG_ID>"
  }' \
'https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives'
```

#### Example response

Upon success, your app will receive the ad creative ID to use in the ad.

```json
{
  "id": "<CREATIVE_ID>"
}
```

## Create an ad

Send a `POST` request to the `/act_{ad-account-id}/ads` endpoint with the `name` field set to the name for your ad, the `adset_id` field set to your ad set ID, the `creative` field with the `creative_id` parameter set to the ID you received, and the status initially set `PAUSED`.

### Example request

```bash
curl -X POST \
  -F 'name=Ad Name' \
  -F 'adset_id=<ADSET_ID>' \
  -F 'creative={"creative_id": "<CREATIVE_ID>"}' \
  -F 'status=PAUSED' \
  -F 'access_token=<ACCESS_TOKEN>' \
'https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads'
```

### Example response

Upon success, your app will receive the ad ID.

```json
{
  "id": "<AD_ID>"
}
```

You can use this ad ID to [publish your ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started#book-ad).

## Comments moderation

You can moderate comments on a partnership ad using the `/{comment-id}` endpoint's `is_hidden` parameter. Comment moderation works even when another Page created the post, without needing the creator to take action.

**Note:** Comment moderation is only available for comments on Page posts.

To hide a comment, send a `POST` request to the `/{comment-id}` endpoint with `is_hidden` set to `true`. Setting `is_hidden` to `false` will unhide the comment.

See the [Comment API reference](https://developers.facebook.com/docs/graph-api/reference/comment) for more information.

### Example request

```bash
curl -X POST \
  -F "access_token=<ACCESS_TOKEN>" \
  -F "is_hidden=true" \
"https://graph.facebook.com/v25.0/<COMMENT_ID>"
```

### Example response

```json
{
  "success":true
}
```
