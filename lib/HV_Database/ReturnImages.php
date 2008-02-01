<?php
	include 'database_functions.php';

	$Instrument = $_GET['Instrument'];
	$Year = $_GET['Year'];
	$Month = $_GET['Month'];
	$Day = $_GET['Day'];

	LEGACY_ReturnMaps($Instrument, $Year, $Month, $Day);
?>
