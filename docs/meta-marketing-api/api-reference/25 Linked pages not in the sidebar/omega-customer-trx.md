<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/omega-customer-trx | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Omega Customer Trx

## Reading

An invoice generated for a user of the monthly invoicing feature.

### Example

[Graph API Explorer**](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bomega-customer-trx-id%7D&version=v26.0)

```
GET /v26.0/{omega-customer-trx-id} HTTP/1.1
Host: graph.facebook.com
```

```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{omega-customer-trx-id}',
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
    "/{omega-customer-trx-id}",
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
    "/{omega-customer-trx-id}",
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
                               initWithGraphPath:@"/{omega-customer-trx-id}"
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
| `id`numeric string | Internal id for the invoice [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `ad_account_ids`list<numeric string> | The list of ad account ids this invoice is about |
| `advertiser_name`string | The name of the advertising party listed on the invoice. |
| `amount`numeric string | The amount of the invoice |
| `amount_due`CurrencyAmount | The amount left to be paid, it is equal to the billed amount minus already paid amount |
| `billed_amount_details`[BilledAmountDetails](https://developers.facebook.com/docs/marketing-api/reference/billed-amount-details/) | Details of the billed amount, include currency, next, tax and total amount |
| `billing_period`string | The billing period associated with the invoice |
| `cdn_download_uri`string | An ephemeral CDN url that can be used to download an invoice via an API call |
| `currency`string | The currency of the invoice |
| `download_uri`string | The download URI for the invoice pdf |
| `due_date`datetime | Date by which this invoice is due |
| `entity`enum | The Facebook Entity name for the transaction |
| `invoice_date`datetime | Date of creation of the invoice |
| `invoice_id`numeric string | Actual invoice id for the transaction |
| `invoice_type`enum | The type of invoice, like Invoice or Credit Memo |
| `liability_type`enum | The liability type associated with usage of this funding source |
| `payment_status`enum | Payment status of the invoice, e.g. 'Paid', 'Partially Paid' |
| `payment_term`enum | The expectation around when the invoice is paid. E.g. 'Net 30' implies we expect payment within 30 days |
| `type`enum | The type of the invoice |

### Edges

| Edge | Description |
| --- | --- |
| [`campaigns`](https://developers.facebook.com/docs/marketing-api/reference/omega-customer-trx/campaigns/)Edge<InvoiceCampaign> | The breakdown spend at campaign level, including additional info on campaign |

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
