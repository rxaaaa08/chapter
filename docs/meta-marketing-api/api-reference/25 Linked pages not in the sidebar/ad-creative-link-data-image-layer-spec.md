<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/ad-creative-link-data-image-layer-spec | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Ad Creative Link Data Image Layer Spec

## Reading

How to render text and frame overlays on an image for a dynamic item in [Dynamic Ads](https://developers.facebook.com/docs/marketing-api/dynamic-product-ads/ads-management/)

### Example

[Graph API Explorer**](https://developers.facebook.com/tools/explorer/?method=GET&path=...%3Ffields%3D%257Bfieldname_of_type_AdCreativeLinkDataImageLayerSpec%257D&version=v26.0)

```
GET v26.0/...?fields={fieldname_of_type_AdCreativeLinkDataImageLayerSpec} HTTP/1.1
Host: graph.facebook.com
```

```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '...?fields={fieldname_of_type_AdCreativeLinkDataImageLayerSpec}',
    '{access-token}'
  );
} catch(Facebook\Exceptions\FacebookResponseException $e) {
  echo 'Graph returned an error: ' . $e->getMessage();
  exit;
} catch(Facebook\Exceptions\FacebookSDKException $e) {
  echo 'Facebook SDK returned an error: ' . $e->getMessage();
  exit;
}
$graphNode = $response->getGraphNode();
/* handle the result */
```

```
/* make the API call */
FB.api(
    "...?fields={fieldname_of_type_AdCreativeLinkDataImageLayerSpec}",
    function (response) {
      if (response && !response.error) {
        /* handle the result */
      }
    }
);
```

```
/* make the API call */
new GraphRequest(
    AccessToken.getCurrentAccessToken(),
    "...?fields={fieldname_of_type_AdCreativeLinkDataImageLayerSpec}",
    null,
    HttpMethod.GET,
    new GraphRequest.Callback() {
        public void onCompleted(GraphResponse response) {
            /* handle the result */
        }
    }
).executeAsync();
```

```
/* make the API call */
FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc]
                               initWithGraphPath:@"...?fields={fieldname_of_type_AdCreativeLinkDataImageLayerSpec}"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api/).

### Parameters

This endpoint doesn't have any parameters.

### Fields

| Field | Description |
| --- | --- |
| `blending_mode`enum {lighten, multiply, normal} | Combine the product image and frame image together using a certain blend mode. This field is only valid for `frame_overlay`. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `content`AdCreativeLinkDataImageTextOverlayContent | The content of `text_overlay`. It includes five fields, `type`, `price`, `low_price`, `high_price` and `auto_show_enroll_status`. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `frame_auto_show_enroll_status`enum | This field indicates whether the ad is eligible for frame overlay automation which could conditionally not display frame for some users if it predicts that doing so would increase ad engagement. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `frame_image_hash`string | The hash string for a frame image that you can use in creatives.This field is required for `frame_overlay`. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `frame_source`enum {custom} | The source of the frame image. Currently, we only support `custom`. This field is required for `frame_overlay`. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `image_source`enum {catalog} | The source of the product image. Currently, we only support `catalog`. This field is required for `image` layer. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `layer_type`enum {frame_overlay, image, text_overlay} | Each layer can be a layer of `image`, `frame_overlay` or `text_overlay`. This field is required for each layer. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `opacity`int32 | The opacity of the text or frame image. This field is valid for both `text_overlay` and `frame_overlay`For text, the valid values are `75` and `100`, For frame image, the valid value is from `10` to `100`. The bigger number means more opaque. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `overlay_position`enum {bottom, bottom_left, bottom_right, center, left, right, top, top_left, top_right} | Position for overlay on an image. This field is valid for both `text_overlay` and `frame_overlay` [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `overlay_shape`enum {circle, none, pill, rectangle, triangle} | The background shape of `text_overlay`. The value `none` means no shape underneath the text. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `scale`int32 | The scale resizes the frame image by multiples of ten from `10` to `100`. `100` means the original size of frame image, `10` means the smallest size.This field is only valid for `frame_overlay`. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `shape_color`string | The color of the background in `text_overlay`. It should be represented as a three-digit or six-digit hexadecimal number. For example, `09C`, `FFFFFF`. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `text_color`string | The color of the text in `text_overlay`. It should be represented as a three-digit or six-digit hexadecimal number. For example, `09C`, `FFFFFF`. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `text_font`enum {droid_serif_regular, lato_regular, noto_sans_regular, nunito_sans_bold, open_sans_bold, open_sans_condensed_bold, pt_serif_bold, roboto_condensed_regular, roboto_medium} | Font type for text strings. If you choose a text font which does not support the language you are using, it will fallback to the default font.This field is only valid for `text_overlay`. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.
