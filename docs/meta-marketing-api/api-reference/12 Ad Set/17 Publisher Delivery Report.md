<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign/publisher_delivery_report | Saved: 2026-09-19 -->

# Ad Campaign Publisher Delivery Report



## Reading

Publisher delivery report for a specified ad set.

#### Example

### HTTP
```
GET /v25.0/{ad-set-id}/publisher_delivery_report HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{ad-set-id}/publisher_delivery_report',
    '{access-token}'
  );
} catch(Facebook\Exceptions\FacebookResponseException $e) {
  echo 'Graph returned an error: ' . $e->getMessage();
  exit;
} catch(Facebook\Exceptions\FacebookSDKException $e) {
  echo 'Facebook SDK returned an error: ' . $e->getMessage();
  exit;
}
$graphNode = $response->getGraphNode();
/* handle the result */
```

### JavaScript SDK
```
/* make the API call */
FB.api(
    "/{ad-set-id}/publisher_delivery_report",
    function (response) {
      if (response && !response.error) {
        /* handle the result */
      }
    }
);
```

### Android SDK
```
/* make the API call */
new GraphRequest(
    AccessToken.getCurrentAccessToken(),
    "/{ad-set-id}/publisher_delivery_report",
    null,
    HttpMethod.GET,
    new GraphRequest.Callback() {
        public void onCompleted(GraphResponse response) {
            /* handle the result */
        }
    }
).executeAsync();
```

### iOS SDK
```
/* make the API call */
FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc]
                               initWithGraphPath:@"/{ad-set-id}/publisher_delivery_report"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bad-set-id%7D%2Fpublisher_delivery_report&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `end_date`<br><br>*datetime* | The end date for the delivery report<br> |
| `name_contains`<br><br>*string* | What substring the name of publishers returned should contain<br> |
| `platform`<br><br>*enum {AUDIENCE_NETWORK, FACEBOOK, INSTAGRAM, MESSENGER, WHATSAPP, WHATSAPP_STATUS, OCULUS, THREADS, UNKNOWN, HIDDEN_AAA}* | The platform type of the publisher delivery report requested<br><br>**[required]**<br> |
| `position`<br><br>*enum {ALL_PLACEMENTS, AN_CLASSIC, FEED, GROUPS, FACEBOOK_GROUPS_FEED, INSTAGRAM_STORIES, MESSENGER_INBOX, RIGHT_HAND_COLUMN, OTHERS, SEARCH, INSTANT_ARTICLE, INSTREAM_VIDEO, REWARDED_VIDEO, SUGGESTED_VIDEO, MARKETPLACE, FACEBOOK_STORIES, MESSENGER_STORIES, STATUS, INSTAGRAM_EXPLORE, UNKNOWN, VIDEO_FEEDS, INSTAGRAM_IGTV, HIDDEN_AAA, JOBS_BROWSER, OCULUS_TWILIGHT_FEED, STICKERS, INSTAGRAM_REELS, INSTAGRAM_SHOP, OCULUS_VR_APPS, BIZ_DISCO_FEED, OCULUS_REWARDED_VIDEO, OCULUS_TWILIGHT_FEED_SPOTLIGHT, OCULUS_TWILIGHT_SEARCH, OCULUS_TWILIGHT_SEARCH_NULL_STATE, FACEBOOK_REELS, OCULUS_TWILIGHT_DEVELOPER_UPDATE, FACEBOOK_REELS_OVERLAY, INSTAGRAM_REELS_OVERLAY, INSTAGRAM_EFFECT_TRAY, INSTAGRAM_EXPLORE_GRID_HOME, INSTAGRAM_PROFILE_FEED, INSTAGRAM_PROFILE_REELS, FACEBOOK_PROFILE_FEED, INSTAGRAM_SEARCH, ADS_ON_FACEBOOK_REELS, INSTAGRAM_LEAD_GEN_MULTI_SUBMIT, WHATSAPP_MARKETING_MESSAGES, FACEBOOK_PROFILE_REELS, THREADS_FEED, WHATSAPP_CHANNEL, FACEBOOK_NOTIFICATION, MESSENGER_MARKETING_MESSAGES, FACEBOOK_MULTI_ADS, FACEBOOK_REELS_BANNER, FACEBOOK_REELS_POSTLOOP, FACEBOOK_INSTREAM_BANNER, FACEBOOK_INSTREAM_VIDEO, INSTAGRAM_REELS_INSTREAM}* | The position of the publisher delivery report requested<br><br>**[required]**<br> |
| `publisher_status`<br><br>*enum {ALL, PARTNER, NON_PARTNER}* | **Default value: **`"ALL"`<br>An in-stream publisher status to filter<br> |
| `sort_by`<br><br>*enum {URL_ASCENDING, URL_DESCENDING, NAME_ASCENDING, NAME_DESCENDING, IMPRESSIONS_ASCENDING, IMPRESSIONS_DESCENDING}* | **Default value: **`"IMPRESSIONS_DESCENDING"`<br>Which category and direction the report is sorted by<br> |
| `start_date`<br><br>*datetime* | The start date for the delivery report<br> |
| `summary`<br><br>*boolean* | **Default value: **`true`<br>summary<br> |

#### Fields

Reading from this edge will return a JSON formatted result:

```
{
"data": [],
"paging": {},
"summary": {}
}
```

##### data

A list of [PublisherDeliveryReport](https://developers.facebook.com/docs/marketing-api/reference/publisher-delivery-report) nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

##### summary

Aggregated information about the edge, such as counts. Specify the fields to fetch in the summary param (like summary=__type__).

| Field | Description |
| --- | --- |
| `end_date`<br><br>*string* | The end date for the delivery report<br><br><br>**[default]**<br> |
| `non_partner_count`<br><br>*unsigned int32* | Number of rows of non in-stream partner returned<br><br><br>**[default]**<br> |
| `start_date`<br><br>*string* | The start date for the delivery report<br><br><br>**[default]**<br> |
| `total_count`<br><br>*unsigned int32* | Total number of rows in the report<br><br><br>**[default]**<br> |

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

