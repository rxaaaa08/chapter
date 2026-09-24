<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/targeting-restrictions | Saved: 2026-09-19 -->

# Targeting Restrictions



**Note:** Advertisers running housing, employment, and credit ads, who are based in the United States or running ads targeted to the United States have different sets of restrictions. See [**Special Ad Category**](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/special-ad-category).

Limitations on ad targeting:

| Area | Limit |
| --- | --- |
| Minimum age of a user to target ad | 13 years old |
| Maximum age of a user to target ad | 65 years old |
| Languages targeted per ad | 90 (50 recommended) |
| Interests targeted | No limit (100 recommended) |
| Colleges targeted | 200 (100 recommended) |
| Workplaces targeted | 200 (100 recommended) |
| Majors targeted | 200 (100 recommended) |
| Cities targeted | 250 |
| Regions targeted | 200 |
| `custom_locations` | 200 |
| `geo_markets` | 210 |
| Connections targeted | 50 |
| Latest graduation year targeted | 1980 |
| Targeting by zip code | 50,000. Past limit was 2500 zip codes. If you use more than 50,000 zip codes, Meta creates an object that represents a set of zip codes. You can view this object in the ad set's `targeting_spec`. |

