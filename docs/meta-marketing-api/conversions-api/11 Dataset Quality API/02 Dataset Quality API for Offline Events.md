<!-- Source: https://developers.facebook.com/documentation/ads-commerce/conversions-api/dataset-quality-api/offline-events | Saved: 2026-09-19 -->

# Dataset Quality API for Offline Events



Dataset Quality API for offline events provides a breakdown of the score and recommendations by several quality dimensions, including match key coverage, frequency, and freshness. An optimal event setup allows for the collection of high-quality data, which is essential for the ad system's performance.

A high-quality Conversions API multichannel setup will enable advertisers to use omnichannel ads, which is the solution that lets you drive in-store and website sales using one sales campaign.  

## Common Use Cases

Partners and agencies may use the Dataset Quality API to provide a quality dashboard and insights, while helping their advertisers to enhance and optimize their integrations. Partners may also use this integration to monitor the stability of their Conversions API integration. Advertisers may use this endpoint to aggregate dataset quality data to incorporate in their monitoring.

## Setup Requirements

### Ownership and Access

#### Advertiser Authentication Using Business Manager

1. In Business Manager, go to the Users section and select the **System User** tab. Click on the specific system user you are using for the Conversions API.
2. Go to the Assign Asset dialog and choose **Pixels**. Then, select the pixels you want to send events on behalf of.
3. For each pixel, select the Manage Pixel permission, and click **Save Changes**.
4. Go back to your system user's details page. Verify that the selected pixels are visible there.
5. To generate the access token, follow instructions [here](https://www.facebook.com/business/help/503306463479099?id=2190812977867143).

#### Partner Platform Authentication

You must first request authorization to send events on behalf of your clients. You have the following authentication options:

##### Facebook Login for Business (Recommended)

[Facebook Login for Business](https://developers.facebook.com/documentation/facebook-login/facebook-login-for-business) is the preferred authentication and authorization solution for tech providers and business app developers who need access to their business clients' assets. It allows you to specify the access token type, types of assets, and permissions your app needs, and save it as a set (configuration). You can then present the set to your business clients to complete the flow and grant your app access to their business assets.

##### Meta Business Extension (Recommended)

With this option, [Meta Business Extension](https://developers.facebook.com/docs/facebook-business-extension) (MBE) returns all the necessary information needed to send events on behalf of the client. MBE provides an endpoint to retrieve system user access tokens created in the client’s Business Manager. This process includes permissions to send server events and is done automatically and securely. MBE is currently under beta. Please contact your Meta representative for access.

The endpoint requires a user access token as an input parameter. If you are a new MBE user, call this endpoint to fetch the system user access token after you have finished setting up MBE. Existing users need to ask for re-authentication before calling the new API endpoint.

##### Client Sharing of a Meta Pixel to Partner’s Business Manager

With this option, the client shares their Meta Pixel to the partner using Business Manager settings or by the [API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/shared_accounts). Then, the partner can assign the partner system user to the client pixel and [generate an access token to send server events](https://developers.facebook.com/documentation/ads-commerce/conversions-api/set-up-conversions-api-as-a-platform#get-started).

#### User Permission
* The user or system user used to make the API call requires (at minimum) the following user permission: **Partial access -> Use events dataset**
* User access may be granted (in bulk) by using the instructions provided [here](https://www.facebook.com/business/help/279059996069252?id=2042840805783715).

#### App Permission
* **Basic:** If you manage a small number of Meta datasets and/or wish to test the Dataset Quality API, then the following app permissions are required: **ads_read** and (**ads_management** or **business_management**).

* **Advanced:** If you manage a high number of Meta datasets on behalf of other businesses and/or require higher rate limits, then the **Advanced Level** of the **ads_management** app permission and app feature **Ads Management Standard Access** is required. Advanced Level app permissions and features require [app review](https://developers.facebook.com/docs/resp-plat-initiatives/individual-processes/app-review).


## Retrieving Quality Information for Offline Events

You can monitor data quality score per offline event, along with match keys being sent, using the following API endpoint, parameters and fields:

### API Call

Endpoint: `https://graph.facebook.com/v23.0/dataset_quality`

To get dataset quality metrics for a dataset, make a `GET` request to the `dataset_quality` endpoint with the following parameters:

### Parameters

| Parameter | Description |
| --- | --- |
| `dataset_id`<br><br>integer | **Required.**  <br>The ID of dataset (Pixel) to retrieve quality data. |
| `access_token`<br><br>string | **Required.**  <br>Valid (unexpired) access token for given dataset (Pixel) ID. We recommend setting up a long-lived system user access token.<br>Read more about different types of access tokens in our dedicated [guide](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens). |
| `agent_name`<br><br>string | **Optional.**  <br>The normalized value of the partner_agent field is used to filter only events sent with partner_agent param in [/{pixel_id}/events](https://developers.facebook.com/documentation/ads-commerce/conversions-api/using-the-api#send) POST request (see attributing your events best practices [here](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/end-to-end-implementation#step-3--attribute-events-to-your-platform) and [here](https://developers.facebook.com/documentation/ads-commerce/conversions-api/best-practices#bp-agencies)).<br><br>For example, if your partner_agent value is `[partner_name]_[majorversion]_[minorVersion]`, your normalized agent string value will be `partner_name` in lowercase.<br><br>The `agent_name` allows you to set your own platform identifier when sending events on behalf of a client. If you are a managed partner/agency, work with your Meta representative to agree on an identifier for your platform.<br><br>If you are an advertiser, most of the time you should not worry about `agent_name` attribution.<br><br>If you do not provide an `agent_name`, all events regardless of whether they were sent by an agent or not, will be included in the EMQ calculation. |

### Fields

| Field | Description |
| --- | --- |
| `offline`<br><br>array | This field denotes a structured set of data related to offline events. The filter is an array containing `event_name` and its metrics. This field is required by default in this API. See [example section](#example-below). |
| `event_name`<br><br>string | A [standard event](https://developers.facebook.com/docs/facebook-pixel/implementation/conversion-tracking#standard-events) or [custom events](https://developers.facebook.com/docs/facebook-pixel/implementation/conversion-tracking#custom-events). |
| `composite`<br><br>float | The composite [Data Quality Score for the offline events](https://www.facebook.com/business/help/905457088464077?id=565900110447546). To calculate the data quality score, we consider factors such as data freshness, frequency and attribution over the last 28 days. These factors, each weighted differently, combine to give a score out of 10. Note: A composite score of 8.5 or higher allows the access to use of omnichannel ads, ensuring ads reach the right audience at the right time. |
| `match_key`<br><br>integer | The `match_key` score provides recommendations on how to improve that score and also the match key coverage for both email and phone. It gives a score out of 10. |
| `frequency`<br><br>integer | The frequency score metric measures how often you send data, recommendation on how to improve the score. It gives a score out of 10. |
| `freshness`<br><br>integer | The freshness score shows how real time your data is, and shares the recommendations on how to improve the score. |

### Example {#example-below}

**Graph API Explorer**

```html
GET/v25.0/dataset_quality?dataset_id=<DATASET_ID>&fields=offline
```

**cURL**

```html
curl -X GET \
https://graph.facebook.com/v23.0/dataset_quality?dataset_id=<DATASET_ID> \
-F 'agent_name="My Agent Name"'\
-F 'fields="offline"'\
-F 'access_token=<ACCESS_TOKEN>'
```

**Sample Response**

```json
{
 "offline": [
    {
      "event_name": "Purchase",
      "composite": {
         "score": 6.6,
         "recommendation": "Your offline data quality score is ok, but could be improved."
      },
      "match_key": {
         "score": 5.6,
         "recommendation": "Sending email and phone number parameters can help improve your match key score."
      },
      "frequency":  {
         "score": 4.6,
         "recommendation": "Sharing your offline data more often can help improve your frequency score and help you get better ad outcomes."
      },
      "freshness":  {
         "score": 2.2,
         "recommendation": "Sending your most recent offline conversion data sooner can help improve your score and help you get better ad outcomes."
      }
    }
  ],
}
```

### Example

Scenario: You only want the event names and the composite scores for each event.

**Graph API Explorer**

```html
GET/v23.0/dataset_quality?dataset_id=<DATASET_ID>&fields=offline{event_name, composite}
```

**Sample Response**

```json
{
  "offline": [
    {
      "event_name": "Purchase",
      "composite": {
        "score": 6.6,
        "recommendation": "Your offline data quality score is ok, but could be improved."
      },
    }
  ],
}
```

### Example

Scenario: You only want the event names and the match key scores, recommendations, coverages for each event.

**Graph API Explorer**

```html
GET/v23.0/dataset_quality?dataset_id=<DATASET_ID>&fields=offline{event_name, match_key}
```

**Sample Response**

```json
{
   "offline": [
    {
  "event_name": "Purchase",
   "match_key":  {
             "score": 6.6,
             "recommendation": "Send email and phone parameters to help improve your match key score." },
             "coverage" : {
                     "email": 100.0
                     "phone": 90.0
              }
        }
    }
  ]
}
```

## Error Codes

The following error codes may be returned when creating a dataset:

| Error Code | Description |
| --- | --- |
| `2044055` | The `dataset_id` that was inputted doesn't exist. |
| `10` | The application doesn't have permission for this action. |

## Other Resources

* [Dataset Quality API](https://developers.facebook.com/documentation/ads-commerce/conversions-api/dataset-quality-api)
* [Omnichannel Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/omnichannel-ads)
* [Omni Optimal Technical Setup Guide](https://developers.facebook.com/documentation/ads-commerce/marketing-api/best-practices/omni-optimal-setup-guide)
* [Conversions API for Offline Events](https://developers.facebook.com/documentation/ads-commerce/conversions-api/offline-events)
* Business Help Center articles:
    * [About datasets in Meta Events Manager](https://www.facebook.com/business/help/750785952855662?id=490360542427371)
    * [About Offline Dataset Quality](https://www.facebook.com/business/help/905457088464077?id=565900110447546)
    * [How to create datasets in Meta Events Manager](https://www.facebook.com/business/help/5818684664831465?id=490360542427371)
* Other Resources:
    * Overview of the [GraphAPI](https://developers.facebook.com/docs/graph-api/overview)
    * [Ad Permissions and Access](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/authorization#permissions-and-features)
