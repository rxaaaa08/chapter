<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/overview/evaluation-spec | Saved: 2026-09-19 -->

# Evaluation Spec



The main purpose of the `evaluation_spec` of a rule is to determine the objects upon which the rule should execute its action. The `evaluation_type` determines the type of evaluation method and has the following options:

| Evaluation Type | Description |
| --- | --- |
| `SCHEDULE` | For [Schedule Based Rules](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/scheduled-based-rules) |
| `TRIGGER` | For [Trigger Based Rules](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/trigger-based-rules) |

The `evaluation_spec` contains a `filters` array, which allows you to further narrow the list of matched objects. For example, you can construct filters on ad, ad set and ad campaign metadata and Insights metrics. **All filters are evaluated together using the `AND` operator.**

The `filters` array contains a list of filter objects. These objects are dictionaries with keys of `field`, `value`, and `operator`:

| Filter Object Keys | Description |
| --- | --- |
| `field` | **Required.**<br><br>Filter field, such as Insights data or metadata |
| `value` | **Required.**<br><br>Static filter value for the field |
| `operator` | **Required.**<br><br>Logical operator for the field |

Each filter has a list of supported logical operators. Here are the logical operators supported in `SCHEDULE` and `TRIGGER` rules:

| Logical Operator | Value (Example) |
| --- | --- |
| `GREATER_THAN` | numeric (100) |
| `LESS_THAN` | numeric (100) |
| `EQUAL` | numeric (100) |
| `NOT_EQUAL` | numeric (100) |
| `IN_RANGE` | tuple ([100, 200]) |
| `NOT_IN_RANGE` | tuple ([100, 200]) |
| `IN` | list (["1", "2", "3"]) |
| `NOT_IN` | list (["1", "2", "3"]) |
| `CONTAIN` | string ("ABC") |
| `NOT_CONTAIN` | string ("ABC") |
| `ANY` | list ([1, 2, 3]) |
| `ALL` | list ([1, 2, 3]) |
| `NONE` | list ([1, 2, 3]) |

The `evaluation_spec` requires a `trigger` for the `TRIGGER` evaluation type. The trigger contains a type and an underlying filter specification. Filter specification can be `field`, `value`, and `operator`.

The trigger dynamically determines whether or not we should evaluate a rule, and you can have only one. See [Trigger Based Rules](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/trigger-based-rules) for more information.

Below we define some special filters and general groups of filters that you can use.

## Special Filters

### `time_preset`

The `time_preset` filter determines the time period over which we aggregate Insights metrics. Currently, we only allow one `time_preset`. It applies to all stats filters in the rule, including the one used for the trigger, if present.

The only supported operator for `time_preset` is `EQUAL`, and this is required as long as any Insights filter or trigger is present. Trigger Based Rules only support time presets that include `TODAY` because it performs real-time evaluation.

Time presets for rules can behave differently from other interfaces. Some of the time presets here include today's data. This is because today's data is critical for rules that run more than once a day. For other interfaces, a preset value of `LAST_N_DAYS` generally does not include today's data. See the descriptions below for more details.

```
{
  "field": "time_preset",
  "value": "TODAY",
  "operator": "EQUAL"
}
```

