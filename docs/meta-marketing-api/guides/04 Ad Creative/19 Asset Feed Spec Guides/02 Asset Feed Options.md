<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/asset-feed-spec/options | Saved: 2026-09-19 -->

# Asset Feed Spec Options



You can use the following options in your `asset_feed_spec`. See [Ad Asset Feed Spec](https://developers.facebook.com/docs/marketing-api/reference/ad-asset-feed-spec) for more reference information.

| Property Name | Description |
| --- | --- |
| `images`<br><br>type: array of objects | **Required for `SINGLE_IMAGE` and `CAROUSEL_IMAGE` format.**<br><br>Array of **eligible** images. Images provided in this array should be included in the ad account's [image library](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-image).<br><br>Provide this field as an array of objects, each containing `{"url": "{IMAGE_URL}", "hash": "{IMAGE_HASH}", "url_tags": "{TAG}"}`. Either `url` or `hash` is required. |
| `videos`<br><br>type: array of objects | **Required for `SINGLE_VIDEO` format.**<br><br>Array of `video_id`s. The [`video_id`s](https://developers.facebook.com/docs/marketing-api/advideo) provided in this array should belong to the ad account.<br><br>Provide this field as an array of objects, each containing `{"video_id": "{VIDEO_ID}", "thumbnail_url": "{THUMBNAIL_URL}", "url_tags": "{TAG}"}` |
| `carousels`<br><br>type: array of objects | **Optional.**<br><br>An array of `child_attachments` along with the `multi_share_end_card` and `multi_share_optimized` Booleans, and `adlabels`. The `child_attachments` provided in this array should belong to the ad account.<br><br>Provide the `child_attachments` as an array of objects, each containing `{"image_label": {"name": "{IMAGE_LABEL}"}, "video_label": {"name": "{VIDEO_LABEL}"}, "title_label": {"name": "{TITLE_LABEL}"}, "description_label": {"name": "{DESC_LABEL}", "link_url_label": {"name": "{LINK_URL}"}}`.<br><br>**Note:** Either `image_label` or `video_label` is required.<br><br>See [Field Specifications](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/videoads#spec) for more information. |
| `bodies`<br><br>type: array of objects | **Optional.**<br><br>Array of bodies. The primary message or copy of the ad.<br><br>Provide this field as an array of objects, each `{"text": "{BODY_TEXT}", "url_tags": "{TAG}"}`. |
| `call_to_action_types`<br><br>type: array of objects | **Required for all objectives, except `OUTCOME_AWARENESS`.**<br><br>Array of call-to-action-type values.<br><br>Provide this field as an array of objects, each `{"{CALL_TO_ACTION}"}`. You can provide multiple values, up to five. |
| `titles`<br><br>type: array of objects | **Optional.**<br><br>Array of titles. A title is a short headline in the ad, generally shown next to a link, image, or video.<br><br>Provide this field as an array of objects, each `{"text": "{TITLE}", "url_tags": "{TAG}"}`. |
| `descriptions`<br><br>type: array of objects | **Optional.**<br><br>Array of secondary description text, displayed less prominently than bodies or titles. Generally appears next to a link, image, or video. If not specified, Facebook scrapes the link you provided to generate the description. Use an empty string with single space for blank description, if you do not want to use the scraped text.<br><br>Provide this field as an array of objects, each `{"text": "{DESCRIPTION}", "url_tags": "{TAG}"}`. |
| `link_urls`<br><br>type: array of objects | **Required.**<br><br>Array of link URLs.<br><br>Provide this field as an array of objects, each `{"website_url": "{URL}"}`. |
| `ad_formats`<br><br>type: array of strings | **Required.**<br><br>Array of Facebook ad formats to create the ads in. Supported formats are: `SINGLE_IMAGE`, `CAROUSEL`, `SINGLE_VIDEO`, `AUTOMATIC_FORMAT`.<br><br>Provide this field as an array of strings `["{AD_FORMAT}"]`. |
| `optimization_type`<br><br>type: string | **Optional.** |
| `message_extensions`<br><br>type: array of objects | **Optional.**<br><br>Set the message extension type for website ads. Pass the `message_extensions` property as an inline creative in the `POST /ads` call.<br><br>**Values:** `whatsapp`, `messenger`, `instagram_message` |
| `onsite_destinations`<br><br>type: array of objects | **Required for Shops Ads.** Valid for Static Ads; `SINGLE_IMAGE`, `SINGLE_VIDEO` or `CAROUSEL` format.<br><br>Provide this field as an array of objects containing one of the following values to specify the landing destination for your onsite shop.<br><br>```json
{"storefront_shop_id": "<SHOP_STOREFRONT_ID>"}
or
{"shop_collection_product_set_id": "<PRODUCT_SET_ID>"}
or
{"details_page_product_id": "<PRODUCT_ID>"}
``` |
| `shops_bundle`<br><br>type: boolean | **Required for Shops Ads.** Valid for Advantage+ Catalog Ads.<br><br>Provide this field for shop optimization. Includes both `reasons_to_shop` and `automated_product_tags` shop optimization types.<br><br>Possible values: `true`, `false` |
| `reasons_to_shop`<br><br>type: boolean | **Required for Shops Ads.** Valid for Advantage+ Catalog Ads.<br><br>Provide this field for shop optimization. Automatically highlights product information from your shop, like "Free shipping", "Trending" or "Low stock".<br><br>Possible values: `true`, `false` |

## Asset feed spec restrictions {#restrictions}

**Ad Formats**

- Supported `ad_formats`: `SINGLE_IMAGE`, `CAROUSEL`, `SINGLE_VIDEO`, and `AUTOMATIC_FORMAT`.
- Only one `ad_format` is allowed per asset feed.
- `ad_format` counts as one asset in an asset feed.

**Number of Assets**:

- Maximum of 30 total assets. For example, you have 28 assets with 10 `images`, 5 `bodies`, 5 `titles`, 5 `description`, 1 `ad_format`, 1 `link_url`, and 1 `call_to_action_types`.
- Total number of images: <= 10.
- Total number of videos: <= 10. If you use Instagram as your placement, only square videos or landscape videos allowed.
- Total number of bodies: <= 5.
- Total number of call-to-actions:  <= 5.
- Total number of titles: <= 5.
- Total number of links: <= 5.
- Total number of descriptions: <= 5.

**Image requirements**:

* Recommended image specs: 1.9:1.
* Recommended [image size](https://www.facebook.com/business/ads-guide/clicks-to-website/links?toggle0=Photo): 1,200 x 628 pixels.
* For `CAROUSEL_IMAGE` format, you must provide at least 2 images.
* If you use Instagram as your placement, use square images for better performance.

**Text requirements**:

* Title and description text: maximum length of 255 characters.
* Body text: maximum length of 1024 characters.
* If you do not specify any description, Facebook scrapes the link you provided to retrieve a description.
* For `CAROUSEL_IMAGE`, titles are optional.

`url_tags` are optional and only available for `images`, `videos`, `bodies`, `descriptions`, and `titles`. Facebook appends `url_tags` to the link URL as parameters for each asset in an ad.

For example, a valid asset feed combination setup for `SINGLE_IMAGE` format is:

*    5 `images`
*    3 `bodies`
*    3 `titles`
*    3 `descriptions`
*    1 format: `SINGLE_IMAGE`
*    2 `link_urls`

```json
"link_urls=[{'website_url':'<WEBSITE_URL>'}, {'website_url':'<WEBSITE_URL>'}]"
```

## Use deep links {#deep}

You can use deep links in asset feed specs for campaigns with the following objectives:

* `APP_INSTALLS`
* `CONVERSIONS`
* `LINK_CLICKS`

Add `deeplink_url` in `link_urls` when you create your `asset_feed_spec`.

```bash
curl \
  -F 'object_story_spec={
    "page_id": "<PAGE_ID>"
    "instagram_user_id" : "<IG_USER_ID>",
  }' \
  -F "asset_feed_spec={
    'images': [{'hash':'<IMAGE_HASH>'}],
    'bodies': [{'text':'<BODY_1>'}, {'text':'<BODY_2>'}],
    'titles': [{'text':'<TITLE_1>'}, {'text':'<TITLE_2>'}],
    'descriptions': [{'text':'<DESCRIPTION>'}],
    'ad_formats': ['SINGLE_IMAGE'],
    'link_urls': [{'website_url':'<APP_OBJECT_STORE_URL>','deeplink_url':'<DEEPLINK_URL>'}]}" \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

## Website ads that click to message

You can use the `message_extensions` property to create ads that can guide potential customers from your website to a direct WhatsApp, Messenger, or Instagram conversation with your business. When customers click on the ad from a mobile device, your website opens in an in-app browser for Facebook and Instagram. At the bottom of the page, customers see a footer with a button to redirect to your specified messaging destination and can click on it to have a conversation with you about your products or services.

**Note:** This only works for ads that were created with an ad set `destination_type: WEBSITE` or `UNDEFINED`.

Add the `message_extensions` parameter and pass it inline via the [ad creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative) object. For example, to create a website to WhatsApp ad:

```bash
curl -X POST \
  -F 'access_token=<ACCESS_TOKEN>' \
  -F 'name=<AD_NAME>' \
  -F 'adset_id=<ADSET_ID>' \
  -F 'creative={"object_story_spec":{"page_id":"<PAGE_ID>","link_data":{"image_hash":"<IMAGE_HASH>","link":"<BUSINESS_URL>","message":"Visit our website!","call_to_action":{"type":"LEARN_MORE","value":{"link":"<BUSINESS_URL>"}}}},"asset_feed_spec":{"message_extensions":[{"type":"whatsapp"}]}}' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads
```

To create a website to Messenger ad, update `message_extensions` to `[{"type":"messenger"}]`.

To create a website to Instagram Direct ad, update `message_extensions` to `[{"type":"instagram_message"}]`.

On success, your app receives a JSON response with the ID of your newly created ad.

```json
{
  "id": "<AD_ID>"
}
```

To verify that you have successfully created a website ad that clicks to message, make a GET request to `/<AD_ID>`:

```bash
curl -G "https://graph.facebook.com/v25.0/<AD_ID>" \
  -d "access_token=<ACCESS_TOKEN>" \
  -d "fields=name,status,creative{asset_feed_spec},adset{destination_type}"
```

The response should contain `creative.asset_feed_spec.message_extensions: [{"type": "whatsapp"}]` and `adset.destination_type: "WEBSITE"` or `"UNDEFINED"`.

For a complete step-by-step guide including campaign and ad set creation, supported objectives by channel, and how to identify website ads that click to message, see [Website ads that click to message](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/messaging-ads/website-ads-click-to-message).
