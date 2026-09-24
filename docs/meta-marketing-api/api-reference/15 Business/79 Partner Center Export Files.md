<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/partner_center_export_files | Saved: 2026-09-19 -->

# Business Partner Center Export Files



## Reading

PartnerCenterExportFiles

#### Example

### HTTP
```
GET /v25.0/{business-id}/partner_center_export_files HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{business-id}/partner_center_export_files',
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
    "/{business-id}/partner_center_export_files",
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
    "/{business-id}/partner_center_export_files",
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
                               initWithGraphPath:@"/{business-id}/partner_center_export_files"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bbusiness-id%7D%2Fpartner_center_export_files&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `report_ds`<br><br>*ISO 8601 Date* | report_ds<br> |
| `report_type`<br><br>*enum {REVENUE, DISABLED_AD_ACCOUNTS, PROMOTABLE_OBJECTS_CONSISTENCY_VIOLATION_AD_ACCOUNTS, AEM_OPPORTUNITIES, RESELLER_PARTITION_CREDIT_ACCOUNTS_DAILY_SUMMARY, RESELLER_PARTITION_CREDIT_ACCOUNTS_DAILY_STATUS_SUMMARY, CAPI_OPPORTUNITIES, RESELLER_REBATE_PRODUCT_ADOPTION_REPORT_QTD, RESELLER_REBATE_PRODUCT_ADOPTION_REPORT_1D, RESELLER_REBATE_PRODUCT_ADOPTION_REPORT_7D, DISAPPROVED_ADS_1D, DISAPPROVED_ADS_7D, DISAPPROVED_ADS_QTD, DISABLED_AD_ACCOUNTS_1D, DISABLED_AD_ACCOUNTS_7D, DISABLED_AD_ACCOUNTS_QTD}* | report_type<br><br>**[required]**<br> |

#### Fields

Reading from this edge will return a JSON formatted result:

```
{
"data": []
}
```

##### data

A list of PartnerCenterExportFile nodes.

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

