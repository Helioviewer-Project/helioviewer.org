<?php
/**
 * @class API
 * @author Keith Hughitt
 */
require_once('DbConnection.php');

class API {

	/**
	 * @constructor
	 */
	public function __construct ($params, $format) {
		$this->params = $params;
		$this->format = $format;
		
		$_SERVER['HTTP_HOST'] == "localhost" ? require_once('Config.php') : require_once('Config.Server.php');
		
		try {
			if (!$this->validate($params["action"]))
				throw new Exception("Invalid parameters specified for <a href='http://www.helioviewer.org/api/index.php#" . $params['action'] . "'>" . $params['action'] . "</a>.");

			if (!call_user_func(array("API" ,"_" . $params["action"])))
				throw new Exception("Unable to execute " . $params["action"] . ". Please make sure you are using valid input and contact the web-admin if problems persist.");

		} catch (Exception $e) {
			echo "<br><b>Error:</b> ", $e->getMessage(), "<br>";
		}
		
		exit();
	}
	
	/**
	 * getTile
	 * @return 
	 */
	private function _getTile () {
		require_once('lib/helioviewer/Tile.php');
		$tile = new Tile($this->params['imageId'], $this->params['zoom'], $this->params['x'], $this->params['y'], $this->params['ts']);
		$tile->display();
		
		return 1;
	}
	
	/**
	 * getClosestImage
	 */
	private function _getClosestImage () {
		require_once('ImgIndex.php');
		$imgIndex = new ImgIndex(new DbConnection());
		
		$queryForField = 'abbreviation';
		foreach(array('observatory', 'instrument', 'detector', 'measurement') as $field) {
			$src["$field.$queryForField"] = $this->params[$field];
		}
		
		$result = $imgIndex->getClosestImage($this->params['timestamp'], $src);
		
		if ($this->format == "json") {
			header('Content-type: application/json');
			echo json_encode($result);
		} else {
			echo json_encode($result);
		}
		
		return 1;
	}
	
	/**
	 * getViewerImage (aka "getCompositeImage")
	 *
	 * Example usage:
	 * 		http://helioviewer.org/api/index.php?action=getViewerImage&layers=SOHEITEIT195&timestamps=1065312000&zoomLevel=10&tileSize=512&xRange=-1,0&yRange=-1,0
	 * 		http://helioviewer.org/api/index.php?action=getViewerImage&layers=SOHEITEIT195,SOHLAS0C20WL&timestamps=1065312000,1065312360&zoomLevel=13&tileSize=512&xRange=-1,0&yRange=-1,0&edges=false
	 * 
	 * Notes:
	 * 		Building a UTC timestamp in javascript
	 * 			var d = new Date(Date.UTC(2003, 9, 5));
	 * 			var unix_ts = d.getTime() * 1000;
	 * 
	 * 		TODO
	 * 			* If no params are passed, print out API usage description (and possibly a query builder form)...
	 * 			* Add support for fuzzy timestamp matching. Could default to exact matching unless user specifically requests fuzzy date-matching.
	 *          * Separate out layer details into a Layer PHP class?
	 */
	private function _getViewerImage () {
		require('lib/helioviewer/CompositeImage.php');
	
		//Process query string
		try {
			// Extract timestamps
			$timestamps = explode(",", $this->params['timestamps']);
			if (strlen($this->params['timestamps']) == 0) {
				throw new Exception("Error: Incorrect number of timestamps specified!");
			}
			
			// Region of interest
			$x = explode(",", $this->params['xRange']);
			$y = explode(",", $this->params['yRange']);
		
			$xRange = array();
			$xRange['start'] = $x[0];
			$xRange['end']   = $x[1];
	
			$yRange = array();
			$yRange['start'] = $y[0];
			$yRange['end']   = $y[1];
		
			// Zoom-level & tilesize
			$zoomLevel = $this->params['zoomLevel'];
			$tileSize  = $this->params['tileSize'];
			
			// Construct layers
			$layers = array();
			$i = 0;
			foreach (explode(",", $this->params['layers']) as $layer) {
				array_push($layers, new Layer($layer, $timestamps[$i], $timestamps[$i], $zoomLevel, $xRange, $yRange, $tileSize));
				$i++;
			}
			
			// Limit to 3 layers
			if ((sizeOf($layers) > 3) || (strlen($this->params['layers']) == 0)) {
				throw new Exception("Error: Invalid layer choices! You must specify 1-3 command-separate layernames.");
			}
		
			// Optional parameters
			$options = array();
			$options["edgeEnhance"] = $this->params['edges'];
			$options["sharpen"]     = $this->params['sharpen'];
		}
		catch(Exception $e) {
			echo 'Error: ' .$e->getMessage();
			exit();
		}
		
		//Create and display composite image
		$img = new CompositeImage($layers, $zoomLevel, $xRange, $yRange, $options);
		$img->printImage();
		
		return 1;
	}
	
