<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/conversions-api-gateway/upload-events | Saved: 2026-09-19 -->

# "Conversions API Gateway: Uploading Events"



Uploading events to your system allows you to capture events that were not automatically sent through the Meta Pixel to the Conversions API. This feature supports uploading events that are compatible with [Meta servers](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/server-event), including website, offline (such as in-store), app and CRM events.

There are two methods for uploading events: automatic uploads using [Amazon S3 integration](https://aws.amazon.com/s3/), or manually uploading files within the Conversions API Gateway. The automatic method is recommended, as it eliminates the need for human intervention and runs seamlessly in the background without disrupting instance usage.

## Automatic File Uploads

Find the automatic uploads section (shown below) on the Overview page and click the **Set up** button:

You will be redirected to a page that provides information about automatic uploads (shown below). On this page, select the cloud provider, then click **Start Setup** to continue.  

### For AWS S3 Bucket

A modal will pop up, with resources and guidance on creating an S3 bucket. Click **Continue** when you've finished the set up process:

Provide the requested information for the S3 and IAM user created in the previous step.

When the setup is finished, you'll be provided with a sample file for reference.

### For Google Storage Bucket

You will need to create a service account and generate an access key. Refer to the [official Google Cloud documentation](https://cloud.google.com/iam/docs/keys-create-delete). Make sure your service account has permissions to list files, read files and delete files.

Upload the generated key file and fill in the bucket name here after setup.

A confirmation page with the sample file will pop up. You can start delivering files to the bucket. Your gateway instance will automatically pick up, process, then delete the files.

You can now go back to the same setup page from the Overview page to monitor the job run, and to modify connection information by clicking the "..." button.

Below is a detailed header definition table to use when formatting your data files. Follow the format closely to help ensure the best results. You can also view this table on the Settings page.

| Key | Description | Required | Default Value |
| --- | --- | --- | --- |
| `DATA_SET_ID` | ID of source this event is sent to | **Yes** | Event will be dropped if ID isn't provided |
| `EVENT_NAME` | Event name of the record | **Yes** | Purchase |
| `EVENT_TIME` | Date and time when transaction happens, **format** `YYYY-MM-DD HH:mm:ss` | **Yes** | empty |
| `ACTION_SOURCE` | The Meta-defined action source that indicates the type of event. See a list of sources [here](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/server-event). | **Yes** | physical_store |
| `VALUE` | The value of the transaction | **Required for Purchase event** | 0 |
| `CURRENCY` | Currency of the transaction | **Required for Purchase event** | USD |
| `CONTENT_IDS` | The IDs for contents or items with transactions. Supports multi values split by pipe symbol. For example: `id1`\|`id2` | No | empty |
| `ORDER_ID` | Transaction id or order id of the record | No, **but recommended** | empty |
| `EMAIL` | Customer's email | No, **but highly recommended** | empty |
| `PHONE` | Customer's phone number | No, **but highly recommended** | empty |
| `FIRST_NAME` | Customer's first name | No, **but highly recommended** | empty |
| `LAST_NAME` | Customer's last name | No, **but highly recommended** | empty |
| `DOB` | Customer's date of birth string, **accept YYYYMMDD format**. Example: 1/1/2013 needs to be formatted as `20230101` | No, **but recommended** | empty |
| `COUNTRY` | Customer's Country<br><br>**Use two letter code**. Example: `US` | No, **but recommended** | empty |
| `STATE` | Customer's state | No, **but recommended** | empty |
| `CITY` | Customer's city | No, **but recommended** | empty |
| `ZIP` | Customer's zip code | No, **but recommended** | empty |
| `CLICK_ID` | Identifier associated with user's link click. (also known as fbc or fbclid) | No, **but recommended** | empty |
| `MAD_ID` | Advertising ID for Apple or Android | No, **but recommended** | empty |
| `EXTERNAL_ID` | Third party user ID | No, **but recommended** | empty |
| `LEAD_ID` | The lead ID from Lead Ads | **Required for Leads event** | empty |
| `custom_data.<data-key>` | Set up this header to send custom data. Replace <data-key> to the actual keys you want to use.<br><br><br>See special note below.* | No | empty |

**Warning:** *Automatic uploads can handle top-level custom data, but the feature does not currently support nested objects. The header of the CSV column should be labeled as `custom_data.<data-key>`, where `<data-key>` is the name of the custom data field you wish to send, for example `custom_data.CustomField`

## Manual File Uploads

From the Overview page, select any connected dataset, and hover on the button below and click **Upload data**. 

Event data sent to the Conversions API must contain a set of parameters, some mandatory and some optional. The CSV file headers use JSONPath format to define the payload keys. Check the detailed Conversions API payload parameters [here](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/server-event). Use the template available by clicking the sample file link to format your events data.

Once uploaded, the name of the CSV file will appear and the number of Uploaded or Excluded events will be shown. 

It should take approximately 10 minutes for the events to be sent to the Conversions API and appear in the Events activity section.

## See Also

* [Conversions API Gateway Overview](https://developers.facebook.com/documentation/ads-commerce/gateway-products/conversions-api-gateway)
* [Conversions API Gateway Setup Guide](https://developers.facebook.com/documentation/ads-commerce/gateway-products/conversions-api-gateway/setup)
