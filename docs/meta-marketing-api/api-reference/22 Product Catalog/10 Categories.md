<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/categories | Saved: 2026-09-19 -->

# Product Catalog Categories



## Reading

Categories and associated assets within given product catalog.

#### Example

### HTTP
```
GET /v25.0/{product-catalog-id}/categories HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{product-catalog-id}/categories',
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
    "/{product-catalog-id}/categories",
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
    "/{product-catalog-id}/categories",
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
                               initWithGraphPath:@"/{product-catalog-id}/categories"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bproduct-catalog-id%7D%2Fcategories&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `categorization_criteria`<br><br>*enum {BRAND, CATEGORY, PRODUCT_TYPE}* | Product property used to define categories<br><br>**[required]**<br> |
| `filter`<br><br>*A JSON-encoded rule* | SELF_EXPLANATORY<br> |

#### Fields

Reading from this edge will return a JSON formatted result:

```
{
"data": [],
"paging": {}
}
```

##### data

A list of ProductCatalogCategory nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |

## Creating

### /{product_catalog_id}/categories
You can make a POST request to *categories* edge from the following paths:

- [/{product_catalog_id}/categories](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/categories)

When posting to this edge, a [ProductCatalogCategory](https://developers.facebook.com/docs/graph-api/reference/product-catalog-category) will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `data`<br><br>*list<JSON object>* | Array of category specifications<br><br>**[required]**<br><br><br>`categorization_criteria` *enum {BRAND, CATEGORY, PRODUCT_TYPE}*<br>**[required]**<br><br><br>`criteria_value` *string*<br>**[required]**<br><br><br>`name` *UTF-8 string*<br>**[supports emoji]**<br><br><br>`description` *UTF-8 string*<br>**[supports emoji]**<br><br><br>`destination_uri` *URL*<br><br>`image_url` *URL*<br><br>`tokens` *JSON object {string : string}* |

#### Return Type

```
Struct  {
updated: integer,
skipped: integer,
total: integer,
details:  Map  {
string:  List  [ Map  {
string: string}]},
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

