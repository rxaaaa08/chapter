<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/get-started | Saved: 2026-09-19 -->

# Get Started with Advantage+ Catalog Ads



Advantage+ catalog ads enables you to create personalized ads that target to the right audiences based on a set of products.

**Note:** Advertisers running ads concerning housing, employment, credit, or issues, elections, and politics have different sets of restrictions. See [**Special Ad Categories**](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/special-ad-category) for more information.

## Before you start

To create an Advantage+ catalog ads campaign, you need:  

* A [Facebook Page](https://www.facebook.com/pages/create) representing the advertiser, and optionally, an [Instagram Account](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/instagramads) if running this campaign on Instagram.
* An [ad account](https://www.facebook.com/ads/manager/accounts) with registered payment information.
* A [catalog](https://developers.facebook.com/documentation/ads-commerce/catalog), such as a product catalog available in your Meta Business Suite account.

Optionally, you can set up a [dynamic product audience](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/dynamic-product-audiences), but you are not required to involve product set inclusions or exclusions in your targeting settings.

## Step 1: Create an Ad Campaign

See the [Ad Campaign](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group) documentation to learn how to create an ad campaign.

At this level, you must set your advertising goal through the `objective` field. For Advantage+ catalog ads, supported objectives are `PRODUCT_CATALOG_SALES`, `CONVERSIONS`, `LINK_CLICKS`, or `APP_INSTALLS`. If the `objective` you provide is `CONVERSIONS`, `LINK_CLICKS`, or `APP_INSTALLS`, then the `promoted_object` field is not required.

```html
curl \
  -F 'name=Product Catalog Sales Campaign' \
  -F 'objective=PRODUCT_CATALOG_SALES' \
  -F 'promoted_object={"product_catalog_id":"<PRODUCT_CATALOG_ID>"}' \
  -F 'status=PAUSED' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/campaigns
```

## Step 2: Create an Ad Set {#adset}

For Advantage+ catalog ads, you must specify the `product_set_id` in `promoted_object` for your ad set level to promote products from that product set.

In addition, you can also define your own conversion event for that product set by specifying `custom_event_type` in `promoted_object` when the `optimization_goal` is `OFFSITE_CONVERSIONS`. This targets your ads to people who performed that event in your app or site.

For example, if you set this to `ADD_TO_CART`, it means an Add to Cart event is the conversion event. By default `custom_event_type` is set to `PURCHASE`. Learn more about standard events and values for `custom_event_type` at [Meta Pixel Conversion Tracking](https://developers.facebook.com/docs/meta-pixel/implementation/conversion-tracking).

If you want to optimize for offsite conversions, including conversions from both app events and Facebook Pixel, and to be billed on impressions:

* Set the `optimization_goal` to `OFFSITE_CONVERSIONS`
* Set the `billing_event` to `IMPRESSIONS`

More details on valid `optimization_goal` and `billing_event` combinations can be found in [Optimization Goal and Billing Events](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview/billing-events#opt_bids).

Example of creating an ad set that is billed on `IMPRESSIONS` and optimizes for `OFFSITE_CONVERSIONS`:

```html
curl \
  -F 'name=Product Catalog Sales Adset' \
  -F 'bid_amount=3000' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'optimization_goal=OFFSITE_CONVERSIONS' \
  -F 'daily_budget=15000' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'targeting={ "geo_locations": {"countries":["US"]},
    "dynamic_audience_ids": ["<DYNAMIC_AUDIENCE_ID>"]
  }' \
  -F 'promoted_object={"product_set_id":"<PRODUCT_SET_ID>"}' \
  -F 'status=PAUSED' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

The `DYNAMIC_AUDIENCE_ID` refers to a [product audience](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/dynamic-product-audiences). Optionally, you can omit `dynamic_audience_ids` from the call.

For e-commerce use cases, you can omit `dynamic_audience_ids` from the call and instead send the behavioral targeting information as part of `product_audience_specs` or `excluded_product_audience_specs` parameters. These specs are defined by the same parameters you use to create a [product audience](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/dynamic-product-audiences).

#### Parameters
| Name | Description |
| --- | --- |
| `product_set_id`<br><br>numeric string | **Required.**  <br>The product set to target with this audience. |
| `inclusions`<br><br>JSON object | **Required.**  <br>A set of events to target. At least one inclusion is required. Each inclusion should have exactly one `event`. |
| `inclusions.retention_seconds`<br><br>int | **Required.**  <br>The number of seconds to keep the Accounts Center account in the audience. |
| `inclusions.rule`<br><br>object[] | **Required.**  <br>[Website Custom Audience Rule](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/website-custom-audiences#audiencerules) referencing one `event`. |
| `exclusions`<br><br>JSON object | **Optional.**  <br>A set of events that remove an Accounts Center account from targeting. |
| `exclusions.retention_seconds`<br><br>int | **Required, if exclusion is specified.**  <br>The number seconds to retain the exclusion. |
| `exclusions.rule`<br><br>object[] | **Required, if exclusion is specified.**  <br>[Website Custom Audience Rule](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/website-custom-audiences#audiencerules) referencing one `event`. |

**Warning:** Each rule must include an `event` with the `eq` operator either as a top-level rule or as part of a top-level `and` rule.

### Retargeting

In this example, you target people that viewed products in the last 3-5 days, but did not make a purchase. The ads placements are on mobile feed and Audience Network. To create this audience:

```html
curl \
  -F 'name=Product Catalog Sales Adset' \
  -F 'bid_amount=3000' \
  -F 'billing_event=LINK_CLICKS' \
  -F 'optimization_goal=LINK_CLICKS' \
  -F 'daily_budget=15000' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'targeting={
    "publisher_platforms": ["facebook","audience_network"],
    "device_platforms": ["mobile"],
    "geo_locations": {"countries":["US"]},
    "product_audience_specs": [
      {
        "product_set_id": "<PRODUCT_SET_ID>",
        "inclusions": [{"retention_seconds":432000,"rule":{"event":{"eq":"ViewContent"}}}],
        "exclusions": [{"retention_seconds":432000,"rule":{"event":{"eq":"Purchase"}}}]
      }
    ],
    "excluded_product_audience_specs": [
      {
        "product_set_id": "<PRODUCT_SET_ID>",
        "inclusions": [{"retention_seconds":259200,"rule":{"event":{"eq":"ViewContent"}}}]
      }
    ]
  }' \
  -F 'promoted_object={"product_set_id":<PRODUCT_SET_ID>"}' \
  -F 'status=PAUSED' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

### Cross-sell or upsell {#adset-extended-retargeting}

Example for advertising products that the user has not looked at:

```html
curl \
-F 'name=Case 1 Adset' \
-F 'bid_amount=3000' \
-F 'billing_event=IMPRESSIONS' \
-F 'status=ACTIVE' \
-F 'daily_budget=15000' \
-F 'campaign_id=<CAMPAIGN_ID>' \
-F 'targeting= { \
            "geo_locations": { \
            "countries":["US"], \
             }, \
            "interests":[ \
                {"id":6003397425735,"name":"Tennis"}, \
            ], \
        }' \
-F 'promoted_object={"product_set_id":<PRODUCT_SET_ID>}' \
-F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/<API_VERSION>/act_<ACCOUNT_ID>/adsets
```

To cross-sell between product sets:

* Provide the product audience with event rules related to product set A.
* Show products from product set B in the ad by setting the `product_set_id` to product set B at the ad creative level.

For example, a business wants to increase the sale of handbags in PRODUCT_SET_1 by targeting an ad to existing users who have shown interest in shoes that belong in PRODUCT_SET_2. Set the `product_set_id` in `product_audience_specs` to PRODUCT_SET_2's ID or shoes and the `product_set_id` in `promoted_object` to PRODUCT_SET_1's ID or handbags.

```html
curl \
  -F 'name=My cross sell ad set' \
  -F 'bid_amount=3000' \
  -F 'billing_event=LINK_CLICKS' \
  -F 'optimization_goal=LINK_CLICKS' \
  -F 'daily_budget=15000' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'targeting={
    "geo_locations": {"countries":["US"]},
    "product_audience_specs": [
      {
        "product_set_id": "<PRODUCT_SET_2_ID>",
        "inclusions": [{"retention_seconds":432000,"rule":{"event":{"eq":"ViewContent"}}}],
        "exclusions": [{"retention_seconds":432000,"rule":{"event":{"eq":"Purchase"}}}]
      }
    ],
    "excluded_product_audience_specs": [
      {
        "product_set_id": "<PRODUCT_SET_2_ID>",
        "inclusions": [{"retention_seconds":259200,"rule":{"event":{"eq":"ViewContent"}}}]
      }
    ]
  }' \
  -F 'promoted_object={"product_set_id":"<PRODUCT_SET_1_ID>"}' \
  -F 'status=PAUSED' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

And set `product_set_id` in the creative as PRODUCT_SET_1's ID.

```html
curl \
-F 'name=Advantage+ Catalog Ads Template Creative Sample' \
-F 'object_story_spec={
  "page_id": "<PAGE_ID>",
  "template_data": {
    "description": "Description {{product.description}}",
    "link": "<LINK>",
    "message": "Test {{product.name | titleize}}",
    "name": "Headline {{product.price}}"
  }
}' \
-F 'product_set_id=<PRODUCT_SET_ID>' \
-F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

### Broad audience targeting {#adset-broad-audiences}

In addition to retargeting and cross-selling to existing customers, Advantage+ catalog ads may be used to target broad audiences, utilizing age, gender, and other demographic targeting, with relevant products from your product catalog. By utilizing broadly targeted audiences combined with bidding for offsite conversions, Advantage+ catalog ads let you reach audiences beyond your retargeting and cross-selling segments.

To target broad audiences:

* Create an audience using basic demographic targeting such as women in the US over 18.
* Include `customOptimize` for `OFFSITE_CONVERSIONS` with stronger intent signals such as `Purchase` or `InitiateCheckout`.

In this example, you create an adset targeted at women age 30-65 in the US, excluding customers who have purchased in the past 10 days. You bid $8, using `OFFSITE_CONVERSIONS` for `PURCHASE` events.

```html
curl \
  -F 'name=Broad Audience Targeting' \
  -F 'bid_amount=800' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'daily_budget=15000' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'targeting={
    "age_max": 65,
    "age_min": 30,
    "geo_locations": {"countries":["US"]},
    "genders": [2],
    "excluded_product_audience_specs": [
      {
        "product_set_id": "<PRODUCT_SET_ID>",
        "inclusions": [{"retention_seconds":864000,"rule":{"event":{"eq":"Purchase"}}}]
      }
    ]
  }' \
  -F 'promoted_object={"product_set_id":"<PRODUCT_SET_ID>","custom_event_type":"PURCHASE"}' \
  -F 'optimization_goal=OFFSITE_CONVERSIONS' \
  -F 'status=PAUSED' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

### Categories for Advantage+ Catalog Ads

**Note:** Advertisers running ads concerning housing, employment, credit, or issues, elections, and politics have different sets of restrictions. See [**Special Ad Categories**](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/special-ad-category) for more information.

Categories for Advantage+ catalog ads introduces two new creative options for the Advantage+ catalog ads platform, both of which can be used to personalize creative for shoppers who are earlier in their decision journey.  With this feature, you can create what is effectively a second, smaller creative catalog of images that represent each category (in addition to the catalog you already have of product imagery), and we will match product categories to people in your ads the same way we match products to people.  

Categories for Advantage+ catalog ads can be used with any targeting option in the traffic, conversion, or catalog sales objective.  If you don't have a high-quality image representative of each category or brand, Facebook can auto-generate a 2x2 collage of top products for each group of products.  

When mapping this new imagery to existing product catalogs, you can use one of three columns in your feed to group items: brand, product type, and Google product category.

In the example catalog below, the **Product Type** column has five unique values. The advertiser can provide up to five collages or lifestyle images — one for each unique value in `product_type`.  The product type is the category's categorization criteria, which is the catalog field name used to define the categories. The catalog field's value is the category's criteria value.

A category can be uniquely identified by:

* Product catalog ID
* Categorization criteria (brand, product type, or Google product category)
* Criteria value (pulled from the catalog)

| Retailer | ID Name | Price | Product Type | Brand | Category |
| --- | --- | --- | --- | --- | --- |
| `prod_1` | T-Shirt | USD 25 | Clothes | Brand A | Category A |
| `prod_2` | FB Hoodie | USD 30 | Clothes | Brand B | Category A |
| `prod_3` | iPhone 6 | USD 800 | Phone | Brand C | Category B |
| `prod_4` | Samsung Galaxy S5 | USD 750 | Phone | Brand C | Category B |
| `prod_5` | Rice cooker | USD 120 | Appliance | Brand C | Category C |
| `prod_6` | Parker Sofa | USD 500 | Appliance | Brand D | Category D |
| `prod_7` | Sunscreen | USD 14 | Personal Care | Brand E | Category E |

You can associate each category (for example, each group of products as defined by unique values in one of the columns specified above) with assets:

* **Name** — A user-facing short name of the category (up to 40 characters).
* **Description** — A user-facing description of the category (up to 20 characters).
* **`destination_uri`** — The URL of the landing page when a user clicks the category.
* **`image_url`** — *Optional.* The URL of a life style image representing the category. If no `image_url` is provided, we will autogenerate a collage of top products from that category.

During ads delivery time, we dynamically match each Accounts Center account with the categories they are most likely to respond to based using the same machine learning models that power Advantage+ catalog ads today.  

#### Categories management API

Categories information is stored at the catalog level, meaning that different ads promoting the categories from the same catalog would share assets, the same as ads promoting products would share assets defined in catalogs. We do support different creative options to customize category ads.

Below are the APIs to get and update categories information.

##### Reading

**Request**

```html
curl -G \
  -d 'fields=["criteria_value","name","description","destination_uri","image_url"]' \
  -d 'categorization_criteria=product_type' \
  -d 'filter={"price_amount":{"gt":1500}}' \ # optional
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/<PRODUCT_CATALOG_ID>/categories
```

We query for all products (the optional filter is supported) and find the top 1,000 categories (ordered by number of products).

**Sample response**

```html
{
  "data": [
    {
      "criteria_value": "clothes",
      "name": "Awesome clothes",
      "description": "Check out these awesome clothes!",
      "destination_uri": "http://www.example.com/clothes",
      "image_url": "http://www.example.com/clothes.jpg"
    },
    ...
    {
      "criteria_value": "shoes",
      "name": "Awesome shoes",
      "description": "Check out these awesome shoes!",
      "destination_uri": "http://www.example.com/shoes",
      "image_url": "http://www.example.com/shoes.jpg"
    }
  ]
}
```

##### Updating

You can specify multiple categories information in data. For each category, `categorization_criteria` and `criteria_value` are required, while the `name`, `description`, `destination_uri`, and `image_url` fields are optional. When updating the information of a category for the first time, you must specify the `destination_uri`. If you want to skip delivery of a category, simply set its `destination_uri` to be empty.

**Note:** Deleting a category is not supported at this time.

**Request**

```html
curl \
  -F 'data=[{"categorization_criteria":"product_type","criteria_value":"product_type_value","name":"Name","description":"Description","destination_uri":"http://www.example.com/","image_url":"<IMAGE_URL>"}]' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/<PRODUCT_CATALOG_ID>/categories
```

### Ads creation

Categories for Advantage+ catalog ads ad creation is similar to ad creation for other Advantage+ catalog ads, but the creative selection is slightly different. You are still promoting a product set with dynamic category ads; the difference is that we're showing category creatives instead.

```html
curl \
  -F "name=Dynamic Category Ad Creative" \
  -F 'object_story_spec={"page_id": "<PAGE_ID>", "template_data": {"description": "{{category.description}}", "link": "https://www.example.com/", "message": "<MESSAGE>", "name": "{{category.name}}"}}' \
  -F 'product_set_id=<PRODUCT_SET_ID>' \
  -F 'categorization_criteria=brand' \
  -F 'category_media_source=MIXED' \ # optional
  -F access_token=<ACCESS_TOKEN> \
  https://graph.facebook.com/v25.0/act_<ACCOUNT_ID>/adcreatives
```

This creates a category ad creative rendered in a carousel format:

#### Category tokens

Supported category tokens:

* `category.name` — The category name within the promoted product set.
* `category.description` — The category description within the promoted product set.
* `category.destination_uri` — The category destination URI.
* `category.min_price` — The minimum price for this category within the promoted product set. This information is pulled from the catalog.

**Parameters**

| Name | Description |
| --- | --- |
| `categorization_criteria` | Specifies which category type to use.  <br>**Values:**<br><br>* `brand`<br>* `product_type`<br>* `google_product_category` |
| `category_media_source` | Specifies how to render the category carousel card.  <br>**Values:**<br><br>* `mixed` (default)  <br>Uses the category's image if exists; otherwise, falls back to `products_collage`.<br>* `category`  <br>Uses the category's image. Skip this category if this category doesn't have a image.<br>* `products_collage`  <br>Generates a 2x2 collage of product images from this category.<br><br>* `products_slideshow`  <br>Renders a slideshow of products from this category. |

During the category ad creative creation, we search for possible renderable categories.

**Note**: We filter out categories without a name or destination URL. We also filter out categories without images if `category_media_source = category`.

#### Common errors

Creative creation fails if there are less than four eligible categories (for example, to use categories for Advantage+ catalog ads as your creative for a given campaign, there must be **at least four unique values** in a given column from your data feed file).  

## Step 3: Provide an Ad Creative

Advantage+ catalog ads templates use [inline page posts](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative#inline_post) for creating Advantage+ catalog template creatives.

### Build a template creative

Creating an Advantage+ catalog ads template creative is similar to creating other [ad creatives](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative). The difference is that you can add [template parameters](#use-data-feed-file-data-in-your-template) that properly render at runtime based on data in your data feed file.  

Build the template based on the `template_data` object of the `object_story_spec` and use the following fields:

| Name | Description | Accepts Template Parameters |
| --- | --- | --- |
| `call_to_action`<br><br>object | [Call to Action object](https://developers.facebook.com/docs/reference/ads-api/page-posts-with-cta).  <br>The `value` field should be omitted. | No |
| `message`<br><br>string | Message for your ad, visible on Instagram. | Yes |
| `link`<br><br>string | Link to your website, used to generate the caption of the ad.  <br>This field will always be replaced with the `link` field from your data feed file, except for the end card of [carousel ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/videoads#spec), which will link to this.  <br>**Note:** This cannot be a Facebook URL. | No |
| `name`<br><br>string | Name or title for your ad, visible on Instagram. | Yes |
| `description`<br><br>string | Description for your ad, not visible on Instagram. | Yes |
| `force_single_link`<br><br>boolean | **Optional.**  <br>Force to render a single link format.  <br>When set to `true`, the creative will be a link page post ad showing a single product. When left out, the resulting ad will be a carousel ad. Facebook will choose the number of cards to optimize the performance of your ad. | No |
| `show_multiple_images`<br><br>boolean | Show multiple images in the carousel for a single product.  <br>**Note:** `force_single_link` and `multi_share_end_card` must be set to `true` and `false` respectively. | No |
| `multi_share_end_card`<br><br>boolean | **Optional.**  <br>Default is `true`.  <br>Use this in carousel format. If set to `false`, it will remove the end card that displays the page icon. | No |
| `child_attachments`<br><br>array | Enables you to provide one or more static cards in Advantage+ catalog ads for the carousel format.  <br>The static cards appear either before or after all Advantage+ catalog ads. Provide the `static_card` field set to `true` for each  static card under `child_attachments`. | No |
| `image_layer_specs`<br>[AdCreativeLinkDataImageLayerSpecs](https://developers.facebook.com/docs/graph-api/reference/ad-creative-link-data-image-layer-spec) | Specifies how to transform the images when they are delivered to users in the ad.  <br>One [`AdCreativeLinkDataImageOverlaySpec`](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-link-data-image-overlay-spec) is needed for each layer to define how to render the layer. The layers will be rendered in the order they appear in the list.  <br>**Note**: [`AdCreativeLinkDataImageLayerSpec`](https://developers.facebook.com/docs/graph-api/reference/ad-creative-link-data-image-layer-spec) is available on a limited basis. Please contact your Facebook representative for more details. | No |
| `image_overlay_spec`<br>[AdCreativeLinkDataImageOverlaySpec](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-link-data-image-overlay-spec) | Specifies how to render overlays on an image for a dynamic item. | No |
| `preferred_image_tags`<br><br>array | Selects which image to use, if you have added tags to your images.  <br>For any item, we choose the image as follows: we get the first tag in `preferred_image_tags` that has at least one image for the item, then render the first image for that tag. If no tags correspond to an image, we serve the first image. | No |
| `preferred_video_tags` | Selects which video to use, if you have added tags to your videos.  <br>For any item, we choose the video as follows: we get the first tag in `preferred_video_tags` that has at least one video for the item, then render the most performant video for that tag and placement. If no tags correspond to a video, we serve the first video. If there are no videos, we fall back to image rendering.  <br>**Note:** `preferred_video_tags` will only be applied if your ad is opted into [allow product video](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/allow-product-video). | No |

### Examples

#### Create a carousel Advantage+ catalog ads template

```html
curl \
  -F 'name=Advantage+ Catalog Ads Template Creative Sample' \
  -F 'object_story_spec={
    "page_id": "<PAGE_ID>",
    "template_data": {
      "description": "Description {{product.description}}",
      "link": "<LINK>",
      "message": "Test {{product.name | titleize}}",
      "name": "Headline {{product.price}}"
    }
  }' \
  -F 'product_set_id=<PRODUCT_SET_ID>' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

#### Use a Advantage+ catalog ads template with image overlays

```html
curl \
  -F 'name=Advantage+ Catalog Ads Template Creative Sample' \
  -F 'object_story_spec={
    "page_id": "<PAGE_ID>",
    "template_data": {
      "call_to_action": {"type":"SHOP_NOW"},
      "description": "Description {{product.description}}",
      "link": "<LINK>",
      "message": "Test {{product.name | titleize}}",
      "name": "Headline {{product.price}}",
      "image_layer_specs": [
        {
          "layer_type": "image",
          "image_source": "catalog"
        },
        {
          "layer_type": "frame_overlay",
          "blending_mode": "lighten",
          "frame_image_hash": "<HASH>",
          "frame_source": "custom",
          "opacity": 100,
          "overlay_position": "center",
          "scale": 100
        },
        {
          "layer_type": "text_overlay",
          "content": {
            "type": "price",
            "auto_show_enroll_status": "OPT_IN"
          },
          "opacity": 100,
          "overlay_position": "top_left",
          "overlay_shape": "rectangle",
          "shape_color": "DF0005",
          "text_color": "FFFFFF",
          "text_font": "open_sans_bold"
        }
      ]
    }
  }' \
  -F 'product_set_id=<PRODUCT_SET_ID>' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/<API_VERSION>/act_<AD_ACCOUNT_ID>/adcreatives
```

#### Create a single product Advantage+ catalog ads template with a call to action

```html
curl \
  -F 'name=Advantage+ Catalog Ads Template Creative Sample' \
  -F 'object_story_spec={
    "page_id": "<PAGE_ID>",
    "template_data": {
      "call_to_action": {"type":"SHOP_NOW"},
      "description": "Description {{product.description}}",
      "force_single_link": true,
      "link": "<LINK>",
      "message": "Test {{product.name | titleize}}",
      "name": "Headline {{product.price}}"
    }
  }' \
  -F 'product_set_id=<PRODUCT_SET_ID>' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

#### Create a carousel Advantage+ catalog ads template for a single product where each image comes from additional images array in the catalog

```html
curl -X POST \
     -F 'name=Advantage+ Catalog Ads Template Creative Sample' \
     -F 'object_story_spec={
           "page_id": <PAGE_ID>,
           "template_data": {
             "message": "Test {{product.name | titleize}}",
             "link": "<YOUR_LINK_URL>",
             "name": "Headline {{product.price}}",
             "description": "Description {{product.description}}",
             "multi_share_end_card": false,
             "force_single_link": true,
             "show_multiple_images": true,
           }
         }' \
     -F 'product_set_id=<PRODUCT_SET_ID>' \
     -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

#### Create a carousel Advantage+ catalog ads template with the first card as a coupon static card

```html
curl \
  -F 'name=Advantage+ Catalog Ads Template Creative Sample' \
  -F 'object_story_spec={
    "page_id": "<PAGE_ID>",
    "template_data": {
      "child_attachments": [
        {
          "call_to_action": {"type":"SHOP_NOW"},
          "description": "30% off",
          "image_hash": "<IMAGE_HASH>",
          "link": "https:\/\/www.link.com\/coupon",
          "name": "Coupon Static Card",
          "static_card": true
        },
        {
          "call_to_action": {"type":"SHOP_NOW"},
          "description": "Description {{product.description}}",
          "name": "Headline {{product.price}}"
        }
      ],
      "link": "<LINK>",
      "message": "Test Message"
    }
  }' \
  -F 'product_set_id=<PRODUCT_SET_ID>' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

#### Create a carousel slideshow from an Advantage+ catalog ads template

We render each dynamic card in the carousel as a slideshow. Each slideshow displays images from one dynamic item if the item has multiple images. If the dynamic item only has one image, we render a card as a static image.

```html
curl \
  -F 'name=Advantage+ Catalog Ads Template Creative Sample' \
  -F 'object_story_spec={
    "page_id": "PAGE_ID",
    "template_data": {
      "call_to_action": {"type":"SHOP_NOW"},
      "description": "Description {{product.description}}",
      "link": "LINK",
      "message": "Test {{product.name | titleize}}",
      "name": "Headline {{product.price}}",
      "format_option": "carousel_slideshows"
    }
  }' \
  -F 'product_set_id=PRODUCT_SET_ID' \
  -F 'access_token=ACCESS_TOKEN' \
  https://graph.facebook.com/v25.0/AD_ACCOUNT_ID/adcreatives
```

The response to these calls is the ID of a new Advantage+ catalog ads template creative.

```html
{"id":"creative_id"}
```

#### Upload a catalog

When uploading a catalog, you can specify arbitrary alphanumeric string tags for each image in each property.

```html
<listing>
 <hotel_id>hotel_1</hotel_id>
 ...
 <image>
 <url>https://media-cdn.tripadvisor.com/media/photo-o/05/ca/40/af/the-epiphany-a-joie-de.jpg (https://l.facebook.com/l.php?u=https%3A%2F%2Fmedia-cdn.tripadvisor.com%2Fmedia%2Fphoto-o%2F05%2Fca%2F40%2Faf%2Fthe-epiphany-a-joie-de.jpg&h=ATPTuLcCa7Vsnmn07cEVa0YseTFl1C2hOax9NezejmXDbR48w3CLdjLlwlpuGCRDQmuafQvk03ybGqfhk-2mBcH7xtuKAsnuuq9xKwBd8DwfuBMZkq3n1qX5MdychRKGy2bo2ax9BZQzgqVDY_AvC1EqE6aAdUEc)</url>
 <tag>exterior</tag>
 <tag>first image</tag>
 <tag>tree</tag>
 </image>
 <image>
 <url>http://www3.hilton.com/resources/media/hi/DFWANHH/en_US/img/shared/full_page_image_gallery/main/HH_exteriorview001_1270x560_FitToBoxSmallDimension_Center.jpg (http://l.facebook.com/l.php?u=http%3A%2F%2Fwww3.hilton.com%2Fresources%2Fmedia%2Fhi%2FDFWANHH%2Fen_US%2Fimg%2Fshared%2Ffull_page_image_gallery%2Fmain%2FHH_exteriorview001_1270x560_FitToBoxSmallDimension_Center.jpg&h=ATPTuLcCa7Vsnmn07cEVa0YseTFl1C2hOax9NezejmXDbR48w3CLdjLlwlpuGCRDQmuafQvk03ybGqfhk-2mBcH7xtuKAsnuuq9xKwBd8DwfuBMZkq3n1qX5MdychRKGy2bo2ax9BZQzgqVDY_AvC1EqE6aAdUEc)</url>
 <tag>skyline</tag>
 ...
 </image>
 ...
</listing>
```

#### Create an ad creative

When creating an ad creative, an array of `preferred_image_tags` can be passed in the `object_story_spec`.

```html
curl \
 -F 'name=Ad Creative Test'\
 -F 'object_story_spec={
     "page_id": '<PAGE_ID>',
     "template_data": {
       "preferred_image_tags": ["skyline","exterior"],
       "preferred_video_tags": ["landscape","city"],
       "call_to_action": {"type":"BOOK_TRAVEL"},
       "description": "{{hotel.description}}",
       "link": "<URL>",
        "message": "Book your stay in {{hotel.city}}",
        "name": "{{hotel.name | titleize}}"
     }
    }' \
 -F 'product_set_id=<PRODUCT_SET_ID>' \
 -F 'access_token=<ACCESS_TOKEN>' \
 https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

