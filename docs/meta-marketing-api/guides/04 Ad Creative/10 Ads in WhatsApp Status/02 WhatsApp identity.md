<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-in-whatsapp-status/whatsapp-identity | Saved: 2026-09-19 -->

# Create ad creatives with WhatsApp identity



Ad creatives with a WhatsApp identity associate your WhatsApp business profile with ads delivered on WhatsApp Status placements using the `wamo_whatsapp_identity_spec` field. You can provide either a `wamo_whatsapp_identity_id` or a `whatsapp_phone_number`. If you provide both, they must be linked to the same WhatsApp business profile.

## Supported placements

To deliver ads on WhatsApp Status, your ad set targeting must include the `whatsapp` publisher platform with the `status` position:

| Field | Value |
| --- | --- |
| `publisher_platforms` | `["whatsapp"]` |
| `whatsapp_positions` | `["status"]` |

Your campaign must use an objective, optimization goal, and destination compatible with the WhatsApp Status placement. WhatsApp Status is available when Instagram Stories is also selected (`instagram_positions: ["story"]`). Standalone Status campaigns are not supported at this time.

## Identity types

The `wamo_whatsapp_identity_id` field accepts an ID from one of three entity types:

| Identity type | Description |
| --- | --- |
| Page ID | Facebook Page identity (`PAGE_BACKED`). This is the default when no identity is explicitly provided. |
| Page WhatsApp Number ID | A Phone Link or Business Link identity. |
| WhatsApp Business Account to Number ID | A Business Connected identity. |

When you create a creative for a campaign with the WhatsApp Status placement and do not provide a `wamo_whatsapp_identity_spec`, the Facebook Page identity is used by default.

## Permissions

All endpoints require one of the following permissions on your access token:

- `ads_management`
- `business_management` (if access is granted through Business Manager)

## Request syntax

Use the `POST /<AD_ACCOUNT_ID>/adcreatives` endpoint to create an ad creative with a WhatsApp identity.

```bash
curl 'https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer <ACCESS_TOKEN>' \
-d '
{
  "object_story_spec": {
    "page_id": "<PAGE_ID>",
    "link_data": {
      "link": "<LANDING_URL>",
      "call_to_action": {
        "type": "<CTA_TYPE>",
        "value": {
          "app_destination": "whatsapp"
        }
      }
    }
  },
  "wamo_whatsapp_identity_spec": {
    "wamo_whatsapp_identity_id": "<IDENTITY_ID>",
    "whatsapp_phone_number": "<PHONE_NUMBER>"
  }
}'
```

### Request parameters

| Placeholder | Description | Example value |
| --- | --- | --- |
| `<AD_ACCOUNT_ID>` | Required. Your ad account ID. | `act_123456789` |
| `<ACCESS_TOKEN>` | Required. Your access token with `ads_management` or `business_management` permission. | `EAAJB...` |
| `<PAGE_ID>` | Required. The Facebook Page ID associated with the ad creative. | `109876543210` |
| `<LANDING_URL>` | Required. The destination URL for the ad. | `https://www.example.com` |
| `<CTA_TYPE>` | Required. The call-to-action type. | `LEARN_MORE` |
| `<IDENTITY_ID>` | Optional. The WhatsApp identity ID to associate with this creative. Can be a Page ID, Page WhatsApp Number ID, or WhatsApp Business Account to Number ID. Also accepts `whatsapp_phone_number` to specify the WhatsApp phone number. If omitted, some ads may not be delivered to WhatsApp Status. | `987654321098765` |

## Supported media formats

Creative creation supports single image and single video media formats for the WhatsApp Status placement.

## Example request — explicit identity

Create an ad creative with a specific WhatsApp identity:

```bash
curl 'https://graph.facebook.com/v25.0/act_123456789/adcreatives' \
-H 'Content-Type: application/json' \
-H 'Authorization: Bearer EAAJB...' \
-d '
{
  "object_story_spec": {
    "page_id": "109876543210",
    "link_data": {
      "link": "https://www.example.com/summer-sale",
      "call_to_action": {
        "type": "LEARN_MORE",
        "value": {
          "app_destination": "whatsapp"
        }
      }
    }
  },
  "wamo_whatsapp_identity_spec": {
    "wamo_whatsapp_identity_id": "987654321098765",
    "whatsapp_phone_number": "+1234567890"
  }
}'
```

## Example response

```json
{
  "id": "120210123456780123"
}
```

## Read ad creatives with WhatsApp identity

To retrieve the `wamo_whatsapp_identity_spec` field from existing ad creatives, include it in the `fields` parameter of any GET creative endpoint:

```bash
curl 'https://graph.facebook.com/v25.0/<AD_CREATIVE_ID>?fields=wamo_whatsapp_identity_spec{wamo_whatsapp_identity_id,whatsapp_phone_number}' \
-H 'Authorization: Bearer EAAJB...'
```

The following GET endpoints support the `wamo_whatsapp_identity_spec` field:

| Endpoint | Description |
| --- | --- |
| `GET /<AD_CREATIVE_ID>` | Read a single ad creative. |
| `GET /<AD_ACCOUNT_ID>/adcreatives` | List all ad creatives for an ad account. |
| `GET /<CAMPAIGN_ID>/adcreatives` | List ad creatives for a campaign. |
| `GET /<AD_ID>/adcreatives` | List ad creatives for an ad. |

### Example response

```json
{
  "wamo_whatsapp_identity_spec": {
    "wamo_whatsapp_identity_id": "987654321098765",
    "whatsapp_phone_number": "1234567890"
  },
  "id": "120210123456780123"
}
```

## Preview ads on WhatsApp Status

To generate a preview of an ad rendered on WhatsApp Status, use `ad_format=WHATSAPP_STATUS_MEDIA` with any preview endpoint. Previews render with the correct WhatsApp identity.

| Endpoint | Description |
| --- | --- |
| `GET /<AD_CREATIVE_ID>/previews` | Preview an ad creative. |
| `GET /<AD_ID>/previews` | Preview an ad. |
| `GET /<AD_ACCOUNT_ID>/generatepreviews` | Generate a preview from a creative spec. |

### Example request

```bash
curl 'https://graph.facebook.com/v25.0/120210123456780123/previews?ad_format=WHATSAPP_STATUS_MEDIA' \
-H 'Authorization: Bearer EAAJB...'
```

## Limitations

- **Creative update**: Updating `wamo_whatsapp_identity_spec` on an existing creative is not supported through the Marketing API. The `POST /<AD_CREATIVE_ID>` update endpoint only accepts `status`, `name`, and `ad_labels`. To change the identity, create a new creative.
