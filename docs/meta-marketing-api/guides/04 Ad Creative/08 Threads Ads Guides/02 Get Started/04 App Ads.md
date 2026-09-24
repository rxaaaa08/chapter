<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/threads-ads/creation/app-ads | Saved: 2026-09-19 -->

# Threads App Ads



[App ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/mobile-app-ads) are available for Threads. To deliver to Threads, include both `instagram` and `threads` under `publisher_platforms` in your ad set. Then, use the `threads_stream` placement. Remember that you must also select the Instagram `stream` placement.

To create an ad creative for Threads app ads, include the `instagram_user_id` and `threads_user_id` as part of the ad creative's `object_story_spec` parameter.

## Limitations

Threads app ads have the following limitations:

* Threads supports mobile app install and app engagement ads. Threads does not support [desktop app install ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/mobile-app-ads).
* Image, video, and carousel app ads are supported. Threads does not support playable app ads, and playable app ads will render as video ads on Threads.

## Before you begin

* Make sure you are familiar with the basic [Threads ads creation](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/threads-ads/creation) process.

## Create a Threads app ad

### Example request

Include the `threads_user_id` and `instagram_user_id` in the `object_story_spec` of the request below so the ad can be successfully delivered to Threads.

```bash
curl -X POST \
  -F 'name="Sample App Ads Creative"' \
  -F 'object_story_spec={
    "page_id": "<PAGE_ID>",
    "instagram_user_id": "<INSTAGRAM_USER_ID>",
    "threads_user_id": "<THREADS_USER_ID>",
    "link_data": {
      "call_to_action": {
        "type": "INSTALL_MOBILE_APP",
        "value": {
          "link": "<APP_STORE_URL>"
        }
      },
    "image_hash": "<IMAGE_HASH>",
    "link": "<APP_STORE_URL>",
    "message": "<MESSAGE_TEXT>"
    }
  }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

### Example response

A successful response returns the new app ad creative ID.

```json
{
  "id":"<CREATIVE_ID>"
}
```

## Learn more

* [App Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/mobile-app-ads)
* [Facebook App Ads](https://developers.facebook.com/docs/app-ads)
* [Threads Ads Creation: Media Requirements](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/threads-ads/creation#media-requirements)
