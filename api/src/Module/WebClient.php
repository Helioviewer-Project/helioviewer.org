<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Helioviewer WebClient Module class definition.
 *
 * PHP version 5
 *
 * @category Application
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once "interface.Module.php";

/**
 * Defines methods used by Helioviewer.org to interact with a JPEG 2000 archive.
 *
 * @category Application
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 *
 */
class Module_WebClient implements Module
{
    private $_params;

    /**
     * Constructor
     *
     * @param mixed &$params API Request parameters, including the action name.
     *
     * @return void
     */
    public function __construct(&$params)
    {
        $this->_params = $params;
    }

    /**
     * execute
     *
     * @return void
     */
    public function execute()
    {
        if ($this->validate()) {
            try {
                $this->{$this->_params['action']}();
            } catch (Exception $e) {
                // Output plain-text for browser requests to make Firebug debugging easier
                include_once "lib/FirePHPCore/fb.php";
                FB::error($e->getMessage());
                throw new Exception($e->getMessage());
            }
        }
    }


    /**
     * 'Opens' the requested file in the current window as an attachment,
     *  which pops up the "Save file as" dialog.
     *
     * @TODO test this to make sure it works in all browsers.
     *
     * @return void
     */
    public function downloadFile()
    {
        $url = $this->_params['url'];

        // Convert web url into directory url so stat() works.
        // Need to use stat() instead of filesize() because filesize fails
        // for every file on Linux due to security permissions with apache.
        // To get the file size, do $stat['size']
        $url = str_replace(HV_WEB_ROOT_URL, HV_ROOT_DIR, $url);
        $stat = stat($url);

        if (strlen($url) > 1) {
            header("Pragma: public");
            header("Expires: 0");
            header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
            header("Cache-Control: private", false); // required for certain browsers
            header("Content-Disposition: attachment; filename=\"" . basename($url) . "\";");
            header("Content-Transfer-Encoding: binary");

            header("Content-Length: " . $stat['size']);

            echo file_get_contents($url);
        } else {
            throw new Exception("Unable to find the specified requested file.");
        }
    }

    /**
     * http://localhost/hv/api/index.php?action=getClosestImage
     * &date=2003-10-05T00:00:00Z&source=0&server=api/index.php
     *
     * TODO 01/29/2010 Check to see if server number is within valid range of know authenticated servers.
     *
     * @return void
     */
    public function getClosestImage ()
    {
        // Default to localhost if no server is specified
        if (!isset($this->_params['server'])) {
            $this->_params['server'] = 0;
        }
     
        // Tile locally
        if (HV_LOCAL_TILING_ENABLED && ($this->_params['server'] == 0)) {
            include_once 'src/Database/ImgIndex.php';
            $imgIndex = new Database_ImgIndex();

            // Convert human-readable params to sourceId if needed
            if (!isset($this->_params['sourceId'])) {
                $this->_params['sourceId'] = $imgIndex->getSourceId(
                    $this->_params['observatory'], $this->_params['instrument'],
                    $this->_params['detector'], $this->_params['measurement']
                );
            }

            $result = $imgIndex->getClosestImage($this->_params['date'], $this->_params['sourceId']);

            // Prepare cache for tiles
            $this->_createImageCacheDir($this->_params['sourceId'], $result['date']);

            $json = json_encode($result);
        } else {
            if (HV_DISTRIBUTED_TILING_ENABLED) {
                // Redirect request to remote server
                if ($this->_params['server'] != 0) {
                    $baseURL = constant("HV_TILE_SERVER_" . $this->_params['server']);
                    $source  = $this->_params['sourceId'];
                    $date    = $this->_params['date'];
                    $url     = "$baseURL?action=getClosestImage&sourceId=$source&date=$date&server=0";
                    $json = file_get_contents($url);
                } else {
                    $msg = "Local tiling is disabled on server. See local_tiling_enabled is Config.Example.ini " .
                           "for more information";
                    throw new Exception($msg);
                }
            } else {
                if ($this->_params['server'] == 0) {
                    $err = "Both local and remote tiling is disabled on the server.";
                } else {
                    $err = "Remote tiling is disabled for this server.";
                }
                throw new Exception($err);
            }
        }
        header('Content-Type: application/json');
        echo $json;
    }

