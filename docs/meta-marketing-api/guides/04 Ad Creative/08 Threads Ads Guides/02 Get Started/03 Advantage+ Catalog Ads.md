<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/threads-ads/creation/advantage-catalog-ads | Saved: 2026-09-19 -->

# Threads Advantage+ Catalog Ads



[Advantage+ catalog ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/get-started) are available for Threads. To ensure an Advantage+ Catalog Ad is delivered to Threads, include both `instagram` and `threads` under `publisher_platforms` in your ad set. Then, use the Threads `threads_stream` placement; remember you must select the Instagram `stream` placement too.

To create a [template creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/get-started#step-3--provide-an-ad-creative) for [Advantage+ catalog ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads) on Threads, set `template_data` under `object_story_spec` for `threads_stream`. Also, ensure that you specify the `product_set_id` in `promoted_object` for your ad set level to promote products from that product set.

### Limitations

* Images and image carousels are the only supported creative formats for Advantage+ catalog ads at this time. [Slideshow, video, and static cards](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/get-started#build-a-template-creative) are not currently supported.
* Ad engagement (reply, quote, save, share) is disabled for Advantage+ catalog ads in Threads at this time.
* `OUTCOME_APP_PROMOTION` is not a supported objective at this time.

## Create a Threads Advantage+ catalog ad creative

* See the [media requirements](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/threads-ads/creation#media-requirements) for supported image specifications.
* See the [ad creative creation section for Advantage+ catalog ad creatives](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/get-started#step-3--provide-an-ad-creative) for more information on the parameters and parameter descriptions for Threads Advantage+ catalog ad creation. All parameters are supported and expect the same behavior for Threads as Instagram but note the special behavior:
    * Threads Advantage+ catalog ads will not render catalog product videos and will always default to catalog product images.
    * Threads Advantage+ catalog ads always follow the behavior of looking for the images in a category, and then defaulting to the 2x2 collage.
    * Advantage+ catalog ads with static cards before all the Advantage+ catalog ads (also known as entry cards) will not be delivered to Threads. Advantage+ catalog ads with static cards after all the Advantage+ catalog ads will be delivered to Threads, but the static cards will not be displayed.
    * Threads Advantage+ catalog ads will always default to single image and image carousel, even for catalogs with videos and with the format option as video or slideshow.

### Parameters

| Name | Description of Threads Behavior |
| --- | --- |
| `child_attachments`  <br>([Advantage+ Catalog Ad Creation](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/get-started#build-a-template-creative)) | Static cards appearing before all Advantage+ catalog ads will cause the ad to not be delivered to Threads. Ads with the static card appearing after the ads will still deliver to Threads. |
| `preferred_video_tags`  <br>([Advantage+ Catalog Ad Creation](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/get-started#build-a-template-creative)) | Won't be used as Threads Advantage+ catalog ads will not render catalog product videos and will always default to catalog product images. |
| `format_option`  <br>([Allow product video](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/allow-product-video#create-ads-with-product-video)) | When the format is `single_video`, the ad will deliver on Threads as a single image. When the format is `carousel_slideshows` all items in the slideshow will render as static images instead. When the format is `collection_video`, all items in the slideshow will render as static images instead. The `carousel_images_single_item` and `carousel_images_multi_items` formats will be rendered as expected (as static image and image carousel, respectively). |
| `media_type_automation`  <br>([Allow product video](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/allow-product-video#create-ads-with-product-video)) | Even when `media_type_automation` is set to `OPT_IN`, Threads Advantage+ catalog ads will not render catalog product videos and will always default to catalog product images. |

### Example request

The `product` variable in the request below is a [template parameter](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/get-started#use-product-feed-data-in-your-template) which makes it possible to use the product feed data in the template.

```bash
curl \
  -F 'name=Advantage+ Catalog Ads Template Creative Sample' \
  -F 'object_story_spec={
    "instagram_user_id": "<IG_USER_ID>",
    "threads_user_id": "<THREADS_USER_ID>",
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

### Example response

The response to this call is the ID of a new Advantage+ catalog ads template creative.

```json
{
  "id":"<AD_CREATIVE_ID>"
}
```

## Learn more

* [Advantage+ Catalog Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads)
* [Advantage+ Catalog Ads - Get Started](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/get-started)
* [Instagram Advantage+ Catalog Ads](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/advantage-catalog-ads)
* [Threads Ads Creation: Media Requirements](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/threads-ads/creation#media-requirements)
