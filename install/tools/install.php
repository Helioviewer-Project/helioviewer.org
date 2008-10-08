#!/usr/bin/php
<?php
	function main() {
		setEnvVariables();
		printGreeting();
		$path = getFilePath();

		//DB Info:
		$dbname = "hv";
		$dbuser = "helioviewer";
		$dbpass = "helioviewer";

		$metafiles = traverseDirectory($path);
		echo "Found " . sizeof($metafiles) . " images.\n";
	}

	/**
	 * traverseDirectory
	 *
	 * Traverses file-tree starting with the specified path and builds a
	 * list of meta-files representing the available images
	 */
	function traverseDirectory ($path) {
		$images = array();

		foreach (scandir($path) as $child) {
			if (($child != ".") && ($child != "..")) {
				$node = $path . DIRECTORY_SEPARATOR . $child;
				if (is_dir($node)) {
					$new = traverseDirectory($node);
					$images = array_merge($images, $new);
				}
				else {
					if (substr($node, -4) == "meta")
						array_push($images, substr($node, -5));
				}
			}
		}

		return $images;
	}

	function setEnvVariables() {
		set_time_limit(0);
		ini_set('display_errors', 'On');
	}

	function getFilePath() {
		echo "Root directory: ";
		$dir = fgets(STDIN);

		return $dir;
	}

	function printGreeting() {
		echo "====================================================================\n";
		echo "= HelioViewer Database Population Script (PHP Version) 0.2         =\n";
		echo "= By: Keith Hughitt, August 14, 2008                               =\n";
		echo "=                                                                  =\n";
		echo "= This script processes raw tile images, and inserts them into a   =\n";
		echo "= database, along with their relevent information.                 =\n";
		echo "=                                                                  =\n";
		echo "= The script requires several pieces of information to function:   =\n";
		echo "=   (1) The location of a directory containing tiled images.       =\n";
		echo "=   (2) The name of the database schema to populate.               =\n";
		echo "=   (3) The name of the database user with appropriate access.     =\n";
		echo "=   (4) The password for the specified database user.              =\n";
		echo "====================================================================\n";

	}

	/*
	 * LEGACY CODE:

	$GLOBALS['cwd'] = str_replace('\\', '/', getcwd());
	$dir = ($_GET['dir'] ? $_GET['dir'] : $_SERVER['argv'][1]);
	if (!mysql_connect('localhost', 'helioviewer', 'helioviewer')) die ("error connecting to db");
	mysql_select_db('hv');

	function convertToLocalDate ($timestamp) {
		$time = date_create($timestamp);
		//$offset = date_offset_get($time);
		//$time->modify($offset . " seconds");
		return $time->format('Y-m-d H:i:s');
	}
	*/

	//Execute Program
	main();
?>
