<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/extendedcredits | Saved: 2026-09-19 -->

# Business Extended Credits



Represents credit lines that belong to a business.

To find the ID of a business, go to [**Business Manager**](https://business.facebook.com/) > **Business Settings** > **Business Info**. There, you will see information about the business, including the ID.  

## Reading

Fetch extended credit available for this business.

### Example

Requirements

- whatsapp_business_management permission

- business_management permission

- whatsapp_business_messaging permission

- public_profile permission

- BUSINESS ID (also referred to as BUSINESS MANAGER ID in Business Settings)

- USER ACCESS TOKEN

Request

### cURL
```
         curl -i -X GET \
"https://graph.facebook.com/LATEST-VERSION/BUSINESS-ID/extendedcredits?access_token=USER-ACCESS-TOKEN"
```

### Android SDK
```
GraphRequest request = GraphRequest.newGraphPathRequest(
  accessToken,
  "/business-id/extendedcredits",
  new GraphRequest.Callback() {
    @Override
    public void onCompleted(GraphResponse response) {
      // Insert your code here
    }
});

request.executeAsync();
```

### Objective-C
```
FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc]
    initWithGraphPath:@"/BUSINESS-ID/extendedcredits"
           parameters:nil
           HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection, id result, NSError *error) {
    // Insert your code here
}];
```

Response

```
{
  "data": [
   {
    "id": "EXTENDED-CREDIT-ID"
   }
  ]
}
```

#### Parameters

This endpoint doesn't have any parameters.

#### Fields

Reading from this edge will return a JSON formatted result:

```
{
"data": [],
"paging": {}
}
```

##### data

A list of [ExtendedCredit](https://developers.facebook.com/docs/marketing-api/reference/extended-credit) nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

#### Error Codes

| Error Code | Description |
| --- | --- |
| 104 | Incorrect signature |
| 200 | Permissions error |
| 100 | Invalid parameter |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

