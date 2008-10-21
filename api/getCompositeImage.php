<?php
/**
 * Helioviewer.org Composite Image builder API
 * By Keith Hughitt
 * September 2008
 * 
 * Example usage:
 * 		http://localhost/hv/api/getCompositeImage.php?layers=SOHOEITEIT195&timestamps=1065312000&zoomLevel=10&focus=full
 * 		http://localhost/hv/api/getCompositeImage.php?layers=SOHOEITEIT195,SOHOLAS0C20WL&timestamps=1065312000,1065312360&zoomLevel=13&focus=viewport&xRange=-1,0&yRange=-1,0&edges=false
 * 
 * Notes:
 * 		Building a UTC timestamp in javascript
 * 			var d = new Date(Date.UTC(2003, 9, 5));
 * 			var unix_ts = d.getTime() * 1000;
 * 
 * 		TODO
 * 			If no params are passed, print out API usage description (and possibly a query builder form)...
 * 			Add support for fuzzy timestamp matching. Could default to exact matching unless user specifically requests fuzzy date-matching.
 */
require('lib/helioviewer/CompositeImage.php');

	//Process query string
	try {
		$layers = explode(",", $_GET['layers']);
	
		// Limit to 3 layers
		if ((sizeOf($layers) > 3) || (strlen($_GET['layers']) == 0)) {
			throw new Exception("Error: Invalid layer choices! You must specify 1-3 command-separate layernames.");
		}
		
		// Extract timestamps
		$timestamps = explode(",", $_GET['timestamps']);
		if ((sizeOf($timestamps) != sizeOf($layers)) || (strlen($_GET['layers']) == 0)) {
			throw new Exception("Error: Incorrect number of timestamps specified!");
		}
	
		// Full sun or viewport only?
		if (!$focus = $_GET['focus'])
			$focus = "full";
	
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
