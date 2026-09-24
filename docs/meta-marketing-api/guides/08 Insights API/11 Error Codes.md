<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights/error-codes | Saved: 2026-09-19 -->

# Ads Insights API Error Codes



**Warning:** Error code information for async sources will be available with Marketing API v25.0+.

| Error Code | Error Subcode | Source | Summary | Description |
| --- | --- | --- | --- | --- |
| `-2` | `2490547` | Async | Report Failed | Generating the report failed. Try again later. |
| `100` | `1504018` | Sync | Request Timed Out | Your request timed out. Try a smaller date range, fetch less data, or use async jobs. |
| `4` | `1504022` | Async and Sync | Too Many API Requests | Your app has exceeded the allowed number of API requests. Wait before retrying. For more info, see [API Rate Limits](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights/best-practices#insightscallload). |
| `2` | `1504038` | Sync | Request Timed Out | Your request timed out. Try a smaller date range, fetch less data, or use async jobs. |
| `4` | `1504039` | Async and Sync | Too Many API Requests | Your app has exceeded the allowed number of API requests. Wait before retrying. For more info, see [API Rate Limits](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights/best-practices#insightscallload). |
| `2` | `1504041` | Async and Sync | Invalid Breakdowns | No data is available for the requested metrics and breakdowns. Try different metrics or breakdowns. See [Breakdowns](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights/breakdowns). |
| `2` | `1504042` | Async and Sync | Invalid Custom Metrics | You are querying invalid custom metrics. Try selecting different ones. |
| `2` | `1504043` | Async and Sync | Intermittent Error | Your request encountered an intermittent error. Retry at a later time. |
| `2` | `1504044` | Sync | Unknown Error Occurred | An unexpected error occurred. Please refresh the page or try again. If the issue persists, contact [Meta Support](https://developers.facebook.com/support/). |
| `-3` | `1504045` | Async | Report Too Large | Your report was too large. Check the documentation for guidance and try again. See [Data Per Call Limits](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights/best-practices#best-practices--data-per-call-limits). |
| `100` | `3191001` | Async and Sync | Permission Error | The Ads Insights API denied your request due to insufficient permissions. |

