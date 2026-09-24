<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-shopping-campaigns/audience-type-url-parameters | Saved: 2026-09-19 -->

# Audience Type URL Parameters



The Urchin Tracking Module﹡ (UTM) is a standardized system for passing information from ad clicks via destination URL parameters to use in analytics. This means, when a user clicks on an ad, the request URL will contain parameters that can be extracted by web plugins like Google Analytics.

At Meta, we allow advertisers to specify UTM parameters at an ad level under the **Tracking** section of the ad creation flow in Ads Manager. Typically, ads can have multiple ad sets per campaign which allows for having different URL parameters for each audience type associated with the ad set. However, Advantage+ shopping campaigns have only one ad set per campaign which is used for both retargeting and prospecting users.

Now, Advantage+ shopping campaigns will support custom audience types — new (`prospecting`) and existing (`retargeting`) for URL parameters to provide more context to the ad impressions. More specifically, we allow you to configure three values of the `custom_audience_info` field to enable the audience type URL parameters: `audience_type_param_name`, `new_customer_tag`, and `existing_customer_tag`.

This feature is only available once the existing custom audience is set up. When that is completed, you can configure these parameters in the **Ad Account Settings** in the **Advantage+ Shopping Campaigns** section.

## Parameters

The `custom_audience_info` field extends the `/act_AD_ACCOUNT_ID` node.

| Name | Description |
| --- | --- |
| `custom_audience_info` | **Required.**  <br>**Values:** `audience_type_param_name` and `new_customer_tag` or `existing_customer_tag`  <br>For a successful POST call, the `audience_type_param_name` and either the `new_customer_tag` parameter or the `existing_customer_tag` parameter is required. |

### The `custom_audience_info` field

| Name | Description |
| --- | --- |
| `audience_type_param_name`  <br><br>string | **Required.**  <br>**Value:** `audience_type`  <br>The field name for the URL. Should be a non-empty string containing letters, numbers, or underscores. |
| `new_customer_tag`<br><br>string | **Optional.**  <br>**Value:** `prospecting`  <br>The field value for new customers. Should be a non-empty string containing letters, numbers, or underscores. |
| `existing_customer_tag`<br><br>string | **Optional.**  <br>**Value:** `retargeting`  <br>The field value for existing customers. Should be a non-empty string containing letters, numbers, or underscores. |

## Examples

### Retrieve the custom audience info

#### Request

```
curl -X GET -G \
  -d 'fields=custom_audience_info' \
  -d 'access_token=ACCESS_TOKEN' \
https://graph.facebook.com/v25.0/act_AD_ACCOUNT_ID
```

#### Response

```
{
  "custom_audience_info": {
    "audience_type_param_name": "audience_type",
    "new_customer_tag": "prospecting",
    "existing_customer_tag": "retargeting"
  },
  "id": "act_AD_ACCOUNT_ID"
}
```

### Create new custom audience info

```
curl -i -X POST \
  -H 'Content-Type: application/json' \
  -d '{"custom_audience_info": {"audience_type_param_name": "audience_type", "new_customer_tag": "prospecting", "existing_customer_tag": "retargeting"}}' \
  // Note: new_customer_tag and existing_customer_tag are both shown here for example only
  -d 'access_token=ACCESS_TOKEN' \
  https://graph.facebook.com/v25.0/act_AD_ACCOUNT_ID
```

﹡ Urchin was acquired by Google and turned into Google Analytics
