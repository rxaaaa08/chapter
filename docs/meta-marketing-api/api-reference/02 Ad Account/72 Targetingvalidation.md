<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/targetingvalidation | Saved: 2026-09-19 -->

# Ad Account Targetingvalidation



## Reading

Query the ads framework for validation

#### Example

### HTTP
```
GET /v25.0/{ad-account-id}/targetingvalidation HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{ad-account-id}/targetingvalidation',
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
    "/{ad-account-id}/targetingvalidation",
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
    "/{ad-account-id}/targetingvalidation",
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
                               initWithGraphPath:@"/{ad-account-id}/targetingvalidation"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bad-account-id%7D%2Ftargetingvalidation&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `id_list`<br><br>*list<int64>* | List of IDs to validate. Supports interest and categories.<br> |
| `is_exclusion`<br><br>*boolean* | **Default value: **`false`<br>Whether the targeting IDs can be used in exclusion.<br> |
| `name_list`<br><br>*list<string>* | List of names to validate. Supports interest and categories.<br> |
| `targeting_list`<br><br>*list<JSON or object-like arrays>* | List with targeting type and ID pairs<br><br><br>`type` *enum {interests, education_statuses, education_schools, education_majors, work_positions, work_employers, interested_in, relationship_statuses, college_years, family_statuses, industries, life_events, political_views, politics, behaviors, income, net_worth, home_type, home_ownership, home_value, ethnic_affinity, generation, household_composition, moms, office_type, user_adclusters}*<br><br>`id` *int64* |

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
| 80004 | There have been too many calls to this ad-account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting#ads-management. |
| 100 | Invalid parameter |
| 200 | Permissions error |
| 190 | Invalid OAuth 2.0 Access Token |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

