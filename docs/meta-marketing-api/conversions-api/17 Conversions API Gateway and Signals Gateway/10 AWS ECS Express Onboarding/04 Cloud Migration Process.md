<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-aws-ecs-express/ecs-express-migration | Saved: 2026-09-19 | Converted from the web page: Meta's "View as Markdown" export returns an error for this page -->

# Cloud Migration Process: AWS EKS and App Runner to AWS ECS Express

Move your infrastructure to AWS ECS Express for two reasons:

* AWS has [ended support for Amazon Linux 2 (AL2)](https://docs.aws.amazon.com/eks/latest/userguide/eks-ami-deprecation-faqs.html), which blocks EKS version upgrades — EKS instances are capped at **Kubernetes 1.33**. AWS [standard support for 1.33 ended on July 29, 2026](https://docs.aws.amazon.com/eks/latest/userguide/kubernetes-versions.html), so these clusters are already running out of support and cost 6 times as much.
* AWS has [deprecated the App Runner service](https://aws.amazon.com/apprunner/). ECS Express is the replacement and has long-term support from the AWS team.

**Note**: Meta is directly driving the migration for some EKS and App Runner instances. If Meta migrates your instance, you may need to set up your first-party domain again once the migration completes. For instructions, see [Custom Domain Setup](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-aws-ecs-express/set-up-domain).

Migrating to a new cloud environment using AWS ECS Express involves three steps:

* **Create an AWS ECS Express cluster.**
* **Migrate pixel, tenant, and user configuration** to the ECS Express cluster.
* **Manually set up the domain** for the cluster and the advertiser domain. A fallback domain handles event routing during the switch, so no events are lost during domain migration.

## Step 1: Create an Instance Using AWS ECS Express

To migrate your infrastructure, first deploy a new stack supported by ECS Express in your AWS account. Use the CloudFormation template for your product:

* Conversions API Gateway: `https://conversions-api-gateway-release-production.s3.amazonaws.com/gateway-2.7.0.ecs.yaml`
* Signals Gateway: `https://signals-gateway-release-production.s3.us-west-2.amazonaws.com/gateway-2.7.0.ecs_sgw.yaml`

Then configure scaling by following [Auto-scaling limits](https://developers.facebook.com/documentation/ads-commerce/gateway-products/host-management/auto-scaling-limits).

## Step 2: Initiate Migration

Once your new instance is successfully deployed, you will be able to log in to a newly created Conversions API Gateway and will see a prompt asking you to start the migration. Click the **Migrate** button to begin.

If you don’t see the prompt upon login, navigate to **Settings** > **Migrations and backups** in the left-hand menu.

![Your move is almost finished dialog prompting you to start migrating account settings and data, with Cancel and Migrate buttons](https://scontent.fmaa14-1.fna.fbcdn.net/v/t39.2365-6/449686355_783461160292968_6876818968799612120_n.png?_nc_cat=105&ccb=1-7&_nc_sid=e280be&_nc_ohc=dqI0USQQZuUQ7kNvwHszDG6&_nc_oc=AdpNQFB0rssuBWDSc6d80Ym5C5klEgTammC3zlIixZnE9vZ30SB_8TqUFEVno7y02cSgwFumIU8nrT4h4xifO-Ad&_nc_zt=14&_nc_ht=scontent.fmaa14-1.fna&_nc_gid=tNa6nbvuskiqjZL2NJOidw&_nc_ss=70289&oh=00_AQKQxjQXHtzGwlZlpq33o287F1dK-kOrKxx-FzyoyAOVgA&oe=6AC8E19E)

Click on **Start migration**.

![Migrations and backups page with the Import data from a different cloud environment panel and a Start migration button](https://scontent.fmaa14-1.fna.fbcdn.net/v/t39.2365-6/449361988_917155630098347_1988669094440353133_n.png?_nc_cat=107&ccb=1-7&_nc_sid=e280be&_nc_ohc=TePycq6gHVwQ7kNvwGqnVNB&_nc_oc=AdpT95RwATuF0xDL44Yp07HMmZDCdQVy1wBs8R9xmS82EbFEK2ConzttGHhfM49OYYWS-KMrLRpLoKd3-4GRZj59&_nc_zt=14&_nc_ht=scontent.fmaa14-1.fna&_nc_gid=tNa6nbvuskiqjZL2NJOidw&_nc_ss=70289&oh=00_AQKOGIM1uiiBdr-txI5qV6crL2YgJcLGAB5cmWCB-6pe3g&oe=6AC8B3DB)

## Step 3: Follow the Instructions in the Migration Tool

This will open the first step in the migration process. Enter the URL, admin login ID, and admin password for the AWS EKS or App Runner instance you wish to migrate (the origin account) and click **Continue**.

![Enter credentials step of the migration tool with fields for the origin Conversions API Gateway URL, Admin login ID, and Admin password](https://scontent.fmaa14-1.fna.fbcdn.net/v/t39.2365-6/449359718_1691110038316754_3459160528618836279_n.png?_nc_cat=111&ccb=1-7&_nc_sid=e280be&_nc_ohc=jaP6iYnGskcQ7kNvwHANFX0&_nc_oc=AdrDm5uaBZWgDbIsHh1LJJOBkkRxx418LQgZ6SFXWDypP9IN_Bj1Jrph7zEdmd8V0xMBZenxseXR9RmJbDz7HTy6&_nc_zt=14&_nc_ht=scontent.fmaa14-1.fna&_nc_gid=tNa6nbvuskiqjZL2NJOidw&_nc_ss=70289&oh=00_AQJZZ5wOm5mLbt7z8wwL0EsELuuIfjH1pNDyWRduDRLIdw&oe=6AC8E745)

Your migration will automatically start in the background and you can leave the screen.

![Migration tool gathering data for the account with a loading spinner, noting the process may take a few minutes](https://scontent.fmaa14-1.fna.fbcdn.net/v/t39.2365-6/449212684_1597132984572943_6108378046660696350_n.png?_nc_cat=104&ccb=1-7&_nc_sid=e280be&_nc_ohc=qA_jjce9hMcQ7kNvwHV-pdR&_nc_oc=Adp1nDfilAdWWl4c5CFVpYp8iQCWBRozvf_gC2xrkvUPaCv72-yOwAwTpw2h4lw4eRpFYYpiRfjqaVyHJjMG5K7K&_nc_zt=14&_nc_ht=scontent.fmaa14-1.fna&_nc_gid=tNa6nbvuskiqjZL2NJOidw&_nc_ss=70289&oh=00_AQJNo8CSiJPKjMnfzWzw9XDiQ8Npp-lXsVjhAMYfyREW-g&oe=6AC8E203)

Go to the **Settings** > **Migrations and backups** page to track the migration status.

![Migration status step showing a Migration in progress table of accounts with Migrated, In progress, and Failed data migration statuses](https://scontent.fmaa14-1.fna.fbcdn.net/v/t39.2365-6/449358852_456546207117219_1443236126990945546_n.png?_nc_cat=109&ccb=1-7&_nc_sid=e280be&_nc_ohc=gpjRCiEoI18Q7kNvwGDiF21&_nc_oc=AdqHY-nT7lDCo2ZuqQ4PJDl044Jf7ukW7nNyxhccAWQdXgxeaE3M0V2GZ0BkMaSey7Dlp9Yi4J2DGBjtOONHDvE0&_nc_zt=14&_nc_ht=scontent.fmaa14-1.fna&_nc_gid=tNa6nbvuskiqjZL2NJOidw&_nc_ss=70289&oh=00_AQI8Bce-FtY3XqkLn_VSwNNnrGFLJ1ZGkJapKps_xDZpsg&oe=6AC8DBAA)

Once your migration is completed, set up a custom domain for data routing as described in Step 4. You can then delete the previous setup.

![Cloud migration is complete dialog confirming data and settings migrated successfully, with Next steps and a Done button](https://scontent.fmaa14-1.fna.fbcdn.net/v/t39.2365-6/449688208_413591778336943_2449681969868688044_n.png?_nc_cat=105&ccb=1-7&_nc_sid=e280be&_nc_ohc=Oa_bELGLWdcQ7kNvwFYkNmj&_nc_oc=AdpsexWhlCKo0-ZKh-UhbRpK3EV6_cWbtHTzwGc3fqpefuuzUkevaa6nKuWWjDH0KLjEJ8Co-NfmmVvkMdQwvqlD&_nc_zt=14&_nc_ht=scontent.fmaa14-1.fna&_nc_gid=tNa6nbvuskiqjZL2NJOidw&_nc_ss=70289&oh=00_AQJqI0_eteRP0LnKopZBmF9PMYSWUsuoPa4wK8zlzfQ9Jg&oe=6AC8E4CC)

## Step 4: Domain Setup

There are two options for setting up a domain on ECS Express: Cloudflare and AWS Certificate Manager. How your domain is managed dictates which SSL solution to use:

* **Cloudflare**: Preferred if the domain is currently managed by Cloudflare. See [Domain setup by Cloudflare](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-aws-ecs-express/set-up-domain#2--domain-setup-by-cloudflare).
* **AWS Certificate Manager (ACM)**: Used otherwise. See [Domain setup by ACM](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-aws-ecs-express/set-up-domain#1--domain-setup-by-acm).

**Note:** ACM supports up to 22 tenant domains by default. To expand this to 97, request an increase to the AWS certificates per load balancer quota, from 25 to 100.

## See Also

* [Conversions API Gateway and Signals Gateway: AWS ECS Express](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-aws-ecs-express)
* [AWS ECS Express Architecture](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-aws-ecs-express/architecture)
* [Custom Domain Setup](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-aws-ecs-express/set-up-domain)
