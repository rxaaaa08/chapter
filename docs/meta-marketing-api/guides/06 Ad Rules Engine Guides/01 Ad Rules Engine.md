<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules | Saved: 2026-09-19 -->

# Ad Rules Engine



The ad rules engine is a central rule management service that helps you manage ads automatically based on rules you define. Without the ad rules engine, you must query the Marketing API to monitor an ad's performance and manually take actions on certain conditions.

Since most conditions can be expressed as logical expressions, you can automate management in two ways: [Schedule-based rules](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/scheduled-based-rules) or [Trigger-based rules](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/trigger-based-rules).

## Ad rules objects

You create ad rules as standalone objects and store them in the ad rules library. Each ad rule minimally contains a `name`, an [`evaluation_spec`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/overview/evaluation-spec) and an [`execution_spec`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/overview/execution-spec).

### Basic structure

To create an ad rule, send a `POST` request to the `adrules_library` edge of your ad account, as shown in the following example:

```bash
curl -X POST \
  -F 'name=Rule 1' \
  -F 'evaluation_spec={
    ...
  }' \
  -F 'execution_spec={
    ...
  }' \
  -F "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adrules_library
```

## Options

### [Trigger-based rules](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/trigger-based-rules)

Monitor the state of your ads in real-time. The ad rules engine evaluates a trigger-based rule as soon as the relevant ad objects' metadata or [Ad Insights](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup/insights) data change.

### [Schedule-based rules](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/scheduled-based-rules)

Monitor the state of your ads by checking them at a set time interval to see if they meet the `evaluation_spec` criteria.

## Components

### [Evaluation spec](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/overview/evaluation-spec)

The main purpose of the `evaluation_spec` of a rule is to determine the objects upon which the rule should execute its action.

### [Execution spec](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/overview/execution-spec)

The `execution_spec` of a rule determines the action that applies to all objects that pass evaluation.

### Status

The `status` of a rule determines whether the rule should be running.

To temporarily turn off a rule, set its status to `DISABLED`. To reactivate a rule, set its status to `ENABLED`. To permanently remove a rule, delete it.
