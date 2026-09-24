<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-aws-ecs-express/architecture | Saved: 2026-09-19 -->

# "Conversions API Gateway and Signals Gateway: AWS ECS Express Architecture"



Below is a diagram and a list of the main AWS resources and services used by the Conversions API Gateway or Signals Gateway on ECS Express, the number of instances created per resource or service type and, when applicable, their purpose.

The diagram and the list contain only the most important AWS resources and services used by the "Gateway Products" – Conversions API Gateway or Signals Gateway. Other AWS resources and services not listed here will be used by your instance.

The Conversions API Gateway diagram below shows the main resources instantiated and how they interact between them. The Signals Gateway also uses the same AWS services, however it connects events to Meta only when using the Meta Pixel and/or Conversions API Gateway pipelines.

## Component Details  

### Elastic Container Service (ECS) Express

[ECS Express](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/express-service-overview.html) is a fully managed feature of Amazon Elastic Container Service (ECS) that enables developers to rapidly launch containerized applications, including web apps and APIs, on AWS. It abstracts away the complexity of container orchestration, load balancing, and domain management, while still providing full access and control over the underlying infrastructure resources.

ECS Express Mode automatically provides an AWS domain name for each service, making applications immediately accessible over HTTPS. It incorporates AWS operational best practices, supports both public and private endpoints, and scales applications in response to traffic patterns. Traffic is distributed through Application Load Balancers. All resources remain accessible in your AWS account, allowing you to modify infrastructure as your needs evolve without disrupting running applications.

### DynamoDB

