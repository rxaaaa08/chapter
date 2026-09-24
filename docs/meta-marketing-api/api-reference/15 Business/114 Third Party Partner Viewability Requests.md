<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/third_party_partner_viewability_requests | Saved: 2026-09-19 -->

# Business Third Party Partner Viewability Requests



## Reading

Retrieve all existing Viewability reports related to a business

#### Example

### HTTP
```
GET /v25.0/{business-id}/third_party_partner_viewability_requests HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{business-id}/third_party_partner_viewability_requests',
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
    "/{business-id}/third_party_partner_viewability_requests",
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
    "/{business-id}/third_party_partner_viewability_requests",
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
                               initWithGraphPath:@"/{business-id}/third_party_partner_viewability_requests"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bbusiness-id%7D%2Fthird_party_partner_viewability_requests&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `end_ds`<br><br>*string* | Required filter for daily request.  The ending datestamp for a time range of reports. Return reports where start_ds <= ds <= end_ds.<br> |
| `end_ts`<br><br>*datetime/timestamp* | Required filter for hourly request. The ending unix timestamp for a time range of reports. Return reports where start_ts <= hour <= end_ts.<br><br><br>Example:<br><br><br>• end_ts = 1706774400<br> |
| `platform`<br><br>*enum {AUDIENCE_NETWORK, FACEBOOK, INSTAGRAM}* | Optional filter on platform of the report.<br><br><br>From the set {AUDIENCE_NETWORK, FACEBOOK, INSTAGRAM, INVALID}.<br><br><br>Valid input example:<br><br><br>• platform=FACEBOOK<br><br><br>Invalid input example:<br><br><br>• platform='FACEBOOK'<br>• platform=['FACEBOOK'. 'INSTAGRAM']<br> |
| `start_ds`<br><br>*string* | Required filter for daily request.  The starting datestamp for a time range of reports. Return reports where start_ds <= ds <= end_ds.<br> |
| `start_ts`<br><br>*datetime/timestamp* | Required filter for hourly request. The staring unix timestamp for a time range of reports. Return reports where start_ts <= hour <= end_ts.<br><br><br>Example:<br><br><br>• start_ts = 1704096000<br> |
| `type`<br><br>*enum {DISPLAY_EVENT, IMPRESSION, VIDEO_EVENT}* | Optional filter on metrics type of the report.<br><br><br>From the set {DISPLAY_EVENT, IMPRESSION, INVALID, VIDEO_EVENT}.<br><br><br>Valid input example:<br><br><br>• type=DISPLAY_EVENT<br><br><br>Invalid input example:<br><br><br>• type='DISPLAY_EVENT'<br>• type=['DISPLAY_EVENT'. 'FULL_VIEW']<br> |

#### Fields

Reading from this edge will return a JSON formatted result:

```
{
"data": [],
"paging": {}
}
```

##### data

A list of [ThirdPartyPartnerViewabilityRequest](https://developers.facebook.com/docs/graph-api/reference/third-party-partner-viewability-request) nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

#### Error Codes

| Error Code | Description |
| --- | --- |
| 2500 | Error parsing graph query |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

