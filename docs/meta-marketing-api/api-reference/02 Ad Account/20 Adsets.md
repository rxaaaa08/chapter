<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/adsets | Saved: 2026-09-19 -->

# Ad Account Adsets



**Success:** Due to the iOS 14.5 launch, changes have been made to this endpoint.

* Mobile App Custom Audiences for inclusion targeting is no longer supported for the `POST /{ad-account-id}/adsets` endpoint for iOS 14.5 SKAdNetwork campaigns.
* New iOS 14.5 app install campaigns will no longer be able to use app connections targeting.

## Reading

The adsets of this ad account

#### Example

### HTTP
```
GET /v25.0/act_<AD_ACCOUNT_ID>/adsets?fields=name%2Cid%2Cstatus HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/act_<AD_ACCOUNT_ID>/adsets?fields=name%2Cid%2Cstatus',
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
    "/act_<AD_ACCOUNT_ID>/adsets",
    {
        "fields": "name,id,status"
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
params.putString("fields", "name,id,status");
/* make the API call */
new GraphRequest(
    AccessToken.getCurrentAccessToken(),
    "/act_<AD_ACCOUNT_ID>/adsets",
    params,
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
NSDictionary *params = @{
  @"fields": @"name,id,status",
};
/* make the API call */
FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc]
                               initWithGraphPath:@"/act_<AD_ACCOUNT_ID>/adsets"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

### cURL
```
curl -X GET -G \
  -d 'fields="name,id,status"' \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=act_%3CAD_ACCOUNT_ID%3E%2Fadsets%3Ffields%3Dname%252Cid%252Cstatus&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `date_preset`<br><br>*enum {TODAY, YESTERDAY, THIS_MONTH, LAST_MONTH, THIS_QUARTER, MAXIMUM, DATA_MAXIMUM, LAST_3D, LAST_7D, LAST_14D, LAST_28D, LAST_30D, LAST_90D, LAST_WEEK_MON_SUN, LAST_WEEK_SUN_SAT, LAST_QUARTER, LAST_YEAR, THIS_WEEK_MON_TODAY, THIS_WEEK_SUN_TODAY, THIS_YEAR}* | Predefine date range used to aggregate insights metrics<br> |
| `effective_status`<br><br>*list<enum{ACTIVE, PAUSED, DELETED, PENDING_REVIEW, DISAPPROVED, PREAPPROVED, PENDING_BILLING_INFO, CAMPAIGN_PAUSED, ARCHIVED, ADSET_PAUSED, IN_PROCESS, WITH_ISSUES}>* | Effective status of adset<br> |
| `is_completed`<br><br>*boolean* | Filter adset by completed status<br> |
| `time_range`<br><br>*{'since':YYYY-MM-DD,'until':YYYY-MM-DD}* | Date range used to aggregate insights metrics<br><br><br>`since` *datetime*<br>A date in the format of "YYYY-MM-DD", which means from the beginning midnight of that day.<br><br><br>`until` *datetime*<br>A date in the format of "YYYY-MM-DD", which means to the beginning midnight of the following day.<br> |
| `updated_since`<br><br>*integer* | Time since the Adset has been updated.<br> |

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

A list of [AdSet](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign) nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

##### summary

Aggregated information about the edge, such as counts. Specify the fields to fetch in the summary param (like summary=__type__).

