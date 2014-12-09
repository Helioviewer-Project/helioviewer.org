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
            include_once HV_ROOT_DIR.'/src/php/Database/DbConnection.php';
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

        include_once HV_ROOT_DIR.'/src/php/Helper/DateTimeConversions.php';

        $this->_dbConnect();

        $sql = sprintf(
                  "INSERT INTO screenshots "
                . "SET "
                .     "id "                . " = NULL, "
                .     "timestamp "         . " = NULL, "
                .     "observationDate "   . " ='%s', "
                .     "imageScale "        . " = %f, "
                .     "regionOfInterest "  . " = PolygonFromText('%s'), "
                .     "watermark "         . " = %b, "
                .     "dataSourceString "  . " ='%s', "
                .     "dataSourceBitMask " . " = %d, "
                .     "eventSourceString " . " ='%s', "
                .     "eventsLabels "      . " = %b, "
                .     "scale "             . " = %b, "
                .     "scaleType "         . " ='%s', "
                .     "scaleX "            . " = %f, "
                .     "scaleY "            . " = %f, "
                .     "numLayers "         . " = %d;",
                $this->_dbConnection->link->real_escape_string(
                    isoDateToMySQL($date) ),
                (float)$imageScale,
                $this->_dbConnection->link->real_escape_string(
                    $roi ),
                (bool)$watermark,
                $this->_dbConnection->link->real_escape_string(
                    $layers ),
                bindec($this->_dbConnection->link->real_escape_string(
                    (binary)$bitmask ) ),
                $this->_dbConnection->link->real_escape_string(
                    $events ),
                (bool)$eventsLabels,
                (bool)$scale,
                $this->_dbConnection->link->real_escape_string(
                    $scaleType ),
                (float)$scaleX,
                (float)$scaleY,
                (int)$numLayers
               );
        try {
            $result = $this->_dbConnection->query($sql);
        }
        catch (Exception $e) {
            return false;
        }

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

        $sql = sprintf(
                   "SELECT *, AsText(regionOfInterest) AS roi "
                 . "FROM movies "
                 . "LEFT JOIN "
                 .     "movieFormats ON movies.id = movieFormats.movieId "
                 . "WHERE "
                 .     "movies.id = %d AND "
                 .     "movieFormats.format = 'mp4' "
                 . "LIMIT 1;",
                 (int)$movieId
               );
        try {
            $result = $this->_dbConnection->query($sql);
        }
        catch (Exception $e) {
            return false;
        }

        return $result->fetch_array(MYSQLI_ASSOC);
    }

    /**
     * Update a row in the `movies` table with metadata describing the
     * generated movie's attributes.
     *
     * @return boolean true or false
     */
    public function storeMovieProperties($movieId, $startDate, $endDate,
        $numFrames, $frameRate, $length, $width, $height) {

        $this->_dbConnect();

        $sql = sprintf(
                   "UPDATE movies "
                 . "SET "
                 .     "startDate "    . " ='%s', "
                 .     "endDate "      . " ='%s', "
                 .     "numFrames "    . " = %d, "
                 .     "frameRate "    . " = %f, "
                 .     "movieLength "  . " = %f, "
                 .     "width "        . " = %d, "
                 .     "height "       . " = %d "
                 . "WHERE id "         . " = %d "
                 . "LIMIT 1;",
                 $this->_dbConnection->link->real_escape_string(
                    $startDate),
                 $this->_dbConnection->link->real_escape_string(
                    $endDate),
                 (int)$numFrames,
                 (float)$frameRate,
                 (float)$length,
                 (int)$width,
                 (int)$height,
                 (int)$movieId
               );
        try {
            $result = $this->_dbConnection->query($sql);
        }
        catch (Exception $e) {
            return false;
        }

        return true;
    }

    /**
     * Update a row in the `movies` table with processesing start and end times
     *
     * @param  $movieId  int  Identifier in the `movies` table
     * @param  $buildTimeStart string  Movie build start time
     * @param  $buildTimeEnd   string  Movie build end time
     *
     * @return Boolean true or false
     */
    public function finishedBuildingMovieFrames($movieId, $buildTimeStart,
        $buildTimeEnd) {

        $this->_dbConnect();

        $sql = sprintf(
                   "UPDATE movies "
                 . "SET "
                 .     "buildTimeStart " . " ='%s', "
                 .     "buildTimeEnd= "  . " ='%s' "
                 . "WHERE id "           . " = %d "
                 . "LIMIT 1;",
                 $this->_dbConnection->link->real_escape_string(
                    $buildTimeStart),
                 $this->_dbConnection->link->real_escape_string(
                    $buildTimeEnd),
                 (int)$movieId
               );
        try {
            $result = $this->_dbConnection->query($sql);
        }
        catch (Exception $e) {
            return false;
        }

        return true;
    }

    /**
     * Mark a movie as "processing" in the `movieFormats` table.
     *
     * @param  $movieId  int     Identifier in the `movies` table
     * @param  $format   string  Movie format being processed
     *
     * @return Boolean true or false
     */
    public function markMovieAsProcessing($movieId, $format) {
        $this->_dbConnect();

        $sql = sprintf(
                   "UPDATE movieFormats "
                 . "SET status = 1 "    // 1 = processing
                 . "WHERE "
                 .     "movieId " . " = %d AND "
                 .     "format "  . " ='%s' "
                 . "LIMIT 1;",
                 (int)$movieId,
                 $this->_dbConnection->link->real_escape_string(
                    $format)
               );
        try {
            $result = $this->_dbConnection->query($sql);
        }
        catch (Exception $e) {
            return false;
        }

        return true;
    }

    /**
     * Mark a movie as "finished" in the `movieFormats` table.
     *
     * @param  $movieId  int     Identifier in the `movies` table
     * @param  $format   string  Movie format being processed
     * @param  $procTime int     Number of seconds it took to encode the movie
     *
     * @return Boolean true or false
     */
    public function markMovieAsFinished($movieId, $format, $procTime) {
        $this->_dbConnect();

        $sql = sprintf(
                   "UPDATE movieFormats "
                 . "SET "
                 .     "status "   . " = 2, "   // 2 = finished
                 .     "procTime " . " = %d "
                 . "WHERE "
                 .     "movieId "  . " = %d AND "
                 .     "format "   . " ='%s' "
                 . "LIMIT 1;",
                 (int)$procTime,
                 (int)$movieId,
                 $this->_dbConnection->link->real_escape_string(
                    $format)
               );
        try {
            $result = $this->_dbConnection->query($sql);
        }
        catch (Exception $e) {
            return false;
        }

        return true;
    }

    /**
     * Mark a movie as "invalid" in the `movieFormats` table.
     *
     * @param  int  $movieId  Identifier in the `movies` table
     *
     * @return Boolean true or false
     */
    public function markMovieAsInvalid($movieId) {
        $this->_dbConnect();

        $sql = sprintf(
                   "UPDATE movieFormats "
                 . "SET "
                 .     "status "   . " = 3, "   // 3 = invalid
                 .     "procTime " . " = NULL "
                 . "WHERE "
                 .     "movieId "  . " = %d "
                 . "LIMIT 1;",
                 (int)$movieId
               );
        try {
            $result = $this->_dbConnection->query($sql);
        }
        catch (Exception $e) {
            return false;
        }

        return true;
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

        $sql = sprintf(
                   "SELECT * "
                 . "FROM screenshots "
                 . "WHERE id = %d "
                 . "LIMIT 1;",
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

    /**
     * Fetch metadata about an image from the `data` and `datasources` tables
     * as well as the XML box of the JP2 image file.  Not for use with
     * non-image data sources.
     *
     * @param  int   $dataId  The image's identifier in the `data` table
     *
     * @return array Metadata related to the requested image.
     */
    public function getImageInformation($dataId) {
        $this->_dbConnect();

        $sql  = sprintf(
                    "SELECT * FROM data WHERE id = %d LIMIT 1;",
                    (int)$dataId
                );
        try {
            $result = $this->_dbConnection->query($sql);
        }
        catch (Exception $e) {
            return false;
        }

        $image = $result->fetch_array(MYSQLI_ASSOC);

        // Fetch metadata from JP2 XML header
        $image_filepath = HV_JP2_DIR.$image['filepath'].'/'.$image['filename'];
        $xmlBox = $this->extractJP2MetaInfo($image_filepath);

        // Fetch metadata from the `datasources` table
        $datasource = $this->getDatasourceInformationFromSourceId(
            $image['sourceId']);

        return array_merge($image, $xmlBox, $datasource);
    }

    /**
     * Find available data that is closest to the requested time and
     * return its metadata from the database and xmlBox (if applicable).
     *
     * @param string $date A UTC date string of the form "2003-10-05T00:00:00Z"
     * @param int    $sourceId The data source's identifier in the database
     *
     * @return array Metadata related to the closest image or other data type.
     */
    public function getClosestData($date, $sourceId) {
        $data     = $this->getDataFromDatabase($date, $sourceId);
        $filename = HV_JP2_DIR.$data['filepath'].'/'.$data['filename'];

        if ( stripos($data['filename'], '.jp2') !== false ) {
            $xmlBox = $this->extractJP2MetaInfo($filename);
            return array_merge($data, $xmlBox);
        }
        return $data;
    }

    /**
     * Query the database for data that is closest to the requested time.
     *
     * @param string $date A UTC date string of the form "2003-10-05T00:00:00Z"
     * @param int    $sourceId The data source's identifier in the database
     *
     * @return array Associative array containing values from
     *               the `datasources` table.
     */
    public function getDataFromDatabase($date, $sourceId) {
        include_once HV_ROOT_DIR.'/src/php/Helper/DateTimeConversions.php';

        $this->_dbConnect();

        $datestr = isoDateToMySQL($date);

        $sql = sprintf(
                   "( SELECT "
                 .        "id, filepath, filename, date "
                 .   "FROM data "
                 .   "WHERE "
                 .       "sourceId " . " = %d AND "
                 .       "date "     . " <'%s' "
                 .   "ORDER BY date DESC "
                 .   "LIMIT 1 ) "
                 . "UNION ALL "
                 . "( SELECT "
                 .        "id, filepath, filename, date "
                 .   "FROM data "
                 .   "WHERE "
                 .       "sourceId " . " = %d AND "
                 .       "date "     . ">='%s' "
                 .   "ORDER BY date ASC "
                 .   "LIMIT 1 ) "
                 . "ORDER BY "
                 .     "ABS(TIMESTAMPDIFF(MICROSECOND, date, '%s') "
                 . ") LIMIT 1;",
                 (int)$sourceId,
                 $this->_dbConnection->link->real_escape_string(
                    $datestr),
                 (int)$sourceId,
                 $this->_dbConnection->link->real_escape_string(
                    $datestr),
                 $this->_dbConnection->link->real_escape_string(
                    $datestr)
               );
        try {
            $result = $this->_dbConnection->query($sql);
        }
        catch (Exception $e) {
            return false;
        }

        $data = $result->fetch_array(MYSQLI_ASSOC);
        if ( $data === null ) {
            $source = $this->_getDataSourceName($sourceId);
            throw new Exception("No data of the requested type ("
                               .$source.") are currently available.", 10);
        }

        return $data;
    }

    /**
     * Return the closest match from the `data` table whose time is on
     * or before the specified time.
     *
     * @param string $date     UTC date string like "2003-10-05T00:00:00Z"
     * @param int    $sourceId The data source identifier in the database
     *
     * @return array Array containing 1 row from the `data` table
     */
    public function getClosestDataBeforeDate($date, $sourceId) {
        include_once HV_ROOT_DIR.'/src/php/Helper/DateTimeConversions.php';

        $this->_dbConnect();

        $datestr = isoDateToMySQL($date);

        $sql = sprintf(
                   "SELECT filepath, filename, date "
                 . "FROM data "
                 . "WHERE "
                 .     "sourceId " . " = %d AND "
                 .     "date "     . "<='%s' "
                 . "ORDER BY date DESC "
                 . "LIMIT 1;",
                 (int)$sourceId,
                 $this->_dbConnection->link->real_escape_string(
                    $datestr)
               );
        try {
            $result = $this->_dbConnection->query($sql);
        }
        catch (Exception $e) {
            return false;
        }

        $data = $result->fetch_array(MYSQLI_ASSOC);
        if ( $data === null ) {
            $source = $this->_getDataSourceName($sourceId);
            throw new Exception( 'No '.$source.' data is available '
                               . 'on or before '.$date.'.', 11);
        }

        return $data;
    }

    /**
     * Return the closest match from the `data` table whose time is on
     * or after the specified time.
     *
     * @param string $date     UTC date string like "2003-10-05T00:00:00Z"
     * @param int    $sourceId The data source identifier in the database
     *
     * @return array Array containing 1 row from the `data` table
     */
    public function getClosestDataAfterDate($date, $sourceId) {
        include_once HV_ROOT_DIR.'/src/php/Helper/DateTimeConversions.php';

        $this->_dbConnect();

        $datestr = isoDateToMySQL($date);

        $sql = sprintf(
                   "SELECT filepath, filename, date "
                 . "FROM data "
                 . "WHERE "
                 .     "sourceId " . " = %d AND "
                 .     "date "     . ">='%s' "
                 . "ORDER BY date ASC "
                 . "LIMIT 1;",
                 (int)$sourceId,
                 $this->_dbConnection->link->real_escape_string(
                    $datestr)
               );
        try {
            $result = $this->_dbConnection->query($sql);
        }
        catch (Exception $e) {
            return false;
        }

        $data = $result->fetch_array(MYSQLI_ASSOC);
        if ( $data === null ) {
            $source = $this->_getDataSourceName($sourceId);
            throw new Exception( 'No '.$source.' data is available '
                               . 'on or after '.$date.'.', 11);
        }

        return $data;
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

        $sql = sprintf(
                   "SELECT name FROM datasources WHERE id = %d LIMIT 1;",
                   (int)$sourceId
               );
        try {
            $result = $this->_dbConnection->query($sql);
        }
        catch (Exception $e) {
            return false;
        }

        $datasource = $result->fetch_array(MYSQLI_ASSOC);
        return $datasource['name'];
    }

    /**
     * Return the number `data` table rows matching a source and time range
     *
     * @param datetime $start    Query start time
     * @param datetime $end      Query end time
     * @param int      $sourceId The data source identifier in the database
     *
     * @return int The number of `data` rows matching a source and time range
     */
    public function getDataCount($start, $end, $sourceId) {
        include_once HV_ROOT_DIR.'/src/php/Helper/DateTimeConversions.php';

        $this->_dbConnect();

        $startDate = isoDateToMySQL($start);
        $endDate   = isoDateToMySQL($end);

        $sql = sprintf(
                   "SELECT COUNT(id) as count "
                 . "FROM data "
                 . "WHERE "
                 .     "sourceId " . " = %d AND "
                 .     "date BETWEEN '%s' AND '%s' "
                 . "LIMIT 1;",
                 (int)$sourceId,
                 $this->_dbConnection->link->real_escape_string(
                    $startDate),
                 $this->_dbConnection->link->real_escape_string(
                    $endDate)
               );
        try {
            $result = $this->_dbConnection->query($sql);
        }
        catch (Exception $e) {
            return false;
        }

        $data = $result->fetch_array(MYSQLI_ASSOC);
        return $data['count'];
    }

    /**
     * Return an array of data from a given data source within the specified
     * time range.
     *
     * @param datetime $start    Query start time
     * @param datetime $end      Query end time
     * @param int      $sourceId The data source identifier in the database
     *
     * @return array Array containing matched rows from the `data` table
     */
    public function getDataRange($start, $end, $sourceId) {
        include_once HV_ROOT_DIR.'/src/php/Helper/DateTimeConversions.php';

        $this->_dbConnect();

        $data      = array();
        $startDate = isoDateToMySQL($start);
        $endDate   = isoDateToMySQL($end);

        $sql = sprintf(
                   "SELECT * "
                 . "FROM data "
                 . "WHERE "
                 .     "sourceId = %d AND "
                 .     "date BETWEEN '%s' AND '%s' "
                 . "ORDER BY date ASC;",
                 (int)$sourceId,
                 $this->_dbConnection->link->real_escape_string(
                    $startDate),
                 $this->_dbConnection->link->real_escape_string(
                    $endDate)
               );
        try {
            $result = $this->_dbConnection->query($sql);
        }
        catch (Exception $e) {
            return false;
        }

        $result_array = Array();
        while ( $row = $result->fetch_array(MYSQLI_ASSOC) ) {
            array_push($data, $row);
        }

        return $data;
    }

    /**
     * Extract metadata from JP2 image file's XML header
     *
     * @param string $image_filepath Full path to JP2 image file
     *
     * @return array A subset of the information stored in the jp2 header
     */
    public function extractJP2MetaInfo($image_filepath) {

        include_once HV_ROOT_DIR.'/src/php/Image/JPEG2000/JP2ImageXMLBox.php';

        try {
            $xmlBox = new Image_JPEG2000_JP2ImageXMLBox($image_filepath);

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
        }
        catch (Exception $e) {
            throw new Exception(
                sprintf("Unable to process XML Header for %s: %s",
                        $image_filepath,
                        $e->getMessage()
                       ), 13);
        }

        return $meta;
    }

    /**
     * Fetch datasource properties from the database.
     *
     * @param   int $sourceId Identifier in the `datasources` and
     *                        `datasource_property` tables
     *
     * @return  Array   Datasource metadata
     */
    public function getDatasourceInformationFromSourceId($sourceId) {
        $this->_dbConnect();

        $sql  = sprintf(
                    "SELECT "
                  .     "dp.label, "
                  .     "dp.name, "
                  .     "ds.name as 'nickname', "
                  .     "ds.layeringOrder "
                  . "FROM "
                  .     "datasource_property dp "
                  . "LEFT JOIN "
                  .     "datasources ds ON dp.sourceId = ds.id "
                  . "WHERE "
                  .     "sourceId = %d "
                  . "ORDER BY uiOrder ASC;",
                  (int)$sourceId
                );
        try {
            $result = $this->_dbConnection->query($sql);
        }
        catch (Exception $e) {
            return false;
        }

        $uiOrder = 0;
        $result_array = Array();
        $result_array['uiLabels'] = Array();
        while ( $row = $result->fetch_array(MYSQLI_ASSOC) ) {
            $result_array['uiLabels'][] = Array('label'=>$row['label'], 'name'=>$row['name']);
            $nickname      = $row['nickname'];
            $layeringOrder = $row['layeringOrder'];
            $uiOrder++;
        }
        $result_array['name']          = $nickname;
        $result_array['layeringOrder'] = $layeringOrder;

        return $result_array;
    }

    /**
     * Return `datasource` id, name, layeringOrder for the matched labels
     *
     * @param  array Array of `datasource_property`.name in uiOrder order
     *
     * @return array Array of `datasource` id, name, layeringOrder
     */
    public function getDatasourceInformationFromNames($property_array) {
        $this->_dbConnect();

        $letters = array('a','b','c','d','e');
        $select_clause = array('ds.id', 'ds.name', 'ds.layeringOrder');
        $from_clause   = array();
        $where_clause  = array();


        foreach ($property_array as $i=>$property) {
            $i = intval($i);
            $property = $this->_dbConnection->link->real_escape_string(
                $property);

            $select_clause[] = $letters[$i].'.label AS '.$letters[$i].'_label';
            $from_clause[]  = 'datasource_property '.$letters[$i];
            if ($i > 0) {
                $where_clause[] = 'ds.id=a.sourceId';
                $where_clause[] = 'a.sourceId='.$letters[$i].'.sourceId';
            }
            $where_clause[] = $letters[$i].'.name="'.$property.'"';
            $where_clause[] = $letters[$i].'.uiOrder='.++$i;
        }
        $sql  = 'SELECT ' . implode(', ', $select_clause) . ' ';
        $sql .= 'FROM datasources ds, ' . implode(', ', $from_clause);
        $sql .= ' WHERE ' . implode(' AND ', $where_clause);

        try {
            $result = $this->_dbConnection->query($sql);
        }
        catch (Exception $e) {
            return false;
        }

        $row = $result->fetch_array(MYSQLI_ASSOC);

        $result_array = Array();
        $result_array['id']            = $row['id'];
        $result_array['name']          = $row['name'];
        $result_array['layeringOrder'] = $row['layeringOrder'];
        $result_array['uiLabels']      = Array();

        foreach ($property_array as $i=>$property) {
            $result_array['uiLabels'][] = Array(
                'label' => $row[$letters[$i].'_label'],
                'name'  => $property);
        }

        return $result_array;
    }

    /**
     * Return the UI labels for the matched `datasource_property` names
     *
     * @param  array Array of `datasource_property`.name in uiOrder order
     *
     * @return array Array of `datasource_property` label in uiOrder order
     */
    public function getDataSourceLabels($property_array) {
        $this->_dbConnect();

        $letters = array('a','b','c','d','e');
        $select_clause = array();
        $join_clause   = array();
        $where_clause  = array();

        foreach ($property_array as $i=>$property) {
            $i = intval($i);
            $property = $this->_dbConnection->link->real_escape_string(
                $property);

            $select_clause[] = $letters[$i].'.label as "'.$i.'"';

            if ( $i > 0 ) {
                $join_clause[] = 'LEFT JOIN datasource_property '.$letters[$i];
                $join_clause[] = 'ON a.sourceId = '.$letters[$i].'.sourceId';
            }

            $where_clause[] = $letters[$i].'.name="'.$property.'"';
            $where_clause[] = $letters[$i].'.uiOrder='.++$i;
        }

        $sql  = 'SELECT ' . implode(', ', $select_clause);
        $sql .= ' FROM datasource_property a ';
        $sql .= implode(' ', $join_clause);
        $sql .= ' WHERE ' . implode(' AND ', $where_clause);

        try {
            $result = $this->_dbConnection->query($sql);
        }
        catch (Exception $e) {
            return false;
        }

        $row = $result->fetch_array();
        foreach ($property_array as $i=>$property) {
            $return_array[$row[$i]] = $property;
        }

        return $return_array;
    }


    /**
     * Return `datasource` identifier for the matched labels
     *
     * @param  array Array of `datasource_property`.name in uiOrder order
     *
     * @return int   The matched sourceId.
     */
    public function getSourceId($property_array) {
        $this->_dbConnect();

        $letters = array('a','b','c','d','e');
        $from_clause  = array();
        $where_clause = array();

        $sql = "SELECT a.sourceId AS 'sourceId' "
             . "FROM ";
        foreach ($property_array as $i=>$property) {
            $i = (int)$i;
            $property = mysqli_real_escape_string($this->_dbConnection->link,
                $property);

            $from_clause[]  = 'datasource_property '.$letters[$i];
            if ($i > 0) {
                $where_clause[] = 'a.sourceId='.$letters[$i].'.sourceId';
            }
            $where_clause[] = $letters[$i].'.name="'.$property.'"';
            $where_clause[] = $letters[$i].'.uiOrder='.++$i;
        }
        $sql .= implode(', ', $from_clause);
        $sql .= ' WHERE ' . implode(' AND ', $where_clause);

        try {
            $result = $this->_dbConnection->query($sql);
            if ( $result->num_rows != 1 ) {
                return false;
            }
        }
        catch (Exception $e) {
            return false;
        }

        $datasource = $result->fetch_array(MYSQLI_ASSOC);
        return $datasource['sourceId'];
    }

    /**
     * Fetche the date of the oldest data from the `data` table for the
     * specified data source identifier.
     *
     * @param  int  $sourceId  Data source identifier
     *
     * @return date Date of the oldest row data
     */
    public function getOldestData($sourceId) {
        $this->_dbConnect();

        $sql = sprintf(
                   'SELECT date '
                 . 'FROM data '
                 . 'WHERE sourceId = %d '
                 . 'ORDER BY date ASC '
                 . 'LIMIT 1;',
                 (int)$sourceId
               );
        try {
            $result = $this->_dbConnection->query($sql);
        }
        catch (Exception $e) {
            return false;
        }

        $data = $result->fetch_array(MYSQLI_ASSOC);
        return $data['date'];
    }

    /**
     * Fetche the date of the newest data from the `data` table for the
     * specified data source identifier.
     *
     * @param  int  $sourceId  Data source identifier
     *
     * @return date Date of the newest row data
     */
    public function getNewestData($sourceId) {
        $this->_dbConnect();

        $sql = sprintf(
                   'SELECT date '
                 . 'FROM data '
                 . 'WHERE sourceId = %d '
                 . 'ORDER BY date DESC '
                 . 'LIMIT 1;',
                 (int)$sourceId
               );
        try {
            $result = $this->_dbConnection->query($sql);
        }
        catch (Exception $e) {
            return false;
        }

        $data = $result->fetch_array(MYSQLI_ASSOC);
        return $data['date'];
    }

    /**
     * Return a sorted array of Instruments with a sorted sub-array
     * of datasource IDs and datasource names.
     *
     * @return array Sorted array of instruments with associated sources
     */
    public function getDataSourcesByInstrument() {
        $this->_dbConnect();

        $sql = 'SELECT '
             .     'dsp.name as "instName", '
             .     'ds.id, '
             .     'ds.name as "sourceName" '
             . 'FROM '
             .     'datasources ds '
             . 'LEFT JOIN '
             .     'datasource_property dsp ON dsp.sourceId = ds.id '
             . 'WHERE '
             .     'dsp.label = "Instrument" '
             . 'GROUP BY '
             .     'dsp.name, ds.name '
             . 'ORDER BY dsp.name';
        try {
            $result = $this->_dbConnection->query($sql);
        }
        catch (Exception $e) {
            return false;
        }

        $return_array = array();
        while ( $row = $result->fetch_array(MYSQLI_ASSOC) ) {
            $return_array[$row['instName']][] = array(
                'id'   => $row['id'],
                'name' => $row['sourceName'] );
        }

        return $return_array;
    }

    /**
     * Return a hierarchial list of the known data sources in one of
     * two formats.
     *
     * If $verbose is True, an alternative data structure is returned for
     * use with JHelioviewer.  A hard-coded list of datasources is excluded
     * from the output by default, to prevent JHelioviewer crashes.
     *
     * When $verbose is True, $enable may contain a string of top-level
     * data sources to re-enable.  Example: '[STEREO_A,STEREO_B,PROBA2]'
     *
     * @param bool   $verbose   true or false
     * @param string $enable    array string of top-level sources to include
     *
     * @return array A tree representation of the known data sources
     */
    public function getDataSources($verbose=false, $enable=null) {
        $this->_dbConnect();

        // Support up to 5 levels of datasource hierarchy
        $letters = array('a','b','c','d','e');

        $sql = 'SELECT '
             .     's.name '           .'AS nickname, '
             .     's.id '             .'AS id, '
             .     's.enabled '        .'AS enabled, '
             .     's.layeringOrder '  .'AS layeringOrder, '
             .     's.units '          .'AS units';

        foreach ($letters as $i=>$letter) {
            $sql .= ', ';
            $sql .= $letter.'.name '        .'AS '.$letter.'_name, ';
            $sql .= $letter.'.description ' .'AS '.$letter.'_description, ';
            $sql .= $letter.'.label '       .'AS '.$letter.'_label';
        }

        $sql .= ' FROM datasources s ';

        foreach ($letters as $i=>$letter) {
            $sql .= 'LEFT JOIN datasource_property '.$letter.' ';
            $sql .= 'ON s.id='.$letter.'.sourceId ';
            $sql .= 'AND '.$letter.'.uiOrder='.++$i.' ';
        }

        // Verbose mode is for JHelioviewer
        // Older versions may crash if exposed to new "observatories"
        // By default, only include observatories in the array below
        // Also include any observatories specified in the $enable parameter
        if ($verbose) {
            $include_arr = array("SOHO","SDO");

            // Override hidden observatories if specified
            foreach($enable as $show) {
                if ( !in_array($show, $include_arr) ) {
                    $include_arr[] = $show;
                }
            }

            // Prepare include list for "IN" clause
            $included = "(";
            foreach ($include_arr as $show) {
                $show = $this->_dbConnection->link->real_escape_string(
                    $show);
                $included .= "'$show',";
            }
            $included = substr($included, 0, -1).")";

            if (sizeOf($include_arr) > 0) {
                $sql = substr($sql, 0, -1)." WHERE a.name IN $included";
            } else {
                $sql = substr($sql, 0, -1)."";
            }

            $sql .= ' ORDER BY a.name DESC;';

        }

        // Use UTF-8 for responses
        $this->_dbConnection->setEncoding('utf8');

        // Fetch available data-sources
        $result = $this->_dbConnection->query($sql);
        $sources = array();
        while ($row = $result->fetch_array(MYSQLI_ASSOC)) {
            array_push($sources, $row);
        }

        // Convert results into a more easily traversable tree structure
        $tree = array();
        foreach ($sources as $source) {

            // Only include if data is available for the specified source
            // as flagged in the `datasources` table
            if ( !(bool)$source["enabled"] ) {
                continue;
            }

            // Data Availability
            $newest = $this->getNewestData($source['id']);
            $oldest = $this->getOldestData($source['id']);

            // Determine depth of tree for this data source
            // And populate uiLabel array
            $depth = 0;
            $uiLabels = array();
            foreach ($letters as $i=>$letter) {
                if ( $source[$letter.'_name'] !== null ) {
                    $uiLabels[$i] = array(
                        'label'=>$source[$letters[$i].'_label'],
                        'name' =>$source[$letters[$i].'_name']);
                    $depth = ++$i;
                }
            }

            // Normal (non-verbose) format for Helioviewer.org
            if (!$verbose) {

                $r = &$tree;
                foreach ($letters as $index=>$letter) {
                    $key = $source[$letter.'_name'];
                    if ( ++$index == $depth ) {
                        $r[$key]['sourceId']      = (int)$source["id"];
                        $r[$key]['nickname']      = $source["nickname"];
                        $r[$key]['layeringOrder'] =
                            (int)$source["layeringOrder"];
                        $r[$key]['start']         = $oldest;
                        $r[$key]['end']           = $newest;
                        $r[$key]['uiLabels']      = $uiLabels;
                        break;
                    }
                    $r = &$r[$key];
                }
            }
            // Verbose format for JHelioviewer
            else {

                $r = &$tree;
                foreach ($letters as $index=>$letter) {
                    $key   = $source[$letter.'_name'];
                    $name  = $key;
                    $desc  = $source[$letter.'_description'];
                    $label = $source[$letter.'_label'];

                    $r[$key]['name']        = $name;
                    $r[$key]['description'] = $desc;
                    $r[$key]['label']       = $label;

                    if ( ++$index == $depth ) {

                        if (preg_match("/^\d*$/", $name)) {
                            # \u205f = \xE2\x81\x9F = MEDIUM MATHEMATICAL SPACE
                            $name = $name."\xE2\x81\x9F".$source['units'];
                        }
                        else {
                            $name = ucwords(str_replace("-", " ", $name));
                        }

                        $r[$key]['name']          = $name;
                        $r[$key]['description']   = $desc;
                        $r[$key]['nickname']      = $source["nickname"];
                        $r[$key]['sourceId']      = (int)$source["id"];
                        $r[$key]['layeringOrder'] =
                            (int)$source["layeringOrder"];
                        $r[$key]['start']         = $oldest;
                        $r[$key]['end']           = $newest;
                        $r[$key]['label']         = $label;
                        break;
                    }

                    $r = &$r[$key]['children'];
                }
            }

        }

        // Set defaults for verbose mode (JHelioviewer)
        if ($verbose) {
            $tree["SDO"]["default"]=true;
            $tree["SDO"]["children"]["AIA"]["default"]=true;
            $tree["SDO"]["children"]["AIA"]["children"]["171"]["default"]=true;
        }

        return $tree;
    }

    /**
     * Return the full path to the date file from the specified source
     * most closely matching the given date.
     *
     * @param string $date     A UTC date string like "2003-10-05T00:00:00Z"
     * @param int    $sourceId The data source identifier in the database
     *
     * @return string Full path to the local data file
     *
     */
    public function getDataFilePath($date, $sourceId) {
        $img = $this->getDataFromDatabase($date, $sourceId);

        return $img['filepath'].'/'.$img['filename'];
    }

    /**
     * Return the full path to the requested data file.
     *
     * @param int $id Identifier in the `data` table
     *
     * @return string Full path to the local data file
     */
    public function getDataFilePathFromId($dataId) {
        $this->_dbConnect();

        $sql = sprintf(
                   'SELECT concat(filepath, "/", filename) AS filepath '
                 . 'FROM data '
                 . 'WHERE id = %d '
                 . 'LIMIT 1',
                 (int)$dataId
               );
        try {
            $result = $this->_dbConnection->query($sql);
        }
        catch (Exception $e) {
            return false;
        }

        $data = $result->fetch_array(MYSQLI_ASSOC);
        return $data['filepath'];
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
