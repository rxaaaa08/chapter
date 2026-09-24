<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/using-the-api/post-processing | Saved: 2026-09-19 -->

# Post-Processing for Ad Creation and Edits



Prior to v4.0, ad buying could cause system timeout, out of memory errors or delays. To scale the system, Meta decoupled logic that requires significant computation and that causes transient errors into a separate workflow called *post-processing*. Now when you create or edit ads, it is more resilient to transient errors. The following diagram shows the post-processing workflow:

*Figure 1: Ad creation workflow with post-processing phase.*

To represent a post-processing phase after a request is received, v4.0 introduces the ads run status `IN-PROCESS`. This new status applies to:

- `{campaign_ID}`,
- `{ad_set_ID}`,
- `{ad_ID}` and
- `{ad_creative_ID}`.

For campaigns, ad sets and ads, this impacts:

| Field | v4.0 and above | Below v4.0 |
| --- | --- | --- |
| `effective_status (enum {ACTIVE, PAUSED, DELETED, PENDING_REVIEW, DISAPPROVED, PREAPPROVED, PENDING_BILLING_INFO, CAMPAIGN_PAUSED, ARCHIVED, ADSET_PAUSED, WITH_ISSUES, IN_PROCESS})` | `IN_PROCESS` | For campaigns or ad sets: `configured_status` or `status`. For ads: `pending_review`. |
| `configured_status enum {ACTIVE, PAUSED, DELETED, ARCHIVED}` | No change | No change |
| `status (enum {ACTIVE, PAUSED, DELETED, ARCHIVED})` | No change | No change |

The post-processing phase appears in `effective_status` for campaigns, ad sets and ads, and in the `status` field for ad creatives. For example, you can query the status of your object at `/creative_id?fields=status`. If it is in the post-processing phase, you see:

```
{
 "status": "IN-PROCESS",
 "id": "<creative_id>"
}
```

If your ad creative successfully passes post-processing, you see:

```
{
"status": "ACTIVE",
"id": "<creative_id>"
}
```

If post-processing fails, the system sets your object to `WITH_ISSUES` and provides an error in `issues_info`. For example, at `creative_ID?fields=status, issues_info`:

```
{
"status": "WITH_ISSUES",
"issues_info": [
{
"level": "CREATIVE",
"error_code": 1815869,
"error_summary": "Ad post is not available",
"error_message": "The Facebook post associated with your ad is not available. It may have been removed, or you may not have permission to view it." }
],
"id": "<creative_id>"
}
```

When an ad object is `IN_PROCESS`, you can still make regular updates to the object and its children.
