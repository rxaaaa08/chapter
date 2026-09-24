<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/messaging-ads/click-to-multidestination | Saved: 2026-09-19 -->

# Ads that Click to Multidestination



This guide explains how to create and publish ads that click to multidestination using the Marketing API.

To create a multidestination ad, configure an ad campaign, ad set, ad creative, and ad through the Marketing API. When someone clicks the ad, it opens a conversation with the business in one of the messaging apps (Messenger, Instagram, or WhatsApp) that the person is most likely to respond from.

A multidestination ad can open any combination of these destinations: Messenger chat, Instagram chat, and WhatsApp chat.

If you'd like to create an ad that only goes to one destination, see:

* [Ads that Click to Messenger](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/messaging-ads/click-to-messenger)
* [Ads that Click to Instagram](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/messaging-ads/click-to-instagram)  
* [Ads that Click to WhatsApp](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/messaging-ads/click-to-whatsapp)

### Ad creation overview

This document outlines the steps you need to follow to set up your integration for click to multidestination ads. You will need to:

1. [Create an ad campaign](#step-1)
2. [Create an ad set that links your ads to your ad campaign](#step-2)
3. [Create an ad creative for the Multi Destination ad type you want to serve](#step-3)
4. [Create an ad by linking your ad creative to your ad set](#step-4)

## Before you begin

This guide assumes you have:

* [An ad account with Meta](https://adsmanager.facebook.com/adsmanager/)
* [Uploaded any assets, such as images or videos, to be used in your ads to Meta servers](https://developers.facebook.com/documentation/business-messaging/messenger-platform/reference/attachment-upload-api)

## Step 1: Create an ad campaign {#step-1}

Start by creating your ad campaign. To do this, make a `POST` request to the `/act_<AD_ACCOUNT_ID>/campaigns` endpoint where `<AD_ACCOUNT_ID>` is the ID for your Meta ad account. Your request must include:

### Parameters

| Name | Description |
| --- | --- |
| `name`<br><br>string | **Required.**  <br>Name for the click to multidestination campaign. |
| `objective`<br><br>enum | **Required.**  <br>Campaign's objective.  <br>Supported objectives are `OUTCOME_ENGAGEMENT`, `OUTCOME_SALES`, and `OUTCOME_TRAFFIC`. |
| `special_ad_categories`<br><br>list<Object> | **Required.**  <br>Special ad categories associated with the click to multidestination campaign. Currently, special ad categories aren't supported for ads that click to multidestination, so it needs to be `NONE` or empty array. See the [Ad Campaign reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group) for more details. |
| `status`  <br><br>enum | **Optional.**  <br>Valid options are `PAUSED` and `ACTIVE`.  <br>If this status is `PAUSED`, all its active ad sets and ads will be paused and have an effective status `CAMPAIGN_PAUSED`. |

#### Request

```curl
curl -X POST \
  -F 'name=Click to Multi Destination Campaign' \
  -F 'objective=OUTCOME_ENGAGEMENT' \
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

To verify that you have successfully created a click to multidestination campaign, you can make a `GET` request to `/<AD_CAMPAIGN_ID>`. See the [Ad Campaign reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group#Reading) for the complete list of available parameters.

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
  "name": "Click to Multi Destination Campaign",
  "status": "ACTIVE",
  "objective": "OUTCOME_ENGAGEMENT",
  "id": "<AD_CAMPAIGN_ID>"
}
```

## Step 2: Create an ad set {#step-2}

Once you have an ad campaign, create your ad set. To create an ad set, make a `POST` request to the `/act_<AD_ACCOUNT_ID>/adsets` endpoint where `<AD_ACCOUNT_ID>` is the ID for your Meta ad account. Your request must include:

### Parameters

| Name | Description |
| --- | --- |
| `bid_amount`<br><br>unsigned int32 | **Required** if `bid_strategy` is set to `LOWEST_COST_WITH_BID_CAP` or `COST_CAP`.  <br>The maximum amount you want to pay for a result based on your `optimization_goal`. |
| `bid_strategy`<br><br>enum | **Optional.**  <br>The bid strategy for this campaign to suit your specific business goals. See the [Ad Campaign reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group) for more details.  <br>**Values:** `LOWEST_COST_WITHOUT_CAP`, `LOWEST_COST_WITH_BID_CAP`, `COST_CAP` |
| `billing_event`<br><br>enum | **Required.**  <br>Must be set to `IMPRESSIONS` for ads that click to multidestination. Meta bills you when people see your ad. |
| `campaign_id`<br><br>numeric string or integer | **Required.**  <br>A valid click to multidestination campaign you wish to add this ad set to. |
| `daily_budget`<br><br>int64 | **Required** if `lifetime_budget` is not set.  <br>The daily budget defined in your account currency. Allowed only for ad sets with a duration (difference between `end_time` and `start_time`) longer than 24 hours.  <br>Either `daily_budget` or `lifetime_budget` must be greater than `0`. |
| `destination_type`<br><br>string | **Required.**  <br><br>* Set to `MESSAGING_INSTAGRAM_DIRECT_MESSENGER_WHATSAPP` if you want to use all three destinations (Messenger, WhatsApp, and Instagram).  <br>* Set to `MESSAGING_INSTAGRAM_DIRECT_MESSENGER` if you want to use Messenger and Instagram.  <br>* Set to `MESSAGING_MESSENGER_WHATSAPP` if you want to use Messenger and WhatsApp.  <br>* Set to `MESSAGING_INSTAGRAM_DIRECT_WHATSAPP` if you want to use WhatsApp and Instagram.<br><br>**Note:** If you include WhatsApp in the destinations, please make sure you have WhatsApp business number connected to your page. If you include Instagram in the destinations, please make sure you have Instagram business account connected to your page. |
| `end_time`<br><br>datetime | **Required** when `lifetime_budget` is specified.  <br>When creating an ad set with a `daily_budget`, specify `end_time=0` or leave this field empty to set the ad set as ongoing with no end date.  <br>**Example:** `2015-03-12 23:59:59-07:00` or `2015-03-12 23:59:59 PDT`. UTC UNIX timestamp. |
| `lifetime_budget`<br><br>int64 | **Required** if `daily_budget` is not set.  <br>The lifetime budget of the ad set defined in your account currency. If specified, you must also specify an `end_time`.  <br>Either `daily_budget` or `lifetime_budget` must be greater than `0`. |
| `name`<br><br>string | **Required.**  <br>The name of the click to multidestination ad set. |
| `optimization_goal`<br><br>enum | **Required.**  <br>What the ad set is optimizing for. Must be set to `CONVERSATIONS` for ads that click to multidestination. Depending on the campaign's objective, the ad set may be eligible for different optimization goals. |
| `promoted_object`<br><br>[AdPromotedObject](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-promoted-object) | **Required.**  <br>The object this ad set is promoting across all its ads. For ads that click to multidestination, `promoted_object` has the following conditions:<br><br>* `page_id`: **Required.** The ID of the Facebook Page.<br><br>See [Ad Set, Promoted Object](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-promoted-object) for more details. |
| `start_time`<br><br>datetime | **Optional.**  <br>The start time of the ad set. This field will default to the current time if no value is provided.  <br>**Example:** `2015-03-12 23:59:59-07:00` or `2015-03-12 23:59:59 PDT`. UTC UNIX timestamp. |
| `status`<br><br>enum | **Optional.**  <br>The status of the ad set. It can be different from the effective status due to its parent campaign. This field will default to `ACTIVE` if no value is provided.  <br>**Values:** `ACTIVE`, `PAUSED`, `DELETED`, `ARCHIVED` |
| `targeting`<br><br>Targeting object | **Required.**  <br>The targeting structure of the ad. See [Targeting](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/basic-targeting) for more details. |
| `time_start`<br><br>datetime | **Optional.**  <br>Interchangeable with `start_time`. |
| `time_stop`<br><br>datetime | **Required** when `lifetime_budget` is specified.  <br>Interchangeable with `end_time`. |

Visit the [Ad Account Ad Set reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/adsets) for the complete list of available parameters.

#### Request

```curl
curl -X POST \
  -F 'access_token=<ACCESS_TOKEN>' \
  -F 'bid_strategy=LOWEST_COST_WITHOUT_CAP' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'daily_budget=<DAILY_BUDGET>' \
  -F 'destination_type=<DESTINATION_TYPE>' \
  -F 'name=<AD_SET_NAME>' \
  -F 'optimization_goal=CONVERSATIONS' \
  -F 'promoted_object={
      "page_id": "<PAGE_ID>"
    }' \
  -F 'status=ACTIVE' \
  -F 'start_time=<START_TIME>' \
  -F 'targeting={
        "geo_locations": { "countries":["US","CA"] },
        "device_platforms": ["mobile", "desktop"]
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

To verify that you have successfully created a click to multidestination ad set, you can make a `GET` request to `/<AD_SET_ID>`. See the [Ad Set reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign) for the complete list of available parameters.

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
  "destination_type": "<DESTINATION_TYPE>",
  "optimization_goal": "CONVERSATIONS",
  "bid_strategy": "LOWEST_COST_WITHOUT_CAP",
  "id": "<AD_SET_ID>"
}
```

## Step 3: Create an ad creative {#step-3}

The ad creative allows you to add assets to your ads. To create an ad creative, make a `POST` request to the `/act_<AD_ACCOUNT_ID>/adcreatives` endpoint where `<AD_ACCOUNT_ID>` is the ID for your Meta ad account. Your request must include:

### Parameters

| Name | Description |
| --- | --- |
| `asset_feed_spec` | **Required.**  <br>Specify the destinations of ads that click to Multi Destination<br><br>Required:<br><br>* `optimization_type`: Must be set to `DOF_MESSAGING_DESTINATION` for ads that click to multidestination.<br>* `call_to_actions`: Array of the selected destinations of ads that click to multidestination. It needs to match with the `destination_type` specified in the ad set.<br><br>**Messenger**  <br><br>```
{
  "type": "MESSAGE_PAGE",
    "value": {
       "app_destination": "MESSENGER",
       "link": "https://fb.com/messenger_doc/"
    }
}
```<br><br>**WhatsApp**<br><br>```
{
  "type": "WHATSAPP_MESSAGE",
    "value": {
       "app_destination": "WHATSAPP",
       "link": "https://api.whatsapp.com/send"
    }
}
```<br><br>**Instagram**<br><br>```
{
  "type": "INSTAGRAM_MESSAGE",
    "value": {
       "app_destination": "INSTAGRAM_DIRECT",
       "link": "https://www.instagram.com"
    }
}
``` |
| `name`<br><br>string | **Required.**  <br>The name for your ad creative. |
| `object_story_spec`<br><br>[AdCreativeObjectStorySpec](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-object-story-spec) | **Required.**  <br>An object containing information about a message. See [Ad Creative Object Story Spec](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-object-story-spec) for more details.<br><br>Required:<br><br>* `page_id`: The ID of the Facebook Page<br>* `instagram_user_id`: Instagram Account ID. There are three ways to [obtain an Instagram account ID](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/instagramads/get-started): Business Manager owned Instagram account, Page connected Instagram account, and Page backed Instagram account.<br><br>Optional:<br><br>* `link_data`: The spec for a link page post or [carousel ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/videoads)<br>* `photo_data`: The spec for a photo page post<br>* `text_data`: The spec for a text page post<br>* `video_data`: The spec for a video page post |
| `degrees_of_freedom_spec` | **Optional.**  <br>See [Standard Enhancements for Advantage+ Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/standard-enhancements) for more details. |

Visit the [Ad Creative reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative) for the complete list of available parameters.

### Filling out page welcome message

The default message that a customer sees is "Hello! Can I get more info on this?". You can create more tailored user experiences for your ads that click to multidestination by customizing your ads' greeting message, icebreakers, and autofill messages in the `page_welcome_message` field under `object_story_spec`.

For more information about icebreakers, see the [`ice_breakers` reference](https://developers.facebook.com/documentation/business-messaging/messenger-platform/reference/messenger-profile-api/ice-breakers).

#### Limitations

* Icebreaker titles must not be more than 80 characters.
* Icebreaker responses must not be more than 300 characters.
* Message text must not be more than 300 characters.

#### Example
Create the `page_welcome_message` object to add icebreakers with a greeting message.

```
"page_welcome_message": {
  "type":"VISUAL_EDITOR",
  "version":2,
  "landing_screen_type":"welcome_message",
  "media_type":"text",
  "text_format":{
    "customer_action_type":"ice_breakers",
    "message":{
      "ice_breakers":[
        {"title":"Can I make a purchase?","response":"This is a response 1"},
        {"title":"Can I see a menu?", "response":"This is a response 2"},
        {"title":"Where are you located?", "response":"This is a response 3"}],
      "quick_replies":[],
      "text":"Hi {{user_first_name}}! Please let us know how we can help you."}
  },
  "user_edit":false,
  "surface":"visual_editor_new"
}
```

### Ad creative create examples

Add the `page_welcome_message` field to the creative as follows.

#### Request

```curl
curl -X POST \
-F 'name=<CREATIVE_NAME>' \
-F 'object_story_spec={
     "page_id": "438346666550309",
     "link_data": {
       "name": "<AD_HEADLINE>",
       "message": "<AD_PRIMARY_TEXT>",
       "image_hash": "<IMAGE_HASH>"
       "link": "https://fb.com/messenger_doc/",
       "page_welcome_message": "<PAGE_WELCOME_MESSAGE>",
       "call_to_action": {
         "type": "MESSAGE_PAGE",
         "value": {
           "app_destination": "MESSENGER"
         }
       }
     }
   }' \
-F 'asset_feed_spec={
     "optimization_type": "DOF_MESSAGING_DESTINATION",
     "call_to_actions": [
       {
         "type": "MESSAGE_PAGE",
         "value": {
           "app_destination": "MESSENGER",
           "link": "https://fb.com/messenger_doc/"
         }
       },
       {
         "type": "WHATSAPP_MESSAGE",
         "value": {
           "app_destination": "WHATSAPP",
           "link": "https://api.whatsapp.com/send"
         }
       },
       {
         "type": "INSTAGRAM_MESSAGE",
         "value": {
           "app_destination": "INSTAGRAM_DIRECT",
           "link": "https://www.instagram.com"
         }
       }
     ]
   }' \
-F 'degrees_of_freedom_spec={
     "creative_features_spec": {
       "standard_enhancements": {
         "enroll_status": "OPT_IN"
       }
     }
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

#### Instagram posts

Refer to [Use Posts as Instagram Ads](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/use-posts-as-ads) for more details.

```curl
curl -X POST \
  -F 'name=Sample ad creative from Instagram post' \
  -F 'object_id=<PAGE_ID>' \
  -F 'instagram_user_id=<IG_USER_ID>' \
  -F 'source_instagram_media_id=<INSTAGRAM_POST_ID>' \
  -F 'call_to_action={
       "type": "INSTAGRAM_MESSAGE",
       "value": {
         "link": "https://www.instagram.com"
       }
     }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

#### Instagram images

```curl
curl -X POST \
  -F 'name=Sample ad creative from Instagram image' \
  -F 'object_story_spec={
       "page_id": "<PAGE_ID>",
       "instagram_user_id": "<IG_USER_ID>",
       "link_data": {
         "message": "<AD_PRIMARY_TEXT>",
         "picture": "<IMAGE_URL>"
         "page_welcome_message": "<PAGE_WELCOME_MESSAGE>",
         "call_to_action": {
           "type": "INSTAGRAM_MESSAGE",
           "value": {
             "app_destination": "INSTAGRAM_DIRECT"
           }
         }
       }
     }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

### Creating ad creatives using Facebook content

Refer to [Use Posts as Instagram Ads: Facebook Posts](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/use-posts-as-ads#facebook-posts) for more details.

```
curl -i -X POST \
  "https://graph.facebook.com/v25.0/act_<AD_ACCOUNT>/adcreatives
  ?object_story_id=<postOwnerID_postID>
  &instagram_user_id=<IG_USER_ID>
  &call_to_action="{'type':MESSAGE_PAGE,'value':{'app_destination':'MESSENGER'}}"
  &access_token=<ACCESS_TOKEN>"
```

Where `object_story_id` is the post ID in the format of `postOwnerID_postID` and `instagram_user_id` is either a Page-connected Instagram account ID or the Page-backed Instagram account ID. See more details in [Set Up Instagram Accounts With Pages](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/pages-ig-account).  

### Updating

You can update an [ad creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative) by making a `POST` request to `/<AD_CREATIVE_ID>`.

### Reading

To verify that you have successfully created a click to multidestination ad creative, you can make a `GET` request to `/<AD_CREATIVE_ID>`. See [Ad Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative) for the complete list of available parameters.

#### Request

```curl
curl -X GET -G \
  -d 'fields=name,object_story_spec{page_welcome_message},asset_feed_spec' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<AD_CREATIVE_ID>
```

#### Response

```json
{
  "name": "<CREATIVE_NAME>",
  "object_story_spec": {
    "page_welcome_message": {
      "type": "VISUAL_EDITOR",
      "version": 2,
      "landing_screen_type": "welcome_message",
      "media_type": "text",
      "text_format": {
        "customer_action_type": "ice_breakers",
        "message": {
          "text": "Sample greeting message",
          "ice_breakers": [
            {
              "title": "Sample icebreaker"
            },
            {
              "title": "Sample icebreaker"
            },
            {
              "title": "Sample icebreaker"
            }
          ]
        }
      }
    }
  },
  "asset_feed_spec": {
    "optimization_type": "DOF_MESSAGING_DESTINATION",
    "call_to_actions": [
      {
        "type": "MESSAGE_PAGE",
        "value": {
          "app_destination": "MESSENGER",
          "link": "https://fb.com/messenger_doc/"
        }
      },
      {
        "type": "WHATSAPP_MESSAGE",
        "value": {
          "app_destination": "WHATSAPP",
          "link": "https://api.whatsapp.com/send"
        }
      },
      {
        "type": "INSTAGRAM_MESSAGE",
        "value": {
          "app_destination": "INSTAGRAM_DIRECT",
          "link": "https://www.instagram.com"
        }
      }
    ]
  },
  "id": "<AD_CREATIVE_ID>"
}
```

## Step 4: Create an ad {#step-4}

Ads allow you to associate ad creative information with your ad sets. To create an ad, make a `POST` request to the `/act_<AD_ACCOUNT_ID>/ads` endpoint where `<AD_ACCOUNT_ID>` is the ID for your Meta ad account. Your request must include:

### Parameters

| Name | Description |
| --- | --- |
| `name`<br><br>string | **Required.**  <br>The name for your ad creative. |
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

### Call to action

You can also set a call to action when creating your ad.

```
"asset_feed_spec": {
  "optimization_type": "DOF_MESSAGING_DESTINATION",
  "call_to_actions": [
    {
      "type": "MESSAGE_PAGE",
      "value": {
        "app_destination": "MESSENGER",
        "link": "https://fb.com/messenger_doc/"
      }
    },
    {
      "type": "INSTAGRAM_MESSAGE",
      "value": {
        "app_destination": "INSTAGRAM_DIRECT",
        "link": "https://www.instagram.com"
      }
    }
  ]
}
```

See the [Asset Feed Spec documentation](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/asset-feed-spec) for more information.

### Updating

You can update an [ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup) by making a `POST` request to `/<AD_ID>`.

### Reading

To verify that you have successfully created a click to multidestination ad, you can make a `GET` request to `/<AD_ID>`. See the [ad reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup) for the complete list of available parameters.

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
