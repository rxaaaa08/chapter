<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/ad-rule | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Ad Rule

## Reading

A Rule that will be triggered based on certain criteria defined on ad objects, and perform custom actions.

### Parameters

This endpoint doesn't have any parameters.

### Fields

| Field | Description |
| --- | --- |
| `id`numeric string | ID of the rule [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `account_id`numeric string | ID of the ad account that owns the rule |
| `created_by`[User](https://developers.facebook.com/docs/graph-api/reference/user/) | The user who created the rule |
| `created_time`datetime | Time when the rule was created |
| `disable_error_code`int32 | error_code explaining why this rule is disabled with issues |
| `name`string | The friendly name of a rule, optional for inline rules |
| `schedule_spec`[AdRuleScheduleSpec](https://developers.facebook.com/docs/marketing-api/reference/ad-rule-schedule-spec/) | Specifies the schedule with which a rule will be evaluated |
| `status`string | The status of a rule |
| `updated_time`datetime | The time when the rule was last updated. |

### Edges

| Edge | Description |
| --- | --- |
| [`history`](https://developers.facebook.com/docs/marketing-api/reference/ad-rule/history/)Edge<AdRuleHistory> | The execution history associated with this rule. Each entry represents a distinct run of the rule and provides any actions that may have been taken on any ad objects. |

### Error Codes

| Error | Description |
| --- | --- |
| 100 | Invalid parameter |
| 200 | Permissions error |

## Creating

You can make a POST request to `adrules_library` edge from the following paths:

* [`/act_{ad_account_id}/adrules_library`](https://developers.facebook.com/docs/marketing-api/reference/ad-account/adrules_library/)

When posting to this edge, an [AdRule](https://developers.facebook.com/docs/marketing-api/reference/ad-rule/) will be created.

### Parameters

| Parameter | Description |
| --- | --- |
| `account_id`numeric string | Ad Account ID. This is inferred from the path. |
| `evaluation_spec`Object | Defines the evaluation spec upon which a rule will be executed Required |
| `evaluation_type`enum{SCHEDULE, TRIGGER} | Required |
| `filters`list<Object> | Required |
| `field`string | Required |
| `value`numeric, string, boolean, list<>, or object-like arrays | Required |
| `operator`enum{GREATER_THAN, LESS_THAN, EQUAL, NOT_EQUAL, IN_RANGE, NOT_IN_RANGE, IN, NOT_IN, CONTAIN, NOT_CONTAIN, ANY, ALL, NONE} | Required |
| `trigger`Object |  |
| `type`enum{METADATA_CREATION, METADATA_UPDATE, STATS_MILESTONE, STATS_CHANGE, DELIVERY_INSIGHTS_CHANGE} | Required |
| `field`string |  |
| `value`numeric, string, boolean, list<>, or object-like arrays |  |
| `operator`enum{GREATER_THAN, LESS_THAN, EQUAL, NOT_EQUAL, IN_RANGE, NOT_IN_RANGE, IN, NOT_IN, CONTAIN, NOT_CONTAIN, ANY, ALL, NONE} |  |
| `execution_spec`Object | Defines the execution spec upon which a rule will be executed Required |
| `execution_type`enum{DCO, PING_ENDPOINT, NOTIFICATION, PAUSE, REBALANCE_BUDGET, CHANGE_BUDGET, CHANGE_BID, ROTATE, UNPAUSE, CHANGE_CAMPAIGN_BUDGET, ADD_INTEREST_RELAXATION, ADD_QUESTIONNAIRE_INTERESTS, INCREASE_RADIUS, UPDATE_CREATIVE, UPDATE_LAX_BUDGET, UPDATE_LAX_DURATION, AUDIENCE_CONSOLIDATION, AUDIENCE_CONSOLIDATION_ASK_FIRST, AD_RECOMMENDATION_APPLY} | Required |
| `is_once_off`boolean |  |
| `execution_options`list<Object> |  |
| `field`string | Required |
| `value`numeric, string, boolean, list<>, or object-like arrays | Required |
| `operator`enum{EQUAL, IN} | Required |
| `name`string | The friendly name of a rule, optional for inline rules Required |
| `schedule_spec`Object | Specifies the schedule with which a rule will be evaluated |
| `schedule_type`enum{DAILY, HOURLY, SEMI_HOURLY, CUSTOM} | Required |
| `schedule`list<Object> |  |
| `start_minute`int64 |  |
| `end_minute`int64 |  |
| `days`list<int64> |  |
| `status`enum {ENABLED, DISABLED, DELETED, HAS_ISSUES} | The status of a rule |

### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview/#read-after-write) and will read the node represented by `id` in the return type.

 Struct {

`id`: numeric string,

}

### Error Codes

| Error | Description |
| --- | --- |
| 200 | Permissions error |
| 100 | Invalid parameter |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |
| 2703 | Rules that turn off ads can't have cost conditions. You need to change the rule's conditions or action. |
| 190 | Invalid OAuth 2.0 Access Token |

## Updating

You can update an [AdRule](https://developers.facebook.com/docs/marketing-api/reference/ad-rule/) by making a POST request to [`/{ad_rule_id}`](https://developers.facebook.com/docs/marketing-api/reference/ad-rule/).

### Parameters

| Parameter | Description |
| --- | --- |
| `evaluation_spec`Object | Defines the evaluation spec upon which a rule will be executed |
| `evaluation_type`enum{SCHEDULE, TRIGGER} | Required |
| `filters`list<Object> | Required |
| `field`string | Required |
| `value`numeric, string, boolean, list<>, or object-like arrays | Required |
| `operator`enum{GREATER_THAN, LESS_THAN, EQUAL, NOT_EQUAL, IN_RANGE, NOT_IN_RANGE, IN, NOT_IN, CONTAIN, NOT_CONTAIN, ANY, ALL, NONE} | Required |
| `trigger`Object |  |
| `type`enum{METADATA_CREATION, METADATA_UPDATE, STATS_MILESTONE, STATS_CHANGE, DELIVERY_INSIGHTS_CHANGE} | Required |
| `field`string |  |
| `value`numeric, string, boolean, list<>, or object-like arrays |  |
| `operator`enum{GREATER_THAN, LESS_THAN, EQUAL, NOT_EQUAL, IN_RANGE, NOT_IN_RANGE, IN, NOT_IN, CONTAIN, NOT_CONTAIN, ANY, ALL, NONE} |  |
| `execution_spec`Object | Defines the execution spec upon which a rule will be executed |
| `execution_type`enum{DCO, PING_ENDPOINT, NOTIFICATION, PAUSE, REBALANCE_BUDGET, CHANGE_BUDGET, CHANGE_BID, ROTATE, UNPAUSE, CHANGE_CAMPAIGN_BUDGET, ADD_INTEREST_RELAXATION, ADD_QUESTIONNAIRE_INTERESTS, INCREASE_RADIUS, UPDATE_CREATIVE, UPDATE_LAX_BUDGET, UPDATE_LAX_DURATION, AUDIENCE_CONSOLIDATION, AUDIENCE_CONSOLIDATION_ASK_FIRST, AD_RECOMMENDATION_APPLY} | Required |
| `is_once_off`boolean |  |
| `execution_options`list<Object> |  |
| `field`string | Required |
| `value`numeric, string, boolean, list<>, or object-like arrays | Required |
| `operator`enum{EQUAL, IN} | Required |
| `name`string | The friendly name of a rule, optional for inline rules |
| `schedule_spec`Object | Specifies the schedule with which a rule will be evaluated |
| `schedule_type`enum{DAILY, HOURLY, SEMI_HOURLY, CUSTOM} | Required |
| `schedule`list<Object> |  |
| `start_minute`int64 |  |
| `end_minute`int64 |  |
| `days`list<int64> |  |
| `status`enum {ENABLED, DISABLED, DELETED, HAS_ISSUES} | The status of a rule |

### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview/#read-after-write) and will read the node to which you POSTed.

 Struct {

`success`: bool,

}

### Error Codes

| Error | Description |
| --- | --- |
| 200 | Permissions error |
| 2703 | Rules that turn off ads can't have cost conditions. You need to change the rule's conditions or action. |
| 100 | Invalid parameter |
| 190 | Invalid OAuth 2.0 Access Token |

## Deleting

You can delete an [AdRule](https://developers.facebook.com/docs/marketing-api/reference/ad-rule/) by making a DELETE request to [`/{ad_rule_id}`](https://developers.facebook.com/docs/marketing-api/reference/ad-rule/).

### Parameters

This endpoint doesn't have any parameters.

### Return Type

 Struct {

`success`: bool,

}

### Error Codes

| Error | Description |
| --- | --- |
| 200 | Permissions error |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |
| 100 | Invalid parameter |
