<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/messaging-ads/website-ads-click-to-message | Saved: 2026-09-19 -->

# Website ads that click to message


Website ads that click to message let you add a messaging banner to your website destination ads. When customers click the ad on mobile, the website opens in an in-app browser for Facebook and Instagram. At the bottom of the page, customers see a footer with a button to redirect to the specified messaging destination and can click on it to have a conversation about your products or services.

Website ads that click to message and click-to-message ads are distinct products that use different API field combinations:

| Field | Website ads that click to message | Click-to-message |
|---|---|---|
| `destination_type` | `WEBSITE` or `UNDEFINED` | `MESSENGER`, `WHATSAPP`, or `INSTAGRAM_DIRECT` |
| `optimization_goal` | Choose based on your objective: 
- Sales: `OFFSITE_CONVERSIONS` 
- Leads: `OFFSITE_CONVERSIONS` 
- Engagement: `OFFSITE_CONVERSIONS` 
- Traffic: `LANDING_PAGE_VIEWS` 
- Awareness: `REACH` | `CONVERSATIONS` |
| CTA type | `LEARN_MORE` (or other website CTAs) | `MESSAGE_PAGE` or `WHATSAPP_MESSAGE` with `app_destination` |
| `asset_feed_spec` | `message_extensions: [{"type":"messenger"}]` (or `whatsapp`, `instagram_message`) | Not used |
| Primary user action | User lands on your website with a messaging button as a secondary entry point | User is sent directly to a messaging conversation |

## Prerequisites

- An ad account with access to the Marketing API.
- A Facebook Page linked to your messaging destination (WhatsApp Business number, Messenger, or Instagram Professional account).
- A valid access token with the `ads_management` permission.
- Your ad set must use `destination_type: WEBSITE` or `UNDEFINED`. Website ads that click to message do not work with other destination types.

## Step 1: Create an ad campaign

Create an ad campaign with a supported objective. The supported objectives vary by messaging channel:

| Channel | Supported objectives |
|---|---|
| Website to WhatsApp | Sales, Traffic, Engagement, Leads, Awareness |
| Website to Messenger | Sales, Traffic, Leads, Awareness |
| Website to Instagram Direct | Sales, Traffic, Leads |

```html
curl -X POST \
  -F 'name=Website-to-Messaging Campaign' \
  -F 'objective=OUTCOME_TRAFFIC' \
  -F 'buying_type=AUCTION' \
  -F 'status=PAUSED' \
  -F 'special_ad_categories=["NONE"]' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/campaigns
```

On success, your app receives a JSON response with the ad campaign ID.

```json
{
  "id": "<CAMPAIGN_ID>"
}
```

## Step 2: Create an ad set

Set `destination_type` to `WEBSITE` or `UNDEFINED`.

**Note:** Do not use messaging-specific destination types such as `MESSAGING_WHATSAPP`, `MESSAGING_MESSENGER`, or `MESSAGING_INSTAGRAM_DIRECT`.

```html
curl -X POST \
  -F 'name=Website-to-Messaging Ad Set' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'daily_budget=500' \
  -F 'bid_amount=200' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'optimization_goal=LANDING_PAGE_VIEWS' \
  -F 'destination_type=WEBSITE' \
  -F 'promoted_object={"page_id":"<PAGE_ID>"}' \
  -F 'status=PAUSED' \
  -F 'targeting={"geo_locations":{"countries":["US"]},"age_min":18,"age_max":65,"publisher_platforms":["facebook"],"facebook_positions":["feed"]}' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

On success, your app receives a JSON response with the ad set ID.

```json
{
  "id": "<AD_SET_ID>"
}
```

## Step 3: Create an ad using an inline creative

You must pass the creative inline in the `POST /ads` request.

**Note:** Creating a standalone creative via `POST /adcreatives` with `message_extensions` is not supported and returns error code 3.

The `message_extensions` property in `asset_feed_spec` determines the messaging channel:

| Channel | `message_extensions` value |
|---|---|
| Website to WhatsApp | `[{"type": "whatsapp"}]` |
| Website to Messenger | `[{"type": "messenger"}]` |
| Website to Instagram Direct | `[{"type": "instagram_message"}]` |

Use a non-messaging `call_to_action` type such as `LEARN_MORE`.

**Note:** Messaging calls to action such as `WHATSAPP_MESSAGE`, `INSTAGRAM_MESSAGE`, and `MESSAGE_PAGE` are not compatible with website ads that click to message.

### Website to WhatsApp

```html
curl -X POST \
  -F 'access_token=<ACCESS_TOKEN>' \
  -F 'name=Website to WhatsApp Ad' \
  -F 'adset_id=<AD_SET_ID>' \
  -F 'creative={"object_story_spec":{"page_id":"<PAGE_ID>","link_data":{"image_hash":"<IMAGE_HASH>","link":"<WEBSITE_URL>","message":"<AD_PRIMARY_TEXT>","call_to_action":{"type":"LEARN_MORE","value":{"link":"<WEBSITE_URL>"}}}},"asset_feed_spec":{"message_extensions":[{"type":"whatsapp"}]}}' \
  -F 'status=PAUSED' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads
