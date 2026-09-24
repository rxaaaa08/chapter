<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/reach-estimate | Saved: 2026-09-19 -->

# Reach Estimate API



Get a range of individuals for your targeting and what bids to make to reach that target group with the `/reachestimate` API. You can call this API in one of these ways:

* Specify an ad account and a targeting spec:

```
curl -G \
  --data-urlencode 'targeting_spec={
    "geo_locations": {"countries":["US","GB"]},
    "publisher_platforms": ["instagram"],
    "user_os": ["iOS"]
  }' \
  -d 'optimize_for=IMPRESSIONS' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/reachestimate
```

## Reference

- [Ad Account Reachestimate](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/reachestimate)
- [Reach Estimate](https://developers.facebook.com/docs/marketing-api/reference/reach-estimate)
