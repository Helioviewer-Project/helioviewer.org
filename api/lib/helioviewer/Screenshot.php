<?php
/**
 * @author Jaclyn Beck
 * @fileoverview The ScreenImage class is used for screenshot generation, since the parameters are 
 * 					slightly different from those of a MovieFrame.
 */
require_once('CompositeImage.php');

class Screenshot extends CompositeImage {
	protected $id;
	protected $layerImages;
	protected $timestamp;
	protected $cacheFileDir;
	protected $imageSize;

	/**
	 * Constructor
	 * @param array $layers  -- an array of layer information strings, with the format: "obs_inst_det_meas,xStart,xEnd,yStart,yEnd,hcOffsetx,hcOffsety,opacity"
	 * @param int $zoomLevel -- a number between 8 and 15, the zoom level of the viewport.
	 * @param array $options -- array containing true/false values for "EdgeEnhance" and "Sharpen"
	 * @param int $timestamp -- the unix timestamp of the observation date in the viewport
	 * @param int $id -- the unix timestamp of the time the Screenshot was requested
	 * @param array $imageSize -- an array holding the with and height of the viewport image
	 */
	public function __construct($timestamp, $zoomLevel, $options, $imageSize, $filename) {
		$this->timestamp 	= $timestamp;
		$this->imageSize 	= $imageSize;
		// this->timestamps will be an associative array with the actual timestamps of each layer, as given by the database
		$this->timestamps 	= array();
		
		$tmpDir = CONFIG::TMP_ROOT_DIR . "/screenshots/";

		parent::__construct($zoomLevel, $options, $tmpDir);
		
		$this->id = $filename;

		// Directory to hold the final screenshot image.
		$this->cacheFileDir = $this->tmpDir . time() . "/";
		
		if(!file_exists($this->cacheFileDir)) {
			mkdir($this->cacheFileDir);
			chmod($this->cacheFileDir, 0777);
		}
	}

	/**
	 * @description Gets the closest images for each layer, and does a little more splicing to the layer string so that 
	 * 				it now includes the actual uri and the opacity group of the image. When done with all layers, calls
	 * 				compileImages() to finish building.
	 * @param object $layers -- an array of layer strings in the format: "obs_inst_det_meas,xStart,xSize,yStart,ySize,hcOffsetx,hcOffsety"
	 */	
	public function buildImages($layers) {
		$this->layerImages = array();		

		// Find the closest image for each layer, add the layer information string to it
		foreach($layers as $layer) {
			$layerInfo = explode(",", $layer);
			// $name = "obs_inst_det_meas"
			$name = $layerInfo[0];
			$closestImage = $this->getClosestImage($name);

			// Chop the layer name off the array but keep the rest of the information.
			// layerInfo is now: [xStart,xSize,yStart,ySize,hcOffsetx,hcOffsety,opacity]
			$useful = array_slice($layerInfo, 1);
		
			// image is now: "year_month_day_HMS_obs_inst_det_meas.jp2,xStart,xSize,yStart,ySize,hcOffsetx,hcOffsety,opacity,opacityGrp"
			$image = $closestImage['uri'] . "," . implode(",", $useful) . "," . $closestImage['opacityGrp'];
			$this->layerImages[$name] = $image;
			
			$this->timestamps[$name] = $closestImage['timestamp'];
		}
		
		$this->compileImages();
	}

	/**
	 * @description Queries the database to find the closest image to a given timestamp.
	 * @return array $row -- array containing the image's timestamp, uix_timestamp, timediff, timediffabs, uri, opacityGrp
	 * @param object $name -- string representing: "obs_inst_det_meas" of the image.
	 */	
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