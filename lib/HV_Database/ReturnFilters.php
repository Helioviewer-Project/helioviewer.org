<?php
	include 'database_functions.php';
	header("content-type:application/json");
	
	//BEFORE:  SELECT * FROM maps WHERE (Instrument = 'EIT' AND timestamp BETWEEN '2003-10-05 00:00:00' AND '2003-10-12 00:00:00') ORDER BY timestamp LIMIT 30";
	//CURRENT: SELECT * FROM maps WHERE (Instrument = 'EIT' AND hour = '0' AND minute = '00') ORDER BY timestamp LIMIT 30
	
	//$Observatory = $_POST["Observatory"];
	//$Detector = $_POST["Detector"];
	//$Measurement = $_POST["Measurement"];
	//$From = 	        $_POST["From"];
	//$To = 		 	    $_POST["To"];
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
	

	Filter ($Observatory, $Instrument, $Detector, $Measurement, $Year, $Month, $Day, $Hour, $Minute, $Second, $IncrementDays, $IncrementHours, $IncrementMinutes);
	
	function Filter ($observatory, $instrument, $detector, $measurement, $year, $month, $day, $hour, $minute, $second, $incrementDays, $incrementHours, $incrementMinutes)
	{
		$limit = 1;
		
		$query = "SELECT * FROM maps WHERE (";
		
		//Instrument
		if ($instrument != null) {
			$query .= "Instrument = '$instrument'";
		}
		
		//Time Increment
		if ($incrementHours == 1) {
			$query .= "AND day = '$day' AND minute = '$minute'";
			$limit = 24;
		}
		
		if ($incrementDays == 1) {
			$query .= "AND hour = '$hour' AND minute = '$minute'";
			$limit = 30;
		}
		
		if ($incrementYears == 1) {
			$query .= "AND day = '1' AND hour = '$hour' AND minute = '$minute'";
			$limit = 10;
		}
		
		if ($incrementMinutes == 1) {
			$query .= "AND month= '$month' AND day = '$day' AND hour = '$hour'";
			$limit = 10;
		}
		
		$query .= ") ORDER BY timestamp LIMIT $limit";
		
		$result = mysql_query($query);
		
		$resultArray = array();

		while ($row = mysql_fetch_array($result, MYSQL_ASSOC))
		{
			array_push($resultArray, $row);
		}
		
		//pad array to keep images in sync with observation time
		//for (var $i = 0; $i < $resultArray.length; $i++) {...}

		echo json_encode($resultArray);
	}
	
?>
