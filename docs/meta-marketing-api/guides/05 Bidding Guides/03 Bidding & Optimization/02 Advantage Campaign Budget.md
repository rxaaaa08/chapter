<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/guides/advantage-campaign-budget | Saved: 2026-09-19 -->

# Advantage Campaign Budget



An Advantage campaign budget is a way of optimizing the distribution of a campaign budget across your campaign's ad sets. This means Facebook automatically and continuously finds the best available opportunities for results across your ad sets and distributes your campaign budget in real time to get those results.

You can either enable or disable an Advantage campaign budget for an ad campaign. If you disable the Advantage campaign budget, you should provide budgets for all ad sets under the campaign.

## Campaign-level fields

| Name | Description |
| --- | --- |
| `daily_budget` | The daily budget of the campaign. |
| `lifetime_budget` | The lifetime budget of the campaign. |
| `pacing_type` | Pacing type shared across the ad sets in this campaign.<br>**Options:**<br><br>* `standard`<br>* `no_pacing` (also known as accelerated delivery)<br>* `day_parting` (also known as ad scheduling) |
| `budget_rebalance_flag` | Do **not** use for Advantage campaign budgets. See [Ad Set Budget Rebalancing](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview#rebalance) below. |
| `adset_budgets` | The ad set budget to use for each ad set in the campaign. Use this to *disable* an Advantage campaign budget and to *use* individual ad set budgets. |
| `bid_strategy` | Bid strategy of the campaign.<br>**Options:**<br><br>* `LOWEST_COST_WITHOUT_CAP`<br>* `COST_CAP`<br>* `LOWEST_COST_WITH_BID_CAP`<br>* `LOWEST_COST_WITH_MIN_ROAS`<br><br>If you choose `Value` as an `optimization_goal` for `LOWEST_COST_WITHOUT_CAP` in [Ads Manager](https://www.facebook.com/ads/manager/accounts), `Highest Value` appears as your bid strategy. |
| `adset_bid_amounts` | The bid amounts to use for ad sets in this campaign when the campaign bid strategy is set to `LOWEST_COST_WITH_BID_CAP` or `COST_CAP`. You should set this field along with `bid_strategy`. |

See [examples](#examples) below to learn more about using these fields.

## Ad set-level controls

| Name | Description |
| --- | --- |
| `daily_min_spend_target` | Daily minimum spending target for the ad set, in your account's currency. You must specify a daily budget at the ad campaign level. This target does not guarantee you spend this amount, but Facebook makes a best effort to achieve it. To remove `daily_min_spend_target` from an ad set, set it to `0` or an empty value. For example, `daily_min_spend_target=0`, or `daily_min_spend_target=`. |
| `daily_spend_cap` | Daily spend cap of the ad set defined in your account currency.<br><br>You must specify the daily budget at the ad campaign level. |
| `lifetime_min_spend_target` | Lifetime minimum spend target for an ad set defined in your account currency. You must specify the lifetime budget at the ad campaign level. This target is not a guarantee you achieve the target, but Facebook makes a best effort to reach it. To remove `lifetime_min_spend_target` from an ad set, set it to `0` or an empty value. For example, `lifetime_min_spend_target=0`, or `lifetime_min_spend_target=`. |
| `lifetime_spend_cap` | Lifetime spend cap of the ad set defined in your account currency.<br>You must specify the lifetime budget in the campaign. |
| `bid_amount` | Bid amount for this ad set. Only available when the campaign level `is_autobid` is set to `false`. |
| `bid_constraints` | Similar to an ad set budget, *minimum Return on Ads Spend bidding (also called Min ROAS)*, uses this to provide the *ROAS floor*, but you cannot use `bid_amount` with `bid_constraints`. See [Examples](#examples) to use Min ROAS with an Advantage campaign budget. |

### Examples {#examples}

#### `LOWEST_COST_WITHOUT_CAP`

Create a campaign using an Advantage campaign budget with `bid_strategy` set to `LOWEST_COST_WITHOUT_CAP`. The campaign has a 1000 USD daily budget with auto bid:

```bash
curl
  -F 'name=L3 With Daily Budget' \
  -F 'objective=OUTCOME_TRAFFIC' \
  -F 'daily_budget=100000' \
  -F 'bid_strategy=LOWEST_COST_WITHOUT_CAP' \
  -F 'special_ad_categories=NONE' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_AD_ACCOUNT_ID/campaigns
```

#### `LOWEST_COST_WITH_BID_CAP`

Create a campaign using an Advantage campaign budget with `bid_strategy` set to `LOWEST_COST_WITH_BID_CAP`. The campaign has a 1000 USD lifetime budget:

```bash
curl
  -F 'name=L3 With Lifetime Budget' \
  -F 'objective=OUTCOME_TRAFFIC' \
  -F 'lifetime_budget=100000' \
  -F 'bid_strategy=LOWEST_COST_WITH_BID_CAP' \
  -F 'special_ad_categories=NONE' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_AD_ACCOUNT_ID/campaigns
```

Then create an ad set with the maximum bid capped:

```bash
curl \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'name=Test Adset No Budget' \
  -F 'status=ACTIVE' \
  -F 'optimization_goal=LINK_CLICKS' \
  -F 'targeting={"geo_locations":{"countries":["US"]},"publisher_platforms": ["facebook","audience_network"],"facebook_positions":["feed"],"device_platforms":["mobile","desktop"]}' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'bid_amount=100' \
  -F 'time_stop=1712888798'
  -F 'access_token=<ACCESS_TOKEN>' \
 https://graph.facebook.com/v25.0/act_AD_ACCOUNT_ID/adsets
```

#### `LOWEST_COST_WITH_MIN_ROAS`

Create a campaign using an Advantage campaign budget with `bid_strategy` set to `LOWEST_COST_WITH_MIN_ROAS`. For example, the campaign has 1000 USD lifetime budget with *Min ROAS* set:

```bash
curl
  -F 'name=L3 With Lifetime Budget' \
  -F 'objective=OUTCOME_SALES' \
  -F 'lifetime_budget=100000' \
  -F 'bid_strategy=LOWEST_COST_WITH_MIN_ROAS' \
  -F 'special_ad_categories=NONE' \
  -F 'access_token=<ACCESS_TOKEN>' \
 https://graph.facebook.com/v25.0/act_AD_ACCOUNT_ID/campaigns
```

Then create an ad set with Return on Ads Spend minimums set:

```bash
curl
  -F 'name=minRoasBiddingDemo' \
  -F 'optimization_goal=VALUE' \
  -F 'promoted_object={"pixel_id": <PIXEL_ID>, "custom_event_type": PURCHASE}' \
  -F 'targeting={"geo_locations":{"countries":["US"]}}' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'status=PAUSED' \
  -F 'time_stop=1712888798' \
  -F 'bid_constraints={"roas_average_floor": 10000}' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_AD_ACCOUNT_ID/adsets
```

## Update an Advantage campaign budget or bid strategy choices

You can disable an Advantage campaign budget from an ad campaign and add budget to ad sets. For example, the following code sample:

* Removes the campaign budget
* Sets the budget of `AD_SET_ID1` to `5000`
* Sets the budget of `AD_SET_ID2` to `7000`

```bash
curl
 -F 'adset_budgets=[{"adset_id": <AD_SET_ID1>, "daily_budget": 5000}, {"adset_id": <AD_SET_ID2>, "daily_budget": 7000}]'
 -F 'access_token=<ACCESS_TOKEN>'
https://graph.facebook.com/v25.0/CAMPAIGN_ID
```

Or you can change your bid_strategy between `COST_CAP`, and `LOWEST_COST_WITH_BID_CAP`. For example, the following code sample sets:

* Bid strategy to `LOWEST_COST_WITH_BID_CAP`
* The bid of `AD_SET_ID1` to `1500`
* The bid of `AD_SET_ID2` to `2000`

```bash
curl
 -F 'adset_bid_amounts={"<AD_SET_ID1>": 1500, "<AD_SET_ID2>": 2000}'
 -F 'bid_strategy="LOWEST_COST_WITH_BID_CAP"'
 -F 'access_token=<ACCESS_TOKEN>'
https://graph.facebook.com/v25.0/CAMPAIGN_ID
```

## Limitations and best practices

### Bid strategy

Define a bid strategy at the campaign level. All ad sets share the same bid strategy defined at the ad campaign level. You can still define different bid amounts or Return on Ads Spending minimums at the ad set level for non-auto bid campaigns. This is the same approach you can use for ad set budget. For `LOWEST_COST_WITH_MIN_ROAS`, you cannot currently switch to other bid strategies after you create your campaign. See [Bid Strategies](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview#bid-strategy).

### Pacing

Define the `pacing_type` in the campaign level, not in the ad set level. See [Pacing and Scheduling](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview/pacing-and-scheduling).

### Optimization goals

All optimization goals must be the same across ad sets under auto bid. Once you run ads in a campaign, you cannot edit optimization goals. See [Optimization Goals](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview#opt).

### Campaigns with more than 70 ad sets

If your campaign has more than 70 ad sets and uses an Advantage campaign budget, you are not able to edit your current bid strategy or turn off your Advantage campaign budget. [Learn more in the Business Help Center](https://www.facebook.com/business/help/519856662172206).

## Learn more

* [About campaign budget optimization](https://www.facebook.com/business/help/153514848493595)
* [Understand campaign budget optimization reporting](https://www.facebook.com/business/help/258714594633281)
