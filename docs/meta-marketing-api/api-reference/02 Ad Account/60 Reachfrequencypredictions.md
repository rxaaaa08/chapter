<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/reachfrequencypredictions | Saved: 2026-09-19 -->

# Ad Account Reach and Frequency Prediction



**Warning:** Beginning with v23.0, the `instagram_destination_id` field will return the `ig_user_id` rather than the `instagram_actor_id`. The `instagram_actor_id` is also no longer supported in the `destination_ids` parameter; update your API calls to use the `ig_user_id` instead.

## Reading

Reach frequency predictions for the ad account.

#### Example

### HTTP
```
GET /v25.0/{ad-account-id}/reachfrequencypredictions HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{ad-account-id}/reachfrequencypredictions',
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
    "/{ad-account-id}/reachfrequencypredictions",
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
    "/{ad-account-id}/reachfrequencypredictions",
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
                               initWithGraphPath:@"/{ad-account-id}/reachfrequencypredictions"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bad-account-id%7D%2Freachfrequencypredictions&version=v25.0)

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

A list of [ReachFrequencyPrediction](https://developers.facebook.com/docs/marketing-api/reference/reach-frequency-prediction) nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |

## Creating

### /act_{ad_account_id}/reachfrequencypredictions
You can make a POST request to *reachfrequencypredictions* edge from the following paths:

- [/act_{ad_account_id}/reachfrequencypredictions](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/reachfrequencypredictions)

When posting to this edge, a [ReachFrequencyPrediction](https://developers.facebook.com/docs/marketing-api/reference/reach-frequency-prediction) will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `budget`<br><br>*int64* | Expected lifetime budget in cents in the currency for the ad account. Must be greater than the default budget limit.<br> |
| `campaign_group_id`<br><br>*numeric string or integer* | The ID of the campaign which this prediction belongs to.<br> |
| `day_parting_schedule`<br><br>*list<Object>* | Ad set schedule, representing a delivery schedule for a single day<br><br>Example:<br>`[{"start_minute":360,"end_minute":1440,"days":[0,1,2,3,4,5,6]}]`<br><br> The day part should be same for all week days. There needs to be at least 3 hours of delivery each day.<br><br><br>`start_minute` *int64*<br>A 0 based minute of the day representing when the schedule starts<br><br>**[required]**<br><br><br>`end_minute` *int64*<br>A 0 based minute of the day representing when the schedule ends<br><br>**[required]**<br><br><br>`days` *list<int64>*<br>Array of ints representing which days the schedule is active. Valid values are 0-6 with 0 representing Sunday, 1 representing Monday, ... and 6 representing Saturday.<br><br>**[required]**<br><br><br>`timezone_type` *enum {USER, ADVERTISER}*<br><br>**Default value: **`USER` |
| `deal_id`<br><br>*numeric string or integer* | The ID of the deal which this prediction belongs to.<br> |
| `destination_id`<br><br>*int64* | The ID of the Page or the ID of the app which the ad promotes.<br><br><br>Using the correct advertiser Page or app ID makes your predictions more accurate. Reach and cost predictions for feed are specific to a given ID. They take into account other ads running from the same Page, as well as the past creative quality of ads from the Page, which impacts cost.<br><br><br>If the ad set has `desktopfeed` or `mobilefeed` placement, specify `destination_id` or pass app or Page ID in `destination_ids` field. We recommend using  `destination_ids`.<br> |
| `destination_ids`<br><br>*list<numeric string or integer>* | Array of ID's of the Facebook Page or App which the ad promotes. Also include the Instagram account ID if `instagramstream` placement is used.<br><br><br>If the `objective` is `MOBILE_APP_INSTALLS`, provide only the app ID. In this case, do not provide Instagram account ID, even with `instagramstream` placement.<br> |
| `end_time`<br><br>*int64* | Same as `stop_time`.<br> |
| `frequency_cap`<br><br>*int64* | If `interval_frequency_cap_reset_period` is specified, this field represents the frequency cap to be set for a custom period. For example: show ad 3 times per user every 48 hours.<br><br><br>However when you read the values back, this represents the lifetime frequency cap for the campaign duration. A separate read-only field called `interval_frequency_cap` provides the frequency cap value originally set for the custom period.<br><br><br>If `interval_frequency_cap_reset_period` is not specified, this field represents the lifetime frequency cap set for the campaign duration.<br><br><br>Target Frequency equivalent is `target_frequency`. You must also set `is_balanced_frequency` to `true`.<br> |
| `instream_packages`<br><br>*array<enum {NORMAL, PREMIUM, SPORTS, ENTERTAINMENT, BEAUTY, FOOD, SPANISH, REGULAR_ANIMALS_PETS, REGULAR_FOOD, REGULAR_GAMES, REGULAR_POLITICS, REGULAR_SPORTS, REGULAR_STYLE, REGULAR_TV_MOVIES}>* | Instream package of the campaign. Reserve buying campaigns and self-serve contextual package campaigns need to set the targeting packages here. Those campaigns will only deliver to pages included in the targeting packages<br> |
| `interval_frequency_cap_reset_period`<br><br>*int64* | Custom period to reset frequency cap. In hours. Expressed as multiples of 24.<br><br><br>For example, to show ad no more than 3 times every 48 hours, reset period should be set to 48 (hours) and `frequency_cap` should be set to 3. Implemented using a rolling window.<br><br><br>Target Frequency equivalent is `target_frequency_reset_period.` You must also set `is_balanced_frequency` to `true`.<br> |
| `num_curve_points`<br><br>*int64* | **Default value: **`400`<br>How many grid points to return from the curve.<br>If the value is not specified, the default value (800) is used. <br>If the value is larger than 800 then 800 will be used.<br> |
| `objective`<br><br>*string* | **Default value: **`REACH`<br>Objective of your reach and frequency campaign. Facebook uses this to create an optimized bid based on your objective. This does not modify you objective set at the ad campaign level. Of all possible ad objectives, you can only use these values in Facebook Reach and Frequency campaigns: `BRAND_AWARENESS`, `LINK_CLICKS`, `POST_ENGAGEMENT`, `MOBILE_APP_INSTALLS`, `WEBSITE_CONVERSIONS`, `REACH`, and `VIDEO_VIEWS`.<br> |
| `optimization_goal`<br><br>*string* | optimization_goal<br> |
| `prediction_mode`<br><br>*int64* | Set `0` to create a prediction of budget based on expected reach. `reach` value must be provided. <br> <br>  Set `1` to create a prediction of reach based on expected budget. `budget` value must be provided.<br> |
| `reach`<br><br>*int64* | The desired reach of the set, must be at least the minimum reach for the target country. This number is 1,000,000, in most cases.<br> |
| `rf_prediction_id_to_share`<br><br>*numeric string or integer* | ID of a previously created prediction. The new prediction will also use the audience from the given prediction.<br> |
| `start_time`<br><br>*int64* | Unix timestamp for the set start time.<br> |
| `stop_time`<br><br>*int64* | Unix timestamp for the set stop time. Must be no greater than 8 weeks ahead of the current time. It should end after 6AM on the last day, in the ad account's timezone.<br> |
| `story_event_type`<br><br>*int64* | Whether or not to include mobile devices that cannot display different ad formats: <br>- Use `256`, to run canvas ads<br>- Use `128` to run video ads<br>- Use `0` if you do not include video or canvas ads<br>- Use `384` (256 + 128), to include both canvas and video.<br><br><br>You cannot create video ads if you set this flag to `0` during prediction. You can create non-video ads if the flag is set to `128`. This field is required if you target all mobile devices.<br><br>You cannot create canvas ads if this flag is set to `0` during prediction. However, you can create non-canvas ads even the flag is set to `256`.<br> |
| `target_spec`<br><br>*Targeting object* | [Targeting spec](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/advanced-targeting) for reach and frequency prediction. The length of JSON serialized API targeting spec should not exceed 65000  characters after internal reformatting.<br><br><br>You cannot:<br><br>- Use `rightcolumn` together with any feed for placement. <br><br>- Specify more than one country.<br><br>- Provide minimal iOS version for `user_os`.<br><br><br>Website Custom Audiences and `friends_of_connection` are not supported.<br> |
| `trending_topics_spec`<br><br>*JSON object* | Describe your Reels Trending Ads configuration.<br><br><br>`is_all_trending` *boolean*<br><br>**Default value: **`false`<br>is_all_trending<br><br><br>`is_special_budget_alloc` *boolean*<br><br>**Default value: **`false`<br>is_special_budget_alloc<br><br><br>`trending_topics` *array<enum {TRENDING_ALL, TRENDING_FASHION, TRENDING_BEAUTY, TRENDING_SPORTS, TRENDING_FOOD, TRENDING_CARS, TRENDING_BEAUTY_FASHION, TRENDING_FITNESS, TRENDING_MOVIES, TRENDING_PETS_ANIMALS, TRENDING_VIDEO_GAMING, TRENDING_ALL_VERIFIED, TRENDING_MUSIC, TRENDING_SUPERBOWL, TRENDING_NBC_WINTER_OLYMPICS, TRENDING_BASKETBALL, TRENDING_TRAVEL, TRENDING_BUSINESS_FINANCE, TRENDING_BASKETBALL_NBA_PLAYOFFS, TRENDING_DISNEY_WOMENS_MARCH_MADNESS_2026, TRENDING_DISNEY_SPORTS, TRENDING_VANITY_FAIR_OSCARS_2026, TRENDING_VANITY_FAIR_ALL, TRENDING_SOCCER, TRENDING_ELECTRONICS_TECHNOLOGY, TRENDING_HEALTH_WELLNESS, TRENDING_DISNEY_NBA_2026, TRENDING_VOGUE_METGALA_2026, TRENDING_CONDE_METGALA_2026, TRENDING_CONDE_ALL, POE_SPORTS}>*<br><br>**Default value: **`[]`<br>trending_topics<br> |

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
| 100 | Invalid parameter |
| 2625 | The request for a reach frequency campaign is invalid. |
| 613 | Calls to this api have exceeded the rate limit. |
| 80004 | There have been too many calls to this ad-account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting#ads-management. |
| 2641 | Your ad includes or excludes locations that are currently restricted |
| 190 | Invalid OAuth 2.0 Access Token |

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