| Time Preset Values | Description |
| --- | --- |
| `LIFETIME` | Lifetime of the object |
| `TODAY` | The current day starting from midnight in the ad account's timezone |
| `LAST_2_DAYS` | `YESTERDAY` and `TODAY` |
| `LAST_3_DAYS` | Last 2 full days and `TODAY` |
| `LAST_7_DAYS` | Last 6 full days and `TODAY` |
| `LAST_14_DAYS` | Last 13 full days and `TODAY` |
| `LAST_28_DAYS` | Last 27 full days and `TODAY` |
| `LAST_30_DAYS` | Last 29 full days and `TODAY` |
| `THIS_MONTH` | This month, including `TODAY` |
| `THIS_WEEK_MON_TODAY` | This week using Monday as first day of week, including `TODAY` |
| `THIS_WEEK_SUN_TODAY ` | This week using Sunday as first day of week, including `TODAY` |
| `YESTERDAY` | The previous full day, excluding `TODAY` |
| `LAST_2D` | Last 2 full days, excluding `TODAY` |
| `LAST_3D` | Last 3 full days, excluding `TODAY` |
| `LAST_7D` | Last 7 full days, excluding `TODAY` |
| `LAST_14D` | Last 14 full days, excluding `TODAY` |
| `LAST_28D` | Last 28 full days, excluding `TODAY` |
| `LAST_30D` | Last 30 full days, excluding `TODAY` |
| `LAST_ND_14_8` | Last 14 days to Last 7 days, for [ROAS](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/roas-ad-rules) |
| `LAST_ND_30_8` | Last 30 days to Last 7 days, for [ROAS](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/roas-ad-rules) |
| `LAST_ND_60_8` | Last 60 days to Last 7 days, for [ROAS](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/roas-ad-rules) |
| `LAST_ND_120_8` | Last 120 days to Last 7 days, for [ROAS](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/roas-ad-rules) |
| `LAST_ND_180_8` | Last 180 days to Last 7 days, for [ROAS](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/roas-ad-rules) |
| `LAST_ND_LIFETIME_8` | Lifetime to Last 7 days, for [ROAS](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/roas-ad-rules) |
| `LAST_ND_60_29` | Last 60 days to Last 28 days, for [ROAS](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/roas-ad-rules) |
| `LAST_ND_120_29` | Last 120 days to Last 28 days, for [ROAS](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/roas-ad-rules) |
| `LAST_ND_180_29` | Last 180 days to Last 28 days, for [ROAS](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/roas-ad-rules) |
| `LAST_ND_LIFETIME_29` | Lifetime to Last 28 days, for [ROAS](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/roas-ad-rules) |

### `attribution_window`

