<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/real-estate-ads/audience | Saved: 2026-09-19 -->

# Build a Real Estate Audience



**Note:** Beginning with the release of **Marketing API v15.0**, you will no longer be able to create Special Ad Audiences. See [Special Ad Audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/special-ad-category#special-ad-audiences) for more information.

Create a real estate audience:

* [Step 1: Set up user signals for real estate events](#events)
* [Step 2: Associate user signals to catalog](#associate-signals-to-catalog)
* [Step 3: Create and share real estate event source groups](#create-event-source-group)
* [Step 4: Create audiences](#create-audiences)

## Step 1: Set up user signals for real estate events {#events}

These are predefined event names you can send from your website or app that allow you to both measure the performance of your campaigns and to capture intent from your audiences. See [Facebook Pixel Setup](https://developers.facebook.com/docs/marketing-api/audiences-api/pixel).

Real estate ads require these standard events from your website pixel and mobile app:

| Pixel Event | App Event | Requirement Level | Description |
| --- | --- | --- | --- |
| `Search` | `fb_mobile_search` | ◉ | Someone searched home listings |
| `ViewContent` | `fb_mobile_content_view` | ◉ | Someone viewed a specific listing |
| `InitiateCheckout` | `fb_mobile_initiated_checkout` | ◉ | Someone saved, liked, or showed special interest in a listing |
| `Purchase` | `fb_mobile_purchase` | ◉ | Someone contacted an agent about a listing |

* ◉ __Required__: Ads will not work without these parameters.
* ◎ __Recommended__: Not strictly required but enables better recommendations and more targeting options for your ads. Provide as many as possible.
* ◯ __Not Required__: Not required and may be ignored.

For example, to report a Search event for a listing using FB pixel or App events, place this code on your search-results page:

### JavaScript SDK
```
<!-- Facebook Pixel Code -->
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');

// Insert Your Facebook Pixel ID below.
fbq('init', '<FB_PIXEL_ID>');

fbq('track', 'Search', {
  content_type: 'home_listing',
  content_ids: ['1234', '2345', '3456', '4567'], // Top search results
  city: 'New York City', //Required for Search event
  region: 'New York', // region is the state for the US. Required for Search event
  country: 'US', //Required for Search event
} );
</script>
<!-- End Facebook Pixel Code -->
```

### Android SDK
```
Bundle parameters = new Bundle();
parameters.putString(AppEventsConstants.EVENT_PARAM_CONTENT_TYPE, "home_listing");
parameters.putString(AppEventsConstants.EVENT_PARAM_CONTENT_ID, "[\"1234\", \"2345\", \"3456\", \"4567\"]"); // top search results

// we must prefix all travel-specific parameters with fb_
parameters.putString("fb_city", "New York City"); // Required for Search event
parameters.putString("fb_region", "New York"); // region is the state for the US. Required for Search event
parameters.putString("fb_country", "US"); // Required for Search event

logger.logEvent(
  AppEventsConstants.EVENT_NAME_SEARCHED,
  parameters
);
```

### Objective-C
```
[FBSDKAppEvents logEvent:FBSDKAppEventNameSearched
  parameters:@{
    FBSDKAppEventParameterNameContentType : @"home_listing",
    FBSDKAppEventParameterNameContentID : @"[\"1234\", \"2345\", \"3456\", \"4567\"]", // top search results
        // we must prefix all travel-specific parameters with fb_
        @"fb_city" : @"New York City", //Required for Search event
      @"fb_region" : @"New York", // region is the state for the US. Required for Search event
      @"fb_country" : @"US", // Required for Search event
  }
];
```

Once you determine which events should fire, you should provide each event's parameters.

## Event parameters

The table below lists required and recommended parameters.

| Pixel Parameter | Mobile Parameter | Requirement Level |
| --- | --- | --- |
| `content_ids` | `fb_content_id` | ◉ |
| `content_type` | `fb_content_type` | ◯ |
| `lease_start_date` |  | ◎ |
| `lease_end_date` |  | ◎ |
| `preferred_baths_range` |  | ◎ |
| `preferred_beds_range` |  | ◎ |
| `preferred_price_range` |  | ◎ |
| `currency` | `fb_currency` | ◎ |
| `property_type` |  | ◎ |
| `listing_type` |  | ◎ |
| `availability` |  | ◎ |
| `city` | `fb_city` | ◎ |
| `neighborhood` |  | ◎ |
| `region` | `fb_region` | ◎ |
| `country` | `fb_country` | ◎ |

## Parameter details

| Parameter Name | Data Type | Description |
| --- | --- | --- |
| `availability` | `string` | Value must be `available_soon`, `for_rent`, `for_sale`, `off_market`, `recently_sold` or `sale_pending`. |
| `city` | `string` | Provide the user's city of interest, such as `'Menlo Park'` |
| `content_ids` | `string` or `string[]` | Any IDs in your listing catalog. For example, for `ViewContent` event, send the ID of the item viewed, or for `Search` send an array of IDs for top results: `['1234', '2345', '3456', '4567']` |
| `content_type` | `string` or `string[]` | For example:<br><br>* `'home_listing'`<br>* `['home_listing', 'product']`<br>* `['home_listing', 'hotel']` |
| `country` | `string` | Target country of interest, such as `'United States'` |
| `currency` | `string` | Specify the currency using ISO 4217 currency format: `'USD'` |
| `lease_start_date` | `string` | Allows us to recommend properties based on their date availability (using `available_dates_price_config` in the catalog), and improve the user landing experience (using template tags). Specified using ISO 8601 date format: `'YYYY-MM-DD'` (for example, `2018-01-01`). |
| `lease_end_date` | `string` | Specified using ISO 8601 date format: `'YYYY-MM-DD'` (for example, `'2018-02-01'`). |
| `listing_type` | `string` | Value must be `for_rent_by_agent`, `for_rent_by_owner`, `for_sale_by_agent`, `for_sale_by_owner`, `foreclosed`, `new_construction` or `new_listing`. |
| `neighborhood` | `string` | Neighborhood of interest: `'Menlo Oaks'` |
| `preferred_baths_range` | `[int`(min)`, int`(max)`]` | Number of bathrooms chosen as range: `[1, 2]` |
| `preferred_beds_range` | `[int`(min)`, int`(max)`]` | Number of bedrooms chosen as range: `[1, 2]` |
| `preferred_price_range` | `[float`(min)`, float`(max)`]` | Price range: `[1000.99, 2000.99]` |
| `property_type` | `string` | Must be `apartment`, `condo`, `house`, `land`, `manufactured`, `other` or `townhouse`. |
| `region` | `string` | State, district, or region of interest: `'California'` |

## Step 2: Associate signals to listing catalog {#associate-signals-to-catalog}

Associate your event sources with each of your listing catalogs. See [Business Manager's Catalog Page](https://business.facebook.com/settings/product-catalogs/) To select the pixel and app via API which send events, make an `HTTP POST`:

### cURL
```bash
curl \
  -F '0=<PIXEL_ID>' \
  -F '1=<APP_ID>' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/<API_VERSION>/<PRODUCT_CATALOG_ID>/external_event_sources
```

Specify these parameters:

| Field Name | Data Type | Description |
| --- | --- | --- |
| `external_event_sources` (required) | `int[]` | List of Pixel and App IDs to associate with the catalog. |

## Step 3: Create and share real estate event source groups {#create-event-source-group}

To build an audience, an admin for your business must create an event source group. This groups all of your sources that send listing interest signals. Make an `HTTP POST`:

### cURL
```bash
curl \
  -F 'name=My Real Estate Company Events' \
  -F 'event_sources=['<PIXEL_ID>','<APP_ID>']' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/<API_VERSION>/<BUSINESS_ID>/event_source_groups
```

Then share this event source group to any ad accounts that will run ads to audiences generated by these event sources. Make an `HTTP POST`:

### cURL
```bash
curl \
  -F 'accounts=['<ACCOUNT_ID_WITHOUT_ACT>']' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/<API_VERSION>/<EVENT_SOURCE_GROUP_ID>/shared_accounts
```

## Step 4: Create Audiences {#create-audiences}

At this point you have signals from pixels or app events set up and associated with an [event source group](#create-event-source-group) and your real estate catalog. To target people interested in your listings, create a dynamic audience of people. Include or exclude people from the audience based on the intent signals. You can also apply additional rule-based filters to customize your audience as you do with Website Custom Audiences. See [Custom Audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/website-custom-audiences).

To set up a new audience, make an `HTTP POST` to `/act_<AD_ACCOUNT_ID>/customaudiences`.

### Required parameters
| Field Name | Data Type | Description |
| --- | --- | --- |
| `name` | `string` | Audience name. |
| `subtype` | `enum {CLAIM}` | Type of custom audience.<br>Must be set to `CLAIM`. |
| `claim_objective` | `enum {HOME_LISTING}` | Objective of audience.<br>Must be set to `HOME_LISTING`. |
| `event_source_group` | `id` | Event source group to build audience. |
| `inclusions` | `object[]` | Array of JSON objects. Lists each intent signal that makes someone eligible for this audience. |
| inclusions: `event` (required) | `enum {<br>Search,<br>ViewContent,<br>InitiateCheckout,<br>Purchase<br>}` | Event name of a signal. Used for inclusion in audience: `{'event': 'Search', …}`. |
| inclusions: `retention` (required) | `object` | Minimum and maximum amount of time since Meta received the event. Determines whether to consider the event for inclusion. Example: `{…, 'retention': {'min_seconds': 0, 'max_seconds': 259200}, …}`. Retention must be at least 4 hours. |
| inclusions: `count` | `JSON` [operators](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/website-custom-audiences#audiencerules) | Number of times event fired. You can use both equality and numeric comparison operators such as `{…'count': {'lte': 3}, …}`. |

### Optional parameters
| Field Name | Data Type | Description |
| --- | --- | --- |
| `content_type` | `enum {HOME_LISTING}` | Type of signals used to build this audience. |
| `description` | `string` | Description of audience. |
| `exclusions` | `object[]` | Array of JSON objects listing each intent signal that excludes someone from this audience. |
| exclusions: `event` (required) | `enum {<br>Search,<br>ViewContent,<br>InitiateCheckout,<br>Purchase<br>}` | Event name of a signal used for exclusion: `{'event': 'Search', …}`. |
| exclusions: `retention` (required) | `object` | Minimum and maximum amount of time since Meta received the event. Determines whether to consider the event for exclusion, for example, `{…, 'retention': {'min_seconds': 0, 'max_seconds': 259200}, …}`. Retention must be at least 4 hours. |
| `rule` | `object` | [Audience Rule](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/website-custom-audiences#audiencerules) from Website Custom Audiences. Filter event stream by these rules before any `inclusions` and `exclusions` processed.<br><br>See a list of specific fields available. You can use these with any of standard `JSON` [Operators for Audience Rules](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/website-custom-audiences#audiencerules). |
| rule: `home_listing_set_id` (required) | `object` | Listing set ID: `{'eq': '1234'}}` |

For example, to create an audience that targets people who viewed or purchased in the last 14 days:

### cURL
```bash
curl \
  -F 'name=Viewed or Purchased Last 14 days' \
  -F 'subtype=CLAIM' \
  -F 'claim_objective=HOME_LISTING' \
  -F 'content_type=HOME_LISTING' \
  -F 'event_source_group=<EVENT_SOURCE_GROUP_ID>' \
  -F 'rule={"home_listing_set_id":{"eq":"<HOME_LISTING_SET_ID>"}}' \
  -F 'inclusions=[
    {
      "event": "ViewContent",
      "count": {"gt":0},
      "retention": {"min_seconds":0,"max_seconds":1209600}
    },
    {
      "event": "Purchase",
      "count": {"gt":0},
      "retention": {"min_seconds":0,"max_seconds":1209600}
    }
  ]' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/<API_VERSION>/act_<AD_ACCOUNT_ID>/customaudiences
```