    /**
     * getDataSources
     *
     * @return JSON Returns a tree representing the available data sources
     */
    public function getDataSources ()
    {
        include_once 'src/Database/ImgIndex.php';

        $imgIndex = new Database_ImgIndex();
        $dataSources = json_encode($imgIndex->getDataSources());

        header('Content-type: application/json');

        print $dataSources;
    }

    /**
     * NOTE: Add option to specify XML vs. JSON... FITS vs. Entire header?
     *
     * @return void
     */
    public function getJP2Header ()
    {
        // Retrieve header locally
        if (HV_LOCAL_TILING_ENABLED && ($this->_params['server'] == 0)) {
            include_once 'src/Image/JPEG2000/JP2ImageXMLBox.php';
            $xmlBox = new Image_JPEG2000_JP2ImageXMLBox(HV_JP2_DIR . $this->_params["file"]);
            $xmlBox->printXMLBox();
        } else {
            if (HV_DISTRIBUTED_TILING_ENABLED) {
                // Redirect request to remote server
                if ($this->_params['server'] != 0) {
                    $baseURL = constant("HV_TILE_SERVER_" . $this->_params['server']);
                    $url     = "$baseURL?action=getJP2Header&file={$this->_params['file']}&server=0";
                    header('Content-type: text/xml');
                    echo file_get_contents($url);
                } else {
                    $msg = "Local tiling is disabled on server. See local_tiling_enabled is Config.Example.ini" .
                           "for more information";
                    throw new Exception($msg);
                }
            } else {
                $err = "Both local and remote tiling is disabled on the server.";
                throw new Exception($err);
            }
        }
    }

    /**
     * getTile
     *
     * @return void
     */
    public function getTile ()
    {
        include_once 'src/Image/Tiling/HelioviewerTile.php';
        $tile = new Image_Tiling_HelioviewerTile(
            $this->_params['uri'], $this->_params['date'], $this->_params['x'], $this->_params['y'],
            $this->_params['tileScale'], $this->_params['ts'],
            $this->_params['jp2Width'], $this->_params['jp2Height'],
            $this->_params['jp2Scale'], $this->_params['sunCenterOffsetX'],
            $this->_params['sunCenterOffsetY'], $this->_params['format'],
            $this->_params['obs'], $this->_params['inst'],
            $this->_params['det'], $this->_params['meas']
        );
    }

    /**
     * launchJHV
     *
     * @return void
     */
    public function launchJHV ()
    {
        header('content-type: application/x-java-jnlp-file');
        header('content-disposition: attachment; filename="JHelioviewer.jnlp"');
        echo '<?xml version="1.0" encoding="utf-8"?>' . "\n";

        ?>
        <jnlp spec="1.0+" codebase="http://achilles.nascom.nasa.gov/~dmueller/jhv/" href="JHelioviewer.jnlp">
            <information>
                <title>JHelioviewer</title>
                <vendor>ESA</vendor>
                <homepage href="index.html" />
                <description>JHelioviewer web launcher</description>
                <offline-allowed />
            </information>

            <resources>
                <j2se version="1.5+" max-heap-size="1000M"/>
                <jar href="JHelioviewer.jar" />
            </resources>

            <security>
                <all-permissions />
            </security>

            <application-desc main-class="org.helioviewer.JavaHelioViewer">
                <?php

        if ((isset($this->_params['files'])) && ($this->_params['files'] != "")) {
            echo "        <argument>$this->files</argument>\n";
        }
                ?>
            </application-desc>
        </jnlp>
    <?php
    }

    /**
     * sendEmail
     * TODO: CAPTCHA, Server-side security
     *
     * @return void
     */
    public function sendEmail()
    {
        // The message
        //$message = "Line 1\nLine 2\nLine 3";

        // In case any of our lines are larger than 70 characters, we should
        // use wordwrap()
        //$message = wordwrap($message, 70);

        // Send
        //mail('test@mail.com', 'My Subject', $message);
    }

