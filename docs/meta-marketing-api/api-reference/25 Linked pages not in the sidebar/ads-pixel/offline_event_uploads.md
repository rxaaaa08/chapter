<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/ads-pixel/offline_event_uploads | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Ads Pixel Offline Event Uploads

## Reading

AdsPixelOfflineEventUploads

### Example

[Graph API Explorer**](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bads-pixel-id%7D%2Foffline_event_uploads&version=v26.0)

```
GET /v26.0/{ads-pixel-id}/offline_event_uploads HTTP/1.1
Host: graph.facebook.com
```

```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{ads-pixel-id}/offline_event_uploads',
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

```
/* make the API call */
FB.api(
    "/{ads-pixel-id}/offline_event_uploads",
    function (response) {
      if (response && !response.error) {
        /* handle the result */
      }
    }
);
```

```
/* make the API call */
new GraphRequest(
    AccessToken.getCurrentAccessToken(),
    "/{ads-pixel-id}/offline_event_uploads",
    null,
    HttpMethod.GET,
    new GraphRequest.Callback() {
        public void onCompleted(GraphResponse response) {
            /* handle the result */
        }
    }
).executeAsync();
```

```
/* make the API call */
FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc]
                               initWithGraphPath:@"/{ads-pixel-id}/offline_event_uploads"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api/).

### Parameters

| Parameter | Description |
| --- | --- |
| `end_time`datetime/timestamp | end_time |
| `order`enum {ASCENDING, DESCENDING} | Default value: `"DESCENDING"` order |
| `sort_by`enum {CREATION_TIME, FIRST_UPLOAD_TIME, LAST_UPLOAD_TIME, API_CALLS, EVENT_TIME_MIN, EVENT_TIME_MAX, IS_EXCLUDED_FOR_LIFT} | Default value: `"LAST_UPLOAD_TIME"` sort_by |
| `start_time`datetime/timestamp | start_time |
| `upload_tag`string | upload_tag |

### Fields

Reading from this edge will return a JSON formatted result:

```

{
    "data": [],
    "paging": {}
}

```

#### `data`

A list of [OfflineConversionDataSetUpload](https://developers.facebook.com/docs/graph-api/reference/offline-conversion-data-set-upload/) nodes.

#### `paging`

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api/#paging).

### Error Codes

| Error | Description |
| --- | --- |
| 100 | Invalid parameter |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.
