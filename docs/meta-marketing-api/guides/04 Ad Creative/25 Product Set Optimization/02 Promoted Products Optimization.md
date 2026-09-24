<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/product-set-optimization/promoted-products-optimization | Saved: 2026-09-19 -->

# Promoted products optimization



**Warning:** **Beta:** Access to this product is currently limited. Confirm with your Meta sales representative that your business has been granted the necessary access to begin onboarding.

This guide covers setting up promoted products optimization ad campaigns.

## Before you begin

- Make sure you meet the [Prerequisites](https://developers.facebook.com/documentation/ads-commerce/marketing-api/product-set-optimization/product-set-optimization-overview#prerequisites) in the product set optimization overview.
- Review [Get Started with Advantage+ Catalog Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/get-started/).

## Single-brand product sets

To create a product set, you can filter your catalog items using any expression. See [Product Sets](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/product_sets/) for the full parameter reference.

#### Example requests
A product set created using the vendor ID:

```html
curl -X POST \
  -F 'name=<PRODUCT_SET_NAME>' \
  -F 'filter={"vendor_id": {"eq": ["<FILTER_VALUE>"]}}' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<CATALOG_ID>/product_sets
```

A product set created using the brand:

```html
curl -X POST \
  -F 'name=<PRODUCT_SET_NAME>' \
  -F 'filter={"brand": {"i_contains": "<BRAND>"}}' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<CATALOG_ID>/product_sets
```

## Ad campaign creation

**Endpoint:** `POST /act_{ad-account-id}/campaigns`

#### Example request

```html
curl -X POST \
  -F 'name=<PRODUCT_CATALOG_SALES_CAMPAIGN_NAME>' \
  -F 'objective=OUTCOME_SALES' \
  -F 'promoted_object={"product_catalog_id": "<CATALOG_ID>"}' \
  -F 'status=PAUSED' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/campaigns
```

#### Key parameters

| Name | Description |
|------|-------------|
| `objective` | **Required.** 
Set to `OUTCOME_SALES` for Advantage+ catalog ads. |
| `promoted_object` | **Required.** 
Must include `product_catalog_id`. |

## Ad set creation

**Endpoint:** `POST /act_{ad-account-id}/adsets`

#### Example request

```html
curl -X POST \
  -F 'name=<PRODUCT_CATALOG_SALES_ADSET_NAME>' \
  -F 'start_time=<START_TIME>' \
  -F 'end_time=<END_TIME>' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'optimization_goal=OFFSITE_CONVERSIONS' \
  -F 'bid_strategy=LOWEST_COST_WITHOUT_CAP' \
  -F 'daily_budget=<DAILY_BUDGET_IN_MINIMUM_DENOMINATION>' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'targeting={ "geo_locations": {"countries":["<COUNTRY>"]},
    "dynamic_audience_ids": ["<DYNAMIC_AUDIENCE_ID>"]   }' \
  -F 'promoted_object={"product_set_id":"<PRODUCT_SET_ID>", "product_set_optimization":"enabled"}' \
  -F 'budget_source=RMN' \
  -F 'status=PAUSED' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

**Note:** Set the `start_time` of the ad set to not less than **72 hours after the creation date** to allow Meta to enable promoted products optimization for you.

#### Key parameters

| Name | Description |
|------|-------------|
| `billing_event` | For example, `LINK_CLICKS` or `IMPRESSIONS`. |
| `budget_source` | **Required.** 
Source of the budget being used. Set to `RMN` for promoted products optimization. |
| `promoted_object.custom_event_type` | **Optional.** 
Define a conversion event (for example, `PURCHASE`). |
| `promoted_object.product_set_id` | **Required** for Advantage+ catalog ads. 
The product set to promote. |
| `targeting` | Audience definition (broad or retargeting). |

**Note:** Once the ad set is created, you cannot update the `product_set_optimization` and `product_set_id` fields in the `promoted_object` parameter.

### For static ads only

If you are creating a static ad campaign, ensure the conversion event in the ad set is set to `PURCHASE`.

After creating the ad campaign and ad set, you should:

- Ensure that the product set contains **only one brand**.
- Provide the ad set ID and the product set ID (to be used for promoted products optimization) to your Meta sales representative.

## Ad creation

After receiving confirmation from Meta, proceed with creating your ads.

**Note:** Include the [`url_tags`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative/) parameter when creating your ads.

**Endpoint:** `POST /act_{ad-account-id}/ads`

#### Example request

```html
curl -X POST \
  -F 'name="<PRODUCT_CATALOG_SALES_AD_NAME>"' \
  -F 'adset_id="<ADSET_ID>"' \
  -F 'creative={
      "product_set_id": "<PRODUCT_SET_ID>",
      "asset_feed_spec": {"ad_formats": ["CAROUSEL"],"optimization_type": "FORMAT_AUTOMATION"},
      "creative_sourcing_spec": {"source_url": "<URL>"},
      "object_story_spec": {
        "page_id": "<PAGE_ID>",
        "template_data": {
          "call_to_action": {"type": "SHOP_NOW"},
          "format_option": "carousel_images_multi_items",
          "link": "<URL>",
          "multi_share_end_card": false
        }
      },
      "degrees_of_freedom_spec": {
        "creative_features_spec": {
          "media_type_automation": {
            "enroll_status": "OPT_IN"
          }
        }
      },
      "title": "{{product.name}}",
      "url_tags": "<KEY1>=<VALUE1>&<KEY2>=<VALUE2>"
    }' \
  -F 'status="PAUSED"' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads
```

**Note:** The `degrees_of_freedom_spec` field is for single-brand ads only.

After completing all of the above creation steps, provide the ad campaign IDs to your Meta sales representative.
