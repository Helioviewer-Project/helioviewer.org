<?php
/**
 * @package JP2Image - JPEG 2000 Image Class
 * @author Keith Hughitt <Vincent.K.Hughitt@nasa.gov>
 * @TODO: Extend Exception class to create more useful objects.
 * @TODO: Use different name for intermediate PNG than final version.
 * @TODO: Forward request to secondary server if it fails for a valid tile?
 * @TODO: build up a "process log" string for each tile process which can be
 *        output to the log in case of failure.
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
	 * @return
	 */
	protected function buildImage($filename) {
	    try {
            // extract region from JP2
    		$pgm = $this->extractRegion($filename);
    		
    		// Use PNG as intermediate format so that GD can read it in
    		$png = substr($filename, 0, -3) . "png";
            
            exec("convert $pgm -depth 8 -quality 10 $png");
    		
    		// Apply color-lookup table
    		if (($this->detector == "EIT") || ($this->measurement == "0WL")) {
    			$clut = $this->getColorTable($this->detector, $this->measurement);
    			$this->setColorPalette($png, $clut, $png);
    		}
    
    		// IM command for transparency, padding, rescaling, etc.
    		$cmd = "convert $png -background black ";
    		
    		// Apply alpha mask for images with transparent components
    		if ($this->hasAlphaMask()) {
    			$mask = substr($filename, 0, -4) . "-mask.tif";
    			$cmd .= "$mask ";
    		}
    		
    		// Determine relative size of image at this scale
    		$jp2RelWidth  = $this->jp2Width  /  $this->desiredToActual;
    		$jp2RelHeight = $this->jp2Height /  $this->desiredToActual;
    		
    		// Get dimensions of extracted region
    		$extracted = $this->getImageDimensions($pgm);
    
    		// Pad up the the relative tilesize (in cases where region extracted for outer tiles is smaller than for inner tiles)
    		$relTs = $this->relativeTilesize;
    		if (($relTs < $this->tileSize) && (($extracted['width'] < $relTs) || ($extracted['height'] < $relTs))) {
    			$pad = "convert $png -background black " . $this->padImage($jp2RelWidth, $jp2RelHeight, $extracted['width'], $extracted['height'], $relTs, $this->xRange["start"], $this->yRange["start"]) . " $png";
    			exec($pad);
    		}		
    		
    		// Resize if necessary (Case 3)
    		if ($relTs < $this->tileSize)
    			$cmd .= "-geometry " . $this->tileSize . "x" . $this->tileSize . "! ";
    
    		// Refetch dimensions of extracted region
    		$tile = $this->getImageDimensions($png);
    		
    		// Pad if tile is smaller than it should be (Case 2)
    		if ((($tile['width'] < $this->tileSize) || ($tile['height'] < $this->tileSize)) && ($relTs >= $this->tileSize)) {
    			$cmd .= $this->padImage($jp2RelWidth, $jp2RelHeight, $tile['width'], $tile['height'], $this->tileSize, $this->xRange["start"], $this->yRange["start"]);
    		}
    		
    		if ($this->hasAlphaMask()) {
    			$cmd .= "-compose copy_opacity -composite ";
    		}
    
    		// Compression settings & Interlacing
    		$cmd .= $this->setImageParams();
    		
    		//echo ("$cmd $filename");
    		//exit();
    
    		// Execute command
    		exec("$cmd $filename", $out, $ret);
            if ($ret != 0)
                throw new Exception("Unable to apply final processing. Command: $cmd");
    
    		// Cleanup
      		if ($this->hasAlphaMask()) {
      		    unlink($mask);
            }
            if ($this->getImageFormat() === "jpg") {
                unlink($png);
            }
      		unlink($pgm);
    	
    		return $filename;
            
        } catch(Exception $e) {
    	    $error = "[buildImage][" . date("Y/m/d H:i:s") . "]\n\t " . $e->getMessage() . "\n\n";
		    file_put_contents(Config::ERROR_LOG, $error,FILE_APPEND);
			print $error;
                        
            //Clean-up and exit
            $this->abort($filename);
		}
	}
	
	/**
	 * Set Image Parameters
	 * @return String Image compression and quality related flags.
	 */
	private function setImageParams() {
		$args = " -quality ";
		if ($this->getImageFormat() == "png") {
			$args .= Config::PNG_COMPRESSION_QUALITY . " -interlace plane -colors " . Config::NUM_COLORS;
		} else {
			$args .= Config::JPEG_COMPRESSION_QUALITY . " -interlace line";
		}
		$args .= " -depth " . Config::BIT_DEPTH . " ";
		
		return $args;
	}
	
	/**
	 * Call's the identify command in order to determine an image's dimensions
	 * @return Object the width and height of the given image
	 * @param $filename String - The image filepath
	 */
	private function getImageDimensions($filename) {
	    try {
    		$dimensions = split("x", trim(exec("identify $filename | grep -o \" [0-9]*x[0-9]* \"")));
            if (sizeof($dimensions) < 2)
                throw new Exception("Unable to extract image dimensions for $filename!");
            else {
        		return array (
        			'width'  => $dimensions[0],
        			'height' => $dimensions[1]
        		);
            }
        } catch (Exception $e) {
            $msg = "[PHP][" . date("Y/m/d H:i:s") . "]\n\t " . $e->getMessage() . "\n\n";
            file_put_contents(Config::ERROR_LOG, $msg, FILE_APPEND);
            $this->abort($filename);
        }
	}
	
	/**
	 * Extract a region using kdu_expand
	 * @return String - Filename of the expanded region 
	 * @param $filename String - JP2 filename
	 */
	private function extractRegion($filename) {
		// Intermediate image file
		$pgm = substr($filename, 0, -3) . "pgm";
		
		// For images with transparent parts, extract a mask as well
		if ($this->hasAlphaMask()) {
			$mask = substr($filename, 0, -4) . "-mask.tif";
			$cmd = "$this->kdu_expand -i $this->jp2 -raw_components -o $pgm,$mask ";
		}
		else {
			$cmd = "$this->kdu_expand -i $this->jp2 -o $pgm ";
		}
		
		// Case 1: JP2 image resolution = desired resolution
		// Nothing special to do...

		// Case 2: JP2 image resolution > desired resolution (use -reduce)		
		if ($this->jp2Scale < $this->desiredScale) {
			$cmd .= "-reduce " . $this->scaleFactor . " ";
		}

		// Case 3: JP2 image resolution < desired resolution (get smaller tile and then enlarge)
		// Don't do anything yet...

		// Add desired region
		$cmd .= $this->getRegionString($this->jp2Width, $this->jp2Height, $this->relativeTilesize);
		
		//echo $cmd;
        //exit();
		
		// Execute the command
		try {
			$line = exec('export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:' . "$this->kdu_lib_path; " . $cmd, $out, $ret);
			if (($ret != 0) || (sizeof($out) > 5)) {
			    var_dump($out);
				throw new Exception("COMMAND: $cmd\n\t $line");
            }
				
		} catch(Exception $e) {
    	    $error = "[kdu][" . date("Y/m/d H:i:s") . "]\n\t " . $e->getMessage() . "\n\n";
		    file_put_contents(Config::ERROR_LOG, $error,FILE_APPEND);
			print $error;
            
            //Clean-up and exit
            $this->abort($filename);
		}
		
		return $pgm;
	}
	
	/**
	 * getRegionString
	 * Build a region string to be used by kdu_expand. e.g. "-region {0.0,0.0},{0.5,0.5}"
	 * 
	 * NOTE: Because kakadu's internal precision for region strings is less than PHP,
	 * the numbers used are cut off to prevent erronious rounding.
	 */
	private function getRegionString() {
		$jp2Width  = $this->jp2Width;
		$jp2Height = $this->jp2Height;
		$ts = $this->relativeTilesize;
		
		// Rounding
		$precision = 6;
		
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
		$top  = substr((($relY == 0) ? 0 :  $outerTS + ($relY - 1) * $innerTS) / $jp2Height, 0, $precision);
		
		// <left>
		$left = substr((($relX == 0) ? 0 :  $outerTS + ($relX - 1) * $innerTS) / $jp2Width, 0, $precision);

		// <height>
		$height = substr(((($relY == 0) || ($relY == ($imgNumTilesY -1))) ? $outerTS : $innerTS) / $jp2Height, 0, $precision);
		
		// <width>
		$width  = substr(((($relX == 0) || ($relX == ($imgNumTilesX -1))) ? $outerTS : $innerTS) / $jp2Width, 0, $precision);

		// {<top>,<left>},{<height>,<width>}
		$region = "-region \{$top,$left\},\{$height,$width\}";

		return $region;
	}
	
	/**
	 * padImage
	 */
	//function padImage($im, $ts, $x, $y) {
	/**
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

	}**/
	
	private function padImage ($jp2Width, $jp2Height, $tileWidth, $tileHeight, $ts, $x, $y) {
		// Determine min and max tile numbers
		$imgNumTilesX = max(2, ceil($jp2Width  / $this->tileSize));
		$imgNumTilesY = max(2, ceil($jp2Height / $this->tileSize));
		
		// Tile placement architecture expects an even number of tiles along each dimension
		if ($imgNumTilesX % 2 != 0)
			$imgNumTilesX += 1;

		if ($imgNumTilesY % 2 != 0)
			$imgNumTilesY += 1;
		
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
		// TEST: use black instead of transparent for background?
		return "-gravity $gravity -extent $ts" . "x" . "$ts ";
	}
	
	private function getColorTable($detector, $measurement) {
		if ($detector == "EIT") {
			return Config::WEB_ROOT_DIR . "/images/color-tables/ctable_EIT_$measurement.png";
		}
		else if ($detector == "0C2") {
			return Config::WEB_ROOT_DIR .  "/images/color-tables/ctable_idl_3.png";
		}
		else if ($detector == "0C3") {
			return Config::WEB_ROOT_DIR . "/images/color-tables/ctable_idl_1.png";
		}		
	}
	
	public function display($filepath=null) {
	    try {
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
    		
    		if (!readfile($filepath)) {
                throw new Exception("Error displaying $filename\n");
    		}
        } catch (Exception $e) {
            $msg = "[PHP][" . date("Y/m/d H:i:s") . "]\n\t " . $e->getMessage() . "\n\n";
            file_put_contents(Config::ERROR_LOG, $msg, FILE_APPEND);
        }
	}
	
	/**
	 * hasAlphaMask
	 * @return string
	 */
	private function hasAlphaMask() {
		return $this->measurement === "0WL" ? true : false;
	}
    
    /**
     * Handles clean-up in case something goes wrong to avoid mal-formed tiles from being displayed
     * @TODO: Clost any open IM/GD file handlers
     */
    private function abort($filename) {
        $pgm = substr($filename, 0, -3) . "pgm";
   		$png = substr($filename, 0, -3) . "png";
        
        // Clean up
        if (file_exists($pgm))
            unlink($pgm);
        if (file_exists($png))
            unlink($png);
        if (file_exists($filename))
            unlink($filename);
            
      	if ($this->hasAlphaMask()) {
			$mask = substr($filename, 0, -4) . "-mask.tif";
            if (file_exists($mask))
                unlink($mask);
        }
        
        die();
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
	
	/**
	 * setColorPalette
	 */
	private function setColorPalette ($input, $clut, $output) {
    	$gd = null;
	    try {
	        if (file_exists($input))
    	        $gd = imagecreatefrompng($input);
            else
                throw new Exception("Unable to apply color-table: $input does not exist.");

    		if (!$gd)
				throw new Exception("Unable to apply color-table: $input is not a valid image.");
				
		} catch(Exception $e) {
    	    $error = "[gd][" . date("Y/m/d H:i:s") . "]\n\t " . $e->getMessage() . "\n\n";
		    file_put_contents(Config::ERROR_LOG, $error,FILE_APPEND);
			print $error;

			die();
		}
		$ctable = imagecreatefrompng($clut);
		
		//echo "$input<br> $clut<br> $output";
		//exit();
		
		for ($i = 0; $i <= 255; $i++) {
			$rgba = imagecolorsforindex($ctable, $i);
			imagecolorset($gd, $i, $rgba["red"], $rgba["green"], $rgba["blue"]);
		}

		// Enable interlacing
		imageinterlace($gd, true);
		
		//$this->getImageFormat() == "jpg" ? imagejpeg($gd, $output, Config::JPEG_COMPRESSION_QUALITY) : imagepng($gd, $output); 
		//if ($this->getImageFormat() == "jpg")
		//	imagejpeg($gd, $output, Config::JPEG_COMPRESSION_QUALITY);
		//else
		imagepng($gd, $output);

		// Cleanup
		if ($input != $output)
			unlink($input);
		imagedestroy($gd);
		imagedestroy($ctable);
	}
}
?>
