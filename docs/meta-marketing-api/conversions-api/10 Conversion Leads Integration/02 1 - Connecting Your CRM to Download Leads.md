<!-- Source: https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/crm-integration/1-connecting-your-crm-with-lead-ads | Saved: 2026-09-19 -->

# "1: Connecting Your CRM to Download Leads"



This guide helps you connect your customer relationship management (CRM) system and ensure it is downloading your leads from Meta.

## Connect your CRM to Meta

As mentioned in the [introduction](https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration), this guide assumes that you already have an integration to automatically download your leads from Meta to your CRM system (highlighted in green in the figure below). This section will provide an overview of the Meta to CRM integration methods for Lead Ads. For each of these integration methods, ensure that the 15–17 digit Meta Lead ID is included in the downloaded data. Refer to [About CRM System Integrations for Lead Ads](https://www.facebook.com/business/help/301355140655035) for more information.

### Partner integrations

Learn how to [integrate your CRM with Meta](https://www.facebook.com/business/help/908902042493104) to optimize the quality of your lead ads.

Partner integrations are a good method to download your lead data if your CRM system or third-party vendor is supported. You can check if your preferred partner is supported by searching the [Available CRM System Integrations for Lead Ads](https://www.facebook.com/business/help/908902042493104) help center article.

- Follow the directions in the [Available CRM System Integrations for Lead Ads](https://www.facebook.com/business/help/908902042493104) help center article or the general directions in the [Connect Your CRM System to Facebook](https://www.facebook.com/business/help/1588743581429919) help center article.

- If you decide to remove or change partner integrations for any reason, follow the directions in the [Remove Your CRM System Integration from Facebook](https://www.facebook.com/business/help/776203092784009) help center article.

### Webhooks custom integration

You may also create a custom Webhooks integration to automatically receive new leads if your CRM system is not supported or you would prefer more control over the integration. This method requires developer resources.

This method requires your developer to create a Webhook endpoint, a Meta developer app ID, and a subscription to your app, then link the app to your Page.

Refer to the [Webhooks CRM integration guide](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lead-ads/quickstart/webhooks-integration) for more information on implementing this method. You can also refer to the [Lead Ads Webhook code sample](https://github.com/fbsamples/lead-ads-webhook-sample) on GitHub to get started.

### Graph API bulk read

Similarly as with Webhooks, you can use the Graph API to download leads from Meta. This method requires developer resources.

The main difference between the two integrations is that Webhooks is a push/pull method that can give you leads close to real time, whereas the Graph API bulk read is a pull method that will give you lead data upon a call from your code. There are also [rate limits](https://developers.facebook.com/docs/graph-api/overview/rate-limiting) for these API calls.

Refer to the [Retrieving Leads: Bulk Read](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lead-ads/retrieving#bulk-read) documentation for more information on implementing this method.

### Manual download (not recommended)

This method is not recommended, especially if you have a CRM system and are intending to implement a CRM integration to upload events. However, use this method as a temporary solution if any of the previous methods have issues.
