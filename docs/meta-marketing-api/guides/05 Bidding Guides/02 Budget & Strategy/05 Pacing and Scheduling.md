<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview/pacing-and-scheduling | Saved: 2026-09-19 -->

# Pacing and Scheduling



Pacing determines how your ads budget is spent over time. It provides uniform competition at Facebook's ads auction across all advertisers each day and automatically allocates budgets to different ads. Pacing functions the same way for ads created with the API as it does with Facebook tools. See [Ads Help Center, Delivery, and Pacing](https://www.facebook.com/business/help/1037425549606837).

You can set three pacing options in `pacing_type` when you create or update an [ad set](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign). With standard pacing, Meta enters your ad into every relevant auction and adjusts your bid over a day to produce smooth, optimal delivery relative to your objective and budget. This is the default pacing.

To reset to default pacing:

```bash
curl \
  -F 'pacing_type=["standard"]' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<AD_SET_ID>
```

**Accelerated delivery** removes all pacing adjustments from your bid. Meta enters your ad into all eligible auctions at its full maximum bid. You can achieve maximum delivery with a specified cost and budget. This results in delivery that is not smooth throughout the day; your ad set's budget may be exhausted before the end of the day. To create an ad set with **accelerated delivery**:

```bash
curl \
  -F 'name=Ad Set without pacing' \
  -F 'optimization_goal=REACH' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'pacing_type=["no_pacing"]' \
  -F 'bid_amount=2' \
  -F 'daily_budget=1000' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'targeting={"geo_locations":{"countries":["US"]}}' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

You can disable pacing for these scenarios:

* Advertise flash sales or limited-time promotions.
* Deliver ads with live events such as sporting events or election debates.
* Maximize delivery during key times of year such as holidays or back-to-school season.

You should not use this option when:

* Meta under-delivers your ad because your bid is too low or targeting too narrow. In these cases Meta already effectively removes budget pacing, so accelerated delivery won't help.

See [Ad Set, Pacing Options, Reference](https://developers.facebook.com/docs/marketing-api/adset/pacing)

You can also set the `pacing_type` to `day_parting` for finer control of ad scheduling. (See [Ad scheduling](#ad-scheduling))

## Ad scheduling {#ad-scheduling}
Specify days in a week and hours in a day when your ad set runs in `adset_schedule`. Your schedule applies to all ad groups under the ad set. See [Ad Scheduling, Blog](https://developers.facebook.com/ads/blog/post/2014/08/13/ad-scheduling). `adset_schedule` is an array of JSON objects. Each object represents a schedule for a single day. For example:

```bash
curl \
  -F 'name=Ad Set with scheduling' \
  -F 'optimization_goal=REACH' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'pacing_type=["day_parting"]' \
  -F 'lifetime_budget=100000' \
  -F 'end_time=2018-02-06T04:45:17+0000' \
  -F 'adset_schedule=[
    {
      "start_minute": 540,
      "end_minute": 720,
      "days": [
        1,
        2,
        3,
        4,
        5
      ]
    }
  ]' \
  -F 'bid_amount=2' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'targeting={"geo_locations":{"countries":["US"]}}' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

To update **ad scheduling**:

```bash
curl \
  -F 'lifetime_budget=100000' \
  -F 'end_time=2016-07-21T20:42:08+0000' \
  -F 'pacing_type=["day_parting"]' \
  -F 'adset_schedule=[
    {
      "start_minute": 720,
      "end_minute": 840,
      "days": [
        1,
        2,
        3,
        4,
        5
      ]
    }
  ]' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<AD_SET_ID>
```

To turn **ad scheduling** off:

```bash
curl \
  -F 'pacing_type=["standard"]' \
  -F 'adset_schedule=[]' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<AD_SET_ID>
```

To get **ad scheduling** information:

```bash
curl -X GET \
  -d 'fields="adset_schedule"' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<AD_SET_ID>
```

Each array must have:

| Field Name | Description |
| --- | --- |
| `start_minute`<br><br>type: int | 0-based minute of day. When schedule starts |
| `end_minute`<br><br>type: int | 0-based minute of day. When schedule ends |
| `days`<br><br>type: Array of ints | Days schedule active. Valid values: 0-6 where 0 is Sunday, 1 is Monday, and 6 is Saturday. |
| `timezone_type`<br><br>Optional | If the value is "user", the viewer's timezone. If the value is "advertiser", the account timezone. |

`start_minute` and `end_minute` must be on the hour and must be at least one hour apart. For [Reach and Frequency](https://developers.facebook.com/docs/marketing-api/reachandfrequency), day parts must be at least 4 hours. For example:

```
[{'start_minute':540,'end_minute':720,'days':[1,2,3,4,5]},{'start_minute':180, 'end_minute':360,'days':[0,6]}]
```

The following restrictions apply:

- Only use ad scheduling with lifetime budgets.
- Ad scheduling applies to a target audience's time zone for ads in a set, **not an ad account's time zone**. If your ad account time zone is ET, but your ads target people in California in PST, when you schedule ads from 6PM-9PM, Meta delivers them to people in California 6PM-9PM PST not ET.

## FAQ {#faq}

**My ads are not pacing correctly, what do I do?**

For under-delivery, your bid price might be too low or your audience too narrow. Your bid should be in the suggested bid range so your ads win auctions and get placement. With competitive target audiences, you may need to bid above the suggested bid range. Or your targeting is too narrow.

If we over-deliver your ad, you might have a very large audience that quickly exhausts budget. If you believe that is not the case, contact us at [Facebook Advertising Help](https://www.facebook.com/business/help).

**Is pacing at the ad set or ad campaign level?**

If you're using campaign budget optimization, budget pacing is at the campaign level. Otherwise, budget pacing is done at the ad set level.

**When I change my budget, will it impact pacing?**

When you change budget, our systems have to learn the new optimal bid which takes time. During this time, your bids are not optimal and we can't maximize ROI. Therefore you should not change bid and budget **frequently**.

**When should I change bid or budget?**

If you have to change these parameters, limit yourself to 2-3 times a day and only the early part of the day. This impacts pacing less than changing it often or later in a day.

**What about campaigns that run only a day or shorter?**

Facebook optimizes pacing within a day, so this is not a problem.

**I have ads with 'billing_event' as 'IMPRESSIONS' and I switched 'billing_event' to 'LINK_CLICKS'. Will this affect pacing?**

Pacing may change. Since you switch from view-based billing to click-based billing, we re-adjust pacing.

**I don't see 'max_bid' for different bid types, where is it?**

Max bid is `bid_amount` of an ad set you specify regardless of its optimization goal.

**How does day parting and pacing work together?**

With ad scheduling, you schedule hours in a day and days in a week when your ads display to a target audience. You can have your ads display when they are most relevant to an audience. Pacing takes this schedule into account to calculate your effective, optimal bid. See [ad scheduling](https://developers.facebook.com/docs/marketing-api/adset/pacing#ad-scheduling).

**How does Facebook spend ad set budgets over partial days?**

From April 9th, 2014, we change the way budgets are spent on partial days at the beginning and end of ad set schedules. For ad sets with daily budgets, we adjust the first and last day spend based on the number of hours we have to deliver ads on those days. For example, if your ad set starts at 6PM, we try to deliver only 25% of daily budget between 6 PM and midnight.

