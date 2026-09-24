<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview/budgets | Saved: 2026-09-19 -->

# Budgets



Set daily budget or lifetime budget at the ad set level. The amount you set for bid and budget are at ad account currencies minimum denomination level, such as cents for USD. All ads delivered in that set will not exceed a spend limit:

- **daily_budget:** The average amount you're willing to spend on an ad set or campaign each day. With Ads Manager, you'll get roughly your daily budget's worth of the result you optimized for. There may, however, be certain days when better opportunities are available. On those days, up to 25% more than your daily budget may be spent. For example, if your daily budget is $10, up to $12.50 may be spent.
- **lifetime budget:** The amount you're willing to spend over the entire run of an ad set or campaign. You won't be charged more than your lifetime budget for your ad set's results unless you change your delivery settings. If your ad set is running for five days and has a $250 lifetime budget, $50 may be spent on each of the first two days. On the third day, if lots of results are available, $75 may be spent. Then, if there aren't as many opportunities available, $25 may be spent on the fourth day and $50 on the fifth day.

To set a daily budget of 20 dollars:

```bash
curl -X POST \
  -F 'name="My First Adset"' \
  -F 'daily_budget=2000' \
  -F 'start_time="2025-11-11T14:25:17-0800"' \
  -F 'end_time="2025-11-18T14:25:17-0800"' \
  -F 'campaign_id="<AD_CAMPAIGN_ID>"' \
  -F 'bid_amount=100' \
  -F 'billing_event="LINK_CLICKS"' \
  -F 'optimization_goal="LINK_CLICKS"' \
  -F 'targeting={
       "facebook_positions": [
         "feed"
       ],
       "geo_locations": {
         "countries": [
           "US"
         ]
       }
     }' \
  -F 'status="PAUSED"' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

To set a lifetime budget of 200 dollars for a campaign setup to run for 10 days:

```bash
curl -X POST \
  -F 'name="My First Adset"' \
  -F 'lifetime_budget=20000' \
  -F 'start_time="2025-11-11T14:26:09-0800"' \
  -F 'end_time="2025-11-21T14:26:09-0800"' \
  -F 'campaign_id="<AD_CAMPAIGN_ID>"' \
  -F 'bid_amount=100' \
  -F 'billing_event="LINK_CLICKS"' \
  -F 'optimization_goal="LINK_CLICKS"' \
  -F 'targeting={
       "facebook_positions": [
         "feed"
       ],
       "geo_locations": {
         "countries": [
           "US"
         ]
       },
       "publisher_platforms": [
         "facebook",
         "audience_network"
       ]
     }' \
  -F 'status="PAUSED"' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

If you choose daily budget, Meta paces your daily spending while a lifetime budget paces spending over an ad set's lifetime.

## Learn more

* [About campaign budget](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/guides/advantage-campaign-budget)
* [About budget scheduling](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/high-demand-period)
