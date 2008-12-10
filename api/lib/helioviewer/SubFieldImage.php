<?php
/**
 * @class SubFieldImage - A simple class to keep track of a specific layer's associated parameters.
 */
require('JP2Image.php');

class SubFieldImage extends JP2Image {
	private $observatory;
	private $instrument;
	private $detector;
	private $measurement;
	private $opacity;
	private $timestamp;
	
	public function __construct($params, $timestamp, $zoomLevel, $xRange, $yRange, $tileSize, $correlate = NULL) {
		parent::__construct($zoomLevel, $xRange, $yRange, $tileSize);

		$this->observatory   = substr($params, 0, 3);
		$this->instrument    = substr($params, 3, 3);
		$this->detector      = substr($params, 6,3);
		$this->measurement   = substr($params, 9,3);
		$this->opacity       = 100;
		$this->unixTimestamp = $timestamp;
		$this->timestamp     = $this->parseTimestamp($timestamp);
		
		//$this->timestamps  = $this->buildTimestampsArray($startTime, $endTime);
		$this->buildImage();
	}
	
	public function observatory() {
		return $this->observatory;
	}
	
	public function instrument() {
		return $this->instrument;
	}
	
	public function detector() {
		return $this->detector;
	}
	
	public function measurement() {
		return $this->measurement;
	}
	
	public function opacity() {
		return $this->opacity;
	}
	
	private function buildImage () {		
		// Retrieve meta-information
		$imageInfo = $this->getMetaInfo();

		// Filepaths (For .tif and .png images)
		$jp2  = $this->getFilePath("input");
		$tif = $this->getFilePath("output");

		// If tile already exists in cache, use it
		//if (file_exists($png)) {
		//	$this->image = new Imagick($png);
		//	$this->display();
		//	exit();
		//}
		
		// kdu_expand command
		$im = $this->extractRegion($jp2, $tif, $imageInfo["width"], $imageInfo["height"], $imageInfo['imgScaleX'], $this->detector, $this->measurement);
		//echo $im;
		//exit();
		
		// Store image
		$this->image = $im;
		
		$this->display();
		
		//$this->dimensions  = $this->getImageDimensions();
		
		// extractRegion($input, $output, $imageWidth, $imageHeight, $imageScale, $colorTable = Null)
		
		// Ratio of the desired scale to the actual JP2 image scale
		//$desiredToActual = $this->desiredScale / $scale;
		
		// Number of tiles in scaled image
		//$imgNumTilesX = ceil($width  / ($desiredToActual * $ts));
		//$imgNumTilesY = ceil($height / ($desiredToActual * $ts));
		
		//print $imgNumTilesX . "<br>";
		//print $imgNumTilesY . "<br>";
		
		// Valid number of tiles for movie
		//$numTilesX = min($imgNumTilesX, $this->xRange["end"] - $this->xRange["start"] + 1);
		//$numTilesY = min($imgNumTilesY, $this->yRange["end"] - $this->yRange["start"] + 1);
		
		//print "numTilesX: $numTilesX<br>";
		//print "numTilesY: $numTilesY<br>";
		
		// Movie (ROI) Dimensions
		//$dimensions = array();
		//$dimensions['width']  = $ts * $numTilesX;
		//$dimensions['height'] = $ts * $numTilesY;
		//$dimensions['x'] = (1/2) * ($width  - $dimensions['width']);
		//$dimensions['y'] = (1/2) * ($height - $dimensions['height']);
	}
	
	/**
	 * buildTimestampsArray
	 * @return 
	 * @param $start Object
	 * @param $end Object
	 */
	private function buildTimestampsArray($startTime, $endTime) {
		$timestamps = array();
		
		// Case 1: A single image
		if ($startTime == $endTime) {
			array_push($timestamps, $startTime);
		}
		
		// Case 2: A image series / movie
		else {
			
		}
		
		return $timestamps;
	}
	
