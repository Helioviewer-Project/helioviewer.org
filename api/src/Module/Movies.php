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
 * @author   Jaclyn Beck <jabeck@nmu.edu>
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
 * @author   Jaclyn Beck <jabeck@nmu.edu>
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
        case "buildMovie":
            $expected = array(
                "required" => array('startDate', 'endDate', 'layers', 'imageScale', 'x1', 'x2', 'y1', 'y2'),
                "dates"    => array('startDate', 'endDate'),
                "ints"     => array('frameRate', 'quality'),
                "floats"   => array('imageScale', 'x1', 'x2', 'y1', 'y2')
            );
            break;
        case "playMovie":
            // Temporarily disabled.
            // TODO: Before re-enabling, validate file input.
            // Allow only filename specification.
            return false;
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
     *
     * API example: http://localhost/helioviewer/api/index.php?action=buildMovie
     *     &startDate=2010-03-01T12:12:12Z&imageScale=21.04&layers=3,1,100/4,1,100&offsetLeftTop=-5000,-5000
     *     &offsetRightBottom=5000,5000&width=512&height=512
     *     // Optional parameters to add on to the end: &numFrames=20&frameRate=8&timeStep=86400
     *     			&filename=example&sharpen=false&edges=false&quality=10&hqFormat=mp4&display=true
     * 
     * The first number of each layer represents the layer's source id in the database. Alternatively,
     * you can pass in the layer's name instead of the source id:
     * 
     * http://localhost/helioviewer/api/index.php?action=buildMovie
     *     &startDate=2010-03-01T12:12:12Z&imageScale=21.04&layers=SOHO,EIT,EIT,304,1,100
     *     /SOHO,LASCO,C2,white-light,1,100&offsetLeftTop=-5000,-5000
     *     &offsetRightBottom=5000,5000&width=512&height=512
     *     // Optional parameters to add on to the end: &numFrames=20&frameRate=8&timeStep=86400
     *     			&filename=example&sharpen=false&edges=false&quality=10&hqFormat=mp4&display=true
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
        return $builder->buildMovie($this->_params);
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
     */
    public static function printDocHeader() {
?>
    <li>
        <a href="index.php#MovieAPI">Movie and Screenshot API</a>
        <ul>
            <li><a href="index.php#takeScreenshot">Screenshot API</a></li>
            <li><a href="index.php#buildMovie">Movie API</a></li>
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
                        Each layer is comma-separated with these values: <i>sourceId,isVisible,opacity</i>. <br />
                        If you do not know the sourceId, you can 
                        alternately send this layer string: <i>obs,inst,det,meas,isVisible,opacity</i>.
                        Layer strings are separated by "/": layer1/layer2/layer3.</td>
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
        <a href="<?php echo $baseURL;?>?action=takeScreenshot&obsDate=2010-03-01T12:12:12Z&imageScale=10.52&layers=3,1,100/4,1,100&x1=-5000&y1=-5000&x2=5000&y2=5000">
        <?php echo $baseURL;?>?action=takeScreenshot&obsDate=2010-03-01T12:12:12Z&imageScale=10.52&layers=3,1,100/4,1,100&x1=-5000&y1=-5000&x2=5000&y2=5000
        </a>
        </span><br />
        <span class="example-url">
        <a href="<?php echo $baseURL;?>?action=takeScreenshot&obsDate=2010-03-01T12:12:12Z&imageScale=10.52&layers=SOHO,EIT,EIT,171,1,100/SOHO,LASCO,C2,white-light,1,100&x1=-5000&y1=-5000&x2=5000&y2=5000">
        <?php echo $baseURL;?>?action=takeScreenshot&obsDate=2010-03-01T12:12:12Z&imageScale=10.52&layers=SOHO,EIT,EIT,171,1,100/SOHO,LASCO,C2,white-light,1,100&x1=-5000&y1=-5000&x2=5000&y2=5000
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
                    <td width="20%"><b>startDate</b></td>
                    <td width="20%"><i>ISO 8601 UTC Date</i></td>
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
                        alternately send this layer string: <i>obs,inst,det,meas,isVisible,opacity</i>.
                        Layer strings are separated by "/": layer1/layer2/layer3.</td>
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
                    <td><i>[Optional]</i> The number of frames you would like to include in the movie. You may have between 10 and 120 frames.
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
                    <td><i>[Optional]</i> The desired format for the high quality movie file. Currently supported filetypes are "mp4", "mov", "avi", and "ipod".
                        iPod video will come out in mp4 format but extra settings need to be applied so format must be specified as "ipod". </td>
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
        
        <span class="example-header">Examples:</span>
        <span class="example-url">
        <a href="<?php echo $baseURL;?>?action=buildMovie&startDate=2010-03-01T12:12:12Z&imageScale=21.04&layers=3,1,100/4,1,100&x1=-5000&y1=-5000&x2=5000&y2=5000">
            <?php echo $baseURL;?>?action=buildMovie&startDate=2010-03-01T12:12:12Z&imageScale=21.04&layers=3,1,100/4,1,100&x1=-5000&y1=-5000&x2=5000&y2=5000
        </a>
        </span><br />
        <span class="example-url">
        <a href="<?php echo $baseURL;?>?action=buildMovie&startDate=2010-03-01T12:12:12Z&imageScale=21.04&layers=SOHO,EIT,EIT,304,1,100/SOHO,LASCO,C2,white-light,1,100&x1=-5000&y1=-5000&x2=5000&y2=5000">
            <?php echo $baseURL;?>?action=buildMovie&startDate=2010-03-01T12:12:12Z&imageScale=21.04&layers=SOHO,EIT,EIT,304,1,100/SOHO,LASCO,C2,white-light,1,100&x1=-5000&y1=-5000&x2=5000&y2=5000
        </a>
        </span><br />
        <span class="example-url">
        <i>iPod Video:</i><br /><br />
        <a href="<?php echo $baseURL;?>?action=buildMovie&startDate=2010-03-01T12:12:12Z&imageScale=8.416&layers=0,1,100/1,1,50&x1=-1347&y1=-1347&x2=1347&y2=1347&hqFormat=ipod&display=false">
            <?php echo $baseURL;?>?action=buildMovie&startDate=2010-03-01T12:12:12Z&imageScale=8.416&layers=0,1,100/1,1,50&x1=-1347&y1=-1347&x2=1347&y2=1347&hqFormat=ipod&display=false
        </a>
        </span>
        </div>
    </div>

    <br />

</div>
<?php
    }
}