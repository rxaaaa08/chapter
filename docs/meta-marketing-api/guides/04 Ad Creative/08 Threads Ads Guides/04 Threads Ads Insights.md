<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/threads-ads/insights | Saved: 2026-09-19 -->

# Get Threads Ads Insights



For stats on your Threads ads, use the [Insights API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights) from ad account to ads.

```bash
curl -G \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<CAMPAIGN_ID>/insights
```

## Limitations

* Meta keeps the volume of Threads ads intentionally low while this placement is in an early testing phase, therefore expect that delivery to Threads will be low. You will see this reflected in your placement breakdown reporting if your campaign delivers on Threads.

## Breakdowns
If you are running a campaign on Instagram, Facebook, and Threads, add `breakdowns=publisher_platform, platform_position` to see the stats of the placements separately:

```bash
curl -X GET \
  -d 'access_token=<ACCESS_TOKEN>' \
  -d 'fields=impressions' \
  -d 'breakdowns=publisher_platform, platform_position' \
"https://graph.facebook.com/v25.0/<AD_SET_ID>/insights"
```

The result looks like this for Threads:

```
{
"data": [

    {
      "impressions": "168",
      "date_start": "2024-03-26",
      "date_stop": "2024-04-24",
      "publisher_platform": "threads",
      "platform_position": "threads_feed"
    },
      ],
  "paging": {
    ...
  }
}
```

When requesting breakdown by `publisher_platform, platform_position` for insights on an ad campaign, the only option for the Threads platform is `threads_feed`.

There are other breakdown combinations which include `publisher_platform, platform_position` that you can use. To track performance of ads with Threads placements with external tools, use the `url_tags` macro [`SITE_SOURCE_NAME`](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/carousel-ads#tag) to distinguish different placements.

## Tracking tags

View tags are not publicly available. When view tags by an approved vendor are permitted on Facebook mobile campaigns, they are also allowed for Threads ads. You can use the [ad creative](https://developers.facebook.com/docs/marketing-api/adcreative) `url_tag` field with Threads ads.

You can use third-party tracking tags for Threads ads, however note that ad delivery is not optimized for third-party tracking tools. To make sure that the third-party tracking tool can track Threads ads properly, use the [ad creative](https://developers.facebook.com/docs/marketing-api/adcreative) `url_tag` field with `utm_source=threads`.
