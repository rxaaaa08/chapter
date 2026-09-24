<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/best-practices/omni-optimal-setup-guide | Saved: 2026-09-19 -->

# "Omni Optimal Technical Setup Guide: Best Practices and Requirements"



## Event setup

An optimal event setup allows for the collection of high-quality data, which is essential for the ad system's performance. This high-quality data helps in accurately targeting and delivering ads, which can lead to better engagement, higher conversion rates, and ultimately, a better return on investment.

## Mandatory/recommended parameters

This list consists of all the required/recommended event data parameters and additional data parameters advertisers need to pass back to Meta via the Meta Pixel/Conversions API to use for ads attribution and delivery optimization.

#### Event parameters

* Event Name
* Event Time
* Client_user_agent (web only)
* Action_source
* Event_source_url (web only)
* Custom Data (Highly Recommended for Dynamic Ads)
    * Content IDs
    * Content Type
    * Contents
    * Quantity
    * Currency (mandatory for purchase events)
    * Value (mandatory for purchase events)

#### Customer information parameters
* Email
* Phone Number
* First Name
* Last Name
* IP Address (web only)
* User Agent (web only)
* Fbc (web only)
* Fbp (web only)

**Note**: A full list of customer information parameters and hashing requirements can be [found here](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/customer-information-parameters).

## Event Match Quality (EMQ) and match rates {#match-rates}

### EMQ scores (web events only)

Event Match Quality (EMQ) scores are a metric used to assess the effectiveness of an advertiser's Conversions API integration in matching events to Meta users. The scores range from 1 to 10, with higher scores indicating a more effective match. Some of the highest weighted PII information parameters are:

* Email
* Phone Number
* IP Address
* User Agent
* FBP
* FBC
* First Name
* Last Name

### Offline Data Quality (ODQ) score

The offline data quality score evaluates how well your offline events align with Meta's advertising requirements, focusing on event coverage to enhance performance and measurement accuracy.

#### How Offline Data Quality is calculated

To calculate the offline data quality score, we consider factors such as data freshness, frequency, and attribution:  

