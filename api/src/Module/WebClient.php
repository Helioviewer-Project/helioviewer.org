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
        
        $dir = sprintf("%s/screenshots/%s/%s/", 
           HV_CACHE_DIR,
           str_replace("-", "/", substr($info['timestamp'], 0, 10)),
           $this->_params['id']   
        );
        
        $filename = sprintf("%s_%s.png",
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

        $image = $imgIndex->getImageFromDatabase($this->_params['date'], $this->_params['sourceId']);
        
        // Read JPEG 2000 header
        $file = HV_JP2_DIR . $image["filepath"] . "/" .$image["filename"];
        $xmlBox = $imgIndex->extractJP2MetaInfo($file);

        // Prepare cache for tiles
        $this->_createTileCacheDir($image['filepath']);
        
        // Return date and id
        $response = array_merge(array(
            "id"   => $image['id'],
            "date" => $image['date']
        ), $xmlBox);
        
        // Print result
        $this->_printJSON(json_encode($response));
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
        
        // Print result
        $this->_printJSON(json_encode($dataSources), false, true);
    }

    /**
     * NOTE: Add option to specify XML vs. JSON... FITS vs. Entire header?
     *
     * @return void
     */
    public function getJP2Header ()
    {
        include_once 'src/Database/ImgIndex.php';
        include_once 'src/Image/JPEG2000/JP2ImageXMLBox.php';

        $imgIndex = new Database_ImgIndex();
        $image = $imgIndex->getImageInformation($this->_params['id']);
        
        $filepath = HV_JP2_DIR . $image['filepath'] . "/" . $image['filename'];

        $xmlBox = new Image_JPEG2000_JP2ImageXMLBox($filepath, "meta");
        
        if(isset($this->_params['callback'])) {
            $this->_printJSON($xmlBox->getXMLString(), true);
        } else {
            $xmlBox->printXMLBox();    
        }
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
        include_once 'src/Database/ImgIndex.php';
        include_once 'src/Image/JPEG2000/JP2Image.php';
        include_once 'src/Helper/RegionOfInterest.php';
        
        // Tilesize
        $tileSize = 512;

        $params = $this->_params;
        
        // Look up image properties
        $imgIndex = new Database_ImgIndex();
        $image = $imgIndex->getImageInformation($this->_params['id']);

        // Tile filepath
        $filepath =  $this->_getTileCacheFilename(
            $image['filepath'], $image['filename'], $params['imageScale'], $params['x'], $params['y']
        );

        // Create directories in cache
        $this->_createTileCacheDir($image['filepath']);
        
        // JP2 filepath
        $jp2Filepath = HV_JP2_DIR . $image['filepath'] . "/" . $image['filename'];
        
        // Sun center offset at the original image scale
        $offsetX =   $image['sunCenterX'] - ($image['width'] / 2);
        $offsetY = -($image['sunCenterY'] - ($image['height'] / 2));

        // Instantiate a JP2Image
        $jp2 = new Image_JPEG2000_JP2Image(
            $jp2Filepath, $image['width'], $image['height'], $image['scale']
        );

        // Region of interest
        $roi = $this->_tileCoordinatesToROI($params['x'], $params['y'], $params['imageScale'], $image['scale'], $tileSize, $offsetX, $offsetY);

        // Choose type of tile to create
        // TODO 2011/04/18: Generalize process of choosing class to use
        if ($image['instrument'] == "SECCHI") {
            if (substr($image['detector'], 0, 3) == "COR") {
                $type = "CORImage";
                } else {
                $type = strtoupper($image['detector']) . "Image";
            }
        } else {
            $type = strtoupper($image['instrument']) . "Image";
        }
        
        include_once "src/Image/ImageType/$type.php";
        $classname = "Image_ImageType_" . $type;

        // Create the tile
        $tile = new $classname(
            $jp2, $filepath, $roi, $image['observatory'], 
            $image['instrument'], $image['detector'], $image['measurement'],  
            $offsetX, $offsetY, $this->_options
        );
        
        $tile->display();
        
        // Log cached tile request now and exit to avoid double-counting
        if (HV_ENABLE_STATISTICS_COLLECTION && file_exists($filepath)) {
            include_once 'src/Database/Statistics.php';
            $statistics = new Database_Statistics();
            $statistics->log("getCachedTile");
            exit(0);
        }
    }

    /**
     * Converts from tile coordinates to physical coordinates in arcseconds
     * and uses those coordinates to return an ROI object
     * 
     * @return Helper_RegionOfInterest Tile ROI
     */
    private function _tileCoordinatesToROI (
        $x, $y, $scale, $jp2Scale, $tileSize, $offsetX, $offsetY
    ) {
        $relativeTileSize = $tileSize * ($scale / $jp2Scale);
        
        // Convert tile coordinates to arcseconds
        $top  = $y * $relativeTileSize - $offsetY;
        $left = $x * $relativeTileSize - $offsetX;
        $bottom = $top  + $relativeTileSize;
        $right  = $left + $relativeTileSize;
        
        // Scale coordinates
        $top  = $top * $jp2Scale;
        $left = $left * $jp2Scale;
        $bottom = $bottom * $jp2Scale;
        $right  = $right  * $jp2Scale;        
        
        // Regon of interest
        return new Helper_RegionOfInterest($left, $top, $right, $bottom, $scale);
    }
    
    /**
     * Builds a filename for a cached tile or image based on boundaries and scale
     * 
     * @param string $directory The directory containing the image
     * @param float  $filename  The filename of the image
     * @param float  $x         Tile X-coordinate
     * @param float  $y         Tile Y-coordinate
     * 
     * @return string Filepath to use when locating or creating the tile
     */
    private function _getTileCacheFilename($directory, $filename, $scale, $x, $y)
    {
        $baseDirectory = HV_CACHE_DIR . "/tiles";
        $baseFilename  = substr($filename, 0, -4);
        
        return sprintf(
            "%s%s/%s_%s_x%d_y%d.jpg",
            $baseDirectory, $directory, $baseFilename, $scale, $x, $y
        );
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
        
        // Region of interest: x1, x2, y1, y2
        if (isset($this->_options['x1']) && isset($this->_options['y1']) && 
            isset($this->_options['x2']) && isset($this->_options['y2'])) {

            $x1 = $this->_options['x1'];
            $y1 = $this->_options['y1'];
            $x2 = $this->_options['x2'];
            $y2 = $this->_options['y2'];
        } else if (isset($this->_options['x0']) && isset($this->_options['y0']) && 
                   isset($this->_options['width']) && isset($this->_options['height'])) {

            // Region of interest: x0, y0, width, height
            $x1 = $this->_options['x0'] - 0.5 * $this->_options['width']  * $this->_params['imageScale'];
            $y1 = $this->_options['y0'] - 0.5 * $this->_options['height'] * $this->_params['imageScale'];
            $x2 = $this->_options['x0'] + 0.5 * $this->_options['width']  * $this->_params['imageScale'];
            $y2 = $this->_options['y0'] + 0.5 * $this->_options['height'] * $this->_params['imageScale'];
        } else {
            throw new Exception("Region of interest not specified: you must specify values for " . 
                                "imageScale and either x1, x2, y1, and y2 or x0, y0, width and height.");
        }
        
        // Create RegionOfInterest helper object
        $roi = new Helper_RegionOfInterest($x1, $y1, $x2, $y2, $this->_params['imageScale']);
        
        // Create the screenshot
        $screenshot = new Image_Composite_HelioviewerScreenshot(
            $layers, $this->_params['date'], $roi, $this->_options
        );
        
        // Display screenshot
        if (isset($this->_options['display']) && $this->_options['display']) {
            $screenshot->display();
        } else {
            // Print JSON
            $this->_printJSON(json_encode(array("id" => $screenshot->id)));
        }
    }
    
    /**
     * Retrieves a local or remote RSS/Atom news feed
     */
    public function getNewsFeed()
    {
        include_once 'lib/JG_Cache/JG_Cache.php';

        // Create cache dir if it doesn't already exist
        $cacheDir = HV_CACHE_DIR . "/remote";
        if (!file_exists($cacheDir)) {
            mkdir($cacheDir, 0777, true);
        }
        
        // Check for feed in cache
        $cache = new JG_Cache($cacheDir);

        if(!($feed = $cache->get('news.xml', 1800))) {
            
            // Re-fetch if it is old than 30 mins
            include_once 'src/Net/Proxy.php';
            $proxy = new Net_Proxy(HV_NEWS_FEED_URL);
            $feed = $proxy->query();
            $cache->set('news.xml', $feed);
        }

        // Print Response as XML or JSONP/XML
        if(isset($this->_params['callback'])) {
            $this->_printJSON($feed, true, true);
        } else {
            header("Content-Type: text/xml;charset=UTF-8");
            echo $feed;            
        }
    }
    
    /**
     * Uses bit.ly to generate a shortened URL
     * 
     * TODO 2012/02/23: Switch to using bit.ly JSONP API directly.
     */
    public function shortenURL()
    {
        include_once 'src/Net/Proxy.php';
        $proxy = new Net_Proxy("http://api.bitly.com/v3/shorten?");
        
        $longURL = HV_WEB_ROOT_URL . "/?" . urldecode($this->_params['queryString']);

        $params = array(
            "longUrl" => $longURL,
            "login"   => HV_BITLY_USER,
            "apiKey"  => HV_BITLY_API_KEY
        );
        
        $this->_printJSON($proxy->query($params));
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

        $this->_printJSON($statistics->getUsageStatistics($this->_options['resolution']));
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
    private function _createTileCacheDir($directory)
    {
        $cacheDir = HV_CACHE_DIR . "/tiles" . $directory;
 
        if (!file_exists($cacheDir)) {
            mkdir($cacheDir, 0777, true);
        }
    }
    
    /**
     * Helper function to output result as either JSON or JSONP
     * 
     * @param string $json JSON object string
     * @param bool   $xml  Whether to wrap an XML response as JSONP
     * @param bool   $utf  Whether to return result as UTF-8
     * 
     * @return void
     */
    private function _printJSON($json, $xml=false, $utf=false)
    {
        // Wrap JSONP requests with callback
        if(isset($this->_params['callback'])) {
            // For XML responses, surround with quotes and remove newlines to
            // make a valid JavaScript string
            if ($xml) {
                $xmlStr = str_replace("\n", "", str_replace("'", "\'", $json));
                $json = sprintf("%s('%s')", $this->_params['callback'], $xmlStr);
            } else {
                $json = sprintf("%s(%s)", $this->_params['callback'], $json);    
            }
        }
        
        // Set Content-type HTTP header
        if ($utf) {
            header('Content-type: application/json;charset=UTF-8');
        } else {
            header('Content-Type: application/json');            
        }
        
        // Print result
        echo $json;
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
               "dates" => array('date'),
               "optional" => array('callback'),
               "alphanum" => array('callback')
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
               "optional" => array('verbose', 'callback'),
               "bools"    => array('verbose'),
               "alphanum" => array('callback')
            );
            break;

        case "getTile":
            $expected = array(
                "required" => array('id', 'x', 'y', 'imageScale'),
                "floats"   => array('imageScale'),
                "ints"     => array('id', 'x', 'y')
            );
            break;

        case "getJP2Header":
            $expected = array(
                "required" => array('id'),
                "ints"     => array('id'),
                "optional" => array('callback'),
                "alphanum" => array('callback')
            );
            break;
        case "getNewsFeed":
            $expected = array(
                "optional" => array('callback'),
                "alphanum" => array('callback')
            );
            break;
        case "getUsageStatistics":
            $expected = array(
                "optional" => array("resolution", "callback"),
                "alphanum" => array("resolution", "callback")
            );
            break;
        case "shortenURL":
            $expected = array(
                "required" => array("queryString", "callback"),
                "encoded"  => array("queryString", "callback")
            );
            break;
        case "takeScreenshot":
            $expected = array(
                "required" => array('date', 'imageScale', 'layers'),
                "optional" => array('display', 'watermark', 'x1', 'x2', 'y1', 'y2', 'x0', 'y0', 'width', 'height', 'callback'),
                "floats"   => array('imageScale', 'x1', 'x2', 'y1', 'y2', 'x0', 'y0'),
                "ints"     => array('width', 'height'),
                "dates"	   => array('date'),
                "bools"    => array('display', 'watermark'),
                "alphanum" => array('callback')
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
            <li><a href="index.php#CustomURLs">Helioviewer.org URLs</a></li>
            <li>
                <a href="index.php#ScreenshotAPI">Screenshots</a>
                <ul>
                    <li><a href="index.php#takeScreenshot">Creating a Screenshot</a></li>
                    <li><a href="index.php#downloadScreenshot">Retrieving a Screenshot</a></li>
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
        $rootURL = substr(HV_API_ROOT_URL, 0, -13) . "index.php?";
        ?>
        <!-- Helioviewer.org URLs-->
        <div id="CustomURLs">
            <h1>Helioviewer.org URLs</h1>
            <p>By specifying URL parameters at the main Helioviewer.org page,
               it is possible to control what data is loaded into the page when
               the user follows a URL. This is useful for dynamically loading 
               a specific view or observation into Helioviewer using a URL.
               Note that all parameters for URL generation are optional.</p>
        
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
                            <td><b>centerX</b></td>
                            <td><i>Float</i></td>
                            <td>Horizontal offset from the center of the Sun in arc-seconds.</td>
                        </tr>
                        <tr>
                            <td><b>centerY</b></td>
                            <td><i>Float</i></td>
                            <td>Vertical offset from the center of the Sun in arc-seconds.</td>
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
                            [OBSERVATORY, INSTRUMENT, DETECTOR, MEASUREMENT, VISIBLE, OPACITY].</td>
                        </tr>
                        <tr>
                            <td><b>movieId</b></td>
                            <td><i>String</i></td>
                            <td>Identifier of Helioviewer.org movie to display when page is loaded.</td>
                        </tr>
                        <tr>
                            <td><b>output</b></td>
                            <td><i>String</i></td>
                            <td>Output format to use when displaying the page. Currently there are two
                                accepted output formats: "web" and "embed". If no output method is
                                specified the output will default to the standard web display.</td>
                        </tr>
                    </tbody>
                </table>
        
                <br />

                <span class="example-header">Examples:</span> <span class="example-url">
                <a href="<?php echo $rootURL;?>date=2011-06-01T00:00:00Z&amp;imageScale=4.8408818&amp;imageLayers=[SDO,AIA,AIA,171,1,100],[SOHO,LASCO,C2,white-light,1,100]">
                   <?php echo $rootURL;?>date=2011-06-01T00:00:00Z&imageScale=4.8408818&imageLayers=[SDO,AIA,AIA,171,1,100],[SOHO,LASCO,C2,white-light,1,100]
                </a><br /><br />
                
                <a href="<?php echo $rootURL;?>movieId=tk115">
                   <?php echo $rootURL;?>movieId=tk115
                </a>
                </span>
            </div>
        </div>

        <br />
        
        <!-- Screenshot API -->
        <div id="ScreenshotAPI">
            
            <h1>Screenshots</h1>
            <p></p>
                The Screenshot API provides a way for users to create custom single-layer and composite images using Helioviewer.org. Depending on how you plan to use the screenshot, the process
                can be handled in either one or two steps. In the simplest case, <a href='#takeScreenshot'>takeScreenshot</a> is called with "display=true" and an image is returned directly. Alternatively,
                when the display parameter is not set to true in the request an identifier is returned which can then be used by the <a href='#downloadScreenshot'>downloadScreenshot</a> method to display the image.
                This is useful when you want to provide a reusable link to the image you create.
            <br />
        
            <ol style="list-style-type: upper-latin;">
                
            <li>
            <div id="takeScreenshot">
                <h1>Creating a Screenshot</h1>
                <p>Returns a single image containing all layers/image types requested. If an image is not available for the date requested the closest
                available image is returned. The region to be included in the screenshot may be specified using either the top-left and bottom-right coordinates
                in arc-seconds, or a center point in arc-seconds and a width and height in pixels. See the <a style="color:#3366FF" href="#Coordinates">Coordinates Appendix</a> for
                more infomration about working with coordinates in Helioviewer.org.</p>        
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
                            <td><i>Float</i></td>
                            <td><i>[Optional]</i> The offset of the image's top boundary from the center of the sun, in arcseconds.</td>
                        </tr>
                        <tr>
                            <td><b>x1</b></td>
                            <td><i>Float</i></td>
                            <td><i>[Optional]</i> The offset of the image's left boundary from the center of the sun, in arcseconds.</td>
                        </tr>
                        <tr>
                            <td><b>y2</b></td>
                            <td><i>Float</i></td>
                            <td><i>[Optional]</i> The offset of the image's bottom boundary from the center of the sun, in arcseconds.</td>
                        </tr>
                        <tr>
                            <td><b>x2</b></td>
                            <td><i>Float</i></td>
                            <td><i>[Optional]</i> The offset of the image's right boundary from the center of the sun, in arcseconds.</td>
                        </tr>
                        <tr>
                            <td><b>x0</b></td>
                            <td><i>Float</i></td>
                            <td><i>[Optional]</i> The horizontal offset from the center of the Sun.</td>
                        </tr>
                        <tr>
                            <td><b>y0</b></td>
                            <td><i>Float</i></td>
                            <td><i>[Optional]</i> The vertical offset from the center of the Sun.</td>
                        </tr>
                        <tr>
                            <td><b>width</b></td>
                            <td><i>Integer</i></td>
                            <td><i>[Optional]</i> Width of the screenshot in pixels (Maximum: 1920).</td>
                        </tr>
                        <tr>
                            <td><b>height</b></td>
                            <td><i>Integer</i></td>
                            <td><i>[Optional]</i> Height of the screenshot in pixels (Maximum: 1200).</td>
                        </tr>
                        <tr>
                            <td><b>display</b></td>
                            <td><i>Boolean</i></td>
                            <td><i>[Optional]</i> If display is true, the screenshot will display on the page when it is ready. If display is false, the
                                filepath to the screenshot will be returned. If display is not specified, it will default to true (Default=false).</td>
                        </tr>
                        <tr>
                            <td><b>watermark</b></td>
                            <td><i>Boolean</i></td>
                            <td><i>[Optional]</i> Whether or not the include the timestamps and the Helioviewer.org logo in the screenshot (Default=true).</td>
                        </tr>
                    </tbody>
                </table>
        
                <br />
        
                <span class="example-header">Examples:</span>
                <span class="example-url">
                <a href="<?php echo HV_API_ROOT_URL;?>?action=takeScreenshot&date=2011-03-01T12:12:12Z&imageScale=10.52&layers=[3,1,100],[4,1,100]&x1=-5000&y1=-5000&x2=5000&y2=5000&display=true">
                <?php echo HV_API_ROOT_URL;?>?action=takeScreenshot&date=2011-03-01T12:12:12Z&imageScale=10.52&layers=[3,1,100],[4,1,100]&x1=-5000&y1=-5000&x2=5000&y2=5000&display=true
                </a>
                </span><br />
                <span class="example-url">
                <a href="<?php echo HV_API_ROOT_URL;?>?action=takeScreenshot&date=2011-03-01T12:12:12Z&imageScale=10.52&layers=[SOHO,EIT,EIT,171,1,100],[SOHO,LASCO,C2,white-light,1,100]&x1=-5000&y1=-5000&x2=5000&y2=5000">
                <?php echo HV_API_ROOT_URL;?>?action=takeScreenshot&date=2011-03-01T12:12:12Z&imageScale=10.52&layers=[SOHO,EIT,EIT,171,1,100],[SOHO,LASCO,C2,white-light,1,100]&x1=-5000&y1=-5000&x2=5000&y2=5000
                </a>
                </span>
                <br />
                <span class="example-url">
                <a href="<?php echo HV_API_ROOT_URL;?>?action=takeScreenshot&date=2011-06-07T09:00:00Z&imageScale=2.4204409&layers=[SDO,AIA,AIA,304,1,100]&x0=0&y0=0&width=1024&height=1024&display=true">
                <?php echo HV_API_ROOT_URL;?>?action=takeScreenshot&date=2011-06-07T09:00:00Z&imageScale=2.4204409&layers=[SDO,AIA,AIA,304,1,100]&x0=0&y0=0&width=1024&height=1024&display=true
                </a>
                </span>
                </div>
                <br />
            </div>
            </li>
            
            <li>
            <div id="downloadScreenshot">
                <h1>Retrieving an Existing Screenshot</h1>
                <p>Displays the screenshot associated with the specified id.</p>
        
                <br />
        
                <div class="summary-box"><span
                    style="text-decoration: underline;">Usage:</span><br />
                <br />
        
                <?php echo HV_API_ROOT_URL;?>?action=downloadScreenshot<br />
                <br />
        
                Supported Parameters:<br />
                <br />
        
                <table class="param-list" cellspacing="10">
                    <tbody valign="top">
                        <tr>
                            <td width="20%"><b>id</b></td>
                            <td><i>Integer</i></td>
                            <td>The screenshot id as returned from <a href='#takeScreenshot'>takeScreenshot</a>.</td>
                        </tr>
                    </tbody>
                </table>
        
                <br />
        
                <span class="example-header">Example:</span>
                <span class="example-url">
                <a href="<?php echo HV_API_ROOT_URL;?>?action=downloadScreenshot&id=181">
                <?php echo HV_API_ROOT_URL;?>?action=downloadScreenshot&id=181
                </a>
                </span><br />

                </div>
                <br />
            </div>
            </li>
        </div>
        <?php
    }
}
?>
