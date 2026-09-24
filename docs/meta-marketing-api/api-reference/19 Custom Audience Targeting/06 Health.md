<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience/health | Saved: 2026-09-19 -->

# Custom Audience Health



## Reading

This endpoint will expose the aggregated user value data that is shared via Audience API.

#### Example

### HTTP
```
GET /v25.0/{custom-audience-id}/health HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{custom-audience-id}/health',
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
    "/{custom-audience-id}/health",
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
    "/{custom-audience-id}/health",
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
                               initWithGraphPath:@"/{custom-audience-id}/health"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bcustom-audience-id%7D%2Fhealth&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `calculated_date`<br><br>*string* | The UTC calculated date / click date associated with this information, this will be a string in the format “YYYY-MM-DD” i.e. “2025-01-01”<br> |
| `processed_date`<br><br>*string* | The UTC date on which the data was received, this will be a string in the format “YYYY-MM-DD” i.e. “2025-02-01”<br> |
| `value_aggregation_duration`<br><br>*int64* | The duration over which this value type was calculated<br> |
| `value_country`<br><br>*string* | The country associated to the value field<br> |
| `value_currency`<br><br>*string* | The currency associated to the value field<br> |
| `value_version`<br><br>*int64* | The value version of this calculation (e.g. V1 data, V2 data represented as 1 or 2 respectively)<br> |

#### Fields

Reading from this edge will return a JSON formatted result:

```
{
"data": [],
"paging": {}
}
```

##### data

A list of CustomAudienceHealth nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

