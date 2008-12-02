<?php
class TileStore {
	private $dbConnection;
	private $noImage     = "images/transparent.gif";
	private $kdu_expand  = "kdu_expand";
	private $cacheDir    = "/var/www/hv/tiles/";
	private $baseScale  = 2.63; //Scale of an EIT image at the base zoom-level: 2.63 arcseconds/px
	private $baseZoom = 10;     //Zoom-level at which (EIT) images are of this scale.

	public function __construct($dbConnection) {
		$this->dbConnection = $dbConnection;
	}

	/**
	 * getTile
	 * @return
	 * @param $imageId	Int
	 * @param $zoom		Int
	 * @param $x		Int
	 * @param $y		Int
	 * @param $ts		Int
	 *
	 * Notes:
	 * 	1. Range of available tiles = +/- ceil([(1/2)(2^zoom-offset)(image width or height)]/ts)
	 */
	function getTile($imageId, $zoom, $x, $y, $ts) {
		// Retrieve meta-information
		$imageInfo = $this->getMetaInfo($imageId);

		// Filepaths (For .tif and .png images)
		$tif = $this->getFilePath($imageId, $imageInfo['timestamp'], $zoom, $x, $y, $ts);
		$png = substr($tif, 0, -3) . "png";

		//print "<span style='color: red'>" . $tif . "</span><br>";

		// If tile already exists in cache, use it
		if (file_exists($png)) {
			header( "Content-Type: image/png" );
			echo new Imagick($png);
			exit();
		}
		
		// Determine desired image scale
		$zoomOffset = $zoom - $this->baseZoom;
		$desiredScale = $this->baseScale * (pow(2, $zoomOffset));
		
		// Ratio of the desired scale to the actual JP2 image scale
		$desiredToActual = $desiredScale / $imageInfo['imgScaleX'];
		
		// Scale Factor
		$scaleFactor = log($desiredToActual, 2);
		
		//print "<span style='color: red'>Desired Scale: $desiredScale</span><br>";
		//print "<span style='color: orange'>Image Scale: " . $imageInfo['imgScaleX'] . "</span><br>";
		//print "<span style='color: green'>Desired to Actual Scale Ratio: " . $desiredToActual . "</span><br>";
		
		// kdu_expand command
		$cmd = "$this->kdu_expand -i " . $imageInfo['uri'] . " -o $tif ";		
		
		//print "Scale Factor: $scaleFactor<br>";

		$relTs = $ts * $desiredToActual;
		
		// Case 1: JP2 image resolution = desired resolution
		// Nothing special to do...

		// Case 2: JP2 image resolution > desired resolution (use -reduce)		
		if ($imageInfo['imgScaleX'] < $desiredScale) {
			$cmd .= "-reduce " . $scaleFactor . " ";
		}

		// Case 3: JP2 image resolution < desired resolution (get smaller tile and then enlarge)
		// Don't do anything yet...
		
		// Check to see if the tile requested is within the range of available data
		$xRange = ceil($imageInfo["width"]  / (2 * $desiredToActual * $ts));
		$yRange = ceil($imageInfo["height"] / (2 * $desiredToActual * $ts));
		if ((abs($x) > $xRange) || (abs($y) > $yRange)) {
			print "Out of range tile request... Range- x: $xRange, y: $yRange";
			exit();
		}
		
		//print "<span style='color: purple'>Relative Tilesize: $relTs</span><br>";

		// Add desired region
		$cmd .= $this->getRegionString($imageInfo['width'], $imageInfo['height'], $x, $y, $relTs);

		//print "<br><span style='color: red'>" . $cmd . "</span><br>";
		//print "<br><span style='color: blue'>getRegionString($relWidth, $relHeight, $x, $y, $relTs)</span><br>";

		// Execute the command
		exec($cmd, $output, $return);

		// Open in ImageMagick
		$im = new Imagick($tif);

		// Apply color table
		$meas = $imageInfo['measurement'];
		if (($meas == 171) || ($meas == 195) || ($meas == 284) || ($meas == 304)) {
			$clut = new Imagick("/var/www/hv/images/color-tables/ctable_EIT_$meas.png");
			$im->clutImage( $clut );
		}
		
		// For images with transparent components, convert pixels with value "0" to be transparent.
		if ($imageInfo['measurement'] == "0WL")
			$im->paintTransparentImage(new ImagickPixel("black"), 0,0);
			
		// Pad if tile is smaller than it should be (Case 2)
		if ($imageInfo['imgScaleX'] < $desiredScale) {
			$this->padImage($im, $ts, $x, $y);
		}

		// Resize if necessary (Case 3)
		if ($relTs < $ts)
			$im->scaleImage($ts, $ts);

		// Convert to png
		$im->setFilename($png);
		$im->writeImage($im->getFilename());

		// Delete tif image
		unlink($tif);

		// Display tile
		header( "Content-Type: image/png" );
		echo $im;

		exit();
	}

