<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/overview/change-spec | Saved: 2026-09-19 -->

# Ad Rules Change Spec


This page discusses the `change_spec` in more detail, specifically on how to construct the execution option and how to use the more advanced features.

Use the `change_spec` for execution types such as `CHANGE_BUDGET` and `CHANGE_BID`. It contains the following parameters: `amount`, `limit`, `unit`, `target_field`.

| Field | Description |
| --- | --- |
| `amount` | **Required.**<br><br>Determines the amount to change the budget or bid. The values of other parameters in the `change_spec` determine exactly how this amount is used.<br><br>**Supported Values:** A numeric value, such as `3000` or `-50` |
| `limit` | **Optional.**<br><br>Specifies the maximum or minimum budget or bid amount. For example, if you increase the budget or bid, this number acts as an upper limit. If `target_field` is present, this specifies a range from the lower bound to the upper bound of values.<br><br>**Supported Values:** Currency, such as `5000` to represent $50 USD, or for `target_field`, a range of currencies such as `[4000, 6000]` to represent $40 to $60 USD. |
| `unit` | **Required, unless `target_field` is present.**<br><br>Specifies the unit of the `amount` value. For example, if the unit is `PERCENTAGE`, an `amount` of `-50` means `-50%`.<br><br>**Supported Values:** `ACCOUNT_CURRENCY` or `PERCENTAGE` |
| `target_field` | **Optional.**<br><br>Specifies whether or not to scale budgets or bids by a target value. If `target_field` is present, `amount` is the target value of the `target_field`. The system increases or decreases the budget or bid proportionally, based on whether the ad set's current value for the `target_field` is lower or higher than the `amount`.<br><br>**Supported Values:** An Insights field, such as `cost_per_mobile_app_install` or `mobile_app_purchase_roas` |

## Examples
This is an example of a `CHANGE_BUDGET` rule that decreases budgets by 30% for all underperforming ad sets, where underperforming means stably having a high lifetime `frequency`. This rule only runs at midnight on Tuesdays and Fridays.

```
curl \
-F 'name=Test Change Budget Rule' \
-F 'schedule_spec={
     "schedule_type": "CUSTOM",
     "schedule": [
       {
          "start_minute": 0,
         "days": [2, 5]
       }
     ]
   }' \
-F 'evaluation_spec={
     "evaluation_type": "SCHEDULE",
     "filters": [
       {
         "field": "entity_type",
         "value": "ADSET",
         "operator": "EQUAL"
       },
       {
         "field": "time_preset",
         "value": "LIFETIME",
         "operator": "EQUAL"
       },
       {
         "field": "impressions",
         "value": 8000,
         "operator": "GREATER_THAN"
       },
       {
         "field": "frequency",
         "value": 5.0,
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
           "amount": -30,
           "unit": "PERCENTAGE"
         },
         "operator": "EQUAL"
       },
     ]
   }' \
-F "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<VERSION>/<AD_ACCOUNT_ID>/adrules_library
```

This is another example, where the bid is scaled daily based on a target `cost_per_mobile_app_install` value for ad set `123`.

**This example also adds a range filter for `cost_per_mobile_app_install` to introduce a +/-10% range around the target value.** By adding this range filter, minor proportional changes are not done, if current value is close enough to the target value.

```
curl \
-F 'name=Test Change Bid Rule' \
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
         "value": "LIFETIME",
         "operator": "EQUAL"
       },
       {
         "field": "mobile_app_install",
         "value": 100,
         "operator": "GREATER_THAN"
       },
       {
         "field": "cost_per_mobile_app_install",
         "value": [4.5, 5.5],
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
           "amount": 5.0,
           "limit": [2.0, 10.0],
           "target_field": "cost_per_mobile_app_install"
         },
         "operator": "EQUAL"
       },
     ]
   }' \
-F "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<VERSION>/<AD_ACCOUNT_ID>/adrules_library
```

For example, if current value is `4.0`, the system increases the bid by `25%`, since that is the proportional difference between the target value of `5.0` and the current value.

The limit keeps the bid from increasing above `10.0` and decreasing below `2.0`.
