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
        include_once HV_ROOT_DIR . '/api/src/Helper/DateTimeConversions.php';

        $datestr = isoDateToMySQL($date);

        // Search left and right side of image database B-Tree separately
        $lhs = sprintf("SELECT filepath, filename, date FROM image WHERE sourceId = %d AND date < '%s' ORDER BY date DESC LIMIT 1;", $sourceId, $datestr);
        $rhs = sprintf("SELECT filepath, filename, date FROM image WHERE sourceId = %d AND date >= '%s' ORDER BY date ASC LIMIT 1;", $sourceId, $datestr);

        //die("$lhs<br><br><span style='color: green;'>$rhs</span><br><br><hr>");

        $left = mysqli_fetch_array($this->_dbConnection->query($lhs), MYSQL_ASSOC);
        $right = mysqli_fetch_array($this->_dbConnection->query($rhs), MYSQL_ASSOC);

        $dateTimestamp = toUnixTimestamp($date);

        // Select closest match
        if (abs($dateTimestamp - toUnixTimestamp($left["date"])) < abs($dateTimestamp - toUnixTimestamp($right["date"]))) {
            $img = $left;
        } else {
            $img = $right;
        }

        // Make sure match was found
        if (is_null($img)) {
            $source = $this->_getDataSourceName($sourceId);
            throw new Exception("No images of the requested type ($source) are currently available.");
        }

        return $img;
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
        include_once HV_ROOT_DIR . '/api/src/Helper/DateTimeConversions.php';

        $datestr = isoDateToMySQL($date);

        // Search database
        $sql = sprintf("SELECT filepath, filename, date FROM image WHERE sourceId = %d AND date <= '%s' ORDER BY date DESC LIMIT 1;", $sourceId, $datestr);
        $img = mysqli_fetch_array($this->_dbConnection->query($sql), MYSQL_ASSOC);

        // Make sure match was founds
        if (is_null($img)) {
            $source = $this->_getDataSourceName($sourceId);
            throw new Exception("No $source images are available on or before $date.");
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
        include_once HV_ROOT_DIR . '/api/src/Helper/DateTimeConversions.php';

        $datestr = isoDateToMySQL($date);

        // Search database
        $sql = sprintf("SELECT filepath, filename, date FROM image WHERE sourceId = %d AND date >= '%s' ORDER BY date ASC LIMIT 1;", $sourceId, $datestr);
        $img = mysqli_fetch_array($this->_dbConnection->query($sql), MYSQL_ASSOC);

        // Make sure match was found
        if (is_null($img)) {
            $source = $this->_getDataSourceName($sourceId);
            throw new Exception("No $source images are available on or after $date.");
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
        $sql = "SELECT name FROM datasource WHERE id=$sourceId";
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
        include_once HV_ROOT_DIR . '/api/src/Helper/DateTimeConversions.php';
        $startDate = isoDateToMySQL($start);
        $endDate   = isoDateToMySQL($end);

        $sql = "SELECT COUNT(*) FROM image WHERE sourceId=$sourceId AND date BETWEEN '$startDate' AND '$endDate'";
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
        include_once HV_ROOT_DIR . '/api/src/Helper/DateTimeConversions.php';
        $startDate = isoDateToMySQL($start);
        $endDate   = isoDateToMySQL($end);

        $images = array();
        $sql = "SELECT * FROM image 
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
        include_once HV_ROOT_DIR . "/api/src/Image/JPEG2000/JP2ImageXMLBox.php";

        try {
            $xmlBox = new Image_JPEG2000_JP2ImageXMLBox($img);

            $dimensions = $xmlBox->getImageDimensions();
            $center     = $xmlBox->getSunCenter();

            $meta = array(
                "scale"      => (float) $xmlBox->getImagePlateScale(),
                "width"      => (int) $dimensions[0],
                "height"     => (int) $dimensions[1],
                "sunCenterX" => (float) $center[0],
                "sunCenterY" => (float) $center[1],
            );
        } catch (Exception $e) {
            throw new Exception(sprintf("Unable to process XML Header for %s: %s", $img, $e->getMessage()));
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
                observatory.name AS observatory,
                instrument.name AS instrument,
                detector.name AS detector,
                measurement.name AS measurement,
                datasource.layeringOrder AS layeringOrder
            FROM datasource
                LEFT JOIN observatory ON datasource.observatoryId = observatory.id
                LEFT JOIN instrument ON datasource.instrumentId = instrument.id
                LEFT JOIN detector ON datasource.detectorId = detector.id
                LEFT JOIN measurement ON datasource.measurementId = measurement.id
            WHERE
                datasource.id='%s'",
            mysqli_real_escape_string($this->_dbConnection->link, $id)
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
                datasource.id
            FROM datasource
                LEFT JOIN observatory ON datasource.observatoryId = observatory.id
                LEFT JOIN instrument ON datasource.instrumentId = instrument.id
                LEFT JOIN detector ON datasource.detectorId = detector.id
                LEFT JOIN measurement ON datasource.measurementId = measurement.id
            WHERE
                observatory.name='%s' AND
                instrument.name='%s' AND
                detector.name='%s' AND
                measurement.name='%s';",
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
     * Returns a list of the known data sources
     * 
     * @param bool $verbose If set to true an alternative data structure is returned that includes meta-information
     *                      at each level of the tree, and adds units to numeric measurement names
     *
     * @return array A tree representation of the known data sources
     */
    public function getDataSources ($verbose=false)
    {
        $fields = array("observatory", "instrument", "detector", "measurement");
        
        $sql = "SELECT
                    datasource.name as nickname,
                    datasource.id as id,
                    datasource.layeringOrder as layeringOrder,
                    measurement.units as measurement_units,";

        foreach ($fields as $field) {
            $sql .= sprintf("%s.name as %s_name, %s.description as %s_description,", $field, $field, $field, $field);
        }
     
        $sql = substr($sql, 0, -1) . " " . 
            "FROM datasource
                LEFT JOIN observatory ON datasource.observatoryId = observatory.id
                LEFT JOIN instrument ON datasource.instrumentId = instrument.id
                LEFT JOIN detector ON datasource.detectorId = detector.id
                LEFT JOIN measurement ON datasource.measurementId = measurement.id;";

        // Fetch available data-sources
        $result = $this->_dbConnection->query($sql);

        $sources = array();

        while ($row = $result->fetch_array(MYSQL_ASSOC)) {
            array_push($sources, $row);
        }

        // Convert results into a more easily traversable tree structure
        $tree = array();

        foreach ($sources as $source) {
            $id   = (int) ($source["id"]);

            // Only include if data is available for the specified source
            if ($this->getImageCount("1000/01/01 00:00:00", "9999/01/01 00:00:00", $id) > 0) {
             
                // Image parameters
                $obs      = $source["observatory_name"];
                $inst     = $source["instrument_name"];
                $det      = $source["detector_name"];
                $meas     = $source["measurement_name"];
                $nickname = $source["nickname"];
                $order    = (int) ($source["layeringOrder"]);
    
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
                        "layeringOrder" => $order
                    );
                } else {
                    // Alternative measurement descriptors
                    if (preg_match("/^\d*$/", $meas)) {
                        // \u205f = \xE2\x81\x9F = MEDIUM MATHEMATICAL SPACE
                        $measurementName = $meas . "\xE2\x81\x9F" . utf8_encode($source["measurement_units"]);
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
                        "description"   => utf8_encode($source["measurement_description"]),
                        "nickname"      => $nickname,
                        "sourceId"      => $id,
                        "layeringOrder" => $order
                    );
                }                
            }
        }
        
        // Set defaults for verbose mode
        if ($verbose) {
            $tree["SOHO"]["default"] = true;
            $tree["SOHO"]["children"]["EIT"]["default"] = true;
            $tree["SOHO"]["children"]["EIT"]["children"]["EIT"]["default"] = true;
            $tree["SOHO"]["children"]["EIT"]["children"]["EIT"]["children"]["304"]["default"] = true;
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
}
?>
