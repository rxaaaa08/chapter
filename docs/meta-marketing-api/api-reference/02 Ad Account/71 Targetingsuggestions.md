<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/targetingsuggestions | Saved: 2026-09-19 -->

# Ad Account Targetingsuggestions



## Reading

Retrieve suggestions for given targeting specs.

#### Example

### HTTP
```
GET /v25.0/{ad-account-id}/targetingsuggestions HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{ad-account-id}/targetingsuggestions',
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
    "/{ad-account-id}/targetingsuggestions",
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
    "/{ad-account-id}/targetingsuggestions",
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
                               initWithGraphPath:@"/{ad-account-id}/targetingsuggestions"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bad-account-id%7D%2Ftargetingsuggestions&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `app_store`<br><br>*enum {all_app_stores_for_android_and_ios, amazon_app_store, google_play, itunes, itunes_ipad, fb_canvas, fb_gameroom, windows_store, fb_android_store, windows_10_store, roku_channel_store, instant_game, oculus_app_store, horizon_world, galaxy_store, neon_android_store, digital_turbine_store, apk_pure, apk_monk, apk_mirror, xiaomi, oppo, vivo, bemobi_mobile_store, aptoide_a1_store, uptodown, does_not_exist, none}* | The app store for which this ad is being promoted. This is typically only for app install campaign objectives.<br> |
| `limit_type`<br><br>*enum {interests, user_adclusters, behaviors, family_statuses, home_value, income, industries, life_events, interested_in, relationship_statuses, education_statuses, college_years, work_employers, work_positions, education_majors, education_schools, location_categories}* | Used to limit the type of audience to be retrieved.<br> |
| `regulated_categories`<br><br>*array<enum {NONE, EMPLOYMENT, HOUSING, CREDIT, ISSUES_ELECTIONS_POLITICS, ONLINE_GAMBLING_AND_GAMING, FINANCIAL_PRODUCTS_SERVICES}>* | The regulated categories of the campaign<br> |
| `targeting_list`<br><br>*list<JSON or object-like arrays>* | List of targeting specs. Example: [{"type":"interests", "id":1}, {"type":"interests", "id":2}, {"type":"behaviors", "id":3}]<br><br><br>`type` *enum {interests, user_adclusters, behaviors, family_statuses, home_value, income, industries, life_events, interested_in, relationship_statuses, education_statuses, college_years, work_employers, work_positions, education_majors, education_schools, location_categories}*<br><br>`id` *int64* |

#### Fields

Reading from this edge will return a JSON formatted result:

```
{
"data": [],
"paging": {}
}
```

##### data

A list of AdAccountTargetingUnified nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |
| 80004 | There have been too many calls to this ad-account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting#ads-management. |
| 190 | Invalid OAuth 2.0 Access Token |
| 200 | Permissions error |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