	/**
	 * getJP2
	 */
	private function _getJP2 () {
		require('lib/helioviewer/ImgIndex.php');
		$imgIndex = new ImgIndex(new DbConnection());
		
		$queryForField = 'abbreviation';
		foreach(array('observatory', 'instrument', 'detector', 'measurement') as $field) {
			$src["$field.$queryForField"] = $_GET[$field];
		}
		
		$filepath = $imgIndex->getJP2Location($this->params['timestamp'], $src);
		$filename = end(explode("/", $filepath));
		
		$fp = fopen($filepath, 'r');
		
		header("Content-Length: " . filesize($filepath));
		header("Content-Type: "   . image_type_to_mime_type(IMAGETYPE_JP2));		
		header("Content-Disposition: attachment; filename=\"$filename\"");
		
		$contents = fread($fp, filesize($filepath));
		
		echo $contents;
 		fclose($fp);
		
		return 1;
	}
	
	/**
	 * getJP2ImageSeries
	 * @return 
	 */
	private function _getJP2ImageSeries () {
		require_once('ImgIndex.php');
		//date_default_timezone_set('UTC');
	
		$startTime = $this->params['startTime'];
		$endTime   = $this->params['endTime'];
		$cadence   = $this->params['cadence'];
	
		// Layer information
		foreach(array('observatory', 'instrument', 'detector', 'measurement') as $field) {
		  $src["$field.abbreviation"] = $this->params[$field];
		}
	
		// Connect to database
		$imgIndex = new ImgIndex(new DbConnection());
	
		// Determine number of frames to grab
		$timeInSecs = $endTime - $startTime;
		$numFrames  = min(Config::MAX_MOVIE_FRAMES, ceil($timeInSecs / $cadence));
	
		// Convert timestamp to a PHP DateTime (See http://us2.php.net/manual/en/function.date-create.php)
		//$dt = new DateTime("@$startTime");
		//echo $dt->format("U");
		//date_add($dt, new DateInterval("T" . $cadence . "S"));
	
		$time = $startTime;
	
		$images = array();
	
		// Get nearest JP2 images to each time-step
		for ($i = 0; $i < $numFrames; $i++) {
			$jp2 = $imgIndex->getJP2Location($time, $src);
			//$url = preg_replace($this->web_root_url_regex, $this->web_root_dir, $url);
			array_push($images, $jp2);
			$time += $cadence;
		}
	
		// Append filepaths to kdu_merge command
		$cmd = Config::KDU_MERGE_BIN . " -i ";
		foreach($images as $jp2) {
			$cmd .= "$jp2,";
		}
		
		// Drop trailing comma
		$cmd = substr($cmd, 0, -1);
	
		// Create a temporary directory to store image-series
		$now = time();
		$tmpdir = Config::TMP_ROOT_DIR . "/jp2-image-series/";
		if (!file_exists($tmpdir)) {
			mkdir($tmpdir);
			chmod($tmpdir, 0777);
		}
			
		$tmpdir .= "/$now/";
		if (!file_exists($tmpdir)) {
			mkdir($tmpdir);
			chmod($tmpdir, 0777);
		}
	
		$tmpurl = Config::TMP_ROOT_URL . "/jp2-image-series/$now/" . "jhv_image_series.jp2";
	
		$output_file = "$tmpdir" . "jhv_image_series.jp2";
	
		// Execute kdu_merge command
		$cmd .= " -o $output_file";
		exec('export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:' . Config::KDU_LIBS_DIR . "; " . escapeshellcmd($cmd), $output, $return);
		
		echo $tmpurl;
		
		return 1;
	}
	
	/**
	 * getJP2Header
	 * @return 
	 * NOTE: Add option to specify XML vs. JSON... FITS vs. Entire header?
	 */
	private function _getJP2Header () {
		$id = $this->params["imageId"];
		
		$db  = new DbConnection();
		$sql = sprintf("SELECT uri FROM image WHERE id=%s;", mysqli_real_escape_string($db->link, $id));
		
		$row = mysqli_fetch_array($db->query($sql), MYSQL_ASSOC);
		$url = $row['uri'];
		
		// Query header information using Exiftool
		$cmd = "exiftool $url | grep Fits | grep -v Descr";
		exec($cmd, $out, $ret);
		
		$fits = array();
		foreach ($out as $index => $line) {
			$data = explode(":", $line);
			$param = substr(strtoupper(str_replace(" ", "", $data[0])), 4);
			$value = $data[1];
			array_push($fits, $param . ": " . $value);
		}
		
		if ($this->format == "json") {
			header('Content-type: application/json');
			echo json_encode($fits);
		}
		else {
			echo json_encode($fits);
		}
		
		return 1;
	}
	
