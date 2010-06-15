<?php
/**
 * Helioviewer Web Server (Dynamo)
 *
 * PHP version 5
 *
 * @category Application
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 *
 * TODO 01/28/2010
 *  = Document getDataSources, getJP2Header, and getClosestImage methods.
 *  = Explain use of sourceId for faster querying.
 *
 * TODO 01/27/2010
 *  = Discuss with JHV team about using source ID's instead of string
 *    identifiers to speed up method calls.
 *  = Add method to WebClient to print config file (e.g. for stand-alone
 *    web-client install to connect with)
 *  = Add getPlugins method to JHelioviewer module (empty function for now)
 */
require_once "src/Config.php";
$config = new Config("../settings/Config.ini");

if (isset($_REQUEST['action'])) {
    $params = $_REQUEST;
}

if (!(isset($params) && loadModule($params))) {
    $baseURL = "http://" . $_SERVER['HTTP_HOST'] . $_SERVER['PHP_SELF'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Helioviewer.org API</title>
    <link rel="shortcut icon" href="../favicon.ico">
    <meta http-equiv="X-UA-Compatible" content="chrome=1">
    <meta charset="utf-8" />
    <meta http-equiv="Cache-Control" content="No-Cache">
    <meta name="author" content="Keith Hughitt">
    <meta name="description" content="Helioviewer - Solar and heliospheric image visualization tool">
    <meta name="keywords" content="Helioviewer, hv, solar image viewer, sun, solar, heliosphere,
                                      solar physics, viewer, visualization, space, astronomy, API">
    <link rel="stylesheet" type="text/css" href="resources/css/api.css" />
</head>

<body>

<!-- Logo -->
<img alt="Helioviewer Logo" src="resources/images/about.png" style="float: left;">
<h1 style="position: relative; top: 22px;">API</h1>
<br />

<!-- Table of contents -->
<div class='toc'>
<ol>
    <li><a href="index.php#Overview">Overview</a></li>
    <li><a href="index.php#CustomView">Loading a Custom View</a></li>
    <li><a href="index.php#ImageAPI">Image API</a></li>
    <li>
        <a href="index.php#FeatureEventAPI">Feature/Event API</a>
        <ul>
            <li><a href="index.php#getEventCatalogs">Catalogs</a></li>
            <li><a href="index.php#getEvents">Catalog Entries</a></li>
        </ul>
    </li>
    <li>
        <a href="index.php#JPEG2000API">JPEG 2000 API</a>
        <ul>
            <li><a href="index.php#getJP2Image">Image API</a></li>
            <li><a href="index.php#getJPX">JPX API</a></li>
        </ul>
    </li>
    <li><a href="index.php#MovieAPI">Movie and Screenshot API</a></li>
    <li>
        <a href="index.php#Appendices">Appendices</a>
        <ol style="list-style-type: upper-latin;">
            <li><a href="index.php#Identifiers">Identifiers</a></li>
            <li><a href="index.php#VariableTypes"> Variable Types </a></li>
            <li><a href="index.php#ArcsecondConversions">Arcsecond Conversions</a></li>
        </ol>
    </li>
</ol>
</div>

<br />
<hr>
<br />

<!-- Main Content -->
<div class='content'>

<!-- Overview -->
<div id="Overview">

    <h1>1. Overview</h1>
    <p>In order to facilitate third-party application developers who wish to use content from and interact with
    Helioviewer.org, a number of <abbr title="Application Programming Interface">APIs</abbr> have been developed,
    offering  access to a variety of components used by Helioviewer. All of the interfaces are accessed using HTML query
    strings. The simplest APIs require only a single URI, and result in some resource being returned, e.g. a movie or
    <abbr title="JPEG 2000">JP2</abbr> image series, or some action being performed, e.g. loading a particular "view"
    into Helioviewer. Some of the API's are somewhat more complex, and involve two steps. For example, in order to get a
    list of events from some catalogs for a certain period of time, first a query is usually made to see which catalogs
    are available and functional. A second query then returns a list of features/events are fetched using a second
    query. If you know the ID's for the desired catalogs and are confident that they are available, you can skip the
    first query    and go straight to the second query. More on that later though.

    <br />
    <br />

    The general structure of queries is as follows:</p>

    <div class="summary-box">
        <?php echo $baseURL;?>?action=methodName&param1=value1&param2=value2...
    </div>


    <p>The base URL is the same for each of the APIs (<a href="<?php echo $baseURL;?>;"><?php echo $baseURL;?></a>).
    The "action" parameter is required and specifies the specific functionality to access. In addition, other parameters
    may also be required depending on the specific API being accessed. The one exception to this rule is the
    <a href="index.php#CustomView">Custom View API</a> which is accessed from
    <a href="http://www.helioviewer.org/index.php"> http://www.helioviewer.org/index.php</a> and does not require an
    "action" to be specified. Finally, the queries may be sent using either a GET or POST request. In both cases the
    result is a <abbr name="JSON" title="JavaScript Object Notation">JSON</abbr> object

</div>

<!-- Custom View API-->
<div id="CustomView">
    <h1>2. Custom View API:</h1>
    <p>The custom view API enables the user to load a specific set of parameters into Helioviewer: "view," here, simply
    means a given set of observation parameters. This is useful for dynamically loading a specific view or observation
    into Helioviewer using a URL.</p>

    <div class="summary-box">
        <span style="text-decoration: underline;">Usage:</span>
        <br />
        <br />
        http://www.helioviewer.org/index.php<br />
        <br />

        Supported Parameters:<br />
        <br />

        <table class="param-list" cellspacing="10">
            <tbody valign="top">
                <tr>
                    <td width="20%"><b>date</b></td>
                    <td width="25%"><i>ISO 8601 UTC Date</i></td>
                    <td width="55%">Date and time to display</td>
                </tr>
                <tr>
                    <td><b>imageScale</b></td>
                    <td><i>Float</i></td>
                    <td>Image scale in arc-seconds/pixel</td>
                </tr>
                <tr>
                    <td><b>imageLayers</b></td>
                    <td><i>2d List</i></td>
                    <td>A comma-separated list of the image layers to be
                    displayed. Each image layer should be of the form:
                    [OBSERVATORY,INSTRUMENT,DETECTOR, MEASUREMENT,VISIBLE,OPACITY].</td>
                </tr>
            </tbody>
        </table>

        <br />

        <span class="example-header">Example:</span> <span class="example-url">
        <a href="http://www.helioviewer.org/index.php?date=2003-10-05T00:00:00Z&amp;imageScale=2.63&amp;imageLayers=[SOHO,EIT,EIT,171,1,100],[SOHO,LASCO,C2,white-light,1,100]">
           http://www.helioviewer.org/index.php?date=2003-10-05T00:00:00Z&imageScale=2.63&imageLayers=[SOHO,EIT,EIT,171,1,100],[SOHO,LASCO,C2,white-light,1,100]
        </a>
        </span>
    </div>
</div>

<br />

<!-- Image API -->
<div id="ImageAPI">
    <h1>3. Image API:</h1>
    <p><i>Under Development...</i></p>
</div>

<!-- Feature/Event API -->
<div id="FeatureEventAPI">
    <h1>4. Feature/Event API:</h1>
    <p>There are two ways to use Helioviewer's Feature/Event API. The first is to query the available catalogs, and then
    query for specific features/events within each catalog. The second method is to go straight to querying for
    features/events, skipping the catalog step. This requires that you already know the identifiers for each specific
    catalog you wish you query. Both steps are described below.</p>
    <ol style="list-style-type: upper-latin;">

        <!-- Catalog API -->
        <li>
        <div id="getEventCatalogs">Feature/Event Catalogs:
        <p>To query the list of available catalogs, simply call the "getEvents" API with no parameters. This will
        return a list of the available catalogs, as well as some meta-information describing each of the catalogs.
        The most important parameters returned are the "id", the identifier used to query the specific catalog for
        features/events, and "eventType" which specified the type of feature/event the catalog described, e.g. "CME"
        or "Active Region."</p>

        <br />

        <div class="summary-box">
        <span style="text-decoration: underline;">Usage:</span>

        <br />
        <br />
        <a href="<?php echo $baseURL;?>?action=getEventCatalogs">
            <?php echo $baseURL;?>?action=getEventCatalogs
        </a>

        <br /><br />
        Result:
        <br /><br />

        An array of catalog objects is returned formatted as JSON. Each catalog object includes the following
        six parameters:

        <!-- Feature/Event Catalog Parameter Description -->
        <table class="param-list" cellspacing="10">
            <tbody valign="top">
                <tr>
                    <td width="25%"><b>adjustRotation</b></td>
                    <td width="15%"><i>Boolean</i></td>
                    <td>Specifies whether the position of the events has been adjusted to account for solar
                    rotation.</td>
                </tr>
                <tr>
                    <td><b>coordinateSystem</b></td>
                    <td><i>String</i></td>
                    <td>The type of coordinate system used by the catalog provider. Recognized coordinate systems
                    include "HELIOGRAPHIC," "PRINCIPAL_ANGLE," and "ANGULAR."</td>
                </tr>
                <tr>
                    <td><b>description</b></td>
                    <td><i>String</i></td>
                    <td>A brief human-readable description of the catalog.</td>
                </tr>
                <tr>
                    <td><b>eventType</b></td>
                    <td><i>String</i></td>
                    <td>The type of event described. See <a href="index.html#Identifiers">Appendix A</a> for a list of
                    the supported event types.</td>
                </tr>
                <tr>
                    <td><b>id</b></td>
                    <td><i>String</i></td>
                    <td>The identifier for a specific catalog. The identifier consists of two parts separate by
                    double-colons. The left-side of the double-colons identifies the catalog provider, which may be
                    the same for several catalogs. The right-side identifies the specific catalog.</td>
                </tr>
                <tr>
                    <td><b>name</b></td>
                    <td><i>String</i></td>
                    <td>A human-readable name for the catalog.</td>
                </tr>
            </tbody>
        </table>

        </div>

        <br />

        <!-- Catalog API Notes -->
        <div class="summary-box" style="background-color: #E3EFFF;">
        <span style="text-decoration: underline;">Notes:</span>
        <br />
        <br />
        <ul>
            <li>
            <p>Refer to the table in the following section, <a href="index.html#CatalogEntries">Catalog Entries</a>
            for the specific IDs used.</p>
            </li>
            <li>
            <p>Results are returned as <abbr name="JSON" title="JavaScript Object Notation">JSON</abbr>. Future versions
            will provide the ability to request results in either JSON or VOEvent format.</p>
            </li>
        </ul>
        </div>

        </div>
        </li>

        <br />

        <!-- Catalog Entry API -->
        <li>
        <div id="getEvents">Feature/Event Catalog Entries:
        <p></p>

        <div class="summary-box"><span
            style="text-decoration: underline;">Usage:</span><br />
        <br />

        <?php echo $baseURL;?>?action=getEvents<br />
        <br />

        Supported Parameters:<br />
        <br />

        <table class="param-list" cellspacing="10">
            <tbody valign="top">
                <tr>
                    <td width="25%"><b>catalogs</b></td>
                    <td width="35%"><i>List</i></td>
                    <td>A comma-separated list of catalog identifiers identifying the catalogs to be included in
                    the search.</td>
                </tr>
                <tr>
                    <td><b>date</b></td>
                    <td><i>ISO 8601 UTC Date</i></td>
                    <td>The date about which the feature/event query is centered.</td>
                </tr>
                <tr>
                    <td><b>windowSize</b></td>
                    <td><i>Integer</i></td>
                    <td>The window-size (in seconds) to search.</td>
                </tr>
            </tbody>
        </table>

        <br />

        Result:<br />
        <br />
        An array of event objects is returned formatted as JSON. Each event object includes 12 required parameters as
        well as an array, "properties", which contains additional parameters which vary from catalog to catalog. Among
        the 12 required parameters, two of the parameters relating to the coordinates of the event may vary, but every
        event object will include a set of coordinates.
        <br />
        <br />

        <!-- Event Parameter Description -->
        <table class="param-list" cellspacing="10">
            <tbody valign="top">
                <tr>
                    <td width="20%"><b>angularX</b></td>
                    <td width="20%"><i>Integer</i></td>
                    <td><i>[Optional]</i> ...</td>
                </tr>
                <tr>
                    <td><b>angularY</b></td>
                    <td><i>Integer</i></td>
                    <td><i>[Optional]</i> ...</td>
                </tr>
                <tr>
                    <td><b>catalogId</b></td>
                    <td><i>String</i></td>
                    <td>The ID of the catalog from which the event came from.</td>
                </tr>
                <tr>
                    <td><b>detail</b></td>
                    <td><i>String</i></td>
                    <td>Miscellaneous event-related details. The variable properties array is derived primarily from
                    this.</td>
                </tr>
                <tr>
                    <td><b>endTime</b></td>
                    <td><i>ISO 8601 UTC Date</i></td>
                    <td>End event time.</td>
                </tr>
                <tr>
                    <td><b>eventId</b></td>
                    <td><i>String</i></td>
                    <td>Event identifier: varies depending on the catalog source.</td>
                </tr>
                <tr>
                    <td><b>hlat</b></td>
                    <td><i>Integer</i></td>
                    <td><i>[Optional]</i> Heliocentric latitudinal coordinate of event...</td>
                </tr>
                <tr>
                    <td><b>hlong</b></td>
                    <td><i>Integer</i></td>
                    <td><i>[Optional]</i> Heliocentric longitudinal coordinate of event...</td>
                </tr>
                <tr>
                    <td><b>info</b></td>
                    <td><i>String</i></td>
                    <td>A shorter version of the "detail" parameter: lists some basic parameters of the event which
                    vary from catalog to catalog.</td>
                </tr>
                <tr>
                    <td><b>polarCpa</b></td>
                    <td><i>Integer</i></td>
                    <td><i>[Optional]</i> Polar coordinates angle, in degrees.</td>
                </tr>
                <tr>
                    <td><b>polarWidth</b></td>
                    <td><i>Integer</i></td>
                    <td><i>[Optional]</i> Polar coordinates width...</td>
                </tr>
                <tr>
                    <td><b>properties</b></td>
                    <td><i>List</i></td>
                    <td>An array of parameters which vary depending on the specific catalog queried: each catalog is
                    associated with a separate set of parameters.</td>
                </tr>
                <tr>
                    <td><b>shortInfo</b></td>
                    <td><i>String</i></td>
                    <td>An even shorter version of the "detail" parameter: lists some very basic parameters of the event
                    which vary from catalog to catalog.</td>
                </tr>
                <tr>
                    <td><b>sourceUrl</b></td>
                    <td><i>String</i></td>
                    <td>Source URL for the individual event, or a link to the catalog search interface if no individual
                    URL can be generated.</td>
                </tr>
                <tr>
                    <td><b>startTime</b></td>
                    <td><i>ISO 8601 UTC Date</i></td>
                    <td>Start event time.</td>
                </tr>
                <tr>
                    <td><b>sunX</b></td>
                    <td><i>Float</i></td>
                    <td>Normalized heliocentric cartesian X-coordinate.</td>
                </tr>
                <tr>
                    <td><b>sunY</b></td>
                    <td><i>Float</i></td>
                    <td>Normalized heliocentric cartesian Y-coordinate.</td>
                </tr>
            </tbody>
        </table>

        <br />

        <span class="example-header">Example:</span>
        <span class="example-url">
            <a href="<?php echo $baseURL;?>?action=getEvents&amp;date=2003-10-05T00:00:00Z&amp;windowSize=86400&amp;catalogs=VSOService::noaa,GOESXRayService::GOESXRay">
                <?php echo $baseURL;?>?action=getEvents&date=2003-10-05T00:00:00Z&windowSize=86400&catalogs=VSOService::noaa,GOESXRayService::GOESXRay
            </a>
        </span></div>

        <br />

        <!-- Catalog Entry API Notes -->
        <div class="summary-box" style="background-color: #E3EFFF;">
        <span style="text-decoration: underline;">Notes:</span><br />
        <br />
        <ul>
            <li>
            <p>The coordinate parameters returned will vary depending on the specific catalog queried. For catalogs
            which use the "PRINCIPAL_ANGLE" coordinate system, the parameters "polarCpa" and "polarWidth" are returned.
            For catalogs which use the "HELIOGRAPHIC" coordinate system, "hlat" and "hlong" parameters are return.</p>
            </li>
        </ul>
        </div>

        </div>
        </li>
    </ol>
</div>

<!-- JPEG 2000 API -->
<div id="JPEG2000API">
    <h1>5. JPEG 2000 API:</h1>
    <p>Helioviewer's JPEG 2000 API's enable access to the raw JPEG 2000 images used to generate the tiles seen on the
    site, as well as real-time generation of JPEG 2000 Image Series (JPX).</p>
    <ol style="list-style-type: upper-latin;">
        <!-- JPEG 2000 Image API -->
        <li>
        <div id="getJP2Image">JP2 Images:
        <p>Returns a single JPEG 2000 (JP2) image. If an image is not available for the date request the closest
        available image is returned.</p>

        <br />

        <div class="summary-box"><span
            style="text-decoration: underline;">Usage:</span><br />
        <br />

        <?php echo $baseURL;?>?action=getJP2Image<br />
        <br />

        Supported Parameters:<br />
        <br />

        <table class="param-list" cellspacing="10">
            <tbody valign="top">
                <tr>
                    <td width="25%"><b>observatory</b></td>
                    <td width="35%"><i>String</i></td>
                    <td>Observatory</td>
                </tr>
                <tr>
                    <td><b>instrument</b></td>
                    <td><i>String</i></td>
                    <td>Instrument</td>
                </tr>
                <tr>
                    <td><b>detector</b></td>
                    <td><i>String</i></td>
                    <td>Detector</td>
                </tr>
                <tr>
                    <td><b>measurement</b></td>
                    <td><i>String</i></td>
                    <td>Measurement</td>
                </tr>
                <tr>
                    <td><b>date</b></td>
                    <td><i>ISO 8601 UTC Date</i></td>
                    <td>Observation date and time</td>
                </tr>
                <tr>
                    <td><b>sourceId</b></td>
                    <td><i>Integer</i></td>
                    <td><i>[Optional]</i> The image source ID (can be used in place of observatory, instrument, detector and
                    measurement parameters).</td>
                </tr>
                <tr>
                    <td><b>getJPIP</b></td>
                    <td><i>Boolean</i></td>
                    <td><b style="color: red;">[Deprecated]</b> Old-style way of specifying that a JPIP URL should be returned.</td>
                </tr>
                <tr>
                    <td><b>jpip</b></td>
                    <td><i>Boolean</i></td>
                    <td><i>[Optional]</i> Returns a JPIP URI instead of an actual image.</td>
                </tr>
            </tbody>
        </table>

        <br />

        <span class="example-header">Examples:</span>
        <span class="example-url">
        <a href="<?php echo $baseURL;?>?action=getJP2Image&amp;observatory=SOHO&amp;instrument=EIT&amp;detector=EIT&amp;measurement=171&amp;date=2003-10-05T00:00:00Z">
        <?php echo $baseURL;?>?action=getJP2Image&observatory=SOHO&instrument=EIT&detector=EIT&measurement=171&date=2003-10-05T00:00:00Z
        </a>
        </span><br />
        <span class="example-url">
        <a href="<?php echo $baseURL;?>?action=getJP2Image&amp;observatory=SOHO&amp;instrument=LASCO&amp;detector=C2&amp;measurement=white-light&amp;date=2003-10-05T00:00:00Z&amp;jpip=true">
        <?php echo $baseURL;?>?action=getJP2Image&observatory=SOHO&instrument=LASCO&detector=C2&measurement=white-light&date=2003-10-05T00:00:00Z&jpip=true
        </a>
        </span>
        </div>
        </div>
        </li>

        <br />

        <!-- JPX API -->
        <li>
        <div id="getJPX">JPX API
        <p>Returns a JPEG 2000 Image Series (JPX) file. The movie frames are chosen by matching the closest image
        available at each step within the specified range of dates.</p>

        <br />

        <div class="summary-box"><span style="text-decoration: underline;">Usage:</span><br />

        <br />

        <?php echo $baseURL;?>?action=getJPX<br />
        <br />

        Supported Parameters:<br />
        <br />

        <table class="param-list" cellspacing="10">
            <tbody valign="top">
                <tr>
                    <td width="20%"><b>observatory</b></td>
                    <td width="20%"><i>String</i></td>
                    <td>Observatory</td>
                </tr>
                <tr>
                    <td><b>instrument</b></td>
                    <td><i>String</i></td>
                    <td>Instrument</td>
                </tr>
                <tr>
                    <td><b>detector</b></td>
                    <td><i>String</i></td>
                    <td>Detector</td>
                </tr>
                <tr>
                    <td><b>measurement</b></td>
                    <td><i>String</i></td>
                    <td>Measurement</td>
                </tr>
                <tr>
                    <td><b>startTime</b></td>
                    <td><i>ISO 8601 UTC Date</i></td>
                    <td>Movie start time</td>
                </tr>
                <tr>
                    <td><b>endTime</b></td>
                    <td><i>ISO 8601 UTC Date</i></td>
                    <td>Movie end time</td>
                </tr>
                <tr>
                    <td><b>cadence</b></td>
                    <td><i>Integer</i></td>
                    <td><i>[Optional]</i> The desired amount of time between each movie-frame, in seconds. If no 
                    cadence is specified, the server will attempt to select an optimal cadence.</td>
                </tr>
                <tr>
                    <td><b>sourceId</b></td>
                    <td><i>Integer</i></td>
                    <td><i>[Optional]</i> The image source ID (can be used in place of observatory, instrument, detector and
                    measurement parameters).</td>
                </tr>
                <tr>
                    <td><b>frames</b></td>
                    <td><i>Boolean</i></td>
                    <td><i>[Optional]</i> Returns individual movie-frame timestamps along with the file URI
                    as JSON.</td>
                </tr>
                <tr>
                    <td><b>verbose</b></td>
                    <td><i>Boolean</i></td>
                    <td><i>[Optional]</i> In addition to the JPX file URI, returns any warning or
                    error messages generated during the request.</td>
                </tr>
                <tr>
                    <td><b>frames</b></td>
                    <td><i>Boolean</i></td>
                    <td><i>[Optional]</i> Returns a JSON data structure including the JPX URI and also a list of
                    the timestamps associated with each layer in the file.</td>
                </tr>
                <tr>
                    <td><b>jpip</b></td>
                    <td><i>Boolean</i></td>
                    <td><i>[Optional]</i> Returns a JPIP URI instead of an actual movie.</td>
                </tr>
                <tr>
                    <td><b>linked</b></td>
                    <td><i>Boolean</i></td>
                    <td><i>[Optional]</i> Returns a linked JPX file containing image pointers instead of data for each
                    individual frame in the series. Currently, only JPX image series support this feature.</td>
                </tr>
            </tbody>
        </table>

        <br />
        Result:<br />
        <br />
        The default action is to simply return the requested JPX file. If additional information is needed,
        for example, then a JSON result will be returned with the file URI plus any additional parameters requested.
        <br /><br />

        <!-- Return parameter description -->
        <table class="param-list" cellspacing="10">
            <tbody valign="top">
                <tr>
                    <td width="20%"><b>uri</b></td>
                    <td width="20%"><i>String</i></td>
                    <td><i>[Optional]</i> Location of the requested file.</td>
                </tr>
                <tr>
                    <td><b>frames</b></td>
                    <td><i>List</i></td>
                    <td><i>[Optional]</i> List of timestamps.</td>
                </tr>
                <tr>
                    <td><b>verbose</b></td>
                    <td><i>String</i></td>
                    <td><i>[Optional]</i> Any warning or error messages generated during the request</td>
                </tr>
            </tbody>
        </table>

        <br />

        <span class="example-header">Example:</span>
        <span class="example-url">
        <a href="<?php echo $baseURL;?>?action=getJPX&amp;observatory=SOHO&amp;instrument=EIT&amp;detector=EIT&amp;measurement=171&amp;startTime=2003-10-05T00:00:00Z&amp;endTime=2003-10-20T00:00:00Z">
            <?php echo $baseURL;?>?action=getJPX&observatory=SOHO&instrument=EIT&detector=EIT&measurement=171&startTime=2003-10-05T00:00:00Z&endTime=2003-10-20T00:00:00Z
        </a>
        </span><br />
        <span class="example-url">
        <a href="<?php echo $baseURL;?>?action=getJPX&amp;observatory=SOHO&amp;instrument=MDI&amp;detector=MDI&amp;measurement=magnetogram&amp;startTime=2003-10-05T00:00:00Z&amp;endTime=2003-10-20T00:00:00Z&amp;cadence=3600&amp;linked=true&amp;jpip=true">
            <?php echo $baseURL;?>?action=getJPX&observatory=SOHO&instrument=MDI&detector=MDI&measurement=magnetogram&startTime=2003-10-05T00:00:00Z&endTime=2003-10-20T00:00:00Z&cadence=3600&linked=true&jpip=true
        </a>
        </span></div>
        </div>

        <br />

        <!-- getJPX API Notes -->
        <div class="summary-box" style="background-color: #E3EFFF;">
        <span style="text-decoration: underline;">Notes:</span>

        <br /><br />

        <ul>
            <li>
            <p>If no cadence is specified Helioviewer.org attempts to choose an optimal cadence for the requested range and data source.</p>
            </li>
        </ul>
        </div>

        <br />

<!-- Movie API -->
<div id="MovieAPI">
    <h1>6. Movie and Screenshot API:</h1>
    <p>The movie and screenshot API allows users to download images or time-lapse videos of what they are viewing on the website. </p>
    <ol style="list-style-type: upper-latin;">
        <!-- Screenshot API -->
        <li>
        <div id="takeScreenshot">Screenshot API
        <p>Returns a single image containing all layers/image types requested. If an image is not available for the date requested the closest
        available image is returned.</p>

        <br />

        <div class="summary-box"><span
            style="text-decoration: underline;">Usage:</span><br />
        <br />

        <?php echo $baseURL;?>?action=takeScreenshot<br />
        <br />

        Supported Parameters:<br />
        <br />

        <table class="param-list" cellspacing="10">
            <tbody valign="top">
                <tr>
                    <td width="35%"><b>width</b></td>
                    <td width="20%"><i>Float</i></td>
                    <td>Desired output movie width</td>
                </tr>
                <tr>
                    <td><b>height</b></td>
                    <td><i>Float</i></td>
                    <td>Desired output movie height</td>
                </tr>
                <tr>
                    <td><b>startDate</b></td>
                    <td><i>ISO 8601 UTC Date</i></td>
                    <td>Desired starting timestamp of the movie. The timestamps for the subsequent frames are incremented by
                    	a certain timestep.</td>
                </tr>
                <tr>
                    <td><b>imageScale</b></td>
                    <td><i>Float</i></td>
                    <td>The zoom scale of the images. Default scales that can be used are 5.26, 10.52, 21.04, and so on, increasing or decreasing by 
                    	a factor of 2. The full-res scale of an EIT image is 5.26.</td>
                </tr>
                <tr>
                    <td><b>layers</b></td>
                    <td><i>String</i></td>
                    <td>A string of layer information in the following format:<br />
                    	Each layer is comma-separated with these values: <i>sourceId,isVisible,opacity</i>. <br />
                    	If you do not know the sourceId, you can 
                    	alternately send this layer string: <i>observatory,instrument,detector,measurement,isVisible,opacity</i>.
                    	Layer strings are separated by "/": layer1/layer2/layer3.</td>
                </tr>
                <tr>
                    <td><b>offsetLeftTop</b></td>
                    <td><i>String</i></td>
                    <td>The offset of the image's left,top corner from the center of the sun, in arcseconds, separated by a comma. 
                    	The left value is first, and then the top value. Example: -5000,-5000. This can be calculated, if necessary, with
                    	<a href="index.php#ArcsecondConversions" style="color:#3366FF">pixel-to-arcsecond conversions</a>.</td>
                </tr>
                <tr>
                    <td><b>offsetRightBottom</b></td>
                    <td><i>String</i></td>
                    <td>The offset of the image's right,bottom corner from the center of the sun, in arcseconds, separated by a comma. 
                    	The right value is first, and then the bottom value. Example: 5000,5000. This can be calculated, if necessary, with
                    	<a href="index.php#ArcsecondConversions" style="color:#3366FF">pixel-to-arcsecond conversions</a>.</td>
                </tr>
                <tr>
                    <td><b>quality</b></td>
                    <td><i>Integer</i></td>
                    <td><i>[Optional]</i> The quality of the image, from 0-10. If quality is not specified, it defaults to 10.</td>
                </tr>
                <tr>
                    <td><b>filename</b></td>
                    <td><i>String</i></td>
                    <td><i>[Optional]</i> The desired filename (without the ".png" extension) of the output image. If no filename is specified,
                    	the filename defaults to "screenshot" + the unix timestamp of the time it was requested.</td>
                </tr>
                <tr>
                	<td><b>display</b></td>
                	<td><i>Boolean</i></td>
                	<td><i>[Optional]</i> If display is true, the screenshot will display on the page when it is ready. If display is false, the
                		filepath to the screenshot will be returned. If display is not specified, it will default to true.</td>
                </tr>
            </tbody>
        </table>

        <br />

        <span class="example-header">Examples:</span>
        <span class="example-url">
        <a href="<?php echo $baseURL;?>?action=takeScreenshot&width=512&height=512&obsDate=2010-03-01T12:12:12Z&imageScale=10.52&layers=3,1,100/4,1,100&offsetLeftTop=-5000,-5000&offsetRightBottom=5000,5000">
        <?php echo $baseURL;?>?action=takeScreenshot&width=512&height=512&obsDate=2010-03-01T12:12:12Z&imageScale=10.52&layers=3,1,100/4,1,100&offsetLeftTop=-5000,-5000&offsetRightBottom=5000,5000
        </a>
        </span><br />
        <span class="example-url">
        <a href="<?php echo $baseURL;?>?action=takeScreenshot&width=512&height=512&obsDate=2010-03-01T12:12:12Z&imageScale=10.52&layers=SOHO,EIT,EIT,171,1,100/SOHO,LASCO,C2,white-light,1,100&offsetLeftTop=-5000,-5000&offsetRightBottom=5000,5000">
        <?php echo $baseURL;?>?action=takeScreenshot&width=512&height=512&obsDate=2010-03-01T12:12:12Z&imageScale=10.52&layers=SOHO,EIT,EIT,171,1,100/SOHO,LASCO,C2,white-light,1,100&offsetLeftTop=-5000,-5000&offsetRightBottom=5000,5000
        </a>
        </span>
        </div>
        </div>
        </li>

        <br />

        <!-- Movie -->
        <li>
        <div id="buildMovie">Movie API
        <p>Returns filepaths to a flash video and a high quality video consisting of 10-100 movie frames. The movie frames are chosen by matching the closest image
        available at each step within the specified range of dates, and are automatically generated using the Screenshot API calls.</p>

        <br />

        <div class="summary-box"><span
            style="text-decoration: underline;">Usage:</span><br />
        <br />

        <?php echo $baseURL;?>?action=buildMovie<br />
        <br />

        Supported Parameters:<br />
        <br />

        <table class="param-list" cellspacing="10">
            <tbody valign="top">
                <tr>
                    <td width="35%"><b>width</b></td>
                    <td width="25%"><i>Float</i></td>
                    <td>Desired output image width</td>
                </tr>
                <tr>
                    <td><b>height</b></td>
                    <td><i>Float</i></td>
                    <td>Desired output image height</td>
                </tr>
                <tr>
                    <td><b>obsDate</b></td>
                    <td><i>ISO 8601 UTC Date</i></td>
                    <td>Timestamp of the output image. The closest timestamp for each layer will be found if an exact match is not found.</td>
                </tr>
                <tr>
                    <td><b>imageScale</b></td>
                    <td><i>Float</i></td>
                    <td>The zoom scale of the image. Default scales that can be used are 5.26, 10.52, 21.04, and so on, increasing or decreasing by 
                    	a factor of 2. The full-res scale of an EIT image is 5.26.</td>
                </tr>
                <tr>
                    <td><b>layers</b></td>
                    <td><i>String</i></td>
                    <td>A string of layer information in the following format:<br />
                    	Each layer is comma-separated with these values: <i>sourceId,isVisible,opacity</i>. <br />
                    	If you do not know the sourceId, you can 
                    	alternately send this layer string: <i>observatory,instrument,detector,measurement,isVisible,opacity</i>.
                    	Layer strings are separated by "/": layer1/layer2/layer3.</td>
                </tr>
                <tr>
                    <td><b>offsetLeftTop</b></td>
                    <td><i>String</i></td>
                    <td>The offset of the image's left,top corner from the center of the sun, in arcseconds, separated by a comma. 
                    	The left value is first, and then the top value. Example: -5000,-5000. This can be calculated, if necessary, with
                    	<a href="index.php#ArcsecondConversions" style="color:#3366FF">pixel-to-arcsecond conversions</a>.</td>
                </tr>
                <tr>
                    <td><b>offsetRightBottom</b></td>
                    <td><i>String</i></td>
                    <td>The offset of the image's right,bottom corner from the center of the sun, in arcseconds, separated by a comma. 
                    	The right value is first, and then the bottom value. Example: 5000,5000. This can be calculated, if necessary, with
                    	<a href="index.php#ArcsecondConversions" style="color:#3366FF">pixel-to-arcsecond conversions</a>.</td>
                </tr>
                <tr>
                    <td><b>numFrames</b></td>
                    <td><i>Integer</i></td>
                    <td><i>[Optional]</i> The number of frames you would like to include in the movie. You may have between 10 and 100 frames.
                    	The default value is 40 frames.</td>
                </tr>
               	<tr>
                    <td><b>frameRate</b></td>
                    <td><i>Integer</i></td>
                    <td><i>[Optional]</i> The number of frames per second. The default value is 8.</td>
                </tr>
                <tr>
                    <td><b>timeStep</b></td>
                    <td><i>Integer</i></td>
                    <td><i>[Optional]</i> The number of seconds in between each timestamp used to make the movie frames. The default 
                    	is 86400 seconds, or 1 day.</td>
                </tr>
                <tr>
                    <td><b>quality</b></td>
                    <td><i>Integer</i></td>
                    <td><i>[Optional]</i> The quality of the image, from 0-10. If quality is not specified, it defaults to 10.</td>
                </tr>
                <tr>
                    <td><b>filename</b></td>
                    <td><i>String</i></td>
                    <td><i>[Optional]</i> The desired filename (without the ".png" extension) of the output image. If no filename is specified,
                    	the filename defaults to "screenshot" + the unix timestamp of the time it was requested.</td>
                </tr>
                <tr>
                    <td><b>hqFormat</b></td>
                    <td><i>String</i></td>
                    <td><i>[Optional]</i> The desired format for the high quality movie file. Currently supported filetypes are "mp4", "mov", and "avi".</td>
                </tr>
                <tr>
                	<td><b>display</b></td>
                	<td><i>Boolean</i></td>
                	<td><i>[Optional]</i> If display is true, the movie will display on the page when it is ready. If display is false, the
                		filepath to the movie's flash-format file will be returned as JSON. If display is not specified, it will default to true.</td>
                </tr>
            </tbody>
        </table>

		<br />
		
        <span class="example-header">Example:</span>
        <span class="example-url">
        <a href="<?php echo $baseURL;?>?action=buildMovie&startDate=2010-03-01T12:12:12Z&imageScale=21.04&layers=3,1,100/4,1,100&offsetLeftTop=-5000,-5000&offsetRightBottom=5000,5000&width=512&height=512">
            <?php echo $baseURL;?>?action=buildMovie&startDate=2010-03-01T12:12:12Z&imageScale=21.04&layers=3,1,100/4,1,100&offsetLeftTop=-5000,-5000&offsetRightBottom=5000,5000&width=512&height=512
        </a>
        </span><br />
        <span class="example-url">
        <a href="<?php echo $baseURL;?>?action=buildMovie&startDate=2010-03-01T12:12:12Z&imageScale=21.04&layers=SOHO,EIT,EIT,304,1,100/SOHO,LASCO,C2,white-light,1,100&offsetLeftTop=-5000,-5000&offsetRightBottom=5000,5000&width=512&height=512">
            <?php echo $baseURL;?>?action=buildMovie&startDate=2010-03-01T12:12:12Z&imageScale=21.04&layers=SOHO,EIT,EIT,304,1,100/SOHO,LASCO,C2,white-light,1,100&offsetLeftTop=-5000,-5000&offsetRightBottom=5000,5000&width=512&height=512
        </a>
        </span></div>
        </div>

        <br />

</div>

    <!-- Appendices -->
    <div id="Appendices">
    <h1>7. Appendices:</h1>
    <p></p>
    <ol style="list-style-type: upper-latin;">
        <!-- Appendix A: Identifiers -->
        <li>
        <div id="Identifiers">Supported Identifiers <p>This appendice contains a list of the identifiers supported
        by Helioviewer. For some queries, complex identifiers may be built up from the simpler ones below. For example,
        to uniquely identify a specific type of image, you must specify a comma-separated set of four identifiers:
        Observatory, Instrument, Detector, and Measurement. For example, to refer to an EIT 171 image, the identifier
        <i>SOHO,EIT,EIT,171</i> is used.</p>

        <div class="summary-box" style="background-color: #E3EFFF;"><!-- Observatories -->
        <i>Observatories:</i><br />
        <br />
        <table class="param-list" cellspacing="10">
            <tr>
                <td width="140px"><strong>Identifier:</strong></td>
                <td><strong>Description:</strong></td>
            </tr>
            <tr>
                <td>SOHO</td>
                <td>SOHO (Solar and Heliospheric Observatory)</td>
            </tr>
            <tr>
                <td>TRACE</td>
                <td>TRACE (Transition Region and Coronal Explorer)</td>
            </tr>
        </table>

        <br />

        <!-- Instruments --> <i>Instruments:</i><br />
        <br />
        <table class="param-list" cellspacing="10">
            <tr>
                <td width="140px"><strong>Identifier:</strong></td>
                <td><strong>Description:</strong></td>
            </tr>
            <tr>
                <td>EIT</td>
                <td>EIT (Extreme ultraviolet Imaging Telescope)</td>
            </tr>
            <tr>
                <td>LASCO</td>
                <td>LASCO (Large Angle and Spectrometric Coronagraph Experiment)</td>
            </tr>
            <tr>
                <td>MDI</td>
                <td>MDI (The Michelson Doppler Imager)</td>
            </tr>
            <tr>
                <td>TRACE</td>
                <td>TRACE (Transition Region and Coronal Explorer)</td>
            </tr>
        </table>

        <br />

        <!-- Detectors --> <i>Detectors:</i><br />
        <br />
        <table class="param-list" cellspacing="10">
            <tr>
                <td width="140px"><strong>Identifier:</strong></td>
                <td><strong>Description:</strong></td>
            </tr>
            <tr>
                <td>C2</td>
                <td>LASCO C2</td>
            </tr>
            <tr>
                <td>C3</td>
                <td>LASCO C3</td>
            </tr>
            <tr>
                <td>EIT</td>
                <td>EIT (Extreme ultraviolet Imaging Telescope)</td>
            </tr>
            <tr>
                <td>MDI</td>
                <td>MDI (The Michelson Doppler Imager)</td>
            </tr>
        </table>

        <br />

        <!-- Measurements -->
        <i>Measurements:</i><br />
        <br />
        <table class="param-list" cellspacing="10">
            <tr>
                <td width="140px"><strong>Identifier:</strong></td>
                <td><strong>Description:</strong></td>
            </tr>
            <tr>
                <td>171</td>
                <td>171 Ångström</td>
            </tr>
            <tr>
                <td>195</td>
                <td>195 Ångström</td>
            </tr>
            <tr>
                <td>284</td>
                <td>284 Ångström</td>
            </tr>
            <tr>
                <td>304</td>
                <td>304 Ångström</td>
            </tr>
            <tr>
                <td>white-light</td>
                <td>White-light</td>
            </tr>
            <tr>
                <td>continuum</td>
                <td>Intensity spectrogram</td>
            </tr>
            <tr>
                <td>magnetogram</td>
                <td>Magnetogram</td>
            </tr>
        </table>

        <br />

        <!-- Event Types --> <i>Event Types:</i><br />
        <br />
        <table class="param-list cellspacing="10"">
            <tr>
                <td width="160px"><strong>Identifier:</strong></td>
                <td><strong>Description:</strong></td>
            </tr>
            <td>CME</td>
            <td>Coronal Mass Ejection</td>
            <tr></tr>
            <tr>
                <td>Solar Flare</td>
                <td>Solar Flare</td>
            </tr>
            <tr>
                <td>Type II Radio Burst</td>
                <td>Type II Radio Burst</td>
            </tr>
            <tr>
                <td>Active Region</td>
                <td>Active Region</td>
            </tr>
            <tr>
                <td>GeneralActivityReport</td>
                <td>SOHO General Activity Report</td>
            </tr>
        </table>
        </div>
        </div>
        </li>

        <br />

        <!-- Appendix B: Variable Types -->
        <li>
        <div id="VariableTypes">Variable Types
        <p>This appendice contains a list of some of the variable types
        used by the Helioviewer API's.</p>
        <div class="summary-box" style="background-color: #E3EFFF;"><!-- Observatories -->
        <br />
        <table class="param-list" cellspacing="10">
            <tbody valign="top">
                <tr>
                    <td width="25%"><strong>Type:</strong></td>
                    <td width="45%"><strong>Description:</strong></td>
                    <td><strong>Example:</strong></td>
                </tr>
                <tr>
                    <td>Integer</td>
                    <td>An integer.</td>
                    <td>12</td>
                </tr>
                <tr>
                    <td>Float</td>
                    <td>A floating point number.</td>
                    <td>2.63</td>
                </tr>
                <tr>
                    <td>String</td>
                    <td>A string.</td>
                    <td>SOHO</td>
                </tr>
                <tr>
                    <td>List</td>
                    <td>A comma-separated list of some other type, usually strings or integers</td>
                    <td>VSOService::noaa, GOESXRayService::GOESXRay</td>
                </tr>
                <tr>
                    <td>2d List</td>
                    <td>This is similar to a list except that each item of the list is a bracket-delineated list
                    itself.</td>
                    <td>[SOHO,EIT,EIT,171,1,100],[SOHO,LASCO,C2,white-light,0,100],[SOHO,MDI,MDI,continuum,1,50]</td>
                </tr>
                <tr>
                    <td>Unix Timestamp</td>
                    <td>The number of seconds since January 1, 1970, midnight UTC.
                    (see <a href="#variable-type-resources">[1]</a>)</td>
                    <td>1065512000 <span style="color: grey">// October 7th 2003, 7:33:20 UTC</span></td>
                </tr>
                <tr>
                    <td>ISO 8601 UTC Date</td>
                    <td>ISO 8601 is a widely supported standarized date format.
                    (See <a href="#variable-type-resources">[2]</a>, <a href="#variable-type-resources">[3]</a>)</td>
                    <td>2003-10-05T00:00:00Z <span style="color: grey">// Note the "Z" at the end. This specifies that
                    this is a UTC datetime</span></td>
                </tr>
            </tbody>
        </table>

        <br />
        <br />
        <div id="variable-type-resources"><strong>References:</strong><br />
        <br />
        [1] <a href="http://www.epochconverter.com/">Epoch Converter - Unix Timestamp Converter</a><br />
        [2] <a href="http://en.wikipedia.org/wiki/ISO_8601">ISO 8601 - Wikipedia</a><br />
        [3] <a href="http://www.w3.org/TR/NOTE-datetime">Date and Time Formats - W3.org</a><br />
        <br />
        </div>
        </div>
        </div>
        </li>
        <br />

        <!-- Appendix C: Pixel and Arcsecond Conversions -->
        <li>
        <div id="ArcsecondConversions">Pixel to Arcsecond Conversions
        <p>This appendix contains a list of JPEG2000 image scales for some layer types and how to convert 
        	between pixels on the image and arcseconds.</p>
        <div class="summary-box" style="background-color: #E3EFFF;">
        <br />
        <table class="param-list" cellspacing="10">
            <tbody valign="top">
                <tr>
                    <td width="50%"><strong>Layer Type:</strong></td>
                    <td width="50%"><strong>Scale (arcseconds/pixel)</strong></td>
                </tr>
                <tr>
                    <td>EIT (all measurements)</td>
                    <td>2.63</td>
                </tr>
                <tr>
                    <td>LASCO C2</td>
                    <td>11.9</td>
                </tr>
                <tr>
                    <td>LASCO C3</td>
                    <td>56</td>
                </tr>
                <tr>
                    <td>MDI (all measurements)</td>
                    <td>1.985707</td>
                </tr>
            </tbody>
        </table>
        <br />
        To convert between arseconds and pixels, you must know something about the dimensions of the original JPEG2000 image and
        the coordinates of the center of the sun. <br /><br />
        Center coordinates can be found in the FITS header of an image under CRPIX1 (x-offset) and 
        CRPIX2 (y-offset from the <i>bottom</i> of the image). Therefore the y-offset must be adjusted to reflect that the origin is in the top left
        corner instead of the bottom left corner (simply take newYOffset = ySize - yOffset).<br /><br />
        Most SOHO images are usually 1024x1024.<br />
        
        To find out the offset in arcseconds of the top left corner of an EIT image (Coordinates 0,0), we'll use some example numbers: <br /><br />
        width = height = 1024 px<br />
        xOffset = 514.660 px<br />
        yOffset = 1024 - 505.19 = 518.81 px<br /><br />
        
        First convert the top-left coordinates (0,0) into their offsets from the center of the sun (514.660,518.81) by subtracting the center coordinates
        from the top-left coordinates.<br />
        Top-left coordinates are now (-514.660, -518.81)<br /><br />
        
        Next use the scale listed above to convert these offsets to arcseconds: <br />
        -514.660 px * 2.63 arcsec/px <br />
        = -1353.5558 arcseconds from center on x-axis<br /><br />
        -518.81 px * 2.63 arcsec/px <br />
        = -1364.4703 arcseconds from center on y-axis<br /><br />
        
        Therefore your offsetLeftTop string would be "-1353.5558,-1364.4703".

        <br />
        <br />
        </div>
        </div>
        </li>

        <!-- TODO : Appendice D: Image Layers -->
    </ol>
</div>

</div>

<div style="font-size: 0.7em; text-align: center; margin-top: 20px;">
    Last Updated: 2010-06-14 | <a href="mailto:webmaster@helioviewer.org">Questions?</a>
</div>

</body>
</html>
<?php
}

/**
 * Loads the required module based on the action specified and run the
 * action.
 *
 * @param array $params API Request parameters
 *
 * @return bool Returns true if the action specified is valid and was
 *              successfully run.
 */
function loadModule($params)
{
    $valid_actions = array(
        "takeFullImageScreenshot" => "WebClient",
        "downloadFile"     => "WebClient",
        "getClosestImage"  => "WebClient",
        "getDataSources"   => "WebClient",
        "getScreenshot"    => "WebClient",
        "getJP2Header"     => "WebClient",
        "getTile"          => "WebClient",
        "launchJHV"        => "WebClient",
    	"takeScreenshot"   => "WebClient",
        "getEvents"        => "Events",
        "getEventCatalogs" => "Events",
        "getJP2Image"      => "JHelioviewer",
        "getJPX"           => "JHelioviewer",
    	"buildMovie"	   => "Movies",
    	"buildQuickMovie"  => "Movies"
    );

    include_once "src/Validation/InputValidator.php";

    try {
        if (!array_key_exists($params["action"], $valid_actions)) {
            $url = "http://" . $_SERVER["SERVER_NAME"] . $_SERVER["PHP_SELF"];
            throw new Exception(
                "Invalid action specified. See the <a href='$url'>" .
                "API Documentation</a> for a list of valid actions."
            );
        } else {
            $moduleName = $valid_actions[$params["action"]];
            $className  = "Module_" . $moduleName;

            include_once "src/Module/$moduleName.php";

            $module = new $className($params);
            $module->execute();
        }
    } catch (Exception $e) {
        printErrorMsg($e->getMessage());
    }

    return true;
}

/**
 * Display an error message to the API user
 *
 * @param string $msg Error message to display to the user
 *
 * @return void
 */
function printErrorMsg($msg)
{
    ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Helioviewer.org API - Error</title>
</head>
<body>
    <div style='width: 50%; margin-left: auto; margin-right: auto; margin-top: 250px;
                text-align: center; font-size: 14px;'>
    <img src='resources/images/about.png' alt='Helioviewer logo'></img><br>
    <b>Error:</b> <?php echo $msg;?><br>
    </div>
</body>
</html>
    <?php
    exit();
}

/**
 * Logs an error message to the log whose location is specified in Config.ini
 * 
 * @param string $msg The body of the error message to be logged.
 * @param bool   $url If true, the request URL will be included in the error message.
 * 
 * @return void 
 */
function logErrorMsg($msg, $url=false)
{
    $error = "(" . date("Y/m/d H:i:s") . ") $msg\n";
    if ($url) {
        $error .= "\t{$_SERVER['HTTP_HOST']}{$_SERVER['REQUEST_URI']}\n";
    }
    file_put_contents(HV_ERROR_LOG, $error, FILE_APPEND);
}

?>
