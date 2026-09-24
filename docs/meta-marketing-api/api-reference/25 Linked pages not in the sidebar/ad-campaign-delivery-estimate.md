<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/ad-campaign-delivery-estimate | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Ad Campaign Delivery Estimate

## Reading

The delivery estimates for a given ad set configuration.

### Example

[Graph API Explorer**](https://developers.facebook.com/tools/explorer/?method=GET&path=...%3Ffields%3D%257Bfieldname_of_type_AdCampaignDeliveryEstimate%257D&version=v26.0)

```
GET v26.0/...?fields={fieldname_of_type_AdCampaignDeliveryEstimate} HTTP/1.1
Host: graph.facebook.com
```

```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '...?fields={fieldname_of_type_AdCampaignDeliveryEstimate}',
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
    "...?fields={fieldname_of_type_AdCampaignDeliveryEstimate}",
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
    "...?fields={fieldname_of_type_AdCampaignDeliveryEstimate}",
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
                               initWithGraphPath:@"...?fields={fieldname_of_type_AdCampaignDeliveryEstimate}"
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

This endpoint doesn't have any parameters.

### Fields

| Field | Description |
| --- | --- |
| `estimate_mau_lower_bound`integer | The lower bound of the estimated number of people that have been active on your selected platforms and satisfy your targeting spec in the past month [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `estimate_mau_upper_bound`integer | The upper bound of the estimated number of people that have been active on your selected platforms and satisfy your targeting spec in the past month [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `estimate_ready`bool | Whether or not an estimate is ready for the audience. Some audiences require time to populate before we can provide a delivery estimate [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `targeting_optimization_types`[**](#)list<KeyValue:string,int32> | Targeting options that are used as a signal for optimization |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.
