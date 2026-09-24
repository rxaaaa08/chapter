<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/seller/deletion | Saved: 2026-09-19 -->

# Delete a Seller



This page has guidance on how to delete a seller from managed partner ads.

**Note:** Businesses that sell their products through marketplaces or retailers are referred to as sellers. Once you onboard a seller into managed partner ads, they are considered a managed partner. For simplicity, this page will use "seller" to also refer to managed partners (that is, onboarded sellers).

**Note:** A seller with active ad campaigns **CANNOT** be deleted.

The Seller Deletion API **disables the ad account** and deletes any assets that were created during [onboarding](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/seller/onboarding), including:

* Catalog segment
* Page
* System user
* Business

**Warning:** Once deleted successfully, the associated `vendor_id` for the seller can be **reused** and assigned to another seller, if desired.

## Before you begin

Before you delete a seller, make sure you have completed these steps:

1. [Create an Admin System User](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/prerequisites/create-system-user)
2. [Assign Permissions to the Admin System User](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/prerequisites/assign-permissions-to-system-user)
3. [Generate an Access Token for the Admin System User](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/prerequisites/generate-access-token-system-user)
4. [Onboard a Seller](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/seller/onboarding)
5. [Generate appsecret_proof](https://developers.facebook.com/docs/graph-api/securing-requests#generate-proof)

## Required permissions

To call the Seller Deletion API, you will need the following permissions:

* Business Admin
* Manage Credit
* App Developer

## Seller deletion API call

### Request

```
curl \
  -F 'access_token=<ACCESS_TOKEN>' \
  -F 'asyncbatch=[
      {
        "method": "DELETE",
        "relative_url": "<MARKETPLACE_BM_ID>/managed_partner_businesses?child_business_external_id=<VENDOR_ID>",
        "name": "<ASYNC_SESSION_NAME>"
      }
  ]' \
  -F "appsecret_proof=<APP_SECRET>" \
  "https://graph.facebook.com/v25.0"
```

The API returns the response immediately with an `ASYNC_SESSION_ID`. While the request continues to be processed, poll the `ASYNC_SESSION_ID` until it reaches a terminal state `[COMPLETED|FAILED]`.

### Parameters
| Name | Description |
| --- | --- |
| `appsecret_proof`<br><br>string | **Required.**  <br>The hex string to prove the ownership of the provided access token. The `appsecret_proof` should be generated from the marketplace's access token and app secret. |
| `child_business_external_id`<br><br>string | **Required**, unless `child_business_id` is provided.  <br>Each marketplace should pass a **unique ID** for each seller. The name of the field on the marketplaces side is `vendor_id`. |
| `child_business_id`<br><br>string | **Required**, unless `child_business_external_id` is provided.  <br>The seller's Meta Business Suite ID. |
| `marketplace_bm_id`<br><br>string | **Required.**  <br>The marketplace's Meta Business Suite ID.  <br>See [Find your Business ID in Meta Business Suite](https://www.facebook.com/business/help/1181250022022158?id=180505742745347) for more information. |

### Response

```
{
  "async_sessions": [
    {
      "id": "<ASYNC_SESSION_ID>",
      "name": "<ASYNC_SESSION_NAME>"
    }
  ]
}
```

Use the `ASYNC_SESSION_ID` to get the deletion status of the seller from managed partner ads.

See [How to Poll Async Session for Response](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/async-api-user-guide) for more information.

#### Success response

A `COMPLETED` status returns the following data:

```
{
  "result": "{\"id\":\"<MANAGED_PARTNER_BM_ID>\", \"success\":true}",
  "status": "COMPLETED",
  "id": "<ASYNC_SESSION_ID>"
}
```

#### Failed response

A `FAILED` status returns the following data:

```
{
    "result": {
        "error": {
            ...
            "message": "<EXCEPTION_MESSAGE>",
            "code": <ERROR_CODE>,
            "error_subcode": <ERROR_SUBCODE>,
            "error_user_title": "<ERROR_TITLE>",
            "error_user_msg": "<ERROR_MESSAGE>",
            "fbtrace_id": "<REQUEST_ID>"
            ...
        }
    },
    "error_code": <ERROR_CODE>,
    "status": "FAILED",
    "exception": "<EXCEPTION_MESSAGE>",
    "id": "<ASYNC_SESSION_ID>"
}
```

Show Failure Response

### Error codes
Requests made to seller deletion API can result in several different error responses. See [How to handle an error](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/error-handling-guide) for more information.

| Error Code | Error Subcode | Error Message |
| --- | --- | --- |
| 1800007 | 2310162 | The Business ID you entered `{business_id}` is not for a partner in managed partner ads. Check your entry or enter a new business ID. |
| 1800007 | 2310163 | The vendor ID you entered `{vendor_id}` is not for a partner in managed partner ads. Check your entry or enter a new vendor ID. |
| 1800008 | 2310164 | Your business does not manage the partner `{business_id OR vendor_id}` you are trying to delete. Check the ID or enter a new one. |
| 1800009 | 2310113 | Unable to delete managed partner with businessID `{business_id}`. It cannot be deleted while it has an outstanding balance of {amount} {currency}. Once you remit payment for your invoice, retry deleting the partner. |
| 1800009 | 2310134 | The Page owner {page_owner_id} for the page {page_id} is not an admin system user. The Page was not created by managed partner ads and it needs to be deleted before you can delete the partner. |
| 1800009 | 2310135 | This partner has one or more Facebook Pages that were not created by managed partner ads. These pages need to be deleted before you can delete the partner: {list_of_page_ids} |
| 1800009 | 2310165 | The business cannot be deleted while it has active campaigns. Go to the Ads Manager to see when their active campaigns will end or to turn them off. |

## See more

* [Check Seller Eligibility](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/seller/eligibility)
* [Onboard a Seller](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/seller/onboarding)
* [How to Poll Async Session for Response](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/async-api-user-guide)
* [Error Handling Guide](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/error-handling-guide)
