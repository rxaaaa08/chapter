<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/account_controls | Saved: 2026-09-19 -->

# Ad Account Account Controls



## Reading

Get default fields on an [AdAccountBusinessConstraints](https://developers.facebook.com/docs/marketing-api/reference/ad-account-business-constraints) node associated with this [AdAccount](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account). Refer to the [AdAccountBusinessConstraints](https://developers.facebook.com/docs/marketing-api/reference/ad-account-business-constraints) reference for a list of these fields and their descriptions.

#### Example

### HTTP
```
GET /v25.0/{ad-account-id}/account_controls HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{ad-account-id}/account_controls',
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
    "/{ad-account-id}/account_controls",
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
    "/{ad-account-id}/account_controls",
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
                               initWithGraphPath:@"/{ad-account-id}/account_controls"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bad-account-id%7D%2Faccount_controls&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

This endpoint doesn't have any parameters.

#### Fields

Reading from this edge will return a JSON formatted result:

```
{
"data": [],
"paging": {}
}
```

##### data

A list of [AdAccountBusinessConstraints](https://developers.facebook.com/docs/marketing-api/reference/ad-account-business-constraints) nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

#### Error Codes

| Error Code | Description |
| --- | --- |
| 200 | Permissions error |
| 100 | Invalid parameter |
| 190 | Invalid OAuth 2.0 Access Token |

## Creating

### /act_{ad_account_id}/account_controls
You can make a POST request to *account_controls* edge from the following paths:

- [/act_{ad_account_id}/account_controls](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/account_controls)

When posting to this edge, an [AdAccountBusinessConstraints](https://developers.facebook.com/docs/marketing-api/reference/ad-account-business-constraints) will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `audience_controls`<br><br>*JSON or object-like arrays* | audience_controls<br><br>**[required]**<br><br><br>`age_min` *int64*<br><br>`geo_locations` *JSON or object-like arrays*<br><br>`excluded_geo_locations` *JSON or object-like arrays*<br><br>`exclusions` *JSON or object-like arrays* |
| `placement_controls`<br><br>*JSON or object-like arrays* | This field contains another field called placement_exclusion that provides information on which placements need to be excluded while targeting. All the other placements will be included. Each placement is denoted by a string that concatenates the publisher platform of the placement and a position inside the publisher platform, separated by an underscore. What is provided as parameter is a list of placements. For e.g. If we want to exclude the rewarded videos position from the audience network publisher platform, we provide the field as follows: { "placement_controls": { "placement_exclusions": ["audience_network_rewarded_video"] } } Only a few placements are allowed to be excluded: audience_network_classic (native, banner & interstitial positions of audience network) audience_network_rewarded_video (rewarded videos of audience network) audience_network_instream_video (instream videos of audience network) facebook_marketplace (marketplace section inside facebook) facebook_rhc (right hand column inside facebook)<br><br><br>`placement_exclusions` *array<enum {AUDIENCE_NETWORK_CLASSIC, AUDIENCE_NETWORK_REWARDED_VIDEO, AUDIENCE_NETWORK_INSTREAM_VIDEO, FACEBOOK_MARKETPLACE, FACEBOOK_RIGHT_HAND_COLUMN}>*<br><br>`campaign_ids_to_set_ap` *array<numeric string>* |

#### Return Type

```
Struct  {
id: string,
success: bool,
error_code: string,
error_message: string,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |
| 2641 | Your ad includes or excludes locations that are currently restricted |
| 200 | Permissions error |

## Updating

Use the [`POST /act_<AD_ACCOUNT_ID>/account_controls`](#Creating) endpoint to update the [AdAccountBusinessConstraints](https://developers.facebook.com/docs/marketing-api/reference/ad-account-business-constraints) associated with this [AdAccount](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account).

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

