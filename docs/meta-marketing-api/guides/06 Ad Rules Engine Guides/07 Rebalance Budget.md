<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/rebalance-budget | Saved: 2026-09-19 -->

# Rebalance Budget Ad Rules



To create ROI-Based Budget Rebalancing rules, it is important to understand each individual component. ROI stands for Return On Investment.

In this page, you learn about each component in the rebalance rule, and how each parameter affects the way the rule runs.

## Schedule spec
For rebalancing rules, use either a `DAILY` or `CUSTOM` schedule, as the action should not be frequently occurring.

## Evaluation spec
The rule combines the evaluation criteria with the `rebalance_spec` to determine the lists of objects affected by rebalancing.

For all rebalance types, the list of objects that pass evaluation is the source of budgets. The list of recipients varies depending on the rebalance type specified, but for most of them (for example, `EVEN`) the recipients are the objects that did not pass evaluation.

For example, if your `EVEN` type rule criteria is `cost_per_mobile_app_install` > `2.50`, this means that all ad sets that have a cost per mobile app install greater than 2.50 will be paused, and their budgets moved to all ad sets that have a cost per mobile app install less than or equal to 2.50.

## Execution spec
The `rebalance_spec` determines exactly how the recipients get their budget. There are five parameters:

| Field | Description |
| --- | --- |
| `type` | **Required.**<br><br>Determines how the rule allocates the budgets. If the value is not `EVEN`, a `target_field` is required as well to perform the ranking.<br><br>**Supported Values:** `EVEN`, `PROPORTIONAL`, `NO_PAUSE_PROPORTIONAL`, `MATCHED_ONLY_PROPORTIONAL` |
| `target_field` | **Optional.**<br><br>Specifies the Insights metric used to rank the recipients. This is required if `type` is not `EVEN`, or if `target_count` also exists in the spec.<br><br>**Supported Values:** An Insights field, such as `cpa` or `impressions` |
| `target_count` | **Optional.**<br><br>Specifies the number (K) of recipients. The combination of this, `type`, and `target_field` determines the top K recipients that receive the budget. This is useful when you do not wish to move the budget to every possible recipient. If K is larger than the number of recipients, the rule rebalances to all of them. If this is specified, `target_field` is required.<br><br>**Supported Values:** A positive integer, such as `5` |
| `is_cross_campaign` | **Optional.**<br><br>Specifies whether or not you allow budgets to be allocated across ad campaigns. If this is not specified or `false`, the rule only moves budgets within ad campaigns. If this is `true`, the rule evaluates and executes all ad sets together, which can result in budgets shifting between ad campaigns.<br><br>**Supported Values:** A boolean value, such as `true` or `false` |
| `is_inverse` | **Optional.**<br><br>Specifies whether or not recipients should be ranked from high to low of the inverse of their `target_field` values. This is useful if you want to rank the lowest actual values highest.<br><br>**Supported Values:** A boolean value, such as `true` or `false` |

## Specific nuances
There are some specific nuances regarding this action:

### Daily and lifetime budgets

If the ad sets to be rebalanced contain both Daily and Lifetime budgets, the rule separates the ad sets into the two buckets. This means that ad sets only move their Daily budgets to other ad sets that have Daily budgets. The same happens with Lifetime budgets.

For ad sets with Lifetime budgets, the rule takes their leftover budget - the difference between their Lifetime budget and Lifetime spend - when determining the amount of budget they can allocate. This ensures that the total budget on the ad campaign level is unchanged.

### `rebalance_spec` types

For `EVEN` and `PROPORTIONAL` types, the rule pauses the matched objects (the donors of the budget to the recipients). When the rule pauses these objects, it does not adjust their budgets in any way, because:

- You don't need to worry about their delivery, since they are paused
- It does not make sense to have no budget on any ad set

This means that if you re-enable the ad set afterwards, it retains the same budget it had before. This can be seen when interacting with the paused object and fetching its budget data.

