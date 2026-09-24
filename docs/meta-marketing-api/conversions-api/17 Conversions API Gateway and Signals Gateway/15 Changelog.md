<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/changelog | Saved: 2026-09-19 -->

# Changelog



The latest Conversions API Gateway and Signals Gateway version is: `v2.3.0`

## September 11, 2025
`v2.3.0`
#### Features:  

* Signals Gateway Pixel partner-based onboarding available during setup step. Advertisers can now choose their setup methods, including popular partners such as Google Tag Manager.
    * Google Tag Manager [detailed setup guide](https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway/pixel-setup-google-tag-manager) is also available
* Added pagination and search functionality for data sources, destinations, and pipelines in Signals Gateway, improving usability and making it easier to find and manage data elements.
* Custom conversions and website custom audience supported in Signals Gateway. We'll conduct matching and enrichment through rules configured in Events Manager, and also forward matched events to the Conversions API seamlessly. [Learn more](https://www.facebook.com/business/help/462806641140703?id=1205376682832142)

## May 15, 2025
`v2.2.0`
#### Features:  

* Improved Enhance Events feature to enrich events with additional possible user data.
* **Signals Gateway instance setup for partners**: We have added a setup flow for large partners' Signals Gateway instances from the Signals Gateway microsite.
* **Signals Gateway instance setup using Google Cloud Platform**: We have added a setup flow for Signals Gateway instances using Google Cloud Platform (GCP) from the Signals Gateway microsite.
* **Custom destination updates**: Our custom destination option now supports major providers.
* We have added post-general availability (GA) work items, our audience feature able to connect most major providers.
* **Support SDK Package Work**: We have updated our support for SDK packages to support audience creation, web2app and integration with Conversions API for Business Messaging.
* **Storage Capability Expansion**: We have expanded our storage capabilities to support new use cases.
* We have added support for automatic data uploads for instances using Google Cloud Platform.
* We have updated our enhanced event feature description.
* Helm chart optimization updates.
* We have added support for adding new Meta datasets and apps when connecting instances to Meta using Facebook Login to authenticate.

## March 6, 2025
`v2.1.0`
#### Features:  

* A streamlined installation process is now available for instances deployed using Google Cloud Platform, simplifying setup and reducing time to launch.
* Users can now onboard to Signals Gateway directly from Meta Events Manager, making it easier to integrate and manage event-driven workflows.
* Upon installation, a default domain is automatically created for new Google Cloud Platform instances, eliminating manual domain setup steps.
* New Google Cloud Platform instances now use Google Firestore as the backend database service, replacing MariaDB for improved scalability and reliability.
* SwakOps is no longer used in new Google Cloud Platform instances, simplifying the architecture and reducing operational overhead.
* Keycloak is no longer used for authentication in new Google Cloud Platform, Amazon Web Services Elastic Kubernetes Service, and AppRunner instances, streamlining identity management.
* Users can now select a file-based data source when creating or updating pipelines. This enables uploading and ingesting data files directly into Signals Gateway, expanding data integration options.

## January 15, 2025
`v2.0.0`
#### Features:  

* Signals Gateway is a product within your own cloud instance that collects, processes, and transmits advertiser's first-party data to their desired destinations. It offers built-in features and tools for collecting, processing, and transmitting signals from one or more data sources to various data destinations with no pre-defined data purpose.
* Signals Gateway utilizes a "data pipelines" concept, which allows advertisers to efficiently manage their data flow by incorporating multiple data sources and destinations into each pipeline.
* Signals Gateway provides robust data collection tools, including Signals Gateway Pixel and Signals Gateway SDK options, for seamless data capture directly into Signals Gateway data sources.
* The Audience Generation Feature allows advertisers to set rules for creating audiences from their data through existing data pipelines, enabling them to use these curated audiences for campaigns and customer segmentation analysis.
* The Meta Conversions API plugin enables advertisers to route data to The Conversions API for Meta advertising purposes, with components governed by Meta's Business Tool Terms.
* The Google BigQuery plugin will provide a dedicated data destination for connecting to Google Cloud BigQuery, allowing data flow into BigQuery for data analytics.
* The Custom HTTPS Destination can be used to stream events to a custom endpoint securely, through basic auth, Oauth or an API key.

## October 30, 2024
`v1.16.0`
#### Features:  

