<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/error-handling-guide | Saved: 2026-09-19 -->

# Error Handling


API requests can return error responses. This guide explains what to expect in an error response.

## Error response

The following represents a common error response resulting from a failed API request:

```json
{
    "result": {
        "error": {
            ...
            "message": "<EXCEPTION_MESSAGE>",
            "code": <ERROR_CODE>,
            "error_subcode": <ERROR_SUBCODE>,
            "error_user_title": "<ERROR_TITLE>",
            "error_user_msg": "<ERROR_MESSAGE>",
            "fbtrace_id": "<REQUEST_ID>"
            ...
        }
    },
    "error_code": <ERROR_CODE>,
    "status": "FAILED",
    "exception": "<EXCEPTION_MESSAGE>",
    "id": "<ASYNC_SESSION_ID>"
}
```

### Response parameters
| Name | Description |
| --- | --- |
| `code`<br><br>numeric | An error code. Same as `error_code` field. This code is not guaranteed to be unique.  <br>For details, look at the corresponding API call's error codes section. |
| `error_code`<br><br>numeric | An error code. Same as `code` field. This code is not guaranteed to be unique.  <br>For details, look at the corresponding API call's error codes section. |
| `error_subcode`<br><br>numeric | Based on the error that occurred, this field provides additional information about the error. The `error_subcode` field does not always appear in the response. If available then it is guaranteed to be unique.<br><br>For details, look at the corresponding API call's error codes section. |
| `error_user_msg`<br><br>string | If `error_subcode` is available then this field provides an error message with contextual information.<br><br>For details, look at the corresponding API call's error codes section. |
| `error_user_title`<br><br>string | If `error_subcode` is available then this field provides a short title about the error. |
| `exception`<br><br>string | A human-readable description of the error. Same as `message` field. |
| `fbtrace_id`<br><br>string | Internal support identifier. When [reporting a bug](https://developers.facebook.com/bugs/) related to a Graph API call, include the `fbtrace_id` to help us find log data for debugging. |
| `id`<br><br>numeric string | The ID of the asynchronous request.  <br>Also known as the `ASYNC_SESSION_ID`. |
| `message`<br><br>string | A human-readable description of the error. Same as `exception` field. |
| `status`<br><br>enum string | The status of the async request. For a failed request, the value is always `FAILED`. |

## How to read an error response

Use the fields in the `error` object of the API error response to determine what went wrong:

* If `error_subcode` is available, then use the `error_user_msg` field to get details about the error that occurred.
* If only `error_code` is available, then use the `exception` OR `message` field to get details about the error that occurred.
