<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/real-estate-ads/ads-management | Saved: 2026-09-19 -->

# Advantage+ Catalog Ads for Real Estate - Creating Ads



You create Advantage+ catalog ads for real estate in much the same way as regular Advantage+ catalog ads.

* [__Step 1: Create a campaign__](#campaign)
* [__Step 2: Create an ad set__](#adset)
* [__Step 3: Provide ad creative__](#creative)
* [__Step 4: Create an ad__](#ad)

To create an Advantage+ catalog ad for real estate campaign, you need:

* A [Facebook Page](https://www.facebook.com/pages/create/) representing the advertiser.
* An [ad account](https://www.facebook.com/ads/manager/accounts) with registered payment information.
* A [real estate audience](https://developers.facebook.com/docs/marketing-api/dynamic-ads-for-real-estate/audience) available in your ad account.
* A [home listing catalog](https://developers.facebook.com/documentation/ads-commerce/marketing-api/real-estate-ads), such as a home listing catalog available in your Meta Business Suite.

Every ad on Facebook must be part of an ad set, which defines its bidding and targeting, and the ad set must be part of a campaign, which defines its objective. You must create each level of a campaign in order to run ads.

## Step 1. Create ad campaign {#campaign}

Advantage+ catalog ads for real estate use the `PRODUCT_CATALOG_SALES` objective. You should specify a real estate catalog in `promoted_object` at the campaign level:

### cURL
```
curl \
  -F 'name=DARE campaign' \
  -F 'objective=PRODUCT_CATALOG_SALES' \
  -F 'promoted_object={"product_catalog_id":"<PRODUCT_CATALOG_ID>"}' \
  -F 'status=PAUSED' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/<API_VERSION>/act_<AD_ACCOUNT_ID>/campaigns
```

## Step 2. Create ad set {#adset}

Create the [ad set](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign) which defines the bidding and targeting options for your ads.

### cURL
```
curl \
  -F 'name=adset name' \
  -F 'bid_amount=3000' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'optimization_goal=OFFSITE_CONVERSIONS' \
  -F 'daily_budget=15000' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'targeting={
    "geo_locations": {"countries":["US"]},
    "dynamic_audience_ids": ["<DYNAMIC_AUDIENCE_ID>"]
  }' \
  -F 'promoted_object={"product_set_id":<PRODUCT_SET_ID>, "custom_event_type": "PURCHASE" }' \
  -F 'status=PAUSED' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/<API_VERSION>/act_<AD_ACCOUNT_ID>/adsets
```

## Step 3. Provide ad creative {#creative}

Provide the Advantage+ catalog ads template creative, which is similar to [ad creatives](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative). The main difference is that you can add [template parameters](https://developers.facebook.com/docs/marketing-api/dynamic-product-ads/ads-management#templateandtransform) which Facebook uses at runtime based on data in your catalog and a person's home listing interest.

As with [Advantage+ catalog ads](https://developers.facebook.com/docs/marketing-api/dynamic-product-ads/ads-management#adtemplate), define `template_data` in `object_story_spec` in the ad creative. You can also use `template_url` to define a URL in a more flexible way instead of using the URL from the feed. If `template_url` cannot be constructed at ads rendering time, Meta falls back to the URL from the catalog.

Below is an example to create a carousel creative for a home listing.

### cURL
```
curl \
  -F 'name=DARE creative' \
  -F 'object_story_spec={
    "page_id": "<PAGE_ID>",
    "template_data": {
    "description": "{{home_listing.name | titleize}}",
    "link": "https://www.EXAMPLE.com",
    "message": "HOME LISTINGS!!!",
    "name": "{{home_listing.num_beds}} beds / {{home_listing.num_baths}} baths | {{home_listing.price strip_zeros}}"
    }
  }' \
  -F 'product_set_id=<PRODUCT_SET_ID>' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/<API_VERSION>/act_<AD_ACCOUNT_ID>/adcreatives
```

### Creative format options {#creative-options}

You can choose whether to show a single product or multiple products in a carousel. For single product ads, you can show multiple images in the carousel for that product. You can also display static cards in combination with dynamic cards. See Advantage+ catalog ads, [Building a Creative Template](https://developers.facebook.com/docs/marketing-api/dynamic-product-ads/ads-management#adtemplate).

### Template tags {#template}

When Meta delivers your ad, it substitutes tags in `{{...}}` with the relevant value.

| Template tag | Description |
| --- | --- |
| `home_listing.description` | Description of home listing |
| `home_listing.name` | Name |
| `home_listing.num_beds` | Number of beds |
| `home_listing.num_baths` | Number of baths |
| `home_listing.num_units` | Number of units |
| `home_listing.price` | Price of the home listing |
| `home_listing.year_built` | Year the home was built |
| `home_listing.city` | City provided in catalog |
| `home_listing.country` | Country provided in catalog |
| `home_listing.region` | Region provided in catalog |
| `home_listing.street_address` | Street address provided in catalog |

## Step 4. Create the ad {#ad}

Finally create your [ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup) that delivers dynamic creative to the user based on your catalog:

### cURL
```
curl \
  -F 'name=DARE Alpha Ad' \
  -F 'adset_id=<ADSET_ID>' \
  -F 'creative={"creative_id":"<CREATIVE_ID>"}' \
  -F 'tracking_specs=[{"action.type": ["offsite_conversion"],"fb_pixel": ["<PIXEL_ID>"]},{"action.type": ["post_engagement"],"page": ["<PAGE_ID>"],"post": ["<POST_ID>"]}]' \
  -F 'status=PAUSED' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/<API_VERSION>/act_<AD_ACCOUNT_ID>/ads
```

Your ad is now visible in Ads Manager and is in a paused state.
