<?php
/**
 * Helioviewer Web Server
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
 *  = Add method to WebClient to print config file (e.g. for stand-alone
 *    web-client install to connect with)
 *  = Add getPlugins method to JHelioviewer module (empty function for now)
 */
require_once "src/Config.php";
$config = new Config("../settings/Config.ini");
date_default_timezone_set('UTC');
register_shutdown_function('shutdownFunction');

if (isset($_REQUEST['action'])) {
    if ($_SERVER['REQUEST_METHOD'] == 'GET') {
        $params = $_GET;
    } else {
        $params = $_POST;
    }
}

if (!(isset($params) && loadModule($params))) {
    printAPIDocumentation();
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
        "downloadScreenshot"   => "WebClient",
        "getClosestImage"      => "WebClient",
        "getDataSources"       => "WebClient",
        "getJP2Header"         => "WebClient",
        "getNewsFeed"          => "WebClient",
        "getTile"              => "WebClient",
        "getUsageStatistics"   => "WebClient",
        "takeScreenshot"       => "WebClient",
        "getJP2Image"          => "JHelioviewer",
        "getJPX"               => "JHelioviewer",
        "launchJHelioviewer"   => "JHelioviewer",
        "buildMovie"           => "Movies",
        "downloadMovie"        => "Movies",
        "getMovieStatus"       => "Movies",
        "playMovie"            => "Movies",
        "queueMovie"           => "Movies",
        "uploadMovieToYouTube" => "Movies",
        "checkYouTubeAuth"     => "Movies",
        "getYouTubeAuth"       => "Movies",
        "getUserVideos"        => "Movies",
        "getEventFRMs"           => "SolarEvents",
        "getEvents"              => "SolarEvents",
        "getScreenshotsForEvent" => "SolarEvents",
        "getMoviesForEvent"      => "SolarEvents"
    );
    
    $helioqueuer_tasks = array ("queueMovie");
    
    include_once "src/Validation/InputValidator.php";

    try {
        if (!array_key_exists($params["action"], $valid_actions)) {
            $url = "http://" . $_SERVER["SERVER_NAME"] . $_SERVER["PHP_SELF"];
            throw new Exception(
                "Invalid action specified. See the <a href='$url'>" .
                "API Documentation</a> for a list of valid actions."
            );
        } else {
            // Remote requests
            if (isset($params['s'])) {
                // Forward request if neccessary
                // TODO 08/11/2010: Create separate method or extend Net_Proxy
                if (HV_DISTRIBUTED_MODE_ENABLED) {
                    $url = constant("HV_SERVER_" . $params['s']) . "?";
                    
                    unset ($params['s']);
                    foreach ($params as $key=>$value) {
                        $url .= "$key=$value&";
                    }
                    $url = trim($url, "&");
                    
                    // TODO 08/11/2010: Use Net_Proxy instead
                    echo file_get_contents($url);
                } else {
                    $err = "Distributed mode is disabled for this server.";
                    throw new Exception($err);
                }
                
            // Forward Helioqueuer tasks 
            } else if (HV_HELIOQUEUER_ENABLED && in_array($params["action"], $helioqueuer_tasks)) {
                $url = HV_HELIOQUEUER_API_URL . "/" . strtolower(preg_replace('/([A-Z])/', '/\1', $params['action']));
                unset ($params['action']);
                                
                // Set up handler to respond to warnings emitted by file_get_contents
                function catchWarning($errno, $errstr, $errfile, $errline, array $errcontext) {
                    throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
                }
                set_error_handler('catchWarning');
                
                include_once 'src/Net/Proxy.php';
                $proxy = new Net_Proxy($url . "?");
                
                if ($_SERVER['REQUEST_METHOD'] == "POST") {
                    $response = $proxy->post($params, true);    
                } else {
                    $response = $proxy->query($params, true);
                }
                
                header('Content-type: application/json;charset=UTF-8');
                
                // Make sure a response was recieved
                if ($response) {
                    echo $response;
                } else {
                    handleError("Helioqueuer is currently unresponsive");
                }
                
                // Restore normal behavior for dealing with warnings
                restore_error_handler();

            // Local requests
            } else {
            	// Execute action
                $moduleName = $valid_actions[$params["action"]];
                $className  = "Module_" . $moduleName;
    
                include_once "src/Module/$moduleName.php";
    
                $module = new $className($params);
                $module->execute();
                
                // Update usage stats
                $actions_to_keep_stats_for = array("getClosestImage", 
                    "getTile", "takeScreenshot", "getJPX",
                    "uploadMovieToYouTube");
                
				// Note that in addition to the above, buildMovie requests and 
				// getCachedTile requests are also tracked.
				// getCachedTile is a pseudo-action which is logged in 
				// addition to getTile when the tile was already in the cache.
                if (HV_ENABLE_STATISTICS_COLLECTION && in_array($params["action"], $actions_to_keep_stats_for)) {
                    include_once 'src/Database/Statistics.php';
                    $statistics = new Database_Statistics();
                    $statistics->log($params["action"]);
                }
            }

        }
    } catch (Exception $e) {
        printHTMLErrorMsg($e->getMessage());
    }

    return true;
}

