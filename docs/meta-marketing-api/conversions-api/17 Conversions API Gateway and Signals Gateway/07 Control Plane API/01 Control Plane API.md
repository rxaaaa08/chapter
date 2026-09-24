<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api | Saved: 2026-09-19 -->

# Conversions API Gateway and Signals Gateway Control Plane API



## Partner Integration

### Overview

Conversions API Gateway and Signals Gateway control plane API is a set of GraphQL APIs exposed from the Gateway instance. It allows developers to programmatically manage accounts, data sources and other configurations of a "Gateway Products" Conversions API Gateway or Signals Gateway instance. Partners can integrate the API to build into their advertiser-facing UI and offer their advertisers a seamless onboarding and management flow.

Potential use cases:

1. Advertisers onboard to Gateway Products using the partner's UI and perform follow-up actions through the Gateway Product admin settings. This requires partial integration of the control plane API.
2. Advertisers perform all actions on the partner's UI, including onboarding to Gateway Products and follow-up actions. It can be a good use case for partners who do not want to expose the Gateway Products UI but still want to provide a Gateway Products as a service for the advertisers. This requires full integration of the control plane API.  

Refer to the section below for more details on integration steps.

## Integration Guide

Depending on the use case, there can be two integration paths (as shown in the diagram below):

1. **Partial integration** of control plane API. This does not require authentication from advertisers.
2. **Full integration** with control plane API. This requires authentication from advertisers either using [Meta Business Extension (MBE)](https://developers.facebook.com/docs/meta-business-extension) or manual generation of tokens.

## Prerequisites {#pre-reqs}

For both integration paths, the partner needs to first complete the steps below:

### **Step 1**: [Onboard as a host of Conversions API Gateway instance](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-aws-eks)

### **Step 2**: Generate API account name and API secret key {#step-2-prereq}

Go to:

```
https://<Gateway Products Endpoint>/hub/
```

Navigate to the **Host settings** tab, select the **Manage API accounts** page, and click the **Add API account** button.

Re-enter your password. Click **Continue**.  

Enter the name of the API account. Click **Continue**.

The account name can only consist of letters and numbers, and cannot contain spaces. The maximum length is 20.

Copy and save the generated secret key. You will not be able to view it again.  

To remove an API account, click Delete API account. Kindly note that the action is not reversible and can potentially cause disruptions to any advertiser's applications or services using the API.

## Partial Integration

A use case based on partial integration:

1. The advertiser opts in for Gateway Product service using the partner's UI.
2. Partner generates an invitation link which can be used by the advertiser to set up a password and complete Gateway Product account creation.  
3. The advertiser uses functionalities on Gateway Product UI to perform actions such as data source management as well as account user, domain and routing management.  
4. Partner retrieves the advertiser's account usage and bills accordingly.  

A high-level user flow may look like below:

To achieve the above, the partner can integrate a subset of control plane API, including:

1. Get API Access Token
2. Create Account for advertisers  
3. Get Account Usage, for example, for billing purposes

## Full Integration for Conversions API Gateway Example

A use case based on full integration:  

1. The advertiser opts in for Gateway Product service using the partner's UI.
2. Partner onboards the advertiser's Gateway Product account and receives permission to manage the account; the advertiser authorizes the partner using the Meta Business Extension (MBE) or manual token generation.  
3. The advertiser can perform data source management as well as account user, domain and routing management in the partner's UI.  
4. Partner retrieves the advertiser's account usage and bills accordingly.

A high-level user flow may look like below:

For this integration path, partners need to request authorization and get system user access tokens via authentication in order to send events on behalf of the advertisers.

## Authentication

Partners have the following two authentication options for Meta Pixels not managed by them:

#### Option 1 - Meta Business Extension (MBE)

Before you start, you'll need to:

Complete [all the requirements](https://developers.facebook.com/docs/facebook-business-extension/fbe/get-started/pixel-capi-onboarding#before-you-start) for implementing MBE.

MBE provides an endpoint to retrieve system user access tokens created in the advertiser's Business Manager. Partners may follow up to [Step 4 of the MBE integration guide](https://developers.facebook.com/docs/facebook-business-extension/fbe/get-started#integration-setup). Ensure that you:

Ensure that you:  

* Set the value of the [channel parameter](https://developers.facebook.com/docs/facebook-business-extension/fbe/get-started/pixel-capi-onboarding#setup) in setup configuration object as `CONVERSIONS_API_GATEWAY_ADVERTISER`.
* Are able to receive the webhook response at the completion of onboarding.
* Use the access token returned via MBE and convert it into a system user access token by [making an additional API call](https://developers.facebook.com/docs/facebook-business-extension/fbe/guides/get-features#get-system-user-token-via-api).
* Save a copy of `external_business_id`, `pixel_id`, `business_id` and system user access token in your system.

#### Option 2 - Client System User Access Token

With this option, partners may have the advertisers:

1. Manually create a system user access token via the Conversions API inside Settings in Meta Events Manager (EM).
2. Share `pixel_id`, `business_id` and system user access token with the partner and save a copy of it.

## Integration

Partners can integrate the complete set of control plane API.

## Get API Access Token

Provide the API account name and API secret key obtained in [Step 2 of the prerequisites](#pre-reqs) to get a short-lived access token for making subsequent control plane API calls. Note that the token expires in 10 hours and will need to be obtained again by calling this API.

**Sample Request**

```
curl -X POST \
-F 'client_id={client_id}' \
-F 'client_secret={client_secret}' \
-F 'grant_type=client_credentials' \
'https://<capig_domain>/clients/token'
```

**Sample Response**

```
{
    "token": <token>
}
```

**Available Parameters**

| Field | Description |
| --- | --- |
| `client_id`<br><br>type: string | **Required**<br><br>API account name obtained in [Step 2 of prerequisites](#step-2-prereq). |
| `client_secret`<br><br>type: string | **Required**<br><br>API secret key obtained in [Step 2 of prerequisites](#step-2-prereq). |

## See Also

* [Control Plane API: Data Pipeline and Signals Gateway Pixel](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api/setup-data-pipelines)
* [Meta Business Extension (MBE)](https://developers.facebook.com/docs/meta-business-extension)
* [Meta Pixel](https://developers.facebook.com/docs/meta-pixel)
