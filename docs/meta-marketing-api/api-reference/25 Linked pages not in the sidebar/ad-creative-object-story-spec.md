<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/ad-creative-object-story-spec | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Ad Creative Object Story Spec

## Reading

The specifications of a creative containing the page id and other content to create a new unpublished page post specified using one of `link_data`, `photo_data`, `video_data`, `text_data` or `template_data`.

### Parameters

This endpoint doesn't have any parameters.

### Fields

| Field | Description |
| --- | --- |
| `instagram_user_id`numeric string | The Instagram user account that the ad will be posted to [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `link_data`[AdCreativeLinkData](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-link-data/) | The spec for a link page post or [carousel ad ](https://developers.facebook.com/docs/marketing-api/guides/carousel-ads/) [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `page_id`numeric string | ID of a Facebook page. An unpublished page post will be created on this page. User must have [Admin or Editor role ](https://www.facebook.com/help/323502271070625/) for this page. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `photo_data`[AdCreativePhotoData](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-photo-data/) | The spec for a photo page post. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `product_data`list<AdCreativeProductData> | The spec for products to enable catalog related experience. |
| `template_data`[AdCreativeLinkData](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-link-data/) | The spec for a template link page post as used in [Dynamic Product Ads](https://developers.facebook.com/docs/marketing-api/dynamic-product-ads/). [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `text_data`[AdCreativeTextData](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-text-data/) | The spec for a text page post. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `video_data`[AdCreativeVideoData](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-video-data/) | The spec for a video page post. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.
