<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/asyncadcreatives | Saved: 2026-09-19 -->

# Ad Account Asyncadcreatives



## Reading

Async ad creative jobs from this Ad Account.

#### Example

### HTTP
```
GET /v25.0/{ad-account-id}/asyncadcreatives HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{ad-account-id}/asyncadcreatives',
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
    "/{ad-account-id}/asyncadcreatives",
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
    "/{ad-account-id}/asyncadcreatives",
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
                               initWithGraphPath:@"/{ad-account-id}/asyncadcreatives"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bad-account-id%7D%2Fasyncadcreatives&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `is_completed`<br><br>*boolean* | If `true`, we only return completed ad request sets.<br> |

#### Fields

Reading from this edge will return a JSON formatted result:

```
{
"data": [],
"paging": {}
}
```

##### data

A list of [AdAsyncRequestSet](https://developers.facebook.com/documentation/ads-commerce/marketing-api/asyncrequests) nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

#### Error Codes

| Error Code | Description |
| --- | --- |
| 80004 | There have been too many calls to this ad-account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting#ads-management. |

## Creating

### /act_{ad_account_id}/asyncadcreatives
You can make a POST request to *asyncadcreatives* edge from the following paths:

- [/act_{ad_account_id}/asyncadcreatives](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/asyncadcreatives)

When posting to this edge, no Graph object will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `creative_spec`<br><br>*AdCreative* | Specs for ad creative<br><br>**[required]**<br><br>**[supports emoji]**<br> |
| `name`<br><br>*UTF-8 encoded string* | Name of async job<br><br>**[required]**<br> |
| `notification_mode`<br><br>*enum{OFF, ON_COMPLETE}* | Specify `0` for no notifications and `1` for notification on completion.<br> |
| `notification_uri`<br><br>*URL* | If notifications are enabled, specify the URL to send them.<br> |

#### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node represented by *id* in the return type.

```
Struct  {
id: numeric string,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

