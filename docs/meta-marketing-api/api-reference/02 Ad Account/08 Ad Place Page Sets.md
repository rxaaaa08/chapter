<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/ad_place_page_sets | Saved: 2026-09-19 -->

# Ad Account Ad Place Page Sets



This endpoint applies to published Pages.

## Reading

The endpoint to retrieve a list of place_page_sets for an ad_account

#### Example

### HTTP
```
GET /v25.0/{ad-account-id}/ad_place_page_sets HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{ad-account-id}/ad_place_page_sets',
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
    "/{ad-account-id}/ad_place_page_sets",
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
    "/{ad-account-id}/ad_place_page_sets",
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
                               initWithGraphPath:@"/{ad-account-id}/ad_place_page_sets"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bad-account-id%7D%2Fad_place_page_sets&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |

#### Fields

Reading from this edge will return a JSON formatted result:

```
{
"data": [],
"paging": {},
"summary": {}
}
```

##### data

A list of [AdPlacePageSet](https://developers.facebook.com/docs/marketing-api/reference/ad-place-page-set) nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

##### summary

Aggregated information about the edge, such as counts. Specify the fields to fetch in the summary param (like summary=total_count).

| Field | Description |
| --- | --- |
| `total_count`<br><br>*unsigned int32* | Total number of page sets in the ad account<br> |

#### Error Codes

| Error Code | Description |
| --- | --- |
| 200 | Permissions error |
| 100 | Invalid parameter |
| 190 | Invalid OAuth 2.0 Access Token |

## Creating

### /act_{ad_account_id}/ad_place_page_sets
You can make a POST request to *ad_place_page_sets* edge from the following paths:

- [/act_{ad_account_id}/ad_place_page_sets](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/ad_place_page_sets)

When posting to this edge, an [AdPlacePageSet](https://developers.facebook.com/docs/marketing-api/reference/ad-place-page-set) will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `location_types`<br><br>*list<enum {recent, home}>* | Type of user location the page set targets (e.g., 'recent', 'home')<br> |
| `name`<br><br>*string* | Name of The Place PageSet<br><br>**[required]**<br> |
| `parent_page`<br><br>*numeric string or integer* | The parent page ID for all the locations pages<br><br>**[required]**<br> |

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
| 200 | Permissions error |
| 100 | Invalid parameter |

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

