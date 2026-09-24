<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative/collection-ads | Saved: 2026-09-19 -->

# Collection Ads



The collection ad format includes an [Instant Experience](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/instant-experiences) and makes it easier for people to discover, browse, and purchase products and services from their mobile device. The in-feed ad will feature three products under a hero image or video that opens into a full-screen Instant Experience when someone interacts with your ad.

You can create an ad with the collection format by building an [Instant Experience](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/instant-experiences). Start with a template or choose your own customized layout.

You can also include Facebook's ad creation user interfaces for the collection format in your website using the JavaScript SDK to create a [Collections Ads Dialog](#collection-ads-dialog).

To create collections used in Shops or to add metadata to a product set, see [Commerce Platform: Product Set Collection API](https://developers.facebook.com/documentation/ads-commerce/commerce-platform/catalog/collections).

**Warning:** Consider all references of "Canvas" to represent Instant Experience as Canvas is the previous name for this format.

## Supported objectives and placements

### Objectives

You can use collection ads with the following objectives:

* Traffic
* Conversions
* Product Catalog Sales *(Supported when you use collections with a product set.)*
* Store Visits *(Supported when you use collections with a product set.)*
* Brand Awareness
* Reach

For Traffic and Conversions objectives, you can also use slideshow videos. See [How to choose the right ad objective in Meta Ads Manager](https://www.facebook.com/business/help/1438417719786914) for more information.

### Placements

The following placements are supported:

* Facebook Feed
* Facebook Reels
* [Instagram Feed](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/instant-experiences#instant-experiences-and-instagram-ads)
* [Instagram Stories](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/instant-experiences#instant-experiences-and-instagram-ads)

For more information about placements, see [About ad placements across Meta technologies](https://www.facebook.com/business/help/407108559393196) and [Available ad placements and ad formats by ad objectives](https://www.facebook.com/business/help/279271845888065).

## Standard collection ads creatives

You can use a [template](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/instant-experiences#templates) as a quick way to create an Instant Experience for a specific business goal. The layout for each template is fixed; however, you can replace the default content with your own images, videos, products, text, and links.

There are two types of collection ads with Instant Experiences: **image-based** and **video-based**, depending on the asset you provide. Once you have an ad creative, you can create an ad.

### Create an Image-Based Ad Creative

```html
curl
  -F 'name=Instant Experiences Collection Sample Image Creative'
  -F 'object_story_spec={
    "link_data": {
      "link": "https://fb.com/canvas_doc/<ELIGIBLE_CANVAS_ID>",
      "message": "<AD_MESSAGE>",
      "name": "<NAME>",
      "picture": "<IMAGE_URL>",
      "collection_thumbnails": [
        {"element_crops": {"100x100": [[0, 0], [100, 100]]},"element_id": "<PHOTO_ELEMENT_WITH_PRODUCT_TAGS_ID>",},
        {"element_child_index": 0,"element_id": "",},
        {"element_child_index": 1,"element_id": "<PRODUCT_LIST_ELEMENT_ID>",},
      ],
    },
    "page_id": "<PAGE_ID>"
  }'
  -F 'access_token=<ACCESS_TOKEN>'
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

### Create a Video-Based Ad Creative

```html
curl
  -F 'name=Instant Experiences Collection Sample Video Creative'
  -F 'object_story_spec={
    "page_id": "<PAGE_ID>",
    "video_data": {
      "call_to_action": {
        "type":"LEARN_MORE",
        "value":{
          "link":"https://fb.com/canvas_doc/<ELIGIBLE_CANVAS_ID>"
        }
      },
      "image_url": "<IMAGE_URL>",
      "collection_thumbnails": [
        {"element_crops": {"100x100": [[0, 0], [100, 100]]},"element_id": "<PHOTO_ELEMENT_NO_PRODUCT_TAGS_ID>",},
        {"element_child_index": 0,"element_id": "<PHOTO_ELEMENT_WITH_PRODUCT_TAGS_ID>",},
        {"element_child_index": 1,"element_id": "<PRODUCT_LIST_ELEMENT_ID>",},
      ],
      "title": "<VIDEO_TITLE>",
      "video_id": "<VIDEO_ID>"
    }
  }'
  -F 'access_token=<ACCESS_TOKEN>'
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

### Parameters
| Name | Description |
| --- | --- |
| `link`  <br><br>string | **Required**  <br>Redirects the viewer to an Instant Experience. |
| `collection_thumbnails`  <br><br>array | **Required**  <br>An array of thumbnails. Four thumbnails are required. |

#### The `collection_thumbnails` fields

| Name | Description |
| --- | --- |
| `element_id`  <br><br>numeric string | **Required**  <br>The Canvas photo element ID or the product list element ID. The Canvas photo needs to be associated with the Instant Experience attached to this collection ad. An image associated with this ID appears in the Instant Experience after someone clicks the ad.  <br>**Note:** A hero image element ID is invalid. |
| `element_child_index`  <br><br>integer | **Required for a photo element with product tags and product list element**  <br>The product index from an array of photo element IDs with product tags. Or a product index from an array of `product_id_list`, which contains the product list elements.  <br>**Note:** Must be a positive integer. |
| `element_crops`  <br>[AdsImageCrops](https://developers.facebook.com/documentation/ads-commerce/marketing-api/image-crops) | **Required for a photo element**  <br>A JSON object defining crop dimensions for the image specified.  <br>**Note:** Only `100x100` crop key is allowed. |

## Product sets

Before you create a collection ad, you need to provide an ad creative and an Instant Experience. You must provide at least four elements that represent photos or products with product tags to be shown in rotation. Child photo elements in a carousel element are also valid.

The collection ad appears in Feed, and people can see more in a full-screen Instant Experience that opens when they tap on the ad.

To use a product set, you should be familiar with [Advantage+ catalog ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads) and already have a [product catalog](https://developers.facebook.com/documentation/ads-commerce/catalog) set up.  

### Create a collection ad from a product set

When you create a collection ad from a product set, you must also explicitly create an Instant Experience with the correct elements. When you use this Instant Experience in a collection ad, Meta automatically generates the collection ad.

Your Instant Experience should contain:

* An image, as either a [Canvas Photo](https://developers.facebook.com/docs/graph-api/reference/canvas-photo),  [Canvas Video](https://developers.facebook.com/docs/graph-api/reference/canvas-video), or [Canvas Template Video](https://developers.facebook.com/docs/graph-api/reference/canvas-template-video).
* A [product set](https://developers.facebook.com/docs/graph-api/reference/canvas-product-set) with `show_in_feed` set to `true`.
* A [footer](https://developers.facebook.com/docs/graph-api/reference/canvas-footer)

#### Step 1: Create the Instant Experience image

##### Example requests

Create an Instant Experience with an image

```html
curl \
  -F 'canvas_photo={
    "photo_id": "<PHOTO_ID>",
  }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<PAGE_ID>/canvas_elements
```

Create an Instant Experience with a video

```html
curl \
  -F 'canvas_video={
    "video_id": "<VIDEO_ID>",
  }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<PAGE_ID>/canvas_elements
```

Create an Instant Experience with a template video

```html
curl -X POST \
  -F canvas_template_video={
    "name": "Cover Image or Video",
    "bottom_padding": "0",
    "top_padding": "0",
    "product_set_id": <Product_Set_ID>,
    "template_video_spec": {
      "customization": {
        "text_color": "FFFFFF",
        "text_background_color": "000000",
        "name_template": "{{product.name}}",
        "body_template": "{{product.current_price strip_zeros}}"
      },
    }
  }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<PAGE_ID>/canvas_elements
```

#### Step 2: Create the Instant Experience product set

Create a `canvas_product_set` with a `product_set_id` from your product catalog. You must set `show_in_feed` to `true` to create a collection ad.

##### Example request

```html
curl -X POST \
  -F 'canvas_product_set={
    "max_items": 50,
    "product_set_id": "<PRODUCT_SET_ID>",
    "item_headline": "{{product.name}}",
    "item_description": "{{product.current_price}}"
    "image_overlay_spec": {
      "overlay_template": "pill_with_text",
      "text_type": "price",
      "text_font": "dynads_hybrid_bold",
      "position": "top_left",
      "theme_color": "background_e50900_text_ffffff",
      "float_with_margin": true,
    },
    "storefront_setting": {
      "enable_sections": true,
      "customized_section_titles": [
      {
        "title_id": "popular", "customized_title": "My Populars"
      },
      {
        "title_id": "favorites", "customized_title": "My Favorites"
      }],
      "product_set_layout": {
        "layout_type": "GRID_3COL"
      }
    },
    "retailer_item_ids": [0, 0, 0],
    "show_in_feed": true
  }' \
https://graph.facebook.com/v25.0/<PAGE_ID>/canvas_elements
```

**Note:** The `item_headline`, `item_description`, `image_overlay_spec`, `storefront_setting`, and `retailer_item_ids` parameters are all optional fields.

Provide any [required fields](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-link-data-image-overlay-spec) in the `image_overlay_spec` parameter.

The `storefront_setting` parameter supports the `product_set_layout`, `enable_sections`, and `customized_section_titles` fields.

##### The `product_set_layout` field

| Name | Description |
| --- | --- |
| `layout_type`<br><br>string | **Required.**  <br>How the product set will be displayed.  <br>**Values:** `GRID_2COL`, `GRID_3COL`, `CAROUSEL`, `HSCROLL_LIST` |

##### The `customized_section_titles` field

In order to use `customized_section_titles`, the `enable_sections` parameter must be set to `true`.

| Name | Description |
| --- | --- |
| `title_id`<br><br>string | **Required.**  <br>Enum string representing the default section title string that you would like to replace.  <br>**Values:** `keep_shopping`, `take_another_look`, `you_may_also_like`, `related_products`, `trending`, `popular`, `top_items`, `favorites`, `most_viewed`, `top_picks_for_you`, `suggested_for_you`, `featured_favorites`, `just_for_you`, `explore_more`, `shop_by_category` |
| `customized_title`<br><br>string | **Required.**  <br>Alternative custom string that the viewer should see as the section title. |

#### Step 3: Create the Instant Experience footer

Create the Instant Experience footer with a link.

##### Example requests

```html
curl \
  -F 'canvas_button={
    "rich_text": {
      "plain_text": "See more at www.abc.com."
    },
    "open_url_action": {
      "url": "https://www.abc.com"
    }
  }' \
 -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<PAGE_ID>/canvas_elements
```

You can also create a button to use in the footer.

```html
curl \
  -F 'canvas_footer={
    "child_elements": <BUTTON_ELEMENT_ID>
  }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<PAGE_ID>/canvas_elements
```

#### Step 4: Create the complete Instant Experience

##### Example requests

Basic Instant Experience

```html
curl -X POST \
  -F 'body_element_ids=[
    <PHOTO_OR_VIDEO_ELEMENT_ID>,
    <PRODUCT_SET_ELEMENT_ID>,
    <FOOTER_ELEMENT_ID>
  ]' \
  -F 'is_published=true' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/<PAGE_ID>/canvases
```

To create the Instant Experience with a template video, product set, button, store location and optional footer, include the `source_template_id` parameter.

```html
curl \
  -F 'body_element_ids=[
    <TEMPLATE_VIDEO_ELEMENT_ID>,
    <PRODUCT_SET_ELEMENT_ID>,
    <FOOTER_ELEMENT_ID>
  ]' \
  -F 'name="Dynamic Video Instant Experience"' \
  -F 'source_template_id="1932289657009030"' \
  -F 'is_published=true' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<PAGE_ID>/canvases
```

For a storefront template, you need to specify `source_template_id = 1932289657009030`. The storefront template ID is defined in [Instant Experiences: Using templates](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/instant-experiences#templates). The layout for each template is fixed; however, you can replace the default content with your own dynamic videos, products, text, and links.

#### Step 5: Create the collection ad with the Instant Experience

If the first element of your Instant Experience is a photo, you must set `object_type` to `SHARE`.

```html
curl \
  -F 'name=Collection Sample Image Creative' \
  -F 'object_story_spec={
    "link_data": {
      "link": "https://fb.com/canvas_doc/<CANVAS_ID>",
      "message": "<AD_MESSAGE>",
      "name": "<AD_HEADLINE>",
    },
    "page_id": "<PAGE_ID>"
  }' \
  -F 'object_type=SHARE' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

If the first element of your Instant Experience is a video, you must set `object_type` to `VIDEO`.

```html
curl \
  -F 'name=Collection Sample Video Creative' \
  -F 'object_story_spec={
    "video_data": {
      "call_to_action": {
        "type":"LEARN_MORE",
        "value":{
          "link":"https://fb.com/canvas_doc/<CANVAS_ID>",
        }
      },
      "image_url": "<THUMBNAIL_IMAGE_URL>",
      "message": "<AD_MESSAGE>",
      "title": "<AD_HEADLINE>",
    },
    "page_id": "<PAGE_ID>"
  }' \
  -F 'object_type=VIDEO' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

If the first element of your Instant Experience is a template video,  the request should look as follows:

```html
curl -X POST \
  -F 'name="Dynamic Video Collection Ad"' \
  -F 'adset_id=<ADSET_ID>' \
  -F 'status=PAUSED' \
  -F 'creative={
       "object_story_spec": {
         "instagram_user_id": "<INSTAGRAM_PAGE_ID>",
         "page_id": "<MAIN_PAGE_ID>",
         "template_data":{
           "call_to_action":{
             "type":"LEARN_MORE"
           },
           "format_option":"collection_video",
           "link":"https://fb.com/canvas_doc/<CANVAS_ID>",
           "name":"Test Dynamic Ads with dynamic video",
           "retailer_item_ids":[
             "0",
             "0",
             "0",
             "0"
           ]
         }
       },
       "object_type": "SHARE",
     }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads
```

### Ad previews

You can provide an `ad_format` and User access token to generate previews based on your ad or ad creative.

```html
curl -X GET \
  -d 'ad_format="MOBILE_FEED_STANDARD"' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<CREATIVE_ID>/previews
```

**Note:** For template video Instant Experience ads, the supported formats are `BIZ_DISCO_FEED_MOBILE`, `GROUPS_MOBILE`, `MOBILE_FEED_STANDARD`, `SUGGESTED_VIDEO_DESKTOP`,  `SUGGESTED_VIDEO_MOBILE`, `WATCH_FEED_MOBILE`.

See [Ad Previews](https://developers.facebook.com/documentation/ads-commerce/marketing-api/generatepreview) for more information.

## Collection ads dialog

Collection ads are based on Instant Experiences with a template. Therefore, to create a collection ad using a dialog, you will use the [Instant Experiences dialog](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/instant-experiences#canvas-ads-dialog) with additional parameters. This dialog provides the Facebook collection ad creation UI flow in your website. For details about the UI component, see [Dialogs](https://developers.facebook.com/docs/javascript/reference/FB.ui).

To set up the Facebook SDK for JavaScript, see:

* [Quickstart guide](https://developers.facebook.com/docs/javascript/quickstart)
* [Initialization reference](https://developers.facebook.com/docs/javascript/reference/FB.init)

The JavaScript SDK relies on the logged in user's permissions to create Instant Experiences. If the user does not have the necessary permissions to create an Instant Experience for the supplied page and business, the dialog will show an error. The user must also have access to the product catalogs and sets. In order to ensure no errors, the user must have access to the Meta Business Suite and have permissions to create ads for the page.

Then you can trigger the collection ads dialog.

```js
FB.ui({
  display: 'popup',
  method: 'instant_experiences_builder',
  account_id: 'AD_ACCOUNT_ID'.
  business_id: 'BUSINESS_ID',
  page_id: 'PAGE_ID',
  template_id: 'TEMPLATE_ID'
}, function(response) {
  // callback
});
```

### Settings

| Name | Description |
| --- | --- |
| `display` | **Required.**  <br>**Value:** `popup` |
| `method` | **Required.**  <br>**Value:** `instant_experiences_builder` |
| `account_id` | **Required.**  <br>Your ad account ID. |
| `business_id` | **Required.**  <br>Your business ID. |
| `page_id` | **Required.**  <br>The Page ID you want to associate with the Instant Experience. |
| `template_id` | **Required.**  <br>The ID of the template you want to use. |
| `product_catalog_id` | **Required, if `product_set_id` is provided.**  <br>The ID of the product catalog to be used in the collection.  <br>**Note:** Once provided, you will not be able to change the collection in the UI. If the parameter is not provided, you can select the catalog and product set in the UI. |
| `product_set_id` | **Optional.**  <br>The ID of the product set to be used in the collection.  <br>**Note:** Once provided, you will not be able to change the collection in the UI. If the parameter is not provided, you can select the catalog and product set in the UI. |

All valid template types and the corresponding ID can be found in [Instant Experiences: Use a Template](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/instant-experiences#templates).

To preview a collection ad, use the [Instant Experiences Preview Dialog](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/instant-experiences#preview-an-instant-experience).

### Example response

```json
{
  "success": true,
  "id": "<CANVAS_ID>"
}
```

The `id` returned will be an **unpublished** Instant Experience. It needs to be [published](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/instant-experiences#publish) before it can be used in ad campaigns.

If there is no response or an `undefined` response is returned, it means the dialog was closed before finishing the Instant Experience set up or that the user saved the Instant Experience but did not finish it. You can query to see [all the Instant Experiences that belong to a page](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/instant-experiences#get-an-existing-instant-experiences) and see if any are unfinished Instant Experiences.

## Including destination catalogs

You can show ad creatives from a destination catalog in a collection ad's hero image. You can also display a carousel of hotel images at that destination. To do this, you must provide a fallback image that displays at the hero image in case there is no corresponding destination for hotels in the carousel. For more information, see [Destination Catalog](https://developers.facebook.com/documentation/ads-commerce/marketing-api/destination-ads/catalog).

Note these limitations:

* Meta does not support video creative.
* Only the display of destination and hotel catalog images combined is supported.
* The display of other catalog combinations is not allowed.

To use this feature, add the `destination_set_id` parameter when creating your `canvas_photo` element, then follow the other standard steps to create your Instant Experience and collection ad.

### Example request

```html
curl -X POST \
  -F 'canvas_photo={
    "photo_id": "<PHOTO_ID>",
    "destination_set_id": "<DESTINATION_SET_ID>",
  }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<PAGE_ID>/canvas_elements
```

## Create engagement audiences

You can automatically create audiences for people who interacted with your collection ad. This is similar to engagement audiences for standard Instant Experiences. For more information, see [Instant Experiences, Engagement Audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/instant-experiences#create-audiences-for-instant-experiences).

You can target your Instant Experience ads with a full-screen view for people who tapped on your collection ad. This type of audience is called a *Fullscreen Experience engagement audience*. Build this audience by creating a custom audience, set `object_id` to `CANVAS_ID`, and make a rule to track one of the events.

### Create an audience of people that opened an Instant Experience

```html
curl -X POST \
  -F 'name=Collection Engagement Audience' \
  -F 'description=People who opened this Instant Experience' \
  -F 'rule=[{
    "object_id":"<CANVAS_ID>",
    "event_name":"instant_shopping_document_open"
  }]' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/customaudiences
```

### Create an audience of people that clicked on a collection ad

```html
curl -X POST \
  -F 'name=Collection Engagement Audience' \
  -F 'description=People who clicked any links in this Instant Experience' \
  -F 'rule=[{
    "object_id":"<CANVAS_ID>",
    "event_name":"instant_shopping_element_click"
  }]' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/customaudiences
```

## See more

* [About Instant Experience](https://www.facebook.com/business/help/183469315334462)
* [Create a collection ad from Meta Ads Manager](https://www.facebook.com/business/help/1470043529695523)
* [How to choose the right ad objective in Meta Ads Manager](https://www.facebook.com/business/help/1438417719786914)
* [About ad placements across Meta technologies](https://www.facebook.com/business/help/407108559393196)
* [Available ad placements and ad formats by ad objectives](https://www.facebook.com/business/help/279271845888065)
