<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-set/vehicle_offers | Saved: 2026-09-19 | Converted from the web page: Meta's "View as Markdown" export returns an error for this page -->

# Product Set Vehicle Offers

Ads in WhatsApp Status are available via the Marketing API. [Learn more about ads in WhatsApp Status.](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-in-whatsapp-status)

## Reading

ProductSetVehicleOffers.

#### Example

Select language

HTTPPHP SDKJavaScript SDKAndroid SDKiOS SDK

**

---

```
GET /v25.0/{product-set-id}/vehicle_offers HTTP/1.1
Host: graph.facebook.com

```

 Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bproduct-set-id%7D%2Fvehicle_offers&version=v25.0)

 If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `bulk_pagination`<br>*boolean* | bulk_pagination |
| `filter`<br>*A JSON-encoded rule* | filter |

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

 A list of VehicleOffer nodes.

##### paging

 For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

##### summary

 Aggregated information about the edge, such as counts. Specify the fields to fetch in the summary param (like summary=total_count).

| Field | Description |
| --- | --- |
| `total_count`<br>*unsigned int32* | total_count |

#### Error Codes

| Error Code | Description |
| --- | --- |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |
| 200 | Permissions error |

## Creating

 You can't perform this operation on this endpoint.

## Updating

 You can't perform this operation on this endpoint.

## Deleting

 You can't perform this operation on this endpoint.
