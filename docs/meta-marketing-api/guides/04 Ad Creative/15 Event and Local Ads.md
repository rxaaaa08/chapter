<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/event-ads | Saved: 2026-09-19 -->

# Event and Local Ads



Event ads can be used to promote any event on Facebook. There are two types of event ads that provide relevant event details, a call-to-action to attend or buy tickets to the event, increase awareness and drive event responses, and send those who are interested to your website to buy tickets.

Local ads help local bricks-and-mortar and service businesses reach local customers efficiently. It enables targeting based on a radius around a location and can reach people based on the combination of where they live and their most recent location. You can use optimized CPM bidding to maximize reach for budget and control frequency.

## Event Ads

### Create a standard event ad

#### Step 1: [Create an ad campaign](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad-campaign) with the `objective` set to `EVENT_RESPONSES`.

```html
curl -X POST \
  -F 'name="My First Event Campaign"' \
  -F 'objective="EVENT_RESPONSES"' \
  -F 'status="PAUSED"' \
  -F 'special_ad_categories=[]' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/campaigns
```

#### Step 2: [Create an ad set](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad-set) with the `optimization_goal` set to `EVENT_RESPONSES`.

Provide the `name`, `campaign_id`, `billing_event`, `targeting`, `lifetime_budget`, `bid_amount`, and `end_time` fields.

```html
curl -X POST \
  -F 'name=My Ad Set' \
  -F 'optimization_goal=EVENT_RESPONSES' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'bid_amount=2' \
  -F 'daily_budget=1000' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'targeting={"geo_locations":{"countries":["US"]}}' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

#### Step 3: [Create the ad creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad-creative).

Provide the images, videos, or text for your ad. The `object_story_spec` parameter contains the `page_id` and a link to the page event, and `object_type` should be set to `EVENT`.

```html
curl -X POST \
  -F 'object_type=EVENT' \
  -F 'object_story_spec={
       "page_id": "<PAGE_ID>",
       "link_data": {
         "link": "<EVENT_LINK>",
         "event_id": <EVENT_ID>
       }
    }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

#### Step 4: [Create an ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad).

Make a `POST` call to the `/{ad-account-id}/ads` endpoint with the `name`, `creative`, `status`, and `adset` fields.

```html
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

#### Step 5: Verify the ad in Ads Manager

Your ad campaign will have the name you used to create it and will include the ad set, ad creative, and ad units.

### Create an event ad to sell tickets with website clicks

Event advertising can drive ticket sales. The event must have a ticket URL to create these ads. The call to action should be set to `Get Tickets`, which takes interested parties to an external ticket site where they can purchase the tickets.

#### Step 1: [Create an ad campaign](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad-campaign) with the `objective` to `OUTCOME_TRAFFIC`.

```html
curl -X POST \
  -F 'name="My campaign"' \
  -F 'objective="OUTCOME_TRAFFIC"' \
  -F 'status="PAUSED"' \
  -F 'special_ad_categories=[]' \
  -F 'is_adset_budget_sharing_enabled=0' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/campaigns
```

#### Step 2: [Create an ad set](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad-set) with the `optimization_goal` set to `LINK_CLICKS`.

```html
curl \
  -F 'name=My Ad Set' \
  -F 'optimization_goal=LINK_CLICKS' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'bid_amount=2' \
  -F 'daily_budget=1000' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'targeting={"geo_locations":{"countries":["US"]}}' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

#### Step 3: [Create the ad creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad-creative).

Make a Page post and event with the following parameters for the ad creative. The ad creative can be a single image, video, or multiple images.

```json
"object_story_spec"={
  "page_id":<PAGE_ID>,
  "link_data": {
    "link":"<LINK_URL>",
    "event_id":<EVENT_ID>,
    "call_to_action": {
      "value": {
        "link":"<LINK_URL>"
      },
      "type":"BUY_TICKETS"
    }
  }
}
```

#### Step 4: [Create an ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad).

Make a `POST` call to the `/{ad-account-id}/ads` endpoint with the `name`, `creative`, `status`, and `adset` fields.

```html
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

#### Step 5: Verify the ad in Ads Manager

Your ad campaign will have the name you used to create it and will include the ad set, ad creative, and ad units.

### Create an event ad to sell tickets with website conversions

Instead of using website clicks as your objective for event ticket sales, you can track activities taken on your site such as viewing the cart or completing a purchase. With this data you can later create a custom or lookalike audience.

#### Step 1: [Create an ad campaign](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad-campaign) with the `objective` set to `CONVERSIONS`.

```html
curl -X POST \
  -F 'name="Conversions Campaign"' \
  -F 'objective="CONVERSIONS"' \
  -F 'status="PAUSED"' \
  -F 'special_ad_categories=[]' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/campaigns
