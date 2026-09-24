<!-- Source: https://developers.facebook.com/documentation/ads-commerce/instagram/marketing-api/guides/reminder-ads | Saved: 2026-09-19 -->

# Instagram Reminder Ads



This document shows you how to use the Marketing API to create Instagram reminder ads & ads with reminders.

## Before You Start

Before you start, you need the following:

* The `ads_management` permission
* An Instagram upcoming event created using the [Upcoming Event Management API](https://developers.facebook.com/docs/instagram-api/guides/upcoming-events) or Ads Manager

### Limitations

* If a reminder ad's ad set has an end date, it must be after the start date of the reminder ad's Instagram upcoming event.
* A reminder ad will stop delivering once its event is in the past.
* Not all ad campaign objectives or ad set optimization goals support reminders. For example supported ad campaign objectives and ad set optimization goals include:
    * `objective: OUTCOME_ENGAGEMENT` & `optimization_goal=REMINDERS_SET`
    * `objective: OUTCOME_ENGAGEMENT` & `optimization_goal=THRUPLAY`
    * `objective: OUTCOME_AWARENESS` & `optimization_goal=THRUPLAY`
    * `objective: OUTCOME_AWARENESS` & `optimization_goal=REACH`
    * `objective: OUTCOME_SALES` & `optimization_goal=OFFSITE_CONVERSIONS`
* Ad creatives using the reminder functionality cannot always be associated across different ad campaign objectives. To remedy this, create separate creatives for different ad campaign objectives.

## Step 1: Create an Ad Campaign

Start by creating your ad campaign. To do this, send a `POST` request to the `/act_<AD_ACCOUNT_ID>/campaigns` endpoint where `<AD_ACCOUNT_ID>` is the ID for your Meta ad account. Your request must include:

* `name` (Required)
* `objective` (Required) — **Note:** Not all ad campaign objectives support reminder functionality
* `special_ad_categories` (Required)
* `status` (Optional)

### Request

*Formatted for readability. Make sure to replace placeholders with your own values.*

```curl
curl -X POST "https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/campaigns" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"My First Reminder Ads Campaign",
    "objective":""OUTCOME_ENGAGEMENT"",
    "special_ad_categories":""[]"",
  }'
```

### Response

On success, your app receives the following JSON response with the created ad campaign's ID:

```json
{

  "id": "<AD_CAMPAIGN_ID>"
}
```

## Step 2: Create an Ad Set

Next, create your ad set. To do this, send a `POST` request to the `/act_<AD_ACCOUNT_ID>/adsets` endpoint where `<AD_ACCOUNT_ID>` is the ID for your Meta ad account. Your request must include:

* `destination_type` (Required)
* `optimization_goal` (Required) — **Note:** Not all Ad Set optimization goals support reminder functionality
* `instagram_positions` (Optional) — Supported placements for reminder ads include `stream`, `story`, and `reels`. For further information on specifying placement refer to [Placement Targeting](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/placement-targeting) and [Get Started: Placement](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/instagramads/get-started#targeting) for Instagram ads.

### Request

*Formatted for readability. Make sure to replace placeholders with your own values.*

```curl
curl -X POST "https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets" \
  -F 'billing_event=IMPRESSIONS' \
  -F 'campaign_id=<AD_CAMPAIGN_ID>' \
  -F 'daily_budget=1000' \
  -F 'destination_type=ON_REMINDER' \
  -F 'name=Reminder Ads Ad Set' \
  -F 'optimization_goal=REMINDERS_SET' \
  -F 'targeting={
    "geo_locations": { "countries":["US"] },
    "device_platforms": ["mobile"]
  }'
```

### Response

On success, your app receives the following JSON response with the created ad set's ID:

```json
{

  "id": "<AD_SET_ID>"
}
```

## Step 3: Create an Ad Creative with an Upcoming Event

The ad creative allows you to add assets to your ads. To create an ad creative, make a `POST` request to the `/act_<AD_ACCOUNT_ID>/adcreatives` endpoint where `<AD_ACCOUNT_ID>` is the ID for your Meta ad account. Your request must include:

* `asset_feed_spec`: This will contain the ID of the upcoming event you wish to associate with the ad.
* `object_story_spec`: For reminder ads, the value of link must be specified. If you do not want to a link to appear on your ad, use the dummy URL **https://fb.com/**. The dummy link will not appear on your ad.

### Request

*Formatted for readability. Make sure to replace placeholders with your own values.*

```curl
curl -X POST "https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives" \
    -F 'name=Sample ad creative' \
    -F 'object_story_spec={
        "page_id": "<PAGE_ID>",
        "instagram_user_id": "<IG_USER_ID>",
        "link_data": {
            "call_to_action": {
                "type": "LEARN_MORE"
            },
            "image_hash": "<IMAGE_HASH>",
            "link": "https://fb.com/"
        }
    }' \
    -F 'asset_feed_spec={
        "upcoming_events": [
            {
                "event_id": <EVENT_ID>
                "event_title": "Season Premiere",
                "start_time": "2024-05-11T16:00:00+0000",
            }
        ]
    }' \
    -F 'degrees_of_freedom_spec={
        "creative_features_spec": {
            "standard_enhancements": {
                "action_metadata": {
                    "type": "DEFAULT"
                },
                "enroll_status": "OPT_OUT"
            }
        },
        "degrees_of_freedom_type": "USER_ENROLLED_AUTOFLOW"
    }' \
    -F 'access_token=<ACCESS_TOKEN>'
```

### Response
On success, your app receives the following JSON response with the created ad creative's ID:

```json
{
  "id": "<AD_CREATIVE_ID>"
}
```

## Step 4: Create an Ad

Ads allow you to associate ad creative information with your ad sets. To create an ad, make a `POST` request to the `/act_<AD_ACCOUNT_ID>/ads` endpoint where `<AD_ACCOUNT_ID>` is the ID for your Meta ad account. Your request must include:

* `name`: (Required)
* `adset_id`: The ID of the ad set created earlier (Required)
* `creative`: A JSON object with the ID of the creative created earlier (Required)
* `status`: `PAUSED` so you can review your ad before it starts running (Optional)

### Request

*Formatted for readability. Make sure to replace placeholders with your own values.*

```curl
curl -X POST "https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads" \
  -F 'name=Reminder Ad' \
  -F 'adset_id=<AD_SET_ID> \
  -F 'creative={
    "creative_id": "<AD_CREATIVE_ID>"
  }' \
  -F 'status=PAUSED \
  -F 'access_token=<ACCESS_TOKEN>'
```

### Response

On success, your app receives the following JSON response with the created ad's ID:

```json
{
  "id": "<AD_ID>"
}
```