[DynamoDB](https://aws.amazon.com/dynamodb/) is a serverless, NoSQL, fully managed database service from AWS. The Gateway Products uses DynamoDB for storing configuration data for the instance. More details about the data is included in the [Configuration section](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-aws-app-runner/architecture#conversions-api-gateway-configuration-data).

### EventBridge Scheduler

[Eventbridge Scheduler](https://docs.aws.amazon.com/scheduler/latest/UserGuide/what-is-scheduler.html) is an AWS service that allows the creation of schedules for cron triggers. The Gateway products use Eventbridge Scheduler for cron triggers for periodic jobs like telemetry, backup, infrastructure updates, etc.

### Lambda

[Lambda](https://aws.amazon.com/lambda/) is an AWS service for serverless code execution. The Gateway products uses Lambda for multiple use cases:

* A custom resource during installation and uninstallation to execute custom provisioning and deprovisioning logic.
* When Eventbridge scheduler triggers Lambda, which further triggers the ECS Express service for telemetry and backup jobs.
* Infrastructure update management is also triggered using Lambda which subscribes to a SNS topic in a Meta-owned AWS account.

### Cognito

[Cognito](https://aws.amazon.com/cognito/) is a customer identity and access management service provided by AWS. The Gateway Products uses Cognito for user authentication.

### Codebuild
[Codebuild](https://aws.amazon.com/codebuild/) is a fully managed continuous integration service provided by AWS. The Gateway Products uses Codebuild for executing updates and maintenance on the instance.

### Cloudfront
[Cloudfront](https://aws.amazon.com/cloudfront/) is a CDN service provided by AWS. The Gateway Products uses Cloudfront as CDN and also as a reverse proxy for accessing the control plane and data plane container UI.

### Cloudwatch Logs

[Cloudwatch](https://aws.amazon.com/cloudwatch/) is a CDN service provided by AWS. The Gateway Products use Cloudfront as a CDN and also as a reverse proxy for accessing the control plane and data plane container UI.

### IAM
[AWS Identity and Access Management (IAM)](https://docs.aws.amazon.com/iam/index.html?fbclid=IwZXh0bgNhZW0CMTEAAR1GnvYBLyZEpQdojXGen-cc5qKNTHc08CZCvrp16CTmSUQRB5DFoMHr7-I_aem_AfrJhMMHyW5MA42_ntw4YfGpVSCKzvq-XPIIZcNLUQiouk03fpOsrCQ_b1S-Shsu4_0LwExzuvdBAALaWkkZ7Mml) is an AWS service that helps securely control access to AWS resources. IAM is used to control who is authenticated (signed in) and authorized (has permissions) to use resources.

### S3

[Amazon Simple Storage Service (Amazon S3)](https://aws.amazon.com/s3/) is an object storage service offering industry-leading scalability, data availability, security, and performance. The Gateway Products uses AWS S3 mainly for the automatic backup feature.

### Budgets
[Budgets](https://aws.amazon.com/aws-cost-management/aws-budgets/) is an AWS service for tracking costs and usage. The Gateway Products uses Budgets for cost monitoring for instance and providing alerts based on budget (for example, if a budget limit is exceeded). The default budget is set to $50 per month.

### AWS Certificate Manager (ACM)

[ACM](https://aws.amazon.com/certificate-manager/) is an AWS Service for provisioning and managing SSL/TLS certificates. The Gateway Products uses ACM to provision and attach a first-party domain certificate to Cloudfront.

## Data Flow and Storage  

The Gateway Products treat four types of data:

* Action (event) data sent by the Meta Pixel and only transiting the Gateway Products.
* Customer information sent by the Pixel and only transiting the Gateway Products.
* Gateway Products configuration data stored in the instance.
* Gateway Products logs stored in the instance.

### Data Received by the Gateway Products from the Clients

The data received by the Conversions API Gateway from the clients may consist of events and customer information. _These are not stored on the instance; they just transit the Gateway Products_ to be then sent to a configured destination.

### Gateway Products Configuration Data
The Gateway Products configuration data, detailed below, is stored in AWS DynamoDB and AWS Cognito. This data includes:

* Host users (email, password, permissions)
* SMTP configuration
* Accounts and respective access rights
* Users (email, password, permissions)
* Connected Pixel IDs and respective configuration details (activation status, publishing status)
* Pixel events names, volumes, and publishing status
* Website domains where the Pixels fire, domain allow list, and domain block list
* Data routing configuration

The Gateway Products are effectively a gateway to transition this data to a destination, and once sent, the data cannot be retrieved back or changed by the engaged Gateway Product owner.

### Gateway Logs

The Gateway uses the AWS Cloudwatch service to log installation and application running information. All logs have a retention period of 5 days to keep the costs of logging low.

Application logs are written for as long as the Gateway products software and resources are running. Application running logs include:

* User actions on the Gateway Products UI
* Software and resource usage logs

The AWS Cloudwatch service does not log any event or contact information.

## Telemetry

To learn more about telemetry, see [Conversions API System Health Information](https://developers.facebook.com/documentation/ads-commerce/gateway-products/host-management/system-health-information).

## Cost
The cost of the Gateway Products depends on the cost of the service and resource instances used. AWS provides a tool to estimate the cost of an implementation. For reference, see the [pricing calculator](https://calculator.aws/#/estimate?id=d9ea0ca70e8b2494350e018f3f279970b9181cc0) for processing 10 million events per month.

The cost information provided in this section are estimates obtained using the AWS pricing calculator in the **us-west-2 (Oregon)** region, and should serve as a reference. The actual cost of your instance may vary based on usage. AWS Free Tier pricing could also change the costs upwards or downwards. The default setup can only support up to 250 million events per month and [auto scaling](https://developers.facebook.com/documentation/ads-commerce/gateway-products/host-management/auto-scaling-limits) needs to be enabled to support higher load. Note that enabling auto scaling will not automatically bump up the prices, as compute capacity scales based on the number of events flowing through the system.

The estimated monthly base cost might look like the breakdown below based on different event volumes:

**Warning:** **Note**: the table shows estimated monthly cost @ us-west-2 (Oregon). Figures are in US dollars. The actual cost is determined by AWS and is subject to their pricing policies and changes. We assume no responsibility for the accuracy or fluctuations of these external costs.

| Resource Type | 10M events | 250M events | 2500M events |
| --- | --- | --- | --- |
| ECS Express data plane container fixed cost | 8.51 | 8.51 | 86.50 |
| ECS Express data plane container data transfer cost | 0.90 | 22.50 | 225 |
| ECS Express control plane container | 8.51 | 8.51 | 28.84 |
| S3 | 0.02 | 0.02 | 0.02 |
| DynamoDB | 0.53 | 0.53 | 3.49 |
| ECS scheduled task | 0.90 | 0.90 | 3.60 |
| Lambda | 0.38 | 0.38 | 0.38 |
| Eventbridge Scheduler | 0 | 0 | 0 |
| Cognito | 0 | 0 | 0 |
| Codebuild | 0.15 | 0.15 | 0.15 |
| Amazon Managed Service for Prometheus | 2.19 | 2.19 | 2.19 |
| Cloudwatch logs | 1.52 | 1.52 | 1.52 |
| Elastic Load Balancing | 17.13 | 39.79 | 250.03 |
| Cloudfront | 0.10 | 0.10 | 0.10 |
| ACM | 0 | 0 | 0 |
| Budgets | 0 | 0 | 0 |
| AWS Key Management Service | 1.00 | 1.00 | 1.00 |
| **Total cost** | **39.27** | **83.53** | **600.49** |

## Network and Security

### Allowed Network Traffic

The Gateway Products require the following inbound and outbound network traffic to work as documented. The default configuration only allows the required traffic. ECS Express provides inbuilt load balancer and access control which can't be changed. The only inbound access to ECS Express service is on port 443. We have a security group attached to the ECS cluster which doesn't allow any inbound traffic but allows outbound traffic so that telemetry can be sent to Meta in case of failures if telemetry consent is provided.

### Endpoints and In-Transit Data

The Gateway Products require the following inbound and outbound network traffic to work as documented. The default configuration only allows the required traffic.

Endpoints are secured via TLS and SSL, and in-transit data is encrypted. Gateway Products expose two internet-facing endpoints:

* HTTPS endpoint for receiving events from browsers
* HTTPS admin front end for administering the server

These endpoints are secured through TLS and by using an SSL certificate generated automatically during the server provisioning.  

## Learn More

- [Overview of Conversions API Gateway: AWS ECS Express](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-aws-ecs-express)
- [Custom Domain Setup](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-aws-ecs-express/set-up-domain)
