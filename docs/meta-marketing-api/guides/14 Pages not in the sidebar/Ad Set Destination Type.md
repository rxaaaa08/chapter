<!-- Source: https://developers.facebook.com/docs/marketing-api/adset/destination_type | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Ad Set Destination Type

Ad Set Destination Type is a field within the Meta Ads data model that defines where the user will be directed to after clicking on an ad. This could be a website, app, Instagram profile, WhatsApp conversation, or other destinations depending on the campaign objective and promotion type. Destination type is the same for all ads within an ad set.

Your chosen destination type must be consistent with your objective and optimization goal.

## Possible Destination Types

**Destination type is optional.** That means, not all objective and optimization goal combinations support call-to-action (CTA) button with destination type field. We use this [Campaign, Objective Validation](https://developers.facebook.com/docs/marketing-api/reference/ad-campaign-group#objective-validation) to validate if selected setting is compatible with chosen objective and optimization goal.

| Destination Type | Requirements |
| --- | --- |
| `UNDEFINED` | No defined destination type. Returned only in read mode if you have objectives that do not appear in the [Objectives table](#objectives) below. |
| `APP` | Ads in the ad set must provide an app ID in the promoted object. Destination is either an app installed on someone's phone or the app store if the app is not installed. |
| `APPLINKS_AUTOMATIC` | Used with Advantage+ catalog ads. The ad set's promoted object must have a `product_set_id` parameter. Facebook determines the displayed destination based on the `applink` specified in the ad creative. |
| `FACEBOOK` | Used with Advantage+ catalog ads. The catalog being promoted needs to support the on-Facebook Advantage+ catalog ads use case in Commerce Manager. All ads in the ad set must have an ad creative with Marketplace as the destination. This is currently only available for the Vehicle vertical. [Learn more](https://developers.facebook.com/docs/marketplace/vehicles/resources) |
| `INSTAGRAM_DIRECT` | Used when advertisers want users to send an Instagram direct message. |
| `INSTAGRAM_PROFILE` | Ads in profile on Instagram appear within the feed and reels feed view of public Instagram profiles that are over 18 years of age. When someone scrolls through content in their Instagram profile feed or on a profile's reels feed, they may see ads between pieces of content. |
| `MESSAGING_INSTAGRAM_DIRECT_MESSENGER` | Destination type for ad creative with Instagram direct or Messenger. |
| `MESSAGING_INSTAGRAM_DIRECT_MESSENGER_WHATSAPP` | Destination type for ad creative with Instagram direct or Messenger or WhatsApp. |
| `MESSAGING_INSTAGRAM_DIRECT_WHATSAPP` | Destination type for ad creative with Instagram direct or WhatsApp. |
| `MESSAGING_MESSENGER_WHATSAPP` | Destination type for ad creative with Messenger or WhatsApp. |
| `MESSENGER` | All ads in the ad set must have ad creative with Messenger as a destination. |
| `ON_AD` | The objective in the parent campaign must be in set {OUTCOME_LEADS} |
| `ON_POST` | The objective in the parent campaign must be in set {OUTCOME_ENGAGEMENTS} |
| `ON_VIDEO` | The objective in the parent campaign must be in set {OUTCOME_ENGAGEMENTS} |
| `ON_PAGE` | The objective in the parent campaign must be in set {OUTCOME_ENGAGEMENTS} |
| `ON_EVENT` | The objective in the parent campaign must be in set {OUTCOME_ENGAGEMENTS} |
| `PHONE_CALL` | Used with Shops Ads.<br> The objective in the parent campaign must be either `PRODUCT_CATALOG_SALES` or `CONVERSIONS`. |
| `SHOP_AUTOMATIC` | Used with Shops Ads.<br> The objective in the parent campaign must be either `PRODUCT_CATALOG_SALES` or `CONVERSIONS`. |
| `WEBSITE` | All ads in the ad set must have ad creative with at least one valid, external URL. |
| `WHATSAPP` | All ads in the ad set must have ad creative with Whatsapp as a destination. |

## Objectives

Old objectives have been deprecated with [Marketing API v17.0](https://developers.facebook.com/docs/graph-api/changelog/version17.0#marketing-api). Please refer to the [Outcome-Driven Ads Experiences mapping table](https://developers.facebook.com/docs/marketing-api/reference/ad-campaign-group#odax-mapping) to find the old and new objectives and their corresponding destination types, optimization goals and promoted objects.

| Objective | Available Destination Types |
| --- | --- |
| `OUTCOME_AWARENESS` | `UNDEFINED`, `WEBSITE`, `MESSENGER`, `WHATSAPP`, `MESSAGING_INSTAGRAM_DIRECT_MESSENGER`, `MESSAGING_INSTAGRAM_DIRECT_MESSENGER_WHATSAPP`, `MESSAGING_INSTAGRAM_DIRECT_WHATSAPP`, `MESSAGING_MESSENGER_WHATSAPP`, `INSTAGRAM_DIRECT` |
| `OUTCOME_TRAFFIC` | `UNDEFINED`, `MESSENGER`, `WHATSAPP`, `PHONE_CALL` |
| `OUTCOME_ENGAGEMENT` | `UNDEFINED`, `MESSENGER`, `WHATSAPP`, `PHONE_CALL`, `INSTAGRAM_DIRECT`, `MESSAGING_INSTAGRAM_DIRECT_MESSENGER`, `MESSAGING_INSTAGRAM_DIRECT_MESSENGER_WHATSAPP`, `MESSAGING_INSTAGRAM_DIRECT_WHATSAPP`, `MESSAGING_MESSENGER_WHATSAPP`, `ON_POST`, `ON_EVENT`, `ON_VIDEO`, `ON_VIDEO`,`ON_PAGE` |
| `OUTCOME_APP_PROMOTION` | `UNDEFINED` |
| `OUTCOME_LEADS` | `ON_AD`, `LEAD_FROM_MESSENGER`, `LEAD_FROM_IG_DIRECT`, `PHONE_CALL`, `UNDEFINED`, `WEBSITE`, `APP` |
| `OUTCOME_SALES` | `WEBSITE`, `MESSENGER`, `PHONE_CALL` |

## Create an Ad Set for an On-Facebook Traffic Destination

Advertisers can drive traffic to on-Facebook listings as a destination for their product catalog sales campaigns instead of external websites. These ads drive awareness of car inventory with multiple placement options. [Learn more about Automotive Inventory Ads with an on-Facebook destination](https://www.facebook.com/business/help/1940957349379686).

To create an ad set that leverages [Automotive Inventory Ads with an on-Facebook destination](https://www.facebook.com/business/help/1940957349379686), specify a `destination_type` of `FACEBOOK` in your ad set data.

```
-F 'destination_type="FACEBOOK"' \
```

If customizing placements, a `destination_type` of `FACEBOOK` supports:

* `publisher_platforms` — `facebook` and `instagram`
* `facebook_positions` — `feed`, `marketplace`, `search`, `story`, and `right_hand_column`
* `instagram_positions` — `stream`, `explore`, and `story`

If you don’t specify a `destination_type`, your the default destination is the website URL specified in your catalog.

## Learn More

* Marketplace: [Vehicles - Additional Resources](https://developers.facebook.com/docs/marketplace/vehicles/resources)
* Business Help Center: [About Advantage+ Catalog Ads with an On-Facebook Destination](https://www.facebook.com/business/help/1940957349379686)
* Business Help Center: [Set Up a Advantage+ Catalog Ads Campaign with an On-Facebook Destination](https://www.facebook.com/business/help/230418171375635)
* [Campaign, Objective Validation](https://developers.facebook.com/docs/marketing-api/reference/ad-campaign-group#objective-validation)
