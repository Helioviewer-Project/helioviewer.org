<?php
	include 'database_functions.php';

	//$Observatory = $_POST["Observatory"];
	//$Detector = $_POST["Detector"];
	//$Measurement = $_POST["Measurement"];
	//$From = 	        $_POST["From"];
	//$To = 		 	    $_POST["To"];
	$Instrument = 	    $_POST["Instrument"];
	$Year =				$_POST["Year"];
	$Month =			$_POST["Month"];
	$Day = 				$_POST["Day"];
	$Hour =				$_POST["Hour"];
	$Minute =			$_POST["Minute"];
	$Second =			$_POST["Second"];
	$IncrementDays =    $_POST["IncrementDays"];
	$IncrementHours =   $_POST["IncrementHours"];
	$IncrementMinutes = $_POST["IncrementMinutes"];

	Filter($Observatory, $Instrument, $Detector, $Measurement, $Year, $Month, $Day, $Hour, $Minute, $Second, $IncrementDays, $IncrementHours, $IncrementMinutes);
?>
