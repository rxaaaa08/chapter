<!-- Source: https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/post-moderation | Saved: 2026-09-19 -->

# Post Moderation



Each [ad creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative) with `instagram_user_id` creates an Instagram Stream post for the Instagram account with that ID. You can use the API to access that post, add new comments, check the comments by viewers, and delete certain comments.

To moderate your posts:

- [Through the Instagram Graph API, using `effective_instagram_media_id`](#post-mod-gapi)

**Note:** You cannot currently retrieve age-restricted media and comments via Graph API. In this case, use the [Instagram Graph API approach](#post-mod-gapi).

Learn more about [restrictions for this feature](#comments-restrictions).

### Organic Vs. Non-Organic Comments {#organic-non-organic}

Part of moderating Instagram posts is handling comments left by users. We have two types of comments: organic and non-organic. Organic comments are those made on organic Instagram Media. Non-Organic comments are comments on ads media. [Learn more about Instagram comments](https://developers.facebook.com/docs/instagram-api/reference/ig-comment).

If you are using the media represented by `effective_instagram_media_id`, you only get access to non-organic comments from your posts. To get the organic comments, you can use the media represented by `source_instagram_media_id`. Once you have the underlying ID, use the [Graph API](#post-mod-gapi) to get organic comments.

## Use Marketing API To Get Media Information {#post-mod-mapi}

Ad creatives with `instagram_user_id` have two fields called `instagram_permalink_url` and `effective_instagram_media_id`.

With `instagram_permalink_url`, you can get a URL for a corresponding Instagram post and can see user interactions with the ad post. Because you see this post on a website instead of the mobile Instagram app, it is not exactly what people viewing your ad see. It does not have "Sponsored" or Call To Action, nor it shows Carousel ads with multiple images.

To get an ad creative's `instagram_permalink_url` and `effective_instagram_media_id`:

```html
curl -G \
  -d "access_token=<ACCESS_TOKEN>"\
  -d "fields=instagram_permalink_url,effective_instagram_media_id"\
"https://graph.facebook.com/v25.0/<AD_CREATIVE_ID>"
```

With `effective_instagram_media_id`, send a `GET` request to get all the [comments](https://developers.facebook.com/docs/graph-api/reference/instagram-comment) for a post:

```html
curl -G \
  -d "access_token=<ACCESS_TOKEN>"\
  -d "fields=id,message,instagram_user"\
"https://graph.facebook.com/v25.0/<EFFECTIVE_INSTAGRAM_MEDIA_ID>/comments"
```

The response includes only non-organic comments:

```json
{
  "data": [
    {
      "id": "1234",
      "text": "Where can I get it?"
    }
    {
      "id": "5678",
      "text": "This is nice.",

    }
  ],
  "paging": {
    ...
  }
}
```

## Use Instagram Graph API for Comments {#post-mod-gapi}

**Note:** Additional permissions are needed to utilize the Instagram Graph API to manage comments on Instagram ads. For more details, see the permissions sections [here](https://developers.facebook.com/docs/instagram-api/reference/ig-media/comments).

Check the following documentation for instructions on how to:

- [Create a new comment](https://developers.facebook.com/docs/instagram-api/reference/ig-media/comments#create)
- [Read a comment](https://developers.facebook.com/docs/instagram-api/reference/ig-comment#read)
- [Update, hide and unhide comments](https://developers.facebook.com/docs/instagram-api/reference/ig-comment#update)
- [Delete a comment](https://developers.facebook.com/docs/instagram-api/reference/ig-comment#delete)

## Limitations {#comments-restrictions}

- Post-moderation are **not available for Instagram stories**. Stories are not posts open to comment.
- Comment moderation features do not work with Advantage+ catalog ads. The `effective_instagram_media_id` field in an ad creative does not work with the [template creative for Advantage+ catalog ads](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/carousel-ads#dynamic).
