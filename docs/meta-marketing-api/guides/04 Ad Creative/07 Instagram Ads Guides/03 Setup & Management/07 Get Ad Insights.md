<!-- Source: https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/get-ad-insights | Saved: 2026-09-19 -->

# Get Ad Insights



**Warning:** Beginning June 3, 2024, you can use the `boost_ads_list` field as a convenient and efficient way to to trace past boost Instagram ad information related to the ad. See the [blog](https://developers.facebook.com/blog/post/2024/06/03/instagram-boost-signal-for-ad-eligibility/) for more information.

For stats on your Instagram ads, use the [Insights API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights) from ad account to ads.

```html
curl -G \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<CAMPAIGN_ID>/insights
```

If you are running a campaign on Instagram and Facebook, add `breakdowns=publisher_platform, platform_position` to see the stats of Facebook and Instagram placements separately:

```
curl -X GET \
-d 'access_token=<ACCESS_TOKEN>' \
-d 'fields=impressions' \
-d 'breakdown=publisher_platform, platform_position' \
"https://graph.facebook.com/<API_VERSION>/<AD_SET_ID>/insights"
```

The result looks like this:

```
{
"data": [
    {
      "impressions": "322",
      "date_start": "2024-03-26",
      "date_stop": "2024-04-24",
      "publisher_platform": "instagram",
      "platform_position": "feed"
    },
    {
      "impressions": "13",
      "date_start": "2024-03-26",
      "date_stop": "2024-04-24",
      "publisher_platform": "instagram",
      "platform_position": "instagram_explore"
    },
    {
      "impressions": "168",
      "date_start": "2024-03-26",
      "date_stop": "2024-04-24",
      "publisher_platform": "instagram",
      "platform_position": "instagram_reels"
    },
    {
      "impressions": "617",
      "date_start": "2024-03-26",
      "date_stop": "2024-04-24",
      "publisher_platform": "instagram",
      "platform_position": "instagram_stories"
    }
  ],
  "paging": {
    ...
  }
}
```

When requesting breakdown by `publisher_platform, platform_position` for insights on an ad campaign, the four placement locations in the Instagram Platform are: `feed`, `instagram_explore`, `instagram_reels`, and `instagram_stories`.

There are other breakdown combinations which include `publisher_platform, platform_position` that you can use. To track performance of ads with both Facebook and Instagram placements with external tools, use the `url_tags` macro [SITE_SOURCE_NAME](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/carousel-ads#tag) to distinguish different placements.

### Tracking Tags {#view}

View tags are not publicly available. If we permit view tags by an approved vendor on Facebook mobile campaigns, we also allow them for Instagram ads. You can use [Ad creative's](https://developers.facebook.com/docs/marketing-api/adcreative) `url_tag` field with Instagram ads.

You can use third-party tracking tags for Instagram ads, however note do not optimize ads delivery for third-party tracking tools. To make sure that the third party tracking tool can track Instagram ads properly, use [Ad creative's](https://developers.facebook.com/docs/marketing-api/adcreative) `url_tag` field with `utm_source=instagram`.
