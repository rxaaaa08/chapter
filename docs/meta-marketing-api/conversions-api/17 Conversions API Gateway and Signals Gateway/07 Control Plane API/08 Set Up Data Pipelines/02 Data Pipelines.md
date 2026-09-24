<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/setup-data-pipelines/data-pipelines | Saved: 2026-09-19 -->

# Gateway Control Plane API Reference



## APIs for Data Pipelines

### Create a Gateway Data Pipeline

Create a gateway data pipeline in Signals Gateway and return the information of the created pipeline.

#### Schema  

```
POST https://{signals_gateway_domain}/capig/graphql/
<hr/>

mutation createDataPipelineMutation(
  $tenantId: ID!
  $name: String!
) {
  tenantMutations(tenantId: $tenantId) {
    dataPipelineMutations {
      createPipeline(name: $name) {
        id
        name
        active
        dataSources {
          id
          type
        }
        dataDestinations {
          id
          type
        }
        dataFilter {
          filterStatus
          blockedEventTypes
        }
        pipelineDestinationFilters {
          id
          destinationId
          destinationFilterStatus
          destinationFilterBlockedEventTypes
        }
      }
    }
  }
}
<hr/>
tenantId: ID!
<hr/>
name: String!
```

#### Input Fields

| Field | Description |
| --- | --- |
| `tenantID`  <br>*ID* | **Required**  <br>Unique identifier for the account |
| `name`  <br>*String* | **Required**  <br>Name of the gateway data pipeline |

#### Returns

Pipeline

