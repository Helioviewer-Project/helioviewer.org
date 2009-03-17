<?php
/**
 * @class Tile
 * @author Keith Hughitt
 */
require('JP2Image.Manual.php');

class Tile extends JP2Image {
	private $imageId;
	private $x;
	private $y;

	/**
	 * constructor
	 */
	public function __construct($id, $zoomLevel, $x, $y, $tileSize) {
		$xRange = array("start" => $x, "end" => $x);
		$yRange = array("start" => $y, "end" => $y);
		
		parent::__construct($zoomLevel, $xRange, $yRange, $tileSize);
		
		$this->x = $x;
		$this->y = $y;
		$this->imageId = $id;
		$this->getTile();
	}

	/**
	 * getTile
	 */
	function getTile() {
		// Retrieve meta-information
		$imageInfo = $this->getMetaInfo();
		
		// Determine final image format (jpg for disk images, png for all others)
		$format = ($imageInfo['opacityGrp'] == 1) ? "jpg" : "png";

		// Filepaths (for intermediate pgm and final png/jpg image)
		$tile = $this->getFilePath($this->zoomLevel, $this->x, $this->y, $imageInfo['timestamp'], $format);

		// Ratio of actual image scale to the requested image scale
		$actualToDesired = ($imageInfo['imgScaleX'] / $this->desiredScale);

		// If tile already exists in cache, use it
		if (Config::ENABLE_CACHE) {
			if (file_exists($tile)) {
				$this->image = $tile;
				$this->display($tile);
				exit();
			}
		}

		// If nothing useful is in the cache, create the tile from scratch
		$im = $this->buildImage($imageInfo['uri'], $tile, $imageInfo["width"], $imageInfo["height"], $imageInfo['imgScaleX'], $imageInfo['detector'], $imageInfo['measurement']);
		
		// Store image
		$this->image = $tile;

		// Display image
		$this->display($tile);
	}

	/**
	 * getFilePath
	 * @return 
	 * @param $timestamp Object
	 */
	function getFilePath($zoomLevel, $x, $y, $timestamp, $format) {
		// Starting point
		$filepath = $this->cacheDir . $this->tileSize . "/";
		if (!file_exists($filepath))
			mkdir($filepath);
			
		// Date information
		$year  = substr($timestamp,0,4);
		$month = substr($timestamp,5,2);
		$day   = substr($timestamp,8,2);

		// Create necessary directories
		$filepath .= $year . "/";
		if (!file_exists($filepath)) {
			mkdir($filepath);
			chmod($filepath, 0777);
		}

		$filepath .= $month . "/";
		if (!file_exists($filepath)) {
			mkdir($filepath);
			chmod($filepath, 0777);
		}

		$filepath .= $day . "/";
		if (!file_exists($filepath)) {
			mkdir($filepath);
			chmod($filepath, 0777);
		}

		// Convert coordinates to strings
		$xStr = "+" . str_pad($x, 2, '0', STR_PAD_LEFT);
		if (substr($x,0,1) == "-")
			$xStr = "-" . str_pad(substr($x, 1), 2, '0', STR_PAD_LEFT);

		$yStr = "+" . str_pad($y, 2, '0', STR_PAD_LEFT);
		if (substr($y,0,1) == "-")
			$yStr = "-" . str_pad(substr($y, 1), 2, '0', STR_PAD_LEFT);

		$filepath .= $this->imageId . "_" . $zoomLevel . "_" . $xStr . "_" . $yStr . ".$format";

		return $filepath;
	}



	/**
	 * getMetaInfo
	 * @return
	 * @param $imageId Object
	 */
	function getMetaInfo() {
		$query  = sprintf("SELECT timestamp, uri, opacityGrp, width, height, imgScaleX, imgScaleY, measurement.abbreviation as measurement, detector.abbreviation as detector FROM image 
							LEFT JOIN measurement on image.measurementId = measurement.id  
							LEFT JOIN detector on measurement.detectorId = detector.id 
							WHERE image.id=%d", $this->imageId);
							
		// Query database
		$result = $this->db->query($query);
		if (!$result) {
		        echo "$query - failed\n";
		        die (mysqli_error($this->db->link));
		}
		if (mysqli_num_rows($result) > 0)
			return mysqli_fetch_array($result, MYSQL_ASSOC);
		else
			return false;
	}
}
?>
