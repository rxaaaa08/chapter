<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/account-event-metrics | Saved: 2026-09-19 -->

# "Conversions API Gateway and Signals Gateway Control Plane API: Reference"



**Warning:** Starting from Conversions API Gateway and Signals Gateway v2.2.0, up-to-date versions of the Control Plane API reference docs, including examples with sample data, can be accessed inside your gateway UI. To find these docs:

* Click on **Settings**
* Choose **API accounts**
* Click the **API Reference** link at the top of the API accounts page

## Get Account Event Metrics by Time Frame

Gets account specific event metrics at pixel and event level, provided admin has access to manage the account.

#### Schema  

```
POST https://{capig_domain}/capig/graphql/
<hr/>

query HomeViewQuery($tenantId: ID!, $pixelIds: [String!], $timeWindow: Int) {
  tenantQueries(tenantId: $tenantId) {
    eventMetrics(pixelIds: $pixelIds, timeWindowMin: $timeWindow) {
      activity {
        name
        receivedCount
        publishedCount
        lastUpdated
      }
      incoming {
        eventNamesCount
        eventsCount
      }
      outgoing {
        eventNamesCount
        eventsCount
        publishSuccessRate
      }
    }
  }
}
<hr/>
tenantId: ID!
<hr/>
pixelIds: [String!]
<hr/>
timeWindow: Int
```

#### Fields

| Field | Description |
| --- | --- |
| `tenantId`  <br>*ID* | **Required**  <br><br>Unique identifier of the account |
| `pixelIds`  <br>*String* | **Optional**  <br><br>List of Pixel IDs for which event metrics needs to be fetched |
| `timeWindow`  <br>*Int* | **Optional**  <br><br>Time window in minutes (Default value is 60 minutes) |

#### Returns
`EventMetricsSnapshot`

| Field | Description |
| --- | --- |
| `id`  <br>*ID* | Identifier for EventMetricsSnapshot -- always EventTrafficSummary:incoming |
| `incoming`  <br>[*EventTrafficSummary*](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api/reference/objects#eventtrafficsummary) | Incoming events summary data |
| `outgoing`  <br>[*ConversionsApiPublishSummary*](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api/reference/objects#capi-pub-summary) | Outgoing events data |
| `activity`  <br>[*EventActivity*](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api/reference/objects#event-activity) | List of event activity |
| `domainActivity`  <br>[*DomainActivity*](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api/reference/objects#domain-activity) | List of domain activity |

#### Error Codes

| Code | Description |
| --- | --- |
| 401 | Not authorized to view event metrics |
| 500 | Internal server error |

#### Sample Request

Query

```
query HomeViewQuery($tenantId: ID!, $pixelIds: [String!], $timeWindow: Int) {
 tenantQueries(tenantId: $tenantId) {
   eventMetrics(pixelIds: $pixelIds, timeWindowMin: $timeWindow) {
     activity {
       name
       receivedCount
       publishedCount
       lastUpdated
     }
     incoming {
       eventNamesCount
       eventsCount
     }
     outgoing {
       eventNamesCount
       eventsCount
       publishSuccessRate
     }
   }
 }
}
```

Variables

```
{
 "tenantId": "IaoreXfj",
 "pixelIds": ["18904456377094531"]
}
```

#### Sample Response

```
{
   "data": {
       "tenantQueries": {
           "eventMetrics": {
               "activity": [
                   {
                       "name": "Purchase_PN_Mar22_Events",
                       "receivedCount": 4,
                       "publishedCount": 0,
                       "lastUpdated": "1678753252000"
                   }
               ],
               "incoming": {
                   "eventNamesCount": 1,
                   "eventsCount": 4
               },
               "outgoing": {
                   "eventNamesCount": 0,
                   "eventsCount": 0,
                   "publishSuccessRate": 0.0
               }
           }
       }
   }
}
```

## See Also

* [Conversions API Gateway for Multiple Accounts Control Plane API](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api)
* [Control Plane API: Reference](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api/reference)
* [Control Plane API Reference: Account Management](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api/reference/account-management)
* [Control Plane API Reference: User Management](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api/reference/user-management)
* [Control Plane API Reference: Pixel Management](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api/reference/pixel-management)
* [Control Plane API Reference: Account Data Routing Configuration](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api/reference/account-data-routing)
* [Control Plane API Reference: Objects](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api/reference/objects)
