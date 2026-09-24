<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/advantage-targeting | Saved: 2026-09-19 -->

# Advantage Targeting



You can enable Meta to expand some targeting options when doing so increases results at a lower cost per result. Expanding individual targeting options does not change your targeting specifications for location, demographic targeting, such as age or gender, or exclusions.

Targeting automation settings are expressed through distinct properties:

* `targeting_optimization_types` — View only and present at the campaign spec, this property indicates enforced automation (lookalike and detailed targeting)
* `targeting_relaxation_types` — Editable and present at the targeting spec, this property indicates opt-in lookalike and custom audience expansion
* `targeting_optimization` — Editable and present at the targeting spec, this property indicates detailed targeting expansion

An example of `targeting_optimization_types`:

```json
targeting_optimization_types: {
  detailed_targeting: 1,
  lookalike: 1
}
```

Meta sets the `lookalike` and `detailed_targeting` flags to `1` (indicating expansion is turned on) in the following optimization goals:

* Value
* App installs
* App events
* Conversations
* Offsite clicks
* Landing page views
* Replies
* Messaging purchase conversions
* Research poll responses
* In app value
* Subscribers
* Clicks
* Reminder set
* Social impressions
* Offer claims
* Offsite conversions
* Return on ad spend
* Onsite conversions
* App installs and offsite conversions
* Incremental offsite conversions
* Store visits

For other optimization goals, this setting won't be shown. Opt-in and opt-out `targeting_relaxation_types` and `targeting_optimization` targeting automation settings are covered in the [Advantage+ Audience](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/targeting-expansion/advantage-audience), [Advantage Detailed Targeting](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/targeting-expansion/advantage-detailed-targeting), [Advantage Lookalike](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/targeting-expansion/advantage-lookalike) and [Advantage Custom Audience](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/targeting-expansion/advantage-custom-audience) documentation.

**Note:** Automation is not supported in [Reservation](https://developers.facebook.com/docs/marketing-api/reachandfrequency) flows.
