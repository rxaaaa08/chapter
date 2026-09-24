<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/claim_custom_conversions | Saved: 2026-09-19 -->

# Business Claim Custom Conversions



## Reading

You can't perform this operation on this endpoint.

## Creating

### /{business_id}/claim_custom_conversions
You can make a POST request to *claim_custom_conversions* edge from the following paths:

- [/{business_id}/claim_custom_conversions](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/claim_custom_conversions)

When posting to this edge, a [CustomConversion](https://developers.facebook.com/docs/marketing-api/reference/custom-conversion) will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `custom_conversion_id`<br><br>*numeric string* | Custom conversion ID the business claims.<br><br>**[required]**<br> |

#### Return Type

```
Struct  {
success: bool,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

