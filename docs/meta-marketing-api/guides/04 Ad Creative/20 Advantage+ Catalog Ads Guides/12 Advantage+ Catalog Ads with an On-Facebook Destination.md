<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/on-facebook-destination | Saved: 2026-09-19 -->

# Advantage+ catalog ads with an on-Facebook destination



Advantage+ catalog ads with an on-Facebook destination send people who click an ad to a product detail page formatted as a Shops listing.

On-Facebook destination ads currently work only with **auto** catalogs. See [About Advantage+ Catalog Ads with an On-Facebook Destination](https://www.facebook.com/business/help/1940957349379686) for more information.

## Before you start

Before you start, you need a valid auto catalog. You also need to build the audience to target with your ads. Visit our [Catalog: Get Started](https://developers.facebook.com/documentation/ads-commerce/catalog/get-started) page to learn how to set up a catalog, then see the following requirements specific to auto.

The [Learn more](#learn-more) section below has information about audience creation.

### Valid auto catalog

Advantage+ catalog ads with an on-Facebook destination for auto can use catalogs that meet requirements for [Automotive Ads](#auto-ads). You must have at least one item in your catalog for it to be eligible.

#### Automotive ads {#auto-ads}
[See list of required fields for Automotive Inventory Ads](https://www.facebook.com/business/help/143781049600895). See the optional automotive fields.

## Implementation

Once you have your catalog and audience, you can create your ads via Ads Manager or via API. To use Ads Manager, see the [Set Up an Advantage+ Catalog Ads Campaign with an On-Facebook Destination](https://www.facebook.com/business/help/230418171375635).

To use the API, follow these steps:

### Step 1: Create an ad campaign

While [creating your ad campaign](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started#campaign), set `PRODUCT_CATALOG_SALES` as the `objective` and specify your catalog in `promoted_object`.

### Step 2: Create ad set and set destination

Once you have the campaign and the `campaign_id`, create the ad set. The ad set defines the bidding and targeting options for your ads.

To create an ad set that leverages Advantage+ catalog ads with an on-Facebook destination that goes to an on-Facebook listing, specify `destination_type` as `FACEBOOK` in your ad set data. If customizing placements, a `destination_type` of `FACEBOOK` supports:

* `publisher_platforms` — `facebook`
* `facebook_positions` — `feed`, `marketplace`, `search`, `story`, and `right_hand_column`
* `instagram_positions` — `stream`, `explore`, and `story`

### Step 3: Provide ad creative

[Provide a creative using template tags](https://developers.facebook.com/docs/marketing-api/dynamic-product-ads/ads-management#adtemplate). For more information, see [Template Tags for Vehicles](https://developers.facebook.com/documentation/ads-commerce/marketing-api/auto-ads/guides/ads-mgmt#templatetags_vehicle).

### Step 4: Create the Ad

Use the `ad_set_id` and the `creative_id` to create the ad:

```
curl -X POST \
  -F 'name="My Ad"' \
  -F 'adset_id="AD_SET_ID"' \
  -F 'creative={
       "creative_id": "CREATIVE_ID"
     }' \
  -F 'status="PAUSED"' \
  -F 'access_token=ACCESS_TOKEN' \
  https://graph.facebook.com/v25.0/act_AD_ACCOUNT_ID/ads
```

Your ad appears in Ads Manager in a paused state.

## Learn more

### Business help center

* [About Advantage+ Catalog Ads with an On-Facebook Destination](https://www.facebook.com/business/help/1940957349379686)
* [Set Up a Catalog for Advantage+ Catalog Ads with an On-Facebook Destination](https://www.facebook.com/business/help/891803694577177)
* [Set Up Advantage+ Catalog Ads with an On-Facebook Destination](https://www.facebook.com/business/help/230418171375635)

### Audience creation

* [Automotive Ads Audience Management](https://developers.facebook.com/documentation/ads-commerce/marketing-api/auto-ads/guides/audience-mgmt)
