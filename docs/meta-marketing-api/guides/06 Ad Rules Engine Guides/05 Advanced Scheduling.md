<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/advanced-scheduling | Saved: 2026-09-19 -->

# Advanced scheduling


This guide provides examples for the `schedule_type` of `CUSTOM`.

As referenced from the [main documentation](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/scheduled-based-rules):

If the `schedule_type` is `CUSTOM`, you must also specify the list of custom schedules, or times when the rule will run. In the `schedule` list, each individual specification can combine the following fields, with the only requirement that at least one of `start_minute` or `days` must exist in each entry.

| Field | Description |
| --- | --- |
| `start_minute` | Time in minutes after 12:00AM. Must be a multiple of 30 minutes.<br>If `start_minute` is set and there is no `end_minute`, `start_minute` determines<br>the exact time to run the rule. Otherwise, `start_minute` determines with<br>`end_minute` the range of time to run the rule. If `start_minute` is not set,<br>the rule runs `SEMI_HOURLY` for each day in `days`. |
| `end_minute` | Time in minutes after 12:00AM. Must be a multiple of 30 minutes<br>and after `start_minute`. If set, `end_minute` determines with<br>`start_minute` the range of time to run the rule. If `end_minute` is<br>the same as `start_minute`, the rule runs at that exact time. |
| `days` | List of days to run the rule. Each day must be a value from `0-6`.<br>`0` is Sunday, `1` is Monday, ..., `6` is Saturday. If this is not set,<br>the rule runs on all 7 days based on the `start_minute` and,<br>if exists, the `end_minute`. |

Here's an example of using Advanced Scheduling to schedule the rule to run every day at 10 AM. Omitting the `days` applies the schedule to every day.

```bash
curl \
-F 'name=Test Advanced Scheduling Rule' \
-F 'schedule_spec={
     "schedule_type": "CUSTOM",
     "schedule": [
       {
         "start_minute": 600,
       }
     ]
   }' \
-F 'evaluation_spec={
     ...
   }' \
-F 'execution_spec={
     ...
   }' \
-F "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<VERSION>/<AD_ACCOUNT_ID>/adrules_library
```

## Custom schedule examples

Here's an example of a rule that runs every 30 minutes only on weekends. By omitting `start_minute`, the rule runs as `SEMI_HOURLY` for the specified days.

```bash
curl \
-F 'name=Test Advanced Scheduling Rule' \
-F 'schedule_spec={
     "schedule_type": "CUSTOM",
     "schedule": [
       {
         "days": [0, 6]
       }
     ]
   }' \
-F 'evaluation_spec={
     ...
   }' \
-F 'execution_spec={
     ...
   }' \
-F "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<VERSION>/<AD_ACCOUNT_ID>/adrules_library
```

Here's an example of a rule that only runs on Wednesdays at 2 AM. By omitting `end_minute`, the rule runs at one specific time instead of a range of times.

```bash
curl \
-F 'name=Test Advanced Scheduling Rule' \
-F 'schedule_spec={
     "schedule_type": "CUSTOM",
     "schedule": [
       {
         "start_minute": 120,
         "days": [3]
       }
     ]
   }' \
-F 'evaluation_spec={
     ...
   }' \
-F 'execution_spec={
     ...
   }' \
-F "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<VERSION>/<AD_ACCOUNT_ID>/adrules_library
```

The API calculates each individual schedule independently as an OR with the other schedules. Here's an example of a rule that runs all day on the weekdays, but only from 12-1PM on the weekends. By having an `end_minute` here, the range of time runs from the `start_minute` to `end_minute`.

```bash
curl \
-F 'name=Test Advanced Scheduling Rule' \
-F 'schedule_spec={
     "schedule_type": "CUSTOM",
     "schedule": [
       {
         "days": [1, 2, 3, 4, 5]
       },
       {
         "start_minute": 720,
         "end_minute": 780,
         "days": [0, 6]
       }
     ]
   }' \
-F 'evaluation_spec={
     ...
   }' \
-F 'execution_spec={
     ...
   }' \
-F "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<VERSION>/<AD_ACCOUNT_ID>/adrules_library
```

You can also omit `days` in the second schedule specification. This works the same way, because the first specification includes 12-1PM on weekdays.