	/**
	 * getEventCatalogs
	 * @return 
	 */
	private function _getEventCatalogs () {
		header("Content-type: application/json");
		$url = "http://washington.tm.uni-karlsruhe.de:8080/Dispatcher/resources/eventCatalogs?" . $_SERVER['QUERY_STRING'];
		echo file_get_contents($url);
		
		return 1;
	}
	
	/**
	 * getEvents
	 */
	private function _getEvents () {
		header("Content-type: application/json");
		$url = "http://washington.tm.uni-karlsruhe.de:8080/Dispatcher/resources/eventCatalogs?" . $_SERVER['QUERY_STRING'];
		echo file_get_contents($url);
		
		return 1;
	}
	
	/**
	 * buildMovie
	 * @return 
	 */
	private function _buildQuickMovie () {
		require_once('ImageSeries.php');
		
		// Required parameters
		$startDate = $this->params['startDate'];
		$zoomLevel = $this->params['zoomLevel'];
		$numFrames = $this->params['numFrames'];
		$frameRate = $this->params['frameRate'];
		
		$xRange    = $this->params['xRange'];
		$yRange    = $this->params['yRange'];
	
		$hqFormat  = $this->params['format'];
		
		// Optional parameters
		$options = array();
		$options['enhanceEdges'] = $this->params['edges'] || false;
		$options['sharpen']      = $this->params['sharpen'] || false;	
	
		//Check to make sure values are acceptable
		try {
			$layers = explode(",", $this->params['layers']);
	
			//Limit number of layers to three
			if ((sizeOf($layers) > 3) || (strlen($this->params['layers']) == 0)) {
				throw new Exception("Invalid layer choices! You must specify 1-3 command-separate layernames.");
			}
	
			//Limit number of frames to 100
			if (($numFrames < 10) || ($numFrames > Config::MAX_MOVIE_FRAMES)) {
				throw new Exception("Invalid number of frames. Number of frames should be at least 10 and no more than $maxFrames.");
			}
	
			$imgSeries = new ImageSeries($layers, $startDate, $zoomLevel, $numFrames, $frameRate, $hqFormat, $xRange, $yRange, $options);
			$imgSeries->quickMovie();
	
		} catch(Exception $e) {
			echo 'Error: ' .$e->getMessage();
			exit();
		}
		
		return 1;
	}
	
