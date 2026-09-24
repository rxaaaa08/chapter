<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-aws-ecs-express/set-up-domain | Saved: 2026-09-19 -->

# "Conversions API Gateway or Signals Gateway: AWS ECS Custom Domain Setup"



## 1: Domain Setup by ACM

### 1.1 Agency domain setup

#### Step 1: Launch Domain Management Page, and select AWS Certificate Manager

 

#### Step 2: Launch Domain Management Page

 

#### Step 3: Choose the data routing domain (required) and web access domain (required), and click 'Continue'

 

#### Step 4: Set DNS records in your DNS service (for example, Amazon route 53), and wait for the status to change to Complete.

 

#### Step 5: Wait until the domains are active.

### 1.2 Tenant domain setup

For tenants (accounts) that are created by the agency, they can create their own first party domains.

#### Step 1: Launch Data routing Page (Accounts settings - > Data routing).

 

#### Step 2: Click optimize button, and input the tenant domains.

 

#### Step 3: Confirm the domain. Set DNS records in your DNS service (for example, Amazon route 53), and wait for the status to change to Complete.

 

#### Step 4: Wait until the domain setup is complete.

 

## 2: Domain Setup by Cloudflare

### 2.1 Agency domain setup

#### Step 1: Choose Cloudflare as domain setup option.

 

#### Step 2: Follow the UI instructions to enter token and domain.

 

#### Step 3: Follow the UI instructions to enter token and domain.

### 2.2 Tenant domain setup

For tenants (accounts) that are created by the agency, they can create their own first party domains.

#### Step 1: Launch Data routing Page (Accounts settings - > Data routing).

 

#### Step 2: Set DNS records in your DNS service (for example, Amazon route 53) with a CNAME record of the tenant domain to the agency domain, and then input the tenant domain in the website.

 

#### Step 3: Wait until the domain setup is complete.

 

