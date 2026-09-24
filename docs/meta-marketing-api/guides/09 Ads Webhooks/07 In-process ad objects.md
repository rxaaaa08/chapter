<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/in-process-ad-objects | Saved: 2026-09-19 | Converted from the web page: Meta's "View as Markdown" export returns an error for this page -->

# In-process ad objects

Ads in WhatsApp Status are available via the Marketing API. [Learn more about ads in WhatsApp Status.](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-in-whatsapp-status)

The `in_process_ad_objects` webhook notifies you when an ad object finishes publishing or processing and exits its in-process state. The payload identifies the object and the level in the ad hierarchy it sits at, so your app can move on to the next step in a workflow once setup is complete.

## Subscribe your app to the webhook

Enabling this webhook takes two API calls that use two different access tokens. Make them back to back:

1. A **subscription** call with an app access token registers the `in_process_ad_objects` field and points Meta at your callback URL.
2. A **subscribed apps** call with an ad account admin token connects a specific ad account so its events are delivered to your app.

```
curl -X POST "https://graph.facebook.com/<APP_ID>/subscriptions" \
  -F "object=ad_account" \
  -F "callback_url=<YOUR_HTTPS_CALLBACK_URL>" \
  -F "fields=in_process_ad_objects" \
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
          "field": "in_process_ad_objects",
          "value": {
            "id": "<OBJECT_ID>",
            "level": "CREATIVE",
            "status_name": "Paused"
          }
        }
      ]
    }
  ]
}
```

| Field | Description |
| --- | --- |
| `id` | The ID of the ad object that finished processing. |
| `level` | The level of the object: `CAMPAIGN`, `AD_SET`, `AD`, or `CREATIVE`. |
| `status_name` | The human-readable status the object landed in. |

## Poll for more context

To confirm the object is ready and see how it is configured, read its status:

```
GET /<OBJECT_ID>?fields=effective_status,configured_status,review_feedback,adset{id,name,status,daily_budget},campaign{id,name,status}

```

`effective_status` gives the current delivery status now that processing is complete, `configured_status` tells you whether the object is intended to be active, and the `adset` and `campaign` fields give parent context for the next action.

## Example actions

**Activate the ad now that it has finished processing.**

```
curl -X POST "https://graph.facebook.com/<API_VERSION>/<AD_ID>" \
  -d "status=ACTIVE" \
  -d "access_token=<ACCESS_TOKEN>"

```

**Activate the parent ad set to begin delivery.**

```
curl -X POST "https://graph.facebook.com/<API_VERSION>/<ADSET_ID>" \
  -d "status=ACTIVE" \
  -d "access_token=<ACCESS_TOKEN>"

```

## Related webhooks

* [With-issues ad objects](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/with-issues-ad-objects)
* [Effective status](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/effective-status)
* [Ads webhooks overview](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/ads-webhooks-overview)
