<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/messaging-ads/click-to-whatsapp | Saved: 2026-09-19 -->

# Ads that Click to WhatsApp



This guide explains how to create and publish ads that Click to WhatsApp using the Marketing API.

Ads that click to WhatsApp send people who click on your ads directly into conversations with your business in WhatsApp. You can use these ads to start conversations with a large audience and respond to each person individually.

Ads that click to WhatsApp support ads with an image, a video, a carousel, or a slideshow. You can also include call prompts in your ad.

If you're interested in creating ads that send people to Messenger or Instagram chats, see [Ads that Click to Messenger](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/messaging-ads/click-to-messenger) or [Ads that Click to Instagram](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/messaging-ads/click-to-instagram) for guidance. You can also create ads that pick the destination the user is most likely to respond from, see [Ads that Click to Multidestination](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/messaging-ads/click-to-multidestination) for more information.

### Ad creation overview

This document outlines the steps you need to follow to set up your integration for click to WhatsApp ads.

You will need to:

1. [Create an ad campaign](#step-1)
2. [Create an ad set that links your ads to your ad campaign](#step-2)
3. [Create an ad creative for the WhatsApp ad type you want to serve](#step-3)
4. [Create an ad by linking your ad creative to your ad set](#step-4)
5. [Publish your ad to Facebook, Instagram, and Messenger](#step-5)

## Before you start

This guide assumes you have:

* [An ad account with Meta](https://adsmanager.facebook.com/adsmanager/)
* [Uploaded any assets, such as images or videos, to be used in your ads to Meta servers](https://developers.facebook.com/documentation/business-messaging/messenger-platform/reference/attachment-upload-api)
* [A Facebook page with WhatsApp number linked](https://www.facebook.com/business/help/1583303048513172?id=2129163877102343) manually or [via API](https://developers.facebook.com/docs/graph-api/reference/page/page_whatsapp_number_verification)

To make successful calls to all endpoints in this guide, you will need:

* A Page access token requested by a person who can perform the ADVERTISE task on the Page
* The following permissions must be granted a person using your app:
    * `ads_management`
    * `pages_manage_ads`
    * `pages_read_engagement`
    * `pages_show_list`

## Step 1: Create an ad campaign {#step-1}

Start by creating your ad campaign. To do this, make a `POST` request to the `/act_<AD_ACCOUNT_ID>/campaigns` endpoint where `<AD_ACCOUNT_ID>` is the ID for your Meta ad account. Your request must include:

### Parameters

| Name | Description |
| --- | --- |
| `name`<br><br>string | **Required.**  <br>Name for the click to WhatsApp campaign. |
| `objective`<br><br>enum | **Required.**  <br>Campaign's objective.  <br>Supported objectives are `OUTCOME_ENGAGEMENT`, `OUTCOME_LEADS`, `OUTCOME_SALES`, and `OUTCOME_TRAFFIC`.  <br>**Note:** For campaigns with call prompts, `objective` must be `OUTCOME_ENGAGEMENT`. |
| `special_ad_categories`<br><br>list<Object> | **Required.**  <br>Special ad categories associated with the click to WhatsApp campaign. See the [Ad Campaign reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group) for more details. |
| `status`  <br><br>enum | **Optional.**  <br>Valid options are `PAUSED` and `ACTIVE`.  <br>If this status is `PAUSED`, Meta pauses all the campaign's active ad sets and ads and gives them an effective status of `CAMPAIGN_PAUSED`. |

#### Standard request

```curl
curl -X POST \
  -F 'name=Click to WhatsApp Campaign' \
  -F 'objective=OUTCOME_ENGAGEMENT' \
  -F 'status=ACTIVE' \
  -F 'special_ad_categories=[]' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/campaigns
```

#### Calling campaign request

```bash
curl -X POST \
  -F 'name=Click to WhatsApp Calling Campaign' \
  -F 'objective=OUTCOME_ENGAGEMENT' \
  -F 'status=PAUSED' \
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

To verify that you have successfully created a click to WhatsApp campaign, you can make a `GET` request to `/<AD_CAMPAIGN_ID>`. See the [Ad Campaign reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group#Reading) for the complete list of available parameters.

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
  "name": "Click to WhatsApp Campaign",
  "status": "PAUSED",
  "objective": "OUTCOME_ENGAGEMENT",
  "id": "<AD_CAMPAIGN_ID>"
}
```

## Step 2: Create an ad set {#step-2}

Once you have an ad campaign, create your ad set. To create an ad set, make a `POST` request to the `/act_<AD_ACCOUNT_ID>/adsets` endpoint where `<AD_ACCOUNT_ID>` is the ID for your Meta ad account. Your request must include:

### Parameters

| Name | Description | Sample value |
| --- | --- | --- |
| `bid_amount`<br><br>unsigned int32 | **Required** if `bid_strategy` is set to `LOWEST_COST_WITH_BID_CAP` or `COST_CAP`.  <br>The maximum amount you want to pay for a result based on your `optimization_goal`. | `1000` |
| `bid_strategy`<br><br>enum | **Optional.**  <br>The bid strategy for this campaign to suit your specific business goals. See the [Ad Campaign reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group) for more details.  <br>**Values:** `LOWEST_COST_WITHOUT_CAP`, `LOWEST_COST_WITH_BID_CAP`, `COST_CAP` | `LOWEST_COST_WITHOUT_CAP` |
| `billing_event`<br><br>enum | **Required.**  <br>Set this to `IMPRESSIONS` for ads that click to WhatsApp. Meta bills you when your ad is shown to people. | `IMPRESSIONS` |
| `campaign_id`<br><br>numeric string or integer | **Required.**  <br>A valid click to WhatsApp campaign you wish to add this ad set to. | `4523897324` |
| `daily_budget`<br><br>int64 | **Required** if `lifetime_budget` is not set.  <br>The daily budget defined in your account currency. Allowed only for ad sets with a duration (difference between `end_time` and `start_time`) longer than 24 hours.  <br>Either `daily_budget` or `lifetime_budget` must be greater than `0`. | `1` |
| `destination_type`<br><br>string | **Required.**  <br>Set to `WHATSAPP` for single-destination click to WhatsApp ads. | `WHATSAPP` |
| `end_time`<br><br>datetime | **Required** when `lifetime_budget` is specified.  <br>When creating an ad set with a `daily_budget`, specify `end_time=0` or leave this field empty to set the ad set as ongoing with no end date.  <br>**Example:** `2015-03-12 23:59:59-07:00` or `2015-03-12 23:59:59 PDT`. UTC UNIX timestamp. | `2026-05-12 23:59:59-07:00` |
| `lifetime_budget`<br><br>int64 | **Required** if `daily_budget` is not set.  <br>The lifetime budget of the ad set defined in your account currency. If specified, you must also specify an `end_time`.  <br>Either `daily_budget` or `lifetime_budget` must be greater than `0`. | `1` |
| `name`<br><br>string | **Required.**  <br>The name of the click to WhatsApp ad set. | `Jasper's Market` |
| `optimization_goal`<br><br>enum | **Required.**  <br>What the ad set is optimizing for. Depending on the campaign's objective, the ad set may be eligible for different optimization goals.<br><br>* `OUTCOME_ENGAGEMENT`: Engagement objective can optimize for `CONVERSATIONS`, and `LINK_CLICKS`.  <br>* `OUTCOME_SALES`: Sales objective can optimize for `CONVERSATIONS`, `OFFSITE_CONVERSIONS`, `LINK_CLICKS`, `IMPRESSIONS`, and `REACH`.  <br>* `OUTCOME_TRAFFIC`: Traffic objective can optimize for `CONVERSATIONS`, `LANDING_PAGE_VIEWS`, `LINK_CLICKS`, `IMPRESSIONS`, `REACH`, and `POST_ENGAGEMENT`.  <br>* `OUTCOME_LEADS`: Leads objective can optimize for `CONVERSATIONS`. | `OUTCOME_SALES` |
| `promoted_object`<br><br>[AdPromotedObject](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-promoted-object) | **Required.**  <br>The object this ad set is promoting across all its ads. For ads that click to WhatsApp, `promoted_object` has the following conditions:<br><br>Required:<br><br>* `page_id`: **Required.** The ID of the Facebook Page.<br><br>Optional:<br><br>* `whatsapp_phone_number`: The WhatsApp phone number associated with the click to WhatsApp ad set.<br><br>See [Ad Set, Promoted Object](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-promoted-object) for more details. | `{<br>"page_id": "452645324"<br>}` |
| `start_time`<br><br>datetime | **Optional.**  <br>The start time of the ad set. This field will default to the current time if no value is provided.  <br>**Example:** `2015-03-12 23:59:59-07:00` or `2015-03-12 23:59:59 PDT`. UTC UNIX timestamp. | `2026-03-12 23:59:59-07:00` |
| `status`<br><br>enum | **Optional.**  <br>The status of the ad set. The ad set status can be different from the effective status due to its parent campaign. This field will default to `ACTIVE` if no value is provided.  <br>**Values:** `ACTIVE`, `PAUSED`, `DELETED`, `ARCHIVED` | `ACTIVE` |
| `targeting`<br><br>Targeting object | **Required.**  <br>The targeting structure of an ad that clicks to WhatsApp. See [Targeting](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/basic-targeting) for more details.<br><br>To enable the WhatsApp Status feature, see [Placement targeting](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/placement-targeting) for more details. | `<br>{<br>"device_platforms": ["mobile"],<br>"geo_locations": {<br>"countries": ["US"]<br>}<br>}<br>` |
| `time_start`<br><br>datetime | **Optional.**  <br>Interchangeable with `start_time`. | `2026-02-14 22:59:59-07:00` |
| `time_stop`<br><br>datetime | **Required** when `lifetime_budget` is specified.  <br>Interchangeable with `end_time`. | `2026-05-12 23:59:59-07:00` |

Visit the [Ad Account Ad Set reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/adsets) for the complete list of available parameters.

#### Request

```curl
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "access_token":"<ACCESS_TOKEN>",
    "bid_amount":"<BID_AMOUNT>",
    "billing_event":"IMPRESSIONS",
    "campaign_id":"<CAMPAIGN_ID>",
    "daily_budget":"<DAILY_BUDGET>",
    "destination_type":"WHATSAPP",
    "name": "<AD_SET_NAME>",
    "optimization_goal": "IMPRESSIONS",
    "promoted_object": {
      "page_id": "<PAGE_ID>"
    },
    "status": "PAUSED",
    "start_time": "<START_TIME>",
    "targeting": {
      "geo_locations": { "countries":["US","CA"] },
      "device_platforms": ["mobile", "desktop"]
    }
  }' \
"https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets"
```

#### Response

```json
{
  "id": "<AD_SET_ID>"
}
```

### Updating

You can update an ad set by making a `POST` request to `/<AD_SET_ID>`.

### Reading

To verify that you have successfully created a click to WhatsApp ad set, you can make a `GET` request to `/<AD_SET_ID>`. See the [Ad Set reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign) for the complete list of available parameters.

#### Request

```curl
curl -X GET -G \
  -d 'fields=name,destination_type,optimization_goal,bid_strategy,status' \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/<AD_SET_ID>
```

#### Response

```json
{
  "name": "Click to WhatsApp Campaign",
  "status": "PAUSED",
  "objective": "OUTCOME_ENGAGEMENT",
  "id": "<AD_SET_ID>"
}
```

## Step 3: Create an ad creative {#step-3}

The ad creative allows you to add assets to your ads. To create an ad creative, make a `POST` request to the `/act_<AD_ACCOUNT_ID>/adcreatives` endpoint where `<AD_ACCOUNT_ID>` is the ID for your Meta ad account. Your request must include:

### Parameters

| Name | Description |
| --- | --- |
| `name`<br><br>string | **Required.**  <br>The name for your ad creative. |
| `object_story_spec`<br><br>[AdCreativeObjectStorySpec](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-object-story-spec) | **Required.**  <br>An object containing information about a message. See [Ad Creative Object Story Spec](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-object-story-spec) for more details.<br><br>Required:<br><br>* `page_id`: The ID of the Facebook Page<br><br>Optional:<br><br>* `link_data`: The spec for a link page post or [carousel ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/videoads)<br>* `photo_data`: The spec for a photo page post<br>* `text_data`: The spec for a text page post<br>* `video_data`: The spec for a video page post |
| `degrees_of_freedom_spec` | **Optional.**  <br>See [Standard Enhancements for Advantage+ Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/standard-enhancements) for more details. |

Visit the [Ad Creative reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative) for the complete list of available parameters.

### Filling out a Page welcome message

The default message that a customer sees is "Hello! Can I get more info on this?". You can create more tailored user experiences for your ads that click to WhatsApp by customizing your ads' greeting message in the `page_welcome_message` field under `object_story_spec`.

**Note:** If you are using the WhatsApp message to trigger any WhatsApp Flows, please make sure to work with your BSP and agencies when updating it to ensure your Flows aren't disrupted.

### Examples

#### Adding autofill message with a greeting message

```json
"page_welcome_message": {
  "type": "VISUAL_EDITOR",
  "version": 2,
  "landing_screen_type": "welcome_message",
  "media_type": "text",
  "text_format": {
    "customer_action_type": "autofill_message",
    "message": {
      "autofill_message": {
        "content": "<AUTOFILL_MESSAGE>"
      },
      "text": "<GREETING_MESSAGE>"
    }
  }
}
```

#### Adding an automated greeting message with Call Now call to action

```json
     "page_welcome_message": {
    "type": "VISUAL_EDITOR",
    "version": 2,
    "landing_screen_type": "welcome_message",
    "media_type": "text",
    "text_format": {
      "customer_action_type": "autofill_message",
      "message": {
        "text": "<AUTOMATED_GREETING_MESSAGE_TEXT>",
        "automated_greeting_message_cta": {
          "type": "call"
        },
        "autofill_message": {
          "content": "<AUTOFILL_MESSAGE_CONTENT>"
        }
      }
    }
}
```

#### Adding an automated greeting message with View Website call to action

```json
"page_welcome_message": {
    "type": "VISUAL_EDITOR",
    "version": 2,
    "landing_screen_type": "welcome_message",
    "media_type": "text",
    "text_format": {
      "customer_action_type": "autofill_message",
      "message": {
        "text": "<AUTOMATED_GREETING_MESSAGE_TEXT>",
        "automated_greeting_message_cta": {
          "type": "url",
          "url": "<WEBSITE_URL>"
        },
        "autofill_message": {
         "content": "<AUTOFILL_MESSAGE_CONTENT>"
        }
      }
    }
  }
```

#### Adding an automated greeting message with View Catalog call to action

```
"page_welcome_message": {
  "type": "VISUAL_EDITOR",
  "version": 2,
  "landing_screen_type": "welcome_message",
  "media_type": "text",
  "text_format": {
    "customer_action_type": "autofill_message",
    "message": {
      "text": "<AUTOMATED_GREETING_MESSAGE_TEXT>",
      "automated_greeting_message_cta": {
        "type": "catalog"
      },
      "autofill_message": {
        "content": "<AUTOFILL_MESSAGE_CONTENT>"
      }
    }
  }
}
```

#### Adding an automated greeting message with a Flows call to action

Only Flows that fit the following criteria can be used to create an ad creative:

* WhatsApp Flows version > 5.1
* No validation errors
* Static Flow (i.e., a Flow without data exchange)
* Single screen
* Only eligible components:
    * Text Heading
    * Text Subheading
    * Text Body
    * Text Caption
    * Text Input
    * Text Area
    * Date Picker
    * Radio Buttons Group
    * Footer
    * Checkbox Group
* No more than 8 components in the screen
* At least 1 input component such as:
    * Text Input
    * Text Area
    * Date Picker
    * Radio Buttons Group
    * Checkbox Group

```json
"page_welcome_message": {
  "type": "VISUAL_EDITOR",
  "version": 2,
  "landing_screen_type": "ctwa_flows",
  "media_type": "text",
  "text_format": {
    "customer_action_type": "whatsapp_flow",
    "message": {
      "text": "<AUTOMATED_GREETING_MESSAGE_TEXT>",
      "automated_greeting_message_cta": {
        "type": "flow",
        "flow_data":{
          "call_to_action":"Apply now",
          "flow_id":"<FLOW_ID>"
        }
      },
      "autofill_message": {
        "content": "<AUTOFILL_MESSAGE_CONTENT>"
      }
    }
  }
}
```

**Note:** The `flow_id` passed above, should belong to the same WhatsApp Business account as that of the phone number that is promoted in the ad set. See more about [WhatsApp Flows](https://developers.facebook.com/documentation/business-messaging/whatsapp/flows/gettingstarted).

#### Adding icebreakers with a greeting message

```
"page_welcome_message": {
  "type": "VISUAL_EDITOR",
  "version": 2,
  "landing_screen_type": "welcome_message",
    "media_type": "text",
    "text_format": {
      "customer_action_type": "ice_breakers",
      "message": {
        "text": "<GREETING_MESSAGE>",
        "ice_breakers": [
          {
            "title": "<ICEBREAKER>"
          },
          {
            "title": "<ICEBREAKER>"
          },
          {
            "title": "<ICEBREAKER>"
          }
        ]
      }
    }
  }
}
```

#### Adding message with a call prompt

```
curl \
  -F 'object_story_spec={
      "page_id": "<PAGE_ID>"
      "link_data": {
     "image_hash":<IMAGE_HASH>
            "call_to_action": {
                "type": "WHATSAPP_MESSAGE",
                "value": {
                    "app_destination": "WHATSAPP"
                }
          },
          "link": "https://api.whatsapp.com/send",
          "name": <AD_HEADLINE>",
          "page_welcome_message":
       "type": "VISUAL_EDITOR",
        "version": 2,
        "landing_screen_type": "ctwa_call_prompt",
        "media_type": "text",
        "text_format": {
          "message": {
            "text": "<MESSAGE>",
            "call_prompt_data": {
              "call_prompt_message": "<CALL_PROMPT_MESSAGE>"
            }
          }
        },
        "user_edit": false
      },
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

#### Response

```json
{
  "id": "<AD_CREATIVE_ID>"
}
```

### Ad creative create examples

#### Request

```curl
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
        "name": "Sample ad creative",
        "object_story_spec": {
          "page_id": "<PAGE_ID>",
          "link_data": {
            "name": "<AD_HEADLINE>",
            "message": "<AD_PRIMARY_TEXT>",
            "description": "<AD_DESCRIPTION>",
            "image_hash": "<IMAGE_HASH>",
            "link": "https://api.whatsapp.com/send",
            "page_welcome_message": "<PAGE_WELCOME_MESSAGE>",
            "call_to_action": {
              "type": "WHATSAPP_MESSAGE",
              "value": {
                "app_destination": "WHATSAPP"
              }
            }
          }
        },
        "degrees_of_freedom_spec": {
          "creative_features_spec": {
            "standard_enhancements": {
              "enroll_status": "OPT_IN"
            }
          }
        }
      }' \
"https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives"
```

#### Response

On success, your app receives a JSON response with the ID of your newly created ad creative.

```json
{
  "id": "<AD_CREATIVE_ID>"
}
```

### Ad that uses a messaging sequence configured on a partner app

```curl
curl -X POST "https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives"
     -H "Content-Type: application/json"
     -d '{
           "access_token": "<PAGE_ACCESS_TOKEN>",
           "name": "<IMAGE_AD_NAME>",
           "object_story_spec": {
             "page_id": "<PAGE_ID>",
             "link_data": {
               "image_hash": "<IMAGE_HASH>",
               "link": "<IMAGE_URL>",
               "call_to_action": {
                 "type": "WHATSAPP_MESSAGE",
                 "value":{"app_destination":"WHATSAPP"}
               }
             }
           },
           "asset_feed_spec": {
             "additional_data": {
               "partner_app_welcome_message_flow_id": "SEQUENCE-ID"
             }
           }
         }'
```

For more information about message sequences, refer to [Welcome message sequences](https://developers.facebook.com/documentation/business-messaging/whatsapp/ctwa/welcome-message-sequences) in the WhatsApp Business Platform documentation.

### Creating ad creatives using Instagram content

You can also use your existing Instagram content for your ad creatives.

```curl
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
        "source_instagram_media_id": "<INSTAGRAM_MEDIA_ID>",
        "instagram_user_id": "<INSTAGRAM_USER_ID>",
        "object_id": "<PAGE_ID>",
        "call_to_action": {
          "type": "WHATSAPP_MESSAGE",
            "value": {
              "link": "https://api.whatsapp.com/send",
              "app_destination": "WHATSAPP"
            }
          }
        },
        "degrees_of_freedom_spec": {
          "creative_features_spec": {
            "standard_enhancements": {
              "enroll_status": "OPT_IN"
            }
          }
        }
      }' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

### Updating

You can update an [ad creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative) by making a `POST` request to `/<AD_CREATIVE_ID>`.

### Reading

To verify that you have successfully created a click to WhatsApp ad creative, you can make a `GET` request to `/<AD_CREATIVE_ID>`. See [Ad Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative) for the complete list of available parameters.

#### Request

```curl
curl -X GET -G \
  -d 'fields=name,object_story_spec{link_data{call_to_action,page_welcome_message}}' \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/<AD_CREATIVE_ID>
```

#### Response

```json
{
  "name": "Sample ad creative",
  "object_story_spec": {
    "page_welcome_message": {
      "type": "VISUAL_EDITOR",
      "version": 2,
      "landing_screen_type": "welcome_message",
      "media_type": "text",
      "text_format": {
        "customer_action_type": "autofill_message",
        "message": {
          "autofill_message": {
            "content": "Sample autofill message"
          },
        "text": "Sample greeting message"
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
  -H "Content-Type: application/json" \
  -d '{
        "name": "Sample ad",
        "adset_id": "<AD_SET_ID>",
        "creative": {
          "creative_id": "<AD_CREATIVE_ID>"
        },
        "status": "PAUSED"
     }' \
  "https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads"
```

#### Response

```json
{
  "id": "<AD_ID>"
}
```

### Updating

You can update an [ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup) by making a `POST` request to `/<AD_ID>`.

### Reading

To verify that you have successfully created a click to WhatsApp ad, you can make a `GET` request to `/<AD_ID>`. See the [ad reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup) for the complete list of available parameters.

#### Request

```curl
curl -X GET -G \
  -d 'fields=status,adset_id,campaign_id' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<AD_ID>
```

#### Response

```json
{
  "status": "PAUSED",
  "adset_id": "<AD_SET_ID>",
  "campaign_id": "<AD_CAMPAIGN_ID>",
  "id": "<AD_ID>"
}
```

## Step 5: Publish your ad {#step-5}

Verify your ad exists in Ads Manager. When you are ready to publish your changes, select your campaign, the ad set for the campaign, and the ad, and click the **Publish** button.

You can also publish your ad using the API. Send a `POST` request to `/<AD_ID>` with the `status` parameter set to `ACTIVE` where `<AD_ID>` is the ad you want to publish.

Meta reviews your ad, and the status will be `PENDING_REVIEW`. Once approved, the status will automatically update to `ACTIVE`, and your ad will be delivered.
