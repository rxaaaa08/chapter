<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/ad-account/advertisable_applications | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Ad Account Advertisable Applications

A call to this edge returns the Ad Account's advertisable applications.

### Restrictions

Applications in developer mode are only returned if the access token belongs to a user who is an admin on the app. The restrictions do not apply to apps that are live.

## Reading

Advertisable Applications edge

### Example

[Graph API Explorer**](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bad-account-id%7D%2Fadvertisable_applications&version=v26.0)

```
GET /v26.0/{ad-account-id}/advertisable_applications HTTP/1.1
Host: graph.facebook.com
```

```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{ad-account-id}/advertisable_applications',
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
    "/{ad-account-id}/advertisable_applications",
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
    "/{ad-account-id}/advertisable_applications",
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
                               initWithGraphPath:@"/{ad-account-id}/advertisable_applications"
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

| Parameter | Description |
| --- | --- |
| `app_id`numeric string or integer | Specify App ID for the specific application. |
| `business_id`numeric string or integer | Specify Business ID for applications under a specific business. |

### Fields

Reading from this edge will return a JSON formatted result:

```

{
    "data": [],
    "paging": {}
}

```

#### `data`

A list of [Application](https://developers.facebook.com/docs/graph-api/reference/application/) nodes.

The following fields will be added to each node that is returned:

| Field | Description |
| --- | --- |
| `advertisable_app_events`list<string> | Available app events to be advertised |
| `cpa_access`CPA | CPA Access for apps |

#### `paging`

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api/#paging).

### Error Codes

| Error | Description |
| --- | --- |
| 200 | Permissions error |
| 3000 | Reading insights of a Page, business, app, domain or event source group not owned by the querying user or application |
| 190 | Invalid OAuth 2.0 Access Token |
| 80004 | There have been too many calls to this ad-account. Wait a bit and try again. For more info, please refer to https://developers.facebook.com/docs/graph-api/overview/rate-limiting#ads-management. |
| 100 | Invalid parameter |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.
