<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/conversions-api-gateway/data-source-management | Saved: 2026-09-19 -->

# Conversions API Gateway Data Source Management



A newly created account's first access to the Conversions API Gateway dashboard will look like the screen below. The Overview menu is opened by default.

The following table describes each account user type's data source management permissions.

|  |  |
| --- | --- |
| Admin | Admin users can **manage all data sources** in the account. |
| Manage | Managers can **manage all data sources** in the account. |
| View Only | View only users can **view all data sources** in the account. |

## Connect a Meta Pixel to the Conversions API Gateway

To connect a Meta Pixel, access the Conversions API Gateway using Google Chrome with ad-blockers disabled (other browsers might raise errors during this process) and go to Conversions API Gateway Overview page, then click on **Add data source**. The Connect to Meta Business Account box will open. Please note that Meta Pixels can only be connected to Conversions API Gateway data pipelines. A Signals Gateway data pipeline does not connect to Meta Pixels.

Click on **Get started**; a new window or tab will open. Follow the steps to connect the Conversions API Gateway to your Meta account  

Click on **Continue as** [your Facebook account name]. 

 

Click on **Next** 

Click on **Next** 

Click on **Next**. Choose the appropriate Business Manager account and the Pixel to connect. Click on **Next**. 

In the Confirm settings step, select the Business Manager and the Meta Pixel that will be connected to the Conversions API Gateway.

Review the Conversions API Gateway settings and terms and click **Next** if you agree.

At this point, you'll finish the process of connecting to Meta, and your connection status will be pending. 

Click **Done** and go back to the Conversions API Gateway portal. Agree to trust the Conversions API Gateway site and click **Confirm**. 

The Meta Pixel added will appear in the Connected Meta Pixels section as Active. 

## Add Multiple Pixels

It is possible to connect more than one Meta Pixel, managed by the same or different business accounts, to the Conversions API Gateway. Click on **Add data source** and follow the steps as described in the previous section, Connect a Meta Pixel to the Conversions API Gateway.

## Deactivate a Pixel

Click on the three dots button of the pixel in the Overview menu and select **Deactivate pixel**. The pixel will continue to fire and will not communicate (send events) with the Conversions API Gateway. 

## Deactivate Specific Events

It is also possible to stop sending specific events to the Conversions API without deactivating the Pixel. Click on the three dots button of the Pixel in the Overview menu and select **Disable publishing**.

You can deactivate by event type or deactivate the entire Pixel. Selecting the event type or the entire Pixel and toggling the "Publishing" setting to "off" stops the Conversions API Gateway from publishing any event data to Meta in the future. This does not include data that has previously been published to Meta. 

It is also possible to select the event types to deactivate publishing for; to do this, set to **Off** the switch in the Publishing column in Event activity.

## Disconnect a Meta Pixel from the Conversions API Gateway

To completely disconnect a Meta Pixel from the instance, select **Remove data source** in the three dots button of the pixel.

Click on **Confirm**. 

## See Also

* [Conversions API Gateway Overview](https://developers.facebook.com/documentation/ads-commerce/gateway-products/conversions-api-gateway)
* [Conversions API payload parameters](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/server-event)
