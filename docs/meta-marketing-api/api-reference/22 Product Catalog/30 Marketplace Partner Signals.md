<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/marketplace_partner_signals | Saved: 2026-09-19 -->

# Product Catalog Marketplace Partner Signals



## Reading

You can't perform this operation on this endpoint.

## Creating

You can't perform this operation on this endpoint.

## Updating

### /{product_catalog_id}/marketplace_partner_signals
You can update a [ProductCatalog](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog) by making a POST request to [/{product_catalog_id}/marketplace_partner_signals](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/marketplace_partner_signals).

#### Parameters

| Parameter | Description |
| --- | --- |
| `conversion_type`<br><br>*enum {ATTRIBUTED, IN_SESSION}* | conversion_type<br><br><br>Identifier on whether the specified event happened within the original session of the user landing on the partner's page (IN_SESSION) or within the attribution window after the initial session (ATTRIBUTED)<br> |
| `event_id`<br><br>*string* | event_id<br><br><br>Unique identifier for conversion events. If there are multiple conversion events tied to a single `mp_clid`, this field will be used to differentiate between those events<br> |
| `event_name`<br><br>*enum {PURCHASE, ADD_TO_CART, VIEW_ITEM, OFFER_SUBMITTED, PURCHASE_VIA_OFFER, TEST}* | event_name<br><br><br>`TEST` events can be used to send test data to confirm API functionality that Marketplace will ignore<br><br>**[required]**<br> |
| `event_source_url`<br><br>*string* | event_source_url<br> |
| `event_time`<br><br>*datetime/timestamp* | event_time<br><br>**[required]**<br> |
| `offer_data`<br><br>*JSON object* | offer_data<br><br><br>`original_price` *float*<br>original_price<br><br>**[required]**<br><br><br>`offer_price` *float*<br>offer_price<br><br>**[required]**<br><br><br>`currency` *string*<br>currency<br><br>**[required]**<br> |
| `order_data`<br><br>*JSON object* | order_data<br><br><br>`order_details` *array<JSON object>*<br><br>**Default value: **`[]`<br>order_details<br><br><br>`item_price` *float*<br>item_price<br><br>**[required]**<br><br><br>`item_quantity` *int64*<br>item_quantity<br><br>**[required]**<br><br><br>`item_id` *string*<br>item_id<br><br>**[required]**<br><br><br>`currency` *string*<br>currency<br><br>**[required]**<br><br><br>`order_total` *float*<br>order_total<br><br>**[required]**<br> |
| `user_data`<br><br>*JSON object* | user_data<br><br>**[required]**<br><br><br>`mp_clid` *string*<br>mp_clid<br><br>**[required]**<br> |

#### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node to which you POSTed.

```
Struct  {
success: bool,
validation_status:  List  [ Struct  {
errors:  List  [ Struct  {
message: string,
}],
warnings:  List  [ Struct  {
message: string,
}],
}],
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |

## Deleting

You can't perform this operation on this endpoint.

