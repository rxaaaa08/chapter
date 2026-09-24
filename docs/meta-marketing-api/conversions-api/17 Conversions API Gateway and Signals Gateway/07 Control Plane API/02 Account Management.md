<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/account-management | Saved: 2026-09-19 -->

# "Conversions API Gateway and Signals Gateway Control Plane API: Reference"



**Warning:** Starting from Conversions API Gateway and Signals Gateway v2.2.0, up-to-date versions of the Control Plane API reference docs, including examples with sample data, can be accessed inside your gateway UI. To find these docs:

* Click on **Settings**
* Choose **API accounts**
* Click the **API Reference** link at the top of the API accounts page

## Account Management

### Create Account

Creates a Conversions API Gateway or Signals Gateway account, which can be managed by a partner or advertiser depending on the input.

#### Schema  

```
POST https://{capig_domain}/hub/graphql/

<hr/>

mutation CreateTenantMutation(
        $input: CreateTenantInput!
      ) {
        tenantMutations {
          createTenant(input: $input) {
            tenant {
              id
              name
              status
              canPartnerManage
              users {
                id
                email
                roles {
                    name
                    displayName
                }
                tenants {
                    id
                    name
                    status
                    canPartnerManage
                    availableRoles {
                        name
                        displayName
                    }
                }
                isSelf
                canBeDeleted
                defaultTenantId
              }
              availableRoles {
                name
                displayName
              }
              tenantUsage {
                  totalActivePixels
                  totalInactivePixels
                  totalPixels
                  tenantUsageByTraffic {
                    totalEventsReceived
                    totalPixelsWithTraffic
                    publishError
                    durationInHours,
                    lastUpdatedAt
                 }
              }
              canEditTenantSettingsInUI
              canViewTenantInUI
              canEditTenantUsersInUI
            }
          }
        }
      }
<hr/>
input CreateTenantInput {
    name: String!
    canPartnerManage: Boolean!
    adminEmail: String
    eventEnrichment: Boolean!
}
```

#### Fields

`CreateTenantInput`

| Field | Description |
| --- | --- |
| `name`  <br>*String* | **Required**  <br><br>Name of the account |
| `canPartnerManage`  <br>*Boolean* | **Required**  <br>Boolean indicating whether a partner can manage this account |
| `adminEmail`  <br>*String* | **Optional**  <br>Email address of the admin<br>(This is required if `canPartnerManage` is false) |
| `eventEnrichment`  <br>*Boolean* | **Required**  <br>Enhance events with advanced matching data |

#### Returns

`CreateTenantResult`

