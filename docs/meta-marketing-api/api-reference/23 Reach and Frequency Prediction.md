<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/reach-frequency-prediction | Saved: 2026-09-19 | Converted from the web page: Meta's "View as Markdown" export returns an error for this page -->

# Reach and Frequency Prediction

Ads in WhatsApp Status are available via the Marketing API. [Learn more about ads in WhatsApp Status.](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-in-whatsapp-status)

Beginning with v23.0, the `instagram_destination_id` field will return the `ig_user_id` rather than the `instagram_actor_id`. The `instagram_actor_id` is also no longer supported in the `destination_ids` parameter; update your API calls to use the `ig_user_id` instead.

 For reach and frequency ads buying, see [Reach and Frequency](https://developers.facebook.com/docs/marketing-api/reachandfrequency).

 Please note that the Target Frequency equivalents of `frequency_cap` and `interval_frequency_cap_reset_period` are: `target_frequency` and `target_frequency_reset_period`. In addition to these two settings, you must also set `is_balanced_frequency` to `true.`

## Reading

You can reach all Reach Frequency Prediction objects from one ad account, or reach a Reach Frequency Prediction object from a Reach Frequency Prediction ID. Specify the fields you wish to retrieve. Only the `id` is returned by default.

### Limitations

`stop_time` must be no greater than 8 weeks ahead of the current time and should end after 6AM on the last day in ad account time zone

### Examples

 To read a `reachfrequencyprediction` object based on the `reachfrequencyprediction` ID, make an HTTP GET call to

```
https://graph.facebook.com/<API_VERSION>/<RF_PREDICTION_ID>

```

 To read all predictions of an ad account, make an HTTP GET call to

```
https://graph.facebook.com/<API_VERSION>/act_<AD_ACCOUNT_ID>/reachfrequencypredictions

```

 You can retrieve `frequency_distribution_map_agg` which is similar to `frequency_distribution_map`. It contains a list of key-value pairs where each key is a predictable number of people reached by your ad. Each value is a list of 10 numbers, each representing the number of people reached greater than or equal to 1 time, 2 times and so on. The last number represents the number of people reached greater than or equal to 10 times.

 We calculate it from `frequency_distribution_map`. For example, when the key is `300000`, and the corresponding value in `frequency_distribution_map` is `[0.4, 0.3, 0.2, 0.1]`, then the corresponding value in `frequency_distribution_map_agg` is:

`[300000, 180000, 90000, 30000, 0, 0, 0, 0, 0, 0]`

 Where:

`300000 = 300000 * (0.4 + 0.3 + 0.2 + 0.1)`
`180000 = 300000 * (0.3 + 0.2 + 0.1)`
`90000 = 300000 * (0.2 + 0.1)`
`30000 = 300000 * 0.1`
`0 = 300000 * 0`

 A sample results looks like this:

```
[
{
"key": 1709356,
"value": [1709356, 228277, 0, 0, 0, 0, 0, 0, 0, 0]
},
{
"key": 2895340,
"value": [2895340, 364337, 0, 0, 0, 0, 0, 0, 0, 0]
},
{
"key": 4813219,
"value": [4813219, 578598, 0, 0, 0, 0, 0, 0, 0, 0]
},
{
"key": 7100208,
"value": [7100208, 909735, 0, 0, 0, 0, 0, 0, 0, 0]
},
{
"key": 9297083,
"value": [9297083, 1310776, 0, 0, 0, 0, 0, 0, 0, 0]
},
{
"key": 11789412,
"value": [11789412, 1908920, 0, 0, 0, 0, 0, 0, 0, 0]
},
{
"key": 16689431,
"value": [16689431, 3541420, 0, 0, 0, 0, 0, 0, 0, 0]
},
{
"key": 22604943,
"value": [22604943, 6147670, 0, 0, 0, 0, 0, 0, 0, 0]
},
{
"key": 28290359,
"value": [28290359, 9590814, 0, 0, 0, 0, 0, 0, 0, 0]
},
{
"key": 33925018,
"value": [33925018, 13974507, 0, 0, 0, 0, 0, 0, 0, 0]
},
{
"key": 39074602,
"value": [39074602, 18678920, 0, 0, 0, 0, 0, 0, 0, 0]
},
{
"key": 45360719,
"value": [45360719, 24821231, 0, 0, 0, 0, 0, 0, 0, 0]
},
{
"key": 49071193,
"value": [49071193, 28509962, 0, 0, 0, 0, 0, 0, 0, 0]
},
{
"key": 51717935,
"value": [51717935, 31289564, 0, 0, 0, 0, 0, 0, 0, 0]
},
{
"key": 53691761,
"value": [53691761, 33453257, 0, 0, 0, 0, 0, 0, 0, 0]
},
{
"key": 55213522,
"value": [55213522, 35167178, 0, 0, 0, 0, 0, 0, 0, 0]
},
{
"key": 57123528,
"value": [57123528, 37726279, 0, 0, 0, 0, 0, 0, 0, 0]
}
]

```

#### Parameters

 This endpoint doesn't have any parameters.

#### Fields

| Field | Description |
| --- | --- |
| `id`<br>*numeric string* | The ID of this reach frequency prediction <br>default |
| `account_id`<br>*integer* | The ID of the Ad Account this reach frequency prediction belongs to |
| `audience_size_lower_bound`<br>*unsigned integer* | audience_size_lower_bound |
| `audience_size_upper_bound`<br>*unsigned integer* | audience_size_upper_bound |
| `campaign_group_id`<br>*integer* | The id of the campaign which this prediction belongs to |
| `campaign_id`<br>*numeric string* | The ID of the ad set to which this reach frequency prediction is assigned |
| `campaign_time_start`<br>*datetime* | Unix timestamp of the ad set start time |
| `campaign_time_stop`<br>*datetime* | Unix timestamp of the ad set stop time |
| `curve_budget_reach`<br>*ReachFrequencyEstimatesCurve* | The curve for budget and reach. It is a string in JSON format representing a JSON object with these fields. <br>`num_points`: the number of data points within the object. <br>`reach`: Data contained at corresponding indices of each array form a single data point. The "reach" values are presented in ascending order with the final value containing the maximum available reach. In video view buying, this is the number of unique users with views`raw_reach`: Data contained at corresponding indices of each array form a single data point. In video view buying, reach representsunique view throughs and raw_reach represents unique views<br>`budget`: Data contained at corresponding indices of each array form a single data point. Cent of accounts currency. <br>`impression`: Data contained at corresponding indices of each array form a single data point. In video view buying, this is the number of view throughs (aka impression by conversion)`interpolated_reach`: Interpolated reach which is the original.value of reach without truncation`raw_impression`: Data contained at corresponding indices of each array form a single data point. In video view buying,impressions represents view throughs and raw_impressions representstotal number of views |
| `daily_impression_curve`<br>*list<float>* | Daily Impression field represents a vector of predicted daily impressions for every single day. Measured from midnight to midnight in the advertiser timezone during the campaign duration. |
| `destination_id`<br>*id* | The ID of the Page or the ID of the app which the ad promotes. |
| `expiration_time`<br>*datetime* | Unix timestamp of the expiration time of prediction, if applicable |
| `external_budget`<br>*integer* | Predicted budget in cents for the ad set, relevant if prediction mode is 0 |
| `external_impression`<br>*unsigned int32* | Predicted impressions for the ad set |
| `external_maximum_budget`<br>*integer* | Maximum budget given the target, in cents |
| `external_maximum_impression`<br>*impressions* | Maximum number of impressions given the target |
| `external_maximum_reach`<br>*unsigned int32* | Maximum reach given the target |
| `external_minimum_budget`<br>*integer* | Minimum budget given the target, in cents |
| `external_minimum_impression`<br>*unsigned int32* | Minimum impressions given the target |
| `external_minimum_reach`<br>*unsigned int32* | Minimum reach given the target |
| `external_reach`<br>*unsigned int32* | Predicted reach for the ad set, relevant if prediction mode is 1 |
| `frequency_cap`<br>*unsigned int32* | If `interval_frequency_cap_reset_period` is specified, this field represents the frequency cap to be set for a custom period. For example: show ad 3 times per user every 48 hours. However when you read the values back, this represents the lifetime frequency cap for the campaign duration. A separate read-only field called `interval_frequency_cap` provides the frequency cap value originally set for the custom period. If `interval_frequency_cap_reset_period` is not specified, this field represents the lifetime frequency cap set for the campaign duration. Target Frequency equivalent is `target_frequency`. You must also set `is_balanced_frequency` to `true.` |
| `frequency_distribution_map`<br>*list<KeyValue:unsigned int32,list<float>>* | A list of key-value pairs. Each key is a predicted number of people reached by your ad and each value is a frequency_distribution associated with that reach. |
| `frequency_distribution_map_agg`<br>*list<KeyValue:unsigned integer,list<unsigned integer>>* | A list of key-value pairs. Each key is a predicted number of people reached by your ad and each value is a list of 10 numbers associated with that reach. The first number represents the number of people reached which is greater than or equal to 1 time, 2 times and so on. The last number represents the number of people reached which is greater than or equal to 10 times. |
| `grp_dmas_audience_size`<br>*float* | GRP: Audience size within DMAs based on Nielsen definition |
| `holdout_percentage`<br>*unsigned int32* | Percent of users in holdout |
| `instagram_destination_id`<br>*id* | The Instagram account id if `instagramstream` placement is used, except in the case of Mobile App Installs ads. |
| `interval_frequency_cap`<br>*unsigned int32* | Interval frequency cap which is set for a custom period |
| `interval_frequency_cap_reset_period`<br>*unsigned int32* | Target Frequency equivalent is `target_frequency_period.` You must also set `is_balanced_frequency` to `true.` |
| `is_io`<br>*bool* | Flag to indicate whether prediction is tied to an IO |
| `name`<br>*string* | Prediction name. |
| `pause_periods`<br>*list<(struct with keys: pauseStartDay, startTimeOffset, pauseEndDay, endTimeOffset) or (null)>* | A list of time periods the associated campaign has been paused. |
| `placement_breakdown`<br>*ReachFrequencyEstimatesPlacementBreakdown* | Predicted impression distribution on different placements, including: <br>`msite`: Facebook mobile sites <br>`android`: Facebook android <br>`ios`: Facebook ios <br>`desktop`: Facebook desktop Feed and right hand column <br>`ig_android`: Instagram android <br>`ig_ios`: Instagram iOS <br>`ig_reels`: Instagram Reels <br>`ig_story`: Instagram Stories <br>`explore_home`: Instagram Explore home <br>`ig_others`: Other Instagram placements <br>`audience_network`: Audience network <br>`instant_articles`: Instant articles <br>`instream_videos`: In-stream videos <br>`suggested_videos`: Suggested videos |
| `prediction_mode`<br>*unsigned int32* | The prediction mode, <br>0 = given reach, predict budget, <br>1 = given budget, predict reach |
| `prediction_progress`<br>*unsigned int32* | Represents percentage value indicating the prediction progress (values 0-100). When 100 check status to indicate whether the prediction was successful. |
| `reservation_status`<br>*unsigned int32* | Reservation status. <br>0 = Cancelled prediction, <br>1 = Reserved prediction, <br>2 = Prediction has been attached to a campaign |
| `status`<br>*unsigned int32* | Represents the status of the prediction, refer to [Response Status](https://developers.facebook.com/docs/marketing-api/reachandfrequency#statuscodes) |
| `story_event_type`<br>*unsigned int32* | Used to indicated the prediction is for video ads or not. If it is for video, the prediction will not include devices that cannot play video |
| `target_spec`<br>*[Targeting](https://developers.facebook.com/docs/marketing-api/reference/targeting)* | A string in JSON format representing the [targeting specs](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/advanced-targeting) specified on creation. |
| `time_created`<br>*datetime* | The time when this reach frequency prediction was created |
| `time_updated`<br>*datetime* | Unix timestamp when the row is updated |

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |
| 80004 | There have been too many calls to this ad-account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting#ads-management. |
| 190 | Invalid OAuth 2.0 Access Token |

## Creating

### /act_{ad_account_id}/reachfrequencypredictions

 You can make a POST request to *reachfrequencypredictions* edge from the following paths:

* [/act_{ad_account_id}/reachfrequencypredictions](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/reachfrequencypredictions)

 When posting to this edge, a [ReachFrequencyPrediction](https://developers.facebook.com/docs/marketing-api/reference/reach-frequency-prediction) will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `budget`<br>*int64* | Expected lifetime budget in cents in the currency for the ad account. Must be greater than the default budget limit. |
| `campaign_group_id`<br>*numeric string or integer* | The ID of the campaign which this prediction belongs to. |
| `day_parting_schedule`<br>*list<Object>* | Ad set schedule, representing a delivery schedule for a single day<br><br>Example:<br>`[{"start_minute":360,"end_minute":1440,"days":[0,1,2,3,4,5,6]}]`<br><br> The day part should be same for all week days. There needs to be at least 3 hours of delivery each day.<br> --- `start_minute` *int64* A 0 based minute of the day representing when the schedule starts required`end_minute` *int64* A 0 based minute of the day representing when the schedule ends required`days` *list<int64>* Array of ints representing which days the schedule is active. Valid values are 0-6 with 0 representing Sunday, 1 representing Monday, ... and 6 representing Saturday. required`timezone_type` *enum {USER, ADVERTISER}*<br>**Default value: **`USER`Show child parameters |
| `deal_id`<br>*numeric string or integer* | The ID of the deal which this prediction belongs to. |
| `destination_id`<br>*int64* | The ID of the Page or the ID of the app which the ad promotes.<br><br> Using the correct advertiser Page or app ID makes your predictions more accurate. Reach and cost predictions for feed are specific to a given ID. They take into account other ads running from the same Page, as well as the past creative quality of ads from the Page, which impacts cost. <br><br> If the ad set has `desktopfeed` or `mobilefeed` placement, specify `destination_id` or pass app or Page ID in `destination_ids` field. We recommend using `destination_ids`. |
| `destination_ids`<br>*list<numeric string or integer>* | Array of ID's of the Facebook Page or App which the ad promotes. Also include the Instagram account ID if `instagramstream` placement is used. <br><br> If the `objective` is `MOBILE_APP_INSTALLS`, provide only the app ID. In this case, do not provide Instagram account ID, even with `instagramstream` placement. |
| `end_time`<br>*int64* | Same as `stop_time`. |
| `frequency_cap`<br>*int64* | If `interval_frequency_cap_reset_period` is specified, this field represents the frequency cap to be set for a custom period. For example: show ad 3 times per user every 48 hours. <br><br> However when you read the values back, this represents the lifetime frequency cap for the campaign duration. A separate read-only field called `interval_frequency_cap` provides the frequency cap value originally set for the custom period. <br><br> If `interval_frequency_cap_reset_period` is not specified, this field represents the lifetime frequency cap set for the campaign duration. Target Frequency equivalent is `target_frequency`. You must also set `is_balanced_frequency` to `true`. |
| `instream_packages`<br>*array<enum {NORMAL, PREMIUM, SPORTS, ENTERTAINMENT, BEAUTY, FOOD, SPANISH, REGULAR_ANIMALS_PETS, REGULAR_FOOD, REGULAR_GAMES, REGULAR_POLITICS, REGULAR_SPORTS, REGULAR_STYLE, REGULAR_TV_MOVIES}>* | Instream package of the campaign. Reserve buying campaigns and self-serve contextual package campaigns need to set the targeting packages here. Those campaigns will only deliver to pages included in the targeting packages |
| `interval_frequency_cap_reset_period`<br>*int64* | Custom period to reset frequency cap. In hours. Expressed as multiples of 24. <br><br> For example, to show ad no more than 3 times every 48 hours, reset period should be set to 48 (hours) and `frequency_cap` should be set to 3. Implemented using a rolling window. Target Frequency equivalent is `target_frequency_reset_period.` You must also set `is_balanced_frequency` to `true`. |
| `meta_moment_maker_spec`<br>*JSON object* | meta_moment_maker_spec |
| `num_curve_points`<br>*int64* | <br>**Default value: **`400` How many grid points to return from the curve.<br>If the value is not specified, the default value (800) is used. <br>If the value is larger than 800 then 800 will be used. |
| `objective`<br>*string* | <br>**Default value: **`REACH` Objective of your reach and frequency campaign. Facebook uses this to create an optimized bid based on your objective. This does not modify you objective set at the ad campaign level. Of all possible ad objectives, you can only use these values in Facebook Reach and Frequency campaigns: `BRAND_AWARENESS`, `LINK_CLICKS`, `POST_ENGAGEMENT`, `MOBILE_APP_INSTALLS`, `WEBSITE_CONVERSIONS`, `REACH`, and `VIDEO_VIEWS`. |
| `optimization_goal`<br>*string* | optimization_goal |
| `prediction_mode`<br>*int64* | Set `0` to create a prediction of budget based on expected reach. `reach` value must be provided. <br><br> Set `1` to create a prediction of reach based on expected budget. `budget` value must be provided. |
| `reach`<br>*int64* | The desired reach of the set, must be at least the minimum reach for the target country. This number is 1,000,000, in most cases. |
| `rf_prediction_id_to_share`<br>*numeric string or integer* | ID of a previously created prediction. The new prediction will also use the audience from the given prediction. |
| `start_time`<br>*int64* | Unix timestamp for the set start time. |
| `stop_time`<br>*int64* | Unix timestamp for the set stop time. Must be no greater than 8 weeks ahead of the current time. It should end after 6AM on the last day, in the ad account's timezone. |
| `story_event_type`<br>*int64* | Whether or not to include mobile devices that cannot display different ad formats: <br>- Use `256`, to run canvas ads<br>- Use `128` to run video ads<br>- Use `0` if you do not include video or canvas ads<br>- Use `384` (256 + 128), to include both canvas and video.<br><br> You cannot create video ads if you set this flag to `0` during prediction. You can create non-video ads if the flag is set to `128`. This field is required if you target all mobile devices.<br><br>You cannot create canvas ads if this flag is set to `0` during prediction. However, you can create non-canvas ads even the flag is set to `256`. |
| `target_spec`<br>*Targeting object* | [Targeting spec](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/advanced-targeting) for reach and frequency prediction. The length of JSON serialized API targeting spec should not exceed 65000 characters after internal reformatting. <br><br> You cannot:<br> - Use `rightcolumn` together with any feed for placement. <br> - Specify more than one country.<br> - Provide minimal iOS version for `user_os`.<br><br> Website Custom Audiences and `friends_of_connection` are not supported. |
| `trending_topics_spec`<br>*JSON object* | Describe your Reels Trending Ads configuration. --- `is_all_trending` *boolean*<br>**Default value: **`false` is_all_trending `is_special_budget_alloc` *boolean*<br>**Default value: **`false` is_special_budget_alloc `trending_topics` *array<enum {TRENDING_ALL, TRENDING_FASHION, TRENDING_BEAUTY, TRENDING_SPORTS, TRENDING_FOOD, TRENDING_CARS, TRENDING_BEAUTY_FASHION, TRENDING_FITNESS, TRENDING_MOVIES, TRENDING_PETS_ANIMALS, TRENDING_VIDEO_GAMING, TRENDING_ALL_VERIFIED, TRENDING_MUSIC, TRENDING_SUPERBOWL, TRENDING_NBC_WINTER_OLYMPICS, TRENDING_BASKETBALL, TRENDING_TRAVEL, TRENDING_BUSINESS_FINANCE, TRENDING_BASKETBALL_NBA_PLAYOFFS, TRENDING_DISNEY_WOMENS_MARCH_MADNESS_2026, TRENDING_DISNEY_SPORTS, TRENDING_VANITY_FAIR_OSCARS_2026, TRENDING_VANITY_FAIR_ALL, TRENDING_SOCCER, TRENDING_ELECTRONICS_TECHNOLOGY, TRENDING_HEALTH_WELLNESS, TRENDING_DISNEY_NBA_2026, TRENDING_VOGUE_METGALA_2026, TRENDING_CONDE_METGALA_2026, TRENDING_CONDE_ALL, TRENDING_FOX_SPORTS, TRENDING_NBC_LOVE_ISLAND_2026, TRENDING_PEACOCK_ALL, TRENDING_BACK_TO_SCHOOL, TRENDING_CAR_RACING, TRENDING_SPANISH, TRENDING_BASKETBALL_PEAK_SEASON, TRENDING_AGRIBUSINESS, TRENDING_LIBERTADORES, TRENDING_FOOTBALL, TRENDING_TENNIS_US_OPEN, TRENDING_LIBERTADORES_LALIGA, POE_SPORTS, POE_FOOD, POE_TRAVEL, POE_MOVIES, POE_MUSIC, POE_TOY}>*<br>**Default value: **`[]` trending_topics Show child parameters |

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

---

## Updating

 You can't perform this operation on this endpoint.

## Deleting

 You can't perform this operation on this endpoint.
