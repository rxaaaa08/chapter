<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/allow-product-video | Saved: 2026-09-19 -->

# Allow product video in Advantage+ catalog ads


When **Allow product video** is enabled, advertisers can deliver video assets from their catalog instead of product images in Advantage+ catalog ads when it's likely to improve their cost per result. Allow product video is on by default, but you can use `media_type_automation` to control whether videos surface in ads and set to `OPT_OUT` as needed.

## Before you begin

You will need:

* A product catalog with existing products
* A video for each product in a downloadable video URL format. A minimum of 20 products is recommended, but there are no required minimums. Each video size should not exceed 200MB. There are no length restrictions.

See the [specs and supported formats](https://developers.facebook.com/documentation/ads-commerce/commerce-platform/catalog/fields) for the `video` field.

See the [Advantage+ catalog ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads) to learn more about how they work.

## Add videos to your catalog

You can add videos to products in your catalog using a catalog feed file, manual upload via Commerce Manager, automatic import from your website or other sources, or the catalog batch API.

See the Business Help Center for:

* [Adding videos with a feed or manually in Commerce Manager](https://www.facebook.com/business/help/412185511855836)
* [Automatically adding videos from your website or other sources](http://facebook.com/business/help/376197728597548)

### Add videos with the catalog feed file

**Note:** For feeds, instead of the **video[0].url** column, you can create a column called `video` and add tags to the video. The `video` column can contain multiple video URLs per product and multiple tags per URL encoded in a JSON format. If you choose to use a tag column for the product set filter, you'll need to add this column to the feed file too.

**Example video column format:**

```json
[
  {"url": "http://www.jaspersmarket-example1.com/video-file.avi", "tag": ["<OPTIONAL_TAG_1>", "<OPTIONAL_TAG_2>"]},
  {"url": "http://www.jaspersmarket-example2.com/video-file.avi", "tag": ["<OPTIONAL_TAG_1>", "<OPTIONAL_TAG_2>"]}
]
```

For an XML feed, video URLs can be added using `video` tags like:

```xml
<video>
    <url>https://<URL_1></url>
    <tag>video_product_set1</tag>
    <tag>video_product_set2 </tag>
</video>
<video>
    <url>https://<URL_2></url>
    <tag>video_product_set1</tag>
</video>
```

### Query video data from the product item API

The `videos`, `videos_metadata`, and `video_fetch_status` fields are available on the catalog APIs to retrieve catalog product video details.

**Note:** The `video_fetch_status` may show as `NO_STATUS` until the video is used in an ad or another event triggers video processing.

```html
curl -i GET \
  "http://graph.facebook.com/v25.0/<PRODUCT_ITEM_ID>?fields=videos,videos_metadata,video_fetch_status"
```

For more details on video information, see the [Product Item](https://developers.facebook.com/docs/marketing-api/reference/product-item) details.

### Add videos with the catalog batch API

Updates to product items are supported using the [`/{product-catalog-id}/items_batch` endpoint](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/items_batch). You can make a `POST` API call with the `video` field, which is an array of URLs.

```json
curl \
  -d @body.json \
  -H "Content-Type: application/json"

> cat body.json
{
  "access_token": "<ACCESS_TOKEN>",
  "item_type": "PRODUCT_ITEM",
  "requests": [
    {
      "method": "CREATE",
      "data": {
        "id": "retailer-2",
        "availability": "in stock",
        "brand": "BrandName",
        "google_product_category": "t-shirts",
        "description": "product description",
        "image_link": "http://www.images.example.com/t-shirts/1.png",
        "title": "product name",
        "price": "10.00 USD",
        "shipping": [
          {
            "shipping_country": "US",
            "shipping_region": "CA",
            "shipping_service": "service",
            "shipping_price_value": "10",
            "shipping_price_currency": "USD"
          }
        ],
        "condition": "new",
        "link": "http://www.images.example.com/t-shirts/1.png",
        "item_group_id": "product-group-1",
        "video": [
          {"url": "http://www.jaspersmarket-example1.com/video-file.avi", "tag": ["<OPTIONAL_TAG_1>", "<OPTIONAL_TAG_2>"]},
          {"url": "http://www.jaspersmarket-example2.com/video-file.avi", "tag": ["<OPTIONAL_TAG_1>", "<OPTIONAL_TAG_2>"]}
        ]
      }
    },
    {
      "method": "UPDATE",
      "data": {
        "availability": "out of stock",
        "id": "retailer-3",
        "video": [
          {
            "url": "https://yourvideo.com/demo.mp4?q=1411"
          },
          {
            "url": "https://yourvideo.com/demo.mp4?q=1421"
          }
        ]
      }
    }
  ]
}
```

## Create ads with product video

When creating ads, there are three types of options that leverage video from the catalog:

* Carousel/Collection (recommended)
* Single image
* Prioritize video (only available for single video format)

**Note:** Enabling **Allow product video** with the API is similar to [enabling **Allow product video** in Ads Manager](https://www.facebook.com/business/help/1425663274646029).

### Ads with Allow product video enabled

When creating an ad creative object with the `act_<AD_ACCOUNT_ID>/adcreatives` endpoint:

* Advantage+ catalog ads deliver catalog product videos by default. Set `media_type_automation` to `OPT_OUT` to turn off catalog product videos from surfacing in ads.
* The `media_type_automation` key works with carousel, collection, and single image formats.

```html
curl -X POST \
-F 'name=Product video ad creative' \
-F 'object_story_spec={
    ...
  }' \
-F 'degrees_of_freedom_spec={
    "creative_features_spec": {
      "media_type_automation": {
        "enroll_status": "OPT_IN"
      }
    }
  }' \
-F 'product_set_id=<PRODUCT_SET_ID>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

Likewise, if creating an Advantage+ catalog ad object with the `act_<AD_ACCOUNT_ID>/ads` endpoint, the ad delivers available catalog product videos by default. Set the `media_type_automation` key to `OPT_OUT` to turn off catalog product videos from surfacing in ads.

```html
curl -X POST \
  -F 'adset_id=<ADSET_ID>' \
  -F 'creative={
    "name": "Product video ad creative",
    "object_story_spec": {
      ...
    },
    "degrees_of_freedom_spec": {
      "creative_features_spec": {
        "media_type_automation": {
          "enroll_status": "OPT_IN"
        }
      }
    },
    "product_set_id": "<PRODUCT_SET_ID>"
  }' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads
```

#### Allow product video (collection)

* **Allow product video** only replaces hero media. Product thumbnails in the pre-click experience and in Instant Experiences will always be images.
* If **Allow product video** is enabled and a product video is available, the hero media is replaced with a product video. A static hero image or video is not replaced by a product video. However, *the image slideshow experience* is replaced with a product video when one is available.

**Example creative spec for collection with the Allow product video feature enabled**

```html
curl -X POST \
-F 'name=Product video ad creative' \
-F 'object_story_spec={
      "template_data": {
          ...
          "format_option": "collection_video",
          "link": "https://fb.com/canvas_doc/<CANVAS_ID>",
          "message": "Your Collection Ad",
          ...
    }
  }' \
-F 'degrees_of_freedom_spec={
    "creative_features_spec": {
      "media_type_automation": {
        "enroll_status": "OPT_IN"
      }
    }
  }' \
-F 'product_set_id=<PRODUCT_SET_ID>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

#### Allow product video (Prioritize video)

In the `object_story_spec`, change `format_option` to `single_video`. This is only available for single image/video format.

```html
curl -X POST \
  -F 'adset_id=<ADSET_ID>' \
  -F 'creative={
    "name": "Product video ad creative",
    "object_story_spec": {
      "page_id": "<PAGE_ID>",
      "template_data": {
        ...
        "format_option": "single_video",
        ...
      }
    },
    "product_set_id": "<PRODUCT_SET_ID>"
    }' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads
```

#### Allow product video (Single image with allow product video enabled)

In the `object_story_spec`, the `format_option` of `single_image` will allow product video when opted into `media_type_automation`.

```html
curl -X POST \
  -F 'adset_id=<ADSET_ID>' \
  -F 'creative={
 "name": "Product video ad creative",
 "object_story_spec": {
   "page_id": "<PAGE_ID>",
   "template_data": {
     "format_option": "single_image"
   }
 },
 "degrees_of_freedom_spec": {
   "creative_features_spec": {
     "media_type_automation": {
       "enroll_status": "OPT_IN"
     }
   }
 }
},
    "product_set_id": "<PRODUCT_SET_ID>"
    }' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads
```

### Optional: Opt into or out of automatic video cropping

Use the `video_crop_style` field to control automatic video cropping. The available values are `AUTO` or `NONE`.

To opt out of automatic video cropping, set `video_crop_style` to `NONE`, or remove customizations from the `media_type_automation` settings.

```html
curl -X POST \
  -F 'adset_id=<ADSET_ID>' \
  -F 'creative={
    "name": "Product video ad creative",
    "object_story_spec": {
      ...
    },
    "degrees_of_freedom_spec": {
      "creative_features_spec": {
        "media_type_automation": {
          "customizations": {
            "video_crop_style": "NONE"
          },
          "enroll_status": "OPT_IN"
        }
      }
    },
  "product_set_id": "<PRODUCT_SET_ID>"
  }' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads
```

Auto-crop only applies to videos that don't meet the placement size requirements. Auto-crop primarily fits the video into the player's viewport.

If a video matches the aspect ratio for the ad placement, that video is returned. If you provide all aspect ratios for a product video, auto-crop does not apply. Otherwise, the ad selects a video and checks the auto-crop setting: `AUTO` returns the auto-cropped video and `NONE` returns the original video.

## Video engagement insights

Video engagement metrics from Ads Manager can also be queried on the API. Use the following chart for comparison.

| Ads Manager metric | Ads Insights API field |
| --- | --- |
| Impressions | `impressions` |
| 2-second continuous video plays | `video_continuous_2_sec_watched_actions:video_view` |
| Cost per 2-second continuous video play (BRL) | `cost_per_2_sec_continuous_video_view:video_view` |
| 3-second video plays | `actions:video_view` |
| Cost per 3-second video play (BRL) | `cost_per_action_type:video_view` |
| ThruPlays | `video_thruplay_watched_actions:video_view` |
| Cost per ThruPlay (BRL) | `cost_per_thruplay:video_view` |
| Reach | `reach` |
| Amount spent (BRL) | `spend` |
| Video plays at 25% | `video_p25_watched_actions:video_view` |
| Video plays at 50% | `video_p50_watched_actions:video_view` |
| Video plays at 75% | `video_p75_watched_actions:video_view` |
| Video plays at 95% | `video_p95_watched_actions:video_view` |
| Video plays at 100% | `video_p100_watched_actions:video_view` |
| Video plays | `video_play_actions:video_view` |

### Example Request

```html
curl GET \
  -d 'access_token=<ACCESS_TOKEN>' \
  -d 'fields=impressions,video_continuous_2_sec_watched_actions,actions,video_thruplay_watched_actions' \
https://graph.facebook.com/v25.0/<AD_ID>/insights
```

For more information, see the [Insights API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights) documentation.
