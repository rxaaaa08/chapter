<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lead-ads/create | Saved: 2026-09-19 -->

# Lead Forms for Ads



This document describes how to use the Marketing API to create ads for lead generation using the Graph API.

To create and publish a lead ad you will follow these steps:

1. Create an ad campaign
2. Create an ad set that links your ads to your ad campaign
3. Create a lead form
4. Create an ad creative with the lead form
5. Associate your campaign and creative to create an ad
6. Publish your ad

## Before You Start

This guide assumes you have read the [Messenger Platform Overview](https://developers.facebook.com/documentation/business-messaging/messenger-platform/overview) and implemented the needed components for sending and receiving messages and notifications.

You will need the following:

* The [`ads_management` permission](https://developers.facebook.com/docs/permissions/reference/ads_management)
* The [`pages_manage_ads` permission](https://developers.facebook.com/docs/permissions/reference/pages_manage_ads)
* The [`pages_read_engagement` permission](https://developers.facebook.com/docs/permissions/reference/pages_read_engagement)
* The [`pages_show_list` permission](https://developers.facebook.com/docs/permissions/reference/pages_show_list)
* A Page access token from a person who can perform the [`ADVERTISE`](https://developers.facebook.com/docs/pages/overview#tasks) task on the Page

## Step 1. Create a campaign {#campaign}

To create an ad campaign for your lead generation ads, send a `POST` request to the `/`***`act_AD_ACCOUNT_ID`***`/campaigns` endpoint with the following parameters:

- `access_token` set to your Page access token

- `buying_type` set to `AUCTION`

- `name` set to the name for your campaign

- `objective` set to `OUTCOME_LEADS`

- `special_ad_categories`
set to `NONE` or your
[special ad category](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/campaigns#parameters-2)

- `status` set to `PAUSED`

#### Example Request

*Formatted for readability. Replace **bold, italics values**, such as **AD_ACCOUNT_ID**, with your values.*

```curl
curl -X POST "https://graph.facebook.com/v25.0/act_AD_ACCOUNT_ID/campaigns" \
     -H "Content-Type: application/json" \
     -d '{
           "access_token":"YOUR_PAGE_ACCESS_TOKEN",
           "buying_type":"AUCTION",
           "name":"YOUR_LEADADS_CAMPAIGN_NAME",
           "objective":"OUTCOME_LEADS",
           "special_ad_categories":["NONE"],
           "status":"PAUSED"
         }'
```

On success, your app will receive a JSON object with the ID for your campaign. This ID will be used when creating an ad set in the next step.

```json
{
  "id": "YOUR_CAMPAIGN_ID"
}
```

Visit the
[Ad Campaigns reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group)
to learn more.

## Step 2. Create an ad set {#ad-set}

To create an ad set, send a `POST` request to the `act_***ad_account_id***/adsets` endpoint where ***ad_account_id*** is the ID for your Meta ad account. Your request must include:

* `access_token` set to your Page access token
* `bid_amount` set to the maximum amount you want to pay
* `billing_event` set to `IMPRESSIONS`
* `campaign_id` set to the ID for your ad campaign from Step 1
* `daily_budget` set to the amount you want to spend per day
* `name` set to the name for your ad set
* `optimization_goal` set to `LEAD_GENERATION`, or `QUALITY_LEAD`
* `destination_type` set to `ON_AD`
* `promoted_object` – set to the ID for your business' Facebook Page
* `status` set to `PAUSED`

**Note:** If you have set up a CRM data source and choose `QUALITY_LEAD` as an optimization goal, you may add the `pixel_id` to the `promoted_object` for further optimization on quality. Note that you do not need to supply a `pixel_rule` alongside the `pixel_id`.

#### Example Request
*Formatted for readability. Replace **bold, italics values**, such as **AD_ACCOUNT_ID**, with your values.*

```curl
curl -X POST "https://graph.facebook.com/v25.0/act_AD_ACCOUNT_ID/adsets"
     -H "Content-Type: application/json"
     -d '{
           "access_token":"YOUR_PAGE_ACCESS_TOKEN",
           "bid_amount":"YOUR_BID_AMOUNT",
           "billing_event":"IMPRESSIONS",
           "campaign_id":"YOUR_CAMPAIGN_ID",
           "daily_budget":"YOUR_DAILY_BUDGET",
           "name:"YOUR_LEADADS_ADSET_NAME",
           "optimization_goal":"LEAD_GENERATION",
           "destination_type":"ON_AD",
           "promoted_object":"YOUR_PAGE_ID",
           "status":"PAUSED"
         }'
```

On success your app receives the following JSON response with the ID for the ad set.

```json
{
  "id": "YOUR_ADSET_ID"
}
```

Visit the
[Ad Sets reference](https://developers.facebook.com/docs/marketing-api/reference/ad-sets)
to learn more.

## Step 3. Create a Lead Form {#lead-form}

To create a form send a `POST` request to the `/`***`PAGE_ID`***`/leadgen_forms` endpoint with the following parameters:

* `access_token` set to your Page access token
* `name` set to the name for your form
* `questions` set to an array of objects defining the type of questions and the order they will appear in the form using the `key` parameter
    * a custom question using the `label` parameter
    * a custom question using the `options` parameter with a dropdown menu of answers

#### Example Request

*Formatted for readability. Replace ***bold, italics values*** with your values.*

```
curl -X POST "https://graph.facebook.com/v25.0/PAGE_ID/leadgen_forms" \
     -H "Content-Type: application/json" \
     -d '{
           "access_token": "YOUR_PAGE_ACCESS_TOKEN",
           "name": "YOUR_LEADADS_FORM_NAME",
           "questions": "[
               {"type":"FULL_NAME", "key": "question1"},
               {"type":"EMAIL", "key": "question2"},
               {"type":"PHONE", "key": "question3"},
               {"type":"CUSTOM", "key": "question4" "label": "Do you like rainbows?"}
               {"type":"CUSTOM", "key": "question5" "label": "What is your favorite color?",
                   "options": [
                       {value: "Red", key: "key1"},
                       {value: "Green", key: "key2"},
                       {value: "Blue", key: "key2"},
                   ]}
           ]"
         }'
```

### Forms for Messenger Conversations {#msgr-form-ads-reqs}

Forms that you want to use in an
[ad in a Messenger conversation](https://developers.facebook.com/documentation/business-messaging/messenger-platform/send-messages/templates/instant-form-template)
must contain the following:

- The `questions.type` parameter can only  be set to one of the following values:

* `CUSTOM`
* `EMAIL`

* `FIRST_NAME`
* `FULL_NAME`

* `LAST_NAME`
* `PHONE`

If the form has a `questions.type` that is set to any other value than those listed, the form will be ineligible.

- The `block_display_for_non_targeted_viewer` parameter must be set to `false`. This marks the form as **Open Sharing**.

#### Eligible Messenger Lead Form Example Request

*Formatted for readability. Replace ***bold, italics values*** with your values.*

```
curl -X POST "https://graph.facebook.com/v25.0/PAGE_ID/leadgen_forms" \
     -H "Content-Type: application/json" \
     -d '{
           "access_token": "YOUR_PAGE_ACCESS_TOKEN"
           "block_display_for_non_targeted_viewer": "false"
           "name": "LeadAds Form for Messenger Conversation Name"
           "questions": "[
               {"type":"FULL_NAME", "key": "question1"},
               {"type":"EMAIL", "key": "question2"},
               {"type":"PHONE", "key": "question3"},
               {"type":"CUSTOM", "key": "question4" "label": "Do you like rainbows?"}
               {"type":"CUSTOM", "key": "question5" "label": "What is your favorite color?",
                   "options": [
                       {value: "Red", key: "key1"},
                       {value: "Green", key: "key2"},
                       {value: "Blue", key: "key2"},
                   ]}
           ]"
         }'
```

### Additional Question Types {#additional-questions}

In addition to the typical question types shown in the [Create a Lead Form section]{#create-a-lead-form}, you can add more specialized question types for the following use cases:

* [Appointment Scheduling](#appointment-scheduling) - An appointment scheduling question renders a date and time selector with a limited hour selection and a confirmation message below the question.
* [National or Government ID](#national-id) – A national ID question renders a question based on a person's country and validates the format of the ID entered.
* [Store Locator](#store-locator) - A store locator question renders a store locator selector based on a person's zip code or postal code input.

#### Appointment Scheduling {#appointment-scheduling}

An appointment scheduling question renders a date and time selector with a limited hour selection and a confirmation message below the question.

To add an appointment scheduling question, add a question object with the `type` parameter set to `DATE_TIME`. Optionally, you can also add a confirmation message in the `inline_context` parameter that will be rendered directly below the question field for further context, if needed.

```curl
...
           "questions": "[
               ...
               {"type": "DATE_TIME",
                "label": "Appointment time",
                "inline_context": "We will verify and call you to confirm your appointment."
               },
...
```

#### National ID {#national-id}

A national ID question renders a question based on a person's country and validates the format of the ID entered. This question can be rendered for the following countries:

* Argentina – {"type": "`ID_AR_DNI`"}
* Brazil – `ID_CPF`
* Chile – `ID_CL_RUT`
* Colombia – `ID_CO_CC`
* Ecuador – `ID_EC_CI`
* Peru – `ID_PE_DNI`

To add a national ID question, add a question object with the `type` parameter set to the person's country type.

#### Limitations

* You can only ask for a single National ID in any given form and are only able to target people in their corresponding country. For example, if you ask for `DNI` from Peru, your target audience must be limited to Peru. Only ads that match these criteria are approved.
* Validation checks for a valid format; it does not verify that the ID actually belongs to a real person.

```curl
...
           "questions": "[
               ...
               {"type": "ID_AR_DNI"
               },
...
```

#### Store Locator {#store-locator}

A store locator question renders a store locator selector based on a person's zip code or postal code input.

You will need to set up a Store Pages Structure to use this question. Learn how in  
[Set Up a Store Pages Structure on Facebook – Meta Business Help Center](https://www.facebook.com/business/help/799893063819520)

To add a store locator question, add a question object with the `type` parameter set to `STORE_LOOKUP` and the `context_provider_type` parameter to `LOCATION_MANAGER`.

```curl
...
           "questions": "[
               ...
               {"type": "STORE_LOOKUP",
                "label": "Which store do you want to visit?",
                "context_provider_type": "LOCATION_MANAGER"
               },
...
```

### Advanced Form Settings {#adv-form-settings}

Get higher quality leads by adding one or more of the following form settings:

* [Form Performance Tracking](#perf-tracking) to track the source of your leads
* [Higher Intent Forms](#intent-setting) to add a review and confirm step in the form flow
* [Organic Leads Filtering](#filter-organic-leads) to filter out organic leads
* [Gated Content](#gated-content) to reward consumers with a file download after submitting their lead

#### Add Performance Tracking {#perf-tracking}

To help you track the source of your leads, add the `tracking_parameters` field, set to a list of key-value pairs of parameters you want to track, to your form.  These  parameters do not appear in your ad but allow Meta to provide you with metadata about leads generated from a form.

#### Example Request

*Formatted for readability. Replace ***bold, italics values*** with your values.*

```curl
...
           "name": "YOUR_LEADADS_FORM_NAME",
           "tracking_parameters": {"your_tracking_parameter_name":"your_tracking_parameter_value"},
           "questions": "[
...
```

#### Add Higher Intent Setting {#intent-setting}

By default, lead ads are optimized for the volume of leads, however, you can create forms that result in higher intent leads. These types of leads can be for people who may be interested in a specific product or service, such as booking a test drive at a dealership. This form setting adds a step to the form submission flow where a person reviews and confirms their answers before the person submits the form.

To add this confirmation flow to your form, add the `is_optimized_for_quality` parameter set to `true` when creating the form.

#### Example Request

*Formatted for readability. Replace ***bold, italics values*** with your values.*

```curl
...
           "name": "YOUR_LEADADS_FORM_NAME",
           "is_optimized_for_quality": "true",
           "questions": "[
...
```

#### Filter Out Organic Leads {#filter-organic-leads}

To filter out organic leads, add the `block_display_for_non_targeted_viewer` parameter to `true` when you create the form.

#### Example Request

*Formatted for readability. Replace ***bold, italics values*** with your values.*

```curl
...
           "name": "YOUR_LEADADS_FORM_NAME",
           "block_display_for_non_targeted_viewer": "true",
           "questions": "[
...
```

#### Example Response

On success your app will receive a JSON response containing the ID for your form to be used when creating your ad.

```json
{
  "id": "leadgen_form_id",
}
```

#### Gated Content {#gated-content}

Reward consumers with a file download after submitting their lead. This file download will appear as a call-to-action button on your thank you page.

To add this feature, you must add the `upload_gated_file` parameter to your form with the file that you'd like to upload.

In addition, you must create a thank you page using the `thank_you_page` parameter. Within the `thank_you_page` parameter, set `button_type` to `VIEW_ON_FACEBOOK`.

#### Example Request
*Formatted for readability. Replace ***bold, italics values*** with your values.*

```curl
...
  "name": "YOUR_LEADADS_FORM_NAME",
      "upload_gated_file": "YOUR_FILE",
      "thank_you_page": {
         "body": "Feel free to download our brochure here",
         "title": "Thanks, you're all set.",
         "button_type": "VIEW_ON_FACEBOOK",
         "button_text": "Download"
      }
    ...
```

#### Example Response

On success, your app will receive a JSON response containing the ID for your form to be used when creating your ad.

```json
{
  "id": "leadgen_form_id",
}
```

## Step 4. Create an Ad Creative {#ad-creative}

To create an ad creative with an image and your form, send a `POST` request to the `/act_AD_ACCOUNT_ID/adcreatives` endpoint with the following parameters:

* `access_token` set to your Page access token
* `object_story_spec` that includes a `link_data` object with the following parameters:
    * `call_to_action` set to an object containing `type` and`value` set to your lead form ID
    * `description` set to the description for your creative
    * `image_hash` set to the hash for an image for your ad creative
    * `message` set to the text for your ad creative
* `page_id` set to your Facebook Page ID

**Note:** While creating the `link_data`, the value associated with the `link` field can only be `https://fb.me/`.

The `link_data.call_to_action` parameter must be set to one of the following values:

* `APPLY_NOW`
* `DOWNLOAD`
* `GET_QUOTE`
* `LEARN_MORE`
* `SIGN_UP`
* `SUBSCRIBE`

#### Example Request

*Formatted for readability. Replace **bold, italics values**, such as **AD_ACCOUNT_ID**, with your values.*

```curl
curl -X POST "https://graph.facebook.com/LATEST-API-VERSION/act_AD_ACCOUNT_ID/adcreatives" \
     -H "Content-Type: application/json" \
     -d '{
           "access_token":"YOUR_PAGE_ACCESS_TOKEN",
           "object_story_spec":{
             "link_data": {
               "call_to_action": {
                 "type":"SIGN_UP",
                 "value":{
                   "lead_gen_form_id":"YOUR_FORM_ID"
                 }
               },
               "description": "YOUR_AD_CREATIVE_DESCRIPTION",
               "image_hash": "YOUR_IMAGE_HASH",
               "link": "http:\/\/fb.me\/",
               "message": "YOUR_AD_CREATIVE_MESSAGE"
             },
           "page_id": "YOUR_PAGE_ID"
         }'
```

### With a Carousel {#carousel}

You can create a [carousel](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/videoads) lead ad using the same `object_story_spec`, but with an additional `lead_gen_form_id` field defined in the `child_attachments` parameter.

**Warning:** You can only specify the same `<FORM_ID>` for all child attachments.

```curl
curl \
  -F 'object_story_spec={
    "page_id": "<PAGE_ID>",
    "link_data": {
      "message": "My description",
      "link": "http:\/\/www.google.com",
      "caption": "WWW.EXAMPLE.COM",
      "child_attachments": [
        {
          "link": "http:\/\/www.google.com",
          "image_hash": "<IMAGE_HASH>",
          "call_to_action": {"type":"SIGN_UP","value":{"lead_gen_form_id":"<FORM_ID>"}}
        },
        {
          "link": "http:\/\/www.google.com",
          "image_hash": "<IMAGE_HASH>",
          "call_to_action": {"type":"SIGN_UP","value":{"lead_gen_form_id":"<FORM_ID>"}}
        },
        {
          "link": "http:\/\/www.google.com",
          "image_hash": "<IMAGE_HASH>",
          "call_to_action": {"type":"SIGN_UP","value":{"lead_gen_form_id":"<FORM_ID>"}}
        },
        {
          "link": "http:\/\/www.google.com",
          "image_hash": "<IMAGE_HASH>",
          "call_to_action": {"type":"SIGN_UP","value":{"lead_gen_form_id":"<FORM_ID>"}}
        }
      ],
      "multi_share_optimized": true,
      "call_to_action": {"type":"SIGN_UP","value":{"lead_gen_form_id":"<FORM_ID>"}}
    }
  }' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/LATEST-API-VERSION/act_<AD_ACCOUNT_ID>/adcreatives
```

### With a Video {#video}

You can also use a video in the lead ad creative instead of a photo. First, upload the video to your [ad video library](https://developers.facebook.com/docs/marketing-api/advideo), then use it in the `object_story_spec` parameter:

```
curl -X POST \
  -F 'object_story_spec={
       "page_id": "<PAGE_ID>",
       "video_data": {
         "link_description": "try it out",
         "image_url": "<IMAGE_URL>",
         "video_id": "<VIDEO_ID>",
         "call_to_action": {
           "type": "SIGN_UP",
           "value": {
             "link": "http://fb.me/",
             "lead_gen_form_id": "<FORM_ID>"
           }
         }
       }
     }' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

### Ad Creative Example Response {#example-response}

On success your app receives the following JSON response with the ID for the ad creative.

```
{
  "id": "YOUR_AD_CREATIVE_ID"
}
```

## Step 5. Create the Ad {#ad}

To create the ad you need to associate the ad creative and the ad set. To create the ad, send a `POST` request to the `/act_AD_ACCOUNT_ID/ads` endpoint. Your request must include:

* `access_token`  set to your Page access token
* `adset_id` (from Step 2)
* `creative_id` (from Step 4)
* name
* status

#### Ad with Creative Example Request

*Formatted for readability. Replace **bold, italics values**, such as **AD_ACCOUNT_ID**, with your values.*

```curl
curl -X POST "https://graph.facebook.com/v25.0/act_AD_ACCOUNT_ID/ads"
     -H "Content-Type: application/json"
     -d '{
           "access_token"="YOUR_PAGE_ACCESS_TOKEN",
           "name":"YOUR_LEADADS_AD_NAME",
           "adset_id"="YOUR_AD_SET_ID",
           "creative"={ "creative_id": "YOUR_AD_CREATIVE_ID" },
           "status"="PAUSED"
         }'
```

On success your app receives the following JSON response with the ID for the ad.

```json
{
  "id": "YOUR_AD_ID"
}
```

## Step 6. Publish your Ad {#publish-ad}

Verify that your ad exists in the
[Ads Manager](https://adsmanager.facebook.com). Click the **Review and publish** button in the upper right corner. Select your campaign, the ad set for the campaign, and the ad.

You can publish your ad from the ads manager or using the API. To publish using the API, repeat [Step 4](#ad-creative) with the `status` parameter set to `ACTIVE`.

Your ad will be reviewed by Meta and the status will be `PENDING_REVIEW`. Once approved, the status will be `ACTIVE` and your ad will be delivered.

## Form Management

Get a list of your forms, a specific forms questions, and archive old forms.

### Get a List of Forms {#readform}

To get a list of your lead gen forms, send a `GET` request to the `/`***`page_id`***`/leadgen_forms` endpoint with the following parameters:

* `access_token` set to your Page access token
* `fields` (optional) set to a comma separated list of fields to get specific information such as name and form ID

#### Example Request

*Formatted for readability. Replace ***bold, italics values*** with your values.*

```curl
curl -X GET "https://graph.facebook.com/v25.0/PAGE_ID/leadgen_forms
    ?fields=name,id
    &access_token": "YOUR_PAGE_ACCESS_TOKEN"
```

On success your app will receive a JSON response containing a list of your forms. You can use a form ID to get the questions for that form or to archive the form.

### Get a List of Eligible Forms for Messenger

Only forms containing [specific requirements](#msgr-form-ads-reqs)
are eligible to be
[sent in a Messenger conversation.](https://developers.facebook.com/documentation/business-messaging/messenger-platform/send-messages/templates/instant-form-template)

To get a list of eligible lead forms send a `GET` request to the `/`***`page_id`***`/leadgen_forms` endpoint with the following parameters:

* `access_token` set to your Page access token
* `fields` set to `is_eligible_for_in_thread_forms`

#### Example Request

*Formatted for readability. Replace ***bold, italics values*** with your values.*

```curl
curl -X GET "https://graph.facebook.com/v25.0/PAGE_ID/leadgen_forms
    ?fields=is_eligible_for_in_thread_forms
    &access_token": "YOUR_PAGE_ACCESS_TOKEN"
```

On success your app will receive a JSON response containing a list of IDs for eligible forms.

```json
{
  "data": [
    {
      "id": "eligible_form_1_id"
    },
    {
      "id": "eligible_form_2_id"
    }
  ],
...
}
```

### Get a List of Questions {#questions}

To get a list of questions for a specific lead gen form, send a `GET` request to the `/`***`page_id`***`/`***`leadgen_form_id`*** endpoint with the following parameters:

* `access_token` set to your Page access token
* `fields` set to `questions`

#### Example Request

*Formatted for readability. Replace ***bold, italics values*** with your values.*

```curl
curl -X GET "https://graph.facebook.com/v25.0/page_id/leadgen_form_id?fields=questions
&access_token=page_access_token"
```

On success your app will receive a JSON response containing a list of questions.

### Archive a Form {#archive-form}

You can only archive a lead form since deleting is not supported. Once a form is archived:

* The form won't appear (by default) in the Forms Library
* You can't use an archived form in an ad, attempting to do so can generate an error via the API.
* Archived forms won't be available during ad creation for CF or PE.

To archive a specific lead gen form, send a `POST` request to the `/`***`page_id`***`/`***`leadgen_form_id`*** endpoint with the following parameters:

* `access_token` set to your Page access token
* `status` set to `ARCHIVED`

#### Example Request

*Formatted for readability. Replace ***bold, italics values*** with your values.*

```curl
curl -X GET "https://graph.facebook.com/v25.0/page_id/leadgen_form_id?status=ARCHIVED
&access_token=page_access_token"
```

On success your app will receive a JSON response containing an object with `success` set to `true`.  

An archived form can be reactivated by sending a request with `status` set to `ACTIVE`.

## See Also

Visit our other guides to learn more about the components in this document.

#### Marketing API Developer Documentation

* [Lead Generation UI Dialog SDK components](https://developers.facebook.com/docs/javascript/reference/FB.ui)
* [Page Reference, Leadgen Forms](https://developers.facebook.com/docs/graph-api/reference/page/leadgen_forms)
* [Tracking and Conversion Specs, Custom Tracking Specs](https://developers.facebook.com/documentation/ads-commerce/marketing-api/tracking-specs#custom)

#### Meta Business Help Center

* [Organic Leads Help Center article](https://www.facebook.com/business/help/1131888990173231)
* [Share Button Help Center article](https://www.facebook.com/business/help/1581395052150760)
* [Lead Form Types Help Center article](https://www.facebook.com/business/help/252352181957512)
* [Lead Forms in Canvas Ads Help Center article](https://www.facebook.com/business/help/237121917036106)
