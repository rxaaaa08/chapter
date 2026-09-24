<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/evaluation-spec-filters | Saved: 2026-09-19 -->

# Evaluation spec filters


You can use more advanced filter fields in schedule-based rules.

## Prefixed insights fields
You can set specific types of prefixes for Insights filters. This is similar to prefixes set for Metadata filters to perform multi-level filtering.

You can set an object level prefix on a filter to use Insights multi-level filtering. For example, an ad rule can be filtered by ad set or ad campaign performance. You can also specify attribution window and time preset prefixes on a filter. Use these prefixes to override the rule's attribution window and time preset for this particular filter.

### Usage
Prefixes are optional. A field can have:

- an object level prefix
- an attribution window prefix
- a time preset prefix

You can have all the options above, none, or any combination, as long as you keep them in that order. The field should have the following format:

{ `object_level_prefix?` } {`attribution_window_prefix?`} { `time_preset_prefix?` } { `field_name` }

Below, see examples of correct and incorrect prefixed Insights fields. This guide also shows examples of correct and incorrect prefixed Metadata fields.

##### Examples for Insights field `spent`
###### Good examples
✅ `adset.yesterday_spent` - total amount spent at the ad set level yesterday

✅ `adset.spent` - total amount spent at ad set level

✅ `yesterday_spent` - total amount spent yesterday

✅ `campaign.28d_view_1d_click:lifetime_results` - total results at the ad set level over its lifetime, with the attribution window of 28 days after viewing and 1 day after clicking

✅ `campaign.lifetime_spent` - total amount spent at the ad campaign level over its lifetime

###### Bad examples
❌ `lifetime_campaign.spent` - time preset prefixes cannot come before object level prefixes

❌ `lifetime_today_spent` - there cannot be two time preset prefixes

❌ `ad.adset.spent` - there cannot be two object level prefixes

❌ `yesterday.adset_spent` - bad delimiter

##### Examples for Metadata field `daily_budget`
###### Good examples
✅ `adset.daily_budget` - daily budget of the ad set

✅ `daily_budget` - daily budget

###### Bad examples
❌ `yesterday_daily_budget` - cannot use time preset prefixes on Metadata fields

❌ `ad.daily_budget` - ads do not have a daily budget

### Object level prefixes
| Prefix | Object type | Valid on object types |
| --- | --- | --- |
| `ad.` | Ad | Ad |
| `adset.` | Ad Set | Ad, Ad Set |
| `campaign.` | Campaign | Ad, Ad Set, Campaign |

### Attribution window prefixes
| Attribution Window Prefix | Description |
| --- | --- |
| `account_default:` | Use the account level attribution window setting |
| `default:` | The Facebook default attribution window is 1 day views, 28 day clicks |
| `inline:` | Inline attribution only (0 day views, 0 day clicks) |
| `1d_view:` | 1 day views, 0 day clicks |
| `7d_view:` | 7 day views, 0 day clicks |
| `28d_view:` | 28 day views, 0 day clicks |
| `1d_click:` | 0 day views, 1 day clicks |
| `7d_click:` | 0 day views, 7 day clicks |
| `28d_click:` | 0 day views, 28 day clicks |
| `1d_view_1d_click:` | 1 day views, 1 day clicks |
| `7d_view_1d_click:` | 7 day views, 1 day clicks |
| `28d_view_1d_click:` | 28 day views, 1 day clicks |
| `1d_view_7d_click:` | 1 day views, 7 day clicks |
| `7d_view_7d_click:` | 7 day views, 7 day clicks |
| `28d_view_7d_click:` | 28 day views, 7 day clicks |
| `7d_view_28d_click:` | 7 day views, 28 day clicks |
| `28d_view_28d_click:` | 28 day views, 28 day clicks |

### Time preset prefixes

