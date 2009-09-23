<?php
/**
 * @class SubFieldImage
 */
require('JP2Image.php');

class SubFieldImage {
	/**
    protected $subfieldFile; //image
	protected $subfieldWidth; //imageWidth
	protected $subfieldHeight;
	protected $subfieldRelWidth; //imageRelWidth ... = $this->imageWidth  * $this->desiredToActual;
	protected $subfieldRelHeight;
	protected $region; // {top: , left: , bottom: , right: }
	**/
	protected $sourceJp2;
	protected $outputFile;
	protected $roi;
	protected $format;
    protected $desiredScale;
    protected $desiredToActual;
    protected $scaleFactor;
	protected $colorTable = false;
	protected $alphaMask  = false;
	protected $quality;
	
	/**
	 * @TODO: Rename "jp2scale" syntax to "nativeImageScale" to get away from JP2-specific terminology
	 * 		  ("desiredScale" -> "desiredImageScale" or "requestedImageScale")
	  */	
	public function __construct($sourceJp2, $outputFile, $roi, $format, $jp2Width, $jp2Height, $jp2Scale, $desiredScale) {
		$this->sourceJp2  = new JP2Image($sourceJp2, $jp2Width, $jp2Height, $jp2Scale);
		$this->outputFile = $outputFile;
		$this->roi        = $roi;
		$this->format     = $format;
		
		$this->desiredScale    = $desiredScale;
		$this->desiredToActual = $desiredScale / $jp2Scale;
        $this->scaleFactor     = log($this->desiredToActual, 2);
	}
	
    /**
     * buildImage
     * @description Extracts a region of the jp2 image, converts it into a .png file, and handles
     * 				any padding, resizing, and transparency
     * @return
     */
    protected function buildImage() {
        try {
			$grayscale = substr($this->outputFile, 0, -3) . "pgm";

			// Extract region from JP2
			$this->sourceJp2->extractRegion($grayscale, $this->roi, $this->scaleFactor, $this->alphaMask);
        
            // Use PNG as intermediate format so that GD can read it in
            $intermediate = substr($grayscale, 0, -3) . "png";
			$cmd = CONFIG::PATH_CMD;
          	
			if(empty($this->quality))
				$this->quality = 10;

            exec($cmd . " convert $grayscale -depth 8 -quality " . $this->quality . " -type Grayscale $intermediate");
		      
            // Apply color-lookup table
            if ($this->colorTable)
				$this->setColorPalette($intermediate, $this->colorTable, $intermediate);                
   
            // IM command for transparency, padding, rescaling, etc.
            $cmd = CONFIG::PATH_CMD . " convert $intermediate -background black ";
            
            // Apply alpha mask for images with transparent components
            if ($this->hasAlphaMask()) {
                $mask = substr($this-outputFile, 0, -4) . "-mask.tif";
                $cmd .= "$mask ";
            }
            
            // Determine relative size of image at this scale
            $jp2RelWidth  = $this->sourceJp2->getWidth()  /  $this->desiredToActual;
            $jp2RelHeight = $this->sourceJp2->getHeight() /  $this->desiredToActual;

            // Get dimensions of extracted region (TODO: simpler to compute using roi + scaleFactor?)
            $extracted = $this->getImageDimensions($grayscale);

			$cmd .= $this->resizeImage($extracted, $jp2RelWidth, $jp2RelHeight, $intermediate);

            if ($this->hasAlphaMask())
                $cmd .= "-compose copy_opacity -composite ";
 
            // Compression settings & Interlacing
            $cmd .= $this->setImageParams();

            // Execute command
            exec("$cmd $this->outputFile", $out, $ret);
            if ($ret != 0)
                throw new Exception("Unable to apply final processing. Command: $cmd");
    
            // Cleanup
            if ($this->hasAlphaMask()) {
                unlink($mask);
            }
            if ($this->outputFile != $intermediate) {
                unlink($intermediate);
            }
            unlink($grayscale);
        
            return $filename;
            
        } catch(Exception $e) {
            $error = "[buildImage][" . date("Y/m/d H:i:s") . "]\n\t " . $e->getMessage() . "\n\n";
            file_put_contents(Config::ERROR_LOG, $error,FILE_APPEND);
            print $e->getMessage();
                        
            //Clean-up and exit
            $this->abort($this->outputFile);
        }
    }
	
	
	/** 
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
		}cmd;
			exit();

        // Construct padding command
        // TEST: use black instead of transparent for background?
        return "-gravity $gravity -extent " . $width . "x" . $height . $offset;
    }
	

	/**
	 * Set Color Table
	 */
	protected function setColorTable($clut) {
		$this->colorTable = $clut;	
	}
	
