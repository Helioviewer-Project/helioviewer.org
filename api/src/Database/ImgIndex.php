<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * ImgIndex Class definition
 *
 * PHP version 5
 *
 * @category Database
 * @package  Helioviewer
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
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @author   Patrick Schmiedel <patrick.schmiedel@gmx.net>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Database_ImgIndex
{
    private $_dbConnection;

    /**
     * Creates an ImgIndex instance
     *
     * @return void
     */
    public function __construct()
    {
        include_once 'DbConnection.php';
        $this->_dbConnection = new Database_DbConnection();
    }
    
    /**
     * Adds a new screenshot entry to the database and returns its identifier
     * 
     * @return int identifier for the screenshot
     */
    public function insertScreenshot($date, $scale, $roi, $watermark, $layers, $bitmask, $numLayers)
    {
    	include_once 'src/Helper/DateTimeConversions.php';
    	
        // Add to screenshots table and get an id
        $sql = sprintf("INSERT INTO screenshots VALUES(NULL, NULL, '%s', %f, PolygonFromText('%s'), %b, '%s', %d, %d);", 
            isoDateToMySQL($date),
            $scale,
            $roi,
            $watermark,
            $layers,
            bindec($bitmask),
            $numLayers
        );
        
        $this->_dbConnection->query($sql);
        
        return $this->_dbConnection->getInsertId();
    }
    
    /**
     * Returns a single movie entry
     * 
     * @return string The movie information
     */
    public function getMovieInformation($id)
    {
        $sql = "SELECT *, AsText(regionOfInterest) as roi FROM movies " .
               "LEFT JOIN movieFormats ON movies.id = movieFormats.movieId " . 
               "WHERE movies.id=$id AND movieFormats.format='mp4'";
        return mysqli_fetch_array($this->_dbConnection->query($sql), MYSQL_ASSOC);
    }

    /**
     * Updates movie entry with new information
     * 
     * @return void
     */
    public function storeMovieProperties($id, $startDate, $endDate, $numFrames, $frameRate, $length, $width, $height)
    {
        // Update movies table
    	$sql = sprintf(
    	   "UPDATE movies 
    	     SET startDate='%s', endDate='%s', numFrames=%f, frameRate=%f, movieLength=%f, width=%d, height=%d
    	     WHERE id=%d",
    	   $startDate, $endDate, $numFrames, $frameRate, $length, $width, $height, $id
    	);
    	$this->_dbConnection->query($sql);
    }
    
    /**
     * Updated movie entry to include processing start and end times
     */
    public function finishedBuildingMovieFrames($id, $buildTimeStart, $buildTimeEnd)
    {
        $sql = "UPDATE movies SET buildTimeStart='$buildTimeStart', buildTimeEnd='$buildTimeEnd' WHERE id=$id";
        $this->_dbConnection->query($sql);
    }
    
    /**
     * Updates movie entry and marks it as "processing"
     * 
     * @param $id       int     Movie identifier
     * @param $format   string  Format being processed
     * 
     * @return void
     */
    public function markMovieAsProcessing($id, $format)
    {
        $sql = "UPDATE movieFormats SET status=1 WHERE movieId=$id AND format='$format'";
        $this->_dbConnection->query($sql);
    }
    
    /**
     * Updates movie entry and marks it as being "finished"
     * 
     * @param $id       int     Movie identifier
     * @param $format   string  Format being processed
     * @param $procTime int     Number of seconds it took to encode the movie
     */
    public function markMovieAsFinished($id, $format, $procTime)
    {
        $sql = "UPDATE movieFormats SET status=2, procTime=$procTime " . 
               "WHERE movieId=$id AND format='$format'";
    	$this->_dbConnection->query($sql);
    }
    
    /**
     * Updates movie entry and marks it as being "finished"
     */
    public function markMovieAsInvalid($id)
    {
        $this->_dbConnection->query("UPDATE movieFormats SET status=3, procTime=NULL WHERE movieId=$id");
    }
    
    /**
     * Returns the information associated with the screenshot with the specified id
     * 
     * @param $id
     */
    public function getScreenshot($id)
    {
    	$sql = "SELECT * FROM screenshots WHERE id=$id";
    	return mysqli_fetch_array($this->_dbConnection->query($sql), MYSQL_ASSOC);
    }

    /**
     * Takes an image ID and returns some useful image information
     */
    public function getImageInformation($id) {
        $sql = "SELECT * FROM images WHERE id=$id;";
        
        // Basic image info
        $image = mysqli_fetch_array($this->_dbConnection->query($sql), MYSQL_ASSOC);
        $image['sourceId'] = (int) $image['sourceId'];
        
        // Image header
        $file = HV_JP2_DIR . $image["filepath"] . "/" .$image["filename"];
        $xmlBox = $this->extractJP2MetaInfo($file);
        
        // Datasource info
        $datasource = $this->getDatasourceInformationFromSourceId($image['sourceId']);
        
        return array_merge($image, $xmlBox, $datasource);
    }

    /**
     * Finds the closest available image to the requested one, and returns information from
     * database and XML box.
     *
     * @param string $date     A UTC date string of the form "2003-10-05T00:00:00Z."
     * @param int    $sourceId An identifier specifying the image type or source requested.
     *
     * @return array Information about the image match including it's location, time, scale, and dimensions.
     */
    public function getClosestImage($date, $sourceId)
    {
        $img      = $this->getImageFromDatabase($date, $sourceId);
        $filename = HV_JP2_DIR . $img["filepath"] . "/" .$img["filename"];
        $xmlBox   = $this->extractJP2MetaInfo($filename);

        return array_merge($img, $xmlBox);
    }

    /**
     * Queries database and finds the best matching image.
     *
     * @param string $date     A UTC date string of the form "2003-10-05T00:00:00Z."
     * @param int    $sourceId An identifier specifying the image type or source requested.
     *
     * @return array Array including the image id, filepath, filename, date, and sourceId.
     */
    public function getImageFromDatabase($date, $sourceId)
    {
        include_once 'src/Helper/DateTimeConversions.php';

        $datestr = isoDateToMySQL($date);

        $sql = sprintf(
            "( SELECT id, filepath, filename, date 
              FROM images 
              WHERE
                sourceId = %d AND 
                date < '%s'
              ORDER BY date DESC LIMIT 1 )
            UNION ALL
            ( SELECT id, filepath, filename, date
              FROM images
              WHERE
                sourceId = %d AND
                date >= '%s'
              ORDER BY date ASC LIMIT 1 )
            ORDER BY ABS(TIMESTAMPDIFF(MICROSECOND, date, '%s')
            ) LIMIT 1;",
            $sourceId, $datestr, $sourceId, $datestr, $datestr
        );
        
        // Query database
        $result = mysqli_fetch_array($this->_dbConnection->query($sql), MYSQL_ASSOC);

        // Make sure match was found
        if (is_null($result)) {
            $source = $this->_getDataSourceName($sourceId);
            throw new Exception("No images of the requested type ($source) are currently available.", 10);
        }
        
        // Cast id to integer
        $result['id'] = (int) $result['id'];

        return $result;
    }
    
    /**
     * Queries the database and returns the closest image match before or equal to the date specified 
     *
     * @param string $date     A UTC date string of the form "2003-10-05T00:00:00Z."
     * @param int    $sourceId An identifier specifying the image type or source requested.
     *
     * @return array Array including the image id, filepath, filename, date, and sourceId.
     */
    public function getClosestImageBeforeDate($date, $sourceId)
    {
        include_once 'src/Helper/DateTimeConversions.php';

        $datestr = isoDateToMySQL($date);

        // Search database
        $sql = sprintf("SELECT filepath, filename, date FROM images WHERE sourceId = %d AND date <= '%s' ORDER BY date DESC LIMIT 1;", $sourceId, $datestr);
        $img = mysqli_fetch_array($this->_dbConnection->query($sql), MYSQL_ASSOC);

        // Make sure match was founds
        if (is_null($img)) {
            $source = $this->_getDataSourceName($sourceId);
            throw new Exception("No $source images are available on or before $date.", 11);
        }

        return $img;
    }
    
    /**
     * Queries the database and returns the closest image match after or equal to the date specified 
     *
     * @param string $date     A UTC date string of the form "2003-10-05T00:00:00Z."
     * @param int    $sourceId An identifier specifying the image type or source requested.
     *
     * @return array Array including the image id, filepath, filename, date, and sourceId.
     */
    public function getClosestImageAfterDate ($date, $sourceId)
    {
        include_once 'src/Helper/DateTimeConversions.php';

        $datestr = isoDateToMySQL($date);

        // Search database
        $sql = sprintf("SELECT filepath, filename, date FROM images WHERE sourceId = %d AND date >= '%s' ORDER BY date ASC LIMIT 1;", $sourceId, $datestr);
        $img = mysqli_fetch_array($this->_dbConnection->query($sql), MYSQL_ASSOC);

        // Make sure match was found
        if (is_null($img)) {
            $source = $this->_getDataSourceName($sourceId);
            throw new Exception("No $source images are available on or after $date.", 11);
        }

        return $img;
    }
    
    /**
     * Gets the human-readable name associated with the specified source id
     *
     * @param int $sourceId An identifier specifying the image type or source requested.
     * 
     * @return string Name of the data source associated with specified id
     */
    private function _getDataSourceName ($sourceId)
    {
        $sql = "SELECT name FROM datasources WHERE id=$sourceId";
        $result = mysqli_fetch_array($this->_dbConnection->query($sql), MYSQL_ASSOC);
        return $result["name"];
    }

    /**
     * Returns the number of images in the database for a given source and time range
     *
     * @param datetime $start    Query start time
     * @param datetime $end      Query end time
     * @param int      $sourceId The sourceId to query
     *
     * @return int The number of images in the database within the specified constraints
     */
    public function getImageCount($start, $end, $sourceId)
    {
        include_once 'src/Helper/DateTimeConversions.php';
        $startDate = isoDateToMySQL($start);
        $endDate   = isoDateToMySQL($end);
        
        $sql = "SELECT COUNT(*) FROM images WHERE sourceId=$sourceId AND date BETWEEN '$startDate' AND '$endDate'";
        
        $result = mysqli_fetch_array($this->_dbConnection->query($sql));
        return (int) $result[0];
    }

    /**
     * Returns an array containing all images for a given source and time range
     *
     * @param datetime $start    Query start time
     * @param datetime $end      Query end time
     * @param int      $sourceId The sourceId to query
     *
     * @return int The number of images in the database within the specified constraints
     */
    public function getImageRange($start, $end, $sourceId)
    {
        include_once 'src/Helper/DateTimeConversions.php';
        $startDate = isoDateToMySQL($start);
        $endDate   = isoDateToMySQL($end);

        $images = array();
        $sql = "SELECT * FROM images 
                WHERE sourceId=$sourceId AND date BETWEEN '$startDate' AND '$endDate' ORDER BY date ASC";

        $result = $this->_dbConnection->query($sql);

        while ($image = $result->fetch_array(MYSQL_ASSOC)) {
            array_push($images, $image);
        }
        return $images;
    }

    /**
     * Extract necessary meta-information from an image
     *
     * @param string $img Location of a JP2 image.
     *
     * @return array A subset of the information stored in the jp2 header
     */
    public function extractJP2MetaInfo ($img)
    {
        include_once "src/Image/JPEG2000/JP2ImageXMLBox.php";

        try {
            $xmlBox = new Image_JPEG2000_JP2ImageXMLBox($img);

            $dimensions              = $xmlBox->getImageDimensions();
            $refPixel                = $xmlBox->getRefPixelCoords();
            $imageScale              = (float) $xmlBox->getImagePlateScale();
            $dsun                    = (float) $xmlBox->getDSun();
            $sunCenterOffsetParams   = $xmlBox->getSunCenterOffsetParams();
            $layeringOrder           = $xmlBox->getLayeringOrder();
            
            // Normalize image scale
            $imageScale = $imageScale * ($dsun / HV_CONSTANT_AU);

            $meta = array(
                "scale"      => $imageScale,
                "width"      => (int) $dimensions[0],
                "height"     => (int) $dimensions[1],
                "refPixelX"  => (float) $refPixel[0],
                "refPixelY"  => (float) $refPixel[1],
                "sunCenterOffsetParams" => $sunCenterOffsetParams,
                "layeringOrder"         => $layeringOrder
            );
        } catch (Exception $e) {
            throw new Exception(sprintf("Unable to process XML Header for %s: %s", $img, $e->getMessage()), 13);
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
     * "observatory", "instrument", "detector", "measurement", 
     * and "layeringOrder"
     */
    public function getDatasourceInformationFromSourceId ($id)
    {
        $sql = sprintf(
            "SELECT
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
                datasources.id='%s'",
            mysqli_real_escape_string($this->_dbConnection->link, $id)
        );

        $result = $this->_dbConnection->query($sql);
        $result_array = mysqli_fetch_array($result, MYSQL_ASSOC);

        return $result_array;		
    }

    /**
     * Returns the source Id, name, and layering order associated with a data source specified by 
     * it's observatory, instrument, detector and measurement.
     * 
     * @param string $obs  Observatory
     * @param string $inst Instrument
     * @param string $det  Detector
     * @param string $meas Measurement
     * 
     * @return array Datasource id and layering order
     */
    public function getDatasourceInformationFromNames($obs, $inst, $det, $meas)
    {
        $sql = sprintf(
            "SELECT
                datasources.id AS id,
                datasources.name AS name,
                datasources.layeringOrder AS layeringOrder
            FROM datasources
                LEFT JOIN observatories ON datasources.observatoryId = observatories.id
                LEFT JOIN instruments ON datasources.instrumentId = instruments.id
                LEFT JOIN detectors ON datasources.detectorId = detectors.id
                LEFT JOIN measurements ON datasources.measurementId = measurements.id
            WHERE
                observatories.name='%s' AND
                instruments.name='%s' AND
                detectors.name='%s' AND
                measurements.name='%s';",
            mysqli_real_escape_string($this->_dbConnection->link, $obs),
            mysqli_real_escape_string($this->_dbConnection->link, $inst),
            mysqli_real_escape_string($this->_dbConnection->link, $det),
            mysqli_real_escape_string($this->_dbConnection->link, $meas)
        );
        $result = $this->_dbConnection->query($sql);
        $result_array = mysqli_fetch_array($result, MYSQL_ASSOC);

        return $result_array;
    }
    
    /**
     * Returns the sourceId for a given set of parameters.
     *
     * @param string $obs  Observatory
     * @param string $inst Instrument
     * @param string $det  Detector
     * @param string $meas Measurement
     *
     * @return int The matched sourceId.
     */
    public function getSourceId ($obs, $inst, $det, $meas)
    {
        $sql = sprintf(
            "SELECT
                datasources.id
            FROM datasources
                LEFT JOIN observatories ON datasources.observatoryId = observatories.id
                LEFT JOIN instruments ON datasources.instrumentId = instruments.id
                LEFT JOIN detectors ON datasources.detectorId = detectors.id
                LEFT JOIN measurements ON datasources.measurementId = measurements.id
            WHERE
                observatories.name='%s' AND
                instruments.name='%s' AND
                detectors.name='%s' AND
                measurements.name='%s';",
            mysqli_real_escape_string($this->_dbConnection->link, $obs),
            mysqli_real_escape_string($this->_dbConnection->link, $inst),
            mysqli_real_escape_string($this->_dbConnection->link, $det),
            mysqli_real_escape_string($this->_dbConnection->link, $meas)
        );
        $result = $this->_dbConnection->query($sql);
        $result_array = mysqli_fetch_array($result, MYSQL_ASSOC);

        return (int) ($result_array["id"]);
    }
    
    /**
     * Returns the oldest image for a given datasource
     */
    public function getOldestImage($sourceId)
    {
    	$sql = "SELECT date FROM images WHERE sourceId=$sourceId ORDER BY date ASC LIMIT 1";
    	$result = mysqli_fetch_array($this->_dbConnection->query($sql), MYSQL_ASSOC);    	
    	return $result['date'];
    }
    
    /**
     * Returns the newest image for a given datasource
     */
    public function getNewestImage($sourceId)
    {
        $sql = "SELECT date FROM images WHERE sourceId=$sourceId ORDER BY date DESC LIMIT 1";
        $result = mysqli_fetch_array($this->_dbConnection->query($sql), MYSQL_ASSOC);        
        return $result['date'];
    }
    
    /**
     * Returns a list of datasources sorted by instrument
     * 
     * @return array A list of datasources sorted by instrument
     */
    public function getDataSourcesByInstrument ()
    {
        // 2011/05/24: Hiding TRACE for now
        $result = $this->_dbConnection->query("SELECT * FROM instruments WHERE name != 'TRACE' ORDER BY name");
        
        $instruments = array();

        while($instrument = mysqli_fetch_assoc($result)) {
            $instruments[$instrument['name']] = array();
            $sql = sprintf("SELECT * FROM datasources WHERE instrumentId=%d ORDER BY name", $instrument['id']);
            $datasources = $this->_dbConnection->query($sql);
            while($ds = mysqli_fetch_assoc($datasources)) {
                array_push($instruments[$instrument['name']], $ds);
            }
        }
        
        return $instruments;
    }

    /**
     * Returns a list of the known data sources
     * 
     * @param bool $verbose If set to true an alternative data structure is returned that includes meta-information
     *                      at each level of the tree, and adds units to numeric measurement names
     *
     * @return array A tree representation of the known data sources
     */
    public function getDataSources ($verbose, $enabled)
    {
        $fields = array("instrument", "detector", "measurement");
        
        $sql = "SELECT
                    datasources.name as nickname,
                    datasources.id as id,
                    datasources.enabled as enabled,
                    datasources.layeringOrder as layeringOrder,
                    measurements.units as measurement_units,
                    observatories.name as observatory_name,
                    observatories.description as observatory_description, ";

        foreach ($fields as $field) {
            $sql .= sprintf("%ss.name as %s_name, %ss.description as %s_description,", $field, $field, $field, $field);
        }
     
        $sql = substr($sql, 0, -1) . " " . 
            "FROM datasources
                LEFT JOIN observatories ON datasources.observatoryId = observatories.id
                LEFT JOIN instruments ON datasources.instrumentId = instruments.id
                LEFT JOIN detectors ON datasources.detectorId = detectors.id
                LEFT JOIN measurements ON datasources.measurementId = measurements.id;";
                
        // 2011/06/10 Temporarily hiding STEREO from verbose output to prevent JHelioviewer from attempting to use
        // 2012/05/26 Same thing with SWAP
        // 2012/07/11 Adding switch to enable these layers for JHelioviewer
        if ($verbose) {
            $ignore = array("STEREO_A", "STEREO_B", "PROBA2");
            
            $enabledList = "(";
            
            // Override hidden observatories if specified
            foreach($enabled as $x) {
                $key = array_search($x, $ignore);
                if ($key !== FALSE) {
                    unset($ignore[$key]);
                }
            }
            
            // Ignore remaining obseratories in ignore list
            foreach($ignore as $observatory) {
                $enabledList .= "'$observatory',";
            }
            $enabledList = substr($enabledList, 0, -1) . ");";
            
            if (sizeOf($ignore) > 0) {
                $sql = substr($sql, 0, -1) . " WHERE observatories.name NOT IN $enabledList";    
            } else {
                $sql = substr($sql, 0, -1) . ";";
            }
            
        }
        
        // Use UTF-8 for responses
        $this->_dbConnection->setEncoding('utf8');

        // Fetch available data-sources
        $result = $this->_dbConnection->query($sql);

        $sources = array();

        while ($row = $result->fetch_array(MYSQL_ASSOC)) {
            array_push($sources, $row);
        }

        // Convert results into a more easily traversable tree structure
        $tree = array();

        foreach ($sources as $source) {
            
            $enabled = (bool) $source["enabled"];

            // Only include if data is available for the specified source
            if (!$enabled) {
            	continue;
            }
             
            // Image parameters
            $id       = (int) ($source["id"]);
            $obs      = $source["observatory_name"];
            $inst     = $source["instrument_name"];
            $det      = $source["detector_name"];
            $meas     = $source["measurement_name"];
            $nickname = $source["nickname"];
            $order    = (int) ($source["layeringOrder"]);
            
            // Availability
            $oldest = $this->getOldestImage($id);
            $newest = $this->getNewestImage($id);

            // Build tree
            if (!$verbose) {
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
                    "sourceId"      => $id,
                    "nickname"      => $nickname,
                    "layeringOrder" => $order,
                    "start"         => $oldest,
                    "end"           => $newest
                );
            } else {
                // Alternative measurement descriptors
                if (preg_match("/^\d*$/", $meas)) {
                    // \u205f = \xE2\x81\x9F = MEDIUM MATHEMATICAL SPACE
                    $measurementName = $meas . "\xE2\x81\x9F" . $source["measurement_units"];
                } else {
                    $measurementName = ucwords(str_replace("-", " ", $meas));
                }
               
             
                // Verbose
                if (!isset($tree[$obs])) {
                    $tree[$obs] = array(
                        "name"        => $obs,
                        "description" => $source["observatory_description"],
                        "children" => array()
                    );
                }
                if (!isset($tree[$obs]["children"][$inst])) {
                    $tree[$obs]["children"][$inst] = array(
                        "name"        => $inst,
                        "description" => $source["instrument_description"],
                        "children"   => array()
                    );
                }
                if (!isset($tree[$obs]["children"][$inst]["children"][$det])) {
                    $tree[$obs]["children"][$inst]["children"][$det] = array(
                        "name"        => $det,
                        "description" => $source["detector_description"],
                        "children" => array()
                    );
                }
                $tree[$obs]["children"][$inst]["children"][$det]["children"][$meas] = array(
                    "name"          => $measurementName,
                    "description"   => $source["measurement_description"],
                    "nickname"      => $nickname,
                    "sourceId"      => $id,
                    "layeringOrder" => $order,
                    "start"         => $oldest,
                    "end"           => $newest
                );
            }
        }
        
        // Set defaults for verbose mode
        if ($verbose) {
            $tree["SDO"]["default"] = true;
            $tree["SDO"]["children"]["AIA"]["default"] = true;
            $tree["SDO"]["children"]["AIA"]["children"]["AIA"]["default"] = true;
            $tree["SDO"]["children"]["AIA"]["children"]["AIA"]["children"]["171"]["default"] = true;
        }

        return $tree;
    }

    /**
     * Finds the closest match for a requested image and returns it's location
     *
     * @param string $date     A UTC date string of the form "2003-10-05T00:00:00Z."
     * @param int    $sourceId An identifier specifying the image type or source requested.
     *
     * @return string Local filepath for the JP2 image.
     *
     */
    public function getJP2FilePath($date, $sourceId)
    {
        $img = $this->getImageFromDatabase($date, $sourceId);
        return $img["filepath"] . "/" . $img["filename"];
    }
    
    /**
     * Returns the filepath for the image with the specified id
     * 
     * @param int $id Image id
     * 
     * @return string Local filepath for the JP2 image
     */
    public function getJP2FilePathFromId($id)
    {
        $sql = "SELECT concat(filepath, '/', filename) FROM images WHERE id=$id";
        $row = mysqli_fetch_array($this->_dbConnection->query($sql));
        return array_pop($row);
    }
}
?>
