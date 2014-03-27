<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Helioviewer Movies Module class definition
 *
 * PHP version 5
 *
 * @category Configuration
 * @package  Helioviewer
 * @author   Jeff Stys <jeff.stys@nasa.gov>
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
 * @author   Jeff Stys <jeff.stys@nasa.gov>
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @author   Jaclyn Beck <jaclyn.r.beck@gmail.com>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 *
 */
class Module_Movies implements Module {

    private $_params;
    private $_options;

    /**
     * Movie module constructor
     *
     * @param mixed &$params API request parameters
     */
    public function __construct(&$params) {
        $this->_params  = $params;
        $this->_options = array();
    }

    /**
     * execute
     *
     * @return void
     */
    public function execute() {
        if ($this->validate()) {
            try {
                $this->{$this->_params['action']}();
            }
            catch (Exception $e) {
                handleError($e->getMessage(), $e->getCode());
            }
        }
    }

    /**
     * Queues a request for a Helioviewer.org movie
     */
    public function queueMovie() {
        include_once 'lib/alphaID/alphaID.php';
        include_once 'lib/Resque.php';
        include_once 'lib/Redisent/Redisent.php';
        include_once 'src/Helper/HelioviewerLayers.php';
        include_once 'src/Helper/HelioviewerEvents.php';
        include_once 'src/Database/MovieDatabase.php';
        include_once 'src/Database/ImgIndex.php';

        // Connect to redis
        $redis = new Redisent('localhost');

        // If the queue is currently full, don't process the request
        $queueSize = Resque::size('on_demand_movie');
        if ( $queueSize >= MOVIE_QUEUE_MAX_SIZE ) {
            throw new Exception(
                'Sorry, due to current high demand, we are currently unable ' .
                'to process your request. Please try again later.', 40);
        }

        // Get current number of on_demand_movie workers
        $workers = Resque::redis()->smembers('workers');
        $movieWorkers = array_filter($workers, function ($elem) {
            return strpos($elem, 'on_demand_movie') !== false;
        });

        // Default options
        $defaults = array(
            "format"      => 'mp4',
            "frameRate"   => null,
            "movieLength" => null,
            "maxFrames"   => HV_MAX_MOVIE_FRAMES,
            "watermark"   => true,
            "scale"       => false,
            "scaleType"   => 'earth',
            "scaleX"      => 0,
            "scaleY"      => 0
        );
        $options = array_replace($defaults, $this->_options);

        // Default to 15fps if no frame-rate or length was specified
        if ( is_null($options['frameRate']) &&
             is_null($options['movieLength'])) {

            $options['frameRate'] = 15;
        }

        // Limit movies to three layers
        $layers = new Helper_HelioviewerLayers($this->_params['layers']);
        if ( $layers->length() < 1 || $layers->length() > 3 ) {
            throw new Exception(
                'Invalid layer choices! You must specify 1-3 comma-separated '.
                'layer names.', 22);
        }

        $events = new Helper_HelioviewerEvents($this->_params['events']);

        // TODO 2012/04/11
        // Discard any layers which do not share an overlap with the roi to
        // avoid generating kdu_expand errors later. Check is performed already
        // on front-end, but should also be done before queuing a request.

        // Determine the ROI
        $roi       = $this->_getMovieROI($options);
        $roiString = $roi->getPolygonString();

        $numPixels = $roi->getPixelWidth() * $roi->getPixelHeight();

        // Use reduce image scale if necessary
        $imageScale = $roi->imageScale();

        // Max number of frames
        $maxFrames = min($this->_getMaxFrames($queueSize),
            $options['maxFrames']);

        // Create a connection to the database
        $db = new Database_ImgIndex();
        $movieDb = new Database_MovieDatabase();

        // Estimate the number of frames
        $numFrames = $this->_estimateNumFrames($db, $layers,
            $this->_params['startTime'], $this->_params['endTime']);
        $numFrames = min($numFrames, $maxFrames);

        // Estimate the time to create movie frames
        // @TODO 06/2012: Factor in total number of workers and number of
        //                workers that are currently available?
        $estBuildTime = $this->_estimateMovieBuildTime($movieDb, $numFrames,
            $numPixels, $options['format']);

        // If all workers are in use, increment and use estimated wait counter
        if ( $queueSize +1 >= sizeOf($movieWorkers) ) {
            $eta = $redis->incrby('helioviewer:movie_queue_wait',
                $estBuildTime);
            $updateCounter = true;
        }
        else {
            // Otherwise simply use the time estimated for the single movie
            $eta = $estBuildTime;
            $updateCounter = false;
        }

        // Get datasource bitmask
        $bitmask = bindec($layers->getBitMask());

        // Create entry in the movies table in MySQL
        $dbId = $movieDb->insertMovie(
            $this->_params['startTime'],
            $this->_params['endTime'],
            $imageScale,
            $roiString,
            $maxFrames,
            $options['watermark'],
            $this->_params['layers'],
            $bitmask,
            $this->_params['events'],
            $this->_params['eventsLabels'],
            $options['scale'],
            $options['scaleType'],
            $options['scaleX'],
            $options['scaleY'],
            $layers->length(),
            $queueSize,
            $options['frameRate'],
            $options['movieLength'] );

        // Convert id
        $publicId = alphaID($dbId, false, 5, HV_MOVIE_ID_PASS);

        // Queue movie request
        $args = array(
            'movieId' => $publicId,
            'eta'     => $estBuildTime,
            'format'  => $options['format'],
            'counter' => $updateCounter
        );
        $token = Resque::enqueue('on_demand_movie', 'Job_MovieBuilder',
            $args, true);

        // Create entries for each version of the movie in the movieFormats
        // table
        foreach(array('mp4', 'webm') as $format) {
            $movieDb->insertMovieFormat($dbId, $format);
        }

        // Print response
        $response = array(
            'id'    => $publicId,
            'eta'   => $eta,
            'queue' => max(0, $queueSize + 1 - sizeOf($movieWorkers)),
            'token' => $token
        );

        $this->_printJSON(json_encode($response));
    }

