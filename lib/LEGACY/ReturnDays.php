<?php
	include 'database_functions.php';

	$Instrument = $_GET['Instrument'];
	$Year = $_GET['Year'];
	$Month = $_GET['Month'];
	
	ReturnDays($Instrument, $Year, $Month);
?>
