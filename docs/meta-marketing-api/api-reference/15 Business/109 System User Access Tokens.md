<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/system_user_access_tokens | Saved: 2026-09-19 -->

# Business System User Access Tokens



## Reading

You can't perform this operation on this endpoint.

## Creating

### /{business_id}/system_user_access_tokens
You can make a POST request to *system_user_access_tokens* edge from the following paths:

- [/{business_id}/system_user_access_tokens](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/system_user_access_tokens)

When posting to this edge, no Graph object will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `asset`<br><br>*array<int64>* | asset<br> |
| `fetch_only`<br><br>*boolean* | fetch_only<br> |
| `scope`<br><br>*List<Permission>* | scope<br> |
| `set_token_expires_in_60_days`<br><br>*boolean* | set_token_expires_in_60_days<br> |
| `system_user_id`<br><br>*int64* | system_user_id<br> |

#### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node to which you POSTed.

```
Struct  {
access_token: string,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 3962 | Provided permission is not valid. Check your spelling and syntax. |
| 452 | Session key invalid. This could be because the session key has an incorrect format, or because the user has revoked this session |
| 200 | Permissions error |

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

