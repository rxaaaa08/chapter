<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-preview-plugin | Saved: 2026-09-19 -->

# Ad Preview Plugin



The Ad Preview plugin is a way for advertisers to preview ads on their own websites.

The plugin enables you to generate Right Hand Column, Feed, or Mobile previews of an ad by specifying a Creative Spec, Adgroup ID, or Creative ID. You can generate previews using either a Social Plugin or the Graph API.

## Parameters {#params}

- Required: One of `creative`, `creative_id`, or `adgroup_id`
- Required: `ad_format`, which replaces `page_type` parameter
- Optional: `ad_account_id`, `targeting`, `post`

The preview plugin requires you to be logged in with Facebook Login. If `creative_id`, `adgroup_id`, or `ad_account_id` is used, you must also have the permissions to access the Creative, Ad Group, or Ad Account respectively.

| Setting | HTML5 Attribute | Description |
| --- | --- | --- |
| `ad_account_id` | `data-ad-account-id` | Required when specifying a creative that uses `image_hash` |
| `adgroup_id` | `data-adgroup-id` | Adgroup ID returned from a Graph API call. |
| `creative` | `data-creative` | JSON-encoded [creative spec](https://developers.facebook.com/docs/reference/ads-api/adcreative). |
| `creative_id` | `data-creative-id` | Creative ID returned from a Graph API call. |
| `ad_format` | `data-ad-format` | One of: `RIGHT_COLUMN_STANDARD`, `DESKTOP_FEED_STANDARD`, `MOBILE_FEED_STANDARD`, or `FACEBOOK_STORY_MOBILE`. |
| `page_type` | `data-page-type` | One of: `rightcolumn`, `desktopfeed`, or `mobile`. |
| `targeting` | `data-targeting` | JSON-encoded [targeting spec](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/advanced-targeting). |
| `post` | `data-post` | JSON-encoded post specification according to the [Pages API documentation](https://developers.facebook.com/docs/graph-api/reference/page). |

## Graph API {#graphapi}

You can also generate previews using the [Graph API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/generatepreview). To generate a plugin-style preview, specify the additional parameter, `ad_format`, as described in the table above.
