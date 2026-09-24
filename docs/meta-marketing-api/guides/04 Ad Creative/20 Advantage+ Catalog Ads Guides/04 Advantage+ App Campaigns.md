<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/advantage-app-campaigns | Saved: 2026-09-19 -->

# Advantage+ App Campaigns & Advantage+ Catalog Ads



Advantage+ app campaigns (formerly known as Automated App Ads (AAA)) use powerful machine learning and automated systems to help your app install ads drive more of the results you value, scale campaigns with sustained performance, and ultimately help you work more efficiently. You can now create Advantage+ catalog ads with the existing Advantage+ app campaigns API. See the [Advantage+ app campaigns API](https://developers.facebook.com/docs/app-ads/automated-app-ads) documentation for more information on creating your campaigns.

There are no changes to ad campaign and ad set creation, and the dynamic capability is introduced only in the creatives. This document will detail the creation of an Advantage+ catalog ad creative and how to use it in your ads.

## Provide a creative and create ads

Once you have an ad set, you can create your ad by sending a `POST` request to the `/act_{ad_account_id}/ads` endpoint.

### Request

```bash
curl -X POST \
-F 'name=Advantage+ app campaigns sample ad' \
-F 'adset_id=ADSET_ID' \
-F 'creative={"name": NAME, "object_story_spec": SPEC, "product_set_id": PRODUCT_SET_ID}' \
-F 'access_token=ACCESS_TOKEN' \
https://graph.facebook.com/v25.0/act_AD_ACCOUNT_ID/ads
```

### Parameters

| Name | Description |
| --- | --- |
| `name`  <br><br>string | **Required.**  <br>Name of the ad. |
| `adset_id`  <br><br>int-64 | **Required.**  <br>The ID of the ad set, required on creation. |
| `creative`  <br><br>AdCreative | **Required.**  <br>The creative spec of the ad creative to be used by this ad.  <br>**Values:** `object_story_spec`, `product_set_id`, `use_page_actor_override`<br><br>Provide a creative spec:<br><br>```json
{
  "creative": {
    "name": "NAME",
    "object_story_spec": SPEC,
    "product_set_id": PRODUCT_SET_ID
  }
}
```<br><br>[Read more about creatives](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative). |
| `status`  <br><br>enum | **Optional.**  <br>Only `ACTIVE` and `PAUSED` are valid during creation. During testing, set ads to a `PAUSED` status to avoid accidental spend. |
| `adlabels`  <br><br>list<Object> | **Optional.**  <br>Ad labels associated with this ad. |
| `execution_options`  <br><br>list<enum> | **Optional.**  <br>**Values:**<br><br>* `set` (default)<br>* `validate_only` — When this option is specified, the API call will not perform the mutation but will run through the validation rules against values of each field.<br>* `synchronous_ad_review` — This option should not be used by itself. It should always be specified with `validate_only`. When these options are specified, the API call will perform Ads Integrity validations, which include message language checking, the image 20% text rule, and so on, as well as the validation logic.<br>* `include_recommendations` — This option cannot be used by itself. When this option is used, recommendations for ad object's configuration will be included. A separate section of recommendations will be included in the response, but only if recommendations for this specification exist.<br><br>If the call passes validation or review, the response will be `{"success": true}`. If the call does not pass, an error will be returned with more details. |

## Updating

You can update an [ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup) by making a `POST` request to the `/{ad_id}` node.

### Request

```bash
curl -X POST \
-F 'name=Advantage+ app campaigns sample update ad' \
-F 'creative={"name": NAME, "object_story_spec": SPEC, "product_set_id": PRODUCT_SET_ID}' \
-F 'access_token=ACCESS_TOKEN' \
https://graph.facebook.com/v25.0/AD_ID
```

### Parameters

| Name | Description |
| --- | --- |
| `name`  <br><br>string | New name of the ad. |
| `adlabels`  <br><br>list<Object> | Ad labels associated with this ad. |
| `execution_options`  <br><br>list<enum> | **Optional.**  <br>**Values:**<br><br>* `set` (default)<br>* `validate_only` — When this option is specified, the API call will not perform the mutation but will run through the validation rules against values of each field.<br>* `synchronous_ad_review` — This option should not be used by itself. It should always be specified with `validate_only`. When these options are specified, the API call will perform Ads Integrity validations, which include message language checking, the image 20% text rule, and so on, as well as the validation logic.<br>* `include_recommendations` — This option cannot be used by itself. When this option is used, recommendations for ad object's configuration will be included. A separate section of recommendations will be included in the response, but only if recommendations for this specification exist.<br><br>If the call passes validation or review, the response will be `{"success": true}`. If the call does not pass, an error will be returned with more details. |
| `status`  <br><br>enum | **Values:** `ACTIVE`, `PAUSED`, `DELETED`, `ARCHIVED`<br><br>During testing, set ads to a `PAUSED` status to avoid accidental spend. |
| `creative`  <br><br>AdCreative | The creative spec of the ad creative to be used by this ad.  <br>**Values:** `object_story_spec`, `product_set_id`, `use_page_actor_override`<br><br>Provide a creative spec:<br><br>```json
{
  "creative": {
    "name": "<NAME>",
    "object_story_spec": <SPEC>,
    "product_set_id": <PRODUCT_SET_ID>
  }
}
```<br><br>[Read more about creatives](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative). |

