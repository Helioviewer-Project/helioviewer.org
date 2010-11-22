<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Event_SolarEvent class definition
 * 
 * Note: Currently this class works only with HEK events. In the future the class should be redesigned so that it
 * does not matter whether an HEKAdapter is used, or some other adaptor: as long as the interface for each adapter
 * is the same, then it should not matter where the actual data is coming from.
 * 
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once "src/Event/HEKAdapter.php";

define("SCREENSHOT_MIN_WIDTH" , 400);
define("SCREENSHOT_MIN_HEIGHT", 400);
/**
 * Event_SolarEvent class definition
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Event_SolarEvent
{
    protected $adapter;
    protected $id;
    protected $details;
    
    
    /**
     * Creates a new SolarEvent instance
     * 
     * @param $id string Event id
     * 
     * @return void
     */
    public function __construct($id) {
        $this->id      = $id;
        $this->adapter = new Event_HEKAdapter(); 
        
        // Get event meta information
        $this->details = $this->adapter->getEventById($id);
    }
    
    /**
     * Returns a list of screenshots relating to the event
     * 
     * @return array URLs of event screenshots
     */
    public function getScreenshots()
    {
        $directory = sprintf("%s/events/%s/screenshots", HV_CACHE_DIR, $this->id);
        
        // If images have already been generated return them
        if (!HV_DISABLE_CACHE && file_exists($directory)) {
            $files = glob("$directory/*");
            
            $urls = array();

            // Convert to URLs
            foreach ($files as $filepath) {
                array_push($urls, str_replace(HV_ROOT_DIR, HV_WEB_ROOT_URL, $filepath));
            }
        } else {
            $urls = $this->_createScreenshots($directory);
        }

        return $urls;
    }
    
    /**
     * Returns a list of movies relating to the event
     *
     * @return array URLs of event movies
     */
    public function getMovies ($ipod) 
    {
        $directory = sprintf("%s/events/%s/movies", HV_CACHE_DIR, $this->id);
        
        // If images have already been generated return them
        if (!HV_DISABLE_CACHE && file_exists($directory)) {
//            $files = array_merge(
//                glob("$directory/*mp4"),
//                glob("$directory/*mov"),
//                glob("$directory/*flv")
//            );
            $files = glob("$directory/*.mp4"); // 11/22/2010: When creating movies, request only returns a single filetype
            
            $urls = array();

            // Convert to URLs
            foreach ($files as $filepath) {
                array_push($urls, str_replace(HV_ROOT_DIR, HV_WEB_ROOT_URL, $filepath));
            }
        } else {
            $urls = $this->_createMovies($directory, $ipod);
        }

        return $urls;
    }
    
    /**
     * Create screenshots for a single event
     * 
     * @param string $dir  Directory to store generated screenshots in
     *
     * @return array
     */
    private function _createScreenshots($dir)
    {
        include_once 'src/Image/Screenshot/HelioviewerScreenshot.php';
        
        // Create directory to store screenshots in
        $this->_createCacheDirectory($dir);        
        
        // Datasources for which screenshots should be created
        $sourceIds = $this->_getAssociatedDataSources($this->details['event_type']);
        
        // Temporarily hard-coded...
        $imageScale = 0.6; //0.59999
        
        // Determine region of interest
        $roi = $this->_polygonToBoundingBox($this->details['hpc_bbox'], $imageScale);

        // Take screenshot of event half-way through its duration
        $obsDate = $this->_getTimeWindowCenter();

        // Filename prefix
        $filePrefix = "Screenshot_";
        
        // Array to store resulting screenshots
        $screenshots = array();
        
        // Build screenshots for each data source associated with the event type
        foreach ($sourceIds as $source) {
            $layerString = "[" . $source . ",1,100]";

            $filename = $filePrefix . $this->id . "_";
            
            // Work-around 11/12/2010: Need to add support for passing in prefix instead of full filename
            $filename .= $source;
            
            // Screenshot preferences
            $options = array(
                "filename"  => $filename,
                "outputDir" => $dir
            );

            // Build screenshot
            $screenshot = new Image_Screenshot_HelioviewerScreenshot($layerString, $obsDate, $roi, $options);
            $url = $screenshot->getURL();

            array_push($screenshots, $url);
        }
        
        return $screenshots;
    }
    
    /**
     * Create movies for a single event
     * 
     * @param string $dir  Directory to store generated screenshots in
     *
     * @return array
     */
    private function _createMovies($dir, $ipod)
    {
        include_once 'src/Movie/HelioviewerMovie.php';
        
        // Create directory to store movies in
        //$this->_createCacheDirectory($dir . "/frames"); Should be handled by movie class
        
        // Datasources for which movies should be created
        $sourceIds = $this->_getAssociatedDataSources($this->details['event_type']);
        
        // Temporarily hard-coded...
        $imageScale = 0.6; //0.59999
        
        // Determine region of interest
        $roi = $this->_polygonToBoundingBox($this->details['hpc_bbox'], $imageScale);
        
        // Select a start and end time for the movie
        list($startTime, $endTime) = $this->_getMovieTimeWindow();

        // Filename prefix
        $filePrefix = "Movie_";
        
        // Array to store resulting movies
        $movies = array();
        
        // Build movies for each data source associated with the event type
        foreach ($sourceIds as $source) {
            $layerString = "[" . $source . ",1,100]";

            $filename = $filePrefix . $this->id . "_";
            
            // Work-around 11/12/2010: Need to add support for passing in prefix instead of full filename
            $filename .= $source;
            
            // Movie preferences
            $options = array(
                "endTime"   => $endTime,
                "filename"  => $filename,
                "outputDir" => $dir
            );

            // Build movie
            $movie = new Movie_HelioviewerMovie($layerString, $startTime, $roi, $options);
            
            $url   = $movie->getURL() . ".mp4";

            array_push($movies, $url);
        }
        
        return $movies;
    }
    
    /**
     * Returns a date string for the middle of a specified time window
     * 
     */
    private function _getTimeWindowCenter ()
    {
        include_once "src/Helper/DateTimeConversions.php";
        
        // If start and end times are the same simply use the start time
        if ($this->details['event_starttime'] === $this->details['event_endtime']) {
            return $this->details['event_starttime'];
        }
        
        // Otherwise choose middle point
        $start = toUnixTimestamp($this->details['event_starttime']);
        $end   = toUnixTimestamp($this->details['event_endtime']);
        
        $middle = $start + (0.5 * ($end - $start));

        return toISOString(parseUnixTimestamp($middle));
    }
    
    /**
     * Returns an optimal time window for an event movie. If unique event start time and end time are both
     * specified in the event details then those values are used. If the values are the same, then a default
     * time window of 24 hours is used instead.
     * 
     * @return array Start and end date strings
     */
    private function _getMovieTimeWindow () {
        // If start and end times are different use those values
        if ($this->details['event_starttime'] !== $this->details['event_endtime']) {
            return array($this->details['event_starttime'], $this->details['event_endtime']);
        }
        
        // Otherwise choose a 24-hour window around the specified time
        $middle = toUnixTimestamp($this->details['event_starttime']);
        
        $start  = toISOString(parseUnixTimestamp($middle - (12 * 60 * 60))); 
        $end    = toISOString(parseUnixTimestamp($middle + (12 * 60 * 60)));
        
        return array($start, $end);
    }
    
    /**
     * Creates the directory structure that will be used to store screenshots based upon events. 
     *
     * @param string $cacheDir The path to cache/events/eventId
     * 
     * @return void
     */
    private function _createCacheDirectory($dir)
    {
        if (!file_exists($dir)) {
            mkdir($dir, 0777, true);
            chmod($dir, 0777);        
        }
    }

        
    /**
     * Takes in a polygon string in the format "POLYGON((....))" and parses it to 
     * find a rectangular region that includes the event.
     * 
     * @param string $polygon The polygon string in the above format
     * 
     * @return array 
     */
    private function _polygonToBoundingBox($polygon, $imageScale)
    {
        require_once 'src/Helper/RegionOfInterest.php';

        $coordinates = explode(",", str_replace(array("POLYGON", "(", ")"), "", $polygon));
        $x = array();
        $y = array();
        
        // Break up coordinate pairs
        foreach ($coordinates as $pair) {
            $xy = explode(" ", $pair);
            $x[] = (float)$xy[0];
            $y[] = (float)$xy[1];
        }
    
        // Sort all points by increasing value
        sort($x);
        sort($y);
            
        $bbox = array(
            "x1" => $x[0],
            "x2" => end($x),
            "y1" => $y[0],
            "y2" => end($y)
        );
        
        // Make sure bounding box is at least 400x400 pixels
        $bbox = $this->_padToMinSize($bbox, $imageScale); 
        
        // Regon of interest
        return new Helper_RegionOfInterest($bbox['x1'], $bbox['x2'], $bbox['y1'], $bbox['y2'], $imageScale);
    }
    
    /**
     * Pads the bounding box up to a minimum size of roughly 400x400 pixels
     * 
     * @param array $box        The bounding box coordinates
     * @param float $imageScale The scale of the image in arcsec/pixel
     * 
     * @return array
     */    
    private function _padToMinSize($box, $imageScale)
    {
        $centerX = ($box['x1'] + $box['x2']) / 2;
        $centerY = ($box['y1'] + $box['y2']) / 2;
        
        $minX    = min($centerX - (SCREENSHOT_MIN_WIDTH  * $imageScale / 2), $box['x1']);
        $minY    = min($centerY - (SCREENSHOT_MIN_HEIGHT * $imageScale / 2), $box['y1']);
        $maxX    = max($centerX + (SCREENSHOT_MIN_WIDTH  * $imageScale / 2), $box['x2']);
        $maxY    = max($centerY + (SCREENSHOT_MIN_HEIGHT * $imageScale / 2), $box['y2']);
        
        return array(
            "x1" => $minX, 
            "x2" => $maxX, 
            "y1" => $minY, 
            "y2" => $maxY);
    }

    /**
     * Some temporarily hard-coded assumptions about what layers should be used for certain event types
     * 
     * @param string $eventType The two-letter code for event type
     * 
     * @return array
     */
    private function _getAssociatedDataSources($eventType)
    {
        $sourceIds  = array();
        
        switch($eventType) {
        case "AR":
            $sourceIds = array(10); //$sourceIds = array(10, 11, 12, 14);            
            break;
        case "FL":
            $sourceIds = array(8, 9, 10, 11, 12, 13, 14, 15, 16, 17);
            break;
        default: 
            $sourceIds = array(10, 11, 12, 13, 14, 15);
            break;
        }
        
        return $sourceIds;
    }
}
?>