* We will provide Cloudflare and App Runner setup for both agency domains and tenant domains. **Note**: Customer needs a paid Cloudflare account if selecting Cloudflare setup.
* Automatic file events upload is now available at the overview page.
* Conversions API Gateway systems using AWS App Runner as their cloud provider are now able to use the automatic file upload feature which runs through async tasks.
* Onboarding Multiple Pixels from Events Manager. This feature enables users of Events Manager to choose multiple Meta datasets and set them up on both new and existing Conversions API Gateway systems.
* Cost monitoring tool. This feature will allow users with Conversions API Gateway systems using AWS App Runner as their cloud provider to monitor and set alerts for their cost usage.
* The Conversions API Gateway on App Runner uses Amazon-managed Prometheus to store time-series metrics that power the control plane UI, replacing AWS Timestream.
* PreInstallation Check. This feature aims to reduce the time to error discovery during installation.
* We have implemented first-party domain setup notification during system migrations, allowing users to easily track and manage their domain setup status. This update ensures that users are aware when their domain is successfully set up and ready for use after a migration, providing a seamless experience.
* App Runner based solution will allow creation of multiple accounts and optimized domains.
* App Runner based solution will allow domain management through AWS (up to 3 domains) and Cloudflare (up to 5,000 domains).
* Backup key encryption via KMS cloud service. Available on new installations.

#### Bug Fixes:  

* Fixed event enrichment in scaled environments for App Runner based CAPI Gateway.
* Fixed duplicated Meta Conversions API data pipeline can be created which causes double event counting displayed in the pipeline event activity.

## September 04, 2024
`v1.15.0`
#### Features:  

* OLM (operator lifecycle management) framework is no longer used in new installations. OLM was used to carry out system updates. Removing OLM has no visible system changes.
* Advertisers can migrate their data from one instance to another. This functionality includes data portability at both the system and account level.

## July 02, 2024
`v1.14.0`
#### Features:  

* SA EKS's UX change - SA EKS now is using the same UI as our MA EKS.

## April 30, 2024
`v1.13.0`
#### Features:  

* We now support up to 22 tenant first-party domains natively on the load balancer in the EKS based solution.

## January 30, 2024
`v1.12.0`
#### Features:  

* The **Settings** > **Updates** menu now provides a 'Download logs' button. With this button you will be able to download system logs for debugging.

## October 24, 2023
`v1.11.0`
#### Features:  

* User experience and functionality have been merged and improved for Conversions API Gateway and Conversions API Gateway for Multiple Accounts. Now newly installed Conversions API Gateway will have the same user experience and functionality.
    * Installing Conversions API Gateway from Events Manager is basically the same as installing with the AWS CloudFormation template provided in the developer document. The difference is that some information will be pre-populated in the Events Manager setup process and the pixel chosen in the Events Manager is connected by default.
    * When the custom domain routing is set up with Cloudflare, the newly installed Conversions API Gateway will work as Conversions API Gateway for Multiple Accounts.
* Improved Kubernetes implementation to have support for infrastructure lifecycle management to keep Conversions API Gateway instance on the latest optimized infrastructure
* Users don't need to provide email and password in AWS CloudFormation when creating an instance. Users will use an invitation link generated in the Outputs tab of AWS CloudFormation to create an admin account and login.
* In Conversions API Gateway for Multiple Accounts, Host account users have the ability to enable two-factor authentication using email when the SMTP is enabled. Once this feature is activated, individual users are given the option to enable two-factor authentication for their accounts if they so choose.

## September 11, 2023
`v1.10.0`
#### Features:  

* We have removed the requirement to specify a domain during installation for Conversions API Gateway for Multiple Accounts. Users will now get a temporary domain to log in to the Conversions API Gateway Admin UI for the first time and they will be prompted to create the host domain using CloudFlare when they log in.
* Conversions API Gateway for Multiple Accounts users can onboard additional pixels to the existing instance from Events Manager.
* The Manage accounts tab of the Conversions API Gateway for Multiple Accounts Admin UI now provides the Account issues dashboard to quickly find and monitor issues within onboarded accounts.

#### Bug fixes:

* We are disabling the update of any component other than Solutions Installer if Solutions Installer is not updated for the users who have automatic updates turned off. For the users who have automatic updates disabled, we want the Solutions Installer component to be updated first because other components' updates will fail unless the Solutions Installer is updated.

