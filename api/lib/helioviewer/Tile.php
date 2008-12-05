<?php
/**
 * @class Tile
 */
require('JP2Image.php');

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

		// Filepaths (For .tif and .png images)
		$tif = $this->getFilePath($imageInfo['timestamp']);
		$png = substr($tif, 0, -3) . "png";

		// If tile already exists in cache, use it
		if (file_exists($png)) {
			$this->image = new Imagick($png);
			$this->display();
			exit();
		}
		
		// kdu_expand command
		$im = $this->extractRegion($imageInfo['uri'], $tif, $imageInfo["width"], $imageInfo["height"], $imageInfo['imgScaleX'], $imageInfo['measurement']);
		
		// Convert to png

		$im->setFilename($png);
		$im->writeImage($im->getFilename());
		
		// Optimize PNG
		exec("optipng $png", $out, $ret);

		// Delete tif image
		unlink($tif);
		
		// Store image
		$this->image = $im;
	}

	/**
	 * getFilePath
	 * @return 
	 * @param $timestamp Object
	 */
	function getFilePath($timestamp) {
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
		if (!file_exists($filepath))
			mkdir($filepath);

		$filepath .= $month . "/";
		if (!file_exists($filepath))
			mkdir($filepath);

		$filepath .= $day . "/";
		if (!file_exists($filepath))
			mkdir($filepath);

		// Convert coordinates to strings
		$xStr = "+" . str_pad($this->x, 2, '0', STR_PAD_LEFT);
		if (substr($this->x,0,1) == "-")
			$xStr = "-" . str_pad(substr($this->x, 1), 2, '0', STR_PAD_LEFT);

		$yStr = "+" . str_pad($this->y, 2, '0', STR_PAD_LEFT);
		if (substr($this->y,0,1) == "-")
			$yStr = "-" . str_pad(substr($this->y, 1), 2, '0', STR_PAD_LEFT);

		$filepath .= $this->imageId . "_" . $this->zoomLevel . "_" . $xStr . "_" . $yStr . ".tif";

		return $filepath;
	}



	/**
	 * getMetaInfo
	 * @return
	 * @param $imageId Object
	 */
	function getMetaInfo() {
		$query  = "SELECT timestamp, uri, width, height, imgScaleX, imgScaleY, measurement.abbreviation as measurement FROM image ";
		$query .= "LEFT JOIN measurement on image.measurementId = measurement.id WHERE image.id=$this->imageId";

		// Query database
		$result = $this->db->query($query);
		if (!$result) {
		        echo "$query - failed\n";
		        die (mysql_error());
		}
		if (mysql_num_rows($result) > 0)
			return mysql_fetch_array($result, MYSQL_ASSOC);
		else
			return false;
	}
}
?>
