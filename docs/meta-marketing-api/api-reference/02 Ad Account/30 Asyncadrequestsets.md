<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/asyncadrequestsets | Saved: 2026-09-19 -->

# Ad Account Asyncadrequestsets



## Reading

Async ad request sets from this Ad Account.

#### Example

### HTTP
```
GET /v25.0/{ad-account-id}/asyncadrequestsets HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{ad-account-id}/asyncadrequestsets',
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
    "/{ad-account-id}/asyncadrequestsets",
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
    "/{ad-account-id}/asyncadrequestsets",
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
                               initWithGraphPath:@"/{ad-account-id}/asyncadrequestsets"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bad-account-id%7D%2Fasyncadrequestsets&version=v25.0)

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
| 200 | Permissions error |

## Creating

### /act_{ad_account_id}/asyncadrequestsets
You can make a POST request to *asyncadrequestsets* edge from the following paths:

- [/act_{ad_account_id}/asyncadrequestsets](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/asyncadrequestsets)

When posting to this edge, no Graph object will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `ad_specs`<br><br>*list<dictionary { non-empty string : <string> }>* | Specs for ads in the request set<br><br>**[required]**<br> |
| `name`<br><br>*UTF-8 encoded string* | Name of the request set<br><br>**[required]**<br> |
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

