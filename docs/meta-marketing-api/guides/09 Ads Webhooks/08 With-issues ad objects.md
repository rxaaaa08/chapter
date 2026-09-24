<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/with-issues-ad-objects | Saved: 2026-09-19 | Converted from the web page: Meta's "View as Markdown" export returns an error for this page -->

# With-issues ad objects

Ads in WhatsApp Status are available via the Marketing API. [Learn more about ads in WhatsApp Status.](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-in-whatsapp-status)

The `with_issues_ad_objects` webhook notifies you when an ad object enters an issue state, meaning something went wrong during its operation or publishing. The payload identifies the object, the level it sits at, and details about the error, so you can catch problems such as a rejection or a delivery block and fix them quickly.

## Subscribe your app to the webhook

Enabling this webhook takes two API calls that use two different access tokens. Make them back to back:

1. A **subscription** call with an app access token registers the `with_issues_ad_objects` field and points Meta at your callback URL.
2. A **subscribed apps** call with an ad account admin token connects a specific ad account so its events are delivered to your app.

```
curl -X POST "https://graph.facebook.com/<APP_ID>/subscriptions" \
  -F "object=ad_account" \
  -F "callback_url=<YOUR_HTTPS_CALLBACK_URL>" \
  -F "fields=with_issues_ad_objects" \
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
          "field": "with_issues_ad_objects",
          "value": {
            "id": "<OBJECT_ID>",
            "level": "AD",
            "error_code": "567",
            "error_summary": "error summary",
            "error_message": "error message"
          }
        }
      ]
    }
  ]
}
```

| Field | Description |
| --- | --- |
| `id` | The ID of the ad object that entered an issue state. |
| `level` | The level of the object: `CAMPAIGN`, `AD_SET`, `AD`, or `CREATIVE`. |
| `error_code` | The code identifying the issue. |
| `error_summary` | A short summary of the issue. |
| `error_message` | A human-readable description of the issue. |

## Poll for more context

To understand what went wrong before acting, read the object’s status and review feedback:

```
GET /<OBJECT_ID>?fields=effective_status,configured_status,review_feedback,creative{id,name,thumbnail_url},adset{id,name,status},campaign{id,name,status}

```

`review_feedback` gives the rejection reason when an ad is disapproved, `configured_status` distinguishes an intended pause from an issue, and the `creative`, `adset`, and `campaign` fields give the context you need for escalation decisions.

## Example actions

**Disapproved: fix the creative and resubmit.**

```
curl -X POST "https://graph.facebook.com/<API_VERSION>/<AD_ID>" \
  -d "creative={'creative_id': '<CREATIVE_ID>'}" \
  -d "status=ACTIVE" \
  -d "access_token=<ACCESS_TOKEN>"

```

**Pause an ad set while you investigate an issue.**

```
curl -X POST "https://graph.facebook.com/<API_VERSION>/<ADSET_ID>" \
  -d "status=PAUSED" \
  -d "access_token=<ACCESS_TOKEN>"

```

## Related webhooks

* [In-process ad objects](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/in-process-ad-objects)
* [Effective status](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/effective-status)
* [Ads webhooks overview](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/ads-webhooks-overview)
