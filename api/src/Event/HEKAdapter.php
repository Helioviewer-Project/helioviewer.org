<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * HEKAdapter Class Definition
 * 
 * PHP version 5
 * 
 * @category Event
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
define("HEK_BASE_URL", "http://www.lmsal.com/hek/her");

/**
 * An Adapter to the HEK to allow AJAX requests to be made to the event service
 * 
 * @category Event
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 * @see      http://www.lmsal.com/helio-informatics/hpkb/
 */
class Event_HEKAdapter
{
    private $_baseURL;
    private $_proxy;
    
    /**
     * Creates a new HEKAdapter instance
     *  
     * @return void
     */
    public function __construct()
    {
        $this->_baseURL = HEK_BASE_URL . '?cosec=2&cmd=search&type=column' 
                                       . '&event_coordsys=helioprojective&x1=-30000&x2=30000&y1=-30000&y2=30000&';

        include_once 'src/Net/Proxy.php';
        $this->_proxy = new Net_Proxy($this->_baseURL);
    }

    /**
     * Return a list of event FRMs sorted by event type
     * 
     * @param string $startTime Query start date
     * @param string $endTime   Query end date 
     * 
     * @return JSON List of event FRMs sorted by event type 
     */
    public function getFRMs($startTime, $endTime)
    {
        $params = array(
            "event_starttime" => $startTime,
            "event_endtime"   => $endTime,
            "event_type"      => "**",
            "result_limit"    => 200,
            "return"          => "frm_name,frm_url,frm_contact,event_type"
        );
        
        $decoded = json_decode($this->_proxy->query($params, true), true);

        // create an array to keep track of which FRMs have been added
        $names = array();

        $unsorted = array();
        
        // remove redundant entries
        foreach ($decoded['result'] as $row) {
            $name = $row["frm_name"];
            if (!array_key_exists($name, $names)) {
                $names[$name] = 1;
                array_push($unsorted, $row);
            } else { 
                $names[$name]++;
            }
        }

        $sorted = array();
        
        // sort by event type
        foreach ($unsorted as $frm) {
            $eventType = $frm['event_type'];
            $name      = $frm["frm_name"];
            
            if (!isset($sorted[$eventType]))
                $sorted[$eventType] = array();

            // remove redundant event_type and frm_parameters and add count
            unset($frm["event_type"]);
            unset($frm["frm_name"]);
            $frm["count"] = $names[$name];
            
            $sorted[$eventType][$name] = $frm;
        }
        
        return json_encode($sorted);
    }
    
    /**
     * Returns a list of events
     * 
     * @param date   $startTime Start time for which events should be retrieved
     * @param string $options   Optional parameters
     * 
     * @return string
     */
    public function getEvents($startTime, $options)
    {
        include_once "src/Helper/DateTimeConversions.php";
         
        // Default options
        $defaults = array(
            'endDate'   => getUTCDateString(),
            'eventType' => '**',
            'ipod'      => false
        );
        
        $options = array_replace($defaults, $options);
        
        // HEK query parameters
        $params = array(
            "event_starttime" => $startTime,
            "event_endtime"   => $options['endDate'],
            "event_type"      => $options['eventType'],
            "result_limit"    => 200,
            "return"          => "kb_archivid,concept,event_starttime,event_endtime,frm_name,frm_institute," . 
                                 "obs_observatory,obs_channelid,event_type,hpc_x,hpc_y,hpc_bbox"
        );

        //TODO Group similar (identical) events
        $response = JSON_decode($this->_proxy->query($params, true), true);
        
        $events = $response['result'];
       
        // Extend response to include any pregenerated screenshots and movies
        $this->_extendHEKResponse($events, $options['ipod']);

        return $events;
    }
    
    /**
     * Queries HEK for a single event's information
     * 
     * @param string $eventId The ID of the event
     * 
     * @return string
     */
    public function getEventById($eventId)
    {
        $params = array(
            "event_starttime" => "0001-01-01T00:00:00Z",
            "event_endtime"   => "9999-01-01T00:00:00Z",
            "event_type"      => "**",
            "result_limit"    => 1,
            "param0"          => "kb_archivid",
            "op0"             => "=",
            "value0"          => "ivo://helio-informatics.org/" . $eventId,
            "return"          => "kb_archivid,concept,event_starttime,event_endtime,frm_name,frm_institute," . 
                                 "obs_observatory,event_type,hpc_x,hpc_y,hpc_bbox,obs_instrument,obs_channelid"
        );
        
        // Decode response
        $response = JSON_decode($this->_proxy->query($params, true), true);

        return $response["result"][0];
    }
    
    /**
     * Add links to any screenshots and movies that have been generated for the requested event
     * 
     * @param array   &$originalEvents The original response object
     * @param boolean $ipod            Whether to look in the ipod folders or not
     * 
     * @return void
     */
    private function _extendHEKResponse(&$originalEvents, $ipod)
    {
        // Movie type to return
        $movieType = $ipod ? "iPod" : "regular";
        
        /**
         * Function to convert filepaths to URLs
         * 
         * @param string &$value Resource filepath
         * 
         * @return void
         */
        function convertFilepaths(&$value)
        {
            $value = str_replace(HV_ROOT_DIR, HV_WEB_ROOT_URL, $value);
        }

        $i = 0;
        
        // Loop through events
        foreach ($originalEvents as $event) {
            // Get event Id
            $hekId = explode("/", $event['kb_archivid']);
            $id    = end($hekId);            
            
            $eventDir = HV_CACHE_DIR . "/events/" . $id;
            
            // Empty arrays to store matches
            $screenshots = array();
            $movies      = array();
            
            // Get screenshots
            if (file_exists("$eventDir/screenshots")) {
                $screenshots = glob("$eventDir/screenshots/*.*");
                array_walk($screenshots, "convertFilepaths");
            }
            
            // Get movies            
            if (file_exists("$eventDir/movies/$movieType")) {
                $movies = glob("$eventDir/movies/$movieType/*.*");
                array_walk($movies, "convertFilepaths");
            }

            // Add screenshots and movies arrays to the result
            $originalEvents[$i]["screenshots"] = $screenshots;
            $originalEvents[$i]["movies"]      = $movies;
            
            $i++;
        }
    }
}