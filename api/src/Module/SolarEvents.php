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
    private $_options;

    /**
     * Constructor
     *
     * @param mixed &$params API Request parameters, including the action name.
     *
     * @return void
     */
    public function __construct(&$params)
    {
        $this->_params  = $params;
        $this->_options = array();
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
    public function  getEventFRMs()
    {
        include_once "src/Event/HEKAdapter.php";
        
        $hek = new Event_HEKAdapter();
        
        header("Content-type: application/json");
        echo $hek->getFRMs($this->_params['startDate'], $this->_params['endDate']);
    }
    
    /**
     * Gets a JSON-formatted list of Features/Events for the requested time range and FRMs 
     *
     *  Example Query:
     *
     * http://www.lmsal.com/hek/her?cosec=2&cmd=search&type=column&event_type=**
     *  &event_starttime=2010-07-01T00:00:00&event_endtime=2010-07-02T00:00:00
     *  &event_coordsys=helioprojective&x1=-1200&x2=1200&y1=-1200&y2=1200&result_limit=200&return=kb_archivid,concept,
     *  frm_institute,obs_observatory,frm_name,event_starttime,event_endtime,hpc_x,hpc_y,hpc_bbox
     *  
     *  QUERYING A SINGLE EVENT:
     *  
     *  http://www.lmsal.com/hek/her?cosec=2&cmd=search&type=column&event_type=**
     *  &event_starttime=0001-01-01T00:00:00&event_endtime=9999-01-01T00:00:00
     *  &event_coordsys=helioprojective&x1=-1200&x2=1200&y1=-1200&y2=1200&param0=kb_archivid
     *  &op0==&value0=ivo://helio-informatics.org/FA1550_YingnaSu_20090415_154655
     *  &return=required
     *  
     * @return void
     */
    public function getEvents()
    {
        include_once "src/Event/HEKAdapter.php";
        $hek = new Event_HEKAdapter();

        // Query the HEK
        $events = $hek->getEvents($this->_params['startDate'], $this->_options);

        //$result = $this->_addMediaToEventResponse(json_decode($jsonResult), $options['ipod']);
        
        header('Content-Type: application/json');
        echo json_encode($events);
    }    
    
    /**
     * Gets a collection of screenshots from the cache as specified by an event ID
     *  
     * See the API webpage for example usage.
     *
     * @return image
     */
    public function getScreenshotsForEvent()
    {
        include_once 'src/Event/SolarEvent.php';
        
        $event = new Event_SolarEvent($this->_params['eventId']);
        
        $response = $event->getScreenshots();        
        
        header('Content-Type: application/json');
        echo json_encode($response);
    }
    
    /**
     * Gets a collection of movies from the cache as specified by an event ID
     *  
     * See the API webpage for example usage.
     *
     * @return image
     */
    public function getMoviesForEvent()
    {
        include_once 'src/Event/SolarEvent.php';
        
        $ipod = (isset($this->_options['ipod']) && $this->_options['ipod']);
        
        $event = new Event_SolarEvent($this->_params['eventId']);
        
        $response = $event->getMovies($ipod);        
        
        header('Content-Type: application/json');
        echo json_encode($response);
    }
    
    /**
     * Creates the directory structure that will be used to store screenshots
     * based upon events. 
     *
     * @param string $cacheDir The path to cache/events/eventId
     * 
     * @return void
     */
    private function _createEventCacheDir($cacheDir)
    {
        $ipodDir = $cacheDir . "/iPod";
        if (!file_exists($ipodDir)) {
            mkdir($ipodDir, 0777, true);
            chmod($ipodDir, 0777);        
        }

        $regular = $cacheDir . "/regular";
        if (!file_exists($regular)) {
            mkdir($regular, 0777, true);
            chmod($regular, 0777);        
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
                "required" => array('startDate'),
                "optional" => array('ipod', 'eventType', 'endDate'),
                "bools"    => array('ipod'),
                "dates"    => array('startDate', 'endDate')
            );
            break;
        case "getEventFRMs":
            $expected = array(
               "required" => array('startDate', 'endDate'),
               "dates"    => array('startDate', 'endDate')
            );
            break;
        case "getScreenshotsForEvent": 
            $expected = array(
                "required" => array('eventId')
            );
            break;
        case "getMoviesForEvent": 
            $expected = array(
                "required" => array('eventId'),
                "optional" => array('ipod'),
                "bools"    => array('ipod')
            );
            break;  
        default:
            break;
        }

        // Check input
        if (isset($expected)) {
            Validation_InputValidator::checkInput($expected, $this->_params, $this->_options);
        }

        return true;
    }
    
    /**
     * Prints the module's documentation header
     * 
     * @return void
     */
    public static function printDocHeader()
    {
        ?>
        <li>
            <a href="index.php#FeatureEventAPI">Features/Events</a>
            <ul>
                <li><a href="index.php#getEventFRMs">Feature Recognition Methods (FRMs)</a></li>
                <li><a href="index.php#getEvents">Finding Events</a></li>
                <li><a href="index.php#getScreenshotsForEvent">Fetching or Creating Event Screenshots</a></li>
                <li><a href="index.php#getMoviesForEvent">Fetching or Creating Event Movies</a></li>
            </ul>
        </li>
        <?php
    }
    
    /**
     * printDoc
     *
     * @return void
     */
    public static function printDoc()
    {
        ?>
        <!-- Feature/Event API -->
        <div id="FeatureEventAPI">
            <h1>Feature/Event API:</h1>
            <p>Solar feature/event data used by Helioviewer is retrieved through the 
            <a href="http://www.lmsal.com/hek/index.html">Heliophysics Event Knowledgebase (HEK)</a>. While the HEK includes
            a very <a href="http://www.lmsal.com/hek/api.html">rich and full-features API of it's own</a>, Helioviewer provides
            only a few simple but useful feature/event query methods. Each of these types of queries are described below.</p>
            <ol style="list-style-type: upper-latin;">
        
            <!-- FRM API -->
            <li>
            <div id="getEventFRMs">Event Feature Recognition Methods (FRM):
                <p>Each event stored in the HEK has an associated Feature Recognition Method or "FRM" which corresponds
                with the mechanism used to locate the event. This could be either an automated feature recognition method such
                as <a href="http://sidc.oma.be/cactus/">Computer Aided CME Tracking (CACTus)</a>
                or a simple user-submitted event. To query the list of available FRMs, simply call the "getEventFRMs" API method
                and specify a startDate and endDate. This will return a list of the FRMs for which event data exists in 
                the requested time range, as well as some meta-information describing each of the FRMs.</p>
        
                <br />
        
                <div class="summary-box">
                <span style="text-decoration: underline;">Usage:</span>
        
                <br />
                <br />
                <a href="<?php echo HV_API_ROOT_URL;?>?action=getEventCatalogs">
                    <?php echo HV_API_ROOT_URL;?>?action=getEventFRMs
                </a>
        
                <br /><br />
                Supported Parameters:
                <br /><br />
        
                <table class="param-list" cellspacing="10">
                    <tbody valign="top">
                        <tr>
                            <td width="20%"><b>startDate</b></td>
                            <td width="25%"><i>ISO 8601 UTC Date</i></td>
                            <td width="55%">Beginning of query window.</td>
                        </tr>
                        <tr>
                            <td><b>endDate</b></td>
                            <td><i>ISO 8601 UTC Date</i></td>
                            <td>End of query window.</td>
                        </tr>
                    </tbody>
                </table>
                
                <br /><br />
                Result:
                <br /><br />
                The result includes a list of event types denoted by their two-letter acronym as 
                <a href="http://www.lmsal.com/helio-informatics/hpkb/VOEvent_Spec.html">listed at the HEK</a>. Within each
                event type is a list of all FRMs for which events were found in the specified query window. Finally, for each
                FRM some basic information including the FRM name, id, url and contact information, along with the number
                of events matched are returned.
                <br /><br />
                
                <table class="param-list" cellspacing="10">
                    <tbody valign="top">
                        <tr>
                            <td width="20%"><b>count</b></td>
                            <td width="25%"><i>Integer</i></td>
                            <td width="55%">The number of events found for the associated FRM</td>
                        </tr>
                        <tr>
                            <td><b>frm_contact</b></td>
                            <td><i>String</i></td>
                            <td><i>[Optional]</i>E-mail address or name associated with the FRM</td>
                        </tr>
                        <tr>
                            <td><b>frm_url</b></td>
                            <td><i>String</i></td>
                            <td><i>[Optional]</i> The URL associated with the FRM</td>
                        </tr>
                    </tbody>
                </table>
                
                <br />
                
                <span class="example-header">Example:</span> <span class="example-url">
                <a href="<?php echo HV_API_ROOT_URL;?>?action=getEventFRMs&startDate=2010-07-01T00:00:00.000Z&endDate=2010-07-02T00:00:00.000Z">
                   <?php echo HV_API_ROOT_URL;?>?action=getEventFRMs&startDate=2010-07-01T00:00:00.000Z&endDate=2010-07-02T00:00:00.000Z
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
            
            <br />
            
            <!-- Fetching cached Event Screenshots  -->
            <li>
            <div id="getScreenshotsForEvent">Fetching or Creating Event Screenshots
                <p>Returns a collection of filepaths to screenshots of an event. If no screenshot files exist yet, it 
                    will create one or more depending on parameters, or will return an empty array if <i>getOnly</i> 
                    is set to true.</p>
        
                <br />
        
                <div class="summary-box"><span style="text-decoration: underline;">Usage:</span><br />
                    <br />
        
                    <?php echo HV_API_ROOT_URL;?>?action=getScreenshotsForEvent<br />
                    <br />
        
                    Supported Parameters:<br />
                    <br />
            
                    <table class="param-list" cellspacing="10">
                        <tbody valign="top">
                            <tr>
                                <td width="20%"><b>eventId</b></td>
                                <td width="20%"><i>String</i></td>
                                <td>The unique ID of the event, as obtained from querying HEK. </td>
                            </tr>
                        </tbody>
                    </table>
                    <br /><br />
                    
                    <span class="example-header">Examples:</span>
                    <span class="example-url">
                    <a href="<?php echo HV_API_ROOT_URL;?>?action=getScreenshotsForEvent&eventId=AR211_TomBerger_20100630_175443">
                        <?php echo HV_API_ROOT_URL;?>?action=getScreenshotsForEvent&eventId=AR211_TomBerger_20100630_175443
                    </a>
                    </span><br />
                    <span class="example-url">
                    <a href="<?php echo HV_API_ROOT_URL;?>?action=getScreenshotsForEvent&eventId=AR211_TomBerger_20100630_175443">
                        <?php echo HV_API_ROOT_URL;?>?action=getScreenshotsForEvent&eventId=AR211_TomBerger_20100630_175443
                    </a>
                    </span>
                </div>
            </div>
            </li>
    
            <br />
                    
            <!-- Fetching cached Event Movies -->
            <li>
            <div id="getMoviesForEvent">Fetching or Creating Event Movies
                <p>Returns a collection of filepaths to movies of an event. If no movie files exist yet, it will create one or 
                    more depending on parameters.</p>
        
                <br />
    
                <div class="summary-box">            
                    <span style="text-decoration: underline;">Usage:</span><br />
                    <br />
            
                    <?php echo HV_API_ROOT_URL;?>?action=getMoviesForEvent<br />
                    <br />
            
                    Supported Parameters:<br />
                    <br />
            
                    <table class="param-list" cellspacing="10">
                        <tbody valign="top">
                            <tr>
                                <td width="20%"><b>eventId</b></td>
                                <td width="20%"><i>String</i></td>
                                <td>The unique ID of the event, as obtained from querying HEK. </td>
                            </tr>
                            <tr>
                                <td><b>ipod</b></td>
                                <td width="20%"><i>Boolean</i></td>
                                <td><i>[Optional]</i> Whether or not you are looking for the iPod-compatible movie or the regular movie.
                                    Defaults to false if not specified.</td>
                            </tr>
                        </tbody>
                    </table>
                    <br /><br />
                    
                    <span class="example-header">Examples:</span>
                    <span class="example-url">
                    <a href="<?php echo HV_API_ROOT_URL;?>?action=getMoviesForEvent&eventId=AR_SPoCA_20101007_085532_20100904T014848_1">
                        <?php echo HV_API_ROOT_URL;?>?action=getMoviesForEvent&eventId=AR_SPoCA_20101007_085532_20100904T014848_1
                    </a>
                    </span><br />
                    <span class="example-url">
                    <a href="<?php echo HV_API_ROOT_URL;?>?action=getMoviesForEvent&eventId=AR211_TomBerger_20100630_175443&getOnly=true">
                        <?php echo HV_API_ROOT_URL;?>?action=getMoviesForEvent&eventId=AR211_TomBerger_20100630_175443&ipod=true
                    </a>
                    </span>
                </div>
            </div>
            </li>
            <br />
        </div>
    <?php
    }
}
?>