The `attribution_window` filter determines the lookback window over which insights metrics are aggregated. For more information, see the Insights documentation on [Attribution Windows](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights#sample).

Currently, we only allow one `attribution_window`, and it applies to all stats filters in the rule. The only supported operator for `attribution_window` is `EQUAL`, and this is only supported by Schedule Based Rules.

Whether specified or not, the only allowed `value` for the `attribution_window` is `ACCOUNT_DEFAULT`.

```
{
  "field": "attribution_window",
  "value": "ACCOUNT_DEFAULT",
  "operator": "EQUAL"
}
```

| Attribution Window Values | Description |
| --- | --- |
| `ACCOUNT_DEFAULT` | Use the account level attribution window setting |

## Metadata filters {#metadata-filters}

With metadata filters, you can filter objects based on the current state of their metadata fields. These also support multi-level filtering, which means you can use prefixes to apply a metadata filter on an object's parent or grandparent. This does not affect other filters. Insights filters still apply to the normal object.

**Note:** All metadata filters are supported for Scheduled Rules, but only a subset are supported for Trigger Rules.

For instance, if you want a rule that applies to ad sets of ad campaigns whose objective is `WEBSITE_CLICKS`, you can include two filters:

```
 "filters" : [
  {
    "field": "entity_type",
    "value": "ADSET",
    "operator": "EQUAL",
  },
  {
    "field": "campaign.objective",
    "value": "WEBSITE_CLICKS",
    "operator": "EQUAL"
  }
]
```

### Metadata filters supported by Trigger and Schedule Based rules

| Metadata Field | Description |
| --- | --- |
| `id` | Specific static objects for which the rule is applied.<br><br>**Supported Prefixes:** ad, ad set, ad campaign<br><br>**Supported Values:** `int`, `array(int)`<br><br>**Supported Operators:** `EQUAL`, `IN`, `NOT_IN` |
| `entity_type` | The object level for which the rule is applied.<br><br>**Supported Prefixes:** none<br><br>**Supported Values:** `AD`, `ADSET`, `CAMPAIGN`<br><br>**Supported Operators:** `EQUAL` |
| `name` | Name of the object, by partial or complete match.<br><br>**Supported Prefixes:** ad, ad set, ad campaign<br><br>**Supported Values:** `string`<br><br>**Supported Operators:** `EQUAL`, `CONTAIN`, `NOT_CONTAIN` |
| `adlabel_ids` | Ad label ids of the object.<br><br>**Supported Prefixes:** ad, ad set, ad campaign<br><br>**Supported Values:** `array(int)`<br><br>**Supported Operators:** `ANY`, `ALL`, `NONE` |
| `objective` | Objective of the ad campaign of the object.<br><br>**Supported Prefixes:** ad campaign<br><br>**Supported Values:** `array(APP_INSTALLS, BRAND_AWARENESS, CONVERSIONS, EVENT_RESPONSES, LINK_CLICKS, ...)`<br><br>**Supported Operators:** `IN`, `NOT_IN` |
| `start_time` | Start epoch time of the object.<br><br>**Supported Prefixes:** ad set, ad campaign<br><br>**Supported Values:** `int`<br><br>**Supported Operators:** `GREATER_THAN`, `LESS_THAN`, `IN_RANGE`, `NOT_IN_RANGE` |
| `stop_time` | Stop epoch time of the object.<br><br>**Supported Prefixes:** ad set, ad campaign<br><br>**Supported Values:** `int`<br><br>**Supported Operators:** `GREATER_THAN`, `LESS_THAN` |
| `buying_type` | Buying type of the ad campaign of the object.<br><br>**Supported Prefixes:** ad campaign<br><br>**Supported Values:** `array(AUCTION, FIXED_CPM, RESERVED)`<br><br>**Supported Operators:** `IN`, `NOT_IN` |
| `billing_event` | Billing event of the ad set of the object.<br><br>**Supported Prefixes:** ad set<br><br>**Supported Values:** `array(APP_INSTALLS, LINK_CLICKS, IMPRESSIONS, ...)`<br><br>**Supported Operators:** `IN`, `NOT_IN` |
| `optimization_goal` | Optimization goal of the ad set of the object.<br><br>**Supported Prefixes:** ad set<br><br>**Supported Values:** `array(APP_INSTALLS, LINK_CLICKS, IMPRESSIONS, ...)`<br><br>**Supported Operators:** `IN`, `NOT_IN` |
| `is_autobid` | Autobid status of the ad set of the object.<br><br>**Supported Prefixes:** ad set<br><br>**Supported Values:** `array(bool)`<br><br>**Supported Operators:** `IN`, `NOT_IN` |
| `daily_budget` | Daily budget of the ad set of the object.<br><br>**Supported Prefixes:** ad set<br><br>**Supported Values:** `int`<br><br>**Supported Operators:** `GREATER_THAN`, `LESS_THAN`, `IN_RANGE`, `NOT_IN_RANGE` |
| `lifetime_budget` | Lifetime budget of the ad set of the object.<br><br>**Supported Prefixes:** ad set<br><br>**Supported Values:** `int`<br><br>**Supported Operators:** `GREATER_THAN`, `LESS_THAN`, `IN_RANGE`, `NOT_IN_RANGE` |
| `spend_cap` | Spend cap of the ad campaign of the object.<br><br>**Supported Prefixes:** ad campaign<br><br>**Supported Values:** `int`<br><br>**Supported Operators:** `GREATER_THAN`, `LESS_THAN`, `IN_RANGE`, `NOT_IN_RANGE` |
| `bid_amount` | Bid amount of the object.<br><br>**Supported Prefixes:** ad, ad set<br><br>**Supported Values:** `int`<br><br>**Supported Operators:** `GREATER_THAN`, `LESS_THAN`, `IN_RANGE`, `NOT_IN_RANGE` |
| `created_time` | Created epoch time of the object.<br><br>**Supported Prefixes:** ad, ad set, ad campaign<br><br>**Supported Values:** `int`<br><br>**Supported Operators:** `GREATER_THAN`, `LESS_THAN`, `IN_RANGE`, `NOT_IN_RANGE` |
| `updated_time` | Updated epoch time of the object.<br><br>**Supported Prefixes:** ad, ad set, ad campaign<br><br>**Supported Values:** `int`<br><br>**Supported Operators:** `GREATER_THAN`, `LESS_THAN`, `IN_RANGE`, `NOT_IN_RANGE` |

### Metadata filters supported only by Schedule Based rules

| Metadata Field | Description |
| --- | --- |
| `effective_status` | Effective statuses of the object.<br><br>**Supported Prefixes:** ad, ad set, ad campaign<br><br>**Supported Values:** `array(ACTIVE, PAUSED, ADSET_PAUSED, CAMPAIGN_PAUSED, PENDING_REVIEW, ARCHIVED, DELETED, DISAPPROVED, PREAPPROVED, PENDING_BILLING_INFO)`<br><br>**Supported Operators:** `IN`, `NOT_IN` |
| `placement.page_types` | Page types for placement of the ad set of the object.<br><br>**Supported Prefixes:** ad set<br><br>**Supported Values:** `array(DESKTOPFEED, HOME, INSTAGRAMSTREAM, INSTAGRAMSTORY, ...)`<br><br>**Supported Operators:** `ANY`, `ALL`, `NONE` |
| `budget_reset_period` | Budget reset period of the ad set of the object.<br><br>**Supported Prefixes:** ad set<br><br>**Supported Values:** `array(DAY, LIFETIME)`<br><br>**Supported Operators:** `IN`, `NOT_IN` |
| `hours_since_creation` | Hours since `created_time` of the object.<br><br>**Supported Prefixes:** ad, ad set, ad campaign<br><br>**Supported Values:** `int`<br><br>**Supported Operators:** `GREATER_THAN`, `LESS_THAN`, `IN_RANGE`, `NOT_IN_RANGE` |
| `estimated_budget_spending_percentage` | Estimated percentage of your ad set's budget to be spent by the end of its schedule. This uses the same mechanism as our [Ad Sets, Budget Rebalancing](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview#rebalance) feature, so it works with any budget type, but requires 10 hours of delivery per day.<br><br>**Supported Prefixes:** ad set<br><br>**Supported Values:** `int`<br><br>**Supported Operators:** `GREATER_THAN`, `LESS_THAN`, `IN_RANGE`, `NOT_IN_RANGE` |
| `audience_reached_percentage` | Estimated percentage of your ad set's reach against its audience size.<br><br>**Supported Prefixes:** ad set<br><br>**Supported Values:** `int`<br><br>**Supported Operators:** `GREATER_THAN`, `LESS_THAN`, `IN_RANGE`, `NOT_IN_RANGE` |
| `active_time` | Seconds since the object had an effective status of `ACTIVE`. If the object is not currently `ACTIVE`, this returns `0`.<br><br>**Supported Prefixes:** ad, ad set, ad campaign<br><br>**Supported Values:** `int`<br><br>**Supported Operators:** `GREATER_THAN`, `LESS_THAN`, `IN_RANGE`, `NOT_IN_RANGE` |
| `current_time` | Current epoch time.<br><br>**Supported Prefixes:** none<br><br>**Supported Values:** `int`<br><br>**Supported Operators:** `GREATER_THAN`, `LESS_THAN`, `IN_RANGE`, `NOT_IN_RANGE` |

### `entity_type` and `id`

For every rule of evaluation type `SCHEDULE` or `TRIGGER`, you must specify either an `entity_type` or `id` filter.

When you specify an `entity_type` filter, you determine a dynamic object level for which to apply the rule. For example, if the `entity_type` is `AD`, that rule automatically evaluates every new ad that added to the ad account. This happens regardless of when you create the rule. By specifying an `id` filter, the rule only applies to a static list of objects.

When you specify an `id` filter **with no prefix**, we automatically compute the object level for which to apply the rule. For example, if you want to apply a rule to ads `[123, 456]`, you only need **one** filter field `id`, value `[123, 456]`, and operator `IN`. In this case, `entity_type` not required, since you provided an initial static list of objects, and we can compute the object level from those objects.

You can use `entity_type` and `id` in conjunction with multi-level filtering. For example, if you want a rule that applies to all ads under some specified ad sets, you can have an `entity_type` filter of `AD` and an `adset.id` filter with the specified ad sets.

By default, if you do not specify an `effective_status` filter, we implicitly add an `effective_status` filter when evaluating the rule.

For all execution types that act upon active objects, this default filter has an operator of `IN` and a value of `['ACTIVE', 'PENDING_REVIEW']`. This means the rule only evaluates objects that have or will have active delivery. For execution types that do not act upon active objects (`UNPAUSE`), we add this filter with an operator of `NOT_IN` and a value of `['DELETED', 'ARCHIVED']`. The default filter is an internal optimization for our execution types.

## Insights Filters {#insights-filters}

We evaluate insights filters against the current values returned from Insights API for a given `time_preset`. These filters apply directly to the list or level of objects, and do not support multi-level filtering. All Insights filters support the following operators: `GREATER_THAN`, `LESS_THAN`, `EQUAL`, `IN_RANGE`, `NOT_IN_RANGE`.

**Note:** The units represented here are based on the currency's base in the Marketing API. For example, for USD, the base unit is the cent, which means that a value of 1000 for spent is equivalent to $10.00.

For a description of each of the fields below, see the [Insights API docs](https://developers.facebook.com/docs/marketing-api/insights/fields). All of these filters are supported by Schedule Based Rules.

Below is a list of Insights filters and whether they are supported by Trigger Based Rules:

| Insights Field | Allowed for Trigger Based Rules? |
| --- | --- |
| `mobile_app_purchase_roas` ([Example](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/roas-ad-rules)) | No |
| `website_purchase_roas` ([Example](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/roas-ad-rules)) | No |
| `impressions` | Yes |
| `unique_impressions` | Yes |
| `clicks` | Yes |
| `unique_clicks` | Yes |
| `spent` | Yes |
| `results` | Yes |
| `cost_per` | Yes |
| `cpc` | Yes |
| `cpm` | Yes |
| `ctr` | Yes |
| `cpa` | Yes |
| `cpp` | Yes |
| `reach` | Yes |
| `frequency` | Yes |
| `leadgen` | Yes |
| `link_ctr` | Yes |
| `cost_per_unique_click` | Yes |
| `result_rate` | Yes |
| `mobile_app_install` | Yes |
| `cost_per_mobile_app_install` | Yes |
| `app_custom_event` | Yes |
| `app_custom_event.fb_mobile_achievement_unlocked` | Yes |
| `app_custom_event.fb_mobile_activate_app` | Yes |
| `app_custom_event.fb_mobile_add_payment_info` | Yes |
| `app_custom_event.fb_mobile_add_to_cart` | Yes |
| `app_custom_event.fb_mobile_add_to_wishlist` | Yes |
| `app_custom_event.fb_mobile_complete_registration` | Yes |
| `app_custom_event.fb_mobile_content_view` | Yes |
| `app_custom_event.fb_mobile_initiated_checkout` | Yes |
| `app_custom_event.fb_mobile_level_achieved` | Yes |
| `app_custom_event.fb_mobile_purchase` | Yes |
| `app_custom_event.fb_mobile_rate` | Yes |
| `app_custom_event.fb_mobile_search` | Yes |
| `app_custom_event.fb_mobile_spent_credits` | Yes |
| `app_custom_event.fb_mobile_tutorial_completion` | Yes |
| `app_custom_event.other` | Yes |
| `cost_per_mobile_achievement_unlocked` | Yes |
| `cost_per_mobile_activate_app` | Yes |
| `cost_per_mobile_add_payment_info` | Yes |
| `cost_per_mobile_add_to_cart` | Yes |
| `cost_per_mobile_add_to_wishlist` | Yes |
| `cost_per_mobile_complete_registration` | Yes |
| `cost_per_mobile_content_view` | Yes |
| `cost_per_mobile_initiated_checkout` | Yes |
| `cost_per_mobile_level_achieved` | Yes |
| `cost_per_mobile_purchase` | Yes |
| `cost_per_mobile_rate` | Yes |
| `cost_per_mobile_search` | Yes |
| `cost_per_mobile_spent_credits` | Yes |
| `cost_per_mobile_tutorial_completion` | Yes |
| `offline_conversion` | No |
| `offline_conversion.add_payment_info` | No |
| `offline_conversion.add_to_cart` | No |
| `offline_conversion.add_to_wishlist` | No |
| `offline_conversion.complete_registration` | No |
| `offline_conversion.initiate_checkout` | No |
| `offline_conversion.lead` | No |
| `offline_conversion.other` | No |
| `offline_conversion.purchase` | No |
| `offline_conversion.search` | No |
| `offline_conversion.view_content` | No |
| `cost_per_offline_conversion` | No |
| `cost_per_offline_other` | No |
| `offsite_conversion` | Yes |
| `offsite_conversion.fb_pixel_add_payment_info` | Yes |
| `offsite_conversion.fb_pixel_add_to_cart` | Yes |
| `offsite_conversion.fb_pixel_add_to_wishlist` | Yes |
| `offsite_conversion.fb_pixel_complete_registration` | Yes |
| `offsite_conversion.fb_pixel_initiate_checkout` | Yes |
| `offsite_conversion.fb_pixel_lead` | Yes |
| `offsite_conversion.fb_pixel_purchase` | Yes |
| `offsite_conversion.fb_pixel_search` | Yes |
| `offsite_conversion.fb_pixel_view_content` | Yes |
| `offsite_conversion.fb_pixel_other` | Yes |
| `cost_per_add_payment_info_fb` | Yes |
| `cost_per_add_to_cart_fb` | Yes |
| `cost_per_add_to_wishlist_fb` | Yes |
| `cost_per_complete_registration_fb` | Yes |
| `cost_per_initiate_checkout_fb` | Yes |
| `cost_per_lead_fb` | Yes |
| `cost_per_purchase_fb` | Yes |
| `cost_per_search_fb` | Yes |
| `cost_per_view_content_fb` | Yes |
| `link_click` | Yes |
| `cost_per_link_click` | Yes |
| `like` | Yes |
| `offsite_engagement` | Yes |
| `post` | Yes |
| `post_comment` | Yes |
| `post_engagement` | Yes |
| `cost_per_post_engagement` | No |
| `post_like` | Yes |
| `post_reaction` | Yes |
| `view_content` | Yes |
| `video_play` | Yes |
| `vote` | Yes |
| `unique_clicks` | No |
| `reach` | No |
| `lifetime_impressions` | No |
| `lifetime_spent` | No |
| `today_spent` | No |
| `yesterday_spent` | No |

## Advanced Filters {#advanced-filters}

You can customize and derive advanced fields based off the insights and metadata filters above. For more information, see [Advanced Evaluation Spec Filters](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/evaluation-spec-filters).

Advanced filters support the following operators: `GREATER_THAN`, `LESS_THAN`, `EQUAL`, `IN_RANGE`, `NOT_IN_RANGE`. **They are only supported by Schedule Based Rules.**

For some of the most commonly used advanced filters, we support an alias as the filter:

| Advanced Field Alias | Derived From |
| --- | --- |
| `daily_ratio_spent` | `today_spent / adset.daily_budget` |
| `lifetime_ratio_spent` | `lifetime_spent / adset.lifetime_budget` |

