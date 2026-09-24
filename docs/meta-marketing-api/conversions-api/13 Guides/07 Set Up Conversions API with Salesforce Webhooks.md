<!-- Source: https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/salesforce-webhooks | Saved: 2026-09-19 -->

# Set Up Conversions API with Salesforce Webhooks



This guide walks Salesforce Sales Cloud CRM users through integrating with Meta's Conversions API using the Salesforce Webhooks partner integration. By completing this setup, lead status changes in Salesforce automatically send conversion events to Meta, enabling the **Conversion Leads** optimization for your lead ads campaigns

**Warning:** **Important**: This guide replaces the [Developer Implementation](https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/crm-integration/3-implementing-the-crm-integration) step of the CRM integration. You do not need to write code, generate access tokens, or build Conversions API payloads manually — Meta handles the transformation from Salesforce webhooks to Conversions API events.

## Prerequisites

Before you begin the Salesforce Webhooks setup, verify you have the following:

| Requirement | How to Complete |
| --- | --- |
| Connect your CRM to download leads | Follow the [guide](https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/crm-integration/1-connecting-your-crm-with-lead-ads) to connect your CRM to Meta and ensure leads are downloading from Meta to Salesforce. |
| Meta lead ID field in Salesforce | Confirm the 15–17 digit Meta lead ID (`leadgen_id`) is stored for each lead. See [How to find the lead ID](https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/how-to-find-the-lead-id). |
| Create a CRM dataset in Meta Events Manager | Follow the [guide](https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/crm-integration/2-getting-started-with-integration) to create a CRM dataset in Events Manager and select **Salesforce Webhooks** as your partner integration in Step 3. |
| Verify Events Manager admin access | * Go to your business account Settings; select **People**<br>* Ensure you have "Full control" for your ad account and business account |
| Verify Salesforce admin access | * In Salesforce setup, go to Users<br>* Verify your profile is System Administrator |

## Select the Salesforce Webhooks Integration

* In Meta Events Manager, go to your CRM dataset and click **Connect Data > CRM**, then click **Next**.
* Under the Partner tab, search for and select **Salesforce Webhooks**.
* Choose your dataset and click **Next**.

* Check whether or not you use the Salesforce Opportunity object to manage leads.

* Choose **Yes** if your sales process converts leads into opportunities in Salesforce and you track deal stages using the Opportunity object. You will need to complete both the Lead setup (Steps 1–3) and the Opportunity setup (Steps 4–6).
* Choose No if you track your entire sales funnel using only lead status values. You only need to complete the Lead setup (Steps 1–3).

## Lead Setup

The Lead setup involves creating a Salesforce outbound message, mapping fields, and building an automation flow.

### Step 1: Create a Lead Outbound Message

Salesforce outbound messages send messages to a designated endpoint whenever an automation flow triggers them. In this step, you configure an outbound message that sends lead data to Meta's webhook endpoint.

* In Salesforce setup, navigate to Outbound Messages (under Process Automation > Workflow Actions). Click on **New Outbound Message** in the 'Outbound Messages' tab.
* Select 'Lead' as the object.
* Provide a 'Name' and 'Unique Name'
* Copy the **Endpoint URL** from the Events Manager setup modal and paste it into Salesforce. This URL is unique to your integration and tells Salesforce where to send the Webhook data.

* Select the Meta lead ID, phone number, email, last modified date, lead status, and converted opportunity ID fields to be sent to Meta in the webhook. If you use standard Salesforce fields, you should  send the following fields.

| Salesforce Field | Maps to Conversions API Parameter | Required? | Description |
| --- | --- | --- | --- |
| `Status` | `event_name` | Yes | The lead's current stage in your sales funnel. |
| `LastModifiedDate` | `event_time` | Yes | When the lead status was created or last updated. |
| `Meta Lead ID` (custom field) | `user_data.lead_id` | Recommended | The 15–17 digit `leadgen_id` from Meta. Highest priority for matching. |
| `Email` | `user_data.em` | Recommended | Hashed automatically by Meta upon receipt. |
| `Phone` | `user_data.ph` | Recommended | Hashed automatically by Meta upon receipt. |
| `ConvertedOpportunityId` | (used to link Leads and Opportunities) | If using Opportunities | Required only if you selected "Yes" to use Opportunities. |

**Warning:** **Tip**: Send as many customer information fields as possible (Meta lead ID, email, phone) to improve event matching accuracy. You must send at least one. See the [Customer Information Parameters](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/customer-information-parameters) documentation for the full list.

* Click **Save**.

### Step 2: Map Lead Fields to Meta Conversions API Fields

After saving the Outbound Message, Meta's setup modal displays a field mapping interface. This step tells Meta how the Salesforce fields you selected correspond to standard Conversions API parameters. For the full list of Conversions API parameters and their descriptions, see the [Payload Specification](https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/payload-specification). Confirm the mapping and click **Next**.

### Step 3: Create a Lead Automation Flow

This flow triggers the Outbound Message whenever a lead's status changes, ensuring Meta receives real-time updates as leads move through your funnel.

* In Salesforce Setup, navigate to **Process Automation > Flows** and click **New Flow**.
* Select **Triggered Automations** under 'Categories'.
* Select **Record-Triggered Flow** under 'Types'.
* Select **Lead** as the Object.
* Under 'Configure Trigger', select **A record is created or updated**.
* Select **Formula Evaluates to True** from the Condition Requirements dropdown under 'Set Entry Conditions'.
* The Meta Events Manager setup modal provides a formula for the trigger condition. Copy this formula and paste it into the 'Formula' field in Salesforce. Click **Check Syntax** to verify it is valid.
    * This formula ensures the flow fires only when a lead's status changes in a way that is relevant to Meta's optimization model.
    * If the syntax check fails, verify you copied the formula exactly as shown in the Meta modal, with no extra whitespace or characters.
