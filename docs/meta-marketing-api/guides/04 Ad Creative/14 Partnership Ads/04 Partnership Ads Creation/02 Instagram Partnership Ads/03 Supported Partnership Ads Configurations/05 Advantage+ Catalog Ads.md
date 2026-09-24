<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/ads-creation/supported-configurations/advantage-catalog-ads | Saved: 2026-09-19 -->

# Partnership Ads with Advantage+ Catalog Ads



Partnership ads enable advertisers to collaborate with creators or partners, using their handle to increase engagement and generate interest in the ad. [Advantage+ catalog ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads) are a type of personalized ad that automatically shows relevant products from a catalog to viewers based on their interests and actions. This document describes how to create a partnership ad using an Advantage+ catalog ad with either a carousel or collection format.

### Permissions

You need the following permissions:

* `ads_management`
* `business_management`
* `instagram_basic`
* `instagram_manage_comments`
* `instagram_content_publish`
* `pages_show_list`
* `pages_read_engagement`
* `pages_manage_ads`
* `pages_manage_posts`
* `instagram_branded_content_ads_brand`

## Collection format only

### Step 1: Create an [Instant Experience](https://developers.facebook.com/docs/marketing-api/guides/instant-experiences) body element with existing media as the hero asset

The `canvas_existing_post` field takes in an existing Facebook or Instagram media ID (either a photo or video) and creates a [body element](https://developers.facebook.com/docs/graph-api/reference/canvas-body-element) with the media set as the hero asset of the element.

#### Parameters

| Name | Description |
| --- | --- |
| `canvas_existing_post` | Uses an existing post as the hero asset for the element.<br><br>**Values:**<br><br>* `source_instagram_media_id` — Specifies the Instagram media to use as the hero asset.<br>* `source_facebook_post_id` — Specifies the Facebook post to use as the hero asset. |

#### Example requests

##### Using existing Instagram media

```html
curl -X POST \
  -F 'canvas_existing_post={
    "source_instagram_media_id":<IG_MEDIA_ID>
  }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<PAGE_ID>/canvas_elements
```

**Note:** When using an Instagram post that is a video, call the `/advideos` endpoint to ensure that the video is fully processed.

##### Using existing Facebook media

```html
curl -X POST \
  -F 'canvas_existing_post={
    "source_facebook_post_id":<FB_MEDIA_ID>
  }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<PAGE_ID>/canvas_elements
```

### Step 2: Create the Instant Experience product set and footer

Create the [product set and footer](https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative/collection-ads#product-sets) as you would for any collection ad.

### Step 3: Create an Instant Experience with existing media as the hero asset

The `hero_asset_facebook_post_id` and `hero_asset_instagram_media_id` fields take in an existing Facebook or Instagram media ID and create an Instant Experience with the media set as the hero asset of the [canvas](https://developers.facebook.com/docs/graph-api/reference/page/canvases).

**Note:** If the hero asset is already set in the body element and a hero asset field is then passed in:

* If the passed-in hero asset is null, the body element's hero asset overrides it.
* If the passed-in hero asset is different from the body element's hero asset, the API returns an error.

#### Parameters

| Name | Description |
| --- | --- |
| `hero_asset_instagram_media_id` | Specifies the Instagram media to use as the hero asset. |
| `hero_asset_facebook_post_id` | Specifies the Facebook post to use as the hero asset. |

#### Example requests

##### Using existing Instagram media

```html
curl -X POST \
  -F 'body_element_ids=[
    <BODY_ELEM_ID_1>,
    <BODY_ELEM_ID_2>,
    ...
  ]' \
  -F 'is_published=true' \
  -F 'hero_asset_instagram_media_id=<IG_MEDIA_ID>' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<PAGE_ID>/canvases
```

##### Using existing Facebook media

```html
curl -X POST \
  -F 'body_element_ids=[
    <BODY_ELEM_ID_1>,
    <BODY_ELEM_ID_2>,
    ...
  ]' \
  -F 'is_published=true' \
  -F 'hero_asset_facebook_post_id=<FB_MEDIA_ID>' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<PAGE_ID>/canvases
```

## Collection and carousel formats

### Create an ad creative with an existing post as the parent source

The `parent_source_instagram_media_id` and `parent_source_facebook_post_id` fields of `branded_content` take in an existing Facebook or Instagram media ID and create an [ad creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/adcreatives) with the media set as the parent source of the element.

#### Parameters

| Name | Description |
| --- | --- |
| `branded_content` | Object containing information about the partnership ad.<br><br>**Values:**<br><br>* `parent_source_instagram_media_id` — Specifies the Instagram media to use as the parent source media shown as the intro card.<br>* `parent_source_facebook_post_id` — Specifies the Facebook post to use as the parent source media shown as the intro card. |

#### Example requests

##### Using existing Instagram media

```html
curl -X POST \
  ... //other parameters for the ad creative \
  -F 'branded_content={
    "parent_source_instagram_media_id":<IG_MEDIA_ID>
  }' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

**Note:** When using an Instagram post that is a video, call the `/advideos` endpoint to ensure that the video is fully processed.

##### Using existing Facebook media

```html
curl \
  ... //other parameters for the ad creative \
  -F 'branded_content={
    "parent_source_facebook_post_id":<FB_MEDIA_ID>
  }' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

**Note:** You only need to pass in `branded_content.parent_source_instagram_media_id` or `branded_content.parent_source_facebook_post_id` when using a canvas with an existing post. Whether the format is a collection or a carousel depends on other parameters passed in, which are omitted in these code samples.

## Learn more

* [Advantage+ Catalog Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads)
