<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/product-item | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Product Item

## Reading

A Product Item object.

### Example

[Graph API Explorer**](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bproduct-item-id%7D&version=v26.0)

```
GET /v26.0/{product-item-id} HTTP/1.1
Host: graph.facebook.com
```

```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{product-item-id}',
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

```
/* make the API call */
FB.api(
    "/{product-item-id}",
    function (response) {
      if (response && !response.error) {
        /* handle the result */
      }
    }
);
```

```
/* make the API call */
new GraphRequest(
    AccessToken.getCurrentAccessToken(),
    "/{product-item-id}",
    null,
    HttpMethod.GET,
    new GraphRequest.Callback() {
        public void onCompleted(GraphResponse response) {
            /* handle the result */
        }
    }
).executeAsync();
```

```
/* make the API call */
FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc]
                               initWithGraphPath:@"/{product-item-id}"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api/).

### Parameters

| Parameter | Description |
| --- | --- |
| `catalog_id`numeric string | catalog_id |
| `image_height`int64 | Default value: `0` image_height |
| `image_width`int64 | Default value: `0` image_width |
| `override_country`string | override_country |
| `override_language`string | override_language |

### Fields

| Field | Description |
| --- | --- |
| `id`numeric string | id [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `additional_image_cdn_urls`list<list<KeyValue:string,string>> | additional_image_cdn_urls |
| `additional_image_urls`list<string> | additional_image_urls |
| `additional_variant_attributes`list<KeyValue:string,string> | additional_variant_attributes |
| `age_group`enum {adult, all ages, infant, kids, newborn, teen, toddler} | age_group |
| `applinks`[CatalogItemAppLinks](https://developers.facebook.com/docs/marketing-api/reference/catalog-item-app-links/) | applinks |
| `availability`enum {in stock, out of stock, preorder, available for order, discontinued, pending, mark_as_sold, mark_as_expired} | availability |
| `brand`string | brand |
| `capabilities_disabled_by_user`list<enum> | capabilities_disabled_by_user |
| `capability_to_review_status`list<KeyValue:enum,enum {NO_REVIEW, PENDING, REJECTED, APPROVED, OUTDATED}> | capability_to_review_status |
| `category`string | category |
| `category_specific_fields`CatalogSubVerticalList | category_specific_fields |
| `color`string | color |
| `commerce_insights`ProductItemCommerceInsights | commerce_insights |
| `condition`enum {new, refurbished, used, used_like_new, used_good, used_fair, cpo, open_box_new} | condition |
| `currency`string | currency |
| `custom_data`list<KeyValue:string,string> | custom_data |
| `custom_label_0`string | custom_label_0 |
| `custom_label_1`string | custom_label_1 |
| `custom_label_2`string | custom_label_2 |
| `custom_label_3`string | custom_label_3 |
| `custom_label_4`string | custom_label_4 |
| `custom_number_0`string | custom_number_0 |
| `custom_number_1`string | custom_number_1 |
| `custom_number_2`string | custom_number_2 |
| `custom_number_3`string | custom_number_3 |
| `custom_number_4`string | custom_number_4 |
| `description`string | description |
| `errors`[list<ProductItemError>](https://developers.facebook.com/docs/graph-api/reference/product-item-error/) | errors |
| `expiration_date`string | expiration_date |
| `fb_product_category`string | fb_product_category |
| `gender`enum {female, male, unisex} | gender |
| `generated_background_images`list<AIGeneratedProductImage> | generated_background_images |
| `generated_background_images_ad_usage`bool | generated_background_images_ad_usage |
| `gtin`string | gtin |
| `image_cdn_urls`list<KeyValue:string,string> | image_cdn_urls |
| `image_fetch_status`enum {NO_STATUS, DIRECT_UPLOAD, FETCHED, FETCH_FAILED, OUTDATED, PARTIAL_FETCH} | image_fetch_status |
| `image_url`string | image_url |
| `images`list<string> | images |
| `importer_address`ProductItemImporterAddress | importer_address |
| `importer_name`string | importer_name |
| `invalidation_errors`list<ProductItemInvalidationError> | invalidation_errors |
| `inventory`integer | inventory |
| `live_special_price`string | live_special_price |
| `manufacturer_info`string | manufacturer_info |
| `manufacturer_part_number`string | manufacturer_part_number |
| `marked_for_product_launch`enum | marked_for_product_launch |
| `material`string | material |
| `mobile_link`string | mobile_link |
| `name`string | name [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `native_commerce`bool | native_commerce |
| `offer_disclaimer`string | offer_disclaimer |
| `offer_disclaimer_url`string | offer_disclaimer_url |
| `ordering_index`int32 | ordering_index |
| `origin_country`enum | origin_country |
| `parent_product_id`numeric string | parent_product_id |
| `pattern`string | pattern |
| `post_conversion_signal_based_enforcement_appeal_eligibility`bool | post_conversion_signal_based_enforcement_appeal_eligibility |
| `price`string | price |
| `product_catalog`[ProductCatalog](https://developers.facebook.com/docs/marketing-api/reference/product-catalog/) | product_catalog |
| `product_disclosures`list<ProductItemProductDisclosure> | product_disclosures |
| `product_feed`[ProductFeed](https://developers.facebook.com/docs/marketing-api/reference/product-feed/) | product_feed |
| `product_relationship`enum | product_relationship |
| `product_type`string | product_type |
| `quantity_to_sell_on_facebook`integer | quantity_to_sell_on_facebook |
| `retailer_id`string | retailer_id [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `retailer_product_group_id`string | retailer_product_group_id |
| `review_rejection_reasons`list<enum> | review_rejection_reasons |
| `review_status`enum {, pending, rejected, approved, outdated} | review_status |
| `rich_text_description`string | rich_text_description |
| `sale_price`string | sale_price |
| `sale_price_end_date`string | sale_price_end_date |
| `sale_price_start_date`string | sale_price_start_date |
| `shipping_weight_unit`enum {g, kg, oz, lb} | shipping_weight_unit |
| `shipping_weight_value`float | shipping_weight_value |
| `short_description`string | short_description |
| `size`string | size |
| `start_date`string | start_date |
| `tags`list<string> | tags |
| `url`string | url |
| `vendor_id`string | vendor_id |
| `video_fetch_status`enum {NO_STATUS, DIRECT_UPLOAD, FETCHED, FETCH_FAILED, OUTDATED, PARTIAL_FETCH} | video_fetch_status |
| `videos`[**](#)list<ProductItemVideoData> | Array of JSON objects for product item video data. Contains: * `url`: The URLs provided from the catalog ingestion source, regardless of whether or not the videos are fetched. * `tags`: The tags provided with the videos. The following is an example response for the `videos` field for a product item with 2 videos: `"videos": [{"url": "https://facebook.com/video1", "tags": ["abcd"]}, {"url": "https://facebook.com/video2", "tags": ["efgh"]}],` |
| `visibility`enum {staging, published} | visibility |
| `wa_compliance_category`enum | wa_compliance_category |

### Edges

| Edge | Description |
| --- | --- |
| [`product_sets`](https://developers.facebook.com/docs/marketing-api/reference/product-item/product_sets/)Edge<ProductSet> | product_sets |

### Error Codes

| Error | Description |
| --- | --- |
| 100 | Invalid parameter |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |
| 115 | Invalid field list |
| 104 | Incorrect signature |
| 190 | Invalid OAuth 2.0 Access Token |

## Creating

### Example TSV feed

Desktop only:

```
id  title   description google product category product type    link    image link  condition   availability    price   sale price  sale price effective date   gtin    brand   mpn item group id   gender  age group   color   size    shipping    shipping weight
DB_1    Dog Bowl In Blue    Solid plastic Dog Bowl in marine blue color Animals &gt; Pet Supplies   Bowls &amp; Dining &gt; Food &amp; Water Bowls  http://www.example.com/bowls/db-1.html  http://images.example.com/TV_123456.png new in stock    9.99 GBP                                                        UK::Standard:4.95 GBP
```

With Deep Links:

```
id  title   ios_url ios_app_store_id    ios_app_name    android_url android_class   android_package android_app_name    description google product category product type    link    image link  condition   availability    price   sale price  sale price effective date   gtin    brand   mpn item group id   gender  age group   color   size    shipping    shipping weight
DB_1    Dog Bowl In Blue    example-ios://electronic    42  Electronic Example iOS  example-android://electronic    com.electronic  com.electronic.Example  Electronic Example Android  Solid plastic Dog Bowl in marine blue color Animals &gt; Pet Supplies   Bowls &amp; Dining &gt; Food &amp; Water Bowls  http://www.example.com/bowls/db-1.html  http://images.example.com/TV_123456.png new in stock    9.99 GBP                                                        UK::Standard:4.95 GBP
```

### XML Example RSS

```
<?xml version="1.0"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
    <channel>
        <title>Test Store</title>
        <link>http://www.example.com</link>
        <description>An example item from the feed</description>

        <item>
            <g:id>DB_1</g:id>
            <g:title>Dog Bowl In Blue</g:title>
            <g:description>Solid plastic Dog Bowl in marine blue color</g:description>
            <g:link>http://www.example.com/bowls/db-1.html</g:link>
            <g:image_link>http://images.example.com/DB_1.png</g:image_link>
            <g:brand>Example</g:brand>
            <g:condition>new</g:condition>
            <g:availability>in stock</g:availability>
            <g:price>9.99 GBP</g:price>

            <g:google_product_category>Animals &gt; Pet Supplies</g:google_product_category>
        </item>
    </channel>
</rss>
```

### XML Example ATOM

Desktop only:

```
<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:g="http://base.google.com/ns/1.0">
    <title>Test Store</title>
    <link rel="self" href="http://www.example.com"/>

    <entry>
        <g:id>DB_1</g:id>
        <g:title>Dog Bowl In Blue</g:title>
        <g:description>Solid plastic Dog Bowl in marine blue color</g:description>
        <g:link>http://www.example.com/bowls/db-1.html</g:link>
        <g:image_link>http://images.example.com/DB_1.png</g:image_link>
        <g:brand>Example</g:brand>
        <g:condition>new</g:condition>
        <g:availability>in stock</g:availability>
        <g:price>9.99 GBP</g:price>

        <g:google_product_category>Animals &gt; Pet Supplies</g:google_product_category>
    </entry>
</feed>
```

With Deep Links:

```
<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:g="http://base.google.com/ns/1.0">
    <title>Test Store</title>
    <link rel="self" href="http://www.example.com"/>

    <entry>
        <g:id>DB_1</g:id>
        <g:title>Dog Bowl In Blue</g:title>
        <g:description>Solid plastic Dog Bowl in marine blue color</g:description>
        <g:link>http://www.example.com/bowls/db-1.html</g:link>
        <g:image_link>http://images.example.com/DB_1.png</g:image_link>
        <g:brand>Example</g:brand>
        <g:condition>new</g:condition>
        <g:availability>in stock</g:availability>
        <g:price>9.99 GBP</g:price>
        <g:google_product_category>Animals &gt; Pet Supplies</g:google_product_category>
        <applink property="ios_url" content="example-ios://electronic" />
        <applink property="ios_app_store_id" content="42" />
        <applink property="ios_app_name" content="Electronic Example iOS" />
        <applink property="iphone_url" content="example-iphone://electronic" />
        <applink property="iphone_app_store_id" content="43" />
        <applink property="iphone_app_name" content="Electronic Example iPhone" />
        <applink property="ipad_url" content="example-ipad://electronic" />
        <applink property="ipad_app_store_id" content="44" />
        <applink property="ipad_app_name" content="Electronic Example iPad" />
        <applink property="android_url" content="example-android://electronic" />
        <applink property="android_package" content="com.electronic" />
        <applink property="android_class" content="com.electronic.Example" />
        <applink property="android_app_name" content="Electronic Example Android" />
        <applink property="windows_phone_url" content="example-windows://electronic" />
        <applink property="windows_phone_app_id" content="64ec0d1b-5b3b-4c77-a86b-5e12d465edc0" />
        <applink property="windows_phone_app_name" content="Electronic Example Windows" />
    </entry>
</feed>
```

You can make a POST request to `batch` edge from the following paths:

* [`/{product_catalog_id}/batch`](https://developers.facebook.com/docs/marketing-api/reference/product-catalog/batch/)

When posting to this edge, a [ProductItem](https://developers.facebook.com/docs/marketing-api/reference/product-item/) will be created.

### Parameters

| Parameter | Description |
| --- | --- |
| `allow_upsert`boolean | Default value: `true` Parameters specifying whether non existing items that are being updated should be inserted or should throw the error |
| `requests`list<JSON object> | Array of JSON objects containing batch requests. Each batch request consists of `retailer_id`, `method` and `data` fields. ``` `retailer_id` - retailer's ID for a product. `method` - an operation of a batch request, either `CREATE`, `UPDATE` or `DELETE`. `data` - JSON object containing fields and values for a product. See [Catalog Batch API](https://developers.facebook.com/docs/marketing-api/catalog-batch) to learn more the list of fields and values for the data object. ``` Required |

### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview/#read-after-write) and will read the node to which you POSTed.

 Struct {

`handles`: List [

string

],

`validation_status`: List [

 Struct {

`errors`: List [

 Struct {

`message`: string,

}

],

`retailer_id`: string,

`warnings`: List [

 Struct {

`message`: string,

}

],

}

],

}

### Error Codes

| Error | Description |
| --- | --- |
| 80014 | There have been too many calls for the batch uploads to this catalog account. Wait a bit and try again. For more info, please refer to https://developers.facebook.com/docs/graph-api/overview/rate-limiting#catalog. |
| 100 | Invalid parameter |
| 200 | Permissions error |
| 190 | Invalid OAuth 2.0 Access Token |

You can make a POST request to `products` edge from the following paths:

* [`/{product_group_id}/products`](https://developers.facebook.com/docs/marketing-api/reference/product-group/products/)

When posting to this edge, a [ProductItem](https://developers.facebook.com/docs/marketing-api/reference/product-item/) will be created.

### Parameters

| Parameter | Description |
| --- | --- |
| `additional_image_urls`list<URL> | Additional product image URLs |
| `additional_variant_attributes`JSON object {string : string} | Additional attributes to distinguish the product in its variant group (ex: {"Scent" : "Fruity", "Style" : "Classic"}) |
| `age_group`enum {adult, all ages, infant, kids, newborn, teen, toddler} | age_group |
| `android_app_name`string | The name of the app (suitable for display) |
| `android_class`string | A fully-qualified Activity class name for intent generation |
| `android_package`string | A fully-qualified package name for intent generation |
| `android_url`string | A custom scheme for the Android app |
| `availability`enum{in stock, out of stock, preorder, available for order, discontinued, pending, mark_as_sold, mark_as_expired} | Default value: `in stock` Availability of the product item |
| `brand`string | Brand of the product item |
| `category`string | Category of the product item. This is a required field |
| `checkout_url`URL | URL to add product item to cart and directly to checkout |
| `color`string | Color of the product item |
| `commerce_tax_category`enum{FB_ANIMAL, FB_ANIMAL_SUPP, FB_APRL, FB_APRL_ACCESSORIES, FB_APRL_ATHL_UNIF, FB_APRL_CASES, FB_APRL_CLOTHING, FB_APRL_COSTUME, FB_APRL_CSTM, FB_APRL_FORMAL, FB_APRL_HANDBAG, FB_APRL_JEWELRY, FB_APRL_SHOE, FB_APRL_SHOE_ACC, FB_APRL_SWIM, FB_APRL_SWIM_CHIL, FB_APRL_SWIM_CVR, FB_ARTS, FB_ARTS_HOBBY, FB_ARTS_PARTY, FB_ARTS_PARTY_GIFT_CARD, FB_ARTS_TICKET, FB_BABY, FB_BABY_BATH, FB_BABY_BLANKET, FB_BABY_DIAPER, FB_BABY_GIFT_SET, FB_BABY_HEALTH, FB_BABY_NURSING, FB_BABY_POTTY_TRN, FB_BABY_SAFE, FB_BABY_TOYS, FB_BABY_TRANSPORT, FB_BABY_TRANSPORT_ACC, FB_BAGS, FB_BAGS_BKPK, FB_BAGS_BOXES, FB_BAGS_BRFCS, FB_BAGS_CSMT_BAG, FB_BAGS_DFFL, FB_BAGS_DIPR, FB_BAGS_FNNY, FB_BAGS_GRMT, FB_BAGS_LUG_ACC, FB_BAGS_LUGG, FB_BAGS_MSGR, FB_BAGS_TOTE, FB_BAGS_TRN_CAS, FB_BLDG, FB_BLDG_ACC, FB_BLDG_CNSMB, FB_BLDG_FENCE, FB_BLDG_FUEL_TNK, FB_BLDG_HT_VNT, FB_BLDG_LOCK, FB_BLDG_MATRL, FB_BLDG_PLMB, FB_BLDG_PUMP, FB_BLDG_PWRS, FB_BLDG_S_ENG, FB_BLDG_STR_TANK, FB_BLDG_TL_ACC, FB_BLDG_TOOL, FB_BUSIND, FB_BUSIND_ADVERTISING, FB_BUSIND_AGRICULTURE, FB_BUSIND_AUTOMATION, FB_BUSIND_HEAVY_MACH, FB_BUSIND_LAB, FB_BUSIND_MEDICAL, FB_BUSIND_RETAIL, FB_BUSIND_SANITARY_CT, FB_BUSIND_SIGN, FB_BUSIND_STORAGE, FB_BUSIND_STORAGE_ACC, FB_BUSIND_WORK_GEAR, FB_CAMERA_ACC, FB_CAMERA_CAMERA, FB_CAMERA_OPTIC, FB_CAMERA_OPTICS, FB_CAMERA_PHOTO, FB_ELEC, FB_ELEC_ACC, FB_ELEC_ARCDADE, FB_ELEC_AUDIO, FB_ELEC_CIRCUIT, FB_ELEC_COMM, FB_ELEC_COMPUTER, FB_ELEC_GPS_ACC, FB_ELEC_GPS_NAV, FB_ELEC_GPS_TRK, FB_ELEC_MARINE, FB_ELEC_NETWORK, FB_ELEC_PART, FB_ELEC_PRINT, FB_ELEC_RADAR, FB_ELEC_SFTWR, FB_ELEC_SPEED_RDR, FB_ELEC_TELEVISION, FB_ELEC_TOLL, FB_ELEC_VID_GM_ACC, FB_ELEC_VID_GM_CNSL, FB_ELEC_VIDEO, FB_FOOD, FB_FURN, FB_FURN_BABY, FB_FURN_BENCH, FB_FURN_CART, FB_FURN_CHAIR, FB_FURN_CHAIR_ACC, FB_FURN_DIVIDE, FB_FURN_DIVIDE_ACC, FB_FURN_ENT_CTR, FB_FURN_FUTN, FB_FURN_FUTN_PAD, FB_FURN_OFFICE, FB_FURN_OFFICE_ACC, FB_FURN_OTTO, FB_FURN_OUTDOOR, FB_FURN_OUTDOOR_ACC, FB_FURN_SETS, FB_FURN_SHELVE_ACC, FB_FURN_SHLF, FB_FURN_SOFA, FB_FURN_SOFA_ACC, FB_FURN_STORAGE, FB_FURN_TABL, FB_FURN_TABL_ACC, FB_GENERIC_TAXABLE, FB_HLTH, FB_HLTH_HLTH, FB_HLTH_JWL_CR, FB_HLTH_LILP_BLM, FB_HLTH_LTN_SPF, FB_HLTH_PRSL_CR, FB_HLTH_SKN_CR, FB_HMGN, FB_HMGN_BATH, FB_HMGN_DCOR, FB_HMGN_EMGY, FB_HMGN_FPLC, FB_HMGN_FPLC_ACC, FB_HMGN_GS_SFT, FB_HMGN_HS_ACC, FB_HMGN_HS_APP, FB_HMGN_HS_SPL, FB_HMGN_KTCN, FB_HMGN_LAWN, FB_HMGN_LGHT, FB_HMGN_LINN, FB_HMGN_LT_ACC, FB_HMGN_OTDR, FB_HMGN_POOL, FB_HMGN_SCTY, FB_HMGN_SMK_ACC, FB_HMGN_UMBR, FB_HMGN_UMBR_ACC, FB_MDIA, FB_MDIA_BOOK, FB_MDIA_DVDS, FB_MDIA_MAG, FB_MDIA_MANL, FB_MDIA_MUSC, FB_MDIA_PRJ_PLN, FB_MDIA_SHT_MUS, FB_OFFC, FB_OFFC_BKAC, FB_OFFC_CRTS, FB_OFFC_DSKP, FB_OFFC_EQIP, FB_OFFC_FLNG, FB_OFFC_GNRL, FB_OFFC_INSTM, FB_OFFC_LP_DSK, FB_OFFC_MATS, FB_OFFC_NM_PLT, FB_OFFC_PPR_HNDL, FB_OFFC_PRSNT_SPL, FB_OFFC_SEALR, FB_OFFC_SHIP_SPL, FB_RLGN, FB_RLGN_CMNY, FB_RLGN_ITEM, FB_RLGN_WEDD, FB_SFTWR, FB_SFWR_CMPTR, FB_SFWR_DGTL_GD, FB_SFWR_GAME, FB_SHIPPING, FB_SPOR, FB_SPORT_ATHL, FB_SPORT_ATHL_CLTH, FB_SPORT_ATHL_SHOE, FB_SPORT_ATHL_SPRT, FB_SPORT_EXRCS, FB_SPORT_INDR_GM, FB_SPORT_OTDR_GM, FB_TOYS, FB_TOYS_EQIP, FB_TOYS_GAME, FB_TOYS_PZZL, FB_TOYS_TMRS, FB_TOYS_TOYS, FB_VEHI, FB_VEHI_PART} | commerce_tax_category |
| `condition`enum{new, refurbished, used, used_like_new, used_good, used_fair, cpo, open_box_new} | Default value: `new` The condition of the product item |
| `currency`ISO 4217 Currency Code | Currency for the product item Required |
| `custom_data`dictionary { string : <string> } | TBD |
| `custom_label_0`string | An optional custom label to associate with the product item. Max size: 100 |
| `custom_label_1`string | An optional custom label to associate with the product item. Max size: 100 |
| `custom_label_2`string | An optional custom label to associate with the product item. Max size: 100 |
| `custom_label_3`string | An optional custom label to associate with the product item. Max size: 100 |
| `custom_label_4`string | An optional custom label to associate with the product item. Max size: 100 |
| `custom_number_0`int64 | custom_number_0 |
| `custom_number_1`int64 | custom_number_1 |
| `custom_number_2`int64 | custom_number_2 |
| `custom_number_3`int64 | custom_number_3 |
| `custom_number_4`int64 | custom_number_4 |
| `description`string | Description of the product item. Max size: 5000 Supports Emoji |
| `expiration_date`string | Item's expiration date (YYYY-MM-DD) |
| `fb_product_category`string | The facebook product category specified by the seller. |
| `gender`enum{female, male, unisex} | Gender the product item is targeted towards |
| `gtin`string | Global trade ID of the product item |
| `image_url`URI | URL of the product image Required |
| `inventory`int64 | Inventory count for the product item |
| `ios_app_name`string | The name of the app (suitable for display) |
| `ios_app_store_id`int64 | The app ID for the App Store |
| `ios_url`string | A custom scheme for the iOS app |
| `ipad_app_name`string | The name of the app (suitable for display) |
| `ipad_app_store_id`int64 | The app ID for the App Store |
| `ipad_url`string | A custom scheme for the iPhone app |
| `iphone_app_name`string | The name of the app (suitable for display) |
| `iphone_app_store_id`int64 | The app ID for the App Store |
| `iphone_url`string | A custom scheme for the iPhone app |
| `launch_date`string | launch_date |
| `live_special_price`string | live_special_price |
| `manufacturer_part_number`string | Manufacturer's ID for the product item |
| `marked_for_product_launch`enum{default, marked, not_marked} | marked_for_product_launch |
| `material`string | Material of the product item<br>Max size: 200 |
| `mobile_link`URI | Link to a mobile-optimized external product page |
| `name`string | Name/title of the product item RequiredSupports Emoji |
| `ordering_index`int64 | Index used for ordering items within a group |
| `pattern`string | Pattern of the product item |
| `price`int64 | Price of the item with 2 digits added for cents (ex: use "100" for 1 or "599" for 5.99) Required |
| `product_priority_0`float | product_priority_0 |
| `product_priority_1`float | product_priority_1 |
| `product_priority_2`float | product_priority_2 |
| `product_priority_3`float | product_priority_3 |
| `product_priority_4`float | product_priority_4 |
| `product_type`string | Retailer defined category of the product item. Max size: 750 |
| `quantity_to_sell_on_facebook`int64 | quantity_to_sell_on_facebook |
| `retailer_id`string | A unique identifier for this item (which can be a variant for a product) Required |
| `return_policy_days`int64 | Return Policy Days |
| `rich_text_description`string | Rich-text description of the product |
| `sale_price`int64 | Sale price of the item with 2 digits added for cents (ex: use "100" for 1 or "599" for 5.99) |
| `sale_price_end_date`datetime | Date when the sale price ends |
| `sale_price_start_date`datetime | Date when the sale price starts |
| `short_description`string | A brief description of the product |
| `size`string | Size of the product item |
| `start_date`string | Date when the product started to exist |
| `url`URI | URL of the product item |
| `visibility`enum{staging, published} | Default value: `published` Visibility of the product item |
| `windows_phone_app_id`string | The app ID (a GUID) for app store |
| `windows_phone_app_name`string | The name of the app (suitable for display) |
| `windows_phone_url`string | A custom scheme for the Windows Phone app |

### Return Type

 Struct {

`id`: numeric string,

}

### Error Codes

| Error | Description |
| --- | --- |
| 100 | Invalid parameter |

You can make a POST request to `products` edge from the following paths:

* [`/{product_catalog_id}/products`](https://developers.facebook.com/docs/marketing-api/reference/product-catalog/products/)

When posting to this edge, a [ProductItem](https://developers.facebook.com/docs/marketing-api/reference/product-item/) will be created.

### Parameters

| Parameter | Description |
| --- | --- |
| `additional_image_urls`list<URL> | Additional product image URLs |
| `additional_variant_attributes`JSON object {string : string} | Additional attributes to distinguish the product in its variant group (ex: {"Scent" : "Fruity", "Style" : "Classic"}) |
| `age_group`enum {adult, all ages, infant, kids, newborn, teen, toddler} | The age group that the item is targeted towards |
| `allow_upsert`[**](#)boolean | Default value: `true` If the retailer_id of the item already exists in the catalog, setting this flag to true allows the request to update the item, otherwise it throws an error. By default the value is true. |
| `android_app_name`string | The name of the app (suitable for display) |
| `android_class`string | A fully-qualified Activity class name for intent generation |
| `android_package`string | A fully-qualified package name for intent generation |
| `android_url`string | A custom scheme for the Android app |
| `availability`enum{in stock, out of stock, preorder, available for order, discontinued, pending, mark_as_sold, mark_as_expired} | Default value: `in stock` Availability of the product item |
| `brand`string | Brand of the product item |
| `category`string | Google product category for the item. If you need a custom category name instead, use field 'product_type' |
| `category_specific_fields`JSON object | JSON object containing category specific fields |
| `item_sub_type`enum {APPLIANCES, BABY_FEEDING, BABY_TRANSPORT, BEAUTY, BEDDING, CAMERAS, CELL_PHONES_AND_SMART_WATCHES, CLEANING_SUPPLIES, CLOTHING, CLOTHING_ACCESSORIES, COMPUTERS_AND_TABLETS, DIAPERING_AND_POTTY_TRAINING, ELECTRONICS_ACCESSORIES, FURNITURE, HEALTH, HOME_GOODS, JEWELRY, NURSERY, PRINTERS_AND_SCANNERS, PROJECTORS, SHOES_AND_FOOTWEAR, SOFTWARE, TOYS, TVS_AND_MONITORS, VIDEO_GAME_CONSOLES_AND_VIDEO_GAMES, WATCHES} | Default value: `"EMPTY"` item_sub_type |
| `checkout_url`URL | URL to add product item to cart and directly to checkout |
| `color`string | Color of the product item |
| `commerce_tax_category`enum{FB_ANIMAL, FB_ANIMAL_SUPP, FB_APRL, FB_APRL_ACCESSORIES, FB_APRL_ATHL_UNIF, FB_APRL_CASES, FB_APRL_CLOTHING, FB_APRL_COSTUME, FB_APRL_CSTM, FB_APRL_FORMAL, FB_APRL_HANDBAG, FB_APRL_JEWELRY, FB_APRL_SHOE, FB_APRL_SHOE_ACC, FB_APRL_SWIM, FB_APRL_SWIM_CHIL, FB_APRL_SWIM_CVR, FB_ARTS, FB_ARTS_HOBBY, FB_ARTS_PARTY, FB_ARTS_PARTY_GIFT_CARD, FB_ARTS_TICKET, FB_BABY, FB_BABY_BATH, FB_BABY_BLANKET, FB_BABY_DIAPER, FB_BABY_GIFT_SET, FB_BABY_HEALTH, FB_BABY_NURSING, FB_BABY_POTTY_TRN, FB_BABY_SAFE, FB_BABY_TOYS, FB_BABY_TRANSPORT, FB_BABY_TRANSPORT_ACC, FB_BAGS, FB_BAGS_BKPK, FB_BAGS_BOXES, FB_BAGS_BRFCS, FB_BAGS_CSMT_BAG, FB_BAGS_DFFL, FB_BAGS_DIPR, FB_BAGS_FNNY, FB_BAGS_GRMT, FB_BAGS_LUG_ACC, FB_BAGS_LUGG, FB_BAGS_MSGR, FB_BAGS_TOTE, FB_BAGS_TRN_CAS, FB_BLDG, FB_BLDG_ACC, FB_BLDG_CNSMB, FB_BLDG_FENCE, FB_BLDG_FUEL_TNK, FB_BLDG_HT_VNT, FB_BLDG_LOCK, FB_BLDG_MATRL, FB_BLDG_PLMB, FB_BLDG_PUMP, FB_BLDG_PWRS, FB_BLDG_S_ENG, FB_BLDG_STR_TANK, FB_BLDG_TL_ACC, FB_BLDG_TOOL, FB_BUSIND, FB_BUSIND_ADVERTISING, FB_BUSIND_AGRICULTURE, FB_BUSIND_AUTOMATION, FB_BUSIND_HEAVY_MACH, FB_BUSIND_LAB, FB_BUSIND_MEDICAL, FB_BUSIND_RETAIL, FB_BUSIND_SANITARY_CT, FB_BUSIND_SIGN, FB_BUSIND_STORAGE, FB_BUSIND_STORAGE_ACC, FB_BUSIND_WORK_GEAR, FB_CAMERA_ACC, FB_CAMERA_CAMERA, FB_CAMERA_OPTIC, FB_CAMERA_OPTICS, FB_CAMERA_PHOTO, FB_ELEC, FB_ELEC_ACC, FB_ELEC_ARCDADE, FB_ELEC_AUDIO, FB_ELEC_CIRCUIT, FB_ELEC_COMM, FB_ELEC_COMPUTER, FB_ELEC_GPS_ACC, FB_ELEC_GPS_NAV, FB_ELEC_GPS_TRK, FB_ELEC_MARINE, FB_ELEC_NETWORK, FB_ELEC_PART, FB_ELEC_PRINT, FB_ELEC_RADAR, FB_ELEC_SFTWR, FB_ELEC_SPEED_RDR, FB_ELEC_TELEVISION, FB_ELEC_TOLL, FB_ELEC_VID_GM_ACC, FB_ELEC_VID_GM_CNSL, FB_ELEC_VIDEO, FB_FOOD, FB_FURN, FB_FURN_BABY, FB_FURN_BENCH, FB_FURN_CART, FB_FURN_CHAIR, FB_FURN_CHAIR_ACC, FB_FURN_DIVIDE, FB_FURN_DIVIDE_ACC, FB_FURN_ENT_CTR, FB_FURN_FUTN, FB_FURN_FUTN_PAD, FB_FURN_OFFICE, FB_FURN_OFFICE_ACC, FB_FURN_OTTO, FB_FURN_OUTDOOR, FB_FURN_OUTDOOR_ACC, FB_FURN_SETS, FB_FURN_SHELVE_ACC, FB_FURN_SHLF, FB_FURN_SOFA, FB_FURN_SOFA_ACC, FB_FURN_STORAGE, FB_FURN_TABL, FB_FURN_TABL_ACC, FB_GENERIC_TAXABLE, FB_HLTH, FB_HLTH_HLTH, FB_HLTH_JWL_CR, FB_HLTH_LILP_BLM, FB_HLTH_LTN_SPF, FB_HLTH_PRSL_CR, FB_HLTH_SKN_CR, FB_HMGN, FB_HMGN_BATH, FB_HMGN_DCOR, FB_HMGN_EMGY, FB_HMGN_FPLC, FB_HMGN_FPLC_ACC, FB_HMGN_GS_SFT, FB_HMGN_HS_ACC, FB_HMGN_HS_APP, FB_HMGN_HS_SPL, FB_HMGN_KTCN, FB_HMGN_LAWN, FB_HMGN_LGHT, FB_HMGN_LINN, FB_HMGN_LT_ACC, FB_HMGN_OTDR, FB_HMGN_POOL, FB_HMGN_SCTY, FB_HMGN_SMK_ACC, FB_HMGN_UMBR, FB_HMGN_UMBR_ACC, FB_MDIA, FB_MDIA_BOOK, FB_MDIA_DVDS, FB_MDIA_MAG, FB_MDIA_MANL, FB_MDIA_MUSC, FB_MDIA_PRJ_PLN, FB_MDIA_SHT_MUS, FB_OFFC, FB_OFFC_BKAC, FB_OFFC_CRTS, FB_OFFC_DSKP, FB_OFFC_EQIP, FB_OFFC_FLNG, FB_OFFC_GNRL, FB_OFFC_INSTM, FB_OFFC_LP_DSK, FB_OFFC_MATS, FB_OFFC_NM_PLT, FB_OFFC_PPR_HNDL, FB_OFFC_PRSNT_SPL, FB_OFFC_SEALR, FB_OFFC_SHIP_SPL, FB_RLGN, FB_RLGN_CMNY, FB_RLGN_ITEM, FB_RLGN_WEDD, FB_SFTWR, FB_SFWR_CMPTR, FB_SFWR_DGTL_GD, FB_SFWR_GAME, FB_SHIPPING, FB_SPOR, FB_SPORT_ATHL, FB_SPORT_ATHL_CLTH, FB_SPORT_ATHL_SHOE, FB_SPORT_ATHL_SPRT, FB_SPORT_EXRCS, FB_SPORT_INDR_GM, FB_SPORT_OTDR_GM, FB_TOYS, FB_TOYS_EQIP, FB_TOYS_GAME, FB_TOYS_PZZL, FB_TOYS_TMRS, FB_TOYS_TOYS, FB_VEHI, FB_VEHI_PART} | Commerce tax category |
| `condition`enum{new, refurbished, used, used_like_new, used_good, used_fair, cpo, open_box_new} | Default value: `new` The condition of the product item |
| `currency`ISO 4217 Currency Code | Currency for the product item Required |
| `custom_data`dictionary { string : <string> } | Field used to specify custom variants for a specific catalog item. In this case, variants can be colors, materials, etc. <br> The field must be formatted as key-value pairs, and the keys must be defined in the product group. <br> For example: `custom_data: {"color":"red", "size": "L"}` |
| `custom_label_0`string | An optional custom label to associate with the product item. Max size: 100 |
| `custom_label_1`string | An optional custom label to associate with the product item. Max size: 100 |
| `custom_label_2`string | An optional custom label to associate with the product item. Max size: 100 |
| `custom_label_3`string | An optional custom label to associate with the product item. Max size: 100 |
| `custom_label_4`string | An optional custom label to associate with the product item. Max size: 100 |
| `custom_number_0`int64 | custom_number_0 |
| `custom_number_1`int64 | custom_number_1 |
| `custom_number_2`int64 | custom_number_2 |
| `custom_number_3`int64 | custom_number_3 |
| `custom_number_4`int64 | custom_number_4 |
| `description`string | Description of the product item. Max size: 5000 Supports Emoji |
| `expiration_date`string | Item's expiration date (YYYY-MM-DD) |
| `fb_product_category`string | Facebook product category for the item |
| `gender`enum{female, male, unisex} | Gender the product item is targeted towards |
| `gtin`string | Global trade ID of the product item |
| `image_url`URI | Required. URL of the product image. |
| `importer_address`JSON object | Address of the product importer |
| `street1`string | street1 |
| `street2`string | street2 |
| `city`string | city Required |
| `region`string | region |
| `postal_code`string | postal_code |
| `country`enum {AC, AD, AE, AF, AG, AI, AL, AM, AN, AO, AQ, AR, AS, AT, AU, AW, AX, AZ, BA, BB, BD, BE, BF, BG, BH, BI, BJ, BL, BM, BN, BO, BQ, BR, BS, BT, BV, BW, BY, BZ, CA, CC, CD, CF, CG, CH, CI, CK, CL, CM, CN, CO, CR, CU, CV, CW, CX, CY, CZ, DE, DJ, DK, DM, DO, DZ, EC, EE, EG, EH, ER, ES, ET, FI, FJ, FK, FM, FO, FR, GA, GB, GD, GE, GF, GG, GH, GI, GL, GM, GN, GP, GQ, GR, GS, GT, GU, GW, GY, HK, HM, HN, HR, HT, HU, ID, IE, IL, IM, IN, IO, IQ, IR, IS, IT, JE, JM, JO, JP, KE, KG, KH, KI, KM, KN, KP, KR, KW, KY, KZ, LA, LB, LC, LI, LK, LR, LS, LT, LU, LV, LY, MA, MC, MD, ME, MF, MG, MH, MK, ML, MM, MN, MO, MP, MQ, MR, MS, MT, MU, MV, MW, MX, MY, MZ, NA, NC, NE, NF, NG, NI, NL, NO, NP, NR, NU, NZ, OM, PA, PE, PF, PG, PH, PK, PL, PM, PN, PR, PS, PT, PW, PY, QA, RE, RO, RS, RU, RW, SA, SB, SC, SD, SE, SG, SH, SI, SJ, SK, SL, SM, SN, SO, SR, SS, ST, SV, SX, SY, SZ, TC, TD, TF, TG, TH, TJ, TK, TL, TM, TN, TO, TR, TT, TV, TW, TZ, UA, UG, UM, US, UY, UZ, VA, VC, VE, VG, VI, VN, VU, WF, WS, XK, YE, YT, ZA, ZM, ZW} | country Required |
| `importer_name`string | Name of the product Importer |
| `inventory`int64 | Inventory count for the product item |
| `ios_app_name`string | The name of the app (suitable for display) |
| `ios_app_store_id`int64 | The app ID for the App Store |
| `ios_url`string | A custom scheme for the iOS app |
| `ipad_app_name`string | The name of the app (suitable for display) |
| `ipad_app_store_id`int64 | The app ID for the App Store |
| `ipad_url`string | A custom scheme for the iPhone app |
| `iphone_app_name`string | The name of the app (suitable for display) |
| `iphone_app_store_id`int64 | The app ID for the App Store |
| `iphone_url`string | A custom scheme for the iPhone app |
| `manufacturer_info`string | The Manufacturer Information such as Name, address, etc... |
| `manufacturer_part_number`string | Manufacturer's ID for the product item |
| `marked_for_product_launch`enum{default, marked, not_marked} | Whether this product should be marked for a product launch and hide it from shops until product launch is created with this product. |
| `material`string | Material of the product item<br>Max size: 200 |
| `mobile_link`URI | Link to a mobile-optimized external product page |
| `name`string | Name/title of the product item RequiredSupports Emoji |
| `ordering_index`int64 | Index used for ordering items within a group |
| `origin_country`enum {AC, AD, AE, AF, AG, AI, AL, AM, AN, AO, AQ, AR, AS, AT, AU, AW, AX, AZ, BA, BB, BD, BE, BF, BG, BH, BI, BJ, BL, BM, BN, BO, BQ, BR, BS, BT, BV, BW, BY, BZ, CA, CC, CD, CF, CG, CH, CI, CK, CL, CM, CN, CO, CR, CU, CV, CW, CX, CY, CZ, DE, DJ, DK, DM, DO, DZ, EC, EE, EG, EH, ER, ES, ET, FI, FJ, FK, FM, FO, FR, GA, GB, GD, GE, GF, GG, GH, GI, GL, GM, GN, GP, GQ, GR, GS, GT, GU, GW, GY, HK, HM, HN, HR, HT, HU, ID, IE, IL, IM, IN, IO, IQ, IR, IS, IT, JE, JM, JO, JP, KE, KG, KH, KI, KM, KN, KP, KR, KW, KY, KZ, LA, LB, LC, LI, LK, LR, LS, LT, LU, LV, LY, MA, MC, MD, ME, MF, MG, MH, MK, ML, MM, MN, MO, MP, MQ, MR, MS, MT, MU, MV, MW, MX, MY, MZ, NA, NC, NE, NF, NG, NI, NL, NO, NP, NR, NU, NZ, OM, PA, PE, PF, PG, PH, PK, PL, PM, PN, PR, PS, PT, PW, PY, QA, RE, RO, RS, RU, RW, SA, SB, SC, SD, SE, SG, SH, SI, SJ, SK, SL, SM, SN, SO, SR, SS, ST, SV, SX, SY, SZ, TC, TD, TF, TG, TH, TJ, TK, TL, TM, TN, TO, TR, TT, TV, TW, TZ, UA, UG, UM, US, UY, UZ, VA, VC, VE, VG, VI, VN, VU, WF, WS, XK, YE, YT, ZA, ZM, ZW} | Product Country of Origin |
| `pattern`string | Pattern of the product item |
| `price`int64 | Price of the item with 2 digits added for cents (ex: use "100" for 1 or "599" for 5.99) Required |
| `product_priority_1`float | product_priority_1 |
| `product_priority_2`float | product_priority_2 |
| `product_priority_3`float | product_priority_3 |
| `product_priority_4`float | product_priority_4 |
| `product_type`string | Retailer defined category of the product item. Max size: 750 |
| `retailer_id`string | A unique identifier for this item (which can be a variant for a product). This field is required. |
| `retailer_product_group_id`string | Item group ID that this product is a variant of |
| `return_policy_days`int64 | return_policy_days |
| `rich_text_description`string | Rich-text description of the product |
| `sale_price`int64 | Sale price of the item with 2 digits added for cents (ex: use "100" for 1 or "599" for 5.99) |
| `sale_price_end_date`datetime | Date when the sale price ends |
| `sale_price_start_date`datetime | Date when the sale price starts |
| `short_description`string | A brief description of the product |
| `size`string | Size of the product item |
| `start_date`string | Date when the product started to exist |
| `url`URI | URL of the product item |
| `visibility`enum{staging, published} | Default value: `published` Visibility of the product item |
| `wa_compliance_category`enum {DEFAULT, COUNTRY_ORIGIN_EXEMPT} | wa_compliance_category |
| `windows_phone_app_id`string | The app ID (a GUID) for app store |
| `windows_phone_app_name`string | The name of the app (suitable for display) |
| `windows_phone_url`string | A custom scheme for the Windows Phone app |

### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview/#read-after-write) and will read the node represented by `id` in the return type.

 Struct {

`id`: numeric string,

}

### Error Codes

| Error | Description |
| --- | --- |
| 10800 | Duplicate retailer_id when attempting to create a store collection |
| 100 | Invalid parameter |
| 200 | Permissions error |
| 10801 | Either "file" or "url" must be specified |

## Updating

You can update a [ProductItem](https://developers.facebook.com/docs/marketing-api/reference/product-item/) by making a POST request to [`/{product_item_id}`](https://developers.facebook.com/docs/marketing-api/reference/product-item/).

### Parameters

| Parameter | Description |
| --- | --- |
| `additional_image_urls`list<URL> | Additional product image URLs |
| `additional_variant_attributes`JSON object {string : string} | Additional attributes to distinguish the product in its variant group (ex: {"Scent" : "Fruity", "Style" : "Classic"}) |
| `age_group`enum {adult, all ages, infant, kids, newborn, teen, toddler} | The age group that the item is targeted towards |
| `android_app_name`string | The name of the app (suitable for display) |
| `android_class`string | A fully-qualified Activity class name for intent generation |
| `android_package`string | A fully-qualified package name for intent generation |
| `android_url`string | A custom scheme for the Android app |
| `availability`enum{in stock, out of stock, preorder, available for order, discontinued, pending, mark_as_sold, mark_as_expired} | Availability of the product item |
| `brand`string | Brand of the product item |
| `category`string | Category of the product item |
| `category_specific_fields`JSON object | JSON object containing category specific fields |
| `item_sub_type`enum {APPLIANCES, BABY_FEEDING, BABY_TRANSPORT, BEAUTY, BEDDING, CAMERAS, CELL_PHONES_AND_SMART_WATCHES, CLEANING_SUPPLIES, CLOTHING, CLOTHING_ACCESSORIES, COMPUTERS_AND_TABLETS, DIAPERING_AND_POTTY_TRAINING, ELECTRONICS_ACCESSORIES, FURNITURE, HEALTH, HOME_GOODS, JEWELRY, NURSERY, PRINTERS_AND_SCANNERS, PROJECTORS, SHOES_AND_FOOTWEAR, SOFTWARE, TOYS, TVS_AND_MONITORS, VIDEO_GAME_CONSOLES_AND_VIDEO_GAMES, WATCHES} | Default value: `"EMPTY"` item_sub_type |
| `checkout_url`URL | URL to add product item to cart and directly to checkout |
| `color`string | Color of the product item |
| `commerce_tax_category`enum{FB_ANIMAL, FB_ANIMAL_SUPP, FB_APRL, FB_APRL_ACCESSORIES, FB_APRL_ATHL_UNIF, FB_APRL_CASES, FB_APRL_CLOTHING, FB_APRL_COSTUME, FB_APRL_CSTM, FB_APRL_FORMAL, FB_APRL_HANDBAG, FB_APRL_JEWELRY, FB_APRL_SHOE, FB_APRL_SHOE_ACC, FB_APRL_SWIM, FB_APRL_SWIM_CHIL, FB_APRL_SWIM_CVR, FB_ARTS, FB_ARTS_HOBBY, FB_ARTS_PARTY, FB_ARTS_PARTY_GIFT_CARD, FB_ARTS_TICKET, FB_BABY, FB_BABY_BATH, FB_BABY_BLANKET, FB_BABY_DIAPER, FB_BABY_GIFT_SET, FB_BABY_HEALTH, FB_BABY_NURSING, FB_BABY_POTTY_TRN, FB_BABY_SAFE, FB_BABY_TOYS, FB_BABY_TRANSPORT, FB_BABY_TRANSPORT_ACC, FB_BAGS, FB_BAGS_BKPK, FB_BAGS_BOXES, FB_BAGS_BRFCS, FB_BAGS_CSMT_BAG, FB_BAGS_DFFL, FB_BAGS_DIPR, FB_BAGS_FNNY, FB_BAGS_GRMT, FB_BAGS_LUG_ACC, FB_BAGS_LUGG, FB_BAGS_MSGR, FB_BAGS_TOTE, FB_BAGS_TRN_CAS, FB_BLDG, FB_BLDG_ACC, FB_BLDG_CNSMB, FB_BLDG_FENCE, FB_BLDG_FUEL_TNK, FB_BLDG_HT_VNT, FB_BLDG_LOCK, FB_BLDG_MATRL, FB_BLDG_PLMB, FB_BLDG_PUMP, FB_BLDG_PWRS, FB_BLDG_S_ENG, FB_BLDG_STR_TANK, FB_BLDG_TL_ACC, FB_BLDG_TOOL, FB_BUSIND, FB_BUSIND_ADVERTISING, FB_BUSIND_AGRICULTURE, FB_BUSIND_AUTOMATION, FB_BUSIND_HEAVY_MACH, FB_BUSIND_LAB, FB_BUSIND_MEDICAL, FB_BUSIND_RETAIL, FB_BUSIND_SANITARY_CT, FB_BUSIND_SIGN, FB_BUSIND_STORAGE, FB_BUSIND_STORAGE_ACC, FB_BUSIND_WORK_GEAR, FB_CAMERA_ACC, FB_CAMERA_CAMERA, FB_CAMERA_OPTIC, FB_CAMERA_OPTICS, FB_CAMERA_PHOTO, FB_ELEC, FB_ELEC_ACC, FB_ELEC_ARCDADE, FB_ELEC_AUDIO, FB_ELEC_CIRCUIT, FB_ELEC_COMM, FB_ELEC_COMPUTER, FB_ELEC_GPS_ACC, FB_ELEC_GPS_NAV, FB_ELEC_GPS_TRK, FB_ELEC_MARINE, FB_ELEC_NETWORK, FB_ELEC_PART, FB_ELEC_PRINT, FB_ELEC_RADAR, FB_ELEC_SFTWR, FB_ELEC_SPEED_RDR, FB_ELEC_TELEVISION, FB_ELEC_TOLL, FB_ELEC_VID_GM_ACC, FB_ELEC_VID_GM_CNSL, FB_ELEC_VIDEO, FB_FOOD, FB_FURN, FB_FURN_BABY, FB_FURN_BENCH, FB_FURN_CART, FB_FURN_CHAIR, FB_FURN_CHAIR_ACC, FB_FURN_DIVIDE, FB_FURN_DIVIDE_ACC, FB_FURN_ENT_CTR, FB_FURN_FUTN, FB_FURN_FUTN_PAD, FB_FURN_OFFICE, FB_FURN_OFFICE_ACC, FB_FURN_OTTO, FB_FURN_OUTDOOR, FB_FURN_OUTDOOR_ACC, FB_FURN_SETS, FB_FURN_SHELVE_ACC, FB_FURN_SHLF, FB_FURN_SOFA, FB_FURN_SOFA_ACC, FB_FURN_STORAGE, FB_FURN_TABL, FB_FURN_TABL_ACC, FB_GENERIC_TAXABLE, FB_HLTH, FB_HLTH_HLTH, FB_HLTH_JWL_CR, FB_HLTH_LILP_BLM, FB_HLTH_LTN_SPF, FB_HLTH_PRSL_CR, FB_HLTH_SKN_CR, FB_HMGN, FB_HMGN_BATH, FB_HMGN_DCOR, FB_HMGN_EMGY, FB_HMGN_FPLC, FB_HMGN_FPLC_ACC, FB_HMGN_GS_SFT, FB_HMGN_HS_ACC, FB_HMGN_HS_APP, FB_HMGN_HS_SPL, FB_HMGN_KTCN, FB_HMGN_LAWN, FB_HMGN_LGHT, FB_HMGN_LINN, FB_HMGN_LT_ACC, FB_HMGN_OTDR, FB_HMGN_POOL, FB_HMGN_SCTY, FB_HMGN_SMK_ACC, FB_HMGN_UMBR, FB_HMGN_UMBR_ACC, FB_MDIA, FB_MDIA_BOOK, FB_MDIA_DVDS, FB_MDIA_MAG, FB_MDIA_MANL, FB_MDIA_MUSC, FB_MDIA_PRJ_PLN, FB_MDIA_SHT_MUS, FB_OFFC, FB_OFFC_BKAC, FB_OFFC_CRTS, FB_OFFC_DSKP, FB_OFFC_EQIP, FB_OFFC_FLNG, FB_OFFC_GNRL, FB_OFFC_INSTM, FB_OFFC_LP_DSK, FB_OFFC_MATS, FB_OFFC_NM_PLT, FB_OFFC_PPR_HNDL, FB_OFFC_PRSNT_SPL, FB_OFFC_SEALR, FB_OFFC_SHIP_SPL, FB_RLGN, FB_RLGN_CMNY, FB_RLGN_ITEM, FB_RLGN_WEDD, FB_SFTWR, FB_SFWR_CMPTR, FB_SFWR_DGTL_GD, FB_SFWR_GAME, FB_SHIPPING, FB_SPOR, FB_SPORT_ATHL, FB_SPORT_ATHL_CLTH, FB_SPORT_ATHL_SHOE, FB_SPORT_ATHL_SPRT, FB_SPORT_EXRCS, FB_SPORT_INDR_GM, FB_SPORT_OTDR_GM, FB_TOYS, FB_TOYS_EQIP, FB_TOYS_GAME, FB_TOYS_PZZL, FB_TOYS_TMRS, FB_TOYS_TOYS, FB_VEHI, FB_VEHI_PART} | Commerce tax category |
| `condition`enum{new, refurbished, used, used_like_new, used_good, used_fair, cpo, open_box_new} | The condition of the product item |
| `currency`ISO 4217 Currency Code | Currency for the product item |
| `custom_data`dictionary { string : <string> } | Key value pair used to store extra data to differentiate variants. Example {"Scent" : "Fruity", "Style" : "Classic"} |
| `custom_label_0`string | An optional custom label to associate with the product item. Max size: 100 |
| `custom_label_1`string | An optional custom label to associate with the product item. Max size: 100 |
| `custom_label_2`string | An optional custom label to associate with the product item. Max size: 100 |
| `custom_label_3`string | An optional custom label to associate with the product item. Max size: 100 |
| `custom_label_4`string | An optional custom label to associate with the product item. Max size: 100 |
| `description`string | Description of the product item. Max size: 5000 Supports Emoji |
| `expiration_date`string | Item's expiration date (YYYY-MM-DD) |
| `fb_product_category`string | Facebook product category for the item |
| `gender`enum{female, male, unisex} | Gender the product item is targeted towards |
| `gtin`string | Global trade ID of the product item |
| `image_url`URI | URL of the product image |
| `importer_address`JSON object | Product importer address |
| `street1`string | street1 |
| `street2`string | street2 |
| `city`string | city |
| `region`string | region |
| `postal_code`string | postal_code |
| `country`enum {AC, AD, AE, AF, AG, AI, AL, AM, AN, AO, AQ, AR, AS, AT, AU, AW, AX, AZ, BA, BB, BD, BE, BF, BG, BH, BI, BJ, BL, BM, BN, BO, BQ, BR, BS, BT, BV, BW, BY, BZ, CA, CC, CD, CF, CG, CH, CI, CK, CL, CM, CN, CO, CR, CU, CV, CW, CX, CY, CZ, DE, DJ, DK, DM, DO, DZ, EC, EE, EG, EH, ER, ES, ET, FI, FJ, FK, FM, FO, FR, GA, GB, GD, GE, GF, GG, GH, GI, GL, GM, GN, GP, GQ, GR, GS, GT, GU, GW, GY, HK, HM, HN, HR, HT, HU, ID, IE, IL, IM, IN, IO, IQ, IR, IS, IT, JE, JM, JO, JP, KE, KG, KH, KI, KM, KN, KP, KR, KW, KY, KZ, LA, LB, LC, LI, LK, LR, LS, LT, LU, LV, LY, MA, MC, MD, ME, MF, MG, MH, MK, ML, MM, MN, MO, MP, MQ, MR, MS, MT, MU, MV, MW, MX, MY, MZ, NA, NC, NE, NF, NG, NI, NL, NO, NP, NR, NU, NZ, OM, PA, PE, PF, PG, PH, PK, PL, PM, PN, PR, PS, PT, PW, PY, QA, RE, RO, RS, RU, RW, SA, SB, SC, SD, SE, SG, SH, SI, SJ, SK, SL, SM, SN, SO, SR, SS, ST, SV, SX, SY, SZ, TC, TD, TF, TG, TH, TJ, TK, TL, TM, TN, TO, TR, TT, TV, TW, TZ, UA, UG, UM, US, UY, UZ, VA, VC, VE, VG, VI, VN, VU, WF, WS, XK, YE, YT, ZA, ZM, ZW} | country |
| `importer_name`string | Product importer name |
| `inventory`int64 | Inventory count for the product item |
| `ios_app_name`string | The name of the app (suitable for display) |
| `ios_app_store_id`int64 | The app ID for the App Store |
| `ios_url`string | A custom scheme for the iOS app |
| `ipad_app_name`string | The name of the app (suitable for display) |
| `ipad_app_store_id`int64 | The app ID for the App Store |
| `ipad_url`string | A custom scheme for the iPhone app |
| `iphone_app_name`string | The name of the app (suitable for display) |
| `iphone_app_store_id`int64 | The app ID for the App Store |
| `iphone_url`string | A custom scheme for the iPhone app |
| `launch_date`string | Launch Date of product in ISO 8061 format (YYYY-MM-DDTHH:MM:SS+HH:MM) |
| `live_special_price`string | A special price for the product item during a live video. The price has 2 digits added for cents (ex: use "100" for 1 or "599" for 5.99). The field accepts 0 as a value and also accepts the empty string (ex: "") to unset the live special price for the product item. |
| `manufacturer_info`string | The Manufacturer Information such as Manufacturer name, address, etc... |
| `manufacturer_part_number`string | Manufacturer's ID for the product item |
| `marked_for_product_launch`enum{default, marked, not_marked} | Whether this product should be marked for a product launch and hide it from shops until product launch is created with this product. |
| `material`string | Material of the product item<br>Max size: 200 |
| `mobile_link`URI | Link to a mobile-optimized external product page |
| `name`string | Name/title of the product item Supports Emoji |
| `ordering_index`int64 | Index used for ordering items within a group |
| `origin_country`enum {AC, AD, AE, AF, AG, AI, AL, AM, AN, AO, AQ, AR, AS, AT, AU, AW, AX, AZ, BA, BB, BD, BE, BF, BG, BH, BI, BJ, BL, BM, BN, BO, BQ, BR, BS, BT, BV, BW, BY, BZ, CA, CC, CD, CF, CG, CH, CI, CK, CL, CM, CN, CO, CR, CU, CV, CW, CX, CY, CZ, DE, DJ, DK, DM, DO, DZ, EC, EE, EG, EH, ER, ES, ET, FI, FJ, FK, FM, FO, FR, GA, GB, GD, GE, GF, GG, GH, GI, GL, GM, GN, GP, GQ, GR, GS, GT, GU, GW, GY, HK, HM, HN, HR, HT, HU, ID, IE, IL, IM, IN, IO, IQ, IR, IS, IT, JE, JM, JO, JP, KE, KG, KH, KI, KM, KN, KP, KR, KW, KY, KZ, LA, LB, LC, LI, LK, LR, LS, LT, LU, LV, LY, MA, MC, MD, ME, MF, MG, MH, MK, ML, MM, MN, MO, MP, MQ, MR, MS, MT, MU, MV, MW, MX, MY, MZ, NA, NC, NE, NF, NG, NI, NL, NO, NP, NR, NU, NZ, OM, PA, PE, PF, PG, PH, PK, PL, PM, PN, PR, PS, PT, PW, PY, QA, RE, RO, RS, RU, RW, SA, SB, SC, SD, SE, SG, SH, SI, SJ, SK, SL, SM, SN, SO, SR, SS, ST, SV, SX, SY, SZ, TC, TD, TF, TG, TH, TJ, TK, TL, TM, TN, TO, TR, TT, TV, TW, TZ, UA, UG, UM, US, UY, UZ, VA, VC, VE, VG, VI, VN, VU, WF, WS, XK, YE, YT, ZA, ZM, ZW} | Product country of origin |
| `pattern`string | Pattern of the product item |
| `price`int64 | Price of the item with 2 digits added for cents (ex: use "100" for 1 or "599" for 5.99) |
| `product_priority_0`float | product_priority_0 |
| `product_priority_1`float | product_priority_1 |
| `product_priority_2`float | product_priority_2 |
| `product_priority_3`float | product_priority_3 |
| `product_priority_4`float | product_priority_4 |
| `product_type`string | Retailer defined category of the product item. Max size: 750 |
| `retailer_id`string | Retailer ID for a product item. (Internal only) |
| `return_policy_days`int64 | Return policy days |
| `sale_price`int64 | Sale price of the item with 2 digits added for cents (ex: use "100" for 1 or "599" for 5.99) |
| `sale_price_end_date`datetime | Date when the sale price ends |
| `sale_price_start_date`datetime | Date when the sale price starts |
| `short_description`string | A brief description of the product |
| `size`string | Size of the product item |
| `start_date`string | Date when the product started to exist |
| `url`URI | URL of the product item |
| `visibility`enum{staging, published} | Visibility of the product item |
| `wa_compliance_category`enum {DEFAULT, COUNTRY_ORIGIN_EXEMPT} | Product compliance category. Only for Whatsapp businesses in India |
| `windows_phone_app_id`string | The app ID (a GUID) for app store |
| `windows_phone_app_name`string | The name of the app (suitable for display) |
| `windows_phone_url`string | A custom scheme for the Windows Phone app |

### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview/#read-after-write) and will read the node to which you POSTed.

 Struct {

`success`: bool,

}

### Error Codes

| Error | Description |
| --- | --- |
| 100 | Invalid parameter |
| 200 | Permissions error |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |
| 190 | Invalid OAuth 2.0 Access Token |

## Deleting

You can delete a [ProductItem](https://developers.facebook.com/docs/marketing-api/reference/product-item/) by making a DELETE request to [`/{product_item_id}`](https://developers.facebook.com/docs/marketing-api/reference/product-item/).

### Parameters

This endpoint doesn't have any parameters.

### Return Type

 Struct {

`success`: bool,

}

### Error Codes

| Error | Description |
| --- | --- |
| 100 | Invalid parameter |
| 200 | Permissions error |
| 190 | Invalid OAuth 2.0 Access Token |
| 801 | Invalid operation |
