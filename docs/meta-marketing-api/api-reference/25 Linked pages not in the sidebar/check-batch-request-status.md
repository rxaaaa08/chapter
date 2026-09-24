<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/check-batch-request-status | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Check Batch Request Status

## Reading

The status of a batch request.

### Parameters

This endpoint doesn't have any parameters.

### Fields

| Field | Description |
| --- | --- |
| `errors`[list<CatalogItemBulkError>](https://developers.facebook.com/docs/marketing-api/reference/catalog-item-bulk-error/) | List of sample errors(does not include all errors) - cases where item update was blocked. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `errors_total_count`int32 | Total number of errors [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `handle`string | Handle of a batch request. Such handles are part of the response payload of API endpoints used to submit Catalog Batch API requests (example: [/items_batch](https://developers.intern.facebook.com/docs/marketing-api/reference/product-catalog/items_batch/#for-a-successful-call)). [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `ids_of_invalid_requests`list<string> | List of retailer ids for which the requests failed [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `status`string | Status of a batch request. Possible values are: * Scheduled - A new action enters 'scheduled' state. Scheduled actions await to be dispatched. * Dispatched - The action was added to the queue. * Started - The action was started; some of the requests might have been updated. * Finished - The action was completed successfully; individual requests with errors were not saved. * Canceled - The action was manually canceled. * Error - During the execution of the action, an unexpected issue occurred; some of the requests might not have finished successfully. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `warnings`[list<CatalogItemBulkError>](https://developers.facebook.com/docs/marketing-api/reference/catalog-item-bulk-error/) | List of sample warnings for the submitted requests. Note that a warning may be purely a recommendation or may indicate that some of the field values were not updated. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `warnings_total_count`int32 | Total number of warnings [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.
