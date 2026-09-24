<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/ig_bc_ad_permissions | Saved: 2026-09-19 -->

# Business Ig Bc Ad Permissions



## Reading

BusinessIGBCAdPermissions

#### Example

### HTTP
```
GET /v25.0/{business-id}/ig_bc_ad_permissions HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{business-id}/ig_bc_ad_permissions',
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
    "/{business-id}/ig_bc_ad_permissions",
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
    "/{business-id}/ig_bc_ad_permissions",
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
                               initWithGraphPath:@"/{business-id}/ig_bc_ad_permissions"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bbusiness-id%7D%2Fig_bc_ad_permissions&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `brand_instagram_accounts`<br><br>*list<int64>* | Filter the branded content permissions results by the given brand instagram accounts<br> |
| `creator_username`<br><br>*string* | Filter the branded content permissions results by ones that match the given creator username<br> |
| `permission_status`<br><br>*list<int64>* | Used to filter the branded content permissions results by the permission status<br> |

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

A list of IGBCAdsPermission nodes.

The following fields will be added to each node that is returned:

| Field | Description |
| --- | --- |
| `brand_ig_fbid`<br><br>*numeric string* | brand_ig_fbid<br><br><br>**[default]**<br> |
| `brand_ig_user`<br><br>*[IGUser](https://developers.facebook.com/docs/graph-api/reference/shadow-ig-user)* | brand_ig_user<br> |
| `brand_linked_fb_page`<br><br>*[Page](https://developers.facebook.com/docs/graph-api/reference/page)* | brand_linked_fb_page<br> |
| `creator_ig_user`<br><br>*[IGUser](https://developers.facebook.com/docs/graph-api/reference/shadow-ig-user)* | creator_ig_user<br><br><br>**[default]**<br> |
| `creator_linked_fb_page`<br><br>*[Page](https://developers.facebook.com/docs/graph-api/reference/page)* | creator_linked_fb_page<br> |
| `permission_created_time`<br><br>*integer* | permission_created_time<br> |
| `permission_status`<br><br>*integer* | permission_status<br><br><br>**[default]**<br> |

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

##### summary

Aggregated information about the edge, such as counts. Specify the fields to fetch in the summary param (like summary=__type__).

| Field | Description |
| --- | --- |
| `pending_permission_count`<br><br>*integer* | The count of pending permissions associated with the business<br><br><br>**[default]**<br> |

#### Error Codes

| Error Code | Description |
| --- | --- |
| 190 | Invalid OAuth 2.0 Access Token |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

