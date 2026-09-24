<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/product-feed-upload | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Product Feed Upload

## Reading

A specific product feed upload attempt

## Examples

Example to get a list of uploads of a product feed:

```
curl -G \
-d "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<PRODUCT_FEED_ID>/uploads
```

Example to get the status of a feed upload:

```
curl -G \
-d "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<PRODUCT_FEED_UPLOAD_ID>
```

### Parameters

This endpoint doesn't have any parameters.

### Fields

| Field | Description |
| --- | --- |
| `id`numeric string | ID of the product feed upload [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `end_time`datetime | The time the upload was completed [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `error_count`int32 | The total number of errors for feed upload |
| `error_report`ProductFeedUploadErrorReport | Error report file handle and status, if the error report for this upload was requested |
| `filename`string | The name of the file the product feed was uploaded from |
| `input_method`enum {Manual Upload, Server Fetch, Google Sheets Fetch, Reupload Last File, User initiated server fetch} | The input method the product feed was obtained with |
| `num_deleted_items`int32 | The number of deleted items |
| `num_detected_items`int32 | The number of items detected while reading the feed file |
| `num_invalid_items`int32 | The number of invalid items |
| `num_persisted_items`int32 | The number of persisted items |
| `start_time`datetime | The time the upload process started [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `url`string | The url to fetch the products from |
| `warning_count`int32 | The total number of warnings for feed upload |

### Edges

| Edge | Description |
| --- | --- |
| [`errors`](https://developers.facebook.com/docs/marketing-api/reference/product-feed-upload/errors/)Edge<ProductFeedUploadError> | List of errors during the product feed upload |

### Error Codes

| Error | Description |
| --- | --- |
| 100 | Invalid parameter |

## Creating

You can make a POST request to `error_report` edge from the following paths:

* [`/{product_feed_upload_id}/error_report`](https://developers.facebook.com/docs/marketing-api/reference/product-feed-upload/error_report/)

When posting to this edge, a [ProductFeedUpload](https://developers.facebook.com/docs/marketing-api/reference/product-feed-upload/) will be created.

### Parameters

This endpoint doesn't have any parameters.

### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview/#read-after-write) and will read the node to which you POSTed.

 Struct {

`success`: bool,

}

### Error Codes

| Error | Description |
| --- | --- |
| 100 | Invalid parameter |

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.