    /**
     * Obtains layer information, ranges of pixels visible, and the date being
     * looked at and creates a composite image (a Screenshot) of all the layers.
     *
     * API example: http://localhost/helioviewer/api/index.php?action=takeScreenshot&width=512&height=512
     * &obsDate=2010-03-01T12:12:12Z&imageScale=10.52&layers=4,1,100/3,1,100/6,1,50/5,1,100
     * &offsetLeftTop=-5000,-5000&offsetRightBottom=5000,5000 
     * // Optional parameters can be added to the end: &quality=10&filename=example&sharpen=false&edges=false
     *
     * The first number in each layer is the source id of the image, the second number is whether the layer is visible,
     * the third number is the layer's opacity. 
     * 
     * Alternatively, you can send it this message, which uses observatory information instead of source ids: 
     * 
     * http://localhost/helioviewer/api/index.php?action=takeScreenshot&width=512&height=512
     * &obsDate=2010-03-01T12:12:12Z&imageScale=10.52&layers=SOHO,EIT,EIT,171,1,100/SOHO,LASCO,C2,white-light,1,100
     * &offsetLeftTop=-5000,-5000&offsetRightBottom=5000,5000
     * // Optional parameters: &quality=10&filename=example&sharpen=false&edges=false
     * 
     * Parameters quality, filename, sharpen, edges, and display are optional parameters and can be left out completely.
     * 
     * Note that filename does NOT have the . extension on it. The reason for
     * this is that in the media settings pop-up dialog, there is no way of
     * knowing ahead of time whether the image is a .png, .tif, .flv, etc, and
     * in the case of movies, the file is both a .flv and .mov/.asf/.mp4
     *
     * @return image/png or JSON
     */
    public function takeScreenshot()
    {
        include_once HV_ROOT_DIR . '/api/src/Image/Screenshot/HelioviewerScreenshotBuilder.php';
        
        $builder = new Image_Screenshot_HelioviewerScreenshotBuilder();
        return $builder->takeScreenshot($this->_params);
    }

    /**
     * getViewerImage (aka "getCompositeImage")
     *
     * Example usage: (outdated!)
     *     http://helioviewer.org/api/index.php?action=getViewerImage
     *         &layers=SOH_EIT_EIT_195&timestamps=1065312000&imageScale=2.63
     *         &tileSize=512&xRange=-1,0&yRange=-1,0
     *     http://helioviewer.org/api/index.php?action=getViewerImage
     *         &layers=SOH_EIT_EIT_195,SOH_LAS_0C2_0WL
     *         &timestamps=1065312000,1065312360&imageScale=5.26
     *         &tileSize=512&xRange=-1,0&yRange=-1,0&edges=false
     *
     * Notes:
     *     Building a UTC timestamp in javascript
     *         var d = new Date(Date.UTC(2003, 9, 5));
     *         var unix_ts = d.getTime() * 1000;
     *
     * TODO
     *     = If no params are passed, print out API usage description
     *       (and possibly a query builder form)...
     *     = Add support for fuzzy timestamp matching. Could default to exact
     *       matching unless user specifically requests fuzzy date-matching.
     *     = Separate out layer details into a Layer PHP class?
     *     = Update getViewerImage to use "layers" instead of "layers" + "timestamps"
     *
     * @return void
     */
    public function getViewerImage ()
    {
        include_once 'src/Image/CompositeImage.php';

        //Create and display composite image
        $img = Image_CompositeImage::compositeImageFromQuery($this->_params);
        $img->printImage();
    }

