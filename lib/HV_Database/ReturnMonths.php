<?php
	include 'database_functions.php';

	$Instrument = $_GET['Instrument'];
	$Year = $_GET['Year'];

	ReturnMonths($Instrument, $Year);
?>
