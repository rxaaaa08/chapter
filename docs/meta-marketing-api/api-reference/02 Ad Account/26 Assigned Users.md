<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/assigned_users | Saved: 2026-09-19 -->

# Ad Account, Assigned Users



## Reading

Business and system users assigned to this Ad Account.

#### Example

### HTTP
```
GET /v25.0/{ad-account-id}/assigned_users HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{ad-account-id}/assigned_users',
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
    "/{ad-account-id}/assigned_users",
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
    "/{ad-account-id}/assigned_users",
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
                               initWithGraphPath:@"/{ad-account-id}/assigned_users"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bad-account-id%7D%2Fassigned_users&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `business`<br><br>*numeric string or integer* | The business associated with this Ad Account<br><br>**[required]**<br> |

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

A list of AssignedUser nodes.

The following fields will be added to each node that is returned:

| Field | Description |
| --- | --- |
| `permitted_tasks`<br><br>*list<string>* | Tasks that are assignable on this object<br> |
| `tasks`<br><br>*list<string>* | All unpacked roles/tasks of this particular user on this object<br><br><br>**[default]**<br> |

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

##### summary

Aggregated information about the edge, such as counts. Specify the fields to fetch in the summary param (like summary=total_count).

| Field | Description |
| --- | --- |
| `total_count`<br><br>*unsigned int32* | Total number of business and system users assigned to this Ad Account<br> |

#### Error Codes

| Error Code | Description |
| --- | --- |
| 200 | Permissions error |
| 190 | Invalid OAuth 2.0 Access Token |
| 100 | Invalid parameter |
| 80004 | There have been too many calls to this ad-account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting#ads-management. |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |

## Creating

You can't perform this operation on this endpoint.

## Updating

In v3.1 we introduce the new concept of **task-based permissions** to substitute for the current role-based permission. This affects access to ad accounts managed by Business Manager API and Pages. Role-based access to ad accounts and Pages is still available but will be deprecated in the future. This impacts the following roles and provides the equivalent tasks for ad accounts:

- Role: `ADMIN`, Tasks: `['MANAGE', 'ADVERTISE', 'ANALYZE'` - Manage all aspects of ad campaigns, reporting, billing and ad account permissions.

- Role: `GENERAL_USER`, Tasks: `['ADVERTISE', 'ANALYZE']` - Create ads using the funding source associated with the ad account. Run reports.

- Role: `GENERAL_USER`, Tasks: `['ANALYZE']` - Run reports.

This replaces the following roles in Business Manager API with these tasks:

- Role: `MANAGER`, Tasks: `['MANAGE', 'CREATE_CONTENT', 'MODERATE',  'ADVERTISE', 'ANALYZE', 'DRAFT']`

- Role: `CONTENT_CREATOR`, Tasks: `['CREATE_CONTENT', 'MODERATE',  'ADVERTISE', 'ANALYZE', 'DRAFT']`

- Role: `MODERATOR`, Tasks: `['MODERATE',  'ADVERTISE', 'ANALYZE', 'DRAFT']`

- Role: `ADVERTISER`, Tasks: `['ADVERTISE', 'ANALYZE', 'DRAFT']`

- Role: `INSIGHTS_ANALYST`, Tasks: `['ANALYZE', 'DRAFT']`

- Role: `CREATIVE_HUB_MOCKUPS_MANAGER`, Tasks: `['DRAFT']`

### /act_{ad_account_id}/assigned_users
You can update an [AdAccount](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account) by making a POST request to [/act_{ad_account_id}/assigned_users](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/assigned_users).

#### Parameters

| Parameter | Description |
| --- | --- |
| `tasks`<br><br>*array<enum {MANAGE, ADVERTISE, ANALYZE, DRAFT, AA_ANALYZE}>* | AdAccount permission tasks to assign this user<br> |
| `user`<br><br>*UID* | Business user id or system user id<br><br>**[required]**<br> |

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
| 200 | Permissions error |
| 2620 | Invalid call to update account permissions |

## Deleting

### /act_{ad_account_id}/assigned_users
You can dissociate a [User](https://developers.facebook.com/docs/graph-api/reference/user) from an [AdAccount](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account) by making a DELETE request to [/act_{ad_account_id}/assigned_users](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/assigned_users).

#### Parameters

| Parameter | Description |
| --- | --- |
| `user`<br><br>*UID* | Business user id or system user id<br><br>**[required]**<br> |

#### Return Type

```
Struct  {
success: bool,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |
| 3919 | There was an unexpected technical issue. Please try again. |
| 190 | Invalid OAuth 2.0 Access Token |