    /**
     * Estimates the amount of time (in seconds) it will take to build the
     * requested movie using information about the most recent n movies
     * created.
     */
    private function _estimateMovieBuildTime($movieDb, $numFrames, $numPixels,
        $format) {

        // Weights for influence of the number of frames/pixels on the
        // esimated time
        $w1 = 0.7;
        $w2 = 0.3;

        // Get stats for most recent 100 completed movie requests
        $stats = $movieDb->getMovieStatistics();

        // If no movie statistics have been collected yet, skip this step
        if (sizeOf($stats['time']) === 0) {
            return 30;
        }

        // Calculate linear fit for number of frames and pixel area
        $l1 = $this->_linear_regression($stats['numFrames'], $stats['time']);
        $l2 = $this->_linear_regression($stats['numPixels'], $stats['time']);

        // Estimate time to build movie frames
        $frameEst = ($w1 * ($l1['m'] * $numFrames + $l1['b']) +
                     $w2 * ($l2['m'] * $numPixels + $l2['b']));

        // Estimate time to encode movie
        // Since the time required to encode the video is much smaller than the
        // time to build the frames the parameters of this estimation are
        // hard-coded for now to save time (Feb 15, 2012)

        // MP4, WebM
        $encodingEst = max(1, 0.066 * $numFrames + 0.778) +
                       max(1, 0.094 * $numFrames + 2.298);

        // Scale by pixel area
        $encodingEst = ($numPixels / (1920 * 1200)) * $encodingEst;

        return (int) max(10, ($frameEst + $encodingEst));
    }

    /**
     * Linear regression function
     *
     * @param $x array x-coords
     * @param $y array y-coords
     *
     * @returns array() m=>slope, b=>intercept
     *
     * richardathome.wordpress.com/2006/01/25/a-php-linear-regression-function/
     */
    private function _linear_regression($x, $y) {
        $n = count($x);

        // calculate sums
        $x_sum = array_sum($x);
        $y_sum = array_sum($y);

        $xx_sum = 0;
        $xy_sum = 0;

        for($i = 0; $i < $n; $i++) {
            $xy_sum += ($x[$i] * $y[$i]);
            $xx_sum += ($x[$i] * $x[$i]);
        }

        // Calculate slope
        $divisor = (($n * $xx_sum) - ($x_sum * $x_sum));

        if ($divisor == 0) {
            $m = 0;
        }
        else {
            $m = (($n * $xy_sum) - ($x_sum * $y_sum)) / $divisor;
        }

        // Calculate intercept
        $b = ($y_sum - ($m * $x_sum)) / $n;

        // Return result
        return array('m'=>$m, 'b'=>$b);
    }

