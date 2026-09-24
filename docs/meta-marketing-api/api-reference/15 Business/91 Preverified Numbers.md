<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/preverified_numbers | Saved: 2026-09-19 -->

# Business Preverified Numbers



Represents a collection of [WhatsApp Business Pre-Verified Phone Numbers](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-pre-verified-phone-number) on a business. See [Pre-Verified Phone Numbers](https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/pre-verified-numbers).

## Reading

Get a list of [WhatsApp Business Pre-Verified Phone Numbers](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-pre-verified-phone-number) on a business.

### Requirements

| Type | Description |
| --- | --- |
| [Access Token](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens) | [User](https://developers.facebook.com/documentation/business-messaging/whatsapp/access-tokens#user-access-tokens) or [System User](https://developers.facebook.com/documentation/business-messaging/whatsapp/access-tokens#system-user-access-tokens) |
| [Permissions](https://developers.facebook.com/docs/permissions/reference) | [business_management](https://developers.facebook.com/docs/permissions#b) |

### Request Syntax

```http
GET https://graph.facebook.com/<API_VERSION>/<BUSINESS_ACCOUNT_ID>/preverified_numbers
  ?fields=<FIELDS>
```

### Path Parameters

| Placeholder | Description | Sample Value |
| --- | --- | --- |
| `<API_VERSION>` | **Optional.**<br><br>API [version](https://developers.facebook.com/docs/graph-api/guides/versioning). | v25.0 |
| `<BUSINESS_ACCOUNT_ID>` | Business account ID. | `506914307656634` |

### Query String Parameters

| Placeholder | Description | Sample Value |
| --- | --- | --- |
| `<FIELDS>` | **Optional.**<br><br>A comma-separated list of [fields](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-pre-verified-phone-number#fields) you want returned on each WhatsApp Business Pre-Verified Phone Number in the result set. | `phone_number,code_verification_time,code_verification_status,verification_expiry_time` |

### Response

A collection of [WhatsApp Business Pre-Verified Phone Numbers](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-pre-verified-phone-number) and their default fields on the business.

```json
{
  "data": [
    {
      "phone_number": "<PHONE_NUMBER>",
      "code_verification_status": "<CODE_VERIFICATION_STATUS>",
      "verification_expiry_time": "<VERIFICATION_EXPIRY_TIME>",
      "id": "<ID>"
    },
    ...
  ],
  "paging": {
    "cursors": {
      "before": "QVFIU...",
      "after": "QVFIU..."
    }
  }
}
```

### Sample Request

```curl
curl -X GET 'https://graph.facebook.com/v25.0/506914307656634/preverified_numbers' \
-H 'Authorization: Bearer EAAJB...'
```

### Sample Response

```json
{
  "data": [
    {
      "phone_number": "+1 211-555-5105",
      "code_verification_status": "VERIFIED",
      "verification_expiry_time": "2023-04-14T22:12:31+0000",
      "id": "5745365898905902"
    },
    {
      "phone_number": "+1 211-555-7165",
      "code_verification_status": "VERIFIED",
      "verification_expiry_time": "2023-04-14T22:10:57+0000",
      "id": "9010077509033461"
    },
    ...
  ],
  "paging": {
    "cursors": {
      "before": "QVFIU...",
      "after": "QVFIU..."
    }
  }
}
```

#### Parameters

| Parameter | Description |
| --- | --- |
| `code_verification_status`<br><br>*enum {VERIFIED, NOT_VERIFIED, EXPIRED}* | Indicates verification status. Values can be:<br><br><br>• `EXPIRED` — Phone number number was verified more than 14 days ago.<br>• `NOT_VERIFIED` — Phone number has never been verified.<br>• `VERIFIED` — Phone number number was verified in the last 14 days.<br> |
| `phone_number`<br><br>*string* | The business pre-verified phone number's display phone number.<br> |

#### Fields

Reading from this edge will return a JSON formatted result:

```
{
"data": [],
"paging": {}
}
```

##### data

A list of [WhatsAppBusinessPreVerifiedPhoneNumber](https://developers.facebook.com/docs/graph-api/reference/whats-app-business-pre-verified-phone-number) nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

#### Error Codes

| Error Code | Description |
| --- | --- |
| 200 | Permissions error |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

