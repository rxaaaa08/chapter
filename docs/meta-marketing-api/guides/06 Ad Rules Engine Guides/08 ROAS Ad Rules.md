<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/roas-ad-rules | Saved: 2026-09-19 -->

# ROAS Ad Rules



For ROAS (Return on Ad Spend) metrics, use a combination of filters to specify exactly how to compute the ROAS metric. Important filters include `attribution_window`, `time_preset` (lookback window), and `hours_since_creation`.

For example, if you want to compute 7D Click Mobile App Purchase ROAS, but only want 7 days of mature data:

- Set `attribution_window` of `7D_CLICK`
- Set `time_preset` of `LAST_ND_14_8`

This attributes all mobile app purchase values within 7 days of users who clicked on the ad in the lookback window, excluding the most recent 7 days because those 7 days include immature data. If a user clicked on the ad yesterday, the ROAS computation does not include that user, because that user still has 6 days of potential purchases.

Purchase values are the values of Mobile App Purchase events and Website Conversion Purchase (Meta Pixel) events for the respective ROAS metrics. In the API, this would mean the purchase values of the `app_custom_event.fb_mobile_purchase` and `offsite_conversion.fb_pixel_purchase` count metrics, respectively.

If the attribution window includes both click and view windows, the computed ROAS is the sum of the values. For example, if the `attribution_window` is `1D_VIEW_7D_CLICK`, the system takes the `1D_VIEW` ROAS value and `7D_CLICK` ROAS value and computes the sum. This sum is valid because the two attributions are disjoint and can correctly be added together without overlap.

An optimal use of this metric also includes some time-based filter, to make sure enough days have elapsed for there to be mature data. If the use case requires mature data, add a `hours_since_creation` filter to ensure that the ad set has been running long enough.

Here's an example rule that:

- Increases budget by 20%, if the 7D Click Website Purchase ROAS is greater than `0.50` (50%)
- For 7 days of mature data
- Checking once per day

Since these rules are heavily specific, they usually apply to a specific list of ad sets, such as `id` = `123`. Using `8*24` for hours since creation provides at least one full day of mature data.

```bash
curl \
-F 'name=Test Website ROAS Rule' \
-F 'schedule_spec={
     "schedule_type": "DAILY"
   }' \
-F 'evaluation_spec={
     "evaluation_type": "SCHEDULE",
     "filters": [
       {
         "field": "id",
         "value": [123],
         "operator": "IN"
       },
       {
         "field": "time_preset",
         "value": "LAST_ND_14_8",
         "operator": "EQUAL"
       },
       {
         "field": "attribution_window",
         "value": "7D_CLICK",
         "operator": "EQUAL"
       },
       {
         "field": "hours_since_creation",
         "value": 192,
         "operator": "GREATER_THAN"
       },
       {
         "field": "website_purchase_roas",
         "value": 0.50,
         "operator": "GREATER_THAN"
       }
     ]
   }' \
-F 'execution_spec={
     "execution_type": "CHANGE_BUDGET",
     "execution_options": [
       {
         "field": "change_spec",
         "value": {
           "amount": 20,
           "unit": "PERCENTAGE"
         },
         "operator": "EQUAL"
       },
     ]
   }' \
-F "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<VERSION>/<AD_ACCOUNT_ID>/adrules_library
```

Here's an example rule that:

- Scales bid daily towards a target 1D View 1D Click Mobile App Purchase ROAS value of 0.80
- With a 5% tolerance window set by a range filter on the ROAS value.

Again, to get only mature data, use time presets that do not include today's data, such as `LAST_7D` and `LAST_14D`.

```bash
curl \
-F 'name=Test Mobile App ROAS Rule' \
-F 'schedule_spec={
     "schedule_type": "DAILY"
   }' \
-F 'evaluation_spec={
     "evaluation_type": "SCHEDULE",
     "filters": [
       {
         "field": "id",
         "value": [123],
         "operator": "IN"
       },
       {
         "field": "time_preset",
         "value": "LAST_7D",
         "operator": "EQUAL"
       },
       {
         "field": "attribution_window",
         "value": "1D_VIEW_1D_CLICK",
         "operator": "EQUAL"
       },
       {
         "field": "hours_since_creation",
         "value": 48,
         "operator": "GREATER_THAN"
       },
       {
         "field": "mobile_app_purchase_roas",
         "value": [0.76, 0.84],
         "operator": "NOT_IN_RANGE"
       }
     ]
   }' \
-F 'execution_spec={
     "execution_type": "CHANGE_BID",
     "execution_options": [
       {
         "field": "change_spec",
         "value": {
           "amount": 0.80,
           "target_field": "mobile_app_purchase_roas"
         },
         "operator": "EQUAL"
       },
     ]
   }' \
-F "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<VERSION>/<AD_ACCOUNT_ID>/adrules_library
```
