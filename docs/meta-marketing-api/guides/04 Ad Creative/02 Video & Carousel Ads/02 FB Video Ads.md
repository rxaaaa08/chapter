<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/videoads/fbvideoads | Saved: 2026-09-19 -->

# FB Video Ads



## Prerequisites

Publishing a video to an Ad Market account requires an appropriate [access token](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens) and [permissions](https://developers.facebook.com/docs/permissions/reference). While testing you can easily generate tokens and grant your app permissions by using the Graph API Explorer. Refer to our [Get Started](https://developers.facebook.com/docs/video-api/getting-started) guide for this.

When your app is ready for production, implement [Facebook Login](https://developers.facebook.com/documentation/facebook-login) to get tokens and permissions from your app users. This guide assumes you have implemented the required components and successfully followed the Get Started guide.

For a user who can perform tasks on an ad account, you will need to implement Facebook Login to ask for the following permissions and receive a user access token:  

* `ads_read`  
* `ads_management`

If using a business system user in your API requests, note that uploading videos to business accounts is not yet supported.

Your app user must be able to perform the `CREATE_CONTENT` task on the ad account in the API requests.

### Best practices

When testing an API call, you can include the `access_token` parameter set to your access token. However, when making secure calls from your app, use the [access token class.](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens#portabletokens)

## Upload video ads
Publishing video ads involves the Resumable (non-chunking) protocol.

**Warning:** Only uploading videos to ad accounts is supported. The API does not yet support uploading videos to business accounts.

| Step | API |
| --- | --- |
| [Initialize](#step-1-initialize-upload-session) | `/act_<PAYMENT_ACCOUNT_ID>/video_ads?upload_phase=start` |
| [Upload](#step-2-upload-video) | `rupload.facebook.com/video-ads-upload/v25.0/<VIDEO_ID>`<br> |
| [Status](#step-3-retrieve-upload-session-status-optional) | `/<VIDEO_ID>?fields=status` |
| [Publish](#step-4-publish-video-to-ad-account) | `/act_<PAYMENT_ACCOUNT_ID>/video_ads?upload_phase=finish` |

### Video Specifications {#requirements}

| Property | Specification |
| --- | --- |
| File Type | MP4 (recommended) |
| Aspect Ratio | 16:9 (Landscape) to 9:16 (Portrait) |
| Maximum File Size | Up to 10 GB recommended. Larger file sizes may experience longer upload and processing times. |
| Minimum Width | 1200 pixels |
| Resolution | 1280x720 (recommended) |
| Frame Rate | 24 to 60 frames per second |
| Video Settings | * Chroma subsampling 4:2:0<br>* Closed GOP (2-5 seconds)<br>* Compression – H.264, H.265 (VP9, AV1 are also supported)<br>* Fixed frame rate<br>* Progressive scan |
| Audio Settings | * Audio bitrate – 128kbs+<br>* Channels – Stereo<br>* Codec – AAC Low Complexity<br>* Sample rate – 48kHz |

## Step 1: Initialize upload session {#step-1-initialize-upload-session}
To initialize a video upload session, send a `POST` request to the `/act_<PAYMENT_ACCOUNT_ID>/video_ads` endpoint with the `upload_phase` parameter  set to `start`.
#### Example request

```html
curl -X POST "https://graph.facebook.com/v25.0/act_<PAYMENT_ACCOUNT_ID>/video_ads" \
  -F "upload_phase=start" \
  -F "access_token=<ACCESS_TOKEN>"
```

On success, your app receives a JSON response with the ID for the video and the Facebook URL for uploading the video. This video ID will be used in subsequent steps.

#### Example response

```html
{
  "video_id": "<VIDEO_ID>",
  "upload_url": "https://rupload.facebook.com/video-ads-upload/v25.0/<VIDEO_ID>",
}
```

## Step 2: Upload Video {#step-2-upload-video}
The video you want to upload can either be a local file on your device or a URL. If using a URL, it must be hosted on a public facing http/https server, such as a CDN.

### Upload a local file
To upload a local file, send a `POST` request to the `upload_url` endpoint you received in step 1 with the following parameters:

* `offset` set to `0`
* `file_size` set to the total size in bytes of the video being uploaded

#### Example request

```html
curl -X POST "https://rupload.facebook.com/video-ads-upload/v25.0/<VIDEO_ID>" \
  -H "Authorization: OAuth <ACCESS_TOKEN>" \
  -H "offset: 0" \
  -H "file_size: 73400320" \
  --data-binary "@/path/to/file/my_video_file.mp4"
```

On success, your app receives a JSON response with the ID for the video and the Facebook URL for uploading the video. This video ID will be used in subsequent steps.

#### Example response

```html
{
    "success": true
}
```

#### Headers
| Name | Description |
| --- | --- |
| `authorization` | Should contain `OAuth {access-token}` |
| `offset` | The byte offset of the first byte being uploaded in this request.<br>Generally should be set to 0, unless resuming an interrupted upload.<br>If resuming an interrupted upload, set to the `offset` returned by /status |
| `file_size` | The total size in bytes of the video being uploaded |
| `file_url` | The url for the publicly hosted video. Supported protocols are http and https. Other protocols, and urls requiring authentication are not currently supported. |

#### Resume interrupted file upload

If the video upload is interrupted, it can be resumed by repeating the `POST` request with `offset` set to the `bytes_transferred` value from a `GET` `/status` endpoint. You can also restart the upload by setting the offset to `0`. This can be done by first retrieving the upload byte offset from the status endpoint, and then uploading the remaining bytes using the upload URL.

The `offset` header should be set to the `offset/bytes_transferred` value received from the status endpoint, or set to `0` to restart from the beginning of the upload. The file bytes sent in the subsequent request should start with the byte at "offset" (zero-based).

#### Upload hosted files
This method can be used when the video to upload is hosted on a public facing http/https server, such as a CDN.

#### Example request

```html
curl -X POST "https://rupload.facebook.com/video-ads-upload/v25.0/<VIDEO_ID>" \
  -H "Authorization: OAuth <ACCESS_TOKEN>" \
  -H "file_url: https://some.cdn.url/video.mp4"
```

## Step 3: Retrieve upload session status (optional) {#step-3-retrieve-upload-session-status-optional}
You can retrieve the status of a publishing operation by sending a `GET` request for the `status` field on the video.

- Host: `graph.facebook.com`

- Endpoint: `/v25.0/<VIDEO_ID>?fields=status`

### Response
The response will be a JSON object that includes a status field. The status field will include the following nested fields:
| Name | Description |
| --- | --- |
| `video_status` | The overall status of the upload and processing. |
| `uploading_phase` | This structure contains information about progress through the uploading phase. The `bytes_transferred` field can be used in conjunction with the upload endpoint to resume an interrupted upload. |
| `processing_phase` | This structure contains information about progress through the processing phase. This phase encompasses generating alternate media encodings, thumbnails, and other assets necessary for publishing. |
| `publishing_phase` | This structure contains information about progress through the publishing phase. This phase encompasses adding the video to the ad account. |

#### Example request

```html
curl -X GET "https://graph.facebook.com/v25.0/<VIDEO_ID>" \
  -H "Authorization: OAuth <ACCESS_TOKEN" \
  -d "fields=status"
```

#### Example response

```html
{
  "status": {
    "video_status": "processing", // ready, processing, expired, error
    "uploading_phase": {
      "status": "in_progress", // not_started, in_progress, complete, error
      "bytes_transferred": 50002  // bytes received (also 'offset')
    },
    "processing_phase": {
      "status": "not_started"
    }
    "publishing_phase": {
      "status": "not_started",
      "publish_status": "publish",
      "publish_time": 234523452 // publish time (unix)
    }
  }
}
```

## Step 4: Publish video to ad account {#step-4-publish-video-to-ad-account}
When you end the upload session, the video is encoded and published to the ad account. To end the upload session and publish your video, send a `POST` request to `video_ads` endpoint on the corresponding ad account node.

- Host: `graph.facebook.com`

- Endpoint: `/v25.0/act_<PAYMENT_ACCOUNT_ID>/video_ads`

The response will be a JSON object that indicates whether the request was successful.
| Field | Required | Comments |
| --- | --- | --- |
| `video_id` | `yes` | Values: `{video-id}` as returned from Initialize step |
| `upload_phase` | `yes` | Values: `finish` |

#### Example request

```html
curl -X POST "https://graph.facebook.com/video-ads-upload/v25.0/act_<PAYMENT_ACCOUNT_ID>/video_ads" \
  -F "upload_phase=finish" \
  -F 'video_id=<VIDEO_ID>' \
  -F "access_token=<ACCESS_TOKEN>"
```

#### Example response

```html
{
  "success": true,
}
```

## Get video ads
To get a list of all videos for an ad account, send a `GET` request to the `/act_<PAYMENT_ACCOUNT_ID>/video_ads` endpoint where `PAYMENT_ACCOUNT_ID ` is the ID for the payment account you want to view.

#### Example request

```html
curl -X GET "https://graph.facebook.com/v25.0/act_<PAYMENT_ACCOUNT_ID>/video_ads" \
  -F "access_token=<ACCESS_TOKEN>"
```

#### Example response

```html
{
  "data": [
    {
      "updated_time": "unix_timestamp",
      "id": "video_id",
    }
  ]
}
```

### Filters (optional)
| Name | Description |
| --- | --- |
| `since` | Start date/time for querying video ads for a particular timestamp.<br><br>Permitted formats:<br><br>* Epoch timestamps such as `1676057525`<br>* Dates such as `dd mmm yyyy (10 jan 2023)`, `yyyy-mm-dd (2023-01-10)`, `dd-mmm-yyyy (10-jan-2023)`<br>* Words like `today`, `yesterday`, and so on. |
| `until` | End date/time for querying video ads for a particular timestamp.<br><br>Permitted formats:<br><br>* Epoch timestamps such as `1676057525`<br>* Dates such as `dd mmm yyyy (10 jan 2023)`, `yyyy-mm-dd (2023-01-10)`, `dd-mmm-yyyy (10-jan-2023)`<br>* Words like `today`, `yesterday`, and so on. |

