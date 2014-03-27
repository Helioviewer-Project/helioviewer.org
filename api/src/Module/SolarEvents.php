<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Helioviewer SolarEvents Module class definition.
 *
 * PHP version 5
 *
 * @category Application
 * @package  Helioviewer
 * @author   Jeff Stys <jeff.stys@nasa.gov>
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once 'interface.Module.php';
/**
 * Defines methods used by Helioviewer.org to interact with a JPEG 2000 archive.
 *
 * @category Application
 * @package  Helioviewer
 * @author   Jeff Stys <jeff.stys@nasa.gov>
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 *
 */
class Module_SolarEvents implements Module {

    private $_params;
    private $_options;

    /**
     * Constructor
     *
     * @param mixed &$params API Request parameters, including the action name.
     *
     * @return void
     */
    public function __construct(&$params) {
        $this->_params  = $params;
        $this->_options = array();
    }

    /**
     * execute
     *
     * @return void
     */
    public function execute() {
        if ($this->validate()) {
            try {
                $this->{$this->_params['action']}();
            }
            catch (Exception $e) {
                handleError($e->getMessage(), $e->getCode());
            }
        }
    }

    /**
     * Gets a JSON-formatted list of the Feature Recognition Methods which have
     * associated events for the requested time window, sorted by event type
     *
     * @return void
     */
    public function getEventFRMs() {
        include_once 'src/Event/HEKAdapter.php';

        $hek = new Event_HEKAdapter();

        header('Content-type: application/json');
        echo $hek->getEventFRMs($this->_params['startTime'], $this->_options);
    }

    /**
     * Gets a JSON-formatted list of the Feature Recognition Methods which have
     * associated events for the requested time window, sorted by event type
     *
     * @return void
     */
    public function getFRMs() {
        include_once 'src/Event/HEKAdapter.php';

        $hek = new Event_HEKAdapter();

        header('Content-type: application/json');
        echo $hek->getFRMs($this->_params['startTime'],
            $this->_params['endTime']);
    }

    /**
     * Gets a JSON-formatted list of the default event types
     * for use in pre-populating a hierarchical set of checkboxes
     * prior to fetching actual event FRMs for a given search window
     *
     * @return void
     */
    public function getDefaultEventTypes() {
        include_once 'src/Event/HEKAdapter.php';

        $hek = new Event_HEKAdapter();

        header('Content-type: application/json');
        echo $hek->getDefaultEventTypes();
    }

    /**
     *
     *
     * @return void
     */
    public function getEventGlossary() {
        include_once 'src/Event/HEKAdapter.php';

        $hek = new Event_HEKAdapter();

        header('Content-type: application/json');
        echo $hek->getEventGlossary();
    }

    /**
     * Gets a JSON-formatted array of the events objects whose duration
     * co-incides with startTime and whose event_type and associated
     * frm_name match the user-selected values.
     *
     * @return void
     */
    public function  getEventsByEventlayers() {
        include_once 'src/Event/HEKAdapter.php';

        $hek = new Event_HEKAdapter();

        header('Content-type: application/json');
        echo $hek->getEventsByEventLayers($this->_params['startTime'],
            $this->_params['eventLayers']);
    }

    /**
     * Gets a JSON-formatted list of Features/Events for the requested time
     * range and FRMs
     *
     *  Example Query:
     *
     *    http://www.lmsal.com/hek/her
     *      ?cosec=2&cmd=search&type=column&event_type=**
     *      &event_starttime=2010-07-01T00:00:00
     *      &event_endtime=2010-07-02T00:00:00&event_coordsys=helioprojective
     *      &x1=-1200&x2=1200&y1=-1200&y2=1200&result_limit=200
     *      &return=kb_archivid,concept,frm_institute,obs_observatory,frm_name,
     *          event_starttime,event_endtime,hpc_x,hpc_y,hpc_bbox
     *
     *  QUERYING A SINGLE EVENT:
     *
     *    http://www.lmsal.com/hek/her
     *      ?cosec=2&cmd=search&type=column&event_type=**
     *      &event_starttime=0001-01-01T00:00:00
     *      &event_endtime=9999-01-01T00:00:00
     *      &event_coordsys=helioprojective&x1=-1200&x2=1200&y1=-1200&y2=1200
     *      &param0=kb_archivid&op0==
     *      &value0=ivo://helio-informatics.org/FA1550_YingnaSu_20090415_154655
     *      &return=required
     *
     * @return void
     */
    public function getEvents() {
        include_once 'src/Event/HEKAdapter.php';

        $hek = new Event_HEKAdapter();

        // Query the HEK
        $events = $hek->getEvents($this->_params['startTime'],$this->_options);

        header('Content-Type: application/json');
        echo json_encode($events);
    }

    /**
     * validate
     *
     * @return bool Returns true if input parameters are valid
     */
    public function validate() {
        switch( $this->_params['action'] ) {

        case 'getEvents':
            $expected = array(
                'required' => array('startTime'),
                'optional' => array('eventType', 'cacheOnly', 'force',
                                    'ar_filter'),
                'bools'    => array('cacheOnly','force','ar_filter'),
                'dates'    => array('startTime')
            );
            break;
        case 'getEventsByEventLayers':
            $expected = array(
                'required' => array('startTime','eventLayers'),
                'optional' => array('ar_filter'),
                'bools'    => array('ar_filter'),
                'dates'    => array('startTime')
            );
            break;
        case 'getEventFRMs':
            $expected = array(
                'required' => array('startTime'),
                'optional' => array('ar_filter'),
                'bools'    => array('ar_filter'),
                'dates'    => array('startTime')
            );
            break;
        case 'getFRMs':
            $expected = array(
                'required' => array('startTime', 'endTime'),
                'dates'    => array('startTime', 'endTime')
            );
            break;
        default:
            break;
        }

        // Check input
        if ( isset($expected) ) {
            Validation_InputValidator::checkInput($expected, $this->_params,
                $this->_options);
        }

        return true;
    }
}
?>