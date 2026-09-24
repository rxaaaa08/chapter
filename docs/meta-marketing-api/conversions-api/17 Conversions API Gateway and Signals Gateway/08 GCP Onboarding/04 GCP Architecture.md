<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-gcp/architecture | Saved: 2026-09-19 -->

# "Conversions API Gateway and Signals Gateway: GCP Architecture"



The Conversions API Gateway and Signals Gateway work with both [Google Cloud Platform](https://cloud.google.com/) and [Amazon Web Services (AWS)](https://aws.amazon.com/). Below is a diagram and a list of the main cloud resources and services used by the solution, the number of instances created per resource or service type, and, when applicable, their purpose.

The diagram and the list contain only the most important cloud resources and services used by the "Gateway Products" (Conversions API Gateway or Signals Gateway). Other cloud resources and services not listed here will be specific to your instance.

The diagram below shows the main resources instantiated and how they interact.

### GCP Architecture

## Google Cloud Run Cluster and Related Services

Google Cloud Run is a serverless platform that allows you to run stateless containers in a fully managed environment.

* **Cloud Run**: Cloud Run services provide managed default domains to a Gateway instance. The Cloud Run services in Gateway instances are divided into Control Plane (for example, tenant management and domain management) and Data Plane (for example, event pipelines). Each service can have multiple instances managed by the auto-scaling limit setting.

* **Load Balancer** - Provides access from the internet to the service endpoints of the Gateway. While Cloud Run services have default internet-facing domains, the load balancer is used for advanced usage such as leveraging first-party domains and integrating with a Content Delivery Network (CDN).

* **Cloud Build** - A Cloud Build trigger is used to provide automatic infrastructure and software updates (enabled by default and can be turned off in the dashboard).

* **Pub/Sub subscription**: Used to connect to Meta-owned topics for receiving infrastructure and software updates.

* **Cloud Logging** - Installation and application logs are stored in the Google Cloud Logging service. The cloud logging service is also used to power the log-based metrics.

* **Cloud Storage** - Infrastructure configurations are stored in Google Cloud storage.

* **Firebase** - Firebase provides database services to the Gateway products.

## Domain Management for the GCP Architecture

A load balancer is a component in the Gateway products' infrastructure that helps distribute incoming network traffic across multiple servers. Using a load balancer can improve the application availability and responsiveness even during periods of high traffic.

In addition to load balancing, Meta also uses SSL/TLS certificates to encrypt data in transit between clients and the Gateway products. These certificates are issued whenever an agency sets up a domain for the instance or an advertiser sets up a first-party domain. Having an agency domain in the Signals Gateway instance improves the measurement performance and also reduces the cost to run the Signals Gateway instance. An advertiser would use the agency's domain by default if they have not set up the first-party domain. The advantage of setting up a first-party domain is that the Meta Pixel events are routed to a domain owned and controlled by the advertiser. Otherwise, the Pixel events flow for the advertiser but through the agency domain.  

There are two ways to set up the agency domain. The first is through a GCP load balancer and the second is through Cloudflare.

### GCP Load Balancer

This option is recommended if you need to enable first-party domain access to your Gateway instances and need to use CDN services. Currently, Signals Gateway supports up to 13 certificates directly on the load balancer, which means a maximum of 13 domains (one for the agency and 12 for hosted advertisers) can be supported directly on the load balancer

### Cloudflare

Cloudflare can be used to support more than 13 domains with the GCP load balancer. One of the key benefits of using Cloudflare is its ability to issue up to 5,000 SSL/TLS certificates for advertiser domains that point to an agency domain managed or owned by Cloudflare. It allows up to 5,000 advertisers per Gateway instance to use a first-party domain. Cloudflare requires a GCP Load Balancer.

## Gateway Configuration Data

The Gateway products' configuration data, detailed below, is stored in the cluster backed by Google Cloud Firestore.

### Google Cloud Firestore

Google Cloud Firestore (GCF) is a highly scalable and reliable database solution. It offers two capacity models: on-demand and provisioned. To maximize cost efficiency, GCF will utilize the on-demand model. This database will store all application data, ensuring consistency and safeguarding the information.

### Host-Related Data

* Host users (email, password, permissions)
* Host SMTP configuration
* Accounts and respective access rights

Host-related data is stored in the Gateway for as long as the instance exists. It is only accessible by host users.

### Account-Related Data

* Account users (email, password, permissions)
* Connected Pixel IDs and respective configuration details (activation status, publishing status)
* Pixel events names, volumes, and publishing status
* Website domains where the Pixels fire, domain allow list, and domain block list
* Data routing configuration

Account related data is stored in the Gateway for as long as an account exists in the instance. Each account's data is accessible by the users of that account and specific host users in case of a managed account.

The Gateway product is effectively a gateway to transition this data to Meta, and once sent, the data cannot be retrieved back or changed by the Gateway owner. The account users will be able to see those events (as per our current browser Pixel sending events directly to Meta) from the Events Manager.

The host does not have access to event data, unless granted by the account.

## Gateway Storage Bucket

The Gateway uses the Google Storage Bucket to store metadata of the cluster. The metadata will be used for uninstallation and infrastructure updates. The bucket is also used to store installation logs and other application related data. The bucket is named as: <cluster-base-name>-storage-bucket.

## Gateway Logs

The Gateway uses the Google Cloud Logging service to log installation and application running information.

### Instance Installation logs

Installation logs are written during the installation process. They can be found in the Gateway Storage Bucket. The installation log is stored as **install/cloud-init-output.log**. Installation logs can be helpful for debugging issues during installation.

### Application running logs

Application logs are written for as long as the Gateway software and resources are running. Application running logs include.

* User actions on the Gateway
* Software and resource usage logs  

How an Agency/Partner/Reseller treats this data if and after an advertiser leaves depends on the terms and conditions of their relationship.

## Telemetry

You can learn more about Gateway [telemetry here](https://developers.facebook.com/documentation/ads-commerce/gateway-products/host-management/system-health-information).

## Cost

The cost of the Gateway depends on the cost of the service and resource instances used. GCP provides a [tool to estimate the cost](https://cloud.google.com/products/calculator) of a certain implementation.

The cost information provided in this section is an estimation obtained using the GCP [pricing calculator](https://cloud.google.com/products/calculator) in a specific region (us-central1) and should serve as reference or guidance. The actual cost of your instance may vary.

### Base costs for up to 100 events per second processing capacity

The estimated monthly cost for a default Gateway installation in the us-central1 region might look like below, but you should check GCP for current pricing.

| Resource Type | Number of Resource Instances | Estimated monthly cost @ us-central1 |
| --- | --- | --- |
| Cloud Run vCPU (Instance Mode) | 1 | $46.60 |
| Cloud Run Memory(GB) | 1 | $5 |
| Cloud Run Requests |  | $0, Not charged for instance mode |
| Cloud Build | 1 | $0, First 120 builds-minutes per day are free |
| Cloud Logging | 1 | $0, First 50 GiB/project/month is free |
| Data transfer |  | See overview of data transfer costs |
| Firestore |  | $3 per month |
| Cloud Run | 1 | $0.5 per month for every 2.59 millions requests |
| Cloud CDN |  | [$0.0075 per 10,000 requests](https://cloud.google.com/cdn/pricing) |
| Cloud Storage Bucket |  | $0, 5GB per month free in [selected US regions](https://cloud.google.com/free/docs/free-cloud-features#storage). |
| **Minimum cost** |  | **$54** |

* If you changed the auto-scaling configuration to support higher event processing capability, each additional 100 events processing capability will cost about $10 per month.
* If you add more than one Meta Pixel, each additional cluster Pixel will cost about $0.03 per month.
* Firestore pricing will greatly vary based on the number of Pixels, tenants and your autoscaling configuration. The current pricing suggestion is only the base price for the smallest configuration.

### Base costs for up to 10 events per second processing capacity

The estimated monthly cost for a default Gateway installation in the us-central1 region might look like below, but you should check GCP for current pricing.

| Resource Type | Number of Resource Instances | Estimated monthly cost @ us-central1 |
| --- | --- | --- |
| Cloud Run vCPU (Request Mode) | 0.5 | $0, Covered by [free tier](https://cloud.google.com/run/pricing#services-requests-based-billing) |
| Cloud Run Memory(GB) | 1 | $0, Covered by [free tier](https://cloud.google.com/run/pricing#services-requests-based-billing) |
| Cloud Run Requests |  | ~$9.6 (23.92M billable requests after [2M free](https://cloud.google.com/run/pricing#services-requests-based-billing)) |
| Cloud Build | 1 | $0, First 120 builds-minutes per day are free |
| Cloud Logging | 1 | $0, First 50 GiB/project/month is free |
| Data transfer |  | See overview of data transfer costs |
| Firestore |  | $3 per month |
| Cloud Run | 1 | $0.5 per month for every 2.59 millions requests |
| Cloud CDN |  | [$0.0075 per 10,000 requests](https://cloud.google.com/cdn/pricing) |
| Cloud Storage Bucket |  | $0, 5GB per month free in [selected US regions](https://cloud.google.com/free/docs/free-cloud-features#storage). |
| **Minimum cost** |  | **$12.60. Could be less than $10 if requests are much less than 10RPS** |

* The calculation is based on the bursty nature of the requests, assuming the instance is only actively processing for about 10% of the month (roughly 259,200 seconds out of a 30-day month).

## Network and Security

### Allowed network traffic

The Gateway Products require the following inbound and outbound network traffic to work as documented. The default configuration only allows the required traffic.

| Source | Destination | Protocol/Port | Description |
| --- | --- | --- | --- |
| Gateway instance | 0.0.0.0/0 | All | Allow outbound connection to the internet from the Gateway Products to pass events to Meta and download packages from external repositories such as:<br><br>* Download software in Docker Containers from GCP Artifact registry.<br>* If opted-in to telemetry data transmission, periodically send telemetry data about your business' use/operation of its Gateway Products installation to Meta for monitoring and troubleshooting problems. |
| 0.0.0.0/0 | Gateway instance | TCP/80 | Allow inbound HTTP connection to the Gateway Product. This port is automatically redirected to TCP/443. |
| 0.0.0.0/0 | Gateway instance | TCP/443 | Allow inbound HTTPS connection to the Gateway Product. Used by browsers to send events through HTTPS. |

### Endpoints and In-Transit Data

The Gateway Product requires the following inbound and outbound network traffic to work as documented. The default configuration only allows the required traffic.

Endpoints are secured via TLS and SSL, and in-transit data is encrypted. Please see below. The Gateway Products exposes two internet-facing endpoints:

* HTTPS endpoint for receiving events from browsers
* HTTPS admin front end for administering the server

These endpoints are secured through TLS (TLS 1.2 and 1.3 are supported) and by using an SSL ([default cipher list](https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/configmap/?fbclid=IwAR0R4YA4xflu7TuHFOxYwiaPWuv-t5GegcDjna0AEISOhf9YIFs9pRab2Fk#ssl-ciphers)) certificate generated automatically during the server provisioning. The default certificate will be renewed automatically.

## See Also

* [Conversions API Gateway and Signals Gateway: Create an Instance for GCP](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-gcp/create-instance-agencies-partners)
* [Create a Custom Domain for Google Cloud Platform](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-gcp/set-up-domain)
