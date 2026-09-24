<!-- Source: https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/crm-integration/4-verify-your-data | Saved: 2026-09-19 -->

# "4: Verify Your Data"



There are two phases of data validation:

1. **Connect your CRM** phase
2. **Configure your sales funnel** phase

## Connect your CRM phase

- After connecting to the Conversions API, refer to the Overview tab of your dataset in Meta Events Manager for integration status.

- Send at least one valid event from your integration. An event is valid when it has a proper payload, is sent through your CRM using the Conversions API, and can be attributed to a lead.

## Configure your sales funnel phase

By configuring your funnel, you enable Meta to analyze and optimize your funnel's performance, ultimately driving better results for your lead campaigns. To achieve this, the data shared with Meta must meet some requirements.

- After sending all events, refer to the Overview tab of your dataset in Events Manager for integration status. You will be able to configure your funnel. Configuring your funnel helps Meta understand the data sent and perform deep analysis based on the fulfilment of the data requirements. Please refer to the [Configure your sales funnel](https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/crm-integration/5-configure-your-sales-funnel) document to learn more.

- The data sent to Meta must satisfy these requirements:

- Maintain a running lead campaign generating 200 leads per month.

- Your Lead Coverage is at least 60%. Lead Coverage is defined as the percentage of leads that have matching events uploaded to Meta. The best way to increase your Lead Coverage is to include the Meta Lead ID in your payload and upload the raw lead event that represents all leads generated on Meta and downloaded into your CRM. You may view your current Lead Coverage by clicking the **View Reports** button in the **Settings** tab of your CRM pixel.

- Data has all the required parameters and is in the correct format. Refer to the Payload Specification section for more details.

**Note**: If the system detects any errors in your integration, you will see them in the **Settings** tab of your CRM pixel. You can also find errors listed in the **Diagnostics** tab along with instructions on how to fix them.

