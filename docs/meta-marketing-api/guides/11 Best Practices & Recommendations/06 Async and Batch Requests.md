<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/asyncrequests | Saved: 2026-09-19 -->

# Asynchronous and Batch Requests



Use asynchronous requests to create ads and send numerous ads requests without having to block. Either specify a URL to call after requests complete or check the status of the request. See [Ad reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup#create).

To manage ads, use [batched requests](https://developers.facebook.com/docs/reference/api/batch). Use them to perform some of the more common requests.

## Asynchronous requests {#aoverview}

For example, get the status of the asynchronous request set:

```
curl -G \
  -d 'fields=name,success_count,error_count,is_completed' \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/<REQUEST_SET_ID>
```

This returns the overall status for the async request set as a JSON object. Not all fields appear by default. If you want your query to include non-default fields, specify them in `fields`, such as `fields=id,owner_id,name,total_count,success_count,error_count,is_completed`.

| Name | Description |
| --- | --- |
| `id`<br><br>type: int | **Shown by default.**<br><br>The `id` of current async request set. |
| `owner_id`<br><br>type: int | **Shown by default.**<br><br>Which object owns this async request set. For async requests on ads, `owner_id` is the account id. |
| `name`<br><br>type: string | **Shown by default.**<br><br>Name of this async request set. |
| `is_completed`<br><br>type: boolean | **Shown by default.**<br><br>Indicates whether all async requests in this set are complete. |
| `total_count`<br><br>type: int | **Not shown by default.**<br><br>Total requests count of this request set. |
| `initial_count`<br><br>type: int | **Not shown by default.**<br><br>Number of requests not yet served. |
| `in_progress_count`<br><br>type: int | **Not shown by default.**<br><br>Number of requests in progress. |
| `success_count`<br><br>type: int | **Not shown by default.**<br><br>Number of requests finished and successful. |
| `error_count`<br><br>type: int | **Not shown by default.**<br><br>Number of requests finished and failed. |
| `canceled_count`<br><br>type: int | **Not shown by default.**<br><br>Number of requests canceled by user |
| `notification_uri`<br><br>type: string | **Not shown by default.**<br><br>Notification URI for this async request set. |
| `notification_mode`<br><br>type: string | **Not shown by default.**<br><br>Way to receive notification. Valid values include:<br><br>- `OFF` – No notifications<br>- `ON_COMPLETE` – Send notification when whole set finished. |

After you get the overall status of the async request set, get details of each request:

```
curl -G \
  -d 'fields=id,status' \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/<REQUEST_SET_ID>/requests
```

This returns status and details of each request inside the async request set. For async ad creation, make one request to create one ad. The status param is used to filter requests by its own status and can be any combination of following values:

*  `initial` – Not processed yet.
*  `in_progress` – Request is processing
*  `success` – Request finished and succeeds.
*  `error` – Request finished and failed
*  `canceled` – Request canceled by user

The response is a JSON array with default fields. To include any non-default field, specify it in `fields`, such as `fields=id,scope_object_id,status,result,input,async_request_set`.

| Name | Description |
| --- | --- |
| `id`<br><br>type: int | **Shown by default.**<br><br>Individual async request ID |
| `scope_object_id`<br><br>type: int | **Shown by default.**<br><br>Parent id of object this request creates. If you create an ad, this is ad set ID for the new ad. |
| `status`<br><br>type: string | **Shown by default.**<br><br>Status of this async request. Options:<br><br>- `Initial` – Not processed yet<br>- `In_progress` – Request is processing<br>- `Success` – Request finished and succeeds<br>- `Error` – Request finished and failed<br>- `Canceled` – Request is canceled by user |
| `result`<br><br>type: array | **Not shown by default.**<br><br>If request is finished, shows result of the request.  <br>On success, the result is the same as a<br>non-async request. For example, if you create an ad, the result for each request is the ID of the new ad.<br>For errors, it will be array of:<br><br>- `error_code` – Error code returned<br>- `error_message` – Error message |
| `input`<br><br>type: object | **Not shown by default.**<br><br>Original input for this async request. If you create an ad, the input is `adgroup_spec`. |
| `async_request_set`<br><br>type: object | **Not shown by default.**<br><br>Async request set that contains this individual request. |

### Get request details

To get details of a specific async request, make this call:

```
curl -G \
  -d 'fields=id,status' \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/<REQUEST_SET_ID>/requests
```

This returns a JSON object with fields listed above.

### List request sets for an account

You can create multiple async ad request sets. To query all async ad request sets for an ad account:

```
curl -G \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/asyncadrequestsets
```

This returns a JSON array of async request set objects. Each object is the same
as specified in [async request set section](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign/asyncadrequests). You can filter results with `is_completed`. If `is_completed=true`, you see only completed async request set.

### List requests for an ad set

You can make an async call to create ads in different ad sets. To get the status for each ad set, get all ad creation requests for one ad set:

```
curl -G \
  -d 'fields=id,status' \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/<AD_SET_ID>/asyncadrequests
```

This returns a JSON array of async request objects. The status, fields filter, and async request fields are the same as `https://graph.facebook.com/<API_VERSION>/<REQUEST_SET_ID>/requests` API.

### Update request sets

You can change `name`, `notification_uri` and `notification_mode` for an async request set.

```
curl \
  -F 'name=New Name' \
  -F 'notification_mode=OFF' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/<REQUEST_SET_ID>
```

This returns `true` on successful update. You can only change `notification_uri` and `notification_mode` before the notification is sent.

### Cancel request

You can cancel an async request, but the request can only be cancelled if it is not processed yet.

```
curl -X DELETE \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/<REQUEST_ID>
```

Returns `true` on successful cancellation. You can also cancel unprocessed requests in the async request set:

```
curl -X DELETE \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/<REQUEST_SET_ID>
```

Returns `true` on successful cancellation.

### Async examples {#examples}

Getting status of a specific async request:

```
//pretty=true for command line readable output
curl -G \
-d "id=6012384857989" \
-d "pretty=true" \
-d "access_token=_____" \
"https://graph.facebook.com/v25.0/"
```

Return values:

```
{
   "id": "6012384857989",
   "owner_id": 12345,
   "name": "testasyncset",
   "is_completed": true
}
```

Get results of requests:

```
curl -G \
-d "id=6012384857989" \
-d "pretty=true" \
-d "fields=result" \
-d "access_token=_____" \
"https://graph.facebook.com/v25.0/requests"
```

Returns:

```
{
   "data": [
      {
         "result": {
            "id": "6012384860989"
         },
         "id": "6012384858389"
      },
      {
         "result": {
            "id": "6012384858789"
         },
         "id": "6012384858189"
      }
   ],
   "paging": {
      "cursors": {
         "after": "___",
         "before": "___"
      }
   }
}
```

Get list of request sets for an ad account:

```
curl -G \
-d "is_completed=1" \
-d "pretty=true" \
-d "access_token=___" \
"https://graph.facebook.com/v25.0/act_71597454/asyncadrequestsets"
```

Returns:

```
{
   "data": [
      {
         "id": "6012384253789",
         "owner_id": 71597454,
         "name": "testasyncset",
         "is_completed": true
      },
   ],
   "paging": {
      "cursors": {
         "after": "___",
         "before": "___"
      }
   }
}
```

Getting a list of requests for a campaign:

```
curl -G \
-d "status=SUCCESS,ERROR" \
-d "pretty=true" \
-d "access_token=___" \
"https://graph.facebook.com/v25.0/6008248529789/asyncadrequests"
```

Return values:

```
{
   "data": [
      {
         "id": "6012384951789",
         "scope_object_id": 6008248529789,
         "status": "SUCCESS"
      },
   ],
   "paging": {
      "cursors": {
         "after": "___",
         "before": "___"
      }
   }
}
```

## Batch requests {#boverview}
With [batched requests](https://developers.facebook.com/docs/reference/api/batch), combine a number of Graph API calls into the one HTTP request. Marketing API splits this request into its constituent requests. Batched requests reduce the number of HTTP requests you send to the Marketing API. You can also make parallel batch requests using separate processing threads.

**Note:** Each [batched request](https://developers.facebook.com/docs/reference/api/batch) can contain a maximum of 50 requests. For [ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup) creation, include 10 or fewer [ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup) per batch.

Batch requests for [ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup), [adcreatives](https://developers.facebook.com/docs/reference/ads-api/adcreative), and [ad sets](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign) are similar, so this guide doesn't discuss them separately. For more information, see [Graph API batch requests](https://developers.facebook.com/docs/reference/api/batch) and [ETags](#etags).

### Create ads {#adgroup}

You can provide adcreative and other ad objects in a batched request. For example, you can create three [ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup) using one [adcreative](https://developers.facebook.com/docs/reference/ads-api/adcreative) and three different [targeting specs](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/advanced-targeting). Define your [Ad Creative](https://developers.facebook.com/docs/reference/ads-api/adcreative) first then reference it when you create each [ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup):

```
curl -F 'access_token=______'
  -F 'test1=@./test1.jpg'
  -F 'batch=[
             {
              "method": "POST",
              "name": "create_adimage",
              "relative_url": "<API_VERSION>/act_187687683/adimages",
              "attached_files": "test1"
             },
             {
              "method": "POST",
              "name": "create_creative",
              "relative_url": "<API_VERSION>/act_187687683/adcreatives",
              "attached_files": "test1",
              "body": "name=sample creative&object_story_spec={\"link_data\": {\"image_hash\": \"{result=create_adimage:$.images.*.hash}\", \"link\": \"https://www.test12345.com\", \"message\": \"this is a sample message\"}, \"page_id\":\"12345678\"}&degrees_of_freedom_spec={\"creative_features_spec\": {\"standard_enhancements\": {\"enroll_status\": \"OPT_OUT\"}}}"
             },
             {
              "method": "POST",
              "relative_url": "<API_VERSION>/act_187687683/ads",
              "body": "adset_id=6004163746239&redownload=1&status=PAUSED&optimization_goal=REACH&billing_event=IMPRESSIONS&&creative={\"creative_id\":\"{result=create_creative:$.id}\"}&targeting={\"countries\":[\"US\"]}&name=test1"
             },
             {
              "method": "POST",
              "relative_url": "<API_VERSION>/act_187687683/ads",
              "body": "adset_id=6004163746239&redownload=1&status=PAUSED&optimization_goal=REACH&billing_event=IMPRESSIONS&&creative={\"creative_id\":\"{result=create_creative:$.id}\"}&targeting={\"countries\":[\"US\"]}&name=test2"
             },
             {
              "method": "POST",
              "relative_url": "<API_VERSION>/act_187687683/ads",
              "body": "adset_id=6004163746239&redownload=1&status=PAUSED&optimization_goal=REACH&billing_event=IMPRESSIONS&&creative={\"creative_id\":\"{result=create_creative:$.id}\"}&targeting={\"countries\":[\"US\"]}&name=test3"
             }
            ]' https://graph.facebook.com/
```

The response includes individual response codes for each request and the standard Graph API response. For details, see [Making Multiple API Requests](https://developers.facebook.com/docs/graph-api/making-multiple-requests).

The [batched request](https://developers.facebook.com/docs/reference/api/batch) process uses the [JSONPath expression format](http://code.google.com/p/jsonpath/) to reference the previous requests.

### Update ads

You can update ads with batch requests. To updates bids for three [ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup):

```
curl -F 'access_token=____'
  -F 'batch=[
             {
              "method": "POST",
              "relative_url": "<API_VERSION>/6004251715639",
              "body": "redownload=1&name=new name"
             },
             {
              "method": "POST",
              "relative_url": <API_VERSION>/v6004251716039",
              "body": "redownload=1&name=new name"
             },
             {
              "method": "POST",
              "relative_url": "<API_VERSION>/6004251715839",
              "body": "redownload=1&name=new name"
             }
            ]' https://graph.facebook.com
```

If you include `redownload=1` in the relative URL, you get full ad details including the ad ID. This helps identify which ads you updated.

To update ad creative, specify the entire creative, or provide a new creative ID. This is because [Ad Creatives](https://developers.facebook.com/docs/reference/ads-api/adcreative) cannot be edited after they have been created except for name and run status.

### Read ads

If you have a large number of [ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup), split the request over multiple requests within a [batched request](https://developers.facebook.com/docs/reference/api/batch):

```
curl -F 'access_token=____'
  -F 'batch=[
             {
              "method": "GET",
              "relative_url": "<API_VERSION>/?ids=6003356308839,6004164369439&fields=<comma separated list of fields>"
             },
             {
              "method": "GET",
              "relative_url": "<API_VERSION>/6003356307839/ads&fields=<comma separated list of fields>"
             },
             {
              "method": "GET",
              "relative_url": "<API_VERSION>/act_187687683/ads?adset_ids=[6003356307839, 6004164259439]&fields=<comma separated list of fields>"
             }
            ]' https://graph.facebook.com
```

`6003356308839` and `6004164369439` are [ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup) ids and `6003356307839` and `6004164259439` are [ad set](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign) ids.

### Ad insights {#adinsights}

If you have a large number of [Ad Insights](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights) split the request over multiple requests within a [batched request](https://developers.facebook.com/docs/reference/api/batch):

```
curl -F 'access_token=____'
  -F 'batch=[
             {
              "method": "GET",
              "relative_url": "<API_VERSION>/act_19643108/insights?filtering=[{field:'ad.id',operator:'IN',value:[6003356308839,6004164369439]}]"
             },
             {
              "method": "GET",
              "relative_url": "<API_VERSION>/6003356308839/insights"
             },
             {
              "method": "GET",
              "relative_url": "<API_VERSION>/act_187687683/insights?filtering=[{field:'adset.id',operator:'IN',value:[6003356307839, 6004164259439]}]"
             }
            ]' https://graph.facebook.com
```

In this example `6003356308839` and `6004164369439` are [ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup) ids and `6003356307839` and `6004164259439` are [ad set](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign) ids.

For [Ad accounts](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account) with a large number of [ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup), do not use `act_<account_ID>/adgroupstats` because it causes the request to time out.

### Batch requests for reach estimate

You can request up to 50 [reach estimates](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/basic-targeting) in a single [batched request](https://developers.facebook.com/docs/reference/api/batch). The following example shows the reach estimate being requested for 2 different [targeting specs](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/advanced-targeting):

```
curl -F 'access_token=____'
  -F 'batch=[
             {
              "method": "GET",
              "relative_url": "<API_VERSION>/act_600335/reachestimate?targeting_spec={'geo_locations': {'countries':['US']}}"
             },
             {
              "method": "GET",
              "relative_url": "<API_VERSION>/act_600335/reachestimate?targeting_spec={'geo_locations': {'countries':['FR']}}"
             }
            ]' https://graph.facebook.com
```

## Batch API {#batchapioverview}

Batch API enables you to batch requests and send them asynchronously. Group several Graph API calls into one HTTP request, and execute them asynchronously without having to block. You can also specify dependencies between related operations.

Facebook processes each independent operation in parallel processes and your dependent operations sequentially. Each API call can have a maximum of 1000 requests.

### Make a batch API call

To make a Batch API call:

```
curl \
-F "access_token=___" \
-F "name=asyncbatchreqs" \
-F "adbatch=<an array of requests>"\
"https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/async_batch_requests"
```

Provide an array of `HTTP POST` requests as `JSON` arrays. Each request has:

* `name`
* `relative_url` - portion of URL after graph.facebook.com
* `body`

The API returns an id you use to query the progress of requests.

For example, create a campaign with an ad set with JSONPath Format to reference the previous requests:

```
curl \
-F "access_token=___" \
-F "name=batchapiexample" \
-F "adbatch=[
  {
    'name': 'create-campaign',
    'relative_url': 'act_123456/campaigns',
    'body': 'name%3DTest+Campaign%26objective%3DLINK_CLICKS%26status%3DPAUSED%26buying_type%3DAUCTION',
  },
  {
    'name': 'create-adset',
    'relative_url': 'act_123456/adsets',
    'body': 'targeting%3D%7B%22geo_locations%22%3A%7B%22countries%22%3A%5B%22US%22%5D%7D%7D%26daily_budget%3D5000%26campaign_id%3D%7Bresult%3Dcreate-campaign%3A%24.id%7D%26bid_amount%3D2%26name%3DFirst%2BAd%2BSet%20Test%26billing_event%3DLINK_CLICKS',
  },
]" \
https://graph.facebook.com/<API_VERSION>/act_123456/async_batch_requests
```

To get a request set status:

```
curl –G \
-d "access_token=___" \
-d "fields=<comma separated list of fields>" \
"https://graph.facebook.com/v25.0/<REQUEST_SET_ID>"
```

This returns overall status for async request sets as JSON objects. Not all fields are returned by default. To include them, specify the `fields`, such as `fields=id,owner_id,name,total_count,success_count,error_count,is_completed`

| Name | Description |
| --- | --- |
| `id`<br><br>type: int | **Shown by default.**<br><br>`id` of current async request set. |
| `owner_id`<br><br>type: int | **Shown by default.**<br><br>Object that owns this async request set. If you create ads, `owner_id` is the ad account id. |
| `name`<br><br>type: string | **Shown by default.**<br><br>Name of this async request set |
| `is_completed`<br><br>type: boolean | **Shown by default.**<br><br>All async requests in set complete |
| `total_count`<br><br>type: int | **Not shown by default.**<br><br>Total requests count for this request set |
| `initial_count`<br><br>type: int | **Not shown by default.**<br><br>Number of requests not served yet |
| `in_progress_count`<br><br>type: int | **Not shown by default.**<br><br>Number of requests in progress |
| `success_count`<br><br>type: int | **Not shown by default.**<br><br>Number of requests finished and successful |
| `error_count`<br><br>type: int | **Not shown by default.**<br><br>Number of requests finished and failed |
| `canceled_count`<br><br>type: int | **Not shown by default.**<br><br>Number of requests canceled by user |
| `notification_uri`<br><br>type: string | **Not shown by default.**<br><br>Notification URI for this async request set. |
| `notification_mode`<br><br>type: string | **Not shown by default.**<br><br>Ways to receive notification. Valid values:<br><br>- `OFF` – No notifications<br>- `ON_COMPLETE` – Sends a notification when the whole set is complete. |
| `notification_result`<br><br>type: string | **Not shown by default.**<br><br>Result of sending notification. |
| `notification_status`<br><br>type: string | **Not shown by default.**<br><br>Notification status: `not_sent`, `sending`, or `sent` |

After you get overall status, you can get details for each request:

```
curl –G \
-d "access_token=___" \
-d "fields=<comma separated list of fields>" \
"https://graph.facebook.com/v25.0/<REQUEST_SET_ID>/requests"
```

This returns details as a JSON array. To include non-default fields, specify it in `fields`, such as `fields=id,scope_object_id,status,result,input,async_request_set`.

| Name | Description |
| --- | --- |
| `id`<br><br>type: int | **Shown by default.**<br><br>ID of  individual async request |
| `scope_object_id`<br><br>type: int | **Shown by default.**<br><br>Parent ID of the object this request creates. If you create ads, this is ad set ID for the new ad. |
| `status`<br><br>type: string | **Shown by default.**<br><br>Status of this async request:<br><br>- `Initial` – Not processed yet<br>- `In_progress` – Request is processing<br>- `Success` – Request finished and successful<br>- `Error` – Request finished and failed<br>- `Canceled` – Request canceled by user |
| `result`<br><br>type: array | **Not shown by default.**<br><br>If request finishes, show result.<br>For success, the result is same as<br>non-async API. For example, if you create an ad<br>creation, result is new ad ID.<br>For errors:<br><br>- `error_code` – Error code returned<br>- `error_message` – Error message |
| `input`<br><br>type: object | **Not shown by default.**<br><br>Original input for this request. If you create an ad, the input is `adgroup_spec`. |
| `async_request_set`<br><br>type: object | **Not shown by default.**<br><br>Async request set containing this request. |

### List batch API requests for ad account

You can create multiple Batch API request sets. To query all request sets under an
ad account:

```
curl –G \
-d "access_token=___" \
"https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/async_requests"
```

## ETags {#etags}

Marketing API supports [Etags](http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.19). This helps you tell if the data you query has changed since you last checked. How this works:

1. When you make a call, the response header includes an ETag with a value that is the hash of the data returned in the API call. Save this ETag value for use in the next step.
2. Next time you make the same API call, include the __If-None-Match__ request header with the ETag value you saved.
3. If the data has not changed, the response status code is `304 – Not Modified` and no data is returned.
4. If the data has changed since the last query, the data is returned as usual with a new ETag. Save the new ETag value and use it for subsequent calls.

While ETags help reduce data traffic, `If-None-Match GET` still counts against rate limits for your app.

The ETag is calculated using the entire response from the API call including its formatting. The formatting of the response may be impacted by the user agent string. Therefore, you should keep your user agent consistent between calls made from the same client.

### ETags examples {#etag}

To check if the user's adaccounts have changed.

__Step 1__: Determine the ETag for the current data

```
curl -i "https://graph.beta.facebook.com/me/adaccounts?access_token=___"
```

The response will be as follows:

```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Cache-Control: private, no-cache, no-store, must-revalidate
Content-Type: text/javascript; charset=UTF-8
ETag: "7776cdb01f44354af8bfa4db0c56eebcb1378975"
Expires: Sat, 01 Jan 2000 00:00:00 GMT
Pragma: no-cache
X-FB-Rev: 495685
X-FB-Server: 10.30.149.204
X-FB-Debug: CWbHcogdwUE8saMv6ML+8FacXFrE8ufhjjwxU2dQWaA=
X-Cnection: close
Date: Mon, 16 Jan 2012 12:07:44 GMT
Content-Length: 3273

{"data":[{"id":"act.......
```

In this example the ETag is `"7776cdb01f44354af8bfa4db0c56eebcb1378975"`, note that the ETag includes the quotes (`"`).

__Step 2__: Determine if there have been any changes to the data

```
curl -i -H "If-None-Match: \"7776cdb01f44354af8bfa4db0c56eebcb1378975\"" "https://graph.beta.facebook.com/me/adaccounts?access_token=___"
```

If nothing has changed the response will be as follows:

```
HTTP/1.1 304 Not Modified
Access-Control-Allow-Origin: *
Cache-Control: private, no-cache, no-store, must-revalidate
Content-Type: text/javascript; charset=UTF-8
Expires: Sat, 01 Jan 2000 00:00:00 GMT
Pragma: no-cache
X-FB-Rev: 495685
X-FB-Server: 10.30.177.190
X-FB-Debug: ImBhat3k07Nez5FvuS2lPWU0U2xxmxD4B3k9ua4Sk7Q=
X-Cnection: close
Date: Mon, 16 Jan 2012 12:09:17 GMT
Content-Length: 0
```

Note the `304 Not Modified` response. If the data had changed a normal API response would be returned.

A batch example to check if the user's ads have changed.

__Step 1__: Determine the ETag for the current data

```
curl -i "curl -F 'access_token=___' -F 'batch=[
  {"method":"GET", "relative_url": "?ids=6003356308839,6004164369439" },
  {"method":"GET", "relative_url": "act_12345678/ads?campaign_ids=[6003356307839, 6004164259439]"}]'
 https://graph.facebook.com"
```

The response will contain ETag values as follows:

```
...{"name":"ETag","value":"\"21d371640127490b2ed0387e8af3f0f8c9eff012\""}...
...{"name":"ETag","value":"\"410e53bb257f116e8716e4ebcc76df1c567b87f4\""}...
```

In this example the ETags are `"21d371640127490b2ed0387e8af3f0f8c9eff012"` and `"410e53bb257f116e8716e4ebcc76df1c567b87f4"` note that the ETag includes the quotes (`"`).

__Step 2__: Determine if there have been any changes to the data:

```
curl -F 'access_token=___' -F 'batch=[
  {"method":"GET", "headers":["If-None-Match: \"21d371640127490b2ed0387e8af3f0f8c9eff012\""], "relative_url": "?ids=6003356308839,6004164369439" },
  {"method":"GET",  "headers":["If-None-Match: \"410e53bb257f116e8716e4ebcc76df1c567b87f4\""], "relative_url": "act_12345678/ads?campaign_ids=[6003356307839, 6004164259439]"}]'
https://graph.facebook.com
```

If nothing has changed the response is:

```
[{
    "code": 304,
    .
    .
    .
    "body": null
},
{
    "code": 304,
    .
    .
    .
    "body": null
}]
```

Note the `304 Not Modified` response. If the data changed, Marketing API returns a normal API response.
