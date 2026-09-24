<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/seller/onboarding | Saved: 2026-09-19 -->

# Onboard a Seller



This page has guidance on how to onboard a seller into managed partner ads (MPA) using the Seller Business Creation API.

First, verify a seller is eligible for MPA using the [Seller Eligibility API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/seller/eligibility). Then use the Seller Business Creation API to onboard the seller.

Calling the Seller Business Creation API using an eligible seller's `vendor_id` automatically performs the following actions:

* Creates a [child](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/seller#terminology) Business Manager, a Facebook Page, and an ad account for the seller
* Shares a line of credit
* Sets up the seller's catalog segment with `vendor_id=<child_business_external_id>` as the filter

Once you **onboard a seller** into MPA, the seller is considered a **managed partner**.

## Before you begin

Before you onboard a seller, make sure you have completed these steps:

1. [Create an Admin System User](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/prerequisites/create-system-user)
2. [Assign Permissions to the Admin System User](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/prerequisites/assign-permissions-to-system-user)
3. [Generate an Access Token for the Admin System User](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/prerequisites/generate-access-token-system-user)
4. [Check Seller Eligibility](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/seller/eligibility)

## Required permissions

To call the Seller Business Creation API, you will need the following permissions:

* Business Admin
* Catalog Admin
* Manage Credit
* App Developer

## Seller business creation API call

### Request

The API call returns a response immediately with an `ASYNC_SESSION_ID`. While processing, poll the `ASYNC_SESSION_ID` until it reaches a terminal state `[COMPLETED|FAILED]`.

### Parameters

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

Use the `ASYNC_SESSION_ID` to get the corresponding ID of a seller onboarded to managed partner ads.

See [How to Poll Async Session for Response](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/async-api-user-guide) for more information.

#### Success response
If the status is `COMPLETED`, polling the async session returns data that looks like:

```
{
  "result": "{\"id\":\"<NEWLY_CREATED_MANAGED_PARTNER_BM_ID>\"}",
  "status": "COMPLETED",
  "id": "<ASYNC_SESSION_ID>"
}
```

#### Failed response
If the status is `FAILED`, the resulting data of polling async session will look like:

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
Requests made to seller onboarding API can result in several different error responses. See [How to handle an error](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/error-handling-guide) for more information.  

## See more

* [Check Seller Eligibility](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/seller/eligibility)
* [Seller Management](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/seller)
* [How to Poll Async Session for Response](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/async-api-user-guide)
* [Error Handling Guide](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/error-handling-guide)
