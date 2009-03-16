<?php
require_once('DbConnection.php');

abstract class JP2Image {
	protected $kdu_expand   = CONFIG::KDU_EXPAND;
	protected $kdu_lib_path = CONFIG::KDU_LIBS_DIR;
	protected $cacheDir     = CONFIG::CACHE_DIR;
	protected $jp2Dir       = CONFIG::JP2_DIR;
	protected $noImage      = CONFIG::EMPTY_TILE;
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
			exec('export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:' . "$this->kdu_lib_path; " . $cmd, $out, $ret);
			
			if ($ret != 0)
				throw new Exception("Failed to expand requested sub-region!<br><br> <b>Command:</b> '$cmd'");
				
		} catch(Exception $e) {
			echo '<span style="color:red;">Error:</span> ' .$e->getMessage();
			exit();
		}
		
		$imcmd = "convert $output ";

		// For images with transparent components, convert pixels with value "0" to be transparent.
		if ($measurement == "0WL")
			$imcmd .= "-transparent black ";
		
		// Get dimensions of extracted region
		$dimensions = split("x", trim(exec("identify $output | grep -o \" [0-9]*x[0-9]* \"")));
		$tileWidth  = $dimensions[0];
		$tileHeight = $dimensions[1];

		// Pad up the the relative tilesize (in cases where region extract for outer tiles is smaller than for inner tiles)
		//$tileWidth  = $im->getImageWidth();
		//$tileHeight = $im->getImageHeight();
		//if (($relTs < $this->tileSize) && (($tileWidth < $relTs) || ($tileHeight < $relTs))) {
		//	$this->padImage($im, $tileWidth, $tileHeight, $relTs, $this->xRange["start"], $this->yRange["start"]);
		//}
		
		
		// Apply color table
		if (($detector == "EIT") || ($measurement == "0WL")) {
			$clut = $this->getColorTable($detector, $measurement);
			$imcmd .= "$clut -clut ";
		}
		
		// Pad if tile is smaller than it should be (Case 2)
		if ($imageScale < $this->desiredScale) {
			$imcmd .= $this->padImage($tif, $this->tileSize, $this->xRange["start"], $this->yRange["start"], $relTs);
		}

		// Resize if necessary (Case 3)
		if ($relTs < $this->tileSize)
			$imcmd .= "-geometry " . $this->tileSize . "x" . $this->tileSize . "! ";
			//exec("convert -geometry " . $this->tileSize . "x" . $this->tileSize . "! $tif $tif", $out, $ret);
			//$im->scaleImage($this->tileSize, $this->tileSize);

		exec($imcmd . "$output");

		//echo $imcmd . $tif;

		//return $im;
		return $output;
	}
	
	/**
	 * getRegionString
	 * Build a region string to be used by kdu_expand. e.g. "-region {0.0,0.0},{0.5,0.5}"
	 */
	public function getRegionString($jp2Width, $jp2Height, $ts) {
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
	 * padImage
	 */
	//function padImage($im, $ts, $x, $y) {
	function padImage($tif, $ts, $x, $y, $relTs) {
		$padx = $ts - $relTs;
		$pady = $ts - $relTs;

		// top-left
		if (($x == -1) && ($y == -1))
			return "-background transparent -gravity SouthEast -extent $ts" . "x" . "$ts ";

		// top-right
		if (($x == 0) && ($y == -1))
			return "-background transparent -gravity SouthWest -extent $ts" . "x" . "$ts ";

		// bottom-right
		if (($x == 0) && ($y == 0))
			return "-background transparent -gravity NorthWest -extent $ts" . "x" . "$ts ";

		// bottom-left
		if (($x == -1) && ($y == 0))
			return "-background transparent -gravity NorthEast -extent $ts" . "x" . "$ts ";

	}
	
	private function padImage ($im, $jp2Width, $jp2Height, $tileWidth, $tileHeight, $ts, $x, $y) {
		// Determine min and max tile numbers
		$imgNumTilesX = max(2, ceil($jp2Width  / $ts));
		$imgNumTilesY = max(2, ceil($jp2Height / $ts));
		$tileMinX = - ($imgNumTilesX / 2);
		$tileMaxX =   ($imgNumTilesX / 2) - 1;
		$tileMinY = - ($imgNumTilesY / 2);
		$tileMaxY =   ($imgNumTilesY / 2) - 1; 
		 		
		// Determine where the tile is located (where tile should lie in the padding)
		$gravity = null;
		if ($x == $tileMinX) {
			if ($y == $tileMinY) {
				$gravity = "SouthEast";
			}
			else if ($y == $tileMaxY) {
				$gravity = "NorthEast";
			}
			else {
				$gravity = "East";
			}
		}
		else if ($x == $tileMaxX) {
			if ($y == $tileMinY) {
				$gravity = "SouthWest";
			}
			else if ($y == $tileMaxY) {
				$gravity = "NorthWest";
			}
			else {
				$gravity = "West";
			}
		}
		
		else {
			if ($y == $tileMinY) {
				$gravity = "South";
			}
			else {
				$gravity = "North";
			}
		}
		
		// Construct padding command
		return "-background transparent -gravity $gravity -extent $ts" . "x" . "$ts ";
	}
	
	private function getColorTable($detector, $measurement) {
		if ($detector == "EIT") {
			return "/home/esahelio/public_html/images/color-tables/ctable_EIT_$measurement.png";
		}
		else if ($detector == "0C2") {
			return "/home/esahelio/public_html/images/color-tables/ctable_idl_3.png";
		}
		else if ($detector == "0C3") {
			return "/home/esahelio/public_html/images/color-tables/ctable_idl_1.png";
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
		
		header( "Content-Type: image/png" );
		//echo $this->image;
	    readfile($this->image);
	}
}
?>
