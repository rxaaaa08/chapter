<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/account-level-permissioning | Saved: 2026-09-19 -->

# Instagram account-level permissioning



Instagram account-level permissioning allows you to request partnership ad permissions from creators and validate the status of those requests. It also allows third-party platforms to list existing partnership ad permissions for a brand.

When a creator accepts an account-level permission request in the Instagram app, you can:

* Create partnership ads from a creator's handle without a pre-existing post.
* Create partnership ads from any of a creator's existing posts that tag your brand (**Note:** You must be tagged using the paid partnership label, an @ mention﹡, people tags﹡, product tags﹡, or Instagram Collabs﹡).
* Include or exclude a creator's audience in the partnership ad campaign.

Creators can:

* Tag a brand partner in the paid partnership label when making branded content posts.

﹡ Instagram only

## Permissions

To send, view, and revoke partnership ad permissions on the `/{business-account-id}/branded_content_ad_permissions` endpoint, your app needs the following permissions:

* `instagram_branded_content_ads_brand`
* `instagram_basic`
* `business_management`

**Note:** You must have at least an `ADVERTISER` role on the Instagram business account.

## Send a partnership ad permission request to a creator

Your app can request partnership ad permissions from creators for yourself or on behalf of brand partners by sending a `POST` call to the `/{business-account-id}/branded_content_ad_permissions` endpoint.

### Example request

You can request the permission using either the `CREATOR_IG_ID` or `CREATOR_IG_USERNAME`.

```bash
curl -X POST \
  -F 'access_token=<ACCESS_TOKEN>' \
  -F 'creator_instagram_account=<CREATOR_IG_ID>' \
  # OR
  -F 'creator_instagram_username=<CREATOR_IG_USERNAME>' \
'https://graph.facebook.com/v25.0/<BUSINESS_ACCOUNT_ID>/branded_content_ad_permissions'
```

### Example response

```json
{
  "id": "<PERMISSION_ID>"
}
```

## View a brand partner's partnership ad permissions

Your app can retrieve a list of existing partnership ad permissions (including those that are pending) for a brand partner with a `GET` call to the `/{business-account-id}/branded_content_ad_permissions` endpoint.

### Parameters

| Name | Description |
| --- | --- |
| `creator_username`<br><br>string | **Optional.**<br>Filter results by a specific creator's Instagram username. |

### Example request

```bash
curl -G \
  -d 'access_token=<ACCESS_TOKEN>' \
  -d 'creator_username=<CREATOR_USERNAME>' \
'https://graph.facebook.com/v25.0/<BUSINESS_ACCOUNT_ID>/branded_content_ad_permissions'
```

### Example response

```json
{
  "data": [
    {
      "creator_username": "jaspersmarket",
      "creator_id": "123",
      "creator_fb_page": "123",
      "brand_ig_user": {
        "id": "1234"
      },
      "permission_status": "APPROVED", // Creator approval status: REVOKED, PENDING, etc.
      "id": "<PERMISSION_ID>"
    }
  ],
  "paging": {
    "cursors": {
      "before": "MTM4OTY1MDkwNzkyMTE4NQ==",
      "after": "MTAyMzMxNzA5NzY5MjU4NA=="
    }
  }
}
```

## Revoke a creator's partnership ad permissions

Your app can revoke the partnership ad permissions of creators with a `POST` call to the `/{business-account-id}/branded_content_ad_permissions` endpoint with the `revoke` field set to `true`.

### Example request

```bash
curl -X POST \
  -F 'access_token=<ACCESS_TOKEN>' \
  -F 'creator_instagram_account=<CREATOR_IG_ID>' \
  -F 'revoke=true'
'https://graph.facebook.com/v25.0/<BUSINESS_ACCOUNT_ID>/branded_content_ad_permissions'
```

### Example response

```json
{
  "id": "<PERMISSION_ID>"
}
```

## Best practices

- **Use batch operations** — The `POST` endpoint accepts an array of actions, allowing you to process multiple permission changes in a single request. Prefer this over individual calls.
- **Paginate large result sets** — Use `limit` and `offset` when listing permissions. The maximum limit per request is 1,000.
- **Filter early** — Use `status`, `partner_page_ids`, and `permission_direction` query parameters to narrow results and reduce response size.
- **Inspect per-item results** — Batch POST responses include individual status fields. Always check each item for `"success"` or `"failure"`, then detect and retry items that failed while keeping successful items.
