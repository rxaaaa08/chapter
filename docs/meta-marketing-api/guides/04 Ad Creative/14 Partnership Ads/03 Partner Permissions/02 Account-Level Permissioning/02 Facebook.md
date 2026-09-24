<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/fb-account-level-permissioning | Saved: 2026-09-19 -->

# Facebook Account-Level Permissioning



Facebook account-level permissioning allows you to manage partnership ad permission relationships with creators and other partners at the account level. With account-level permissions in place, you can run partnership ads without requiring additional permissions for each piece of content.

With account-level permissioning, you can:

* **List permissions** — Retrieve all account-level permission relationships for your Page, with filtering by status, partner, and direction.
* **Send permission requests** — Request partnership ad permissions from creators or partners.
* **Accept or reject requests** — Respond to incoming permission requests from partners.
* **Cancel, revoke, or remove permissions** — Manage the lifecycle of existing permissions.

## Before you begin

Perform all operations against your brand's Facebook Page ID. All endpoints support batch processing and use:

* Base URL: `https://api.facebook.com/partnership-ads/fb-account-level-permissions`
* Authorization: All endpoints require an `Authorization: Bearer` token in the request header.

### Permissions

* `facebook_branded_content_ads_brand`

## Retrieve account-level permissions

Retrieve a list of account-level partnership ad permissions for your brand's Facebook Page with filtering by status, partner, direction, and pagination.

### Parameters

| Name | Description |
| --- | --- |
| `status`<br><br>array of integers | **Optional.**  <br>Filters the response by status type.  <br>**Values:**<br><br>* `1`: `PENDING_APPROVAL`<br>* `2`, `7`: `APPROVED`<br>* `3`: `REJECTED`<br>* `4`: `REVOKED`<br>* `5`: `SELF_REMOVED`<br>* `6`: `CANCELED` |
| `partner_page_ids`<br><br>array of integers | **Optional.**  <br>Filters the response by specific partner Facebook Page IDs. |
| `permission_direction`<br><br>string | **Optional.**<br>Filters the response by permission direction.  <br>**Values:**<br><br>* `sent` — Your brand's Page sent this request to a potential creator.<br>* `received` — Your brand's Page received this request from another potential Facebook brand or creator. |
| `offset`<br><br>integer | **Optional.**  <br>Number of records to skip for pagination, with a minimum value of 0. |
| `limit`<br><br>integer | **Optional.**  <br>Maximum number of permissions to return, with a maximum of 1000. |

### Example request

```html
curl -X GET \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "X-API-Version: 1.0.0" \
"https://api.facebook.com/partnership-ads/fb-account-level-permissions/<PAGE_ID>?status=[1,2]"
```

### Example response (200 OK)

```json
[
  {
    "id": <PERMISSION_ID>,
    "partner_page_id": <PARTNER_PAGE_ID>,
    "status": 1,
    "created_at": "<TIMESTAMP>",
    "permission_direction": "sent"
  },
  {
    "id": <PERMISSION_ID>,
    "partner_page_id": <PARTNER_PAGE_ID>,
    "status": 2,
    "created_at": "<TIMESTAMP>",
    "permission_direction": "received"
  }
]
```

## Manage account-level permissions

You can execute one or more permission actions in a single request. Submit all actions as an array in the request body, and the response returns per-item results. Batching actions lets the Page manage both incoming and outgoing account-level permission requests.

### Available actions

The `action` field contains the different types of operation to be performed on the permission request.

#### Sent request action

* **send-request** — Send a new request to a creator Page. You can only perform this action if no prior request exists or if an existing request is not active.
* **cancel-request** — Cancel an already sent request that has not yet been accepted by the creator. Canceling a request lets you rescind incorrect requests.
* **remove-permission** — Deactivate an existing "approved" request. Removing the permission revokes your authorization to create partnership ads with the linked creator.

#### Received request actions

* **accept-request** — Accept a pending request from another brand or creator Page.
* **reject-request** — Reject a pending request.
* **remove-permission** — Deactivate an existing "approved" request. Removing the permission ensures that the partner Page can no longer use any of your content for creating partnership ads.

### Examples

#### Sending a permission request

##### Request

```html
curl -X POST \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "X-API-Version: 1.0.0" \
  -H "Content-Type: application/json" \
  -d '[{"partner_page_id": <PARTNER_PAGE_ID>, "action": "send-request"}]' \
"https://api.facebook.com/partnership-ads/fb-account-level-permissions/<PAGE_ID>"
```

##### Response (200 OK)

```json
[
  {
    "partner_page_id": <PARTNER_PAGE_ID>,
    "alp_permission_id": <PERMISSION_ID>,
    "alp_permission_status": 1,
    "status": "success"
  }
]
```

