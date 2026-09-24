<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/adgroup-review-feedback | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Adgroup Review Feedback

## Reading

The review feedback for the ad after it is reviewed.

### Parameters

This endpoint doesn't have any parameters.

### Fields

| Field | Description |
| --- | --- |
| `global`map<string, string> | Reasons for review disapproval across all platforms, such as `facebook` or `instagram`. Each reason has a key and a description. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `placement_specific`[AdgroupPlacementSpecificReviewFeedback](https://developers.facebook.com/docs/marketing-api/reference/adgroup-placement-specific-review-feedback/) | Reasons for review disapproval on a certain platform, such as `facebook` or `instagram`. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.
