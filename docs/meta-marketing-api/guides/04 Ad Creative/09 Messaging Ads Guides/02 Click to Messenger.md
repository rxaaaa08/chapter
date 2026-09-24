<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/messaging-ads/click-to-messenger | Saved: 2026-09-19 -->

# Ads that Click to Messenger



This guide explains how to create and publish ads that click to Messenger using the Marketing API.

If you would like to use the Ads Manager to create a campaign for lead ads, visit the [Meta Business Help Center](https://www.facebook.com/business/help/2398917563501477).

Ads that click to Messenger send people that click on your ads directly into conversations with your business in Messenger. Use these ads to reach people at scale and deliver standout, individualized service.

Ads that click to Messenger support ads with an image, a video, a carousel, or a slideshow. You can also include call prompts in your ad.

If you're interested in creating ads that send people to Instagram or WhatsApp chats, see [Ads that Click to Instagram](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/messaging-ads/click-to-instagram) or [Ads that Click to WhatsApp](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/messaging-ads/click-to-whatsapp) for guidance. You can also create ads that pick the destination the user is most likely to respond from, see [Ads that Click to Multidestination](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/messaging-ads/click-to-multidestination) for more information.

### Ad Creation Overview

To create and publish an ad you will:

1. [Create an ad campaign](#campaign)
2. [Create an ad set that links your ads to your ad campaign](#adset)
3. [Create an ad creative for the Messenger Ad type you want to serve](#ad-creative)
4. [Create an ad by linking your ad creative to your ad set](#ad)
5. [Publish your ad to Facebook, Instagram, and Messenger](#publish-ad)

## Before You Start

This guide assumes you have:

- [An ad account with Meta](https://adsmanager.facebook.com/adsmanager/)

- [The Messenger Platform integrated into your app or website](https://developers.facebook.com/documentation/business-messaging/messenger-platform)

- [Uploaded any assets, such as images or videos, to be used in your ads to Meta servers](https://developers.facebook.com/documentation/business-messaging/messenger-platform/reference/attachment-upload-api)

To make successful calls to all endpoints in this guide, you will need:

* A Page access token requested by a person who can perform the `ADVERTISE` task on the Page
* The following permissions must be granted by your app user:
    * `ads_management`
    * `pages_manage_ads`
    * `pages_read_engagement`
    * `pages_show_list`

## Step 1. Create a Campaign {#campaign}

To create your ad campaign send a `POST` request to the `act_***ad_account_id***/campaigns` endpoint where ***ad_account_id*** is the ID for your Meta ad account. Your request must include:

- `access_token`

- `buying_type`

- `name`

- `objective` – set to `OUTCOME_TRAFFIC`, or `OUTCOME_LEADS` for lead ads

- `special_ad_categories`

- `status`

#### Ad Campaign Quick Reference
| Parameter | Value |
| --- | --- |
| `access_token` | Your Page access token |
| `buying_type` | Set to `AUCTION` (the default) for Messenger Ads for Leads |
| `name` *string* | The name for your ad campaign |
| `objective` *enum* | Campaign's objective.  <br>`OUTCOME_TRAFFIC` for CTS.  <br>`OUTCOME_LEADS` for Messenger Ads for Leads.  <br>`OUTCOME_ENGAGEMENT`, `OUTCOME_SALES`, and `OUTCOME_TRAFFIC` for general CTM Ads. |
| `special_ad_categories` *array[enum]* | `NONE` or<br>[a comma separated list of Meta ad categories](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/campaigns#parameters-2)<br> |
| `status` *array[enum]* | `PAUSED` – the campaign is not ready yet |

- Visit our
[Ad Account Campaign Endpoint Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/campaigns#Creating)
for the complete list of available parameters.

#### Example Request

*Formatted for readability. Replace **bold, italics values**, such as **ad_account_id**, with your values.*

```curl
curl -X POST "https://graph.facebook.com/v25.0/act_ad_account_id/campaigns" \
     -H "Content-Type: application/json" \
     -d '{
           "access_token":"Your_page_access_token",
           "buying_type":"AUCTION",
           "name":"Messenger_ad_campaign_name",
           "objective":"OUTCOME_TRAFFIC",
           "status":"PAUSED",
           "special_ad_categories":["NONE"],
         }'
```

On success your app receives a JSON response with the ID for your campaign.

```json
{
  "id": "campaign_id"
}
```

## Step 2. Create an Ad Set {#adset}

To create an ad set, send a `POST` request to the `act_***ad_account_id***/adsets` endpoint where ***ad_account_id*** is the ID for your Meta ad account. Your request must include:

* `access_token`
* `bid_amount`
* `billing_event` set to `IMPRESSIONS`
* `campaign_id`
* `daily_budget`
* `destination_type` set to `MESSENGER`
* `name`
* `optimization_goal` set to `CONVERSATIONS`, `IMPRESSIONS`, or `LEAD_GENERATION` or `QUALITY_LEAD` for lead ads
* `promoted_object` – set to the ID for your business' Facebook Page.
* `status` set to `PAUSED`
* `targeting`

#### Ad Set Quick Reference

| Parameter | Value |
| --- | --- |
| `access_token` | Your Page access token |
| `bid_amount`*int* | The maximum amount you want to pay for a result based on your optimization_goal |
| `billing_event`*enum* | Must be set to `IMPRESSIONS`. Meta bills you when your ad is shown to people |
| `campaign_id`*int* | The ID for your campaign from [Step 1](#campaign) |
| `daily_budget`*int* | The amount you want to spend per day |
| `destination_type`*string* | Must be `MESSENGER` for Messenger Ads for Leads. **Required for Messenger Ads for Leads** |
| `name` *string* | The name of your ad set |
| `optimization_goal`*enum* | Can be either `CONVERSATIONS` or `CONVERSIONS` for CTM or CTS. Can be either `LEAD_GENERATION` or `QUALITY_LEAD` for Messenger Ads for Leads. |
| `promoted_object`*enum* | Set to the ID for your business' Facebook Page ID. **Required for Lead Ads for Messenger**<br><br>• If you have set up a<br>[CRM data source](https://developers.facebook.com/docs/marketing-api/conversions-api/guides/crm-integration) and choose `QUALITY_LEAD` as an optimization goal, you may add the `pixel_id` to the `promoted_object` for further optimization on quality. Note that you do not need to supply a `pixel_rule` alongside with the `pixel_id`.<br> |
| `status`*enum* | `PAUSED` |
| `targeting` *object* | [An object that defines the audience](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/advanced-targeting) to whom you want to show your ads<br> |

Visit our  
[Ad Account Ad Set Endpoint Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/adsets#Creating)
for the complete list of available parameters.

#### Example Request
*Formatted for readability. Replace **bold, italics values**, such as **ad_account_id**, with your values.*

```curl
curl -X POST "https://graph.facebook.com/v25.0/act_ad_account_id/adsets"
     -H "Content-Type: application/json"
     -d '{
           "access_token":"Your_page_access_token",
           "bid_amount":"Your_bid_amount",
           "billing_event":"IMPRESSIONS",
           "campaign_id":"Your_campaign_id",
           "daily_budget":"Your_daily_budget",
           "destination_type":"MESSENGER",
           "name":"Your_messenger_adset_name",
           "optimization_goal":"IMPRESSIONS",
           "status":"PAUSED",
           "targeting":{
             "geo_locations": { "countries":["US","CA"] },
             "device_platforms": ["mobile", "desktop"],
             "publisher_platforms": ["messenger"]
           }
         }'
```

On success your app receives the following JSON response with the ID for the ad set.

```json
{
  "id": "adset_id"
}
```

## Step 3. Create Ad Creative {#ad-creative}

The ad creative allows you to add assets to your ads.

#### Limitations

* Ads created using `object_story_id` are not supported
* A person must have Messenger installed on their device to see your ad
* There is no support for right side placements

To create an ad creative, send a `POST` request to the `/act_***ad_account_id***/adcreatives` endpoint where ***ad_account_id*** is the ID for your Meta ad account. Your request must include:

* `access_token`
* `name`
* `object_story_spec` – Required
* `privacy_url` – Required for lead ads
* `standard_enhancements.enroll_status` – Required for ad creatives that are eligible for [standard enhancements](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/standard-enhancements#api-support).

#### Ad Creative Quick Reference  
| Parameter | Value |
| --- | --- |
| `access_token` | Your Page access token. **Required** |
| `name` | The name for your ad creative. For example, "Click to Messenger for September", etc. **Required** |
| [`object_story_spec `](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-object-story-spec) | An  object containing information about a message. **Required for Click to Messenger or Click to Subscribe ads**<br>• [`link_data `](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-link-data) – An object defining a message with a template or carousel<br>• [`page_id `](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative) – **Required.** The ID for the Facebook Page sending the message<br>• [`photo_data `](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-photo-data) – An object defining a message with an image<br>• [`text_data `](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-text-data) – An object defining a message with text only<br>• [`video_data `](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-video-data) – An object defining a message with a video<br> |
| `privacy_url` | Set to the URL for your privacy policy. **Required for Messenger Ads for Leads** |

### Ads that Click to Messenger

To create an ad creative for a Click to Messenger ad, send a `POST` request to the `/act_ad_account_id/adcreatives` endpoint where ***ad_account_id*** is the ID for your Meta ad account. Your request must include:

* `access_token`
* `name`
* `object_story_spec` with a `*_data` object that defines the media type

#### Image Ad Quick Reference
| `link_data` Parameters | Values |
| --- | --- |
| `call_to_action` | Object to define the call to action button in the ad<br><br>`type` – The text for the button, for example `LEARN_MORE`<br><br>`value` – The destination for the button click<br><br>`{app_destination`: `MESSENGER}`   – **Required** |
| `image_hash` | The hash for the image |
| `link` | The URL for the image |
| `message` | The Welcome text for the first message you send to the person after they click on the call to action button. You can also send a default template or a series of up to 5 template messages.<br>[Learn more.](https://developers.facebook.com/documentation/business-messaging/messenger-platform/reference/send-api)<br> |

#### Image Ad Example Request

*Formatted for readability. Replace **bold, italics values**, such as **page_access_token**, with your values.*

```curl
curl -X POST "https://graph.facebook.com/v25.0/act_ad_account_id/adcreatives"
     -H "Content-Type: application/json"
     -d '{
           "access_token":"page_access_token",
           "name":"Your_CTM_image_ad_name",
           "object_story_spec":{
             "page_id": "your_page_id",
             "link_data": {
               "page_welcome_message": "Your_welcome_message",
               "image_hash": "Your_image_hash",
               "link": "Your_image_URL",
               "call_to_action": {
                 "type":"LEARN_MORE",
                 "value":{ "app_destination":"MESSENGER" }
               }
             }
           }
         }'
```

#### Click to Messenger Video Ad Quick Reference
| `video_data` Parameters | Values |
| --- | --- |
| `call_to_action` | Object to define the call to action button in the ad<br><br>`type` – The text for the button, for example `LEARN_MORE`<br><br>`value` – The destination for the button click<br><br>`{app_destination`: `MESSENGER}`   – **Required** |
| `link_description` | The text for the video |
| `image_url` | the URL for the video thumbnail |
| `page_welcome_message` | The welcome text for the first message you send to the person after they click on the call to action button. You can also send a default template or a series of up to 5 template messages.<br>[Learn more.](https://developers.facebook.com/documentation/business-messaging/messenger-platform/reference/send-api)<br> |
| `video_id` | Meta ID for the video.  <br>[Learn more about uploading assets to Meta servers.](https://developers.facebook.com/documentation/business-messaging/messenger-platform/reference/attachment-upload-api)<br> |

#### Video Ad Example Request

*Formatted for readability. Replace **bold, italics values**, such as **page_access_token**, with your values.*

```curl
curl -X POST "https://graph.facebook.com/v25.0/act_ad_account_id/adcreatives"
     -H "Content-Type: application/json"
     -d '{
           "access_token": "page_access_token",
           "name": "Your_CTM_image_ad_name",
           "object_story_spec": {
             "page_id": "your_page_id",
             "video_data": {
               "call_to_action": {
                 "type": "LEARN_MORE",
                 "value": { "app_destination": "MESSENGER" }
               },
               "link_description": "Your_link_description",
               "image_url": "Your_thumbnail_URL",
               "page_welcome_message": "Your_welcome_text",
               "video_id": "video_id"
             }
           }
         }'
```

#### Ad that uses a messaging flow configured on a partner app

*Formatted for readability. Replace **bold, italics values**, such as **page_access_token**, with your values.*

```curl
curl -X POST "https://graph.facebook.com/v25.0/act_ad_account_id/adcreatives"
     -H "Content-Type: application/json"
     -d '{
           "access_token": "page_access_token",
           "name": "Your_CTM_image_ad_name",
           "object_story_spec": {
             "page_id": "your_page_id",
             "link_data": {
               "image_hash": "your_image_hash",
               "link": "your_image_URL",
               "call_to_action": {
                 "type": "MESSAGE_PAGE",
                 "value": { "app_destination":"MESSENGER" }
               }
             }
           },
           "asset_feed_spec": {
             "additional_data": {
               "partner_app_welcome_message_flow_id": "FLOW-ID"
             }
           }
         }'
```

For more information about messaging app flows, refer to [Welcome message flows](https://developers.facebook.com/documentation/business-messaging/messenger-platform/ads/ads-welcome-message-flows) in the Messenger Platform documentation.

### Filling out Page Welcome Message

The default message that a customer sees is "Hello! Can I get more info on this?". You can create more tailored user experiences for your ads that click to Messenger by customizing your ads' greeting message, icebreakers, and autofill messages in the `page_welcome_message` field under `object_story_spec`.

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

### Click to Subscribe {#cts}

Click to Subscribe ads (CTS) are Click to Messenger ads where the `object_story_spec.page_welcome_message` is an array of objects with a notification message template. When a person clicks the **Get messages** button in your ad, the person agrees to receive marketing messages from your business.

To create an ad creative for a Click to Subscribe ad, send a `POST` request to the `/act_ad_account_id/adcreatives` endpoint where ***ad_account_id*** is the ID for your Meta ad account. Your request must include:

* `access_token`
* `name`
* `object_story_spec` with
    * a `*_data` object that defines the media type
    * the `page_welcome_message` array that defines the marketing message opt in request. Must include `landing_screen_type` set to `marketing_messages` and the message attachment `payload.template_type` set to `notification_messages`

#### Image Ad Example Request

*Formatted for readability. Replace **bold, italics values**, such as **ad_account_id**, with your values.*

```curl
curl -X POST "https://graph.facebook.com/v25.0/act_ad_account_id/adcreatives"
     -H "Content-Type: application/json"
     -d '{
           "access_token": "page_access_token",
           "name": "Your_CTS_image_ad_name",
           "object_story_spec": {
             "page_id": "your_page_id",
             "link_data": {
               "image_hash": "Your_image_hash",
               "link": "Your_image_URL",
               "call_to_action": {
                 "type": "LEARN_MORE",
                 "value":{ "app_destination": "MESSENGER" }
               }
               "page_welcome_message": "{
                 "landing_screen_type": "marketing_messages",
                 "media_type": "image",
                 "image_format": {
                   "customer_action_type": "buttons",
                   "message": {
                     "text": "Your_welcome_message",
                     "attachment": {
                       "type": "template",
                       "payload":{
                         "template_type":"notification_messages",
                         "elements": [{
                             "title": "Your_CTS_title",
                             "subtitle": "Your_CTS_subtitle",
                             "image_url": "Your_image_URL",
                             "app_id": "Your_Meta_app_ID",
                             "buttons": [{
                               "type": "postback",
                               "payload": "Data_to_include_in_webhook_notification",
                               "title": "Get messages"
                             }]
                         }]
                       }
                     }
                   }
                 }
               }"
             }
           }
         }'
```

### Lead Ads in Conversations {#leads}

**Note:** Beginning with v24.0, the ability to create lead ads that generate leads in Messenger with the API is being deprecated. You will still be able to create Messenger ads for leads using Ads Manager. See [Create lead ads that click to Messenger and Instagram Direct in Meta Ads Manager](https://www.facebook.com/business/help/2398917563501477) for more information.

Messenger Ads for Leads allow you to generate leads in Messenger through an automated chat template. You can ask specific questions to people who are interested in your business directly in your preferred messaging platform, gather customer preferences, and ask custom questions to prioritize the most qualified leads.

**Success:** Before you can create ad creatives for Messenger Ads for Leads you must accept
[the terms and conditions for Messenger Ads for Leads.](https://www.facebook.com/ads/leadgen/tos)

#### Message Template Requirements

* A **welcome message** that greets people after they tap on your ad and let them know what your business has to offer
* **Questions** that gather information about whether the person is a lead. This can include questions about interests, location, and contact information such as email and phone number.
* A **confirmation message** that allows you to thank people for their answers and let them know what happens next. You can find your new lead in Ads Manager, your Page's publishing tool or in your CRM.
* A **Privacy Policy** since you will be collecting customer information.

#### Limitations

* Message templates cannot be edited or deleted once they are created

#### Create a Message Template

To create a message template, send a `POST` request to the `/***page_id***/messenger_lead_forms` endpoint where ***page_id*** is the ID for your business' Facebook Page. Your request must include:

* `access_token`
* `privacy_url`
* `step_list` array that includes `message`, `reply_type`, `step_id`, and `step_type`
* `template_name`
* `reminder_text`

The following message template includes your `template_name`, your `privacy_url`, `step_list` with a welcome message in `step_id: 0`, questions in `step_id: 1` to `4`, a confirmation message in `step_id: 5`, and a disqualification message in `step_id: 6`.

#### Message Template Quick Reference
| `step_list` Parameters | Description |
| --- | --- |
| `allow_to_skip` *bool* | Set to `true` or `false`. Set to `false` when a person must provide an answer or `true` no answer is required. |
| `answer_validation_enabled` *bool* | Set to `true` or `false`. Set to `true` when an answer must be validated. Only supports city, country, email, national ID, phone number, and zip code validation. |
| `answers` *array of strings* | A list of answers for a question. **Required for `reply_type: QUICK_REPLIES`.** |
| `message` *string* | The text for a particular step. For example, a welcome message, question, directive, confirmation or disqualification message. **Required** |
| `next_step_ids` *array of `step_id`s* | The next step, or possible steps, in the list of questions. Can not point to a previous question in the list. Can be dependent on the answer given. For example, if a person answers a question with a disqualifier then the next step will be the disqualifying step but if the answer is a qualifier then the next step will be the next question in the list of questions. |
| `prefill_type` *enum{ `CITY`, `EMAIL`, `PHONE` }* | If an answer if is prefilled with a person's information, such as if a person has already shared their email or phone number with your business. |
| `reminder_text` *string* | Text for the person answering the questions reminding them to complete the form |
| `reply_type` *enum{ `NONE`, `PREFILL`, `QUICK_REPLIES` }* | If `reply_type` is set to 'PREFILL' then the sizes of step_list[x].next_step_ids and step_list[x].answers must match |
| `step_id` *string* | The ID for step to allow you to order the questions and messages.For example, if you have a list of 6 steps, `0` is your welcome message, while `1` thru `3` are your questions, `4` is your confirmation, and `5` is your disqualification message. |
| `step_type` *enum{ `CONFIRMATION`, `DISQUALIFY`, `INTRO`, `QUESTION ` }* | The type of step such as a question or introduction message. An **INTRO** and **CONFIRMATION** step are **required** |

#### Example Leads Message Template

*Formatted for readability. Replace **bold, italics values**, such as **page_access_token**, with your values.*

```curl
curl -X POST "https://graph.facebook.com/v25.0/your_page_ID/messenger_lead_forms"
     -H "Content-Type: application/json"
     -d '{
           "access_token": "Your_page_access_token",
           "privacy_url": "Your_privacy_policy_URL",
           "reminder_text": "Your_reminder_text",
           "template_name": "Your_template_name",
           "step_list": [
             {
               "step_id": "0",
               "message": "Your_welcome_message",
               "step_type": "INTRO",
               "reply_type": "NONE",
               "next_step_ids": "1"
             },
             {
               "step_id": "1",
               "message": "Are_you_interested_in_our_products_or_services?",
               "step_type": "QUESTION",
               "reply_type": "QUICK_REPLIES",
               "answers": ["Yes", "Not now", "Maybe"],
               "next_step_ids": [2,6,2],
               "allow_to_skip": false,
               "answer_validation_enabled": true
             },
             {
               "step_id": "2",
               "message": "What city do you live in?",
               "step_type": "QUESTION",
               "reply_type": "PREFILL",
               "prefill_type": "CITY",
               "next_step_ids": "3",
               "allow_to_skip": true
             },
             {
               "step_id": "3",
               "message": "What is your phone number?",
               "step_type": "QUESTION",
               "reply_type": "PREFILL",
               "prefill_type": "PHONE",
               "next_step_ids": "4",
               "allow_to_skip": false,
               "answer_validation_enabled": true
             },
             {
               "step_id": "4",
               "message": "What is your email address?",
               "step_type": "QUESTION",
               "reply_type": "PREFILL",
               "prefill_type": "EMAIL",
               "next_step_ids": "5",
               "allow_to_skip": false,
               "answer_validation_enabled": true
             },
             {
               "step_id": "5",
               "message": "Your_confirmation_message",
               "step_type": "CONFIRMATION",
               "reply_type": "NONE"
             },
             {
               "step_id": "6",
               "message": "Your_disqualification_message",
               "step_type": "DISQUALIFY",
               "reply_type": "NONE"
             }
           ]
        }'
```

On success your app will receive a JSON object with the ID for the template.

```json
{
  "id": "your_messenger_lead_gen_template_id"
}
```

A `fblead_form` is also created and associated with the message template as part of this process.

#### Get a list of forms

To get a list of the Messenger lead generation form templates, you can send a `GET` request to the `/page_id/messenger_lead_forms` endpoint. You can also get information about a specific template by sending a `GET` request to `/`***`Your_messenger_lead_gen_template_id`*** endpoint.

#### Ad creative examples

To create an ad creative for lead ads, send a `POST` request to the `/act_`***`ad_account_id`***`/adcreatives` endpoint where ***`ad_account_id`*** is the ID for your Meta ad account. Your request must include:

* `access_token`
* `name`
* `object_story_spec` with a `*_data` object that defines the media type, image or video, and contains:
    * the `*_data.page_welcome_message` parameter set to the key-value pair
        * `ctm_lead_gen_template_id: `***`Your_messenger_lead_gen_template_id`***

#### Example ad creative for Messenger Ads for Leads with an Image

*Formatted for readability. Replace **bold, italics values**, such as **ad_account_id**, with your values.*

```curl
curl -X POST "https://graph.facebook.com/v25.0/act_AD_ACCOUNT_ID/adcreatives"
    -H "Content-Type: application/json"
    -d '{
          "access_token": "Your_page_access_token",
          "degrees_of_freedom_spec": {
            "creative_features_spec": {
              "standard_enhancements": { "enroll_status": "OPT_IN" }
            }
          },
          "name": "Your_lead_ad_image_ad_name",
          "object_story_spec": {
            "page_id": "Your_page_id",
            "link_data": {
              "call_to_action": {
                "type": "MESSAGE_PAGE",
                "value": { "app_destination": "MESSENGER" }
              },
              "description": "Sample_description",
              "image_hash": "Your_image_hash",
              "message": "Sample_message_for_Creative",
              "page_welcome_message": "{ "ctm_lead_gen_template_id": "Your_messenger_lead_gen_template_id" }"
            }
          }
       }'
```

#### Example ad creative for Messenger Ads for Leads with a Video

*Formatted for readability. Replace **bold, italics values**, such as **ad_account_id**, with your values.*

```curl
curl -X POST "https://graph.facebook.com/v25.0/act_AD_ACCOUNT_ID/adcreatives"
    -H "Content-Type: application/json"
    -d '{
          "access_token": "Your_page_access_token",
          "degrees_of_freedom_spec": {
            "creative_features_spec": {
              "standard_enhancements": { "enroll_status": "OPT_IN" }
            }
          },
          "name": "Your_lead_ad_video_ad_name",
          "object_story_spec": {
            "page_id": "your_page_id",
            "video_data": {
              "call_to_action": {
                "type": "MESSAGE_PAGE",
                "value":{ "app_destination": "MESSENGER" }
              },
              "image_url": "Your_thumbnail_url",
              "link_description": "Your_link_description",
             "message": "Sample message for Creative",
             "page_welcome_message": "{ "ctm_lead_gen_template_id": "Your_messenger_lead_gen_template_id" }",
              "video_id": "Your_video_id"
            }
          }
       }'
```

### Creating ad creatives using Instagram content

#### Instagram Posts

Refer [Use Posts as Instagram Ads](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/use-posts-as-ads) for more details.

```curl
curl -X POST \
  -F 'name=Sample ad creative from Instagram post' \
  -F 'object_id=<PAGE_ID>' \
  -F 'instagram_user_id=<INSTAGRAM_USER_ID>' \
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

#### Instagram Images

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

### Add Product Extensions to Click to Messenger

#### What is click to messenger with product extensions

Product extensions(the "Show product" feature in Meta Ads Manager) is an Advantage+ creative optimization that showcases products from your catalog below your static single media when it's likely to improve performance. This document shows you how to use product extensions features for Click-to-Messenger ads. If you want to learn how to add product extensions for non-click-to-messenger ads, please refer to this page.

#### Reference

[Ads that Click to messenger](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/messaging-ads/click-to-messenger)

[Product extensions for Advantage+Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/product-extensions)

#### Eligibility Criteria

* You must have a catalog connected to a shop on Facebook
* A catalog should have at least 1 product item
* Campaign with `OUTCOME_ENGAGEMENT, OUTCOME_LEAD,OUTCOME_SALES` or `LINK_CLICK` objective
* Single image or video ad format or Facebook existing post content

#### Create with a single image
*Formatted for readability. Replace **bold, italics values**, such as **ad_account_id**, with your values.*

```curl
curl -X POST "https://graph.facebook.com/v25.0/act_ad_account_id/ads"
     -H "Content-Type: application/json"
     -d '{
           "access_token": "Your_page_access_token",
           "creative_sourcing_spec": {
              "associated_product_set_id": "Your_associated_product_set_id"
            },
            "degrees_of_freedom_spec": {
              "creative_features_spec": {
                "product_extensions": {
                   "enroll_status": "OPT_IN"
                }
              }
            },
            "object_story_spec": {
              "page_id": Your_facebook_page_id",
              "link_data": {
                "call_to_action": {
                  "type": "MESSAGE_PAGE",
                  "value": {
                    "app_destination": "MESSENGER"
                  }
                },
                "image_hash":"Your_image_hash", (or "picture": "Your_picture_url")"
                "link": "https://fb.com/messenger_doc/",
                "name": "Chat in Messenger"
              },
              "product_data": [
                {
                  "product_id": Your_product_id_1",              "product_source": "MANUAL",
"product_decision": "ACCEPT"
            },
            {
              "product_id":Your_product_id_2",              "product_source": "MANUAL",
"product_decision": "ACCEPT"
            }
          ]
        }
```

#### Create with a single video
*Formatted for readability. Replace **bold, italics values**, such as **ad_account_id**, with your values.*

```curl
curl -X POST "https://graph.facebook.com/v25.0/act_ad_account_id/ads"
     -H "Content-Type: application/json"
     -d '{
           "access_token": "Your_page_access_token",
           "creative_sourcing_spec": {
              "associated_product_set_id": "Your_associated_product_set_id"
            },
            "degrees_of_freedom_spec": {
              "creative_features_spec": {
                "product_extensions": {
                   "enroll_status": "OPT_IN"
                }
              }
            },
            "object_story_spec": {
              "page_id": "Your_facebook_page_id",
              "video_data": {
                "video_id":"Your_video_id"",
                "video_thumbnail_id": "0",
                "call_to_action": {
                  "type": "MESSAGE_PAGE",
                  "value": {
                    "app_destination": "MESSENGER",
                    "link": "https://fb.com/messenger_doc/"
                  }
                },
                "image_url": "Your_image_url",
                "title": "Chat in Messenger",
                "video_thumbnail_source": "generated_default"
              },

              "product_data": [
                {
                  "product_id": Your_product_id_1",              "product_source": "MANUAL",
"product_decision": "ACCEPT"
            },
            {
              "product_id":Your_product_id_2",              "product_source": "MANUAL",
"product_decision": "ACCEPT"
            }
          ]
        }
```

#### Create with a facebook existing post with photo/video media type
*Formatted for readability. Replace **bold, italics values**, such as **ad_account_id**, with your values.*

```curl
curl -X POST "https://graph.facebook.com/v25.0/act_ad_account_id/ads"
     -H "Content-Type: application/json"
     -d '{
           "access_token": "Your_page_access_token",
           "object_story_id": "Your_object_story_id(pageID_postID)",
           "creative_sourcing_spec": {
              "associated_product_set_id": "Your_associated_product_set_id"
            },
            "degrees_of_freedom_spec": {
              "creative_features_spec": {
                "product_extensions": {
                  "enroll_status": "OPT_IN"
                },
                "multi_photo_to_video": {
                  "enroll_status": "OPT_IN"
                }
              }
            },
            "product_data": [
              {
                "product_id": Your_product_id_1",            "product_source": "MANUAL",
"product_decision": "ACCEPT"
          },
          {
            "product_id":Your_product_id_2",            "product_source": "MANUAL",
"product_decision": "ACCEPT"
          }
        ]
      }
```

#### Create with a facebook existing post with album media type
***For multi-photo post, it will add product extensions after converting the multi-photo to video.**
Formatted for readability. Replace **bold, italics values**, such as **ad_account_id**, with your values.*

```curl
curl -X POST "https://graph.facebook.com/v25.0/act_ad_account_id/ads"
     -H "Content-Type: application/json"
     -d '{
           "access_token": "Your_page_access_token",
           "object_story_id": "Your_object_story_id(pageID_postID)",
           "creative_sourcing_spec": {
              "associated_product_set_id": "Your_associated_product_set_id"
            },
            "degrees_of_freedom_spec": {
              "creative_features_spec": {
                "product_extensions": {
                   "enroll_status": "OPT_IN"
                }
              }
            },
            "product_data": [
              {
                "product_id": Your_product_id_1",            "product_source": "MANUAL"
"product_decision": "ACCEPT"
          },
          {
            "product_id":Your_product_id_2",            "product_source": "MANUAL"
"product_decision": "ACCEPT"
          }
        ]
      }
```

## Step 4. Create the Ad  {#ad}

To create the ad you need to associate the ad creative and the ad set. To create the ad, send a `POST` request to the `/act_***ad_account_id/ads***` endpoint where ***ad_account_id*** is the ID for your Meta ad account.  Your request must include:

* `access_token`
* `adset_id` (from [Step 2](#adset))
* `creative_id` (from [Step 3](#ad-creative))
* `name`
* `status`

#### Ad Account Ads Quick Reference
| Parameter | Value |
| --- | --- |
| `access_token` | Your Page access token |
| `adset_id` | The AD-SET-ID from Step 2 |
| `creative_id` | `{"creative_id": "AD-CREATIVE-ID"}` where AD-CREATIVE-ID is the ID from Step 3 |
| `name` | The name for this ad |
| `status` | Set to `PAUSED`. Set to `ACTIVE` when you are ready to launch your ad campaign |

#### Ad with Creative Example Request
*Formatted for readability. Replace **bold, italics values**, such as **ad_account_id**, with your values.*

```curl
curl -X POST "https://graph.facebook.com/v25.0/act_ad_account_id/ads"
     -H "Content-Type: application/json"
     -d '{
           "access_token": "Your_page_access_token",
           "adset_id": "Your_ad_set_id",
           "creative": { "creative_id": "Your_ad_creative_id" },
           "status": "PAUSED"
         }'
```

On success your app receives the following JSON response with the ID for the ad.

```json
{
  "id": "ad_id"
}
```

### Call to action

You can also set a call to action when creating your ad.

```
"call_to_action": {
  "value": {"app_destination":"MESSENGER"},
  "type": "MESSAGE_PAGE"
}
```

## Step 5. Publish your Ad {#publish-ad}

Verify that your ad exists in the
[ads manager](https://adsmanager.facebook.com). Click the **Review and publish** button in the upper right corner. Select your campaign, the ad set for the campaign, and the ad.

You can publish your ad from the ads manager or using the API. To publish using the API, repeat [Step 4](#ad) with the `status` parameter set to `ACTIVE`.

Your ad will be reviewed by Meta and the status will be `PENDING_REVIEW`. Once approved, the status will be `ACTIVE` and your ad will be delivered.

## Advanced Click to Messenger Elements

You can create messages that include more than one message element, like a call prompt or multiple templates. You will add these elements by setting an array of objects for the `*_data.page_welcome_message` value instead of a string value.

#### Page Welcome Message Array Quick Reference
| `page_welcome_message` Parameters | Values |
| --- | --- |
| `landing_screen_type ` *enum* | Set to `call_prompt` – **Required** |
| `media_type` *enum* | Set to `text` for a call prompt ad |
| `message` *object* | Use to include one or more message templates in your Click to Messenger ad |
| `text_format.message` | Object to define the call prompt button actions<br><br>• `text` – Your welcome message text<br>• `call_prompt_data ` – The call prompt message text key-value pair – **Required**<br><br>Set `call_prompt_message`  to your text to prompt a person to call your business.`}` For example, *Call to make an appointment.*  – **Required**<br> |

### Add a Call Prompt

You can add a call prompt to your Click to Messenger ad by setting the value of `*_data.page_welcome_message` to an array of objects that define your call prompt elements. Set the `landing_screen_type` parameter to `call_prompt`, `media_type` to `text`, and the `text_format.message` object  with `text` to your welcome message text, and `call_prompt_data.call_prompt_message` set to a prompt to call your business.

*Formatted for readability. Replace **bold, italics values**, such as **page_access_token**, with your values.*

```
...
      "page_welcome_message": "[
        {
          "landing_screen_type": "call_prompt",
          "media_type": "text",
          "text_format": {
            "message": {
              "text": "Your_welcome_message",
              "call_prompt_data": {
                "call_prompt_message": "Your_call_prompt_message"
              }
            }
          },
        }
      ]"
...
```

### Add One or More Templates

To create an ad with multiple templates set `*_data.page_welcome_message` parameter to an array with a
[message template](https://developers.facebook.com/documentation/business-messaging/messenger-platform/send-messages/templates)
The following example adds a template for a quick reply.

*Formatted for readability. Replace **bold, italics values**, such as **page_access_token**, with your values.*

```curl
...
      "page_welcome_message": "[{
        'message': {
          'text':'  Your_question_or_directive',
        'quick_replies':[
          {
            'content_type':'text',
            'title':'  Option_1',
            'payload':'  Option_1_information_for_webhook'
          },
          {
            'content_type':'text',
            'title':'  Option_2',
            'payload':'  Option_2_information_for_webhook'
          },
          {
            'content_type':'text',
            'title':'  Option_3',
            'payload':'  Option_3_information_for_webhook  '
            }
          ]
        }
      }]",
...
```

## Next steps

If you have not already, [set up webhooks](https://developers.facebook.com/documentation/business-messaging/messenger-platform/webhooks) to get notifications for when a person clicks on your ad.

## Learn More

Learn more about the Marketing API and additional options for Click to Messenger.

#### Marketing API

- [Ad Campaign Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group)

- [Ad Creative Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative)

- [Ad Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup)

- [Ad Set Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign)

- [Audience Targeting Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/advanced-targeting)

- [Create a Form for a Leads Ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lead-ads/create?)

- [Get Started with the Marketing API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started)

- [Get Leads Generated by Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lead-ads/retrieving)

- [Optimization Goals and Bidding Events Overview](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview/billing-events#opt_bids)

#### Messenger Platform

- [Message Templates Reference](https://developers.facebook.com/documentation/business-messaging/messenger-platform/reference/templates)

- [Message Lead Forms Reference](https://developers.facebook.com/docs/graph-api/reference/page/messenger_lead_forms)

