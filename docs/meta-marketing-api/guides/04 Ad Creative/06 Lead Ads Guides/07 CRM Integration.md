<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lead-ads/quickstart/webhooks-integration | Saved: 2026-09-19 -->

# Meta Webhooks for Lead Ads for Customer Relationship Management



This guide shows you how to implement Meta Webhooks for Lead Ads for Customer Relationship Management integration.

## Overview

An app user logs in to your app using Facebook Login and grants your app the permissions for their Facebook Page that is subscribed to Meta Webhooks for leads. Facebook Login returns a Page access token with the required scopes that allow the app user to view the lead notifications sent to your server from Meta.

## Before you start

You will need:

* [A Meta App ID](https://developers.facebook.com/docs/development/create-an-app)
* A Page access token from an app user, client, or advertiser, who can perform the [`ADVERTISE` task on the Page](https://developers.facebook.com/docs/pages/overview/permissions-features#tasks)
* The following permissions:
    * `pages_read_engagement`
    * `pages_manage_metadata`
    * `pages_show_list`
    * `ads_management`
    * `lead_retrieval`
* [Web server with an endpoint to receive Meta Webhooks](https://developers.facebook.com/docs/graph-api/webhooks/getting-started)
* [A subscription to the leadgen webhook](https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-leadgen)
* [Facebook JavaScript SDK](https://developers.facebook.com/docs/javascript/quickstart) added to your app
* [Facebook Login](https://developers.facebook.com/documentation/facebook-login) added to your app

**Success:** The following content is taken from [/docs/graph-api/webhooks/getting-started/webhooks-for-leadgen](https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-leadgen).

## Webhooks for Leads

Webhooks for Leads can send you real-time notifications of changes to your [Page's Lead ads](https://developers.facebook.com/docs/graph-api/webhooks/reference/page#leadgen). For example, you can receive real-time updates whenever users click on a lead ad.

First, set up a Page Webhook:

1. [Set up your endpoint and configure the Webhooks product](#set-up-endpoint-and-product).
1. [Install your app](#install-app) using your Facebook page.

## Setting Up Your Endpoint and Webhook Product {#set-up-endpoint-and-product}

Follow our [Getting Started guide](https://developers.facebook.com/docs/graph-api/webhooks/getting-started) to create your endpoint and configure the Webhooks product. During configuration, make sure to choose the **Page** object and subscribe to the **leadgen** field.

## Install Your App {#install-app}

Webhook notifications will only be sent if your Page has installed your Webhooks configured-app, and if the Page has not disabled the **App** platform in its [App Settings](https://www.facebook.com/settings?tab=applications). To get your Page to install the app, have your app send a `POST` request to the Page's [subscribed_apps](https://developers.facebook.com/docs/graph-api/reference/page/subscribed_apps) edge using the Page's acccess token.

### Requirements

* A Page access token requested from a person who can perform the [ADVERTISE task](https://developers.facebook.com/docs/pages/overview#tasks) on the Page being queried
* The following [permissions](https://developers.facebook.com/docs/permissions):
    * `leads_retrieval`
    * `pages_manage_metadata`
    * `pages_show_list`
    * `pages_read_engagement`
    * `ads_management`

#### Sample Request

*Formatted for clarity*

```
curl -i -X POST "https://graph.facebook.com/{page-id}/subscribed_apps
  ?subscribed_fields=leadgen
  &access_token={page-access-token}"
```

#### Sample Response

```js
{
  "success": "true"
}
```

To see which app's your Page has installed, send a `GET` request instead:

#### Sample Request

*Formatted for clarity*

```curl
curl -i -X GET "https://graph.facebook.com/{page-id}/subscribed_apps
  ?access_token={page-access-token}
```

#### Sample Response

```js
{
  "data": [
    {
      "category": "Business",
      "link": "https://my-clever-domain-name.com/app",
      "name": "My Sample App",
      "id": "{page-id}"
    }
  ]
}
```

If your Page has not installed any apps, the API will return an empty data set.

#### Graph API Explorer

If you don't want to install your app programmatically, you can easily do it with the [Graph API Explorer](https://developers.facebook.com/tools/explorer) instead:

1. Select your app in the **Application** dropdown menu. This will return your app's access token.
1. Click the **Get Token** dropdown and select **Get User Access Token**, then choose the `pages_manage_metadata` permission. This will exchange your app token for a User access token with the `pages_manage_metadata` permission granted.
1. Click **Get Token** again and select your Page. This will exchange your User access token for a Page access token.
1. Change the operation method by clicking the `GET` dropdown menu and selecting `POST`.
1. Replace the default `me?fields=id,name` query with the Page's **id** followed by `/subscribed_apps?subscribed_fields=leadgen`, then submit the query.  

## Common Uses {#common-uses}

### Getting Page LeadGen Details

Your app can subscribe to a Page's Leads and get notified anytime a change occurs. For example, here's a notification sent when a User clicked on a lead ad.

#### Sample Webhook Response

```js
{
   "object": "page",
   "entry": [
       {
           "id": 153125381133,
           "time": 1438292065,
           "changes": [
               {
                   "field": "leadgen",
                   "value": {
                       "leadgen_id": 123123123123,
                       "page_id": 123123123,
                       "form_id": 12312312312,
                       "adgroup_id": 12312312312,
                       "ad_id": 12312312312,
                       "created_time": 1440120384
                   }
               },
               {
                   "field": "leadgen",
                   "value": {
                       "leadgen_id": 123123123124,
                       "page_id": 123123123,
                       "form_id": 12312312312,
                       "adgroup_id": 12312312312,
                       "ad_id": 12312312312,
                       "created_time": 1440120384
                   }
               }
           ]
       }
   ]
}
```

## See Also

* Visit our [Lead Ads Retrieval guide](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lead-ads/retrieving) to learn how to use the `leadgen_id` from the notification to retrieve data associated with the leads.