/**
 * Prints Helioviewer API documentation for each enabled module
 * 
 * @return void
 */
function printAPIDocumentation()
{
    $modules = array("WebClient", "SolarEvents", "JHelioviewer", "Movies");
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
    <link rel="stylesheet" href="resources/css/api.css" />
</head>

<body>

<!-- Logo -->
<img alt="Helioviewer Logo" src="<?php echo HV_API_LOGO; ?>" style="float: left;">
<h1 style="position: relative; top: 22px;">API</h1>
<br />

<!-- Table of contents -->
<div class='toc'>
<ol>
    <li><a href="index.php#Overview">Overview</a></li>
<?php
    foreach($modules as $moduleName) {
        include_once "src/Module/$moduleName.php";
        call_user_func("Module_$moduleName" . '::printDocHeader');
    }
?>
    <li>
        <a href="index.php#Appendices">Appendices</a>
        <ol style="list-style-type: upper-latin;">
            <li><a href="index.php#Identifiers">Identifiers</a></li>
            <li><a href="index.php#VariableTypes"> Variable Types </a></li>
            <li><a href="index.php#Coordinates">Coordinates</a></li>
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
    
        <h1>Overview</h1>
        <p>In order to facilitate third-party application developers who wish to use content from and interact with
        Helioviewer.org, a number of <abbr title="Application Programming Interface">APIs</abbr> have been developed,
        offering  access to a variety of components used by Helioviewer. All of the interfaces are accessed using HTML query
        strings. The simplest APIs require only a single URI, and result in some resource being returned, e.g. a movie or
        <abbr title="JPEG 2000">JP2</abbr> image series, or some action being performed, e.g. loading a particular "view"
        into Helioviewer. Some of the API's are more complex and involve two steps. For example, in order to get a
        list of solar events for a certain period of time, first a query is usually made to see which Feature Recognition
        Methods (or FRMs) include events for that time period. A second query then returns a list of features/events are 
        fetched using a second query. 
        
        <br />
        <br />
    
        The general structure of queries is as follows:</p>
    
        <div class="summary-box">
            <?php echo HV_API_ROOT_URL;?>?action=methodName&amp;param1=value1&amp;param2=value2...
        </div>
    
        <p>The base URL is the same for each of the APIs (<a href="<?php echo HV_API_ROOT_URL;?>;"><?php echo HV_API_ROOT_URL;?></a>).
        The "action" parameter is required and specifies the specific functionality to access. In addition, other parameters
        may also be required depending on the specific API being accessed. The one exception to this rule is the
        <a href="index.php#CustomView">Custom View API</a> which is accessed from
        <a href="http://www.helioviewer.org/index.php"> http://www.helioviewer.org/index.php</a> and does not require an
        "action" to be specified. Finally, the queries may be sent using either a GET or POST request. In both cases the
        result is a <abbr name="JSON" title="JavaScript Object Notation">JSON</abbr> object
    
    </div>
<?php
    foreach($modules as $moduleName) {
        call_user_func("Module_$moduleName" . '::printDoc');
    }
    printDocumentationAppendices();
?>
</div>

<div style="font-size: 0.85em; text-align: center; margin-top: 20px;">
    Last Updated: 2011-06-20 | <a href="mailto:<?php echo HV_CONTACT_EMAIL; ?>">Questions?</a>
</div>

</body>
</html>
<?php
}

/**
 * Displays documentation appendices
 */
