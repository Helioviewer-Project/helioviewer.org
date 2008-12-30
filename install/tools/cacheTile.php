#!/usr/bin/php
<?php
	// Note: Make sure /cache directory and it's children have proper ownship (e.g. user:www-data).
	require('../../api/lib/helioviewer/Tile.php');
	$id   = $argv[1];
	$zoom = $argv[2];
	$x    = $argv[3];
	$y    = $argv[4];
	$ts   = 512;
	
	$trash = new Tile($id, $zoom, $x, $y, $ts, true);	
?>

