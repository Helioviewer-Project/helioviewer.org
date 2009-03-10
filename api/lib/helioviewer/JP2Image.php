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
		
		// Execute the command
		try {
			exec('export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:' . "$this->kdu_lib_path; " . $cmd, $out, $ret);
			
			if ($ret != 0)
				throw new Exception("Failed to expand requested sub-region!<br><br> <b>Command:</b> '$cmd'");
				
		} catch(Exception $e) {
			echo '<span style="color:red;">Error:</span> ' .$e->getMessage();
			exit();
		}

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
			
		// Pad up the the relative tilesize (in cases where region extract for outer tiles is smaller than for inner tiles)
		$tileWidth  = $im->getImageWidth();
		$tileHeight = $im->getImageHeight();
		if (($relTs < $this->tileSize) && (($tileWidth < $relTs) || ($tileHeight < $relTs))) {
			$this->padImage($im, $tileWidth, $tileHeight, $relTs, $this->xRange["start"], $this->yRange["start"]);
		}
		
		// Resize if necessary (Case 3)
		if ($relTs < $this->tileSize)
			$im->scaleImage($this->tileSize, $this->tileSize);

		// Pad if tile is smaller than it should be (Case 2)
		//if ($imageScale < $this->desiredScale) {
			//$this->padImage($im, $this->tileSize, $this->xRange["start"], $this->yRange["start"]);
		//}
		//if (($imageScale < $this->desiredScale) || (true)) {
		//}
		
		// Pad if needed (to full tilesize)
		$tileWidth  = $im->getImageWidth();
		$tileHeight = $im->getImageHeight();
		
		if (($tileWidth < $this->tileSize) || ($tileHeight < $this->tileSize)) {
			$this->padImage($im, $tileWidth, $tileHeight, $this->tileSize, $this->xRange["start"], $this->yRange["start"]);
		}

		return $im;
	}
	
	/**
	 * getRegionString
	 * Build a region string to be used by kdu_expand. e.g. "-region {0.0,0.0},{0.5,0.5}"
	 * where expected values are: {<top>,<left>},{<height>,<width>}
	 * 
	 * Note:
	 * 
	 * Because JP2 files may now be of any arbitrary dimensions, the size of the region
	 * to extract now depends on which tile is being targeted. Specifically, outter and
	 * inner tiles may have different dimensions.
	 * 
	 * Explanation:
	 * 
	 * First,
	 * 
	 * 	numTilesInside = imgNumTiles - 2
	 * 
	 *  innerTS = ts
	 *  outerTS = [jp2width - (numTilesInside * innerTS)] / 2
	 *  
	 * 1. Tile position:
	 * 		LEFT, if relx = 0
	 * 		RIGHT, if relx = (imgNumTilesX -1)
	 * 		MIDDLE, otherwise
	 * 
	 *		TOP, if rely = 0
	 *		BOTTOM, if rely = (imgNumTilesY -1)
	 *		MIDDLE, otherwise
	 * 
	 * 
	 * 2. Determining top-left corner of region to extract:
	 *
	 * 		"<top>":
	 * 			0, if the tile is on the TOP outisde
	 * 			1 * outerTS + (relY -1) * innerTS, otherwise
	 *  
	 * 		"<left>":
	 * 			0, if the tile is on the LEFT outside
	 * 			1 * outerTS + (relX -1) * innerTS, otherwise
	 * 
	 * 3. Determining the dimensions to extract:
	 * 
	 * 		"<height>":
	 * 			outerTS, if the tile is on the outside (top OR bottom)
	 * 			innerTS, otherwise
	 *
	 * 		"<width>":
	 * 			outerTS, if the tile is on the outside (left OR right)
	 * 			innerTS, otherwise
	 * 
	 * Finally,
	 * 
	 * Note also that the algorithm currently assumes that a square region is being 
	 * requested, and that the JP2 image is a square itself. It may be a good idea to
	 * create separate functions for handling single tiles vs. multiple tiles or other regions.
	 * This way assumptions can be made in each case to simplify the process.
	 */
	private function getRegionString($jp2Width, $jp2Height, $ts) {
		// Parameters
		$top = $left = $width = $height = null;
		
		// Number of tiles for the entire image
		$imgNumTilesX = max(2, ceil($jp2Width  / $ts));
		$imgNumTilesY = max(2, ceil($jp2Height / $ts));
		
		// Tile placement architecture expects an even number of tiles along each dimension
		if ($imgNumTilesX % 2 != 0)
			$imgNumTilesX += 1;

		if ($imgNumTilesY % 2 != 0)
			$imgNumTilesY += 1;
			
		// Shift so that 0,0 now corresponds to the top-left tile
		$relX = (0.5 * $imgNumTilesX) + $this->xRange["start"];
		$relY = (0.5 * $imgNumTilesY) + $this->yRange["start"];

		// number of tiles (may be greater than one for movies, etc)
		$numTilesX = min($imgNumTilesX - $relX, $this->xRange["end"] - $this->xRange["start"] + 1);
		$numTilesY = min($imgNumTilesY - $relY, $this->yRange["end"] - $this->yRange["start"] + 1);

		// Number of "inner" tiles
		$numTilesInsideX = $imgNumTilesX - 2;
		$numTilesInsideY = $imgNumTilesY - 2;
		
		// Dimensions for inner and outer tiles
		$innerTS = $ts;
		$outerTS = ($jp2Width - ($numTilesInsideX * $innerTS)) / 2;
		
		// <top>
		$top  = (($relY == 0) ? 0 :  $outerTS + ($relY - 1) * $innerTS) / $jp2Height;

		// <left>
		$left = (($relX == 0) ? 0 :  $outerTS + ($relX - 1) * $innerTS) / $jp2Width;
		
		// <height>
		$height = ((($relY == 0) || ($relY == (imgNumTilesY -1))) ? $outerTS : $innerTS) / $jp2Height;
		
		// <width>
		$width  = ((($relX == 0) || ($relX == (imgNumTilesX -1))) ? $outerTS : $innerTS) / $jp2Width;

		// {<top>,<left>},{<height>,<width>}
		$region = "-region \{$top,$left\},\{$height,$width\}";

		return $region;
	}
	
	/**
	 * padImage - Pads an image up to a desired amount.
	 * Uses IMagick's "cropImage" function:
	 * 		bool Imagick::cropImage  ( int $width  , int $height  , int $x  , int $y  )
	 * width + height = crop dimensions and x & y are top-left corner coordinates.
	 * 
	 * @param $im Image
	 * @param $tileWidth The current width of the tile to be padded
	 * @param $tileHeight The current height of the tile to be padded
	 * @param $ts Object The tilesize to pad up to
	 * @param $x Object x-coordinate of the tile
	 * @param $y Object y-coordinate of the tile
	 */
	private function padImage ($im, $tileWidth, $tileHeight, $ts, $x, $y) {
		// Determine which direction "outside" is
		$xOutside = ($x <= -1) ? "LEFT" : "RIGHT";
		$yOutside = ($y <= -1) ? "TOP"  : "BOTTOM";
		
		// Pad all sides
		$clear = new ImagickPixel( "transparent" );
		$padx = max($ts - $tileWidth, 0);
		$pady = max($ts - $tileHeight, 0);
		
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
	
	public function display($filepath=null) {
		// Cache-Lifetime (in minutes)
		$lifetime = 60;
		$exp_gmt = gmdate("D, d M Y H:i:s", time() + $lifetime * 60) ." GMT";
		header("Expires: " . $exp_gmt);
		header("Cache-Control: public, max-age=" . $lifetime * 60);

		// Special header for MSIE 5
		header("Cache-Control: pre-check=" . $lifetime * 60, FALSE);

		// Filename & Content-length
		if (isset($filepath)) {
			$filename = end(split("/", $filepath));
			header("Content-Length: " . filesize($filepath));
			header("Content-Disposition: inline; filename=\"$filename\"");	
		}

		// Specify format
		$format = $this->image->getImageFormat();

		if ($format == "PNG")
			header("Content-Type: image/png");
		else
			header("Content-Type: image/jpeg");
		
			
		echo $this->image;
	}
}
?>
