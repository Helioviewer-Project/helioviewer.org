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
        
        // Update usage stats
        // TODO 2011/03/22: Generaltize statistics logging: move to index.php and create a list of actions to log
        // TODO 2011/03/24: Log stats at time of queuing to avoid overcounting movie requests
        if (HV_ENABLE_STATISTICS_COLLECTION) {
            include_once 'src/Database/Statistics.php';
            $statistics = new Database_Statistics();
            $statistics->log("buildMovie");
        }
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
        
        header('Content-type: application/json');
        
        // If the movie is finished return movie info
        if ($movie->status == "FINISHED") {            
            $response = $movie->getCompletedMovieInformation();
        } else if ($movie->status == "ERROR") {
            $response = array(
                "error" => "Sorry, we are unable to create your movie at this time. Please try again later."
            );
        } else {
            // Otherwise have the client try again in 15s
            // TODO 2011/04/25: Once HQ has been ported to PHP, eta should be estimated
            // instead of returning a static eta each time.
            $response = array(
                "status" => $movie->status,
                "eta"    => 15
            );
        }
        
        print json_encode($response);
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
        
        $file = $movie->getFilepath(true);

        $youtube = new Movie_YouTube();
        $youtube->uploadVideo($this->_params['id'], $file, $this->_options);
    }
    
    /**
     * Checks to see if Helioviewer.org is authorized to upload videos for a user
     */
    public function checkYouTubeAuth () {
        include_once 'src/Movie/YouTube.php';
        
        $youtube = new Movie_YouTube();

        header('Content-type: application/json');
        print json_encode($youtube->checkYouTubeAuth());
    }
    
    /**
     * Retrieves recent user-submitted videos from YouTube and returns the
     * result as a JSON array.
     */
    public function getUserVideos() {
        include_once 'src/Database/MovieDatabase.php';
        include_once 'src/Movie/HelioviewerMovie.php';
        
        $movies = new Database_MovieDatabase();

        // Default options
        $defaults = array(
            "pageSize" => 10,
            "pageNum"  => 1
        );
        $options = array_replace($defaults, $this->_options);

        $pageSize = $options['pageSize'];
        $pageNum  = $options['pageNum'];
                
         // Current page
        $startIndex = $pageSize * ($pageNum - 1);

        // PGet a list of recent videos
        $videos = array();
        
        foreach($movies->getSharedVideos($startIndex, $pageSize) as $video) {
            $youtubeId = $video['youtubeId'];
            $movieId   = $video['movieId'];
            
            // Load movie
            $movie = new Movie_HelioviewerMovie($movieId);
            
            // Check to make sure video was not removed by the user
            $handle = curl_init("http://gdata.youtube.com/feeds/api/videos/$youtubeId?v=2");
            curl_setopt($handle, CURLOPT_RETURNTRANSFER, TRUE);
            
            $response = curl_exec($handle);
            $httpCode = curl_getinfo($handle, CURLINFO_HTTP_CODE);

            curl_close($handle);

            // Only add videos with response code 200
            if ($httpCode == 200) {
                array_push($videos, array(
                    "id"  => $movieId,
                    "url" => "http://www.youtube.com/watch?v=$youtubeId&feature=youtube_gdata_player",
                    "thumbnails" => $movie->getPreviewImages(),
                    "timestamp"  => $video['timestamp']
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
        include_once 'src/Movie/HelioviewerMovie.php';
        
        // Load movie
        $movie = new Movie_HelioviewerMovie($this->_params['id'], 
                                            $this->_params['format']);
                                  
        // Default options
        $defaults = array(
            "hq" => false
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
        
        // Get filepath
        $filepath = $movie->getFilepath($options['hq']);
        $filename = basename($filepath);        
        
        //$css = "width: {$movie->width}px; height: {$movie->height}px;";
        //$durationHint = isset($this->_options['duration']) ? "durationHint=\"{$this->_options['duration']}\"" : "";
        
        // For MC Media Player
        $url = "http://www.helioviewer.org/api/?action=downloadMovie&id={movie->id}&format={$movie->format}";

        ?>
        <!DOCTYPE html> 
        <html> 
        <head> 
            <title>Helioviewer.org - <?php echo $filename?></title>            
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
                playerSize = "<?php print $movie->width . 'x' . $movie_>height?>";
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
                "alphanum" => array('format'),
                "ints"     => array('id')
            );
            break;
        case "downloadMovie":
            $expected = array(
                "required" => array('id', 'format'),
                "optional" => array('hq'),
                "alphanum" => array('format'),
                "bools"    => array('hq'),
                "ints"     => array('id')
            );
            break;
        case "getMovieStatus":
            $expected = array(
                "required" => array('id', 'format'),
                "alphanum" => array('format'),
                "ints"     => array('id')
            );
            break;
        case "playMovie":
            $expected = array(
                "required" => array('id', 'format'),
                "optional" => array('hq'),
                "alphanum" => array('format'),
                "bools"    => array('hq'),
                "ints"     => array('id')
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
                "optional" => array('title', 'description', 'tags', 'share', 'token', 'ready', 'dialogMode'),
                "ints"     => array('id'),
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