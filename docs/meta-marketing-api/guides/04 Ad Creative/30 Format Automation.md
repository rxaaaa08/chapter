<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative/format-automation | Saved: 2026-09-19 -->

# Get Started with Format Automation



This document shows you how to enable format automation so you can create a single ad that automatically delivers multiple optimized ad formats.

## Before you start

Familiarize yourself with these topics to set up your ad campaigns for format automation:

* [Get Started with the Marketing API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started)

### Permissions

* `page_manage_ads`

## How format automation works

You can use the `format_transformation_spec` parameter to opt in to different types of format transformations and data sources used to build the formats. Each entry in the spec defines a target format and the data source used to assemble it. You must include an entry for each transformation you want to enable.

If you do not include `format_transformation_spec` in the creative spec, the system uses default behavior.

### Opt-in and opt-out examples

To opt in to a single transformation:

```json
"format_transformation_spec": [
  {
    "format": "da_collection",
    "data_source": ["catalog"]
  }
]
```

To opt in to multiple transformations, include an entry for each one:

```json
"format_transformation_spec": [
  {
    "format": "carousel",
    "data_source": ["catalog"]
  },
  {
    "format": "sa_collection",
    "data_source": ["catalog"]
  },
  {
    "format": "video_slideshow",
    "data_source": ["site_links"]
  }
]
```

To opt out of a specific transformation, set its `data_source` to `none`:

```json
"format_transformation_spec": [
  {
    "format": "carousel",
    "data_source": ["catalog"]
  },
  {
    "format": "sa_collection",
    "data_source": ["none"]
  }
]
```

Leave the `data_source` field empty to opt in to all available data sources for that transformation:

```json
"format_transformation_spec": [
  {
    "format": "carousel",
    "data_source": []
  }
]
```

## Advantage+ catalog ads carousel to collection

Use format automation to transform an Advantage+ catalog ads carousel into a collection format.

### Prerequisites

* [Advantage+ Catalog Ads: Get Started](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/get-started)

### Data sources

| Data source | Description |
| --- | --- |
| `catalog` | Uses product catalog data |

### Example request

```bash
curl -X POST \
  -F 'name="Ad Creative with Format Transformation Spec Sample"' \
  -F 'object_story_spec={
    "page_id": "<PAGE_ID>"
    ... // Fields to create an Advantage+ catalog ads carousel creative \
  }' \
  -F 'product_set_id=<PRODUCT_SET_ID>' \
  -F 'asset_feed_spec= {
    "ad_formats": [
      "CAROUSEL",
      "COLLECTION"
    ],
    "optimization_type": "FORMAT_AUTOMATION"
  }' \
  -F 'format_transformation_spec=[{
    "data_source": ["catalog"],
    "format": "da_collection"
  }]' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

## Advantage+ catalog ads carousel with intro card to collection or single media

Use format automation to transform an Advantage+ catalog ads carousel with an intro card (the first card is a fixed creative card, followed by dynamic product cards) into collection or single media formats. The carousel downgrade is automatic and does not require an explicit entry in the spec.

### Prerequisites

* [Create a carousel Advantage+ catalog ads template with the first card as a coupon (intro card)](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/get-started#create-a-carousel-advantage-catalog-ads-template-with-the-first-card-as-a-coupon-static-card)

### Data sources

| Data source | Description |
| --- | --- |
| `catalog` | Uses product catalog data |
| `manual_uploads` | Uses intro card |

### Example request

```bash
curl -X POST \
  -F 'name="Intro Card Ad Creative with Format Transformation Spec"' \
  -F 'object_story_spec={
    "page_id": "<PAGE_ID>"
    ... // Fields to create an Advantage+ catalog ads carousel creative with intro card \
  }' \
  -F 'product_set_id=<PRODUCT_SET_ID>' \
  -F 'asset_feed_spec= {
    "ad_formats": [
      "CAROUSEL",
      "COLLECTION"
    ],
    "optimization_type": "FORMAT_AUTOMATION"
  }' \
  -F 'format_transformation_spec=[{
    "format": "single_media",
    "data_source": ["manual_uploads"]
  },
  {
    "format": "da_collection",
    "data_source": ["catalog", "manual_uploads"]
  }]' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

## Single media to carousel

Use format automation to transform a single media ad into a carousel format. The data source determines which media populates the carousel cards.

### Data sources

| Data source | Description | Explicit opt-in guide |
| --- | --- | --- |
| `catalog` | Uses product media from your catalog | [Product Extensions](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/product-extensions) |
| `site_links` | Uses media from your website | [Add Site Links](https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative/advantage-creative/add-site-links) |
| `app_information` | Uses app store media | [Mobile App Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/mobile-app-ads) |

### Example request

```bash
curl -X POST \
  -F 'name="Single Media to Carousel with Format Transformation Spec"' \
  -F 'object_story_spec={
    "page_id": "<PAGE_ID>"
    ... // Fields according to explicit opt-in guide \
  }' \
  ... // Other fields specific to your data source (see explicit opt-in guide) \
  -F 'format_transformation_spec=[{
    "format": "carousel",
    "data_source": ["catalog"]
  }]' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

## Single media to collection

Use format automation to transform a single media ad into a collection format. The data source determines which media populates the collection.

### Data sources

| Data source | Description | Explicit opt-in guide |
| --- | --- | --- |
| `catalog` | Uses product media from your catalog | [Product Extensions](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/product-extensions) |
| `site_links` | Uses media from your website | [Add Site Links](https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative/advantage-creative/add-site-links) |

### Example request

```bash
curl -X POST \
  -F 'name="Single Media to Collection with Format Transformation Spec"' \
  -F 'object_story_spec={
    "page_id": "<PAGE_ID>"
    ... // Fields according to explicit opt-in guide \
  }' \
  ... // Other fields specific to your data source (see explicit opt-in guide) \
  -F 'format_transformation_spec=[{
    "format": "sa_collection",
    "data_source": ["catalog"]
  }]' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

