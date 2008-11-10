<?php
class ImgIndex {
	private $dbConnection;

	public function __construct($dbConnection) {
		date_default_timezone_set('UTC');
		$this->dbConnection = $dbConnection;
	}

	public function getProperties($imageId) {
		$query = "SELECT image.id AS imageId, measurement.abbreviation AS measurement, measurementType.name AS measurementType, unit,
							CONCAT(instrument.name, ' ', detector.name, ' ', measurement.name) AS name, detector.minZoom as minZoom,
							detector.abbreviation AS detector, detector.opacityGroupId AS opacityGroupId, opacityGroup.description AS opacityGroupDescription,
							instrument.abbreviation AS instrument, observatory.abbreviation AS observatory,
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

	public function getClosestImage($timestamp, $src, $debug = false) {
		$query = "SELECT image.id AS imageId, measurement.abbreviation AS measurement, measurementType.name AS measurementType, unit,
							CONCAT(instrument.name, \" \", detector.name, \" \", measurement.name) AS name, detector.minZoom as minZoom,
							detector.abbreviation AS detector, detector.opacityGroupId AS opacityGroupId,
							detector.lowestRegularZoomLevel as lowestRegularZoom,
							opacityGroup.description AS opacityGroupDescription,
							instrument.abbreviation AS instrument, observatory.abbreviation AS observatory,
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
				WHERE ";

		// Layer-settings
		$i=0;
		foreach($src as $key => $value) {
			if ($i>0) $query .= " AND";
			$query .= " $key='$value'";
			$i++;
		}

		$query .= " ORDER BY timediffAbs LIMIT 0,1";
		
		if ($debug == "true")
			echo "<br><br>$query<br><br>";

		$result = $this->dbConnection->query($query);
		return mysql_fetch_array($result, MYSQL_ASSOC);
	}

	public function getMeasurements($detector) {
		$query = "SELECT DISTINCT measurement.abbreviation as measurement, measurementType.name as measurementType " .
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

	public function getJP2URL($timestamp, $src) {
		//WORKAROUND FOR MySQL TimeZone differences (HostGator is not using UTC by default)
		//$offset = (5 * 3600); // 5 hours in seconds
		$offset = 0; //local installation of MySQL set to use UTC by default...
		
		$query = "SELECT image.id AS imageId, measurement.abbreviation AS measurement, measurementType.name AS measurementType, unit,
						CONCAT(instrument.name, ' ', detector.name, ' ', measurement.name) AS name,
						detector.abbreviation AS detector, detector.opacityGroupId AS opacityGroupId,
						detector.lowestRegularZoomLevel as lowestRegularZoom,
						opacityGroup.description AS opacityGroupDescription,
						instrument.abbreviation AS instrument, observatory.abbreviation AS observatory,
						UNIX_TIMESTAMP(timestamp) AS timestamp,
							UNIX_TIMESTAMP(timestamp) - $timestamp -$offset AS timediff,
							ABS(UNIX_TIMESTAMP(timestamp) - $timestamp - $offset) AS timediffAbs
						FROM image
						LEFT JOIN measurement on measurementId = measurement.id
						LEFT JOIN measurementType on measurementTypeId = measurementType.id
						LEFT JOIN detector on detectorId = detector.id
						LEFT JOIN opacityGroup on opacityGroupId = opacityGroup.id
						LEFT JOIN instrument on instrumentId = instrument.id
						LEFT JOIN observatory on observatoryId = observatory.id
				WHERE ";

		// Layer-settings
		$i=0;
		foreach($src as $key => $value) {
			if ($i>0) $query .= " AND";
			$query .= " $key='$value'";
			$i++;
		}

		$query .= " ORDER BY timediffAbs LIMIT 0,1";

		//echo $query . "<br><br>";

		$result = $this->dbConnection->query($query);
		$ra = mysql_fetch_array($result, MYSQL_ASSOC);
		
		// Adjust for utc offset
		$ts = $ra['timestamp'] - $offset;
		
		return $this->getFilepath($ra['observatory'], $ra['instrument'], $ra['detector'], $ra['measurement'], $ts);
	}
	/*
	 * getFilePath
	 */
	private function getFilepath($obs, $inst, $det, $meas, $ts) {
		$rootdir = "http://localhost/hv/jpeg2000/";
		$d = getdate($ts);

		$year = $d['year'];
		$mon  = str_pad($d['mon'], 2 , "0", STR_PAD_LEFT);
		$day =  str_pad($d['mday'], 2 , "0", STR_PAD_LEFT);
		$hour =  str_pad($d['hours'], 2 , "0", STR_PAD_LEFT);
		$min =  str_pad($d['minutes'], 2 , "0", STR_PAD_LEFT);
		$sec =  str_pad($d['seconds'], 2 , "0", STR_PAD_LEFT);

		$path = $rootdir . implode("/", array($year, $mon, $day, $hour));
		$path .= "/$obs/$inst/$det/$meas/";
		$path .= implode("_", array($year, $mon, $day, $hour . $min . $sec, $obs, $inst, $det, $meas));
		$path .= ".jp2";

		return $path;
	}
}
?>
