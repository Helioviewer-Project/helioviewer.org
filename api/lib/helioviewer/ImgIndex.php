<?php
class ImgIndex {
	private $dbConnection;

	public function __construct($dbConnection) {
		date_default_timezone_set('UTC');
		$this->dbConnection = $dbConnection;
	}

	public function getClosestImage($timestamp, $src, $debug = false) {
		$query = sprintf("SELECT image.id AS imageId, image.lengthX as width, image.lengthY as height, image.imgScaleX as naturalImageScale,
							measurement.abbreviation AS measurement, measurementType.name AS measurementType, unit,
							CONCAT(instrument.name, \" \", detector.name, \" \", measurement.name) AS name, detector.minZoom as minZoom,
							detector.abbreviation AS detector, detector.opacityGroupId AS opacityGroupId,
							opacityGroup.description AS opacityGroupDescription,
							instrument.abbreviation AS instrument, observatory.abbreviation AS observatory,
							UNIX_TIMESTAMP(timestamp) AS timestamp,
								UNIX_TIMESTAMP(timestamp) - %d AS timediff,
								ABS(UNIX_TIMESTAMP(timestamp) - %d) AS timediffAbs
							FROM image
							LEFT JOIN measurement on measurementId = measurement.id
							LEFT JOIN measurementType on measurementTypeId = measurementType.id
							LEFT JOIN detector on detectorId = detector.id
							LEFT JOIN opacityGroup on opacityGroupId = opacityGroup.id
							LEFT JOIN instrument on instrumentId = instrument.id
							LEFT JOIN observatory on observatoryId = observatory.id
				WHERE ", $timestamp, $timestamp);

		// Layer-settings
		$i=0;
		foreach($src as $key => $value) {
			if ($i>0) $query .= " AND";
			$query .= sprintf(" $key='%s'", mysqli_real_escape_string($this->dbConnection->link, $value));
			$i++;
		}

		$query .= " ORDER BY timediffAbs LIMIT 0,1";
		
		//if ($debug == "true")
		//	echo "<br><br>$query<br><br>";

		$result = $this->dbConnection->query($query);
		return mysqli_fetch_array($result, MYSQL_ASSOC);
	}

	public function getJP2Location($timestamp, $src) {
		//WORKAROUND FOR MySQL TimeZone differences (HostGator is not using UTC by default)
		//$offset = (5 * 3600); // 5 hours in seconds
		$offset = 0; //local installation of MySQL set to use UTC by default...
		
		$query = sprintf("SELECT image.uri as url, ABS(UNIX_TIMESTAMP(timestamp) - %d - %d) AS timediffAbs
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
