<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/ad-creative-video-data | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Ad Creative Video Data

Video Data is one field within the creative that is used to create video ads. The **Reading** section of this document outlines the specific fields within Video Data. While you cannot create a Video Data object on its own, you would nest the call within an ad creative creation call.

### Create Examples

Create a Video Page Like ad

## Reading

The specification for a video ad.

### Parameters

This endpoint doesn't have any parameters.

### Fields

| Field | Description |
| --- | --- |
| `additional_image_index`int32 | The index (zero based) of the image from the additional images array to use as the ad image for a [dynamic product ad ](https://developers.facebook.com/docs/marketing-api/dynamic-product-ads/ads-management/) [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `branded_content_shared_to_sponsor_status`string | The branded content shared to sponsor option. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `branded_content_sponsor_page_id`numeric string | The branded content sponsor page id. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `branded_content_sponsor_relationship`string | The branded content sponsor relationship option. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `call_to_action`[AdCreativeLinkDataCallToAction](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-link-data-call-to-action/) | An optional call to action. Additionally you can specify a `LIKE_PAGE` call to action when the ad is in a PAGE_LIKES campaign. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `caption_ids`list<numeric string> | The caption ids of the videos. |
| `collection_thumbnails`list<AdCreativeCollectionThumbnailInfo> | List of Canvas media component IDs and their square cropping information provided by the advertiser for Collection style feed rendering. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `customization_rules_spec`list<AdCustomizationRuleSpec> | Customization rules for a dynamic ad [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `image_hash`string | Hash of an image in your image library with Facebook to use as thumbnail [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `image_url`string | URL of image to use as thumbnail. You should not use image URLs returned from the FB CDN but instead have the image hosted on your own servers. The image specified at the URL will be saved into the ad accounts [image library](https://developers.facebook.com/docs/marketing-api/reference/ad-image) [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `link_description`string | Link description of the video. Overwrites the description in the video post on Facebook. You need to specify a call to action to use this field. Note that this field cannot be used with `LIKE_PAGE` call to action. See [post](https://developers.facebook.com/docs/graph-api/reference/post) for more info. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `message`string | The main body of the video post. See [post](https://developers.facebook.com/docs/graph-api/reference/post) for more info. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `offer_id`numeric string | The id of a Facebook native offer. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `page_welcome_message`string | A welcome text from page to user on Messenger once a user performs send message action on an ad. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `post_click_configuration`AdCreativePostClickConfiguration | Customized contents provided by the advertiser for an ad post-click experience. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `retailer_item_ids`list<string> | List of product IDs provided by the advertiser for Collections [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `targeting`[Targeting](https://developers.facebook.com/docs/marketing-api/reference/targeting/) | The post gating for the video. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `title`string | The title of the video. This cannot be used with `LIKE_PAGE` call to action. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `video_id`numeric string | ID of video that user has permission to or a video in ad account [video library](https://developers.facebook.com/docs/marketing-api/advideo/). [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.
