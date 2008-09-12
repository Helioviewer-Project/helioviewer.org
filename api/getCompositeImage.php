<?php
require('classes/CompositeImage.php');

//Passing timestamps from JavaScript:
// var d = new Date(Date.UTC(2003, 9, 5));
// escape(d.toISOString().slice(1,-1));
// "2003-10-05T00%3A00%3A00Z"

//Example queries: http://localhost/hv/api/getCompositeImage.php?layers=EITEIT171&timestamps=2003-10-05T00%3A00%3A00Z
// http://localhost/hv/api/getCompositeImage.php?layers=EITEIT195,LAS0C20WL&timestamps=2003-01-05T00%3A00%3A00Z,2003-01-05T00%3A06%3A00Z


//Configuration
$root = '/var/www/hv/tiles/';

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
