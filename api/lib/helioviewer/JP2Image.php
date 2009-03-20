<?php
/**
 * @package JP2Image - JPEG 2000 Image Class
 * @author Keith Hughitt <Vincent.K.Hughitt@nasa.gov>
 */
abstract class JP2Image {
	protected $kdu_expand   = CONFIG::KDU_EXPAND;
	protected $kdu_lib_path = CONFIG::KDU_LIBS_DIR;
	protected $cacheDir     = CONFIG::CACHE_DIR;
	protected $jp2Dir       = CONFIG::JP2_DIR;
	protected $noImage      = CONFIG::EMPTY_TILE;
	protected $baseScale    = 2.63; //Scale of an EIT image at the base zoom-level: 2.63 arcseconds/px
	protected $baseZoom     = 10;   //Zoom-level at which (EIT) images are of this scale.
	
	protected $db;
	protected $imageId;
	protected $xRange;
	protected $yRange;
	protected $zoomLevel;
	protected $tileSize;
	protected $desiredScale;
	protected $desiredToActual;
	protected $scaleFactor;
	
	protected $jp2;
	protected $jp2Width;
	protected $jp2Height;
	protected $jp2Scale;
	protected $detector;
	protected $measurement;
	protected $opacityGrp;
	protected $timestamp;
	
	protected $image;

    /**
     * @param int The image identifier
     * @param int The zoomlevel to work with
     * @param array An associative array reprenting the desired image width
     *              in terms of tile x-coordinates.
     * @param array An associative array reprenting the desired image height
     *              in terms of tile y-coordinates.
     * @param int The size of the tile to work with.
     * 
     * @TODO: Move away from working in terms of tiles in the "JP2Image" class
     * and instead use top-left corner, width, and height. The Tile class can
     * make any neccessary conversions from tile x&y.
     * 
     * Also need to determine how functions that use "tilesize" can be handled.
     */
	protected function __construct($id, $zoomLevel, $xRange, $yRange, $tileSize) {
		require_once('DbConnection.php');
		date_default_timezone_set('UTC');
		$this->db        = new DbConnection();
		$this->imageId   = $id;
		$this->zoomLevel = $zoomLevel;
		$this->tileSize  = $tileSize;
		$this->xRange    = $xRange;
		$this->yRange    = $yRange;

		// Get image meta information
		$this->getMetaInfo();

		// Determine desired image scale
		$this->zoomOffset   = $zoomLevel - $this->baseZoom;
		$this->desiredScale = $this->baseScale * (pow(2, $this->zoomOffset));
		
		// Ratio of the desired scale to the actual JP2 image scale
		$this->desiredToActual = $this->desiredScale / $this->jp2Scale;
		
		// Scale Factor
		$this->scaleFactor = log($this->desiredToActual, 2);
		
		// Relative Tilesize
		$this->relativeTilesize = $this->tileSize * $this->desiredToActual;		
	}
	
	/**
	 * buildImage
	 * @return Returns an Imagick object representing the extracted region
	 * $imageInfo['uri'], $tile, $imageInfo["width"], $imageInfo["height"], $imageInfo['imgScaleX'], $imageInfo['detector'], $imageInfo['measurement']);
	 */
	protected function buildImage($filename) {
		$relTs = $this->relativeTilesize;
		
		// extract region from JP2
		$pgm = $this->extractRegion($filename);

		// Open in ImageMagick
		$im = new Imagick($pgm);
		
		// For images with transparent components, convert pixels with value "0" to be transparent.
		if ($this->getImageFormat() == "png")
			$im->paintTransparentImage(new ImagickPixel("black"), 0,0);

		// Apply color table
		if (($this->detector == "EIT") || ($this->measurement == "0WL")) {
			$clut = new Imagick($this->getColorTable($this->detector, $this->measurement));
			$im->clutImage( $clut );
		}
			
		// Get dimensions of extracted region
		$extractedWidth  = $im->getImageWidth();
		$extractedHeight = $im->getImageHeight();

		// Pad up the the relative tilesize (in cases where region extracted for outer tiles is smaller than for inner tiles)
		if (($relTs < $this->tileSize) && (($extractedWidth < $relTs) || ($extractedHeight < $relTs))) {
			$this->padImage($im, $extractedWidth, $extractedHeight, $relTs, $this->xRange["start"], $this->yRange["start"]);
		}
		
		// Resize if necessary (Case 3)
		if (($relTs < $this->tileSize) || ($extractedWidth > $this->tileSize) || ($extractedHeight > $this->tileSize))
			$im->scaleImage($this->tileSize, $this->tileSize);

		// Pad if tile is smaller than it should be (Case 2)
		$tileWidth  = $im->getImageWidth();
		$tileHeight = $im->getImageHeight();
		
		if (($tileWidth < $this->tileSize) || ($tileHeight < $this->tileSize)) {
			$this->padImage($im, $tileWidth, $tileHeight, $this->tileSize, $this->xRange["start"], $this->yRange["start"]);
		}
		
		// Compression settings & Interlacing
		$this->setImageParams($im);
		
		$im->writeImage($filename);

		// Quantize PNG's
		if ($this->getImageFormat() == "png") {
			$colors = Config::NUM_COLORS;
			exec("pngnq -n $colors -e '.png.tmp' -f $filename");
			rename($filename . ".tmp", $filename);
		}

		// Remove intermediate file
		unlink($pgm);
		
		return $im;
	}
	
