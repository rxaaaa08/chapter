<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/brand-safety-and-suitability/publisher-list | Saved: 2026-09-19 -->

# Partner-publisher Lists API



Partner-publisher lists show publishers that have signed up for monetization and follow our Partner Monetization Policies. The lists are available for each of these placement types: Facebook in-stream videos, Audience Network, and Ads on Facebook Reels.

Additional documentation you can review or share with advertisers in the Meta Business Help Center:

* [About Partner-publisher Lists](https://business.facebook.com/business/help/1382467665184382?id=1769156093197771)

* [Review Partner-publisher Lists](https://business.facebook.com/business/help/449365955591474?id=1769156093197771)

## Permissions
* The app requires the `brand_safety_third_party_partners` capability grant.

## Get a partner-publisher list for a specific placement

### Parameters

| Field | Type | Required? | Default | Description |
| --- | --- | --- | --- | --- |
| platform | enum | Yes | N/A | Ads reporting platform type. Accepted values are: `audience_network`, `facebook` |
| position | enum | Yes | N/A | Ads reporting platform position type. Accepted values are: `instream_video`, `facebook_reels_overlay`. **NOTE**: As of 9/2/25, passing in either `instream_video` or `facebook_reels_overlay` will return the same list. The API returns this unified list because a single monetization program now replaces the individual programs for these two positions. |
| `sort_by` | enum | No | N/A | Sort the result by a field. If omitted, sort the results by `page_followers_asc` for non `audience_network` placement and any order for `audience_network` placement. |
| `search_query` | enum | No | N/A | Filter results contain search query. The filter will apply to URL, username, and `content_creator` if applicable. |
| `start_date` | datetime | No | Earliest date available | Filter results that are added to the partner-publisher list after the provided start date. Dates must be represented in the format YYYY-MM-DD. If both `start_date` and `end_date` are omitted, query all dates available. |
| `end_date` | datetime | No | Latest date available | Filter results that are added to the partner-publisher list before the provided end date. Dates must be represented in the format YYYY-MM-DD. If both `start_date` and `end_date` are omitted, query all dates available. |
| `blue_verified` | enum | No | all | Filter non `audience_network` results by verification. Accepted values are `yes`, `no`, `all`. If omitted, default to all. |
| `follower_count` | enum | No | all | Filter non `audience_network` results by follower count. Accepted values are `less_than_10K`, `between_10K_and_100K`, `between_100K_and_1M`, `between_1M_and_10M`, `greater_than_10M`, all. If omitted, default to all. |
| `app_store_category_contains` | string | No | N/A | Filter `audience_network` results when `app_store_category` contains the query string. |
| `include_summary` | boolean | No | true | Include all summary fields in the response. |

### Fields

The valid platform and position combinations are:

* `platform=audience_network`

* `platform=facebook&position=instream_video`

* `platform=facebook&position=facebook_reels_overlay`

| Field | Type | Platform | Default | Description |
| --- | --- | --- | --- | --- |
| `ads_in_live_videos` | boolean | facebook instream | N/A | Lists if this Page is a select, approved partner that has had a partner live stream in the past 90 days. |
| `age_rating` | integer | `audience_network` | N/A | Lists if the app is recommended for people of a certain age, according to the App Store or Google Play. Special values are: 0 = Unrated, 1 = Everyone. |
| `app_store_category` | string | `audience_network` | N/A | Lists the type of app, according to the App Store or Google Play. |
| `blue_verified_page` | boolean | facebook, instagram | N/A | Lists whether this Page or account has a verified badge. The verified badge next to a Facebook Page or Instagram account means that Meta has confirmed that this is the authentic presence of the public figure, celebrity, or global brand it represents. |
| `content_creator` | string | ALL | N/A | Lists the creator's name. On Facebook this means the Page name. On Instagram, this means the account name. On Audience Network, this means the name on the App Store or Google Play |
| `date_added` | string | ALL | N/A | Lists the date that this publisher was added to the partner-publisher list. |
| `is_audience_network_classic` | boolean | `audience_network` | N/A | Lists if the publisher is a classic audience network. |
| `is_audience_network_rewarded` | boolean | `audience_network` | N/A | Lists if the publisher showed any ad with this display format recently. |
| language | string | ALL | N/A | Lists the detected language for this Page. |
| `median_views_per_video_in_last_28_days` | integer | facebook instream, facebook reels | N/A | Lists the median views received on videos uploaded in the last 28 days. |
| `page_followers` | integer | facebook | N/A | Lists how many followers this Page has. |
| url | string | ALL | N/A | Lists the URL of the Page. |
| username | string | facebook, instagram | N/A | Lists the username of the Page. (Default) |
| `videos_uploaded_last_week` | integer | facebook instream, facebook reels | N/A | Lists the number of videos this Page uploaded in the last 7 days from when this report was generated. This number includes videos that may not be publicly viewable. |

### Summary

| Field | Type | Default? | Description |
| --- | --- | --- | --- |
| `publisher_list_earliest_date` | datetime | Yes | Earliest date added for a publisher in the list. |
| `publisher_list_latest_date` | datetime | Yes | Latest date added for a publisher in the list. |
| `total_count` | integer | Yes | Total count of publishers. |

**Sample request**

Get the partner-publisher list for the Facebook in-stream videos placement with all relevant fields:

```curl
GET /brand_safety_publisher_list?platform=facebook&position=instream_video&fields=ads_in_live_videos,blue_verified_page,content_creator,date_added,language,median_views_per_video_in_last_28_days,page_followers,url,username,videos_uploaded_last_week
```

**Sample response**

```curl
{
  "data": [
    {
      "ads_in_live_videos": false,
      "blue_verified_page": true,
      "content_creator": "Mr Bean",
      "date_added": "2023-03-09",
      "language": "English",
      "median_views_per_video_in_last_28_days": 269139,
      "page_followers": 137011404,
      "url": "https://www.facebook.com/example1",
      "username": "MrBean",
      "videos_uploaded_last_week": 2
    },
    {
      "ads_in_live_videos": false,
      "blue_verified_page": true,
      "content_creator": "Real Madrid C.F.",
      "date_added": "2023-03-09",
      "language": "Spanish",
      "median_views_per_video_in_last_28_days": 187426,
      "page_followers": 117787531,
      "url": "https://www.facebook.com/example2",
      "username": "RealMadrid",
      "videos_uploaded_last_week": 27
    },
    ...
  ],
  ...
  "summary": {
    "publisher_list_latest_date": "2022-10-02",
    "publisher_list_earliest_date": "2017-10-07",
    "total_count": 201681
  }
}
```

### Error codes

| Code | Subcode | Description |
| --- | --- | --- |
| 100 |  | Invalid parameter. Query parameter is set but value is not accepted. |
|  | 2349019 | Invalid Platform and Position Parameter Combination. |
|  | 2349022 | Start Date Out Of Range. |
|  | 2349023 | End Date Out Of Range. |
|  | 2349024 | Start Date Or End Date Out Of Range. |
|  | 2349025 | Start Date Must Be Earlier Than End Date. |
| 200 |  | Permissions error. |
| 80011 |  | There have been too many calls to Brand Safety APIs. Wait a bit and try again. |

**`fbtrace_id`:** Internal support identifier. When reporting a bug related to a Graph API call, include the `fbtrace_id` to help us find log data for debugging.

## Get additional partner-publisher list metadata for all available placements

| Field | Type | Default? | Description |
| --- | --- | --- | --- |
| `audience_network_latest_date` | string | Yes | Latest date for `audience_network`. |
| `audience_network_total_publishers` | integer | Yes | Total publishers for `audience_network`. |
| `facebook_instream_video_latest_date` | string | Yes | Latest date for `facebook_instream_video`. |
| `facebook_instream_video_total_publishers` | integer | Yes | Total publishers for `facebook_instream_video`. |
| `facebook_reels_overlay_latest_date` | string | Yes | Latest date for `facebook_reels_overlay`. |
| `facebook_reels_overlay_total_publishers` | integer | Yes | Total publishers for `facebook_reels_overlay`. |

Get the partner-publisher list metadata for all available placements:

**Sample request**

```curl
GET /brand_safety_publisher_list_metadata
?fields=audience_network_latest_date,audience_network_total_publishers,facebook_instream_video_latest_date,facebook_instream_video_total_publishers,facebook_reels_overlay_latest_date,facebook_reels_overlay_total_publishers
```

**Sample response**

```json
{
  "data": [
    {
      "facebook_instream_video_total_publishers": 201681,
      "facebook_instream_video_latest_date": "2022-10-02",
      "facebook_reels_overlay_total_publishers": 223318,
      "facebook_reels_overlay_latest_date": "2022-10-01",
      "audience_network_total_publishers": 98621,
      "audience_network_latest_date": "2022-10-03"
    }
  ]
}
```

### Error codes

| Code | Subcode | Description |
| --- | --- | --- |
| 100 |  | Invalid parameter. |
| 200 |  | Permissions error |
| 80011 |  | There have been too many calls to Brand Safety APIs. Wait a bit and try again. |

### Limits

#### [Page limits](https://developers.facebook.com/docs/graph-api/results)

The following page limits apply to all paginated APIs for this product:

* Default number of items per page: 25.

* Maximum number of items per page: 5000.

#### [Rate limits](https://developers.facebook.com/docs/graph-api/overview/rate-limiting)

The following rate limits apply at the product-level, meaning all partner-publisher list endpoints collectively. Relative quota usage per resource is returned in the `x-business-use-case-usage` response header for every request.

* Maximum call count per hour: 2.4K calls.

## Learn more

* [Graph API - Overview](https://developers.facebook.com/docs/graph-api/overview)

* For an interactive UI, try Meta's [Graph API Explorer](https://developers.facebook.com/tools/explorer/)

* [Marketing API \| Best Practices](https://developers.facebook.com/documentation/ads-commerce/marketing-api/best-practices)

* [Marketing API \| Error Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/error-reference)

* [Marketing API \| Authorization](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/authorization)

* [Rate Limits](https://developers.facebook.com/docs/graph-api/overview/rate-limiting)

* [API Changelog \| Developer Doc](https://developers.facebook.com/docs/graph-api/changelog)

* [System Users \| Developer Doc](https://developers.facebook.com/docs/marketing-api/system-users#generate-token)

* [Access Tokens \| Developer Doc](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens)
