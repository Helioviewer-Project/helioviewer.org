<?php
/**
 * @class Tile
 * @author Keith Hughitt
 */
require('JP2Image.php');

class Tile extends JP2Image {
	private $imageId;
	private $x;
	private $y;

	/**
	 * constructor
	 */
	public function __construct($id, $zoomLevel, $x, $y, $tileSize, $skipCheck=false) {
		$xRange = array("start" => $x, "end" => $x);
		$yRange = array("start" => $y, "end" => $y);

		parent::__construct($zoomLevel, $xRange, $yRange, $tileSize);

		$this->x = $x;
		$this->y = $y;
		$this->imageId = $id;
		$this->getTile($skipCheck);
	}

	/**
	 * getTile
	 */
	function getTile($skipCheck) {
		// Retrieve meta-information
		$imageInfo = $this->getMetaInfo();
		
		// Determine final image format (jpg for disk images, png for all others)
		$format = ($imageInfo['opacityGrp'] == 1) ? "jpg" : "png";

		// Filepaths (for intermediate pgm and final png/jpg image)
		$final = $this->getFilePath($this->zoomLevel, $this->x, $this->y, $imageInfo['timestamp'], $format);
		
		$pgm   = substr($final, 0, -3) . "pgm";

		// Ratio of actual image scale to the requested image scale
		$actualToDesired = ($imageInfo['imgScaleX'] / $this->desiredScale);

		// If tile already exists in cache, use it
		if (!$skipCheck) {
			if (file_exists($final)) {
				$this->image = new Imagick($final);
				$this->display();
				exit();
			}
		}
		// Otherwise, if the resolution requested is higher than the image's native resolution, try and use a cached version of the highest res tile available
		/*
		elseif ($actualToDesired > 1) {
			$newX    = ($this->x < 0) ? floor($this->x / pow($actualToDesired, 2)) : ceil($this->x / pow($actualToDesired, 2));
			$newY    = ($this->y < 0) ? floor($this->y / pow($actualToDesired, 2)) : ceil($this->y / pow($actualToDesired, 2));
			$newZoom = $this->zoomLevel + log($actualToDesired, 2);

			$cached = $this->getFilePath($imageInfo['timestamp'], $newZoom, $newX, $newY);

			$im = new Imagick($cached);
		}*/

		// If nothing useful is in the cache, create the tile from scratch

		// kdu_expand command
		$im = $this->extractRegion($imageInfo['uri'], $pgm, $imageInfo["width"], $imageInfo["height"], $imageInfo['imgScaleX'], $imageInfo['detector'], $imageInfo['measurement']);

		// TODO: handle JPEG's separately
		// Convert to png
		$im->setCompressionQuality(Config::PNG_COMPRESSION_QUALITY);		
		$im->setFilename($final);
		$im->writeImage($final);

		// Optimize PNG
		// exec("optipng $png", $out, $ret);

		// Delete pgm image
		unlink($pgm);

		// Store image
		$this->image = $im;
		
		// Display image
		$this->display($final);
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
