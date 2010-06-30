<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Image_SubFieldImage class definition
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @author   Jaclyn Beck <jabeck@nmu.edu>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require 'JPEG2000/JP2Image.php';
require_once 'ImageMetaInformation.php';
/**
 * Represents a JPEG 2000 sub-field image.
 *
 * The SubFieldImage class provides functionality for outputting a sub-section of a JPEG 2000
 * image (possibly the entire image) in a common format such as JPEG or PNG. Color tables and alpha
 * masks can also be applied at this level.
 * 
 * @TODO Switch to using a single "optional" array passed to initialize for color table, padding, etc?
 *
 * @category Image
 * @package  Helioviewer
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @author   Jaclyn Beck <jabeck@nmu.edu>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Image_SubFieldImage
{
    /**
    protected $subfieldFile; //image
    protected $subfieldWidth; //imageWidth
    protected $subfieldHeight;
    protected $subfieldRelWidth; //imageRelWidth ... = $this->imageWidth  * $this->desiredToActual;
    protected $subfieldRelHeight;
    protected $region; // {top: , left: , bottom: , right: }
    **/
    protected $metaInfo;
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
    protected $jp2Width; // temporarily public
    protected $jp2Height;
    protected $jp2RelWidth;
    protected $jp2RelHeight;
    protected $alphaMask  = false;
    protected $colorTable = false;
    protected $padding    = false;
    protected $skipResize = false;

    /**
     * Creates an Image_SubFieldImage instance
     *
     * @param string $sourceJp2    Original JP2 image from which the subfield should be derrived
     * @param date   $date         The timestamp of the image
     * @param array	 $roi          Subfield region of interest
     * @param string $format       File format to use when saving the subfield image
     * @param int    $jp2Width     Width of the JP2 image at it's natural resolution
     * @param int    $jp2Height    Height of the JP2 image at it's natural resolution
     * @param float  $jp2Scale     Pixel scale of the original JP2 image
     * @param float  $desiredScale The requested pixel scale that the subfield image should generated at
     * @param string $outputFile   Location to output the subfield image to
     * 
     * @TODO: Add optional parameter "noResize" or something similar to allow return images
     * which represent the same region, but may be at a different scale (e.g. tiles). The normal
     * case (for movies, etc) would be to resize to the requested scale on the server-side.
     *
     * @TODO: Rename "jp2scale" syntax to "nativeImageScale" to get away from JP2-specific terminology
     *        ("desiredScale" -> "desiredImageScale" or "requestedImageScale")
      */
    public function __construct($sourceJp2, $date, $roi, $format, $jp2Width, $jp2Height, $jp2Scale, $desiredScale, 
        $outputFile, $offsetX, $offsetY
    ) {
        $this->outputFile = $outputFile;
        $this->sourceJp2  = new Image_JPEG2000_JP2Image($sourceJp2, $jp2Width, $jp2Height, $jp2Scale);
        $this->roi        = $roi;
        $this->format     = $format;

        $this->jp2Width  = $jp2Width;
        $this->jp2Height = $jp2Height;
        $this->jp2Scale  = $jp2Scale;
        $this->subfieldWidth  = $roi["right"] - $roi["left"];
        $this->subfieldHeight = $roi["bottom"] - $roi["top"];

        $this->desiredScale    = $desiredScale;
        $this->desiredToActual = $desiredScale / $jp2Scale;
        $this->scaleFactor     = log($this->desiredToActual, 2);
        $this->reduce          = max(0, floor($this->scaleFactor));

        $this->subfieldRelWidth  = round($this->subfieldWidth  / $this->desiredToActual);
        $this->subfieldRelHeight = round($this->subfieldHeight / $this->desiredToActual);

        $this->jp2RelWidth  = $jp2Width  /  $this->desiredToActual;
        $this->jp2RelHeight = $jp2Height /  $this->desiredToActual;
        
        $this->offsetX = $offsetX;
        $this->offsetY = $offsetY;
    }
    
    /**
     * Called by classes that may not have direct access to protected function buildImage.
     * Change buildImage to buildImageNoImagick() to use command-line calls instead of imagick.
     * 
     * @return void
     */
    public function build() 
    {
        $this->buildImage();
    }
    
    /**
     * Returns the image's region of interest in pixels
     * 
     * @return array roi
     */
    public function ROI()
    {
    	return $this->roi;
    }

    /**
     * Sets parameters (gravity and size) for any padding which should be applied to extracted subfield image
     * 
     * @param array $padding An associative array containing the width,height, and gravity values to use during padding.
     * 
     * @return void
     */
    public function setPadding($padding) 
    { 
        $this->padding = $padding;
        //Allow browser to rescale tiles which are not larger than the requested size
        if (!($padding && ($padding['width'] > $this->width))) {
            $this->setSkipResize(true);
        }
    }
    
    /**
     * Gets the SubfieldImage's output file
     * 
     * @return string outputFile
     */
    public function outputFile() 
    {
        return $this->outputFile;
    }

    /**
     * Getters that are needed for determining padding, as they must be accessed from Tile or ImageLayer classes.
     * 
     * @return int jp2RelWidth
     */
    public function jp2RelWidth() 
    {
        return $this->jp2RelWidth;
    }
    
    /**
     * Gets the jp2 image's relative height
     * 
     * @return int jp2RelHeight
     */
    public function jp2RelHeight() 
    {
        return $this->jp2RelHeight;
    }
    
    public function subfieldRelWidth()
    {
    	return $this->subfieldRelWidth;
    }
    
    public function subfieldRelHeight()
    {
    	return $this->subfieldRelHeight;
    }
    
    public function computePadding($roi, $scale)
    {
        $width  = ($roi['right']  - $roi['left']) / $scale;
        $height = ($roi['bottom'] - $roi['top'])  / $scale;
        
        $centerX = $this->jp2Width  / 2 + $this->offsetX;
        $centerY = $this->jp2Height / 2 + $this->offsetY;
        
        $leftToCenter = ($this->roi['left'] - $centerX);
        $topToCenter  = ($this->roi['top']  - $centerY);
        $scaleFactor = $this->jp2Scale / $scale;
        $relLeftToCenter = $leftToCenter * $scaleFactor;
        $relTopToCenter  = $topToCenter  * $scaleFactor;

        $left = $roi['left'] / $scale - $relLeftToCenter;
        $top  = $roi['top']  / $scale - $relTopToCenter;

        return array(
           "gravity" => "northwest",
           "width"   => $width,
           "height"  => $height,
           "offsetX" => ($left < 0.001 && $left > -0.001)? 0 : $left,
           "offsetY" => ($top  < 0.001 && $top  > -0.001)? 0 : $top
        );
    }
    
    /**
     * Gets the reduce factor (how much to scale the image)
     * 
     * @return int reduceFactor
     */
    public function reduceFactor() 
    {
        return $this->reduce;
    }
    
    /**
     * Builds the requested subfield image.
     *
     * Normalizing request & native image scales:
     * 
     * When comparing the requested or "desired" image scale for the subfield image to the native or "actual" image 
     * scale of the source image, it is convenient to create a variable called "desiredToActual" which represents
     * the ratio of the desired scale to the actual scale.
     * 
     * There are three possible cases which may occur:
     * 
     *     1) desiredToActual = 1
     *        
     *          In this case the subfield requested is at the natural image scale. No resizing is necessary.
     *     
     *     2) desiredToActual < 1
     * 
     *          The subfield requested is at a lower image scale (HIGHER quality) than the source JP2.
     *          
     *     3) desiredToActual > 1
     *     
     *          The subfield requested is at a higher image scale (LOWER quality) than the source JP2.
     *         
     * @TODO: Normalize quality scale.
     * 
     * @TODO: Create a cleanup array with names of files to be wiped after processing is complete?
     * @TODO: Move generation of intermediate file to separate method
     *
     * @return void
     */
    protected function buildImage()
    {
        try {
            $grayscale    = substr($this->outputFile, 0, -3) . "pgm";
            $intermediate = substr($this->outputFile, 0, -3) . "png";

            // Extract region (PGM)
            $this->sourceJp2->extractRegion($grayscale, $this->roi, $this->reduce);

            $image = new IMagick($grayscale);
            $image->setImageFormat('PNG'); 
            $image->setImageDepth(8);
            $image->setImageType(IMagick::IMGTYPE_GRAYSCALE);
            $image->writeImage($intermediate);
            $image->destroy();

            //Apply color-lookup table
            //if ($this->colorTable && ($_GET["det"] != "AIA")) {
            if ($this->colorTable) {
                $this->_setColorPalette($intermediate, $this->colorTable, $intermediate);
            }
            
            $this->getAlphaMaskCmd($intermediate);

            $image = new IMagick($intermediate);
            if ($this->format === "png")
            {
                //$image->setCompressionQuality(HV_PNG_COMPRESSION_QUALITY);
                $image->setImageInterlaceScheme(IMagick::INTERLACE_PLANE);
            } else {
            	$image->setCompressionQuality(HV_JPEG_COMPRESSION_QUALITY);
            	$image->setImageInterlaceScheme(IMagick::INTERLACE_LINE);
            }

            $image->setImageDepth(HV_BIT_DEPTH);

            // Resize extracted image to correct size before padding.
            $image->scaleImage($this->subfieldRelWidth, $this->subfieldRelHeight);

            if ($this->padding) {
            	if ($this->hasAlphaMask()) {
            		$image->setImageBackgroundColor('transparent');
            	} else {
                    $image->setImageBackgroundColor('black');
            	}
                // Places the current image on a larger field of black if the final image is larger than this one
                $image->extentImage($this->padding['width'], $this->padding['height'], -$this->padding['offsetX'], -$this->padding['offsetY']);
            }

            /* 
             * Need to extend the time limit that writeImage() can use so it doesn't throw fatal errors when movie frames are being made.
             * It seems that even if this particular instance of writeImage doesn't take the full time frame, if several instances of it are
             * running PHP will complain.  
             * 
             * NOTE: This extra writeImage() on LASCO images adds superfluous time to execution. Need to move this or don't set compression
             * when building movies. 
             */
            set_time_limit(60);
            $image->writeImage($this->outputFile);
            $image->destroy();

            if ($this->outputFile != $intermediate) {
                unlink($intermediate);
            }

            unlink($grayscale);

        } catch(Exception $e) {
            logErrorMsg($e->getMessage(), true);
                      
            //Clean-up and exit
            $this->_abort($this->outputFile);
        }
    }
    
    /**
     * Does the same as buildImage() but with command-line commands instead of imagick.
     * 
     * @return void
     */
    protected function buildImageNoImagick()
    {
            try {
            $grayscale    = substr($this->outputFile, 0, -3) . "pgm";
            $intermediate = substr($this->outputFile, 0, -3) . "png";

            // Extract region (PGM)
            $this->sourceJp2->extractRegion($grayscale, $this->roi, $this->reduce);

            // Generate GD-readable grayscale image (PNG)
            $toIntermediateCmd = HV_PATH_CMD . "convert $grayscale -depth 8 -quality 10 -type Grayscale $intermediate";
            exec(escapeshellcmd($toIntermediateCmd));

            //Apply color-lookup table
            //if ($this->colorTable && ($_GET["det"] != "AIA")) {
            if ($this->colorTable) {
                $this->_setColorPalette($intermediate, $this->colorTable, $intermediate);
            }

            $this->getAlphaMaskCmd($intermediate);
            $cmd = HV_PATH_CMD . " convert $intermediate -background black ";

            // Compression settings & Interlacing
            $cmd .= $this->setImageParams();

            // Screenshots need to be resized before padding, tiles need to be resized after.
            if (!isset($this->tileSize) && !$this->hasAlphaMask()) {
                $cmd .= "-resize {$this->subfieldRelWidth}x{$this->subfieldRelHeight} ";
            }

            if ($this->padding && !$this->hasAlphaMask()) {
                $cmd .= $this->_getPaddingString();
            }

            // 02/23/10
            // ONLY WANT TO RESIZE DOWN TO 512x512 WHEN IMAGE IS BIGGER (Same numbers used in padding last step tell
            // you how big tile is at this point).
            //if (!$this->skipResize) {
            //    $cmd .= " -resize {$this->subfieldRelWidth}x{$this->subfieldRelHeight}! ";    
            //}
            // For resize to match requested tilesize. Once a suitable solution is found to improve rendering of
            // client-side rescaled tiles, this can be removed (02/26/2010)
            if(isset($this->tileSize))
                $cmd .= " -resize {$this->tileSize}x{$this->tileSize}!";
                
            //var_dump($this);
            //die (escapeshellcmd("$cmd $this->outputFile"));

            // Execute command
            exec(escapeshellcmd("$cmd $this->outputFile"), $out, $ret);


            if ($ret != 0) {
                throw new Exception("Unable to build subfield image.\n\tCommand: $cmd $this->outputFile");
            }

            if ($this->outputFile != $intermediate) {
                unlink($intermediate);
            }

            unlink($grayscale);

        } catch(Exception $e) {
            logErrorMsg($e->getMessage(), true);
                      
            //Clean-up and exit
            $this->_abort($this->outputFile);
        }    	
    }
    
    /**
     * Default behavior for images is to just add a black background.
     * LASCOImage.php has a getAlphaMaskCmd that overrides this one and applies
     * an alpha mask instead.
     * $this->getAlphaMaskCmd($intermediate); 
     * @param string $intermediate pgm grayscale image
     * 
     * @return string partial command for imagemagick
     */
    protected function getAlphaMaskCmd($intermediate)
    {
        return $intermediate . " -background black ";
    }

    /**
     * Sets the subfield image color lookup table (CLUT)
     *
     * @param string $clut Location of the lookup table to use
     *
     * @return void
     */
    protected function setColorTable($clut)
    {
        $this->colorTable = $clut;
    }
    
    /**
     * Sets the tile size
     * 
     * @param int $size the desired width of the square tile
     * 
     * @return void
     */
    public function setTileSize($size) 
    {
        $this->tileSize = $size;
    }
    
    /**
     * Set true to skip final resizing and return unscaled subfield image
     * 
     * @param bool $value Whether or not the resizing step should be skipped
     * 
     * @return void
     */
    protected function setSkipResize($value)
    {
        $this->skipResize = $value;
    }

    /**
     * Enable/Disable alpha mask support
     *
     * @param string $value Locatation of the base image to use for an alpha mask
     *
     * @return void
     */
    protected function setAlphaMask($value)
    {
        $this->alphaMask = $value;
    }
    

    /* protected function setPadding($padding)
    {
        $this->padding = $padding;
    }
    */   
    /**
     * Returns a string formatted for ImageMagick which defines how an image should be padded
     * 
     * @see http://www.imagemagick.org/Usage/thumbnails/#pad
     * 
     * @return string 
     */
    private function _getPaddingString()
    {
        return "-gravity {$this->padding['gravity']} -extent {$this->padding['width']}x{$this->padding['height']}{$this->padding['offsetX']}{$this->padding['offsetY']}";
    }

    /**
     * Returns true if the image has an associated alpha mask
     *
     * @return bool Whether or not the subfield image uses an associated alpha mask for transparent regions.
     */
    protected function hasAlphaMask()
    {
        return $this->alphaMask;
    }

    /**
     * Set Image Parameters
     *
     * @return string Image compression and quality related flags.
     */
    protected function setImageParams()
    {
        $args = " -quality ";
        if ($this->format == "png") {
            $args .= HV_PNG_COMPRESSION_QUALITY . " -interlace plane -colors " . HV_NUM_COLORS;
        } else {
            $args .= HV_JPEG_COMPRESSION_QUALITY . " -interlace line";
        }
        $args .= " -depth " . HV_BIT_DEPTH . " ";

        return $args;
    }

    /**
     * Handles clean-up in case something goes wrong to avoid mal-formed tiles from being displayed
     *
     * @param string $filename Filename for aborted subfield image
     *
     * @TODO: Close any open IM/GD file handlers
     *
     * @return void
     */
    private function _abort($filename)
    {
        $pgm = substr($filename, 0, -3) . "pgm";
        $png = substr($filename, 0, -3) . "png";

        // Clean up
        if (file_exists($pgm)) {
            unlink($pgm);
        }
        if (file_exists($png)) {
            unlink($png);
        }
        if (file_exists($filename)) {
            unlink($filename);
        }

        if ($this->hasAlphaMask()) {
            $mask = substr($filename, 0, -4) . "-mask.tif";
            if (file_exists($mask)) {
                unlink($mask);
            }
        }

        die();
    }

    /**
     * Applies the specified color lookup table to the image using GD
     *
     * Note: input and output are usually the same file.
     *
     * @param string $input  Location of input image
     * @param string $clut   Location of the color lookup table to use
     * @param string $output Location to save new image to
     *
     * @return void
     */
 /*   private function _setColorPalette ($imagickImage, $clut, $output)
    {   
        $ctable = new IMagick($clut);
        $imagickImage->clutImage($ctable);
        $ctable->destroy();
    }*/
    
    private function _setColorPalette($input, $clut, $output)
    {	
        $gd = null;
        try {
            if (file_exists($input)) {
                $gd = imagecreatefrompng($input);
            } else {
                throw new Exception("Unable to apply color-table: $input does not exist.");
            }

            if (!$gd) {
                throw new Exception("Unable to apply color-table: $input is not a valid image.");
            }

        } catch(Exception $e) {
            logErrorMsg($e->getMessage(), true);
        }
        $ctable = imagecreatefrompng($clut);

        for ($i = 0; $i <= 255; $i++) {
            $rgba = imagecolorsforindex($ctable, $i);
            imagecolorset($gd, $i, $rgba["red"], $rgba["green"], $rgba["blue"]);
        }

        // Enable interlacing
        imageinterlace($gd, true);

        //$this->format == "jpg" ? imagejpeg($gd, $output, HV_JPEG_COMPRESSION_QUALITY) : imagepng($gd, $output);
        //if ($this->format == "jpg")
        //    imagejpeg($gd, $output, HV_JPEG_COMPRESSION_QUALITY);
        //else
        imagepng($gd, $output);

        // Cleanup
        if ($input != $output) {
            unlink($input);
        }
        imagedestroy($gd);
        imagedestroy($ctable);
    }

    /**
     * Displays the image on the page
     *
     * @return void
     */
    public function display()
    {
        try {
            //header("Cache-Control: public, max-age=" . $lifetime * 60);
            $headers = apache_request_headers();
            
            // Enable caching of images served by PHP
            // http://us.php.net/manual/en/function.header.php#61903
            $lastModified = 'Last-Modified: '.gmdate('D, d M Y H:i:s', filemtime($this->outputFile)).' GMT';
            if (isset($headers['If-Modified-Since']) && (strtotime($headers['If-Modified-Since']) == filemtime($this->outputFile))) {
                // Cache is current (304)
                header($lastModified, true, 304);    
            } else {
                // Image not in cache or out of date (200)
                header($lastModified, true, 200);

                header('Content-Length: '.filesize($this->outputFile));

                if ($this->format == "png") {
                    header("Content-Type: image/png");
                } else {
                    header("Content-Type: image/jpeg");
                }

                // Filename & Content-length
                $exploded = explode("/", $this->outputFile);
                $filename = end($exploded);
                header("Content-Disposition: inline; filename=\"$filename\"");
                
                if (!readfile($this->outputFile)) {
                    throw new Exception("Unable to read tile from cache: $filename");
                }

            }
        } catch (Exception $e) {
            logErrorMsg($error, true);
        }
    }

    /**
     * Returns the image's width and height
     *
     * @param string $filename The image filepath
     *
     * @return array the width and height of the given image
     */
    protected function getImageDimensions($filename)
    {
        if (list($width, $height, $type, $attr) = getimagesize($filename)) {
            return array (
                'width'  => $width,
                'height' => $height
            );
        } else {
            $this->_abort($filename);
        }
    }
}
?>