	/**
	 * playMovie
	 * @return 
	 */
	private function _playMovie () {
		$url = $this->params['url'];
		$hqFormat  = $this->params['format'];
		$width  = 512;
		$height = 512;
		
		$highQualityVersion = substr($url, 0, -3) . $hqFormat;
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
					<a href="<?php print $highQualityVersion;?>" style="text-decoration: none; color: white; font-weight: bold;">High-quality download.</a>
				</div>
			</body>
			</html>
		<?php
		return 1;
	}
	/**
	 * getLayerAvailability (Internal use)
	 */
	private function _getLayerAvailability () {
		$dbConnection = new DbConnection();
	
		// Layer parameters
		$obs  = mysqli_real_escape_string($dbConnection->link, $this->params['observatory']);
		$inst = mysqli_real_escape_string($dbConnection->link, $this->params['instrument']);
		$det  = mysqli_real_escape_string($dbConnection->link, $this->params['detector']);
		$meas = mysqli_real_escape_string($dbConnection->link, $this->params['measurement']);

		// Validate new combinations (Note: measurement changes are always valid)
		if (isset($this->params['changed'])) {
			$changed  = mysqli_real_escape_string($dbConnection->link, $this->params['changed']);
			$newValue = mysqli_real_escape_string($dbConnection->link, $this->params['value']);
	
			// If query returns any matches then the new combination is valid
			$query = sprintf("SELECT count(*) as count from observatory 
								INNER JOIN instrument ON observatory.id = instrument.observatoryId
								INNER JOIN detector ON detector.instrumentId = instrument.id
					  			INNER JOIN measurement ON measurement.detectorId = detector.id
								WHERE
								observatory.abbreviation = '%s' AND instrument.abbreviation = '%s' and detector.abbreviation='%s' and measurement.abbreviation = '%s';",
								$obs, $inst, $det, $meas);
	
			$result = $dbConnection->query($query);
			$row = mysqli_fetch_array($result, MYSQL_ASSOC);
			$valid = $row['count'];
	
			//If combination is invalid, adjust options to provide a valid combination
			if (!$valid) {
				//CASE 1: Observatory changed
	
				//CASE 2: Instrument changefirst grab a list of valid detectors for the chosen instrumentd
				if ($changed == "instrument") {
					//Find a valid detector for the chosen instrument
					$query = sprintf("SELECT detector.abbreviation from detector INNER JOIN instrument ON instrument.id = detector.instrumentId 
									  WHERE instrument.abbreviation = '%s' LIMIT 1;", $newValue);
					$result = $dbConnection->query($query);
					$row = mysqli_fetch_array($result, MYSQL_ASSOC);
					$det = $row['abbreviation'];
	
					//Measurements will be automatically updated...
				}
	
				//CASE 3: Detector changed
	
				//CASE 4: Measurement change
				//Do nothing
			}
		}
		
		/**
		 *
		 * @return Array Allowed values for given field
		 * @param $db Object MySQL Database connection
		 * @param $f1 String Field Objectof interest
		 * @param $f2 String Limiting field
		 * @param $limit String Limiting field value
		 *
		 * Queries one field based on a limit in another. Performs queries of the sort
		 * "Give me all instruments where observatory equals SOHO."
		 */
		function queryField($db, $f1, $f2, $f1_value) {
			$values = array();
			$query = "SELECT $f2.name, $f2.abbreviation from $f2 INNER JOIN $f1 ON $f1.id = $f2.$f1" . "Id" . " WHERE $f1.abbreviation = '$f1_value';";
	
			if ($_GET['format'] == "plaintext")
				echo "<strong>query:</strong><br>$query<br><br>";
	
			$result = $db->query($query);
			while ($row = mysqli_fetch_array($result, MYSQL_ASSOC)) {
				array_push($values, $row);
			}
	
			return $values;
		}
	
		// Determine appropriate options to display given the current combination of layer parameters
		$options = array(
			"observatories" => array(array("name" => "SOHO", "abbreviation" => "SOH")),
			"instruments" =>   queryField($dbConnection, "observatory", "instrument", $obs),
			"detectors" =>     queryField($dbConnection, "instrument", "detector", $inst),
			"measurements" =>  queryField($dbConnection, "detector", "measurement", $det)
		);
		
		//Output results
		if ($this->format == "json")
			header("Content-type: application/json");

		echo json_encode($options);
		return 1;
	}
	
	/**
	 * validate
	 * 
	 * Action-specific code for validating input. Currently only input for external-use API's are
	 * validated. All input destined for database use is secured at time of SQL construction. 
	 */
	private function validate ($action) {
		// Some useful regexes
		$layer_regex            = "/^[a-zA-Z0-9]{12}$/";
		$layer_list_regex       = "/^[a-zA-Z0-9]{12}(,[a-zA-Z0-9]{12})*$/";
		$timestamp_regex        = "/^[0-9]{1,10}$/";
		$timestamp_list_regex   = "/^[0-9]{1,10}(,[0-9]{1,10})*$/";
		$coordinate_range_regex = "/^[0-9]{1,2},[0-9]{1,2}$/";
		
		switch ($action) {
			case "getTile":
				break;
			case "getClosestImage":
				break;
			case "getViewerImage":
				if (!isset($this->params["layers"]) or !preg_match($layer_list_regex, $this->params["layers"]))
					return false;
				if (!isset($this->params["timestamps"]) or !preg_match($timestamp_list_regex, $this->params["timestamps"]))
					return false;
				if (!isset($this->params["zoomLevel"]) or !is_numeric($this->params["zoomLevel"]) or $this->params["zoomLevel"] < 0 or $this->params["zoomLevel"] > 20)
					return false;
				if (!isset($this->params["xRange"]))
					return false;
				if (!isset($this->params["yRange"]))
					return false;				
				break;
				
			case "getJP2Header":
				if (!isset($this->params["imageId"]) or !is_numeric($this->params["imageId"]))
					return false;
				break;
			case "getEventCatalogs":
				break;
			case "getEvents":
				break;
			case "getLayerAvailability":
				break;
			default:
				throw new Exception("Invalid action specified. See the <a href='http://www.helioviewer.org/api/'>API Documentation</a> for a list of valid actions.");		
		}
		
		return true;
	}
}
?>
