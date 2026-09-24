<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/reporting | Saved: 2026-09-19 -->

# Ad Account Reporting



## Reading

Provides the Report Builder's response.

#### Example

### HTTP
```
GET /v25.0/{ad-account-id}/reporting HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{ad-account-id}/reporting',
    '{access-token}'
  );
} catch(Facebook\Exceptions\FacebookResponseException $e) {
  echo 'Graph returned an error: ' . $e->getMessage();
  exit;
} catch(Facebook\Exceptions\FacebookSDKException $e) {
  echo 'Facebook SDK returned an error: ' . $e->getMessage();
  exit;
}
$graphNode = $response->getGraphNode();
/* handle the result */
```

### JavaScript SDK
```
/* make the API call */
FB.api(
    "/{ad-account-id}/reporting",
    function (response) {
      if (response && !response.error) {
        /* handle the result */
      }
    }
);
```

### Android SDK
```
/* make the API call */
new GraphRequest(
    AccessToken.getCurrentAccessToken(),
    "/{ad-account-id}/reporting",
    null,
    HttpMethod.GET,
    new GraphRequest.Callback() {
        public void onCompleted(GraphResponse response) {
            /* handle the result */
        }
    }
).executeAsync();
```

### iOS SDK
```
/* make the API call */
FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc]
                               initWithGraphPath:@"/{ad-account-id}/reporting"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bad-account-id%7D%2Freporting&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `action_report_time`<br><br>*enum {impression, conversion, mixed, lifetime}* | action_report_time<br> |
| `attribution_windows`<br><br>*array<enum {1d_view, 7d_view, 28d_view, 1d_click, 7d_click, 28d_click, 1d_ev, dda, default, 7d_view_first_conversion, 28d_view_first_conversion, 7d_view_all_conversions, 28d_view_all_conversions, skan_view, skan_click, skan_click_second_postback, skan_view_second_postback, skan_click_third_postback, skan_view_third_postback}>* | Attribution window for the actions.<br> |
| `comparison_time_range`<br><br>*{'since':YYYY-MM-DD,'until':YYYY-MM-DD}* | Map of time range objects for comparison.<br><br><br>`since` *datetime*<br>A date in the format of "YYYY-MM-DD", which means from the beginning midnight of that day.<br><br><br>`until` *datetime*<br>A date in the format of "YYYY-MM-DD", which means to the beginning midnight of the following day.<br> |
| `date_preset`<br><br>*enum {today, yesterday, this_month, last_month, this_quarter, maximum, data_maximum, last_3d, last_7d, last_14d, last_28d, last_30d, last_90d, last_week_mon_sun, last_week_sun_sat, last_quarter, last_year, this_week_mon_today, this_week_sun_today, this_year}* | The date preset. Represents a relative time range.<br> |
| `default_summary`<br><br>*boolean* | Determine whether to return a summary. If this param is used, a summary section will be included with the metrics.<br> |
| `dimension_groups`<br><br>*array<array<string>>* | The groups of dimensions, where each group is treated one dimension.<br> |
| `dimensions`<br><br>*array<string>* | The dimensions required in the report.<br> |
| `filtering`<br><br>*Filters used in report builder* | **Default value: **`Vec`<br>Fields for the report to be filtered on.<br><br><br>`field` *string*<br>**[required]**<br><br><br>`operator` *enum {EQUAL, NOT_EQUAL, GREATER_THAN, GREATER_THAN_OR_EQUAL, LESS_THAN, LESS_THAN_OR_EQUAL, IN_RANGE, NOT_IN_RANGE, CONTAIN, NOT_CONTAIN, CONTAINS_ANY, CONTAINS_ALL, NOT_CONTAINS_ANY, STEM_MATCH, IN, NOT_IN, STARTS_WITH, ENDS_WITH, ANY, ALL, AFTER, BEFORE, ON_OR_AFTER, ON_OR_BEFORE, NONE, TOP}*<br>**[required]**<br><br><br>`value` *string*<br>**[required]**<br> |
| `formatting`<br><br>*JSON object {string : array<JSON object>}* | conditional formatting<br> |
| `last_dimension`<br><br>*JSON object {string : string}* | Last dimesion values returned in previous request. If provided, API will seek from this poistion in saved pagination.<br> |
| `last_report_snapshot_id`<br><br>*int64* | The last report snapshot ID.<br> |
| `limit`<br><br>*integer* | The limit on number of data rows requested.<br> |
| `locked_dimensions`<br><br>*int64* | **Default value: **`0`<br>The locked dimensions.<br> |
| `metrics`<br><br>*array<string>* | The metrics whose values are required.<br> |
| `offset`<br><br>*int64* | Indicates the offset.<br> |
| `pagination_key`<br><br>*string* | Internal application pagination key. If provided, API will seek saved pagination.<br> |
| `sorting`<br><br>*array<JSON object>* | Represents the sorting fields and their sort directions.<br><br><br>`field` *string*<br>field<br><br>**[required]**<br><br><br>`direction` *enum {asc, desc}*<br><br>**Default value: **`"desc"`<br>direction<br> |
| `summary_count`<br><br>*boolean* | Determine whether to return the count of all rows.<br> |
| `time_range`<br><br>*{'since':YYYY-MM-DD,'until':YYYY-MM-DD}* | The time range.<br><br><br>`since` *datetime*<br>A date in the format of "YYYY-MM-DD", which means from the beginning midnight of that day.<br><br><br>`until` *datetime*<br>A date in the format of "YYYY-MM-DD", which means to the beginning midnight of the following day.<br> |

#### Fields

Reading from this edge will return a JSON formatted result:

```
{
"data": [],
"paging": {},
"summary": {}
}
```

##### data

A list of AdsReportBuilder nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

##### summary

Aggregated information about the edge, such as counts. Specify the fields to fetch in the summary param (like summary=__type__).

| Field | Description |
| --- | --- |
| `headers`<br><br>*AdsReportBuilderHeader* | Contains the header information (includes dimensions, columns etc)<br><br><br>**[default]**<br> |
| `rows`<br><br>*list<AdsReportBuilderRow>* | Contains data rows.<br><br><br>**[default]**<br> |
| `total_count`<br><br>*int32* | Total number of rows<br><br><br>**[default]**<br> |

#### Error Codes

| Error Code | Description |
| --- | --- |
| 2616 | The reporting data you are trying to fetch has too many rows. Please pull data for shorter time periods or use filters to restrict the number of ad IDs |
| 100 | Invalid parameter |
| 190 | Invalid OAuth 2.0 Access Token |
| 200 | Permissions error |

## Creating

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

