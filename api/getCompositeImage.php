<?php
/**
 * Helioviewer.org Composite Image builder API
 * By Keith Hughitt
 * September 2008
 * 
 * Example usage:
 * 		http://localhost/hv/api/getCompositeImage.php?layers=SOHEITEIT195&timestamps=1065312000&zoomLevel=10&tileSize=512&xRange=-1,0&yRange=-1,0
 * 		http://localhost/hv/api/getCompositeImage.php?layers=SOHEITEIT195,SOHLAS0C20WL&timestamps=1065312000,1065312360&zoomLevel=13&tileSize=512&xRange=-1,0&yRange=-1,0&edges=false
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
require('lib/helioviewer/Layer.php');
require('lib/helioviewer/CompositeImage.php');

	//Process query string
	try {
		// Extract timestamps
		$timestamps = explode(",", $_GET['timestamps']);
		if (strlen($_GET['timestamps']) == 0) {
			throw new Exception("Error: Incorrect number of timestamps specified!");
		}
		
		// Region of interest
		$x = explode(",", $_GET['xRange']);
		$y = explode(",", $_GET['yRange']);
	
		$xRange = array();
		$xRange['start'] = $x[0];
		$xRange['end']   = $x[1];

		$yRange = array();
		$yRange['start'] = $y[0];
		$yRange['end']   = $y[1];
	
		// Zoom-level & tilesize
		$zoomLevel = $_GET['zoomLevel'];
		$tileSize  = $_GET['tileSize'];
		
		// Construct layers
		$layers = array();
		$i = 0;
		foreach (explode(",", $_GET['layers']) as $layer) {
			array_push($layers, new Layer($layer, $timestamps[$i], $timestamps[$i], $zoomLevel, $xRange, $yRange, $tileSize));
			$i++;
		}
		
		// Limit to 3 layers
		if ((sizeOf($layers) > 3) || (strlen($_GET['layers']) == 0)) {
			throw new Exception("Error: Invalid layer choices! You must specify 1-3 command-separate layernames.");
		}
	
		// Optional parameters
		$options = array();
		$options["edgeEnhance"] = $_GET['edges'];
		$options["sharpen"]     = $_GET['sharpen'];
	}
	catch(Exception $e) {
		echo 'Error: ' .$e->getMessage();
		exit();
	}
	
	//Create and display composite image
	$img = new CompositeImage($layers, $zoomLevel, $xRange, $yRange, $options);
	$img->printImage();
?>
