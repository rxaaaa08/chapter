<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative/adlabels | Saved: 2026-09-19 -->

# Ad Creative Adlabels



## Reading

You can't perform this operation on this endpoint.

## Creating

You can't perform this operation on this endpoint.

## Updating

### /{ad_creative_id}/adlabels
You can update an [AdLabel](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-label) by making a POST request to [/{ad_creative_id}/adlabels](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative/adlabels).

#### Parameters

| Parameter | Description |
| --- | --- |
| `adlabels`<br><br>*list<Object>* | Specification of ad labels to be associated with the creative<br><br>**[required]**<br> |

#### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node to which you POSTed.

```
Struct  {
success: bool,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |

## Deleting

You can't perform this operation on this endpoint.

