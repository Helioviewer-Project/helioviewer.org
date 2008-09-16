<?php
require('classes/CompositeImage.php');

//Passing timestamps from JavaScript:
// var d = new Date(Date.UTC(2003, 9, 5));
// var unix_ts = d.getTime() * 1000;

//Example queries: http://localhost/hv/api/getCompositeImage.php?layers=EITEIT171&timestamps=1041728400&zoomLevel=10
// http://localhost/hv/api/getCompositeImage.php?layers=EITEIT195,LAS0C20WL&timestamps=1041724800,1041725160&zoomLevel=13

//Process query string
try {
	$layers = explode(",", $_GET['layers']);

	if ((sizeOf($layers) > 3) || (strlen($_GET['layers']) == 0)) {
		throw new Exception("Error: Invalid layer choices! You must specify 1-3 command-separate layernames.");
	}
	
	$timestamps = explode(",", $_GET['timestamps']);
	if ((sizeOf($timestamps) != sizeOf($layers)) || (strlen($_GET['layers']) == 0)) {
		throw new Exception("Error: Incorrect number of timestamps specified!");
	}
	
	$zoomLevel = $_GET['zoomLevel'];
	$edges = $_GET['edgeDetect'];
}
catch(Exception $e) {
	echo 'Error: ' .$e->getMessage();
	exit();
}

//Create and display composite image
$img = new CompositeImage($layers, $timestamps, $zoomLevel, $edges);
$img->printImage();
?>
