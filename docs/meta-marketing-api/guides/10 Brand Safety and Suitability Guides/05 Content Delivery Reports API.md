<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/brand-safety-and-suitability/content-delivery-report | Saved: 2026-09-19 -->

# Content Delivery Reports API



Delivery reports provide approximate impressions information at the content level. Delivery reports give greater transparency into where advertisers' ads appeared.

While Meta applies brand suitability controls as effectively as possible, Meta can't guarantee that all content will be compliant or aligned with advertisers' unique brand suitability standards.

You can see what Meta content an advertiser's ads appeared next to or within by downloading content delivery reports, either for all publishers in a placement or specific publishers. Meta provides IDs report that can be used to see the content.

Additional documentation you can review or share with advertisers. Differences are to be expected as this content-delivery-report page is curated for Meta business partners.

* [About Delivery Reports \| Meta Business Help Center](https://business.facebook.com/business/help/1547244292106324?id=1769156093197771)

* [Review Delivery Reports \| Meta Business Help Center](https://business.facebook.com/business/help/602174603449509?id=1769156093197771)

## Permissions
* The app requires the `brand_safety_third_party_partners` capability grant.

## Get a content delivery report

### Get the available date range for the report
The returned date times do not necessarily mean a specific ad campaign has data available for every hour in that range. These date ranges are based on global availability.

**Sample Request**

```curl
GET /content_delivery_report_date_ranges
?platform=facebook
&position=instream_video
&fields=earliest_datetime,latest_datetime
```

**Sample Response**

```json
{
  "data": [
    {
      "earliest_datetime": "2025-04-07T00:00",
      "latest_datetime": "2025-04-21T23:00"
    }
  ]
}
```

### Get an ad set-level content delivery report

**Warning:** This API requires "read" (i.e. "View Performance") permission on the ad account.

#### Purpose
Fetch all ad impressions on a content level for an ad set per hour. The lookback period is 15 days. Each result will contain a list of objects with metadata for the content. Note that the API returns only public content.

#### Parameters

| Fields | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| platform | `enum` | Y |  | Ads reporting platform type. Accepted values are: facebook. |
| position | enum | Y |  | Ads reporting platform position type. Accepted values are: `instream_video`, `facebook_reels_overlay`. |
| datetime | datetime | N | Latest available datetime | Datetime of the report in format: [YYYY]-[MM]-[DD]T[HH]:00. |
| limit | integer | N | 25 | Controls the number of results returned. The range is [25, 5000]. |

#### Fields

The data body returns a: `List<ContentDeliveryReportNode>`. The node structs and fields are defined below.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `content_id` | fbid | Y | Unique ID of the content (for example, video, app, and so on) |
| `creator_id` | fbid | Y | The Unique ID of the creator or FB page |
| `estimated_impressions`* | integer | Y | The sum of the ad impressions served on the content |

*`Estimated_impressions` is listed as an "estimated" number of impressions, due to Meta's backend calculating this number in semi-real time. The estimated impressions number matches what Meta shows in our own reporting and ads billing.

#### Summary
Always returned by default. Set summary field to `false` (for example, summary=false) to not receive the summary node.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `earliest_datetime` | datetime | Y | Earliest datetime with data available for the requested campaign. |
| `latest_datetime` | datetime | Y | Latest datetime with data available for the requested campaign. |
| `total_count` | integer | Y | Total number of rows in the report. |

#### Permissions

Requires "View Performance" access to the ad account.

Get an ad set level content delivery report for a specific placement and datetime. Replace `ad_set_id` with the ad set ID for the report. And ensure the `datetime` is within the available date range returned from the date ranges API:

**Sample Request - Facebook In-stream Video**

```curl
GET /{ad_set_id}/content_delivery_report
?platform=facebook
&position=instream_video
&datetime=2025-04-21T23:00
&fields=content_id,creator_id,estimated_impressions
&summary=true
```

**Sample Response**

```json
{
  "data": [
    {
      "content_id": "<CONTENT_ID>",
      "creator_id": "<CREATOR_ID>",
      "estimated_impressions": 13443
    },
    {
      "content_id": "<CONTENT_ID_2>",
      "creator_id": "<CREATOR_ID>",
      "estimated_impressions": 13391
    }
    ...
  ],
  ...
  "summary": {
    "total_count": 5168,
    "earliest_datetime": "2025-04-07T00:00",
    "latest_datetime": "2025-04-21T23:00"
  }
}
```

**Sample Request - Facebook Ads on Reels**

```curl
GET /{ad_set_id}/content_delivery_report
?platform=facebook
&position=facebook_reels_overlay
&datetime=2025-04-21T23:00
&fields=content_id,creator_id,estimated_impressions
&summary=true
```

**Sample Response**

```json
{
  "data": [
    {
      "content_id": "<CONTENT_ID>",
      "creator_id": "<CREATOR_ID>",
      "estimated_impressions": 13443
    },
    {
      "content_id": "<CONTENT_ID_2>",
      "creator_id": "<FB_CREATOR_ID>",
      "estimated_impressions": 13391
    }
    ...
  ],
  ...
  "summary": {
    "total_count": 5168,
    "earliest_datetime": "2025-04-07T00:00",
    "latest_datetime": "2025-04-21T23:00"
  }
}
```

## Error codes

See also [Marketing API \| Error Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/error-reference)

| Code | Subcode | Description |
| --- | --- | --- |
| 100 |  | Invalid Parameter |
|  | 2349019 | Invalid Platform And Position Parameter Combination. |
|  | 2349048 | Date out of Range. |
|  | 2349049 | Invalid Cursor. |
| 200 |  | Permissions error. |
| 80011 |  | There have been too many calls to Brand Safety APIs. Wait a bit and try again. |

`fbtrace_id`: Internal support identifier. When reporting a bug related to a Graph API call, include the `fbtrace_id` to help us find log data for debugging

## Limits

**[Page Limits](https://developers.facebook.com/docs/graph-api/results)**

| Placement | Default Page Size | Maximum Page Size |
| --- | --- | --- |
| `instream_video` `facebook_reels_overlay` | 100 | Not configurable. |

**[Rate Limits](https://developers.facebook.com/docs/graph-api/overview/rate-limiting)**

The following rate limits apply at the product-level, meaning all Publisher List endpoints collectively. Relative quota usage per resource is returned in the `x-business-use-case-usage` response header for every request.

* Maximum call count per hour: 144K calls.

## Facebook Video and Page APIs

### Video API

**Purpose**

Fetch metadata and downloadable source file for an individual video on Facebook. The `content_id` returned by Content Delivery Report API can be used here.

**Sample Request**

```curl
GET /{video_id}
?fields=permalink_url,source,created_time,updated_time,from,description,picture
```

**Sample Response**

```json
{
  "permalink_url": "/brookselitelandscapes/videos/773275220658768/",
  "source": "https://video-sjc3-1.xx.fbcdn.net/v/t39.25447-2/296672208_3302846743372673_5139359605630684497_n.mp4?_nc_cat=102&vs=16d3a1916d225711&_nc_vs=HBksFQAYJEdORGJyaEdCNF9MdTY3c0xBRkhObS1KVXJGSkhibWRqQUFBRhUAAsgBABUAGCRHTWREcWhGdTM0WUhPNkVBQUo2S25RNlNqWlVwYnJGcUFBQUYVAgLIAQBLBogScHJvZ3Jlc3NpdmVfcmVjaXBlATENc3Vic2FtcGxlX2ZwcwAQdm1hZl9lbmFibGVfbnN1YgAgbWVhc3VyZV9vcmlnaW5hbF9yZXNvbHV0aW9uX3NzaW0AKGNvbXB1dGVfc3NpbV9vbmx5X2F0X29yaWdpbmFsX3Jlc29sdXRpb24AEWRpc2FibGVfcG9zdF9wdnFzABUAJQAcAAAmlqmRwqfdzQMVAigKc2FuZGNhc3RsZRgLdnRzX3ByZXZpZXccF0BdEQYk3S8bGClkYXNoX2k0bGl0ZWJhc2ljXzVzZWNnb3BfaHEyX2ZyYWdfMl92aWRlbxIAGBh2aWRlb3MudnRzLmNhbGxiYWNrLnByb2Q4ElZJREVPX1ZJRVdfUkVRVUVTVBsKiBVvZW1fdGFyZ2V0X2VuY29kZV90YWcGb2VwX2hkE29lbV9yZXF1ZXN0X3RpbWVfbXMBMAxvZW1fY2ZnX3J1bGUHdW5tdXRlZBNvZW1fcm9pX3JlYWNoX2NvdW50BDMxOTERb2VtX2lzX2V4cGVyaW1lbnQADG9lbV92aWRlb19pZA83NzMyNzUyMjA2NTg3NjgSb2VtX3ZpZGVvX2Fzc2V0X2lkEDUyMjg2MjA5NTcxNzU0NDEVb2VtX3ZpZGVvX3Jlc291cmNlX2lkEDEwMTUzNTI3NTI0ODI4OTEcb2VtX3NvdXJjZV92aWRlb19lbmNvZGluZ19pZBAxMzc4NTMyODI1OTY4OTUxDnZ0c19yZXF1ZXN0X2lkACUCHAAlxAEbB4gBcwQ3OTA1AmNkCjIwMjItMDctMjgDcmNiBDMxMDADYXBwE0ZhY2Vib29rIGZvciBpUGhvbmUCY3QZQ09OVEFJTkVEX1BPU1RfQVRUQUNITUVOVBNvcmlnaW5hbF9kdXJhdGlvbl9zBzExNi4zMDkCdHMVcHJvZ3Jlc3NpdmVfZW5jb2RpbmdzAA%3D%3D&ccb=1-7&_nc_sid=41a7d5&efg=eyJ2ZW5jb2RlX3RhZyI6Im9lcF9oZCJ9&_nc_ohc=czalgyZgc1YAX9VjHuC&_nc_ht=video-sjc3-1.xx&oh=00_AT--2EefgQ54VCSNMmiSpC2I3rLV5IWuHQBWZv63sB-qKw&oe=62F039D4&_nc_rid=401297287969366",
  "created_time": "2022-07-28T23:29:13+0000",
  "updated_time": "2022-08-02T22:34:22+0000",
  "from": {
    "name": "Brooks Elite Landscapes",
    "id": "332104164111679"
  },
  "description": "👋 Welcome to our next job site in Mechanicsville!",
  "picture": "https://scontent-sjc3-1.xx.fbcdn.net/v/t15.5256-10/296266458_3171248163095396_202928376065076133_n.jpg?stp=dst-jpg_s160x160&_nc_cat=101&ccb=1-7&_nc_sid=08861d&_nc_ohc=XcFNSij3VIUAX-WxgHV&_nc_ht=scontent-sjc3-1.xx&oh=00_AT-mZFUSES-e5dX0AKzhKZUuebsrTgilMYBWPSubpe_2SQ&oe=62F03711",
  "id": "773275220658768"
}
```

### Page API

This API requires the [Page Public Content Access](https://developers.facebook.com/docs/features-reference/page-public-content-access) app review permission.

**Purpose**

Fetch detailed information about a page on Facebook.

**Sample Request**

```curl
GET /{page_id}
?fields=name,about,business,category,link
```

**Sample Response**

```json
{
  "name": "Capital T Industries",
  "about": "We own the earth.",
  "business": {
    "id": "981914045859716",
    "name": "Capital T Industries"
  },
  "category": "Computer Company",
  "link": "https://www.facebook.com/1955398231373718",
  "id": "1955398231373718"
}
```

## Additional useful documentation

[Graph API - Overview](https://developers.facebook.com/docs/graph-api/overview)

For a user-friendly, interactive UI, try out [Meta's Graph API Explorer](https://developers.facebook.com/tools/explorer/)

[Marketing API \| Best Practices](https://developers.facebook.com/documentation/ads-commerce/marketing-api/best-practices)

[Marketing API \| Authorization](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/authorization)

[API Changelog \| Developer Doc](https://developers.facebook.com/docs/graph-api/changelog)

[System Users \| Developer Doc](https://developers.facebook.com/docs/marketing-api/system-users#generate-token)

[Access Tokens \| Developer Doc](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens)

## FAQ
Q: How do you get a list of ad accounts for a business?

A: [Graph API Reference: Business \| Ad Accounts](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/ad_accounts)

Q: How do you get a list of campaigns for an ad account?

A: [Graph API Reference: Ad Account \| Campaigns](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/campaigns)

Q: How do you get a list of adsets for a campaign?

A: [Graph API Reference: Campaign \| Adsets](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group/adsets)

Q: Does the Content Delivery report (CDR) API contain an `advertiser_time_zone` field like in Adjacent CDR?  

A: No, Meta expects partners to choose the correct date time according to their advertiser's time zone. The datetimes entered into the CDR API should be in Pacific Time (PT).

Q: How do you link data across various datasets (marketing API, to ad impressions and campaign information, to content)?

A: Content can be connected by `content_id` and/or `content_owner_id` between the Brand Safety Content Delivery Report (CDR) API and the respective Video and Page APIs. There are also [Ads APIs](https://developers.facebook.com/documentation/ads-commerce/marketing-api/brand-safety-and-suitability/feed-verification#ads-apis) that are connected by the ad object (`adaccount_id`, `adset_id`, and so on).

Q: Is each line a unique piece of content? Do you need to deduplicate any data/rows?

A: Each row is a unique piece of Facebook content represented by its unique `content_id`.

Q: What parameters are needed for the API?

A: The two required parameters are platform and position. The date field is optional and will use the most recent data available if omitted.

Q: How can an advertiser grant "read" (i.e. "View Performance") access to an ad account?

A: An advertiser can grant READ access to a partner for their ad account using the "Assign Partners" button in Business Setting.
