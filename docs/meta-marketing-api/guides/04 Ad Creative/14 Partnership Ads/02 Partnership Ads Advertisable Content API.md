<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/content-discovery-api | Saved: 2026-09-19 -->

# Partnership Ads Advertisable Content API



The Partnership Ads Advertisable Content API lets you discover partnership content (branded content, UGC, affiliate posts, collabs, and more) across both Instagram and Facebook from a single endpoint.

## Overview

The Partnership Ads Advertisable Content API replaces the legacy platform-specific endpoints:

- `/{fb-page-id}/advertisable-posts` (Facebook only)
- `/{ig-user-id}/branded_content_advertisable_medias` (Instagram only)

The unified endpoint returns both Instagram media and Facebook posts in a single paginated response, with support for filtering, sorting, field expansion, and organic insights. It exposes the same advertisable content that advertisers browse visually in the [Partnership Ads Hub](https://business.facebook.com/partnership_ads_hub/).

```http
GET /{business-id}/partnership-ads-advertisable-content
  ?fb_page_id=<PAGE_ID>
  &ig_user_id=<IG_USER_ID>
```

## Permissions and authorization

### Required permissions

Your app must have the following permissions granted on the access token:

| Permission | Required? |
| --- | --- |
| `business_management` | **Required.** Grants access to the business's assets. |
| `facebook_branded_content_ads_brand` | **At least one required.** Grants access to Facebook partnership content. If you grant only this scope, the API returns Facebook content only. |
| `instagram_branded_content_ads_brand` | **At least one required.** Grants access to Instagram partnership content. If you grant only this scope, the API returns Instagram content only. Also requires `instagram_basic` on the same Instagram account — granting `instagram_branded_content_ads_brand` without `instagram_basic` returns a 403. |

You must have at least one of the two brand scopes. If you have both, content from both platforms is returned.

### Supported token types

- User access tokens
- System user tokens
- Business person user tokens (MMA)
- Delegated page user tokens

### Additional requirements

- The caller must have any permission on the specified business.
- The caller must have basic admin permission on the specified Facebook Page or Instagram account.
- The specified `fb_page_id` or `ig_user_id` must belong to the business identified by `business_id`.
- If both `fb_page_id` and `ig_user_id` are provided, the accounts must be linked to each other.

## Request parameters

### Required parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `business_id` | int | Path parameter. The advertiser's Meta Business Suite ID. |
| `fb_page_id` | FBID | Brand's Facebook Page ID. **At least one of `fb_page_id` or `ig_user_id` is required.** |
| `ig_user_id` | FBID | Brand's Instagram User ID. **At least one of `fb_page_id` or `ig_user_id` is required.** |

### Filter parameters

All filter parameters are optional. They apply to the **search query** mode only — they cannot be combined with direct lookup parameters.

| Parameter | Type | Description |
| --- | --- | --- |
| `ad_partner_ig_user_ids` | vec\ | Filter to content from specific creator or partner Instagram accounts. |
| `ad_partner_page_ids` | vec\ | Filter to content from specific creator or partner Facebook Pages. |
| `platform_types` | vec\ | `INSTAGRAM` · `FACEBOOK`. If omitted, returns content for every platform your token has a brand scope for. If provided, results are filtered to exactly the requested platforms; requesting a platform your token lacks the brand scope for returns 403. |
| `media_types` | vec\ | `IMAGE` · `VIDEO` · `CAROUSEL` · `LINK` |
| `post_types` | vec\ | `FEED` · `STORY` · `REEL` |
| `content_types` | vec\ | Filter by partnership content type 
`BRANDED_CONTENT` — content posted under a paid partnership label.
`PRODUCT` — content with tagged products.
`AFFILIATE` — affiliate content where the creator earns commission on your products.
`COLLAB_POST` — posts co-authored with your brand (Instagram or Facebook Collab).
`TAGGED` — user-generated content that tags or @mentions your brand.
`REPOSTED` — content you've reposted. |
| `ad_eligibilities` | vec\ | `AD_READY` · `INELIGIBLE` · `NEEDS_ATTENTION` · `EXCLUDED` |
| `ad_usages` | vec\ | `NEVER_USED` · `ACTIVE` · `PREVIOUSLY_USED` |
| `country_codes` | vec\ | ISO 3166-1 alpha-2 codes (for example, `US`, `GB`, `BR`). Returns only content from creators located in the specified countries. |
| `start_date` | string | `YYYY-MM-DD`. Filters content published on or after this date. Must be provided with `end_date`. Cannot be in the future. |
| `end_date` | string | `YYYY-MM-DD`. Filters content published on or before this date. Must be provided with `start_date`. `start_date` must be less than or equal to `end_date`. |
| `search_key` | string | Keyword search across caption text. |
| `sort_by` | enum | `RECOMMENDED` · `DATE`. Defaults to `RECOMMENDED`. |
| `is_recommended` | bool | Filter to only content recommended for promotion as a Partnership Ad, as determined by Meta's recommendation model. Defaults to `false`. |

### Direct lookup parameters

Use these to look up specific content by identifier. Only **one** of these may be provided per request. They **cannot be combined** with filter parameters, sort parameters, or pagination cursors.

| Parameter | Type | Description |
| --- | --- | --- |
| `content_ids` | vec\ | Look up by Instagram media ID or Facebook post ID. Max 50. |
| `permalinks` | vec\ | Look up by Instagram or Facebook permalink URLs. Max 50. |
| `ad_codes` | vec\ | Look up by partnership ad codes. Max 50. |

### Pagination and field expansion parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `limit` | int | Page size. Min 1, max 50. Default 25. |
| `after` | string | Cursor from the previous response's `paging.cursors.after`. |
| `fields` | string | Comma-separated fields to include. Nested sub-fields via curly braces. Only `content_id` is returned by default. |

## Response

### Response fields

All fields except `content_id` are opt-in via the `fields` parameter.

| Field | Type | Description |
| --- | --- | --- |
| `content_id` | string | Unique content identifier (Instagram media ID or Facebook post ID). **Always returned.** |
| `platform` | enum | `INSTAGRAM` · `FACEBOOK` |
| `media_type` | enum | `IMAGE` · `VIDEO` · `CAROUSEL` · `LINK` |
| `post_type` | enum | `FEED` · `STORY` · `REEL` |
| `caption` | string | Post caption text. |
| `permalink` | string | Permanent URL to the post. |
| `creation_time` | string | Post creation date in `YYYY-MM-DD` format. |
| `author` | object | Content author. Sub-fields: `display_name` · `ig_user_id` · `fb_page_id` · `profile_picture_url`. The display name is the Page name if the content is a Facebook post, and the Instagram username if the content is Instagram media. |
| `is_recommended` | bool | Whether this content is recommended for promotion as a Partnership Ad, as determined by Meta's recommendation model. |
| `ad_usage` | enum | `NEVER_USED` · `ACTIVE` · `PREVIOUSLY_USED` |
| `partnership_info` | array | Partnership details per tagged partner. Sub-fields: `ad_eligibility` · `tagged_partner` (identity object) · `permission_status` · `permission_type` · `ad_code` · `content_types`. |
| `organic_insights` | object | Organic metrics, each a nullable int: `likes` (number of likes on the content), `comments` (number of comments on the content), `views` (number of times the content was played or viewed), `reach` (number of unique accounts that saw the content), `shares` (number of times the content was shared), `interaction` (total interactions on the content), and `saves` (number of times the content was saved). |

### Field expansion examples

**Default — only `content_id`:**

```text
fields=content_id
```

```json
{"data": [{"content_id": "17854360229135492"}]}
```

**Top-level fields:**

```text
fields=content_id,platform,caption,creation_time
```

```json
{"data": [{
  "content_id": "17854360229135492",
  "platform": "INSTAGRAM",
  "caption": "Summer vibes with our new collection",
  "creation_time": "2025-06-28"
}]}
```

**Author with specific sub-fields:**

```text
fields=content_id,author{display_name,ig_user_id}
```

```json
{"data": [{
  "content_id": "17854360229135492",
  "author": {
    "display_name": "StyleCreator_Ana",
    "ig_user_id": "1122334455"
  }
}]}
```

**Partnership info with nested `tagged_partner`:**

```text
fields=content_id,partnership_info{ad_eligibility,tagged_partner{display_name,profile_picture_url}}
```

```json
{"data": [{
  "content_id": "17854360229135492",
  "partnership_info": [{
    "ad_eligibility": "AD_READY",
    "tagged_partner": {
      "display_name": "BrandPage",
      "profile_picture_url": "https://..."
    }
  }]
}]}
```

**Specific organic insight metrics:**

```text
fields=content_id,organic_insights{likes,views,reach}
```

```json
{"data": [{
  "content_id": "17854360229135492",
  "organic_insights": {
    "likes": 15240,
    "views": 105000,
    "reach": 90000
  }
}]}
```

## Pagination

The API uses **cursor-based forward pagination**. Each response includes a `paging` object with a cursor for the next page.

### How it works

1. Make your first request with a `limit` (default 25, max 50, min 1).
2. If more results exist, the response includes `paging.cursors.after`.
3. Pass that cursor as the `after` parameter in your next request.
4. Repeat until no `paging` object is returned — that means there are no more pages.

### Example: First page

```http
GET /650157780891832/partnership-ads-advertisable-content
  ?ig_user_id=26702275725799&fields=content_id,platform&limit=3
```

```json
{
  "data": [
    {"content_id": "111", "platform": "INSTAGRAM"},
    {"content_id": "222", "platform": "FACEBOOK"},
    {"content_id": "333", "platform": "INSTAGRAM"}
  ],
  "paging": {
    "cursors": {"after": "QVFJVW5pY29ybiBkYXRh"}
  }
}
```

### Example: Next page

```http
GET /650157780891832/partnership-ads-advertisable-content
  ?ig_user_id=26702275725799&fields=content_id,platform&limit=3
  &after=QVFJVW5pY29ybiBkYXRh
```

```json
{
  "data": [
    {"content_id": "444", "platform": "FACEBOOK"},
    {"content_id": "555", "platform": "INSTAGRAM"}
  ]
}
```

No `paging` object means you have reached the last page.

### Pagination notes

- Pagination is **forward-only** — there is no `before` cursor. A request that includes the `before` cursor is rejected with a **400 Bad Request** error.
- `limit` must be between 1 and 50. Default is 25.
- Direct lookups (`content_ids`, `permalinks`, `ad_codes`) **do not support pagination** — all results are returned in one response.
- No `paging` object in the response means you have reached the last page.
