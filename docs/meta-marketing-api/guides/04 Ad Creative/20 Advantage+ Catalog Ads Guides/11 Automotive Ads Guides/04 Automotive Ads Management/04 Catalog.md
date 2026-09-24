<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/auto-ads/guides/catalog | Saved: 2026-09-19 -->

# Automotive Ads - Create a Catalog



To promote your automotive inventory on Meta, you need to create an automotive catalog with vehicle details. Your catalog is a structured data file with a list of vehicles to advertise. Each line contains the information needed to create one vehicle listing.

To create a catalog, connect a data feed or upload data to Meta. The data must contain all the required fields for the vehicles that you want to advertise.

## Step 1: Set up your automotive catalog feed {#feedspec}

To set up a vehicles feed, you need a catalog and a feed of your inventory hosted at a location of your choice.

From your [Meta Business Suite/Commerce Manager](https://www.facebook.com/products/), create a new automotive (Vehicles) catalog by using the supported format and fields for your use case:

| Supported formats | Supported fields |
| --- | --- |
| [Inventory Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/auto-ads/reference#automotive-inventory-ads---supported-feed-formats)<br><br>[Inventory Offer Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/auto-ads/reference#supported-feed-format) | [Inventory Ads, Vehicle](https://developers.facebook.com/documentation/ads-commerce/marketing-api/auto-ads/reference#vehicle)<br><br>[Inventory Ads, Dealership](https://developers.facebook.com/documentation/ads-commerce/marketing-api/auto-ads/reference#dealership)<br><br>[Inventory Offers](https://developers.facebook.com/documentation/ads-commerce/marketing-api/auto-ads/reference#vehicle-offers-feed-file) |

## Step 2: Create data feed {#createdata}

You can either have a **single auto feed** to represent all vehicles in your catalog or **multiple auto feeds** where each feed represents a single dealership or a specific region's vehicles.

See [Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/auto-ads/reference) for a list of supported formats and supported fields.

## Step 3: Schedule uploads {#scheduleuploads}

For details on how to schedule feed uploads, see [Catalog - Schedule Product Feed Fetches](https://developers.facebook.com/documentation/ads-commerce/catalog/guides/scheduled-feeds).

You can download a sample feed (CSV, TSV, XML format) if you try to create an automotive catalog in [Commerce Manager](https://www.facebook.com/products/catalogs/182133669373364/feeds/new/?catalogItemType=vehicle).

See also [Direct Upload Feed Reference](https://developers.facebook.com/documentation/ads-commerce/catalog/guides#upload-feed).

## Step 4: Create vehicle sets {#filtervehicle}

After you have created and scheduled your catalog feed upload (Steps 1 through 3) and it is working properly, you can create vehicle sets.

A **vehicle set** is a subset of your catalog. You define a vehicle set by applying filters to your vehicle catalog. For example, you can create a vehicle set with all vehicles with a `year later than 2015`.

**Note:** Meta pre-creates a vehicle set that contains all vehicles in your catalog.

**Example** - Create a vehicle set containing all vehicles manufactured in 2016

```php
use FacebookAds\Object\ProductSet;
use FacebookAds\Object\Fields\ProductSetFields;

$vehicle_set = new ProductSet(null, <PRODUCT_CATALOG_ID>);

$vehicle_set->setData(array(
  ProductSetFields::NAME => 'Test Vehicle Set',
  ProductSetFields::FILTER => array(
    'year' => array(
      'eq' => 2016,
    ),
  ),
));

$vehicle_set->create();
```

The `filter` parameter uses the following operators and data:

| Operators | Filter Type |
| --- | --- |
| `i_contains` | Contains substring. Operator is case-insensitive. |
| `i_not_contains` | Does not contain substring. Operator is case-insensitive. |
| `contains` | Contains substring. Operator is case-insensitive. |
| `not_contains` | Does not contain substring. Operator is case-insensitive. |
| `eq` | Equal to. Operator is case-insensitive. |
| `neq` | Not equal to. Operator is case-insensitive. |
| `lt` | Less than. For numeric fields only. |
| `lte` | Less than or equal to. For numeric fields only. |
| `gt` | Greater than. For numeric fields only. |
| `gte` | Greater than or equal to. For numeric fields only. |

## Learn more

### Business help center
* [Methods to Add Catalog Items](https://www.facebook.com/business/help/384041892421495)
* [Add and Update Catalog Items with a Pixel](https://www.facebook.com/business/help/887775018036966)
* [About Advantage+ Catalog Ads with an On-Facebook Destination](https://www.facebook.com/business/help/1940957349379686)
* [Set Up a Advantage+ Catalog Ads Campaign with an On-Facebook Destination](https://www.facebook.com/business/help/230418171375635)

### Marketing API

* [Direct Upload Feed Reference](https://developers.facebook.com/documentation/ads-commerce/catalog/guides/scheduled-feeds)
* [Campaign, Objective Validation](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group#objective-validation)
* [Product Sets](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-set)

