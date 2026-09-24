<!-- Source: https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/how-to-find-the-lead-id | Saved: 2026-09-19 -->

# How to Find the Meta Lead ID



The `lead_id` is a mandatory field used in the Conversion Leads CRM integration which uploads events back to Meta to help optimize for higher quality leads, as detailed in the [payload specification](https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration). It is a unique 15-17 digit number assigned to leads generated on Meta and may be presented in different fields depending on how you download the lead. This section will provide some examples of where the Meta Lead ID may be located for common lead download methods, so you can store it in your CRM and later use it to upload events back to Meta.

**Warning:** The Meta Lead ID must be mapped to a field in your CRM before you can use it to upload events back to Meta.

## Webhook or Graph API bulk read

The Meta Lead ID is stored in the `id` field of the lead node if you download leads using a Webhook or the Graph API.

You may also obtain the Meta Lead ID from the `leadgen_id` field in the leadgen Webhook response.

Refer to the [Webhooks CRM Integration guide](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lead-ads/quickstart/webhooks-integration) and [Bulk Read developers guide](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lead-ads/retrieving#bulk-read) for more information on these integrations.

## Partner integrations

### Zapier

The Meta Lead ID will be stored in the **id** field when downloading leads using Zapier's Facebook Lead Ads trigger app. You will be able to see the Meta Lead ID first in a test trigger where Zapier pulls in a lead from Meta.

In the Zapier action app, store the Meta Lead ID by mapping it to the standard Lead ID field in your CRM or a custom field if it does not exist.

### LeadsBridge

The Meta Lead ID will be stored in the **id** field when downloading leads using LeadsBridge's Facebook Lead Ads app. In the **Fields Mapping** section, store the Meta Lead ID by mapping it to the standard Lead ID field in your CRM or a custom field if it does not exist.

### Make (Integromat)

The Meta Lead ID will be stored in the **Lead ID** field when downloading leads using Make's Facebook Lead Ads scenario. In the **Properties** section, store the Meta Lead ID by mapping it to the standard Lead ID field in your CRM or a custom field if it does not exist.

## Direct CRM integrations

### Salesforce - Leads Capture

The Meta Lead ID will be stored in the **Lead ID** field when downloading leads using the [Salesforce Advertising Studio's Lead Capture feature](https://help.salesforce.com/s/articleView?id=sf.mc_ads_lead_capture). In the **Configure Fields** section, store the Meta Lead ID by mapping it to a custom field you created for it.

### Hubspot - Lead Sync

Hubspot's [Lead Sync](https://knowledge.hubspot.com/ads/sync-leads-from-your-facebook-page-or-linkedin-ads-account-to-hubspot) integration does not store the Meta Lead ID. Download your leads using a Webhook or a partner integration so that you can upload events for Conversion Leads. Alternatively, you can sync your events using Hubspot's [Lifecycle Stage Sync](https://knowledge.hubspot.com/ads/create-and-sync-crm-lifecycle-events-with-your-google-ads-or-facebook-ad-accounts) (Professional and Enterprise only).

### Zoho CRM - Social

Zoho CRM's [Social integration](https://www.zoho.com/social/facebook/facebook-lead-generation.html) does not store the Meta Lead ID. Download your leads using a Webhook or a partner integration so that you can upload events for Conversion Leads.

### Microsoft Dynamics 365

Microsoft Dynamics 365 does not support a leads integration. Download your leads using a Webhook or a partner integration so that you can upload events for Conversion Leads.

## Manual file download

The Meta Lead ID will be the first column of the file labeled **id** in the `.csv` file when you manually download your leads from Ads Manager or Business Suite. You may need to strip the leading label before using it as a match key.

**Note:** This method of downloading leads is not recommended for use in integrations.
