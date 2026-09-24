<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/partner-premium-options | Saved: 2026-09-19 -->

# Partner Premium Options



Premium Options create stronger partnerships between retailers and brands who use our Collaborative Ads solution with unique targeting and insight-mining capabilities. Retailers can offer brand partners add-ons to Collaborative Ads through Premium Options.

## Available configurations

### Category targeting

[Extended Audience Retargeting](https://www.facebook.com/business/help/3025590151045930?id=1321866301271922) allows brands and advertisers to target ads to category-level audiences made up of people who viewed or added to cart products in the category to which the brand's products belong.

### Basket insights

[Basket Insights](https://www.facebook.com/business/help/935433177034005?id=1321866301271922) provide information about the categories of other purchases bought along with the product featured in the brand or advertiser's ad.

### Retailer custom audiences

[Retailer Custom Audiences](https://www.facebook.com/business/help/541293860470628?id=1321866301271922) enable retailers to share audiences with built-in domain protection for the brands and advertisers they collaborate with. Domain protection restricts the audiences for use by brand partners only and drives traffic from the campaigns exclusively to the retailer's website.

## Retrieve the premium options

Use a `GET` API call to retrieve the premium options settings of a catalog segment. You can provide either the `catalog_segment_id` and the `partner_business_id` or only the `vendor_id`. If you use both, ensure that the `catalog_segment_id` is owned by the provided vendor.

### Request

To get the settings with the `catalog_segment_id` and `partner_business_id`:

```
curl -i -X GET \
  "https://graph.facebook.com/v25.0/BUSINESS_ID?fields= \
  collaborative_ads_partner_premium_options \
  .catalog_segment_id(CATALOG_SEGMENT_ID) \
  .partner_business_id(PARTNER_BUSINESS_ID) \
  .vendor_id(VENDOR_ID) \
  &access_token=ACCESS_TOKEN"
```

To get the settings with only the `vendor_id`:

```
curl -i -X GET \
  "https://graph.facebook.com/v25.0/BUSINESS_ID?fields= \
  collaborative_ads_partner_premium_options \
  .vendor_id(VENDOR_ID) \
  .partner_business_id(PARTNER_BUSINESS_ID) \
  &access_token=ACCESS_TOKEN"
```

#### Parameters

| Name | Description |
| --- | --- |
| `business_id`<br><br>numeric string or integer | **Required.**  <br>ID for the business the catalog or vendor is in. |
| `catalog_segment_id`<br><br>numeric string or integer | **Optional.**  <br>ID of the catalog segment to update. Either this field or the `vendor_id` field is required. |
| `vendor_id`<br><br>string | **Optional.**  <br>ID of the vendor to update. Either this field or the `catalog_segment_id` field is required. |
| `partner_business_id`  <br><br>numeric string or integer | **Required.**  <br>ID of the partner's business to retrieve. |

### Response

On success, you get the current settings for the premium options:

```
{
  "collaborative_ads_partner_premium_options": {
    "enable_extended_audience_retargeting": bool,
    "enable_basket_insight": bool,
    "retailer_custom_audience_config": {
      "audience_id": [
        AUDIENCE_ID_1,
        AUDIENCE_ID_2,
        AUDIENCE_ID_3
      ]
    }
  }
}
```

## Update the premium options

Use a `POST` API call to the `/{business_id}/partner_premium_options` endpoint to update the premium options information.

### Request

To update the settings with only the `catalog_segment_id` and `partner_business_id`:

```
curl -i -X POST \
  "https://graph.facebook.com/v25.0/BUSINESS_ID/partner_premium_options \
  ?catalog_segment_id=CATALOG_SEGMENT_ID \
  &partner_business_id=PARTNER_BUSINESS_ID \
  &enable_extended_audience_retargeting=BOOL \
  &enable_basket_insight=BOOL \
  &retailer_custom_audience_config=JSON_OBJECT \
  &access_token=ACCESS_TOKEN"
```

To update the settings with only the `vendor_id`:

```
curl -i -X POST \
"https://graph.facebook.com/v25.0/BUSINESS_ID/partner_premium_options \
  ?vendor_id=VENDOR_ID \
  &enable_extended_audience_retargeting=BOOL \
  &enable_basket_insight=BOOL \
  &retailer_custom_audience_config=JSON_OBJECT \
  &access_token=ACCESS_TOKEN"
```

#### Parameters

| Name | Description |
| --- | --- |
| `business_id`<br><br>numeric string or integer | **Required.**  <br>ID for the business the catalog or vendor is in. |
| `catalog_segment_id`<br><br>numeric string or integer | **Optional.**  <br>ID of the catalog segment to update. Either this field or the `vendor_id` field is required. |
| `vendor_id`<br><br>string | **Optional.**  <br>ID of the vendor to update. Either this field or the `catalog_segment_id` field is required. |
| `partner_business_id`  <br><br>numeric string or integer | **Required.**  <br>ID of the partner's business to retrieve. |
| `enable_extended_audience_retargeting`<br><br>Boolean | **Required.**  <br>Enable or disable extended audience retargeting. |
| `enable_basket_insight`<br><br>Boolean | **Required.**<br>Enable or disable basket insights. |
| `retailer_custom_audience_config`<br><br>JSON object  <br><br>{`audience_id`: array of strings} | **Required.**  <br>Contains the list of `audience_ids` to share this catalog segment with. To disable sharing, enter an empty array.<br><br>**Example:** `{'audience_id':[AUDIENCE_IDs]}` |

### Response

```
{
  "status": "success"
}
```

## Getting audience IDs from the Collaboration Center

You can get the audience ID from the Audiences tool in the Collaboration Center. If you do not see the **Audience ID** column, click on the **Columns** drop-down menu in the top-right corner of the page, and select the **Audience ID** checkbox.

## Learn more

* [Collaborative Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads)
