<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * HEKAdapter Class Definition
 *
 * PHP version 5
 *
 * @category Event
 * @package  Helioviewer
 * @author   Jeff Stys <jeff.stys@nasa.gov>
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
define('HEK_BASE_URL', 'http://www.lmsal.com/hek/her');
define('HEK_CACHE_DIR', HV_CACHE_DIR.'/events');
define('HEK_CACHE_WINDOW_HOURS', 24);  // 1,2,3,4,6,8,12,24 are valid
$GLOBALS['HEK_COLORS'] = Array(
    'AR' =>'FF8F97',
    'CME'=>'FFB294',
    'CD' =>'FFD391',
    'CH' =>'FEF38E',
    'CW' =>'E8FF8C',
    'FI' =>'C8FF8D',
    'FE' =>'A3FF8D',
    'FA' =>'7BFF8E',
    'FL' =>'7AFFAE',
    'LP' =>'7CFFC9',
    'OS' =>'81FFFC',
    'SS' =>'8CE6FF',
    'EF' =>'95C6FF',
    'CJ' =>'9DA4FF',
    'PG' =>'AB8CFF',
    'OT' =>'CA89FF',
    'SG' =>'E986FF',
    'SP' =>'FF82FF',
    'CR' =>'FF85FF',
    'CC' =>'FF8ACC',
    'ER' =>'FF8DAD',
    'TO' =>'FF8F97' );

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
    private $_hostname;
    private $_docroot;

    /**
     * Creates a new HEKAdapter instance
     *
     * @return void
     */
    public function __construct() {

        // Availability of $_SERVER variables depends on whether this script is
        // running via the mod_php Apache module or directly via the CLI
        // (during movie generation).
        if ( array_key_exists('HTTP_HOST', $_SERVER) ) {
            $this->_hostname = $_SERVER['HTTP_HOST'];
        }
        else if ( array_key_exists('HOST', $_SERVER) ) {
            $this->_hostname = $_SERVER['HOST'];
        }
        else {
            $this->_hostname = 'CLI';
        }

        $this->_baseURL = HEK_BASE_URL
                        . '?cosec=2&cmd=search&type=column'
                        . '&event_coordsys=helioprojective&x1=-30000&x2=30000'
                        . '&y1=-30000&y2=30000&requestfrom=Helioviewer'
                        . '&requestinghost='.$this->_hostname.'&';
        $this->_defaultEventTypesJSONPath = HV_API_ROOT_DIR
            . '/resources/JSON/defaultEventTypes.json';

        include_once HV_API_ROOT_DIR . '/src/Net/Proxy.php';

        $this->_proxy = new Net_Proxy($this->_baseURL);
    }

    /**
     * Return a list of event FRMs sorted by event type
     *
     * @param string $startTime Query start date
     * @param string $endTime   Query end date
     *
     * @return JSON List of event FRMs sorted by event type
     */
    public function getFRMs($startTime, $endTime) {
        $params = array(
            'event_starttime' => $startTime,
            'event_endtime'   => $endTime,
            'event_type'      => '**',
            'result_limit'    => 200,
            'return'          => 'frm_name,frm_url,frm_contact,'
                               . 'frm_specificid,event_type,concept'
        );

        $decoded = json_decode($this->_proxy->query($params, true), true);

        // create an array to keep track of which FRMs have been added
        $names = array();

        $unsorted = array();

        // remove redundant entries
        foreach ($decoded['result'] as $row) {
            $name = $row['frm_name'];
            if (!array_key_exists($name, $names)) {
                $names[$name] = 1;
                array_push($unsorted, $row);
            }
            else {
                $names[$name]++;
            }
        }

        $sorted = array();

        // sort by event type
        foreach ($unsorted as $frm) {
            $eventType = $frm['concept'].'/'.$frm['event_type'];
            $name      = $frm['frm_name'];

            if ( !isset($sorted[$eventType]) )
                $sorted[$eventType] = array();

            // remove redundant event_type and frm_parameters and add count
            unset($frm['event_type']);
            //unset($frm['frm_name']);
            $frm['count'] = $names[$name];

            $sorted[$eventType][$name] = $frm;
        }

        return json_encode($sorted);
    }


    /**
     * Return a JSON string containing an object pre-populated with event types
     *
     * @return JSON string
     */
    public function getDefaultEventTypes() {
        $fh   = @fopen($this->_defaultEventTypesJSONPath, 'r');
        $json = @fread($fh, @filesize($this->_defaultEventTypesJSONPath));
        @fclose($fh);

        return $json;
    }


    /**
     * Return a JSON string containing an object pre-populated with event types
     *
     * @return JSON string
     */
    public function getEventGlossary() {
        $file_path = HV_API_ROOT_DIR.'/resources/JSON/eventGlossary.json';
        $fh    = @fopen($file_path, 'r');
        $json  = @fread($fh, @filesize($file_path));
        @fclose($fh);

        return $json;
    }


    /**
     * Return a JSON string containing an object of event type parameters
     *    containing an array of FRMs
     *
     * @param string $startTime Query start date
     *
     * @return JSON List of event FRMs sorted by event type
     */
    public function getEventFRMs($startTime, $options) {
        $defaultEventTypes = json_decode($this->getDefaultEventTypes());

        // $options is used to pass the optional value of ar_filter through to
        // $this->getEvents().  If other parameters are accepted in the future,
        // that should not be passed through, they will need to be weeded out
        $events = $this->getEvents($startTime, $options);

        if ( $events !== false ) {
            foreach ($events as $i => $event) {
                // If an unexpected F/E type shows up in the HEK data,
                // append it to the default set.
                // (It will get a generic marker icon and color).
                $property = trim($event['concept']).'/'.$event['event_type'];

                if ( !property_exists($defaultEventTypes, $property) ) {
                    $defaultEventTypes->{$property} = new stdClass;
                }

                if ( !property_exists($defaultEventTypes->{$property},
                    $event['frm_name']) ) {

                    $newFRM = new stdClass;
                    $newFRM->frm_name    = urlencode($event['frm_name']);
                    $newFRM->frm_url     = $event['frm_url'];
                    $newFRM->frm_contact = $event['frm_contact'];
                    $newFRM->concept     = $event['concept'];
                    $newFRM->count       = 1;
                    $defaultEventTypes->{$property}->{$event['frm_name']}
                        = $newFRM;
                }
                else {
                    $defaultEventTypes->{$property}->{$event['frm_name']}->count++;
                }
            }
        }

        return json_encode($defaultEventTypes);
    }


    /**
     * Returns an array of event objects as a JSON string
     *
     * @param date   $startTime Start time for which events should be retrieved
     * @param string $options   Optional parameters
     *
     * @return JSON string
     */
    public function getEvents($startTime, $options) {
        include_once HV_API_ROOT_DIR.'/src/Helper/DateTimeConversions.php';

        $events = Array();

        // Default options
        $defaults = array(
            'eventType' => '**',
            'cacheOnly' => false,
            'force'     => false,
            'ar_filter' => true
        );
        $options = array_replace($defaults, $options);

        $dateArray = date_parse($startTime);


        // Determine JSON cache filename

        $hourOffset = floor( $dateArray['hour'] / HEK_CACHE_WINDOW_HOURS )
                    * HEK_CACHE_WINDOW_HOURS;

        $externalAPIStartTime = implode('-',
            Array( $dateArray['year'],
                   str_pad($dateArray['month'],2,'0',STR_PAD_LEFT),
                   str_pad($dateArray['day'],  2,'0',STR_PAD_LEFT) )
            ) . 'T' . implode(':', Array($hourOffset,'00:00.000Z') );

        $externalAPIEndTime = implode('-',
            Array( $dateArray['year'],
                   str_pad($dateArray['month'],2,'0',STR_PAD_LEFT),
                   str_pad($dateArray['day'],  2,'0',STR_PAD_LEFT) )
            ) . 'T' . str_pad($hourOffset+HEK_CACHE_WINDOW_HOURS-1, 2, '0',
            STR_PAD_LEFT) . ':59:59.999Z';

        $cache_base_dir = HV_CACHE_DIR.'/events/'.$dateArray['year']
            . '/' . str_pad($dateArray['month'],2,'0',STR_PAD_LEFT)
            . '/' . str_pad($dateArray['day'],  2,'0',STR_PAD_LEFT);

        $cache_filename = $cache_base_dir
            . '/' . str_pad($hourOffset,2,'0',STR_PAD_LEFT)
            .':00:00.000Z-'. str_pad($hourOffset+HEK_CACHE_WINDOW_HOURS-1, 2,
            '0', STR_PAD_LEFT) . ':59:59.999Z.json';


        include_once HV_API_ROOT_DIR.'/scripts/rot_hpc.php';

        // Scalar for normalizing HEK hpc_x and hpc_y coordinates based on the
        // apparent size of the Sun as seen from Earth at the specified
        // timestamp.
        // A reasonable approximation in the absence of the appropriate
        // spacecraft's position at the timestamp of the image(s) used for F/E
        // detection.
        $au_scalar = sunearth_distance($startTime);


        // Fetch data from cache or live external API query

        $fh = @fopen($cache_filename, 'r');
        if ( $fh !== false && $options['force'] === false) {
            $data = json_decode(@fread($fh, @filesize($cache_filename)));
            @fclose($fh);
        }
        else {
            // Fetch data from live external API and write to local JSON cache
            // HEK query parameters
            $params = array(
                'event_starttime' => $externalAPIStartTime,
                'event_endtime'   => $externalAPIEndTime,
                'event_type'      => '**', // Fetch all event types always,
                                           // filter by $options['event_type']
                                           // later
                'showtests'       => 'hide',
                'result_limit'    => 1000
            );
            $response = JSON_decode($this->_proxy->query($params, true), true);
            if ( count($response['result']) == 0 ) {
                return false;
            }

            // Sort HEK results by parameter name for each event
            $data = Array();
            foreach ($response['result'] as $index => $event) {

                if ( defined('PHP_VERSION_ID') && PHP_VERSION_ID >= 50400 ) {
                    ksort($event, SORT_NATURAL | SORT_FLAG_CASE);
                }
                else {
                    ksort($event, SORT_STRING);
                }

                // Build array of key/value pairs to use in marker labels
                // and popups
                $event['hv_labels_formatted']=$this->_buildLabelArray($event);

                $data[$index] = $event;
            }

            if ( $response['overmax'] === true ) {
                // TODO  Handle case where there are more results to fetch
                $error = new stdClass;
                $error->overmax = $response['overmax'];

                return($error);
            }

            // Only cache if results exist
            if ( count($data) > 0 ) {

                // Check existence of cache directory
                if ( !@file_exists($cache_base_dir) ) {
                    @mkdir($cache_base_dir, 0777, true);
                    @chmod($cache_base_dir, 0777);
                }

                $count = count($data);
                for ( $i=0; $i<$count; $i++ ) {

                    // Generate polygon PNG for events that have a chain code
                    if ( $data[$i]['hpc_boundcc'] != '' ) {
                        $this->drawPolygon($data[$i], $au_scalar,
                            $polyOffsetX, $polyOffsetY, $polyURL,
                            $polyWidth, $polyHeight);

                        // Save polygon info into $data to be cached
                        $data[$i]['hv_poly_hpc_x_ul_scaled_norot']
                            = $polyOffsetX;
                        $data[$i]['hv_poly_hpc_y_ul_scaled_norot']
                            = $polyOffsetY;
                        $data[$i]['hv_poly_url']
                            = $polyURL;
                        $data[$i]['hv_poly_width_max_zoom_pixels']
                            = $polyWidth;
                        $data[$i]['hv_poly_height_max_zoom_pixels']
                            = $polyHeight;
                    }
                }

                // Write cache file
                $fh = @fopen($cache_filename, 'w');
                if ( $fh !== false ) {
                    @fwrite($fh, json_encode($data));
                }
            }
        }

        // No output is desired for cacheOnly requests.
        // Also no need to calculate differential rotation or to
        // filter results.
        if ( $options['cacheOnly'] == true ) {
            return true;
        }

        // Only retain and output data that is relevent to this request
        $obs_time = new DateTime($startTime);

        if ( $options['ar_filter'] === true ) {
            $ar_swpc = Array();
        }

        foreach( (array)$data as $index => $event ) {

            if ( gettype($event) == 'object') {
                $event = (array) $event;
            }

            $event_starttime = new DateTime($event['event_starttime'].'Z');
            $event_endtime   = new DateTime($event['event_endtime']  .'Z');

            // Skip over any undesired or non-requested event types
            $eventTypesToIgnore  = Array('OT','NR');
            $eventTypesToAllow   = explode(',',$options['eventType']);
            if ( ($options['eventType'] != '**' &&
                  !in_array($event['event_type'], $eventTypesToAllow) )
                || in_array($event['event_type'],$eventTypesToIgnore)
                || $event['event_testflag'] === true ) {

                continue;
            }

            // Remove problematic characters from frm_name (used as selectors)
            $event['frm_name'] = str_replace(Array('(',')'), Array('',''),
                $event['frm_name']);

            // Retain any remaining events whose duration spans (or matches)
            // obs_time
            if ($event_endtime >= $obs_time && $event_starttime <= $obs_time) {

                // Some events may be represented by multiple HEK records,
                // will be combined later
                if ( $options['ar_filter'] === true &&
                     $event['frm_name'] == 'NOAA SWPC Observer' ) {

                    $ar_swpc[$event['ar_noaanum']][] = $event;
                }

                // Calculate radial distance for determining whether or not to
                // apply differential rotation.
                $event['hv_hpc_r_scaled'] = sqrt( pow($event['hpc_x'],2)
                                                + pow($event['hpc_y'],2)
                                            ) * $au_scalar;

                if ( $event['hv_hpc_r_scaled'] < 961.07064 ) {

                    // Differential rotation of the event marker's X,Y position

                    $rotateFromTime = $event['event_starttime'].'.000Z';
                    $rotateToTime   = $startTime;

                    if ( $event['frm_name'] == 'SPoCA' ) {
                        $rotateFromTime = $event['event_endtime'].'.000Z';
                    }
                    else if (
                        $event['frm_name'] == 'Emerging flux region module' &&
                        floatval($event['frm_versionnumber']) < 0.55
                        ) {

                        $rotateFromTime = $event['event_peaktime'].'.000Z';
                    }

                    list( $event['hv_hpc_x_notscaled_rot'],
                          $event['hv_hpc_y_notscaled_rot']) =
                        rot_hpc( $event['hpc_x'], $event['hpc_y'],
                                 $rotateFromTime, $rotateToTime,
                                 $spacecraft=null, $vstart=null, $vend=null);

                    $event['hv_hpc_x_rot_delta_notscaled']
                        = $event['hv_hpc_x_notscaled_rot'] - $event['hpc_x'];
                    $event['hv_hpc_y_rot_delta_notscaled']
                        = $event['hv_hpc_y_notscaled_rot'] - $event['hpc_y'];

                    $event['hv_hpc_x_scaled_rot']
                        = $event['hv_hpc_x_notscaled_rot'] * $au_scalar;
                    $event['hv_hpc_y_scaled_rot']
                        = $event['hv_hpc_y_notscaled_rot'] * $au_scalar;

                    $event['hv_rot_hpc_time_base'] = $event['event_starttime'];
                    $event['hv_rot_hpc_time_targ'] = $startTime;

                    // These values will be used to place the event marker
                    // in the viewport, screenshots, and movies.
                    $event['hv_hpc_x_final'] = $event['hv_hpc_x_scaled_rot'];
                    $event['hv_hpc_y_final'] = $event['hv_hpc_y_scaled_rot'];


                    // Drop events whose calculated marker position is NaN
                    if ( is_nan($event['hv_hpc_x_final']) ||
                         is_nan($event['hv_hpc_y_final']) ) {

                        continue;
                    }

                    // Apply differential rotation offset to the region
                    // polygon's upper-left X,Y position
                    if ( isset($event['hv_poly_hpc_x_ul_scaled_norot']) &&
                         isset($event['hv_poly_hpc_y_ul_scaled_norot']) &&
                         is_numeric($event['hv_poly_hpc_x_ul_scaled_norot']) &&
                         is_numeric($event['hv_poly_hpc_y_ul_scaled_norot'])
                       ) {

                        $event['hv_poly_hpc_x_ul_scaled_rot']
                            = $event['hv_poly_hpc_x_ul_scaled_norot']
                              + ( $event['hv_hpc_x_rot_delta_notscaled']
                                  * $au_scalar );

                        $event['hv_poly_hpc_y_ul_scaled_rot']
                            = $event['hv_poly_hpc_y_ul_scaled_norot']
                              + ( $event['hv_hpc_y_rot_delta_notscaled']
                                  * $au_scalar );

                        // These values will be used to place the region
                        // polygon in the viewport, screenshots, and movies.
                        // Represents upper-left corner of polygon PNG.
                        $event['hv_poly_hpc_x_final']
                            = $event['hv_poly_hpc_x_ul_scaled_rot'];
                        $event['hv_poly_hpc_y_final']
                            = $event['hv_poly_hpc_y_ul_scaled_rot'];
                    }
                }
                else {
                    // Don't apply differential rotation to objects beyond
                    // the disk but do normalize them with the $au_scalar.

                    // These values will be used to place the event marker
                    // in the viewport, screenshots, and movies.
                    $event['hv_hpc_x_final'] = $event['hpc_x'] * $au_scalar;
                    $event['hv_hpc_y_final'] = $event['hpc_y'] * $au_scalar;

                    if (   isset($event['hv_poly_hpc_x_ul_scaled_norot'])
                        && isset($event['hv_poly_hpc_y_ul_scaled_norot'])
                        && is_numeric($event['hv_poly_hpc_x_ul_scaled_norot'])
                        && is_numeric($event['hv_poly_hpc_y_ul_scaled_norot'])
                       ) {

                        // These values will be used to place the event
                        // polygons in the viewport, screenshots, and movies.

                        $event['hv_poly_hpc_x_final']
                            = $event['hv_poly_hpc_x_ul_scaled_norot'];

                        $event['hv_poly_hpc_y_final']
                            = $event['hv_poly_hpc_y_ul_scaled_norot'];
                    }
                }

                // Save the event for output
                $events[] = $event;
            }
        }
        unset($data);

        // Sort the remaining events by their Y coordinate so that
        // they overlap correctly in the viewport.
        usort($events, array($this, 'cmp_hpc_y'));


        // TODO  Move to a separate method
        // Collapse multi-record events into single records so they do not
        // appear as multiple annotations in the viewport, screenshots, movies.
        if ( $options['ar_filter'] === true ) {

            foreach ( $ar_swpc as $key => $value ) {

                if ( count($value) > 0 ) {

                    $shortest_interval     = null;
                    $hv_ar_mtwilsoncls     = null;
                    $hv_event_starttime    = null;
                    $hv_earliest_timestamp = null;
                    $hv_event_endtime      = null;
                    $hv_latest_timestamp   = null;

                    foreach ( $value as $key => $dup ) {
                        $start = new DateTime($dup['event_starttime'].'Z');
                        $end   = new DateTime($dup['event_endtime'].'Z');

                        $interval = $end->diff($start);

                        if ( $shortest_interval === null ||
                             $interval->format('%d') < $shortest_interval ) {

                            $shortest_interval = $interval->format('%d');
                            //$hv_ar_mtwilsoncls = $dup['ar_mtwilsoncls'];
                            $kb_archivid = $dup['kb_archivid'];
                            $hv_ar_noaanum = $dup['ar_noaanum'];
                        }

                        if ( $hv_earliest_timestamp === null ||
                             $start->getTimestamp() < $hv_earliest_timestamp) {

                            $hv_event_starttime = $dup['event_starttime'];
                            $hv_earliest_timestamp = $start->getTimestamp();
                        }

                        if ( $hv_latest_timestamp === null ||
                             $end->getTimestamp() > $hv_latest_timestamp ) {

                            $hv_event_endtime = $dup['event_endtime'];
                            $hv_latest_timestamp = $end->getTimestamp();
                        }
                    }

                    foreach ( $events as $i => $event ) {
                        if ( !isset($event['ar_noaanum']) ||
                             $event['ar_noaanum'] == '' ) {

                           continue;
                        }

                        if ( $event['kb_archivid'] == $kb_archivid ) {
                            $events[$i]['hv_event_starttime'] =
                                $hv_event_starttime;
                            $events[$i]['hv_event_endtime']   =
                                $hv_event_endtime;
                            //$events[$i]['hv_ar_mtwilsoncls'] = $hv_ar_mtwilsoncls;

                        }
                        else if ($event['ar_noaanum'] == $hv_ar_noaanum ) {
                            //$events[$i]['hv_visible'] = false;
                            unset($events[$i]);
                        }
                    }
                }
            }
        }

        return $events;
    }


    /**
     * Returns an associative array of F/E marker label key/value pairs
     *
     * @param array $event   HEK event data
     *
     * @return array
     */
    public function _buildLabelArray($event) {

        $labelArray = Array();

        if ( $event['event_type'] == 'AR') {
            if ( $event['frm_name'] == 'HMI HARP' ) {
                $labelArray['Area at Disk Center'] =
                    str_replace('+', '',
                        sprintf('%.1e', (float)$event['area_atdiskcenter'])
                    ) . ' ' . str_replace('2','²',$event['area_unit']);
            }
            else if ( $event['frm_name'] == 'NOAA SWPC Observer' ) {
                $labelArray['NOAA Number'] = $event['ar_noaanum'];

                if ( preg_match_all('/(ALPHA|BETA|GAMMA)/',
                     $event['ar_mtwilsoncls'], $matches) > 0 ) {

                    $ar_mtwilsoncls = implode('', $matches[0]);
                    $ar_mtwilsoncls = str_replace(
                        Array('ALPHA','BETA','GAMMA'),
                        Array('α',    'β',   'γ'),
                        $ar_mtwilsoncls);
                }
                else {
                    $ar_mtwilsoncl = $event['ar_mtwilsoncls'];
                }
                $labelArray['Mt. Wilson Class.'] = $ar_mtwilsoncls;
            }
            else if ( $event['frm_name'] == 'SPoCA' ) {
                $labelArray['Area at Disk Center'] =
                    str_replace('+', '',
                      sprintf('%.1e', (float)$event['area_atdiskcenter'])
                    ) . ' ± ' .
                    str_replace('+', '',
                      sprintf('%.1e', (float)$event['area_atdiskcenteruncert'])
                    ) . ' ' .
                    str_replace('2', '²', $event['area_unit']);
            }
        }
        else if ( $event['event_type'] == 'CE') {
            if ( $event['frm_name']=='CACTus (Computer Aided CME Tracking)' ) {

                $labelArray['Radial Lin. Vel.'] =
                    $event['cme_radiallinvel'] . ' ' .
                    $event['cme_radiallinvelstddev'] . ' ' .
                    $event['cme_radiallinvelunit'];

                $labelArray['Angular Width'] =
                    $event['cme_angularwidth'] . ' ' .
                    $event['cme_angularwidthunit'];
            }
            else if ( $event['frm_name']=='CDAW_GopalswamyYashiroFreeland' ) {

                $labelArray['Radial Lin. Vel.'] =
                    $event['cme_radiallinvel'] . ' ' .
                    $event['cme_radiallinvelunit'];

                $labelArray['Angular Width'] =
                    $event['cme_angularwidth'] . ' ' .
                    $event['cme_angularwidthunit'];

                $labelArray['Mass'] = $event['cme_mass'] . ' ' .
                    $event['cme_massunit'];
            }
        }
        else if ( $event['event_type'] == 'CH') {
            if ( $event['frm_name']=='LMSAL forecaster + SSW PFSS package' ||
                 $event['frm_name']=='LMSAL forecaster 2 + SSW PFSS package'
               ) {

                $labelArray['Area at Disk Center'] =
                    str_replace('+', '',
                      sprintf('%.1e', (float)$event['area_atdiskcenter'])
                    ) . ' ' . str_replace('2', '²', $event['area_unit']);
            }
            else if ( $event['frm_name'] == 'SPoCA' ) {
                $labelArray['Area at Disk Center'] =
                    str_replace('+', '',
                        sprintf('%.1e', (float)$event['area_atdiskcenter'])
                    ) . ' ± ' . str_replace('+', '',
                        sprintf('%.1e',
                            (float)$event['area_atdiskcenteruncert'])
                    ) . ' ' . str_replace('2','²',$event['area_unit']);
            }
        }
        else if ( $event['event_type'] == 'EF') {
            if ( $event['frm_name'] == 'Emerging flux region module' ) {
                if ( $event['area_atdiskcenter'] != null &&
                     $event['area_atdiskcenteruncert'] != null ) {

                    $labelArray['Area at Disk Center'] =
                        str_replace('+', '',
                            sprintf('%.1e',
                                (float)$event['area_atdiskcenter'])
                        ) . ' ± ' .
                        str_replace('+', '',
                            sprintf('%.1e',
                                (float)$event['area_atdiskcenteruncert'])
                        ) . ' ' . str_replace('2','²',$event['area_unit']);
                }
                if ( $event['ef_pospeakfluxonsetrate'] != null &&
                     $event['ef_onsetrateunit'] != null ) {

                    $labelArray['Peak Pos. Flux Onset'] =
                        round( (float)$event['ef_pospeakfluxonsetrate'], 1)
                        . ' ' . $event['ef_onsetrateunit'];
                }
                if ( $event['ef_negpeakfluxonsetrate'] != null &&
                     $event['ef_onsetrateunit'] != null ) {

                    $labelArray['Peak Neg. Flux Onset'] =
                        round( (float)$event['ef_negpeakfluxonsetrate'], 1)
                        . ' ' . $event['ef_onsetrateunit'];
                }
            }
        }
        else if ( $event['event_type'] == 'FI') {
            if ( $event['frm_name'] == 'AAFDCC' ) {
                $labelArray['Filament Length'] =
                    str_replace('+', '',
                        sprintf('%.1e',
                            (float)$event['fi_length']
                        )
                    ) . ' ' . $event['fi_lengthunit'];
            }
        }
        else if ( $event['event_type'] == 'FL') {
            if ( $event['frm_name'] == 'SEC standard' ) {
                $labelArray['GOES Class'] = $event['fl_goescls'];
            }
            elseif ( $event['frm_name']=='Flare Detective - Trigger Module' ) {

                $labelArray['Peak Flux'] =
                    round( (float)$event['fl_peakflux'], 1)
                    . ' ' . $event['fl_peakfluxunit'];
            }
        }
        else if ( $event['event_type'] == 'SG') {
            if ( $event['frm_name'] == 'Sigmoid Sniffer' ) {
                $labelArray['Shape'] = $event['sg_shape'];
            }
        }
        else {
            $labelArray = Array('Event Type' => $event['concept']);
        }

        return $labelArray;
    }


    /**
     * Comparison function for usort().
     * Sorts an array of Event objects by their 'hpc_y' value so that
     * EventMarker pins overlap properly.
     *
     * @param object $a
     * @param object $b
     *
     * @return integer  -1, 0, 1
     */
    public function cmp_hpc_y($a, $b) {
        if ($a['hpc_y'] == $b['hpc_y']) {
            return 0;
        }
        return ($a['hpc_y'] > $b['hpc_y']) ? -1 : 1;
    }


    /**
     * Returns a two-dimensional array of event types and associated frm_names
     *
     * @param string $eventLayers   Query-string representation of selected
     *                              event layers
     *
     * @return array
     */
    public function parseEventLayersString($eventLayers) {
        $eventLayers = trim($eventLayers,'[]');
        if ( $eventLayers == '' ) {
            return false;
        }
        $eventLayersArray  = explode('],[', $eventLayers);

        $layersArray = Array();
        foreach ($eventLayersArray as $eventTypeString) {
            $temp  = explode(',', $eventTypeString);
            $temp2 = explode(';', $temp[1]);
            $layersArray[$temp[0]] = $temp2;
        }

        return $layersArray;
    }


    /**
     * Return a JSON string containing an array of event objects filtered by
     * eventLayer URL query-string parameter
     *
     * @param string $startTime    Query start date
     * @param string $eventLayers  Query-string representation of selected
     *                             event layers
     *
     * @return JSON array of event objects
     */
    public function getEventsByEventLayers($startTime, $eventLayers) {

        $eventLayersArray = $this->parseEventLayersString($eventLayers);
        if ( !$eventLayersArray ) {
            // Invalid $eventLayers string, return an empty array
            return json_encode(Array());
        }

        // Generate list of selected event types
        $eventType = implode(',', array_keys($eventLayersArray));

        // Fetch events for this startTime matching list of selected event
        // types
        $events = $this->getEvents($startTime, Array('eventType'=>$eventType));

        // Filter out events whose associated frm_name was not explicitely or
        // implicitly selected
        foreach ($events as $eventIndex => $event) {

            // Don't discard if 'all' frm_names for that event type were
            // selected
            if ( strtolower($eventLayersArray[$event['event_type']][0]) ==
                 'all') {

                continue;
            }
            // Discard event if it isn't in the list of selected frm_names
            // for its (selected) event type
            else if ( !in_array($event['frm_name'],
                      $eventLayersArray[$event['event_type']]) ) {

                unset($events[$eventIndex]);
            }
        }

        // Re-index the array
        $events = array_values($events);
        usort($events, array($this, 'cmp_hpc_y'));

        return json_encode($events);
    }


    /**
     * Queries HEK for a single event's information
     *
     * @param string $eventId The ID of the event
     *
     * @return string
     */
    public function getEventById($eventId) {
        $params = array(
            'event_starttime' => '0001-01-01T00:00:00Z',
            'event_endtime'   => '9999-01-01T00:00:00Z',
            'event_type'      => '**',
            'result_limit'    => 1,
            'param0'          => 'kb_archivid',
            'op0'             => '=',
            'value0'          => 'ivo://helio-informatics.org/'.$eventId,
            'showtests'       => 'hide'
        );

        // Decode response
        $response = JSON_decode($this->_proxy->query($params, true), true);

        return $response['result'][0];
    }


    /**
     *
     *
     * @param
     *
     * @return void
     */
    private function drawPolygon($event, $au_scalar, &$polyOffsetX,
        &$polyOffsetY, &$polygonURL, &$polyWidth, &$polyHeight) {

        $originX=null; $originY=null; $polygonURL=null;

        $maxPixelScale = 0.60511022;  // arcseconds per pixel

        $polyString = $event['hpc_boundcc'];
        $polyString = str_replace(Array('POLYGON','(',')'), '', $polyString);
        foreach( explode(',', $polyString) as $xy ) {
            list($x_coord,$y_coord) = explode(' ',$xy);
            $x[] =  $x_coord * $au_scalar;
            $y[] = -$y_coord * $au_scalar;
        }

        $originX = min($x);
        $originY = min($y);

        $polyOffsetX = $originX;
        $polyOffsetY = $originY;

        $width=0; $height=0;

        for ($i=0; $i<count($x); $i++) {
            $xCoord = ($x[$i]-$originX) / $maxPixelScale;
            $yCoord = ($y[$i]-$originY) / $maxPixelScale;
            $polyArray[] = Array( 'x'=> $xCoord, 'y' => $yCoord );

            if ($xCoord > $width) {
                $width = $xCoord;
            }
            if ($yCoord > $height) {
                $height = $yCoord;
            }
        }

        /* Create a new imagick object */
        $im = new Imagick();

        /* Create ImagickDraw object */
        $draw = new ImagickDraw();

        $strokeWidth=4;

        $draw->setStrokeLineJoin(Imagick::LINEJOIN_ROUND);
        $draw->setStrokeColor('#00000088');
        $draw->setStrokeWidth($strokeWidth);
        $draw->setStrokeAntialias(true);
        $draw->setFillColor(
            '#'.$GLOBALS['HEK_COLORS'][$event['event_type']].'66' );
        $draw->polygon( $polyArray );

        $polyWidth  = $width  + $strokeWidth;
        $polyHeight = $height + $strokeWidth;

        /* Create a new canvas object and a transparent image */
        $canvas = new Imagick();
        $canvas->newImage($polyWidth, $polyHeight, 'none');

        /* Draw the ImagickDraw on to the canvas */
        $canvas->drawImage($draw);

        /* Set the format to PNG */
        $canvas->setImageFormat('png');
        $canvas->setInterlaceScheme(Imagick::INTERLACE_PNG);

        /* Output the image */
        $dateArray = date_parse($event['event_starttime']);
        $cache_base_dir = HV_CACHE_DIR.'/events/'.$dateArray['year']      . '/'
                        . str_pad($dateArray['month'],2,'0',STR_PAD_LEFT) . '/'
                        . str_pad($dateArray['day'],2,'0',STR_PAD_LEFT);

        // Check for existence of cache sub-directory
        if ( !@file_exists($cache_base_dir) ) {
            @mkdir($cache_base_dir, 0777, true);
        }

        $cache_file      = rawurlencode($event['kb_archivid']).'.png';
        $cache_file_path = $cache_base_dir.'/'.$cache_file;
        $polygonURL      = str_replace(HV_CACHE_DIR, 'cache', $cache_base_dir)
                         . '/' .rawurlencode($cache_file);

        $fp = @fopen($cache_file_path, 'wb');

        if ( $fp !== false ) {
            @fwrite($fp,$canvas);
            @fclose($fp);
        }
    }

}

?>