An `alp_permission_status` of `1` indicates the permission is now in **Pending Approval**, awaiting the creator's acceptance.

#### Accepting an incoming permission request

##### Request

```html
curl -X POST \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "X-API-Version: 1.0.0" \
  -H "Content-Type: application/json" \
  -d '[{"partner_page_id": <PARTNER_PAGE_ID>, "action": "accept-request"}]' \
"https://api.facebook.com/partnership-ads/fb-account-level-permissions/<PAGE_ID>"
```

##### Response (200 OK)

```json
[
  {
    "partner_page_id": <PARTNER_PAGE_ID>,
    "alp_permission_id": <PERMISSION_ID>,
    "alp_permission_status": 2,
    "status": "success"
  }
]
```

An `alp_permission_status` of `2` confirms the permission is now **Approved**.

#### Rejecting an incoming permission request

##### Request

```html
curl -X POST \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "X-API-Version: 1.0.0" \
  -H "Content-Type: application/json" \
  -d '[{"partner_page_id": <PARTNER_PAGE_ID>, "action": "reject-request"}]' \
"https://api.facebook.com/partnership-ads/fb-account-level-permissions/<PAGE_ID>"
```

##### Response (200 OK)

```json
[
  {
    "partner_page_id": <PARTNER_PAGE_ID>,
    "alp_permission_id": <PERMISSION_ID>,
    "alp_permission_status": 3,
    "status": "success"
  }
]
```

An `alp_permission_status` of `3` confirms that the permission has been **Rejected**.

#### Revoking an approved permission

##### Request

```html
curl -X POST \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "X-API-Version: 1.0.0" \
  -H "Content-Type: application/json" \
  -d '[{"partner_page_id": <PARTNER_PAGE_ID>, "action": "revoke-permission"}]' \
"https://api.facebook.com/partnership-ads/fb-account-level-permissions/<PAGE_ID>"
```

##### Response (200 OK)

```json
[
  {
    "partner_page_id": <PARTNER_PAGE_ID>,
    "alp_permission_id": <PERMISSION_ID>,
    "alp_permission_status": 4,
    "status": "success"
  }
]
```

An `alp_permission_status` of `4` confirms the permission has been **Revoked**.

#### Canceling a pending outbound request

##### Request

```html
curl -X POST \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "X-API-Version: 1.0.0" \
  -H "Content-Type: application/json" \
  -d '[{"partner_page_id": <PARTNER_PAGE_ID>, "action": "cancel-request"}]' \
"https://api.facebook.com/partnership-ads/fb-account-level-permissions/<PAGE_ID>"
```

##### Response (200 OK)

```json
[
  {
    "partner_page_id": <PARTNER_PAGE_ID>,
    "alp_permission_id": <PERMISSION_ID>,
    "alp_permission_status": 6,
    "status": "success"
  }
]
```

An `alp_permission_status` of `6` confirms the permission has been **Canceled** and can no longer be accepted by the creator.

#### Batching multiple actions in one request

##### Request

```html
curl -X POST \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "X-API-Version: 1.0.0" \
  -H "Content-Type: application/json" \
  -d '[
    {"partner_page_id": <PARTNER_PAGE_ID1>, "action": "send-request"},
    {"partner_page_id": <PARTNER_PAGE_ID2>, "action": "accept-request"},
    {"partner_page_id": <PARTNER_PAGE_ID3>, "action": "revoke-permission"}
  ]' \
"https://api.facebook.com/partnership-ads/fb-account-level-permissions/<PAGE_ID>"
```

##### Response (200 OK)

```json
[
  {
    "partner_page_id": <PARTNER_PAGE_ID1>,
    "alp_permission_id": <PERMISSION_ID1>,
    "alp_permission_status": 1,
    "status": "success"
  },
  {
    "partner_page_id": <PARTNER_PAGE_ID2>,
    "alp_permission_id": <PERMISSION_ID2>,
    "alp_permission_status": 2,
    "status": "success"
  },
  {
    "partner_page_id": <PARTNER_PAGE_ID3>,
    "status": "failure",
    "error_code": 404,
    "error_message": "No active permission found for this partner."
  }
]
```

## Best practices

* **Use batch operations** — `POST` calls accept an array of actions, allowing you to process multiple permission changes in a single request. Batch operations are recommended over individual calls.
* **Paginate large result sets** — Use `limit` and `offset` when listing permissions. The maximum limit per request is 1000.
* **Filter early** — Use `status`, `partner_page_ids`, and `permission_direction` query parameters to narrow results and reduce response size.
* **Inspect per-item results** — Batch `POST` responses include individual status fields. Always check each item for `"success"` or `"failure"` to handle partial failures gracefully.
