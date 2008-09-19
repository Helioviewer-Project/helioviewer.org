<?php
require('classes/ImageSeries.php');
set_time_limit(180);
$maxFrames = 150;

//Example Queries:
//	http://localhost/hv/api/getImageSeries.php?layers=EITEIT195&startDate=1065312000&zoomLevel=10&numFrames=100
//	http://localhost/hv/api/getImageSeries.php?layers=EITEIT171,LAS0C20WL&startDate=1041724800&zoomLevel=13&numFrames=15&frameRate=10&action=quickMovie

//Process query string
try {
	$layers = explode(",", $_GET['layers']);
	$startDate = $_GET['startDate'];
	$zoomLevel = $_GET['zoomLevel'];
	$numFrames = $_GET['numFrames'];
	$frameRate = $_GET['frameRate'];
	$action    = $_GET['action'];

	if ($action == 'quickMovie') {
		//Limit number of layers to three
		if ((sizeOf($layers) > 3) || (strlen($_GET['layers']) == 0)) {
			throw new Exception("Invalid layer choices! You must specify 1-3 command-separate layernames.");
		}
		
		//Limit number of frames to 100
		if (($numFrames < 10) || ($numFrames > $maxFrames)) {
			throw new Exception("Invalid number of frames. Number of frames should be at least 10 and no more than $maxFrames.");
		}
	}
	
}
catch(Exception $e) {
	echo 'Error: ' .$e->getMessage();
	exit();
}


if ($action == "quickMovie") {
	$imgSeries = new ImageSeries($layers, $startDate, $zoomLevel, $numFrames, $frameRate);
	$imgSeries->quickMovie();
}
else if ($action == "play") {
	$url = $_GET['url'];
	showMovie($url, 512, 512);
}

	function showMovie($url, $width, $height) {
		echo ($url);
	?>
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
	<?php
	}

?>
