<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway/custom-audience | Saved: 2026-09-19 -->

# Custom Audience



**Warning:** This feature is in open beta.

The Custom Audience feature on Signals Gateway is a powerful tool that enables advertisers to create and manage custom audiences for precision-driven advertising campaigns. By utilizing events sent to Signals Gateway, the system can extract audience information and send it to customized destinations, such as DFCA or any other third-party platforms, ensuring highly relevant and impactful ad campaigns.

When advertisers activate this feature and define specific criteria (e.g., Purchase events), Signals Gateway identifies and extracts audience data from these events. This data is stored in a dedicated audience storage system and is periodically published to advertiser-defined destinations.

By leveraging Custom Audience, advertisers can ensure that their ads are shown to the most relevant audience, resulting in higher engagement and conversion rates. Additionally, Custom Audience provides valuable insights into customer behavior and preferences, allowing advertisers to optimize their campaigns and improve performance.

## Benefits

Using Custom Audience on Signals Gateway provides several benefits, including:

* Increased targeting accuracy: By using events to extract audience information, advertisers can ensure that their ads are shown to the most relevant audience.
* Improved campaign performance: Targeted ads tend to perform better than broad-based campaigns, resulting in higher engagement and conversion rates.
* Enhanced customer insights: Custom Audience provides valuable insights into customer behavior and preferences, allowing advertisers to optimize their campaigns and improve performance.

## How It Works

The Custom Audience feature operates in the following steps:

1. **Event-Based Audience Data Extraction**: Signals Gateway processes incoming events (for example, Purchase events, Page Views) as defined by the advertiser.
2. **Audience Information Storage**: Extracted audience data is securely stored in Signals Gateway's audience storage.  
3. **Scheduled Publishing to Destinations**: Audience data is periodically published to remote destinations configured by the advertiser, such as DFCA or other custom audience platforms.  

## Supported Audience Fields

The following audience fields are currently supported by Custom Audience on Signals Gateway:

* Email
* Phone
* Gender
* Birthdate (Year, Month, Day)
* Last Name
* First Name
* City
* State
* Zip Code
* Mobile Advertising ID (MADID)
* Country
* External ID

## Getting Started

### Create Custom Audience Storage

#### Create Pipeline with Custom Audience Storage

Step 1. Go to the pipeline creation page, select "Audience Storage" as the Data destination.

Step 2. In "Set up audience storage" page, enter "Audience name", select "Event retention period" and other options in the audience creation flow, and complete the creation process.

Step 3. After finishing the creation, you should see the Audience Storage in the pipeline Overview page.

### Add Custom Audience Storage to Existing Pipeline

Add destination for existing pipeline, select "Audience Storage" as the Data destination. And follow the same instructions as "Create pipeline with Custom Audience Storage" section

### Create Audience Rule

1. After audience storage is successfully created, a default Audience Rule with name "All visitors" will be created. You can update this Audience rule or create a new Audience Rule.

2. Click **Create audience**, enter the fields and select Criteria.

### Connect Audience Consumer

1. Select **Connect** to connect a consumer destination for the audience you want to send.

2. Enter the required fields about the configuration of the destination.

3. Enter the required fields about the configuration of the destination.

