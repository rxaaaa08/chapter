<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway/data-destination-management | Saved: 2026-09-19 -->

# Data Destination Management



When creating a data pipeline in Signals Gateway, you can create or add data destinations that will receive outbound events from the data pipeline. Data destinations can also be created from the data pipeline details page after the data pipeline is created. Once a data destination is created, you can perform various data destination operations, like creating additional data destinations types, updating or deleting existing destinations, from the data pipeline details page.

## Creating a Data Destination

Click the "+" button in the pipeline details page. If the "+" button is not available or disabled, it means that all supported data destination types have already been added to the data pipeline, and the limit for each data destination type has been reached.

After clicking the "+" button, you can choose a name for your data destination and follow the provided instructions to complete the data destination creation process.

If you did not enable the Meta Conversions API plugin, the Meta data destination is disabled (as shown in the screenshot below).

If you have enabled the Meta Conversions API plugin, you will be able to create both Meta data destinations and connect to a custom data destination.

To add a custom data destination, follow the step-by-step instructions. There will be a default data destination name during creation, but you can rename it to anything else.

To create a Meta Conversions API data destination, you will connect the Conversions API from the Meta plugin or use the manual connection option.

You can choose to use the Facebook login tool to preview the business account and Meta Pixel and then select one from the list to create a Meta data destination. Alternatively, you can manually input the Meta Business ID, Dataset ID and Access Token from the Events Manager dataset to connect manually.

## Deleting a Data Destination

To delete a data destination, click the data destination in the Data pipeline details page, then find the **Actions** drop down button on the top right corner, and click **Delete**.

## Editing a Data Destination

You can update the data destination name, or the configurations.

To update the data destination name, click the data destination, and click the **Edit** sign next to the current name.

To update the configurations of the data destination, click the **Configurations** tab in the data destination details page.

