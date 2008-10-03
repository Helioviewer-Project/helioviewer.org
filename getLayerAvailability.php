<?php
	require('phpClasses/autoload.php');
	$dbConnection = new DbConnection();
	
	// Layer parameters
	$obs =  $_GET['observatory'];
	$inst = $_GET['instrument'];
	$det  = $_GET['detector'];
	$meas = $_GET['measurement'];
	
	// Return format
	$return = $_GET['format'];
	
	// Query
	$query = "SELECT DISTINCT instrument.name as instrument, detector.name as detector, observatory.name as observatory, measurement.name as measurement 
	FROM observatory
	INNER JOIN instrument ON observatory.id = instrument.observatoryId
	INNER JOIN detector ON detector.instrumentId = instrument.id
	INNER JOIN measurement ON measurement.detectorId = detector.id";

	if (($obs != "none") OR ($inst != "none") OR ($det != "none") OR ($meas != "none"))
		$query .= " WHERE";
	
	// Limit results
	if ($obs != "none")
		$query .= " observatory.name = '$obs'";
	
	if ($inst != "none") {
		if (substr($query, -5) != "WHERE")
			$query .= " AND";
		$query .= " instrument.name = '$inst'";
	}
	
	if ($det != "none") {
		if (substr($query, -5) != "WHERE")
			$query .= " AND";
		$query .= " detector.name = '$det'";
	}
	
	if ($meas != "none") {
		if (substr($query, -5) != "WHERE")
			$query .= " AND";
		$query .= " measurement.name = '$meas'";
	}
	$query .= ";";
		
	// Store results
	$observatories = array();
	$instruments   = array();
	$detectors     = array();
	$measurements  = array();

	// Perform query
	$result = $dbConnection->query($query);
	while ($row = mysql_fetch_array($result, MYSQL_ASSOC)) {
		array_push($observatories, $row['observatory']);
		array_push($instruments, $row['instrument']);
		array_push($detectors, $row['detector']);
		array_push($measurements, $row['measurement']);
	}
	
	// Remove redundent entries
	$settings = array();
	$settings['observatories'] = array_keys(array_flip($observatories));
	$settings['instruments'] =   array_keys(array_flip($instruments));
	$settings['detectors'] =     array_keys(array_flip($detectors));
	$settings['measurements'] =  array_keys(array_flip($measurements));
	
	// JSON
	if ($return == "json") {
		header("Content-type: application/json");
		echo json_encode($settings);
	}
?>