```

#### Step 2: [Create an ad set](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad-set) with the `optimization_goal` set to `OFFSITE_CONVERSIONS`.

Make a `POST` call to the `/{ad-account-id}/adsets` endpoint with the `name`, `campaign_id`, `billing_event`, `targeting`, `lifetime_budget`, `bid_amount`, and `end_time` fields. Set `promoted_object` to `{pixel_id, custom_event_type}`.

If you want to target people that are connected through `pages/apps/events`, specify the `targeting:connections` field as shown below.

```json
{
  "geo_locations": {
    "countries":["US"]
  },
  "connections": [
    {
      "id":<CONNECTIONS_ID>
  }]
}
```

In this case, those that are "Going" to the event with the id of `1700354713548840` are targeted as the audience for the ad.

#### Step 3: [Create the ad creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad-creative).

The ad creative can be a single image, video, or multiple images.

The `object_story_spec` parameter contains the `page_id` and the `link_data` of the event.

```json
"object_story_spec"={
  "page_id":<PAGE_ID>,
  "link_data": {
    "link":"<LINK_URL>",
    "event_id":<EVENT_ID>,
    "call_to_action": {
      "value": {
        "link":"<LINK_URL>"
      },
    "type":"BUY_TICKETS",
    "event_id":<EVENT_ID>
    }
  }
}
```

You can use the `picture` field to point to a link to be used as the image. If you omit the `picture` field, Facebook scrapes a default image from the event link.

##### Carousel ad creatives
For a carousel ad creative, use the `child_attachments` parameter to specify the details that go into each card in the carousel:

* The `link_data:link` parameter refers to the URL for the final card in the carousel.
* The `child_attachments:link` parameter refers to the links for image cards at the beginning of the carousel.
* The `picture` field is the URL of a picture to be used for an image card in the carousel.

```json
{
  "page_id": <PAGE_ID>,
  "link_data": {
    "child_attachments": [
      {
        "link": "<LINK_URL>",
        "picture": "<PICTURE_URL>",
        "call_to_action": {
          "value": {
            "event_id": <EVENT_ID>
          },
          "type": "BUY_TICKETS"
        }
      },
      {
        "link": "<LINK_URL>",
        "picture": "<PICTURE_URL>",
        "call_to_action": {
          "value": {
            "event_id": <EVENT_ID>
          },
          "type": "BUY_TICKETS"
        }
      }
    ],
    "link": "<LINK_URL>",
    "event_id": <EVENT_ID>
  }
}
```

##### Video ad creative

For a video ad creative, use the `video_data` field to specify the required parameters:

* `object_story_spec` contains the `page_id` and `video_data {title, image_url, video_id, call_to_action}`.
* `image_url` is the thumbnail of the video to show.
* `title` is the title to show on the ad.
* `video_id` is scraped from the URL of the Page video (e.g., `https://www.facebook.com/<PAGE_NAME>/videos/<VIDEO_ID>/`)

#### Step 4: [Create an ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad).

Make a `POST` call to the `/{ad-account-id}/ads` with the `name`, `creative`, `status`, and `adset` fields.

```html
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

#### Step 5: Verify the ad in Ads Manager

Your ad campaign will have the name you used to create it and will include the ad set, ad creative, and ad units.

### Optimize event ticket sales on Facebook

You can drive ticket sales directly from your Facebook event page. You must have tickets published to your Facebook event from a qualified ticketing partner to create these ads.

The call to action is a **Get Tickets** button that opens the checkout flow on Facebook.

#### Step 1: [Create an ad campaign](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad-campaign) with the `objective` set to `CONVERSIONS`.

```html
curl -X POST \
  -F 'name="Conversions Campaign"' \
  -F 'objective="CONVERSIONS"' \
  -F 'status="PAUSED"' \
  -F 'special_ad_categories=[]' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/campaigns
