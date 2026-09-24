<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/overview/data-processing-options | Saved: 2026-09-19 -->

# Data Processing Options for US Users



Limited Data Use is a data processing option that gives you more control over how your data is used in Meta's systems and better supports your compliance efforts with various US state privacy regulations.
To utilize this feature, you must proactively enable Limited Data Use. When Meta receives data with Limited Data Use enabled from people in the states where Limited Data Use applies, we will process that data in accordance with our role as a service provider or processor, as applicable, and limit the use of that data as specified in our [State-Specific Terms](https://www.facebook.com/legal/terms/state-specific).

## Meta products that offer the Limited Data Use

The following Meta products offer Limited Data Use. Availability varies by state. See the table below for details:

|  | [Meta Business Tools](https://www.facebook.com/help/331509497253087)<br><br>(Meta Pixel, App Events via Facebook SDK, App Events API, Conversions API, Offline Conversions API) | [Audience Network SDK](https://developers.facebook.com/docs/audience-network) | [Customer List Custom Audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/custom-audiences) |
| --- | --- | --- | --- |
| **California** | ✅ | ✅ | ✅<br><br>*Effective June 1, 2023* |
| **Colorado** | ✅<br><br>*Effective June 1, 2023* | ✅<br><br>*Effective June 1, 2023* | ❌ |
| **Connecticut** | ✅<br><br>*Effective June 1, 2023* | ✅<br><br>*Effective June 1, 2023* | ❌ |
| **Delaware** | ✅<br><br>*Effective December 18, 2024* | ✅<br><br>*Effective December 18, 2024* | ❌ |
| **Florida** | ✅<br><br>*Effective June 24, 2024* | ✅<br><br>*Effective June 24, 2024* | ❌ |
| **Montana** | ✅<br><br>*Effective September 23, 2024* | ✅<br><br>*Effective September 23, 2024* | ❌ |
| **Nebraska** | ✅<br><br>*Effective December 18, 2024* | ✅<br><br>*Effective December 18, 2024* | ❌ |
| **New Hampshire** | ✅<br><br>*Effective December 18, 2024* | ✅<br><br>*Effective December 18, 2024* | ❌ |
| **New Jersey** | ✅<br><br>*Effective December 18, 2024* | ✅<br><br>*Effective December 18, 2024* | ❌ |
| **Oregon** | ✅<br><br>*Effective June 24, 2024* | ✅<br><br>*Effective June 24, 2024* | ❌ |
| **Texas** | ✅<br><br>*Effective June 24, 2024* | ✅<br><br>*Effective June 24, 2024* | ❌ |
| **Minnesota** | ✅<br><br>*Effective June 2, 2025* | ✅<br><br>*Effective June 2, 2025* | ❌ |
| **Maryland** | ✅<br><br>*Effective September 9, 2025* | ✅<br><br>*Effective September 9, 2025* | ❌ |
| **Rhode Island** | ✅<br><br>*Effective November 17, 2025* | ✅<br><br>*Effective November 17, 2025* | ❌ |

Limited Data Use is sent through a parameter called Data Processing Options, and it can optionally be sent alongside a user's country and state. If an advertiser is not sure of the country or state, they can opt for Meta to determine if the event or record is from an applicable state.

### For Business Tools and Audience Network SDK

For [Business Tools](https://www.facebook.com/help/331509497253087) and Audience Network, Limited Data Use is available only for people in California, Colorado, Connecticut, Delaware, Florida, Montana, Nebraska, New Hampshire, New Jersey, Oregon, Texas, Minnesota, Maryland, or Rhode Island. If a business enables Limited Data Use but does not set the location parameters to US and California, Colorado, Connecticut, Delaware, Florida, Montana, Nebraska, New Hampshire, New Jersey, Oregon, Texas, Minnesota, Maryland, or Rhode Island we will determine if the event is from one of those states. If Limited Data Use is enabled for an event in California, Colorado, Connecticut, Delaware, Florida, Montana, Nebraska, New Hampshire, New Jersey, Oregon, Texas, Minnesota, Maryland, or Rhode Island we will process data in accordance with our role as a service provider or processor and limit the use of that data in accordance with our [State-Specific Terms](https://www.facebook.com/legal/terms/state-specific).

Businesses may notice an impact to campaign performance and effectiveness, and retargeting and measurement capabilities will be limited when Limited Data Use is enabled.

### For Customer List Custom Audiences

For Customer List Custom Audiences, Limited Data Use is available only for people in California. If Limited Data Use is enabled for a record in a customer list from California, we will process data in accordance with our role as a service provider and limit the use of that data in accordance with our [State-Specific Terms](https://www.facebook.com/legal/terms/state-specific). If a business enables Limited Data Use but does not set the location parameters to US and California, we will determine if the record is from California.

Businesses may notice an impact to audience size when Limited Data Use is enabled.

Supported APIs are listed below.

Learn more about Data Processing Options:

* [Business Help Center: About Limited Data Use](https://www.facebook.com/business/help/1151133471911882)

## Reference

| Field | Description |
| --- | --- |
| **Data Processing Options**  <br><br>array | Processing options you would like to enable for a specific event or record. Current accepted value is `LDU` for Limited Data Use.<br><br>The name of this field can be presented differently, depending on the API and implementation you are using. For example, this is `dataProcessingOptions` for a Meta Pixel JavaScript call, but `data_processing_options` for a Conversions API call. Please see the example calls below.<br><br>An empty array can be sent to explicitly specify that this event or record shouldn't be processed with the Limited Data Use restrictions. |
| **Data Processing Options Country**<br><br>integer | **Optional for most APIs.** See note below for details.<br><br>A country that you want to associate with this data processing option. Current accepted values are `1` for the United States of America, or `0` to request that Meta perform geolocation. |
| **Data Processing Options State**<br><br>integer | **Optional for most APIs.** See note below for details.<br><br>A state that you want to associate to this data processing option. Current accepted values are `1000` for California, `1001` for Colorado, `1002` for Connecticut, `1003` for Florida, `1004` for Oregon, `1005` for Texas, `1006` for Montana, `1007` for Delaware, `1008` for Nebraska, `1009` for New Hampshire, `1010` for New Jersey, `1011` for Minnesota, `1012` for Maryland, `1013` for Rhode Island or `0` to request that we perform geolocation.<br><br>**Note:**<br><br>* If you set a country, you must also set a state. Otherwise, we will perform geolocation. |

## Supported Tools and APIs

### [Meta Pixel](https://developers.facebook.com/docs/facebook-pixel)

| Implementation | Adding Data Processing Options |
| --- | --- |
| Browser Pixel | Update Pixel initialization code to specify the `dataProcessingOptions` method before you call `fbq('init')`.<br><br>To explicitly not enable Limited Data Use (LDU):<br><br>```
fbq('dataProcessingOptions', []);
fbq('init', '{pixel_id}');
fbq('track', 'PageView');
```<br><br>To enable LDU and have Meta perform geolocation:<br><br>```
fbq('dataProcessingOptions', ['LDU'], 0, 0);
```<br><br>To enable LDU and specify the location, e.g., for California:<br><br>```
fbq('dataProcessingOptions', ['LDU'], 1, 1000);
``` |
| Image tag | Add the following to the Pixel image tag:<br><br>* `dpo`: data processing options<br>* `dpoco`: data processing options country<br>* `dpost`: data processing options state<br><br>See [Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/overview/data-processing-options#reference) for accepted values.<br><br>To explicitly not enable LDU, pass an empty value for the `dpo` parameter:<br><br>```
<img src="https://www.facebook.com/tr?id={pixel_id}&ev=Purchase&dpo=" />
```<br><br>To enable LDU and have Meta perform geolocation:  <br><br>```
<img src="https://www.facebook.com/tr?id={pixel_id}&ev=Purchase&vdpo=LDU&dpoco=0&dpost=0" />
```<br><br>To enable LDU and manually specify the location, e.g., for California:<br><br>```
<img src="https://www.facebook.com/tr?id={pixel_id}&ev=Purchase&dpo=LDU&dpoco=1&dpost=1000" />
``` |

### [Conversions API](https://developers.facebook.com/documentation/ads-commerce/conversions-api) and [Offline Conversions API](https://developers.facebook.com/documentation/ads-commerce/conversions-api/offline-events)

For these two APIs, implement data processing options by adding `data_processing_options`, `data_processing_options_country`, and `data_processing_options_state` inside each event within the [data parameter](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/main-body#data) of your events.

**Note:** The App Events and Offline Conversions APIs are no longer recommended for new integrations. Instead, it is recommended that you use the Conversions API as it now supports web, app, and offline events. See [Conversions API for App Events](https://developers.facebook.com/documentation/ads-commerce/conversions-api/app-events) and [Conversions API for Offline Events](https://developers.facebook.com/documentation/ads-commerce/conversions-api/offline-events) for more information.

To explicitly not enable Limited Data Use (LDU), specify an empty array for each event or simply remove the field in the payload:

```
{
    "data": [
        {
            "event_name": "Purchase",
            "event_time": <EVENT_TIME>,
            "user_data": {
                "em": "<EMAIL>"
            },
            "custom_data": {
                "currency": "<CURRENCY>",
                "value": "<VALUE>"
            },
            "data_processing_options": []
        }
    ]
}
```

To enable LDU and have Meta perform geolocation:

```
{
    "data": [
        {
            "event_name": "Purchase",
            "event_time": <EVENT_TIME>,
            "user_data": {
                "em": "<EMAIL>",
                "client_ip_address": "256.256.256.256"
            },
            "custom_data": {
                "currency": "<CURRENCY>",
                "value": "<VALUE>"
            },
            "data_processing_options": ["LDU"],
            "data_processing_options_country": 0,
            "data_processing_options_state": 0
        }
    ]
}
```

To enable LDU and manually specify the location, e.g., for California:

```
{
    "data": [
        {
            "event_name": "Purchase",
            "event_time": <EVENT_TIME>,
            "user_data": {
                "em": "<EMAIL>"
            },
            "custom_data": {
                "currency": "<CURRENCY>",
                "value": "<VALUE>"
            },
            "data_processing_options": ["LDU"],
            "data_processing_options_country": 1,
            "data_processing_options_state": 1000
        }
    ]
}
```

#### Manual Upload UI

The Offline Conversions API offers the option to manually upload your events from a `.csv` file. In this case, add Data Processing Options, Data Processing Country, and Data Processing State as columns inside your file. More information about this can be found in the upload user interface.


### [App Events API](https://developers.facebook.com/docs/app-events)

### Graph API

To implement Data Processing Options using the Graph API, add `data_processing_options`, `data_processing_options_country`, and `data_processing_options_state` to your API call.

To explicitly not enable LDU, send an empty `data_processing_options` array:

```
{
  "event": "CUSTOM_APP_EVENTS",
  "application_tracking_enabled": "1",
  "advertiser_tracking_enabled": "1",
  "custom_events": ["fb_mobile_purchase"],
  "data_processing_options": []
}
```

To enable LDU and have Meta perform geolocation, you can send an event with the following code:

```
{
  "event": "CUSTOM_APP_EVENTS",
  "application_tracking_enabled": "1",
  "advertiser_tracking_enabled": "1",
  "custom_events": ["fb_mobile_purchase"],
  "data_processing_options": ["LDU"],
  "data_processing_options_country": 0,
  "data_processing_options_state": 0
}
```

To enable LDU and manually specify the location, e.g., for California, you can send an event with the following code:

```
  {
  "event": "CUSTOM_APP_EVENTS",
  "application_tracking_enabled": "1",
  "advertiser_tracking_enabled": "1",
  "custom_events": ["fb_mobile_purchase"],
  "data_processing_options": ["LDU"],
  "data_processing_options_country": 1,
  "data_processing_options_state": 1000
}
```

### Mobile SDKs

We recommend using our latest versions to ensure the functionality of Data Processing Options. The below implementation instructions are accurate for the following SDK versions:

* iOS Facebook SDK v7.1.1 or higher
* Android Facebook SDK v7.1.0 or higher
* Unity SDK v7.21.0 or higher

Please update if you are using any versions below the ones listed above.

As of July 1, 2023, we are ending the Transition Period for older versions of App Events via the Facebook SDK, whereby we applied Limited Data Use to all personal information shared about people in California. The ability to enable default Limited Data Use will no longer be available  for any versions below iOS Facebook SDK v7.1.1, Android Facebook SDK v7.1.0 and Unity SDK  v7.21.0.  If you choose to use Limited Data Use for a person in California, Colorado, Connecticut, Florida, Texas, or Oregon on or after July 1, 2023, you must update your SDK and implement Data Processing Options as set forth in this document.

| Implementation | Adding Data Processing Options |
| --- | --- |
| Facebook SDK for iOS v7.1.1+ (Objective-C) | With Objective-C, use `FBSDKSettings setDataProcessingOptions`.<br><br>To explicitly not enable Limited Data Use (LDU), use:<br><br>```
[FBSDKSettings setDataProcessingOptions:@[]];
```<br><br>To enable LDU and have Meta perform geolocation,  use:<br><br>```
[FBSDKSettings setDataProcessingOptions:@[@"LDU"] country:0 state:0];
```<br><br>To enable LDU and manually specify the location, e.g., for California, use:<br><br>```
[FBSDKSettings setDataProcessingOptions:@[@"LDU"] country:1 state:1000];
``` |
| Facebook SDK for iOS v7.1.1+ (Swift) | With Swift, use `setDataProcessingOptions`.<br><br>To explicitly not enable LDU, use:<br><br>```
Settings.setDataProcessingOptions(modes: [])
```<br><br>To enable LDU and have Meta perform geolocation, use:<br><br>```
Settings.setDataProcessingOptions(modes: ["LDU"], country: 0, state: 0)
```<br><br>To enable LDU and manually specify the location, e.g., for California, use:<br><br>```
Settings.setDataProcessingOptions(modes: ["LDU"], country: 1, state: 1000)
``` |
| Facebook SDK for Android v7.1.0+ | Use the `setDataProcessingOptions` method.<br><br>To explicitly not enable LDU, use:<br><br>```
FacebookSdk.setDataProcessingOptions(new String[] {});
```<br><br>To enable LDU and have Meta perform geolocation, use:<br><br>```
FacebookSdk.setDataProcessingOptions(new String[] {"LDU"}, 0, 0);
```<br><br>To enable LDU and manually specify the location, e.g., for California, use:<br><br>```
FacebookSdk.setDataProcessingOptions(new String[] {"LDU"}, 1, 1000);
``` |
| Unity SDK v7.21.1+ | To explicitly not enable LDU, send an event with:<br><br>```
FB.Mobile.SetDataProcessingOptions(new string[] {});
```<br><br>To enable LDU and have Meta perform geolocation, send an event with:<br><br>```
FB.Mobile.SetDataProcessingOptions(new string[] {"LDU"}, 0, 0);
```<br><br>To enable LDU and manually specify the location, e.g., for California, send an event with:<br><br>```
FB.Mobile.SetDataProcessingOptions(new string[] {"LDU"}, 1, 1000);
``` |

### [Audience Network SDK](https://developers.facebook.com/docs/audience-network)

We recommend using our latest Audience Network SDK versions to ensure the functionality of Data Processing Options. The below implementation instructions are accurate for Audience Network SDK versions 5.10 and above.

As of July 1, 2023,  we are ending the Transition Period for older versions of Audience Network SDK, whereby we limited the data for all personal information that businesses share about people in California and the ability to enable default Limited Data Use will not be available for Audience Network SDK versions below 5.10.  If you choose to use Limited Data Use to indicate a person in California, Colorado, Connecticut, Florida, Texas, or Oregon or on or after July 1, 2023, you must update your SDK and implement Data Processing Options as set forth in this document.

| Implementation | Adding Data Processing Options |
| --- | --- |
| Facebook SDK for iOS, v5.10+ | Use `FBAdSettings setDataProcessingOptions`.<br><br>To explicitly not enable Limited Data Use (LDU), use:<br><br>```
[FBAdSettings setDataProcessingOptions:@[]];
```<br><br>To enable LDU and have Meta perform geolocation, use:<br><br>* **Country:** `0`  to request that we determine the location<br>* **State:** `0` to request that we determine the location<br><br>```
[FBAdSettings setDataProcessingOptions:@[@"LDU"] country:0 state:0];
```<br><br>To enable LDU and manually specify the location, use:<br><br>* **Country:** `1` to indicate USA<br>* **State:** `1000` to indicate California, `1001` for Colorado, `1002` for Connecticut, `1003` for Florida, `1004` for Oregon, `1005` for Texas, `1006` for Montana, `1007` for Delaware, `1008` for Nebraska, `1009` for New Hampshire, `1010` for New Jersey, `1011` for Minnesota, `1012` for Maryland, `1013` for Rhode Island<br><br>```
[FBAdSettings setDataProcessingOptions:@[@"LDU"] country:1 state:1000];
``` |
| Facebook SDK for Android, v5.10+ | Use the `setDataProcessingOptions` method.<br><br>To explicitly not enable Limited Data Use (LDU), use:<br><br>```
AdSettings.setDataProcessingOptions(new String[] {})
```<br><br>To enable LDU and have Meta perform geolocation, use:<br><br>* **Country:** `0` to request that we determine the location<br>* **State:** `0` to request that we determine the location<br><br>```
AdSettings.setDataProcessingOptions(new String[] {"LDU"}, 0, 0);
```<br><br>To enable LDU and manually specify the location, use:<br><br>* **Country:** `1` to indicate USA<br>* **State:** `1000` to indicate California, `1001` for Colorado, `1002` for Connecticut, `1003` for Florida, `1004` for Oregon, `1005` for Texas, `1006` for Montana, `1007` for Delaware, `1008` for Nebraska, `1009` for New Hampshire, `1010` for New Jersey, `1011` for Minnesota, `1012` for Maryland, `1013` for Rhode Island<br><br>```
AdSettings.setDataProcessingOptions(new String[] {"LDU"}, 1, 1000);
``` |
| Unity SDK, v5.10+ (**not** using the Audience Network-supplied Unity wrapper) | If you are **not** using the Audience Network-supplied Unity wrapper, enter the following code.<br><br>```
using UnityEngine;
using System.Runtime.InteropServices;

namespace AudienceNetwork
{
public static class AdSettings
{

public static void SetDataProcessingOptions(string[] dataProcessingOptions)
{
#if UNITY_ANDROID
AndroidJavaClass adSettings = new AndroidJavaClass("com.facebook.ads.AdSettings");
adSettings.CallStatic("setDataProcessingOptions", (object)dataProcessingOptions);
#endif

#if UNITY_IOS
FBAdSettingsBridgeSetDataProcessingOptions(dataProcessingOptions, dataProcessingOptions.Length);
#endif
}

public static void SetDataProcessingOptions(string[] dataProcessingOptions, int country, int state)
{
#if UNITY_ANDROID
AndroidJavaClass adSettings = new AndroidJavaClass("com.facebook.ads.AdSettings");
adSettings.CallStatic("setDataProcessingOptions", (object)dataProcessingOptions, country, state);
#endif

#if UNITY_IOS
FBAdSettingsBridgeSetDetailedDataProcessingOptions(dataProcessingOptions, dataProcessingOptions.Length, country, state);
#endif
}

#if UNITY_IOS
[DllImport("__Internal")]
private static extern void FBAdSettingsBridgeSetDataProcessingOptions(string[] dataProcessingOptions, int length);

[DllImport("__Internal")]
private static extern void FBAdSettingsBridgeSetDetailedDataProcessingOptions(string[] dataProcessingOptions, int length, int country, int state);
#endif
}
}
```<br><br>After entering this code, you can follow the Unity SDK instructions in the row below as if you are using the Unity wrapper. |
| Unity SDK, v5.10+ (using the Audience Network-supplied Unity wrapper) | If you are using the Audience Network-supplied Unity wrapper, use the following  `SetDataProcessingOptions`.<br><br>To explicitly not enable LDU, use:<br><br>```
AdSettings.SetDataProcessingOptions(new string[]{})
```<br><br>To enable LDU and have Meta perform geolocation, use:<br><br>* **Country:** `0` to request that we determine the location<br>* **State:** `0` to request that we determine the location<br><br>```
AdSettings.SetDataProcessingOptions(new string[] {"LDU"}, 0, 0);
```<br><br>To enable LDU and manually specify the location, use:<br><br>* **Country:** `1` to indicate USA<br>* **State:** `1000` to indicate California, `1001` for Colorado, `1002` for Connecticut, `1003` for Florida, `1004` for Oregon, `1005` for Texas, `1006` for Montana, `1007` for Delaware, `1008` for Nebraska, `1009` for New Hampshire, `1010` for New Jersey, `1011` for Minnesota, `1012` for Maryland, `1013` for Rhode Island<br><br>```
AdSettings.SetDataProcessingOptions(new string[] {"LDU"}, 1, 1000);
``` |

Publishers using a Mediation Partner must set the Data Processing Options (Limited Data Use) on the Meta Audience Network SDK before initializing the Mediation SDK so that it is received by us in the bidding request.

| Implementation | Adding Data Processing Options |
| --- | --- |
| Android | To explicitly not enable LDU for the event, use:<br><br>```
AdSettings.setDataProcessingOptions(new String[] {})
```<br><br>To enable LDU and have Meta perform geolocation, use:<br><br>* **Country:** `0` to request that we determine the location<br>* **State:** `0` to request that we determine the location<br><br>```
AdSettings.setDataProcessingOptions(new String[] {"LDU"}, 0, 0);
```<br><br>To enable LDU and manually specify the location, use:<br><br>* **Country:** `1` to indicate USA<br>* **State:** `1000` to indicate California, `1001` for Colorado, `1002` for Connecticut, `1003` for Florida, `1004` for Oregon, `1005` for Texas, `1006` for Montana, `1007` for Delaware, `1008` for Nebraska, `1009` for New Hampshire, `1010` for New Jersey, `1011` for Minnesota, `1012` for Maryland, `1013` for Rhode Island<br><br>```
AdSettings.setDataProcessingOptions(new String[] {"LDU"}, 1, 1000);
```<br><br>After setting LDU, initialize the Mediation Partner SDK as per usual. |
| iOS | To explicitly not enable Limited Data Use (LDU), use:<br><br>```
FBAdSettings setDataProcessingOptions:@[]];
```<br><br>To enable LDU and have Meta perform geolocation, use:<br><br>* **Country:** `0` to request that we determine the location<br>* **State:** `0` to request that we determine the location<br><br>```
[FBAdSettings setDataProcessingOptions:@[@"LDU"] country:0 state:0];
```<br><br>To enable LDU and manually specify the location, use:<br><br>* **Country:** `1` to indicate USA<br>* **State:** `1000` to indicate California, `1001` for Colorado, `1002` for Connecticut, `1003` for Florida, `1004` for Oregon, `1005` for Texas, `1006` for Montana, `1007` for Delaware, `1008` for Nebraska, `1009` for New Hampshire, `1010` for New Jersey, `1011` for Minnesota, `1012` for Maryland, `1013` for Rhode Island<br><br>```
[FBAdSettings setDataProcessingOptions:@[@"LDU"] country:1 state:1000];
```<br><br>After setting the LDU for the event, initialize the Mediation Partner SDK as per usual. |

For publishers that are working with us through Bidding Kit and other Server-side Bidding, please follow the implementation methods below.

| Implementation | Adding Data Processing Options |
| --- | --- |
| Android/Bidding Kit 2.0 | To explicitly not enable LDU, use:<br><br>```
AdSettings.setDataProcessingOptions(new String[] {})
```<br><br>To enable LDU and have Meta perform geolocation, use:<br><br>* **Country:** `0` to request that we determine the location<br>* **State:** `0` to request that we determine the location<br><br>```
AdSettings.setDataProcessingOptions(new String[] {"LDU"}, 0, 0);
```<br><br>To enable LDU and manually specify the location, use:<br><br>* **Country:** `1` to indicate USA<br>* **State:** `1000` to indicate California, `1001` for Colorado, `1002` for Connecticut, `1003` for Florida, `1004` for Oregon, `1005` for Texas, `1006` for Montana, `1007` for Delaware, `1008` for Nebraska, `1009` for New Hampshire, `1010` for New Jersey, `1011` for Minnesota, `1012` for Maryland, `1013` for Rhode Island<br><br>```
AdSettings.setDataProcessingOptions(new String[] {"LDU"}, 1, 1000);
```<br><br>After setting the LDU for the event, generate the bidder token:<br><br>```
String token = BidderTokenProvider.getBidderToken(Context);
``` |
| iOS/Bidding Kit 2.0 | To explicitly not enable Limited Data Use (LDU), use:<br><br>```
[FBAdSettings setDataProcessingOptions:@[]];
```<br><br>To enable LDU and have Meta perform geolocation, use:<br><br>* **Country:** `0` to request that we determine the location<br>* **State:** `0` to request that we determine the location<br><br>```
[FBAdSettings setDataProcessingOptions:@[@"LDU"] country:0 state:0];
```<br><br>To enable LDU and manually specify the location, use:<br><br>* **Country:** `1` to indicate USA<br>* **State:** `1000` to indicate California, `1001` for Colorado, `1002` for Connecticut, `1003` for Florida, `1004` for Oregon, `1005` for Texas, `1006` for Montana, `1007` for Delaware, `1008` for Nebraska, `1009` for New Hampshire, `1010` for New Jersey, `1011` for Minnesota, `1012` for Maryland, `1013` for Rhode Island<br><br>```
[FBAdSettings setDataProcessingOptions:@[@"LDU"] country:1 state:1000];
```<br><br>After setting the LDU for the event, generate the bidder token:<br><br>```
NSString *token = [FBAdSettings bidderToken];
``` |
| Other Server-Side Bidding | For each platform follow the instructions below to specify LDU for the event and retrieve the bidder token before making the server-side bid request.<br><br>**For Android client:**<br><br>To explicitly not enable LDU, use:<br><br>```
AdSettings.setDataProcessingOptions(new String[] {})
```<br><br>To enable LDU and have Meta perform geolocation, use:<br><br>* **Country:** `0` to request that we determine the location<br>* **State:** `0` to request that we determine the location<br><br>```
AdSettings.setDataProcessingOptions(new String[] {"LDU"}, 0, 0);
```<br><br>To enable LDU and manually specify the location, use:<br><br>* **Country:** `1` to indicate USA<br>* **State:** `1000` to indicate California, `1001` for Colorado, `1002` for Connecticut, `1003` for Florida, `1004` for Oregon, `1005` for Texas, `1006` for Montana, `1007` for Delaware, `1008` for Nebraska, `1009` for New Hampshire, `1010` for New Jersey, `1011` for Minnesota, `1012` for Maryland, `1013` for Rhode Island<br><br>```
AdSettings.setDataProcessingOptions(new String[] {"LDU"}, 1, 1000);
```<br><br>After setting the LDU for the event, generate the bidder token:<br><br>```
String token = BidderTokenProvider.getBidderToken(Context);
```<br><br>**For iOS client:**<br><br>To explicitly not enable Limited Data Use (LDU), use:<br><br>```
[FBAdSettings setDataProcessingOptions:@[]];
```<br><br>To enable LDU and have Meta perform geolocation, use:<br><br>* **Country:** `0` to request that we determine the location<br>* **State:** `0` to request that we determine the location<br><br>```
[FBAdSettings setDataProcessingOptions:@[@"LDU"] country:0 state:0];
```<br><br>To enable LDU and manually specify the location, use:<br><br>* **Country:** `1` to indicate USA<br>* **State:** `1000` to indicate California, `1001` for Colorado, `1002` for Connecticut, `1003` for Florida, `1004` for Oregon, `1005` for Texas, `1006` for Montana, `1007` for Delaware, `1008` for Nebraska, `1009` for New Hampshire, `1010` for New Jersey, `1011` for Minnesota, `1012` for Maryland, `1013` for Rhode Island<br><br>```
[FBAdSettings setDataProcessingOptions:@[@"LDU"] country:1 state:1000];
```<br><br>After setting the LDU for the event, generate the bidder token:<br><br>```
NSString *token = [FBAdSettings bidderToken];
``` |

### [Customer List Custom Audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/custom-audiences)

**Note:** If you want to enable Limited Data Use for people in California via customer list custom audiences on or after June 1, 2023, you must upload new audiences or [update your existing audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/custom-audiences) with the Limited Data Use flag. Regularly update and maintain your audiences and people’s Limited Data Use statuses as needed.

Please note that a Limited Data Use flag applied to a user in one audience will not automatically carry over to different audiences. In the same way advertisers must manage each of their existing customer list custom audiences separately by the criteria they select, the Limited Data Use flag must be applied separately to each audience they leverage for their advertising.

To explicitly NOT enable `LDU` for the record, you can either send an empty `data_processing_options` array or remove the field in the payload. Example of an empty array:

```
{
   "payload": {
       "schema": [
           "EMAIL",
                    "DATA_PROCESSING_OPTIONS"
       ],
       "data": [
           [
               "<HASHED_DATA>
",
                           []
           ]
       ]
   }
}
```

To explicitly enable `LDU`, and have Meta perform geolocation (by not including state and country of the given record), specify an array containing `LDU` for each record:

```
{
   "payload": {
       "schema": [
           "EMAIL",
                    "DATA_PROCESSING_OPTIONS"
       ],
       "data": [
           [
               "<HASHED_DATA>
",
                           ["LDU"]
           ]
       ]
   }
}
```

To enable LDU and manually specify the location:

```
{
    "customer_consent": true,
    "payload": {
        "schema": [
            "EMAIL",
            "DATA_PROCESSING_OPTIONS",
            "DATA_PROCESSING_OPTIONS_COUNTRY",
            "DATA_PROCESSING_OPTIONS_STATE"
        ],
        "data": [
            [
                "<HASHED_DATA>",
                ["LDU"],
                1,
                1000
            ]
        ]
    }
}
```

