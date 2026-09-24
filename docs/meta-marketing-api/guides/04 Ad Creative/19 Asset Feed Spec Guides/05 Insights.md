<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/asset-feed-spec/insights | Saved: 2026-09-19 -->

# Insights



You can read insights for ad set and ad objects using [Dynamic Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/asset-feed-spec/dynamic-creative), [Placement Asset Customization](https://developers.facebook.com/documentation/ads-commerce/marketing-api/dynamic-creative/placement-asset-customization), and [Segment Asset Customization](https://developers.facebook.com/docs/marketing-api/dynamic-creative/segment-asset-customization).

In Ads Manager, you can view your asset level breakdowns. Using the API, you can get the following breakdowns:

* `body_asset`
* `description_asset`
* `image_asset`
* `title_asset`
* `call_to_action_asset`
* `link_url_asset`
* `video_asset`
* `ad_format_asset`

You can combine these in your results with these [breakdowns](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights/breakdowns):

* `age`
* `gender`
* `age`, `gender`

For **Dynamic Creative**, we currently show only creative-asset level breakdowns such as metrics by `image`, `title`, `body`, `video`. Insights on full delivered ads are found in Ads Manager under `By Dynamic Creative Asset`.

## Build your query

Get the following fields in your query:

| Field | Description |
| --- | --- |
| `actions` | Number of actions taken on your ad, grouped by action type. |
| `clicks` | Total number of clicks on your ad. |
| `impressions` | Number of times your ad was served. |

Facebook supports different values derived from the fields above. For example you can also retrieve `ctr` and `actions_per_impressions`.

## Examples
To retrieve insights for an **ad** with the `body_asset` breakdown:

```bash
curl -G
-d "breakdowns=body_asset"
-d "fields=impressions"
-d "access_token=<ACCESS_TOKEN>"
https://graph.facebook.com/<API_VERSION>/<AD_ID>/insights
```

A sample response looks like this:

```json
{
  "data": [
    {
      "impressions": "8801",
      "date_start": "2016-04-29",
      "date_stop": "2016-05-13",
      "body_asset": {
        "text": "Test text",
        "id": "6051732675652"
      }
    },
    {
      "impressions": "7558",
      "date_start": "2016-04-29",
      "date_stop": "2016-05-13",
      "body_asset": {
        "text": "Test ext new",
        "id": "6051732676452"
      }
    },
  ],
  "paging": {
    "cursors": {
      "before": "MAZDZD",
      "after": "MgZDZD"
    }
  }}
```

To retrieve insights for an **ad set** broken down by `image_asset` and `age`:

```bash
curl -G
-d "breakdowns=image_asset,age"
-d "fields=impressions"
-d "access_token=<ACCESS_TOKEN>"
https://graph.facebook.com/<API_VERSION>/<ADSET_ID>/insights
```

A sample response looks like this:

```json
{
  "data": [
    {
      "impressions": "5497",
      "date_start": "2016-04-29",
      "date_stop": "2016-05-13",
      "image_asset": {
        "hash": "<REDACTED>",
        "url": "<REDACTED>",
        "id": "6051732672052"
      }
    },
    {
      "impressions": "5962",
      "date_start": "2016-04-29",
      "date_stop": "2016-05-13",
      "image_asset": {
        "hash": "<REDACTED>",
        "url": "<REDACTED>",
        "id": "6051732672652"
      }
    },
  ],
  "paging": {
    "cursors": {
      "before": "MAZDZD",
      "after": "MwZDZD"
    }
```
