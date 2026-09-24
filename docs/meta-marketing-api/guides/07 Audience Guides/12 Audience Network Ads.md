<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/audience-network | Saved: 2026-09-19 -->

# Audience Network Ads



Facebook's [Audience Network](https://developers.facebook.com/products/app-monetization/audience-network/) serves ads on other publishers' iOS and Android apps and mobile websites. Then, you can use Facebook's targeting options to find your audience within those mobile apps and mobile websites.

On this page, see [Audience Network rules for ad creative and placement](#creative-placement). Then, learn to create ads:

- [Basic Audience Network Ad](#create-audience-network-ad)
- [Mobile Ads](#mobile-ads)
- [Carousel Ads](#example_carousel)
- [Video Ads](#example_video)
- [Advantage+ Catalog Ads](#example_dpa)

Also learn how to [preview](#preview) and [measure](#measurement) your ad.

## Ad creative and placement {#creative-placement}

Facebook's Audience Network delivers the ad's image on the destination app:

#### Supported ad creative
* [mobile app image ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/mobile-app-ads)
* [mobile app video ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/mobile-app-ads#create_video)
* [link ads](#example_link)
* video link ads
* [carousel link and app ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/videoads)
* [Advantage+ Catalog Ads](https://developers.facebook.com/docs/marketing-api/dynamic-product-ads)

#### Supported [objectives](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group)
* `MOBILE_APP_INSTALLS`
* `MOBILE_APP_ENGAGEMENT`
* `LINK_CLICKS`, see [Blog, Video Expands to Website Clicks](https://developers.facebook.com/ads/blog/post/2015/06/09/video-website-clicks/)
* `CONVERSIONS`, see [Blog, Additional Options for Video](https://developers.facebook.com/ads/blog/post/2015/04/09/expansion-video-objectives/#web_conv)
* `PRODUCT_CATALOG_SALES`

#### Bidding
Use combinations of bid type, `billing event`, and `optimization goal`.

#### Publisher platform
You must use `audience_network` with another platform, such as `facebook`. **You cannot serve ads only on Audience Network.**

| publisher_platform | Description |
| --- | --- |
| `audience_network` | Setting `publisher_platform` to `audience_network` allows the ad to serve on the Audience Network. |

#### Restrictions
Audience Network does not support IAB sizes.

## Create Audience Network Ad {#create-audience-network-ad}

For example, to create a link ad to deliver:
#### Step 1
Create ad campaign. Set `objective` to one of `LINK_CLICKS` or `CONVERSIONS`:

```bash
curl -X POST \
  -F 'name="My campaign"' \
  -F 'objective="OUTCOME_TRAFFIC"' \
  -F 'status="PAUSED"' \
  -F 'special_ad_categories=[]' \
  -F 'is_adset_budget_sharing_enabled=0' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/campaigns
```

#### Step 2
Create the ad set with audience network placement:

```bash
curl \
  -F 'name=My Ad Set' \
  -F 'optimization_goal=LINK_CLICKS' \
  -F 'billing_event=LINK_CLICKS' \
  -F 'bid_amount=2' \
  -F 'daily_budget=1000' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'targeting={
    "device_platforms": ["mobile"],
    "geo_locations": {"countries":["US"]},
    "publisher_platforms": ["facebook","audience_network"]
  }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

For your [ad set](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign), specify a [placement](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/advanced-targeting#placement) and set `publisher_platforms` under ad `targeting` to `audience_network`.

#### Step 3 {#example_link}

Provide link ad creative:

```bash
curl \
  -F 'name=Sample Creative' \
  -F 'object_story_spec={
    "link_data": {
      "image_hash": "<IMAGE_HASH>",
      "link": "<URL>",
      "message": "try it out"
    },
    "page_id": "<PAGE_ID>"
  }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

#### Step 4
Create ad:

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

## Mobile ads {#mobile-ads}

### Image ad for Audience Network

To create a mobile app image ad with audience network placement:

#### Step 1
Create an ad campaign. Set `objective` to `APP_INSTALLS` or [`MOBILE_APP_ENGAGEMENT`](https://developers.facebook.com/docs/app-ads/formats/engagement-ads):

```bash
curl -X POST \
  -F 'name="Mobile App Installs Campaign"' \
  -F 'objective="OUTCOME_APP_PROMOTION"' \
  -F 'status="PAUSED"' \
  -F 'special_ad_categories=[]' \
  -F 'is_adset_budget_sharing_enabled=0' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/campaigns
```

#### Step 2
Create the ad set. Specify Audience Network placement and set `promoted_object` to the app ID:

```bash
curl \
  -F 'name=Mobile App Installs Ad Set' \
  -F 'promoted_object={"application_id":"<APP_ID>","object_store_url":"<APP_STORE_URL>"}' \
  -F 'optimization_goal=APP_INSTALLS' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'bid_amount=2' \
  -F 'daily_budget=1000' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'targeting={
    "device_platforms": ["mobile"],
    "geo_locations": {"countries":["US"]},
    "publisher_platforms": ["facebook","audience_network"],
    "user_os": ["IOS"]
  }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

#### Step 3

Create mobile app ad image creative:

```bash
curl \
  -F 'object_story_spec={
    "link_data": {
      "call_to_action": {"type":"INSTALL_MOBILE_APP","value":{"link":"<APP_STORE_URL>"}},
      "image_hash": "<IMAGE_HASH>",
      "link": "<APP_STORE_URL>",
      "message": "Message",
      "name": "Link title"
    },
    "page_id": "<PAGE_ID>"
  }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

#### Step 4

Create ad:

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

See [Mobile App Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/mobile-app-ads).

### Video ad for Audience Network

To create a mobile app video ad with Audience Network placement, follow Steps 1 and 2 from **Image Ad For Audience Network**. Then, provide video creative:

```bash
curl \
  -F 'object_story_spec={
    "page_id": "<PAGE_ID>",
    "video_data": {
      "call_to_action": {"type":"INSTALL_MOBILE_APP","value":{"link":"<APP_STORE_URL>"}},
      "image_url": "<THUMBNAIL_URL>",
      "video_id": "<VIDEO_ID>"
    }
  }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

To finish, create your ad. See Step 4 from **Image Ad For Audience Network**.

### Video link ad for Audience Network

To create a video link ad with audience network placement:

#### Step 1
Create ad campaign with `objective` set to `LINK_CLICKS` or `CONVERSIONS`:

```bash
curl -X POST \
  -F 'name="My campaign"' \
  -F 'objective="OUTCOME_TRAFFIC"' \
  -F 'status="PAUSED"' \
  -F 'special_ad_categories=[]' \
  -F 'is_adset_budget_sharing_enabled=0' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/campaigns
```

#### Step 2
Create the ad set with audience network placement:

```bash
curl \
  -F 'name=My Ad Set' \
  -F 'optimization_goal=LINK_CLICKS' \
  -F 'billing_event=LINK_CLICKS' \
  -F 'bid_amount=2' \
  -F 'daily_budget=1000' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'targeting={
    "device_platforms": ["mobile"],
    "geo_locations": {"countries":["US"]},
    "publisher_platforms": ["facebook","audience_network"]
  }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

#### Step 3

Upload a video with a link. Upload an unpublished [video to your page](https://developers.facebook.com/docs/graph-api/reference/page/videos) with a call to action as a link. You can also upload videos to your ad account [video library](https://developers.facebook.com/docs/marketing-api/advideo):

```bash
curl \
  -F "title=Book your trip to Alaska" \
  -F "picture=http://thumbnailurl.com/pic1" \
  -F "source=<VIDEO_FORM_DATA>" \
  -F "published=0" \
  -F "call_to_action={'type':'BOOK_TRAVEL','value':{'link':'http://example.com'}}" \
  -F "access_token=<PAGE_TOKEN>" \
https://graph-video.facebook.com/v25.0/<PAGE_ID>/videos
```

#### Step 4

Provide [ad creative](https://developers.facebook.com/docs/reference/ads-api/adcreative). Use the page post ID to provide this:

```bash
curl -X POST \
  -F 'name="Sample Promoted Post"' \
  -F 'object_story_id="<PAGE_ID>_<POST_ID>"' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

#### Step 5
Create ad:

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

## Carousel ads {#example_carousel}

On Audience Network, Facebook displays only the first two `child_attachments` in your carousel, in the order provided. For carousel ads on Audience Network, note the following:

* Campaign `objective` must be `MOBILE_APP_INSTALLS`, `MOBILE_APP_ENGAGEMENT`, `LINK_CLICKS`, or `CONVERSIONS`
* Ad set `targeting/publisher_platforms` must include `audience_network`

See [Ads Product Guide](https://www.facebook.com/business/ads-guide/), [Preview API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/generatepreview), and [Carousel Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/videoads#create).

## Video ads {#example_video}
You can specify the Audience Network position in targeting at the ad set level:

```
"audience_network_positions": [ "classic", "instream_video"]
```

See [Video Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/videoads).

## Advantage+ Catalog Ads {#example_dpa}
To use Audience Network as a placement for Advantage+ catalog ads:

* Campaign must have `objective=PRODUCT_CATALOG_SALES`
* Ad set `targeting/publisher_platforms` must include `audience_network`

See [Advantage+ Catalog Ads](https://developers.facebook.com/docs/marketing-api/dynamic-product-ads/ads-management).

## Ad preview {#preview}
To preview for your Audience Network ad:

#### Step 1
Call `/previews` for your [ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup)

#### Step 2
Specify `ad_format=`:

* `MOBILE_BANNER` for mobile app or web banner,  
* `MOBILE_INTERSTITIAL` for mobile app interstitial, or
* `MOBILE_NATIVE` for mobile app or web native format previews
* `MOBILE_MEDIUM_RECTANGLE`
* `MOBILE_FULLWIDTH`
* `AUDIENCE_NETWORK_INSTREAM_VIDEO`
* `AUDIENCE_NETWORK_OUTSTREAM_VIDEO`
* `AUDIENCE_NETWORK_INSTREAM_VIDEO_MOBILE`
* `AUDIENCE_NETWORK_REWARDED_VIDEO`
* `AUDIENCE_NETWORK_NATIVE_BANNER`
* `MESSENGER_MOBILE_INBOX_MEDIA`  

#### Step 3
Mobile web previews appear the same as mobile app.

```
https://graph.facebook.com/<API_VERSION>/<AD_ID>/previews?ad_format=MOBILE_BANNER
https://graph.facebook.com/<API_VERSION>/<AD_ID>/previews?ad_format=MOBILE_INTERSTITIAL
https://graph.facebook.com/<API_VERSION>/<AD_ID>/previews?ad_format=MOBILE_NATIVE
```

The API returns an iFrame referencing its own CSS, and generates the preview image. This iFrame is only valid for 24 hours, see [Ad Preview, Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/generatepreview).

## Measurement {#measurement}
To see your ad's performance in suggested videos feeds, query `/insights` with `breakdowns=['publisher_platform']`, see [Ads Insights Guide](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights). Results look like this:

```
{
  ......
  "spend": 9.23,
  "today_spend": 0,
  "total_action_value": 0,
  "total_actions": 1,
  "total_unique_actions": 1,
  "link_clicks": 0,
  "placement": "mobile_feed"
},
{
  ......
  "spend": 7.73,
  "today_spend": 0,
  "total_action_value": 0,
  "total_actions": 6,
  "total_unique_actions": 5,
  "link_clicks": 3,
  "placement": "mobile_video_channel"
},
{
  ......
  "spend": 6.23,
  "today_spend": 0,
  "total_action_value": 0,
  "total_actions": 3,
  "total_unique_actions": 2,
  "link_clicks": 1,
  "placement": "desktop_video_channel"
},
```

`mobile_feed` refers to Feed on Facebook Mobile, `mobile_video_channel` is suggested videos feeds on mobile, and `desktop_video_channel` is suggested videos feeds on desktop.
