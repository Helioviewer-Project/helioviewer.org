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
	
	// Validate new combinations (Note: measurement changes are always valid)
	if (isset($_GET['changed'])) {
		$changed = $_GET['changed'];
		$newValue = $_GET['value'];
		
		// If query returns any matches then the new combination is valid
		$query = "SELECT
					count(*) as count from observatory
				  INNER JOIN 
				  	instrument ON observatory.id = instrument.observatoryId 
				  INNER JOIN 
				  	detector ON detector.instrumentId = instrument.id 
				  INNER JOIN 
				  	measurement ON measurement.detectorId = detector.id
				  WHERE 
				  	observatory.abbreviation = '$obs' AND instrument.abbreviation = '$inst' and detector.abbreviation='$det' and measurement.abbreviation = '$meas';";
		
		$result = $dbConnection->query($query);
		$row = mysql_fetch_array($result, MYSQL_ASSOC);
		$valid = $row['count'];
		
		//If combination is invalid, adjust options to provide a valid combination
		if (!$valid) {
			//CASE 1: Observatory changed
			
			//CASE 2: Instrument changefirst grab a list of valid detectors for the chosen instrumentd
			if ($changed == "instrument") {
				//Find a valid detector for the chosen instrument
				$query = "SELECT detector.abbreviation from detector INNER JOIN instrument ON instrument.id = detector.instrumentId WHERE instrument.abbreviation = '$newValue' LIMIT 1;";
				$result = $dbConnection->query($query);
				$row = mysql_fetch_array($result, MYSQL_ASSOC);
				$det = $row['abbreviation'];
				
				//Measurements will be automatically updated...
			}
			
			//CASE 3: Detector changed
			
			//CASE 4: Measurement change
			//Do nothing
		}
	}
	
	// Determine appropriate options to display given the current combination of layer parameters
	$options = array(
		"observatories" => array(array("name" => "SOHO", "abbreviation" => "soho")),
		"instruments" =>   queryField($dbConnection, "observatory", "instrument", $obs),
		"detectors" =>     queryField($dbConnection, "instrument", "detector", $inst),
		"measurements" =>  queryField($dbConnection, "detector", "measurement", $det)
	);

	// Output results in specified format
	if ($return == "json") {
		header("Content-type: application/json");
		echo json_encode($options);
	}
	
	if ($return == "plaintext") {
		echo json_encode($options);
	}
	
	/**
	 * 
	 * @return Array Allowed values for given field
	 * @param $db Object MySQL Database connection
	 * @param $f1 String Field Objectof interest
	 * @param $f2 String Limiting field
	 * @param $limit String Limiting field value
	 * 
	 * Queries one field based on a limit in another. Performs queries of the sort
	 * "Give me all instruments where observatory equals SOHO."
	 */
	function queryField($db, $f1, $f2, $f1_value) {
		$values = array();
		$query = "SELECT $f2.name, $f2.abbreviation from $f2 INNER JOIN $f1 ON $f1.id = $f2.$f1" . "Id" . " WHERE $f1.abbreviation = '$f1_value';";
		
		if ($_GET['format'] == "plaintext")
			echo "<strong>query:</strong><br>$query<br><br>";
		
		$result = $db->query($query);		
		while ($row = mysql_fetch_array($result, MYSQL_ASSOC)) {
			array_push($values, $row);
		}
				
		return $values;		
	}
?>

