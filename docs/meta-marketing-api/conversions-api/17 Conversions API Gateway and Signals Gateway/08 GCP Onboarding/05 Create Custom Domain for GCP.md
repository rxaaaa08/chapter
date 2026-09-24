<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-gcp/set-up-domain | Saved: 2026-09-19 -->

# "Conversions API Gateway and Signals Gateway: Domain Setup in GCP"



When you set up your Conversions API Gateway or Signals Gateway, a data routing domain will be automatically generated during your setup process. Creating a custom domain for your Gateway Product will let you route event data to your account directly from a server, which may help improve measurement performance.

Follow the steps below to set up a custom domain for a Gateway Product setup that hosts multiple accounts.

## Domain Setup Option Selection

After connecting a Meta business portfolio, you will be directed to the Domain management page, or you can navigate to the page using the left sidebar under Settings.

On this page, you can choose whether to use GCP Load Balancer or Cloudflare.

If you anticipate fewer than 13 domains will be set up on your Gateway Product account, we recommend GCP Load Balancer.

If you anticipate supporting more domains, Cloudflare has the capacity to support more domains.

If you are unsure, we recommended that you select GCP Load Balancer. Once you choose GCP Load Balancer, you will not be able to select Cloudflare as a provider.

### Option A: Set Up Domain Using GCP Load Balancer

Choose the GCP Load Balancer method. Then enter a domain.

Click **Continue**. Make sure you have control of the domains, then **Confirm** the domain.

Follow the instructions on the next page to set up your DNS records:

Set DNS records in your DNS service (for example, Amazon route 53), and wait for the status to change to **Complete**.

When the domain becomes active, you will see the below screen.

### Option B: Set Up Domain Using Cloudflare

Choose the Cloudflare method

Navigate to the Domain Management page. Review the instructions and requirements, then click the **Get started** button at the bottom of the page. In order to complete the setup process, you'll need:

* A Cloudflare account with admin access.
* Admin access for your cloud platform account.
* 30 minutes to complete the process.

Choose a Cloudflare setup method. We recommended that you select the option to register a new domain and use it with Cloudflare. Choose the option you'd like to select.

### Option 1: Register a new domain and use it with Cloudflare

Select this method if you need to set up a new Cloudflare account and a new domain for custom data routing.

### Option 2: Use an existing Cloudflare account

### Option 3: Use an existing domain

### Use a domain from another provider with Cloudflare.

Select this method if you have a domain registered with another provider (such as Godaddy or AWS Route 53) and want to use it with Cloudflare.

On the next page, you'll find instructions for how to proceed on Cloudflare, depending on your selected setup method.

Next you will start the Cloudflare setup process.

Follow the instructions in the Gateway Product UI to set up Cloudflare.

The admin can now add host users to the Gateway instance or create advertiser accounts.

## First Party Domain Setup

**Step 1**: Go to Data Routing Section under Gateway Product

**Step 2**: Click on Optimize. (_Note: This button is only available if you have set up your agency domain_)

**Step 3**: Enter the domain name and click **Continue**:

**Step 4**: Click **Confirm**

**Step 5**: Setup CNAME record from the first-party domain to the agency domain

**Step 6**: Once the CNAME record is verified, domain setup is complete

## See Also

* [Conversions API Gateway and Signals Gateway: Create an Instance for GCP](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-gcp/create-instance-agencies-partners)
* [Conversions API Gateway and Signals Gateway: GCP Architecture](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-gcp/architecture)
