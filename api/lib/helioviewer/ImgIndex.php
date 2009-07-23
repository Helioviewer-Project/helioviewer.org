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

	public function getClosestImage($obsTime, $src) {
		$query = sprintf("SELECT image.id as mysqlId, image.lengthX as width, image.lengthY as height, image.imgScaleX as naturalImageScale,
							measurement.abbreviation AS measurement, measurementType.name AS measurementType, unit,
							CONCAT(instrument.name, \" \", detector.name, \" \", measurement.name) AS name, detector.minZoom as minZoom,
							detector.abbreviation AS detector, detector.opacityGroupId AS opacityGroupId,
							opacityGroup.description AS opacityGroupDescription,
							instrument.abbreviation AS instrument, observatory.abbreviation AS observatory,
							UNIX_TIMESTAMP(timestamp) AS timestamp,
								%d - UNIX_TIMESTAMP(timestamp) AS timediff,
								ABS(%d - UNIX_TIMESTAMP(timestamp)) AS timediffAbs
							FROM image
							LEFT JOIN measurement on measurementId = measurement.id
							LEFT JOIN measurementType on measurementTypeId = measurementType.id
							LEFT JOIN detector on detectorId = detector.id
							LEFT JOIN opacityGroup on opacityGroupId = opacityGroup.id
							LEFT JOIN instrument on instrumentId = instrument.id
							LEFT JOIN observatory on observatoryId = observatory.id
				WHERE ", $obsTime, $obsTime);


		// Layer-settings
		$i=0;
		foreach($src as $key => $value) {
			if ($i>0) $query .= " AND";
			$query .= sprintf(" $key='%s'", mysqli_real_escape_string($this->dbConnection->link, $value));
			$i++;
		}

		$query .= " ORDER BY timediffAbs LIMIT 0,1";
		
        //echo "$query<br><br>";
        //exit();

		$result = $this->dbConnection->query($query);
        $im = mysqli_fetch_array($result, MYSQL_ASSOC);
        
        // get uri
        $im["uri"] = $this->idToURI($im["mysqlId"]);

		return $im;
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