See [Editing the Customized Schema](#editing-schema) section below for guidance when editing the customized schema.

4. Test connection and **Save** to complete the Consumer creation process.

## Editing the Customized Schema {#editing-schema}

Signals Gateway Custom Audience service allows you to connect audience data to any destination by providing a customizable schema. Whether you're targeting platforms like Meta, Google, or using custom APIs, this guide will help you define, format, and submit audience data securely.

### Customizing the Audience Schema

You can create a custom schema that defines how audience data is structured and transmitted. Here's an example of a schema template that you can modify based on your destination:

**Template**:

Add User:  

```
{
  "session": {
    "session_id": {{session_id}},
    "batch_seq": {{batch_seq}},
    "last_batch_flag": {{last_batch_flag}},
    "estimated_num_total": {{estimated_num_total}}
  },
  "payload": {
    "schema": [
      "EMAIL",
      "PHONE",
      "GEN",
      "DOBY",
      "DOBM",
      "DOBD",
      "LN",
      "FN",
      "FI",
      "CT",
      "ST",
      "ZIP",
      "MADID",
      "COUNTRY",
      "EXTERNAL_ID"
    ],
    "data": [
      {% for user in users %}
        [
          "{{hash256(user.email)}}", "{{hash256(user.phone)}}", "{{hash256(user.gender)}}", "{{hash256(user.birth_year)}}", "{{hash256(user.birth_month)}}", "{{hash256(user.birth_day)}}", "{{hash256(user.last_name)}}", "{{hash256(user.first_name)}}", "{{hash256(user.first_initial)}}", "{{hash256(user.city)}}", "{{hash256(user.state)}}", "{{hash256(user.zip_code)}}", "{{user.madid}}", "{{hash256(user.country)}}", "{{user.external_id}}"
        ]
      {% endfor %}
    ]
  }
}
```

Remove User:

```
{
  "payload": {
    "schema": [
      "EMAIL",
      "PHONE",
      "GEN",
      "DOBY",
      "DOBM",
      "DOBD",
      "LN",
      "FN",
      "FI",
      "CT",
      "ST",
      "ZIP",
      "MADID",
      "COUNTRY"
    ],
    "data": [
      {% for user in users %}
        [
          "{{hash256(user.email)}}", "{{hash256(user.phone)}}", "{{hash256(user.gender)}}", "{{hash256(user.birthYear)}}", "{{hash256(user.birthMonth)}}", "{{hash256(user.birthDay)}}", "{{hash256(user.lastName)}}", "{{hash256(user.firstName)}}", "{{hash256(user.firstInitial)}}", "{{hash256(user.city)}}", "{{hash256(user.state)}}", "{{hash256(user.zipCode)}}", "{{user.madid}}", "{{hash256(user.country)}}"
        ]
      {% endfor %}
    ]
  }
}
```

If you're using **Meta Custom Audience**, the above template will work without changes—just use the provided schema and move to the next step  

### Using Predefined Variables

Our schema supports a set of predefined session variables to include metadata about the batch and session:

* `session_id`: Unique identifier for the session.
* `batch_seq`: Sequence number for the current batch.
* `last_batch_flag`: Boolean flag indicating if this is the last batch

To reference these variables in your schema, use double curly braces, like this:  

`"session_id": "{{session_id}}"`

### Audience Data Fields

In the schema's payload section, the `schema` array lists fields that will be included in the audience data. Here are the audience fields you can use:

* EMAIL: `user.email`
* PHONE: `user.phone`
* GEN: `user.gender`
* DOBY: `user.birthYear`
* DOBM: `user.birthMonth`
* DOBD: `user.birthDay`
* LN: `user.lastName`
* FN: `user.firstName`
* FI: `user.firstInitial`
* CT: `user.city`
* ST: `user.state`
* ZIP: `user.zipCode`
* COUNTRY: `user.country`
* MADID: `user.madid`
* EXTERNAL ID: `user.externalId`

For example, if you want to send non-hashed email addresses, you would use:

`"{{user.email}}"`

### Hashing Sensitive Data

For privacy and security, you can hash audience data fields using the `hash256()` method. This will hash sensitive fields (like email and phone) using the SHA-256 algorithm.

To hash a field in your schema:

`"{{hash256(user.email)}}"`

This ensures that email addresses are hashed before transmission.

### Looping Through Audience Data

In your schema template, you can use a special syntax to loop through audience data. This is particularly useful when processing multiple records or iterating over a list of users.

To loop through audience data, use the following syntax:

`{% for user in users %}`

`// Code to process each user`

`{% endfor %}`

#### How It Works

* `{% for user in users %}`: This starts the loop and defines a variable `user` that represents each item in the `users` collection.
* **Inside the loop**: You can access the properties of the **user** object using dot notation (for example, `{{user.email}}`, `{{user.phone}}`, and so on).
* `{% endfor %}`: This ends the loop, indicating that the iteration is complete.

#### Example

If you want to send a list of email addresses, you can use the following code:

```
{
  "payload": {
    "schema": ["EMAIL"],
    "data": [
      {% for user in users %}
        ["{{user.email}}"]
      {% endfor %}
    ]
  }
}
```

This will generate a JSON payload with a list of email addresses, one for each user in the users collection.

**Warning:** **Important Notes**

* **The `users` collection** is automatically populated by our system. You do not need to define it explicitly. Simply use the `{% for user in users %}` syntax to loop through the data, and our system will take care of providing the user data.
* **Accessing user properties**: Within the loop, you can easily reference any field from the `user` object, such as `email`, `phone`, `gender`, or any other data point available for each user.

By using this loop syntax, you can dynamically process and format audience data, ensuring each record is properly handled in your schema.

### Customizing Your Payload

You can modify the payload structure to fit your needs. For example, if you need to send mobile advertising IDs (MADID) or other identifiers, the schema can be extended like this:

```
{
  "advertiser_ids": "[123456789]",
  "id_schema": "["IDFA","EMAIL"]",
  "batch_data": {
    "id": [
      {% for user in users %}
        "{{user.madid}}"
      {% endfor %}
    ],
    "email": [
      {% for user in users %}
        "{{user.email}}"
      {% endfor %}
    ]
  }
}
```

In this example, placeholders like `{{user.madid}}` will be replaced with actual audience data during submission.

### Schema Validation and Formatting

In the UI, you can use the **Format** button to validate and format your schema. This tool helps ensure that the JSON structure is correct before submission, preventing errors and ensuring readability. It's recommended to use this feature before finalizing your schema.

