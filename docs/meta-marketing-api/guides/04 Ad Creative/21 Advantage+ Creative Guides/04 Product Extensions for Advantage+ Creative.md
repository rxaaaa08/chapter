<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/product-extensions | Saved: 2026-09-19 -->

# Product Extensions for Advantage+ Creative



[Product extensions (the "Add catalog items" feature in Meta Ads Manager)](https://www.facebook.com/business/help/336325168874197) is an Advantage+ creative optimization that showcases products from your catalog below your static single media when it's likely to improve performance. This document shows you how to use product extensions features for ads.

**Warning:** #### API Support for Product Extensions
Product extension creative creation is supported in all versions of the Marketing API, but beginning with v20.0, all ad creation requests that are eligible for product extensions must specify if the ad opts in to use it or not. The `enroll_status` field must be provided with either an `OPT_IN` or `OPT_OUT` value.

## Eligibility Criteria

* Campaign with `SALES` or `TRAFFIC` objective
* Single image or video ad format
* A catalog

## Before You Begin

Follow the steps below to set up your ad campaigns.

1. [Create a campaign](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started#campaign)
1. [Create an ad set](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started#ad-set-budget)

### Standalone Creative Creation

#### Before

```
curl -X POST \
  -F 'name=Product Extension Creative' \
  -F 'object_story_spec={
      "link_data": {
         "link": "<URL>",
      },
      "page_id": "<PAGE_ID>",
      "instagram_actor_id": "<INSTAGRAM_ACTOR_ID>",
  }' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

#### After (new fields are highlighted in bold)

```
curl -X POST \
  -F 'name=Product Extension Creative' \
  -F 'object_story_spec={
      "link_data": {
         "link": "<URL>",
      },
      "page_id": "<PAGE_ID>",
      "instagram_actor_id": "<INSTAGRAM_ACTOR_ID>",
  }' \
-F 'creative_sourcing_spec={
    "associated_product_set_id": "<PRODUCT_SET_ID>",
  }' \
-F 'degrees_of_freedom_spec={
    "creative_features_spec": {
      "product_extensions": {
        "enroll_status": "OPT_IN",
        "action_metadata": {
           "type": "MANUAL",
        },
      },
    },
  }' \ -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

### Ad Creation

#### Before

```
curl -X POST \
  -F 'creative={
    "object_story_spec": {
      "page_id": "<PAGE_ID>",
      "link_data": {
        "link": "<WEBSITE_URL>",
      }
    },
  }' \
  -F "adset_id=<ADSET_ID>" \
  -F "name=New Ad" \
  -F "status=PAUSED" \
  -F "access_token=<ACCESS_TOKEN>" \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads
```

#### After (new fields are in bold)

```
curl -X POST \
  -F 'creative={
    "object_story_spec": {
      "page_id": "<PAGE_ID>",
      "link_data": {
        "link": "<WEBSITE_URL>",
      }
    },
"creative_sourcing_spec": {
      "associated_product_set_id": "<PRODUCT_SET_ID>",
    },
    "degrees_of_freedom_spec": {
      "creative_features_spec": {
        "product_extensions": {
          "enroll_status": "OPT_IN",
          "action_metadata": {
            "type": "MANUAL"
          },
        }
      }
    }}' \
-F "adset_id=<ADSET_ID>" \
-F "name=New Ad" \
-F "status=PAUSED" \
-F "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads
```

### Parameters

| Name | Description |
| --- | --- |
| `product_extensions` | Product extensions is an Advantage+ creative optimization that showcases products from your catalog below your static single media when it's likely to improve performance. Please set the `enroll_status` field with `OPT_IN` to enable it.<br><br>It can be added in `creative_features_spec`. For more details, see the [Ad Creative Features Details](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details) reference documentation. |
| `associated_product_set_id` | Specifies the product set ID for product extensions in Advantage+ creative optimization. This product set will be shown below your single media.<br><br>It can be added in the `creative_sourcing_spec`. See the [Ad Creative Sourcing Spec](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-sourcing-spec) reference documentation for more details. |

## Learn More

### Business Help Center

* [About adding items from your catalog in Advantage+ creative](https://www.facebook.com/business/help/336325168874197)

### Marketing API Reference
* [Ad Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative#fields)
* [Ad Creative Degrees Of Freedom Spec](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-degrees-of-freedom-spec)
* [Ad Creative Features Spec](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-features-spec)
* [Ad Creative Feature Details](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details)
* [Ad Creative Object Story Spec](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-object-story-spec)
