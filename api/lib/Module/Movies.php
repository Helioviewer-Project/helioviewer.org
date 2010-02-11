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
        $this->execute();
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
                "required" => array('startDate', 'zoomLevel', 'numFrames', 'frameRate', 'timeStep', 'quality'),
                "dates"    => array('startDate'),
                "ints"     => array('zoomLevel, numFrames, frameRate, timeStep, quality')
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
     * All possible parameters: startDate, zoomLevel, numFrames, frameRate, 
     * timeStep, layers, imageSize ("x,y"), filename, edges, sharpen, format.
     * 
     * API example: http://localhost/helioviewer/api/index.php?action=buildMovie
     *     &startDate=1041465600&zoomLevel=13&numFrames=20&frameRate=8
     *     &timeStep=86400&layers=SOH,EIT,EIT,304,1,100x0,1034,0,1034,-230,-215
     *     /SOH,LAS,0C2,0WL,1,100x0,1174,28,1110,-1,0
     *     &imageSize=588,556&filename=example&sharpen=false&edges=false
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
        include_once 'lib/Movie/HelioviewerMovie.php';

        // Required parameters
        $startDate = $this->_params['startDate'];
        $zoomLevel = $this->_params['zoomLevel'];
        $numFrames = $this->_params['numFrames'];
        $frameRate = $this->_params['frameRate'];
        $timeStep  = $this->_params['timeStep'];
        $quality   = $this->_params['quality'];
           
        // Layerstrings are separated by "/"
        $layerStrings = explode("/", $this->_params['layers']);

        $imageCoords = explode(",", $this->_params['imageSize']);
        $imageSize   = array(
            "width"  => $imageCoords[0],
            "height" => $imageCoords[1]
        );
        $filename    = $this->_params['filename'];      
        $hqFormat    = $this->_params['format'];
        //$hqFormat = "mp4";
        
        // Optional parameters
        $options = array();
        $options['enhanceEdges'] = $this->_params['edges']   || false;
        $options['sharpen']      = $this->_params['sharpen'] || false;    
                
        //Check to make sure values are acceptable
        try {
            //Limit number of layers to three
            if (strlen($this->_params['layers']) == 0) {
                $msg = "Invalid layer choices! You must specify 1-3 command-separate layernames.";
                throw new Exception($msg);
            }

            //Limit number of frames
            if (($numFrames < 10) || ($numFrames > HV_MAX_MOVIE_FRAMES)) {
                $msg = "Invalid number of frames. Number of frames should be " .
                "at least 10 and no more than " . HV_MAX_MOVIE_FRAMES . ".";
                throw new Exception($msg);
            }

            $layers = $this->_formatLayerStrings($layerStrings);

            $movie = new Movie_HelioviewerMovie(
                $layers, $startDate, $zoomLevel, $numFrames, $frameRate, 
                $hqFormat, $options, $timeStep, $imageSize, $filename, $quality
            );
            $movie->buildMovie();

        } catch(Exception $e) {
            echo 'Error: ' .$e->getMessage();
            exit();
        }

        return 1;
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