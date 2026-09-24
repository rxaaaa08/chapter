<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/mobile-app-ads | Saved: 2026-09-19 -->

# App Ads



This document describes various ad units designed to drive installs and engagement for desktop and mobile apps.

You should use this ad unit to drive people to your desktop or mobile app for the purpose of either install or engagement using photo, video, [carousel](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/videoads), or [Playable creatives](https://www.facebook.com/business/help/412951382532338).

Conceptually this allows for the following ads:

|  | Photo | Video | Carousel | Playable |
| --- | --- | --- | --- | --- |
| Mobile Install Ad | ✓ | ✓ | ✓ | ✓ |
| Mobile Engagement Ad | ✓ | ✓ | ✓ |  |
| Desktop Install Ad | ✓ | ✓ | ✓ |  |
| Desktop Engagement Ad | ✓ | ✓ | ✓ |  |
| Desktop App Ad for Virtual Goods | ✓ | ✓ | ✓ |  |

Desktop app ads for virtual goods are a subset of desktop engagement, you can use virtual good offers to re-engage your players to come back into your app. For example, an app can offer a discount for an item or a set of their in-app currency in feed to re-engage past payers. See [here](https://developers.facebook.com/docs/payments/ads_virtual_goods) for instructions on how to set up your app to accept payments.

For reference, this is what the mobile install image unit looks like:

This is what the desktop app ad for virtual goods with image looks like

### Prerequisites {#prerequisites}
* To create an app ad, the app developer must complete the steps in this [tutorial](https://developers.facebook.com/docs/tutorials/mobile-app-ads).
* The advertiser must have a Facebook Page with which to run these ads through.

## Create {#create}

When [creating](#create) the ad, note the following requirements:

* [Campaign](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group) objective must be `APP_INSTALLS`, `LINK_CLICKS`, or `CONVERSIONS`.
* [Ad set promoted object](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign#promoted_object) must be set
* [Targeting](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/advanced-targeting)
* For mobile app ads, you must use the [mobile targeting spec](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/advanced-targeting#mobile) `user_os` field. The [placement](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/advanced-targeting#placement) should have a `device_platforms` field with value of ['`mobile`'] and highly recommend the use of the spec's other fields to target mobile devices on Facebook. Optionally, you can specify `publisher_platforms` if you only want certain platforms.
* For canvas app ads, `device_platforms` must be `desktop`. Optionally, you can specify `facebook_positions` if you do not want both Facebook desktop Feed and right-hand-side column.
* When `GET_OFFER` is used for virtual goods, the price must be discounted. See [virtual goods](https://developers.facebook.com/docs/payments/ads_virtual_goods) for more information.

### App Ad call to actions: {#cta_definitions}

The below additional Call to Actions are available for app ads within the `call_to_action` field of a [post](https://developers.facebook.com/docs/graph-api/reference/page/feed) or the [ad creative's `object_story_spec`](https://developers.facebook.com/docs/marketing-api/adcreative#object_story_spec). You can also specify the mobile app's deep link in the `app_link` field, or the desktop app's virtual good object in the `product_link` field.

| Key | Value | Required |
| --- | --- | --- |
| type | Call to action types for mobile, regardless of install or engagement:  <br>`SHOP_NOW`  <br>`BOOK_TRAVEL`  <br>`LEARN_MORE`  <br>`SIGN_UP`  <br>`DOWNLOAD`  <br>`INSTALL_MOBILE_APP`  <br>`USE_MOBILE_APP`  <br>`WATCH_VIDEO`  <br>`WATCH_MORE`  <br>`OPEN_LINK`  <br>Call to action types for desktop install or engagement:  <br>`USE_APP` (desktop apps)  <br>`PLAY_GAME` (desktop game apps)  <br>Call to action types for desktop app ads for virtual goods:  <br>`BUY_NOW`  <br>`GET_OFFER` | yes |
| value | JSON dictionary of:<br>`{"link": "<APP_STORE_LINK>",`<br>`"app_link": "<MOBILE_DEEP_LINK>",`<br>`"product_link": "<VIRTUAL_GOOD_DEEP_LINK>",`<br>`"link_title": "<NAME_FOR_LINK>"}` | yes<br><br>* Only certain values are required |
| value.link | refers to the App Store, Google Play Store, or Facebook Canvas App URL, for example, https://itunes.apple.com/us/app/facebook/id284882215 | yes |
| value.app_link | To define the [deep link](https://developers.facebook.com/docs/ads-for-apps/mobile-app-ads#deep-linking) destination only for mobile apps, for example, `myapp://product/12345`.<br>To specify a deep link for desktop apps you should specify it directly in the URL link field. | yes, only for mobile install or engagement ads |
| value.product_link | To define the URL that points to the product's Open Graph virtual good object. See [here](https://developers.facebook.com/docs/payments/ads_virtual_goods) for setup details. | yes, only for desktop virtual goods |
| value.link_title | Allows you to customize the name for the link, which shows up below the ad's image | no |

#### Field specification {#field_specs}

### Create with photo {#create_image}

To create a desktop or mobile app ad with a photo, first create a link Page Post with a photo using the [ad creative's `object_story_spec: {'link_data': ...}`](https://developers.facebook.com/docs/marketing-api/adcreative#object_story_spec) field.

**Example:**

```bash
curl -X POST \
  -F 'name="Sample Creative"' \
  -F 'object_story_spec={
       "page_id": "<PAGE_ID>",
       "link_data": {
         "call_to_action": {
           "type": "INSTALL_MOBILE_APP",
           "value": {
             "link": "<APP_STORE_URL>"
           }
         },
         "image_hash": "<IMAGE_HASH>",
         "link": "<APP_STORE_URL>",
         "message": "Try it out"
       }
     }' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

Alternatively, you can create the Page Post through the Page's [feed endpoint](https://developers.facebook.com/docs/graph-api/reference/page/feed) and use the post ID in the creative. See the [examples](#examples) section below for more examples.

### Create with carousel {#create_carousel}

To create a mobile app install or engagement ad using the carousel ad format, follow the instructions in the [carousel ads docs](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/videoads) except in each `child_attachments`' `link` field, specify an app store link.

#### Considerations
* Currently carousel mobile app ads support only one app
* Minimum number of 3 images (vs. 2 on non-app ad carousel ads)
* Carousel mobile app ads must have a call to action defined
* The end card (typically displaying the Page's profile photo) will not be displayed for carousel mobile app ads.

Note that you should specify the same app store link in each `child_attachment`. You do not have to specify the link again in the `call_to_action:{'value':{'link':... }}}`

```bash
curl -X POST \
  -F 'name="Carousel app ad"' \
  -F 'object_story_spec={
       "page_id": "<PAGE_ID>",
       "link_data": {
         "message": "My message",
         "link": "http://www.example.com/appstoreurl",
         "caption": "WWW.ITUNES.COM",
         "name": "The link name",
         "description": "The link description",
         "child_attachments": [
           {
             "link": "http://www.example.com/appstoreurl",
             "image_hash": "<IMAGE_HASH>",
             "call_to_action": {
               "type": "USE_MOBILE_APP",
               "value": {
                 "app_link": "<DEEP_LINK>"
               }
             }
           },
           {
             "link": "http://www.example.com/appstoreurl",
             "image_hash": "<IMAGE_HASH>",
             "call_to_action": {
               "type": "USE_MOBILE_APP",
               "value": {
                 "app_link": "<DEEP_LINK>"
               }
             }
           },
           {
             "link": "http://www.example.com/appstoreurl",
             "image_hash": "<IMAGE_HASH>",
             "call_to_action": {
               "type": "USE_MOBILE_APP",
               "value": {
                 "app_link": "<DEEP_LINK>"
               }
             }
           },
           {
             "link": "http://www.example.com/appstoreurl",
             "image_hash": "<IMAGE_HASH>",
             "call_to_action": {
               "type": "USE_MOBILE_APP",
               "value": {
                 "app_link": "<DEEP_LINK>"
               }
             }
           }
         ],
         "multi_share_optimized": true
       }
     }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

### Create with Video {#create_video}

To create an app ad with a video, first upload a video to the [ad account's video library](https://developers.facebook.com/docs/marketing-api/advideo). Then use the video  ID in the [ad creative's `object_story_spec: {'video_data':...}`](https://developers.facebook.com/docs/marketing-api/adcreative#object_story_spec) field.

**Example:**

```bash
curl \
  -F 'name=Sample Creative' \
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

Alternatively, you can create the Page Post through the Page's [video endpoint](https://developers.facebook.com/docs/graph-api/reference/video) and use the video ID in the creative. See the [examples](#examples) section below for more examples.

## Read {#read}

To retrieve details about your Page Post, refer to the [link Page Post docs](https://developers.facebook.com/docs/graph-api/reference/link) or [video Page Post docs](https://developers.facebook.com/docs/graph-api/reference/video).

You can list all Page Posts from the Page's [`/promotable_posts`](https://developers.facebook.com/docs/graph-api/reference/page/feed) edge.

```bash
curl https://graph.facebook.com/v25.0/<PAGE_ID>/promotable_posts
```

To retrieve details about your ad creative, refer to the [ad creative documentation.](https://developers.facebook.com/docs/reference/ads-api/adcreative#read)

## Mobile measurement {#measurement}

[See the main App Ads documentation.](https://developers.facebook.com/docs/app-ads/measuring-your-app-ad)

## Deep links {#deep_links}

### Before you start

* Set up your app to [support deep links](https://developers.facebook.com/docs/ads-for-apps/mobile-app-ads#deep-linking)
* The [`pages_manage_ads` permission](https://developers.facebook.com/docs/pages/overview#permissions)
* A Page access token requested by a person who can perform the [`ADVERTISE` task](https://developers.facebook.com/docs/pages/overview#tasks) on the Page
* The [app link](https://developers.facebook.com/docs/applinks), if your app supports app links

#### Sample code

```html
"call_to_action={
  'type':'LEARN_MORE',
  'value':{
    'link':'https://itunes.apple.com/us/app/facebook/id284882215',
    'app_link':'facebook://path/to/page'
  }
}"
```

Before specifying an app link, you should validate that it has been scraped by calling:

```text
https://graph.facebook.com/v25.0/?type=og&scrape=true&id=<APP_LINK>
```

## Mobile app insights {#insights}

**Warning:** Insights only apply for ads with a [promoted object](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign#promoted_object) containing the app ID. To obtain an app ID, [register](https://developers.facebook.com/docs/tutorials/mobile-app-ads) the app on Facebook.

Meta will provide aggregated daily insights on the demographics of people who installed your app. To retrieve this, you should use an app access token and query

```text
https://graph.facebook.com/v25.0/<APP_ID>/insights/application_mobile_app_installs?&access_token=<ACCESS_TOKEN>
```

You can also breakdown stats by specifying an additional URL parameter, `breakdown`, equal to one of the following values. You cannot currently combine breakdowns.

| Name | Description |
| --- | --- |
| `gender_age` | Break down your statistics on audience's age and gender |
| `country` | Break down your statistics on audience's country |
| `locale` | Break down your statistics on audience's locale |

**Examples:**

```text
https://graph.facebook.com/v25.0/<APP_ID>/insights/application_mobile_app_installs?breakdown=gender_age&access_token=<ACCESS_TOKEN>

https://graph.facebook.com/v25.0/<APP_ID>/insights/application_mobile_app_installs?breakdown=country&access_token=<ACCESS_TOKEN>

https://graph.facebook.com/v25.0/<APP_ID>/insights/application_mobile_app_installs?breakdown=locale&access_token=<ACCESS_TOKEN>
```

## Examples {#examples}
### Create a mobile app install image ad
Step 1. create the Page Post with image. Note that you should use `PAGE_ACCESS_TOKEN` and Pages API session to create Page Post.

```bash
curl \
  -F 'message=Sign up today' \
  -F 'picture=<IMAGE_URL>' \
  -F 'link=<LINK>' \
  -F 'published=1' \
  -F 'call_to_action={"type":"SIGN_UP","value":{"link":"<LINK>"}}' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<PAGE_ID>/feed
```

Step 2. Create the ad creative (`{STORY_ID}` is in form of `'{PAGE_ID}_{POST_ID}'`)

```bash
curl -X POST \
  -F 'object_story_id="<PAGE_ID>_<POST_ID>"' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

Step 3. Use the creative in an ad

```bash
curl -X POST \
  -F 'name="My AdGroup with Redownload"' \
  -F 'adset_id="<AD_SET_ID>"' \
  -F 'creative={
       "creative_id": "<CREATIVE_ID>"
     }' \
  -F 'redownload=1' \
  -F 'status="PAUSED"' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads
```

### Create a mobile app image ad with a deep link, optimizing for clicks, paying for impressions

Step 1. Create the Page Post with image. Note that you should use `PAGE_ACCESS_TOKEN` and Pages API session to create Page Post.

```bash
curl -X POST \
  -F 'message="This is a test message"' \
  -F 'call_to_action={
       "type": "BUY_NOW",
       "value": {
         "link": "<APP_STORE_URL>",
         "app_link": "<DEEP_LINK>"
       }
     }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<PAGE_ID>/feed
```

Step 2. Create the ad creative

```bash
curl -X POST \
  -F 'object_story_id="<PAGE_ID>_<POST_ID>"' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

Step 3. Set the bidding at the ad set, optimizing for clicks, paying for impressions.

```bash
curl \
  -F 'name=LifetimeBudgetSet' \
  -F 'lifetime_budget=100000' \
  -F 'bid_amount=500' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'optimization_goal=LINK_CLICKS' \
  -F 'promoted_object={"application_id":"<APP_ID>","object_store_url":"<APP_STORE_URL>"}' \
  -F 'targeting={
    "facebook_positions": ["feed"],
    "geo_locations": {"countries":["US"]},
    "publisher_platforms": ["facebook","audience_network"],
    "user_os": ["iOS"]
  }' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'end_time=2018-02-06T04:45:30+0000' \
  -F 'status=PAUSED' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

Step 4. Use the creative in an ad

```bash
curl \
  -F 'name=My Ad' \
  -F 'adset_id=<AD_SET_ID>' \
  -F 'creative={"creative_id":"<CREATIVE_ID>"}' \
  -F 'redownload=1' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads
```

### Create a mobile app engagement image ad with an [app link](http://applinks.org/), optimizing for app events, paying for impressions {#example_mae_ocpm_app_events}

Step 1. Create the Page Post with image. Note that you should use `PAGE_ACCESS_TOKEN` and Pages API session to create Page Post.

```bash
curl \
  -F 'message=Check out this App today. Available on iTunes.' \
  -F 'published=1' \
  -F 'link=<APP_STORE_URL>' \
  -F 'picture=<IMAGE_URL>' \
  -F 'call_to_action={
    "type": "LEARN_MORE",
    "value": {"link":"<APP_STORE_URL>","app_link":"<APP_DEEP_LINK>"}
  }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<PAGE_ID>/feed
```

Step 2. Create the ad creative

```bash
curl -X POST \
  -F 'object_story_id="<PAGE_ID>_<POST_ID>"' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

Step 3. Set the bidding at the ad set, optimizing for app events, paying for impressions.

Note you must also set the ad set's `promoted_object` to include a `custom_event_type` to optimize towards, see [ad set docs](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign) for more details.

```bash
curl -X POST \
  -F 'name="A CPA Ad Set optimized for App Events"' \
  -F 'campaign_id="<AD_CAMPAIGN_ID>"' \
  -F 'daily_budget=300' \
  -F 'start_time="2025-11-13T15:11:01-0800"' \
  -F 'end_time="2025-11-20T15:11:01-0800"' \
  -F 'billing_event="IMPRESSIONS"' \
  -F 'optimization_goal="OFFSITE_CONVERSIONS"' \
  -F 'bid_amount=100' \
  -F 'status="PAUSED"' \
  -F 'promoted_object={
       "application_id": "<APP_ID>",
       "object_store_url": "<APP_STORE_URL>",
       "custom_event_type": "PURCHASE"
     }' \
  -F 'targeting={
       "facebook_positions": [
         "feed"
       ],
       "geo_locations": {
         "countries": [
           "US"
         ]
       },
       "user_os": [
         "iOS"
       ]
     }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

Step 4. Use the creative in an ad

```bash
curl \
  -F 'name=My Ad' \
  -F 'adset_id=<AD_SET_ID>' \
  -F 'creative={"creative_id":"<CREATIVE_ID>"}' \
  -F 'redownload=1' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads
```

### Examples for Page Post ads
Note that you should use `PAGE_ACCESS_TOKEN` and Pages API session to create Page Post.

### Create a mobile app install video ad

```bash
  curl \
  -F 'name=My Video' \
  -F 'message=Check out this app!' \
  -F 'thumbnail=<APP_STORE_URL>' \
  -F 'published=0' \
  -F 'call_to_action={"type":"INSTALL_MOBILE_APP","value":{"link":"<APP_STORE_URL>"}}' \
  -F 'source=@<VIDEO_PATH>' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<PAGE_ID>/videos
```

### Create a mobile app video ad with a deep link

```bash
  curl \
  -F 'name=My Video' \
  -F 'message=Check out this app!' \
  -F 'thumbnail=<APP_STORE_URL>' \
  -F 'published=0' \
  -F 'call_to_action={
    "type": "LEARN_MORE",
    "value": {"link":"<APP_STORE_URL>","app_link":"<APP_DEEP_LINK>"}
  }' \
  -F 'source=@<VIDEO_PATH>' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<PAGE_ID>/videos
```

### Create a desktop app install video ad

```bash
  curl \
  -F 'name=My Video' \
  -F 'message=Check out this app!' \
  -F 'thumbnail=<THUMBNAIL_PATH>' \
  -F 'published=0' \
  -F 'call_to_action={"type":"PLAY_GAME","value":{"link":"<THUMBNAIL_PATH>"}}' \
  -F 'source=@<VIDEO_PATH>' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<PAGE_ID>/videos
```

### Create a desktop app ads for virtual goods image ad

```bash
curl \
  -F 'message=Buy coins now!' \
  -F 'picture=<IMAGE_URL>' \
  -F 'link=<LINK>' \
  -F 'published=1' \
  -F 'call_to_action={"type":"BUY_NOW","value":{"link":"<LINK>","product_link":"<PRODUCT_LINK>"}}' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<PAGE_ID>/feed
```

### Create a desktop app ads for virtual goods video ad

```bash
  curl \
  -F 'name=My Video' \
  -F 'message=Buy coins now!' \
  -F 'thumbnail=<THUMBNAIL_PATH>' \
  -F 'published=0' \
  -F 'call_to_action={
    "type": "BUY_NOW",
    "value": {"link":"<THUMBNAIL_PATH>","product_link":"<THUMBNAIL_PATH>"}
  }' \
  -F 'source=@<VIDEO_PATH>' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<PAGE_ID>/videos
```

### Create app ads with Awareness objectives

To provide universal link treatment for the Awareness objective, you can include the app ID under `creative.template_url_spec`. If not provided, the ad will lead users to your website.

```bash
curl \
  -F 'name=Advantage+ Catalog Ads Template Creative Sample' \
  -F 'template_url_spec={
    "config": {
     "app_id": "1596400373958175"
    }
  }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

### Create static ads with Traffic objective app-fallback-to-web behavior

When an app is selected in an ad set, this is the change in `object_story_spec` after web fallback is added.

```bash
curl -X POST \
  -F 'name="Traffic app fallback web sample"' \
  -F 'object_story_spec={
    "page_id": "<PAGE_ID>",
    "template_data": {
    "call_to_action": {
      "type": "INSTALL_MOBILE_APP",
      "value": {
        "link": "https://www.example.com"
        "app_link": "<DEEPLINK_URL>
        "object_store_urls": [
          <STORE_URL_OF_APP>
        ]
      }
    },
    "message": "Test {{product.name | titleize}}",
    "link": "https://www.example.com"",
    "name": "Headline {{product.price}}",
    "description": "Description {{product.description}}"
    }
  }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

If fallback needs to be a store, provide the store URL under the `link` field. If fallback needs to be a website, provide the `object_store_urls` value as a list with just one value — the app store URL of the app — and the `link` field with the website fallback URL.

## Advantage+ catalog ads for mobile app install {#dpa}

[Advantage+ catalog ads](https://developers.facebook.com/docs/marketing-api/dynamic-product-ads) can drive people to install your mobile app. This enables you to retarget people with mobile install ads, based on user behavior.

Step 1. Create a campaign for your product catalog

```bash
curl -X POST \
  -F 'name="App Installs Campaign with Dynamic Product Ads"' \
  -F 'objective="OUTCOME_APP_PROMOTION"' \
  -F 'status="PAUSED"' \
  -F 'special_ad_categories=[]' \
  -F 'is_adset_budget_sharing_enabled=0' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/campaigns
```

Step 2. Create an ad set for a specific product set under the above product catalog

```bash
curl \
  -F 'name=Mobile App Installs Ad Set with Dynamic Product Ads' \
  -F 'bid_amount=3000' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'optimization_goal=APP_INSTALLS' \
  -F 'daily_budget=15000' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'targeting={
    "geo_locations": {"countries":["US"]},
    "publisher_platforms": ["facebook","audience_network"],
    "device_platforms": ["mobile"],
    "user_os": ["iOS"],
    "dynamic_audience_ids": ["<PRODUCT_AUDIENCE_ID>"]
  }' \
  -F 'promoted_object={
    "product_set_id": "<PRODUCT_SET_ID>",
    "application_id": "<APP_ID>",
    "object_store_url": "<APP_STORE_URL>"
  }' \
  -F 'status=PAUSED' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

Step 3. Create the Advantage+ catalog ads creative by using template

```bash
curl -X POST \
  -F 'name="Advantage+ catalog ads template creative sample"' \
  -F 'object_story_spec={
       "page_id": "<PAGE_ID>",
       "template_data": {
         "call_to_action": {
           "type": "INSTALL_MOBILE_APP",
           "value": {
             "link": "http://www.example.com/appstoreurl"
           }
         },
         "message": "Test {{product.name | titleize}}",
         "link": "http://www.example.com/appstoreurl",
         "name": "Headline {{product.price}}",
         "description": "Description {{product.description}}"
       }
     }' \
  -F 'product_set_id="<PRODUCT_SET_ID>"' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

Step 4. Use the above Ad creative in an Ad

```bash
curl \
  -F 'name=My Ad' \
  -F 'adset_id=<AD_SET_ID>' \
  -F 'creative={"creative_id":"<CREATIVE_ID>"}' \
  -F 'redownload=1' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads
```

## Upload playable HTML file to ad account {#playable-html}

```bash
curl -X POST \
  -F "name=<NAME>" \
  -F "source=<>" \
  -F "access_token=<ACCESS_TOKEN>" \
"https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adplayables"
```

* `name`: Name that differentiates the ad asset from other playable ads in the ad account; for example, `{ad_name}` -> `{playable_asset_name}`
* `source`: Absolute path of the file on your local machine
* `access_token`: Can be generated from the [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
* You can also use an existing playable asset ID within the ad account

#### Meta tag in playable HTML file

You can add two metadata tags to your playable HTML 5 file. This enables Meta to attribute the playable in the ads to your app.

```html
...
<head>
  ...
  <meta name="ref-application-id" content="<YOUR_APP_ID>">
  <meta name="ref-asset-id" content="<YOUR_ASSET_ID>">
  ...
</head>
...
```

* Provide your Meta app ID and asset ID meta tag in the playable HTML file. This helps Meta provide accurate insights about the asset when it appears in your ad.
* The asset ID uniquely identifies this playable element in your system.

#### Create Ads in Ad Account

* Set placement to Facebook Feed. Audience Network Rewarded Video and Interstitial only. Contact your Meta partner for more details.
* Creative can only be video with aspect ratio of >= 1
* Set up the budget and schedule
* Create the playable creative in API:

```bash
curl \
  -F 'name=Sample Creative' \
  -F 'object_story_spec={
       "page_id": "<PAGE_ID>",
       "video_data": {
         "call_to_action": {
           "type":"INSTALL_MOBILE_APP",
           "value":{
             "application":<APP_ID>,
             "link":"<APP_STORE_URL>"
           }
         },
         "image_url": "<THUMBNAIL_URL>",
         "link_description": "try it out",
         "video_id": "<VIDEO_ID>"
       }
  }' \
  -F 'playable_asset_id=<PLAYABLE_ASSET_ID>' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

* Create ad in API:

```bash
curl \
  -F 'name=My Ad' \
  -F 'status=ACTIVE' \
  -F 'adset_id=<AD_SET_ID>' \
  -F 'creative={"creative_id":"<CREATIVE_ID>"}' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads
```

## App event optimization {#mai_eventopt}

[See App Events Optimization for App Ads](https://developers.facebook.com/docs/app-ads/optimizing-your-app-ad#app-events-opt-via-api).

### Value optimization

[See Value Optimization for App Ads](https://developers.facebook.com/docs/app-ads/optimizing-your-app-ad#value-optimization).

## Learn more

* [Creating Mobile App Install Ads](https://developers.facebook.com/docs/app-ads/creating-ads)
* [Mobile App Engagement Ads](https://developers.facebook.com/docs/app-ads/formats/engagement-ads)
* [Desktop App Ads](https://developers.facebook.com/docs/ads-for-apps/installs-desktop)
* [Deep linking for Mobile Apps](https://developers.facebook.com/docs/app-ads/deep-linking)
* [Audience Network](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audience-network)
