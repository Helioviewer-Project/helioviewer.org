<?php
/**
 * @package ImgIndex
 * @author Patrick Schmiedel <patrick.schmiedel@gmx.net>
 * @author Keith Hughitt <keith.hughitt@nasa.gov>
 */
class ImgIndex {
	private $dbConnection;

	public function __construct($dbConnection) {
		date_default_timezone_set('UTC');
		$this->dbConnection = $dbConnection;
	}

	public function getClosestImage($date, $params) {
        // Fetch source id if not specified
        if (sizeOf($params) > 1)
            $id = $this->getSourceId($params->observatory, $params->instrument, $params->detector, $params->measurement);
        else
            $id = $params;   
        
        $datestr = strftime("%Y-%m-%d %H:%M:%S", $date);
        
   		$lhs = sprintf("SELECT * FROM image WHERE sourceId = %d AND timestamp < '%s' ORDER BY timestamp DESC LIMIT 1;", $id, $datestr);
   		$rhs = sprintf("SELECT * FROM image WHERE sourceId = %d AND timestamp >= '%s' ORDER BY timestamp ASC LIMIT 1;", $id, $datestr);

        echo "$lhs<br><br>";
        echo "$rhs<br><br>";
        //exit();

		$left = mysqli_fetch_array($this->dbConnection->query($lhs), MYSQL_ASSOC);
		$right = mysqli_fetch_array($this->dbConnection->query($rhs), MYSQL_ASSOC);
        
        if (abs($date - $left["timestamp"]) < abs($date - $right["timestamp"]))
    		return $left;
        else
            return $right;
	}
    
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
            $tree[$obs][$inst][$det][$meas] = array("id"=>$id, "name"=>$name, "layeringOrder"=>$ord);
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
     * Retrieves the URI of the closest JPEG 2000 image to the desired time.
     * The query is done in two parts- first the image ID is found, then the ID is used
     * to retrieve the URI. By querying the two pieces separately, a significant amount of time
     * is saved.
     * 
     */
	public function getJP2Filename($obsTime, $src) {
		// Find ID of JP2
        $id = $this->getJP2Id($obsTime, $src);
        
        // Use ID to find the JP2 URL
        return $this->idToURI($id);
	}
    
     /**
     * getJP2Id
     * @return string $id
     * @param object $obsTime
     * @param object $src
     */
    public function getJP2Id ($obsTime, $src) {
        $query = sprintf("SELECT image.id as id, ABS(UNIX_TIMESTAMP(timestamp) - %d) AS timediffAbs
    					FROM image
    					LEFT JOIN measurement on measurementId = measurement.id
    					LEFT JOIN detector on detectorId = detector.id
    					LEFT JOIN instrument on instrumentId = instrument.id
    					LEFT JOIN observatory on observatoryId = observatory.id
    			  WHERE ", $obsTime);
    
    	// Layer-settings
    	$i=0;
    	foreach($src as $key => $value) {
    		if ($i>0) $query .= " AND";
    		$query .= sprintf(" $key='%s'", mysqli_real_escape_string($this->dbConnection->link, $value));
    		$i++;
    	}
    	$query .= " ORDER BY timediffAbs LIMIT 0,1";
    
    	$result = $this->dbConnection->query($query);
    	$result_array = mysqli_fetch_array($result, MYSQL_ASSOC);
    
        return $result_array["id"];
    }
    
    /**
     * idToURI
     * @return 
     * @param object $id
     */
    private function idToURI ($id) {
        $query = "SELECT uri FROM image WHERE id = $id";
        $result = $this->dbConnection->query($query);
    	$result_array = mysqli_fetch_array($result, MYSQL_ASSOC);
    
        return $result_array["uri"];
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
            	file_put_contents(Config::ERROR_LOG, $msg, FILE_APPEND);
				echo $msg;			
		}
	}
}
?>
