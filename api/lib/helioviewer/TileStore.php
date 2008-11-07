<?php
class TileStore {
	private $dbConnection;
	private $noImage =    "images/transparent.gif";
	private $kdu_expand = "kdu_expand";
	private $defaultRes  = 2.63; //Resolution of an EIT image: 2.63 arcseconds/px
	private $defaultZoom = 12;   //Zoom-level at which images are of this resolution. 
	
	public function __construct($dbConnection) {
		$this->dbConnection = $dbConnection;
	}

	function getNumTiles($imageId, $zoom) {
		$query = "SELECT detector.lowestRegularZoomLevel as lowestRegularZoomLevel FROM image
					LEFT JOIN measurement ON image.measurementId = measurement.id
					LEFT JOIN detector ON measurement.detectorId = detector.id
					WHERE image.id = $imageId";
		
		
		$result = $this->dbConnection->query($query);
		$row = mysql_fetch_array($result);
		
		$difference = $row['lowestRegularZoomLevel'] - $zoom;
		if ($difference > 0)
			return pow(4, 1 + $difference);
		else
			return 4;     
	}

	/*
	function getTile($imageId, $zoom, $x, $y) {
		$query = "SELECT tile FROM tile WHERE imageId=$imageId AND zoom=$zoom AND x=$x AND y=$y";
		//echo $query;
		$result = $this->dbConnection->query($query);
		if (!$result) {
			echo "$query - failed\n";
			die (mysql_error());
		}
		if (mysql_num_rows($result) > 0) {
			$row = mysql_fetch_array($result);
			return $row;
		} else {
			//return file_get_contents($this->noImage);
			return false;
		}
	}*/
	
	function getTile($imageId, $zoom, $x, $y, $ts=512) {
		// Retrieve meta-information
		$imageInfo = $this->getMetaInfo($imageId);
		
		// Scale to EIT resolution (2.63 arcseconds/pixel)
		if ($imageInfo['imgScaleX'] != $this->defaultRes) {
			// Scale factors
			$sfX = $this->defaultRes / $imageInfo['imgScaleX'];
			$sfY = $this->defaultRes / $imageInfo['imgScaleY'];
			
			// Relative tile-dimensions
			$rtsX = $ts / $sfX;
			$rtsY = $ts / $sfY;
		}
		
		// Zoom-offset (->factor to magnify by)
		$zoomOffset = $this->defaultZoom - $zoom;
		
		// Desired resolution?
		
		// If desired resolution is an even factor lower than the default one, use kdu_expand's "reduce"" param.
		// If it's higher, resize tiles using imageMagick
		
		// Determine region to tile from
		
		// Check to see if tile exists (can this be done any earlier?)
		if ((($x * $ts) <= ($imageInfo['width']/2)) && (($y * $ts) <= ($imageInfo['height']/2))) {
			$cmd = "$this->kdu_expand -i " . $imageInfo['uri'] . " -o /var/www/hv/tmp/test.tif -region {0.0,0.0},{0.5,0.5}";
			exec($cmd, $output, $return);
			
			//print_r($output);
			//print "<br><br>".$cmd;
			
			exit();
		}
	}
	
	function getTileURI($imageId, $zoom, $x, $y) {
		$query = "SELECT url FROM tile WHERE imageId=$imageId AND zoom=$zoom AND x=$x AND y=$y";

		$result = $this->dbConnection->query($query);
		if (!$result) {
		        echo "$query - failed\n";
		        die (mysql_error());
		}
		if (mysql_num_rows($result) > 0) {
		        $row = mysql_fetch_array($result);
		        return $row;
		} else {
		        //return file_get_contents($this->noImage);
		        return false;
		}
	}
	
	/**
	 * getMetaInfo
	 * @return 
	 * @param $imageId Object
	 */
	function getMetaInfo($imageId) {
		$query = "SELECT uri, width, height, imgScaleX, imgScaleY FROM image WHERE id=$imageId";

		// Query database
		$result = $this->dbConnection->query($query);
		if (!$result) {
		        echo "$query - failed\n";
		        die (mysql_error());
		}
		if (mysql_num_rows($result) > 0)
			return mysql_fetch_array($result, MYSQL_ASSOC);
		else
			return false;
	}

	function outputTile($imageId, $zoom, $x, $y) {
		// Cache-Lifetime (in minutes)
		$lifetime = 60;
		$exp_gmt = gmdate("D, d M Y H:i:s", time() + $lifetime * 60) ." GMT";
		header("Expires: " . $exp_gmt);
		header("Cache-Control: public, max-age=" . $lifetime * 60);
		// Special header for MSIE 5
		header("Cache-Control: pre-check=" . $lifetime * 60, FALSE);

		$numTiles = $this->getNumTiles($imageId, $zoom);
		if ($numTiles >1) {
			$row = $this->getTile($imageId, $zoom, $x, $y);
			
			header('Content-type: image/jpeg');
			if ($row) echo $row['tile'];
			else readfile($this->noImage);
		

		} else {
			header('Content-type: image/jpeg');
			readfile($this->noImage);
		}
	}
}
?>
