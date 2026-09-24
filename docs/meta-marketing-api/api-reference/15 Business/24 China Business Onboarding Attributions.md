<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/china_business_onboarding_attributions | Saved: 2026-09-19 -->

# Business China Business Onboarding Attributions



## Reading

You can't perform this operation on this endpoint.

## Creating

### /{business_id}/china_business_onboarding_attributions
You can make a POST request to *china_business_onboarding_attributions* edge from the following paths:

- [/{business_id}/china_business_onboarding_attributions](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/china_business_onboarding_attributions)

When posting to this edge, a [Business](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business) will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `advertiser_identifier`<br><br>*string* | [Optional] Advertiser identifiers used to analyze the customer acquisition lifecycle<br> |
| `csi`<br><br>*string* | [Optional] Meta generated tracking id<br> |
| `update_token_id`<br><br>*numeric string* | [Optional] ID for the OE Token to be updated. Providing this ID value will result in updating the existing OE Token instead of creating a new OE Token<br> |
| `utm`<br><br>*string* | [Optional] Marketing campaign name<br> |

#### Return Type

```
Struct  {
id: numeric string,
link_with_id: string,
utm: string,
csi: string,
advertiser_identifier: string,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 200 | Permissions error |

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