```

#### Step 2: [Create an ad set](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad-set) with the `optimization_goal` set to `OFFSITE_CONVERSIONS`.

Make a `POST` call to the `/{ad-account-id}/adsets` endpoint with the `name`, `campaign_id`, `billing_event`, `targeting`, `lifetime_budget`, `bid_amount`, and `end_time` fields. Set `promoted_object` to `{pixel_id, custom_event_type}`.

```html
curl -X POST \
  -F 'name=My Ad Set' \
  -F 'optimization_goal=OFFSITE_CONVERSIONS' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'bid_amount=2' \
  -F 'daily_budget=1000' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'targeting={
      "geo_locations": {
        "countries": ["US"]
      }
    }' \
  -F 'promoted_object={
      "event_id": <EVENT_ID>,
      "pixel_id": "<PIXEL_ID>",
      "application_id": "<APP_ID>",
      "custom_event_type": "PURCHASE"
    }' \
  -F 'access_token=<ACCESS_TOKEN>' \
'https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets'
```

If you want to target people that are connected through `pages/apps/events`, you can specify the `targeting:connections` field as shown below.

```json
{
  'geo_locations': {
    'countries':['US']
  },
  'connections': [
    {
      'id':<CONNECTIONS_ID>
  }]
}
```

In this case, those that are "Going" to the event with the id of `1700354713548840` are targeted as the audience for the ad.

#### Step 3: [Create the ad creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad-creative).

The ad creative can be a single image, video, or multiple images.

The `object_story_spec` parameter contains the `page_id` and the `link_data` of the event.

```json
"object_story_spec"={
  "page_id":<PAGE_ID>,
  "link_data": {
    "link":"<LINK_URL>",
    "event_id":<EVENT_ID>,
    "call_to_action": {
      "value": {
        "link":"<LINK_URL>"
      },
      "type":"BUY_TICKETS",
      "event_id":<EVENT_ID>
    }
  }
}
```

You can use the `picture` field to point to a link to be used as the image, but if it is not provided, a default image will be scraped from the event link.

#### Step 4: [Create an ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad).

Make a `POST` call to the `/{ad-account-id}/ads` with the `name`, `creative`, `status`, and `adset` fields.

```html
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

#### Step 5: Verify the ad in Ads Manager

Your ad campaign will have the name you used to create it and will include the ad set, ad creative, and ad units.

## Local Ads

#### Step 1: [Create an ad campaign](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad-campaign) with the `objective` set to `OUTCOME_AWARENESS`.

```html
curl -X POST \
  -F 'name="Local ad campaign"' \
  -F 'objective="OUTCOME_AWARENESS"' \
  -F 'status="PAUSED"' \
  -F 'special_ad_categories=[]' \
  -F 'is_adset_budget_sharing_enabled=0' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/campaigns
```

#### Step 2: [Create an ad set](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad-set) with the `optimization_goal` set to `REACH`.

##### Requirements

