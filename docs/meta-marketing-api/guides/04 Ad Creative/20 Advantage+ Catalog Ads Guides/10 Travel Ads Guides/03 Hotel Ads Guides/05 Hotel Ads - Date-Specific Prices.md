<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/hotel-ads/dynamic-pricing | Saved: 2026-09-19 -->

# Hotel Ads - Date-Specific Pricing



In a [static hotel feed](https://developers.facebook.com/documentation/ads-commerce/marketing-api/hotel-ads/catalog), you provide a single price for each hotel. This price can't vary based on check-in date, length of stay, or room type. To display more accurate prices in your ads based on these variables, use dynamic (date-specific) pricing to provide prices for individual combinations of date, room type, and length of stay. Once you upload the pricing data, you can use [hotel template tags](https://developers.facebook.com/documentation/ads-commerce/marketing-api/hotel-ads/template-tags) to display these prices in your ads.

Use [batch upload room types and pricing data](#batch-upload) to share pricing details with Facebook.

See [room and pricing parameters](#pricing-parameters) for an explanation of all parameters.

## Batch upload room types and pricing data {#batch-upload}

Batch upload consists of two parts:

1. [Upload Room Types](#upload-room-types)
2. [Upload Pricing](#upload-pricing)

If you use batch upload, limit uploads to 50 MB per file, approximately 50,000 items in a file. Make more frequent, smaller updates for pricing variables.

---

### Upload room types {#upload-room-types}

Upload one or more files with room types using the [Hotel Rooms Batch API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/hotel_rooms_batch).

**Note**: If you don't have different room types, you can skip this step.

```
curl \
  -X POST \
  -F file=@hotel_rooms_data_xml.xml \
  -F "access_token=<ACCESS_TOKEN>" \
  https://graph.facebook.com/<API_VERSION>/<PRODUCT_CATALOG_ID>/hotel_rooms_batch
```

#### Room types file format

You can provide the room types in **XML** format; see [sample](https://lookaside.facebook.com/developers/resources/?id=dat_hotel_rooms.xml).

You should identify each hotel by `<property>` in the  `<PropertyDataSet>` XML node and provide room type by `<RoomData>`. Your file must begin with a `<?xml` declaration tag.

For more details on updating and deleting room types through batch API, see [Hotel Rooms, Batch Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/hotel_rooms_batch).

---
### Upload pricing {#upload-pricing}

Upload one or more files with pricing details using the [Pricing Variable Batch API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/pricing_variables_batch). You can upload pricing details with or without room types.

**Note**: If you only have a very small number of rooms, you can also use the [Hotel Room API](https://developers.facebook.com/docs/marketing-api/reference/hotel-room) to create room types and setup pricing.

```
curl \
  -X POST \
  -F file=@pricings_data_xml.xml \
  -F "access_token=<ACCESS_TOKEN>" \
  https://graph.facebook.com/<API_VERSION>/<PRODUCT_CATALOG_ID>/pricing_variables_batch
```

#### Pricing file format {#batch-pricing-variable-format}

Before you upload pricing, make sure the hotels for these rooms already exist in the catalog. You can provide pricing variables in this format:

| File Format and Sample | Description |
| --- | --- |
| XML with room types \| [XML Sample](https://lookaside.facebook.com/developers/resources/?id=dat_hotel_pricing_variables_room_types.xml) | **Make sure the room types you want to provide pricing for already exist.**<br><br>Specify pricing (`<Baserate>`) **within** each room type (`<RoomBundle>`) based on the combination of check in date (`<Checkin>`) and length of stay (`<Nights>`). <br>The file must begin with the `<?xml` declaration tag. |
| XML without room types \| [XML Sample](https://lookaside.facebook.com/developers/resources/?id=dat_hotel_no_room_pricing_variables.xml) | Specify pricing (`<Baserate>`) for each combination of hotel ID (`<Property>`), check in date (`<Checkin>`), and length of stay (`<Nights>`). <br>The file must begin with the `<?xml` declaration tag. |

For more details on how to update and delete pricing variables through batch, see [Pricing Variable Batch Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/pricing_variables_batch).

## Room and pricing parameters {#pricing-parameters}

| Field Name and Type | Description |
| --- | --- |
| `Property`<br><br>type: string | Required. A unique identifier of the hotel provided by advertiser as `hotel_id` in the hotel feed. |
| `RoomID`<br><br>type: string | Required. A unique identifier of the room type provided by advertiser. |
| `Name`<br><br>type: string | Required. Name of the hotel room type. |
| `Description`<br><br>type: string | Required. Description of the hotel room type. |
| `BasePrice`<br><br>type: float | Required. The lowest price of the hotel room. You should include the currency.<br><br>Example: `159 USD` |
| `URL`<br><br>type: string | Link to the hotel room page. |
| `CheckinDate`<br><br>type: date | Required. Check in date for the `price`. You can specify up to 180 days from the date the feed is uploaded. Use ISO‑8601 (_YYYY‑MM‑DD_). |
| `Nights`<br><br>type: int | Required. Number of nights staying in the hotel for the `price`. Max value: 14 |
| `Baserate`<br><br>type: float | Required. Price based on `checkin_date` and `length_of_stay`.<br><br>Example: `180` |
| `Tax`<br><br>type: float | Required. Tax value for the stay. |
| `OtherFees`<br><br>type: float | Required. Applicable fee for the stay. |
| `SalePrice`<br><br>type: float | The discounted price if applicable.<br><br>Example: `159` |
| `SalePriceTax`<br><br>type: float | Tax value for the discounted price. |

