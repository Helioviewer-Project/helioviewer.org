<?php
require_once('DbConnection.php');

/**
 * TODO:
 *     - use JPG instead of PNG for disk images.
 */

abstract class JP2Image {
	protected $kdu_expand   = CONFIG::KDU_EXPAND;
	protected $kdu_lib_path = CONFIG::KDU_LIBS_DIR;
	protected $cacheDir     = CONFIG::CACHE_DIR;
	protected $jp2Dir       = CONFIG::JP2_DIR;
	protected $noImage      = "images/transparent_512.gif";
	protected $baseScale    = 2.63; //Scale of an EIT image at the base zoom-level: 2.63 arcseconds/px
	protected $baseZoom     = 10;   //Zoom-level at which (EIT) images are of this scale.
	
	protected $db;
	protected $xRange;
	protected $yRange;
	protected $zoomLevel;
	protected $tileSize;
	protected $desiredScale;
	
	protected $image;
		
	protected function __construct($zoomLevel, $xRange, $yRange, $tileSize) {
		date_default_timezone_set('UTC');
		$this->db = new DbConnection();
		$this->zoomLevel = $zoomLevel;
		$this->tileSize  = $tileSize;
		$this->xRange    = $xRange;
		$this->yRange    = $yRange;

		// Determine desired image scale
		$this->zoomOffset   = $zoomLevel - $this->baseZoom;
		$this->desiredScale = $this->baseScale * (pow(2, $this->zoomOffset));
	}
	
	/**
	 * extractRegion
	 * @return Returns an Imagick object representing the extracted region
	 */
	protected function extractRegion($input, $output, $imageWidth, $imageHeight, $imageScale, $detector, $measurement) {
		$cmd = "$this->kdu_expand -i " . $input . " -o $output ";
		
		// Ratio of the desired scale to the actual JP2 image scale
		$desiredToActual = $this->desiredScale / $imageScale;
		
		// Scale Factor
		$scaleFactor = log($desiredToActual, 2);		
		
		$relTs = $this->tileSize * $desiredToActual;
		
		// Case 1: JP2 image resolution = desired resolution
		// Nothing special to do...

		// Case 2: JP2 image resolution > desired resolution (use -reduce)		
		if ($imageScale < $this->desiredScale) {
			$cmd .= "-reduce " . $scaleFactor . " ";
		}

		// Case 3: JP2 image resolution < desired resolution (get smaller tile and then enlarge)
		// Don't do anything yet...
		
		// Check to see if the tile requested is within the range of available data
		//$xRange = ceil($imageWidth  / (2 * $desiredToActual * $this->tileSize));
		//$yRange = ceil($imageHeight / (2 * $desiredToActual * $this->tileSize));
		//if ((abs($x) > $xRange) || (abs($y) > $yRange)) {
		//	print "Out of range tile request... Range- x: $xRange, y: $yRange";
		//	exit();
		//}
		
		// Add desired region
		$cmd .= $this->getRegionString($imageWidth, $imageHeight, $relTs);
		//print $cmd;
		
		// Execute the command
		try {
			exec('export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:' . "$this->kdu_lib_path; " . escapeshellcmd($cmd), $out, $ret);
			
			if ($ret != 0)
				throw new Exception("Failed to expand requested sub-region!<br><br> <b>Command:</b> '$cmd'");
				
		} catch(Exception $e) {
			echo '<span style="color:red;">Error:</span> ' .$e->getMessage();
			exit();
		}

		//print "<br><br><div style='color:blue'>$cmd</div><br>";
		//exit();
		
		// Open in ImageMagick
		$im = new Imagick($output);
		
		// Apply color table
		if (($detector == "EIT") || ($measurement == "0WL")) {
			$clut = new Imagick($this->getColorTable($detector, $measurement));
			$im->clutImage( $clut );
		}
		
		// For images with transparent components, convert pixels with value "0" to be transparent.
		if ($measurement == "0WL")
			$im->paintTransparentImage(new ImagickPixel("black"), 0,0);
			
		// Resize if necessary (Case 3)
		if ($relTs < $this->tileSize)
			$im->scaleImage($this->tileSize, $this->tileSize);

		// Pad if tile is smaller than it should be (Case 2)
		//if ($imageScale < $this->desiredScale) {
			//$this->padImage($im, $this->tileSize, $this->xRange["start"], $this->yRange["start"]);
		//}
		//if (($imageScale < $this->desiredScale) || (true)) {
		//}
		
		// Pad if needed
		$tileWidth  = $im->getImageWidth();
		$tileHeight = $im->getImageHeight();
		
		if (($tileWidth < $this->tileSize) || ($tileHeight < $this->tileSize)) {
			$this->padImage($im, $imageWidth, $imageHeight, $tileWidth, $tileHeight, $this->tileSize, $this->xRange["start"], $this->yRange["start"]);
		}

		return $im;
	}
	
