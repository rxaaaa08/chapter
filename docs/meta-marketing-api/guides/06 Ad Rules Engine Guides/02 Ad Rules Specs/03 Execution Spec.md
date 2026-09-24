<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/overview/execution-spec | Saved: 2026-09-19 -->

# Execution Spec



The `execution_spec` of a rule determines the action that applies to all objects that pass evaluation. [Schedule](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/scheduled-based-rules) and [Trigger Based Rules](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/trigger-based-rules) support different actions. Actions are listed under `execution_type`.

| Execution Type | Description |
| --- | --- |
| `NOTIFICATION` | Sends a jeweled notification to this rule's creator, or the list of users specified in `user_ids`, if this option is provided.<br><br>**Supported Evaluation Types:** `SCHEDULE`, `TRIGGER` |
| `PAUSE` | Pauses the objects.<br><br>**Supported Evaluation Types:** `SCHEDULE`, `TRIGGER` |
| `UNPAUSE` | Unpauses the objects.<br><br>**Supported Evaluation Types:** `SCHEDULE`, `TRIGGER` |
| `CHANGE_BUDGET` | Changes the budgets based on a defined [`change_spec`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/overview/change-spec). This applies to ad sets only.<br><br>**Supported Evaluation Types:** `SCHEDULE` |
| `CHANGE_CAMPAIGN_BUDGET` | Changes the budgets based on a defined [`change_spec`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/overview/change-spec). This applies to ad campaigns only.<br><br>**Supported Evaluation Types:** `SCHEDULE` |
| `CHANGE_BID` | Changes the bids based on a defined [`change_spec`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/overview/change-spec). This applies to ad sets only.<br><br>**Supported Evaluation Types:** `SCHEDULE` |
| `ROTATE` | Pauses the currently active ad, and activates the next ad by ID in the ad set. Requires an `id` filter of ad sets, and an `entity_type` filter of an ad.<br><br>**Supported Evaluation Types:** `SCHEDULE` |
| [`REBALANCE_BUDGET`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/rebalance-budget) | Pauses the objects that match the evaluation criteria, and rebalances their budgets towards the rest based on a defined `rebalance_spec`. This applies to ad sets only.<br><br>**Supported Evaluation Types:** `SCHEDULE` |
| `PING_ENDPOINT` | Sends a ping to the application's subscription via Webhooks. See [Trigger Based Rules for more details on setup](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/trigger-based-rules).<br><br>**Supported Evaluation Types:** `TRIGGER` |

## `execution_options`

You may need to provide additional information to perform some of these actions. The `execution_spec` provides an optional `execution_options` array to specify these additional parameters. The array contains a list of `execution_option` objects, which are dictionaries with keys of `field`, `value`, and `operator` just like [Evaluation Spec's `filter` objects](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/overview/evaluation-spec).

**Note:** [Trigger Based Rules](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/trigger-based-rules) do not require any execution options.

Below, see supported execution options, which `execution_type` values they support, and how to structure them. Currently, the only supported operator for all options is `EQUAL`.

| Execution Option Field | Description |
| --- | --- |
| `user_ids`* | Jeweled notification recipients for `NOTIFICATION`, or recipients for [Schedule Based Rules](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/scheduled-based-rules) summary emails for each `execution_type`.<br><br>**Supported Execution Types:** ALL `execution_type` supported by [Schedule Based Rules](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/scheduled-based-rules)<br><br>**Value (Example):** `array ([123, 456])` |
| [`change_spec`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/overview/change-spec) | Specifies `amount`, `limit`, `unit`, and `target_field`. Required as a dictionary for the supported types. If `target_field` exists, the bid or budget scale based on the difference between the current value of the target field and the target value specified in `amount`. The `target_field` must be a valid Insights filter.<br><br>**Supported Execution Types:** `CHANGE_BUDGET`, `CHANGE_BID`<br><br>**Value (Example):** [Ad Rules Change Spec Examples](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/overview/change-spec) |
| `rebalance_spec` | Supports different options that determine how budgets are rebalanced. See [example](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/rebalance-budget) for more details.<br><br>**Supported Execution Types:** `REBALANCE_BUDGET`<br><br>**Value (Example):** [Rebalance Budget Ad Rules](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/rebalance-budget) |
| `execution_count_limit` | Specifies the maximum number of times a budget/bid change action is taken for each individual ad object for the rule. If not specified, it defaults to no limit.<br><br>**Supported Execution Types:** `CHANGE_BUDGET`, `CHANGE_BID`<br><br>**Value (Example):** int (123) |
| `action_frequency` | Specifies the minimum amount of minutes until the same action can be taken on an object by a rule. For example, if value is `10080` for a `CHANGE_BUDGET` rule, and budget was just increased by that rule for object A. That rule does not increase the budget for object A for at least a week, even if object A passes the rule evaluation during that week.<br><br>**Supported Execution Types:** `CHANGE_BUDGET`, `CHANGE_BID`<br><br>**Value (Example):** int (123) |

## `user_ids`
If `user_ids` are provided for [Schedule Based Rules](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/scheduled-based-rules):

- we generate a daily email to summarize actions performed by your rule within the last 24 hours
- we send the information to the list of users specified under `user_ids`
- the email is sent at 12:30AM, using the ad account's time zone

This summary email aggregates notifications for all rules to which each user is subscribed. If no actions are performed by any of the subscribed rules, the user does not get an email for that day.
