<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/business_invoices | Saved: 2026-09-19 -->

# Business Business Invoices



## Reading

The monthly invoices sent to the bill-to legal entities associated to a business.

Returns /docs/marketing-api/reference/omega-customer-trx

#### Example

### HTTP
```
GET /v25.0/{business-id}/business_invoices HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{business-id}/business_invoices',
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
    "/{business-id}/business_invoices",
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
    "/{business-id}/business_invoices",
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
                               initWithGraphPath:@"/{business-id}/business_invoices"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bbusiness-id%7D%2Fbusiness_invoices&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `end_date`<br><br>*string* | **Default value: **`"2026-05-12"`<br>End date for querying invoices by their billing period timestamp.<br><br><br>The billing period timestamp of an invoice is the first day of the month for which we're invoicing (i.e. a June 2021 invoice will have billing period of May 1st, 2021 = 2021-05-01).<br><br><br>Expected date format: YYYY-MM-DD.<br><br><br>Note: end_date is exclusive.<br> |
| `invoice_id`<br><br>*string* | Corresponds to the invoice number (i.e. the "invoice_id" field on the OmegaCustomerTrx node) for a particular invoice/credit memo.<br><br><br>Used to query for a single invoice. If set, all other filter parameters are ignored.<br> |
| `issue_end_date`<br><br>*string* | **Default value: **`"2026-05-12"`<br>End date for querying invoices by the date in which they're issued.<br><br><br>Expected date format: YYYY-MM-DD.<br><br><br>Note: issue_end_date is exclusive.<br> |
| `issue_start_date`<br><br>*string* | Start date for querying invoices by the date in which they're issued.<br><br><br>Expected date format: YYYY-MM-DD.<br><br><br>Note: issue_start_date is inclusive. Also, this parameter must be set in order to query by the issue date.<br> |
| `root_id`<br><br>*int64* | Corresponds to the id (i.e. the "id" field on the OmegaCustomerTrx node) for a particular invoice/credit memo.<br><br><br>Used to query for a single invoice. If set, all other filter parameters are ignored.<br> |
| `start_date`<br><br>*string* | **Default value: **`"First day of 6 months ago"`<br>Start date for querying invoices by their billing period timestamp.<br><br><br>The billing period timestamp of an invoice is the first day of the month for which we're invoicing (i.e. a June 2021 invoice will have billing period of May 1st, 2021 = 2021-05-01).<br><br><br>Expected date format: YYYY-MM-DD.<br><br><br>Note: start_date is exclusive. Also, start_date and end_date have a default value, so if no parameters are set, invoices are queried by the billing period<br> |
| `type`<br><br>*enum {INV, CM, DM, PRO_FORMA}* | Used to query invoices by their type, which can be 'INV': Invoice or 'CM': Credit Memo.<br> |

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

A list of [OmegaCustomerTrx](https://developers.facebook.com/docs/marketing-api/reference/omega-customer-trx) nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

##### summary

Aggregated information about the edge, such as counts. Specify the fields to fetch in the summary param (like summary=total_count).

| Field | Description |
| --- | --- |
| `total_count`<br><br>*unsigned int32* | Total number of invoices. To have this field returned, you must include the summary=true parameter and value in your request.<br> |

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |
| 104 | Incorrect signature |
| 200 | Permissions error |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

