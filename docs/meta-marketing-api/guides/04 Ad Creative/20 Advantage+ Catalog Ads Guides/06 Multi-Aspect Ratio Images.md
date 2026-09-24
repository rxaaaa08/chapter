<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/multi-ratio-images | Saved: 2026-09-19 -->

# Managing Multiple Aspect Ratio Images in Advantage+ Catalog Ads



Catalog feed supports uploading multiple images for one product, and there are different options to select which image is going to be displayed to the customer.

## Image selection by tag

You can use image tags in your feed to select the image you want to display. Some tags are automatically matched based on the placement of the ads.

* `INSTAGRAM_PREFERRED`: Used on Instagram (e.g., to display different images between Instagram and Facebook)
* `STORY_PREFERRED`: Used for Facebook and Instagram Stories (9:16 ratio)
* `REELS_PREFERRED`: Used for Facebook and Instagram reels (9:16 ratio)
* `ASPECT_RATIO_4_5_PREFERRED`: Used if the placement is eligible to display 4:5 images
* `ASPECT_RATIO_9_16_PREFERRED`: Used if the placement is eligible to display 9:16 images

There are 2 different tags for 9:16 placements because the safe zone for Stories and Reels is different and you may want to upload different 9:16 images for each placement.

You can also use custom tags (for example, to select different images depending on the ad displayed) using the [`preferred_image_tags` parameter](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-link-data).

Other legacy image selections, such as by index, are discouraged and will be eventually removed.

## 9:16 aspect ratio images

9:16 aspect ratio images can be displayed full screen to customers on Stories and Reels for carousel and single image ads.

To activate the full screen display, you need to activate the **Adapt to placement** option in the Advantage+ catalog ads optimizations in Ads Manager or use the [`adapt_to_placement` field](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-creative-for-catalog) in the `creative_spec` parameter.

When adapt to placement is activated, the system searches all images of your product to find a matching one for 9:16 placements. For example, if you have a 1:1 image and 9:16 image, 9:16 placements use the 9:16 image. Review the 9:16 images available in your catalog before activating the option.

You can also use tags in your feed to select the image yourself if you have multiple 9:16 images. The tagged image must be 9:16 aspect-ratio to be selected (otherwise the first available 9:16 image is used, if one exists).

Once activated, adapt to placement also provides an option to deactivate the showcase card in Instagram Stories, which displays a thumbnail of 4 products in one card, in order to display the first selected product full screen instead.

**Note:** On Stories, the title and caption of the product are currently not displayed if the image is displayed full screen.

### Fallback

If you activate the adapt to placement option and none of the products to be displayed in the carousel have 9:16 images, the default display is used. If at least one of the products has a 9:16 image, the rest of the image is filled with the image background color.

## `preferred_image_tags` multi-ratio support

You can combine the selection of different images for different ads with multi-ratio support. Instead of providing a simple tag, you can replace the tag with serialized (and escaped) JSON that may provide different tags for different aspect ratios.

The deserialized JSON should be this format (each ratio is optional):

```json
{
 "DEFAULT":"my-tag",
 "4_5":"my-tag-4-5",
 "9_16":"my-tag-9-16"
}
```

**Example**

```json
preferred_image_tags: ["{\"DEFAULT\":\"my_default_tag_1\",\"9_16\":\"my_9_16_tag_1\"}","{\"DEFAULT\":\"my_default_tag_2\",\"9_16\":\"my_9_16_tag_2\"}"]
```

In this case, 9:16 placements use an image with tag `my_9_16_tag_1` or `my_9_16_tag_2`, and other placements use an image with `my_default_tag_1` or `my_default_tag_2`.
