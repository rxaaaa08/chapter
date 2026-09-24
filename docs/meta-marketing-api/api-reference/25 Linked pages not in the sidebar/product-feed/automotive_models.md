<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-feed/automotive_models | Saved: 2026-09-19 | Converted from the web page: Meta's "View as Markdown" export returns an error for this page -->

# Product Feed Automotive Models

Ads in WhatsApp Status are available via the Marketing API. [Learn more about ads in WhatsApp Status.](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-in-whatsapp-status)

## Reading

Retrieve automotive models from a product feed.

#### Example

Select language

HTTPPHP SDKJavaScript SDKAndroid SDKiOS SDK

**

---

```
GET /v25.0/{product-feed-id}/automotive_models HTTP/1.1
Host: graph.facebook.com

```

 Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bproduct-feed-id%7D%2Fautomotive_models&version=v25.0)

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

 A list of AutomotiveModel nodes.

##### paging

 For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

##### summary

 Aggregated information about the edge, such as counts. Specify the fields to fetch in the summary param (like summary=total_count).

| Field | Description |
| --- | --- |
| `total_count`<br>*unsigned int32* | Total number of automotive models returned by the query |

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |

## Creating

 You can't perform this operation on this endpoint.

## Updating

 You can't perform this operation on this endpoint.

## Deleting

 You can't perform this operation on this endpoint.
