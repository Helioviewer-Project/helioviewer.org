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
class Event_HEKAdapter {
	private $_baseURL;
	private $_proxy;
	
	/**
	 * 
	 * @return unknown_type
	 */
	public function __construct() {
		$this->_baseURL = HEK_BASE_URL . '?cosec=2&cmd=search&type=column&event_type=**' 
		                               . '&event_coordsys=helioprojective&x1=-1200&x2=1200&y1=-1200&y2=1200&';

        include_once 'src/Net/Proxy.php';
        $this->_proxy = new Net_Proxy($this->_baseURL);
	}

	/**
	 * 
	 */
	public function getFRMs($startTime, $endTime) {
		$params = "event_starttime=$startTime&event_endtime=$endTime" .
		          "&return=frm_name,frm_url,frm_identifier,frm_contact,event_type";
        return $this->_proxy->query($params, true);		
	}
}