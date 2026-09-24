<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/api-calls | Saved: 2026-09-19 -->

# API Calls


See examples of API calls to use the Ad Rules Engine.

## Read all rules of an account {#read-all}

```
curl -G   \
-d 'fields=name,evaluation_spec,execution_spec,status'   \
-d 'access_token=<ACCESS_TOKEN>'   \
https://graph.facebook.com/<VERSION>/<AD_ACCOUNT_ID>/adrules_library
```

## Read a rule {#read-rule}

```
curl -G   \
-d 'fields=name,evaluation_spec,execution_spec,status'   \
-d 'access_token=<ACCESS_TOKEN>'   \
https://graph.facebook.com/<VERSION>/<AD_RULE_ID>
```

## Update a rule {#update-rule}
To update a spec, provide all fields, **including those that are unchanged**. The following is an example updating the rule's trigger to be for every 1,000 impressions. Updating a rule's status requires no spec changes.

```
curl \
-F 'evaluation_spec={
      "evaluation_type": ...,
      "trigger" : {
        "type": "STATS_MILESTONE",
        "field": "impressions",
        "value": 1000,
        "operator": "EQUAL"
      },
      "filters": ...
     ]
   }' \
-F 'access_token=<ACCESS_TOKEN>'   \
https://graph.facebook.com/<VERSION>/<AD_RULE_ID>
```

Here is an example updating the filters to select all ads that have more than 200 clicks. Other filters such as `entity_type` and `time_preset` must still be in this update.

```
curl \
-F 'evaluation_spec={
      "evaluation_type": ...,
      "filters" : [
       {
         "field": "clicks",
         "value": 200,
         "operator": "GREATER_THAN",
       },
       {
       ...
     ]
   }' \
-F 'access_token=<ACCESS_TOKEN>'   \
https://graph.facebook.com/<VERSION>/<AD_RULE_ID>
```

## Delete a rule {#delete-rule}

```
curl -X DELETE \
-d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/<VERSION>/<AD_RULE_ID>
```

## Access a rule's execution history {#history}
Access historic data for each rule's executions through a dedicated endpoint. By default, this endpoint provides relevant data, such as results and actions. You can also check the state of the rule at each execution to track edits.

```
curl -G   \
-d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/<VERSION>/<AD_RULE_ID>/history
```

In addition, this endpoint supports three filtering mechanisms on the data: `object_id`, `action`, and `hide_no_changes`. You can filter the results by an `object_id` or an `action` to see results for only that `object_id` or `action` type.

You can also filter the results using the `hide_no_changes` flag to exclude executions that made no changes. You can combine the `object_id`, `action`, and `hide_no_changes` filters to further narrow your results.

```
curl -G   \
-d 'object_id=123' \
-d 'action=CHANGED_BID' \
-d 'hide_no_changes=true' \
-d "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<VERSION>/<AD_RULE_ID>/history
```

## Access an account's execution history {#account-history}
Access aggregated history data for all rules under your account through a dedicated endpoint. By default, this endpoint provides the same relevant data as the [rule's execution history](#history), but also includes the id of the rules for each entry.

Entries in this endpoint are ordered from newest to oldest. This endpoint also supports the same filtering mechanisms as above: `object_id`, `action`, and `hide_no_changes`.

```
curl -G   \
-d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/<VERSION>/<AD_ACCOUNT_ID>/adrules_history
```

## Preview a rule {#preview}
Preview the evaluation of a [Schedule Based Rule](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/scheduled-based-rules) by sending a `POST` request to this endpoint, which returns a list of objects that satisfy all specified filters of the rule at that time.

```
curl \
-F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/<VERSION>/<AD_RULE_ID>/preview
```

## Manually execute a rule {#execute}
Manually execute a [Schedule Based Rule](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/scheduled-based-rules) by sending a `POST` request to this endpoint. When a `POST` request is sent to this endpoint, the engine immediately schedules the rule to run.

```
curl \
-F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/<VERSION>/<AD_RULE_ID>/execute
```

You can fetch results from the execution history once execution completes.

## Read governing rules for an object {#govern}
Read all the rules that govern each ad, ad set, and ad campaign through these endpoints. By default, a rule governs an object if it statically references it by the `id` filter or dynamically references it by the `entity_type` filter.

This endpoint also supports an optional `pass_evaluation`. With `pass_evaluation`, you can further limit the list of rules, by whether or not the object would pass the rule's filters at that time. If `pass_evaluation` is `true`, you receive all rules that, when [previewed](#preview), would return the object. If it is `false`, you receive all rules that would not.

```
curl \
-F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/<VERSION>/<AD_OBJECT_ID>/adrules_governed
```
