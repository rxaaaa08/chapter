<!-- Source: https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/app-data | Saved: 2026-09-19 -->

# App Data Parameters



Use these parameters to share app data and device information with the Conversions API.

See the [Conversions API for App Events](https://developers.facebook.com/documentation/ads-commerce/conversions-api/app-events) documentation for guidance on integrating app events. 

| Parameter | Description |
| --- | --- |
| `advertiser_tracking_enabled`<br><br>boolean | **Required for app events**<br><br>Use this field to specify ATT permission on an iOS 14.5+ device. Set to `0` for disabled or `1` for enabled. |
| `application_tracking_enabled`<br><br>boolean | **Optional.**<br><br>A person can choose to enable ad tracking on an app level. Your SDK should allow an app developer to put an opt-out setting into their app. Use this field to specify the person's choice. Use `0` for disabled, `1` for enabled. |
| `extinfo`<br><br>object<br><br>**Note:** Please use the down arrow to the right to see the list of `extinfo` values. | **Required for app events**<br><br>Extended device information, such as screen width and height.  This parameter is an array and values are separated by commas. When using `extinfo`, **all values are required and must be in the order indexed below**. If a value is missing, fill with an empty string as a placeholder.<br><br>Note: <br><br>* `version` must be `a2` for Android<br><br>* `version` must be `i2` for iOS |
| ↳ `0`<br><br>string | **Required**<br><br>extinfo version <br><br>Example: `i2` |
| ↳ `1`<br><br>string | app package name <br><br>Example: `com.facebook.sdk.samples.hellofacebook` |
| ↳ `2`<br><br>string | short version (int or string) <br><br>Example: `1.0` |
| ↳ `3`<br><br>string | long version <br><br>Example: `1.0 long` |
| ↳ `4`<br><br>string | **Required**<br><br>OS version <br><br>Example: `13.4.1` |
| ↳ `5`<br><br>string | device model name <br><br>Example: `iPhone5,1` |
| ↳ `6`<br><br>string | locale <br><br>Example: `En_US` |
| ↳ `7`<br><br>string | timezone abbreviation <br><br>Example: `PDT` |
| ↳ `8`<br><br>string | carrier <br><br>Example: `AT&T` |
| ↳ `9`<br><br>string | screen width <br><br>Example: `320` |
| ↳ `10`<br><br>string | screen height <br><br>Example: `568` |
| ↳ `11`<br><br>string | screen density <br><br>Example: `2` |
| ↳ `12`<br><br>string | CPU cores <br><br>Example: `2` |
| ↳ `13`<br><br>string | external storage size in GB <br><br>Example: `13` |
| ↳ `14`<br><br>string | free space on external storage in GB <br><br>Example: `8` |
| ↳ `15`<br><br>string | device timezone <br><br>Example: `USA/New York` |
| `campaign_ids`<br><br>string | **Optional**<br><br>An encrypted string and non-user metadata appended to the outbound URL (for example, ad_destination_url) or deep link (for App Aggregated Event Measurement) when a user clicked on a link from Facebook.<br><br>Graph API definition: Parameter passed via the deep link for Mobile App Engagement campaigns. |
| `install_referrer`<br><br>string | **Optional**  <br>Third party install referrer, currently available for Android only, see [here for more](https://developers.google.com/analytics/devguides/collection/android/v4/campaigns). |
| `installer_package`<br><br>string | **Optional**<br><br>Used internally by the Android SDKs |
| `url_schemes`<br><br>array | **Optional**<br><br>Used internally by the iOS and Android SDKs. |
| `vendor_id`<br><br>string | **Optional**<br><br>Vendor ID. |
| `windows_attribution_id`<br><br>string | **Optional**<br><br>Attribution token used for Windows 10. |

