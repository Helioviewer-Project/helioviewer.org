<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * ImgIndex Class definition
 *
 * PHP version 5
 *
 * @category Database
 * @package  Helioviewer
 * @author   Jeff Stys <jeff.stys@nasa.gov>
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @author   Patrick Schmiedel <patrick.schmiedel@gmx.net>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
/**
 * Provides methods for interacting with a JPEG 2000 archive.
 *
 * @category Database
 * @package  Helioviewer
 * @author   Jeff Stys <jeff.stys@nasa.gov>
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @author   Patrick Schmiedel <patrick.schmiedel@gmx.net>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Database_ImgIndex {

    private $_dbConnection;

    /**
     * Constructor method
     *
     * @return void
     */
    public function __construct() {
        $this->_dbConnection = false;
    }

    /**
     * Create a connection to the database if one has not already been made.
     *
     * @return void
     */
    private function _dbConnect() {
        if ( $this->_dbConnection === false ) {
            include_once HV_API_DIR.'/src/Database/DbConnection.php';
            $this->_dbConnection = new Database_DbConnection();
        }
    }

    /**
     * Insert a new screenshot into the `screenshots` table.
     *
     * @return int Identifier in the `screenshots` table
     */
    public function insertScreenshot($date, $imageScale, $roi, $watermark,
        $layers, $bitmask, $events, $eventsLabels, $scale, $scaleType,
        $scaleX, $scaleY, $numLayers) {

        include_once HV_API_DIR.'/src/Helper/DateTimeConversions.php';

        $this->_dbConnect();

        $sql = sprintf(
            'INSERT INTO screenshots ' .
            'VALUES (NULL, NULL, "%s", %f, PolygonFromText("%s"), %b, "%s", ' .
            '%d, "%s", %b, %b, "%s", %f, %f, %d);',
            isoDateToMySQL($date),
            $imageScale,
            $roi,
            $watermark,
            $layers,
            bindec($bitmask),
            $events,
            $eventsLabels,
            $scale,
            $scaleType,
            $scaleX,
            $scaleY,
            $numLayers
        );

        $this->_dbConnection->query($sql);

        return $this->_dbConnection->getInsertId();
    }

    /**
     * Fetch metadata about a movie from the `movies` table.
     *
     * @param  $movieId  int  Identifier in the `movies` table
     *
     * @return Array represesenting a row in the `movies` table
     */
    public function getMovieInformation($movieId) {
        $this->_dbConnect();

        // LEFT JOIN ensures that we get a movie result even if there are no
        // corresponding records in the `movieFormats` table.  Just make sure
        // that the WHERE clause doesn't filter based on an `movieFormats`
        // columns.
        $sql = 'SELECT *, AsText(regionOfInterest) as roi FROM movies ' .
               'LEFT JOIN movieFormats ON movies.id = movieFormats.movieId ' .
               'WHERE movies.id='.$movieId.' LIMIT 1';

        return mysqli_fetch_array($this->_dbConnection->query($sql),
            MYSQLI_ASSOC);
    }

    /**
     * Update a row in the `movies` table with metadata describing the
     * generated movie's attributes.
     *
     * @return void
     */
    public function storeMovieProperties($movieId, $startDate, $endDate,
        $numFrames, $frameRate, $length, $width, $height) {

        $this->_dbConnect();

        $sql = sprintf(
           'UPDATE movies ' .
           'SET startDate="%s", endDate="%s", numFrames=%f, frameRate=%f, ' .
           'movieLength=%f, width=%d, height=%d WHERE id=%d',
           $startDate,
           $endDate,
           $numFrames,
           $frameRate,
           $length,
           $width,
           $height,
           $movieId);

        $this->_dbConnection->query($sql);
    }

    /**
     * Update a row in the `movies` table with processesing start and end times
     *
     * @param  $movieId  int  Identifier in the `movies` table
     * @param  $buildTimeStart string  Movie build start time
     * @param  $buildTimeEnd   string  Movie build end time
     *
     * @return void
     */
    public function finishedBuildingMovieFrames($movieId, $buildTimeStart,
        $buildTimeEnd) {

        $this->_dbConnect();

        $sql = 'UPDATE movies SET buildTimeStart="'.$buildTimeStart.'", ' .
               'buildTimeEnd="'.$buildTimeEnd.'" WHERE id='.$movieId;
        $this->_dbConnection->query($sql);
    }

    /**
     * Mark a movie as "processing" in the `movieFormats` table.
     *
     * @param  $movieId  int     Identifier in the `movies` table
     * @param  $format   string  Movie format being processed
     *
     * @return void
     */
    public function markMovieAsProcessing($movieId, $format=null) {
        $this->_dbConnect();

        $sql = 'UPDATE movieFormats SET status=1 WHERE movieId='.$movieId;
        if ( $format !== null ) {
            $sql .= ' AND format="'.$format.'"';
        }

        $this->_dbConnection->query($sql);
    }

    /**
     * Mark a movie as "finished" in the `movieFormats` table.
     *
     * @param  $movieId  int     Identifier in the `movies` table
     * @param  $format   string  Movie format being processed
     * @param  $procTime int     Number of seconds it took to encode the movie
     *
     * @return void
     */
    public function markMovieAsFinished($movieId, $format, $procTime) {
        $this->_dbConnect();

        $sql = 'UPDATE movieFormats SET status=2, procTime='.$procTime.' ' .
               'WHERE movieId='.$movieId;
        if ( $format !== null ) {
            $sql .= ' AND format="'.$format.'"';
        }

        $this->_dbConnection->query($sql);
    }

    /**
     * Mark a movie as "invalid" in the `movieFormats` table.
     *
     * @param  int  $movieId  Identifier in the `movies` table
     *
     * @return void
     */
    public function markMovieAsInvalid($movieId) {
        $this->_dbConnect();

        $this->_dbConnection->query(
            'UPDATE movieFormats SET status=3, ' .
            'procTime=NULL WHERE movieId='.$movieId);
    }

    /**
     * Fetch metadata about a screenshot from the `screenshots` table.
     *
     * @param  int  $screenshotId Identifier in the `screenshots` table
     *
     * @return Array represesenting a row in the `screenshots` table
     */
    public function getScreenshot($screenshotId) {
        $this->_dbConnect();

        $sql = 'SELECT * FROM screenshots WHERE id='.$screenshotId;

        return mysqli_fetch_array($this->_dbConnection->query($sql),
            MYSQLI_ASSOC);
    }

    /**
     * Fetch metadata about an image from the `images` and `datasources` tables
     * as well as the XML box of the JP2 image file.
     *
     * @param  int   $imageId  The image's identifier in the `images` table
     *
     * @return array Metadata related to the requested image.
     */
    public function getImageInformation($imageId) {
        $this->_dbConnect();

        $sql = 'SELECT * FROM images WHERE id='.$imageId.';';

        // Basic image info
        $image = mysqli_fetch_array($this->_dbConnection->query($sql),
            MYSQLI_ASSOC);
        $image['sourceId'] = (int) $image['sourceId'];

        // Fetch metadata from JP2 XML header
        $image_filepath = HV_JP2_DIR.$image['filepath'].'/'.$image['filename'];
        $xmlBox = $this->extractJP2MetaInfo($image_filepath);

        // Fetch metadata from the `datasources` table
        $datasource = $this->getDatasourceInformationFromSourceId(
            $image['sourceId']);

        return array_merge($image, $xmlBox, $datasource);
    }

    /**
     * Find available image data that is closest to the requested time and
     * return its metadata from the database and xmlBox (if applicable).
     *
     * @param string $date     A UTC date string of the form
     *                         "2003-10-05T00:00:00Z"
     * @param int    $sourceId An identifier specifying the image type or
     *                         source requested.
     *
     * @return array Metadata related to the closest image.
     */
    public function getClosestImage($date, $sourceId) {
        $this->_dbConnect();

        $img      = $this->getImageFromDatabase($date, $sourceId);
        $filename = HV_JP2_DIR.$img['filepath'].'/'.$img['filename'];
        $xmlBox   = $this->extractJP2MetaInfo($filename);

        return array_merge($img, $xmlBox);
    }

    /**
     * Query the database for image data that is closest to the requested time.
     *
     * @param string $date     A UTC date string of the form
     *                         "2003-10-05T00:00:00Z"
     * @param int    $sourceId An identifier specifying the image type or
     *                         source requested.
     *
     * @return array Associative array containing values from
     *               the `datasources` table.
     */
    public function getImageFromDatabase($date, $sourceId) {
        include_once HV_API_DIR.'/src/Helper/DateTimeConversions.php';

        $this->_dbConnect();

        $datestr = isoDateToMySQL($date);

        $sql = sprintf(
            '( SELECT id, filepath, filename, date
              FROM images
              WHERE
                sourceId = %d AND
                date < "%s"
              ORDER BY date DESC LIMIT 1 )
            UNION ALL
            ( SELECT id, filepath, filename, date
              FROM images
              WHERE
                sourceId = %d AND
                date >= "%s"
              ORDER BY date ASC LIMIT 1 )
            ORDER BY ABS(TIMESTAMPDIFF(MICROSECOND, date, "%s")
            ) LIMIT 1;',
            $sourceId, $datestr, $sourceId, $datestr, $datestr
        );

        // Query database
        $result = mysqli_fetch_array($this->_dbConnection->query($sql),
            MYSQLI_ASSOC);

        // Make sure match was found
        if ( is_null($result) ) {
            $source = $this->_getDataSourceName($sourceId);
            throw new Exception('No images of the requested type ('.$source .
                                ') are currently available.', 10);
        }

        // Cast id to integer
        $result['id'] = (int) $result['id'];

        return $result;
    }

    /**
     * Return the closest match from the `images` table whose time is on
     * or before the specified time.
     *
     * @param string $date     A UTC date string of the form
     *                         "2003-10-05T00:00:00Z"
     * @param int    $sourceId An identifier specifying the image type or
     *                         source requested.
     *
     * @return array Array containing one row from the `images` table
     */
    public function getClosestImageBeforeDate($date, $sourceId) {
        include_once HV_API_DIR.'/src/Helper/DateTimeConversions.php';

        $this->_dbConnect();

        $datestr = isoDateToMySQL($date);

        $sql = sprintf(
            'SELECT filepath, filename, date FROM images ' .
            'WHERE sourceId = %d AND date <= "%s" ' .
            'ORDER BY date DESC LIMIT 1;',
            $sourceId,
            $datestr);

        $img = mysqli_fetch_array($this->_dbConnection->query($sql),
            MYSQLI_ASSOC);

        // Make sure match was found
        if ( is_null($img) ) {
            $source = $this->_getDataSourceName($sourceId);
            throw new Exception('No '.$source.' images are available on or ' .
                                'before '.$date.'.', 11);
        }

        return $img;
    }

    /**
     * Return the closest match from the `images` table whose time is on
     * or after the specified time.
     *
     * @param string $date     A UTC date string of the form
     *                         "2003-10-05T00:00:00Z."
     * @param int    $sourceId An identifier specifying the image type or
     *                         source requested.
     *
     * @return array Array containing one row from the `images` table
     */
    public function getClosestImageAfterDate($date, $sourceId) {
        include_once HV_API_DIR.'/src/Helper/DateTimeConversions.php';

        $this->_dbConnect();

        $datestr = isoDateToMySQL($date);

        $sql = sprintf(
            'SELECT filepath, filename, date FROM images ' .
            'WHERE sourceId = %d AND date >= "%s" ' .
            'ORDER BY date ASC LIMIT 1;',
            $sourceId,
            $datestr);

        $img = mysqli_fetch_array($this->_dbConnection->query($sql),
            MYSQLI_ASSOC);

        // Make sure match was found
        if ( is_null($img) ) {
            $source = $this->_getDataSourceName($sourceId);
            throw new Exception('No '.$source.' images are available on or ' .
                                'after '.$date.'.', 11);
        }

        return $img;
    }

    /**
     * Get the human-readable name associated with the specified source id.
     *
     * @param  int    $sourceId The data source identifier in the database
     *
     * @return string Name of the data source associated with specified id
     */
    private function _getDataSourceName($sourceId) {
        $this->_dbConnect();

        $sql = 'SELECT name FROM datasources WHERE id='.$sourceId;
        $result = mysqli_fetch_array($this->_dbConnection->query($sql),
            MYSQLI_ASSOC);
        return $result['name'];
    }

    /**
     * Return the number of `images` table rows matching a source and time range
     *
     * @param datetime $start    Query start time
     * @param datetime $end      Query end time
     * @param int      $sourceId The data source identifier in the database
     *
     * @return int The number of `images` rows matching a source and time range
     */
    public function getImageCount($start, $end, $sourceId) {
        include_once HV_API_DIR.'/src/Helper/DateTimeConversions.php';

        $this->_dbConnect();

        $startDate = isoDateToMySQL($start);
        $endDate   = isoDateToMySQL($end);

        $sql = 'SELECT COUNT(*) FROM images ' .
               'WHERE sourceId='.$sourceId.' ' .
               'AND date BETWEEN "'.$startDate.'" AND "'.$endDate.'"';

        $result = mysqli_fetch_array($this->_dbConnection->query($sql));

        return (int)$result[0];
    }

    /**
     * Return an array of data from a given data source within the specified
     * time range.
     *
     * @param datetime $start     Query start time
     * @param datetime $end       Query end time
     * @param int      $sourceId  The data source identifier in the database
     * @param int      $maxFrames Optionally limit the size of the result set
     *
     * @return array Array containing matched rows from the `images` table
     */
    public function getImageRange($start, $end, $sourceId, $maxFrames=null) {
        include_once 'src/Helper/DateTimeConversions.php';

        $this->_dbConnect();

        $startDate = isoDateToMySQL($start);
        $endDate   = isoDateToMySQL($end);

        $images = array();
        $sql = 'SELECT * FROM images ' .
               'WHERE sourceId='.$sourceId.' ' .
               'AND date BETWEEN "'.$startDate.'" AND "'.$endDate.'" ' .
               'ORDER BY date ASC';
        if ( !is_null($maxFrames) && $maxFrames > 0 ) {
            $sql .= ' LIMIT '.(int)$maxFrames;
        }

        $result = $this->_dbConnection->query($sql);

        while ($image = $result->fetch_array(MYSQLI_ASSOC)) {
            array_push($images, $image);
        }

        return $images;
    }

    /**
     * Extract metadata from JP2 image file's XML header
     *
     * @param string $image_filepath Full path to JP2 image file
     *
     * @return array A subset of the information stored in the jp2 header
     */
    public function extractJP2MetaInfo($image_filepath) {
        include_once HV_API_DIR.'/src/Image/JPEG2000/JP2ImageXMLBox.php';

        try {
            $xmlBox = new Image_JPEG2000_JP2ImageXMLBox($image_filepath);

            $dimensions            = $xmlBox->getImageDimensions();
            $refPixel              = $xmlBox->getRefPixelCoords();
            $imageScale            = (float)$xmlBox->getImagePlateScale();
            $dsun                  = (float)$xmlBox->getDSun();
            $sunCenterOffsetParams = $xmlBox->getSunCenterOffsetParams();
            $layeringOrder         = $xmlBox->getLayeringOrder();

            // Normalize image scale
            $imageScale = $imageScale * ($dsun / HV_CONSTANT_AU);

            $meta = array(
                'scale'      => $imageScale,
                'width'      => (int)$dimensions[0],
                'height'     => (int)$dimensions[1],
                'refPixelX'  => (float)$refPixel[0],
                'refPixelY'  => (float)$refPixel[1],
                'sunCenterOffsetParams' => $sunCenterOffsetParams,
                'layeringOrder'         => $layeringOrder
            );
        }
        catch (Exception $e) {
            throw new Exception(
                sprintf('Unable to process XML Header for %s: %s',
                        $image_filepath, $e->getMessage() ), 13);
        }

        return $meta;
    }

    /**
     * Takes in a source id and returns the corresponding
     * observatory, instrument, detector, measurement, and
     * layeringOrder information.
     *
     * @param {int} $id Source Id
     *
     * @return {Array} $result_array  Contains values for
     *                               "observatory", "instrument",
     *                               "detector", "measurement",
     *                                and "layeringOrder"
     */
    public function getDatasourceInformationFromSourceId($sourceId) {
        $this->_dbConnect();

        $sql = sprintf(
            'SELECT
                observatories.name AS observatory,
                instruments.name AS instrument,
                detectors.name AS detector,
                measurements.name AS measurement,
                datasources.name AS name,
                datasources.layeringOrder AS layeringOrder
            FROM datasources
                LEFT JOIN observatories ON datasources.observatoryId = observatories.id
                LEFT JOIN instruments ON datasources.instrumentId = instruments.id
                LEFT JOIN detectors ON datasources.detectorId = detectors.id
                LEFT JOIN measurements ON datasources.measurementId = measurements.id
            WHERE
                datasources.id="%s"',
            mysqli_real_escape_string($this->_dbConnection->link, $sourceId)
        );

        $result = $this->_dbConnection->query($sql);
        $result_array = mysqli_fetch_array($result, MYSQLI_ASSOC);

        return $result_array;
    }

    /**
     * Returns the source Id, name, and layering order associated with a
     * data source specified by it's observatory, instrument, detector
     * and measurement.
     *
     * @param string $obs  Observatory
     * @param string $inst Instrument
     * @param string $det  Detector
     * @param string $meas Measurement
     *
     * @return array Datasource id and layering order
     */
    public function getDatasourceInformationFromNames($obs, $inst, $det,
        $meas) {

        $this->_dbConnect();

        $sql = sprintf(
            'SELECT
                datasources.id AS id,
                datasources.name AS name,
                datasources.layeringOrder AS layeringOrder
            FROM datasources
                LEFT JOIN observatories
                    ON datasources.observatoryId = observatories.id
                LEFT JOIN instruments
                    ON datasources.instrumentId = instruments.id
                LEFT JOIN detectors
                    ON datasources.detectorId = detectors.id
                LEFT JOIN measurements
                    ON datasources.measurementId = measurements.id
            WHERE
                observatories.name="%s" AND
                instruments.name="%s" AND
                detectors.name="%s" AND
                measurements.name="%s";',
            mysqli_real_escape_string($this->_dbConnection->link, $obs),
            mysqli_real_escape_string($this->_dbConnection->link, $inst),
            mysqli_real_escape_string($this->_dbConnection->link, $det),
            mysqli_real_escape_string($this->_dbConnection->link, $meas)
        );

        $result = $this->_dbConnection->query($sql);
        $result_array = mysqli_fetch_array($result, MYSQLI_ASSOC);

        return $result_array;
    }

    /**
     * Return `datasources` identifier for the matched labels
     *
     * @param string $obs  Observatory
     * @param string $inst Instrument
     * @param string $det  Detector
     * @param string $meas Measurement
     *
     * @return int The matched sourceId.
     */
    public function getSourceId($obs, $inst, $det, $meas) {
        $this->_dbConnect();

        $sql = sprintf(
            'SELECT
                datasources.id
            FROM datasources
                LEFT JOIN observatories
                    ON datasources.observatoryId = observatories.id
                LEFT JOIN instruments
                    ON datasources.instrumentId = instruments.id
                LEFT JOIN detectors
                    ON datasources.detectorId = detectors.id
                LEFT JOIN measurements
                    ON datasources.measurementId = measurements.id
            WHERE
                observatories.name="%s" AND
                instruments.name="%s" AND
                detectors.name="%s" AND
                measurements.name="%s";',
            mysqli_real_escape_string($this->_dbConnection->link, $obs),
            mysqli_real_escape_string($this->_dbConnection->link, $inst),
            mysqli_real_escape_string($this->_dbConnection->link, $det),
            mysqli_real_escape_string($this->_dbConnection->link, $meas)
        );

        $result = $this->_dbConnection->query($sql);
        $result_array = mysqli_fetch_array($result, MYSQLI_ASSOC);

        return (int)($result_array['id']);
    }

    /**
     * Returns the oldest image for a given datasource identifier
     */
    public function getOldestImage($sourceId) {
        $this->_dbConnect();

        $sql = 'SELECT date FROM images '  .
               'WHERE sourceId='.$sourceId.' ' .
               'ORDER BY date ASC LIMIT 1';
        $result = mysqli_fetch_array($this->_dbConnection->query($sql),
            MYSQLI_ASSOC);

        return $result['date'];
    }

    /**
     * Returns the newest image for a given datasource identifier
     */
    public function getNewestImage($sourceId) {
        $this->_dbConnect();

        $sql = 'SELECT date FROM images ' .
               'WHERE sourceId='.$sourceId.' ' .
               'ORDER BY date DESC LIMIT 1';
        $result = mysqli_fetch_array($this->_dbConnection->query($sql),
            MYSQLI_ASSOC);

        return $result['date'];
    }

    /**
     * Returns a list of datasources sorted by instrument
     *
     * @return array A list of datasources sorted by instrument
     */
    public function getDataSourcesByInstrument() {
        $this->_dbConnect();

        $result = $this->_dbConnection->query(
            'SELECT * FROM instruments ORDER BY name');

        $instruments = array();

        while( $instrument = mysqli_fetch_assoc($result) ) {
            $instruments[$instrument['name']] = array();

            $sql = sprintf(
                'SELECT * FROM datasources ' .
                'WHERE instrumentId=%d ' .
                'ORDER BY name', $instrument['id'] );

            $datasources = $this->_dbConnection->query($sql);
            while( $ds = mysqli_fetch_assoc($datasources) ) {
                array_push($instruments[$instrument['name']], $ds);
            }
        }

        return $instruments;
    }

    /**
     * Return a hierarchial list of the known data sources in one of
     * two formats.
     *
     * If $verbose is True, an alternative data structure is returned for
     * use with JHelioviewer.  A hard-coded list of datasources is excluded
     * from the output by default, to prevent JHelioviewer crashes.
     *
     * When $verbose is True, $enabled may contain a string of top-level
     * data sources to re-enable.  Example: '[STEREO_A,STEREO_B,PROBA2]'
     *
     * @param bool   $verbose   true or false
     * @param string $enabled   array string of top-level sources to include
     *
     * @return array A tree representation of the known data sources
     */
    public function getDataSources($verbose, $enabled) {

        if ( HV_DISABLE_CACHE !== true ) {
            include_once HV_API_DIR.'/src/Helper/Serialize.php';

            $cache = new Helper_Serialize('api/Database/ImgIndex',
                'getDataSources_'.json_encode($verbose, true).'_'.
                implode('-',$enabled).'.cache', $maxAgeSec=45);
            $data = $cache->readCache($verifyAge=true);
            if ( $data !== false ) {
                return $data;
            }
        }

        $this->_dbConnect();

        $fields = array('instrument', 'detector', 'measurement');

        $sql = 'SELECT
                    datasources.name as nickname,
                    datasources.id as id,
                    datasources.enabled as enabled,
                    datasources.layeringOrder as layeringOrder,
                    measurements.units as measurement_units,
                    observatories.name as observatory_name,
                    observatories.description as observatory_description, ';

        foreach ($fields as $field) {
            $sql .= sprintf(
                '%ss.name as %s_name, %ss.description as %s_description,',
                $field, $field, $field, $field );
        }

        $sql = substr($sql, 0, -1) . " " .
            'FROM datasources
                LEFT JOIN observatories
                    ON datasources.observatoryId = observatories.id
                LEFT JOIN instruments
                    ON datasources.instrumentId = instruments.id
                LEFT JOIN detectors
                    ON datasources.detectorId = detectors.id
                LEFT JOIN measurements
                    ON datasources.measurementId = measurements.id;';

        // 2011/06/10 Temporarily hiding STEREO from verbose output to
        //            prevent JHelioviewer from attempting to use
        // 2012/05/26 Same thing with SWAP
        // 2012/07/11 Adding switch to enable these layers for JHelioviewer
        if ($verbose) {
            $ignore = array('STEREO_A', 'STEREO_B', 'PROBA2', 'Yohkoh');

            $enabledList = '(';

            // Override hidden observatories if specified
            foreach ( $enabled as $x ) {
                $key = array_search($x, $ignore);
                if ($key !== false) {
                    unset($ignore[$key]);
                }
            }

            // Ignore remaining obseratories in ignore list
            foreach ( $ignore as $observatory ) {
                $enabledList .= "'$observatory',";
            }
            $enabledList = substr($enabledList, 0, -1) . ');';

            if ( sizeOf($ignore) > 0 ) {
                $sql = substr($sql, 0, -1) .
                    ' WHERE observatories.name NOT IN '.$enabledList;
            }
            else {
                $sql = substr($sql, 0, -1) . ';';
            }

        }

        // Use UTF-8 for responses
        $this->_dbConnection->setEncoding('utf8');

        // Fetch available data-sources
        $result = $this->_dbConnection->query($sql);

        $sources = array();

        while ( $row = $result->fetch_array(MYSQLI_ASSOC) ) {
            array_push($sources, $row);
        }

        // Convert results into a more easily traversable tree structure
        $tree = array();
        foreach ($sources as $source) {
            $enabled = (bool)$source['enabled'];

            // Only include if data is available for the specified source
            if ( !$enabled ) {
                continue;
            }

            // Image parameters
            $id       = (int)($source['id']);
            $obs      = $source['observatory_name'];
            $inst     = $source['instrument_name'];
            $det      = $source['detector_name'];
            $meas     = $source['measurement_name'];
            $nickname = $source['nickname'];
            $order    = (int)($source['layeringOrder']);

            // Availability
            $oldest = $this->getOldestImage($id);
            $newest = $this->getNewestImage($id);

            // Build tree
            if ( !$verbose ) {
                // Normal
                if (!isset($tree[$obs])) {
                    $tree[$obs] = array();
                }
                if (!isset($tree[$obs][$inst])) {
                    $tree[$obs][$inst] = array();
                }
                if (!isset($tree[$obs][$inst][$det])) {
                    $tree[$obs][$inst][$det] = array();
                }
                $tree[$obs][$inst][$det][$meas] = array(
                    'sourceId'      => $id,
                    'nickname'      => $nickname,
                    'layeringOrder' => $order,
                    'start'         => $oldest,
                    'end'           => $newest
                );
            }
            // Verbose format for JHelioviewer
            else {
                // Alternative measurement descriptors
                if (preg_match("/^\d*$/", $meas)) {
                    // \u205f = \xE2\x81\x9F = MEDIUM MATHEMATICAL SPACE
                    $measurementName = $meas . "\xE2\x81\x9F" .
                                       $source['measurement_units'];
                }
                else {
                    $measurementName = ucwords(str_replace('-', ' ', $meas));
                }

                // Verbose
                if (!isset($tree[$obs])) {
                    $tree[$obs] = array(
                        'name'        => $obs,
                        'description' => $source['observatory_description'],
                        'children'    => array()
                    );
                }
                if ( !isset($tree[$obs]['children'][$inst]) ) {
                    $tree[$obs]['children'][$inst] = array(
                        'name'        => $inst,
                        'description' => $source['instrument_description'],
                        'children'    => array()
                    );
                }
                if ( !isset($tree[$obs]['children'][$inst]['children'][$det]) ) {
                    $tree[$obs]['children'][$inst]['children'][$det] = array(
                        'name'        => $det,
                        'description' => $source['detector_description'],
                        'children'    => array()
                    );
                }
                $tree[$obs]['children'][$inst]['children'][$det]['children'][$meas] = array(
                    'name'          => $measurementName,
                    'description'   => $source['measurement_description'],
                    'nickname'      => $nickname,
                    'sourceId'      => $id,
                    'layeringOrder' => $order,
                    'start'         => $oldest,
                    'end'           => $newest
                );
            }
        }

        // Set defaults for verbose mode (JHelioviewer)
        if ($verbose) {
            $tree['SDO']['default'] = true;
            $tree['SDO']['children']['AIA']['default'] = true;
            $tree['SDO']['children']['AIA']['children']['AIA']['default'] = true;
            $tree['SDO']['children']['AIA']['children']['AIA']['children']['171']['default'] = true;
        }

        if ( HV_DISABLE_CACHE !== true ) {
            $cache->writeCache($tree);
        }

        return $tree;
    }

    /**
     *
     *
     * @return array A tree representation of the known data sources
     */
    public function getDataSourceList() {

        $this->_dbConnect();

        $sql = 'SELECT id, name, description FROM datasources WHERE enabled=1 ORDER BY description';

        // Use UTF-8 for responses
        $this->_dbConnection->setEncoding('utf8');

        // Fetch available data-sources
        $result = $this->_dbConnection->query($sql);

        $sources = array();

        while ( $row = $result->fetch_array(MYSQLI_ASSOC) ) {
            array_push($sources, $row);
        }

        return $sources;
    }

    /**
     * Return the full path to the image file from the specified source
     * most closely matching the given date.
     *
     * @param string $date     A UTC date string like "2003-10-05T00:00:00Z"
     * @param int    $sourceId The data source identifier in the database
     *
     * @param string $date     A UTC date string of the form
     *                         "2003-10-05T00:00:00Z."
     * @param int    $sourceId An identifier specifying the image type or
     *                         source requested.
     *
     * @return string Local filepath for the JP2 image.
     */
    public function getJP2FilePath($date, $sourceId) {
        $img = $this->getImageFromDatabase($date, $sourceId);

        return $img['filepath'].'/'.$img['filename'];
    }

    /**
     * Return the full path to the requested image file.
     *
     * @param int $id Identifier in the `images` table
     *
     * @return string Full path to the local data file
     */
    public function getJP2FilePathFromId($imageId) {
        $this->_dbConnect();

        $sql = 'SELECT concat(filepath, "/", filename) ' .
               'FROM images WHERE id='.$imageId;
        $row = mysqli_fetch_array($this->_dbConnection->query($sql));

        return array_pop($row);
    }

    /**
     * Return from the database the parameters that were used to generate 
     * a screenshot.
     *
     * @param int Unique screenshot identifier
     *
     * @return array Screenshot metadata
     */
    public function getScreenshotMetadata($screenshotId) {
        $this->_dbConnect();

        $sql = sprintf('SELECT *, AsText(regionOfInterest) as roi ' .
            'FROM screenshots WHERE id=%d LIMIT 1;',
             (int)$screenshotId
        );
        try {
            $result = $this->_dbConnection->query($sql);
        }
        catch (Exception $e) {
            return false;
        }

        return $result->fetch_array(MYSQLI_ASSOC);
    }

}
?>
