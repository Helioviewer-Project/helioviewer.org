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
    private $_options;

    /**
     * Constructor
     *
     * @param mixed &$params API Request parameters, including the action name.
     *
     * @return void
     */
    public function __construct(&$params)
    {
        $this->_params  = $params;
        $this->_options = array();
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
                handleError($e->getMessage(), $e->getCode());
            }
        }
    }


    /**
     * 'Opens' the requested file in the current window as an attachment,  which pops up the "Save file as" dialog.
     * 
     * @TODO test this to make sure it works in all browsers.
     *
     * @return void
     */
    public function downloadScreenshot()
    {
        include_once 'src/Database/ImgIndex.php';
        include_once 'src/Helper/HelioviewerLayers.php';
        
        $imgIndex = new Database_ImgIndex();
        
        $info = $imgIndex->getScreenshot($this->_params['id']);
        
        $layers = new Helper_HelioviewerLayers($info['dataSourceString']);
        
        $dir =  sprintf("%s/screenshots/%s/%s/", 
           HV_CACHE_DIR,
           str_replace("-", "/", substr($info['timestamp'], 0, 10)),
           $this->_params['id']   
        );
        
        $filename = sprintf("%s_%s.jpg",
            str_replace(array(":", "-", " "), "_", $info['observationDate']),
            $layers->toString()
        );

        $filepath = $dir . $filename;

        // Make sure file exists
        if (!file_exists($filepath)) {
            throw new Exception("Unable to locate the requested file: $filepath");
        }

        // Set HTTP headers
        header("Pragma: public");
        header("Expires: 0");
        header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
        header("Cache-Control: private", false); // required for certain browsers
        header("Content-Disposition: attachment; filename=\"" . $filename . "\"");
        header("Content-Transfer-Encoding: binary");
        header("Content-Length: " . filesize($filepath));

        // Mime type
//        $parts = explode(".", $filename);
//        $extension = end($parts);
//        
//        if (in_array($extension, array("jp2", "jpx"))) {
//            $mimetype = "image/$extension";
//        } else if (in_array($extension, array("ogg", "ogv", "webm"))) {
//            $mimetype = "video/$extension";
//        } else {        
//            $fileinfo = new finfo(FILEINFO_MIME);
//            $mimetype = $fileinfo->file($filepath);
//        }
        header("Content-type: image/png");

        echo file_get_contents($filepath);
    }

    /**
     * Finds the closest image available for a given time and datasource
     *
     * @return JSON meta information for matching image
     * 
     * TODO: Combine with getJP2Image? (e.g. "&display=true")
     */
    public function getClosestImage ()
    {
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
        $this->_createTileCacheDir($result['filepath']);

        header('Content-Type: application/json');
        echo json_encode($result);
    }

    /**
     * getDataSources
     *
     * @return JSON Returns a tree representing the available data sources
     */
    public function getDataSources ()
    {
        include_once 'src/Database/ImgIndex.php';

        $verbose = isset($this->_options['verbose']) ? $this->_options['verbose'] : false;

        $imgIndex    = new Database_ImgIndex();
        $dataSources = $imgIndex->getDataSources($verbose);

        header('Content-type: application/json;charset=UTF-8');
        print json_encode($dataSources);
    }

    /**
     * NOTE: Add option to specify XML vs. JSON... FITS vs. Entire header?
     *
     * @return void
     */
    public function getJP2Header ()
    {
        include_once 'src/Image/JPEG2000/JP2ImageXMLBox.php';
        $xmlBox = new Image_JPEG2000_JP2ImageXMLBox(HV_JP2_DIR . $this->_params["file"], "meta");
        $xmlBox->printXMLBox();
    }

    /**
     * Requests a single tile to be used in Helioviewer.org.
     * 
     * TODO 2011/04/19: How much longer would it take to request tiles if meta data was refetched
     * from database instead of being passed in?
     * 
     * @return object The image tile
     */
    public function getTile ()
    {
        include_once 'src/Image/JPEG2000/JP2Image.php';
        include_once 'src/Helper/RegionOfInterest.php';
        
        $params = $this->_params;
        
        // Tile filepath
        $filepath =  $this->_getTileCacheFilename(
            $params['uri'], $params['imageScale'], $params['x1'], $params['x2'], $params['y1'], $params['y2']
        );

        // Create directories in cache
        $this->_createTileCacheDir($params['uri']);
        
        // JP2 filepath
        $jp2Filepath = HV_JP2_DIR . $params['uri'];
        
        // Instantiate a JP2Image
        $jp2 = new Image_JPEG2000_JP2Image(
            $jp2Filepath, $this->_params['jp2Width'], $this->_params['jp2Height'], $this->_params['jp2Scale']
        );
        
        // Regon of interest
        $roi = new Helper_RegionOfInterest(
            $params['x1'], $params['x2'], $params['y1'], $params['y2'], $params['imageScale']
        );

        // Choose type of tile to create
        // TODO 2011/04/18: Generalize process of choosing class to use
        if ($params['instrument'] == "SECCHI") {
            if (substr($params['detector'], 0, 3) == "COR") {
                $type = "CORImage";
            } else {
                $type = strtoupper($params['detector']) . "Image";
            }
        } else {
            $type = strtoupper($params['instrument']) . "Image";
        }
        
        include_once "src/Image/ImageType/$type.php";

        $classname = "Image_ImageType_" . $type;

        // Create the tile
        $tile = new $classname(
            $jp2, $filepath, $roi, $params['observatory'], 
            $params['instrument'], $params['detector'], $params['measurement'],  
            $params['offsetX'], $params['offsetY'], $this->_options
        );
        
        return $tile->display();  
    }
    
    /**
     * Builds a filename for a cached tile or image based on boundaries and scale
     * 
     * @param string $uri   The uri of the original jp2 image
     * @param float  $scale The scale of the extracted image
     * @param float  $x1    The left boundary in arcseconds
     * @param float  $x2    The right boundary in arcseconds
     * @param float  $y1    The top boundary in arcseconds
     * @param float  $y2    The bottom boundary in arcseconds
     * 
     * @return string Filepath to use when locating or creating the tile
     */
    private function _getTileCacheFilename($uri, $scale, $x1, $x2, $y1, $y2)
    {
        $baseDirectory = HV_CACHE_DIR . "/tiles";
        $baseFilename  = substr(basename($uri), 0, -4);
        
        return sprintf(
            "%s%s/%s_%s_%d_%dx_%d_%dy.jpg",
            $baseDirectory, dirname($uri), $baseFilename, $scale, round($x1), round($x2), round($y1), round($y2)
        );
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
     * Parameters quality, filename, and display are optional parameters and can be left out completely.
     *
     * @return image/jpeg or JSON
     */
    public function takeScreenshot()
    {
        include_once 'src/Image/Composite/HelioviewerScreenshot.php';
        include_once 'src/Helper/HelioviewerLayers.php';
        include_once 'src/Helper/RegionOfInterest.php';
        
        // Data Layers
        $layers = new Helper_HelioviewerLayers($this->_params['layers']);
        
        // Regon of interest
        $roi = new Helper_RegionOfInterest(
            $this->_params['x1'], $this->_params['x2'], $this->_params['y1'], $this->_params['y2'], 
            $this->_params['imageScale']
        );
        
        // Create the screenshot
        $screenshot = new Image_Composite_HelioviewerScreenshot(
            $layers, $this->_params['date'], $roi, $this->_options
        );
        
        // Update usage stats
        if (HV_ENABLE_STATISTICS_COLLECTION) {
            include_once 'src/Database/Statistics.php';
            $statistics = new Database_Statistics();
            $statistics->log("takeScreenshot");
        }

        // Display screenshot
        if (isset($this->_options['display']) && $this->_options['display']) {
            $screenshot->display();
        } else {
            // Print JSON
            header('Content-Type: application/json');
            echo json_encode(array("id" => $screenshot->id));            
        }
    }
    
    /**
     * Retrieves a local or remote RSS/Atom news feed
     */
    public function getNewsFeed()
    {
        include_once 'src/Net/Proxy.php';
        $proxy = new Net_Proxy(HV_NEWS_FEED_URL);
        
        header("Content-Type: text/xml;charset=UTF-8");
        echo $proxy->query();
    }
    
    /**
     * Retrieves the latest usage statistics from the database
     */
    public function getUsageStatistics()
    {
        // Are usage stats enabled?
        if (!HV_ENABLE_STATISTICS_COLLECTION) {
            throw new Exception("Sorry, usage statistics are not collected for this site.");
        }
        
        // Determine resolution to use
        $validResolutions = array("hourly", "daily", "weekly", "monthly", "yearly");
        if (isset($this->_options['resolution'])) {
            // Make sure a valid resolution was specified
            if (!in_array($this->_options['resolution'], $validResolutions)) {
                $msg = "Invalid resolution specified. Valid options include hourly, daily, weekly, monthly, and yearly";
                throw new Exception($msg);                
            }
        } else {
            // Default to daily
            $this->_options['resolution'] = "daily";
        }
        
        include_once 'src/Database/Statistics.php';
        $statistics = new Database_Statistics();

        header('Content-Type: application/json');
        print $statistics->getUsageStatistics($this->_options['resolution']);
    }
    
    /**
     * Creates the directory structure which will be used to cache
     * generated tiles.
     * 
     * Note: mkdir may not set permissions properly due to an issue with umask.
     *       (See http://www.webmasterworld.com/forum88/13215.htm)

     *
     * @param string $filepath The filepath where the image is stored
     *
     * @return void
     */
    private function _createTileCacheDir($filepath)
    {
        $cacheDir = HV_CACHE_DIR . "/tiles" . dirname($filepath);

        if (!file_exists($cacheDir)) {
            mkdir($cacheDir, 0777, true);
        }
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

        case "downloadScreenshot":
            $expected = array(
               "required" => array('id'),
               "ints"     => array('id')
            );
            break;

        case "getClosestImage":
            $expected = array(
               "dates" => array('date')
            );

            if (isset($this->_params["sourceId"])) {
                $expected = array_merge(
                    $expected, array(
                    "required" => array('date', 'sourceId'),
                    "ints"     => array('sourceId'))
                );
            } else {
                $expected = array_merge(
                    $expected, array(
                    "required" => array('date', 'observatory', 'instrument', 'detector', 'measurement')
                    )
                );
            }
            break;

        case "getDataSources":
            $expected = array(
               "optional" => array('verbose'),
               "bools"    => array('verbose')
            );
            break;

        case "getTile":
            $required = array('uri', 'x1', 'x2', 'y1', 'y2', 'imageScale', 'jp2Width','jp2Height', 'jp2Scale',
                              'offsetX', 'offsetY', 'observatory', 'instrument', 'detector', 'measurement');
            $expected = array(
                "required" => $required,
                "floats"   => array('offsetX', 'offsetY', 'imageScale', 'jp2Scale', 'x1', 'x2', 'y1', 'y2'),
                "files"    => array('uri'),
                "ints"     => array('jp2Width', 'jp2Height')
            );
            break;

        case "getJP2Header":
            $expected = array(
                "required" => array('file'),
                "files"    => array('file')
            );
            break;
        case "getNewsFeed":
            break;
        case "getUsageStatistics":
            $expected = array(
                "optional" => array("resolution"),
                "alphanum" => array("resolution")
            );
            break;
        case "takeScreenshot":
            $expected = array(
                "required" => array('date', 'imageScale', 'layers', 'x1', 'x2', 'y1', 'y2'),
                "optional" => array('display', 'watermark'),
                "floats"   => array('imageScale', 'x1', 'x2', 'y1', 'y2'),
                "dates"	   => array('date'),
                "bools"    => array('display', 'watermark')
            );
            break;
        default:
            break;
        }

        if (isset($expected)) {
            Validation_InputValidator::checkInput($expected, $this->_params, $this->_options);
        }

        return true;
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
            <li><a href="index.php#takeScreenshot">Creating a Screenshot</a></li>
        <?php
    }
    
    /**
     * printDoc
     *
     * @return void
     */
    public static function printDoc()
    {
        $rootURL = substr(HV_API_ROOT_URL, 0, -13) . "index.php?";
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
                <a href="<?php echo $rootURL;?>date=2003-10-05T00:00:00Z&amp;imageScale=2.4&amp;imageLayers=[SDO,AIA,AIA,171,1,100],[SOHO,LASCO,C2,white-light,1,100]">
                   <?php echo $rootURL;?>date=2003-10-05T00:00:00Z&imageScale=2.4&imageLayers=[SDO,AIA,AIA,171,1,100],[SOHO,LASCO,C2,white-light,1,100]
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
                <a href="<?php echo HV_API_ROOT_URL;?>?action=getClosestImage">
                    <?php echo HV_API_ROOT_URL;?>?action=getClosestImage
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
                    <a href="<?php echo HV_API_ROOT_URL;?>?action=getClosestImage&date=2010-06-24T00:00:00.000Z&sourceId=3">
                       <?php echo HV_API_ROOT_URL;?>?action=getClosestImage&date=2010-06-24T00:00:00.000Z&sourceId=3
                    </a>
                    <br /><br />
                    <a href="<?php echo HV_API_ROOT_URL;?>?action=getClosestImage&date=2010-06-24T00:00:00.000Z&sourceId=3">
                       <?php echo HV_API_ROOT_URL;?>?action=getClosestImage&date=2010-06-24T00:00:00.000Z&sourceId=3
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
            <div id="getTile">Creating a Tile:
            <p>Once you have determined the image for which you wish to retrieve a tile from using the above
               <a href="#getClosestImage" />getClosestImage</a> request, you are ready to begin requesting tiles
               for that image. Tiles are requesting by specifying the identifier for the image you wish to tile, in
               this case simply the filename of the image, the spatial scale that the tile should be generated at,..</p>
    
            <br />
    
    
            <div class="summary-box">
                <span style="text-decoration: underline;">Usage:</span>
                <br />
                <br />
                <a href="<?php echo HV_API_ROOT_URL;?>?action=getTile">
                    <?php echo HV_API_ROOT_URL;?>?action=getTile
                </a>
                            
                <br /><br />
                Supported Parameters:
                <br /><br />
        
                <table class="param-list" cellspacing="10">
                    <tbody valign="top">
                        <tr>
                            <td width="20%"><b>uri</b></td>
                            <td width="25%"><i>String</i></td>
                            <td width="55%">The filepath to the JP2 image that will be tiled. The filepath is relative to the main JP2
                                directory, parts like /var/www/jp2 can be left out.</td>
                        </tr>
                        <tr>
                            <td><b>y1</b></td>
                            <td><i>Integer</i></td>
                            <td>The offset of the image's top boundary from the center of the sun, in arcseconds. This can be calculated, 
                                if necessary, with <a href="index.php#ArcsecondConversions" style="color:#3366FF">pixel-to-arcsecond conversion</a>.</td>
                        </tr>
                        <tr>
                            <td><b>x1</b></td>
                            <td><i>Integer</i></td>
                            <td>The offset of the image's left boundary from the center of the sun, in arcseconds. This can be calculated, 
                                if necessary, with <a href="index.php#ArcsecondConversions" style="color:#3366FF">pixel-to-arcsecond conversions</a>.</td>
                        </tr>
                        <tr>
                            <td><b>y2</b></td>
                            <td><i>Integer</i></td>
                            <td>The offset of the image's bottom boundary from the center of the sun, in arcseconds. This can be calculated, 
                                if necessary, with <a href="index.php#ArcsecondConversions" style="color:#3366FF">pixel-to-arcsecond conversion</a>.</td>
                        </tr>
                        <tr>
                            <td><b>x2</b></td>
                            <td><i>Integer</i></td>
                            <td>The offset of the image's right boundary from the center of the sun, in arcseconds. This can be calculated, 
                                if necessary, with <a href="index.php#ArcsecondConversions" style="color:#3366FF">pixel-to-arcsecond conversions</a>.</td>
                        </tr>
                        <tr>
                            <td><b>imageScale</b></td>
                            <td><i>Float</i></td>
                            <td>The scale of the image in the viewport, in arcseconds per pixel.</td>
                        </tr>
                        <tr>
                            <td><b>jp2Scale</b></td>
                            <td><i>Float</i></td>
                            <td>The native scale of the JP2 image in arcseconds per pixel.</td>
                        </tr>
                        <tr>
                            <td><b>jp2Height</b></td>
                            <td><i>Integer</i></td>
                            <td>The height of the JP2 image in pixels.</td>
                        </tr>
                        <tr>
                            <td><b>jp2Width</b></td>
                            <td><i>Integer</i></td>
                            <td>The width of the JP2 image in pixels.</td>
                        </tr>
                        <tr>
                            <td><b>observatory</b></td>
                            <td><i>String</i></td>
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
                            <td><b>offsetX</b></td>
                            <td><i>Float</i></td>
                            <td>The offset of the center of the sun from the center of the JP2 image in pixels
                                at the image's native resolution.</td>
                        </tr>
                        <tr>
                            <td><b>offsetY</b></td>
                            <td><i>Float</i></td>
                            <td>The offset of the center of the sun from the center of the JP2 image in pixels
                                at the image's native resolution.</td>
                        </tr>
                    </tbody>
                </table>   
                <br />
                <span class="example-header">Examples:</span> <span class="example-url">
                    <a href="<?php echo HV_API_ROOT_URL;?>?action=getTile&uri=/EIT/171/2010/06/02/2010_06_02__01_00_16_255__SOHO_EIT_EIT_171.jp2&x1=-2700.1158&x2=-6.995800000000215&y1=-19.2516&y2=2673.8684&date=2010-06-02+01:00:16&imageScale=4.8&size=512&jp2Width=1024&jp2Height=1024&jp2Scale=2.63&observatory=SOHO&instrument=EIT&detector=EIT&measurement=171&offsetX=2.66&offsetY=7.32">
                       <?php echo HV_API_ROOT_URL;?>?action=getTile&uri=/EIT/171/2010/06/02/2010_06_02__01_00_16_255__SOHO_EIT_EIT_171.jp2
                        &x1=-2700.1158&x2=-6.995800000000215&y1=-19.2516&y2=2673.8684&date=2010-06-02+01:00:16&imageScale=4.8
                        &size=512&jp2Width=1024&jp2Height=1024&jp2Scale=2.63&observatory=SOHO&instrument=EIT&detector=EIT&measurement=171
                        &offsetX=2.66&offsetY=7.32
                    </a>
                    <br /><br />
                </span>
            </li>
            </ol>
        </div>
        <!-- Screenshot API -->
        <div id="takeScreenshot">
            <h1>Screenshot API</h1>
            <p>Returns a single image containing all layers/image types requested. If an image is not available for the date requested the closest
            available image is returned.</p>
    
            <br />
    
            <div class="summary-box"><span
                style="text-decoration: underline;">Usage:</span><br />
            <br />
    
            <?php echo HV_API_ROOT_URL;?>?action=takeScreenshot<br />
            <br />
    
            Supported Parameters:<br />
            <br />
    
            <table class="param-list" cellspacing="10">
                <tbody valign="top">
                    <tr>
                        <td width="20%"><b>date</b></td>
                        <td><i>ISO 8601 UTC Date</i></td>
                        <td>Timestamp of the output image. The closest timestamp for each layer will be found if an exact match is not found.</td>
                    </tr>
                    <tr>
                        <td><b>imageScale</b></td>
                        <td><i>Float</i></td>
                        <td>The zoom scale of the image. Default scales that can be used are 0.6, 1.2, 2.4, and so on, increasing or decreasing by 
                            a factor of 2. The full-res scale of an AIA image is 0.6.</td>
                    </tr>
                    <tr>
                        <td><b>layers</b></td>
                        <td><i>String</i></td>
                        <td>A string of layer information in the following format:<br />
                            Each layer is comma-separated with these values: [<i>sourceId,visible,opacity</i>]. <br />
                            If you do not know the sourceId, you can 
                            alternately send this layer string: [<i>obs,inst,det,meas,opacity]</i>.
                            Layer strings are separated by commas: [layer1],[layer2],[layer3].</td>
                    </tr>
                    <tr>
                        <td><b>y1</b></td>
                        <td><i>Integer</i></td>
                        <td>The offset of the image's top boundary from the center of the sun, in arcseconds. This can be calculated, 
                            if necessary, with <a href="index.php#ArcsecondConversions" style="color:#3366FF">pixel-to-arcsecond conversion</a>.</td>
                    </tr>
                    <tr>
                        <td><b>x1</b></td>
                        <td><i>Integer</i></td>
                        <td>The offset of the image's left boundary from the center of the sun, in arcseconds. This can be calculated, 
                            if necessary, with <a href="index.php#ArcsecondConversions" style="color:#3366FF">pixel-to-arcsecond conversions</a>.</td>
                    </tr>
                    <tr>
                        <td><b>y2</b></td>
                        <td><i>Integer</i></td>
                        <td>The offset of the image's bottom boundary from the center of the sun, in arcseconds. This can be calculated, 
                            if necessary, with <a href="index.php#ArcsecondConversions" style="color:#3366FF">pixel-to-arcsecond conversion</a>.</td>
                    </tr>
                    <tr>
                        <td><b>x2</b></td>
                        <td><i>Integer</i></td>
                        <td>The offset of the image's right boundary from the center of the sun, in arcseconds. This can be calculated, 
                            if necessary, with <a href="index.php#ArcsecondConversions" style="color:#3366FF">pixel-to-arcsecond conversions</a>.</td>
                    </tr>
                    <tr>
                        <td><b>display</b></td>
                        <td><i>Boolean</i></td>
                        <td><i>[Optional]</i> If display is true, the screenshot will display on the page when it is ready. If display is false, the
                            filepath to the screenshot will be returned. If display is not specified, it will default to true.</td>
                    </tr>
                    <tr>
                        <td><b>watermark</b></td>
                        <td><i>Boolean</i></td>
                        <td><i>[Optional]</i> Enables turning watermarking on or off. If watermark is set to false, the image will not be watermarked.
                            If left blank, it defaults to true and images will be watermarked.</td>
                    </tr>
                </tbody>
            </table>
    
            <br />
    
            <span class="example-header">Examples:</span>
            <span class="example-url">
            <a href="<?php echo HV_API_ROOT_URL;?>?action=takeScreenshot&date=2010-03-01T12:12:12Z&imageScale=10.52&layers=[3,1,100],[4,1,100]&x1=-5000&y1=-5000&x2=5000&y2=5000">
            <?php echo HV_API_ROOT_URL;?>?action=takeScreenshot&date=2010-03-01T12:12:12Z&imageScale=10.52&layers=[3,1,100],[4,1,100]&x1=-5000&y1=-5000&x2=5000&y2=5000
            </a>
            </span><br />
            <span class="example-url">
            <a href="<?php echo HV_API_ROOT_URL;?>?action=takeScreenshot&date=2010-03-01T12:12:12Z&imageScale=10.52&layers=[SOHO,EIT,EIT,171,1,100],[SOHO,LASCO,C2,white-light,1,100]&x1=-5000&y1=-5000&x2=5000&y2=5000">
            <?php echo HV_API_ROOT_URL;?>?action=takeScreenshot&date=2010-03-01T12:12:12Z&imageScale=10.52&layers=[SOHO,EIT,EIT,171,1,100],[SOHO,LASCO,C2,white-light,1,100]&x1=-5000&y1=-5000&x2=5000&y2=5000
            </a>
            </span>
            </div>
            <br />
        </div>
        <?php
    }
}
?>
