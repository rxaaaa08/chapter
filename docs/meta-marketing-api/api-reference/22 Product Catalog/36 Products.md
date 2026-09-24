<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/products | Saved: 2026-09-19 -->

# Product Catalog Products



Products in a catalog used in Dynamic Ads. See [Dynamic Ads, Catalog Setup](https://developers.facebook.com/documentation/ads-commerce/catalog).

For example, fetch the name and category of products whose name contains the word `shoe`:

```
curl -G \
-d 'fields=["category","name","errors"]' \
-d 'filter={"name":{"i_contains":"shoe"}}' \
-d 'summary=true' \
-d 'access_token=<ACCESS_TOKEN>'
https://graph.facebook.com/<API_VERSION>/<PRODUCT_CATALOG_ID>/products
```

The response:

```
{
  "data": [
    {
      "category": "mens_shoes",
      "name": "Awesome Mens Shoes in Black",
      "id": "1234",
    },

    ....

    {
      "category": "mens_shoes",
      "name": "Hipster Mens Shoes in Red",
      "id": "5678",
      "errors": [
        {
          "error_type": "IMAGE_RESOLUTION_LOW",
          "error_priority": "HIGH",
          "title": "Missing or invalid images",
          "description": "The main image of this item cannot be displayed.",
          "call_to_action": "After you've made changes, save the image under a different link (URL) and provide the new link.",
        },
        ...
      ]},
    ...
    ],

    }
  ],

  ....

  "summary": {
    "total_count": 316
  }
}
```

## Reading

Products that a catalog contains

You can also filter the results:

| Field Name | Description | Type | Required |
| --- | --- | --- | --- |
| `filter` | [Filter Specification](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-set#Creating) | `JSON string` | no |

#### Example

### HTTP
```
GET /v25.0/{product-catalog-id}/products HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{product-catalog-id}/products',
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
    "/{product-catalog-id}/products",
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
    "/{product-catalog-id}/products",
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
                               initWithGraphPath:@"/{product-catalog-id}/products"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bproduct-catalog-id%7D%2Fproducts&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `bulk_pagination`<br><br>*boolean* | Used for iterating over the edge in large chunks<br> |
| `error_priority`<br><br>*enum {HIGH, LOW, MEDIUM}* | A filter for items having errors with the given priority. We suggest looking at HIGH priority errors first.<br><br><br>Priorities are decided based on both the issue type (how severe this issue is) and the item (how important this item is).<br> |
| `error_type`<br><br>*enum {ADDRESS_BLOCKLISTED_IN_MARKET, AGGREGATED_LOCALIZATION_ISSUES, APP_HAS_NO_AEM_SETUP, AR_DELETED_DUE_TO_UPDATE, AR_POLICY_VIOLATED, AVAILABLE, BAD_QUALITY_IMAGE, BIG_CATALOG_WITH_ALL_ITEMS_IN_STOCK, BIZ_MSG_AI_AGENT_DISABLED_BY_USER, BIZ_MSG_GEN_AI_POLICY_VIOLATED, CANNOT_EDIT_SUBSCRIPTION_PRODUCTS, CATALOG_NOT_CONNECTED_TO_EVENT_SOURCE, CHECKOUT_DISABLED_BY_USER, COMMERCE_ACCOUNT_LEGAL_ADDRESS_INVALID, COMMERCE_ACCOUNT_NOT_LEGALLY_COMPLIANT, CRAWLED_AVAILABILITY_MISMATCH, DA_DISABLED_BY_USER, DA_POLICY_VIOLATION, DELETED_ITEM, DIGITAL_GOODS_NOT_AVAILABLE_FOR_CHECKOUT, DUPLICATE_IMAGES, DUPLICATE_TITLE_AND_DESCRIPTION, EMPTY_AVAILABILITY, EMPTY_BRAND, EMPTY_CONDITION, EMPTY_DESCRIPTION, EMPTY_IMAGE_URL, EMPTY_PRICE, EMPTY_PRODUCT_URL, EMPTY_SELLER_DESCRIPTION, EMPTY_TITLE, EXTERNAL_MERCHANT_ID_MISMATCH, GENERIC_INVALID_FIELD, GROUPS_DISABLED_BY_USER, HIDDEN_UNTIL_PRODUCT_LAUNCH, ILLEGAL_PRODUCT_CATEGORY, IMAGE_FETCH_FAILED, IMAGE_FETCH_FAILED_BAD_GATEWAY, IMAGE_FETCH_FAILED_FILE_SIZE_EXCEEDED, IMAGE_FETCH_FAILED_FORBIDDEN, IMAGE_FETCH_FAILED_LINK_BROKEN, IMAGE_FETCH_FAILED_TIMED_OUT, IMAGE_RESOLUTION_LOW, IN_ANOTHER_PRODUCT_LAUNCH, INACTIVE_MAGENTO_PRODUCT, INACTIVE_SALESFORCE_COMMERCE_CLOUD_PRODUCT, INACTIVE_SHOPIFY_PRODUCT, INACTIVE_WOOCOMMERCE_PRODUCT, INVALID_COMMERCE_TAX_CATEGORY, INVALID_COMSCORE_MARKET_CODES, INVALID_CONSOLIDATED_LOCALITY_INFORMATION, INVALID_CONTENT_ID, INVALID_DEALER_COMMUNICATION_PARAMETERS, INVALID_DMA_CODES, INVALID_FB_PAGE_ID, INVALID_IMAGES, INVALID_MONETIZER_RETURN_POLICY, INVALID_OFFER_DISCLAIMER_URL, INVALID_OFFER_END_DATE, INVALID_PRE_ORDER_PARAMS, INVALID_RANGE_FOR_AREA_SIZE, INVALID_RANGE_FOR_BUILT_UP_AREA_SIZE, INVALID_RANGE_FOR_NUM_OF_BATHS, INVALID_RANGE_FOR_NUM_OF_BEDS, INVALID_RANGE_FOR_NUM_OF_ROOMS, INVALID_RANGE_FOR_PARKING_SPACES, INVALID_SALE_PRICE, INVALID_SHELTER_PAGE_ID, INVALID_SHIPPING_PROFILE_PARAMS, INVALID_SUBSCRIPTION_DISABLE_PARAMS, INVALID_SUBSCRIPTION_ENABLE_PARAMS, INVALID_SUBSCRIPTION_PARAMS, INVALID_TAX_EXTENSION_STATE, INVALID_VEHICLE_STATE, INVALID_VIRTUAL_TOUR_URL_DOMAIN, INVENTORY_ZERO_AVAILABILITY_IN_STOCK, ITEM_GROUP_NOT_SPECIFIED, ITEM_NOT_SHIPPABLE_FOR_SCA_SHOP, ITEM_OVERRIDE_EMPTY_AVAILABILITY, ITEM_OVERRIDE_EMPTY_PRICE, ITEM_OVERRIDE_NOT_VISIBLE, ITEM_PRICE_NOT_POSITIVE, ITEM_STALE_OUT_OF_STOCK, MARKETPLACE_DISABLED_BY_USER, MARKETPLACE_NOT_SHIPPED_ITEM, MARKETPLACE_PARTNER_AUCTION_NO_BID_CLOSE_TIME, MARKETPLACE_PARTNER_CURRENCY_NOT_VALID, MARKETPLACE_PARTNER_DISTRIBUTION_DISABLED, MARKETPLACE_PARTNER_LISTING_COUNTRY_NOT_MATCH_CATALOG, MARKETPLACE_PARTNER_LISTING_LIMIT_EXCEEDED, MARKETPLACE_PARTNER_MISSING_LATLONG, MARKETPLACE_PARTNER_MISSING_SHIPPING_COST, MARKETPLACE_PARTNER_NOT_LOCAL_ITEM, MARKETPLACE_PARTNER_NOT_SHIPPED_ITEM, MARKETPLACE_PARTNER_POLICY_VIOLATION, MARKETPLACE_PARTNER_RULE_LISTING_LIMIT_EXCEEDED, MARKETPLACE_PARTNER_SELLER_BANNED, MARKETPLACE_PARTNER_SELLER_NOT_VALID, MARKETPLACE_SHIPPED_ITEM_EXPIRED, MARKETPLACE_SHIPPED_ITEM_NOT_AVAILABLE, MARKETPLACE_SHIPPED_SELLER_FEATURE_BANNED, MARKETPLACE_SHIPPED_SELLER_NOT_FULLY_ONBOARDED, MINI_SHOPS_DISABLED_BY_USER, MISSING_CHECKOUT, MISSING_CHECKOUT_CURRENCY, MISSING_COLOR, MISSING_COUNTRY_OVERRIDE_IN_SHIPPING_PROFILE, MISSING_EVENT, MISSING_INDIA_COMPLIANCE_FIELDS, MISSING_SHIPPING_PROFILE, MISSING_SIZE, MISSING_TAX_CATEGORY, NEGATIVE_COMMUNITY_FEEDBACK, NEGATIVE_PRICE, NO_CONTENT_ID, NOT_ENOUGH_IMAGES, NOT_ENOUGH_UNIQUE_PRODUCTS, OVERLAY_DISCLAIMER_EXCEEDED_MAX_LENGTH, PART_OF_PRODUCT_LAUNCH, PASSING_MULTIPLE_CONTENT_IDS, PRODUCT_DOMINANT_CURRENCY_MISMATCH, PRODUCT_EXPIRED, PRODUCT_ITEM_HIDDEN_FROM_ALL_SHOPS, PRODUCT_ITEM_INVALID_PARTNER_TOKENS, PRODUCT_ITEM_NOT_INCLUDED_IN_ANY_SHOP, PRODUCT_ITEM_NOT_VISIBLE, PRODUCT_NOT_APPROVED, PRODUCT_NOT_DOMINANT_CURRENCY, PRODUCT_OUT_OF_STOCK, PRODUCT_URL_EQUALS_DOMAIN, PROPERTY_PRICE_CURRENCY_NOT_SUPPORTED, PROPERTY_PRICE_TOO_HIGH, PROPERTY_PRICE_TOO_LOW, PROPERTY_UNIT_PRICE_CURRENCY_MISMATCH_ITEM_PRICE_CURRENCY, PROPERTY_VALUE_CONTAINS_HTML_TAGS, PROPERTY_VALUE_DESCRIPTION_CONTAINS_OFF_PLATFORM_LINK, PROPERTY_VALUE_FORMAT, PROPERTY_VALUE_MISSING, PROPERTY_VALUE_MISSING_WARNING, PROPERTY_VALUE_NON_POSITIVE, PROPERTY_VALUE_STRING_EXCEEDS_LENGTH, PROPERTY_VALUE_STRING_TOO_SHORT, PROPERTY_VALUE_UPPERCASE, PROPERTY_VALUE_UPPERCASE_WARNING, PURCHASE_RATE_BELOW_ADDTOCART, PURCHASE_RATE_BELOW_VIEWCONTENT, QUALITY_DUPLICATED_DESCRIPTION, QUALITY_ITEM_LINK_BROKEN, QUALITY_ITEM_LINK_REDIRECTING, RETAILER_ID_NOT_PROVIDED, RETAILER_ID_USED_BY_GROUP, SHOPIFY_INVALID_RETAILER_ID, SHOPIFY_ITEM_MISSING_DELIVERY_PROFILE_ZERO_INVENTORY, SHOPIFY_ITEM_MISSING_SHIPPING_PROFILE, SHOPS_POLICY_VIOLATION, SUBSCRIPTION_INFO_NOT_ENABLED_FOR_FEED, TAX_CATEGORY_NOT_SUPPORTED_IN_UK, TOP_PRODUCT_WITHOUT_VIDEOS, UNIQUE_PRODUCT_IDENTIFIER_MISSING, UNMATCHED_EVENTS, UNSUPPORTED_PRODUCT_CATEGORY, VARIANT_ATTRIBUTE_ISSUE, VIDEO_FETCH_FAILED, VIDEO_FETCH_FAILED_BAD_GATEWAY, VIDEO_FETCH_FAILED_FILE_SIZE_EXCEEDED, VIDEO_FETCH_FAILED_FORBIDDEN, VIDEO_FETCH_FAILED_LINK_BROKEN, VIDEO_FETCH_FAILED_RATE_LIMITED, VIDEO_FETCH_FAILED_SERVER_ERROR, VIDEO_FETCH_FAILED_TIMED_OUT, VIDEO_ISSUE_GENERIC, VIDEO_NOT_DOWNLOADABLE, WHATSAPP_DISABLED_BY_USER, WHATSAPP_MARKETING_MESSAGE_DISABLED_BY_USER, WHATSAPP_MARKETING_MESSAGE_POLICY_VIOLATION, WHATSAPP_POLICY_VIOLATION}* | A filter for items affected by a particular issue type.<br> |
| `filter`<br><br>*A JSON-encoded rule* | JSON-encoded WCA rule expression representing the filter to be applied for the edge<br> |
| `return_only_approved_products`<br><br>*boolean* | **Default value: **`false`<br>Return only approved products, only working for WhatsApp capability for now<br> |

#### Fields

Reading from this edge will return a JSON formatted result:

```
{
"data": [],
"paging": {},
"summary": {}
}
```

##### data

A list of [ProductItem](https://developers.facebook.com/docs/marketing-api/reference/product-item) nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

##### summary

Aggregated information about the edge, such as counts. Specify the fields to fetch in the summary param (like summary=total_count).

| Field | Description |
| --- | --- |
| `total_count`<br><br>*unsigned int32* | Total number of products returned by the query<br> |

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |
| 80009 | There have been too many calls to this Catalog account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting. |
| 200 | Permissions error |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |
| 190 | Invalid OAuth 2.0 Access Token |
| 2500 | Error parsing graph query |

## Creating

### /{product_catalog_id}/products
You can make a POST request to *products* edge from the following paths:

- [/{product_catalog_id}/products](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/products)

When posting to this edge, a [ProductItem](https://developers.facebook.com/docs/marketing-api/reference/product-item) will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `additional_image_urls`<br><br>*list<URL>* | Additional product image URLs<br> |
| `additional_variant_attributes`<br><br>*JSON object {string : string}* | Additional attributes to distinguish the product in its variant group (ex: {"Scent" : "Fruity", "Style" : "Classic"})<br> |
| `age_group`<br><br>*enum {adult, all ages, infant, kids, newborn, teen, toddler}* | The age group that the item is targeted towards<br> |
| `allow_upsert` This field is only accessible in v24.0 or later.<br><br>*boolean* | **Default value: **`true`<br>If the retailer_id of the item already exists in the catalog, setting this flag to true allows the request to update the item, otherwise it throws an error.<br><br><br>By default the value is true.<br> |
| `android_app_name`<br><br>*string* | The name of the app (suitable for display)<br> |
| `android_class`<br><br>*string* | A fully-qualified Activity class name for intent generation<br> |
| `android_package`<br><br>*string* | A fully-qualified package name for intent generation<br> |
| `android_url`<br><br>*string* | A custom scheme for the Android app<br> |
| `availability`<br><br>*enum{in stock, out of stock, preorder, available for order, discontinued, pending, mark_as_sold, mark_as_expired}* | **Default value: **`in stock`<br>Availability of the product item<br> |
| `brand`<br><br>*string* | Brand of the product item<br> |
| `category`<br><br>*string* | Google product category for the item. If you need a custom category name instead, use field 'product_type'<br> |
| `category_specific_fields`<br><br>*JSON object* | JSON object containing category specific fields<br><br><br>`item_sub_type` *enum {APPLIANCES, BABY_FEEDING, BABY_TRANSPORT, BEAUTY, BEDDING, CAMERAS, CELL_PHONES_AND_SMART_WATCHES, CLEANING_SUPPLIES, CLOTHING, CLOTHING_ACCESSORIES, COMPUTERS_AND_TABLETS, DIAPERING_AND_POTTY_TRAINING, ELECTRONICS_ACCESSORIES, FURNITURE, HEALTH, HOME_GOODS, JEWELRY, NURSERY, PRINTERS_AND_SCANNERS, PROJECTORS, SHOES_AND_FOOTWEAR, SOFTWARE, TOYS, TVS_AND_MONITORS, VIDEO_GAME_CONSOLES_AND_VIDEO_GAMES, WATCHES}*<br><br>**Default value: **`"EMPTY"`<br>item_sub_type<br> |
| `checkout_url`<br><br>*URL* | URL to add product item to cart and directly to checkout<br> |
| `color`<br><br>*string* | Color of the product item<br> |
| `commerce_tax_category`<br><br>*enum{FB_ANIMAL, FB_ANIMAL_SUPP, FB_APRL, FB_APRL_ACCESSORIES, FB_APRL_ATHL_UNIF, FB_APRL_CASES, FB_APRL_CLOTHING, FB_APRL_COSTUME, FB_APRL_CSTM, FB_APRL_FORMAL, FB_APRL_HANDBAG, FB_APRL_JEWELRY, FB_APRL_SHOE, FB_APRL_SHOE_ACC, FB_APRL_SWIM, FB_APRL_SWIM_CHIL, FB_APRL_SWIM_CVR, FB_ARTS, FB_ARTS_HOBBY, FB_ARTS_PARTY, FB_ARTS_PARTY_GIFT_CARD, FB_ARTS_TICKET, FB_BABY, FB_BABY_BATH, FB_BABY_BLANKET, FB_BABY_DIAPER, FB_BABY_GIFT_SET, FB_BABY_HEALTH, FB_BABY_NURSING, FB_BABY_POTTY_TRN, FB_BABY_SAFE, FB_BABY_TOYS, FB_BABY_TRANSPORT, FB_BABY_TRANSPORT_ACC, FB_BAGS, FB_BAGS_BKPK, FB_BAGS_BOXES, FB_BAGS_BRFCS, FB_BAGS_CSMT_BAG, FB_BAGS_DFFL, FB_BAGS_DIPR, FB_BAGS_FNNY, FB_BAGS_GRMT, FB_BAGS_LUG_ACC, FB_BAGS_LUGG, FB_BAGS_MSGR, FB_BAGS_TOTE, FB_BAGS_TRN_CAS, FB_BLDG, FB_BLDG_ACC, FB_BLDG_CNSMB, FB_BLDG_FENCE, FB_BLDG_FUEL_TNK, FB_BLDG_HT_VNT, FB_BLDG_LOCK, FB_BLDG_MATRL, FB_BLDG_PLMB, FB_BLDG_PUMP, FB_BLDG_PWRS, FB_BLDG_S_ENG, FB_BLDG_STR_TANK, FB_BLDG_TL_ACC, FB_BLDG_TOOL, FB_BUSIND, FB_BUSIND_ADVERTISING, FB_BUSIND_AGRICULTURE, FB_BUSIND_AUTOMATION, FB_BUSIND_HEAVY_MACH, FB_BUSIND_LAB, FB_BUSIND_MEDICAL, FB_BUSIND_RETAIL, FB_BUSIND_SANITARY_CT, FB_BUSIND_SIGN, FB_BUSIND_STORAGE, FB_BUSIND_STORAGE_ACC, FB_BUSIND_WORK_GEAR, FB_CAMERA_ACC, FB_CAMERA_CAMERA, FB_CAMERA_OPTIC, FB_CAMERA_OPTICS, FB_CAMERA_PHOTO, FB_ELEC, FB_ELEC_ACC, FB_ELEC_ARCDADE, FB_ELEC_AUDIO, FB_ELEC_CIRCUIT, FB_ELEC_COMM, FB_ELEC_COMPUTER, FB_ELEC_GPS_ACC, FB_ELEC_GPS_NAV, FB_ELEC_GPS_TRK, FB_ELEC_MARINE, FB_ELEC_NETWORK, FB_ELEC_PART, FB_ELEC_PRINT, FB_ELEC_RADAR, FB_ELEC_SFTWR, FB_ELEC_SPEED_RDR, FB_ELEC_TELEVISION, FB_ELEC_TOLL, FB_ELEC_VID_GM_ACC, FB_ELEC_VID_GM_CNSL, FB_ELEC_VIDEO, FB_FOOD, FB_FURN, FB_FURN_BABY, FB_FURN_BENCH, FB_FURN_CART, FB_FURN_CHAIR, FB_FURN_CHAIR_ACC, FB_FURN_DIVIDE, FB_FURN_DIVIDE_ACC, FB_FURN_ENT_CTR, FB_FURN_FUTN, FB_FURN_FUTN_PAD, FB_FURN_OFFICE, FB_FURN_OFFICE_ACC, FB_FURN_OTTO, FB_FURN_OUTDOOR, FB_FURN_OUTDOOR_ACC, FB_FURN_SETS, FB_FURN_SHELVE_ACC, FB_FURN_SHLF, FB_FURN_SOFA, FB_FURN_SOFA_ACC, FB_FURN_STORAGE, FB_FURN_TABL, FB_FURN_TABL_ACC, FB_GENERIC_TAXABLE, FB_HLTH, FB_HLTH_HLTH, FB_HLTH_JWL_CR, FB_HLTH_LILP_BLM, FB_HLTH_LTN_SPF, FB_HLTH_PRSL_CR, FB_HLTH_SKN_CR, FB_HMGN, FB_HMGN_BATH, FB_HMGN_DCOR, FB_HMGN_EMGY, FB_HMGN_FPLC, FB_HMGN_FPLC_ACC, FB_HMGN_GS_SFT, FB_HMGN_HS_ACC, FB_HMGN_HS_APP, FB_HMGN_HS_SPL, FB_HMGN_KTCN, FB_HMGN_LAWN, FB_HMGN_LGHT, FB_HMGN_LINN, FB_HMGN_LT_ACC, FB_HMGN_OTDR, FB_HMGN_POOL, FB_HMGN_SCTY, FB_HMGN_SMK_ACC, FB_HMGN_UMBR, FB_HMGN_UMBR_ACC, FB_MDIA, FB_MDIA_BOOK, FB_MDIA_DVDS, FB_MDIA_MAG, FB_MDIA_MANL, FB_MDIA_MUSC, FB_MDIA_PRJ_PLN, FB_MDIA_SHT_MUS, FB_OFFC, FB_OFFC_BKAC, FB_OFFC_CRTS, FB_OFFC_DSKP, FB_OFFC_EQIP, FB_OFFC_FLNG, FB_OFFC_GNRL, FB_OFFC_INSTM, FB_OFFC_LP_DSK, FB_OFFC_MATS, FB_OFFC_NM_PLT, FB_OFFC_PPR_HNDL, FB_OFFC_PRSNT_SPL, FB_OFFC_SEALR, FB_OFFC_SHIP_SPL, FB_RLGN, FB_RLGN_CMNY, FB_RLGN_ITEM, FB_RLGN_WEDD, FB_SFTWR, FB_SFWR_CMPTR, FB_SFWR_DGTL_GD, FB_SFWR_GAME, FB_SHIPPING, FB_SPOR, FB_SPORT_ATHL, FB_SPORT_ATHL_CLTH, FB_SPORT_ATHL_SHOE, FB_SPORT_ATHL_SPRT, FB_SPORT_EXRCS, FB_SPORT_INDR_GM, FB_SPORT_OTDR_GM, FB_TOYS, FB_TOYS_EQIP, FB_TOYS_GAME, FB_TOYS_PZZL, FB_TOYS_TMRS, FB_TOYS_TOYS, FB_VEHI, FB_VEHI_PART}* | Commerce tax category<br> |
| `condition`<br><br>*enum{new, refurbished, used, used_like_new, used_good, used_fair, cpo, open_box_new}* | **Default value: **`new`<br>The condition of the product item<br> |
| `currency`<br><br>*ISO 4217 Currency Code* | Currency for the product item<br><br>**[required]**<br> |
| `custom_data`<br><br>*dictionary { string : <string> }* | Field used to specify custom variants for a specific catalog item. In this case, variants can be colors, materials, etc.<br><br>The field must be formatted as key-value pairs, and the keys must be defined in the product group.<br><br>For example: `custom_data: {"color":"red", "size": "L"}`<br> |
| `custom_label_0`<br><br>*string* | An optional custom label to associate with the product item. Max size: 100<br> |
| `custom_label_1`<br><br>*string* | An optional custom label to associate with the product item. Max size: 100<br> |
| `custom_label_2`<br><br>*string* | An optional custom label to associate with the product item. Max size: 100<br> |
| `custom_label_3`<br><br>*string* | An optional custom label to associate with the product item. Max size: 100<br> |
| `custom_label_4`<br><br>*string* | An optional custom label to associate with the product item. Max size: 100<br> |
| `custom_number_0`<br><br>*int64* | custom_number_0<br> |
| `custom_number_1`<br><br>*int64* | custom_number_1<br> |
| `custom_number_2`<br><br>*int64* | custom_number_2<br> |
| `custom_number_3`<br><br>*int64* | custom_number_3<br> |
| `custom_number_4`<br><br>*int64* | custom_number_4<br> |
| `description`<br><br>*string* | Description of the product item. Max size: 5000<br><br>**[supports emoji]**<br> |
| `expiration_date`<br><br>*string* | Item's expiration date (YYYY-MM-DD)<br> |
| `fb_product_category`<br><br>*string* | Facebook product category for the item<br> |
| `gender`<br><br>*enum{female, male, unisex}* | Gender the product item is targeted towards<br> |
| `gtin`<br><br>*string* | Global trade ID of the product item<br> |
| `image_url`<br><br>*URI* | Required. URL of the product image.<br> |
| `importer_address`<br><br>*JSON object* | Address of the product importer<br><br><br>`street1` *string*<br>street1<br><br><br>`street2` *string*<br>street2<br><br><br>`city` *string*<br>city<br><br>**[required]**<br><br><br>`region` *string*<br>region<br><br><br>`postal_code` *string*<br>postal_code<br><br><br>`country` *enum {AC, AD, AE, AF, AG, AI, AL, AM, AN, AO, AQ, AR, AS, AT, AU, AW, AX, AZ, BA, BB, BD, BE, BF, BG, BH, BI, BJ, BL, BM, BN, BO, BQ, BR, BS, BT, BV, BW, BY, BZ, CA, CC, CD, CF, CG, CH, CI, CK, CL, CM, CN, CO, CR, CU, CV, CW, CX, CY, CZ, DE, DJ, DK, DM, DO, DZ, EC, EE, EG, EH, ER, ES, ET, FI, FJ, FK, FM, FO, FR, GA, GB, GD, GE, GF, GG, GH, GI, GL, GM, GN, GP, GQ, GR, GS, GT, GU, GW, GY, HK, HM, HN, HR, HT, HU, ID, IE, IL, IM, IN, IO, IQ, IR, IS, IT, JE, JM, JO, JP, KE, KG, KH, KI, KM, KN, KP, KR, KW, KY, KZ, LA, LB, LC, LI, LK, LR, LS, LT, LU, LV, LY, MA, MC, MD, ME, MF, MG, MH, MK, ML, MM, MN, MO, MP, MQ, MR, MS, MT, MU, MV, MW, MX, MY, MZ, NA, NC, NE, NF, NG, NI, NL, NO, NP, NR, NU, NZ, OM, PA, PE, PF, PG, PH, PK, PL, PM, PN, PR, PS, PT, PW, PY, QA, RE, RO, RS, RU, RW, SA, SB, SC, SD, SE, SG, SH, SI, SJ, SK, SL, SM, SN, SO, SR, SS, ST, SV, SX, SY, SZ, TC, TD, TF, TG, TH, TJ, TK, TL, TM, TN, TO, TR, TT, TV, TW, TZ, UA, UG, UM, US, UY, UZ, VA, VC, VE, VG, VI, VN, VU, WF, WS, XK, YE, YT, ZA, ZM, ZW}*<br>country<br><br>**[required]**<br> |
| `importer_name`<br><br>*string* | Name of the product Importer<br> |
| `inventory`<br><br>*int64* | Inventory count for the product item<br> |
| `ios_app_name`<br><br>*string* | The name of the app (suitable for display)<br> |
| `ios_app_store_id`<br><br>*int64* | The app ID for the App Store<br> |
| `ios_url`<br><br>*string* | A custom scheme for the iOS app<br> |
| `ipad_app_name`<br><br>*string* | The name of the app (suitable for display)<br> |
| `ipad_app_store_id`<br><br>*int64* | The app ID for the App Store<br> |
| `ipad_url`<br><br>*string* | A custom scheme for the iPhone app<br> |
| `iphone_app_name`<br><br>*string* | The name of the app (suitable for display)<br> |
| `iphone_app_store_id`<br><br>*int64* | The app ID for the App Store<br> |
| `iphone_url`<br><br>*string* | A custom scheme for the iPhone app<br> |
| `manufacturer_info`<br><br>*string* | The Manufacturer Information such as Name, address, etc...<br> |
| `manufacturer_part_number`<br><br>*string* | Manufacturer's ID for the product item<br> |
| `marked_for_product_launch`<br><br>*enum{default, marked, not_marked}* | Whether this product should be marked for a product launch and hide it from shops until product launch is created with this product.<br> |
| `material`<br><br>*string* | Material of the product item<br>Max size: 200<br> |
| `mobile_link`<br><br>*URI* | Link to a mobile-optimized external product page<br> |
| `name`<br><br>*string* | Name/title of the product item<br><br>**[required]**<br><br>**[supports emoji]**<br> |
| `ordering_index`<br><br>*int64* | Index used for ordering items within a group<br> |
| `origin_country`<br><br>*enum {AC, AD, AE, AF, AG, AI, AL, AM, AN, AO, AQ, AR, AS, AT, AU, AW, AX, AZ, BA, BB, BD, BE, BF, BG, BH, BI, BJ, BL, BM, BN, BO, BQ, BR, BS, BT, BV, BW, BY, BZ, CA, CC, CD, CF, CG, CH, CI, CK, CL, CM, CN, CO, CR, CU, CV, CW, CX, CY, CZ, DE, DJ, DK, DM, DO, DZ, EC, EE, EG, EH, ER, ES, ET, FI, FJ, FK, FM, FO, FR, GA, GB, GD, GE, GF, GG, GH, GI, GL, GM, GN, GP, GQ, GR, GS, GT, GU, GW, GY, HK, HM, HN, HR, HT, HU, ID, IE, IL, IM, IN, IO, IQ, IR, IS, IT, JE, JM, JO, JP, KE, KG, KH, KI, KM, KN, KP, KR, KW, KY, KZ, LA, LB, LC, LI, LK, LR, LS, LT, LU, LV, LY, MA, MC, MD, ME, MF, MG, MH, MK, ML, MM, MN, MO, MP, MQ, MR, MS, MT, MU, MV, MW, MX, MY, MZ, NA, NC, NE, NF, NG, NI, NL, NO, NP, NR, NU, NZ, OM, PA, PE, PF, PG, PH, PK, PL, PM, PN, PR, PS, PT, PW, PY, QA, RE, RO, RS, RU, RW, SA, SB, SC, SD, SE, SG, SH, SI, SJ, SK, SL, SM, SN, SO, SR, SS, ST, SV, SX, SY, SZ, TC, TD, TF, TG, TH, TJ, TK, TL, TM, TN, TO, TR, TT, TV, TW, TZ, UA, UG, UM, US, UY, UZ, VA, VC, VE, VG, VI, VN, VU, WF, WS, XK, YE, YT, ZA, ZM, ZW}* | Product Country of Origin<br> |
| `pattern`<br><br>*string* | Pattern of the product item<br> |
| `price`<br><br>*int64* | Price of the item with 2 digits added for cents (ex: use "100" for 1 or "599" for 5.99)<br><br>**[required]**<br> |
| `product_priority_1`<br><br>*float* | product_priority_1<br> |
| `product_priority_2`<br><br>*float* | product_priority_2<br> |
| `product_priority_3`<br><br>*float* | product_priority_3<br> |
| `product_priority_4`<br><br>*float* | product_priority_4<br> |
| `product_type`<br><br>*string* | Retailer defined category of the product item. Max size: 750<br> |
| `retailer_id`<br><br>*string* | A unique identifier for this item (which can be a variant for a product). This field is required.<br> |
| `retailer_product_group_id`<br><br>*string* | Item group ID that this product is a variant of<br> |
| `return_policy_days`<br><br>*int64* | return_policy_days<br> |
| `sale_price`<br><br>*int64* | Sale price of the item with 2 digits added for cents (ex: use "100" for 1 or "599" for 5.99)<br> |
| `sale_price_end_date`<br><br>*datetime* | Date when the sale price ends<br> |
| `sale_price_start_date`<br><br>*datetime* | Date when the sale price starts<br> |
| `short_description`<br><br>*string* | A brief description of the product<br> |
| `size`<br><br>*string* | Size of the product item<br> |
| `start_date`<br><br>*string* | Date when the product started to exist<br> |
| `url`<br><br>*URI* | URL of the product item<br> |
| `visibility`<br><br>*enum{staging, published}* | **Default value: **`published`<br>Visibility of the product item<br> |
| `wa_compliance_category`<br><br>*enum {DEFAULT, COUNTRY_ORIGIN_EXEMPT}* | wa_compliance_category<br> |
| `windows_phone_app_id`<br><br>*string* | The app ID (a GUID) for app store<br> |
| `windows_phone_app_name`<br><br>*string* | The name of the app (suitable for display)<br> |
| `windows_phone_url`<br><br>*string* | A custom scheme for the Windows Phone app<br> |

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
| 10800 | Duplicate retailer_id when attempting to create a store collection |
| 100 | Invalid parameter |
| 200 | Permissions error |
| 10801 | Either "file" or "url" must be specified |

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

