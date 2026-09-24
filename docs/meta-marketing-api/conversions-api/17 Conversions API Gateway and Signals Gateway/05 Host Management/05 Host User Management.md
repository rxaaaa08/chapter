<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/host-management/user-management | Saved: 2026-09-19 -->

# User Management for Hosted Accounts



Users on hosted accounts can have one of the three roles/permissions described below:

|  |  |
| --- | --- |
| **Admin** | Admin users can manage all users and permissions for their account, add, remove and update pixels, and view all applications associated with their account. |
| **Standard** | Standard users can make changes to their assigned data sources. |
| **View Only** | View only users can view data sources and associated data, and some applications, but cannot make changes. |

Every account must have at least one admin user added when the account is created. You can then add standard or view only users, or run the account with only an admin user.

The account administrator can manage the account users from the **Users** menu under **Account settings**.

## Add a New User to an Account

To add a new user to an account, click on **Invite a new user**, provide the user email, select the desired role/permission and click **Continue**.

If the host's [SMTP is configured](https://developers.facebook.com/documentation/ads-commerce/gateway-products/host-management/set-up-smtp), an invitation link will be sent to the user email address provided. An invitation link is also available to copy and send to the future host user.

If SMTP is not configured, copy the link generated and send it to the user to accept the invitation and create their host account. Finalize by clicking on **Done**.

If the Invitation link for a user is lost, create a new one by clicking on the **Edit** button next to the user's email and then click the **Generate invite link**.  

Click **Copy link** and send the invitation link to the new user.  

## Change a User's Permissions in a Hosted Account

To change a user's role and permissions, click the **Edit** button for that user, then click on **Edit** in the Access section. Choose one of the three roles (Admin, Standard or View only) and confirm by clicking on **Save change**.

## Reset a User's Password

To reset a user's password, start by clicking on the **Edit** button for that user.

Click the **Reset** button in the Password section. Copy the link generated and send it to the user to reset their password.

## Remove a User from an Account

To remove a user from the account, click on the **Edit** button of that user and then select **Revoke**:

## Delete an Account

An account admin or standard user can delete an account by following [these steps](https://developers.facebook.com/documentation/ads-commerce/gateway-products/host-management/account-management/onboarding-and-offboarding-accounts).  

## Manage User Permissions

The host users will be able to see and, if they have admin permissions, manage the users of the accounts that have delegated user management. The accounts that have delegated user management to the host will appear in the drop-down selector.
Onboarding and Offboarding Unmanaged Hosted Accounts

## See Also
* [Conversions API Gateway Overview](https://developers.facebook.com/documentation/ads-commerce/gateway-products/conversions-api-gateway)
* [Conversions API Gateway and Signals Gateway: Set Up SMTP Configuration](https://developers.facebook.com/documentation/ads-commerce/gateway-products/host-management/set-up-smtp)
* [Onboarding and Offboarding Unmanaged Hosted Accounts](https://developers.facebook.com/documentation/ads-commerce/gateway-products/host-management/account-management/onboarding-and-offboarding-accounts)
