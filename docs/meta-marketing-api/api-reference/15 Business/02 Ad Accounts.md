<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/ad_accounts | Saved: 2026-09-19 -->

# Business Ad Accounts



## Reading

You can't perform this operation on this endpoint.

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

### /{business_id}/ad_accounts
You can dissociate a [Business](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business) from a [Business](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business) by making a DELETE request to [/{business_id}/ad_accounts](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/ad_accounts).

#### Parameters

| Parameter | Description |
| --- | --- |
| `adaccount_id`<br><br>*string* | Ad account ID.<br><br>**[required]**<br> |

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
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |

