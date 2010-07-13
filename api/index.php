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
        "downloadFile"        => "WebClient",
        "getClosestImage"     => "WebClient",
        "getDataSources"      => "WebClient",
        "getScreenshot"       => "WebClient",
        "getJP2Header"        => "WebClient",
        "getTile"             => "WebClient",
        "takeScreenshot"      => "WebClient",
        "getEventFRMs"        => "SolarEvents",
        "getEvents"           => "SolarEvents",
        "getJP2Image"         => "JHelioviewer",
        "getJPX"              => "JHelioviewer",
        "launchJHelioviewer"  => "JHelioviewer",
        "buildMovie"          => "Movies",
        "playMovie"           => "Movies",
        "getMoviesForEvent"   => "Movies",
        "createMovieForEvent" => "Movies",
        "getScreenshotsForEvent"   => "WebClient",
        "createScreenshotForEvent" => "WebClient"
        
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
 * Prints Helioviewer API documentation for each enabled module
 * 
 * @return void
 */
function printAPIDocumentation()
{
    $baseURL = "http://" . $_SERVER['HTTP_HOST'] . $_SERVER['PHP_SELF'];
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
<?php
    foreach($modules as $moduleName) {
        call_user_func("Module_$moduleName" . '::printDoc');
    }
    printDocumentationAppendices();
?>
</div>

<div style="font-size: 0.7em; text-align: center; margin-top: 20px;">
    Last Updated: 2010-07-06 | <a href="mailto:webmaster@helioviewer.org">Questions?</a>
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
                    <td width="40%"><strong>Layer Type:</strong></td>
                    <td width="35%"><strong>Scale (arcsec/pixel)</strong></td>
                    <td><strong>Width (arcsec)</strong></td>
                </tr>
                <tr>
                    <td>EIT (all measurements)</td>
                    <td>2.63</td>
                    <td>2693.12</td>
                </tr>
                <tr>
                    <td>LASCO C2</td>
                    <td>11.9</td>
                    <td>12185.6</td>
                </tr>
                <tr>
                    <td>LASCO C3</td>
                    <td>56</td>
                    <td>57344</td>
                </tr>
                <tr>
                    <td>MDI (all measurements)</td>
                    <td>1.985707</td>
                    <td>2033.364</td>
                </tr>
            </tbody>
        </table>
        <br />
        To convert between arseconds and pixels, you must know something about the dimensions of the original JPEG2000 image and
        the coordinates of the center of the sun. <br /><br />
        Center coordinates can be found in the FITS header of an image under CRPIX1 (x-offset) and 
        CRPIX2 (y-offset from the <i>bottom</i> of the image). Therefore the y-offset must be adjusted to reflect that the origin is in the top left
        corner instead of the bottom left corner (simply take newYOffset = ySize - yOffset).<br /><br />
        Most SOHO images are 1024x1024 pixels.<br /><br />
        
        Let's say we want to find out the offset in arcseconds of the top left corner of an EIT image (Coordinates 0,0). We'll use some example numbers: <br /><br />
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
        
        Putting those together, the formula to find an offset for each coordinate is:<br />
        x = (xCoord - xOffset) * scale or<br />
        y = (yCoord - (imageHeight - yOffset)) * scale<br /><br />
        
        Therefore your x1 value is -1353.5558 and your y1 value is -1364.4703. This same formula can be used to find x2 and y2.

        <br />
        <br />
        </div>
        </div>
        </li>

        <!-- TODO : Appendice D: Image Layers -->
    </ol>
</div>
<?php 
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
