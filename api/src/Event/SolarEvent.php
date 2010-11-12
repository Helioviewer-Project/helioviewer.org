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
     */
    public function getScreenshots() {
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
     * Create screenshots for a single event
     * 
     * @param string $dir  Directory to store generated screenshots in
     *
     * @return array
     */
    private function _createScreenshots($dir)
    {
        include_once 'src/Image/Screenshot/HelioviewerScreenshotBuilder.php';
        
        $builder = new Image_Screenshot_HelioviewerScreenshotBuilder();
        
        // Create directory to store screenshots in
        $this->_createCacheDirectory($dir);        
        
        // Datasources for which screenshots should be created
        $sourceIds = $this->_getAssociatedDataSources($this->details['event_type']);
        
        // Temporarily hard-coded...
        $imageScale = 0.6; //0.59999
        
        // Determine region of interest
        $bbox = $this->_polygonToBoundingBox($this->details['hpc_bbox']);
        $roi  = $this->_padToMinSize($bbox, $imageScale);
        
        // Take screenshot of event half-way through its duration
        $obsDate = $this->_getTimeWindowCenter($this->details['event_starttime'], $this->details['event_endtime']);

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
            $filepath = $builder->takeScreenshot(
                $layerString, $obsDate, $imageScale, $roi['x1'], $roi['x2'], $roi['y1'], $roi['y2'],
                $options
            );

            array_push($screenshots, str_replace(HV_ROOT_DIR, HV_WEB_ROOT_URL, $filepath));
        }
        
        return $screenshots;
    }
    
    /**
     * Returns a date string for the middle of a specified time window
     * 
     * @param string $startDateString Start time 
     * @param string $endDateString   End time
     */
    private function _getTimeWindowCenter ($startDateString, $endDateString)
    {
        include_once "src/Helper/DateTimeConversions.php";
        
        // If start and end times are the same simply use the start time
        if ($startDateString === $endDateString) {
            return $startDateString;
        }
        
        // Otherwise choose middle point
        $start = toUnixTimestamp($startDateString);
        $end   = toUnixTimestamp($endDateString);
        
        $middle = $start + (0.5 * ($end - $start));

        return toISOString(parseUnixTimestamp($middle));
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
    private function _polygonToBoundingBox($polygon)
    {
        $coordinates = explode(",", str_replace(array("POLYGON", "(", ")"), "", $polygon));
        $x = array();
        $y = array();
        
        foreach ($coordinates as $pair) {
            $xy = explode(" ", $pair);
            $x[] = (float)$xy[0];
            $y[] = (float)$xy[1];
        }
    
        // sort all points by increasing value
        sort($x);
        sort($y);
            
        return array(
            "x1" => $x[0],
            "x2" => end($x),
            "y1" => $y[0],
            "y2" => end($y)
        );  
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
        $minSize = (400 * $imageScale) / 2;
        $centerX = ($box['x1'] + $box['x2']) / 2;
        $centerY = ($box['y1'] + $box['y2']) / 2;
        
        $minX    = min($centerX - $minSize, $box['x1']);
        $minY    = min($centerY - $minSize, $box['y1']);
        $maxX    = max($centerX + $minSize, $box['x2']);
        $maxY    = max($centerY + $minSize, $box['y2']);
        
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
            $sourceIds = array(10, 13); //$sourceIds = array(10, 11, 12, 14);            
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