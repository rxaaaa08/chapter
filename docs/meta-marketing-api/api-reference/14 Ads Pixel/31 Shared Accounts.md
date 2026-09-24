<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/shared_accounts | Saved: 2026-09-19 -->

# Ads Pixel Shared Accounts



## Reading

**Warning:** At the end of September 2024, the `POST /{pixel-id}/shared_accounts` API (including previous versions) will not support sharing of pixels with an ad account, if a business account does not have access to both pixel and ad account. Refer to the [pixel sharing API solution](https://developers.facebook.com/docs/marketing-api/business-asset-management/guides/business-pixel-sharing) to use `POST /{pixel-id}/agencies` or use `POST {ad_account}/agencies` to share into a business account, then use `POST /{pixel-id}/shared_accounts` to link pixel and ad account

#### Example

### HTTP
```
GET /v25.0/{pixel-id}/shared_accounts?business=%7Bbusiness-id%7D HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{pixel-id}/shared_accounts?business=%7Bbusiness-id%7D',
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
    "/{pixel-id}/shared_accounts",
    {
        "business": "{business-id}"
    },
    function (response) {
      if (response && !response.error) {
        /* handle the result */
      }
    }
);
```

### Android SDK
```
Bundle params = new Bundle();
params.putString("business", "{business-id}");
/* make the API call */
new GraphRequest(
    AccessToken.getCurrentAccessToken(),
    "/{pixel-id}/shared_accounts",
    params,
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
NSDictionary *params = @{
  @"business": @"{business-id}",
};
/* make the API call */
FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc]
                               initWithGraphPath:@"/{pixel-id}/shared_accounts"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

### cURL
```
curl -X GET -G \
  -d 'business=null' \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/{pixel-id}/shared_accounts
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bpixel-id%7D%2Fshared_accounts%3Fbusiness%3D%257Bbusiness-id%257D&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `business`<br><br>*numeric string or integer* | ID of the business whose ad accounts the pixel was shared<br>to are fetched<br><br>**[required]**<br> |

#### Fields

Reading from this edge will return a JSON formatted result:

```
{
"data": []
}
```

##### data

A list of [AdAccount](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account) nodes.

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |
| 190 | Invalid OAuth 2.0 Access Token |

## Creating

### /{ads_pixel_id}/shared_accounts
You can make a POST request to *shared_accounts* edge from the following paths:

- [/{ads_pixel_id}/shared_accounts](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/shared_accounts)

When posting to this edge, no Graph object will be created.

#### Example

### HTTP
```
POST /v25.0/{pixel-id}/shared_accounts HTTP/1.1
Host: graph.facebook.com

account_id=%7Bad-account-id%7D&business=%7Bbusiness-id%7D
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->post(
    '/{pixel-id}/shared_accounts',
    array (
      'account_id' => '{ad-account-id}',
      'business' => '{business-id}',
    ),
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
    "/{pixel-id}/shared_accounts",
    "POST",
    {
        "account_id": "{ad-account-id}",
        "business": "{business-id}"
    },
    function (response) {
      if (response && !response.error) {
        /* handle the result */
      }
    }
);
```

### Android SDK
```
Bundle params = new Bundle();
params.putString("account_id", "{ad-account-id}");
params.putString("business", "{business-id}");
/* make the API call */
new GraphRequest(
    AccessToken.getCurrentAccessToken(),
    "/{pixel-id}/shared_accounts",
    params,
    HttpMethod.POST,
    new GraphRequest.Callback() {
        public void onCompleted(GraphResponse response) {
            /* handle the result */
        }
    }
).executeAsync();
```

### iOS SDK
```
NSDictionary *params = @{
  @"account_id": @"{ad-account-id}",
  @"business": @"{business-id}",
};
/* make the API call */
FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc]
                               initWithGraphPath:@"/{pixel-id}/shared_accounts"
                                      parameters:params
                                      HTTPMethod:@"POST"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

### cURL
```
curl -X POST \
  -F 'account_id=null' \
  -F 'business=null' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/{pixel-id}/shared_accounts
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=POST&path=%7Bpixel-id%7D%2Fshared_accounts%3Faccount_id%3D%257Bad-account-id%257D%26business%3D%257Bbusiness-id%257D&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `account_id`<br><br>*numeric string* | SELF_EXPLANATORY<br><br>**[required]**<br> |
| `business`<br><br>*numeric string or integer* | SELF_EXPLANATORY<br><br>**[required]**<br> |

#### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node to which you POSTed.

```
Struct  {
success: bool,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |
| 200 | Permissions error |
| 190 | Invalid OAuth 2.0 Access Token |

## Updating

You can't perform this operation on this endpoint.

## Deleting

### /{ads_pixel_id}/shared_accounts
You can dissociate an [AdAccount](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account) from an [AdsPixel](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel) by making a DELETE request to [/{ads_pixel_id}/shared_accounts](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/shared_accounts).

#### Parameters

| Parameter | Description |
| --- | --- |
| `account_id`<br><br>*numeric string* | SELF_EXPLANATORY<br><br>**[required]**<br> |
| `business`<br><br>*numeric string or integer* | SELF_EXPLANATORY<br><br>**[required]**<br> |

#### Return Type

```
Struct  {
success: bool,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |

