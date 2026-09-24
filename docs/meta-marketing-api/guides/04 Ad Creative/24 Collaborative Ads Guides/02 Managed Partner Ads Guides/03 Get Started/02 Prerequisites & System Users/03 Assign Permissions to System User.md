<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/prerequisites/assign-permissions-to-system-user | Saved: 2026-09-19 -->

# Assign Permissions to the Admin System User



The admin system user created in the [previous step](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/prerequisites/create-system-user) can create new users, add accounts, assign permissions, and access all assets belonging to the business. To perform these actions, the admin system user needs the following permissions:

* [Finance editor](#finance-editor-permission)
* [Manage app](#manage-app-permission)
* [Manage catalog](#manage-catalog-permission)

## Before you begin

Before you assign permissions, make sure you have completed this step:

* [Create an Admin System User](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/prerequisites/create-system-user)

## Permissions

### Finance editor permission

1. Go to the [Business Settings](https://business.facebook.com/settings).
2. Under **Users**, click **System Users**.
3. Select the admin system user, and click the **Edit** button.
4. Select **Finance editor** for the finance role.
5. Click **Update system user**.

### Manage app permission

1. Go to the [Business Settings](https://business.facebook.com/settings).
2. Under **Users**, click **System Users**.
3. Select the admin system user, and click the **Add assets** button.
4. Select **Apps** as the asset type in the **Assign Assets** dialog.
5. Select your app, then select the **Manage App** setting.
6. Click **Save changes**.

### Manage catalog permission

1. Go to the [Business Settings](https://business.facebook.com/settings).
2. Under **Users**, click **System Users**.
3. Select the admin system user, and click the **Add assets** button.
4. Select **Catalogs** as the asset type in the **Assign Assets** dialog.
5. Select your parent catalog, then select the **Manage Catalog** setting.
6. Click **Save changes**.

## See more

* [Business Help Center: Add System Users to Your Meta Business Suite](https://www.facebook.com/business/help/503306463479099?id=2190812977867143)
* [Developer Documentation: System Users in Meta Business Suite](https://developers.facebook.com/docs/marketing-api/system-users)
