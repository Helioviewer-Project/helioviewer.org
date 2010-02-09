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
     * @param resource $dbConnection A valid database connect handler
     * 
     * @return void
     */
    public function __construct($dbConnection)
    {
        $this->_dbConnection = $dbConnection;
    }

    /**
     * Finds the closest available image to the requested one.
     * 
     * @param string $date     A UTC date string of the form "2003-10-05T00:00:00Z."
     * @param int    $sourceId An identifier specifying the image type or source requested.
     * @param bool   $debug    [Optional] Provides extra information about the request.
     *
     * @return array Information about the image match including it's location, time, scale, and dimensions.
     */
    public function getClosestImage($date, $sourceId, $debug=false)
    {
        include_once 'lib/Helper/DateTimeConversions.php';
                
        $datestr = isoDateToMySQL($date);
        
        // Search left and right side of image database B-Tree separately
        $lhs = sprintf("SELECT id as imageId, filepath, filename, date, sourceId FROM image WHERE sourceId = %d AND date < '%s' ORDER BY date DESC LIMIT 1;", $sourceId, $datestr);
        $rhs = sprintf("SELECT id as imageId, filepath, filename, date, sourceId FROM image WHERE sourceId = %d AND date >= '%s' ORDER BY date ASC LIMIT 1;", $sourceId, $datestr);

        if ($debug) {
            die("$lhs<br><br><span style='color: green;'>$rhs</span><br><br><hr>");
        }

        $left = mysqli_fetch_array($this->_dbConnection->query($lhs), MYSQL_ASSOC);
        $right = mysqli_fetch_array($this->_dbConnection->query($rhs), MYSQL_ASSOC);
        
        // Select closest match
        if (abs($date - $left["date"]) < abs($date - $right["date"])) {
            $img = $left;
        } else {
            $img = $right;
        }
            
        // Fix types and retrieve extra meta-information from JP2 header
        $img["imageId"]  = (int) $img["imageId"];
        $img["sourceId"] = (int) $img["sourceId"];
        
        $filename = HV_JP2_DIR . $img["filepath"] . "/" .$img["filename"];
            
        return array_merge($img, $this->extractJP2MetaInfo($filename));
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
        include_once "lib/Image/JPEG2000/JP2ImageXMLBox.php";
        
        $xmlBox = new Image_JPEG2000_JP2ImageXMLBox($img);
        
        $dimensions = $xmlBox->getImageDimensions();
        $center     = $xmlBox->getImageCenter();
        
        $meta = array(
            "width"  => (int) $dimensions[0],
            "height" => (int) $dimensions[1],
            "y"      => (float) $center[0],
            "x"      => (float) $center[1],
            "scale"  => (float) $xmlBox->getImagePlateScale()
        );
        
        return $meta;        
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
     * @return array A tree representation of the known data sources
     */
    public function getDataSources ()
    {
        // Query
        $sql = "
            SELECT
                datasource.name as name,
                datasource.id as id,
                datasource.layeringOrder as layeringOrder,
                observatory.name as observatory,
                instrument.name as instrument,
                detector.name as detector,
                measurement.name as measurement
            FROM datasource
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
            
            // Image parameters
            $obs  = $source["observatory"];
            $inst = $source["instrument"];
            $det  = $source["detector"];
            $meas = $source["measurement"];
            $name = $source["name"];
            $ord  = (int) ($source["layeringOrder"]);
            $id   = (int) ($source["id"]);
            
            // Build tree
            if (!isset($tree[$obs])) {
                $tree[$obs] = array();
            }
            if (!isset($tree[$obs][$inst])) {
                $tree[$obs][$inst] = array();
            }
            if (!isset($tree[$obs][$inst][$det])) {
                $tree[$obs][$inst][$det] = array();
            }
            $tree[$obs][$inst][$det][$meas] = array("sourceId"=>$id, "name"=>$name, "layeringOrder"=>$ord);
        }

        return $tree; 
    }

    /**
     * Finds the closest match for a requested image and returns it's location
     *
     * @param string $date     A UTC date string of the form "2003-10-05T00:00:00Z."
     * @param int    $sourceId An identifier specifying the image type or source requested.
     * @param bool   $debug    [Optional] Provides extra information about the request.
     * 
     * @return string Local filepath for the JP2 image.
     * 
     */
    public function getJP2FilePath($date, $sourceId, $debug=false)
    {
        $img = $this->getClosestImage($date, $sourceId, $debug);
        return $img["filepath"] . "/" . $img["filename"];
    }
}
?>
