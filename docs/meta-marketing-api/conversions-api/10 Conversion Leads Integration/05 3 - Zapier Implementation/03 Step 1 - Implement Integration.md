<!-- Source: https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/zapier/step-1-implement-integration | Saved: 2026-09-19 -->

# "Step 1: Implement Conversion Leads Integration"



Follow the [2: Getting Started With the CRM Integration guide](https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/crm-integration/2-getting-started-with-integration) to start the Zapier integration. Return to this step once that is complete.

- Zapier redirects you to a template for your selected CRM. If your CRM does not have a template, create a new Zap from scratch.

- This guide assumes you create the Zap from scratch to cover all steps.

Choose your CRM app as the first app (trigger). Choose the **Facebook Conversions** app and **Send Funnel Event** action as the second app (action).

- You will need to create Zap(s) for when:

- New leads are added to your CRM from Meta.

- Leads status change and progress further into your sales process.

- In this example, this Zap sends a funnel event from HubSpot to Meta whenever a contact's status changes. This Zap sends event updates when the lead status changes. Later, you will need to create a second Zap to send events when new leads are added to your CRM.

- First, set up the **trigger** app (HubSpot, in this case). During the setup steps, ensure you select the appropriate CRM and trigger events, and connect your CRM account to Zapier. In this example, choose the New Contact Property Change event to send an event when the property changes.

- Then, click **Continue**, select the property that will trigger Zapier to send an event when the property changes. In this HubSpot example, Zapier will send an event when the Lifecycle Stage property changes in HubSpot.

Zapier will only integrate a select number of properties by default for some CRMs. You may add additional properties to integrate if the default selection does not include all relevant properties. 

In this example, because you stored the Facebook lead ID in your manually added properties in HubSpot, you can retrieve it through additional properties.

- In the action app, ensure that the Facebook Conversion app and **Send Funnel Event** action event are chosen, and connect your Facebook account.

- Click **Continue**, connect your Facebook account and choose your CRM pixel (data source).

- Fill in all fields in the **Set up action** section of the **action** app.

- **Time of customer event** — A Unix timestamp that represents when this event has been updated in your CRM. If you cannot find an applicable field in your CRM, you can leave this parameter empty and Zapier will use the upload time.

- **Stage in Sales Process** — Refers to a lead moving through the sales funnel in your CRM. Make sure to send all stages as they are updated, including the initial raw lead stage. Use HubSpot's **Lifecycle Stage** property to represent this.

For example, your funnel could look like this:

- Raw Lead from Meta

- Marketing Qualified Lead

- Sales Opportunity

- Customer

If a lead reaches the final **Customer** stage, then the previous 3 stages should have been sent as they occurred.

- **CRM you use** — The name of your CRM. This could be a static text like "HubSpot".

- **Customer information parameter** — The field containing the customer information parameter for your downloaded leads. Send as many parameters as possible for better ad performance.

- **Facebook Lead ID** — Meta recommends sending the Facebook lead ID for best performance. Note that in the case of HubSpot, **there is no Facebook lead ID** field by default. However, because you retrieved the additional property of lead ID in step 6, you can map it to the Facebook lead ID field. Refer to the
[How to Find the Meta Lead ID](https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/how-to-find-the-lead-id) documentation.

- Review the Zap to verify the correct data is pulled into the parameters. If everything appears correct, send a test event to Meta by clicking the **test** button.

Publish the Zap to begin sending events if the test is successful.

- Repeat from Step 3 above if you need to create additional Zaps for when:

- New leads are added to your CRM from Meta.

- Leads status change and progress further into your sales process.

- If you receive the Sample error 1 below, you either can choose to connect Zapier using the Meta Events Manager onboarding flow (see [this Business Help Center article](https://www.facebook.com/business/help/571704773472628) for more). Or, if you prefer, you can connect from the Zapier side by opening the data source permission:

**Datasource** -> **Setting** -> **Conversions API** -> **Choose a partner** -> **Zapier** -> **Turn on permission**

Sample error 1

Steps to follow to resolve error:

Sample error 2

**Error** - No customer information parameter, or a combination of customer information parameters that is too broad.

Make sure at least one customer information parameter is selected on the mapping sessions. 

Also, if you choose to use the field mapping features, make sure the field has actual data attached to pass the test action. Screenshots below show error field mapping versus correct field mapping.