function printDocumentationAppendices()
{
?>
<!-- Appendices -->
    <div id="Appendices">
    <h1>Appendices:</h1>
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
                <td>SDO</td>
                <td>SDO (Solar Dynamics Observatory)</td>
            </tr>
            <tr>
                <td>SOHO</td>
                <td>SOHO (Solar and Heliospheric Observatory)</td>
            </tr>
            <tr>
                <td>STEREO_A</td>
                <td>STEREO_A (Solar Terrestrial Relations Observatory Ahead)</td>
            </tr>
            <tr>
                <td>STEREO_B</td>
                <td>STEREO_B (Solar Terrestrial Relations Observatory Behind)</td>
            </tr>
            <!--
            <tr>
                <td>TRACE</td>
                <td>TRACE (Transition Region and Coronal Explorer)</td>
            </tr>-->
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
                <td>AIA</td>
                <td>AIA (Atmospheric Imaging Assembly)</td>
            </tr>
            <tr>
                <td>EIT</td>
                <td>EIT (Extreme ultraviolet Imaging Telescope)</td>
            </tr>
            <tr>
                <td>HMI</td>
                <td>HMI (Helioseismic and Magnetic Imager)</td>
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
                <td>SECCHI</td>
                <td>SECCHI (Sun Earth Connection Coronal and Heliospheric Investigation)</td>
            </tr>
            <!--
            <tr>
                <td>TRACE</td>
                <td>TRACE (Transition Region and Coronal Explorer)</td>
            </tr>
             -->
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
                <td>AIA</td>
                <td>AIA (Atmospheric Imaging Assembly)</td>
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
                <td>COR1</td>
                <td>Coronagraph 1</td>
            </tr>
            <tr>
                <td>COR2</td>
                <td>Coronagraph 2</td>
            </tr>
            <tr>
                <td>EIT</td>
                <td>EIT (Extreme ultraviolet Imaging Telescope)</td>
            </tr>
            <tr>
                <td>EUVI</td>
                <td>EUVI (Extreme ultraviolet Imager)</td>
            </tr>
            <tr>
                <td>HMI</td>
                <td>HMI (Helioseismic and Magnetic Imager)</td>
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
                <td>94</td>
                <td>94 Ångström</td>
            </tr>
            <tr>
                <td>131</td>
                <td>131 Ångström</td>
            </tr>
            <tr>
                <td>171</td>
                <td>171 Ångström</td>
            </tr>
            <tr>
                <td>193</td>
                <td>193 Ångström</td>
            </tr>
            <tr>
                <td>195</td>
                <td>195 Ångström</td>
            </tr>
            <tr>
                <td>211</td>
                <td>211 Ångström</td>
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
                <td>335</td>
                <td>335 Ångström</td>
            </tr>
            <tr>
                <td>1600</td>
                <td>1600 Ångström</td>
            </tr>
            <tr>
                <td>1700</td>
                <td>1700 Ångström</td>
            </tr>
            <tr>
                <td>4500</td>
                <td>4500 Ångström</td>
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
                    <td>Boolean</td>
                    <td>A boolean value.</td>
                    <td>true</td>
                </tr>
                <tr>
                    <td>Integer</td>
                    <td>An integer.</td>
                    <td>12</td>
                </tr>
                <tr>
                    <td>Float</td>
                    <td>A floating point number.</td>
                    <td>2.4</td>
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

        <!-- Appendix C: Working with Coordinates -->
        <li>
        <div id="Coordinates">Working with Coordinates in Helioviewer.org
        <p>Several of the API methods supported by Helioviewer.org require you 
           to specify a region of interest (ROI) in <a href="http://en.wikipedia.org/wiki/Minute_of_arc#Symbols.2C_abbreviations_and_subdivisions">arcseconds</a>, 
           a unit of measurement commonly used by astronomers and solar scientists.
           This overview provides a brief overview of how Helioviewer.org handles coordinates,
           and the process for converting between pixel coordinates and arcseconds.</p>
           
       <p>Coordinates used in Helioviewer API requests should be given in 
          arcseconds from the center of the Sun. The below image depicts the 
          location of the origin, and the direction of the axes, for 
          co-ordinates used in a Helioviewer API request.</p>
        
        <div style='width: 100%; text-align: center;'>
            <img src='resources/images/Helioviewer_ROI_Overview.png' src='Helioviewer.org Coordinates Example Diagram' style='margin-left: auto; margin-right: auto;'/>
        </div>
        
        <p>When working with coordinates in Helioviewer.org, it is also important to understand the spatial scale
           of the images you are viewing and requesting. Each type of image (AIA, LASCO, etc) shows the Sun at
           some spatial scale or resolution. That is, each image pixel represents a certain number of arcseconds, 
           and that ratio of arcseconds to pixels is reffered to as the "imageScale" for that image. Each of the
           different image types have their own native image scale, which is the number of arcseconds a pixel of
           the image represents when viewed at its native resolution.
           
           Below is a table listing the average native image scales and dimensions (in pixels) for images found on Helioviewer:
        </p>
           
        <div class="summary-box" style="background-color: #E3EFFF;">
        <br />
        <table class="param-list" cellspacing="10">
            <tbody valign="top">
                <tr>
                    <td width="40%"><strong>Image Type:</strong></td>
                    <td width="35%"><strong>Dimensions (pixels)</strong></td>
                    <td width="35%"><strong>Image Scale (arcseconds/pixel)</strong></td>
                </tr>
                <tr>
                    <td>AIA</td>
                    <td>4096 x 4096</td>
                    <td>0.6</td>
                </tr>
                <tr>
                    <td>COR-1</td>
                    <td>512 x 512</td>
                    <td>15.0</td>
                </tr>
                <tr>
                    <td>COR-2</td>
                    <td>2048 x 2048</td>
                    <td>14.7</td>
                </tr>
                <tr>
                    <td>EIT</td>
                    <td>1024 x 1024</td>
                    <td>2.63</td>
                </tr>
                <tr>
                    <td>HMI</td>
                    <td>4096 x 4096</td>
                    <td>0.6</td>
                </tr>
                <tr>
                    <td>LASCO C2</td>
                    <td>1024 x 1024</td>
                    <td>11.9</td>
                </tr>
                <tr>
                    <td>LASCO C3</td>
                    <td>1024 x 1024</td>
                    <td>56</td>
                </tr>
                <tr>
                    <td>MDI</td>
                    <td>1024 x 1024</td>
                    <td>1.985707</td>
                </tr>
            </tbody>
        </table>

        <br />
        <strong>Note:</strong> The values listed above are average values. Often, the image scale and dimensions for a given
        type of image tends to stay the same over time, and as such you can often use the above values as-is. Occasionally, however,
        the scale or dimensions will vary. If you find that you are getting unexpected results, or would like a higher level of
        precision, you should first use the getClosestImage method to determine the exact dimensions and scale for the image you are
        requesting.
        </div>

        <p>The smaller the (native) image scale is, the more detail you can see. 
           For example, AIA has a much smaller native image scale (0.6"/px) than
           EIT does (2.63"/px) which is why you can see a lot more detail in AIA
           images.
        </p>
           
        <p>You are not limited to creating screenshots and movies at an image's native
           resolution, however, and so in an API request the imageScale specified
           need not (and in the case of composite images, often cannot) be the same
           as an images native resolution.
        </p>
           
        <p>For example, suppose you wanted to request an AIA image that is "zoomed out"
           by a factor of two. In this case, you would double the imageScale, so instead
           of 0.6, you would request an image scale of 1.2. Simiarly, when making a request
           which includes multiple layers, each of the layers will be scaled to match the
           imageScale you requested.
        </p>
         
        <p>To makes things more clear, below are some example requests, and the imageScale and ROI corresponding with that request.</p>
        
        <div class="summary-box" style="background-color: #E3EFFF;">
        <br />
        <span style='text-decoration: underline'>Examples:</span><br /><br />
        
        <b>1) A complete AIA image at 1/4 its natural resolution</b>
        
        <p>In this case the desired image scale is 4 x (natural scale) = 4 x 0.6 = 2.4. Now to determine the ROI coordinates,
           we must first determine how large the image will be at the specified scale. AIA is normally 4096x4096, so at 1/4 its
           natural resolution it will be 1024x1024 pixels. Since the origin is in the middle of the Sun (which here is in the middle
           of the Sun), there top-left corner is 512 pixels up and to the left (-512, -512), and the bottom-right corner is 512 pixels down and
           to the right (512, 512). Since the ROI must be specified in arcseconds, and not in pixels, we multiply by the desired imageScale:
           512 x 2.4 = 1228.8.
           <br /><br />
           <i>Example Request:</i><a href="http://helioviewer.org/api/?action=takeScreenshot&date=2011-06-21T00:00:00.000Z&layers=[SDO,AIA,AIA,304,1,100]&imageScale=2.4&x1=-1228.8&y1=-1228.8&x2=1228.8&y2=1228.8&display=true">
               http://helioviewer.org/api/?action=takeScreenshot&date=2011-06-21T00:00:00.000Z&layers=[SDO,AIA,AIA,304,1,100]&imageScale=2.4&x1=-1228.8&y1=-1228.8&x2=1228.8&y2=1228.8&display=true
           </a>
           
        <br /><br />
        <b>2) The top-right quadrant of an EIT image at 200% magnification</b>
        
        <p>First, determine the desired image scale = 1/2 x (EIT native image scale) = 1/2 x 2.63 = 1.315. At this scale, the image which
           would normally be 1024x1024 pixels is now 2048x2048 pixels, and the coordinates for the ROI in pixels would is (0,-1024), (1024,0). To convert
           to arcseconds we multiple the pixel values by the arcsecond/pixel ratio (the imageScale) to get (0, -1346.56), (1346.56, 0).

           <br /><br />
           <i>Example Request:</i><a href="http://helioviewer.org/api/?action=takeScreenshot&date=2011-06-21T00:00:00.000Z&layers=[SOHO,EIT,EIT,171,1,100]&imageScale=1.315&x1=0&y1=-1346.56&x2=1346.56&y2=0&display=true">
               http://helioviewer.org/api/?action=takeScreenshot&date=2011-06-21T00:00:00.000Z&layers=[SOHO,EIT,EIT,171,1,100]&imageScale=1.315&x1=0&y1=-1346.56&x2=1346.56&y2=0&display=true
           </a>
        </p>
        </div>
        
        <p>Finally, don't forget that you can use Helioviewer.org to check the 
           coordinates and see if they are as you expect. Pressing the "m" key 
           will return the position of the mouse pointer in Helioviewer.org 
           viewport. Initially, the coordinates will be displayed in 
           arcseconds. Note, however, that the y-axis value displayed for 
           mouse-coordinates has the opposite sign to that passed in API 
           requests. This is because the mouse position is returned in a 
           coordinate system which is commonly used in solar physics. To get 
           around this you can simply flip the sign for the y-coordinate you 
           see on Helioviewer.org when mouse-coordinates are being displayed.
        </p>         
         
        </div>
        </li>

        <!-- TODO : Appendice D: Image Layers -->
    </ol>
</div>
<?php 
}

