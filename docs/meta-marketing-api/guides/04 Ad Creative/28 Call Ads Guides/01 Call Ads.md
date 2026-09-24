<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/call-ads | Saved: 2026-09-19 -->

# Call Ads



This guide explains how to create and publish call ads using the Marketing API from Meta.

## Before you start

This guide assumes you have:

* An [ad account with Meta](https://adsmanager.facebook.com/adsmanager/) with a valid payment method
* Uploaded any assets, such as images or videos, to be used in your ads to Meta servers

To make successful calls to all endpoints in this guide, you will need:

* A Page access token requested by a person who can perform the `ADVERTIZE` task on the Page
* A person using your app must grant the following permissions:
    * `ads_management`
    * `pages_manage_ads`
    * `pages_read_engagement`
    * `pages_show_list`

### Recommendations

Be sure to set the open hours for your business in your
[Facebook Page Settings.](https://www.facebook.com/help/1623755557908631)

When testing an API call, you can include the `access_token` parameter set to your access token. However, when making secure calls from your app, use the [access token class.](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens#portabletokens)

### Limitations

* The target audience must be 18 years old or older
* The phone number included in Call to Action must be from the same country as the target audience

## Step 1: Create a Campaign

To create your ad campaign send a `POST` request to the `act_***ad_account_id***/campaigns` endpoint where ***ad_account_id*** is the ID for your Meta ad account. Your request must include:

- `name`

- `objective` – set to one of the following supported objectives:

- `OUTCOME_AWARENESS`

- `OUTCOME_ENGAGEMENT`

- `OUTCOME_LEADS`

- `OUTCOME_SALES`

- `OUTCOME_TRAFFIC`

- `special_ad_categories`

#### Example request

*Formatted for readability. Replace **bold, italics values**, such as **ad_account_id**, with your values.*

```curl
curl -X POST "https://graph.facebook.com/v25.0/act_ad_account_id/campaigns" \
     -H "Content-Type: application/json" \
     -d '{
           "name":"Call_ad_campaign_name",
           "objective":"OUTCOME_TRAFFIC",
           "special_ad_categories":["NONE"],
         }'
```

On success your app receives a JSON response with the ID for your campaign.

```json
{
  "id": "campaign_id"
}
```

## Step 2: Create an Ad Set {#step-2}

To create an ad set, send a `POST` request to the `act_***ad_account_id***/adsets` endpoint where ***ad_account_id*** is the ID for your Meta ad account. Your request must include:

* `bid_amount`
* `billing_event` set to `IMPRESSIONS`
* `campaign_id`
* `daily_budget`
* `destination_type` set to `PHONE_CALL`
* `name`
* `optimization_goal` set to `QUALITY_CALL` for call ads
* `targeting`

#### Example request
*Formatted for readability. Replace **bold, italics values**, such as **ad_account_id**, with your values.*

```curl
curl -X POST "https://graph.facebook.com/v25.0/act_ad_account_id/adsets"
     -H "Content-Type: application/json"
     -d '{
           "bid_amount":"Your_bid_amount",
           "billing_event":"IMPRESSIONS",
           "campaign_id":"Your_campaign_id",
           "daily_budget":"Your_daily_budget",
           "destination_type":"PHONE_CALL",
           "name:"Your_call_adset_name",
           "optimization_goal":"QUALITY_CALL",
           "targeting":{
             "geo_locations": { "countries":["US","CA"] },
             "device_platforms": ["mobile"],
             "publisher_platforms": ["facebook"]
           }
         }'
```

On success your app receives the following JSON response with the ID for the ad set.

```json
{
  "id": "adset_id"
}
```

## Step 3: Create Ad Creative {#step-3}

The ad creative allows you to add assets to your ads. Carousel, image, text-only, and video ads are supported.

To create an ad creative, send a `POST` request to the `/act_***ad_account_id***/adcreatives` endpoint where ***ad_account_id*** is the ID for your Meta ad account. Your request must include:

* `name`
* `object_story_spec`
* `object_story_spec` with a `link_data` object that defines the `call_to_action` with `type` set to `CALL_NOW` and `value` as the phone number for your business

#### Image ad example request

*Formatted for readability. Replace **bold, italics values**, such as **page_access_token**, with your values.*

```curl
curl -X POST "https://graph.facebook.com/v25.0/act_ad_account_id/adcreatives"
     -H "Content-Type: application/json"
     -d '{
           "name":"Your_call_image_ad_name",
           "object_story_spec":{
             "page_id": "your_page_id",
             "link_data": {
               "picture": "Your_image_URL",
               "link": "Your_business_page_URL",
               "call_to_action": {
                 "type":"CALL_NOW",
                 "value":{ "link":"tel:+Your_business_phone_number_with_country_code" }
               }
             }
           }
         }'
```

On success your app receives the following JSON response with the ID for the ad creative.

```json
{
  "id": "<i style="color:red">ad_creative_id"
}
```

## Step 4: Create the Ad

To create the ad you need to associate the ad creative and the ad set. To create the ad, send a `POST` request to the `/act_***ad_account_id/ads***` endpoint where ***ad_account_id*** is the ID for your Meta ad account. Your request must include:

* `adset_id` (from [Step 2](#step-2))
* `creative_id` (from [Step 3](#step-3))
* `name`
* `status`

#### Ad with creative example request
*Formatted for readability. Replace **bold, italics values**, such as **ad_account_id**, with your values.*

```curl
curl -X POST "https://graph.facebook.com/v25.0/act_ad_account_id/ads"
     -H "Content-Type: application/json"
     -d '{

           "adset_id": "Your_ad_set_id",
           "creative": { "creative_id": "Your_ad_creative_id" },
           "status": "PAUSED"
         }'
```

On success your app receives the following JSON response with the ID for the ad.

```json
{
  "id": "ad_id"
}
```

## Next steps

Visit the [Get Started guide](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started#book-ad) to learn how to submit your ad for review.

## Learn more

Learn more about the Marketing API and additional options for call ads.

#### Business Help Center

- [View metrics for call ads in the Ads Manager](https://www.facebook.com/business/help/237108475737601)

#### Marketing API

- [Ads Actions Reference](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats)

- [Ad Campaign Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group)

- [Ad Campaign Insights Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group/insights)

- [Ad Creative Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative)

- [Ad Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup)

- [Ad Set Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign)

- [Audience Targeting Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/advanced-targeting)

- [Get Started with the Marketing API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started)

- [Generate an Ad Preview](https://developers.facebook.com/docs/marketing-api/generatepreview/v17.0#ad-previews)

- [Optimization Goals and Bidding Events Overview](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview/billing-events#opt_bids)