    /**
     * Determines the maximum number of frames allowed based on the current
     * queue size
     */
    private function _getMaxFrames($queueSize) {

        // Limit max frames if the number of queued movies exceeds one of the
        // specified throttles.
        if ( $queueSize >= MOVIE_QUEUE_THROTTLE_TWO ) {
            return HV_MAX_MOVIE_FRAMES / 2;
        }
        else if ( $queueSize >= MOVIE_QUEUE_THROTTLE_ONE ) {
            return (HV_MAX_MOVIE_FRAMES * 3) / 4;
        }

        return HV_MAX_MOVIE_FRAMES;
    }

    /**
     * Returns the region of interest for the movie request or throws an error
     * if one was not properly specified.
     */
    private function _getMovieROI($options) {
        include_once 'src/Helper/RegionOfInterest.php';

        // Region of interest (center in arcseconds and dimensions in pixels)
        if (isset($options['x1']) && isset($options['y1']) &&
            isset($options['x2']) && isset($options['y2'])) {

            $x1 = $options['x1'];
            $y1 = $options['y1'];
            $x2 = $options['x2'];
            $y2 = $options['y2'];
        }
        else if ( isset($options['x0'])    && isset($options['y0']) &&
                  isset($options['width']) && isset($options['height']) ) {

            // Region of interest (top-left and bottom-right coords in
            // arcseconds)
            $x1 = $options['x0'] - 0.5 * $options['width']
                * $this->_params['imageScale'];
            $y1 = $options['y0'] - 0.5 * $options['height']
                * $this->_params['imageScale'];

            $x2 = $options['x0'] + 0.5 * $options['width']
                * $this->_params['imageScale'];
            $y2 = $options['y0'] + 0.5 * $options['height']
                * $this->_params['imageScale'];
        }
        else {
            throw new Exception(
                'Region of interest not properly specified.', 23);
        }

        $roi = new Helper_RegionOfInterest($x1, $y1, $x2, $y2,
            $this->_params['imageScale']);

        return $roi;
    }

    /**
     * Estimates the number of frames that a movie will include
     *
     * Determines how many frames will be included in the movie and then uses
     * that along with some other information about the nature of the request
     * to come up with an estimated time it will take to build the requested
     * movie.
     *
     * NOTE: This is only a temporary work-around. An ideal solution will make
     * use of prior actual movie generation times and will not require use of
     * manually-selected system-dependent coefficients
     */
    private function _estimateNumFrames($db, $layers, $startTime, $endTime) {
        $numFrames = 0;
        $sql =  'SELECT COUNT(*) FROM images WHERE DATE BETWEEN "%s" ' .
                'AND "%s" AND sourceId=%d;';

        // Estimate number of movies frames for each layer
        foreach ( $layers->toArray() as $layer ) {
            $numFrames += $db->getImageCount($startTime, $endTime,
                $layer['sourceId']);
        }

        // Raise an error if few or no frames were found for the request range
        // and data sources
        if ($numFrames == 0) {
            throw new Exception('No images found for requested time range. '.
                'Please try a different time.', 12);
        }
        else if ($numFrames <= 3) {
            throw new Exception('Insufficient data was found for the '.
                'requested time range. Please try a different time.', 16);
        }

        return $numFrames;
    }

    /**
     * Checks to see if the requested movie is available and if so returns
     * it as a file-attachment
     *
     * @return file Requested movie
     */
    public function downloadMovie() {
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
        if ( $movie->status == 2 ) {
            // Get filepath
            $filepath = $movie->getFilepath($options['hq']);
            $filename = basename($filepath);

            // Set HTTP headers
            header('Pragma: public');
            header('Expires: 0');
            header(
                'Cache-Control: must-revalidate, post-check=0, pre-check=0');
            header('Cache-Control: private', false);
            header('Content-Disposition: attachment; filename="' .
                $filename . '"');
            header('Content-Transfer-Encoding: binary');
            header('Content-Length: ' . @filesize($filepath));
            header('Content-type: video/'.$this->_params['format']);

            // Return movie data
            echo @file_get_contents($filepath);

        }
        // Otherwise return an error
        else {
            header('Content-type: application/json');
            $response = array('error' => 'The movie you requested is either '.
                'being processed or does not exist.');
            print json_encode($response);
        }
    }

