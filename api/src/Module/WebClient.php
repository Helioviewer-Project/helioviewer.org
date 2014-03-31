<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Helioviewer WebClient Module class definition.
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
require_once "interface.Module.php";
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
class Module_WebClient implements Module {

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
        if ( $this->validate() ) {
            try {
                $this->{$this->_params['action']}();
            }
            catch (Exception $e) {
                handleError($e->getMessage(), $e->getCode());
            }
        }
    }


    /**
     * 'Opens' the requested file in the current window as an attachment,
     * which pops up the "Save file as" dialog.
     *
     * @TODO test this to make sure it works in all browsers.
     *
     * @return void
     */
    public function downloadScreenshot() {

        include_once 'src/Database/ImgIndex.php';
        include_once 'src/Helper/HelioviewerLayers.php';

        $imgIndex = new Database_ImgIndex();

        $info = $imgIndex->getScreenshot($this->_params['id']);

        $layers = new Helper_HelioviewerLayers($info['dataSourceString']);

        $dir = sprintf('%s/screenshots/%s/%s/',
           HV_CACHE_DIR,
           str_replace('-', '/', substr($info['timestamp'], 0, 10) ),
           $this->_params['id']
        );

        $filename = sprintf('%s_%s.png',
            str_replace(array(':', '-', ' '), '_', $info['observationDate']),
            $layers->toString()
        );

        $filepath = $dir . $filename;

        // If screenshot is no longer cached, regenerate it.
        if ( !@file_exists($filepath) ) {

            $this->reTakeScreenshot($this->_params['id']);

            if ( !@file_exists($filepath) ) {
                $filepath = str_replace(HV_CACHE_DIR, '', $filepath);
                throw new Exception(
                    'Unable to locate the requested file: '.$filepath, 24);
            }
        }

        // Set HTTP headers
        header('Pragma: public');
        header('Expires: 0');
        header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
        // required for certain browsers
        header('Cache-Control: private', false);
        header('Content-Disposition: attachment; filename="'.$filename.'"');
        header('Content-Transfer-Encoding: binary');
        header('Content-Length: '.@filesize($filepath));
        header('Content-type: image/png');

        echo file_get_contents($filepath);
    }

    /**
     * Finds the closest image available for a given time and datasource
     *
     * @return JSON meta information for matching image
     *
     * TODO: Combine with getJP2Image? (e.g. "&display=true")
     */
    public function getClosestImage() {
        include_once 'src/Database/ImgIndex.php';

        $imgIndex = new Database_ImgIndex();

        // Convert human-readable params to sourceId if needed
        if ( !isset($this->_params['sourceId']) ) {
            $this->_params['sourceId'] = $imgIndex->getSourceId(
                $this->_params['observatory'], $this->_params['instrument'],
                $this->_params['detector'], $this->_params['measurement'] );
        }

        $image = $imgIndex->getImageFromDatabase($this->_params['date'],
            $this->_params['sourceId']);

        // Read JPEG 2000 header
        $file   = HV_JP2_DIR.$image['filepath'].'/'.$image['filename'];
        $xmlBox = $imgIndex->extractJP2MetaInfo($file);

        // Prepare cache for tiles
        $this->_createTileCacheDir($image['filepath']);

        // Return date and id
        $response = array_merge(array(
            'id'   => $image['id'],
            'date' => $image['date']
        ), $xmlBox);

        // Print result
        $this->_printJSON(json_encode($response));
    }

    /**
     * getDataSources
     *
     * @return JSON Returns a tree representing the available data sources
     */
    public function getDataSources() {

        include_once 'src/Database/ImgIndex.php';

        $verbose = isset($this->_options['verbose']) ?
            $this->_options['verbose'] : false;

        // Work-around to enable JHelioviewer to toggle on/off a specific data
        // source or sources when doing a verbose getDataSources request.
        if ( isset($this->_options['enable']) ) {
            $enabled = explode(',', substr($this->_options['enable'], 1, -1));
        }
        else {
            $enabled = array();
        }

        $imgIndex    = new Database_ImgIndex();
        $dataSources = $imgIndex->getDataSources($verbose, $enabled);

        // Print result
        $this->_printJSON(json_encode($dataSources), false, true);
    }

    /**
     * getDataSourceList
     *
     * @return JSON Returns a flat array of data source objects
     */
    public function getDataSourceList() {

        include_once 'src/Database/ImgIndex.php';

        $imgIndex    = new Database_ImgIndex();

        // Print result
        $this->_printJSON(json_encode($imgIndex->getDataSourceList()),
            false, true);
    }

    /**
     * NOTE: Add option to specify XML vs. JSON... FITS vs. Entire header?
     *
     * @return void
     */
    public function getJP2Header() {
        include_once 'src/Database/ImgIndex.php';
        include_once 'src/Image/JPEG2000/JP2ImageXMLBox.php';

        $imgIndex = new Database_ImgIndex();
        $image = $imgIndex->getImageInformation($this->_params['id']);

        $filepath = HV_JP2_DIR.$image['filepath'].'/'.$image['filename'];

        $xmlBox = new Image_JPEG2000_JP2ImageXMLBox($filepath, 'meta');

        if ( isset($this->_params['callback']) ) {
            $this->_printJSON($xmlBox->getXMLString(), true);
        }
        else {
            $xmlBox->printXMLBox();
        }
    }

    /**
     * Requests a single tile to be used in Helioviewer.org.
     *
     * TODO 2011/04/19: How much longer would it take to request tiles if
     *                  meta data was refetched from database instead of
     *                  being passed in?
     *
     * @return object The image tile
     */
    public function getTile() {
        include_once 'src/Database/ImgIndex.php';
        include_once 'src/Image/JPEG2000/JP2Image.php';
        include_once 'src/Helper/RegionOfInterest.php';

        // Tilesize
        $tileSize = 512;

        $params = $this->_params;

        // Look up image properties
        $imgIndex = new Database_ImgIndex();
        $image = $imgIndex->getImageInformation($this->_params['id']);

        $this->_options['date'] = $image['date'];

        // Tile filepath
        $filepath =  $this->_getTileCacheFilename(
            $image['filepath'], $image['filename'], $params['imageScale'],
                $params['x'], $params['y'] );

        // Create directories in cache
        $this->_createTileCacheDir($image['filepath']);

        // JP2 filepath
        $jp2Filepath = HV_JP2_DIR.$image['filepath'].'/'.$image['filename'];

        // Reference pixel offset at the original image scale
        $offsetX =   $image['refPixelX'] - ($image['width']  / 2);
        $offsetY = -($image['refPixelY'] - ($image['height'] / 2));

        // Instantiate a JP2Image
        $jp2 = new Image_JPEG2000_JP2Image(
            $jp2Filepath, $image['width'], $image['height'], $image['scale']
        );

        // Region of interest
        $roi = $this->_tileCoordinatesToROI($params['x'], $params['y'],
            $params['imageScale'], $image['scale'], $tileSize, $offsetX,
            $offsetY);

        // Choose type of tile to create
        // TODO 2011/04/18: Generalize process of choosing class to use
        if ($image['instrument'] == 'SECCHI') {
            if ( substr($image['detector'], 0, 3) == 'COR' ) {
                $type = 'CORImage';
            }
            else {
                $type = strtoupper($image['detector']).'Image';
            }
        }
        else {
            $type = strtoupper($image['instrument']).'Image';
        }

        include_once 'src/Image/ImageType/'.$type.'.php';
        $classname = 'Image_ImageType_'.$type;

        // Create the tile
        $tile = new $classname(
            $jp2, $filepath, $roi, $image['observatory'],
            $image['instrument'], $image['detector'], $image['measurement'],
            $offsetX, $offsetY, $this->_options,
            $image['sunCenterOffsetParams']
        );

        // Save and display
        $tile->save();
        $tile->display();
    }

    /**
     * Obtains layer information, ranges of pixels visible, and the date being
     * looked at and creates a composite image (a Screenshot) of all the
     * layers.
     *
     * See the API webpage for example usage.
     *
     * Parameters quality, filename, and display are optional parameters and
     * can be left out completely.
     *
     * @return image/jpeg or JSON
     */
    public function takeScreenshot() {
        include_once 'src/Image/Composite/HelioviewerScreenshot.php';
        include_once 'src/Helper/HelioviewerLayers.php';
        include_once 'src/Helper/HelioviewerEvents.php';

        // Data Layers
        $layers = new Helper_HelioviewerLayers($this->_params['layers']);

        // Event Layers
        $events = Array();
        if ( !array_key_exists('events', $this->_params) ) {
            $this->_params['events'] = '';
        }
        $events = new Helper_HelioviewerEvents($this->_params['events']);

        // Event Labels
        $eventLabels = false;
        if ( array_key_exists('eventLabels', $this->_params) ) {
            $eventLabels = $this->_params['eventLabels'];
        }

        // Scale
        $scale     = false;
        $scaleType = 'earth';
        $scaleX    = 0;
        $scaleY    = 0;
        if ( array_key_exists('scale', $this->_params) ) {
            $scale     = $this->_params['scale'];
            $scaleType = $this->_params['scaleType'];
            $scaleX    = $this->_params['scaleX'];
            $scaleY    = $this->_params['scaleY'];
        }

        // Region of interest
        $roi = $this->_getRegionOfInterest();

        // Create the screenshot
        $screenshot = new Image_Composite_HelioviewerScreenshot(
            $layers, $events, $eventLabels, $scale, $scaleType, $scaleX,
            $scaleY, $this->_params['date'], $roi, $this->_options
        );

        // Display screenshot
        if (isset($this->_options['display']) && $this->_options['display']) {
            $screenshot->display();
        }
        else {
            // Print JSON
            $this->_printJSON(json_encode(array('id' => $screenshot->id)));
        }
    }

    /**
     * Re-generate a screenshot using the metadata stored in the 
     * `screenshots` database table.
     *
     * @return
     */
    public function reTakeScreenshot($screenshotId) {
        include_once 'src/Database/ImgIndex.php';
        include_once 'src/Image/Composite/HelioviewerScreenshot.php';
        include_once 'src/Helper/HelioviewerLayers.php';
        include_once 'src/Helper/HelioviewerEvents.php';
        include_once 'src/Helper/RegionOfInterest.php';

        // Default options
        $defaults = array(
            'force' => false,
            'display' => false
        );
        $options = array_replace($defaults, $this->_params);

        $screenshotId = intval($screenshotId);

        if ( $screenshotId <= 0 ) {
            throw new Exception(
                'Value of screenshot "id" parameter is invalid.', 25);
        }

        $imgIndex = new Database_ImgIndex();
        $metaData = $imgIndex->getScreenshotMetadata($screenshotId);

        $options['timestamp'] = $metaData['timestamp'];
        $options['observationDate'] = $metaData['observationDate'];

        $roiArr = explode(',', str_replace(array('POLYGON((', '))'), '',
            $metaData['roi']));

        $roi = array();
        foreach ( $roiArr as $index => $coordStr ) {
            $coordArr = explode(' ', $coordStr);
            if ( $index === 0 ) {
                $x1 = $coordArr[0];
                $y1 = $coordArr[1];
                $x2 = $coordArr[0];
                $y2 = $coordArr[1];
            }
            else if ($coordArr[0] <= $x1 &&
                     $coordArr[1] <= $y1) {
                $x1 = $coordArr[0];
                $y1 = $coordArr[1];
            }
            else if ($coordArr[0] >= $x2 &&
                     $coordArr[1] >= $y2) {
                $x2 = $coordArr[0];
                $y2 = $coordArr[1];
            }
        }

        $roi = new Helper_RegionOfInterest($x1, $y1, $x2, $y2,
            $metaData['imageScale']);

        // Data Layers
        $layers = new Helper_HelioviewerLayers(
            $metaData['dataSourceString']);

        // Limit screenshot to five layers
        if ( $layers->length() < 1 || $layers->length() > 5 ) {
            throw new Exception(
                'Invalid layer choices! You must specify 1-5 comma-separated '.
                'layer names.', 22);
        }

        // Event Layers
        $events = new Helper_HelioviewerEvents(
            $metaData['eventSourceString']);

        // Create the screenshot
        $screenshot = new Image_Composite_HelioviewerScreenshot(
            $layers, $events, (bool)$metaData['eventsLabels'],
            (bool)$metaData['scale'], $metaData['scaleType'],
            $metaData['scaleX'], $metaData['scaleY'],
            $metaData['observationDate'], $roi, $options
        );
    }

    /**
     * Retrieves a local or remote RSS/Atom news feed
     */
    public function getNewsFeed() {

        include_once 'lib/JG_Cache/JG_Cache.php';

        // Create cache dir if it doesn't already exist
        $cacheDir = HV_CACHE_DIR . '/remote';
        if ( !@file_exists($cacheDir) ) {
            @mkdir($cacheDir, 0777, true);
        }

        // Check for feed in cache
        $cache = new JG_Cache($cacheDir);

        if( !($feed = $cache->get('news.xml', 1800)) ) {

            // Re-fetch if it is old than 30 mins
            include_once 'src/Net/Proxy.php';
            $proxy = new Net_Proxy(HV_NEWS_FEED_URL);
            $feed  = $proxy->query();
            $cache->set('news.xml', $feed);
        }

        // Print Response as XML or JSONP/XML
        if ( isset($this->_params['callback']) ) {
            $this->_printJSON($feed, true, true);
        }
        else {
            header('Content-Type: text/xml;charset=UTF-8');
            echo $feed;
        }
    }

    /**
     * Uses bit.ly to generate a shortened URL
     *
     * Requests are sent via back-end for security per the bit.ly docs
     * recommendation.
     */
    public function shortenURL() {

        include_once 'src/Net/Proxy.php';

        $proxy = new Net_Proxy('http://api.bitly.com/v3/shorten?');

        $longURL = HV_WEB_ROOT_URL.'/?'
                 . urldecode($this->_params['queryString']);

        $params = array(
            'longUrl' => $longURL,
            'login'   => HV_BITLY_USER,
            'apiKey'  => HV_BITLY_API_KEY
        );

        $this->_printJSON($proxy->query($params));
    }

    /**
     * Retrieves the latest usage statistics from the database
     */
    public function getUsageStatistics() {

        // Are usage stats enabled?
        if ( !HV_ENABLE_STATISTICS_COLLECTION ) {
            throw new Exception('Sorry, usage statistics are not collected ' .
                'for this site.', 26);
        }

        // Determine resolution to use
        $validResolutions = array('hourly', 'daily', 'weekly', 'monthly',
            'yearly');
        if ( isset($this->_options['resolution']) ) {

            // Make sure a valid resolution was specified
            if ( !in_array($this->_options['resolution'], $validResolutions) ) {
                $msg = 'Invalid resolution specified. Valid options include '
                     . 'hourly, daily, weekly, monthly, and yearly';
                throw new Exception($msg, 25);
            }
        }
        else {
            // Default to daily
            $this->_options['resolution'] = 'daily';
        }

        include_once 'src/Database/Statistics.php';
        $statistics = new Database_Statistics();

        $this->_printJSON($statistics->getUsageStatistics(
            $this->_options['resolution'])
        );
    }

    /**
     * Retrieves the latest usage statistics from the database
     */
    public function getDataCoverage() {

        // Define allowed date/time resolutions
        $validRes = array('5m', '15m', '30m',
                          '1h',
                          '1D',
                          '1W',
                          '1M', '3M',
                          '1Y');
        if ( isset($this->_options['resolution']) && $this->_options['resolution']!='') {

            // Make sure a valid resolution was specified
            if ( !in_array($this->_options['resolution'], $validRes) ) {
                $msg = 'Invalid resolution specified. Valid options include: '
                     . implode(', ', $validRes);
                throw new Exception($msg, 25);
            }
            $resolution = $this->_options['resolution'];
        }
        else {
            $resolution = '1h';
        }

        $magnitude   = intval($resolution);
        $period_abbr = ltrim($resolution, '0123456789');


        $date = false;
        if ( isset($this->_options['endDate']) ) {
            $formatArr = Array('Y-m-d\TH:i:s\Z',
                               'Y-m-d\TH:i:s.u\Z',
                               'Y-m-d\TH:i:s.\Z');
            foreach ( $formatArr as $fmt ) {
                $date = DateTime::createFromFormat(
                    $fmt, $this->_options['endDate'] );
                if ( $date !== false ) {
                    break;
                }
            }
        }
        if ( $date === false ) {
            $date = new DateTime();
        }


        switch ($period_abbr) {
        case 'm':
            $steps    = 30;
            $stepSize = new DateInterval('PT'.($magnitude).'M');
            $interval = new DateInterval('PT'.($magnitude*$steps).'M');
            $endDate = clone $date;
            $endDate->setTime(date_format($date,'H'), 59, 59);
            $endDate->add(new DateInterval('PT1S'));
            break;
        case 'h':
            $steps    = 24;
            $stepSize = new DateInterval('PT'.($magnitude).'H');
            $interval = new DateInterval('PT'.($magnitude*$steps).'H');
            $date->setTime(date_format($date,'H'), 59, 59);
            $endDate = clone $date;
            $endDate->setTime(date_format($date,'H'), 59, 59);
            $endDate->add(new DateInterval('PT1S'));
            break;
        case 'D':
            $steps = 30;
            $stepSize = new DateInterval('P'.($magnitude).'D');
            $interval = new DateInterval('P'.($magnitude*$steps).'D');
            $endDate = clone $date;
            $endDate->setTime(23, 59, 59);
            $endDate->add(new DateInterval('PT1S'));
            break;
        case 'W':
            $steps = 36;
            $stepSize = new DateInterval('P'.($magnitude).'W');
            $interval = new DateInterval('P'.($magnitude*$steps).'W');
            $endDate = clone $date;
            $endDate->modify('first day of this week');
            $endDate->add(new DateInterval('P2W'));
            $endDate->setTime(23, 59, 59);
            $endDate->add(new DateInterval('PT1S'));
            break;
        case 'M':
            $steps = 36;
            $stepSize = new DateInterval('P'.($magnitude).'M');
            $interval = new DateInterval('P'.($magnitude*$steps).'M');
            $endDate = clone $date;
            $endDate->modify('last day of this month');
            $endDate->setTime(23, 59, 59);
            $endDate->add(new DateInterval('PT1S'));
            break;
        case 'Y':
            $steps = 25;
            $stepSize = new DateInterval('P'.($magnitude).'Y');
            $interval = new DateInterval('P'.($magnitude*$steps).'Y');
            $endDate = clone $date;
            $endDate->setDate(date_format($date,'Y'), 12, 31);
            $endDate->setTime(23, 59, 59);
            $endDate->add(new DateInterval('PT1S'));
            break;
        default:
            $msg = 'Invalid resolution specified. Valid options include: '
                 . implode(', ', $validRes);
            throw new Exception($msg, 25);
        }

        include_once 'src/Database/Statistics.php';
        $statistics = new Database_Statistics();

/*
        print_r(
            array(
                '_options' => $this->_options
            )
        );
        print_r(
            array(
                'interval'  => $interval,
                'steps'     => $steps,
                'stepSize'  => $stepSize,
                'endDate'   => $endDate
            )
        );
*/

        $this->_printJSON(
            $statistics->getDataCoverage(
                $resolution,
                $endDate,
                $interval,
                $stepSize,
                $steps
            )
        );
    }

    /**
     * Retrieves the latest usage statistics from the database
     */
    public function updateDataCoverage() {
        include_once 'src/Database/Statistics.php';
        $statistics = new Database_Statistics();
        $this->_printJSON(
            $statistics->updateDataCoverage($this->_options['period'])
        );
    }

    /**
     * Returns status information (i.e. time of most recent available data)
     * based on either observatory, instrument, detector or measurement.
     *
     * There are two types of queries that can be made:
     *
     * (1) instrument
     *
     * If key is set to instrument, then the time of the data source associated
     * with that instrument that is lagging the furthest behind is returned.
     *
     * (2) nickname
     *
     * If the key is set to nickname, then the most recent image times
     * are returned for all datasources, sorted by instrument.
     */
     public function getStatus() {

         // Connect to database
         include_once 'src/Database/ImgIndex.php';
         include_once 'src/Helper/DateTimeConversions.php';

         $imgIndex = new Database_ImgIndex();

         // Default to instrument-level status information
         if ( !isset($this->_options['key']) ) {
             $this->_options['key'] = 'instrument';
         }

         $statuses = array();

         // Case 1: instrument
         /**
          *
          * $instIds = (SELECT * FROM instruments)
          * foreach $instId as $instId:
          *     $datasources = (SELECT * FROM datasources WHERE instrumentId=$instId)
          *         find newest (and oldest?) date among the datasources
          *
          */
        $instruments = $imgIndex->getDataSourcesByInstrument();

        // Date format
        $format = 'Y-m-d H:i:s';

        // Current time
        $now = new DateTime();

        // Iterate through instruments
        foreach( $instruments as $inst => $dataSources ) {

            $oldest = new DateTime('2035-01-01');

            // Keep track of which datasource is the furthest behind
            foreach( $dataSources as $dataSource ) {

                // Get date string for most recent image
                $dateStr = $imgIndex->getNewestImage($dataSource['id']);

                // Skip data source if no images are found
                if ( is_null($dateStr) ) {
                    continue;
                }

                // Convert to DateTime
                $date = DateTime::createFromFormat($format, $dateStr);

                // Store if older
                if ($date < $oldest) {
                    $oldest = $date;
                }
            }

            // Get elapsed time
            $delta = $now->getTimestamp() - $oldest->getTimestamp();

            // Add to result array
            if ( $delta > 0 ) {
                $statuses[$inst] = array(
                    'time' => toISOString($oldest),
                    'level' => $this->_computeStatusLevel($delta, $inst),
                    'secondsBehind' => $delta
                );
            }
        }

         // Case 2: nickname (instrument + measurement)
         // @TODO

         // Get a list of the datasources grouped by instrument
         $this->_printJSON(json_encode($statuses));
     }

    /**
     * Determines a numeric indicator ("level") of how up to date a particular
     * image source is relative to it's normal operational availability.
     *
     * Note: values are currently hard-coded for different instruments.
     * A better solution might be to
     *
     */
     private function _computeStatusLevel($elapsed, $inst) {
        // Default values
        $t1 =   7200; // 2 hrs
        $t2 =  14400; // 4 hrs
        $t3 =  43200; // 12 hrs
        $t4 = 604800; // 1 week

        // Instrument-specific thresholds
        if ($inst == 'EIT') {
            $t1 = 14 * 3600;
            $t2 = 24 * 3600;
            $t3 = 48 * 3600;
        }
        else if ($inst == 'HMI') {
            $t1 =  4 * 3600;
            $t2 =  8 * 3600;
            $t3 = 24 * 3600;
        }
        else if ($inst == 'LASCO') {
            $t1 =  8 * 3600;
            $t2 = 12 * 3600;
            $t3 = 24 * 3600;
        }
        else if ($inst == 'SECCHI') {
            $t1 =  84 * 3600;  // 3 days 12 hours
            $t2 = 120 * 3600;  // 5 days
            $t3 = 144 * 3600;  // 6 days
        }
        else if ($inst == 'SWAP') {
            $t1 =  4 * 3600;
            $t2 =  8 * 3600;
            $t3 = 12 * 3600;
        }

        // Return level
        if ($elapsed <= $t1) {
            return 1;
        }
        else if ($elapsed <= $t2) {
            return 2;
        }
        else if ($elapsed <= $t3) {
            return 3;
        }
        else if ($elapsed <= $t4){
            return 4;
        }
        else {
            return 5;
        }
    }

    /**
     * Parses input and returns a RegionOfInterest instance. Excepts input
     * in one of two formats:
     *
     *  1) x1, y1, x2, y2, OR
     *  2) x0, y0, width, height
     */
    private function _getRegionOfInterest() {

        include_once 'src/Helper/RegionOfInterest.php';

        // Region of interest: x1, x2, y1, y2
        if (isset($this->_options['x1']) && isset($this->_options['y1']) &&
            isset($this->_options['x2']) && isset($this->_options['y2'])) {

            $x1 = $this->_options['x1'];
            $y1 = $this->_options['y1'];
            $x2 = $this->_options['x2'];
            $y2 = $this->_options['y2'];
        }
        else if ( isset($this->_options['x0']) &&
                  isset($this->_options['y0']) &&
                  isset($this->_options['width']) &&
                  isset($this->_options['height']) ) {

            // Region of interest: x0, y0, width, height
            $x1 = $this->_options['x0'] - 0.5 * $this->_options['width']
                * $this->_params['imageScale'];
            $y1 = $this->_options['y0'] - 0.5 * $this->_options['height']
                * $this->_params['imageScale'];

            $x2 = $this->_options['x0'] + 0.5 * $this->_options['width']
                * $this->_params['imageScale'];
            $y2 = $this->_options['y0'] + 0.5 * $this->_options['height']
                * $this->_params['imageScale'];
        }
        else {
            throw new Exception(
                'Region of interest not specified: you must specify values ' .
                'for imageScale and either x1, x2, y1, and y2 or x0, y0, ' .
                'width and height.', 23
            );
        }

        // Create RegionOfInterest helper object
        return new Helper_RegionOfInterest($x1, $y1, $x2, $y2,
            $this->_params['imageScale']);
    }


    /**
     * Creates the directory structure which will be used to cache
     * generated tiles.
     *
     * Note: mkdir may not set permissions properly due to an issue with umask.
     *       (See http://www.webmasterworld.com/forum88/13215.htm)

     *
     * @param string $filepath The filepath where the image is stored
     *
     * @return void
     */
    private function _createTileCacheDir($directory) {

        $cacheDir = HV_CACHE_DIR.'/tiles'.$directory;

        if ( !@file_exists($cacheDir) ) {
            @mkdir($cacheDir, 0777, true);
        }
    }

    /**
     * Builds a filename for a cached tile or image based on boundaries
     * and scale
     *
     * @param string $directory The directory containing the image
     * @param float  $filename  The filename of the image
     * @param float  $x         Tile X-coordinate
     * @param float  $y         Tile Y-coordinate
     *
     * @return string Filepath to use when locating or creating the tile
     */
    private function _getTileCacheFilename($directory, $filename, $scale,
        $x, $y) {

        $baseDirectory = HV_CACHE_DIR.'/tiles';
        $baseFilename  = substr($filename, 0, -4);

        return sprintf(
            "%s%s/%s_%s_x%d_y%d.png", $baseDirectory, $directory,
            $baseFilename, $scale, $x, $y
        );
    }

    /**
     * Helper function to output result as either JSON or JSONP
     *
     * @param string $json JSON object string
     * @param bool   $xml  Whether to wrap an XML response as JSONP
     * @param bool   $utf  Whether to return result as UTF-8
     *
     * @return void
     */
    private function _printJSON($json, $xml=false, $utf=false) {

        // Wrap JSONP requests with callback
        if ( isset($this->_params['callback']) ) {

            // For XML responses, surround with quotes and remove newlines to
            // make a valid JavaScript string
            if ($xml) {
                $xmlStr = str_replace("\n", '', str_replace("'", "\'", $json));
                $json   = sprintf("%s('%s')", $this->_params['callback'],
                    $xmlStr);
            }
            else {
                $json = sprintf("%s(%s)", $this->_params['callback'], $json);
            }
        }

        // Set Content-type HTTP header
        if ($utf) {
            header('Content-type: application/json;charset=UTF-8');
        }
        else {
            header('Content-Type: application/json');
        }

        // Print result
        echo $json;
    }

    /**
     * Converts from tile coordinates to physical coordinates in arcseconds
     * and uses those coordinates to return an ROI object
     *
     * @return Helper_RegionOfInterest Tile ROI
     */
    private function _tileCoordinatesToROI ($x, $y, $scale, $jp2Scale,
        $tileSize, $offsetX, $offsetY) {

        $relativeTileSize = $tileSize * ($scale / $jp2Scale);

        // Convert tile coordinates to arcseconds
        $top    = $y * $relativeTileSize - $offsetY;
        $left   = $x * $relativeTileSize - $offsetX;
        $bottom = $top  + $relativeTileSize;
        $right  = $left + $relativeTileSize;

        // Scale coordinates
        $top    = $top * $jp2Scale;
        $left   = $left * $jp2Scale;
        $bottom = $bottom * $jp2Scale;
        $right  = $right  * $jp2Scale;

        // Regon of interest
        return new Helper_RegionOfInterest(
            $left, $top, $right, $bottom, $scale );
    }

    /**
     * Handles input validation
     *
     * @return bool Returns true if the input is valid with respect to the
     *              requested action.
     */
    public function validate() {

        switch( $this->_params['action'] ) {

        case 'downloadScreenshot':
            $expected = array(
               'required' => array('id'),
               'optional' => array('force'),
               'ints'     => array('id'),
               'bools'    => array('force')
            );
            break;
        case 'getClosestImage':
            $expected = array(
               'dates'    => array('date'),
               'optional' => array('callback'),
               'alphanum' => array('callback')
            );

            if ( isset($this->_params['sourceId']) ) {
                $expected = array_merge(
                    $expected,
                    array(
                        'required' => array('date', 'sourceId'),
                        'ints'     => array('sourceId')
                    )
                );
            }
            else {
                $expected = array_merge(
                    $expected,
                    array(
                        'required' => array('date', 'observatory',
                                            'instrument', 'detector',
                                            'measurement')
                    )
                );
            }
            break;
        case 'getDataSources':
            $expected = array(
               'optional' => array('verbose', 'callback', 'enable'),
               'bools'    => array('verbose'),
               'alphanum' => array('callback')
            );
            break;
        case 'getDataSourceList':
            $expected = array(
               'required' => array()
            );
            break;
        case 'getTile':
            $expected = array(
                'required' => array('id', 'x', 'y', 'imageScale'),
                'floats'   => array('imageScale'),
                'ints'     => array('id', 'x', 'y')
            );
            break;
        case 'getJP2Header':
            $expected = array(
                'required' => array('id'),
                'ints'     => array('id'),
                'optional' => array('callback'),
                'alphanum' => array('callback')
            );
            break;
        case 'getNewsFeed':
            $expected = array(
                'optional' => array('callback'),
                'alphanum' => array('callback')
            );
            break;
        case 'getUsageStatistics':
            $expected = array(
                'optional' => array('resolution', 'callback'),
                'alphanum' => array('resolution', 'callback')
            );
            break;
        case 'getDataCoverage':
            $expected = array(
                'optional' => array('resolution','endDate',
                    'callback'),
                'alphanum' => array('resolution', 'callback'),
                'dates'    => array('endDate')
            );
            break;
        case 'updateDataCoverage':
            $expected = array(
                'optional' => array('period', 'callback'),
                'alphanum' => array('period', 'callback')
            );
            break;
        case 'shortenURL':
            $expected = array(
                'required' => array('queryString'),
                'optional' => array('callback'),
                'encoded'  => array('queryString', 'callback')
            );
            break;
        case 'takeScreenshot':
            $expected = array(
                'required' => array('date', 'imageScale', 'layers'),
                'optional' => array('display', 'watermark', 'x1', 'x2',
                                    'y1', 'y2', 'x0', 'y0', 'width', 'height',
                                    'events', 'eventLabels', 'scale',
                                    'scaleType', 'scaleX', 'scaleY',
                                    'callback'),
                'floats'   => array('imageScale', 'x1', 'x2', 'y1', 'y2',
                                    'x0', 'y0', 'scaleX', 'scaleY'),
                'ints'     => array('width', 'height'),
                'dates'    => array('date'),
                'bools'    => array('display', 'watermark', 'eventLabels',
                                    'scale'),
                'alphanum' => array('scaleType', 'callback')
            );
            break;
        case 'getStatus':
            $expected = array(
                'optional' => array('key'),
                'alphanum' => array('key')
            );
        default:
            break;
        }

        if ( isset($expected) ) {
            Validation_InputValidator::checkInput($expected, $this->_params,
                $this->_options);
        }

        return true;
    }
}
?>