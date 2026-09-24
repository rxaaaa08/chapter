<!-- Source: https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/crm-integration/3-implementing-the-crm-integration | Saved: 2026-09-19 -->

# "3: Developer Implementation"



This page deals with the manual integration and covers:

* [Building the payload for CRM integration](#step-1-build-a-payload)
* [Generating an access token and preparing an API call](#step-2-create-an-access-token-and-an-api-call)
* [Sending a test payload](#step-3-test-a-payload-optional)
* [Sending production data](#step-4-send-production-data)

This section is only applicable if you decide to complete this integration using a manual integration and developer resources. If you instead decide to complete this integration using a partner, follow the respective partner instructions for the integration. You can skip to [4: Verify your data](https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/crm-integration/4-verify-your-data) section of this guide once the partner integration is complete.

You will need Meta Business Suite admin access to complete these integration steps. You may acquire access from the email sent to you if you were invited as a developer. Otherwise, contact a Meta Business Suite admin to request access.

## Step 1: Build a payload {#step-1-build-a-payload}

This step will lay out the payload specifications for the Conversions API for CRM integration and provide some recommendations on how to send it from your server.

- Open the CRM integration guide from the **Settings** tab of your CRM Pixel to get started.

- Review the [Conversions API Developers Guide](https://developers.facebook.com/documentation/ads-commerce/conversions-api/using-the-api) to gain an understanding of how the Conversions API functions.

- Meta recommends using the [Payload Helper](https://developers.facebook.com/documentation/ads-commerce/conversions-api/payload-helper?data=[%7B%22event_name%22%3A%22Lead%22%2C%22event_time%22%3A1664577963%2C%22action_source%22%3A%22system_generated%22%2C%22user_data%22%3A%7B%22lead_id%22%3A1234567890123456%7D%2C%22custom_data%22%3A%7B%22lead_event_source%22%3A%22Your%20CRM%22%2C%22event_source%22%3A%22crm%22%7D%7D]&selectedProduct=Conversion%20Leads) to build your payload. The Payload Helper will format your payload and check for errors. Once all payload errors are resolved, click the **Get Code** button inside the Payload Helper to generate a code template for your programming language.

- Here is the list of required parameters. Review the [Conversion Leads Integration - Payload Specification guide](https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/payload-specification) to see the full description for each parameter.

**This payload specification should only be used for Conversion Leads Optimization events.** This means the events should only pertain to Meta lead ads. Refrain from using this payload specification for other event types, such as website leads.

**Required Parameters**
| Name | Description |
| --- | --- |
| `event_name`  <br><br>string | Free-form field to capture the lead stages you use within your CRM.  <br>The `event_name` parameter should indicate a lead moving through the sales funnel in your CRM. **Make sure to send all stages as they are updated, including the raw lead.**<br> |
| `event_time`<br><br>integer | A Unix timestamp in seconds indicating when the lead stage update event is updated by your CRM.  <br>The timestamp must occur after the lead generation time or else the event may be discarded. |
| `action_source`<br><br>string | **Value:** `system_generated`<br><br>(By using the Conversions API, you agree that the [`action_source`](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/server-event#action-source) parameter is accurate to the best of your knowledge.) |
| `user_data`<br><br>object | A map that contains customer information data. See [Customer Information Parameters](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/customer-information-parameters) for options. See [Advanced Matching](https://developers.facebook.com/docs/meta-pixel/advanced/advanced-matching) for comparable options available for data sent via Meta Pixel. |
| `lead_event_source`<br><br>string | The name of the CRM where the events are coming from. |
| `event_source`<br><br>string | **Value:** `crm` |

**Customer Information Parameters**

Customer information helps Meta match events from your server with Meta accounts. Sending as many of the following parameters can lead to more accurate event data and better ad performance. 

**Note**: You must send at least one customer information parameter.

If sending `lead_id`,  please use a valid `lead_id` or else the system will reject the event. If you choose to send email, phone number, these have to be hashed. Click ID currently does not have API rejection level error, but a large volume of invalid `click_id` will cause an alert in the system.

| Parameter | Priority | Description |
| --- | --- | --- |
| Lead ID (recommended) [How to find the lead ID?](https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/how-to-find-the-lead-id) | Highest | The Facebook generated ID for every lead. It is a 15-17 digit number obtained from the `leadgen_id` [field in the lead generation Webhook](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lead-ads/retrieving#webhook-response) and included under the `user_data` parameter.<br><br>Refer to [Find the Lead ID](https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/how-to-find-the-lead-id) for more information. |
| Click ID | Highest |  |
| Hashed email | Highest |  |
| Hashed phone number | High |  |
| Other hashed Contact Information | Medium |  |

**Warning:** **Note**: In addition to a hashed email and phone number, you can send hashed gender, date of birth, last name, first name, city, state, zip, and more to Meta.

**Example**

An example payload may look like this.

```
{
"data": [
{
"event_name": "Lead",
"event_time": 1664577963,
"action_source": "system_generated",
"user_data": {
"lead_id": 1234567890123456,
"em": [
"973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b"
],
"ph": [
"74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b"
]
},
"custom_data": {
"lead_event_source": "Your CRM",
"event_source": "crm"
}
}
]
}
```

- If events do not follow the payload specification or do not match a Meta lead ad, then they will not be recognized for the integration and will not be used for training the model. 
For example the Web payload would be accepted by the Conversions API and appear in Events Manager, but it will **not** be recognized for this integration. You must also use a valid `lead_id` or else the system will reject your event. 

**Note:** You must send at least one customer information parameter. If sending `lead_id`, please use valid `lead_id` or else the system will reject the event. If you choose to send email, phone number, these have to be hashed. Click ID currently does not have API rejection level error, but a large volume of invalid `click_id` will cause an alert in the system.

Only the Conversion Leads payload will be recognized for the integration and used for training.

## Step 2: Create an access token and an API call {#step-2-create-an-access-token-and-an-api-call}

Once you configure what you will send, the next step is to configure where you will send the data.

This step will help you generate an access token for your Meta Pixel, which will then be used to establish a connection between your server and the Conversions API.

- You can return to the CRM integration guide from the **Settings** tab of your CRM Pixel.

- Scroll down to the **Create Endpoint** section and click the **Generate Access Token** button. The access token will be used to build your API call.

You can generate a new access token by returning to the integration guide or from the **Settings** tab in [Events Manager](https://www.facebook.com/events_manager2/list) by navigating to the **Conversions API** section and clicking the **Generate access token** link.

- The rest of this guide will vary depending on whether you are using Meta's SDK. Using the [Meta Business SDK](https://developers.facebook.com/docs/business-sdk/overview) is recommended because they provide better error and diagnostic messaging. You will need your Pixel ID and access token to make the API call via the Meta Business SDK. You can get the access token by clicking **Copy access token** in the CRM integration guide and saving it. Examples of SDK API calls can be found in the [Conversion API Developers Guide](https://developers.facebook.com/documentation/ads-commerce/conversions-api/using-the-api#send) or the **Get Code** functionality within the Meta Payload Helper.

- This is the endpoint format to make a `POST` request to the Conversions API without the SDK. You can get the entire endpoint by clicking **Copy endpoint** in the CRM Integration guide and saving it.

```html
https://graph.facebook.com/API_VERSION/PIXEL_ID/events?access_token=ACCESS_TOKEN
```

- `API_VERSION`: The current Marketing API version

- `PIXEL_ID`: The Pixel ID can be obtained from Events Manager for each Pixel

- `ACCESS_TOKEN`: The access token generated above

- You can see the Marketing API release and expiration dates in the [API Version documentation](https://developers.facebook.com/docs/graph-api/changelog/versions). Be sure to update the API version or the Meta Business SDK in your code before the Marketing API expiration date. Using a deprecated version in your code could result in errors and your events may be discarded by the system.

## Step 3: Test a payload (optional) {#step-3-test-a-payload-optional}

At this point you may want to send a test payload to your Pixel before implementing the code on your server. You can do so by using the **Test Events** tab in [Events Manager](https://www.facebook.com/events_manager2/list).

- In the **Test Server Events** section, click on the **Graph API Explorer** link. Using this unique link will prefill some information from your Pixel. (You can also directly access the [Graph API Explorer](https://developers.facebook.com/tools/explorer) if you wish.) Take note of the `test_event_code` value, which can change over time.

- Complete the following in the Graph API Explorer tool:

- Ensure you are in `POST` mode.

- Check that your API version and Pixel ID are correct.

- Switch to the JSON view.

- Input your payload. This can be manually created or generated using the [Payload Helper](https://developers.facebook.com/documentation/ads-commerce/conversions-api/payload-helper). Make sure to include the `test_event_code` parameter from the previous step and a valid `lead_id`.

- Enter your Pixel access token, and click the **Submit** button.

- If your payload does not contain any syntax or API errors, you should receive a success message with a `fbtrace_id`.

- The test event should appear under the **Test Events** tab in Events Manager after a short time.

## Step 4: Send production data {#step-4-send-production-data}

The production data should be in the same format as the payload generated in Step 3, except the data will be coming directly from your server. This step will vary for every integration so this section will provide guidelines rather than a walkthrough.

- Send the `lead_id` (recommended) and additional customer information parameters that are listed above for matching.

- Make sure to **send all lead stages** as they are updated, including the raw lead event that represents all leads generated on Meta and downloaded into your CRM. Below is an example funnel. The event names and stages are advertiser-defined so they do not have to conform to this example.

If your campaigns generate 100 leads, then Meta expects 100 "Raw Lead" events uploaded to represent the first lead stage. Sending the first lead stage lets the system know that the lead was received and processed. As the leads move down the sales funnel, Meta expects 70 "Marketing Qualified Lead", 30 "Sales Opportunity", and 15 "Converted" stages to be uploaded.

In this example scenario, 100 leads are generated from the campaigns, but Meta expects 215 events to be uploaded.

- Create a function that retrieves updates from your CRM's API or database whenever the lead status updates. Then send your payload to Meta's Conversions API using a custom function or Meta's business SDK. What makes the most sense for your integration will depend on your CRM and database configuration.

Variables are recommended for:

- `lead_id`

- `event_name`

- `event_time`

For example, a payload that explicitly states the parameter values may look like this:

```
{
"event_name": "initial_lead",
"event_time": 1628294742,
"user_data": {
"lead_id": 1234567890123456
},
"action_source": "system_generated",
"custom_data:" {
"lead_event_source": "Salesforce",
"event_source": "crm"
}
}
```

A payload that passes in values from your database using variables may look like this:

```
{
"event_name": lead_stage // "initial_lead"
"event_time": unix_time // 1628294742
"user_data": {
"lead_id": fb_lead_id // 1234567890123456
},
"action_source": "system_generated",
"custom_data:" {
"lead_event_source": "Salesforce",
"event_source": "crm"
}
}
```

- Upload data at least once a day.  Ideally the calls to your CRM should be made in real-time, but you may employ hourly or daily batching methods if a real-time integration is not feasible.  

If you choose the batching methods, make sure you capture the lead status change history rather than a snapshot of the lead at the time of batching. For example, if a lead's status updates 3 times between batches, Meta expects 3 events for this lead rather than just the final update.

**Note:** Each batch can include up to 1,000 events. If there is an error in the batch, the whole batch will be discarded, so use smaller batches and add logic for retrying attempts.

- **Optional**. Meta recommends logging error messages from the Conversions API call and creating alerts if there are issues. Add exception handling for these errors.

- You can backfill your data for up to 7 days in the past. The time difference is calculated between `event_time` and `upload_time`. Backfilling some data may speed up the training process.

**Note:** WARNING: Do not attempt to backfill more than 7 days of data by modifying the `event_time` values. The model relies on an accurate time stamp to optimize. Doing so may cause all your backfilled data to be discarded.

- Ensure that your `event_time` values are after the lead generation timestamp, otherwise your events may be discarded.

- You should start seeing events appear in Events Manager for your Pixel within an hour if your integration is uploading events to Meta. Remember to use a valid `lead_id` in your payloads for events to appear. Open each event sent for the Conversion Leads CRM integration in Events Manager and check that they have the custom parameters `lead_event_source` and `event_source` populated. If the event does not have these parameters, it will not get registered as a Conversion Leads event.

- The system will verify if any of your events are valid Conversion Leads events. After 1 day, a green check will appear next to the **Send a CRM event** step of the integration if a valid event is detected.

