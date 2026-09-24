<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/diagnostics | Saved: 2026-09-19 -->

# Product Catalog Diagnostics



**Note:** Learn more about the [Diagnostics API](https://developers.facebook.com/documentation/ads-commerce/catalog/guides/diagnostics-api), the detailed insights it provides, and guidance on resolving catalog issues that may be impacting ad performance.

## Reading

ProductCatalogDiagnostics

#### Example

### HTTP
```
GET /v25.0/{product-catalog-id}/diagnostics HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{product-catalog-id}/diagnostics',
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
    "/{product-catalog-id}/diagnostics",
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
    "/{product-catalog-id}/diagnostics",
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
                               initWithGraphPath:@"/{product-catalog-id}/diagnostics"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bproduct-catalog-id%7D%2Fdiagnostics&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `affected_channels`<br><br>*list<enum{marketplace, marketplace_ads_deprecated, marketplace_shops, b2c_marketplace, c2c_marketplace, da, daily_deals_legacy, daily_deals, ig_product_tagging, offline_conversions, universal_checkout, mini_shops, shops, whatsapp}>* | **Default value: **`Set`<br>affected_channels<br> |
| `affected_entities`<br><br>*list<enum{product_item, product_catalog, product_set, product_event}>* | **Default value: **`Set`<br>affected_entities<br> |
| `affected_features`<br><br>*list<enum{checkout, augmented_reality}>* | **Default value: **`Set`<br>affected_features<br> |
| `severities`<br><br>*list<enum{MUST_FIX, OPPORTUNITY}>* | **Default value: **`Set`<br>severities<br> |
| `types`<br><br>*list<enum{AR_VISIBILITY_ISSUES, ATTRIBUTES_INVALID, ATTRIBUTES_MISSING, CATEGORY, CHECKOUT, DA_VISIBILITY_ISSUES, EVENT_SOURCE_ISSUES, IMAGE_QUALITY, LOW_QUALITY_TITLE_AND_DESCRIPTION, POLICY_VIOLATION, SHOPS_VISIBILITY_ISSUES}>* | **Default value: **`Set`<br>types<br> |

#### Fields

Reading from this edge will return a JSON formatted result:

```
{
"data": [],
"paging": {}
}
```

##### data

A list of [ProductCatalogDiagnosticGroup](https://developers.facebook.com/docs/graph-api/reference/product-catalog-diagnostic-group) nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

