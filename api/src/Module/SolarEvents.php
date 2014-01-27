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

    /**
     * Prints the module's documentation header
     *
     * @return void
     */
    public static function printDocHeader() {
?>
        <li>
            <a href="index.php#FeatureEventAPI">Features/Events</a>
            <ul>
                <li><a href="index.php#getEventFRMs">Feature Recognition
                    Methods (FRMs)</a></li>
                <li><a href="index.php#getEvents">Finding Events</a></li>
            </ul>
        </li>
<?php
    }

    /**
     * printDoc
     *
     * @return void
     */
    public static function printDoc() {
        ?>
        <!-- Feature/Event API -->
        <div id="FeatureEventAPI">
            <h1>Feature/Event API:</h1>
            <p>Solar feature/event data used by Helioviewer is retrieved
            through the <a href="http://www.lmsal.com/hek/index.html">
            Heliophysics Event Knowledgebase (HEK)</a>. While the HEK includes
            a very <a href="http://www.lmsal.com/hek/api.html">rich and
            full-featured API of it's own</a>, Helioviewer provides only a few
            simple but useful feature/event query methods. Each of these types
            of queries are described below.</p>
            <ol style="list-style-type: upper-latin;">

            <!-- FRM API -->
            <li>
            <div id="getEventFRMs">Event Feature Recognition Methods (FRM):
                <p>Each event stored in the HEK has an associated Feature
                Recognition Method or "FRM" which corresponds with the
                mechanism used to locate the event. This could be either an
                automated feature recognition method such as
                <a href="http://sidc.oma.be/cactus/">Computer Aided CME
                Tracking (CACTus)</a> or a simple user-submitted event. To
                query the list of available FRMs, simply call the
                "getEventFRMs" API method and specify a startTime and endTime.
                This will return a list of the FRMs for which event data
                exists in the requested time range, as well as some
                meta-information describing each of the FRMs.</p>

                <br />

                <div class="summary-box">
                <span style="text-decoration: underline;">Usage:</span>

                <br />
                <br />
                <a href="<?php echo HV_API_ROOT_URL; ?>?action=getEventFRMs">
                    <?php echo HV_API_ROOT_URL; ?>?action=getEventFRMs
                </a>

                <br /><br />
                Supported Parameters:
                <br /><br />

                <table class="param-list" cellspacing="10">
                    <tbody valign="top">
                        <tr>
                            <td width="20%"><b>startTime</b></td>
                            <td width="25%"><i>ISO 8601 UTC Date</i></td>
                            <td width="55%">Beginning of query window.</td>
                        </tr>
                        <tr>
                            <td><b>endTime</b></td>
                            <td><i>ISO 8601 UTC Date</i></td>
                            <td>End of query window.</td>
                        </tr>
                    </tbody>
                </table>

                <br /><br />
                Result:
                <br /><br />
                The result includes a list of event types denoted by their
                two-letter acronym as <a href="http://www.lmsal.com/helio-informatics/hpkb/VOEvent_Spec.html">listed at the HEK</a>.
                Within each event type is a list of all FRMs for which events
                were found in the specified query window. Finally, for each
                FRM some basic information including the FRM name, id, url and
                contact information, along with the number
                of events matched are returned.
                <br /><br />

                <table class="param-list" cellspacing="10">
                    <tbody valign="top">
                        <tr>
                            <td width="20%"><b>count</b></td>
                            <td width="25%"><i>Integer</i></td>
                            <td width="55%">The number of events found for the
                            associated FRM</td>
                        </tr>
                        <tr>
                            <td><b>frm_contact</b></td>
                            <td><i>String</i></td>
                            <td><i>[Optional]</i>E-mail address or name
                            associated with the FRM</td>
                        </tr>
                        <tr>
                            <td><b>frm_url</b></td>
                            <td><i>String</i></td>
                            <td><i>[Optional]</i> The URL associated with the
                            FRM</td>
                        </tr>
                    </tbody>
                </table>

                <br />

                <span class="example-header">Example:</span> <span class="example-url">
                <a href="<?php echo HV_API_ROOT_URL; ?>?action=getEventFRMs&startTime=2010-07-01T00:00:00.000Z&endTime=2010-07-02T00:00:00.000Z">
                   <?php echo HV_API_ROOT_URL; ?>?action=getEventFRMs&startTime=2010-07-01T00:00:00.000Z&endTime=2010-07-02T00:00:00.000Z
                </a>
                </span>


                </div>

                <br />

                <!-- FRM Example Result -->
                <div class="summary-box" style="background-color: #E3EFFF;">
                <span style="text-decoration: underline;">Example Result:</span>
                <br />
                <br />
                <pre style="font-size:12px">
        {
        "AR": {
            "NOAA SEC Observer": {
                "frm_url": "N/A",
                "frm_contact": "http://www.sec.noaa.gov/",
                "frm_identifier": "NOAA SEC",
                "count": 14
            }
        },
        "SS": {
            "EGSO_SFC": {
                "frm_url": "n/a",
                "frm_contact": "s.zharkov at sheffield dot ac dot uk",
                "frm_identifier": "EGSO_SFC",
                "count": 45
            }
        },
        "FL": {
            "SSW Latest Events": {
                "frm_url": "http://sohowww.nascom.nasa.gov/solarsoft/packages/gevloc/idl/ssw_flare_locator.pro",
                "frm_contact": "Samuel L. Freeland",
                "frm_identifier": "SolarSoft",
                "count": 13
            },
            "SEC standard": {
                "frm_url": "http://www.sec.noaa.gov/",
                "frm_contact": "SEC.Webmaster@noaa.gov",
                "frm_identifier": "SEC",
                "count": 13
            },
            "TRACE observer": {
                "frm_url": "http://hea-www.harvard.edu/trace/flare_catalog/",
                "frm_contact": "trace_planner at lmsal dot com",
                "frm_identifier": "TRACE flare catalog",
                "count": 1
            }
        },
        "FA": {
            "Karel Schrijver": {
                "frm_url": "n/a",
                "frm_contact": "Karel Schrijver",
                "frm_identifier": "Karel Schrijver",
                "count": 4
            }
        }
        }
                </pre>
                </div>

            </div>
            </li>

            <!-- Events API -->
            <li>
            <div id="getEvents">Events:
                <p>To retrieve a list of events for a given time range, the
                getEvents API method may be used. Results may be limited to
                specific types/catalogs using information from a getEventFRMs
                query.</p>

                <br />

                <div class="summary-box">
                <span style="text-decoration: underline;">Usage:</span>

                <br />
                <br />
                <a href="<?php echo HV_API_ROOT_URL; ?>?action=getEvents">
                    <?php echo HV_API_ROOT_URL; ?>?action=getEvents
                </a>
                <br /><br />
                Supported Parameters:
                <br /><br />

                <table class="param-list" cellspacing="10">
                    <tbody valign="top">
                        <tr>
                            <td width="20%"><b>startTime</b></td>
                            <td width="25%"><i>ISO 8601 UTC Date</i></td>
                            <td width="55%">Beginning of query window.</td>
                        </tr>
                        <tr>
                            <td><b>endTime</b></td>
                            <td><i>ISO 8601 UTC Date</i></td>
                            <td>(Optional) End of query window.</td>
                        </tr>
                        <tr>
                            <td width="20%"><b>eventType</b></td>
                            <td width="25%"><i>string</i></td>
                            <td width="55%">Event type to query for. The
                            complete list of acceptible event acronyms is
                            available at the <a href="http://www.lmsal.com/helio-informatics/hpkb/VOEvent_Spec.html">HEK</a>.
                            </td>
                        </tr>
                    </tbody>
                </table>

                <br /><br />
                Result:
                <br /><br />
                (explain)
                <br /><br />

                <table class="param-list" cellspacing="10">
                    <tbody valign="top">
                        <tr>
                            <td width="20%"><b>count</b></td>
                            <td width="25%"><i>Integer</i></td>
                            <td width="55%">The number of events found for the
                            associated FRM</td>
                        </tr>
                        <tr>
                            <td><b>frm_contact</b></td>
                            <td><i>String</i></td>
                            <td><i>[Optional]</i>E-mail address or name
                            associated with the FRM</td>
                        </tr>
                        <tr>
                            <td><b>frm_url</b></td>
                            <td><i>String</i></td>
                            <td><i>[Optional]</i> The URL associated with the
                            FRM</td>
                        </tr>
                    </tbody>
                </table>

                <br />

                <span class="example-header">Example:</span> <span class="example-url">
                <a href="<?php echo HV_API_ROOT_URL; ?>?action=getEvents&startTime=2010-07-01T00:00:00.000Z&endTime=2010-07-02T00:00:00.000Z">
                   <?php echo HV_API_ROOT_URL; ?>?action=getEvents&startTime=2010-07-01T00:00:00.000Z&endTime=2010-07-02T00:00:00.000Z
                </a>
                </span>


                </div>

                <br />

                <!-- FRM Example Result -->
                <div class="summary-box" style="background-color: #E3EFFF;">
                <span style="text-decoration: underline;">Example Result:
                </span>
                <br />
                <br />
                <pre style="font-size:12px">
        {
        "AR": {
            "NOAA SEC Observer": {
                "frm_url": "N/A",
                "frm_contact": "http://www.sec.noaa.gov/",
                "frm_identifier": "NOAA SEC",
                "count": 14
            }
        },
        "SS": {
            "EGSO_SFC": {
                "frm_url": "n/a",
                "frm_contact": "s.zharkov at sheffield dot ac dot uk",
                "frm_identifier": "EGSO_SFC",
                "count": 45
            }
        },
        "FL": {
            "SSW Latest Events": {
                "frm_url": "http://sohowww.nascom.nasa.gov/solarsoft/packages/gevloc/idl/ssw_flare_locator.pro",
                "frm_contact": "Samuel L. Freeland",
                "frm_identifier": "SolarSoft",
                "count": 13
            },
            "SEC standard": {
                "frm_url": "http://www.sec.noaa.gov/",
                "frm_contact": "SEC.Webmaster@noaa.gov",
                "frm_identifier": "SEC",
                "count": 13
            },
            "TRACE observer": {
                "frm_url": "http://hea-www.harvard.edu/trace/flare_catalog/",
                "frm_contact": "trace_planner at lmsal dot com",
                "frm_identifier": "TRACE flare catalog",
                "count": 1
            }
        },
        "FA": {
            "Karel Schrijver": {
                "frm_url": "n/a",
                "frm_contact": "Karel Schrijver",
                "frm_identifier": "Karel Schrijver",
                "count": 4
            }
        }
        }
                </pre>
                </div>

            </div>

            <br />
            </li>
            <br />
        </div>
<?php
    }
}
?>