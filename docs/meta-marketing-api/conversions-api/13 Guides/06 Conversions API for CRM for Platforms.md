<!-- Source: https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/conversions-api-crm-for-platforms | Saved: 2026-09-19 -->

# "Conversions API for CRM: Integrate as a Platform"


**Warning:** **Ads Management Standard Access is now Marketing API Access Tier**

**No code changes are needed.**

Tier labels have been updated: "Standard Access" is now **Limited Access**, and "Advanced Access" is now **Full Access**. The revised qualification threshold for Full Access has been reduced from 1,500 to **500 Marketing API calls** in the past 15 days. The underlying permission identifier remains the same, and existing access levels are preserved automatically. Learn more in the [Marketing API Access Tier documentation](https://developers.facebook.com/docs/features-reference#marketing-api-access-tier).

Partners may consider offering Conversions API for CRM events as a service. This allows your clients to upload lead events generated via their Facebook/Instagram lead ads (instant forms) from their respective CRM systems, and use the Conversion Leads performance goal in ads which may yield higher quality leads that are more likely to convert.

## Prerequisites

To plan your project, you may use the estimated timeline as a guideline. Note:

1. Integration stage, or the actual development on the partner side, may take about 3-7 weeks. Post integration, for an advertiser to get onboarded till running fully optimized Conversions Lead Ads campaigns, it may take 3-4 weeks.
2. The below timeline is based on historical data. The actual timeline may vary based on available resources, speed of issue resolution, etc.

| Stage | Step | Estimated Time (Duration) |
| --- | --- | --- |
| [**Integration**](#integration-guide) | Step 1. Prerequisites on setting up assets  <br><br>---<br>Step 2. Authentication<br><br>---<br><br>Step 3. API integration<br><br>---<br>**Total** | Prerequisite  <br><br>---<br><br>1 day-3 weeks depending on the authentication option<br><br>---<br>3-4 weeks.  <br>Less time required if partner has already integrated with the Conversions API for web, offline, app or messaging events<br><br>---<br>**~3-7 weeks** |
| [**Post-integration**](#post-integ) | Step 1. Connect CRM:<br><br>a. Set up a dataset <br><br>b. Connect to the partner system<br><br>c. Send a lead event<br><br><br>---<br><br>Step 2. Configure sales funnel<br><br><br>---<br><br>Step 3. Learning phase (no advertiser action required)<br><br><br>---<br><br>Step 4. Run fully optimized Conversions Lead Ads campaigns*<br><br>---<br>**Total** | 1-2 days <br><br>---<br><1 day<br><br>---<br>2-4 weeks<br><br>---<br><br>---<br><br>**~1-2 months** |

_*Advertisers may run Conversions Leads performance campaigns during the learning period, but will not benefit from the full performance lift until it is complete._

## Integration Guide {#integration-guide}

### Step 1: Prerequisites {#prereqs}

If you have not yet been offering the Conversions API as a service for web, app, offline or business messaging events, please ensure that you have set up the below assets:

* [Business Manager](https://business.facebook.com)
* A [Meta app](https://developers.facebook.com/apps). Please note that your app needs to go through [App Review](https://developers.facebook.com/docs/resp-plat-initiatives/individual-processes/app-review). During that process, you must obtain [Advanced Access](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/authorization#access-levels) for `ads_management`, `pages_read_engagement`, `ads_read`, `pages_show_list`, `business_management` and [Marketing API Access Tier](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/authorization). Please find below for more guidance on how to do so
* [Meta CRM Dataset](https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/crm-integration/2-getting-started-with-integration#step-2--create-a-meta-crm-pixel) (previously referred to as pixel). A CRM dataset is required for the Conversions API for CRM integration. The CRM dataset will inform the system that CRM events will be uploaded to it and add a [Conversion Leads performance](https://www.facebook.com/business/help/782657799338685?id=735435806665862) workflow to the dataset which optimizes for lead quality.

| Permission | Business intention | What to include in submission |
| --- | --- | --- |
| `ads_read` | The allowed usage for this permission is to provide API access to your ad performance data for use in custom dashboards and data analytics, or to send web events from your server directly to Meta. | **Written**: Explain that you will use this permission to send events via Conversions API from your server directly to Meta on behalf of your advertisers.<br><br>**Video**: Demonstrate how your platform sends an event via the Conversions API. |
| `ads_management` | The allowed usage for this feature is to enable an unlimited number of ad accounts and lower rate limiting. At a minimum, `ads_read` or `ads_management` permission is required to use Marketing API Access Tier. | **Written**: Explain that you will use this permission to send events via Conversions API from your server directly to Facebook on behalf of your advertisers,<br>or programmatically create and manage campaigns on behalf of your business as a value-added feature for your platform.<br><br>**Video**: Demonstrate how your platform sends an event via the Conversions API or show a test user logging onto your platform to create or edit ad campaigns. |
| Ads Management<br>Standard Access | The allowed usage for this feature is to enable an unlimited number of ad accounts and lower rate limiting. At a minimum, `ads_read` or `ads_management` permission is required to use Marketing API Access Tier. | To qualify for advanced access, your app must have successfully made at least 1,500 Marketing API calls with an error rate of less than 10% over a 15-day period.<br><br>It's important to avoid the common mistake of repeatedly calling the API after reaching the rate limit. Instead, pause the calls immediately upon receiving an error response.<br><br>System granted permission, submission is not required. |
| `pages_read_engagement` | This permission allows your app to read content (posts, photos, videos, events) posted by the Page, read followers data (including name, PSID), and profile picture, and read metadata and other insights about the Page. | **Written**: Explain that you will need this permission as a prerequisite to `ads_management` permission, which you will use to send events via the Conversions API from your server directly to Meta on behalf of your advertisers.<br><br>**Video**: Demonstrate how your platform sends an event via Conversions API. |
| `pages_show_list` (prerequisite for `pages_read_engagement`) | The allowed usage for this permission is to show a person the list of Pages they manage or verify that a person manages a Page. | **Written**: Explain that you will need this permission as a prerequisite to `pages_read_engagement` and `ads_management` permission, which you will use to send events via the Conversions API from your server directly to Meta on behalf of your advertisers.<br><br>**Video**: Demonstrate how your platform sends an event via the Conversions API. |
| `business_management` (prerequisite for all pages permissions) | The allowed usage for this permission is to send business-related activities (for example, purchase, add to cart, lead) on behalf of Pages owned by the people who use your app. | **Written**: Explain that you will need this permission as a prerequisite to `pages_show_list`, `pages_read_engagement` and `ads_management` permission, which you will use to send events via Conversions API from your server directly to Facebook on behalf of your advertisers.<br><br>**Video**: Demonstrate how your platform sends an event via Conversions API. |

### Step 2: Authentication

Partners have the following two authentication options for datasets not managed by you:

#### Option 1 - Meta Business Extension (MBE, preferred)
MBE provides an endpoint to retrieve system user access tokens created in the advertiser's Business Manager. Complete [all the requirements](https://developers.facebook.com/docs/facebook-business-extension/fbe/guides/mbe-conversions-api) for implementing MBE.

Ensure that you:

* obtain `manage_business_extension` for your app — This is a private permission that requires your Meta representative to add your app to the allow list
* set the value of the **channel** parameter in setup configuration object as `CONVERSIONS_API`
* are able to receive the webhook response at the completion of onboarding
* use the access token returned via MBE and convert it into a System User Access Token by [making an additional API call](https://developers.facebook.com/docs/facebook-business-extension/fbe/guides/get-features#get-system-user-token-via-api)
* save a copy of `external_business_id`, `pixel_id` (that is, the dataset ID), `business_id` and system user access token in your system
* [get approval for your MBE integration](https://developers.facebook.com/docs/facebook-business-extension/fbe/integration-review)

#### Option 2 - Client System User Access Token
With this option, partners may have the advertisers:

* manually create a system user access token via the Conversions API inside **Settings** in Meta Events Manager (EM)
* share `pixel_id` (that is, the dataset ID), `business_id` and system user access token with the partner and save a copy of it

### Step 3: API integration

Partners then [call the Conversions API endpoint to send the event payload](https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/crm-integration/3-implementing-the-crm-integration). Key steps to take note of:

#### Send Lead ID (preferred) or Custom Parameters

`lead_id` is a predefined ID associated with leads that are generated from lead ads campaigns run on Facebook or Instagram. There are [various ways](https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/how-to-find-the-lead-id) to find lead ID from Meta. Partners are recommended to use Webhook or Graph API bulk read for finding lead ID.

**Warning:** **Note** that you must send at least one valid Custom Parameter or else the system will reject the event. If sending `lead_id`, please use a valid `lead_id`. If you choose to send `em` (email) and `ph` (phone number), these have to be hashed.

#### Add `partner_agent` string for attribution

Send a unique `partner_agent` string together with the payload. If applicable, work with your dedicated Meta representative to decide on a suitable agent string. Use the same agent string if you are already sending one via Conversions API for web, offline, app or business messaging events.

#### Example

If your platform identifier is datapartner, this would be a sample event payload sent on behalf of your client:

```
{
    "event_name": "my lead stage",
    "event_time": 1617693833,
    "user_data": {
        "lead_id": 1234567890123456
    },
    "action_source": "system_generated",
    "custom_data": {
        "lead_event_source": "Salesforce",
        "event_source": "crm"
    },
   "partner_agent": "datapartner"
}
```

Alternatively, if you are not able to find lead_id, you may use customer parameters instead and below would be a sample event payload sent on behalf of your client:

```
{
    "event_name": "my lead stage",
    "event_time": 1617693833,
    "user_data": {
        "em": 62a14e44f765419d10fea99367361a727c12365e2520f32218d505ed9aa0f62f
        "ph": e323ec626319ca94ee8bff2e4c87cf613be6ea19919ed1364124e16807ab3176
        "fbc": fb.1.1554763741205.AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
    },
    "action_source": "system_generated",
    "custom_data": {
        "lead_event_source": "Salesforce",
        "event_source": "crm"
    },
   "partner_agent": "datapartner"
}
```

#### Use the Correct Event Payload {#event-payload}

For Conversions API for CRM integration, partners should use the above structure for event payload to ensure events can be successfully received. Note that this is different from Conversions API for web, offline, app or business messaging events.

Make sure that you use the correct value for action_source of Conversions API for CRM events , that is, `action_source = system_generated`

#### Send All Lead Stages, Including Initial Lead Stage

Make sure to send **all stages** of leads as they are updated. This means, there would be multiple events on the same `lead_id` as the lead moves in the lead funnel stage.

Ensure that you send the **first lead stage** (that is, raw lead event) as it will let the system know that the lead was received and processed.

You should send a minimum of two stages for events from your sales funnel, including the raw lead event. It is recommended to send three stages or more if possible.

#### Mapping to CRM Lead Stages

If your advertisers are using different CRM systems, make sure you are able to map the parameters from different data sources to `lead_id`, `event_name` and `event_time` respectively.

One possible solution is to incorporate a UI/UX feature on your advertiser-facing portal to allow advertisers to map parameters from different CRMs to `lead_id`, `event_name` and `event_time` themselves.

Other best practices include the below:

1. Upload data at least once a day. Ideally upload data in real-time, but you may employ hourly or daily batching methods if a real-time integration is not feasible.
2. Each batch can include up to 1,000 events. If there is an error in the batch, the whole batch will be discarded so we **highly recommend** employing small batches and adding logic for retrying attempts.
3. You can backfill your data for up to 7 days in the past. The time difference is calculated between `event_time` and `upload_time`. Backfilling some data may speed up the training process.
4. Ensure that your `event_time` values are after the lead generation timestamp, otherwise your events may be discarded.
5. Log error messages from the CAPI call and create alerts if there are issues. Exception handling for these errors would also be a good idea.
6. Store `lead_id` whenever possible in your system together with other information such as the leads' details, lead stage, etc.

## Post Integration {#post-integ}

After you have successfully completed the API integration, we recommend that you select some suitable advertisers to conduct tests first before opening your solution to all advertisers.

### Select Suitable Advertisers

It is important that you select suitable advertisers to use the Conversions API for CRM. Below are some guidelines for such advertisers:

* Use Facebook/Instagram Lead Ads (Instant Forms)
* Generate at least **200 leads per month**
* The lead stage the advertiser wants to optimize for
    * occurs within **28 days** of leads being generated
    * has a conversion rate between **1% - 40%**
* Care about **lead quality**

### Guidelines for Your Advertisers

In order to onboard your advertisers successfully to Conversions API for CRM and serve them well post-onboarding, we recommended becoming familiar with the advertiser journey to be able to guide your advertisers through the process.

**Step 1:** Connect CRM

a) [**Create a CRM dataset**](#prereqs): To verify if the CRM dataset is set up correctly, go to **Events Manager > Datasource > Settings** and you will see a Conversion Leads Section if it is a CRM dataset.

b) Connect to the partner system: Allow your advertiser to connect to your system and start sending in CRM events.

c) Send a CRM event: To pass [Data Verification](https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/crm-integration/4-verify-your-data) checks, the dataset must meet all of the requirements before proceeding to the next step. To confirm if this stage is successful, check in Events Manager if the status moves down to "Configure Sales Funnel".

If an advertiser is not able to proceed beyond this step:

* Check for errors in the Events Manager Diagnostic tab for the CRM Dataset.
* Check that enough events are being uploaded to match with leads generated on Facebook. For example, if the advertiser generates 100 leads in one day we would expect all 100 leads to have uploaded events to match to them. You should reach at least 60% of lead coverage, which is defined as the percentage of leads that have matching events uploaded to Meta.
* Check that a minimum of two stages for events from the advertiser's sales funnel is being sent, including the first lead stage (that is, raw lead event). However, we recommend at least three stages if possible. For example, only sending in the "Sale" event will not be enough; make sure the advertiser sends in previous stages as well.
* Make sure data has all the required parameters and in the correct format highlighted in this guide. Sending data in other formats will trigger an error.

**Step 2**. [**Configure sales funnel**](https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/crm-integration/5-configure-your-sales-funnel)

**Step 3**. [**Funnel analysis and learning phase**](https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/crm-integration/6-follow-up-steps): An integration will need to meet the following criteria:

* An optimization stage with a conversion rate between 1-40%
* Conversion window of the optimization day is 28 days or less

After the integration is completed, there is a 3-4 week learning phase required where the model will need to use the data that is being sent back to optimize the model. Upon successful completion of the integration, a confirmation modal will appear in Events Manager to notify you that the process is complete.

**Step 4: Run fully optimized Conversions Lead Ads campaigns** via Ads Manager using the CRM dataset from above.

_**Note**: Remind the advertiser not to change datasets after they have completed the integration. Changing datasets will start a new integration and restart the learning process._