### Enable Video for Advantage+ Catalog Ads

The main steps for creating Advantage+ catalog ads still holds the same. To enable video, you need to include video data and provide that data inside the catalog.

#### Step 1: Set up a catalog

**Warning:** This example uses an XML file; other formats should be similar.

When you add video to the listing, the `url` and `tag` fields are supported. Currently, **only one video is supported for each product**.

```html
<?xml version="1.0" encoding="utf-8"?>
<listings>
  <title>Test hotel feed</title>
  <listing>
    <hotel_id>hotel_1</hotel_id>
    <name>Test Hotel 1</name>
    <description>A very nice hotel</description>
    <brand>Facebook</brand>
    <address format="simple">
      <component name="addr1">180 Hamilton Ave</component>
      <component name="city">Palo Alto</component>
      <component name="city_id">12345</component>
      <component name="region">California</component>
      <component name="postal_code">94301</component>
      <component name="country">United States</component>
    </address>
    <latitude>37.4435997</latitude>
    <longitude>-122.1615219</longitude>
    <neighborhood>Palo Alto</neighborhood>
    <neighborhood>Silicon Valley</neighborhood>
    <margin_level>8</margin_level>
    <base_price>200.5 USD</base_price>
    <phone>+1 650 666-3311</phone>
    <star_rating>2.5</star_rating>
    <guest_rating>
      <score>7.8</score>
      <rating_system>tripAdvisor</rating_system>
      <number_of_reviewers>300</number_of_reviewers>
    </guest_rating>
    <guest_rating>
      <score>9.8</score>
      <rating_system>Hotels.com</rating_system>
      <number_of_reviewers>35000</number_of_reviewers>
    </guest_rating>
    <image>
      <url>https://media-cdn.tripadvisor.com/media/photo-o/05/ca/40/af/the-epiphany-a-joie-de.jpg</url>
      <tag>front view</tag>
      <tag>first image</tag>
    </image>
    <image>
      <url>http://www.jdvhotels.com/content/uploads/2014/06/72-1200x800.jpg</url>
      <tag>room</tag>
      <tag>bed</tag>
    </image>
    <loyalty_program>Starwood</loyalty_program>
    <url>http://www.jdvhotels.com/hotels/california/silicon-valley-hotels/the-epiphany-hotel/</url>
    <applink property="ios_url" content="example-ios://electronic"/>
    <applink property="ios_app_store_id" content="42"/>
    <applink property="ios_app_name" content="Electronic Example iOS"/>
*    <video>
      <url>http://example.com/some_video1.mp4</url>
      <tag>City</tag>
      <tag>Package</tag>
    </video>*
  </listing>
</listings>
```

