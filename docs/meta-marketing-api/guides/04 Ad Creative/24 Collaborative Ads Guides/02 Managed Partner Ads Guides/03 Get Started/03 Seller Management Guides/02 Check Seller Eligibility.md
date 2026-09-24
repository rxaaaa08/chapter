<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/seller/eligibility | Saved: 2026-09-19 -->

# Check seller eligibility



This page gives guidance on which sellers to onboard into managed partner ads, as well as how to check eligibility. You may begin onboarding any eligible seller, but consider prioritizing sellers with a higher average purchase value. Such sellers tend to have better return on ad spend.

## Before you begin

Before you check the eligibility of a seller, make sure you have completed these steps:

1. [Create an Admin System User](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/prerequisites/create-system-user)
2. [Assign Permissions to the Admin System User](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/prerequisites/assign-permissions-to-system-user)
3. [Generate an Access Token for the Admin System User](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/prerequisites/generate-access-token-system-user)

## Seller eligibility criteria

A seller qualifies when it meets the following criteria:

* Average purchase value in the past 28 days
* Number of purchases in the past 28 days

**Note:** Sellers with a higher average purchase value tend to have better return on ad spend. Prioritize these sellers when you onboard. You can download a list of your eligible and recommended sellers from the Discover page in Collaboration Center.

## Required permissions

To call the Seller Eligibility API, you need the following permissions:

* Business Admin
* Catalog Admin
* Manage Credit
* App Developer

## Seller eligibility API call

### Request

```
curl -X GET \
 "https://graph.facebook.com/v<API_VERSION>/<Business_ID>?fields=collaborative_ads_managed_partner_eligibility.vendor_id(<INSERT_VENDOR_ID>).catalog_id(<INSERT_CATALOG_ID>)&access_token=<ACCESS_TOKEN>"
```

### Request parameters

| Name | Description |
| --- | --- |
| `catalog_id`<br><br>numeric string | **Required.**  <br>The ID of the marketplace's catalog, referred to as a **parent catalog**.  <br>During onboarding, this catalog may be filtered using `vendor_id=<child_business_external_id>` to create a catalog segment for a seller. |
| `marketplace_bm_id`<br><br>string | **Required.**  <br>The marketplace's Business Manager ID.<br>See [Find your Business ID in Meta Business Suite](https://www.facebook.com/business/help/1181250022022158?id=180505742745347) for more information. |
| `vendor_id `<br><br>string | **Required.**  <br>The **unique ID** of the seller for a marketplace. |

### Response

```
{
  "is_eligible": bool,
  "reason_code": "enum string",
  "reason_description": "enum string",
}
```

### Response fields

| Name | Description |
| --- | --- |
| `is_eligible`<br><br>bool | Indicates whether the seller is eligible. |
| `reason_code`<br><br>enum string | The reason code for the seller's eligibility.  <br>**Empty** if the seller is eligible. |
| `reason_description`<br><br>enum string | A description of the eligibility reason.  <br>**Empty** if seller is eligible. |

### Error codes
| Error Code | Error Subcode | Description |
| --- | --- | --- |
| 1800000 | 2310114 | Complete the managed partner ads onboarding process in Collaboration Center. |
| 1800012 | 2310173 | Check the marketplace you entered ({marketplace_id}). If it's the correct ID, ask someone with full control to go to Business settings in Meta Business Suite to give you admin access. Once assigned, retry the request. |
| 1800101 | 2310116 | Your business {business_id} does not manage the catalog ID you entered {catalog_id}. Enter a catalog ID that your business manages. |

## See more

* [Add System Users to Your Meta Business Suite](https://www.facebook.com/business/help/503306463479099?id=2190812977867143)
* [Developer Documentation: System Users in Meta Business Suite](https://developers.facebook.com/docs/marketing-api/system-users)
* [Developer Documentation: Generate Access Token](https://developers.facebook.com/docs/marketing-api/system-users/install-apps-and-generate-tokens#generate-token)
