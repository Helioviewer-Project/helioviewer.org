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
	 * @param string $event_type A two letter abbreviation for the type of event (or more than one, comma delimited), or ** for all events.
	 * @param object $start_time Date and time for the beginning of the window.  YYYY-MM-DDTHH:MM:SS
	 * @param object $end_time Date and time for the end of the window. YYYY-MM-DDTHH:MM:SS
	 * @param object $x1 First X coordinate for the window.
	 * @param object $y1 First Y coordinate for the window.
	 * @param object $x2 Second X coordinate for the window.
	 * @param object $y2 Second Y coordinate for the window.
	 */
	public function __construct($event_type, $start_time, $end_time, $x1, $x2, $y1, $y2)
	{
		$this->event_type = $event_type;
		$this->start_time = $start_time;
		$this->end_time = $end_time;
		$this->x1 = $x1;
		$this->y1 = $y1;
		$this->x2 = $x2;
		$this->y2 = $y2;
		
		$this->build_query();
	}
	
	public function build_query()
	{
		$this->query_string="cmd=search&type=column&event_type=" . $this->event_type . "&event_starttime=" . $this->start_time . "&event_endtime=" . $this->end_time . "&event_coordsys=helioprojective&x1=" . $this->x1 . "&x2=" . $this->x2 . "&y1=" . $this->y1 . "&y2=" . $this->y2;
	}
	
	public function retrieve_results($return_type, $brief)
	{
		$this->query_string = $this->query_string . "&cosec=" . $return_type;
		if($brief)
		{
			$this->query_string = $this->query_string . "&return=required";
		}
		$proxy = new Proxy(HEK_BASE_URL, $this->query_string);
		$proxy->query(true);
	}
	
}

$query = new HEKQuery("CE", "2007-04-29T00:00:00", "2007-05-07T00:00:00", "-1200", "1200", "-1200", "1200", "json");
$query->retrieve_results(2,false);
?>