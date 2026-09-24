<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/overview | Saved: 2026-09-19 -->

# Audiences Overview



Audience targeting helps you show your ads to the people you care about. There are two general approaches you can take when creating a target audience:

* **Specific** — You set a relatively strict set of parameters, and we create an audience within those parameters. This approach includes Custom Audiences, Lookalike Audiences, and Dynamic Audiences.
* **Broad** — You rely on our delivery system to find the best people to show your ad to. Provide basic restrictions, such as demographics or location, and we deliver ads to people who meet those attributes.

This document provides an overview of the audience targeting options offered by the Marketing API.

## Custom Audiences

**Warning:** Beginning September 2, 2025, we will start to roll out more proactive restrictions on custom audiences that may suggest information not permitted under our terms. For example, any custom audience or lookalike audience suggesting specific health conditions (e.g., "arthritis", "diabetes") or financial status (e.g., "credit score", "high income") will be flagged and prevented from being used to run ad campaigns.

**What these restrictions mean for your campaigns:**

* You won't be able to use flagged custom audiences when creating new campaigns.
* If you have an active campaign using flagged custom audiences, you should edit or pause it and choose a different audience to avoid performance and delivery issues.

**For API developers:**

* Beginning September 2, 2025, `operation_statu`s will return `471` to signal if your custom audiences have been flagged.

