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
        // Default to the first known api if no server is specified
        if (!isset($this->_params['server'])) {
            $this->_params['server'] = 0;
        }
        
        $baseURL = constant("HV_TILE_SERVER_" . $this->_params['server']);

        // Tile locally
        if (HV_LOCAL_TILING_ENABLED && ($baseURL == 'api/index.php')) {
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
            $this->_createImageCacheDir($result['filepath']);

            $json = json_encode($result);
        } else {
            if (HV_DISTRIBUTED_TILING_ENABLED) {
                // Redirect request to remote server
                if ($baseURL != 'api/index.php') {
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
                if ($baseURL == 'api/index.php') {
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
        // PROFILE TEST (performance of re-querying jp2 dimensions, offset, etc?)
        include_once 'src/Database/ImgIndex.php';
        $imgIndex = new Database_ImgIndex();

        // Convert human-readable params to sourceId if needed
        if (!isset($this->_params['sourceId'])) {
            $this->_params['sourceId'] = $imgIndex->getSourceId(
                $this->_params['obs'], $this->_params['inst'],
                $this->_params['det'], $this->_params['meas']
            );
        }

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
     * launchJHelioviewer
     *
     * @return void
     */
    public function launchJHelioviewer ()
    {
        $args = array($this->_params['startTime'], $this->_params['endTime'], 
                      $this->_params['imageScale'], $this->_params['layers']);
     
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
                <argument>-jhv</argument>
                <argument><?php vprintf("[startTime=%s;endTime=%s;linked=true;imageScale=%f;imageLayers=%s]", $args);?></argument>
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
     * See the API webpage for example usage.
     * 
     * Parameters quality, filename, sharpen, edges, and display are optional parameters and can be left out completely.
     * 
     * Note that filename does NOT have the . extension on it. The reason for
     * this is that in the media settings pop-up dialog, there is no way of
     * knowing ahead of time whether the image is a .png, .tif, .flv, etc, and
     * in the case of movies, the file is both a .flv and .mov/.asf/.mp4
     *
     * @return image/jpeg or JSON
     */
    public function takeScreenshot()
    {
        include_once HV_ROOT_DIR . '/api/src/Image/Screenshot/HelioviewerScreenshotBuilder.php';
        
        $builder = new Image_Screenshot_HelioviewerScreenshotBuilder();
        $tmpDir  = HV_CACHE_DIR . "/screenshots";
        
        $response = $builder->takeScreenshot($this->_params, $tmpDir);
        if (!isset($this->_params['display']) || !$this->_params['display'] || $this->_params['display'] === "false") {
            echo str_replace(HV_ROOT_DIR, HV_WEB_ROOT_URL, $response);
        }
        return $response;
    }
    
    /**
     * Gets a screenshot from the cache or builds it if it doesn't exist, as specified by the event ID 
     * in the parameters.
     * See the API webpage for example usage.
     *
     * @return image
     */
    public function getScreenshotForEvent()
    {
        include_once HV_ROOT_DIR . '/api/src/Image/Screenshot/HelioviewerScreenshotBuilder.php';
        
        $builder = new Image_Screenshot_HelioviewerScreenshotBuilder();
        $tmpDir  = HV_CACHE_DIR . "/events/" . $this->_params['eventId'] . "/screenshots";
        $this->_createEventCacheDir($tmpDir);
        
        $response = $builder->getScreenshotForEvent($this->_params, $tmpDir);
            
        if ($response === false) {
            throw new Exception("The requested movie does not exist.");
        } else if (isset($this->_params['display']) && (!$this->_params['display'] || $this->_params['display'] === "false")) {
            echo str_replace(HV_ROOT_DIR, HV_WEB_ROOT_URL, $response);
        }

        return $response;
    }
    
    /**
     * Creates a screenshot based upon the eventId and the parameters specified.
     * See the API webpage for example usage.
     *
     * @return image
     */
    public function createScreenshotForEvent()
    {
        include_once HV_ROOT_DIR . '/api/src/Image/Screenshot/HelioviewerScreenshotBuilder.php';
        
        $builder = new Image_Screenshot_HelioviewerScreenshotBuilder();
        $tmpDir  = HV_CACHE_DIR . "/events/" . $this->_params['eventId'] . "/screenshots";
        $this->_createEventCacheDir($tmpDir);
        
        $response = $builder->createScreenshotForEvent($this->_params, $tmpDir);
        
        echo str_replace(HV_ROOT_DIR, HV_WEB_ROOT_URL, $response);
        return $response;
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
        case "launchJHelioviewer":
            $expected = array(
                'required' => array('startTime', 'endTime', 'imageScale', 'layers'),
                'floats'   => array('imageScale'),
                'dates'    => array('startTime', 'endTime'),
            );
            break;
        case "takeScreenshot":
            $required = array('obsDate', 'imageScale', 'layers', 'x1', 'x2', 'y1', 'y2');
            $expected = array(
                'required' => $required, 
                'floats'   => array('imageScale', 'x1', 'x2', 'y1', 'y2'),
                'dates'	   => array('obsDate'),
            );
            break;
        case "getScreenshotForEvent": 
            $expected = array(
                'required' => array('eventId')
            );
            break;
        case "createScreenshotForEvent":
            $required = array('eventId', 'obsDate', 'imageScale', 'layers', 'x1', 'x2', 'y1', 'y2');
            $expected = array(
                'required' => $required, 
                'floats'   => array('imageScale', 'x1', 'x2', 'y1', 'y2'),
                'dates'    => array('obsDate'),
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
     * @param string $filepath The filepath where the image is stored
     *
     * @return void
     *
     * Note: mkdir may not set permissions properly due to an issue with umask.
     *       (See http://www.webmasterworld.com/forum88/13215.htm)
     */
    private function _createImageCacheDir($filepath)
    {
        $cacheDir = HV_CACHE_DIR . $filepath;

        if (!file_exists($cacheDir)) {
            mkdir($cacheDir, 0777, true);
            chmod($cacheDir, 0777);
        }
    }
    
    /**
     * Creates the directory structure that will be used to store screenshots
     * based upon events. 
     *
     * @param string $cacheDir The path to cache/events/eventId
     */
    private function _createEventCacheDir($cacheDir) {
    	$ipodDir = $cacheDir . "/iPod";
        if (!file_exists($ipodDir)) {
            mkdir($ipodDir, 0777, true);
            chmod($ipodDir, 0777);        
        }

        $regular = $cacheDir . "/regular";
        if (!file_exists($regular)) {
            mkdir($regular, 0777, true);
            chmod($regular, 0777);        
        }
    }
    
    /**
     * Prints the WebClient module's documentation header
     * 
     * @return void
     */
    public static function printDocHeader()
    {
        ?>
            <li><a href="index.php#CustomView">Loading Custom Settings</a></li>
            <li>
                <a href="index.php#TilingAPI">Tiling</a>
                <ul>
                    <li><a href="index.php#getClosestImage">Finding an Image</a></li>
                    <li><a href="index.php#getTile">Creating a Tile</a></li>
                </ul>
            </li>
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
        $rootURL = substr($baseURL, 0, -13) . "index.php?";
        ?>
        <!-- Custom View API-->
        <div id="CustomView">
            <h1>Custom View API:</h1>
            <p>The custom view API enables the user to load a specific set of parameters into Helioviewer: "view," here, simply
            means a given set of observation parameters. This is useful for dynamically loading a specific view or observation
            into Helioviewer using a URL.</p>
        
            <div class="summary-box">
                <span style="text-decoration: underline;">Usage:</span>
                <br />
                <br />
                <?php echo $rootURL; ?>
                <br />
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
                <a href="<?php echo $rootURL;?>date=2003-10-05T00:00:00Z&amp;imageScale=2.63&amp;imageLayers=[SOHO,EIT,EIT,171,1,100],[SOHO,LASCO,C2,white-light,1,100]">
                   <?php echo $rootURL;?>date=2003-10-05T00:00:00Z&imageScale=2.63&imageLayers=[SOHO,EIT,EIT,171,1,100],[SOHO,LASCO,C2,white-light,1,100]
                </a>
                </span>
            </div>
        </div>

        <br />
        
        <!-- Tiling API -->
        <div id="TilingAPI">
            <h1>Tiling API:</h1>
            <p>Requesting a image tile in Helioviewer.org occurs in two steps. During the first step a request is made
               in order to find the nearest image to the specified time. Once an image has been found, the URI associated
               with the image can then be used in subsequent tile requests.</p>
        
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
                
                <br /><br />
                Supported Parameters:
                <br /><br />
        
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
                            <td><b>observatory</b></td>
                            <td><i>String</i></td>
                            <td><i>[Optional]</i> Observatory</td>
                        </tr>
                        <tr>
                            <td><b>instrument</b></td>
                            <td><i>String</i></td>
                            <td><i>[Optional]</i> Instrument</td>
                        </tr>
                        <tr>
                            <td><b>detector</b></td>
                            <td><i>String</i></td>
                            <td><i>[Optional]</i> Detector</td>
                        </tr>
                        <tr>
                            <td><b>measurement</b></td>
                            <td><i>String</i></td>
                            <td><i>[Optional]</i> Measurement</td>
                        </tr>
                        <tr>
                            <td><b>sourceId</b></td>
                            <td><i>Integer</i></td>
                            <td><i>[Optional]</i> The image data source identifier.</td>
                        </tr>
                    </tbody>
                </table>
                
                <br /><br />
                Result:
                <br /><br />
        
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
            
            <br />
            
            <!-- getTile API -->
            <li>
            <div id="getClosestImage">Creating a Tile:
            <p>Once you have determined the image for which you wish to retrieve a tile from using the above
               <a href="#getClosestImage" />getClosestImage</a> request, you are ready to begin requesting tiles
               for that image. Tiles are requesting by specifying the identifier for the image you wish to tile, in
               this case simply the filename of the image, the spatial scale that the tile should be generated at,..</p>
    
            <br />
    
    
            <div class="summary-box">
                <span style="text-decoration: underline;">Usage:</span>
                <br />
                <br />
                <a href="<?php echo $baseURL;?>?action=getTile">
                    <?php echo $baseURL;?>?action=getTile
                </a>
            </div>
    
            <br />
            </li>
            </ol>
        </div>
        <?php
    }
}
?>
