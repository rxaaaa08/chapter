<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/ad-creative-features-spec | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Ad Creative Features Spec

## Reading

Ad Creative Features Spec stores a list of creative transformation features an ad has opted in for, such as Standard Enhancements.

### Parameters

This endpoint doesn't have any parameters.

### Fields

| Field | Description |
| --- | --- |
| `adapt_to_placement`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | **Optional.** <br> This feature is labeled ‘Image touch-ups’ in Ads Manager. Default is opt-in. <br><br> Provide the field `enroll_status` to opt in/out of the feature. <br> **Value:** OPT_IN, OPT_OUT <br><br> `{"enroll_status": "OPT_OUT"}` <br> If you wish to control how the images are adjusted, you can use customizations field to control the settings. See the `aspect_ratio_config` and `image_crop_style` field in [Ad Creative Feature Customizations](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-customizations/) reference documentation for more details. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `add_text_overlay`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | Optional. This feature is labeled ‘Add Dynamic Overlays’ in Ads Manager.Opt-in if you want to add information from catalog items as visually-unique overlays The enroll_status field can be set to OPT_IN or OPT_OUT. If you want to have manual control on how the overlay is rendered, see the [Ad Creative Link Data Image Layer Spec](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-link-data-image-layer-spec/) reference documentation for more details. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `ads_with_benefits`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | ads_with_benefits [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `biz_ai`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | biz_ai [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `creative_stickers`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | creative_stickers [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `customize_product_recommendation`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | customize_product_recommendation [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `description_automation`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | **Optional.** <br> Opt in/opt out of Description Automation. Default is opt-in. <br><br> Provide the field `enroll_status` to opt in/out of description automation. <br> **Value:** OPT_IN, OPT_OUT <br><br> `{"enroll_status": "OPT_OUT"}` [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `fb_feed_tag`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | fb_feed_tag [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `fb_reels_tag`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | fb_reels_tag [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `fb_story_tag`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | fb_story_tag [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `generate_cta`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | generate_cta [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `hide_price`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | hide_price [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `ig_feed_tag`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | ig_feed_tag [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `ig_reels_tag`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | ig_reels_tag [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `ig_stream_tag`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | ig_stream_tag [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `image_animation`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | image_animation [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `image_background_gen`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | image_background_gen [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `image_templates`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | image_templates [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `image_touchups`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | image_touchups [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `inline_comment`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | Opt in/opt out of Relevant comments enhancement. Default is opt-in. Provide the field enroll_status to opt in/out of Relevant comments. Value: OPT_IN, OPT_OUT {"enroll_status": "OPT_OUT"} [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `local_store_extension`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | local_store_extension [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `media_order`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | media order [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `media_type_automation`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | media type automation [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `multi_photo_to_video`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | multi_photo_to_video [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `music_generation`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | music_generation [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `pac_relaxation`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | pac_relaxation [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `product_extensions`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | See [this page](https://developers.facebook.com/docs/marketing-api/advantage-catalog-ads/product-extensions) for full details. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `profile_card`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | profile_card [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `profile_extension`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | profile_extension [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `replace_media_text`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | replace_media_text [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `reveal_details_over_time`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | reveal_details_over_time [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `show_destination_blurbs`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | show_destination_blurbs [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `show_summary`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | show_summary [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `site_extensions`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | site_extensions [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `standard_enhancements`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | See [this page](https://developers.facebook.com/docs/marketing-api/advantage-catalog-ads/standard-enhancements/?locale=en_US&draft=644362790552674) for full details. Enroll in this feature in [AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/). [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `standard_enhancements_catalog`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | standard_enhancements_catalog [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `text_extraction_for_headline`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | text_extraction_for_headline [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `text_extraction_for_tap_target`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | text_extraction_for_tap_target [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `text_optimizations`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | text_optimizations [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `text_overlay_translation`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | text_overlay_translation [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `text_translation`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | text_translation [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `translate_voiceover`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | translate_voiceover [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `video_highlights`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | video_highlights [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `video_to_image`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | video_to_image [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `wa_mm_image_filtering`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | wa_mm_image_filtering [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `wa_mm_text_truncation_length`[AdCreativeFeatureDetails](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details/) | wa_mm_text_truncation_length [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.