## July 24, 2023
`v1.9.0`
#### Features:  

* The **Enhance events with advanced matching data** feature is available for the EU region.
* The **Enhance events with advanced matching data** feature does not require a domain setup and now works with third party domains as well.
* For events with publishing turned off in the Conversions API Gateway Admin UI, we are now blocking those events from the browser to the Conversions API Gateway.
* Telemetry has been renamed to [System Health Information](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway/telemetry).

## May 24, 2023
`v1.8.0`
#### Features:  

* The GraphAPI version has been upgraded to v16.0.
* Meta Business Extension (MBE) enhancements:
    *     Single account setup will support MBE onboarding of additional pixels.
    * MBE has been enhanced to support bulk Meta Pixel onboarding for single-account and multi-account instances.
    * Activate and Deactivate option to control incoming events to Events Manager.
* The **Enhance events with advanced matching data** feature now supports Automatic Advanced Matching.
* Events blocked from the Conversions API Gateway will be synced to Meta using a public endpoint. Also, the pixel JavaScript code has been enhanced to block events from JavaScript itself at source.
* Conversions API Gateway for Multiple Accounts tenant usage information (last 24 hours) is available in the managed accounts dashboard and Control Plane API.

#### Bug fixes:

* Event activity UI pagination issue has been fixed.
* Database queries have been optimized to reduce memory usage.
* The bug causing wrongly formatted error code for event publishing errors has been fixed.
* Conversions API Gateway for Multiple Accounts telemetry issues have been fixed in large multi-account instances.

## April 17, 2023
`v1.7.0`
#### Features:  

* Automatic System Optimizations:
    * A new control, Automatic System Optimizations, has been added. Your Conversions API Gateway instance can enable new automatic system optimizations. This is an extension of Automatic Updates and defaults to enabled if Automatic Updates are enabled
* Conversions API Gateway for Multiple Accounts Control Plane API is generally available for users to programmatically manage accounts, data sources and users.
* Support changing auto scaling configuration post installation in the Conversions API Gateway for Multiple Accounts.
    * Previously, the auto scaling configuration could be set during installation but there wasn't a provision to update it from the Conversions API Gateway UI. Now we are providing the capability to change auto scaling configuration post installation in the Conversions API Gateway for Multiple Accounts.
* Automatic backup functionality is enabled by default to allow for disaster recovery of the system. It can be disabled from the Conversions API Gateway UI if required.

#### Bug fixes:

* **Enhance events with advanced matching data** now only tracks known advanced matching parameters.

## January 26, 2023
`v1.6.0`
#### Features:  

