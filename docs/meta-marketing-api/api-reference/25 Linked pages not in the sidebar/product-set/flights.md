<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-set/flights | Saved: 2026-09-19 | Converted from the web page: Meta's "View as Markdown" export returns an error for this page -->

# Product Set Flights

Ads in WhatsApp Status are available via the Marketing API. [Learn more about ads in WhatsApp Status.](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-in-whatsapp-status)

## Reading

Returns the flights belonging to this product set

#### Example

Select language

HTTPPHP SDKJavaScript SDKAndroid SDKiOS SDK

**

---

```
GET /v25.0/{product-set-id}/flights HTTP/1.1
Host: graph.facebook.com

```

 Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bproduct-set-id%7D%2Fflights&version=v25.0)

 If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `bulk_pagination`<br>*boolean* | Used for iterating over the edge in large chunks |
| `filter`<br>*A JSON-encoded rule* | JSON-encoded WCA rule expression representing the filter to be applied for the edge |

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

 A list of [Flight](https://developers.facebook.com/docs/graph-api/reference/flight) nodes.

##### paging

 For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

##### summary

 Aggregated information about the edge, such as counts. Specify the fields to fetch in the summary param (like summary=total_count).

| Field | Description |
| --- | --- |
| `total_count`<br>*unsigned int32* | Total number of flights returned by the query |

#### Error Codes

| Error Code | Description |
| --- | --- |
| 270 | This Ads API request is not allowed for apps with development access level (Development access is by default for all apps, please request for upgrade). Make sure that the access token belongs to a user that is both admin of the app and admin of the ad account |
| 100 | Invalid parameter |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |

## Creating

 You can't perform this operation on this endpoint.

## Updating

 You can't perform this operation on this endpoint.

## Deleting

 You can't perform this operation on this endpoint.
