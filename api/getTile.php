<?php
	require('lib/helioviewer/DbConnection.php');
	require('lib/helioviewer/TileStore.php');

	$tileStore = new TileStore(new DbConnection());
	#$tileStore->outputTile($_GET['imageId'], $_GET['zoom'], $_GET['x'], $_GET['y']);
	$tileStore->outputTile($_GET['imageId'], $_GET['zoom'], $_GET['x'], $_GET['y'], $_GET['ts']);
?>
