<?php
require('classes/ImageSeries.php');
set_time_limit(180);
$maxFrames = 150;

//Example Queries:
//	http://localhost/hv/api/getImageSeries.php?layers=EITEIT195&startDate=1065312000&zoomLevel=10&numFrames=100
//	http://localhost/hv/api/getImageSeries.php?layers=EITEIT195,LAS0C20WL&startDate=1041724800&zoomLevel=13&numFrames=150

//Process query string
try {
	$layers = explode(",", $_GET['layers']);

	//Limit number of layers to three
	if ((sizeOf($layers) > 3) || (strlen($_GET['layers']) == 0)) {
		throw new Exception("Invalid layer choices! You must specify 1-3 command-separate layernames.");
	}
	
	$startDate = $_GET['startDate'];
	$zoomLevel = $_GET['zoomLevel'];
	
	//Limit number of frames to 100
	$numFrames = $_GET['numFrames'];
	
	if (($numFrames < 10) || ($numFrames > $maxFrames)) {
		throw new Exception("Invalid number of frames. Number of frames should be at least 10 and no more than $maxFrames.");
	}
	
}
catch(Exception $e) {
	echo 'Error: ' .$e->getMessage();
	exit();
}

//print "Quick Movie:<br>";
$imgSeries = new ImageSeries($layers, $startDate, $zoomLevel, $numFrames);
$imgSeries->quickMovie();
?>
