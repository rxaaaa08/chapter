<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/high-demand-period | Saved: 2026-09-19 -->

# High Demand Period



## About budget scheduling

Budget scheduling allows you to schedule budget increases for your campaign or ad set budget based on days or times when you anticipate higher sales opportunities, peak traffic periods or other promotional time periods by scheduling high demand periods.

You can schedule budget increases on certain parts of the day, certain days of the week or based on an upcoming promotion when you anticipate increased demand.

There are several features you should know before using budget scheduling:

- User must have **CAN_USE_BUDGET_SCHEDULING_API** as part of their [account capability](https://developers.facebook.com/docs/marketing-api/reference/ad-account/capabilities/v18.0)

- Budget scheduling can only be used for campaigns with a daily budget.

- You can set up a maximum of 50 high demand periods per campaign or ad set.

- When scheduling a budget increase, the total budget cannot exceed 8 times the daily budget. For example, if your daily budget is $100, the maximum amount for your high demand period is $800 .

- High demand periods must be at 3 hours in length or more.

- Advertisers can use budget scheduling for all objectives within the auction with the exception of Advantage+ App campaigns

### When to use budget scheduling

You can use budget scheduling for:

- Time-based events: Schedule budget increases on certain days of the week or hour of the week and specific calendar dates based on the seasonality of your business.

- Macro events: Schedule around events such as music festivals, PR events, sporting events or opening weekend activities or offers.

- Promotional events: Schedule based on sales, new products, launches or game release dates.

### How budget scheduling is different from ad scheduling

Ad scheduling allows you to control when your ads are delivered. You can set specific hours and days of the week based on the viewer’s or your ad account’s time zone. Ad scheduling can only be used with lifetime budgets.

Budget scheduling allows you to increase your budget on days and times when you want to increase your budget based on when you anticipate higher sales opportunities or experience peak times. Budget scheduling can only be used with daily budgets.

### How budget scheduling works with your daily budget

When you use budget scheduling, you can define on which days, or which hours of the day, you want to increase your budget above the daily budget you initially set.

Budget scheduling enables you to adjust your budget using your daily budget as the reference point. You can increase your budget by entering a value amount or percentage.

When it is time for the budget increase, Meta automatically increases your budget according to your inputs. After your high demand period ends, your budget will automatically revert back to the original daily budget you set.

For example, you set your daily budget to $100. On weekends, you expect more people to purchase your products from a promotional offer and you want to increase your budget to $120 for both days. So you enter an increase of $20 for Saturday and $20 on Sunday. Meta will aim to spend $120 on Saturday and Sunday and then automatically revert back to your initial daily budget of $100 after your scheduled high demand period ends.

### Best practices for budget scheduling

You can maximize your campaign and ad set setup by keeping these tips in mind:

- High demand periods: These are times when there is a heightened demand for your product or service. This demand may arise from people actively seeking your offering during these periods, indicating a stronger interest such as an increased restaurant sales on weekends or a surge in food delivery requests on rainy days. It can also be driven by you offering something new or special, such as discounts or product launches or macroeconomic factors that influence overall buying behavior such as Black Friday or Mother’s Day weekend.

- Identifying high demand periods for your business: In order to detect high demand periods, analyze the number of your sales from a day-by-day perspective and see if there are any days that are meaningfully above others. If so, check if that pattern can be explained with one of the above reasons, and if it is a one off event or recurring pattern. Also note that high demand patterns can be specific for one product group, country or region so make sure to check for these patterns on multiple levels of your business.

## Reading

High Demand Period

#### Example

### HTTP
```
GET /v25.0/<HIGH_DEMAND_PERIOD_ID>/?fields=%5B%22budget_value%22%5D HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/<HIGH_DEMAND_PERIOD_ID>/?fields=%5B%22budget_value%22%5D',
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
    "/<HIGH_DEMAND_PERIOD_ID>/",
    {
        "fields": "[\"budget_value\"]"
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
params.putString("fields", "[\"budget_value\"]");
/* make the API call */
new GraphRequest(
    AccessToken.getCurrentAccessToken(),
    "/<HIGH_DEMAND_PERIOD_ID>/",
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
  @"fields": @"[\"budget_value\"]",
};
/* make the API call */
FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc]
                               initWithGraphPath:@"/<HIGH_DEMAND_PERIOD_ID>/"
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
  -d 'fields=[
       "budget_value"
     ]' \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/<HIGH_DEMAND_PERIOD_ID>/
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%3CHIGH_DEMAND_PERIOD_ID%3E%2F%3Ffields%3D%255B%2522budget_value%2522%255D&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

This endpoint doesn't have any parameters.

#### Fields

| Field | Description |
| --- | --- |
| `id`<br><br>*numeric string* | id<br> |
| `budget_value`<br><br>*integer* | Amount of budget increase during the high demand period. Can be expressed in either an absolute amount, or a multiplier value. The type is specified through the budget value type.<br><br><br>**[default]**<br> |
| `budget_value_type`<br><br>*enum* | Type of budget value. This sets if the specified budget value is an increase by an absolute amount or by a multiplier value.<br><br><br>**[default]**<br> |
| `recurrence_type`<br><br>*enum* | Type of recurrence. Currently we only support non-recurring high demand periods.<br><br><br>**[default]**<br> |
| `time_end`<br><br>*datetime* | Time when the high demand period ends.<br><br><br>**[default]**<br> |
| `time_start`<br><br>*datetime* | Time when the high demand period starts.<br><br><br>**[default]**<br> |

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |

## Creating

You can create a HighDemandPeriod by making a POST request to `/{ad-set-or-campaign-id}/budget_schedules`. See [Ad Set Budget Schedules](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign/budget_schedules#Creating) and [Campaign Budget Schedules](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group/budget_schedules#Creating) for more details.

You can create multiple HighDemandPeriods by making a POST request to either `/act_{ad-account-id}/adsets` or `/act_{ad-account-id}/campaigns` with `budget_schedule_specs` parameter while creating your adset or campaign. See [Ad Account Ad Sets](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/adsets#Creating) and [Ad Account Campaigns](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/campaigns#Creating) for more details.

You can't perform this operation on this endpoint.

## Updating

## Deleting

