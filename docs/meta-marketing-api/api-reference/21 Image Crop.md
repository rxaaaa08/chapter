<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/image-crops | Saved: 2026-09-19 -->

# Image Crops



Provide aspect ratios for images in different ad placements. Facebook crops your image to the specifications you provide. If you provide no cropping, Facebook displays the image using its defaults. See [Ad Image](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-image). For example, upload an image to use in ad creative:

```bash
curl \
  -F 'filename=@<IMAGE_PATH>' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adimages
```

Then, provide ad creative by referencing the image hash returned in the previous call along with cropping.

```bash
curl -X POST \
  -F 'name="Image crop creative"' \
  -F 'object_story_spec={
       "page_id": "<PAGE_ID>",
       "link_data": {
         "image_crops": {
           "100x100": [[0,0],[100,100]]
         },
         "image_hash": "<IMAGE_HASH>",
         "link": "<URL>",
         "message": "<AD_MESSAGE>"
       }
     }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

Crops contains key-value pairs, where the key is a `crop key` and value is the pixel dimensions of the crop. For all supported keys, see [Ads Image Crops Reference](https://developers.facebook.com/docs/marketing-api/reference/ads-image-crops).

Provide value as `(x, y)` coordinates for the upper-left and bottom-right corners of the cropping rectangle. `crop key` describes an aspect ratio. The aspect ratio of the box specified by width and height must be as close as possible to the aspect ratio in `crop key`.

An image's origin `(0, 0)` is at the upper-left corner. The point, `(width - 1, height - 1)` is at the bottom-right corner.

## Specification {#requirements}

When you use this feature, **provide cropping for all placements where an ad may appear**. For example, if you provide cropping for the Right Hand Column and you also want to use the ad in News Feed, provide cropping for the News Feed placement.

## Limitations {#limits}

Image crops are only supported for ad creatives with `image_file` or `image_hash`. `Page posts` are not supported. Values must adhere to these constraints:

* Points specified by `(x, y)` must lie within the image. A rectangle that extends beyond the bounds of the image is invalid.
* The rectangle must be the same aspect ratio as specified by the crop key.
* Coordinates cannot contain negative values.
* Facebook Stories do not support image crops.

For example:

```
Example:{"100x100": [ [330, 67], [1080, 817] ]}
```

