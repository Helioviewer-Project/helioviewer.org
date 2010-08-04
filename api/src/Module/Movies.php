<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Helioviewer Movies Module class definition
 *
 * PHP version 5
 *
 * @category Configuration
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @author   Jaclyn Beck <jaclyn.r.beck@gmail.com>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 * 
 * TODO 2010/04/15: Write our own wrapper around FFmpeg? Development of PVT seems to have
 * stopped and since operations we perform are relatively simple, may be easier to write our
 * own wrapper. One consideration is whether or not PVT currently uses the FFmpeg PHP module
 * for any of the methods we call, in which case it may be beneficial for us to do the same.
 */
require_once 'interface.Module.php';

/**
 * Movie generation and display.
 *
 * @category Configuration
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @author   Jaclyn Beck <jaclyn.r.beck@gmail.com>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 *
 */
class Module_Movies implements Module
{
    /**
     * API Request parameters
     *
     * @var mixed
     */
    private $_params;

    /**
     * Movie module constructor
     *
     * @param mixed &$params API request parameters
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
            $this->{$this->_params['action']}();
        }
    }

    /**
     * validate
     *
     * @return bool Returns true if input parameters are valid
     */
    public function validate()
    {
        switch($this->_params['action'])
        {
        // Any booleans that default to true cannot be listed here because the
        // validation process sets them to false if they are not given.
        case "buildMovie":
            $expected = array(
                "required" => array('startTime', 'layers', 'imageScale', 'x1', 'x2', 'y1', 'y2'),
                "dates"    => array('startTime', 'endTime'),
                "ints"     => array('frameRate', 'quality', 'numFrames'),
                "floats"   => array('imageScale', 'x1', 'x2', 'y1', 'y2')
            );
            break;
        case "playMovie":
            $expected = array(
                "required" => array('url', 'width', 'height'),
                "floats"   => array('width', 'height'),
                "urls"     => array('url')
            );
            break;
        case "getMovie":
        	$expected = array(
        	   "required" => array('id')
        	);
        	break;
        case "getETAForMovie":
        	$expected = array(
        	   "required" => array('startTime', 'layers', 'imageScale', 'x1', 'x2', 'y1', 'y2'),
        	   "dates"    => array('startTime', 'endTime'),
        	   "floats"   => array('imageScale', 'x1', 'x2', 'y1', 'y2')
        	);
        default:
            break;
        }

        // Check input
        if (isset($expected)) {
            Validation_InputValidator::checkInput($expected, $this->_params);
        }

        return true;
    }

    /**
     * buildMovie
     * See the API webpage for example usage.
     *
     * For an iPod-compatible format, specify "hqFormat=ipod"
     * Note that filename does NOT have the . extension on it. The reason for
     * this is that in the media settings pop-up dialog, there is no way of
     * knowing ahead of time whether the image is a .png, .tif, .flv, etc,
     * and in the case of movies, the file is both a .flv and .mov/.asf/.mp4
     *
     * @return void
     */
    public function buildMovie ()
    {
        include_once HV_ROOT_DIR . '/api/src/Movie/HelioviewerMovieBuilder.php';
        
        $builder = new Movie_HelioviewerMovieBuilder();
                
        // Make a temporary directory to store the movie in.
        $now = time();
        $tmpDir = HV_TMP_DIR . "/$now";
        if (!file_exists($tmpDir)) {
            mkdir($tmpDir, 0777, true);
            chmod($tmpDir, 0777);
        }
        
        // @TODO: implement some kind of forking or background process. Commented out
        // until proxying enabled.
        /*if (HV_DISTRIBUTED_TILING_ENABLED) {
        	$builder->getEtaAndId($this->_params, $tmpDir);
        	touch($tmpDir . "/INVALID");
        	return;
        }*/
        $builder->buildMovie($this->_params, $tmpDir);
    }
    
    /**
     * Calculates the ETA for the given movie using width/height and numFrames
     */
    public function getETAForMovie ()
    {
        include_once HV_ROOT_DIR . '/api/src/Movie/HelioviewerMovieBuilder.php';
        $builder = new Movie_HelioviewerMovieBuilder();

        return $builder->calculateETA($this->_params);
    }
    
    /**
     * Checks to see if the movie is done and returns the url if it is. If not,
     * returns a new eta.
     * 
     * $this->_params['id'] should be the file path and file name of the movie 
     * without the format extension
     */
    public function getMovie ()
    {
        $filepath = HV_CACHE_DIR . "/" . $this->_params['id'];
        
        header('Content-type: application/json');
        if (file_exists($filepath . "/INVALID")) {
            echo json_encode(array(
                "status" => "invalid",
                "error"  => "There were not enough images for the date requested, so a "
                            . "movie was not created."
            ));
        } else if (file_exists($filepath . "/READY")) {
        	$url = str_replace(HV_ROOT_DIR, HV_WEB_ROOT_DIR, $filepath);
        	echo json_encode(array(
        	   "status" => "ready",
        	   "url"    => $url
        	));
        } else {
        	echo json_encode(array(
        	   "status" => "not ready",
        	   "eta"    => 10,
        	   "id"     => $this->_params['id']
        	));
        }
    }

