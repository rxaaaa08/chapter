<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business-user | Saved: 2026-09-19 -->

# Business User



In Graph API v9.0, [access to this endpoint was restricted](https://developers.facebook.com/docs/graph-api/changelog/version9.0#business). In Graph API v10.0, [access has been restored to all apps](https://developers.facebook.com/docs/graph-api/changelog/version10.0#business), but apps can now only target businesses (or child businesses of those businesses) that have claimed them.

## Reading

Represents a business user. A business user can be an employee of the business or an admin of the business. An Employee can see all of information in business settings and be assigned roles by business admins. An Admin can control all aspects of the business including modifying or deleting the account and adding or removing people from the employee list

#### Example

### HTTP
```
GET /v25.0/{business-user-id} HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{business-user-id}',
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
    "/{business-user-id}",
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
    "/{business-user-id}",
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
                               initWithGraphPath:@"/{business-user-id}"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bbusiness-user-id%7D&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

This endpoint doesn't have any parameters.

#### Fields

| Field | Description |
| --- | --- |
| `id`<br><br>*numeric string* | The business user's ID.<br><br><br>**[default]**<br> |
| `business`<br><br>*[Business](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business)* | Business user is associated with this business.<br><br><br>**[default]**<br> |
| `email`<br><br>*string* | User's email as provided in Business Manager.<br> |
| `finance_permission`<br><br>*string* | Financial permission role of the user in Business Manager, such as `EDITOR`, `ANALYST`, and so on.<br> |
| `first_name`<br><br>*string* | User's first name as provided in Business Manager.<br> |
| `ip_permission`<br><br>*string* | This user's ads right permission role in Business Manager, such as Reviewer and so on.<br> |
| `last_name`<br><br>*string* | User's last name as provided in Business Manager.<br> |
| `name`<br><br>*string* | Name of user as provided in Business Manager.<br><br><br>**[default]**<br> |
| `pending_email`<br><br>*string* | Email for the business user that is still pending verification.<br> |
| `role`<br><br>*string* | Role of the user in Business Manager, such as Admin, Employee, and so on.<br> |
| `title`<br><br>*string* | The title of the user in this business.<br> |
| `two_fac_status`<br><br>*string* | Two-factor authentication status of the business-scoped user.<br> |

#### Edges

| Edge | Description |
| --- | --- |
| [`assigned_business_asset_groups`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business-user/assigned_business_asset_groups)<br><br>*Edge<BusinessAssetGroup>* | Business asset groups that are assign to this business scoped user<br> |
| [`assigned_pages`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business-user/assigned_pages)<br><br>*Edge<Page>* | Pages that are assigned to this business scoped user<br> |
| [`assigned_product_catalogs`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business-user/assigned_product_catalogs)<br><br>*Edge<ProductCatalog>* | Product catalogs that are assigned to this business scoped user<br> |
| [`assigned_whatsapp_business_accounts`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business-user/assigned_whatsapp_business_accounts)<br><br>*Edge<WhatsAppBusinessAccount>* | WhatsApp business accounts that are assigned to the business user<br> |

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |
| 104 | Incorrect signature |

## Creating

### /{business_id}/business_users
You can make a POST request to *business_users* edge from the following paths:

- [/{business_id}/business_users](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/business_users)

When posting to this edge, a [BusinessUser](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business-user) will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `email`<br><br>*string* | Email of user to be added to this business.<br><br>**[required]**<br> |
| `invited_user_type`<br><br>*array<enum {FB, MWA}>* | Not passing a value will default to 'FB'.<br><br><br>Use 'MWA' for inviting a user with their Meta account managed by their organization.<br> |
| `role`<br><br>*enum {FINANCE_EDITOR, FINANCE_ANALYST, ADS_RIGHTS_REVIEWER, ADMIN, EMPLOYEE, DEVELOPER, PARTNER_CENTER_ADMIN, PARTNER_CENTER_ANALYST, PARTNER_CENTER_OPERATIONS, PARTNER_CENTER_MARKETING, PARTNER_CENTER_EDUCATION, MANAGE, DEFAULT, FINANCE_EDIT, FINANCE_VIEW}* | Role of user to add to this business.<br> |

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
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |
| 100 | Invalid parameter |
| 613 | Calls to this api have exceeded the rate limit. |
| 457 | The session has an invalid origin |
| 190 | Invalid OAuth 2.0 Access Token |
| 415 | Two factor authentication required. User have to enter a code from SMS or TOTP code generator to pass 2fac. This could happen when accessing a 2fac-protected asset like a page that is owned by a 2fac-protected business manager. |
| 200 | Permissions error |
| 370 | Invalid call to update this page |

## Updating

### /{business_user_id}
You can update a [BusinessUser](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business-user) by making a POST request to [/{business_user_id}](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business-user).

#### Parameters

| Parameter | Description |
| --- | --- |
| `email`<br><br>*string* | The email of the user at this business.<br> |
| `first_name`<br><br>*string* | First name for this business user.<br> |
| `last_name`<br><br>*string* | Last name for this business user.<br> |
| `role`<br><br>*enum {FINANCE_EDITOR, FINANCE_ANALYST, ADS_RIGHTS_REVIEWER, ADMIN, EMPLOYEE, DEVELOPER, PARTNER_CENTER_ADMIN, PARTNER_CENTER_ANALYST, PARTNER_CENTER_OPERATIONS, PARTNER_CENTER_MARKETING, PARTNER_CENTER_EDUCATION, MANAGE, DEFAULT, FINANCE_EDIT, FINANCE_VIEW}* | The role of the user at this business, such as `ADMIN` and so on.<br> |
| `skip_verification_email`<br><br>*boolean* | Whether to skip sending the verification email. The business persona email still requires verification - but just won't receive an email.<br> |

#### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node to which you POSTed.

```
Struct  {
success: bool,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |
| 415 | Two factor authentication required. User have to enter a code from SMS or TOTP code generator to pass 2fac. This could happen when accessing a 2fac-protected asset like a page that is owned by a 2fac-protected business manager. |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |
| 190 | Invalid OAuth 2.0 Access Token |
| 3914 | It looks like you're trying to remove the last admin from this Business Manager. At least one admin is required in Business Manager. |

## Deleting

### /{business_user_id}
You can delete a [BusinessUser](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business-user) by making a DELETE request to [/{business_user_id}](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business-user).

#### Parameters

This endpoint doesn't have any parameters.

#### Return Type

```
Struct  {
success: bool,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 3914 | It looks like you're trying to remove the last admin from this Business Manager. At least one admin is required in Business Manager. |
| 100 | Invalid parameter |
| 200 | Permissions error |
| 415 | Two factor authentication required. User have to enter a code from SMS or TOTP code generator to pass 2fac. This could happen when accessing a 2fac-protected asset like a page that is owned by a 2fac-protected business manager. |

