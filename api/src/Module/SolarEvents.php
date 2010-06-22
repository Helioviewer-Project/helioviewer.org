<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Helioviewer SolarEvents Module class definition.
 *
 * PHP version 5
 *
 * @category Application
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once "interface.Module.php";

/**
 * Defines methods used by Helioviewer.org to interact with a JPEG 2000 archive.
 *
 * @category Application
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 *
 */
class Module_SolarEvents implements Module
{
    private $_params;

    /**
     * Constructor
     *
     * @param mixed &$params API Request parameters, including the action name.
     *
     * @return void
     */
    public function __construct(&$params)
    {
        $this->_params = $params;
    }

    /**
     * execute
     *
     * @return void
     */
    public function execute()
    {
        if ($this->validate()) {
            try {
                $this->{$this->_params['action']}();
            } catch (Exception $e) {
                // Output plain-text for browser requests to make Firebug debugging easier
                include_once "lib/FirePHPCore/fb.php";
                FB::error($e->getMessage());
                throw new Exception($e->getMessage());
            }
        }
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
     * Gets a JSON-formatted list of the Feature Recognition Methods which have 
     * associated events for the requested time window, sorted by event type
     * 
     * @return void
     */
    public function  getEventFRMs() {
        include_once "src/Event/HEKAdapter.php";
        
        $hek = new Event_HEKAdapter();
        
        echo $hek->getFRMs($this->_params['startDate'], $this->_params['endDate']);
    }
    
    /**
     * Gets a JSON-formatted list of Features/Events for the requested time range and FRMs 
     *
     * @return void
     */
    public function getEvents() {
        include_once "src/Event/HEKAdapter.php";

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
                "required" => array('startDate', 'endDate'),
                "dates"    => array('startDate', 'endDate'),
//                "ints"     => array('numFrames, frameRate, timeStep, quality', 'width', 'height', 'x1', 'x2', 'y1', 'y2'),
//                "floats"   => array('imageScale')
            );
            break;
        case "getEventFRMs":
            $expected = array(
               "required" => array('startDate', 'endDate'),
               "dates"    => array('startDate', 'endDate'),
            );
            break;
        default:
            break;
        }

        // Check input
        if (isset($expected)) {
            Validation_InputValidator::checkInput($expected, $this->_params);
        }

        return true;
    }
}
?>
