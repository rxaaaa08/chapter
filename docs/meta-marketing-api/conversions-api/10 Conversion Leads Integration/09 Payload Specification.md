<!-- Source: https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/payload-specification | Saved: 2026-09-19 -->

# Payload Specification



Integrating your CRM with Meta's Conversions API and using the Lead Ads - Conversion Leads optimization goal may yield higher quality results. Currently, this optimization only supports native Lead Ads (Instant Forms) generated on Facebook or Instagram.

**Warning:** This guide provides the payload specification for CRM events uploaded for the Conversion Leads optimization only. Do not use this specification for events not related to this optimization.

See the [Conversions API documentation](https://developers.facebook.com/documentation/ads-commerce/conversions-api) for more information on getting started with the API and other useful resources.

## Event payload

### Required parameters

| Name | Description |
| --- | --- |
| `user_data`  <br><br>object | A map that contains customer information data. See [Customer Information Parameters](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/customer-information-parameters) for options. See [Advanced Matching](https://developers.facebook.com/docs/meta-pixel/advanced/advanced-matching) for comparable options available for data sent via Meta Pixel. |
| `event_name`  <br><br>string | **Required.**  <br>Free form field to capture the stages you use within your CRM.  <br>Make sure to send *all stages* as they are updated, including the initial lead stage.  <br>For example, your stages may include the following types. If a lead reaches the final "Converted" stage, then all previous stages should have been sent beforehand.<br><br>1. Initial Lead from Facebook<br>2. Marketing Qualified Lead<br>3. Sales Opportunity<br>4. Converted<br><br>Use a variable to pass in the stages from your CRM. Alternatively, you could create a separate API call for each stage. |
| `event_time`  <br><br>integer | **Required.**  <br>A Unix timestamp in seconds indicating when the lead stage update event is updated by your CRM.  <br>Use a variable to pass in the Unix timestamp values from your database.  <br>**Note:** The `event_time` parameter value can be up to 7 days before you send an event to Meta. Also the timestamp must occur after the lead generation time or else the event may be discarded. |
| `action_source`  <br><br>string | **Required.**  <br>Set this parameter to the value `system_generated` for all Conversion Leads events.  <br>For Conversion Leads integrations, this specifies where your conversions are system generated. |
| `lead_event_source`  <br><br>string | **Required.**  <br>Set this parameter to the name of the tool where the leads are coming from (e.g., HubSpot, SAP, Oracle, Dynamics, In-house CRM, and so on), included under the `custom_data` parameter. |
| `event_source`  <br><br>string | **Required.**  <br>Set this parameter to the value `crm` for all Conversion Leads events.  <br>For Conversion Leads integration, this specifies the source of the event as your CRM under the `custom_data` parameter. |

### Customer information parameters

Customer information helps Meta match events from your server with Meta accounts. Sending as many of these parameters can lead to more accurate event data and better ad performance.

**Note**: You must send at least one customer information parameter. If sending `lead_id`,  please use a valid `lead_id` or else the system will reject the event. If you choose to send email, phone number, these have to be hashed. Click ID currently does not have API rejection level error, but a large volume of invalid `click_id` will cause an alert in the system.

| Parameter | Priority | Description |
| --- | --- | --- |
| Lead ID (recommended) [How to find the lead ID?](https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/how-to-find-the-lead-id) | Highest | The Facebook generated ID for every lead. It is a 15-17 digit number obtained from the `leadgen_id` [field in the lead generation Webhook](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lead-ads/retrieving#webhook-response) and included under the `user_data` parameter.<br><br>Refer to [Find the Lead ID](https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/how-to-find-the-lead-id) for more information. |
| Click ID | Highest |  |
| Hashed email | Highest |  |
| Hashed phone number | High |  |
| Other hashed Contact Information | Medium |  |

**Warning:** **Note**: In addition to a hashed email and phone number, you can send hashed gender, date of birth, last name, first name, city, state, zip, and more to Meta.

### Example
This example illustrates the format of the event payload sent in the API call.

```
{
    "event_name": "my lead stage",
    "event_time": 1617693833,
    "user_data": {
        "lead_id": 1234567890123456
    },
    "action_source": "system_generated",
    "custom_data": {
        "lead_event_source": "Salesforce",
        "event_source": "crm"
    }
}
```

## Learn more

* Business Help Center: [Set Up Your CRM for Conversion Leads](https://www.facebook.com/business/help/279369167153556)
* Business Help Center: [About Delivery Optimization for Lead Ads](https://www.facebook.com/business/help/782657799338685)
