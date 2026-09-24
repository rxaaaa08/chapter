<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/shops-ads | Saved: 2026-09-19 -->

# Shops ads



Shops ads is an additive enhancement to your website-traffic campaigns. Buyers discover products and build their carts on Facebook and Instagram, and the final checkout happens on your own website (offsite checkout). Your website checkout keeps your payment integrations, cross-sell and up-sell tools, and brand content. Meta routes people to either your website or your shop, depending on where it expects better performance.

## Before you begin

To create a product catalog sale or conversion ad using a Website or Shop destination, you will need:

* A shop using offsite checkout with in-app browser (IAB).
* A Facebook Page or Instagram account connected to your shop.
* A catalog connected to your shop. See the [Catalog Fields](https://developers.facebook.com/documentation/ads-commerce/commerce-platform/catalog/fields) documentation for the required fields for commerce and ads.
* [Commerce eligibility for Shops ads](#commerce-eligibility-for-shops-ads).

## Step 1: Create a campaign {#step-1}

Start by creating your [ad campaign](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group) with a `POST` request to `/act_{ad_account_id}/campaigns`.

At this level, you must set your advertising goal through the objective field. New Shops ads campaigns use the [Outcome-Driven Ad Experience](https://developers.facebook.com/blog/post/2021/12/21/simplifying-campaign-objectives-outcome-driven-ad-experiences/) (ODAX) objective `OUTCOME_SALES`. There are two ways to set up the campaign:

* **Catalog-based:** set the `promoted_object` to a product catalog ID. The product catalog must be connected to a shop with offsite checkout enabled to be eligible for Shops ads.
* **Pixel-based:** the `promoted_object` field is not required at the campaign level.

Example of creating a catalog-based campaign with the `OUTCOME_SALES` objective:

```bash
curl \
  -F 'name=Shops Ads Campaign' \
  -F 'objective=OUTCOME_SALES' \
  -F 'promoted_object={"product_catalog_id":"<PRODUCT_CATALOG_ID>"}' \
  -F 'status=PAUSED' \
  -F 'special_ad_categories=[]' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/campaigns
```

Example of creating a pixel-based campaign with the `OUTCOME_SALES` objective:

```bash
curl \
  -F 'name=Shops Ads Campaign' \
  -F 'objective=OUTCOME_SALES' \
  -F 'status=PAUSED' \
  -F 'special_ad_categories=[]' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/campaigns
```

## Step 2: Create an ad set {#step-2}

For Shops ads, you must specify the destination type as `WEBSITE` for your ad set.

* If the objective of the campaign is set up as catalog-based, you must provide a product set ID in `promoted_object` to promote products from that product set.
* If the campaign is set up as pixel-based, define your `promoted_object` to be a commerce account with offsite checkout enabled.

Other requirements for Shops ads:

* Shops ads supports the following conversion events (`CUSTOM_EVENT_TYPE`) in the product set (for catalog-based campaigns) or in the Meta Pixel (for pixel-based campaigns): `ADD_TO_WISHLIST`, `ADD_TO_CART`, `INITIATE_CHECKOUT`, `PURCHASE`, and `VIEW_CONTENT`.
* Shops ads supports two values for `optimization_goal`: `OFFSITE_CONVERSIONS` (optimize for offsite conversions) and `VALUE` (optimize for the maximum total purchase value within the attribution window).
* For Shops ads to be delivered to the shop, targeting must include audiences in countries listed in the shop's `offsite_iab_checkout_enabled_countries`. Check this field for each shop and target those countries in your ad set.
* For Shops ads to be delivered to the shop, the placement must include at least one platform with offsite checkout support (currently, Facebook and Instagram).

Example of creating a catalog-based Shops ads ad set that is billed on `IMPRESSIONS`:

```bash
curl \
  -F 'name=Shops Ads Adset' \
  -F 'bid_amount=3000' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'daily_budget=15000' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'targeting={"geo_locations": {"countries":["US"]} }' \
  -F 'destination_type=WEBSITE' \
  -F 'promoted_object={"product_set_id":"<PRODUCT_SET_ID>","custom_event_type": "PURCHASE"}' \
  -F 'status=PAUSED' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

Example of creating a pixel-based Shops ads ad set that is billed on `IMPRESSIONS`:

```bash
curl \
  -F 'name=Shops Ads Adset' \
  -F 'bid_amount=3000' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'daily_budget=15000' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'targeting={"geo_locations": {"countries":["US"]}}' \
  -F 'destination_type=WEBSITE' \
  -F 'promoted_object={"pixel_id":"<PIXEL_ID>","custom_event_type": "PURCHASE"}' \
  -F 'status=PAUSED' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

## Step 3: Provide a creative {#step-3}

For Shops ads, set the `destination_spec` field to a `destination_type` of `WEBSITE_AND_SHOP` on your creative. This lets Meta route people to your website or your shop, depending on what is more likely to lead to a purchase.

With Shops ads ad sets, you can create:

* [Carousel ads](#carousel-ads-or-image-video-ads)
* [Image/video ads](#carousel-ads-or-image-video-ads) (only for pixel-based campaigns)
* [Ads with Advantage+ creative for catalog](#advantage-creative-for-catalog)

Shops ads does not support the following:

* Image/video ad formats for catalog-based campaigns
* [Collection ad formats](https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative/collection-ads)
* Calls to action set to messaging a Page, Instagram, or WhatsApp
* Destinations set to an app, event, or [Instant Experiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/instant-experiences#create-an-ad-creative) for pixel-based campaigns

### Carousel ads or image/video ads {#carousel-ads-or-image-video-ads}

You can create a [carousel ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/videoads#carousel) just like non-Shops ads. For pixel-based campaigns, you can also create an [image](https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative)/[video](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/videoads#video_create) ad.

The `page_id` and/or `instagram_user_id` specified in `object_story_spec` must have at least one shop belonging to the commerce account you chose to promote in your ad set or the catalog you chose to promote in your campaign. They must also be connected to the same commerce account.

Set the following fields on the creative:

* `destination_spec`: set `destination_type` to `WEBSITE_AND_SHOP`.
* `asset_feed_spec` > `onsite_destinations`: the shop destination Meta can route people to when it expects better performance. Set one of the following:

| Field | Description |
|---|---|
| `storefront_shop_id` | A shop storefront page. The shop must belong to the commerce account you promote in your ad set. |
| `shop_collection_product_set_id` | A product set. The product set must belong to the catalog of the commerce account you promote in your ad set and must contain at least one visible, in-stock product. |
| `details_page_product_id` | A specific product. The product must belong to the catalog of the commerce account you promote in your ad set. |

Example `onsite_destinations` set to a shop storefront page:

```json
{
  "onsite_destinations": [
    {
      "storefront_shop_id": "<SHOP_STOREFRONT_ID>"
    }
  ]
}
```

Example `onsite_destinations` set to a product set:

```json
{
  "onsite_destinations": [
    {
      "shop_collection_product_set_id": "<PRODUCT_SET_ID>"
    }
  ]
}
```

Example `onsite_destinations` set to a specific product:

```json
{
  "onsite_destinations": [
    {
      "details_page_product_id": "<PRODUCT_ID>"
    }
  ]
}
```

Example of a creative for an image ad:

```bash
curl \
  -F 'name=Sample Creative' \
  -F 'destination_spec={
    "destination_type": "WEBSITE_AND_SHOP"
  }' \
  -F 'asset_feed_spec= {
        "onsite_destinations": [
          {
            "storefront_shop_id": "<SHOP_STOREFRONT_ID>"
          }
        ]
      }' \
  -F 'object_story_spec={
    "link_data": {
      "image_hash": "<IMAGE_HASH>",
      "link": "<OFFSITE_LANDING_URL>",
      "call_to_action": {
        "type": "SHOP_NOW"
      },
      "message": "try it out"
    },
    "page_id": "<PAGE_ID>",
    "instagram_user_id" : "<IG_USER_ID>"
  }' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

### Advantage+ creative for catalog {#advantage-creative-for-catalog}

Shops ads also supports [Advantage+ creative for catalog](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-creative-for-catalog). This feature displays different formats and ad creatives to different Account Center accounts based on what they are most likely to respond to.

You can follow the instructions in [Advantage+ Creative for Catalog - Step 3: Provide Ad Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-creative-for-catalog#provide-creative) to set up your creative.

The `page_id` and/or `instagram_user_id` specified in `object_story_spec` must have at least one shop belonging to the commerce account you chose to promote in your ad set or the catalog you chose to promote in your campaign. They must also be connected to the same commerce account.

For the product set in the creative:

* For a catalog-based campaign, the product set you choose must belong to the catalog you set in your campaign and must be the same as the product set you choose to promote in your ad set.
* For a pixel-based campaign, the product set you choose must belong to the catalog of the commerce account you choose to promote in your ad set.

Example of an Advantage+ creative for catalog:

```bash
curl \
  -F 'name=Sample Creative' \
  -F 'product_set_id="<PRODUCT_SET_ID>"' \
  -F 'destination_spec={
    "destination_type": "WEBSITE_AND_SHOP"
  }' \
  -F 'asset_feed_spec= {
    "optimization_type":"FORMAT_AUTOMATION",
    "ad_formats": ["CAROUSEL", "COLLECTION"],
    "images": [{"hash": "<CUSTOMIZED_IMAGE_HASH>"}],
    "descriptions": [{"text": "{{product.description}}"}, {"text": "From {{product.current_price}}"}]
    }' \
  -F 'object_story_spec={
    "template_data": {
      "call_to_action":  {
            "type": "SHOP_NOW"
          },
      "link": "<OFFSITE_LANDING_URL>",
      "multi_share_end_card": false,
      "name": "{{product.name}}"
    },
    "page_id": "<PAGE_ID>",
    "instagram_user_id" : "<IG_USER_ID>"
  }' \
  -F 'degrees_of_freedom_spec={
      "creative_features_spec": {
        "standard_enhancements": {
          "enroll_status": "OPT_OUT"
        }
      }
    }' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

## Step 4: Create an ad {#step-4}

Create an ad that references an ad creative.

```bash
curl \
  -F 'status=PAUSED' \
  -F 'name=Test' \
  -F 'adset_id=<ADSET_ID>' \
  -F 'creative={
       "creative_id": "<CREATIVE_ID>"
    }' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads
```

## Shops ads with Advantage+ shopping campaigns

Shops ads works together with Advantage+ shopping campaigns.

To create an Advantage+ shopping campaign with Shops ads, follow the steps in [Advantage+ Shopping Campaigns - Step 2: Create Campaign](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-shopping-campaigns#step-2) to create a campaign first.

When creating an ad set for Advantage+ shopping campaigns with Shops ads, similar to Shops ads alone, set the `destination_type` to `WEBSITE` and specify your commerce account in `promoted_object`.

```bash
curl \
  -F 'name=Advantage+ Shopping Adset' \
  -F 'bid_amount=3000' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'daily_budget=15000' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'targeting={"geo_locations": {"countries":["US"]}}' \
  -F 'destination_type=WEBSITE' \
  -F 'promoted_object={"pixel_id":"<PIXEL_ID>","custom_event_type": "PURCHASE"}' \
  -F 'status=PAUSED' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

See [Cross-Channel Conversion Optimization for Advantage+ Shopping Campaigns](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-shopping-campaigns/cross-channel-conversion) for more information.

When creating a creative and an ad for Advantage+ shopping campaigns with Shops ads, the spec is the same as Shops ads alone. See [Step 3: Provide a creative](#step-3) above for more detail.

## Commerce eligibility for Shops ads

To get the relevant IDs for Shops ads, you need to request the `catalog_management` permission from your client.

To create Shops ads for a Page, the shop has to use offsite checkout. A shop can be used as a destination when it has the following properties:

1. A `cta` of `OFFSITE_IAB_CHECKOUT`
2. At least one country in `offsite_iab_checkout_enabled_countries`

Check eligibility with the following request:

```bash
curl -i -X GET \
  "https://graph.facebook.com/v25.0/<PAGE_ID>/commerce_merchant_settings?fields=id,shops{id,fb_sales_channel},cta,offsite_iab_checkout_enabled_countries&access_token=<PAGE_ACCESS_TOKEN>"
```

**Sample Response**

```json
{
  "data": [
    {
      "id": "<COMMERCE_ACCOUNT_ID>",
      "shops": {
        "data": [
          {
            "id": "<SHOP_ID>",
            "fb_sales_channel": {
              "status": "ENABLED",
              "fb_page": {
                "name": "Page 1",
                "id": "<PAGE_ID>"
              }
            }
          }
        ]
      },
      "cta": "OFFSITE_IAB_CHECKOUT",
      "offsite_iab_checkout_enabled_countries": [
        "US"
      ]
    }
  ]
}
```

A shop's `cta` can change from `ONSITE_CHECKOUT` to `OFFSITE_IAB_CHECKOUT`, but not the other way around. A shop can become ineligible and move from `OFFSITE_IAB_CHECKOUT` to other CTAs, such as `OFFSITE_LINK`.

## Get commerce IDs for creating Shops ads

To create a Shops ad for a Page, you need:

* Commerce Account ID (for [Step 2: Create an ad set](#step-2))
* Catalog ID (for [Step 1: Create a campaign](#step-1))
* Product set ID (for [Step 2: Create an ad set](#step-2))
* Shop ID (for [Carousel ads or image/video ads](#carousel-ads-or-image-video-ads))
* Product ID (for [Carousel ads or image/video ads](#carousel-ads-or-image-video-ads))

You can get the Commerce Account ID and Shop ID by running the previous query.

```bash
curl -i -X GET \
  "https://graph.facebook.com/v25.0/<PAGE_ID>/commerce_merchant_settings?fields=id,shops{id,fb_sales_channel{fb_page{id,name}}}&access_token=<PAGE_ACCESS_TOKEN>"
```

A commerce account might have multiple shops. You need to get the one with the Page you want to create Shops ads with.

For catalog ID, product set ID, and product ID:

```bash
curl -i -X GET \
  "https://graph.facebook.com/v25.0/<PAGE_ID>/commerce_merchant_settings?fields=id,product_catalogs{id,product_sets}&access_token=<PAGE_ACCESS_TOKEN>"
```

**Sample Response**

```json
{
  "id": "<COMMERCE_ACCOUNT_ID>",
  "product_catalogs": {
    "data": [
      {
        "id": "<PRODUCT_CATALOG_ID>",
        "product_sets": {
          "data": [
            {
              "id": "<PRODUCT_SET_ID>",
              "name": "Product Set 1",
              "filter": "{\"product_item_id\":{\"is_any\":[]}}"
            }
          ]
        }
      }
    ]
  }
}
```
