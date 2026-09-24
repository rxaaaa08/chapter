<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/troubleshooting | Saved: 2026-09-19 -->

# Troubleshooting



You may encounter issues when working with the Marketing API. Below are issues you may run into, along with practical solutions to resolve them.

## Error handling

Use the error handling techniques and best practices below to make your applications more reliable and reduce failed API calls.

### Authorization errors

Authorization errors often occur due to [access tokens](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens) that are expired, invalid, or lacking the necessary permissions. To mitigate these errors, refresh tokens regularly and request the correct scopes during authorization.

### Invalid parameters

Sending requests with incorrect or missing parameters can lead to [errors](https://developers.facebook.com/documentation/ads-commerce/marketing-api/error-reference). Always validate the input data before making API calls. Validation tools reduce parameter errors.

### Resource not found

This error occurs when you attempt to access a resource that does not exist or has been deleted. To resolve this error, check that resources (such as campaigns or ad sets) exist before performing operations on them.

### Rate limiting

The Marketing API enforces [rate limits](https://developers.facebook.com/documentation/ads-commerce/marketing-api/overview/rate-limiting) to prevent abuse. Exceeding these limits results in error messages indicating that you have made too many requests in a short time. Use exponential back-off strategies to slow down request rates after you hit the limit.

To optimize performance and avoid hitting rate limits, create a queue system for API requests. This allows for controlled pacing of requests, ensuring compliance with the API's limits without sacrificing performance.

### Caching strategies

Implement caching for frequently accessed data, such as audience insights or ad performance metrics. Caching reduces the number of API calls and speeds up data retrieval, leading to a more efficient application.

### Managing API versioning

Stay informed about [updates and changes](https://developers.facebook.com/documentation/ads-commerce/marketing-api/marketing-api-changelog) in the Marketing API by regularly checking the documentation. Placing API calls within version-specific functions can prepare your application for version changes, allowing for independent updates.

### Error logging and monitoring

Implement robust error logging to track API interactions. Error logging helps you identify patterns in errors and facilitate quicker resolutions. Using monitoring tools can alert developers to critical failures or unusual patterns in API usage.

### Transient issues

Errors will sometimes indicate that the issue is transient (that is, `"is_transient": true`). Wait, then retry the request later. Transient errors typically resolve on their own.
