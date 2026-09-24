<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/overview/versioning | Saved: 2026-09-19 -->

# Versioning



The current version of the Marketing API is v25.0.

Facebook's platform has a core and extended [versioning](https://developers.facebook.com/docs/apps/versions) model. With Marketing API versioning, Meta releases all breaking changes in a new version. Multiple versions of Marketing APIs or SDKs can exist at the same time with different functionality in each version.

Developers should understand in advance when a Marketing API or SDK will change. While you have a 90-day grace period to adopt changes, how, and when to move to the new version is your choice.

## Version schedules

When a new version of the Marketing API releases, Meta continues to support the previous version of the Marketing API for at least 90 days. You have at least a 90-day grace period to move over to the new version. During the 90-day grace period, you can call both the current version and the deprecated version, and you have that 90-day grace period to move to the new version. After the 90-day grace period ends, the deprecated version stops working. Once a version is unavailable, any calls made to that version number may fail or be upgraded to the next available version. For details on when calls are upgraded rather than failed, see [Version auto-upgrade](#version-auto-upgrade).

For example, Marketing API v17.0 was released on May 23, 2023, and Marketing API v16.0 expired on February 6, 2024, which provided at least 90 days to move over to the new version.

Here is a sample timeline. Note that Meta may not always release a new version at the end of the 90-day grace period of the previous version's deprecation. In the example, v16.0 was deprecated some time before v18.0 was released:

For SDKs, a version always remains available because the SDK is a downloadable package, however beyond its end-of-life date, the SDK may rely upon Marketing APIs or methods which no longer work, so you should assume an end-of-life SDK is no longer functional.

## Making versioned requests

All Marketing API endpoints are available through a versioned path. Prepend the version to the start of the request path. For example:

```
curl -G \
-d "access_token=<ACCESS_TOKEN>" \
"https://graph.facebook.com/v25.0/me/adaccounts"
```

The versioned path works for all versions, in this general form:

```
https://graph.facebook.com/v{n}/{request-path}
```

where `n` is the version needed. See a full list of available versions in our [Changelog](https://developers.facebook.com/documentation/ads-commerce/marketing-api/marketing-api-changelog). All of our [Marketing API Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api) provide per-version information.

## Migrations

Migrations are only for special scenarios where changes need to be made that cannot go into versioning. Typically a migration is required when the underlying data model has changed. Migrations apply across all versions.

Migrations that are currently still in progress are listed on our [migrations page](https://developers.facebook.com/docs/apps/migrations). Migrations have at least a 90-day window during which you must migrate your app. Once a window begins, the post-migration behavior will become the default for new apps. Then, when the migration window is completed, the pre-migration behavior will no longer be available at all.

### Manage migrations via Graph API

Migrations can be managed via the [migrations field in the `/app` node](https://developers.facebook.com/docs/graph-api/reference/app#migrations):

You can [make an update call on the edge](https://developers.facebook.com/docs/graph-api/reference/app#migrations) to activate and deactivate migrations.

### Manage migrations via App Dashboard

You can activate and deactivate available migrations in the [App Dashboard](https://developers.facebook.com/apps) under **Settings** > **Migrations**. Note that the list of migrations may not be the same as in the image below, as the available migrations are different for different apps, at different times. And if you see a migration `Use Graph API v2.0 by default`, it is for Graph API only, not Marketing API.

### Temporary client-side activation of migrations

Instead of activating the migration in your App Dashboard or via the Marketing API, it's possible to add a special flag to your Marketing API calls that sets the migration. The flag is called `migrations_override` and requires you to specify a JSON blob that describes what migrations you want to turn on or off. For example, if you were making a raw call you could pass:

```
https://graph.facebook.com/path?
  migrations_override={"migration1":true, "migration2":false}
```

Using the `migrations_override` flag, you can call the new Marketing API through client updates instead of having to get all callers to update to calling the new Marketing API at the same time. The flag is also useful for debugging.

The names for these migrations are found in the `migrations` field of the [`/app` node](#manage-migrations-via-graph-api), which represents your app's configuration.

## Version auto-upgrade

Marketing API versions are released approximately every four months. Starting May 2024, Meta enables the auto-version upgrade feature for Marketing API endpoints that are not affected between versions. Auto-version upgrade means that between a version to be deprecated and the next available version, if an endpoint is not affected, the platform will upgrade the call to the next available version, rather than directly failing the request. This feature reduces the number of requests that fail when a version is deprecated.

For example, on May 14, 2024, v17.0 was deprecated. According to the [changelog of v18.0](https://developers.facebook.com/documentation/ads-commerce/marketing-api/marketing-api-changelog/version18.0), v18.0 changes the following endpoints:

* `POST /act_{ad-account-id}/reachfrequencypredictions`
* `GET /act_{ad-account-id}/reachestimate`
* `GET /act_{ad-account-id}/delivery_estimate`
* `POST /act_{ad-account-id}/adsets`
* `POST /{adset-id}`
* `POST /act_{ad-account-id}/saved_audiences`
* `POST /{saved-audience-id}`
* `POST /act_{ad-account-id}/credit_cards`

If your app is calling `POST /{adset-id}` with v17.0 after it was deprecated on May 14, 2024, this API request will fail as the auto-upgrade is not applied to endpoints affected by next available version (v18.0).

If your app is calling `GET /{ad-account-id}/insights` with v17.0 after deprecation, the platform will upgrade your call to the next available version (v18.0).

**Note:** If your app is already making calls with versions higher than v17.0, nothing should have changed on the version deprecation date.

To check endpoints affected at each version, please refer to the [Marketing API Changelog](https://developers.facebook.com/documentation/ads-commerce/marketing-api/marketing-api-changelog).

## FAQ

### Version schedules

**What if I don't specify a version for the Marketing API?**

We refer to this as an **unversioned** call. Unversioned calls are invalid and will fail when made against Marketing API endpoints.

**Can I make calls to versions older than the current version?**

You can call the version of the Marketing API that was the latest available when the app was created, as long as it has not been deprecated. It can also make calls to any newer, undeprecated versions launched after the app is created.

Starting May 14, 2024, if a deprecated version is provided, the platform may upgrade selected endpoints to the next available version instead of failing the request. To learn more about the behavior, refer to [Marketing API Auto-version upgrade](#version-auto-upgrade).

For example:

* If your app was created before the launch of v17.0, while v16.0 was available, then it will be able to make calls to v16.0 until the expiration date of that version. After v16.0 has been deprecated, calls to v16.0 will fail.
* If your app was created after v17.0 was released, it will be able to make calls to v17.0 until the expiration date of that version, and any subsequent versions (v18.0, etc) until their expiration dates. After v17.0 has been deprecated, calls to v17.0 will fail.
* Your app will not be able to make calls to v16.0, since 1) that was before your app was created and 2) that version is deprecated and calls to v16.0 may fail or be upgraded to the next available version.

If an app was not used - to make any Marketing API calls or requests - after being created, it will not have the ability to use those versions if any newer version is launched. Here's another example to explain this:

* If your app was created while v16.0 was the latest version available, but not used until after v17.0 had launched, it will only be to use v17.0, and not v16.0.
* If your app was created while v16.0 was the latest version available, and then used before v17.0 had launched, it will still be able to use v16.0 even after the launch of v17.0.

**How is this different from Platform API versioning?**

There are a few differences between how Marketing API and the rest of Graph API. For the details on Platform API versioning, see [Graph API, Versioning](https://developers.facebook.com/docs/apps/versions).

1. Marketing API is versioned on a 90-day deprecation schedule, whereas Platform API has core and extended APIs with a 2 year guarantee for core APIs.
2. Marketing API does not support unversioned calls. If you do not specify a working version in your call, it fails.

### Making versioned requests

**How is this different than migrations?**

With migrations, you set migration on or off in App Dashboard, as described in the [Migrations](#migrations) section. With versioning, we are making Marketing API functionality more transparent by moving the setting into the endpoint:

```
https://graph.facebook.com/v{n}/{request-path}
```

You can know what behavior to expect out without having to manually visit your app's migration panel.

### Version auto-upgrade

**Does the upgrade only apply to the version to be deprecated and the next available version? **

The upgrade will apply on any deprecated version to the next available version. This means hypothetically if your app is making calls to v15.0 after v16.0 is deprecated, the call will also be upgraded to v17.0 if the endpoint is not listed as affected endpoint on both v16.0 and v17.0.

**Does this mean developers don't need to do anything during version deprecation? **

No. We highly encourage developers to perform version upgrades before a version gets deprecated for the following reasons

* You may still need to manually upgrade endpoints being impacted by next version.
* You might want to upgrade to newer versions to benefit from new features instead of the lowest available version.

**How can I find out which endpoints will not be auto-upgraded? **

You can look up affected endpoints from [Marketing API Changelog](https://developers.facebook.com/documentation/ads-commerce/marketing-api/marketing-api-changelog).

**How can I opt-out of this behavior? **

You can disable the version auto-upgrade via the **Marketing API Version** setting under **Marketing API App Product Page** > **Settings**.

**Can I check if any specific API call has been auto-upgraded?**

If an API call targets a version that has been deprecated and has been automatically upgraded, an API response header is included for any call that has been auto-upgraded.

Example notification header

```
X-Ad-Api-Version-Warning: 'X-Ad-Api-Version-Warning: 'The call has been auto-upgraded to vXXX as vXXX has been deprecated''
```

