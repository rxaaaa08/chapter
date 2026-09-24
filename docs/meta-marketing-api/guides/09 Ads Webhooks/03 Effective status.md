<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/effective-status | Saved: 2026-09-19 | Converted from the web page: Meta's "View as Markdown" export returns an error for this page -->

# Effective status

Ads in WhatsApp Status are available via the Marketing API. [Learn more about ads in WhatsApp Status.](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-in-whatsapp-status)

The `effective_status` webhook notifies you when the delivery status of a campaign, ad set, or ad changes. Effective status reflects whether an object is actually delivering, taking into account its own status and the status of its parents. It changes when an ad is rejected in review, when delivery is blocked or resumes, or when a status change on a parent cascades down to its active children.

Unlike the other ad_account webhooks, `effective_status` reports the change through the shared `field_changed` field and lists the affected field in `changed_fields`. A single subscription covers status changes at the campaign, ad set, and ad levels.

## Subscribe your app to the webhook

Enabling this webhook takes two API calls that use two different access tokens. Make them back to back:

1. A **subscription** call with an app access token registers the `effective_status` field and points Meta at your callback URL.
2. A **subscribed apps** call with an ad account admin token connects a specific ad account so its events are delivered to your app.

```
curl -X POST "https://graph.facebook.com/<APP_ID>/subscriptions" \
  -F "object=ad_account" \
  -F "callback_url=<YOUR_HTTPS_CALLBACK_URL>" \
  -F "fields=effective_status" \
  -F "verify_token=<VERIFY_TOKEN>" \
  -F "access_token=<APP_ACCESS_TOKEN>"

curl -X POST "https://graph.facebook.com/act_<AD_ACCOUNT_ID>/subscribed_apps" \
  -F "access_token=<AD_ACCOUNT_ADMIN_TOKEN>"

```

When you make the first call, Meta sends a verification `GET` to your `callback_url`. Your endpoint must echo `hub.challenge` for the subscription to succeed. Repeat the second call for each ad account you want to receive events for. You subscribe to `effective_status`, but notifications arrive on the shared `field_changed` field as described below. For details, see [Get started](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/setup/get-started).

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
          "field": "field_changed",
          "value": {
            "object_id": "<OBJECT_ID>",
            "object_type": "ad",
            "changed_fields": ["effective_status"]
          }
        }
      ]
    }
  ]
}
```

`object_type` is one of `campaign`, `adset`, or `ad`, identifying which level in the ad hierarchy changed. The payload tells you that the effective status changed but not the new value. Poll the object to read it.

## Poll for more context

Request the status and the context you need to decide what to do:

```
GET /<OBJECT_ID>?fields=effective_status,configured_status,review_feedback,creative{id,name,thumbnail_url,effective_object_story_id},adset{id,name,daily_budget,status},campaign{id,name,status,daily_budget,spend_cap}

```

## Why these fields

* `effective_status` -- the new delivery status that triggered the webhook.
* `configured_status` -- distinguishes a status you set from one the system set, so you can tell “I paused it” from “it was paused for me.”
* `review_feedback` -- when an ad is disapproved, the rejection reason you need to fix it.
* `creative{...}` -- identifies which creative passed or failed review.
* `adset` and `campaign` -- budget and parent context for escalation decisions.

## Example actions

**Disapproved: fix the creative and resubmit.**

```
curl -X POST "https://graph.facebook.com/<API_VERSION>/<AD_ID>" \
  -d "creative={'creative_id': '<CREATIVE_ID>'}" \
  -d "status=ACTIVE" \
  -d "access_token=<ACCESS_TOKEN>"

```

**Spending limit reached: raise the account spend cap.**

```
curl -X POST "https://graph.facebook.com/<API_VERSION>/act_<AD_ACCOUNT_ID>" \
  -d "spend_cap=50000000" \
  -d "access_token=<ACCESS_TOKEN>"

```

**Approved: activate the ad set and scale its budget.**

```
curl -X POST "https://graph.facebook.com/<API_VERSION>/<ADSET_ID>" \
  -d "status=ACTIVE" \
  -d "access_token=<ACCESS_TOKEN>"

curl -X POST "https://graph.facebook.com/<API_VERSION>/<CAMPAIGN_ID>" \
  -d "daily_budget=1500000" \
  -d "access_token=<ACCESS_TOKEN>"

```

## Related webhooks

* [In-process ad objects](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/in-process-ad-objects)
* [With-issues ad objects](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/with-issues-ad-objects)
* [Ads webhooks overview](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/ads-webhooks-overview)
