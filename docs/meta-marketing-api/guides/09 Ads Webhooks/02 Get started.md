<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/setup/get-started | Saved: 2026-09-19 | Converted from the web page: Meta's "View as Markdown" export returns an error for this page -->

# Get started

Ads in WhatsApp Status are available via the Marketing API. [Learn more about ads in WhatsApp Status.](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-in-whatsapp-status)

This guide walks you through setting up ads webhooks: preparing a callback endpoint, subscribing your app to the `ad_account` fields you want, and connecting the ad accounts you manage so events start flowing.

Enabling ads webhooks takes two API calls that use two different access tokens:

1. A **subscription** call with an app access token registers the fields your app wants and points Meta at your callback URL.
2. A **subscribed apps** call with an ad account admin token connects a specific ad account so its events are delivered to your app.

The first call activates the webhook for your app and tells Meta to prepare updates for delivery. Those updates stay undelivered until the second call identifies which ad accounts to deliver for and verifies that you have permission to manage them.

## Requirements

* A registered Meta app with an app secret.
* An HTTPS callback endpoint that can receive `GET` and `POST` requests.
* The `ads_management` permission to connect an app to an ad account.
* The `ads_read` or `ads_management` permission to receive events for an account.
* An ad account you manage, and an admin access token for it. The token can belong to an admin user or a system user.

## Step 1: Create a callback endpoint

Your callback endpoint is a public HTTPS URL that receives webhook notifications. It must handle two kinds of requests:

* A `GET` request that Meta sends once to verify the endpoint when you create the subscription.
* `POST` requests that carry webhook notifications after the subscription is active.

### Verify the endpoint

When you create the subscription in the next step, Meta sends a `GET` request to your callback URL with these query parameters:

* `hub.mode` -- always `subscribe`.
* `hub.challenge` -- a random string.
* `hub.verify_token` -- the value you set as `verify_token` in the subscription call.

Your endpoint must confirm that `hub.verify_token` matches the token you configured, then respond with a `200 OK` whose body is the exact `hub.challenge` value. If the challenge is not echoed back, the subscription is not created.

### Validate the payload signature

Every webhook `POST` includes an `X-Hub-Signature-256` header of the form `sha256=<SIGNATURE>`, where the signature is an HMAC-SHA256 of the raw request body keyed with your app secret. Recompute the HMAC over the raw body and compare it to the header value before trusting a payload. Reject any request whose signature does not match.

## Step 2: Subscribe your app to ad_account fields

Call the `subscriptions` edge on your app with an app access token. Set `object` to `ad_account`, point `callback_url` at your endpoint, list the `fields` you want, and provide the `verify_token` your endpoint expects during verification.

```
curl -X POST "https://graph.facebook.com/<APP_ID>/subscriptions" \
  -F "object=ad_account" \
  -F "callback_url=<YOUR_HTTPS_CALLBACK_URL>" \
  -F "fields=effective_status,creative_fatigue" \
  -F "verify_token=<VERIFY_TOKEN>" \
  -F "access_token=<APP_ACCESS_TOKEN>"

```

Set `fields` to a comma-separated list of the webhooks you want. See [Available webhooks](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/ads-webhooks-overview#available-webhooks) for the full list of field names.

When you make this call, Meta sends the verification `GET` to your `callback_url`. Your endpoint must echo `hub.challenge` for the subscription to succeed.

## Step 3: Connect an ad account

Subscribing your app registers the fields, but events are not delivered until you connect the ad accounts you manage. Call the `subscribed_apps` edge on the ad account with an admin access token for that account.

```
curl -X POST "https://graph.facebook.com/act_<AD_ACCOUNT_ID>/subscribed_apps" \
  -F "access_token=<AD_ACCOUNT_ADMIN_TOKEN>"

```

The account inherits the fields your app registered in Step 2, so you do not pass a `fields` parameter here. Repeat this call for each ad account you want to receive events for. The admin token authenticates your permission on the account and keeps delivery scoped to the accounts you explicitly connect.

## Step 4: Receive and read events

Once both calls succeed, Meta sends a `POST` to your callback URL whenever a subscribed field changes on a connected account. Each payload uses the standard [payload envelope](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/ads-webhooks-overview#payload-envelope): a top-level `object` of `ad_account` and an `entry` array whose `changes` name the `field` that changed.

A notification tells you that something changed but is not meant to carry everything you need to act. When you receive one, poll the relevant Marketing API endpoint to read the current details, then act on the result. Each webhook page documents the exact payload that field sends, the calls to poll, and example follow-up actions.

## Next steps

* [Effective status](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/effective-status) -- Track delivery-status changes across campaigns, ad sets, and ads
* [Creative fatigue](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/creative-fatigue) -- React when a creative starts to fatigue
* [Ad recommendations](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/ad-recommendations) -- Apply performance recommendations as they arrive
* [In-process ad objects](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/in-process-ad-objects) -- Detect when an ad object finishes processing
* [With-issues ad objects](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/with-issues-ad-objects) -- Detect when an ad object enters an issue state
