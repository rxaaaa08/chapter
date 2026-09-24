<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/adrules_library | Saved: 2026-09-19 -->

# Ad Account Adrules Library



## Reading

AdAccountAdRulesLibrary

#### Example

### HTTP
```
GET /v25.0/{ad-account-id}/adrules_library HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{ad-account-id}/adrules_library',
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
    "/{ad-account-id}/adrules_library",
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
    "/{ad-account-id}/adrules_library",
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
                               initWithGraphPath:@"/{ad-account-id}/adrules_library"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bad-account-id%7D%2Fadrules_library&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

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

A list of [AdRule](https://developers.facebook.com/docs/marketing-api/reference/ad-rule) nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

#### Error Codes

| Error Code | Description |
| --- | --- |
| 200 | Permissions error |
| 100 | Invalid parameter |
| 190 | Invalid OAuth 2.0 Access Token |
| 80004 | There have been too many calls to this ad-account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting#ads-management. |

## Creating

### /act_{ad_account_id}/adrules_library
You can make a POST request to *adrules_library* edge from the following paths:

- [/act_{ad_account_id}/adrules_library](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/adrules_library)

When posting to this edge, an [AdRule](https://developers.facebook.com/docs/marketing-api/reference/ad-rule) will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `account_id`<br><br>*numeric string* | Ad Account ID. This is inferred from the path.<br> |
| `evaluation_spec`<br><br>*Object* | Defines the evaluation spec upon which a rule will be executed<br><br>**[required]**<br><br><br>`evaluation_type` *enum{SCHEDULE, TRIGGER}*<br>**[required]**<br><br><br>`filters` *list<Object>*<br>**[required]**<br><br><br>`field` *string*<br>**[required]**<br><br><br>`value` *numeric, string, boolean, list<>, or object-like arrays*<br>**[required]**<br><br><br>`operator` *enum{GREATER_THAN, LESS_THAN, EQUAL, NOT_EQUAL, IN_RANGE, NOT_IN_RANGE, IN, NOT_IN, CONTAIN, NOT_CONTAIN, ANY, ALL, NONE}*<br>**[required]**<br><br><br>`trigger` *Object*<br><br>`type` *enum{METADATA_CREATION, METADATA_UPDATE, STATS_MILESTONE, STATS_CHANGE, DELIVERY_INSIGHTS_CHANGE}*<br>**[required]**<br><br><br>`field` *string*<br><br>`value` *numeric, string, boolean, list<>, or object-like arrays*<br><br>`operator` *enum{GREATER_THAN, LESS_THAN, EQUAL, NOT_EQUAL, IN_RANGE, NOT_IN_RANGE, IN, NOT_IN, CONTAIN, NOT_CONTAIN, ANY, ALL, NONE}* |
| `execution_spec`<br><br>*Object* | Defines the execution spec upon which a rule will be executed<br><br>**[required]**<br><br><br>`execution_type` *enum{DCO, PING_ENDPOINT, NOTIFICATION, PAUSE, REBALANCE_BUDGET, CHANGE_BUDGET, CHANGE_BID, ROTATE, UNPAUSE, CHANGE_CAMPAIGN_BUDGET, ADD_INTEREST_RELAXATION, ADD_QUESTIONNAIRE_INTERESTS, INCREASE_RADIUS, UPDATE_CREATIVE, UPDATE_LAX_BUDGET, UPDATE_LAX_DURATION, AUDIENCE_CONSOLIDATION, AUDIENCE_CONSOLIDATION_ASK_FIRST, AD_RECOMMENDATION_APPLY}*<br>**[required]**<br><br><br>`is_once_off` *boolean*<br><br>`execution_options` *list<Object>*<br><br>`field` *string*<br>**[required]**<br><br><br>`value` *numeric, string, boolean, list<>, or object-like arrays*<br>**[required]**<br><br><br>`operator` *enum{EQUAL, IN}*<br>**[required]**<br> |
| `name`<br><br>*string* | The friendly name of a rule, optional for inline rules<br><br>**[required]**<br> |
| `schedule_spec`<br><br>*Object* | Specifies the schedule with which a rule will be evaluated<br><br><br>`schedule_type` *enum{DAILY, HOURLY, SEMI_HOURLY, CUSTOM}*<br>**[required]**<br><br><br>`schedule` *list<Object>*<br><br>`start_minute` *int64*<br><br>`end_minute` *int64*<br><br>`days` *list<int64>* |
| `status`<br><br>*enum {ENABLED, DISABLED, DELETED, HAS_ISSUES}* | The status of a rule<br> |

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
| 200 | Permissions error |
| 100 | Invalid parameter |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |
| 2703 | Rules that turn off ads can't have cost conditions. You need to change the rule's conditions or action. |
| 190 | Invalid OAuth 2.0 Access Token |

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

