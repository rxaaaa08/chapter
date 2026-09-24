<!-- Source: https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/advantage-catalog-ads | Saved: 2026-09-19 -->

# Instagram Advantage+ Catalog Ads



[Advantage+ catalog ads](https://developers.facebook.com/docs/marketing-api/dynamic-ads) are available for Instagram. You can use custom audiences targeting to reach people who visited or engaged on your website.

To create a [template creative](https://developers.facebook.com/docs/marketing-api/dynamic-ads/get-started#adtemplate) for [Advantage+ catalog ads](https://developers.facebook.com/docs/marketing-api/dynamic-product-ads) or [travel ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/travel-ads), set `template_data` under `object_story_spec`. We support Advantage+ catalog ads on Instagram Feed, Stories, and Explore.

## Get Started

The default image is specified by the `image_url` of each product or other images in `additonal_image_urls`. If `additional_image_index` is set in the ad template, the creative needs to be 600px or more in both width and height. If the image is not square, it will be cropped when displayed.

The `name`, which you can use with the carousel format only, and `message` for `template_data` are under the product image. The `description` does not appear on Instagram, only on Facebook.

Using `call_to_action` for `template_data` is optional. If it is not provided, a **Learn More** button will be created by default with the URL of the product shown.

## Limitations

We deliver Advantage+ catalog ads for Facebook Feed on Instagram, even if they use certain features. *However some features do not appear:*

* [Creative tools and overlays](https://www.facebook.com/business/help/517601898571657)
* [Fixed cards](https://www.facebook.com/business/help/127241278196607) at the end of your ad

We do not deliver Advantage+ catalog ads for Facebook Feed on Instagram Stories if they contain:

* Map cards
* Videos from catalog
* Category cards
* Collections
* Ad campaign `objective` is `STORE_VISITS`

Because each Instagram post is dynamically generated, [you cannot get the `instagram_permalink_url` and `effective_instagram_media_id` of the ad creative template](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/post-moderation#comments-restrictions). That means that you cannot get the likes and comments of your Advantage+ catalog ad posts on Instagram.

## Resources

- Business Help Center: [Customize the Creative in an Advantage+ catalog ad](https://www.facebook.com/business/help/517601898571657)
