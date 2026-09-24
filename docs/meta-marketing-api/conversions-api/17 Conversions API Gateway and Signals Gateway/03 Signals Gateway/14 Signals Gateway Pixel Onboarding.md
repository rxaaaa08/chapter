<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway/signals-gateway-pixel-onboarding | Saved: 2026-09-19 -->

# Set Up and Install Your Signals Gateway Pixel



Signals Gateway Pixel is business-deployed and managed code, operating in the business's website and is not reliant on third-party cookies or code from Meta's servers. Signals Gateway enables businesses to use the Signals Gateway Pixel to share web events from their Signals Gateway to the Conversions API endpoint and other destinations, such as Google BigQuery and more.

This document covers configuring Signals Gateway (if you have not already) and integrating Signals Gateway Pixel on your website.

## Step 1: Install and Set Up Signals Gateway

### Step 1.1: Install Signals Gateway

* **If you don't already have a Signals Gateway**, follow [this guide](https://developers.facebook.com/documentation/ads-commerce/gateway-products/configuration) to install Signals Gateway.
* **If you have Signals Gateway already**, jump to Step 1.2, Enable CDN.

### Step 1.2: Enable CDN

Follow [this guide](https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway/enable-cdn) to enable CDN.

## Step 2: Set Up Signals Gateway Pixel

### Step 2.1: Create a new Signals Gateway Pixel on Signals Gateway

* Click the **Create data pipeline** button at the top-right, select "Signals Gateway pipeline" in the popup modal, and click **Create**.

* Name the pipeline, and select "Signals Gateway Pixel" from the "Data sources" list and the desired destination(s) from the "Data destinations" list.

* Name Signals Gateway Pixel, and make a selection for the question "Does your website have a Meta Pixel?" It is recommended to set up the new Signals Gateway Pixel alongside your existing Meta Pixel on your website to make the most out of your data.

* Follow the instructions to add Signals Gateway Pixel header code:
* If you are planning to manually add tracking calls to your website, select one of the options, and click on the copy instructions/copy base code button to copy Signals Gateway Pixel header code and add it to your website.
* If you are planning to use Shopify, select "Shopify" in the dropdown, click on the copy custom pixel code button to copy Signals Gateway Pixel header code, and follow the linked Shopify guidance to set up the pixel.
* If you selected "Yes" for "Does your website have a Meta Pixel?", you can skip this bullet point, and go to the next one. If you selected "No", follow the instructions on page to configure your Signals Gateway Pixel.
* Follow [this guide](https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway/data-destination-management) to connect the data destination(s).
* After the data pipeline is created, you can find Signals Gateway Pixel by clicking into the pipeline detail page or navigating to the "Data sources" page from the side navigation bar.
* You can review and update Signals Gateway Pixel configuration in the pixel details view.
* Set up custom data filtering script:
    * You can also add your own JS script to filter the events out and not send to your Signal Gateway instance from the web browser. You can place the custom script in the "Data Filter" tab.
    * An event object is passed into the custom script to be processed. There are 4 fields in each of the event object:
        * Event name in string type, for example, "PageView", "Purchase", "ViewContent"
        * Domain URL in string type, which is the source where the event comes from. To avoid receiving events from suspicious websites, you can add JS code to filter out the events which come from such domains.
        * User data as a map. It contains user data such as first name, last name, zip code, country, and so on.
        * Custom data as a map.
    * The expected output of your data filtering script is a map, with the following two keys:
        * shouldDrop as boolean. If the event needs to be filtered out and not sent to the Signals Gateway instance, you can set 'shouldDrop' value as true. The default value of 'shouldDrop' is false, if no data filtering script is configured.
        * updatedEventObject as the same type as the event object passed, with the same 4 fields as in updatedEventObject.
            * Event name as string
            * Domain URL as string
            * User data as a map
            * Custom data as a map

### Step 2.2: Set up Signals Gateway Pixel Events

If you selected "Yes" for "Does your website have a Meta Pixel?" in the previous step, the "[Use event code such as fbq(...) from Meta Pixel](#use-event-code)" feature has been automatically enabled, and you can directly go to Step 2.4, Verification.  

Otherwise, here are several ways to set up Signals Gateway Pixel events:  

#### Manual Setup

**Standard Events**

You can use the Signals Gateway Pixel's cbq('track') function to track the following standard events, for example, `cbq('track', 'Purchase', {currency: "USD", value: 30.00});`. Standard events also support parameter objects with specific object properties, which allow you to include detailed information about an event.