    /**
     * Checks to see if a movie is available and returns either a link to the
     * movie if it is ready or progress information otherwise
     *
     * @return void
     */
    public function getMovieStatus() {
        include_once 'src/Movie/HelioviewerMovie.php';

        // Process request
        $movie = new Movie_HelioviewerMovie($this->_params['id'],
            $this->_params['format']);
        $verbose = isset($this->_options['verbose']) ?
            $this->_options['verbose'] : false;

        // FINISHED
        if ($movie->status == 2) {
            $response = $movie->getCompletedMovieInformation($verbose);
        }
        else if ($movie->status == 3) {
            // ERROR
            $response = array(
                'status' => 3,
                'error'  => 'Sorry, we are unable to create your movie at '.
                    'this time. Please try again later.'
            );
        }
        else if ($movie->status == 0) {
            // QUEUED
            if ( isset($this->_options['token']) ) {
                require_once 'lib/Resque.php';

                // with token

                // NOTE: since resque token is only useful for determining
                //       the general status of a job (e.g. QUEUED) and queue
                //       position can be found using the movie id, the tokenId
                //       can probably be removed.
                //$queueNum  = $this->_getQueueNum("on_demand_movie",
                //    $this->_options['token']);
                $queueNum  = $this->_getQueueNum('on_demand_movie',
                    $this->_params['id']);
                $queueSize = Resque::size('on_demand_movie');

                $response = array(
                    'status'   => 0,
                    'position' => $queueNum,
                    'total'    => $queueSize
                );
            }
            else {
                // without token
                $response = array('status' => 0);
            }
        }
        else {
            // PROCESSING
            $response = array(
                'status' => 1
            );
        }

        $this->_printJSON(json_encode($response));
    }

    /**
     * Determines the position of a job within a specified queue
     *
     * Note: https://github.com/chrisboulton/php-resque/issues/45
     *
     * @return int Returns queue position or else -1 if job not found
     */
    private function _getQueueNum($queue, $id) {
        $i = 0;

        foreach (Resque::redis()->lrange('queue:'.$queue, 0, -1) as $job) {
            if (strpos($job, $id) !== false) {
                return $i;
            }
            $i += 1;
        }

        return -1;
    }

    /**
     * Checks to see if Helioviewer.org is authorized to upload videos for
     * a user
     */
    public function checkYouTubeAuth() {
        include_once 'src/Movie/YouTube.php';

        $youtube = new Movie_YouTube();

        $this->_printJSON(json_encode($youtube->checkYouTubeAuth()));
    }

    /**
     * Requests authorization for Helioviewer.org to upload videos on behalf
     * of the user.
     */
    public function getYouTubeAuth() {
        include_once 'src/Movie/YouTube.php';

        $share = isset($this->_options['share']) ?
            $this->_options['share'] : false;

        session_start();

        // Discard any existing authorization
        unset($_SESSION['sessionToken']);

        // Store form data for later use
        $_SESSION['video-id']          = $this->_params['id'];
        $_SESSION['video-title']       = $this->_params['title'];
        $_SESSION['video-description'] = $this->_params['description'];
        $_SESSION['video-tags']        = $this->_params['tags'];
        $_SESSION['video-share']       = $share;

        $youtube = new Movie_YouTube();
        $youtube->getYouTubeAuth($this->_params['id']);
    }

