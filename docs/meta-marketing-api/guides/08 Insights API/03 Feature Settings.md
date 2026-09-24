<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights/feature-settings | Saved: 2026-09-19 | Converted from the web page: Meta's "View as Markdown" export returns an error for this page -->

# Feature Settings API

Ads in WhatsApp Status are available via the Marketing API. [Learn more about ads in WhatsApp Status.](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-in-whatsapp-status)

Some Ads Insights features, such as specific metrics or breakdowns, return data only after an ad account enables them. Use the Feature Settings API to list the features an account can enable, check the current status of those features, and enable a feature for the account.

After you enable a feature, the corresponding data becomes available in the [Ads Insights API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights). Allow up to 24 hours for the change to take effect. The API does not support disabling a feature.

## Base URL

```
https://ads-api.facebook.com/v26.0/marketing-api

```

## Requirements

All endpoints require an OAuth access token with the `ads_read` permission on the target ad account. You can use either a user access token or a system user access token. For details, see [Access tokens](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens).

## Available features

Four breakdown features are currently available.

| Feature name | Type | What it unlocks in the Ads Insights API |
| --- | --- | --- |
| `comscore` | `breakdown` | `breakdowns=comscore_market`, `breakdowns=comscore_market_code`, and any breakdown combination that includes them |
| `frequency_value` | `breakdown` | `breakdowns=frequency_value` |
| `impression_device` | `breakdown` | `breakdowns=impression_device` and any breakdown combination that includes it |
| `time_of_day_viewer_tz` | `breakdown` | `breakdowns=hourly_stats_aggregated_by_audience_time_zone` |

The API also defines a `metric` feature type for future use. No `metric` features are available yet.

## GET /act_<AD_ACCOUNT_ID>/insights/feature-settings/list-features

Lists every insights feature the ad account can enable. The catalog is the same for all ad accounts — it tells you which feature names are valid, not which ones the account has enabled. To check what the account has enabled, use [GET /act_<AD_ACCOUNT_ID>/insights/feature-settings](#get-feature-settings).

### Parameters

This endpoint accepts only the standard [cursor-based pagination](https://developers.facebook.com/docs/graph-api/results) parameters: `before`, `after`, and `limit`.

### Sample request

```
curl -i -X GET \
  "https://ads-api.facebook.com/v26.0/marketing-api/act_<AD_ACCOUNT_ID>/insights/feature-settings/list-features" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

```

### Sample response

```
{
  "data": [
    { "feature_name": "comscore", "feature_type": "breakdown" },
    { "feature_name": "frequency_value", "feature_type": "breakdown" },
    { "feature_name": "impression_device", "feature_type": "breakdown" },
    { "feature_name": "time_of_day_viewer_tz", "feature_type": "breakdown" }
  ],
  "paging": { "cursors": { "before": "...", "after": "..." } }
}
```

### Response fields

| Field | Type | Description |
| --- | --- | --- |
| `feature_name` | String | The feature name. Pass this value to the other Feature Settings endpoints. |
| `feature_type` | String | The kind of insights capability the feature unlocks. One of `breakdown` or `metric`. |

## GET /act_<AD_ACCOUNT_ID>/insights/feature-settings

Returns the features the ad account has enabled, along with each feature’s status.

A feature the account has never enabled does not appear in the response. An empty `data` array means the account has not enabled any features.

### Parameters

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `feature_name` | String | No | Filters results to a single feature. |

This endpoint also accepts the standard [cursor-based pagination](https://developers.facebook.com/docs/graph-api/results) parameters: `before`, `after`, and `limit`.

### Sample request

```
curl -i -X GET \
  "https://ads-api.facebook.com/v26.0/marketing-api/act_<AD_ACCOUNT_ID>/insights/feature-settings" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

```

To check a single feature, add the `feature_name` query parameter.

```
curl -i -X GET \
  "https://ads-api.facebook.com/v26.0/marketing-api/act_<AD_ACCOUNT_ID>/insights/feature-settings?feature_name=comscore" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

```

### Sample response

```
{
  "data": [
    {
      "feature_name": "comscore",
      "status": "enabled",
      "insights_effective_date": "2026-07-15"
    },
    {
      "feature_name": "impression_device",
      "status": "enabled"
    }
  ],
  "paging": { "cursors": { "before": "...", "after": "..." } }
}
```

### Response fields

| Field | Type | Description |
| --- | --- | --- |
| `feature_name` | String | The feature name. |
| `status` | String | The account’s current status for the feature. One of `enabled` or `disabled`. See [Feature status](#feature-status). |
| `insights_effective_date` | String | The date, in `YYYY-MM-DD` format, from which the feature returns data. Omitted when the feature is effective for all dates. |

## POST /act_<AD_ACCOUNT_ID>/insights/feature-settings

Enables a feature for the ad account.

This endpoint only enables features. The API does not support disabling a feature. Enabling a feature the account has already enabled has no effect and still returns `200 OK`.

### Request body

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `feature_name` | String | Yes | The name of the feature to enable. Use a value returned by [`list-features`](#list-features). |

### Sample request

```
curl -i -X POST \
  "https://ads-api.facebook.com/v26.0/marketing-api/act_<AD_ACCOUNT_ID>/insights/feature-settings" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"feature_name": "comscore"}'

```

### Sample response

The response echoes the ad account ID.

```
{ "id": "act_<AD_ACCOUNT_ID>" }
```

To confirm the new status, call [GET /act_<AD_ACCOUNT_ID>/insights/feature-settings](#get-feature-settings). Allow up to 24 hours for the breakdown to become queryable in the Ads Insights API.

Passing a feature name that is not in the `list-features` catalog returns `400 Bad Request`. The error message lists the valid feature names.

## Feature status

| Value | Meaning |
| --- | --- |
| `enabled` | The account enabled the feature. If `insights_effective_date` is present, the feature returns data only on or after that date. If `insights_effective_date` is absent, the feature returns data for all dates. |
| `disabled` | The account has not enabled the feature. In practice, the `GET /insights/feature-settings` response omits disabled features rather than returning them with this status. |

## Error codes

| HTTP status | Error type | Description |
| --- | --- | --- |
| `400` | `ParameterException` | Invalid or missing request parameters, such as an unrecognized `feature_name`. |
| `401` | `OAuthException` | The access token is invalid or expired. |
| `403` | `PermissionException` | The token lacks `ads_read` access to the requested ad account. |
| `429` | `RateLimitException` | The request exceeded a rate or usage limit. Wait, then retry the request. |
| `500` | `ServerException` | The request failed because of an internal error. Retry the request. |

For Ads Insights API error codes and subcodes, see [Ads Insights API Error Codes](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights/error-codes).
