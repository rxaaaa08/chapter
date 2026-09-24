<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-promoted-object | Saved: 2026-09-19 -->

# Ad Set, Promoted Object



The object an ad set promotes, such as a Page  or app. The campaign's `objective` and the ad set's `promoted_object` provide intent for your ads. When you create ad sets for campaigns with the certain objectives, `promoted_object` is required. See [Ad Set, Creating](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign#Creating).

### Requirements

- You must have permissions for objects you promote, including `page_id`, `application_id`, and `pixel_id`

- If you use `page_id`, the creative must promote that `page_id`

- If you use `pixel_id`, you must provide `custom_event_type`

- If you use `object_store_url`, you must include `application_id`. This option is only available in [Ads Manager](https://www.facebook.com/ads/manager).

- `object_store_url` MUST be associated with that app. You can configure this under your [app settings](https://developers.facebook.com/apps).

- Mobile device targeting for the ad set must match supported platforms for your specified app.

- The ad creative must link to the specified `object_store_url`.

### Limitations

If you use `promoted_object`:

- `promoted_object` is **immutable** in most cases. It is set on creation and cannot be changed. To promote a different object, create a new ad set. The exceptions are:

- Adding `application_id` or `product_catalog_id` if not already given

- Changing `pixel_id`, `pixel_rule` or `custom_event_type` to a new value when the following objectives and optimization goals are set:

- `CONVERSIONS`, `PRODUCT_CATALOG_SALES`

- `OFFSITE_CONVERSIONS`

- You cannot set `promoted_object`  for existing ad sets. You must create a new ad set except for the exceptions above.

- If `promoted_object` is specified, Facebook automaticallly infers `conversion_specs` for your specified objectives. You cannot manually configure `conversion_specs`; we ignore any value you pass.

- You can update all ad fields for existing ads in a legacy ad set without a `promoted_object` set.

## Reading

Promoted Object describes the object an ad set is promoting,    such as the Page in a Page Like campaign. It is a generalized way of    specifying a broad range of objects which are related to advertising    objectives.<br><br>    Taken together, the campaign's objective and the ad set's    promoted_object should be enough to answer the question: "What is this    ad set/campaign all about?". For example, "This campaign is meant to    get more page likes for my Page X", or "This ad set is driving mobile    app installs for my app Y".

#### Parameters

This endpoint doesn't have any parameters.

#### Fields

| Field | Description |
| --- | --- |
| `application_id`<br><br>*numeric string* | The ID of a Facebook Application. Usually related to mobile or canvas games being promoted on Facebook for installs or engagement<br><br><br>**[default]**<br> |
| `boosted_product_set_id`<br><br>*numeric string* | Combined with “product_set_id” to promote a specific Product Set while including other products from the Product Catalog in ads. Use the All Products Product Set ID in the “product_set_id” field and the specific Product Set ID in the “boosted_product_set_id” field. This will ensure products from the set are shown more often compared to other products from the Product Catalog.<br><br><br>**[default]**<br> |
| `conversion_goal_id`<br><br>*numeric string* | The ID of conversion goal used for conversion specs and tracking specs generation<br><br><br>**[default]**<br> |
| `custom_conversion_id`<br><br>*numeric string* | The ID of a Custom Conversion.<br><br><br>**[default]**<br> |
| `custom_event_str`<br><br>*string* | The event from an App Event of a mobile app, which is not in the standard event list.<br><br><br>**`custom_event_type = OTHER` is required**<br><br><br>**[default]**<br> |
| `custom_event_type`<br><br>*enum {AD_IMPRESSION, RATE, TUTORIAL_COMPLETION, CONTACT, CUSTOMIZE_PRODUCT, DONATE, FIND_LOCATION, SCHEDULE, START_TRIAL, SUBMIT_APPLICATION, SUBSCRIBE, ADD_TO_CART, ADD_TO_WISHLIST, INITIATED_CHECKOUT, ADD_PAYMENT_INFO, PURCHASE, LEAD, COMPLETE_REGISTRATION, CONTENT_VIEW, SEARCH, SERVICE_BOOKING_REQUEST, MESSAGING_CONVERSATION_STARTED_7D, LEVEL_ACHIEVED, ACHIEVEMENT_UNLOCKED, SPENT_CREDITS, LISTING_INTERACTION, D2_RETENTION, D7_RETENTION, OTHER}* | The event from an App Event of a mobile app,<br>(Purchase, Lead or CompleteRegistration) event from<br>Offline Conversion data, or `tag` of an<br>[conversion pixel](https://developers.facebook.com/docs/marketing-api/offsite-pixels).<br><br><br>**[default]**<br> |
| `event_id`<br><br>*numeric string* | The ID of a Facebook Event<br><br><br>**[default]**<br> |
| `lead_ads_custom_event_str`<br><br>*string* | lead_ads_custom_event_str<br><br><br>**[default]**<br> |
| `lead_ads_custom_event_type`<br><br>*enum {AD_IMPRESSION, RATE, TUTORIAL_COMPLETION, CONTACT, CUSTOMIZE_PRODUCT, DONATE, FIND_LOCATION, SCHEDULE, START_TRIAL, SUBMIT_APPLICATION, SUBSCRIBE, ADD_TO_CART, ADD_TO_WISHLIST, INITIATED_CHECKOUT, ADD_PAYMENT_INFO, PURCHASE, LEAD, COMPLETE_REGISTRATION, CONTENT_VIEW, SEARCH, SERVICE_BOOKING_REQUEST, MESSAGING_CONVERSATION_STARTED_7D, LEVEL_ACHIEVED, ACHIEVEMENT_UNLOCKED, SPENT_CREDITS, LISTING_INTERACTION, D2_RETENTION, D7_RETENTION, OTHER}* | lead_ads_custom_event_type<br><br><br>**[default]**<br> |
| `lead_ads_form_event_source_type`<br><br>*enum* | lead_ads_form_event_source_type<br><br><br>**[default]**<br> |
| `lead_ads_offsite_conversion_type`<br><br>*enum* | lead_ads_offsite_conversion_type<br><br><br>**[default]**<br> |
| `mcme_conversion_id`<br><br>*numeric string* | mcme_conversion_id<br><br><br>**[default]**<br> |
| `object_store_url`<br><br>*string* | The uri of the mobile / digital store where an application can be bought / downloaded. This is platform specific. When combined with the "application_id" this uniquely specifies an object which can be the subject of a Facebook advertising campaign.<br><br><br>**[default]**<br> |
| `offer_id`<br><br>*numeric string* | The ID of an Offer from a Facebook Page.<br><br><br>**[default]**<br> |
| `offline_conversion_data_set_id`<br><br>*numeric string* | The ID of the offline dataset.<br><br><br>**[default]**<br> |
| `offsite_conversion_event_id`<br><br>*numeric string* | offsite_conversion_event_id<br><br><br>**[default]**<br> |
| `page_id`<br><br>*numeric string* | The ID of a Facebook Page<br><br><br>**[default]**<br> |
| `pixel_aggregation_rule`<br><br>*string* | A JSON rule that will decide whether an action from a pixel matches this promoted object spec based on aggregated results from previous pixel fires.<br><br><br>**[default]**<br> |
| `pixel_id`<br><br>*numeric string* | The ID of a Facebook conversion pixel.  Used with offsite conversion campaigns.<br><br><br>**[default]**<br> |
| `pixel_rule`<br><br>*string* | A JSON rule that will decide whether an action from a pixel matches this promoted object spec<br><br><br>**[default]**<br> |
| `place_page_set_id`<br><br>*numeric string* | The ID of a Place Page Set for Dynamic Local Ads.<br><br><br>**[default]**<br> |
| `product_catalog_id`<br><br>*numeric string* | The ID of a Product Catalog. Used with<br>[Dynamic Product Ads](https://developers.facebook.com/docs/marketing-api/dynamic-product-ads).<br><br><br>**[default]**<br> |
| `product_set_id`<br><br>*numeric string* | The ID of a Product Set within an Ad Set level Product<br>Catalog. Used with<br>[Dynamic Product Ads](https://developers.facebook.com/docs/marketing-api/dynamic-product-ads).<br><br><br>**[default]**<br> |
| `product_set_optimization`<br><br>*enum* | product_set_optimization<br><br><br>**[default]**<br> |
| `retention_days`<br><br>*string* | Value for retention period for aggregation based rule for the promoted object.<br><br><br>**[default]**<br> |
| `value_semantic_type`<br><br>*enum* | The semantic of the event value to be using for optimization<br><br><br>**[default]**<br> |
| `variation`<br><br>*enum* | variation<br><br><br>**[default]**<br> |
| `whats_app_business_phone_number_id`<br><br>*numeric string* | The ID of the associated WhatsApp business phone number for this promoted ad. It's of type WhatsAppBusinessAccountToNumberCurrentStatus.<br><br><br>**[default]**<br> |
| `whatsapp_phone_number`<br><br>*numeric string* | The WhatsApp phone number for this promoted ad.<br><br><br>**[default]**<br> |

## Creating

When you create ad sets in campaigns with the certain objectives, you must provide `promoted_object`. See [Ad Set, Creating](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign#Creating).

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