    /**
     * Uploads a user-created video to YouTube
     *
     * TODO 2011/05/09: Make sure movie hasn't already been uploaded
     */
    public function uploadMovieToYouTube() {
        include_once 'src/Movie/HelioviewerMovie.php';
        include_once 'src/Movie/YouTube.php';

        // Process request
        $movie = new Movie_HelioviewerMovie($this->_params['id'], 'mp4');

        if ($movie->status !== 2) {
            throw new Exception('Invalid movie requested', 41);
        }

        // If this was not the first upload for the current session, then
        // the form data will have been passed in as GET variables
        if (isset($this->_options['title'])) {
            $id          = $this->_params['id'];
            $title       = $this->_options['title'];
            $description = $this->_options['description'];
            $tags        = $this->_options['tags'];
            $share       = isset($this->_options['share']) ?
                $this->_options['share'] : false;
        }
        else {
            // Otherwise read form data back in from session variables
            session_start();

            if ( !isset($_SESSION['video-title']) ) {
                $msg = 'Error encountered during authentication. '.
                       '<a href="https://accounts.google.com/IssuedAuthSubTokens">Revoke access</a> ' .
                       'for Helioviewer.org in your Google settings page and try again.</a>';
                throw new Exception($msg, 42);
            }

            $id          = $_SESSION['video-id'];
            $title       = $_SESSION['video-title'];
            $description = $_SESSION['video-description'];
            $tags        = $_SESSION['video-tags'];
            $share       = $_SESSION['video-share'];
        }

        // Output format
        if ( isset($this->_options['html']) &&
             $this->_options['html'] ) {

            $html = true;
        }
        else {
            $html = false;
        }

        $youtube = new Movie_YouTube();
        $video   = $youtube->uploadVideo($movie, $id, $title, $description,
            $tags, $share, $html);
    }

