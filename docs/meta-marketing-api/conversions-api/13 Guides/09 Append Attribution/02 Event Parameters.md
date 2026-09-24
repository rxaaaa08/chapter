<!-- Source: https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/append-attribution/reference | Saved: 2026-09-19 -->

# AppendAttribution event parameters


**Warning:** This API is in Beta with limited access. If you do not have access, contact your Meta representative.

This page documents the event parameters for the `AppendAttribution` Conversions API event. For end-to-end setup instructions, prerequisites, and best practices, see the [AppendAttribution integration guide](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/append-attribution).

You can use the [Conversions API Payload Helper](https://developers.facebook.com/documentation/ads-commerce/conversions-api/payload-helper) to test that you are sending events correctly to Meta following this specification.

**Note**: AppendAttribution events must be received less than 48 hours from the original event, such as `Purchase`.

## Event parameters (web events)

| Top-Level Parameter | Nested Parameter | Description |
| --- | --- | --- |
| `event_name`<br><br>string |  | **Required.**<br>A unique name indicating that this is a post-attribution event.<br><br>Expected value: `AppendAttribution`<br><br>**Note**: This name is standardized. Do not change it. |
| `event_time`<br><br>integer |  | **Required.**<br>The time in seconds when the passback event was generated, as per the advertiser's in-house attribution model/pipeline. This timestamp may be earlier than when the AppendAttribution event is sent to Meta.<br><br>Example expected value: `1736900999` |
| `action_source`<br><br>string |  | **Required.**<br>This field allows you to specify where your conversions occurred. Knowing where your events took place helps ensure your ads go to the right people. By using the Conversions API, you agree that the `action_source` parameter is accurate to the best of your knowledge.<br><br>The values you can send in the `action_source` field are as follows:<br><br>* `email` — Conversion happened over email.<br>* `website` — Conversion was made on your website.<br>* `app` — Conversion was made on your mobile app.<br>* `phone_call` — Conversion was made over the phone.<br>* `chat` — Conversion was made via a messaging app, SMS, or online messaging feature.<br>* `physical_store` — Conversion was made in person at your physical store.<br>* `system_generated` — Conversion happened automatically, for example, a subscription renewal that's set to auto-pay each month.<br>* `business_messaging` — Conversion was made from ads that click to Messenger, Instagram, or WhatsApp.<br>* `other` — Conversion happened in a way that is not listed.<br><br>**Note**: All action source values enable ad measurement and custom audience creation capabilities. All action sources except `physical_store` enable ad optimization capabilities. |
| `event_source_url`<br><br>string |  | **Required.**<br>The browser URL where the event happened. The URL should match the verified domain.<br><br>**Note:** The `event_source_url` is required for website events shared using the Conversions API. |
| `event_id`<br><br>string |  | **Optional, but Highly Recommended.**<br>Distinguish the post-attribution event for deduplication purposes. This should uniquely identify the post-attribution event, not the original Purchase/Install event.<br><br>Example: `607c1d9b-2ed1-4911-a360-948090cb0dd5` |
| `attribution_data`<br><br>string | `ad_id`<br><br>---<br>`touchpoint_ts`<br><br>---<br>`attribution_share`<br><br>---<br>`attribution_value` | **Required.**<br>The ID from the ad click context received from Meta.<br><br>Example: `6283824241739`<br><br>---<br>**Required.**<br>The time the ad was clicked (seconds).<br><br>Example: `1714849203`<br><br>---<br>**Required.**<br>The credit that the advertiser is applying to the click for the conversion, between 0 and 1.<br><br>0 if no credit. Value between 0 and 1, for example, 0.3 if fractional credit, and 1 if full credit.<br><br>---<br>**Required.**<br>ROAS value attributed to Meta.<br><br>It's calculated as: `attribution_share`*value<br><br>Example: `101.99` |
| `custom_data` | `currency` | **Required.**<br>The currency for the `value` specified, if applicable. Currency must be a valid [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217?fbclid=IwAR2qARpy3ufnmcEY-sVHvTzUA1AsFOsLYdNsrZP6UYAMRt6NVM5SAhfzfJg) three-digit currency code.<br><br>Example: `USD` |
| `original_event_data`<br><br>object | `event_name`<br><br>string<br><br>---<br><br>`event_time`<br><br>integer<br><br>---<br><br>`order_id`<br><br>string | **Required.**<br>A [standard event](https://developers.facebook.com/docs/facebook-pixel/implementation/conversion-tracking#standard-events) or [custom event](https://developers.facebook.com/docs/facebook-pixel/implementation/conversion-tracking#custom-events) name. This field is used to deduplicate events sent by both web (via Meta Pixel) or app (via SDK or App Events API) and the Conversions API. The `event_id` parameter is also used in deduplication.<br><br>For the same customer action, `event` from the browser or app event matches `event_name` from the server event. If we find a match between events sent within 48 hours of each other, we only consider the first one. If a server and browser/app event arrive at approximately the same time (that is, within 5 minutes of each other), we favor the browser/app event. Learn more about [Deduplicate Pixel and Server Events](https://developers.facebook.com/documentation/ads-commerce/conversions-api/deduplicate-pixel-and-server-events).<br><br>Example: `Purchase`<br><br>---<br>**Required.**<br>A Unix timestamp in seconds indicating when the actual event occurred. The specified time may be earlier than the time you send the event to Facebook. This is to enable batch processing and server performance optimization. You must send this date in GMT time zone.<br><br>The `event_time` can be up to 7 days before you send an event to Facebook. If any `event_time` in `data` is greater than 7 days in the past, we return an error for the entire request and process no events.<br><br>Example:  `1717503323`<br><br>**Note**: This should occur after the attributed click time, that is, `attribution_data.touchpoint_ts`<br><br>---<br>**Optional.**<br><br>The order ID for the transaction, as a string.<br><br>Example: `"ORD-2024-0001234"` |
| `user_data`<br><br>object | `fbc`<br><br>string<br><br>---<br><br>`client_user_agent`<br><br>string<br><br>---<br><br>`em`<br><br>string or list<string><br><br>---<br><br>`ph`<br><br>string or list<string><br><br>---<br><br>`client_ip_address`<br><br>string<br><br>---<br><br>`external_id`<br><br>string or list<string> | **Required  if available.**<br>**Note:** **Note**: Do not hash.<br><br>The Facebook click ID value is stored in the `_fbc` browser cookie under your domain. See [Managing `fbc` and `fbp` Parameters](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/fbp-and-fbc) for how to get this value or generate this value from a `fbclid` query parameter.<br><br>The format is: fb.${subdomain_index}.${creation_time}.${fbclid}<br><br>Example:<br>`fb.1.1554763741205.AbCdEfGhIjKlMnOpQrStUvWxYz1234567890`<br><br>---<br><br>**Required.**<br>The browser user agent for the conversion event.<br><br>Example: `Mozilla/5.0 (Windows NT 10.0; Win64; x64)`<br><br>**Note:** **Note**: Do not hash.<br><br>---<br>**Optional.**<br>Trim any leading and trailing spaces. Convert all characters to lowercase.<br><br>**Example:**<br><br>*Input:* John_Smith@gmail.com<br>*Normalized format:* john_smith@gmail.com<br>*Expected SHA256 output:* 62a14e44f765419d10fea99367361a727c12365e2520f32218d505ed9aa0f62f<br><br>**Note:** **Note**: Hashing required.<br><br>---<br>**Optional.**<br>Remove symbols, letters, and any leading zeros. Phone numbers must include a country code to be used for matching (for example, the number 1 must precede a phone number in the United States). Always include the country code as part of your customers' phone numbers, even if all of your data is from the same country.<br><br>Example:<br><br>Input: US phone number (650)555-1212<br>Normalized format: 16505551212<br>Expected SHA256 output:<br><br>e323ec626319ca94ee8bff2e4c87cf613be6ea19919ed1364124e16807ab3176<br><br>**Note:** **Note**: Hashing required.<br><br>---<br>**No, but recommended.**<br>**Note:** **Note**: Do not hash.<br><br>The IP address of the browser corresponding to the event must be a valid IPV4 or IPV6 address. IPV6 is preferable over IPV4 for IPV6-enabled users. The `client_ip_address` user data parameter must never be hashed.<br>No spaces should be included. Always provide the real IP address to ensure accurate event reporting.<br><br>**Note:** This information is automatically added to events sent through the browser, but it must be manually configured for events sent through the server.<br><br>Example:<br>*IPV4:* 168.212.226.204<br>*IPV6:* 2001:0db8:85a3:0000:0000:8a2e:0370:7334<br><br>---<br>**Optional, but recommended if available.**<br>**Note:** **Note**: Hashing recommended.<br><br>Any unique ID from the advertiser, such as loyalty membership IDs, user IDs, and external cookie IDs. You can send one or more external IDs for a given event.<br><br>If an external ID is being sent using other channels, it should be in the same format as when sent using the [Conversions API](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/external-id).<br><br>Example: 114351fd7c547295ed4c7cf61c79e3e1e648930ccbda923e394a7914864682db114351fd7c547295ed4c7cf61c79e3e1e648930ccbda923e394a7914864682db |

### AppendAttribution web event example

```
{
  "event_name": "AppendAttribution",
  "event_time": 1633552688,
  "event_id": "event.id.123",
  "action_source": "website",
  "event_source_url": "http://jaspers-market.com/product/123",
  "attribution_data": {
    "ad_id": 12345,
    "touchpoint_ts": 1714849203,
    "attribution_share": 0.3,
    "attribution_value": 100.2
  },
  "original_event_data": {
    "event_name": "Purchase",
    "event_time": 1717503323,
    "order_id": "ORD-2024-0001234"
  },
  "custom_data": {
    "currency": "USD"
  },
  "user_data": {
    "client_user_agent": "Mozilla/5.0 (Linux; Android 10; SM-J600FN Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/123.0.6312.77 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/457.0.0.54.84;]",
    "fbc": "fb.1.1554763741205.AbCdEfGhIjKlMnOpQrStUvWxYz1234567890",
    "client_ip_address": "168.212.226.204",
    "em": "62a14e44f765419d10fea99367361a727c12365e2520f32218d505ed9aa0f62f",
    "ph": "e323ec626319ca94ee8bff2e4c87cf613be6ea19919ed1364124e16807ab3176",
    "external_id": "114351fd7c547295ed4c7cf61c79e3e1e648930ccbda923e394a7914864682db114351fd7c547295ed4c7cf61c79e3e1e648930ccbda923e394a7914864682db"
  }
}
```

## Event parameters (app events)

**Warning:** **Important**: To prevent API errors, ensure the Pixel is correctly associated with an app before sending app events.

| Top-Level Parameter | Nested Parameter | Description |
| --- | --- | --- |
| `event_name`<br><br>string |  | **Required.**<br>A unique name indicating that this is a passback event.<br><br>Expected value: `AppendAttribution`<br><br>**Note**: This name is standardized. Do not change it. |
| `event_time`<br><br>integer |  | **Required.**<br>The time in seconds that the passback event was generated (not the Purchase/Install time).<br><br>Example expected value: `1736900999` |
| `action_source`<br><br>string |  | **Required.**<br>This field allows you to specify where your conversions occurred. Knowing where your events took place helps ensure your ads go to the right people. By using the Conversions API, you agree that the `action_source` parameter is accurate to the best of your knowledge.<br><br>The values you can send in the `action_source` field are as follows:<br><br>* `email` — Conversion happened over email.<br>* `website` — Conversion was made on your website.<br>* `app` — Conversion was made on your mobile app.<br>* `phone_call` — Conversion was made over the phone.<br>* `chat` — Conversion was made via a messaging app, SMS, or online messaging feature.<br>* `physical_store` — Conversion was made in person at your physical store.<br>* `system_generated` — Conversion happened automatically, for example, a subscription renewal that's set to auto-pay each month.<br>* `business_messaging` — Conversion was made from ads that click to Messenger, Instagram, or WhatsApp.<br>* `other` — Conversion happened in a way that is not listed.<br><br>**Note**: All action source values enable ad measurement and custom audience creation capabilities. All action sources except `physical_store` enable ad optimization capabilities. |
| `event_id`<br><br>string |  | **Optional, but Highly Recommended.**<br>Uniquely identify the passback event, to support deduplication. This should uniquely identify the passback event, not the Purchase/Install event.<br><br>Example: `607c1d9b-2ed1-4911-a360-948090cb0dd5` |
| `attribution_data` | `ad_id`<br><br>---<br>`touchpoint_ts`<br><br>---<br><br>`attribution_share`<br><br>---<br>`attribution_value` | **Required.**<br>The ID provided in the ad click context received from Meta.<br><br>Example: `6283824241739`<br><br>---<br>**Required.**<br>The time the ad was clicked (seconds).<br><br>Example: `1714849203`<br><br>---<br>**Required.**<br>The credit that the advertiser is applying to the click for the conversion, between 0 and 1.<br><br>0 if no credit.<br>Value between 0 and 1, for example, 0.3 if fractional credit, and 1 if full credit<br><br>---<br>**Required.**<br>ROAS value attributed to Meta.<br><br>It's calculated as: `attribution_share`*value<br><br>Example: `101.99` |
| `custom_data`<br><br>string | `currency` | **Required.**<br>The currency for the `value` specified, if applicable. Currency must be a valid [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217?fbclid=IwAR2qARpy3ufnmcEY-sVHvTzUA1AsFOsLYdNsrZP6UYAMRt6NVM5SAhfzfJg) three-digit currency code.<br><br>Example: `USD` |
| `original_event_data`<br><br>string | `event_name`<br><br>string<br><br>---<br><br>`event_time`<br><br>integer<br><br>---<br><br>`order_id`<br><br>string | **Required.**<br>A [standard event](https://developers.facebook.com/docs/facebook-pixel/implementation/conversion-tracking#standard-events) or [custom event](https://developers.facebook.com/docs/facebook-pixel/implementation/conversion-tracking#custom-events) name. This field is used to deduplicate events sent by both web (via Meta Pixel) or app (via SDK or App Events API) and the Conversions API. The `event_id` parameter is also used in deduplication.<br><br>For the same customer action, `event` from the browser or app event matches `event_name` from the server event. If we find a match between events sent within 48 hours of each other, we only consider the first one. If a server and browser/app event arrive at approximately the same time (that is, within 5 minutes of each other), we favor the browser/app event. Learn more about [Deduplicate Pixel and Server Events](https://developers.facebook.com/documentation/ads-commerce/conversions-api/deduplicate-pixel-and-server-events).<br><br>Example: `Purchase`, `fb_mobile_purchase`, `MOBILE_APP_INSTALL`<br><br>---<br>**Required.**<br>A Unix timestamp in seconds indicating when the actual event occurred. The specified time may be earlier than the time you send the event to Facebook. This is to enable batch processing and server performance optimization. You must send this date in GMT time zone.<br><br>The `event_time` can be up to 7 days before you send an event to Facebook. If any `event_time` in `data` is greater than 7 days in the past, we return an error for the entire request and process no events.<br><br>Example:  `1717503323`<br><br>**Note**: This should occur after the attributed click time, that is, `attribution_data.touchpoint_ts`<br><br>---<br>**Optional.**<br>The order ID for the transaction, as a string.<br><br>Example: `"ORD-2024-0001234"` |
| `app_data` | `advertiser_tracking_enabled`<br><br>boolean<br><br>---<br><br>`application_tracking_enabled`<br><br>boolean<br><br>---<br><br>`extinfo`<br><br>object<br><br>---<br><br>`campaign_ids`<br><br>string | **Required.**<br>Use this field to specify ATT permission on an iOS 14.5+ device. Set to `0` for disabled or `1` for enabled.<br><br>Expected value: `0` or `1`<br><br>---<br>**Required.**<br>A person can choose to enable ad tracking on an app level. Your SDK should allow an app developer to put an opt-out setting into their app. Use this field to specify the person's choice. Use `0` for disabled, `1` for enabled.<br><br>Expected value: `0` or `1`<br><br>---<br>**Required.**<br>Extended device information, such as screen width and height.  This parameter is an array and values are separated by commas. When using `extinfo`, **all values are required and must be in the order indexed below**. If a value is missing, fill with an empty string as a placeholder.<br><br>Please see the [App Data Parameters documentation](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/app-data#extinfo) for the detailed format of the `extinfo` parameter.<br><br>Example:<br><br>```
[
                    "a2",
                    "com.some.app",
                    "771",
                    "Version 7.7.1",
                    "10.1.1",
                    "OnePlus6",
                    "en_US",
                    "GMT-1",
                    "TMobile",
                    "1920",
                    "1080",
                    "2.00",
                    "2",
                    "128",
                    "8",
                    "USA/New York"
]
```<br><br>---<br>**Android: Required if available. iOS: Required**<br><br>An encrypted string and non-user metadata appended to the outbound URL (for example, `ad_destination_url`) or deep link (for App Aggregated Event Manager) when a user clicked on a link from Facebook.<br><br>Graph API definition: Parameter passed via the deep link for Mobile App Engagement campaigns.<br><br>Example: `AUBTPkAuPZYrefWv3HxQlsVj22m-0Um2S0SSz5YGtsS1kfL69tCYV3ZW6AcnDbOTfosAGdlS75pIjJwvZuQcG6U_agg_{\"credential\":\"NjZkOTNiNzg1OGMxMTM1YTFlNzJmNzJkMWY3ZTg3NThjYmEzMmVkZmJjOTBhMTBkMWM3MzMwZjE5NDU2YTVjNA\",\"shared_secret\":\"lhi2YQputCEV9wXQ2VzB-2Nq2lbDwn20VSrAOqOfmSkJPFPwLL8OI0XvdSuTfehygVorj_RQBRKr8pMnix_HKw\",\"key_version\":97}` |
| `user_data`<br><br>object | `fbc`<br><br>string<br><br>---<br><br>`em`<br><br>string or list<string><br><br>---<br><br>`ph`<br><br>string or list<string><br><br>---<br><br>`client_ip_address`<br><br>string<br><br>---<br><br>`external_id`<br><br>string or list<string><br><br>---<br><br>`madid`<br><br>string | **Required  if available.**<br>**Note:** **Note**: Do not hash.<br><br>The Facebook click ID value is stored in the `_fbc` browser cookie under your domain. See [Managing `fbc` and `fbp` Parameters](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/fbp-and-fbc) for how to get this value or generate this value from a `fbclid` query parameter.<br><br>The format is: fb.${subdomain_index}.${creation_time}.${fbclid}<br><br>Example:<br>`fb.1.1554763741205.AbCdEfGhIjKlMnOpQrStUvWxYz1234567890`<br><br>---<br>**No, but recommended if madid/campaign_ids not available.**<br>Hashed email address.<br><br>Trim any leading and trailing spaces. Convert all characters to lowercase.<br><br>Example:<br><br>*Input:* John_Smith@gmail.com<br>*Normalized format:* john_smith@gmail.com<br>*Expected SHA256 output:* 62a14e44f765419d10fea99367361a727c12365e2520f32218d505ed9aa0f62f<br><br>---<br>**No, but recommended if madid/campaign_ids not available.**<br>Hashed phone number.<br><br>Remove symbols, letters, and any leading zeros. Phone numbers must include a country code to be used for matching (for example, the number 1 must precede a phone number in the United States).  Always include the country code as part of your customers' phone numbers, even if all of your data is from the same country.<br><br>Example:<br><br>*Input:* US phone number (650)555-1212<br>*Normalized format:* 16505551212<br>*Expected SHA256 output:*<br>e323ec626319ca94ee8bff2e4c87cf613be6ea19919ed1364124e16807ab3176<br><br>---<br>**No, but recommended.**<br>**Note:** **Note**: Do not hash.<br><br>The IP address of the browser corresponding to the event must be a valid IPV4 or IPV6 address. IPV6 is preferable over IPV4 for IPV6-enabled users. The `client_ip_address` user data parameter must never be hashed.<br>No spaces should be included. Always provide the real IP address to ensure accurate event reporting.<br><br>**Note:** This information is automatically added to events sent through the browser, but it must be manually configured for events sent through the server.<br><br>Example:<br>*IPV4:* 168.212.226.204<br>*IPV6:* 2001:0db8:85a3:0000:0000:8a2e:0370:7334<br><br>---<br>**Optional, but recommended if available.**<br>**Note:** **Note**: Hashing recommended.<br><br>Any unique ID from the advertiser, such as loyalty membership IDs, user IDs, and external cookie IDs. You can send one or more external IDs for a given event.<br><br>If an external ID is being sent via other channels, it should be in the same format as when sent via the [Conversions API](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/external-id).<br><br>Example: 114351fd7c547295ed4c7cf61c79e3e1e648930ccbda923e394a7914864682db114351fd7c547295ed4c7cf61c79e3e1e648930ccbda923e394a7914864682db<br><br>---<br>**Android: Required. iOS: Required if available.**<br>Your mobile advertiser ID, the advertising ID from an Android device or the Advertising Identifier (IDFA) from an Apple device.<br><br>**Example:**<br>AECE52E7-03EE-455A-B3C4-E57283966239 |

### AppendAttribution app event example

```
{
"event_name": "AppendAttribution",
"event_time": 1633552688,
"event_id": "event.id.123",
"action_source": "app",
"attribution_data": {
   "ad_id": 12345,
   "touchpoint_ts": 1714849203,
   "attribution_share": 0.3,
   "attribution_value": 100.2
},
"original_event_data": {
   "event_name": "fb_mobile_purchase",
   "event_time": 1717503323,
   "order_id": "ORD-2024-0001234"
},
"custom_data": {
   "currency": "USD"
},
"app_data": {
   "advertiser_tracking_enabled": 1,
   "application_tracking_enabled": 1,
   "extinfo": [
      "a2",
      "com.some.app",
      "771",
      "Version 7.7.1",
      "10.1.1",
      "OnePlus6",
      "en_US",
      "GMT-1",
      "TMobile",
      "1920",
      "1080",
      "2.00",
      "2",
      "128",
      "8",
      "USA/New York"
   ],
     "campaign_ids": "AUBTPkAuPZYrefWv3HxQlsVj22m-0Um2S0SSz5YGtsS1kfL69tCYV3ZW6AcnDbOTfosAGdlS75pIjJwvZuQcG6U_agg_{\"credential\":\"NjZkOTNiNzg1OGMxMTM1YTFlNzJmNzJkMWY3ZTg3NThjYmEzMmVkZmJjOTBhMTBkMWM3MzMwZjE5NDU2YTVjNA\",\"shared_secret\":\"lhi2YQputCEV9wXQ2VzB-2Nq2lbDwn20VSrAOqOfmSkJPFPwLL8OI0XvdSuTfehygVorj_RQBRKr8pMnix_HKw\",\"key_version\":97}"
},
"user_data": {
   "fbc": "fb.1.1554763741205.AbCdEfGhIjKlMnOpQrStUvWxYz1234567890",
   "madid": "AECE52E7-03EE-455A-B3C4-E57283966239",
   "client_ip_address": "168.212.226.204",
   "em": "62a14e44f765419d10fea99367361a727c12365e2520f32218d505ed9aa0f62f",
   "ph": "e323ec626319ca94ee8bff2e4c87cf613be6ea19919ed1364124e16807ab3176",
   "external_id": "114351fd7c547295ed4c7cf61c79e3e1e648930ccbda923e394a7914864682db114351fd7c547295ed4c7cf61c79e3e1e648930ccbda923e394a7914864682db"
  }
}
```

## See also

* [AppendAttribution integration guide](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/append-attribution)
* [Conversions API Payload Helper](https://developers.facebook.com/documentation/ads-commerce/conversions-api/payload-helper)
* [Conversions API Server Event Parameters](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/server-event)
* [Conversions API Customer Information Parameters](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/customer-information-parameters)
* [Conversions API App Data Parameters](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/app-data)
