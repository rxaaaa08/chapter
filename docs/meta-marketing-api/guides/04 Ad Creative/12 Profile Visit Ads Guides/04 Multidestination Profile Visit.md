<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/profile-visit-ads/multidestination-profile-visit | Saved: 2026-09-19 -->

# Multidestination Profile Visit Ads


**Warning:** Profile visit ad creation on the Marketing API is in limited availability and is being rolled out incrementally to advertisers. If you do not have access, contact your Meta representative or create profile visit ads in [Ads Manager](https://adsmanager.facebook.com/adsmanager/).

This guide explains how to create and publish multidestination profile visit ads using the Marketing API.

Multidestination profile visit ads send people who click on your ad to either your Instagram profile or your Facebook Page. Meta selects the destination that each person is most likely to engage with. Use this ad type to maximize total profile visits across both surfaces with a single campaign.

If you want to create an ad that sends people to a single destination, see:

* [Instagram profile visit ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/profile-visit-ads/instagram-profile-visit)
* [Facebook Page visit ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/profile-visit-ads/facebook-page-visit)

### Ad creation overview

This document outlines the steps you need to follow to set up your integration for multidestination profile visit ads. You will need to:

1. [Create an ad campaign](#step-1)
2. [Create an ad set that links your ads to your ad campaign](#step-2)
3. [Create an ad creative for the multidestination profile visit ad](#step-3)
4. [Create an ad by linking your ad creative to your ad set](#step-4)

## Before you begin

This guide assumes you have:

* [An ad account with Meta](https://adsmanager.facebook.com/adsmanager/)
* A Facebook Page with an [Instagram business account connected to it](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/pages-ig-account)
* [Uploaded any assets, such as images or videos, to be used in your ads to Meta servers](https://developers.facebook.com/documentation/business-messaging/messenger-platform/reference/attachment-upload-api)

## Step 1: Create an ad campaign {#step-1}

Start by creating your ad campaign. To do this, make a `POST` request to the `/act_<AD_ACCOUNT_ID>/campaigns` endpoint where `<AD_ACCOUNT_ID>` is the ID for your Meta ad account. Your request must include:

### Parameters

| Name | Description |
| --- | --- |
| `name`<br><br>string | **Required.**  <br>Name for the multidestination profile visit campaign. |
| `objective`<br><br>enum | **Required.**  <br>Campaign's objective.  <br>Supported objectives are `OUTCOME_ENGAGEMENT` and `OUTCOME_TRAFFIC`. |
| `special_ad_categories`<br><br>list<Object> | **Required.**  <br>Special ad categories associated with the multidestination profile visit campaign. Currently, special ad categories aren't supported for profile visit ads, so it needs to be `NONE` or empty array. See the [Ad Campaign reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group) for more details. |
| `status`  <br><br>enum | **Optional.**  <br>Valid options are `PAUSED` and `ACTIVE`.  <br>If this status is `PAUSED`, all its active ad sets and ads will be paused and have an effective status `CAMPAIGN_PAUSED`. |

#### Request

```curl
curl -X POST \
  -F 'name=Multidestination Profile Visit Campaign' \
  -F 'objective=OUTCOME_TRAFFIC' \
  -F 'status=ACTIVE' \
  -F 'special_ad_categories=[]' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/campaigns
```

#### Response

On success, your app receives a JSON response with the ID of your newly created campaign.

```json
{
  "id": "<AD_CAMPAIGN_ID>"
}
```

### Updating

You can update a campaign by making a `POST` request to `/<AD_CAMPAIGN_ID>`.

### Reading

To verify that you have successfully created a multidestination profile visit campaign, you can make a `GET` request to `/<AD_CAMPAIGN_ID>`. See the [Ad Campaign reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group#Reading) for the complete list of available parameters.

#### Request

```curl
curl -X GET -G \
  -d 'fields=name,status,objective' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<AD_CAMPAIGN_ID>
```

#### Response

```json
{
  "name": "Multidestination Profile Visit Campaign",
  "status": "ACTIVE",
  "objective": "OUTCOME_TRAFFIC",
  "id": "<AD_CAMPAIGN_ID>"
}
```

## Step 2: Create an ad set {#step-2}

Once you have an ad campaign, create your ad set. To create an ad set, make a `POST` request to the `/act_<AD_ACCOUNT_ID>/adsets` endpoint where `<AD_ACCOUNT_ID>` is the ID for your Meta ad account. Your request must include:

### Parameters

| Name | Description |
| --- | --- |
| `bid_strategy`<br><br>enum | **Optional.**  <br>The bid strategy for this campaign to suit your specific business goals. See the [Ad Campaign reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group) for more details.  <br>**Values:** `LOWEST_COST_WITHOUT_CAP`, `LOWEST_COST_WITH_BID_CAP`, `COST_CAP` |
| `billing_event`<br><br>enum | **Required.**  <br>Must be set to `IMPRESSIONS` for multidestination profile visit ads. Meta bills you when people see your ad. |
| `campaign_id`<br><br>numeric string or integer | **Required.**  <br>A valid multidestination profile visit campaign you wish to add this ad set to. |
| `daily_budget`<br><br>int64 | **Required** if `lifetime_budget` is not set.  <br>The daily budget defined in your account currency. Allowed only for ad sets with a duration (difference between `end_time` and `start_time`) longer than 24 hours.  <br>Either `daily_budget` or `lifetime_budget` must be greater than `0`. |
| `destination_type`<br><br>string | **Required.**  <br>Must be set to `INSTAGRAM_PROFILE_AND_FACEBOOK_PAGE` for multidestination profile visit ads.<br><br>**Note:** The Facebook Page referenced in `promoted_object.page_id` must have an Instagram business account connected to it for Meta to deliver to the Instagram destination. |
| `end_time`<br><br>datetime | **Required** when `lifetime_budget` is specified.  <br>When creating an ad set with a `daily_budget`, specify `end_time=0` or leave this field empty to set the ad set as ongoing with no end date.  <br>**Example:** `2026-09-12 23:59:59-07:00` or `2026-09-12 23:59:59 PDT`. UTC UNIX timestamp. |
| `lifetime_budget`<br><br>int64 | **Required** if `daily_budget` is not set.  <br>The lifetime budget of the ad set defined in your account currency. If specified, you must also specify an `end_time`.  <br>Either `daily_budget` or `lifetime_budget` must be greater than `0`. |
| `name`<br><br>string | **Required.**  <br>The name of the multidestination profile visit ad set. |
| `optimization_goal`<br><br>enum | **Required.**  <br>What the ad set is optimizing for. Must be set to `PROFILE_VISIT` for multidestination profile visit ads. |
| `promoted_object`<br><br>[AdPromotedObject](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-promoted-object) | **Required.**  <br>The object this ad set is promoting across all its ads. For multidestination profile visit ads, `promoted_object` has the following condition:<br><br>* `page_id`: **Required.** The ID of the Facebook Page connected to the Instagram business account you want to send traffic to.<br><br>See [Ad Set, Promoted Object](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-promoted-object) for more details. |
| `start_time`<br><br>datetime | **Optional.**  <br>The start time of the ad set. This field will default to the current time if no value is provided.  <br>**Example:** `2026-09-12 23:59:59-07:00` or `2026-09-12 23:59:59 PDT`. UTC UNIX timestamp. |
| `status`<br><br>enum | **Optional.**  <br>The status of the ad set. It can be different from the effective status due to its parent campaign. This field will default to `ACTIVE` if no value is provided.  <br>**Values:** `ACTIVE`, `PAUSED`, `DELETED`, `ARCHIVED` |
| `targeting`<br><br>Targeting object | **Required.**  <br>The targeting structure of the ad. See [Targeting](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/basic-targeting) for more details. |

Visit the [Ad Account Ad Set reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/adsets) for the complete list of available parameters.

#### Request

```curl
curl -X POST \
  -F 'access_token=<ACCESS_TOKEN>' \
  -F 'bid_strategy=LOWEST_COST_WITHOUT_CAP' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'daily_budget=<DAILY_BUDGET>' \
  -F 'destination_type=INSTAGRAM_PROFILE_AND_FACEBOOK_PAGE' \
  -F 'name=<AD_SET_NAME>' \
  -F 'optimization_goal=PROFILE_VISIT' \
  -F 'promoted_object={
      "page_id": "<PAGE_ID>"
    }' \
  -F 'status=ACTIVE' \
  -F 'start_time=<START_TIME>' \
  -F 'targeting={
        "geo_locations": { "countries":["US"] }
  }' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

#### Response

On success, your app receives a JSON response with the ID of your newly created ad set.

```json
{
  "id": "<AD_SET_ID>"
}
```

### Updating

You can update an ad set by making a `POST` request to `/<AD_SET_ID>`.

### Reading

To verify that you have successfully created a multidestination profile visit ad set, you can make a `GET` request to `/<AD_SET_ID>`. See the [Ad Set reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign) for the complete list of available parameters.

#### Request

```curl
curl -X GET -G \
  -d 'fields=name,destination_type,optimization_goal,bid_strategy' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<AD_SET_ID>
```

#### Response

```json
{
  "name": "<AD_SET_NAME>",
  "destination_type": "INSTAGRAM_PROFILE_AND_FACEBOOK_PAGE",
  "optimization_goal": "PROFILE_VISIT",
  "bid_strategy": "LOWEST_COST_WITHOUT_CAP",
  "id": "<AD_SET_ID>"
}
```

## Step 3: Create an ad creative {#step-3}

The ad creative allows you to add assets to your ads. To create an ad creative for a multidestination profile visit ad, make a `POST` request to the `/act_<AD_ACCOUNT_ID>/adcreatives` endpoint where `<AD_ACCOUNT_ID>` is the ID for your Meta ad account. Your request must include:

### Parameters

| Name | Description |
| --- | --- |
| `name`<br><br>string | **Required.**  <br>The name for your ad creative. |
| `object_story_spec`<br><br>[AdCreativeObjectStorySpec](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-object-story-spec) | **Required.**  <br>An object containing information about a message. See [Ad Creative Object Story Spec](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-object-story-spec) for more details.<br><br>Required:<br><br>* `page_id`: The ID of the Facebook Page.<br>* `instagram_user_id`: The ID of the Instagram business account connected to the Facebook Page. See [Set Up Instagram Accounts With Pages](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/pages-ig-account) for more details.<br><br>For multidestination profile visit ads, the call to actions for both the Instagram profile and Facebook Page destinations are configured through `asset_feed_spec.call_to_actions` (see below).<br><br>Optional:<br><br>* `link_data`: The spec for a link page post<br>* `photo_data`: The spec for a photo page post<br>* `video_data`: The spec for a video page post |
| `asset_feed_spec` | **Required.**  <br>A spec defining the call to action shown for each destination. For multidestination profile visit ads, you must include both call to actions and the multidestination optimization type:<br><br>* `call_to_actions`: A list with the call to action for each destination. Include both `VIEW_INSTAGRAM_PROFILE` (for the Instagram profile destination) and `VISIT_PROFILE` (for the Facebook Page destination). Each entry has a `type` and a `value` containing the destination link.<br>* `optimization_type`: Must be set to `UNIFIED_PROFILE_VISIT_DESTINATION` for multidestination profile visit ads. |
| `degrees_of_freedom_spec` | **Optional.**  <br>See [Standard Enhancements for Advantage+ Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/standard-enhancements) for more details. |

Visit the [Ad Creative reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative) for the complete list of available parameters.

### Ad creative create examples

#### Request

```curl
curl -X POST \
  -F 'name=<CREATIVE_NAME>' \
  -F 'object_story_spec={
       "page_id": "<PAGE_ID>",
       "instagram_user_id": "<IG_USER_ID>",
       "link_data": {
         "name": "<AD_HEADLINE>",
         "message": "<AD_PRIMARY_TEXT>",
         "image_hash": "<IMAGE_HASH>",
         "link": "https://www.instagram.com/<IG_USERNAME>",
         "call_to_action": {
           "type": "VIEW_INSTAGRAM_PROFILE",
           "value": {
             "link": "https://www.instagram.com/<IG_USERNAME>"
           }
         }
       }
     }' \
  -F 'asset_feed_spec={
       "call_to_actions": [
         {
           "type": "VIEW_INSTAGRAM_PROFILE",
           "value": {
             "link": "https://www.instagram.com/<IG_USERNAME>"
           }
         },
         {
           "type": "VISIT_PROFILE",
           "value": {
             "link": "https://www.facebook.com/<PAGE_USERNAME>"
           }
         }
       ],
       "optimization_type": "UNIFIED_PROFILE_VISIT_DESTINATION"
     }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

#### Response

On success, your app receives a JSON response with the ID of your newly created ad creative.

```json
{
  "id": "<AD_CREATIVE_ID>"
}
```

### Creating ad creatives using Instagram content

You can also create a multidestination profile visit ad creative from an existing Instagram post. Refer to [Use Posts as Instagram Ads](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/use-posts-as-ads) for more details.

```curl
curl -X POST \
  -F 'name=<CREATIVE_NAME>' \
  -F 'object_id=<PAGE_ID>' \
  -F 'instagram_user_id=<IG_USER_ID>' \
  -F 'source_instagram_media_id=<INSTAGRAM_POST_ID>' \
  -F 'object_type=PHOTO' \
  -F 'body=<AD_PRIMARY_TEXT>' \
  -F 'asset_feed_spec={
       "call_to_actions": [
         {
           "type": "VIEW_INSTAGRAM_PROFILE",
           "value": {
             "link": "https://www.instagram.com/<IG_USERNAME>"
           }
         },
         {
           "type": "VISIT_PROFILE",
           "value": {
             "link": "https://www.facebook.com/<PAGE_USERNAME>"
           }
         }
       ],
       "optimization_type": "UNIFIED_PROFILE_VISIT_DESTINATION"
     }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

### Updating

You can update an [ad creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative) by making a `POST` request to `/<AD_CREATIVE_ID>`.

### Reading

To verify that you have successfully created a multidestination profile visit ad creative, you can make a `GET` request to `/<AD_CREATIVE_ID>`. See [Ad Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative) for the complete list of available parameters.

#### Request

```curl
curl -X GET -G \
  -d 'fields=name,object_story_spec,call_to_action_type' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<AD_CREATIVE_ID>
```

#### Response

```json
{
  "name": "<CREATIVE_NAME>",
  "object_story_spec": {
    "page_id": "<PAGE_ID>",
    "instagram_user_id": "<IG_USER_ID>",
    "link_data": {
      "call_to_action": {
        "type": "VIEW_INSTAGRAM_PROFILE",
        "value": {
          "link": "https://www.instagram.com/<IG_USERNAME>"
        }
      }
    }
  },
  "id": "<AD_CREATIVE_ID>"
}
```

## Step 4: Create an ad {#step-4}

Ads allow you to associate ad creative information with your ad sets. To create an ad, make a `POST` request to the `/act_<AD_ACCOUNT_ID>/ads` endpoint where `<AD_ACCOUNT_ID>` is the ID for your Meta ad account. Your request must include:

### Parameters

| Name | Description |
| --- | --- |
| `name`<br><br>string | **Required.**  <br>The name for your ad. |
| `adset_id`<br><br>numeric string or integer | **Required.**  <br>The ID of the ad set. |
| `creative`<br><br>[AdCreative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative) | **Required.**  <br>The ad creative to be used by this ad. You may supply the `creative_id` of an existing ad creative or create a new ad creative by including all required fields. See [Ad Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative) for more details. |
| `status`<br><br>enum | **Required.**  <br>The configured status of the ad.  <br>**Values:** `ACTIVE`, `PAUSED`, `DELETED`, `ARCHIVED` |

#### Request

```curl
curl -X POST \
  -F 'name=<AD_NAME>' \
  -F 'adset_id=<AD_SET_ID>' \
  -F 'creative={
       "creative_id": "<AD_CREATIVE_ID>"
     }' \
  -F 'status=ACTIVE' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads
```

#### Response

On success, your app receives a JSON response with the ID of your newly created ad.

```json
{
  "id": "<AD_ID>"
}
```

### Updating

You can update an [ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup) by making a `POST` request to `/<AD_ID>`.

### Reading

To verify that you have successfully created a multidestination profile visit ad, you can make a `GET` request to `/<AD_ID>`. See the [ad reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup) for the complete list of available parameters.

#### Request

```curl
curl -X GET -G \
  -d 'fields=status,adset_id' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<AD_ID>
```

#### Response

```json
{
  "status": "ACTIVE",
  "adset_id": "<AD_SET_ID>",
  "id": "<AD_ID>"
}
```
