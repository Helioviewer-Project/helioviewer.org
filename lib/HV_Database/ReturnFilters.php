<?php
	include 'database_functions.php';
	header("content-type:application/json");
	
	// CONSTANTS
	define ("DATE_START_EIT", "2003-10-04 03:24:00");
	define ("DATE_END_EIT",   "2003-10-31 23:48:00");
	define ("DATE_START_LAS", "2003-10-01 00:00:00");
	define ("DATE_END_LAS",   "2003-10-31 23:54:00");
	
	//example query: SELECT * FROM maps WHERE (Instrument = 'EIT' AND day >= '5' AND hour = '0' AND minute = '00'AND timestamp BETWEEN '2003-10-05 00:00:00' AND '2003-10-15 00:00:00') ORDER BY timestamp LIMIT 30
	
	$From = 	        $_GET["From"];
	$To = 		 	    $_GET["To"];
	$Instrument = 	    $_GET["Instrument"];
	$Wavelength =       $_GET["Wavelength"];
	$Year =				$_GET["Year"];
	$Month =			$_GET["Month"];
	$Day = 				$_GET["Day"];
	$Hour =				$_GET["Hour"];
	$Minute =			$_GET["Minute"];
	$Second =			$_GET["Second"];
	$Increment =		$_GET["Increment"];
	$Direction =		$_GET["Direction"];

	Filter ($Observatory, $Instrument, $Wavelength, $Detector, $From, $To, $Measurement, $Year, $Month, $Day, $Hour, $Minute, $Second, $Increment, $Direction);
	
	function Filter ($observatory, $instrument, $wavelength, $detector, $from, $to, $measurement, $year, $month, $day, $hour, $minute, $second, $increment, $direction)
	{
		$limit = 16;
		
		$query = "SELECT * FROM maps WHERE (";
		
		// Instrument
		$query .= "Instrument = '$instrument' ";
		
		// Wavelength (EIT Only)
		$query .= "AND measurement = $wavelength ";
		

		if ($increment % (3600 * 24) == 0)
			$query .= "And hour = '$hour' AND minute = '$minute' AND second = '$second'";
			
		else if ($increment % 3600 == 0)
			$query .= "AND minute = '$minute' AND second = '$second'";
			
		else if ($increment % 60 == 0)
			$query .= "AND second = '$second'";

	
		// Limit Range to query
		$query .= "AND timestamp BETWEEN '$from' AND '$to'";
		
		$query .= ") ORDER BY timestamp LIMIT $limit";
		
		//echo "\n\n$query\n\n<br /><br />";
				
		$result = mysql_query($query);
		
		$resultArray = array();

		while ($row = mysql_fetch_array($result, MYSQL_ASSOC))
		{
			array_push($resultArray, $row);
		}

		// Pad array to keep images in sync with observation time

		$time = date_create($from);
		$atEnd =    false;
	
		// Check each point in array for the specified query range and see if an exact match was found
		for ($i = 0; $i < $limit; $i++) {
			$currentTime = $time->format('Y-m-d H:i:s');
			
			// Only query if you are still within the available range of data for the specified instrument				
			if ((constant("DATE_START_" . $instrument) <= $currentTime) && (constant("DATE_END_" . $instrument) >= $currentTime)) { 
			
				// If a missing data point is detected, get the next closest match and fill it ins
				if ($resultArray[$i]["timestamp"] != $currentTime) {
				
					// Get the next cloest time
					$timeString = $time->format('Y-m-d H:i:s');
					$query = "SELECT * FROM maps WHERE (instrument = '$instrument' AND measurement = $wavelength) ORDER BY ABS(UNIX_TIMESTAMP('$timeString')-UNIX_TIMESTAMP(timestamp)) ASC LIMIT 1";
					$result      = mysql_query($query);
					$closestDate = array();
					
					// Add it to the result set
					while ($row = mysql_fetch_array($result, MYSQL_ASSOC)) {
						array_push($closestDate, $row);
					}
					array_splice($resultArray, $i, 0, $closestDate);
				}
			}
			
			// If the begining of the data-set is reached, include the first available data-point
			else if ( ($currentTime <= constant("DATE_START_" . $instrument)) && ($atBegining == false) ) {
				$timeString = $time->format('Y-m-d H:i:s');
				$query = "SELECT * FROM maps WHERE (instrument = '$instrument' AND measurement = $wavelength) ORDER BY ABS(UNIX_TIMESTAMP('$timeString')-UNIX_TIMESTAMP(timestamp)) ASC LIMIT 1";
				
				$result      = mysql_query($query);
				$closestDate = array();
				
				while ($row = mysql_fetch_array($result, MYSQL_ASSOC)) {
					array_push($closestDate, $row);
				}
				
				//Insert into array
				array_splice($resultArray, $i, 0, $closestDate);
				
				$atBegining = true;
			}
			
			// If end of data-set is reached, include last available data-point
			else if ( ($currentTime >= constant("DATE_END_" . $instrument)) && ($atEnd == false) ) {
				$timeString = $time->format('Y-m-d H:i:s');
				$query = "SELECT * FROM maps WHERE (instrument = '$instrument' AND measurement = $wavelength) ORDER BY ABS(UNIX_TIMESTAMP('$timeString')-UNIX_TIMESTAMP(timestamp)) ASC LIMIT 1";
				
				$result      = mysql_query($query);
				$closestDate = array();
				
				while ($row = mysql_fetch_array($result, MYSQL_ASSOC)) {
					array_push($closestDate, $row);
				}
				
				//Insert into array
				array_splice($resultArray, $i, 0, $closestDate);
				
				$atEnd = true;
			}

		
			//Update the time variable
			$time->modify("+$increment second");
			
			// Note: Another possible method to achieve the above: first add all missing values and then sort array...
			//       Also, to make things more generalizable it may be desirable when navigating BACK in time to simply
			//       perform the SQL queries sorting DESC instead of ASC.. then most other operations should be the same.
			}
		echo json_encode($resultArray);
	}
?>
