<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative-marketing-message-structured-spec | Saved: 2026-09-19 | Converted from the web page: Meta's "View as Markdown" export returns an error for this page -->

# Ad Creative, Marketing Message Structured Spec

Ads in WhatsApp Status are available via the Marketing API. [Learn more about ads in WhatsApp Status.](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-in-whatsapp-status)

**Optional.** Customizations for the WhatsApp marketing message delivered with an ad.

 You do not need this spec to deliver marketing messages. When you leave `marketing_message_structured_spec` unset, the marketing message content comes from the ad creative's `object_story_spec`, the same content that drives the rest of the ad. Set the spec on an [ad creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative) only when you want the marketing message to differ from that default, for example, to give it its own body text, add quick-reply buttons, attach an auto-reply, or show an offer.

 Every field within the spec is optional as well, and each one falls back independently. A field you leave unset takes the matching content from `object_story_spec`. For example, if you set `buttons` but omit `asset_customization.body`, the marketing message shows your buttons and reuses `object_story_spec.message` for its body text.

### Example

 Create an ad creative whose marketing message overrides the feed ad's body text, adds a quick-reply button, and includes an auto-reply:

```
curl -X POST \
  -F 'name=My marketing message creative' \
  -F 'object_story_spec={
       "page_id": "<PAGE_ID>",
       "link_data": {
         "link": "<URL>",
         "message": "Body text for the feed ad"
       }
     }' \
  -F 'marketing_message_structured_spec={
       "language": "en_US",
       "asset_customization": {
         "body": "Body text for the marketing message"
       },
       "buttons": [
         {
           "type": "QUICK_REPLY",
           "text": "Tell me more",
           "quick_reply_payload": "MORE_INFO"
         }
       ],
       "autoreply": {
         "text": "Thanks for your interest. Here is more information.",
         "is_optimized_auto_reply": false
       }
     }' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v26.0/act_<AD_ACCOUNT_ID>/adcreatives

```

## Reading

The API returns this node as part of the ad creative, not as a standalone endpoint, so read it through the ad creative’s `marketing_message_structured_spec` field.

The fields below are the ones you set to customize a marketing message. The node returns a few additional fields that are not documented here.

#### Parameters

 This endpoint doesn't have any parameters.

#### Fields

| Field | Description |
| --- | --- |
| `language`<br>*string* | The language and locale code for the marketing message, for example `en_US`. |
| `asset_customization`<br>*object* | Content shown only in the marketing message. See [Asset customization](#asset-customization). |
| `autoreply`<br>*object* | The automated message sent when someone replies to the marketing message. See [Autoreply](#autoreply). |
| `buttons`<br>*array* | The quick-reply buttons shown with the marketing message. See [Buttons](#buttons). |
| `offer`<br>*object* | The discount offer shown on the marketing message. See [Offer](#offer). |

## Creating

Set `marketing_message_structured_spec` when you create an ad creative through [`POST /act_<AD_ACCOUNT_ID>/adcreatives`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/adcreatives). The whole spec is optional. Omit it to build the marketing message from `object_story_spec`, or include only the fields you want to customize.

#### Parameters

| Parameter | Description |
| --- | --- |
| `language`<br>*string* | The language and locale code for the marketing message, for example `en_US`. Defaults to `en_US`. See [Supported languages](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/supported-languages) for the full list. |
| `asset_customization`<br>*JSON object* | Content shown only in the marketing message, replacing the matching content in `object_story_spec` for this placement. See [Asset customization](#asset-customization). |
| `autoreply`<br>*JSON object* | An automated message sent when someone replies to your marketing message. The auto-reply can be plain text, or it can include an image or a video, plus up to one URL button. See [Autoreply](#autoreply). |
| `buttons`<br>*array<JSON object>* | Quick-reply buttons shown with your marketing message. Only the `QUICK_REPLY` button type is supported, and only on single-card creatives. If the ad creative has more than one card, the buttons are omitted from the marketing message. See [Buttons](#buttons). |
| `offer`<br>*JSON object* | A discount offer to show on the marketing message. See [Offer](#offer). |
| `conversation_template_id`<br>*string* | The ID of a conversation template, a reusable auto-reply and quick-reply configuration stored on your ad account. Use it instead of setting `autoreply` and `buttons` inline. |

## Updating

 You can't perform this operation on this endpoint.

## Deleting

 You can't perform this operation on this endpoint.

## Child fields

### Asset customization

| Field | Description |
| --- | --- |
| `body`<br>*string* | Body text shown only in the marketing message, replacing `object_story_spec.message` for this placement. If you omit it, the marketing message reuses `object_story_spec.message`. |

### Autoreply

| Field | Description |
| --- | --- |
| `text`<br>*string* | The text of the auto-reply message. |
| `image_hash`<br>*string* | The hash of a previously uploaded image to include in the auto-reply. |
| `video_id`<br>*numeric string* | The ID of a previously uploaded video to include in the auto-reply. |
| `video_thumbnail_url`<br>*string* | The URL of the thumbnail image for the auto-reply video. |
| `buttons`<br>*array* | Up to one URL button to show in the auto-reply. |
| `is_optimized_auto_reply`<br>*boolean* | Set to `true` to let Meta optimize the auto-reply. |

### Buttons

 Buttons are only available for single-card creatives. If the ad creative has more than one card, the buttons are omitted from the marketing message.

| Field | Description |
| --- | --- |
| `type`<br>*enum {QUICK_REPLY}* | **Required.** The button type. Must be `QUICK_REPLY`. |
| `text`<br>*string* | **Required.** The button label shown to the WhatsApp user. |
| `quick_reply_payload`<br>*string* | A custom payload returned to you when the WhatsApp user taps the button. Use it to trigger your automated workflows. |

### Offer

| Field | Description |
| --- | --- |
| `text`<br>*string* | **Required.** The offer text shown to the WhatsApp user. |
| `is_offer_code_personalized`<br>*boolean* | **Required.** Whether the offer code is personalized for each recipient. |
| `expiration_time`<br>*int* | The Unix timestamp for when the offer expires. Valid only when the offer includes an offer code. |
