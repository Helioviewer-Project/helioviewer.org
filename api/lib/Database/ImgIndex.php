<?php
/**
 * @package ImgIndex
 * @author Patrick Schmiedel <patrick.schmiedel@gmx.net>
 * @author Keith Hughitt <keith.hughitt@nasa.gov>
 */
class Database_ImgIndex {
    private $dbConnection;

    public function __construct($dbConnection) {
        $this->dbConnection = $dbConnection;
    }

    public function getClosestImage($date, $id, $debug=false) {
        include_once 'lib/Helper/DateTimeConversions.php';
                
        $datestr = isoDateToMySQL($date);
        
        // Search left and right side of image database B-Tree separately
        $lhs = sprintf("SELECT id as imageId, filepath, filename, date, sourceId FROM image WHERE sourceId = %d AND date < '%s' ORDER BY date DESC LIMIT 1;", $id, $datestr);
        $rhs = sprintf("SELECT id as imageId, filepath, filename, date, sourceId FROM image WHERE sourceId = %d AND date >= '%s' ORDER BY date ASC LIMIT 1;", $id, $datestr);

        if ($debug) {
            die("$lhs<br><br><span style='color: green;'>$rhs</span><br><br><hr>");
        }

        $left = mysqli_fetch_array($this->dbConnection->query($lhs), MYSQL_ASSOC);
        $right = mysqli_fetch_array($this->dbConnection->query($rhs), MYSQL_ASSOC);
        
        // Select closest match
        if (abs($date - $left["date"]) < abs($date - $right["date"]))
            $img = $left;
        else
            $img = $right;
            
        // Fix types and retrieve extra meta-information from JP2 header
        $img["imageId"]  = (int) $img["imageId"];
        $img["sourceId"] = (int) $img["sourceId"];
        
        $filename = HV_JP2_DIR . $img["filepath"] . "/" .$img["filename"];
            
        return array_merge($img, $this->extractJP2MetaInfo($filename));
    }

    /**
     * Extract necessary meta-information from an image
     * @return 
     * @param object $img
     */    
    public function extractJP2MetaInfo ($img) {
    	require_once("lib/Image/JPEG2000/JP2ImageXMLBox.php");
    	
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
     * @return 
     * @param object $obs
     * @param object $inst
     * @param object $det
     * @param object $meas
     */    
    public function getSourceId ($obs, $inst, $det, $meas) {
        $sql = sprintf("
            SELECT
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
            mysqli_real_escape_string($this->dbConnection->link, $obs), 
            mysqli_real_escape_string($this->dbConnection->link, $inst),
            mysqli_real_escape_string($this->dbConnection->link, $det), 
            mysqli_real_escape_string($this->dbConnection->link, $meas));
                
        $result = $this->dbConnection->query($sql);
        $result_array = mysqli_fetch_array($result, MYSQL_ASSOC);
    
        return (int) ($result_array["id"]);
    }

    /**
     * Returns a list of the known datasources
     * @return 
     */
    public function getDataSources () {
        # Query
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
    
        # Fetch available data-sources
        $result = $this->dbConnection->query($sql);

        $sources = array();
        
        while ($row = $result->fetch_array(MYSQL_ASSOC)) {
            array_push($sources, $row);
        }
        
        # Convert results into a more easily traversable tree structure
        $tree = array();
        
        foreach($sources as $source) {
            
            # Image parameters
            $obs  = $source["observatory"];
            $inst = $source["instrument"];
            $det  = $source["detector"];
            $meas = $source["measurement"];
            $name = $source["name"];
            $ord  = (int) ($source["layeringOrder"]);
            $id   = (int) ($source["id"]);
            
            # Build tree
            if (!isset($tree[$obs]))
                $tree[$obs] = array();
            if (!isset($tree[$obs][$inst]))
                $tree[$obs][$inst] = array();
            if (!isset($tree[$obs][$inst][$det]))
                $tree[$obs][$inst][$det] = array();
            $tree[$obs][$inst][$det][$meas] = array("sourceId"=>$id, "name"=>$name, "layeringOrder"=>$ord);
        }

        return $tree; 
    }

    /**
     * getJP2Filepath
     * @author Keith Hughitt <Vincent.K.Hughitt@nasa.gov>
     * @return string $url
     * @param object $obsTime
     * @param object $src
     * 
     */
    public function getJP2FilePath($obsTime, $source, $debug=false) {
        $img = $this->getClosestImage($obsTime, $source, $debug);
        return $img["filepath"] . "/" . $img["filename"];
    }
}
?>
