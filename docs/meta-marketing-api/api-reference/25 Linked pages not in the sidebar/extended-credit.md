<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/extended-credit | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Extended Credit

Represents a specific credit line. Make the API call to the credit line ID.

 To find the extended credit ID, call `https://graph.facebook.com/`v26.0`/{business_id}/extendedcredits?fields=id,legal_entity_name`.

## Reading

An Extended Credit object. Queryable id obtainable using {business_id}/extendedcredits and then filtering on legal_entity_name.

### Example

[Graph API Explorer**](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bextended-credit-id%7D&version=v26.0)

```
GET /v26.0/{extended-credit-id} HTTP/1.1
Host: graph.facebook.com
```

```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{extended-credit-id}',
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
    "/{extended-credit-id}",
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
    "/{extended-credit-id}",
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
                               initWithGraphPath:@"/{extended-credit-id}"
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
| `id`numeric string | The ID of the extended credit line. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `allocated_amount`CurrencyAmount | The total amount of credit that has been granted to other businesses. Going forward, credentials are measured in USD at the top level, and attachable to ad accounts of multiple currencies. |
| `balance`CurrencyAmount | The total amount spent. This is calculated by adding parent ad account and all child ad accounts. Credentials are measured in USD at the top level and are attachable to ad accounts of multiple currencies. |
| `credit_available`CurrencyAmount | The credit available to this business. |
| `credit_type`enum | The type of extended credit used. The most common are `ADS_BUSINESS`, `ADS_SEQUENTIAL`, and `WHATSAPP_BUSINESS`. |
| `is_access_revoked`bool | Returns `true` if credit owner removed access for previously shared credit line. |
| `is_automated_experience`bool | Returns `true` if this credential is using the fully automated experience. |
| `legal_entity_name`string | The legal entity name of the owner of a line. |
| `liable_biz_name`string | When this credit is chosen as the payment method, the business name of the liable_party. |
| `max_balance`CurrencyAmount | The amount of credit available to a specific business. Going forward, credentials are measured in USD at the top level, and attachable to ad accounts of multiple currencies. |
| `online_max_balance`CurrencyAmount | The raw credit limit for an entire business. Going forward, credentials are measured in USD at the top level, and attachable to ad accounts of multiple currencies. |
| `owner_business`[Business](https://developers.facebook.com/docs/graph-api/reference/business/) | The business account responsible for extended credit payment. |
| `owner_business_name`string | The name of the business account responsible for extended credit payment. |
| `partition_from`string | The name of the business that granted the credit line. For `ADS_SEQUENTIAL` credit types. |
| `receiving_credit_allocation_config`[ExtendedCreditAllocationConfig](https://developers.facebook.com/docs/graph-api/reference/extended-credit-allocation-config/) | The allocation configuration in which this extended credit line is the receiver. |
| `send_bill_to_biz_name`string | Specifies the business name to bill (bill_to_party) when this credit is chosen as the payment method. |

### Edges

| Edge | Description |
| --- | --- |
| [`extended_credit_invoice_groups`](https://developers.facebook.com/docs/marketing-api/reference/extended-credit/extended_credit_invoice_groups/)Edge<ExtendedCreditInvoiceGroup> | Invoice group for extended credit account, all ad accounts in the same group will generate one consolidated invoice. |
| [`owning_credit_allocation_configs`](https://developers.facebook.com/docs/marketing-api/reference/extended-credit/owning_credit_allocation_configs/)Edge<ExtendedCreditAllocationConfig> | All allocation configurations in which this extended credit line is the owner. |

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
