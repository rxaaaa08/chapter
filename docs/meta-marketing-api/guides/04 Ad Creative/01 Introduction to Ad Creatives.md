<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative | Saved: 2026-09-19 -->

# Ad creative



Use Facebook ads to reach your existing customers and find new ones. Each guide describes Facebook ads products to help meet your advertising goals. There are several types of ad units with a variety of appearances, placement, and creative options. For guidelines on ads units as creative content, see [Facebook Ads Guide](https://www.facebook.com/business/ads-guide/?tab0=Mobile%20News%20Feed).

## Creative
An ad creative is an object that contains all the data for visually rendering the ad. In the API, there are different types of ads that you can create on Facebook. See [the list of ad creative types](https://developers.facebook.com/docs/reference/ads-api/adcreative#overview).

If you have a [campaign](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group) with the Page Post Engagement Objective, you can create an ad that promotes a post made by the Page. This ad is considered a Page post ad. Page post ads require a field called `object_story_id`, which is the `id` property of a Page post. Learn more about [Ad Creative, Reference](https://developers.facebook.com/docs/reference/ads-api/adcreative#create).

An ad creative has three parts:

- The ad creative, defined by the visual attributes of the creative object
- [Placement](#placements) that the ad runs on
- [Preview](#previews) of the unit, per placement

To create the ad creative object, make the following call:

```bash
curl -X POST \
  -F 'name="Sample Promoted Post"' \
  -F 'object_story_id="<PAGE_ID>_<POST_ID>"' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

The response to the API call is the `id` of the creative object. Store the creative id; you need it for the ad object:

```bash
curl -X POST \
  -F 'name="My Ad"' \
  -F 'adset_id="<AD_SET_ID>"' \
  -F 'creative={
       "creative_id": "<CREATIVE_ID>"
     }' \
  -F 'status="PAUSED"' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads
```

### Limits {#limits}
There are limits on the creative's text, image size, image aspect ratio and other aspects of the creative. See the [Ads Guide](https://www.facebook.com/business/ads-guide).

### Read {#read}
In the Ads API, each field you want to retrieve needs to be asked for explicitly, except for `id`. Each object's [Reference](https://developers.facebook.com/docs/reference/ads-api/adcreative#read) has a section for reading back the object and lists what fields are readable. For the creative, the readable fields are the same as those specified when you created the object, plus `id`.

```bash
curl -G \
  -d 'fields=name,object_story_id' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<CREATIVE_ID>
```

## Placements {#placements}
A placement is where Facebook shows your ad, such as on Feed on desktop, Feed on a mobile device or on the right column. See [Ads Product Guide](https://www.facebook.com/business/ads-guide/).

Run ads across the full range of available placements. Facebook's ad auction delivers ad impressions to the placement most likely to drive campaign results at the lowest possible cost.

To use this optimization, leave this field blank. You can also select specific placements in an ad set's `target_spec`.

This example has a Page post ad. The available placements are Mobile Feed, Desktop Feed and Right column of Facebook. In the API, see [Placement Options](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/advanced-targeting#placement). If you choose `desktopfeed` and `rightcolumn` as the `page_type`, the ad runs on Desktop Feed and Right column placements. Any ad created below this ad set has only the desktop placement.

```bash
curl -X POST \
  -F 'name=Desktop Ad Set' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'daily_budget=10000' \
  -F 'targeting={
    "geo_locations": {"countries":["US"]},
    "publisher_platforms": ["facebook","audience_network"]
  }' \
  -F 'optimization_goal=LINK_CLICKS' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'bid_amount=1000' \
  -F 'status=PAUSED' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

## Preview an ad {#previews}
You preview an ad in one of two ways — with [ad preview API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/generatepreview) or the [ad preview plugin](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-preview-plugin).

There are three ways to generate a preview with the API:

1. By ad ID
2. By ad creative ID
3. By supplying a creative spec

Following the [reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/generatepreview#html) docs for the preview API, the minimum required API call is:

```bash
curl -G \
  --data-urlencode 'creative="<CREATIVE_SPEC>"' \
  -d 'ad_format="<AD_FORMAT>"' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/generatepreviews
```

The creative spec is an array of each field and value required to create the ad creative.

The ad creative call looks like this:

```bash
curl -X POST \
  -F 'name="Sample Promoted Post"' \
  -F 'object_story_id="<PAGE_ID>_<POST_ID>"' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

Take `object_story_id` and use it in the preview API call:

```bash
curl -G \
  -d 'creative={"object_story_id":"<PAGE_ID>_<POST_ID>"}' \
  -d 'ad_format=<AD_FORMAT>' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/generatepreviews
```

The available values for `ad_format` differ slightly from `page_types`. But, in this scenario, you select Desktop Feed and Right column of Facebook. This requires you to make two API calls to generate the previews for each placement:

```bash
curl -G \
  -d 'creative={"object_story_id":"<PAGE_ID>_<POST_ID>"}' \
  -d 'ad_format=DESKTOP_FEED_STANDARD' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/generatepreviews
```

```bash
curl -G \
  -d 'creative={"object_story_id":"<PAGE_ID>_<POST_ID>"}' \
  -d 'ad_format=RIGHT_COLUMN_STANDARD' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/generatepreviews
```

The response is an iframe that's valid for 24 hours.

## See more

* [Ad Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative)
* [Facebook App Ads](https://developers.facebook.com/docs/app-ads)
* [Ads Guide](https://www.facebook.com/business/ads-guide)
