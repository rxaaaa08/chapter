<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-in-whatsapp-status/user-age-unknown | Saved: 2026-09-19 -->

# Reach people on WhatsApp whose age is unknown



Using this feature is optional and only applies to people using WhatsApp. You can opt out at any time by setting `user_age_unknown: false` in your ad set targeting spec. Excluding people on WhatsApp whose age is unknown may substantially reduce delivery to people on WhatsApp, some of whom you may want to reach.

WhatsApp's [Terms of Service](https://www.whatsapp.com/legal/terms-of-service) require people to be at least 13 years old to register for and use WhatsApp (or older in some countries or territories), but it does not have age information for all people. The `user_age_unknown` targeting field controls whether these people are included in your ad set's audience. If you include people on WhatsApp whose age is unknown, we may not have age information for all of the people who may see your ads. Ads delivered to people on WhatsApp whose age is unknown must be suitable for people of all ages. As always, advertisers are required to follow our [Advertising Standards](https://transparency.meta.com/policies/ad-standards).

If the WhatsApp Status placement is included and this field is not set, it defaults to `true`, meaning people on WhatsApp whose age is unknown are included in your audience.

## Overview

| Detail | Value |
| --- | --- |
| Field name | `user_age_unknown` |
| Type | Boolean |
| Default (starting July 2026) | `true` |
| Applies to | WhatsApp Status placement only |
| Set at | Ad set level, inside the targeting spec |

## Behavior

| Value | Behavior |
| --- | --- |
| `true` (or omitted) | People on WhatsApp whose age is unknown **are included** in the ad set audience. This is the default starting July 2026. |
| `false` | People on WhatsApp whose age is unknown **are excluded** from the ad set audience. |

You can opt out at any time by setting this field to `false`. See [People on WhatsApp whose age is unknown](https://www.facebook.com/business/help/717368264947302?id=176276233019487) for more information.

## Placement requirements

The `user_age_unknown` field only applies when your ad set targets the WhatsApp Status placement. WhatsApp Status has the following placement requirements:

- You must also select the Instagram Story placement (`instagram_positions: ["story"]`). You cannot select `whatsapp_positions: ["status"]` by itself.

## Request syntax

Set `user_age_unknown` inside the targeting object when creating or updating an ad set with the `POST /act_<AD_ACCOUNT_ID>/adsets` endpoint.

```bash
curl \
  -F 'name=<AD_SET_NAME>' \
  -F 'optimization_goal=LINK_CLICKS' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'bid_amount=<BID_AMOUNT>' \
  -F 'daily_budget=<DAILY_BUDGET>' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'targeting={
    "geo_locations": {"countries": ["<COUNTRY_CODE>"]},
    "publisher_platforms": ["instagram", "whatsapp"],
    "instagram_positions": ["story"],
    "whatsapp_positions": ["status"],
    "user_age_unknown": <TRUE_OR_FALSE>
  }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

### Request parameters

| Placeholder | Description | Example value |
| --- | --- | --- |
| `<AD_ACCOUNT_ID>` | Required. Your ad account ID. | `act_123456789` |
| `<CAMPAIGN_ID>` | Required. The campaign this ad set belongs to. | `120210987654320123` |
| `<TRUE_OR_FALSE>` | Optional. Set to `false` to exclude people on WhatsApp whose age is unknown. Defaults to `true`. | `false` |

## Default behavior with Advantage+ placements

If the WhatsApp Status placement is included and `user_age_unknown` is not explicitly set, it defaults to `true`. Your campaigns reach people on WhatsApp whose age is unknown. No action is needed to include these people.

## Request

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Sale Adset",
    "campaign_id": "<CAMPAIGN_ID>",
    "billing_event": "IMPRESSIONS",
    "optimization_goal": "LINK_CLICKS",
    "bid_strategy": "LOWEST_COST_WITHOUT_CAP",
    "daily_budget": "2000",
    "status": "PAUSED",
    "targeting": {
      "geo_locations": {
        "countries": ["US"]
      }
    }
  }' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

**Response**

```json
{
  "id": "<AD_SET_ID>"
}
```

## Example request — exclude people on WhatsApp whose age is unknown

Create an ad set for WhatsApp Status that excludes people on WhatsApp whose age is unknown:

```bash
curl \
  -F 'name=Summer Sale Adset' \
  -F 'optimization_goal=LINK_CLICKS' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'bid_amount=2' \
  -F 'daily_budget=1000' \
  -F 'campaign_id=120210987654320123' \
  -F 'targeting={
    "geo_locations": {"countries": ["US"]},
    "publisher_platforms": ["instagram", "whatsapp"],
    "instagram_positions": ["story"],
    "whatsapp_positions": ["status"],
    "user_age_unknown": false
  }' \
  -F 'access_token=EAAJB...' \
https://graph.facebook.com/v25.0/act_123456789/adsets
```
