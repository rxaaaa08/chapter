<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview/bid-strategy | Saved: 2026-09-19 -->

# Bid Strategy



**Success:** Due to the launch of iOS 14.5, the following changes have been made:

* The `target_cost` bid strategy has been deprecated with [Marketing API v9](https://developers.facebook.com/docs/graph-api/changelog/version9.0). Campaigns using this bid strategy will no longer be supported and the delivery will be paused. Instead of `target_cost`, use [cost cap bidding](#cap).
* For iOS 14.5 campaigns using `COST_CAP` or `LOWEST_COST_WITH_MIN_ROAS`, the duration must be set to at least 3 days.

See the [changelog](https://developers.facebook.com/docs/graph-api/changelog/non-versioned-changes/jan-19-2021) for more information about iOS 14.5 changes.

This page explains how bid strategies affect your bid and your cost controls over Meta ads, and how to set them up.

### Bid Strategy Types

* `LOWEST_COST_WITHOUT_CAP`: Meta automatically bids on your behalf and gets you the lowest cost results. Automatically increase your effective bid as needed to get the results you want based on your given `optimization_goal`. If you choose `Value` as an `optimization_goal`, in [Ads Manager](https://www.facebook.com/ads/manager/accounts), `Highest Value` appears as your bid strategy.
* [`COST_CAP`](#cap): Get the most results possible while Meta strives to meet the cost per action you set. **Note:** Adherence to cost cap limits is not guaranteed. See [Cost Cap](#cap).
* [`LOWEST_COST_WITH_MIN_ROAS`](#min-roas-bidding): Specific bidding option for value optimization. You must specify a `roas_average_floor`, which is the minimum return wanted from ad spend. See [Minimum Return on Advertiser Spend Bidding](#min-roas-bidding).
* `LOWEST_COST_WITH_BID_CAP`: Meta automatically bids for you and gets the lowest costs. Meta automatically increases your bid as needed to get the results you want, but does not surpass your specified limit.

See the table below for more details on each strategy:

| Bid Strategy | Compatible Objectives | When To Use | Considerations |
| --- | --- | --- | --- |
| `LOWEST_COST_WITHOUT_CAP` | `APP_INSTALLS`<br><br>`CONVERSIONS`<br><br>`EVENT_RESPONSES`<br><br>`LEAD_GENERATION`<br><br>`LINK_CLICKS`<br><br>`MESSAGES`<br><br>`PAGE_LIKES`<br><br>`POST_ENGAGEMENT`<br><br>`PRODUCT_CATALOG_SALES`<br><br>`REACH`<br><br>`STORE_VISITS`<br><br>`VIDEO_VIEWS` | You want to spend your full budget.<br><br>You need to understand what bid and cost to use for other bid options.<br><br>You need to spend your given budget as efficiently as possible. | No control over your cost.<br><br>Costs can rise as you exhaust least expensive opportunities or as you increase budget. |
| [`COST_CAP`](#cap) | `APP_INSTALLS`<br>`CONVERSIONS`<br>`EVENT_RESPONSES`<br>`LEAD_GENERATION`<br>`LINK_CLICKS`<br>`MESSAGES`<br><br>`PAGE_LIKES`<br>`POST_ENGAGEMENT`<br>`PRODUCT_CATALOG_SALES`<br>`VIDEO_VIEWS` | You want to maximize results while controlling cost-efficiency of average cost per conversion.<br><br>For iOS 14.5 campaigns, duration must be set to at least 3 days. | Cost may rise as you run out of cheapest opportunities.<br><br>May not spend full budget once you hit the cap. |
| [`LOWEST_COST_WITH_MIN_ROAS`](#min-roas-bidding) | `APP_INSTALLS`<br><br>`CONVERSIONS`<br>`PRODUCT_CATALOG_SALES` | If Return On Ad Spend is the primary measure of success, and you are able to pass back transaction values to our platform. | Specific to value optimization.<br><br>Setting the benchmark too high may lead to under-delivery.<br><br>For iOS 14.5 campaigns, duration must be set to at least 3 days. |
| [`LOWEST_COST_WITH_BID_CAP`](#cap) | `APP_INSTALLS`<br>`CONVERSIONS`<br>`EVENT_RESPONSES`<br>`LEAD_GENERATION`<br>`LINK_CLICKS`<br>`MESSAGES`<br>`PAGE_LIKES`<br>`POST_ENGAGEMENT`<br>`PRODUCT_CATALOG_SALES`<br>`REACH`<br>`STORE_VISITS`<br>`VIDEO_VIEWS` | You want to set a max bid across auctions to control cost and reach as many users as possible at that bid. | Need to spend more time managing bids to control cost.<br><br>Costs can rise as you exhaust cheaper opportunities or increase your budget.<br><br>May not spend full budget.<br><br>Bid is not the cost you'll see in reporting. |

`LOWEST_COST_WITH_MIN_ROAS`, `COST_CAP`, and `LOWEST_COST_WITH_BID_CAP` are also called *manual bidding*. Manual bidding enables you to add additional cost controls. For background, see [Ads Help Center, About bid strategies: Lowest cost](https://www.facebook.com/business/help/721453268045071).

To read `bid_strategy` from an ad set:

```
curl -G \
  -d 'fields=bid_strategy' \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/<VERSION>/<AD_SET_ID>
```

To update an ad set's bid strategy to `LOWEST_COST_WITH_BID_CAP` with a bid cap of $3 USD:

```
curl
  -F 'bid_strategy=LOWEST_COST_WITH_BID_CAP' \
  -F 'bid_amount=300' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/<VERSION>/<AD_SET_ID>
```

In earlier versions of the API, you choose bidding strategy by setting `is_autobid`, `is_average_price_pacing` and `bid_amount`.

`is_autobid` and `is_average_price_pacing` were boolean flags which indicated if you choose automatic bidding or average price bids. [Marketing API version 3.0](https://developers.facebook.com/docs/graph-api/changelog/version3.0#mapi-break) deprecated both flags.

## Cost cap {#cap}

Cost cap is a cost-based bid feature that enables advertisers to express and optimize against the actual cost (CPA/CPI) of conversions. This feature allows advertisers to get the most results possible while Meta strives to meet their desired cost, allowing them to maximize cost efficiency and reduce complexities of managing bids. **Note:** Adherence to cost cap limits is not guaranteed.

To use cost cap:

* `billing_event` must be `IMPRESSIONS`
* `pacing_type` must be standard
* `optimization_goal` must be compatible with cost cap

To use a cost cap bid strategy in campaign budget optimization, in addition to the requirements listed above, your objective should also work with cost cap. For more information about compatible objectives, see [Your Guide to Facebook Bid Strategies, Cost Cap](https://www.facebook.com/business/m/one-sheeters/facebook-bid-strategy-guide).

For example, to use a cost cap at the ad campaign level:

```
curl
 -F "name"="L3 With Lifetime Budget" \
 -F "objective"="LINK_CLICKS" \
 -F "lifetime_budget=100000" \
 -F "bid_strategy"="COST_CAP" \
 -F "access_token"="ACCESS_TOKEN" \
https://graph.facebook.com/VERSION/AD_ACCOUNT_ID/campaigns
```

To set a cost cap at the ad set level:

```
curl \
  -F 'name=My Ad Set' \
  -F 'optimization_goal=CONVERSIONS' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'bid_strategy=COST_CAP' \
  -F 'bid_amount=200' \
  -F 'daily_budget=1000' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'targeting={"geo_locations":{"countries":["US"]}}' \
  -F 'status=PAUSED' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/<VERSION>/act_<AD_ACCOUNT_ID>/adsets
```

## Minimum return on advertiser spend (Min ROAS) bidding {#min-roas-bidding}

This is a specific bidding option for value optimization. As such, you must already be eligible for value optimization, which has several prerequisites:

* `optimization_goal` must be `VALUE`.
* The account should have access to value optimization, which you can query from your ad account:
    * `CAN_USE_ROAS_VALUE_OPTIMIZATION` - Account is eligible to value optimization when campaign objective = `"Website Conversion"`
    * `ADS_NEKO_MAI_ROAS` - Account is eligible to value optimization when campaign objective = `"App Install"`
    * `CAN_USE_DYNAMIC_ADS_VALUE_OPTIMIZATION` - Account is eligible to value optimization when campaign objective = `"Catalog Sales"`

* Min ROAS bidding uses `bid_constraints` to pass the `"ROAS floor"`, but you cannot use with `bid_constraints`. Instead use `roas_average_floor`.

### API Specification on [Ad Set](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign)

Notes about `roas_average_floor`:

* `roas_average_floor` represents `"the minimum roas" = "total conversion purchase value" / "total spend"`; for example, `"return on ad spend"`
* **IMPORTANT**: In the API, `roas_average_floor` is an integer and scaled up 10000x. So `roas_average_floor = 100` means "the minimum roas" = 0.01 (or 1%), and `roas_average_floor = 23300` means "the minimum roas" = 2.33 (or 233%). For example, to set minimum ROAS to be `1.5`, the corresponding API spec should be `bid_constraints = {"roas_average_floor": 15000}`.
* The valid range of `roas_average_floor` is `[100, 10000000]`, inclusive. This means that the valid range of "minimum ROAS" is `[0.01, 1000.0]` or `[1%, 100000.0%]`, inclusive.
* Do not set `bid_info` or `bid_amount` with the minimum ROAS bidding ad set. You can only set the `'bid'` of minimum ROAS through `roas_average_floor` in `bid_constraints`.

```
{
  "bid_strategy": "LOWEST_COST_WITH_MIN_ROAS",
  "bid_constraints": {
    "roas_average_floor": <roas_average_floor number>
  },
}
```

### Examples
#### Create new minimum bidding ad set

The API call below creates a min ROAS bidding ad set, with campaign objective = "website conversion" and ROAS floor = `1.0` (or 100%).

```
curl \
  -F 'name=minRoasBiddingDemo' \
  -F 'daily_budget=2000' \
  -F 'optimization_goal=VALUE' \
  -F 'promoted_object={"pixel_id": "<PIXEL_ID>", "custom_event_type": "PURCHASE"}' \
  -F 'targeting={"geo_locations":{"countries":["US"]}}' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'status=PAUSED' \
  -F 'start_time=2018-12-10T12:45:26-0700' \
  -F 'bid_strategy=LOWEST_COST_WITH_MIN_ROAS' \
  -F 'bid_constraints={"roas_average_floor": 10000}' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/<VERSION>/act_<AD_ACCOUNT_ID>/adsets
```

#### Remove `roas_average_floor` from minimum ROAS bidding ad set

```
curl \
  -F bid_strategy=LOWEST_COST_WITHOUT_CAP \
  -F 'bid_constraints={}' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/<VERSION>/act_<AD_ACCOUNT_ID>/<ad set ID>
```

#### Add `roas_average_floor` to value optimization ad set

This example sets the minimum ROAS to `1.23` (123%):

```
curl \
  -F 'bid_strategy=LOWEST_COST_WITH_MIN_ROAS' \
  -F 'bid_constraints={"roas_average_floor": 12300}' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/<VERSION>/act_<AD_ACCOUNT_ID>/<ad set ID>
```

#### Change `roas_average_floor` for existing minimum ROAS bidding ad set

This API call changes the ad set's `roas_average_floor` to `2.23` (223%).

```
curl \
  -F 'bid_constraints={"roas_average_floor": 22300}' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/<VERSION>/act_<AD_ACCOUNT_ID>/<ad set ID>
```

## Ad set level validation {#bid-strategy-ad-sets}

- `LOWEST_COST_WITH_BID_CAP` is also called manual bidding. Manual bidding enables you to add additional cost controls in the `bid_amount` field.
- For `COST_CAP`, you must provide a cap number in the `bid_amount` field.
- You cannot set `bid_amount` if you are using the `LOWEST_COST_WITH_MIN_ROAS` strategy.

