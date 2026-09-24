<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/adnetworkanalytics | Saved: 2026-09-19 -->

# Business Adnetworkanalytics



## Reading

Audience Network Insights for this publisher entity

#### Example

### HTTP
```
GET /v25.0/{business-id}/adnetworkanalytics HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{business-id}/adnetworkanalytics',
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
    "/{business-id}/adnetworkanalytics",
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
    "/{business-id}/adnetworkanalytics",
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
                               initWithGraphPath:@"/{business-id}/adnetworkanalytics"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bbusiness-id%7D%2Fadnetworkanalytics&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `aggregation_period`<br><br>*enum {DAY, TOTAL}* | **Default value: **`"DAY"`<br>The interval to aggregate by<br> |
| `breakdowns`<br><br>*array<enum {AGE, APP, COUNTRY, DELIVERY_METHOD, DISPLAY_FORMAT, DEAL, DEAL_AD, DEAL_PAGE, GENDER, PLACEMENT, PLACEMENT_NAME, AD_SPACE, PLATFORM, PROPERTY, CLICKED_VIEW_TAG, FAIL_REASON, SDK_VERSION, INSTANT_ARTICLE_PAGE_ID, INSTANT_ARTICLE_ID, AD_SERVER_CAMPAIGN_ID, IS_DEAL_BACKFILL}>* | **Default value: **`[]`<br>Optional breakdowns for results<br> |
| `filters`<br><br>*array<JSON object>* | **Default value: **`[]`<br>Additional filters for the query<br><br><br>`field` *enum {AGE, APP, COUNTRY, DELIVERY_METHOD, DISPLAY_FORMAT, DEAL, DEAL_AD, DEAL_PAGE, GENDER, PLACEMENT, PLACEMENT_NAME, AD_SPACE, PLATFORM, PROPERTY, CLICKED_VIEW_TAG, FAIL_REASON, SDK_VERSION, INSTANT_ARTICLE_PAGE_ID, INSTANT_ARTICLE_ID, AD_SERVER_CAMPAIGN_ID, IS_DEAL_BACKFILL}*<br>field<br><br>**[required]**<br><br><br>`operator` *enum {IN, NOT_IN}*<br>operator<br><br>**[required]**<br><br><br>`values` *array<string>*<br>values<br><br>**[required]**<br> |
| `limit`<br><br>*int64* | **Default value: **`2000`<br>Limit the number of rows returned<br> |
| `metrics`<br><br>*array<enum {FB_AD_NETWORK_BIDDING_REQUEST, FB_AD_NETWORK_BIDDING_RESPONSE, FB_AD_NETWORK_BIDDING_BID_RATE, FB_AD_NETWORK_BIDDING_WIN_RATE, FB_AD_NETWORK_REQUEST, FB_AD_NETWORK_FILLED_REQUEST, FB_AD_NETWORK_FILL_RATE, FB_AD_NETWORK_IMP, FB_AD_NETWORK_IMPRESSION_RATE, FB_AD_NETWORK_CLICK, FB_AD_NETWORK_CTR, FB_AD_NETWORK_BIDDING_REVENUE, FB_AD_NETWORK_REVENUE, FB_AD_NETWORK_CPM, FB_AD_NETWORK_VIDEO_GUARANTEE_REVENUE, FB_AD_NETWORK_VIDEO_VIEW, FB_AD_NETWORK_VIDEO_VIEW_RATE, FB_AD_NETWORK_VIDEO_MRC, FB_AD_NETWORK_VIDEO_MRC_RATE, FB_AD_NETWORK_SHOW_RATE}>* | List of metrics to query for<br><br>**[required]**<br> |
| `ordering_column`<br><br>*enum {TIME, VALUE, METRIC}* | **Default value: **`"TIME"`<br>Order results by value (result of the aggregation) or by time.<br> |
| `ordering_type`<br><br>*enum {ASCENDING, DESCENDING}* | **Default value: **`"DESCENDING"`<br>Ascending or descending<br> |
| `should_include_until`<br><br>*boolean* | should_include_until<br> |
| `since`<br><br>*datetime/timestamp* | A unix timestamp or strtotime data value that indicates the start of the data range<br> |
| `until`<br><br>*datetime/timestamp* | A unix timestamp or strtotime data value that indicates the end of the data range<br> |

#### Fields

Reading from this edge will return a JSON formatted result:

```
{
"data": [],
"paging": {}
}
```

##### data

A list of AdNetworkAnalyticsSyncQueryResult nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |
| 3000 | Reading insights of a Page, business, app, domain or event source group not owned by the querying user or application |
| 104 | Incorrect signature |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |
| 613 | Calls to this api have exceeded the rate limit. |
| 190 | Invalid OAuth 2.0 Access Token |

## Creating

### /{business_id}/adnetworkanalytics
You can make a POST request to *adnetworkanalytics* edge from the following paths:

- [/{business_id}/adnetworkanalytics](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/adnetworkanalytics)

When posting to this edge, an [AnalyticsQueryResult](https://developers.facebook.com/docs/graph-api/reference/analytics-query-result) will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `aggregation_period`<br><br>*enum {DAY, TOTAL}* | **Default value: **`DAY`<br>The interval to aggregate by<br> |
| `breakdowns`<br><br>*list<enum {AGE, APP, COUNTRY, DELIVERY_METHOD, DISPLAY_FORMAT, DEAL, DEAL_AD, DEAL_PAGE, GENDER, PLACEMENT, PLACEMENT_NAME, AD_SPACE, PLATFORM, PROPERTY, CLICKED_VIEW_TAG, FAIL_REASON, SDK_VERSION, INSTANT_ARTICLE_PAGE_ID, INSTANT_ARTICLE_ID, AD_SERVER_CAMPAIGN_ID, IS_DEAL_BACKFILL}>* | **Default value: **`Vec`<br>Optional breakdowns for results<br> |
| `filters`<br><br>*list<Object>* | **Default value: **`Vec`<br>Additional filters for the query<br><br><br>`field` *enum {AGE, APP, COUNTRY, DELIVERY_METHOD, DISPLAY_FORMAT, DEAL, DEAL_AD, DEAL_PAGE, GENDER, PLACEMENT, PLACEMENT_NAME, AD_SPACE, PLATFORM, PROPERTY, CLICKED_VIEW_TAG, FAIL_REASON, SDK_VERSION, INSTANT_ARTICLE_PAGE_ID, INSTANT_ARTICLE_ID, AD_SERVER_CAMPAIGN_ID, IS_DEAL_BACKFILL}*<br>Field on which filter is applied. Currently, only valid breakdowns are supported in filters. eg. Country, OS, etc.<br><br>**[required]**<br><br><br>`operator` *enum {IN, NOT_IN}*<br>The intended operation between field and values. eg. IN, etc.<br><br>**[required]**<br><br><br>`values` *list<string>*<br><br>**Default value: **`Vec`<br>Values of corresponding field which must be filtered in result subject to the operator. The results join the different field valuesdisjunctively. eg. For Filters = {"Country", "IN", ["US", UK]} translates to {"Country", "IN", "US"} OR {"Country", "IN", "UK"}<br> |
| `limit`<br><br>*integer* | **Default value: **`20000`<br>Limit the number of rows returned<br> |
| `metrics`<br><br>*list<enum {FB_AD_NETWORK_BIDDING_REQUEST, FB_AD_NETWORK_BIDDING_RESPONSE, FB_AD_NETWORK_BIDDING_BID_RATE, FB_AD_NETWORK_BIDDING_WIN_RATE, FB_AD_NETWORK_REQUEST, FB_AD_NETWORK_FILLED_REQUEST, FB_AD_NETWORK_FILL_RATE, FB_AD_NETWORK_IMP, FB_AD_NETWORK_IMPRESSION_RATE, FB_AD_NETWORK_CLICK, FB_AD_NETWORK_CTR, FB_AD_NETWORK_BIDDING_REVENUE, FB_AD_NETWORK_REVENUE, FB_AD_NETWORK_CPM, FB_AD_NETWORK_VIDEO_GUARANTEE_REVENUE, FB_AD_NETWORK_VIDEO_VIEW, FB_AD_NETWORK_VIDEO_VIEW_RATE, FB_AD_NETWORK_VIDEO_MRC, FB_AD_NETWORK_VIDEO_MRC_RATE, FB_AD_NETWORK_SHOW_RATE}>* | Metrics to return<br><br>**[required]**<br> |
| `ordering_column`<br><br>*enum {TIME, VALUE, METRIC}* | **Default value: **`TIME`<br>Order results by value (result of the aggregation) or by time.<br> |
| `ordering_type`<br><br>*enum {ASCENDING, DESCENDING}* | **Default value: **`DESCENDING`<br>Ascending or descending<br> |
| `since`<br><br>*datetime/timestamp* | A unix timestamp or strtotime data value that indicates the start of the data range<br> |
| `until`<br><br>*datetime/timestamp* | A unix timestamp or strtotime data value that indicates the end of the data range<br> |

#### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node to which you POSTed.

```
Struct  {
query_id: string,
async_result_link: string,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 3000 | Reading insights of a Page, business, app, domain or event source group not owned by the querying user or application |
| 100 | Invalid parameter |

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

