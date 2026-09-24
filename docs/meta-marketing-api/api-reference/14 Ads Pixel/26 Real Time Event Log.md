<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/real_time_event_log | Saved: 2026-09-19 -->

# Ads Pixel Real Time Event Log



## Reading

Edge to read list of recent pixel fires for the logged in user

#### Example

### HTTP
```
GET /v25.0/{ads-pixel-id}/real_time_event_log HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{ads-pixel-id}/real_time_event_log',
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
    "/{ads-pixel-id}/real_time_event_log",
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
    "/{ads-pixel-id}/real_time_event_log",
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
                               initWithGraphPath:@"/{ads-pixel-id}/real_time_event_log"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bads-pixel-id%7D%2Freal_time_event_log&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `end_time`<br><br>*datetime/timestamp* | Do not return pixel fires after this (epoch) time<br> |
| `limit`<br><br>*int64* | **Default value: **`100`<br>latest number of pixel fires at most within a time window<br> |
| `session_key`<br><br>*string* | Unique identifier for a real time logging component<br> |
| `start_time`<br><br>*datetime/timestamp* | Do not return pixel fires before this (epoch) time<br> |
| `trace_id`<br><br>*string* | unique id used to record every individual pixel request<br> |

#### Fields

Reading from this edge will return a JSON formatted result:

```
{
"data": [],
"paging": {}
}
```

##### data

A list of AdsPixelRealTimeEventLogResult nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |

## Creating

You can't perform this operation on this endpoint.

## Updating

## Deleting

