<!-- Source: https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/mixed-placements-ads | Saved: 2026-09-19 -->

# Ads With Mixed Placements



You can create an ad set with "mixed placement" that runs on Facebook placements and Instagram Stream. All ad creatives used by ads in that set work on both platforms. Provide different [image crop specs](https://developers.facebook.com/documentation/ads-commerce/marketing-api/image-crops) for the same image, with 100x100 or 191x100 for Instagram, and 100x100 for Facebook. Or you can use different images for Facebook and Instagram.

Instagram ignores the image crop spec `191x100` in ad creative, but only takes it in case you use `platform_customizations`.

## Get Started

Create the ad creative with the image you want to use on Facebook, including Facebook desktop, mobile, audience network, etc. Then provide a different image as the override for Instagram only, using the `platform_customizations` parameter.

### PHP Business SDK
```
use FacebookAds\Object\AdCreative;
use FacebookAds\Object\AdCreativeLinkData;
use FacebookAds\Object\Fields\AdCreativeLinkDataFields;
use FacebookAds\Object\AdCreativeObjectStorySpec;
use FacebookAds\Object\Fields\AdCreativeObjectStorySpecFields;
use FacebookAds\Object\Fields\AdCreativeFields;

$link_data = new AdCreativeLinkData();
$link_data->setData(array(
AdCreativeLinkDataFields::MESSAGE => 'Great looking SXT handbags in store. #prettybag',
AdCreativeLinkDataFields::LINK => 'http://example.com',
AdCreativeLinkDataFields::IMAGE_HASH => '<IMAGE_HASH>',
AdCreativeLinkDataFields::CAPTION => 'www.example.com',
AdCreativeLinkDataFields::CALL_TO_ACTION => array(
  'type' => 'LEARN_MORE',
  'value' =>array(
    'link' => 'http://example.com',
  )
),
));

$object_story_spec = new AdCreativeObjectStorySpec();
$object_story_spec->setData(array(
AdCreativeObjectStorySpecFields::PAGE_ID => <PAGE_ID>,
AdCreativeObjectStorySpecFields::instagram_user_id => <IG_USER_ID>,
AdCreativeObjectStorySpecFields::LINK_DATA => $link_data,
));

$platform_customizations = array(
  'instagram' => array(
    'image_url' => 'sample.com/ig-friendly-image.jpg',
    'image_crops' => array(
      '100x100'=> array(array(200,90),array(900,790))
    ),
));

$creative = new AdCreative(null, 'act_<AD_ACCOUNT_ID>');

$creative->setData(array(
AdCreativeFields::NAME => 'Instagram only creative',
AdCreativeFields::OBJECT_STORY_SPEC => $object_story_spec,
'platform_customizations' => $platform_customizations,
));

$creative->create();
```

### Python Business SDK
```
from facebookads.objects import AdCreative
from facebookads.specs import ObjectStorySpec, LinkData

link_data = LinkData()
link_data[LinkData.Field.message] = 'Great looking SXT handbags in store. #prettybag'
link_data[LinkData.Field.link] = 'http://example.com'
link_data[LinkData.Field.caption] = 'www.example.com'
link_data[LinkData.Field.image_hash] = '<IMAGE_HASH>'

call_to_action = {
  'type': 'LEARN_MORE',
}
call_to_action['value'] = {
  'link':'http://example.com',
}

link_data[LinkData.Field.call_to_action] = call_to_action

object_story_spec = ObjectStorySpec()
object_story_spec[ObjectStorySpec.Field.page_id] = <PAGE_ID>
object_story_spec[ObjectStorySpec.Field.instagram_user_id] = <IG_USER_ID>
object_story_spec[ObjectStorySpec.Field.link_data] = link_data

platform_customizations = {
  'instagram': {
      'image_url': 'sample.com/ig-friendly-image.jpg',
      'image_crops': {'100x100':[[200,90],[900,790]],}
  }
}

creative = AdCreative(parent_id='act_<AD_ACCOUNT_ID>')
creative[AdCreative.Field.name] = 'Instagram only creative'
creative[AdCreative.Field.object_story_spec] = object_story_spec
creative['platform_customizations'] = platform_customizations
creative.remote_create()
```

### cURL
```
curl \
-F 'name=Instagram only creative' \
-F 'object_story_spec={
   "page_id":<PAGE_ID>,
   "instagram_user_id":<IG_USER_ID>,
   "link_data":{
       "call_to_action":{
           "type":"LEARN_MORE",
           "value":{
               "link":"http://example.com",
        }},
        "image_hash":"<IMAGE_HASH>",
        "link":"http://example.com",
        "message":"Great looking SXT handbags in store. #prettybag",
        "caption":"www.example.com",
        }}' \
-F 'platform_customizations={
   "instagram": {
        "image_url": "sample.com/ig-friendly-image.jpg",
        "image_crops": {"100x100": [[0, 0],[800, 800]]}},
  }' \
-F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/<API_VERSION>/act_<AD_ACCOUNT_ID>/adcreatives
```

`platform_customizations` parameter may contain only one `instagram` key. With that, you can specify an alternate image using `image_url` or `image_hash`, and an optional image crop spec. You can also specify a different video using `video_id`.

You can use this to override images and videos for Instagram ads. You can use it for `link_data`, `photo_data` and `video_data`. You cannot use it to override text, or to provide overrides for Facebook ads. If the original image for Facebook is specified in a post with `object_story_id`, you can also use this option to display an image or video, instead of the one included in the `object_story_spec`.

**Note:** This feature does not work with [Advantage+ catalog ads](https://developers.facebook.com/docs/instagram/ads-api/guides/dynamic-ads).

