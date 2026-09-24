<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway/custom-data-destination | Saved: 2026-09-19 -->

# Publish Events to a Custom Data Destination



You can set up and send data from your data pipeline to a custom data destination, such as your own API. When you are setting up a custom destination, there are options you can update the event templates so that it matches the data format the endpoint is expecting.

Once setup is complete, your data pipeline will be able to send outbound events to this custom destination. Below is the list of parameters which are sent to the custom data destination.

**Note**: Custom data destinations that don't respond within 5 seconds will timeout and may not receive data.

| Parameter | Description |
| --- | --- |
| `event_name` | A standard event or custom event name. |
| `event_time` | A Unix timestamp in seconds indicating when the actual event occurred. |
| `user_data` | A map that contains customer information data. |
| `custom_data` | A map that includes additional business data about the event. |
| `event_source_url` | The browser URL where the event happened. The URL must begin with `http://` or `https://` and should match the verified domain. |
| `event_id` | This ID can be any unique string chosen by the business. |
| `action_source` | This field allows you to specify where your conversions occurred.<br><br>The values you can send in the `action_source` field are as follows:<br><br>* `email` — Conversion happened over email.<br>* `website` — Conversion was made on your website.<br>* `app` — Conversion was made on your mobile app.<br>* `phone_call` — Conversion was made over the phone.<br>* `chat` — Conversion was made via a messaging app, SMS, or online messaging feature.<br>* `physical_store` — Conversion was made in person at your physical store.<br>* `system_generated` — Conversion happened automatically, for example, a subscription renewal that's set to auto-pay each month.<br>* `business_messaging` — Conversion was made from ads that click to Messenger, Instagram or WhatsApp.<br>* `other` — Conversion happened in a way that is not listed. |
| `data_processing_options`<br><br>array | Processing options you would like to enable for a specific event. |
| `data_processing_options_country`<br><br>integer | **Required**, if you send `LDU` under `data_processing_options`.  <br>A country that you want to associate to this data processing option. Current accepted values are `1`, for the United States of America, or `0`, to request that we geolocate that event. |
| `data_processing_options_state`<br><br>integer | **Required** in some cases. (See note below for details.)  <br>A state that you want to associate to this data processing option. Current accepted values are `1000`, for California, or `0`, to request that we geolocate that event.<br><br>**Note:**<br><br>* If you set a country, you must also set a state. Otherwise, we apply our geolocation logic to the entire event.<br>* This field is required if you send `LDU` under `data_processing_options` and do not provide an IP address. |
| `app_data` | **Required for app events**<br><br>Parameters for sharing app data and device information with the Conversions API.<br><br>**Warning:** `extinfo` is a sub-parameter of `app_data`. |
| `extinfo`<br><br>object | **Required for app events**  <br>Extended device information, such as screen width and height.  This parameter is an array and values are separated by commas. When using extinfo, **all values are required and must be in the order indexed below**. If a value is missing, fill with an empty string as a placeholder.<br><br>Note:<br><br>* `version` must be `a2` for Android<br><br>* `version` must be `i2` for iOS |
| ↳ `0`<br><br>string | **Required**<br><br>extinfo version <br><br>Example: `i2` |
| ↳ `1`<br><br>string | app package name <br><br>Example: `com.facebook.sdk.samples.hellofacebook` |
| ↳ `2`<br><br>string | short version (int or string) <br><br>Example: `1.0` |
| ↳ `3`<br><br>string | long version <br><br>Example: `1.0 long` |
| ↳ `4`<br><br>string | **Required**<br><br>OS version <br><br>Example: `13.4.1` |
| ↳ `5`<br><br>string | device model name <br><br>Example: `iPhone5,1` |
| ↳ `6`<br><br>string | locale <br><br>Example: `En_US` |
| ↳ `7`<br><br>string | timezone abbreviation <br><br>Example: `PDT` |
| ↳ `8`<br><br>string | carrier <br><br>Example: `AT&T` |
| ↳ `9`<br><br>int64 | screen width <br><br>Example: `320` |
| ↳ `10`<br><br>int64 | screen height <br><br>Example: `568` |
| ↳ `11`<br><br>string | screen density <br><br>Example: `2` |
| ↳ `12`<br><br>int64 | CPU cores <br><br>Example: `2` |
| ↳ `13`<br><br>int64 | external storage size in GB <br><br>Example: `13` |
| ↳ `14`<br><br>int64 | free space on external storage in GB <br><br>Example: `8` |
| ↳ `15`<br><br>string | device timezone <br><br>Example: `USA/New York` |
| `referrer_url`<br><br>string | The inbound website that was immediately visited prior to the business page where the Meta Pixel fired. It is an HTTP referrer from JavaScript's perspective. The `referral_url` is either the page the user was on before they visited the current page, or the iFrame. |

