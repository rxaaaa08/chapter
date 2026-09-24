<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/host-management/set-up-smtp | Saved: 2026-09-19 -->

# "Conversions API Gateway and Signals Gateway: Set Up SMTP Configuration"



Admin users for systems that host multiple accounts can configure the system's SMTP service, for both the Conversions API Gateway or Signals Gateway configuration, under the **Host settings** menu.

When this feature is enabled, each time a new user is invited, the Conversions API Gateway or Signals Gateway will send an invitation email (containing the invitation link) to the email address provided for their user profile. Invitation link regeneration and password reset requests will also inform the impacted user via their email address. If this feature is disabled the host will have to share the above links manually.

Here are some links to guide you through setting up SMTP with your email provider:

* [Google](https://support.google.com/a/answer/176600?hl=en)
* [Microsoft](https://support.microsoft.com/en-us/office/pop-imap-and-smtp-settings-8361e398-8af4-4e97-b147-6c6c4ac95353)
* [Zoho](https://www.zoho.com/mail/help/zoho-smtp.html)
* [Amazon SES](https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html)

To configure the SMTP, specify the following parameters as described:

**Host** — The server that will be used for SMTP forwarding.

**Port** — The port they specify for TLS or SSL encryption.

**From display name** — The name before the email address that will send messages.

**From email** — The email address that the emails will be sent from.

**Enable SSL** — Depending on the encryption your email provider requires, you may need SSL.

**Enable StartTLS** — Depending on the encryption being used, TLS may be required. Please use the Send test email button to check SSL and TLS settings. Test emails will be sent to the email address you logged into the Conversions API Gateway or Signals Gateway with.

**Enable Authentication** — If your email provider required authentication to send emails through them.

**Username** — The email address provisioned for SMTP forwarding.

**Password** — The password for that account. If your email service leverages two factor authentication you may need to use an app-specific password in the password field.

You need to **Save** the configuration before enabling it. To disable the SMTP configuration simply switch it off in the dashboard:

## See Also
* [Conversions API Gateway Overview](https://developers.facebook.com/documentation/ads-commerce/gateway-products/conversions-api-gateway)
* [Signals Gateway Overview](https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway)
