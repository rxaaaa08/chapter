<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-gcp/create-instance-agencies-partners | Saved: 2026-09-19 -->

# "Conversions API Gateway and Signals Gateway: Advertising Agencies And Partners"



Follow the steps below to set up a Conversions API Gateway or Signals Gateway instance for advertising agencies and partners from Google Cloud Platform (GCP) Cloud Shell.

## Installation from Cloud Shell {#direct-installation}

* Log in to your Google Cloud Platform (GCP) console using an administrator account.
* Open an ephemeral Cloud Shell session using [this link](https://shell.cloud.google.com/?cloudshell_image=gcr.io/cloudshell-images/cloudshell:latest&ephemeral=true).

* Click **Confirm** to open the Cloud Shell session. Then in the Cloud Shell terminal, type in either of the following commands to start the installation:

**Conversions API Gateway installation command**:

`bash <(curl -sL https://storage.googleapis.com/capig-prod-public-release/install-cloudrun.sh)`

**Signals Gateway installation command**:

`bash <(curl -sL https://storage.googleapis.com/sgw-prod-public-release/install-cloudrun.sh)`

Press **Enter** after the command to start the installation. If you see the following message prompting you to authorize the Cloud Shell, click **Authorize** to continue.

Once the installation starts, you will see the following installation guide.

* Follow the installation guide and input the required information, such as the GCP project to use, and the GCP region to use for the installation. After the required information is entered, the installation will start (see image below). A link to installation progress/Cloud Build logs is provided at the bottom of the screen.

* The installation process usually takes less than 10 minutes to complete. When the installation finishes, the summary section of the Cloud Build logs displays your instance onboarding guide link.

* Click the link to open the new instance and to create an admin account.

You can then log in to Conversions API Gateway or Signals Gateway to continue domain setup.

## See Also

* [Conversions API Gateway and Signals Gateway: GCP Architecture](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-gcp/architecture)
* [Conversions API Gateway and Signals Gateway: Create a Custom Domain for GCP](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-gcp/set-up-domain)
