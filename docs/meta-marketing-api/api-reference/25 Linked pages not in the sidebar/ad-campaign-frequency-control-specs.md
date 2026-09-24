<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/ad-campaign-frequency-control-specs | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Ad Campaign Frequency Control Specs

## Reading

A frequency control spec specifies settings for frequency capping. For example, {"event": "IMPRESSIONS", "interval_days":3, "max_frequency":1} means that in every 3 days, not more than 1 impression per user.

### Parameters

This endpoint doesn't have any parameters.

### Fields

| Field | Description |
| --- | --- |
| `event`enum | Event name, only `IMPRESSIONS` currently. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `interval_days`unsigned int32 | Interval period in days, between 1 and 90 (inclusive) [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `max_frequency`unsigned int32 | The maximum frequency, between 1 and 90 (inclusive) [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.