	/**
	 * Set Image Parameters
	 * @return 
	 * @param $im IMagick Image
	 */
	private function setImageParams($im) {
		if ($this->getImageFormat() == "png") {
			$im->setCompressionQuality(Config::PNG_COMPRESSION_QUALITY);
			$im->setInterlaceScheme(imagick::INTERLACE_PLANE);
		}
		else {
			$im->setCompressionQuality(Config::JPEG_COMPRESSION_QUALITY);
			$im->setInterlaceScheme(imagick::INTERLACE_LINE);
		}
		$im->setImageDepth(Config::BIT_DEPTH);
	}
	
	private function extractRegion($filename) {
		// Intermediate image file
		$pgm = substr($filename, 0, -3) . "pgm";
		
		$cmd = "$this->kdu_expand -i $this->jp2 -o $pgm ";
		
		// Case 1: JP2 image resolution = desired resolution
		// Nothing special to do...

		// Case 2: JP2 image resolution > desired resolution (use -reduce)		
		if ($this->jp2Scale < $this->desiredScale) {
			$cmd .= "-reduce " . $this->scaleFactor . " ";
		}

		// Case 3: JP2 image resolution < desired resolution (get smaller tile and then enlarge)
		// Don't do anything yet...

		// Add desired region
		$cmd .= $this->getRegionString();
		
		// Execute the command
		try {
			exec('export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:' . "$this->kdu_lib_path; " . $cmd, $out, $ret);
			
			if ($ret != 0)
				throw new Exception("Failed to expand requested sub-region!<br><br> <b>Command:</b> '$cmd'");
				
		} catch(Exception $e) {
			echo '<span style="color:red;">Error:</span> ' .$e->getMessage();
			exit();
		}
		
		return $pgm;
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
	private function getRegionString() {
		$jp2Width  = $this->jp2Width;
		$jp2Height = $this->jp2Height;
		$ts = $this->relativeTilesize;
		
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
		$height = ((($relY == 0) || ($relY == ($imgNumTilesY -1))) ? $outerTS : $innerTS) / $jp2Height;
		
		// <width>
		$width  = ((($relX == 0) || ($relX == ($imgNumTilesX -1))) ? $outerTS : $innerTS) / $jp2Width;

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
			return Config::WEB_ROOT_DIR . "/images/color-tables/ctable_EIT_$measurement.png";
		}
		else if ($detector == "0C2") {
			return Config::WEB_ROOT_DIR . "/images/color-tables/ctable_idl_3.png";
		}
		else if ($detector == "0C3") {
			return Config::WEB_ROOT_DIR . "/images/color-tables/ctable_idl_1.png";
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
			$exploded = explode("/", $filepath);
			$filename = end($exploded);
			header("Content-Length: " . filesize($filepath));
			header("Content-Disposition: inline; filename=\"$filename\"");	
		}

		// Specify format
		$format = $this->getImageFormat();

		if ($format == "png")
			header("Content-Type: image/png");
		else
			header("Content-Type: image/jpeg");
		
		readfile($filepath);
	}
	
	/**
	 * getMetaInfo
	 * @param $imageId Object
	 */
	protected function getMetaInfo() {
		$query  = sprintf("SELECT timestamp, uri, opacityGrp, width, height, imgScaleX, imgScaleY, measurement.abbreviation as measurement, detector.abbreviation as detector FROM image 
							LEFT JOIN measurement on image.measurementId = measurement.id  
							LEFT JOIN detector on measurement.detectorId = detector.id 
							WHERE image.id=%d", $this->imageId);

		$result = $this->db->query($query);

		if (!$result) {
		        echo "$query - failed\n";
		        die (mysqli_error($this->db->link));
		}
		else if (mysqli_num_rows($result) > 0) {
			$meta = mysqli_fetch_array($result, MYSQL_ASSOC);
			
			$this->jp2         = $meta['uri'];
			$this->jp2Width    = $meta['width'];
			$this->jp2Height   = $meta['height'];
			$this->jp2Scale    = $meta['imgScaleX'];
			$this->detector    = $meta['detector'];
			$this->measurement = $meta['measurement'];
			$this->opacityGrp  = $meta['opacityGrp'];
			$this->timestamp   = $meta['timestamp'];
		}
		else
			return false;
	}
	
	/**
	 * getImageFormat
	 * @return 
	 */
	protected function getImageFormat() {
		return ($this->opacityGrp == 1) ? "jpg" : "png";
	}
}
?>
