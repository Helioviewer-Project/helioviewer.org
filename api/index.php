<?php
/**
 * TODO 01/28/2010
 *  = Document getDataSources, getJP2Header, and getClosestImage methods. 
 *  = Explain use of sourceId for faster querying.
 * 
 * TODO 01/27/2010
 *  = Unify error logging (create separate class)
 *  = Discuss with JHV team about using source ID's instead of string identifiers to speed up method calls.
 *  = Rename JHV Class so as not to confuse with the JHelioviewer module.
 *  = Add method to WebClient to print config file (e.g. for stand-alone web-client install to connect with)
 *  = Add getPlugins method to JHelioviewer module (empty function for now)
 *  = Have getJPX, etc. return file directly instead of a URL?
 *    (mimetypes: video/mj2, image/jpx. See http://www.rfc-editor.org/rfc/rfc3745.txt)
 */
require_once("Config.php");
$config = new Config("../settings/Config.ini");

if (isset($_REQUEST['action']))
    $params = $_REQUEST;
    
if (!(isset($params) && load_module($params))) {
    $baseURL = "http://" . $_SERVER['HTTP_HOST'] . $_SERVER['PHP_SELF'];
?>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
	<title>Helioviewer.org API</title>
	<link rel="shortcut icon" href="../favicon.ico">
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
	<meta http-equiv="Cache-Control" content="No-Cache">
	<meta name="author" content="Keith Hughitt">
	<meta name="description" content="Helioviewer - Solar and heliospheric image visualization tool">
	<meta name="keywords" content="Helioviewer, hv, solar image viewer, sun, solar, heliosphere,
                                      solar physics, viewer, visualization, space, astronomy, API">
	<link rel="stylesheet" type="text/css" href="styles/api.css" />
</head>

<body>

<!-- Logo -->
<img alt="Helioviewer Logo" src="images/about.png" style="float: left;">
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
	        <li><a href="index.php#getJP2ImageSeries"> Image Series API</a></li>
	        <li><a href="index.php#getJPX">JPX API</a></li>
	        <li><a href="index.php#getMJ2">MJ2 API</a></li>
	    </ul>
    </li>
    <li><a href="index.php#MovieAPI">Movie API</a></li>
    <li>
        <a href="index.php#Appendices">Appendices</a>
	    <ol style="list-style-type: upper-latin;">
	        <li><a href="index.php#Identifiers">Identifiers</a></li>
	        <li><a href="index.php#VariableTypes"> Variable Types </a></li>
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
    first query	and go straight to the second query. More on that later though.
    
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
	
		<table class="param-list">
		    <tbody valign="top">
		        <tr>
		            <td width="25%"><b>date</b></td>
		            <td width="35%"><i>ISO 8601 UTC Date</i></td>
		            <td>Date and time to display</td>
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
		            [OBSERVATORY,INSTRUMENT,DETECTOR,MEASUREMENT,VISIBLE,OPACITY].</td>
		        </tr>
		    </tbody>
		</table>
	
        <br />
	
        <span class="example-header">Example:</span> <span class="example-url">
        <a href="http://www.helioviewer.org/index.php?date=2003-10-05T00:00:00Z&amp;imageScale=2.63&amp;imageLayers=[SOHO,EIT,EIT,171,1,100],[SOHO,LASCO,C2,white light,1,100]">
           http://www.helioviewer.org/index.php?date=2003-10-05T00:00:00Z&imageScale=2.63&imageLayers=[SOHO,EIT,EIT,171,1,100],[SOHO,LASCO,C2,white light,1,100]
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
	site, as well as real-time generation of JPEG 2000 Image Series (JPX) and MJ2 Movies.</p>
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
	
	    <table class="param-list">
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
	                <td><b>source</b></td>
	                <td><i>Integer</i></td>
	                <td>[Optional] The image source ID (can be used in place of observatory, instrument, detector and
	                measurement parameters).</td>
	            </tr>
	            <tr>
	                <td><b>getURL</b></td>
	                <td><i>Boolean</i></td>
	                <td><span style="color: red;">[Deprecated]</span>
	                Returns a URL instead of an actual image. <i>(NOTE: If getJPIP=true is not set, the query will
	                return a file automatically.)</i></td>
	            </tr>
	            <tr>
	                <td><b>getJPIP</b></td>
	                <td><i>Boolean</i></td>
	                <td>[Optional] Returns a JPIP URI instead of an actual image.</td>
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
	    <a href="<?php echo $baseURL;?>?action=getJP2Image&amp;observatory=SOHO&amp;instrument=LASCO&amp;detector=C2&amp;measurement=white light&amp;date=2003-10-05T00:00:00Z&amp;getJPIP=true">
	    <?php echo $baseURL;?>?action=getJP2Image&observatory=SOHO&instrument=LASCO&detector=C2&measurement=white light&date=2003-10-05T00:00:00Z&getJPIP=true
	    </a>
	    </span>
	    </div>
	    </div>
	    </li>
	
	    <br />
	
	    <!-- JPEG 2000 Image-Series API -->
	    <li>
	    <div id="getJP2ImageSeries">Image Series API: <span style="color: red;">[Deprecated]</span>
	    <p>Returns either a Motion JPEG 2000 (MJ2) or JPEG 2000 Image Series (JPX) depending on the parameters
	    specified. The movie frames are chosen by matching the closest image available at each step of a
	    specified range of dates and image cadence.</p>
	
	    <br />
	
	    <div class="summary-box"><span
	        style="text-decoration: underline;">Usage:</span><br />
	    <br />
	
	    <?php echo $baseURL;?>?action=getJP2ImageSeries<br />
	    <br />
	
	    Supported Parameters:<br />
	    <br />
	
	    <table class="param-list">
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
	                <td>The desired amount of time between each movie-frame, in seconds</td>
	            </tr>
	            <tr>
	                <td><b>format</b></td>
	                <td><i>String</i></td>
	                <td>[MJ2|JPX] Whether a MJ2 movie or a JPX file should be returned</td>
	            </tr>
	            <tr>
	                <td><b>getJPIP</b></td>
	                <td><i>Boolean</i></td>
	                <td>[Optional] Returns a JPIP URI instead of an actual movie.</td>
	            </tr>
	            <tr>
	                <td><b>links</b></td>
	                <td><i>Boolean</i></td>
	                <td>[Optional] Returns a linked JPX file containing image pointers instead of data for each
	                individual frame in the series. Currently, only JPX image series support this feature.</td>
	            </tr>
	        </tbody>
	    </table>
	
	    <br />
	
	    <span class="example-header">Example:</span>
	    <span class="example-url">
	    <a href="<?php echo $baseURL;?>?action=getJP2ImageSeries&amp;observatory=SOHO&amp;instrument=EIT&amp;detector=EIT&amp;measurement=171&amp;startTime=2003-10-05T00:00:00Z&amp;endTime=2003-10-20T00:00:00Z&amp;cadence=3600&amp;format=JPX">
	    <?php echo $baseURL;?>?action=getJP2ImageSeries&observatory=SOHO&instrument=EIT&detector=EIT&measurement=171&startTime=2003-10-05T00:00:00Z&endTime=2003-10-20T00:00:00Z&cadence=3600&format=JPX
	    </a>
	    </span><br />
	    <span class="example-url">
	    <a href="<?php echo $baseURL;?>?action=getJP2ImageSeries&amp;observatory=SOHO&amp;instrument=MDI&amp;detector=MDI&amp;measurement=magnetogram&amp;startTime=2003-10-05T00:00:00Z&amp;endTime=2003-10-20T00:00:00Z&amp;cadence=3600&amp;format=JPX&amp;links=true&amp;getJPIP=true">
	    <?php echo $baseURL;?>?action=getJP2ImageSeries&observatory=SOHO&instrument=MDI&detector=MDI&measurement=magnetogram&startTime=2003-10-05T00:00:00Z&endTime=2003-10-20T00:00:00Z&cadence=3600&format=JPX&links=true&getJPIP=true
	    </a>
	    </span></div>
	    </div>
	
	    <br />
	
	    <!-- JPEG 2000 Image-Series API Notes -->
	    <div class="summary-box" style="background-color: #E3EFFF;">
	    <span style="text-decoration: underline;">Notes:</span>
	    
	    <br /><br />
	    
	    <ul>
	        <li>
	        <p>This method has been deprecated in favor of the simpler getJPX and getMJ2 methods.</p>
	        </li>
	        <li>
	        <p>During MJ2/JPX movie generation it is possible that for lower cadences some redundent image frames
	        will be used. In order to avoid this a sufficiently large cadence should be specified.</p>
	        </li>
	    </ul>
	    </div>
	    </li>
	
	    <br />
	
	    <!-- JPX API -->
	    <li>
	    <div id="getJPX">JPX API
	    <p>Returns a JPEG 2000 Image Series (JPX) file. The movie frames are chosen by matching the closest image
	    available at each step of a specified range of dates and image cadence.</p>
	
	    <br />
	
	    <div class="summary-box"><span style="text-decoration: underline;">Usage:</span><br />
	    
	    <br />
	
	    <?php echo $baseURL;?>?action=getJPX<br />
	    <br />
	
	    Supported Parameters:<br />
	    <br />
	
	    <table class="param-list">
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
	                <td>The desired amount of time between each movie-frame, in seconds</td>
	            </tr>
	            <tr>
	                <td><b>getJPIP</b></td>
	                <td><i>Boolean</i></td>
	                <td>[Optional] Returns a JPIP URI instead of an actual movie.</td>
	            </tr>
	            <tr>
	                <td><b>links</b></td>
	                <td><i>Boolean</i></td>
	                <td>[Optional] Returns a linked JPX file containing image pointers instead of data for each
	                individual frame in the series. Currently, only JPX image series support this feature.</td>
	            </tr>
	        </tbody>
	    </table>
	
	    <br />
	
	    <span class="example-header">Example:</span>
	    <span class="example-url">
	    <a href="<?php echo $baseURL;?>?action=getJPX&amp;observatory=SOHO&amp;instrument=EIT&amp;detector=EIT&amp;measurement=171&amp;startTime=2003-10-05T00:00:00Z&amp;endTime=2003-10-20T00:00:00Z&amp;cadence=3600">
	        <?php echo $baseURL;?>?action=getJPX&observatory=SOHO&instrument=EIT&detector=EIT&measurement=171&startTime=2003-10-05T00:00:00Z&endTime=2003-10-20T00:00:00Z&cadence=3600
	    </a>
	    </span><br />
	    <span class="example-url">
	    <a href="<?php echo $baseURL;?>?action=getJPX&amp;observatory=SOHO&amp;instrument=MDI&amp;detector=MDI&amp;measurement=magnetogram&amp;startTime=2003-10-05T00:00:00Z&amp;endTime=2003-10-20T00:00:00Z&amp;cadence=3600&amp;links=true&amp;getJPIP=true">
	        <?php echo $baseURL;?>?action=getJPX&observatory=SOHO&instrument=MDI&detector=MDI&measurement=magnetogram&startTime=2003-10-05T00:00:00Z&endTime=2003-10-20T00:00:00Z&cadence=3600&links=true&getJPIP=true
	    </a>
	    </span></div>
	    </div>
	
	    <br />
	
	    <!-- MJ2 API -->
	    <li>
	    <div id="getMJ2">JPX API
	    <p>Returns Motion JPEG 2000 (MJ2) Movie. The movie frames are chosen by matching the closest image available
	    at each step of a specified range of dates and image cadence.</p>
	
	    <br />
	
	    <div class="summary-box"><span
	        style="text-decoration: underline;">Usage:</span><br />
	    <br />
	
	    <?php echo $baseURL;?>?action=getMJ2<br />
	    <br />
	
	    Supported Parameters:<br />
	    <br />
	
	    <table class="param-list">
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
	                <td>The desired amount of time between each movie-frame, in seconds</td>
	            </tr>
	            <tr>
	                <td><b>getJPIP</b></td>
	                <td><i>Boolean</i></td>
	                <td>[Optional] Returns a JPIP URI instead of an actual movie.</td>
	            </tr>
	        </tbody>
	    </table>
	
	    <br />
	
	    <span class="example-header">Example:</span>
	    <span class="example-url">
	    <a href="<?php echo $baseURL;?>?action=getMJ2&amp;observatory=SOHO&amp;instrument=EIT&amp;detector=EIT&amp;measurement=171&amp;startTime=2003-10-05T00:00:00Z&amp;endTime=2003-10-20T00:00:00Z&amp;cadence=3600">
	        <?php echo $baseURL;?>?action=getMJ2&observatory=SOHO&instrument=EIT&detector=EIT&measurement=171&startTime=2003-10-05T00:00:00Z&endTime=2003-10-20T00:00:00Z&cadence=3600
	    </a>
	    </span><br />
	    <span class="example-url">
	    <a href="<?php echo $baseURL;?>?action=getMJ2&amp;observatory=SOHO&amp;instrument=MDI&amp;detector=MDI&amp;measurement=magnetogram&amp;startTime=2003-10-05T00:00:00Z&amp;endTime=2003-10-20T00:00:00Z&amp;cadence=3600&amp;getJPIP=true">
	        <?php echo $baseURL;?>?action=getMJ2&observatory=SOHO&instrument=MDI&detector=MDI&measurement=magnetogram&startTime=2003-10-05T00:00:00Z&endTime=2003-10-20T00:00:00Z&cadence=3600&getJPIP=true
	    </a>
	    </span></div>
	    </div>
	
	    <br />
	
	    </li>
	    </li>
	</ol>
</div>

<!-- Movie API -->
<div id="MovieAPI">
	<h1>6. Movie API:</h1>
	<p><i>Under Development...</i></p>
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
	    <table class="param-list">
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
	    <table class="param-list">
	        <tr>
	            <td width="140px"><strong>Identifier:</strong></td>
	            <td><strong>Description:</strong></td>
	        </tr>
	        <tr>
	            <td>EIT</td>
	            <td>EIT (Extreme ultraviolet Imaging Telescope)</td>
	        </tr>
	        <tr>
	            <td>LAS</td>
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
	    <table class="param-list">
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
	    <table class="param-list">
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
	            <td>white light</td>
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
	    <table class="param-list">
	        <tr>
	            <td width="140px"><strong>Identifier:</strong></td>
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
	    <i>Observatories:</i><br />
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
	                <td>VSOService::noaa,GOESXRayService::GOESXRay</td>
	            </tr>
	            <tr>
	                <td>2d List</td>
	                <td>This is similar to a list except that each item of the list is a bracket-delineated list
	                itself.</td>
	                <td>[SOHO,EIT,EIT,171,1,100],[SOHO,LASCO,C2,white light,0,100],[SOHO,MDI,MDI,continuum,1,50]</td>
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
	
	    <!-- TODO : Appendice C: Image Layers -->
	</ol>
</div>

</div>

<div style="font-size: 0.7em; text-align: center; margin-top: 20px;">
    Last Updated: 2010-02-01 | <a href="mailto:webmaster@helioviewer.org">Questions?</a>
</div>

</body>
</html>
<?php
}

/**
 * @param array $params API Request parameters
 * @return Boolean
 */
function load_module($params)
{
    $valid_actions = array(
        "downloadFile"     => "WebClient",
        "getClosestImage"  => "WebClient",
        "getDataSources"   => "WebClient",
        "getScreenshot"    => "WebClient",
        "getJP2Header"     => "WebClient",
        "getTile"          => "WebClient",
        "launchJHV"        => "WebClient",
        "getEvents"        => "Events",
        "getEventCatalogs" => "Events",
        "getJP2Image"      => "JHelioviewer",
        "getJPX"           => "JHelioviewer",
        "getMJ2"           => "JHelioviewer",
        "getJP2ImageSeries"=> "JHelioviewer"
    );
    
    if (!array_key_exists($params["action"], $valid_actions)) {
    	require_once("modules/Helper.php");
    	$url = "http://" . $_SERVER["SERVER_NAME"] . $_SERVER["PHP_SELF"];
    	Helper::printErrorMsg("Invalid action specified. See the <a href='$url'>" .
    	                      "API Documentation</a> for a list of valid actions.");
    }
    else {
    	$module = $valid_actions[$params["action"]];
    	require_once("modules/$module.php");
    	$obj = new $module($params);
    	return true;
    }
}
?>
