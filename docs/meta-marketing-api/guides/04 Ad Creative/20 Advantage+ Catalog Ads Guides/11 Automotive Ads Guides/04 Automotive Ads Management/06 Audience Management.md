<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/auto-ads/guides/audience-mgmt | Saved: 2026-09-19 -->

# Automotive Ads - Audience Management



To successfully manage your audience, you can:

* [Associate Your pixel with Your Catalog](#associate-pixel)
* [Retarget an Audience](#retarget)

## Associate your Pixel with your catalog {#associate-pixel}

### Via Meta Business Suite {#BusMgr}

1. Go to **Meta Business Suite** > **Product Catalogs** > **Settings** > **Associate Sources**.
2. Select your pixel.

For more information, see [Implement a pixel and/or mobile SDK for Advantage+ catalog ads for automotive](https://www.facebook.com/business/help/1989760861301766).

### Via the API {#api}

```php
use FacebookAds\Object\ProductCatalog;

$product_catalog = new ProductCatalog(<PRODUCT_CATALOG_ID>);
$product_catalog->createExternalEventSource(array(), array(
  'external_event_sources' => array(
    <PIXEL_ID>
  ),
));
```

## Retarget an audience {#retarget}

Add a section for page event sources in the code block:

```json
{
  "type": "page",
  "id": "<PAGE_ID>",
}
```

Below is an example of how to create a retargeting audience with signals from your pixel, app, and page events; that is, capture an audience who has visited your vehicle pages belonging to a certain vehicle set.

**Warning:** Page events are only applicable when using Automotive Inventory Ads with an [on-Facebook destination](https://developers.facebook.com/docs/marketing-api/dynamic-ads/on-facebook-destination).

```bash
curl \
  -F 'name=Viewed vehicles in vehicle set in Last 30 days' \
  -F 'subtype=CLAIM' \
  -F 'claim_objective=VEHICLE' \
  -F 'content_type=VEHICLE' \
  -F 'event_sources=[
  {
      "type": "pixel",
      "id": "<PIXEL_ID>"
  },
  {
      "type": "app",
      "id": "<APP_ID>"
  }
  ]' \
  -F 'rule={"vehicle_set_id":{"eq":"<VEHICLE_SET_ID>"}}' \
  -F 'inclusions=[
  {
      "event": "ViewContent",
      "retention": {"min_seconds":0,"max_seconds":2592000}
  },
  {
      "event": "Search",
      "retention": {"min_seconds":0,"max_seconds":2592000}
  },
  {
      "event": "AddToWishlist",
      "retention": {"min_seconds":0,"max_seconds":2592000}
  }
  ]' \
  -F 'exclusions=[{
      "event":"Lead",
      "retention": {"min_seconds":0,"max_seconds":2592000}
  }]' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/<API_VERSION>/act_<AD_ACCOUNT_ID>/customaudiences
```

If successful, the API returns an audience ID. You can use this audience ID in the `dynamic_audience_ids` field at the ad set level when [creating ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/auto-ads/guides/ads-mgmt) to retarget people based on your signals.

Learn more about [best practices for retargeting automotive inventory ads](https://www.facebook.com/business/help/274706343234703).

