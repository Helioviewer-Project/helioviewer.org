<?php
/**
 * @package Helioviewer API
 * @author Jonathan Harper <jwh376@msstate.edu>
 * 
 * 
 */

error_reporting(E_ALL | E_STRICT | E_NOTICE);

define("HEK_BASE_URL", "http://www.lmsal.com/her/dev/search-hpkb/hek?");
require_once("Proxy.php");


class HEKQuery {
    private $query_type;
    private $event_type;
    private $start_time;
    private $end_time;
    private $x1;
    private $y1;
    private $x2;
    private $y2;
    private $return_format;
    
    public $query_string;
    
    /**
     * Constructor
     * @desc Builds an initial query string
     * @param string $query_type Indicates the purpose of the query.  'search' searches for all events in the region, 'sources' returns a list of frm_names
     * @param string $event_type A two letter abbreviation for the type of event (or more than one, comma delimited), or ** for all events.
     * @param object $start_time Date and time for the beginning of the window.  YYYY-MM-DDTHH:MM:SS
     * @param object $end_time Date and time for the end of the window. YYYY-MM-DDTHH:MM:SS
     * @param object $x1 First X coordinate for the window.1
     * @param object $y1 First Y coordinate for the window.
     * @param object $x2 Second X coordinate for the window.
     * @param object $y2 Second Y coordinate for the window.
     */
    public function __construct($query_type = "sources", 
                                $event_type = NULL, $start_time = NULL, $end_time = NULL, $x1 = "-1200", $x2 = "1200", $y1 = "-1200", $y2 = "1200")
    {
        $this->query_type = $query_type;
        $this->event_type = $event_type;
        $this->start_time = $start_time;
        $this->end_time = $end_time;
        $this->x1 = $x1;
        $this->y1 = $y1;
        $this->x2 = $x2;
        $this->y2 = $y2;
        
    }
    
    private function build_query()
    {
        if($this->query_type == "sources")
        {
            $this->query_string="cmd=view-attributes";    
        }
        
        else 
        {
            $this->query_string="cmd=search&type=column&event_type=" . $this->event_type . "&event_starttime=" . $this->start_time . "&event_endtime=" . $this->end_time . "&event_coordsys=helioprojective&x1=" . $this->x1 . "&x2=" . $this->x2 . "&y1=" . $this->y1 . "&y2=" . $this->y2;
        }
    }
    
    public function retrieve_results($brief)
    {
        $this->build_query($this->query_type);
        $this->query_string = $this->query_string . "&cosec=2";
        if($brief)
        {
            $this->query_string = $this->query_string . "&return=required";
        }
        $proxy = new Proxy(HEK_BASE_URL, $this->query_string);
        if($this->query_type == "sources")
        {
            $this->parse_sources('frm_name', $proxy->query(true));
        }
        else
        {
            header("Content-type: application/json");
            echo $proxy->query(true);
        }
    }
    
    private function parse_sources($variable, $hek_reply)
    {
        //header("Content-type: application/json");
        $hek_reply = json_decode($hek_reply, true);
        $hek_reply = json_encode($hek_reply{'FRM_Name'});
        $hek_reply = json_decode($hek_reply, true);
        $new = array();
        foreach($hek_reply as $key=>$value)
        {
            array_push($new,$key);
        }
        //print json_encode($hek_reply->{'FRM_Name'});
        var_dump($new);
    }
}

$query = new HEKQuery();
$query->retrieve_results(false);
?>