    /**
     * Gets the movie url and loads it into MC Mediaplayer
     *
     * @return void
     */
    public function playMovie ()
    {
        $url = $this->_params['url'];
        $width  = $this->_params['width'];
        $height = $this->_params['height'];

        ?>
        <!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN"
            "http://www.w3.org/TR/html4/strict.dtd">
        <html>
        <head>
            <title>Helioviewer.org QuickMovie</title>
        </head>
        <body style="background-color: black; color: #FFF;">
            <!-- MC Media Player -->
            <div style="text-align: center;">
                <script type="text/javascript">
                    playerFile = "http://www.mcmediaplayer.com/public/mcmp_0.8.swf";
                    fpFileURL = "<?php print $url?>";
                    fpButtonSize = "48x48";
                    fpAction = "play";
                    cpHidePanel = "mouseout";
                    cpHideDelay = "1";
                    defaultEndAction = "repeat";
                    playerSize = "<?php print $width . 'x' . $height?>";
                </script>
                <script type="text/javascript"
                    src="http://www.mcmediaplayer.com/public/mcmp_0.8.js"></script>
                <!-- / MC Media Player -->
            </div>
            <br>
        </body>
        </html>
        <?php
    }
    
    /**
     * Prints the Movies module's documentation header
     * 
     * @return void
     */
    public static function printDocHeader()
    {
        ?>
            <li>
                <a href="index.php#MovieAPI">Movie and Screenshot API</a>
                <ul>
                    <li><a href="index.php#takeScreenshot">Creating a Screenshot</a></li>
                    <li><a href="index.php#buildMovie">Creating a Movie</a></li>
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
        ?>
        <!-- Movie and Screenshot API -->
        <div id="MovieAPI">
            <h1>Movie and Screenshot API:</h1>
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
                            <td width="20%"><b>obsDate</b></td>
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
                            <td><b>quality</b></td>
                            <td><i>Integer</i></td>
                            <td><i>[Optional]</i> The quality of the image, from 0-10. If quality is not specified, it defaults to 10.</td>
                        </tr>
                        <tr>
                            <td><b>filename</b></td>
                            <td><i>String</i></td>
                            <td><i>[Optional]</i> The desired filename (without the ".png" extension) of the output image. If no filename is specified,
                                the filename defaults to a combination of the date, layer names, and image scale.</td>
                        </tr>
                        <tr>
                            <td><b>display</b></td>
                            <td><i>Boolean</i></td>
                            <td><i>[Optional]</i> If display is true, the screenshot will display on the page when it is ready. If display is false, the
                                filepath to the screenshot will be returned. If display is not specified, it will default to true.</td>
                        </tr>
                        <tr>
                            <td><b>watermarkOn</b></td>
                            <td><i>Boolean</i></td>
                            <td><i>[Optional]</i> Enables turning watermarking on or off. If watermarkOn is set to false, the image will not be watermarked.
                                If left blank, it defaults to true and images will be watermarked.</td>
                        </tr>
                    </tbody>
                </table>
        
                <br />
        
                <span class="example-header">Examples:</span>
                <span class="example-url">
                <a href="<?php echo $baseURL;?>?action=takeScreenshot&obsDate=2010-03-01T12:12:12Z&imageScale=10.52&layers=[3,1,100],[4,1,100]&x1=-5000&y1=-5000&x2=5000&y2=5000">
                <?php echo $baseURL;?>?action=takeScreenshot&obsDate=2010-03-01T12:12:12Z&imageScale=10.52&layers=[3,1,100],[4,1,100]&x1=-5000&y1=-5000&x2=5000&y2=5000
                </a>
                </span><br />
                <span class="example-url">
                <a href="<?php echo $baseURL;?>?action=takeScreenshot&obsDate=2010-03-01T12:12:12Z&imageScale=10.52&layers=[SOHO,EIT,EIT,171,1,100],[SOHO,LASCO,C2,white-light,1,100]&x1=-5000&y1=-5000&x2=5000&y2=5000">
                <?php echo $baseURL;?>?action=takeScreenshot&obsDate=2010-03-01T12:12:12Z&imageScale=10.52&layers=[SOHO,EIT,EIT,171,1,100],[SOHO,LASCO,C2,white-light,1,100]&x1=-5000&y1=-5000&x2=5000&y2=5000
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
                            <td width="20%"><b>startTime</b></td>
                            <td width="20%"><i>ISO 8601 UTC Date</i></td>
                            <td>Desired starting timestamp of the movie. The timestamps for the subsequent frames are incremented by
                                a certain timestep.</td>
                        </tr>
                        <tr>
                            <td><b>endTime</b></td>
                            <td><i>ISO 8601 UTC Date</i></td>
                            <td><i>[Optional but Recommended]</i> Desired ending timestamp of the movie. Time step and number of frames will be figured out from the range
                                between startTime and endTime. If no endTime is specified, time frame will default to 24 hours.</td>
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
                            <td><b>numFrames</b></td>
                            <td><i>Integer</i></td>
                            <td><i>[Optional]</i> If you want a specific number of frames rather than the optimal number, you can specify 
                                    the number of frames you would like to include in the movie. You may have between 10 and 120 frames. If
                                    numFrames is not specified, the optimal cadence and number of frames will be calculated for you.</td>
                        </tr>
                        <tr>
                            <td><b>frameRate</b></td>
                            <td><i>Integer</i></td>
                            <td><i>[Optional]</i> The number of frames per second. The default value is 8.</td>
                        </tr>
                        <tr>
                            <td><b>quality</b></td>
                            <td><i>Integer</i></td>
                            <td><i>[Optional]</i> The quality of the images, from 0-10. If quality is not specified, it defaults to 10.</td>
                        </tr>
                        <tr>
                            <td><b>filename</b></td>
                            <td><i>String</i></td>
                            <td><i>[Optional]</i> The desired filename (without the "." extension) of the output image. If no filename is specified,
                                the filename defaults to a combination of the date, layer names, and image scale.</td>
                        </tr>
                        <tr>
                            <td><b>hqFormat</b></td>
                            <td><i>String</i></td>
                            <td><i>[Optional]</i> The desired format for the high quality movie file. Currently supported filetypes are "mp4", "mov", "avi", and "ipod".
                                iPod video will come out in mp4 format but extra settings need to be applied so format must be specified as "ipod". </td>
                        </tr>
                        <tr>
                            <td><b>display</b></td>
                            <td><i>Boolean</i></td>
                            <td><i>[Optional]</i> If display is true, the movie will display on the page when it is ready. If display is false, the
                                filepath to the movie's flash-format file will be returned as JSON. If display is not specified, it will default to true.</td>
                        </tr>
                        <tr>
                            <td><b>watermarkOn</b></td>
                            <td><i>Boolean</i></td>
                            <td><i>[Optional]</i> Enables turning watermarking on or off. If watermarkOn is set to false, the images will not be watermarked, 
                                which will speed up movie generation time but you will have no timestamps on the movie. If left blank, it defaults to true 
                                and images will be watermarked.</td>
                        </tr>
                    </tbody>
                </table>
        
                <br />
                
                <span class="example-header">Examples:</span>
                <span class="example-url">
                <a href="<?php echo $baseURL;?>?action=buildMovie&startTime=2010-03-01T12:12:12Z&endTime=2010-03-02T12:12:12Z&imageScale=21.04&layers=[3,1,100],[4,1,100]&x1=-5000&y1=-5000&x2=5000&y2=5000">
                    <?php echo $baseURL;?>?action=buildMovie&startTime=2010-03-01T12:12:12Z&endTime=2010-03-04T12:12:12Z&imageScale=21.04&layers=[3,1,100],[4,1,100]&x1=-5000&y1=-5000&x2=5000&y2=5000
                </a>
                </span><br />
                <span class="example-url">
                <a href="<?php echo $baseURL;?>?action=buildMovie&startTime=2010-03-01T12:12:12Z&endTime=2010-03-02T12:12:12Z&imageScale=21.04&layers=[SOHO,EIT,EIT,304,1,100],[SOHO,LASCO,C2,white-light,1,100]&x1=-5000&y1=-5000&x2=5000&y2=5000">
                    <?php echo $baseURL;?>?action=buildMovie&startTime=2010-03-01T12:12:12Z&endTime=2010-03-04T12:12:12Z&imageScale=21.04&layers=[SOHO,EIT,EIT,304,1,100],[SOHO,LASCO,C2,white-light,1,100]&x1=-5000&y1=-5000&x2=5000&y2=5000
                </a>
                </span><br />
                <span class="example-url">
                <i>iPod Video:</i><br /><br />
                <a href="<?php echo $baseURL;?>?action=buildMovie&startTime=2010-03-01T12:12:12Z&endTime=2010-03-02T12:12:12Z&imageScale=8.416&layers=[1,1,100]&x1=-1347&y1=-1347&x2=1347&y2=1347&hqFormat=ipod&display=false&watermarkOn=false">
                    <?php echo $baseURL;?>?action=buildMovie&startTime=2010-03-01T12:12:12Z&endTime=2010-03-04T12:12:12Z&imageScale=8.416&layers=[1,1,100]&x1=-1347&y1=-1347&x2=1347&y2=1347&hqFormat=ipod&display=false&watermarkOn=false
                </a>
                </span>
                </div>
            </div>
        
            <br />
            <br />      
        </div>
        <?php
    }
}