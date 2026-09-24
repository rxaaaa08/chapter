<!-- Source: https://developers.facebook.com/documentation/ads-commerce/conversions-api/set-up-conversions-api-as-a-platform | Saved: 2026-09-19 -->

# Set up Conversions API as a Platform


**Warning:** **Ads Management Standard Access is now Marketing API Access Tier**

**No code changes are needed.**

Tier labels have been updated: "Standard Access" is now **Limited Access**, and "Advanced Access" is now **Full Access**. The revised qualification threshold for Full Access has been reduced from 1,500 to **500 Marketing API calls** in the past 15 days. The underlying permission identifier remains the same, and existing access levels are preserved automatically. Learn more in the [Marketing API Access Tier documentation](https://developers.facebook.com/docs/features-reference#marketing-api-access-tier).

If you offer Meta Pixel setup as part of your tag management services, you may want to consider adding Conversions API functionalities. Integration with the Conversions API allows your customers to send web events to Meta directly, without having to rely on browser pixel events.

## Server Events vs Browser Events

Before starting, it is important to understand the relationship between server events and the [Meta Pixel](https://developers.facebook.com/docs/facebook-pixel). Server events are sent via the Conversions API and used in measurement, reporting, and optimization in the same way as browser pixel events.

If sending browser pixel events is like sending mail via airmail, then sending server events is like sending mail via freight. They are both mechanisms to transport the package (data about an event) to a destination address (a pixel ID). So, we highly recommend that you build the Conversions API integration on your platform as an extension of your current Meta Pixel offering (instead of a separate plugin or service) for the following reasons:

* Server events use pixel ID as the destination
* Server events are processed the same way browser pixel events are once sent to Facebook
* [Deduplication](https://developers.facebook.com/documentation/ads-commerce/conversions-api/deduplicate-pixel-and-server-events) will be easier to implement
* Ease of use for clients. For example, server events can be sent alongside browser events, by default.

Once your platform is integrated with the Conversions API, we recommend sending the same web events via browser and server. This redundancy helps ensure signal reliability. Events that previously could have been lost on the browser side, for a variety of network reasons, are now captured via the Conversions API.

To send events via browser and server, you must correctly set the same `event_id` for corresponding events. This allows Facebook to properly [deduplicate](https://developers.facebook.com/documentation/ads-commerce/conversions-api/deduplicate-pixel-and-server-events) your events.

## Prerequisites

1. A web platform able to share events to Facebook. For example, website builder, tag manager, or AdTech platform.
2. Appropriate notice to and consent from your users for the sharing of event data with Facebook, as required by the Facebook Business Tools Terms.
3. A Facebook representative
4. The [standard Conversions API integration prerequisites](https://developers.facebook.com/documentation/ads-commerce/conversions-api/get-started#requirements):
- [Business Manager](https://business.facebook.com/)
- A [Meta app](https://developers.facebook.com/apps)
- [Meta Pixel](https://developers.facebook.com/docs/facebook-pixel)
- An [access token](https://developers.facebook.com/documentation/ads-commerce/conversions-api/get-started#access-token)

**Warning:** To start offering Conversions API as a platform, your app needs to go through [App Review](https://developers.facebook.com/docs/apps/review). During that process, you must request following access level, feature and permissions:

- Access Level: [Advanced Access](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/authorization#access-levels)
- Feature: [Marketing API Access Tier](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/authorization)
- Permissions: `ads_management`, `pages_read_engagement`, and `ads_read`

## Get Started

If this is your first time using the Conversions API, follow these steps to create a Business, Meta app, Meta Pixel, and system user. Then, you will be able to use your system user's access token to send server events via the Conversions API.

### Step 1: [Create a business](https://www.facebook.com/business/help/1710077379203657?id=180505742745347).

### Step 2: [Create a Meta app under your newly created business](https://developers.facebook.com/apps).

### Step 3: Create a Meta Pixel under your newly created business:

* Go to [Events Manager](https://business.facebook.com/events_manager).
* Select **Add New Data Source**.

### Step 4: [Generate a system user access token](https://developers.facebook.com/documentation/ads-commerce/conversions-api/get-started#access-token).

### Step 5: [Send a server event to your Meta Pixel](https://developers.facebook.com/documentation/ads-commerce/conversions-api/using-the-api).

## Send Events On Behalf of Clients

Once you have successfully sent a server event to your own Meta Pixel, you have options on how to send events on behalf of your clients.

### For Meta Pixels owned or managed by the partner's Business Manager

1. In **Business Manager**, go to the **Users** section and select the **System User** tab. Click on the specific system user you are using for Conversions API.
2. Go to the **Assign Asset** dialog and choose **Pixels**. Then, select the pixels for which you want to send events on behalf of.
3. For each pixel, select the **Manage Pixel** permission, and click **Save Changes**.
4. Go back to your system user's details page. Verify that the selected pixels are visible there.

### For Meta Pixels not managed by the partner

You must first request authorization to send events on behalf of your clients. You have the following authentication options:

#### Facebook Business Extension (Recommended)

With this option, [Facebook Business Extension](https://developers.facebook.com/docs/facebook-business-extension) (FBE) returns all the necessary information needed to send events on behalf of the client via the following process. FBE provides an endpoint to retrieve system user access tokens created in the client's Business Manager. This process includes permissions to send server events and is done automatically and in a secured way.

The endpoint requires a user access token as an input parameter. For new FBE users, call this endpoint to fetch the system user access token after you finish setting up the FBE. Existing users need to ask for re-authentication before calling the new API endpoint.

#### Client System User Access Token

With this option, you must have your client manually create a system user access token via the Conversions API inside the **Pixel Settings**. You can then send events to the advertiser's pixel with that token.

A system user or an admin system user must install the app that will be used to generate the access token. With this setup, your app is allowed to call APIs on behalf of this system user or admin system user.

Follow our [Get Started](https://developers.facebook.com/documentation/ads-commerce/conversions-api/get-started#access-token) documentation and request a system's user token from your advertiser. Remember to use your own Meta Pixel and access token for testing.

#### Client Sharing of a Meta Pixel to Partner's Business Manager

With this option, the client shares their Meta Pixel to the partner via Business Manager settings or [via the API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/shared_accounts). Then, you can assign the partner system user to the client pixel and [generate an access token to send server events](https://developers.facebook.com/documentation/ads-commerce/conversions-api/set-up-conversions-api-as-a-platform#get-started).

## Attribute Events to Your Platform Using the `partner_agent` Field

To attribute Conversions API events to your platform, use the `partner_agent` field. This allows you to set your own platform identifier when sending events on behalf of a client. Work with your Facebook Representative to agree on an identifier for your platform. Then, send it with each server event.

#### Sample event payload

If your platform identifier is `datapartner`, this would be a sample purchase event payload sent on behalf of your client:

```
{
  "data": [
    {
      "user_data": {
        "em": "8159ea0e33c51a774b83104ee562784f9b1836c852102046e4bd8385706fe7ca"
      },
      "event_name": "PageView",
      "event_time": 1579645238
    },
    {
      "user_data": {
        "em": "8159ea0e33c51a774b83104ee562784f9b1836c852102046e4bd8385706fe7ca"
      },
      "custom_data": {
        "currency": "USD",
        "value": "50"
      },
      "event_name": "Purchase",
      "event_time": 1579645238
    }
  ],
  "partner_agent": "datapartner"
}
```

## Frequently Asked Questions

**Why should we make the effort to integrate with the Conversions API if we already support the Meta Pixel?**

Sending events sent via the Conversions API is just like sending events via the Meta Pixel. The only difference is that the event is sent via the server, instead of the browser. So, why make an effort to integrate with the Conversions API?  Here are some important use cases:

#### Capture offline and down-funnel events

If someone uses an advertisers’ website to sign up for a credit card, they can send events such as ViewContent, Application Start, and Application Submit via the browser to the Meta Pixel. However, the end user still needs to be approved for this credit card. The Approval event happens offline and cannot be sent via browser. To register this final step, the advertiser can send the Approval via the Conversions API.

#### Signal resiliency

Browser side events can be lost for many reasons:

* The user might navigate away before the page has finished loading.
* Ad blockers could prevent the event from firing.
* The changing internet landscape might change the way inter-domain messages are sent.

These examples can all be mitigated by sending events via the Conversions API.

#### Sensitive data

Many advertisers have expressed concerns about sharing data via the browser when that data could be seen or inspected. This can be mitigated by sending data via the Conversions API.

For example, advertisers may want to send data like profit margin or lifetime value (LTV) along with a `purchase` event. This way, ads can be optimized towards a specific type of customer.

**As a platform, which of my data sources should support integration with the Conversions API?**

Since browser events are always vulnerable to obstacles, we recommend that you only send events collected from the Conversions API sources. For example, if:

* One of the ways your customer ingests data into your platform is via a browser JavaScript tag, or
* You send that data to Meta via the Conversions API

the data is open to the browser-side risks.

To take full advantage of the Conversions API, no part of the data flow should be reliant on the browser.

**How can an advertiser tell if the connection to their Meta Pixel was successful?**

We recommend that you provide advertisers with a way to test this connection on your own platform.

1. Send a test event via the Conversions API to the advertiser’s pixel. Look for a `200` return code.
2. Update the status of the connection appropriately.

**Will events sent by browser and Conversions API to a Meta Pixel be counted twice?**

Meta tries to deduplicate identical events sent through the Meta Pixel and the Conversions API. We determine if events are identical based on their `event_id` and `event_name`. For more information, see [Handling Duplicate Pixel and Conversions API Events](https://developers.facebook.com/documentation/ads-commerce/conversions-api/deduplicate-pixel-and-server-events).

**What is the external_id parameter and how is it used?**

The [`external_id` parameter](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/customer-information-parameters#external-id) is a string that represents a user on an advertiser's system. These IDs help improve ads attribution and create audiences.

You can send `external_id`s via browser or the Conversions API, but you must be consistent across channels. For example, if you send a browser pixel event with `external_id` set to `123`, your server event for that same user should also have `external_id` set to `123`.