* **Frequency**: The number of days the event is in the partitions (that is, offline events are passed to Meta) over the last 14 days.
* **Freshness**: The average time  between an event occurring and an event being sent over the last 28 days.
* **Match Key Coverage**: The number of events that have certain amounts of strong match keys of email, phone, mobiles ads device ID divided by the total number of events over the last 28 days.
* **Offline Event Volume**: The number of product purchases over the last 28 days and having at least one ad connected to the data source ID in the last 28 days.
* **Offline Like**: The proportion of in-store purchases that are sent back within minutes after the impression, depicting online transaction behavior.
* **Valid Purchase Values**: Valid purchase values (purchases that have a price > 0) out of total events over the last 28 days
* **Basket Splitting**: Purchase events should not be split into multiple events (multiple items in a single purchase event are preferred). To be measured by items to purchase ratio over the last 2 days.
* **Attribution**: Whether or not your ads Automatically Track Offline Events for reporting.
* **Accuracy**: Whether or not you pass offline data with no errors/inconsistencies (Note: you **should not** [pass website data as an offline event](https://www.facebook.com/legal/technology_terms)).

These factors, each weighted differently, combine to give a score out of 10.

#### What the score means

* **High Scores (8-10)**: Indicate strong matching, effective user identification, and improved ad attribution.
* **Medium Scores (4-7)**: Suggest partial matches, indicating room for improvement.
* **Low Scores (0-3)**: Indicate poor matching, with most offline events not sent to Meta, reducing data quality and ad attribution.

### Checking EMQ and ODQ scores:

Go to **Events Manager** > **Select Pixel ID** > **Select Event Name** > **View Details** > **Event Quality**

As an alternative to Events Manager, you can use the [Integration Quality API](https://developers.facebook.com/documentation/ads-commerce/conversions-api/dataset-quality-api) to check EMQ scores. For more about this API and how to maximize EMQ, see the [documentation here](https://developers.facebook.com/documentation/ads-commerce/conversions-api/dataset-quality-api).

### Benefits of Offline Data Quality

Improving offline data quality is crucial for enhancing your omnichannel ads, optimized for both online and in-store sales.

#### The value of offline data quality in enabling omnichannel ads.
Focusing on offline data quality is valuable for your omnichannel advertising strategy:

* **Enhanced ad performance**: High scores ensure accurate, up-to-date data for precise targeting across channels.
* **Accurate measurement**: Robust scores enable precise attribution of offline conversions, crucial for understanding ad impact and refining strategies.
* **Optimized campaigns**: Scores of 8.5 or higher allow confident use of omnichannel ads, ensuring ads reach the right audience at the right time.

#### Example: Improving offline data quality in retail

A retailer with a score of 6 out of 10 can improve by:

* **Increasing data upload frequency**: Upload data more regularly.
* **Improving data accuracy**: Reduce errors and inconsistencies.
* **Enhancing attribution**: Provide all recommended match keys to maximize offline conversion measurement accuracy

Addressing these areas can boost the score, leading to better advertising results, such as increased purchases and improved targeting.

Meta provides personalized recommendations in Events Manager to improve your offline data quality score.

### Improve Offline Data Quality

To improve your offline data quality metric:

* Upload fresh data regularly for accurate targeting and measurement.
     * Upload data daily
    * Ensure offline transaction data is not stale (older than 3 days)
* Implement robust data validation processes to minimize errors and inconsistencies.
    * Pass correct purchase prices (for example, no zero or negative values).
    * Avoid linking incorrect dataset IDs to omni campaigns. Note: Use only one offline signal source for omni campaign optimization. For measurement (ad tracking level), an advertiser can attach multiple offline signal sources, but not for ad set level optimization.
* Enable [automatic tracking for offline events](https://www.facebook.com/business/help/1480558938621580) to accurately attribute offline conversions
* Monitor your data collection and processing procedures to maintain high-quality data.
* Regularly review your offline data quality scores in Events Manager and follow your personalized recommendations to improve your offline data quality score.

## Data freshness {#data-freshness}

Prioritize sharing events in real time for better campaign optimization.
Ensure there is little to no delay from when your events occur to when you share them with Meta. This will help to:

* Run ads that are better optimized by having real-time data to update your audiences
* See the results of an ad campaign closer to real time in Meta Ads Manager.

## Website events

For web events, it is essential to transmit data in real-time for optimal performance. The Meta Pixel and the Conversions API are the most effective methods for sending event data in real-time.

To assess your current status, navigate to **Events Manager** > **Pixel ID** > **Event Name** > **View Details** > **Data Freshness** > **Website**

## Offline events

For offline events, it is recommended to send data as frequently as possible as it would help our algorithms to drive performance real or near real time. Recommendation is to pass back offline data at least daily and preferably on an hourly basis. To assess your current status, navigate to **Events Manager** > **Pixel ID** > **Event Name** > **View Details** > **Data Freshness** > **Offline Activity**.

## Deduplication

The Meta Pixel and the Conversions API let you share standard and custom events with us so that you can measure and optimize ad performance. The pixel lets you share web events from a web browser, while the Conversions API lets you share web events directly from your server.

If you connect website activity using both the pixel and the Conversions API, we may receive the same events from the browser and the server. If we know that the events are the same and therefore redundant, we can keep one and discard the rest. This is called deduplication.

It is highly recommended to include deduplication parameters with your events to ensure that our systems can accurately identify and process events only once. This is crucial for accurate attribution and measurement purposes.

#### Web events
When sending redundant events using the Meta Pixel and Conversions API, **ensure that both events use the identical event_name and that either event_id or a combination of external_id and fbp are included**. We recommend including all of these parameters to help Meta properly deduplicate events and reduce double reporting of identical events. **Maximum deduplication window is 48 hours**.

#### Offline events
Unlike deduplication set up across the Conversions API and Meta Pixel events, **offline events can only be deduplicated against other offline events**. We support two methods of deduplication:

* `order_id` based
* user based

The deduplication uses the combination of fields: `dataset_id`, `event_time`, `event_name`, `item_number`, and either `order_id` or user information as the "key field" based on method in the given event's payload.

The default deduplication uses order_id with a combination of the fields above. If order_id is not present in the payload, the user based deduplication logic will be used. **The maximum deduplication window is 7 days**. You can learn more about offline event deduplication on our [developer documentation site](https://developers.facebook.com/documentation/ads-commerce/conversions-api/offline-events).

**It's recommended not to split your order into multiple events instead of sending one event to represent the whole order**.

For example, where there are two orders with identical `event_time`, `event_name` having the same `order_id` or same set of Customer Information Parameters without `order_id`, we will consider them duplicate events and take the first event. The user-based deduplication method only works with the same Customer Information Parameters fields in the two payloads.

Another way to maximize PII capture rate is in your store. By sending email transactions that capture PII (including receipts), you can increase the event volume to improve optimization on Meta's platforms.

## Event quality

Event quality measures the correctness of the parameters in events received from event sources connected to a catalog.  Low Event Quality impacts match rate, availability, and can result in longer learning phases and suboptimal campaign optimization. Please note that these parameters are highly recommended to be passed back via Web and Offline events.

Some of the important parameters that need to be passed are:

**1. Content IDs**

Tell Meta the specific content ID for a product or product group. The content ID must exactly match either the product ID or the product group ID for that item in your catalog, depending which content_type you entered. The match indicates it's the same product or group as the one in your catalog.  Example: ['123','456']

**2. Contents (recommended way of sending content details)**

Tell Meta the specific content ID, which must match the product ID for that item in your catalog. If you use contents in your parameter, you must also include the following in a sub-object: the product id or ids, and the quantity (number of items added to cart or purchased).

Example: [{id: '123', quantity: 2}, {id: '456', quantity: 1}]. This is our recommended way of passing this information back.

**3. Content Type**

Should be set to `product` or `product_group`:

* Use `product` if the keys you send represent products. Sent keys could be `content_ids` or contents.

* Use `product_group` if the keys you send in `content_ids` represent product groups. Product groups are used to distinguish products that are identical but have variations such as color, material, size, or pattern.

**4. Currency**

Required for purchase events. The currency for the value specified, if applicable. Currency must be a valid [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217?fbclid=IwZXh0bgNhZW0CMTEAAR0CtnCe-QMMDrf9cqJOE8TBny7cnfG3kcPFkq-uOJTkO2U3W-vEtW84ZFI_aem_bXCd0DS25QdidMvS9zGFdQ) three-digit currency code.

**5. Value**

Required for purchase events. A numeric value associated with this event. Please make sure that value >= 0.

## Catalog setup

A catalog is a container that holds information about all the items advertisers want to advertise or sell on Facebook and Instagram. Catalogs are a fundamental building block of several of our available products, including (but not limited to):

* Advantage+ Shopping Campaigns
* Collaborative ads
* Collection ads
* Carousel ads
* Shops

To ensure a quality setup for your catalog for omnichannel ads, please ensure the following areas are covered and optimal:

### Catalog match rates

A catalog match occurs when an event has been matched with a product. The success rate of this is known as the catalog match rate. Optimal catalog match rates are > 90%

#### Website events

To check catalog match rates for web events go to **Commerce Manager** > **Select Catalog** > **Events** > **Select datasource** (dataset or app).

#### Offline events

Offline events should be integrated through the API (manual uploading is available but in order to use Omnichannel Ads Beta, Conversions API, or OCAPI integration is required).

* Frequency of upload:
    * Upload data daily, at least 12 times in the previous 14 days.
        * Ensure offline transaction data is not stale (older than 3 days).
* Offline events data must be passed for the past 14 days to be eligible for Omnichannel Ads.
* Avoid basket splitting your offline events integration by ensuring you pass all items from the same transaction as the same row / basket. This ensures measurement accuracy of Average Order Value and Cost Per Purchase.

### Connecting catalog with dataset

Please verify that the data source (dataset/app) is properly linked to the catalog. If not, please follow the steps below to establish a connection between the dataset/app and the catalog.

* Go to Commerce Manager
* Select events
* Click on **Manage Connections**
* Select the dataset ID/app
* Click **Save**

## Enabling auto-tracking for dataset

Auto tracking for dataset allows _any future campaigns_ in that ad account to be automatically tracked via dataset. This is important for campaign attribution. To enable auto tracking please [follow these steps](https://www.facebook.com/business/help/1480558938621580).

To add dataset tracking to existing campaigns, go to ad setup and enable tracking inside tracking specs.

## Omni audience

Omni Audience is a special targeting solution that allows advertisers to create audiences based on user activity across multiple channels.

For example, if an advertiser wants to create an audience of people who viewed a product on their website and then went to the store to purchase, it's possible using this type of audience.

### Best practices and requirements

[Match Rates](#match-rates): Event match rates are crucial in determining the audience size. It is essential to have high match rates for offline events and optimal EMQ scores for web events to ensure decent audience size.

[Data Freshness](#data-freshness): As Omni Audiences are created based on user actions happening across channels, getting data with less delay would make the audience more recent and accurate.

## Learn more

* [Conversions API Customer Information Parameters](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/customer-information-parameters)
* [Sending Offline Events Using the Conversions API](https://developers.facebook.com/documentation/ads-commerce/conversions-api/offline-events)
* [Enable Auto-Tracking for Offline Event Sets in Meta Events Manager](https://www.facebook.com/business/help/1480558938621580)
* [Integration Quality API](https://developers.facebook.com/documentation/ads-commerce/conversions-api/dataset-quality-api)
