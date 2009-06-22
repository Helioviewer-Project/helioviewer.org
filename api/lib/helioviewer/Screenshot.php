<?php
/**
 * @author Jaclyn Beck
 * @description The ScreenImage class is used for screenshots, since the parameters are 
 * 					slightly different from those of a FrameLayer.
 */
require('CompositeImage.php');

class Screenshot extends CompositeImage {
	protected $id;
	protected $layerImages;
	protected $timestamp;
	protected $cacheFileDir;

	/*
	 * Constructor
	 */
	public function __construct($timestamp, $zoomLevel, $options, $layers, $id, $hcOffset) {
		// $id is the unix timestamp of the current time
		// $timestamp is the timestamp of the image(s) requested.
		$this->id = $id;
		$this->timestamp = $timestamp;

		$tmpDir = CONFIG::CACHE_DIR . "screenshots/";
		
		/* layerImages is an array of layer information arrays.
		 * each layer information array has keys "xRange, "yRange", "opacity", and "closestImages" for that particular layer.
		 * "closestImages" one array containing the db info for the image, and "opacity" is an array with keys "opacityValue" (between 0 and 100)
		 * and "opacityGroup" (between 1 and 4)
		 */
		$this->layerImages = $this->getLayerInfo($layers);

		parent::__construct($zoomLevel, $options, $tmpDir, $hcOffset);
		
		$now = time();
		// Directory to hold the final screenshot image.
		$this->cacheFileDir = $this->tmpDir . $now . "/";
		
		if(!file_exists($this->cacheFileDir)) {
			mkdir($this->cacheFileDir);
			chmod($this->cacheFileDir, 0777);
		}

		$this->compileImages();
	}
	
	private function getLayerInfo($layers) {	
		$layerImages = array();
		
		foreach($layers as $layer) {
			// The layer name is in the format OBS_INST_DET_MEAS to allow for variable-length names.
			$layerInfo = explode("_", $layer["name"]);
			$obs = $layerInfo[0];
			$inst = $layerInfo[1];
			$det = $layerInfo[2];
			$meas = $layerInfo[3];

        	$closestImage = $this->getClosestImage($obs, $inst, $det, $meas);	

			$opacity = $layer["opacityValue"]; //array("opacityValue" => $layer["opacityValue"], "opacityGroup" => $closestImage['opacityGrp']);

			array_push($layerImages, array("xRange" => $layer["xRange"], "yRange" => $layer["yRange"], "opacity" => $opacity, "closestImage" => $closestImage));
		}
		return $layerImages;
	}
	
	private function getClosestImage($obs, $inst, $det, $meas) {
		require_once ('DbConnection.php');
		$this->db = new DbConnection();
		$time = $this->timestamp;

        $sql = sprintf("SELECT DISTINCT timestamp, UNIX_TIMESTAMP(timestamp) AS unix_timestamp, UNIX_TIMESTAMP(timestamp) - %d AS timediff, ABS(UNIX_TIMESTAMP(timestamp) - %d) AS timediffAbs, uri, opacityGrp 
				FROM image
					LEFT JOIN measurement on measurementId = measurement.id
					LEFT JOIN measurementType on measurementTypeId = measurementType.id
					LEFT JOIN detector on detectorId = detector.id
					LEFT JOIN opacityGroup on opacityGroupId = opacityGroup.id
					LEFT JOIN instrument on instrumentId = instrument.id
					LEFT JOIN observatory on observatoryId = observatory.id
             	WHERE observatory.abbreviation='%s' AND instrument.abbreviation='%s' AND detector.abbreviation='%s' AND measurement.abbreviation='%s' ORDER BY timediffAbs LIMIT 0,1",
        $time, $time, mysqli_real_escape_string($this->db->link, $obs), mysqli_real_escape_string($this->db->link, $inst), mysqli_real_escape_string($this->db->link, $det), mysqli_real_escape_string($this->db->link, $meas));
		try {
	        $result = $this->db->query($sql);
	        $row = mysqli_fetch_array($result, MYSQL_ASSOC);
			if(!$row)
				throw new Exception("Could not find the requested image.");
		}
		catch (Exception $e) {
			echo 'Error: ' . $e->getMessage();
			exit();
		}
		// resultArray contains values for "timestamp", "unix_timestamp", "timediff", "timediffAbs", "uri", and "opacityGrp"
        return $row;
	}
}

?>