<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/troubleshooting-guide | Saved: 2026-09-19 -->

# "Conversions API Gateway and Signals Gateway: Troubleshooting Guide"



## Troubleshooting Steps for the Host

Use the troubleshooting steps in sequence for your Gateway Products, Conversions API Gateway or Signals Gateway as below, to help resolve the issue.

## Gateway Products Health-Check Endpoint

Go to:

```
https://<Gateway Products Endpoint>/hub/health/
```

The host is able to monitor the instance's server status through this health-check service.

## Issue 1: The host Gateway UI is inaccessible or does not show any information

**Step 1**. Use an online DNS checker, such as https://dnschecker.org/, to verify if the Gateway domain is resolved to the right IP address provided in the instance setup and is fully propagated. If not, wait for some time for the DNS to be fully propagated and make sure that you have created a CNAME record in your domain registrar.

**Step 2**. The network could be temporarily inaccessible - wait for a few minutes to log in again to the Gateway Product UI or refresh the page.

**Step 3**. The instance's resources could be insufficient. Terminate the pods to release resources by following these steps:

* Connect to the Session Manager and run command kubectl delete deployment capig to terminate the Gateway Product pod(s).
* Wait for 5 mins, then run command kubectl get pods -A. All pod statuses should be either Running or Completed.
* If not, run command kubectl delete deployment hub to terminate Hub pod. Repeat the step above

**Step 4**. Uninstall and reinstall the instance if this is a new instance.

**Step 5**. Share with your Meta contact (if applicable)

* Gateway Product logs
* These can be downloaded from the /hub/settings/updates page by clicking on the "Download logs" button.
* Screenshot of the host Gateway UI tool where the error is occurring.

## "Error 400: Identity Pool does not exist (myproject-3-XXXXX.svc.id.goog)" occurs during the GCP host onboarding

This error usually occurs because you have not created a Google Kubernetes Engine cluster in your GCP account and it takes time for some underlying resources to be created the first time. You should use the [uninstall script described in the Uninstall guide](https://developers.facebook.com/documentation/ads-commerce/gateway-products/uninstall) to clean up the installation and retry a new installation.

## CloudShell session timed out during the GCP host onboarding

If a CloudShell session is left unattended for a long time, the CloudShell terminal could be disconnected. Even in this case, the installation may have already been completed. To check the installation instructions, please open the GCP Cloud Storage page, and look for a bucket named capig-{your_login_id}-XXX-storage-bucket. There is a file named capig-onboarding-guide.txt. Please open the file and follow the instructions provided.

## Troubleshooting Steps for the Account: Connecting to the Gateway

Follow the troubleshooting steps as below to help resolve the issue:

### Issue 1: Unable to Finish Installation

Make sure to have followed all the steps as detailed in the onboarding guide. If you're still blocked, reach out to your Meta point of contact with a clear description, or even better a screenshot, of the issue.

### Issue 2: The Gateway UI Is Inaccessible or Does Not Show Any Information

**Step 1**. Check if the network is temporarily down. Wait for a few minutes to log in again to the Gateway Product UI or refresh the page.

**Step 2**. Share with your Meta contact (if applicable)

* Gateway Product logs
* Screenshot of the Console from developer's tool of the host Gateway UI where the error is occurring

### Issue 3: Not receiving Gateway Events after Installation Is Completed

**Step 1**. Websites could be blocked. By default, any websites receiving events from Pixels associated with your Gateway Products are permitted to receive and publish events. Only blocked websites will be prevented from receiving and publishing events

#### Diagnostics

Open your Gateway Product UI, and select Websites -> Blocked Websites from the left-side menu.

#### Resolution

Unblock any websites that you would like to receive and publish events.

**Step 2**. Pixel may not be installed in a standard way. For the Gateway Products to function properly, we recommend adding the Pixel directly to your website's `<head>` tags.

#### Diagnostics

* Check if the pixel is installed according to the guidelines mentioned in the Resolution section.
* Check if the events were configured using the Event Setup Tool. Currently, the Gateway Product does not support tracking events which are configured using Event Setup Tool.

#### Resolution

* Install the base code for the pixel
    * For Meta Pixel, see [these instructions](https://developers.facebook.com/docs/meta-pixel/get-started#base-code)
    * For Signals Gateway Pixels, the instructions are in the Data Source details modal
* In addition, implement the conversion tracking code if you would like to track conversions. Make sure that the base code is already installed on every page where you want to track conversions.

**Step 3**. DNS configuration may be incomplete or incorrect. The pixel communicates with the Gateway on a domain proper to this communication, ideally the same as the page where the pixel fires. For example, if the pixel fires on advertiser.com, ideally the Gateway will be reachable by the pixel on gateway.advertiser.com.

A subdomain of the account's domain (the domain where the pixel fires) needs to be associated to the host subdomain through a CNAME record on the advertisers's DNS provider, so that the Gateway Product endpoint can be reachable by the pixel through a first-party request call.

#### Diagnostics

Use an online DNS checker like https://dnschecker.org/ to verify if the CNAME record as described above is correctly set, that is, the account subdomain correctly points to the host subdomain, that points to the load balanced domain assigned upon creation. If the account's subdomain does not ultimately point to the load balanced domain, refer to the Resolution section for the next steps.

#### Resolution

* Work with an admin on the domain registrar.
* Update the DNS record in your domain registrar with the IP address of your Gateway Product server. Set a DNS CNAME record that maps your Gateway Product subdomain to the server IP address generated during the setup.

**Step 4**. Events may be blocked by Content Security Policy (CSP). Some websites may have a CSP which blocks events from being received by the Gateway Products.

#### Diagnostics

Check if there is a content-security-policy response header set on the server from the advertiser's website.

#### Resolution

* Allowlist the subdomain to the CSP rule to make it an exception from the policy.

**Step 5**. Disconnect the pixel completely and reconnect.

**Step 6**. Make sure that you are using a valid system access token.

#### Diagnostics

Check if there is a content-security-policy response header set on the server from the advertiser's website.

Access `https://<Gateway Product Endpoint>/capig/graphiql/`. Paste the below command with the **tenantId** to get the corresponding access token

```
query test {
   tenantQueries (tenantId:"") {
    account {
      signalConfigs {
        connectionId
        connectionStatus {
          badToken
          accessTokenAvailable
        }
      }
    }
  }
}
```

To find the tenantId, go to the Gateway Products UI and select the corresponding account where the url link is shown as `https://<Gateway Product Endpoint>/hub/capig/?tenant=<tenentId>`.

If the result of `badToken` returns `true`, fix it by clicking on the "Add Data Source" button to add the same Data Source again.

**Step 7**. Verify with your host if the host UI is accessible and follow the troubleshooting steps in this guide.
