<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/stats | Saved: 2026-09-19 -->

# Ads Pixel Stats



## Reading

AdsPixelStats

#### Example

### HTTP
```
GET /v25.0/{ads-pixel-id}/stats HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{ads-pixel-id}/stats',
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
    "/{ads-pixel-id}/stats",
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
    "/{ads-pixel-id}/stats",
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
                               initWithGraphPath:@"/{ads-pixel-id}/stats"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bads-pixel-id%7D%2Fstats&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `agent`<br><br>*string* | agent<br> |
| `aggregation`<br><br>*enum{browser_type, custom_data_field, device_os, device_type, event, host, match_keys, had_pii, pixel_fire, event_detection_method, url, event_value_count, url_by_rule, event_total_counts, event_source, event_processing_results}* | **Default value: **`event`<br>The aggregation to use for the stats. Default: `event`.<br><br>`browser_type`: Get the number of<br>pixel fires per browser type, broken down by hour.<br><br>`custom_data_field`: Get the number<br>of pixel fires for the top 100 custom data fields of an event broken<br>down by hour.<br><br>`device_os`: Get the number of pixel<br>fires per mobile device OS, broken down by hour.<br><br>`device_type`: Get the number of<br>pixel fires per mobile device type, broken down by hour.<br><br>`event`: Get the number of pixel<br>fires for the top 100 events broken down by hour.<br><br>`host`: Get the number of pixel<br>fires for the top 10,000 hosts broken down by hour.<br><br>`url`: Get the number of pixel<br>fires for the top 10,000 URLs broken down by hour. Please note that<br>query parameters are stripped from the URLs.<br><br>`pixel_fire`: Get the number of pixel<br>fires by hour.<br><br>`event_total_counts`: Get the number<br>of pixel fires for all events over the entire time span.<br> |
| `end_time`<br><br>*datetime/timestamp* | **Default value: **`<request_time>`<br>The end time of the stats, in the format of Unix or ISO 8601<br>timestamp. You can get the data up to seven days from<br>the request time.<br> |
| `event`<br><br>*string* | Specify which event to aggregate on, when the `aggregation` is<br>`custom_data_field`<br> |
| `event_source`<br><br>*string* | Specify WEB_ONLY or SERVER_ONLY to filter the pixel events and stats<br> |
| `start_time`<br><br>*datetime/timestamp* | The start time of the stats, in the format of Unix or ISO 8601<br>timestamp.<br> |

#### Fields

Reading from this edge will return a JSON formatted result:

```
{
"data": [],
"paging": {}
}
```

##### data

A list of [AdsPixelStatsResult](https://developers.facebook.com/docs/marketing-api/reference/ads-pixel-stats-result) nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |
| 80004 | There have been too many calls to this ad-account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting#ads-management. |
| 200 | Permissions error |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |
| 190 | Invalid OAuth 2.0 Access Token |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

