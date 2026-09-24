<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/product-feed-upload/errors | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Product Feed Upload Errors

You may experience errors in your Product Feed, with varying severities.

Errors that are `fatal` mean those items are not created, while errors with a severity of `warning` are informational but items are created.

Even when you see items with severity `fatal` the rest of the products with no errors are created.

## Reading

Product feed upload errors

### Examples

```
curl -G \
-d "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<API_VERSION>/<UPLOAD_ID>/errors
```

The response:

```
{
  "data": [
    {
      "id" : 1510567479166488,
      "summary" : "Group Mismatch for Property: shipping.",
      "description" : "Property shipping must have the same value for all items in the same group.",
      "severity" : "fatal",
      "row_number" : 10,
      "column_number" : 5
    },
    {
      "id" : 275241589314958,
      "summary" : "Price Without Currency for Property: shipping_price_value, shipping_price_currency",
      "description" : "Property shipping_price_value, shipping_price_currency is a price that has been specified without a currency.",
      "severity" : "warning",
      "row_number" : 17,
      "column_number" : 40
    }
  ]
}
```

### Example

[Graph API Explorer**](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bproduct-feed-upload-id%7D%2Ferrors&version=v26.0)

```
GET /v26.0/{product-feed-upload-id}/errors HTTP/1.1
Host: graph.facebook.com
```

```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{product-feed-upload-id}/errors',
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
    "/{product-feed-upload-id}/errors",
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
    "/{product-feed-upload-id}/errors",
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
                               initWithGraphPath:@"/{product-feed-upload-id}/errors"
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
| `error_priority`enum {HIGH, LOW, MEDIUM} | Filters errors based on their priorities (High, Medium or Low). High priority errors are fatal severity errors, which prevent products from being persisted. Filtering by either Medium or Low priority will return all warnings. |

### Fields

Reading from this edge will return a JSON formatted result:

```

{
    "data": [],
    "paging": {},
    "summary": {}
}

```

#### `data`

A list of [ProductFeedUploadError](https://developers.facebook.com/docs/marketing-api/reference/product-feed-upload-error/) nodes.

#### `paging`

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api/#paging).

#### `summary`

Aggregated information about the edge, such as counts. Specify the fields to fetch in the summary param (like `summary=total_count`).

| Field | Description |
| --- | --- |
| `total_count`int32 | Total number of objects on this edge [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |

### Error Codes

| Error | Description |
| --- | --- |
| 100 | Invalid parameter |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.
