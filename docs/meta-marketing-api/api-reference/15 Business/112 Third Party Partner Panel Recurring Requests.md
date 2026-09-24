<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/third_party_partner_panel_recurring_requests | Saved: 2026-09-19 -->

# Business Third Party Partner Panel Recurring Requests



## Reading

Retrieve all existing panel recurring requests related to a business

#### Example

### HTTP
```
GET /v25.0/{business-id}/third_party_partner_panel_recurring_requests HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{business-id}/third_party_partner_panel_recurring_requests',
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
    "/{business-id}/third_party_partner_panel_recurring_requests",
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
    "/{business-id}/third_party_partner_panel_recurring_requests",
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
                               initWithGraphPath:@"/{business-id}/third_party_partner_panel_recurring_requests"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bbusiness-id%7D%2Fthird_party_partner_panel_recurring_requests&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `cadence`<br><br>*string* | Optional filter on the request cadence.<br><br><br>Cadence has the form "+[quantity] [day\|week\|month]"<br><br><br>Valid input examples:<br><br><br>• cadence=+1 day<br>• cadence='+1 day'<br> |
| `country`<br><br>*array<string>* | Optional filter on the request country.<br><br><br>From a valid ISO2 country codes (2-letter).<br><br><br>Can enter a single country or an array of countries. The array filter is a set contains, e.g. if a business has a request with country 'US', a request with country 'GB', and has filter country=['US', 'GB'], then both requests will be returned.<br><br><br>Valid input examples:<br><br><br>• country=US<br><br>• country=['US', 'GB']<br><br><br><br>Invalid input examples:<br><br><br>• country='US'<br><br>• country=[US, GB]<br><br> |
| `description`<br><br>*string* | Optional filter on the request description.<br><br><br>This is a case-insensitive, substring search on the field.<br><br><br>Ex: Suppose we have 3 requests with descriptions of:<br><br><br>• "my test study #1"<br><br>• "my test study #2"<br><br>• "my test study #3".<br><br><br><br>Then both of the following filters will return all 3 requests:<br><br><br>• description=test study<br><br>• description='test study'<br><br> |
| `end_time`<br><br>*JSON object* | Optional filter on the request end time (unix-timestamp).<br><br><br>For comparisons (comp => function):<br><br><br>• 'EQ' => 'equals'<br><br>• 'GT => 'greater than'<br><br>• 'GEQ' => 'greater than or equals'<br><br>• 'LT' => 'less than'<br><br>• 'LEQ' => 'less than or equals'<br><br><br><br>end_time={'comp': [comp], 'ts': [ts]}<br><br><br>Ex: end_time={'comp': 'GEQ', 'ts': 1684972800}<br>which is end_time <= 1684972800<br><br><br>For comp 'BW' => 'between'<br><br><br>end_time={'comp': 'BW', 'ts': [ts], 'ts2': [ts2]}<br><br><br>Ex: end_time={'comp': 'BW', 'ts': 1684972800, 'ts2': 1685145599}<br>which is 1684972800 <= end_time <= 1685145599<br><br><br>`comp` *enum {BW, EQ, GEQ, GT, LEQ, LT}*<br>comp<br><br>**[required]**<br><br><br>`ts` *datetime/timestamp*<br>ts<br><br>**[required]**<br><br><br>`ts2` *datetime/timestamp*<br>ts2<br> |
| `owner_instance_id`<br><br>*array<numeric string>* | Optional filter on the request owner instance ID.<br><br><br>From a valid instance ID.<br><br><br>Can enter a single instance ID or an array of instance ID. The array filter is a set contains, e.g. if a business has a request with instance ID 1234, a request with instance ID 5678, and has filter owner_instance_id =[1234, 5678], then both requests will be returned.<br><br><br>Valid input examples:<br><br><br>• owner_instance_id=1234<br><br>• owner_instance_id=[1234, 5678]<br><br>• owner_instance_id=['1234', '5678']<br><br><br><br>Invalid input examples:<br><br><br>• owner_instance_id='1234'<br> |
| `owner_panel_id`<br><br>*array<numeric string>* | Optional filter on the request owner panel ID.<br><br><br>From a valid panel ID.<br><br><br>Can enter a single panel ID or an array of panel ID. The array filter is a set contains, e.g. if a business has a request with panel ID 4321, a request with panel ID 8765, and has filter owner_panel_id =[4321, 8765], then both requests will be returned.<br><br><br>If this filter is used in conjunction with owner_panel_name, it will filter out panels based on the union of the owner_panel_id's and owner_panel_name's, e.g. for a panel (id, name), if a business has a request with panel (4321, 'alpha') and a request with panel (8765, 'omega'), and has filters owner_panel_id=4321 and owner_panel_name='omega', then both requests will be returned.<br><br><br>Valid input examples:<br><br><br>• owner_panel_id=4321<br><br>• owner_panel_id=[4321, 8765]<br><br>• owner_panel_id=['4321', '8765']<br><br><br><br>Invalid input examples:<br><br><br>• owner_panel_id='4321'<br> |
| `owner_panel_name`<br><br>*array<string>* | Optional filter on the request owner panel name.<br><br><br>This is a case-insensitive, substring search on the field.<br><br><br>Ex: Suppose we have 3 panels with descriptions of:<br><br><br>• "my test panel 1"<br><br>• "my test panel 2"<br><br>• "my test panel 3".<br><br><br><br>Then the following filters will both return all 3 requests:<br><br><br>• owner_panel_name=test panel<br><br>• owner_panel_name='test panel'<br><br><br><br>Can enter a single panel name or an array of panel names. The array filter is a set contains,, e.g. if a business has a request with panel name 'alpha', a request with panel name 'omega', and has filter owner_panel_name =['alpha', 'omega'], then both requests will be returned.<br><br><br>If this filter is used in conjunction with owner_panel_name, it will filter out panels based on the union of the owner_panel_id's and owner_panel_name's, e.g. for a panel (id, name), if a business has a request with panel (4321, 'alpha') and a request with panel (8765, 'omega'), and has filters owner_panel_id=4321 and owner_panel_name='omega', then both requests will be returned.<br><br><br>Valid input examples:<br><br><br>• owner_panel_name=test panel 1<br><br>• owner_panel_name='test panel 1'<br><br>• owner_panel_name=['test panel 1', 'test panel 2']<br><br><br><br>Invalid input examples:<br><br><br>• owner_panel_name=[test panel 1, test panel 2]<br> |
| `start_time`<br><br>*JSON object* | Optional filter on the request start time (unix-timestamp).<br><br><br>For comparisons (comp => function):<br><br><br>• 'EQ' => 'equals'<br><br>• 'GT => 'greater than'<br><br>• 'GEQ' => 'greater than or equals'<br><br>• 'LT' => 'less than'<br><br>• 'LEQ' => 'less than or equals'<br><br><br><br>start_time={'comp': [comp], 'ts': [ts]}<br><br><br>Ex: start_time={'comp': 'GEQ', 'ts': 1684972800}<br>which is start_time <= 1684972800<br><br><br>For comp 'BW' => 'between'<br><br><br>start_time={'comp': 'BW', 'ts': [ts], 'ts2': [ts2]}<br><br><br>Ex: start_time={'comp': 'BW', 'ts': 1684972800, 'ts2': 1685145599}<br>which is 1684972800 <= start_time <= 1685145599<br><br><br>`comp` *enum {BW, EQ, GEQ, GT, LEQ, LT}*<br>comp<br><br>**[required]**<br><br><br>`ts` *datetime/timestamp*<br>ts<br><br>**[required]**<br><br><br>`ts2` *datetime/timestamp*<br>ts2<br> |
| `status`<br><br>*array<enum {CANCELLED, CREATED, FINISHED, ONGOING}>* | Optional filter on the request status.<br><br><br>From the set { CANCELLED, CREATED, FINISHED, ONGOING }<br><br><br>Can enter a single study type or an array of statuses. The array filter is a set contains, e.g. if a business has a request with 'CREATED', a request with 'FINISHED', and has filter status=['CREATED', 'FINISHED'], then both requests will be returned.<br><br><br>Valid input examples:<br><br><br>• status=CREATED<br><br>• status=['CREATED', 'FINISHED']<br><br><br><br>Invalid input examples:<br><br><br>• country='CREATED'<br><br>• country=[CREATED, FINISHED]<br><br> |
| `study_type`<br><br>*array<enum {BRAND_LIFT, PANEL_SALES_ATTRIBUTION, REACH}>* | Optional filter on the request study type.<br><br><br>From the set { BRAND_LIFT, PANEL_SALES_ATTRIBUTION, REACH }<br><br><br>Can enter a single study type or an array of study types. The array filter is a set contains, e.g. if a business has a request with study type 'BRAND_LIFT', a request with study type 'REACH', and has filter study_type=['BRAND_LIFT', 'REACH'], then both requests will be returned.<br><br><br>Valid input examples:<br><br><br>• study_type=BRAND_LIFT<br><br>• study_type=['BRAND_LIFT', 'REACH']<br><br><br><br>Invalid input examples:<br><br><br>• study_type='BRAND_LIFT'<br><br>• study_type=[BRAND_LIFT, REACH]<br><br> |
| `submitted_time`<br><br>*JSON object* | Optional filter on the request submission time (unix-timestamp).<br><br><br>For comparisons (comp => function):<br><br><br>• 'EQ' => 'equals'<br><br>• 'GT => 'greater than'<br><br>• 'GEQ' => 'greater than or equals'<br><br>• 'LT' => 'less than'<br><br>• 'LEQ' => 'less than or equals'<br><br><br><br>submitted_time={'comp': [comp], 'ts': [ts]}<br><br><br>Ex: submitted_time={'comp': 'GEQ', 'ts': 1684972800}<br>which is submitted_time <= 1684972800<br><br><br>For comp 'b/w' => 'between'<br><br><br>submitted_time={'comp': 'BW', 'ts': [ts], 'ts2': [ts2]}<br><br><br>Ex: submitted_time={'comp': 'BW', 'ts': 1684972800, 'ts2': 1685145599}<br>which is 1684972800 <= submitted_time <= 1685145599<br><br><br>`comp` *enum {BW, EQ, GEQ, GT, LEQ, LT}*<br>comp<br><br>**[required]**<br><br><br>`ts` *datetime/timestamp*<br>ts<br><br>**[required]**<br><br><br>`ts2` *datetime/timestamp*<br>ts2<br> |

#### Fields

Reading from this edge will return a JSON formatted result:

```
{
"data": [],
"paging": {}
}
```

##### data

A list of [ThirdPartyPartnerPanelScheduled](https://developers.facebook.com/docs/graph-api/reference/third-party-partner-panel-scheduled) nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |

## Creating

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

