<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Helper_HelioviewerEvents Class Definition
 *
 * PHP version 5
 *
 * @category Helper
 * @package  Helioviewer
 * @author   Jeff Stys <jeffrey.stys@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */

/**
 * A simple class to represent one or more Helioviewer event FRMs in a request.
 *
 * @category Helper
 * @package  Helioviewer
 * @author   Jeff Stys <jeffrey.stys@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Helper_HelioviewerEvents {

    private $_events = array();
    private $_eventString;
    private $_eventTree;

    /**
     * Creates a new HelioviewerEvents instance
     *
     * @param string $eventString Event string format:
     *                            [event_type,frm_name,visibility]
     *
     * @return void
     */
    public function __construct($eventString) {
    	$this->_eventString = $eventString;

    	if ( $this->_eventString == '' ) {
    	    return;
    	}

        $eventStringArray = explode("],[", substr($eventString, 1, -1));

        // Process individual events in string
        foreach ($eventStringArray as $singleEventString) {
            $event = $this->_decodeSingleEventString($singleEventString);
            array_push($this->_events, $event);
        }

        // Store a tree representation of the events for generating
        // human-readable strings
        $this->_createEventTree();

        // Check to make sure at least one valid event was specified
        if (sizeOf($this->_events) === 0) {
            throw new Exception(
                "No valid and visible events specified for request.", 20);
        }
    }

    /**
     * Returns the number of events in the collection
     *
     * @return int Number of events in request
     */
    public function length() {
        return sizeOf($this->_events);
    }

    /**
     * Returns the events as an array of associative arrays
     *
     * @return array An array of hashes representing the requested events
     */
    public function toArray() {
        return $this->_events;
    }

    /**
     * Returns a string representation of the request events suitable for use in queries
     *
     * @return string String representation of the request events for use API queries
     */
    public function serialize() {
    	return $this->_eventString;
    }

    /**
     * Creates a tree representation of the events
     *
     * @return void
     */
    private function _createEventTree() {
        $tree = array();

        foreach ($this->_events as $event) {
            $event_type = $event['event_type'];
            $frm_name = $event['frm_name'];
            if ( !isset($tree[$event_type]) ) {
                $tree[$event_type] = array();
            }
            if ( !isset($tree[$event_type][$frm_name]) ) {
                $tree[$event_type][] = $frm_name;
            }
        }

        $this->_eventTree = $tree;
    }

    /**
     * Takes a single event string and converts it to a more convenient
     * associative array. filling in any missing details as neccessary
     *
     * @param string $eventString A single event represented as a string in
     *                            the following format:
     *                            [event_type, frm_name, visible]
     *
     * @return array Associative array representation of the event
     */
    private function _decodeSingleEventString ($eventString) {

        // Break up string into individual components
        $eventArray = explode(",", $eventString);

        list($event_type, $frm_name, $visible) = $eventArray;

        // Associative array form
        return array (
            "event_type" => $event_type,
            "frm_name"   => $frm_name,
            "visible"    => ( $visible == 1 || strtolower($visible) == 'true' ) ? true : false
        );
    }

}