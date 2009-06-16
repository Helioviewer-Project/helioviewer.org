<?php
/**
 * @author Jaclyn Beck
 * @description The ScreenImage class is used for screenshots, since the parameters are 
 * 					slightly different from those of a FrameLayer.
 */
require('CompositeImage.php');

class ScreenImage extends CompositeImage {
	protected $id;
	protected $layerImages;
	protected $timestamp;
	/*
	 * Constructor
	 */
	public function __construct($timestamp, $zoomLevel, $options, $layers, $id) {
		$this->id = $id;
		$this->timestamp = $timestamp;
		
		$tmpDir = CONFIG::CACHE_DIR . "screenshots/";
		$this->layerImages = $this->getLayerInfo($layers);

		parent::__construct($zoomLevel, $options, $tmpDir);
		
		$this->compileImages();
	}
	
	private function getLayerInfo($layers) {	
		$layerImages = array();
		
		foreach($layers as $layer) {
			$layerInfo = explode("_", $layer["name"]);
			$obs = $layerInfo[0];
			$inst = $layerInfo[1];
			$det = $layerInfo[2];
			$meas = $layerInfo[3];

        	$closestImage = $this->getClosestImage($obs, $inst, $det, $meas);	

			// Assuming everything is opacity group 1 for now until I organize things.
			$opacity = array("opacityValue" => $layer["opacityValue"], "opacityGroup" => $closestImage[0]['opacityGrp']);

			array_push($layerImages, array("xRange" => $layer["xRange"], "yRange" => $layer["yRange"], "opacity" => $opacity, "closestImages" => $closestImage[0]));
		}
		return $layerImages;
	}
	
	private function getClosestImage($obs, $inst, $det, $meas) {
		require_once ('DbConnection.php');
		$this->db = new DbConnection();
        $resultArray = array ();
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

        $result = $this->db->query($sql);
        $row = mysqli_fetch_array($result, MYSQL_ASSOC);
        array_push($resultArray, $row);

        return $resultArray;
	}
}

?>