##### Video specs

#### Step 2: Use the API to get video metadata for troubleshooting

You can use the API to check the uploaded data. For Marketing API v23.0 and above, use the `videos` field to access video metadata. For earlier versions, use `videos_metadata`. We recommend upgrading to v23.0 or above and using the `videos` field.

##### Request

```html
curl -i -X GET \
"https://graph.facebook.com/v25.0/1234567890?fields=videos&access_token=<ACCESS TOKEN>"
```

##### Sample response

#### Step 3: Enable the video in the creative or ad

To enable product-level video content in ads, see the [Create ads with product video](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/allow-product-video#create-ads-with-product-video) documentation.

### Click tracking and templates

If you track link clicks through a third-party click tracker before redirecting to the final product URL, you can use the `template_url_spec` field in the ad creative. This allows adding a click tracker template to the ad level without the need to hard code it in your data feed file. You can also use this field to create templates for deep linking.

In this field, you may use dynamic fields such as product URL or ID, and those should be url-encoded if their values can contain characters that make the URL invalid.

#### Example

To create a carousel Advantage+ catalog ads template with the `template_url_spec` setting:

```html
curl \
  -F 'name=Advantage+ Catalog Ads Template Creative Sample' \
  -F 'object_story_spec={
    "page_id": "<PAGE_ID>",
    "template_data": {
      "description": "Description {{product.description}}",
      "link": "<URL>",
      "message": "Test {{product.name | titleize}}",
      "name": "Headline {{product.price}}"
    }
  }' \
  -F 'template_url_spec={
    "ios": {
      "app_store_id": "123",
      "url": "example:\/\/link\/?nav=item.view&id={{product.retailer_id | urlencode}}&referrer=http:\/\/rover.example.com\/rover\/1\/711-198453-24755-9\/16%3Fitemid={{product.retailer_id | urlencode | urlencode}}"
    },
    "web": {
      "url": "http:\/\/clicktrack.com\/cm325?id={{product.retailer_id | urlencode}}&redirect_url={{product.url | urlencode | urlencode}}"
    }
  }' \
  -F 'product_set_id=<PRODUCT_SET_ID>' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

### Use data feed file data in your template {#use-data-feed-file-data-in-your-template}

When an ad is displayed, Facebook replaces the content in the `{{ }}` section with the proper values from your data feed file. Available template values are:

| Name | Description |
| --- | --- |
| `brand` | The item's `brand` value from your data feed file. |
| `current_price` | The formatted sale price if the product has a specified sale price. Optionally you can specify sale start and end dates for a product and `current_price` will show the sale price while the item is on sale. If no sale price is specified or the sale dates have passed, this will show the price field. |
| `description` | The item's `description` value from your data feed file. |
| `name` | The item's `title` value from your data feed file. |
| `price` | The formatted `price` column (like `$1,234.56`). |
| `retailer_id` | The item's `id` value from your data feed file. |
| `url` | The item's `link` value from your data feed file. |
| `custom_label_0` | The item's `custom_label_0` value from your data feed file. |
| `custom_label_1` | The item's `custom_label_1` value from your data feed file. |
| `custom_label_2` | The item's `custom_label_2` value from your data feed file. |
| `custom_label_3` | The item's `custom_label_3` value from your data feed file. |
| `custom_label_4` | The item's `custom_label_4` value from your data feed file. |

#### Options

Some template values may receive options, in any order, in the following format:

```html
{{field option1 option2 ...}}
```

The following options are available:

| Option | Description | Supported by |
| --- | --- | --- |
| `raw` | Omits the currency symbol | `price`  <br>`current_price` |
| `strip_zeros` | Omits the cents part in currency if cents are zeros | `price`  <br>`current_price` |
| `round` | Omits the cent amount of the currency while rounding up the price | All price fields |

#### Transformations

You can use template values with **transformations**, which adjust your value based on this format:

```html
{{field | transform}}
```

Use one of these transformations:

| Transformations | Description |
| --- | --- |
| `number_format` | Format the number in a default format, using a comma (",") as thousand separator, rounded to the nearest integer (e.g., 1234.56->"1,235"). The value to format must be an unformatted number ("1234", not "1,234"). |
| `titleize` | Capitalize the words for a better looking title (e.g., "box" -> "Box"). |
| `urlencode` | Encode the value for URL. |

### Specify desired behavior of ads click from mobile

When you display a dynamic creative, you can specify the desired behavior when someone clicks on the ad in the native Facebook app. There are two requirements to be able to use deep linking:

1. The native mobile app where the user should be sent to supports deep linking ([iOS](https://developers.facebook.com/docs/applinks/ios) or [Android](https://developers.facebook.com/docs/applinks/android)).
2. The deep link information has been included in the [data feed file](https://developers.facebook.com/documentation/ads-commerce/catalog#deep-linking) or deep link information is available through [App Links](https://developers.facebook.com/docs/applinks).

If both these requirements are fulfilled, you can use the `applink_treatment` field while creating an ad creative to specify the desired behavior when a user clicks on an ad.

| Name | Description |
| --- | --- |
| `web_only` | Always send the user to the given web URL. |
| `deeplink_with_web_fallback` | If the app is installed on the user's phone and we have corresponding deep link information, send the user to the app. If one of these conditions is not met, send them to the website. |
| `deeplink_with_appstore_fallback` | Default when app links are present for the product. If the app is installed on the user's phone and we have corresponding deep link information, send the user to the app. If the app is not installed, send them to the app store for the app. |

#### Examples

Creating a carousel Advantage+ catalog ads template with a call to action that will deep link into a native app if available or fall back to the web:

```html
curl \
  -F 'name=Advantage+ Catalog Ads Template Creative Sample' \
  -F 'applink_treatment=deeplink_with_web_fallback' \
  -F 'object_story_spec={
    "page_id": "<PAGE_ID>",
    "template_data": {
      "call_to_action": {"type":"SHOP_NOW"},
      "description": "Description {{product.description}}",
      "link": "<LINK>",
      "message": "Test {{product.name | titleize}}",
      "name": "Headline {{product.price}}"
    }
  }' \
  -F 'product_set_id=<PRODUCT_SET_ID>' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

