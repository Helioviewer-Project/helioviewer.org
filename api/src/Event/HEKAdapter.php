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
        $this->_baseURL = HEK_BASE_URL . '?cosec=2&cmd=search&type=column&event_type=**' 
                                       . '&event_coordsys=helioprojective&x1=-1200&x2=1200&y1=-1200&y2=1200&';

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
            "return"          => "frm_name,frm_url,frm_identifier,frm_contact,event_type"
        );
        
        $decoded = json_decode($this->_proxy->query($params, true), true);

        // create an array to keep track of which FRMs have been added
        $names = array();

        $unsorted = array();
        
        // remove redundant entries
        foreach ($decoded['result'] as $row) {
            $name = $row["frm_name"];
            if (!in_array($name, $names)) {
                array_push($names, $name);
                array_push($unsorted, $row);
            } 
        }
        
        $sorted = array();
        
        // sort by event type
        foreach ($unsorted as $frm) {
            $eventType = $frm['event_type'];
            
            if (!isset($sorted[$eventType]))
                $sorted[$eventType] = array();

            // remove redundant event_type parameter    
            unset($frm["event_type"]);
            array_push($sorted[$eventType], $frm);                
        }
        
        return json_encode($sorted);
    }
}