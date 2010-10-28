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
 * @author   Jaclyn Beck <jaclyn.r.beck@gmail.com>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require 'JPEG2000/JP2Image.php';
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
 * @author   Jaclyn Beck <jaclyn.r.beck@gmail.com>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Image_SubFieldImage
{
    protected $sourceJp2;
    protected $outputFile;
    protected $roi;
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
    protected $compress;

    /**
     * Creates an Image_SubFieldImage instance
     *
     * @param string $jp2          Original JP2 image from which the subfield should be derrived
     * @param array	 $roi          Subfield region of interest
     * @param int    $jp2Width     Width of the JP2 image at it's natural resolution
     * @param int    $jp2Height    Height of the JP2 image at it's natural resolution
     * @param float  $jp2Scale     Pixel scale of the original JP2 image
     * @param float  $desiredScale The requested pixel scale that the subfield image should generated at
     * @param string $outputFile   Location to output the subfield image to
     * @param float  $offsetX      Offset of the center of the sun from the center of the image on the x-axis
     * @param float  $offsetY      Offset of the center of the sun from the center of the image on the y-axis
     * @param int    $opacity      The opacity of the image from 0 to 100
     * @param bool   $compress     Whether to compress the image after extracting or not (true for tiles)
     *
     * @TODO: Add optional parameter "noResize" or something similar to allow return images
     * which represent the same region, but may be at a different scale (e.g. tiles). The normal
     * case (for movies, etc) would be to resize to the requested scale on the server-side.
     *
     * @TODO: Rename "jp2scale" syntax to "nativeImageScale" to get away from JP2-specific terminology
     *        ("desiredScale" -> "desiredImageScale" or "requestedImageScale")
      */
    public function __construct($jp2, $roi, $jp2Width, $jp2Height, $jp2Scale, $desiredScale, 
        $outputFile, $offsetX, $offsetY, $opacity, $compress
    ) {
        $this->outputFile = $outputFile;
        $this->sourceJp2  = new Image_JPEG2000_JP2Image($jp2, $jp2Width, $jp2Height, $jp2Scale);
        $this->roi        = $roi;

        $this->jp2Width  = $jp2Width;
        $this->jp2Height = $jp2Height;
        $this->jp2Scale  = $jp2Scale;
        $this->subfieldWidth  = $roi["right"] - $roi["left"];
        $this->subfieldHeight = $roi["bottom"] - $roi["top"];

        $this->desiredScale    = $desiredScale;
        $this->desiredToActual = $desiredScale / $jp2Scale;
        $this->scaleFactor     = log($this->desiredToActual, 2);
        $this->reduce          = max(0, floor($this->scaleFactor));

        $this->subfieldRelWidth  = $this->subfieldWidth  / $this->desiredToActual;
        $this->subfieldRelHeight = $this->subfieldHeight / $this->desiredToActual;
        
        $this->jp2RelWidth  = $jp2Width  /  $this->desiredToActual;
        $this->jp2RelHeight = $jp2Height /  $this->desiredToActual;
        
        $this->offsetX = $offsetX;
        $this->offsetY = $offsetY;
        $this->opacity = $opacity;
        
        $this->compress = $compress;
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
        /*if (!($padding && ($padding['width'] > $this->width))) {
            $this->setSkipResize(true);
        }*/
    }
    
    /**
     * Saves the new filepath
     * 
     * @param string $filepath The new file path to the image
     * 
     * @return void
     */
    public function setNewFilePath($filepath)
    {
        $this->outputFile = $filepath;
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
    
    /**
     * Gets the extracted image's relative width
     * 
     * @return int subfieldRelWidth
     */
    public function subfieldRelWidth()
    {
        return $this->subfieldRelWidth;
    }
    
    /**
     * Gets the extracted image's relative height
     * 
     * @return int subfieldRelHeight
     */    
    public function subfieldRelHeight()
    {
        return $this->subfieldRelHeight;
    }
    
    /**
     * Figures out where the extracted image lies inside the final image
     * if the final image is larger.
     * 
     * @param Array $roi   The region of interest in arcseconds of the final image.
     * @param Float $scale The scale of the image in arcseconds / pixel
     * 
     * @return array with padding
     */
    public function computePadding($roi, $scale)
    {
        $width  = ($roi['right']  - $roi['left']) / $scale;
        $height = ($roi['bottom'] - $roi['top'])  / $scale;

        $centerX = $this->jp2Width  / 2 + $this->offsetX;
        $centerY = $this->jp2Height / 2 + $this->offsetY;
        
        $leftToCenter = ($this->roi['left'] - $centerX);
        $topToCenter  = ($this->roi['top']  - $centerY);
        $scaleFactor  = $this->jp2Scale / $scale;
        $relLeftToCenter = $leftToCenter * $scaleFactor;
        $relTopToCenter  = $topToCenter  * $scaleFactor;

        $left = ($roi['left'] / $scale) - $relLeftToCenter;
        $top  = ($roi['top']  / $scale) - $relTopToCenter;

        // Rounding to prevent inprecision during later implicit integer casting (Imagick->extentImage)
        // http://www.php.net/manual/en/language.types.float.php#warn.float-precision
        return array(
           "gravity" => "northwest",
           "width"   => round($width),
           "height"  => round($height),
           "offsetX" => ($left < 0.001 && $left > -0.001)? 0 : round($left),
           "offsetY" => ($top  < 0.001 && $top  > -0.001)? 0 : round($top)
        );
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
            $input = substr($this->outputFile, 0, -3) . "pgm";

            // Extract region (PGM)
            $this->sourceJp2->extractRegion($input, $this->roi, $this->reduce);

            // Convert to GD-readable format
            $grayscale = new IMagick($input);
            $grayscale->setImageFormat('PNG');
            $grayscale->setImageType(IMagick::IMGTYPE_GRAYSCALE); 
            $grayscale->setImageDepth(8);
            $grayscale->setImageCompressionQuality(10);
            
            $grayscaleString = $grayscale->getimageblob();

            // Clean up grayscale image
            $grayscale->destroy();
            unlink($input);

            // Apply color table
            $coloredImageString = $this->setColorPalette($grayscaleString);
            
            $coloredImage = new IMagick();        
            $coloredImage->readimageblob($coloredImageString);
            
            $this->setAlphaChannel($coloredImage);
            $this->compressImage($coloredImage);
            
            // Resize extracted image to correct size before padding.
            $coloredImage->resizeImage(round($this->subfieldRelWidth), round($this->subfieldRelHeight), IMagick::FILTER_TRIANGLE, 0.6);
            $coloredImage->setImageBackgroundColor('transparent');
            
            // Places the current image on a larger field of black if the final image is larger than this one
            $coloredImage->extentImage($this->padding['width'], $this->padding['height'], -$this->padding['offsetX'], -$this->padding['offsetY']);
            
            /* 
             * Need to extend the time limit that writeImage() can use so it doesn't throw fatal errors when movie frames are being made.
             * It seems that even if this particular instance of writeImage doesn't take the full time frame, if several instances of it are
             * running PHP will complain.  
             */
            //set_time_limit(60);
            
            $coloredImage->writeImage($this->outputFile);
            $coloredImage->destroy();

        } catch(Exception $e) {
            throw $e;
                      
            //Clean-up and exit
            $this->_abort($this->outputFile);
        }
    }
    

    /**
     * Sets compression for images that are not ImageLayers
     * 
     * @param Object &$imagickImage An initialized Imagick object
     * 
     * @return void
     */
    protected function compressImage(&$imagickImage)
    {
        if (!$this->compress) {
            return;
        }
        
        // Get extension
        $parts = explode(".", $this->outputFile);
        $extension = end($parts);

        // Apply compression based on image type
        if ($extension === "png") {
            $imagickImage->setImageCompression(IMagick::COMPRESSION_LZW);
            $imagickImage->setImageCompressionQuality(HV_PNG_COMPRESSION_QUALITY);
            $imagickImage->setInterlaceScheme(IMagick::INTERLACE_PLANE);
        } elseif ($extension === "jpg") {
            $imagickImage->setImageCompression(IMagick::COMPRESSION_JPEG);
            $imagickImage->setImageCompressionQuality(HV_JPEG_COMPRESSION_QUALITY);
            $imagickImage->setInterlaceScheme(IMagick::INTERLACE_LINE);
        }
        
        $imagickImage->setImageDepth(HV_BIT_DEPTH);
    }
    
    /**
     * Default behavior for images is to just set their opacity.
     * LASCOImage.php has a applyAlphaMaskCmd that overrides this one and applies
     * an alpha mask and does some special commands for opacity
     * 
     * @param Object &$imagickImage IMagick Object
     * 
     * @return string
     */
    protected function setAlphaChannel(&$imagickImage)
    {
        $imagickImage->setImageOpacity($this->opacity / 100);
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

        die();
    }

    /**
     * Applies the specified color lookup table to the image using GD
     * Override this in any ImageType class that doesn't have a color
     * table, i.e. MDI and AIA (for now)
     *
     * Note: input and output are usually the same file.
     *
     * @param string &$input  Location of input image
     *
     * @return String binary string representation of image after processing
     */    
    protected function setColorPalette(&$input)
    {	
        $clut = $this->colorTable;

        // Read in image string
        $gd = imagecreatefromstring($input);

        if (!$gd) {
            throw new Exception("Unable to apply color-table: $input is not a valid image.");
        }

        $ctable = imagecreatefrompng($clut);

        // Apply color table
        for ($i = 0; $i <= 255; $i++) {
            $rgb = imagecolorat($ctable, 0, $i);
            $r = ($rgb >> 16) & 0xFF;
            $g = ($rgb >> 8) & 0xFF;
            $b = $rgb & 0xFF;
            imagecolorset($gd, $i, $r, $g, $b);
        }

        // Write new image string
        ob_start();

        imagepng($gd, NULL);
        $blob = ob_get_contents();
        
        ob_end_clean();

        // Clean up
        imagedestroy($gd);
        imagedestroy($ctable);
            
        return $blob;
    }

    /**
     * Displays the image on the page
     *
     * @return void
     */
    public function display()
    {
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

            // Set content-type
            $fileinfo = new finfo(FILEINFO_MIME);
            $mimetype = $fileinfo->file($this->outputFile);
            header("Content-type: " . $mimetype);

            // Filename & Content-length
            $filename = basename($this->outputFile);
            
            header("Content-Disposition: inline; filename=\"$filename\"");
            
            if (!readfile($this->outputFile)) {
                throw new Exception("Unable to read tile from cache: $filename");
            }

        }
    }
}
?>