/**
 * Displays a human-readable HTML error message to the user
 *
 * @param string $msg Error message to display to the user
 *
 * @return void
 */
function printHTMLErrorMsg($msg)
{
    ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <?php
        $meta = "<!-- DATE: %s URL: http://%s%s -->\n";
        printf($meta, strftime('%Y-%m-%d %H:%m:%S'), $_SERVER['HTTP_HOST'], $_SERVER['REQUEST_URI']);
    ?>
    <title>Helioviewer.org API - Error</title>
</head>
<body>
    <div style='width: 50%; margin-left: auto; margin-right: auto; margin-top: 250px;
                text-align: center; font-size: 14px;'>
    <img src='<?php echo HV_API_LOGO; ?>' alt='Helioviewer logo'></img><br>
    <b>Error:</b> <?php echo $msg;?><br>
    </div>
</body>
</html>
    <?php
    exit();
}

/**
 * Handles errors encountered during request processing.
 * 
 * @param string $msg     The error message to display
 * @param bool   $skipLog If true no log file will be created
 * 
 * Note: If multiple levels of verbosity are needed, one option would be to split up the complete error message
 *       into it's separate parts, add a "details" field with the full message, and display only the top-level
 *       error message in "error" 
 * 
 * @see http://www.firephp.org/
 */
