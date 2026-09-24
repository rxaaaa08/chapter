<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/ad-creative-photo-data | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Ad Creative Photo Data

Photo Data is one field within the creative that is used to create photo ads. The **Reading** section of this document outlines the specific fields within Photo Data. While you cannot create a Photo Data object on its own, you would nest the call within an ad creative creation call.

**Note** - `image_crops` is supported with `link_data` but not with `photo_data`. This is because Facebook typically renders images from photo posts in full. Facebook also automatically crops based on algoritms designed to improve feed experience. If this is not sufficient, crop your image using image editing software or use link posts.

### Create Examples

Create a Photo Ad with utilizing branded content from another page

## Reading

The specification for a photo ad

### Parameters

This endpoint doesn't have any parameters.

### Fields

| Field | Description |
| --- | --- |
| `branded_content_shared_to_sponsor_status`string | The branded content shared to sponsor option [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `branded_content_sponsor_page_id`numeric string | The branded content sponsor page ID. If your ad promotes branded content, you must use this to indicate the sponsor page. See [policy](https://www.facebook.com/policies/ads/#restricted_content). Your sponsor will be notified and can create an ad using your post. Your sponsor can also see metrics about your ad, including total spend and CPM metrics [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `branded_content_sponsor_relationship`string | The branded content sponsor relationship option [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `caption`string | The description of the image [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `image_hash`string | Hash of an image in your image library with Facebook. Specify this field or `url` but not both. See [Ad Image](https://developers.facebook.com/docs/marketing-api/reference/ad-image) [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `page_welcome_message`string | A welcome text from page to user on Messenger once a user performs send message action on an ad [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `url`string | URL of an image to use in the ad. Specify this field or `image_hash` but not both. The image specified at the URL will be saved into the ad accounts [image library](https://developers.facebook.com/docs/marketing-api/reference/ad-image) [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.
