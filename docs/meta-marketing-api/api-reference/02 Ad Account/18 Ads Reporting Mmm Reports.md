<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/ads_reporting_mmm_reports | Saved: 2026-09-19 -->

# Ad Account Ads Reporting Mmm Reports



## Reading

Edge between ad account and MMM report

#### Example

### HTTP
```
GET /v25.0/{ad-account-id}/ads_reporting_mmm_reports HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{ad-account-id}/ads_reporting_mmm_reports',
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
    "/{ad-account-id}/ads_reporting_mmm_reports",
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
    "/{ad-account-id}/ads_reporting_mmm_reports",
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
                               initWithGraphPath:@"/{ad-account-id}/ads_reporting_mmm_reports"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bad-account-id%7D%2Fads_reporting_mmm_reports&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `filtering`<br><br>*array<JSON object>* | filtering<br><br><br>`field` *string*<br>field<br><br>**[required]**<br><br><br>`operator` *enum {AFTER, ALL, ANY, BEFORE, CONTAIN, EQUAL, GREATER_THAN, GREATER_THAN_OR_EQUAL, IN, IN_RANGE, LESS_THAN, LESS_THAN_OR_EQUAL, NONE, NOT_CONTAIN, NOT_EQUAL, NOT_IN, NOT_IN_RANGE, ON_OR_AFTER, ON_OR_BEFORE, STARTS_WITH, MATCH, STEM_MATCH, TOP, CONTAINS_ANY, CONTAINS_ALL, NOT_CONTAINS_ANY}*<br>operator<br><br>**[required]**<br><br><br>`value` *string*<br>value<br><br>**[required]**<br> |

#### Fields

Reading from this edge will return a JSON formatted result:

```
{
"data": [],
"paging": {}
}
```

##### data

A list of AdsReportBuilderMMMReport nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

#### Error Codes

| Error Code | Description |
| --- | --- |
| 200 | Permissions error |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

