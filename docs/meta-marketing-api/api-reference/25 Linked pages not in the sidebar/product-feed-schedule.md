<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/product-feed-schedule | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Product Feed Schedule

## Reading

The configuration for fetching a feed in a recurrant manner. If it's an `update_schedule`, the scheduled uploads would update existing items with the information delta provided or create new ones if not present. If its a replace `schedule`, this will be a full replace operation where items not present in the feed file will be removed, new items will be created and existing items will be updated.

### Examples

```
curl -G \
-d "fields=schedule" \
https://graph.facebook.com/<API_VERSION>/<PRODUCT_FEED_ID>
```

### Parameters

This endpoint doesn't have any parameters.

### Fields

| Field | Description |
| --- | --- |
| `id`numeric string | id [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `day_of_month`unsigned int32 | The day of month to fetch feed, for monthly schedules e.g., 1 for first of month [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `day_of_week`enum | The day of week to fetch feed, for weekly schedules. Allowed values: SUNDAY, MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `hour`unsigned int32 | Hour of the day to fetch the product feed, 0-23 Pacific Time(PT) which is PDT during summer and PST during winter. If the interval is hourly and interval count more than 0, the next upload will occur the interval_count time after the upload. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `interval`enum {HOURLY, DAILY, WEEKLY, MONTHLY} | The interval at which the product feed gets fetched [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `interval_count`unsigned int32 | Specifies number of intervals between each upload, default is 1. For example, when interval_count is 2 with interval set to daily, feed will we uploaded every two days at the given time. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `minute`unsigned int32 | Minute of the hour to fetch the product feed, 0-59 [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `timezone`string | The string representation of the timezone in which the schedule params are specified [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `url`string | The location of the product feed to fetch [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `username`string | The username that is needed to access the url [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |

### Error Codes

| Error | Description |
| --- | --- |
| 100 | Invalid parameter |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.
