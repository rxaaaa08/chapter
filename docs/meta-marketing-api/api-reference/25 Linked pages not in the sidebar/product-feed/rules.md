<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-feed/rules | Saved: 2026-09-19 | Converted from the web page: Meta's "View as Markdown" export returns an error for this page -->

# Product Feed Rules

Ads in WhatsApp Status are available via the Marketing API. [Learn more about ads in WhatsApp Status.](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-in-whatsapp-status)

## Reading

GraphProductFeedRulesEdge

#### Example

Select language

HTTPPHP SDKJavaScript SDKAndroid SDKiOS SDK

**

---

```
GET /v25.0/{product-feed-id}/rules HTTP/1.1
Host: graph.facebook.com

```

 Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bproduct-feed-id%7D%2Frules&version=v25.0)

 If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

 This endpoint doesn't have any parameters.

#### Fields

 Reading from this edge will return a JSON formatted result:

```

{
"data": [],
"paging": {}
}

```

##### data

 A list of [ProductFeedRule](https://developers.facebook.com/docs/marketing-api/reference/product-feed-rule) nodes.

##### paging

 For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |

## Creating

### /{product_feed_id}/rules

 You can make a POST request to *rules* edge from the following paths:

* [/{product_feed_id}/rules](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-feed/rules)

 When posting to this edge, a [ProductFeedRule](https://developers.facebook.com/docs/marketing-api/reference/product-feed-rule) will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `attribute`<br>*string* | The attribute to which the rules are going to be applied. Its value maps to the the property we are going to transform. <br>**Note:** A feed can not have more than one rule with the same rule_type and attribute. required |
| `params`<br>*dictionary { string : <string> }* | Specifies the parameters which are going to be used as the input of the rule. <br><br>Each rule expects params object to be of particular form: <br>mapping_rule: {"map_from": string}<br>value_mapping_rule: {string: string}<br>letter_case_rule: {"type": one of<br>regex_replace_rule: {regex: string} //regex ==a valid regular expression eg: [Cc]olou?r"to_upper", "to_lower", "capitalize_all", "capitalize_first"}<br>fallback_rule: {"user_default_value": string}<br> |
| `rule_type`<br>*enum{mapping_rule, value_mapping_rule, letter_case_rule, fallback_rule, regex_replace_rule}* | A type of a rule. Defines the operation that is going to be applied to the attribute. required |

#### Return Type

 This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node represented by *id* in the return type.

```

Struct  {
id: numeric string,
}

```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |

---

## Updating

 You can't perform this operation on this endpoint.

## Deleting

 You can't perform this operation on this endpoint.
