<?php
/**
 * @package JP2Image - JPEG 2000 Image Class
 * @author Keith Hughitt <Vincent.K.Hughitt@nasa.gov>
 * @author Jaclyn Beck
 * @TODO: Extend Exception class to create more useful objects.
 * @TODO: Use different name for intermediate PNG than final version.
 * @TODO: Forward request to secondary server if it fails for a valid tile?
 * @TODO: build up a "process log" string for each tile process which can be
 *        output to the log in case of failure.
 * 6-12-2009 Converted this class to use pixels instead of tile coordinates when
 * 			 calculating padding and regions for kdu_expand. 
 * 			 If a tile is being generated, the Tile.php class converts its tile
 * 			 coordinates into pixels first before sending them here. 
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
    protected $uri;
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
    
    protected $observatory;
    protected $instrument;
    protected $detector;
    protected $measurement;
    protected $opacityGrp;
    protected $timestamp;
    
    protected $image;
	protected $imageWidth;
	protected $imageHeight;
	protected $imageRelWidth;
	protected $imageRelHeight;
        
    /**
     * @param object uri -- The image URI/filename
     * @param int zoomLevel -- The zoomlevel to work with
     * @param array xRange -- an associative array containing "xStart" (starting coordinate) and "xSize" (width)
     * @param array yRange -- An associative array containing "yStart" (staring coordinate) and "ySize" (height)
     * @param array imageSize -- an associative array containing "width" and "height" of the image
     * @param boolean isTile -- whether the image is a tile or not
     */
    protected function __construct($uri, $zoomLevel, $xRange, $yRange, $imageSize, $isTile = true) {
        require_once('DbConnection.php');
        date_default_timezone_set('UTC');
        $this->db        = new DbConnection();
        $this->uri       = $uri;
        $this->zoomLevel = $zoomLevel;

        $this->xRange    = $xRange;
        $this->yRange    = $yRange;
   		$this->isTile    = $isTile;

		$this->imageWidth  = $imageSize['width'];
		$this->imageHeight = $imageSize['height'];
				
        // Get the image filepath
        $this->jp2 = API::getFilepath($uri);

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
		$this->imageRelWidth  = $this->imageWidth  * $this->desiredToActual;
		$this->imageRelHeight = $this->imageHeight * $this->desiredToActual;      
    }
    
    /**
     * buildImage
     * @description Extracts a region of the jp2 image, converts it into a .png file, and handles
     * 				any padding, resizing, and transparency
     * @return
     */
    protected function buildImage($filename) {
        try {
            // extract region from JP2
            $pgm = $this->extractRegion($filename);
        
            // Use PNG as intermediate format so that GD can read it in
            $png = substr($filename, 0, -3) . "png";
			$cmd = CONFIG::PATH_CMD;
          	
			if(empty($this->quality)) {
				$this->quality = 10;
			}
            exec($cmd . " && convert $pgm -depth 8 -quality " . $this->quality . " -type Grayscale $png");
		      
            // Apply color-lookup table
            if (($this->detector == "EIT") || ($this->measurement == "0WL")) {
                $clut = $this->getColorTable($this->detector, $this->measurement);
                $this->setColorPalette($png, $clut, $png);
            }
   
            // IM command for transparency, padding, rescaling, etc.
            $cmd = CONFIG::PATH_CMD . " && convert $png -background black ";
            
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

			$cmd .= $this->resizeImage($extracted, $jp2RelWidth, $jp2RelHeight, $png);

            if ($this->hasAlphaMask()) {
                $cmd .= "-compose copy_opacity -composite ";
            }
 
            // Compression settings & Interlacing
            $cmd .= $this->setImageParams();

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
            print $e->getMessage();
                        
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
            $dimensions = split("x", trim(exec(CONFIG::PATH_CMD . " && identify $filename | grep -o \" [0-9]*x[0-9]* \"")));
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
        $cmd .= $this->getRegionString();

        // Execute the command
        try {
            $line = exec(CONFIG::PATH_CMD . " && " . CONFIG::DYLD_CMD . " && " . $cmd, $out, $ret);
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
     * 
     * 6-12-2009 Converted from using tile coordinates to pixels.
     */
	private function getRegionString() {
		$precision = 6;

		// Calculate the top, left, width, and height in terms of kdu_expand parameters (between 0 and 1)
		$top 	= substr($this->yRange["start"] / $this->jp2Height, 0, $precision);	
		$left 	= substr($this->xRange["start"] / $this->jp2Width,  0, $precision);
		$height = substr($this->yRange["size"]   / $this->jp2Height, 0, $precision);
		$width 	= substr($this->xRange["size"]   / $this->jp2Width,  0, $precision);
		
        $region = "-region \{$top,$left\},\{$height,$width\}";

        return $region;		
	}    

	/** 
	 * 6-12-2009 converted from using tile coordinates to pixels.   
	 * If the image is a Tile, it is padded according to where it lies in the image.
	 * If the image is a SubFieldImage, the image is padded with an offset from the NW corner.
	 */ 
    private function padImage ($jp2Width, $jp2Height, $width, $height, $x, $y) {		
		if($this->isTile) {
	        // Determine min and max tile numbers
	        $imgNumTilesX = max(2, ceil($jp2Width  / $this->imageWidth));
	        $imgNumTilesY = max(2, ceil($jp2Height / $this->imageHeight));
	        
	        // Tile placement architecture expects an even number of tiles along each dimension
	        if ($imgNumTilesX % 2 != 0)
	            $imgNumTilesX += 1;
	
	        if ($imgNumTilesY % 2 != 0)
	            $imgNumTilesY += 1;

			$numInnerTilesX = $imgNumTilesX - 2;
			$numInnerTilesY = $imgNumTilesY - 2;

	 		$tileMinX = ($this->jp2Width  / 2) - ($width  * $numInnerTilesX / 2);
			$tileMaxX = ($this->jp2Width  / 2) + ($width  * $numInnerTilesX / 2);     
			$tileMinY = ($this->jp2Height / 2) - ($height * $numInnerTilesY / 2); 
			$tileMaxY = ($this->jp2Height / 2) + ($height * $numInnerTilesY / 2);   

	        // Determine where the tile is located (where tile should lie in the padding)
	        $gravity = null;

	        if ($x < $tileMinX) {
	            if ($y < $tileMinY) {
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
	            if ($y < $tileMinY) {
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
	            if($y < $tileMinY) {
	            	$gravity = "South";
	            }

	            else {
	                $gravity = "North";
	            }
	        }

			$offset = " ";
		}
	
		/* 
		 * If the item is a subfieldImage, it is assumed that the overall picture is larger than, but contains this image.
		 * The image has a heliocentric offset and will be padded with that offset. 
		 */
		else {
			$gravity = "NorthWest";
			// Offset the image from the center using the heliocentric offset
			$offset  = $this->hcOffset["x"] . $this->hcOffset["y"] . " ";
		}

        // Construct padding command
        // TEST: use black instead of transparent for background?
        return "-gravity $gravity -extent " . $width . "x" . $height . $offset;
    }
    
	/**
	 * Gets the filepath for the color look-up table that corresponds to the image.
	 * @return string clut filepath
	 * @param object $detector
	 * @param object $measurement
	 */
    private function getColorTable($detector, $measurement) {
        if ($detector == "EIT") {
            return Config::WEB_ROOT_DIR . "/images/color-tables/ctable_EIT_$measurement.png";
        }
        else if ($detector == "C2") {
            return Config::WEB_ROOT_DIR .  "/images/color-tables/ctable_idl_3.png";
        }
        else if ($detector == "C3") {
            return Config::WEB_ROOT_DIR . "/images/color-tables/ctable_idl_1.png";
        }        
    }
    
	/**
	 * Displays the image on the page
	 * @param object $filepath[optional]
	 */
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
                
				$stat = stat($filepath);
                header("Content-Length: " . $stat['size']);
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
     * getMetaInfo queries the database to get information about the image: 
     * 	timestamp, opacitygrp, width, height, imgScaleX, imgScaleY
     * @param $imageId Object
     */
    protected function getMetaInfo() {
        // get instrumentation information from the filename
        $exploded = explode("_", substr($this->uri, 0, -4));
        $this->observatory = $exploded[4];
        $this->instrument  = $exploded[5];
        $this->detector    = $exploded[6];
        $this->measurement = $exploded[7];

        // get the rest of the details from the database
        $sql  = sprintf("SELECT timestamp, opacityGrp, width, height, imgScaleX, imgScaleY FROM image 
                            WHERE image.uri='%s'", $this->uri);

        $result = $this->db->query($sql);

        if (!$result) {
            echo "$sql - failed\n";
            die (mysqli_error($this->db->link));
        }
        else if (mysqli_num_rows($result) > 0) {
            $meta = mysqli_fetch_array($result, MYSQL_ASSOC);
            
            $this->jp2Width    = $meta['width'];
            $this->jp2Height   = $meta['height'];
            $this->jp2Scale    = $meta['imgScaleX'];
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
     * Note: input and output are usually the same file.
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
            print $e->getMessage();

            die();
        }
        $ctable = imagecreatefrompng($clut);
        
        for ($i = 0; $i <= 255; $i++) {
            $rgba = imagecolorsforindex($ctable, $i);
            imagecolorset($gd, $i, $rgba["red"], $rgba["green"], $rgba["blue"]);
        }

        // Enable interlacing
        imageinterlace($gd, true);
        
        //$this->getImageFormat() == "jpg" ? imagejpeg($gd, $output, Config::JPEG_COMPRESSION_QUALITY) : imagepng($gd, $output); 
        //if ($this->getImageFormat() == "jpg")
        //    imagejpeg($gd, $output, Config::JPEG_COMPRESSION_QUALITY);
        //else
        imagepng($gd, $output);

        // Cleanup
        if ($input != $output)
            unlink($input);
        imagedestroy($gd);
        imagedestroy($ctable);
    }
	
	/**
	 * @description Checks to see if the extracted image is smaller than it should be, pads it to the correct size, and resizes if necessary.
	 * @return $cmd -- a string containing the commands to execute, if any
	 * @param object $extracted -- array containing the width and height of the extracted image
	 * @param object $jp2RelWidth -- relative width and height of the whole jp2 image in the viewport
	 * @param object $jp2RelHeight
	 * @param object $png
	 */	
	function resizeImage($extracted, $jp2RelWidth, $jp2RelHeight, $png) {
		$cmd = "";
		$relWidth  	= $this->imageRelWidth;
		$relHeight 	= $this->imageRelHeight;
		$width 		= $this->imageWidth;
		$height 	= $this->imageHeight;

		// Pad up the the relative tilesize (in cases where region extracted for outer tiles is smaller than for inner tiles)
        if ( (($relWidth < $width) || ($relHeight < $height)) 
			&& (($extracted['width'] < $relWidth) || ($extracted['height'] < $relHeight)) ) {

            $pad = CONFIG::PATH_CMD . " && convert $png -background black ";
			$pad .= $this->padImage($jp2RelWidth, $jp2RelHeight, $relWidth, $relHeight, $this->xRange["start"], $this->yRange["start"]) . " $png";
			try {
            	exec($pad, $out, $ret);
				if($ret != 0) {
					throw new Exception("[pad image] Command: $pad");
				}
			}
			catch(Exception $e) {
           		$msg = "[PHP][" . date("Y/m/d H:i:s") . "]\n\t " . $e->getMessage() . "\n\n";
            	file_put_contents(Config::ERROR_LOG, $msg, FILE_APPEND);
				echo $e->getMessage();
			}
        }        
					
        // Resize if necessary (Case 3)
        if ($relWidth < $width || $relHeight < $height) {
            $cmd .= "-geometry " . $width . "x" . $height . "! ";
		}

        // Refetch dimensions of extracted region
        $tile = $this->getImageDimensions($png);
      
        // Pad if tile is smaller than it should be (Case 2)
        if ( (($tile['width'] < $width) || ($tile['height'] < $height)) 
			&& (($relWidth >= $width) || ($relHeight >= $height)) ) {
            $cmd .= $this->padImage($jp2RelWidth, $jp2RelHeight, $width, $height, $this->xRange["start"], $this->yRange["start"]);
		}
		return $cmd;
	}
}
?>
