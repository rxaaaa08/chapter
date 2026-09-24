<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lead-ads/retrieving | Saved: 2026-09-19 -->

# Retrieving Leads



You can retrieve leads with [Webhooks](#webhooks) or [Bulk Read](#bulk-read).

## Before You Start

To read ad specific fields, such as `ad_id` or `campaign_id`, you will need:

* A Page or User access token requested by a person who can advertise on the ad account and [on the Page](https://developers.facebook.com/docs/pages/overview#tasks)
* The [`ads_management` permission](https://developers.facebook.com/docs/permissions/reference/ads_management)
* The [`pages_read_engagement` permission](https://developers.facebook.com/docs/permissions/reference/pages_read_management)
* The [`pages_show_list` permission](https://developers.facebook.com/docs/permissions/reference/pages_show_list)
* The [`pages_manage_metadata` permission](https://developers.facebook.com/docs/permissions/reference/pages_manage_metadata) - if using webhooks

To retrieve all lead data and ad level data, you will need:

* A Page or User access token requested by a person who can advertise on the ad account and [on the Page](https://developers.facebook.com/docs/pages/overview#tasks)
* The [`ads_management` permission](https://developers.facebook.com/docs/permissions/reference/ads_management)
* The [`leads_retrieval` permission](https://developers.facebook.com/docs/permissions/reference/leads_retrieval)
* The [`pages_show_list` permission](https://developers.facebook.com/docs/permissions/reference/pages_show_list)
* The [`pages_read_engagement` permission](https://developers.facebook.com/docs/permissions/reference/pages_read_management)
* The [`pages_manage_ads` permission](https://developers.facebook.com/docs/permissions/reference/pages_manage_ads)

**Note**: If the Page admin did not customize leads and has not granted access permission with the Leads Access Manager, then all Page admins will have leads access permission. If leads access permission is customized by the business admins, then it depends on the business admin's configuration for whether a Page basic admin has leads access permission or not.

## Rate Limits {#rate}

The rate limit is 200 multiplied by 24 then multiplied by the number of leads created in the past 90 days for a Facebook Page. If you make more calls than this in a 24-hour period, your request will return an error.

## Filter By Date Range {#filtering}

Send a `GET` request to the `/ads/lead_gen/export_csv/` endpoint where date formats are either `POSIX` or `UNIX` timestamps.

```
curl -i -X GET "https://www.facebook.com/ads/lead_gen/export_csv/
    ?id=<FORM_ID>
    &type=form
    &from_date=1482698431
    &to_date=1482784831"
```

#### Caveats

* If `from_date` is not set or is less than the form creation time, the form creation time is used.
* If `to_date` is not set or is greater than the present time, current time is used.

* If any entries lack Ad IDs or Adgroup IDs in the TSV, it can be due to the following reasons:
    * The lead is generated from organic reach. In this case, `is_organic` in the TSV displays `1`; otherwise, the value is `0`.
    * The lead may be submitted from an Ad Preview.
    * The person requesting leads does not have advertiser privileges on the Ad Account.

## Webhooks {#webhooks}

Get real-time updates for lead ads.

### Step 1: Get Started

Visit our [Webhooks Get Started guide](https://developers.facebook.com/docs/graph-api/webhooks/getting-started) to set up your endpoint and configure your webhook.

### Step 2: Get a Long-Lived Page Access Token

Generate a single, [long-lived Page token](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens/get-long-lived#get-a-long-lived-page-access-token) to continuously fetch data without worrying about it expiring.

### Step 3: Install Your App on the Page

Visit our [Webhooks for Pages guide](https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-pages#install-app) to learn how to install your app on a Page.

### Webhook Response

On leadgen creation, your app receives the following webhook response:

```json
array(
  "object" => "page",
  "entry" => array(
    "0" => array(
      "id" => 153125381133,
      "time" => 1438292065,
      "changes" => array(
        "0" => array(
          "field" => "leadgen",
          "value" => array(
            "leadgen_id" => 123123123123,
            "page_id" => 123123123,
            "form_id" => 12312312312,
            "adgroup_id" => 12312312312,
            "ad_id" => 12312312312,
            "created_time" => 1440120384
          )
        ),
        "1" => array(
          "field" => "leadgen",
          "value" => array(
            "leadgen_id" => 123123123124,
            "page_id" => 123123123,
            "form_id" => 12312312312,
            "adgroup_id" => 12312312312,
            "ad_id" => 12312312312,
            "created_time" => 1440120384
          )
        )
      )
    )
  )
)
```

You can use `leadgen_id` to retrieve data associated with the lead:

```bash
curl -X GET \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<LEAD_ID>
```

On success, your app receives the following response:

```json
{
  "created_time": "2015-02-28T08:49:14+0000",
  "id": "<LEAD_ID>",
  "ad_id": "<AD_ID>",
  "form_id": "<FORM_ID>",
  "field_data": [{
    "name": "car_make",
    "values": [
      "Honda"
    ]
  },
  {
    "name": "full_name",
    "values": [
      "Joe Example"
    ]
  },
  {
    "name": "email",
    "values": [
      "joe@example.com"
    ]
  },
  {
    "name": "selected_dealer",
    "values": [
      "99213450"
    ]
  }],
  ...
}
```

### Learn More

* Many CRMs provide real-time updates to migrate lead ads data into the CRMs. See [Available CRM Integration](https://www.facebook.com/business/help/908902042493104?__mref=message_bubble).
* The ping for real-time updates is structured as follows. Read more at [Real Time Updates, Blog](https://developers.facebook.com/ads/blog/post/2014/12/11/real-time-updates-for-page-conversions/).
* On success, real-time pings occur on events with a delay of up to a few minutes. See [Troubleshooting Real-time Integrations](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lead-ads/testing-troubleshooting).

You can see an example of this implementation in our [GitHub repository](https://github.com/fbsamples/lead-ads-webhook-sample).

## Bulk Read {#bulk-read}

**Warning:** The `leads_retrieval` permission is required to read leads.

The `leads` exists on both ad group and form nodes. This returns all data associated with their respective objects. Because a form can be re-used for many ads, **your form could contain far more leads than an ad using it.**

To read in-bulk by ad:

```bash
curl -X GET \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<AD_ID>/leads
```

To read by form:

```
curl -G \
  -d 'access_token=<ACCESS_TOKEN>' \
  -d 'fields=created_time,id,ad_id,form_id,field_data' \
  https://graph.facebook.com/<API_VERSION>/<FORM_ID>/leads
```

The response:

```
{
  "data": [
    {
      "created_time": "2018-02-28T08:49:14+0000",
      "id": "<LEAD_ID>",
      "ad_id": "<AD_ID>",
      "form_id": "<FORM_ID>",
      "field_data": [
        {
          "name": "car_make",
          "values": [
            "Honda"
          ]
        },
        {
          "name": "full_name",
          "values": [
            "Joe Example"
          ]
        },
        {
          "name": "email",
          "values": [
            "joe@example.com"
          ]
        },
      ],
      ...
    }
  ],
  "paging": {
    "cursors": {
      "before": "OTc2Nz3M8MTgyMzU1NDMy",
      "after": "OTcxNjcyOTg8ANTI4NzE4"
    }
  }
}
```

### Reading Store Locator Question Value

A store locator question is no different from any other question. A store locator question will also have a field ID that's going to be mapped against them during the form creation. They are also going to be sent similarly as other questions. The value passed will come from the **Store Number** of the selected location.

For example, let's say you have a store locator question with `selected_dealer` as the field ID. To fetch the leads in bulk, you can call:

```
curl -G \
  -d 'access_token=<ACCESS_TOKEN>' \
  -d 'fields=created_time,id,ad_id,form_id,field_data' \
  https://graph.facebook.com/<API_VERSION>/<FORM_ID>/leads
```

The response:

```
{
  "data": [
    {
      "created_time": "2018-02-28T08:49:14+0000",
      "id": "<LEAD_ID>",
      "ad_id": "<AD_ID>",
      "form_id": "<FORM_ID>",
      "field_data": [
        {
          "name": "car_make",
          "values": [
            "Honda"
          ]
        },
        {
          "name": "full_name",
          "values": [
            "Joe Example"
          ]
        },
        {
          "name": "email",
          "values": [
            "joe@example.com"
          ]
        },
        {
          "name": "selected_dealer",
          "values": [
            "99213450"
          ]
        }
      ],
      ...
    }
  ],
  "paging": {
    "cursors": {
      "before": "OTc2Nz3M8MTgyMzU1NDMy",
      "after": "OTcxNjcyOTg8ANTI4NzE4"
    }
  }
}
```

### Reading Custom Disclaimer Responses

The `field_data` does not contain the responses to optional custom disclaimer check boxes that the user would have filled out. To retrieve the responses, use the `custom_disclaimer_responses` field.

```
curl -X GET \
"https://graph.facebook.com/<API_VERSION>/<LEADGEN_ID>?
fields=custom_disclaimer_responses"
```

Response:

```
{
  "custom_disclaimer_responses": [
    {
      "checkbox_key": "optional_1",
      "is_checked": "1"
    },
    {
      "checkbox_key": "optional_2",
      "is_checked": ""
    }
  ],
  "id": "1231231231"
}
```

### Filtering Leads

This example filters leads based on timestamps. Each timestamp must be a Unix timestamp.

```bash
curl -X GET \
  -d 'filtering=[
       {
         "field": "time_created",
         "operator": "GREATER_THAN",
         "value": 1761945743
       }
     ]' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<AD_ID>/leads
```

The `operator` has one of the following values.

| Operator | Meaning |
| --- | --- |
| `LESS_THAN` | Filters for values less than the timestamp. |
| `GREATER_THAN` | Filters for values greater than the timestamp. |
| `GREATER_THAN_OR_EQUAL` | Filters for values greater than or equal to the timestamp. |
|  |  |

### Tokenization {#tokenization}

If the form has customized field IDs, the fields and values returned will be the specified fields and values.

## Resources

- Marketplace Platform: [Vehicles, Leads](https://developers.facebook.com/docs/marketplace/vehicles/retrieving-leads)
- Lead Access Manager: Please refer to the Help Center articles on [About Leads Access Manager](https://www.facebook.com/business/help/1440176552713521?id=735435806665862) and [Assign or Remove Permissions in Leads Access Manager](https://www.facebook.com/business/help/540596413257598?id=735435806665862) for more details.
