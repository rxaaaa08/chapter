<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/ad-creative-branded-content-ads | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Ad Creative Branded Content Ads

## Reading

AdCreativeBrandedContentAds

### Example

[Graph API Explorer**](https://developers.facebook.com/tools/explorer/?method=GET&path=...%3Ffields%3D%257Bfieldname_of_type_AdCreativeBrandedContentAds%257D&version=v26.0)

```
GET v26.0/...?fields={fieldname_of_type_AdCreativeBrandedContentAds} HTTP/1.1
Host: graph.facebook.com
```

```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '...?fields={fieldname_of_type_AdCreativeBrandedContentAds}',
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
    "...?fields={fieldname_of_type_AdCreativeBrandedContentAds}",
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
    "...?fields={fieldname_of_type_AdCreativeBrandedContentAds}",
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
                               initWithGraphPath:@"...?fields={fieldname_of_type_AdCreativeBrandedContentAds}"
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
| `ad_format`int32 | ad_format [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `content_search_input`string | content_search_input [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `creator_ad_permission_type`string | Permission type used to enable partnership in ad [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `is_mca_internal`bool | is_mca_internal [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `parent_source_facebook_post_id`numeric string | parent_source_facebook_post_id [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `parent_source_instagram_media_id`numeric string | parent_source_instagram_media_id [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `partners`list<AdCreativeBrandedContentAdsPartners> | partners [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `product_set_partner_selection_status`string | product_set_partner_selection_status [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `promoted_page_id`numeric string | promoted_page_id [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `testimonial`string | testimonial to be included as part of the Partnership Ad [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `testimonial_locale`string | testimonial_locale [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.
