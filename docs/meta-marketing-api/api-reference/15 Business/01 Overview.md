<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business | Saved: 2026-09-19 -->

# Business



Represent a specific business on Facebook. Make the API call to the business ID.

To find the ID of a business, go to [**Business Manager**](https://business.facebook.com/) > **Business Settings** > **Business Info**. There, you will see information about the business, including the ID.  

## Reading

Represents a business on Facebook. Includes any specified properties and assets belonging to the business.

#### Example

### HTTP
```
GET /v25.0/{business-id} HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{business-id}',
    '{access-token}'
  );
} catch(Facebook\Exceptions\FacebookResponseException $e) {
  echo 'Graph returned an error: ' . $e->getMessage();
  exit;
} catch(Facebook\Exceptions\FacebookSDKException $e) {
  echo 'Facebook SDK returned an error: ' . $e->getMessage();
  exit;
}
$graphNode = $response->getGraphNode();
/* handle the result */
```

### JavaScript SDK
```
/* make the API call */
FB.api(
    "/{business-id}",
    function (response) {
      if (response && !response.error) {
        /* handle the result */
      }
    }
);
```

### Android SDK
```
/* make the API call */
new GraphRequest(
    AccessToken.getCurrentAccessToken(),
    "/{business-id}",
    null,
    HttpMethod.GET,
    new GraphRequest.Callback() {
        public void onCompleted(GraphResponse response) {
            /* handle the result */
        }
    }
).executeAsync();
```

### iOS SDK
```
/* make the API call */
FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc]
                               initWithGraphPath:@"/{business-id}"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bbusiness-id%7D&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

This endpoint doesn't have any parameters.

#### Fields

| Field | Description |
| --- | --- |
| `id`<br><br>*numeric string* | The business account ID.<br><br><br>**[default]**<br> |
| `block_offline_analytics`<br><br>*bool* | Specifies whether offline analytics for business is blocked.<br> |
| `collaborative_ads_managed_partner_business_info`<br><br>*[ManagedPartnerBusiness](https://developers.facebook.com/docs/graph-api/reference/managed-partner-business)* | collaborative_ads_managed_partner_business_info<br> |
| `collaborative_ads_managed_partner_eligibility`<br><br>*BusinessManagedPartnerEligibility* | collaborative_ads_managed_partner_eligibility<br> |
| `created_by`<br><br>*BusinessUser\|SystemUser* | The creator of this business.<br> |
| `created_time`<br><br>*datetime* | The creation time of this business.<br> |
| `extended_updated_time`<br><br>*datetime* | The update time of the extended credits for this business.<br> |
| `is_hidden`<br><br>*bool* | If `true`, indicates the business is hidden.<br> |
| `link`<br><br>*string* | URI for business profile page.<br> |
| `marketing_messages_onboarding_status`<br><br>*MarketingMessagesOnboardingStatus* | marketing_messages_onboarding_status<br> |
| `name`<br><br>*string* | The name of the business.<br><br><br>**[default]**<br> |
| `payment_account_id`<br><br>*numeric string* | The ID for the payment account of this business.<br> |
| `primary_page`<br><br>*[Page](https://developers.facebook.com/docs/graph-api/reference/page)* | The primary Facebook Page for this business.<br> |
| `profile_picture_uri`<br><br>*string* | The profile picture URI of the business.<br> |
| `timezone_id`<br><br>*unsigned int32* | This business's timezone.<br> |
| `two_factor_type`<br><br>*enum* | The two factor type authentication used for this business.<br> |
| `updated_by`<br><br>*BusinessUser\|SystemUser* | The person's name who last updated this business.<br> |
| `updated_time`<br><br>*datetime* | The time when this business was last updated.<br> |
| `verification_status`<br><br>*enum {expired, failed, ineligible, not_verified, pending, pending_need_more_info, pending_submission, rejected, revoked, verified}* | Verification status for this business.<br> |
| `vertical`<br><br>*string* | The vertical industry that this business associates with, or belongs to.<br> |
| `vertical_id`<br><br>*unsigned int32* | The ID for the vertical industry.<br> |
| `whatsapp_business_manager_messaging_limit`<br><br>*enum {TIER_100K, TIER_10K, TIER_250, TIER_2K, TIER_UNLIMITED, UNTIERED}* | Maximum number of unique WhatsApp user phone numbers that your Business Manager account can message, outside of a customer service window, within a moving 24-hour period. This limit is shared across all WhatsApp phone numbers owned by your business.<br> |

#### Edges

| Edge | Description |
| --- | --- |
| [`ad_studies`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/ad_studies)<br><br>*Edge<AdStudy>* | The studies this business has access to, such as any advertising lift studies or split testing studies.<br> |
| [`adnetworkanalytics_results`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/adnetworkanalytics_results)<br><br>*Edge<AdNetworkAnalyticsAsyncQueryResult>* | Obtain the results of an asynchronous Audience Network query for this publisher entity.<br> |
| [`ads_reporting_mmm_reports`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/ads_reporting_mmm_reports)<br><br>*Edge<AdsReportBuilderMMMReport>* | Marketing mix modeling (MMM) reports generated for this business<br> |
| [`ads_reporting_mmm_schedulers`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/ads_reporting_mmm_schedulers)<br><br>*Edge<AdsReportBuilderMMMReportScheduler>* | Marketing mix modeling (MMM) reports schedulers for this business<br> |
| [`adspixels`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/adspixels)<br><br>*Edge<AdsPixel>* | The business has access to these pixels.<br> |
| [`agencies`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/agencies)<br><br>*Edge<Business>* | Agencies associated with this business.<br> |
| [`an_placements`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/an_placements)<br><br>*Edge<AdPlacement>* | Placements used by this Audience Network business.<br> |
| [`business_asset_groups`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/business_asset_groups)<br><br>*Edge<BusinessAssetGroup>* | Business asset groups owned by this business. The business can grant permissions to assets in this group.<br> |
| [`business_invoices`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/business_invoices)<br><br>*Edge<OmegaCustomerTrx>* | The extended credit invoices of this business.<br> |
| [`business_users`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/business_users)<br><br>*Edge<BusinessUser>* | Business users associated with this business. Includes employees and admins at the business.<br> |
| [`client_apps`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/client_apps)<br><br>*Edge<Application>* | This business has access to these client apps.<br> |
| [`client_instagram_assets`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/client_instagram_assets)<br><br>*Edge<InstagramBusinessAsset>* | This business has access to these client Instagram assets.<br> |
| [`client_offsite_signal_container_business_objects`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/client_offsite_signal_container_business_objects)<br><br>*Edge<OffsiteSignalContainerBusinessObject>* | The business has access to these client offsite signal container business objects<br> |
| [`client_pages`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/client_pages)<br><br>*Edge<Page>* | This business has access to these client pages.<br> |
| [`client_pixels`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/client_pixels)<br><br>*Edge<AdsPixel>* | This business has access to these client pixels.<br> |
| [`client_product_catalogs`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/client_product_catalogs)<br><br>*Edge<ProductCatalog>* | This business has access to these client product catalogs.<br> |
| [`client_whatsapp_business_accounts`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/client_whatsapp_business_accounts)<br><br>*Edge<WhatsAppBusinessAccount>* | WhatsApp business accounts that were shared to this business.<br> |
| [`clients`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/clients)<br><br>*Edge<Business>* | Clients of this business.<br> |
| [`collaborative_ads_collaboration_requests`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/collaborative_ads_collaboration_requests)<br><br>*Edge<CPASCollaborationRequest>* | All [Collaborative Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads#collaborative-ads). collaboration requests initiated by the business.<br> |
| [`collaborative_ads_suggested_partners`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/collaborative_ads_suggested_partners)<br><br>*Edge<CPASAdvertiserPartnershipRecommendation>* | [Collaborative Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads#collaborative-ads) suggested partners for a business.<br> |
| [`commerce_merchant_settings`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/commerce_merchant_settings)<br><br>*Edge<CommerceMerchantSettings>* | Commerce Merchant Settings belonging to this business.<br> |
| [`event_source_groups`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/event_source_groups)<br><br>*Edge<EventSourceGroup>* | The business owns these event source groups. Includes various signals sources such as pixels.<br> |
| [`extendedcredits`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/extendedcredits)<br><br>*Edge<ExtendedCredit>* | Extended credits for this business.<br> |
| [`initiated_audience_sharing_requests`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/initiated_audience_sharing_requests)<br><br>*Edge<BusinessAssetSharingAgreement>* | The audience sharing requests initiated by this business.<br> |
| [`instagram_accounts`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/instagram_accounts)<br><br>*Edge<ShadowIGUser>* | This business has access to these Instagram accounts.<br> |
| [`instagram_business_accounts`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/instagram_business_accounts)<br><br>*Edge<ShadowIGUser>* | Instagram accounts already converted into business accounts. These accounts have an associated business user.<br> |
| [`managed_partner_ads_funding_source_details`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/managed_partner_ads_funding_source_details)<br><br>*Edge<FundingSourceDetailsCoupon>* | managed_partner_ads_funding_source_details<br> |
| [`openbridge_configurations`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/openbridge_configurations)<br><br>*Edge<OpenBridgeConfiguration>* | Get all the openbridge configurations associated to this business<br> |
| [`owned_apps`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/owned_apps)<br><br>*Edge<Application>* | This business owns these apps.<br> |
| [`owned_businesses`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/owned_businesses)<br><br>*Edge<Business>* | This business aggregates and manages these client businesses.<br> |
| [`owned_instagram_accounts`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/owned_instagram_accounts)<br><br>*Edge<ShadowIGUser>* | This business owns these Instagram accounts.<br> |
| [`owned_instagram_assets`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/owned_instagram_assets)<br><br>*Edge<InstagramBusinessAsset>* | This business owns these Instagram Business Assets<br> |
| [`owned_offsite_signal_container_business_objects`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/owned_offsite_signal_container_business_objects)<br><br>*Edge<OffsiteSignalContainerBusinessObject>* | owned_offsite_signal_container_business_objects<br> |
| [`owned_pages`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/owned_pages)<br><br>*Edge<Page>* | This business owns these pages.<br> |
| [`owned_pixels`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/owned_pixels)<br><br>*Edge<AdsPixel>* | This business owns these pixels.<br> |
| [`owned_product_catalogs`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/owned_product_catalogs)<br><br>*Edge<ProductCatalog>* | This business owns these product catalogs.<br> |
| [`owned_whatsapp_business_accounts`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/owned_whatsapp_business_accounts)<br><br>*Edge<WhatsAppBusinessAccount>* | This business owns these WhatsApp Business Accounts.<br> |
| [`pending_client_ad_accounts`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/pending_client_ad_accounts)<br><br>*Edge<BusinessAdAccountRequest>* | This business requested access to these client ad accounts and is pending approval.<br> |
| [`pending_client_apps`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/pending_client_apps)<br><br>*Edge<BusinessApplicationRequest>* | This business requested access to these client apps and is pending approval.<br> |
| [`pending_client_pages`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/pending_client_pages)<br><br>*Edge<BusinessPageRequest>* | This business requested access to these client pages and is pending approval.<br> |
| [`pending_owned_ad_accounts`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/pending_owned_ad_accounts)<br><br>*Edge<BusinessAdAccountRequest>* | This business requested ownership of these ad accounts and is pending approval.<br> |
| [`pending_owned_pages`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/pending_owned_pages)<br><br>*Edge<BusinessPageRequest>* | This business requested ownership of these pages and is pending approval.<br> |
| [`pending_shared_offsite_signal_container_business_objects`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/pending_shared_offsite_signal_container_business_objects)<br><br>*Edge<OffsiteSignalContainerBusinessObject>* | This business received sharing requests for these offsite signal container business objects and is pending for approval.<br> |
| [`pending_users`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/pending_users)<br><br>*Edge<BusinessRoleRequest>* | Admin for this business invited this user to the business. Pending user approval.<br> |
| [`preverified_numbers`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/preverified_numbers)<br><br>*Edge<WhatsAppBusinessPreVerifiedPhoneNumber>* | Edge to get list of all pre-created phone numbers for this business<br> |
| [`received_audience_sharing_requests`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/received_audience_sharing_requests)<br><br>*Edge<BusinessAssetSharingAgreement>* | The audience sharing requests received by this business.<br> |
| [`reseller_guidances`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/reseller_guidances)<br><br>*Edge<ResellerGuidance>* | Guidance for a China reseller business.<br> |
| [`self_certified_whatsapp_business_submissions`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/self_certified_whatsapp_business_submissions)<br><br>*Edge<WhatsAppBusinessPartnerClientVerificationSubmission>* | Business Service Providers can submit their client information for verification on WhatsApp Business Platform. This endpoint returns statuses, submitted info, and rejection reasons for the submissions.<br> |
| [`system_users`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/system_users)<br><br>*Edge<SystemUser>* | The business's system users.<br> |

#### Error Codes

| Error Code | Description |
| --- | --- |
| 104 | Incorrect signature |
| 100 | Invalid parameter |
| 190 | Invalid OAuth 2.0 Access Token |
| 200 | Permissions error |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |
| 80004 | There have been too many calls to this ad-account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting#ads-management. |
| 2500 | Error parsing graph query |
| 2616 | The reporting data you are trying to fetch has too many rows. Please pull data for shorter time periods or use filters to restrict the number of ad IDs |

## Creating

**Note:** To create other Business Managers, your business needs to obtain `BUSINESS_MANAGEMENT` during the [app review process](https://developers.facebook.com/docs/apps/review). If your app is in development mode, you can surpass this requirement, but to create only two child businesses.

### /{user_id}/businesses
You can make a POST request to *businesses* edge from the following paths:

- [/{user_id}/businesses](https://developers.facebook.com/docs/graph-api/reference/user/businesses)

When posting to this edge, a [Business](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business) will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `child_business_external_id`<br><br>*string* | child_business_external_id<br> |
| `email`<br><br>*string* | The business email of the business admin<br> |
| `name`<br><br>*string* | Username<br><br>**[required]**<br> |
| `primary_page`<br><br>*numeric string* | Primary Page ID<br> |
| `sales_rep_email`<br><br>*string* | Sales Rep email address<br> |
| `survey_business_type`<br><br>*enum {AGENCY, ADVERTISER, APP_DEVELOPER, PUBLISHER}* | Business Type<br> |
| `survey_num_assets`<br><br>*int64* | Number of Assets in the business<br> |
| `survey_num_people`<br><br>*int64* | Number of People that will work on the business<br> |
| `timezone_id`<br><br>*enum {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285, 286, 287, 288, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298, 299, 300, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318, 319, 320, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346, 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 363, 364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386, 387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 419, 420, 421, 422, 423, 424, 425, 426, 427, 428, 429, 430, 431, 432, 433, 434, 435, 436, 437, 438, 439, 440, 441, 442, 443, 444, 445, 446, 447, 448, 449, 450, 451, 452, 453, 454, 455, 456, 457, 458, 459, 460, 461, 462, 463, 464, 465, 466, 467, 468, 469, 470, 471, 472, 473, 474, 475, 476, 477, 478, 479, 480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493, 494, 495, 496, 497, 498, 499, 500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 512, 513, 514, 515, 516, 517, 518, 519, 520, 521, 522, 523, 524, 525, 526, 527, 528, 529, 530, 531, 532, 533, 534, 535, 536, 537, 538, 539, 540, 541, 542, 543, 544, 545, 546, 547, 548, 549, 550, 551, 552, 553, 554, 555, 556, 557, 558, 559, 560, 561, 562, 563, 564, 565, 566, 567, 568, 569, 570, 571, 572, 573, 574, 575, 576, 577, 578, 579, 580, 581, 582, 583, 584, 585, 586, 587, 588, 589, 590, 591, 592}* | Timezone ID<br> |
| `vertical`<br><br>*enum {NOT_SET, ADVERTISING, AUTOMOTIVE, CONSUMER_PACKAGED_GOODS, ECOMMERCE, EDUCATION, ENERGY_AND_UTILITIES, ENTERTAINMENT_AND_MEDIA, FINANCIAL_SERVICES, GAMING, GOVERNMENT_AND_POLITICS, MARKETING, ORGANIZATIONS_AND_ASSOCIATIONS, PROFESSIONAL_SERVICES, RETAIL, TECHNOLOGY, TELECOM, TRAVEL, NON_PROFIT, RESTAURANT, HEALTH, LUXURY, OTHER}* | Vertical ID<br><br>**[required]**<br> |

#### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node represented by *id* in the return type.

```
Struct  {
id: numeric string,
name: string,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |
| 3912 | There was a technical issue and the changes you made to your Business Manager weren't saved. Please try again. |
| 3918 | The Facebook Page you've tried to add is already owned by another Business Manager. You can still request access to this Page, but your request will need to be approved by the Business Manager that owns it. |
| 3974 | The name you chose for this Business Manager is not valid. Try a different name. |
| 3947 | You are trying to create a Business Manager with the same name as one you are already a part of. Please pick a different name. |
| 200 | Permissions error |
| 3973 | The name you chose for this Business Manager is not valid. Please choose another. |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |

### /{business_id}/owned_businesses
You can make a POST request to *owned_businesses* edge from the following paths:

- [/{business_id}/owned_businesses](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/owned_businesses)

When posting to this edge, a [Business](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business) will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `child_business_external_id`<br><br>*string* | (Optional) An external id that allows you to specify a key for your app to identify the child business. You should query for child businesses using this id because the list API is indexed on this field.<br> |
| `name`<br><br>*string* | (Required) Name of entity for displaying.  It should match the public name of your business or organization, since it will be visible across Meta. It can't contain special characters.<br><br>**[required]**<br> |
| `page_permitted_tasks` This field is only accessible in v3.3 or later.<br><br>*array<enum {MANAGE, CREATE_CONTENT, MODERATE, MESSAGING, ADVERTISE, ANALYZE, MODERATE_COMMUNITY, MANAGE_JOBS, PAGES_MESSAGING, PAGES_MESSAGING_SUBSCRIPTIONS, READ_PAGE_MAILBOXES, VIEW_MONETIZATION_INSIGHTS, MANAGE_LEADS, PROFILE_PLUS_FULL_CONTROL, PROFILE_PLUS_MANAGE, PROFILE_PLUS_FACEBOOK_ACCESS, PROFILE_PLUS_CREATE_CONTENT, PROFILE_PLUS_MODERATE, PROFILE_PLUS_MODERATE_DELEGATE_COMMUNITY, PROFILE_PLUS_MESSAGING, PROFILE_PLUS_ADVERTISE, PROFILE_PLUS_ANALYZE, PROFILE_PLUS_REVENUE, PROFILE_PLUS_MANAGE_LEADS, CASHIER_ROLE, GLOBAL_STRUCTURE_MANAGEMENT, PROFILE_PLUS_GLOBAL_STRUCTURE_MANAGEMENT}>* | (Required) page_permitted_tasks<br> |
| `shared_page_id`<br><br>*numeric string* | (Required) shared_page_id<br> |
| `timezone_id`<br><br>*enum {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285, 286, 287, 288, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298, 299, 300, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318, 319, 320, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346, 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 363, 364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386, 387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 419, 420, 421, 422, 423, 424, 425, 426, 427, 428, 429, 430, 431, 432, 433, 434, 435, 436, 437, 438, 439, 440, 441, 442, 443, 444, 445, 446, 447, 448, 449, 450, 451, 452, 453, 454, 455, 456, 457, 458, 459, 460, 461, 462, 463, 464, 465, 466, 467, 468, 469, 470, 471, 472, 473, 474, 475, 476, 477, 478, 479, 480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493, 494, 495, 496, 497, 498, 499, 500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 512, 513, 514, 515, 516, 517, 518, 519, 520, 521, 522, 523, 524, 525, 526, 527, 528, 529, 530, 531, 532, 533, 534, 535, 536, 537, 538, 539, 540, 541, 542, 543, 544, 545, 546, 547, 548, 549, 550, 551, 552, 553, 554, 555, 556, 557, 558, 559, 560, 561, 562, 563, 564, 565, 566, 567, 568, 569, 570, 571, 572, 573, 574, 575, 576, 577, 578, 579, 580, 581, 582, 583, 584, 585, 586, 587, 588, 589, 590, 591, 592}* | timezone_id<br> |

#### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node represented by *id* in the return type.

```
Struct  {
id: numeric string,
name: string,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 200 | Permissions error |
| 3913 | It doesn't look like you have permission to create a new Business Manager. |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |
| 100 | Invalid parameter |
| 3947 | You are trying to create a Business Manager with the same name as one you are already a part of. Please pick a different name. |
| 3974 | The name you chose for this Business Manager is not valid. Try a different name. |

### /{business_id}/china_business_onboarding_attributions
You can make a POST request to *china_business_onboarding_attributions* edge from the following paths:

- [/{business_id}/china_business_onboarding_attributions](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/china_business_onboarding_attributions)

When posting to this edge, a [Business](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business) will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `advertiser_identifier`<br><br>*string* | [Optional] Advertiser identifiers used to analyze the customer acquisition lifecycle<br> |
| `csi`<br><br>*string* | [Optional] Meta generated tracking id<br> |
| `update_token_id`<br><br>*numeric string* | [Optional] ID for the OE Token to be updated. Providing this ID value will result in updating the existing OE Token instead of creating a new OE Token<br> |
| `utm`<br><br>*string* | [Optional] Marketing campaign name<br> |

#### Return Type

```
Struct  {
id: numeric string,
link_with_id: string,
utm: string,
csi: string,
advertiser_identifier: string,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 200 | Permissions error |

## Updating

### /{business_id}
You can update a [Business](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business) by making a POST request to [/{business_id}](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business).

#### Parameters

| Parameter | Description |
| --- | --- |
| `entry_point`<br><br>*string* | entry point of claiming BusinessClaimAssetEntryPoint<br> |
| `name`<br><br>*string* | Business's name<br> |
| `primary_page`<br><br>*numeric string or integer* | Primary page of this business<br> |
| `timezone_id`<br><br>*int64* | Timezone id of this business<br> |
| `two_factor_type`<br><br>*enum{none, admin_required, all_required}* | Two-factor type of the business<br> |
| `vertical`<br><br>*enum {NOT_SET, ADVERTISING, AUTOMOTIVE, CONSUMER_PACKAGED_GOODS, ECOMMERCE, EDUCATION, ENERGY_AND_UTILITIES, ENTERTAINMENT_AND_MEDIA, FINANCIAL_SERVICES, GAMING, GOVERNMENT_AND_POLITICS, MARKETING, ORGANIZATIONS_AND_ASSOCIATIONS, PROFESSIONAL_SERVICES, RETAIL, TECHNOLOGY, TELECOM, TRAVEL, NON_PROFIT, RESTAURANT, HEALTH, LUXURY, OTHER}* | Vertical type of the business<br> |

#### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node represented by *id* in the return type.

```
Struct  {
id: numeric string,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 3974 | The name you chose for this Business Manager is not valid. Try a different name. |
| 3918 | The Facebook Page you've tried to add is already owned by another Business Manager. You can still request access to this Page, but your request will need to be approved by the Business Manager that owns it. |
| 3911 | You need permission to set up a new Business Manager. |
| 3910 | You need permission to edit the details of your Business Manager. Please talk to one of your Business Manager admins about changing your role or editing the Business Manager details. |
| 415 | Two factor authentication required. User have to enter a code from SMS or TOTP code generator to pass 2fac. This could happen when accessing a 2fac-protected asset like a page that is owned by a 2fac-protected business manager. |
| 3947 | You are trying to create a Business Manager with the same name as one you are already a part of. Please pick a different name. |
| 3973 | The name you chose for this Business Manager is not valid. Please choose another. |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |
| 3912 | There was a technical issue and the changes you made to your Business Manager weren't saved. Please try again. |
| 100 | Invalid parameter |

### /{business_id}/managed_businesses
You can update a [Business](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business) by making a POST request to [/{business_id}/managed_businesses](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/managed_businesses).

#### Parameters

| Parameter | Description |
| --- | --- |
| `child_business_external_id`<br><br>*string* | child_business_external_id<br> |
| `existing_client_business_id`<br><br>*numeric string* | Existing client business id provided by the client<br> |
| `name`<br><br>*string* | Client business name that's managed by the aggregator business<br> |
| `sales_rep_email`<br><br>*string* | Email of sales representative of the business that's managed by the aggregator business<br> |
| `survey_business_type`<br><br>*enum {AGENCY, ADVERTISER, APP_DEVELOPER, PUBLISHER}* | Business type of surveyed business that's managed by the aggregator business<br> |
| `survey_num_assets`<br><br>*int64* | Number of assets surveyed of business that's managed by the aggregator business<br> |
| `survey_num_people`<br><br>*int64* | Number of people surveyed of business that's managed by the aggregator business<br> |
| `timezone_id`<br><br>*enum {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285, 286, 287, 288, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298, 299, 300, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318, 319, 320, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346, 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 363, 364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386, 387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 419, 420, 421, 422, 423, 424, 425, 426, 427, 428, 429, 430, 431, 432, 433, 434, 435, 436, 437, 438, 439, 440, 441, 442, 443, 444, 445, 446, 447, 448, 449, 450, 451, 452, 453, 454, 455, 456, 457, 458, 459, 460, 461, 462, 463, 464, 465, 466, 467, 468, 469, 470, 471, 472, 473, 474, 475, 476, 477, 478, 479, 480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493, 494, 495, 496, 497, 498, 499, 500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 512, 513, 514, 515, 516, 517, 518, 519, 520, 521, 522, 523, 524, 525, 526, 527, 528, 529, 530, 531, 532, 533, 534, 535, 536, 537, 538, 539, 540, 541, 542, 543, 544, 545, 546, 547, 548, 549, 550, 551, 552, 553, 554, 555, 556, 557, 558, 559, 560, 561, 562, 563, 564, 565, 566, 567, 568, 569, 570, 571, 572, 573, 574, 575, 576, 577, 578, 579, 580, 581, 582, 583, 584, 585, 586, 587, 588, 589, 590, 591, 592}* | Timezone id of business that's managed by the aggregator business<br> |
| `vertical`<br><br>*enum {NOT_SET, ADVERTISING, AUTOMOTIVE, CONSUMER_PACKAGED_GOODS, ECOMMERCE, EDUCATION, ENERGY_AND_UTILITIES, ENTERTAINMENT_AND_MEDIA, FINANCIAL_SERVICES, GAMING, GOVERNMENT_AND_POLITICS, MARKETING, ORGANIZATIONS_AND_ASSOCIATIONS, PROFESSIONAL_SERVICES, RETAIL, TECHNOLOGY, TELECOM, TRAVEL, NON_PROFIT, RESTAURANT, HEALTH, LUXURY, OTHER}* | Business vertical of business that's managed by the aggregator business<br> |

#### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node represented by *id* in the return type.

```
Struct  {
id: numeric string,
name: string,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 42004 | You couldn't create the client business on behalf your client successfully |
| 200 | Permissions error |
| 100 | Invalid parameter |

## Deleting

### /{business_id}/agencies
You can dissociate a [Business](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business) from a [Business](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business) by making a DELETE request to [/{business_id}/agencies](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/agencies).

#### Parameters

| Parameter | Description |
| --- | --- |
| `business`<br><br>*numeric string or integer* | The agency's business.<br><br>**[required]**<br> |

#### Return Type

```
Struct  {
success: bool,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |

### /{business_id}/clients
You can dissociate a [Business](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business) from a [Business](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business) by making a DELETE request to [/{business_id}/clients](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/clients).

#### Parameters

| Parameter | Description |
| --- | --- |
| `business`<br><br>*numeric string* | The client's business.<br><br>**[required]**<br> |

#### Return Type

```
Struct  {
success: bool,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |

### /{business_id}/pages
You can dissociate a [Business](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business) from a [Business](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business) by making a DELETE request to [/{business_id}/pages](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/pages).

#### Parameters

| Parameter | Description |
| --- | --- |
| `page_id`<br><br>*Page ID* | Page ID.<br><br>**[required]**<br> |

#### Return Type

```
Struct  {
success: bool,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 42001 | This Page can't be removed because it's already linked to an Instagram business profile. To remove this Page from Business Manager, go to Instagram and convert to a personal account or change the Page linked to your business profile. |
| 200 | Permissions error |
| 3996 | The page does not belong to this Business Manager. |
| 415 | Two factor authentication required. User have to enter a code from SMS or TOTP code generator to pass 2fac. This could happen when accessing a 2fac-protected asset like a page that is owned by a 2fac-protected business manager. |
| 100 | Invalid parameter |

### /{business_id}/instagram_accounts
You can dissociate a [Business](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business) from a [Business](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business) by making a DELETE request to [/{business_id}/instagram_accounts](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/instagram_accounts).

#### Parameters

| Parameter | Description |
| --- | --- |
| `instagram_account`<br><br>*numeric string* | Instagram account ID.<br><br>**[required]**<br> |

#### Return Type

```
Struct  {
success: bool,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |
| 200 | Permissions error |

### /{business_id}/ad_accounts
You can dissociate a [Business](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business) from a [Business](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business) by making a DELETE request to [/{business_id}/ad_accounts](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/ad_accounts).

#### Parameters

| Parameter | Description |
| --- | --- |
| `adaccount_id`<br><br>*string* | Ad account ID.<br><br>**[required]**<br> |

#### Return Type

```
Struct  {
success: bool,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |

### /act_{ad_account_id}/agencies
You can dissociate a [Business](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business) from an [AdAccount](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account) by making a DELETE request to [/act_{ad_account_id}/agencies](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/agencies).

#### Parameters

| Parameter | Description |
| --- | --- |
| `business`<br><br>*numeric string* | SELF_EXPLANATORY<br><br>**[required]**<br> |

#### Return Type

```
Struct  {
success: bool,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |
| 200 | Permissions error |

### /{user_id}/businesses
You can dissociate a [Business](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business) from a [User](https://developers.facebook.com/docs/graph-api/reference/user) by making a DELETE request to [/{user_id}/businesses](https://developers.facebook.com/docs/graph-api/reference/user/businesses).

#### Parameters

| Parameter | Description |
| --- | --- |
| `business`<br><br>*numeric string or integer* | Business ID<br> |

#### Return Type

```
Struct  {
success: bool,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 3914 | It looks like you're trying to remove the last admin from this Business Manager. At least one admin is required in Business Manager. |
| 415 | Two factor authentication required. User have to enter a code from SMS or TOTP code generator to pass 2fac. This could happen when accessing a 2fac-protected asset like a page that is owned by a 2fac-protected business manager. |
| 100 | Invalid parameter |
| 190 | Invalid OAuth 2.0 Access Token |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |
| 200 | Permissions error |

### /{instagram_business_asset_id}/agencies
You can dissociate a [Business](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business) from an [InstagramBusinessAsset](https://developers.facebook.com/docs/graph-api/reference/instagram-business-asset) by making a DELETE request to [/{instagram_business_asset_id}/agencies](https://developers.facebook.com/docs/graph-api/reference/instagram-business-asset/agencies).

#### Parameters

| Parameter | Description |
| --- | --- |
| `business`<br><br>*numeric string* | The business ID of the agency that you want to revoke access for the Instagram Business Asset<br><br>**[required]**<br> |

#### Return Type

```
Struct  {
success: bool,
}
```

### /{business_id}/owned_businesses
You can dissociate a [Business](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business) from a [Business](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business) by making a DELETE request to [/{business_id}/owned_businesses](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/owned_businesses).

#### Parameters

| Parameter | Description |
| --- | --- |
| `client_id`<br><br>*numeric string* | ID of the Child Business you want to delete<br><br>**[required]**<br> |

#### Return Type

```
Struct  {
success: bool,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 3912 | There was a technical issue and the changes you made to your Business Manager weren't saved. Please try again. |
| 100 | Invalid parameter |

