<!-- Source: https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gtm-server-side | Saved: 2026-09-19 -->

# Conversions API for Server-Side Google Tag Manager (GTM)



The [Conversions API](https://www.facebook.com/business/help/2041148702652965?id=818859032317965) is designed to create a direct connection between your marketing data and the systems which help optimize ad targeting, decrease cost per action and measure results across Meta technologies. You can configure a server that you set up on the Google Cloud Platform (GCP) or any other cloud provider to send key web and offline event data through the Conversions API. With this setup, after you configure the Google Analytics 4 (GA4) Web Tag, you can send that data to your own server hosted on Google Cloud Platform (GCP) and eventually to Meta through the Conversions API.

The [Conversions API Tag](https://github.com/facebookincubator/ConversionsAPI-Tag-for-GoogleTagManager/blob/main/template.tpl) is written and maintained by Meta based on the Google [Custom Tag Template](https://developers.google.com/tag-platform/tag-manager/templates). Reach out to Google with any questions you have about setting up Google products or Google's developer documentation.

This document outlines the following:

* Prerequisites, including how to create a server container
* How to configure the container to support your implementation of the GA4 Web Tag
* How to send data from your website to your GCP server
* How to share that data with Meta using the Conversions API
* Frequently asked questions

## Prerequisites

Before proceeding with this integration, Meta recommends that you:

1. Get familiar with the [Conversions API integration](https://developers.facebook.com/documentation/ads-commerce/conversions-api) and the [best practices](https://developers.facebook.com/documentation/ads-commerce/conversions-api/best-practices) for setup
2. Get familiar with [Server-Side Tagging](https://developers.google.com/tag-platform/tag-manager/server-side/intro) and [Custom Tag Template](https://developers.google.com/tag-platform/tag-manager/templates).

If your system uses a version older than GA4, you'll need to upgrade your existing tag manager setup to use GA4 before proceeding with this integration.

## Integration

### Create a GTM server container

A GTM server container allows you to manage and store tracking and marketing tags. It also helps you track how users interact with your website.

You will need to configure a server container and a web container:

* **Web container**: If this is your first time using GTM, start with installing a web container to your account. Learn more [here](https://support.google.com/tagmanager/answer/6103696?hl=en#install).
* **Server Container**:  You will need to create a server container in your GTM portal to set up a tagging server URL. Learn more about [this step](https://developers.google.com/tag-platform/tag-manager/server-side).

Go to Google Tag Manager by visiting the [Google Tag Manager website](https://tagmanager.google.com/).

#### Create a new container

If you already have an account, select it. Otherwise, create a new GTM account.

* Click on **Create Container**

* Name your container and select "Server" as the target platform

* Click **Create**

Setting up a server container requires configuring a tagging server. The default GCP deployment can be completed when setting up the server container. Refer to the following [guidance](https://developers.google.com/tag-platform/tag-manager/server-side#what_is_the_domain_of_my_tagging_server). For any other cloud provider (for example, AWS, or Microsoft Azure), refer to the [manual server setup guide](https://developers.google.com/tag-platform/tag-manager/server-side/manual-setup-guide).

**Configure web and server containers**

1.   On your web container, create the following artifacts:
* GA4 Configuration to configure your tagging server URL.
* GA4 Event to configure event schema to be delivered to the server.
2. On your server container, create the following artifacts:
* GA4 Client, a listener for the event that fires the event to Meta.
* Meta Conversions API Tag, a server-side tag that converts the standard event model from GA4 Client to Conversions API event schema and sends it to `graph.facebook.com`.

## Step 1: GA4 Configuration – Configure your tagging server URL

Configure your web container to send your website data to the created tagging server. [Learn more](https://developers.google.com/tag-platform/tag-manager/server-side/send-data?hl=en#google-analytics-4) about how to configure the [Google Analytics: GA4 Configuration Tag](https://support.google.com/tagmanager/answer/9442095?hl=en#config).

* If you select **Send to server container**, set your **Server Container URL** as the tagging server URL.
* If you do not select **Send to server container**, under **Fields to Set**, click **Add Row** and set:
    * Field name: `transport_url`
    * Field value: your tagging server URL

You can configure additional fields for any other parameters you want to send for all events.

* Set the `first_party_collection` flag to true. You must do this to be able to pass the `user_data` parameters to the Server-Side GTM. Under **Fields to Set**, click **Add Row** and set:
    * Field name: `first_party_collection`
    * Field value: `true`

### Using an existing GA4 Configuration tag

If you have an existing GA4 Configuration already set up, you can either amend it, or create an additional Configuration tag for Server-Side GTM.  

If you are setting up Server-Side GTM for the first time, adding the Server Container URL will start sending all your traffic to the Server Container. If you want to continue sending data to GA4, you'll need to add the GA4 Server-Side tag in your Server Container, ensuring it fires on all events. You may need to create additional GA4 Event tags or modify existing ones to ensure a complete mapping to Meta Pixel events.  

### Sending Meta Browser ID and Meta Click ID

If you have set up a custom domain, and your GTM tagging server domain is first-party, the Meta Browser ID and Meta Click ID are sent automatically.

If you're using the default domain provided, or notice that the Browser ID and Click ID fields are not being sent in Events Manager, you can configure these as follows:

* Navigate to the variables section, and create a new User-Defined Variable for both the Meta Browser ID and Meta Click ID. Use the variable type 1st-Party Cookie.
    * For the Meta Browser ID, set the Cookie Name to `_fbp`
    * For the Meta Click ID, set the Cookie Name to `_fbc`
* Save these variables.
* In your GA4 Configuration tag, under **Fields to Set**, click **Add Row** and set:
    * Field name: x-fb-ck-fbp
    * Field value: your Meta Browser ID variable
* Add an additional row for the Click ID:
* Field name: x-fb-ck-fbc
* Field value: your Meta Click ID variable

Create a Data Layer Variable for each of the common event schema `user_data` parameters. [Learn more](https://support.google.com/tagmanager/answer/6164391?hl=en) about setting up data-layer variables. For example, to pass an email address to Server-Side GTM, create a variable, (for example, `user_data_email_address`) that can be mapped to the Data Layer Variable Name, `eventModel.user_data.email_address`.  

If you're not using the data layer, configure variables for each parameter as indicated below to use instead. The list below shows all the mappings for Meta and GTM `user_data` parameters and their general priority in helping increase Event Match Quality. To improve ad performance and Event Match Quality, Meta recommends using the [Conversions API best practices](https://developers.facebook.com/documentation/ads-commerce/conversions-api/best-practices) when you set up an integration. If you have already set up the Conversions API, Meta recommends considering these best practices to improve your existing [setup](https://developers.google.com/tag-platform/tag-manager/server-side/ads-setup#configure_google_analytics_ga4_config_web_tag).  The Conversions API best practices may help improve your ad performance by lowering your cost per action.

| Conversions API Meta Parameter | GA4 Field Name | GTM Data Layer Variable Name | Priority |
| --- | --- | --- | --- |
| Email<br><br>`email_address`(`em`) | user_data.email_address | eventModel.user_data.email_address | High |
| Click ID<br><br>`fbc` | x-fb-ck-fbc | N/A | High |
| Facebook Login ID<br>`fb_login_id` | user_data.fb_login_id | N/A | Medium |
| Date of Birth<br><br>`db` | x-fb-ud-db | N/A | Medium |
| Country<br><br>`country`(`country`) | user_data.address.country | eventModel.user_data.address.country | Medium |
| Phone Number<br><br>`phone_number`(`ph`) | user_data.phone_number | eventModel.user_data.phone_number | Medium |
| External ID<br><br>`external_id` | x-fb-ud-external_id | N/A | Medium |
| Browser ID<br><br>`fbp` | x-fb-ck-fbp | N/A | Medium |
| State<br><br>`state`(`st`) | user_data.address.region | eventModel.user_data.address.region | Medium |
| Gender<br><br>`ge` | x-fb-ud-ge | N/A | Medium |
| First Name<br><br>`first_name`(`fn`) | user_data.address.first_name | eventModel.user_data.address.first_name | Low |
| Last Name<br><br>`last_name`(`ln`) | user_data.address.last_name | eventModel.user_data.address.last_name | Low |
| City<br><br>`city`(`ct`) | user_data.address.city | eventModel.user_data.address.city | Low |
| Zip Code<br>`postal_code`(`zip`) | user_data.address.postal_code | eventModel.user_data.address.postal_code | Low |

## Step 2: GA4 Event – Configure event schema to be delivered to the server

* Configure your web container to send your website data to the created tagging server to add the Google Analytics. [Learn more](https://developers.google.com/tag-platform/tag-manager/server-side/send-data?hl=en#google-analytics-4) about how to configure the [Google Analytics: GA4 Configuration Tag](https://support.google.com/tagmanager/answer/9442095?hl=en#config).

* Add the Google Analytics: GA4 Event Tag to your Workspace from the Template Gallery:
    * Set up an Event Name for the tag. You can set this as a static value or configure it to read from a variable. For certain standard events, Meta maps Google Analytics standard events to Meta equivalents. For these events, you can use either the Google Analytics event name or the Meta event name. For all other standard events, use the Meta event name. For Custom Events, use the name of the Custom Event. [Learn more](https://support.google.com/tagmanager/answer/7679219?hl=en).

| Meta Standard Event Name | Google Analytics Event Name |
| --- | --- |
| AddPaymentInfo | add_payment_info |
| AddToCart | add_to_cart |
| AddToWishlist | add_to_wishlist |
| PageView | gtm.dom |
| PageView | page_view |
| Purchase | purchase |
| Search | search |
| InitiateCheckout | begin_checkout |
| Lead | generate_lead |
| ViewContent | view_item |
| CompleteRegistration | sign_up |

* In the Event Parameters section:

* If you are using the Meta Pixel, add the Event ID parameter. Use event_id as the parameter name, and the variable created for the event ID as the parameter value. Refer to the **Deduplication** section for guidance on creating the Event ID variable, and modifying the Meta Pixel.
* Map each of the parameters you want to configure. The variable name will be read from the event using a common event schema. For example, to set up email as an event parameter, you have to define it as Parameter Name: user_data.email_address and set up the Value as the variable name that reads the email_address (defined earlier in Section 1).
* For a full list, see the [Custom Data Parameters section](#custom-data-params-gtm) below.

## Step 3: Create a listener for the event that fires the event to Meta  

Every GTM server-side container comes with a default GA4 Client for listening to events configured from their GA4 Web Tag. The GA4 Client listens to the /g/collect route on your tagging server URL and sends the _eventModel_ to the downstream tag. If the default GA4 Client is already installed in your server container under the Clients section, you can move to Step 4.

## Step 4: Create the Meta Conversions API tag, a server-side tag that converts the standard event model from GA4 Client to Conversions API event schema and sends it to graph.facebook.com

To send the event to the Conversions API, you need to install the Meta Conversions API Tag from the Template Gallery. The tag template is called **Conversions API Tag** by **facebookincubator**. This tag can be set up to be triggered on events received by the GA4 Client in the previous step and sent to the Conversions API. To install the Meta Conversions API Tag, you will need to have a Pixel ID, access token and specify the action source as "website". By using the Conversions API, you agree that the `action_source` parameter is accurate to the best of your knowledge.

## Testing your integration

Meta recommends using Google Tag Manager's preview mode to test integrations before publishing changes. Both web containers and server containers have preview modes, and you can run both of them at the same time.

**Warning:** If you change your setup while running preview mode, make sure to restart preview mode to ensure the changes are reflected while testing.

You can verify that your server events are received as intended by using the Test Events feature in Events Manager. To find the tool, go to **Events Manager** > **Data Sources** > **Your Pixel** > **Test Events**.

The Test Events tool generates a test ID. Send the test ID as the `test_event_code` parameter in your Conversions API tag to start seeing event activity appear in the Test Events window. Be sure to remove this before publishing any changes.

The test events tool allows you to see if events are being received and deduplicated correctly. If you don't see events show up after a minute or two, check the GTM Server-side debugger to ensure the request went through:

1. In the Server-side debugger, choose the relevant event you want to check in the left hand menu.
2. Confirm your tag is showing under the Tags Fired section. If so, you'll see either Conversions API Tag - Succeeded or Conversions API Tag - Failed.
* **Tag Not Fired**: Review your Conversions API Tag trigger and relevant GA4 event trigger on the web container. Confirm the GA4 Event has fired in the web debugger.
* **Tag Fired: Succeeded**: Click the tag and check the Test Event Code is correct. Update the test event code if required and restart preview mode.
* **Tag Fired: Failed**: Open the Request tab, and click the Outgoing request sent to `https://graph.facebook.com`. Review the Response Body at the bottom of the request details to see what the error was, and update your integration as appropriate. Remember to restart preview mode after making any changes.

Once events are showing, verify that the Event IDs for each event are being sent correctly, and that all expected match keys and custom data parameters are showing correctly. The test event tool will show you if events are being deduplicated correctly. If the Event IDs are different, ensure the GA4 and Meta Pixel tags are firing on the same trigger, and review your Event ID variable implementation.

## Deduplication

Meta recommends that you use a redundant event setup and share the same events from both the Conversions API and your Meta Pixel. Ensure that both events use the identical `event_name` and that either `event_id` or a combination of `external_id` and `fbp` are included.

This will help Meta to deduplicate events and reduce double reporting of identical events. [Learn more about deduplication, when it's necessary and how to set it up](https://developers.facebook.com/documentation/ads-commerce/conversions-api/deduplicate-pixel-and-server-events). [The `external_id` and `fbp`](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/external-id) are alternative solutions for deduplication and help also to improve the quality of setup. Meta recommends including these three parameters whenever possible.

GTM has multiple ways to set up a parameter with the same value across a browser tag and a server tag. One way is to use the same GA4 event as the trigger to fire your Meta Pixel tag and server event. To achieve this:

- Use the same trigger for your Meta Pixel Custom HTML Tag and GA4 Event Tag. For example, you could define a trigger condition based on the order confirmation page URL.

- Use the same `event_id` in both tags:

- Set a unique ID from Client: Set a custom parameter (`x-fb-event_id`) from the gtag event. Generate a unique ID (per event) on the website using a Javascript method (or using Google Tag Manager custom Javascript variable) and set the value in the event as:

```
gtag('event', 'purchase', {
'x-fb-event_id': generateEventId(),
...:...

});
```

You can create a variable that points to the custom Javascript shown above. Whenever the var is referred, the below Javascript is loaded in line:
```
function() {
var gtmData = window.google_tag_manager[{{Container ID}}].dataLayer.get('gtm');
return gtmData.start + '.' + gtmData.uniqueEventId;
}
```

- Create and populate a Data Layer Variable: You can create your own variable on the web container to read the value from `event_id`. You can do this by creating a new Data Layer Variable, for example, FBEventIdVar, with the Data Layer Variable Name as `eventModel.event_id`.

- Once the variable is set, you have the variable to plug into the web event in your custom HTML tag, and the server event as an additional GA4 Event Parameter.

- On the web, you can set up your Meta Tag on Google Tag Manager web containers to read `event_id` from a variable.

```
fbq('track', Purchase, {..}, {eventID: FBEventIDVar });
```

Configure the GA4 Event to send an extra parameter, named `event_id`, set to the `FBEventIdVar` variable.

## Custom data parameters {#custom-data-params-gtm}

To send custom data, use the mappings below in your GA4 Event tags:

| Meta Parameter Name | GA4 Parameter Name |
| --- | --- |
| value | value |
| currency | currency |
| search_string | search_term |
| order_id | transaction_id |
| content_ids | x-fb-cd-content_ids |
| content_type | x-fb-cd-content_type |
| content_name | x-fb-cd-content_name |
| content_category | x-fb-cd-content_category |
| contents* | items OR x-fb-cd-contents |
| num_items | x-fb-cd-num_items |
| predicted_ltv | x-fb-cd-predicted_ltv |
| status | x-fb-cd-status |
| delivery_category | x-fb-cd-delivery_category |
| custom_properties* | custom_properties |

**Warning:** JSON.stringify `x-fb-cd-contents` and `custom_properties` before sending, as these are Meta defined JSON parameters.

## Send data from your website to your GCP server

After configuring your web and server containers, you can send a sample event from your website to verify the server event. A sample event with the configured parameters may look something like this

```
gtag('event', 'purchase',
 {
   'event_id': generateEventId(),
   'transaction_id': 't_12345',
   'currency': 'USD',
   'value': 1.23,
   user_data: {
     email_address: '<HASHED_DATA>',
     phone_number: '<HASHED_DATA>',
     address: {
       first_name: '<HASHED_DATA>',
       last_name: '<HASHED_DATA>',
       city: '<HASHED DATA>',
       region: '<HASHED_DATA>',
       postal_code: '<HASHED_DATA>',
       country: '<HASHED_DATA>'
     },
   },
   items: [
     {
       item_id: '1',
       item_name: 'foo',
       quantity: 5,
       price: 123.45,
       item_category: 'bar',
       item_brand: 'baz'
     }
   ],
 });
```

Once the event is triggered, you should see a request sent to, for example, sample link: www.analytics.example.com/g/collect, with the configured parameters. You can add [test event code](https://developers.facebook.com/documentation/ads-commerce/conversions-api/payload-helper) to the Meta Conversions API Tag to [verify events](https://developers.facebook.com/documentation/ads-commerce/conversions-api/using-the-api#verify) sent to the Conversions API. The test event code should only be used for testing. You need to remove it when sending your production payload.

After you have published your changes, use the [Verifying your setup](https://developers.facebook.com/documentation/ads-commerce/conversions-api/verifying-setup) page here to ensure your events are being sent correctly by checking the following Verifying Setup - Conversions API and review the quality integration is meeting our [best practices](https://developers.facebook.com/documentation/ads-commerce/conversions-api/best-practices).

## Frequently asked questions

**Are there plans to add the capability to send custom parameters? If yes, when will this be available?**  
**A**: Meta has added mapping for most of the Conversions API's standard custom parameters that are supported in GTM's schema. Meta has also provided custom mapping. [See here](https://github.com/facebookincubator/ConversionsAPI-Tag-for-GoogleTagManager/blob/main/template.tpl#L206-L220) for more.

**Is a single server or cluster able to run multiple containers?**  
**A**: Currently, GTM supports only 1:1 mapping. [Read recommendations on how to organize your containers](https://support.google.com/tagmanager/answer/6261285?hl=en).

**Does Server-Side GTM require a browser-based tag to emit events?**  
**A**: Yes

**Is it possible to keep GA4 separately with Server-Side integration?**  
**A**: To keep a separate GA4 and Server-Side GTM integration, you can create an additional Measurement ID in Google Analytics. Create a separate GA4 Configuration tag for Server-Side GTM using this Measurement ID, following the steps above. In this scenario, your existing GA4 Configuration tag will continue to send GA traffic through the Web Container, whereas the new Configuration tag will send data to the Server Container. Create additional GA4 Event tags as per Step 2 to send events server-side, using the new Configuration tag.

**Does the GTM Conversions API integration work with cloud hosting solutions other than GCP?**  
**A**: The GTM Conversions API integration should work with GCP or any other platform of your choosing. [Read more here about manual provisioning](https://developers.google.com/tag-platform/tag-manager/server-side/manual-setup-guide).  

## Learn more
* [Conversions API](https://developers.facebook.com/documentation/ads-commerce/conversions-api)
* [Deduplication for Meta Pixel and Conversions API Events](https://www.facebook.com/business/help/823677331451951?id=1205376682832142)