    /**
     * Retrieves recent user-submitted videos from YouTube and returns the
     * result as a JSON array.
     */
    public function getUserVideos() {
        include_once 'src/Database/MovieDatabase.php';
        include_once 'src/Movie/HelioviewerMovie.php';
        include_once 'lib/alphaID/alphaID.php';

        $movies = new Database_MovieDatabase();

        // Default options
        $defaults = array(
            'num'   => 10,
            'since' => '2000/01/01T00:00:00.000Z',
            'force' => false
        );
        $opts = array_replace($defaults, $this->_options);

        // Get a list of recent videos
        $videos = array();

        foreach( $movies->getSharedVideos($opts['num'], $opts['since'],
            $opts['force']) as $video) {

            $youtubeId = $video['youtubeId'];
            $movieId   = (int)$video['movieId'];

            // Convert id
            $publicId = alphaID($movieId, false, 5, HV_MOVIE_ID_PASS);

            // Load movie
            $movie = new Movie_HelioviewerMovie($publicId);

            // Check to make sure video was not removed by the user
            // 2011/06/08: Disabling for now since this delays time before
            // videos
            // $handle = curl_init("http://gdata.youtube.com/feeds/api/videos/$youtubeId?v=2");
            // curl_setopt($handle, CURLOPT_RETURNTRANSFER, TRUE);

            // $response = curl_exec($handle);
            // $httpCode = curl_getinfo($handle, CURLINFO_HTTP_CODE);

            //curl_close($handle);

            // Only add videos with response code 200
            //if ($httpCode == 200) {
            array_push($videos, array(
                'id'  => $publicId,
                'url' => 'http://www.youtube.com/watch?v='.$youtubeId,
                'thumbnails' => $movie->getPreviewImages(),
                'published'  => $video['timestamp'] )
            );
            //}
        }

        $this->_printJSON(json_encode($videos));
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
    public function playMovie() {
        include_once 'src/Movie/HelioviewerMovie.php';

        // Load movie
        $movie = new Movie_HelioviewerMovie($this->_params['id'],
                                            $this->_params['format']);

        // Default options
        $defaults = array(
            'hq'     => false,
            'width'  => $movie->width,
            'height' => $movie->height
        );
        $options = array_replace($defaults, $this->_options);

        // Return an error if movie is not available
        if ($movie->status != 2) {
            header('Content-type: application/json');
            $response = array(
                'error' => 'The movie you requested is either being ' .
                    'processed or does not exist.'
            );

            print json_encode($response);
            return;
        }

        $dimensions = sprintf('width: %dpx; height: %dpx;',
                              $options['width'], $options['height']);

        // Get filepath
        $filepath = $movie->getFilepath($options['hq']);
        $filename = basename($filepath);

        // Movie URL
        $url = str_replace(HV_CACHE_DIR, HV_CACHE_URL, $filepath);
?>
<!DOCTYPE html>
<html>
<head>
    <title>Helioviewer.org - <?php echo $filename?></title>
    <script src="<?php echo HV_WEB_ROOT_URL; ?>/lib/flowplayer/flowplayer-3.2.8.min.js"></script>
</head>
<body>
    <!-- Movie player -->
    <div href="<?php echo $url; ?>"
       style="display:block; <?php print $dimensions; ?>"
       id="movie-player">
    </div>
    <br>
    <script language="javascript">
        flowplayer("movie-player", "<?php echo HV_WEB_ROOT_URL; ?>/lib/flowplayer/flowplayer-3.2.8.swf", {
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
                $xmlStr = str_replace("\n", '', str_replace("'", "\'", $json));
                $json = sprintf("%s('%s')", $this->_params['callback'], $xmlStr);
            }
            else {
                $json = sprintf("%s(%s)", $this->_params['callback'], $json);
            }
        }

        // Set Content-type HTTP header
        if ($utf) {
            header('Content-type: application/json;charset=UTF-8');
        }
        else {
            header('Content-Type: application/json');
        }

        // Print result
        echo $json;
    }

    /**
     * validate
     *
     * @return bool Returns true if input parameters are valid
     */
    public function validate() {

        switch( $this->_params['action'] ) {

        case 'downloadMovie':
            $expected = array(
                'required' => array('id', 'format'),
                'optional' => array('hq'),
                'alphanum' => array('id', 'format'),
                'bools'    => array('hq')
            );
            break;
        case 'getMovieStatus':
            $expected = array(
                'required' => array('id', 'format'),
                'optional' => array('verbose', 'callback', 'token'),
                'alphanum' => array('id', 'format', 'callback', 'token'),
                'bools'    => array('verbose')

            );
            break;
        case 'playMovie':
            $expected = array(
                'required' => array('id', 'format'),
                'optional' => array('hq', 'width', 'height'),
                'alphanum' => array('id', 'format'),
                'bools'    => array('hq'),
                'ints'     => array('width', 'height')
            );
            break;
        case 'queueMovie':
            $expected = array(
                'required' => array('startTime', 'endTime', 'layers', 'events',
                                    'eventsLabels',  'imageScale'),
                'optional' => array('format', 'frameRate', 'maxFrames',
                                    'scale', 'scaleType', 'scaleX', 'scaleY',
                                    'movieLength', 'watermark', 'width',
                                    'height', 'x0', 'y0', 'x1', 'x2',
                                    'y1', 'y2', 'callback'),
                'alphanum' => array('format', 'scaleType', 'callback'),
                'bools'    => array('watermark', 'eventsLabels', 'scale'),
                'dates'    => array('startTime', 'endTime'),
                'floats'   => array('imageScale', 'frameRate', 'movieLength',
                                    'x0', 'y0', 'x1', 'x2', 'y1', 'y2',
                                    'scaleX', 'scaleY'),
                'ints'     => array('maxFrames', 'width', 'height')
            );
            break;
        case 'uploadMovieToYouTube':
            $expected = array(
                'required' => array('id'),
                'optional' => array('title', 'description', 'tags', 'share',
                                    'token', 'html'),
                'alphanum' => array('id'),
                'bools'    => array('share', 'html')
            );
            break;
        case 'getUserVideos':
            $expected = array(
                'optional' => array('num', 'since', 'force', 'callback'),
                'alphanum' => array('callback'),
                'ints'     => array('num'),
                'dates'    => array('since'),
                'bools'    => array('force')
            );
            break;
        case 'checkYouTubeAuth':
            $expected = array(
                'optional' => array('callback'),
                'alphanum' => array('callback')
            );
            break;
        case 'getYouTubeAuth':
            $expected = array(
                'required' => array('id', 'title', 'description', 'tags'),
                'optional' => array('share'),
                'alphanum' => array('id'),
                'bools'    => array('share')
            );
        default:
            break;
        }

        // Check input
        if ( isset($expected) ) {
            Validation_InputValidator::checkInput($expected, $this->_params,
                $this->_options);
        }

        return true;
    }
}
?>