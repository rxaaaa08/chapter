<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/threads-ads/creation/carousel-ads | Saved: 2026-09-19 -->

# Threads Carousel Ads



To create [carousel ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/videoads#carousel), provide an ad creative with multiple `child_attachments` in `link_data` for `threads_stream`. You need to provide the `threads_user_id` and only use [objectives](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/threads-ads/creation#step-2--create-an-ad-campaign) supported in Threads ads.

There are some differences between Threads and [Instagram carousel ads](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/carousel-ads). These differences only happen with the Threads placement. If you have an ad set with Facebook, Instagram, and Threads placements enabled, what works on Facebook and/or Instagram may be different from that on Threads.

* Each attachment must have a `link` specified, which is the destination of the image click.
* There is no call to action button on the ad. If a headline or name is provided for an attachment, it will overwrite the call to action text. If no headline or name is provided, the call to action text will be used for the attachment.
* Only 10 children are allowed for [inline creation](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/videoads#inline).

## Image cards

* Each attachment must have either a `picture` or `image_hash` set. The image is not defaulted from `link_data`.
* See the [media requirements](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/threads-ads/creation#media-requirements) for supported image specifications.

## Create a Threads image carousel ad creative

### Example request

```bash
curl -X POST \
  -F 'name=Threads Carousel Creative' \
  -F 'object_story_spec={
      "instagram_user_id": "<IG_USER_ID>",
      "threads_user_id": "<THREADS_USER_ID>",
      "page_id": "<PAGE_ID>",
      "link_data": {
        "child_attachments": [
          {
            "link": "<LINK_1>",
            "image_hash": "<IMAGE_HASH_1>",
            "description": "$8.99",
            "name": "Product 1"
          },
          {
            "link": "<LINK_2>",
            "image_hash": "<IMAGE_HASH_2>",
            "description": "$9.99",
            "name": "Product 2"
          },
          {
            "link": "<LINK_3>",
            "image_hash": "<IMAGE_HASH_3>",
            "call_to_action": {
              "type": "LEARN_MORE"
            }
          }
        ],
        "message": "<MESSAGE_TEXT>"
      }
    }
' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

## Learn more

* [Video and Carousel ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/videoads#carousel)
* [Instagram Carousel Ads](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/carousel-ads)
* [Threads Ads Creation: Media Requirements](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/threads-ads/creation#media-requirements)
