<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/product-set-optimization/budget-splits | Saved: 2026-09-19 -->

# Budget splits



**Warning:** **Beta:** Access to this product is currently limited. Confirm with your Meta sales representative that your business has been granted the necessary access to begin onboarding.

This guide walks you through setting up product set optimization ad campaigns for multiple brands with per-brand budget splits, where an ad campaign's total budget is allocated and controlled for each individual brand.

## Before you begin

- Make sure you meet the [Prerequisites](https://developers.facebook.com/documentation/ads-commerce/marketing-api/product-set-optimization/product-set-optimization-overview#prerequisites) in the product set optimization overview.
- Review [Get Started with Advantage+ Catalog Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/get-started/).

## Multi-brand product sets

To create a product set, you can filter your catalog items using any expression. See [Product Sets](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/product_sets/) for the full parameter reference.

#### Example request

A multi-brand product set created with any of the vendor IDs:

```html
curl -X POST \
  -F 'name=<PRODUCT_SET_NAME>' \
  -F 'filter={"vendor_id": {"is_any": ["<VALUE1>", "<VALUE2>"]}}' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<CATALOG_ID>/product_sets
```

## Ad campaign creation

**Endpoint:** `POST /act_{ad-account-id}/campaigns`

#### Example request

```html
curl -X POST \
  -F 'name=<PRODUCT_CATALOG_SALES_CAMPAIGN_NAME>' \
  -F 'objective=OUTCOME_SALES' \
  -F 'promoted_object={"product_catalog_id":"<CATALOG_ID>"}' \
  -F 'special_ad_categories=[]' \
  -F 'status=PAUSED' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/campaigns
```

#### Key parameters

| Name | Description |
|------|-------------|
| `objective` | **Required.** 
Set to `OUTCOME_SALES` for product set optimization. |
| `promoted_object` | **Required.** 
Must include `product_catalog_id`. |

## Ad set creation

**Endpoint:** `POST /act_{ad-account-id}/adsets`

#### Example request

```html
curl -X POST \
  -F 'name=<PRODUCT_CATALOG_SALES_ADSET_NAME>' \
  -F 'start_time=<START_TIME>' \
  -F 'end_time=<END_TIME>' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'optimization_goal=OFFSITE_CONVERSIONS' \
  -F 'bid_strategy=LOWEST_COST_WITHOUT_CAP' \
  -F 'daily_budget=<DAILY_BUDGET>' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'targeting={ "geo_locations": {"countries":["<COUNTRY>"]},
    "dynamic_audience_ids": ["<DYNAMIC_AUDIENCE_ID>"]
  }' \
  -F 'promoted_object={"product_set_id":"<PRODUCT_SET_ID>", "product_set_optimization":"enabled"}' \
  -F 'budget_source=RMN' \
  -F 'status=PAUSED' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

**Note:** Set the `start_time` of the ad set to not less than **72 hours after the creation date** to allow Meta to enable product set optimization for you.

#### Key parameters

| Name | Description |
|------|-------------|
| `billing_event` | For example, `LINK_CLICKS` or `IMPRESSIONS`. |
| `budget_source` | **Required.** 
Source of the budget being used. Set to `RMN` for product set optimization. |
| `promoted_object.custom_event_type` | **Optional.** 
Define a conversion event (for example, `PURCHASE`). |
| `promoted_object.product_set_id` | **Required.** 
The product set to promote. |
| `targeting` | Audience definition (broad or retargeting). |

### For static ads only

If you are creating a static ad campaign, ensure the conversion event in the ad set is set to `PURCHASE`.

After creating the ad campaign and ad set, you should:

- Provide the ad set ID and the product set ID (to be used for product set optimization) to your Meta sales representative.

## Ad creation

After receiving confirmation from Meta, proceed with creating your ads.

**Note:** Include the [`url_tags`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative/) parameter when creating your ads.

**Endpoint:** `POST /act_{ad-account-id}/ads`

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
      "title": "{{product.name}}",
      "url_tags": "<KEY1>=<VALUE1>&<KEY2>=<VALUE2>"
    }' \
  -F 'status="PAUSED"' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads
```

After completing all of the above creation steps, provide the ad campaign IDs to your Meta sales representative.

## Budget splits

[Budget splits](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign/budget_split_set) in multi-brand ad campaigns enables each brand to showcase their products, while respecting and allocating individual budgets for each brand.

**Note:** Budget splits do not work with static ads.

### Budget splits setup

Budget splits help define budget at the brand level, if you are running a multi-brand ad campaign. **Each brand's budget is set as a daily amount. The sum of all brand budgets must equal the ad set's total daily budget.**

You need to provide a CSV file with the following columns:

| Name | Description |
|------|-------------|
| `budget_split_filter` | JSON string filter applied to the product set to identify a brand's items. Uses the same format as a product set filter. Only accepts the format `{"<BRAND_FILTER>":{"eq":"<VALUE>"}}`. 

**Example:** `{"vendor_id":{"eq":"Seller123"}}` 

Supported filter fields: 
- `vendor_id` 
- `custom_label_0` 
- `custom_label_1` 
- `custom_label_2` 
- `custom_label_3` 
- `custom_label_4` 
- `brand` |
| `budget` | Budget amount in the [minimum denomination](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview/budgets/) of the ad account's currency, such as cents for USD (for example, 2350 for USD $23.50). See the [offset table](https://developers.facebook.com/documentation/ads-commerce/marketing-api/currencies/#example-offset-100) for reference. 

The budget type should match that of the product set and ad set. **Note:** Currently you can only use `daily_budget`, not `lifetime_budget`. |

#### Example CSV file format

```html
budget_split_filter, budget
{"vendor_id":{"eq":"seller123"}}, 1000
{"vendor_id":{"eq":"seller456"}}, 1350
...
```

### Budget split set creation

Multi-brand ad campaigns must use the `/{ad-set-id}/budget_split_set` endpoint. They can be created with either a local file or a hosted file's URL.

#### Example requests

Local file

```html
curl -X POST \
  -F 'budget_type=<BUDGET_TYPE>' \
  -F 'promoted_product_set_id=<PRODUCT_SET_ID>' \
  -F 'multi_brand_campaign_type="BRAND_GUARD"' # Only include multi_brand_campaign_type if you want to enable brand guard \
  -F 'file=@<FILE_PATH>;type=text/csv' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<ADSET_ID>/budget_split_set
```

Hosted file with a URL

```html
curl -X POST \
  -F 'budget_type=<BUDGET_TYPE>' \
  -F 'promoted_product_set_id=<PRODUCT_SET_ID>' \
  -F 'multi_brand_campaign_type="BRAND_GUARD"' # Only include multi_brand_campaign_type if you want to enable brand guard \
  -F 'url=<URL>' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<ADSET_ID>/budget_split_set
```

#### Example response

```json
{
  "message":"Request accepted.",
  "request_id":"<REQUEST_ID>"
}
```

### Update budget split sets

This updates the budget split set and the ad set budget. The ad set budget is automatically updated if not included. Updates can be made with either a local file or a hosted file's URL.

**Note:** Avoid updating brand budgets in a budget split set until an hour before the end of the ad account's local day to prevent unintended spend.

#### Example requests

Local file

```html
curl -X POST \
  -F 'budget_split_set_id=<BUDGET_SPLIT_SET_ID>' \
  -F 'file=@<FILE_PATH>;type=text/csv' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<ADSET_ID>/budget_split_set
```

Hosted file with a URL

```html
curl -X POST \
  -F 'budget_split_set_id=<BUDGET_SPLIT_SET_ID>' \
  -F 'url=<URL>' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<ADSET_ID>/budget_split_set
```

#### Example response

```json
{
  "message":"Request accepted.",
  "request_id":"<REQUEST_ID>"
}
```

### Retrieve a budget split set's status

After creating or updating a budget split set, use the `request_id` returned in the response to check the request status.

#### Example request

```html
curl -X GET \
  'https://graph.facebook.com/v25.0/<REQUEST_ID>?access_token=<ACCESS_TOKEN>'
```

#### Example response

```json
{
  "budget_split_set_id":"<BUDGET_SPLIT_SET_ID>",
  "status":"<STATUS>",
  "id":"<REQUEST_ID>"
}
```

**Note:** The `status` field returns one of the following values: `SCHEDULED`, `IN_PROGRESS`, `SUCCESS`, `FAILED`.

### Budget split error codes

| Error Code | Description |
|------------|-------------|
| `2310258` | Invalid budget split details |
| `2310210` | Invalid budget split input params - Please provide data using either a file or a url. |
| `2310253` | Error while creating budget splits: Encountered error while creating budget splits. |
| `2310216` | Required columns missing in the budget split file |
