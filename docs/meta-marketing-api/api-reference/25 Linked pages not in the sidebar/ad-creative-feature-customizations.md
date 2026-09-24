<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-customizations | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Ad Creative Feature Customizations

## Reading

AdCreativeFeatureCustomizations

### Example

[Graph API Explorer**](https://developers.facebook.com/tools/explorer/?method=GET&path=...%3Ffields%3D%257Bfieldname_of_type_AdCreativeFeatureCustomizations%257D&version=v26.0)

```
GET v26.0/...?fields={fieldname_of_type_AdCreativeFeatureCustomizations} HTTP/1.1
Host: graph.facebook.com
```

```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '...?fields={fieldname_of_type_AdCreativeFeatureCustomizations}',
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

```
/* make the API call */
FB.api(
    "...?fields={fieldname_of_type_AdCreativeFeatureCustomizations}",
    function (response) {
      if (response && !response.error) {
        /* handle the result */
      }
    }
);
```

```
/* make the API call */
new GraphRequest(
    AccessToken.getCurrentAccessToken(),
    "...?fields={fieldname_of_type_AdCreativeFeatureCustomizations}",
    null,
    HttpMethod.GET,
    new GraphRequest.Callback() {
        public void onCompleted(GraphResponse response) {
            /* handle the result */
        }
    }
).executeAsync();
```

```
/* make the API call */
FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc]
                               initWithGraphPath:@"...?fields={fieldname_of_type_AdCreativeFeatureCustomizations}"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api/).

### Parameters

This endpoint doesn't have any parameters.

### Fields

| Field | Description |
| --- | --- |
| `aspect_ratio_config`[AdCreativeFeatureCustomizationsAspectRatiosConfig](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-customizations-aspect-ratios-config/) | aspect_ratio_config [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `image_crop_style`enum | image_crop_style [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `is_shopping_links`bool | is_shopping_links [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `placement_groups`[AdCreativeFeatureCustomizationsPlacementGroups](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-customizations-placement-groups/) | placement_groups [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `product_versioning_fallback_strategy`enum | This defines the fallback strategy while a product doesn't have the customized versioning. By default, it's fallback to main product. `FALLBACK_DISABLED`: the Ads will never show the product without the specified versioning. `FALLBACK_TO_DEFAULT_PRODUCT`: the creative will fallback to the default product. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `shopping_links_randomized_order`bool | shopping_links_randomized_order [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `text_extraction`[AdCreativeFeatureCustomizationsEnrollStatus](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-customizations-enroll-status/) | text_extraction [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.
