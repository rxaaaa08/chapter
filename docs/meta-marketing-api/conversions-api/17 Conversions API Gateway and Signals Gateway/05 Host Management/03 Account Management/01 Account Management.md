<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/host-management/account-management | Saved: 2026-09-19 -->

# Managing Hosted Accounts



Every admin or standard user for a host account can create and manage accounts in the **Manage accounts** menu.

_Best practice_: Create one account for each advertiser.

## Managed vs. Unmanaged Accounts

There are two ways to onboard an advertiser account based on how you want to manage your clients.

**Unmanaged account**: The business wants to manage their account by themselves and does not want any of the host users to have access to it. If this is the case, the host admin chooses to invite someone else to be account administrator when creating their account. None of the host users will have access to the account, admins included.

**Managed account**: The business wants the host to also manage their account and the host users to have access to it, according to their permissions. If this is the case, the host admin chooses to continue as account administrator when creating their account. All host users will have access to the account, including user management, data source management and event activity data, according to their permissions.

An account user can check their account's status (managed or unmanaged) in the [Account users section](https://developers.facebook.com/documentation/ads-commerce/gateway-products/host-management/user-management).

## Create a Managed Account

To create a new managed account click on **Add account** from the Manage accounts menu or the **Add** button in the menu.

First, provide the name of the account to be created and click **Continue**.

Select **Continue as account administrator** to create a Managed account. Click on **Next**.

Choose to use [manual advanced matching](https://developers.facebook.com/docs/meta-pixel/advanced/advanced-matching) if it is appropriate. This can be adjusted later.

The managed account is now created and the host user is also admin of the account. Click on **Finish**.

The newly created managed account will appear as Active _(see Account 1 in the image below)_.

All host users are able to see and eventually manage a managed account. Follow the steps described in the [Add a new account user](https://developers.facebook.com/documentation/ads-commerce/gateway-products/host-management/user-management) section to add the account's team (external to the host) as account users.

## Create an Unmanaged Account

To create a new unmanaged account click on **Add account** from the Manage accounts menu or the **Add** button in the menu.

First, provide the name of the account to be created and click **Continue**.

Choose "Invite someone to be account administrator" for an [Unmanaged account](https://developers.facebook.com/documentation/ads-commerce/gateway-products/host-management/account-management#managed-vs--unmanaged-accounts). This option is selected by default. Click on **Continue**.  

Choose to use [manual advanced matching](https://developers.facebook.com/docs/meta-pixel/advanced/advanced-matching) if it is appropriate. This can be adjusted later.

If [SMTP is configured](https://developers.facebook.com/documentation/ads-commerce/gateway-products/host-management/set-up-smtp), an invitation link is sent to the user email address provided right after clicking on **Send invite**.

If SMTP is not configured, an invitation link is generated after clicking on **Continue**. Copy the link generated and send it to the user to accept the invitation and create their host account. Finalize by clicking on **Finish**.

The newly created unmanaged account, not yet onboarded, will appear as Setup in progress _(see Account 2 below)_. Once it is onboarded it will appear as Active _(see Account 1 below)_.

To regenerate or resend the invitation link for an unmanaged account, click **Complete setup**, provide the email address of the future admin user and click on **Continue**.

The future admin for the account, who will receive the invitation link, needs to follow the [Account onboarding steps](https://developers.facebook.com/documentation/ads-commerce/gateway-products/host-management/account-management/onboarding-and-offboarding-accounts) to become an admin of the account.

## Change the Name of a Managed Account

Host admin or standard users can change the name of an account. To do so, click on the three dots button next to the account's name and select Edit name.

Provide the new name for the account and then **Confirm**.

## Deactivate a Managed Account

Host admin or standard users with appropriate permissions can deactivate an active managed account.

To deactivate a managed account select **Deactivate** from the three dots button next to the account name.

A deactivated account will have a Deactivated status and a disabled **See details** button.

To reactivate a managed account select **Activate** using the three dots button next to the account name.

## Delete an Account

Host admin or standard users with sufficient permissions can delete both unmanaged and managed active accounts.

For all accounts, go to Manage accounts → the three dots button next to the account name and then Delete and Confirm.

Deleting the account will remove all users and disconnect all data sources connected to the account.
