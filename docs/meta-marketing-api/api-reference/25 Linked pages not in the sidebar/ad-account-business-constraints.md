<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/ad-account-business-constraints | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Ad Account Business Constraints

Represents business constraints on an Ad Account.

## Reading

This node cannot be queried directly. To read this node, use the [`GET /<AD_ACCOUNT_ID>/account_controls`](https://developers.facebook.com/docs/marketing-api/reference/ad-account/account_controls/) endpoint.

### Parameters

This endpoint doesn't have any parameters.

### Fields

| Field | Description |
| --- | --- |
| `audience_controls`[AudienceControls](https://developers.facebook.com/docs/marketing-api/reference/audience-controls/) | audience_controls [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `campaigns_with_error`list<numeric string> | Indicates the set of campaigns for which the account controls have not been applied due to one or more errors in the campaigns that conflict with the controls [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `placement_controls`PlacementControls | This field contains another field called placement_exclusion that provides information on which placements need to be excluded while targeting. All the other placements will be included. Each placement is denoted by a string that concatenates the publisher platform of the placement and a position inside the publisher platform, separated by an underscore. What is provided as parameter is a list of placements. For e.g. If we want to exclude the rewarded videos position from the audience network publisher platform, we provide the field as follows: { "placement_controls": { "placement_exclusions": ["audience_network_rewarded_video"] } } Only a few placements are allowed to be excluded: audience_network_classic (native, banner & interstitial positions of audience network) audience_network_rewarded_video (rewarded videos of audience network) audience_network_instream_video (instream videos of audience network) facebook_marketplace (marketplace section inside facebook) facebook_rhc (right hand column inside facebook) [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `status`enum {APPLICATION_IN_PROGRESS, ACTIVE, WITH_CAMPAIGN_ERROR} | Represents the status of account controls set. APPLICATION_IN_PROGRESS indicates that the account controls are being applied to eligible campaigns. ACTIVE indicates that the account controls are successfully applied to all eligible campaigns. WITH_CAMPAIGN_ERROR indicates that the account controls may not have been applied to some eligible campaigns due to one or more errors in the campaigns that conflict with the controls [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |

## Creating

You can make a POST request to `account_controls` edge from the following paths:

* [`/act_{ad_account_id}/account_controls`](https://developers.facebook.com/docs/marketing-api/reference/ad-account/account_controls/)

When posting to this edge, an [AdAccountBusinessConstraints](https://developers.facebook.com/docs/marketing-api/reference/ad-account-business-constraints/) will be created.

### Parameters

| Parameter | Description |
| --- | --- |
| `audience_controls`JSON or object-like arrays | audience_controls Required |
| `age_min`int64 |  |
| `geo_locations`JSON or object-like arrays |  |
| `excluded_geo_locations`JSON or object-like arrays |  |
| `exclusions`JSON or object-like arrays |  |
| `placement_controls`JSON or object-like arrays | This field contains another field called placement_exclusion that provides information on which placements need to be excluded while targeting. All the other placements will be included. Each placement is denoted by a string that concatenates the publisher platform of the placement and a position inside the publisher platform, separated by an underscore. What is provided as parameter is a list of placements. For e.g. If we want to exclude the rewarded videos position from the audience network publisher platform, we provide the field as follows: { "placement_controls": { "placement_exclusions": ["audience_network_rewarded_video"] } } Only a few placements are allowed to be excluded: audience_network_classic (native, banner & interstitial positions of audience network) audience_network_rewarded_video (rewarded videos of audience network) audience_network_instream_video (instream videos of audience network) facebook_marketplace (marketplace section inside facebook) facebook_rhc (right hand column inside facebook) |
| `placement_exclusions`array<enum {AUDIENCE_NETWORK_CLASSIC, AUDIENCE_NETWORK_REWARDED_VIDEO, AUDIENCE_NETWORK_INSTREAM_VIDEO, FACEBOOK_MARKETPLACE, FACEBOOK_RIGHT_HAND_COLUMN, FACEBOOK_BIZ_DISCO_FEED, MESSENGER_STORY}> |  |
| `campaign_ids_to_set_ap`array<numeric string> |  |

### Return Type

 Struct {

`id`: string,

`success`: bool,

`error_code`: string,

`error_message`: string,

}

### Error Codes

| Error | Description |
| --- | --- |
| 100 | Invalid parameter |
| 2641 | Your ad includes or excludes locations that are currently restricted |
| 200 | Permissions error |

## Updating

This node cannot be queried directly. To update this node, use the [`POST /act_<AD_ACCOUNT_ID>/account_controls`](https://developers.facebook.com/docs/marketing-api/reference/ad-account/account_controls/#Creating) endpoint.

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.
