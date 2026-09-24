<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative/multi-advertiser-ads | Saved: 2026-09-19 -->

# Multi-advertiser Ads



**Warning:** Multi-advertiser ads delivery will become `OPT-IN` by default beginning August 19, 2024. Partners will need to implement the multi-advertiser request in order to opt out of multi-advertiser ads. By default, Meta enrolls ads created on or after August 19 in multi-advertiser ads if they do not specify the `enroll_status` field within the `contextual_multi_ads` field.

Multi-advertiser ads show ads from multiple advertisers to people who are likely to continue shopping. Multi-advertiser ads are available for select placements on Facebook and Instagram. For more information, please visit the [Business Help Center](https://www.facebook.com/business/help/1024826868233885).

## API support for multi-advertiser ads

Multi-advertiser ads are supported in all versions of the Marketing API. Multi-advertiser ads support all campaign objectives and all ad formats across all available placements. The `enroll_status` field must be provided with either an `OPT_IN` or `OPT_OUT` value. Ads created on or after August 19, 2024 that do not specify the `enroll_status` field will be opted into multi-advertiser ads by default.

## Ad creation

### Request

```
curl -X POST \
  -F 'name="My creative title"' \
  -F 'object_story_spec={
       "page_id": "<PAGE_ID>",
       "link_data": {
         "link": "https://www.google.com",
         "image_hash": "<IMAGE_HASH>",
         "attachment_style": "link",
      }
     }' \
  -F 'contextual_multi_ads={
       "enroll_status": "OPT_IN"
     },'
  -F "access_token=<ACCESS_TOKEN>" \
   https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

For more details, see [Ad Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative#create_example).

### Parameters

| Name | Description |
| --- | --- |
| `contextual_multi_ads` | The `enroll_status` field can be set to `OPT_IN` or `OPT_OUT`. For more details, see [Ad Creative Features Details, Reference](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details). |

## Learn more

* **Business Help Center**
    * [About multi-advertiser ads](https://www.facebook.com/business/help/1024826868233885)  
* **Marketing API Reference**
    * [Ad Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative#fields)
    * [Ad Account Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/ads)