	/**
	 * getRegionString
	 * Build a region string to be used by kdu_expand. e.g. "-region {0.0,0.0},{0.5,0.5}"
	 */
	private function getRegionString($width, $height, $ts) {
		// Number of tiles for the entire image
		$imgNumTilesX = max(2, $width / $ts);
		$imgNumTilesY = max(2, $height / $ts);
	
		// Shift so that 0,0 now corresponds to the top-left tile
		$relX = (0.5 * $imgNumTilesX) + $this->xRange["start"];
		$relY = (0.5 * $imgNumTilesY) + $this->yRange["start"];
		
		// number of tiles
		$numTilesX = min($imgNumTilesX - $relX, $this->xRange["end"] - $this->xRange["start"] + 1);
		$numTilesY = min($imgNumTilesY - $relY, $this->yRange["end"] - $this->yRange["start"] + 1);

		//print "numTilesX: $numTilesX, numTilesY: $numTilesY <br>";
		//print "imgNumTilesX: $imgNumTilesX, imgNumTilesY: $imgNumTilesY <br>";
		//exit();

		// Convert to percentages
		$tsPercentX = 1 / $imgNumTilesX;
		$tsPercentY = 1 / $imgNumTilesY;

		$region = "-region {" . ($relY * $tsPercentY) . "," . ($relX * $tsPercentX) . "},{" . $numTilesX * $tsPercentX . "," . $numTilesY * $tsPercentY . "} ";

		return $region;
	}
	
	private function padImage ($im, $imageWidth, $imageHeight, $tileWidth, $tileHeight, $ts, $x, $y) {
		// Determine which direction "outside" is
		$xOutside = ($x <= -1) ? "LEFT" : "RIGHT";
		$yOutside = ($y <= -1) ? "TOP"  : "BOTTOM";
		
		// Pad all sides
		$clear = new ImagickPixel( "transparent" );
		$padx = $ts - $tileWidth;
		$pady = $ts - $tileHeight;
		
		$im->borderImage($clear, $padx, $pady);
		
		// Remove inside padding
		if ($xOutside == "LEFT") {
			if ($yOutside == "TOP") {
				$im->cropImage($ts, $ts, 0, 0);
			} else {
				$im->cropImage($ts, $ts, 0, $pady);
			}
		} else {
			if ($yOutside == "TOP") {
				$im->cropImage($ts, $ts, $padx, 0);
			} else {
				$im->cropImage($ts, $ts, $padx, $pady);
			}			
		}
	}
	
	/**
	 * padImage (old version)
	 */
	/**
	function padImage($im, $ts, $x, $y) {
		// First pad all sides, then trim away unwanted parts
		$clear = new ImagickPixel( "transparent" );
		$padx = $ts - $im->getImageWidth();
		$pady = $ts - $im->getImageHeight();
		
		$im->borderImage($clear, $padx, $pady);
		
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

	}*/
	
	private function getColorTable($detector, $measurement) {
		if ($detector == "EIT") {
			return "/var/www/hv/images/color-tables/ctable_EIT_$measurement.png";
		}
		else if ($detector == "0C2") {
			return "/var/www/hv/images/color-tables/ctable_idl_3.png";
		}
		else if ($detector == "0C3") {
			return "/var/www/hv/images/color-tables/ctable_idl_1.png";
		}		
	}
	
	public function display() {
		// Cache-Lifetime (in minutes)
		$lifetime = 60;
		$exp_gmt = gmdate("D, d M Y H:i:s", time() + $lifetime * 60) ." GMT";
		header("Expires: " . $exp_gmt);
		header("Cache-Control: public, max-age=" . $lifetime * 60);

		// Special header for MSIE 5
		header("Cache-Control: pre-check=" . $lifetime * 60, FALSE);

		$format = $this->image->getImageFormat();
		
		if ($format == "PNG")
			header("Content-Type: image/png");
		else
			header("Content-Type: image/jpeg");
		
		echo $this->image;
	}
}
?>
