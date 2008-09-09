<?php
class ImgIndex {
  private $dbConnection;

  public function __construct($dbConnection) {
    $this->dbConnection = $dbConnection;
  }

  public function getProperties($imageId) {
    $query = "SELECT image.id AS imageId, filetype, measurement.name AS measurement, measurementType.name AS measurementType, unit, 
    						detector.name AS detector, detector.opacityGroupId AS opacityGroupId, opacityGroup.description AS opacityGroupDescription,
    						instrument.name AS instrument, observatory.name AS observatory, 
    						UNIX_TIMESTAMP(timestamp) AS timestamp
    					FROM image
							LEFT JOIN measurement on measurementId = measurement.id
							LEFT JOIN measurementType on measurementTypeId = measurementType.id
							LEFT JOIN detector on detectorId = detector.id
							LEFT JOIN opacityGroup on opacityGroupId = opacityGroup.id
							LEFT JOIN instrument on instrumentId = instrument.id
							LEFT JOIN observatory on observatoryId = observatory.id 
							WHERE image.id=$imageId";
    $result = $this->dbConnection->query($query);
    return mysql_fetch_array($result, MYSQL_ASSOC);
  }

  public function getClosestImage($timestamp, $src) {
    $query = "SELECT image.id AS imageId, filetype, measurement.name AS measurement, measurementType.name AS measurementType, unit, 
    						detector.name AS detector, detector.opacityGroupId AS opacityGroupId,
    						detector.lowestRegularZoomLevel as lowestRegularZoom,
    						opacityGroup.description AS opacityGroupDescription,
    						instrument.name AS instrument, observatory.name AS observatory, 
    						UNIX_TIMESTAMP(timestamp) AS timestamp,
								UNIX_TIMESTAMP(timestamp) - $timestamp AS timediff,
								ABS(UNIX_TIMESTAMP(timestamp) - $timestamp) AS timediffAbs 
							FROM image
							LEFT JOIN measurement on measurementId = measurement.id
							LEFT JOIN measurementType on measurementTypeId = measurementType.id
							LEFT JOIN detector on detectorId = detector.id
							LEFT JOIN opacityGroup on opacityGroupId = opacityGroup.id
							LEFT JOIN instrument on instrumentId = instrument.id
							LEFT JOIN observatory on observatoryId = observatory.id
              WHERE";
    $i=0;
    foreach($src as $key => $value) {
      if ($i>0) $query .= " AND";
      $query .= " $key='$value'";
      $i++;
    }

    $query .= " ORDER BY timediffAbs LIMIT 0,1";
    //echo date("O");
    //echo "<br><br>$query<br><br>";
    
    $result = $this->dbConnection->query($query);
    return mysql_fetch_array($result, MYSQL_ASSOC);
  }
  
  public function getMeasurements($detector) {
    $query = "SELECT DISTINCT measurement.name as measurement, measurementType.name as measurementType " .
             "FROM measurement " . 
             "INNER JOIN detector ON measurement.detectorId = detector.id " . 
             "INNER JOIN measurementType ON measurement.measurementTypeId = measurementType.id " . 
             "WHERE detector.name = \"" . $detector . "\";";

	//echo $query;
	$result = $dbConnection->query($query);
	$measurements = array();
	
	while ($row = mysql_fetch_array($result, MYSQL_ASSOC)) {
	    array_push($measurements, $row["measurement"]);
	}
	
	return $measurements;
  }

/*
  public function getDefaultImage() {
    $query = "SELECT map FROM maps WHERE instrument='EIT' ORDER BY timestamp DESC LIMIT 0,1";
    $result = $this->dbConnection->query($query);
    $row = mysql_fetch_array($result);
    return $row['map'];
  }
*/
	
	// ToDo: Search function
}
?>
