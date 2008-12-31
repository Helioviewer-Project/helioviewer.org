<?php
	//error_reporting(0);
	require('lib/helioviewer/Tile.php');
	
	$tile = new Tile($_GET['imageId'], $_GET['zoom'], $_GET['x'], $_GET['y'], $_GET['ts']);
	$tile->display();
	exit();
?>
