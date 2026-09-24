<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/scheduled-based-rules | Saved: 2026-09-19 -->

# Schedule Based Rules



Monitor the state of your ads by checking them at a set interval to see if they meet the [`evaluation_spec`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/overview/evaluation-spec) criteria. For Schedule Based Rules, an additional `schedule_spec` is required.

```
curl \
-F 'name=Rule 1' \
-F 'evaluation_spec={
    ...
   }' \
-F 'execution_spec={
    ...
   }' \
-F 'schedule_spec={
     "schedule_type": "DAILY"
   }' \

-F "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<VERSION>/<AD_ACCOUNT_ID>/adrules_library
```

## Schedule Spec

The `schedule_spec` of a rule determines how frequently you want it to run. We denote this interval in the `schedule_type` field.

| Schedule Type | Description |
| --- | --- |
| `DAILY` | Run the rule at midnight in the ad account's timezone. |
| `HOURLY` | Run the rule at the start of every hour. |
| `SEMI_HOURLY` | Run the rule at the start of every half-hour. |
| `CUSTOM` ([Example](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/advanced-scheduling)) | Run the rule at customized schedules. |

If `schedule_type` is `CUSTOM`, you must also specify the list of custom schedules, or times when the rule should run.

In the `schedule` list, each individual specification can be composed of a combination of the following fields. The only requirement is that at least one of `start_minute` or `days` must exist in each entry.

| Field | Description |
| --- | --- |
| `start_minute` | Time in minutes after 12:00AM. Must be a multiple of 30 minutes. If this is set and there is no `end_minute`, this determines the exact time to run the rule. Otherwise, it uses `end_minute` to determine the range of time to run the rule. If this is not set, the rule runs `SEMI_HOURLY` for each day in `days`. |
| `end_minute` | Time in minutes after 12:00AM. Must be a multiple of 30 minutes and after `start_minute`. If set, this uses `start_minute` to determine the range of time to run the rule. If `end_minute` is the same as `start_minute`, it also determines the exact time to run the rule. |
| `days` | List of days to run the rule. Each day must be a value from `0-6`. `0` is Sunday, `1` is Monday, and so on, ending with `6` as Saturday. If this is not set, the rule runs on all 7 days based on `start_minute` and, if exists, `end_minute`. |

For more information on how to use `CUSTOM` schedule types, see [Advanced Scheduling](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/advanced-scheduling).

Here's an example of an `evaluation_spec`. This rule applies to all objects in the initial list of ids that, in the last 7 days, have had more than `10000` impressions. In this case, we do not need the `entity_type` filter, since we defined a static list of initial objects using an `id` filter with no prefix.

```
curl \
-F 'name=Rule 1' \
-F 'schedule_spec={
    ...
   }' \
-F 'evaluation_spec={
      "evaluation_type" : "SCHEDULE",
      "filters" : [
       {
         "field": "time_preset",
         "value": "LAST_7_DAYS",
         "operator": "EQUAL"
       },
       {
         "field": "effective_status",
         "value": ["ACTIVE"],
         "operator": "IN"
       },
       {
         "field": "id",
         "value": [101, 102, 103],
         "operator": "IN"
       },
       {
         "field": "impressions",
         "value": 10000,
         "operator": "GREATER_THAN"
       }
     ]
   }' \
-F 'execution_spec={
    ...
   }' \
-F "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<VERSION>/<AD_ACCOUNT_ID>/adrules_library
```

Here is another example. This rule applies to all ad sets under the ad campaigns with ID `101, 102, 103` that use only lifetime budgets, and have been created for less than 48 hours. In this case, we do not need a `time_preset` filter, since there are no Insights filters.

```
curl \
-F 'name=Rule 1' \
-F 'schedule_spec={
    ...
   }' \
-F 'evaluation_spec={
      "evaluation_type" : "SCHEDULE",
      "filters" : [
       {
         "field": "entity_type",
         "value": "ADSET",
         "operator": "EQUAL"
       },
       {
         "field": "campaign.id",
         "value": [101, 102, 103],
         "operator": "IN"
       },
       {
         "field": "budget_reset_period",
         "value": ["LIFETIME"],
         "operator": "IN"
       },
       {
         "field": "hours_since_creation",
         "value": 48,
         "operator": "LESS_THAN"
       },
     ]
   }' \
-F 'execution_spec={
    ...
   }' \
-F "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<VERSION>/<AD_ACCOUNT_ID>/adrules_library
```

Here is an example of an `execution_spec`. This rule increases the budget of all matching objects by 10%, with a maximum execution limit of 5 times. This means that for every object that could potentially be matched, it could individually only have a 10% increase in budget at most five times.

```
curl \
-F 'name=Rule 1' \
-F 'schedule_spec={
    ...
   }' \
-F 'evaluation_spec={
    ...
   }' \
-F 'execution_spec={
     "execution_type": "CHANGE_BUDGET",
     "execution_options": [
       {
         "field": "change_spec",
         "value": {
           "amount": 10,
           "unit": "PERCENTAGE"
         },
         "operator": "EQUAL"
       },
       {
         "field": "execution_count_limit",
         "value": 5,
         "operator": "EQUAL"
       }
     ]
   }' \
-F "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<VERSION>/<AD_ACCOUNT_ID>/adrules_library
```

Here is another example. This rule pauses all matching objects and sends an email to a list of users.

```
curl \
-F 'name=Rule 1' \
-F 'schedule_spec={
    ...
   }' \
-F 'evaluation_spec={
    ...
   }' \
-F 'execution_spec={
     "execution_type": "PAUSE",
     "execution_options": [
       {
         "field": "user_ids",
         "value": [1001, 1002],
         "operator": "EQUAL"
       }
     ]
   }' \
-F "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<VERSION>/<AD_ACCOUNT_ID>/adrules_library
```
