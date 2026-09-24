<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/non-web-server-events | Saved: 2026-09-19 -->

# Sending Events Directly From a Server



From v1.6.0 onwards, the Conversions API Gateway or Signals Gateway supports an API endpoint that allows non-web (offline, app, CRM) events to be sent from a server to the Gateway instance.

## Send Requests

To send events, make a POST request to this endpoint:

`https://<gateway.instance.url>/capi/{PIXEL_ID}/events`

```
curl -i -X POST \
  -d '{
  "data": [
    {
      "event_name": "Purchase",
      "event_time": <Unix timestamp in seconds, must be within the last seven days>,
      "user_data": {
        "em": [
          "973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b"
        ],
        "ph": [
          "ce3a598687c8d2e5aa6bedad20e059b4a78cca0adad7e563b07998d5cd226b8c"
        ],
        "client_ip_address": "123.123.123.123",
        "client_user_agent": "CLIENT_USER_AGENT",
        "fbc": "fb.1.1554763741205.AbCdEfGhIjKlMnOpQrStUvWxYz1234567890",
        "fbp": "fb.1.1558571054389.1098115397"
      },
      "contents": [
        {
          "id": "product123",
          "quantity": 1,
          "delivery_category": "home_delivery"
        }
      ],
      "custom_data": {
        "currency": "usd",
        "value": 123.45
      },
      "event_source_url": "http://test.com/product/123",
      "action_source": "website"
    }
  ]
}' \
https://<gateway.instance.url>/capi/<PIXEL_ID>/events
```

## See Also

* [Configuration](https://developers.facebook.com/documentation/ads-commerce/gateway-products/configuration)
* [Conversions API Gateway: Setup Guide](https://developers.facebook.com/documentation/ads-commerce/gateway-products/conversions-api-gateway/setup)
* [Signals Gateway: Setup Guide](https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway/setup)
* [Troubleshooting and Monitoring](https://developers.facebook.com/documentation/ads-commerce/gateway-products/troubleshooting-guide)
