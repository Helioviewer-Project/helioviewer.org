<?php
class ImgIndex {
	private $dbConnection;

	public function __construct($dbConnection) {
		date_default_timezone_set('UTC');
		$this->dbConnection = $dbConnection;
	}

	public function getClosestImage($timestamp, $src) {
        $offset = "(UNIX_TIMESTAMP(now()) - UNIX_TIMESTAMP(UTC_TIMESTAMP()))";
        
		$query = sprintf("SELECT image.id AS imageId, image.lengthX as width, image.lengthY as height, image.imgScaleX as naturalImageScale,
							measurement.abbreviation AS measurement, measurementType.name AS measurementType, unit,
							CONCAT(instrument.name, \" \", detector.name, \" \", measurement.name) AS name, detector.minZoom as minZoom,
							detector.abbreviation AS detector, detector.opacityGroupId AS opacityGroupId,
							opacityGroup.description AS opacityGroupDescription,
							instrument.abbreviation AS instrument, observatory.abbreviation AS observatory,
							UNIX_TIMESTAMP(timestamp) - %s AS timestamp,
								UNIX_TIMESTAMP(timestamp) - %d - %s AS timediff,
								ABS(UNIX_TIMESTAMP(timestamp) - %d - %s) AS timediffAbs
							FROM image
							LEFT JOIN measurement on measurementId = measurement.id
							LEFT JOIN measurementType on measurementTypeId = measurementType.id
							LEFT JOIN detector on detectorId = detector.id
							LEFT JOIN opacityGroup on opacityGroupId = opacityGroup.id
							LEFT JOIN instrument on instrumentId = instrument.id
							LEFT JOIN observatory on observatoryId = observatory.id
				WHERE ", $offset, $timestamp, $offset, $timestamp, $offset);

		// Layer-settings
		$i=0;
		foreach($src as $key => $value) {
			if ($i>0) $query .= " AND";
			$query .= sprintf(" $key='%s'", mysqli_real_escape_string($this->dbConnection->link, $value));
			$i++;
		}

		$query .= " ORDER BY timediffAbs LIMIT 0,1";
		
        //echo "<br><br>$query<br><br>";
        //exit();

		$result = $this->dbConnection->query($query);
		return mysqli_fetch_array($result, MYSQL_ASSOC);
	}

	public function getJP2Location($timestamp, $src) {
		//WORKAROUND FOR MySQL Timezone differences (For MySQL servers not set to UTC timezone)
        $offset = "(UNIX_TIMESTAMP(now()) - UNIX_TIMESTAMP(UTC_TIMESTAMP()))";
		
		$query = sprintf("SELECT image.uri as url, ABS(UNIX_TIMESTAMP(timestamp) - %d - %s) AS timediffAbs
						FROM image
						LEFT JOIN measurement on measurementId = measurement.id
						LEFT JOIN detector on detectorId = detector.id
						LEFT JOIN instrument on instrumentId = instrument.id
						LEFT JOIN observatory on observatoryId = observatory.id
				  WHERE ", $timestamp, $offset);

		// Layer-settings
		$i=0;
		foreach($src as $key => $value) {
			if ($i>0) $query .= " AND";
			$query .= sprintf(" $key='%s'", mysqli_real_escape_string($this->dbConnection->link, $value));
			$i++;
		}

		$query .= " ORDER BY timediffAbs LIMIT 0,1";

		//echo $query . "<br><br>";
		$result = $this->dbConnection->query($query);
		$result_array = mysqli_fetch_array($result, MYSQL_ASSOC);
		
		return $result_array["url"];
		
	}
}
?>
