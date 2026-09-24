<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/product-event-stat | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Product Event Stat

## Reading

Stats on pixel fires and app events from sources associated with this catalog.

Each result object contains the count of matched and unmatched content ids and the count of matched and unmatched unique content ids for each day in the requested period of time. All results are automatically broken down by DA events (`ViewContent`, `AddToCart` and `Purchase`) and source of the event (pixel or app).

### Parameters

This endpoint doesn't have any parameters.

### Fields

| Field | Description |
| --- | --- |
| `date_start`string | The start date for event stats results. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `date_stop`string | The end date for event stats results. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `device_type`enum {desktop, mobile_android_phone, mobile_android_tablet, mobile_ipad, mobile_iphone, mobile_ipod, mobile_phone, mobile_tablet, mobile_windows_phone, unknown} | The type of device on which the event occurred. If `device_type` is not specified as a breakdown, results will not be broken down by the type of device the event occurred on. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `event`enum {ViewContent, AddToCart, Purchase, InitiateCheckout, Search, Lead, AddToWishlist, Subscribe} | The type of DA event. Results are automatically broken down by the type of event. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `event_source`ExternalEventSource | The external event source (pixel or app) associated with the catalog for which the events were received. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `total_content_ids_matched_other_catalogs`int32 | The total number of content ids from all events received for the particular breakdown of event, source and device type, that matched to an item in another catalog associated to the pixel or .app that fired the event. This count is not de-duplicated across content ids. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `total_matched_content_ids`int32 | The total number of content ids from all events received for the particular breakdown of event, source and device type, that matched to an item in the catalog. This count is not de-duplicated across content ids. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `total_unmatched_content_ids`int32 | The total number of content ids from all events received for the particular breakdown of event, source and device type, that didn't match an item in the catalog. This count is not de-duplicated across content ids. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `unique_content_ids_matched_other_catalogs`int32 | The number of unique content ids from all events received for the particular breakdown of event, source and device type, that matched to an item in another catalog associated to the given pixel or app which fired the event. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `unique_matched_content_ids`int32 | The number of unique content ids from all events received for the particular breakdown of event, source and device type, that matched to an item in the catalog. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `unique_unmatched_content_ids`int32 | The number of unique content ids from all events received for the particular breakdown of event, source and device type, that didn't match an item in the catalog. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.
