<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/ad-creative-ad-disclaimer | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Ad Creative Ad Disclaimer

## Reading

Disclaimer information to attach to your ad creative. When using disclaimers: - title is required - at least one of text or url is required.

### Example

[Graph API Explorer**](https://developers.facebook.com/tools/explorer/?method=GET&path=...%3Ffields%3D%257Bfieldname_of_type_AdCreativeAdDisclaimer%257D&version=v26.0)

```
GET v26.0/...?fields={fieldname_of_type_AdCreativeAdDisclaimer} HTTP/1.1
Host: graph.facebook.com
```

```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '...?fields={fieldname_of_type_AdCreativeAdDisclaimer}',
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
    "...?fields={fieldname_of_type_AdCreativeAdDisclaimer}",
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
    "...?fields={fieldname_of_type_AdCreativeAdDisclaimer}",
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
                               initWithGraphPath:@"...?fields={fieldname_of_type_AdCreativeAdDisclaimer}"
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
| `text`string | Text description of your disclaimer. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `title`string | Title of the disclaimer on your ad. Can only be one of the following values: 'health_disclaimer', 'important_safety_information', 'medication_guide', 'offer_details', 'prescribing_information', 'terms_and_conditions' [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `url`string | Link for your disclaimer. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.