	/**
	 * Enable/Disable alpha mask support
	 */
	protected function setAlphaMask($value) {
		$this->alphaMask = $value;
	}
	
	protected function hasAlphaMask() {
		return $this->alphaMask;
	}
	
    /**
     * Set Image Parameters
     * @return String Image compression and quality related flags.
     */
    protected function setImageParams() {
        $args = " -quality ";
        if ($this->format == "png") {
            $args .= Config::PNG_COMPRESSION_QUALITY . " -interlace plane -colors " . Config::NUM_COLORS;
        } else {
            $args .= Config::JPEG_COMPRESSION_QUALITY . " -interlace line";
        }
        $args .= " -depth " . Config::BIT_DEPTH . " ";
        
        return $args;
    }
	
    /**
     * Handles clean-up in case something goes wrong to avoid mal-formed tiles from being displayed
     * @TODO: Close any open IM/GD file handlers
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
	 * @description Checks to see if the extracted image is smaller than it should be, pads it to the correct size, and resizes if necessary.
	 * @return $cmd -- a string containing the commands to execute, if any
	 * @param object $extracted -- array containing the width and height of the extracted image
	 * @param object $jp2RelWidth -- relative width and height of the whole jp2 image in the viewport
	 * @param object $jp2RelHeight
	 * @param object $png
	 */	
	protected function resizeImage($extracted, $jp2RelWidth, $jp2RelHeight, $png) {
		$cmd = "";
		
		$width     = $this->roi["right"] - $this->roi["left"];
		$height	   = $this->roi["bottom"] - $this->roi["top"];
		
		$relWidth  = $width  * $this->desiredToActual;
		$relHeight = $height * $this->desiredToActual;  
		
		// Pad up the the relative tilesize (in cases where region extracted for outer tiles is smaller than for inner tiles)
        if ( (($relWidth < $width) || ($relHeight < $height)) 
			&& (($extracted['width'] < $relWidth) || ($extracted['height'] < $relHeight)) ) {

            $pad = CONFIG::PATH_CMD . " convert $png -background black ";
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
        
        //$this->format == "jpg" ? imagejpeg($gd, $output, Config::JPEG_COMPRESSION_QUALITY) : imagepng($gd, $output); 
        //if ($this->format == "jpg")
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
	 * Displays the image on the page
	 */
    public function display() {
        try {
            // Cache-Lifetime (in minutes)
            $lifetime = 60;
            $exp_gmt = gmdate("D, d M Y H:i:s", time() + $lifetime * 60) ." GMT";
            header("Expires: " . $exp_gmt);
            header("Cache-Control: public, max-age=" . $lifetime * 60);
    
            // Special header for MSIE 5
            header("Cache-Control: pre-check=" . $lifetime * 60, FALSE);
    
            // Filename & Content-length
            if (isset($this->outputFile)) {
                $exploded = explode("/", $this->outputFile);
                $filename = end($exploded);
                
				$stat = stat($this->outputFile);
                header("Content-Length: " . $stat['size']);
                header("Content-Disposition: inline; filename=\"$filename\"");    
            }
    
            if ($this->format == "png")
                header("Content-Type: image/png");
            else
                header("Content-Type: image/jpeg");
            
            if (!readfile($this->outputFile)) {
                throw new Exception("Error displaying $filename\n");
            }
        } catch (Exception $e) {
            $msg = "[PHP][" . date("Y/m/d H:i:s") . "]\n\t " . $e->getMessage() . "\n\n";
            file_put_contents(Config::ERROR_LOG, $msg, FILE_APPEND);
        }
    }
	
    /**
     * Call's the identify command in order to determine an image's dimensions
     * @return Object the width and height of the given image
     * @param $filename String - The image filepath
     */
    private function getImageDimensions($filename) {
        try {
        	$cmd = CONFIG::PATH_CMD . " identify $filename | grep -o \" [0-9]*x[0-9]* \"";
			
            $dimensions = split("x", trim(exec($cmd)));
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
    
}
?>