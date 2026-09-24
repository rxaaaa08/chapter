<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience/adaccounts | Saved: 2026-09-19 -->

# GET Custom Audience Ad Accounts



## Reading

Custom audience ad accounts

#### Example

### HTTP
```
GET /v25.0/{custom-audience-id}/adaccounts HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{custom-audience-id}/adaccounts',
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
    "/{custom-audience-id}/adaccounts",
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
    "/{custom-audience-id}/adaccounts",
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
                               initWithGraphPath:@"/{custom-audience-id}/adaccounts"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bcustom-audience-id%7D%2Fadaccounts&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `permissions`<br><br>*string* | Optional permission filter for the shared ad account IDs. Values can be `targeting` for getting account IDs with only targeting permissions, or `targeting_and_insights` to get account IDs with both targeting and insights permissions.If not set, it will return all shared ad account IDs.<br> |

#### Fields

Reading from this edge will return a JSON formatted result:

```
{
"data": [],
"paging": {}
}
```

##### data

A list of [CustomAudienceAdAccount](https://developers.facebook.com/docs/marketing-api/reference/custom-audience-ad-account) nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |

## Creating

To share audiences with other ad accounts, a business must claim the owner ad account and recipient ad accounts.

The recipient ad account can include or exclude the shared custom audience in targeting spec. Optionally, the recipient ad account can also have the access to view the audience insights with the insights tool. If the optional permissions parameter is not set, the default is `targeting_and_insights`.

You can share audiences with other ad accounts via the [`ad_accounts`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience/ad_accounts#Creating) edge.

**Warning:** The destination account cannot modify the audience or use it as a seed audience to create lookalikes.

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You **can** also unshare an audience with an ad account by specifying [`delete`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience/ad_accounts#Deleting) to the same endpoint with the `ad_accounts` field set to the ad account you want to remove access. Any existing ads running from these accounts using this audience will be stopped and cannot be restarted.

You can't perform this operation on this endpoint.

