<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/ads | Saved: 2026-09-19 -->

# Ad Account Ads



Ads belonging to this ad account.

## Reading

Ads belonging to this ad account

```html
curl GET \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads
```

#### Parameters

| Parameter | Description |
| --- | --- |
| `date_preset`<br><br>*enum{today, yesterday, this_month, last_month, this_quarter, maximum, data_maximum, last_3d, last_7d, last_14d, last_28d, last_30d, last_90d, last_week_mon_sun, last_week_sun_sat, last_quarter, last_year, this_week_mon_today, this_week_sun_today, this_year}* | Predefine date range used to aggregate insights metrics<br> |
| `effective_status`<br><br>*list<string>* | Filter ads by effective status<br> |
| `time_range`<br><br>*{'since':YYYY-MM-DD,'until':YYYY-MM-DD}* | Date range used to aggregate insights metrics<br><br><br>`since` *datetime*<br>A date in the format of "YYYY-MM-DD", which means from the beginning midnight of that day.<br><br><br>`until` *datetime*<br>A date in the format of "YYYY-MM-DD", which means to the beginning midnight of the following day.<br> |
| `updated_since`<br><br>*integer* | Time since the Ad has been updated.<br> |

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

A list of [Ad](https://developers.facebook.com/docs/graph-api/reference/adgroup) nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

##### summary

Aggregated information about the edge, such as counts. Specify the fields to fetch in the summary param (like summary=__type__).

| Field | Description |
| --- | --- |
| `insights`<br><br>*Edge<AdsInsights>* | Analytics summary for all objects<br> |
| `total_count`<br><br>*unsigned int32* | Total number of Ads returned by the query<br><br><br>**[default]**<br> |

#### Error Codes

| Error Code | Description |
| --- | --- |
| 200 | Permissions error |
| 613 | Calls to this api have exceeded the rate limit. |
| 100 | Invalid parameter |
| 80004 | There have been too many calls to this ad-account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting#ads-management. |
| 190 | Invalid OAuth 2.0 Access Token |
| 2500 | Error parsing graph query |
| 3018 | The start date of the time range cannot be beyond 37 months from the current date |
| 2635 | You are calling a deprecated version of the Ads API. Please update to the latest version. |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |

## Creating

### /act_{ad_account_id}/ads
You can make a POST request to *ads* edge from the following paths:

- [/act_{ad_account_id}/ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/ads)

When posting to this edge, an [Ad](https://developers.facebook.com/docs/graph-api/reference/adgroup) will be created.

#### Example

### HTTP
```
POST /v25.0/act_<AD_ACCOUNT_ID>/ads HTTP/1.1
Host: graph.facebook.com

name=My+Ad&adset_id=%3CAD_SET_ID%3E&creative=%7B%22creative_id%22%3A%22%3CCREATIVE_ID%3E%22%7D&status=PAUSED
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->post(
    '/act_<AD_ACCOUNT_ID>/ads',
    array (
      'name' => 'My Ad',
      'adset_id' => '<AD_SET_ID>',
      'creative' => '{"creative_id":"<CREATIVE_ID>"}',
      'status' => 'PAUSED',
    ),
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
    "/act_<AD_ACCOUNT_ID>/ads",
    "POST",
    {
        "name": "My Ad",
        "adset_id": "<AD_SET_ID>",
        "creative": "{\"creative_id\":\"<CREATIVE_ID>\"}",
        "status": "PAUSED"
    },
    function (response) {
      if (response && !response.error) {
        /* handle the result */
      }
    }
);
```

### Android SDK
```
Bundle params = new Bundle();
params.putString("name", "My Ad");
params.putString("adset_id", "<AD_SET_ID>");
params.putString("creative", "{\"creative_id\":\"<CREATIVE_ID>\"}");
params.putString("status", "PAUSED");
/* make the API call */
new GraphRequest(
    AccessToken.getCurrentAccessToken(),
    "/act_<AD_ACCOUNT_ID>/ads",
    params,
    HttpMethod.POST,
    new GraphRequest.Callback() {
        public void onCompleted(GraphResponse response) {
            /* handle the result */
        }
    }
).executeAsync();
```

### iOS SDK
```
NSDictionary *params = @{
  @"name": @"My Ad",
  @"adset_id": @"<AD_SET_ID>",
  @"creative": @"{\"creative_id\":\"<CREATIVE_ID>\"}",
  @"status": @"PAUSED",
};
/* make the API call */
FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc]
                               initWithGraphPath:@"/act_<AD_ACCOUNT_ID>/ads"
                                      parameters:params
                                      HTTPMethod:@"POST"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

### cURL
```
curl -X POST \
  -F 'name="My Ad"' \
  -F 'adset_id="<AD_SET_ID>"' \
  -F 'creative={
       "creative_id": "<CREATIVE_ID>"
     }' \
  -F 'status="PAUSED"' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=POST&path=act_%3CAD_ACCOUNT_ID%3E%2Fads%3Fname%3DMy%2BAd%26adset_id%3D%253CAD_SET_ID%253E%26creative%3D%257B%2522creative_id%2522%253A%2522%253CCREATIVE_ID%253E%2522%257D%26status%3DPAUSED&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `ad_schedule_end_time`<br><br>*datetime* | An optional parameter that defines the end time of an individual ad. If no end time is defined, the ad will run on the campaign’s schedule.<br><br><br>This parameter is only available for sales and app promotion campaigns.<br> |
| `ad_schedule_start_time`<br><br>*datetime* | An optional parameter that defines the start time of an individual ad. If no start time is defined, the ad will run on the campaign’s schedule.<br><br><br>This parameter is only available for sales and app promotion campaigns.<br> |
| `adlabels`<br><br>*list<Object>* | Ad labels associated with this ad<br> |
| `adset_id`<br><br>*int64* | The ID of the ad set, required on creation.<br> |
| `adset_spec`<br><br>*Ad set spec* | The ad set spec for this ad. When the spec is provided, adset_id field is not required.<br> |
| `audience_id`<br><br>*string* | The ID of the audience.<br> |
| `bid_amount`<br><br>*integer* | **Deprecated.** We no longer allow setting the `bid_amount` value on an ad. Please set `bid_amount` for the ad set.<br> |
| `conversion_domain`<br><br>*string* | The domain where conversions happen. Required to create or update an ad in a campaign that shares data with a pixel. This field will be auto-populated for existing ads by inferring from destination URLs . Note that this field should contain only the first and second level domains, and not the full URL. For example `facebook.com`.<br> |
| `creative`<br><br>*AdCreative* | This field is required for create. The ID or creative spec of the ad creative to be used by this ad. You can read more about creatives [here](https://developers.facebook.com/docs/marketing-api/adcreative). You may supply the ID within an object as follows:<br><br>`{"creative_id": <CREATIVE_ID>}`<br>or creative spec as follow:<br><br> `{"creative": {\"name\": \"<NAME>\", \"object_story_spec\": <SPEC>}}`<br><br>**[required]**<br><br>**[supports emoji]**<br> |
| `creative_asset_groups_spec`<br><br>*string (CreativeAssetGroupsSpec)* | creative_asset_groups_spec<br><br>**[supports emoji]**<br> |
| `date_format`<br><br>*string* | The format of the date.<br> |
| `display_sequence`<br><br>*int64* | The sequence of the ad within the same campaign<br> |
| `engagement_audience`<br><br>*boolean* | Flag to create a new audience based on users who engage with this ad<br> |
| `execution_options`<br><br>*list<enum{validate_only, synchronous_ad_review, include_recommendations}>* | **Default value: **`Set`<br>An execution setting<br> `validate_only`: when this option is specified, the API call will not perform the mutation but will run through the validation rules against values of each field. <br>`include_recommendations`: this option cannot be used by itself. When this option is used, recommendations  for ad object's configuration will be included. A separate section [recommendations](https://developers.facebook.com/docs/marketing-api/reference/ad-recommendation) will be included in the response, but only if recommendations for this specification exist.<br>`synchronous_ad_review`: this option should not be used by itself. It should always be specified with `validate_only`. When these options are specified, the API call will perform Ads Integrity validations, which include message language checking, image 20% text rule, and so on, as well as the validation logics.<br>If the call passes validation or review, response will be `{"success": true}`. If the call does not pass, an error will be returned with more details. These options can be used to improve any UI to display errors to the user much sooner, e.g. as soon as a new value is typed into any field corresponding to this ad object, rather than at the upload/save stage, or after review.<br> |
| `include_demolink_hashes`<br><br>*boolean* | Include the demolink hashes.<br> |
| `name`<br><br>*string* | Name of the ad.<br><br>**[required]**<br><br>**[supports emoji]**<br> |
| `priority`<br><br>*int64* | Priority<br> |
| `source_ad_id`<br><br>*numeric string or integer* | ID of the source Ad, if applicable.<br> |
| `status`<br><br>*enum{ACTIVE, PAUSED, DELETED, ARCHIVED}* | Only `ACTIVE` and `PAUSED` are valid during creation. Other statuses<br>can be used for update. When an ad is created, it will first go through<br>ad review, and will have the ad status `PENDING_REVIEW` before it<br>finishes review and reverts back to your selected status of `ACTIVE`<br>or `PAUSED`. During testing, it is recommended to set ads to a `PAUSED`<br>status so as to not incur accidental spend.<br> |
| `tracking_specs`<br><br>*Object* | With Tracking Specs, you log actions taken by people on your ad. See [Tracking and Conversion Specs](https://developers.facebook.com/documentation/ads-commerce/marketing-api/tracking-specs).<br> |

#### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node represented by *id* in the return type.

```
Struct  {
id: numeric string,
success: bool,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |
| 200 | Permissions error |
| 613 | Calls to this api have exceeded the rate limit. |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |
| 80004 | There have been too many calls to this ad-account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting#ads-management. |
| 194 | Missing at least one required parameter |
| 500 | Message contains banned content |
| 2635 | You are calling a deprecated version of the Ads API. Please update to the latest version. |
| 190 | Invalid OAuth 2.0 Access Token |
| 105 | The number of parameters exceeded the maximum for this operation |

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

