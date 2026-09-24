<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/branded-content-permissions | Saved: 2026-09-19 -->

# Manage Branded Content Permissions



Use the Facebook Branded Content API to view and manage branded content permissions. This helps you control who is authorized to tag you in Facebook branded content posts, and allows you to view, monitor, and control tagging of your brand's Facebook Page in any branded content posts.

## Permissions

* `facebook_branded_content_ads_brand`

## Brand allowlist status

### Retrieve the brand allowlist status

The brand allowlist controls who is authorized to tag your Page in branded content.

- **ENABLED** — Only Pages that you have authorized by adding them to your allowlist can tag your Page in branded content posts.
- **DISABLED** — Any creator that is authorized to create branded content can tag your Page in branded content they create.

#### Example request

```bash
curl -X GET \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "X-API-Version: 1.0.0" \
"https://api.facebook.com/partnership-ads/fb-branded-content/<PAGE_ID>/brand-allowlist-status"
```

#### Example response

Status: 200

```json
{
  "allowlist_status": "ENABLED"
}
```

### Update the brand allowlist status

Set the allowlist status for a brand's Facebook Page, by passing in the `is_enabled` status as a query parameter in a `PUT` request.

#### Example request

This example shows enabling the allowlist.

```bash
curl -X PUT \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "X-API-Version: 1.0.0" \
"https://api.facebook.com/partnership-ads/fb-branded-content/<PAGE_ID>/brand-allowlist-status?is_enabled=true"
```

#### Example response

Status: 200

```json
{
  "allowlist_status": "ENABLED"
}
```

## Manage allowlisted creators

### Retrieve allowlisted creators

Retrieve a list of creators currently on your brand's allowlist. These creators are authorized to create branded content tagging your Page. Certain legacy Pages are no longer authorized to create branded content in general, and if any such Pages are present in your allowlist, they are flagged with the `creator_ineligible_for_bc` field.

#### Example request

```bash
curl -X GET \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "X-API-Version: 1.0.0" \
"https://api.facebook.com/partnership-ads/fb-branded-content/<PAGE_ID>/brand-allowlisted-creators"
```

#### Example response

Status: 200

```json
[
  {
    "creator_page_id": 1234567890,
    "creator_page_name": "Creator Page One",
    "creator_ineligible_for_bc": true
  },
  {
    "creator_page_id": 9876543210,
    "creator_page_name": "Creator Page Two"
  }
]
```

### Update the allowlisted creators

Add one or more creators to your brand's allowlist.

#### Example request

```bash
curl -X POST \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "X-API-Version: 1.0.0" \
  -H "Content-Type: application/json" \
  -d '{"creator_page_ids": [111222333, 444555666]}' \
"https://api.facebook.com/partnership-ads/fb-branded-content/<PAGE_ID>/brand-allowlisted-creators"
```

#### Example response

Status: 200

```json
[
  {
    "creator_page_id": 111222333,
    "status_code": 200
  },
  {
    "creator_page_id": 444555666,
    "status_code": 200
  }
]
```

### Remove creators from the allowlist

Remove one or more creators from your brand's allowlist.

**Note:** Removing a creator from the allowlist does not automatically remove any existing branded content posts where your brand is tagged by a removed creator. Removing those posts must be done separately by [managing branded content posts](#manage-branded-content-posts).

#### Example request

```bash
curl -X DELETE \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "X-API-Version: 1.0.0" \
"https://api.facebook.com/partnership-ads/fb-branded-content/<PAGE_ID>/brand-allowlisted-creators?creator_page_ids=[111222333,444555666]"
```

#### Example response

Status: 200

```json
[
  {
    "creator_page_id": 111222333,
    "status_code": 200
  },
  {
    "creator_page_id": 444555666,
    "status_code": 404,
    "error_message": "Creator not found on allowlist."
  }
]
```

## Manage branded content posts

### Retrieve branded content posts

Retrieve a list of branded content posts in which your brand's Page is tagged.

#### Query parameters

| Name | Description |
| --- | --- |
| `start_date`<br><br>string (date) | **Optional.**<br>The start date of the posts (inclusive). |
| `end_date`<br><br>string (date) | **Optional.**<br>The end date of the posts (exclusive). |
| `creator_page_ids`<br><br>array of integers | **Optional.**<br>The Facebook delegate Page ID(s) of the creator(s) to filter by. |
| `limit`<br><br>int | **Optional.**<br>The number of posts to return, up to a maximum of 5000. |
| `offset`<br><br>int | **Optional.**<br>The offset for pagination, with a minimum of 0. |

#### Example request

This example filters by date and creator.

```bash
curl -X GET \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "X-API-Version: 1.0.0" \
"https://api.facebook.com/partnership-ads/fb-branded-content/<PAGE_ID>/branded-content-posts?start_date=2024-01-01&end_date=2024-02-01&creator_page_ids=[1234567890]"
```

#### Example response

Status: 200

```json
[
  {
    "fb_post_id": 505613696297499,
    "creator_page_id": 1234567890,
    "creator_page_name": "Creator Page One",
    "created_at": "2024-01-15T10:00:00+0000"
  },
  {
    "fb_post_id": 701886166670250,
    "creator_page_id": 1234567890,
    "creator_page_name": "Creator Page One",
    "created_at": "2024-01-28T14:30:00+0000"
  }
]
```

### Remove sponsors from branded content posts

Remove the sponsor tag from specified branded content posts, effectively converting the branded content post into a generic Facebook post. You can remove tags from multiple branded content posts at once, and the API returns a per-post response.

#### Example request

```bash
curl -X DELETE \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "X-API-Version: 1.0.0" \
"https://api.facebook.com/partnership-ads/fb-branded-content/<PAGE_ID>/branded-content-posts?post_ids=[505613696297499]"
```

#### Example response

Status: 200

```json
[
  {
    "fb_post_id": 505613696297499,
    "status_code": 200
  }
]
```
