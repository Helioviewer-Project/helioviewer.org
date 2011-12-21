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
        
        // Process request
        $movie = new Movie_HelioviewerMovie($this->_params['id'], $this->_params['format']);
        
        // Build the movie
        $movie->build();
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
        
        header('Content-type: application/json');
        
        // If the movie is finished return movie info
        if ($movie->status == "FINISHED") {            
            $response = $movie->getCompletedMovieInformation($verbose);
        } else if ($movie->status == "ERROR") {
            $response = array(
                "error" => "Sorry, we are unable to create your movie at this time. Please try again later."
            );
        } else {
            // Otherwise have the client try again in 60s
            // TODO 2011/04/25: Once HQ has been ported to PHP, eta should be estimated
            // instead of returning a static eta each time.
            $response = array(
                "status" => $movie->status,
                "eta"    => 60
            );
        }
        
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
        case "buildMovie":
            $expected = array(
                "required" => array('id', 'format'),
                "alphanum" => array('id', 'format')
            );
            break;
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
                "optional" => array('verbose'),
                "alphanum" => array('id', 'format'),
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
                "required" => array('startTime', 'endTime', 'layers', 'imageScale', 'x1', 'x2', 'y1', 'y2', 'format'),
                "optional" => array('frameRate', 'maxFrames', 'watermark'),
                "alphanum" => array('format'),
                "bools"    => array('watermark'),
                "dates"    => array('startTime', 'endTime'),
                "floats"   => array('imageScale', 'frameRate', 'x1', 'x2', 'y1', 'y2'),
                "ints"     => array('maxFrames')
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
                            <td><b>watermark</b></td>
                            <td><i>Boolean</i></td>
                            <td><i>[Optional]</i> Enables turning watermarking on or off. If watermark is set to false, the images will not be watermarked, 
                                which will speed up movie generation time but you will have no timestamps on the movie. If left blank, it defaults to true 
                                and images will be watermarked.</td>
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