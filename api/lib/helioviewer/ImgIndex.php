<?php
/**
 * @package ImgIndex
 * @author Patrick Schmiedel <patrick.schmiedel@gmx.net>
 * @author Keith Hughitt <keith.hughitt@nasa.gov>
 */
class ImgIndex {
    private $dbConnection;

    public function __construct($dbConnection) {
        $this->dbConnection = $dbConnection;
    }

    public function getClosestImage($date, $params) {
        // Fetch source id if not specified
        if (sizeOf($params) > 1)
            $id = $this->getSourceId($params["observatory"], $params["instrument"], $params["detector"], $params["measurement"]);
        else
            $id = $params;   
        
        $datestr = isoDateToMySQL($date);
        
           $lhs = sprintf("SELECT id as imageId, filepath, filename, date, sourceId FROM image WHERE sourceId = %d AND date < '%s' ORDER BY date DESC LIMIT 1;", $id, $datestr);
           $rhs = sprintf("SELECT id as imageId, filepath, filename, date, sourceId FROM image WHERE sourceId = %d AND date >= '%s' ORDER BY date ASC LIMIT 1;", $id, $datestr);

        //echo "$lhs<br><br>";
        //echo "$rhs<br><br>";
        //exit();

        $left = mysqli_fetch_array($this->dbConnection->query($lhs), MYSQL_ASSOC);
        $right = mysqli_fetch_array($this->dbConnection->query($rhs), MYSQL_ASSOC);
        
        if (abs($date - $left["date"]) < abs($date - $right["date"]))
            $img = $left;
        else
            $img = $right;
            
        $img["imageId"]  = (int) $img["imageId"];
        $img["sourceId"] = (int) $img["sourceId"];

        $filename = HV_JP2_DIR . $img["filepath"] . "/" .$img["filename"];
            
        return array_merge($img, $this->extractJP2MetaInfo($filename));
    }
    
    /**
     * Given a filename and the name of the root node, extracts
     * the XML header box from a JP2 image
     * @param object $filename
     * @param object $root Name of the XMLBox root node (if known)
     */
    public function getJP2XMLBox ($filename, $root) {
        if (!file_exists($filename)) {
            $msg = "[PHP][" . date("Y/m/d H:i:s") . "]\n\t Unable to extract XMLbox for $filename: file does not exist!\n\n";
            file_put_contents(HV_ERROR_LOG, $msg, FILE_APPEND);
        }
        
        $fp = fopen($filename, "rb");
        
        $xml  = "";
        
        $done = False;
        while (!feof($fp)) {
            $line = fgets($fp);
            $xml .= $line;
            if (strpos($line, "</$root>") !== False)
                break;        }
        $xml = substr($xml, strpos($xml, "<$root>"));
        
        fclose($fp);
        
        return $xml;
    }

    /**
     * Extract necessary meta-information from an image
     * @return 
     * @param object $img
     */    
    public function extractJP2MetaInfo ($img) {
        $dom = new DOMDocument();
        $dom->loadXML($this->getJP2XMLBox($img, "fits"));
        
        $dimensions = $this->getImageDimensions($dom);
        
        $meta = array(
            "width"  => (int) $dimensions[0],
            "height" => (int) $dimensions[1],
            "scale"  => (float) $this->getImagePlateScale($dom)
        );
        
        return $meta;        
    }
    
    /**
     * Retrieves the value of a unique dom-node element or returns false if element is not found, or more
     * than one is found.
     * @param object $dom
     * @param object $name
     */  
    public function getElementValue($dom, $name) {
        $element = $dom->getElementsByTagName($name);
        
        if ($element)
            return $element->item(0)->childNodes->item(0)->nodeValue;
        else
            throw new Exception('Element not found');
    }
    
    /**
     * Returns the dimensions for a given image
     * @return 
     * @param object $dom
     */
    public function getImageDimensions($dom) {
        try {
            $width  = $this->getElementValue($dom, "NAXIS1");
            $height = $this->getElementValue($dom, "NAXIS2");
        } catch (Exception $e) {
            echo 'Unable to locate image dimensions in header tags!';
        }
        return array($width, $height);
    }
    
    /**
     * Returns the plate scale for a given image
     * @return 
     * @param object $dom
     */
    public function getImagePlateScale($dom) {
        try {
            $scale = $this->getElementValue($dom, "CDELT1");
        } catch (Exception $e) {
            echo 'Unable to locate image dimensions in header tags!';
        }
        return $scale;        
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
     * getJP2Filename
     * @author Keith Hughitt <Vincent.K.Hughitt@nasa.gov>
     * @return string $url
     * @param object $obsTime
     * @param object $src
     * 
     */
    public function getJP2FilePath($obsTime, $params) {
        $img = $this->getClosestImage($obsTime, $params);
        return $img["filepath"] . "/" . $img["filename"];
    }

    /**
     * Queries the database to get the width and height of a jp2 image.
     * @return 
     */    
    public function getJP2Dimensions ($obs, $inst, $det, $meas) {
        $query = "SELECT width, height FROM image
                    LEFT JOIN measurement on measurementId = measurement.id
                    LEFT JOIN detector on detectorId = detector.id
                    LEFT JOIN instrument on instrumentId = instrument.id
                    LEFT JOIN observatory on observatoryId = observatory.id
                    WHERE measurement.abbreviation='" . mysqli_real_escape_string($this->dbConnection->link, $meas)
                         . "' AND detector.abbreviation='" . mysqli_real_escape_string($this->dbConnection->link, $det)
                         . "' AND instrument.abbreviation='" . mysqli_real_escape_string($this->dbConnection->link, $inst)
                         . "' AND observatory.abbreviation='" . mysqli_real_escape_string($this->dbConnection->link, $obs)
                         . "' LIMIT 0,1";
        try {   
            $result = $this->dbConnection->query($query);
            if(!$result) {
                throw new Exception("[getJP2Dimensions][ImgIndex.php] Error executing query: $query");
            }
            
            $result_array = mysqli_fetch_array($result, MYSQL_ASSOC);
            if(sizeOf($result_array) < 1) {
                throw new Exception("[getJP2Dimensions][ImgIndex.php] Error fetching array from query: $query");
            }
            return $result_array;
        }
        catch (Exception $e) {
                  $msg = "[" . date("Y/m/d H:i:s") . "]\n\t " . $e->getMessage() . "\n\n";
                file_put_contents(HV_ERROR_LOG, $msg, FILE_APPEND);
                echo $msg;            
        }
    }
}
?>
