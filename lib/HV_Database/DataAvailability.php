<?php
	include 'database_functions.php';
	header("content-type:application/json");
	
	// CONSTANTS
	define ("DATE_START_EIT", "2003-10-04 03:24:00");
	define ("DATE_END_EIT",   "2003-10-31 23:48:00");
	define ("DATE_START_LAS", "2003-10-01 00:00:00");
	define ("DATE_END_LAS",   "2003-10-31 23:54:00");
	
	$inst =  $_GET["inst"];
	$month = $_GET["month"];
	$year =  $_GET["year"];

	GetAvailableDays($inst, $month, $year);
	
	function GetAvailableDays ($inst, $month, $year)
	{
		$query = "SELECT DISTINCT day from maps WHERE (instrument = '$inst' AND year='$year' AND month='$month') ORDER BY day;";
		
		//echo "\n\n$query\n\n<br /><br />";
				
		$result = mysql_query($query);		
		$resultArray = array();
		
		//$daysInMonth = cal_days_in_month(CAL_GREGORIAN, $month, $year);
		
		$i = 0;
		while ($row = mysql_fetch_array($result, MYSQL_NUM)) {
			//pad missing values for easier checking
			while ($row[0] > $i) {
				array_push($resultArray, null);
				$i++;
			}
			array_push($resultArray, $row);
			$i++;
		}
		echo json_encode($resultArray);
	}
	
?>
