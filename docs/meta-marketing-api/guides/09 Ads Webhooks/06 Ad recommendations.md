<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/ad-recommendations | Saved: 2026-09-19 | Converted from the web page: Meta's "View as Markdown" export returns an error for this page -->

# Ad recommendations

Ads in WhatsApp Status are available via the Marketing API. [Learn more about ads in WhatsApp Status.](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-in-whatsapp-status)

The `ad_recommendations` webhook notifies you when a new performance recommendation is available for an ad account. Recommendations are suggested changes that can improve results, such as increasing a budget, broadening targeting, or opting into an optimization. The payload identifies the recommendation and the ad objects it applies to so you can surface or act on it right away.

For background on how recommendations relate to the overall performance score, see [performance recommendations](https://developers.facebook.com/docs/marketing-api/overview/performance-recommendations).

## Subscribe your app to the webhook

Enabling this webhook takes two API calls that use two different access tokens. Make them back to back:

1. A **subscription** call with an app access token registers the `ad_recommendations` field and points Meta at your callback URL.
2. A **subscribed apps** call with an ad account admin token connects a specific ad account so its events are delivered to your app.

```
curl -X POST "https://graph.facebook.com/<APP_ID>/subscriptions" \
  -F "object=ad_account" \
  -F "callback_url=<YOUR_HTTPS_CALLBACK_URL>" \
  -F "fields=ad_recommendations" \
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
          "field": "ad_recommendations",
          "value": {
            "ad_account_id": "<AD_ACCOUNT_ID>",
            "ad_object_ids": ["<OBJECT_ID>"],
            "recommendation_type": "AUTOFLOW_OPT_IN",
            "recommendation_signature": "",
            "recommendation_message": "Your ad recommendation is ready.",
            "recommendation_stage": "mid_flight_recommendation",
            "recommendation_hash": "abcdef1234567890"
          }
        }
      ]
    }
  ]
}
```

| Field | Description |
| --- | --- |
| `ad_account_id` | The ad account the recommendation applies to. |
| `ad_object_ids` | The ad objects the recommendation targets. |
| `recommendation_type` | The category of the recommendation. |
| `recommendation_signature` | An identifier for the specific recommendation instance. |
| `recommendation_message` | A human-readable summary of the recommendation. |
| `recommendation_stage` | The stage of the ad lifecycle the recommendation applies to. |
| `recommendation_hash` | A hash identifying the recommendation content. |

## Poll for more context

To read the full recommendation detail before acting, query the account’s recommendations, filtered to the object that changed:

```
GET /act_<AD_ACCOUNT_ID>/recommendations?fields=recommendation_type,title,message,importance,estimated_impact,blame_field,object_id,recommendation_data&filtering=[{"field":"object_id","operator":"EQUAL","value":"<OBJECT_ID>"}]

```

`importance` supports prioritization or auto-apply rules, `estimated_impact` projects the lift if you apply the change, `blame_field` names the setting to change, and `recommendation_data` holds the structured suggested values.

## Example actions

You can apply the suggested change directly or take a more tailored action.

**Increase a campaign budget.**

```
curl -X POST "https://graph.facebook.com/<API_VERSION>/<CAMPAIGN_ID>" \
  -d "daily_budget=3000000" \
  -d "access_token=<ACCESS_TOKEN>"

```

**Broaden ad set targeting.**

```
curl -X POST "https://graph.facebook.com/<API_VERSION>/<ADSET_ID>" \
  -d "targeting={'age_min':18,'age_max':65,'geo_locations':{'countries':['US','CA','GB']},'flexible_spec':[{'interests':[{'id':'<INTEREST_ID>','name':'Shopping'}]}]}" \
  -d "access_token=<ACCESS_TOKEN>"

```

**Consolidate ad sets by pausing a small one and scaling the main one.**

```
curl -X POST "https://graph.facebook.com/<API_VERSION>/<SMALL_ADSET_ID>" \
  -d "status=PAUSED" \
  -d "access_token=<ACCESS_TOKEN>"

curl -X POST "https://graph.facebook.com/<API_VERSION>/<MAIN_ADSET_ID>" \
  -d "daily_budget=5000000" \
  -d "access_token=<ACCESS_TOKEN>"

```

## Related webhooks

* [Creative fatigue](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/creative-fatigue)
* [Effective status](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/effective-status)
* [Ads webhooks overview](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/ads-webhooks-overview)
