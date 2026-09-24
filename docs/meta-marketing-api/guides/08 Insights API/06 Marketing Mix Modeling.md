<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights/marketing-mix-modeling | Saved: 2026-09-19 -->

# Marketing Mix Modeling Breakdown on Insights API



The marketing mix modeling breakdown on the Insights API is a self-service data extraction option you can use in order to export Meta ads data quickly and easily without going through a Meta Marketing Science Partner or third-party agencies and mobile measurement partners.

The API calls are built into the Insights API using the `breakdowns=mmm` parameter. **Note:** It is not supported in combination with other `breakdowns` or `action_breakdowns`.

The responses contain similar metrics and breakdowns as results from the Marketing Mix Modeling Data Export in Ads Reporting. Marketing mix modeling data is available only on the ad set level (equivalent to the `level=adset` parameter). Currently, the supported metrics for marketing mix modeling data are `impressions` and `spend`. **Note:** The `spend` metric is estimated. See [Insights API, Estimated and Deprecated Metrics](https://developers.facebook.com/docs/marketing-api/insights/estimated-in-development#estimated) for more information.

### Permissions

You will need the following permissions for your ad account:

* `ads_read`

## Export marketing mix modeling data

Marketing mix modeling data is retrieved as an asynchronous CSV export. Send a `POST` to the `/insights` endpoint with `breakdowns=mmm` and `export_format=csv`. The call returns a `report_run_id`; once the job finishes, download the results from the report run's `async_report_url` field. The CSV uses column names that match those in Ads Manager.

**Note:** A request with `breakdowns=mmm` that does not include `export_format=csv` returns an error. The legacy flow of reading results from `GET /<report_run_id>/insights` is no longer supported—marketing mix modeling results are delivered only as a CSV file.

The Insights API uses default values for parameters you don't specify. We recommend setting the `time_range` or `date_preset` parameter, and using `time_increment` to control granularity.

**Note:** The `time_increment` can be set to 1 day (i.e., `1`), otherwise `all_time` will be used by default.

### 1. Submit the export job

```html
curl -X POST \
  -F "access_token=<ACCESS_TOKEN>" \
  -F "breakdowns=mmm" \
  -F "export_format=csv" \
  -F "level=adset" \
  -F "date_preset=last_7d" \
  -F "time_increment=1" \
"https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/insights"
```

The endpoint responds with the report run ID:

```json
{ "report_run_id": "<REPORT_RUN_ID>" }
```

### 2. Poll for completion

```html
curl -X GET \
  -F "access_token=<ACCESS_TOKEN>" \
"https://graph.facebook.com/v25.0/<REPORT_RUN_ID>?fields=async_status,async_percent_completion"
```

When `async_status` is `Job Completed`, proceed to download.

### 3. Download the CSV

```html
curl -X GET \
  -F "access_token=<ACCESS_TOKEN>" \
"https://graph.facebook.com/v25.0/<REPORT_RUN_ID>?fields=async_report_url"
```

Follow the returned `async_report_url` to download the CSV file.

**Note:** If you open the URL directly and the download fails with the error "Sorry, this content isn't available right now", manually append your access token as a parameter by adding `&access_token=<ACCESS_TOKEN>` to the end of the URL.

For more information about the Insights API and how to onboard to the Marketing API, see the [Insights API Quickstart](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights).

## Querying at the Business Manager Level

A common use case is to retrieve marketing mix modeling data for a single Business Manager. This operation isn't directly supported because the Insights API works on the ad account level and below.

To download data for a Business Manager you first need to query available ad accounts with the `/owned_ad_accounts` and `/client_ad_accounts` endpoints. Then iterate over the returned individual ad account IDs to query the marketing mix modeling data for each ad account.

### Example requests

Using `/owned_ad_accounts`

```
curl GET \
  -F "access_token=<ACCESS_TOKEN>" \
"https://graph.facebook.com/v25.0/<BUSINESS_ID>/owned_ad_accounts"
```

Using `/client_ad_accounts`

```
curl GET \
  -F "access_token=<ACCESS_TOKEN>" \
"https://graph.facebook.com/v25.0/<BUSINESS_ID>/client_ad_accounts"
```

## Limits and best practices

The granularity of marketing mix modeling data causes the response to have a large number of records as well as a substantial record size. This can cause your requests to time out during computation. To mitigate this, decrease the size of the request by using the `time_range` and `filtering` parameters and query for the total time range in sections. To learn more, see [Insights API Limits & Best Practices](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights/best-practices).

Only specific `filtering` supported for querying the marketing mix modeling data. Only these listed operator combinations are allowed for a field; other usages of `filtering` will return an error.

| Field | Allowed Operators |
| --- | --- |
| `campaign.id` | `IN`, `NOT_IN` |
| `campaign.name` | `CONTAIN`, `NOT_CONTAIN` |
| `adset.id` | `IN`, `NOT_IN` |
| `adset.name` | `CONTAIN`, `NOT_CONTAIN` |
| `country` | `IN` |
| `region` | `IN` |
| `dma` | `IN` |
| `device_platform` | `IN` |
| `publisher_platform` | `IN` |
| `platform_position` | `IN` |

We recommend leveraging the Marketing Mix Modeling Data Export in Ads Reporting to export historical data if the API is not needed.

Marketing mix modeling requests always run as asynchronous CSV export jobs (see [Export marketing mix modeling data](#export-marketing-mix-modeling-data) above). The `POST` returns a `report_run_id`; query it for `async_status` and, once the job completes, download the results from `async_report_url`. **Note:** Some requests can still time out even as an asynchronous job—narrow the `time_range` and use `filtering` to reduce the result size. For more information, see [Insights API Asynchronous Jobs](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights/best-practices#asynchronous).

You may encounter slightly different column header mappings and column header ordering than the Marketing Mix Modeling Data Export in Ads Reporting. You also have full flexibility to join the marketing mix modeling breakdown's default data with other tables queried from the API.

| Column Index | Default Column Headers from Marketing Mix Modeling Breakdown |
| --- | --- |
| 0 | `account_id` |
| 1 | `campaign_id` |
| 2 | `adset_id` |
| 3 | `date_start` |
| 4 | `date_stop` |
| 5 | `impressions` |
| 6 | `spend` |
| 7 | `country` |
| 8 | `region` |
| 9 | `dma` |
| 10 | `device_platform` |
| 11 | `platform_position` |
| 12 | `publisher_platform` |
| 13 | `creative_media_type` |

