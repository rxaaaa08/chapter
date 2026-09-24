<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/call-ads/callback-feature | Saved: 2026-09-19 -->

# Callback Feature



The callback feature allows users to submit their contact information (e.g., name, phone number) from your call ad. You can then download the callback requests.

## Create a callback ad

To enable the callback feature on a call ad, add `"callback_type": "FORM"` in `call_ads_configuration` when creating the ad creative.

```json
"asset_feed_spec":
  {
  "call_ads_configuration":
    {
      "callback_type": "FORM"
    }
  }
```

## Download callback requests

Use the [bulk read by leads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lead-ads/retrieving#bulk-read) endpoint. Note that for callback requests, it can only be read by an ad, not by a form.

```bash
curl -X GET \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/<API_VERSION>/<AD_ID>/leads
```