    /**
     * Handles input validation
     *
     * @return bool Returns true if the input is valid with respect to the
     *              requested action.
     */
    public function validate()
    {
        switch($this->_params['action']) {

        case "downloadFile":
            $expected = array(
               "required" => array('url'),
               "urls"     => array('url')
            );
            break;

        case "getClosestImage":
            $expected = array(
               "dates" => array('date')
            );

            if (isset($this->_params["sourceId"])) {
                $expected["required"] = array('date', 'sourceId');
                $expected["ints"]     = array('sourceId', 'server');
            } else {
                $expected["required"] = array('date', 'observatory', 'instrument', 'detector', 'measurement');
                $expected["ints"]     = array('server');
            }
            break;

        case "getDataSources":
            break;

        case "getTile":
            $required = array('uri', 'x', 'y', 'date', 'tileScale', 'ts', 'jp2Width','jp2Height', 'jp2Scale',
                              'sunCenterOffsetX', 'sunCenterOffsetY', 'format', 'obs', 'inst', 'det', 'meas');
            $expected = array(
               "required" => $required
            );
            break;

        case "getJP2Header":
            break;
        case "getViewerImage":
            break;
        case "takeScreenshot":
            $required = array('obsDate', 'imageScale', 'layers', 'x1', 'x2', 'y1', 'y2');
            $expected = array(
                'required' => $required, 
                'floats'   => array('imageScale', 'x1', 'x2', 'y1', 'y2'),
                'dates'	   => array('obsDate'),
            );
            break;
        default:
            break;
        }

        if (isset($expected)) {
            Validation_InputValidator::checkInput($expected, $this->_params);
        }

        return true;
    }

    /**
     * Creates the directory structure which will be used to cache
     * generated tiles.
     *
     * @param int    $sourceId The image source id
     * @param string $date     The image date
     *
     * @return void
     *
     * Note: mkdir may not set permissions properly due to an issue with umask.
     *       (See http://www.webmasterworld.com/forum88/13215.htm)
     */
    private function _createImageCacheDir($sourceId, $date)
    {
        // Base directory
        $filepath = HV_CACHE_DIR . "/";

        // Date information
        $year  = substr($date, 0, 4);
        $month = substr($date, 5, 2);
        $day   = substr($date, 8, 2);
       
        // Work-around 03/23/2010
        // Nicknames not currently included in filename or query. Hard-coding future
        // versions of JP2 images are modified to include nicknames
        if ($sourceId == 0) {
            $filepath .= "EIT/171";
        } else if ($sourceId == 1 ) {
            $filepath .= "EIT/195";
        } else if ($sourceId == 2 ) {
            $filepath .= "EIT/284";
        } else if ($sourceId == 3 ) {
            $filepath .= "EIT/304";
        } else if ($sourceId == 4 ) {
            $filepath .= "LASCO-C2/white-light";
        } else if ($sourceId == 5 ) {
            $filepath .= "LASCO-C3/white-light";
        } else if ($sourceId == 6 ) {
            $filepath .= "MDI/magnetogram";
        } else if ($sourceId == 7 ) {
            $filepath .= "MDI/continuum";
        } else if ($sourceId == 8) {
            $filepath .= "AIA/171";
        }
        
        $filepath .= "/$year/$month/$day/";

        if (!file_exists($filepath)) {
            mkdir($filepath, 0777, true);
            chmod($filepath, 0777);
        }
    }
    
    /**
     * Prints the WebClient module's documentation header
     */
    public static function printDocHeader() {
?>
    <li><a href="index.php#CustomView">Loading a Custom View</a></li>
    <li><a href="index.php#TilingAPI">Tiling API</a></li>
<?php
    }
    
