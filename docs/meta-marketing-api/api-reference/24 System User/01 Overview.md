<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/system-user | Saved: 2026-09-19 -->

# System User



## Reading

Represents a system user

#### Example

### HTTP
```
GET /v25.0/{system-user-id} HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{system-user-id}',
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
    "/{system-user-id}",
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
    "/{system-user-id}",
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
                               initWithGraphPath:@"/{system-user-id}"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bsystem-user-id%7D&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

This endpoint doesn't have any parameters.

#### Fields

| Field | Description |
| --- | --- |
| `id`<br><br>*numeric string* | System user ID.<br><br><br>**[default]**<br> |
| `created_by`<br><br>*[User](https://developers.facebook.com/docs/graph-api/reference/user)* | The creator of this system user.<br> |
| `created_time`<br><br>*datetime* | The creation time of this system user.<br> |
| `finance_permission`<br><br>*string* | Financial permission role of the user in business manager, such as Editor, Analyst, and so on.<br> |
| `ip_permission`<br><br>*string* | Ads right permission role of the user in business manager, such as Reviewer, and so on.<br> |
| `name`<br><br>*string* | Name used to identify this system user.<br><br><br>**[default]**<br> |

#### Edges

| Edge | Description |
| --- | --- |
| [`assigned_business_asset_groups`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/system-user/assigned_business_asset_groups)<br><br>*Edge<BusinessAssetGroup>* | Business asset groups that are assign to this business scoped user<br> |
| [`assigned_pages`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/system-user/assigned_pages)<br><br>*Edge<Page>* | Pages that are assigned to this business scoped user<br> |
| [`assigned_product_catalogs`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/system-user/assigned_product_catalogs)<br><br>*Edge<ProductCatalog>* | Product catalogs that are assigned to this business scoped user<br> |
| [`assigned_whatsapp_business_accounts`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/system-user/assigned_whatsapp_business_accounts)<br><br>*Edge<WhatsAppBusinessAccount>* | WhatsApp business accounts that are assigned to the business user<br> |

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |
| 110 | Invalid user id |

## Creating

### /{business_id}/system_users
You can make a POST request to *system_users* edge from the following paths:

- [/{business_id}/system_users](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/system_users)

When posting to this edge, a [SystemUser](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/system-user) will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `name`<br><br>*string* | Name of system user to be added to this business.<br><br>**[required]**<br> |
| `role`<br><br>*enum {FINANCE_EDITOR, FINANCE_ANALYST, ADS_RIGHTS_REVIEWER, ADMIN, EMPLOYEE, DEVELOPER, PARTNER_CENTER_ADMIN, PARTNER_CENTER_ANALYST, PARTNER_CENTER_OPERATIONS, PARTNER_CENTER_MARKETING, PARTNER_CENTER_EDUCATION, MANAGE, DEFAULT, FINANCE_EDIT, FINANCE_VIEW}* | Role of system user to be added to this business.<br> |
| `system_user_id`<br><br>*int* | ID of system user.<br> |

#### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node represented by *id* in the return type.

```
Struct  {
id: numeric string,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 104001 | In order to create a system user, an app must be part of this business. Please add an app and then try again. |
| 100 | Invalid parameter |
| 3949 | This Business Manager has reached maximum number of system user limit. |
| 3965 | This Business Manager has reached maximum number of admin system user limit. |

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

