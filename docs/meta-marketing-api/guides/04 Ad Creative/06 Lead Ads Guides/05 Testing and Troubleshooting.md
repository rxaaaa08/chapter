<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lead-ads/testing-troubleshooting | Saved: 2026-09-19 -->

# Testing and Troubleshooting



Use this API to create and delete test leads.

## Using the testing tool

You can use [this tool](https://developers.facebook.com/tools/lead-ads-testing) to create and delete test leads for your forms; **however, you cannot use the tool in developer mode**.

You can create one test lead per form. You'll need to delete an existing lead in order to create a new one.

## Debug real-time update integration

Use this tool to test if your integration with Facebook's Webhooks is successful. Here are the steps to use this tool to debug your integration.

**Warning:** The leads created using this tool are organic leads that are not associated with any ad. Only one lead can be created per form. Therefore, to re-create a lead for the same form, click **Delete Lead** to first delete, then lead, and then re-create it.

- Go to the [**testing tool**](https://developers.facebook.com/tools/lead-ads-testing).

The drop-down lists all the pages you have advertiser access to.

- Select a page from the drop-down.

- In the **Form** drop-down, select a form to use for creating a lead.

- Click **Create Lead** to create a lead. By default, the lead that gets created has dummy data within it.

- Click **Preview Form** to customize the data being sent.

- Enter the desired data on the form level to create a lead with custom content.

- Once the lead is created, the **Track Status** button appears.

- Click **Track Status**, to see the status of the leads. It takes a few seconds for the RTU to be fired to your endpoint. Until then, you see the RTU in **pending** status. Click **Track Status** again until you see the status change.

Once the lead is pushed to your endpoint, the status field changes. If the RTU was fired successfully, the status changes to **success**.

For the success cases, you also see the payload in the table. The payload shown here is a copy of what Facebook sends to your endpoint, so you should see the content and handle the JSON.

If there was an issue during sending the RTU, then the status changes to **failed**. In such cases, the `error_code` column gives details about the reason for the failure.


### Lead testing

You can test your leads via the Test button after you [setup Webhooks for your app](https://developers.facebook.com/docs/graph-api/webhooks/getting-started). The button is inside the Webhooks dashboard for the app.

## Create test leads

You can create a test lead by making a `POST` request to `/{FORM_ID}/test_leads`.

For this request to succeed, the following requirements must be met:

* You should not have existing test leads for the specified Lead Ad form.
* You must have a [page role](https://developers.facebook.com/docs/graph-api/reference/page/roles) of `Advertiser` or above on the page under which the form was created.
* You need to use the Page access token in your API call.

```
curl \
  -F "access_token=<ACCESS_TOKEN>" \
  "https://graph.facebook.com/API_VERSION/FORM_ID/test_leads"
```

You can customize the test lead content by passing the following parameters:

* `field_data`: A vector parameter with `name` and `values` pairs.
* `custom_disclaimer_responses`: A vector parameter with `checkbox_key` and `is_checked` pairs.

```
curl \
  -F "field_data=[{'name': 'favorite_color?', 'values': ['yellow']}, {'name': 'email', 'values': ['test@test.com']}]" \
  -F "custom_disclaimer_responses=[{'checkbox_key': 'my_checkbox', 'is_checked': true}]" \
  -F "access_token=<ACCESS_TOKEN>" \
  "https://graph.facebook.com/API_VERSION/FORM_ID/test_leads"
```

The leads created from the above calls are fake leads and are therefore not associated with any ads.

## Read test leads
You can read the test leads associated with a Lead Ads form by making a `GET` call to the `{FORM_ID}/test_leads` endpoint.

```
curl \
  -d "access_token=<ACCESS_TOKEN>" \
  "https://graph.facebook.com/API_VERSION/FORM_ID/test_leads"
```

## Delete test leads
If you are testing your integration, to delete a lead so that you can resubmit, make the following API call:

```
curl -X DELETE \
  -d "access_token=<ACCESS_TOKEN>" \
  "https://graph.facebook.com/<API_VERSION>/<LEAD_ID>"
```

**Warning:** Only the owner of the lead can delete the lead.

