<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/hotel_rooms_batch | Saved: 2026-09-19 -->

# Product Catalog Hotel Rooms Batch



## Reading

hotel_rooms_batch

#### Example

### HTTP
```
GET /v25.0/{product-catalog-id}/hotel_rooms_batch HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{product-catalog-id}/hotel_rooms_batch',
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
    "/{product-catalog-id}/hotel_rooms_batch",
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
    "/{product-catalog-id}/hotel_rooms_batch",
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
                               initWithGraphPath:@"/{product-catalog-id}/hotel_rooms_batch"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bproduct-catalog-id%7D%2Fhotel_rooms_batch&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `handle`<br><br>*string* | A unique handle of a batch request.<br><br>**[required]**<br> |

#### Fields

Reading from this edge will return a JSON formatted result:

```
{
"data": [],
"paging": {}
}
```

##### data

A list of ProductCatalogHotelRoomsBatch nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |

## Creating

### /{product_catalog_id}/hotel_rooms_batch
You can make a POST request to *hotel_rooms_batch* edge from the following paths:

- [/{product_catalog_id}/hotel_rooms_batch](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/hotel_rooms_batch)

When posting to this edge, a [ProductCatalogHotelRoomsBatch](https://developers.facebook.com/docs/graph-api/reference/product-catalog-hotel-rooms-batch) will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `file`<br><br>*file* | Content of the file to be uploaded<br> |
| `password`<br><br>*string* | If used url then the password for the file<br> |
| `standard`<br><br>*enum{google}* | Uploaded file export standard<br><br>**[required]**<br> |
| `update_only`<br><br>*boolean* | **Default value: **`false`<br>If true, rows missing in the file will not be deleted from Facebook database (only new and updated rows are applied)<br> |
| `url`<br><br>*URL* | The url of the file to be downloaded by our system<br> |
| `username`<br><br>*string* | If used url then the username for the file<br> |

#### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node to which you POSTed.

```
Struct  {
handles:  List  [string],
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

