<!-- Source: https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/zapier/prerequisites | Saved: 2026-09-19 -->

# Prerequisites



- The Conversion Leads integration assumes that you are already downloading your leads and storing the Meta Lead ID in your CRM. This section will provide an overview of how to download leads with Zapier and store the Lead ID.

If you are already downloading Meta leads and storing the Lead ID in your CRM, skip to [Step 1: Implement Conversion Leads Integration](https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/zapier/step-1-implement-integration).

- Log into Zapier and create a new Zap using **Facebook Lead Ads** as the trigger app and your CRM as the action app.

In this example, you create a new Contact in Hubspot when a new lead on Facebook is generated.

- Connect your Meta ad account to Zapier, then select the applicable page and lead forms when prompted.

- The Lead ID will be stored in the **id** field of the lead. You will be able to see this in a test trigger where Zapier pulls in a lead from Meta.

- In the Zapier action app, store the Lead ID by mapping it to the standard Lead ID field in your CRM, or a custom field if it does not exist. In this example, you map the Lead ID to the **Facebook Lead ID** field in Hubspot, which is a custom field you create in Hubspot.

