<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/extended-credit-invoice-group | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Extended Credit Invoice Group

## Reading

An extended credit invoice group object

### Example

[Graph API Explorer**](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bextended-credit-invoice-group-id%7D&version=v26.0)

```
GET /v26.0/{extended-credit-invoice-group-id} HTTP/1.1
Host: graph.facebook.com
```

```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{extended-credit-invoice-group-id}',
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
    "/{extended-credit-invoice-group-id}",
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
    "/{extended-credit-invoice-group-id}",
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
                               initWithGraphPath:@"/{extended-credit-invoice-group-id}"
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
| `id`numeric string | ID [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `auto_enroll`bool | Shows if the adaccount using the current credit will be enrolled into the invoice group automatically |
| `customer_po_number`string | The customer PO number of this invoice group assigned by the customer creating or editing the group |
| `email`ExtendedCreditEmail | The invoice email object associated with this invoice group and only allow one email address associated with one group |
| `emails`list<string> | The invoice emails attached to the invoice group |
| `name`string | Extended credit invoice group name assigned [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |

### Error Codes

| Error | Description |
| --- | --- |
| 100 | Invalid parameter |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can update an [ExtendedCreditInvoiceGroup](https://developers.facebook.com/docs/marketing-api/reference/extended-credit-invoice-group/) by making a POST request to [`/{extended_credit_invoice_group_id}`](https://developers.facebook.com/docs/marketing-api/reference/extended-credit-invoice-group/).

### Parameters

| Parameter | Description |
| --- | --- |
| `emails`array<string> | The emails associated to the extended credit invoice group |
| `name`string | Extended credit invoice group name assigned |

### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview/#read-after-write) and will read the node represented by `id` in the return type.

 Struct {

`id`: numeric string,

}

### Error Codes

| Error | Description |
| --- | --- |
| 100 | Invalid parameter |

## Deleting

You can delete an [ExtendedCreditInvoiceGroup](https://developers.facebook.com/docs/marketing-api/reference/extended-credit-invoice-group/) by making a DELETE request to [`/{extended_credit_invoice_group_id}`](https://developers.facebook.com/docs/marketing-api/reference/extended-credit-invoice-group/).

### Parameters

This endpoint doesn't have any parameters.

### Return Type

 Struct {

`success`: bool,

}

### Error Codes

| Error | Description |
| --- | --- |
| 100 | Invalid parameter |

You can dissociate an [ExtendedCreditInvoiceGroup](https://developers.facebook.com/docs/marketing-api/reference/extended-credit-invoice-group/) from an [ExtendedCreditInvoiceGroup](https://developers.facebook.com/docs/marketing-api/reference/extended-credit-invoice-group/) by making a DELETE request to [`/{extended_credit_invoice_group_id}/ad_accounts`](https://developers.facebook.com/docs/marketing-api/reference/extended-credit-invoice-group/ad_accounts/).

### Parameters

| Parameter | Description |
| --- | --- |
| `ad_account_id`string | The id of the ad account that will be removed from the invoice group Required |

### Return Type

 Struct {

`success`: bool,

}

### Error Codes

| Error | Description |
| --- | --- |
| 49002 | Cannot delete the ad account from the invoice group |