```

### Website to Messenger

```html
curl -X POST \
  -F 'access_token=<ACCESS_TOKEN>' \
  -F 'name=Website to Messenger Ad' \
  -F 'adset_id=<AD_SET_ID>' \
  -F 'creative={"object_story_spec":{"page_id":"<PAGE_ID>","link_data":{"image_hash":"<IMAGE_HASH>","link":"<WEBSITE_URL>","message":"<AD_PRIMARY_TEXT>","call_to_action":{"type":"LEARN_MORE","value":{"link":"<WEBSITE_URL>"}}}},"asset_feed_spec":{"message_extensions":[{"type":"messenger"}]}}' \
  -F 'status=PAUSED' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads
```

### Website to Instagram Direct

```html
curl -X POST \
  -F 'access_token=<ACCESS_TOKEN>' \
  -F 'name=Website to Instagram Direct Ad' \
  -F 'adset_id=<AD_SET_ID>' \
  -F 'creative={"object_story_spec":{"page_id":"<PAGE_ID>","link_data":{"image_hash":"<IMAGE_HASH>","link":"<WEBSITE_URL>","message":"<AD_PRIMARY_TEXT>","call_to_action":{"type":"LEARN_MORE","value":{"link":"<WEBSITE_URL>"}}}},"asset_feed_spec":{"message_extensions":[{"type":"instagram_message"}]}}' \
  -F 'status=PAUSED' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads
```

On success, your app receives a JSON response with the ad ID.

```json
{
  "id": "<AD_ID>"
}
```

## Step 4: Publish your ad

When you are ready to go live, update the ad status from `PAUSED` to `ACTIVE`:

```html
curl -X POST \
  -F 'status=ACTIVE' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<AD_ID>
```

## Verify your ad

Verify that `message_extensions` and `destination_type` are set correctly by making a `GET` request to the ad:

```html
curl -G "https://graph.facebook.com/v25.0/<AD_ID>" \
  -d "access_token=<ACCESS_TOKEN>" \
  -d "fields=creative{asset_feed_spec{message_extensions}},adset{destination_type}"
```

The response for a website to WhatsApp ad looks like this:

```json
{
  "creative": {
    "asset_feed_spec": {
      "message_extensions": [{"type": "whatsapp"}]
    }
  },
  "adset": {
    "destination_type": "WEBSITE"
  },
  "id": "<AD_ID>"
}
```

## Identify website ads that click to message

You can identify website ads that click to message by checking the ad set `destination_type` and the ad creative's `message_extensions` configuration.

To determine whether an ad is a website ad that clicks to message, check for **both** of the following:

1. The ad set has `destination_type: "WEBSITE"` or `"UNDEFINED"`
2. The ad creative contains `asset_feed_spec.message_extensions`

Click-to-message ads (such as click-to-WhatsApp) use messaging-specific destination types such as `MESSAGING_WHATSAPP`, `MESSAGING_MESSENGER`, or `MESSAGING_INSTAGRAM_DIRECT`. Website ads that click to message always use `destination_type: "WEBSITE"` or `"UNDEFINED"` combined with `message_extensions`.
