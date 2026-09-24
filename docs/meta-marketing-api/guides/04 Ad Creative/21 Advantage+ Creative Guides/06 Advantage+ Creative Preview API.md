<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/creative-preview | Saved: 2026-09-19 -->

# Standard Enhancements Preview



**Warning:** Starting with Marketing API v22.0, previews for [standard enhancements](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/standard-enhancements) will no longer be available. Instead, you can get the previews of individual Advantage+ Creative features by following the instructions in [Get Started with Advantage+ Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative/advantage-creative/get-started).

The sub-features within the standard enhancement bundle for single image ads include `image_template`, `image_touchups`, `text_optimizations`, and `inline_comment`. For single video ads, the sub-features are `video_auto_crop`, `text_optimizations`, and `inline_comment`.

The Advantage+ Creative Preview API supports generating previews for ads both before and after publishing the ad.

* Provide the creative ID or ad ID to see previews of published ads
* Provide the creative spec to see previews of unpublished ads

## Existing functionality

See the [Ad Preview documentation](https://developers.facebook.com/docs/marketing-api/generatepreview/v15.0) for more information on the existing functionality.

- Provide the creative or ad ID and placement
```html
curl -X GET \
-d 'ad_format="DESKTOP_FEED_STANDARD"' \
-d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<CREATIVE_ID>/previews
```

- Receive the iframe response.
```json
{
"data": [
{
"body": "<PREVIEW_LINK>",
}
]
}
```

- Click on the link to see the previews.

## Updated functionality

- Provide the creative or ad ID and placement **with new parameters**.
```html
curl -X GET \
-d 'ad_format="DESKTOP_FEED_STANDARD"' \
-d 'access_token=<ACCESS_TOKEN>' \
-d 'creative_feature=standard_enhancements'\
https://graph.facebook.com/v25.0/<CREATIVE_ID>/previews
```

- Receive the iframe response.
```json
{
"data": [
{
"body": "<preview link>",
"transformation_spec": {
"standard_enhancements": [
{
"body": "<preview link>",
"optimization_type_description": "Vary image aspect ratio",
"status": "eligible"
},
{
"body": "<preview link>",
"optimization_type_description": "Image templates for Feed",
"status": "eligible"
}
]
}    }
]
}
```

- Click on the link to see the previews.

### Parameters

See the [Ad Preview documentation](https://developers.facebook.com/docs/marketing-api/generatepreview/v16.0) for existing parameters. New parameters are listed below.

| Name | Description |
| --- | --- |
| `creative_feature` | The Creative feature to apply to the preview.  <br>**Possible values:** `standard_enhancements` |

### Limitations

* Advantage+ Creative previews are currently only supported on the `MOBILE_FEED_STANDARD`, `INSTAGRAM_STANDARD`, `INSTAGRAM_REELS` and `INSTAGRAM_STORY` placements.

* Image ad previews on `MOBILE_FEED_STANDARD` may appear cropped, even without manual crops, because the placement supports a limited range of aspect ratios. See [Aspect ratios supported by placements in Meta Ads Manager](https://www.facebook.com/business/help/682655495435254?id=271710926837064&helpref=faq_content) for more information about aspect ratio support for each placement.

* The following transformations in Standard Enhancements do not have preview support:
    * Inline Comment
    * Text Liquidity
