#!/usr/bin/php
<?php
    /**
     * TODO 02/03/2010: Since cache directory creation is now done primarily during the
     * getClosestImage request, when precaching we must create cache directories as needed:
     *  
     *      if (!file_exists($filepath)) {
     *          mkdir($filepath, 0777, true);
     *          chmod($filepath, 0777);
     *      }
     *       
     * (It may be useful to limit amount of checks by doing once per directory, rather than once
     *  per tile)
     *  
     *  Note: Make sure /cache directory and it's children have proper ownship (e.g. user:www-data).
     */
	require_once('../../settings/Config.php');
	require('../../api/lib/helioviewer/Tile.php');
	$id      = $argv[1];
	$zoom    = $argv[2];
	$x       = $argv[3];
	$y       = $argv[4];
	$ts      = 512;
	$display = false;

	$trash = new Tile($id, $zoom, $x, $y, $ts, $display);
?>

