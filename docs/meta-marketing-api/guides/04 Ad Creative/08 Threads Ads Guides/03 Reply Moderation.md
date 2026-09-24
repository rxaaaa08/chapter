<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/threads-ads/reply-moderation | Saved: 2026-09-19 -->

# Threads Ads Reply Moderation



Reply moderation lets you manage the conversation on your Threads ads by reading replies, hiding inappropriate content, and adding your own replies. For general information about advertising on Threads, see the [Threads Ads overview](https://developers.facebook.com/docs/threads/threads-ads).

### Limitations {#limitations}

* Only direct replies to ad media are supported for both fetching and replying. Nested replies (replies to replies) are not available through either operation.
* Only text replies can be added. Image, video, and carousel replies are not supported.
* Supported ad types include single image ads, single video ads, carousel ads, Placement Asset Customization ads, static posts, and existing posts.
* Unsupported ad types are Advantage+ catalog ads and boosted posts as well as ads created by Instagram-backed and Page-backed Threads accounts.

## Before you begin

You will need:

* A Meta app with the Marketing API product enabled
* An ad account with an active Threads ad
* An ad of one of the supported ad types (see [Limitations](#limitations))

### Permissions

These permissions are required for the ad account that owns the ad:

* `ads_read` — for reading ad media and replies
* `ads_management` — for hiding and adding replies

## Retrieve a Threads ad's media

To retrieve a Threads ad's media and associated metadata, send a `GET` request to the `/{media-id}` endpoint with a comma-separated `fields` parameter to specify which fields to return.

### Fields

| Name | Description |
| --- | --- |
| `id`<br><br>string | The Threads media ID. |
| `caption`<br><br>string | The text associated with the media. |
| `like_count`<br><br>integer | The number of likes on the media. |
| `username`<br><br>string | The username of the media owner. |
| `reply_count`<br><br>integer | For replies, the number of direct replies. For parent media, the total number of nested replies. |
| `share_count`<br><br>integer | The number of shares. |
| `quote_count`<br><br>integer | The number of quotes. |
| `repost_count`<br><br>integer | The number of reposts. |
| `hide_status`<br><br>string | The hide status of the reply.  <br>**Values:** `HUSHED`, `UNHUSHED`. |
| `timestamp`<br><br>string | The time the media was created, in ISO 8601 format. |
| `media_url`<br><br>string | The CDN URL for the media image or video. |
| `media_type`<br><br>string | The media type.  <br>**Values:** `IMAGE`, `VIDEO`, `CAROUSEL`. |
| `gif_url`<br><br>string | The CDN URL of an attached GIF, if available. |
| `owner_profile_pic`<br><br>string | The CDN URL for the owner's profile picture. |
| `is_owner_verified`<br><br>Boolean | Whether the media owner's account is verified. |

### Example request

```html
curl -X GET "https://graph.facebook.com/v24.0/<MEDIA_ID>/?fields=id,caption,like_count,username,reply_count,hide_status,timestamp,media_type&access_token=<ACCESS_TOKEN>"
```

### Example response

```json
{
  "id": "18106042978723008",
  "caption": "Check out our latest product!",
  "like_count": 42,
  "username": "mybrand",
  "reply_count": 5,
  "hide_status": "UNHUSHED",
  "timestamp": "2025-11-18T23:52:47+0000",
  "media_type": "IMAGE"
}
```

## Retrieve a Threads ad's replies

To retrieve the direct replies to a Threads ad's media, send a `GET` request to the `/{media-id}/replies` endpoint, with a comma-separated `fields` parameter to specify which fields to return.

### Fields

| Name | Description |
| --- | --- |
| `id`<br><br>string | The Threads media ID. |
| `caption`<br><br>string | The text associated with the reply. |
| `like_count`<br><br>integer | The number of likes on the reply. |
| `username`<br><br>string | The username of the reply author. |
| `reply_count`<br><br>integer | The number of direct replies to this reply. |
| `share_count`<br><br>integer | The number of shares. |
| `quote_count`<br><br>integer | The number of quotes. |
| `repost_count`<br><br>integer | The number of reposts. |
| `hide_status`<br><br>string | The hide status of the reply.  <br>**Values:** `HUSHED`, `UNHUSHED`. |
| `timestamp`<br><br>string | The time the reply was created, in ISO 8601 format. |
| `media_url`<br><br>string | The CDN URL for the reply's media image or video, if available. |
| `media_type`<br><br>string | The media type.  <br>**Values:** `IMAGE`, `VIDEO`, `CAROUSEL`. |
| `gif_url`<br><br>string | The CDN URL of an attached GIF, if available. |
| `owner_profile_pic`<br><br>string | The CDN URL for the reply author's profile picture. |
| `is_owner_verified`<br><br>Boolean | Whether the reply author's account is verified. |

### Example request

```html
curl -X GET "https://graph.facebook.com/v24.0/<MEDIA_ID>/replies?fields=id,caption,username,like_count,hide_status,timestamp&access_token=<ACCESS_TOKEN>"
```

### Example response

```json
{
  "data": [
    {
      "id": "18106042978723009",
      "caption": "Love this!",
      "username": "user123",
      "like_count": 3,
      "hide_status": "UNHUSHED",
      "timestamp": "2025-11-19T01:15:22+0000"
    },
    {
      "id": "18106042978723010",
      "caption": "Where can I buy this?",
      "username": "user456",
      "like_count": 1,
      "hide_status": "UNHUSHED",
      "timestamp": "2025-11-19T02:30:45+0000"
    }
  ]
}
```

## Hide or unhide replies on a Threads ad

To hide or unhide a reply on your Threads ad, send a `POST` request to the `/{reply-id}/manage_reply` endpoint. Hiding a reply removes it from public view but does not delete it.

**Note:** Your app must have the `ads_management` permission to use this endpoint.

### Parameters

| Name | Description |
| --- | --- |
| `hide`<br><br>Boolean | **Required.**  <br>Set to `true` to hide the reply or `false` to unhide it. |

### Response fields

| Name | Description |
| --- | --- |
| `success`<br><br>Boolean | Returns `true` if the reply was successfully hidden or unhidden. |

### Example request

```html
curl -X POST "https://graph.facebook.com/v24.0/<REPLY_ID>/manage_reply" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d "hide=true"
```

### Example response

```json
{
  "success": true
}
```

## Add replies to a Threads ad

To add a text reply to your Threads ad, send a `POST` request to the `/{reply-id}/add_reply` endpoint. Only text replies are supported.

**Note:** Your app must have the `ads_management` permission to use this endpoint.

### Parameters

| Name | Description |
| --- | --- |
| `text`<br><br>string | **Required.**  <br>The text content of your reply. |

### Response fields

| Name | Description |
| --- | --- |
| `id`<br><br>string | The ID of the newly created reply. |

### Example request

```html
curl -X POST "https://graph.facebook.com/v24.0/<REPLY_ID>/add_reply" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d "text=Thanks for your interest! Check out our website for more info."
```

### Example response

```json
{
  "id": "18106042978723011"
}
```

## Learn more

* [Threads Ads overview](https://developers.facebook.com/docs/threads/threads-ads)
* [Threads API changelog](https://developers.facebook.com/docs/threads/changelog)
* [Marketing API permissions](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/authorization)