For `NO_PAUSE_PROPORTIONAL` type, the rule does not pause the matched objects. It determines how much budget to adjust by looking at all the objects (donors and recipients) together and ranking their performance. This guarantees that budget is only moved from donors to recipients. This setup avoids a situation where rebalancing results in a well-performing ad set donating instead to an underperforming ad set simply due to how much budget it has. The [Example](#example) section demonstrates this behavior.

For `MATCHED_ONLY_PROPORTIONAL` type, the rule only looks at the matched objects. Again, the rule does not pause them. It ranks them among themselves and redistributes their budgets based on how they perform against each other. This means that the rule takes the total budget from all the donors and proportionally shares that with the same list of donors. The [Example](#example) section demonstrates this behavior.

For types ending in `PROPORTIONAL`, the rule distributes more budgets to ad sets that are performing better based on the `target_field` defined. For example, if the metric is `reach` and you have two recipient ad sets that have 10 and 20 `reach`, the rule allocates 33.3% and 66.6% of the budget pool to these ad sets, respectively. If the type is `EVEN`, they would each get 50%.

### `is_inverse` flag
The `is_inverse` flag is useful for metrics such as `cost_per_mobile_app_install`, where a lower metric number means a higher performing ad set. The example below reemphasizes this: ad sets with a lower such value get a higher portion of the budget allocation.

### Example
Here's an example of a rebalance rule that:

- Pauses all under-performing ad sets in the ad account
- Shifts their budgets to the rest

You define under-performing as stably having a high `cost_per_mobile_app_install`. You proportionally allocate the budget from all under-performing ad sets to the best 10 ad sets in the ad account. This rule runs at 8AM every day, while looking at lifetime data.

```
curl \
-F 'name=Test Rebalance Rule' \
-F 'schedule_spec={
     "schedule_type": "CUSTOM",
     "schedule": [
       {
          "start_minute": 480
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
         "field": "mobile_app_install",
         "value": 100,
         "operator": "GREATER_THAN"
       },
       {
         "field": "cost_per_mobile_app_install",
         "value": 3.0,
         "operator": "GREATER_THAN"
       }
     ]
   }' \
-F 'execution_spec={
     "execution_type": "REBALANCE_BUDGET",
     "execution_options": [
       {
         "field": "rebalance_spec",
         "value": {
           "type": "INVERSE_PROPORTIONAL",
           "target_field": "cost_per_mobile_app_install",
           "target_count": 10,
           "is_cross_campaign": true
         },
         "operator": "EQUAL"
       },
     ]
   }' \
-F "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<VERSION>/<AD_ACCOUNT_ID>/adrules_library
```

Here, the rule:

- Pauses and evenly rebalances the budget of all ad sets every day that have reached a high percentage of their audience size
- But do not allow budgets to shift across ad campaigns

```
curl \
-F 'name=Test Rebalance Rule' \
-F 'schedule_spec={
     "schedule_type": "DAILY"
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
         "field": "audience_reached_percentage",
         "value": 70,
         "operator": "GREATER_THAN"
       }
     ]
   }' \
-F 'execution_spec={
     "execution_type": "REBALANCE_BUDGET",
     "execution_options": [
       {
         "field": "rebalance_spec",
         "value": {
           "type": "EVEN"
         },
         "operator": "EQUAL"
       },
     ]
   }' \
-F "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<VERSION>/<AD_ACCOUNT_ID>/adrules_library
```

Here's an example leveraging the `NO_PAUSE_PROPORTIONAL` type. In this case, the rule reallocates the budget from ad sets within ad campaigns that have a low amount of video views. However, in this case ad sets are not paused, and are left with a proportional amount of budget.

Here's a numeric example of what happens:

- Considering, you have ad sets `1-5` with `video_view` of `1-5`, `3000` daily budget each, and the below rule.
- First, the rule takes the `6000` budget from ad sets `1` and `2`, and determines proportionally how to distribute that. In this case, each ad set has ratios of `1/15` up to `5/15`.
- As a result, ad sets end up having values of `400`, `800`, `4200`, `4600`, and `5000` respectively. This guarantees that the recipients (ad sets `1`, `2`, and `3`) always increase their budget.

```
curl \
-F 'name=Test Rebalance Rule' \
-F 'schedule_spec={
     "schedule_type": "DAILY"
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
         "field": "video_view",
         "value": 3,
         "operator": "LESS_THAN"
       },
     ]
   }' \
-F 'execution_spec={
     "execution_type": "REBALANCE_BUDGET",
     "execution_options": [
       {
         "field": "rebalance_spec",
         "value": {
           "type": "NO_PAUSE_PROPORTIONAL",
           "target_field": "video_view"
         },
         "operator": "EQUAL"
       },
     ]
   }' \
-F "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<VERSION>/<AD_ACCOUNT_ID>/adrules_library
```

Finally, here's an example that leverages `MATCHED_ONLY_PROPORTIONAL`. In this case, you don't need to worry about unmatched objects. The focus is on ad sets that satisfy the rule's filters. You can use the same example above, except now there is no need to determine the two lists based on how underperforming ad sets are.

With the same numeric example above, the rule uses all the budgets in the pool (`15000`) and distributes it proportionally. As a result, ad sets `1-5` would end up with `1000-5000` budget.

The main downside to this `type` is that there is no guarantee that better performing ad sets won't end up losing budget, especially in cases of unbalanced budget values. All else being the same, if ad set `5` had started with `18000` budget, it would end up losing `8000` of its budget.

```
curl \
-F 'name=Test Rebalance Rule' \
-F 'schedule_spec={
     "schedule_type": "DAILY"
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
     ]
   }' \
-F 'execution_spec={
     "execution_type": "REBALANCE_BUDGET",
     "execution_options": [
       {
         "field": "rebalance_spec",
         "value": {
           "type": "MATCHED_ONLY_PROPORTIONAL",
           "target_field": "video_view"
         },
         "operator": "EQUAL"
       },
     ]
   }' \
-F "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<VERSION>/<AD_ACCOUNT_ID>/adrules_library
```
