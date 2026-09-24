<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative/metadata-tagging | Saved: 2026-09-19 | Converted from the web page: Meta's "View as Markdown" export returns an error for this page -->

# Creative metadata tagging

Ads in WhatsApp Status are available via the Marketing API. [Learn more about ads in WhatsApp Status.](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-in-whatsapp-status)

Creative metadata tagging lets Facebook attribute your images and videos to you, regardless of how or by whom they were uploaded to Facebook. This guide is for creative developers and agencies who need to integrate metadata tagging.

To link a creative asset to the developer who created it — even when the asset is not uploaded to Facebook directly by that developer — Facebook uses the [XMP](https://en.wikipedia.org/wiki/Extensible_Metadata_Platform) standard to tag creative assets such as images and videos.

## How attribution works

1. You add your Meta app ID to a creative file as metadata. People who see the image or watch the video can’t see this information.
2. You or an advertiser uses that file to create an ad on Facebook.
3. Facebook reads the file’s metadata, finds your app ID, and attributes the creative’s use and performance to you.

For example, if you add your app ID to an image and an advertiser later uses that image to create an ad, Facebook reads the app ID from the image’s metadata and attributes the image to you.

## Get started

You need a [Meta app](https://developers.facebook.com/docs/development/create-an-app). Facebook uses your Meta app ID to attribute an image or video to you.

## Choose a tagging format

There are two tagging formats:

| Format | How it works | Pros | Cons |
| --- | --- | --- | --- |
| [Version 1 (V1)](#v1-tagging) | Uses existing XMP tags. | Easier to use and implement. | Limits the amount of information you can carry. |
| [Version 2 (V2)](#v2-tagging) | Uses Facebook-defined tags. | Carries more information than V1. | Integration requires more work. |

After you pick a tagging format, you need a tagging tool. Facebook recommends [ExifTool](https://exiftool.org/), a platform-independent Perl library and [command line application](https://exiftool.org/exiftool_pod.html) for reading, writing, and editing metadata in a [wide variety of files](https://exiftool.org/#supported).

To install ExifTool, follow the [installation instructions](https://exiftool.org/install.html). To confirm the tool works, run `exiftool -ver` on the command line. This returns the tool’s version number.

You can use ExifTool to tag both V1 and V2 formats. You can also apply V1 tagging through common video and image editing software, because it uses existing tags. For more information, see [V1 tagging](#v1-tagging).

## V1 tagging

For V1, update your image or video metadata by assigning your app ID to the `Creator` XMP tag. The following example adds an app ID as the creator tag for a video:

```
exiftool -creator="<YOUR_APP_ID>" -overwrite_original video_file.mp4

```

If you use software that lets you edit XMP directly, set your app ID in the [**dc**](https://developer.adobe.com/xmp/docs/XMPNamespaces/dc/)**:creator** tag.

## V2 tagging

V2 tagging uses ExifTool and requires an additional configuration file named `.exifconf` that defines the schema for the attribution tags. Create a file named `.exifconf` with the following contents:

```
%Image::ExifTool::UserDefined = (
    'Image::ExifTool::XMP::Main' => {
        Attrib => { # <-- must be the same as the NAMESPACE prefix
            SubDirectory => {
                TagTable => 'Image::ExifTool::UserDefined::Attrib',
                # (see the definition of this table below)
            },
        },
    },
);

%Image::ExifTool::UserDefined::Attrib = (
    GROUPS        => { 0 => 'XMP', 1 => 'XMP-Attrib', 2 => 'Image' },
    NAMESPACE     => { 'Attrib' => 'http://ns.attribution.com/ads/1.0/' },
    WRITABLE      => 'string',
    Ads   => {
      Struct => {
        FbId => {Writable => 'integer'},
        ExtId => {},
        Data => {},
        Created => {Writable => 'date'},
        TouchType => {Writable => 'integer'},
      },
      List => 'Seq',
      Name => 'Attrib',
    },
);

1;  #end

```

After you complete the setup, you can start tagging images and videos. To tag an asset with the creative attribution tags, use the following command:

```
exiftool -config .exifconf -Attrib+="{FbId=<APPLICATION_ID>,Created=<YYYY:MM:DD>,TouchType=<TOUCH_TYPE>,ExtId=<EXTERNAL_ID>,Data=<JSON_DATA>}" -overwrite_original <FILE_TO_TAG.XXX>

```

### ExifTool command parameters

| Parameter | Description |
| --- | --- |
| `exiftool` | The command name to run ExifTool. |
| `-config` | Loads the configuration file. The configuration file defines the schema for the tags. |
| `.exifconf` | The configuration file name and path. You can provide the file in two ways: pass it on the command line with the `-config` option, or rename it to `.ExifTool_config` and place it in your home directory or the ExifTool application directory, in which case the tool picks it up automatically. For more information, see the [ExifTool documentation](https://exiftool.org/). |
| `-Attrib+=` | Sets the `Attrib` tag structure. Set all tags together with the `Attrib` key so they’re set correctly as a whole. The `+=` operator adds a new entry rather than overriding the existing one. Wrap the entire structure in double quotes and curly brackets: `"{...}"`. |
| `FbId=<APPLICATION_ID>` | Your app ID. Don’t wrap the value in quotes. Separate tags with a comma (`,`). To include a comma in a value, escape it — see [Escape special characters](#escape-special-characters). |
| `Created=<DATE>` | The date, in `YYYY:MM:DD` format. |
| `TouchType=<TOUCH_TYPE>` | Indicates the type of work you performed on the asset. See [Touch types](#touch-types). |
| `ExtId=<EXTERNAL_ID>` | An optional external ID: a unique string identifier for your asset. If you don’t assign IDs to your files, you can use the file name. You can later recognize a specific asset in Facebook reports by its external ID. Don’t wrap the value in quotes. To include a comma in a value, escape it — see [Escape special characters](#escape-special-characters). |
| `Data=<JSON_DATA>` | Optional. Additional data as JSON-formatted information. You must escape double quotes and curly brackets — see [Escape special characters](#escape-special-characters). Example: `Data=\|{\"key\":\"value\"\|}` |
| `-overwrite_original` | Avoids creating a copy of the original file. |

### Touch types

A creative asset can be created by more than one company. For example, one company can produce a video and another can translate it. Use `TouchType` to indicate each type of work performed on the asset:

| Value | Touch type |
| --- | --- |
| 1 | Ideation |
| 2 | Production |
| 3 | Modification |
| 4 | Templating |
| 5 | Branded content |

In most cases, if you generate creative assets, use option 2 (Production).

### Escape special characters

You might need to escape special characters when you provide information through ExifTool.

| Character | What to do |
| --- | --- |
| Comma (`,`) | ExifTool separates tags with a comma (`,`). To include a comma in a value, escape it with a pipe (`\|`). Example: the external ID `Video_001, Client_004` becomes `ExtId=Video_001\|, Client_004`. |
| Curly brackets (`{``}`) | ExifTool wraps the tag structure in curly brackets. To include a curly bracket in a value, escape it with a pipe (`\|`). This is common when you provide information in JSON format. Example: `Data=\|{\"key\":\"value\"\|}` |
| Double quote (`"`) | ExifTool wraps the entire attribution tag in double quotes. To include a double quote in a value, escape it with a backslash (`\`). |

## Feed tagging

You can tag feeds with your Meta app ID and asset ID to attribute catalogs to feed management developers, as documented in the [catalog metadata tags guide](https://developers.facebook.com/docs/marketing-api/catalog/guides/metadata-tags/).

To attribute the catalogs that use a feed to your app, include the following elements as space-delimited comments at the top of TSV or CSV feeds, or inside a `metadata` tag in XML feeds:

* `ref_creative_template_application_id` — The app that designed the creative template. Facebook records this as touch type 4 (Templating).
* `ref_creative_production_application_id` — The app that generated the assets in the catalog, such as images or videos. Facebook records this as touch type 2 (Production).

**Example TSV feed format**

```
# ref_application_id <YOUR_APP_ID>
# ref_asset_id <YOUR_ASSET_ID>
# ref_creative_template_application_id <YOUR_APP_ID>
# ref_creative_production_application_id <YOUR_APP_ID>
id	title	description	link	image_link	condition	availability	price	brand
DB_1	Dog Bowl In Blue	Solid plastic dog bowl in marine blue	http://www.example.com/bowls/db-1.html	https://www.facebook.com/images/product_image_template.png?id=1	new	in stock	9.99 GBP	Example

```

**Example RSS XML feed format**

```
<?xml version="1.0"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <metadata>
      <ref_application_id><YOUR_APP_ID></ref_application_id>
      <ref_asset_id><YOUR_ASSET_ID></ref_asset_id>
      <ref_creative_template_application_id><YOUR_APP_ID></ref_creative_template_application_id>
      <ref_creative_production_application_id><YOUR_APP_ID></ref_creative_production_application_id>
    </metadata>
  </channel>
</rss>
```

## Validate assets

Send a few samples of your tagged assets to your Facebook representative so Facebook can validate your tagging. Facebook lets you know whether it can read the metadata correctly and gives you feedback if there’s a problem.

After Facebook validates your tags, you can send tagged assets to advertisers. When the assets are uploaded, Facebook reads the metadata and makes the attribution based on the app ID.

>

Facebook may collect or receive the metadata that you include in creative assets, such as images and videos, for the purposes of attribution, regardless of whether you or a third party sends or uploads them to a Meta product. Facebook may use this information for the attribution, measurement, and analytics of the creative assets.
