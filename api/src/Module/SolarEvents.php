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
        
        // Check for end date
        if (!isset($this->_params['endDate'])) {
            include_once "src/Helper/DateTimeConversions.php";
            $this->_params['endDate'] = getUTCDateString();
        }
        
        // Check for event type
        if (!isset($this->_params["eventType"])) {
            $this->_params['eventType'] = "**";
        }

        $jsonResult = $hek->getEvents(
                        $this->_params['startDate'], $this->_params['endDate'], $this->_params['eventType']
        );

        $ipod       = isset($this->_params['ipod']) && $this->_params['ipod'];
        $result     = $this->_addMediaToEventResponse(json_decode($jsonResult), $ipod);
        
        header('Content-Type: application/json');
        echo json_encode($result);
    }    
    
    /**
     * Gets any screenshot/movie files associated with each event in $jsonResult and adds it to the event
     * object. Sets $jsonResult->result to the array of event objects created.
     * 
     * @param object $jsonResult A json object which has an attribute "result", which is an array of
     *                           event information.
     * 
     * @return json object
     */
    private function _addMediaToEventResponse($jsonResult, $ipod)
    {
        $result = array();
        foreach ($jsonResult->result as $event) {
            $fullId  = explode("/", $event->kb_archivid);
            $id      = end($fullId);
            $format  = ($ipod === true? "mp4" : "flv");
            
            $tmpDir  = HV_CACHE_DIR . "/events/" . $id;
            $this->_createEventCacheDir($tmpDir);
            
            $event->screenshots = $this->_checkForFiles($tmpDir . "/screenshots", $ipod, "*");
            $event->movies      = $this->_checkForFiles($tmpDir . "/movies", $ipod, $format);

            $result[] = $event;
        }

        $jsonResult->result = $result;
        return $jsonResult;
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
        // Any booleans that default to true cannot be listed here because the
        // validation process sets them to false if they are not given.
        case "getScreenshotsForEvent": 
            $expected = array(
                "required" => array('eventId'),
                "floats"   => array('imageScale', 'x1', 'x2', 'y1', 'y2'),
                "dates"    => array('obsDate'),
                "ints"     => array('quality'),
                "bools"    => array('display', 'getOnly', 'ipod')
            );
            break;
        // Any booleans that default to true cannot be listed here because the
        // validation process sets them to false if they are not given.
        case "getMoviesForEvent": 
            $expected = array(
                "required" => array('eventId'),
                "dates"    => array('startTime', 'endTime'),
                "ints"     => array('frameRate', 'quality', 'numFrames'),
                "floats"   => array('imageScale', 'x1', 'x2', 'y1', 'y2'),
                "bools"    => array('display', 'getOnly', 'ipod')
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
    
    /**
     * Gets a collection of screenshots from the cache as specified by the event ID 
     * in the parameters.
     * See the API webpage for example usage.
     *
     * @return image
     */
    public function getScreenshotsForEvent()
    {
        include_once 'src/Image/Screenshot/HelioviewerScreenshotBuilder.php';
        
        $builder = new Image_Screenshot_HelioviewerScreenshotBuilder();
        $tmpDir  = HV_CACHE_DIR . "/events/" . $this->_params['eventId'] . "/screenshots";
        $ipod    = isset($this->_params['ipod']) && $this->_params['ipod'];
        $this->_createEventCacheDir($tmpDir);
        
        $response = $this->_checkForFiles($tmpDir, $ipod, "*");
        if (empty($response) || HV_DISABLE_CACHE) {
        	if (!$this->_getOnly()) {                    
                $response = $this->_createForEvent($builder, $tmpDir);
            }
        }

        $finalResponse = array();
        foreach ($response as $filepath) {
            array_push($finalResponse, str_replace(HV_ROOT_DIR, HV_WEB_ROOT_URL, $filepath));
        }
        
        if (!empty($_POST)) {
            header('Content-Type: application/json');
        }
        echo JSON_encode($finalResponse);
        return $finalResponse;
    }
    
    /**
     * Gets a collection of movies from the cache as specified by the event ID 
     * in the parameters.
     * See the API webpage for example usage.
     *
     * @return movie URL
     */
    public function getMoviesForEvent () 
    {
        include_once 'src/Movie/HelioviewerMovieBuilder.php';
        
        $builder = new Movie_HelioviewerMovieBuilder();
        $tmpDir  = HV_CACHE_DIR . "/events/" . $this->_params['eventId'] . "/movies";
        $ipod    = isset($this->_params['ipod']) && $this->_params['ipod'];
        $format  = ($ipod === true? "mp4" : "flv");
        $this->_createEventCacheDir($tmpDir);
        
        $response = $this->_checkForFiles($tmpDir, $ipod, $format);        
        if (empty($response) || HV_DISABLE_CACHE) {
            if (!$this->_getOnly()) {
                $response = $this->_createForEvent($builder, $tmpDir);
            }
        }
        
        $finalResponse = array();
        foreach ($response as $filepath) {
            if ($filepath !== null) {
                array_push($finalResponse, str_replace(HV_ROOT_DIR, HV_WEB_ROOT_URL, $filepath));
            }
        }
        
        if (!empty($_POST)) {
            header('Content-Type: application/json');
        }
        echo JSON_encode($finalResponse);
        return $finalResponse;
    }
    
    /**
     * Globs a directory to see if there are any files in it.
     * 
     * @param string  $outputDir Directory path to where the screenshots or movies are stored
     * @param boolean $ipod      Whether to look in the ipod folder or regular folder
     * 
     * @return array
     */
    private function _checkForFiles($outputDir, $ipod, $format)
    {
        if ($ipod === true) {
            $outputDir .= "/iPod";
        } else {
            $outputDir .= "/regular";
        }

        $files = glob($outputDir . "/*." . $format);
        
        return $files;    	
    }
    
    /**
     * Creates a screenshot or movie based upon the eventId and the parameters specified.
     * 
     * @param object $builder -- An instance of HelioviewerScreenshotBuilder or
     *                           HelioviewerMovieBuilder
     * @param string $tmpDir  -- The directory where the movie/screenshot will be stored.
     *
     * @return array
     */
    private function _createForEvent($builder, $tmpDir)
    {
    	include_once(HV_ROOT_DIR . "/api/src/Helper/EventParser.php");
        $eventInfo = JSON_decode($this->_getSingleEventInformation());
        $result    = $eventInfo->result;
        
        if (!empty($result)) {
        	$result = $result[0];
            $layerInfo = getLayerInfoForEventType($result->event_type);

        	$info = array(
        	   "sourceIds"   => $layerInfo['sourceIds'],
        	   "imageScale"  => $layerInfo['imageScale'],
        	   "boundingBox" => polygonToBoundingBox($result->hpc_bbox),
        	   "startTime"   => $result->event_starttime,
        	   "endTime"     => $result->event_endtime,
        	   "obsDate"     => $result->event_starttime
        	);
        	
        	$params = array_merge($info, $this->_params);

            $response = $builder->createForEvent($params, $info, $tmpDir);
            return $response;
        }
        return array();
    }
    
    /**
     * Uses HEKAdapter to get information about a single event from its ID.
     *
     * @return object 
     */
    private function _getSingleEventInformation() {
    	include_once "src/Event/HEKAdapter.php";
        $hek = new Event_HEKAdapter();

        return $hek->getEventById($this->_params['eventId']);
    }
    
    /**
     * Checks to see if 'getOnly' is set to true in $params
     *
     * @return boolean
     */
    private function _getOnly()
    {
    	return isset($this->_params['getOnly']) && $this->_params['getOnly'] === true;
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
        $baseURL = "http://" . $_SERVER['HTTP_HOST'] . $_SERVER['PHP_SELF'];
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
                <a href="<?php echo $baseURL;?>?action=getEventCatalogs">
                    <?php echo $baseURL;?>?action=getEventFRMs
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
                <a href="<?php echo $baseURL;?>?action=getEventFRMs&startDate=2010-07-01T00:00:00.000Z&endDate=2010-07-02T00:00:00.000Z">
                   <?php echo $baseURL;?>?action=getEventFRMs&startDate=2010-07-01T00:00:00.000Z&endDate=2010-07-02T00:00:00.000Z
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
        
                    <?php echo $baseURL;?>?action=getScreenshotsForEvent<br />
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
	                            <td><i>[Optional]</i> Whether or not you are looking for the scaled iPod-sized screenshot or the regular-sized screenshot.
	                                Defaults to false if not specified.</td>
	                        </tr>
                            <tr>
                                <td><b>getOnly</b></td>
                                <td width="20%"><i>Boolean</i></td>
                                <td><i>[Optional]</i> Whether or not you want images built if they don't exist. Set this to true if you 
                                    are calling this method from an iPod or other interface where you just want to check for existing files.
                                    Defaults to false if not specified.</td>
                            </tr>
	                    </tbody>
	                </table>
	                <br />
	                
	                The rest of the parameter list is identical to that of <a href="#takeScreenshot" style="color:#3366FF">takeScreenshot</a>, except that you should never
	                specify <i>filename</i> in the parameters.
	                <br /><br />
	                
	                <span class="example-header">Examples:</span>
	                <span class="example-url">
	                <a href="<?php echo $baseURL;?>?action=getScreenshotsForEvent&eventId=AR211_TomBerger_20100630_175443">
	                    <?php echo $baseURL;?>?action=getScreenshotsForEvent&eventId=AR211_TomBerger_20100630_175443
	                </a>
	                </span><br />
	                <span class="example-url">
	                <a href="<?php echo $baseURL;?>?action=getScreenshotsForEvent&eventId=AR211_TomBerger_20100630_175443&getOnly=true">
	                    <?php echo $baseURL;?>?action=getScreenshotsForEvent&eventId=AR211_TomBerger_20100630_175443&getOnly=true
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
                    more depending on parameters, or will return an empty array if <i>getOnly</i> is set to true.</p>
        
                <br />
    
                <div class="summary-box">            
                    <span style="text-decoration: underline;">Usage:</span><br />
                    <br />
            
                    <?php echo $baseURL;?>?action=getMoviesForEvent<br />
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
                            <tr>
                                <td><b>getOnly</b></td>
                                <td width="20%"><i>Boolean</i></td>
                                <td><i>[Optional]</i> Whether or not you want movies built if they don't exist. Set this to true if you 
                                    are calling this method from an iPod or other interface where you just want to check for existing files.
                                    Defaults to false if not specified.</td>
                            </tr>
                        </tbody>
                    </table>
                    <br />
                    
                    The rest of the parameter list is identical to that of <a href="#buildMovie" style="color:#3366FF">buildMovie</a>, except that you should never
                    specify <i>hqFormat</i> or <i>filename</i> in the parameters, as these are generated based upon the eventId and whether <i>ipod</i> is set to true or false.
                    <br /><br />
                    
                    <span class="example-header">Examples:</span>
                    <span class="example-url">
                    <a href="<?php echo $baseURL;?>?action=getMoviesForEvent&eventId=AR211_TomBerger_20100630_175443">
                        <?php echo $baseURL;?>?action=getMoviesForEvent&eventId=AR211_TomBerger_20100630_175443
                    </a>
                    </span><br />
                    <span class="example-url">
                    <a href="<?php echo $baseURL;?>?action=getMoviesForEvent&eventId=AR211_TomBerger_20100630_175443&getOnly=true">
                        <?php echo $baseURL;?>?action=getMoviesForEvent&eventId=AR211_TomBerger_20100630_175443&ipod=true
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