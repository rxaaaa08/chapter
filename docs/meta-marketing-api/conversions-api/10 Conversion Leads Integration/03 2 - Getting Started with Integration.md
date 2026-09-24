<!-- Source: https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/crm-integration/2-getting-started-with-integration | Saved: 2026-09-19 -->

# "2: Getting Started With the CRM Integration"



This guide covers:

* [Creating a new Lead Ads campaign](#step-1-create-a-lead-ads-campaign-optional)
* [Creating a new Meta CRM Pixel or converting an existing Pixel](#step-2-create-a-meta-crm-pixel)
* [Choosing an integration method](#step-3-choose-an-integration-method)

## Step 1: Create a Lead Ads campaign (optional) {#step-1-create-a-lead-ads-campaign-optional}

This section is optional if you already have existing Lead Ads campaigns. Note that the optimization goal cannot be changed on published campaigns, but you can duplicate existing campaigns, then change the optimization goal.

- Log into your business [Ads Manager](https://www.facebook.com/adsmanager/manage/campaigns) account. (Conversion Leads performance goal is not available through personal ad accounts nor through Lightweight Interfaces.)

- Click the **+ Create** button to create a new campaign. Under the **Choose a Campaign Objective** window, choose **Leads**, and click **Continue**.

- In the ad set level settings, within the **Conversion location**, select **Instant forms**.

- Under **Optimization and delivery** for the ad set, click on the **Edit** button for **Optimization for ad delivery** and choose the **Conversion Leads** goal in the drop-down. The Conversions API for CRM integration is not a requirement to begin running campaigns with the Conversion Leads performance goal, however you will see better results if it is fully integrated.

## Step 2: Create a Meta CRM dataset {#step-2-create-a-meta-crm-pixel}

This section will walk you through creating a Meta Pixel for your CRM.

**Note:** You will need to have admin access to create or convert a Pixel.

- In [Events Manager](https://www.facebook.com/events_manager2/list), click **Connect Data Sources** to connect a new data source.

- Select **CRM**, then click **Connect**.

- You may either create a completely new dataset or convert an existing dataset. Your decision will depend on how you want to organize your events and manage ad account access to the datasets. Create a new dataset so the CRM events do not overlap with existing dataset events in Events Manager, which will make troubleshooting easier.

If you convert an existing dataset, give the CRM events a different name rather than reusing existing event names, which could cause confusion between the different types of events. Converting an existing web dataset will not affect other events uploaded to it. A CRM dataset lets Meta know that CRM events will be uploaded to it and adds the Conversion Leads Optimization integration workflow to the dataset.

- **To create a new dataset:** Click on the **Create New Dataset** link, and name the dataset accordingly.

- **To convert a dataset:** Select the existing dataset you would like to upload CRM events into. Converting an existing web dataset will not affect other events being uploaded to it.

- Double check that the icon for your CRM dataset has updated. If it did not, repeat this step.

**Note:** The integration is Pixel-based. Do not switch completed integrations to a different Pixel. 

## Step 3: Choose an integration method {#step-3-choose-an-integration-method}

You will have a choice to complete the set up using the manual integration or a partner integration. A manual integration is a great choice for businesses that have developer resources available, access to their server codebase, and need the ability to customize their configuration. Alternatively, businesses that need a simpler CRM integration may use one of the available partner integrations.

- Enter your CRM in the search box.  

- If your CRM is supported by a partner integration you can choose the **Use a partner** option and follow the directions in that workflow.

- Select your preferred partner.

- Click **Open instructions** for the respective partner to get directions for that workflow.

- Click **Go to partner** to proceed to the partner and begin the integration.

- Otherwise, proceed by choosing the **Manual code** option or the **Invite a developer** option, and click **Continue**.

**Note:** You will need Business Manager admin access to complete the integration.