Creating a carousel Advantage+ catalog ads template with URL tags enabled that will deep link into a native app if available or fall back to app store for the app:

```html
curl \
  -F 'name=Advantage+ Catalog Ads Template Creative Sample' \
  -F 'applink_treatment=deeplink_with_appstore_fallback' \
  -F 'object_story_spec={
    "page_id": "<PAGE_ID>",
    "template_data": {
      "call_to_action": {"type":"SHOP_NOW"},
      "description": "Description {{product.description}}",
      "link": "<LINK>",
      "message": "Test {{product.name | titleize}}",
      "name": "Headline {{product.price}}"
    }
  }' \
  -F 'product_set_id=<PRODUCT_SET_ID>' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

### Create a localized catalog for Advantage+ catalog ads

See details in [Localized Catalog for Advantage+ Catalog Ads](https://developers.facebook.com/documentation/ads-commerce/catalog/localized-catalog-da).

### Automated product tags

[Automated product tags](https://www.facebook.com/business/help/help.instagram.com/1157716325492082) are designed to improve your ad performance and help people discover your products from ads more easily.

We may automatically tag products in your Advantage+ catalog ads. To opt-in to automated product tags, set `automated_product_tags` to `true` in the `template_data` of the `object_story_spec`. You must also provide a product set ID.

**Example**

```html
curl \
  -F 'name=Sample Creative' \
  -F 'product_set_id="<PRODUCT_SET_ID>"' \
  -F 'object_story_spec={
        "template_data": {
          "automated_product_tags": true
          "call_to_action":  {
            "type": "SHOP_NOW"
          },
          "link": "<OFFSITE_LANDING_URL>",
          "multi_share_end_card": false,
          "name": "{{product.name}}"
        },
        "page_id": "<PAGE_ID>",
        "instagram_user_id": "<IG_USER_ID>"
     }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

