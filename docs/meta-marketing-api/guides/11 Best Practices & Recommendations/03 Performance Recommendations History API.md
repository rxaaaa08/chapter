<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/overview/performance-recommendations-history-api | Saved: 2026-09-19 -->

# Performance Recommendations History API


This ad-account-level endpoint returns the daily history of an ad account's Opportunity Score over a configurable time range, with optional explainability that surfaces the campaign-level changes driving each score movement. It complements the existing [Performance Recommendations](https://developers.facebook.com/documentation/ads-commerce/marketing-api/overview/performance-recommendations) endpoints by adding Historical Trend and Explainability capabilities.

## Permissions

- A System User access token, or a User access token with permission to access the target ad account.
- `ads_read` or `ads_management` access token permission.

## Fetching Opportunity Score history

Make a `GET` request to the `/act_<AD_ACCOUNT_ID>/opportunity_score_history` endpoint where `<AD_ACCOUNT_ID>` is the ID for your Meta ad account.

```bash
curl -G \
  -d 'access_token=<ACCESS_TOKEN>' \
  -d 'from_date=2026-04-01' \
  -d 'to_date=2026-04-12' \
  -d 'get_reason=true' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/opportunity_score_history
```

### Example response

```json
{
  "data": [
    {
      "date": "2026-01-03",
      "opportunity_score": "90",
      "changelog": [
        {
          "campaign_id": "12345",
          "score_change": "+34",
          "campaign_details": [
            {
              "ad_object_id": "1001",
              "ad_object_type": "ad_set",
              "budget_then": "5000",
              "budget_now": "6000",
              "eligible_recommendation_types_then": ["advantage_plus_audience"],
              "eligible_recommendation_types_now": ["creative_fatigue"],
              "applied_recommendation_types_then": [],
              "applied_recommendation_types_now": ["advantage_plus_audience"]
            }
          ]
        }
      ]
    }
  ]
}
```

### Parameters

| Name | Description |
| --- | --- |
| `from_date`<br><br>string (YYYY-MM-DD) | Optional. Start of the date range, inclusive. Defaults to **14 days** before `to_date`. Must not be earlier than 45 days before `to_date`. |
| `to_date`<br><br>string (YYYY-MM-DD) | Optional. End of the date range, inclusive. Defaults to the **current day**.<br><br>Due to the data latency, data may be missing the most recent two days. |
| `get_reason`<br><br>boolean | Optional. When `true`, each day in the response includes a `changelog` array explaining what drove the change in `opportunity_score` from the previous day, including budget, recommendations, and activated or deactivated campaigns. Defaults to `false`. |

The maximum supported window is **45 days**. Requests with a wider `from_date`/`to_date` range are rejected.

### Fields

| Field | Description |
| --- | --- |
| `date` | The calendar date for this entry, in `YYYY-MM-DD` format. |
| `opportunity_score` | Opportunity Score from 0 to 100 for the ad account on that date. |
| `changelog` | Returned only when `get_reason=true`. Array of per-campaign change records that contributed to the score difference compared to the previous day. Empty when no change occurred. |
| `campaign_id` | ID of the campaign whose state changed. |
| `score_change` | Signed score delta attributable to this campaign, such as `"+34"` or `"-5"`. |
| `ad_object_id` | ID of the affected ad object, such as a campaign, ad set, or ad. |
| `ad_object_type` | Object level: `campaign`, `ad_set`, or `ad`. |
| `budget_then` | Budget on the ad object before the change. |
| `budget_now` | Budget on the ad object after the change. |
| `eligible_recommendation_types_then` | Recommendation types the ad object was eligible for before the change. |
| `eligible_recommendation_types_now` | Recommendation types the ad object was eligible for after the change. |
| `applied_recommendation_types_then` | Recommendation types that had been applied before the change. |
| `applied_recommendation_types_now` | Recommendation types that had been applied after the change. |

## Errors

Endpoint-specific validation errors return `code: 100` with the following subcodes:

| Subcode | Reason |
| --- | --- |
| `5014020` | `from_date` or `to_date` is malformed. The expected format is `YYYY-MM-DD`. |
| `5014021` | `from_date` is later than `to_date`. |
| `5014022` | The requested window exceeds the 45-day maximum. |
| `5014023` | `to_date` is today or in the future, which violates one-day data latency. |
| `5014024` | `get_reason` is not a boolean value. |
| `5014018` | `AD_ACCOUNT_ID` is not visible to the access token, or the caller lacks the required permission. |

## Limitations

- **Usage of `/opportunity_score_history` differs to the `/recommendations` endpoint.** The `/recommendations` endpoint provides a real-time score. The `/opportunity_score_history` endpoint provides a historical trends lookback. Discrepancies may occur between the real-time score and historical trends. The real-time score reflects a value that may fluctuate throughout the day, whereas the historical trend represents a point-in-time snapshot.
- **Two-day data latency.** Scores for today are not yet available. Set `to_date` to yesterday or earlier.
- **45-day maximum window.** Callers needing longer history must issue multiple requests and stitch the results together.
- `changelog` entries are only returned when `get_reason=true`. Passing `get_reason=true` may increase response size and latency.
