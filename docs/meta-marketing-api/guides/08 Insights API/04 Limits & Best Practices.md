<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights/best-practices | Saved: 2026-09-19 -->

# Limits and Best Practices


**Warning:** **Ads Management Standard Access is now Marketing API Access Tier**

**No code changes are needed.**

Tier labels have been updated: "Standard Access" is now **Limited Access**, and "Advanced Access" is now **Full Access**. The revised qualification threshold for Full Access has been reduced from 1,500 to **500 Marketing API calls** in the past 15 days. The underlying permission identifier remains the same, and existing access levels are preserved automatically. Learn more in the [Marketing API Access Tier documentation](https://developers.facebook.com/docs/features-reference#marketing-api-access-tier).

**Warning:** Beginning June 10, 2025, to improve overall API performance, `reach` will no longer be returned for standard queries that apply `breakdowns` and use `start_date`s more than 13 months old. (Responses to such requests will omit `reach` and related fields, such as `frequency` and `cpp`.)

To apply `breakdowns` and still retrieve >13-month-old `reach` values, you can use asynchronous jobs to make up to 10 requests per Ad Account per day. Check the `x-Fb-Ads-Insights-Reach-Throttle` header to monitor how close you are to that rate-limit, and note that once the rate-limit is breached, requests will omit `reach` and related fields.

When the rate limit threshold for reach-related breakdowns is exceeded, the following error message will be returned:

```
Reach-related metric breakdowns are unavailable due to rate limit threshold.
```

Facebook Insights API provides performance data from Facebook marketing campaigns. To protect system performance and stability, we have protective measures to equally distribute system resources among applications. All policies we describe below are subject to change.

## Timeouts

The most common issue causing failure for Ads Insights API calls is too many requests and time outs.

* `/GET` or synchronous requests can return out-of-memory or timeout errors.
* `/POST` or asynchronous requests can return timeout errors.  For asynchronous requests, it can take up to an hour to complete a request including retry attempts. For example, if you make a query that tries to fetch a large volume of data for many ad level objects.

### Recommendations

* There is no explicit limit for when a query will fail.  When it times out, try to break down the query into smaller queries by using filters like date range.
* Unique metrics are time consuming to compute. Try to query unique metrics in a separate call to improve performance of non-unique metrics.

## Data Per Call Limits {#datapercall}
We use data-per-call limits to prevent a query from retrieving too much data beyond what the system can handle. There are 2 types of data limits:

1. By number of rows in response, and
2. By number of data points required to compute the total, such as summary row.  

These limits apply to both sync and async `/insights` calls, and we return an error:

```
error_code = 100,  CodeException (error subcode: 1487534)
```

### Best Practices, Data Per Call Limits
* Limit your query by limiting the date range or number of ad ids. You can also limit your query to metrics that are necessary, or break it down into multiple queries with each requesting a subset of metrics.
* Avoid account-level queries that include high cardinality breakdowns such as `action_target_id` or `product_id`, and wider date ranges like lifetime.
* Use `/insights` edge directly with lower level ad objects to retrieve granular data for that level. For example, first use the account-level query to fetch the list of lower-level object ids with `level` and `filtering` parameters. In this example, we fetch all campaigns that recorded some impressions:

```
curl -G \
-d 'access_token=<ACCESS_TOKEN>' \
-d 'level=campaign' \
-d 'filtering=[{field:"ad.impressions",operator:"GREATER_THAN",value:0}]' \
'https://graph.facebook.com/v2.7/act_<ACCOUNT_ID>/insights'
```

* We can then use `/<campaign_id>/insights` with each returned value to query and [batch the insights requests](https://developers.facebook.com/docs/marketing-api/batch-requests/v2.6#adinsights) for these campaigns in a single call:

```
curl \
-F 'access_token=<ACCESS_TOKEN>' \
-F 'batch=[ \
  { \
    "method": "GET", \
    "relative_url": "v25.0/<CAMPAIGN_ID_1>/insights?fields=impressions,spend,ad_id,adset_id&level=ad" \
  }, \
  { \
    "method": "GET", \
    "relative_url": "v25.0/<CAMPAIGN_ID_2>/insights?fields=impressions,spend,ad_id,adset_id&level=ad" \
  }, \
  { \
    "method": "GET", \
    "relative_url": "v25.0/<CAMPAIGN_ID_3>/insights?fields=impressions,spend,ad_id,adset_id&level=ad" \
  } \
]' \
'https://graph.facebook.com'
```

* Use `filtering` parameter only to retrieve insights for ad objects with data. The field value specified in `filtering` uses DOT notation to denote the fields under the object. Please note that filtering with `STARTS_WITH` and `CONTAIN` does not change the summary data. In this case, use the `IN` operator. See example of a `filtering` request:

```
curl -G \
-d 'access_token=<ACCESS_TOKEN>' \
-d 'level=ad' \
-d 'filtering=[{field:"ad.impressions",operator:"GREATER_THAN",value:0},]' \
'https://graph.facebook.com/v25.0/act_<ACCOUNT_ID>/insights'
```

* Use `date_preset` if possible. Custom date ranges are less efficient to run in our system.
* Use [batch requests](https://developers.facebook.com/docs/marketing-api/batch-requests/v2.6#adinsights) for multiple sync calls and  async to query for large volume of data to avoid timeouts.
* Try sync calls first and then use async calls in cases where sync calls timeout
* Insights refresh every 15 minutes and do not change after 28 days of being reported
* Insights metrics may continue to update for a couple of days after an ad has completed

## Insights Call Load Limits {#insightscallload}

Ninety days from the release of v3.3 and effective for all public versions, we change the ad account level rate limit to better reflect the volume of API calls needed. We compute the rate limit quota on your Marketing API access tier and the business owning your app. see [Access and Authentication](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/authorization). This change applies to all Ads Insights API endpoints: `GET {adaccount_ID}/insights`, `GET {campaign_ID}/insights`, `GET {adset_ID}/insights`, `GET {ad_ID}/insights`, `POST {adaccount_ID}/insights`, `POST {campaign_ID}/insights`, `POST {adset_ID}/insights`, `POST {ad_ID}/insights`.

We use load limits for optimal reporting experience. We measure API calls for their rate as well as the resources they require. We allow a fixed load limit per application per second. When you exceed that limit, your requests fail.

Check the `x-fb-ads-insights-throttle` HTTP header in every API response to know how close your app is to its limit as well as to estimate how heavy a particular query may be. Insights calls are also subject to the default ad account limits shown in the `x-ad-account-usage` HTTP header. More details can be found here [Marketing API, Best Practices](https://developers.facebook.com/documentation/ads-commerce/marketing-api/best-practices#adsoverview)

Once an app reaches its limit, the call gets an error response with `error_code = 4, CodedException`. You should stay well below your limit. If your app reaches its allowed limits, only a certain percentage of requests go through, depending on the query, and the rate.

We apply rate limiting to each app sending synchronous and asynchronous `/insights` calls combined. The two main parameters limits are counted against are by application, and by ad account.

Here's an example of the HTTP header with an application's accrued score as a percentage of the limits:

```
X-FB-Ads-Insights-Throttle: { "app_id_util_pct": 100, "acc_id_util_pct": 10, "ads_api_access_tier": "standard_access" }
```

The header "x-fb-ads-insights-throttle" is a JSON value containing these info:

* `app_id_util_pct` —    The percentage of allocated capacity for the associated app_id has consumed.
* `acc_id_util_pct` —    The percentage of allocated capacity for the associated ad account_id has consumed.
* `ads_api_access_tier` — Tiers allows your app to access the Marketing API. `standard_access` enables lower rate limiting.

### Global Rate Limits

During periods of elevated global load to the `/insights` endpoint, the system can throttle requests to protect the backend. This can occur in rare cases when too many queries of high complexity (large time ranges, complex metrics, and/or high number of ad object IDs) are coming at the same time. This will manifest in an error that looks like this:

```
error_code = 4,  CodeException (error subcode: 1504022), error_title: Too many API requests
```

During these periods, it is advised to reduce calls, wait a short period, and query again.  

### Rate Limits Best Practices

* Sending several queries at once are more likely to trigger our rate limiting.  Try to spread your `/insights` queries by pacing them with wait time in your job.
* Use the rate information in the HTTP response header to moderate your calls. Add a back-off mechanism to slow down or pause your `/insights` queries when you come close to hitting 100% utility for your application, or for your ad account.
* We report ad insights data in the ad account's timezone. To retrieve insights data for the associated ad account daily, consider the time of day using the account timezone. This helps pace queries throughout the day.
* Check the `ads_api_access_tier` that allows you to access the Marketing API. By default, apps are in the `development_access` tier and `standard_access` enables lower rate limiting. To get a higher rate limit and get to the standard tier, you can apply for the "Advanced Access" to the [Marketing API Access Tier](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/authorization#layer-2--access-levels--permissions--and-features) feature.

## Insights API Asynchronous Jobs {#asynchronous}

Fetch stats on many objects and apply filtering and sorting; we made the asynchronous workflow simpler:

#### 1. Send a `POST` request to `<AD_OBJECT>/insights` endpoint, which responds with the `id` of an [Ad Report Run](https://developers.facebook.com/docs/marketing-api/reference/ad-report-run).

```
{
  "report_run_id": 6023920149050,
}
```

Do not store the `report_run_id` for long term use, it expires after 30 days.

#### 2. Ad Report Runs contain information about this asynchronous job, such as `async_status`. Poll this field until `async_status` is `Job Completed` and `async_percent_completion` is `100`.

```
{
  "id": "6044775548468",
  "account_id": "1010035716096012",
  "time_ref": 1459788928,
  "time_completed": 1459788990,
  "async_status": "Job Completed",
  "async_percent_completion": 100
}
```

**Note:** Beginning with Marketing API v25.0, if the report fails, you will see the corresponding `error_code`, `error_message`, `error_subcode`, `error_user_title`, and `error_user_msg` fields returned by default. See the [Ads Insights Error Codes](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights/error-codes) for more details on the returned error codes.

#### 3. Then you can query `<AD_REPORT_RUN_ID>/insights` edge to fetch the final result.

```
{
  "data": [
    {
      "impressions": "9708",
      "date_start": "2009-03-28",
      "date_stop": "2016-04-04"
    },
    {
      "impressions": "18841",
      "date_start": "2009-03-28",
      "date_stop": "2016-04-04"
    }
  ],
  "paging": {
    "cursors": {
      "before": "MAZDZD",
      "after": "MQZDZD"
    }
  }
}
```

This job gets all stats for the account and returns an asynchronous job ID:

```
curl \
  -F 'level=campaign' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/<CAMPAIGN_ID>/insights
curl -G \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/1000002
curl -G \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/1000003/insights
```

### Async Job Status

| Status | Description |
| --- | --- |
| `Job Not Started` | Job has not started yet. |
| `Job Started` | Job has been started, but is not yet running. |
| `Job Running` | Job has started running. |
| `Job Completed` | Job has successfully completed. |
| `Job Failed` | Job has failed. Review your query and try again. |
| `Job Skipped` | Job has expired and skipped.  Please resubmit your job and try again. |

## Export Reports

We provide a convenience endpoint for exporting `<AD_REPORT_RUN_ID>` to a localized human-readable format.

Note: this endpoint is not part of our versioned Graph API and therefore does not conform to its breaking-change policy. Scripts and programs should not rely on the format of the result as it may change unexpectedly.

```
  curl -G \
  -d 'report_run_id=<AD_REPORT_RUN_ID>' \
  -d 'name=myreport' \
  -d 'format=xls' \
'https://www.facebook.com/ads/ads_insights/export_report/'
```

| Name | Description |
| --- | --- |
| `name`<br><br>*string* | Name of downloaded file |
| `format`<br><br>*enum{csv,xls}* | Format of file |
| `report_run_id`<br><br>*integer* | ID of report to run |
| `access_token`<br><br>*string* | Permissions granted by the logged-in user. Provide this to export reports for another user. |

## Discrepancy with Ads Manager

**Warning:** Beginning June 10, 2025, to reduce discrepancies with Meta Ads Manager, the `use_unified_attribution_setting` and `action_report_time` parameters will be disregarded and API responses will mimic Ads Manager settings:

* Attributed `value`s will be based on ad set level attribution settings (similar to `use_unified_attribution_setting=true`), and inline/on-ad actions will be included in `1d_click` or `1d_view` attribution window data. After this change, standalone `inline` attribution window data will no longer be returned.
* Actions will be reported using `action_report_time=mixed`: on-Meta actions (e.g., Link Clicks) will use impression-based reporting time; whereas off-Meta actions (e.g., Web Purchases) will leverage conversion-based reporting time.

The default behavior of the API is different from the default behavior of Ads Manager. If you would like to observe the same behavior as in Ads Manager, set the `use_unified_attribution_setting` field to `true`.
