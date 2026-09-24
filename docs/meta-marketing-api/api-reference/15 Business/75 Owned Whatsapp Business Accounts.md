<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/owned_whatsapp_business_accounts | Saved: 2026-09-19 -->

# Business Owned Whatsapp Business Accounts



Represents a collection of [WhatsApp Business Accounts](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account) owned by a business.

To find the ID of a business, go to [**Business Manager**](https://business.facebook.com/) > **Business Settings** > **Business Info**. There, you will see information about the business, including the ID.  

## Reading

Get a list of [WhatsApp Business Accounts](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account) owned by this business. Supports [filtering](https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/manage-accounts#filter-wabas-by-creation-time) and [sorting](https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/manage-accounts#sort-wabas-by-creation-time).

### Example

Requirements

- whatsapp_business_management permission

- business_management permission

- whatsapp_business_messaging permission

- public_profile permission

- BUSINESS ID (also referred to as BUSINESS MANAGER ID in Business Settings)

- ADMIN SYSTEM USER ACCESS TOKEN for the business

Request

### cURL
```
        curl -i -X GET \
'https://graph.facebook.com/LATEST-VERSION/BUSINESS-ID/owned_whatsapp_business_accounts' \
 -H 'Authorization: Bearer USER-ACCESS-TOKEN'
```

### Android SDK
```
GraphRequest request = GraphRequest.newGraphPathRequest(
  accessToken,
  "/BUSINESS-ID/owned_whatsapp_business_accounts",
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
    initWithGraphPath:@"/BUSINESS-ID/owned_whatsapp_business_accounts"
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
      "id": "WHATSAPP-BUSINESS-ACCOUNT-ID",
      "name": "Test WhatsApp Business Account",
      "timezone_id": "1",
      "message_template_namespace": "MESSAGE-TEMPLATE-NAMESPACE"
    }
  ],
  "paging": {
    "cursors": {
      "before": "BEFORE-CURSOR",
      "after": "AFTER-CURSOR"
    }
  }
}
```

Request with Filtering

### cURL
```
       curl -i -X GET \
"https://graph.facebook.com/LATEST-VERSION/BUSINESS-ID/owned_whatsapp_business_accounts \
?fields=id,name,creation_time \
&filtering=[{'field':'creation_time', 'operator': 'IN_RANGE', 'value': ['1569783261', '1604542049']}]"
 -H 'Authorization: Bearer USER-ACCESS-TOKEN'
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

A list of [WhatsAppBusinessAccount](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-account) nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

#### Error Codes

| Error Code | Description |
| --- | --- |
| 200 | Permissions error |
| 190 | Invalid OAuth 2.0 Access Token |
| 104 | Incorrect signature |
| 80008 | There have been too many calls to this WhatsApp Business account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting. |
| 100 | Invalid parameter |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

