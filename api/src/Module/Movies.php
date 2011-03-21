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
    private $_params;
    private $_options;

    /**
     * Movie module constructor
     *
     * @param mixed &$params API request parameters
     */
    public function __construct(&$params)
    {
        $this->_params = $params;
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
     * buildMovie
     *
     * @return void
     */
    public function buildMovie ()
    {
        include_once 'src/Movie/HelioviewerMovie.php';
        include_once 'src/Helper/HelioviewerLayers.php';
        include_once 'src/Helper/RegionOfInterest.php';
                
        // Data Layers
        $layers = new Helper_HelioviewerLayers($this->_params['layers']);
        
        //Make sure number of layers is between one and three
        if ($layers->length() == 0 || $layers->length() > 3) {
            throw new Exception("Invalid layer choices! You must specify 1-3 comma-separated layer names.");
        }
        
        // Regon of interest
        $roi = new Helper_RegionOfInterest(
            $this->_params['x1'], $this->_params['x2'], $this->_params['y1'], $this->_params['y2'], 
            $this->_params['imageScale']
        );
        
        // Process request
        $movie = new Movie_HelioviewerMovie(
            $this->_params['id'], $layers, $this->_params['startTime'], $this->_params['endTime'], $roi, $this->_options
        );
        
        // Check to make sure we have not already started processing the movie
        if ($movie->getStatus() !== "QUEUED") {
        	throw new Exception("The requested movie is either currently being built or has already been built");
        }
        
        // Build the movie
        $movie->build();
        
        // Update usage stats
        if (HV_ENABLE_STATISTICS_COLLECTION) {
            include_once 'src/Database/Statistics.php';
            $statistics = new Database_Statistics();
            $statistics->log("buildMovie");
        }
        
        // If display=true is set, play the move directly         
        if (isset($this->_options['display']) && $this->_options['display']) {
            echo $movie->getMoviePlayerHTML();
        } else {
            $urls = $this->_getVideoURLs($movie);
            
            // Verbose response
            if (isset($this->_options['verbose']) && $this->_options['verbose']) {
                $response = array(
                    "duration"  => $movie->getDuration(),
                    "frameRate" => $movie->getFrameRate(),
                    "numFrames" => $movie->getNumFrames(),
                    "url"       => $urls
                );                
            } else {
                // Simple response
                $response = array("url" => $urls);
            }
            
            // Print result
            header('Content-type: application/json');
            print json_encode($response);
        }
    }
    
    /**
     * Returns either a single URL or an array of URLs for the requested video
     * 
     * @param object &$movie A HelioviewerMovie instance
     * 
     * @return mixed One or more URLs for movies relating to the request
     */
    private function _getVideoURLs (&$movie)
    {
        $baseURL = $movie->getURL();
        
        // If a specific format was requested, return a link for that video
        if (isset($this->_options['format'])) {
            return "$baseURL.{$this->_options['format']}";    
        } else {
            // Otherwise return URLs for each of the video types generated
            $urls = array();
            foreach (array("mp4", "flv") as $supportedFormat) {
                array_push($urls, "$baseURL.$supportedFormat");
            }
            return $urls;
        }
    }

    /**
     * Queues a movie in Helioqueuer
     * 
     * @return void
     */
    public function queueMovie()
    {
        print "Not yet implemented in Dynamo: send request to Helioqueuer instead.";
    }
    
    /**
     * Uploads a user-created video to YouTube
     */
    public function uploadMovieToYouTube ()
    {
        include_once 'src/Movie/YouTubeUploader.php';

        // Make sure it exists
        if (!file_exists(HV_CACHE_DIR . "/movies/" . $this->_params['file'])) {
            throw new Exception("Invalid movie requested");
        }

        $youtube = new Movie_YouTubeUploader();
        $youtube->uploadVideo($this->_params['file'], $this->_options);
    }
    
    /**
     * Checks to see if Helioviewer.org is authorized to upload videos for a user
     */
    public function checkYouTubeAuth () {
        include_once 'src/Movie/YouTubeUploader.php';
        
        $youtube = new Movie_YouTubeUploader();

        header('Content-type: application/json');
        print json_encode($youtube->checkYouTubeAuth());
    }
    
    /**
     * Retrieves recent user-submitted videos form YouTube and displays either an XML feed or HTML
     * 
     * TODO: 2011/01/07: Move to a separate class
     */
    public function getUserVideos() {
        require_once 'Zend/Loader.php';
        Zend_Loader::loadClass('Zend_Gdata_YouTube');
        
        $yt = new Zend_Gdata_YouTube(null, null, null, HV_YOUTUBE_DEVELOPER_KEY);
        $yt->setMajorProtocolVersion(2);
        
        // Default options
        $defaults = array(
            "pageSize" => 10,
            "pageNum"  => 1
        );
        
        $options = array_replace($defaults, $this->_options);

        // Current page
        $startIndex = 1 + ($options['pageSize'] * ($options['pageNum'] - 1));

        $pageSize = $options['pageSize'];
        
        // URL to query
        $url = 'http://gdata.youtube.com/feeds/api/videos/-/%7Bhttp%3A%2F%2Fgdata.youtube.com' .
               '%2Fschemas%2F2007%2Fdevelopertags.cat%7D' . "Helioviewer.org?orderby=published&start-index=$startIndex&max-results=$pageSize&safeSearch=strict";
        
        // Collect videos from the feed
        $videos = array();
        
        // Process video entries
        foreach($yt->getVideoFeed($url) as $videoEntry) {
            $id = $videoEntry->getVideoId();

            // Check to make sure video was not removed by the user
            $handle = curl_init("http://gdata.youtube.com/feeds/api/videos/$id?v=2");
            curl_setopt($handle, CURLOPT_RETURNTRANSFER, TRUE);
            
            $response = curl_exec($handle);
            $httpCode = curl_getinfo($handle, CURLINFO_HTTP_CODE);

            curl_close($handle);

            // Only add videos with response code 200
            if ($httpCode == 200) {
                array_push($videos, array(
                    "id"      => $id,
                    "watch"   => $videoEntry->getVideoWatchPageUrl(),
                    "flash"   => $videoEntry->getFlashPlayerUrl(),
                    "thumbnails" => $videoEntry->getVideoThumbnails(),
                    "published"  => $videoEntry->getPublished()->getText()
                ));
            }
        }
        header('Content-type: application/json');
        echo json_encode($videos);        
    }

    /**
     * Gets the movie url and loads it into Kaltura
     * 
     * TODO: 12/07/2010:
     *  Include video duration (send via client, or write to file in video directory. eventually will go in db).
     *  Use id instead of filepath? (will still need to treat id as a filepath when validating)
     *
     * @return void
     */
    public function playMovie ()
    {
        $fullpath = HV_CACHE_DIR . "/movies/" . $this->_params['file'];

        // Make sure it exists
        if (!file_exists($fullpath)) {
            throw new Exception("Invalid movie requested");
        }
        
        // Relative path to video
        $relpath  = substr(str_replace(HV_ROOT_DIR, "..", $fullpath), 0, -4);

        // Get video dimensions
        list($width, $height) = $this->_getVideoDimensions($fullpath);
        
        // Use specified dimensions if set (Simplifies fitting in Helioviewer.org)
        if (isset($this->_options['width'])) {
            $width = $this->_options['width'];
        }
        if (isset($this->_options['height'])) {
            $height = $this->_options['height'];
        }
        
        $css = "width: {$width}px; height: {$height}px;";
        
        $durationHint = isset($this->_options['duration']) ? "durationHint=\"{$this->_options['duration']}\"" : "";
        
        // For MC Media Player
        $url = HV_CACHE_URL . "/movies/" . $this->_params['file'];

        ?>
        <!DOCTYPE html> 
        <html> 
        <head> 
            <title>Helioviewer.org - <?php echo $this->_params['file']?></title>            
            <!--<script type="text/javascript" src="http://html5.kaltura.org/js"></script> 
            <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.js" type="text/javascript"></script>-->
        </head> 
        <body>
        
        <!-- 2010/12/21 Going back to MC Media player for now for better full screen experience -->
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
            <script type="text/javascript" src="http://www.mcmediaplayer.com/public/mcmp_0.8.js"></script>
        </div>
        <br>
        <!--
        <div style="text-align: center;">
            <div style="margin-left: auto; margin-right: auto; <?php echo $css;?>">
                <video style="margin-left: auto; margin-right: auto; <?php echo $css;?>" <?php echo "poster=\"$relpath.png\" $durationHint"?>>
                    <source src="<?php echo "$relpath.mp4"?>" /> 
                    <source src="<?php echo "$relpath.flv"?>" /> 
                </video>
            </div>
        </div>-->
        </body> 
        </html> 
        <?php
    }
    
    /**
     * Determines the height and width for a given video
     * 
     * @param string $file Video filepath
     * 
     * @return array The width and height corresponding with the specified video
     */
    private function _getVideoDimensions($file)
    {
        $imageDimensions = getimagesize(substr($file, 0, -3) . "png");
        
        $width  = $imageDimensions[0];
        $height = $imageDimensions[1];
        
        // Videos dimensions are multiples of two
        if ($width % 2 === 1) {
            $width += 1;
        }
        if ($height % 2 === 1) {
            $height += 1;
        }
        
        return array($width, $height);
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
                "required" => array('id', 'startTime', 'endTime', 'layers', 'imageScale', 'x1', 'x2', 'y1', 'y2'),
                "optional" => array('display', 'format', 'frameRate', 'maxFrames', 'watermarkOn'),
                "bools"    => array('display', 'watermarkOn'),
                "dates"    => array('startTime', 'endTime'),
                "floats"   => array('imageScale', 'x1', 'x2', 'y1', 'y2'),
                "ints"     => array('id', 'frameRate', 'maxFrames')
            );
            break;
        case "playMovie":
            $expected = array(
                "required" => array('file'),
                "optional" => array('duration', 'width', 'height'),
                "files"    => array('file'),
                "floats"   => array('duration'),
                "ints"     => array('width', 'height')
            );
            break;
        case "queueMovie":
            $expected = array(
                "required" => array('startTime', 'endTime', 'layers', 'imageScale', 'x1', 'x2', 'y1', 'y2'),
                "optional" => array('display', 'format', 'frameRate', 'maxFrames', 'watermarkOn'),
                "bools"    => array('display', 'watermarkOn'),
                "dates"    => array('startTime', 'endTime'),
                "floats"   => array('imageScale', 'x1', 'x2', 'y1', 'y2'),
                "ints"     => array('frameRate', 'maxFrames')
            );
            break;
        case "uploadMovieToYouTube":
            $expected = array(
                "required" => array('file'),
                "optional" => array('title', 'description', 'tags', 'share', 'token', 'ready', 'dialogMode'),
                "files"    => array('file'),
                "bools"    => array('share', 'ready', 'dialogMode')
            
            );
            break;
        case "getUserVideos":
            $expected = array(
                "optional" => array('pageSize', 'pageNum'),
                "ints"     => array('pageSize', 'pageNum')
            );
            break;
        case "checkYouTubeAuth":
            $expected = array ();
            break;
        default:
            break;
        }

        // Check input
        if (isset($expected)) {
            Validation_InputValidator::checkInput($expected, $this->_params, $this->_options);
        }

        return true;
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
                <a href="index.php#MovieAPI">Movie API</a>
                <ul>
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
        ?>
        <!-- Movie API -->
        <div id="MovieAPI">
            <h1>Movie API:</h1>
            <p>The movie API allows users to create time-lapse videos of what they are viewing on the website. </p>
            <ol style="list-style-type: upper-latin;">
                <!-- Movie -->
                <li>
                <div id="buildMovie">Movie API
                <p>Returns filepaths to a flash video and a high quality video consisting of 10-100 movie frames. The movie frames are chosen by matching the closest image
                available at each step within the specified range of dates, and are automatically generated using the Screenshot API calls.</p>
        
                <br />
        
                <div class="summary-box"><span
                    style="text-decoration: underline;">Usage:</span><br />
                <br />
        
                <?php echo HV_API_ROOT_URL;?>?action=buildMovie<br />
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
                            <td>Desired ending timestamp of the movie. Time step and number of frames will be figured out from the range
                                between startTime and endTime.</td>
                        </tr>
                        <tr>
                            <td><b>imageScale</b></td>
                            <td><i>Float</i></td>
                            <td>The zoom scale of the images. Default scales that can be used are 0.6, 1.2, 2.4, and so on, increasing or decreasing by 
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
                            <td><b>numFrames</b></td>
                            <td><i>Integer</i></td>
                            <td><i>[Optional]</i> The maximum number of frames that will be used during movie creation. 
                                    You may have between 10 and 300 frames. The default value is 300.
                            </td>
                        </tr>
                        <tr>
                            <td><b>frameRate</b></td>
                            <td><i>Integer</i></td>
                            <td><i>[Optional]</i> The number of frames per second. The default value is 8.</td>
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
                <a href="<?php echo HV_API_ROOT_URL;?>?action=buildMovie&startTime=2010-03-01T12:12:12Z&endTime=2010-03-02T12:12:12Z&imageScale=21.04&layers=[3,1,100],[4,1,100]&x1=-5000&y1=-5000&x2=5000&y2=5000">
                    <?php echo HV_API_ROOT_URL;?>?action=buildMovie&startTime=2010-03-01T12:12:12Z&endTime=2010-03-04T12:12:12Z&imageScale=21.04&layers=[3,1,100],[4,1,100]&x1=-5000&y1=-5000&x2=5000&y2=5000
                </a>
                </span><br />
                <span class="example-url">
                <a href="<?php echo HV_API_ROOT_URL;?>?action=buildMovie&startTime=2010-03-01T12:12:12Z&endTime=2010-03-02T12:12:12Z&imageScale=21.04&layers=[SOHO,EIT,EIT,304,1,100],[SOHO,LASCO,C2,white-light,1,100]&x1=-5000&y1=-5000&x2=5000&y2=5000">
                    <?php echo HV_API_ROOT_URL;?>?action=buildMovie&startTime=2010-03-01T12:12:12Z&endTime=2010-03-04T12:12:12Z&imageScale=21.04&layers=[SOHO,EIT,EIT,304,1,100],[SOHO,LASCO,C2,white-light,1,100]&x1=-5000&y1=-5000&x2=5000&y2=5000
                </a>
                </span><br />
                <!--
                <span class="example-url">
                <i>iPod Video:</i><br /><br />
                <a href="<?php echo HV_API_ROOT_URL;?>?action=buildMovie&startTime=2010-03-01T12:12:12Z&endTime=2010-03-02T12:12:12Z&imageScale=8.416&layers=[1,1,100]&x1=-1347&y1=-1347&x2=1347&y2=1347&display=false&watermarkOn=false">
                    <?php echo HV_API_ROOT_URL;?>?action=buildMovie&startTime=2010-03-01T12:12:12Z&endTime=2010-03-04T12:12:12Z&imageScale=8.416&layers=[1,1,100]&x1=-1347&y1=-1347&x2=1347&y2=1347&display=false&watermarkOn=false
                </a>
                </span>
                 -->
                </div>
            </div>
        
            <br />
            <br />      
        </div>
        <?php
    }
}