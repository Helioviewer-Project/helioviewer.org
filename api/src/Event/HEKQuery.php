<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * HEKQuery Class Definition
 * 
 * PHP version 5
 * 
 * @category Event
 * @package  Helioviewer
 * @author   Jonathan Harper <jwh376@msstate.edu>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
define("HEK_BASE_URL", "http://www.lmsal.com/her/dev/search-hpkb/hek?");
require_once 'src/Net/Proxy.php';

/**
 * A class to provide support for querying feature/event information through
 * the Heliophysics Event Knowledgebase (HEK).
 * 
 * @category Event
 * @package  Helioviewer
 * @author   Jonathan Harper <jwh376@msstate.edu>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 * @see      http://www.lmsal.com/helio-informatics/hpkb/
 */
class Event_HEKQuery
{
    private $_queryType;
    private $_eventType;
    private $_startTime;
    private $_endTime;
    private $_x1;
    private $_y1;
    private $_x2;
    private $_y2;
    private $_returnFormat;
    
    public $queryString;
    
    /**
     * Builds an initial query string
     * 
     * @param string $queryType Indicates the purpose of the query. 'search' searches for all events in the region, 
     *                          'sources' returns a list of frm_names
     * @param string $eventType A two letter abbreviation for the type of event (or more than one, comma delimited), 
     *                          or ** for all events.
     * @param object $startTime Date and time for the beginning of the window.  YYYY-MM-DDTHH:MM:SS
     * @param object $endTime   Date and time for the end of the window. YYYY-MM-DDTHH:MM:SS
     * @param object $x1        First X coordinate for the window.1
     * @param object $x2        Second X coordinate for the window.
     * @param object $y1        First Y coordinate for the window.
     * @param object $y2        Second Y coordinate for the window.
     * 
     * @return void
     */
    public function __construct($queryType = "sources", $eventType = null, $startTime = null, $endTime = null,
        $x1 = "-1200", $x2 = "1200", $y1 = "-1200", $y2 = "1200"
    ) {
        $this->_queryType = $queryType;
        $this->_eventType = $eventType;
        $this->_startTime = $startTime;
        $this->_endTime = $endTime;
        $this->_x1 = $x1;
        $this->_x2 = $x2;
        $this->_y1 = $y1;
        $this->_y2 = $y2;
        
    }
    
    /**
     * (Add description)
     * 
     * @return void
     */
    private function _buildQuery()
    {
        if ($this->_queryType == "sources") {
            $this->queryString="cmd=view-attributes";    
        } else {
            $this->queryString="cmd=search&type=column&eventType=" . $this->_eventType . "&event_starttime=" . 
                $this->_startTime . "&event_endtime=" . $this->_endTime . "&event_coordsys=helioprojective&x1=" . 
                $this->_x1 . "&x2=" . $this->_x2 . "&y1=" . $this->_y1 . "&y2=" . $this->_y2;
        }
    }
    
    /**
     * (Add description)
     * 
     * @param ? $brief ...
     *
     * @return void
     */
    public function retrieveResults($brief)
    {
        $this->_buildQuery($this->_queryType);
        $this->queryString = $this->queryString . "&cosec=2";
        
        if ($brief) {
            $this->queryString = $this->queryString . "&return=required";
        }
        
        $proxy = new Net_Proxy(HEK_BASE_URL, $this->queryString);
        
        if ($this->_queryType == "sources") {
            $this->_parseSources('frm_name', $proxy->query(true));
        } else {
            header("Content-type: application/json");
            echo $proxy->query(true);
        }
    }
    
    /**
     * (Add description)
     * 
     * @param ? $variable  ...
     * @param ? $hek_reply ...
     * 
     * @return void
     */
    private function _parseSources($variable, $hek_reply)
    {
        //header("Content-type: application/json");
        $hek_reply = json_decode($hek_reply, true);
        $hek_reply = json_encode($hek_reply{'FRM_Name'});
        $hek_reply = json_decode($hek_reply, true);
        $new = array();
        foreach ($hek_reply as $key=>$value) {
            array_push($new, $key);
        }
        //print json_encode($hek_reply->{'FRM_Name'});
        var_dump($new);
    }
}

$query = new Event_HEKQuery();
$query->retrieveResults(false);
?>