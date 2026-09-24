<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/marketing-messages | Saved: 2026-09-19 | Converted from the web page: Meta's "View as Markdown" export returns an error for this page -->

# Marketing messages

Ads in WhatsApp Status are available via the Marketing API. [Learn more about ads in WhatsApp Status.](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-in-whatsapp-status)

This guide explains how to create ads that include WhatsApp marketing messages using the Marketing API.

Marketing messages let you re-engage customers who opted in to your marketing communications. With the Marketing API, marketing messages are a placement on an ad set, so you can create integrated campaigns that include both ad placements and marketing messages on WhatsApp.

You create the campaign, ad set, ad creative, and ad with the same endpoints you already use for ads. The difference is that your ad set targeting can now include the WhatsApp `marketing_messages` position.

For a product introduction, see [About marketing messages on Ads Manager](https://www.facebook.com/business/help/740422481582970).

## Before you start

To include marketing messages in your campaigns, you need to meet the following prerequisites.

### Developer app

* A developer app configured with the [**Create and manage ads with Marketing API**](https://developers.facebook.com/docs/development/create-an-app/marketing-api-use-cases) use case, which grants the permissions needed to create and manage ads.
* Acceptance of the **Marketing Messages Terms of Service**. You can accept the terms in the [App Dashboard](https://developers.facebook.com/apps) under **Create and manage ads with Marketing API** > **Customize** > **Settings**.**Note:** If your business has already accepted the terms, this entry point is not shown.

### Ad account

The ad account must be onboarded to marketing messages. Onboarding happens in [Meta Ads Manager](https://adsmanager.facebook.com/), where you configure:

* The phone number that sends your messages.
* The [messaging customer base](https://www.facebook.com/business/help/1537135824317533) that receives them — everyone eligible to receive marketing messages from your business. See [Build your messaging customer base](https://www.facebook.com/business/help/748848107897824).

If the ad account is not onboarded yet, see [Set up marketing messages](https://www.facebook.com/business/ads/marketing-messages).

## Check whether an ad account is onboarded

Read `marketing_messages_settings` on the ad account before you create a campaign:

```
curl -G 'https://graph.facebook.com/v26.0/act_<AD_ACCOUNT_ID>' \
-d 'fields=marketing_messages_settings{whatsapp_activation_status}' \
-H 'Authorization: Bearer EAAJB...'

```

```
{
  "marketing_messages_settings": {
    "whatsapp_activation_status": "MARKETING_MESSAGE_ONBOARDED"
  },
  "id": "act_<AD_ACCOUNT_ID>"
}
```

If `whatsapp_activation_status` is `MARKETING_MESSAGE_NOT_ONBOARDED` or `MARKETING_MESSAGE_INELIGIBLE`, the marketing messages placement is not available for the ad account. If you include the placement anyway:

* When the ad set includes other placements alongside marketing messages, creation succeeds and the API returns no error, but the ad set does not deliver marketing messages.
* When the ad set includes only the marketing messages placement, the API returns an error.

Onboard the ad account in Ads Manager before you create the campaign.

For the full field definition and the complete list of statuses, see the [Ad Account reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account).

## Create a campaign with marketing messages

### Step 1: Create a campaign

Create a [campaign](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group) the same way you would for ads, using one of the supported objectives listed below.

| Objective | Optimization goals you can set on the ad set |
| --- | --- |
| `OUTCOME_SALES` | `LINK_CLICKS`, `OFFSITE_CONVERSIONS`, `VALUE` |
| `OUTCOME_TRAFFIC` | `LINK_CLICKS` |
| `OUTCOME_LEADS` | `OFFSITE_CONVERSIONS` |

### Step 2: Create an ad set with the marketing messages placement

To deliver marketing messages, include `whatsapp` in `publisher_platforms` and `marketing_messages` in `whatsapp_positions`:

```
curl 'https://graph.facebook.com/v26.0/act_<AD_ACCOUNT_ID>/adsets' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer EAAJB...' \
-d '{
  "name": "Marketing messages ad set",
  "campaign_id": "<CAMPAIGN_ID>",
  "optimization_goal": "LINK_CLICKS",
  "billing_event": "IMPRESSIONS",
  "bid_strategy": "LOWEST_COST_WITHOUT_CAP",
  "lifetime_budget": 10000,
  "start_time": "<START_TIME>",
  "end_time": "<END_TIME>",
  "status": "PAUSED",
  "targeting": {
    "geo_locations": {"countries": ["MX"]},
    "publisher_platforms": ["facebook", "whatsapp"],
    "facebook_positions": ["feed"],
    "whatsapp_positions": ["marketing_messages"]
  }
}'

```

**Note:** With Advantage+ placements, marketing messages are added automatically for eligible campaigns.

Marketing messages are delivered to the default messaging customer base that the ad account was configured with during onboarding in Ads Manager. You cannot choose it through the Marketing API — `targeting.subscriber_universe` is read-only. For eligible campaigns, it is returned in `targeting` when you read the ad set back:

```
{
  "targeting": {
    "subscriber_universe": {
      "messaging_customer_base_for_whatsapp": {
        "id": "<MESSAGING_CUSTOMER_BASE_ID>",
        "name": "<MESSAGING_CUSTOMER_BASE_NAME>"
      }
    }
  },
  "id": "<AD_SET_ID>"
}
```

For the full targeting fields, see [Placement targeting](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/placement-targeting).

### Step 3: Create an ad creative

Create the creative the same way you would for an ads-only campaign. To customize the marketing message separately from the ad, add the optional `marketing_message_structured_spec` alongside `object_story_spec`:

```
curl 'https://graph.facebook.com/v26.0/act_<AD_ACCOUNT_ID>/adcreatives' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer EAAJB...' \
-d '{
  "name": "Marketing messages creative",
  "object_story_spec": {
    "page_id": "<PAGE_ID>",
    "link_data": {
      "message": "Check out our latest offers!",
      "link": "https://www.example.com",
      "image_hash": "<IMAGE_HASH>",
      "call_to_action": {"type": "LEARN_MORE"}
    }
  },
  "marketing_message_structured_spec": {
    "asset_customization": {"body": "A special message just for our subscribers."},
    "autoreply": {"text": "Thanks for contacting us. We will get back to you soon."}
  }
}'

```

See [Ad Creative, Marketing Message Structured Spec](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative-marketing-message-structured-spec) for every field you can set, including `asset_customization`, `autoreply`, `buttons`, and `offer`. Each field falls back to `object_story_spec` when you omit it.

### Step 4: Create an ad

Link the creative to the ad set. This call is identical to an ads-only campaign.

```
curl 'https://graph.facebook.com/v26.0/act_<AD_ACCOUNT_ID>/ads' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer EAAJB...' \
-d '{
  "name": "Marketing messages ad",
  "adset_id": "<AD_SET_ID>",
  "creative": {"creative_id": "<CREATIVE_ID>"},
  "status": "PAUSED"
}'

```

## Read marketing message insights

Marketing message performance comes from the same `/insights` edge you already use, at the ad account, campaign, ad set, or ad level.

### Separate marketing messages from your other placements

Break insights down by `publisher_platform` and `platform_position`. Marketing message delivery is attributed to the `whatsapp` publisher platform and the `whatsapp_marketing_messages` platform position:

```
curl -G 'https://graph.facebook.com/v26.0/<CAMPAIGN_ID>/insights' \
-d 'fields=impressions' \
-d 'breakdowns=publisher_platform,platform_position' \
-H 'Authorization: Bearer EAAJB...'

```

```
{
  "data": [
    {
      "impressions": "33",
      "publisher_platform": "instagram",
      "platform_position": "feed",
      "date_start": "2026-06-12",
      "date_stop": "2026-07-11"
    },
    {
      "impressions": "26",
      "publisher_platform": "whatsapp",
      "platform_position": "whatsapp_marketing_messages",
      "date_start": "2026-06-12",
      "date_stop": "2026-07-11"
    }
  ]
}
```

For every breakdown value, see [Breakdowns](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights/breakdowns).

### Message metrics

Four metrics report on marketing message delivery and engagement. Request them in `fields`:

```
curl -G 'https://graph.facebook.com/v26.0/<AD_SET_ID>/insights' \
-d 'fields=messages_delivered,messages_delivered_ctr,read_rate,cost_per_message_delivered' \
-H 'Authorization: Bearer EAAJB...'

```

```
{
  "data": [
    {
      "messages_delivered": "15259",
      "messages_delivered_ctr": "8.5196",
      "read_rate": "99.38",
      "cost_per_message_delivered": "0.0123",
      "date_start": "2026-06-12",
      "date_stop": "2026-07-11"
    }
  ]
}
```

For the definition of each metric, see [Ad Account, Insights](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/insights). The same metrics are available at the campaign and ad set level — see [Ad Campaign Group Insights](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group/insights) and [Ad Campaign Insights](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign/insights).
