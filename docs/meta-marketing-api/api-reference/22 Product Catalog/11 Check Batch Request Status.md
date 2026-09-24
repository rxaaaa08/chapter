<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/check_batch_request_status | Saved: 2026-09-19 -->

# Product Catalog Check Batch Request Status



This is a Graph API [edge](https://developers.facebook.com/docs/graph-api/overview#edges) that returns the status of a single Batch API request. Hence the resulting collection always contains a single element - the status.

## Reading

Retrieve status of the request

#### Example

### HTTP
```
GET /v25.0/{product-catalog-id}/check_batch_request_status HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{product-catalog-id}/check_batch_request_status',
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
    "/{product-catalog-id}/check_batch_request_status",
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
    "/{product-catalog-id}/check_batch_request_status",
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
                               initWithGraphPath:@"/{product-catalog-id}/check_batch_request_status"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bproduct-catalog-id%7D%2Fcheck_batch_request_status&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `handle`<br><br>*string* | A ‘handle’ string from the response of one of Catalog Batch API endpoints (example: [/items_batch response specifications](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/items_batch#for-a-successful-call))<br><br>**[required]**<br> |
| `load_ids_of_invalid_requests`<br><br>*boolean* | **Default value: **`false`<br>Whether the ‘ids_of_invalid_requests’ field needs to be populated. Unless ‘load_ids_of_invalid_requests’ is set to true the invalid request IDs will always be returned as an empty array (even if some requests are invalid).  The default value is ‘false’.<br> |

#### Fields

Reading from this edge will return a JSON formatted result:

```
{
"data": []
}
```

##### data

A list of [CheckBatchRequestStatus](https://developers.facebook.com/docs/marketing-api/reference/check-batch-request-status) nodes.

#### Error Codes

| Error Code | Description |
| --- | --- |
| 80009 | There have been too many calls to this Catalog account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting. |
| 100 | Invalid parameter |
| 190 | Invalid OAuth 2.0 Access Token |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

## Sample API Call

[Try it in Graph Explorer](https://developers.facebook.com/tools/explorer?method=GET&path=PASTE_CATALOG_ID_HERE%2Fcheck_batch_request_status%3Fhandle%3DPASTE_HANDLE_HERE%26load_ids_of_invalid_requests%3Dtrue%26fields%3Dhandle%2Cstatus%2Cwarnings%2Cerrors_total_count%2Cids_of_invalid_requests)  

| An API call that fetches all of the fields listed above for a request handle |
| --- |
| Request |
| ↳<br><br>```
curl -i -X GET -G "https://graph.facebook.com/<CATALOG_ID>/check_batch_request_status" \
    -d "access_token=<API_TOKEN>" \
    -d "load_ids_of_invalid_requests=true" \
    -d "handle=<CATALOG_BATCH_REQUEST_HANDLE>" \
    -d "fields=handle,status,warnings,errors_total_count,ids_of_invalid_requests"
``` |
| Response |
| ↳<br><br>```
{
 "data": [
   {
     "handle": "<CATALOG_BATCH_REQUEST_HANDLE>",
     "status": "finished",
     "warnings": [
       {
         "line": 1,
         "id": "item_id",
         "message": "A required field is missing: Products need to have availability listed to run in ads. Include the current availability for each product in your data feed file and upload it again. You can only add the supported values \"available_soon\", \"for_rent\", \"for_sale\", \"off_market\", \"recently_sold\", \"sale_pending\" in US English under the \"availability\" column."
       },
       {
         "line": 1,
         "id": "item_id",
         "message": "Descriptions are missing: Items need to have descriptions to be shown in your shop and ads. Go to your original data source and include a description for each item, then update them in the same way that you created them."
       },
       {
         "line": 1,
         "id": "item_id",
         "message": "A required field is missing: Products without \"name\" information can't be uploaded. Please check that this field is included for each product in a separate, labelled column."
       },
       {
         "line": 1,
         "id": "item_id",
         "message": "A required field is missing: Products need to have prices to run in ads. Include a price for each product in your data feed file and upload it again. Prices must include the cost and an ISO currency code (for example: 10 GBP instead of £10 for pound sterling)."
       }
     ],
     "errors_total_count": 6,
     "ids_of_invalid_requests": [
       "item_id",
       "item_id",
       "item_id",
       "item_id",
       "item_id",
       "item_id"
     ]
   }
 ]
}
``` |

