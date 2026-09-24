<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights-api/ads-volume | Saved: 2026-09-19 -->

# Ad Volume


**Warning:** View the volume of ads *running or in review* for your ad accounts. Ads that are running or in review count against the per-Page ad limit introduced in 2021. Query the number of ads running or in review for a given ad account.

## View ad volume for your ad account

To see the ad volume for your ad account:

```bash
curl -G \
  -d "access_token=<ACCESS_TOKEN>" \
  "https://graph.facebook.com/v<API_VERSION>/act_<AD_ACCOUNT_ID>/ads_volume"
```

**Response**

```json
{"data":[{"ads_running_or_in_review_count":2}]}
```

For information on managing ad volume, see [About Managing Ad Volume](https://www.facebook.com/business/help/2720085414702598).

## View running or in review status {#view-status}
To determine if an ad is running or in review, the system checks `effective_status`, then `configured_status`, and the ad account's status:

* If an ad has `effective_status` of `1` - `active`, it is considered in *running or in review* state.
* If an ad has `configured_status` of `active` and `effective_status` of `9` - `pending review` or `17` - `pending processing`, it is considered *running* or *in review*.
* The ad can be *running* or *in review* only if the ad account status is in `1` - `active`, `8` - `pending settlement`, or `9` - `in grace period`.

Whether an ad is running or in review is also determined based on the ad set's schedule:

* If start time is before current time, and current time is before end time, then the ad is considered running or in review.
* If start time is before current time and the ad set has no end time, it is also considered running or in review.

For example, if the ad set is scheduled to run in the future, the ads are not running or in review. However, if the ad set is scheduled to run from now until 3 months from now, the ads are considered running or in review.

If you are using special ads scheduling features, such as day-parting, the ad is considered running or in review the *whole day*, not just for the part of the day when the ad starts running.

## Breakdown by actors {#breakdown-by-actors}

Use the `show_breakdown_by_actor` field to get a breakdown of ad limits by a specific `actor_id`:

```bash
curl -G \
  -d "show_breakdown_by_actor=true" \
  -d "access_token=<ACCESS_TOKEN>" \
  "https://graph.facebook.com/v<API_VERSION>/act_<AD_ACCOUNT_ID>/ads_volume"
```

**Response**

```json
{
  "data": [
    {
      "ads_running_or_in_review_count": 0,
      "current_account_ads_running_or_in_review_count": 0,
      "actor_id": "<ACTOR_ID_1>",
      "recommendations": [
      ]
    },
    {
      "ads_running_or_in_review_count": 2,
      "current_account_ads_running_or_in_review_count": 2,
      "actor_id": "<ACTOR_ID_2>",
      "recommendations": [
      ]
    }
  ],
}
```

Use `page_id` to get the ad limits for a specific page:

```bash
curl -G \
  -d "page_id=<PAGE_ID>" \
  -d "access_token=<ACCESS_TOKEN>" \
  "https://graph.facebook.com/v<API_VERSION>/act_<AD_ACCOUNT_ID>/ads_volume"
```

**Response**

```json
{
  "data": [
    {
      "ads_running_or_in_review_count": 2,
      "current_account_ads_running_or_in_review_count": 2,
      "actor_id": "<ACTOR_ID>",
      "recommendations": [
      ]
    }
  ],
}
```

### Supported fields

| Field | Description |
| --- | --- |
| `actor_id` | Actor that the limit is enforced against. Currently, this is always the page ID. |
| `ads_running_or_in_review_count` | Number of ads running or in review for a specific actor. |
| `current_account_ads_running_or_in_review_count` | Number of ads running or in review within the current ad account on a specific actor. |