* For 'When to run the Flow for Updated Records', Select **Only when a record is updated to meet the condition requirements**.
* Scroll down to the bottom and check **Add Asynchronous Path**

* On the Run Asynchronously path, click the **+** button and select **Action**.
* Search for the outbound message you created in Step 1 and select it.
* Add a Label and API Name for the action (for example, Send_Lead_to_Meta).
* Click **Save**. Enter a Flow Label and Flow API Name (for example, Meta_CRM_Lead_Flow), then click **Save** again.
* Click **Activate** in the top right corner. A confirmation notification will appear.

### Opportunity Setup (Conditional)

Only complete this section if you selected **Yes** to using the Salesforce Opportunity object in the integration setup. If you do not use Opportunities to manage leads, skip to [Testing and Verification](https://developers.facebook.com/docs/marketing-api/conversions-api/guides/salesforce-webhooks#testing-and-verification).

### Step 4: Create an Opportunity Outbound Message

* In Salesforce setup, navigate to Outbound Messages and click **New Outbound Message**.
* Select **Opportunity** as the object.
* Provide a 'Name' and 'Unique Name'.
* Copy the Endpoint URL from the Events Manager setup modal and paste it into Salesforce. **Note**: this will be the same URL as the one used for Leads.
* Select the last-modified date and stage-name fields to be sent to Meta in the Webhook. If you use standard Salesforce fields, you should send the following fields:

| Salesforce Field | Maps to Conversions API Parameter | Required? |
| --- | --- | --- |
| `StageName` | `event_name` | Yes |
| `LastModifiedDate` (or stage change timestamp) | `event_time` | Yes |

* Click **Save**.

### Step 5: Map Opportunity fields to Meta Conversions API fields

* In the Meta Events Manager setup modal, map each Salesforce Opportunity field to the corresponding Meta Conversions API parameter using the table above.
* Confirm the mapping and click **Next**.

### Step 6: Create an Opportunity Automation Flow

Follow the same procedure as Step 3 (Lead Automation Flow), with these differences:

* Select Opportunity as the Object (instead of Lead).
* Use the Opportunity-specific formula provided by the Events Manager setup modal.
* Select the Opportunity outbound message you created in Step 4 as the Action.
* Use descriptive names (for example, Meta_CRM_Opportunity_Flow).
* Activate the flow.

## Testing and Verification

After activating your flow(s), [verify the integration](https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/crm-integration/3-implementing-the-crm-integration#step-3-test-a-payload-optional) is working. **Note**: after completing these steps, it can take up to 20 minutes for Meta to finalize the connection. Once finalized, you can verify your setup.

### Check Salesforce delivery

* In Salesforce setup, go to outbound messages and check the delivery status for your message(s).
* Update a test lead's status to trigger the flow.
* Verify the outbound message shows as **Delivered**. If it shows **Failed**, check:
    * The Endpoint URL is correct and matches what Meta provided.
    * Your Salesforce org can make outbound HTTP requests to the endpoint domain.
    * The formula syntax is valid and the flow is activated.

### Verify Data in Events Manager

* In Events Manager, navigate to your CRM dataset.
* Check the Overview tab for incoming events. Events should appear within an hour of the Webhook firing.
* Open individual events and confirm they include the `lead_event_source` and `event_source` custom parameters. Events without these parameters will not be recognized for Conversion Leads optimization.
* Check the Diagnostics tab for any errors or warnings

### Common Issues

| Symptom | Possible Cause | Resolution |
| --- | --- | --- |
| Outbound message shows as 'Failed' | Endpoint URL is incorrect, unreachable, or the token stored in the Endpoint URL is invalid. | Navigate to Dataset Settings in Events Manager; scroll down to Webhooks Settings. Verify the token is valid. If the token is invalid, re-copy the Endpoint URL. Check Salesforce network/firewall settings. |
| No events in Events Manager | Flow is not activated, or entry conditions not met. | Verify the flow is active. Update a lead's status and check if the flow triggers. |
| Low lead coverage in Events Manager | Not sending Meta Lead ID, or not sending the initial lead stage. | Include the Meta Lead ID field. Send all lead stages, including the initial "raw lead" event (the event that represents all leads generated on Meta and downloaded into your CRM.). |
| Formula syntax check fails | Formula copied incorrectly | Re-copy the formula from the Meta Events Manager modal. Remove any extra whitespace or line breaks. |

## Next Steps

After confirming your webhooks are delivering data to Meta:

1. [Verify your data](https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/crm-integration/4-verify-your-data) — Wait for Meta to validate your integration. A green check will appear next to the 'Send a CRM event' step when a valid event is detected
2. [Follow-up steps](https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/crm-integration/6-follow-up-steps) — Allow 2–4 weeks for the learning phase. Share the Meta Pixel with your ad accounts.

For guidance on which conversion event to optimize for, see [Choosing the right conversion event](https://www.facebook.com/business/help/867613249320005).

## Related Resources

* [Conversion Leads Payload Specification](https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/payload-specification)
* [How to find the Meta lead ID](https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/how-to-find-the-lead-id)
* [Customer Information Parameters](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/customer-information-parameters)
* [Conversion Leads FAQs](https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/faq)
* [Business Help Center article: Set up your CRM for conversion leads ](https://www.facebook.com/business/help/279369167153556?id=735435806665862)
