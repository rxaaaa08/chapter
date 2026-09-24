<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/objects | Saved: 2026-09-19 -->

# "Conversions API Gateway and Signals Gateway Control Plane API: Reference"



**Warning:** Starting from Conversions API Gateway and Signals Gateway v2.2.0, up-to-date versions of the Control Plane API reference docs, including examples with sample data, can be accessed inside your gateway UI. To find these docs:

* Click on **Settings**
* Choose **API accounts**
* Click the **API Reference** link at the top of the API accounts page

## Objects

### Tenant {#tenant}

| Field | Description |
| --- | --- |
| `id`  <br>*String* | Unique identifier of the account |
| `name`  <br>*String* | Name of the account |
| `status`  <br>*Int* | Account status can have 3 values indicating its state:<br><br>\| Value \| Description \|<br>\| --- \| --- \|<br>\| 0 \| Active \|<br>\| 1 \| Pending Configuration \|<br>\| 2 \| Deactivated \| |
| `canPartnerManage`  <br>*Boolean* | This flag indicates whether a partner can manage this account |
| `users`  <br>[*User*](#user) | List of users in the account |
| `availableRoles`  <br>[*Role*](#role) | Available roles for the account |
| `canEditTenantSettingsInUI`  <br>*Boolean* | This flag indicates whether user can modify account settings like Pixels, domains, and so on. |
| `canViewTenantInUI`  <br>*Boolean* | Ths flag indicates whether the user can actually view the account detail in UI. |
| `canEditTenantUsersInUI`  <br>*Boolean* | This flag indicates whether a user can add/remove users in account user list, or change their permissions. |
| `tenantUsage`  <br>*TenantUsage* | Tenant Usage info. |

### User {#user}

| Field | Description |
| --- | --- |
| `id`  <br>*String* | Unique identifier of the user |
| `email`  <br>*String* | User's email address |
| `status`  <br>*Int* | User status can have 3 values indicating its state:<br><br>\| Value \| Description \|<br>\| --- \| --- \|<br>\| 0 \| Deactivated \|<br>\| 1 \| Activated \|<br>\| 2 \| Pending \| |
| `roles`  <br>[*Role*](#role) | List of roles of the user |
| `tenants`  <br>[*Tenant*](#tenant) | Accounts to which the user belongs |
| `isSelf`  <br>Boolean | This indicates whether the logged in user is the same user (would be always false with api). |
| `canBeDeleted`  <br>*Boolean* | This indicates that the user is the only admin of one/more of the accounts, so it can't be deleted. |
| `userExpiry`  <br>*String* | Expiration date for temporary user, in the format of date string "yyyy-mm-dd". |

### Role {#role}  

| Field | Description |
| --- | --- |
| `name`  <br>*String* | Full name of the role.<br><br>Roles can be for agency (partner) users or advertisers (account) users.<br><br>Role name follows the following format:<br><br>For partner:<br>**agency-[ROLE-ACTION]**<br><br>For advertisers:<br>**advertiser-[ROLE-ACTION]-[tenantId]**<br><br>**[ROLE-ACTION]** -- This describes the responsibility of the role. It can have one of the 3 values:<br><br>1. admin<br>2. user<br>3. view<br><br>**[tenantId]** - The id of the account whose roles are being assigned to users |
| `displayName`  <br>*String* | This is the **[ROLE-ACTION]** of the role |
| `tenantName`  <br>*String* | Name of the tenant/account. |

### UserType

| Value | Description |
| --- | --- |
| AGENCY | This is for partners/host |
| ADVERTISER | This is for tenant/account. |

### SignalConfig

| Field | Description |
| --- | --- |
| `id`  <br>*ID* | Unique identifier of the format `SignalConfig:<pixel id>` |
| `connectionId`  <br>*String* | The Meta Pixel ID |
| `connectionStatus`  <br>[*ConnectionStatus*](#connection-status) | Connection status of the Meta Pixel |

### ConnectionStatus {#connection-status}

| Field | Description |
| --- | --- |
| `id`  <br>*ID* | Unique identifier of the Meta Pixel connection `ConnectionStatus:<pixel id>` |
| `connected`  <br>*Boolean* | Indicates whether Meta Pixel ID and access token are present. |
| `active`  <br>*Boolean* | Indicating whether Meta Pixel is active or not. |
| `eventBridgeActive`  <br>*Boolean* | Indicating whether Event Bridge is active for the Meta Pixel. |
| `publishingEnabled`  <br>*Boolean* | Indicating whether events can be published. |
| `accessKey`  <br>*String* | Access Key for Event Bridge |
| `apiErrorCode`  <br>*String* | Last error code from publishing to the Meta Conversions API. Value will be of the format `<error code>.<error subcode>`. [(Reference)](https://developers.facebook.com/docs/graph-api/guides/error-handling) |
| `pixelID`  <br>*String* | The unique identifier of the Meta Pixel |
| `pixelName`  <br>*String* | Name of the Meta Pixel |
| `accessTokenAvailable`  <br>*Boolean* | Access token to publish to the Conversions API present or not |
| `totalEventsPublished`  <br>*Float* | Total events published |
| `lastPublished`  <br>*Float* | Timestamp of last event published |
| `totalEventsReceived`  <br>*Float* | Total events received |
| `lastReceived`  <br>*Float* | Timestamp of last event received |

### IngressDomain

| Field | Description |
| --- | --- |
| `id`  <br>*ID* | Unique ID for the ingress |
| `tenantName`  <br>*String* | Name of the account |
| `ingress`  <br>*String* | Advertiser domain |
| `enhancementTenantIngressVerifiedResult`  <br>[*EnhancementTenantIngressVerifiedResult*](#enhancement-tenant-ingress) | [See below](#enhancement-tenant-ingress) |
| `cnameResolveSuccess`  <br>*Boolean* | Advertiser domain's CName is verified |

### EnhancementTenantIngressVerifiedResult {#enhancement-tenant-ingress}  

| Field | Description |
| --- | --- |
| `id`  <br>*ID* | Unique ID for the form `<tenantId>:tenantIngressVerified` |
| `tenantIngressVerified`  <br>*Boolean* | Boolean indicating valid domain for enhancement features |

### EventFilter

| Field | Description |
| --- | --- |
| `eventName`  <br>*String* | Name of the event |
| `pixelId`  <br>*String* | The Pixel that the filter applies to. It is null if the filter is applied to all the Pixels. |
| `filterState`  <br>[*EventFilterState*](#event-filter-state) | State of the event filter |

### EventFilterState {#event-filter-state}  

| Value |
| --- |
| PUBLISH |
| DROP |
| MIXED |

### DomainFilter

| Field | Description |
| --- | --- |
| `eventName`  <br>*String* | Name of the domain |
| `pixelId`  <br>*String* | The Pixel that the filter applies to. It is null if the filter is applied to all the Pixels. |
| `filterState`  <br>[*DomainFilterState*](#domain-filter-state) | State of the event filter |

### DomainFilterState {#domain-filter-state}  

| Value |
| --- |
| PUBLISH |
| DROP |
| MIXED |

### EventTrafficSummary  

| Field | Description |
| --- | --- |
| `id`  <br>*ID* | Identifier for EventTrafficSummary - always EventTrafficSummary:incoming |
| `eventNamesCount`  <br>*Int* | Count of the event names received |
| `eventsCount`  <br>*Int* | Total events received |

### ConversionsApiPublishSummary {#capi-pub-summary}

| Field | Description |
| --- | --- |
| `id`  <br>*ID* | Identifier for ConversionsApiPublishSummary - always ConversionsApiPublishSummary:global |
| `eventNamesCount`  <br>*Int* | Count of the event names sent |
| `eventsCount`  <br>*Int* | Total events sent |
| `publishSuccessRate`  <br>*Float* | Success rate of publishing events |

### EventActivity {#event-activity}

| Field | Description |
| --- | --- |
| `id`  <br>*ID* | Identifier for EventActivity of the format - EventActivity:`<event name>` |
| `name`  <br>*String* | Event name |
| `receivedCount`  <br>*Int* | Total events received |
| `publishedCount`  <br>*Int* | Total events published |
| `lastUpdated`  <br>*String* | Last updated time |

### DomainActivity {#domain-activity}  

| Field | Description |
| --- | --- |
| `id`  <br>*ID* | Unique identifier for DomainActivity of the format - DomainActivity:`<domain name>` |
| `domainName`  <br>*String* | Domain name |
| `receivedCount`  <br>*Int* | Total events received |
| `publishedCount`  <br>*Int* | Total events published |

### TenantUsage {#tenant-usage}  

| Field | Description |
| --- | --- |
| `totalPixels`  <br>*Int* | Total pixels in the account |
| `totalActivePixels`  <br>*Int* | Total active pixels in the account |
| `totalInactivePixels`  <br>*Int* | Total inactive pixels in the account |
| `tenantUsageByTraffic`  <br>*TenantUsageByTraffic* | Tenant usage by traffic |
| `pixelIds`  <br>*String* | List of associated pixel ids |

### TenantUsageByTraffic {#tenant-usage-by-traffic}  

| Field | Description |
| --- | --- |
| `totalEventsReceived`  <br>*Long* | Total events received for a Tenant for a duration |
| `totalPixelsWithTraffic`  <br>*Int* | Total number of pixels with traffic for a duration |
| `publishError`  <br>*Boolean* | Error publishing to CAPI for a duration |
| `durationInHours`  <br>*Int* | The duration |
| `lastUpdatedAt`  <br>*String* | Last updated at |

