<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience/ad_accounts | Saved: 2026-09-19 -->

# POST and DELETE Custom Audience Ad Accounts



**Warning:** ### Flagged custom conversions

If a custom conversion is flagged, the `is_unavailable` field will be set to `true`.

```html
{
  "is_unavailable": true,
  "id": "30141209892193360"
}
```

#### To resolve flagged custom conversions

If any of your custom conversions are flagged for suggesting information that is not allowed under our terms, you may want to consider the following options:

To resolve a flagged custom conversion in a new campaign creation:

* **Create new custom conversion**: Use a new custom conversion and make sure that it does not include information that is not allowed under our terms.
* **Choose a different custom conversion**: Select a different existing custom conversion and make sure it does not include information that is not allowed under our terms.

To resolve a flagged custom conversion in an existing campaign:

* **Duplicate your campaign and select an existing custom conversion**: If you have a running campaign that is flagged due to a flagged custom conversion, consider duplicating the campaign and selecting a different custom conversion that is not flagged before publishing the new duplicated campaign. **Note:** Once the campaign is published, you cannot remove or select a different custom conversion.

#### Request a review

If you believe your custom conversion has been flagged in error and doesn't include non-permitted information, you can request a review via Ads Manager under the campaigns table, or in Events Manager under the custom conversions page.

## Reading

You can't perform this operation on this endpoint.

## Creating

### /{custom_audience_id}/ad_accounts
You can make a POST request to *ad_accounts* edge from the following paths:

- [/{custom_audience_id}/ad_accounts](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience/ad_accounts)

When posting to this edge, an [AdAccount](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account) will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `adaccounts`<br><br>*list<numeric string>* | Array of new ad account IDs to receive access to the custom audience<br> |
| `permissions`<br><br>*string* | `targeting` or `targeting_and_insights`. If `targeting` the recipient ad account can target the audience in ads.        `targeting_and_insights` also allows recipient account to view the        audience in Audience Insights tool<br> |
| `relationship_type`<br><br>*array<string>* | relationship_type<br> |
| `replace`<br><br>*boolean* | `true` or `false`. If `true` the list of `adaccounts`<br>provided in the call will replace the existing set of ad accounts<br>this audience is shared with.<br> |

#### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node to which you POSTed.

```
Struct  {
success: bool,
sharing_data:  List  [ Struct  {
ad_acct_id: string,
business_id: numeric string,
audience_share_status: string,
errors:  List  [string],
}],
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 200 | Permissions error |

## Updating

You can't perform this operation on this endpoint.

## Deleting

### /{custom_audience_id}/ad_accounts
You can dissociate an [AdAccount](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account) from a [CustomAudience](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience) by making a DELETE request to [/{custom_audience_id}/ad_accounts](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience/ad_accounts).

#### Parameters

| Parameter | Description |
| --- | --- |
| `adaccounts`<br><br>*list<numeric string>* | Array of ad account IDs to revoke access to the custom audience<br> |

#### Return Type

```
Struct  {
success: bool,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |

