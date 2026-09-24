<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview/billing-events | Saved: 2026-09-19 -->

# Billing Events



`billing_event` defines events you want to pay for such as impressions, clicks, or various actions. Billing depends on the size of your audience and your budget.

For example, to optimize for `POST_ENGAGEMENT` and pay per `IMPRESSIONS`:

```bash
curl -X POST \
  -F 'name="My First Adset"' \
  -F 'lifetime_budget=20000' \
  -F 'start_time="2025-11-11T14:18:00-0800"' \
  -F 'end_time="2025-11-21T14:18:00-0800"' \
  -F 'campaign_id="<AD_CAMPAIGN_ID>"' \
  -F 'bid_amount=500' \
  -F 'billing_event="IMPRESSIONS"' \
  -F 'optimization_goal="POST_ENGAGEMENT"' \
  -F 'targeting={
       "facebook_positions": [
         "feed"
       ],
       "geo_locations": {
         "countries": [
           "US"
         ],
         "regions": [
           {
             "key": "4081"
           }
         ],
         "cities": [
           {
             "key": 777934,
             "radius": 10,
             "distance_unit": "mile"
           }
         ]
       },
       "genders": [
         1
       ],
       "age_max": 24,
       "age_min": 20,
       "behaviors": [
         {
           "id": 6002714895372,
           "name": "All travelers"
         }
       ],
       "life_events": [
         {
           "id": 6002714398172,
           "name": "Newlywed (1 year)"
         }
       ],
       "publisher_platforms": [
         "facebook"
       ],
       "device_platforms": [
         "desktop"
       ]
     }' \
  -F 'status="PAUSED"' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

Once you select `optimization_goal`, you have one or more `billing_event` options. See [Optimization goal and billing events](#opt_bids) and [CPA](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/guides/cost-per-action-ads).

## Validation {#buying-type-validation}

### Buying type and billing events {#buying-type-and-billing-events}

`buying_type` defines how the advertiser pays for delivery, set on the [campaign](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group) level. In most cases, advertisers use `AUCTION`. Two special cases exist: `RESERVED` (Meta bases billing on prediction) and `FIXED_CPM` (the advertiser negotiates a fixed price). Campaigns with `buying_type` require [ad sets](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign) with a `billing_event` defined.

Valid `billing_event`s for each `buying_type`:
|  | AUCTION | RESERVED | FIXED_CPM |
| --- | --- | --- | --- |
| `IMPRESSIONS` | ✓ | ✓ | ✓ |
| `LINK_CLICKS` | ✓ |  |  |
| `PAGE_LIKES` | ✓ |  |  |
| `POST_ENGAGEMENT` | ✓ |  |  |
| `VIDEO_VIEWS` | ✓ |  |  |

### Optimization goal and billing events {#opt_bids}

For `buying_type=AUCTION` [campaigns](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group), with an `optimization_goal` set, Meta restricts which `billing_event` values you can choose for your [ad set](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign).

The restrictions below assume you have an `objective` specified on the [campaign](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group) level.

| `optimization_goal` | Valid ad set `billing_event` |
| --- | --- |
| `APP_INSTALLS` | `IMPRESSIONS` |
| `AD_RECALL_LIFT` | `IMPRESSIONS` |
| `ENGAGED_USERS` | `IMPRESSIONS` |
| `EVENT_RESPONSES` | `IMPRESSIONS` |
| `IMPRESSIONS` | `IMPRESSIONS` |
| `LEAD_GENERATION` | `IMPRESSIONS` |
| `LINK_CLICKS` | `LINK_CLICKS`, `IMPRESSIONS` |
| `OFFSITE_CONVERSIONS` | `IMPRESSIONS` |
| `PAGE_LIKES` | `IMPRESSIONS` |
| `POST_ENGAGEMENT` | `IMPRESSIONS`. As of v2.11, `POST_ENGAGEMENT` is not an option. |
| `REACH` | `IMPRESSIONS` |
| `REPLIES` | `IMPRESSIONS` |
| `SOCIAL_IMPRESSIONS` | `IMPRESSIONS` |
| `THRUPLAY` | `IMPRESSIONS`, `THRUPLAY` |
| `TWO_SECOND_CONTINUOUS_VIDEO_VIEWS` | `IMPRESSIONS`, `TWO_SECOND_CONTINUOUS_VIDEO_VIEWS` |
|  | `IMPRESSIONS` and `VIDEO_VIEWS` |
| `VALUE` | `IMPRESSIONS` |
| `LANDING_PAGE_VIEWS` | `IMPRESSIONS` |

