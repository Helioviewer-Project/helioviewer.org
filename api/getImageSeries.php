<?php
require('lib/helioviewer/ImageSeries.php');
set_time_limit(180);
$maxFrames = 150;
$tmp_root_dir =			"/var/www/hv/tmp";
$tmp_root_url =         "http://localhost/hv/tmp";
$kdu_merge_bin =		"/usr/bin/kdu_merge";
$web_root_dir =			"/var/www/hv";
$web_root_dir_regex =	"/\/var\/www\/hv/";
$web_root_url =			"http://localhost/hv";
$web_root_url_regex =	"/http:\/\/localhost\/hv/";

//Example Queries:
//	http://localhost/hv/api/getImageSeries.php?layers=SOHEITEIT195&startDate=1065312000&zoomLevel=10&numFrames=100
//	http://localhost/hv/api/getImageSeries.php?layers=SOHEITEIT171,SOHOLAS0C20WL&startDate=1041724800&zoomLevel=13&numFrames=15&frameRate=10&action=quickMovie

//Process query string
try {
	$action    = $_GET['action'];
}
catch(Exception $e) {
	echo 'Error: ' .$e->getMessage();
	exit();
}

// Quick-Movie
if ($action == "quickMovie") {
	// Parameters
	$startDate = $_GET['startDate'];
	$zoomLevel = $_GET['zoomLevel'];
	$numFrames = $_GET['numFrames'];
	$frameRate = $_GET['frameRate'];
	
	$xRange    = $_GET['xRange'];
	$yRange    = $_GET['yRange'];

	$hqFormat  = $_GET['format'];
	
	// Optional arguments
	$options = array();
	$options['enhanceEdges'] = $_GET['edges'] || false;
	$options['sharpen']      = $_GET['sharpen'] || false;	

	//Check to make sure values are acceptable
	try {
		$layers = explode(",", $_GET['layers']);

		//Limit number of layers to three
		if ((sizeOf($layers) > 3) || (strlen($_GET['layers']) == 0)) {
			throw new Exception("Invalid layer choices! You must specify 1-3 command-separate layernames.");
		}

		//Limit number of frames to 100
		if (($numFrames < 10) || ($numFrames > $maxFrames)) {
			throw new Exception("Invalid number of frames. Number of frames should be at least 10 and no more than $maxFrames.");
		}

		$imgSeries = new ImageSeries($layers, $startDate, $zoomLevel, $numFrames, $frameRate, $hqFormat, $xRange, $yRange, $options);
		$imgSeries->quickMovie();

	} catch(Exception $e) {
		echo 'Error: ' .$e->getMessage();
		exit();
	}
}

// Play Movie
else if ($action == "play") {
	$url = $_GET['url'];
	$hqFormat  = $_GET['format'];
	showMovie($url , $hqFormat, 512, 512);
}

// Create a JP2 Image Series
else if ($action == "createJP2ImageSeries") {
	require('lib/helioviewer/ImgIndex.php');
	//date_default_timezone_set('UTC');

	$startTime = $_GET['startTime'];
	$endTime   = $_GET['endTime'];
	$cadence   = $_GET['cadence'];

	// Layer information
	foreach(array('observatory', 'instrument', 'detector', 'measurement') as $field) {
	  $src["$field.abbreviation"] = $_GET[$field];
	}

	// Connect to database
	$dbConnection =  new DbConnection();
	$imgIndex =      new ImgIndex($dbConnection);

	// Determine number of frames to grab
	$timeInSecs = $endTime - $startTime;
	$numFrames = min($maxFrames, ceil($timeInSecs / $cadence));

	// Convert timestamp to a PHP DateTime (See http://us2.php.net/manual/en/function.date-create.php)
	//$dt = new DateTime("@$startTime");
	//echo $dt->format("U");
	//date_add($dt, new DateInterval("T" . $cadence . "S"));

	$time = $startTime;

	$images = array();

	// Get nearest JP2 images to each time-step
	for ($i = 0; $i < $numFrames; $i++) {
		$url = $imgIndex->getJP2URL($time, $src);
		$url = preg_replace($web_root_url_regex, $web_root_dir, $url);
		array_push($images, $url);
		$time += $cadence;
	}

	// Merge
	$cmd = $kdu_merge_bin . " -i ";
	foreach($images as $url) {
		$cmd .= "$url,";
	}

	// Make a temporary directory
	$now = time();
	$tmpdir = $tmp_root_dir . "/$now/";
	mkdir($tmpdir);

	$tmpurl = $tmp_root_url . "/$now/" . "jhv_image_series.jp2";

	echo "tmpurl = $tmpurl<br><br>";

	$output_file = "$tmpdir" . "jhv_image_series.jp2";

	echo "outputfile = $output_file<br><br>";

	$cmd = substr($cmd, 0, -1);
	$cmd .= " -o $output_file";

	exec($cmd, $output, $return);

	// display url if query was successful
	if ($return == "0") {
		//$output_file = preg_replace($web_root_dir_regex, $web_root_url, $output_file);
		//echo $output_file;
		echo $tmpurl;
	}
}

	/**
	 * showMovie
	 */
	function showMovie($url, $hqFormat, $width, $height) {
	$urlHQ = substr($url, 0, -3) . $hqFormat;
	?>
		<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
		<html>
		<head>
			<title>Helioviewer.org QuickMovie</title>
		</head>
		<body style="background-color: #000, color: #FFF">
			<!-- MC Media Player -->
			<div style="text-align: center;">
				<script type="text/javascript">
					playerFile = "http://www.mcmediaplayer.com/public/mcmp_0.8.swf";
					fpFileURL = "<?php print $url?>";
					fpButtonSize = "48x48";
					fpAction = "play";
					cpHidePanel = "mouseout";
					cpHideDelay = "1";
					defaultEndAction = "repeat";
					playerSize = "<?php print $width . 'x' . $height?>";
				</script>
				<script type="text/javascript" src="http://www.mcmediaplayer.com/public/mcmp_0.8.js"></script>
				<!-- / MC Media Player -->
			</div>
			<br>
			<div style="text-align: center;">
				<a href="<?php print $urlHQ;?>" style="text-decoration: none; color: white; font-weight: bold;">High-quality download.</a>
			</div>
		</body>
		</html>
	<?php
	}

?>
