<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/reach-estimate | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Reach Estimate

## Reading

Potential reach (the number of monthly active people) on Facebook that match the audience you defined through your audience targeting selections.

### Parameters

This endpoint doesn't have any parameters.

### Fields

| Field | Description |
| --- | --- |
| `estimate_ready`bool | Estimate is ready or not. If the [targeting spec](https://developers.facebook.com/docs/marketing-api/targeting-specs) is very large, or contains [Custom audiences](https://developers.facebook.com/docs/marketing-api/custom-audience-targeting), it may take time to be available. If your targeting is either `Dynamic Product Audiences` or `Product Audiences` or `Incomplete Audiences` the default value is `false`. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `unsupported`bool | Whether the estimate is unsupported [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `users`integer | The estimate number of users reached by this targeting [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.
