<?php
	include 'database_functions.php';
	header("content-type:application/json");
	
	// CONSTANTS
	define ("DATE_START_EIT", "2003-01-01 00:00:00");
	define ("DATE_END_EIT",   "2003-12-26 22:00:00");
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
	
	/**************************************************************************
	 * Filter
	 *  
	 * Note: In the future it may be better to used a MySQL stored procedure
	 *       to handle querying.
	 *
	 *************************************************************************/
	function Filter ($observatory, $instrument, $wavelength, $detector, $from, $to, $measurement, $year, $month, $day, $hour, $minute, $second, $increment, $direction)
	{
		$limit = 16;
	
     	$resultArray = array();
		$time =        date_create($from);
		$atEnd =       false;
		$atBegining =  false;
		
		// Rename LASCO to LAS for database compatability
		if ($instrument == "LASCO")
			$instrument = "LAS";
	
		// Check each point in array for the specified query range and see if an exact match was found
		for ($i = 0; $i < $limit; $i++) {
			$currentTime = $time->format('Y-m-d H:i:s');
			
			($instrument == "EIT") ? $wl = " AND measurement = $wavelength" : "";
			
			// Only query if you are still within the available range of data for the specified instrument				
			if ((constant("DATE_START_" . $instrument) <= $currentTime) && (constant("DATE_END_" . $instrument) >= $currentTime)) { 
				// Get the next closest time
				$query = "SELECT * FROM maps WHERE (instrument = '$instrument'$wl) ORDER BY ABS(UNIX_TIMESTAMP('$currentTime')-UNIX_TIMESTAMP(timestamp)) ASC LIMIT 1";
				
				//echo "<br /><b>Next Closest query for $timeString: </b>$query <br /><br />";
				
				$result = mysql_query($query);
				
				// Add it to the result set
				while ($row = mysql_fetch_array($result, MYSQL_ASSOC)) {
					array_push($resultArray, $row);
				}
			}
			
			// If the begining of the data-set is reached, include the first available data-point
			else if ( ($currentTime <= constant("DATE_START_" . $instrument)) && ($atBegining == false) ) {
				$query =  "SELECT * FROM maps WHERE (instrument = '$instrument'$wl) ORDER BY ABS(UNIX_TIMESTAMP('$timeString')-UNIX_TIMESTAMP(timestamp)) ASC LIMIT 1";
				$result = mysql_query($query);
				
				while ($row = mysql_fetch_array($result, MYSQL_ASSOC)) {
					array_push($resultArray, $row);
				}
				
				$atBegining = true;
			}
			
			// If end of data-set is reached, include last available data-point
			else if ( ($currentTime >= constant("DATE_END_" . $instrument)) && ($atEnd == false) ) {
				$query = "SELECT * FROM maps WHERE (instrument = '$instrument'$wl) ORDER BY ABS(UNIX_TIMESTAMP('$timeString')-UNIX_TIMESTAMP(timestamp)) ASC LIMIT 1";
				
				$result      = mysql_query($query);
				
				while ($row = mysql_fetch_array($result, MYSQL_ASSOC)) {
					array_push($resultArray, $row);
				}
				
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
