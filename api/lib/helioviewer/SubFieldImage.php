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
	protected $subfieldWidth;
	protected $subfieldHeight;
    protected $subfieldRelWidth;
	protected $subfieldRelHeight;
	protected $jp2Width;
	protected $jp2Height;
	protected $jp2RelWidth;
    protected $jp2RelHeight;
    protected $alphaMask     = false;
	protected $colorTable    = false;
	protected $paddingString = false;
	
	/**
	 * @TODO: Rename "jp2scale" syntax to "nativeImageScale" to get away from JP2-specific terminology
	 * 		  ("desiredScale" -> "desiredImageScale" or "requestedImageScale")
	  */	
	public function __construct($sourceJp2, $outputFile, $roi, $format, $jp2Width, $jp2Height, $jp2Scale, $desiredScale) {
		$this->sourceJp2  = new JP2Image($sourceJp2, $jp2Width, $jp2Height, $jp2Scale);
		$this->outputFile = $outputFile;
		$this->roi        = $roi;
		$this->format     = $format;
		
		$this->jp2Width  = $jp2Width;
		$this->jp2Height = $jp2Height;
        $this->subfieldWidth  = $roi["right"] - $roi["left"];
        $this->subfieldHeight = $roi["bottom"] - $roi["top"];

		$this->desiredScale    = $desiredScale;
		$this->desiredToActual = $desiredScale / $jp2Scale;
        $this->scaleFactor     = log($this->desiredToActual, 2);
		
        //$this->subfieldRelWidth  = $this->subfieldWidth  * $this->desiredToActual;
        //$this->subfieldRelHeight = $this->subfieldHeight * $this->desiredToActual;
		$this->subfieldRelWidth  = $this->subfieldWidth  / $this->desiredToActual;
        $this->subfieldRelHeight = $this->subfieldHeight / $this->desiredToActual;
		
        $this->jp2RelWidth  = $jp2Width  /  $this->desiredToActual;
        $this->jp2RelHeight = $jp2Height /  $this->desiredToActual;
		
		//var_dump($this);
		//exit();
	}
	
    /**
     * buildImage
     * @description Extracts a region of the jp2 image, converts it into a .png file, and handles
     * 				any padding, resizing, and transparency. PNG is used as an intermediate format
     *              due to lack of support for PGM files in GD.
     * @return
     * 
     * @TODO: Normalize quality scale.
     */
    protected function buildImage() {
        try {
			$grayscale    = substr($this->outputFile, 0, -3) . "pgm";
            $intermediate = substr($this->outputFile, 0, -3) . "png"; 
			
			// Extract region
			$this->sourceJp2->extractRegion($grayscale, $this->roi, $this->scaleFactor);

			$cmd = CONFIG::PATH_CMD;

            // Generate grayscale image
			$toIntermediateCmd = $cmd . " convert $grayscale -depth 8 -quality 10 -type Grayscale ";
			
			// kdu_expand can only handle whole number values for -reduce
			if (fmod($this->scaleFactor, 1) != 0)
				$toIntermediateCmd .= "-resize " . $this->subfieldRelWidth . "x" . $this->subfieldRelHeight . " ";
				
            exec($toIntermediateCmd . $intermediate);
				
            //Apply color-lookup table				
            if ($this->colorTable)
				$this->setColorPalette($intermediate, $this->colorTable, $intermediate);                
   
            // IM command for transparency, padding, rescaling, etc.
            $cmd = CONFIG::PATH_CMD . " convert $intermediate -background black ";
            
            // Apply alpha mask for images with transparent components
            if ($this->hasAlphaMask())
                $cmd .= substr($this-outputFile, 0, -4) . "-mask.tif ";

            // Get dimensions of extracted region (TODO: simpler to compute using roi + scaleFactor?)
            //$extracted = $this->getImageDimensions($grayscale);
			$extracted = $this->getImageDimensions($intermediate);
			
			//var_dump($extracted);
			//die();

	        // Pad up the the relative tilesize (in cases where region extracted for outer tiles is smaller than for inner tiles)
	        if ( (($this->subfieldRelWidth < $this->subfieldWidth) || ($this->subfieldRelHeight < $this->subfieldHeight)) 
	            && (($extracted['width'] < round($this->subfieldRelWidth)) || ($extracted['height'] < round($this->subfieldRelHeight))) ) {
	
	            $pad = CONFIG::PATH_CMD . " convert $intermediate -background black ";
	            $pad .= $this->padImage($this->subfieldRelWidth, $this->subfieldRelHeight, $this->roi["left"], $this->roi["top"]) . " $intermediate";
				
	            try {
	                exec($pad, $out, $ret);
	                if($ret != 0)
	                    throw new Exception("[pad image] Command: $pad");
	            }
	            catch(Exception $e) {
	                $msg = "[PHP][" . date("Y/m/d H:i:s") . "]\n\t " . $e->getMessage() . "\n\n";
	                file_put_contents(Config::ERROR_LOG, $msg, FILE_APPEND);
	                echo $e->getMessage();
	            }
	        } 
			
			// Pad if tile is smaller than it should be (Case 2)
			//if (true) {
			//}
			
	        if ($this->desiredToActual > 1)
	            $cmd .= $this->padImage($this->subfieldWidth, $this->subfieldHeight, $this->roi["left"], $this->roi["top"]);

            if ($this->hasAlphaMask())
                $cmd .= "-compose copy_opacity -composite ";
 
            // Compression settings & Interlacing
            $cmd .= $this->setImageParams();

			//die($cmd . " " . $this->outputFile);

            // Execute command
            exec("$cmd $this->outputFile", $out, $ret);
            if ($ret != 0)
                throw new Exception("Unable to apply final processing. Command: $cmd");
    
            // Cleanup
            if ($this->hasAlphaMask())
                unlink($mask);

            if ($this->outputFile != $intermediate)
                unlink($intermediate);

            unlink($grayscale);
            
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
    private function padImage ($width, $height, $x, $y) {
    	//if($this->isTile) {
		    		
	    // Determine min and max (i.e. outermost) tile numbers
        $imgNumTilesX = max(2, ceil($this->jp2RelWidth  / $this->subfieldWidth));
        $imgNumTilesY = max(2, ceil($this->jp2RelHeight / $this->subfieldHeight));
        
        // Tile placement architecture expects an even number of tiles along each dimension
        if ($imgNumTilesX % 2 != 0)
            $imgNumTilesX += 1;

        if ($imgNumTilesY % 2 != 0)
            $imgNumTilesY += 1;

        // Inner tiles are all tiles except the edge tiles (For four-tile case, all tiles are outer tiles)
		$numInnerTilesX = $imgNumTilesX - 2;
		$numInnerTilesY = $imgNumTilesY - 2;

 		$tileMinX = ($this->jp2Width - ($this->subfieldRelWidth  * $numInnerTilesX)) / 2;
		$tileMaxX = ($this->jp2Width + ($this->subfieldRelWidth  * $numInnerTilesX)) / 2;     
		$tileMinY = ($this->jp2Height - ($this->subfieldRelHeight * $numInnerTilesY)) / 2; 
		$tileMaxY = ($this->jp2Height + ($this->subfieldRelHeight * $numInnerTilesY)) / 2;
		
//		print "x: $x<br> y: $y<br> imgNumTilesX: $imgNumTilesX<br> imgNumTilesY: $imgNumTilesY<br>";
//		print "tileMinX: $tileMinX, tileMinY: $tileMinY<br>tileMaxX: $tileMaxX, tileMaxY: $tileMaxY";
//		exit();
		
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
		//}
	
		/* 
		 * If the item is a subfieldImage, it is assumed that the overall picture is larger than, but contains this image.
		 * The image has a heliocentric offset and will be padded with that offset. 
		 */
//		else {
//			$gravity = "NorthWest";
//			// Offset the image from the center using the heliocentric offset
//			$offset  = $this->hcOffset["x"] . $this->hcOffset["y"] . " ";
//		}cmd;
//			exit();

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