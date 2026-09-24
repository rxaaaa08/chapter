<!-- Source: https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/zapier/step-2-verify-integration | Saved: 2026-09-19 -->

# "Step 2: Verify your integration"



- **Note**: there's usually a 30-minute waiting period for events to show up in Meta Events Manager.

- On the data source overview page, you see the CRM life cycle. It confirms that you have connected your CRM with Zapier and shows the next step.

- Events typically appear within 30 minutes. Meta displays each event in the **Events** table with the **Conversions API** connection method once your integration sends it.

- Open each event sent for the Conversion Leads Optimization in Events Manager and check that they have the custom parameters `lead_event_source` and `event_source` populated. If the event does not have these parameters, the event will not get registered as a conversion leads event.

- In **Events Detail**, click the **View details** button. In the **Event Quality** tab, you find the Event Match Quality, which shows events' match status. You see which personally identifiable information (PII) Meta receives and the match percentage for each event.

**Note**: CRM quality is measured over a 24-48 hour period. If your scores aren't visible, it may be because no valid events were received during this timeframe or they were discarded due to data policies or regulations.

