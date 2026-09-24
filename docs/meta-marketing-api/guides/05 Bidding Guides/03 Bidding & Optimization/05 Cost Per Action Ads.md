<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/guides/cost-per-action-ads | Saved: 2026-09-19 -->

# Cost Per Action Ads



Cost Per Action (CPA) lets you specify conversion events and get charged by the number of conversions. CPA for video views is also called CPV.

An alternative to CPA is [oCPM](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/guides/optimized-cost-per-mille), which charges per impression served.

## How it works

Define your bid at the [ad set](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign) level. These fields must follow the restrictions below:

| Name | Description |
| --- | --- |
| `billing_event` | Defines the action you pay on. Set to `LINK_CLICKS`, `PAGE_LIKES`, `OFFER_CLAIMS`, or `THRUPLAY`. |
| `optimization_goal` | Defines the action you optimize for. Set to same value as your `billing_event`, `LINK_CLICKS`, `PAGE_LIKES`, `POST_ENGAGEMENT`, `OFFER_CLAIMS`, or `THRUPLAY`. |
| `bid_amount` | Value you place on the objective, specified in cents, minimum 1 cent. For example, `bid_amount=150` means you would like to bid $1.50 on that action. The `bid_amount` should represent the maximum value you are willing to pay for this action. |
| `targeting` | For those ads that optimize for connections including `page_like` you must use the `excluded_connections` field in the targeting in order to exclude users who have already performed the one-time conversion for the destination object. See the examples in the section below for how to specify the appropriate excluded connections. |

### Limitations

* The offsite link click action only supports links to offsite domains and Facebook hosted app domains.
* CPA billing for non-video view ads is based on one day click through conversions. For CPV, or CPA for video view, ads, Meta bills you on 10-second video views.
* Offsite link click billing is additionally restricted to link clicks within the advertisement, which are known as *inline*.

**Note:** Starting on [v9](https://developers.facebook.com/docs/graph-api/changelog/version9.0#bidding), CPA billing for app ads is deprecated, you cannot set both `billing_event` and `optimization_goal` to `APP_INSTALLS`. Use the impression billing events instead. You can still specify `APP_INSTALLS` under `billing_event` or `optimization_goal`, but not under both `billing_event` and `optimization_goal` at the same time.

See [ad set](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign) document on allowed updates to ad sets.

### Examples {#examples}

#### Create

The example below creates a CPA bid ad set. Note that for CPA ad sets, you must set a `promoted_object`.

```bash
curl -X POST \
  -F 'name="A CPA Ad Set"' \
  -F 'campaign_id="<AD_CAMPAIGN_ID>"' \
  -F 'daily_budget=5000' \
  -F 'start_time="2025-11-18T14:06:35-0800"' \
  -F 'end_time="2025-11-25T14:06:35-0800"' \
  -F 'billing_event="IMPRESSIONS"' \
  -F 'optimization_goal="REACH"' \
  -F 'bid_amount=1000' \
  -F 'promoted_object={
       "page_id": "<PAGE_ID>"
     }' \
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
  -F 'user_os="iOS"' \
  -F 'publisher_platforms="facebook"' \
  -F 'device_platforms="mobile"' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

After you create the ad set, you can create ads and put them into this ad set following the creation flow [here](https://developers.facebook.com/docs/reference/ads-api/guides/chapter-2-objective-connections).

#### Update {#example_update}
Change the bid to a CPA ad set:

```bash
curl -X POST \
  -F 'billing_event="IMPRESSIONS"' \
  -F 'optimization_goal="LINK_CLICKS"' \
  -F 'bid_amount=200' \
  -F 'targeting={
       "geo_locations": {
         "countries": [
           "US"
         ]
       },
       "facebook_positions": [
         "feed"
       ]
     }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<AD_SET_ID>/
```

### CPV example {#cpv_example}
To create an ad bidding CPV, or CPA for video views, first create an ad campaign with `objective=VIDEO_VIEWS`.

```bash
curl -X POST \
  -F 'name="Video Views campaign"' \
  -F 'objective="OUTCOME_ENGAGEMENT"' \
  -F 'status="PAUSED"' \
  -F 'special_ad_categories=[]' \
  -F 'is_adset_budget_sharing_enabled=0' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/campaigns
```

Then, set the CPA for video views `bid_info` at the ad set:

```bash
curl \
  -F 'name=A CPV Ad Set' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'daily_budget=500' \
  -F 'start_time=2018-02-06T04:45:29+0000' \
  -F 'end_time=2018-02-13T04:45:29+0000' \
  -F 'billing_event=VIDEO_VIEWS' \
  -F 'optimization_goal=VIDEO_VIEWS' \
  -F 'bid_amount=100' \
  -F 'targeting={
    "device_platforms": ["mobile"],
    "geo_locations": {"countries":["US"]},
    "publisher_platforms": ["facebook"]
  }' \
  -F 'status=PAUSED' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```
