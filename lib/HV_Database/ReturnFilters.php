<?php
	include 'database_functions.php';

	//$Observatory = $_POST["Observatory"];
	$Instrument = $_POST["Instrument"];
	//$Detector = $_POST["Detector"];
	//$Measurement = $_POST["Measurement"];
	$From = 	  $_POST["From"];
	$To = 		  $_POST["To"];
	$Increment =  $_POST["Increment"];
	$Units =	  $_POST["Units"];

	Filter($Observatory, $Instrument, $Detector, $Measurement, $From, $To, $Increment, $Units);
?>
