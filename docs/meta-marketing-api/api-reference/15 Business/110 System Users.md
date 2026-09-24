<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/system_users | Saved: 2026-09-19 -->

# Business System Users



## Reading

List all system users for this business.

#### Example

### HTTP
```
GET /v25.0/{business-id}/system_users HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{business-id}/system_users',
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
    "/{business-id}/system_users",
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
    "/{business-id}/system_users",
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
                               initWithGraphPath:@"/{business-id}/system_users"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bbusiness-id%7D%2Fsystem_users&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

This endpoint doesn't have any parameters.

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

A list of [SystemUser](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/system-user) nodes.

The following fields will be added to each node that is returned:

| Field | Description |
| --- | --- |
| `role`<br><br>*string* | Role name of the user in the business manager. Note that this field only contains base roles including Admin and Employee<br><br><br>**[default]**<br> |

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

##### summary

Aggregated information about the edge, such as counts. Specify the fields to fetch in the summary param (like summary=total_count).

| Field | Description |
| --- | --- |
| `total_count`<br><br>*unsigned int32* | Total number of system users for this business.<br> |

#### Error Codes

| Error Code | Description |
| --- | --- |
| 200 | Permissions error |
| 104 | Incorrect signature |
| 100 | Invalid parameter |

## Creating

**Warning:** Apps can only target businesses (or child businesses of those businesses) that have claimed them.

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

