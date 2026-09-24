<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/best-practices/manage-your-ad-object-status | Saved: 2026-09-19 -->

# Manage Your Ad Object's Status


Ad Campaign, Ad Set, and Ads have one of the following status types:

* Live
* Archived
* Deleted

For background, see [Ads Developer Blog, Deleted versus Archived](https://developers.facebook.com/ads/blog/post/2014/09/24/deleted-vs-archived/).

## Live {#active}

Live ad objects can have the following status:

* `ACTIVE`
* `PAUSED`
* `PENDING_REVIEW`
* `CREDIT_CARD_NEEDED`
* `PREAPPROVED`
* `DISABLED`
* `PENDING_PROCESS`
* `WITH_ISSUES`

## Archived {#archived}

Set the ad object to `ARCHIVED` by setting `status` field to `ARCHIVED`. When an object status is set to `ARCHIVED`, you can continue to query the details and stats based on the object id. However, there is a limit on the number of objects you can archive. So you should respect this limit and change status to `DELETED` when you no longer need an object.

An `ARCHIVED` object has only two fields you can change: `name` and `status`. You can also only change `status` to `DELETED`.

## Deleted {#deleted}

Set the ad object to `DELETED` by either setting `status` field to `DELETED` or sending an `HTTP DELETE` to that object. Once an object status is set to `DELETED`, you cannot set it back to `ARCHIVED`.

If you keep the deleted object ID, you can continue to retrieve stats or object details by querying the object ID. However you cannot retrieve the deleted objects as a connection object from a non-deleted node or object. For example, `<API_VERSION>/<AD_ID>/insights` works for a deleted object but `<API_VERSION>/act_<AD_ACCOUNT_ID>/insights?level=ad` does not return stats for the deleted object.

After you delete an ad, it may still track impressions, clicks, and actions for 28 days after the date of last delivery. You can query insights for `DELETED` objects using the `ad.effective_status` filter.

If you have an ad set with two ads in it, and you delete one ad, the following two queries do not return the same results:

```text
https://graph.facebook.com/v25.0/<AD_SET_ID>/insights
https://graph.facebook.com/v25.0/<AD_ID>/insights
```

The ad set returns stats for both the deleted and the non-deleted ads in it. However when you query for ads in the ad set, you only see one ad:

```text
https://graph.facebook.com/v25.0/<AD_SET_ID>/ads
```

To avoid this scenario, you should delete ads 28 days after their last date of delivery to ensure stats no longer change. Also you should store the stats or ids of those objects in your own system before you delete them. This recommendation is optional:

- If your application does not show the breakdown of stats, or
- You do not care if the sum of breakdowns of stats do not match that of the parent object, due to some deleted child objects.

You cannot change any field, except `name`, for a `DELETED` object.

## Manage status {#how}

Typically, you manage object status as follows:

* You create ad objects, they run and start delivering
* When you delete an object, the system removes it automatically
* When you reach the limit for archived objects, you can no longer archive more objects.
* You should move archived deleted objects to the `DELETED` state to reduce the limit.

The status on ad objects works this way for the hierarchy of ad objects:

* If the status of a campaign is set to `WITH_ISSUES`, `PAUSED`, `ARCHIVED`, or `DELETED` for a campaign, all the objects below it automatically inherit that status.
* If you set an ad campaign to `DELETED`, you cannot retrieve the ad sets or ads below that campaign without explicitly specifying the IDs.
* If the status of an ad is set to `WITH_ISSUES`, `PAUSED`, `ARCHIVED`, or `DELETED`, the ad set or ad campaign containing that ad keeps its original status and is available for retrieval.

The following limits apply to `ARCHIVED` objects for a given ad account:

* 100,000 for Ad Campaigns
* 100,000 for Ad Sets
* 100,000 for Ads

If you read `archived` edges, you must specifically filter for the archived objects since they are not returned by default. If you read stats for an ad object, the response includes the stats of all children objects, no matter if the child is `active`, `archived`, or `deleted`. Therefore you need no filter for insights on child objects.

## Comparisons of different statuses {#comp}
Objects with statuses such as `ACTIVE`, `PAUSED` differ from those with `ARCHIVED` status, and `DELETED`. Here are the major differences.

| Query | Live | ARCHIVED | DELETED |
| --- | --- | --- | --- |
| Exists in database | Yes | Yes | Yes |
| Maximum number per ad account | [With limits](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account#limits) | 100,000 | No limit |
| Query as edges without filter | Yes | No | No |
| Query as edges with status filter | Yes for objects of status contained in the filter | Yes if status filter contains `ARCHIVED`. | No if status filter does not contain `DELETED`, and error if it does. |
| Query by its own ID | Yes | Yes | Yes |
| Stats aggregated in `/<PARENT_OBJECT_ID>/insights` | Yes | Yes | Yes |
| Stats included in the result list of `/<PARENT_OBJECT_ID>/insights?level=<OBJECT_LEVEL>` | Yes | No | No |
| Stats included in the result list of `/<PARENT_OBJECT_ID>/insights` with [delivery_info filtering](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights#delete_archive) | Yes for objects of status contained in the filter | Yes for objects of status contained in the filter | No |
| Insights shown with `/<OBJECT_ID>/insights` | Yes | Yes | Yes |
| Status can be changed to | Any valid status | `DELETED` | Cannot change |

To set an ad to be archived:

```bash
curl -X POST \
  -d "status=ARCHIVED" \
  -d "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/v25.0/<AD_ID>
```

To delete an ad:

```bash
curl -X POST \
  -d "status=DELETED" \
  -d "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/v25.0/<AD_ID>
```

To retrieve live subobjects of a live object, for example, all live ads of an ad campaign, not including `ARCHIVED` or `DELETED` ads:

```bash
curl -X GET \
  -d 'fields="name"' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<AD_CAMPAIGN_ID>/ads
```

To retrieve `ARCHIVED` subobjects of a live object, for example, all `ARCHIVED` ads of an ad set, requires the status filter:

```bash
curl -X GET \
  -d 'effective_status=[
       "ARCHIVED"
     ]' \
  -d 'fields="name"' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<AD_CAMPAIGN_ID>/ads
```
