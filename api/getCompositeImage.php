<?php
require('classes/CompositeImage.php');

//Passing timestamps from JavaScript:
// var d = new Date(Date.UTC(2003, 9, 5));
// var unix_ts = d.getTime() * 1000;

//Example queries: http://localhost/hv/api/getCompositeImage.php?layers=EITEIT171&timestamps=1041728400&zoomLevel=10
// http://localhost/hv/api/getCompositeImage.php?layers=EITEIT195,LAS0C20WL&timestamps=1041724800,1041725160&zoomLevel=13&focus=viewport&xRange=-2,2&yRange=-1,1&edges=false

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
	
	// Full sun or viewport only?
	$focus = $_GET['focus'];
	
	if ($focus == "viewport") {
		$x = explode(",", $_GET['xRange']);
		$y = explode(",", $_GET['yRange']);
		
		$xRange = array();
		$xRange['start'] = $x[0]; 
		$xRange['end'] = $x[1];
		
		$yRange = array();
		$yRange['start'] = $y[0]; 
		$yRange['end'] = $y[1];
	}
	
	$zoomLevel = $_GET['zoomLevel'];
	$edges =     $_GET['edgeDetect'];
	$sharpen =   $_GET['sharpen'];
}
catch(Exception $e) {
	echo 'Error: ' .$e->getMessage();
	exit();
}

//Create and display composite image
$img = new CompositeImage($layers, $timestamps, $zoomLevel, $edges, $sharpen, $focus, $xRange, $yRange);
$img->printImage();
?>
