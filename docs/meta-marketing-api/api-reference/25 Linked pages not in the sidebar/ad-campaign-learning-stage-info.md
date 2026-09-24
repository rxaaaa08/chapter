<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/ad-campaign-learning-stage-info | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Ad Campaign Learning Stage Info

## Reading

Learning stage information for an ad set.

### Limitations

* Only returned for active ad sets.
* Ad sets using [Dynamic Creative Optimization](https://developers.facebook.com/docs/marketing-api/ad-creative/asset-feed-spec/dynamic-creative) will not return learning stage information.
* Not all ad accounts are eligible for the learning stage information.

### Example

[Graph API Explorer**](https://developers.facebook.com/tools/explorer/?method=GET&path=...%3Ffields%3D%257Bfieldname_of_type_AdCampaignLearningStageInfo%257D&version=v26.0)

```
GET v26.0/...?fields={fieldname_of_type_AdCampaignLearningStageInfo} HTTP/1.1
Host: graph.facebook.com
```

```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '...?fields={fieldname_of_type_AdCampaignLearningStageInfo}',
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
    "...?fields={fieldname_of_type_AdCampaignLearningStageInfo}",
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
    "...?fields={fieldname_of_type_AdCampaignLearningStageInfo}",
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
                               initWithGraphPath:@"...?fields={fieldname_of_type_AdCampaignLearningStageInfo}"
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
| `attribution_windows`list<enum> | Number of days between when a person viewed or clicked your ad and subsequently took action. By default, the attribution window is set to 1-day view and 28-day click. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `conversions`unsigned integer | Number of conversions the ad set generated since the time of its last significant edit during the learning phase. Significant edits cause ad sets to reenter the learning phase. If the ad set has exited the learning phase successfully, this number will return zero. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `dynamic_lp_conversions_threshold`unsigned integer | New conversions threshold for dynamic learning phase status |
| `dynamic_lp_days_threshold`unsigned integer | Day to exit for dynamic learning phase |
| `dynamic_lp_status`enum | dynamic learning phase status |
| `last_sig_edit_ts`integer | Timestamp of the last significant edit that caused ad set to reenter the learning phase. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `status`enum | Learning Phase progress for the ad set. **Values:** * `LEARNING` — The ad set is still learning. * `SUCCESS` — The ad set exited the learning phase. * `FAIL` — The ad set isn’t generating enough results to exit the learning phase. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.
