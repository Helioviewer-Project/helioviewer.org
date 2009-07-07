<?php
/**
 * @author Jaclyn Beck
 * @description The ScreenImage class is used for screenshot generation, since the parameters are 
 * 					slightly different from those of a MovieFrame.
 */
require_once('CompositeImage.php');

class Screenshot extends CompositeImage {
	protected $id;
	protected $layerImages;
	protected $timestamp;
	protected $cacheFileDir;

	/**
	 * Constructor
	 * @param array $layers  -- an array of layer information strings, with the format: "obs_inst_det_meas,xStart,xEnd,yStart,yEnd,opacity"
	 * @param int $zoomLevel -- a number between 8 and 15, the zoom level of the viewport.
	 * @param array $options -- array containing true/false values for "EdgeEnhance" and "Sharpen"
	 * @param int $timestamp -- the unix timestamp of the observation date in the viewport
	 * @param int $id -- the unix timestamp of the time the Screenshot was requested
	 */
	public function __construct($timestamp, $zoomLevel, $options, $layers, $id, $hcOffset) {
		$this->id = $id;
		$this->timestamp = $timestamp;

		$tmpDir = CONFIG::TMP_ROOT_DIR . "/screenshots/";

		parent::__construct($zoomLevel, $options, $tmpDir, $hcOffset);
		
		$now = time();
		// Directory to hold the final screenshot image.
		$this->cacheFileDir = $this->tmpDir . $now . "/";
		
		if(!file_exists($this->cacheFileDir)) {
			mkdir($this->cacheFileDir);
			chmod($this->cacheFileDir, 0777);
		}

		$this->layerImages = array();		

		// Find the closest image for each layer, add the layer information string to it
		foreach($layers as $layer) {
			$layerInfo = explode(",", $layer);
			$closestImage = $this->getClosestImage($layerInfo[0]);
			
			// Chop the layer name off the array but keep the rest of the information
			$useful = array_slice($layerInfo, 1);
			
			$image = $closestImage['uri'] . "," . implode(",", $useful) . "," . $closestImage['opacityGrp'];
			array_push($this->layerImages, $image);
		}

		$this->compileImages();
	}
	
	private function getClosestImage($name) {
		require_once ('DbConnection.php');
		$this->db = new DbConnection();
		$time = $this->timestamp;

/*        $sql = sprintf("SELECT DISTINCT timestamp, UNIX_TIMESTAMP(timestamp) AS unix_timestamp, UNIX_TIMESTAMP(timestamp) - %d AS timediff, ABS(UNIX_TIMESTAMP(timestamp) - %d) AS timediffAbs, uri, opacityGrp 
				FROM image
					LEFT JOIN measurement on measurementId = measurement.id
					LEFT JOIN measurementType on measurementTypeId = measurementType.id
					LEFT JOIN detector on detectorId = detector.id
					LEFT JOIN opacityGroup on opacityGroupId = opacityGroup.id
					LEFT JOIN instrument on instrumentId = instrument.id
					LEFT JOIN observatory on observatoryId = observatory.id
             	WHERE observatory.abbreviation='%s' AND instrument.abbreviation='%s' AND detector.abbreviation='%s' AND measurement.abbreviation='%s' ORDER BY timediffAbs LIMIT 0,1",
        $time, $time, mysqli_real_escape_string($this->db->link, $obs), mysqli_real_escape_string($this->db->link, $inst), mysqli_real_escape_string($this->db->link, $det), mysqli_real_escape_string($this->db->link, $meas));
*/
		$sql = "SELECT DISTINCT timestamp, UNIX_TIMESTAMP(timestamp) AS unix_timestamp, UNIX_TIMESTAMP(timestamp) - $time AS timediff, ABS(UNIX_TIMESTAMP(timestamp) - $time) AS timediffAbs, uri, opacityGrp
					FROM image WHERE uri LIKE '%_%_%_%_" . mysqli_real_escape_string($this->db->link, $name) . ".jp2' ORDER BY timediffAbs LIMIT 0,1";

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