## Single media to video slideshow

Use format automation to transform a single media ad into a video slideshow format.

### Data sources

| Data source | Description | Explicit opt-in guide |
| --- | --- | --- |
| `app_information` | Uses app store media | [Mobile App Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/mobile-app-ads) |
| `site_links` | Uses media from your website | [Add Site Links](https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative/advantage-creative/add-site-links) |

### Example request

```bash
curl -X POST \
  -F 'name="Single Media to Video Slideshow with Format Transformation Spec"' \
  -F 'object_story_spec={
    "page_id": "<PAGE_ID>"
    ... // Fields according to explicit opt-in guide \
  }' \
  ... // Other fields specific to your data source (see explicit opt-in guide) \
  -F 'format_transformation_spec=[{
    "format": "video_slideshow",
    "data_source": ["app_information"]
  }]' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

## Carousel to single media

Use format automation to transform a carousel ad into a single media format. See [Carousel Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/videoads#carousel) for how to create a carousel creative.

### Data sources

| Data source | Description |
| --- | --- |
| `manual_uploads` | Uses cards from the carousel |

### Example request

```bash
curl -X POST \
  -F 'name="Carousel to Single Media with Format Transformation Spec"' \
  -F 'object_story_spec={
    "page_id": "<PAGE_ID>"
    ... // Fields to create a carousel creative \
  }' \
  -F 'format_transformation_spec=[{
    "format": "single_media",
    "data_source": ["manual_uploads"]
  }]' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

## Carousel to collection

Use format automation to transform a carousel ad into a collection format. See [Carousel Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/videoads#carousel) for how to create a carousel creative.

### Data sources

| Data source | Description |
| --- | --- |
| `manual_uploads` | Uses cards from the carousel |

### Example request

```bash
curl -X POST \
  -F 'name="Carousel to Collection with Format Transformation Spec"' \
  -F 'object_story_spec={
    "page_id": "<PAGE_ID>"
    ... // Fields to create a carousel creative \
  }' \
  -F 'format_transformation_spec=[{
    "format": "sa_collection",
    "data_source": ["manual_uploads"]
  }]' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

## Carousel to video slideshow

Use format automation to transform a carousel ad into a video slideshow format. See [Carousel Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/videoads#carousel) for how to create a carousel creative.

### Data sources

| Data source | Description |
| --- | --- |
| `manual_uploads` | Uses cards from the carousel |

### Example request

```bash
curl -X POST \
  -F 'name="Carousel to Video Slideshow with Format Transformation Spec"' \
  -F 'object_story_spec={
    "page_id": "<PAGE_ID>"
    ... // Fields to create a carousel creative \
  }' \
  -F 'format_transformation_spec=[{
    "format": "video_slideshow",
    "data_source": ["manual_uploads"]
  }]' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

## Parameters

| Name | Description |
| --- | --- |
| `format` | **Required.**<br>Specifies the target format for the transformation.<br>**Values:**<br><br>* `da_collection`: Transforms the ad into a dynamic ads (Advantage+ catalog) collection format.<br>* `sa_collection`: Transforms the ad into a static ads (manual upload) collection format.<br>* `single_media`: Transforms the ad into a single image or video format.<br>* `carousel`: Transforms the ad into a carousel format.<br>* `video_slideshow`: Transforms the ad into a video slideshow format. |
| `data_source` | **Optional.**<br>Specifies the data used to assemble the format.<br>**Values:**<br><br>* `none`: Opts out of all data sources.<br>* `catalog`: Uses product catalog data.<br>* `manual_uploads`: Uses advertiser uploaded media.<br>* `app_information`: Uses app store information.<br>* `site_links`: Uses media from your website.<br><br>**Note:** Not including the `data_source` field or leaving it empty indicates an opt-in to all available data sources. |

### Configuring data sources

Each data source may require additional fields in your ad creative request. To configure product catalog data, set up the `creative_sourcing_spec` and `degrees_of_freedom_spec` as described in [Product Extensions](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/product-extensions#after). To configure media from your website, see [Add Site Links](https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative/advantage-creative/add-site-links#after). To configure app store data, see [Mobile App Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/mobile-app-ads).

## Retrieve the format transformation

To check your ad, make an API call requesting the `format_transformation_spec`:

### Example request

```bash
curl -G \
  -d 'fields=format_transformation_spec' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<CREATIVE_ID>
```

### Example response

```json
{
  "format_transformation_spec": [
    {
      "data_source": ["catalog"],
      "format": "da_collection"
    }
  ],
  "id": "<AD_CREATIVE_ID>"
}
```

## See also

* [Ad Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative)
* [Adgroup](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup)
* [Advantage+ Catalog Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads)
* [Collection Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative/collection-ads)
* [Product Extensions](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/product-extensions)
* [Add Site Links](https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative/advantage-creative/add-site-links)
* [Carousel Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/videoads#carousel)
* [Mobile App Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/mobile-app-ads)
