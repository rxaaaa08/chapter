<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/pixel-management | Saved: 2026-09-19 -->

# "Conversions API Gateway and Signals Gateway Control Plane API: Reference"



**Warning:** Starting from Conversions API Gateway and Signals Gateway v2.2.0, up-to-date versions of the Control Plane API reference docs, including examples with sample data, can be accessed inside your gateway UI. To find these docs:

* Click on **Settings**
* Choose **API accounts**
* Click the **API Reference** link at the top of the API accounts page

## Pixel Management

### Create Pixel Connection

Onboards a new Meta Pixel to the "Gateway Products" product Conversions API Gateway or Signals Gateway.

#### Schema  

```
POST https://{capig_domain}/capig/graphql/
<hr/>

mutation AddNewPixelModalMutation(
    $tenantId: ID!
    $input: PixelConnectionCreationInput!
) {
    tenantMutations(tenantId: $tenantId) {
          signalMutations {
              setupPixelSignalConfig(input: $input) {
              id
              domains
              connectionId
              connectionStatus {
                  id
                  accessTokenAvailable
                  active
                  connected
                  eventBridgeActive
                  publishingEnabled
                  apiErrorCode
                  pixelID
                  pixelName
                  lastPublished
                  totalEventsPublished
                  lastReceived
                  totalEventsReceived
                  }
              }
          }
     }
}
<hr/>
tenantId: ID!
<hr/>
input PixelConnectionCreationInput {
  businessId: String!
  pixelId: String!
  accessToken: String!
  apiVersion: String
  externalId: String!
  name: String
}
```

#### Fields

| Field | Description |
| --- | --- |
| `tenantId`  <br>*ID* | **Required**  <br><br>Unique identifier of the account |

`PixelConnectionCreationInput`