| Field | Description |
| --- | --- |
| `insights`<br><br>*Edge<AdsInsights>* | Analytics summary for all objects. Use [nested parameters](https://developers.facebook.com/docs/graph-api/advanced#fieldexpansion) with this field.<br>`insights.time_range({'until':'2018-01-01', 'since':'2017-12-12'}).time_increment(1)`<br> |
| `total_count`<br><br>*unsigned int32* | Total number of objects<br><br><br>**[default]**<br> |

#### Error Codes

| Error Code | Description |
| --- | --- |
| 200 | Permissions error |
| 613 | Calls to this api have exceeded the rate limit. |
| 100 | Invalid parameter |
| 190 | Invalid OAuth 2.0 Access Token |
| 80004 | There have been too many calls to this ad-account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting#ads-management. |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |
| 3018 | The start date of the time range cannot be beyond 37 months from the current date |
| 2500 | Error parsing graph query |

## Creating

**Warning:** Mobile App Install CPA Billing will no longer be supported. The [billing event](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview/billing-events) cannot be App Install if the Optimization goal is App Install.

### /act_{ad_account_id}/adsets
You can make a POST request to *adsets* edge from the following paths:

- [/act_{ad_account_id}/adsets](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/adsets)

When posting to this edge, an [AdSet](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign) will be created.

#### Example

### HTTP
```
POST /v25.0/act_<AD_ACCOUNT_ID>/adsets HTTP/1.1
Host: graph.facebook.com

name=My+First+Adset&lifetime_budget=20000&start_time=2026-05-12T10%3A45%3A01-0700&end_time=2026-05-22T10%3A45%3A01-0700&campaign_id=%3CAD_CAMPAIGN_ID%3E&bid_amount=100&billing_event=LINK_CLICKS&optimization_goal=LINK_CLICKS&targeting=%7B%22facebook_positions%22%3A%5B%22feed%22%5D%2C%22geo_locations%22%3A%7B%22countries%22%3A%5B%22US%22%5D%7D%2C%22publisher_platforms%22%3A%5B%22facebook%22%2C%22audience_network%22%5D%7D&status=PAUSED
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->post(
    '/act_<AD_ACCOUNT_ID>/adsets',
    array (
      'name' => 'My First Adset',
      'lifetime_budget' => '20000',
      'start_time' => '2026-05-12T10:45:01-0700',
      'end_time' => '2026-05-22T10:45:01-0700',
      'campaign_id' => '<AD_CAMPAIGN_ID>',
      'bid_amount' => '100',
      'billing_event' => 'LINK_CLICKS',
      'optimization_goal' => 'LINK_CLICKS',
      'targeting' => '{"facebook_positions":["feed"],"geo_locations":{"countries":["US"]},"publisher_platforms":["facebook","audience_network"]}',
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
    "/act_<AD_ACCOUNT_ID>/adsets",
    "POST",
    {
        "name": "My First Adset",
        "lifetime_budget": "20000",
        "start_time": "2026-05-12T10:45:01-0700",
        "end_time": "2026-05-22T10:45:01-0700",
        "campaign_id": "<AD_CAMPAIGN_ID>",
        "bid_amount": "100",
        "billing_event": "LINK_CLICKS",
        "optimization_goal": "LINK_CLICKS",
        "targeting": "{\"facebook_positions\":[\"feed\"],\"geo_locations\":{\"countries\":[\"US\"]},\"publisher_platforms\":[\"facebook\",\"audience_network\"]}",
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
params.putString("name", "My First Adset");
params.putString("lifetime_budget", "20000");
params.putString("start_time", "2026-05-12T10:45:01-0700");
params.putString("end_time", "2026-05-22T10:45:01-0700");
params.putString("campaign_id", "<AD_CAMPAIGN_ID>");
params.putString("bid_amount", "100");
params.putString("billing_event", "LINK_CLICKS");
params.putString("optimization_goal", "LINK_CLICKS");
params.putString("targeting", "{\"facebook_positions\":[\"feed\"],\"geo_locations\":{\"countries\":[\"US\"]},\"publisher_platforms\":[\"facebook\",\"audience_network\"]}");
params.putString("status", "PAUSED");
/* make the API call */
new GraphRequest(
    AccessToken.getCurrentAccessToken(),
    "/act_<AD_ACCOUNT_ID>/adsets",
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
  @"name": @"My First Adset",
  @"lifetime_budget": @"20000",
  @"start_time": @"2026-05-12T10:45:01-0700",
  @"end_time": @"2026-05-22T10:45:01-0700",
  @"campaign_id": @"<AD_CAMPAIGN_ID>",
  @"bid_amount": @"100",
  @"billing_event": @"LINK_CLICKS",
  @"optimization_goal": @"LINK_CLICKS",
  @"targeting": @"{\"facebook_positions\":[\"feed\"],\"geo_locations\":{\"countries\":[\"US\"]},\"publisher_platforms\":[\"facebook\",\"audience_network\"]}",
  @"status": @"PAUSED",
};
/* make the API call */
FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc]
                               initWithGraphPath:@"/act_<AD_ACCOUNT_ID>/adsets"
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
  -F 'name="My First Adset"' \
  -F 'lifetime_budget=20000' \
  -F 'start_time="2026-05-12T10:45:01-0700"' \
  -F 'end_time="2026-05-22T10:45:01-0700"' \
  -F 'campaign_id="<AD_CAMPAIGN_ID>"' \
  -F 'bid_amount=100' \
  -F 'billing_event="LINK_CLICKS"' \
  -F 'optimization_goal="LINK_CLICKS"' \
  -F 'targeting={
       "facebook_positions": [
         "feed"
       ],
       "geo_locations": {
         "countries": [
           "US"
         ]
       },
       "publisher_platforms": [
         "facebook",
         "audience_network"
       ]
     }' \
  -F 'status="PAUSED"' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=POST&path=act_%3CAD_ACCOUNT_ID%3E%2Fadsets%3Fname%3DMy%2BFirst%2BAdset%26lifetime_budget%3D20000%26start_time%3D2026-05-12T10%253A45%253A01-0700%26end_time%3D2026-05-22T10%253A45%253A01-0700%26campaign_id%3D%253CAD_CAMPAIGN_ID%253E%26bid_amount%3D100%26billing_event%3DLINK_CLICKS%26optimization_goal%3DLINK_CLICKS%26targeting%3D%257B%2522facebook_positions%2522%253A%255B%2522feed%2522%255D%252C%2522geo_locations%2522%253A%257B%2522countries%2522%253A%255B%2522US%2522%255D%257D%252C%2522publisher_platforms%2522%253A%255B%2522facebook%2522%252C%2522audience_network%2522%255D%257D%26status%3DPAUSED&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `adlabels`<br><br>*list<Object>* | Specifies list of labels to be associated with this object. This field is optional<br> |
| `adset_schedule`<br><br>*list<Object>* | Ad set schedule, representing a delivery schedule for a single day<br><br><br>`start_minute` *int64*<br>A 0 based minute of the day representing when the schedule starts<br><br>**[required]**<br><br><br>`end_minute` *int64*<br>A 0 based minute of the day representing when the schedule ends<br><br>**[required]**<br><br><br>`days` *list<int64>*<br>Array of ints representing which days the schedule is active. Valid values are 0-6 with 0 representing Sunday, 1 representing Monday, ... and 6 representing Saturday.<br><br>**[required]**<br><br><br>`timezone_type` *enum {USER, ADVERTISER}*<br><br>**Default value: **`USER` |
| `attribution_spec`<br><br>*list<JSON object>* | Conversion attribution spec used for attributing conversions for optimization. Supported window lengths differ by optimization goal and campaign objective.<br><br><br>`event_type` *enum {CLICK_THROUGH, VIEW_THROUGH, ENGAGED_VIDEO_VIEW}*<br>**[required]**<br><br><br>`window_days` *int64*<br>**[required]**<br><br><br>`weight` *float*<br><br>**Default value: **`100` |
| `automatic_manual_state`<br><br>*enum{UNSET, AUTOMATIC, MANUAL}* | automatic_manual_state<br> |
| `bid_amount`<br><br>*integer* | Bid cap or target cost for this ad set. The bid cap used in a *lowest cost bid strategy* is defined as the maximum bid you want to pay for a result based on your `optimization_goal`. The target cost used in a *target cost bid strategy* lets Facebook bid to meet your target on average and keep costs stable as you spend. If an ad level `bid_amount` is specified, updating this value will overwrite the previous ad level bid. Unless you are using [Reach and Frequency](https://developers.facebook.com/docs/marketing-api/reachandfrequency), `bid_amount` is required if `bid_strategy` is set to `LOWEST_COST_WITH_BID_CAP` or `COST_CAP`.<br><br>The bid amount's unit is cents for currencies like USD, EUR, and the basic unit for currencies like JPY, KRW. The bid amount for ads with `IMPRESSION` or `REACH` as `billing_event` is per 1,000 occurrences, and has to be at least 2 US cents or more. For ads with other `billing_event`s, the bid amount is for each occurrence, and has a minimum value 1 US cents. The minimum bid amounts of other currencies are of similar value to the US Dollar values provided.<br> |
| `bid_strategy` This field is only accessible in v3.0 or later.<br><br>*enum{LOWEST_COST_WITHOUT_CAP, LOWEST_COST_WITH_BID_CAP, COST_CAP, LOWEST_COST_WITH_MIN_ROAS}* | Choose bid strategy for this ad set to suit your specific business goals.<br>Each strategy has tradeoffs and may be available for certain `optimization_goal`s:<br><br>`LOWEST_COST_WITHOUT_CAP`: Designed to get the most results for your budget based on<br>your ad set `optimization_goal` without limiting your bid amount. This is the best strategy<br>if you care most about cost efficiency. However with this strategy it may be harder to get<br>stable average costs as you spend. This strategy is also known as *automatic bidding*.<br>Learn more in [Ads Help Center, About bid strategies: Lowest cost](https://www.facebook.com/business/help/721453268045071).<br><br>`LOWEST_COST_WITH_BID_CAP`: Designed to get the most results for your budget based on<br>your ad set `optimization_goal` while limiting actual bid to your specified<br>amount. With a bid cap you have more control over your<br>cost per actual optimization event. However if you set a limit which is too low you may<br>get less ads delivery. If you select this, you must provide<br>a bid cap with the `bid_amount` field.<br>Note: during creation this bid strategy is set if you provide `bid_amount` only.<br>This strategy is also known as *manual maximum-cost bidding*.<br>Learn more in [Ads Help Center, About bid strategies: Lowest cost](https://www.facebook.com/business/help/721453268045071).<br><br><br>Notes:<br><br><br>• If you enable campaign budget optimization, you should set `bid_strategy` at the parent campaign level.<br><br>• `TARGET_COST` bidding strategy has been deprecated with [Marketing API v9](https://developers.facebook.com/docs/graph-api/changelog/version9.0).<br><br> |
| `billing_event`<br><br>*enum{APP_INSTALLS, CLICKS, IMPRESSIONS, LINK_CLICKS, NONE, OFFER_CLAIMS, PAGE_LIKES, POST_ENGAGEMENT, THRUPLAY, PURCHASE, LISTING_INTERACTION}* | The billing event that this ad set is using:<br>APP_INSTALLS: Pay when people install your app.<br>CLICKS: Deprecated.<br>IMPRESSIONS: Pay when the ads are shown to people.<br>LINK_CLICKS: Pay when people click on the link of the ad.<br>OFFER_CLAIMS: Pay when people claim the offer.<br>PAGE_LIKES: Pay when people like your page.<br>POST_ENGAGEMENT: Pay when people engage with your post.<br>VIDEO_VIEWS: Pay when people watch your video ads for at least 10 seconds.<br>THRUPLAY: Pay for ads that are played to completion, or played for at least 15 seconds.<br> |
| `budget_schedule_specs`<br><br>*list<JSON or object-like arrays>* | Initial high demand periods to be created with the ad set.<br><br>Provide list of `time_start`, `time_end`,`budget_value`, and `budget_value_type`.<br>For example,<br>-F 'budget_schedule_specs=[{<br><br>"time_start":1699081200,<br><br>"time_end":1699167600,<br><br>"budget_value":100,<br><br>"budget_value_type":"ABSOLUTE"<br><br>}]'<br><br>See [High Demand Period](https://developers.facebook.com/docs/graph-api/reference/high-demand-period) for more details on each field.<br><br><br>`id` *int64*<br><br>`time_start` *datetime*<br><br>`time_end` *datetime*<br><br>`budget_value` *int64*<br><br>`budget_value_type` *enum{ABSOLUTE, MULTIPLIER}*<br><br>`recurrence_type` *enum{ONE_TIME, WEEKLY}*<br><br>`weekly_schedule` *list<JSON or object-like arrays>*<br><br>`days` *list<int64>*<br><br>`minute_start` *int64*<br><br>`minute_end` *int64*<br><br>`timezone_type` *string* |
| `budget_source`<br><br>*enum{NONE, RMN}* | budget_source<br> |
| `budget_split_set_id`<br><br>*numeric string or integer* | budget_split_set_id<br> |
| `campaign_attribution`<br><br>*enum{}* | campaign_attribution<br> |
| `campaign_id`<br><br>*numeric string or integer* | The ad campaign you wish to add this ad set to.<br> |
| `campaign_spec`<br><br>*Campaign spec* | Provide `name`, `objective` and `buying_type` for a campaign you want to create. Otherwise you need to provide `campaign_id` for an existing ad campaign. For example:<br>-F 'campaign_spec={<br>  "name": "Inline created campaign",<br>  "objective": "CONVERSIONS",<br>  "buying_type": "AUCTION"<br>}'<br><br>Please refer to the [Outcome-Driven Ads Experiences mapping table](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group#odax-mapping) to find new objectives and their corresponding destination types, optimization goals and promoted objects.<br> |
| `contextual_bundling_spec`<br><br>*Object* | settings of Contextual Bundle to support ads serving in Facebook contextual surfaces<br><br><br>`status` *enum{OPT_OUT, OPT_IN}* |
| `cost_bidding_mode`<br><br>*enum{VOLUME_FOCUSED, BALANCED, COST_FOCUSED}* | cost_bidding_mode<br> |
| `creative_sequence`<br><br>*list<numeric string or integer>* | Order of the adgroup sequence to be shown to users<br> |
| `daily_budget`<br><br>*int64* | The daily budget defined in your [account currency](https://developers.facebook.com/documentation/ads-commerce/marketing-api), allowed only for ad sets with a duration (difference between `end_time` and `start_time`) longer than 24 hours. <br>Either `daily_budget` or `lifetime_budget` must be greater than 0.<br> |
| `daily_imps`<br><br>*int64* | Daily impressions. Available only for campaigns with `buying_type=FIXED_CPM`<br> |
| `daily_min_spend_target`<br><br>*int64* | Daily minimum spend target of the ad set defined in your account currency. To use this field, daily budget must be specified in the Campaign. This target is not a guarantee but our best effort.<br> |
| `daily_spend_cap`<br><br>*int64* | Daily spend cap of the ad set defined in your account currency. To use this field, daily budget must be specified in the Campaign. Set the value to 922337203685478 to remove the spend cap.<br> |
| `destination_type`<br><br>*enum{WEBSITE, APP, MESSENGER, APPLINKS_AUTOMATIC, WHATSAPP, INSTAGRAM_DIRECT, FACEBOOK, MESSAGING_MESSENGER_WHATSAPP, MESSAGING_INSTAGRAM_DIRECT_MESSENGER, MESSAGING_INSTAGRAM_DIRECT_MESSENGER_WHATSAPP, MESSAGING_INSTAGRAM_DIRECT_WHATSAPP, SHOP_AUTOMATIC, ON_AD, ON_POST, ON_EVENT, ON_VIDEO, ON_PAGE, INSTAGRAM_PROFILE, FACEBOOK_PAGE, INSTAGRAM_PROFILE_AND_FACEBOOK_PAGE, INSTAGRAM_LIVE, FACEBOOK_LIVE, IMAGINE}* | Destination of ads in this Ad Set. Options include: Website, App, Messenger, `INSTAGRAM_DIRECT`, `INSTAGRAM_PROFILE`.<br> |
| `dsa_beneficiary`<br><br>*string* | dsa_beneficiary<br> |
| `dsa_payor`<br><br>*string* | dsa_payor<br> |
| `end_time`<br><br>*datetime* | End time, required when `lifetime_budget` is specified. e.g. `2015-03-12 23:59:59-07:00` or `2015-03-12 23:59:59 PDT`. When creating a set with a daily budget, specify `end_time=0` to set the set to be ongoing and have no end date. UTC UNIX timestamp<br> |
| `execution_options`<br><br>*list<enum{validate_only, include_recommendations}>* | **Default value: **`Set`<br>An execution setting<br> `validate_only`: when this option is specified, the API call will not perform the mutation but will run through the validation rules against values of each field. <br>`include_recommendations`: this option cannot be used by itself. When this option is used, recommendations  for ad object's configuration will be included. A separate section [recommendations](https://developers.facebook.com/docs/marketing-api/reference/ad-recommendation) will be included in the response, but only if recommendations for this specification exist.<br>If the call passes validation or review, response will be `{"success": true}`. If the call does not pass, an error will be returned with more details. These options can be used to improve any UI to display errors to the user much sooner, e.g. as soon as a new value is typed into any field corresponding to this ad object, rather than at the upload/save stage, or after review.<br> |
| `existing_customer_budget_percentage`<br><br>*int64* | existing_customer_budget_percentage<br> |
| `frequency_control_specs`<br><br>*list<Object>* | An array of frequency control specs for this ad set. Writes to this field are only available in ad sets where `REACH` and `THRUPLAY` are the performance goal.<br><br><br>`event` *enum{IMPRESSIONS, VIDEO_VIEWS, VIDEO_VIEWS_2S, VIDEO_VIEWS_15S}*<br>Event name, only `IMPRESSIONS` currently.<br><br>**[required]**<br><br><br>`interval_days` *integer*<br>Interval period in days, between 1 and 90<br>(inclusive)<br><br>**[required]**<br><br><br>`max_frequency` *integer*<br>The maximum frequency, between 1 and 90<br>(inclusive)<br><br>**[required]**<br><br><br>`type` *enum{NONE, CAP, TARGET}* |
| `is_dc_follow_optimized`<br><br>*boolean* | is_dc_follow_optimized<br> |
| `is_dynamic_creative` This field is only accessible in v3.2 or later.<br><br>*boolean* | Indicates the ad set must only be used for dynamic creatives. Dynamic creative ads can be created in this ad set. Defaults to `false`<br> |
| `is_sac_cfca_terms_certified`<br><br>*boolean* | is_sac_cfca_terms_certified<br> |
| `lifetime_budget`<br><br>*int64* | Lifetime budget, defined in  your [account currency](https://developers.facebook.com/documentation/ads-commerce/marketing-api). If specified, you must also specify an `end_time`.<br>Either `daily_budget` or `lifetime_budget` must be greater than 0.<br> |
| `lifetime_imps`<br><br>*int64* | Lifetime impressions. Available only for campaigns with `buying_type=FIXED_CPM`<br> |
| `lifetime_min_spend_target`<br><br>*int64* | Lifetime minimum spend target of the ad set defined in your account currency. To use this field, lifetime budget must be specified in the Campaign. This target is not a guarantee but our best effort.<br> |
| `lifetime_spend_cap`<br><br>*int64* | Lifetime spend cap of the ad set defined in your account currency. To use this field, lifetime budget must be specified in the Campaign. Set the value to 922337203685478 to remove the spend cap.<br> |
| `max_budget_spend_percentage`<br><br>*int64* | max_budget_spend_percentage<br> |
| `min_budget_spend_percentage`<br><br>*int64* | min_budget_spend_percentage<br> |
| `multi_event_conversion_attribution_window_seconds`<br><br>*int64* | multi_event_conversion_attribution_window_seconds<br> |
| `multi_optimization_goal_weight`<br><br>*enum{UNDEFINED, BALANCED, PREFER_INSTALL, PREFER_EVENT}* | multi_optimization_goal_weight<br> |
| `name`<br><br>*string* | Ad set name, max length of 400 characters.<br><br>**[required]**<br><br>**[supports emoji]**<br> |
| `optimization_goal`<br><br>*enum{NONE, APP_INSTALLS, AD_RECALL_LIFT, ENGAGED_USERS, EVENT_RESPONSES, IMPRESSIONS, LEAD_GENERATION, QUALITY_LEAD, LINK_CLICKS, OFFSITE_CONVERSIONS, PAGE_LIKES, POST_ENGAGEMENT, QUALITY_CALL, REACH, LANDING_PAGE_VIEWS, VISIT_INSTAGRAM_PROFILE, ENGAGED_PAGE_VIEWS, VALUE, THRUPLAY, DERIVED_EVENTS, APP_INSTALLS_AND_OFFSITE_CONVERSIONS, CONVERSATIONS, IN_APP_VALUE, MESSAGING_PURCHASE_CONVERSION, MESSAGING_DEEP_CONVERSATION_AND_FOLLOW, SUBSCRIBERS, REMINDERS_SET, MEANINGFUL_CALL_ATTEMPT, PROFILE_VISIT, PROFILE_AND_PAGE_ENGAGEMENT, ADVERTISER_SILOED_VALUE, AUTOMATIC_OBJECTIVE, MESSAGING_APPOINTMENT_CONVERSION}* | What the ad set is optimizing for. <br>`APP_INSTALLS`: Will optimize for people more likely to install your app.<br>`ENGAGED_USERS`: Will optimize for people more likely to take a particular action in your app.<br>`EVENT_RESPONSES`: Will optimize for people more likely to attend your event.<br>`IMPRESSIONS`: Will show the ads as many times as possible.<br>`LEAD_GENERATION`: Will optimize for people more likely to fill out a lead generation form.<br>`LINK_CLICKS`: Will optimize for people more likely to click in the link of the ad.<br>`OFFER_CLAIMS`: Will optimize for people more likely to claim the offer.<br>`OFFSITE_CONVERSIONS`: Will optimize for people more likely to make a conversion in the site<br>`PAGE_ENGAGEMENT`: Will optimize for people more likely to engage with your page.<br>`PAGE_LIKES`: Will optimize for people more likely to like your page.<br>`POST_ENGAGEMENT`: Will optimize for people more likely to engage with your post.<br>`REACH`: Optimize to reach the most unique users of each day or interval specified in `frequency_control_specs`.<br>`SOCIAL_IMPRESSIONS`: Increase the number of impressions with social context. For example, with the names of one or more of the user's friends attached to the ad who have already liked the page or installed the app.<br>`VALUE`: Will optimize for maximum total purchase value within the specified attribution window.<br>`THRUPLAY`: Will optimize delivery of your ads to people are more likely to play your ad to completion, or play it for at least 15 seconds.<br>`AD_RECALL_LIFT`: Optimize for people more likely to remember seeing your ads.<br>`VISIT_INSTAGRAM_PROFILE`: Optimize for visits to the advertiser's instagram profile.<br> |
| `optimization_sub_event`<br><br>*enum{NONE, VIDEO_SOUND_ON, TRIP_CONSIDERATION, TRAVEL_INTENT, TRAVEL_INTENT_NO_DESTINATION_INTENT, TRAVEL_INTENT_BUCKET_01, TRAVEL_INTENT_BUCKET_02, TRAVEL_INTENT_BUCKET_03, TRAVEL_INTENT_BUCKET_04, TRAVEL_INTENT_BUCKET_05, POST_INTERACTION}* | Optimization sub event for a specific optimization goal (ex: Sound-On event for Video-View-2s optimization goal)<br> |
| `pacing_type`<br><br>*list<string>* | Defines the pacing type, standard by default or using [ad scheduling](https://developers.facebook.com/docs/marketing-api/adset/pacing)<br> |
| `promoted_object`<br><br>*Object* | The object this ad set is promoting across all its ads.<br>Required with certain campaign objectives.<br><br>**CONVERSIONS**<br>• `pixel_id` (Conversion pixel ID)<br>• `pixel_id` (Facebook pixel ID) and `custom_event_type`<br>• `pixel_id` (Facebook pixel ID) and `pixel_rule` and `custom_event_type`<br>• `event_id` (Facebook event ID) and `custom_event_type`<br>• `application_id`, `object_store_url`, and `custom_event_type` for<br>mobile app events<br>• `offline_conversion_data_set_id` (Offline dataset ID) and<br>`custom_event_type` for offline conversions<br><br>**PAGE_LIKES**<br>• `page_id`<br><br>**OFFER_CLAIMS**<br>• `page_id`<br><br>**LINK_CLICKS**<br>• `application_id` and `object_store_url` for mobile app or Canvas app engagement link clicks<br><br>**APP_INSTALLS**<br>• `application_id` and `object_store_url`<br><br>**if the `optimization_goal` is `OFFSITE_CONVERSIONS`**<br>• `application_id`, `object_store_url`, and `custom_event_type` (Standard Events)<br>• `application_id`, `object_store_url`, `custom_event_type = OTHER` and `custom_event_str` (Custom Events)<br><br>**PRODUCT_CATALOG_SALES**<br>• `product_set_id`<br>• `product_set_id` and `custom_event_type`<br><br>When `optimization_goal` is `LEAD_GENERATION`, `page_id` needs to be passed as promoted_object.<br><br>Please refer to the [Outcome-Driven Ads Experiences mapping table](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group#odax-mapping) to find new objectives and their corresponding destination types, optimization goals and promoted objects.<br><br>`application_id` *int*<br>The ID of a Facebook Application. Usually related to mobile or canvas games being promoted on Facebook for installs or engagement<br><br><br>`pixel_id` *numeric string or integer*<br>The ID of a Facebook conversion pixel.  Used with offsite conversion campaigns.<br><br><br>`custom_event_type` *enum{AD_IMPRESSION, RATE, TUTORIAL_COMPLETION, CONTACT, CUSTOMIZE_PRODUCT, DONATE, FIND_LOCATION, SCHEDULE, START_TRIAL, SUBMIT_APPLICATION, SUBSCRIBE, ADD_TO_CART, ADD_TO_WISHLIST, INITIATED_CHECKOUT, ADD_PAYMENT_INFO, PURCHASE, LEAD, COMPLETE_REGISTRATION, CONTENT_VIEW, SEARCH, SERVICE_BOOKING_REQUEST, MESSAGING_CONVERSATION_STARTED_7D, LEVEL_ACHIEVED, ACHIEVEMENT_UNLOCKED, SPENT_CREDITS, LISTING_INTERACTION, D2_RETENTION, D7_RETENTION, OTHER}*<br>The event from an App Event of a mobile app,<br>not in the standard event list.<br><br><br>`object_store_url` *URL*<br>The uri of the mobile / digital store where an application can be bought / downloaded. This is platform specific. When combined with the "application_id" this uniquely specifies an object which can be the subject of a Facebook advertising campaign.<br><br><br>`object_store_urls` *list<URL>*<br>The vec of uri of the mobile / digital store where an application can be bought / downloaded. This is platform specific. When combined with the "application_id" this uniquely specifies an object which can be the subject of a Facebook advertising campaign.<br><br><br>`offer_id` *numeric string or integer*<br>The ID of an Offer from a Facebook Page.<br><br><br>`page_id` *Page ID*<br>The ID of a Facebook Page<br><br><br>`product_catalog_id` *numeric string or integer*<br>The ID of a Product Catalog. Used with<br>[Dynamic Product Ads](https://developers.facebook.com/docs/marketing-api/dynamic-product-ads).<br><br><br>`product_item_id` *numeric string or integer*<br>The ID of the product item.<br><br><br>`job_listing_id` *numeric string or integer*<br>The ID of the marketplace job listing.<br><br><br>`instagram_profile_id` *numeric string or integer*<br>The ID of the instagram profile id.<br><br><br>`product_set_id` *numeric string or integer*<br>The ID of a Product Set within an Ad Set level Product<br>Catalog. Used with<br>[Dynamic Product Ads](https://developers.facebook.com/docs/marketing-api/dynamic-product-ads).<br><br><br>`event_id` *numeric string or integer*<br>The ID of a Facebook Event<br><br><br>`offline_conversion_data_set_id` *numeric string or integer*<br>The ID of the offline dataset.<br><br><br>`fundraiser_campaign_id` *numeric string or integer*<br>The ID of the fundraiser campaign.<br><br><br>`custom_event_str` *string*<br>The event from an App Event of a mobile app,<br>not in the standard event list.<br><br><br>`mcme_conversion_id` *numeric string or integer*<br>The ID of a MCME conversion.<br><br><br>`conversion_goal_id` *numeric string or integer*<br>The ID of a Conversion Goal.<br><br><br>`offsite_conversion_event_id` *numeric string or integer*<br>The ID of a Offsite Conversion Event<br><br><br>`boosted_product_set_id` *numeric string or integer*<br>The ID of the Boosted Product Set within an Ad Set level Product<br>Catalog. Should only be present when the advertiser has<br>opted into Product Set Boosting.<br><br><br>`lead_ads_form_event_source_type` *enum{inferred, meta_source, offsite_crm, offsite_web, onsite_crm, onsite_crm_single_event, onsite_clo_dep_aet, onsite_web, onsite_p2b_call, onsite_messaging, qualified_lead_file}*<br>The event source of lead ads form.<br><br><br>`lead_ads_custom_event_type` *enum{AD_IMPRESSION, RATE, TUTORIAL_COMPLETION, CONTACT, CUSTOMIZE_PRODUCT, DONATE, FIND_LOCATION, SCHEDULE, START_TRIAL, SUBMIT_APPLICATION, SUBSCRIBE, ADD_TO_CART, ADD_TO_WISHLIST, INITIATED_CHECKOUT, ADD_PAYMENT_INFO, PURCHASE, LEAD, COMPLETE_REGISTRATION, CONTENT_VIEW, SEARCH, SERVICE_BOOKING_REQUEST, MESSAGING_CONVERSATION_STARTED_7D, LEVEL_ACHIEVED, ACHIEVEMENT_UNLOCKED, SPENT_CREDITS, LISTING_INTERACTION, D2_RETENTION, D7_RETENTION, OTHER}*<br>The event from an App Event of a mobile app,<br>not in the standard event list.<br><br><br>`lead_ads_custom_event_str` *string*<br>The event from an App Event of a mobile app,<br>not in the standard event list.<br><br><br>`lead_ads_offsite_conversion_type` *enum{default, clo}*<br>The offsite conversion type for lead ads<br><br><br>`value_semantic_type` *enum {VALUE, MARGIN, LIFETIME_VALUE}*<br>The semantic of the event value to be using for optimization<br><br><br>`variation` *enum {OMNI_CHANNEL_SHOP_AUTOMATIC_DATA_COLLECTION, PRODUCT_SET_AND_APP, PRODUCT_SET_AND_IN_STORE, PRODUCT_SET_AND_OMNICHANNEL, PRODUCT_SET_AND_PHONE_CALL, PRODUCT_SET_AND_WEBSITE, PRODUCT_SET_AND_WEBSITE_AND_PHONE_CALL, PRODUCT_SET_WEBSITE_APP_AND_INSTORE}*<br>Variation of the promoted object for a PCA ad<br><br><br>`passback_pixel_id` *numeric string or integer*<br>ID of the pixel used for tracking passback events<br><br><br>`passback_application_id` *numeric string or integer*<br>ID of the application used for tracking passback events<br><br><br>`product_set_optimization` *enum{enabled, disabled}*<br>Enum defining whether or not the ad should be optimized for the promoted product set<br><br><br>`full_funnel_objective` *enum{OFFER_CLAIMS, PAGE_LIKES, EVENT_RESPONSES, POST_ENGAGEMENT, WEBSITE_CONVERSIONS, LINK_CLICKS, VIDEO_VIEWS, LOCAL_AWARENESS, PRODUCT_CATALOG_SALES, LEAD_GENERATION, BRAND_AWARENESS, STORE_VISITS, REACH, APP_INSTALLS, MESSAGES, OUTCOME_AWARENESS, OUTCOME_ENGAGEMENT, OUTCOME_LEADS, OUTCOME_SALES, OUTCOME_TRAFFIC, OUTCOME_APP_PROMOTION}*<br>Enum defining the full funnel objective of the campaign<br><br><br>`dataset_split_id` *numeric string or integer*<br>ID of the dataset split used to perform additional optimization on the dataset<br><br><br>`dataset_split_ids` *array<numeric string>*<br>IDs of the dataset splits used to perform additional optimization on the dataset<br><br><br>`lead_ads_selected_pixel_id` *numeric string or integer*<br>The selected pixel id for lead ads conversion leads optimization<br><br><br>`custom_attribution_source_ids` *array<numeric string>*<br>IDs of the custom attribution sources used for tracking passback events<br><br><br>`multi_event_product` *int64*<br>Identifies which action-to-action product the advertiser is using<br><br><br>`product_sales_channel` *enum {ONLINE, IN_STORE, OMNI}*<br>ProductSalesChannel of the promoted object for Omni L3 DA SBLI ads<br><br><br>`anchor_event_config` *JSON object*<br>Configuration for anchor event in multi-event optimization campaigns<br><br><br>`multi_event_conversion_info` *JSON object*<br>Configuration for multi-event conversion info in CLO campaigns<br><br><br>`live_video_destination` *string*<br>The live video destination type for live video ads<br><br><br>`smart_pse_enabled` *boolean*<br>Whether Smart Product Set Expansion is enabled for this campaign.<br><br><br>`smart_pse_setting` *enum{ENABLED, DISABLED}*<br>Setting for Smart Product Set Expansion. Uses an enum instead of a boolean to avoid TAO null handling issues.<br><br><br>`lead_ads_follow_up_event` *enum{whatsapp_conversations}*<br>The selected lead follow-up event for lead ads campaigns.<br><br><br>`omnichannel_object` *Object*<br><br>`app` *array<JSON object>*<br><br>`pixel` *array<JSON object>*<br>**[required]**<br><br><br>`onsite` *array<JSON object>*<br><br>`whats_app_business_phone_number_id` *numeric string or integer*<br><br>`whatsapp_phone_number` *string* |
| `relative_value`<br><br>*float* | relative_value<br> |
| `rf_prediction_id`<br><br>*numeric string or integer* | Reach and frequency prediction ID<br> |
| `source_adset_id`<br><br>*numeric string or integer* | The source adset id that this ad is copied from (if applicable).<br> |
| `start_time`<br><br>*datetime* | The start time of the set, e.g. `2015-03-12 23:59:59-07:00` or `2015-03-12 23:59:59 PDT`. UTC UNIX timestamp<br> |
| `status`<br><br>*enum{ACTIVE, PAUSED, DELETED, ARCHIVED}* | Only `ACTIVE` and `PAUSED` are valid for creation. The other statuses<br>can be used for update. If it is set to `PAUSED`, all its active ads<br>will be paused and have an effective status `ADSET_PAUSED`.<br> |
| `targeting`<br><br>*Targeting object* | An ad set's targeting structure.  "countries" is required. See [targeting](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/advanced-targeting).<br> |
| `time_based_ad_rotation_id_blocks`<br><br>*list<list<int64>>* | Specify ad creative that displays at custom date ranges in a campaign<br>as an array. A list of Adgroup IDs. The list of ads to display for each<br>time range in a given schedule. For example display first ad in Adgroup<br>for first date range, second ad for second date range, and so on. You<br>can display more than one ad per date range by providing more than<br>one ad ID per array. For example set<br>`time_based_ad_rotation_id_blocks` to [[1], [2, 3], [1, 4]]. On the<br>first date range show ad 1, on the second date range show ad 2 and ad 3<br>and on the last date range show ad 1 and ad 4. Use with<br>`time_based_ad_rotation_intervals` to specify date ranges.<br> |
| `time_based_ad_rotation_intervals`<br><br>*list<int64>* | Date range when specific ad creative displays during a campaign.<br>Provide date ranges in an array of UNIX timestamps where each<br>timestamp represents the start time for each date range. For example a<br>3-day campaign from May 9 12am to  May 11 11:59PM PST can have three<br>date ranges, the first date range starts from May 9 12:00AM to<br>May 9 11:59PM, second date range starts from May 10 12:00AM to<br>May 10 11:59PM and last starts from  May 11 12:00AM to  May 11 11:59PM.<br>The first timestamp should match the campaign start time. The last<br>timestamp should be at least 1 hour before the campaign end time. You<br>must provide at least two date ranges. All date ranges must cover the<br>whole campaign length, so any date range cannot exceed campaign length.<br>Use with `time_based_ad_rotation_id_blocks` to specify ad creative for<br>each date range.<br> |
| `time_start`<br><br>*datetime* | Time start<br> |
| `time_stop`<br><br>*datetime* | Time stop<br> |
| `tune_for_category`<br><br>*enum{NONE, EMPLOYMENT, HOUSING, CREDIT, ISSUES_ELECTIONS_POLITICS, ONLINE_GAMBLING_AND_GAMING, FINANCIAL_PRODUCTS_SERVICES}* | tune_for_category<br> |
| `value_rule_set_id`<br><br>*numeric string or integer* | Value Rule Set ID<br> |
| `value_rules_applied`<br><br>*boolean* | value_rules_applied<br> |

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
| 2635 | You are calling a deprecated version of the Ads API. Please update to the latest version. |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |
| 2695 | The ad set creation reached its campaign group(ios14) limit. |
| 80004 | There have been too many calls to this ad-account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting#ads-management. |
| 2641 | Your ad includes or excludes locations that are currently restricted |
| 190 | Invalid OAuth 2.0 Access Token |
| 900 | No such application exists. |

## Updating

You can't perform this operation on this endpoint.

## Deleting

This operation has been deprecated with [Marketing API V8](https://developers.facebook.com/docs/graph-api/changelog/version8.0#ad-accounts).

You can't perform this operation on this endpoint.

