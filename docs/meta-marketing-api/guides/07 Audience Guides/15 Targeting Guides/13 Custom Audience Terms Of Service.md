<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/custom-audience-terms-of-service | Saved: 2026-09-19 -->

# Custom Audience Terms Of Service



[Custom Audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/custom-audiences) are available to Businesses that advertise on Facebook. Those businesses can contain one or more ad accounts, and one or more users. To use Custom Audiences, the Business' users must first sign our Terms Of Service contracts. This includes [system users](https://developers.facebook.com/docs/marketing-api/businessmanager/systemuser). You may validate whether your Terms Of Service has been accepted by [checking if you signed](#check-if-you-signed).

Custom Audience Terms of Service have to be accepted per user per business. To do this, the Business must contain at least one ad account. The user signing our contracts is prompted while inside one of the Business' ad accounts. To know who they are signing the contracts for, the user needs to know the status of that ad account:

| Ad Account Status | Terms of Service are related to | Example |
| --- | --- | --- |
| Owned by a Business. | Business that owns the ad account. | **Scenario:** Business 1 owns Ad Account Alpha. A user is inside Ad Account Alpha and accepts the terms of service.<br><br>**Result:** That user has accepted the terms of service for Business 1. |
| Owned by a Business. Acting on behalf of a different Business. | Business the account is acting on behalf of.<br><br>To sign the contracts for the original business, a user has to switch to an ad account not acting on behalf of. | **Scenario:** Business 1 owns Ad Account Alpha. Ad Account Alpha is set up to act on behalf of Business 2. A user is inside Ad Account Alpha and accepts the terms of service.<br><br>**Result:** That user has accepted the terms of service for Business 2. |
| Owned by a Business. Shared with a different Business. | Business that owns the ad account.<br><br>If the other Business wants to use Custom Audience, a user needs to switch to an ad account owned by the other business. | **Scenario:**  Business 1 owns Ad Account Alpha. Business 1 shares Ad Account Alpha with Business 2. A user is inside Ad Account Alpha and accepts the terms of service.<br><br>**Result:** That user has accepted the terms of service for Business 1. |

That user needs to have a role in the ad account to be able to sign our contracts. Once a user accepts the terms of service for a Business from one of their ad accounts, they can manage **Custom File Customer Audience** for all ad accounts belonging to that business.

The API does not allow you to create or change Custom Audiences if the terms have not been accepted. If the contract is not signed, the API returns an error when you try to create or edit a custom file Custom Audience, and when you try to modify targeting section or saved audience, if they include a custom audience.

Find a link for your Business' Custom Audience terms of service at `https://business.facebook.com/ads/manage/customaudiences/tos/?act=<AD_ACCOUNT_ID>`. The business ID field is automatically generated.

## Eligible custom audience types

By signing our Custom Audience Terms of Service, your Business' ad accounts can use the following Custom Audience types:

| Custom Audience | Subtype | `is_value_based` |
| --- | --- | --- |
| Custom File Custom Audience | `CUSTOM` | Not needed |
| Value-Based Custom Audience | `CUSTOM` | `1` |
| Measurement Custom Audience | `MEASUREMENT` | Not needed |

If you do not want to use Custom Audiences with subtype `CUSTOM` or `MEASUREMENT`, you are prompted to sign ad account levels terms of service.

## System users {#system-users}

For a system user to operate with a Custom File Custom Audience in a business, a non-system user needs to accept that Business' Custom Audience terms of service. The acceptance must be made from an ad account that belongs to that Business, see table above for exceptions.

If a non-system user already accepted the Custom Audience Terms of Service from an ad account with a On-Behalf-Of relationship, system users can operate on behalf of that other Business. However, the system users are not able to operate within their original Business. The non-system user can go to different ad accounts in the owning business to accept ToS so the system users can operate.

To check if a system user is allowed to operate with Custom File Custom Audience, you can check the terms of service status of one of the Business' ad account. As long as the ad account isn't On-Behalf-Of or shared with another business. At the ad account level, you can see all the terms of service signed for the Business that owns that ad account.

## Check if you signed {#check-if-you-signed}

You can check if a Business has signed their Custom Audience terms of service, by making a `GET` call to an ad account owned by that Business. The ad account can't be acting on behalf of another business, or be shared. The `GET` call is:

```
GET act_<AD_ACCOUNT_ID>?fields=tos_accepted
```

A sample response looks like this:

```
{
  "tos_accepted": {
    "custom_audience_tos": 1 // this means the terms were signed
  },
  "id": "act_<AD_ACCOUNT>"
}
```

**Note:** You also get returned `custom_audience_tos: 1` for an ad account with an on behalf of relationship. But those terms are signed for the Business that ad account is acting on behalf of.  

From the ad account, you can also check if a specific user has signed the terms of service. To do that, make a `GET` call and include the user's access token:

```
GET act_<AD_ACCOUNT_ID>?fields=user_tos_accepted
```

A sample response with `custom_audience_tos` accepted looks like this:

```
{
  "user_tos_accepted": {
    "custom_audience_tos": 1
  },
  "id": "act_<AD_ACCOUNT_ID>",
  "__fb_trace_id__": "EKjdfdfeOt0k"
}
```

This is valid for non-system users only.