	function padImage($im, $ts, $x, $y) {
		// First pad all sides, then trim away unwanted parts
		$clear = new ImagickPixel( "transparent" );
		$padx = $ts - $im->getImageWidth();
		$pady = $ts - $im->getImageHeight();
		
		$im->borderImage($clear, $padx, $pady);

		// left
		//if ($x <= -1)
		//	$im->cropImage($ts, $ts + $pady, 0, 0);
		
		// top-left
		if (($x == -1) && ($y == -1))
			$im->cropImage($ts, $ts, 0, 0);

		// top-right
		if (($x == 0) && ($y == -1))
			$im->cropImage($ts, $ts, $padx, 0);

		// bottom-right
		if (($x == 0) && ($y == 0))
			$im->cropImage($ts, $ts, $padx, $pady);

		// bottom-left
		if (($x == -1) && ($y == 0))
			$im->cropImage($ts, $ts, 0, $pady);

		/**
		// top-left
		if (($x == -1) && ($y == -1))
			$im->cropImage($ts, $ts, 0, 0);

		// top-right
		if (($x == 0) && ($y == -1))
			$im->cropImage($ts, $ts, $padx, 0);

		// bottom-right
		if (($x == 0) && ($y == 0))
			$im->cropImage($ts, $ts, $padx, $pady);

		// bottom-left
		if (($x == -1) && ($y == 0))
			$im->cropImage($ts, $ts, 0, $pady);
		*/
	}

	function getFilePath($imageId, $timestamp, $zoom, $x, $y, $ts) {
		// Starting point
		$filepath = $this->cacheDir . $ts . "/";

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
		$xStr = "+" . str_pad($x, 2, '0', STR_PAD_LEFT);
		if (substr($x,0,1) == "-")
			$xStr = "-" . str_pad(substr($x, 1), 2, '0', STR_PAD_LEFT);

		$yStr = "+" . str_pad($y, 2, '0', STR_PAD_LEFT);
		if (substr($y,0,1) == "-")
			$yStr = "-" . str_pad(substr($y, 1), 2, '0', STR_PAD_LEFT);

		$filepath .= $imageId . "_" . $zoom . "_" . $xStr . "_" . $yStr . ".tif";

		return $filepath;
	}

	/**
	 * getRegionString
	 * Build a region string to be used by kdu_expand. e.g. "-region {0.0,0.0},{0.5,0.5}"
	 */
	function getRegionString($width, $height, $x, $y, $ts) {
		// Determine region to tile from (Note: assuming that image dimensions are a factor of TS)
		$numTilesX = max(2, $width / $ts);
		$numTilesY = max(2, $height / $ts);
		
		//print "numTilesX: $numTilesX, numTilesY: $numTilesY <br>";
		
		// Shift so that 0,0 now corresponds to the top-left tile
		$relX = (0.5 * $numTilesX) + $x;
		$relY = (0.5 * $numTilesY) + $y;

		// Convert to percentages
		$tsPercentX = 1 / $numTilesX;
		$tsPercentY = 1 / $numTilesY;

		$region = "-region {" . ($relY * $tsPercentY) . "," . ($relX * $tsPercentX) . "},{" . $tsPercentX . "," . $tsPercentY . "} ";

		return $region;
	}

	/**
	 * getMetaInfo
	 * @return
	 * @param $imageId Object
	 */
	function getMetaInfo($imageId) {
		$query  = "SELECT timestamp, uri, width, height, imgScaleX, imgScaleY, measurement.abbreviation as measurement FROM image ";
		$query .= "LEFT JOIN measurement on image.measurementId = measurement.id WHERE image.id=$imageId";

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

	function outputTile($imageId, $zoom, $x, $y, $ts) {
		// Cache-Lifetime (in minutes)
		$lifetime = 60;
		$exp_gmt = gmdate("D, d M Y H:i:s", time() + $lifetime * 60) ." GMT";
		header("Expires: " . $exp_gmt);
		header("Cache-Control: public, max-age=" . $lifetime * 60);

		// Special header for MSIE 5
		header("Cache-Control: pre-check=" . $lifetime * 60, FALSE);

		$this->getTile($imageId, $zoom, $x, $y, $ts);
	}
}
?>
