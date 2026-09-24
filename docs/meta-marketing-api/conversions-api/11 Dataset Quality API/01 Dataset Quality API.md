<!-- Source: https://developers.facebook.com/documentation/ads-commerce/conversions-api/dataset-quality-api | Saved: 2026-09-19 -->

# Dataset Quality API


**Warning:** **Ads Management Standard Access is now Marketing API Access Tier**

**No code changes are needed.**

Tier labels have been updated: "Standard Access" is now **Limited Access**, and "Advanced Access" is now **Full Access**. The revised qualification threshold for Full Access has been reduced from 1,500 to **500 Marketing API calls** in the past 15 days. The underlying permission identifier remains the same, and existing access levels are preserved automatically. Learn more in the [Marketing API Access Tier documentation](https://developers.facebook.com/docs/features-reference#marketing-api-access-tier).

Advertisers that share server events using the Conversions API can see the event match quality score in Meta Events Manager. However, this only works on an individual basis and is difficult to scale in cases where a Tech Provider partner, agency partner, or advertiser is managing hundreds and thousands of Meta Pixels for their businesses. The Dataset Quality (formerly known as Integration Quality) API can help solve this problem by consolidating dataset quality metrics programmatically at scale.

**Warning:** ## What's new

As of May 28th, 2025, the following additional metrics have been added to the API for querying.

* [Additional Conversions Reported](#acr-main)
* [Additional Conversions Reported per parameter](#acr-params)
* [Additional Conversions Reported for per event](#acr-capi-event)
* [Additional Conversions Reported for event coverage](#acr-event-coverage)
* [Event Coverage](#event-coverage)
* [Event Deduplication](#event-deduplication)
* [Data Freshness](#data-freshness)
* [Event Match Quality Diagnostics](#emq-diagnostics)

Also, the [Dataset Quality API for Offline Events](https://developers.facebook.com/documentation/ads-commerce/conversions-api/dataset-quality-api/offline-events), currently under beta, and new metrics are now available.

## Common use cases

Partners and agencies may use the Dataset Quality API to provide a quality dashboard and insights, while helping their advertisers to enhance and optimize their integrations. Partners may also use this integration to monitor the stability of their Conversions API integration. Advertisers may use this endpoint to aggregate dataset quality data to incorporate in their monitoring.

## Setup requirements

### Ownership and access

#### Advertiser authentication using Meta Business Suite

1. In Meta Business Suite, go to the Users section and select the **System User** tab. Click on the specific system user you are using for the Conversions API.
2. Go to the Assign Asset dialog and choose **Pixels**. Then, select the pixels you want to send events on behalf of.
3. For each pixel, select the Manage Pixel permission, and click **Save Changes**.
4. Go back to your system user's details page. Verify that the selected pixels are visible there.
5. To generate the access token, follow instructions [here](https://www.facebook.com/business/help/503306463479099?id=2190812977867143).

#### Partner platform authentication

You must first request authorization to send events on behalf of your clients. You have the following authentication options:

##### Facebook Login for Business (recommended)

[Facebook Login for Business](https://developers.facebook.com/documentation/facebook-login/facebook-login-for-business) is the preferred authentication and authorization solution for Tech Providers and business app developers who need access to their business clients' assets. It allows you to specify the access token type, types of assets, and permissions your app needs, and save it as a set (configuration). You can then present the set to your business clients to complete the flow and grant your app access to their business assets.

##### Meta Business Extension (recommended)

With this option, [Meta Business Extension](https://developers.facebook.com/docs/facebook-business-extension) (MBE) returns all the necessary information needed to send events on behalf of the client. MBE provides an endpoint to retrieve system user access tokens created in the client's Meta Business Suite. This process includes permissions to send server events and is done automatically and securely. MBE is currently under beta. Please contact your Meta representative for access.

The endpoint requires a user access token as an input parameter. If you are a new MBE user, call this endpoint to fetch the system user access token after you have finished setting up MBE. Existing users need to ask for re-authentication before calling the new API endpoint.

##### Client shares Meta Pixel to partner's Meta Business Suite

With this option, the client shares their Meta Pixel to the partner using Meta Business Suite settings or by the [API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/shared_accounts). Then, the partner can assign the partner system user to the client pixel and [generate an access token to send server events](https://developers.facebook.com/documentation/ads-commerce/conversions-api/set-up-conversions-api-as-a-platform#get-started).

##### Client generates token manually using Events Manager

Advertisers can generate access tokens in Events Manager to set up the Conversions API and access the Dataset Quality API. You can configure a direct integration or share the generated access token with your partners to send events to Meta. You can copy and save this new token. Note that Meta will not store these tokens. The generated token will be able to fetch quality data and send events using the Conversions API.

#### User permission
* The user or system user used to make the API call requires (at minimum) the following user permission: **Partial access -> Use events dataset**
* User access may be granted (in bulk) by using the instructions provided [here](https://www.facebook.com/business/help/279059996069252?id=2042840805783715).

#### App permission
* **Basic:** If you manage a small number of Meta datasets and/or wish to test the Dataset Quality API, then the following app permissions are required: **ads_read** and (**ads_management** or **business_management**).

* **Advanced:** If you manage a high number of Meta datasets on behalf of other businesses and/or require higher rate limits, then the **advanced level** of the **ads_management** app permission and app feature **Marketing API Access Tier** is required. Advanced level app permissions and features require [app review](https://developers.facebook.com/docs/resp-plat-initiatives/individual-processes/app-review).

## Retrieving dataset quality information

### Endpoint
```
https://graph.facebook.com/v25.0/dataset_quality
```

### Parameters

| Parameter | Description |
| --- | --- |
| `dataset_id`<br><br>integer | **Required.**  <br>The ID of dataset (Pixel) to retrieve quality data. |
| `access_token`<br><br>string | **Required.**  <br>Valid (unexpired) access token for given dataset (Pixel) ID. Set up a long-lived system user access token.<br>Read more about the different types of access tokens in the dedicated [guide](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens). |
| `agent_name`<br><br>string | **Optional.**  <br>The normalized value of the `partner_agent` field is used to filter only events sent with the `partner_agent` param in [/{pixel_id}/events](https://developers.facebook.com/documentation/ads-commerce/conversions-api/using-the-api#send) POST request (see attributing your events best practices [here](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/end-to-end-implementation#step-3--attribute-events-to-your-platform) and [here](https://developers.facebook.com/documentation/ads-commerce/conversions-api/best-practices#bp-agencies)).<br><br>For example, if your partner_agent value is `[partner_name]_[majorversion]_[minorVersion]`, your normalized agent string value will be `partner_name` in lowercase.<br><br>The `agent_name` allows you to set your own platform identifier when sending events on behalf of a client. If you are a managed partner/agency, work with your Meta representative to agree on an identifier for your platform.<br><br>If you are an advertiser, most of the time you should not worry about `agent_name` attribution.<br><br>If you do not provide an `agent_name`, all events regardless of whether they were sent by an agent or not, will be included in the EMQ calculation. |

### Fields

| Field | Description |
| --- | --- |
| `web`<br><br>array | This field denotes a structured set of data related to website events. The filter is an array containing `event_name` and its metrics. This field is required by default in this API. See [example section](#example-section). |
| `event_name`<br><br>string | A [standard event](https://developers.facebook.com/docs/facebook-pixel/implementation/conversion-tracking#standard-events) or [custom event](https://developers.facebook.com/docs/facebook-pixel/implementation/conversion-tracking#custom-events) name. |
| `event_match_quality`<br><br>[AdsPixelCAPIEMQ(/docs/marketing-api/reference/ads-pixel-capiemq)] | Event Match Quality indicates how effective the customer information sent from your server may be at matching event instances to a Facebook account.  <br><br>See more details [here](#emq-main). |
| `event_potential_aly_acr_increase`<br><br>[AdsPixelCAPIEventALYACR](https://developers.facebook.com/docs/marketing-api/reference/ads-pixel-capi-event-alyacr) | Additional Conversions Reported (ACR) for Conversions API Event is a metric that estimates how many conversions (for example, purchases, or link clicks) are measured as a result of an advertiser's Conversions API setup.<br><br>See more details [here](#acr-capi-event). |
| `acr`<br><br>[AdsDatasetCAPIACR](https://developers.facebook.com/docs/marketing-api/reference/ads-dataset-capiacr) | Additional Conversions Reported (ACR) is a metric that helps you understand how much your business benefits from using the Conversions API alongside the Meta Pixel. It also can help you determine if you can improve your Conversions API setup to measure more reported conversions. More reported conversions can help you decrease your cost per result and show your ads to people that find them relevant.  <br><br>See more details [here](#acr-main). |
| `event_coverage`<br><br>[AdsDatasetEventCoverage](https://developers.facebook.com/docs/marketing-api/reference/ads-dataset-event-coverage) | Event coverage is the 7-day average percent of Pixel events that are covered by the Conversions API, and share deduplication keys with events from the Conversions API.<br><br>See more details [here](#acr-event-coverage). |
| `dedup_key_feedback`<br><br>[AdsDatasetDedupKeyFeedback](https://developers.facebook.com/docs/marketing-api/reference/ads-dataset-dedup-key-feedback) | Deduplication is a process used to prevent our system from counting the same event twice. In order for you to have a high event coverage, covered events must have a proper deduplication setup.<br><br>Deduplication key feedback helps to identify any active issues with deduplication.<br><br>See more details [here](#event-deduplication). |
| `data_freshness`<br><br>[AdsDatasetDataFreshness](https://developers.facebook.com/docs/marketing-api/reference/ads-dataset-data-freshness) | Data freshness tells you how current your data is. Use this information to understand the delay between the time the event occurred and when Meta received it.<br><br>See more details [here](#data-freshness). |

**Warning:** **Tip**: Look inside the node (follow hyperlink to the separate developers page) to find out all fields and child nodes for fields in the table above.

## EMQ {#emq-main}

### About event match quality

#### Event match quality
Event match quality (EMQ) is a score (out of 10) that indicates how effective the customer information sent from your server may be at matching event instances to a Meta account. High quality event matching may improve ads attribution and performance.

#### How it's calculated
Event match quality is calculated by looking at which customer information parameters are received from your server using a Conversions API integration, the quality of the information received and the percent of event instances that are matched to a Meta account.

#### How it's used
Event match quality is used to assess whether you're sending through the Conversions API the right customer information to match your events to a Meta account, and whether you have set up your customer information parameters correctly. Customer information parameters help match your events to a Meta account so you can attribute conversions to your ads and deliver them to people who are most likely to convert.
**Event match quality is calculated in real time**. Learn more about EMQ best practices [here](https://www.facebook.com/business/help/765081237991954?id=818859032317965).

EMQ is currently available only for web events. For other event types such as offline and physical store events, app events, conversion leads or any integration under alpha or beta stages, contact your Meta representative for guidance on improving match quality.

**Use case**: Monitor event match quality score per event, along with match keys being sent, build an EMQ trendline or historical extracts, then hook up alerts/delectors for EMQ score and match keys drops.

**Documentation**: All fields available for EMQ diagnostics can be found on [this developer's page](https://developers.facebook.com/docs/marketing-api/reference/ads-pixel-capiemq).

### Example {#example-section}

**Graph API Explorer**

```html
GET/v25.0/dataset_quality?dataset_id=<DATASET_ID>&agent_name=<AGENT_NAME>&access_token=<ACCESS_TOKEN>&fields=web{event_match_quality,event_name}
```

**cURL**

```html
curl -X GET -G \
  -d 'fields=web{event_match_quality,event_name}' \
  -d 'dataset_id=<DATASET_ID>' \
  -d 'agent_name=<AGENT_NAME>' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/<LATEST_VERSION>/dataset_quality
```

**API Response**

```json
{
  "web": [
    {
      "event_match_quality": {
        "composite_score": 6.2,
        "match_key_feedback": [
          {
            "identifier": "user_agent",
            "coverage": {
              "percentage": 100
            }
          },
          {
            "identifier": "external_id",
            "coverage": {
              "percentage": 100
            }
          }
        ]
      },
      "event_name": "pLTVPurchase"
    },
    {
      "event_match_quality": {
        "composite_score": 7.2,
        "match_key_feedback": [
          {
            "identifier": "email",
            "coverage": {
              "percentage": 100
            }
          },
          {
            "identifier": "ip_address",
            "coverage": {
              "percentage": 99.9
            }
          },
        ]
      },
      "event_name": "CompleteRegistration"
    }
   ]
 }
```

## Additional Conversions Reported (ACR) for Event Match Quality parameters {#acr-params}

Additional Conversions Reported (ACR) is a metric that estimates how many conversions (for example, purchases, or link clicks) are measured as a result of an advertiser's Conversions API setup.

**To learn more about this metric, see the [About ACR](https://www.facebook.com/business/help/453888373437795) article and the [Learn More](https://developers.facebook.com/documentation/ads-commerce/conversions-api/dataset-quality-api#learn-more) section**.

**Use case**: For events connected to the Conversions API that have an EMQ score, monitor the uplift in additional conversions which the Conversions API is able to add when sending more and/or higher quality match keys.

**Documentation**: All fields available for ACR EMQ parameters can be found in the developer documentation [here](https://developers.facebook.com/docs/graph-api/reference/ads-pixel-capi-match-key-alyacr).

### Example

**Graph API Explorer**

```html
GET/v25.0/dataset_quality?dataset_id=<DATASET_ID>&agent_name=<AGENT_NAME>&access_token=<ACCESS_TOKEN>&fields=web{event_match_quality{match_key_feedback{identifier,potential_aly_acr_increase{percentage,description}}},event_name}
```

**cURL**

```html
curl -X GET -G \
  -d 'fields=web{event_match_quality{match_key_feedback{identifier,potential_aly_acr_increase{percentage,description}}},event_name}' \
  -d 'dataset_id=<DATASET_ID>' \
  -d 'agent_name=<AGENT_NAME>' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/<LATEST_VERSION>/dataset_quality
```

**API Response**

```json
{
  "web": [
    {
      "event_match_quality":
        "match_key_feedback": [
          {
            "identifier": "email",
            "potential_aly_acr_increase": {
              "percentage": 58.96,
              "description": "Similar advertisers who sent valid Email for Purchase saw a 58.96% median increase in their existing additional conversions reported."
            }
          },
          {
            "identifier": "ip_address",
            "potential_aly_acr_increase": {
              "percentage": 20.65,
              "description": "Similar advertisers who sent valid Ip Address for Purchase saw a 20.65% median increase in their existing additional conversions reported."
            }
          },
        ]
      }
      "event_name": "Purchase"
    },
  ]
}
```

## EMQ diagnostics {#emq-diagnostics}

Event match quality diagnostics are issues Meta identified with your Conversions API integration. Follow the provided recommendations to send higher quality match keys, optimize your ad performance, and improve your EMQ score.

**Use case**: Extract and store EMQ diagnostics in your environment, set up notifications using channels like email, messenger, or in-app notifications in order to resolve issues reactively.

**Documentation**: All fields available for EMQ diagnostics can be found in the developer documentation [here](https://developers.facebook.com/docs/marketing-api/reference/ads-dataset-emq-diagnostics).

### Example

**Graph API Explorer**

```html
GET/v25.0/dataset_quality?dataset_id=<DATASET_ID>&agent_name=<AGENT_NAME>&access_token=<ACCESS_TOKEN>&fields=web{event_match_quality{diagnostics},event_name}
```

**cURL**

```html
curl -X GET -G \
  -d 'fields=web{event_match_quality{diagnostics},event_name}' \
  -d 'dataset_id=<DATASET_ID>' \
  -d 'agent_name=<AGENT_NAME>' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/<LATEST_VERSION>/dataset_quality
```

**API Response**

```json
{
  "web": [
    {
      "event_match_quality": {
        "diagnostics": [
          {
            "name": "Update your IPv4 IP addresses to IPv6 IP addresses",
            "description": "Your server is sending IPV4 IP addresses through the Conversions API. We recommend updating to IPV6 IP addresses because this is the industry standard and offers better durability for this integration.",
            "solution": "You can update your web server and DNS provider configuration to support IPv6. In your server payload, send the client_ip_address retrieved from customer interactions. Use the payload helper to see how this value should be structured when it's sent to Meta. If this issue is not applicable or actionable, you can ignore it.",
            "percentage": 59.5,
            "affected_event_count": 18930,
            "total_event_count": 31830
          },
          {
            "name": "Server sending mismatched IP addresses",
            "description": "Your server is sending client IP addresses that do not match those from Meta Pixel. This may impact the attribution and optimization of your ad campaigns.",
            "solution": "In your server payload, send the client_ip_address retrieved from customer interactions. Use the payload helper to see how this value should be structured when it's sent to Meta.",
            "percentage": 61.5,
            "affected_event_count": 19567,
            "total_event_count": 31830
          }
        ]
      }
      "event_name": "Purchase"
    },
  ]
}
```

## Event coverage {#event-coverage}

Event coverage is the 7-day average percentage of Meta Pixel events that are covered by the Conversions API, and share deduplication keys with events from the Conversions API.

**Learn more about event coverage best practices by reading this [Business Help Center](https://www.facebook.com/business/help/1541268312717919?id=818859032317965) article**.

**Use case**: Evaluate the events which are connected by server versus those which are not. For example, if an advertiser has three events, ViewContent, AddToCart, and Purchase, but only Purchase is sent by server, the event coverage will be 33%.

**Documentation**: All fields available for event coverage can be found in the developer documentation [here](https://developers.facebook.com/docs/marketing-api/reference/ads-dataset-event-coverage).

### Example

**Graph API Explorer**

```html
GET/v25.0/dataset_quality?dataset_id=<DATASET_ID>&access_token=<ACCESS_TOKEN>&fields=web{event_coverage{percentage,goal_percentage,description},event_name}
```

**cURL**

```html
curl -X GET -G \
  -d 'fields=web{event_coverage{percentage,goal_percentage,description},event_name}' \
  -d 'dataset_id=<DATASET_ID>' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/<LATEST_VERSION>/dataset_quality
```

**API Response**

```json
{
  "web": [
    {
      "event_coverage": {
        "percentage": 34.1,
        "goal_percentage": 75,
        "description": "The percentage of events received from your Conversions API compared to unique browser events from the Meta Pixel."
      },
      "event_name": "B2B Purchase"
    },
  ]
}
```

## Additional Conversions Reported (ACR) for Event Coverage {#acr-event-coverage}

Additional Conversions Reported (ACR) for Event Coverage is a metric that helps you understand how much your business benefits from using the Conversions API alongside the Meta Pixel. For event coverage, you can see the potential improvement in additional conversions reported if the event coverage and deduplication both meet the best practices.

**To learn more about additional conversions reported, see the [About ACR](https://www.facebook.com/business/help/453888373437795) article and the [Learn More](https://developers.facebook.com/documentation/ads-commerce/conversions-api/dataset-quality-api#learn-more) section.**

**Use case**: For events connected to the Conversions API that have event coverage below 75% threshold, monitor the uplift in additional conversions which the Conversions API is able to add when covering more events (increasing server versus browser ratio).

**Documentation**: All fields available for ACR for Event Coverage can be found in the developer documentation [here](https://developers.facebook.com/docs/marketing-api/reference/ads-dataset-capi-event-coverage-alyacr).

### Example

**Graph API Explorer**

```html
GET/v25.0/dataset_quality?dataset_id=<DATASET_ID>&access_token=<ACCESS_TOKEN>&fields=web{event_coverage{potential_aly_acr_increase{percentage,description}},event_name}
```

**cURL**

```html
curl -X GET -G \
  -d 'fields=web{event_coverage{potential_aly_acr_increase{percentage,description}},event_name}' \
  -d 'dataset_id=<DATASET_ID>' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/<LATEST_VERSION>/dataset_quality
```

**API Response**

```json
{
  "web": [
    {
      "event_coverage": {
        "potential_aly_acr_increase": {
          "percentage": 35.8,
          "description": "Similar advertisers who send the same AddToCart pixel events with matching deduplication keys through Conversions API saw a median of 35.8% additional conversions reported versus those that only used Meta Pixel."
        }
      },
      "event_name": "AddToCart"
    },
  ]
}
```

## Event deduplication {#event-deduplication}

The Meta Pixel and the Conversions API enable you to share standard and custom events with Meta so you can measure and optimize ad performance. The Pixel enables you to share web events from a web browser, while the Conversions API enables you to share web events directly from your server.

If you connect website activity using both the Pixel and the Conversions API, Meta may receive the same events from the browser and the server. If Meta detects that the events are the same and therefore redundant, Meta keeps one and discards the rest. This is called deduplication.

The deduplication key feedback shows the percentages of events from the Pixel and the Conversions API that were received with each deduplication key. Share deduplication keys for all of your events – the higher the percentage, the better.

**To learn more about deduplication best practices, see the [Business Help](https://www.facebook.com/business/help/823677331451951?id=1205376682832142) Center article.**

**Use case**: Monitor the rate of deduplication between browser and server events to help to increase event coverage rate for your Conversions API-connected events.

**Documentation**: All fields available for dedupe key feedback can be found in the developer documentation [here](https://developers.facebook.com/docs/marketing-api/reference/ads-dataset-dedup-key-feedback).

### Example

**Graph API Explorer**

```html
GET/v25.0/dataset_quality?dataset_id=<DATASET_ID>&agent_name=<AGENT_NAME>&access_token=<ACCESS_TOKEN>&fields=web{dedupe_key_feedback{dedupe_key,browser_events_with_dedupe_key{percentage,description},server_events_with_dedupe_key{percentage,description},overall_browser_coverage_from_dedupe_key{percentage,description}},event_name}
```

**cURL**

```html
curl -X GET -G \
  -d 'fields=web{dedupe_key_feedback{dedupe_key,browser_events_with_dedupe_key{percentage,description},server_events_with_dedupe_key{percentage,description},overall_browser_coverage_from_dedupe_key{percentage,description}},event_name}' \
  -d 'dataset_id=<DATASET_ID>' \
  -d 'agent_name=<AGENT_NAME>' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/<LATEST_VERSION>/dataset_quality
```

**API Response**

```json
{
  "web": [
    {
      "dedupe_key_feedback": [
        {
          "dedupe_key": "event_id",
          "browser_events_with_dedupe_key": {
            "percentage": 100,
            "description": "The percentage of browser events that contain this dedupe key."
          },
          "server_events_with_dedupe_key": {
            "percentage": 100,
            "description": "The percentage of server events that contain this dedupe key."
          },
          "overall_browser_coverage_from_dedupe_key": {
            "percentage": 14.8,
            "description": "The overall percentage of browser events that are deduped with Conversions API events using this key. This percentage is incremental for each dedupe key."
          }
        },
        {
          "dedupe_key": "external_id",
          "browser_events_with_dedupe_key": {
            "percentage": 100,
            "description": "The percentage of browser events that contain this dedupe key."
          },
          "server_events_with_dedupe_key": {
            "percentage": 100,
            "description": "The percentage of server events that contain this dedupe key."
          },
          "overall_browser_coverage_from_dedupe_key": {
            "percentage": 15.96,
            "description": "The overall percentage of browser events that are deduped with Conversions API events using this key. This percentage is incremental for each dedupe key."
          }
        },
        {
          "dedupe_key": "fbp",
          "browser_events_with_dedupe_key": {
            "percentage": 0,
            "description": "The percentage of browser events that contain this dedupe key."
          },
          "server_events_with_dedupe_key": {
            "percentage": 0,
            "description": "The percentage of server events that contain this dedupe key."
          },
          "overall_browser_coverage_from_dedupe_key": {
            "percentage": 0,
            "description": "The overall percentage of browser events that are deduped with Conversions API events using this key. This percentage is incremental for each dedupe key."
          }
        }
      ],
      "event_name": "AddToCart"
    },
  ]
}
```

## Data freshness {#data-freshness}

Data freshness indicates the delay between the time the event occurred and when Meta received it. Best practice is to share your events in real time, or as close to real time as possible.

The Meta Pixel defaults to sending web browser events in real time. To get the most value from your events, send them in real time or as close to real time as possible. Events sent with a delay may impact how effectively your ads can be delivered to the right audiences.

**To learn more about data freshness best practices, see the [Business Help](https://www.facebook.com/business/help/379226453470947?id=818859032317965) Center article.**

**Use case**: Evaluate how quickly events are received from server versus browser. Improve frequency to real_time when possible to get the most value from your event data.

**Documentation**: All fields available for data freshness can be found in the developer documentation [here](https://developers.facebook.com/docs/marketing-api/reference/ads-dataset-data-freshness).

### Example

**Graph API Explorer**

```html
GET/v25.0/dataset_quality?dataset_id=<DATASET_ID>&agent_name=<AGENT_NAME>&access_token=<ACCESS_TOKEN>&fields=web{data_freshness{upload_frequency,description},event_name}
```

**cURL**

```html
curl -X GET -G \
  -d 'fields=web{data_freshness{upload_frequency,description},event_name}' \
  -d 'dataset_id=<DATASET_ID>' \
  -d 'agent_name=<AGENT_NAME>' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/<LATEST_VERSION>/dataset_quality
```

**API Response**

```json
{
  "web": [
    {
      "data_freshness": {
        "upload_frequency": "real_time",
        "description": "The average frequency with which instances of this event are received through the Conversions API."
      },
      "event_name": "ViewContent"
    },
    {
      "data_freshness": {
        "upload_frequency": "hourly",
        "description": "The average frequency with which instances of this event are received through the Conversions API."
      },
      "event_name": "Lead"
    },
  ]
}
```

## Additional Conversions Reported (ACR) for Conversions API Event {#acr-capi-event}

Additional Conversions Reported (ACR) for Conversions API Event is a metric that estimates how many conversions (for example, purchases, or link clicks) are measured as a result of an advertiser's Conversions API setup.

**To learn more about additional conversions reported, see the [About ACR](https://www.facebook.com/business/help/453888373437795) article and the [Learn More](https://developers.facebook.com/documentation/ads-commerce/conversions-api/dataset-quality-api#learn-more) section.**

**Use case**: For Meta Pixels not connected to the Conversions API, extract the additional conversions reported metric to estimate the impact a Conversions API integration may have.

**Documentation**: All fields available for ACR for Conversion API event can be found in the developer documentation [here](https://developers.facebook.com/docs/marketing-api/reference/ads-pixel-capi-event-alyacr).

### Example

**Graph API Explorer**

```html
GET/v25.0/dataset_quality?dataset_id=<DATASET_ID>&access_token=<ACCESS_TOKEN>&fields=web{event_potential_aly_acr_increase{description,percentage},event_name}
```

**cURL**

```html
curl -X GET -G \
  -d 'fields=web{event_potential_aly_acr_increase{description,percentage},event_name}' \
  -d 'dataset_id=<DATASET_ID>' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/<LATEST_VERSION>/dataset_quality
```

**API Response**

```json
{
  "web": [
    {
      "event_potential_aly_acr_increase": {
        "description": "Similar advertisers who set up Conversions API for Search events saw a median of 32.9% additional conversions reported versus those that only used Meta Pixel.",
        "percentage": 32.9
      },
      "event_name": "Search"
    },
    {
      "event_potential_aly_acr_increase": {
        "description": "Similar advertisers who set up Conversions API for PageView events saw a median of 30.1% additional conversions reported versus those that only used Meta Pixel.",
        "percentage": 30.1
      },
      "event_name": "PageView"
    }
  ]
}
```

## Additional Conversions Reported (ACR) {#acr-main}

Additional Conversions Reported (ACR) is a metric that helps you understand how much your business benefits from using the Conversions API alongside the Meta Pixel. It also can help you determine if you can improve your Conversions API setup to measure more reported conversions. More reported conversions can help you decrease your cost per result and show your ads to people that find them relevant.

**To learn more about additional conversions reported, see the [About ACR](https://www.facebook.com/business/help/453888373437795) article and the [Learn More](https://developers.facebook.com/documentation/ads-commerce/conversions-api/dataset-quality-api#learn-more) section.**

**Use case**: For events connected to the Conversions API and have an EMQ score, monitor the uplift in additional conversions which the Conversions API is able to drive.

**Documentation**: All fields available for ACR can be found in the developer documentation [here](https://developers.facebook.com/docs/marketing-api/reference/ads-dataset-capiacr).

### Example

**Graph API Explorer**

```html
GET/v25.0/dataset_quality?dataset_id=<DATASET_ID>&access_token=<ACCESS_TOKEN>&fields=web{acr{description,percentage},event_name}
```

**cURL**

```html
curl -X GET -G \
  -d 'fields=web{acr{description,percentage},event_name}' \
  -d 'dataset_id=<DATASET_ID>' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/<LATEST_VERSION>/dataset_quality
```

**API Response**

```json
{
  "web": [
    {
      "acr": {
        "description": "In the last 7 days, you saw about 37.9% more conversions reported for Search events by using the Conversions API alongside the Meta Pixel.",
        "percentage": 37.9
      },
      "event_name": "Search"
    },
    {
      "acr": {
        "description": "In the last 7 days, you saw about 45.5% more conversions reported for Page View events by using the Conversions API alongside the Meta Pixel..",
        "percentage": 45.5
      },
      "event_name": "PageView"
    }
  ]
}
```

## FAQs

**What Is the Dataset Quality API?**

Advertisers that share server events using the Conversions API can see the event match quality score in Events Manager. However, this only works on an individual basis and is difficult to scale in cases where a tech provider partner, agency partner or advertiser is managing hundreds and thousands of Meta Pixels for their businesses. The Dataset Quality (formerly known as Integration Quality) API can help solve this problem by consolidating dataset quality metrics programmatically at scale.

**What is the access token used for? **

The access token is used when partners send signal events or access the Setup Quality API on behalf of advertisers. The [client system user access token](https://developers.facebook.com/documentation/ads-commerce/conversions-api/set-up-conversions-api-as-a-platform#for-facebook-pixels-not-managed-by-the-partner) onboarding method is not compatible with the EMQ API at the moment.

**How should the partner_agent field be formatted? **

The `partner_agent` value in your API GET request should be a normalized lowercase format. This field is now optional.

**Can an Access Token Generated Using Events Manager Prior to July 2025 Access the Dataset Quality API Directly?**

The advertiser will need to go to Events Manager to accept by using the instructions in the [Client Generates Token Manually Using Events Manager](https://developers.facebook.com/documentation/ads-commerce/conversions-api/dataset-quality-api#ownership-and-access) section explained above. Once the advertiser completes the opt-in process, both the new token and existing generated tokens by the same user will be able to send events or access the Dataset Quality API.

## Learn more

1. [Conversions API Best Practices](https://developers.facebook.com/documentation/ads-commerce/conversions-api/best-practices).

2. [Drive performance with an optimized Conversions API setup](https://www.facebook.com/business/inspiration/video/drive-performance-optimized-conversions-api).

3. [Optimizing your setup can help improve your marketing performance](https://www.facebook.com/business/inspiration/video/drive-performance-optimized-conversions-api).

4. [Best practices to onboard the Conversions API for partners](https://www.facebook.com/business/m/conversions-api-resources).

5. Conversions API dataset quality guidance in the Business Help Center:

* [Best practices for Conversions API to help improve ad performance.](https://www.facebook.com/business/help/308855623839366?id=818859032317965) These Conversions API best practices can help businesses improve their ad performance by lowering their cost per action. Follow these best practices upon initial setup, but you can also use them to update existing setups.

* [View server event details in Meta Events Manager.](https://www.facebook.com/business/help/1541268312717919?id=818859032317965) After businesses set up the Conversions API, they can use this article to learn how to monitor events and parameters to make sure their setup is working effectively and identify opportunities for improvement. Businesses can use this article to learn how to use server event details (Event Match Quality, Data Freshness, Event Overview and Event Deduplication) in Events Manager to improve their Conversions API setup.

6. Additional Conversions Reported:

* [About additional conversions reported.](https://www.facebook.com/business/help/453888373437795)
* [Troubleshoot reasons why your additional reported conversions are not available.](https://www.facebook.com/business/help/478879057492537)  
* [How to interpret additional conversions reported](https://www.facebook.com/business/help/400970175546156)
