<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/conversions-api-gateway/setup | Saved: 2026-09-19 -->

# "Conversions API Gateway: Setup Guide"



Use the following steps to set up the Conversions API Gateway.

Please ensure you have reviewed and completed the [prerequisites for the Conversions API Gateway](https://developers.facebook.com/documentation/ads-commerce/gateway-products/configuration#prerequisites) before you go through this setup guide.

## Step 1: Get Started and Begin Deployment {#step-1}

To begin the setup process, navigate to the Settings tab within Meta Events Manager. Under "Set up with Conversions API Gateway", click on **Get started**.

* Review the prerequisites for the Conversions API Gateway and then select **Next**.

### Select Preferences

* Choose the settings you'd like to enable and then click **Continue**.

*     Enhance events can help to improve conversion attribution and maximize the performance benefits of events you currently share with Meta.
* Conversions API Gateway health monitoring enables Meta to more effectively troubleshoot potential problems.

* Choose your desired cloud setup from the available options.

* Next, under **Select your hosting region**, choose your desired region. You can only set up the Conversions API Gateway in one region.
* Click **Next** to open up Amazon Web Services (AWS) or click **Copy URL** to send to your organization's AWS account administrator.

## Step 2: Configure AWS and Install {#step-2}

Log in to AWS if you have not already done so.

* A quick creation flow for the Conversions API Gateway stack will open.

* All fields will be pre-populated. Please don't change the `ProvisioningData` field.
* Click **Create stack** to begin the installation.
* The creation process takes approximately 30 to 40 minutes, after which three outputs will be written to the "Outputs" tab for the new AWS instance. You will know it is done when the Status says: **CREATE_COMPLETE** in the Stack info Tab.  
* Once complete, go to the Outputs tab.
* **(Recommended)** Create a custom domain to help data routing, see [step 4](#step-4) below.
* Take note of the `CapigSetupURL`, which you will need to provision the Conversions API Gateway UI.

## Step 3: Verify Data Collection {#step-3}

To access the **Conversions API Gateway Admin UI**, use the CapigSetupURL within the Outputs tab (reference [step 2](#step-2)). The `CapigSetupURL` can also be found within Events Manager.

* You will be asked to create an admin account at the first login to the Admin UI
* Select **Log in** after creating an admin account
* You will see the Conversions API Gateway Admin UI site.  
* When you first view the site, the server and browser data may be at 0. This information should take 5 minutes to 2 hours to populate.
* To check if the data is being collected, you can go to your website and refresh the page.
* If events do not populate after 2 hours, please contact Meta.
* You should now see Conversions API Gateway under your pixel settings.

## (Recommended) Step 4: Add Custom Domain {#step-4}

Set up a custom domain within the Conversions API Gateway Admin UI.  A custom domain is recommended as it may help optimize data routing and may reduce costs.

**Note**: You will need access to your DNS provider to add a custom domain

* Log into the Conversions API Gateway Admin UI.
* Navigate to **Domain management** on the left sidebar under **Settings**.
* Choose between DNS provider AWS Certificate Manager (ACM) or Cloudflare.

### 1. AWS Certificate Manager

Please follow the [ACM Setup instructions](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-aws-eks/set-up-domain#domain-setup-with-acm) to finish setup.

### 2. Cloudflare

Please follow the [Cloudflare Setup Instructions](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-aws-eks/set-up-domain#domain-setup-with-cloudflare) to finish setup.

## Troubleshooting Setup Issues {#troubleshoot-setup}

Use these steps to troubleshoot issues when you set up the Conversions API Gateway. For general troubleshooting, see [Conversions API Gateway - Troubleshooting Errors and Warnings](https://developers.facebook.com/documentation/ads-commerce/gateway-products/troubleshooting-guide).

### Browser Autocomplete Interferes With Setup {#autocomplete}

If you can't install the Conversions API Gateway because of expired provisioning data, even though you launched the installation from Events Manager, the browser autocomplete feature might be automatically populating previously used information.

#### Diagnostics

1.    Launch installation from Events Manager and save the provisioning data for later examination.  
1.    Click **Copy URL** and save the copied URL to any text editor such as Notepad.
1.    Click **Begin deployment** to launch the AWS creation page.
1.    On the AWS creation page, find **ProvisioningData** and verify that the entry matches the URL that you copied previously.  If they don't match, autocomplete is on and you must turn it off.

#### Resolution

For FireFox browsers, use the following steps:

1. Click the Firefox menu icon (three bars at the top right of the screen).
1. Click on Settings.
1. Select the **Privacy & Security** settings.
1. Scroll to **History** and choose **Use custom settings for history**.
1. Unselect **Remember search and form history**.
1. Your changes are saved automatically.

For Chrome browsers, use the following steps:

1. Click the Chrome menu icon (three dots at the top right of screen).
1. Click on Settings.
1. Select the **Autofill** settings.
1. Expand the appropriate area.
1. Toggle the autofill setting off.
1. Your changes are saved automatically.

## Additional Configurations {#additional-configurations}

Events Manager allows you to add new connections, configure additional domains and add new Pixels to your existing Conversions API Gateway connection. To define these, please follow the below steps:

Click on **Partner Integrations**, which appears on left side of page:

Select **Conversions API Gateway** to open the Conversions API Gateway.

In this screen you can view:

- **Website events**

- Events are website actions that are set up on your Conversions API Gateway site and are separately being sent to Meta using the [Meta Pixel](https://www.facebook.com/business/help/742478679120153?id=1205376682832142).

- **Website domains**

- Websites your Conversions API Gateway is configured to connect with through the Pixel.

Click on the **Settings** and select the action you would like to take.

### Adding Another Conversions API Gateway Connection

This allows you to set up a new Conversions API Gateway instance with another Meta Pixel. Below shows the first step in the dialog, similar to the one from the Meta Pixel settings page. Next, you will be asked to select a Meta Pixel for the installation of your new Conversions API Gateway connection.

### Adding Another Meta Pixel to an Existing Conversions API Gateway Connection

This option allows you to onboard another Meta Pixel on an existing Conversions API Gateway installation.

To begin the  setup process, navigate to the **Settings** tab within Events Manager. Under the section "Existing Conversions API Gateways", click the **Connect** button:

## See Also

* [Conversions API Gateway - Post-Setup Management](https://developers.facebook.com/documentation/ads-commerce/gateway-products/host-management/post-setup-management)
* [Conversions API Gateway - Troubleshooting Errors and Warnings](https://developers.facebook.com/documentation/ads-commerce/gateway-products/troubleshooting-guide)
