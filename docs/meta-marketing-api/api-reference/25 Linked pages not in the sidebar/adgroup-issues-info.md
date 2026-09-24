<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/adgroup-issues-info | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Adgroup Issues Info

## Reading

AdgroupIssuesInfo

### Example

[Graph API Explorer**](https://developers.facebook.com/tools/explorer/?method=GET&path=...%3Ffields%3D%257Bfieldname_of_type_AdgroupIssuesInfo%257D&version=v26.0)

```
GET v26.0/...?fields={fieldname_of_type_AdgroupIssuesInfo} HTTP/1.1
Host: graph.facebook.com
```

```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '...?fields={fieldname_of_type_AdgroupIssuesInfo}',
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
    "...?fields={fieldname_of_type_AdgroupIssuesInfo}",
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
    "...?fields={fieldname_of_type_AdgroupIssuesInfo}",
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
                               initWithGraphPath:@"...?fields={fieldname_of_type_AdgroupIssuesInfo}"
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
| `error_code`int32 | Error code for the issue [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `error_message`string | Error message for this ad with issue [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `error_summary`string | Error summary for this ad with issue [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `error_type`[**](#)string | Type of error for the ad. Can only be HARD_ERROR/SOFT_ERROR [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `level`string | Indicate level of issue, could be ad, ad set or campaign [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `mid`string | Message id, used for developers to report issues [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.