	/**
	 * @function
	 * @description Determine the dimensions for the layer
	 * @return 
	 */
	private function getMetaInfo() {
		// Layer parameters
		$obs  = $this->observatory;
		$inst = $this->instrument;
		$det  = $this->detector;
		$meas = $this->measurement;
		
		// Get full image dimensions
		$sql = "SELECT width, height, imgScaleX 
					FROM image
						LEFT JOIN measurement on measurementId = measurement.id
						LEFT JOIN measurementType on measurementTypeId = measurementType.id
						LEFT JOIN detector on detectorId = detector.id
						LEFT JOIN opacityGroup on opacityGroupId = opacityGroup.id
						LEFT JOIN instrument on instrumentId = instrument.id
						LEFT JOIN observatory on observatoryId = observatory.id
	             	WHERE observatory.abbreviation='$obs' AND instrument.abbreviation='$inst' AND detector.abbreviation='$det' AND measurement.abbreviation='$meas' LIMIT 1";
					
		$result = $this->db->query($sql);
		$meta = mysql_fetch_array($result, MYSQL_ASSOC);
		
		return $meta;
	}
	
	private function parseTimestamp ($ts) {
		$d = getdate($ts);
		
		$year = $d['year'];
		$mon  = str_pad($d['mon'], 2 , "0", STR_PAD_LEFT);
		$day  = str_pad($d['mday'], 2 , "0", STR_PAD_LEFT);
		$hour = str_pad($d['hours'], 2 , "0", STR_PAD_LEFT);
		$min  = str_pad($d['minutes'], 2 , "0", STR_PAD_LEFT);
		$sec  = str_pad($d['seconds'], 2 , "0", STR_PAD_LEFT);
		
		return "$year-$mon-$day $hour:$min:$sec";
	}
	
	private function getFilePath($type) {
		// Date information
		$year  = substr($this->timestamp,0,4);
		$month = substr($this->timestamp,5,2);
		$day   = substr($this->timestamp,8,2);
		$hour  = substr($this->timestamp,11,2);
		$min   = substr($this->timestamp,14,2);
		$sec   = substr($this->timestamp,17,2);
		
		// Observation
		$obs  = $this->observatory;
		$inst = $this->instrument;
		$det  = $this->detector;
		$meas = $this->measurement;

		// JP2 File
		if ($type == "input") {
			$filepath  = $this->jp2Dir . implode("/", array($year, $month, $day, $obs, $inst, $det, $meas)) . "/";
			$filepath .= implode("_", array($year, $month, $day, $hour . $min . $sec, $obs, $inst, $det, $meas)) . ".jp2";
		}

		// Output File
		else {
			// Starting point
			$filepath = $this->cacheDir . "movies" . "/";
			if (!file_exists($filepath))
				mkdir($filepath);
	
			// Create necessary directories
			$filepath .= $year . "/";
			if (!file_exists($filepath))
				mkdir($filepath);
	
			$filepath .= $month . "/";
			if (!file_exists($filepath))
				mkdir($filepath);
	
			$filepath .= $day . "/";
			if (!file_exists($filepath))
				mkdir($filepath);
	
			// Convert coordinates to strings
			$xStartStr = "+" . str_pad($this->xRange["start"], 2, '0', STR_PAD_LEFT);
			if (substr($this->xRange["start"],0,1) == "-")
				$xStartStr = "-" . str_pad(substr($this->xRange["start"], 1), 2, '0', STR_PAD_LEFT);
	
			$yStartStr = "+" . str_pad($this->yRange["start"], 2, '0', STR_PAD_LEFT);
			if (substr($this->yRange["start"],0,1) == "-")
				$yStartStr = "-" . str_pad(substr($this->yRange["start"], 1), 2, '0', STR_PAD_LEFT);
				
			$xEndStr = "+" . str_pad($this->xRange["end"], 2, '0', STR_PAD_LEFT);
			if (substr($this->xRange["end"],0,1) == "-")
				$xEndStr = "-" . str_pad(substr($this->xRange["end"], 1), 2, '0', STR_PAD_LEFT);
	
			$yEndStr = "+" . str_pad($this->yRange["end"], 2, '0', STR_PAD_LEFT);
			if (substr($this->yRange["end"],0,1) == "-")
				$yEndStr = "-" . str_pad(substr($this->yRange["end"], 1), 2, '0', STR_PAD_LEFT);	
	
			$filepath .= implode("_", array($this->unixTimestamp, $obs, $inst, $det, $meas, $this->zoomLevel, $xStartStr, $xEndStr, $yStartStr, $yEndStr, ".tif"));
		}

		return $filepath;
	}
}
?>