| Field | Description |
| --- | --- |
| `pipeline`  <br>[*Pipeline*](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/setup-data-pipelines/objects#pipeline) | The created data pipeline object contains the ID, name, type, etc. |

#### Error Codes

| Code | Description |
| --- | --- |
| 401 | Not authorized to view event metrics |
| 500 | Internal server error |

#### Sample Request

Query

```
 mutation createDataPipelineMutation(
  $tenantId: ID!
  $name: String!
) {
  tenantMutations(tenantId: $tenantId) {
    dataPipelineMutations {
      createPipeline(name: $name) {
        id
        name
        active
        dataSources {
          id
          type
        }
        dataDestinations {
          id
          type
        }
  dataFilter {
          filterStatus
          blockedEventTypes
        }
  pipelineDestinationFilters {
           id
           destinationId
           destinationFilterStatus
           destinationFilterBlockedEventTypes
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
  "name": "Pipeline C7P2ZR"
}
```

#### Sample Response

```
{
    "data": {
        "tenantMutations": {
            "dataPipelineMutations": {
                "createPipeline": {
                    "id": "sg_v1_pl_c280b69f-7a8f-486b-a5d0-1018d9bf41bc",
                    "name": "Pipeline C7P2ZR",
                    "active": true,
                    "dataSources": [],
                    "dataDestinations": []
                    "dataFilter": {
          "filterStatus": false,
          "blockedEventTypes": []
        },
        "pipelineDestinationFilters": []
                }
            }
        }
    }
}
```

### Connect Meta Pixel

Create a Meta Conversions API data pipeline in Signals Gateway by connecting with a Meta pixel, and return the information of the created pipeline.

#### Schema

```
POST https://{signals_gateway_domain}/capig/graphql/
<hr/>

mutation CreatePipelineAndConnectMetaCAPIMutation(
  $tenantId: ID!
  $pipelineName: String
  $pixelId: ID!
  $businessId: String!
  $accessToken: String!
  $apiVersion: String
  $externalId: String!
  $createOB: Boolean
) {
  tenantMutations(tenantId: $tenantId) {
    dataPipelineMutations {
      createConversionApiGatewayPipeline(pipelineName: $pipelineName, pixelId: $pixelId, businessId: $businessId, accessToken: $accessToken, apiVersion: $apiVersion, externalId: $externalId, createOB: $createOB) {
        id
        name
        active
        dataSources {
          id
          type
        }
        dataDestinations {
          id
          type
        }
      }
    }
  }
}
<hr/>
tenantId: ID!
<hr/>
name: String
<hr/>
pixelId: String
<hr/>
businessId: String
<hr/>
accessToken: String
<hr/>
apiVersion: String
<hr/>
externalId: String
<hr/>
createOB: Boolean
<hr/>
```

#### Input Fields

| Field | Description |
| --- | --- |
| `tenantId`  <br>*ID* | **Required**  <br><br>Unique identifier for the account. |
| `pipelineName`  <br>*String* | Name of the data pipeline. Optional field. If not provided, the system will generate a default name. |
| `pixelId`  <br>*String* | **Required**  <br><br>The Pixel ID that needs to be integrated. |
| `businessId`  <br>*String* | **Required**  <br><br>The business ID of the account. |
| `accessToken`  <br>*String* | **Required**  <br><br>Access token from Meta Business Extension (MBE) setup or manually generated from Meta Events Manager. |
| `apiVersion`  <br>*String* | Latest API Version for [Graph API](https://developers.facebook.com/docs/graph-api/changelog). |
| `externalId`  <br>*String* | **Required**<br><br>This should be the same as external_business_id in [setup object](https://developers.facebook.com/docs/facebook-business-extension/fbe/reference#setup). |
| `createOB`  <br>*Boolean* | Whether to create the events routing connection with Meta. Default and recommended to be true. |

#### Returns

Pipeline

| Field | Description |
| --- | --- |
| `pipeline`  <br>[*Pipeline*](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/setup-data-pipelines/objects#pipeline) | The created data pipeline object contains the ID, name, type, etc. |

#### Error Codes

| Code | Description |
| --- | --- |
| 401 | Not authorized to view event metrics |
| 500 | Internal server error |

#### Sample Request

Query

```
mutation CreatePipelineAndConnectMetaCAPIMutation(
  $tenantId: ID!
  $pipelineName: String
  $pixelId: ID!
  $businessId: String!
  $accessToken: String!
  $apiVersion: String
  $externalId: String!
  $createOB: Boolean
) {
  tenantMutations(tenantId: $tenantId) {
    dataPipelineMutations {
      createConversionApiGatewayPipeline(pipelineName: $pipelineName, pixelId: $pixelId, businessId: $businessId, accessToken: $accessToken, apiVersion: $apiVersion, externalId: $externalId, createOB: $createOB) {
        id
        name
        active
        dataSources {
          id
          type
        }
        dataDestinations {
          id
          type
        }
 dataFilter {
          filterStatus
          blockedEventTypes
        }
  pipelineDestinationFilters {
           id
           destinationId
           destinationFilterStatus
           destinationFilterBlockedEventTypes
        }
      }
    }
  }
}
```

#### Variables

```
{
  "tenantId": "IaoreXfj",
  "pipelineName": "Conversions API Gateway (258139843760841)",
  "pixelId": "258139843760841",
  "businessId": "858087751506464",
  "accessToken": "EAA2N8HVqMR4BO0KniGrDM7sngbW3OBKBgol1YbfvCDwp9S0UZALO1JgbB8yv3ZBJfYvjjUNpGn1WOVZANfQMZC5mkLZAyfmhu78Kd0GTxgpBs5raaqItv6DyBBddBUUMfkZBVeLC0EkDuZBnlsVxZA8aygZAvdp1MHV3V9Y0aYEEjfjyQDYkPezEtwZCgvgKzoE2bAtKf98FimAxakZA9sf",
  "apiVersion": "v17.0",
  "externalId": "157f0f83-7d3e-4380-b704-4ff67f03a3de",
  "createOB": true
}
```

#### Sample Response

```
{
    "data": {
        "tenantMutations": {
            "dataPipelineMutations": {
                "createConversionApiGatewayPipeline": {
                    "id": "sg_v1_pl_ad286034-eeec-469b-a036-72d88e87b8cc",
                    "name": "Conversions API Gateway (258139843760841)",
                    "active": true,
                    "dataSources": [
                        {
                            "id": "258139843760841",
                            "type": "META_PIXEL"
                        }
                    ],
                    "dataDestinations": [
                        {
                            "id": "sg_v1_dd_cc40dd55-070b-4deb-8f6a-63876c1ab0d7",
                            "type": "META_CONVERSIONS_API"
                        }
                    ],
"dataFilter": {
          "filterStatus": false,
          "blockedEventTypes": []
        },
        "pipelineDestinationFilters": []
                }
            }
        }
    }
}
```

### Get Data Pipeline

The query to get the data pipeline with associated data sources, data destination and data filters corresponding to a unique identifier input.

#### Schema

```
POST https://{signals_gateway_domain}/capig/graphql/
<hr/>

query DataPipelineQuery(
  $tenantId: ID!
  $id: ID!
) {
  tenantQueries(tenantId: $tenantId) {
    pipeline(id: $id) {
      id
      name
      active
      type
      dataSources {
        id
        name
        type
        active
      }
      dataDestinations {
        id
        name
        type
        active
        associatedPipelines {
          id
          name
          type
        }
        metaCAPIConfig {
          dataSetId
        }
      }
      dataFilter {
        blockedEventTypes
      }
      pipelineDestinationFilters {
        id
        destinationId
        destinationFilterBlockedEventTypes
      }
    }
  }
}

<hr/>
tenantId: ID!
<hr/>
id: ID!
```

#### Input Fields

| Field | Description |
| --- | --- |
| `tenantId`  <br>*ID* | **Required**  <br><br>Unique identifier for the account |
| `id`  <br>*ID* | **Required**  <br><br>Unique identifier for the data pipeline |

#### Returns

| Field | Description |
| --- | --- |
| `Pipeline`  <br>[*Pipeline*](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/setup-data-pipelines/objects#pipeline) | The data pipeline details fetched by the query |

#### Error Codes

| Code | Description |
| --- | --- |
| 401 | Not authorized to view the data routing |
| 500 | Internal server error |

#### Sample Request

Query

```
query DataPipelineDetailsQuery(
  $tenantId: ID!
  $id: ID!
) {
  tenantQueries(tenantId: $tenantId) {
    pipeline(id: $id) {
      id
      name
      active
      type
      dataSources {
        id
        name
        type
        active
      }
      dataDestinations {
        id
        name
        type
        active
        associatedPipelines {
          id
          name
          type
        }
        metaCAPIConfig {
          dataSetId
        }
      }
      dataFilter {
        blockedEventTypes
      }
      pipelineDestinationFilters {
        id
        destinationId
        destinationFilterBlockedEventTypes
      }
    }
  }
}
```

#### Variables

```
{
  "tenantId": "IaoreXfj",
  "id": "sg_v1_pl_1a8c443d-9ace-440e-9eb7-147322344723"
}
```

#### Sample Response

```
{
    "data": {
        "tenantQueries": {
            "pipeline": {
                "id": "sg_v1_pl_1a8c443d-9ace-440e-9eb7-147322344723",
                "name": "Pipeline V2E9XB",
                "active": true,
                "type": "GATEWAY_PIPELINE",
                "dataSources": [
                    {
                        "id": "1347507641242739748",
                        "name": "Gateway-party App SDK Q2EX6D",
                        "type": "ADVERTISER_HOSTED_SDK",
                        "active": true
                    },
                    {
                        "id": "8855778841440572825",
                        "name": "Gateway-party Pixel MZUY4L",
                        "type": "ADVERTISER_HOSTED_PIXEL",
                        "active": true
                    }
                ],
                "dataDestinations": [],
                "dataFilter": {
                    "blockedEventTypes": [
                        "AchievementUnlocked"
                    ]
                },
                "pipelineDestinationFilters": []
            }
        }
    }
}
```

### Update Data Pipeline

The mutation to update a data pipeline in the Signals Gateway.

#### Schema

```
POST https://{signals_gateway_domain}/capig/graphql/
<hr/>

 mutation updateDataPipelineMutation(
  $tenantId: ID!
  $input: PipelineInput!
) {
  tenantMutations(tenantId: $tenantId) {
    dataPipelineMutations {
      updatePipeline(input: $input) {
        id
        active
        name
      }
    }
  }
}
<hr/>
tenantId: ID!
<hr/>
input PipelineInput {
  id: ID!
 name: String
 active: Boolean
}
```

#### Input Fields

| Field | Description |
| --- | --- |
| `tenantId`  <br>*ID* | **Required**  <br><br>Unique identifier for the account |
| `input`  <br>[*PipelineInput*](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/setup-data-pipelines/objects#pipeline) | **Required**  <br><br>The fields from the data pipeline to update |

#### [PipelineInput](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/setup-data-pipelines/objects#pipeline)

| Field | Description |
| --- | --- |
| `id`  <br>*ID* | **Required**  <br><br>Unique identifier for the data pipeline |
| `name`  <br>*String* | Updated name of the data pipeline |
| `active`  <br>*Boolean* | The status of the data pipeline indicates if the pipeline is active or not |

#### Returns

| Field | Description |
| --- | --- |
| `Pipeline`  <br>[*Pipeline*](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/setup-data-pipelines/objects#pipeline) | The data pipeline object |

#### Error Codes

| Code | Description |
| --- | --- |
| 401 | Not authorized to view the data routing |
| 500 | Internal server error |

#### Sample Request

Mutation

```
mutation updateDataPipelineMutation(
  $tenantId: ID!
  $input: PipelineInput!
) {
  tenantMutations(tenantId: $tenantId) {
    dataPipelineMutations {
      updatePipeline(input: $input) {
        id
        active
        name
      }
    }
  }
}
```

#### Variables

```
{
  "tenantId": "IaoreXfj",
  "input": {
    "id": "sg_v1_pl_ad286034-eeec-469b-a036-72d88e87b8cc",
    "active": false
  }
}
```

#### Sample Response

```
{
    "data": {
        "tenantMutations": {
            "dataPipelineMutations": {
                "updatePipeline": {
                    "id": "sg_v1_pl_ad286034-eeec-469b-a036-72d88e87b8cc",
                    "active": false,
                    "name": "Conversions API Gateway (258139843760841)"
                }
            }
        }
    }
}
```

### Delete Data Pipeline

The mutation to delete an existing data pipeline in the Signals Gateway. The request can work for both gateway data pipelines and Meta Conversions API data pipelines.

#### Schema

```
POST https://{signals_gateway_domain}/capig/graphql/
<hr/>

mutation useDeleteDataPipelineMutation(
  $tenantId: ID!
  $id: ID!
) {
  tenantMutations(tenantId: $tenantId) {
    dataPipelineMutations {
      deletePipeline(id: $id)
    }
  }
}

<hr/>
tenantId: ID!
<hr/>
id: ID!
```

#### Input Fields

| Field | Description |
| --- | --- |
| `tenantId`  <br>*ID* | **Required**  <br><br>Unique identifier for the account |
| `id`  <br>*ID* | **Required**<br><br>Unique identifier for the data pipeline |

#### Returns

|  |  |
| --- | --- |
| `id`  <br>*ID* | Unique identifier for the deleted data pipeline |

#### Error Codes

| Code | Description |
| --- | --- |
| 401 | Not authorized to view the data routing |
| 500 | Internal server error |

#### Sample Request

Query

```
mutation useDeleteDataPipelineMutation(
  $tenantId: ID!
  $id: ID!
) {
  tenantMutations(tenantId: $tenantId) {
    dataPipelineMutations {
      deletePipeline(id: $id)
    }
  }
}
```

#### Variables

```
{
  "tenantId": "IaoreXfj",
  "id": "sg_v1_pl_0fd7ac39-42b7-416f-ab6a-39d923eaa4d8"
}
```

#### Sample Response

```
{
    "data": {
        "tenantMutations": {
            "dataPipelineMutations": {
                "deletePipeline": "sg_v1_pl_0fd7ac39-42b7-416f-ab6a-39d923eaa4d8"
            }
        }
    }
}
```

### Update Data Pipeline Filter

The mutation to update a data pipeline filter to block selected event types in the Signals Gateway.

#### Schema

```
POST https://{signals_gateway_domain}/capig/graphql/
<hr/>

mutation AddNewFilterModal_updatePipelineFilterMutation(
  $tenantId: ID!
  $input: PipelineFilterInput!
) {
  tenantMutations(tenantId: $tenantId) {
    dataPipelineMutations {
      updatePipelineFilter(input: $input) {
        filterStatus
        blockedEventTypes
      }
    }
  }
}

<hr/>
tenantId: ID!
<hr/>
input PipelineFilterInput {
  pipelineId: ID!
  filterStatus: Boolean
  blockedEventTypes: [String]
}
```

#### Input Fields

| Field | Description |
| --- | --- |
| `tenantId`  <br>*ID* | **Required**  <br><br>Unique identifier for the account |
| `input`  <br>[*PipelineFilterInput*](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/setup-data-pipelines/objects#data-filter) | **Required**  <br><br>The fields from the data pipeline to update |

#### [PipelineFilterInput](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/setup-data-pipelines/objects#data-filter)

| Field | Description |
| --- | --- |
| `pipelineId`  <br>*ID* | **Required**  <br><br>Unique identifier for the data pipeline. |
| `filterStatus`  <br>*Boolean* | The status of the data pipeline filter indicates if the filter is active or not. |
| `blockedEventTypes`  <br>[*String*] | A list of event types which will be dropped from the data pipeline. |

#### Returns

| Field | Description |
| --- | --- |
| `DataFilter`  <br>[*DataFilter*](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/setup-data-pipelines/objects#data-filter) | The data pipeline object |

#### Error Codes

| Code | Description |
| --- | --- |
| 401 | Not authorized to view the data routing |
| 500 | Internal server error |

#### Sample Request

Query

```
mutation AddNewFilterModal_updatePipelineFilterMutation(
  $tenantId: ID!
  $input: PipelineFilterInput!
) {
  tenantMutations(tenantId: $tenantId) {
    dataPipelineMutations {
      updatePipelineFilter(input: $input) {
        filterStatus
        blockedEventTypes
      }
    }
  }
}
```

#### Variables

```
{
  "tenantId": "IaoreXfj",
  "input": {
    "pipelineId": "sg_v1_pl_1a8c443d-9ace-440e-9eb7-147322344723",
    "blockedEventTypes": [
      "AchievementUnlocked"
    ]
  }
}
```

#### Sample Response

```
{
    "data": {
        "tenantMutations": {
            "dataPipelineMutations": {
                "updatePipelineFilter": {
                    "filterStatus": false,
                    "blockedEventTypes": [
                        "AchievementUnlocked"
                    ]
                }
            }
        }
    }
}
```

### Update Data Pipeline Destination Filter

The mutation to update a data destination which belongs to a specific data pipeline filter to block selected event types.

#### Schema

```
POST https://{signals_gateway_domain}/capig/graphql/
<hr/>

mutation AddNewPipelineDestinationFilterModal_updatePipelineDestinationFilterMutation(
  $tenantId: ID!
  $input: PipelineDestinationFilterInput!
) {
  tenantMutations(tenantId: $tenantId) {
    dataPipelineMutations {
      updatePipelineDestinationFilter(input: $input) {
        id
        destinationId
        destinationFilterStatus
        destinationFilterBlockedEventTypes
      }
    }
  }
}

<hr/>
tenantId: ID!
<hr/>
input PipelineDestinationFilterInput {
  pipelineId: ID!
  destinationId: ID!
  destinationFilterBlockedEventTypes: [String]
}
```

#### Input Fields

| Field | Description |
| --- | --- |
| `tenantId`  <br>*ID* | **Required**  <br><br>Unique identifier for the account |
| `input`  <br>[*PipelineDestinationFilterInput*](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/setup-data-pipelines/objects#pipeline-destination-filter) | **Required**  <br><br>The input data to filter the blocked event types |

#### [PipelineDestinationFilterInput](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/setup-data-pipelines/objects#pipeline-destination-filter)

| Field | Description |
| --- | --- |
| `pipelineId`  <br>*ID* | **Required**  <br><br>Unique identifier for the data pipeline. |
| `filterStatus`  <br>*Boolean* | The status of the data pipeline filter indicates if the filter is active or not. |
| `blockedEventTypes`  <br>[*String*] | A list of event types that will be dropped from the data pipeline. |

#### Returns

| Field | Description |
| --- | --- |
| `PipelineDestinationFilter`  <br>[*PipelineDestinationFilter*](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/setup-data-pipelines/objects#pipeline-destination-filter) | The data pipeline destination filter object contains a list of blocked event types |

#### Error Codes

| Code | Description |
| --- | --- |
| 401 | Not authorized to view the data routing |
| 500 | Internal server error |

#### Sample Request

Query

```
mutation AddNewPipelineDestinationFilterModal_updatePipelineDestinationFilterMutation(
  $tenantId: ID!
  $input: PipelineDestinationFilterInput!
) {
  tenantMutations(tenantId: $tenantId) {
    dataPipelineMutations {
      updatePipelineDestinationFilter(input: $input) {
        id
        destinationId
        destinationFilterStatus
        destinationFilterBlockedEventTypes
      }
    }
  }
}
```

#### Variables

```
{
  "tenantId": "IaoreXfj",
  "input": {
    "pipelineId": "sg_v1_pl_48e22997-24c6-4f69-9da7-ae82657f1fdd",
    "destinationId": "sg_v1_dd_553fbb56-5348-4553-8215-0ced4a835ff3",
    "destinationFilterBlockedEventTypes": [
      "AddToCart"
    ]
  }
}
```

#### Sample Response

```
{
    "data": {
        "tenantMutations": {
            "dataPipelineMutations": {
                "updatePipelineDestinationFilter": {
                    "id": "pipelineDestinationFilter:sg_v1_pl_48e22997-24c6-4f69-9da7-ae82657f1fdd:sg_v1_dd_553fbb56-5348-4553-8215-0ced4a835ff3",
                    "destinationId": "sg_v1_dd_553fbb56-5348-4553-8215-0ced4a835ff3",
                    "destinationFilterStatus": true,
                    "destinationFilterBlockedEventTypes": [
                        "AddToCart"
                    ]
                }
            }
        }
    }
}
```

