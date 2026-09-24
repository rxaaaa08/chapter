<!-- Source: https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/append-attribution | Saved: 2026-09-19 -->

# AppendAttribution integration guide


**Warning:** This API is in Beta with limited access. If you do not have access, contact your Meta representative.

**AppendAttribution** enables advertisers to optimize Meta ad campaigns using their own attribution model's credit assignments, rather than relying solely on Meta's default attribution.

It works by sending a standard Conversions API event (`AppendAttribution`) that appends your attribution credit to an original conversion event already received by Meta, such as a Purchase. Meta then uses this data to support a new advanced attribution feature, Custom Attribution.

This guide covers an advertiser directly integrating with Meta. If you use an external analytics provider such as Adobe, [Northbeam](https://docs.northbeam.io/docs/northbeam-apex), [Rockerbox](https://help.rockerbox.com/article/8v8uvdzjb7-meta-attribution-api), or [Triple Whale](https://kb.triplewhale.com/en/articles/11021684-quick-start-guide-triple-whale-meta-attribution-passback-integration), your partner can send the events for you. For Adobe, ask your Adobe representative about the Adobe Advertising Connector for Meta.

## Prerequisites

Before sending any events, confirm all of the following:

| Requirement | How to verify |
| --- | --- |
| 1\. Already sending full coverage of `Purchase` (web) or `fb_mobile_purchase` (app) events via Pixel or Conversions API to the relevant dataset | **Events Manager** > **Dataset** > **Overview** > check for Purchase events |
| 2\. Can send AppendAttribution events within 48 hours of the original Purchase | Use the [Conversions API Payload Helper](https://developers.facebook.com/documentation/ads-commerce/conversions-api/payload-helper) to test that you are sending events correctly to Meta following this specification.<br><br>**Note**: AppendAttribution events must be received within 48 hours of the original event. Meta classifies events received after 48 hours as low quality. |
| 3\. A Custom Attribution Source (CAS) is configured in Events Manager | See [Events Manager setup](#events-manager-setup) section below. |

## Events Manager setup

Before sending events, you must create a Custom Attribution Source (CAS) in Events Manager. This tells Meta which dataset to associate your AppendAttribution data with.

### Setup steps

1. Go to **Events Manager** > select the dataset where the relevant original event lives that you want to provide attribution information to > **Create** > **Create Custom Attribution Source**.
2. Select **Direct Integration**.
3. Name your Custom Attribution Source descriptively. For example, `JaspersMarket_firstclick_7D`. Other users in the ad account will see this name.
4. Select the original event dataset (where original Purchase events land) and attribution event dataset (where you send AppendAttribution events).
   - **Recommendation for first CAS:** Use the same dataset where you send purchase events. Separate or different datasets are only needed for advanced use cases such as migrating to a new attribution model.
5. Complete setup and start sending events using the [AppendAttribution event parameters](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/append-attribution/reference).

**Note:** A single CAS covers all events flowing into one dataset. If you have separate, unlinked datasets (for example, one for Web and one for App), create a CAS on each dataset by repeating the steps above for each.

## Payload schema

For the full definition of each event parameter and example payloads for both web and app events, see [AppendAttribution event parameters](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/append-attribution/reference).

Use the [Conversions API Payload Helper](https://developers.facebook.com/documentation/ads-commerce/conversions-api/payload-helper) to test that you are sending events correctly to Meta following this specification.

## Custom Attribution Source (CAS) lifecycle widget

After you create a Custom Attribution Source (CAS), a lifecycle widget appears on your dataset overview page in Events Manager. The widget helps track your progress from initial setup through full readiness and shows recommended next steps at each stage.

The following table describes each lifecycle stage, what it means, and the recommended action:

| Stage | What it means | What to do |
| --- | --- | --- |
| Pending | CAS created. Awaiting first AppendAttribution events. | Complete Conversions API integration and send your first passback events. Verify events appear in Events Manager within 24 hours. |
| In Training | Events received. Attribution model is training on your data. This takes 14 days from the time of the first high quality event received. | Review diagnostics and download aggregate reports during this period. No action required — training is automatic. |
| Setup Complete | Custom Attribution Source training is complete, but not yet able to use the Custom Attribution product. | Your Meta account representative will reach out when your CAS is eligible for ad optimization. Review the Connection Quality page for any active issues. |
| Ready to Use | Fully operational. Campaign creation enabled. | Create campaigns using your Custom Attribution source. Monitor attribution rate and parameter coverage on the Connection Quality page. |
| Quality Issue | Not passing quality checks. | Check the Connection Quality page for active issues. Common causes: low meta-attributed event volume, missing required parameters. Resolve flagged issues and the widget will update automatically. |

**Key requirements for eligibility for campaign creation:**

1. Both App and Web event channels must be passing (eligibility is checked at the dataset level).
2. Events Manager blocks CAS creation if Purchase events are not present.

**Multiple CAS per dataset:** If you have more than one Custom Attribution Source on a dataset, each CAS displays its own lifecycle widget with the CAS name shown for identification. A maximum of two widgets are visible by default — click **Show more** to see additional CAS.

**Training timeline:** Once achieving high data quality, it takes up to two weeks for the Custom Attribution Source to be ready for optimization use. You can review diagnostics and aggregate reports in Events Manager throughout this period.

## Validate your data

1. Wait at least **72 hours** after first sending events (data needs time to accumulate).
2. Go to **Events Manager** > your original dataset > Custom Attribution Source widget.
3. Check the quality indicator — it must show **High**. If it shows **Low**, resolve the diagnostics before proceeding.
4. Set your desired date range and click **Export Data**.
5. This downloads a CSV with `attributed_value` and `attributed_share` broken down by `campaign_id`, `adset_id`, and day.

**Note:** It takes roughly 14 days (from the first event sent) for Meta to train on your custom attribution data before it is ready to be used for optimization. Meta will email the CAS creator when this is completed.

### What to compare

Sum the `attributed_share` and `attributed_value` columns in the export for a given date range, and compare to the same totals in your external attribution system. The following table describes expected variance thresholds:

| Variance | Status | Action |
| --- | --- | --- |
| 0–5% | **Normal** | Expected variance between systems. No action needed. |
| >5% | **Investigate** | Investigate to see if you are sending all the expected attribution information. |

**Recommendation:** Re-run this validation periodically to catch integration drift.

**Note:** If you are sending AppendAttribution events to two separate dataset IDs that are not linked, you must download the aggregate report from each dataset separately.

## Best practices

1. **Deduplication:** Always provide `event_id`. Two events with the same `event_name` and `event_id` are deduplicated (Meta discards the second event).
2. **Order of events:** Ensure `original_event_data.event_time` occurs after `attribution_data.touchpoint_ts`.
3. **Validation:** Periodically reconcile your passback data with Meta's records to catch integration drift.
   - In Events Manager, go to your original dataset > Custom Attribution Source widget > **Export Data**. Compare the attributed values and credit by campaign to your external system. See [Validate your data](#validate-your-data).
   - **Note: If you are sending AppendAttribution events with two separate dataset IDs that are not linked, download the report separately**.
4. **Click ID issues:** Ensure your site captures the `_fbc` cookie from Meta ad click URLs and passes it in `user_data.fbc`. If `fbc` availability is low or inconsistent, use the [Conversions API Payload Helper](https://developers.facebook.com/documentation/ads-commerce/conversions-api/payload-helper) to validate your payload structure, or the [Parameter Builder library](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameter-builder-library) to automatically generate `fbc` and `fbp` server-side.
5. **Coverage:** Ensure the AppendAttribution events shared with Meta represent all of the campaigns you are running in Meta.
6. **Response logging:** Check and log the Conversions API response to make sure all calls get a success response.

## Common mistakes

The following table describes common integration mistakes, their symptoms, and how to fix them:

| # | Mistake | Symptom | Fix |
| --- | --- | --- | --- |
| 1 | `attribution_value` doesn't apply `attribution_share` as a multiplier | Events may fail validation or be dropped | Set `attribution_value` = `attribution_share` * value |
| 2 | Hashing `client_ip_address` or `client_user_agent` | Low match rates; quality indicator shows "Low" | Send these fields as raw strings — only hash `em` and `ph` |
| 3 | `touchpoint_ts` is after original `event_time` | Events may fail validation or be dropped | The ad interaction (touchpoint) must happen before the purchase. Check your timestamp logic and timezone. |
| 4 | Using `Purchase` as `event_name` for app events | Events don't match original app events | Use `fb_mobile_purchase` for app events |
| 5 | `attribution_share` values don't sum to 1 across touchpoints for a single conversion | Aggregate validation shows discrepancies | For multi-touch models, ensure all touchpoint shares for one order sum to 1.0 |
| 6 | Missing `fbc` for web events | Low connection quality | Ensure your site captures the `_fbc` cookie and is propagated via the integration. If unavailable, talk to your Meta rep about alternatives. |
| 7 | Sending the same `event_id` for different attribution events | Meta keeps only one event and deduplicates the rest | `event_id` should be unique per passback event, not per original conversion |

## Diagnostics

Events Manager shows data quality issues with your AppendAttribution integration as diagnostics. Resolve High severity diagnostics before relying on attribution data for optimization. Diagnostics are computed daily over the last 7 days of received events.

### How to view diagnostics

To view diagnostics for your integration, follow these steps:

1. Go to **Events Manager** > select your dataset.
2. Open the Custom Attribution Source widget.
3. Click the **Diagnostics** tab.
4. Each diagnostic shows: severity, the count of affected events (last 7 days), a sample payload, and the recommended fix.

### Severity definitions

The following table describes the diagnostic severity levels:

| Severity | What it means |
| --- | --- |
| High | Blocks attribution. Affected events fail validation and are not used for your Custom Attribution Source. |
| Medium | Events are accepted, but quality may be degraded. Strongly recommended to resolve. |

**Note:** Diagnostic counts reflect events from the last 7 days. After fixing the root cause in your integration, expect 24–48 hours for the affected count to drop in Events Manager.

### Exporting diagnostic data

For offline review by your team, click **Export Data** on the Diagnostics tab and select a date range. The export includes affected `event_id` values, the failing field, and the raw value received — useful for tracing back to the source system.

## Advanced: Testing multiple attribution models

You can send multiple attribution models to Meta simultaneously — for example, running your existing attribution model V1 and testing new attribution model V2. Each model gets its own Custom Attribution Source (CAS) and its own attribution event dataset, while both reference the same dataset that contains original Purchase events.

### Why do this

- **A/B test attribution models** — compare how two models allocate credit to Meta before switching.
- **Migrate between models** — run old and new in parallel during transition.
- **Support different lines of business** — for example, retail, and wholesale use different attribution logic.

### How it works

Each attribution model sends AppendAttribution events to a **separate dataset (Pixel ID)**. Each dataset has its own CAS that points back to the **same original event dataset** where your Purchase events land.

## See also

* [AppendAttribution event parameters](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/append-attribution/reference)
* [Conversions API Payload Helper](https://developers.facebook.com/documentation/ads-commerce/conversions-api/payload-helper)
* [Conversions API Server Event Parameters](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/server-event)
* [Conversions API Customer Information Parameters](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/customer-information-parameters)
* [Conversions API App Data Parameters](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/app-data)
