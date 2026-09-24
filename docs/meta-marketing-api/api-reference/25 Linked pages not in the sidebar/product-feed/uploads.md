<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-feed/uploads | Saved: 2026-09-19 | Converted from the web page: Meta's "View as Markdown" export returns an error for this page -->

# Product Feed Uploads

Ads in WhatsApp Status are available via the Marketing API. [Learn more about ads in WhatsApp Status.](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-in-whatsapp-status)

## Reading

GraphProductFeedUploadsEdge

 Since uploads happen automatically based on a schedule, you may need to get a list of recent uploads. The list includes both manual and scheduled uploads. To get the list, make an HTTP GET call to:

```
https://graph.facebook.com/<PRODUCT_FEED_ID>/uploads

```

#### Example

Select language

HTTPPHP SDKJavaScript SDKAndroid SDKiOS SDK

**

---

```
GET /v25.0/{product-feed-id}/uploads HTTP/1.1
Host: graph.facebook.com

```

 Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bproduct-feed-id%7D%2Fuploads&version=v25.0)

 If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

 This endpoint doesn't have any parameters.

#### Fields

 Reading from this edge will return a JSON formatted result:

```

{
"data": []
}

```

##### data

 A list of [ProductFeedUpload](https://developers.facebook.com/docs/marketing-api/reference/product-feed-upload) nodes.

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |
| 200 | Permissions error |

## Creating

```
curl \
-F "url=http://www.example.com/sample_feed.tsv" \
-F "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<API_VERSION>/<PRODUCT_FEED_ID>/uploads

```

 You can't perform this operation on this endpoint.

## Updating

 You can't perform this operation on this endpoint.

## Deleting

 You can't perform this operation on this endpoint.