function handleError($msg, $skipLog=false)
{
    header('Content-type: application/json;charset=UTF-8');
    
    // JSON
    echo json_encode(array("error"=>$msg));

    // Fire PHP
    include_once "lib/FirePHPCore/fb.php";
    FB::error($msg);
    
    // For errors which are expected (e.g. a movie request for which sufficient data is not available) a non-zero
    // exception code can be set to a non-zero value indicating that the error is known and no log should be created.
    if (!$skipLog) {
        logErrorMsg($msg);
    }
}

/**
 * Logs an error message to the log whose location is specified in Config.ini
 * 
 * @param string $error The body of the error message to be logged.
 * 
 * @return void 
 */
function logErrorMsg($error)
{
    $url = $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
    $log = HV_LOG_DIR . "/" . date("Ymd_His") . ".log";
    
    $template = "====[DATE]====================\n\n%s\n\n====[URL]=====================\n\n%s\n\n"
              . "====[MESSAGE]=================\n\n%s";
    
    $msg = sprintf($template, date("Y/m/d H:i:s"), $url, $error);
    
    if (!empty($_POST)) {
        $msg .= "\n\n====[POST]=================\n\n";
        foreach ($_POST as $key => $value) {
           $msg .= "'$key' => $value\n";
        }
        $msg .= "\n$url?" . http_build_query($_POST);
    }

    file_put_contents($log, $msg);
}

/**
 * Shutdown function used to catch and log fatal PHP errors
 */
function shutDownFunction() { 
    $error = error_get_last();
    if ($error['type'] == 1) {
        handleError(sprintf("%s:%d - %s", $error['file'], $error['line'], $error['message']));
    } 
}
?>
