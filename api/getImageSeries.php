<?php
require('classes/ImageSeries.php');
set_time_limit(180);
//Example Query: http://localhost/hv/api/getImageSeries.php?layers=EITEIT195&startDate=1065312000&zoomLevel=10&numFrames=100

//Process query string
try {
	$layers = explode(",", $_GET['layers']);

	if ((sizeOf($layers) > 3) || (strlen($_GET['layers']) == 0)) {
		throw new Exception("Error: Invalid layer choices! You must specify 1-3 command-separate layernames.");
	}
	
	$startDate = $_GET['startDate'];
	$zoomLevel = $_GET['zoomLevel'];
	$numFrames = $_GET['numFrames'];
	
}
catch(Exception $e) {
	echo 'Error: ' .$e->getMessage();
	exit();
}

//print "Quick Movie:<br>";
$imgSeries = new ImageSeries($layers, $startDate, $zoomLevel, $numFrames);
$imgSeries->quickMovie();

?>
