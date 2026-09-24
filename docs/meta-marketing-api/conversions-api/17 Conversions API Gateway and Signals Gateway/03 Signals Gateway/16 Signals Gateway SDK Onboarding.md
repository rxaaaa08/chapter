<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway/signals-gateway-sdk-onboarding | Saved: 2026-09-19 -->

# Signals Gateway SDK Onboarding



## Step 1: Install and Set Up Signals Gateway

### Install Signals Gateway

* If you don't already have a Signals Gateway, follow [this guide](https://developers.facebook.com/documentation/ads-commerce/gateway-products/configuration) to install it.
* If you have Signals Gateway already, proceed to [Step 2: Set up Signals Gateway SDK](#set-up-sg-sdk)

To create a new pipeline, enter a name for the pipeline. Select Signals Gateway SDK for iOS as the data source and Meta Conversions API or others as your data destination

## Step 2: Set Up Signals Gateway SDK in Pipeline {#set-up-sg-sdk}

Once you are in the SDK flow, choose a name for the SDK data source. (You can also specify the data source ID if needed.)

Choose the industry that is closest to your business model and select events.

Choose the identity matching that meets your preferences.

The final stage of the flow will have the link to the instructions to set up the SDK. **Copy and paste** these instructions and share with your **app developer** to complete app setup.

## Step 3: Configure the Pipeline Destination

Follow the steps until you reach the section about setting up the Meta Conversions API. If you would like to set up a data destination other than Meta, please refer to the [Data Destination Management documentation](https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway/data-destination-management).

### Meta Conversions API for App
The following steps will guide you through logging into your business account and passing the dataset ID. There are three cases:

1. There is a dataset ID with an application ID connected. The dataset ID can be selected right away.
2. There is an application ID and **no** dataset ID connected to it:  Meta Business Extension will let you choose an application and create a new dataset that will have the application ID connected to it.
3. There is **no** application ID and **no** dataset ID: Meta Business Extension will let you create a new application and create a new dataset that will have the newly created application ID connected to it.

If you successfully connect your data destination, you should be able to see your selected dataset ID and the outbound events should show up after the Signals Gateway SDK is integrated.

The dataset ID displayed is the **Meta-side dataset ID** that you should be able to access in Meta Events Manager (it is not the ID to be used for the app-ID setup). You can click on the dataset ID to access the settings.

Clicking on the data source opens the configuration with relevant IDs and allows you to control the SDK configuration. Note: the configuration can be updated based on your needs.  

At the end, these are the identifiers you will need:

* **App ID** (Signals Gateway side). This ID represents the incoming events from the Signals Gateway SDK to your Signals Gateway installation. It is used to configure the Signals Gateway SDK, and the connection **data source ID** (Signals Gateway) < > **dataset ID** (Meta) happens during the outbound configuration step.
* **Dataset ID** (Meta side, [learn more](https://www.facebook.com/business/help/750785952855662?id=490360542427371)). A container to receive the signals from the Signals Gateway SDK.
* **Application ID** (Meta side, [learn more](https://www.facebook.com/business/help/5270377362999582?id=490360542427371)). An ID representing the mobile data source connected to the dataset ID above.

## Step 4: Integrate the SDK Bundle Into Your Application

App developer documentation and Signals Gateway SDK binary are always available under the URL: **https://<your_domain>/app/sdk/ios/setup**. The link is in the "SDK details" section under the **Meta Dataset** details menu.   

The previous step will provide the instructions on how to install the SDK and link to the binary. Follow the instructions and integrate the binary into the app.

It is highly recommended that you ensure you see inbound events after the SDK is integrated.  

## Step 5: Make an App Release in the App Store

### Co-Hosting with Facebook SDK for iOS (Optional)

If you already have the Facebook SDK for iOS and wish to log the same event through both SDKs, make sure that you log the same events across the SDKs, especially during a campaign.

#### Cross-channel events deduplication

If an event is shared dual channel, please add the `event_id` parameter for deduplication. For example, if a "Purchase" event is shared through a mobile measurement partner (MMP) and the Signals Gateway SDK, or Facebook SDK for iOS and the Signals Gateway SDK, make sure to attach an `event_id` parameter that is unique for each individual purchase and the same for dual-channel event logging.

Below is sample code showing Signals Gateway SDK and Facebook SDK for iOS working together in one app, including an example of dual-channel "Purchase" logging with `event_id`.  

```
/* AppDelegate.swift example */
import AHSDK
import FBSDKCoreKit
import StoreKit
import UIKit

@UIApplicationMain
final class AppDelegate: UIResponder, UIApplicationDelegate {

  internal var window: UIWindow?

func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {

    AHSDK.ApplicationDelegate.shared.application(application, didFinishLaunchingWithOptions: launchOptions)
    FBSDKCoreKit.ApplicationDelegate.shared.application(application, didFinishLaunchingWithOptions: launchOptions)

    AHSDK.AppEvents.shared.setUserEmail(
      "apptest@meta.com",
      firstName: "Hua",
      lastName: nil,
      phone: "s123456",
      dateOfBirth: "19980713",
      gender: "M",
      city: "Bellevue",
      state: "WA",
      zip: "98005",
      country: "USA",
      externalId: "11111"
    )

    FBSDKCoreKit.AppEvents.shared.setUser(
      email: "apptest@meta.com",
      firstName: "Hua",
      lastName: nil,
      phone: "s123456",
      dateOfBirth: "19980713",
      gender: "M",
      city: "Bellevue",
      state: "WA",
      zip: "98005",
      country: "USA"
    )

    return true
  }

 @objc dynamic
 func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
    AHSDK.ApplicationDelegate.shared.application(app, open: url, options: options)
    return FBSDKCoreKit.ApplicationDelegate.shared.application(app, open: url, options: options)
  }

  @objc dynamic
  func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
    return true
  }
}

/* Example how to pass Event ID with Purchase with FB iOS SDK and Signals Gateway SDK */

import AHSDK
import FBSDKCoreKit

static func recordAndUpdateEvent(_ event: String, currency: String, value: String, options: String?, console: UITextView) {
    let valueToSum = Double(value) ?? 0
    if let options {
      AHSDK.Settings.shared.setDataProcessingOptions(convertOptionsToArray(options))
      FBSDKCoreKit.Settings.shared.setDataProcessingOptions(convertOptionsToArray(options))
    }

    let eventID = UUID().uuidString // set eventID for dedupe
    let parameters: [String: Any] = [
        "event_id": eventID,
    ]
    // trigger logPurchase() if the event name is Purchase
    if event == "Purchase" {
      AHSDK.AppEvents.shared.logPurchase(purchaseAmount: valueToSum, currency: currency, parameters: parameters)
      FBSDKCoreKit.AppEvents.shared.logPurchase(amount: valueToSum, currency: currency, parameters: [.currency: currency, AppEvents.ParameterName(rawValue: "event_id"): eventID])
    } else {
      AHSDK.AppEvents.shared.logEvent(event, eventId: eventID, valueToSum: valueToSum, parameters: parameters)
      FBSDKCoreKit.AppEvents.shared.logEvent(AppEvents.Name(rawValue: event), valueToSum: valueToSum, parameters: [.currency: currency, AppEvents.ParameterName(rawValue: "event_id"): eventID])
    }
  }
```

## See Also

* [Signals Gateway Overview](https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway)
* [Signals Gateway Configuration](https://developers.facebook.com/documentation/ads-commerce/gateway-products/configuration)
* [Data Destination Management](https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway/data-destination-management)
