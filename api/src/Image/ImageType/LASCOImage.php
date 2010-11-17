<?php 
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Image_ImageType_LASCOImage class definition
 * There is one xxxImage for each type of detector Helioviewer supports.
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Jaclyn Beck <jaclyn.r.beck@gmail.com>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once 'src/Image/HelioviewerImage.php';
/**
 * Image_ImageType_LASCOImage class definition
 * There is one xxxImage for each type of detector Helioviewer supports.
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Jaclyn Beck <jaclyn.r.beck@gmail.com>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Image_ImageType_LASCOImage extends Image_HelioviewerImage
{
    protected $solarCenterOffsetX;
    protected $solarCenterOffsetY;
    
    /**
     * Constructor
     * 
     * @param string $jp2          Source JP2 image
     * @param array  $roi          Top-left and bottom-right pixel coordinates on the image
     * @param float  $desiredScale Desired scale of the output image
     * @param string $detector     Detector
     * @param string $measurement  Measurement
     * @param int    $offsetX      Offset of the sun center from the image center
     * @param int    $offsetY      Offset of the sun center from the iamge center
     * @param string $outputFile   Filepath to where the final image will be stored
     * @param int    $opacity      The opacity of the image from 0 to 100
     * @param bool   $compress     Whether to compress the image after extracting or not (true for tiles)
     */    
    public function __construct($jp2, $outputFile, $roi, $inst, $det, $meas, $offsetX, $offsetY, $options)
    {
        if ($det == "C2") {
            $colorTable = HV_ROOT_DIR . "/api/resources/images/color-tables/Red_Temperature.png";
        } else if ($det == "C3") {
            $colorTable = HV_ROOT_DIR . "/api/resources/images/color-tables/Blue_White_Linear.png";
        }
        
        if (file_exists($colorTable)) {
            $this->setColorTable($colorTable);
        }

        $this->solarCenterOffsetX = $offsetX;
        $this->solarCenterOffsetY = $offsetY;
        
        parent::__construct($jp2, $outputFile, $roi, $inst, $det, $meas, $offsetX, $offsetY, $options);
    }
    
    /**
     * Gets a string that will be displayed in the image's watermark
     * 
     * @return string watermark name
     */    
    public function getWaterMarkName() 
    {
        return "LASCO $this->detector\n";
    }

    /**
     * Generates a portion of an ImageMagick convert command to apply an alpha mask
     * 
     * Note: More accurate values for radii used to generate the LASCO C2 & C3 alpha masks:
     *  rocc_outer = 7.7;   // (.9625 * orig)
     *  rocc_inner = 2.415; // (1.05 * orig)
     *  
     *  LASCO C2 Image Scale
     *      $lascoC2Scale = 11.9;
     *  
     *  Solar radius in arcseconds, source: Djafer, Thuillier and Sofia (2008)
     *      $rsunArcSeconds = 959.705;
     *      $rsun           = $rsunArcSeconds / $lascoC2Scale; 
     *                      = 80.647 // Previously, used hard-coded value of 80.814221
     *                      
     *  Generating the alpha masks:
     *      $rocc_inner = 2.415;
     *      $rocc_outer = 7.7;
     *
     *      // convert to pixels
     *      $radius_inner = $rocc_inner * $rsun;
     *      $radius_outer = $rocc_outer * $rsun;
     *      $innerCircleY = $crpix2 + $radius_inner;
     *      $outerCircleY = $crpix2 + $radius_outer;
     *
     *      exec("convert -size 1024x1024 xc:black -fill white -draw \"circle $crpix1,$crpix2 $crpix1,$outerCircleY\"
     *          -fill black -draw \"circle $crpix1,$crpix2 $crpix1,$innerCircleY\" +antialias LASCO_C2_Mask.png")
     *
     *  Masks have been pregenerated and stored in order to improve performance.
     *  
     *  Note on offsets:
     *  
     *   The original CRPIX1 and CRPIX2 values used to determine the location of the center of the sun in the image
     *   are specified with respect to a bottom-left corner origin. The values passed in to this method from the tile
     *   request, however, specify the offset with respect to a top-left corner origin. This simply makes things
     *   a bit easier since ImageMagick also treats images as having a top-left corner origin.
     *   
     *  Region of interest:
     *  
     *    The region of interest (ROI) below is specified at the original JP2 image scale.
     *
     * @param Object &$imagickImage an initialized Imagick object
     *
     * @return void
     */
    protected function setAlphaChannel(&$imagickImage)
    {
        $maskWidth  = 1040;
        $maskHeight = 1040;
        $mask       = HV_ROOT_DIR . "/api/resources/images/alpha-masks/LASCO_{$this->detector}_Mask.png";

        if ($this->reduce > 0) {
            $maskScaleFactor = 1 / pow(2, $this->reduce);
        } else {
            $maskScaleFactor = 1;
        }

        $maskTopLeftX = ($this->imageSubRegion['left'] + 
                        ($maskWidth  - $this->jp2->getWidth()) /2 - $this->solarCenterOffsetX) * $maskScaleFactor;
        $maskTopLeftY = ($this->imageSubRegion['top']  + 
                        ($maskHeight - $this->jp2->getHeight())/2 - $this->solarCenterOffsetY) * $maskScaleFactor;

        $width  = $this->subfieldWidth  * $maskScaleFactor;
        $height = $this->subfieldHeight * $maskScaleFactor;

        // $maskTopLeft coordinates cannot be negative when cropping, so if they are, adjust the width and height
        // by the negative offset and crop with zero offsets. Then put the image on the properly-sized image
        // and offset it correctly.
        $cropWidth  = round($width  + min($maskTopLeftX, 0));
        $cropHeight = round($height + min($maskTopLeftY, 0));

        $mask  = new IMagick($mask);
        
        // Imagick floors pixel values but they need to be rounded up or down.
        // Rounding cannot be done in the previous lines of code because some addition needs to take place first.
        $maskTopLeftX = round($maskTopLeftX);
        $maskTopLeftY = round($maskTopLeftY);
        $width  = round($width);
        $height = round($height);
        
        $mask->scaleImage($maskWidth * $maskScaleFactor, $maskHeight * $maskScaleFactor);
        $mask->cropImage($cropWidth, $cropHeight, max($maskTopLeftX, 0), max($maskTopLeftY, 0));
        $mask->resetImagePage("{$width}x{$height}+0+0");

        $mask->setImageBackgroundColor('black');
        $mask->extentImage($width, $height, $width - $cropWidth, $height - $cropHeight);

        $imagickImage->setImageExtent($width, $height);
        $imagickImage->compositeImage($mask, IMagick::COMPOSITE_COPYOPACITY, 0, 0);

        if ($this->opacity < 100) {
            $mask->negateImage(true);
        
            $imagickImage->setImageClipMask($mask);
            $imagickImage->setImageOpacity($this->opacity / 100);
            $imagickImage->setImageFilename(substr($this->outputFile, 0, -4) . "-op" . $this->opacity . ".png");
        }

        $mask->destroy();
    }
}