<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/setup-data-pipelines/objects | Saved: 2026-09-19 -->

# Gateway Control Plane API Reference



## Data Pipelines Objects

### Pipeline {#pipeline}

| Field | Description |
| --- | --- |
| `id`  <br>*ID* | Unique id of the created gateway data pipeline. |
| `name`  <br>*String* | Name of the created gateway data pipeline. Provided in the input parameter. |
| `active`  <br>*Boolean* | Data pipeline status. Indicate if the pipeline is active or not. |
| `type`  <br>[*PipelineType*](#pipeline-type) | Type of the data pipeline. for example, `GATEWAY_PIPELINE` |
| `dataSources`  <br>[*DataSourceShallow*](#data-source) | List of data sources associated with this data pipeline. Expected to be an empty list from the create data pipeline request. |
| `dataDestinations`  <br>[*DataDestinationShallow*](#data-destination) | List of data destinations associated with this data pipeline. Expected to be an empty list from the create data pipeline request. |
| `dataFilter`  <br>[*DataFilter*](#data-filter) | The data filter contains a list of blocked event types which are associated with this data pipeline. Expected to be an empty list from the create data pipeline request. |

### DataSource {#data-source}

| Field | Description |
| --- | --- |
| `id`  <br>*ID* | Unique identifier of the data source. |
| `name`  <br>*String* | Name of the data source. |
| `type`  <br>[*DataSourceType*](#data-source-type) | Type of the data source. |
| `active`  <br>*Boolean* | The status of the data source indicates if it is active or not. |
| `associatedPipelines`  <br>[*PipelineBasicInfo*](#pipeline-basic-info) | A list of data pipelines which contain this data source. |

### DataDestination {#data-destination}

| Field | Description |
| --- | --- |
| `id`  <br>*ID* | Unique identifier of the data destination. |
| `name`  <br>*String* | Name of the data destination. |
| `type`  <br>[*DataDestinationType*](#data-destination-type) | Type of the data destination. |
| `active`  <br>*Boolean* | The status of the data destination indicates if it is active or not. |
| `associatedPipelines`  <br>[*PipelineBasicInfo*](#pipeline-basic-info) | A list of data pipelines which contain this data destination. |

### DataFilter {#data-filter}

| Field | Description |
| --- | --- |
| `filterStatus`  <br>*Boolean* | The status of the data filter indicates if the filter is active or not. |
| `blockedEventTypes`  <br>[*String*] | A list of blocked event type names. The blocked events won't be processed by the data pipeline. |

### PipelineDestinationFilter {#pipeline-destination-filter}

| Field | Description |
| --- | --- |
| `id`  <br>*ID* | Unique id of the created gateway data pipeline. |
| `destinationId`  <br>*ID* | Unique identifier of the data destination. |
| `destinationFilterStatus`  <br>*Boolean* | The status of the pipeline destination filter indicates if the filter is active or not. |
| `destinationFilterBlockedEventTypes`  <br>[*String*] | A list of blocked event type names. The blocked events won't be processed by the data destination in the specific data pipeline. |

### GatewayPixelConfig {#gateway-pixel-config}

| Field | Description |
| --- | --- |
| `id`  <br>*ID* | Unique ID of the created Signals Gateway Pixel. |
| `name`  <br>*String* | Name of the Signals Gateway Pixel. |
| `enabledStatus`  <br>*Boolean* | The status of the Signals Gateway Pixel indicates if it is active or not. |
| `plugins`  <br>[*String*] | A list of enabled plugins for the Signals Gateway Pixel. |
| `aamFields`  <br>[*String*] | The enabled advanced matching fields. |
| `enableContactDataHash`  <br>*Boolean* | Indicate if the data hash is enabled for the Signals Gateway Pixel. |
| `customIntegrityScript`  <br>*String* | The custom integrity script applied to the Signals Gateway Pixel. |
| `estRuleGroups`  <br>[*PixelESTRuleGroupConfig*] | A list of event setup rules. |
| `iwlParameters`  <br>[*PixelIWLParametersConfig*] | A list of IWL parameters. |
| `creationSourcePlatform`  <br>*String* | The creation source platform of the Signals Gateway Pixel. It can be from Signals Gateway or imported from Meta Pixel. |
| `creationSourceId`  <br>*String* | The creation source ID of the Signals Gateway Pixel. It can be the imported Meta Pixel ID. |

### PipelineBasicInfo {#pipeline-basic-info}

| Field | Description |
| --- | --- |
| `id`  <br>*ID* | Unique id of the created gateway data pipeline. |
| `name`  <br>*String* | Name of the created gateway data pipeline. Provided in the input parameter. |
| `type`  <br>*PipelineType* | Type of the data pipeline. for example, `GATEWAY_PIPELINE`. |

### ApiKeyAuth {#api-key-auth}

| Field | Description |
| --- | --- |
| `name`  <br>*String* | Name of the API key auth. |
| `value`  <br>*String* | Value of the API key auth. |
| `addTo`  <br>[*AddAuthTo*](#add-auth-to) | The part of the request to add auth to. |

### BasicAuth {#basic-auth}  

| Field | Description |
| --- | --- |
| `credentials`  <br>*String* | Credentials of the basic auth. |

### ClientCredentialsAuth {#client-credentials-auth}

| Value | Description |
| --- | --- |
| `authEndpoint`  <br>*String* | This is the URL of the authorization endpoint that the client will use to obtain an access token. The client will send a request to this endpoint to authenticate and obtain a token. |
| `httpMethod`  <br>[*HttpMethodType*](#http-method-type) | This specifies the HTTP method (for example, `POST`, `GET`, etc.) that the client will use to send the authentication request to the authEndpoint. |
| `clientId`  <br>*String* | This is a unique identifier for the client (for example, an application or a service) that is requesting access to the server. The clientId is used to identify the client and is typically provided by the server during the registration process. |
| `clientSecret`  <br>*String* | This is a secret key that is associated with the clientId. The clientSecret is used to authenticate the client and is typically kept confidential to prevent unauthorized access. |

### JsonWebTokenAuth {#json-webtoken-auth}

| Field | Description |
| --- | --- |
| `serviceUserAccount`  <br>*String* | This is the account name of the service user that is used to authenticate with the server. The service user account is typically a unique identifier for the client. |
| `privateKey`  <br>*String* | This is the private key associated with the service user account. The private key is used to sign the JWT token, which is then sent to the server as part of the authentication request. |

### DataSourceType {#data-source-type}

| Type |
| --- |
| META_PIXEL |
| ADVERTISER_HOSTED_PIXEL |
| FILE_UPLOAD |
| UNKNOWN |

### DataDestinationType {#data-destination-type}

| Type |
| --- |
| META_CONVERSIONS_API |
| CUSTOM_HTTP_API |
| AUDIENCE_STORAGE |
| GOOGLE_BIGQUERY_API |
| UNKNOWN |

### PipelineType {#pipeline-type}

| Type |
| --- |
| META_CAPI_PIPELINE |
| GATEWAY_PIPELINE |

### HttpMethodType {#http-method-type}

| Type |
| --- |
| GET |
| POST |
| PUT |
| UNKNOWN |

### AuthType {#auth-type}

| Type |
| --- |
| NONE |
| API_KEY |
| BASIC |
| CLIENT_CREDENTIALS |
| JSON_WEB_TOKEN |
| UNKNOWN |

### AddAuthTo {#add-auth-to}

| Type |
| --- |
| HEADER |
| QUERY_PARAM |
| UNKNOWN |