* **Enhance events with advanced matching data**: Your Conversions API Gateway instance can store hashed manual advanced matching data in first-party cookies on your website and send it with your events to the Conversions API. This feature can help you attribute more conversions and show your ads to people that find them relevant. [Learn how to set up manual advanced matching.](https://developers.facebook.com/docs/meta-pixel/advanced/advanced-matching)
**Note**: This feature is currently not available for advertisers and Conversions API Gateway instances in the European Region.
* The Conversions API Gateway will provide an API endpoint which allows advertisers to send non-web events to Meta using the Conversions API Gateway directly from their Server.
* Batch upload feature is now available in the Conversions API Gateway Admin UI. It allows admin users to upload events manually via CSV template.
* Automatic updates allow system software to be updated to the latest version and system restarts to recover from issues.
* **Enhance events with Facebook Login ID**: If you are using [Facebook Login for Web](https://developers.facebook.com/documentation/facebook-login/web), you can help improve your Event Match Quality by allowing [customer Facebook Login IDs to be automatically included with events data](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway/include-facebook-login-data) in your Conversions API. [Learn more about Customer Information Parameters.](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/customer-information-parameters)

## October 25, 2022

#### Features:  

* The Conversions API Gateway Admin UI will support pagination for listing more than 20 events in the Overview section.
* The Conversions API Gateway Admin UI will start supporting:
    * Enabling and disabling of Pixel IDs which will block the events flowing from Pixel on website to the Conversions API Gateway. (Note: Disabling will not block Pixel event being fired directly from website to Meta).
    * Enabling and disabling of publishing of all the events from the Conversions API Gateway to Events Manager.
    * Activate and Deactivate option to control incoming events to Events Manager.

#### Bug fixes:

* Creating S3 bucket steps will be removed from the Cloudformation template. Also, no S3 permission will be required.
* The following commands are now deprecated from the shell:
    * Command for Pixel configurations of **EventBridge** and **ConversionsApi**
    * _event-sources_ command
* Optimized metric collection and querying from Prometheus to:
    * Improve performance
    * Reduce resource consumption

## July 14, 2022

#### Features:  

* On Conversions API Gateway, we now show the timestamp corresponding to when the software version was updated.
*  As of 1.4.0, AWS S3 bucket is created during the installation process. That S3 bucket serves as the storage for automatic configuration backup. Its access is controlled by the IAM role and strictly limited to the usage by the Conversions API Gateway instance.

#### Bug fixes:

* Updated the Cloudformation template to enforce EBS encryption.

## June 6, 2022

#### Features:  

* The Conversions API Gateway will now support the IPv6 capability of AWS. Advertisers need to disconnect and re-install the Conversions API Gateway v1.3.0 or later if they want to use the IPv6 capability.
* Creation of new Lambda function in AWS: this Lambda function is invoked only during installation of Conversions API Gateway to get the IPv6 address assigned to the EC2 instance. Its access is controlled by the IAM role and strictly limited to the usage by the Conversions API Gateway instance.
* For advertisers who switch to v1.3.0, the Conversions API Gateway will provision and install a new Virtual Private Cloud (VPC) instead of using the default VPC and:
    * The Conversions API Gateway will be installed in the Public subnet of the new VPC.
    * Advertisers using IPv6 need to create an additional AAAA DNS record pointing to the IPv6 address of the EC2 instance.
* Provisioning Web UI change: the "Click to Conversions API Gateway" button is now removed. Customers are prompted to go back to Events Manager to complete setup.

#### Bug fixes:

* Added log rotation for the Conversions API Gateway log and System log.
* Fixed the issue of UI not loading for a few advertisers.
* Only `GET` requests are supported by the image pixel endpoint

## March 29, 2022

#### Features:

* This version of the Conversions API Gateway gives users the ability to configure events in the Admin UI and choose which domains should or should not be published to the Conversions API.
* For advertisers with Active Telemetry turned on, AWS CloudWatch will now reflect the telemetry data they send to Meta.
* Original IP addresses are now restored by default. Web infrastructure providers, for performance reasons, often change original user IP addresses and store them in a custom header field. This update enables the web server on the Conversions API Gateway to restore original IP addresses from the custom header. Learn more about restoring original IP addresses [here](https://support.cloudflare.com/hc/en-us/articles/200170786-Restoring-original-visitor-IPs).

## February 2, 2022

#### Features:

* Enabled automatic Conversions API Gateway updates to give users access to the latest security and performance optimizations as they're released.
* Enabled keycloak integration for security and user authentication.
* Fetched additional attributes in active telemetry like pod restart count, ingress certificate status to troubleshoot performance and stability issues.

#### Bug fixes:

* Fixed an issue with MicroK8s Snap installation.
* Fixed a compatibility issue with Meta Pixel requests. Now Conversions API Gateway is compatible with Pixel data where additional fields are supplied by advertisers.

## December 30, 2021

#### Features:

* Added a command-line interface (CLI) command to delete and recreate the default SSL certificate manually.

#### Bug Fixes:

* Fixed an issue where some default SSL certificates were not being auto renewed.

## November 17, 2021

#### Bug Fixes:

* Fixed broken or slow management metrics UI due to querying metrics for a few advertisers.

## November 3, 2021  

The following changes were created:

#### Features:

* Added Custom AMI for provisioning stability. This may improve installation time by up to 25%
* Improved Hub Shell help commands
* Added new CloudFormation parameter to confirm AdminPassword

#### Bug fixes:

* Fixed an issue for AdminPassword that begins with special characters
* Fixed an issue for adding multiple Pixels from EM add-Pixel flow.

## September 23, 2021  

The Conversions API Gateway is publicly available now.

#### Key features/capabilities:

* This version of Conversions API Gateway allows you to deploy a service environment to your Amazon AWS cloud that will allow you to forward conversion events from Meta Pixel to Conversions API endpoints on Facebook.
* Please refer to the [Help Center documentation](https://www.facebook.com/business/help/387152639648383?id=818859032317965) for more detailed information on features included in this release and how to activate Conversions API Gateway in Events Manager.

#### Changelog:

* This is the first version.
