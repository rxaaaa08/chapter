<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/batch | Saved: 2026-09-19 -->

# Product Catalog Batch



## Reading

You can't perform this operation on this endpoint.

## Creating

**Warning:** There should be no new integrations with this endpoint. The `/items_batch` endpoint should be used instead. If you are still making calls to the `/batch` endpoint please use this [guide](https://developers.facebook.com/documentation/ads-commerce/catalog/guides/manage-catalog-items/catalog-batch-api/migrate-to-items-batch) to migrate to `/items_batch`.

### /{product_catalog_id}/batch
You can make a POST request to *batch* edge from the following paths:

- [/{product_catalog_id}/batch](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/batch)

When posting to this edge, a [ProductItem](https://developers.facebook.com/docs/marketing-api/reference/product-item) will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `allow_upsert`<br><br>*boolean* | **Default value: **`true`<br>Parameters specifying whether non existing items that are being updated should be inserted or should throw the error<br> |
| `requests`<br><br>*list<JSON object>* | Array of JSON objects containing batch requests. Each batch request consists of<br>`retailer_id`, `method` and `data` fields.<br><br><br>``retailer_id` - retailer's ID for a product. `method` - an operation of a batch request, either `CREATE`, `UPDATE` or `DELETE`. `data` - JSON object containing fields and values for a product. See [Catalog Batch API](/documentation/ads-commerce/catalog/guides/manage-catalog-items/catalog-batch-api) to learn more the list of fields and values for the data object.`<br><br>**[required]**<br> |

#### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node to which you POSTed.

```
Struct  {
handles:  List  [string],
validation_status:  List  [ Struct  {
errors:  List  [ Struct  {
message: string,
}],
retailer_id: string,
warnings:  List  [ Struct  {
message: string,
}],
}],
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 80014 | There have been too many calls for the batch uploads to this catalog account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting#catalog. |
| 100 | Invalid parameter |
| 200 | Permissions error |
| 190 | Invalid OAuth 2.0 Access Token |

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