| Event Name | Event Description | Object Properties |
| --- | --- | --- |
| `AddPaymentInfo` | When payment information is added in the checkout flow.<br><br>_A person clicks on a save billing information button._ | content_ids, contents, currency, value<br><br>Optional. |
| `AddToCart` | When a product is added to the shopping cart.<br><br>_A person clicks on an add to cart button._ | content_ids, content_type, contents, currency, value<br><br>Optional.<br><br>Required for Advantage+ catalog ads: contents |
| `AddToWishlist` | When a product is added to a wishlist.<br><br>_A person clicks on an add to wishlist button._ | content_ids, contents, currency, value<br><br>Optional. |
| `CompleteRegistration` | When a registration form is completed.<br><br>_A person submits a completed subscription or signup form._ | currency, value<br><br>Optional. |
| `Contact` | When a person initiates contact with your business via telephone, SMS, email, chat, etc.<br><br>_A person submits a question about a product._ |  |
| `CustomizeProduct` | When a person customizes a product.<br><br>_A person selects the color of a t-shirt._ |  |
| `Donate` | When a person donates funds to your organization or cause.<br><br>_A person adds a donation to the Humane Society to their cart._ |  |
| `FindLocation` | When a person searches for a location of your store via a website or app, with an intention to visit the physical location.<br><br>_A person wants to find a specific product in a local store._ |  |
| `InitiateCheckout` | When a person enters the checkout flow prior to completing the checkout flow.<br><br>_A person clicks on a checkout button._ | content_ids, contents, currency, num_items, value<br><br>Optional. |
| `Lead` | When a signup is completed.<br><br>_A person clicks on pricing._ | currency, value<br><br>Optional. |
| `Purchase` | When a purchase is made or checkout flow is completed.<br><br>_A person has finished the purchase or checkout flow and lands on thank you or confirmation page._ | content_ids, content_type, contents, currency, num_items, value<br><br>Required: currency and value<br><br>Required for Advantage+ catalog ads: contents or content_ids |
| `Schedule` | When a person books an appointment to visit one of your locations.<br><br>_A person selects a date and time for a tennis lesson._ |  |
| `Search` | When a search is made.<br><br>_A person searches for a product on your website._ | content_ids, content_type, contents, currency, search_string, value<br><br>Optional.<br><br>Required for Advantage+ catalog ads: contents or content_ids |
| `StartTrial` | When a person starts a free trial of a product or service you offer.<br><br>_A person selects a free week of your game._ | currency, predicted_ltv, value<br><br>Optional. |
| `SubmitApplication` | When a person applies for a product, service, or program you offer.<br><br>_A person applies for a credit card, educational program, or job._ |  |
| `Subscribe` | When a person applies to a start a paid subscription for a product or service you offer.<br><br>_A person subscribes to your streaming service._ | currency, predicted_ltv, value<br><br>Optional. |
| `ViewContent` | A visit to a web page you care about (for example, a product page or landing page). ViewContent tells you if someone visits a web page's URL, but not what they see or do on that page.<br><br>_A person lands on a product details page._ | content_ids, content_type, contents, currency, value<br><br>Optional.<br><br>Required for Advantage+ catalog ads: contents or content_ids |

#### Object Properties

| Property Key | Value Type | Parameter Description |
| --- | --- | --- |
| `content_category` | String | Category of the page/product. |
| `content_ids` | Array of integers or strings | Product IDs associated with the event, such as SKUs.<br><br>**Example**: ['ABC123', 'XYZ789'] |
| `content_name` | String | Name of the page/product. |
| `content_type` | String | Either product or product_group based on the content_ids or contents being passed. If the IDs being passed in content_ids or contents parameter are IDs of products, then the value should be product. If product group IDs are being passed, then the value should be product_group. |
| `contents` | Array of objects | An array of JSON objects that contains the quantity and the International Article Number (EAN) when applicable, or other product or content identifier(s). ID and quantity are the required fields.<br><br>**Example**: [{'id': 'ABC123', 'quantity': 2}, {'id': 'XYZ789', 'quantity': 2}] |
| `currency` | String | The currency for the value specified. |
| `num_items` | Integer | The number of items. |
| `predicted_ltv` | Integer, float | Predicted lifetime value of a subscriber as defined by the advertiser and expressed as an exact value. |
| `search_string` | String | Used with the Search event. The string entered by the user for the search. |
| `status` | Boolean | Used with the CompleteRegistration event, to show the status of the registration. |
| `value` | Integer, float | The value of a user performing this event to the business. |

#### Custom Events

You can track custom events by calling the Signals Gateway Pixel's cbq('trackCustom') function, with your custom event name and (optionally) a JSON object as its parameters. Just like standard events, you can call the cbq('trackCustom') function anywhere between your webpage's opening and closing <body> tags, either when your page loads, or when a visitor performs an action like clicking a button.

For example, let's say you wanted to track visitors who share a promotion in order to get a discount. You could track them using a custom event like this:

```
cbq('trackCustom', 'ShareDiscount', {promotion: 'share_discount_10%'});
```

#### Use Event Code Such As fbq(...) from Meta Pixel {#use-event-code}

If you have already implemented fbq() tracking calls on your website, you can let the fbq() calls send events to both your Meta Pixel and Signals Gateway Pixel by enabling the "Use event code such as fbq(...) from Meta Pixel" config.

#### Set Up with Shopify

If you're using Shopify for your website, Signals Gateway Pixel can automatically record events such as purchase, add to cart, and more. You can deploy this through the "Customer Events" feature on the admin page of your Shopify website. Follow the [Shopify pixels and customer events guidance](https://help.shopify.com/en/manual/promoting-marketing/pixels) for step-by-step instructions.

