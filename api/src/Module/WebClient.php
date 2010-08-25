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
                handleError($e->getMessage(), $e->getCode());
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

        if (substr($url, 0, 4) !== "http") {
            $stat = stat($url); // Can't stat files that are from other servers.
        }

        if (strlen($url) > 1) {
            header("Pragma: public");
            header("Expires: 0");
            header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
            header("Cache-Control: private", false); // required for certain browsers
            header("Content-Disposition: attachment; filename=\"" . basename($url) . "\";");
            header("Content-Transfer-Encoding: binary");

            if (isset($stat) && $stat['size']) {
                header("Content-Length: " . $stat['size']);
            }
            if (substr($url, -3) === "mov") {
                header("Content-type: video/quicktime");
            }
            echo file_get_contents($url);
        } else {
            throw new Exception("Unable to find the specified requested file.");
        }
    }

    /**
     * http://helioviewer.org/api/index.php?action=getClosestImage&date=2003-10-05T00:00:00Z&source=0&s=1
     * 
     * TODO 01/29/2010 Check to see if server number is within valid range of know authenticated servers.
     *
     * @return void
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
        $this->_createImageCacheDir($result['filepath']);

        $json = json_encode($result);

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
        $dataSources = json_encode($imgIndex->getDataSources($this->_params['verbose']));

        header('Content-type: application/json;charset=UTF-8');

        print $dataSources;
    }

    /**
     * NOTE: Add option to specify XML vs. JSON... FITS vs. Entire header?
     *
     * @return void
     */
    public function getJP2Header ()
    {
        include_once 'src/Image/JPEG2000/JP2ImageXMLBox.php';
        $xmlBox = new Image_JPEG2000_JP2ImageXMLBox(HV_JP2_DIR . $this->_params["file"]);
        $xmlBox->printXMLBox();
    }

    /**
     * getTile
     *
     * @return void
     */
    public function getTile ()
    {        
        include_once 'src/Image/Tiling/HelioviewerTileBuilder.php';
        $builder = new Image_Tiling_HelioviewerTileBuilder();
        return $builder->getTile($this->_params);
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

        $response = $builder->takeScreenshot($this->_params, $tmpDir, array());
        
        if (!$this->_params['display']) {
            echo str_replace(HV_ROOT_DIR, HV_WEB_ROOT_URL, $response);
        }

        return $response;        
    }
    
    /**
     * getViewerImage (aka "getCompositeImage")
     *
     * Example usage: (outdated!)
     *     http://helioviewer.org/api/index.php?action=getViewerImage
     *         &layers=SOH_EIT_EIT_195&timestamps=1065312000&imageScale=2.4
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
                $expected["ints"]     = array('sourceId');
            } else {
                $expected["required"] = array('date', 'observatory', 'instrument', 'detector', 'measurement');
            }
            break;

        case "getDataSources":
            $expected = array(
               "optional" => array('verbose')
            );
            break;

        case "getTile":
            $required = array('uri', 'x1', 'x2', 'y1', 'y2', 'date', 'imageScale', 'size', 'jp2Width','jp2Height', 'jp2Scale',
                              'offsetX', 'offsetY', 'format', 'observatory', 'instrument', 'detector', 'measurement');
            $expected = array(
               "required" => $required
            );
            break;

        case "getJP2Header":
            break;
        case "getViewerImage":
            break;
        // Any booleans that default to true cannot be listed here because the
        // validation process sets them to false if they are not given.
        case "takeScreenshot":
            $expected = array(
                "required" => array('obsDate', 'imageScale', 'layers', 'x1', 'x2', 'y1', 'y2'),
                "floats"   => array('imageScale', 'x1', 'x2', 'y1', 'y2'),
                "dates"	   => array('obsDate'),
                "ints"     => array('quality'),
                "bools"    => array('display')
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
                    <a href="<?php echo HV_API_ROOT_URL;?>?action=getClosestImage&date=2010-06-24T00:00:00.000Z&s=1&sourceId=3">
                       <?php echo HV_API_ROOT_URL;?>?action=getClosestImage&date=2010-06-24T00:00:00.000Z&s=1&sourceId=3
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
                            <td><b>format</b></td>
                            <td><i>String</i></td>
                            <td>The format of the tile. Should be png if the tile has transparency, as with LASCO images, and jpg if it does not.</td>
                        </tr>
                        <tr>
                            <td><b>date</b></td>
                            <td><i>ISO 8601 UTC Date</i></td>
                            <td>The date of the image</td>
                        </tr>
                        <tr>
                            <td><b>imageScale</b></td>
                            <td><i>Float</i></td>
                            <td>The scale of the image in the viewport, in arcseconds per pixel.</td>
                        </tr>
                        <tr>
                            <td><b>size</b></td>
                            <td><i>Integer</i></td>
                            <td>The desired tile size in pixels.</td>
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
                    <a href="<?php echo HV_API_ROOT_URL;?>?action=getTile&uri=/EIT/171/2010/06/02/2010_06_02__01_00_16_255__SOHO_EIT_EIT_171.jp2&x1=-2700.1158&x2=-6.995800000000215&y1=-19.2516&y2=2673.8684&format=jpg&date=2010-06-02+01:00:16&imageScale=5.26&size=512&jp2Width=1024&jp2Height=1024&jp2Scale=2.63&observatory=SOHO&instrument=EIT&detector=EIT&measurement=171&offsetX=2.66&offsetY=7.32">
                       <?php echo HV_API_ROOT_URL;?>?action=getTile&uri=/EIT/171/2010/06/02/2010_06_02__01_00_16_255__SOHO_EIT_EIT_171.jp2
                        &x1=-2700.1158&x2=-6.995800000000215&y1=-19.2516&y2=2673.8684&format=jpg&date=2010-06-02+01:00:16&imageScale=5.26
                        &size=512&jp2Width=1024&jp2Height=1024&jp2Scale=2.63&observatory=SOHO&instrument=EIT&detector=EIT&measurement=171
                        &offsetX=2.66&offsetY=7.32
                    </a>
                    <br /><br />
                </span>
            </li>
            </ol>
        </div>
        <?php
    }
}
?>
