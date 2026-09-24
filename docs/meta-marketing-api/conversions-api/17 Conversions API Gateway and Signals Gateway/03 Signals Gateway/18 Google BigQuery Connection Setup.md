<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway/google-bigquery-connection-setup | Saved: 2026-09-19 -->

# Google BigQuery Connection Setup



Google BigQuery is a fully managed, multi-engine, multi-format data analytics platform. Use this plugin to add it as a data destination for your Signals Gateway pipelines, and to access and analyze data stored in Google BigQuery.

You can set up a Google BigQuery account as a data destination for this data pipeline. Once setup is complete, your pipeline will be able to send outbound events to the selected Google BigQuery account.

## Create Table

1. Navigate to the [BigQuery console in GCP](https://console.cloud.google.com/bigquery).

2. Create a new dataset within your project.

3. Create a new table within the dataset.

4. Edit the table schema to include a single JSON type field called data.

For detailed steps, see [Google's official documentation here](https://cloud.google.com/bigquery/docs/tables).

## Create Service Account

1. Navigate to the **Service accounts** section of the [IAM Admin](https://console.cloud.google.com/iam-admin/serviceaccounts).

2. Follow [Google's documentation to create a service account](https://cloud.google.com/iam/docs/service-accounts-create).

3. During creation ensure the service account is given permissions to write to BigQuery. [See details on Google BigQuery required permissions.](https://cloud.google.com/bigquery/docs/use-service-accounts).

4. Create a JSON key for the service account.

5. Once created the JSON file will be automatically saved to your computer. Make sure to store this securely.

## Set Up Google Bigquery Destination on Signals Gateway

1. Enable the plugin.

2. Select the Google BigQuery connector during pipeline setup.

3. Configurations.

a) Table ID:

b) **Service Account Email**: This can be found in the downloaded JSON key file - `client_email`: bigqueryadmin@cloudbridge-devc7e720c7.iam.gserviceaccount.com

c) Private Key: This can be found in the downloaded JSON key file.

```
"private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvW6oPzDS4T......ZAA6Hc=\n-----END PRIVATE KEY-----\n"
```

