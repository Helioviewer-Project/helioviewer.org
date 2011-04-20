<?php 
/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/**
 * Image_ImageType_CORImage class definition
 * There is one xxxImage for each type of detector Helioviewer supports.
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Jaclyn Beck <jaclyn.r.beck@gmail.com>
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
require_once 'src/Image/HelioviewerImage.php';
/**
 * Image_ImageType_CORImage class definition
 * There is one xxxImage for each type of detector Helioviewer supports.
 *
 * PHP version 5
 *
 * @category Image
 * @package  Helioviewer
 * @author   Jaclyn Beck <jaclyn.r.beck@gmail.com>
 * @author   Keith Hughitt <keith.hughitt@nasa.gov>
 * @license  http://www.mozilla.org/MPL/MPL-1.1.html Mozilla Public License 1.1
 * @link     http://launchpad.net/helioviewer.org
 */
class Image_ImageType_CORImage extends Image_HelioviewerImage
{
    /**
     * Creates a new CORImage
     * 
     * @param string $jp2      Source JP2 image
     * @param string $filepath Location to output the file to
     * @param array  $roi      Top-left and bottom-right pixel coordinates on the image
     * @param string $inst     Instrument
     * @param string $det      Detector
     * @param string $meas     Measurement
     * @param int    $offsetX  Offset of the sun center from the image center
     * @param int    $offsetY  Offset of the sun center from the iamge center
     * @param array  $options  Optional parameters
     * 
     * @return void
     */ 
    public function __construct($jp2, $filepath, $roi, $obs, $inst, $det, $meas, $offsetX, $offsetY, $options)
    {
        if ($det == "COR1") {
            $colorTable = HV_ROOT_DIR . "/api/resources/images/color-tables/Green-White_Linear.png";
        } else if ($det == "COR2") {
            $colorTable = HV_ROOT_DIR . "/api/resources/images/color-tables/Red_Temperature.png";
        }
        
        if (file_exists($colorTable)) {
            $this->setColorTable($colorTable);
        }
        
        $filepath = substr($filepath, 0, -3) . "png";

        parent::__construct($jp2, $filepath, $roi, $obs, $inst, $det, $meas, $offsetX, $offsetY, $options);
    }
    
    /**
     * Gets a string that will be displayed in the image's watermark
     * 
     * @return string Watermark name
     */    
    public function getWaterMarkName() 
    {
        return "SECCHI $this->detector\n";
    }

    /**
     * Generates a portion of an ImageMagick convert command to apply an alpha mask
     * 
     * Note: More accurate values for radii used to generate the COR C2 & C3 alpha masks:
     *  rocc_outer = 7.7;   // (.9625 * orig)
     *  rocc_inner = 2.415; // (1.05 * orig)
     *  
     *  COR C2 Image Scale
     *      $CORC2Scale = 11.9;
     *  
     *  Solar radius in arcseconds, source: Djafer, Thuillier and Sofia (2008)
     *      $rsunArcSeconds = 959.705;
     *      $rsun           = $rsunArcSeconds / $CORC2Scale; 
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
     *          -fill black -draw \"circle $crpix1,$crpix2 $crpix1,$innerCircleY\" +antialias COR_C2_Mask.png")
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
     * @param object $imagickImage an initialized Imagick object
     *
     * @return void
     */
    protected function setAlphaChannel(&$imagickImage)
    {
        if ($this->detector == "COR1") {
            $maskWidth  = 520;
            $maskHeight = 520;
        } else {
            $maskWidth  = 2080;
            $maskHeight = 2080;
        }
        
        $dir = HV_ROOT_DIR . "/api/resources/images/alpha-masks/";
        $which = substr($this->observatory, -1);
        $mask = sprintf("%s%s-%s_Mask.png", $dir, $this->detector, $which);
        
        if ($this->reduce > 0) {
            $maskScaleFactor = 1 / pow(2, $this->reduce);
        } else {
            $maskScaleFactor = 1;
        }

        $maskTopLeftX = ($this->imageSubRegion['left'] + 
                        ($maskWidth  - $this->jp2->getWidth()) /2 - $this->offsetX) * $maskScaleFactor;
        $maskTopLeftY = ($this->imageSubRegion['top']  + 
                        ($maskHeight - $this->jp2->getHeight())/2 - $this->offsetY) * $maskScaleFactor;

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

        if ($this->options['opacity'] < 100) {
            $mask->negateImage(true);
        
            $imagickImage->setImageClipMask($mask);
            $imagickImage->setImageOpacity($this->options['opacity'] / 100);
            //Mar 17,2011!!!
            //$imagickImage->setImageFilename($this->filepath . "-op" . $this->options['opacity'] . ".png");
        }

        $mask->destroy();
    }
}