| Field | Description |
| --- | --- |
| `businessId`  <br>*String* | **Required**  <br><br>The business id of the account |
| `pixelId`  <br>*String* | **Required**  <br><br>The Pixel id that needs to be integrated |
| `accessToken`  <br>*String* | **Required**  <br><br>Access token from MBE setup or manually generated from Events Manager |
| `apiVersion`  <br>*String* | **Optional**  <br><br>Latest API Version for [Graph API](https://developers.facebook.com/docs/graph-api/changelog) |
| `externalId`  <br>*String* | **Required**  <br><br>This should be the same as `external_business_id` in [setup object](https://developers.facebook.com/docs/facebook-business-extension/fbe/reference#setup) |
| `name`  <br>*String* | **Optional**  <br><br>Name of the Pixel |

#### Returns

| Field | Description |
| --- | --- |
| `signalConfig`  <br>[*SignalConfig*](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api/reference/objects#signalconfig) | Pixel Configurations |

#### Error Codes

| Code | Description |
| --- | --- |
| 400 | Invalid input provided |
| 401 | User is not authorized to set up Pixel configuration |
| 500 | Internal server error |

#### Sample Request

Mutation

```
mutation AddNewPixelModalMutation(
   $tenantId: ID!
   $input: PixelConnectionCreationInput!
) {
   tenantMutations(tenantId: $tenantId) {
          signalMutations {
              setupPixelSignalConfig(input: $input) {
              id
              domains
              connectionId
              connectionStatus {
                  id
                  accessTokenAvailable
                  active
                  eventBridgeActive
                  publishingEnabled
                  apiErrorCode
                  pixelID
                  pixelName
                  lastPublished
                  totalEventsPublished
                  lastReceived
                  totalEventsReceived
                  }
              }
          }
   }
}
```

Variables

```
{
   "tenantId": "IaoreXfj",
   "input": {
       "pixelId": "18904456377094531",
       "businessId": "2840127409433732",
       "accessToken": "<accessToken>",
       "apiVersion": "v14.0",
       "externalId": "633612748410ba6e902"
   }
}
```

#### Sample Response

```
{
   "data": {
       "tenantMutations": {
           "signalMutations": {
               "setupPixelSignalConfig": {
                   "id": "SignalConfig:18904456377094531",
                   "domains": [],
                   "connectionId": "18904456377094531",
                   "connectionStatus": {
                       "id": "ConnectionStatus:18904456377094531",
                       "accessTokenAvailable": true,
                       "active": true,
                       "eventBridgeActive": true,
                       "publishingEnabled": true,
                       "apiErrorCode": null,
                       "pixelID": "18904456377094531",
                       "pixelName": null,
                       "lastPublished": 0.0,
                       "totalEventsPublished": 0.0,
                       "lastReceived": 0.0,
                       "totalEventsReceived": 0.0
                   }
               }
           }
       }
   }
}
```

### Delete Pixel Connection

Deletes an existing Pixel from the Gateway.

#### Schema

```
POST https://{capig_domain}/capig/graphql/
<hr/>

mutation DeleteDataSourceModalMutation(
  $id: ID!
  $tenantId: ID!
) {
  tenantMutations(tenantId: $tenantId) {
    signalMutations {
      deleteDataSource(id: $id)
    }
  }
}
<hr/>
id: ID!
<hr/>

tenantId: ID!
```

#### Fields

| Field | Description |
| --- | --- |
| `id`  <br>*ID* | **Required**  <br><br>The Pixel ID |
| `tenantId`  <br>*ID* | **Required**  <br>Unique identifier of the account |

#### Returns

| Field | Description |
| --- | --- |
| Boolean | Indicates whether the Pixel has been successfully deleted |

#### Error Codes

| Code | Description |
| --- | --- |
| 401 | User is not authorized to remove Pixel configuration. |
| 404 | Pixel not found. |
| 500 | Internal server error |

#### Sample Request

Mutation

```
mutation DeleteDataSourceModalMutation(
 $id: ID!
 $tenantId: ID!
) {
 tenantMutations(tenantId: $tenantId) {
   signalMutations {
     deleteDataSource(id: $id)
   }
 }
}
```

Variables

```
{
   "id":"18904456377094531",
   "tenantId":"IaoreXfj"
}
```

#### Sample Response

```
{
   "data": {
       "tenantMutations": {
           "signalMutations": {
               "deleteDataSource": true
           }
       }
   }
}
```

### Get List of Meta Pixel Connections  

Get a list of all the Meta Pixel that have been successfully onboarded to the Conversions API Gateway.

#### Schema

```
POST https://{capig_domain}/capig/graphql/
<hr/>

query ConnectionStatusCardQuery(
  $tenantId: ID!
  $timeWindow: Int
) {
  tenantQueries(tenantId: $tenantId) {
    account(timeWindowMin: $timeWindow) {
      name
      status
      signalConfigs {
        id
        connectionId
        dataSetType
        domains
        connectionStatus {
          id
          accessTokenAvailable
          active
          targetId
          eventBridgeActive
          publishingEnabled
          apiErrorCode
          badToken
          pixelID
          pixelName
          lastPublished
          totalEventsPublished
          lastReceived
          totalEventsReceived
        }
      }
    }
  }
}
<hr/>
tenantId: ID!
<hr/>

timeWindow: Int
```

#### Fields

| Field | Description |
| --- | --- |
| `tenantId`  <br>*ID* | **Required**  <br><br>Unique identifier for the account |
| `timeWindow`  <br>*Int* | Time window in minutes (Default value is 60 minutes) |

#### Returns

Account

| Field | Description |
| --- | --- |
| `status`  <br>*int* | Account status |
| `signalConfig`  <br>[*[SignalConfig]*](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/objects#signalconfig) | List of Meta Pixel configurations |

#### Error Codes

| Code | Description |
| --- | --- |
| 401 | Not authorized to view event metrics |
| 500 | Internal server error |

#### Sample Request

Query

```
query ConnectionStatusCardQuery(
  $tenantId: ID!
  $timeWindow: Int
) {
  tenantQueries(tenantId: $tenantId) {
    account(timeWindowMin: $timeWindow) {
      name
      status
      signalConfigs {
        id
        connectionId
        dataSetType
        domains
        connectionStatus {
          id
          accessTokenAvailable
          active
          targetId
          eventBridgeActive
          publishingEnabled
          apiErrorCode
          badToken
          pixelID
          pixelName
          lastPublished
          totalEventsPublished
          lastReceived
          totalEventsReceived
        }
      }
    }
  }
}
```

#### Variables

```
{
  "tenantId": "zilSRUW7",
  "timeWindow": 60
}
```

#### Sample Response

```
"data": {
        "tenantQueries": {
            "account": {
                "signalConfigs": [
                    {
                        "connectionStatus": {
                            "id": "ConnectionStatus:319279634094583",
                            "accessTokenAvailable": true,
                            "active": true,
                            "eventBridgeActive": true,
                            "publishingEnabled": true,
                            "apiErrorCode": null,
                            "badToken": false,
                            "targetId": "",
                            "pixelID": "319279634094583",
                            "pixelName": "",
                            "lastPublished": 0.0,
                            "totalEventsPublished": 0.0,
                            "lastReceived": 0.0,
                            "totalEventsReceived": 0.0
                        },
                        "id": "SignalConfig:319279634094583",
                        "dataSetType": "PIXEL"
                    },
                    {
                        "connectionStatus": {
                            "id": "ConnectionStatus:824710156172809",
                            "accessTokenAvailable": true,
                            "active": true,
                            "eventBridgeActive": true,
                            "publishingEnabled": true,
                            "apiErrorCode": null,
                            "badToken": false,
                            "targetId": "",
                            "pixelID": "824710156172809",
                            "pixelName": "",
                            "lastPublished": 0.0,
                            "totalEventsPublished": 0.0,
                            "lastReceived": 0.0,
                            "totalEventsReceived": 0.0
                        },
                        "id": "SignalConfig:824710156172809",
                        "dataSetType": "PIXEL"
                    },
                    {
                        "connectionStatus": {
                            "id": "ConnectionStatus:1429427071255793",
                            "accessTokenAvailable": true,
                            "active": true,
                            "eventBridgeActive": true,
                            "publishingEnabled": true,
                            "apiErrorCode": null,
                            "badToken": false,
                            "targetId": "",
                            "pixelID": "1429427071255793",
                            "pixelName": "",
                            "lastPublished": 0.0,
                            "totalEventsPublished": 0.0,
                            "lastReceived": 0.0,
                            "totalEventsReceived": 0.0
                        },
                        "id": "SignalConfig:1429427071255793",
                        "dataSetType": "PIXEL"
                    }
                ],
                "name": "Tenant for test@meta.com"
            }
        }
    }
}
```

### Activate/Deactivate Gateway from Receiving Pixel Events

Changes Gateway's Pixel event receiving status.

#### Schema

```
POST https://{capig_domain}/capig/graphql/
<hr/>

mutation updateSignalConfigStatusMutation(
    $id: ID!, $tenantId: ID!, $input: SignalConfigStatusInput!) {
  tenantMutations(tenantId: $tenantId) {
    signalMutations {
      updateSignalConfigEventsStatus(id: $id, input: $input) {
        success
        connectionStatus {
            id
            accessTokenAvailable
            active
            connected
            eventBridgeActive
            publishingEnabled
            apiErrorCode
            pixelID
            pixelName
            lastPublished
            totalEventsPublished
            lastReceived
            totalEventsReceived
        }
      }
    }
  }
}
<hr/>
id: ID!
<hr/>

tenantId: ID!
<hr/>
input SignalConfigStatusInput {
  status: Int!
}
```

#### Fields

| Field | Description |
| --- | --- |
| `id`  <br>*ID* | **Required**  <br><br>Pixel ID which needs to be configured |
| `tenantId`  <br>*ID* | **Required**  <br>Unique identifier of the account |

#### SignalConfigStatusInput

| Field | Description |
| --- | --- |
| `status`  <br>*Int* | **Required**<br><br>\| Value \| Description \|<br>\| --- \| --- \|<br>\| 0 \| Deactivate \|<br>\| 1 \| Activate \| |

#### Returns

`UpdateSignalConfigStatusPayload`

| Field | Description |
| --- | --- |
| `success`  <br>*Boolean* | Indicates whether the operation on Pixel was successful |
| `connectionStatus`  <br>[*ConnectionStatus*](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api/reference/objects#connection-status) | Pixel connection configuration |

#### Error Codes

| Code | Description |
| --- | --- |
| 401 | Not authorized to perform action on the Pixel |
| 500 | Internal server error |

#### Sample Request

Mutation

```
mutation updateSignalConfigStatusMutation(
   $id: ID!, $tenantId: ID!, $input: SignalConfigStatusInput!) {
 tenantMutations(tenantId: $tenantId) {
   signalMutations {
     updateSignalConfigEventsStatus(id: $id, input: $input) {
       success
       connectionStatus {
         id
         connected
         active
         eventBridgeActive
         publishingEnabled
       }
     }
   }
 }
}
```

Variables

```
{
   "id": "18904456377094531",
   "tenantId": "IaoreXfj",
   "input": {
       "status": 1
       }
}
```

#### Sample Response

```
{
   "data": {
       "tenantMutations": {
           "signalMutations": {
               "updateSignalConfigEventsStatus": {
                   "success": true,
                   "connectionStatus": {
                       "id": "ConnectionStatus:18904456377094531",
                       "connected": true,
                       "active": true,
                       "eventBridgeActive": true,
                       "publishingEnabled": true
                   }
               }
           }
       }
   }
}
```

### Activate/Deactivate Pixel Event Publishing Status

Changes Pixel's event publishing status. If deactivated, Gateway will discard received events and not publish them to Meta.

#### Schema

```
POST https://{capig_domain}/capig/graphql/
<hr/>

mutation updateSignalConfigCapiPublishMutation(
$id: ID!, $tenantId: ID!, $input: SignalConfigStatusInput!) {
 tenantMutations(tenantId: $tenantId) {
   signalMutations {
     updateSignalConfigCapiPublish(id: $id, input: $input) {
       success
       connectionStatus {
           id
           accessTokenAvailable
           active
           connected
           eventBridgeActive
           publishingEnabled
           apiErrorCode
           pixelID
           pixelName
           lastPublished
           totalEventsPublished
           lastReceived
           totalEventsReceived
       }
     }
   }
 }
}
<hr/>
id: ID!
<hr/>

tenantId: ID!
<hr/>
input SignalConfigStatusInput {
  status: Int!
}
```

#### Fields

| Field | Description |
| --- | --- |
| `id`  <br>*ID* | **Required**  <br><br>Pixel ID which needs to be configured |
| `tenantId`  <br>*ID* | **Required**  <br>Unique identifier of the account |

#### SignalConfigStatusInput

| Field | Description |
| --- | --- |
| `status`  <br>*Int* | **Required**<br><br>\| Value \| Description \|<br>\| --- \| --- \|<br>\| 0 \| Deactivate \|<br>\| 1 \| Activate \| |

#### Returns

`UpdateSignalConfigStatusPayload`

| Field | Description |
| --- | --- |
| `success`  <br>*Boolean* | Indicates whether the operation on Pixel was successful |
| `connectionStatus`  <br>[*ConnectionStatus*](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api/reference/objects#connection-status) | Pixel connection configuration |

#### Error Codes

| Code | Description |
| --- | --- |
| 401 | Not authorized to perform action on the Pixel |
| 500 | Internal server error |

#### Sample Request

Mutation

```
mutation updateSignalConfigCapiPublishMutation(
$id: ID!, $tenantId: ID!, $input: SignalConfigStatusInput!) {
 tenantMutations(tenantId: $tenantId) {
   signalMutations {
     updateSignalConfigCapiPublish(id: $id, input: $input) {
       success
       connectionStatus {
         id
         active
         eventBridgeActive
         publishingEnabled
       }
     }
   }
 }
}
```

Variables

```
{
   "id": "18904456377094531",
   "tenantId": "IaoreXfj",
   "input": {
       "status": 0
       }
}
```

#### Sample Response

```
{
   "data": {
       "tenantMutations": {
           "signalMutations": {
               "updateSignalConfigCapiPublish": {
                   "success": true,
                   "connectionStatus": {
                       "id": "ConnectionStatus:18904456377094531",
                       "active": false,
                       "eventBridgeActive": true,
                       "publishingEnabled": false
                   }
               }
           }
       }
   }
}
```

### Activate/Deactivate Pixel Event Publishing Status by Event Name

Changes Pixel's event publishing status by event name and Pixel ID. If deactivated, Gateway Products will discard these events and not publish them to Meta.

#### Schema

```
POST https://{capig_domain}/capig/graphql/
<hr/>

mutation EventFilterStatusMutation($tenantId: ID!, $input: UpdateEventFilterInput!) {
 tenantMutations(tenantId: $tenantId) {
   updateEventFilter(input: $input) {
     updatedFilter {
       id
       eventName
       pixelId
       filterState
     }
   }
 }
}
<hr/>
tenantId: ID!
<hr/>

input UpdateEventFilterInput {
  eventName: String!
  pixelIds: [String!]
  filterState: EventFilterState!
}
```

#### Fields

| Field | Description |
| --- | --- |
| `tenantId`  <br>*ID* | **Required**  <br>Unique identifier of the account |

#### UpdateEventFilterInput

| Field | Description |
| --- | --- |
| `eventName`  <br>*String* | **Required**<br><br>Name of the event to be filtered |
| `pixelIds`  <br>*String* | **Optional**<br><br>List of Pixel IDs where the filter needs to be applied.<br>If null is provided, all the Pixels for the account will be updated |
| `filterState`  <br>[*EventFilterState*](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api/reference/objects#event-filter-state) | **Required**<br><br>State of the filter |

#### Returns

`UpdateEventFilterResult`

| Field | Description |
| --- | --- |
| `updatedFilter`  <br>[*EventFilter*](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api/reference/objects#eventfilter) | Updated Event Filter |

#### Error Codes

| Code | Description |
| --- | --- |
| 401 | Not authorized to update event filters |
| 500 | Internal server error |

#### Sample Request

Mutation

```
mutation EventFilterStatusMutation($tenantId: ID!, $input: UpdateEventFilterInput!) {
tenantMutations(tenantId: $tenantId) {
  updateEventFilter(input: $input) {
    updatedFilter {
      eventName
      pixelId
      filterState
    }
  }
}
}
```

Variables

```
{
"tenantId": "IaoreXfj",
"input": {
  "eventName": "AddToCart",
  "pixelIds": ["18904456377094531"],
  "filterState": "PUBLISH"
}
}
```

#### Sample Response

```
{
   "data": {
       "tenantMutations": {
           "updateEventFilter": {
               "updatedFilter": {
                   "eventName": "AddToCart",
                   "pixelId": "18904456377094531",
                   "filterState": "PUBLISH"
               }
           }
       }
   }
}
```

### Block/Unblock Websites Permitted to Receive and Publish Events  

Blocks receiving of events from specific websites.

#### Schema

```
POST https://{capig_domain}/capig/graphql/
<hr/>

mutation useComitDomainFilterChangeMutation($tenantId: ID!, $input: UpdateDomainFilterInput!) {
  tenantMutations(tenantId: $tenantId) {
    updateDomainFilter(input: $input) {
      updatedFilter {
        id
        domain
        pixelId
        filterState
      }
    }
  }
}
<hr/>
tenantId: ID!
<hr/>

input UpdateDomainFilterInput {
  domain: String!
  pixelIds: [String!]
  filterState: DomainFilterState!
}
```

#### Fields

| Field | Description |
| --- | --- |
| `tenantId`  <br>*ID* | **Required**  <br>Unique identifier of the account |

#### UpdateDomainFilterInput

| Field | Description |
| --- | --- |
| `domain`  <br>*String* | **Required**<br><br>Name of the domain to be filtered<br><br>Format should be:<br>example.com |
| `pixelIds`  <br>*String* | **Optional**<br><br>List of Pixel IDs where the filter needs to be applied |
| `filterState`  <br>[*DomainFilterState*](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api/reference/objects#domain-filter-state) | **Required**<br><br>State of the filter |

#### Returns

`UpdateDomainFilterResult`

| Field | Description |
| --- | --- |
| `updatedFilter`  <br>[*DomainFilter*](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api/reference/objects#domainfilter) | Domain filter object |

#### Error Codes

| Code | Description |
| --- | --- |
| 401 | Not authorized to update domain filters |
| 500 | Internal server error |

#### Sample Request

Mutation

```
mutation useComitDomainFilterChangeMutation($tenantId: ID!, $input: UpdateDomainFilterInput!) {
 tenantMutations(tenantId: $tenantId) {
   updateDomainFilter(input: $input) {
     updatedFilter {
       id
       domain
       pixelId
       filterState
     }
   }
 }
}
```

Variables

```
{
 "tenantId": "IaoreXfj",
 "input": {
   "domain": "example.com",
   "filterState": "DROP"
 }
}
```

#### Sample Response

```
"data": {
       "tenantMutations": {
           "updateDomainFilter": {
               "updatedFilter": {
                   "id": "DomainFilter:example.com:global",
                   "domain": "example.com",
                   "pixelId": null,
                   "filterState": "DROP"
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
* [Control Plane API Reference: Account Data Routing Configuration](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api/reference/account-data-routing)
* [Control Plane API Reference: Account Event Metrics](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api/reference/account-event-metrics)
* [Control Plane API Reference: Objects](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api/reference/objects)
