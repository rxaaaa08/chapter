<!-- Source: https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/carousel-ads | Saved: 2026-09-19 -->

# Instagram Carousel Ads



To create [carousel ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/videoads), provide ad creative with multiple `child_attachments` in `link_data` for Instagram Stream. We require at least three for `MOBILE_APP_INSTALLS` or `MOBILE_APP_ENGAGEMENT` and two for other objectives. You need to provide `instagram_user_id`, and only use `objectives` supported in Instagram Ads.

There are some differences between Facebook and Instagram carousel ads. These differences only happen with Instagram placement. If you have an ad set with both Facebook and Instagram placements enabled, what works on Facebook may be different from that on Instagram. For example, `multi_share_optimized` has no effect on Instagram, but works on Facebook.

* `multi_share_optimized` has no effect on Instagram. If more than 5 attachments are provided, the first 5 will be used, based on the order of them in the ad creative creation.
* `multi_share_end_card` has no effect on Instagram. End cards are not available on Instagram.
* Each attachment must have `link` specified, which is the destination of the image click.
* Each attachment has a Call To Action button. You can either specify it, or Instagram will default it to "Learn more" and link to the `link` setting of the attachment.
* The `caption` field can be used to specify the display url. If not specified, the `link` url will be used.
* Each carousel card has one image or video and a Call To Action button, and there is one message from `message` setting in the `link_data`. The `name` of each attachment is also shown, between the image or video and the message. The `description` field of the `link_data` and of each child attachment are ignored.

## Image Cards

* Each attachment must have either `picture` or `image_hash` set. We do not default the image from `link_data`.
* A `100x100` image crop can be provided for each attachment, or auto crop will be performed. The final image must be at least 600x600 pixels, which is significantly bigger than the minimum requirement of Facebook carousel ads.

## Video Cards

* The video needs to be square, with at least 600px at each dimension, at most 60 seconds.
* A thumbnail image is required. We recommend to use thumbnail images with the same dimension as videos, but do not require it.
* The video is specified by `video_id` in a `child_attachment`. The thumbnail image is specified by `image_hash` or `picture` in a `child_attachment`.
* The thumbnail image will be shown during loading, or when the ad is shown with a small visible portion. The video will be auto-started and looping.

## Stories {#Stories-carousel}

For Instagram Stories, you can create a carousel with up to ten images or videos. By default, the number of cards is tailored and varies to optimize for performance. A user may see one, two or three cards before seeing the option to "Expand Story". Stories Carousel limitations differ depending on how you have decided to place your ads.

For standalone Instagram Stories placement, you can choose to have a fixed number of cards, with a maximum of 3 cards displayed before the option to expand the story.  This feature is setup inside `carousel_delivery_mode`. Within this field, there are two options:

- `optimal_num_cards`: Default option. The number of cards shown to the user is automatically tailored.
- `fixed_num_cards`: To be selected in case the advertiser wants to have a fixed number of cards shown.

**Note:** Using a fixed number of cards may increase the amount an advertiser pays for results.

Other placement differences:

|  | Standalone | Mixed or Automatic Placements |
| --- | --- | --- |
| Aspect Ratio | 9:16 and non-9:16. Mixed aspect ratio is not supported. | No 9:16 format. |
| Supported Media | Images, videos up to 120 seconds (per card), mixed photos and videos.<br><br>If you have chosen to have a fixed number of cards, we support videos of up to 15 seconds (per card). | Images, videos up to 120 seconds (per card), mixed photos and videos. |
| Supported Objectives | Brand Awareness<br><br>Reach<br><br>Traffic (Link Clicks)<br><br>Messages<br><br>Lead Generation<br><br>Conversions<br><br>App Installs<br><br>Video Views<br><br>Store Traffic<br><br>Catalog Sales<br><br>Note: The option to show a fixed number of cards is not supported for Catalog Sales. | Brand Awareness<br><br>Reach<br><br>Traffic (Link Clicks)<br><br>Messages<br><br>Lead Generation<br><br>Conversions<br><br>App Installs<br><br>Store Traffic<br><br>Catalog Sales |

For example, to create an Instagram Stories carousel:

```html
curl \
  -F 'name=Sample Creative' \
  -F 'object_story_spec={
    "instagram_user_id": <IG_USER_ID>, \
    "link_data": {
      "child_attachments": [
        {
          "description": "$8.99",
          "image_hash": "<IMAGE_HASH>",
          "link": "https:\/\/www.link.com\/product1",
          "name": "Product 1",
          "video_id": "<VIDEO_ID>"
        },
        {
          "description": "$9.99",
          "image_hash": "<IMAGE_HASH>",
          "link": "https:\/\/www.link.com\/product2",
          "name": "Product 2",
          "video_id": "<VIDEO_ID>"
        },
        {
          "description": "$10.99",
          "image_hash": "<IMAGE_HASH>",
          "link": "https:\/\/www.link.com\/product3",
          "name": "Product 3"
        }
      ],
      "link": "<URL>"
    }, \
    "page_id": "<PAGE_ID>" \
  }' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/<LATEST_API_VERSION>/act_<AD_ACCOUNT_ID>/adcreatives
```

To create a carousel with `fixed_num_cards`:

```html
curl -X POST \
  -F 'object_story_spec={
      "instagram_user_id": "<IG_USER_ID>",
      "page_id": "<PAGE_ID>",
      "link_data": {
        "child_attachments": [
          {
            "link": "<LINK>"
            "image_hash": "<IMAGE_HASH>",
            "image_crops": [],
          },
          {
            "link": "<LINK>",
            "image_hash": "<IMAGE_HASH>",
            "image_crops": {}
          },
          {
            "link": "<LINK>",
            "image_hash": "<IMAGE_HASH>",
            "image_crops": {}
          }
        ],
        "message": "<MESSAGE>",
        "multi_share_end_card": false,
        "multi_share_optimized": false,
        "picture": "<PICTURE>"
      }
    }
' \
  -F 'portrait_customizations={
    carousel_delivery_mode: "fixed_num_cards"
  }' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/<LATEST_API_VERSION>/act_<AD_ACCOUNT_ID>/adcreatives
```

**Note:** Instant Experience elements are **not supported** for the Carousel ad format.

