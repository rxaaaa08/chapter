<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway/upload-events | Saved: 2026-09-19 -->

# "Signals Gateway: File Upload"



The File Upload feature allows Signals Gateway users to ingest events that are in a CSV file. This feature supports uploading events that are compatible with Meta servers, including website, offline (such as in-store) app and CRM events. There are two methods for uploading events: automatic uploads using S3 integration, or manually uploading files within the Signals Gateway by setup file data source. The automatic method is recommended as it eliminates the need for human intervention and runs seamlessly in the background without disrupting instance usage.

## File Data Source Setup

While creating first party pipeline, choose "File upload" as data source.

Add a name for this source:

The file source will then be created:

After finishing the pipeline creation, you can start using the "File Upload" features manually or further config for automation upload as described below. Events can be viewed by clicking on the File events icon at pipeline detail page:

## Automatic File Uploads

To set up automatic uploads, find the setting through **Account settings** -> **Automatic file uploads**.

You will be redirected to the page that provides an overview of automatic uploading (shown below), click **Start setup** to continue.

A modal will pop up, which provides resources and guidance on creating an S3 bucket with ease. Click **Continue** when you've finished set up process:

Provide necessary information for S3 and IAM user created in previous step:

When the setup is finished, you'll be provided with a sample file for reference.

Now you can go back to the same setup page from the Overview page to monitor the job run, and to modify connection information by clicking the "..." button.

Below is a detailed header definition table to use when formatting your data files. Follow the format closely to help ensure the best results. You can also view this table on the **Settings** page.  

| Key | Description | Required | Default Value |
| --- | --- | --- | --- |
| `DATA_SET_ID` | ID of Signals Gateway file data source. | **Yes** | Event will be dropped if an ID is not included. |
| `EVENT_NAME` | Event name of the record | **Yes** | Purchase |
| `EVENT_TIME` | Date and time when transaction happens, **formatted as** "YYYY-MM-DD HH:mm:ss"<br> | **Yes** | empty |
| `ACTION_SOURCE` | The Meta defined action source indicates what type of the event is. See a list of sources [here](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/server-event). | **Yes** | physical_store |
| `VALUE` | The value of the transaction. | **Required for Purchase event** | 0 |
| `CURRENCY` | currency of the transaction. | **Required for Purchase event** | USD |
| `CONTENT_IDS` | The IDs for contents or items with transaction. Support multi values split by pipe symbol, for example ID1\|ID2. | No | empty |
| `ORDER_ID` | The transaction ID or order ID for the record. | No, **but recommended**<br> | empty |
| `EMAIL` | Customer's email | No, **but recommended**<br> | empty |
| `PHONE` | Customer's phone number | No, **but recommended**<br> | empty |
| `LAST_NAME` | Customer's last name | No, **but recommended**<br> | empty |
| `FIRST_NAME` | Customer's first name | No, **but recommended**<br> | empty |
| `DOB` | Customer's date of birth strin. We **accept** YYYYMMDD format.<br><br>Example: 1/1/2013 should be formatted as 20230101<br> | No, **but recommended**<br> | empty |
| `COUNTRY` | Customer's country<br><br>**Use two letter code. For example, US** | No, **but recommended**<br> | empty |
| `STATE` | Customer's state | No, **but recommended**<br> | empty |
| `CITY` | Customer's city | No, **but recommended**<br> | empty |
| `ZIP` | Customer's zip code | No, **but recommended**<br> | empty |
| `CLICK_ID` | Identifier associated with User's link click. (Also known as fbc or fbclid) | No, **but recommended**<br> | empty |
| `MAD_ID` | Advertising ID for Apple or Android | No, **but recommended**<br> | empty |
| `EXTERNAL_ID` | Third party user ID | No, **but recommended**<br> | empty |
| `LEAD_ID` | The lead ID from your Lead Ads | No, **but recommended**<br> | empty |
| `custom_data.<data-key>` | Setup this header to send custom data. Replace <data-key> to the actual keys you want to use. See special note below.﹡ | No | empty |

﹡Automatic uploads can handle top-level custom data, but the feature does not currently support nested objects. The header of the CSV column should be labeled as "custom_data.<data-key>", where <data-key> is the name of the custom data field you wish to send, for example "custom_data.CustomField".

**Test Automatic Upload**: To verify the S3 integration, upload some sample files to the connected S3 bucket and check if the job finished successfully. For non-App Runner instances, you can trigger an instant job by clicking the refresh button on the settings page; otherwise, the job will run automatically in an hour.

## Manual File Uploads

Click the file event data source from Pipeline to start using the manually upload feature.

Then locate the action menu from the popup modal and click **Upload event data**.

Event data manually uploaded to a data source must contain a set of parameters, some mandatory and some optional. The CSV file headers use JSONPath format to define the payload keys Check the detailed payload [parameters here](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/server-event). Use the template available by clicking the sample file link to format your events data.

Once uploaded, the name of the CSV file will appear and the number of Uploaded or Excluded events will be shown.

## See Also

* [Signals Gateway Overview](https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway)
* [Signals Gateway Setup Guide](https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway/setup)
