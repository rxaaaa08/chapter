<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/dsa_recommendations | Saved: 2026-09-19 -->

# Ad Account Dsa Recommendations



As part of the requirements set forth by the European Union (EU) Digital Services Act (DSA), we've begun requiring ads targeting any part of the EU to provide string values defining the beneficiary and payor of the ad being created.  In order to facilitate developers in providing this mandatory information, we're offering a new API that outputs a list of strings that we've identified to likely be the beneficiary/payer, based on recent activity of the ad account. See the [Ad Account DSA Recommendations](https://developers.facebook.com/docs/marketing-api/reference/ad-account-dsa-recommendations) field reference for more information.

**Note:** Even though our data suggests that these predicted values often match up with what advertisers end up manually inputting for their DSA Beneficiary/Payor, we don't guarantee that these will be correct, and users should still review them before publishing their campaigns.

## Reading

AdAccountDsaRecommendations

#### Example

### HTTP
```
GET /v25.0/{ad-account-id}/dsa_recommendations HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{ad-account-id}/dsa_recommendations',
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
    "/{ad-account-id}/dsa_recommendations",
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
    "/{ad-account-id}/dsa_recommendations",
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
                               initWithGraphPath:@"/{ad-account-id}/dsa_recommendations"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bad-account-id%7D%2Fdsa_recommendations&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

This endpoint doesn't have any parameters.

#### Fields

Reading from this edge will return a JSON formatted result:

```
{
"data": [],
"paging": {}
}
```

##### data

A list of [AdAccountDsaRecommendations](https://developers.facebook.com/docs/marketing-api/reference/ad-account-dsa-recommendations) nodes.

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

