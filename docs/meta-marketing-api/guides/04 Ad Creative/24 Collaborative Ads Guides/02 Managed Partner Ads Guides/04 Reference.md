<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/reference | Saved: 2026-09-19 -->

# "Managed Partner Ads: API Reference"


Other managed partner ads APIs include:

* [Seller Management APIs](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/seller)
* [Partner Ads Management APIs](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/mpa-ads)
* [Async API User Guide](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/async-api-user-guide)

## Lookup seller business API {#lookup-seller-business}

Use this API to look up the Business ID for a given seller or `vendor_id`.

### Access token type
To call this API, use the access token created by an admin system user that belongs to the parent Business Manager (the marketplace's Meta Business Suite).

#### Sample `GET` request

```
curl -X GET \
  -F "child_business_external_id=<VENDOR_ID>" \
  "https://graph.facebook.com/v<API_VERSION>/<Business_id>/owned_businesses?access_token=<ACCESS_TOKEN>"
```

#### Sample response

```
{
    "child_business_id": 3213232
}
```

## Access seller business metadata API

Use this API to retrieve seller metadata of a Managed Partner Ads seller child business. The metadata from the API response includes:

* Managed Partner Ads assets: page, ad account, payment method
* Seller's custom template info
* Seller business info: name

### Access token type
To call this API, use the access token created by an admin system user that belongs to the parent Business Manager (the marketplace's Meta Business Suite).

### Business ID type
Use the child Business Manager ID for the API call.

#### Sample `GET` request

```
curl -X GET \
  "https://graph.facebook.com/v<API_VERSION>/<Business_id>/?fields=collaborative_ads_managed_partner_business_info&access_token=<ACCESS_TOKEN>"
```

#### Sample response

```
{
  "collaborative_ads_managed_partner_business_info": {
    "seller_business_status": "ready",
    "seller_business_info": {
      "seller_external_website_url": "https://www.website.com",
      "partner_facebook_page": {
        "id":"9999999"
      }
    },
    "ad_account": {
      "id": "act_11111111",
      "currency": "USD"
    },
    "page": {
      "id": "3333333"
    },
    "catalog_segment": {
      "id": "2222222"
    },
    "extended_credit": {
      "receiving_credit_allocation_config": {
        "partition_type": "FIXED",
        "id":"66666666"
      },
      "max_balance": {
        "amount":"5,000.00",
        "amount_in_hundredths":"500000",
        "currency":"USD",
        "offsetted_amount":"500000"
      },
      "id":"888888888"
    },
    "active_seller_campaign": {
      "status": "ACTIVE",
      "id": "1111111"
    },
    "template": [
      {
        "budget_percentage": 0.5,
        "campaign_template_id": "4444444",
        "adgroup_template_ids": [
          "5555555"
        ],
        "targeting_type": "retargeting"
      },
      {
        "budget_percentage": 0.5,
        "campaign_template_id": "6666666",
        "adgroup_template_ids": [
          "7777777"
        ],
        "targeting_type": "prospecting"
      }
    ]
  },
  "id": "<child_business_manager_id>"
}
```

## Get the child system user token

For an onboarded child Business Manager, use this API call to share the application and get its access token. This token can be used for all subsequent calls to create or manage ads.

#### Sample `POST` request

```
curl \
  -F 'id=<CHILD_BUSINESS_MANAGER>' \
  -F 'app_id=<App_ID>' \
  -F 'scope=ads_management,business_management' \
  -F 'access_token=<Parent BM Admin System User Access Token>' \
  -F 'appsecret_proof=<APP_SECRET>' \
  "https://graph.facebook.com/<API_VERSION>/<CHILD_BUSINESS_MANAGER_ID>/access_token"
```

#### Sample response

```
{
  "access_token": "<CHILD_BM_ACCESS_TOKEN>"
}
```

## Update seller business configuration API

Use this API to update a seller's business information. You can update a seller's business information, like external website URL or email address, and/or their Managed Partner Ads assets, like active ad account or an ad creation custom campaign template. See [Available Parameters](#update-seller-available-parameters) for more information.

To create and get a Seller's Business, see [Seller Business Creation API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/mpa-ads). To find the Business ID of existing seller, see [Lookup Seller Business API](#lookup-seller-business).

### Access token type
To call this API, use the access token that belongs to each individual child Business Manager (the seller's Meta Business Suite).

### Available parameters {#update-seller-available-parameters}

| Field | Description |
| --- | --- |
| `seller_external_website_url `<br><br>type: string | **Optional.**<br><br>Seller's external website URL. |
| `seller_email_address `<br><br>type: string | **Optional.**  <br>A unique email address value. |
| `active_page_id`<br><br>type: string | **Optional.**<br><br>Seller's Page ID to run campaign. |
| `active_ad_account_id`<br><br>type: string | **Optional.**<br><br>Seller's active ad account. |
| `template`<br><br>type: JSON | **Optional.**<br><br>Seller's Custom Template. [Sample](#custom-template-sample) |

#### Sample `POST` request

```
curl \
  -F "seller_external_website_url='http://shop.com'" \
  -F "ad_account=<SELLER_ACTIVE_AD_ACCOUNT_ID>" \
  "https://graph.facebook.com/v<API_VERSION>/<Child_Business_id>/managed_partner_business_setup?access_token=<ACCESS_TOKEN>"
```

#### Sample response

```
{
    "id": 3213232, // id of child business
    "meta_data": {
        "seller_business_info": {
            "seller_email_address": "goodseller@fb.com"
            "seller_external_website_url": "www.website.com"
        },
        "ad_account": {
            "id": "434343",
            "spend_limit": "500",
        },
        "page": {
            "id": "123412341",
        },
        "template": [
          {
            "budget_percentage": 0.5,
            "campaign_template_id": "4444444",
            "adgroup_template_ids": [
              "5555555"
            ],
            "targeting_type": "retargeting"
          },
          {
            "budget_percentage": 0.5,
            "campaign_template_id": "6666666",
            "adgroup_template_ids": [
              "7777777"
            ],
            "targeting_type": "prospecting"
          }
        ]
    }
}
```

### Error Codes
| Error Code | Error Subcode | Description |
| --- | --- | --- |
| 1800002 | 2310138 | The business name {invalid_business_name} is not a valid name. Consider using {business_name} instead. Business names must meet Facebook's business name requirements. |
| 1800004 | 2310127 | Remove or update the following invalid country codes listed for the partner's registration countries: [{invalid_registration_country_codes}]. |
| 1800010 | 2310167 | You're attempting to use a managed partner ads (MPA) API to update ads for a business that has not onboarded to MPA. Check the business being used, or use a different API. |
| 1800301 | 2310129 | You entered an invalid Facebook page URL {page_url} for this partner. Check the link or enter a new one. |
| 1800302 | 2310130 | The Facebook Page you entered {page_url} belongs to your business. Enter a Facebook Page that belongs to the partner. |
| 1800303 | 2310132 | You entered a Page {page_url} that is linked to another partner. Check the link or enter a new URL for the partner's Facebook Page. |
| 1800304 | 2310131 | You'll need to select another Page for this partner because the one you selected cannot be used with managed partner ads. |
| 1800403 | 2310072 | The template config belonging to this seller is invalid. |

## Using Templates

A template is an asset configured and used by the marketplace in the Managed Partner Ads service. Templates contain details and settings, or "components", that control the seller campaigns run by the marketplace on the seller's behalf.

Template's components include ad sets and ads, which include information like targeting, ad creative, formats, and more. There are four components required for each campaign template:

* Ad set component for prospecting
* Ad component
* Ad set component for retargeting
* Ad component

**Note:** In your template, one ad set must be set up for the retargeting ad goal and the other must be set up for the prospecting ad goal.

### Types of Template

There are two types of templates, default and custom:

| Basis for Comparison | Default Template | Custom Template |
| --- | --- | --- |
| Creation | The default template is created during the onboarding process that must be completed for Managed Partner Ads. | The custom template is created by the marketplace in the [Template Creation flow](#template-creation-flow) from existing campaigns they previously created in Ads Manager. |
| Configurable properties | Facebook automatically configures the ad sets and ads for the default template. The budget split can be specified for retargeting and prospecting ad goals. The marketplace can specify the primary text and UTM parameters. | Stores configurations from campaigns previously created in Ads Manager. Along with this, budget split for retargeting and prospecting ad goals can be specified for each seller. |
| Scope | Every marketplace has a default template, which is a global asset, ready for use with any and all seller campaigns, at any time. | Only one custom campaign template at a time is permitted per seller. The marketplace can change the custom template to contain different ad set and/or ad component anytime. |
| Advantage | Allows marketplaces to set common settings to be applied to all seller campaigns. | Allows the marketplace to configure a broad set of campaign parameters and details that could support special promotions, seasonal campaigns, sales events, and other occasions that require special settings. Additionally, storing campaign configurations helps marketplaces manage and scale their seller campaigns with minimal effort. |
| Campaign creation | [Use the main campaign creation instructions](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/mpa-ads). To create and run seller's ads using the default template, set the `use_marketplace_template` field to `true`. | [Use the main campaign creation instructions](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/mpa-ads). To create and run seller's ads using the custom template, set the `use_seller_template` field to `true`. |

### Requirements for Custom Templates

Before creating a custom template, the marketplace must [create a Producer Business Manager](https://www.facebook.com/business/help/1710077379203657) first — this ensures that campaigns used to create templates conform to Collaborative Ads customizations and requirements for seller campaigns. As a producer, the Business Manager can be used to create source ads for template creation.

Retargeting ad set, prospecting ad set and ad components must be available to add and/or configure a custom campaign template for a seller.

The campaigns used for template creation must be associated with a Collaborative Ads ad account, and have the following settings:

* Campaign objective must be Catalog Sales.
* In Ads Manager, budget Optimization must be toggled on at the campaign level, with 'Lowest Cost' bid strategy.
* Ad format must be carousel with no static overlays, images or videos.

### Custom Template Flow {#template-creation-flow}

#### Step 1: Create a Custom Campaign Template

1. Go to the **Assets** tab in Collaboration Center. Inside that tab, the **Template Inventory** section displays a collection of templates and template components that can be used for seller campaigns.
2. Click on **Create Template** to open up a stepper card.
3. Search for an existing valid source campaign by providing either the ad set or ad ID.
4. To create your template component, select either ad set and/or ad extracted from source ID. You need to create all four components (2 ads and 2 ad sets) for a custom template.
5. Save the template by providing name and description.

The seller-specific details such as Catalog Segment, Product Set, Facebook page and destination URL are dropped from the source campaign during template creation. The final campaign created using the template has seller specific information for these fields with a lifetime campaign budget and lowest cost bid strategy.

#### Step 2: Apply the Custom Template to a Seller

Use custom templates in the following ways:

* Use at the time of seller onboarding to assign specific templates for new seller campaigns.
* Change the template for a seller to start a holiday or other special campaign.

If you want to change the campaign template for sellers, be sure to have the template components you want to use for replacing those in the existing campaign template—you can replace 1 or all. If you are creating a new template for sellers that have no custom template, you need to have all four components (2 ads and 2 ad sets) ready to use.

A template can be applied to sellers using one of the following ways:

##### Single Seller Template Application UI Flow

1. Go to the **Sellers** tab in Collaboration Center and select a seller that you wish to apply the custom template.
2. Open the **Shared Assets** tab for that seller. At first, sellers do not have a custom campaign template configured.
3. Click on **Add Custom**. A modal pops up where you can select template components created during template creation step to apply for the selected seller.
4. You can specify the maximum spend limits for the prospecting ad set and the retargeting ad set, which are expressed as a percentage of your total campaign budget. The budget will continuously distribute in real time across the two ad sets based on performance. This means that the percentage of the budget spent on each ad set at the end of the campaign may be less than the maximum spend you set. By default, the maximum spend limit is split equally between the two ad sets, but you can change it.
5. Click on **Save** and the selected template components will be applied to the seller.

##### Bulk Template application UI flow

This feature aims to provide scalability by enabling marketplaces to apply template components to multiple sellers at the same time.

1. Go to the **Sellers** tab in Collaboration Center and select a set of sellers that you wish to apply templates to using the checkbox column.
2. Click on **Apply Templates** to proceed with template application flow.
3. A modal will be displayed based on the seller selection

* *If the selected sellers have no existing custom templates*, select the four template components, and specify the spend limit percentage for Prospecting and Retargeting. By default, the spend limit is split equally between the two ad sets.
* *If the selected sellers have had custom templates previously applied*, select all, one, or some of the template components to replace for selected sellers. The spend limit percentage for Ad Sets can be overridden for sellers by switching on the toggle.
* *If the selected sellers are a mix of sellers with and without custom templates*, a modal is displayed to select either 'Sellers with no custom templates' or 'Sellers with custom template' for the next step. Based on the selection, a modal from the two previous options is displayed.

Finalize by clicking on **Save**. The selected template components will be applied to selected sellers.

##### Update Seller Business Configuration API {#custom-template-sample}

Use the [Update Seller Business Configuration API](#update-seller-business-configuration-api) to apply a custom template to a seller with the following input parameter: `template`.

```
"template":[
  {
    "budget_percentage":0.5,
    "campaign_template_id":"160235235998069",
    "adgroup_template_ids":[
      "447963739637509"
    ],
    "targeting_type":"retargeting"
  },
  {
    "budget_percentage":0.5,
    "campaign_template_id":"278452090413983",
    "adgroup_template_ids":[
      "458654975391261"
    ],
    "targeting_type":"prospecting"
  }
]
```

#### Step 3: Create Your Campaign

[Use the main campaign creation instructions](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/mpa-ads) to create and run seller's ads with the specified parameters and previously applied custom template. To use the custom campaign template applied to that seller, set `use_seller_template` to `true`.
