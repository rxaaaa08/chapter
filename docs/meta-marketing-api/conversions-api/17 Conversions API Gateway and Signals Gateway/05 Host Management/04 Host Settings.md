<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/host-management/host-settings | Saved: 2026-09-19 -->

# "Conversions API Gateway and Signals Gateway: Host Settings"



Host admin users can also manage updates and the SMTP configuration of the Gateway in the Host settings menu.

## Modify the Host (Organization) Account Name

Host admin users can modify the name of the host instance by clicking on the pen icon on the right of the host name.

In the dialog box that opens provide the new name for the instance and click **Confirm**. 

## Update the "Gateway Products" Conversions API Gateway or Signals Gateway

Host admin users can update the Gateway Product in **Updates**, under the Host settings menu.

When Automatic updates are switched ON, the Gateway will automatically receive and install the latest updates. Alternatively, the host admin can choose to install the update right away by clicking on the **Update** button of the available update.

When Automatic updates are switched OFF, the Gateway will not automatically receive and install the latest updates. Available updates will appear under the Available Updates section. Host admins can install these updates at their discretion by clicking on the **Update** button.

## Backup and Restore

This setting automatically creates a backup of your accounts, users, configurations and data at regular intervals. Create a backup file containing your current accounts, users, and data, and access the private key needed to restore your configuration.

* Create and download your backup file
* Save or reset your private key

Restoring a backup will only add new account information to your instance, it will not overwrite existing data or configurations.

**Automatic Backups** — Backups can be created automatically if clients need to be migrated to a new Gateway Product instance.

**Manual Backup** — Manual backups can be created and stored locally to allow for easy migration.

**Restore from Backup**: Once a new instance is created and set up, you can restore the backup created in an existing instance of Conversions API Gateway supporting multiple accounts. This will bring in configuration data that is stored in the backup file and encrypted with the private key that was saved with the backup.

## See Also
* [Overview: Gateway Products](https://developers.facebook.com/documentation/ads-commerce/gateway-products)
* [Set Up SMTP Configuration](https://developers.facebook.com/documentation/ads-commerce/gateway-products/host-management/set-up-smtp)
