<!-- Source: https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration | Saved: 2026-09-19 -->

# Conversions API for CRM Integration



You may already have Meta's [Conversions API](https://developers.facebook.com/documentation/ads-commerce/conversions-api) set up for your business to upload server events for your web traffic. If you are using Facebook/Instagram to generate leads for your business to convert into a sale, you can also use the Conversions API to upload offline events from your customer relationship management (CRM) system. This is a separate integration from your current Conversions API setup because the required parameters are different and the data comes from your CRM system rather than your web servers.

Integrating your CRM and using the Conversion Leads performance goal may yield higher quality leads that are more likely to convert. The Conversion Leads performance goal is currently only compatible with Facebook/Instagram's Lead Ads (Instant Forms).

You should already have an integration established to download leads from Meta to your CRM (highlighted in green in the figure below). This CRM integration guide walks you through the process to send down funnel event data from your CRM back to Meta (highlighted in red in the figure below).

## Check if your business is a good fit

Before you begin working on the Conversions API for CRM integration, you should check if your business will be a good fit for the optimization model. Below are some guidelines to meet for integrations.

* Use Facebook/Instagram Lead Ads (Instant Forms)
* For best results, ensure you have the 15-17 digit Meta Lead ID stored in your CRM. Sending lead IDs for each event is recommended. If you don't have one, send customer parameters like click ID, phone number or email
* Generate at least 200 leads per month
* Can upload data regularly at least once per day
* The lead stage you want to optimize for occurs within 28 days of leads being generated
* The lead stage you want to optimize for has a conversion rate between 1% - 40%.

## Plan your project timeline

If you believe your business is a good fit for the optimization, you may use this estimated timeline to plan the project. Estimated time to value for the project is 1 month based on historical data. However, the actual timeline can vary for all advertisers. The timeline is contingent on available resources to make decisions and address problems with the integration.

| Section | Description | Task Owner | Est. Time Duration |
| --- | --- | --- | --- |
| [**1: Connecting Your CRM With Lead Ads**](https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/crm-integration/1-connecting-your-crm-with-lead-ads) | Automatically download leads from Facebook | Advertiser | Prerequisite |
| [**2: Getting Started With the CRM Integration**](https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/crm-integration/2-getting-started-with-integration) | Create or choose a Meta Pixel for CRM events | Advertiser | < 1 day |
| [**3: Implementing the CRM Integration**](https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/crm-integration/3-implementing-the-crm-integration) (Developer) | Connect your CRM via the Conversions API | Advertiser | Meta Business Partner < 1 day<br><br>Custom 3-4 weeks﹡ |
| [**4: Verify your data**](https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/crm-integration/4-verify-your-data) (No advertiser action required) | Wait for data validation | Meta | ~1-2 days |
| [**5: Configure Your Sales Funnel**](https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/crm-integration/5-configure-your-sales-funnel) | Configure sales funnel events within your CRM | Advertiser | < 1 day |
| [**6: Learning Phase**](https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/crm-integration/6-follow-up-steps) (No advertiser action required) | Wait for funnel analysis and training period ﹡﹡ | Meta | 2-4 weeks |
| — | Run fully optimized Conversions Lead Optimization campaigns | Advertiser |  |
|  | **Total time to value** |  | ~3-4 weeks |

﹡ Time duration for this step can be reduced by using a partner integration.  
﹡﹡ You may run Conversions Lead performance campaigns during the training period, but will not benefit from the full performance lift until it is complete.

## Roles and responsibilities

Outlined below are the roles that will need to be involved in the project. Note that some roles may be consolidated or separated depending on your organization.

| Role | Responsibilities |
| --- | --- |
| Marketing and Sales Team | * Generally the role that initiates the project and identifies the personnel in the organization needed to complete the integration.<br>* Have intimate knowledge of the marketing and sales process to define the funnel.<br>* Have necessary permissions to perform tasks in Meta's Ads Manager and Events Manager.<br>* Build the integration between your CRM and Meta, if proceeding with a **partner integration**, such as [Zapier](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/zapier-integration). |
| CRM Admin | * Have intimate knowledge of the CRM's fields and its capabilities.<br>* Create new custom fields and flows within CRM, if needed.<br>* Support marketer and developer throughout the integration. |
| Developer | * Build the integration between your CRM and Meta, if proceeding with the **manual integration**.<br>* Ensure the manual integration is functioning correctly. |

