<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/product_audiences | Saved: 2026-09-19 -->

# Ad Account Product Audiences



## Reading

You can't perform this operation on this endpoint.

## Creating

### /act_{ad_account_id}/product_audiences
You can make a POST request to *product_audiences* edge from the following paths:

- [/act_{ad_account_id}/product_audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/product_audiences)

When posting to this edge, an [AdAccount](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account) will be created.

#### Example

### HTTP
```
POST /v25.0/act_<AD_ACCOUNT_ID>/product_audiences HTTP/1.1
Host: graph.facebook.com

name=Test+Iphone+Product+Audience&product_set_id=%3CPRODUCT_SET_ID%3E&inclusions=%5B%7B%22retention_seconds%22%3A86400%2C%22rule%22%3A%7B%22and%22%3A%5B%7B%22event%22%3A%7B%22eq%22%3A%22AddToCart%22%7D%7D%2C%7B%22userAgent%22%3A%7B%22i_contains%22%3A%22iPhone%22%7D%7D%5D%7D%7D%5D&exclusions=%5B%7B%22retention_seconds%22%3A172800%2C%22rule%22%3A%7B%22event%22%3A%7B%22eq%22%3A%22Purchase%22%7D%7D%7D%5D
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->post(
    '/act_<AD_ACCOUNT_ID>/product_audiences',
    array (
      'name' => 'Test Iphone Product Audience',
      'product_set_id' => '<PRODUCT_SET_ID>',
      'inclusions' => '[{"retention_seconds":86400,"rule":{"and":[{"event":{"eq":"AddToCart"}},{"userAgent":{"i_contains":"iPhone"}}]}}]',
      'exclusions' => '[{"retention_seconds":172800,"rule":{"event":{"eq":"Purchase"}}}]',
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
    "/act_<AD_ACCOUNT_ID>/product_audiences",
    "POST",
    {
        "name": "Test Iphone Product Audience",
        "product_set_id": "<PRODUCT_SET_ID>",
        "inclusions": "[{\"retention_seconds\":86400,\"rule\":{\"and\":[{\"event\":{\"eq\":\"AddToCart\"}},{\"userAgent\":{\"i_contains\":\"iPhone\"}}]}}]",
        "exclusions": "[{\"retention_seconds\":172800,\"rule\":{\"event\":{\"eq\":\"Purchase\"}}}]"
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
params.putString("name", "Test Iphone Product Audience");
params.putString("product_set_id", "<PRODUCT_SET_ID>");
params.putString("inclusions", "[{\"retention_seconds\":86400,\"rule\":{\"and\":[{\"event\":{\"eq\":\"AddToCart\"}},{\"userAgent\":{\"i_contains\":\"iPhone\"}}]}}]");
params.putString("exclusions", "[{\"retention_seconds\":172800,\"rule\":{\"event\":{\"eq\":\"Purchase\"}}}]");
/* make the API call */
new GraphRequest(
    AccessToken.getCurrentAccessToken(),
    "/act_<AD_ACCOUNT_ID>/product_audiences",
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
  @"name": @"Test Iphone Product Audience",
  @"product_set_id": @"<PRODUCT_SET_ID>",
  @"inclusions": @"[{\"retention_seconds\":86400,\"rule\":{\"and\":[{\"event\":{\"eq\":\"AddToCart\"}},{\"userAgent\":{\"i_contains\":\"iPhone\"}}]}}]",
  @"exclusions": @"[{\"retention_seconds\":172800,\"rule\":{\"event\":{\"eq\":\"Purchase\"}}}]",
};
/* make the API call */
FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc]
                               initWithGraphPath:@"/act_<AD_ACCOUNT_ID>/product_audiences"
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
  -F 'name="Test Iphone Product Audience"' \
  -F 'product_set_id="<PRODUCT_SET_ID>"' \
  -F 'inclusions=[
       {
         "retention_seconds": 86400,
         "rule": {
           "and": [
             {
               "event": {
                 "eq": "AddToCart"
               }
             },
             {
               "userAgent": {
                 "i_contains": "iPhone"
               }
             }
           ]
         }
       }
     ]' \
  -F 'exclusions=[
       {
         "retention_seconds": 172800,
         "rule": {
           "event": {
             "eq": "Purchase"
           }
         }
       }
     ]' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/product_audiences
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=POST&path=act_%3CAD_ACCOUNT_ID%3E%2Fproduct_audiences%3Fname%3DTest%2BIphone%2BProduct%2BAudience%26product_set_id%3D%253CPRODUCT_SET_ID%253E%26inclusions%3D%255B%257B%2522retention_seconds%2522%253A86400%252C%2522rule%2522%253A%257B%2522and%2522%253A%255B%257B%2522event%2522%253A%257B%2522eq%2522%253A%2522AddToCart%2522%257D%257D%252C%257B%2522userAgent%2522%253A%257B%2522i_contains%2522%253A%2522iPhone%2522%257D%257D%255D%257D%257D%255D%26exclusions%3D%255B%257B%2522retention_seconds%2522%253A172800%252C%2522rule%2522%253A%257B%2522event%2522%253A%257B%2522eq%2522%253A%2522Purchase%2522%257D%257D%257D%255D&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `associated_audience_id`<br><br>*int64* | SELF_EXPLANATORY<br> |
| `creation_params`<br><br>*dictionary { string : <string> }* | SELF_EXPLANATORY<br> |
| `description`<br><br>*string* | SELF_EXPLANATORY<br> |
| `enable_fetch_or_create`<br><br>*boolean* | enable_fetch_or_create<br> |
| `event_sources`<br><br>*array<JSON object>* | event_sources<br><br><br>`id` *int64*<br>id<br><br>**[required]**<br><br><br>`type` *enum {APP, OFFLINE_EVENTS, PAGE, PIXEL}*<br>type<br><br>**[required]**<br> |
| `exclusions`<br><br>*list<Object>* | SELF_EXPLANATORY<br><br><br>`booking_window` *Object*<br><br>`min_seconds` *int64*<br><br>`max_seconds` *int64*<br><br>`count` *Object*<br><br>`event` *string*<br><br>`type` *enum {CUSTOM, PRIMARY, WEBSITE, APP, OFFLINE_CONVERSION, CLAIM, MANAGED, PARTNER, VIDEO, LOOKALIKE, ENGAGEMENT, BAG_OF_ACCOUNTS, STUDY_RULE_AUDIENCE, FOX, MEASUREMENT, REGULATED_CATEGORIES_AUDIENCE, BIDDING, EXCLUSION, MESSENGER_SUBSCRIBER_LIST}*<br><br>`retention` *Object*<br><br>`min_seconds` *integer*<br>**[required]**<br><br><br>`max_seconds` *integer*<br>**[required]**<br><br><br>`retention_days` *int64*<br><br>`retention_seconds` *integer*<br><br>`rule` *Object*<br><br>`pixel_id` *int64* |
| `inclusions`<br><br>*list<Object>* | SELF_EXPLANATORY<br><br><br>`booking_window` *Object*<br><br>`min_seconds` *int64*<br><br>`max_seconds` *int64*<br><br>`count` *Object*<br><br>`event` *string*<br><br>`type` *enum {CUSTOM, PRIMARY, WEBSITE, APP, OFFLINE_CONVERSION, CLAIM, MANAGED, PARTNER, VIDEO, LOOKALIKE, ENGAGEMENT, BAG_OF_ACCOUNTS, STUDY_RULE_AUDIENCE, FOX, MEASUREMENT, REGULATED_CATEGORIES_AUDIENCE, BIDDING, EXCLUSION, MESSENGER_SUBSCRIBER_LIST}*<br><br>`retention` *Object*<br><br>`min_seconds` *integer*<br>**[required]**<br><br><br>`max_seconds` *integer*<br>**[required]**<br><br><br>`retention_days` *int64*<br><br>`retention_seconds` *integer*<br><br>`rule` *Object*<br><br>`pixel_id` *int64* |
| `name`<br><br>*string* | SELF_EXPLANATORY<br><br>**[required]**<br> |
| `opt_out_link`<br><br>*string* | SELF_EXPLANATORY<br> |
| `parent_audience_id`<br><br>*int64* | SELF_EXPLANATORY<br> |
| `product_set_id`<br><br>*numeric string or integer* | SELF_EXPLANATORY<br><br>**[required]**<br> |
| `subtype`<br><br>*enum {CUSTOM, PRIMARY, WEBSITE, APP, OFFLINE_CONVERSION, CLAIM, MANAGED, PARTNER, VIDEO, LOOKALIKE, ENGAGEMENT, BAG_OF_ACCOUNTS, STUDY_RULE_AUDIENCE, FOX, MEASUREMENT, REGULATED_CATEGORIES_AUDIENCE, BIDDING, EXCLUSION, MESSENGER_SUBSCRIBER_LIST}* | SELF_EXPLANATORY<br> |

#### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node represented by *id* in the return type.

```
Struct  {
id: numeric string,
message: string,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |
| 2654 | Failed to create custom audience |

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

