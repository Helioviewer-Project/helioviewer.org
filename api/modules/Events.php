<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Helioviewer Events Module
 * 
 * PHP version 5
 * 
 * @category Configuration
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @author   Jonathan Harper <jwh376@msstate.edu>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once 'interface.Module.php';

class Events implements Module
{
    /**
     * API Request parameters
     * 
     * @var mixed
     */
    private $_params;

    /**
     * Events module constructor
     * 
     * @param mixed &$params API request parameters
     */
    public function __construct(&$params)
    {
        include_once 'Helper.php';
        $this->_params = $params;
        $this->execute();

    }

    /**
     * execute
     */
    public function execute()
    {
        if ($this->validate()) {
            $this->{$this->_params['action']}();
        }
    }

    /**
     * validate
     * 
     * @return bool Returns true if input parameters are valid
     */
    public function validate()
    {
        switch($this->_params['action'])
        {
        case "getEvents":
            Helper::checkForMissingParams(
                array('date','windowSize','catalogs'), $this->_params
            );
            break;
        case "getEventCatalogs":
            break;
        default:
            throw new Exception("Invalid action specified. See the <a href='http://www.helioviewer.org/api/'>API Documentation</a> for a list of valid actions.");
            break;
        }
        return true;
    }

    /**
     * printDoc
     */
    public static function printDoc()
    {

    }

    /**
     * getEvents
     *
     */
    public function getEvents ()
    {
        header("Content-type: application/json");
        $url = HV_EVENT_SERVER_URL . "action=getEvents&date=" 
             . $this->_params["date"] . "&windowSize=" 
             . $this->_params["windowSize"] . "&catalogs="
             . $this->_params["catalogs"];
        echo file_get_contents($url);
    }

    /**
     * getEventCatalogs
     */
    public function getEventCatalogs ()
    {
        header("Content-type: application/json");
        $url = HV_EVENT_SERVER_URL . "action=getEventCatalogs";
        echo file_get_contents($url);
    }
}