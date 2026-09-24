<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/creative-fatigue | Saved: 2026-09-19 | Converted from the web page: Meta's "View as Markdown" export returns an error for this page -->

# Creative fatigue

Ads in WhatsApp Status are available via the Marketing API. [Learn more about ads in WhatsApp Status.](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-in-whatsapp-status)

The `creative_fatigue` webhook notifies you when an ad’s creative fatigue level changes. Fatigue rises as an audience sees the same creative repeatedly, which usually shows up as a falling click-through rate and a rising cost per action. The payload carries the new fatigue level and a message describing it, so you can react as soon as a creative starts to wear out.

## Subscribe your app to the webhook

Enabling this webhook takes two API calls that use two different access tokens. Make them back to back:

1. A **subscription** call with an app access token registers the `creative_fatigue` field and points Meta at your callback URL.
2. A **subscribed apps** call with an ad account admin token connects a specific ad account so its events are delivered to your app.

```
curl -X POST "https://graph.facebook.com/<APP_ID>/subscriptions" \
  -F "object=ad_account" \
  -F "callback_url=<YOUR_HTTPS_CALLBACK_URL>" \
  -F "fields=creative_fatigue" \
  -F "verify_token=<VERIFY_TOKEN>" \
  -F "access_token=<APP_ACCESS_TOKEN>"

curl -X POST "https://graph.facebook.com/act_<AD_ACCOUNT_ID>/subscribed_apps" \
  -F "access_token=<AD_ACCOUNT_ADMIN_TOKEN>"

```

When you make the first call, Meta sends a verification `GET` to your `callback_url`. Your endpoint must echo `hub.challenge` for the subscription to succeed. Repeat the second call for each ad account you want to receive events for. For details, see [Get started](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/setup/get-started).

## Webhook payload

```
{
  "object": "ad_account",
  "entry": [
    {
      "id": "<AD_ACCOUNT_ID>",
      "time": 1782862117,
      "changes": [
        {
          "field": "creative_fatigue",
          "value": {
            "ad_account_id": "<AD_ACCOUNT_ID>",
            "adgroup_id": "<AD_ID>",
            "creative_fatigue_level": "HIGH",
            "creative_fatigue_message": "Your ad fatigue changed from medium to high. To address the fatigued ad, try creating a new ad with different images or videos in the same campaign, expanding your audience, or using Advantage+ creative."
          }
        }
      ]
    }
  ]
}
```

| Field | Description |
| --- | --- |
| `ad_account_id` | The ad account the fatiguing ad belongs to. |
| `adgroup_id` | The ID of the ad whose creative is fatiguing. |
| `creative_fatigue_level` | The new fatigue level: `LOW`, `MEDIUM`, or `HIGH`. |
| `creative_fatigue_message` | A human-readable description of the change and suggested remedies. |

## Poll for more context

To diagnose the fatigue before acting, read the recent performance trend for the ad:

```
GET /<AD_ID>/insights?fields=impressions,frequency,ctr,cpc,actions,cost_per_action_type,date_start,date_stop&date_preset=last_7d&time_increment=1

```

Then read the creative and audience context to decide what to replace:

```
GET /<AD_ID>?fields=creative{id,name,image_hash,image_url,body,title},adset{id,name,targeting,daily_budget},status

```

`frequency` and `ctr` day by day show the shape of the decay, `cost_per_action_type` quantifies how much more expensive the ad is getting, the `creative` fields identify what to replace, and `adset.targeting` gives audience-size context.

## Example actions

**Swap in a new creative on the existing ad.**

```
curl -X POST "https://graph.facebook.com/<API_VERSION>/<AD_ID>" \
  -d "creative={'creative_id': '<CREATIVE_ID>'}" \
  -d "status=ACTIVE" \
  -d "access_token=<ACCESS_TOKEN>"

```

**Pause the fatigued ad and launch a refreshed one.**

```
curl -X POST "https://graph.facebook.com/<API_VERSION>/<FATIGUED_AD_ID>" \
  -d "status=PAUSED" \
  -d "access_token=<ACCESS_TOKEN>"

curl -X POST "https://graph.facebook.com/<API_VERSION>/act_<AD_ACCOUNT_ID>/ads" \
  -d "name=<AD_NAME>" \
  -d "adset_id=<ADSET_ID>" \
  -d "creative={'creative_id': '<CREATIVE_ID>'}" \
  -d "status=ACTIVE" \
  -d "access_token=<ACCESS_TOKEN>"

```

## Related webhooks

* [Ad recommendations](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/ad-recommendations)
* [Effective status](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/effective-status)
* [Ads webhooks overview](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/ads-webhooks-overview)