This list contains the valid time preset values in lowercase, each with a trailing delimiter.
| Prefix | Description |
| --- | --- |
| `lifetime_` | Lifetime of the object |
| `today_` | The current day starting from midnight in the ad account's timezone |
| `last_2_days_` | `YESTERDAY` and `TODAY` |
| `last_3_days_` | Last 2 full days and `TODAY` |
| `last_7_days_` | Last 6 full days and `TODAY` |
| `last_14_days_` | Last 13 full days and `TODAY` |
| `last_28_days_` | Last 27 full days and `TODAY` |
| `last_30_days_` | Last 29 full days and `TODAY` |
| `this_month_` | This month, including `TODAY` |
| `this_week_mon_today_` | This week using Monday as first day of week, including `TODAY` |
| `this_week_sun_today` | This week using Sunday as first day of week, including `TODAY` |
| `yesterday_` | The previous full day, excluding `TODAY` |
| `last_2d_` | Last 2 full days, excluding `TODAY` |
| `last_3d_` | Last 3 full days, excluding `TODAY` |
| `last_7d_` | Last 7 full days, excluding `TODAY` |
| `last_14d_` | Last 14 full days, excluding `TODAY` |
| `last_28d_` | Last 28 full days, excluding `TODAY` |
| `last_30d_` | Last 30 full days, excluding `TODAY` |
| `last_nd_14_8_` | Last 14 days to Last 7 days, for [ROAS](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/roas-ad-rules) |
| `last_nd_30_8_` | Last 30 days to Last 7 days, for [ROAS](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/roas-ad-rules) |
| `last_nd_60_8_` | Last 60 days to Last 7 days, for [ROAS](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/roas-ad-rules) |
| `last_nd_120_8_` | Last 120 days to Last 7 days, for [ROAS](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/roas-ad-rules) |
| `last_nd_180_8_` | Last 180 days to Last 7 days, for [ROAS](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/roas-ad-rules) |
| `last_nd_lifetime_8_` | Lifetime to Last 7 days, for [ROAS](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/roas-ad-rules) |
| `last_nd_60_29_` | Last 60 days to Last 28 days, for [ROAS](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/roas-ad-rules) |
| `last_nd_120_20_` | Last 120 days to Last 28 days, for [ROAS](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/roas-ad-rules) |
| `last_nd_180_29_` | Last 180 days to Last 28 days, for [ROAS](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/roas-ad-rules) |
| `last_nd_lifetime_29_` | Lifetime to Last 28 days, for [ROAS](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/roas-ad-rules) |

## Aggregation

You can aggregate some Insights fields over multiple ad objects. This allows you to create filters on metrics over a specific subset of ad objects. For example, the total reach over multiple ads or the total number of clicks over different ad sets.

While some metrics such as `clicks` are calculated with simple summation, other metrics such as `reach` are calculated differently. Since `reach` is based on unique impressions, duplicate users are removed in the aggregation over multiple ad objects.

### Usage
An aggregated field takes the form of `aggregate(`{ `field` }`)`. The `field` can contain attribution window and time preset prefixes. The set of ad objects to be aggregated is determined by another required filter field `aggregation_id`.
#### Example aggregate fields
##### Good examples
✅ `aggregate(reach)`

✅ `aggregate(lifetime_reach)`

##### Bad examples
❌ `aggregate(daily_budget)`

❌ `aggregate(adset.reach)`

### Aggregation ID filter
The `aggregation_id` filter specifies which ad objects to aggregate. It only supports the `IN` operator and a list of ids as its value. The ids may be of ads, ad sets, or ad campaigns, but all of them must be from the same object level.

#### Example `aggregation_id` filter

```
{
  "field": "aggregation_id",
  "operator": "IN",
  "value": [1234, 5678]
},
{
  "field": "aggregate(reach)",
  "operator": "GREATER_THAN",
  "value": 100
}
```

### Supported fields

- `clicks`
- `cpc`
- `cpm`
- `cpp`
- `ctr`
- `frequency`
- `impressions`
- `mobile_app_purchase_roas`
- `reach`
- `result_rate`
- `spent`
- `unique_clicks`
- `unique_impressions`
- `website_purchase_roas`
- `cost_per_unique_click`

## Formula fields
You can set simple arithmetic expressions as a field. For example, this can be used to find the ratio between two numeric fields.

This works on Insights fields and on a subset of numeric Metadata fields. The full supported list is below.

### Usage

A formula field consists of fields or constants and syntactically correct operators separated by spaces. It supports the operators `+` `-` `*` and `/`. You can add constants, for example to weigh specific fields or to act as offsets.

The fields in this case can be fully prefixed, so you can add valid object level and time preset prefixes.

A formula allows a maximum of `6` non-constant fields. You can have as many constants as you want.

`today_spent / adset.today_spent`

`0.8 * cpc + 0.2 * cpm`

{ `field_or_constant_1` } { `+` | `-` | `*` | `/` } { `field_or_constant_2` }

#### Example formulas
###### Good examples
✅ `today_spent / adset.daily_budget` - daily percent spend

✅ `clicks / adset.clicks` - ratio of clicks compared to ad set's clicks

✅ `today_impressions / yesterday_impressions` - ratio of today's number of impressions compared to yesterday's number of impressions

✅ `today_impressions / aggregate(today_impressions)` - ratio of today's number of impressions compared to an aggregated number of impressions

✅ `(adset.spent - spent)` - parentheses are accepted, when receiving formulas in API responses, they will be parenthesized

###### Bad examples
❌ `(clicks + cpc + cpm + ctr + cpa + cpp) / cost_per` - cannot use more than `6` fields

❌ `today_impressions/yesterday_impressions` - terms must be space separated

### Valid numeric metadata fields
| Field | Valid on Object Types |
| --- | --- |
| `bid_amount` | Ad, Ad Set |
| `daily_budget` | Ad Set |
| `lifetime_budget` | Ad Set |
| `spend_cap` | Campaign |

