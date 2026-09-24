<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/system-user/assigned_business_asset_groups | Saved: 2026-09-19 -->

# System User Assigned Business Asset Groups



## Reading

Get list of business asset groups for user

#### Example

### HTTP
```
GET /v25.0/{system-user-id}/assigned_business_asset_groups HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{system-user-id}/assigned_business_asset_groups',
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
    "/{system-user-id}/assigned_business_asset_groups",
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
    "/{system-user-id}/assigned_business_asset_groups",
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
                               initWithGraphPath:@"/{system-user-id}/assigned_business_asset_groups"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bsystem-user-id%7D%2Fassigned_business_asset_groups&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `contained_asset_id`<br><br>*numeric string or integer* | contained_asset_id<br> |

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

A list of BusinessAssetGroup nodes.

The following fields will be added to each node that is returned:

| Field | Description |
| --- | --- |
| `adaccount_tasks`<br><br>*list<string>* | Permission tasks for ad accounts contained in business asset group.<br><br><br>**[default]**<br> |
| `offline_conversion_data_set_tasks`<br><br>*list<string>* | Permission tasks for offline conversion datasets contained in business asset group.<br><br><br>**[default]**<br> |
| `page_tasks`<br><br>*list<string>* | Permission tasks fo pages contained in business asset group.<br><br><br>**[default]**<br> |
| `pixel_tasks`<br><br>*list<string>* | Permission tasks for ads pixels contained in business asset group.<br><br><br>**[default]**<br> |

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

##### summary

Aggregated information about the edge, such as counts. Specify the fields to fetch in the summary param (like summary=__type__).

| Field | Description |
| --- | --- |
| `total_count`<br><br>*int32* | Total count of business asset groups<br><br><br>**[default]**<br> |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

