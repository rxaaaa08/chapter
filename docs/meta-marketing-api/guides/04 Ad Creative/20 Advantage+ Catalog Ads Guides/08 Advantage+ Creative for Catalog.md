<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-creative-for-catalog | Saved: 2026-09-19 -->

# Advantage+ Creative for Catalog



Within [Advantage+ catalog ads](https://developers.facebook.com/docs/marketing-api/dynamic-ads), you have the option to use Advantage+ creative for catalog. This feature displays different formats and ad creatives to different Accounts Center accounts, based on what they are most likely to respond to.

Currently, the available formats are [collection ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative/collection-ads) and [carousel ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/videoads). Both formats have different [creative variation options](#creative-variations). Meta makes format and creative choices based on what each Accounts Center account seeing your ad is most likely to respond to. Meta picks a format for each ad impression, whether to show a description, and which description to display, if shown.

## Before you start
To use Advantage+ creative for catalog, follow Steps 1 and 2 of the [Advantage+ catalog ads setup](https://developers.facebook.com/docs/marketing-api/dynamic-ads/get-started), then continue with [Step 3](#provide-creative) below.

* [Step 1: Create a Campaign](https://developers.facebook.com/docs/marketing-api/dynamic-product-ads/ads-management#campaign)
* [Step 2: Create an Ad Set](https://developers.facebook.com/docs/marketing-api/dynamic-product-ads/ads-management#adset)

## Step 3: Provide ad creative {#provide-creative}

Let us know you want to use Advantage+ creative for catalog when providing your campaign's creative by specifying `FORMAT_AUTOMATION` as an `optimization_type` inside your `asset_feed_spec`. Your API call must contain the following fields:

* [`product_set_id`](#product-set-id)
* [`template_data`](#template-data)
* [`asset_feed_spec`](#asset-feed-spec)

### `product_set_id` {#product-set-id}

Provide the ID of the product set to be used. A product set is a group of related items in a product catalog that you advertise in [Advantage+ catalog ads](https://developers.facebook.com/docs/marketing-api/dynamic-ads).

### `template_data` {#template-data}

You can add template parameters for your ad creative. These template parameters properly render at run-time based on data in your product feed. Inside [`object_story_spec`](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-object-story-spec), the `template_data` object allows you to build your template.

For Advantage+ creative for catalog, `template_data` has the following **required** fields:

| Name | Description |
| --- | --- |
| `multi_share_end_card` | Whether an advertiser wants to use the end card in the carousel ad format. Set to `true` if you are using the card; otherwise, set to `false`. |
| `name` | **Optional**.<br><br>One template tag to be used as the product's name. See [supported template tags](#template-tags). |
| `link` | Link for the offsite landing page. A user will be directed to this link if they click your call-to-action button. |
| `message` | **Optional**.<br><br>Copy for your ad. |
| `call_to_action` | A call to action for the user seeing your ad. Use any call to action type compatible with Advantage+ catalog ads. |

### `asset_feed_spec` {#asset-feed-spec}

An asset feed is a collection of different creative elements, such as image, titles, and bodies. The `asset_feed_spec` gives you the specifications for an asset feed.

For Advantage+ creative for catalog, `asset_feed_spec` can include:

| Name | Description |
| --- | --- |
| `optimization_type` | **Required.**<br><br>Type of optimization being used. Set to `FORMAT_AUTOMATION`. |
| `ad_formats` | **Required.**<br><br>List of ad formats. Set to `["CAROUSEL", "COLLECTION"]`. |
| `descriptions` | **Optional.**<br><br>Specify one description option. Meta uses this text for ads in the carousel format. You can use supported [template tags](#template-tags) or a free-form message. |
| `images` | **Optional**.<br><br>Use this field to set a custom image as cover media for a collection ad. [Example of an API call using this field](#custom-image). |
| `videos` | **Optional**.<br><br>Use this field to set a custom video as cover media for a collection ad. [Example of an API call using this field](#custom-video). |

### `creative_features_spec`

You can opt-in/opt-out optimizations using the `creative_features_spec` and using fields supported by Advantage+ creative for catalog.

For Advantage+ creative for catalog, `creative_features_spec` can include:

| Name | Description |
| --- | --- |
| `adapt_to_placement` | **Optional.** Default is opt-in.<br>Opt-in if you want to automatically fit images to placements based on what is predicted to work best.<br><br>By default, 4:5, and 9:16 placements are enabled. If you wish to control how the images are adjusted, you can use the `customizations` field to control the settings. See the `aspect_ratio_config` and `image_crop_style` fields in the [Ad Creative Feature Customizations](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-customizations) reference documentation for more details.<br><br>The `enroll_status` field can be set to `OPT_IN` or `OPT_OUT`.<br><br>**Note:** This feature is labeled **Image touch-ups** in Ads Manager. |
| `media_type_automation` | **Optional.**<br><br>Opt-in if you want videos from your catalog to be displayed (along with images) in supported placements. See [Allow product video](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/allow-product-video) for more information. |
| `dynamic_partner_content` | **Optional.**<br><br>Opt-in if you want your active partnership ads from other campaigns to appear in a collection with items from your catalog. Opting in does not affect the other ad campaigns. The `enroll_status` field can be set to `OPT_IN` or `OPT_OUT`.<br><br>**Note:** This feature is labeled **Dynamic partnership ads** in Ads Manager. |
| `add_text_overlay` | **Optional.**<br><br>This feature is labeled 'Add Dynamic Overlays' in Ads Manager. Opt-in if you want to add information from catalog items as visually-unique overlays.<br><br>The `enroll_status` field can be set to `OPT_IN` or `OPT_OUT`.<br><br>If you want to have manual control on how the overlay is rendered, see the [Ad Creative Link Data Image Layer Spec](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-link-data-image-layer-spec) reference documentation for more details. |

### Example: Default behavior {#default-video-example}

By default, the cover media for collection ads defaults to an Advantage catalog video, as shown in the following API call:

```bash
curl \
   -F 'name=Advantage+ creative for catalog test' \
   -F 'adset_id=<AD_SET_ID>' \
   -F 'creative={
     "name": "Creative for Advantage+ creative for catalog test",
     "product_set_id": "<PRODUCT_SET_ID>",
     "object_type": "SHARE",
     "object_story_spec": {
     "page_id": "<PAGE_ID>",
     "template_data": {
        "multi_share_end_card": "true",
        "name": "{{product.name}}",
        "link": "<OFFSITE_LANDING_PAGE>",
        "message": "<AD_COPY>",
        "call_to_action": {"type": "SHOP_NOW"},
        }},
      "asset_feed_spec":{
        "optimization_type":"FORMAT_AUTOMATION",
        "ad_formats": ["CAROUSEL", "COLLECTION"]},
        "descriptions": [{"text": "{{product.brand}}", "From {{product.current_price}}", ...]}
   }' \
   -F 'url_tags=<URL_TAGS>' \
   -F 'tracking_specs=[{"action.type":"offsite_conversion","fb_pixel":<PIXEL_ID>}]' \
   -F 'access_token=<ACCESS_TOKEN>' \
   https://graph.facebook.com/v<API_VERSION>/act_<AD_ACCOUNT>/ads
```

### Example: Custom image {#custom-image}

To set the cover media for collection ads to a custom image, use the following API call:

```bash
curl \
  -F 'name=Advantage+ creative for catalog test - custom image' \
  -F 'adset_id=<AD_SET_ID>' \
  -F 'creative={
  "name": "Creative For Advantage+ creative for catalog test - custom image",
  "product_set_id": "<PRODUCT_SET_ID>",
  "object_type": "SHARE",
  "object_story_spec": {
    "page_id": "<PAGE_ID>",
    "template_data": {
      "multi_share_end_card": "true",
      "name": "{{product.name}}",
      "link": "<OFFSITE_LANDING_PAGE>",
      "message": "<AD_COPY>",
      "call_to_action": {"type": "SHOP_NOW"},
      }
  },
  "asset_feed_spec":{
    "optimization_type":"FORMAT_AUTOMATION",
    "ad_formats": ["CAROUSEL", "COLLECTION"],
    "images": [{"hash": "<customized_image_hash>"}],
    "descriptions": [{"text": "{{product.description}}", "From {{product.current_price}}", ...]
    }
   }' \
   -F 'url_tags=<URL_TAGS>' \
   -F 'tracking_specs=[{"action.type":"offsite_conversion","fb_pixel":<PIXEL_ID>}]' \
   -F 'access_token=<ACCESS_TOKEN>' \
   https://graph.facebook.com/v<API_VERSION>/act_<AD_ACCOUNT>/ads
```

### Example: Custom video {#custom-video}

To set the cover media for collection ads to a custom video, use the following API call:

```bash
curl \
  -F 'name=Advantage+ creative for catalog test - custom video' \
  -F 'adset_id=<AD_SET_ID>' \
  -F 'creative={
  "name": "Creative For Advantage+ creative for catalog test - custom video",
  "product_set_id": "<PRODUCT_SET_ID>",
  "object_type": "SHARE",
  "object_story_spec": {
    "page_id": "<PAGE_ID>",
    "template_data": {
      "multi_share_end_card": "true",
      "link": "<LINK>",
      "message": "<AD_COPY>",
      "call_to_action": {"type": "SHOP_NOW"},
       }
   },
  "asset_feed_spec":{
    "optimization_type":"FORMAT_AUTOMATION",
    "ad_formats": ["CAROUSEL", "COLLECTION"],
    "videos": [{"video_id": "<VIDEO_ID>"}]},
    "descriptions": [{"text": "{{product.description}}", "From {{product.current_price}}", ...]}
   }' \
   -F 'tracking_specs=[{"action.type":"offsite_conversion","fb_pixel":<PIXEL_ID>}]' \
   -F 'access_token=<ACCESS_TOKEN>' \
   https://graph.facebook.com/v<API_VERSION>/act_<AD_ACCOUNT>/ads
```

### Example: Opt-in for adapt-to-placement optimization {#adapt-to-placement-optimization}

When you opt in to adapt-to-placement optimization, the 9:16 and 4:5 images in your catalog will be used to display full screen images in supported placements.
If no native image is found, the image may be cropped, padded, or both to fit the aspect ratio of the placement.

For Instagram Stories, you can optionally remove the showcase card displaying 4 small images of products to have the 9:16 image of the first product displayed using `NONE` instead of `AUTO` for the `showcase_card_display` customization parameter value.

```bash
curl \
  -F 'name=Advantage+ creative for catalog test - active 9:16' \
  -F 'adset_id=<AD_SET_ID>' \
  -F 'creative={
  "name": "Creative For Advantage+ creative for catalog test - active 9:16",
  "product_set_id": "<PRODUCT_SET_ID>",
  "object_type": "SHARE",
  "object_story_spec": {
    "page_id": "<PAGE_ID>",
    "template_data": {
      "multi_share_end_card": "true",
      "link": "<LINK>",
      "message": "<AD_COPY>",
      "call_to_action": {"type": "SHOP_NOW"},
       }
   },
  "asset_feed_spec":{
    "optimization_type":"FORMAT_AUTOMATION",
    "ad_formats": ["CAROUSEL", "COLLECTION"],
    "descriptions": [{"text": "{{product.description}}", "From {{product.current_price}}", ...}]
  },
  "degrees_of_freedom_spec" : {
    "creative_features_spec": {
      "adapt_to_placement": {
        "enroll_status": "OPT_IN",
        "customizations": {
          "image_crop_style": "AUTO",
          "aspect_ratio_config": {
            "ar_4_5": {
              "enroll_status": "OPT_IN"
            },
            "ar_9_16": {
              "enroll_status": "OPT_IN"
            }
          },
          "showcase_card_display": "AUTO"
        }
      }
    }
  }
   }' \
   -F 'tracking_specs=[{"action.type":"offsite_conversion","fb_pixel":<PIXEL_ID>}]' \
   -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT>/ads
```

### Example: Opt-in for media-type-automation optimization {#media-type-automation-optimization}

When you opt in to media-type-automation optimization, the videos in your catalog will be used in your ad on supported placements. See [Allow product video](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/allow-product-video) for more information.

```bash
curl \
  -F 'name=Advantage+ creative for catalog test - product video' \
  -F 'adset_id=<AD_SET_ID>' \
  -F 'creative={
  "name": "Creative For Advantage+ creative for catalog test - product video",
  "product_set_id": "<PRODUCT_SET_ID>",
  "object_type": "SHARE",
  "object_story_spec": {
    "page_id": "<PAGE_ID>",
    "template_data": {
      "multi_share_end_card": "true",
      "link": "<LINK>",
      "message": "<AD_COPY>",
      "call_to_action": {"type": "SHOP_NOW"},
       }
   },
  "asset_feed_spec":{
    "optimization_type":"FORMAT_AUTOMATION",
    "ad_formats": ["CAROUSEL", "COLLECTION"],
    "descriptions": [{"text": "{{product.description}}", "From {{product.current_price}}", ...]
  },
  "degrees_of_freedom_spec" : {
    "creative_features_spec": {
      "media_type_automation": {
        "enroll_status": "OPT_IN"
      }
    }
  }
   }' \
   -F 'tracking_specs=[{"action.type":"offsite_conversion","fb_pixel":<PIXEL_ID>}]' \
   -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT>/ads
```

## Creative variations {#creative-variations}

### Summary of available options

| Format | Creative Variations |
| --- | --- |
| [Collection Ads](#collection-ads) | Cover media can be:<br><br>* Advantage catalog video *(default)*<br>* Custom image<br>* Custom video<br><br>You must pick one option. |
| [Carousel Ads](#carousel-ads) | Description can be:<br><br>* Product information coming from catalog<br>* Free-form custom message<br><br>Both can be used at the same time. |

### Collection ads

The collection format features three products under a hero image or video that opens into a full-screen Instant Experience. The hero image or video is also called cover media. The Advantage+ creative for catalog API calls are different, depending on your choice for cover media.

The standard behavior is to add an Advantage catalog video as your ad's cover media. In this case, Meta automatically generates a personalized Advantage catalog video for each user that sees your ad. The video highlights products from the catalog that are most relevant to the user. Alternatively, you can provide your own custom image or video for the cover media position.

See [Help Center: About Collection Ads](https://www.facebook.com/business/help/11289146072381) for more information.

### Carousel ads

The carousel format lets you show two or more images and videos, descriptions, and links or calls to action in a single ad. For Advantage+ creative for catalog, you can select possible description variations.

Specify your description variations in the API call with the `descriptions` parameter under `asset_feed_spec`. Add all your description options under `descriptions` and list the first one under `description`.

Your description options can contain catalog information or a new free-form short message, such as "Free Shipping".

#### Template tags {#template-tags}
To use information available on your catalog, you can use the following template tags:

**Products**

* `{{product.price}}`
* `{{product.current_price}}`
* `{{product.description}}`
* `{{product.short_description}}`
* `{{product.brand}}`
* `{{product.name}}`

**Hotels**

* `{{hotel.base_price}}`
* `{{hotel.sale_price}}`
* `{{hotel.total_price}}`
* `{{hotel.brand}}`
* `{{hotel.name}}`
* `{{hotel.description}}`

**Flights**

* `{{flight.price}}`
* `{{flight.description}}`

**Destinations**

* `{{destination.price}}`
* `{{destination.name}}`
* `{{destination.description}}`

**Home Listings**

* `{{home_listing.price}}`
* `{{home_listing.name}}`
* `{{home_listing.description}}`

**Vehicles**

* `{{vehicle.price}}`
* `{{vehicle.sale_price}}`
* `{{vehicle.description}}`

**Vehicle_Offers**

* `{{vehicle_offer.amount}}`
* `{{vehicle_offer.price}}`
* `{{vehicle_offer.description}}`

**Automotive Models**

* `{{automotive_model.price}}`
* `{{automotive_model.description}}`

The following tags cannot be used at the same time:

* `{{product.price}}` and `{{product.current_price}}`
* `{{product.description}}` and `{{product.short_description}}`
* `{{hotel.base_price}}` and `{{hotel.sale_price}}` and `{{hotel.total_price}}`
* `{{vehicle.price}}` and `{{vehicle.sale_price}}`
* `{{vehicle_offer.amount}}` and `{{vehicle_offer.price}}`

#### Limitations {#limitations}
Be mindful of the following:

* A description can have only one template tag.
* You can list up to three description options.
* Only one free-form description is supported. The free-form description counts as one of the three allowed descriptions. If you use one free-form, you can add another two with template tags.
* The same tag cannot be used in different description options. Once you use that tag, look for a different one to use on a different description.

See [Help Center: About Carousel Ads](https://www.facebook.com/business/help/773889936018967) for more information.