| Field | Description |
| --- | --- |
| `tenant`  <br>[*Tenant*](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api/reference/objects#tenant) | Newly created tenant |

#### Error Codes

| Code | Description |
| --- | --- |
| 400 | Invalid input provided |
| 401 | Not authorized to create account |
| 500 | Internal server error |

#### Sample Request

Mutation

```
mutation CreateTenantMutation(
       $input: CreateTenantInput!
     ) {
       tenantMutations {
         createTenant(input: $input) {
           tenant {
             id
             name
             status
             canPartnerManage
           }
         }
       }
     }
```

Variables

```
{
   "input": {
       "name": "TestAdvertiserViaAPI",
       "canPartnerManage": true,
       "eventEnrichment": true
       }
}
```

#### Sample Response

```
{
   "data": {
       "tenantMutations": {
         "createTenant": {
               "tenant": {
                 "id": "hU2koC34",
                 "name": "TestAdvertiserViaAPI",
                 "status": 0,
                 "canPartnerManage": true
                 "canEditTenantSettingsInUI": false
                 "canViewTenantInUI":  false
                 "canEditTenantUsersInUI": false
               }
           }
       }
   }
}
```

### Get Account

Gets the advertiser account corresponding to a unique identifier input.

#### Schema

```
POST https://{capig_domain}/hub/graphql/
<hr/>

query TenantAccountUsersViewQuery(
  $tenantId: String!
) {
  tenant(tenantId: $tenantId)  {
        id
        name
        status
        canPartnerManage
        users {
            id
            email
            roles {
                name
                displayName
            }
            tenants {
                id
                name
                status
                canPartnerManage
                availableRoles {
                    name
                    displayName
                }
            }
            isSelf
            canBeDeleted
            defaultTenantId
        }
        availableRoles {
            name
            displayName
        }
        tenantUsage {
            totalActivePixels
            totalInactivePixels
            totalPixels
            tenantUsageByTraffic {
               totalEventsReceived
               totalPixelsWithTraffic
               publishError
               durationInHours,
               lastUpdatedAt
            }
        }
        canEditTenantSettingsInUI
        canViewTenantInUI
        canEditTenantSettingsInUI
    }
}
<hr/>
tenantId: String!
```

#### Fields

| Field | Description |
| --- | --- |
| `tenantId`  <br>*String* | **Required**  <br><br>Unique identifier of the account to be fetched |

#### Returns

| Field | Description |
| --- | --- |
| `tenant`  <br>[*Tenant*](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api/reference/objects#tenant) | Account details are fetched |

#### Error Codes

| Code | Description |
| --- | --- |
| 401 | Not authorized to view account |
| 500 | Internal server error |

#### Sample Request

Query

```
query TenantAccountUsersViewQuery(
 $tenantId: String!
) {
 tenant(tenantId: $tenantId) {
   id
   name
   users {
     id
     email
     roles {
         name
         displayName
     }
   }
 }
}
```

Variables

```
{
   "tenantId":"wW58k7FQ"
}
```

#### Sample Response

```
{
   "data": {
       "tenant": {
           "id": "wW58k7FQ",
           "name": "Test Account",
           "users": [
               {
                   "id": "992bc489-a799-4374-8933-0109eed60e3d",
                   "email": "tempuser@test.com",
                   "roles": [
                       {
                           "name": "advertiser-manage-wW58k7FQ",
                           "displayName": "manage"
                       }
                   ]
               }
           ]
       }
   }
}
```

### Update Account

Updates the account with a new name, status and permission for the partner to manage the account.

#### Schema

```
POST https://{capig_domain}/hub/graphql/
<hr/>

 mutation TenantEditNameModalMutation(
  $input: UpdateTenantInput!
) {
  tenantMutations {
    updateTenant(input: $input) {
        tenant {
            id
            name
            status
            canPartnerManage
            users {
                id
                email
                roles {
                    name
                    displayName
                }
                tenants {
                    id
                    name
                    status
                    canPartnerManage
                    availableRoles {
                        name
                        displayName
                    }
                }
                isSelf
                canBeDeleted
                defaultTenantId
            }
            availableRoles {
                name
                displayName
            }
            tenantUsage {
                totalActivePixels
                totalInactivePixels
                totalPixels
                tenantUsageByTraffic {
                   totalEventsReceived
                   totalPixelsWithTraffic
                   publishError
                   durationInHours,
                   lastUpdatedAt
               }
            }
            canEditTenantSettingsInUI
            canViewTenantInUI
            canEditTenantSettingsInUI
        }
    }
  }
}

<hr/>
input UpdateTenantInput {
    tenantId: String!
    name: String
    status: Int
    canPartnerManage: Boolean
}
```

#### Fields
`UpdateTenantInput`

| Field | Description |
| --- | --- |
| `tenantId`  <br>*String* | **Required**  <br><br>Unique identifier of the account |
| `name`  <br>*String* | **Optional**  <br><br>Name of the account |
| `status`  <br>*Int* | **Optional**  <br><br>Account Status (Refer Tenant Object) |
| `canPartnerManage`  <br>*Boolean* | **Optional**  <br><br>Indicates whether the partner manage this account |

#### Returns
`TenantMutationResponse`

| Field | Description |
| --- | --- |
| `tenant`  <br>[*Tenant*](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api/reference/objects#tenant) | Updated tenant |

#### Error Codes

| Code | Description |
| --- | --- |
| 400 | Invalid input provided |
| 401 | Not authorized to update tenant |
| 500 | Internal server error |

#### Sample Request

Mutation

```
mutation TenantEditNameModalMutation(
 $input: UpdateTenantInput!
) {
 tenantMutations {
   updateTenant(input: $input) {
     tenant {
       id
       name
       status
       canPartnerManage
     }
   }
 }
}
```

Variables

```
{
   "input":{
       "tenantId":"IaoreXfj",
       "name":"Test Account Name Update",
       "status":0,
       "canPartnerManage":true
   }
}
```

#### Sample Response

```
{
   "data": {
       "tenantMutations": {
           "updateTenant": {
               "tenant": {
                   "id": "IaoreXfj",
                   "name": "Test Account Name Update",
                   "status": 0,
                   "canPartnerManage": true
               }
           }
       }
   }
}
```

### Delete Account

Deletes an advertiser account.

#### Schema

```
POST https://{capig_domain}/hub/graphql/
<hr/>

    mutation DeleteTenant($tenantId: String!) {
      tenantMutations {
        deleteTenant(tenantId: $tenantId)
      }
    }

<hr/>
tenantId: String!
```

#### Fields

| Field | Description |
| --- | --- |
| `tenantId`  <br>*String* | **Required**  <br><br>Unique identifier of the account to be deleted. |

#### Returns

|  |  |
| --- | --- |
| Boolean | Indicates whether the tenant was successfully deleted. |

#### Error Codes

| Code | Description |
| --- | --- |
| 400 | Invalid input provided |
| 401 | Not authorized to delete account |
| 500 | Internal server error |

#### Sample Request

Mutation

```
 mutation DeleteTenant($tenantId: String!) {
   tenantMutations {
   deleteTenant(tenantId: $tenantId)
   }
}
```

Variables

```
{
   "tenantId": "Tse53QtW"
}
```

#### Sample Response

```
{
   "data": {
       "tenantMutations": {
           "deleteTenant": true
       }
   }
}
```

### Account Usage

Gets the account usage in terms of active and inactive Pixels corresponding to a unique identifier for the account. Additionally, it returns the traffic usage stats for a duration

#### Schema

```
POST https://{capig_domain}/hub/graphql/
<hr/>

query TenantUsageQuery(
  $tenantId: String!
) {
    tenantUsage(tenantId: $tenantId) {
        totalActivePipeline
        totalInactivePixels
        totalPixels
        totalPipelines
        tenantUsageByTraffic {
           totalEventsReceived
           totalPixelsWithTraffic
       }
    }
}

<hr/>
tenantId: String!
```

#### Fields

| Field | Description |
| --- | --- |
| `tenantId`  <br>*String* | **Required**  <br><br>Unique identifier of the account |

#### Returns

| Field | Description |
| --- | --- |
| `TenantUsage`  <br>*TenantUsage* | TenantUsage |

#### Error Codes

| Code | Description |
| --- | --- |
| 401 | Not authorized to view account usage |
| 500 | Internal server error |

#### Sample Request

Query

```
query {
   tenantUsage(tenantId: "IaoreXfj"){
       totalActivePixels
       totalInactivePixels
       totalPixels
   }
}
```

#### Sample Response

```
{
   "data": {
       "tenantUsage": {
           "totalActivePixels": 3,
           "totalPixels": 4
       }
   }
}
```

## See Also

* [Conversions API Gateway for Multiple Accounts Control Plane API](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api)
* [Control Plane API: Reference](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api/reference)
* [Control Plane API Reference: User Management](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api/reference/user-management)
* [Control Plane API Reference: Pixel Management](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api/reference/pixel-management)
* [Control Plane API Reference: Account Data Routing Configuration](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api/reference/account-data-routing)
* [Control Plane API Reference: Account Event Metrics](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api/reference/account-event-metrics)
* [Control Plane API Reference: Objects](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-control-plane-api/reference/objects)
