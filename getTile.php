<?php
	require('phpClasses/autoload.php');

	$dbConnection = new DbConnection();
	$imgIndex =     new ImgIndex($dbConnection);
	$tileStore =    new TileStore($dbConnection);
	
	$request = $_GET['request'];
	

	
	if ($request == "filename") {
		$tileStore->outputTileURI($_GET['imageId'], $_GET['zoom'], $_GET['x'], $_GET['y']);
	}
		
	else
		$tileStore->outputTile($_GET['imageId'], $_GET['detector'], $_GET['zoom'], $_GET['x'], $_GET['y']);
?>