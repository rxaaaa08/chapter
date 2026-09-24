<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lift-studies | Saved: 2026-09-19 -->

# Lift Study



**Warning:** Conversion Lift Measurement is currently limited. Please contact your Meta Representative for information about obtaining access.

Create and run an experiment to measure your Facebook campaign's efficiency. Determine what ads strategy drives the most business impact.
See [Ad Study, Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-study).

When you create a lift study, you create a randomized **test group** of Accounts Center accounts that see your ads and **control group** who don't see your ads.

You can securely share conversion data from your ad campaign with Facebook using [Facebook pixels](https://developers.facebook.com/docs/facebook-pixel), or [App Events](https://developers.facebook.com/docs/app-events). Facebook determines the increased conversions generated from your campaign. You can compare the number of conversions, Accounts Center accounts converting, and available sales revenue between test and control groups.

## Set up studies {#setup}

Set up a study with one or more groups, called *cells*. When you set up your study, Facebook randomizes the audience for your ads and assigns Accounts Center accounts to either the test or control group. After you run a study, Facebook calculates the difference between the test groups and control groups so that you evaluate the impact of your Facebook ads towards business goals.

To set up a study, make a `POST` call:

```
'https://graph.facebook.com/<API_VERSION>/<BUSINESS_ID>/ad_studies'
```

You can set up a study with a single test group to see how Facebook ads lead to additional business. You can also set up a study with [multiple test groups](#multi_cell), which lets you determine what **advertising approach** works best for your audience.

**Example** - Set up a lift study with one test group

### cURL
```
curl \
  -F 'name="new study"' \
  -F 'description="description of my study"' \
  -F 'start_time=1435622400' \
  -F 'end_time=1436918400' \
  -F 'cooldown_start_time=1433116800' \
  -F 'observation_end_time=1438300800' \
  -F 'viewers=[<USER_ID1>, <USER_ID2>]' \
  -F 'type=LIFT' \
  -F 'cells=[{name:"test group",description:"description of my test group",treatment_percentage:90,control_percentage:10,adaccounts:[<ACCOUNT_ID1>,<ACCOUNT_ID2>]}]' \
  -F 'objectives=[{name:"new objective",is_primary:true,type:"CONVERSIONS",applications:[{id:<APP_ID>}]}]' \
  -F 'access_token=<ACCESS_TOKEN>' \
  'https://graph.facebook.com/<API_VERSION>/<BUSINESS_ID>/ad_studies'
```

To create a new study, provide the following:

| Parameter | Description |
| --- | --- |
| `name` | Name of study. |
| `description` | Brief description of the study's purpose. |
| `cooldown_start_time` | **Deprecated**. Facebook still delivers during the time between `observation_end_time` and `end_time`. If you use `cooldown_start_time`, you should now set this time using `start_time`. |
| `start_time` | Start time of campaign active period. **Study start time must be in the future**. |
| `end_time` | End time of campaign active period. |
| `observation_end_time` | End of the *post test conversion window*. During this window (that is, between `end_time` and `observation_end_time`), all Facebook ads (including ones added to this study) are delivered normally to both the test and the control group, but no new users will be opportunity logged. Facebook will continue to match conversions during this period to users in their respective groups. If you don't need a *post test conversion window* for your study, set this to `end_time`. |
| `cells` | Cells in study that define test and control groups. |
| `objectives` | Objectives of the study. See [Defining Study Objective](#objective). |
| `viewers` | Share this study to a list of Facebook user IDs. |
| `type` | For Conversion Lift, the type should be `LIFT`. |

**Note:** **RESTRICTIONS** -
Once the study starts, you cannot update `start_time` and `treatment_percentage` of the cells. You also cannot remove the associated objects, such as `adaccounts` or `campaigns`, of the test groups. You can still update the `end_time` and `observation_end_time` to a future time if the study has not yet ended, and add new associated objects to test groups.

To run Reach and Frequency in conjunction with Lift measurement, you must set up a Lift study first and make sure the duration of the Reach and Frequency is within the duration of the Lift study.

## Create a test group {#test_group}

To begin, determine how many Accounts Center accounts receive your ads and how many Accounts Center accounts do not. You must create a test group when you set up the study; pass a list of JSON objects in `cells` under `ad_studies`. See [Ad Study Cell, Reference](https://developers.facebook.com/docs/marketing-api/reference/ad-study-cell). A test group contains the following information.

| Parameter | Description |
| --- | --- |
| `name` | Name of test group. |
| `description` | Brief description of test group. |
| `treatment_percentage` | Defines the Accounts Center accounts who receive your ads. |
| `control_percentage` | Defines a *holdout percentage* of the Accounts Center accounts who will not see ads. Treatment plus control percentages must equal 100. |
| `ad_studies` | List of ad entities, such as `adaccounts` or `campaigns`, to study. Facebook runs and measures all ads under active ad entities during the study period. |

**Example** - Read test groups in a study

### cURL
```
curl -G \
  -d 'access_token=<ACCESS_TOKEN>' \
  'https://graph.facebook.com/<API_VERSION>/<STUDY_ID>/cells'
```

**Example** - Update or modify cell information and treatment and control percentages by providing the cell ID in `cells`

### cURL
```
curl \
  -F 'cells=[{id:<CELL_ID>,treatment_percentage:80,control_percentage:20}]' \
  -F 'access_token=<ACCESS_TOKEN>' \
  'https://graph.facebook.com/<API_VERSION>/<STUDY_ID>'
```

**Example** - Read all the studies that you created at `ad_studies` for your business

### cURL
```
curl -G \
  -d 'access_token=<ACCESS_TOKEN>' \
  'https://graph.facebook.com/<API_VERSION>/<BUSINESS_ID>/ad_studies'
```

You can also see all studies associated with your ad account by making a `GET` request at `{ad-account-ID/include_all_studies=true}` with your access token.

## Set up multiple test groups {#multi_cell}

Set up a study with multiple test groups of Facebook users. This helps measure incremental impact of different Facebook strategies on business goals, such as using different ads targeting options. To set up a study with multiple test groups, provide a list of test groups in `cells`.

### cURL
```
curl \
  -F 'name="new study"' \
  -F 'description="description of my study"' \
  -F 'start_time=1435622400' \
  -F 'end_time=1436918400' \
  -F 'cooldown_start_time=1433116800' \
  -F 'observation_end_time=1438300800' \
  -F 'viewers=[<USER_ID1>, <USER_ID2>]' \
  -F 'type=LIFT' \
  -F 'cells=[{name:"group A",description:"description of group A",treatment_percentage:50,control_percentage:20,campaigns:[<CAMPAIGN_ID1>]},{name:"group B",description:"description of group B",treatment_percentage:20,control_percentage:10,campaigns:[<CAMPAIGN_ID2>]}]' \
  -F 'objectives=[{name:"new objective",is_primary:true,type:"CONVERSIONS",applications:[{id:<APP_ID>}]}]' \
  -F 'access_token=<ACCESS_TOKEN>' \
  'https://graph.facebook.com/<API_VERSION>/<BUSINESS_ID>/ad_studies'
```

`control_percentage` determines the holdout for each test group respective to the total population. For example, you have a study with two test groups: group A is 50% treatment with 20% control and group B is 20% treatment with 10% control. This results in ~28.6%, or 20%/70% of the population in group A, to be control users and ~33.3%, or 10%/30% of the population in group B, to be control users.

The sum of treatment and control percentages across test groups normally should equal 100. However, it can be less than 100 for some specific use cases. For example, when you have three test groups that are split evenly at 33%.

You can update, add, and remove test groups in a study.

* To update an existing test group, refer to its ID in test group.
* To add a new test group, provide a new test group object.
* To remove a test group, simply omit it from `cells` when you update the study:

### cURL
```
curl \
  -F 'cells=[{id:<CELL_ID1>,treatment_percentage:60,control_percentage:10},{name:"group C",description:"replacing group B",treatment_percentage:25,control_percentage:5,campaigns:[<CAMPAIGN_ID3>]}]' \
  -F 'access_token=<ACCESS_TOKEN>' \
  'https://graph.facebook.com/<API_VERSION>/<STUDY_ID>'
```

## Define advertising objectives {#objective}

Define advertising objectives you want to measure and how you pass conversion data to Facebook. **A lift study requires at least one objective. You cannot modify objectives after the study starts running.** See [Ad Study Objective, Reference](https://developers.facebook.com/docs/marketing-api/reference/ad-study-objective).

**Example** - Create and add the `CONVERSIONS` objective to a study

### cURL
```
curl \
  -F 'name="new study"' \
  -F 'description="description of my study"' \
  -F 'start_time=1435622400' \
  -F 'end_time=1436918400' \
  -F 'cooldown_start_time=1433116800' \
  -F 'observation_end_time=1438300800' \
  -F 'viewers=[<USER_ID1>, <USER_ID2>]' \
  -F 'type=LIFT' \
  -F 'cells=[{name:"test group",description:"description of my test group",treatment_percentage:90,control_percentage:10,adaccounts:[<ACCOUNT_ID1>,<ACCOUNT_ID2>]}]' \
  -F 'objectives=[{name:"new objective",is_primary:true,type:"CONVERSIONS",applications:[{id:<APP_ID>}]}]' \
  -F 'access_token=<ACCESS_TOKEN>' \
  'https://graph.facebook.com/<API_VERSION>/<BUSINESS_ID>/ad_studies'
```

| Name | Description | Data Sources |
| --- | --- | --- |
| `CONVERSIONS` | Measure the lift in conversions. | Conversions API-based Facebook pixels |

If you use `CONVERSIONS` and use Facebook pixel or Mobile App as event sources, you must provide a list of the event names that you want to capture for the objective. Facebook can then report results based on these specific conversion events.

| Measurement Source | Event Names |
| --- | --- |
| Facebook Pixel | `fb_pixel_view_content`, `fb_pixel_search`, `fb_pixel_add_to_cart`, `fb_pixel_add_to_wishlist`, `fb_pixel_initiate_checkout`, `fb_pixel_add_payment_info`, `fb_pixel_purchase`, `fb_pixel_lead`, `fb_pixel_complete_registration`, `custom` |
| Mobile App | `fb_mobile_activate_app`, `fb_mobile_complete_registration`, `fb_mobile_content_view`, `fb_mobile_search`, `fb_mobile_rate`, `fb_mobile_tutorial_completion`, `fb_mobile_add_to_cart`, `fb_mobile_add_to_wishlist`, `fb_mobile_initiated_checkout`, `fb_mobile_add_payment_info`, `fb_mobile_purchase`, `fb_mobile_level_achieved`, `fb_mobile_achievement_unlocked`, `fb_mobile_spent_credits` |

### Create an objective {#create-objective}
Create an objective by passing a list of JSON objects `objectives` when you create a new study. Objectives contain the following information:

| Parameter | Description |
| --- | --- |
| `name` | Name of the objective. |
| `is_primary` | A boolean specifying that this is your primary advertising objective. A study can only have one primary objective. |
| `type` | Objective value of `CONVERSIONS`. |
| `adspixels` | List of Facebook pixel IDs along with the relevant list of `event_names` per ID, if applicable. |
| `applications` | List of your mobile apps including relevant `event_names` per ID. |
| `offline_conversion_data_sets` | List of Offline Event set IDs if applicable. **Currently, event breakdowns for Offline Conversion are not supported**. |
| `customconversions` | List of Custom Conversion IDs, if applicable. |

You can also have multiple objectives per study. The result will be aggregated based on objectives. Below is an example of a study with multiple objectives.

### cURL
```
curl \
  -F 'name="another study"' \
  -F 'description="description of another study"' \
  -F 'start_time=1435622400' \
  -F 'end_time=1436918400' \
  -F 'cooldown_start_time=1433116800' \
  -F 'observation_end_time=1438300800' \
  -F 'viewers=[<USER_ID1>, <USER_ID2>]' \
  -F 'type=LIFT' \
  -F 'cells=[{name:"test group",description:"description of my test group",treatment_percentage:90,control_percentage:10,adaccounts:[<ACCOUNT_ID1>,<ACCOUNT_ID2>]}]' \
  -F 'objectives=[{name:"first objective objective",is_primary:true,type:"CONVERSIONS",applications:[{id:<APP_ID1>},{id:<APP_ID2>}]},{name:"second  objective",type:"CONVERSIONS",applications:[{id:<APP_ID3>,event_names:["fb_mobile_purchase"]}],adspixels:[{id:<FB_PIXEL_ID>,event_names:["fb_pixel_purchase","fb_pixel_lead"]}]}]' \
  -F 'access_token=<ACCESS_TOKEN>' \
  'https://graph.facebook.com/<API_VERSION>/<BUSINESS_ID>/ad_studies'
```

You can update, add, and remove objectives in a study by doing so at the study level similar to modifying test groups. To update an existing objective, refer to its ID in the `objectives` object. To add a new objective, provide a new objective object. To remove an objective, simply omit it from the `objectives` parameter when you update it.

**Example** - Update an objective's `applications` measurement sources and remove its `adspixels` measurement sources

### cURL
```
curl \
  -F 'objectives=[{id:<OBJECTIVE_ID>,name:"new objective name",applications:[{id:<APP_ID>}],adspixels:[]}]' \
  -F 'access_token=<ACCESS_TOKEN>' \
  'https://graph.facebook.com/<API_VERSION>/<STUDY_ID>'
```

**Example** - Read objectives for a study

### cURL
```
curl -G \
  -d 'access_token=<ACCESS_TOKEN>' \
  'https://graph.facebook.com/<API_VERSION>/<STUDY_OBJECTIVE_ID>?fields=results&breakdowns=["cell_id"]'
```

## Reporting {#reporting}
### Retrieve objectives

**Warning:** All "buyers" metrics will show up for studies started before the cut-off date 7/13/2021. Studies started after 7/13 will not have "buyers" metrics and breakdown by gender, age, and country. This change will impact fields below that start with "buyers" (`buyers_test`, `buyers_control_scaled2`, and so on).

Note also that you need to use the `cell_id` breakdown in order to get cell level results.

A study's objectives are defined during the study setup. See the [setup guide](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lift-studies#objective) on how to define your study's objectives

You can read the objectives that were created for a study by making a `GET` call to the study's `objectives` edge.

### cURL
```
curl -G \
  -d 'access_token=<ACCESS_TOKEN>' \
  'https://graph.facebook.com/<API_VERSION>/<STUDY_OBJECTIVE_ID>?fields=results&breakdowns=["cell_id"]'
```

**Warning:** For more details on objectives, refer to the [Ad Study Objective](https://developers.facebook.com/docs/marketing-api/reference/ad-study-objective) reference documentation.

### Retrieve results {#retrieve-results}
To retrieve results for an objective, you can make a `GET` call to the objective node by specifying `results` in the fields parameter. The `last_updated_results` field also tells you when the results data for this particular objective was last updated.

Sample response shown as parsed JSON for ease of reading.

Command:

### cURL
```
curl -G \
  -d 'access_token=<ACCESS_TOKEN>' \
  'https://graph.facebook.com/<API_VERSION>/<STUDY_OBJECTIVE_ID>?fields=results&breakdowns=["cell_id"]'
```

The resulting data is a JSON object, containing metrics name and values strings. Please refer to Facebook [Lift Metrics Glossary](https://www.facebook.com/business/help/1092662031214127).

With buyers:

```
{
  "results": [
  "{"cell_id":"<cell_id>",
  "population_test":2334212,
  "population_control":123407,
  "population_reached":1862084,
  "impressions":19020874,
  "spend":26059,
  "buyers_control_raw_scaled":37672.615701199,
  "buyers_exposed":30085.482427228,
  "buyers_frequentist_pValue":0.00064950107027983,
  "conversions_control_raw_scaled":110918.27003534,
  "conversions_exposed":86961.044050743,
  "conversions_raw_pValue":0.12863848309723,
  "conversions_test":104412.89695396,
  "conversions_control_scaled":104575.81331581,
  "conversions_incremental":-162.91636184894,
  "conversions_notExposed":87123.960412592,
  "conversions_confidence":0.69291721817069,
  "conversions_multicell_confidence":null,
  "conversions_incremental_lower":-3470.6251396487,
  "conversions_incremental_upper":3235.0644420632,
  "conversions_multicell_rank":null,
  "conversions_incremental_share":-0.001873440730011,
  "conversions_CPiC":-159.95324044961,
  "buyers_test":40732.369934386,
  "buyers_control_scaled":41990.129061459,
  "buyers_incremental":-1257.7591270729,
  "buyers_notExposed":36617.935710157,
  "buyers_confidence":0.19318944031404,
  "buyers_multicell_confidence":null,
  "buyers_incremental_lower":-2905.5296282828,
  "buyers_incremental_upper":426.25813050358,
  "buyers_multicell_rank":null,
  "buyers_incremental_share":-0.041806181107957,
  "buyers_CPiB":-20.718593440578}"
    ],
    "id": "<objective_id>"
}
```

Without buyers:

```
{
  "results": [
  "{"cell_id":"<cell_id>",
  "population_test":2334212,
  "population_control":123407,
  "population_reached":1862084,
  "impressions":19020874,
  "spend":26059,
  "conversions_control_raw_scaled":110918.27003534,
  "conversions_exposed":86961.044050743,
  "conversions_raw_pValue":0.12863848309723,
  "conversions_test":104412.89695396,
  "conversions_control_scaled":104575.81331581,
  "conversions_incremental":-162.91636184894,
  "conversions_notExposed":87123.960412592,
  "conversions_confidence":0.69291721817069,
  "conversions_multicell_confidence":null,
  "conversions_incremental_lower":-3470.6251396487,
  "conversions_incremental_upper":3235.0644420632,
  "conversions_multicell_rank":null,
  "conversions_incremental_share":-0.001873440730011,
  "conversions_CPiC":-159.95324044961}"
    ],
    "id": "<objective_id>"
}
```

### Breakdown results {#breakdown-results}
In addition to retrieving the results per objective, you can break down the results by providing the `breakdowns` parameter.

### cURL
```
curl -G \
  -d 'access_token=<ACCESS_TOKEN>' \
  'https://graph.facebook.com/<API_VERSION>/<STUDY_OBJECTIVE_ID>?fields=results&breakdowns=["cell_id"]'
```

The following are the available breakdown dimensions:

**Warning:** Studies started after 7/13 will not have breakdowns by gender, age, and country.

| Breakdown | Values |
| --- | --- |
| `age` | `13-17`, `18-24`, `25-34`, `35-44`, `45-54`, `55-64`, `65+` |
| `cell_id` | IDs of the available cells in the study. |
| `gender` | `M` or `F` |
| `country` | Two-letter country codes (`ISO 3166-1 alpha-2`). Example: `US`, `GB`, `IN`, `AU`.<br><br>Currently supported only when queried in combination with `cell_id`.<br><br>Example: `breakdowns=['cell_id','country']` |

The results return multiple JSON objects in the array based on the available breakdowns. For example, if `cell_id` is provided, the results are broken down by the number of cells in the study. You may provide one or more breakdowns; however, the combination of breakdowns must have at least 100 conversions from test and control groups combined for results to display.

```
{
  "id": "<STUDY_OBJECTIVE_ID>",
  "results": [
  {
    "cell_id": "<CELL_ID1>",
    ...
    Default fields where the values are specific to the <CELL_ID1> breakdown
    ...
  },
  {
    "cell_id": "<CELL_ID2>",
    ...
    Default fields where the values are specific to the <CELL_ID2> breakdown
    ...
  }],
}
```

## Setup guide for partners {#partners}
Measurement Partners can set up lift studies on behalf of advertisers. The exposure and opportunity data of the studies are delivered to the partners where they can measure the online and offline sales impact of Facebook advertising.

To set up a study, partners should make a `POST` call to this endpoint:

```
'https://graph.facebook.com/<API_VERSION>/<BUSINESS_ID>/partner_ad_studies'
```

Partners should provide the following information to create a new study:

| Parameter | Description |
| --- | --- |
| `name` | Name of the study. |
| `description` | Brief description about the purpose of the study. |
| `start_time` | Start time of the campaign active period, when ads will start running. **Study start time must be in the future**. |
| `end_time` | End time of the campaign active period, when ads will stop running. **Study start time must be in the future**. |
| `cells` | Cells of the study to describe the test and control groups. |
| `iso_country` | The [ISO country code](https://en.m.wikipedia.org/wiki/ISO_3166-1) of the study. The country code is used to determine the match keys for third-party data and Facebook users. |
| `estimated_budget` | The estimated budget of the campaigns that are active in the study. This estimation is used to gauge the power of the study. If a study does not meet the sufficient power threshold, you receive a warning. |
| `estimated_reach` | The estimated reach of the campaigns that are active in the study. This estimation is used to gauge the power of the study. If a study does not meet the sufficient power threshold, you receive a warning. |
| `estimated_impressions` | The estimated impressions of the campaigns that are active in the study. This estimation is used to gauge the power of the study. If a study does not meet the sufficient power threshold, you receive a warning. |

**Warning:** Partners do not need to supply objectives.

Here is an example of how a partner can set up a lift study with one test group.

### cURL
```
curl \
  -F 'name="new partner study"' \
  -F 'description="description of my partner study"' \
  -F 'start_time=1435622400' \
  -F 'end_time=1436918400' \
  -F 'cells=[{name:"test group",description:"description of my test group",treatment_percentage:90,control_percentage:10,adaccounts:[<ACCOUNT_ID1>,<ACCOUNT_ID2>]}]' \
  -F 'iso_country="us"' \
  -F 'estimated_budget=400000' \
  -F 'estimated_reach=600000' \
  -F 'estimated_impressions=1200000' \
  -F 'access_token=<ACCESS_TOKEN>' \
  'https://graph.facebook.com/<API_VERSION>/<BUSINESS_ID>/partner_ad_studies'
```

After the study creation, you may only update `name`, `description`, `start_time`, `end_time`, and `cells` by making a `POST` call to the Study ID. The update rules are the same as regular lift studies.

```
'https://graph.facebook.com/<API_VERSION>/<BUSINESS_ID>/<STUDY_ID>'
```

## Results for a specific date stamp {#datestamp}
You can specify a date stamp in your API call to obtain study results from a specific date. Note that the call returns the same result that it would if you made the same call on that specific date without including the date stamp field. The date should be within the prior 30 days.

### cURL
```
curl -G \
      -d 'access_token=<ACCESS_TOKEN>' \
      'https://graph.facebook.com/<API_VERSION>/<STUDY_OBJECTIVE_ID>?fields=results&ds=2020-03-01'
```

