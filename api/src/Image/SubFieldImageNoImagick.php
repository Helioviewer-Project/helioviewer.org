<?php
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Image_SubFieldImageNoImagick class definition
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
require_once 'SubfieldImage.php';
/**
 * Represents a JPEG 2000 sub-field image.
 *
 * The SubFieldImage class provides functionality for outputting a sub-section of a JPEG 2000
 * image (possibly the entire image) in a common format such as JPEG or PNG. Color tables and alpha
 * masks can also be applied at this level.
 * 
 * This class uses command-line ImageMagick instead of PHP IMagick and can be used instead of 
 * SubFieldImage in case IMagick doesn't work. 
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
class Image_SubFieldImageNoImagick extends Image_SubFieldImage
{
    /**
     * Creates an Image_SubFieldImageNoImagick instance
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
     * @param float  $offsetX      Offset of the center of the sun from the center of the image on the x-axis
     * @param float  $offsetY      Offset of the center of the sun from the center of the image on the y-axis
     * 
     * @TODO: Add optional parameter "noResize" or something similar to allow return images
     * which represent the same region, but may be at a different scale (e.g. tiles). The normal
     * case (for movies, etc) would be to resize to the requested scale on the server-side.
     *
     * @TODO: Rename "jp2scale" syntax to "nativeImageScale" to get away from JP2-specific terminology
     *        ("desiredScale" -> "desiredImageScale" or "requestedImageScale")
     */
    public function __construct($sourceJp2, $date, $roi, $format, $jp2Width, $jp2Height, $jp2Scale, $desiredScale, 
        $outputFile, $offsetX, $offsetY, $compress
    ) {
        parent::__construct(
            $sourceJp2, $date, $roi, $format, $jp2Width, $jp2Height, $jp2Scale, $desiredScale, 
            $outputFile, $offsetX, $offsetY, $compress
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
            $grayscale    = substr($this->outputFile, 0, -3) . "pgm";
            $intermediate = substr($this->outputFile, 0, -3) . "png";

            // Extract region (PGM)
            $this->sourceJp2->extractRegion($grayscale, $this->roi, $this->reduce);

            // Generate GD-readable grayscale image (PNG)
            $toIntermediateCmd = HV_PATH_CMD . "convert $grayscale -depth 8 -quality 10 -type Grayscale $intermediate";
            exec(escapeshellcmd($toIntermediateCmd));

            //Apply color-lookup table
            // Override setColorPalette in MDIImage and AIAImage, which have no color tables.
            $this->_setColorPalette($intermediate, $this->colorTable, $intermediate);

            $this->applyAlphaMaskCmdNoImagick($intermediate);
            $cmd = HV_PATH_CMD . " convert $intermediate -background black ";

            // Compression settings & Interlacing
            $cmd .= $this->setImageParams();
            
            // Resize extracted image to correct size before padding.
            $cmd .= "-resize {$this->subfieldRelWidth}x{$this->subfieldRelHeight} ";

            $cmd .= $this->_getPaddingString();
            
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
     * Default behavior for images with no alpha mask is to do nothing. Overridden in
     * LASCOImage to apply the alpha mask.
     * 
     * @param string $intermediate The filepath to the intermediate image.
     * 
     * @return void
     */
    protected function applyAlphaMaskNoImagick($intermediate)
    {
        return;
    }
    
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
     * Set Image Parameters
     *
     * @return string Image compression and quality related flags.
     */
    protected function setImageParams()
    {
        if (!$this->compress) {
            return "";
        }
        $args = " -quality ";
        if ($this->format == "png") {
            $args .= HV_PNG_COMPRESSION_QUALITY . " -interlace plane -colors " . HV_NUM_COLORS;
        } else {
            $args .= HV_JPEG_COMPRESSION_QUALITY . " -interlace line";
        }
        $args .= " -depth " . HV_BIT_DEPTH . " ";

        return $args;
    }
}
?>