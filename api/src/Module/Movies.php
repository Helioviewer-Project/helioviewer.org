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
                "required" => array('startDate', 'layers', 'imageScale', 'width', 'height'),
                "dates"    => array('startDate'),
                "ints"     => array('numFrames, frameRate, timeStep, quality', 'width', 'height'),
            	"floats"   => array('imageScale')
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
     * printDoc
     *
     * @return void
     */
    public static function printDoc()
    {

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
}