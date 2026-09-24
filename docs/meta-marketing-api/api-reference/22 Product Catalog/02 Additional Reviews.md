<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/additional_reviews | Saved: 2026-09-19 -->

# Product Catalog Additional Reviews



## Reading

You can't perform this operation on this endpoint.

## Creating

Meta will review product items to ensure they comply with integrity policies. If a product is found to be in violation of these policies, it will be marked as rejected. We provide this API to appeal the outcome of an integrity decision on a product that has been rejected. Additional reviews can be requested only after the product is rejected, and only once per product.

Bear in mind that integrity reviews happen asynchronously and are triggered when new products are introduced or their attributes change, though additional reviews can happen at Meta’s discretion to ensure a consistent, safe and reliable buyer UX.

You can request 100 items per request and can optionally add a rationale message. The message should contain a short rationale in English to help the review system to evaluate the additional review request. A concise message will increase the chances of the additional review being successful and revoking the rejected status.

Rate Limiting on the endpoint: currently set at 10 calls per day per catalog. Each call can request a maximum of 100 items. This may be subject to change in future.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

