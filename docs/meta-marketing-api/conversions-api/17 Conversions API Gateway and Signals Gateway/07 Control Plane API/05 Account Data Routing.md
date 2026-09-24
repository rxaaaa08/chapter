<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/account-data-routing | Saved: 2026-09-19 -->

# "Conversions API Gateway and Signals Gateway Control Plane API: Reference"



**Warning:** Starting from Conversions API Gateway and Signals Gateway v2.2.0, up-to-date versions of the Control Plane API reference docs, including examples with sample data, can be accessed inside your gateway UI. To find these docs:

* Click on **Settings**
* Choose **API accounts**
* Click the **API Reference** link at the top of the API accounts page

## Account Data Routing Configuration

### Get Data Routing
The query to get the current data routing config of a tenant.

#### Schema  

```
POST https://{capig_domain}/hub/graphql/
<hr/>

query DataRoutingQuery(
 $tenantId: ID!
) {
   ingressDomain(tenantId: $tenantId) {
     id
     ingress
     tenantName
     cnameResolveSuccess
  }
}

<hr/>
tenantId: ID!
```

#### Fields

| Field | Description |
| --- | --- |
| `tenantId`  <br>*ID* | **Required**  <br><br>Unique identifier for the account |

#### Returns

| Field | Description |
| --- | --- |
| `IngressDomain`  <br>[*IngressDomain*](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/objects#ingressdomain) | Ingress domain object |

#### Error Codes

| Code | Description |
| --- | --- |
| 401 | Not authorized to view the data routing |
| 500 | Internal server error |

#### Sample Request

Query

```
query DataRoutingCardQuery($tenantId: String!) {
      ingressDomain(tenantId: $tenantId) {
        id
        ingress
        tenantName
        cnameResolveSuccess
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
    "ingressDomain": {
      "id": "IaoreXfj:ingress",
      "ingress": "www.example.com",
      "tenantName": "IaoreXfj",
      "cnameResolveSuccess": false
    }
  }
}
```

### Update Data Routing
Allows defining a first-party domain for the Meta Pixel to communicate with Conversions API Gateway or Signals Gateway. [More details here](https://developers.facebook.com/documentation/ads-commerce/gateway-products/host-management/account-management/account-data-routing).

#### Schema  

```
POST https://{capig_domain}/hub/graphql/
<hr/>

mutation IngressEditingModalMutation(
 $tenantId: ID!
 $input: IngressDomainInput
) {
   upsertIngressDomain(input: $input) {
     id
    tenantName
    ingress
    tenant1pDomain
    tenant1pDomainStatus
    cnameResolveSuccess
   }
 }

<hr/>
tenantId: ID!
<hr/>
input IngressDomainInput {
  ingress: String!
  targetDomain: String!
}
```

#### Fields

| Field | Description |
| --- | --- |
| `tenantId`  <br>*String* | **Required**  <br><br>Unique identifier of the account |

#### `IngressDomainInput`

| Field | Description |
| --- | --- |
| `ingress`  <br>*String* | **Required**  <br><br>New subdomain that needs be updated |
| `targetDomain`  <br>*String* | **Required**  <br><br>Partner Conversions API Gateway or Signals Gateway Domain |

#### Returns

| Field | Description |
| --- | --- |
| `IngressDomain`  <br>[*IngressDomain*](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api/reference/objects#ingressdomain) | Ingress domain object |

#### Error Codes

| Code | Description |
| --- | --- |
| 401 | Not authorized to upgrade ingress domain |
| 500 | Internal server error |

#### Sample Request

Mutation

```
mutation IngressEditingModalMutation(
  $tenantId: ID!
  $input: IngressDomainInput
) {
  upsertIngressDomain(input: $input, tenantId: $tenantId) {
    id
    ingress
    cnameResolveSuccess
  }
}
```

Variables

```
{
  "tenantId": "IaoreXfj",
  "input": {
      "ingress": "capig.advertiser.com",
      "targetDomain": "capig.targetDomain.com"
  }
}
```

#### Sample Response

```
{
   "data": {
    "upsertIngressDomain": {
      "id": "admin:ingress",
      "tenantName": "Tenant for test@meta.com",
      "ingress": "capig.advertiser.com",
      "tenant1pDomain": "capig.advertiser.com",
      "tenant1pDomainStatus": "DOMAIN_NOT_SELECTED",
      "cnameResolveSuccess": false
    }
  }
```

## See Also

* [Conversions API Gateway for Multiple Accounts Control Plane API](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api)
* [Control Plane API: Reference](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api/reference)
* [Control Plane API Reference: Account Management](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api/reference/account-management)
* [Control Plane API Reference: User Management](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api/reference/user-management)
* [Control Plane API Reference: Pixel Management](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api/reference/pixel-management)
* [Control Plane API Reference: Account Event Metrics](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api/reference/account-event-metrics)
* [Control Plane API Reference: Objects](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api/reference/objects)
