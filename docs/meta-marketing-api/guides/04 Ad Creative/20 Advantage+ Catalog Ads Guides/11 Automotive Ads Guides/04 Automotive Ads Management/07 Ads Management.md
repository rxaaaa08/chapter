<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/auto-ads/guides/ads-mgmt | Saved: 2026-09-19 -->

# Automotive Ads - Ads Management



This guide assumes you have a catalog and product set ready, and have set up the required vehicle events on your website or in your mobile app. If not, see [catalog setup](https://developers.facebook.com/docs/marketing-api/dynamic-ads-auto/auto-catalog) and [event setup](https://developers.facebook.com/documentation/ads-commerce/marketing-api/auto-ads/guides/events).

**Warning:** To create automotive ads, you need a [Facebook Page](https://www.facebook.com/pages/create/) and an [ad account](https://www.facebook.com/ads/manager/accounts).

## Step 1. Create campaign {#campaign}

1. Choose `PRODUCT_CATALOG_SALES` as the campaign objective.
2. Specify a vehicle catalog in `promoted_object` at the campaign level.

```bash
curl \
  -F 'name=Product Catalog Sales Campaign' \
  -F 'objective=PRODUCT_CATALOG_SALES' \
  -F 'promoted_object={"product_catalog_id":"<PRODUCT_CATALOG_ID>"}' \
  -F 'status=PAUSED' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/campaigns
```

## Step 2. Create ad set {#adset}

Once you have the campaign and the `campaign_id`, you can create the [ad set](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign). The ad set defines the bidding and targeting options for your ads.

**Note:** If you don't specify `destination_type` at the ad set level, your ads' default destination is the website URL from your catalog.

#### On-Facebook destination {#click-to-marketplace}

To create an ad set that drives Automotive Inventory Ads to an [on-Facebook traffic destination](https://www.facebook.com/business/help/1940957349379686), specify `destination_type FACEBOOK` in your ad set data. See [Advantage+ Catalog Ads with an On-Facebook Destination](https://developers.facebook.com/docs/marketing-api/dynamic-ads/on-facebook-destination).

### Retargeting {#retargeting}
Retarget website visitors who have viewed vehicles in your defined product set.

```bash
curl \
  -F 'name=Product Catalog Sales Adset' \
  -F 'bid_amount=3000' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'optimization_goal=OFFSITE_CONVERSIONS' \
  -F 'daily_budget=15000' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'targeting={
    "geo_locations": {"countries":["US"]},
    "dynamic_audience_ids": ["<DYNAMIC_AUDIENCE_ID>"]
  }' \
  -F 'promoted_object={"product_set_id":"<PRODUCT_SET_ID>"}' \
  -F 'status=PAUSED' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

Automotive ads **do not support inline dynamic audience targeting specs in the Ad Set**. You must first separately [create an audience](https://developers.facebook.com/docs/marketing-api/dynamic-ads-for-auto/audience-management#create-audience).

## Step 3. Create ad creative {#creative}

You can use **template tags** in your [ad creatives](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative) for automotive ads. When Facebook displays your ad, Facebook replaces template tags with actual vehicle choices. You can use template tags in the ad and in the URL. The template tags are visible when someone clicks the ad.

### Template tags for vehicle {#templatetags_vehicle}

| Type | Name |
| --- | --- |
| `BODY_STYLE` | `vehicle.body_style` |
| `CUSTOM_LABEL_0` | `vehicle.custom_label_0` |
| `CUSTOM_LABEL_1` | `vehicle.custom_label_1` |
| `CUSTOM_LABEL_2` | `vehicle.custom_label_2` |
| `CITY` | `vehicle.city` |
| `DEALER_ID` | `vehicle.dealer_id` |
| `DEALER_NAME` | `vehicle.dealer_name` |
| `DESCRIPTION` | `vehicle.description` |
| `DRIVETRAIN` | `vehicle.drivetrain` |
| `EXTERIOR_COLOR` | `vehicle.exterior_color` |
| `MAKE` | `vehicle.make` |
| `MILEAGE` | `vehicle.mileage` |
| `MODEL` | `vehicle.model` |
| `PRICE` | `vehicle.price` |
| `REGION` | `vehicle.region` |
| `SALE_PRICE` | `vehicle.sale_price` |
| `STOCK_NUMBER` | `vehicle.stock_number` |
| `TITLE` | `vehicle.title` |
| `TRIM` | `vehicle.trim` |
| `URL` | `vehicle.url` |
| `VEHICLE_ID` | `vehicle.vehicle_id` |
| `VIN` | `vehicle.vin` |
| `YEAR` | `vehicle.year` |

### Template tag guidelines

* Use these fields in the template tag: `vehicle.city`, `vehicle.dealer_name`, `vehicle.description`, `vehicle.make`, `vehicle.mileage`, `vehicle.model`, `vehicle.price`, `vehicle.region`, `vehicle.sale_price`, `vehicle.title`, `vehicle.url`, and `vehicle.year`.
* Use double curly brackets `{{....}}` with the template tags.
* Before using template tags, make sure you provide all required details through your vehicle events. For example, the title of your ad could be: Checkout great deals from `{{dealer_name}}`.
* Use the `template_url_spec` field to specify the URL that appears after someone clicks the ad. If you don't provide `template_url_spec`, or Facebook can't derive it when rendering an ad, Facebook displays the URL from the catalog.
* You can show a single product or a carousel with multiple products. For single-product ads, you can show multiple images of the same product in the carousel, assuming your catalog contains multiple images for each product. You can also display static cards in combination with dynamic cards.

For more information about creative options, see [Building a Creative Template](https://developers.facebook.com/docs/marketing-api/dynamic-product-ads/ads-management#adtemplate).

**Example** - Create a carousel creative for automotive ads

```php
use FacebookAds\Object\AdCreative;
use FacebookAds\Object\Fields\AdCreativeFields;
use FacebookAds\Object\Fields\AdCreativeLinkDataFields;
use FacebookAds\Object\Fields\AdCreativeObjectStorySpecFields;
use FacebookAds\Object\Values\AdCreativeCallToActionTypeValues;
use FacebookAds\Object\AdCreativeObjectStorySpec;
use FacebookAds\Object\AdCreativeLinkData;

$object_story_spec = new AdCreativeObjectStorySpec();
$object_story_spec->setData(array(
  AdCreativeObjectStorySpecFields::PAGE_ID => <PAGE_ID>,
  AdCreativeObjectStorySpecFields::TEMPLATE_DATA =>
    (new AdCreativeLinkData())->setData(array(
      AdCreativeLinkDataFields::MESSAGE =>
        'Check out these vehicles from {{dealer_name}}',
      AdCreativeLinkDataFields::NAME => '{{vehicle.year}} {{vehicle.make}} {{vehicle.model}}',
      AdCreativeLinkDataFields::LINK => '{{vehicle.url}}',
      AdCreativeLinkDataFields::DESCRIPTION =>
        '{{vehicle.description}}',
      AdCreativeLinkDataFields::ADDITIONAL_IMAGE_INDEX => 0,
      AdCreativeLinkDataFields::CALL_TO_ACTION => array(
        'type' => AdCreativeCallToActionTypeValues::LEARN_MORE,
      ),
    )),
));

$creative = new AdCreative(null, 'act_<AD_ACCOUNT_ID>');
$creative->setData(array(
  AdCreativeFields::NAME => 'Advantage+ Catalog Ad Template Creative Sample',
  AdCreativeFields::OBJECT_STORY_SPEC => $object_story_spec,
  AdCreativeFields::TEMPLATE_URL_SPEC =>
    array(
      'web' => array(
        'url' => 'http://www.example.com/vehicle'.
          '?id={{vehicle_id | urlencode}}',
      )
    ),
  AdCreativeFields::PRODUCT_SET_ID => <PRODUCT_SET_ID>,
));

$creative->create();
```

## Step 4. Create ad {#createad}

Use the `ad_set_id` and the `creative_id` to create the [ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup).

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

## Next steps {#whatsnext}

### Preview the ad {#previewad}

Generate a preview of your Advantage+ creative for catalog with the [Ad Previews API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/generatepreview). Include the `product_item_ids` parameter to specify which catalog items display in the preview, and `start_date` and `end_date` to specify specific dates.

```php
use FacebookAds\Object\AdCreative;
use FacebookAds\Object\Fields\AdPreviewFields;
use FacebookAds\Object\Values\AdPreviewAdFormatValues;

$creative = new AdCreative(<CREATIVE_ID>);
$preview = $creative->getPreviews(array(), array(
  AdPreviewFields::AD_FORMAT => AdPreviewAdFormatValues::DESKTOP_FEED_STANDARD,
  AdPreviewFields::PRODUCT_ITEM_IDS => array(
    '<VEHICLE_FBID>',
  ),
));
```