## Step 4: Create an Ad

Finally, you can create an [ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup).  The ad references an ad creative.

#### Example

```html
curl -X POST \
  -F 'name="My Ad"' \
  -F 'adset_id="<AD_SET_ID>"' \
  -F 'creative={
       "creative_id": "<CREATIVE_ID>"
     }' \
  -F 'status="PAUSED"' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads
```

Congratulations! You have created your first Advantage+ catalog ad. Feel free to unpause it to start delivery.

**Warning:** When published as an Instagram Stories' ad, Advantage+ catalog ads are cropped to 1:1 regardless of the dimensions of the original image.

## Next steps

### Preview Advantage+ catalog ads

You can generate previews of your dynamic creative with the [Ad Previews endpoint](https://developers.facebook.com/documentation/ads-commerce/marketing-api/generatepreview). Specify the `product_item_ids` parameter or specify multiple `product_item_ids` to preview a carousel ad.

```html
curl -X GET \
  -d 'ad_format="DESKTOP_FEED_STANDARD"' \
  -d 'product_item_ids=[
       "<PRODUCT_ITEM_ID>"
     ]' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<CREATIVE_ID>/previews
```

#### Parameters

| Name | Description |
| --- | --- |
| `product_item_ids`<br><br>array[string] | List of product FBIDs or Base64 URL-encoded product ID tokens.  <br>Each token is of the form `catalog:{catalog_id}:{base64urlencode(retailer_id)}`. |

### Fetch product ad statistics

You can fetch statistics per product by making a `GET` call to the [insights](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights) endpoint. Add `product_id` to the `fields` parameter.

This shows statistics for all products in an account's product sets displayed in Advantage+ catalog ads.

#### Example

This example reports `clicks`, `actions`, and `impressions` for each `product_id`.  

##### Request

```html
curl -G \
  -d 'date_preset=last_week' \
  -d 'action_breakdowns=["action_type"]' \
  -d 'breakdowns=["product_id"]' \
  -d 'fields=account_name,impressions,actions' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/insights
```

##### Response

```html
{
 "data": [
   {
      "account_id": "123456",
      "product_id": "60750",
      "date_start": "2015-02-03",
      "date_stop": "2015-02-03",
      "impressions": 880,
      "clicks": 8,
      "actions": [
        {
          "action_type": "link_click",
          "value": 6
        },
        {
          "action_type": "offsite_conversion.other",
          "value": 5
        },
        {
          "action_type": "offsite_conversion",
          "value": 5
        }
      ],
      "account_name": "My Account"
    },
 ],
...
}
```

### Fetch comments and likes

You can retrieve the comments, likes, and the `product_id` for an Advantage+ catalog ads post. Make a `GET` call as follows with a `post_id`. The `post_id` is the `effective_object_story_id` of an [ad creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative), in the format of `PageID_PostID`.

**Note**: You cannot use this endpoint to retrieve comments from Instagram.

```html
curl -G \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/<API_VERSION>/<POST_ID>/dynamic_posts
```

This endpoint returns [dynamic post](https://developers.facebook.com/docs/graph-api/reference/rtb-dynamic-post) objects.

Once you get dynamic posts, you can fetch `comments`, `likes`, `product_id`, and `child_attachments` for carousel format, if applicable.

**Note:** Placement Asset Customization ads will not be returned by the `dynamic_posts` edge.

## Learn more

* [Set Up Catalog](https://developers.facebook.com/documentation/ads-commerce/catalog)
* [Build Audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/dynamic-product-audiences)
* [Ad Set Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign)
* [Ad Creative Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative)
* Meta Blueprint course: [Prepare and Set Up Catalog for Advantage+ Catalog Ads](https://www.facebookblueprint.com/student/path/219712?content_id=MRY0h11ihTBfj6p)
* Meta Blueprint course: [Troubleshoot Catalog for Advantage+ Catalog Ads](https://www.facebookblueprint.com/student/path/219711-troubleshoot-meta-advantage-catalog-ads?content_id=OVVdO3F3aYOmKgT)
* Meta Blueprint live training: [Troubleshoot Catalog for Advantage+ Catalog Ads](https://www.facebookblueprint.com/student/page/549922-troubleshoot-catalog-for-advantage-catalog-ads?content_id=sh69r7qh1rswXYa)
