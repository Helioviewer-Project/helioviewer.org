<?php
	require('lib/helioviewer/DbConnection.php');
	require('lib/helioviewer/Tile.php');
	
	$tile = new Tile(new DbConnection());
	$tile->display($_GET['imageId'], $_GET['zoom'], $_GET['x'], $_GET['y'], $_GET['ts']);
?>
