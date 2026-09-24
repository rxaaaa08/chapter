<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reservation | Saved: 2026-09-19 -->

# Reservation



Reservation enables you to plan and buy your campaigns with a fixed cost, offering optimized reach and controlled ad frequency while helping you forecast your campaign's performance. This is similar to how people traditionally buy TV ads. This is a specialized, advanced option that most advertisers will only use if they want high assurance their ads reach a certain number of Accounts Center accounts.

Reservation works across ad types and devices. Since Meta targets based on real people, not cookies, Meta can more accurately predict reach and control frequency across devices.

## Restrictions

* Available for certain ad accounts. Check an [ad account's](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account#read) `CAN_USE_REACH_AND_FREQUENCY` parameter.
* The ad set's `stop_time` must be within 180 days of a prediction.
* Accounts also have country-based limitations; check with a `GET` API call to `https://graph.facebook.com/<API_VERSION>/act_<AD_ACCOUNT_ID>?fields=rf_spec`.
* Only set one country at a time in `target_spec`.
* No minimal iOS versions for `user_os`, such as `iOS_ver_2.0_and_above`.
* When creating or updating a reservation campaign, you cannot set the lifetime or daily budget, the lifetime or daily impression limit, the frequency cap or the external bid, or the `PacingType` field.

Search `rf_spec` for applicable limits:

| Name | Description |
| --- | --- |
| `countries`<br><br>array | Supported countries for reservation |
| `min_campaign_duration`<br><br>object | Minimum campaign duration in days, per supported country |
| `max_campaign_duration`<br><br>object | Maximum campaign duration in days, per supported country |
| `max_days_to_finish`<br><br>object | Days in advance campaign can finish at time prediction made, per supported country |
| `min_reach_limits`<br><br>object | Minimum reach in number of Accounts Center accounts, per supported country |

Results look like this:

```
{
  "rf_spec": {
    "min_reach_limits": {
      "US": 1000000,
      "CA": 1000000,
    },
    "countries": [
      "US",
      "CA",
    ],
    "min_campaign_duration": {
      "US": 3,
      "CA": 3,
    },
    "max_campaign_duration": {
      "US": 30,
      "CA": 30,
    },
    "max_days_to_finish": {
      "US": 56,
      "CA": 56,
    }
  }
}
```

## Create predictions {#create}

Predictions contain the number of Accounts Center accounts your ad can reach in a date range based on a given reach, frequency, audience, and budget. Reservation estimates can help you simulate your campaign's lifetime results and will adjust based on your objective, budget, audience, formats, and placements, brand safety, performance goal and frequency control settings.

Edits to a reservation campaign are possible after booking, but once the campaign is running, you cannot edit or pause it except to switch out your ad creatives. If you only edit an ad's creative, your prediction won't change. You may delete the campaign to cancel and stop it, but will need to re-book the campaign, where you may receive a new CPM and prediction on campaign outcomes. Only book campaigns you intend to run. For testing, limit your reservations to the smallest size and length; be certain you cancel them since this is real ads inventory that Meta reserves for you.

### Limits

These are default limits for predictions:

* Target audiences of at least 300k Accounts Center accounts.
* Minimum reach of 200k Accounts Center accounts.
* Ad sets must run at minimum 1 day and maximum of 90 days *(The number of days is calculated as the number of days the campaign spans.  For example, if a campaign starts at 12:00pm on day 1 and ends at 10:00am on day 2, the campaign is considered to have run for 2 days although the difference in hours is less than 24 hours)*.
* Ad set stop time must be within 180 days of a prediction.
* The campaign must end after 6AM on the last day in the ad account timezone.

## Read predictions

To get details, specify the fields you want. To see all `reachfrequencyprediction`s for an account, make an `HTTP GET` to `https://graph.facebook.com/{API_VERSION}/act_{AD_ACCOUNT_ID}/reachfrequencypredictions?fields={COMMA_SEPARATED_FIELD_LIST}`.

To reach all `reachfrequencyprediction`s based on a `reachfrequencyprediction` ID, make an `HTTP GET` request with the fields you want: `https://graph.facebook.com/{API_VERSION}/{RF_PREDICTION_ID}?fields={COMMA_SEPARATED_FIELD_LIST}`.

By default, Meta returns the ID. For field details, see [Reservation Prediction, Reading](https://developers.facebook.com/docs/marketing-api/reference/reach-frequency-prediction#Reading).

### Response status codes

This shows possible `status` results in `reachfrequencyprediction`. Initial limitations appear when applicable; however, they may vary per ad account or by country in the future:  

| Code | Status | Description |
| --- | --- | --- |
| 1 | SUCCESS | Prediction successful |
| 2 | PENDING | Prediction still being produced |
| 3 | FAIL | Unreachable audience. Too high reach or budget. |
| 4 | FAIL | Prediction settings invalid, for example, duration |
| 5 | FAIL | `targeting_spec` invalid |
| 6 | FAIL | Budget or bid for given reach too low |
| 7 | FAIL | Too short ad set length |
| 8 | FAIL | Too long ad set length |
| 9 | FAIL | Ad set end date too far in future |
| 10 | FAIL | Frequency cap not specified |
| 11 | FAIL | Ad placement not supported, such as mixed RHS and Feed |
| 12 | FAIL | Ad set dates issues (start time and/or end time): Start time in past, not midnight, or not full day. End time in past, exceeds 90 days of start time or doesn't end after 6AM. |
| 13 | FAIL | Targeted country not yet supported |
| 14 | FAIL | Ad set dates include blackout days |
| 15 | FAIL | Insufficient inventory, unable to reserve. See Reserving a Prediction. |
| 16 | FAIL | Minimum reach required for account not achieved. See Getting Account Restrictions |
| 17 | FAIL | Actual reach available for this prediction is less than the minimum reach of the targeted country, usually 200,000 for most countries. |
| 18 | FAIL | Invalid day parting schedule provided. |
| 19 | FAIL | Target CPM unachievable. |
| 20 | FAIL | Frequency cap too low for blended delivery |
| 21 | FAIL | Ads inventory changed significantly enough for inaccurate prediction. |
| 23 | FAIL | Frequency cap interval not supported in target country. |
| 24 | FAIL | Holdout Lift Study ad set under account or campaign group not consistent with reservation prediction. |
| 25 | FAIL | Frequency cap can't exceed the number of days your campaign runs. |
| 26 | FAILURE_EMPTY_AUDIENCE | Selected audience empty and unusable. |
| 27 | FAIL | No modification allowed on your running campaign. |
| 28 | FAIL | Cannot modify running campaign created with Insertion Order. |
| 29 | FAIL | Cannot modify running campaign due to time constraints. |
| 30 | FAIL | To edit a running reservation ad set, choose a budget higher than current spend. |
| 31 | FAIL | Lift Study for account or campaign group starts after campaign starts. |
| 32 | FAIL | Lift study for account or campaign group ends before campaign ends. |
| 35 | FAIL | Cannot set Reservation campaign start time to be in the past. |
| 36 | FAIL | Please make sure the duration of the Reservation ad set is longer than one day and the campaign start/end time is valid. |
| 37 | FAIL | The objective isn't supported by Audience Network with the reservation buying type. |
| 39 | FAIL | Selected placements combination can't be used when buying with reservation. |
| 40 | FAIL | Specific mobile OS versions can't be targeted with the reservation buying type. |
| 41 | FAIL | Friends of connections can't be targeted with the reservation buying type. |
| 42 | FAIL | Reservation campaigns are not able to run when Audience Network is selected as the only placement. Please select the Audience Network placement with either Facebook Feed or Instagram Feed as additional placements. |
| 44 | FAIL | Reservation doesn't support Facebook Story. |
| 45 | FAIL | To use Facebook Stories as a placement, please also select either Facebook Feeds or Instagram Stories. |
| 50 | FAIL | Selected placements combination can't be used when buying with Reservation. For Reservation IO buying, please ensure the objective is Video Views. Otherwise, to use Facebook In-Stream, please select the Facebook Feeds placement. |
| 53 | FAIL | The in-stream video placement is available only for audiences in the US, the UK, Australia, New Zealand, Ireland, Thailand, Mexico, Peru, France, Germany, Argentina, Colombia, Spain, Chile, Ecuador, Dominican Republic, Guatemala, Bolivia, Honduras, El Salvador, Norway, Sweden, the Netherlands, Belgium, Poland, Portugal, Denmark, India, Malaysia, the Philippines, Indonesia, and Vietnam. To continue, edit your audience to include only people in those countries. |
| 60 | FAIL | To use Facebook Marketplace, please select the Facebook Feeds placement. |
| 66 | FAIL | Facebook Right Column Placement Cannot Be Combined with Other Placements. |
| 69 | FAIL | If you would like your ad shown on the Explore section of Instagram, you will also need to select Instagram Feed as a placement. |
| 100+ | FATAL | System failure, no user fault. Retry. |

## Use predictions

Provide your Prediction ID and its data as input to create a new ID which serves as a reservation ID. Then attach this reservation ID to your ad set. Creating a reservation makes inventory unavailable to others, so you should attach it before it expires.

**If the reservation succeeds, Meta temporarily reserves the inventory for you. You have *approximately* one hour after the reservation to assign an *ad* to an ad set.**

**Note:** If the hourly limit for reservation requests is exceeded, you'll see the following error code and message: **613: Calls to this API have exceeded the rate limit.**

### Reserve {#reservation}

Reserve predictions for your ad sets to fix your CPM and have predictable reach. Reserve an audience identified by `reachfrequencyprediction` for a set time with `reserve` for `action`. You can use a single prediction ID to create multiple reservations. For example:

```
curl \
-F 'action=reserve' \
-F 'rf_prediction_id=<RF_PREDICTION_ID>' \
-F 'access_token=<ACCESS_TOKEN>' \
'https://graph.facebook.com/<API_VERSION>/act_<AD_ACCOUNT_ID>/reachfrequencypredictions'

// Response
{"id":9876543210"}
```

To reserve inventory based on a prediction, make a `POST` API call to `https://graph.facebook.com/{API_VERSION}/act_{AD_ACCOUNT_ID}/reachfrequencypredictions`.

For `reach`, `budget`, and `impression`, you can reserve a prediction at a specific point on `curve_budget_reach` rather than the original tuple of prediction reach/budget. Use these fields:

| Name | Description |
| --- | --- |
| `rf_prediction_id`<br><br>int | **Required.**<br><br>`reachfrequencyprediction` ID |
| `action`<br><br>string | **Required for reservation and cancellation.**<br><br>Options are:<br><br>* `reserve` - reserve inventory with previous prediction<br>* `cancel` - cancel reserved prediction |
| `rf_prediction_id_to_release`<br><br>int | **Optional.**<br><br>Reserved prediction or reservation ID. A new reservation releases a reserved audience and uses it for the new reservation. See [Reusing Reserved Audiences](#reusing) |
| `rf_prediction_id_to_share`<br><br>int | **Optional.**<br><br>ID of previously created prediction. New predictions use the audience from a given prediction.<br><br>**Note:** `rf_prediction_id_to_share` must be set to a valid prediction ID to use either the `TRAFFIC` objective or the `POST_ENGAGEMENT` and `LINK_CLICKS` optimizations. See the [changelog](https://developers.facebook.com/docs/graph-api/changelog/version18.0#reach-and-frequency) for more information. |
| `reach`<br><br>int | **Optional. If specified, provide `budget` and `impression`.**<br><br>Specify `reach`, `budget`, and `impression` for that point on `curve_budget_reach`. You can override this value. |
| `budget`<br><br>int | **Optional. If specified, provide `reach` and `impression`.**<br><br>Specify `reach`, `budget`, and `impression` for that point on `curve_budget_reach`. You can override this value. |
| `impression`<br><br>int | **Optional. If specified, provide `reach` and `budget`.**<br><br>You can override this value. To do so, specify the `reach`, `budget`, and `impression` for that point on `curve_budget_reach`. |

Meta reserves predictions asynchronously; you should poll and check the status of the prediction. Initially the prediction status is `2` (PENDING). On completion, status is `1`, `SUCCESS`, or `15`, `FAIL` which means Meta lacks inventory to complete this reservation.

Since the reservation system is dynamic, you may see small changes in inventory availability between your prediction time and reservation time. However, Meta respects values you get at the prediction time, so long as changes fall into a reasonable threshold.

### Assign to ad sets

After you successfully reserve a prediction, create an ad set with it:

```
curl \
-F "rf_prediction_id=<RF_PREDICTION_ID>" \
-F "access_token=<ACCESS_TOKEN>" \
"https://graph.facebook.com/<API_VERSION>/<AD_SET_ID>"
```

To successfully assign a prediction, your ad set must meet these criteria:

* Do not specify:
* `start_time` - derived from prediction
* `end_time` - derived from prediction
* `targeting` - derived from prediction
* `bid_amount`
* `optimization_goal`
* Either `lifetime_budget` or `daily_budget`
* You can assign reservations to ad sets without active ads. However, you must have at least one active ad before the ad set starts.
* You must include `rf_prediction_id` which attaches the prediction to the new ad set.
* The ad campaign attribute of `buying_type` is `RESERVED`

You can also attach `reachfrequencyprediction` to ad sets to modify its prediction. Making a `POST` request to `https://graph.facebook.com/{ad_set_id}` with `rf_prediction_id` for the `reachfrequencyprediction` you want to use.

The following are limits on the ad set:

* Publisher platform options: `facebook`, `instagram`.
* Facebook placement options: `feed`, and `rightcolumn`.
* Instagram placement options: `stream`, `story`, `explore`, `explore_home` and `reels`. If placement includes `instagram`, you must use `destination_ids`, not `destination_id`. The `destination_ids` field should contain the Facebook Page ID used as `destination_id`, plus the Instagram account ID.
* Either Custom Audience or Partner Categories but not both
* Website Custom Audiences, fan, or video engagement-exclusion targeting are not permitted.
* Ad set's `promoted_object` must match the prediction's `destination_id`. For page posts, it must be the page ID specified and for app ads, it must match the app ID specified.
* [Standard and Scheduled Ads Pacing](https://developers.facebook.com/docs/marketing-api/adset/pacing) supported, while accelerated delivery not.

Meta charges reservation campaigns on actual impressions delivered. If the campaign start time passes and the ad set lacks active ads, the campaign fails to deliver and no charges apply. Meta releases remaining inventory, however Meta may penalize the ad account for repeat occurrences.

When you create a campaign using Meta's reservation buying type you are agreeing to pay the proposed costs for the advertising inventory you reserve. If you want to change your audience size or ad frequency, then your costs will also change. You can make these changes any time before your campaign starts. You can edit your ad creative until your campaign starts.

### Manage ads

Reservation ad sets may contain multiple ads; you can add more ads at any point. If the ad set activates and there are no active ads in it, you must create your first ad within 24 hours for ad sets lasting 3 to 30 days, or 6 hours for ad sets lasting 1 to 2 days. If you do not, Meta deletes the reservation.

### Detach predictions, modify ad sets

You can make edits or pause your reservation campaign before it starts. Once the campaign has started, you can only edit your ad creative, your budget or extend the end date. If you only edit an ad's creative, your prediction won't change.

If you change your budget or end date, this may generate a new prediction for your campaign which you will see in reservation estimates.

You cannot pause your reservation campaign after it starts, but you can delete the campaign to cancel your campaign at any time.

To pause or edit a set after it starts, see [Pausing or Restarting Running Ad Sets](#pausing_running_adset) and [Editing Running Ad Sets](#editing_running_adset). To delete an active set, see [Ad Set, Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign). You'll be charged for any impressions delivered.

Note, to avoid potential failures, Meta strongly discourages deleting all ads when a reservation ad set is live.

If you assign a reservation to an ad set before the ad set becomes active, you cannot change most attributes unless you detach the reservation. Make an `HTTP POST` request to the set and set `rf_prediction_id` to 0. You can only modify the `name` attribute on the ad set object.

To detach a reservation:

```
curl \
-F "rf_prediction_id=0" \
-F "access_token=<ACCESS_TOKEN>" \
"https://graph.facebook.com/<API_VERSION>/<AD_SET_ID>"
```

Once an ad set is active, the reservation cannot be detached and attributes of the set cannot be modified, except a few **ad** attributes listed below that are on the allow list:

* `name`
* `creative_id`
* `creative_spec`
* `conversion_specs`
* `tracking_specs`
* `view_tags`

### Pause and restart ad sets {#pausing_running_adset}
You can pause an active set, see [Ad Set, Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign). If you pause an ad set for more than 30 minutes, Meta no longer guarantees the prediction for this set.

To reactivate a set paused for more than 30 minutes, you need a new prediction. Make a `POST` to `reachfrequencypredictions`. See [Create a Prediction](#create) and [Reserve the Prediction](#reservation). You should pass an existing_campaign_id for the active set to be reactivated in the request. After you create and reserve a new prediction, attach `reachfrequencyprediction` to the ad set with `HTTP POST` to: `https://graph.facebook.com/{ad_set_id}` specifying `rf_prediction_id` for the prediction you want to use.

### Edit running ad sets {#editing_running_adset}
You can make these updates after a set starts.

* Increase or decrease ad set budget and reach. Budget or reach should be greater than the current spend or delivered reach.
* Extend ad set schedule to 90 days.

**You cannot edit or pause an active set if it meets one of the following criteria:**

* Heavily under-delivered. Delivered less than 10% of prediction. Over-spent sets with spend over budget
* Ad sets running only for one day
* Ad sets ending within next 24 hours

To edit running ad sets, get a new prediction. See [Create a Prediction](#create) and [Reserve the Prediction](#reservation). You should pass an existing_campaign_id for the active set to be reactivated in the request.

After a new prediction is created and reserved, you can attach `reachfrequencyprediction` to the ad set by making a HTTP POST request to: https://graph.facebook.com/{ad_set_id} specifying `rf_prediction_id` as the id of the reachfrequencyprediction you want to use.

## Reuse reserved audiences {#reusing}

If you cancel a reservation it frees reserved inventory for other advertisers. However, you can reuse an audience from a previously reserved prediction if you aren't already using it. This enables us to take into account additional inventory to create a prediction, without you having to cancel an existing reservation.

Include `rf_prediction_id_to_share` when you create a reservation. This is the ID of a previous prediction. This invalidates the previous reservation, so you can use this inventory for your newly created reservation.

To reserve the new prediction, you must also pass the additional parameter `rf_prediction_id_to_release` which is the ID of the previous reservation.

### Ad rotation and sequencing
You can rotate ads in the ad set you are using. You do not need to detach the reservation from the ad set to do this. Add one or more ads to the ad set and wait until it becomes active. At this point, you can change the status of the initial ad to paused. You must have at least one active ad within the ad set.

You can design a sequence of ads that deliver in order. First create the ad set and ads. Then specify the sequence at the ad set level in `creative_sequence`. Each individual ad in this ad set may not appear, appear once, or appear multiple times in the sequence.

If `creative_sequence` array length is zero, then you're using no sequencing. If the length is not zero, you should make it equal to `frequency_cap` in `rf_prediction_id`. If the length is larger than `frequency_cap`, Meta truncates the last several ads from the array. If the length is less than `frequency_cap`, Meta recursively auto-fills the array by repeating the sequence from the beginning. To make results clear, set the length of `creative_sequence` to the same amount as `frequency_cap`.

Each ad in the sequence has `ACTIVE`, `PENDING_REVIEW`, or `CREDIT_CARD_NEEDED` status. A particular ad in the sequence will only be delivered to a user if all the preceding ads in the sequence have been delivered. Ads not included in the `creative_sequence` will not be delivered.

All ads in an ad set using ad sequencing, no matter in the sequence or not, cannot be paused, archived, or deleted.

This feature is only available for reservation ad sets, that is, the `buying_type` of its parent ad campaign is `RESERVED`, and this ad set has `rf_prediction_id` set.

More details can be found at [ad set](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign) document.

## Instagram reservation

For predictable reach on Instagram, you can create a Reservation campaign with `buying_type` set to `RESERVED`.

Reservation helps you plan and book awareness and engagement campaigns, optimizing for reach, ad recall lift and ThruPlay.

[Reach estimates](https://developers.facebook.com/docs/marketing-api/reference/reach-estimate) in [Ads Manager](https://business.facebook.com/adsmanager/manage) and the API can give partners guidance on what they can reasonably expect. The Instagram community comes first, Meta tries to achieve reach objectives conservatively, and expects to evolve over time. All policies that apply to using reservation estimates for Facebook also apply to Instagram.

## Error codes {#errors}

| Code | Description |
| --- | --- |
| 1487583 | An ad set with no ads cannot be assigned a reservation prediction |
| 1487055 | Ad set status invalid |
| 1487600 | Ad set is already assigned to a reservation. If you want to use another prediction, please first disconnect current from the set using null value and then assign a new prediction. |
| 1487578 | The specified `reachandfrequencyprediction` ID does not exist, or does not belong to the account given. |
| 1487581 | Reservation prediction cannot be modified on an active ad set |
| 1487594 | No ads in reservation ad set |
| 1487595 | Invalid Target Spec in reservation ad set |
| 1487614 | Ad set start time does not match with original prediction |
| 1487615 | Ad set stop time does not match with original prediction |
| 1487616 | Cannot associate ad set with invalid prediction |
| 1487671 | Direct transition from one prediction to another for an ad set is not allowed. |
| 1487244 | Ad set Update Failed - reason should be given in response |
| 1487672 | Failed to assign prediction to ad set. |
| 1487680 | You don't have permission to use reservation ad sets. |

## Examples {#examples}

Creating a `reachfrequencyprediction` for an app `destination_id`:

```
curl \
-F 'target_spec={"geo_locations": {"countries":["US"]}, "age_max":35, "age_min":26, "genders":[2], "publisher_platforms":["facebook"], "facebook_positions":["feed"]}' \
-F 'start_time=1388534400' \
-F 'end_time=1389312000' \
-F 'frequency_cap=4' \
-F 'reach=1000000' \
-F 'budget=3000000' \
-F 'destination_id=<APP_ID>' \
-F 'prediction_mode=1' \
-F "objective=MOBILE_APP_INSTALLS" \
-F 'access_token=<ACCESS_TOKEN>' \
'https://graph.facebook.com/<API_VERSION>/act_<AD_ACCOUNT_ID>/reachfrequencypredictions'

{"id":"67890123456"}
```

Creating a `reachfrequencyprediction` for a page `destination_id`:

```
curl \
-F 'target_spec={"geo_locations": {"countries":["US"]}, "age_max":35, "age_min":26, "genders":[2], "publisher_platforms":["facebook"], "facebook_positions":["feed"]}' \
-F 'start_time=1388534400' \
-F 'end_time=1389312000' \
-F 'frequency_cap=4' \
-F 'reach=1000000' \
-F 'budget=3000000' \
-F 'destination_id=<PAGE_ID>' \
-F 'prediction_mode=1' \
-F "objective=POST_ENGAGEMENT" \
-F 'access_token=<ACCESS_TOKEN>' \
'https://graph.facebook.com/<API_VERSION>/act_<AD_ACCOUNT_ID>/reachfrequencypredictions'

{"id":"67890123456"}
```

Creating a `reachfrequencyprediction` for an app `destination_id` with Instagram placement:

```
curl \
-F 'target_spec={"geo_locations": {"countries":["US"]}, "age_max":35, "age_min":26, "genders":[2], "publisher_platforms":["facebook","instagram"], "device_platforms":["mobile"]}' \
-F 'start_time=1388534400' \
-F 'end_time=1389312000' \
-F 'frequency_cap=4' \
-F 'reach=1000000' \
-F 'budget=3000000' \
-F 'destination_ids=[<APP_ID>,<INSTAGRAM_ACCOUNT_ID>]' \
-F 'prediction_mode=1' \
-F "objective=MOBILE_APP_INSTALLS" \
-F 'access_token=<ACCESS_TOKEN>' \
'https://graph.facebook.com/<API_VERSION>/act_<AD_ACCOUNT_ID>/reachfrequencypredictions'

{"id":"67890123456"}
```

Poll the following endpoint via HTTP GET requests to retrieve the status until it is something other than `2`:

```
https://graph.facebook.com/67890123456?fields=status
```

If the status is `1` (successful), then this can be attached to an ad set or reserved.

Reserving a prediction:

```
curl \
-F 'action=reserve' \
-F 'rf_prediction_id=<RF_PREDICTION_ID>' \
-F 'access_token=<ACCESS_TOKEN>' \
'https://graph.facebook.com/<API_VERSION>/act_<AD_ACCOUNT_ID>/reachfrequencypredictions'

{"id":"9876543210"}
```

Poll the following endpoint via HTTP GET requests to retrieve the status until it is something other than `2`:

```
https://graph.facebook.com/<API_VERSION>/<PREDICTION_ID>?fields=status
```

If the status is `1` (successful), then this can be attached to an ad set. Let's set up your campaign structure by creating a campaign, an ad set, a creative, an ad, and assigning the reservation to the ad set.

Create an ad campaign:

```
curl \
-F "name=Test" \
-F "buying_type=RESERVED" \
-F "status=ACTIVE" \
-F "objective=POST_ENGAGEMENT" \
-F "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<API_VERSION>/act_<AD_ACCOUNT_ID>/campaigns

{"id":"1122334455"}
```

Create an ad set:

```
curl  \
-F "name=TestReachSet" \
-F "status=1" \
-F "campaign_id=<CAMPAIGN_ID>" \
-F "rf_prediction_id=<RF_PREDICTION_ID>" \
-F "access_token=<ACCESS_TOKEN>" \
"https://graph.facebook.com/<API_VERSION>/act_<AD_ACCOUNT_ID>/adsets"

{"id":"09876543"}
```

Generate an ad creative:

```
curl \
-F "name=sample creative" \
-F "type=1" \
-F "title=hello world" \
-F "body=hi i'm an ad" \
-F "link_url="https://www.facebook.com/" \
-F "image_hash=4aca812b4eadb72818a2c4124abd121a" \
-F "access_token=<ACCESS_TOKEN>" \
"https://graph.facebook.com/<API_VERSION>/act_<AD_ACCOUNT_ID>/adcreatives"

{"id":"1323123123123"}
```

Create an ad:

```
// Create an ad
curl \
-F "name=my ad" \
-F "adset_id=<AD_SET_ID>" \
-F "creative={'creative_id':<CREATIVE_ID>}" \
-F "access_token=<ACCESS_TOKEN>" \
"https://graph.facebook.com/<API_VERSION>/act_<AD_ACCOUNT_ID>/ads"

{"id":"3213213123"}
```

Assigning a new prediction to the ad set:

```
curl \
-F "rf_prediction_id=<RF_PREDICTION_ID>" \
-F "access_token=<ACCESS_TOKEN>" \
"https://graph.facebook.com/<API_VERSION>/<AD_SET_ID>"
```
