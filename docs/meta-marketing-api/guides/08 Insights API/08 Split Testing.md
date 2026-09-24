<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/split-testing | Saved: 2026-09-19 -->

# Split Testing



Test different advertising strategies on mutually exclusive audiences to see what works.
The API automates audience division, ensures no overlap between groups and helps you to test different variables. Test the impact of different audience types, delivery optimization techniques, ad placements, ad creative, budgets, and more. You or your marketing partner can create, initiate, and view test results in one place. See [Ad Study Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-study).

## Guidelines

* **Define KPIs** with your marketing partner or internal team before you create a test.
* **Confidence level:** Determine this before creating a test. Tests with larger reach, longer schedules, or higher budgets tend to deliver more statistically significant results.
* **Select only one variable per test.** This helps determine the most likely cause of difference in performance.
* **Comparable test sizes** When you test for volume metrics, such as number of conversions, you should scale results and audience sizes so both test sizes are comparable.

## Test restrictions

* Max concurrent studies per advertiser: 100
* Max cells per study: 150
* Max ad entities per cell: 100

### Variable testing

*While you can test many different types of variables, test only one variable at a time.* This preserves the scientific integrity of your test, and helps you identify the specific difference that drives better performance.

For example, consider a split test with ad set A and ad set B. If A uses conversions as its delivery optimization method *and* automatic placements, while B uses link clicks for delivery optimization *and* custom placements, you cannot determine if the different delivery optimization methods or the different placements drove better performance.

In this example, if both ad sets used conversions for delivery optimization, but had different placements, you know that placement strategy is responsible for differences in performance.

To set up this test at the ad set level:

```
curl \
-F 'name="new study"' \
-F 'description="test audience"' \
-F 'start_time=1478387569' \
-F 'end_time=1479597169' \
-F 'type=SPLIT_TEST' \
-F 'cells=[{name:"Group A",treatment_percentage:50,adsets:[<AD_SET_ID>]},{name:"Group B",treatment_percentage:50,adsets:[<AD_SET_ID>]}]' \
-F 'access_token=<ACCESS_TOKEN>' \ https://graph.facebook.com/<API_VERSION>/<BUSINESS_ID>/ad_studies
```

### Testing strategies
You can test two or more strategies against one another. For example, do ads with the conversion objective have a greater impact on your direct response marketing than a website visits objective? To setup this test at the campaign level:

```
curl \
-F 'name="new study"' \
-F 'description="campaign comparison"' \
-F 'start_time=1478387569' \
-F 'end_time=1479597169' \
-F 'type=SPLIT_TEST' \
-F 'cells=[{name:"Group A",treatment_percentage:50,campaigns:[<CAMPAIGN_ID>]},{name:"Group B",treatment_percentage:50,campaigns:[<CAMPAIGN_ID>]}]' \
-F 'access_token=<ACCESS_TOKEN>' \ https://graph.facebook.com/<API_VERSION>/<BUSINESS_ID>/ad_studies
```

### Creative testing
Creative Tests help you explore and evaluate different creatives by running a controlled split test across 2–5 treatment cells. Use the Business Ad Studies endpoint to publish a multicell creative test and assign one ad (creative variant) per cell.

To opt into a Creative Test, include the `creative_test_config` field in your request. Use it to define the test budget by configuring either `daily_budget` or `lifetime_budget_percentage`.

#### Fields
Include these fields in a Creative Test POST request.

##### Required fields
* `name`: Study name (string).
* `type`: Must be `SPLIT_TEST_V2`.
* `creative_test_config`: Required to opt into Creative Testing and define budget:
     * Provide either `daily_budget` or `lifetime_budget_percentage`.
* `cells`: Array of 2–5 cells:
    * `name`: Cell name (string).
    * `treatment_percentage`: Integer percentage for the cell. All cells must sum to 100.
    * `ads`: Array containing exactly one ad ID (string) for that cell (one creative variant per cell).
* `start_time`: Study start time (Unix timestamp, seconds).
* `end_time`: Study end time (Unix timestamp, seconds).
* `cooldown_start_time`: Must match `start_time` (Unix timestamp, seconds).
* `observation_end_time`: Must match `end_time` (Unix timestamp, seconds).

##### Optional fields
* `description`: Study description (string).

#### Example request

```
curl \
-F 'name="Spring Promo Creative test"' \
-F 'description="Measures performance between two creative concepts for the Spring Promo campaign: a static image ad vs a short video ad"' \
-F 'type=SPLIT_TEST_V2' \
-F 'cells=[{name:"group a",treatment_percentage:50, ads:["<AD_ID>"]},{name:"group b",treatment_percentage:50,ads:["<AD_ID>"]}]' \
-F 'creative_test_config={"daily_budget":15000}' \
-F 'start_time=1773957600' \
-F 'cooldown_start_time=1773957600' \
-F 'end_time=1774562400' \
-F 'observation_end_time=1774562400' \
-F 'access_token=<ACCESS_TOKEN>' \ https://graph.facebook.com/v<API_VERSION>/<BUSINESS_ID>/ad_studies
```

### Evaluating tests

To determine the test that performs the best, choose a strategy or variable that achieves the highest **efficiency metric** based on your campaign objective. For example, to test the conversions objective, the ad set that achieves the **lowest cost-per-action (CPA) performs the best**.

Avoid evaluating tests with uneven test group sizes, or significantly different audience sizes. In this case, you should increase the size and results of one split so that it is comparable to your other tests. If your budget is not proportionate to the size of the test group you should consider the volume of outcomes in addition to efficiency.

You should also use an attribution model that makes sense for your business, and to agree upon it before initiating a split test. If your current attribution model needs reevaluation, contact your Facebook representative to run a lift study. This can show the true causal impact of your conversion and brand marketing efforts.

### Budgeting

You can use custom budgets with your split tests, and choose to test different budgets against each other. However, budget directly impacts reach for your test groups. If your test groups result in large differences in reach or audience size, you increase budget to improve your results and make your test comparable.