    /**
     * printDoc
     *
     * @return void
     */
    public static function printDoc()
    {
        $baseURL = "http://" . $_SERVER['HTTP_HOST'] . $_SERVER['PHP_SELF'];
?>
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

<!-- Tiling API -->
<div id="TilingAPI">
    <h1>3. Tiling API:</h1>
    <p>Requesting a tile image in Helioviewer.org occurs in two steps. During the first step the user specifies the
    parameters of the image they are interested in tiling including the date, observatory, instrument, detector, 
    measurement. Alternatively, if the sourceId for the desired data source is already known that can be used
    in place of specifying the observatory, instrument, detector and measurement.</p>

    <br />

     <ol style="list-style-type: upper-latin;">
     
        <!-- Closest Image API -->
        <li>
        <div id="getClosestImage">Finding the Closest Image:
        <p>The result of this first request will include some basic information about the 
           nearest image match available. This information can then be used to make tile requests.</p>

        <br />


        <div class="summary-box">
            <span style="text-decoration: underline;">Usage:</span>
            <br />
            <br />
            <a href="<?php echo $baseURL;?>?action=getClosestImage">
                <?php echo $baseURL;?>?action=getClosestImage
            </a>
            
            Supported Parameters:<br />
            <br />
    
            <table class="param-list" cellspacing="10">
                <tbody valign="top">
                    <tr>
                        <td width="20%"><b>date</b></td>
                        <td width="25%"><i>ISO 8601 UTC Date</i></td>
                        <td width="55%">The desired image date</td>
                    </tr>
                    <tr>
                        <td><b>server</b></td>
                        <td><i>Integer</i></td>
                        <td><i>[Optional]</i> The server to query for a distributed Helioviewer architecture</td>
                    </tr>
                    <tr>
                        <td><b>sourceId</b></td>
                        <td><i>Integer</i></td>
                        <td><i>[Optional]</i> The image data source identifier.</td>
                    </tr>
                </tbody>
            </table>
            
            <br /><br />
    
            Result:<br />
            <br />
    
            <table class="param-list" cellspacing="10">
                <tbody valign="top">
                    <tr>
                        <td width="20%"><b>filename</b></td>
                        <td width="25%"><i>String</i></td>
                        <td width="55%">The filename of the matched image</td>
                    </tr>
                    <tr>
                        <td><b>filepath</b></td>
                        <td><i>String</i></td>
                        <td>The location of the matched image</td>
                    </tr>
                    <tr>
                        <td><b>date</b></td>
                        <td><i>Date String</i></td>
                        <td>The date of of the matched image</td>
                    </tr>
                    <tr>
                        <td><b>scale</b></td>
                        <td><i>Float</i></td>
                        <td>The image's native spatial scale, in arc-seconds/pixel</td>
                    </tr>
                    <tr>
                        <td><b>width</b></td>
                        <td><i>Integer</i></td>
                        <td>Image width</td>
                    </tr>
                    <tr>
                        <td><b>height</b></td>
                        <td><i>Integer</i></td>
                        <td>Image width</td>
                    </tr>
                    <tr>
                        <td><b>sunCenterX</b></td>
                        <td><i>Float</i></td>
                        <td>Distance from image left to the solar center, in pixels</td>
                    </tr>
                    <tr>
                        <td><b>sunCenterY</b></td>
                        <td><i>Float</i></td>
                        <td>Distance from image bottom to the solar center, in pixels</td>
                    </tr>
                </tbody>
            </table>
            
            <br />
    
            <span class="example-header">Examples:</span> <span class="example-url">
                <a href="<?php echo $baseURL;?>?action=getClosestImage&date=2010-06-24T00:00:00.000Z&sourceId=3">
                   <?php echo $baseURL;?>?action=getClosestImage&date=2010-06-24T00:00:00.000Z&sourceId=3
                </a>
                <br /><br />
                <a href="<?php echo $baseURL;?>?action=getClosestImage&date=2010-06-24T00:00:00.000Z&server=1&sourceId=3">
                   <?php echo $baseURL;?>?action=getClosestImage&date=2010-06-24T00:00:00.000Z&server=1&sourceId=3
                </a>
            </span>
            
        </div>

        <br />
        
        <!-- Closest Image API Notes -->
        <div class="summary-box" style="background-color: #E3EFFF;">
        <span style="text-decoration: underline;">Notes:</span>
        <br />
        <ul>
            <li>
            <p>At least one of the methods for specifying the image source, either a sourceId or the image 
            observatory, instrument, detector and measurement must be included in the request. </p>
            </li>
        </ul>
        </div>
        
        </li>
        
        <!-- getTile API -->
    </ol>
</div>
<?php
    }
}
?>
