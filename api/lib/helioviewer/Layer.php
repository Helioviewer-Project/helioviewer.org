<?php
/**
 * @class Layer - A simple class to keep track of a specific layer's associated parameters.
 */
require('DbConnection.php');

class Layer {
	private $observatory;
	private $instrument;
	private $detector;
	private $measurement;
	private $opacity;
	private $timestamps;
	private $baseScale = 2.63;
	private $baseZoom  = 10;
	
	public function __construct($params, $startTime, $endTime, $zoomLevel, $xRange, $yRange, $tileSize, $correlate = NULL) {
		$this->observatory = substr($params, 0, 3);
		$this->instrument  = substr($params, 3, 3);
		$this->detector    = substr($params, 6,3);
		$this->measurement = substr($params, 9,3);
		$this->opacity     = 100;
		$this->zoomLevel   = $zoomLevel;
		$this->tileSize    = $tileSize;
		
		$this->db          = new DbConnection();
		$this->timestamps  = $this->buildTimestampsArray($startTime, $endTime);
		$this->dimensions  = $this->getLayerDimensions($xRange, $yRange);
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
	
	public function timestamps() {
		return $this->timestamps;
	}
	
	public function nextTime() {
		return array_shift($this->timestamps);
	}
	
	public function framesLeft() {
		return sizeOf($this->timestamps);
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
	private function getLayerDimensions($xRange, $yRange) {
		$ts = $this->tileSize;
		
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
		$img = mysql_fetch_array($result, MYSQL_ASSOC);
	    $width  = $img['width'];
		$height = $img['height'];
		$scale  = $img['imgScaleX'];
		
		// Account for scaling of image
		$zoomOffset   = $this->zoomLevel - $this->baseZoom;
		$desiredScale = $this->baseScale * (pow(2, $zoomOffset));
		
		// Ratio of the desired scale to the actual JP2 image scale
		$desiredToActual = $desiredScale / $scale;
		
		// Number of tiles in scaled image
		$imgNumTilesX = ceil($width  / ($desiredToActual * $ts));
		$imgNumTilesY = ceil($height / ($desiredToActual * $ts));
		
		//print $imgNumTilesX . "<br>";
		//print $imgNumTilesY . "<br>";
		
		// Valid number of tiles for movie
		$numTilesX = min($imgNumTilesX, $xRange[1] - $xRange[2] + 1);
		$numTilesY = min($imgNumTilesY, $yRange[1] - $yRange[2] + 1);
		
		//print "numTilesX: $numTilesX<br>";
		//print "numTilesY: $numTilesY<br>";
		
		// Movie (ROI) Dimensions
		$dimensions = array();
		$dimensions['width']  = $ts * $numTilesX;
		$dimensions['height'] = $ts * $numTilesY;
		$dimensions['x'] = (1/2) * ($width  - $dimensions['width']);
		$dimensions['y'] = (1/2) * ($height - $dimensions['height']);
		
		//print_r($dimensions);
		//exit();
		
		return $dimensions;
	}
}
?>