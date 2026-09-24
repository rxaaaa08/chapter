<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/cpas-collaboration-request | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# CPASCollaboration Request

## Reading

Request from either producer/merchant to another producer/merchant.

### Example

[Graph API Explorer**](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bcpas-collaboration-request-id%7D&version=v26.0)

```
GET /v26.0/{cpas-collaboration-request-id} HTTP/1.1
Host: graph.facebook.com
```

```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{cpas-collaboration-request-id}',
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
    "/{cpas-collaboration-request-id}",
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
    "/{cpas-collaboration-request-id}",
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
                               initWithGraphPath:@"/{cpas-collaboration-request-id}"
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
| `id`numeric string | The id of the object |
| `ad_account_id`string | Brand's ad account id if the request is a Self-Serve request |
| `ad_account_name`string | Brand's ad account name if the request is a Self-Serve request |
| `brands`list<string> | brands |
| `catalog_segment`[ProductCatalog](https://developers.facebook.com/docs/marketing-api/reference/product-catalog/) | Catalog Segment shared from merchant to producer if the request is a Self-Serve request |
| `contact_email`string | contact_email |
| `contact_first_name`string | contact_first_name |
| `contact_last_name`string | contact_last_name |
| `creation_time`datetime | creation_time |
| `phone_number`string | The phone number of the request sender |
| `receiver_business`[Business](https://developers.facebook.com/docs/graph-api/reference/business/) | Business that is receiving the collaboration request. |
| `requester_agency_or_brand`enum | requester_agency_or_brand |
| `seller_id`string | Seller id if the request is a Self-Serve request |
| `sender_business`[Business](https://developers.facebook.com/docs/graph-api/reference/business/) | sender_business |
| `sender_client_business`[Business](https://developers.facebook.com/docs/graph-api/reference/business/) | Business which the sender business is representing in the request |
| `shop_url`string | Shop url if the request is a Self-Serve request |
| `source`enum | The source of where the request was made e.g. SELF_SERVE |
| `status`enum | The status of the request handled by the receiver |

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
