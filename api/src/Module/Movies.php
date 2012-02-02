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
     * Queues a request for a Helioviewer.org movie
     */
    public function queueMovie()
    {
        include_once 'lib/alphaID/alphaID.php';
        include_once 'lib/Resque.php';
        include_once 'lib/Redisent/Redisent.php';
        include_once 'src/Helper/HelioviewerLayers.php';
        include_once 'src/Database/MovieDatabase.php';
        include_once 'src/Database/ImgIndex.php';

        // If the queue is currently full, don't process the request
        $queueSize = Resque::size('on_demand_movie');
        if ($queueSize >= MOVIE_QUEUE_MAX_SIZE) {
            throw new Exception("Sorry, due to current high demand, we are currently unable to process your request. " .
                                "Please try again later.");
        }
        
        // Default options
        $defaults = array(
            "format"      => "mp4",
            "frameRate"   => NULL,
            "movieLength" => NULL,
            "maxFrames"   => HV_MAX_MOVIE_FRAMES,
            "watermark"   => TRUE
        );
        $options = array_replace($defaults, $this->_options);
        
        // Limit movies to three layers
        $layers = new Helper_HelioviewerLayers($this->_params['layers']);
        if ($layers->length() < 1 || $layers->length() > 3) {
            throw new Exception("Invalid layer choices! You must specify 1-3 comma-separated layer names.");
        }

        // Max number of frames
        $maxFrames = min($this->_getMaxFrames($queueSize), $options['maxFrames']);
        
        // Create a connection to the database
        $db = new Database_ImgIndex();
        $movieDb = new Database_MovieDatabase();
        
        // Estimate the number of frames
        $numFrames = $this->_estimateNumFrames($db, $layers, $this->_params['startTime'], $this->_params['endTime']);
        $numFrames = min($numFrames, $maxFrames);
        
        // Estimate the time to create movie frames
        $estBuildTime = (int) (MOVIE_EST_TIME_PER_FRAME * $numFrames);
        
        // Determine the ROI
        $roi = $this->_getMovieROI($options);

        // Get datasource bitmask
        $bitmask = bindec($layers->getBitMask());
        
        // Create entry in the movies table in MySQL
        $dbId = $movieDb->insertMovie($this->_params['startTime'], $this->_params['endTime'], $this->_params['imageScale'], $roi, $maxFrames,
                                      $options['watermark'], $this->_params['layers'], $bitmask, $options['frameRate'],
                                      $options['movieLength']);

        // Convert id
        $publicId = alphaID($dbId, false, 5, HV_MOVIE_ID_PASS);

        // Queue movie request
        $args = array(
            'movieId' => $publicId,
            'eta'     => $estBuildTime,
            'format'  => $options['format']
        );
        $token = Resque::enqueue('on_demand_movie', 'Job_MovieBuilder', $args, TRUE);
        
        // Create entries for each version of the movie in the movieFormats table
        foreach(array('mp4', 'webm') as $format) {
            $movieDb->insertMovieFormat($dbId, $format);
        }

        // Update queue wait time
        $redis = new Redisent('localhost');
        $eta = $redis->incrby('helioviewer:movie_queue_wait', $estBuildTime);
        
        // Print response
        $response = array(
            "id"    => $publicId,
            "eta"   => $eta, 
            "token" => $token
        );
        header('Content-type: application/json');
        print json_encode($response);
    }

    /**
     * Determines the maximum number of frames allowed based on the current queue size
     */
    private function _getMaxFrames($queueSize)
    {
        // Limit max frames if the number of queued movies exceeds one of the specified throttles.
        if ($queueSize >= MOVIE_QUEUE_THROTTLE_TWO) {
            return HV_MAX_MOVIE_FRAMES / 2;
        } elseif ($queueSize >= MOVIE_QUEUE_THROTTLE_ONE) {
            return (HV_MAX_MOVIE_FRAMES * 3) / 4;
        }
        return HV_MAX_MOVIE_FRAMES;        
    }
    
    /**
     * Returns the region of interest for the movie request or throws an error if one was not properly specified.
     */
    private function _getMovieROI($options) {
        include_once 'src/Helper/RegionOfInterest.php';

        // Region of interest (center in arcseconds and dimensions in pixels)
        if ($options['x1'] && $options['y1'] && $options['x2'] && $options['y2']) {
            $x1 = $options['x1'];
            $y1 = $options['y1'];
            $x2 = $options['x2'];
            $y2 = $options['y2'];
        } elseif ($options['x0'] and $options['y0'] and $options['width'] and $options['height']) {
            // Region of interest (top-left and bottom-right coords in arcseconds)
            $x1 = $options['x0'] - 0.5 * $options['width'] * $this->_params['imageScale'];
            $y1 = $options['y0'] - 0.5 * $options['height'] * $this->_params['imageScale'];
            $x2 = $options['x0'] + 0.5 * $options['width'] * $this->_params['imageScale'];
            $y2 = $options['y0'] + 0.5 * $options['height'] * $this->_params['imageScale'];
        } else {
            throw new Exception("Region of interest not properly specified.");
        }

        $roi = new Helper_RegionOfInterest($x1, $y1, $x2, $y2, $this->_params['imageScale']);

        return $roi->getPolygonString();
    }
    
    /**
     * Estimates the number of frames that a movie will include
     * 
     * Determines how many frames will be included in the movie and then uses that along with some other
     * information about the nature of the request to come up with an estimated time it will take to build
     * the requested movie.
     * 
     * NOTE: This is only a temporary work-around. An ideal solution will make use of prior actual movie generation 
     * times and will not require use of manually-selected system-dependent coefficients
     */
    private function _estimateNumFrames($db, $layers, $startTime, $endTime)
    {
        $numFrames = 0;
        $sql =  "SELECT COUNT(*) FROM images WHERE DATE BETWEEN '%s' AND '%s' AND sourceId=%d;";
        
        // Estimate number of movies frames for each layer
        foreach($layers->toArray() as $layer) {
            $numFrames += $db->getImageCount($startTime, $endTime, $layer['sourceId']);
        }

        // Raise an error if few or no frames were found for the request range and data sources
        if ($numFrames == 0) {
            throw new Exception("No images found for requested time range. Please try a different time.");
        } else if ($numFrames <= 3) {
            throw new Exception("Insufficient data was found for the requested time range. Please try a different time.");
        }
        return $numFrames;
    }

    /**
     * Checks to see if the requested movie is available and if so returns
     * it as a file-attachment
     * 
     * @return file Requested movie
     */
    public function downloadMovie ()
    {
        include_once 'src/Movie/HelioviewerMovie.php';
        
        // Load movie
        $movie = new Movie_HelioviewerMovie($this->_params['id'], 
                                            $this->_params['format']);
                                  
        // Default options
        $defaults = array(
            "hq" => false
        );
        $options = array_replace($defaults, $this->_options);
        
        
        // If the movie is finished return the file as an attachment
        if ($movie->status == "FINISHED") {
            // Get filepath
            $filepath = $movie->getFilepath($options['hq']);
            $filename = basename($filepath);
            
            // Set HTTP headers
            header("Pragma: public");
            header("Expires: 0");
            header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
            header("Cache-Control: private", false);
            header("Content-Disposition: attachment; filename=\"" . $filename . "\"");
            header("Content-Transfer-Encoding: binary");
            header("Content-Length: " . filesize($filepath));
            header("Content-type: video/" . $this->_params['format']);
            
            // Return movie data
            echo file_get_contents($filepath);
            
        // Otherwise return an error
        } else {
            header('Content-type: application/json');
            $response = array(
                "error" => "The movie you requested is either being processed
                            or does not exist."
            );
            print json_encode($response);
        }
    }
    
    /**
     * Checks to see if a movie is available and returns either a link to the movie if it is ready or progress
     * information otherwise
     * 
     * @return void
     */
    public function getMovieStatus ()
    {
        include_once 'src/Movie/HelioviewerMovie.php';
        
        // Process request
        $movie = new Movie_HelioviewerMovie($this->_params['id'], $this->_params['format']);
        $verbose = isset($this->_options['verbose']) ? $this->_options['verbose'] : false;
        
        // FINISHED
        if ($movie->status == "FINISHED") {            
            $response = $movie->getCompletedMovieInformation($verbose);
        } else if ($movie->status == "ERROR") {
            // ERROR
            $response = array(
                "error" => "Sorry, we are unable to create your movie at this time. Please try again later."
            );
        } else if ($movie->status == "QUEUED") {
            // QUEUED
            if (isset($this->_options['token'])) {
                // with token
                require_once 'lib/Resque.php';
                $status = new Resque_Job_Status($this->_options['token']);
                // TODO
            } else {
                // without token
                $response = array("status" => "QUEUED");
            }
        } else {
            // PROCESSING
            //$dir = 
            // If movie encoding has not been started, check frames
            //if (sizeOf(glob(HV)) == 0) {
                
            //}
            $response = array(
                "status" => "PROCESSING",
                "eta"    => 60
            );
        }
        
        header('Content-type: application/json');
        print json_encode($response);
    }
    
    /**
     * Checks to see if Helioviewer.org is authorized to upload videos for a user
     */
    public function checkYouTubeAuth ()
    {
        include_once 'src/Movie/YouTube.php';
        
        $youtube = new Movie_YouTube();

        header('Content-type: application/json');
        print json_encode($youtube->checkYouTubeAuth());
    }

    /**
     * Requests authorization for Helioviewer.org to upload videos on behalf
     * of the user.
     */
    public function getYouTubeAuth()
    {
        include_once 'src/Movie/YouTube.php';
        
        $share = isset($this->_options['share']) ? $this->_options['share'] : false;
        
        session_start();

        // Discard any existing authorization
        unset($_SESSION['sessionToken']);

        // Store form data for later use        
        $_SESSION['video-id'] = $this->_params["id"];
        $_SESSION['video-title'] = $this->_params["title"];
        $_SESSION['video-description'] = $this->_params["description"];
        $_SESSION['video-tags'] = $this->_params["tags"];
        $_SESSION['video-share'] = $share;
        
        $youtube = new Movie_YouTube();
        $youtube->getYouTubeAuth($this->_params['id']);
    }
    
    /**
     * Uploads a user-created video to YouTube
     * 
     * TODO 2011/05/09: Make sure movie hasn't already been uploaded
     */
    public function uploadMovieToYouTube ()
    {
        include_once 'src/Movie/HelioviewerMovie.php';
        include_once 'src/Movie/YouTube.php';
        
        // Process request
        $movie = new Movie_HelioviewerMovie($this->_params['id'], "mp4");
        
        if ($movie->status !== "FINISHED") {
            throw new Exception("Invalid movie requested");
        }
        
        // If this was not the first upload for the current session, then
        // the form data will have been passed in as GET variables
        if (isset($this->_options["title"])) {
            $id          = $this->_params["id"];
            $title       = $this->_options["title"];
            $description = $this->_options["description"];
            $tags        = $this->_options["tags"];
            $share       = isset($this->_options['share']) ? $this->_options['share'] : false;
        } else {
            // Otherwise read form data back in from session variables
            session_start();

            $id          = $_SESSION['video-id'];
            $title       = $_SESSION['video-title'];
            $description = $_SESSION['video-description'];
            $tags        = $_SESSION['video-tags'];
            $share       = $_SESSION['video-share'];
            
            if (!isset($_SESSION['video-title'])) {
                $msg = "Error encountered during authentication. ". 
                       "<a href='https://accounts.google.com/IssuedAuthSubTokens'>Revoke a</a> " . 
                       "for Helioviewer.org in your Google settings page and try again.</a>";
                throw new Exception($msg);
            }
        }
        
        // Output format
        if (isset($this->_options['html']) && $this->_options['html']) {
            $html = true;
        } else {
            $html = false;
        }
        
        $youtube = new Movie_YouTube();
        $video = $youtube->uploadVideo($movie, $id, $title, $description, $tags, $share, $html);
    }
    
    /**
     * Retrieves recent user-submitted videos from YouTube and returns the
     * result as a JSON array.
     */
    public function getUserVideos()
    {
        include_once 'src/Database/MovieDatabase.php';
        include_once 'src/Movie/HelioviewerMovie.php';
        include_once 'lib/alphaID/alphaID.php';
        
        $movies = new Database_MovieDatabase();

        // Default options
        $defaults = array(
            "num" => 10,
            "since" => '1000/01/01T00:00:00.000Z'
        );
        $opts = array_replace($defaults, $this->_options);
                
        // Get a list of recent videos
        $videos = array();
        
        foreach($movies->getSharedVideos($opts['num'], $opts['since']) as $video) {
            $youtubeId = $video['youtubeId'];
            $movieId   = (int) $video['movieId'];
             
            // Convert id
            $publicId = alphaID($movieId, false, 5, HV_MOVIE_ID_PASS);
            
            // Load movie
            $movie = new Movie_HelioviewerMovie($publicId);
            
            // Check to make sure video was not removed by the user
            // 2011/06/08: Disabling for now since this delays time before videos
            // $handle = curl_init("http://gdata.youtube.com/feeds/api/videos/$youtubeId?v=2");
            // curl_setopt($handle, CURLOPT_RETURNTRANSFER, TRUE);

            // $response = curl_exec($handle);
            // $httpCode = curl_getinfo($handle, CURLINFO_HTTP_CODE);

            //curl_close($handle);

            // Only add videos with response code 200
            //if ($httpCode == 200) {
            array_push($videos, array(
                "id"  => $publicId,
                "url" => "http://www.youtube.com/watch?v=$youtubeId",
                "thumbnails" => $movie->getPreviewImages(),
                "published"  => $video['timestamp']
            ));
            //}
        }

        // HTML
        /**if ($options['html']) {
            foreach ($videos as $vid) {
                printf("<a href='%s'><img src='%s' /><h3>%s</h3></a>", $vid["url"], $vid["thumbnails"]["small"], "test");
            }
        } else {**/
        header('Content-type: application/json');
        echo json_encode($videos);
    }

    /**
     * Generates HTML for a video player with the specified movie loaded
     *
     * 2011/05/25
     * Using direct links to movies to enable support for byte range requests
     * and provide a better movie experience in Chromium.
     *  
     * See: https://groups.google.com/a/webmproject.org/group/webm-discuss
     * /browse_thread/thread/061f3ffa200d26a9/1ce5f06c76c9cb2d#1ce5f06c76c9cb2d
     *
     * @return void
     */
    public function playMovie ()
    {
        include_once 'src/Movie/HelioviewerMovie.php';
        
        // Load movie
        $movie = new Movie_HelioviewerMovie($this->_params['id'], 
                                            $this->_params['format']);
                                  
        // Default options
        $defaults = array(
            "hq"     => false,
            "width"  => $movie->width,
            "height" => $movie->height
        );
        $options = array_replace($defaults, $this->_options);

        // Return an error if movie is not available
        if ($movie->status != "FINISHED") {
            header('Content-type: application/json');
            $response = array(
                "error" => "The movie you requested is either being processed
                            or does not exist."
            );
            print json_encode($response);
            return;
        }

        $dimensions = sprintf("width: %dpx; height: %dpx;",
            $options['width'], $options['height']);

        // Get filepath
        $filepath = $movie->getFilepath($options['hq']);
        $filename = basename($filepath);  
        
        // Movie URL
        $url = ".." . str_replace(HV_ROOT_DIR, "", $filepath);
        ?>
<!DOCTYPE html> 
<html> 
<head> 
    <title>Helioviewer.org - <?php echo $filename?></title>
    <script src="../lib/flowplayer/flowplayer-3.2.6.js"></script>            
</head> 
<body>
    <!-- Movie player -->
    <div href="<?php echo urlencode($url);?>" 
       style="display:block; <?php print $dimensions;?>"
       id="movie-player">
    </div>
    <br>
    <script language="javascript">
        flowplayer("movie-player", "../lib/flowplayer/flowplayer-3.2.7.swf", {
            clip: {
                autoBuffering: true,
                scaling: "fit"
            }
        });
    </script>
</body> 
</html> 
        <?php
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
        case "downloadMovie":
            $expected = array(
                "required" => array('id', 'format'),
                "optional" => array('hq'),
                "alphanum" => array('id', 'format'),
                "bools"    => array('hq')
            );
            break;
        case "getMovieStatus":
            $expected = array(
                "required" => array('id', 'format'),
                "optional" => array('verbose', 'token'),
                "alphanum" => array('id', 'format', 'token'),
                "bools"    => array('verbose')
                
            );
            break;
        case "playMovie":
            $expected = array(
                "required" => array('id', 'format'),
                "optional" => array('hq', 'width', 'height'),
                "alphanum" => array('id', 'format'),
                "bools"    => array('hq'),
                "ints"     => array('width', 'height')
            );
            break;
        case "queueMovie":
            $expected = array(
                "required" => array('startTime', 'endTime', 'layers', 'imageScale'),
                "optional" => array('format', 'frameRate', 'maxFrames', 'movieLength', 'watermark', 'width', 'height', 'x0', 'y0', 'x1', 'x2', 'y1', 'y2'),
                "alphanum" => array('format'),
                "bools"    => array('watermark'),
                "dates"    => array('startTime', 'endTime'),
                "floats"   => array('imageScale', 'frameRate', 'movieLength', 'x0', 'y0', 'x1', 'x2', 'y1', 'y2'),
                "ints"     => array('maxFrames', 'width', 'height')
            );
            break;
        case "uploadMovieToYouTube":
            $expected = array(
                "required" => array('id'),
                "optional" => array('title', 'description', 'tags', 'share', 'token', 'html'),
                "alphanum" => array('id'),
                "bools"    => array('share', 'html')
            );
            break;
        case "getUserVideos":
            $expected = array(
                "optional" => array('num', 'since'),
                "ints"     => array('num'),
                "dates"    => array('since')
            );
            break;
        case "checkYouTubeAuth":
            $expected = array();
            break;
        case "getYouTubeAuth":
            $expected = array(
                "required" => array('id', 'title', 'description', 'tags'),
                "optional" => array('share'),
                "alphanum" => array('id'),
                "bools"    => array('share')
            );
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
                    <li><a href="index.php#queueMovie">Creating a Movie</a></li>
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
                <div id="queueMovie">Movie API
                <p>Returns filepaths to a flash video and a high quality video consisting of 10-100 movie frames. The movie frames are chosen by matching the closest image
                available at each step within the specified range of dates, and are automatically generated using the Screenshot API calls.</p>
        
                <br />
        
                <div class="summary-box"><span
                    style="text-decoration: underline;">Usage:</span><br />
                <br />
        
                <?php echo HV_API_ROOT_URL;?>?action=queueMovie<br />
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
                            <td><i>[Optional]</i>The maximum number of frames that will be used during movie creation. 
                                    You may have between 10 and 300 frames. The default value is 300.
                            </td>
                        </tr>
                        <tr>
                            <td><b>frameRate</b></td>
                            <td><i>Float</i></td>
                            <td><i>[Optional]</i>The number of frames per second. The default value is 15.</td>
                        </tr>
                        <tr>
                            <td><b>movieLength</b></td>
                            <td><i>Float</i></td>
                            <td><i>[Optional]</i>The length in seconds of the video to be produced.</td>
                        </tr>
                        <tr>
                            <td><b>watermark</b></td>
                            <td><i>Boolean</i></td>
                            <td><i>[Optional]</i> Enables turning watermarking on or off. If watermark is set to false, the images will not be watermarked, 
                                which will speed up movie generation time but you will have no timestamps on the movie. If left blank, it defaults to true 
                                and images will be watermarked.</td>
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
                <a href="<?php echo HV_API_ROOT_URL;?>?action=queueMovie&startTime=2010-03-01T12:12:12Z&endTime=2010-03-02T12:12:12Z&imageScale=21.04&layers=[3,1,100],[4,1,100]&x1=-5000&y1=-5000&x2=5000&y2=5000">
                    <?php echo HV_API_ROOT_URL;?>?action=queueMovie&startTime=2010-03-01T12:12:12Z&endTime=2010-03-04T12:12:12Z&imageScale=21.04&layers=[3,1,100],[4,1,100]&x1=-5000&y1=-5000&x2=5000&y2=5000
                </a>
                </span><br />
                <span class="example-url">
                <a href="<?php echo HV_API_ROOT_URL;?>?action=queueMovie&startTime=2010-03-01T12:12:12Z&endTime=2010-03-02T12:12:12Z&imageScale=21.04&layers=[SOHO,EIT,EIT,304,1,100],[SOHO,LASCO,C2,white-light,1,100]&x1=-5000&y1=-5000&x2=5000&y2=5000">
                    <?php echo HV_API_ROOT_URL;?>?action=queueMovie&startTime=2010-03-01T12:12:12Z&endTime=2010-03-04T12:12:12Z&imageScale=21.04&layers=[SOHO,EIT,EIT,304,1,100],[SOHO,LASCO,C2,white-light,1,100]&x1=-5000&y1=-5000&x2=5000&y2=5000
                </a>
                </span><br />
                <!--
                <span class="example-url">
                <i>iPod Video:</i><br /><br />
                <a href="<?php echo HV_API_ROOT_URL;?>?action=queueMovie&startTime=2010-03-01T12:12:12Z&endTime=2010-03-02T12:12:12Z&imageScale=8.416&layers=[1,1,100]&x1=-1347&y1=-1347&x2=1347&y2=1347&display=false&watermark=false">
                    <?php echo HV_API_ROOT_URL;?>?action=queueMovie&startTime=2010-03-01T12:12:12Z&endTime=2010-03-04T12:12:12Z&imageScale=8.416&layers=[1,1,100]&x1=-1347&y1=-1347&x2=1347&y2=1347&display=false&watermark=false
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