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
	$Year =				$_GET["Year"];
	$Month =			$_GET["Month"];
	$Day = 				$_GET["Day"];
	$Hour =				$_GET["Hour"];
	$Minute =			$_GET["Minute"];
	$Second =			$_GET["Second"];
	$IncrementDays =    $_GET["IncrementDays"];
	$IncrementHours =   $_GET["IncrementHours"];
	$IncrementMinutes = $_GET["IncrementMinutes"];
	$Direction =		$_GET["Direction"];

	Filter ($Observatory, $Instrument, $Detector, $From, $To, $Measurement, $Year, $Month, $Day, $Hour, $Minute, $Second, $IncrementDays, $IncrementHours, $IncrementMinutes, $Direction);
	
	function Filter ($observatory, $instrument, $detector, $from, $to, $measurement, $year, $month, $day, $hour, $minute, $second, $incrementDays, $incrementHours, $incrementMinutes, $direction)
	{
		$limit = 2;
		
		$query = "SELECT * FROM maps WHERE (";
		
		//Instrument
		if ($instrument != null) {
			$query .= "Instrument = '$instrument' ";
		}

		//Time Increment
		if ($incrementHours == 1) {
			$query .= "AND minute = '$minute'";
			$limit = 15; 
		}
		
		if ($incrementDays == 1) {
			$query .= "AND hour = '$hour' AND minute = '$minute'";
			$limit = 16; //TEMP WORK-AROUND
		}
		
		if ($incrementYears == 1) {
			$query .= "AND day = '$day' AND hour = '$hour' AND minute = '$minute'";
			$limit = 15;
		}
		
		if ($incrementMinutes == 1) {
			$query .= "AND month= '$month' AND day = '$day' AND hour = '$hour'";
			$limit = 15;
		}

		
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
		if ($incrementDays == 1) {
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
						$query = "SELECT * FROM maps WHERE (instrument = '$instrument') ORDER BY ABS(UNIX_TIMESTAMP('$timeString')-UNIX_TIMESTAMP(timestamp)) ASC LIMIT 1";
						$result      = mysql_query($query);
						$closestDate = array();
						
						// Add it to the result set
						while ($row = mysql_fetch_array($result, MYSQL_ASSOC)) {
							array_push($closestDate, $row);
						}
						array_splice($resultArray, $i, 0, $closestDate);
					}
				}
				
				// If end of data-set is reached, include last available data-point
				else if ($atEnd == false) {
					$timeString = $time->format('Y-m-d H:i:s');
					$query = "SELECT * FROM maps WHERE (instrument = '$instrument') ORDER BY ABS(UNIX_TIMESTAMP('$timeString')-UNIX_TIMESTAMP(timestamp)) ASC LIMIT 1";
					
					$result      = mysql_query($query);
					$closestDate = array();
					
					while ($row = mysql_fetch_array($result, MYSQL_ASSOC)) {
						array_push($closestDate, $row);
					}

					array_splice($resultArray, $i, 0, $closestDate);
					$atEnd = true;
				}
				
				//Update the time variable
				$time->modify("+$incrementDays day");
				
				// Note: Another possible method to achieve the above: first add all missing values and then sort array...
				//       Also, to make things more generalizable it may be desirable when navigating BACK in time to simply
				//       perform the SQL queries sorting DESC instead of ASC.. then most other operations should be the same.
				}
		}
		echo json_encode($resultArray);
	}
?>
