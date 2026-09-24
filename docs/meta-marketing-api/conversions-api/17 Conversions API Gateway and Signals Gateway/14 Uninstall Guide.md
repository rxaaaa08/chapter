<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/uninstall | Saved: 2026-09-19 -->

# "Conversions API Gateway and Signals Gateway: Uninstall Guide"



Follow the steps below to uninstall the Conversions API Gateway or Signals Gateway.

## Amazon Web Services

1. Navigate to the installed CloudFormation stack for the Conversions API Gateway or Signals Gateway.

2. Press the **Delete** button (in the top navigation bar) to begin and follow the prompts to complete the uninstall process.

## Google Cloud Platform

1. Open the installation [Cloud Shell link](https://ssh.cloud.google.com/cloudshell/editor?cloudshell_tutorial=tutorial.md&cloudshell_image=gcr.io/cloudbridge-prod/capig-cloudshell/cloudshell-install:latest).

2. Run command: `bash <(curl -sL

https://storage.googleapis.com/capig-prod-public-release/uninstall-cloudrun.sh)` in the Cloud Shell terminal.

3. The current Gateway installations in your account will be listed. Select the one you want to delete.

4. Confirm the selection by typing in the installation name when prompted.

5. In the end, you will be asked whether you want to keep the storage bucket or not. The storage bucket stores backup files and related installation configuration.

You are required to delete the CNAME record associated with the instance and all CNAME records for each account created during the Data Routing setup process.