More information on this update and how to resolve flagged custom audiences can be found [here](https://www.facebook.com/business/help/1055828013359808).

A Custom Audience is an option that lets you create your own audience from a set of different sources, including customer lists, website, or app traffic, and engagement on Facebook.

Some audiences may require that you create [audience rules](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/audience-rules) to determine whether someone should be added to your Custom Audience.

### Permissions

The [`ads_management`](https://developers.facebook.com/docs/permissions/reference/ads_management) permission is required to create and update custom audiences.

### Custom audience types

#### [Customer File Custom Audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/custom-audiences)

Build target Custom Audiences from customer information. This includes email addresses, phone numbers, names, dates of birth, gender, locations, [App User IDs](https://developers.facebook.com/docs/graph-api/reference/user), [Page Scoped User IDs](https://developers.facebook.com/docs/app-events/bots-for-messenger), Apple's Advertising Identifier (IDFA), or [Android Advertising ID](https://developer.android.com/google/play-services/id.html).

#### [Engagement Custom Audiences](https://developers.facebook.com/docs/marketing-api/audiences-api/engagement)
Build audiences based on people who engaged with your content on Facebook or Instagram. Currently supported audience types include Page, Instagram business profile, Lead ad, and Instant Experiences ad.

#### [Mobile App Custom Audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/mobile-app-custom-audiences)
Build audiences based on peoples' actions in your app that meet your criteria. This solution uses logged named events through our [Facebook SDKs](https://developers.facebook.com/docs/app-ads/sdk), [App Events API](https://developers.facebook.com/docs/app-events), or via [Mobile Measurement Partners](https://developers.facebook.com/docs/app-ads/measuring/measurement-partners).

#### [Website Custom Audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/website-custom-audiences)
Create Custom Audiences of users who visited or took specific actions on your website using [Facebook Pixel](https://developers.facebook.com/docs/facebook-pixel), JavaScript [Tag API](https://developers.facebook.com/docs/ads-for-websites/tag-api), and audience rules. Once you create a Custom Audience with website data, reference it in ad targeting as you do with standard [Custom Audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience).

#### [Offline Custom Audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/offline-custom-audiences)
Group people who visited your store, made calls to your customer service, or took action offline together and target them with Facebook ads. Custom Audiences from Offline Conversions are based on conversion events uploaded to an Offline Event Set.

#### [Dynamic Audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/dynamic-product-audiences)
Dynamic Ads enables you to show people ads based on their cross-device purchasing intent. You can collect signals of user intent from mobile apps and websites then use this data to build an audience for targeting prospective customers.

#### [Lookalike Audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/lookalike-audiences)
Target people most like your already established customers. Lookalike audiences take several sets of people as "seeds" then Facebook builds an audience of similar people. You can use lookalikes for any business objective — targeting people similar to your customers for fan acquisition, site registration, off-Facebook purchases, coupon claims, or simply to drive awareness of a brand.

### Sharing a Custom Audience

You may choose to share your Custom Audience with another business, such as a partner managing and running your ads. There are specific requirements and APIs you should follow when doing so. Learn more about [Business-to-Business Functions](https://developers.facebook.com/docs/marketing-api/businessmanager/business-to-business).

### Custom Audiences Deletion {#custom-audiences-deletion}

For all advertisers beginning June 8, 2021, and going forward, we will automatically be moving audiences to the "Expiring Audience" stage once they have been inactive for over two years. This means that once an audience meets the threshold of not being used in an active ad set for over two years, it will be automatically flagged as an "Expiring Audience", and the `delete_time` field will be marked with the estimated deletion time (i.e., 90 days from the time of flagging) when the audience is scheduled to be deleted.

You will then be able to either proactively delete the audience or use the audience in an active ad set to prevent deletion. You can see which of your audiences are in the expiring stage at any time by filtering on their `operation_status` or `delete_time` fields.

For [Customer List Custom Audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/custom-audiences), specifically, you will need to provide us with your instructions before we take any action. Once audiences are moved to the "Expiring Audience" stage and flagged, you will need to provide your instructions by either using the flagged audience in an active ad set, which we will consider an instruction to retain the audience, or by deciding not to use the flagged audience in an active ad set, which we will consider an instruction to delete the audience.

#### Custom Audience
[**Endpoint:** `GET /{CUSTOM_AUDIENCE_ID}`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience)

The `operation_status` field of custom audiences now has an `EXPIRING` status option that will be added to audiences that have not been used in an active ad set the last 2 years. When an audience has been marked as expiring, the `delete_time` field tells you when the audience will be deleted.

**Example Response**

```
delete_time: 1620543600 // Unix time in secs for 9 May 2021
operation_status: {
  "status": 100
  "description": "If an audience hasn't been used in an active ad set for over 2 years, it will begin to expire. Expiring audiences that remain unused for 90 days will be deleted."
}
```

#### Ad Account
[**Endpoint:** `GET /act_{AD_ACCOUNT_ID]/customaudiences`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/customaudiences)

You can now filter custom audiences to see those that have an `operation_status` of `EXPIRING` or those that have a `delete_time` indicating the audience will be deleted soon. These new filters will return the audience IDs.

**Example Requests**

```
GET /act_217284683/customaudiences?filtering=[{"field":"delete_time","operator":"GREATER_THAN","value":0}]&fields=["name", "operation_status","delete_time"]

GET /act_217284683/customaudiences?filtering=[{"field":"operation_status.code","operator":"IN","value":[100]}]&fields=["name", "operation_status","delete_time"]']
```

**Endpoint:** `GET /act_{AD_ACCOUNT_ID}/saved_audiences`

You can now filter saved audiences by `delete_time` to see those that will be deleted soon. This filter returns the audience IDs.

**Example Request**

```
GET /act_217284683/saved_audiences?filtering=[{"field":"delete_time","operator":"GREATER_THAN","value":0}]
```

#### Saved Audiences
[**Endpoint:** `GET /{SAVED_AUDIENCE_ID}`](https://developers.facebook.com/docs/marketing-api/reference/saved-audience)

The `operation_status` field for saved audiences now has an `EXPIRING` status option that will be added to audiences that have not been used in an active ad set the last 2 years. When an audience has been marked as expiring, the `delete_time` field tells you when the audience will be deleted.

**Example Response**

```
delete_time: 1620543600 // Unix time in secs for 9 May 2021
operation_status: {
  "status": 100
  "description": "If an audience hasn't been used in an active ad set for over 2 years, it will begin to expire. Expiring audiences that remain unused for 90 days will be deleted."
}
```

#### FAQ

**Which audiences will be impacted by this change?**

Any Custom Audience, Lookalike Audience, or Saved Audience which has not been used in any active ad sets in over two years will be included in this update. **Note:** This is a rolling change going forward.

**Is there any action I can take to prevent my flagged audiences from being deleted on the planned deletion date?**

If you do not wish for the identified audiences to be deleted, you will be required to include the audiences marked as “Expiring Audience” in an active ad set prior to the deletion date shown in the `delete_time` field, which is 90 days after the audience is flagged, to keep it from being deleted.

For [Customer List Custom Audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/custom-audiences), specifically, you will need to provide us with your instructions by either using the flagged audience in an active ad set, which we will consider an instruction to retain the audience, or by deciding not to use the flagged audience in an active ad set, which we will consider an instruction to delete the audience.

**When does the system automatically delete an audience?**

The system will automatically delete the audience that has had an `EXPIRING` status for more than 90 days.

## Targeting

Targeting Specs are [ad set](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign) attributes that define who sees an ad. Basic or core targeting includes:

* [Demographics and Events](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/basic-targeting#demographics)
* [Location](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/basic-targeting#location)
* [Interests](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/basic-targeting#interests)
* [Behaviors](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/basic-targeting#behaviors)

Typically, you get data to define targeting from a [Targeting Search](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/targeting-search), then specify options in a [Targeting Spec](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/advanced-targeting). You must specify at least one country in targeting, unless you use [Custom Audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience).

**Note:** Advertisers running housing, employment, and credit ads, who are based in the United States or running ads targeted to the United States have different sets of restrictions. See [**Special Ad Category**](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/special-ad-category).

## See also

* [Help Center: Custom Audiences](https://www.facebook.com/business/help/744354708981227?id=2469097953376494)
* [Help Center: Lookalike Audiences](https://www.facebook.com/business/help/164749007013531?id=401668390442328)
