<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Helioviewer Events Module Class Definition
 *
 * PHP version 5
 *
 * @category Modules
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @author   Jonathan Harper <jwh376@msstate.edu>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once 'interface.Module.php';

/**
 * Helioviewer Events Module
 *
 * @category Modules
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @author   Jonathan Harper <jwh376@msstate.edu>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Module_Events implements Module
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
        $this->_params = $params;
        $this->execute();

    }

    /**
     * execute
     *
     * @return void
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
            $expected = array(
               "required" => array('date','windowSize','catalogs'),
               "dates"    => array('date'),
               "ints"     => array('windowSize')
            );
            break;
        case "getEventCatalogs":
            break;
        default:
            break;
        }

        if (isset($expected)) {
            Validation_InputValidator::checkInput($expected, $this->_params);
        }

        return true;
    }

    /**
     * printDoc
     *
     * @return void
     */
    public static function printDoc()
    {

    }

    /**
     * getEvents
     *
     * @return void
     */
    public function getEvents ()
    {
        header("Content-type: application/json");
        $url = HV_EVENT_SERVER_URL . "action=getEvents&date="
             . $this->_params["date"] . "&windowSize="
             . $this->_params["windowSize"] . "&catalogs="
             . $this->_params["catalogs"];
        if ($events = file_get_contents($url)) {
            echo $events;
        } else {
            echo "[]";
        }
    }

    /**
     * getEventCatalogs
     *
     * @return void
     */
    public function getEventCatalogs ()
    {
        header("Content-type: application/json");
        $url = HV_EVENT_SERVER_URL . "action=getEventCatalogs";
        if ($catalogs = file_get_contents($url)) {
            echo $catalogs;
        } else {
            echo "[]";
        }
    }
}
?>