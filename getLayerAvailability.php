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
	
	// Type of query
	//$function = $_GET['function'];
	
	// Query
	$query = "SELECT DISTINCT instrument.abbreviation as instrument, detector.abbreviation as detector, observatory.abbreviation as observatory, measurement.abbreviation as measurement 
	FROM observatory
	INNER JOIN instrument ON observatory.id = instrument.observatoryId
	INNER JOIN detector ON detector.instrumentId = instrument.id
	INNER JOIN measurement ON measurement.detectorId = detector.id";

	if (($obs != "none") OR ($inst != "none") OR ($det != "none") OR ($meas != "none"))
		$query .= " WHERE";
	
	// Limit results
	if ($obs != "none")
		$query .= " observatory.abbreviation = '$obs'";
	
	if ($inst != "none") {
		if (substr($query, -5) != "WHERE")
			$query .= " AND";
		$query .= " instrument.abbreviation = '$inst'";
	}
	
	if ($det != "none") {
		if (substr($query, -5) != "WHERE")
			$query .= " AND";
		$query .= " detector.abbreviation = '$det'";
	}
	
	if ($meas != "none") {
		if (substr($query, -5) != "WHERE")
			$query .= " AND";
		$query .= " measurement.abbreviation = '$meas'";
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
	
	// Output results in specified format
	if ($return == "json") {
		header("Content-type: application/json");
		echo json_encode($settings);
	}
	
	if ($return == "plaintext") {
		echo json_encode($settings);		
	}
?>

