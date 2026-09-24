<!-- Source: https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/crm-integration/5-configure-your-sales-funnel | Saved: 2026-09-19 -->

# "5: Configure Your Sales Funnel"



This guide will walk you through the sales funnel configuration, which will inform the system about your sales funnel and which lead stage to optimize on. You must have admin access to complete this section.

**Step 1**. After connecting to the Conversions API, refer to the Overview tab of your dataset in Events Manager for integration status. A CRM integration widget will now display your integration status and provide guidance throughout the process, including notification when complete.

**Step 2**. When your CRM data passes verification checks, you can configure your sales funnel.

**Step 3**. If you share an adequate number of event stages, Meta may use AI to generate a sales funnel for you. You can then review, edit, and confirm the stages to proceed.

**Step 4**. Lead events shared from your CRM will show up as funnel stages in Events Manager. Remove events that don't belong and arrange the rest to reflect the order of your sales funnel, using two categories.

* _Positive stages_: Events that signify a quality lead, for example, 'marketing qualified lead', 'add to cart'.
* _Other stages_: Events that do not signify a quality lead, for example, test events or events accidentally uploaded from another system.
    * Remove events that indicate a negative lead or do not belong in your sales funnel by clicking the minus (-) button next to each event. These could be leads that received a phone call, but decided to not convert into a sale.

**Step 5**. In the same step, order your events to reflect the actual order of your sales funnel.

**Step 6**. In the Optimization Target step, select the earliest lead stage you would like to optimize for. This does not need to be the last stage of the funnel. The system will optimize for all down-funnel stages as well.

**Note**: The system may adjust and optimize for a different lead stage than the one selected if better performance can be achieved.