#### Set Up with Google Tag Manager

You can install a Signals Gateway Pixel in Google Tag Manager using "[Custom HTML](https://support.google.com/tagmanager/answer/6107167?hl=en)". Here are the steps:

* Copy Signals Gateway Pixel header code in the pixel details view.
* In GTM, create a new Tag by clicking **Tags > New**.
* In "Tag Configuration", click the '**Edit**' button.
* Select "**Custom HTML**" as tag type.
* Paste the header code in HTML form.
* Set up '**Triggering**'.
* Click the '**Save**' button to save tag configs.
* Click the '**Submit**' button to deploy the new tag.

### Step 2.3: Set Up Deduplication

Deduplication setup is needed if the Meta Pixel is connected and the Conversions API Gateway pipeline is also receiving the same user events from other channels (having a "redundant" setup).

When you use a redundant setup, you must set up a deduplication method to ensure that the ad delivery system is able to differentiate between distinct and overlapping events. If you do not send the same event twice via both Signals Gateway Pixel and another channel, you do not need to set up deduplication for those events.

Depending on how you set up Signals Gateway Pixel events, here are the deduplication options:

#### Manual Dedupe Setup

If you have implemented cbq() pixel tracking calls on your website manually, or if you also send events through the Conversions API directly, you need to add dedupe keys to your Signals Gateway Pixel, Meta Pixel, and Conversions API events. Acceptable dedupe keys include Event ID, FBP, and External ID. Follow the instructions [here](https://developers.facebook.com/documentation/ads-commerce/conversions-api/deduplicate-pixel-and-server-events) (replace **fbq** with **cbq** for Signals Gateway Pixel setup).

#### Dedupe Setup Through Partners

Dedupe handling differs between partners:

* For Shopify, dedupe is handled automatically as Shopify passes down the same Event ID to Signals Gateway Pixel, Meta Pixel, and Conversions API events for the same user event.
* For GTM, you need to generate and add an Event ID to cbq, fbq (if any), and CAPI (if any) events. One way to do this is to create a custom Javascript user-defined Event ID variable. The Event ID should be passed into cbq and fbq calls as the fourth argument (for example, `cbq('track', 'PageView', {}, {eventID: {{Event ID}}});`), and added to the event parameter list of the Conversions API events

#### Codeless Dedupe Setup

If you set up Signals Gateway Pixel events by enabling "[Use event code such as fbq(...) from Meta Pixel](#use-event-code)", or migrating EST rules from the existing Meta Pixel, dedupe is handled automatically.

### Step 2.4: Verification

Use the **Test Event tool** on Signals Gateway to verify that events are fired from your website and sent to Signals Gateway. The **Test Event** tab within the Signals Gateway Pixel detail modal is a tool for users to test inbound events. You can input and launch the website that has the Signals Gateway Pixel installed, trigger events from the launched website, and then verify that your pipeline is receiving test events in real-time.

If test events don't show up as expected, you can follow the steps below to debug:

#### events.js downloading
Upon loading your front-end website, open your browser inspector to inspect your website. Verify that your webpage downloads the script from **<Signals Gateway host>/sdk/events.js** and runs it. Clicking on the url will also show the minimized script. The status code should be 200 in the request headers.

#### Event sending

Open your browser inspector to inspect your front-end website. For example, if you have added tracking code **cbq('track','Purchase');** upon clicking the button that triggers the 'Purchase' event, then when you click the button, there should be a request in the **Network tab** with a normal 200 response from **<Signals Gateway host>/events**. Verify the conversion_value and custom_data (if has been set up) in request payload, including the currency, value, and other product content parameters.

You can also use [Signals Gateway Pixel Helper](https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway/signals-gateway-pixel-helper) **Chrome Extension** to verify your Signals Gateway Pixel's events configuration.

Once verified that events are firing from the website, open your Signals Gateway dashboard found at **<Signals Gateway host>/hub/capig/pipeline**. As an example, assume you have a total of **2** 'Purchase' events received already. Looking back at the dashboard, it updates automatically from 2 to **3** 'Purchase' events.

Events are also viewable in [Meta Events Manager](https://business.facebook.com/events_manager2/) under the business that was registered with your Meta Pixel. Events in Events Manager may take up to a few hours to show up.

### Step 2.4: Event Diagnostics

There are detectors running periodically on Signals Gateway to detect issues with your Signals Gateway Pixel setup and event configurations (for example, event missing parameters). You can follow [this guide](https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway/diagnostics-tab) to check the diagnostics.

## See Also

* [Signals Gateway Overview](https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway)
* [Signals Gateway Setup](https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway/setup)
* [Data Destination Management](https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway/data-destination-management)
* [Data Source Management](https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway/data-source-management)
* [Diagnostics](https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway/diagnostics-tab)
* [Signals Gateway Pixel Helper](https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway/signals-gateway-pixel-helper)
