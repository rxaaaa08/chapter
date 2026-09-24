<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/setup-data-pipelines/data-destinations | Saved: 2026-09-19 -->

# Gateway Control Plane API Reference



## APIs for Data Destinations

### Create a Gateway Data Destination

Create a gateway data destination in Signals Gateway and return the information of the created information.

#### Schema  

```
POST https://{signals_gateway_domain}/capig/graphql/
<hr/>

mutation createDataDestinationMutation(
  $tenantId: ID!
  $input: CreateDataDestinationInput!
) {
  tenantMutations(tenantId: $tenantId) {
    dataDestinationMutations {
      createDataDestination(input: $input) {
        id
        name
        type
        active
      }
    }
  }
}

<hr/>
tenantId: ID!
<hr/>
input: CreateDataDestinationInput {
  name: String!
 type: DataDestinationType!
 pipelineId: ID!
}
```

#### Input Fields

| Field | Description |
| --- | --- |
| `tenantID`  <br>*ID* | **Required**  <br>Unique identifier for the account |
| `input`  <br>[*CreateDataDestinationInput*](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/setup-data-pipelines/objects#data-destination) | **Required**  <br>Input of the gateway data destination creation fields |

#### [CreateDataDestinationInput](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/setup-data-pipelines/objects#data-destination)

| Field | Description |
| --- | --- |
| `name`  <br>*String* | **Required**  <br>Name of the gateway data destination |
| `type`  <br>[*DataDestinationType*](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/setup-data-pipelines/objects#data-destination-type) | **Required**  <br>Data destination type |
| `pipelineId`  <br>*ID* | **Required**  <br>Unique identifier for the data pipeline which contains the data destination |

#### Returns

DataDestination

| Field | Description |
| --- | --- |
| `DataDestination`  <br>[*DataDestination*](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/setup-data-pipelines/objects#data-destination) | The created data destination object contains the ID, name, type, status, etc. |

#### Error Codes

| Code | Description |
| --- | --- |
| 401 | Not authorized to view event metrics |
| 500 | Internal server error |

#### Sample Request

Query

```
mutation createDataDestinationMutation(
  $tenantId: ID!
  $input: CreateDataDestinationInput!
) {
  tenantMutations(tenantId: $tenantId) {
    dataDestinationMutations {
      createDataDestination(input: $input) {
        id
        name
        type
        active
      }
    }
  }
}
```

#### Variables

```
{
  "tenantId": "zilSRUW7",
  "input": {
    "name": "Customized destination 1P46DH",
    "type": "CUSTOM_HTTP_API",
    "pipelineId": "sg_v1_pl_91c615ad-eea2-4151-93f7-daf89cd16154"
  }
}
```

#### Sample Response

```
{
    "data": {
        "tenantMutations": {
            "dataDestinationMutations": {
                "createDataDestination": {
                    "id": "sg_v1_dd_2a9fa3fb-b590-4eda-9a56-34e82ab15a4a",
                    "name": "Customized destination 1P46DH",
                    "type": "CUSTOM_HTTP_API",
                    "active": true
                }
            }
        }
    }
}
```

### Get Data Destinations

The query to get all the data destinations with the fields corresponding to a unique account.

#### Schema

```
POST https://{signals_gateway_domain}/capig/graphql/
<hr/>

query dataDestinationTableQuery(
  $tenantId: ID!
) {
  tenantQueries(tenantId: $tenantId) {
    dataDestinationsQuery {
      id
      name
      active
      type
      associatedPipelines {
        id
        name
        type
      }
    }
  }
}

<hr/>
tenantId: ID!
```

#### Input Fields

| Field | Description |
| --- | --- |
| `tenantId`  <br>*ID* | **Required**  <br><br>Unique identifier for the account |

#### Returns
DataDestination list

| Field | Description |
| --- | --- |
| `DataDestination`  <br>[*DataDestination*](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/setup-data-pipelines/objects#data-destination) | A list of data destination objects contains the ID, name, type, status, etc |

#### Error Codes

| Code | Description |
| --- | --- |
| 401 | Not authorized to view the data routing |
| 500 | Internal server error |

#### Sample Request

Query

```
query DataDestinationTableView_Query(
  $tenantId: ID!
) {
  tenantQueries(tenantId: $tenantId) {
    dataDestinationsQuery {
      id
      name
      active
      type
      associatedPipelines {
        id
        name
        type
      }
    }
  }
}
```

#### Variables

```
{
  "tenantId": "IaoreXfj"
}
```

#### Sample Response

```
{
    "data": {
        "tenantQueries": {
            "dataDestinationsQuery": [
                {
                    "id": "sg_v1_dd_012d8f4c-46e3-4613-b274-c353a6409428",
                    "name": "Meta Dataset (762280558934145)",
                    "active": true,
                    "type": "META_CONVERSIONS_API",
                    "associatedPipelines": []
                },
                {
                    "id": "sg_v1_dd_03495a8d-da72-4073-83f9-4f8618a06518",
                    "name": "Meta Dataset (2341238446217308)",
                    "active": true,
                    "type": "META_CONVERSIONS_API",
                    "associatedPipelines": []
                },
                {
                    "id": "sg_v1_dd_097fb747-e888-47da-88f9-cadbdf8b0889",
                    "name": "Meta Dataset (1691262618335941)",
                    "active": true,
                    "type": "META_CONVERSIONS_API",
                    "associatedPipelines": [
                        {
                            "id": "sg_v1_pl_768909ba-209b-440f-b37a-84fd300ca3a6",
                            "name": "Conversions API Gateway(1691262618335941)",
                            "type": "META_CAPI_PIPELINE"
                        }
                    ]
                },
                {
                    "id": "sg_v1_dd_0c1c1665-a963-4ee3-b3c2-5629b39d3e53",
                    "name": "1P2_C3",
                    "active": true,
                    "type": "CUSTOM_HTTP_API",
                    "associatedPipelines": [
                        {
                            "id": "sg_v1_pl_48e22997-24c6-4f69-9da7-ae82657f1fdd",
                            "name": "1P2",
                            "type": "GATEWAY_PIPELINE"
                        }
                    ]
                }

            ]
        }
    }
}
```

### Update Gateway Data Destination

The mutation to update the fields for a gateway data destination in the Signals Gateway.

#### Schema

```
POST https://{signals_gateway_domain}/capig/graphql/
<hr/>

mutation updateDataDestinationMutation(
  $tenantId: ID!
  $input: DataDestinationInput!
) {
  tenantMutations(tenantId: $tenantId) {
    dataDestinationMutations {
      updateDataDestination(input: $input) {
        id
        name
        active
      }
    }
  }
}
<hr/>
tenantId: ID!
<hr/>
input: CreateDataDestinationInput {
  id: ID!
  name: String!
  type: DataDestinationType!
  pipelineId: ID!
}
```

#### Input Fields

| Field | Description |
| --- | --- |
| `tenantId`  <br>*ID* | **Required**  <br><br>Unique identifier for the account. |
| `input`  <br>[*DataDestinationInput*](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/setup-data-pipelines/objects#data-destination) | **Required**<br><br>Input of the gateway data destination update fields. |

#### [DataDestinationInput ](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/setup-data-pipelines/objects#data-destination)

| Field | Description |
| --- | --- |
| `id`  <br>*ID* | **Required**  <br>Unique identifier for the data destination |
| `name`  <br>*String* | The updated name of the gateway data destination |
| `destinationType`  <br>[*DataDestinationType*](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/setup-data-pipelines/objects#data-destination-type) | Data destination type |
| `active`  <br>*ID* | The updated status of the gateway data destination indicates if it is active or not |

#### Returns

DataDestination

| Field | Description |
| --- | --- |
| `DataDestination`  <br>[*DataDestination*](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/setup-data-pipelines/objects#data-destination) | The updated data destination object contains the ID, name, type, status, etc. |

#### Error Codes

| Code | Description |
| --- | --- |
| 401 | Not authorized to view the data routing |
| 500 | Internal server error |

#### Sample Request

Query

```
mutation updateDataDestinationMutation(
  $tenantId: ID!
  $input: DataDestinationInput!
) {
  tenantMutations(tenantId: $tenantId) {
    dataDestinationMutations {
      updateDataDestination(input: $input) {
        id
        name
        active
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
    "id": "sg_v1_dd_2a9fa3fb-b590-4eda-9a56-34e82ab15a4a",
    "name": "Customized destination 1P46DH",
    "destinationType": "CUSTOM_HTTP_API",
    "active": false
  }
}
```

#### Sample Response

```
{
    "data": {
        "tenantMutations": {
            "dataDestinationMutations": {
                "updateDataDestination": {
                    "id": "sg_v1_dd_2a9fa3fb-b590-4eda-9a56-34e82ab15a4a",
                    "name": "Customized destination 1P46DH",
                    "active": false
                }
            }
        }
    }
}
```

### Delete Data Destination

The mutation to delete an existing data destination in the Signals Gateway.

#### Schema

```
POST https://{signals_gateway_domain}/capig/graphql/
<hr/>

mutation deleteDataDestinationMutation(
  $tenantId: ID!
  $id: ID!
) {
  tenantMutations(tenantId: $tenantId) {
    dataDestinationMutations {
      deleteDataDestination(id: $id)
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
| `id`  <br>*ID* | **Required**  <br><br>Unique identifier for the data destination |

#### Returns

|  |  |
| --- | --- |
| `id`  <br>*ID* | Unique identifier for the deleted data destination |

#### Error Codes

| Code | Description |
| --- | --- |
| 401 | Not authorized to view the data routing |
| 500 | Internal server error |

#### Sample Request

Query

```
mutation deleteDataDestinationMutation(
  $tenantId: ID!
  $id: ID!
) {
  tenantMutations(tenantId: $tenantId) {
    dataDestinationMutations {
      deleteDataDestination(id: $id)
    }
  }
}
```

#### Variables

```
{
  "tenantId": "IaoreXfj",
  "id": "sg_v1_dd_2a9fa3fb-b590-4eda-9a56-34e82ab15a4a"
}
```

#### Sample Response

```
{
    "data": {
        "tenantMutations": {
            "dataDestinationMutations": {
                "deleteDataDestination": "sg_v1_dd_2a9fa3fb-b590-4eda-9a56-34e82ab15a4a"
            }
        }
    }
}
```

### Update Meta Conversions API Data Destination Config

The mutation to update the config for a Meta Conversions API type data destination in the Signals Gateway.

#### Schema

```
POST https://{signals_gateway_domain}/capig/graphql/
<hr/>

mutation updateDataDestinationCapiConfigMutation(
     $tenantId: ID!
     $input: UpdateDataDestinationCapiConfigInput!
   ) {
     tenantMutations(tenantId: $tenantId) {
       dataDestinationMutations {
         updateDataDestinationCapiConfig(input: $input)
       }
     }
   }

<hr/>
tenantId: ID!
<hr/>
input: UpdateDataDestinationCapiConfigInput {
  id: ID!
  metaDatasetId: String!
  accessToken: String!
  apiVersion: String!
  businessId: String!
  updateOB: Boolean
}
```

#### Input Fields

| Field | Description |
| --- | --- |
| `tenantId`  <br>*ID* | **Required**  <br><br>Unique identifier for the account |
| `input`  <br>[*UpdateDataDestinationCapiConfigInput*](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/setup-data-pipelines/objects#data-destination) | **Required**  <br><br>Input of the Conversions API data destination update fields |
| `id`  <br>*ID* | **Required**  <br><br>Unique identifier for the data destination |
| `metaDatasetId`  <br>*String* | **Required**  <br><br>The Meta Pixel ID that needs to be integrated |
| `accessToken`  <br>*String* | **Required**  <br><br>Access token from MBE setup or manually generated from Events Manager |
| `apiVersion`  <br>*String* | Latest API Version for [Graph API](https://developers.facebook.com/docs/graph-api/changelog) |
| `businessId`  <br>*String* | **Required**  <br><br>The business ID of the account |
| `updateOB`  <br>*Boolean* | If the connection to meta dataset need to update or not. |

#### Returns
DataDestination

| Field | Description |
| --- | --- |
| `boolean`  <br>*Boolean* | Returns if the request is successful or not |

#### Error Codes

| Code | Description |
| --- | --- |
| 401 | Not authorized to view the data routing |
| 500 | Internal server error |

#### Sample Request

Query

```
mutation updateDataDestinationCapiConfigMutation(
     $tenantId: ID!
     $input: UpdateDataDestinationCapiConfigInput!
   ) {
     tenantMutations(tenantId: $tenantId) {
       dataDestinationMutations {
         updateDataDestinationCapiConfig(input: $input)
       }
     }
   }
```

#### Variables

```
{
  "tenantId": "IaoreXfj",
  "input": {
    "id": "sg_v1_dd_2a9fa3fb-b590-4eda-9a56-34e82ab15a4a",
    "metaDatasetId": "1007539807836438",
    "accessToken": "sdasdasdsa",
    "apiVaersion": "20.0.1"
    "businessId": "1007539807836438",
    "updateOB": true
  }
}
```

#### Sample Response

```
{
    "data": {
        "tenantMutations": {
            "dataDestinationMutations": {
                "updateDataDestinationCapiConfig": true
            }
        }
    }
}
```

### Update HTTP Custom Connection Data Destination Config

The mutation to update the config for a HTTP custom connection type data destination in the Signals Gateway.

#### Schema

```
POST https://{signals_gateway_domain}/capig/graphql/
<hr/>

mutation updateDataDestinationHttpConfigMutation(
  $tenantId: ID!
  $input: UpdateDataDestinationHttpConfigInput!
) {
  tenantMutations(tenantId: $tenantId) {
    dataDestinationMutations {
      updateDataDestinationHttpConfig(input: $input)
    }
  }
}

<hr/>
tenantId: ID!
<hr/>
input: UpdateDataDestinationHttpConfigInput {
  id: ID!
  endpoint: String!
  httpMethod: HttpMethodType!
  authType: AuthType!
  payloadSchema: String!
  apiKeyAuth: ApiKeyAuth
  basicAuth: BasicAuth
  clientCredentialsAuth: ClientCredentialsAuth
  jsonWebTokenAuth: JsonWebTokenAuth
}
```

#### Input Fields

| Field | Description |
| --- | --- |
| `tenantId`  <br>*ID* | **Required**  <br><br>Unique identifier for the account |
| `input`  <br>[*UpdateDataDestinationHttpConfigInput*](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/setup-data-pipelines/objects#data-destination) | Input of the Conversions API data destination update fields |

#### [UpdateDataDestinationHttpConfigInput](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/setup-data-pipelines/objects#data-destination)

| Field | Description |
| --- | --- |
| `id`  <br>*ID* | **Required**<br><br>Unique identifier for the data destination. |
| `endpoint`  <br>*String* | **Required**<br><br>URL endpoint for the HTTP custom connection. |
| `httpMethod`  <br>[*HttpMethodType*](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/setup-data-pipelines/objects#http-method-type) | **Required**<br><br>Type of the HTTP method. |
| `authType`  <br>[*AuthType*](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/setup-data-pipelines/objects#auth-type) | Auth type |
| `payloadSchema`  <br>*String* | **Required**<br><br>Schema of the payload |
| `apiKeyAuth`  <br>[*ApiKeyAuth*](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/setup-data-pipelines/objects#api-key-auth) | Structure of the API key auth |
| `basicAuth`  <br>[*BasicAuth*](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/setup-data-pipelines/objects#basic-auth) | Structure of the basic auth |
| `clientCredentialsAuth`  <br>[*ClientCredentialsAuth*](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/setup-data-pipelines/objects#client-credentials-auth) | Structure of the client auth |
| `jsonWebTokenAuth`  <br>[*JsonWebTokenAuth*](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/setup-data-pipelines/objects#json-webtoken-auth) | Web token |

#### Returns

DataDestination
| Field | Description |
| --- | --- |
| `boolean`  <br>*Boolean* | Returns if the request is successful or not. |

#### Error Codes

| Code | Description |
| --- | --- |
| 401 | Not authorized to view the data routing |
| 500 | Internal server error |

#### Sample Request

Query

```
mutation useUpdateDataDestinationHttpConfigMutation(
  $tenantId: ID!
  $input: UpdateDataDestinationHttpConfigInput!
) {
  tenantMutations(tenantId: $tenantId) {
    dataDestinationMutations {
      updateDataDestinationHttpConfig(input: $input)
    }
  }
}
```

#### Variables

```
{
  "tenantId": "IaoreXfj",
  "input": {
    "id": "sg_v1_dd_553fbb56-5348-4553-8215-0ced4a835ff3",
    "endpoint": "http://1213123.com",
    "httpMethod": "POST",
    "authType": "NONE",
    "apiKeyAuth": {
      "name": "",
      "value": "",
      "addTo": "HEADER"
    },
    "basicAuth": {
      "credentials": ""
    },
    "clientCredentialsAuth": {
      "clientId": "",
      "clientSecret": "",
      "authEndpoint": "",
      "httpMethod": "GET"
    },
    "payloadSchema": "{\n  \"data\": [\n    {% for event in events %}\n      {\n        \"action_source\": {{action_source}},\n        \"event_name\": {{event_name}},\n        \"event_time\": {{event_time}},\n        \"event_id\": {{event_id}},\n        \"user_data\": {\n          \"madid\": {{mobile_advertiser_id}},\n          \"client_ip_address\": {{client_ip_address}}\n        },\n        \"custom_data\": {\n          \"currency\": {{currency}},\n          \"value\": {{value}},\n          \"num_items\": {{num_items}}\n        },\n        \"app_data\": {\n          \"advertiser_tracking_enabled\": {{advertiser_tracking_enabled}},\n          \"application_tracking_enabled\": {{application_tracking_enabled}}\n        }\n    }\n    {% endfor %}\n  ]\n}"
  }
}
```

#### Sample Response

```
{
    "data": {
        "tenantMutations": {
            "dataDestinationMutations": {
                "updateDataDestinationHttpConfig": true
            }
        }
    }
}
```