* The `optimization_goal` must be `REACH`.
* The `billing_event` must be `IMPRESSIONS`.
* The `promoted_object` must include the `page_id` of the business you are advertising.
* The [`targeting_specs`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/advanced-targeting#location) must include any combination of `geo_locations`, with the exclusion of `countries`. All locations in the ad set must be in the same country.

To target people who live or are visiting the area 10 miles around 1601 Willow Road, Menlo Park, CA, and excluding the zip code 94040:

```html
curl \
  -F 'name=Local ad adset' \
  -F 'daily_budget=10000' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'optimization_goal=REACH' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'bid_amount=300' \
  -F 'promoted_object={"page_id":"<PAGE_ID>"}' \
  -F 'targeting={
    "device_platforms": ["mobile"],
    "excluded_geo_locations": {"zips":[{"key":"US:94040"}]},
    "geo_locations": {
      "custom_locations": [
        {
          "latitude": 37.48327,
          "longitude": -122.15033,
          "radius": 10,
          "distance_unit": "mile",
          "address_string": "1601 Willow Road, Menlo Park, CA 94025"
        }
      ],
      "location_types": ["home","recent"]
    },
    "publisher_platforms": ["facebook"]
  }' \
  -F 'status=PAUSED' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

With `custom_locations` targeting, you can fetch a suggested radius to target enough people around your business. Use `adradiussuggestion` from the [targeting search API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/targeting-search#radius).

```html
curl -G \
  -d 'latitude=37.449478' \
  -d 'longitude=-122.173016' \
  -d 'distance_unit=kilometer' \
  -d 'type=adradiussuggestion' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/search
```

The response:

```json
{
  "data": [
    {
      "suggested_radius": 16,
      "distance_unit": "kilometer"
    }
  ]
}
```

Create an unpublished Page post for your ad. See [Page Feed](https://developers.facebook.com/docs/graph-api/reference/v24.0/page/feed) to create these Page posts via the API.

Linked Page posts are supported at this time. Video Page posts are available only if you use the `GET_DIRECTIONS` call to action. You can use only posts from the Page whose ID has been set as the `promoted_object` in the ad set.

Unless you use the `LEARN_MORE` call to action, the `link` must match your business's Facebook Page URL.

You can optionally set one of these calls to action:

##### Get Directions

If you use the `GET_DIRECTIONS` call to action, you must also set the `link` to be the coordinates of the store's location.

```json
"call_to_action": {
  "type": "GET_DIRECTIONS",
  "value": {
    "link": "fbgeo:<LATITUDE>,<LONGITUDE>,"<ADDRESS>""
  }
}
```

After clicking on the call-to-action button, your store's location will be presented with a map and directions.

##### Call Now

If you use the `CALL_NOW` call to action, you must also set the telephone number to be used.

**Warning:** `Call Now` should always be used in combination with one of the [mobile targeting options](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/advanced-targeting#mobile) to ensure device capability to make a telephone call.

```json
"call_to_action": {
  "type":"CALL_NOW",
  "value": {
    "link": "tel:<TELEPHONE_NUMBER>"
  }
}
```

Clicking on the call-to-action button launches the device dialer with the number pre-populated.

To format a telephone number:

* The number must start with a plus sign (+) and the country code: `+{COUNTRY_CODE}`.
* The number should not contain non-numeric characters (with exception of the initial plus sign).

The `Call Now` call to action has the following limitations:

* Ad set age targeting should not include people younger than 18 years old.
* If your ad set's geotargeting includes multiple locations, they should all be in the same country.
* Premium-rate phone numbers are not allowed.
* The phone number in your ad must be from the same country as your ad set target locations.

##### Send Message

If you use the `MESSAGE_PAGE` call to action, no value is necessary.

```json
"call_to_action": {
  "type": "MESSAGE_PAGE"
}
```

Clicking on the call-to-action button launches the Messenger composer to send a message to the Page. The message includes the ad photo and headline as an attachment.

Link Page post creation example:

```html
curl -X POST \
  -F 'message=Come check out our new store in Menlo Park!' \
  -F 'link=https://www.facebook.com/<PAGE_ID>' \
  -F 'picture=<IMAGE_URL>' \
  -F 'published=0' \
  -F 'call_to_action={
    "type": "GET_DIRECTIONS",
    "value": {"link":"fbgeo:\/\/37.48327, -122.15033, \"1601 Willow Rd Menlo Park CA\""}
  }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<PAGE_ID>/feed
```

Video Page post creation example:

```html
curl -X POST \
  -F 'message=Come check out our new store in Menlo Park!' \
  -F 'published=0' \
  -F 'call_to_action={
    "type": "GET_DIRECTIONS",
    "value": {
      "link": "fbgeo:\/\/37.48327, -122.15033, \"1601 Willow Rd Menlo Park CA\"",
      "link_format": "VIDEO_LPP"
    }
  }' \
  -F 'source=@<VIDEO_PATH>' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph-video.facebook.com/v25.0/<PAGE_ID>/videos
```

#### Step 3: [Create the ad creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad-creative) using the Page post ID from above.

```html
curl -X POST \
  -F 'name="Sample Promoted Post"' \
  -F 'object_story_id="<PAGE_ID>_<POST_ID>"' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

The ad will look similar to this:

In this example, the call to action is `GET_DIRECTIONS`. Clicking on the button will present a map with directions to the business as listed on their Facebook Page. Clicks on other parts of the ad go to the advertiser's Facebook Page.

Optionally, you can combine all the creative steps above into one by using the `object_story_spec` field in the ad creative.

Example video creative using `object_story_spec`:

```html
curl -X POST \
  -F 'object_story_spec={
    "page_id": "<PAGE_ID>",
    "video_data": {
      "call_to_action": {
        "type": "GET_DIRECTIONS",
        "value": {
          "link": "fbgeo:\/\/37.48327, -122.15033, \"1601 Willow Rd Menlo Park CA\""
        }
      },
      "image_url": "<THUMBNAIL_URL>",
      "link_description": "Come check out our new store in Menlo Park!",
      "video_id": "<VIDEO_ID>"
    }
  }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

#### Step 4: [Create an ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad).

```html
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

## Learn more

* [Ad Campaign](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group)
* [Ad Set](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign)
* [Ad Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative)
* [Ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup)
* [Targeting Specs](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/advanced-targeting#location)
* [`object_story_spec`](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-object-story-spec)
* [`link_data`](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-link-data)
* [About event ads on Facebook](https://www.facebook.com/business/help/1155511931224464)
